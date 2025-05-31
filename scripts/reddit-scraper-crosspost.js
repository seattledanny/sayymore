const axios = require('axios');

/**
 * Enhanced Reddit Scraper with Crosspost Detection
 * 
 * This enhanced version captures crosspost metadata that Reddit provides
 * through their API including:
 * - crosspost_parent: The original post ID 
 * - crosspost_parent_list: Array of crosspost chain
 * - is_crosspost: Boolean indicating if post is a crosspost
 * - Original subreddit information
 */

class RedditScraperWithCrossposts {
  constructor() {
    this.userAgent = 'RedditScraper/1.0.0';
    this.accessToken = null;
    this.tokenExpiry = null;
    this.clientId = process.env.REACT_APP_REDDIT_CLIENT_ID;
    this.clientSecret = process.env.REACT_APP_REDDIT_CLIENT_SECRET;
    this.minScore = parseInt(process.env.REACT_APP_MIN_POST_SCORE) || 50;
    this.commentsPerPost = parseInt(process.env.REACT_APP_COMMENTS_PER_POST) || 5;
    this.requestDelay = 1000; // 1 second between requests
  }

  async rateLimitDelay() {
    await new Promise(resolve => setTimeout(resolve, this.requestDelay));
  }

  async getAccessToken() {
    // Check if current token is still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    console.log('🔑 Getting new Reddit access token...');

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
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
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Expire 1 minute early

      console.log('✅ Reddit access token obtained');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Failed to get Reddit access token:', error.response?.data || error.message);
      throw new Error('Reddit authentication failed');
    }
  }

  /**
   * Fetch posts from a subreddit with crosspost metadata
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
   * Extract crosspost information from Reddit post data
   * @param {Object} post - Reddit post data
   * @returns {Object} Crosspost metadata
   */
  extractCrosspostData(post) {
    const crosspostData = {
      is_crosspost: false,
      crosspost_parent_id: null,
      crosspost_parent_subreddit: null,
      crosspost_parent_title: null,
      crosspost_parent_list: [],
      crosspost_chain_length: 0
    };

    // Check for direct crosspost indicators
    if (post.crosspost_parent) {
      crosspostData.is_crosspost = true;
      crosspostData.crosspost_parent_id = post.crosspost_parent;
    }

    // Check crosspost_parent_list (contains full chain)
    if (post.crosspost_parent_list && post.crosspost_parent_list.length > 0) {
      crosspostData.is_crosspost = true;
      crosspostData.crosspost_parent_list = post.crosspost_parent_list;
      crosspostData.crosspost_chain_length = post.crosspost_parent_list.length;
      
      // Get original post info from the chain
      const originalPost = post.crosspost_parent_list[0];
      if (originalPost) {
        crosspostData.crosspost_parent_id = originalPost.id;
        crosspostData.crosspost_parent_subreddit = originalPost.subreddit;
        crosspostData.crosspost_parent_title = originalPost.title;
      }
    }

    // Alternative check - sometimes Reddit stores it differently
    if (post.is_crosspostable === false && post.num_crossposts > 0) {
      // This might indicate it's a source post that has been crossposted
      crosspostData.has_been_crossposted = true;
      crosspostData.num_crossposts = post.num_crossposts;
    }

    return crosspostData;
  }

  /**
   * Detect potential crosspost patterns in title/content
   * @param {Object} post - Reddit post data
   * @returns {Object} Pattern detection results
   */
  detectCrosspostPatterns(post) {
    const title = (post.title || '').toLowerCase();
    const body = (post.selftext || '').toLowerCase();
    const fullText = title + ' ' + body;
    
    const patterns = {
      has_crosspost_mentions: /crosspost|x-post|cross-post|cross posted/i.test(fullText),
      has_repost_mentions: /repost|re-post|reposted/i.test(fullText),
      has_source_mentions: /source:|original:|originally posted/i.test(fullText),
      has_subreddit_mentions: /r\/\w+/.test(fullText),
      subreddit_mentions: [...fullText.matchAll(/r\/(\w+)/g)].map(match => match[1]),
      has_meta_indicators: /meta|discussion about|commenting on/i.test(fullText)
    };

    return patterns;
  }

  /**
   * Scrape all posts from a subreddit with crosspost detection
   * @param {string} subreddit - Subreddit name
   * @param {number} targetCount - Target number of posts to collect
   * @returns {Promise<Array>} Array of processed post objects
   */
  async scrapeSubreddit(subreddit, targetCount = 200) {
    console.log(`\n🏗️  Starting enhanced scrape of r/${subreddit} (target: ${targetCount} posts)`);
    console.log(`📡 Will detect crosspost metadata and patterns`);
    
    const collectedPosts = [];
    let after = null;
    let attempts = 0;
    const maxAttempts = 10;
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

          // Extract crosspost metadata
          const crosspostData = this.extractCrosspostData(post);
          const crosspostPatterns = this.detectCrosspostPatterns(post);

          if (crosspostData.is_crosspost) {
            crosspostCount++;
            console.log(`   🔗 CROSSPOST detected! Original: r/${crosspostData.crosspost_parent_subreddit}`);
          }

          // Fetch comments for this post
          const comments = await this.fetchPostComments(subreddit, post.id, this.commentsPerPost);
          
          // Process and clean comments
          const processedComments = this.processComments(comments);

          // Create enhanced processed post object with crosspost data
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
            ...crosspostData,
            crosspost_patterns: crosspostPatterns,
            
            // Additional Reddit metadata that might be useful
            domain: post.domain,
            num_crossposts: post.num_crossposts || 0,
            is_reddit_media_domain: post.is_reddit_media_domain,
            is_video: post.is_video || false,
            
            // Store raw crosspost data for debugging
            raw_crosspost_parent: post.crosspost_parent,
            raw_crosspost_parent_list: post.crosspost_parent_list
          };

          collectedPosts.push(processedPost);
          
          const crosspostIndicator = crosspostData.is_crosspost ? '🔗' : '';
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

    console.log(`🎉 Completed enhanced scraping r/${subreddit}:`);
    console.log(`   📊 ${collectedPosts.length} total posts collected`);
    console.log(`   🔗 ${crosspostCount} crossposts detected (${Math.round(crosspostCount/collectedPosts.length*100)}%)`);
    
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
   * Get enhanced scraping statistics
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
      estimatedTimeMinutes: Math.ceil((subredditNames.length * postsPerSubreddit * 1.5) / 60),
      enhancedFeatures: [
        'Crosspost detection',
        'Original source tracking',
        'Crosspost chain analysis',
        'Pattern detection in titles/content',
        'Meta-subreddit identification'
      ]
    };
  }
}

module.exports = RedditScraperWithCrossposts; 