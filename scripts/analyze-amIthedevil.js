#!/usr/bin/env node

/**
 * AMITTHEDEVIL CROSSPOST ANALYSIS
 * Analyzes AmItheDevil posts specifically to understand their crosspost patterns
 * AmItheDevil is a meta-subreddit that discusses controversial AITA posts
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');
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

// Check for AITA crosspost patterns
function analyzeCrosspostPatterns(post) {
  const title = post.title || '';
  const body = post.body || '';
  const fullText = (title + ' ' + body).toLowerCase();
  
  const patterns = {
    aitaCrosspost: /aita|am i the asshole|am i the a/i.test(fullText),
    explicitCrosspost: /crosspost|x-post|cross post/i.test(fullText),
    originalPost: /original post|op/i.test(fullText),
    updatePost: /update/i.test(fullText),
    mentionsAITA: extractSubredditMentions(fullText).includes('amitheasshole'),
    mentionsOtherSubs: extractSubredditMentions(fullText).filter(sub => sub !== 'amithedevil').length > 0
  };
  
  return patterns;
}

// Fast similarity check
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

async function analyzeAmITheDevil() {
  console.log('👹 AMITTHEDEVIL CROSSPOST ANALYSIS');
  console.log('===============================================\n');

  try {
    // Fetch all posts
    console.log('📚 Fetching all posts from database...');
    const allPostsSnapshot = await getDocs(collection(db, 'posts'));
    const allPosts = [];
    
    allPostsSnapshot.forEach(doc => {
      allPosts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Filter AmItheDevil posts
    const devilPosts = allPosts.filter(post => 
      post.subreddit && post.subreddit.toLowerCase() === 'amithedevil'
    );
    
    // Get other subreddit posts for comparison
    const otherPosts = allPosts.filter(post => 
      post.subreddit && post.subreddit.toLowerCase() !== 'amithedevil'
    );
    
    console.log(`✅ Loaded ${allPosts.length} total posts`);
    console.log(`👹 Found ${devilPosts.length} AmItheDevil posts`);
    console.log(`🌍 Found ${otherPosts.length} posts from other subreddits\n`);
    
    if (devilPosts.length === 0) {
      console.log('❌ No AmItheDevil posts found in database');
      return;
    }
    
    // Analysis containers
    const analysis = {
      crosspostPatterns: {
        aitaReferences: 0,
        explicitCrossposts: 0,
        originalPostMentions: 0,
        updatePosts: 0,
        mentionsAITA: 0,
        mentionsOtherSubs: 0
      },
      subredditMentions: new Map(),
      titleMatches: [],
      contentMatches: [],
      potentialSources: new Map()
    };
    
    console.log('🔍 Analyzing AmItheDevil crosspost patterns...\n');
    
    // 1. Analyze crosspost patterns in AmItheDevil posts
    console.log('1️⃣ Checking for crosspost indicators...');
    
    devilPosts.forEach(post => {
      const patterns = analyzeCrosspostPatterns(post);
      
      if (patterns.aitaCrosspost) analysis.crosspostPatterns.aitaReferences++;
      if (patterns.explicitCrosspost) analysis.crosspostPatterns.explicitCrossposts++;
      if (patterns.originalPost) analysis.crosspostPatterns.originalPostMentions++;
      if (patterns.updatePost) analysis.crosspostPatterns.updatePosts++;
      if (patterns.mentionsAITA) analysis.crosspostPatterns.mentionsAITA++;
      if (patterns.mentionsOtherSubs) analysis.crosspostPatterns.mentionsOtherSubs++;
      
      // Track subreddit mentions
      const mentions = extractSubredditMentions(post.title + ' ' + post.body);
      mentions.forEach(sub => {
        if (sub !== 'amithedevil') {
          if (!analysis.subredditMentions.has(sub)) {
            analysis.subredditMentions.set(sub, []);
          }
          analysis.subredditMentions.get(sub).push(post);
        }
      });
    });
    
    console.log(`   AITA references: ${analysis.crosspostPatterns.aitaReferences} posts`);
    console.log(`   Explicit crosspost mentions: ${analysis.crosspostPatterns.explicitCrossposts} posts`);
    console.log(`   Original post mentions: ${analysis.crosspostPatterns.originalPostMentions} posts`);
    console.log(`   Update posts: ${analysis.crosspostPatterns.updatePosts} posts`);
    console.log(`   Mentions AITA subreddit: ${analysis.crosspostPatterns.mentionsAITA} posts`);
    console.log(`   Mentions other subreddits: ${analysis.crosspostPatterns.mentionsOtherSubs} posts`);
    
    // 2. Find exact title matches with other subreddits
    console.log('\n2️⃣ Finding exact title matches with other subreddits...');
    
    devilPosts.forEach(devilPost => {
      const normalizedDevilTitle = normalizeText(devilPost.title);
      
      otherPosts.forEach(otherPost => {
        const normalizedOtherTitle = normalizeText(otherPost.title);
        
        if (normalizedDevilTitle === normalizedOtherTitle && normalizedDevilTitle.length > 20) {
          analysis.titleMatches.push({
            devilPost: {
              id: devilPost.id,
              title: devilPost.title,
              score: devilPost.score,
              created_utc: devilPost.created_utc
            },
            sourcePost: {
              id: otherPost.id,
              title: otherPost.title,
              subreddit: otherPost.subreddit,
              score: otherPost.score,
              created_utc: otherPost.created_utc
            }
          });
        }
      });
    });
    
    console.log(`   Found ${analysis.titleMatches.length} exact title matches`);
    
    // 3. Find similar content matches (high similarity)
    console.log('3️⃣ Finding high-similarity content matches...');
    
    // Sample for performance - check against AITA posts specifically
    const aitaPosts = otherPosts.filter(p => 
      p.subreddit && p.subreddit.toLowerCase() === 'amitheasshole'
    ).slice(0, 500); // Limit for performance
    
    devilPosts.slice(0, 100).forEach(devilPost => { // Limit devil posts too
      const devilContent = normalizeText(devilPost.title + ' ' + (devilPost.body || ''));
      
      aitaPosts.forEach(aitaPost => {
        const aitaContent = normalizeText(aitaPost.title + ' ' + (aitaPost.body || ''));
        
        const similarity = fastSimilarity(devilContent, aitaContent);
        
        if (similarity >= 0.8) {
          analysis.contentMatches.push({
            similarity: Math.round(similarity * 100),
            devilPost: {
              id: devilPost.id,
              title: devilPost.title.substring(0, 60) + '...',
              score: devilPost.score
            },
            aitaPost: {
              id: aitaPost.id,
              title: aitaPost.title.substring(0, 60) + '...',
              score: aitaPost.score
            }
          });
        }
      });
    });
    
    console.log(`   Found ${analysis.contentMatches.length} high-similarity content matches`);
    
    // Generate report
    console.log('\n📊 AMITTHEDEVIL CROSSPOST REPORT');
    console.log('===============================================');
    console.log(`📈 Total AmItheDevil posts: ${devilPosts.length}`);
    
    const crosspostPercentage = Math.round(
      (analysis.crosspostPatterns.aitaReferences / devilPosts.length) * 100
    );
    console.log(`👹 Posts with AITA indicators: ${analysis.crosspostPatterns.aitaReferences} (${crosspostPercentage}%)`);
    
    console.log('\n🔍 CROSSPOST INDICATORS:');
    console.log('------------------------');
    console.log(`📝 AITA references: ${analysis.crosspostPatterns.aitaReferences}/${devilPosts.length} (${Math.round(analysis.crosspostPatterns.aitaReferences/devilPosts.length*100)}%)`);
    console.log(`🔗 Explicit crosspost mentions: ${analysis.crosspostPatterns.explicitCrossposts}`);
    console.log(`📌 Original post mentions: ${analysis.crosspostPatterns.originalPostMentions}`);
    console.log(`🔄 Update posts: ${analysis.crosspostPatterns.updatePosts}`);
    console.log(`🎯 Direct AITA subreddit mentions: ${analysis.crosspostPatterns.mentionsAITA}`);
    
    console.log('\n🌍 SUBREDDIT MENTIONS:');
    console.log('----------------------');
    const sortedMentions = Array.from(analysis.subredditMentions.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10);
    
    sortedMentions.forEach(([subreddit, posts], index) => {
      console.log(`${index + 1}. r/${subreddit}: ${posts.length} mentions`);
    });
    
    if (analysis.titleMatches.length > 0) {
      console.log('\n🎯 EXACT TITLE MATCHES:');
      console.log('-----------------------');
      analysis.titleMatches
        .sort((a, b) => b.sourcePost.score - a.sourcePost.score)
        .slice(0, 5)
        .forEach((match, index) => {
          console.log(`${index + 1}. Source: r/${match.sourcePost.subreddit} (${match.sourcePost.score} pts)`);
          console.log(`   Title: "${match.sourcePost.title.substring(0, 80)}..."`);
          console.log(`   AmItheDevil post: ${match.devilPost.id} (${match.devilPost.score} pts)`);
          console.log('');
        });
    }
    
    if (analysis.contentMatches.length > 0) {
      console.log('🔄 HIGH-SIMILARITY CONTENT MATCHES:');
      console.log('----------------------------------');
      analysis.contentMatches
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5)
        .forEach((match, index) => {
          console.log(`${index + 1}. Similarity: ${match.similarity}%`);
          console.log(`   AITA: "${match.aitaPost.title}" (${match.aitaPost.score} pts)`);
          console.log(`   Devil: "${match.devilPost.title}" (${match.devilPost.score} pts)`);
          console.log('');
        });
    }
    
    // Conclusions
    console.log('💡 CONCLUSIONS:');
    console.log('---------------');
    
    if (crosspostPercentage > 80) {
      console.log('🚨 EXTREMELY HIGH CROSSPOST ACTIVITY!');
      console.log('   - AmItheDevil is primarily a crosspost/meta subreddit');
      console.log('   - Most content originates from other subreddits (especially AITA)');
      console.log('   - Consider treating as a meta-discussion subreddit');
    } else if (crosspostPercentage > 50) {
      console.log('⚠️  HIGH CROSSPOST ACTIVITY');
      console.log('   - Significant crosspost activity detected');
      console.log('   - Many posts reference or discuss content from other subreddits');
    } else {
      console.log('✅ MODERATE CROSSPOST ACTIVITY');
      console.log('   - Some crosspost activity but also original content');
    }
    
    console.log('\n🔧 RECOMMENDATIONS:');
    console.log('-------------------');
    console.log('1. Tag AmItheDevil posts as "Meta/Discussion" content');
    console.log('2. Consider showing original source subreddit when available');
    console.log('3. Group with other meta-subreddits for better categorization');
    console.log('4. Add metadata indicating crosspost/discussion nature');
    
    // Save report
    const reportData = {
      timestamp: new Date().toISOString(),
      totalDevilPosts: devilPosts.length,
      crosspostIndicators: analysis.crosspostPatterns,
      subredditMentions: Object.fromEntries(analysis.subredditMentions),
      titleMatches: analysis.titleMatches,
      contentMatches: analysis.contentMatches,
      crosspostPercentage: crosspostPercentage
    };
    
    const fs = require('fs');
    const reportPath = './scripts/amithedevil-analysis-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
    console.log('🎉 AmItheDevil analysis complete!');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

// Run the analysis
analyzeAmITheDevil().then(() => {
  console.log('✨ AmItheDevil analysis finished successfully');
  process.exit(0);
}).catch(error => {
  console.error('💥 Analysis failed:', error);
  process.exit(1);
}); 