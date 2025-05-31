/**
 * Verify Subreddit Sync - Check if all database subreddits are configured in the app
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, getDocs, limit, startAfter } = require('firebase/firestore');
const fs = require('fs').promises;
const path = require('path');

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

async function verifySubredditSync() {
  console.log('🔍 VERIFYING SUBREDDIT SYNC');
  console.log('='.repeat(50));

  try {
    // Step 1: Get all subreddits from database
    console.log('📊 Step 1: Scanning database for all subreddits...');
    const databaseSubreddits = await getDatabaseSubreddits();
    
    // Step 2: Get configured subreddits from config file
    console.log('\n📋 Step 2: Reading subreddit configuration...');
    const configuredSubreddits = await getConfiguredSubreddits();
    
    // Step 3: Compare and find mismatches
    console.log('\n🔍 Step 3: Comparing database vs configuration...');
    const analysis = compareSubreddits(databaseSubreddits, configuredSubreddits);
    
    // Step 4: Report results
    console.log('\n📈 SYNC ANALYSIS RESULTS');
    console.log('='.repeat(30));
    
    console.log(`✅ Database subreddits: ${databaseSubreddits.length}`);
    console.log(`📋 Configured subreddits: ${configuredSubreddits.length}`);
    console.log(`🔄 Perfect matches: ${analysis.matches.length}`);
    console.log(`❌ In database but NOT configured: ${analysis.inDbNotConfigured.length}`);
    console.log(`⚠️  Configured but NOT in database: ${analysis.configuredNotInDb.length}`);

    // Show details for issues
    if (analysis.inDbNotConfigured.length > 0) {
      console.log('\n❌ SUBREDDITS IN DATABASE BUT NOT CONFIGURED:');
      console.log('-'.repeat(50));
      analysis.inDbNotConfigured.forEach((sub, i) => {
        console.log(`   ${i+1}. r/${sub.name} (${sub.count} posts, category: ${sub.category})`);
      });
      console.log('\n💡 These subreddits have posts but won\'t appear in your app filters!');
    }

    if (analysis.configuredNotInDb.length > 0) {
      console.log('\n⚠️  CONFIGURED SUBREDDITS WITHOUT POSTS:');
      console.log('-'.repeat(50));
      analysis.configuredNotInDb.forEach((sub, i) => {
        console.log(`   ${i+1}. r/${sub.name} (configured as: ${sub.category})`);
      });
      console.log('\n💡 These are configured but have no posts yet.');
    }

    if (analysis.matches.length > 0) {
      console.log('\n✅ PROPERLY SYNCED SUBREDDITS:');
      console.log('-'.repeat(40));
      analysis.matches.slice(0, 10).forEach((sub, i) => {
        console.log(`   ${i+1}. r/${sub.name} (${sub.count} posts, ${sub.category})`);
      });
      if (analysis.matches.length > 10) {
        console.log(`   ... and ${analysis.matches.length - 10} more`);
      }
    }

    // Summary and recommendations
    console.log('\n🎯 SUMMARY & RECOMMENDATIONS:');
    console.log('='.repeat(40));
    
    if (analysis.inDbNotConfigured.length === 0 && analysis.configuredNotInDb.length === 0) {
      console.log('🎉 PERFECT SYNC! All database subreddits are properly configured.');
      console.log('   Your app will show all available content.');
    } else {
      console.log('🔧 ACTION NEEDED:');
      
      if (analysis.inDbNotConfigured.length > 0) {
        console.log(`   • Add ${analysis.inDbNotConfigured.length} missing subreddits to configuration`);
        console.log('   • This will make their posts appear in your app');
      }
      
      if (analysis.configuredNotInDb.length > 0) {
        console.log(`   • ${analysis.configuredNotInDb.length} configured subreddits need posts`);
        console.log('   • Consider scraping these or removing from config');
      }
    }

    return analysis;

  } catch (error) {
    console.error('❌ Error verifying subreddit sync:', error.message);
    throw error;
  }
}

async function getDatabaseSubreddits() {
  const subredditCounts = {};
  const subredditCategories = {};
  let lastDoc = null;
  let batchCount = 0;

  console.log('   Scanning posts in database...');

  while (true) {
    batchCount++;
    console.log(`   📄 Processing batch ${batchCount}...`);

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
      const subreddit = data.subreddit;
      const category = data.category || 'unknown';
      
      subredditCounts[subreddit] = (subredditCounts[subreddit] || 0) + 1;
      subredditCategories[subreddit] = category;
    });

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  }

  const result = Object.keys(subredditCounts).map(name => ({
    name,
    count: subredditCounts[name],
    category: subredditCategories[name]
  })).sort((a, b) => b.count - a.count);

  console.log(`   ✅ Found ${result.length} unique subreddits in database`);
  return result;
}

async function getConfiguredSubreddits() {
  try {
    const configPath = path.join(__dirname, 'subreddit-config.js');
    const configContent = await fs.readFile(configPath, 'utf8');
    
    // Extract subreddit configurations using regex
    const subredditMatches = configContent.matchAll(/{\s*name:\s*'([^']+)',\s*display_name:\s*'([^']*)',\s*category:\s*'([^']+)',\s*description:\s*'([^']*)',\s*priority:\s*(\d+)\s*}/g);
    
    const result = [];
    for (const match of subredditMatches) {
      result.push({
        name: match[1],
        display_name: match[2],
        category: match[3],
        description: match[4],
        priority: parseInt(match[5])
      });
    }

    console.log(`   ✅ Found ${result.length} configured subreddits`);
    return result;

  } catch (error) {
    console.error('   ❌ Error reading subreddit config:', error.message);
    return [];
  }
}

function compareSubreddits(databaseSubreddits, configuredSubreddits) {
  const dbNames = new Set(databaseSubreddits.map(s => s.name));
  const configNames = new Set(configuredSubreddits.map(s => s.name));

  const matches = [];
  const inDbNotConfigured = [];
  const configuredNotInDb = [];

  // Find matches and missing configurations
  databaseSubreddits.forEach(dbSub => {
    if (configNames.has(dbSub.name)) {
      matches.push(dbSub);
    } else {
      inDbNotConfigured.push(dbSub);
    }
  });

  // Find configured but missing from database
  configuredSubreddits.forEach(configSub => {
    if (!dbNames.has(configSub.name)) {
      configuredNotInDb.push(configSub);
    }
  });

  return {
    matches: matches.sort((a, b) => b.count - a.count),
    inDbNotConfigured: inDbNotConfigured.sort((a, b) => b.count - a.count),
    configuredNotInDb: configuredNotInDb.sort((a, b) => a.name.localeCompare(b.name))
  };
}

// Run the verification
verifySubredditSync().catch(console.error); 