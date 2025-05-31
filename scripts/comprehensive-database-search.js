const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, deleteDoc, doc, writeBatch, limit, startAfter } = require('firebase/firestore');

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

async function getTotalPostCount() {
  console.log('📊 CHECKING TOTAL DATABASE SIZE');
  console.log('===============================\n');

  try {
    // Get all posts to count them (in chunks to avoid memory issues)
    let totalCount = 0;
    let hasMore = true;
    let lastDoc = null;
    const batchSize = 1000;

    while (hasMore) {
      let q;
      if (lastDoc) {
        q = query(collection(db, 'posts'), startAfter(lastDoc), limit(batchSize));
      } else {
        q = query(collection(db, 'posts'), limit(batchSize));
      }

      const querySnapshot = await getDocs(q);
      const batchCount = querySnapshot.docs.length;
      totalCount += batchCount;

      console.log(`   Batch: ${batchCount} posts (Total so far: ${totalCount})`);

      if (batchCount < batchSize) {
        hasMore = false;
      } else {
        lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      }
    }

    console.log(`\n✅ Total posts in database: ${totalCount}`);
    return totalCount;

  } catch (error) {
    console.error('❌ Error counting posts:', error.message);
    
    // Fallback: try to get a smaller sample and estimate
    try {
      const q = query(collection(db, 'posts'), limit(100));
      const querySnapshot = await getDocs(q);
      console.log(`⚠️  Could only retrieve ${querySnapshot.docs.length} posts for analysis`);
      return querySnapshot.docs.length;
    } catch (fallbackError) {
      console.error('❌ Fallback count also failed:', fallbackError.message);
      return 0;
    }
  }
}

async function analyzeAllMoralityPosts() {
  console.log('\n🧭 ANALYZING ALL MORALITY POSTS');
  console.log('==============================\n');

  try {
    const moralityQuery = query(
      collection(db, 'posts'),
      where('category', '==', 'morality')
    );

    const querySnapshot = await getDocs(moralityQuery);
    console.log(`📊 Found ${querySnapshot.docs.length} posts with category = 'morality'\n`);

    if (querySnapshot.docs.length === 0) {
      console.log('✅ No posts found with category = "morality"');
      return [];
    }

    // Analyze subreddits in morality category
    const subredditCounts = {};
    const samplePosts = [];

    querySnapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const subreddit = data.subreddit || 'UNKNOWN';
      
      subredditCounts[subreddit] = (subredditCounts[subreddit] || 0) + 1;
      
      if (samplePosts.length < 20) {
        samplePosts.push({
          id: docSnapshot.id,
          title: data.title,
          subreddit: data.subreddit,
          score: data.score
        });
      }
    });

    console.log('📈 Subreddits in morality category:');
    Object.entries(subredditCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([subreddit, count]) => {
        console.log(`   ${subreddit}: ${count} posts`);
      });

    console.log('\n📝 Sample morality posts:');
    samplePosts.forEach((post, i) => {
      console.log(`   ${i+1}. r/${post.subreddit} - "${post.title?.substring(0, 60)}..." (${post.score} pts)`);
    });

    return querySnapshot.docs;

  } catch (error) {
    console.error('❌ Error analyzing morality posts:', error.message);
    return [];
  }
}

async function searchForDevilContentEverywhere() {
  console.log('\n👿 SEARCHING FOR DEVIL CONTENT EVERYWHERE');
  console.log('=========================================\n');

  try {
    // Get all posts and search through them
    console.log('📄 Getting all posts to search for devil-related content...');
    
    let allDevilPosts = [];
    let hasMore = true;
    let lastDoc = null;
    const batchSize = 500;
    let totalSearched = 0;

    while (hasMore && totalSearched < 5500) { // Safety limit
      let q;
      if (lastDoc) {
        q = query(collection(db, 'posts'), startAfter(lastDoc), limit(batchSize));
      } else {
        q = query(collection(db, 'posts'), limit(batchSize));
      }

      const querySnapshot = await getDocs(q);
      const batchCount = querySnapshot.docs.length;
      totalSearched += batchCount;

      console.log(`   Searching batch ${Math.ceil(totalSearched / batchSize)} (${totalSearched} posts searched so far)...`);

      // Search for devil-related content in this batch
      querySnapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const searchFields = [
          data.title || '',
          data.subreddit || '',
          data.body || '',
          data.content || ''
        ].join(' ').toLowerCase();

        const devilKeywords = ['devil', 'amithe', 'amitd'];
        
        for (const keyword of devilKeywords) {
          if (searchFields.includes(keyword)) {
            allDevilPosts.push({
              id: docSnapshot.id,
              title: data.title,
              subreddit: data.subreddit,
              category: data.category,
              score: data.score,
              matchedKeyword: keyword,
              doc: docSnapshot
            });
            break; // Don't double-count
          }
        }
      });

      if (batchCount < batchSize) {
        hasMore = false;
      } else {
        lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      }
    }

    console.log(`\n📊 Found ${allDevilPosts.length} posts with devil-related content`);
    console.log(`🔍 Searched ${totalSearched} total posts\n`);

    if (allDevilPosts.length > 0) {
      console.log('📝 Devil-related posts found:');
      allDevilPosts.slice(0, 15).forEach((post, i) => {
        console.log(`   ${i+1}. r/${post.subreddit} (${post.category}) - "${post.title?.substring(0, 50)}..." [${post.matchedKeyword}]`);
      });
      
      if (allDevilPosts.length > 15) {
        console.log(`   ... and ${allDevilPosts.length - 15} more posts`);
      }
    }

    return allDevilPosts;

  } catch (error) {
    console.error('❌ Error searching for devil content:', error.message);
    return [];
  }
}

async function removeFoundPosts(postsToRemove) {
  if (postsToRemove.length === 0) {
    console.log('\n✅ No posts to remove!');
    return;
  }

  console.log(`\n🗑️  REMOVING ${postsToRemove.length} FOUND POSTS`);
  console.log('='.repeat(40));

  try {
    // Batch delete
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;

    postsToRemove.forEach((post) => {
      currentBatch.delete(doc(db, 'posts', post.id));
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

    console.log(`📦 Processing ${batches.length} batch(es)...`);

    for (let i = 0; i < batches.length; i++) {
      console.log(`   Executing batch ${i + 1}/${batches.length}...`);
      await batches[i].commit();
    }

    console.log(`\n✅ Successfully removed ${postsToRemove.length} posts!`);

  } catch (error) {
    console.error('❌ Error removing posts:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 COMPREHENSIVE DATABASE SEARCH & CLEANUP');
  console.log(`🔥 Firebase Project: ${process.env.REACT_APP_FIREBASE_PROJECT_ID}`);
  console.log('='.repeat(50));

  // Step 1: Verify total database size
  const totalPosts = await getTotalPostCount();

  // Step 2: Analyze all morality posts
  const moralityPosts = await analyzeAllMoralityPosts();

  // Step 3: Search entire database for devil-related content
  const devilPosts = await searchForDevilContentEverywhere();

  // Step 4: Remove all found devil-related posts
  if (devilPosts.length > 0) {
    console.log(`\n⚠️  Found ${devilPosts.length} devil-related posts to remove`);
    console.log('Proceeding with removal...');
    await removeFoundPosts(devilPosts);
  }

  console.log('\n🎯 COMPREHENSIVE CLEANUP COMPLETED!');
  console.log('===================================');
  console.log(`📊 Total posts searched: ${totalPosts}`);
  console.log(`🧭 Morality posts found: ${moralityPosts.length}`);
  console.log(`👿 Devil posts removed: ${devilPosts.length}`);
  console.log('\n📱 Check your React app - morality category should now be clean!');
}

// Run the script
main().catch(console.error); 