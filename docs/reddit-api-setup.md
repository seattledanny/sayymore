# Reddit API Setup Guide

## Getting Reddit API Credentials

### Step 1: Create a Reddit App

1. **Go to Reddit Apps Page**
   - Visit: https://www.reddit.com/prefs/apps
   - Log in to your Reddit account

2. **Create New App**
   - Click "Create App" or "Create Another App"
   - Fill in the form:
     - **Name**: `Reddit Conversation Starter` (or your preferred name)
     - **App type**: Select "script"
     - **Description**: `Scrapes conversation-worthy posts for display`
     - **About URL**: (leave blank)
     - **Redirect URI**: `http://localhost` (required but not used)

3. **Get Your Credentials**
   - **Client ID**: Found under the app name (short string)
   - **Client Secret**: The "secret" field (longer string)

### Step 2: Configure Environment Variables

Copy your credentials to the `.env` file:

```env
REACT_APP_REDDIT_CLIENT_ID=your_14_character_client_id
REACT_APP_REDDIT_CLIENT_SECRET=your_27_character_secret
REACT_APP_REDDIT_USER_AGENT=RedditConversationStarter/1.0.0
```

## Reddit API Rate Limits

### Standard Limits
- **60 requests per minute** for authenticated requests
- **10 requests per minute** for unauthenticated requests
- **1 request per second** recommended for sustained usage

### Best Practices
- Add delays between requests (1-2 seconds)
- Implement retry logic with exponential backoff
- Monitor rate limit headers in responses
- Use batch operations when possible

## API Endpoints We'll Use

### Authentication
```
POST https://www.reddit.com/api/v1/access_token
```

### Get Subreddit Posts
```
GET https://oauth.reddit.com/r/{subreddit}/hot
GET https://oauth.reddit.com/r/{subreddit}/top
```

### Get Post Comments
```
GET https://oauth.reddit.com/r/{subreddit}/comments/{post_id}
```

## Testing Your Setup

### Quick Test Script

Create a test file to verify your credentials work:

```javascript
// test-reddit-api.js
const axios = require('axios');
require('dotenv').config();

async function testRedditAPI() {
  try {
    // Get access token
    const auth = Buffer.from(
      `${process.env.REACT_APP_REDDIT_CLIENT_ID}:${process.env.REACT_APP_REDDIT_CLIENT_SECRET}`
    ).toString('base64');

    const tokenResponse = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': process.env.REACT_APP_REDDIT_USER_AGENT
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Access token obtained successfully');

    // Test API call
    const testResponse = await axios.get(
      'https://oauth.reddit.com/r/AmItheAsshole/hot',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': process.env.REACT_APP_REDDIT_USER_AGENT
        },
        params: { limit: 5 }
      }
    );

    console.log(`✅ Successfully fetched ${testResponse.data.data.children.length} posts from r/AmItheAsshole`);
    console.log('First post title:', testResponse.data.data.children[0].data.title);

  } catch (error) {
    console.error('❌ Error testing Reddit API:', error.response?.data || error.message);
  }
}

testRedditAPI();
```

Run the test:
```bash
node test-reddit-api.js
```

## Troubleshooting

### Common Issues

**1. 401 Unauthorized**
- Check client ID and secret are correct
- Verify User-Agent is set
- Ensure you're using Basic auth for token request

**2. 403 Forbidden**
- Check rate limits
- Verify subreddit exists and is public
- Ensure access token is valid

**3. 429 Too Many Requests**
- You've hit rate limits
- Wait 60 seconds and try again
- Implement proper rate limiting

### Response Headers to Monitor

- `x-ratelimit-remaining`: Requests left in current window
- `x-ratelimit-reset`: When rate limit resets
- `x-ratelimit-used`: Requests used in current window

## Next Steps

Once your Reddit API is working:
1. ✅ Set up Firebase (Phase 2)
2. ✅ Create the scraping script (Phase 3)
3. ✅ Build the React frontend (Phase 4)

## Security Notes

- Never commit `.env` file to version control
- Keep your client secret private
- Use environment variables for all credentials
- Consider rotating credentials periodically 