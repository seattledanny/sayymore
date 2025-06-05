import React, { createContext, useContext, useState } from 'react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

const TTSContext = createContext();

export const useTTSContext = () => {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error('useTTSContext must be used within a TTSProvider');
  }
  return context;
};

export const TTSProvider = ({ children }) => {
  const [currentContent, setCurrentContent] = useState(null);
  const ttsHook = useTextToSpeech();

  const speakWithContent = (text, contentInfo = {}) => {
    setCurrentContent({
      text,
      title: contentInfo.title || 'Reading content...',
      postId: contentInfo.postId,
      subreddit: contentInfo.subreddit,
      startTime: Date.now()
    });
    
    return ttsHook.speak(text);
  };

  const stopWithCleanup = () => {
    ttsHook.stop();
    setCurrentContent(null);
  };

  const pauseWithContext = () => {
    ttsHook.pause();
  };

  const resumeWithContext = () => {
    ttsHook.resume();
  };

  // Clear content when speech naturally ends
  React.useEffect(() => {
    if (!ttsHook.speaking && currentContent && !ttsHook.paused) {
      const timer = setTimeout(() => {
        setCurrentContent(null);
      }, 500); // Small delay to prevent flicker
      
      return () => clearTimeout(timer);
    }
  }, [ttsHook.speaking, ttsHook.paused, currentContent]);

  const value = {
    ...ttsHook,
    speak: speakWithContent,
    stop: stopWithCleanup,
    pause: pauseWithContext,
    resume: resumeWithContext,
    currentContent,
    setCurrentContent,
  };

  return (
    <TTSContext.Provider value={value}>
      {children}
    </TTSContext.Provider>
  );
}; 