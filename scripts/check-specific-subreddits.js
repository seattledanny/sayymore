/**
 * Check Specific Subreddits - Find nosleep and AmItheAsshole posts
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

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

async function checkSpecificSubreddits() {
  try {
    console.log('🔍 Checking for nosleep and AmItheAsshole posts...');
    
    const subredditsToCheck = ['nosleep', 'AmItheAsshole'];
    
    for (const subreddit of subredditsToCheck) {
      console.log(`\n📊 Checking r/${subreddit}:`);
      
      // Query for posts from this subreddit
      const q = query(
        collection(db, 'posts'),
        where('subreddit', '==', subreddit)
      );
      
      const snapshot = await getDocs(q);
      console.log(`   Found ${snapshot.size} posts`);
      
      if (snapshot.size > 0) {
        console.log('   ✅ Posts exist in database');
        snapshot.docs.slice(0, 3).forEach((doc, index) => {
          const data = doc.data();
          console.log(`   ${index + 1}. "${data.title?.substring(0, 60)}..."`);
        });
      } else {
        console.log('   ❌ No posts found in database');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking subreddits:', error);
  }
}

checkSpecificSubreddits(); 