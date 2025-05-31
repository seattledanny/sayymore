#!/usr/bin/env node

/**
 * TEST CROSSPOST SCRAPER
 * 
 * Test the enhanced Reddit scraper on AmItheDevil to see what
 * crosspost metadata we can actually capture from Reddit's API
 */

const RedditScraperWithCrossposts = require('./reddit-scraper-crosspost');
require('dotenv').config();

async function testCrosspostScraper() {
  console.log('🧪 TESTING ENHANCED CROSSPOST SCRAPER');
  console.log('=====================================\n');

  // Test specifically on AmItheDevil since that's where you noticed crossposts
  const subreddit = 'AmItheDevil';
  const testCount = 20; // Small sample for testing

  console.log(`🎯 Testing on r/${subreddit} with ${testCount} posts`);
  console.log('Looking for Reddit API crosspost fields:\n');

  try {
    const scraper = new RedditScraperWithCrossposts();
    const posts = await scraper.scrapeSubreddit(subreddit, testCount);

    console.log('\n📊 CROSSPOST ANALYSIS RESULTS:');
    console.log('==============================');

    let crosspostCount = 0;
    let patternCount = 0;
    const crosspostSources = new Map();
    const subredditMentions = new Map();

    posts.forEach((post, index) => {
      console.log(`\n${index + 1}. "${post.title.substring(0, 80)}..."`);
      console.log(`   Score: ${post.score} | Comments: ${post.num_comments}`);
      
      if (post.is_crosspost) {
        crosspostCount++;
        console.log(`   🔗 OFFICIAL CROSSPOST DETECTED!`);
        console.log(`      Original: r/${post.crosspost_parent_subreddit}`);
        console.log(`      Original ID: ${post.crosspost_parent_id}`);
        console.log(`      Chain length: ${post.crosspost_chain_length}`);
        
        if (post.crosspost_parent_subreddit) {
          crosspostSources.set(
            post.crosspost_parent_subreddit, 
            (crosspostSources.get(post.crosspost_parent_subreddit) || 0) + 1
          );
        }
      }

      // Check for pattern-based detection
      const patterns = post.crosspost_patterns;
      if (patterns.has_crosspost_mentions || patterns.has_repost_mentions || 
          patterns.has_source_mentions || patterns.has_meta_indicators) {
        patternCount++;
        console.log(`   📝 PATTERN INDICATORS:`);
        if (patterns.has_crosspost_mentions) console.log(`      - Crosspost mentions`);
        if (patterns.has_repost_mentions) console.log(`      - Repost mentions`);
        if (patterns.has_source_mentions) console.log(`      - Source mentions`);
        if (patterns.has_meta_indicators) console.log(`      - Meta indicators`);
      }

      // Track subreddit mentions
      if (patterns.subreddit_mentions.length > 0) {
        console.log(`   👀 Mentions subreddits: ${patterns.subreddit_mentions.join(', ')}`);
        patterns.subreddit_mentions.forEach(sub => {
          subredditMentions.set(sub, (subredditMentions.get(sub) || 0) + 1);
        });
      }

      // Show any raw crosspost data for debugging
      if (post.raw_crosspost_parent || post.raw_crosspost_parent_list) {
        console.log(`   🔧 Raw crosspost data available`);
      }
    });

    // Summary
    console.log('\n📈 SUMMARY:');
    console.log('===========');
    console.log(`Total posts analyzed: ${posts.length}`);
    console.log(`Official crossposts detected: ${crosspostCount} (${Math.round(crosspostCount/posts.length*100)}%)`);
    console.log(`Posts with crosspost patterns: ${patternCount} (${Math.round(patternCount/posts.length*100)}%)`);

    if (crosspostSources.size > 0) {
      console.log('\n🎯 CROSSPOST SOURCES:');
      Array.from(crosspostSources.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([subreddit, count]) => {
          console.log(`   r/${subreddit}: ${count} crossposts`);
        });
    }

    if (subredditMentions.size > 0) {
      console.log('\n💬 SUBREDDIT MENTIONS:');
      Array.from(subredditMentions.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([subreddit, count]) => {
          console.log(`   r/${subreddit}: ${count} mentions`);
        });
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================');

    if (crosspostCount > 0) {
      console.log('✅ Reddit API provides official crosspost metadata!');
      console.log('   - Update your main scraper to capture crosspost fields');
      console.log('   - Add crosspost detection to your database schema');
      console.log('   - Consider showing original source in your UI');
    } else {
      console.log('⚠️  No official crosspost metadata found in this sample');
      console.log('   - AmItheDevil might use manual/unofficial crossposting');
      console.log('   - Rely on pattern detection and subreddit mentions');
    }

    if (patternCount > crosspostCount) {
      console.log('📝 Pattern detection found more potential crossposts');
      console.log('   - Many posts reference other subreddits without official crosspost metadata');
      console.log('   - Consider implementing pattern-based crosspost detection');
    }

    // Save detailed results
    const results = {
      timestamp: new Date().toISOString(),
      subreddit: subreddit,
      sampleSize: posts.length,
      officialCrossposts: crosspostCount,
      patternBasedCrossposts: patternCount,
      crosspostSources: Object.fromEntries(crosspostSources),
      subredditMentions: Object.fromEntries(subredditMentions),
      posts: posts.map(post => ({
        id: post.id,
        title: post.title,
        score: post.score,
        is_crosspost: post.is_crosspost,
        crosspost_parent_subreddit: post.crosspost_parent_subreddit,
        patterns: post.crosspost_patterns
      }))
    };

    const fs = require('fs');
    fs.writeFileSync('./scripts/crosspost-test-results.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Detailed results saved to: ./scripts/crosspost-test-results.json');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testCrosspostScraper().then(() => {
  console.log('\n✨ Crosspost scraper test completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
}); 