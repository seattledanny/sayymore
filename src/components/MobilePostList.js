import React, { useState, useEffect } from 'react';
import './MobilePostList.css';

const MobilePostList = ({ 
  posts = [],
  loading = false,
  selectedCategory,
  selectedSubreddit,
  onPostSelect,
  onBackToLanding,
  onGetFreshPosts,
  onSubredditSelect
}) => {
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Reset animation when posts change
  useEffect(() => {
    if (!loading && posts.length > 0) {
      setAnimationKey(prev => prev + 1);
      setIsRefreshing(true);
      
      // Reset refreshing state after animation
      const timer = setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [posts, loading]);
  
  // Get the current filter info for display
  const getFilterDisplayName = () => {
    if (selectedSubreddit) {
      return `r/${selectedSubreddit}`;
    }
    if (selectedCategory && selectedCategory !== 'all') {
      // Find category name from the category object or fallback to ID
      if (typeof selectedCategory === 'object') {
        return selectedCategory.name;
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

  const handlePostClick = (post) => {
    if (onPostSelect) {
      onPostSelect(post);
    }
  };

  const handleSubredditClick = (e, subreddit) => {
    // Prevent the post card click from firing
    e.stopPropagation();
    
    if (onSubredditSelect && subreddit) {
      onSubredditSelect(subreddit);
    }
  };

  const handleBackClick = () => {
    if (onBackToLanding) {
      onBackToLanding();
    }
  };

  const handleFreshPostsClick = async () => {
    if (onGetFreshPosts && !loading) {
      setIsRefreshing(false);
      
      // Call the parent function
      onGetFreshPosts();
      
      // Improved scroll to top with longer delay and fallback
      setTimeout(() => {
        const contentContainer = document.querySelector('.mobile-post-list-content');
        if (contentContainer) {
          // Force scroll to top
          contentContainer.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
          
          // Fallback for better browser compatibility
          setTimeout(() => {
            if (contentContainer.scrollTop > 100) {
              contentContainer.scrollTop = 0;
            }
          }, 500);
        }
      }, 200); // Increased delay to ensure content is loaded
    }
  };

  // Enhanced function to display full post titles
  const displayTitle = (title) => {
    if (!title) return 'Untitled Story';
    return title; // Return full title without truncation
  };

  // Enhanced function to format score for display
  const formatScore = (score) => {
    if (!score) return '0';
    if (score >= 10000) {
      return `${Math.round(score / 1000)}k`;
    }
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
  };

  // Enhanced function to format subreddit display
  const formatSubreddit = (subreddit) => {
    if (!subreddit) return 'unknown';
    // Capitalize first letter - no truncation needed since it's on its own line
    return subreddit.charAt(0).toUpperCase() + subreddit.slice(1);
  };

  return (
    <div className="mobile-post-list">
      <div className="mobile-post-list-content">
        
        {/* Enhanced Loading State */}
        {loading && (
          <div className="post-list-loading">
            <div className="loading-spinner"></div>
            <p>Finding amazing conversation starters...</p>
          </div>
        )}

        {/* Enhanced Posts List with Animation */}
        {!loading && posts.length > 0 && (
          <div 
            key={animationKey}
            className={`posts-list ${isRefreshing ? 'refreshing' : ''}`}
          >
            {posts.slice(0, 6).map((post, index) => (
              <button
                key={`${post.id}-${animationKey}`}
                className="post-card"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePostClick(post);
                }}
                style={{
                  animationDelay: `${0.1 + (index * 0.1)}s`
                }}
              >
                <div className="post-header">
                  <div className="post-top-row">
                    <span className="post-number">#{index + 1}</span>
                    <span className="post-score">
                      ↑ {formatScore(post.score)}
                    </span>
                  </div>
                  <button 
                    className="post-subreddit" 
                    onClick={(e) => handleSubredditClick(e, post.subreddit)}
                  >
                    r/{formatSubreddit(post.subreddit)}
                  </button>
                </div>
                
                <h3 className="post-title">
                  {displayTitle(post.title)}
                </h3>
                
                <div className="post-footer">
                  <span className="post-hint">
                    Tap to read the full story
                  </span>
                  <span className="post-arrow">→</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Enhanced No Posts State */}
        {!loading && posts.length === 0 && (
          <div className="no-posts-message">
            <h3>🤔 No stories found</h3>
            <p>
              Try selecting a different category or subreddit to discover 
              new conversation starters!
            </p>
          </div>
        )}

        {/* Enhanced Action Buttons */}
        <div className="post-list-actions">
          {posts.length > 0 && (
            <button 
              className="fresh-posts-btn"
              onClick={handleFreshPostsClick}
              disabled={loading}
            >
              {loading ? '🔄 Loading...' : '🎲 Get 6 Fresh Stories'}
            </button>
          )}
          
          <button 
            className="back-btn"
            onClick={handleBackClick}
          >
            ← Back to Categories
          </button>
        </div>

      </div>
    </div>
  );
};

export default MobilePostList; 