/**
 * API Script for Adding New Subreddits
 * Can be called from the web tool or directly via Node.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, writeBatch, query, where, getDocs } = require('firebase/firestore');
const axios = require('axios');
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

// Reddit API credentials
const REDDIT_CLIENT_ID = process.env.REACT_APP_REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REACT_APP_REDDIT_CLIENT_SECRET;
const REDDIT_USER_AGENT = process.env.REACT_APP_REDDIT_USER_AGENT;

class SubredditManager {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.minScore = 50;
    this.commentsPerPost = 5;
    this.requestDelay = 1000;
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
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;

      console.log('✅ Reddit access token obtained');
      return this.accessToken;

    } catch (error) {
      console.error('❌ Failed to get Reddit access token:', error.response?.data || error.message);
      throw error;
    }
  }

  async validateSubredditExists(subredditName) {
    console.log(`🔍 Validating subreddit: r/${subredditName}`);
    
    try {
      const token = await this.getAccessToken();
      await this.rateLimitDelay();

      const response = await axios.get(
        `https://oauth.reddit.com/r/${subredditName}/about`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': REDDIT_USER_AGENT
          }
        }
      );

      if (response.data && response.data.data) {
        const subredditData = response.data.data;
        console.log(`✅ Subreddit validated: ${subredditData.display_name_prefixed}`);
        console.log(`   Subscribers: ${subredditData.subscribers?.toLocaleString() || 'Unknown'}`);
        console.log(`   Public: ${subredditData.subreddit_type === 'public' ? 'Yes' : 'No'}`);
        
        return {
          valid: true,
          data: subredditData
        };
      }

      return { valid: false, error: 'Invalid response from Reddit API' };

    } catch (error) {
      if (error.response?.status === 404) {
        return { valid: false, error: 'Subreddit not found' };
      } else if (error.response?.status === 403) {
        return { valid: false, error: 'Subreddit is private or banned' };
      } else {
        return { valid: false, error: error.message };
      }
    }
  }

  async checkExistingSubreddit(subredditName) {
    console.log(`🔍 Checking if r/${subredditName} already exists in database...`);
    
    try {
      const q = query(
        collection(db, 'posts'),
        where('subreddit', '==', subredditName)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.docs.length > 0) {
        console.log(`⚠️  Subreddit already exists with ${querySnapshot.docs.length} posts`);
        return { exists: true, count: querySnapshot.docs.length };
      }

      console.log('✅ Subreddit is new - ready to add');
      return { exists: false, count: 0 };

    } catch (error) {
      console.error('❌ Error checking existing subreddit:', error.message);
      throw error;
    }
  }

  async updateSubredditConfig(subredditData) {
    console.log('📝 Updating subreddit configuration file...');
    
    try {
      const configPath = path.join(__dirname, 'subreddit-config.js');
      let configContent = await fs.readFile(configPath, 'utf8');

      // Create new subreddit entry
      const newEntry = `  {
    name: '${subredditData.subreddit}',
    display_name: '${subredditData.displayName}',
    category: '${subredditData.category}',
    description: '${subredditData.description}',
    priority: ${subredditData.priority}
  },`;

      // Find the insertion point (before the closing bracket of SUBREDDIT_CONFIG)
      const insertionPoint = configContent.lastIndexOf('];');
      if (insertionPoint === -1) {
        throw new Error('Could not find insertion point in subreddit config');
      }

      // Insert the new entry
      configContent = configContent.slice(0, insertionPoint) + newEntry + '\n\n' + configContent.slice(insertionPoint);

      // Write back to file
      await fs.writeFile(configPath, configContent, 'utf8');
      console.log('✅ Subreddit configuration updated');

    } catch (error) {
      console.error('❌ Error updating subreddit config:', error.message);
      throw error;
    }
  }

  async updateReactAppCategories(newCategory) {
    if (!newCategory) return;

    console.log(`📱 Adding new category "${newCategory.id}" to React app...`);
    
    try {
      // Update postService.js categories
      const postServicePath = path.join(__dirname, '../src/services/postService.js');
      let postServiceContent = await fs.readFile(postServicePath, 'utf8');

      // Find the categories array in getCategories method
      const categoriesMatch = postServiceContent.match(/const categories = \[([\s\S]*?)\];/);
      if (categoriesMatch) {
        const existingCategories = categoriesMatch[1];
        
        // Add new category entry
        const newCategoryEntry = `        { id: '${newCategory.id}', name: '${newCategory.name}', count: '0+' },`;
        
        // Insert before the last category
        const updatedCategories = existingCategories.trim() + '\n' + newCategoryEntry;
        postServiceContent = postServiceContent.replace(categoriesMatch[0], `const categories = [${updatedCategories}\n      ];`);
        
        await fs.writeFile(postServicePath, postServiceContent, 'utf8');
        console.log('✅ React app categories updated');
      }

      // Update other relevant files that might have category mappings
      const filesToUpdate = [
        '../src/components/MobilePostList.js',
        '../src/components/FilterPanel.js'
      ];

      for (const filePath of filesToUpdate) {
        try {
          const fullPath = path.join(__dirname, filePath);
          let content = await fs.readFile(fullPath, 'utf8');
          
          // Look for categoryNames object and add new category
          const categoryNamesMatch = content.match(/const categoryNames = \{([\s\S]*?)\};/);
          if (categoryNamesMatch) {
            const categoryNames = categoryNamesMatch[1];
            const newCategoryLine = `        '${newCategory.id}': '${newCategory.name}',`;
            
            const updatedCategoryNames = categoryNames.trim() + '\n' + newCategoryLine;
            content = content.replace(categoryNamesMatch[0], `const categoryNames = {${updatedCategoryNames}\n      };`);
            
            await fs.writeFile(fullPath, content, 'utf8');
            console.log(`✅ Updated category mappings in ${path.basename(filePath)}`);
          }
        } catch (error) {
          // File might not exist or not have category mappings - that's ok
          console.log(`ℹ️  Skipped ${path.basename(filePath)} (no category mappings found)`);
        }
      }

    } catch (error) {
      console.error('❌ Error updating React app categories:', error.message);
      throw error;
    }
  }

  async scrapeSubredditPosts(subredditData) {
    console.log(`🕷️  Starting to scrape ${subredditData.postCount} posts from r/${subredditData.subreddit}...`);
    
    try {
      const collectedPosts = [];
      let after = null;
      let attempts = 0;
      const maxAttempts = 10;

      while (collectedPosts.length < subredditData.postCount && attempts < maxAttempts) {
        attempts++;
        console.log(`📄 Fetching batch ${attempts} from r/${subredditData.subreddit}...`);

        const result = await this.fetchSubredditPosts(subredditData.subreddit, 100, 'hot', after);
        const posts = result.posts;
        after = result.after;

        if (!posts || posts.length === 0) {
          console.log('⚠️  No more posts available');
          break;
        }

        for (const postWrapper of posts) {
          if (collectedPosts.length >= subredditData.postCount) break;

          const post = postWrapper.data;
          
          // Filter by score and quality
          if (post.score < this.minScore) continue;
          if (post.removed_by_category || post.banned_by || !post.title) continue;

          console.log(`📝 Processing: "${post.title.substring(0, 60)}..." (${post.score} pts)`);

          // Fetch comments
          const comments = await this.fetchPostComments(subredditData.subreddit, post.id, this.commentsPerPost);
          const processedComments = this.processComments(comments);

          // Create post object
          const processedPost = {
            id: post.id,
            title: post.title,
            body: post.selftext || '',
            author: post.author,
            subreddit: subredditData.subreddit,
            category: subredditData.category,
            url: `https://reddit.com${post.permalink}`,
            permalink: post.permalink,
            score: post.score,
            num_comments: post.num_comments,
            created_utc: post.created_utc,
            scraped_at: new Date().toISOString(),
            comments: processedComments
          };

          collectedPosts.push(processedPost);
          console.log(`✅ Collected ${collectedPosts.length}/${subredditData.postCount}`);
        }

        if (!after) {
          console.log('⚠️  Reached end of available posts');
          break;
        }
      }

      console.log(`\n🎉 Scraping completed: ${collectedPosts.length} posts collected`);
      return collectedPosts;

    } catch (error) {
      console.error('❌ Error scraping subreddit posts:', error.message);
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

  async savePostsToDatabase(posts) {
    if (posts.length === 0) {
      console.log('⚠️  No posts to save');
      return;
    }

    console.log(`\n💾 Saving ${posts.length} posts to Firebase...`);

    try {
      const batches = [];
      let currentBatch = writeBatch(db);
      let operationCount = 0;

      posts.forEach((post) => {
        const docRef = doc(collection(db, 'posts'), post.id);
        currentBatch.set(docRef, post);
        operationCount++;

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

      console.log(`✅ Successfully saved ${posts.length} posts to database!`);

    } catch (error) {
      console.error('❌ Error saving posts to database:', error.message);
      throw error;
    }
  }

  async addNewSubreddit(subredditData) {
    console.log('🚀 ADDING NEW SUBREDDIT');
    console.log('='.repeat(50));
    console.log(`📚 Subreddit: r/${subredditData.subreddit}`);
    console.log(`📂 Category: ${subredditData.category}`);
    console.log(`📊 Target Posts: ${subredditData.postCount}`);
    console.log('');

    try {
      // Step 1: Validate subreddit exists on Reddit
      const validation = await this.validateSubredditExists(subredditData.subreddit);
      if (!validation.valid) {
        throw new Error(`Subreddit validation failed: ${validation.error}`);
      }

      // Step 2: Check if already exists in database
      const existing = await this.checkExistingSubreddit(subredditData.subreddit);
      if (existing.exists) {
        throw new Error(`Subreddit already exists in database with ${existing.count} posts`);
      }

      // Step 3: Update configuration files
      await this.updateSubredditConfig(subredditData);

      // Step 4: Update React app if new category
      if (subredditData.newCategory) {
        await this.updateReactAppCategories(subredditData.newCategory);
      }

      // Step 5: Scrape posts
      const posts = await this.scrapeSubredditPosts(subredditData);

      // Step 6: Save to database
      await this.savePostsToDatabase(posts);

      console.log('\n🎉 SUCCESS! Subreddit added successfully!');
      console.log('='.repeat(50));
      console.log(`✅ r/${subredditData.subreddit} is now available in your app`);
      console.log(`📊 ${posts.length} posts added to ${subredditData.category} category`);
      
      return {
        success: true,
        postsAdded: posts.length,
        message: `Successfully added r/${subredditData.subreddit} with ${posts.length} posts`
      };

    } catch (error) {
      console.error('❌ Failed to add subreddit:', error.message);
      throw error;
    }
  }
}

// Export for use in other scripts or API endpoints
module.exports = SubredditManager;

// If called directly, handle command line arguments
if (require.main === module) {
  const manager = new SubredditManager();

  // Example usage or command line interface
  async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
      console.log('Usage: node api-add-subreddit.js <subreddit> <category> <postCount> [displayName] [description]');
      console.log('Example: node api-add-subreddit.js gaming gaming 100 "Gaming" "Video game discussions"');
      return;
    }

    const [subreddit, category, postCount, displayName, description] = args;
    
    const subredditData = {
      subreddit,
      category,
      postCount: parseInt(postCount) || 100,
      displayName: displayName || subreddit,
      description: description || `Posts from r/${subreddit}`,
      priority: 2
    };

    try {
      await manager.addNewSubreddit(subredditData);
    } catch (error) {
      console.error('Failed:', error.message);
      process.exit(1);
    }
  }

  main().catch(console.error);
} 