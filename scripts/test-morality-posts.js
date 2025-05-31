const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, limit } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHSs1mM52_fSSRqHUgMhjUnRuC6B_2bRU",
  authDomain: "reddit-conversations-af4ed.firebaseapp.com",
  projectId: "reddit-conversations-af4ed",
  storageBucket: "reddit-conversations-af4ed.firebasestorage.app",
  messagingSenderId: "1098498238947",
  appId: "1:1098498238947:web:b5e9bf3f39dca9bfadbdcd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testMoralityPosts() {
  try {
    console.log('🔍 Fetching morality category posts...');
    
    // Query for morality category posts (should include AmItheDevil)
    const q = query(
      collection(db, 'posts'),
      where('category', '==', 'morality'),
      limit(5)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`📊 Found ${querySnapshot.docs.length} morality posts`);
    
    querySnapshot.forEach((doc, index) => {
      const post = doc.data();
      console.log(`\n--- Post ${index + 1} ---`);
      console.log(`ID: ${doc.id}`);
      console.log(`Title: ${post.title?.substring(0, 60)}...`);
      console.log(`Subreddit: r/${post.subreddit}`);
      console.log(`Category: ${post.category}`);
      console.log(`Score: ${post.score}`);
      console.log(`Created: ${new Date(post.created_utc * 1000).toLocaleDateString()}`);
      
      // Check crosspost data
      console.log('\n🔗 CROSSPOST DATA:');
      console.log(`is_crosspost: ${post.is_crosspost} (${typeof post.is_crosspost})`);
      console.log(`crosspost_parent_subreddit: ${post.crosspost_parent_subreddit || 'null'}`);
      console.log(`crosspost_parent_title: ${post.crosspost_parent_title || 'null'}`);
      console.log(`crosspost_chain_length: ${post.crosspost_chain_length || 'null'}`);
      
      // React conditional check
      const shouldShow = post.is_crosspost === true;
      console.log(`\n✅ Should show crosspost indicator: ${shouldShow ? 'YES' : 'NO'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testMoralityPosts(); 