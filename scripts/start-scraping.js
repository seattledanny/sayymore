/**
 * Simple script to start scraping Reddit and storing in Firebase
 */

const RedditScraper = require('./reddit-scraper');
const { getSubredditNames } = require('./subreddit-config');
const { initializeFirebase, batchWritePosts, testFirebaseConnection } = require('./firebase-client-scraper');
require('dotenv').config();

async function startScraping() {
  console.log('🚀 Reddit Conversation Scraper - Phase 3!');
  console.log('==========================================\n');

  // Test Firebase connection first
  console.log('🔥 Testing Firebase connection...');
  const firebaseOk = await testFirebaseConnection();
  
  if (!firebaseOk) {
    console.log('❌ Firebase connection failed. Please check your configuration.');
    return;
  }

  const scraper = new RedditScraper();
  const db = initializeFirebase();

  // Get priority 1 subreddits (highest quality)
  const subreddits = getSubredditNames(1);
  console.log(`📋 Target subreddits (Priority 1): ${subreddits.join(', ')}\n`);

  let totalPosts = 0;
  let totalComments = 0;

  for (let i = 0; i < subreddits.length; i++) {
    const subreddit = subreddits[i];
    
    console.log(`\n📈 Progress: ${i + 1}/${subreddits.length} - r/${subreddit}`);
    console.log('='.repeat(50));

    try {
      // Scrape posts (smaller batch for testing)
      const posts = await scraper.scrapeSubreddit(subreddit, 50);
      
      if (posts.length === 0) {
        console.log(`⚠️  No posts collected from r/${subreddit}`);
        continue;
      }

      // Store in Firebase
      console.log(`💾 Storing ${posts.length} posts in Firebase...`);
      await batchWritePosts(posts, db);
      
      const commentCount = posts.reduce((sum, post) => sum + post.comments.length, 0);
      totalPosts += posts.length;
      totalComments += commentCount;

      console.log(`✅ r/${subreddit} complete: ${posts.length} posts, ${commentCount} comments`);
      console.log(`📊 Running totals: ${totalPosts} posts, ${totalComments} comments`);

    } catch (error) {
      console.error(`❌ Error with r/${subreddit}:`, error.message);
    }
  }

  console.log('\n🎉 SCRAPING SESSION COMPLETE!');
  console.log('=============================');
  console.log(`📄 Total posts stored: ${totalPosts}`);
  console.log(`💬 Total comments stored: ${totalComments}`);
  console.log(`📊 Firebase project: ${process.env.REACT_APP_FIREBASE_PROJECT_ID}`);
  console.log(`🌐 View in console: https://console.firebase.google.com/project/${process.env.REACT_APP_FIREBASE_PROJECT_ID}/firestore`);
}

// Run if called directly
if (require.main === module) {
  startScraping().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = startScraping; 