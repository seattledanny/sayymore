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

// Wedding subreddits that need completion
const WEDDING_SUBREDDITS = [
  { 
    name: 'AmItheBridezilla', 
    current: 0, 
    needed: 100,
    description: 'Hilarious bridezilla behavior and "am I being unreasonable?" wedding moments' 
  },
  { 
    name: 'weddingstories', 
    current: 1, 
    needed: 99,
    description: 'Mix of heartwarming and horrifying wedding tales' 
  }
];

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
  // More lenient for wedding content since these subreddits might have lower activity
  return (
    post.score >= 10 && // Lower threshold for wedding content
    post.selftext && 
    post.selftext !== '[deleted]' && 
    post.selftext !== '[removed]' &&
    post.selftext.length > 50 && // More lenient length requirement
    !post.stickied &&
    !post.pinned
  );
}

async function scrapeWeddingSubreddit(subredditInfo) {
  const { name, current, needed, description } = subredditInfo;
  console.log(`💍 SCRAPING WEDDING CONTENT: r/${name}`);
  console.log(`📝 ${description}`);
  console.log(`🎯 Target: ${current}/100 posts, need ${needed} more`);
  console.log('─'.repeat(80));
  
  try {
    const existingIds = await getExistingPostIds(name);
    const newPosts = [];
    
    // Multiple strategies for wedding content
    const strategies = [
      { type: 'hot', limit: 100, label: '🔥 HOT posts' },
      { type: 'top', limit: 100, timeframe: 'week', label: '🏆 TOP of WEEK' },
      { type: 'top', limit: 100, timeframe: 'month', label: '🏆 TOP of MONTH' },
      { type: 'top', limit: 100, timeframe: 'year', label: '🏆 TOP of YEAR' },
      { type: 'top', limit: 100, timeframe: 'all', label: '🏆 TOP of ALL TIME' },
      { type: 'new', limit: 100, label: '🆕 NEW posts' }
    ];
    
    for (const strategy of strategies) {
      if (newPosts.length >= needed) break;
      
      console.log(`${strategy.label} from r/${name}...`);
      const posts = await fetchRedditPosts(name, strategy.type, strategy.limit, strategy.timeframe);
      console.log(`   Found ${posts.length} posts to process`);
      
      for (const post of posts) {
        if (newPosts.length >= needed) break;
        if (existingIds.has(post.id) || !isQualityPost(post)) continue;
        
        console.log(`📝 Processing: "${post.title.substring(0, 60)}..." (${post.score} pts)`);
        
        const comments = await fetchCommentsForPost(name, post.id);
        
        newPosts.push({
          id: post.id,
          title: post.title,
          body: post.selftext,
          author: post.author,
          subreddit: name,
          url: `https://reddit.com${post.permalink}`,
          score: post.score,
          num_comments: post.num_comments,
          created_utc: post.created_utc,
          scraped_at: Date.now(),
          comments: comments
        });
        
        console.log(`✅ Collected ${newPosts.length}/${needed} (Score: ${post.score}, Comments: ${comments.length})`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (posts.length > 0) {
        console.log(`   📊 ${strategy.label}: ${newPosts.length}/${needed} collected so far`);
      }
    }
    
    // Save to Firestore
    if (newPosts.length > 0) {
      console.log(`\n💾 Saving ${newPosts.length} wedding posts to Firestore...`);
      
      // Batch write in smaller chunks for wedding content
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
      
      console.log(`🎉 Successfully saved all ${newPosts.length} wedding posts!`);
    } else {
      console.log(`⚠️  No new quality posts found for r/${name}`);
    }
    
    const finalCount = current + newPosts.length;
    console.log(`\n💍 r/${name} RESULT: ${finalCount}/100 posts (${newPosts.length} new posts added)`);
    return newPosts.length;
    
  } catch (error) {
    console.error(`❌ Error scraping r/${name}:`, error.message);
    return 0;
  }
}

async function completeWeddingContent() {
  console.log('💍 WEDDING CONTENT COMPLETION SCRAPER');
  console.log('═'.repeat(80));
  console.log('🎯 Mission: Complete the most hilarious wedding content!');
  console.log('📊 Subreddits to complete: 2');
  console.log('💒 Focus: Bridezilla drama and wedding stories');
  console.log('═'.repeat(80));
  
  let totalCollected = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < WEDDING_SUBREDDITS.length; i++) {
    const subreddit = WEDDING_SUBREDDITS[i];
    console.log(`\n[${i + 1}/${WEDDING_SUBREDDITS.length}] 💒 Starting ${subreddit.name}...`);
    
    const collected = await scrapeWeddingSubreddit(subreddit);
    totalCollected += collected;
    
    const elapsed = (Date.now() - startTime) / 1000 / 60;
    console.log(`\n📊 PROGRESS UPDATE:`);
    console.log(`   ✅ Subreddits processed: ${i + 1}/${WEDDING_SUBREDDITS.length}`);
    console.log(`   📈 Wedding posts collected: ${totalCollected}`);
    console.log(`   ⏱️  Time elapsed: ${elapsed.toFixed(1)} minutes`);
    console.log('═'.repeat(80));
  }
  
  const totalTime = (Date.now() - startTime) / 1000 / 60;
  console.log('\n🎉 WEDDING CONTENT COMPLETION FINISHED!');
  console.log('═'.repeat(80));
  console.log(`📊 FINAL WEDDING RESULTS:`);
  console.log(`   💍 Wedding subreddits completed: ${WEDDING_SUBREDDITS.length}`);
  console.log(`   📈 New wedding posts collected: ${totalCollected}`);
  console.log(`   ⏱️  Total time: ${totalTime.toFixed(1)} minutes`);
  console.log(`   🎊 WEDDING PLANNING CONTENT IS NOW COMPLETE!`);
  console.log('═'.repeat(80));
  console.log('🚀 Ready for some hilarious bridezilla stories! 😂');
}

completeWeddingContent().catch(console.error); 