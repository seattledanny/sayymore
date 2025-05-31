/**
 * Clear PostService Cache - Force fresh data load
 */

console.log('🔄 Clearing PostService cache...');

// This is a simple cache clearer that works by importing and using the postService
import('../src/services/postService.js')
  .then(({ postService }) => {
    postService.clearCache();
    console.log('✅ Cache cleared! Refresh your browser to see updated subreddit order.');
  })
  .catch(error => {
    console.log('⚠️ Could not clear cache programmatically.');
    console.log('💡 Solution: Hard refresh your browser (Ctrl+Shift+R / Cmd+Shift+R)');
  }); 