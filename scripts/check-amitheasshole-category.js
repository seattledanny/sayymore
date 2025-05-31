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

async function checkAmItheAssholeCategory() {
  console.log('🔍 CHECKING AMITHEASSHOLE CATEGORY');
  console.log('==================================\n');

  try {
    // Search for AmItheAsshole posts
    const aithQuery = query(
      collection(db, 'posts'),
      where('subreddit', '==', 'AmItheAsshole'),
      limit(20)
    );

    const querySnapshot = await getDocs(aithQuery);
    console.log(`📊 Found ${querySnapshot.docs.length} AmItheAsshole posts\n`);

    if (querySnapshot.docs.length === 0) {
      console.log('❌ No AmItheAsshole posts found');
      return;
    }

    // Analyze categories
    const categoryCounts = {};
    const samplePosts = [];

    querySnapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const category = data.category || 'UNKNOWN';
      
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      
      if (samplePosts.length < 10) {
        samplePosts.push({
          id: docSnapshot.id,
          title: data.title,
          category: data.category,
          score: data.score
        });
      }
    });

    console.log('📈 Categories for AmItheAsshole posts:');
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} posts`);
      });

    console.log('\n📝 Sample AmItheAsshole posts:');
    samplePosts.forEach((post, i) => {
      console.log(`   ${i+1}. [${post.category}] "${post.title?.substring(0, 60)}..." (${post.score} pts)`);
    });

    // Let's also check if there are variations of the name
    console.log('\n🔍 Checking for subreddit name variations...');
    
    const variations = ['AITA', 'amitheasshole', 'AmITheAsshole', 'AmItheAsshole'];
    
    for (const variation of variations) {
      const variationQuery = query(
        collection(db, 'posts'),
        where('subreddit', '==', variation),
        limit(5)
      );
      
      const variationSnapshot = await getDocs(variationQuery);
      if (variationSnapshot.docs.length > 0) {
        const firstPost = variationSnapshot.docs[0].data();
        console.log(`   Found ${variationSnapshot.docs.length} posts with subreddit = "${variation}" (category: ${firstPost.category})`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking AmItheAsshole posts:', error.message);
  }
}

// Run the check
checkAmItheAssholeCategory().catch(console.error); 