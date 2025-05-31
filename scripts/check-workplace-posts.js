const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, limit } = require('firebase/firestore');

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

async function checkWorkplacePosts() {
  console.log('🏢 CHECKING WORKPLACE POSTS');
  console.log('===========================\n');

  try {
    // First, check if there's a "workplace" category
    const workplaceQuery = query(
      collection(db, 'posts'),
      where('category', '==', 'workplace')
    );

    const workplaceSnapshot = await getDocs(workplaceQuery);
    console.log(`📊 Posts with category = 'workplace': ${workplaceSnapshot.docs.length}`);

    if (workplaceSnapshot.docs.length > 0) {
      console.log('\n📝 Sample workplace category posts:');
      workplaceSnapshot.docs.slice(0, 10).forEach((doc, i) => {
        const data = doc.data();
        console.log(`   ${i+1}. r/${data.subreddit} - "${data.title?.substring(0, 60)}..."`);
      });
    }

    // Check for workplace-related subreddits
    console.log('\n🔍 SEARCHING FOR WORKPLACE-RELATED SUBREDDITS:');
    console.log('='.repeat(50));

    const workplaceSubreddits = [
      'jobs',
      'careerguidance', 
      'careeradvice',
      'work',
      'antiwork',
      'legaladvice', // often workplace issues
      'TalesFromRetail',
      'TalesFromTechSupport',
      'TalesFromYourServer',
      'MaliciousCompliance', // often workplace stories
      'entitledpeople' // often workplace entitled people
    ];

    for (const subreddit of workplaceSubreddits) {
      const subredditQuery = query(
        collection(db, 'posts'),
        where('subreddit', '==', subreddit),
        limit(5)
      );
      
      const subredditSnapshot = await getDocs(subredditQuery);
      
      if (subredditSnapshot.docs.length > 0) {
        const firstPost = subredditSnapshot.docs[0].data();
        console.log(`   ✅ r/${subreddit}: ${subredditSnapshot.docs.length} posts (category: ${firstPost.category})`);
        
        // Show a sample post
        if (subredditSnapshot.docs.length > 0) {
          console.log(`      Sample: "${firstPost.title?.substring(0, 70)}..."`);
        }
      } else {
        console.log(`   ❌ r/${subreddit}: No posts found`);
      }
    }

    // Check what the "work" category contains
    console.log('\n🔍 CHECKING "WORK" CATEGORY:');
    console.log('='.repeat(30));

    const workQuery = query(
      collection(db, 'posts'),
      where('category', '==', 'work'),
      limit(10)
    );

    const workSnapshot = await getDocs(workQuery);
    console.log(`📊 Posts with category = 'work': ${workSnapshot.docs.length}`);

    if (workSnapshot.docs.length > 0) {
      console.log('\n📝 Sample work category posts:');
      workSnapshot.docs.forEach((doc, i) => {
        const data = doc.data();
        console.log(`   ${i+1}. r/${data.subreddit} - "${data.title?.substring(0, 60)}..." (${data.score} pts)`);
      });
    }

    // Check all categories to see what we have
    console.log('\n📚 ALL CATEGORIES SUMMARY:');
    console.log('='.repeat(25));

    // Get a sample from each category
    const categoryCounts = {};
    const sampleQuery = query(collection(db, 'posts'), limit(1000));
    const sampleSnapshot = await getDocs(sampleQuery);
    
    sampleSnapshot.docs.forEach(doc => {
      const category = doc.data().category || 'UNKNOWN';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`   📂 ${category}: ${count} posts`);
      });

  } catch (error) {
    console.error('❌ Error checking workplace posts:', error.message);
  }
}

// Run the check
checkWorkplacePosts().catch(console.error); 