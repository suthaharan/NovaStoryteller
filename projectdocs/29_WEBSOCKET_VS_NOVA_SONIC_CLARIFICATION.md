# WebSocket vs Nova Sonic - Architecture Clarification

## Current Implementation: Hybrid Approach

### What We're Using WebSockets For

**WebSockets are STILL being used** for:
1. **Session Coordination** - Managing voice session lifecycle
2. **Status Updates** - Connection status, errors, system messages
3. **Fallback Audio Streaming** - If Nova Sonic fails, WebSocket handles audio
4. **Backend Communication** - Django backend coordination

### What We're Using Nova Sonic (Direct AWS) For

**Nova Sonic direct connection** is used for:
1. **Primary Audio Streaming** - Bidirectional speech-to-speech (when available)
2. **Real-time Audio Processing** - Direct browser-to-AWS connection
3. **Lower Latency** - Bypassing Django for audio streaming

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Frontend)                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐      ┌──────────────────┐     │
│  │  Nova Sonic      │      │   WebSocket       │     │
│  │  Client          │      │   Connection      │     │
│  │                  │      │                  │     │
│  │  - Audio Stream  │      │  - Session Mgmt  │     │
│  │  - Direct AWS    │      │  - Status Updates│     │
│  │  - Low Latency   │      │  - Fallback      │     │
│  └────────┬─────────┘      └────────┬─────────┘     │
│           │                          │                │
└───────────┼──────────────────────────┼──────────────┘
            │                          │
            │                          │
    ┌───────▼──────────┐      ┌───────▼──────────┐
    │   AWS Bedrock    │      │   Django Server  │
    │   (Nova Sonic)    │      │   (WebSocket)    │
    │                  │      │                  │
    │  - Audio Stream  │      │  - Session Data  │
    │  - Processing    │      │  - Coordination │
    └──────────────────┘      └──────────────────┘
```

## Current Flow

### When Starting a Voice Session:

1. **Frontend** → **Django** (HTTP): Get AWS credentials
2. **Frontend** → **Django** (HTTP): Start voice session, get WebSocket URL
3. **Frontend** → **AWS Bedrock** (Direct): Initialize Nova Sonic stream
4. **Frontend** ↔ **Django** (WebSocket): Connect for session coordination

### During Voice Interaction:

1. **User records audio** → **Nova Sonic Client** → **AWS Bedrock** (Direct)
2. **AWS Bedrock** → **Nova Sonic Client** → **Frontend** (Audio response)
3. **Frontend** ↔ **Django WebSocket** (Status updates, session management)

### Fallback Scenario:

If Nova Sonic fails:
- **Frontend** → **Django WebSocket** (Send audio)
- **Django** → **Polly** (Generate audio)
- **Django WebSocket** → **Frontend** (Audio response)

## Why Both?

### WebSocket (Django) - Still Needed For:
- ✅ Session management (start/end tracking)
- ✅ User authentication and authorization
- ✅ Story access control
- ✅ Session logging to database
- ✅ Status coordination
- ✅ Fallback when Nova Sonic unavailable

### Nova Sonic (Direct AWS) - Used For:
- ✅ Primary audio streaming (when available)
- ✅ Lower latency (direct connection)
- ✅ Better real-time performance
- ✅ Official AWS SDK support

## Answer: We're Using BOTH

**WebSockets are NOT being removed** - they serve a different purpose:
- **WebSocket** = Session management, coordination, fallback
- **Nova Sonic Direct** = Primary audio streaming (when available)

## Future Considerations

### Option 1: Keep Hybrid (Current)
- ✅ Best of both worlds
- ✅ Reliable fallback
- ✅ Session management
- ⚠️ More complex

### Option 2: Full Nova Sonic (Remove WebSocket)
- ✅ Simpler architecture
- ✅ Lower latency
- ❌ Lose session management
- ❌ No fallback

### Option 3: Full WebSocket (Remove Nova Sonic)
- ✅ Simpler
- ✅ Full control
- ❌ Higher latency
- ❌ More server load

## Recommendation

**Keep the hybrid approach** because:
1. WebSocket provides essential session management
2. Nova Sonic provides better audio streaming when available
3. Fallback ensures reliability
4. Best user experience

## Code Locations

### WebSocket Usage:
- `api/consumers.py` - WebSocket consumer
- `api/routing.py` - WebSocket routing
- `frontend/src/app/(admin)/stories/[id]/components/VoiceStoryPlayer.jsx` - WebSocket connection

### Nova Sonic Usage:
- `frontend/src/services/novaSonicClient.js` - Nova Sonic client
- `frontend/src/app/(admin)/stories/[id]/components/VoiceStoryPlayer.jsx` - Nova Sonic integration

Both are active and serve complementary purposes.

