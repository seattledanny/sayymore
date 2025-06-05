import React, { useEffect, useState } from 'react';
import './DesktopPostView.css';
import { useTTSContext } from '../contexts/TTSContext';
import TTSSettings from './TTSSettings';

const DesktopPostView = ({ 
  post,
  isOpen,
  onClose,
  onSubredditSelect
}) => {
  const [showTTSSettings, setShowTTSSettings] = useState(false);

  // TTS Hook
  const { 
    speak, 
    stop, 
    pause,
    resume,
    speaking, 
    paused,
    loading: ttsLoading, 
    canSpeak, 
    getUsageStats,
    currentContent
  } = useTTSContext();

  // Handle escape key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubredditClick = () => {
    if (onSubredditSelect && post.subreddit) {
      onSubredditSelect(post.subreddit);
      // Close the modal after selecting subreddit
      onClose();
    }
  };

  // Format score for display
  const formatScore = (score) => {
    if (!score) return '0';
    if (score >= 1000000) return `${(score / 1000000).toFixed(1)}M`;
    if (score >= 1000) return `${(score / 1000).toFixed(1)}K`;
    return score.toString();
  };

  // Format timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get Reddit URL
  const getRedditUrl = () => {
    if (!post) return '#';
    return `https://www.reddit.com/r/${post.subreddit}/comments/${post.id}/`;
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

  // TTS Handlers
  const handleTTSClick = () => {
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
  };

  const handleTTSSettingsClick = () => {
    setShowTTSSettings(true);
  };

  const handlePauseResume = () => {
    if (paused) {
      resume();
    } else {
      pause();
    }
  };

  // Check if post has image content
  const hasImage = () => {
    return post?.imageUrl || 
           post?.image_url || 
           (post?.url && isImageUrl(post.url)) ||
           (post?.preview && post.preview.images && post.preview.images.length > 0);
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
    if (!post) return null;
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

  if (!isOpen || !post) {
    return null;
  }

  return (
    <>
      <div className="desktop-post-modal" onClick={handleBackdropClick}>
        <div className="desktop-post-content">
          {/* Close button */}
          <button className="close-btn" onClick={onClose} title="Close (Esc)">
            ✕
          </button>

          {/* Header */}
          <div className="post-header">
            <div className="post-meta">
              <span 
                className="subreddit-badge"
                style={{ backgroundColor: getCategoryColor(post.subreddit) }}
                onClick={handleSubredditClick}
              >
                r/{getSubredditDisplay(post.subreddit)}
              </span>
              <span className="post-stats">
                ↑ {formatScore(post.score)} • 💬 {formatScore(post.num_comments)} • {formatDate(post.created_utc)}
              </span>
              <span className="post-author">by u/{post.author}</span>
            </div>

            {/* TTS Controls */}
            <div className="post-actions">
              <div className="tts-controls">
                <button 
                  className={`tts-btn ${speaking && currentContent?.postId === post.id ? 'speaking' : ''} ${ttsLoading ? 'loading' : ''}`}
                  onClick={handleTTSClick}
                  title={speaking && currentContent?.postId === post.id ? 'Click to stop reading' : ttsLoading ? 'Loading...' : 'Read post aloud'}
                  disabled={ttsLoading}
                >
                  {ttsLoading ? '⏳' : (speaking && currentContent?.postId === post.id) ? '⏹️' : '🔊'}
                </button>
                
                {speaking && currentContent?.postId === post.id && (
                  <button 
                    className={`tts-pause-btn ${paused ? 'paused' : 'playing'}`}
                    onClick={handlePauseResume}
                    title={paused ? 'Resume reading' : 'Pause reading'}
                  >
                    {paused ? '▶️' : '⏸️'}
                  </button>
                )}
                
                <button 
                  className="tts-settings-btn"
                  onClick={handleTTSSettingsClick}
                  title="TTS Settings"
                >
                  ⚙️
                </button>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="post-title">{post.title}</h1>

          {/* Image Section */}
          {hasImage() && (
            <div className="post-image-section">
              <img 
                src={getImageUrl()}
                alt={post.title}
                className="post-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Content */}
          <div className="post-content">
            {post.body ? (
              <div className="post-text">
                {post.body.split('\n').map((paragraph, index) => (
                  paragraph.trim() ? (
                    <p key={index}>{paragraph}</p>
                  ) : (
                    <br key={index} />
                  )
                ))}
              </div>
            ) : (
              <div className="no-content">
                <p>This post doesn't have additional text content.</p>
                <p>Check out the comments on Reddit for the full discussion!</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="post-footer">
            <a 
              href={getRedditUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="reddit-link"
            >
              💬 Read Comments on Reddit
              <span className="external-icon">↗</span>
            </a>
          </div>

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

export default DesktopPostView; 