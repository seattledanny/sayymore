#!/usr/bin/env node

/**
 * TEST FRONTEND CROSSPOST DATA ACCESS
 * Check if the React app can properly access crosspost metadata
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

async function testFrontendCrosspostAccess() {
  console.log('🧪 TESTING FRONTEND CROSSPOST DATA ACCESS');
  console.log('==========================================\n');

  try {
    // Get a few AmItheDevil posts like the frontend would
    console.log('📊 Fetching posts as the frontend would...');
    const postsQuery = query(
      collection(db, 'posts'),
      where('subreddit', '==', 'AmItheDevil'),
      limit(3)
    );
    const snapshot = await getDocs(postsQuery);
    
    if (snapshot.empty) {
      console.log('❌ No posts returned by frontend query!');
      return;
    }

    console.log(`✅ Frontend query returned ${snapshot.size} posts\n`);

    // Test each post like the React components would
    snapshot.forEach((doc, index) => {
      const post = doc.data();
      
      console.log(`🧪 POST ${index + 1} - Frontend Component Test`);
      console.log('==========================================');
      console.log(`ID: ${doc.id}`);
      console.log(`Title: "${post.title}"`);
      console.log(`Subreddit: r/${post.subreddit}`);
      console.log(`Score: ${post.score}`);
      
      // Test crosspost field access exactly like React components
      console.log('\n🔍 Crosspost Field Tests:');
      console.log(`   post.is_crosspost = ${post.is_crosspost} (${typeof post.is_crosspost})`);
      console.log(`   post.crosspost_parent_subreddit = "${post.crosspost_parent_subreddit}"`);
      console.log(`   post.crosspost_parent_title = "${post.crosspost_parent_title}"`);
      
      // Test the exact React conditional logic
      const reactConditional = post.is_crosspost;
      console.log(`\n⚛️  React Conditional Test:`);
      console.log(`   {post.is_crosspost && (...)} = ${reactConditional}`);
      
      if (reactConditional) {
        console.log('   ✅ CROSSPOST INDICATOR SHOULD SHOW!');
        console.log(`   📱 Mobile Post List: 🔗 icon should appear`);
        console.log(`   📱 Mobile Post View: Blue crosspost badge should show`);
        console.log(`   💬 Badge text: "🔗 Originally posted in r/${post.crosspost_parent_subreddit}"`);
      } else {
        console.log('   ❌ No crosspost indicator would show');
        console.log('   📄 Post would display as original content');
      }
      
      // Test the small crosspost badge logic (MobilePostList)
      const smallBadgeLogic = post.is_crosspost;
      console.log(`\n🏷️  Small Badge Logic Test:`);
      console.log(`   {post.is_crosspost && (<span className="crosspost-badge-small">🔗</span>)}`);
      console.log(`   Result: ${smallBadgeLogic ? '🔗 icon shows' : 'no icon'}`);
      
      console.log('\n' + '='.repeat(50) + '\n');
    });

    // Summary
    const allPosts = [];
    snapshot.forEach(doc => allPosts.push(doc.data()));
    
    const crosspostCount = allPosts.filter(post => post.is_crosspost).length;
    const percentage = Math.round((crosspostCount / allPosts.length) * 100);
    
    console.log('📊 FRONTEND TEST SUMMARY:');
    console.log('=========================');
    console.log(`Posts tested: ${allPosts.length}`);
    console.log(`Crossposts found: ${crosspostCount}`);
    console.log(`Expected UI indicators: ${percentage}% of posts should show 🔗`);
    
    if (crosspostCount > 0) {
      console.log('\n✅ CROSSPOST DATA IS ACCESSIBLE TO FRONTEND!');
      console.log('🎯 Your React components should show crosspost indicators.');
      console.log('\n🔍 If you still don\'t see indicators, check:');
      console.log('   1. Are you browsing AmItheDevil posts? (category: morality)');
      console.log('   2. Clear browser cache and refresh');
      console.log('   3. Check browser console for any JavaScript errors');
      console.log('   4. Verify you\'re looking at the right posts');
    } else {
      console.log('\n⚠️  No crossposts in this sample');
      console.log('   Try browsing more AmItheDevil posts to find crossposted content');
    }

  } catch (error) {
    console.error('❌ Frontend test failed:', error);
  }
}

// Run the test
testFrontendCrosspostAccess().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
}); 