/**
 * Monitor HOT scraping completion and auto-start TOP scraping
 */

const { initializeFirebase } = require('./firebase-client-scraper');
const { collection, getDocs } = require('firebase/firestore');
const TopPostsScraper = require('./scrape-top-posts');

async function waitForHotCompletion() {
  console.log('🔍 Monitoring HOT scraping completion...');
  console.log('========================================\n');

  const targetHotPosts = 550; // 11 subreddits × 50 posts each
  let lastCount = 0;
  let stableCount = 0;

  while (true) {
    try {
      const db = initializeFirebase();
      const postsRef = collection(db, 'posts');
      const snapshot = await getDocs(postsRef);
      const currentCount = snapshot.size;

      const time = new Date().toLocaleTimeString();
      console.log(`${time} - Database has ${currentCount} posts (target: ${targetHotPosts})`);

      // Check if count has stabilized (no new posts for 3 checks)
      if (currentCount === lastCount) {
        stableCount++;
      } else {
        stableCount = 0;
      }

      // If we've reached target OR count has been stable for 3 minutes
      if (currentCount >= targetHotPosts || stableCount >= 6) {
        console.log('\n🎉 HOT scraping appears complete!');
        console.log(`📊 Final count: ${currentCount} posts`);
        
        if (currentCount < targetHotPosts) {
          console.log('⚠️  Note: May not have reached full target, but scraping seems finished');
        }

        console.log('\n🏆 Starting TOP posts scraping in 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Start TOP scraping
        const topScraper = new TopPostsScraper();
        await topScraper.scrapeAllTopPosts();
        break;
      }

      lastCount = currentCount;
      
      // Wait 30 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 30000));

    } catch (error) {
      console.error('❌ Monitor error:', error.message);
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
}

if (require.main === module) {
  waitForHotCompletion().catch(error => {
    console.error('💥 Fatal monitor error:', error);
    process.exit(1);
  });
}

module.exports = waitForHotCompletion; 