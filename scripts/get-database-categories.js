/**
 * Get Database Categories - Scan all posts to find unique categories
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

async function getDatabaseCategories() {
  console.log('📊 SCANNING DATABASE FOR CATEGORIES');
  console.log('='.repeat(50));

  try {
    const categoryCounts = {};
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
        const category = data.category || 'uncategorized';
        
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        totalPosts++;
      });

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    // Sort categories by post count (descending)
    const sortedCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1]);

    console.log('\n📈 DATABASE CATEGORIES FOUND:');
    console.log('='.repeat(40));
    console.log(`📊 Total Posts: ${totalPosts.toLocaleString()}`);
    console.log(`📂 Total Categories: ${sortedCategories.length}`);
    console.log('');

    sortedCategories.forEach(([category, count], index) => {
      const percentage = ((count / totalPosts) * 100).toFixed(1);
      console.log(`${(index + 1).toString().padStart(2)}. ${category.padEnd(20)} ${count.toString().padStart(4)} posts (${percentage}%)`);
    });

    console.log('\n📋 CATEGORY LIST (for reference):');
    console.log('-'.repeat(30));
    const categoryNames = sortedCategories.map(([name]) => name);
    console.log(`[${categoryNames.map(name => `'${name}'`).join(', ')}]`);

    return {
      categories: sortedCategories,
      totalPosts,
      categoryNames
    };

  } catch (error) {
    console.error('❌ Error scanning database categories:', error.message);
    throw error;
  }
}

// Run the scan
getDatabaseCategories().catch(console.error); 