/**
 * Firebase Admin SDK setup for server-side operations
 * Used by the scraping script to write data to Firestore
 */

const admin = require('firebase-admin');
require('dotenv').config();

/**
 * Initialize Firebase Admin SDK
 * Uses project ID from environment variables for authentication
 */
const initializeFirebaseAdmin = () => {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      // Using default credentials (Application Default Credentials)
      // This works when running on Google Cloud or with gcloud auth
    });
  }
  
  return admin.firestore();
};

/**
 * Batch write posts to Firestore
 * @param {Array} posts - Array of post objects to write
 * @param {Object} db - Firestore database instance
 * @returns {Promise} Batch write promise
 */
const batchWritePosts = async (posts, db) => {
  const batch = db.batch();
  
  posts.forEach(post => {
    const postRef = db.collection('posts').doc(post.id);
    batch.set(postRef, post);
  });
  
  return batch.commit();
};

/**
 * Write subreddit metadata to Firestore
 * @param {Object} subredditData - Subreddit metadata object
 * @param {Object} db - Firestore database instance
 * @returns {Promise} Write promise
 */
const writeSubredditMetadata = async (subredditData, db) => {
  const subredditRef = db.collection('subreddits').doc(subredditData.name);
  return subredditRef.set(subredditData);
};

/**
 * Check if post already exists in Firestore
 * @param {string} postId - Reddit post ID
 * @param {Object} db - Firestore database instance
 * @returns {Promise<boolean>} True if post exists
 */
const postExists = async (postId, db) => {
  const postRef = db.collection('posts').doc(postId);
  const doc = await postRef.get();
  return doc.exists;
};

/**
 * Get post count for a subreddit
 * @param {string} subreddit - Subreddit name
 * @param {Object} db - Firestore database instance
 * @returns {Promise<number>} Number of posts
 */
const getPostCount = async (subreddit, db) => {
  const postsRef = db.collection('posts');
  const query = postsRef.where('subreddit', '==', subreddit);
  const snapshot = await query.get();
  return snapshot.size;
};

/**
 * Clean up and validate post data before writing to Firestore
 * @param {Object} rawPost - Raw post data from Reddit API
 * @param {Array} comments - Processed comments array
 * @param {string} subreddit - Subreddit name
 * @returns {Object} Cleaned post object
 */
const cleanPostData = (rawPost, comments, subreddit) => {
  return {
    id: rawPost.id,
    title: rawPost.title || '',
    body: rawPost.selftext || '',
    author: rawPost.author || '[deleted]',
    subreddit: subreddit,
    url: `https://reddit.com${rawPost.permalink}`,
    permalink: rawPost.permalink,
    score: rawPost.score || 0,
    num_comments: rawPost.num_comments || 0,
    created_utc: rawPost.created_utc || 0,
    scraped_at: new Date().toISOString(),
    comments: comments || []
  };
};

/**
 * Clean and validate comment data
 * @param {Object} rawComment - Raw comment data from Reddit API
 * @returns {Object|null} Cleaned comment object or null if invalid
 */
const cleanCommentData = (rawComment) => {
  // Skip deleted, removed, or empty comments
  if (!rawComment.body || 
      rawComment.body === '[deleted]' || 
      rawComment.body === '[removed]' ||
      rawComment.body.trim() === '') {
    return null;
  }
  
  return {
    id: rawComment.id,
    author: rawComment.author || '[deleted]',
    body: rawComment.body,
    score: rawComment.score || 0,
    created_utc: rawComment.created_utc || 0
  };
};

module.exports = {
  initializeFirebaseAdmin,
  batchWritePosts,
  writeSubredditMetadata,
  postExists,
  getPostCount,
  cleanPostData,
  cleanCommentData
}; 