import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// Components
import ConversationCard from './components/ConversationCard';
import FilterPanel from './components/FilterPanel';
import LoadingSpinner from './components/LoadingSpinner';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import MobileLanding from './components/MobileLanding';
import MobilePostList from './components/MobilePostList';
import MobilePostView from './components/MobilePostView';
import MobileHeader from './components/MobileHeader';

// Services
import { postService } from './services/postService';
import { analytics } from './services/analytics';

// Custom hook for mobile detection
const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      // Check window width (768px breakpoint)
      const windowWidth = window.innerWidth <= 768;
      
      // Optional: Check user agent for mobile devices
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
      const userAgentMobile = mobileKeywords.some(keyword => userAgent.includes(keyword));
      
      // Use window width as primary check, user agent as secondary
      setIsMobile(windowWidth || userAgentMobile);
    };

    // Check on initial load
    checkIsMobile();

    // Listen for window resize
    window.addEventListener('resize', checkIsMobile);

    // Cleanup listener
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

function App() {
  // Mobile detection
  const isMobile = useMobileDetection();

  // State
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subreddits, setSubreddits] = useState([]);
  const [userPreferences, setUserPreferences] = useState({
    readPosts: [],
    favorites: []
  });
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubreddit, setSelectedSubreddit] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Loading and pagination
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('posts'); // 'posts' or 'analytics'

  // Mobile navigation state
  const [mobileView, setMobileView] = useState('landing'); // 'landing', 'postList', 'postView'
  const [selectedPost, setSelectedPost] = useState(null);
  const [mobilePostList, setMobilePostList] = useState([]);

  // Initialize data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize analytics and track session
        analytics.trackSessionMetrics();
        analytics.trackPerformance();
        
        // Track initial page view
        analytics.trackPageView('Reddit Conversations Home', window.location.href);
        
        // Load categories and subreddits
        const [categoriesData, subredditsData, userPrefs] = await Promise.all([
          postService.getCategories(),
          postService.getSubreddits(),
          postService.getUserPreferences()
        ]);

        setCategories(categoriesData);
        setSubreddits(subredditsData);
        setUserPreferences(userPrefs);

        // Load initial posts
        await loadPosts(true);
        
      } catch (err) {
        console.error('Error initializing app:', err);
        setError('Failed to load conversation starters. Please try again.');
        analytics.trackError(err, 'app_initialization');
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Load posts function
  const loadPosts = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoadingMore(false);
        setLastDoc(null);
        setPosts([]);
      } else {
        setLoadingMore(true);
      }

      const result = await postService.getPosts({
        category: selectedCategory === 'all' ? null : selectedCategory,
        subreddit: selectedSubreddit,
        searchTerm: searchTerm || null,
        lastDoc: null, // No longer using pagination, always get fresh random posts
        limitCount: 12
      });
      
      console.log('loadPosts called with:', {
        category: selectedCategory === 'all' ? null : selectedCategory,
        subreddit: selectedSubreddit,
        searchTerm: searchTerm || null,
        reset
      });

      if (reset) {
        setPosts(result.posts);
      } else {
        // Add new random posts to the bottom, filter out any duplicates
        setPosts(prev => {
          const existingIds = new Set(prev.map(post => post.id));
          const newPosts = result.posts.filter(post => !existingIds.has(post.id));
          return [...prev, ...newPosts];
        });
      }

      setLastDoc(null); // Not using lastDoc anymore
      setHasMore(result.hasMore);
      setError(null);

    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Failed to load stories. Please try again.');
    } finally {
      setLoadingMore(false);
    }
  }, [selectedCategory, selectedSubreddit, searchTerm]);

  // Effect to reload posts when filters change
  useEffect(() => {
    console.log('Filter changed:', { selectedCategory, selectedSubreddit, searchTerm });
    
    if (!loading) {
      // Clear current posts immediately when filters change
      setPosts([]);
      setLastDoc(null);
      setHasMore(true);
      setLoadingMore(true);
      
      // Load fresh filtered posts
      loadPosts(true);
    }
  }, [selectedCategory, selectedSubreddit, searchTerm]);

  // Event handlers
  const handleMarkAsRead = async (postId) => {
    try {
      await postService.markAsRead(postId);
      setUserPreferences(prev => ({
        ...prev,
        readPosts: [...prev.readPosts, postId]
      }));
      analytics.trackMarkAsRead(posts.find(p => p.id === postId));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleToggleFavorite = async (postId) => {
    try {
      const isFavorite = userPreferences.favorites.includes(postId);
      
      if (isFavorite) {
        await postService.removeFromFavorites(postId);
        setUserPreferences(prev => ({
          ...prev,
          favorites: prev.favorites.filter(id => id !== postId)
        }));
        analytics.trackFavorite(posts.find(p => p.id === postId), 'remove');
      } else {
        await postService.addToFavorites(postId);
        setUserPreferences(prev => ({
          ...prev,
          favorites: [...prev.favorites, postId]
        }));
        analytics.trackFavorite(posts.find(p => p.id === postId), 'add');
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSelectedSubreddit('');
    setSearchTerm('');
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      loadPosts(false);
      analytics.trackLoadMore(posts.length);
    }
  };

  // Helper function to get filter display name for mobile header
  const getFilterDisplayName = () => {
    if (selectedSubreddit) {
      return `r/${selectedSubreddit}`;
    }
    if (selectedCategory && selectedCategory !== 'all') {
      // Find category name from categories array
      const categoryObj = categories.find(cat => cat.id === selectedCategory);
      if (categoryObj) {
        return categoryObj.name;
      }
      // Fallback - convert category ID to display name
      const categoryNames = {
        'advice': 'Life Advice',
        'relationships': 'Relationships',
        'wedding': 'Wedding Planning',
        'finance': 'Personal Finance',
        'workplace': 'Workplace Stories',
        'stories': 'Personal Stories',
        'family': 'Family Drama',
        'revenge': 'Revenge Stories',
        'drama': 'Drama & Stories',
        'neighbors': 'Neighbor Issues',
        'debate': 'Debates & Discussions',
        'morality': 'Moral Dilemmas',
        'creepy': 'Creepy Encounters',
        'misc': 'Miscellaneous',
        'controversial': 'Controversial'
      };
      return categoryNames[selectedCategory] || selectedCategory;
    }
    return 'All Stories';
  };

  // Mobile navigation handlers
  const handleMobileCategorySelect = (category) => {
    setSelectedCategory(category.id);
    setSelectedSubreddit(''); // Clear subreddit when selecting category
    setMobileView('postList');
    analytics.trackCategorySelection(category, 'mobile');
  };

  const handleMobileSubredditSelect = (subreddit) => {
    setSelectedSubreddit(subreddit);
    setSelectedCategory('all'); // Clear category when selecting subreddit
    setMobileView('postList');
    analytics.trackSubredditSelection(subreddit, 'mobile');
  };

  const handleMobileAnalyticsClick = () => {
    setCurrentView('analytics');
    setMobileView('analytics');
    analytics.trackPageView('Analytics Dashboard Mobile', window.location.href);
  };

  const handleMobilePostSelect = (post) => {
    setSelectedPost(post);
    setMobileView('postView');
    analytics.trackPostView(post, 'mobile');
  };

  const handleMobileBackToLanding = () => {
    setMobileView('landing');
    setSelectedCategory('all');
    setSelectedSubreddit('');
    setSelectedPost(null); // Clear selected post
  };

  const handleMobileBackToPostList = () => {
    setMobileView('postList');
    setSelectedPost(null); // Clear selected post
  };

  const handleMobileGetFreshPosts = () => {
    // Clear cache to ensure fresh data
    postService.clearCache();
    
    // Trigger a fresh posts load
    loadPosts(true);
  };

  // Show initial loading screen
  if (loading) {
    return (
      <LoadingSpinner 
        fullScreen={true}
        size="large"
        text="Loading your conversation starters..."
      />
    );
  }

  // Mobile view conditional rendering
  if (isMobile) {
    // Handle analytics view on mobile
    if (currentView === 'analytics') {
      return (
        <div className="App mobile-app">
          <MobileHeader 
            title="Analytics"
            showBack={true}
            onBack={() => {
              setCurrentView('posts');
              setMobileView('landing');
            }}
            variant="gradient"
          />
          <AnalyticsDashboard />
        </div>
      );
    }

    return (
      <div className="App mobile-app">
        {/* Mobile Landing Page */}
        {mobileView === 'landing' && (
          <>
            <MobileHeader 
              title="💬 Sayymore"
              subtitle="Fun Conversation Starters"
              showSearch={true}
              onSearch={() => {
                // TODO: Implement search functionality
                console.log('Search clicked');
              }}
              variant="landing"
            />
            
            <MobileLanding 
              categories={categories}
              subreddits={subreddits}
              onCategorySelect={handleMobileCategorySelect}
              onSubredditSelect={handleMobileSubredditSelect}
              onAnalyticsClick={handleMobileAnalyticsClick}
            />
          </>
        )}

        {/* Mobile Post List Page */}
        {mobileView === 'postList' && (
          <>
            <MobileHeader 
              title={getFilterDisplayName()}
              showBack={true}
              onBack={handleMobileBackToLanding}
              showSearch={true}
              onSearch={() => {
                // TODO: Implement search functionality
                console.log('Search clicked from post list');
              }}
            />
            
            <MobilePostList 
              posts={posts}
              loading={loadingMore || loading}
              selectedCategory={selectedCategory}
              selectedSubreddit={selectedSubreddit}
              onPostSelect={handleMobilePostSelect}
              onBackToLanding={handleMobileBackToLanding}
              onGetFreshPosts={handleMobileGetFreshPosts}
            />
          </>
        )}

        {/* Mobile Post View Page */}
        {mobileView === 'postView' && (
          <>
            <MobileHeader 
              title="Full Story"
              showBack={true}
              onBack={handleMobileBackToPostList}
              showAction={true}
              actionIcon="📤"
              actionLabel="Share"
              onAction={() => {
                // TODO: Implement share functionality
                console.log('Share clicked');
              }}
            />
            
            <MobilePostView 
              post={selectedPost}
              onBackToPostList={handleMobileBackToPostList}
            />
          </>
        )}
      </div>
    );
  }

  // Desktop view (existing layout)
  return (
    <div className="App desktop-app">
      {/* Navigation Header */}
      <div className="app-header">
        <div className="app-title">
          <h1>💬 Sayymore.com</h1>
          <p>Fun Conversation Starters from Popular Reddit Posts</p>
        </div>
        
        <div className="app-navigation">
          <button 
            className={`nav-btn ${currentView === 'posts' ? 'active' : ''}`}
            onClick={() => setCurrentView('posts')}
          >
            📚 Browse Posts
          </button>
          <button 
            className={`nav-btn ${currentView === 'analytics' ? 'active' : ''}`}
            onClick={() => setCurrentView('analytics')}
          >
            📊 Analytics
          </button>
        </div>
      </div>

      {currentView === 'analytics' ? (
        <AnalyticsDashboard />
      ) : (
        <div className="app-container">
          {/* Sidebar */}
          <div className="sidebar">
            <FilterPanel
              categories={categories}
              subreddits={subreddits}
              selectedCategory={selectedCategory}
              selectedSubreddit={selectedSubreddit}
              searchTerm={searchTerm}
              onCategoryChange={setSelectedCategory}
              onSubredditChange={setSelectedSubreddit}
              onSearchChange={setSearchTerm}
              onClear={handleClearFilters}
              onLoadMore={handleLoadMore}
              loadingMore={loadingMore}
              hasMore={hasMore}
              postsCount={posts.length}
            />
          </div>

          {/* Main Content */}
          <div className="main-content">
            {loading ? (
              <div className="loading-container">
                <LoadingSpinner />
                <p>Loading conversation starters...</p>
              </div>
            ) : (
              <>
                {/* Posts Container */}
                <div className="posts-container">
                  {posts.length === 0 ? (
                    <div className="no-posts">
                      <h2>🔍 No posts found</h2>
                      <p>Try adjusting your filters or search terms</p>
                      <button onClick={handleClearFilters} className="clear-filters-btn">
                        Clear All Filters
                      </button>
                    </div>
                  ) : (
                    <>
                      {posts.map((post) => (
                        <ConversationCard
                          key={post.id}
                          post={post}
                          isRead={userPreferences.readPosts.includes(post.id)}
                          isFavorite={userPreferences.favorites.includes(post.id)}
                          onMarkAsRead={handleMarkAsRead}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      ))}
                    </>
                  )}
                </div>

                {/* End message */}
                {!hasMore && posts.length > 0 && (
                  <div className="end-message">
                    <p>🎉 You've reached the end! That's all the stories for now.</p>
                    <p>
                      <button 
                        className="refresh-btn"
                        onClick={() => {
                          postService.clearCache();
                          loadPosts(true);
                        }}
                      >
                        Refresh Stories
                      </button>
                    </p>
                  </div>
                )}

                {/* Loading more indicator */}
                {loadingMore && (
                  <div className="loading-more">
                    <LoadingSpinner />
                    <p>Loading more stories...</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 