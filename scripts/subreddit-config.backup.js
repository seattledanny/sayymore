/**
 * Curated list of conversation-starter subreddits
 * Each subreddit is selected for high engagement and discussion potential
 */

const SUBREDDIT_CONFIG = [
  // Moral Dilemmas & Advice
  {
    name: 'AmItheAsshole',
    display_name: 'Am I the Asshole?',
    category: 'morality',
    description: 'Moral judgment and ethical dilemmas',
    priority: 1
  },
  {
    name: 'relationship_advice',
    display_name: 'Relationship Advice',
    category: 'advice',
    description: 'Relationship problems and advice',
    priority: 1
  },
  {
    name: 'relationships',
    display_name: 'Relationships',
    category: 'advice', 
    description: 'General relationship discussions',
    priority: 2
  },
  {
    name: 'AmIOverreacting',
    display_name: 'Am I Overreacting?',
    category: 'advice',
    description: 'Perspective checks on reactions',
    priority: 2
  },

  // Life Stories & Confessions
  {
    name: 'tifu',
    display_name: 'Today I F***ed Up',
    category: 'stories',
    description: 'Hilarious and cringe mistake stories',
    priority: 1
  },
  {
    name: 'confession',
    display_name: 'Confession',
    category: 'stories',
    description: 'Deep personal revelations',
    priority: 1
  },
  {
    name: 'offmychest',
    display_name: 'Off My Chest',
    category: 'stories',
    description: 'Personal venting and stories',
    priority: 1
  },
  {
    name: 'TrueOffMyChest',
    display_name: 'True Off My Chest',
    category: 'stories',
    description: 'Unfiltered personal stories',
    priority: 2
  },

  // Revenge & Justice Stories  
  {
    name: 'pettyrevenge',
    display_name: 'Petty Revenge',
    category: 'revenge',
    description: 'Satisfying small-scale revenge stories',
    priority: 1
  },
  {
    name: 'MaliciousCompliance',
    display_name: 'Malicious Compliance',
    category: 'revenge',
    description: 'Following rules to ridiculous extremes',
    priority: 1
  },

  // People & Workplace Drama
  {
    name: 'entitledparents',
    display_name: 'Entitled Parents',
    category: 'drama',
    description: 'Stories about entitled parent behavior',
    priority: 1
  },
  {
    name: 'ChoosingBeggars',
    display_name: 'Choosing Beggars',
    category: 'drama',
    description: 'Absurd demands from unreasonable people',
    priority: 1
  },
  {
    name: 'bridezillas',
    display_name: 'Bridezillas',
    category: 'drama',
    description: 'Wedding planning gone wrong',
    priority: 2
  },
  {
    name: 'JUSTNOMIL',
    display_name: 'Just No Mother-in-Law',
    category: 'drama',
    description: 'Mother-in-law horror stories',
    priority: 2
  },

  // Advice & Life Help
  {
    name: 'legaladvice',
    display_name: 'Legal Advice',
    category: 'advice',
    description: 'Legal questions and situations',
    priority: 1
  },
  {
    name: 'personalfinance',
    display_name: 'Personal Finance',
    category: 'advice',
    description: 'Money problems and financial advice',
    priority: 2
  },
  {
    name: 'jobs',
    display_name: 'Jobs',
    category: 'advice',
    description: 'Workplace issues and career advice',
    priority: 2
  },
  {
    name: 'college',
    display_name: 'College',
    category: 'advice',
    description: 'College life and academic problems',
    priority: 2
  },

  // Opinion & Debate
  {
    name: 'unpopularopinion',
    display_name: 'Unpopular Opinion',
    category: 'debate',
    description: 'Controversial takes and hot takes',
    priority: 1
  },
  {
    name: 'changemyview',
    display_name: 'Change My View',
    category: 'debate',
    description: 'Intellectual debates and discussions',
    priority: 2
  },

  // Lighter Drama & Annoyances
  {
    name: 'mildlyinfuriating',
    display_name: 'Mildly Infuriating',
    category: 'misc',
    description: 'Everyday annoyances and frustrations',
    priority: 2
  },
  {
    name: 'weddingshaming',
    display_name: 'Wedding Shaming',
    category: 'drama',
    description: 'Cringe wedding moments and fails',
    priority: 3
  },

  // General Advice
  {
    name: 'Advice',
    display_name: 'General Advice',
    category: 'advice',
    description: 'General life advice and guidance',
    priority: 2
  }
  {
    name: 'showerthoughts',
    display_name: 'Shower Thoughts',
    category: 'misc',
    description: 'Random interesting thoughts',
    priority: 2
  },

  {
    name: 'nosleep',
    display_name: 'NoSleep',
    category: 'creepy',
    description: 'Nosleep is a place for redditors to share their scary personal experiences.',
    priority: 2
  },

  {
    name: 'getmotivated',
    display_name: 'Get Motivated',
    category: 'advice',
    description: 'Motivational content and success stories',
    priority: 20
  },
  {
    name: 'EntitledPeople',
    display_name: 'Entitled People',
    category: 'drama',
    description: 'Stories about entitled behavior',
    priority: 14
  },
  {
    name: 'povertyfinance',
    display_name: 'Poverty Finance',
    category: 'finance',
    description: 'Financial advice for low income situations',
    priority: 18
  },
  {
    name: 'LetsNotMeet',
    display_name: 'Let's Not Meet',
    category: 'creepy',
    description: 'True scary encounter stories',
    priority: 13
  },
  {
    name: 'careerguidance',
    display_name: 'Career Guidance',
    category: 'workplace',
    description: 'Professional career advice and guidance',
    priority: 16
  },
  {
    name: 'StudentLoans',
    display_name: 'Student Loans',
    category: 'finance',
    description: 'Student loan advice and experiences',
    priority: 18
  },
  {
    name: 'socialskills',
    display_name: 'Social Skills',
    category: 'advice',
    description: 'Tips for improving social interactions',
    priority: 20
  },
  {
    name: 'survivinginfidelity',
    display_name: 'Surviving Infidelity',
    category: 'relationships',
    description: 'Support for dealing with infidelity',
    priority: 18
  },
  {
    name: 'financialindependence',
    display_name: 'Financial Independence',
    category: 'finance',
    description: 'Path to financial freedom discussions',
    priority: 18
  },
  {
    name: 'DeadBedrooms',
    display_name: 'Dead Bedrooms',
    category: 'relationships',
    description: 'Relationship intimacy issues',
    priority: 18
  },
  {
    name: 'CreditCards',
    display_name: 'Credit Cards',
    category: 'finance',
    description: 'Credit card advice and strategies',
    priority: 18
  },
  {
    name: 'dating_advice',
    display_name: 'Dating Advice',
    category: 'relationships',
    description: 'Dating tips and relationship guidance',
    priority: 18
  },
  {
    name: 'LifeAdvice',
    display_name: 'Life Advice',
    category: 'advice',
    description: 'General life advice and wisdom',
    priority: 20
  },
  {
    name: 'weddingplanning',
    display_name: 'Wedding Planning',
    category: 'wedding',
    description: 'Wedding planning tips and advice',
    priority: 15
  },
  {
    name: 'raisedbynarcissists',
    display_name: 'Raised by Narcissists',
    category: 'family',
    description: 'Support for children of narcissistic parents',
    priority: 17
  },
  {
    name: 'BadRoommates',
    display_name: 'Bad Roommates',
    category: 'neighbors',
    description: 'Terrible roommate experiences',
    priority: 10
  },
  {
    name: 'datingoverthirty',
    display_name: 'Dating Over Thirty',
    category: 'relationships',
    description: 'Dating advice for mature adults',
    priority: 18
  },
  {
    name: 'wedding',
    display_name: 'Wedding',
    category: 'wedding',
    description: 'Wedding experiences and advice',
    priority: 15
  },
  {
    name: 'AskReddit',
    display_name: 'Ask Reddit',
    category: 'advice',
    description: 'advice discussions and stories',
    priority: 20
  },
  {
    name: 'antiwork',
    display_name: 'Antiwork',
    category: 'workplace',
    description: 'Work culture criticism and alternatives',
    priority: 16
  },
  {
    name: 'UnethicalLifeProTips',
    display_name: 'Unethical Life Pro Tips',
    category: 'controversial',
    description: 'Morally questionable life advice',
    priority: 12
  },
  {
    name: 'insaneparents',
    display_name: 'Insane Parents',
    category: 'family',
    description: 'Stories of unreasonable parental behavior',
    priority: 17
  },
  {
    name: 'neighborsfromhell',
    display_name: 'Neighbors from Hell',
    category: 'neighbors',
    description: 'Terrible neighbor experiences',
    priority: 10
  },
  {
    name: 'TalesFromRetail',
    display_name: 'Tales from Retail',
    category: 'workplace',
    description: 'Retail worker stories and experiences',
    priority: 15
  },
  {
    name: 'NuclearRevenge',
    display_name: 'Nuclear Revenge',
    category: 'revenge',
    description: 'Extreme revenge stories',
    priority: 13
  },
  {
    name: 'TalesFromTheFrontDesk',
    display_name: 'Tales from the Front Desk',
    category: 'workplace',
    description: 'Hotel front desk worker stories',
    priority: 15
  },
  {
    name: 'internetparents',
    display_name: 'Internet Parents',
    category: 'advice',
    description: 'Parental advice from internet community',
    priority: 19
  },
  {
    name: 'DecidingToBeBetter',
    display_name: 'Deciding to be Better',
    category: 'advice',
    description: 'Self-improvement and personal growth',
    priority: 19
  },
  {
    name: 'JUSTNOFAMILY',
    display_name: 'Just No Family',
    category: 'family',
    description: 'Difficult family relationship support',
    priority: 16
  },
  {
    name: 'weddingdrama',
    display_name: 'Wedding Drama',
    category: 'wedding',
    description: 'Wedding-related conflicts and drama',
    priority: 14
  },
  {
    name: 'HobbyDrama',
    display_name: 'Hobby Drama',
    category: 'drama',
    description: 'Drama within hobby communities',
    priority: 13
  },
  {
    name: 'BestofRedditorUpdates',
    display_name: 'Best of Redditor Updates',
    category: 'stories',
    description: 'Follow-up stories from Reddit posts',
    priority: 13
  },
  {
    name: 'bridezilla',
    display_name: 'Bridezilla',
    category: 'wedding',
    description: 'Demanding bride behavior stories',
    priority: 10
  },
  {
    name: 'ProRevenge',
    display_name: 'Pro Revenge',
    category: 'revenge',
    description: 'Professional-level revenge stories',
    priority: 8
  },
  {
    name: 'needadvice',
    display_name: 'Need Advice',
    category: 'advice',
    description: 'Seeking advice on various life issues',
    priority: 13
  },
  {
    name: 'weddingstories',
    display_name: 'Wedding Stories',
    category: 'wedding',
    description: 'Wedding day experiences and stories',
    priority: 6
  }
  {
    name: '--subreddit',
    display_name: 'debate',
    category: 'changemyview',
    description: '--posts',
    priority: 2
  },

  {
    name: 'changemyview',
    display_name: 'Change My View',
    category: 'debate',
    description: 'Intellectual debates and perspective changes',
    priority: 2
  },

  {
    name: 'mildlyinfuriating',
    display_name: 'Mildly Infuriating',
    category: 'misc',
    description: 'Things that are mildly annoying',
    priority: 2
  },

  {
    name: 'TrueOffMyChest',
    display_name: 'True Off My Chest',
    category: 'stories',
    description: 'Authentic personal confessions and stories',
    priority: 2
  },

];

/**
 * Get subreddits by priority level
 * @param {number} maxPriority - Maximum priority level (1 = highest priority)
 * @returns {Array} Filtered subreddit list
 */
const getSubredditsByPriority = (maxPriority = 3) => {
  return SUBREDDIT_CONFIG.filter(sub => sub.priority <= maxPriority);
};

/**
 * Get subreddits by category
 * @param {string} category - Category to filter by
 * @returns {Array} Filtered subreddit list
 */
const getSubredditsByCategory = (category) => {
  return SUBREDDIT_CONFIG.filter(sub => sub.category === category);
};

/**
 * Get just the subreddit names for scraping
 * @param {number} maxPriority - Maximum priority level
 * @returns {Array} Array of subreddit names
 */
const getSubredditNames = (maxPriority = 2) => {
  return getSubredditsByPriority(maxPriority).map(sub => sub.name);
};

module.exports = {
  SUBREDDIT_CONFIG,
  getSubredditsByPriority,
  getSubredditsByCategory, 
  getSubredditNames
}; 