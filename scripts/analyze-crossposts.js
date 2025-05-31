#!/usr/bin/env node

/**
 * CROSSPOST ANALYSIS SCRIPT
 * Analyzes existing posts in Firestore for potential crossposts and reposts
 * 
 * This script checks for:
 * 1. Identical titles across different subreddits
 * 2. Very similar titles (90%+ similarity) 
 * 3. Identical content across subreddits
 * 4. Posts mentioning other subreddits in title/content
 * 5. Common repost patterns in titles
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

// Text similarity function using Levenshtein distance
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Normalize text for comparison
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  
  return [...new Set(mentions)]; // Remove duplicates
}

// Main analysis function
async function analyzeCrossposts() {
  console.log('🔍 CROSSPOST ANALYSIS STARTING...');
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
      potentialCrossposts: []
    };
    
    console.log('🧮 Analyzing for crosspost patterns...\n');
    
    // 1. Check for exact title matches across subreddits
    console.log('1️⃣ Finding exact title matches...');
    const titleGroups = new Map();
    
    posts.forEach(post => {
      if (!post.title) return;
      
      const normalizedTitle = normalizeText(post.title);
      if (!titleGroups.has(normalizedTitle)) {
        titleGroups.set(normalizedTitle, []);
      }
      titleGroups.get(normalizedTitle).push(post);
    });
    
    titleGroups.forEach((postsWithSameTitle, title) => {
      if (postsWithSameTitle.length > 1) {
        const subreddits = [...new Set(postsWithSameTitle.map(p => p.subreddit))];
        if (subreddits.length > 1) {
          analysis.exactTitleMatches.set(title, {
            posts: postsWithSameTitle,
            subreddits: subreddits,
            count: postsWithSameTitle.length
          });
        }
      }
    });
    
    console.log(`   Found ${analysis.exactTitleMatches.size} groups of posts with identical titles across subreddits`);
    
    // 2. Check for very similar titles (90%+ similarity)
    console.log('2️⃣ Finding similar titles (90%+ similarity)...');
    
    for (let i = 0; i < posts.length; i++) {
      for (let j = i + 1; j < posts.length; j++) {
        const post1 = posts[i];
        const post2 = posts[j];
        
        if (post1.subreddit === post2.subreddit) continue;
        if (!post1.title || !post2.title) continue;
        
        const similarity = calculateSimilarity(
          normalizeText(post1.title),
          normalizeText(post2.title)
        );
        
        if (similarity >= 0.9 && similarity < 1.0) {
          analysis.similarTitles.push({
            similarity: Math.round(similarity * 100),
            post1: { id: post1.id, title: post1.title, subreddit: post1.subreddit, score: post1.score },
            post2: { id: post2.id, title: post2.title, subreddit: post2.subreddit, score: post2.score }
          });
        }
      }
    }
    
    console.log(`   Found ${analysis.similarTitles.length} pairs of posts with very similar titles`);
    
    // 3. Check for exact content matches
    console.log('3️⃣ Finding exact content matches...');
    const contentGroups = new Map();
    
    posts.forEach(post => {
      if (!post.body || post.body.length < 50) return; // Skip very short content
      
      const normalizedContent = normalizeText(post.body.substring(0, 500)); // First 500 chars
      if (!contentGroups.has(normalizedContent)) {
        contentGroups.set(normalizedContent, []);
      }
      contentGroups.get(normalizedContent).push(post);
    });
    
    contentGroups.forEach((postsWithSameContent, content) => {
      if (postsWithSameContent.length > 1) {
        const subreddits = [...new Set(postsWithSameContent.map(p => p.subreddit))];
        if (subreddits.length > 1) {
          analysis.exactContentMatches.set(content.substring(0, 100) + '...', {
            posts: postsWithSameContent,
            subreddits: subreddits,
            count: postsWithSameContent.length
          });
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
      }
    });
    
    console.log(`   Found ${analysis.repostPatterns.length} posts with repost patterns in titles`);
    
    // 5. Check for subreddit mentions
    console.log('5️⃣ Finding posts mentioning other subreddits...');
    
    posts.forEach(post => {
      const titleMentions = extractSubredditMentions(post.title);
      const bodyMentions = extractSubredditMentions(post.body);
      const allMentions = [...new Set([...titleMentions, ...bodyMentions])];
      
      // Filter out mentions of the same subreddit the post is in
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
    
    console.log(`   Found ${analysis.subredditMentions.length} posts mentioning other subreddits`);
    
    // 6. Compile potential crossposts
    console.log('6️⃣ Compiling potential crosspost candidates...\n');
    
    // Add posts that appear in multiple analysis categories
    const potentialCrosspostIds = new Set();
    
    // From exact title matches
    analysis.exactTitleMatches.forEach(group => {
      group.posts.forEach(post => potentialCrosspostIds.add(post.id));
    });
    
    // From similar titles
    analysis.similarTitles.forEach(pair => {
      potentialCrosspostIds.add(pair.post1.id);
      potentialCrosspostIds.add(pair.post2.id);
    });
    
    // From exact content matches
    analysis.exactContentMatches.forEach(group => {
      group.posts.forEach(post => potentialCrosspostIds.add(post.id));
    });
    
    // From repost patterns
    analysis.repostPatterns.forEach(post => {
      potentialCrosspostIds.add(post.id);
    });
    
    analysis.potentialCrossposts = Array.from(potentialCrosspostIds);
    
    // Generate report
    console.log('📊 CROSSPOST ANALYSIS REPORT');
    console.log('===============================================');
    console.log(`📈 Total posts analyzed: ${posts.length}`);
    console.log(`🎯 Potential crossposts found: ${analysis.potentialCrossposts.length} (${Math.round(analysis.potentialCrossposts.length / posts.length * 100)}%)`);
    console.log('');
    
    console.log('🔍 DETAILED FINDINGS:');
    console.log('---------------------');
    console.log(`📝 Exact title matches: ${analysis.exactTitleMatches.size} groups`);
    console.log(`📝 Similar titles (90%+): ${analysis.similarTitles.length} pairs`);
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
        console.log(`${index + 1}. "${title.substring(0, 60)}..." (${data.count} posts)`);
        console.log(`   Subreddits: ${data.subreddits.join(', ')}`);
        console.log(`   Post IDs: ${data.posts.map(p => p.id).join(', ')}`);
        console.log('');
      });
    }
    
    if (analysis.repostPatterns.length > 0) {
      console.log('🔄 POSTS WITH REPOST PATTERNS:');
      console.log('------------------------------');
      analysis.repostPatterns.slice(0, 10).forEach((post, index) => {
        console.log(`${index + 1}. r/${post.subreddit} | Score: ${post.score}`);
        console.log(`   "${post.title}"`);
        console.log('');
      });
    }
    
    if (analysis.subredditMentions.length > 0) {
      console.log('🔗 POSTS MENTIONING OTHER SUBREDDITS:');
      console.log('------------------------------------');
      analysis.subredditMentions.slice(0, 10).forEach((post, index) => {
        console.log(`${index + 1}. r/${post.subreddit} | Score: ${post.score}`);
        console.log(`   "${post.title}"`);
        console.log(`   Mentions: r/${post.mentions.join(', r/')}`);
        console.log('');
      });
    }
    
    // Recommendations
    console.log('💡 RECOMMENDATIONS:');
    console.log('-------------------');
    
    const crosspostPercentage = analysis.potentialCrossposts.length / posts.length * 100;
    
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
      potentialCrossposts: analysis.potentialCrossposts.length,
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
    console.log('🎉 Analysis complete!');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

// Run the analysis
analyzeCrossposts().then(() => {
  console.log('✨ Crosspost analysis finished successfully');
  process.exit(0);
}).catch(error => {
  console.error('💥 Analysis failed:', error);
  process.exit(1);
}); 