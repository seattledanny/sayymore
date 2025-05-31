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

// Priority 1 subreddits (main conversation starters)
const PRIORITY_1_SUBREDDITS = [
  'AmItheAsshole',
  'relationship_advice',
  'tifu',
  'confession',
  'offmychest',
  'pettyrevenge',
  'MaliciousCompliance',
  'entitledparents',
  'ChoosingBeggars',
  'legaladvice',
  'unpopularopinion'
];

const REDDIT_CLIENT_ID = process.env.REACT_APP_REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REACT_APP_REDDIT_CLIENT_SECRET;
const REDDIT_USER_AGENT = process.env.REACT_APP_REDDIT_USER_AGENT;

let accessToken = null;

// Rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getAccessToken() {
  if (accessToken) return accessToken;
  
  console.log('🔑 Getting Reddit access token...');
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
  console.log('✅ Reddit access token obtained');
  return accessToken;
}

async function fetchPosts(subreddit, sort = 'top', time = 'year', limit = 50) {
  const token = await getAccessToken();
  let url = `https://oauth.reddit.com/r/${subreddit}/${sort}`;
  if (sort === 'top') url += `?t=${time}&limit=${limit}`;
  else url += `?limit=${limit}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': REDDIT_USER_AGENT
    }
  });
  
  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status}`);
  }
  
  return response.json();
}

async function fetchComments(subreddit, postId, limit = 5) {
  try {
    const token = await getAccessToken();
    const url = `https://oauth.reddit.com/r/${subreddit}/comments/${postId}?limit=${limit}&sort=top`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': REDDIT_USER_AGENT
      }
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    if (!data || !Array.isArray(data) || data.length < 2) return [];
    
    const comments = data[1].data.children
      .filter(comment => comment.data && comment.data.body && comment.data.author !== 'AutoModerator' && !comment.data.body.includes('[deleted]') && !comment.data.body.includes('[removed]'))
      .slice(0, limit)
      .map(comment => ({
        author: comment.data.author,
        body: comment.data.body.substring(0, 500),
        score: comment.data.score,
        created_utc: comment.data.created_utc
      }));
    
    return comments;
  } catch (error) {
    console.log(`❌ Failed to fetch comments for post ${postId}: ${error.message}`);
    return [];
  }
}

async function checkPostCounts() {
  console.log('📊 Checking current post counts...');
  const counts = {};
  
  for (const subreddit of PRIORITY_1_SUBREDDITS) {
    try {
      const q = query(collection(db, 'posts'), where('subreddit', '==', subreddit));
      const snapshot = await getDocs(q);
      counts[subreddit] = snapshot.size;
      console.log(`  r/${subreddit}: ${snapshot.size} posts`);
    } catch (error) {
      console.log(`❌ Error checking r/${subreddit}: ${error.message}`);
      counts[subreddit] = 0;
    }
  }
  
  return counts;
}

async function postExists(postId) {
  try {
    const docRef = doc(db, 'posts', postId);
    const docSnap = await getDocs(query(collection(db, 'posts'), where('id', '==', postId)));
    return !docSnap.empty;
  } catch (error) {
    console.log(`Error checking post existence: ${error}`);
    return false;
  }
}

async function scrapeTopPosts(subreddit, targetCount = 50) {
  console.log(`\n🏆 Starting TOP scrape: r/${subreddit} - target: ${targetCount} posts`);
  const collectedPosts = [];
  
  try {
    console.log(`📄 Fetching TOP batch from r/${subreddit} (year)...`);
    const response = await fetchPosts(subreddit, 'top', 'year', targetCount);
    
    if (!response.data || !response.data.children) {
      console.log(`❌ No data returned for r/${subreddit}`);
      return [];
    }
    
    for (const [index, child] of response.data.children.entries()) {
      const post = child.data;
      
      // Skip if post doesn't meet quality criteria
      if (!post.title || !post.author || post.score < 50 || post.author === '[deleted]') {
        continue;
      }
      
      // Check for duplicates
      if (await postExists(post.id)) {
        console.log(`⏭️  Skipping duplicate: ${post.id}`);
        continue;
      }
      
      console.log(`🏆 Processing TOP (year): "${post.title.substring(0,50)}..." (Score: ${post.score})`);
      
      // Rate limiting
      const waitTime = 400 + Math.random() * 300; // 400-700ms
      console.log(`⏸️  Rate limiting: waiting ${Math.round(waitTime)}ms`);
      await delay(waitTime);
      
      // Fetch comments
      const comments = await fetchComments(subreddit, post.id);
      
      const processedPost = {
        id: post.id,
        title: post.title,
        body: post.selftext || '',
        author: post.author,
        subreddit: post.subreddit,
        url: `https://reddit.com${post.permalink}`,
        score: post.score,
        num_comments: post.num_comments,
        created_utc: post.created_utc,
        scraped_at: Date.now(),
        comments: comments
      };
      
      collectedPosts.push(processedPost);
      console.log(`✅ Collected TOP post ${collectedPosts.length}/${targetCount} (Score: ${post.score}, Comments: ${comments.length})`);
      
      if (collectedPosts.length >= targetCount) break;
    }
    
    console.log(`🎉 Completed TOP scraping r/${subreddit}: ${collectedPosts.length} posts collected`);
    return collectedPosts;
    
  } catch (error) {
    console.error(`❌ Error scraping r/${subreddit}:`, error.message);
    return collectedPosts;
  }
}

async function storePosts(posts) {
  if (posts.length === 0) return;
  
  console.log(`💾 Storing ${posts.length} posts...`);
  const batch = writeBatch(db);
  
  posts.forEach(post => {
    const docRef = doc(db, 'posts', post.id);
    batch.set(docRef, post);
  });
  
  try {
    await batch.commit();
    console.log(`✅ Successfully stored ${posts.length} posts`);
  } catch (error) {
    console.error('❌ Error storing posts:', error);
  }
}

async function main() {
  console.log('🚀 SMART REDDIT SCRAPER - Completing Missing TOP Posts\n');
  
  // Check current counts
  const counts = await checkPostCounts();
  
  // Find subreddits that need TOP posts (have < 100 posts)
  const needsTopPosts = PRIORITY_1_SUBREDDITS.filter(subreddit => counts[subreddit] < 100);
  
  if (needsTopPosts.length === 0) {
    console.log('🎉 All subreddits are complete! No scraping needed.');
    process.exit(0);
  }
  
  console.log(`\n📋 Subreddits needing TOP posts: ${needsTopPosts.length}`);
  needsTopPosts.forEach(subreddit => {
    const needed = 100 - counts[subreddit];
    console.log(`  r/${subreddit}: ${counts[subreddit]} posts (need ${needed} more)`);
  });
  
  console.log('\n🏁 Starting targeted TOP scraping...\n');
  
  // Scrape TOP posts for each subreddit that needs them
  for (const [index, subreddit] of needsTopPosts.entries()) {
    const currentCount = counts[subreddit];
    const neededCount = 100 - currentCount;
    
    console.log(`📈 Progress: ${index + 1}/${needsTopPosts.length} - r/${subreddit} (need ${neededCount} posts)`);
    
    const posts = await scrapeTopPosts(subreddit, neededCount);
    if (posts.length > 0) {
      await storePosts(posts);
    }
    
    // Brief pause between subreddits
    if (index < needsTopPosts.length - 1) {
      console.log('⏸️  Pausing before next subreddit...\n');
      await delay(2000);
    }
  }
  
  console.log('\n🎉 Smart scraping complete! All subreddits should now have 100 posts.');
  
  // Final count check
  console.log('\n📊 Final count verification:');
  const finalCounts = await checkPostCounts();
  let totalPosts = 0;
  for (const subreddit of PRIORITY_1_SUBREDDITS) {
    totalPosts += finalCounts[subreddit];
  }
  console.log(`\n🎯 Total posts collected: ${totalPosts}`);
  
  process.exit(0);
}

main().catch(console.error); 