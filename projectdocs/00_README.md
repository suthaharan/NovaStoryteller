# Project Documentation

This folder contains project-specific documentation and markdown files.

**Note**: This folder is excluded from git commits (see `.gitignore`).

## Documentation Index

### 📋 [02_IMPLEMENTATION.md](./02_IMPLEMENTATION.md)
Complete implementation guide including:
- Project overview and user management system
- Application features and flow
- **Amazon Nova integration step-by-step guide**
- Database schema
- API endpoints
- Frontend components
- Implementation phases

### 🚀 [01_QUICK_START.md](./01_QUICK_START.md)
Quick reference guide with:
- Simple application flow
- Amazon Nova setup checklist
- Environment variables
- Key features overview
- Development workflow
- Testing instructions
- Common issues and solutions

### 🔄 [03_APPLICATION_FLOW.md](./03_APPLICATION_FLOW.md)
Detailed application flow diagrams including:
- User journey (Registration, Login, Story Creation, Listening)
- Superadmin flow
- Data flow diagrams
- State management
- Error handling
- Key user interactions

### 🧪 [04_BACKEND_TESTING.md](./04_BACKEND_TESTING.md)
Comprehensive step-by-step backend testing guide:
- Environment setup and configuration
- Database setup and migrations
- API endpoint testing
- Nova service testing
- File upload testing
- Error handling verification
- Complete testing checklist

### ✅ [05_QUICK_TEST_CHECKLIST.md](./05_QUICK_TEST_CHECKLIST.md)
Quick reference test checklist:
- Pre-flight checks
- Quick test commands
- Automated test script usage
- Common issues and solutions

### 🎤 [07_NOVA_SONIC_FEATURES.md](./07_NOVA_SONIC_FEATURES.md)
### 🎯 [20_NOVA_SONIC_2_FEATURES.md](./20_NOVA_SONIC_2_FEATURES.md) - **NEW**: Nova Sonic 2 Feature Suggestions & Implementation Plan
### 🎨 [21_VOICE_STORYTELLING_UI_DESIGN.md](./21_VOICE_STORYTELLING_UI_DESIGN.md) - **NEW**: Interactive Voice Storytelling UI/UX Design & Integration Plan
### 🚀 [22_VOICE_FEATURE_SETUP.md](./22_VOICE_FEATURE_SETUP.md) - **NEW**: Interactive Voice Storytelling Setup & Installation Guide
### 🔌 [23_WEBSOCKET_SETUP.md](./23_WEBSOCKET_SETUP.md) - **NEW**: WebSocket Setup Guide (Required for Voice Feature)
Nova 2 Sonic features and capabilities:
- Core capabilities and features
- Implementation approaches
- Hybrid approach details
- Use cases for storytelling

### 🏗️ [06_FRONTEND_BUILD.md](./06_FRONTEND_BUILD.md)
Frontend build and deployment guide:
- Quick build steps
- Manual build process
- Development vs production builds
- Troubleshooting
- CI/CD integration
- Best practices

### 📖 [18_PROJECT_STORY.md](./18_PROJECT_STORY.md)
Project story and development journey:
- Inspiration and vision
- What the application does
- How we built it (technical stack)
- Challenges encountered and solutions
- Accomplishments
- Lessons learned
- Future roadmap

### ☁️ [19_AWS_ARCHITECTURE.md](./19_AWS_ARCHITECTURE.md)
AWS Services Architecture and Data Flow Diagrams:
- Complete architecture diagram showing AWS service integration
- Story creation flow
- Scene generation flow
- Audio generation flow
- Image analysis flow
- AWS service details (Nova 2 Lite, Titan Embeddings, Titan Image Generator, Polly)
- Cost estimation
- Security & permissions
- Error handling

## Quick Links

### For Developers
- Start with [02_IMPLEMENTATION.md](./02_IMPLEMENTATION.md) for complete setup
- Use [01_QUICK_START.md](./01_QUICK_START.md) as a reference
- **Test backend**: Follow [04_BACKEND_TESTING.md](./04_BACKEND_TESTING.md) before frontend development
- Review [03_APPLICATION_FLOW.md](./03_APPLICATION_FLOW.md) for understanding user flows

### For Amazon Nova Setup
1. Follow the **Step-by-Step Amazon Nova Integration** section in [02_IMPLEMENTATION.md](./02_IMPLEMENTATION.md)
2. Complete the checklist in [01_QUICK_START.md](./01_QUICK_START.md)
3. Test integration: `python scripts/test_nova.py`

## Project Structure

```
projectdocs/
├── 00_README.md                  # This file (documentation index)
├── 01_QUICK_START.md             # Quick reference guide
├── 02_IMPLEMENTATION.md          # Complete implementation guide
├── 03_APPLICATION_FLOW.md        # Application flow diagrams
├── 04_BACKEND_TESTING.md         # Backend testing guide
├── 05_QUICK_TEST_CHECKLIST.md    # Quick test checklist
├── 06_FRONTEND_BUILD.md          # Frontend build and deployment guide
├── 07_NOVA_SONIC_FEATURES.md     # Nova 2 Sonic features
├── 08_AWS_PERMISSIONS.md         # AWS permissions guide
├── 09_AUDIO_DEBUG_GUIDE.md       # Audio debugging guide
├── 10_AUDIO_DEBUG_QUICK_REFERENCE.md  # Quick audio debug reference
├── 11_AUDIO_TROUBLESHOOTING.md   # Audio troubleshooting guide
├── 12_AUDIO_FIX_AND_PLAYLIST.md  # Audio fix and playlist features
├── 13_STORAGE_STRUCTURE.md       # Storage structure documentation
├── 14_POLLY_VOICES.md            # Polly voices documentation
├── 15_MENU_STRUCTURE.md          # Menu structure documentation
├── 16_SEEDER_INFO.md             # Seeder information
├── 17_IMPLEMENTATION_STATUS.md   # Implementation status tracking
├── 18_PROJECT_STORY.md           # Project story and development journey
└── 19_AWS_ARCHITECTURE.md        # AWS Services Architecture and Data Flow Diagrams
```

## Key Concepts

### User Roles
- **Superadmin**: Manages all users via Django Admin (`/admin/`)
- **Regular Users**: Register, login, create and manage their own stories

### Story Creation Flow
1. User chooses template (Adventure, Fantasy, Sci-Fi, Mystery, Educational)
2. User enters prompt (voice or text) and optionally uploads image
3. Backend calls Amazon Nova:
   - Analyzes image (if provided) using Titan Embeddings
   - Generates story using Nova 2 Lite
   - Synthesizes speech using Nova 2 Sonic
4. Story is saved with audio file
5. User can play, edit, or delete story

### Amazon Nova Integration
- **Nova 2 Lite**: Story generation and text completion
- **Nova 2 Sonic**: Text-to-speech synthesis
- **Titan Embeddings**: Image analysis and description

## Next Steps

1. ✅ Review implementation documentation
2. ✅ Set up AWS Bedrock access
3. ✅ Configure Amazon Nova integration
4. ✅ Implement Story model and API endpoints
5. ✅ Build frontend components
6. ✅ Test end-to-end flow

---

**Last Updated**: See individual documentation files for update dates.
