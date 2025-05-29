# Reddit Conversation Starter App - Task List

## Phase 1: Project Setup & Environment

### 1.1 Initial Setup
- [ ] Create project directory structure
- [ ] Initialize Node.js project with package.json
- [ ] Set up environment variables (.env file)
- [ ] Install core dependencies (React, Firebase, etc.)
- [ ] Create .gitignore file
- [ ] Initialize Git repository

### 1.2 Reddit API Setup
- [ ] Verify Reddit API credentials
- [ ] Test Reddit API authentication
- [ ] Document rate limits and usage guidelines

## Phase 2: Firebase Configuration

### 2.1 Firebase Project Setup
- [ ] Create new Firebase project
- [ ] Enable Firestore Database
- [ ] Configure Firestore security rules
- [ ] Enable Firebase Hosting
- [ ] Set up Firebase CLI locally

### 2.2 Database Schema Design
- [ ] Design Firestore collections structure:
  - `posts` collection
  - `subreddits` collection (for metadata)
- [ ] Define document fields and data types
- [ ] Create indexes for efficient querying

## Phase 3: Reddit Scraping Implementation

### 3.1 Subreddit List Curation
- [ ] Finalize list of conversation-starter subreddits:
  - AmItheAsshole
  - relationship_advice
  - tifu
  - confession
  - pettyrevenge
  - MaliciousCompliance
  - entitledparents
  - ChoosingBeggars
  - legaladvice
  - offmychest
  - (+ others from our discussion)

### 3.2 Scraping Script Development
- [ ] Create Reddit API authentication module
- [ ] Build post scraping function (top 200 posts per subreddit)
- [ ] Build comment scraping function (top 5 comments per post)
- [ ] Implement data cleaning and filtering:
  - Remove deleted/removed content
  - Filter by minimum score threshold
  - Handle special characters and formatting
- [ ] Add error handling and retry logic
- [ ] Create progress logging and monitoring

### 3.3 Data Storage Integration
- [ ] Build Firebase connection module
- [ ] Create data transformation functions (Reddit API → Firestore format)
- [ ] Implement batch writing to Firestore
- [ ] Add duplicate post detection and handling
- [ ] Test full scraping pipeline with small dataset

## Phase 4: React Frontend Development

### 4.1 Project Structure Setup
- [ ] Create React app structure
- [ ] Set up component organization
- [ ] Install UI dependencies (styling libraries if needed)
- [ ] Configure Firebase SDK for client-side

### 4.2 Design System Implementation
- [ ] Create color palette constants (soft neutrals theme)
- [ ] Set up typography styles (clean, readable fonts)
- [ ] Create reusable UI components:
  - Card component
  - Button component
  - Modal component
  - Loading states

### 4.3 Core Components Development
- [ ] **Header Component**
  - App title/logo
  - Subreddit filter dropdown
  - Randomize button

- [ ] **PostCard Component**
  - Post title display
  - Subreddit name
  - Score/upvotes
  - Clean card design with hover effects

- [ ] **PostGrid Component**
  - 6-card grid layout (2 rows × 3 columns)
  - Responsive design for mobile
  - Loading states

- [ ] **PostModal Component**
  - Full post title and body
  - Top 5 comments display
  - Reddit URL link
  - Close/back functionality

### 4.4 State Management & Logic
- [ ] Implement Firebase data fetching
- [ ] Create filtering logic (by subreddit)
- [ ] Build randomization function
- [ ] Add loading and error states
- [ ] Implement modal open/close functionality

## Phase 5: Integration & Features

### 5.1 Data Integration
- [ ] Connect React app to Firestore
- [ ] Implement real-time queries (or static queries for performance)
- [ ] Add pagination or lazy loading if needed
- [ ] Test with real scraped data

### 5.2 User Experience Features
- [ ] Subreddit filtering functionality
- [ ] Random post selection feature
- [ ] Smooth transitions and animations
- [ ] Mobile-responsive design
- [ ] Keyboard navigation support

### 5.3 Performance Optimization
- [ ] Optimize Firestore queries
- [ ] Implement image lazy loading (if needed)
- [ ] Add caching strategies
- [ ] Minimize bundle size

## Phase 6: Testing & Deployment

### 6.1 Testing
- [ ] Test scraping with all target subreddits
- [ ] Verify data quality and completeness
- [ ] Test React app functionality:
  - Post display
  - Filtering
  - Randomization
  - Modal interactions
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Performance testing

### 6.2 Deployment Preparation
- [ ] Build React app for production
- [ ] Configure Firebase hosting
- [ ] Set up custom domain (if desired)
- [ ] Configure security rules for production

### 6.3 Launch
- [ ] Deploy to Firebase Hosting
- [ ] Run final end-to-end tests
- [ ] Monitor for errors or issues
- [ ] Document usage and maintenance

## Phase 7: Post-Launch Polish

### 7.1 Content Review
- [ ] Review scraped content quality
- [ ] Remove any inappropriate or low-quality posts
- [ ] Verify all links are working
- [ ] Check comment formatting

### 7.2 User Experience Improvements
- [ ] Gather feedback on usability
- [ ] Fine-tune UI based on real usage
- [ ] Optimize loading times
- [ ] Add any missing error handling

### 7.3 Documentation
- [ ] Create README with setup instructions
- [ ] Document the scraping process
- [ ] Create maintenance guidelines
- [ ] Plan for future feature additions

---

## Estimated Timeline
- **Phase 1-2**: 1-2 days (setup)
- **Phase 3**: 2-3 days (scraping)
- **Phase 4**: 3-4 days (React development)
- **Phase 5**: 1-2 days (integration)
- **Phase 6**: 1-2 days (testing/deployment)
- **Phase 7**: 1 day (polish)

**Total: ~10-14 days** (can be accelerated with focused development)

## Dependencies & Prerequisites
- Reddit API credentials
- Firebase account
- Node.js development environment
- Basic familiarity with React and Firebase 