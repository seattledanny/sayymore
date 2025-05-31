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

async function getAllSubredditsAndCategories() {
  console.log('📊 ANALYZING ALL SUBREDDITS AND CATEGORIES');
  console.log('==========================================\n');

  try {
    let subredditCounts = {};
    let categoryBreakdown = {};
    let hasMore = true;
    let lastDoc = null;
    const batchSize = 1000;
    let totalProcessed = 0;

    console.log('🔄 Processing posts in batches...\n');

    while (hasMore && totalProcessed < 6000) {
      let q;
      if (lastDoc) {
        q = query(collection(db, 'posts'), startAfter(lastDoc), limit(batchSize));
      } else {
        q = query(collection(db, 'posts'), limit(batchSize));
      }

      const querySnapshot = await getDocs(q);
      const batchCount = querySnapshot.docs.length;
      totalProcessed += batchCount;

      console.log(`   Processed batch: ${batchCount} posts (Total: ${totalProcessed})`);

      querySnapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const subreddit = data.subreddit || 'UNKNOWN';
        const category = data.category || 'UNKNOWN';

        // Count subreddits
        subredditCounts[subreddit] = (subredditCounts[subreddit] || 0) + 1;

        // Track category breakdown per subreddit
        if (!categoryBreakdown[subreddit]) {
          categoryBreakdown[subreddit] = {};
        }
        categoryBreakdown[subreddit][category] = (categoryBreakdown[subreddit][category] || 0) + 1;
      });

      if (batchCount < batchSize) {
        hasMore = false;
      } else {
        lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      }
    }

    console.log(`\n📈 FOUND ${Object.keys(subredditCounts).length} UNIQUE SUBREDDITS`);
    console.log('='.repeat(50));

    // Show top subreddits
    console.log('\n🏆 Top 20 Subreddits by Post Count:');
    Object.entries(subredditCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .forEach(([subreddit, count], i) => {
        const categories = Object.keys(categoryBreakdown[subreddit] || {}).join(', ');
        console.log(`   ${i+1}. r/${subreddit}: ${count} posts (Categories: ${categories})`);
      });

    // Search for asshole-related subreddits
    console.log('\n🔍 SEARCHING FOR ASSHOLE-RELATED SUBREDDITS:');
    console.log('='.repeat(45));

    const assholeRelated = Object.entries(subredditCounts)
      .filter(([subreddit]) => 
        subreddit.toLowerCase().includes('asshole') || 
        subreddit.toLowerCase().includes('aita') ||
        subreddit.toLowerCase().includes('aitah')
      )
      .sort((a, b) => b[1] - a[1]);

    if (assholeRelated.length > 0) {
      assholeRelated.forEach(([subreddit, count]) => {
        const categories = Object.entries(categoryBreakdown[subreddit] || {})
          .map(([cat, cnt]) => `${cat}(${cnt})`)
          .join(', ');
        console.log(`   ✅ r/${subreddit}: ${count} posts`);
        console.log(`      Categories: ${categories}`);
      });
    } else {
      console.log('   ❌ No asshole-related subreddits found');
    }

    // Show all categories
    console.log('\n📚 ALL CATEGORIES IN DATABASE:');
    console.log('='.repeat(30));

    const allCategories = {};
    Object.values(categoryBreakdown).forEach(subredditCategories => {
      Object.entries(subredditCategories).forEach(([category, count]) => {
        allCategories[category] = (allCategories[category] || 0) + count;
      });
    });

    Object.entries(allCategories)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`   📂 ${category}: ${count} posts`);
      });

    // Check specifically for morality category posts
    console.log('\n🧭 POSTS IN MORALITY CATEGORY:');
    console.log('='.repeat(30));

    const moralitySubreddits = Object.entries(categoryBreakdown)
      .filter(([subreddit, categories]) => categories.morality)
      .sort((a, b) => (b[1].morality || 0) - (a[1].morality || 0));

    if (moralitySubreddits.length > 0) {
      moralitySubreddits.forEach(([subreddit, categories]) => {
        console.log(`   📝 r/${subreddit}: ${categories.morality} morality posts`);
      });
    } else {
      console.log('   ✅ No posts found in morality category');
    }

  } catch (error) {
    console.error('❌ Error analyzing subreddits:', error.message);
  }
}

// Run the analysis
getAllSubredditsAndCategories().catch(console.error); 