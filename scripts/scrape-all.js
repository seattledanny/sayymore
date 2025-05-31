#!/usr/bin/env node
/**
 * Main Reddit Scraping Orchestrator
 * Coordinates the entire scraping process from authentication to data storage
 */

const RedditScraper = require('./reddit-scraper');
const { getSubredditNames } = require('./subreddit-config');
const { 
  initializeFirebaseAdmin,
  batchWritePosts,
  writeSubredditMetadata,
  postExists,
  getPostCount 
} = require('./firebase-admin');
require('dotenv').config();

class ScrapingOrchestrator {
  constructor() {
    this.scraper = new RedditScraper();
    this.db = null;
    this.stats = {
      startTime: null,
      endTime: null,
      totalPosts: 0,
      totalComments: 0,
      subredditsProcessed: 0,
      errors: []
    };
  }

  /**
   * Initialize Firebase Admin connection
   */
  async initializeDatabase() {
    console.log('🔥 Initializing Firebase Admin...');
    
    try {
      this.db = initializeFirebaseAdmin();
      console.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin:', error.message);
      throw error;
    }
  }

  /**
   * Authenticate with Google Cloud for Firebase Admin access
   */
  async authenticateGoogleCloud() {
    console.log('🔐 Setting up Google Cloud authentication...');
    
    // Check if gcloud is authenticated
    const { exec } = require('child_process');
    
    return new Promise((resolve, reject) => {
      exec('gcloud auth application-default print-access-token', (error, stdout, stderr) => {
        if (error) {
          console.log('❌ Google Cloud authentication required');
          console.log('Please run: gcloud auth application-default login');
          console.log('This allows the script to write to Firestore with admin privileges');
          reject(new Error('Google Cloud authentication required'));
        } else {
          console.log('✅ Google Cloud authentication verified');
          resolve();
        }
      });
    });
  }

  /**
   * Scrape a single subreddit and store posts
   * @param {string} subreddit - Subreddit name
   * @param {number} targetCount - Target number of posts
   * @returns {Promise<Object>} Results summary
   */
  async scrapeAndStoreSubreddit(subreddit, targetCount = 200) {
    console.log(`\n🎯 Starting ${subreddit} scraping and storage...`);

    const results = {
      subreddit,
      postsScraped: 0,
      postsStored: 0,
      commentsStored: 0,
      errors: []
    };

    try {
      // Check existing post count
      const existingCount = await getPostCount(subreddit, this.db);
      console.log(`📊 Existing posts in r/${subreddit}: ${existingCount}`);

      if (existingCount >= targetCount) {
        console.log(`⏭️  Skipping r/${subreddit} - already has ${existingCount} posts`);
        return results;
      }

      // Scrape posts
      const posts = await this.scraper.scrapeSubreddit(subreddit, targetCount);
      results.postsScraped = posts.length;

      if (posts.length === 0) {
        console.log(`⚠️  No posts scraped from r/${subreddit}`);
        return results;
      }

      // Filter out existing posts
      const newPosts = [];
      for (const post of posts) {
        const exists = await postExists(post.id, this.db);
        if (!exists) {
          newPosts.push(post);
        }
      }

      console.log(`📝 New posts to store: ${newPosts.length}/${posts.length}`);

      if (newPosts.length === 0) {
        console.log(`⏭️  All posts from r/${subreddit} already exist in database`);
        return results;
      }

      // Store posts in batches (Firestore batch limit is 500)
      const batchSize = 100;
      for (let i = 0; i < newPosts.length; i += batchSize) {
        const batch = newPosts.slice(i, i + batchSize);
        
        console.log(`💾 Storing batch ${Math.floor(i/batchSize) + 1}: ${batch.length} posts`);
        
        try {
          await batchWritePosts(batch, this.db);
          results.postsStored += batch.length;
          
          // Count comments
          const commentsInBatch = batch.reduce((sum, post) => sum + post.comments.length, 0);
          results.commentsStored += commentsInBatch;
          
          console.log(`✅ Batch stored successfully (${batch.length} posts, ${commentsInBatch} comments)`);
        } catch (error) {
          console.error(`❌ Failed to store batch:`, error.message);
          results.errors.push(`Batch storage failed: ${error.message}`);
        }
      }

      // Update subreddit metadata
      const subredditMetadata = {
        name: subreddit,
        display_name: subreddit,
        last_scraped: new Date().toISOString(),
        post_count: results.postsStored,
        total_posts: existingCount + results.postsStored
      };

      await writeSubredditMetadata(subredditMetadata, this.db);

      console.log(`🎉 Completed r/${subreddit}: ${results.postsStored} posts, ${results.commentsStored} comments stored`);

    } catch (error) {
      console.error(`❌ Error processing r/${subreddit}:`, error.message);
      results.errors.push(error.message);
    }

    return results;
  }

  /**
   * Main scraping orchestration
   * @param {Object} options - Scraping options
   */
  async orchestrate(options = {}) {
    const {
      maxPriority = 2,
      postsPerSubreddit = 200,
      testMode = false,
      includeSubreddits = null,
      excludeSubreddits = []
    } = options;

    this.stats.startTime = new Date();
    
    console.log('🚀 Reddit Conversation Scraper Starting!');
    console.log('=====================================');

    try {
      // Setup
      await this.authenticateGoogleCloud();
      await this.initializeDatabase();

      // Get subreddit list
      let subreddits = includeSubreddits || getSubredditNames(maxPriority);
      
      // Apply exclusions
      subreddits = subreddits.filter(sub => !excludeSubreddits.includes(sub));

      if (testMode) {
        console.log('🧪 TEST MODE: Limiting to first 2 subreddits');
        subreddits = subreddits.slice(0, 2);
      }

      console.log(`📋 Target subreddits (${subreddits.length}):`, subreddits.join(', '));

      // Show estimated stats
      const stats = this.scraper.getScrapingStats(subreddits);
      console.log('\n📊 Estimated Scraping Stats:');
      console.log(`   • Subreddits: ${stats.totalSubreddits}`);
      console.log(`   • Posts per subreddit: ${stats.postsPerSubreddit}`);
      console.log(`   • Total posts: ~${stats.estimatedTotalPosts}`);
      console.log(`   • Total comments: ~${stats.estimatedTotalComments}`);
      console.log(`   • Estimated time: ~${stats.estimatedTimeMinutes} minutes`);

      // Process each subreddit
      for (let i = 0; i < subreddits.length; i++) {
        const subreddit = subreddits[i];
        
        console.log(`\n📈 Progress: ${i + 1}/${subreddits.length} subreddits`);
        
        const result = await this.scrapeAndStoreSubreddit(subreddit, postsPerSubreddit);
        
        // Update overall stats
        this.stats.totalPosts += result.postsStored;
        this.stats.totalComments += result.commentsStored;
        this.stats.subredditsProcessed++;
        this.stats.errors.push(...result.errors);

        // Progress summary
        console.log(`📊 Running totals: ${this.stats.totalPosts} posts, ${this.stats.totalComments} comments`);
      }

      this.stats.endTime = new Date();
      this.printFinalSummary();

    } catch (error) {
      console.error('💥 Critical error in orchestration:', error.message);
      this.stats.errors.push(`Critical: ${error.message}`);
      this.stats.endTime = new Date();
      this.printFinalSummary();
      process.exit(1);
    }
  }

  /**
   * Print final summary of scraping results
   */
  printFinalSummary() {
    const duration = this.stats.endTime - this.stats.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    console.log('\n🏆 SCRAPING COMPLETE!');
    console.log('====================');
    console.log(`⏱️  Duration: ${minutes}m ${seconds}s`);
    console.log(`📄 Posts stored: ${this.stats.totalPosts}`);
    console.log(`💬 Comments stored: ${this.stats.totalComments}`);
    console.log(`📂 Subreddits processed: ${this.stats.subredditsProcessed}`);
    
    if (this.stats.errors.length > 0) {
      console.log(`⚠️  Errors encountered: ${this.stats.errors.length}`);
      this.stats.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    } else {
      console.log('✅ No errors encountered!');
    }

    // Database summary
    console.log('\n📊 Database Status:');
    console.log(`   Firestore project: ${process.env.REACT_APP_FIREBASE_PROJECT_ID}`);
    console.log(`   Posts collection: Ready for React app`);
    console.log(`   URL: https://console.firebase.google.com/project/${process.env.REACT_APP_FIREBASE_PROJECT_ID}/firestore`);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const options = {
    testMode: args.includes('--test'),
    maxPriority: args.includes('--priority-1') ? 1 : 2
  };

  // Add specific subreddits if provided
  const subredditIndex = args.indexOf('--subreddits');
  if (subredditIndex !== -1 && args[subredditIndex + 1]) {
    options.includeSubreddits = args[subredditIndex + 1].split(',');
  }

  const orchestrator = new ScrapingOrchestrator();
  orchestrator.orchestrate(options).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = ScrapingOrchestrator; 