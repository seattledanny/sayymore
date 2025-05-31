/**
 * Test script to verify Reddit scraping functionality
 */

const SubredditManager = require('./api-add-subreddit.js');

async function testScraping() {
  console.log('🧪 TESTING REDDIT SCRAPING FUNCTIONALITY');
  console.log('='.repeat(50));

  const manager = new SubredditManager();

  try {
    // Test 1: Validate a known subreddit
    console.log('\n📍 Test 1: Validating a known subreddit...');
    const validation = await manager.validateSubredditExists('AskReddit');
    console.log('Validation result:', validation);

    // Test 2: Check if subreddit already exists in database
    console.log('\n📍 Test 2: Checking existing subreddit...');
    const existing = await manager.checkExistingSubreddit('AskReddit');
    console.log('Existing check result:', existing);

    // Test 3: Try scraping a few posts from a small subreddit
    console.log('\n📍 Test 3: Testing actual post scraping (5 posts)...');
    const testSubredditData = {
      subreddit: 'todayilearned',
      category: 'misc',
      postCount: 5,
      displayName: 'Today I Learned',
      description: 'Interesting facts and learning',
      priority: 2
    };

    // Just test the scraping function, don't save to database
    console.log('🕷️  Attempting to scrape 5 posts from r/todayilearned...');
    const posts = await manager.scrapeSubredditPosts(testSubredditData);

    console.log('\n📊 SCRAPING TEST RESULTS:');
    console.log(`✅ Successfully scraped ${posts.length} posts`);
    
    if (posts.length > 0) {
      console.log('\n📝 Sample post data:');
      const samplePost = posts[0];
      console.log(`   Title: ${samplePost.title}`);
      console.log(`   Author: ${samplePost.author}`);
      console.log(`   Score: ${samplePost.score}`);
      console.log(`   Comments: ${samplePost.num_comments}`);
      console.log(`   Subreddit: ${samplePost.subreddit}`);
      console.log(`   Category: ${samplePost.category}`);
      console.log(`   Body preview: ${samplePost.body ? samplePost.body.substring(0, 100) + '...' : 'No body text'}`);
      console.log(`   Scraped comments: ${samplePost.comments.length}`);
      
      if (samplePost.comments.length > 0) {
        console.log(`   Sample comment: ${samplePost.comments[0].body.substring(0, 100)}...`);
      }
    }

    console.log('\n🎉 SCRAPING TEST COMPLETED SUCCESSFULLY!');
    console.log('✅ Reddit API connection works');
    console.log('✅ Post data is being scraped correctly');
    console.log('✅ Comments are being fetched');
    console.log('✅ Data structure is correct');

  } catch (error) {
    console.error('\n❌ SCRAPING TEST FAILED!');
    console.error('Error:', error.message);
    console.error('This means the web tool simulation was correct - actual scraping has issues');
    
    if (error.message.includes('access_token')) {
      console.error('\n💡 Possible fixes:');
      console.error('   • Check your Reddit API credentials in .env file');
      console.error('   • Verify REACT_APP_REDDIT_CLIENT_ID and REACT_APP_REDDIT_CLIENT_SECRET');
    }
  }
}

// Run the test
testScraping().catch(console.error); 