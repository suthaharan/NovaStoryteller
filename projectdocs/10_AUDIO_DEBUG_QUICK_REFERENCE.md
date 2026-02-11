# Audio Generation Debug - Quick Reference

## Quick Debug Steps

### 1. Run Test Script
```bash
python scripts/test_audio_generation.py
```

This will test:
- ✅ AWS credentials
- ✅ NovaService initialization
- ✅ Amazon Polly access
- ✅ PCM to MP3 conversion
- ✅ File saving

### 2. Check Django Console
When creating/regenerating a story, watch for:
```
Starting audio generation for story <uuid>
Story text length: <number> characters
Calling nova.synthesize_speech()...
Received PCM audio: <number> bytes
Converting PCM to MP3...
MP3 audio data: <number> bytes
Saving audio file...
Audio file saved to: stories/audio/...
Audio generation completed successfully
```

### 3. Common Issues

| Issue | Solution |
|-------|----------|
| "AWS credentials not found" | Check `.env` file has `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` |
| "AccessDenied" | Add `polly:SynthesizeSpeech` permission to IAM user |
| "No audio data" | Check story has `story_text` populated |
| "MP3 conversion failed" | Install `pydub`: `pip install pydub` |
| Audio file not accessible | Check `MEDIA_URL` and file permissions |

### 4. Manual Test (Django Shell)
```python
python manage.py shell

from api.models import Story
from api.nova_service import NovaService
from api.utils import pcm_to_mp3, save_image_file

story = Story.objects.get(id='<your-story-id>')
if not story.story_text:
    print("ERROR: Story has no text!")
else:
    nova = NovaService()
    pcm = nova.synthesize_speech(story.story_text)
    mp3 = pcm_to_mp3(pcm, sample_rate=24000)
    path = save_image_file(mp3, 'stories/audio', story)
    story.audio_file.name = path
    story.save()
    print(f"✅ Audio saved: {path}")
```

### 5. Check File System
```bash
# Find audio files
find media/stories/audio/ -name "*.mp3"

# Check specific story
ls -la media/stories/audio/*/story_<uuid>.*
```

## Full Guide
See `projectdocs/AUDIO_DEBUG_GUIDE.md` for complete debugging steps.

