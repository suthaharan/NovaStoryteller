# Amazon Nova 2 Sonic - Features & Capabilities

## Overview

Amazon Nova 2 Sonic is a **speech-to-speech** foundation model designed for real-time bidirectional audio streaming conversations. Unlike traditional text-to-speech, it enables natural voice interactions where users can speak and receive spoken responses.

## Core Capabilities

### 1. **Bidirectional Speech-to-Speech Conversations**
- **Input**: Audio at 16kHz sample rate (mono channel)
- **Output**: Audio at 24kHz sample rate
- **Real-time streaming**: Continuous audio flow in both directions
- **Model ID**: `amazon.nova-2-sonic-v1:0`

### 2. **Key Features**

#### Real-time Audio Interaction
- Users can speak naturally and receive spoken responses
- Low latency for conversational flow
- Handles interruptions gracefully

#### Contextual Awareness
- Maintains conversation context throughout a session
- Remembers previous exchanges in the conversation
- Can reference earlier parts of the conversation

#### Interruptible Responses
- Users can interrupt the model's speech with new input
- Model stops current response and pivots to new prompt
- Natural conversation flow

#### Multi-language Support
- **Languages**: English (US/UK), Spanish, French, German, Italian
- **Expressive Voices**: 11 voices including masculine and feminine voices
- **Voice Selection**: Different voices for different characters

#### Function Calling & RAG Support
- Can call external functions/tools
- Supports Retrieval Augmented Generation (RAG)
- Can access external knowledge bases

## API Implementation

### Required API
- **API**: `InvokeModelWithBidirectionalStream`
- **Not supported**: `converse_stream` or `converse` APIs
- **SDK Support**: Java, JavaScript, .NET, Rust, Swift, Python (experimental)

### Technical Requirements
- Audio input: 16kHz, mono, PCM format
- Audio output: 24kHz, PCM format
- Streaming: Bidirectional WebSocket-like connection
- Permissions: `bedrock:InvokeModel` and `bedrock:InvokeModelWithBidirectionalStream`

## Use Cases for Nova Storyteller

### 1. **Interactive Voice Storytelling**
- User speaks story prompts: "Tell me a story about a brave astronaut"
- Nova Sonic responds with spoken story narration
- User can interrupt: "Wait, make the astronaut have a pet robot!"
- Nova Sonic adapts and continues with new direction

### 2. **Real-time Story Adaptation**
- During story narration, user can voice modifications
- Model maintains story context while adapting
- Natural conversation flow without breaking immersion

### 3. **Character Voice Differentiation**
- Different voices for different story characters
- More engaging storytelling experience
- Natural dialogue between characters

### 4. **Language Learning Mode**
- Interactive conversations in target language
- Real-time pronunciation feedback
- Natural language practice

## Implementation Approach

### Option 1: Text-to-Audio-to-Speech Pipeline
1. Generate story text using Nova 2 Lite
2. Convert text to audio (using Web Speech API or simple TTS)
3. Send audio to Nova 2 Sonic for natural voice narration
4. Stream audio response back to user

### Option 2: Direct Voice Interaction
1. User speaks story prompt (Web Speech API → audio)
2. Send audio directly to Nova 2 Sonic
3. Nova Sonic processes and responds with spoken story
4. User can interrupt with voice modifications
5. Continuous bidirectional conversation

### Option 3: Hybrid Approach
1. Initial story generation: Text input → Nova 2 Lite → Story text
2. Story narration: Story text → Convert to audio → Nova 2 Sonic → Natural voice
3. Real-time modifications: Voice input → Nova 2 Sonic → Adapted story

## Features to Add

### 1. **Voice Story Creation**
- User speaks initial story prompt
- Nova Sonic responds with spoken story
- More natural than typing

### 2. **Real-time Story Interruptions**
- User can interrupt story narration with voice
- "Wait, make the character a girl instead!"
- Story adapts immediately

### 3. **Character Voice Selection**
- Different voices for different characters
- More engaging storytelling
- Character personality through voice

### 4. **Conversational Story Mode**
- Back-and-forth conversation about the story
- User asks questions: "What happens next?"
- Nova Sonic responds naturally

### 5. **Multi-language Storytelling**
- Stories in different languages
- Language learning support
- Natural pronunciation

### 6. **Voice-controlled Story Navigation**
- "Go back to the beginning"
- "Skip to the exciting part"
- "Tell me more about the character"

## Technical Implementation Notes

### Audio Format Conversion
- Web Audio API for browser audio capture
- Convert to 16kHz mono PCM for Nova Sonic
- Handle audio streaming in both directions

### WebSocket/Streaming Setup
- Bidirectional streaming connection
- Handle audio chunks in real-time
- Manage connection state

### Frontend Integration
- Web Speech API for voice input
- Web Audio API for audio playback
- Real-time audio streaming

### Backend API
- Endpoint for initiating Nova Sonic session
- WebSocket endpoint for bidirectional streaming
- Handle audio format conversion

## Benefits Over Text-to-Speech

1. **Natural Conversations**: Real bidirectional speech interaction
2. **Context Awareness**: Maintains conversation context
3. **Interruptions**: Natural handling of user interruptions
4. **Character Voices**: Multiple expressive voices
5. **Real-time Adaptation**: Immediate response to voice input
6. **Language Support**: Multiple languages with natural accents

## Limitations & Considerations

1. **API Complexity**: Requires `InvokeModelWithBidirectionalStream` (not standard REST)
2. **Audio Format**: Must handle audio conversion (16kHz input, 24kHz output)
3. **Streaming**: Requires WebSocket or similar bidirectional connection
4. **Python SDK**: Experimental support (may need to use other SDKs or direct API calls)
5. **Cost**: Streaming API may have different pricing than standard APIs

## Implementation Status

### Current Implementation (Hybrid Approach)
- ✅ Nova 2 Sonic model ID configured: `amazon.nova-2-sonic-v1:0`
- ✅ Text-to-audio conversion utility (`text_to_audio_pcm()`)
- ✅ PCM to WAV/MP3 conversion utilities
- ✅ `synthesize_speech_from_text()` - Hybrid approach implemented
- ✅ `synthesize_speech_from_audio()` - Direct audio input
- ✅ StoryViewSet integrated with hybrid approach
- ⏳ Full bidirectional streaming (requires WebSocket setup)
- ⏳ Real-time voice interruption handling

### Available Methods

1. **`synthesize_speech_from_audio(audio_bytes, ...)`**
   - Accepts audio bytes (16kHz, mono, PCM)
   - Returns audio output (24kHz, PCM)
   - Proper way to use Nova 2 Sonic

2. **`start_sonic_conversation(system_prompt, ...)`**
   - Sets up bidirectional streaming
   - For real-time voice conversations
   - Requires WebSocket implementation

3. **`synthesize_speech_from_text(text, ...)`**
   - Placeholder for text input
   - Requires text-to-audio conversion first
   - Will raise NotImplementedError until audio conversion is added

## Hybrid Approach Implementation (COMPLETED ✅)

The hybrid approach is now fully implemented:

### Flow:
1. **Story Generation**: Text input → Nova 2 Lite → Story text
2. **Text-to-Audio**: Story text → `text_to_audio_pcm()` → 16kHz PCM audio
3. **Nova Sonic Narration**: 16kHz PCM → Nova 2 Sonic → 24kHz PCM output
4. **Audio Storage**: 24kHz PCM → `pcm_to_mp3()` → MP3 file for playback

### Code Usage:
```python
from api.nova_service import NovaService

nova = NovaService()

# Generate story text
story_text = nova.generate_story(
    prompt="Tell me a story about a brave astronaut",
    template="adventure"
)

# Convert to speech using hybrid approach
audio_data = nova.synthesize_speech(story_text)
# Returns: 24kHz PCM audio (can be converted to MP3/WAV)
```

### Utilities Available:
- `text_to_audio_pcm(text, language, sample_rate)` - Convert text to 16kHz PCM
- `pcm_to_wav(pcm_data, sample_rate)` - Convert PCM to WAV format
- `pcm_to_mp3(pcm_data, sample_rate)` - Convert PCM to MP3 format

## Next Steps for Advanced Features

1. **WebSocket Endpoint** (for real-time voice modifications)
   - Create Django WebSocket endpoint for bidirectional streaming
   - Handle audio chunks in real-time
   - Manage connection state

2. **Frontend Integration**
   - Web Speech API for voice input capture
   - Web Audio API for audio playback
   - Real-time audio streaming to/from backend

3. **Voice Interruption Handling**
   - Detect user interruptions
   - Stop current audio playback
   - Process new input immediately

4. **Character Voice Selection**
   - Map different voices to story characters
   - Voice switching during narration
   - More engaging storytelling experience

