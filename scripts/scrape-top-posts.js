/**
 * TOP Posts Scraper - Harvest legendary conversation starters
 * Adds top-rated posts from 'year' and 'all' time periods
 */

const axios = require('axios');
const RedditScraper = require('./reddit-scraper');
const { getSubredditNames } = require('./subreddit-config');
const { initializeFirebase, batchWritePosts, testFirebaseConnection } = require('./firebase-client-scraper');
const { collection, getDocs, doc, getDoc } = require('firebase/firestore');
require('dotenv').config();

class TopPostsScraper extends RedditScraper {
  constructor() {
    super();
    this.db = null;
  }

  /**
   * Enhanced fetch that includes time parameter for top posts
   */
  async fetchTopPosts(subreddit, limit = 100, timeframe = 'year', after = null) {
    const token = await this.getAccessToken();
    await this.rateLimitDelay();

    try {
      const params = { 
        limit,
        t: timeframe // 'hour', 'day', 'week', 'month', 'year', 'all'
      };
      if (after) params.after = after;

      const response = await axios.get(
        `https://oauth.reddit.com/r/${subreddit}/top`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': this.userAgent
          },
          params
        }
      );

      return {
        posts: response.data.data.children,
        after: response.data.data.after
      };
    } catch (error) {
      console.error(`❌ Failed to fetch top posts from r/${subreddit}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Check if a post already exists in our database
   */
  async postExists(postId) {
    try {
      const postRef = doc(this.db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      return postDoc.exists();
    } catch (error) {
      console.error('Error checking post existence:', error);
      return false;
    }
  }

  /**
   * Scrape top posts with duplicate checking
   */
  async scrapeTopSubreddit(subreddit, targetCount = 50, timeframe = 'year') {
    console.log(`\n🏆 Starting TOP scrape: r/${subreddit} (${timeframe}) - target: ${targetCount} posts`);
    
    const collectedPosts = [];
    let after = null;
    let attempts = 0;
    const maxAttempts = 10;
    let duplicatesSkipped = 0;

    while (collectedPosts.length < targetCount && attempts < maxAttempts) {
      attempts++;
      console.log(`📄 Fetching TOP batch ${attempts} from r/${subreddit} (${timeframe})...`);

      try {
        const result = await this.fetchTopPosts(subreddit, 100, timeframe, after);
        const posts = result.posts;
        after = result.after;

        if (!posts || posts.length === 0) {
          console.log(`⚠️  No more TOP posts available in r/${subreddit} (${timeframe})`);
          break;
        }

        for (const postWrapper of posts) {
          if (collectedPosts.length >= targetCount) break;

          const post = postWrapper.data;
          
          // Check if we already have this post
          const exists = await this.postExists(post.id);
          if (exists) {
            duplicatesSkipped++;
            continue;
          }

          // Apply same quality filters
          if (post.score < this.minScore) {
            continue;
          }

          if (post.removed_by_category || post.banned_by || !post.title) {
            continue;
          }

          console.log(`🏆 Processing TOP (${timeframe}): "${post.title.substring(0, 50)}..." (Score: ${post.score})`);

          // Fetch comments
          const comments = await this.fetchPostComments(subreddit, post.id, this.commentsPerPost);
          const processedComments = this.processComments(comments);

          // Create post object with TOP designation
          const processedPost = {
            id: post.id,
            title: post.title,
            body: post.selftext || '',
            author: post.author,
            subreddit: subreddit,
            url: `https://reddit.com${post.permalink}`,
            permalink: post.permalink,
            score: post.score,
            num_comments: post.num_comments,
            created_utc: post.created_utc,
            scraped_at: new Date().toISOString(),
            post_type: `top_${timeframe}`, // Mark as top post
            comments: processedComments
          };

          collectedPosts.push(processedPost);
          console.log(`✅ Collected TOP post ${collectedPosts.length}/${targetCount} (Score: ${post.score}, Comments: ${processedComments.length})`);
        }

        if (!after) {
          console.log(`⚠️  Reached end of TOP posts in r/${subreddit} (${timeframe})`);
          break;
        }

      } catch (error) {
        console.error(`❌ Error in TOP batch ${attempts} for r/${subreddit}:`, error.message);
      }
    }

    console.log(`🎉 Completed TOP scraping r/${subreddit} (${timeframe}): ${collectedPosts.length} posts, ${duplicatesSkipped} duplicates skipped`);
    return collectedPosts;
  }

  /**
   * Main orchestration for TOP posts scraping
   */
  async scrapeAllTopPosts() {
    console.log('🏆 TOP POSTS SCRAPER - Legendary Content Harvester');
    console.log('==================================================\n');

    // Initialize Firebase
    console.log('🔥 Testing Firebase connection...');
    const firebaseOk = await testFirebaseConnection();
    if (!firebaseOk) {
      throw new Error('Firebase connection failed');
    }
    this.db = initializeFirebase();

    // Get current post count
    const postsRef = collection(this.db, 'posts');
    const existingSnapshot = await getDocs(postsRef);
    console.log(`📊 Current database: ${existingSnapshot.size} posts`);

    const subreddits = getSubredditNames(1); // Priority 1 subreddits
    console.log(`📋 Target subreddits: ${subreddits.join(', ')}\n`);

    let totalNewPosts = 0;
    let totalNewComments = 0;

    // Phase 1: Top posts from past YEAR
    console.log('🗓️  PHASE 1: TOP POSTS - PAST YEAR');
    console.log('=====================================');
    
    for (let i = 0; i < subreddits.length; i++) {
      const subreddit = subreddits[i];
      console.log(`\n📈 Progress (YEAR): ${i + 1}/${subreddits.length} - r/${subreddit}`);

      try {
        const posts = await this.scrapeTopSubreddit(subreddit, 50, 'year');
        
        if (posts.length > 0) {
          console.log(`💾 Storing ${posts.length} TOP-YEAR posts...`);
          await batchWritePosts(posts, this.db);
          
          const commentCount = posts.reduce((sum, post) => sum + post.comments.length, 0);
          totalNewPosts += posts.length;
          totalNewComments += commentCount;
        }
      } catch (error) {
        console.error(`❌ Error with r/${subreddit} (year):`, error.message);
      }
    }

    console.log(`\n✅ YEAR phase complete: ${totalNewPosts} posts added`);

    // Phase 2: Top posts of ALL TIME
    console.log('\n🏛️  PHASE 2: TOP POSTS - ALL TIME');
    console.log('==================================');
    
    for (let i = 0; i < subreddits.length; i++) {
      const subreddit = subreddits[i];
      console.log(`\n📈 Progress (ALL): ${i + 1}/${subreddits.length} - r/${subreddit}`);

      try {
        const posts = await this.scrapeTopSubreddit(subreddit, 50, 'all');
        
        if (posts.length > 0) {
          console.log(`💾 Storing ${posts.length} TOP-ALL posts...`);
          await batchWritePosts(posts, this.db);
          
          const commentCount = posts.reduce((sum, post) => sum + post.comments.length, 0);
          totalNewPosts += posts.length;
          totalNewComments += commentCount;
        }
      } catch (error) {
        console.error(`❌ Error with r/${subreddit} (all):`, error.message);
      }
    }

    // Final summary
    const finalSnapshot = await getDocs(postsRef);
    console.log('\n🏆 TOP POSTS SCRAPING COMPLETE!');
    console.log('===============================');
    console.log(`📄 New posts added: ${totalNewPosts}`);
    console.log(`💬 New comments added: ${totalNewComments}`);
    console.log(`📊 Total database: ${finalSnapshot.size} posts`);
    console.log(`🎯 Mix: HOT + TOP-YEAR + TOP-ALL = Ultimate conversation collection!`);
  }
}

// CLI interface
if (require.main === module) {
  const scraper = new TopPostsScraper();
  scraper.scrapeAllTopPosts().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = TopPostsScraper; 