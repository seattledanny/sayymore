import React, { useState } from 'react';
import './TTSSettings.css';
import { useTTSContext } from '../contexts/TTSContext';

const TTSSettings = ({ isOpen, onClose }) => {
  const {
    settings,
    updateSettings,
    availableVoices,
    getUsageStats,
    resetCharacterUsage,
    canSpeak
  } = useTTSContext();

  const [testText, setTestText] = useState("Hello! This is a test of the text-to-speech voice. How does it sound?");
  const usageStats = getUsageStats();

  const handleVoiceChange = (voiceName) => {
    const voice = availableVoices.find(v => v.value === voiceName);
    if (voice) {
      updateSettings({
        voice: voiceName,
        languageCode: voice.language
      });
    }
  };

  const handleSpeedChange = (speed) => {
    updateSettings({ speed: parseFloat(speed) });
  };

  const handlePitchChange = (pitch) => {
    updateSettings({ pitch: parseFloat(pitch) });
  };

  const handleVolumeChange = (volume) => {
    updateSettings({ volumeGainDb: parseFloat(volume) });
  };

  const handleTTSToggle = (useGoogle) => {
    updateSettings({ useGoogleTTS: useGoogle });
  };

  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  const getUsageColor = () => {
    if (usageStats.percentage < 50) return '#28a745';
    if (usageStats.percentage < 80) return '#ffc107';
    return '#dc3545';
  };

  if (!isOpen) return null;

  return (
    <div className="tts-settings-overlay">
      <div className="tts-settings-modal">
        <div className="tts-settings-header">
          <h2>🔊 Text-to-Speech Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="tts-settings-content">
          
          {/* Usage Statistics */}
          <div className="usage-section">
            <h3>📊 Usage Statistics</h3>
            <div className="usage-stats">
              <div className="usage-bar">
                <div 
                  className="usage-fill"
                  style={{ 
                    width: `${Math.min(100, usageStats.percentage)}%`,
                    backgroundColor: getUsageColor()
                  }}
                ></div>
              </div>
              <div className="usage-text">
                <span>{formatNumber(usageStats.used)} / {formatNumber(usageStats.total)} characters used</span>
                <span className="usage-percentage">({usageStats.percentage.toFixed(1)}%)</span>
              </div>
              <div className="usage-remaining">
                {formatNumber(usageStats.remaining)} characters remaining this month
              </div>
            </div>
            
            {usageStats.percentage > 90 && (
              <div className="usage-warning">
                ⚠️ Warning: You're approaching your monthly limit!
              </div>
            )}

            <button 
              className="reset-usage-btn"
              onClick={resetCharacterUsage}
              title="Reset usage counter (use at start of new month)"
            >
              🔄 Reset Usage Counter
            </button>
          </div>

          {/* TTS Engine Selection */}
          <div className="engine-section">
            <h3>🎛️ Text-to-Speech Engine</h3>
            <div className="engine-options">
              <label className="radio-option">
                <input
                  type="radio"
                  checked={settings.useGoogleTTS}
                  onChange={() => handleTTSToggle(true)}
                />
                <span className="radio-label">
                  <strong>Google Cloud TTS</strong>
                  <small>High quality, premium voices (uses character limit)</small>
                </span>
              </label>
              
              <label className="radio-option">
                <input
                  type="radio"
                  checked={!settings.useGoogleTTS}
                  onChange={() => handleTTSToggle(false)}
                />
                <span className="radio-label">
                  <strong>Browser TTS</strong>
                  <small>Free, unlimited, but lower quality</small>
                </span>
              </label>
            </div>
          </div>

          {/* Voice Selection */}
          <div className="voice-section">
            <h3>🎭 Voice Selection</h3>
            <div className="voice-selector">
              <select 
                value={settings.voice} 
                onChange={(e) => handleVoiceChange(e.target.value)}
                className="voice-dropdown"
              >
                <optgroup label="Standard Voices (Lower Cost)">
                  {availableVoices
                    .filter(voice => !voice.premium)
                    .map(voice => (
                      <option key={voice.value} value={voice.value}>
                        {voice.label}
                      </option>
                    ))
                  }
                </optgroup>
                <optgroup label="Premium Voices (Higher Cost)">
                  {availableVoices
                    .filter(voice => voice.premium && !voice.studio)
                    .map(voice => (
                      <option key={voice.value} value={voice.value}>
                        {voice.label} ⭐
                      </option>
                    ))
                  }
                </optgroup>
                <optgroup label="Studio Voices (Highest Quality) 🎭">
                  {availableVoices
                    .filter(voice => voice.studio)
                    .map(voice => (
                      <option key={voice.value} value={voice.value}>
                        {voice.label} ✨
                      </option>
                    ))
                  }
                </optgroup>
              </select>
            </div>
          </div>

          {/* Voice Controls */}
          <div className="controls-section">
            <h3>🎚️ Voice Controls</h3>
            
            <div className="control-group">
              <label>Speaking Speed</label>
              <div className="slider-container">
                <input
                  type="range"
                  min="0.25"
                  max="4.0"
                  step="0.1"
                  value={settings.speed}
                  onChange={(e) => handleSpeedChange(e.target.value)}
                  className="slider"
                />
                <span className="slider-value">{settings.speed}x</span>
              </div>
            </div>

            <div className="control-group">
              <label>Pitch</label>
              <div className="slider-container">
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="1"
                  value={settings.pitch}
                  onChange={(e) => handlePitchChange(e.target.value)}
                  className="slider"
                />
                <span className="slider-value">{settings.pitch > 0 ? '+' : ''}{settings.pitch}</span>
              </div>
            </div>

            {settings.useGoogleTTS && (
              <div className="control-group">
                <label>Volume Gain</label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="-96"
                    max="16"
                    step="1"
                    value={settings.volumeGainDb}
                    onChange={(e) => handleVolumeChange(e.target.value)}
                    className="slider"
                  />
                  <span className="slider-value">{settings.volumeGainDb}dB</span>
                </div>
              </div>
            )}
          </div>

          {/* Voice Test */}
          <div className="test-section">
            <h3>🎤 Test Voice</h3>
            <div className="test-controls">
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text to test the voice..."
                className="test-textarea"
                rows={3}
              />
              
              <div className="test-buttons">
                <TestVoiceButton text={testText} />
                <div className="test-info">
                  <small>
                    Test length: {testText.length} characters
                    {settings.useGoogleTTS && (
                      <span className={canSpeak(testText) ? 'can-speak' : 'cannot-speak'}>
                        {canSpeak(testText) ? ' ✅ Can speak' : ' ❌ Would exceed limit'}
                      </span>
                    )}
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Info */}
          <div className="info-section">
            <h3>ℹ️ Information</h3>
            <div className="info-items">
              <div className="info-item">
                <strong>Free Tier:</strong> 1,000,000 characters per month
              </div>
              <div className="info-item">
                <strong>Standard Voices:</strong> $4 per 1M characters after free tier
              </div>
              <div className="info-item">
                <strong>Premium Voices:</strong> $16 per 1M characters after free tier
              </div>
              <div className="info-item">
                <strong>Fallback:</strong> Browser TTS used when Google TTS fails or limit exceeded
              </div>
            </div>
          </div>

        </div>

        <div className="tts-settings-footer">
          <button className="save-btn" onClick={onClose}>
            ✅ Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// Separate component for test button to use the TTS hook
const TestVoiceButton = ({ text }) => {
  const { speak, stop, speaking, loading } = useTTSContext();

  const handleTest = () => {
    if (speaking) {
      stop();
    } else {
      speak(text);
    }
  };

  return (
    <button 
      className={`test-voice-btn ${speaking ? 'speaking' : ''} ${loading ? 'loading' : ''}`}
      onClick={handleTest}
      disabled={!text.trim()}
    >
      {loading ? '⏳ Loading...' : speaking ? '⏹️ Stop' : '▶️ Test Voice'}
    </button>
  );
};

export default TTSSettings; 