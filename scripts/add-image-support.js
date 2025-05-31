require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } = require('firebase/firestore');

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

console.log('🔧 Firebase Config Check:');
console.log('  Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID);
console.log('  Auth Domain:', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper function to extract image information
function extractImageInfo(post) {
  const imageInfo = {
    hasImage: false,
    imageUrl: null,
    thumbnail: null,
    imageType: null
  };

  // Check if it's a direct image link
  if (post.url) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const urlLower = post.url.toLowerCase();
    if (imageExtensions.some(ext => urlLower.includes(ext))) {
      imageInfo.hasImage = true;
      imageInfo.imageUrl = post.url;
      imageInfo.imageType = 'direct';
    }
  }

  // Check if title indicates image content
  if (!imageInfo.hasImage && post.title) {
    const titleLower = post.title.toLowerCase();
    if (titleLower.includes('[image]') || titleLower.includes('[img]') || titleLower.includes('(image)')) {
      imageInfo.hasImage = true;
      imageInfo.imageType = 'indicated';
      // For posts marked as having images, we'll try to fetch from Reddit later
    }
  }

  // Check for imgur links (common on Reddit)
  if (!imageInfo.hasImage && post.url && post.url.includes('imgur.com')) {
    imageInfo.hasImage = true;
    // Convert imgur links to direct image links
    let imgurUrl = post.url;
    if (!imgurUrl.includes('.')) {
      imgurUrl = imgurUrl.replace('imgur.com/', 'imgur.com/') + '.jpg';
    }
    imageInfo.imageUrl = imgurUrl;
    imageInfo.imageType = 'imgur';
  }

  // Check for Reddit image domains
  if (!imageInfo.hasImage && post.url) {
    const redditImageDomains = ['i.redd.it', 'preview.redd.it', 'external-preview.redd.it'];
    if (redditImageDomains.some(domain => post.url.includes(domain))) {
      imageInfo.hasImage = true;
      imageInfo.imageUrl = post.url;
      imageInfo.imageType = 'reddit';
    }
  }

  return imageInfo;
}

async function addImageSupportToPosts() {
  console.log('🖼️  ADDING IMAGE SUPPORT TO EXISTING POSTS');
  console.log('===============================================\n');

  try {
    // Get all posts
    console.log('📊 Fetching all posts from Firestore...');
    const postsCollection = collection(db, 'posts');
    const snapshot = await getDocs(postsCollection);
    
    console.log(`Found ${snapshot.docs.length} posts to process\n`);

    let updatedCount = 0;
    let withImagesCount = 0;
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore batch limit

    // Process posts in batches
    for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchDocs = snapshot.docs.slice(i, i + BATCH_SIZE);
      
      console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batchDocs.length} posts)...`);

      for (const docSnapshot of batchDocs) {
        const postData = docSnapshot.data();
        const postRef = doc(db, 'posts', docSnapshot.id);

        // Skip if already has image data
        if (postData.hasImage !== undefined) {
          continue;
        }

        // Extract image information
        const imageInfo = extractImageInfo(postData);

        // Update the post with image information
        batch.update(postRef, {
          hasImage: imageInfo.hasImage,
          imageUrl: imageInfo.imageUrl,
          imageType: imageInfo.imageType,
          thumbnail: imageInfo.thumbnail
        });

        updatedCount++;
        if (imageInfo.hasImage) {
          withImagesCount++;
          console.log(`  🖼️  Image found: "${postData.title.substring(0, 50)}..." (${imageInfo.imageType})`);
        }
      }

      // Commit the batch
      if (batchDocs.length > 0) {
        await batch.commit();
        batchCount++;
        console.log(`  ✅ Batch ${batchCount} committed (${batchDocs.length} posts updated)`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n🎉 IMAGE SUPPORT MIGRATION COMPLETE!');
    console.log('=====================================');
    console.log(`📊 Total posts processed: ${snapshot.docs.length}`);
    console.log(`📝 Posts updated: ${updatedCount}`);
    console.log(`🖼️  Posts with images: ${withImagesCount} (${(withImagesCount/updatedCount*100).toFixed(1)}%)`);
    console.log(`📦 Batches processed: ${batchCount}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
addImageSupportToPosts().then(() => {
  console.log('\n✨ Migration script complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});