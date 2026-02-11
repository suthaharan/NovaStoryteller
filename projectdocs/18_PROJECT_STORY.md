# Nova Storyteller - Project Story

## Inspiration

We wanted to create a platform that empowers users to create personalized, AI-generated stories with rich narration. The goal was to combine the power of Amazon's Nova AI models with intuitive storytelling features, allowing users to craft unique narratives that can be listened to, shared, and managed. Whether for educational purposes, creative writing, or entertainment, we envisioned a tool that makes story creation accessible and engaging.

## What it does

Nova Storyteller is a full-stack web application for AI-powered story generation and management:

- **Story Creation**: Users provide a prompt and optional image, and the app generates a complete story using Amazon Nova 2 Lite
- **Image Integration**: Upload images that are analyzed using Amazon Titan Multimodal Embeddings, with descriptions seamlessly woven into the narrative
- **Audio Narration**: Stories are narrated using Amazon Polly's neural voices, with multiple voice options for personalization
- **Story Management**: 
  - Create, edit, and publish stories
  - Organize stories into playlists
  - Track listening sessions with detailed logs
  - View and restore story revision history
- **User Roles**: 
  - Regular users can create and manage their own stories
  - Admin users can view and manage all stories across the platform
- **Session Tracking**: Monitor story listening sessions with start/end times, duration, and completion status

Perfect for content creators, educators, parents, or anyone who wants to bring their ideas to life through AI-generated stories with professional narration.

## How we built it

- **Frontend**: 
  - React 18 with Vite for fast development and optimized builds
  - React Router for navigation
  - React Bootstrap for responsive UI components
  - Axios for API communication with request deduplication and caching
  - Context API for state management
  - Custom audio player with progress tracking

- **Backend**: 
  - Django 6.0 with Django REST Framework for robust API endpoints
  - MySQL database (with SQLite fallback) for data persistence
  - PyMySQL for database connectivity
  - Custom authentication system with role-based access control

- **Core AI Integration**:
  - **Amazon Nova 2 Lite** → Advanced reasoning for story generation and adaptation
  - **Amazon Titan Multimodal Embeddings** → Analyze and describe uploaded images
  - **Amazon Polly** → High-quality neural text-to-speech with multiple voice options
  - **AWS Bedrock** → Unified API for accessing Amazon AI models

- **Storage & Media**:
  - Organized media storage with year/month/story-id directory structure
  - Automatic audio format conversion (PCM to MP3)
  - Image and audio file management with proper path handling

- **Features**:
  - Story revision history with automatic versioning
  - Editable transcripts with revision restoration
  - Playlist management for organizing stories
  - Session logging for analytics
  - Voice selection and audio regeneration
  - Publish/unpublish workflow

- **Deployment**: 
  - Django static files integration
  - Frontend build automation with shell scripts
  - Environment-based configuration

## Challenges we ran into

- **Audio Quality Issues**: Initial attempts to upsample audio from 16kHz to 24kHz caused distortion and speed problems. **Solution**: Use Polly's native 16kHz output directly without resampling.

- **Database Migration Complexity**: Handling existing database states and removing legacy models required careful migration design with conditional SQL operations.

- **Frontend State Management**: Preventing infinite loops and duplicate API requests required implementing request deduplication, caching, and proper React hooks usage.

- **File Storage Organization**: Ensuring consistent file paths and handling missing files required refactoring the storage utility to group story assets by story ID.

- **Voice Selection Integration**: Adding voice selection required database migrations, API endpoints, and frontend UI updates while maintaining backward compatibility.

- **Revision History**: Implementing automatic revision creation on story edits required careful handling of update operations to avoid creating revisions on every save.

- **Audio File Replacement**: Ensuring old audio files are properly deleted when regenerating with new voices required careful path tracking and file system operations.

## Accomplishments that we're proud of

- **Complete Full-Stack Implementation**: Built a production-ready Django + React application with comprehensive features
- **Robust Audio System**: Integrated Amazon Polly with multiple voice options, proper format conversion, and reliable playback
- **Revision History**: Implemented automatic versioning system that allows users to track and restore previous story versions
- **User Experience**: Created an intuitive UI with role-based access control, proper error handling, and responsive design
- **Media Management**: Developed a clean storage structure that organizes all story assets (images, audio) in a logical hierarchy
- **API Design**: Built RESTful APIs with proper authentication, permissions, and error handling
- **Playlist Feature**: Added playlist functionality for organizing and sharing stories
- **Session Tracking**: Implemented comprehensive session logging for analytics and user insights

## What we learned

- **Sample Rate Matters**: Audio quality is critical - using the correct sample rate directly from the source avoids distortion and playback issues
- **Migration Strategy**: When refactoring models, conditional migrations with `RunSQL` are essential for handling existing database states
- **Request Optimization**: Implementing request deduplication and caching significantly improves frontend performance and user experience
- **Storage Organization**: Grouping related assets (images, audio) by story ID makes file management and cleanup much easier
- **Revision Tracking**: Automatic versioning requires careful consideration of when to create revisions vs. when to update existing content
- **Voice Selection**: Providing users with voice options enhances personalization but requires careful handling of audio regeneration and file replacement
- **Error Handling**: Comprehensive error handling and user feedback are crucial for AI-powered features that may take time to process

## What's next for Nova Storyteller

- **Real-time Voice Streaming**: Explore Amazon Nova 2 Sonic for bidirectional speech-to-speech interactions
- **Multi-language Support**: Leverage Polly's multilingual capabilities for stories in different languages
- **Story Templates**: Pre-built templates for different genres (adventure, fantasy, educational, etc.)
- **Sharing Features**: Allow users to share stories and playlists with others
- **Export Options**: Download stories as PDF, audio files, or text documents
- **Advanced Analytics**: Parent/educator dashboard with insights on story engagement, listening patterns, and learning progress
- **Collaborative Editing**: Multiple users working on the same story
- **Story Library**: Public library of community-created stories
- **Mobile App**: Native mobile applications for iOS and Android
- **Offline Mode**: Cache stories and audio for offline playback
- **AI Story Adaptation**: Real-time story modification based on user feedback or interruptions
- **Voice Cloning**: Custom voice options for personalized narration
- **Interactive Elements**: Add interactive choices or branching story paths

## Technical Stack Summary

- **Frontend**: React 18, Vite, React Router, React Bootstrap, Axios
- **Backend**: Django 6.0, Django REST Framework, MySQL/PyMySQL
- **AI Services**: Amazon Bedrock, Nova 2 Lite, Titan Multimodal Embeddings, Amazon Polly
- **Storage**: Django FileField with custom upload paths, organized media structure
- **Authentication**: Django authentication with role-based access control
- **Build Tools**: Vite, Django collectstatic, custom build scripts

## Project Status

✅ **Completed Features**:
- User authentication and role management
- Story creation with AI generation
- Image upload and analysis
- Audio narration with voice selection
- Story editing and revision history
- Playlist management
- Session tracking
- Publish/unpublish workflow
- Admin dashboard

🚧 **In Progress**:
- Real-time voice streaming
- Multi-language support
- Advanced analytics

📋 **Planned**:
- Story sharing and collaboration
- Export functionality
- Mobile applications
- Public story library

---

*Last Updated: February 2026*

