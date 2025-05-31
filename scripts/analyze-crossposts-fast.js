#!/usr/bin/env node

/**
 * FAST CROSSPOST ANALYSIS SCRIPT
 * Optimized version that analyzes posts more efficiently
 * 
 * This script uses:
 * - Sampling for similarity checks to reduce O(n²) complexity
 * - Hash-based matching for exact duplicates
 * - Focus on high-impact indicators
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Normalize text for comparison
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Fast similarity check using word overlap
function fastSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const words1 = new Set(str1.split(' ').filter(w => w.length > 3));
  const words2 = new Set(str2.split(' ').filter(w => w.length > 3));
  
  if (words1.size === 0 && words2.size === 0) return 1;
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// Check for repost patterns in titles
function hasRepostPattern(title) {
  if (!title) return false;
  
  const repostPatterns = [
    /repost/i,
    /cross.?post/i,
    /x.?post/i,
    /originally posted/i,
    /posted.*in.*r\//i,
    /from.*r\//i,
    /saw.*this.*in/i,
    /found.*this.*on/i,
    /\(originally.*\)/i,
    /\[repost\]/i,
    /\[crosspost\]/i
  ];
  
  return repostPatterns.some(pattern => pattern.test(title));
}

// Extract subreddit mentions from text
function extractSubredditMentions(text) {
  if (!text) return [];
  
  const subredditPattern = /r\/([a-zA-Z0-9_]+)/g;
  const mentions = [];
  let match;
  
  while ((match = subredditPattern.exec(text)) !== null) {
    mentions.push(match[1].toLowerCase());
  }
  
  return [...new Set(mentions)];
}

// Create hash for exact matching
function createTextHash(text) {
  if (!text) return '';
  // Simple hash for exact matching
  return normalizeText(text);
}

// Main analysis function
async function analyzeCrosspostsFast() {
  console.log('🚀 FAST CROSSPOST ANALYSIS STARTING...');
  console.log('===============================================\n');

  try {
    // Fetch all posts
    console.log('📚 Fetching all posts from database...');
    const postsSnapshot = await getDocs(collection(db, 'posts'));
    const posts = [];
    
    postsSnapshot.forEach(doc => {
      posts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Loaded ${posts.length} posts\n`);
    
    // Analysis containers
    const analysis = {
      exactTitleMatches: new Map(),
      similarTitles: [],
      exactContentMatches: new Map(),
      repostPatterns: [],
      subredditMentions: [],
      potentialCrossposts: new Set()
    };
    
    console.log('🧮 Analyzing for crosspost patterns...\n');
    
    // 1. Hash-based exact title matching (O(n) instead of O(n²))
    console.log('1️⃣ Finding exact title matches...');
    const titleHashes = new Map();
    
    posts.forEach(post => {
      if (!post.title) return;
      
      const titleHash = createTextHash(post.title);
      if (!titleHashes.has(titleHash)) {
        titleHashes.set(titleHash, []);
      }
      titleHashes.get(titleHash).push(post);
    });
    
    titleHashes.forEach((postsWithSameTitle, titleHash) => {
      if (postsWithSameTitle.length > 1) {
        const subreddits = [...new Set(postsWithSameTitle.map(p => p.subreddit))];
        if (subreddits.length > 1) {
          analysis.exactTitleMatches.set(titleHash.substring(0, 60) + '...', {
            posts: postsWithSameTitle,
            subreddits: subreddits,
            count: postsWithSameTitle.length
          });
          
          // Add to potential crossposts
          postsWithSameTitle.forEach(p => analysis.potentialCrossposts.add(p.id));
        }
      }
    });
    
    console.log(`   Found ${analysis.exactTitleMatches.size} groups of posts with identical titles across subreddits`);
    
    // 2. Sampled similarity check (check only high-score posts to reduce complexity)
    console.log('2️⃣ Finding similar titles (sampling high-score posts)...');
    
    // Sample high-score posts for similarity checking
    const highScorePosts = posts
      .filter(p => p.score > 100)
      .sort((a, b) => b.score - a.score)
      .slice(0, 1000); // Top 1000 posts
    
    console.log(`   Sampling ${highScorePosts.length} high-score posts for similarity...`);
    
    for (let i = 0; i < highScorePosts.length; i++) {
      for (let j = i + 1; j < highScorePosts.length; j++) {
        const post1 = highScorePosts[i];
        const post2 = highScorePosts[j];
        
        if (post1.subreddit === post2.subreddit) continue;
        if (!post1.title || !post2.title) continue;
        
        const similarity = fastSimilarity(
          normalizeText(post1.title),
          normalizeText(post2.title)
        );
        
        if (similarity >= 0.7) { // Lower threshold for faster processing
          analysis.similarTitles.push({
            similarity: Math.round(similarity * 100),
            post1: { id: post1.id, title: post1.title, subreddit: post1.subreddit, score: post1.score },
            post2: { id: post2.id, title: post2.title, subreddit: post2.subreddit, score: post2.score }
          });
          
          analysis.potentialCrossposts.add(post1.id);
          analysis.potentialCrossposts.add(post2.id);
        }
      }
    }
    
    console.log(`   Found ${analysis.similarTitles.length} pairs of posts with similar titles`);
    
    // 3. Hash-based exact content matching
    console.log('3️⃣ Finding exact content matches...');
    const contentHashes = new Map();
    
    posts.forEach(post => {
      if (!post.body || post.body.length < 100) return; // Skip very short content
      
      const contentHash = createTextHash(post.body.substring(0, 500));
      if (!contentHashes.has(contentHash)) {
        contentHashes.set(contentHash, []);
      }
      contentHashes.get(contentHash).push(post);
    });
    
    contentHashes.forEach((postsWithSameContent, contentHash) => {
      if (postsWithSameContent.length > 1) {
        const subreddits = [...new Set(postsWithSameContent.map(p => p.subreddit))];
        if (subreddits.length > 1) {
          analysis.exactContentMatches.set(contentHash.substring(0, 100) + '...', {
            posts: postsWithSameContent,
            subreddits: subreddits,
            count: postsWithSameContent.length
          });
          
          postsWithSameContent.forEach(p => analysis.potentialCrossposts.add(p.id));
        }
      }
    });
    
    console.log(`   Found ${analysis.exactContentMatches.size} groups of posts with identical content across subreddits`);
    
    // 4. Check for repost patterns in titles
    console.log('4️⃣ Finding repost patterns in titles...');
    
    posts.forEach(post => {
      if (hasRepostPattern(post.title)) {
        analysis.repostPatterns.push({
          id: post.id,
          title: post.title,
          subreddit: post.subreddit,
          score: post.score
        });
        analysis.potentialCrossposts.add(post.id);
      }
    });
    
    console.log(`   Found ${analysis.repostPatterns.length} posts with repost patterns in titles`);
    
    // 5. Check for subreddit mentions
    console.log('5️⃣ Finding posts mentioning other subreddits...');
    
    posts.forEach(post => {
      const titleMentions = extractSubredditMentions(post.title);
      const bodyMentions = extractSubredditMentions(post.body);
      const allMentions = [...new Set([...titleMentions, ...bodyMentions])];
      
      const otherSubreddits = allMentions.filter(mentioned => 
        mentioned.toLowerCase() !== post.subreddit.toLowerCase()
      );
      
      if (otherSubreddits.length > 0) {
        analysis.subredditMentions.push({
          id: post.id,
          title: post.title.substring(0, 80) + '...',
          subreddit: post.subreddit,
          score: post.score,
          mentions: otherSubreddits
        });
      }
    });
    
    console.log(`   Found ${analysis.subredditMentions.length} posts mentioning other subreddits\n`);
    
    // Generate report
    console.log('📊 CROSSPOST ANALYSIS REPORT');
    console.log('===============================================');
    console.log(`📈 Total posts analyzed: ${posts.length}`);
    console.log(`🎯 Potential crossposts found: ${analysis.potentialCrossposts.size} (${Math.round(analysis.potentialCrossposts.size / posts.length * 100)}%)`);
    console.log('');
    
    console.log('🔍 DETAILED FINDINGS:');
    console.log('---------------------');
    console.log(`📝 Exact title matches: ${analysis.exactTitleMatches.size} groups`);
    console.log(`📝 Similar titles (70%+): ${analysis.similarTitles.length} pairs`);
    console.log(`📄 Exact content matches: ${analysis.exactContentMatches.size} groups`);
    console.log(`🔄 Repost pattern in titles: ${analysis.repostPatterns.length} posts`);
    console.log(`🔗 Mentions other subreddits: ${analysis.subredditMentions.length} posts`);
    console.log('');
    
    // Show top examples
    if (analysis.exactTitleMatches.size > 0) {
      console.log('🏆 TOP EXACT TITLE MATCHES:');
      console.log('---------------------------');
      const sortedTitleMatches = Array.from(analysis.exactTitleMatches.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);
      
      sortedTitleMatches.forEach(([title, data], index) => {
        console.log(`${index + 1}. "${title}" (${data.count} posts)`);
        console.log(`   Subreddits: ${data.subreddits.join(', ')}`);
        console.log(`   Post IDs: ${data.posts.map(p => p.id).join(', ')}`);
        console.log('');
      });
    }
    
    if (analysis.repostPatterns.length > 0) {
      console.log('🔄 POSTS WITH REPOST PATTERNS:');
      console.log('------------------------------');
      analysis.repostPatterns
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .forEach((post, index) => {
          console.log(`${index + 1}. r/${post.subreddit} | Score: ${post.score}`);
          console.log(`   "${post.title.substring(0, 80)}..."`);
          console.log('');
        });
    }
    
    if (analysis.subredditMentions.length > 0) {
      console.log('🔗 TOP POSTS MENTIONING OTHER SUBREDDITS:');
      console.log('----------------------------------------');
      analysis.subredditMentions
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .forEach((post, index) => {
          console.log(`${index + 1}. r/${post.subreddit} | Score: ${post.score}`);
          console.log(`   "${post.title}"`);
          console.log(`   Mentions: r/${post.mentions.join(', r/')}`);
          console.log('');
        });
    }
    
    // Recommendations
    console.log('💡 RECOMMENDATIONS:');
    console.log('-------------------');
    
    const crosspostPercentage = analysis.potentialCrossposts.size / posts.length * 100;
    
    if (crosspostPercentage > 15) {
      console.log('🚨 HIGH CROSSPOST ACTIVITY DETECTED!');
      console.log('   - Consider adding crosspost detection to your scraping');
      console.log('   - A rescrape with crosspost fields would be valuable');
      console.log('   - This data could improve user experience by showing original sources');
    } else if (crosspostPercentage > 5) {
      console.log('⚠️  MODERATE CROSSPOST ACTIVITY');
      console.log('   - Some crossposts detected, could be worth tracking');
      console.log('   - Consider adding crosspost fields in future scrapes');
    } else {
      console.log('✅ LOW CROSSPOST ACTIVITY');
      console.log('   - Minimal crosspost activity detected');
      console.log('   - Current data structure is probably sufficient');
    }
    
    console.log('');
    console.log('🔧 IMPLEMENTATION OPTIONS:');
    console.log('--------------------------');
    console.log('1. Add crosspost fields to scraping scripts:');
    console.log('   - crosspost_parent_id');
    console.log('   - crosspost_parent_subreddit');
    console.log('   - is_crosspost (boolean)');
    console.log('   - original_title');
    console.log('');
    console.log('2. Run targeted rescrape for high-activity subreddits');
    console.log('3. Add crosspost detection to mobile UI');
    console.log('');
    
    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      totalPosts: posts.length,
      potentialCrossposts: analysis.potentialCrossposts.size,
      crosspostPercentage: Math.round(crosspostPercentage * 100) / 100,
      findings: {
        exactTitleMatches: analysis.exactTitleMatches.size,
        similarTitles: analysis.similarTitles.length,
        exactContentMatches: analysis.exactContentMatches.size,
        repostPatterns: analysis.repostPatterns.length,
        subredditMentions: analysis.subredditMentions.length
      },
      detailedResults: {
        exactTitleMatches: Object.fromEntries(analysis.exactTitleMatches),
        similarTitles: analysis.similarTitles,
        exactContentMatches: Object.fromEntries(analysis.exactContentMatches),
        repostPatterns: analysis.repostPatterns,
        subredditMentions: analysis.subredditMentions
      }
    };
    
    const fs = require('fs');
    const reportPath = './scripts/crosspost-analysis-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`💾 Detailed report saved to: ${reportPath}`);
    console.log('');
    console.log('🎉 Fast analysis complete!');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

// Run the analysis
analyzeCrosspostsFast().then(() => {
  console.log('✨ Fast crosspost analysis finished successfully');
  process.exit(0);
}).catch(error => {
  console.error('💥 Analysis failed:', error);
  process.exit(1);
}); 