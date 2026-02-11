# Nova 2 Sonic Bidirectional Streaming - JavaScript Implementation Guide

## Easiest Route: JavaScript AWS SDK v3 (Frontend Direct)

**Recommended Approach**: Use AWS SDK v3 for JavaScript directly in the React frontend to connect to Nova 2 Sonic's bidirectional streaming API.

### Why This is Easiest

1. ✅ **Official AWS SDK Support** - JavaScript SDK has better support for bidirectional streaming
2. ✅ **Direct Browser-to-AWS Connection** - No need to proxy through Django
3. ✅ **Lower Latency** - Direct connection reduces audio streaming delay
4. ✅ **Simpler Architecture** - Frontend handles audio, backend handles coordination
5. ✅ **Better Error Handling** - SDK handles retries, authentication, etc.

### Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │────────▶│  AWS Bedrock │         │   Django    │
│  (React)    │◀────────│  (Nova Sonic)│         │  (Backend)  │
│             │         │              │         │             │
│ - Record    │         │ Bidirectional│         │ - Session   │
│ - Play      │         │   Streaming  │         │   Management│
│ - AWS SDK   │         │              │         │ - Story Data│
└─────────────┘         └──────────────┘         └─────────────┘
     │                                              │
     └────────────────── WebSocket ────────────────┘
                    (Status/Coordination)
```

## Implementation Steps

### Step 1: Install AWS SDK v3

```bash
cd frontend
npm install @aws-sdk/client-bedrock-runtime
```

### Step 2: Create Nova Sonic Client Component

Create `frontend/src/services/novaSonicClient.js`:

```javascript
import { BedrockRuntimeClient, InvokeModelWithBidirectionalStreamCommand } from '@aws-sdk/client-bedrock-runtime';

class NovaSonicClient {
  constructor(region = 'us-east-1') {
    this.client = new BedrockRuntimeClient({
      region,
      credentials: {
        // Get from backend via secure endpoint
        accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY,
      },
    });
    this.modelId = 'amazon.nova-2-sonic-v1:0';
    this.eventStream = null;
  }

  /**
   * Start bidirectional streaming session
   */
  async startStream(systemPrompt, onAudioChunk, onTextChunk, onError) {
    try {
      const command = new InvokeModelWithBidirectionalStreamCommand({
        modelId: this.modelId,
        body: JSON.stringify({
          messages: [],
          system: [{ text: systemPrompt }],
          config: {
            textInput: { format: 'text' },
            audioOutput: {
              format: 'pcm',
              sampleRate: 24000,
              channels: 1,
            },
          },
        }),
        contentType: 'application/json',
        accept: 'application/json',
      });

      this.eventStream = await this.client.send(command);
      
      // Process incoming stream
      for await (const event of this.eventStream) {
        if (event.chunk) {
          const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
          
          // Handle audio output
          if (chunk.audio) {
            const audioBytes = Buffer.from(chunk.audio.bytes, 'base64');
            onAudioChunk(audioBytes);
          }
          
          // Handle text output
          if (chunk.text) {
            onTextChunk(chunk.text.text);
          }
        }
      }
    } catch (error) {
      onError(error);
    }
  }

  /**
   * Send audio input to stream
   */
  async sendAudio(audioBytes) {
    if (!this.eventStream) {
      throw new Error('Stream not started');
    }

    // Convert PCM audio to base64
    const audioBase64 = Buffer.from(audioBytes).toString('base64');
    
    // Send audio chunk
    await this.eventStream.write({
      audio: {
        format: 'pcm',
        source: {
          bytes: audioBase64,
        },
        sampleRate: 16000,
        channels: 1,
      },
    });
  }

  /**
   * Send text input to stream
   */
  async sendText(text) {
    if (!this.eventStream) {
      throw new Error('Stream not started');
    }

    await this.eventStream.write({
      text: text,
    });
  }

  /**
   * Close the stream
   */
  async close() {
    if (this.eventStream) {
      await this.eventStream.close();
      this.eventStream = null;
    }
  }
}

export default NovaSonicClient;
```

### Step 3: Secure Credential Handling

**IMPORTANT**: Never expose AWS credentials in frontend code!

**Option A: Backend Proxy (Recommended)**
- Create Django endpoint that returns temporary credentials
- Use AWS STS to generate temporary credentials
- Frontend uses temporary credentials

**Option B: Cognito Identity Pool**
- Use AWS Cognito for unauthenticated/authenticated access
- Frontend gets credentials from Cognito
- More secure, but requires Cognito setup

**Option C: Backend Proxy for API Calls**
- Frontend sends audio to Django
- Django proxies to AWS Bedrock
- More latency, but simpler security

### Step 4: Update VoiceStoryPlayer Component

Modify `VoiceStoryPlayer.jsx` to use Nova Sonic client:

```javascript
import { useState, useEffect, useRef } from 'react';
import NovaSonicClient from '@/services/novaSonicClient';
import VoiceRecorder from './VoiceRecorder';
import ConversationHistory from './ConversationHistory';

const VoiceStoryPlayer = ({ story, onSessionStart, onSessionEnd }) => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const novaClientRef = useRef(null);
  const audioContextRef = useRef(null);

  const startSession = async () => {
    try {
      // Get credentials from backend
      const creds = await httpClient.get('/api/aws-credentials/');
      
      // Initialize Nova Sonic client
      novaClientRef.current = new NovaSonicClient();
      novaClientRef.current.client.config.credentials = {
        accessKeyId: creds.data.accessKeyId,
        secretAccessKey: creds.data.secretAccessKey,
        sessionToken: creds.data.sessionToken, // If using STS
      };

      // Start stream
      const systemPrompt = `You are a storyteller narrating: ${story.title}`;
      
      await novaClientRef.current.startStream(
        systemPrompt,
        // onAudioChunk
        (audioBytes) => {
          playPCMAudio(audioBytes);
        },
        // onTextChunk
        (text) => {
          addMessage('ai_response', text);
        },
        // onError
        (error) => {
          console.error('Nova Sonic error:', error);
          toast.error('Voice session error');
        }
      );

      setIsActive(true);
      if (onSessionStart) onSessionStart();
    } catch (error) {
      console.error('Failed to start session:', error);
      toast.error('Failed to start voice session');
    }
  };

  const handleRecordingStop = async (pcmAudio) => {
    if (novaClientRef.current) {
      await novaClientRef.current.sendAudio(pcmAudio);
    }
  };

  const playPCMAudio = async (audioBytes, sampleRate = 24000) => {
    // Convert PCM to AudioBuffer and play
    // (existing implementation)
  };

  // ... rest of component
};
```

### Step 5: Create Backend Endpoint for Credentials (Optional)

If using Option A (Backend Proxy):

```python
# api/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
import boto3
from datetime import timedelta

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_aws_credentials(request):
    """Get temporary AWS credentials for frontend."""
    try:
        sts = boto3.client('sts')
        
        # Create temporary credentials (15 minutes)
        response = sts.get_session_token(
            DurationSeconds=900,
            Policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "bedrock:InvokeModel",
                        "bedrock:InvokeModelWithBidirectionalStream"
                    ],
                    "Resource": "arn:aws:bedrock:*::foundation-model/amazon.nova-2-sonic-v1:0"
                }]
            })
        )
        
        return JsonResponse({
            'accessKeyId': response['Credentials']['AccessKeyId'],
            'secretAccessKey': response['Credentials']['SecretAccessKey'],
            'sessionToken': response['Credentials']['SessionToken'],
            'expiration': response['Credentials']['Expiration'].isoformat(),
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
```

## Alternative: Backend Proxy Approach (Simpler Security)

If you prefer to keep credentials on the backend:

1. Frontend sends audio chunks to Django via WebSocket
2. Django proxies to AWS Bedrock using boto3
3. Django streams responses back to frontend

This is simpler for security but has higher latency.

## Comparison

| Approach | Pros | Cons | Latency |
|----------|------|------|---------|
| **Frontend Direct (JS SDK)** | ✅ Official SDK<br>✅ Low latency<br>✅ Direct connection | ⚠️ Credential management<br>⚠️ CORS setup | **Lowest** |
| **Backend Proxy** | ✅ Secure credentials<br>✅ Simple setup | ⚠️ Higher latency<br>⚠️ More server load | **Medium** |
| **Experimental Python SDK** | ✅ Backend control | ⚠️ Experimental<br>⚠️ May break | **Medium** |

## Recommendation

**Use Frontend Direct (JavaScript SDK)** with:
- Backend endpoint for temporary credentials (STS)
- Proper CORS configuration
- Error handling and reconnection logic

This gives you the best balance of:
- Low latency
- Official SDK support
- Reasonable security
- Simpler architecture

## Next Steps

1. Install AWS SDK v3: `npm install @aws-sdk/client-bedrock-runtime`
2. Create Nova Sonic client service
3. Update VoiceStoryPlayer to use client
4. Create backend credential endpoint (if needed)
5. Test bidirectional streaming

## References

- AWS SDK v3 JavaScript: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/
- Bedrock Runtime: https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_InvokeModelWithBidirectionalStream.html
- Nova Sonic Overview: https://docs.aws.amazon.com/ai/responsible-ai/nova-sonic/overview.html

