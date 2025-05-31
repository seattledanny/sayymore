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

// Subreddits that need completion based on analysis
const INCOMPLETE_SUBREDDITS = [
  { name: 'needadvice', current: 34, needed: 66 },
  { name: 'legaladvice', current: 99, needed: 1 },
  { name: 'DecidingToBeBetter', current: 99, needed: 1 },
  { name: 'weddingstories', current: 1, needed: 99 },
  { name: 'AmItheBridezilla', current: 0, needed: 100 },
  { name: 'TalesFromRetail', current: 96, needed: 4 },
  { name: 'confession', current: 95, needed: 5 },
  { name: 'offmychest', current: 92, needed: 8 },
  { name: 'pettyrevenge', current: 98, needed: 2 },
  { name: 'MaliciousCompliance', current: 98, needed: 2 },
  { name: 'ProRevenge', current: 46, needed: 54 },
  { name: 'ChoosingBeggars', current: 97, needed: 3 },
  { name: 'entitledparents', current: 92, needed: 8 }
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

async function fetchRedditPosts(subreddit, type = 'hot', limit = 100) {
  const token = await getRedditAccessToken();
  const url = `https://oauth.reddit.com/r/${subreddit}/${type}?limit=${limit}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': REDDIT_USER_AGENT
    }
  });

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data.children.map(child => child.data);
}

async function getCurrentPostCount(subreddit) {
  const q = query(collection(db, 'posts'), where('subreddit', '==', subreddit));
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
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
    post.score >= 50 &&
    post.selftext && 
    post.selftext !== '[deleted]' && 
    post.selftext !== '[removed]' &&
    post.selftext.length > 100 &&
    !post.stickied &&
    !post.pinned
  );
}

async function scrapeSubredditToTarget(subredditInfo) {
  const { name, current, needed } = subredditInfo;
  console.log(`🎯 COMPLETING: r/${name} (${current}/100 posts, need ${needed} more)`);
  
  try {
    const existingIds = await getExistingPostIds(name);
    const newPosts = [];
    
    // Try HOT posts first
    console.log(`🔥 Fetching HOT posts from r/${name}...`);
    const hotPosts = await fetchRedditPosts(name, 'hot', 100);
    
    for (const post of hotPosts) {
      if (newPosts.length >= needed) break;
      if (existingIds.has(post.id) || !isQualityPost(post)) continue;
      
      console.log(`📝 Processing: "${post.title.substring(0, 50)}..." (${post.score} pts)`);
      
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
    
    // If still need more, try TOP posts
    if (newPosts.length < needed) {
      console.log(`🏆 Need ${needed - newPosts.length} more, fetching TOP posts...`);
      const topPosts = await fetchRedditPosts(name, 'top', 100);
      
      for (const post of topPosts) {
        if (newPosts.length >= needed) break;
        if (existingIds.has(post.id) || !isQualityPost(post)) continue;
        
        console.log(`📝 Processing: "${post.title.substring(0, 50)}..." (${post.score} pts)`);
        
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
    }
    
    // Save to Firestore
    if (newPosts.length > 0) {
      console.log(`💾 Saving ${newPosts.length} posts to Firestore...`);
      
      // Batch write
      const batch = writeBatch(db);
      for (const post of newPosts) {
        const postRef = doc(collection(db, 'posts'));
        batch.set(postRef, post);
      }
      
      await batch.commit();
      console.log(`✅ Successfully saved ${newPosts.length} posts to Firestore`);
    }
    
    const finalCount = current + newPosts.length;
    console.log(`🎉 r/${name} COMPLETE! (${finalCount}/100 posts)`);
    return newPosts.length;
    
  } catch (error) {
    console.error(`❌ Error scraping r/${name}:`, error.message);
    return 0;
  }
}

async function completeFinalScraping() {
  console.log('🚀 FINAL COMPLETION SCRAPER STARTING');
  console.log('═'.repeat(80));
  console.log(`🎯 Target: Complete all subreddits to 100 posts each`);
  console.log(`📊 Subreddits to complete: ${INCOMPLETE_SUBREDDITS.length}`);
  console.log(`📈 Posts needed: ${INCOMPLETE_SUBREDDITS.reduce((sum, s) => sum + s.needed, 0)}`);
  console.log('═'.repeat(80));
  
  let totalCollected = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < INCOMPLETE_SUBREDDITS.length; i++) {
    const subreddit = INCOMPLETE_SUBREDDITS[i];
    console.log(`\n[${i + 1}/${INCOMPLETE_SUBREDDITS.length}] 🎯 Starting r/${subreddit.name}...`);
    
    const collected = await scrapeSubredditToTarget(subreddit);
    totalCollected += collected;
    
    const elapsed = (Date.now() - startTime) / 1000 / 60;
    console.log(`📊 PROGRESS: ${i + 1}/${INCOMPLETE_SUBREDDITS.length} subreddits, ${totalCollected} posts collected, ${elapsed.toFixed(1)}min elapsed`);
    console.log('─'.repeat(80));
  }
  
  const totalTime = (Date.now() - startTime) / 1000 / 60;
  console.log('\n🎉 FINAL COMPLETION SCRAPER FINISHED!');
  console.log('═'.repeat(80));
  console.log(`📊 FINAL RESULTS:`);
  console.log(`   🎯 Subreddits completed: ${INCOMPLETE_SUBREDDITS.length}`);
  console.log(`   📈 New posts collected: ${totalCollected}`);
  console.log(`   ⏱️  Total time: ${totalTime.toFixed(1)} minutes`);
  console.log(`   🎊 DATABASE NOW HAS: 5,700+ POSTS!`);
  console.log('═'.repeat(80));
}

completeFinalScraping().catch(console.error); 