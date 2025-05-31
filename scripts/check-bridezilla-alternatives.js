require('dotenv').config();

const REDDIT_CLIENT_ID = process.env.REACT_APP_REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REACT_APP_REDDIT_CLIENT_SECRET;
const REDDIT_USER_AGENT = process.env.REACT_APP_REDDIT_USER_AGENT;

let accessToken = null;

async function getRedditAccessToken() {
  if (accessToken) return accessToken;
  
  const auth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');
  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'User-Agent': REDDIT_USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  accessToken = data.access_token;
  return accessToken;
}

async function checkSubreddit(subredditName) {
  try {
    const token = await getRedditAccessToken();
    const response = await fetch(`https://oauth.reddit.com/r/${subredditName}/about`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': REDDIT_USER_AGENT
      }
    });

    if (response.ok) {
      const data = await response.json();
      const info = data.data;
      return {
        exists: true,
        name: info.display_name,
        title: info.title,
        description: info.public_description,
        subscribers: info.subscribers,
        active_users: info.active_user_count,
        over18: info.over18
      };
    } else {
      return { exists: false, error: response.status };
    }
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function fetchPostCount(subredditName) {
  try {
    const token = await getRedditAccessToken();
    const response = await fetch(`https://oauth.reddit.com/r/${subredditName}/hot?limit=25`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': REDDIT_USER_AGENT
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.data.children.length;
    }
    return 0;
  } catch (error) {
    return 0;
  }
}

async function checkBridezillaAlternatives() {
  console.log('💍 CHECKING BRIDEZILLA & WEDDING SUBREDDIT ALTERNATIVES');
  console.log('═'.repeat(80));

  const potentialSubreddits = [
    'AmItheBridezilla',
    'bridezilla',
    'bridezillas', // We already have this one
    'weddingshame',
    'weddingshaming', // We already have this one  
    'crazypeople',
    'entitledbride',
    'weddingfails',
    'weddinggore',
    'trashy', // Often has wedding content
    'mildlyinfuriating', // Sometimes wedding content
    'facepalm' // Sometimes wedding content
  ];

  for (const subreddit of potentialSubreddits) {
    console.log(`\n🔍 Checking r/${subreddit}...`);
    
    const info = await checkSubreddit(subreddit);
    
    if (info.exists) {
      const postCount = await fetchPostCount(subreddit);
      console.log(`✅ r/${subreddit} EXISTS!`);
      console.log(`   📊 Subscribers: ${info.subscribers?.toLocaleString() || 'Unknown'}`);
      console.log(`   👥 Active users: ${info.active_users || 'Unknown'}`);
      console.log(`   📝 Recent posts available: ${postCount}`);
      console.log(`   📋 Description: ${info.description || info.title || 'No description'}`);
      if (info.over18) console.log(`   🔞 NSFW content`);
    } else {
      console.log(`❌ r/${subreddit} does not exist or is private (Error: ${info.error})`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n═'.repeat(80));
  console.log('🎯 RECOMMENDATIONS FOR WEDDING CONTENT:');
  console.log('📝 Use the existing working subreddits that have good content');
  console.log('💡 Consider expanding to general drama subreddits that often feature wedding content');
}

checkBridezillaAlternatives().catch(console.error); 