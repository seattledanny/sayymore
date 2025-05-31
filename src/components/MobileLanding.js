import React, { useState, useRef } from 'react';
import './MobileLanding.css';

const MobileLanding = ({ 
  categories = [], 
  subreddits = [],
  onCategorySelect,
  onSubredditSelect,
  onAnalyticsClick
}) => {
  
  // State for showing all subreddits vs just top 10
  const [showAllSubreddits, setShowAllSubreddits] = useState(false);
  
  // Ref for subreddits section to scroll to
  const subredditsHeaderRef = useRef(null);
  
  // Get prioritized subreddits list (database already provides popularity order)
  const getPrioritizedSubreddits = () => {
    // Since the database now returns subreddits sorted by popularity,
    // we can use that directly without complex reordering logic
    return subreddits;
  };

  const allPrioritizedSubreddits = getPrioritizedSubreddits();
  
  // Show top 10 by default, or all if showAllSubreddits is true
  const displaySubreddits = showAllSubreddits 
    ? allPrioritizedSubreddits 
    : allPrioritizedSubreddits.slice(0, 10);
  
  const hasMoreSubreddits = allPrioritizedSubreddits.length > 10;

  // Filter out 'all' category for mobile display
  const displayCategories = categories.filter(cat => cat.id !== 'all');

  const handleCategoryClick = (category) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  const handleSubredditClick = (subreddit) => {
    if (onSubredditSelect) {
      onSubredditSelect(subreddit);
    }
  };

  const handleShowAllSubreddits = () => {
    setShowAllSubreddits(true);
    
    // Scroll to subreddits header to show the new content
    setTimeout(() => {
      if (subredditsHeaderRef.current) {
        subredditsHeaderRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100); // Small delay to ensure content loads first
  };

  const handleShowFewerSubreddits = () => {
    setShowAllSubreddits(false);
  };

  return (
    <div className="mobile-landing">
      <div className="mobile-landing-content">
        
        {/* Categories Section */}
        <section className="categories-section">
          <h2 className="section-title">📚 Browse by Category</h2>
          <div className="categories-grid">
            {displayCategories.map((category) => (
              <button
                key={category.id}
                className="category-card"
                onClick={() => handleCategoryClick(category)}
              >
                <span className="category-name">{category.name}</span>
                <span className="category-count">{category.count} stories</span>
              </button>
            ))}
          </div>
        </section>

        {/* Top Subreddits Section */}
        <section className="subreddits-section">
          <div className="subreddits-header" ref={subredditsHeaderRef}>
            <h2 className="section-title">🔥 Popular Subreddits</h2>
          </div>
          
          <div className="subreddits-list">
            {displaySubreddits.map((subreddit, index) => {
              const globalIndex = index + 1;
              return (
                <button
                  key={subreddit}
                  className="subreddit-card"
                  onClick={() => handleSubredditClick(subreddit)}
                >
                  <div className="subreddit-info">
                    <span className="subreddit-rank">#{globalIndex}</span>
                    <span className="subreddit-name">r/{subreddit}</span>
                  </div>
                  <span className="subreddit-arrow">→</span>
                </button>
              );
            })}
          </div>

          {/* Show All/Show Fewer Subreddits Button */}
          {hasMoreSubreddits && !showAllSubreddits && (
            <button 
              className="show-all-btn"
              onClick={handleShowAllSubreddits}
            >
              Show All {allPrioritizedSubreddits.length} Subreddits
            </button>
          )}
          
          {showAllSubreddits && (
            <button 
              className="show-fewer-btn"
              onClick={handleShowFewerSubreddits}
            >
              Show Fewer (Top 10)
            </button>
          )}
        </section>

        {/* Analytics Link */}
        <section className="analytics-section">
          <button 
            className="analytics-link"
            onClick={onAnalyticsClick}
          >
            <span className="analytics-icon">📊</span>
            <div className="analytics-text">
              <span className="analytics-title">View Analytics</span>
              <span className="analytics-subtitle">Data insights & statistics</span>
            </div>
            <span className="analytics-arrow">→</span>
          </button>
        </section>

      </div>
    </div>
  );
};

export default MobileLanding; 