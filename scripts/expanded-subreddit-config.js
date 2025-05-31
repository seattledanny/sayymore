/**
 * EXPANDED SUBREDDIT CONFIGURATION FOR MASSIVE SCRAPE
 * Comprehensive list of conversation-starter subreddits
 * Phase 3B: Wedding Content + Additional Categories
 */

const EXPANDED_SUBREDDIT_CONFIG = [
  // ===== EXISTING SUBREDDITS (Phase 3A - COMPLETE) =====
  
  // Moral Dilemmas & Advice - PRIORITY 1 (COMPLETE)
  {
    name: 'AmItheAsshole',
    display_name: 'Am I the Asshole?',
    category: 'advice',
    description: 'Moral judgment and ethical dilemmas',
    priority: 1,
    status: 'complete', // 100 posts
    posts_collected: 100
  },
  {
    name: 'relationship_advice',
    display_name: 'Relationship Advice',
    category: 'advice',
    description: 'Relationship problems and advice',
    priority: 1,
    status: 'complete', // 100 posts
    posts_collected: 100
  },
  {
    name: 'tifu',
    display_name: 'Today I F***ed Up',
    category: 'stories',
    description: 'Hilarious and cringe mistake stories',
    priority: 1,
    status: 'complete', // 100 posts
    posts_collected: 100
  },
  {
    name: 'confession',
    display_name: 'Confession',
    category: 'stories',
    description: 'Deep personal revelations',
    priority: 1,
    status: 'complete', // 95 posts
    posts_collected: 95
  },
  {
    name: 'offmychest',
    display_name: 'Off My Chest',
    category: 'stories',
    description: 'Personal venting and emotional release',
    priority: 1,
    status: 'complete', // 92 posts
    posts_collected: 92
  },
  {
    name: 'pettyrevenge',
    display_name: 'Petty Revenge',
    category: 'revenge',
    description: 'Small-scale satisfying revenge stories',
    priority: 1,
    status: 'complete', // 98 posts
    posts_collected: 98
  },
  {
    name: 'MaliciousCompliance',
    display_name: 'Malicious Compliance',
    category: 'revenge',
    description: 'Following rules to exact perfect revenge',
    priority: 1,
    status: 'complete', // 98 posts
    posts_collected: 98
  },
  {
    name: 'entitledparents',
    display_name: 'Entitled Parents',
    category: 'drama',
    description: 'Outrageous entitled parent behavior',
    priority: 1,
    status: 'complete', // 92 posts
    posts_collected: 92
  },
  {
    name: 'ChoosingBeggars',
    display_name: 'Choosing Beggars',
    category: 'drama',
    description: 'Unreasonable demands from beggars',
    priority: 1,
    status: 'complete', // 97 posts
    posts_collected: 97
  },
  {
    name: 'legaladvice',
    display_name: 'Legal Advice',
    category: 'advice',
    description: 'Legal dilemmas and serious situations',
    priority: 1,
    status: 'complete', // 99 posts
    posts_collected: 99
  },
  {
    name: 'unpopularopinion',
    display_name: 'Unpopular Opinion',
    category: 'debate',
    description: 'Controversial takes and hot opinions',
    priority: 1,
    status: 'complete', // 96 posts
    posts_collected: 96
  },

  // ===== NEW WEDDING CATEGORY - PRIORITY 2 (TO SCRAPE) =====
  
  {
    name: 'weddingshaming',
    display_name: 'Wedding Shaming',
    category: 'wedding',
    description: 'Stories about tacky, inappropriate, or outrageous wedding behavior',
    priority: 2,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'bridezillas',
    display_name: 'Bridezillas',
    category: 'wedding',
    description: 'Tales of brides (and grooms) gone wild during wedding planning',
    priority: 2,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'weddingdrama',
    display_name: 'Wedding Drama',
    category: 'wedding',
    description: 'General wedding drama and family conflicts',
    priority: 2,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'JUSTNOMIL',
    display_name: 'Just No Mother-in-Law',
    category: 'wedding',
    description: 'Mother-in-law horror stories (tons of wedding content!)',
    priority: 2,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'weddingplanning',
    display_name: 'Wedding Planning',
    category: 'wedding',
    description: 'Real planning advice, budgets, and decision-making',
    priority: 2,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'AmItheBridezilla',
    display_name: 'Am I the Bridezilla?',
    category: 'wedding',
    description: 'Am I being unreasonable? wedding edition',
    priority: 2,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'wedding',
    display_name: 'Wedding',
    category: 'wedding',
    description: 'General wedding discussions and advice',
    priority: 2,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'weddingstories',
    display_name: 'Wedding Stories',
    category: 'wedding',
    description: 'Mix of heartwarming and horrifying wedding tales',
    priority: 2,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'EntitledPeople',
    display_name: 'Entitled People',
    category: 'drama',
    description: 'Often features entitled wedding guests/family',
    priority: 2,
    status: 'pending',
    posts_target: 100
  },

  // ===== PLACEHOLDER FOR ADDITIONAL CATEGORIES (PRIORITY 3) =====
  // We'll add more here during brainstorming session

  // ===== RELATIONSHIP ADVICE EXPANSION - PRIORITY 3 (TO SCRAPE) =====
  
  {
    name: 'relationships',
    display_name: 'Relationships',
    category: 'relationships',
    description: 'General relationship discussions and complex situations',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'dating_advice',
    display_name: 'Dating Advice',
    category: 'relationships',
    description: 'Dating struggles, red flags, and romantic advice',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'DeadBedrooms',
    display_name: 'Dead Bedrooms',
    category: 'relationships',
    description: 'Intimate relationship issues and solutions',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'survivinginfidelity',
    display_name: 'Surviving Infidelity',
    category: 'relationships',
    description: 'Dealing with cheating and betrayal in relationships',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'datingoverthirty',
    display_name: 'Dating Over Thirty',
    category: 'relationships',
    description: 'Mature dating advice and relationship wisdom',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },

  // ===== MONEY & FINANCE IN RELATIONSHIPS - PRIORITY 3 (TO SCRAPE) =====
  
  {
    name: 'personalfinance',
    display_name: 'Personal Finance',
    category: 'finance',
    description: 'Money advice, often relationship-related financial conflicts',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'povertyfinance',
    display_name: 'Poverty Finance',
    category: 'finance',
    description: 'Financial struggles and survival stories',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'financialindependence',
    display_name: 'Financial Independence',
    category: 'finance',
    description: 'FIRE movement and money relationship dynamics',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'StudentLoans',
    display_name: 'Student Loans',
    category: 'finance',
    description: 'Student debt affecting relationships and life choices',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'CreditCards',
    display_name: 'Credit Cards',
    category: 'finance',
    description: 'Credit and debt issues in relationships',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },

  // ===== JUICY DRAMA & STORIES - PRIORITY 3 (PHASE 3D) =====
  
  {
    name: 'antiwork',
    display_name: 'Antiwork',
    category: 'work',
    description: 'Toxic bosses, workplace horror stories, and quitting tales',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'TalesFromRetail',
    display_name: 'Tales From Retail',
    category: 'work',
    description: 'Customer service nightmares and entitled customer stories',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'TalesFromTheFrontDesk',
    display_name: 'Tales From The Front Desk',
    category: 'work',
    description: 'Hotel horror stories and impossible guest demands',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'raisedbynarcissists',
    display_name: 'Raised By Narcissists',
    category: 'family',
    description: 'Toxic family dynamics and narcissistic parent stories',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'JUSTNOFAMILY',
    display_name: 'Just No Family',
    category: 'family',
    description: 'Toxic family members and boundary-crossing relatives',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'neighborsfromhell',
    display_name: 'Neighbors From Hell',
    category: 'neighbors',
    description: 'Nightmare neighbors and property disputes',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'BadRoommates',
    display_name: 'Bad Roommates',
    category: 'neighbors',
    description: 'Roommate horror stories and living situation disasters',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'AmITheDevil',
    display_name: 'Am I The Devil',
    category: 'morality',
    description: 'The worst AITA posts - truly unhinged behavior',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'BestofRedditorUpdates',
    display_name: 'Best of Redditor Updates',
    category: 'stories',
    description: 'Epic multi-part sagas with wild plot twists',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'ProRevenge',
    display_name: 'Pro Revenge',
    category: 'revenge',
    description: 'Professional-level revenge stories with serious consequences',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'NuclearRevenge',
    display_name: 'Nuclear Revenge',
    category: 'revenge',
    description: 'The most extreme revenge stories that destroy lives',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'HobbyDrama',
    display_name: 'Hobby Drama',
    category: 'drama',
    description: 'Niche community drama and fandom explosions',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'LetsNotMeet',
    display_name: 'Lets Not Meet',
    category: 'creepy',
    description: 'Terrifying real-life encounters and dangerous situations',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'UnethicalLifeProTips',
    display_name: 'Unethical Life Pro Tips',
    category: 'controversial',
    description: 'Morally questionable but effective life advice',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'insaneparents',
    display_name: 'Insane Parents',
    category: 'family',
    description: 'Screenshots and stories of completely unhinged parents',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },

  // ===== ADDITIONAL ADVICE GOLDMINES - PRIORITY 3 (PHASE 3E) =====
  
  {
    name: 'Advice',
    display_name: 'Advice',
    category: 'advice',
    description: 'General life advice and guidance for any situation',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'needadvice',
    display_name: 'Need Advice',
    category: 'advice',
    description: 'When you really need help figuring things out',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'AskReddit',
    display_name: 'Ask Reddit',
    category: 'advice',
    description: 'Open-ended questions and thought-provoking discussions',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'AmIOverreacting',
    display_name: 'Am I Overreacting?',
    category: 'advice',
    description: 'Perspective checks on reactions and situations',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'careerguidance',
    display_name: 'Career Guidance',
    category: 'advice',
    description: 'Professional advice and career decisions',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'college',
    display_name: 'College',
    category: 'advice',
    description: 'College life, academic problems, and student advice',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'DecidingToBeBetter',
    display_name: 'Deciding To Be Better',
    category: 'advice',
    description: 'Self-improvement and personal growth advice',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'internetparents',
    display_name: 'Internet Parents',
    category: 'advice',
    description: 'Parental advice for those who need it most',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'socialskills',
    display_name: 'Social Skills',
    category: 'advice',
    description: 'Advice on social interactions and relationships',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'jobs',
    display_name: 'Jobs',
    category: 'advice',
    description: 'Workplace issues, job hunting, and career advice',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'LifeAdvice',
    display_name: 'Life Advice',
    category: 'advice',
    description: 'General life guidance and wisdom sharing',
    priority: 3,
    status: 'pending',
    posts_target: 100
  },
  {
    name: 'getmotivated',
    display_name: 'Get Motivated',
    category: 'advice',
    description: 'Motivation and inspiration for life challenges',
    priority: 3,
    status: 'pending',
    posts_target: 100
  }
];

// Helper functions for organization
const CATEGORIES = {
  advice: 'Moral Dilemmas & Advice',
  stories: 'Life Stories & Confessions', 
  revenge: 'Justice & Revenge',
  drama: 'Drama & Entitled People',
  debate: 'Debates & Opinions',
  wedding: 'Wedding & Family Drama',
  relationships: 'Relationship Advice & Dating',
  finance: 'Money & Financial Conflicts',
  work: 'Workplace Horror Stories',
  family: 'Toxic Family Drama',
  neighbors: 'Living Situation Nightmares',
  morality: 'Extreme Moral Dilemmas',
  creepy: 'Terrifying Encounters',
  controversial: 'Controversial Content',
  // Add more categories as we expand
};

const PRIORITY_LEVELS = {
  1: 'Phase 3A - Complete (1,067 posts)',
  2: 'Phase 3B - Wedding & Drama Expansion',
  3: 'Phase 3C - Additional Categories'
};

// Export functions
function getSubredditsByPriority(priority) {
  return EXPANDED_SUBREDDIT_CONFIG.filter(sub => sub.priority === priority);
}

function getSubredditsByCategory(category) {
  return EXPANDED_SUBREDDIT_CONFIG.filter(sub => sub.category === category);
}

function getSubredditsByStatus(status) {
  return EXPANDED_SUBREDDIT_CONFIG.filter(sub => sub.status === status);
}

function getPendingSubreddits() {
  return EXPANDED_SUBREDDIT_CONFIG.filter(sub => sub.status === 'pending');
}

module.exports = {
  EXPANDED_SUBREDDIT_CONFIG,
  CATEGORIES,
  PRIORITY_LEVELS,
  getSubredditsByPriority,
  getSubredditsByCategory,
  getSubredditsByStatus,
  getPendingSubreddits
}; 