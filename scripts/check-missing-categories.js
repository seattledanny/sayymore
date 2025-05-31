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

async function checkMissingCategories() {
  console.log('📂 CHECKING POST CATEGORIES');
  console.log('===========================\n');

  try {
    // Get all posts in batches to check for missing categories
    console.log('🔍 Scanning all posts for category completeness...\n');
    
    const postsWithoutCategory = [];
    const categoryCounts = {};
    const invalidCategories = [];
    let totalPosts = 0;
    let lastDoc = null;
    let batchCount = 0;

    const validCategories = new Set([
      'advice', 'stories', 'revenge', 'drama', 'debate', 'misc',
      'wedding', 'relationships', 'finance', 'workplace', 'family',
      'neighbors', 'morality', 'creepy', 'controversial'
    ]);

    while (true) {
      batchCount++;
      console.log(`📄 Processing batch ${batchCount}...`);

      let batchQuery = query(collection(db, 'posts'), limit(500));
      if (lastDoc) {
        batchQuery = query(collection(db, 'posts'), startAfter(lastDoc), limit(500));
      }

      const snapshot = await getDocs(batchQuery);
      
      if (snapshot.docs.length === 0) {
        break; // No more documents
      }

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const category = data.category;
        totalPosts++;

        // Check for missing or invalid categories
        if (!category || category === null || category === undefined || category === '') {
          postsWithoutCategory.push({
            id: doc.id,
            title: data.title?.substring(0, 50) + '...',
            subreddit: data.subreddit,
            category: category
          });
        } else if (!validCategories.has(category)) {
          invalidCategories.push({
            id: doc.id,
            title: data.title?.substring(0, 50) + '...',
            subreddit: data.subreddit,
            category: category
          });
        }

        // Count all categories
        const categoryKey = category || 'MISSING';
        categoryCounts[categoryKey] = (categoryCounts[categoryKey] || 0) + 1;
      });

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    console.log(`✅ Scan complete! Processed ${totalPosts} total posts.\n`);

    // Report results
    console.log('📊 CATEGORY ANALYSIS RESULTS');
    console.log('============================\n');

    console.log(`📈 Total posts analyzed: ${totalPosts.toLocaleString()}`);
    console.log(`❌ Posts missing categories: ${postsWithoutCategory.length}`);
    console.log(`⚠️  Posts with invalid categories: ${invalidCategories.length}`);
    console.log(`✅ Posts with valid categories: ${totalPosts - postsWithoutCategory.length - invalidCategories.length}\n`);

    // Show posts without categories
    if (postsWithoutCategory.length > 0) {
      console.log('❌ POSTS WITHOUT CATEGORIES:');
      console.log('-'.repeat(60));
      postsWithoutCategory.slice(0, 20).forEach((post, i) => {
        console.log(`   ${i+1}. r/${post.subreddit} - "${post.title}" (category: ${post.category})`);
      });
      if (postsWithoutCategory.length > 20) {
        console.log(`   ... and ${postsWithoutCategory.length - 20} more posts without categories`);
      }
      console.log('');
    }

    // Show posts with invalid categories
    if (invalidCategories.length > 0) {
      console.log('⚠️  POSTS WITH INVALID CATEGORIES:');
      console.log('-'.repeat(60));
      invalidCategories.slice(0, 20).forEach((post, i) => {
        console.log(`   ${i+1}. r/${post.subreddit} - "${post.title}" (category: "${post.category}")`);
      });
      if (invalidCategories.length > 20) {
        console.log(`   ... and ${invalidCategories.length - 20} more posts with invalid categories`);
      }
      console.log('');
    }

    // Show category breakdown
    console.log('📂 CATEGORY BREAKDOWN:');
    console.log('-'.repeat(40));
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        const percentage = ((count / totalPosts) * 100).toFixed(1);
        const status = category === 'MISSING' ? '❌' : 
                      !validCategories.has(category) ? '⚠️ ' : '✅';
        console.log(`   ${status} ${category.padEnd(15)} │ ${count.toString().padStart(5)} posts │ ${percentage.padStart(5)}%`);
      });

    // Summary and recommendations
    console.log('\n🎯 SUMMARY & RECOMMENDATIONS:');
    console.log('='.repeat(50));

    if (postsWithoutCategory.length === 0 && invalidCategories.length === 0) {
      console.log('🎉 EXCELLENT! All posts have valid categories!');
      console.log('   Your database is well-organized and complete.');
    } else {
      console.log('📋 Issues found that need attention:');
      
      if (postsWithoutCategory.length > 0) {
        console.log(`   • ${postsWithoutCategory.length} posts are missing categories entirely`);
        console.log('     → These posts won\'t appear in category filters');
      }
      
      if (invalidCategories.length > 0) {
        console.log(`   • ${invalidCategories.length} posts have invalid categories`);
        console.log('     → These might not display properly in your app');
      }

      console.log('\n💡 Recommended actions:');
      console.log('   1. Fix missing categories based on subreddit patterns');
      console.log('   2. Update invalid categories to match valid category list');
      console.log('   3. Re-run this check to verify fixes');
    }

    // Show valid categories for reference
    console.log('\n📝 VALID CATEGORIES:');
    console.log('   ' + Array.from(validCategories).sort().join(', '));

  } catch (error) {
    console.error('❌ Error checking categories:', error.message);
  }
}

// Run the check
checkMissingCategories().catch(console.error); 