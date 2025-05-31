require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, getDocs, where } = require('firebase/firestore');
const { EXPANDED_SUBREDDIT_CONFIG } = require('./expanded-subreddit-config');

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

function clearScreen() {
  process.stdout.write('\x1b[2J\x1b[0f');
}

function createProgressBar(current, target, width = 20) {
  const percentage = Math.min(current / target, 1);
  const filled = Math.floor(percentage * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

async function monitorProgress() {
  const startTime = Date.now();
  
  while (true) {
    try {
      clearScreen();
      
      console.log('🚀 MASSIVE SCRAPER - REAL-TIME MONITOR');
      console.log('═'.repeat(80));
      console.log(`⏰ ${new Date().toLocaleTimeString()} | Update every 5 seconds | Press Ctrl+C to exit\n`);
      
      // Get subreddit counts
      const subredditCounts = {};
      let totalPosts = 0;
      let completedSubreddits = 0;
      
      // Group subreddits by category
      const categories = {};
      
      for (const subreddit of EXPANDED_SUBREDDIT_CONFIG) {
        if (subreddit.status === 'complete') {
          subredditCounts[subreddit.name] = subreddit.posts_collected || 100;
          totalPosts += subredditCounts[subreddit.name];
          completedSubreddits++;
        } else {
          // Query current count
          const q = query(collection(db, 'posts'), where('subreddit', '==', subreddit.name));
          const snapshot = await getDocs(q);
          const count = snapshot.size;
          subredditCounts[subreddit.name] = count;
          totalPosts += count;
          
          if (count >= (subreddit.posts_target || 100)) {
            completedSubreddits++;
          }
        }
        
        // Group by category
        const category = subreddit.category;
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push({
          ...subreddit,
          currentCount: subredditCounts[subreddit.name]
        });
      }
      
      // Display by category
      const categoryOrder = ['advice', 'wedding', 'relationships', 'finance', 'work', 'family', 'stories', 'revenge', 'drama', 'neighbors', 'morality', 'creepy', 'controversial'];
      const categoryEmojis = {
        advice: '💡',
        wedding: '💍', 
        relationships: '💕',
        finance: '💰',
        work: '🏢',
        family: '👨‍👩‍👧‍👦',
        stories: '📖',
        revenge: '⚖️',
        drama: '🎭',
        neighbors: '🏠',
        morality: '⚖️',
        creepy: '👻',
        controversial: '🔥'
      };
      
      for (const categoryName of categoryOrder) {
        const categorySubreddits = categories[categoryName];
        if (!categorySubreddits) continue;
        
        const emoji = categoryEmojis[categoryName] || '📁';
        const categoryTitle = categoryName.toUpperCase();
        console.log(`${emoji} ${categoryTitle} (${categorySubreddits.length} subreddits):`);
        
        for (const subreddit of categorySubreddits) {
          const target = subreddit.posts_target || 100;
          const current = subreddit.currentCount;
          const percentage = Math.round((current / target) * 100);
          const bar = createProgressBar(current, target);
          const status = current >= target ? '✅' : '🔄';
          
          console.log(`  ${status} r/${subreddit.name.padEnd(20)} │${bar}│ ${current.toString().padStart(3)}/${target} (${percentage}%)`);
        }
        console.log('');
      }
      
      // Overall stats
      const totalTargetPosts = EXPANDED_SUBREDDIT_CONFIG.reduce((sum, s) => sum + (s.posts_target || 100), 0);
      const overallPercentage = Math.round((totalPosts / totalTargetPosts) * 100);
      const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
      
      console.log('═'.repeat(80));
      console.log('📊 OVERALL PROGRESS:');
      console.log(`   🎯 Total subreddits: ${EXPANDED_SUBREDDIT_CONFIG.length}`);
      console.log(`   ✅ Completed: ${completedSubreddits}`);
      console.log(`   🔄 Pending: ${EXPANDED_SUBREDDIT_CONFIG.length - completedSubreddits}`);
      console.log(`   📈 Total posts collected: ${totalPosts.toLocaleString()}`);
      console.log(`   📊 Progress: ${overallPercentage}%`);
      console.log(`   🎯 Target posts: ${totalTargetPosts.toLocaleString()}`);
      console.log(`   ⏱️  Runtime: ${elapsed} minutes`);
      
      if (completedSubreddits < EXPANDED_SUBREDDIT_CONFIG.length) {
        const remaining = totalTargetPosts - totalPosts;
        console.log(`   📊 Estimated posts remaining: ${remaining.toLocaleString()}`);
      } else {
        console.log('   🎉 ALL SUBREDDITS COMPLETE!');
      }
      
      console.log('═'.repeat(80));
      
      // Wait 5 seconds before next update
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error('❌ Monitor error:', error.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Monitor stopped. Scraper continues running in background!');
  process.exit(0);
});

console.log('🚀 Starting real-time monitor...');
monitorProgress(); 