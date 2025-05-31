require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, writeBatch, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const REDDIT_CLIENT_ID = process.env.REACT_APP_REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REACT_APP_REDDIT_CLIENT_SECRET;
const REDDIT_USER_AGENT = process.env.REACT_APP_REDDIT_USER_AGENT;

let accessToken = null;

async function getRedditAccessToken() {
  if (accessToken) return accessToken;
  
  const auth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');
  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'User-Agent': REDDIT_USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  accessToken = data.access_token;
  console.log('🔑 Reddit access token obtained');
  return accessToken;
}

async function fetchRedditPosts(subreddit, type = 'hot', limit = 100, timeframe = '') {
  const token = await getRedditAccessToken();
  let url = `https://oauth.reddit.com/r/${subreddit}/${type}?limit=${limit}`;
  if (timeframe && type === 'top') {
    url += `&t=${timeframe}`;
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': REDDIT_USER_AGENT
    }
  });

  if (!response.ok) {
    console.log(`⚠️ Reddit API error for r/${subreddit}: ${response.status}`);
    return [];
  }

  const data = await response.json();
  return data.data.children.map(child => child.data);
}

async function getExistingPostIds(subreddit) {
  const q = query(collection(db, 'posts'), where('subreddit', '==', subreddit));
  const querySnapshot = await getDocs(q);
  const existingIds = new Set();
  querySnapshot.forEach((doc) => {
    existingIds.add(doc.data().id);
  });
  return existingIds;
}

async function fetchCommentsForPost(subreddit, postId) {
  try {
    const token = await getRedditAccessToken();
    const url = `https://oauth.reddit.com/r/${subreddit}/comments/${postId}?limit=5&sort=top`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': REDDIT_USER_AGENT
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    const commentsData = data[1]?.data?.children || [];
    
    return commentsData
      .filter(comment => 
        comment.data.body && 
        comment.data.body !== '[deleted]' && 
        comment.data.author !== 'AutoModerator'
      )
      .slice(0, 5)
      .map(comment => ({
        id: comment.data.id,
        author: comment.data.author,
        body: comment.data.body,
        score: comment.data.score,
        created_utc: comment.data.created_utc
      }));
  } catch (error) {
    console.log(`  ⚠️  Could not fetch comments: ${error.message}`);
    return [];
  }
}

function isQualityPost(post) {
  return (
    post.score >= 5 && // Very lenient for bridezilla content
    post.selftext && 
    post.selftext !== '[deleted]' && 
    post.selftext !== '[removed]' &&
    post.selftext.length > 50 &&
    !post.stickied &&
    !post.pinned
  );
}

async function scrapeBridezillaContent() {
  console.log('😈 BRIDEZILLA REPLACEMENT SCRAPER');
  console.log('═'.repeat(80));
  console.log('🎯 Mission: Get hilarious bridezilla stories from r/bridezilla!');
  console.log('📊 Target: 100 posts of bridezilla drama');
  console.log('💅 Replacement for inactive r/AmItheBridezilla');
  console.log('═'.repeat(80));
  
  const subredditName = 'bridezilla';
  
  try {
    const existingIds = await getExistingPostIds(subredditName);
    const newPosts = [];
    const targetPosts = 100;
    
    console.log(`\n💍 SCRAPING r/${subredditName} for bridezilla drama...`);
    console.log(`📊 Existing posts in DB: ${existingIds.size}`);
    console.log(`🎯 Target: ${targetPosts} posts`);
    console.log('─'.repeat(80));
    
    const strategies = [
      { type: 'hot', limit: 100, label: '🔥 HOT bridezilla posts' },
      { type: 'top', limit: 100, timeframe: 'week', label: '🏆 TOP of WEEK' },
      { type: 'top', limit: 100, timeframe: 'month', label: '🏆 TOP of MONTH' },
      { type: 'top', limit: 100, timeframe: 'year', label: '🏆 TOP of YEAR' },
      { type: 'top', limit: 100, timeframe: 'all', label: '🏆 TOP of ALL TIME' },
      { type: 'new', limit: 100, label: '🆕 NEW drama' }
    ];
    
    for (const strategy of strategies) {
      if (newPosts.length >= targetPosts) break;
      
      console.log(`\n${strategy.label} from r/${subredditName}...`);
      const posts = await fetchRedditPosts(subredditName, strategy.type, strategy.limit, strategy.timeframe);
      console.log(`   Found ${posts.length} posts to process`);
      
      let processed = 0;
      for (const post of posts) {
        if (newPosts.length >= targetPosts) break;
        if (existingIds.has(post.id) || !isQualityPost(post)) continue;
        
        console.log(`📝 Processing: "${post.title.substring(0, 60)}..." (${post.score} pts)`);
        
        const comments = await fetchCommentsForPost(subredditName, post.id);
        
        newPosts.push({
          id: post.id,
          title: post.title,
          body: post.selftext,
          author: post.author,
          subreddit: subredditName,
          url: `https://reddit.com${post.permalink}`,
          score: post.score,
          num_comments: post.num_comments,
          created_utc: post.created_utc,
          scraped_at: Date.now(),
          comments: comments
        });
        
        console.log(`✅ Collected ${newPosts.length}/${targetPosts} (Score: ${post.score}, Comments: ${comments.length})`);
        processed++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Show progress every 10 posts
        if (processed % 10 === 0) {
          console.log(`   📊 ${strategy.label}: ${newPosts.length}/${targetPosts} collected so far`);
        }
      }
      
      if (posts.length > 0) {
        console.log(`   📊 ${strategy.label}: ${newPosts.length}/${targetPosts} total collected`);
      }
    }
    
    // Save to Firestore
    if (newPosts.length > 0) {
      console.log(`\n💾 Saving ${newPosts.length} bridezilla posts to Firestore...`);
      
      const batchSize = 50;
      for (let i = 0; i < newPosts.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = newPosts.slice(i, i + batchSize);
        
        for (const post of chunk) {
          const postRef = doc(collection(db, 'posts'));
          batch.set(postRef, post);
        }
        
        await batch.commit();
        console.log(`✅ Saved batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(newPosts.length/batchSize)} (${chunk.length} posts)`);
      }
      
      console.log(`🎉 Successfully saved all ${newPosts.length} bridezilla posts!`);
    } else {
      console.log(`⚠️  No new quality posts found for r/${subredditName}`);
    }
    
    console.log(`\n😈 r/${subredditName} FINAL RESULT: ${newPosts.length} new bridezilla posts added!`);
    
    console.log('\n🎉 BRIDEZILLA REPLACEMENT COMPLETE!');
    console.log('═'.repeat(80));
    console.log(`📊 FINAL RESULTS:`);
    console.log(`   💅 Bridezilla posts collected: ${newPosts.length}`);
    console.log(`   🎊 Ready for some hilarious bridezilla drama! 😂`);
    console.log('═'.repeat(80));
    
  } catch (error) {
    console.error(`❌ Error scraping r/${subredditName}:`, error.message);
  }
}

scrapeBridezillaContent().catch(console.error); 