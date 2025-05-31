/**
 * Complete Subreddit Ranking - Show all subreddits by post count
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function getCompleteRanking() {
  try {
    console.log('🔍 Getting complete subreddit ranking...');
    
    // Get ALL posts to ensure we have complete data
    const snapshot = await getDocs(collection(db, 'posts'));
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
    
    console.log(`\n📊 Complete Subreddit Ranking (${snapshot.size} total posts):`);
    console.log('='.repeat(60));
    
    subreddits.forEach((item, index) => {
      const isTargetSubreddit = ['nosleep', 'AmItheAsshole'].includes(item.subreddit);
      const marker = isTargetSubreddit ? ' 🎯' : '';
      console.log(`${String(index + 1).padStart(2)}. r/${item.subreddit.padEnd(25)} - ${String(item.count).padStart(3)} posts${marker}`);
    });
    
    // Find specific subreddits
    const nosleepRank = subreddits.findIndex(s => s.subreddit === 'nosleep') + 1;
    const aitaRank = subreddits.findIndex(s => s.subreddit === 'AmItheAsshole') + 1;
    
    console.log(`\n🎯 Target Subreddit Rankings:`);
    console.log(`   r/nosleep: #${nosleepRank} (${subreddits.find(s => s.subreddit === 'nosleep')?.count || 0} posts)`);
    console.log(`   r/AmItheAsshole: #${aitaRank} (${subreddits.find(s => s.subreddit === 'AmItheAsshole')?.count || 0} posts)`);
    
  } catch (error) {
    console.error('❌ Error getting ranking:', error);
  }
}

getCompleteRanking(); 