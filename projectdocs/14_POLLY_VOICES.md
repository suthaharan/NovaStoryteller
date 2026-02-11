# Amazon Polly Voice Selection Feature

## Overview

The Nova Storyteller application now supports voice selection for story narration using Amazon Polly's neural voices. Users can choose from a variety of voices when generating or regenerating audio for their stories.

## Available Voices

### English (US) - en-US
- **Joanna** (Female) - Default, warm and friendly
- **Matthew** (Male) - Clear and professional
- **Ivy** (Female) - Young and energetic
- **Joey** (Male) - Casual and conversational
- **Justin** (Male) - Youthful and upbeat
- **Kendra** (Female) - Warm and expressive
- **Kimberly** (Female) - Professional and clear
- **Salli** (Female) - Friendly and natural

### English (GB) - en-GB
- **Amy** (Female) - British English, clear and professional
- **Emma** (Female) - British English, warm and friendly
- **Brian** (Male) - British English, authoritative

### English (AU) - en-AU
- **Nicole** (Female) - Australian English
- **Russell** (Male) - Australian English
- **Olivia** (Female) - Australian English

### Spanish (ES) - es-ES
- **Conchita** (Female) - European Spanish
- **Lucia** (Female) - European Spanish
- **Enrique** (Male) - European Spanish

### Spanish (US) - es-US
- **Lupe** (Female) - US Spanish
- **Penelope** (Female) - US Spanish
- **Miguel** (Male) - US Spanish

### French (FR) - fr-FR
- **Celine** (Female) - French
- **Lea** (Female) - French
- **Mathieu** (Male) - French

### German (DE) - de-DE
- **Marlene** (Female) - German
- **Vicki** (Female) - German
- **Hans** (Male) - German

### Italian (IT) - it-IT
- **Carla** (Female) - Italian
- **Bianca** (Female) - Italian
- **Giorgio** (Male) - Italian

### Portuguese (BR) - pt-BR
- **Vitoria** (Female) - Brazilian Portuguese
- **Camila** (Female) - Brazilian Portuguese
- **Ricardo** (Male) - Brazilian Portuguese

### Japanese (JP) - ja-JP
- **Mizuki** (Female) - Japanese
- **Takumi** (Male) - Japanese

### Korean (KR) - ko-KR
- **Seoyeon** (Female) - Korean

### Chinese (CN) - zh-CN
- **Zhiyu** (Female) - Chinese

## How to Use

### For Users

1. **Navigate to Story Detail Page**
   - Go to Stories list
   - Click on a story title to view details

2. **Select a Voice**
   - In the "Story Narration" section, you'll see a "Voice" dropdown
   - Select your preferred voice from the list
   - The dropdown shows voice name and gender (e.g., "Joanna (Female)")

3. **Generate Audio**
   - Click the "Generate Audio" button
   - The audio will be generated using the selected voice
   - Wait for the generation to complete (may take 30-60 seconds)

4. **Regenerate with Different Voice**
   - Change the voice selection
   - Click "Generate Audio" again
   - The new audio will replace the previous one

### For Developers

#### Backend API

**Get Available Voices**
```
GET /api/stories/available_voices/?language_code=en-US
```

Response:
```json
{
  "language_code": "en-US",
  "voices": [
    {
      "id": "Joanna",
      "name": "Joanna",
      "gender": "Female",
      "neural": true
    },
    ...
  ]
}
```

**Generate Audio with Voice**
```
POST /api/stories/{story_id}/generate_audio/
Content-Type: application/json

{
  "voice_id": "Matthew"
}
```

#### Database

The `Story` model now includes a `voice_id` field:
- Default: `'Joanna'`
- Type: `CharField(max_length=50)`
- Stores the selected voice ID for the story

#### Code Structure

- **Voice Definitions**: `api/polly_voices.py`
  - Contains all available voices organized by language
  - Helper functions for voice validation and selection

- **Audio Generation**: `api/utils.py`
  - `text_to_audio_pcm()` now accepts `voice_id` parameter
  - Uses Amazon Polly neural engine for high-quality speech

- **API Endpoints**: `api/views.py`
  - `StoryViewSet.generate_audio()` accepts `voice_id` in request
  - `StoryViewSet.available_voices()` returns list of voices

- **Frontend**: `frontend/src/app/(admin)/stories/[id]/page.jsx`
  - Voice selection dropdown
  - Fetches available voices on component mount
  - Sends `voice_id` when generating audio

## Migration

To apply the database changes:

```bash
python manage.py migrate api
```

This will add the `voice_id` field to the `api_story` table.

## Notes

- All voices use Amazon Polly's **neural engine** for best quality
- Voice selection is stored per story
- Changing voice and regenerating audio will replace the previous audio file
- Default voice is "Joanna" if not specified
- Voice selection is available to all users who can edit the story

## Future Enhancements

- Language selection dropdown (currently defaults to en-US)
- Voice preview before generation
- Character-specific voices for different story characters
- Voice speed/pitch adjustment

