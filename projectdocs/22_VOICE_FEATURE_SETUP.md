# Interactive Voice Storytelling - Setup & Installation Guide

## Quick Setup

### 1. Install Dependencies

```bash
cd /Users/kurinchi/valet/novastoryteller
source venv/bin/activate
pip install channels
```

### 2. Restart Django Server

After installing `channels`, restart your Django server:

```bash
python manage.py runserver
```

The server should now start without the `ModuleNotFoundError: No module named 'channels'` error.

---

## Running the Server

### Development Mode (HTTP + WebSocket)

For development, Django's runserver handles both HTTP and WebSocket connections:

```bash
python manage.py runserver
```

### Production Mode (Using Daphne)

For production, use Daphne (ASGI server) instead of runserver:

```bash
pip install daphne
daphne -b 0.0.0.0 -p 8000 backend.asgi:application
```

---

## Testing the Feature

### 1. Start the Server

```bash
python manage.py runserver
```

### 2. Open a Story

1. Navigate to a story detail page (e.g., `http://localhost:8000/stories/{story-id}/`)
2. Ensure the story has content (story_text is not empty)

### 3. Start Voice Session

1. Scroll to the "Interactive Voice Storytelling" section
2. Click "Start Voice Session"
3. You should see:
   - WebSocket connection established
   - Voice recorder component appears
   - Conversation history panel appears

### 4. Test Voice Interaction

1. **Hold the microphone button** to record
2. Speak a question (e.g., "What happens next?")
3. Release the button to send
4. Wait for Nova Sonic 2 response
5. Audio should play back automatically

### 5. Test Story Narration

1. Click "Start Narration" button
2. Story should be narrated via Nova Sonic 2
3. Audio chunks stream in real-time

---

## Troubleshooting

### Error: `ModuleNotFoundError: No module named 'channels'`

**Solution**: Install channels:
```bash
pip install channels
```

### Error: WebSocket connection fails

**Check**:
1. Server is running with ASGI support
2. WebSocket URL is correct: `ws://localhost:8000/ws/stories/{story-id}/voice/`
3. Browser console for WebSocket errors
4. Django server logs for connection errors

### Error: Nova Sonic 2 API errors

**Check**:
1. AWS credentials are set correctly
2. IAM user has `bedrock:InvokeModelWithBidirectionalStream` permission
3. Nova 2 Sonic model is enabled in your AWS account
4. Check Django server logs for detailed error messages

### Error: Audio recording not working

**Check**:
1. Browser microphone permissions are granted
2. Browser console for MediaRecorder errors
3. Audio format conversion (PCM) is working

### Error: Audio playback not working

**Check**:
1. Browser supports Web Audio API
2. Audio context is created correctly
3. Sample rate matches (24kHz for Nova Sonic output)
4. Base64 audio decoding is working

---

## API Endpoints

### REST API

- `POST /api/stories/{id}/start_voice_session/`
  - Returns WebSocket URL for connection
  - Requires authentication
  - Returns: `{websocket_url, story_id, story_title}`

- `POST /api/stories/{id}/end_voice_session/`
  - Ends voice session (informational)
  - Requires authentication

### WebSocket

- `ws://localhost:8000/ws/stories/{story_id}/voice/`
  - Bidirectional WebSocket connection
  - Requires authentication (via session/cookie)
  - Handles:
    - `audio_input` - User voice input
    - `text_input` - User text input
    - `start_narration` - Start story narration
    - `stop_narration` - Stop narration

---

## WebSocket Message Format

### Client → Server

```json
{
  "type": "audio_input",
  "audio": "base64_encoded_audio_bytes"
}
```

```json
{
  "type": "text_input",
  "text": "User's text message"
}
```

```json
{
  "type": "start_narration"
}
```

### Server → Client

```json
{
  "type": "connection_established",
  "message": "Voice session started",
  "story_id": "uuid"
}
```

```json
{
  "type": "audio_output",
  "audio": "base64_encoded_audio_bytes",
  "sample_rate": 24000,
  "text": "Transcribed text (optional)"
}
```

```json
{
  "type": "processing",
  "message": "Processing your voice input..."
}
```

```json
{
  "type": "error",
  "message": "Error description"
}
```

---

## Architecture

### Backend Flow

```
WebSocket Connection
    ↓
VoiceStoryConsumer (Django Channels)
    ↓
NovaSonicStream (Nova 2 Sonic API)
    ↓
AWS Bedrock (InvokeModelWithBidirectionalStream)
    ↓
Audio Response (24kHz PCM)
    ↓
WebSocket → Frontend
```

### Frontend Flow

```
User Voice Input
    ↓
MediaRecorder (Browser API)
    ↓
Convert to PCM (16kHz)
    ↓
WebSocket → Backend
    ↓
Receive Audio Response
    ↓
Web Audio API Playback
```

---

## Next Steps

1. ✅ Install `channels` package
2. ✅ Restart Django server
3. ✅ Test WebSocket connection
4. ✅ Test voice recording
5. ✅ Test Nova Sonic 2 integration
6. ⚠️ Adjust Nova Sonic API structure if needed (based on actual AWS responses)
7. ⚠️ Optimize audio processing if needed
8. ⚠️ Add error handling improvements

---

## Notes

- **Development**: Using `InMemoryChannelLayer` (no Redis needed)
- **Production**: Consider using `channels-redis` for Redis-backed channel layer
- **Audio Format**: 
  - Input: 16kHz, mono, PCM (for Nova Sonic)
  - Output: 24kHz, mono, PCM (from Nova Sonic)
- **WebSocket**: Requires ASGI server (Daphne or Uvicorn for production)

