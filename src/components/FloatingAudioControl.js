import React, { useState, useEffect } from 'react';
import './FloatingAudioControl.css';
import { useTTSContext } from '../contexts/TTSContext';
import TTSSettings from './TTSSettings';

const FloatingAudioControl = () => {
  const { 
    speaking, 
    paused,
    loading, 
    stop, 
    pause,
    resume,
    currentContent,
    getUsageStats 
  } = useTTSContext();
  
  const [showTTSSettings, setShowTTSSettings] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);

  // Show/hide the control based on speaking state
  useEffect(() => {
    if (speaking || loading) {
      setIsVisible(true);
    } else {
      // Delay hiding to allow for smooth animations
      const timer = setTimeout(() => {
        setIsVisible(false);
        setPlaybackTime(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [speaking, loading]);

  // Update playback time
  useEffect(() => {
    let interval;
    if (speaking && currentContent) {
      interval = setInterval(() => {
        const elapsed = Date.now() - currentContent.startTime;
        setPlaybackTime(Math.floor(elapsed / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [speaking, currentContent]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Truncate title for display
  const truncateTitle = (title, maxLength = 50) => {
    if (!title || title.length <= maxLength) return title;
    return title.slice(0, maxLength) + '...';
  };

  const handleStop = () => {
    stop();
  };

  const handlePauseResume = () => {
    if (paused) {
      resume();
    } else {
      pause();
    }
  };

  const handleSettingsClick = () => {
    setShowTTSSettings(true);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className={`floating-audio-control ${speaking ? 'active' : 'loading'}`}>
        <div className="audio-control-content">
          
          {/* Content Info */}
          <div className="audio-content-info">
            <div className="audio-title">
              {currentContent ? truncateTitle(currentContent.title) : 'Loading...'}
            </div>
            {currentContent?.subreddit && (
              <div className="audio-subreddit">
                r/{currentContent.subreddit}
              </div>
            )}
            {speaking && (
              <div className="audio-time">
                {formatTime(playbackTime)} {paused && '(Paused)'}
              </div>
            )}
          </div>

          {/* Audio Controls */}
          <div className="audio-controls">
            <button 
              className="audio-settings-btn"
              onClick={handleSettingsClick}
              title="Audio Settings"
            >
              ⚙️
            </button>
            
            {speaking && (
              <button 
                className={`audio-pause-btn ${paused ? 'paused' : 'playing'}`}
                onClick={handlePauseResume}
                title={paused ? 'Resume reading' : 'Pause reading'}
              >
                {paused ? '▶️' : '⏸️'}
              </button>
            )}
            
            <button 
              className={`audio-stop-btn ${speaking ? 'speaking' : 'loading'}`}
              onClick={handleStop}
              disabled={loading && !speaking}
              title={speaking ? 'Stop reading' : 'Loading...'}
            >
              {loading && !speaking ? '⏳' : '⏹️'}
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        {speaking && (
          <div className="audio-progress">
            <div className="audio-progress-bar">
              <div className="audio-progress-fill"></div>
            </div>
          </div>
        )}
      </div>

      {/* TTS Settings Modal */}
      <TTSSettings 
        isOpen={showTTSSettings}
        onClose={() => setShowTTSSettings(false)}
      />
    </>
  );
};

export default FloatingAudioControl; 