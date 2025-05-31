const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, deleteDoc, doc, writeBatch } = require('firebase/firestore');

// Load environment variables
require('dotenv').config();

// Firebase configuration (using environment variables like the React app)
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

async function removeAllAmItheDevilPosts() {
  console.log('🗑️  REMOVING ALL AMITHEDEVIL POSTS');
  console.log('===================================\n');

  try {
    // Step 1: Find all AmItheDevil posts
    console.log('🔍 Searching for AmItheDevil posts...');
    
    const amItheDevilQuery = query(
      collection(db, 'posts'),
      where('subreddit', '==', 'AmItheDevil')
    );
    
    const querySnapshot = await getDocs(amItheDevilQuery);
    console.log(`📊 Found ${querySnapshot.docs.length} AmItheDevil posts\n`);
    
    if (querySnapshot.docs.length === 0) {
      console.log('✅ No AmItheDevil posts found. Database is already clean!');
      return;
    }

    // Step 2: Show sample posts before deletion
    console.log('📝 Sample posts to be removed:');
    querySnapshot.docs.slice(0, 10).forEach((docSnapshot, i) => {
      const data = docSnapshot.data();
      console.log(`   ${i+1}. "${data.title?.substring(0, 60)}..." (${data.score} pts)`);
    });
    if (querySnapshot.docs.length > 10) {
      console.log(`   ... and ${querySnapshot.docs.length - 10} more posts`);
    }
    console.log('');

    // Step 3: Batch delete posts (Firestore allows max 500 per batch)
    console.log('🗑️ Starting batch deletion...');
    
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    
    querySnapshot.docs.forEach((docSnapshot) => {
      currentBatch.delete(doc(db, 'posts', docSnapshot.id));
      operationCount++;
      
      // If we reach 500 operations, start a new batch
      if (operationCount === 500) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    });
    
    // Add the last batch if it has operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }
    
    console.log(`📦 Processing ${batches.length} batch(es)...`);
    
    // Execute all batches
    for (let i = 0; i < batches.length; i++) {
      console.log(`   Executing batch ${i + 1}/${batches.length}...`);
      await batches[i].commit();
    }
    
    console.log(`\n✅ SUCCESS: Removed all ${querySnapshot.docs.length} AmItheDevil posts!`);
    console.log('🎉 Database cleanup complete!');
    
    // Step 4: Verify deletion
    console.log('\n🔍 Verifying deletion...');
    const verifyQuery = query(
      collection(db, 'posts'),
      where('subreddit', '==', 'AmItheDevil')
    );
    const verifySnapshot = await getDocs(verifyQuery);
    
    if (verifySnapshot.empty) {
      console.log('✅ Verification successful - no AmItheDevil posts remain!');
    } else {
      console.log(`⚠️  Warning: ${verifySnapshot.docs.length} AmItheDevil posts still found`);
    }
    
  } catch (error) {
    console.error('❌ Error removing AmItheDevil posts:', error);
    console.error('Error details:', error.message);
  }
}

// Also search for variations and related posts
async function findAndRemoveVariations() {
  console.log('\n🔍 SEARCHING FOR VARIATIONS AND RELATED POSTS');
  console.log('===============================================\n');

  const variations = [
    'AmItheDevil',
    'amIthedevil', 
    'AmITheDevil',
    'amItheDevil',
    'AMITHEDEVIL'
  ];

  for (const variation of variations) {
    try {
      console.log(`Searching for subreddit: "${variation}"...`);
      
      const q = query(
        collection(db, 'posts'),
        where('subreddit', '==', variation)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.docs.length > 0) {
        console.log(`   📊 Found ${querySnapshot.docs.length} posts for "${variation}"`);
        
        // Show samples
        querySnapshot.docs.slice(0, 3).forEach((docSnapshot, i) => {
          const data = docSnapshot.data();
          console.log(`      ${i+1}. "${data.title?.substring(0, 50)}..."`);
        });
        
        // Delete them
        console.log(`   🗑️ Removing ${querySnapshot.docs.length} posts...`);
        
        const batch = writeBatch(db);
        querySnapshot.docs.forEach((docSnapshot) => {
          batch.delete(doc(db, 'posts', docSnapshot.id));
        });
        
        await batch.commit();
        console.log(`   ✅ Removed ${querySnapshot.docs.length} posts for "${variation}"`);
      } else {
        console.log(`   ✅ No posts found for "${variation}"`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error with "${variation}":`, error.message);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 AmItheDevil Post Removal Tool');
  console.log(`🔥 Firebase Project: ${process.env.REACT_APP_FIREBASE_PROJECT_ID}`);
  console.log(`🏠 Environment: ${process.env.NODE_ENV || 'development'}\n`);

  await removeAllAmItheDevilPosts();
  await findAndRemoveVariations();
  
  console.log('\n🎯 Cleanup operation completed!');
  console.log('📱 You can now check your React app - the morality category should be clean.');
}

// Run the script
main().catch(console.error); 