require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, updateDoc } = require('firebase/firestore');
const fetch = require('node-fetch');

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

// Reddit API configuration
const REDDIT_CLIENT_ID = process.env.REACT_APP_REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REACT_APP_REDDIT_CLIENT_SECRET;
const REDDIT_USER_AGENT = process.env.REACT_APP_REDDIT_USER_AGENT || 'RedditImageFetcher/1.0.0';

let accessToken = null;
let tokenExpiry = 0;

// Get Reddit API access token
async function getRedditAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const auth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': REDDIT_USER_AGENT
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`Reddit auth failed: ${response.status}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer
  
  return accessToken;
}

// Fetch post data from Reddit API
async function fetchRedditPost(subreddit, postId) {
  try {
    const token = await getRedditAccessToken();
    const url = `https://oauth.reddit.com/r/${subreddit}/comments/${postId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': REDDIT_USER_AGENT
      }
    });

    if (!response.ok) {
      console.log(`  ⚠️  Failed to fetch r/${subreddit}/${postId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    const postData = data[0]?.data?.children?.[0]?.data;
    return postData;
  } catch (error) {
    console.log(`  ❌ Error fetching r/${subreddit}/${postId}: ${error.message}`);
    return null;
  }
}

// Extract image info from Reddit post data
function extractImageFromRedditData(postData) {
  const imageInfo = {
    hasImage: false,
    imageUrl: null,
    thumbnail: null,
    imageType: null
  };

  // Check preview images
  if (postData.preview && postData.preview.images && postData.preview.images.length > 0) {
    const preview = postData.preview.images[0];
    if (preview.source && preview.source.url) {
      imageInfo.hasImage = true;
      imageInfo.imageUrl = preview.source.url.replace(/&amp;/g, '&');
      imageInfo.imageType = 'preview';
      
      // Get thumbnail
      if (preview.resolutions && preview.resolutions.length > 0) {
        imageInfo.thumbnail = preview.resolutions[0].url.replace(/&amp;/g, '&');
      }
    }
  }

  // Check direct image URL
  if (!imageInfo.hasImage && postData.url) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const urlLower = postData.url.toLowerCase();
    if (imageExtensions.some(ext => urlLower.includes(ext))) {
      imageInfo.hasImage = true;
      imageInfo.imageUrl = postData.url;
      imageInfo.imageType = 'direct';
    }
  }

  // Check for Reddit image domains
  if (!imageInfo.hasImage && postData.url) {
    const redditImageDomains = ['i.redd.it', 'preview.redd.it', 'external-preview.redd.it'];
    if (redditImageDomains.some(domain => postData.url.includes(domain))) {
      imageInfo.hasImage = true;
      imageInfo.imageUrl = postData.url;
      imageInfo.imageType = 'reddit';
    }
  }

  // Check for imgur
  if (!imageInfo.hasImage && postData.url && postData.url.includes('imgur.com')) {
    imageInfo.hasImage = true;
    let imgurUrl = postData.url;
    if (!imgurUrl.includes('.') && !imgurUrl.includes('/gallery/')) {
      imgurUrl = imgurUrl.replace('imgur.com/', 'i.imgur.com/') + '.jpg';
    }
    imageInfo.imageUrl = imgurUrl;
    imageInfo.imageType = 'imgur';
  }

  return imageInfo;
}

async function fetchRedditImages() {
  console.log('🔍 FETCHING ACTUAL REDDIT IMAGE URLS');
  console.log('====================================\n');

  try {
    // Find posts that have hasImage=true but no imageUrl
    console.log('📊 Finding posts with indicated images but missing URLs...');
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      where('hasImage', '==', true),
      where('imageType', '==', 'indicated')
    );
    
    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.docs.length} posts to process\n`);

    let updatedCount = 0;
    let successCount = 0;
    let failureCount = 0;

    for (const docSnapshot of snapshot.docs) {
      const postData = docSnapshot.data();
      const postRef = doc(db, 'posts', docSnapshot.id);

      // Skip if already has imageUrl
      if (postData.imageUrl) {
        continue;
      }

      console.log(`🔍 Fetching: "${postData.title.substring(0, 60)}..."`);
      console.log(`   URL: ${postData.url}`);

      // Extract post ID from Reddit URL
      const urlMatch = postData.url.match(/\/comments\/([a-zA-Z0-9]+)\//);
      if (!urlMatch) {
        console.log(`  ⚠️  Could not extract post ID from URL`);
        failureCount++;
        continue;
      }

      const redditPostId = urlMatch[1];
      
      // Fetch Reddit data
      const redditData = await fetchRedditPost(postData.subreddit, redditPostId);
      if (!redditData) {
        failureCount++;
        continue;
      }

      // Extract image information
      const imageInfo = extractImageFromRedditData(redditData);
      
      if (imageInfo.hasImage && imageInfo.imageUrl) {
        // Update Firestore
        await updateDoc(postRef, {
          imageUrl: imageInfo.imageUrl,
          thumbnail: imageInfo.thumbnail,
          imageType: imageInfo.imageType
        });

        console.log(`  ✅ Image URL found: ${imageInfo.imageType}`);
        console.log(`     ${imageInfo.imageUrl.substring(0, 80)}...`);
        successCount++;
      } else {
        console.log(`  ❌ No image URL found`);
        failureCount++;
      }

      updatedCount++;

      // Rate limiting - Reddit allows 60 requests per minute
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Progress update every 10 posts
      if (updatedCount % 10 === 0) {
        console.log(`\n📊 Progress: ${updatedCount}/${snapshot.docs.length} processed (${successCount} successful, ${failureCount} failed)\n`);
      }
    }

    console.log('\n🎉 REDDIT IMAGE FETCHING COMPLETE!');
    console.log('==================================');
    console.log(`📊 Total posts processed: ${updatedCount}`);
    console.log(`✅ Successful image fetches: ${successCount}`);
    console.log(`❌ Failed fetches: ${failureCount}`);
    console.log(`📈 Success rate: ${(successCount/updatedCount*100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Image fetching failed:', error);
  }
}

// Run the image fetcher
fetchRedditImages().then(() => {
  console.log('\n✨ Image fetching script complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 