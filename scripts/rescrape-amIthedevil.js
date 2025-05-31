#!/usr/bin/env node

/**
 * RESCRAPE AMITTHEDEVIL WITH CROSSPOST DETECTION
 * 
 * This script rescapes AmItheDevil posts using the enhanced scraper
 * to capture crosspost metadata and update the database
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, deleteDoc, getDocs, query, where } = require('firebase/firestore');
const RedditScraper = require('./reddit-scraper');
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

async function rescrapeAmItheDevil() {
  console.log('🚀 RESCRAPING AMITTHEDEVIL WITH CROSSPOST DETECTION');
  console.log('=====================================================\n');

  const subreddit = 'AmItheDevil';
  const targetPosts = 100; // Start with a reasonable batch

  try {
    // Initialize enhanced scraper
    console.log('🔧 Initializing enhanced Reddit scraper...');
    const scraper = new RedditScraper();

    // Check existing posts in database
    console.log('📊 Checking existing AmItheDevil posts in database...');
    const existingQuery = query(collection(db, 'posts'), where('subreddit', '==', subreddit));
    const existingSnapshot = await getDocs(existingQuery);
    
    const existingPosts = [];
    existingSnapshot.forEach(doc => {
      existingPosts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`📈 Found ${existingPosts.length} existing AmItheDevil posts in database`);
    
    // Check if any already have crosspost data
    const postsWithCrosspostData = existingPosts.filter(post => 
      post.hasOwnProperty('is_crosspost')
    );
    console.log(`🔗 ${postsWithCrosspostData.length} posts already have crosspost metadata`);

    // Scrape fresh posts with enhanced metadata
    console.log(`\n🏗️  Scraping ${targetPosts} fresh AmItheDevil posts with crosspost detection...`);
    const freshPosts = await scraper.scrapeSubreddit(subreddit, targetPosts);

    if (freshPosts.length === 0) {
      console.log('⚠️  No posts scraped. Check your Reddit API credentials.');
      return;
    }

    // Analyze the fresh data
    const crosspostCount = freshPosts.filter(post => post.is_crosspost).length;
    const crosspostPercentage = Math.round((crosspostCount / freshPosts.length) * 100);
    
    console.log(`\n📊 FRESH SCRAPING RESULTS:`);
    console.log(`   Total posts: ${freshPosts.length}`);
    console.log(`   Crossposts detected: ${crosspostCount} (${crosspostPercentage}%)`);

    // Show crosspost sources
    const crosspostSources = new Map();
    freshPosts.filter(post => post.is_crosspost).forEach(post => {
      const source = post.crosspost_parent_subreddit;
      if (source) {
        crosspostSources.set(source, (crosspostSources.get(source) || 0) + 1);
      }
    });

    if (crosspostSources.size > 0) {
      console.log(`\n🎯 CROSSPOST SOURCES:`);
      Array.from(crosspostSources.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([subreddit, count]) => {
          console.log(`   r/${subreddit}: ${count} posts`);
        });
    }

    // Ask user if they want to proceed with database update
    console.log(`\n💾 DATABASE UPDATE OPTIONS:`);
    console.log(`1. Replace all existing AmItheDevil posts with fresh data`);
    console.log(`2. Add crosspost metadata to existing posts (merge approach)`);
    console.log(`3. Save fresh data to a new collection for comparison`);
    console.log(`4. Exit without updating database\n`);

    // For automation, let's go with option 2 (merge approach)
    console.log(`🔧 Proceeding with merge approach - adding crosspost metadata to existing posts...`);

    // Create a map of fresh posts by Reddit ID for efficient lookup
    const freshPostsMap = new Map();
    freshPosts.forEach(post => {
      freshPostsMap.set(post.id, post);
    });

    let updatedCount = 0;
    let addedCount = 0;

    // Update existing posts with crosspost metadata
    for (const existingPost of existingPosts) {
      const freshPost = freshPostsMap.get(existingPost.id);
      
      if (freshPost) {
        // Update existing post with crosspost metadata
        const updatedPost = {
          ...existingPost,
          is_crosspost: freshPost.is_crosspost,
          crosspost_parent_id: freshPost.crosspost_parent_id,
          crosspost_parent_subreddit: freshPost.crosspost_parent_subreddit,
          crosspost_parent_title: freshPost.crosspost_parent_title,
          crosspost_chain_length: freshPost.crosspost_chain_length,
          num_crossposts: freshPost.num_crossposts,
          updated_at: new Date().toISOString()
        };

        await setDoc(doc(db, 'posts', existingPost.id), updatedPost);
        updatedCount++;
        
        if (freshPost.is_crosspost) {
          console.log(`   ✅ Updated ${existingPost.id}: Added crosspost data (r/${freshPost.crosspost_parent_subreddit})`);
        }
      }
    }

    // Add new posts that don't exist in database
    for (const freshPost of freshPosts) {
      const existsInDb = existingPosts.some(existing => existing.id === freshPost.id);
      
      if (!existsInDb) {
        await setDoc(doc(db, 'posts', freshPost.id), freshPost);
        addedCount++;
        
        if (freshPost.is_crosspost) {
          console.log(`   ➕ Added new post ${freshPost.id}: Crosspost from r/${freshPost.crosspost_parent_subreddit}`);
        }
      }
    }

    // Final summary
    console.log(`\n🎉 RESCRAPING COMPLETED!`);
    console.log(`========================`);
    console.log(`📊 Results:`);
    console.log(`   • Updated existing posts: ${updatedCount}`);
    console.log(`   • Added new posts: ${addedCount}`);
    console.log(`   • Total posts in database: ${existingPosts.length + addedCount}`);
    console.log(`   • Crosspost detection: ✅ ACTIVE`);
    
    console.log(`\n🚀 Your mobile app now has enhanced crosspost information!`);
    console.log(`✨ Users can see original sources for crossposted content.`);

  } catch (error) {
    console.error('❌ Rescraping failed:', error);
    process.exit(1);
  }
}

// Run the rescraping
rescrapeAmItheDevil().then(() => {
  console.log('\n✅ Rescraping process completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Rescraping process failed:', error);
  process.exit(1);
}); 