/**
 * Monitor scraping progress in real-time
 */

const { initializeFirebase } = require('./firebase-client-scraper');
const { collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

async function monitorProgress() {
  try {
    const db = initializeFirebase();
    const postsRef = collection(db, 'posts');
    
    // Get total count
    const snapshot = await getDocs(postsRef);
    const totalPosts = snapshot.size;
    
    // Get posts by subreddit
    const subredditCounts = {};
    const recentPosts = [];
    
    snapshot.forEach(doc => {
      const post = doc.data();
      subredditCounts[post.subreddit] = (subredditCounts[post.subreddit] || 0) + 1;
      recentPosts.push(post);
    });
    
    // Sort recent posts by scraped_at
    recentPosts.sort((a, b) => new Date(b.scraped_at) - new Date(a.scraped_at));
    
    console.log('🚀 REDDIT SCRAPING PROGRESS REPORT');
    console.log('================================');
    console.log(`📊 Total Posts: ${totalPosts}`);
    console.log(`⏰ Last Update: ${new Date().toLocaleTimeString()}`);
    
    console.log('\n📈 Posts by Subreddit:');
    Object.entries(subredditCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([subreddit, count]) => {
        console.log(`  r/${subreddit}: ${count} posts`);
      });
    
    console.log('\n📝 Most Recent Posts:');
    recentPosts.slice(0, 3).forEach(post => {
      const time = new Date(post.scraped_at).toLocaleTimeString();
      console.log(`  ${time} - r/${post.subreddit}: "${post.title.substring(0, 50)}..." (${post.score} pts, ${post.comments.length} comments)`);
    });
    
    // Estimate completion
    const targetSubreddits = 11;
    const postsPerSubreddit = 50;
    const targetTotal = targetSubreddits * postsPerSubreddit;
    const progress = (totalPosts / targetTotal * 100).toFixed(1);
    
    console.log(`\n🎯 Progress: ${totalPosts}/${targetTotal} posts (${progress}%)`);
    
    if (totalPosts >= targetTotal) {
      console.log('🎉 SCRAPING COMPLETE!');
    } else {
      console.log(`📅 Estimated remaining: ${targetTotal - totalPosts} posts`);
    }
    
  } catch (error) {
    console.error('❌ Monitor error:', error.message);
  }
}

if (require.main === module) {
  monitorProgress();
}

module.exports = monitorProgress; 