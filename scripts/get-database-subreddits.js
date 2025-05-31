/**
 * Get Database Subreddits - Scan all posts to find unique subreddits
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, getDocs, limit, startAfter } = require('firebase/firestore');

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

async function getDatabaseSubreddits() {
  console.log('📊 SCANNING DATABASE FOR SUBREDDITS');
  console.log('='.repeat(50));

  try {
    const subredditCounts = {};
    let lastDoc = null;
    let batchCount = 0;
    let totalPosts = 0;

    console.log('📄 Scanning posts in database...');

    while (true) {
      batchCount++;
      console.log(`   Processing batch ${batchCount}...`);

      let batchQuery = query(collection(db, 'posts'), limit(500));
      if (lastDoc) {
        batchQuery = query(collection(db, 'posts'), startAfter(lastDoc), limit(500));
      }

      const snapshot = await getDocs(batchQuery);
      
      if (snapshot.docs.length === 0) {
        break;
      }

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const subreddit = data.subreddit || 'unknown';
        
        subredditCounts[subreddit] = (subredditCounts[subreddit] || 0) + 1;
        totalPosts++;
      });

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    // Sort subreddits by post count (descending)
    const sortedSubreddits = Object.entries(subredditCounts)
      .sort((a, b) => b[1] - a[1]);

    console.log('\n📈 DATABASE SUBREDDITS FOUND:');
    console.log('='.repeat(40));
    console.log(`📊 Total Posts: ${totalPosts.toLocaleString()}`);
    console.log(`📂 Total Subreddits: ${sortedSubreddits.length}`);
    console.log('');

    sortedSubreddits.forEach(([subreddit, count], index) => {
      const percentage = ((count / totalPosts) * 100).toFixed(1);
      console.log(`${(index + 1).toString().padStart(2)}. r/${subreddit.padEnd(25)} ${count.toString().padStart(4)} posts (${percentage}%)`);
    });

    console.log('\n📋 SUBREDDIT LIST (for reference):');
    console.log('-'.repeat(30));
    const subredditNames = sortedSubreddits.map(([name]) => name);
    console.log(`[${subredditNames.map(name => `'${name}'`).join(', ')}]`);

    console.log('\n🔍 TOP 20 SUBREDDITS (for app priority):');
    console.log('-'.repeat(45));
    sortedSubreddits.slice(0, 20).forEach(([subreddit, count], index) => {
      console.log(`${(index + 1).toString().padStart(2)}. r/${subreddit.padEnd(20)} - ${count} posts`);
    });

    return {
      subreddits: sortedSubreddits,
      totalPosts,
      subredditNames
    };

  } catch (error) {
    console.error('❌ Error scanning database subreddits:', error.message);
    throw error;
  }
}

// Run the scan
getDatabaseSubreddits().catch(console.error); 