# Google Cloud Text-to-Speech Setup for Firebase

## 🚀 Quick Setup Guide

Your TTS system is ready! You just need to get a Google Cloud API key:

### Step 1: Get Your API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your **"sayymore"** project (since you already created it)
3. Go to **APIs & Services > Credentials**
4. Click **Create Credentials > API Key**
5. Copy your new API key

### Step 2: Add API Key to Environment

1. Open your `.env` file
2. Replace `YOUR_API_KEY_HERE` with your actual API key:
   ```
   REACT_APP_GOOGLE_CLOUD_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx
   ```

### Step 3: Secure Your API Key (Recommended)

1. In Google Cloud Console, click on your API key
2. Under **API restrictions**, select "Restrict key"
3. Choose **Cloud Text-to-Speech API**
4. Under **HTTP referrers**, add:
   - `localhost:3000/*` (for development)
   - `localhost:3001/*` (for development)
   - `your-firebase-domain.web.app/*` (for production)
   - `your-firebase-domain.firebaseapp.com/*` (for production)

### Step 4: Test

1. Start your app: `npm start`
2. Click the 🔊 button on any conversation starter
3. Open settings (⚙️) to customize voices and check usage

## ✅ What's Included

- **20+ Google Cloud voices** (Standard and Premium)
- **Character usage tracking** (1M free per month)
- **Automatic fallback** to browser TTS
- **Voice controls** (speed, pitch, volume)
- **Cross-platform floating audio control**

## 🎯 Benefits of This Approach

- ✅ **Simple setup** - just one API key needed
- ✅ **Works with Firebase** - no server-side functions required
- ✅ **Direct client-side calls** - faster response times
- ✅ **Automatic fallback** - always works even if API fails
- ✅ **Character tracking** - stays within free tier

## 🔐 Security Note

The API key will be visible in your client-side code, but this is normal for Google Cloud TTS. Use HTTP referrer restrictions to limit where it can be used.

## 🚀 Ready to Deploy

Your app is ready for Firebase deployment:
```bash
npm run build
firebase deploy
```

## 🎉 That's It!

Your Google Cloud TTS is now integrated with Firebase hosting! 