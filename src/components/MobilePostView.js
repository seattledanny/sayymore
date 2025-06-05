import React, { useEffect, useState } from 'react';
import './MobilePostView.css';
import { useTTSContext } from '../contexts/TTSContext';
import TTSSettings from './TTSSettings';

const MobilePostView = ({ 
  post,
  onBackToPostList,
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

  // Scroll to top when component mounts
  useEffect(() => {
    const contentContainer = document.querySelector('.mobile-post-view-content');
    if (contentContainer) {
      contentContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [post]);

  const handleBackClick = () => {
    if (onBackToPostList) {
      onBackToPostList();
    }
  };

  const handleSubredditClick = () => {
    if (onSubredditSelect && post.subreddit) {
      onSubredditSelect(post.subreddit);
    }
  };

  // Format score for display
  const formatScore = (score) => {
    if (!score) return '0';
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
  };

  // Format timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get Reddit URL
  const getRedditUrl = () => {
    if (!post) return '#';
    return `https://www.reddit.com/r/${post.subreddit}/comments/${post.id}/`;
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

  const handlePauseResume = () => {
    if (paused) {
      resume();
    } else {
      pause();
    }
  };

  const handleTTSSettingsClick = () => {
    setShowTTSSettings(true);
  };

  if (!post) {
    return (
      <div className="mobile-post-view">
        <div className="mobile-post-view-content">
          <div className="post-error">
            <h2>⚠️ Post not found</h2>
            <p>Unable to load post content</p>
            <button className="back-btn" onClick={handleBackClick}>
              ← Back to Posts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mobile-post-view">
        <div className="mobile-post-view-content">
          
          {/* Post Header */}
          <div className="post-view-header">
            <div className="post-meta-row">
              <span className="post-subreddit" onClick={handleSubredditClick}>r/{post.subreddit}</span>
              <span className="post-score">↑ {formatScore(post.score)}</span>
            </div>
            {post.created_utc && (
              <div className="post-date">{formatDate(post.created_utc)}</div>
            )}
            
            {/* TTS Controls */}
            <div className="mobile-tts-controls">
              <button 
                className={`mobile-tts-btn ${speaking && currentContent?.postId === post.id ? 'speaking' : ''} ${ttsLoading ? 'loading' : ''}`}
                onClick={handleTTSClick}
                title={speaking && currentContent?.postId === post.id ? 'Click to stop reading' : ttsLoading ? 'Loading...' : 'Read post aloud'}
                disabled={ttsLoading}
              >
                {ttsLoading ? '⏳ Loading...' : (speaking && currentContent?.postId === post.id) ? '⏹️ Stop Reading' : '🔊 Listen to Post'}
              </button>
              
              {speaking && currentContent?.postId === post.id && (
                <button 
                  className={`mobile-tts-pause-btn ${paused ? 'paused' : 'playing'}`}
                  onClick={handlePauseResume}
                  title={paused ? 'Resume reading' : 'Pause reading'}
                >
                  {paused ? '▶️ Resume' : '⏸️ Pause'}
                </button>
              )}
              
              <button 
                className="mobile-tts-settings-btn"
                onClick={handleTTSSettingsClick}
                title="TTS Settings"
              >
                ⚙️ Voice Settings
              </button>
            </div>
          </div>

          {/* Post Title */}
          <h1 className="post-title">{post.title}</h1>

          {/* Post Content */}
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

          {/* Post Image (if available) */}
          {post.url && post.url !== post.permalink && !post.url.includes('reddit.com') && (
            <div className="post-image">
              <img 
                src={post.url} 
                alt="Post content"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="post-actions">
            <a 
              href={getRedditUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="reddit-link"
            >
              💬 Read Comments on Reddit
              <span className="external-icon">↗</span>
            </a>
            
            <button 
              className="back-btn"
              onClick={handleBackClick}
            >
              ← Back to Posts
            </button>
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

export default MobilePostView; 