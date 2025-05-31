import React from 'react';
import './MobilePostList.css';

const MobilePostList = ({ 
  posts = [],
  loading = false,
  selectedCategory,
  selectedSubreddit,
  onPostSelect,
  onBackToLanding,
  onGetFreshPosts
}) => {
  
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

  const handleBackClick = () => {
    if (onBackToLanding) {
      onBackToLanding();
    }
  };

  const handleFreshPostsClick = () => {
    if (onGetFreshPosts) {
      onGetFreshPosts();
      
      // Scroll to top of the content container
      setTimeout(() => {
        const contentContainer = document.querySelector('.mobile-post-list-content');
        if (contentContainer) {
          contentContainer.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      }, 100); // Small delay to ensure content loads first
    }
  };

  // Function to truncate post titles for mobile display
  const truncateTitle = (title, maxLength = 80) => {
    if (!title) return 'Untitled';
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength).trim() + '...';
  };

  // Function to format score for display
  const formatScore = (score) => {
    if (!score) return '0';
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
  };

  return (
    <div className="mobile-post-list">
      <div className="mobile-post-list-content">
        
        {/* Loading State */}
        {loading && (
          <div className="post-list-loading">
            <div className="loading-spinner"></div>
            <p>Finding great conversation starters...</p>
          </div>
        )}

        {/* Posts List */}
        {!loading && posts.length > 0 && (
          <div className="posts-list">
            {posts.slice(0, 3).map((post, index) => (
              <button
                key={post.id}
                className="post-card"
                onClick={() => handlePostClick(post)}
              >
                <div className="post-header">
                  <span className="post-number">#{index + 1}</span>
                  <div className="post-meta">
                    <span className="post-score">↑ {formatScore(post.score)}</span>
                    <span className="post-subreddit">r/{post.subreddit}</span>
                  </div>
                </div>
                
                <h3 className="post-title">
                  {truncateTitle(post.title)}
                </h3>
                
                <div className="post-footer">
                  <span className="post-hint">Tap to read full story</span>
                  <span className="post-arrow">→</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No Posts State */}
        {!loading && posts.length === 0 && (
          <div className="no-posts-message">
            <h3>🤔 No stories found</h3>
            <p>Try selecting a different category or subreddit</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="post-list-actions">
          {posts.length > 0 && (
            <button 
              className="fresh-posts-btn"
              onClick={handleFreshPostsClick}
              disabled={loading}
            >
              🎲 Get 3 Fresh Posts
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