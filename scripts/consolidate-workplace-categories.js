const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, writeBatch, doc, limit, startAfter } = require('firebase/firestore');

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

// Subreddit to category mapping
const subredditCategoryMap = {
  // Wedding & Drama
  'bridezilla': 'wedding',
  'bridezillas': 'wedding', 
  'weddingshaming': 'wedding',
  'weddingplanning': 'wedding',
  
  // Workplace
  'jobs': 'workplace',
  'careerguidance': 'workplace',
  'careeradvice': 'workplace',
  'antiwork': 'workplace',
  'TalesFromRetail': 'workplace',
  'TalesFromTechSupport': 'workplace',
  'TalesFromYourServer': 'workplace',
  'TalesFromTheFrontDesk': 'workplace',
  'WorkReform': 'workplace',
  
  // Advice
  'relationship_advice': 'advice',
  'relationships': 'advice',
  'AmIOverreacting': 'advice',
  'legaladvice': 'advice',
  'personalfinance': 'advice',
  'college': 'advice',
  'Advice': 'advice',
  
  // Stories
  'tifu': 'stories',
  'confession': 'stories',
  'offmychest': 'stories',
  'TrueOffMyChest': 'stories',
  
  // Revenge
  'pettyrevenge': 'revenge',
  'MaliciousCompliance': 'revenge',
  'ProRevenge': 'revenge',
  'NuclearRevenge': 'revenge',
  
  // Drama
  'entitledparents': 'drama',
  'ChoosingBeggars': 'drama',
  'JUSTNOMIL': 'drama',
  'entitledpeople': 'drama',
  
  // Morality
  'AmItheAsshole': 'morality',
  'AmITheDevil': 'morality',
  
  // Debate
  'unpopularopinion': 'debate',
  'changemyview': 'debate',
  
  // Misc
  'mildlyinfuriating': 'misc'
};

async function consolidateWorkplaceCategories() {
  console.log('🏢 CONSOLIDATING WORKPLACE CATEGORIES');
  console.log('====================================\n');

  try {
    // Step 1: Convert any remaining "work" category posts to "workplace"
    console.log('📍 Step 1: Converting "work" category to "workplace"...');
    const workQuery = query(
      collection(db, 'posts'),
      where('category', '==', 'work')
    );

    const workSnapshot = await getDocs(workQuery);
    console.log(`Found ${workSnapshot.docs.length} posts with "work" category to convert`);

    if (workSnapshot.docs.length > 0) {
      const batch1 = writeBatch(db);
      workSnapshot.docs.forEach((postDoc) => {
        const docRef = doc(db, 'posts', postDoc.id);
        batch1.update(docRef, { category: 'workplace' });
      });
      await batch1.commit();
      console.log(`✅ Converted ${workSnapshot.docs.length} posts from "work" to "workplace"`);
    }

    // Step 2: Find and fix posts without categories
    console.log('\n📍 Step 2: Finding posts without categories...');
    const postsToFix = [];
    let lastDoc = null;
    let batchCount = 0;

    while (true) {
      batchCount++;
      console.log(`   Scanning batch ${batchCount}...`);

      let batchQuery = query(collection(db, 'posts'), limit(500));
      if (lastDoc) {
        batchQuery = query(collection(db, 'posts'), startAfter(lastDoc), limit(500));
      }

      const snapshot = await getDocs(batchQuery);
      
      if (snapshot.docs.length === 0) {
        break;
      }

      snapshot.docs.forEach((postDoc) => {
        const data = postDoc.data();
        const category = data.category;

        // Find posts without categories
        if (!category || category === null || category === undefined || category === '') {
          const subreddit = data.subreddit;
          const suggestedCategory = subredditCategoryMap[subreddit];
          
          if (suggestedCategory) {
            postsToFix.push({
              id: postDoc.id,
              subreddit: subreddit,
              title: data.title?.substring(0, 50) + '...',
              currentCategory: category,
              suggestedCategory: suggestedCategory
            });
          } else {
            console.log(`   ⚠️  Unknown subreddit: r/${subreddit} - needs manual categorization`);
          }
        }
      });

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    console.log(`\nFound ${postsToFix.length} posts without categories to fix`);

    // Show what will be fixed
    if (postsToFix.length > 0) {
      console.log('\n📝 Posts to be categorized:');
      const subredditGroups = {};
      postsToFix.forEach(post => {
        if (!subredditGroups[post.subreddit]) {
          subredditGroups[post.subreddit] = [];
        }
        subredditGroups[post.subreddit].push(post);
      });

      Object.entries(subredditGroups).forEach(([subreddit, posts]) => {
        const category = posts[0].suggestedCategory;
        console.log(`   r/${subreddit} → ${category} (${posts.length} posts)`);
      });

      // Step 3: Apply the fixes
      console.log('\n📍 Step 3: Applying category fixes...');
      
      const batches = [];
      let currentBatch = writeBatch(db);
      let operationCount = 0;

      postsToFix.forEach((post) => {
        const docRef = doc(db, 'posts', post.id);
        currentBatch.update(docRef, { category: post.suggestedCategory });
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

      console.log(`✅ Fixed ${postsToFix.length} posts without categories`);
    }

    // Step 4: Final verification
    console.log('\n📍 Step 4: Final verification...');
    
    // Check for any remaining "work" category
    const remainingWorkQuery = query(
      collection(db, 'posts'),
      where('category', '==', 'work')
    );
    const remainingWorkSnapshot = await getDocs(remainingWorkQuery);
    
    // Check for any remaining missing categories
    const sampleQuery = query(collection(db, 'posts'), limit(1000));
    const sampleSnapshot = await getDocs(sampleQuery);
    let missingCategoryCount = 0;
    
    sampleSnapshot.docs.forEach(doc => {
      const category = doc.data().category;
      if (!category || category === null || category === undefined || category === '') {
        missingCategoryCount++;
      }
    });

    console.log('\n✅ CONSOLIDATION RESULTS:');
    console.log('========================');
    console.log(`📊 Remaining "work" category posts: ${remainingWorkSnapshot.docs.length}`);
    console.log(`📊 Posts still missing categories: ${missingCategoryCount} (estimated from sample)`);
    console.log(`📊 Posts fixed in this run: ${postsToFix.length}`);

    if (remainingWorkSnapshot.docs.length === 0 && missingCategoryCount === 0) {
      console.log('\n🎉 SUCCESS! All categories have been consolidated!');
      console.log('   • All "work" posts converted to "workplace"');
      console.log('   • All missing categories fixed');
      console.log('   • Database is now clean and consistent');
    } else {
      if (remainingWorkSnapshot.docs.length > 0) {
        console.log(`\n⚠️  Warning: ${remainingWorkSnapshot.docs.length} posts still have "work" category`);
      }
      if (missingCategoryCount > 0) {
        console.log(`\n⚠️  Warning: ~${missingCategoryCount} posts still missing categories`);
      }
    }

    // Show current workplace posts count
    const workplaceQuery = query(
      collection(db, 'posts'),
      where('category', '==', 'workplace')
    );
    const workplaceSnapshot = await getDocs(workplaceQuery);
    console.log(`\n📈 Total workplace posts: ${workplaceSnapshot.docs.length}`);

  } catch (error) {
    console.error('❌ Error consolidating categories:', error.message);
  }
}

// Run the consolidation
consolidateWorkplaceCategories().catch(console.error); 