#!/usr/bin/env node

/**
 * CHECK CROSSPOST DATA IN DATABASE
 * Quick script to verify if crosspost metadata was saved correctly
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, limit } = require('firebase/firestore');
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

async function checkCrosspostData() {
  console.log('🔍 CHECKING CROSSPOST DATA IN DATABASE');
  console.log('======================================\n');

  try {
    // Check AmItheDevil posts specifically
    console.log('📊 Checking AmItheDevil posts...');
    const amitthedevilQuery = query(
      collection(db, 'posts'), 
      where('subreddit', '==', 'AmItheDevil'),
      limit(10)
    );
    const snapshot = await getDocs(amitthedevilQuery);
    
    if (snapshot.empty) {
      console.log('❌ No AmItheDevil posts found in database!');
      return;
    }

    console.log(`✅ Found ${snapshot.size} AmItheDevil posts to check\n`);

    let postsWithCrosspostData = 0;
    let crossposts = 0;

    snapshot.forEach((doc, index) => {
      const post = doc.data();
      console.log(`${index + 1}. Post ID: ${doc.id}`);
      console.log(`   Title: "${post.title?.substring(0, 60)}..."`);
      console.log(`   Score: ${post.score}`);
      
      // Check if crosspost fields exist
      if (post.hasOwnProperty('is_crosspost')) {
        postsWithCrosspostData++;
        console.log(`   ✅ Has crosspost metadata: is_crosspost = ${post.is_crosspost}`);
        
        if (post.is_crosspost) {
          crossposts++;
          console.log(`   🔗 CROSSPOST! Original: r/${post.crosspost_parent_subreddit}`);
          if (post.crosspost_parent_title) {
            console.log(`   📝 Original title: "${post.crosspost_parent_title.substring(0, 50)}..."`);
          }
        } else {
          console.log(`   📄 Original content (not a crosspost)`);
        }
      } else {
        console.log(`   ⚠️  Missing crosspost metadata fields`);
      }
      console.log('');
    });

    // Summary
    console.log('📈 SUMMARY:');
    console.log(`   Posts checked: ${snapshot.size}`);
    console.log(`   Posts with crosspost metadata: ${postsWithCrosspostData}`);
    console.log(`   Actual crossposts: ${crossposts}`);
    console.log(`   Crosspost percentage: ${Math.round(crossposts/snapshot.size*100)}%`);

    if (postsWithCrosspostData === 0) {
      console.log('\n❌ ISSUE: No posts have crosspost metadata!');
      console.log('   The rescraping script may not have run successfully.');
      console.log('   Try running: node scripts/rescrape-amIthedevil.js');
    } else if (crossposts === 0) {
      console.log('\n⚠️  No crossposts found in this sample.');
      console.log('   This could be normal if these specific posts are original content.');
    } else {
      console.log('\n✅ Crosspost data looks good!');
      console.log('   Check that your mobile app is displaying the posts correctly.');
    }

  } catch (error) {
    console.error('❌ Error checking data:', error);
  }
}

// Run the check
checkCrosspostData().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Check failed:', error);
  process.exit(1);
}); 