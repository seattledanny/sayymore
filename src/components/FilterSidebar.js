import React, { useState, useEffect, useMemo } from 'react';
import './FilterSidebar.css';
import { postService } from '../services/postService';
import { analytics } from '../services/analytics';

const FilterSidebar = ({ 
  posts, 
  onFilterChange, 
  onViewChange, 
  activeView,
  onLoadMore,
  hasMore,
  loadingMore 
}) => {
  const [filters, setFilters] = useState({
    category: '',
    subreddit: '',
    hasImage: false,
    minScore: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    // Track search queries (with debouncing)
    if (term.length > 2) {
      setTimeout(() => {
        const results = posts.filter(post => 
          post.title.toLowerCase().includes(term.toLowerCase()) ||
          post.selftext.toLowerCase().includes(term.toLowerCase())
        );
        analytics.trackSearch(term, results.length);
      }, 500);
    }
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    
    // Track filter usage
    analytics.trackFilter(filterType, value, filteredPosts.length);
  };

  // ... existing code ...
}; 