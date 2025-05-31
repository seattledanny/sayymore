/**
 * Reddit Scraper Engine
 * Handles authentication, post fetching, comment retrieval, and data processing
 */

const axios = require('axios');
require('dotenv').config();

class RedditScraper {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.userAgent = process.env.REACT_APP_REDDIT_USER_AGENT;
    this.minScore = parseInt(process.env.REACT_APP_MIN_POST_SCORE) || 50;
    this.commentsPerPost = parseInt(process.env.REACT_APP_COMMENTS_PER_POST) || 5;
    
    // Rate limiting
    this.requestDelay = 1000; // 1 second between requests
    this.lastRequestTime = 0;
  }

  /**
   * Rate limiting helper - ensures we don't exceed Reddit's rate limits
   */
  async rateLimitDelay() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.requestDelay) {
      const delay = this.requestDelay - timeSinceLastRequest;
      console.log(`⏸️  Rate limiting: waiting ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Get or refresh Reddit access token
   * @returns {Promise<string>} Access token
   */
  async getAccessToken() {
    // Return existing token if still valid
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    console.log('🔑 Getting Reddit access token...');

    try {
      const auth = Buffer.from(
        `${process.env.REACT_APP_REDDIT_CLIENT_ID}:${process.env.REACT_APP_REDDIT_CLIENT_SECRET}`
      ).toString('base64');

      await this.rateLimitDelay();

      const response = await axios.post(
        'https://www.reddit.com/api/v1/access_token',
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': this.userAgent
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      console.log('✅ Access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Failed to get Reddit access token:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Fetch posts from a subreddit
   * @param {string} subreddit - Subreddit name
   * @param {number} limit - Number of posts to fetch (max 100 per request)
   * @param {string} sort - Sort type ('hot', 'top', 'new')
   * @param {string} after - Pagination token
   * @returns {Promise<Object>} Response with posts and pagination info
   */
  async fetchSubredditPosts(subreddit, limit = 100, sort = 'hot', after = null) {
    const token = await this.getAccessToken();
    
    await this.rateLimitDelay();

    try {
      const params = { limit };
      if (after) params.after = after;

      const response = await axios.get(
        `https://oauth.reddit.com/r/${subreddit}/${sort}`,
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
      console.error(`❌ Failed to fetch posts from r/${subreddit}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Fetch comments for a specific post
   * @param {string} subreddit - Subreddit name
   * @param {string} postId - Post ID
   * @param {number} limit - Number of comments to fetch
   * @returns {Promise<Array>} Array of comment objects
   */
  async fetchPostComments(subreddit, postId, limit = 5) {
    const token = await this.getAccessToken();
    
    await this.rateLimitDelay();

    try {
      const response = await axios.get(
        `https://oauth.reddit.com/r/${subreddit}/comments/${postId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': this.userAgent
          },
          params: {
            limit,
            sort: 'top',
            depth: 1 // Only top-level comments
          }
        }
      );

      // Comments are in the second array of the response
      const comments = response.data[1]?.data?.children || [];
      return comments;
    } catch (error) {
      console.error(`❌ Failed to fetch comments for post ${postId}:`, error.response?.data || error.message);
      return []; // Return empty array on error to continue processing
    }
  }

  /**
   * Scrape all posts from a subreddit
   * @param {string} subreddit - Subreddit name
   * @param {number} targetCount - Target number of posts to collect
   * @returns {Promise<Array>} Array of processed post objects
   */
  async scrapeSubreddit(subreddit, targetCount = 200) {
    console.log(`\n🏗️  Starting to scrape r/${subreddit} (target: ${targetCount} posts)`);
    console.log(`📡 Enhanced with crosspost detection`);
    
    const collectedPosts = [];
    let after = null;
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loops
    let crosspostCount = 0;

    while (collectedPosts.length < targetCount && attempts < maxAttempts) {
      attempts++;
      console.log(`📄 Fetching batch ${attempts} from r/${subreddit}...`);

      try {
        const result = await this.fetchSubredditPosts(subreddit, 100, 'hot', after);
        const posts = result.posts;
        after = result.after;

        if (!posts || posts.length === 0) {
          console.log(`⚠️  No more posts available in r/${subreddit}`);
          break;
        }

        // Process each post
        for (const postWrapper of posts) {
          if (collectedPosts.length >= targetCount) break;

          const post = postWrapper.data;
          
          // Filter by score and content quality
          if (post.score < this.minScore) {
            continue; // Skip low-score posts
          }

          // Skip removed or deleted posts
          if (post.removed_by_category || post.banned_by || !post.title) {
            continue;
          }

          console.log(`📝 Processing: "${post.title.substring(0, 60)}..."`);

          // Fetch comments for this post
          const comments = await this.fetchPostComments(subreddit, post.id, this.commentsPerPost);
          
          // Process and clean comments
          const processedComments = this.processComments(comments);

          // Create processed post object with crosspost metadata
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
            comments: processedComments,
            
            // NEW: Crosspost metadata
            is_crosspost: Boolean(post.crosspost_parent_list && post.crosspost_parent_list.length > 0),
            crosspost_parent_id: post.crosspost_parent_list?.[0]?.id || null,
            crosspost_parent_subreddit: post.crosspost_parent_list?.[0]?.subreddit || null,
            crosspost_parent_title: post.crosspost_parent_list?.[0]?.title || null,
            crosspost_chain_length: post.crosspost_parent_list?.length || 0,
            num_crossposts: post.num_crossposts || 0
          };

          // Log crosspost detection
          if (processedPost.is_crosspost) {
            console.log(`   🔗 CROSSPOST detected! Original: r/${processedPost.crosspost_parent_subreddit}`);
            crosspostCount++;
          }

          collectedPosts.push(processedPost);
          
          const crosspostIndicator = processedPost.is_crosspost ? '🔗' : '';
          console.log(`✅ Collected post ${collectedPosts.length}/${targetCount} ${crosspostIndicator} (Score: ${post.score}, Comments: ${processedComments.length})`);
        }

        // If no more pages available
        if (!after) {
          console.log(`⚠️  Reached end of available posts in r/${subreddit}`);
          break;
        }

      } catch (error) {
        console.error(`❌ Error in batch ${attempts} for r/${subreddit}:`, error.message);
        // Continue with next batch instead of failing completely
      }
    }

    console.log(`🎉 Completed scraping r/${subreddit}: ${collectedPosts.length} posts collected, ${crosspostCount} crossposts detected`);
    return collectedPosts;
  }

  /**
   * Process and clean comments from Reddit API response
   * @param {Array} rawComments - Raw comment data from Reddit API
   * @returns {Array} Processed comment objects
   */
  processComments(rawComments) {
    const processedComments = [];

    for (const commentWrapper of rawComments) {
      const comment = commentWrapper.data;

      // Skip deleted, removed, or empty comments
      if (!comment.body || 
          comment.body === '[deleted]' || 
          comment.body === '[removed]' ||
          comment.body.trim() === '' ||
          comment.author === '[deleted]') {
        continue;
      }

      // Skip AutoModerator and bot comments
      if (comment.author === 'AutoModerator' || 
          comment.distinguished === 'moderator') {
        continue;
      }

      processedComments.push({
        id: comment.id,
        author: comment.author,
        body: comment.body,
        score: comment.score || 0,
        created_utc: comment.created_utc || 0
      });

      // Stop when we have enough comments
      if (processedComments.length >= this.commentsPerPost) {
        break;
      }
    }

    return processedComments;
  }

  /**
   * Get scraping statistics
   * @param {Array} subredditNames - List of subreddit names
   * @returns {Object} Statistics object
   */
  getScrapingStats(subredditNames) {
    const postsPerSubreddit = parseInt(process.env.REACT_APP_POSTS_PER_SUBREDDIT) || 200;
    
    return {
      totalSubreddits: subredditNames.length,
      postsPerSubreddit,
      estimatedTotalPosts: subredditNames.length * postsPerSubreddit,
      estimatedTotalComments: subredditNames.length * postsPerSubreddit * this.commentsPerPost,
      estimatedTimeMinutes: Math.ceil((subredditNames.length * postsPerSubreddit * 1.5) / 60) // 1.5 seconds per post on average
    };
  }
}

module.exports = RedditScraper; 