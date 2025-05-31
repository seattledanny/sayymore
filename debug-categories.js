// Debug script to check actual categories in the database
import { postService } from './src/services/postService.js';
import { db } from './src/firebase/config.js';
import { collection, query, getDocs, limit } from 'firebase/firestore';

const debugCategories = async () => {
  console.log('🔍 Debugging database categories...');
  
  try {
    // Get a sample of posts to see what categories exist
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, limit(50));
    const snapshot = await getDocs(q);
    
    const categories = new Set();
    const subreddits = new Set();
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.category) {
        categories.add(data.category);
      }
      if (data.subreddit) {
        subreddits.add(data.subreddit);
      }
    });
    
    console.log('📋 Actual categories in database:');
    Array.from(categories).sort().forEach(cat => console.log(`  - ${cat}`));
    
    console.log('\n📱 Sample subreddits in database:');
    Array.from(subreddits).sort().slice(0, 10).forEach(sub => console.log(`  - ${sub}`));
    
    console.log('\n🧪 Testing category filter for "advice":');
    const adviceResult = await postService.getPosts({ category: 'advice', limitCount: 3 });
    console.log(`✅ Found ${adviceResult.posts.length} advice posts`);
    
    console.log('\n🧪 Testing category filter for "wedding":');
    const weddingResult = await postService.getPosts({ category: 'wedding', limitCount: 3 });
    console.log(`✅ Found ${weddingResult.posts.length} wedding posts`);
    
    if (adviceResult.posts.length > 0) {
      console.log('\n📄 Sample advice post:');
      console.log(`   Title: ${adviceResult.posts[0].title?.slice(0, 50)}...`);
      console.log(`   Category: ${adviceResult.posts[0].category}`);
      console.log(`   Subreddit: ${adviceResult.posts[0].subreddit}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
};

// Run the debug
debugCategories(); 