/**
 * AmItheAsshole Scraper - Add morality posts back to the database
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, writeBatch, query, where, getDocs } = require('firebase/firestore');
const axios = require('axios');

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

// Reddit API credentials
const REDDIT_CLIENT_ID = process.env.REACT_APP_REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REACT_APP_REDDIT_CLIENT_SECRET;
const REDDIT_USER_AGENT = process.env.REACT_APP_REDDIT_USER_AGENT;

class AmItheAssholesScraper {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.minScore = 50; // Minimum post score
    this.commentsPerPost = 5; // Number of comments to fetch per post
    this.requestDelay = 1000; // 1 second between requests
    this.lastRequestTime = 0;
  }

  async rateLimitDelay() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.requestDelay) {
      const delay = this.requestDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    console.log('🔐 Getting Reddit access token...');

    try {
      const auth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');
      
      const response = await axios.post(
        'https://www.reddit.com/api/v1/access_token',
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'User-Agent': REDDIT_USER_AGENT,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer

      console.log('✅ Reddit access token obtained');
      return this.accessToken;

    } catch (error) {
      console.error('❌ Failed to get Reddit access token:', error.response?.data || error.message);
      throw error;
    }
  }

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
            'User-Agent': REDDIT_USER_AGENT
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

  async fetchPostComments(subreddit, postId, limit = 5) {
    const token = await this.getAccessToken();
    await this.rateLimitDelay();

    try {
      const response = await axios.get(
        `https://oauth.reddit.com/r/${subreddit}/comments/${postId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': REDDIT_USER_AGENT
          },
          params: { limit, sort: 'top' }
        }
      );

      // Comments are in the second element of the response array
      if (response.data && response.data.length > 1) {
        return response.data[1].data.children || [];
      }
      return [];

    } catch (error) {
      console.error(`❌ Failed to fetch comments for post ${postId}:`, error.message);
      return [];
    }
  }

  processComments(comments) {
    return comments
      .filter(comment => comment.data && comment.data.body && comment.data.body !== '[deleted]' && comment.data.body !== '[removed]')
      .slice(0, this.commentsPerPost)
      .map(comment => ({
        id: comment.data.id,
        body: comment.data.body,
        author: comment.data.author,
        score: comment.data.score,
        created_utc: comment.data.created_utc
      }));
  }

  async checkExistingPosts() {
    console.log('🔍 Checking for existing AmItheAsshole posts...');
    
    try {
      const q = query(
        collection(db, 'posts'),
        where('subreddit', '==', 'AmItheAsshole')
      );

      const querySnapshot = await getDocs(q);
      const existingIds = new Set();
      
      querySnapshot.docs.forEach(doc => {
        existingIds.add(doc.data().id);
      });

      console.log(`📊 Found ${existingIds.size} existing AmItheAsshole posts`);
      return existingIds;

    } catch (error) {
      console.error('❌ Error checking existing posts:', error.message);
      return new Set();
    }
  }

  async scrapeAmItheAsshole(targetCount = 200) {
    console.log('🎯 SCRAPING AMITHEASSHOLE POSTS');
    console.log('===============================\n');
    console.log(`📝 Target: ${targetCount} high-quality morality posts`);
    console.log(`⭐ Minimum score: ${this.minScore} points`);
    console.log(`💬 Comments per post: ${this.commentsPerPost}\n`);

    const existingIds = await this.checkExistingPosts();
    const collectedPosts = [];
    let after = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (collectedPosts.length < targetCount && attempts < maxAttempts) {
      attempts++;
      console.log(`📄 Fetching batch ${attempts} from r/AmItheAsshole...`);

      try {
        const result = await this.fetchSubredditPosts('AmItheAsshole', 100, 'hot', after);
        const posts = result.posts;
        after = result.after;

        if (!posts || posts.length === 0) {
          console.log('⚠️  No more posts available');
          break;
        }

        for (const postWrapper of posts) {
          if (collectedPosts.length >= targetCount) break;

          const post = postWrapper.data;
          
          // Skip if we already have this post
          if (existingIds.has(post.id)) {
            console.log(`⏭️  Skipping existing post: ${post.id}`);
            continue;
          }

          // Filter by score and quality
          if (post.score < this.minScore) {
            continue;
          }

          // Skip removed or deleted posts
          if (post.removed_by_category || post.banned_by || !post.title) {
            continue;
          }

          console.log(`📝 Processing: "${post.title.substring(0, 60)}..." (${post.score} pts)`);

          // Fetch comments
          const comments = await this.fetchPostComments('AmItheAsshole', post.id, this.commentsPerPost);
          const processedComments = this.processComments(comments);

          // Create post object with morality category
          const processedPost = {
            id: post.id,
            title: post.title,
            body: post.selftext || '',
            author: post.author,
            subreddit: 'AmItheAsshole',
            category: 'morality', // This is the key change!
            url: `https://reddit.com${post.permalink}`,
            permalink: post.permalink,
            score: post.score,
            num_comments: post.num_comments,
            created_utc: post.created_utc,
            scraped_at: new Date().toISOString(),
            comments: processedComments
          };

          collectedPosts.push(processedPost);
          console.log(`✅ Collected ${collectedPosts.length}/${targetCount} (Score: ${post.score}, Comments: ${processedComments.length})`);
        }

        if (!after) {
          console.log('⚠️  Reached end of available posts');
          break;
        }

      } catch (error) {
        console.error(`❌ Error in batch ${attempts}:`, error.message);
      }
    }

    console.log(`\n🎉 Scraping completed: ${collectedPosts.length} posts collected`);
    return collectedPosts;
  }

  async savePosts(posts) {
    if (posts.length === 0) {
      console.log('⚠️  No posts to save');
      return;
    }

    console.log(`\n💾 SAVING ${posts.length} POSTS TO FIREBASE`);
    console.log('========================================');

    try {
      // Batch write to Firebase
      const batches = [];
      let currentBatch = writeBatch(db);
      let operationCount = 0;

      posts.forEach((post) => {
        const docRef = doc(collection(db, 'posts'), post.id);
        currentBatch.set(docRef, post);
        operationCount++;

        // Firebase writeBatch limit is 500 operations
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
        console.log(`   Saving batch ${i + 1}/${batches.length}...`);
        await batches[i].commit();
      }

      console.log(`\n✅ Successfully saved ${posts.length} AmItheAsshole posts!`);
      console.log(`📊 All posts categorized as: morality`);

    } catch (error) {
      console.error('❌ Error saving posts:', error.message);
      throw error;
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 AMITHEASSHOLE MORALITY POSTS SCRAPER');
  console.log(`🔥 Firebase Project: ${process.env.REACT_APP_FIREBASE_PROJECT_ID}`);
  console.log('='.repeat(50));

  const scraper = new AmItheAssholesScraper();

  try {
    // Scrape AmItheAsshole posts
    const posts = await scraper.scrapeAmItheAsshole(200);

    // Save to database
    if (posts.length > 0) {
      await scraper.savePosts(posts);
    }

    console.log('\n🎯 MISSION COMPLETE!');
    console.log('====================');
    console.log('✅ AmItheAsshole posts added to morality category');
    console.log('📱 Check your React app - morality category should now have posts!');
    console.log('\n💡 Remember to refresh your app to see the new posts');

  } catch (error) {
    console.error('❌ Scraping failed:', error.message);
    process.exit(1);
  }
}

// Run the scraper
main().catch(console.error); 