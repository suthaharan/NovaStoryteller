# AWS Services Architecture - Nova Storyteller

## Overview

This document illustrates how Nova Storyteller integrates with AWS services to provide AI-powered story generation, image analysis, audio narration, and scene generation capabilities.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         User Browser (React App)                        │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Dashboard   │  │   Stories    │  │  Playlists   │  │   Settings   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Audio Player Component                         │   │
│  │              (Plays MP3 audio from Django media)                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 │ HTTP/HTTPS (REST API)
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Django Backend (Port 8000)                           │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Django REST Framework                         │   │
│  │                                                                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │ StoryViewSet │  │ SessionViewSet│  │PlaylistViewSet│          │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │   │
│  │         │                 │                  │                   │   │
│  │         └─────────────────┴──────────────────┘                   │   │
│  │                            │                                       │   │
│  │                            ▼                                       │   │
│  │                    ┌──────────────┐                                │   │
│  │                    │ NovaService │                                │   │
│  │                    │  (boto3)    │                                │   │
│  │                    └──────┬──────┘                                │   │
│  └────────────────────────────┼──────────────────────────────────────┘   │
│                               │                                            │
│  ┌────────────────────────────┼──────────────────────────────────────┐   │
│  │                    File Storage (Django Media)                     │   │
│  │                                                                      │   │
│  │  media/                                                              │   │
│  │  ├── YYYY/MM/<story-id>/                                             │   │
│  │  │   ├── image_<timestamp>.jpg  (Uploaded images)                  │   │
│  │  │   ├── audio_<timestamp>.mp3   (Generated audio)                 │   │
│  │  │   └── scenes/                                                    │   │
│  │  │       └── scene_<number>_<timestamp>.png  (Generated scenes)    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                        MySQL Database                                │ │
│  │                                                                       │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │ │
│  │  │  Story   │  │  Session │  │ Playlist  │  │  Scene    │          │ │
│  │  │  Model   │  │  Model   │  │  Model    │  │  Model    │          │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │ │
│  │                                                                       │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                          │ │
│  │  │  User    │  │ Revision │  │ Settings │                          │ │
│  │  │  Model   │  │  Model    │  │  Model   │                          │ │
│  │  └──────────┘  └──────────┘  └──────────┘                          │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬───────────────────────────────────────────┘
                                │
                                │ AWS SDK (boto3)
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Amazon Web Services                            │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Amazon Bedrock                                │   │
│  │                                                                   │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │  Nova 2 Lite (amazon.nova-lite-v1:0)                     │   │   │
│  │  │  ┌──────────────────────────────────────────────────┐  │   │   │
│  │  │  │  Purpose: Story Generation                         │  │   │   │
│  │  │  │  API: Converse API                                  │  │   │   │
│  │  │  │  Input: User prompt + image description + settings │  │   │   │
│  │  │  │  Output: Generated story text                      │  │   │   │
│  │  │  └──────────────────────────────────────────────────┘  │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │  Titan Multimodal Embeddings (amazon.titan-embed-image-v1)│   │   │
│  │  │  ┌──────────────────────────────────────────────────┐  │   │   │
│  │  │  │  Purpose: Image Analysis                         │  │   │   │
│  │  │  │  API: Converse API (with image input)            │  │   │   │
│  │  │  │  Input: Image bytes (JPEG/PNG)                   │  │   │   │
│  │  │  │  Output: Detailed image description text        │  │   │   │
│  │  │  └──────────────────────────────────────────────────┘  │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │  Titan Image Generator v2 (amazon.titan-image-generator-│   │   │
│  │  │                            v2:0)                        │   │   │
│  │  │  ┌──────────────────────────────────────────────────┐  │   │   │
│  │  │  │  Purpose: Scene Image Generation                  │  │   │   │
│  │  │  │  API: InvokeModel API                             │  │   │   │
│  │  │  │  Input: Text prompt describing scene             │  │   │   │
│  │  │  │  Output: Base64-encoded image (PNG)              │  │   │   │
│  │  │  │  Format: Portrait (768x1024)                      │  │   │   │
│  │  │  └──────────────────────────────────────────────────┘  │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │  Stable Diffusion XL (stability.stable-diffusion-xl-    │   │   │
│  │  │                          base-v1:0)                      │   │   │
│  │  │  ┌──────────────────────────────────────────────────┐  │   │   │
│  │  │  │  Purpose: Fallback for Scene Generation           │  │   │   │
│  │  │  │  API: InvokeModel API                             │  │   │   │
│  │  │  │  Input: Text prompt                               │  │   │   │
│  │  │  │  Output: Base64-encoded image                     │  │   │   │
│  │  │  └──────────────────────────────────────────────────┘  │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Amazon Polly                                   │   │
│  │                                                                   │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │  Purpose: Text-to-Speech Conversion                        │   │   │
│  │  │  API: synthesize_speech()                                   │   │   │
│  │  │  Input: Story text + voice_id                               │   │   │
│  │  │  Output: PCM audio (16kHz, mono)                           │   │   │
│  │  │  Voices: 20+ neural voices (Joanna, Matthew, Joey, etc.)   │   │   │
│  │  │  Conversion: PCM → MP3 (via pydub)                         │   │   │
│  │  │  Storage: Saved to Django media as MP3                    │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Story Creation Flow

```
User Input (Prompt + Optional Image)
         │
         ▼
┌────────────────────┐
│  Django Backend     │
│  StoryViewSet      │
└─────────┬──────────┘
          │
          ├─────────────────┐
          │                 │
          ▼                 ▼
┌──────────────────┐  ┌──────────────────┐
│  Image Upload     │  │  Story Creation  │
│  (if provided)    │  │  (Story Model)    │
└─────────┬────────┘  └─────────┬────────┘
          │                     │
          ▼                     │
┌───────────────────────────────┐
│  Titan Multimodal Embeddings  │
│  (Analyze Image)               │
│  Input: Image bytes            │
│  Output: Image description     │
└─────────┬─────────────────────┘
          │
          │ (image_description)
          │
          ▼
┌───────────────────────────────┐
│  Nova 2 Lite                  │
│  (Generate Story)              │
│  Input: Prompt + image_desc +  │
│         user_settings          │
│  Output: Story text            │
└─────────┬─────────────────────┘
          │
          │ (story_text)
          │
          ▼
┌───────────────────────────────┐
│  Amazon Polly                 │
│  (Generate Audio)              │
│  Input: Story text + voice_id  │
│  Output: PCM audio (16kHz)     │
└─────────┬─────────────────────┘
          │
          │ (PCM → MP3 conversion)
          │
          ▼
┌───────────────────────────────┐
│  Save to Database & Storage   │
│  - Story text                  │
│  - Image (if uploaded)         │
│  - Audio file (MP3)            │
│  - Image description           │
└───────────────────────────────┘
```

### Scene Generation Flow

```
User Clicks "Generate Scenes"
         │
         ▼
┌────────────────────┐
│  Django Backend     │
│  generate_scenes()  │
└─────────┬──────────┘
          │
          ▼
┌───────────────────────────────┐
│  Parse Story Transcript       │
│  - Detect Parts/Chapters       │
│  - Extract scene text          │
│  - If no parts: use full story │
└─────────┬─────────────────────┘
          │
          │ (For each scene)
          │
          ▼
┌───────────────────────────────┐
│  Create Image Generation Prompt│
│  "A beautiful, colorful, child-│
│   friendly portrait..."        │
└─────────┬─────────────────────┘
          │
          ├─────────────────┐
          │                 │
          ▼                 ▼
┌──────────────────┐  ┌──────────────────┐
│  Titan Image      │  │  Stable Diffusion│
│  Generator v2     │  │  XL (Fallback)   │
│  (Primary)         │  │                  │
└─────────┬─────────┘  └─────────┬────────┘
          │                      │
          │ (If fails)            │
          └──────────┬───────────┘
                     │
                     ▼
┌───────────────────────────────┐
│  Receive Base64 Image         │
│  Decode to bytes              │
└─────────┬─────────────────────┘
          │
          ▼
┌───────────────────────────────┐
│  Save Scene Image             │
│  - Create StoryScene model     │
│  - Store image in media/       │
│    YYYY/MM/<story-id>/scenes/  │
└─────────┬─────────────────────┘
          │
          ▼
┌───────────────────────────────┐
│  Return Scene Data            │
│  - Scene number                │
│  - Scene text                  │
│  - Image URL                   │
└───────────────────────────────┘
```

### Audio Generation Flow

```
User Selects Voice & Clicks "Generate Audio"
         │
         ▼
┌────────────────────┐
│  Django Backend     │
│  generate_audio()   │
└─────────┬──────────┘
          │
          ▼
┌───────────────────────────────┐
│  Get Story Text                │
│  Get Selected Voice ID         │
└─────────┬─────────────────────┘
          │
          ▼
┌───────────────────────────────┐
│  Amazon Polly                 │
│  synthesize_speech()           │
│  Input:                        │
│    - Text: story_text          │
│    - Voice: voice_id           │
│    - Format: PCM               │
│    - Sample Rate: 16000 Hz     │
│  Output:                       │
│    - PCM audio bytes (16kHz)   │
└─────────┬─────────────────────┘
          │
          ▼
┌───────────────────────────────┐
│  Convert PCM to MP3            │
│  (using pydub)                 │
│  - Input: PCM bytes (16kHz)    │
│  - Output: MP3 bytes           │
└─────────┬─────────────────────┘
          │
          ▼
┌───────────────────────────────┐
│  Delete Old Audio (if exists) │
│  Save New Audio File          │
│  - Path: YYYY/MM/<story-id>/   │
│    audio_<timestamp>.mp3      │
│  - Update Story.audio_file    │
└─────────┬─────────────────────┘
          │
          ▼
┌───────────────────────────────┐
│  Return Audio URL             │
│  Frontend updates audio player│
└───────────────────────────────┘
```

### Image Analysis Flow (During Regeneration)

```
User Uploads Image or Regenerates Story
         │
         ▼
┌────────────────────┐
│  Django Backend     │
│  (regenerate or     │
│   perform_update)   │
└─────────┬──────────┘
          │
          ▼
┌───────────────────────────────┐
│  Check if Image Exists        │
│  Check if Already Analyzed   │
└─────────┬─────────────────────┘
          │
          │ (If image exists & not analyzed)
          │
          ▼
┌───────────────────────────────┐
│  Read Image File               │
│  - Get image bytes             │
│  - Detect format (JPEG/PNG)    │
└─────────┬─────────────────────┘
          │
          ▼
┌───────────────────────────────┐
│  Titan Multimodal Embeddings  │
│  analyze_image()               │
│  Input:                        │
│    - Image bytes               │
│    - Format: "jpeg" or "png"  │
│    - Prompt: "Describe this    │
│      image in detail for a     │
│      children's story..."      │
│  Output:                       │
│    - Detailed description text │
└─────────┬─────────────────────┘
          │
          │ (image_description)
          │
          ▼
┌───────────────────────────────┐
│  Save Image Description        │
│  - Update Story.image_desc     │
└─────────┬─────────────────────┘
          │
          │ (Used in story generation)
          │
          ▼
┌───────────────────────────────┐
│  Nova 2 Lite                   │
│  generate_story()               │
│  Input:                        │
│    - Prompt                    │
│    - Image description         │
│    - User settings             │
│  Output:                       │
│    - Story text                │
└───────────────────────────────┘
```

## AWS Service Details

### Amazon Bedrock Models

#### 1. Nova 2 Lite (`amazon.nova-lite-v1:0`)
- **Purpose**: Story text generation
- **API**: Converse API
- **Input Format**:
  ```json
  {
    "modelId": "amazon.nova-lite-v1:0",
    "messages": [{
      "role": "user",
      "content": [{"text": "user_prompt"}]
    }],
    "system": [{"text": "system_prompt"}],
    "inferenceConfig": {
      "maxTokens": 2000,
      "temperature": 0.7,
      "topP": 0.9
    }
  }
  ```
- **Output**: Generated story text
- **Cost**: Pay-per-token (typically $0.0001-0.0003 per 1K tokens)

#### 2. Titan Multimodal Embeddings (`amazon.titan-embed-image-v1`)
- **Purpose**: Image analysis and description
- **API**: Converse API (with image input)
- **Input Format**:
  ```json
  {
    "modelId": "amazon.titan-embed-image-v1",
    "messages": [{
      "role": "user",
      "content": [
        {
          "image": {
            "format": "jpeg",
            "source": {"bytes": <image_bytes>}
          }
        },
        {"text": "Describe this image..."}
      ]
    }]
  }
  ```
- **Output**: Detailed image description text
- **Cost**: Pay-per-image (typically $0.008-0.012 per image)

#### 3. Titan Image Generator v2 (`amazon.titan-image-generator-v2:0`)
- **Purpose**: Generate scene images from text
- **API**: InvokeModel API
- **Input Format**:
  ```json
  {
    "taskType": "TEXT_IMAGE",
    "textToImageParams": {
      "text": "prompt describing scene",
      "width": 768,
      "height": 1024,
      "numberOfImages": 1
    }
  }
  ```
- **Output**: Base64-encoded PNG image
- **Cost**: Pay-per-image (typically $0.008-0.012 per image)
- **Note**: Auto-enabled on first use (no manual activation needed)

#### 4. Stable Diffusion XL (`stability.stable-diffusion-xl-base-v1:0`)
- **Purpose**: Fallback for scene generation
- **API**: InvokeModel API
- **Input Format**:
  ```json
  {
    "text_prompts": [{"text": "prompt", "weight": 1.0}],
    "cfg_scale": 7,
    "height": 1024,
    "width": 768,
    "steps": 50,
    "style_preset": "photographic"
  }
  ```
- **Output**: Base64-encoded image in artifacts array
- **Cost**: Pay-per-image (varies by region)

### Amazon Polly

- **Purpose**: Text-to-speech conversion
- **API**: `synthesize_speech()`
- **Input**:
  - Text: Story transcript
  - Voice ID: Selected voice (e.g., "Joanna", "Matthew", "Joey")
  - Output Format: PCM
  - Sample Rate: 16000 Hz
- **Output**: PCM audio bytes (16kHz, mono)
- **Conversion**: PCM → MP3 (using pydub)
- **Storage**: Saved as MP3 in Django media
- **Available Voices**: 20+ neural voices
  - Female: Joanna, Ivy, Kendra, Kimberly, Salli, etc.
  - Male: Matthew, Joey, Justin, etc.
- **Cost**: Pay-per-character (typically $0.000016 per character)
- **Note**: Free tier available (5M characters/month)

## Request/Response Flow

### Story Creation Request

```
1. Frontend → Django: POST /api/stories/
   {
     "title": "My Adventure",
     "prompt": "Tell me a story about a brave astronaut",
     "template": "adventure",
     "image": <file>
   }

2. Django → Titan Embeddings: Analyze image (if provided)
   Response: "A colorful drawing of a space rocket..."

3. Django → Nova 2 Lite: Generate story
   Input: prompt + image_description + user_settings
   Response: "Once upon a time, there was a brave astronaut..."

4. Django → Amazon Polly: Generate audio
   Input: story_text + voice_id
   Response: PCM audio bytes

5. Django: Convert PCM → MP3, save files

6. Django → Frontend: Story object with URLs
   {
     "id": "...",
     "story_text": "...",
     "image_url": "/media/...",
     "audio_url": "/media/...",
     ...
   }
```

### Scene Generation Request

```
1. Frontend → Django: POST /api/stories/{id}/generate_scenes/

2. Django: Parse story transcript
   - Detect: "Part 1:", "Chapter 2:", etc.
   - Extract: Scene text for each part
   - If no parts: Use full story as single scene

3. For each scene:
   Django → Titan Image Generator: Generate image
   Input: "A beautiful, colorful, child-friendly portrait..."
   Response: Base64-encoded image

4. Django: Decode image, save to media/
   Create StoryScene model records

5. Django → Frontend: List of scenes
   [
     {
       "id": "...",
       "scene_number": 1,
       "scene_text": "...",
       "image_url": "/media/..."
     },
     ...
   ]
```

## Cost Estimation

### Per Story Generation
- **Nova 2 Lite**: ~$0.001-0.003 (for 500-1000 word story)
- **Titan Embeddings**: ~$0.008-0.012 (if image uploaded)
- **Amazon Polly**: ~$0.008-0.016 (for 500-1000 character story)
- **Total**: ~$0.017-0.031 per story

### Per Scene Generation
- **Titan Image Generator**: ~$0.008-0.012 per scene
- **5 scenes**: ~$0.040-0.060 per story

### Monthly Estimate (Example)
- 100 stories/month: ~$1.70-3.10
- 50 stories with scenes: ~$0.85-1.55 + $2.00-3.00 = ~$2.85-4.55
- **Total**: ~$3-5/month for moderate usage

## Security & Permissions

### Required AWS IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:Converse",
        "bedrock:ConverseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/amazon.nova-lite-v1:0",
        "arn:aws:bedrock:*::foundation-model/amazon.titan-embed-image-v1",
        "arn:aws:bedrock:*::foundation-model/amazon.titan-image-generator-v2:0",
        "arn:aws:bedrock:*::foundation-model/stability.stable-diffusion-xl-base-v1:0"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "polly:SynthesizeSpeech"
      ],
      "Resource": "*"
    }
  ]
}
```

### Environment Variables

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BEDROCK_REGION=us-east-1
```

## Model Availability

- **Auto-Enabled**: All Bedrock foundation models are automatically enabled on first use (no manual activation needed)
- **Region Support**: Check AWS Bedrock documentation for region availability
- **Fallback Strategy**: Code tries multiple models in sequence if primary fails

## Error Handling

The application implements comprehensive error handling:
1. **Model Not Available**: Falls back to alternative models
2. **API Errors**: Returns clear error messages to frontend
3. **Image Generation Failures**: Continues with other scenes if one fails
4. **Audio Generation Failures**: Allows retry with different voice

## Performance Considerations

- **Async Processing**: Story generation and audio synthesis are synchronous (can be made async with Celery in production)
- **Caching**: Frontend implements request deduplication and caching
- **File Storage**: Images and audio stored locally (can be migrated to S3 for production)
- **Database Indexing**: All models have proper indexes for efficient queries

