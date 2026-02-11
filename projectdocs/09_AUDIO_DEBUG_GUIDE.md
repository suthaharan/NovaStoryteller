# Audio Generation Debugging Guide

## Problem: Audio Not Generating

If you see "Audio Generating..." but no MP3 file is available, follow these debugging steps.

## Step-by-Step Debugging Process

### Step 1: Check Django Console/Logs

When creating or regenerating a story, watch the Django console output. You should see:

```
Starting audio generation for story <uuid>
Story text length: <number> characters
Calling nova.synthesize_speech()...
Received PCM audio: <number> bytes
Converting PCM to MP3...
MP3 audio data: <number> bytes
Saving audio file...
Audio file saved to: stories/audio/2024/02/story_<uuid>.mp3
Audio generation completed successfully for story <uuid>
```

**If you see errors**, note the exact error message and traceback.

### Step 2: Verify AWS Credentials

Check your `.env` file has correct AWS credentials:

```bash
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_BEDROCK_REGION=us-east-1
AWS_REGION=us-east-1
```

**Test credentials:**
```bash
python scripts/test_nova.py
```

### Step 3: Check AWS Permissions

Verify your IAM user has:
- `polly:SynthesizeSpeech` permission
- `bedrock:InvokeModel` permission

See `projectdocs/AWS_PERMISSIONS.md` for detailed IAM policy.

### Step 4: Test Polly Directly

Create a test script to verify Polly works:

```python
# test_polly.py
import boto3
import os
from dotenv import load_dotenv

load_dotenv()

polly = boto3.client(
    'polly',
    region_name=os.getenv('AWS_REGION', 'us-east-1'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

try:
    response = polly.synthesize_speech(
        Text='Hello, this is a test.',
        OutputFormat='pcm',
        SampleRate='16000',
        VoiceId='Joanna',
        Engine='neural'
    )
    audio = response['AudioStream'].read()
    print(f"✅ Polly works! Generated {len(audio)} bytes of audio")
except Exception as e:
    print(f"❌ Polly error: {e}")
```

Run: `python test_polly.py`

### Step 5: Check Story Text

Audio generation requires story text. Verify:

1. Story has `story_text` field populated
2. Story text is not empty
3. Check in Django admin or via API: `GET /api/stories/{id}/`

### Step 6: Check File Permissions

Ensure Django can write to the media directory:

```bash
# Check media directory exists
ls -la media/stories/audio/

# Check write permissions
touch media/stories/audio/test.txt
rm media/stories/audio/test.txt
```

### Step 7: Check Dependencies

Verify required Python packages are installed:

```bash
pip list | grep -E "boto3|pydub|numpy"
```

Required:
- `boto3` - AWS SDK
- `pydub` - Audio conversion (optional, falls back to wave)
- `numpy` - Audio upsampling (optional)

### Step 8: Check Audio File Location

After generation, check if file exists:

```bash
# List audio files
find media/stories/audio/ -name "*.mp3" -o -name "*.wav"

# Check specific story
ls -la media/stories/audio/*/story_<uuid>.*
```

### Step 9: Check Database

Verify audio file path is saved in database:

```python
# Django shell: python manage.py shell
from api.models import Story
story = Story.objects.get(id='<your-story-id>')
print(f"Audio file: {story.audio_file}")
print(f"Audio file path: {story.audio_file.path if story.audio_file else 'None'}")
```

### Step 10: Manual Audio Generation Test

Test audio generation manually:

```python
# test_audio_generation.py
import os
import sys
from dotenv import load_dotenv

# Add project to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from api.nova_service import NovaService
from api.utils import pcm_to_mp3

try:
    nova = NovaService()
    print("✅ Nova service initialized")
    
    test_text = "This is a test story. Once upon a time, there was a brave astronaut."
    print(f"Testing with text: {test_text[:50]}...")
    
    # Generate audio
    pcm_audio = nova.synthesize_speech(test_text)
    print(f"✅ Generated PCM audio: {len(pcm_audio)} bytes")
    
    # Convert to MP3
    mp3_data = pcm_to_mp3(pcm_audio, sample_rate=24000)
    print(f"✅ Converted to MP3: {len(mp3_data)} bytes")
    
    # Save to file
    with open('test_audio.mp3', 'wb') as f:
        f.write(mp3_data)
    print("✅ Saved test_audio.mp3 - try playing it!")
    
except Exception as e:
    import traceback
    print(f"❌ Error: {e}")
    print(traceback.format_exc())
```

Run: `python test_audio_generation.py`

## Common Errors and Solutions

### Error: "AWS credentials not found"
**Solution:** Check `.env` file has `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

### Error: "AccessDenied" or "UnauthorizedOperation"
**Solution:** Check IAM user has `polly:SynthesizeSpeech` permission

### Error: "No audio data received from Amazon Polly"
**Solution:** 
- Check story text is not empty
- Verify Polly service is available in your region
- Check network connectivity

### Error: "MP3 conversion failed"
**Solution:**
- Install `pydub`: `pip install pydub`
- Or install `ffmpeg`: `brew install ffmpeg` (macOS) or `apt-get install ffmpeg` (Linux)

### Error: "Failed to save audio file"
**Solution:**
- Check `MEDIA_ROOT` setting in `settings.py`
- Verify write permissions on media directory
- Check disk space

### Audio file exists but not accessible
**Solution:**
- Check `MEDIA_URL` setting
- Verify Django static files are served correctly
- Check file permissions: `chmod 644 media/stories/audio/**/*.mp3`

## Debugging Checklist

- [ ] Django console shows audio generation logs
- [ ] AWS credentials are set in `.env`
- [ ] IAM user has Polly permissions
- [ ] `test_polly.py` script works
- [ ] Story has `story_text` populated
- [ ] Media directory is writable
- [ ] Required packages installed (`boto3`, `pydub`)
- [ ] Audio file exists in `media/stories/audio/`
- [ ] Database has `audio_file` path set
- [ ] `test_audio_generation.py` works

## Getting Help

If audio still doesn't generate after following all steps:

1. **Collect Debug Information:**
   - Django console output (full traceback)
   - Result of `test_polly.py`
   - Result of `test_audio_generation.py`
   - Story ID and story text length
   - Media directory permissions

2. **Check Logs:**
   ```bash
   # Django logs
   tail -f logs/django.log  # if logging to file
   
   # Or check console output when running:
   python manage.py runserver
   ```

3. **Verify Environment:**
   ```bash
   python -c "import boto3; print(boto3.__version__)"
   python -c "from api.nova_service import NovaService; print('NovaService import OK')"
   ```

## Quick Fix: Regenerate Audio

If audio generation failed, you can regenerate audio for an existing story:

1. Go to story detail page
2. Click "Regenerate Story" button
3. Watch Django console for errors
4. Check if audio file is created

## Manual Audio Generation via Django Shell

```python
# python manage.py shell
from api.models import Story
from api.nova_service import NovaService
from api.utils import pcm_to_mp3, save_image_file

story = Story.objects.get(id='<your-story-id>')
nova = NovaService()

# Generate audio
pcm_audio = nova.synthesize_speech(story.story_text)

# Convert to MP3
mp3_data = pcm_to_mp3(pcm_audio, sample_rate=24000)

# Save file
audio_path = save_image_file(mp3_data, category='stories/audio', instance=story)
story.audio_file.name = audio_path
story.save()

print(f"Audio saved to: {audio_path}")
```

