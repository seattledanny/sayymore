import React, { useState } from 'react';
import './ConversationCard.css';
import { analytics } from '../services/analytics';
import { useTTSContext } from '../contexts/TTSContext';
import TTSSettings from './TTSSettings';

const ConversationCard = ({ 
  post, 
  isRead = false, 
  isFavorite = false, 
  onMarkAsRead,
  onToggleFavorite,
  onPostSelect
}) => {
  const [showComments, setShowComments] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [showTTSSettings, setShowTTSSettings] = useState(false);

  // TTS Hook
  const { 
    speak, 
    stop, 
    speaking, 
    loading: ttsLoading, 
    canSpeak, 
    getUsageStats,
    currentContent
  } = useTTSContext();

  // Format numbers (5000 -> 5K)
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const now = Date.now();
    const postTime = timestamp * 1000; // Convert to milliseconds
    const diffInHours = Math.floor((now - postTime) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    return `${Math.floor(diffInMonths / 12)}y ago`;
  };

  // Get subreddit display name
  const getSubredditDisplay = (subreddit) => {
    const displayNames = {
      'AmItheAsshole': 'AITA',
      'relationship_advice': 'Relationship Advice',
      'pettyrevenge': 'Petty Revenge',
      'MaliciousCompliance': 'Malicious Compliance',
      'entitledparents': 'Entitled Parents',
      'weddingshaming': 'Wedding Shaming',
      'antiwork': 'Anti Work',
      'TalesFromRetail': 'Retail Tales',
      'raisedbynarcissists': 'Raised by Narcissists',
      'personalfinance': 'Personal Finance',
      'dating_advice': 'Dating Advice'
    };
    return displayNames[subreddit] || subreddit;
  };

  // Truncate text for preview
  const truncateText = (text, maxLength = 200) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  // Get category color
  const getCategoryColor = (subreddit) => {
    const colorMap = {
      'AmItheAsshole': '#FF6B6B',
      'relationships': '#FF8E99', 
      'relationship_advice': '#FF8E99',
      'pettyrevenge': '#A8E6CF',
      'MaliciousCompliance': '#88D8C0',
      'entitledparents': '#FFB347',
      'weddingshaming': '#DDA0DD',
      'bridezillas': '#DDA0DD',
      'antiwork': '#87CEEB',
      'TalesFromRetail': '#F0E68C',
      'JUSTNOMIL': '#FFB6C1',
      'personalfinance': '#98FB98',
      'Advice': '#B0C4DE'
    };
    return colorMap[subreddit] || '#E6E6FA';
  };

  const handleCardClick = () => {
    // If onPostSelect is provided (desktop), open in modal
    if (onPostSelect) {
      onPostSelect(post);
      
      // Mark as read if not already read
      if (!isRead && onMarkAsRead) {
        onMarkAsRead(post.id);
      }
      
      // Track the interaction
      analytics.trackConversationView(post);
    } else {
      // Fallback behavior: expand the post to show full content
      setIsExpanded(true);
      
      // Mark as read if not already read
      if (!isRead && onMarkAsRead) {
        onMarkAsRead(post.id);
      }
      
      // Track the interaction
      analytics.trackConversationView(post);
    }
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(post.id);
    }
  };

  const handleToggleComments = (e) => {
    e.stopPropagation();
    setShowComments(!showComments);
  };

  const handleToggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageClick = () => {
    setImageExpanded(!imageExpanded);
    analytics.trackImageClick(post);
  };

  // TTS Handlers
  const handleTTSClick = (e) => {
    e.stopPropagation();
    
    // Check if this specific post is currently playing
    const isThisPostPlaying = speaking && currentContent?.postId === post.id;
    
    if (isThisPostPlaying) {
      stop();
      return;
    }

    // Create content to speak
    const titleText = `Title: ${post.title}`;
    const bodyText = post.body ? `Content: ${post.body}` : '';
    const fullText = bodyText ? `${titleText}. ${bodyText}` : titleText;

    // Check if we can speak this content
    if (!canSpeak(fullText)) {
      const usageStats = getUsageStats();
      alert(`This content (${fullText.length} characters) would exceed your remaining character limit (${usageStats.remaining} characters). Consider using Browser TTS or reset your usage counter if it's a new month.`);
      return;
    }

    speak(fullText, {
      title: post.title,
      postId: post.id,
      subreddit: post.subreddit
    });
    
    analytics.trackEvent('tts_used', {
      post_id: post.id,
      content_length: fullText.length,
      subreddit: post.subreddit
    });
  };

  const handleTTSSettingsClick = (e) => {
    e.stopPropagation();
    setShowTTSSettings(true);
  };

  // Check if post has image content
  const hasImage = () => {
    return post.imageUrl || 
           post.image_url || 
           (post.url && isImageUrl(post.url)) ||
           (post.preview && post.preview.images && post.preview.images.length > 0);
  };

  // Check if URL is an image
  const isImageUrl = (url) => {
    if (!url) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const urlLower = url.toLowerCase();
    return imageExtensions.some(ext => urlLower.includes(ext));
  };

  // Get image URL from various possible sources
  const getImageUrl = () => {
    // Priority order for image sources
    if (post.imageUrl) return post.imageUrl;
    if (post.image_url) return post.image_url;
    if (post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'default') return post.thumbnail;
    if (post.url && isImageUrl(post.url)) return post.url;
    if (post.preview && post.preview.images && post.preview.images.length > 0) {
      const preview = post.preview.images[0];
      if (preview.source && preview.source.url) {
        return preview.source.url.replace(/&amp;/g, '&');
      }
    }
    return null;
  };

  // Track post impression when component mounts
  React.useEffect(() => {
    const timer = setTimeout(() => {
      analytics.trackConversationView(post);
    }, 1000); // Track as viewed after 1 second

    return () => clearTimeout(timer);
  }, [post]);

  return (
    <>
      <div 
        className={`conversation-card ${isRead ? 'read' : 'unread'}`}
        onClick={handleCardClick}
      >
        {/* Header */}
        <div className="card-header">
          <div className="subreddit-info">
            <span 
              className="subreddit-badge"
              style={{ backgroundColor: getCategoryColor(post.subreddit) }}
            >
              r/{getSubredditDisplay(post.subreddit)}
            </span>
            <span className="post-meta">
              {formatNumber(post.score)} pts • {formatTimeAgo(post.created_utc)}
            </span>
          </div>
          
          <div className="card-actions">
            {/* TTS Controls */}
            <div className="tts-controls">
              <button 
                className={`tts-btn ${speaking && currentContent?.postId === post.id ? 'speaking' : ''} ${ttsLoading ? 'loading' : ''}`}
                onClick={handleTTSClick}
                title={speaking && currentContent?.postId === post.id ? 'Click to stop reading' : ttsLoading ? 'Loading...' : 'Read post aloud'}
                disabled={ttsLoading}
              >
                {ttsLoading ? '⏳' : (speaking && currentContent?.postId === post.id) ? '⏹️' : '🔊'}
              </button>
              <button 
                className="tts-settings-btn"
                onClick={handleTTSSettingsClick}
                title="TTS Settings"
              >
                ⚙️
              </button>
            </div>

            <button 
              className={`favorite-btn ${isFavorite ? 'active' : ''}`}
              onClick={handleToggleFavorite}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>
            
            <div className="read-indicator">
              {isRead ? '👁️' : '⚪'}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="card-title">{post.title}</h3>

        {/* Image Section */}
        {hasImage() && !imageError && (
          <div className="card-image-section">
            <div className="image-container">
              {imageLoading && (
                <div className="image-loading">
                  <div className="loading-spinner"></div>
                  <span>Loading image...</span>
                </div>
              )}
              <img 
                src={getImageUrl()}
                alt={post.title}
                className="post-image"
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{ display: imageLoading ? 'none' : 'block' }}
              />
            </div>
          </div>
        )}

        {/* Body */}
        {post.body && (
          <div className="card-body">
            <p className="post-content">
              {isExpanded ? post.body : truncateText(post.body)}
            </p>
            
            {post.body && post.body.length > 200 && (
              <button 
                className="expand-btn"
                onClick={handleToggleExpand}
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="card-footer">
          <div className="post-stats">
            <span className="comment-count">
              💬 {formatNumber(post.num_comments)} comments
            </span>
            <span className="author">
              by u/{post.author}
            </span>
          </div>

          {/* Comments toggle */}
          {post.comments && post.comments.length > 0 && (
            <button 
              className="comments-toggle"
              onClick={handleToggleComments}
            >
              {showComments ? 'Hide' : 'Show'} top comments
            </button>
          )}
        </div>

        {/* Comments section */}
        {showComments && post.comments && post.comments.length > 0 && (
          <div className="comments-section">
            <h4 className="comments-title">Top Comments:</h4>
            {post.comments.slice(0, 3).map((comment, index) => (
              <div key={comment.id || index} className="comment">
                <div className="comment-header">
                  <span className="comment-author">u/{comment.author}</span>
                  <span className="comment-score">{formatNumber(comment.score)} pts</span>
                </div>
                <p className="comment-body">
                  {truncateText(comment.body, 150)}
                </p>
              </div>
            ))}
            
            {post.comments.length > 3 && (
              <p className="more-comments">
                +{post.comments.length - 3} more comments...
              </p>
            )}
          </div>
        )}

        {/* External link */}
        <div className="card-link">
          <a 
            href={post.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="reddit-link"
            onClick={(e) => e.stopPropagation()}
          >
            View on Reddit →
          </a>
        </div>
      </div>

      {/* TTS Settings Modal */}
      <TTSSettings 
        isOpen={showTTSSettings}
        onClose={() => setShowTTSSettings(false)}
      />
    </>
  );
};

export default ConversationCard; 