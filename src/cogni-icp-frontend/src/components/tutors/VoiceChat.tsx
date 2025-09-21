import React, { useState, useRef, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '../shared';
import aiSocketService, { TutorMessageChunk } from '../../services/aiSocketService';
import api from '../../utils/apiClient';

// Audio context for better audio management
let audioContext: AudioContext | null = null;
let currentAudioSource: AudioBufferSourceNode | null = null;

// Custom SVG icons
const MicIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
    <line x1="8" y1="23" x2="16" y2="23"></line>
  </svg>
);

const MicOffIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <line x1="1" y1="1" x2="23" y2="23"></line>
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
    <line x1="8" y1="23" x2="16" y2="23"></line>
  </svg>
);

const VolumeIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
  </svg>
);

const VolumeXIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <line x1="23" y1="9" x2="17" y2="15"></line>
    <line x1="17" y1="9" x2="23" y2="15"></line>
  </svg>
);

interface VoiceChatProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message?: string) => void;
  tutorName: string;
  tutorId: string;
  sessionId: string;
  tutorAvatarUrl: string;
}

interface AudioMessage {
  id: string;
  content: string;
  sender: 'user' | 'tutor';
  audioUrl?: string;
  timestamp: Date;
}

const VoiceChat: React.FC<VoiceChatProps> = ({
  isOpen,
  onClose,
  onSendMessage,
  tutorName,
  tutorId,
  sessionId,
  tutorAvatarUrl
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTutorSpeaking, setIsTutorSpeaking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAudioLevelRef = useRef<number>(0);

  // Start listening as soon as the modal opens
  useEffect(() => {
    if (isOpen) {
      startRecording();
    } else {
      stopRecording();
      stopAllAudio(); // Stop any playing audio when modal closes
    }
  }, [isOpen]);

  // Cleanup when component unmounts or modal closes
  useEffect(() => {
    return () => {
      stopRecording();
      stopAllAudio();
    };
  }, []);

  // Stop all audio playback
  const stopAllAudio = () => {
    console.log('Stopping all audio...');

    // Stop speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      console.log('Cancelled speech synthesis');
    }
    
    // Stop audio context
    if (currentAudioSource) {
      try {
        currentAudioSource.stop();
        currentAudioSource.disconnect();
        currentAudioSource = null;
        console.log('Stopped audio context');
      } catch (e) {
        console.log('Audio context already stopped');
      }
    }
    
    // Stop any playing audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
      console.log('Stopped audio element');
    });
  };

  // Start recording user's voice with improved silence detection
  const startRecording = async () => {
    try {
      if (!window.MediaRecorder) return;
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioChunksRef.current.length > 0) {
        await processAudioMessage(audioBlob);
        }
        setIsRecording(false);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Set up silence detection
      setupSilenceDetection(stream);
      
      // Fallback: stop after 10 seconds maximum
      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 10000);
      
    } catch (e) {
      console.error('Error starting recording:', e);
      setIsRecording(false);
    }
  };

  // Process the complete voice chat pipeline
  const processAudioMessage = async (audioBlob: Blob) => {
    // Don't process if modal is closed
    if (!isOpen) {
      console.log('Modal closed, skipping audio processing');
      return;
    }
    
    try {
      setIsTutorSpeaking(true);
      
      // Create FormData for the request
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-message.webm');
      formData.append('session_id', sessionId);
      formData.append('tutor_id', tutorId);
      
      // Make the voice chat request using the API client
      const response = await api.post('/api/audio/voice-chat', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const result = response.data;
      
      // Check again if modal is still open before playing audio
      if (!isOpen) {
        console.log('Modal closed during processing, not playing audio');
        return;
      }
      
      if (result.success) {
        // Play the AI response audio
        await playAudioResponse(
          result.response_text, 
          result.audio_data, 
          result.use_browser_tts
        );
        
        // Call the onSendMessage callback to update the chat
        onSendMessage(result.response_text);
      } else {
        throw new Error(result.error || 'Voice chat failed');
      }
      
    } catch (error) {
      console.error('Error processing voice message:', error);
      // You might want to show an error message to the user here
    } finally {
      if (isOpen) {
      setIsTutorSpeaking(false);
    }
    }
  };

  // Play the AI response as audio with better control
  const playAudioResponse = async (text: string, audioData?: string, useBrowserTTS: boolean = false) => {
    // Don't play audio if modal is closed
    if (!isOpen) {
      console.log('Modal closed, not playing audio response');
      return;
    }
    
    try {
      if (audioData && !useBrowserTTS) {
        // Use ElevenLabs audio data from the backend
        const audioBytes = atob(audioData);
        const audioArray = new Uint8Array(audioBytes.length);
        for (let i = 0; i < audioBytes.length; i++) {
          audioArray[i] = audioBytes.charCodeAt(i);
        }
        
        const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        audio.volume = 0.8; // Set reasonable volume
        
        await new Promise((resolve, reject) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            resolve(true);
          };
          audio.onerror = reject;
          audio.play().catch(reject);
        });
      } else {
        // Fallback to browser speech synthesis if ElevenLabs fails
        if ('speechSynthesis' in window) {
          // Cancel any existing speech
          speechSynthesis.cancel();
          
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          utterance.pitch = 1;
          utterance.volume = 0.8;
          
          // Try to use a more natural voice if available
          const voices = speechSynthesis.getVoices();
          const preferredVoice = voices.find(voice => 
            voice.lang.includes('en') && voice.name.includes('Google')
          ) || voices.find(voice => voice.lang.includes('en'));
          
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
          
          await new Promise((resolve, reject) => {
            utterance.onend = resolve;
            utterance.onerror = reject;
            speechSynthesis.speak(utterance);
          });
        }
      }
    } catch (error) {
      console.error('Error playing audio response:', error);
    }
  };

  // Set up silence detection for better recording control
  const setupSilenceDetection = (stream: MediaStream) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    microphone.connect(analyser);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const checkAudioLevel = () => {
      if (!isRecording) return;
      
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      const audioLevel = average / 255;
      
      if (audioLevel > 0.1) {
        // Sound detected, reset silence timer
        lastAudioLevelRef.current = audioLevel;
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        silenceTimeoutRef.current = setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }, 2000); // Stop after 2 seconds of silence
      }
      
      if (isRecording) {
        requestAnimationFrame(checkAudioLevel);
      }
    };
    
    checkAudioLevel();
  };

  // Stop recording
  const stopRecording = () => {
    console.log('Stopping recording...');
    
    // Clear timeouts
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    // Stop media recorder
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    
    // Stop all tracks
      if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
        streamRef.current = null;
      }
    
    setIsRecording(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 relative">
        {/* Cancel Button at the top */}
        <button
          onClick={() => {
            stopRecording();
            stopAllAudio();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label="Close voice chat"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Voice Chat with {tutorName}
          </h3>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            {isRecording ? 'Listening...' : isTutorSpeaking ? 'Tutor is speaking...' : 'Voice chat will start automatically'}
          </p>
        </div>

        {/* Voice Interface */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative flex items-center justify-center mb-6" style={{ width: 'min(280px, 60vw)', height: 'min(280px, 60vw)' }}>
            {/* Animated SVG Waveform */}
            <svg width="100%" height="100%" viewBox="0 0 280 280" className="absolute top-0 left-0">
              <defs>
                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00eaff" />
                  <stop offset="100%" stopColor="#ff00ea" />
                </linearGradient>
              </defs>
              <circle
                cx="140"
                cy="140"
                r="120"
                fill="none"
                stroke="url(#waveGradient)"
                strokeWidth={isTutorSpeaking ? 10 : 5}
                strokeDasharray="25 10 10 10 20 10 10 10"
                strokeDashoffset={isTutorSpeaking ? 0 : 35}
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 140 140"
                  to="360 140 140"
                  dur={isTutorSpeaking ? "1s" : "3s"}
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
            
            {/* Tutor Avatar in the center */}
            <div className="rounded-full overflow-hidden shadow-lg border-4 border-white dark:border-gray-900" style={{ width: 'min(180px, 40vw)', height: 'min(180px, 40vw)', zIndex: 2, background: '#222' }}>
              {tutorAvatarUrl ? (
                <img
                  src={tutorAvatarUrl}
                  alt={tutorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                  <span className="text-4xl font-bold text-gray-500">👤</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center space-x-2 mb-6">
            {isRecording && (
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-base font-medium">Recording</span>
              </div>
            )}
            {isTutorSpeaking && (
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-base font-medium">Tutor Speaking</span>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isRecording 
              ? 'Speak clearly into your microphone' 
              : isTutorSpeaking 
                ? 'Please wait while the tutor responds' 
                : 'Voice chat will start automatically'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceChat; 