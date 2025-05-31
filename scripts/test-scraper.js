/**
 * Test script for Reddit scraper
 * Tests authentication and basic scraping functionality
 */

const RedditScraper = require('./reddit-scraper');
require('dotenv').config();

async function testScraper() {
  console.log('🧪 Testing Reddit Scraper Setup...\n');

  const scraper = new RedditScraper();

  try {
    // Test 1: Authentication
    console.log('1. Testing Reddit API authentication...');
    const token = await scraper.getAccessToken();
    console.log('✅ Authentication successful');
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // Test 2: Fetch posts from a single subreddit
    console.log('\n2. Testing post fetching...');
    const testSubreddit = 'AmItheAsshole';
    const result = await scraper.fetchSubredditPosts(testSubreddit, 5, 'hot');
    console.log(`✅ Fetched ${result.posts.length} posts from r/${testSubreddit}`);

    // Test 3: Process one post with comments
    if (result.posts.length > 0) {
      console.log('\n3. Testing comment fetching...');
      const firstPost = result.posts[0].data;
      console.log(`   Post: "${firstPost.title.substring(0, 50)}..."`);
      console.log(`   Score: ${firstPost.score}, Comments: ${firstPost.num_comments}`);

      const comments = await scraper.fetchPostComments(testSubreddit, firstPost.id, 3);
      const processedComments = scraper.processComments(comments);
      
      console.log(`✅ Fetched ${processedComments.length} comments`);
      
      if (processedComments.length > 0) {
        console.log(`   Sample comment: "${processedComments[0].body.substring(0, 80)}..."`);
      }
    }

    // Test 4: Full scraping pipeline (small scale)
    console.log('\n4. Testing full scraping pipeline...');
    const posts = await scraper.scrapeSubreddit(testSubreddit, 3);
    console.log(`✅ Full pipeline test: ${posts.length} posts processed`);
    
    posts.forEach((post, i) => {
      console.log(`   ${i + 1}. "${post.title.substring(0, 40)}..." (${post.comments.length} comments)`);
    });

    console.log('\n🎉 All tests passed! Scraper is ready for production.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testScraper();
}

module.exports = testScraper; 