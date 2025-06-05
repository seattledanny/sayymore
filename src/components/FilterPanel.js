import React, { useState, useEffect } from 'react';
import './FilterPanel.css';
import LoadingSpinner from './LoadingSpinner';

const FilterPanel = ({ 
  categories = [], 
  subreddits = [],
  selectedCategory,
  selectedSubreddit,
  selectedPostType,
  searchTerm,
  onCategoryChange,
  onSubredditChange,
  onPostTypeChange,
  onSearchChange,
  onClear,
  onLoadMore,
  loadingMore,
  hasMore,
  postsCount
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchTerm || '');

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (onSearchChange) {
        onSearchChange(localSearch);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localSearch, onSearchChange]);

  const handleCategoryClick = (categoryId) => {
    if (onCategoryChange) {
      onCategoryChange(categoryId === selectedCategory ? null : categoryId);
    }
  };

  const handleSubredditChange = (event) => {
    if (onSubredditChange) {
      onSubredditChange(event.target.value || null);
    }
  };

  const handlePostTypeChange = (event) => {
    if (onPostTypeChange) {
      onPostTypeChange(event.target.value || null);
    }
  };

  const handleClearAll = () => {
    setLocalSearch('');
    if (onClear) {
      onClear();
    }
  };

  const hasActiveFilters = selectedCategory || selectedSubreddit || selectedPostType || searchTerm;

  return (
    <div className="filter-panel">
      {/* Mobile toggle */}
      <div className="filter-header">
        <div className="filter-title">
          <h3>Find Stories</h3>
          {hasActiveFilters && (
            <span className="active-filters-count">
              {[selectedCategory, selectedSubreddit, selectedPostType, searchTerm].filter(Boolean).length} active
            </span>
          )}
        </div>
        
        <button 
          className="filter-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Filter content */}
      <div className={`filter-content ${isExpanded ? 'expanded' : ''}`}>
        
        {/* Load More Stories Section - Moved to top */}
        {postsCount > 0 && (
          <div className="load-more-section">
            <div className="posts-count">
              <span className="count-number">{postsCount}</span>
              <span className="count-label">stories loaded</span>
            </div>
            
            <div className="load-more-container">
              {loadingMore ? (
                <LoadingSpinner size="small" text="Loading..." />
              ) : (
                <button 
                  className="sidebar-load-more-btn"
                  onClick={onLoadMore}
                >
                  📚 Load More Stories
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Search */}
        <div className="filter-section">
          <label className="filter-label">Search Stories</label>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search titles and content..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="search-input"
            />
            {localSearch && (
              <button 
                className="search-clear"
                onClick={() => setLocalSearch('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="filter-section">
          <label className="filter-label">Categories</label>
          <div className="category-grid">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-btn ${
                  selectedCategory === category.id ? 'active' : ''
                }`}
                onClick={() => handleCategoryClick(category.id)}
              >
                <span className="category-name">{category.name}</span>
                <span className="category-count">{category.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Subreddit filter */}
        <div className="filter-section">
          <label className="filter-label">Subreddit</label>
          <select
            value={selectedSubreddit || ''}
            onChange={handleSubredditChange}
            className="subreddit-select"
          >
            <option value="">All subreddits</option>
            {subreddits.map((subreddit) => (
              <option key={subreddit} value={subreddit}>
                r/{subreddit}
              </option>
            ))}
          </select>
        </div>

        {/* Post Type filter */}
        <div className="filter-section">
          <label className="filter-label">Post Type</label>
          <select
            value={selectedPostType || ''}
            onChange={handlePostTypeChange}
            className="post-type-select"
          >
            <option value="">All posts</option>
            <option value="top">🏆 Top Posts Only</option>
            <option value="hot">🔥 Hot Posts Only</option>
          </select>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <div className="filter-section">
            <button 
              className="clear-filters-btn"
              onClick={handleClearAll}
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="filter-stats">
          <div className="stats-item">
            <span className="stats-number">5,882</span>
            <span className="stats-label">Total Stories</span>
          </div>
          <div className="stats-item">
            <span className="stats-number">57</span>
            <span className="stats-label">Subreddits</span>
          </div>
          <div className="stats-item">
            <span className="stats-number">15</span>
            <span className="stats-label">Categories</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FilterPanel; 