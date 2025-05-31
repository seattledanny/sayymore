import React, { useEffect } from 'react';
import './MobilePostView.css';

const MobilePostView = ({ 
  post,
  onBackToPostList
}) => {

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
    <div className="mobile-post-view">
      <div className="mobile-post-view-content">
        
        {/* Post Header */}
        <div className="post-view-header">
          <div className="post-meta-row">
            <span className="post-subreddit">r/{post.subreddit}</span>
            <span className="post-score">↑ {formatScore(post.score)}</span>
          </div>
          {post.created_utc && (
            <div className="post-date">{formatDate(post.created_utc)}</div>
          )}
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
  );
};

export default MobilePostView; 