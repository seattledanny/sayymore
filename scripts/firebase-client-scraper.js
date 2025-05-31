/**
 * Client-side Firebase setup for scraping
 * Uses regular Firebase SDK instead of Admin SDK
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, writeBatch, getDocs } = require('firebase/firestore');
require('dotenv').config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

let app = null;
let db = null;

/**
 * Initialize Firebase client SDK
 */
const initializeFirebase = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return db;
};

/**
 * Batch write posts to Firestore using client SDK
 */
const batchWritePosts = async (posts, database) => {
  const batch = writeBatch(database);
  
  posts.forEach(post => {
    const postRef = doc(database, 'posts', post.id);
    batch.set(postRef, post);
  });
  
  return batch.commit();
};

/**
 * Test Firebase client connection
 */
const testFirebaseConnection = async () => {
  try {
    const db = initializeFirebase();
    
    // Try to read from the posts collection
    const postsRef = collection(db, 'posts');
    const snapshot = await getDocs(postsRef);
    
    console.log('✅ Firebase client connection successful');
    console.log(`📊 Posts collection has ${snapshot.size} documents`);
    
    return true;
  } catch (error) {
    console.error('❌ Firebase client connection failed:', error.message);
    return false;
  }
};

module.exports = {
  initializeFirebase,
  batchWritePosts,
  testFirebaseConnection
}; 