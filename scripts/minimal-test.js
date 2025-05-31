/**
 * Minimal test - scrape one post and save as JSON file
 * This tests the complete pipeline without Firebase permissions
 */

const RedditScraper = require('./reddit-scraper');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function minimalTest() {
  console.log('🧪 MINIMAL TEST - Complete Pipeline');
  console.log('===================================\n');

  const scraper = new RedditScraper();

  try {
    // Test scraping one post with comments
    console.log('📋 Scraping 1 post from r/AmItheAsshole...');
    const posts = await scraper.scrapeSubreddit('AmItheAsshole', 1);

    if (posts.length === 0) {
      console.log('❌ No posts scraped');
      return;
    }

    const post = posts[0];
    console.log('✅ Post scraped successfully!');
    console.log(`   Title: "${post.title}"`);
    console.log(`   Score: ${post.score}`);
    console.log(`   Comments: ${post.comments.length}`);
    console.log(`   Body: ${post.body.substring(0, 100)}...`);

    // Save to file for inspection
    const outputPath = path.join(__dirname, 'sample-post.json');
    fs.writeFileSync(outputPath, JSON.stringify(post, null, 2));
    
    console.log(`\n💾 Saved sample post to: ${outputPath}`);
    console.log('\n📊 Sample Data Structure:');
    console.log('   ✓ Post ID:', post.id);
    console.log('   ✓ Title:', post.title ? '✅' : '❌');
    console.log('   ✓ Body:', post.body ? '✅' : '❌');
    console.log('   ✓ Author:', post.author ? '✅' : '❌');
    console.log('   ✓ Subreddit:', post.subreddit ? '✅' : '❌');
    console.log('   ✓ URL:', post.url ? '✅' : '❌');
    console.log('   ✓ Score:', post.score ? '✅' : '❌');
    console.log('   ✓ Comments:', post.comments.length);

    if (post.comments.length > 0) {
      console.log('\n💬 Sample Comment:');
      const comment = post.comments[0];
      console.log(`   Author: ${comment.author}`);
      console.log(`   Score: ${comment.score}`);
      console.log(`   Body: "${comment.body.substring(0, 100)}..."`);
    }

    console.log('\n🎉 Minimal test successful! Data structure ready for Firebase.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  minimalTest();
}

module.exports = minimalTest; 