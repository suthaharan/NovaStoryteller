import { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import VoiceRecorder from './VoiceRecorder';
import ConversationHistory from './ConversationHistory';
import httpClient from '@/helpers/httpClient';
import { toast } from 'react-toastify';
import NovaSonicClient from '@/services/novaSonicClient';

const VoiceStoryPlayer = ({ story, audioUrl, onSessionStart, onSessionEnd, canEdit, onSpeakingChange }) => {
  const [isVoiceSessionActive, setIsVoiceSessionActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [websocket, setWebsocket] = useState(null);
  const [audioQueue, setAudioQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const novaSonicClientRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (novaSonicClientRef.current) {
        novaSonicClientRef.current.close().catch(console.error);
        novaSonicClientRef.current = null;
      }
      if (websocket) {
        websocket.close();
      }
      if (audioContextRef.current) {
        // Check if AudioContext is not already closed before closing
        try {
          const state = audioContextRef.current.state;
          if (state !== 'closed' && state !== 'closing') {
            audioContextRef.current.close().catch(() => {
              // Ignore promise rejections
            });
          }
        } catch (error) {
          // Ignore errors if already closed
        }
        audioContextRef.current = null;
      }
    };
  }, [websocket]);

  const startVoiceSession = async () => {
    try {
      // Step 1: Get AWS credentials from backend
      console.log('Fetching AWS credentials...');
      const credsResponse = await httpClient.get('/aws-credentials/');
      const credentials = credsResponse.data;
      
      // Step 2: Try to initialize Nova Sonic client (may not be available)
      console.log('Attempting to initialize Nova Sonic client...');
      let novaSonicAvailable = false;
      
      try {
        const systemPrompt = `You are a storyteller narrating this story: ${story.title}. ` +
          `Respond to questions about the story naturally. ` +
          `If asked to modify the story, adapt it accordingly.`;
        
        novaSonicClientRef.current = new NovaSonicClient(credentials, credentials.region);
        
        // Try to start bidirectional stream
        await novaSonicClientRef.current.startStream(
          systemPrompt,
          // onAudioChunk - handle audio responses
          async (audioBytes) => {
            console.log('Received audio chunk:', audioBytes.byteLength, 'bytes');
            await playPCMAudio(audioBytes, 24000); // Nova Sonic outputs 24kHz
          },
          // onTextChunk - handle text responses
          (text) => {
            console.log('Received text chunk:', text);
            addMessage('ai_response', text);
          },
          // onError - handle errors gracefully
          (error) => {
            // Check if this is the "SDK not available" error - don't treat it as fatal
            if (error.code === 'SDK_NOT_AVAILABLE' || error.message.includes('SDK_NOT_AVAILABLE')) {
              console.log('Nova Sonic SDK not available, using WebSocket fallback');
              // Don't show error toast - this is expected
              // Continue with WebSocket connection below
            } else {
              console.error('Nova Sonic stream error:', error);
              // Only show error for unexpected issues
              toast.warning('Nova Sonic SDK streaming unavailable, using WebSocket fallback');
            }
          },
          // onComplete - handle completion
          () => {
            console.log('Nova Sonic stream completed');
            setIsSpeaking(false);
          }
        );
        
        // Check if stream is actually active
        novaSonicAvailable = novaSonicClientRef.current.isStreamActive();
      } catch (error) {
        console.log('Nova Sonic SDK initialization failed, using WebSocket fallback:', error.message);
        // Continue with WebSocket - this is expected
      }
      
      // Step 3: Connect to WebSocket (primary method or fallback)
      const response = await httpClient.post(`/stories/${story.id}/start_voice_session/`);
      let wsUrl = response.data.websocket_url.replace('http://', 'ws://').replace('https://', 'wss://');
      
      // Connect to WebSocket for audio streaming and session management
      console.log('Connecting to WebSocket:', wsUrl);
      if (novaSonicAvailable) {
        console.log('Using hybrid mode: Nova Sonic SDK + WebSocket coordination');
      } else {
        console.log('Using WebSocket mode: Full audio streaming via WebSocket');
      }
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsVoiceSessionActive(true);
        setIsListening(true);
        setWebsocket(ws);
        
        // Add system message
        addMessage('system_message', 'Voice session started. You can now interact with the story using your voice.');
        
        if (onSessionStart) {
          onSessionStart();
        }
      };
      
      ws.onmessage = async (event) => {
        try {
          // Check if message is binary (Blob/ArrayBuffer) or text (JSON)
          // IMPORTANT: Check Blob first, then ArrayBuffer, then string
          if (event.data instanceof Blob) {
            // Binary audio data (PCM) - convert to ArrayBuffer and play
            const arrayBuffer = await event.data.arrayBuffer();
            await playPCMAudio(arrayBuffer);
          } else if (event.data instanceof ArrayBuffer) {
            // ArrayBuffer audio data (PCM)
            await playPCMAudio(event.data);
          } else if (typeof event.data === 'string') {
            // Text message - parse as JSON
            try {
              const data = JSON.parse(event.data);
              await handleWebSocketMessage(data);
            } catch (parseError) {
              // If JSON parsing fails, it might be a string message
              console.warn('Failed to parse WebSocket message as JSON:', event.data);
              addMessage('system_message', `Received: ${event.data}`);
            }
          } else {
            // Unknown message type - log for debugging
            console.warn('Unknown WebSocket message type:', typeof event.data, event.data);
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          addMessage('system_message', `Error: ${error.message}`);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error('WebSocket connection error. Check console for details.');
        addMessage('system_message', 'WebSocket connection error. Please try again.');
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket disconnected', { code: event.code, reason: event.reason, wasClean: event.wasClean });
        setIsVoiceSessionActive(false);
        setIsListening(false);
        setWebsocket(null);
        
        // Add error message if connection was not clean
        if (!event.wasClean) {
          let errorMsg = 'WebSocket connection closed unexpectedly.';
          if (event.code === 4001) {
            errorMsg = 'Authentication failed. Please log in again.';
          } else if (event.code === 4003) {
            errorMsg = 'Permission denied. You do not have access to this story.';
          } else if (event.code === 4004) {
            errorMsg = 'Story not found.';
          }
          toast.error(errorMsg);
          addMessage('system_message', errorMsg);
        }
        
        if (onSessionEnd) {
          onSessionEnd();
        }
      };
      
      setWebsocket(ws);
    } catch (error) {
      console.error('Error starting voice session:', error);
      toast.error('Failed to start voice session');
    }
  };

  const endVoiceSession = async () => {
    // Close Nova Sonic stream
    if (novaSonicClientRef.current) {
      try {
        await novaSonicClientRef.current.close();
        console.log('Nova Sonic stream closed');
      } catch (error) {
        console.error('Error closing Nova Sonic stream:', error);
      }
      novaSonicClientRef.current = null;
    }
    
    // Close WebSocket
    if (websocket) {
      websocket.close();
    }
    
    // Notify backend
    try {
      await httpClient.post(`/stories/${story.id}/end_voice_session/`);
    } catch (error) {
      console.error('Error ending voice session:', error);
    }
    
    setIsVoiceSessionActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    if (onSpeakingChange) {
      onSpeakingChange(false);
    }
    setIsProcessing(false);
    setConversationHistory([]);
    
    if (onSessionEnd) {
      onSessionEnd();
    }
  };

  const handleWebSocketMessage = async (data) => {
    switch (data.type) {
      case 'connection_established':
        addMessage('system_message', data.message);
        break;
        
      case 'processing':
        setIsProcessing(true);
        break;
        
      case 'audio_output':
        setIsProcessing(false);
        setIsSpeaking(true);
        await playAudioResponse(data.audio, data.sample_rate);
        if (data.text) {
          addMessage('ai_response', data.text);
        }
        break;
        
      case 'text_output':
        setIsProcessing(false);
        addMessage('ai_response', data.text);
        break;
        
      case 'narration_started':
        addMessage('system_message', 'Starting story narration...');
        setIsSpeaking(true);
        if (onSpeakingChange) {
          onSpeakingChange(true);
        }
        break;
        
      case 'narration_text':
        // Text chunk from narration (for display)
        addMessage('ai_response', data.text);
        break;
        
      case 'narration_audio':
        await playAudioResponse(data.audio, data.sample_rate);
        break;
        
      case 'narration_complete':
        setIsSpeaking(false);
        if (onSpeakingChange) {
          onSpeakingChange(false);
        }
        addMessage('system_message', 'Story narration completed');
        break;
        
      case 'error':
        setIsProcessing(false);
        setIsSpeaking(false);
        toast.error(data.message);
        addMessage('system_message', `Error: ${data.message}`);
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const playPCMAudio = async (arrayBuffer, sampleRate = 16000) => {
    try {
      // Create audio context if not exists
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate });
      }
      
      // Convert PCM bytes to AudioBuffer
      const audioBytes = new Uint8Array(arrayBuffer);
      const numSamples = audioBytes.length / 2; // 16-bit = 2 bytes per sample
      const audioBuffer = audioContextRef.current.createBuffer(1, numSamples, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // Convert 16-bit PCM (little-endian) to float32 (-1.0 to 1.0)
      for (let i = 0; i < numSamples; i++) {
        const byteIndex = i * 2;
        // Little-endian 16-bit signed integer
        const sample = (audioBytes[byteIndex] | (audioBytes[byteIndex + 1] << 8));
        // Convert to signed (-32768 to 32767) then normalize to -1.0 to 1.0
        const signedSample = sample > 32767 ? sample - 65536 : sample;
        channelData[i] = signedSample / 32768.0;
      }
      
      // Play audio
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        // Only set speaking to false if queue is empty
        if (audioQueueRef.current.length === 0) {
          setIsSpeaking(false);
          if (onSpeakingChange) {
            onSpeakingChange(false);
          }
        }
      };
      
      source.start(0);
      setIsSpeaking(true);
      if (onSpeakingChange) {
        onSpeakingChange(true);
      }
    } catch (error) {
      console.error('Error playing PCM audio:', error);
      setIsSpeaking(false);
      if (onSpeakingChange) {
        onSpeakingChange(false);
      }
    }
  };

  const playAudioResponse = async (audioBase64, sampleRate = 24000) => {
    try {
      // Decode base64 audio
      const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
      
      // Create audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate });
      }
      
      // Convert PCM to AudioBuffer
      const audioBuffer = audioContextRef.current.createBuffer(1, audioBytes.length / 2, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // Convert 16-bit PCM to float32
      for (let i = 0; i < audioBytes.length; i += 2) {
        const sample = (audioBytes[i] | (audioBytes[i + 1] << 8)) / 32768.0;
        channelData[i / 2] = sample;
      }
      
      // Play audio
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setIsSpeaking(false);
        if (onSpeakingChange) {
          onSpeakingChange(false);
        }
      };
      
      source.start(0);
      setIsSpeaking(true);
      if (onSpeakingChange) {
        onSpeakingChange(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsSpeaking(false);
      if (onSpeakingChange) {
        onSpeakingChange(false);
      }
    }
  };

  const handleRecordingStart = () => {
    setIsListening(false);
  };

  const handleRecordingStop = async (pcmAudio) => {
    try {
      console.log('handleRecordingStop called with audio:', pcmAudio ? `${pcmAudio.byteLength} bytes` : 'null');
      
      if (!pcmAudio || pcmAudio.byteLength === 0) {
        console.warn('No audio data received from recorder');
        toast.warning('No audio was recorded. Please try again.');
        return;
      }
      
      // Check if Nova Sonic client is active (preferred method)
      if (novaSonicClientRef.current && novaSonicClientRef.current.isStreamActive()) {
        console.log('Sending audio to Nova Sonic...');
        await novaSonicClientRef.current.sendAudio(pcmAudio);
        addMessage('user_question', 'Voice input...');
        setIsProcessing(true);
        return;
      }
      
      // Fallback to WebSocket if Nova Sonic not available
      console.log('WebSocket state:', websocket ? `readyState=${websocket.readyState} (OPEN=${WebSocket.OPEN})` : 'null');
      
      if (!websocket) {
        console.error('WebSocket is null');
        toast.error('WebSocket connection not established. Please start the session again.');
        return;
      }
      
      if (websocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket not open. State:', websocket.readyState);
        toast.error(`WebSocket not ready (state: ${websocket.readyState}). Please start the session again.`);
        return;
      }
      
      console.log('Sending audio to WebSocket...');
      const audioArray = new Uint8Array(pcmAudio);
      console.log(`Audio array length: ${audioArray.length} bytes`);
      
      // Convert to base64
      let base64Audio;
      try {
        // Use a more reliable base64 encoding method
        const binaryString = String.fromCharCode.apply(null, audioArray);
        base64Audio = btoa(binaryString);
        console.log(`Base64 audio length: ${base64Audio.length} characters`);
      } catch (encodeError) {
        console.error('Error encoding audio to base64:', encodeError);
        toast.error('Failed to encode audio. Please try again.');
        return;
      }
      
      const message = {
        type: 'audio_input',
        audio: base64Audio
      };
      
      console.log('Sending WebSocket message:', { type: message.type, audioLength: base64Audio.length });
      websocket.send(JSON.stringify(message));
      
      console.log('Audio sent successfully to WebSocket');
      addMessage('user_question', 'Voice input...');
      setIsProcessing(true);
    } catch (error) {
      console.error('Error sending audio:', error);
      toast.error(`Failed to send audio: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const handleRecordingError = (error) => {
    console.error('Recording error:', error);
    toast.error('Failed to record audio. Please check microphone permissions.');
  };

  const startNarration = () => {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      toast.error('WebSocket not connected');
      return;
    }
    
    websocket.send(JSON.stringify({
      type: 'start_narration'
    }));
  };

  const addMessage = (type, content, audioUrl = null) => {
    const message = {
      type,
      content,
      timestamp: new Date().toISOString(),
      audioUrl
    };
    setConversationHistory(prev => [...prev, message]);
  };

  if (!canEdit) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          <IconifyIcon icon="solar:microphone-bold-duotone" width={20} height={20} className="me-2" />
          Interactive Voice Storytelling
        </h5>
        {!isVoiceSessionActive ? (
          <Button
            variant="success"
            size="sm"
            onClick={startVoiceSession}
          >
            <IconifyIcon icon="solar:play-bold-duotone" width={18} height={18} className="me-2" />
            Start Voice Session
          </Button>
        ) : (
          <Button
            variant="danger"
            size="sm"
            onClick={endVoiceSession}
          >
            <IconifyIcon icon="solar:stop-bold-duotone" width={18} height={18} className="me-2" />
            End Session
          </Button>
        )}
      </div>

      {isVoiceSessionActive ? (
        <div className="row">
          <div className="col-md-4 mb-3">
            <Card className="border">
              <Card.Body className="text-center">
                <VoiceRecorder
                  onRecordingStart={handleRecordingStart}
                  onRecordingStop={handleRecordingStop}
                  onRecordingError={handleRecordingError}
                  disabled={!isListening || isProcessing || isSpeaking}
                  isListening={isListening && !isProcessing && !isSpeaking}
                />
                
                <div className="mt-3">
                  <Badge bg={isListening ? 'success' : 'secondary'} className="me-2">
                    {isListening ? '● Listening' : '○ Ready'}
                  </Badge>
                  <Badge bg={isSpeaking ? 'info' : 'secondary'}>
                    {isSpeaking ? '● Speaking' : '○ Silent'}
                  </Badge>
                </div>
                
                {isProcessing && (
                  <div className="mt-2">
                    <Spinner size="sm" className="me-2" />
                    <small>Processing...</small>
                  </div>
                )}
                
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="mt-3"
                  onClick={startNarration}
                  disabled={isProcessing || isSpeaking}
                >
                  <IconifyIcon icon="solar:play-bold-duotone" width={16} height={16} className="me-2" />
                  Start Narration
                </Button>
              </Card.Body>
            </Card>
          </div>
          
          <div className="col-md-8">
            <ConversationHistory
              messages={conversationHistory}
              onClear={() => setConversationHistory([])}
            />
          </div>
        </div>
      ) : (
        <Alert variant="info">
          <IconifyIcon icon="solar:info-circle-bold-duotone" width={20} height={20} className="me-2" />
          Click "Start Voice Session" to begin interactive voice storytelling with Nova Sonic 2.
          You can ask questions, modify the story, and interact naturally using your voice.
        </Alert>
      )}
    </div>
  );
};

export default VoiceStoryPlayer;

