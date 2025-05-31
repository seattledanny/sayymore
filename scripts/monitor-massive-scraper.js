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

async function monitorProgress() {
  console.log('📊 MASSIVE SCRAPER PROGRESS MONITOR');
  console.log('═'.repeat(80));
  
  try {
    let totalPosts = 0;
    let completedSubreddits = 0;
    let pendingSubreddits = 0;
    
    console.log('📈 SUBREDDIT STATUS:');
    console.log('');
    
    // Group by category for better organization
    const categories = {
      advice: [],
      wedding: [],
      relationships: [],
      finance: [],
      work: [],
      family: [],
      stories: [],
      revenge: [],
      drama: [],
      other: []
    };
    
    for (const subreddit of EXPANDED_SUBREDDIT_CONFIG) {
      const q = query(collection(db, 'posts'), where('subreddit', '==', subreddit.name));
      const snapshot = await getDocs(q);
      const currentCount = snapshot.size;
      totalPosts += currentCount;
      
      const target = subreddit.posts_target || 100;
      const isComplete = currentCount >= target;
      const status = isComplete ? '✅' : '🔄';
      const percentage = Math.round((currentCount / target) * 100);
      
      if (isComplete) {
        completedSubreddits++;
      } else {
        pendingSubreddits++;
      }
      
      const category = subreddit.category || 'other';
      if (categories[category]) {
        categories[category].push({
          name: subreddit.name,
          display_name: subreddit.display_name,
          current: currentCount,
          target: target,
          percentage: percentage,
          status: status,
          complete: isComplete
        });
      }
    }
    
    // Display by category
    Object.entries(categories).forEach(([categoryName, subreddits]) => {
      if (subreddits.length === 0) return;
      
      const categoryEmoji = {
        advice: '💡',
        wedding: '💍',
        relationships: '💕',
        finance: '💰',
        work: '🏢',
        family: '👨‍👩‍👧‍👦',
        stories: '📖',
        revenge: '⚖️',
        drama: '🎭',
        other: '🔄'
      };
      
      console.log(`${categoryEmoji[categoryName]} ${categoryName.toUpperCase()} (${subreddits.length} subreddits):`);
      
      subreddits.forEach(sub => {
        const progressBar = '█'.repeat(Math.floor(sub.percentage / 5)) + '░'.repeat(20 - Math.floor(sub.percentage / 5));
        console.log(`  ${sub.status} r/${sub.name.padEnd(20)} │${progressBar}│ ${sub.current.toString().padStart(3)}/${sub.target} (${sub.percentage}%)`);
      });
      console.log('');
    });
    
    // Summary
    console.log('═'.repeat(80));
    console.log('📊 OVERALL PROGRESS:');
    console.log(`   🎯 Total subreddits: ${EXPANDED_SUBREDDIT_CONFIG.length}`);
    console.log(`   ✅ Completed: ${completedSubreddits}`);
    console.log(`   🔄 Pending: ${pendingSubreddits}`);
    console.log(`   📈 Total posts collected: ${totalPosts.toLocaleString()}`);
    console.log(`   📊 Progress: ${Math.round((completedSubreddits / EXPANDED_SUBREDDIT_CONFIG.length) * 100)}%`);
    
    if (pendingSubreddits === 0) {
      console.log('');
      console.log('🎉 ALL SUBREDDITS COMPLETE!');
      console.log('🚀 Ready for Phase 4: React Frontend Development!');
    } else {
      const remainingPosts = pendingSubreddits * 100;
      console.log(`   🎯 Estimated posts remaining: ${remainingPosts.toLocaleString()}`);
    }
    
    console.log('═'.repeat(80));
    
  } catch (error) {
    console.error('❌ Error monitoring progress:', error);
  }
  
  process.exit(0);
}

// Auto-refresh mode
async function autoMonitor() {
  console.clear();
  await monitorProgress();
  
  // Check if we want to keep monitoring
  const args = process.argv.slice(2);
  if (args.includes('--watch') || args.includes('-w')) {
    setTimeout(() => {
      autoMonitor();
    }, 30000); // Refresh every 30 seconds
  }
}

if (require.main === module) {
  autoMonitor();
} 