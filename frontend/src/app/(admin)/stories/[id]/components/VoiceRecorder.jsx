import { useState, useRef, useEffect } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const VoiceRecorder = ({ onRecordingStart, onRecordingStop, onRecordingError, disabled, isListening }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const isVisualizingRef = useRef(false);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      isVisualizingRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Stop stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Close audio context for visualization
      if (audioContextRef.current) {
        try {
          const state = audioContextRef.current.state;
          if (state !== 'closed' && state !== 'closing') {
            audioContextRef.current.close().catch(() => {
              // Ignore errors when closing
            });
          }
        } catch (error) {
          // Ignore errors if already closed
        }
        audioContextRef.current = null;
      }
      
      // Stop recording if still active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          // Ignore errors
        }
      }
      
      setIsRecording(false);
      setAudioLevel(0);
    };
  }, []);

  const startRecording = async () => {
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000, // Nova Sonic requires 16kHz
          channelCount: 1,   // Mono
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      streamRef.current = stream;

      // Close existing audio context if any
      if (audioContextRef.current) {
        try {
          if (audioContextRef.current.state !== 'closed' && audioContextRef.current.state !== 'closing') {
            await audioContextRef.current.close();
          }
        } catch (error) {
          // Ignore errors
        }
      }

      // Set up audio context for visualization
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Start visualization
      isVisualizingRef.current = true;
      const visualize = () => {
        if (!analyserRef.current || !isVisualizingRef.current) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        
        if (isVisualizingRef.current) {
          animationFrameRef.current = requestAnimationFrame(visualize);
        }
      };
      visualize();

      // Set up MediaRecorder - try different MIME types for browser compatibility
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/ogg;codecs=opus';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Use browser default
          }
        }
      }

      const options = mimeType ? { mimeType } : {};
      mediaRecorderRef.current = new MediaRecorder(stream, options);

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        // Stop visualization
        isVisualizingRef.current = false;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        // Stop stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Close visualization audio context
        if (audioContextRef.current) {
          try {
            if (audioContextRef.current.state !== 'closed' && audioContextRef.current.state !== 'closing') {
              await audioContextRef.current.close();
            }
          } catch (error) {
            // Ignore errors
          }
          audioContextRef.current = null;
        }
        
        // Wait longer to ensure all data chunks are collected
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check if we have any audio chunks
        if (audioChunksRef.current.length === 0) {
          console.warn('No audio chunks collected during recording');
          if (onRecordingError) {
            onRecordingError(new Error('No audio was recorded. Please check your microphone permissions and try again.'));
          }
          setIsRecording(false);
          setAudioLevel(0);
          audioChunksRef.current = [];
          return;
        }
        
        // Convert to PCM format for Nova Sonic
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorderRef.current.mimeType || 'audio/webm' 
        });
        
        console.log(`Audio blob created: ${audioBlob.size} bytes, type: ${audioBlob.type}, chunks: ${audioChunksRef.current.length}`);
        
        if (audioBlob.size === 0) {
          console.warn('Audio blob is empty');
          if (onRecordingError) {
            onRecordingError(new Error('Recorded audio is empty. Please try again.'));
          }
          setIsRecording(false);
          setAudioLevel(0);
          audioChunksRef.current = [];
          return;
        }
        
        const pcmAudio = await convertToPCM(audioBlob);
        
        if (onRecordingStop && pcmAudio) {
          onRecordingStop(pcmAudio);
        } else if (!pcmAudio) {
          console.warn('Failed to convert audio to PCM');
          if (onRecordingError) {
            onRecordingError(new Error('Failed to process audio. Please try again.'));
          }
        }
        
        setIsRecording(false);
        setAudioLevel(0);
        audioChunksRef.current = [];
      };

      // Start recording with frequent data collection
      mediaRecorderRef.current.start(100); // Collect data every 100ms for better reliability
      setIsRecording(true);
      
      if (onRecordingStart) {
        onRecordingStart();
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      if (onRecordingError) {
        onRecordingError(error);
      }
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        // Request final data chunk before stopping
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
        }
        // Small delay to ensure data is collected
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        }, 50);
      } catch (error) {
        console.error('Error stopping recording:', error);
        setIsRecording(false);
        setAudioLevel(0);
      }
    }
  };

  const convertToPCM = async (audioBlob) => {
    try {
      if (!audioBlob || audioBlob.size === 0) {
        console.warn('Empty audio blob, cannot convert to PCM');
        return null;
      }

      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Try to decode audio - handle different formats
      let audioContext;
      let audioBuffer;
      
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      } catch (decodeError) {
        // If decodeAudioData fails, try creating a new context with different sample rate
        console.warn('First decode attempt failed, trying alternative method:', decodeError);
        try {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
          audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        } catch (secondError) {
          console.error('Unable to decode audio data. The browser may not support the audio format:', secondError);
          if (onRecordingError) {
            onRecordingError(new Error('Unable to decode audio. Please try a different browser or check microphone permissions.'));
          }
          return null;
        }
      }
      
      if (!audioBuffer || audioBuffer.length === 0) {
        console.warn('Decoded audio buffer is empty');
        return null;
      }
      
      // Resample to 16kHz if needed
      const targetSampleRate = 16000;
      let sourceSampleRate = audioBuffer.sampleRate;
      let resampledBuffer = audioBuffer;
      
      if (sourceSampleRate !== targetSampleRate) {
        // Simple resampling (linear interpolation)
        const ratio = sourceSampleRate / targetSampleRate;
        const newLength = Math.floor(audioBuffer.length / ratio);
        resampledBuffer = audioContext.createBuffer(1, newLength, targetSampleRate);
        const sourceData = audioBuffer.getChannelData(0);
        const targetData = resampledBuffer.getChannelData(0);
        
        for (let i = 0; i < newLength; i++) {
          const sourceIndex = i * ratio;
          const index = Math.floor(sourceIndex);
          const fraction = sourceIndex - index;
          
          if (index + 1 < sourceData.length) {
            targetData[i] = sourceData[index] * (1 - fraction) + sourceData[index + 1] * fraction;
          } else {
            targetData[i] = sourceData[index];
          }
        }
      }
      
      // Convert to 16-bit PCM (little-endian)
      const channelData = resampledBuffer.getChannelData(0);
      const pcmData = new Int16Array(channelData.length);
      
      for (let i = 0; i < channelData.length; i++) {
        const s = Math.max(-1, Math.min(1, channelData[i]));
        pcmData[i] = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7FFF);
      }
      
        // Clean up audio context
      if (audioContext) {
        try {
          if (audioContext.state !== 'closed') {
            await audioContext.close();
          }
        } catch (error) {
          // Ignore errors if already closed
          console.warn('AudioContext already closed during conversion:', error);
        }
      }
      
      return pcmData.buffer;
    } catch (error) {
      console.error('Error converting to PCM:', error);
      if (onRecordingError) {
        onRecordingError(error);
      }
      return null;
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isRecording && isListening) {
      startRecording();
    }
  };

  const handleMouseUp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRecording) {
      stopRecording();
    }
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    handleMouseDown();
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleMouseUp();
  };

  return (
    <div className="text-center">
      <div className="mb-3">
        <Button
          variant={isRecording ? 'danger' : 'primary'}
          size="lg"
          className="rounded-circle"
          style={{
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            boxShadow: isRecording ? '0 0 20px rgba(220, 53, 69, 0.5)' : '0 0 10px rgba(0, 123, 255, 0.3)',
            animation: isRecording ? 'pulse 1.5s infinite' : 'none'
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          disabled={disabled || !isListening || isRecording}
        >
          {isRecording ? (
            <Spinner size="sm" animation="border" variant="light" />
          ) : (
            <IconifyIcon icon="solar:microphone-bold-duotone" width={32} height={32} />
          )}
        </Button>
      </div>
      
      <p className="mb-2">
        {isRecording ? 'Recording... Release to send' : 'Hold to Speak'}
      </p>
      
      {/* Audio level visualization */}
      <div className="d-flex justify-content-center align-items-center gap-1 mb-2" style={{ height: '20px' }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '4px',
              height: `${Math.max(4, (audioLevel / 255) * 20)}px`,
              backgroundColor: isRecording ? '#dc3545' : '#6c757d',
              borderRadius: '2px',
              transition: 'height 0.1s ease'
            }}
          />
        ))}
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default VoiceRecorder;

