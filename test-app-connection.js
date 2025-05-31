// Quick test to verify Firebase connection and data fetching
import { postService } from './src/services/postService.js';

const testAppConnection = async () => {
  console.log('🧪 Testing app connection to Firebase...');
  
  try {
    // Test fetching categories
    console.log('📋 Fetching categories...');
    const categories = await postService.getCategories();
    console.log(`✅ Categories loaded: ${categories.length} categories`);
    
    // Test fetching posts
    console.log('📱 Fetching posts...');
    const result = await postService.getPosts({ limitCount: 5 });
    console.log(`✅ Posts loaded: ${result.posts.length} posts`);
    
    if (result.posts.length > 0) {
      const firstPost = result.posts[0];
      console.log('📄 Sample post:');
      console.log(`   Title: ${firstPost.title?.slice(0, 50)}...`);
      console.log(`   Subreddit: r/${firstPost.subreddit}`);
      console.log(`   Score: ${firstPost.score} points`);
      console.log(`   Comments: ${firstPost.comments?.length || 0} comments`);
    }
    
    console.log('🎉 App connection test SUCCESSFUL!');
    console.log('🚀 Your React app should now be running at http://localhost:3000');
    
  } catch (error) {
    console.error('❌ App connection test FAILED:');
    console.error(error);
    
    if (error.message.includes('permission-denied')) {
      console.log('💡 Tip: Check your Firebase security rules');
    } else if (error.message.includes('network')) {
      console.log('💡 Tip: Check your internet connection');
    } else {
      console.log('💡 Tip: Check your .env file and Firebase configuration');
    }
  }
};

// Run the test
testAppConnection(); 