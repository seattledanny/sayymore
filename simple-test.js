// Simple test to verify PostService works
import { postService } from './src/services/postService.js';

const simpleTest = async () => {
  console.log('🧪 Testing basic PostService functionality...');
  
  try {
    console.log('1. Testing unfiltered posts...');
    const result = await postService.getPosts({ limitCount: 5 });
    console.log(`✅ Got ${result.posts.length} posts without filters`);
    
    if (result.posts.length > 0) {
      const post = result.posts[0];
      console.log(`📄 Sample post: "${post.title?.slice(0, 50)}..."`);
      console.log(`   Category: ${post.category || 'None'}`);
      console.log(`   Subreddit: ${post.subreddit || 'None'}`);
      console.log(`   Score: ${post.score || 0}`);
    }
    
    console.log('\n2. Testing categories loading...');
    const categories = await postService.getCategories();
    console.log(`✅ Got ${categories.length} categories`);
    
    console.log('\n3. Testing subreddits loading...');  
    const subreddits = await postService.getSubreddits();
    console.log(`✅ Got ${subreddits.length} subreddits`);
    
    console.log('\n🎉 Basic functionality works!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
};

simpleTest(); 