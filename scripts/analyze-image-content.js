require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Initialize Firebase
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

// Helper function to check if URL is an image
function isImageUrl(url) {
  if (!url) return false;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const urlLower = url.toLowerCase();
  return imageExtensions.some(ext => urlLower.includes(ext));
}

// Helper function to check if URL is from image hosting sites
function isImageHostingUrl(url) {
  if (!url) return false;
  const imageHosts = [
    'imgur.com',
    'i.imgur.com',
    'i.redd.it',
    'preview.redd.it',
    'external-preview.redd.it',
    'v.redd.it',
    'gfycat.com',
    'giphy.com',
    'streamable.com',
    'flickr.com',
    'photobucket.com',
    'tinypic.com',
    'imagehosting.com'
  ];
  return imageHosts.some(host => url.includes(host));
}

// Helper function to check title for image indicators
function hasImageIndicatorInTitle(title) {
  if (!title) return false;
  const titleLower = title.toLowerCase();
  const indicators = [
    '[image]', '[img]', '[pic]', '[photo]', '[screenshot]',
    '(image)', '(img)', '(pic)', '(photo)', '(screenshot)',
    'image:', 'img:', 'pic:', 'photo:', 'screenshot:',
    '[oc image]', '[original image]', '[infographic]',
    '[chart]', '[graph]', '[diagram]', '[meme]'
  ];
  return indicators.some(indicator => titleLower.includes(indicator));
}

async function analyzeImageContent() {
  console.log('🔍 COMPREHENSIVE IMAGE CONTENT ANALYSIS');
  console.log('======================================\n');

  try {
    // Get all posts
    console.log('📊 Fetching all posts from Firestore...');
    const postsCollection = collection(db, 'posts');
    const snapshot = await getDocs(postsCollection);
    
    console.log(`Found ${snapshot.docs.length} total posts to analyze\n`);

    // Analysis categories
    const results = {
      totalPosts: snapshot.docs.length,
      hasImageField: 0,
      hasImageUrl: 0,
      titleIndicators: 0,
      directImageUrls: 0,
      imageHostingUrls: 0,
      redditImageUrls: 0,
      imgurUrls: 0,
      uniqueImagePosts: new Set(),
      imagePostsBySubreddit: {},
      imageTypeBreakdown: {}
    };

    // Analyze each post
    console.log('🔍 Analyzing posts for image content...\n');
    snapshot.docs.forEach((doc, index) => {
      const post = doc.data();
      const postId = doc.id;
      let hasAnyImageContent = false;
      let imageTypes = [];

      // Check hasImage field
      if (post.hasImage === true) {
        results.hasImageField++;
        hasAnyImageContent = true;
        imageTypes.push('hasImage field');
      }

      // Check imageUrl field
      if (post.imageUrl) {
        results.hasImageUrl++;
        hasAnyImageContent = true;
        imageTypes.push('has imageUrl');
      }

      // Check title for image indicators
      if (hasImageIndicatorInTitle(post.title)) {
        results.titleIndicators++;
        hasAnyImageContent = true;
        imageTypes.push('title indicator');
      }

      // Check if URL is direct image
      if (isImageUrl(post.url)) {
        results.directImageUrls++;
        hasAnyImageContent = true;
        imageTypes.push('direct image URL');
      }

      // Check if URL is from image hosting
      if (isImageHostingUrl(post.url)) {
        results.imageHostingUrls++;
        hasAnyImageContent = true;
        imageTypes.push('image hosting');

        // Specific breakdowns
        if (post.url && post.url.includes('imgur.com')) {
          results.imgurUrls++;
        }
        if (post.url && (post.url.includes('i.redd.it') || post.url.includes('preview.redd.it') || post.url.includes('external-preview.redd.it'))) {
          results.redditImageUrls++;
        }
      }

      // Track unique image posts
      if (hasAnyImageContent) {
        results.uniqueImagePosts.add(postId);
        
        // Track by subreddit
        const subreddit = post.subreddit || 'unknown';
        if (!results.imagePostsBySubreddit[subreddit]) {
          results.imagePostsBySubreddit[subreddit] = 0;
        }
        results.imagePostsBySubreddit[subreddit]++;

        // Track image types
        imageTypes.forEach(type => {
          if (!results.imageTypeBreakdown[type]) {
            results.imageTypeBreakdown[type] = 0;
          }
          results.imageTypeBreakdown[type]++;
        });

        // Sample logging for first 10 image posts
        if (results.uniqueImagePosts.size <= 10) {
          console.log(`📷 ${results.uniqueImagePosts.size}. "${post.title.substring(0, 60)}..." (${imageTypes.join(', ')})`);
          if (post.url) {
            console.log(`   URL: ${post.url.substring(0, 80)}...`);
          }
          console.log('');
        }
      }

      // Progress indicator
      if ((index + 1) % 1000 === 0) {
        console.log(`   Processed ${index + 1}/${snapshot.docs.length} posts...`);
      }
    });

    // Display comprehensive results
    console.log('\n🎉 COMPREHENSIVE IMAGE ANALYSIS COMPLETE!');
    console.log('==========================================\n');

    console.log('📊 OVERALL STATISTICS:');
    console.log(`   Total posts in database: ${results.totalPosts.toLocaleString()}`);
    console.log(`   🖼️  Posts with ANY image content: ${results.uniqueImagePosts.size.toLocaleString()}`);
    console.log(`   📈 Image content percentage: ${(results.uniqueImagePosts.size / results.totalPosts * 100).toFixed(1)}%`);
    console.log('');

    console.log('🔍 DETECTION METHOD BREAKDOWN:');
    console.log(`   📋 Posts with hasImage=true: ${results.hasImageField.toLocaleString()}`);
    console.log(`   🔗 Posts with imageUrl set: ${results.hasImageUrl.toLocaleString()}`);
    console.log(`   📝 Posts with [image] in title: ${results.titleIndicators.toLocaleString()}`);
    console.log(`   🖼️  Direct image URLs: ${results.directImageUrls.toLocaleString()}`);
    console.log(`   🌐 Image hosting URLs: ${results.imageHostingUrls.toLocaleString()}`);
    console.log(`     ↳ Imgur: ${results.imgurUrls.toLocaleString()}`);
    console.log(`     ↳ Reddit CDN: ${results.redditImageUrls.toLocaleString()}`);
    console.log('');

    console.log('📱 TOP SUBREDDITS WITH IMAGES:');
    const sortedSubreddits = Object.entries(results.imagePostsBySubreddit)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15);
    
    sortedSubreddits.forEach(([subreddit, count], index) => {
      const percentage = (count / results.uniqueImagePosts.size * 100).toFixed(1);
      console.log(`   ${(index + 1).toString().padStart(2)}. r/${subreddit}: ${count.toLocaleString()} posts (${percentage}%)`);
    });

    console.log('');
    console.log('🏷️  IMAGE TYPE BREAKDOWN:');
    Object.entries(results.imageTypeBreakdown)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        const percentage = (count / results.uniqueImagePosts.size * 100).toFixed(1);
        console.log(`   • ${type}: ${count.toLocaleString()} (${percentage}%)`);
      });

    console.log('\n💡 INSIGHTS:');
    if (results.uniqueImagePosts.size > 1000) {
      console.log(`   🎯 You have ${results.uniqueImagePosts.size.toLocaleString()} posts with visual content!`);
      console.log(`   🚀 That's ${(results.uniqueImagePosts.size / results.totalPosts * 100).toFixed(1)}% of your database`);
    }
    
    if (results.titleIndicators > results.hasImageUrl) {
      const potential = results.titleIndicators - results.hasImageUrl;
      console.log(`   ⭐ ${potential.toLocaleString()} posts with [image] tags need actual image URLs fetched`);
    }

    if (results.imageHostingUrls > results.hasImageUrl) {
      const potential = results.imageHostingUrls - results.hasImageUrl;
      console.log(`   📸 ${potential.toLocaleString()} additional image URLs could be extracted`);
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

// Run the analysis
analyzeImageContent().then(() => {
  console.log('\n✨ Analysis complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 