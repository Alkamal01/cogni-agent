import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  Trash
} from 'lucide-react';
import { Button } from '../shared';
import { useToast } from '../../hooks/useToast';

interface LiveRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onCancel?: () => void;
}

const LiveRecorder: React.FC<LiveRecorderProps> = ({
  onRecordingComplete,
  onCancel
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const { toast } = useToast();

  // Initialize audio recording
  const initializeRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;

      // Set up audio level monitoring
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        audioUrlRef.current = audioUrl;
        setHasRecording(true);
      };

      return true;
    } catch (error) {
      console.error('Error initializing recording:', error);
      toast({
        title: 'Recording Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'error'
      });
      return false;
    }
  };

  // Monitor audio levels
  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    setAudioLevel(average / 255);

    if (isRecording && !isPaused) {
      animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
    }
  };

  // Start recording
  const startRecording = async () => {
    const initialized = await initializeRecording();
    if (!initialized) return;

    setIsRecording(true);
    setIsPaused(false);
    setDuration(0);
    setHasRecording(false);
    
    mediaRecorderRef.current?.start(100); // Collect data every 100ms
    
    // Start duration timer
    intervalRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    // Start audio level monitoring
    monitorAudioLevel();

    toast({
      title: 'Recording Started',
      description: 'Your lecture is being recorded',
      variant: 'success'
    });
  };

  // Pause/Resume recording
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      monitorAudioLevel();
      toast({
        title: 'Recording Resumed',
        description: 'Your recording has been resumed',
        variant: 'success'
      });
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      toast({
        title: 'Recording Paused',
        description: 'Your recording has been paused',
        variant: 'warning'
      });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      // Clean up
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      streamRef.current?.getTracks().forEach(track => track.stop());
      audioContextRef.current?.close();
      
      setAudioLevel(0);
      
      toast({
        title: 'Recording Stopped',
        description: 'You can now preview or save your recording',
        variant: 'success'
      });
    }
  };

  // Play/Pause preview
  const togglePlayback = () => {
    if (!audioUrlRef.current) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrlRef.current);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Save recording
  const saveRecording = () => {
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      onRecordingComplete(audioBlob, duration);
    }
  };

  // Discard recording
  const discardRecording = () => {
    audioChunksRef.current = [];
    setHasRecording(false);
    setDuration(0);
    
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    setIsPlaying(false);
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="text-center">
        {/* Recording Status */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            {isRecording && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-3 h-3 bg-red-500 rounded-full"
              />
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isRecording 
                ? (isPaused ? 'Recording Paused' : 'Recording Live') 
                : hasRecording 
                  ? 'Recording Complete' 
                  : 'Ready to Record'
              }
            </h3>
          </div>
          
          {/* Duration */}
          <div className="text-2xl font-mono text-gray-600 dark:text-gray-400">
            {formatDuration(duration)}
          </div>
        </div>

        {/* Audio Level Indicator */}
        {isRecording && !isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-sm text-gray-500">Audio Level</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${audioLevel * 100}%` }}
                animate={{ width: `${audioLevel * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {!isRecording && !hasRecording && (
            <Button
              onClick={startRecording}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full"
            >
              <span className="text-lg">⚪</span>
              Start Recording
            </Button>
          )}

          {isRecording && (
            <>
              <Button
                onClick={togglePause}
                variant="outline"
                className="flex items-center gap-2 px-4 py-2 rounded-full"
              >
                {isPaused ? <span className="text-lg">▶</span> : <span className="text-lg">⏸</span>}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              
              <Button
                onClick={stopRecording}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full"
              >
                <span className="text-lg">⚪</span>
                Stop
              </Button>
            </>
          )}

          {hasRecording && (
            <>
              <Button
                onClick={togglePlayback}
                variant="outline"
                className="flex items-center gap-2 px-4 py-2 rounded-full"
              >
                {isPlaying ? <span className="text-lg">⏸</span> : <span className="text-lg">▶</span>}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              
              <Button
                onClick={saveRecording}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full"
              >
                <Check className="h-4 w-4" />
                Save
              </Button>
              
              <Button
                onClick={discardRecording}
                variant="outline"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-red-600 border-red-600 hover:bg-red-50"
              >
                <Trash className="h-4 w-4" />
                Discard
              </Button>
            </>
          )}
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="ghost"
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

export default LiveRecorder;
