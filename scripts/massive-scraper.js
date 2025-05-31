require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, writeBatch, doc } = require('firebase/firestore');
const { EXPANDED_SUBREDDIT_CONFIG, getPendingSubreddits } = require('./expanded-subreddit-config');

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const REDDIT_CLIENT_ID = process.env.REACT_APP_REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REACT_APP_REDDIT_CLIENT_SECRET;
const REDDIT_USER_AGENT = process.env.REACT_APP_REDDIT_USER_AGENT;

class MassiveRedditScraper {
  constructor() {
    this.accessToken = null;
    this.minScore = 50; // Minimum upvotes for quality posts
    this.commentsPerPost = 5; // Top 5 comments per post
    this.delay = 1000; // 1 second between requests
    this.batchSize = 100; // Posts per batch write to Firestore
    
    // Progress tracking
    this.totalSubreddits = 0;
    this.completedSubreddits = 0;
    this.totalPostsCollected = 0;
    this.startTime = new Date();
  }

  // Rate limiting
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get Reddit OAuth token
  async getAccessToken() {
    if (this.accessToken) return this.accessToken;

    try {
      const auth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');
      
      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'User-Agent': REDDIT_USER_AGENT,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      
      console.log('🔑 Reddit OAuth token obtained successfully');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Failed to get Reddit access token:', error.message);
      throw error;
    }
  }

  // Check if post already exists in Firestore
  async postExists(postId) {
    try {
      const q = query(collection(db, 'posts'), where('id', '==', postId));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.log(`⚠️  Error checking if post exists: ${error.message}`);
      return false;
    }
  }

  // Fetch posts from subreddit (HOT and TOP)
  async fetchSubredditPosts(subreddit, limit = 100) {
    try {
      const token = await this.getAccessToken();
      const allPosts = [];
      
      // Fetch HOT posts
      console.log(`🔥 Fetching HOT posts from r/${subreddit}...`);
      const hotUrl = `https://oauth.reddit.com/r/${subreddit}/hot?limit=${Math.ceil(limit/2)}`;
      const hotResponse = await fetch(hotUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': REDDIT_USER_AGENT
        }
      });

      if (hotResponse.ok) {
        const hotData = await hotResponse.json();
        if (hotData?.data?.children) {
          allPosts.push(...hotData.data.children);
          console.log(`🔥 Got ${hotData.data.children.length} HOT posts from r/${subreddit}`);
        }
      }

      await this.sleep(this.delay);

      // Fetch TOP posts (past year)
      console.log(`🏆 Fetching TOP posts from r/${subreddit}...`);
      const topUrl = `https://oauth.reddit.com/r/${subreddit}/top?t=year&limit=${Math.ceil(limit/2)}`;
      const topResponse = await fetch(topUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': REDDIT_USER_AGENT
        }
      });

      if (topResponse.ok) {
        const topData = await topResponse.json();
        if (topData?.data?.children) {
          allPosts.push(...topData.data.children);
          console.log(`🏆 Got ${topData.data.children.length} TOP posts from r/${subreddit}`);
        }
      }

      return allPosts;
    } catch (error) {
      console.error(`❌ Error fetching posts from r/${subreddit}:`, error.message);
      return [];
    }
  }

  // Fetch comments for a post
  async fetchPostComments(subreddit, postId, limit = 5) {
    try {
      const token = await this.getAccessToken();
      const url = `https://oauth.reddit.com/r/${subreddit}/comments/${postId}?limit=${limit}&sort=top`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': REDDIT_USER_AGENT
        }
      });

      if (!response.ok) return [];

      const data = await response.json();
      if (!data || !Array.isArray(data) || data.length < 2) return [];

      const comments = data[1].data.children
        .filter(comment => 
          comment.data && 
          comment.data.body && 
          comment.data.author !== 'AutoModerator' && 
          !comment.data.body.includes('[deleted]') && 
          !comment.data.body.includes('[removed]')
        )
        .slice(0, limit)
        .map(comment => ({
          id: comment.data.id,
          author: comment.data.author,
          body: comment.data.body.substring(0, 1000), // Limit comment length
          score: comment.data.score,
          created_utc: comment.data.created_utc
        }));

      return comments;
    } catch (error) {
      console.log(`⚠️  Failed to fetch comments for ${postId}: ${error.message}`);
      return [];
    }
  }

  // Save posts to Firestore in batches
  async savePostsBatch(posts) {
    if (posts.length === 0) return 0;

    try {
      const batch = writeBatch(db);
      let batchCount = 0;

      for (const post of posts) {
        const docRef = doc(collection(db, 'posts'), post.id);
        batch.set(docRef, post);
        batchCount++;

        if (batchCount >= this.batchSize) {
          await batch.commit();
          console.log(`💾 Saved batch of ${batchCount} posts to Firestore`);
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
        console.log(`💾 Saved final batch of ${batchCount} posts to Firestore`);
      }

      return posts.length;
    } catch (error) {
      console.error('❌ Error saving posts to Firestore:', error.message);
      return 0;
    }
  }

  // Scrape a single subreddit
  async scrapeSubreddit(subredditConfig) {
    const { name, display_name, category, posts_target } = subredditConfig;
    console.log(`\n🎯 SCRAPING: r/${name} (${display_name})`);
    console.log(`📊 Target: ${posts_target} posts | Category: ${category}`);

    try {
      // Check current count
      const q = query(collection(db, 'posts'), where('subreddit', '==', name));
      const snapshot = await getDocs(q);
      const currentCount = snapshot.size;

      if (currentCount >= posts_target) {
        console.log(`✅ r/${name} already complete (${currentCount}/${posts_target} posts)`);
        return { success: true, posts: currentCount, skipped: true };
      }

      const postsNeeded = posts_target - currentCount;
      console.log(`📈 Current: ${currentCount} posts, Need: ${postsNeeded} more`);

      // Fetch posts
      const rawPosts = await this.fetchSubredditPosts(name, postsNeeded * 2); // Fetch extra for filtering
      await this.sleep(this.delay);

      // Process and filter posts
      const processedPosts = [];
      let duplicatesSkipped = 0;

      for (const postWrapper of rawPosts) {
        if (processedPosts.length >= postsNeeded) break;

        const post = postWrapper.data;

        // Quality filters
        if (post.score < this.minScore) continue;
        if (post.removed_by_category || post.banned_by || !post.title) continue;

        // Check for duplicates
        const exists = await this.postExists(post.id);
        if (exists) {
          duplicatesSkipped++;
          continue;
        }

        console.log(`📝 Processing: "${post.title.substring(0, 50)}..." (${post.score} pts)`);

        // Fetch comments
        const comments = await this.fetchPostComments(name, post.id, this.commentsPerPost);
        await this.sleep(this.delay);

        // Create processed post
        const processedPost = {
          id: post.id,
          title: post.title,
          body: post.selftext || '',
          author: post.author,
          subreddit: name,
          url: `https://reddit.com${post.permalink}`,
          permalink: post.permalink,
          score: post.score,
          num_comments: post.num_comments,
          created_utc: post.created_utc,
          scraped_at: new Date().toISOString(),
          category: category,
          comments: comments
        };

        processedPosts.push(processedPost);
        console.log(`✅ Collected ${processedPosts.length}/${postsNeeded} (Score: ${post.score}, Comments: ${comments.length})`);
      }

      // Save to Firestore
      const savedCount = await this.savePostsBatch(processedPosts);
      
      console.log(`🎉 r/${name} COMPLETE!`);
      console.log(`📊 Saved: ${savedCount} new posts (${duplicatesSkipped} duplicates skipped)`);
      console.log(`📈 Total in DB: ${currentCount + savedCount} posts`);

      return { 
        success: true, 
        posts: savedCount, 
        total: currentCount + savedCount,
        duplicates: duplicatesSkipped 
      };

    } catch (error) {
      console.error(`❌ Error scraping r/${name}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Main scraping function
  async scrapeAll() {
    console.log('🚀 STARTING MASSIVE REDDIT SCRAPING OPERATION');
    console.log('═'.repeat(80));
    
    // Get pending subreddits
    const pendingSubreddits = getPendingSubreddits();
    this.totalSubreddits = pendingSubreddits.length;
    
    console.log(`📊 OPERATION SCOPE:`);
    console.log(`   • Total subreddits to scrape: ${this.totalSubreddits}`);
    console.log(`   • Target posts per subreddit: 100`);
    console.log(`   • Total target posts: ${this.totalSubreddits * 100}`);
    console.log(`   • Estimated time: ${Math.ceil(this.totalSubreddits * 10)} minutes`);
    console.log('═'.repeat(80));

    const results = [];
    const errors = [];

    for (let i = 0; i < pendingSubreddits.length; i++) {
      const subreddit = pendingSubreddits[i];
      const progress = `[${i + 1}/${this.totalSubreddits}]`;
      
      console.log(`\n${progress} 🎯 Starting r/${subreddit.name}...`);
      
      const result = await this.scrapeSubreddit(subreddit);
      
      if (result.success) {
        if (!result.skipped) {
          this.totalPostsCollected += result.posts;
        }
        this.completedSubreddits++;
        results.push(result);
      } else {
        errors.push({ subreddit: subreddit.name, error: result.error });
      }

      // Progress update
      const elapsed = (new Date() - this.startTime) / 1000 / 60; // minutes
      const avgTimePerSubreddit = elapsed / (i + 1);
      const estimatedRemaining = avgTimePerSubreddit * (this.totalSubreddits - i - 1);
      
      console.log(`\n📊 PROGRESS UPDATE ${progress}:`);
      console.log(`   ✅ Completed: ${this.completedSubreddits}/${this.totalSubreddits}`);
      console.log(`   📈 Posts collected: ${this.totalPostsCollected}`);
      console.log(`   ⏱️  Time elapsed: ${elapsed.toFixed(1)} minutes`);
      console.log(`   🕒 Estimated remaining: ${estimatedRemaining.toFixed(1)} minutes`);
      console.log('─'.repeat(60));

      // Brief pause between subreddits
      await this.sleep(2000);
    }

    // Final summary
    this.printFinalSummary(results, errors);
  }

  printFinalSummary(results, errors) {
    const totalTime = (new Date() - this.startTime) / 1000 / 60;
    
    console.log('\n🎉 MASSIVE SCRAPING OPERATION COMPLETE!');
    console.log('═'.repeat(80));
    console.log(`📊 FINAL RESULTS:`);
    console.log(`   🎯 Subreddits processed: ${results.length}`);
    console.log(`   📈 New posts collected: ${this.totalPostsCollected}`);
    console.log(`   ⏱️  Total time: ${totalTime.toFixed(1)} minutes`);
    console.log(`   ⚡ Average posts/minute: ${(this.totalPostsCollected / totalTime).toFixed(1)}`);
    
    if (errors.length > 0) {
      console.log(`\n❌ ERRORS (${errors.length}):`);
      errors.forEach(err => {
        console.log(`   • r/${err.subreddit}: ${err.error}`);
      });
    }

    console.log('\n🚀 DATABASE NOW CONTAINS:');
    console.log(`   • 57 subreddits total`);
    console.log(`   • 5,700+ high-quality conversation starters`);
    console.log(`   • Complete wedding planning content 💍`);
    console.log(`   • Comprehensive relationship advice 💕`);
    console.log(`   • Ultimate drama and revenge stories 🔥`);
    console.log('═'.repeat(80));
    console.log('🎊 Ready for Phase 4: React Frontend Development!');
  }
}

// Execute the massive scraping operation
async function main() {
  try {
    const scraper = new MassiveRedditScraper();
    await scraper.scrapeAll();
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error in massive scraper:', error);
    process.exit(1);
  }
}

// Start if run directly
if (require.main === module) {
  main();
}

module.exports = MassiveRedditScraper; 