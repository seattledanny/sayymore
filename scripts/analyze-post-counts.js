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

async function analyzePostCounts() {
  console.log('📊 ANALYZING POST COUNTS BY SUBREDDIT');
  console.log('═'.repeat(80));
  
  try {
    // Get all subreddits and their counts
    const subredditCounts = {};
    let totalPosts = 0;
    
    // First, let's get all unique subreddits from the database
    const allPostsQuery = query(collection(db, 'posts'));
    const allPostsSnapshot = await getDocs(allPostsQuery);
    
    // Count posts per subreddit
    allPostsSnapshot.forEach((doc) => {
      const data = doc.data();
      const subreddit = data.subreddit;
      if (!subredditCounts[subreddit]) {
        subredditCounts[subreddit] = 0;
      }
      subredditCounts[subreddit]++;
      totalPosts++;
    });
    
    console.log(`🎯 TOTAL POSTS IN DATABASE: ${totalPosts.toLocaleString()}\n`);
    
    // Group by category
    const categories = {};
    
    // Process known subreddits from config
    for (const subreddit of EXPANDED_SUBREDDIT_CONFIG) {
      const category = subreddit.category;
      if (!categories[category]) {
        categories[category] = [];
      }
      
      const count = subredditCounts[subreddit.name] || 0;
      categories[category].push({
        name: subreddit.name,
        display_name: subreddit.display_name,
        count: count,
        target: subreddit.posts_target || 100,
        status: count >= (subreddit.posts_target || 100) ? '✅' : '🔄'
      });
    }
    
    // Add any extra subreddits not in config
    const knownSubreddits = EXPANDED_SUBREDDIT_CONFIG.map(s => s.name);
    const extraSubreddits = Object.keys(subredditCounts).filter(s => !knownSubreddits.includes(s));
    
    if (extraSubreddits.length > 0) {
      categories['unknown'] = extraSubreddits.map(name => ({
        name: name,
        display_name: name,
        count: subredditCounts[name],
        target: 100,
        status: subredditCounts[name] >= 100 ? '✅' : '🔄'
      }));
    }
    
    // Display by category
    const categoryOrder = ['advice', 'wedding', 'relationships', 'finance', 'work', 'family', 'stories', 'revenge', 'drama', 'neighbors', 'morality', 'creepy', 'controversial', 'unknown'];
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
      controversial: '🔥',
      unknown: '❓'
    };
    
    let grandTotal = 0;
    let completedCount = 0;
    
    for (const categoryName of categoryOrder) {
      const categorySubreddits = categories[categoryName];
      if (!categorySubreddits || categorySubreddits.length === 0) continue;
      
      const emoji = categoryEmojis[categoryName] || '📁';
      const categoryTitle = categoryName.toUpperCase();
      const categoryTotal = categorySubreddits.reduce((sum, s) => sum + s.count, 0);
      
      console.log(`${emoji} ${categoryTitle} (${categorySubreddits.length} subreddits, ${categoryTotal.toLocaleString()} posts):`);
      console.log('─'.repeat(80));
      
      // Sort by post count (descending)
      categorySubreddits.sort((a, b) => b.count - a.count);
      
      for (const subreddit of categorySubreddits) {
        const percentage = subreddit.target > 0 ? Math.round((subreddit.count / subreddit.target) * 100) : 0;
        console.log(`  ${subreddit.status} r/${subreddit.name.padEnd(25)} │ ${subreddit.count.toString().padStart(3)} posts │ ${percentage.toString().padStart(3)}% of target (${subreddit.target})`);
        grandTotal += subreddit.count;
        if (subreddit.count >= subreddit.target) completedCount++;
      }
      console.log('');
    }
    
    console.log('═'.repeat(80));
    console.log('📊 SUMMARY STATISTICS:');
    console.log(`   🎯 Total unique subreddits: ${Object.keys(subredditCounts).length}`);
    console.log(`   ✅ Subreddits at target (100+ posts): ${completedCount}`);
    console.log(`   🔄 Subreddits below target: ${Object.keys(subredditCounts).length - completedCount}`);
    console.log(`   📈 Total posts collected: ${grandTotal.toLocaleString()}`);
    console.log(`   📊 Average posts per subreddit: ${Math.round(grandTotal / Object.keys(subredditCounts).length)}`);
    
    // Top 10 subreddits by post count
    console.log('\n🏆 TOP 10 SUBREDDITS BY POST COUNT:');
    console.log('─'.repeat(50));
    const sortedSubreddits = Object.entries(subredditCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    sortedSubreddits.forEach(([name, count], index) => {
      console.log(`${(index + 1).toString().padStart(2)}. r/${name.padEnd(20)} │ ${count.toString().padStart(3)} posts`);
    });
    
    console.log('═'.repeat(80));
    
  } catch (error) {
    console.error('❌ Error analyzing post counts:', error.message);
  }
}

analyzePostCounts(); 