#!/usr/bin/env node

/**
 * UPDATE GUIDE FOR EXISTING SCRAPER
 * 
 * This script shows what changes to make to your existing reddit-scraper.js
 * to capture crosspost metadata from Reddit's API
 */

console.log('📋 HOW TO UPDATE YOUR EXISTING SCRAPER FOR CROSSPOSTS');
console.log('====================================================\n');

console.log('🔧 STEP 1: Update the processedPost object in reddit-scraper.js');
console.log('----------------------------------------------------------------');
console.log(`
In your reddit-scraper.js file, around line 190-200, update the processedPost object:

CURRENT:
const processedPost = {
  id: post.id,
  title: post.title,
  body: post.selftext || '',
  author: post.author,
  subreddit: subreddit,
  url: \`https://reddit.com\${post.permalink}\`,
  permalink: post.permalink,
  score: post.score,
  num_comments: post.num_comments,
  created_utc: post.created_utc,
  scraped_at: new Date().toISOString(),
  comments: processedComments
};

UPDATED:
const processedPost = {
  id: post.id,
  title: post.title,
  body: post.selftext || '',
  author: post.author,
  subreddit: subreddit,
  url: \`https://reddit.com\${post.permalink}\`,
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
`);

console.log('\n🔧 STEP 2: Add crosspost logging');
console.log('----------------------------------');
console.log(`
Add this after the processedPost creation:

// Log crosspost detection
if (processedPost.is_crosspost) {
  console.log(\`   🔗 CROSSPOST detected! Original: r/\${processedPost.crosspost_parent_subreddit}\`);
}
`);

console.log('\n🔧 STEP 3: Update database schema (Optional but recommended)');
console.log('----------------------------------------------------------');
console.log(`
Add these fields to your Firebase/database documentation:

- is_crosspost: Boolean
- crosspost_parent_id: String (original post ID)
- crosspost_parent_subreddit: String (original subreddit)
- crosspost_parent_title: String (original title)
- crosspost_chain_length: Number (how many times crossposted)
- num_crossposts: Number (how many times this post has been crossposted)
`);

console.log('\n🔧 STEP 4: Update your mobile components');
console.log('----------------------------------------');
console.log(`
In MobilePostView.js and other components, you can now show crosspost info:

{post.is_crosspost && (
  <div className="crosspost-indicator">
    🔗 Originally posted in r/{post.crosspost_parent_subreddit}
  </div>
)}
`);

console.log('\n📊 RESULTS FROM YOUR TEST:');
console.log('---------------------------');
console.log('✅ AmItheDevil: 95% crossposts detected');
console.log('✅ Reddit API provides full crosspost metadata');
console.log('✅ Original sources identified (relationship_advice, AITA, etc.)');
console.log('✅ No need for pattern detection - official data is available');

console.log('\n🎯 IMMEDIATE ACTION ITEMS:');
console.log('--------------------------');
console.log('1. ✍️  Update reddit-scraper.js with the code above');
console.log('2. 🧪 Test the updated scraper on a small subreddit');
console.log('3. 🔄 Run a rescrape of AmItheDevil to capture crosspost data');
console.log('4. 🎨 Update your UI to show original source information');
console.log('5. 📱 Consider adding crosspost indicators to mobile view');

console.log('\n💡 UI ENHANCEMENT IDEAS:');
console.log('------------------------');
console.log('• Show "Originally from r/relationship_advice" badges');
console.log('• Add a filter to show only original content vs crossposts');
console.log('• Group posts by original subreddit');
console.log('• Show crosspost chain for posts that were crossposted multiple times');
console.log('• Add a "View Original" button that links to the source post');

console.log('\n🔄 RESCRAPING STRATEGY:');
console.log('-----------------------');
console.log('• Focus on AmItheDevil first (highest crosspost rate)');
console.log('• Check other meta subreddits in your list');
console.log('• Keep existing data, just add crosspost fields');
console.log('• Consider running the enhanced scraper on new posts going forward');

console.log('\n✨ This is exactly the kind of metadata that will make your app unique!');
console.log('Users can now see the full story behind controversial posts.'); 