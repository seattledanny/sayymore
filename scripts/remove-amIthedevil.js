const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, deleteDoc, doc, writeBatch } = require('firebase/firestore');

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

async function removeAmItheDevilPosts() {
  try {
    console.log('🔍 Finding AmItheDevil posts to remove...');
    
    // Query for AmItheDevil posts
    const q = query(
      collection(db, 'posts'),
      where('subreddit', '==', 'AmItheDevil')
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`📊 Found ${querySnapshot.docs.length} AmItheDevil posts to remove`);
    
    if (querySnapshot.docs.length === 0) {
      console.log('✅ No AmItheDevil posts found. Nothing to remove.');
      return;
    }
    
    // Batch delete posts (Firestore allows max 500 per batch)
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
    
    // Execute all batches
    console.log(`🗑️ Removing posts in ${batches.length} batch(es)...`);
    
    for (let i = 0; i < batches.length; i++) {
      console.log(`Processing batch ${i + 1}/${batches.length}...`);
      await batches[i].commit();
    }
    
    console.log('✅ Successfully removed all AmItheDevil posts from the database');
    console.log('🔄 You may want to refresh your app to see the changes');
    
  } catch (error) {
    console.error('❌ Error removing AmItheDevil posts:', error);
  }
}

// Run the removal
removeAmItheDevilPosts(); 