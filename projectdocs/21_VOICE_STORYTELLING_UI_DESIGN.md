# Interactive Voice Storytelling - UI/UX Design & Integration Plan

## Overview

This document outlines the complete UI/UX design and integration plan for **Feature 1: Interactive Voice Storytelling** using Nova 2 Sonic 2.

---

## User Experience Flow

### Scenario: User Listening to a Story with Voice Interaction

```
1. User opens story detail page
2. Clicks "Start Voice Session" button
3. Story begins narrating via Nova Sonic
4. User can:
   - Listen to narration
   - Click microphone to ask questions
   - See conversation history
   - Modify story in real-time
   - End session
```

---

## UI Component Design

### 1. Story Detail Page - Enhanced Audio Section

**Location**: `/stories/{id}/page.jsx`

**Current State**: Basic audio player with Play/Pause button

**Enhanced State**: Voice-enabled audio player with interactive controls

#### Visual Layout:

```
┌─────────────────────────────────────────────────────────────────┐
│  Story Narration - Interactive Voice Mode                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  [▶ Play] [⏸ Pause] [⏹ Stop]  [🎤 Voice Mode] [⚙️]    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Progress: [████████░░░░░░░░░░] 2:34 / 5:12            │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Voice Session Status: ● Active                          │  │
│  │  Listening: ● Ready  |  Speaking: ○                      │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  🎤 [Hold to Speak]                                      │  │
│  │  Tap to ask questions or modify the story                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Conversation History                                    │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │  📖 Story: "The brave knight entered the dark forest..." │  │
│  │  👤 You: "Why is the forest dark?"                       │  │
│  │  🤖 AI: "The forest is dark because it's nighttime..."   │  │
│  │  📖 Story: [continues from where it left off]           │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [End Voice Session]                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Structure

### 1. Main Component: `VoiceStoryPlayer.jsx`

**Location**: `frontend/src/app/(admin)/stories/[id]/components/VoiceStoryPlayer.jsx`

**Purpose**: Main container for voice-enabled story playback

**Props**:
```javascript
{
  story: Story object,
  audioUrl: string,
  onSessionStart: () => void,
  onSessionEnd: () => void,
  canEdit: boolean
}
```

**State Management**:
```javascript
{
  isVoiceSessionActive: boolean,
  isListening: boolean,
  isSpeaking: boolean,
  isPlaying: boolean,
  conversationHistory: Array<Message>,
  audioProgress: number,
  audioDuration: number,
  websocket: WebSocket | null
}
```

---

### 2. Voice Recording Component: `VoiceRecorder.jsx`

**Location**: `frontend/src/app/(admin)/stories/[id]/components/VoiceRecorder.jsx`

**Purpose**: Handle voice input recording and visualization

**Visual Design**:

```
┌─────────────────────────────────────────┐
│                                         │
│         ┌───────────────┐              │
│         │               │              │
│         │   🎤 Icon     │              │
│         │               │              │
│         └───────────────┘              │
│                                         │
│    [Hold to Speak]                     │
│                                         │
│    ┌─────────────────────────┐        │
│    │ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░ │        │
│    └─────────────────────────┘        │
│         Audio Level Indicator          │
│                                         │
│    Status: Listening...                │
│                                         │
└─────────────────────────────────────────┘
```

**Features**:
- Large, prominent microphone button
- Visual feedback (pulsing animation when recording)
- Audio level visualization (waveform)
- Status text ("Listening...", "Processing...", "Speaking...")
- Hold-to-record interaction
- Auto-stop after silence detection

**Props**:
```javascript
{
  onRecordingStart: () => void,
  onRecordingStop: (audioBlob: Blob) => void,
  onRecordingError: (error: Error) => void,
  disabled: boolean,
  isListening: boolean
}
```

---

### 3. Conversation History Component: `ConversationHistory.jsx`

**Location**: `frontend/src/app/(admin)/stories/[id]/components/ConversationHistory.jsx`

**Purpose**: Display conversation between user and AI during voice session

**Visual Design**:

```
┌─────────────────────────────────────────────────────────┐
│  Conversation History                    [Clear] [▼]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 📖 Story Narration                               │  │
│  │ "The brave knight entered the dark forest..."   │  │
│  │ 2:34 PM                                          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 👤 You                                            │  │
│  │ "Why is the forest dark?"                        │  │
│  │ 2:35 PM                                          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🤖 AI Response                                   │  │
│  │ "The forest is dark because it's nighttime     │  │
│  │  and the trees are very tall, blocking the      │  │
│  │  moonlight..."                                  │  │
│  │ 2:35 PM                                          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 📖 Story Continues                               │  │
│  │ "As the knight walked deeper into the forest..." │  │
│  │ 2:36 PM                                          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  [Scroll to bottom]                                     │
└─────────────────────────────────────────────────────────┘
```

**Message Types**:
- `story_narration`: Story text being narrated
- `user_question`: User's voice input (transcribed)
- `ai_response`: AI's spoken response (transcribed)
- `story_modification`: Story change notification
- `system_message`: System notifications

**Props**:
```javascript
{
  messages: Array<{
    type: 'story_narration' | 'user_question' | 'ai_response' | 'story_modification' | 'system_message',
    content: string,
    timestamp: Date,
    audioUrl?: string
  }>,
  onClear: () => void
}
```

---

### 4. Voice Session Controls: `VoiceSessionControls.jsx`

**Location**: `frontend/src/app/(admin)/stories/[id]/components/VoiceSessionControls.jsx`

**Purpose**: Control buttons for voice session

**Visual Design**:

```
┌─────────────────────────────────────────────────────────┐
│  Voice Session Controls                                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [▶ Start Voice Session]  [⏸ Pause]  [⏹ Stop]         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Session Status: ● Active                        │  │
│  │ Duration: 5:23                                   │  │
│  │ Interactions: 3                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  [⚙️ Settings]  [📊 Session Stats]  [❌ End Session]   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- Start/Stop voice session buttons
- Session status indicator
- Session statistics (duration, interactions)
- Settings button (voice selection, language, etc.)
- End session with confirmation

---

### 5. Audio Visualization Component: `AudioVisualizer.jsx`

**Location**: `frontend/src/app/(admin)/stories/[id]/components/AudioVisualizer.jsx`

**Purpose**: Visual feedback for audio playback and recording

**Visual Design**:

```
┌─────────────────────────────────────────────────────────┐
│  Audio Visualization                                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Story Narration:                                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Your Voice:                                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  AI Response:                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- Real-time waveform visualization
- Separate tracks for story, user voice, and AI response
- Color-coded (story: blue, user: green, AI: purple)
- Smooth animations

---

## Integration Points

### 1. Story Detail Page Integration

**File**: `frontend/src/app/(admin)/stories/[id]/page.jsx`

**Changes**:

```javascript
// Add new imports
import VoiceStoryPlayer from './components/VoiceStoryPlayer';
import { useState } from 'react';

// Add state for voice session
const [voiceSessionActive, setVoiceSessionActive] = useState(false);
const [conversationHistory, setConversationHistory] = useState([]);

// Replace existing audio section with:
{story.audio_url && (
  <VoiceStoryPlayer
    story={story}
    audioUrl={story.audio_url}
    onSessionStart={() => setVoiceSessionActive(true)}
    onSessionEnd={() => setVoiceSessionActive(false)}
    canEdit={canEdit}
  />
)}
```

---

### 2. Backend API Endpoints

**File**: `api/views.py`

**New Endpoints**:

```python
@action(detail=True, methods=['post'], url_path='start_voice_session')
def start_voice_session(self, request, pk=None):
    """Start a voice interaction session for a story."""
    # Create WebSocket session
    # Initialize Nova Sonic connection
    # Return session token and WebSocket URL

@action(detail=True, methods=['post'], url_path='voice_interaction')
def voice_interaction(self, request, pk=None):
    """Handle voice interaction during story narration."""
    # Process audio input
    # Send to Nova Sonic
    # Return audio response
    # Update story if modified

@action(detail=True, methods=['delete'], url_path='end_voice_session')
def end_voice_session(self, request, pk=None):
    """End voice interaction session."""
    # Close WebSocket connection
    # Save conversation history
    # Update story if modified
```

---

### 3. WebSocket Integration

**File**: `backend/routing.py` (new file)

**Purpose**: Handle WebSocket connections for bidirectional audio streaming

```python
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from api.consumers import VoiceStoryConsumer

application = ProtocolTypeRouter({
    "websocket": AuthMiddlewareStack(
        URLRouter([
            path("ws/stories/<uuid:story_id>/voice/", VoiceStoryConsumer.as_asgi()),
        ])
    ),
})
```

**File**: `api/consumers.py` (new file)

**Purpose**: WebSocket consumer for voice interactions

```python
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from api.nova_service import NovaService

class VoiceStoryConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.story_id = self.scope['url_route']['kwargs']['story_id']
        self.room_group_name = f'voice_story_{self.story_id}'
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Initialize Nova Sonic connection
        self.nova = NovaService()
        self.voice_session = await self.nova.start_sonic_conversation(
            system_prompt="You are a storyteller. Narrate the story and respond to questions."
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        # Close Nova Sonic connection
        if hasattr(self, 'voice_session'):
            await self.voice_session.close()

    async def receive(self, text_data):
        data = json.loads(text_data)
        
        if data['type'] == 'audio_input':
            # Process audio input
            audio_bytes = base64.b64decode(data['audio'])
            
            # Send to Nova Sonic
            response_audio = await self.nova.synthesize_speech_from_audio(
                audio_bytes,
                system_prompt="Respond to the user's question about the story."
            )
            
            # Send response back
            await self.send(text_data=json.dumps({
                'type': 'audio_output',
                'audio': base64.b64encode(response_audio).decode('utf-8')
            }))
```

---

## State Management

### Redux/Context Structure

**File**: `frontend/src/context/VoiceSessionContext.jsx` (new)

```javascript
import { createContext, useContext, useState, useCallback } from 'react';

const VoiceSessionContext = createContext();

export const VoiceSessionProvider = ({ children }) => {
  const [activeSession, setActiveSession] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [websocket, setWebsocket] = useState(null);

  const startSession = useCallback(async (storyId) => {
    // Initialize WebSocket connection
    // Start voice session
    // Update state
  }, []);

  const endSession = useCallback(async () => {
    // Close WebSocket connection
    // Save conversation history
    // Update state
  }, []);

  const sendAudio = useCallback(async (audioBlob) => {
    // Convert audio to base64
    // Send via WebSocket
    // Update conversation history
  }, []);

  return (
    <VoiceSessionContext.Provider value={{
      activeSession,
      conversationHistory,
      isListening,
      isSpeaking,
      websocket,
      startSession,
      endSession,
      sendAudio
    }}>
      {children}
    </VoiceSessionContext.Provider>
  );
};

export const useVoiceSession = () => useContext(VoiceSessionContext);
```

---

## User Interface Mockups

### Mobile View (Responsive)

```
┌─────────────────────────────┐
│  Story: The Brave Knight     │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │   [▶ Play] [🎤 Voice] │  │
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  Progress: 2:34/5:12  │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │      🎤                │  │
│  │  [Hold to Speak]       │  │
│  │                        │  │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓         │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ Conversation           │  │
│  ├───────────────────────┤  │
│  │ 📖 Story: "The brave  │  │
│  │    knight entered..."  │  │
│  │                        │  │
│  │ 👤 You: "Why dark?"   │  │
│  │                        │  │
│  │ 🤖 AI: "Because..."   │  │
│  └───────────────────────┘  │
│                             │
│  [End Session]              │
└─────────────────────────────┘
```

### Desktop View

```
┌─────────────────────────────────────────────────────────────────┐
│  Story: The Brave Knight                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Audio Controls                                            │  │
│  │  [▶ Play] [⏸ Pause] [⏹ Stop]  [🎤 Voice Mode] [⚙️]     │  │
│  │  Progress: [████████░░░░░░░░░░] 2:34 / 5:12              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────┐  ┌────────────────────────────────┐ │
│  │  Voice Recorder      │  │  Conversation History          │ │
│  │                      │  │                                │ │
│  │      ┌──────┐        │  │  📖 Story: "The brave knight  │ │
│  │      │  🎤  │        │  │     entered the dark forest"  │ │
│  │      └──────┘        │  │                                │ │
│  │                      │  │  👤 You: "Why is the forest   │ │
│  │  [Hold to Speak]     │  │     dark?"                    │ │
│  │                      │  │                                │ │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓       │  │  🤖 AI: "The forest is dark  │ │
│  │                      │  │     because it's nighttime"  │ │
│  │  Status: Listening   │  │                                │ │
│  │                      │  │  📖 Story: [continues...]     │ │
│  └──────────────────────┘  └────────────────────────────────┘ │
│                                                                 │
│  [End Voice Session]                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Interaction Patterns

### 1. Starting a Voice Session

```
User clicks "Start Voice Session"
    ↓
Show loading state
    ↓
Initialize WebSocket connection
    ↓
Connect to Nova Sonic
    ↓
Show "Voice Session Active" indicator
    ↓
Enable voice recording button
    ↓
Start story narration
```

### 2. Asking a Question During Narration

```
User holds microphone button
    ↓
Start recording (visual feedback)
    ↓
User speaks question
    ↓
Release button (stop recording)
    ↓
Show "Processing..." status
    ↓
Send audio to backend via WebSocket
    ↓
Backend sends to Nova Sonic
    ↓
Receive audio response
    ↓
Play response audio
    ↓
Add to conversation history
    ↓
Continue story narration
```

### 3. Modifying Story in Real-Time

```
User says: "Make it more exciting"
    ↓
Nova Sonic processes request
    ↓
Generate modified story segment
    ↓
Narrate modified segment
    ↓
Update story text in database
    ↓
Create revision entry
    ↓
Show notification: "Story modified"
    ↓
Continue with new narration
```

---

## Visual Design Specifications

### Colors

- **Primary**: `#007bff` (Bootstrap primary blue)
- **Success**: `#28a745` (Green for active/recording)
- **Danger**: `#dc3545` (Red for stop/end)
- **Warning**: `#ffc107` (Yellow for processing)
- **Info**: `#17a2b8` (Blue for information)

### Typography

- **Headings**: `font-weight: 600`, `font-size: 1.25rem`
- **Body**: `font-size: 1rem`, `line-height: 1.5`
- **Small text**: `font-size: 0.875rem`

### Spacing

- **Component padding**: `1rem` (16px)
- **Element spacing**: `0.5rem` (8px)
- **Section spacing**: `2rem` (32px)

### Icons

- **Microphone**: `solar:microphone-bold-duotone`
- **Play**: `solar:play-bold-duotone`
- **Pause**: `solar:pause-bold-duotone`
- **Stop**: `solar:stop-bold-duotone`
- **Settings**: `solar:settings-bold-duotone`

---

## Accessibility Considerations

1. **Keyboard Navigation**
   - All buttons accessible via keyboard
   - Tab order logical
   - Focus indicators visible

2. **Screen Reader Support**
   - ARIA labels for all interactive elements
   - Status announcements for state changes
   - Conversation history readable

3. **Visual Feedback**
   - High contrast colors
   - Clear status indicators
   - Loading states visible

4. **Error Handling**
   - Clear error messages
   - Retry options
   - Fallback to text-only mode

---

## Performance Considerations

1. **Audio Processing**
   - Stream audio in chunks (not full file)
   - Use Web Workers for audio processing
   - Compress audio before transmission

2. **WebSocket Management**
   - Reconnection logic for dropped connections
   - Heartbeat to keep connection alive
   - Queue messages if connection is down

3. **UI Responsiveness**
   - Debounce rapid button clicks
   - Show loading states immediately
   - Optimize re-renders with React.memo

---

## Testing Plan

### Unit Tests
- Voice recording component
- Audio visualization
- Conversation history
- WebSocket connection handling

### Integration Tests
- End-to-end voice session flow
- Audio transmission
- Story modification
- Error handling

### User Acceptance Tests
- Voice interaction during narration
- Question answering
- Story modification
- Session management

---

## Implementation Phases

### Phase 1: Basic Voice Session (Week 1-2)
- WebSocket infrastructure
- Basic voice recording
- Audio playback
- Simple conversation history

### Phase 2: Interactive Features (Week 3-4)
- Question answering
- Story modification
- Enhanced UI components
- Error handling

### Phase 3: Polish & Optimization (Week 5)
- Performance optimization
- Accessibility improvements
- UI/UX refinements
- Documentation

---

## Next Steps

1. **Review & Approval**: Get stakeholder approval on design
2. **Prototype**: Create clickable prototype
3. **Backend Setup**: Implement WebSocket infrastructure
4. **Frontend Development**: Build components incrementally
5. **Integration**: Connect frontend and backend
6. **Testing**: Comprehensive testing
7. **Deployment**: Gradual rollout

