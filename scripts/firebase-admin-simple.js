/**
 * Simplified Firebase Admin SDK setup
 * Uses project ID and default authentication
 */

const admin = require('firebase-admin');
require('dotenv').config();

let db = null;

/**
 * Initialize Firebase Admin SDK with project ID
 */
const initializeFirebaseAdmin = () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID
    });
  }
  
  if (!db) {
    db = admin.firestore();
  }
  
  return db;
};

/**
 * Batch write posts to Firestore
 */
const batchWritePosts = async (posts, database) => {
  const batch = database.batch();
  
  posts.forEach(post => {
    const postRef = database.collection('posts').doc(post.id);
    batch.set(postRef, post);
  });
  
  return batch.commit();
};

/**
 * Simple test to verify Firebase connection
 */
const testFirebaseConnection = async () => {
  try {
    const db = initializeFirebaseAdmin();
    
    // Try to read from the posts collection
    const postsRef = db.collection('posts');
    const snapshot = await postsRef.limit(1).get();
    
    console.log('✅ Firebase connection successful');
    console.log(`📊 Posts collection has ${snapshot.size} documents`);
    
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error.message);
    return false;
  }
};

module.exports = {
  initializeFirebaseAdmin,
  batchWritePosts,
  testFirebaseConnection
}; 