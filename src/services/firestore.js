import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  doc,
  getDoc 
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Firestore service for Reddit Conversations app
 * Handles all database operations for posts and subreddits
 */

// Collection references
const postsCollection = collection(db, 'posts');
const subredditsCollection = collection(db, 'subreddits');

/**
 * Get all posts with optional filtering
 * @param {Object} options - Query options
 * @param {string} options.subreddit - Filter by subreddit
 * @param {number} options.limitCount - Limit number of results
 * @param {string} options.orderField - Field to order by (default: 'score')
 * @returns {Promise<Array>} Array of post documents
 */
export const getPosts = async (options = {}) => {
  try {
    const {
      subreddit = null,
      limitCount = 50,
      orderField = 'score'
    } = options;

    let q = query(postsCollection);

    // Add subreddit filter if specified
    if (subreddit && subreddit !== 'all') {
      q = query(q, where('subreddit', '==', subreddit));
    }

    // Order by score (descending) and limit results
    q = query(q, orderBy(orderField, 'desc'), limit(limitCount));

    const querySnapshot = await getDocs(q);
    const posts = [];

    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

/**
 * Get a specific post by ID
 * @param {string} postId - The post ID
 * @returns {Promise<Object|null>} Post document or null if not found
 */
export const getPost = async (postId) => {
  try {
    const postDoc = doc(db, 'posts', postId);
    const docSnap = await getDoc(postDoc);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
};

/**
 * Get all available subreddits
 * @returns {Promise<Array>} Array of subreddit names
 */
export const getSubreddits = async () => {
  try {
    const querySnapshot = await getDocs(subredditsCollection);
    const subreddits = [];

    querySnapshot.forEach((doc) => {
      subreddits.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by name
    return subreddits.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching subreddits:', error);
    throw error;
  }
};

/**
 * Get random posts from specified subreddit or all posts
 * @param {Object} options - Query options
 * @param {string} options.subreddit - Filter by subreddit
 * @param {number} options.count - Number of random posts to return (default: 6)
 * @returns {Promise<Array>} Array of random post documents
 */
export const getRandomPosts = async (options = {}) => {
  try {
    const { subreddit = null, count = 6 } = options;

    // Get a larger set of posts to randomize from
    const posts = await getPosts({
      subreddit,
      limitCount: 100 // Get more posts to choose from
    });

    // Shuffle and return requested count
    const shuffled = posts.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  } catch (error) {
    console.error('Error fetching random posts:', error);
    throw error;
  }
};

/**
 * Test Firestore connection
 * @returns {Promise<boolean>} True if connection successful
 */
export const testConnection = async () => {
  try {
    // Try to read from subreddits collection
    const q = query(subredditsCollection, limit(1));
    await getDocs(q);
    console.log('✅ Firestore connection successful');
    return true;
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
    return false;
  }
}; 