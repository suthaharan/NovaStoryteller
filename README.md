# Nova Storyteller

## Overview
Nova Storyteller is a full-stack web application for AI-powered story generation and management. It uses Amazon's Nova AI models and AWS services to create personalized, narrated stories with rich multimedia features. Perfect for content creators, educators, parents, or anyone who wants to bring their ideas to life through AI-generated stories.

## Key Features

### 🎨 Story Generation & Management
- **AI-Powered Story Creation**: Generate stories using Amazon Nova 2 Lite based on user prompts
- **Story Templates**: Choose from 5 pre-defined templates (Adventure, Fantasy, Sci-Fi, Mystery, Educational)
- **Image Integration**: Upload images that are automatically analyzed using Amazon Titan Multimodal Embeddings and incorporated into stories
- **Story Regeneration**: Modify prompts and regenerate stories with new content
- **Story Revision History**: Track all edits with full revision history and ability to restore previous versions
- **Publish/Unpublish**: Control story visibility with publish status
- **Editable Transcripts**: Edit story text directly with automatic revision tracking

### 🎙️ Audio Narration
- **Voice Narration**: Convert stories to audio using Amazon Polly with multiple voice options
- **Voice Selection**: Choose from 20+ Amazon Polly voices (male/female, different accents)
- **Audio Regeneration**: Regenerate audio with different voices
- **Audio Playback**: Built-in audio player with progress tracking and session management
- **Session Logging**: Track listening sessions with start/end times, duration, and completion status

### 🖼️ Scene Generation
- **Generate Scenes**: Automatically generate portrait images for story scenes based on transcript
- **Smart Parsing**: Automatically detects Parts/Chapters in stories and generates one image per part
- **Portrait Images**: Creates beautiful, child-friendly portrait illustrations (768x1024)
- **Horizontal Gallery**: Displays generated scenes in a scrollable horizontal gallery below transcript

### 📚 Playlists
- **Create Playlists**: Organize stories into custom playlists
- **Public/Private**: Control playlist visibility
- **Story Organization**: Add multiple stories to playlists for easy access

### ⚙️ User Settings
- **Story Generation Settings**: Configure default parameters for all stories:
  - Age range (3-5, 6-8, 9-12 years)
  - Genre preference
  - Language level (simple, moderate, advanced)
  - Moral themes
  - Story structure (parts, word count)
  - Content preferences (diverse characters, sensory details, interactive questions, sound effects)
- **Settings Influence**: All user settings automatically influence story generation prompts

### 👥 User Management
- **Role-Based Access**: 
  - **Admin Users**: Can view and manage all users, all stories, and all sessions
  - **Regular Users**: Can only view and manage their own stories and sessions
- **User Dashboard**: Personalized dashboard with statistics and recent activity
- **Admin Dashboard**: Comprehensive dashboard with platform-wide statistics

### 📊 Analytics & Tracking
- **Dashboard Statistics**: 
  - Total stories, sessions, playlists, users
  - Recent activity (last 30 days)
  - Total listening time
  - Average session duration
  - Stories by status (published/draft)
- **Activity Charts**: Visual charts showing story creation and session activity over the last 7 days
- **Recent Stories**: Quick access to the 5 most recent stories
- **Session Logs**: Detailed logs of all listening sessions with pagination

### Tech Stack

#### Frontend
- **React 19+** with Vite for fast development and optimized builds
- **React Router** for navigation and routing
- **React Bootstrap** for responsive UI components
- **Axios** for API communication with request deduplication and caching
- **React Context API** for global state management (authentication, user data)
- **React Toastify** for toast notifications
- **ApexCharts** for dashboard charts and visualizations
- **Custom Audio Player** with progress tracking and session management

#### Backend
- **Django 6.0** with Django REST Framework (DRF) for robust API endpoints
- **MySQL 8+** (via PyMySQL) or SQLite (for development)
- **Django ORM** for database operations
- **Token-based Authentication** using DRF tokens
- **Pagination** for efficient data loading
- **File Storage**: Django media files organized by year/month/story-id structure

#### AWS Services Integration
- **Amazon Bedrock** (via boto3):
  - **Nova 2 Lite** (`amazon.nova-lite-v1:0`) → Story generation and text completion
  - **Titan Multimodal Embeddings** (`amazon.titan-embed-image-v1`) → Image analysis and description
  - **Titan Image Generator v2** (`amazon.titan-image-generator-v2:0`) → Scene image generation
  - **Stable Diffusion XL** (`stability.stable-diffusion-xl-base-v1:0`) → Fallback for scene generation
- **Amazon Polly** → Text-to-speech conversion with multiple voice options
  - 20+ neural voices available
  - 16kHz PCM output converted to MP3 for storage
  - Voice selection and regeneration support

#### File Storage
- **Local Development**: Django media files in `media/` directory
- **Production Ready**: Can be configured for AWS S3
- **Organized Structure**: Files stored in `YYYY/MM/<story-id>/` format for easy management

## Project Structure

```
novastoryteller/
├── api/                    # Django app containing models, views, serializers
│   ├── models.py          # Database models
│   ├── views.py           # API views and endpoints
│   ├── serializers.py     # DRF serializers
│   ├── urls.py            # API URL routing
│   ├── migrations/        # Database migrations
│   └── management/        # Custom Django management commands
├── backend/               # Django project settings
│   ├── settings.py        # Django configuration
│   ├── urls.py            # Main URL routing (serves React + API)
│   ├── views.py            # View to serve React app
│   ├── wsgi.py            # WSGI configuration
│   └── asgi.py            # ASGI configuration
├── frontend/              # React application (Vite)
│   ├── src/               # React source code
│   │   ├── app/           # Application pages and routes
│   │   ├── components/    # Reusable React components
│   │   ├── context/       # React Context providers
│   │   ├── helpers/       # Utility functions
│   │   ├── hooks/         # Custom React hooks
│   │   ├── layouts/       # Layout components
│   │   ├── routes/        # Route definitions
│   │   └── utils/         # Utility functions
│   ├── public/            # Static public assets
│   ├── dist/              # Vite build output (not committed)
│   ├── package.json       # Node.js dependencies
│   └── vite.config.js     # Vite configuration
├── static/                # Django static files directory
│   └── build/             # React build copied here (served by Django)
├── staticfiles/           # Collected static files (not committed)
├── media/                 # User-uploaded media files (not committed)
├── templates/             # Django templates
├── scripts/               # Utility scripts
│   └── build_frontend.sh  # Script to build and copy React app
├── venv/                  # Python virtual environment (not committed)
├── manage.py              # Django management script
├── requirements.txt       # Python dependencies
└── .env                   # Environment variables (not committed)
```

## Architecture Flow

### Request Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ HTTP Request
       ▼
┌─────────────────────────────────────┐
│         Django Server               │
│         (Port 8000)                  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   URL Router (urls.py)       │  │
│  └───────────┬──────────────────┘  │
│              │                      │
│    ┌─────────┴─────────┐           │
│    │                   │           │
│    ▼                   ▼           │
│  /api/*              /* (catch-all)│
│    │                   │           │
│    ▼                   ▼           │
│  API Views         React App        │
│  (DRF)            (index.html)      │
│    │                   │           │
│    ▼                   │           │
│  Models ───────────────┘           │
│    │                                │
│    ▼                                │
│  MySQL Database                     │
└─────────────────────────────────────┘
```

### Development Mode Flow

1. **Frontend Development** (Separate Vite Dev Server):
   - React app runs on `http://localhost:3000` (Vite dev server)
   - API calls proxy to Django at `http://localhost:8000/api/`
   - Hot module replacement enabled

2. **Backend Development**:
   - Django runs on `http://localhost:8000`
   - Serves API endpoints at `/api/*`
   - CORS enabled for React dev server

### Production Mode Flow

1. **Build Process**:
   - React app is built using Vite (`npm run build`)
   - Build output (`dist/`) is copied to `static/build/`
   - Django collects static files to `staticfiles/`

2. **Serving**:
   - Django serves everything on single port (8000)
   - API requests go to `/api/*` endpoints
   - All other requests serve React app (`index.html`)
   - Static assets served from `staticfiles/` via WhiteNoise

### Data Flow

```
┌──────────────┐
│   React UI   │
└──────┬───────┘
       │
       │ Axios HTTP Request
       ▼
┌──────────────────┐
│  Django REST API │
│  /api/*          │
└──────┬───────────┘
       │
       │ Django ORM
       ▼
┌──────────────┐
│  MySQL DB     │
└──────────────┘
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.11+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 20+** - [Download Node.js](https://nodejs.org/)
- **MySQL 8+** (or use SQLite for development) - [Download MySQL](https://dev.mysql.com/downloads/)
- **Git** - [Download Git](https://git-scm.com/downloads)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd novastoryteller
```

### 2. Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration (MySQL)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=novastoryteller
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# OR use SQLite for development (set USE_SQLITE=True)
USE_SQLITE=False

# CORS Settings (for React dev server)
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

**Note**: The `.env` file is already in `.gitignore` and will not be committed to git.

### 3. Backend Setup (Django)

#### Step 1: Create and Activate Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate
```

#### Step 2: Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### Step 3: Database Setup

**Option A: Using MySQL (Recommended for Production)**

1. Create MySQL database:
```bash
mysql -u root -p
CREATE DATABASE novastoryteller CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

2. Update `.env` with your MySQL credentials

**Option B: Using SQLite (Easier for Development)**

1. Set in `.env`:
```env
USE_SQLITE=True
```

#### Step 4: Run Database Migrations

```bash
python manage.py migrate
```

#### Step 5: Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

This allows you to access Django admin at `http://localhost:8000/admin/`

#### Step 6: Collect Static Files

```bash
python manage.py collectstatic --noinput
```

### 4. Frontend Setup (React)

#### Step 1: Navigate to Frontend Directory

```bash
cd frontend
```

#### Step 2: Install Node Dependencies

```bash
npm install
# or
yarn install
```

#### Step 3: Build Frontend (for Production)

```bash
# From project root (recommended - includes collectstatic)
./scripts/build_frontend.sh

# Or manually:
cd frontend
npm run build
cd ..
mkdir -p static/build
cp -r frontend/dist/* static/build/
python manage.py collectstatic --noinput
```

> **Note:** See [Frontend Build Guide](./projectdocs/FRONTEND_BUILD.md) for detailed build instructions and troubleshooting.

## Running the Applications

### Development Mode

#### Running Django Backend

1. Activate virtual environment:
```bash
source venv/bin/activate  # On macOS/Linux
```

2. Start Django development server:
```bash
python manage.py runserver
```

The Django server will start at `http://localhost:8000`

- API endpoints: `http://localhost:8000/api/`
- Django Admin: `http://localhost:8000/admin/`

#### Running React Frontend (Development Mode)

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Start Vite development server:
```bash
npm run dev
```

The React app will start at `http://localhost:3000` with hot module replacement.

**Note**: In development mode, the React app runs on port 3000 and makes API calls to Django on port 8000. CORS is configured to allow this.

### Production Mode (Monolithic)

In production mode, Django serves both the API and the React app on a single port.

1. **Build the React app**:
```bash
./scripts/build_frontend.sh
```

2. **Collect static files**:
```bash
python manage.py collectstatic --noinput
```

3. **Run Django server**:
```bash
python manage.py runserver
```

4. **Access the application**:
- Application: `http://localhost:8000`
- API: `http://localhost:8000/api/`
- Admin: `http://localhost:8000/admin/`

### Quick Start Script

For a complete setup from scratch:

```bash
# 1. Setup backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # Optional

# 2. Setup frontend
cd frontend
npm install
cd ..

# 3. Build frontend
./scripts/build_frontend.sh

# 4. Collect static files
python manage.py collectstatic --noinput

# 5. Run server
python manage.py runserver
```

## Additional Information

### API Endpoints

The API is available at `/api/` with the following main endpoints:

#### Authentication
- `POST /api/login/` - User login
- `POST /api/register/` - User registration
- `POST /api/logout/` - User logout
- `GET /api/current-user/` - Get current authenticated user
- `POST /api/change-password/` - Change user password
- `GET /api/profile/` - Get user profile

#### Stories
- `GET /api/stories/` - List stories (paginated, filtered by user)
- `POST /api/stories/` - Create new story
- `GET /api/stories/{id}/` - Get story details
- `PATCH /api/stories/{id}/` - Update story
- `DELETE /api/stories/{id}/` - Delete story
- `POST /api/stories/{id}/regenerate/` - Regenerate story with new prompt
- `POST /api/stories/{id}/generate_audio/` - Generate audio narration
- `GET /api/stories/{id}/revisions/` - Get story revision history
- `POST /api/stories/{id}/generate_scenes/` - Generate scene images
- `GET /api/stories/available_voices/` - Get available Polly voices

#### Story Sessions
- `GET /api/story-sessions/` - List listening sessions (paginated)
- `POST /api/story-sessions/` - Start a new listening session
- `POST /api/story-sessions/{id}/end_session/` - End a session and calculate duration

#### Playlists
- `GET /api/playlists/` - List playlists (paginated)
- `POST /api/playlists/` - Create new playlist
- `GET /api/playlists/{id}/` - Get playlist details
- `PATCH /api/playlists/{id}/` - Update playlist
- `DELETE /api/playlists/{id}/` - Delete playlist

#### User Management
- `GET /api/users/` - List users (admin only)
- `GET /api/users/{id}/` - Get user details
- `PATCH /api/users/{id}/` - Update user (admin only)

#### Settings
- `GET /api/story-settings/` - Get user story generation settings
- `POST /api/story-settings/` - Create/update user story settings

#### Dashboard
- `GET /api/dashboard-stats/` - Get dashboard statistics (user-specific or admin-wide)

### Database Management

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# View migration status
python manage.py showmigrations
```

### Static Files

- **Development**: Static files are served from `static/build/` and `staticfiles/`
- **Production**: Use `python manage.py collectstatic` to collect all static files
- WhiteNoise middleware handles static file serving in production

### Troubleshooting

1. **Database Connection Issues**:
   - Ensure MySQL is running
   - Check `.env` database credentials
   - For Docker MySQL, use `127.0.0.1` instead of `localhost`

2. **Frontend Build Issues**:
   - Ensure Node.js 20+ is installed
   - Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check `frontend/vite.config.js` for configuration

3. **CORS Issues**:
   - Ensure `CORS_ALLOWED_ORIGINS` in `.env` includes your React dev server URL
   - Check `backend/settings.py` for CORS configuration

4. **Static Files Not Loading**:
   - Run `python manage.py collectstatic --noinput`
   - Ensure `static/build/` contains React build files
   - Check `STATIC_ROOT` and `STATIC_URL` in `settings.py`

## Project Documentation

All project documentation (markdown files) should be placed in the `projectdocs/` folder. This folder is excluded from git commits (see `.gitignore`).

### Available Documentation

- **[IMPLEMENTATION.md](projectdocs/IMPLEMENTATION.md)** - Complete implementation guide with Amazon Nova integration steps
- **[QUICK_START.md](projectdocs/QUICK_START.md)** - Quick reference guide and setup checklist
- **[APPLICATION_FLOW.md](projectdocs/APPLICATION_FLOW.md)** - Detailed application flow diagrams

See the [projectdocs/README.md](projectdocs/README.md) for the complete documentation index.

## Dependencies

### Python Dependencies
- Django 6.0
- djangorestframework
- django-cors-headers
- mysqlclient (for MySQL) or sqlite3 (built-in, for SQLite)
- python-dotenv
- whitenoise
- Pillow
- google-generativeai

### Node.js Dependencies
- React 19+
- Vite
- Axios
- React Router DOM
- Bootstrap 5
- And many more (see `frontend/package.json`)

## What Has Been Implemented

### ✅ Completed Features

1. **User Authentication & Management**
   - User registration with role selection (admin, staff, user)
   - Login/logout with token-based authentication
   - Role-based access control (admin vs regular users)
   - User profile management
   - Password change functionality

2. **Story Generation**
   - Story creation with prompts and templates
   - AI-powered story generation using Nova 2 Lite
   - Image upload and automatic analysis using Titan Multimodal Embeddings
   - Story regeneration with modified prompts
   - Image analysis during regeneration
   - User story settings that influence all story generation

3. **Audio Features**
   - Text-to-speech using Amazon Polly
   - Multiple voice selection (20+ voices)
   - Audio regeneration with different voices
   - Audio playback with progress tracking
   - Session tracking (start/end time, duration, completion)

4. **Story Management**
   - Story listing with pagination
   - Story detail view with full transcript
   - Editable transcripts with revision history
   - Publish/unpublish functionality
   - Story deletion
   - Revision history with restore capability

5. **Scene Generation**
   - Automatic scene detection (Parts/Chapters)
   - AI-generated portrait images for each scene
   - Horizontal gallery display
   - Scene image storage and management

6. **Playlists**
   - Create and manage playlists
   - Add/remove stories from playlists
   - Public/private playlist visibility
   - Playlist detail pages

7. **User Settings**
   - Global story generation settings
   - Age range, genre, language level configuration
   - Moral themes and content preferences
   - Settings automatically applied to all new stories

8. **Dashboard**
   - User-specific dashboard for regular users
   - Admin dashboard with platform-wide statistics
   - Activity charts (story creation, session activity)
   - Recent stories widget
   - Statistics cards (stories, sessions, playlists, users/listening time)

9. **Frontend Features**
   - Responsive design with React Bootstrap
   - Role-based menu filtering
   - Request deduplication and caching
   - Toast notifications
   - Loading states and error handling
   - Audio player with progress bar
   - Pagination for all list views

### 📋 Current Project Status

- **Backend**: Fully functional with all API endpoints
- **Frontend**: Complete UI with all features implemented
- **Database**: All models created and migrated
- **AWS Integration**: Nova 2 Lite, Titan Embeddings, Polly, and Titan Image Generator integrated
- **File Storage**: Organized year/month/story-id structure
- **Authentication**: Token-based auth with role-based access
- **Testing**: Backend API testing scripts available

## System Prompt for Nova (Core AI Logic)

The system uses a comprehensive prompt for Nova 2 Lite that incorporates user settings and story templates. The base prompt is:

**Base System Prompt:**
"You are Ace Storyteller, a fun, positive AI companion for kids aged 3-12. Your role is to create interactive, educational stories that spark imagination, teach gentle lessons, and adapt to the child's input. Always keep stories age-appropriate: short and simple for younger kids (3-5: 200-300 words, basic words), engaging with some challenges for mid-ages (6-8: 400-500 words, introduce morals), and adventurous with deeper themes for older kids (9-12: 600-700 words, encourage critical thinking).

Core Rules:
- Themes: Positive, inclusive, adventurous. Focus on friendship, kindness, bravery, curiosity, and learning from mistakes. Avoid scary, violent, or negative elements.
- Structure: 4-6 parts with a beginning (setup characters/world), middle (adventure/challenge), end (resolution + moral). Pause for input if interactive.
- Language: Simple vocabulary, short sentences for young kids; build complexity for older. Use repetition for learners. Make it vivid and fun with sounds (e.g., 'Whoosh!').
- Adaptation: Incorporate user details exactly (e.g., if they say 'pet robot', add it seamlessly). If multimodal (e.g., image description), weave it in (e.g., 'The hero found your drawn castle!').
- End: Always include a moral (e.g., 'Friendship makes us stronger') and a question to continue (e.g., 'What happens next?').

If age is specified, adjust accordingly. If not, default to 6-8. Start narrating in an expressive, storytelling voice."

**User Settings Integration:**
User-specific settings (age range, genre, language level, moral theme, story parts, word count, content preferences) are automatically appended to the system prompt to customize story generation for each user.

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).

```
Copyright (C) 2024 Nova Storyteller

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```

See the [LICENSE](LICENSE) file for the full license text.

### What this means:

- ✅ **You can**: Use, modify, and distribute this software
- ✅ **You can**: Use this software commercially
- ✅ **You must**: Include the original copyright notice and license
- ✅ **You must**: Disclose the source code when distributing
- ✅ **You must**: License derivative works under the same GPL-3.0 license

For more information about the GPL-3.0 license, visit: https://www.gnu.org/licenses/gpl-3.0.html
