/**
 * AITAH Scraper - Get 100 top posts
 * Fetches hot and top posts from AITAH (Am I The Asshole Here) subreddit
 */

const axios = require('axios');
const RedditScraper = require('./reddit-scraper');
const { initializeFirebase, batchWritePosts, testFirebaseConnection } = require('./firebase-client-scraper');
const { collection, getDocs, doc, getDoc, query, where } = require('firebase/firestore');
require('dotenv').config();

class AITAHScraper extends RedditScraper {
  constructor() {
    super();
    this.db = null;
    this.subreddit = 'AITAH';
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
   * Get current post count for AITAH
   */
  async getCurrentPostCount() {
    try {
      const postsRef = collection(this.db, 'posts');
      const q = query(postsRef, where('subreddit', '==', this.subreddit));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting current post count:', error);
      return 0;
    }
  }

  /**
   * Fetch top posts from AITAH
   */
  async fetchTopPosts(limit = 100, timeframe = 'year', after = null) {
    const token = await this.getAccessToken();
    await this.rateLimitDelay();

    try {
      const params = { 
        limit,
        t: timeframe // 'year', 'month', 'week', 'all'
      };
      if (after) params.after = after;

      const response = await axios.get(
        `https://oauth.reddit.com/r/${this.subreddit}/top`,
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
      console.error(`❌ Failed to fetch top posts from r/${this.subreddit}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Scrape posts with duplicate checking
   */
  async scrapePosts(targetCount = 100, sortType = 'hot') {
    console.log(`\n🎯 Starting ${sortType.toUpperCase()} scrape: r/${this.subreddit} - target: ${targetCount} posts`);
    
    const collectedPosts = [];
    let after = null;
    let attempts = 0;
    const maxAttempts = 10;
    let duplicatesSkipped = 0;

    while (collectedPosts.length < targetCount && attempts < maxAttempts) {
      attempts++;
      console.log(`📄 Fetching ${sortType.toUpperCase()} batch ${attempts} from r/${this.subreddit}...`);

      try {
        let result;
        if (sortType === 'top') {
          result = await this.fetchTopPosts(100, 'year', after);
        } else {
          result = await this.fetchSubredditPosts(this.subreddit, 100, sortType, after);
        }
        
        const posts = result.posts;
        after = result.after;

        if (!posts || posts.length === 0) {
          console.log(`⚠️  No more ${sortType.toUpperCase()} posts available in r/${this.subreddit}`);
          break;
        }

        for (const postWrapper of posts) {
          if (collectedPosts.length >= targetCount) break;

          const post = postWrapper.data;
          
          // Check if we already have this post
          const exists = await this.postExists(post.id);
          if (exists) {
            duplicatesSkipped++;
            console.log(`⏭️  Skipping duplicate: ${post.id}`);
            continue;
          }

          // Apply quality filters
          if (post.score < this.minScore) {
            console.log(`⏭️  Skipping low score (${post.score}): "${post.title.substring(0, 50)}..."`);
            continue;
          }

          if (post.removed_by_category || post.banned_by || !post.title) {
            console.log(`⏭️  Skipping removed/deleted post`);
            continue;
          }

          console.log(`🎯 Processing ${sortType.toUpperCase()}: "${post.title.substring(0, 60)}..." (Score: ${post.score})`);

          // Fetch comments
          const comments = await this.fetchPostComments(this.subreddit, post.id, this.commentsPerPost);
          const processedComments = this.processComments(comments);

          // Create post object
          const processedPost = {
            id: post.id,
            title: post.title,
            body: post.selftext || '',
            author: post.author,
            subreddit: this.subreddit,
            url: `https://reddit.com${post.permalink}`,
            permalink: post.permalink,
            score: post.score,
            num_comments: post.num_comments,
            created_utc: post.created_utc,
            scraped_at: new Date().toISOString(),
            post_type: sortType,
            category: 'morality', // AITAH is in morality category
            comments: processedComments
          };

          collectedPosts.push(processedPost);
          console.log(`✅ Collected ${sortType} post ${collectedPosts.length}/${targetCount} (Score: ${post.score}, Comments: ${processedComments.length})`);
        }

        if (!after) {
          console.log(`⚠️  Reached end of ${sortType.toUpperCase()} posts in r/${this.subreddit}`);
          break;
        }

      } catch (error) {
        console.error(`❌ Error in ${sortType.toUpperCase()} batch ${attempts} for r/${this.subreddit}:`, error.message);
      }
    }

    console.log(`🎉 Completed ${sortType.toUpperCase()} scraping r/${this.subreddit}: ${collectedPosts.length} posts, ${duplicatesSkipped} duplicates skipped`);
    return collectedPosts;
  }

  /**
   * Main execution
   */
  async scrapeAITAH() {
    console.log('⚖️  r/AITAH SCRAPER - Moral Judgment Posts');
    console.log('==========================================\n');

    // Initialize Firebase
    console.log('🔥 Testing Firebase connection...');
    const firebaseOk = await testFirebaseConnection();
    if (!firebaseOk) {
      throw new Error('Firebase connection failed');
    }
    this.db = initializeFirebase();

    // Get current post count
    const currentCount = await this.getCurrentPostCount();
    console.log(`📊 Current r/${this.subreddit} posts in database: ${currentCount}`);

    if (currentCount >= 100) {
      console.log(`✅ Already have ${currentCount} posts from r/${this.subreddit}. Skipping scrape.`);
      return;
    }

    const targetCount = Math.max(100 - currentCount, 50); // Get at least 50 new posts
    console.log(`🎯 Target: ${targetCount} new posts\n`);

    let totalNewPosts = 0;
    let totalNewComments = 0;

    try {
      // Phase 1: Hot posts (most active discussions)
      console.log('🔥 PHASE 1: HOT POSTS');
      console.log('====================');
      
      const hotPosts = await this.scrapePosts(Math.ceil(targetCount * 0.6), 'hot'); // 60% hot posts
      
      if (hotPosts.length > 0) {
        console.log(`💾 Storing ${hotPosts.length} HOT posts...`);
        await batchWritePosts(hotPosts, this.db);
        
        const hotCommentCount = hotPosts.reduce((sum, post) => sum + post.comments.length, 0);
        totalNewPosts += hotPosts.length;
        totalNewComments += hotCommentCount;
        
        console.log(`✅ Hot posts complete: ${hotPosts.length} posts, ${hotCommentCount} comments`);
      }

      // Phase 2: Top posts (highest quality content)
      if (totalNewPosts < targetCount) {
        console.log('\n🏆 PHASE 2: TOP POSTS');
        console.log('=====================');
        
        const remainingNeeded = targetCount - totalNewPosts;
        const topPosts = await this.scrapePosts(remainingNeeded, 'top');
        
        if (topPosts.length > 0) {
          console.log(`💾 Storing ${topPosts.length} TOP posts...`);
          await batchWritePosts(topPosts, this.db);
          
          const topCommentCount = topPosts.reduce((sum, post) => sum + post.comments.length, 0);
          totalNewPosts += topPosts.length;
          totalNewComments += topCommentCount;
          
          console.log(`✅ Top posts complete: ${topPosts.length} posts, ${topCommentCount} comments`);
        }
      }

      // Final summary
      console.log('\n🎊 SCRAPING COMPLETE!');
      console.log('=====================');
      console.log(`📈 Total new posts added: ${totalNewPosts}`);
      console.log(`💬 Total new comments added: ${totalNewComments}`);
      
      const finalCount = await this.getCurrentPostCount();
      console.log(`📊 Final r/${this.subreddit} count: ${finalCount} posts`);
      
      if (finalCount >= 100) {
        console.log(`🎯 SUCCESS: r/${this.subreddit} now has 100+ posts!`);
      } else {
        console.log(`⚠️  Still need ${100 - finalCount} more posts to reach 100`);
      }

    } catch (error) {
      console.error('❌ Scraping failed:', error);
      throw error;
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const scraper = new AITAHScraper();
  scraper.scrapeAITAH()
    .then(() => {
      console.log('\n✅ AITAH scraping completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ AITAH scraping failed:', error);
      process.exit(1);
    });
}

module.exports = AITAHScraper; 