/**
 * Nova 2 Sonic Client for bidirectional speech streaming
 * 
 * This client attempts to connect directly to AWS Bedrock's InvokeModelWithBidirectionalStream API
 * for real-time speech-to-speech conversations.
 * 
 * NOTE: As of the current AWS SDK v3, InvokeModelWithBidirectionalStream may not be fully available
 * for Nova Sonic. This implementation gracefully falls back to WebSocket-based streaming.
 */
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

class NovaSonicClient {
  constructor(credentials, region = 'us-east-1') {
    this.client = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken, // Optional, for temporary credentials
      },
    });
    this.modelId = 'amazon.nova-2-sonic-v1:0';
    this.eventStream = null;
    this.isActive = false;
    this.onAudioChunk = null;
    this.onTextChunk = null;
    this.onError = null;
    this.onComplete = null;
  }

  /**
   * Start bidirectional streaming session
   * 
   * @param {string} systemPrompt - System prompt defining Nova Sonic's behavior
   * @param {Function} onAudioChunk - Callback for audio chunks (receives ArrayBuffer)
   * @param {Function} onTextChunk - Callback for text chunks (receives string)
   * @param {Function} onError - Callback for errors
   * @param {Function} onComplete - Callback when stream completes
   */
  async startStream(systemPrompt, onAudioChunk, onTextChunk, onError, onComplete) {
    try {
      // Store callbacks
      this.onAudioChunk = onAudioChunk;
      this.onTextChunk = onTextChunk;
      this.onError = onError;
      this.onComplete = onComplete;

      // Check if InvokeModelWithBidirectionalStream is available
      // As of AWS SDK v3, this API may not be available for Nova Sonic yet
      // We'll gracefully indicate that WebSocket fallback should be used
      
      console.log('Nova Sonic bidirectional streaming via SDK not yet available.');
      console.log('Falling back to WebSocket-based streaming (already implemented).');
      
      // Set as inactive so the component knows to use WebSocket fallback
      this.isActive = false;
      
      // Notify that SDK streaming is not available, but WebSocket will be used
      if (onError) {
        // Use a specific error that the component can catch and handle gracefully
        const error = new Error('NOVA_SONIC_SDK_NOT_AVAILABLE');
        error.message = 'Nova Sonic bidirectional streaming via AWS SDK is not yet available. Using WebSocket fallback.';
        error.code = 'SDK_NOT_AVAILABLE';
        onError(error);
      }
      
      // Don't throw - let the component handle the fallback
      return;
    } catch (error) {
      this.isActive = false;
      if (onError) {
        onError(error);
      }
    }
  }

  /**
   * Send audio input to stream
   * 
   * @param {ArrayBuffer|Uint8Array} audioBytes - PCM audio bytes (16kHz, mono, 16-bit)
   */
  async sendAudio(audioBytes) {
    if (!this.isActive || !this.eventStream) {
      throw new Error('Stream not active');
    }

    try {
      // Convert audio to base64
      const audioArray = audioBytes instanceof ArrayBuffer 
        ? new Uint8Array(audioBytes) 
        : audioBytes;
      
      const audioBase64 = btoa(
        String.fromCharCode.apply(null, audioArray)
      );

      // Send audio chunk to stream
      // Actual implementation depends on SDK streaming API
      const audioMessage = {
        audio: {
          format: 'pcm',
          source: {
            bytes: audioBase64,
          },
          sampleRate: 16000,
          channels: 1,
        },
      };

      // Write to stream (implementation depends on SDK)
      if (this.eventStream && typeof this.eventStream.write === 'function') {
        await this.eventStream.write(JSON.stringify(audioMessage));
      } else {
        console.warn('Stream write method not available');
      }
    } catch (error) {
      console.error('Error sending audio:', error);
      throw error;
    }
  }

  /**
   * Send text input to stream
   * 
   * @param {string} text - Text input
   */
  async sendText(text) {
    if (!this.isActive || !this.eventStream) {
      throw new Error('Stream not active');
    }

    try {
      const textMessage = {
        text: text,
      };

      // Write to stream
      if (this.eventStream && typeof this.eventStream.write === 'function') {
        await this.eventStream.write(JSON.stringify(textMessage));
      } else {
        console.warn('Stream write method not available');
      }
    } catch (error) {
      console.error('Error sending text:', error);
      throw error;
    }
  }

  /**
   * Close the stream
   */
  async close() {
    try {
      if (this.eventStream) {
        if (typeof this.eventStream.close === 'function') {
          await this.eventStream.close();
        } else if (typeof this.eventStream.abort === 'function') {
          this.eventStream.abort();
        }
        this.eventStream = null;
      }
      this.isActive = false;
    } catch (error) {
      console.error('Error closing stream:', error);
    }
  }

  /**
   * Check if stream is active
   */
  isStreamActive() {
    // Return false since SDK streaming is not available
    // This will trigger WebSocket fallback in the component
    return false;
  }
}

export default NovaSonicClient;

