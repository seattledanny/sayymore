/**
 * Test Subreddit Order - Check the new popularity-based ordering
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, getDocs, limit } = require('firebase/firestore');

// Load environment variables
require('dotenv').config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testSubredditOrder() {
  try {
    console.log('🔍 Testing subreddit popularity order...');
    
    // Query posts to get subreddit counts (same logic as postService)
    const q = query(collection(db, 'posts'), limit(2000));
    const snapshot = await getDocs(q);
    const subredditCounts = new Map();
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.subreddit) {
        const count = subredditCounts.get(data.subreddit) || 0;
        subredditCounts.set(data.subreddit, count + 1);
      }
    });
    
    // Convert to array and sort by post count (descending)
    const subreddits = Array.from(subredditCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([subreddit, count]) => ({ subreddit, count }));
    
    console.log(`\n📊 Top 20 Subreddits by Post Count:`);
    console.log('='.repeat(50));
    subreddits.slice(0, 20).forEach((item, index) => {
      console.log(`${String(index + 1).padStart(2)}. r/${item.subreddit.padEnd(20)} - ${item.count} posts`);
    });
    
    console.log(`\n✅ Total: ${subreddits.length} subreddits found`);
    console.log(`🥇 Most popular: r/${subreddits[0].subreddit} (${subreddits[0].count} posts)`);
    console.log(`🥈 Second most: r/${subreddits[1].subreddit} (${subreddits[1].count} posts)`);
    
  } catch (error) {
    console.error('❌ Error testing subreddit order:', error);
  }
}

testSubredditOrder(); 