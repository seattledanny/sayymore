# Reddit Conversations

A clean, modern React app that displays engaging conversation-starter stories from Reddit's most discussion-worthy communities.

## 🎯 Features

- **Curated Content**: Stories from subreddits like AITA, relationship_advice, tifu, and more
- **Clean UI**: Minimal design with soft neutral color palette
- **Conversation Focus**: Posts selected for their discussion potential
- **One-time Scraping**: Pre-populated database of evergreen content
- **Responsive Design**: Works beautifully on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Reddit API credentials
- Firebase account

### Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your credentials in `.env`:
   - Reddit API credentials from https://www.reddit.com/prefs/apps
   - Firebase configuration from your Firebase project

3. **Start development server**
   ```bash
   npm start
   ```

## 📋 Setup Guide

### Reddit API Setup

1. Go to https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Choose "script" as the app type
4. Copy your client ID and secret to `.env`

### Firebase Setup

1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Copy your Firebase config to `.env`
4. Install Firebase CLI: `npm install -g firebase-tools`

### Initial Data Scraping

```bash
npm run scrape
```

This will populate your Firebase database with curated Reddit content.

## 🏗️ Project Structure

```
reddit-conversation-starter/
├── public/
│   └── index.html
├── src/
│   ├── components/          # React components
│   ├── services/           # Firebase and Reddit API services
│   ├── styles/             # CSS modules and global styles
│   ├── utils/              # Helper functions
│   ├── App.js              # Main App component
│   └── index.js            # React entry point
├── scripts/
│   └── scrapeReddit.js     # Reddit scraping script
└── firebase.json           # Firebase configuration
```

## 🎨 Design System

### Color Palette
- **Background**: Off-white (#FAFAF9)
- **Cards**: Light gray/beige (#F5F5F4)
- **Text**: Charcoal (#374151)
- **Accent**: Subtle blue (#3B82F6)

### Typography
- **Font**: Inter (Google Fonts)
- **Hierarchy**: Clean, readable sizing scale

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run scrape` - Run Reddit scraping script
- `npm run deploy` - Deploy to Firebase Hosting

## 📚 Target Subreddits

Conversation-starter communities:
- AmItheAsshole
- relationship_advice
- tifu (Today I F***ed Up)
- confession
- pettyrevenge
- MaliciousCompliance
- entitledparents
- ChoosingBeggars
- legaladvice
- offmychest

## 🚀 Deployment

```bash
npm run deploy
```

This builds the app and deploys to Firebase Hosting.

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

---

**Built with React, Firebase, and a passion for great conversations** 💬 