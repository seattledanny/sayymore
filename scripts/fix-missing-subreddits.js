/**
 * Fix Missing Subreddits - Add all database subreddits to app configuration
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

async function fixMissingSubreddits() {
  console.log('🔧 FIXING MISSING SUBREDDITS');
  console.log('='.repeat(50));

  try {
    // Step 1: Get all subreddits from database
    console.log('📊 Step 1: Scanning database for all subreddits...');
    const databaseSubreddits = await getDatabaseSubreddits();
    
    // Step 2: Get configured subreddits from config file
    console.log('\n📋 Step 2: Reading current subreddit configuration...');
    const { configuredSubreddits, configContent } = await getConfiguredSubreddits();
    
    // Step 3: Find missing subreddits
    console.log('\n🔍 Step 3: Finding missing subreddits...');
    const missingSubreddits = findMissingSubreddits(databaseSubreddits, configuredSubreddits);
    
    if (missingSubreddits.length === 0) {
      console.log('✅ No missing subreddits found! All database subreddits are configured.');
      return;
    }

    console.log(`❗ Found ${missingSubreddits.length} missing subreddits:`);
    missingSubreddits.forEach((sub, i) => {
      console.log(`   ${i+1}. r/${sub.name} (${sub.count} posts, category: ${sub.category})`);
    });

    // Step 4: Add missing subreddits to configuration
    console.log('\n📝 Step 4: Adding missing subreddits to configuration...');
    const updatedConfigContent = addMissingSubredditsToConfig(configContent, missingSubreddits);
    
    // Step 5: Write updated configuration
    console.log('\n💾 Step 5: Saving updated configuration...');
    await saveUpdatedConfig(updatedConfigContent);
    
    console.log('\n✅ SUCCESS! Configuration updated.');
    console.log(`📊 Added ${missingSubreddits.length} new subreddits to configuration`);
    console.log(`🎯 Total posts now accessible: ${databaseSubreddits.reduce((sum, sub) => sum + sub.count, 0)}`);
    
    // Generate summary
    console.log('\n📈 SUMMARY BY CATEGORY:');
    console.log('-'.repeat(30));
    const categoryStats = {};
    missingSubreddits.forEach(sub => {
      categoryStats[sub.category] = (categoryStats[sub.category] || 0) + 1;
    });
    
    Object.entries(categoryStats).sort((a, b) => b[1] - a[1]).forEach(([category, count]) => {
      console.log(`   ${category}: +${count} subreddits`);
    });

    console.log('\n🔄 RESTART YOUR APP to see the new subreddits in the filters!');

  } catch (error) {
    console.error('❌ Error fixing missing subreddits:', error.message);
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
      const category = data.category || 'misc';
      
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
    
    const configuredSubreddits = [];
    for (const match of subredditMatches) {
      configuredSubreddits.push({
        name: match[1],
        display_name: match[2],
        category: match[3],
        description: match[4],
        priority: parseInt(match[5])
      });
    }

    console.log(`   ✅ Found ${configuredSubreddits.length} configured subreddits`);
    return { configuredSubreddits, configContent };

  } catch (error) {
    console.error('   ❌ Error reading subreddit config:', error.message);
    throw error;
  }
}

function findMissingSubreddits(databaseSubreddits, configuredSubreddits) {
  const configNames = new Set(configuredSubreddits.map(s => s.name));
  
  return databaseSubreddits.filter(dbSub => !configNames.has(dbSub.name));
}

function addMissingSubredditsToConfig(configContent, missingSubreddits) {
  // Find the end of the subredditConfigs array (before the closing bracket)
  const lastBracketIndex = configContent.lastIndexOf('];');
  
  if (lastBracketIndex === -1) {
    throw new Error('Could not find end of subredditConfigs array');
  }

  // Generate configurations for missing subreddits
  const newConfigs = missingSubreddits.map(sub => {
    const displayName = formatDisplayName(sub.name);
    const description = generateDescription(sub.name, sub.category);
    const priority = generatePriority(sub.category, sub.count);
    
    return `  {
    name: '${sub.name}',
    display_name: '${displayName}',
    category: '${sub.category}',
    description: '${description}',
    priority: ${priority}
  }`;
  }).join(',\n');

  // Insert new configurations before the closing bracket
  const beforeClosing = configContent.substring(0, lastBracketIndex);
  const afterClosing = configContent.substring(lastBracketIndex);
  
  // Add comma if there are existing entries
  const needsComma = beforeClosing.trim().endsWith('}');
  const separator = needsComma ? ',\n' : '';
  
  return beforeClosing + separator + newConfigs + '\n' + afterClosing;
}

function formatDisplayName(subredditName) {
  // Convert subreddit names to readable display names
  const specialCases = {
    'getmotivated': 'Get Motivated',
    'EntitledPeople': 'Entitled People',
    'povertyfinance': 'Poverty Finance',
    'LetsNotMeet': "Let's Not Meet",
    'careerguidance': 'Career Guidance',
    'StudentLoans': 'Student Loans',
    'socialskills': 'Social Skills',
    'survivinginfidelity': 'Surviving Infidelity',
    'financialindependence': 'Financial Independence',
    'DeadBedrooms': 'Dead Bedrooms',
    'CreditCards': 'Credit Cards',
    'dating_advice': 'Dating Advice',
    'LifeAdvice': 'Life Advice',
    'weddingplanning': 'Wedding Planning',
    'raisedbynarcissists': 'Raised by Narcissists',
    'BadRoommates': 'Bad Roommates',
    'datingoverthirty': 'Dating Over Thirty',
    'antiwork': 'Antiwork',
    'UnethicalLifeProTips': 'Unethical Life Pro Tips',
    'insaneparents': 'Insane Parents',
    'neighborsfromhell': 'Neighbors from Hell',
    'TalesFromRetail': 'Tales from Retail',
    'NuclearRevenge': 'Nuclear Revenge',
    'TalesFromTheFrontDesk': 'Tales from the Front Desk',
    'internetparents': 'Internet Parents',
    'DecidingToBeBetter': 'Deciding to be Better',
    'JUSTNOFAMILY': 'Just No Family',
    'weddingdrama': 'Wedding Drama',
    'HobbyDrama': 'Hobby Drama',
    'BestofRedditorUpdates': 'Best of Redditor Updates',
    'bridezilla': 'Bridezilla',
    'ProRevenge': 'Pro Revenge',
    'needadvice': 'Need Advice',
    'weddingstories': 'Wedding Stories'
  };

  return specialCases[subredditName] || 
         subredditName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
}

function generateDescription(subredditName, category) {
  const descriptions = {
    'getmotivated': 'Motivational content and success stories',
    'EntitledPeople': 'Stories about entitled behavior',
    'povertyfinance': 'Financial advice for low income situations',
    'LetsNotMeet': 'True scary encounter stories',
    'careerguidance': 'Professional career advice and guidance',
    'StudentLoans': 'Student loan advice and experiences',
    'socialskills': 'Tips for improving social interactions',
    'survivinginfidelity': 'Support for dealing with infidelity',
    'financialindependence': 'Path to financial freedom discussions',
    'DeadBedrooms': 'Relationship intimacy issues',
    'CreditCards': 'Credit card advice and strategies',
    'dating_advice': 'Dating tips and relationship guidance',
    'LifeAdvice': 'General life advice and wisdom',
    'weddingplanning': 'Wedding planning tips and advice',
    'raisedbynarcissists': 'Support for children of narcissistic parents',
    'BadRoommates': 'Terrible roommate experiences',
    'datingoverthirty': 'Dating advice for mature adults',
    'wedding': 'Wedding experiences and advice',
    'antiwork': 'Work culture criticism and alternatives',
    'UnethicalLifeProTips': 'Morally questionable life advice',
    'insaneparents': 'Stories of unreasonable parental behavior',
    'neighborsfromhell': 'Terrible neighbor experiences',
    'TalesFromRetail': 'Retail worker stories and experiences',
    'NuclearRevenge': 'Extreme revenge stories',
    'TalesFromTheFrontDesk': 'Hotel front desk worker stories',
    'internetparents': 'Parental advice from internet community',
    'DecidingToBeBetter': 'Self-improvement and personal growth',
    'JUSTNOFAMILY': 'Difficult family relationship support',
    'weddingdrama': 'Wedding-related conflicts and drama',
    'HobbyDrama': 'Drama within hobby communities',
    'BestofRedditorUpdates': 'Follow-up stories from Reddit posts',
    'bridezilla': 'Demanding bride behavior stories',
    'ProRevenge': 'Professional-level revenge stories',
    'needadvice': 'Seeking advice on various life issues',
    'weddingstories': 'Wedding day experiences and stories'
  };

  return descriptions[subredditName] || `${category} discussions and stories`;
}

function generatePriority(category, count) {
  // Higher count = higher priority, but also consider category importance
  const basePriority = Math.min(Math.floor(count / 10), 50);
  
  const categoryBonus = {
    'advice': 10,
    'relationships': 8,
    'stories': 6,
    'workplace': 6,
    'finance': 8,
    'family': 7,
    'wedding': 5,
    'revenge': 4,
    'drama': 4,
    'creepy': 3,
    'controversial': 2
  };

  return basePriority + (categoryBonus[category] || 0);
}

async function saveUpdatedConfig(updatedContent) {
  const configPath = path.join(__dirname, 'subreddit-config.js');
  const backupPath = path.join(__dirname, 'subreddit-config.backup.js');
  
  // Create backup
  const originalContent = await fs.readFile(configPath, 'utf8');
  await fs.writeFile(backupPath, originalContent, 'utf8');
  console.log('   📋 Created backup: subreddit-config.backup.js');
  
  // Write updated content
  await fs.writeFile(configPath, updatedContent, 'utf8');
  console.log('   ✅ Updated: subreddit-config.js');
}

// Run the fix
fixMissingSubreddits().catch(console.error); 