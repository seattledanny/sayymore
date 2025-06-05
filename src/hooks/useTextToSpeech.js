import { useState, useEffect, useCallback } from 'react';

// Character tracking for Google Cloud TTS free tier (1M characters)
const STORAGE_KEY = 'tts_character_usage';
const SETTINGS_KEY = 'tts_settings';
const FREE_TIER_LIMIT = 1000000; // 1M characters

export const useTextToSpeech = () => {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [characterUsage, setCharacterUsage] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [audioQueue, setAudioQueue] = useState([]);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [settings, setSettings] = useState({
    voice: 'en-US-Standard-C', // Default female voice
    languageCode: 'en-US',
    speed: 1.0,
    pitch: 0.0,
    volumeGainDb: 0.0,
    useGoogleTTS: true, // Toggle between Google TTS and Web Speech API
  });

  // Available Google Cloud TTS voices
  const availableVoices = [
    { value: 'en-US-Standard-A', label: 'US English - Male (Standard A)', gender: 'MALE', language: 'en-US' },
    { value: 'en-US-Standard-B', label: 'US English - Male (Standard B)', gender: 'MALE', language: 'en-US' },
    { value: 'en-US-Standard-C', label: 'US English - Female (Standard C)', gender: 'FEMALE', language: 'en-US' },
    { value: 'en-US-Standard-D', label: 'US English - Male (Standard D)', gender: 'MALE', language: 'en-US' },
    { value: 'en-US-Standard-E', label: 'US English - Female (Standard E)', gender: 'FEMALE', language: 'en-US' },
    { value: 'en-US-Wavenet-A', label: 'US English - Male (Wavenet A)', gender: 'MALE', language: 'en-US', premium: true },
    { value: 'en-US-Wavenet-B', label: 'US English - Male (Wavenet B)', gender: 'MALE', language: 'en-US', premium: true },
    { value: 'en-US-Wavenet-C', label: 'US English - Female (Wavenet C)', gender: 'FEMALE', language: 'en-US', premium: true },
    { value: 'en-US-Wavenet-D', label: 'US English - Male (Wavenet D)', gender: 'MALE', language: 'en-US', premium: true },
    { value: 'en-US-Wavenet-E', label: 'US English - Female (Wavenet E)', gender: 'FEMALE', language: 'en-US', premium: true },
    { value: 'en-US-Neural2-A', label: 'US English - Male (Neural2 A)', gender: 'MALE', language: 'en-US', premium: true },
    { value: 'en-US-Neural2-C', label: 'US English - Female (Neural2 C)', gender: 'FEMALE', language: 'en-US', premium: true },
    { value: 'en-US-Neural2-D', label: 'US English - Male (Neural2 D)', gender: 'MALE', language: 'en-US', premium: true },
    { value: 'en-US-Neural2-F', label: 'US English - Female (Neural2 F)', gender: 'FEMALE', language: 'en-US', premium: true },
    { value: 'en-US-Studio-O', label: 'US English - Female (Studio O) 🎭', gender: 'FEMALE', language: 'en-US', premium: true, studio: true },
    { value: 'en-US-Studio-Q', label: 'US English - Male (Studio Q) 🎭', gender: 'MALE', language: 'en-US', premium: true, studio: true },
    { value: 'en-GB-Standard-A', label: 'UK English - Female (Standard A)', gender: 'FEMALE', language: 'en-GB' },
    { value: 'en-GB-Standard-B', label: 'UK English - Male (Standard B)', gender: 'MALE', language: 'en-GB' },
    { value: 'en-GB-Wavenet-A', label: 'UK English - Female (Wavenet A)', gender: 'FEMALE', language: 'en-GB', premium: true },
    { value: 'en-GB-Wavenet-B', label: 'UK English - Male (Wavenet B)', gender: 'MALE', language: 'en-GB', premium: true },
    { value: 'en-AU-Standard-A', label: 'Australian English - Female (Standard A)', gender: 'FEMALE', language: 'en-AU' },
    { value: 'en-AU-Standard-B', label: 'Australian English - Male (Standard B)', gender: 'MALE', language: 'en-AU' },
  ];

  // Load settings and usage from localStorage on mount
  useEffect(() => {
    const savedUsage = localStorage.getItem(STORAGE_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    
    if (savedUsage) {
      setCharacterUsage(parseInt(savedUsage, 10));
    }
    
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      } catch (error) {
        console.error('Failed to parse TTS settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Save character usage to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, characterUsage.toString());
  }, [characterUsage]);

  // Update character usage
  const updateCharacterUsage = useCallback((characters) => {
    setCharacterUsage(prev => prev + characters);
  }, []);

  // Reset character usage (for new month)
  const resetCharacterUsage = useCallback(() => {
    setCharacterUsage(0);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get remaining characters in free tier
  const getRemainingCharacters = useCallback(() => {
    return Math.max(0, FREE_TIER_LIMIT - characterUsage);
  }, [characterUsage]);

  // Check if we can speak the text without exceeding free tier
  const canSpeak = useCallback((text) => {
    const textLength = text.length;
    return getRemainingCharacters() >= textLength;
  }, [getRemainingCharacters]);

  // Google Cloud TTS API call
  const synthesizeSpeechGoogle = async (text) => {
    if (!canSpeak(text)) {
      throw new Error('Would exceed free tier character limit');
    }

    setLoading(true);
    
    try {
      // Make direct call to Google Cloud TTS API
      const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + process.env.REACT_APP_GOOGLE_CLOUD_API_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: settings.languageCode,
            name: settings.voice,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: settings.speed,
            pitch: settings.pitch,
            volumeGainDb: settings.volumeGainDb,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'TTS API request failed');
      }

      const audioData = await response.json();
      
      // Update character usage
      updateCharacterUsage(text.length);
      
      return audioData.audioContent; // Base64 encoded audio
    } finally {
      setLoading(false);
    }
  };

  // Fallback to Web Speech API
  const synthesizeSpeechWeb = (text) => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = settings.speed;
      utterance.pitch = settings.pitch;
      utterance.volume = 1;
      
      // Store the utterance for potential cancellation
      setCurrentAudio(utterance);
      
      utterance.onend = () => {
        setSpeaking(false);
        setPaused(false);
        setCurrentAudio(null);
        resolve();
      };
      
      utterance.onerror = (error) => {
        setSpeaking(false);
        setPaused(false);
        setCurrentAudio(null);
        reject(error);
      };
      
      // Set speaking to true before starting
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    });
  };

  // Main speak function
  const speak = useCallback(async (text, options = {}) => {
    if (!text) return;

    try {
      if (settings.useGoogleTTS && canSpeak(text)) {
        // Use Google Cloud TTS
        setSpeaking(true);
        const audioContent = await synthesizeSpeechGoogle(text);
        
        // Create audio element and play
        const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
        setCurrentAudio(audio);
        
        audio.onended = () => {
          setSpeaking(false);
          setPaused(false);
          setCurrentAudio(null);
        };
        
        audio.onerror = () => {
          setSpeaking(false);
          setPaused(false);
          setCurrentAudio(null);
          // Fallback to Web Speech API
          synthesizeSpeechWeb(text).catch(() => {
            setSpeaking(false);
            setPaused(false);
          });
        };
        
        audio.onpause = () => {
          if (speaking) {
            setPaused(true);
          }
        };
        
        audio.onplay = () => {
          setPaused(false);
        };
        
        await audio.play();
      } else {
        // Use Web Speech API as fallback
        await synthesizeSpeechWeb(text);
      }
    } catch (error) {
      console.error('TTS Error:', error);
      setSpeaking(false);
      setCurrentAudio(null);
      
      // Try Web Speech API as fallback
      try {
        await synthesizeSpeechWeb(text);
      } catch (fallbackError) {
        console.error('Fallback TTS also failed:', fallbackError);
        setSpeaking(false);
        setCurrentAudio(null);
      }
    }
  }, [settings, canSpeak, updateCharacterUsage]);

  // Stop speaking
  const stop = useCallback(() => {
    // Stop Google TTS audio
    if (currentAudio && currentAudio instanceof HTMLAudioElement) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    
    // Stop Web Speech API
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Reset state
    setCurrentAudio(null);
    setSpeaking(false);
    setPaused(false);
  }, [currentAudio]);

  // Pause speaking
  const pause = useCallback(() => {
    if (!speaking || paused) return;

    // Pause Google TTS audio
    if (currentAudio && currentAudio instanceof HTMLAudioElement) {
      currentAudio.pause();
      setPaused(true);
    }
    
    // Pause Web Speech API
    else if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }, [currentAudio, speaking, paused]);

  // Resume speaking
  const resume = useCallback(() => {
    if (!speaking || !paused) return;

    // Resume Google TTS audio
    if (currentAudio && currentAudio instanceof HTMLAudioElement) {
      currentAudio.play().catch(console.error);
      setPaused(false);
    }
    
    // Resume Web Speech API
    else if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    }
  }, [currentAudio, speaking, paused]);

  // Update settings
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Get usage statistics
  const getUsageStats = useCallback(() => {
    const usagePercentage = (characterUsage / FREE_TIER_LIMIT) * 100;
    const remaining = getRemainingCharacters();
    
    return {
      used: characterUsage,
      remaining,
      total: FREE_TIER_LIMIT,
      percentage: usagePercentage,
      canUse: remaining > 0,
    };
  }, [characterUsage, getRemainingCharacters]);

  return {
    speak,
    stop,
    pause,
    resume,
    speaking,
    paused,
    loading,
    settings,
    updateSettings,
    availableVoices,
    characterUsage,
    resetCharacterUsage,
    canSpeak,
    getUsageStats,
    getRemainingCharacters,
  };
}; 