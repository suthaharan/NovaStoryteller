# Audio Generation Troubleshooting

## Issue: "Audio Generating..." Button Always Shows

If the button always shows "Audio Generating..." and no MP3 is available, follow these steps:

### Step 1: Check Django Console Logs

When you click "Generate Audio" or create/regenerate a story, watch the Django console. You should see:

```
Starting audio generation for story <uuid>
Story text length: <number> characters
Calling nova.synthesize_speech()...
Received PCM audio: <number> bytes
Converting PCM to MP3...
MP3 audio data: <number> bytes
Saving audio file...
Audio file saved to: stories/audio/2024/02/story_<uuid>.mp3
✅ Audio generation completed successfully for story <uuid>
✅ Audio file path: stories/audio/2024/02/story_<uuid>.mp3
```

**If you see errors**, note the exact error message.

### Step 2: Test Audio Generation Directly

Run the test script:

```bash
python scripts/test_audio_generation.py
```

This will verify:
- AWS credentials
- Polly access
- Audio conversion
- File saving

### Step 3: Check Story Has Content

Verify the story has `story_text`:

1. Go to story detail page
2. Check if "Story Transcript" section has content
3. If empty, click "Regenerate Story" first

### Step 4: Manually Generate Audio

1. Go to story detail page
2. Click "Generate Audio" button (next to "Audio Generating...")
3. Watch Django console for errors
4. Click refresh button to check if audio is ready

### Step 5: Check File System

After generating audio, check if file exists:

```bash
# Find audio files
find media/stories/audio/ -name "*.mp3" -type f

# Check specific story (replace <uuid> with your story ID)
ls -la media/stories/audio/*/story_<uuid>.*
```

### Step 6: Check Database

Verify audio file path is saved:

```python
# Django shell: python manage.py shell
from api.models import Story
story = Story.objects.get(id='<your-story-id>')
print(f"Audio file: {story.audio_file}")
print(f"Audio file name: {story.audio_file.name if story.audio_file else 'None'}")
print(f"Audio file URL: {story.audio_file.url if story.audio_file else 'None'}")
```

### Step 7: Check API Response

Check if API returns `audio_url`:

```bash
# Replace <story-id> and <token> with actual values
curl -H "Authorization: Token <your-token>" \
     http://localhost:8000/api/stories/<story-id>/

# Look for "audio_url" field in response
```

### Step 8: Common Issues

| Issue | Solution |
|-------|----------|
| "No audio data returned from Polly" | Check AWS credentials and Polly permissions |
| "MP3 conversion failed" | Install `pydub`: `pip install pydub` |
| "Failed to save audio file" | Check `MEDIA_ROOT` and file permissions |
| Audio file exists but `audio_url` is null | Check serializer `get_audio_url` method |
| "Story has no content" | Regenerate story first |

### Step 9: Force Audio Generation

If audio generation failed, you can force it:

1. **Via Frontend:**
   - Go to story detail page
   - Click "Generate Audio" button

2. **Via API:**
   ```bash
   curl -X POST \
        -H "Authorization: Token <your-token>" \
        -H "Content-Type: application/json" \
        http://localhost:8000/api/stories/<story-id>/generate_audio/
   ```

3. **Via Django Shell:**
   ```python
   from api.models import Story
   from api.nova_service import NovaService
   from api.utils import pcm_to_mp3, save_image_file
   
   story = Story.objects.get(id='<your-story-id>')
   nova = NovaService()
   
   # Generate audio
   pcm = nova.synthesize_speech(story.story_text)
   mp3 = pcm_to_mp3(pcm, sample_rate=24000)
   path = save_image_file(mp3, 'stories/audio', story)
   story.audio_file.name = path
   story.save()
   print(f"Audio saved: {path}")
   ```

### Step 10: Check MEDIA_URL Configuration

Verify `MEDIA_URL` is correctly configured in `settings.py`:

```python
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

And ensure media files are served in development:

```python
# In urls.py
from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

## Quick Fix Checklist

- [ ] Story has `story_text` content
- [ ] AWS credentials are set in `.env`
- [ ] IAM user has `polly:SynthesizeSpeech` permission
- [ ] `test_audio_generation.py` script passes
- [ ] Django console shows audio generation logs
- [ ] Audio file exists in `media/stories/audio/`
- [ ] Database has `audio_file` path set
- [ ] API returns `audio_url` in response
- [ ] `MEDIA_URL` is configured correctly
- [ ] Media files are served in development

## Still Not Working?

1. **Check Full Error Log:**
   - Look at Django console for complete traceback
   - Check browser console for API errors

2. **Verify File Permissions:**
   ```bash
   chmod -R 755 media/
   ```

3. **Test Polly Directly:**
   ```python
   import boto3
   import os
   from dotenv import load_dotenv
   
   load_dotenv()
   
   polly = boto3.client('polly',
       region_name=os.getenv('AWS_REGION', 'us-east-1'),
       aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
       aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
   )
   
   response = polly.synthesize_speech(
       Text='Test',
       OutputFormat='pcm',
       SampleRate='16000',
       VoiceId='Joanna',
       Engine='neural'
   )
   print(f"Success: {len(response['AudioStream'].read())} bytes")
   ```

4. **Contact Support:**
   - Provide Django console output
   - Provide result of `test_audio_generation.py`
   - Provide story ID and story text length

