# 💬 Sayymore

**Discover engaging conversation starters from Reddit to spark meaningful discussions**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Available-brightgreen)](https://reddit-conversation-app.web.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/seattledanny/sayymore)
[![Firebase](https://img.shields.io/badge/Hosted_on-Firebase-orange)](https://firebase.google.com)
[![React](https://img.shields.io/badge/Built_with-React-61dafb)](https://reactjs.org)

## 🚀 [**Try Sayymore Live**](https://reddit-conversation-app.web.app)

---

## 🎯 What is Sayymore?

Sayymore is a mobile-first web app that curates the most engaging conversation starters from Reddit's most popular discussion communities. Perfect for:

- 🍽️ **Dinner parties** and social gatherings
- 💕 **Date nights** and getting to know someone
- 👨‍👩‍👧‍👦 **Family conversations** and bonding time
- 🏢 **Team building** and icebreakers
- 🎓 **Classroom discussions** and social activities

## ✨ Features

### 📱 **Mobile-First Design**
- Responsive layout optimized for phones and tablets
- Touch-friendly interface with smooth navigation
- Works seamlessly across all devices

### 🗂️ **Organized Content**
- **57 curated subreddits** across 15 categories
- **5,882+ conversation starters** from real Reddit posts
- Smart categorization: advice, relationships, stories, workplace, and more

### 🔥 **Priority Ordering**
- Popular subreddits like r/nosleep and r/AmItheAsshole featured first
- Content sorted by engagement and discussion potential
- Fresh content rotation to keep conversations interesting

### 📊 **Analytics Dashboard**
- Real-time insights into content performance
- Category and subreddit statistics
- User engagement metrics

### 🛠️ **Advanced Features**
- Search and filter functionality
- Mark posts as read
- Favorites system
- Comprehensive content management tools

## 🏗️ Tech Stack

- **Frontend**: React 18, CSS3, Responsive Design
- **Backend**: Firebase Firestore (NoSQL Database)
- **Hosting**: Firebase Hosting
- **Authentication**: Firebase Auth
- **Analytics**: Custom analytics with Firebase integration
- **Build Tools**: Create React App, Modern JavaScript (ES6+)

## 📁 Project Structure

```
sayymore/
├── src/
│   ├── components/          # React components
│   │   ├── MobileLanding.js # Mobile-first landing page
│   │   ├── ConversationCard.js
│   │   ├── FilterPanel.js
│   │   └── AnalyticsDashboard.js
│   ├── services/           # API and business logic
│   │   ├── postService.js  # Content management
│   │   └── analytics.js    # Usage tracking
│   └── App.js             # Main application
├── scripts/               # Data management tools
│   ├── reddit-scraper.js  # Content aggregation
│   ├── subreddit-config.js # Community configuration
│   └── firebase-admin.js  # Database management
├── public/               # Static assets
└── firebase.json        # Firebase configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ 
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/seattledanny/sayymore.git
   cd sayymore
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize project
   firebase init
   ```

4. **Configure environment**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Add your Firebase configuration
   # REACT_APP_FIREBASE_API_KEY=your_api_key
   # REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
   # etc.
   ```

5. **Start development server**
   ```bash
   npm start
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

7. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

## 📊 Content Categories

| Category | Count | Description |
|----------|-------|-------------|
| 💡 **Advice** | 1,131 posts | Life guidance and wisdom |
| 💒 **Wedding** | 669 posts | Wedding planning and stories |
| 💰 **Finance** | 500 posts | Money management discussions |
| 💕 **Relationships** | 500 posts | Dating and relationship advice |
| 🏢 **Workplace** | 498 posts | Career and office situations |
| 📚 **Stories** | 476 posts | Engaging narratives |
| 🎭 **Drama** | 390 posts | Compelling personal situations |
| 😈 **Revenge** | 343 posts | Petty and pro revenge stories |
| 👻 **Creepy** | 300 posts | Mysterious and unsettling tales |
| 👨‍👩‍👧‍👦 **Family** | 299 posts | Family dynamics and relationships |
| 🏠 **Neighbors** | 200 posts | Community interactions |
| 🗣️ **Debate** | 196 posts | Thought-provoking discussions |
| ⚖️ **Morality** | 170 posts | Ethical dilemmas |
| 🔀 **Misc** | 110 posts | Various interesting topics |
| 🔥 **Controversial** | 100 posts | Challenging viewpoints |

## 🎮 Usage

1. **Browse Categories**: Start with topics that interest you
2. **Explore Subreddits**: Dive into specific communities
3. **Find Conversations**: Browse curated discussion starters
4. **Engage**: Use the stories to spark real conversations
5. **Discover**: Let the app recommend new content based on your interests

## 🔧 Development

### Available Scripts

- `npm start` - Run development server
- `npm run build` - Create production build
- `npm test` - Run test suite
- `npm run deploy` - Build and deploy to Firebase

### Data Management

The project includes comprehensive tooling for content management:

```bash
# Scrape new content
node scripts/reddit-scraper.js

# Update subreddit configuration
node scripts/subreddit-config.js

# Generate analytics reports
node scripts/analyze-post-counts.js
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Areas for Contribution

- 🎨 UI/UX improvements
- 📱 Mobile experience enhancements
- 🔍 Search and filtering features
- 📊 Analytics and insights
- 🌐 Internationalization
- 🧪 Testing coverage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Danny Goldfarb**
- GitHub: [@seattledanny](https://github.com/seattledanny)
- Project: [Sayymore](https://github.com/seattledanny/sayymore)

## 🙏 Acknowledgments

- **Reddit Communities** for providing engaging content
- **Firebase** for robust hosting and database services  
- **React Community** for excellent development tools
- **Open Source Contributors** who make projects like this possible

## 📈 Stats

- **5,882+** conversation starters
- **57** curated subreddits  
- **15** organized categories
- **Mobile-optimized** responsive design
- **Real-time** content updates

---

**Ready to spark better conversations?** [**Try Sayymore now!**](https://reddit-conversation-app.web.app) 💬✨ 