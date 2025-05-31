const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, writeBatch, doc } = require('firebase/firestore');

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

async function fixWorkplaceCategory() {
  console.log('🏢 FIXING WORKPLACE CATEGORY');
  console.log('===========================\n');

  try {
    // Step 1: Find all posts with 'work' category
    console.log('📍 Step 1: Finding posts with "work" category...');
    const workQuery = query(
      collection(db, 'posts'),
      where('category', '==', 'work')
    );

    const workSnapshot = await getDocs(workQuery);
    console.log(`Found ${workSnapshot.docs.length} posts with "work" category`);

    if (workSnapshot.docs.length === 0) {
      console.log('No work category posts found to update');
      return;
    }

    // Show sample posts before updating
    console.log('\n📝 Sample posts to be updated:');
    workSnapshot.docs.slice(0, 5).forEach((doc, i) => {
      const data = doc.data();
      console.log(`   ${i+1}. r/${data.subreddit} - "${data.title?.substring(0, 50)}..."`);
    });

    // Step 2: Also find workplace-related posts in 'advice' category 
    console.log('\n📍 Step 2: Finding workplace posts in "advice" category...');
    const workplaceSubreddits = ['jobs', 'careerguidance', 'careeradvice'];
    const adviceWorkplacePosts = [];

    for (const subreddit of workplaceSubreddits) {
      const adviceQuery = query(
        collection(db, 'posts'),
        where('subreddit', '==', subreddit),
        where('category', '==', 'advice')
      );

      const adviceSnapshot = await getDocs(adviceQuery);
      adviceSnapshot.docs.forEach(doc => adviceWorkplacePosts.push(doc));
      
      if (adviceSnapshot.docs.length > 0) {
        console.log(`   Found ${adviceSnapshot.docs.length} r/${subreddit} posts in advice category`);
      }
    }

    console.log(`Total workplace posts in advice category: ${adviceWorkplacePosts.length}`);

    // Step 3: Update all posts to 'workplace' category
    const allWorkplacePosts = [...workSnapshot.docs, ...adviceWorkplacePosts];
    console.log(`\n🔄 Step 3: Updating ${allWorkplacePosts.length} posts to "workplace" category...`);

    // Batch update (Firebase limit is 500 operations per batch)
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;

    allWorkplacePosts.forEach((postDoc) => {
      const docRef = doc(db, 'posts', postDoc.id);
      currentBatch.update(docRef, { category: 'workplace' });
      operationCount++;

      if (operationCount === 500) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    });

    if (operationCount > 0) {
      batches.push(currentBatch);
    }

    console.log(`Processing ${batches.length} batch(es)...`);

    for (let i = 0; i < batches.length; i++) {
      console.log(`   Updating batch ${i + 1}/${batches.length}...`);
      await batches[i].commit();
    }

    console.log('\n✅ SUCCESS! Updated categories:');
    console.log(`   📝 ${workSnapshot.docs.length} posts: "work" → "workplace"`);
    console.log(`   📝 ${adviceWorkplacePosts.length} posts: "advice" → "workplace" (workplace subreddits)`);
    console.log(`   📊 Total workplace posts: ${allWorkplacePosts.length}`);

    // Step 4: Verify the changes
    console.log('\n🔍 Step 4: Verifying changes...');
    const verifyQuery = query(
      collection(db, 'posts'),
      where('category', '==', 'workplace')
    );

    const verifySnapshot = await getDocs(verifyQuery);
    console.log(`✅ Verification: ${verifySnapshot.docs.length} posts now have "workplace" category`);

    // Show breakdown by subreddit
    const subredditBreakdown = {};
    verifySnapshot.docs.forEach(doc => {
      const subreddit = doc.data().subreddit;
      subredditBreakdown[subreddit] = (subredditBreakdown[subreddit] || 0) + 1;
    });

    console.log('\n📊 Workplace posts by subreddit:');
    Object.entries(subredditBreakdown)
      .sort((a, b) => b[1] - a[1])
      .forEach(([subreddit, count]) => {
        console.log(`   r/${subreddit}: ${count} posts`);
      });

  } catch (error) {
    console.error('❌ Error fixing workplace category:', error.message);
  }
}

// Run the fix
fixWorkplaceCategory().catch(console.error); 