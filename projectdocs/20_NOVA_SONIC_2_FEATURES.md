# Nova 2 Sonic 2 - Feature Suggestions & Implementation Plan

## Current Status

### ❌ **Nova 2 Sonic is NOT Currently Being Used**

**Current Implementation:**
- ✅ Model ID configured: `amazon.nova-2-sonic-v1:0`
- ✅ Placeholder methods exist (`start_sonic_conversation`, `synthesize_speech_from_audio`)
- ❌ **Actually using Amazon Polly directly** for text-to-speech
- ❌ No bidirectional streaming implementation
- ❌ No real-time voice interaction features

**Code Evidence:**
- `api/nova_service.py`: `synthesize_speech()` uses Polly directly
- `api/views.py`: Audio generation calls `nova.synthesize_speech()` which uses Polly
- `start_sonic_conversation()` raises `NotImplementedError`

---

## Why Use Nova 2 Sonic 2?

### Key Advantages Over Polly:

1. **Bidirectional Speech-to-Speech**
   - Users can speak to the system and get spoken responses
   - Real-time conversational flow
   - Natural interruptions and context switching

2. **Contextual Awareness**
   - Maintains conversation context throughout a session
   - Remembers previous exchanges
   - Can reference earlier parts of the conversation

3. **Interruptible Responses**
   - Users can interrupt the narration with questions or requests
   - Model stops and pivots naturally
   - More interactive storytelling experience

4. **Multi-Character Voices**
   - Different voices for different characters in the story
   - More expressive and engaging narration
   - Better character differentiation

5. **Real-Time Story Adaptation**
   - Users can modify story direction mid-narration
   - Dynamic story generation based on voice input
   - Interactive storytelling experience

---

## Suggested Features to Implement

### 🎯 **Feature 1: Interactive Voice Storytelling**

**Description:**
Allow users to interact with stories using their voice. Users can ask questions, request changes, or interrupt the narration.

**User Flow:**
1. User starts a story session
2. Story begins narrating via Nova Sonic
3. User can speak: "Make it more exciting!" or "What happens next?"
4. Nova Sonic adapts the story in real-time
5. Story continues with modifications

**Implementation:**
- WebSocket endpoint for bidirectional audio streaming
- Frontend audio recording component
- Real-time audio processing pipeline
- Session management for conversation context

**API Endpoints:**
```
POST /api/stories/{id}/start_voice_session/
POST /api/stories/{id}/voice_interaction/
DELETE /api/stories/{id}/end_voice_session/
```

**Frontend Components:**
- Voice recording button
- Real-time audio playback
- Conversation history display
- Voice activity indicator

---

### 🎯 **Feature 2: Multi-Character Narration**

**Description:**
Use Nova Sonic's multiple voices to assign different voices to different characters in the story, making narration more engaging.

**User Flow:**
1. Story is generated with character names
2. System identifies characters in the story
3. Assigns different Nova Sonic voices to each character
4. Narration switches voices based on who's speaking

**Implementation:**
- Character detection in story text
- Voice assignment algorithm
- Multi-voice audio synthesis
- Audio mixing for character dialogue

**Example:**
```
Story: "The brave knight said, 'I will save the princess!' 
        The princess replied, 'Thank you, brave knight!'"

Narration:
- Knight's dialogue: Male voice (e.g., "Joey")
- Princess's dialogue: Female voice (e.g., "Joanna")
- Narrator: Neutral voice (e.g., "Matthew")
```

**API Endpoints:**
```
POST /api/stories/{id}/generate_multi_voice_audio/
GET /api/stories/{id}/character_voices/
POST /api/stories/{id}/assign_character_voice/
```

---

### 🎯 **Feature 3: Real-Time Story Modification**

**Description:**
Allow users to modify stories in real-time using voice commands while the story is being narrated.

**User Flow:**
1. Story is being narrated
2. User says: "Change the ending to be happy"
3. Nova Sonic processes the request
4. Story continues with modified ending
5. Previous version saved as revision

**Voice Commands:**
- "Make it more exciting"
- "Change the character's name to Alice"
- "Add a dragon to the story"
- "Make the ending happy/sad"
- "Go back to the previous part"

**Implementation:**
- Voice command recognition (via Nova Sonic)
- Story modification logic
- Real-time story regeneration
- Revision history tracking

**API Endpoints:**
```
POST /api/stories/{id}/voice_modify/
POST /api/stories/{id}/voice_command/
GET /api/stories/{id}/modification_history/
```

---

### 🎯 **Feature 4: Interactive Q&A During Story**

**Description:**
Users can ask questions about the story while it's being narrated, and Nova Sonic responds with contextual answers.

**User Flow:**
1. Story is narrating: "The brave knight entered the dark forest..."
2. User asks: "Why is the forest dark?"
3. Nova Sonic responds: "The forest is dark because it's nighttime and the trees are very tall..."
4. Story continues from where it left off

**Implementation:**
- Question detection in audio stream
- Context extraction from current story position
- Answer generation using Nova 2 Lite
- Seamless story continuation

**API Endpoints:**
```
POST /api/stories/{id}/ask_question/
GET /api/stories/{id}/qa_history/
```

---

### 🎯 **Feature 5: Voice-Controlled Playlist Creation**

**Description:**
Users can create playlists by speaking story titles or descriptions, and the system finds matching stories.

**User Flow:**
1. User says: "Create a playlist with adventure stories"
2. System searches for adventure stories
3. User says: "Add the story about the astronaut"
4. System finds and adds matching story
5. Playlist is created via voice commands

**Implementation:**
- Voice-to-text conversion for search queries
- Story search and matching
- Playlist management via voice
- Confirmation audio feedback

**API Endpoints:**
```
POST /api/playlists/voice_create/
POST /api/playlists/{id}/voice_add_story/
POST /api/playlists/{id}/voice_remove_story/
```

---

### 🎯 **Feature 6: Language Learning Mode**

**Description:**
Use Nova Sonic's multi-language support to help users learn new languages through interactive storytelling.

**User Flow:**
1. User selects target language (e.g., Spanish)
2. Story is narrated in Spanish
3. User can ask questions in English or Spanish
4. System responds in appropriate language
5. Translations and explanations provided

**Supported Languages:**
- English (US/UK)
- Spanish (es-ES)
- French (fr-FR)
- German (de-DE)
- Italian (it-IT)

**Implementation:**
- Language selection UI
- Multi-language story generation
- Language switching during narration
- Translation and learning aids

**API Endpoints:**
```
POST /api/stories/{id}/set_language/
POST /api/stories/{id}/translate_phrase/
GET /api/stories/{id}/language_learning_aids/
```

---

### 🎯 **Feature 7: Collaborative Storytelling**

**Description:**
Multiple users can contribute to a story in real-time using voice, creating collaborative narratives.

**User Flow:**
1. User A starts a story
2. User B joins the session
3. User B says: "And then a dragon appeared!"
4. Story continues with both users' contributions
5. Final story saved with all contributions

**Implementation:**
- Multi-user session management
- Voice identification
- Contribution tracking
- Real-time story merging

**API Endpoints:**
```
POST /api/stories/{id}/join_collaborative_session/
POST /api/stories/{id}/add_contribution/
GET /api/stories/{id}/collaborators/
```

---

## Implementation Priority

### Phase 1: Foundation (High Priority)
1. ✅ **WebSocket Infrastructure**
   - Set up WebSocket endpoint for bidirectional streaming
   - Audio encoding/decoding pipeline
   - Session management

2. ✅ **Basic Voice Interaction**
   - Start/stop voice sessions
   - Basic voice-to-text and text-to-speech
   - Simple Q&A during narration

### Phase 2: Enhanced Features (Medium Priority)
3. ✅ **Multi-Character Narration**
   - Character detection
   - Voice assignment
   - Multi-voice audio synthesis

4. ✅ **Real-Time Story Modification**
   - Voice command recognition
   - Story modification logic
   - Revision tracking

### Phase 3: Advanced Features (Lower Priority)
5. ✅ **Language Learning Mode**
   - Multi-language support
   - Translation features
   - Learning aids

6. ✅ **Collaborative Storytelling**
   - Multi-user sessions
   - Contribution tracking
   - Real-time merging

---

## Technical Requirements

### Backend Requirements:
1. **WebSocket Support**
   - Django Channels or similar
   - Bidirectional audio streaming
   - Session management

2. **Audio Processing**
   - 16kHz input (user speech)
   - 24kHz output (Nova Sonic response)
   - Real-time encoding/decoding

3. **Nova Sonic Integration**
   - `InvokeModelWithBidirectionalStream` API
   - Audio chunk processing
   - Error handling and reconnection

### Frontend Requirements:
1. **Audio Recording**
   - Browser MediaRecorder API
   - Real-time audio capture
   - Voice activity detection

2. **Audio Playback**
   - Streaming audio playback
   - Buffer management
   - Smooth playback

3. **UI Components**
   - Voice recording button
   - Audio visualization
   - Conversation history
   - Session controls

### AWS Permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithBidirectionalStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/amazon.nova-2-sonic-v1:0"
      ]
    }
  ]
}
```

---

## Cost Considerations

### Nova 2 Sonic Pricing:
- **Input**: ~$0.015 per 1,000 input characters
- **Output**: ~$0.06 per 1,000 output characters
- **Streaming**: Additional costs for bidirectional streaming

### Optimization Strategies:
1. **Caching**: Cache common responses
2. **Session Management**: Efficient session handling
3. **Audio Compression**: Optimize audio data transfer
4. **Rate Limiting**: Prevent abuse

---

## Next Steps

1. **Research & Planning**
   - Review AWS Nova Sonic 2 documentation
   - Design WebSocket architecture
   - Plan audio processing pipeline

2. **Proof of Concept**
   - Implement basic WebSocket endpoint
   - Test bidirectional streaming
   - Validate audio quality

3. **Feature Development**
   - Start with Phase 1 features
   - Iterate based on user feedback
   - Gradually add advanced features

4. **Testing & Optimization**
   - Performance testing
   - Audio quality testing
   - Cost optimization

---

## References

- [AWS Nova Sonic Documentation](https://docs.aws.amazon.com/ai/responsible-ai/nova-sonic/overview.html)
- [Bedrock Bidirectional Streaming](https://docs.aws.amazon.com/bedrock/latest/userguide/bidirectional-streaming.html)
- [Django Channels](https://channels.readthedocs.io/)
- [WebRTC for Audio Streaming](https://webrtc.org/)

