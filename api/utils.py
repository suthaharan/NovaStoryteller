"""
Utility functions for the API app.
"""
import os
import io
import wave
from datetime import datetime
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import UploadedFile
from django.conf import settings

try:
    from pydub import AudioSegment
    AUDIO_AVAILABLE = True
except ImportError:
    AUDIO_AVAILABLE = False


def get_image_upload_path(instance, filename, category='images'):
    """
    Generate upload path with year/month/storyid structure for stories.
    For stories: year/month/storyid/filename
    For other categories: category/year/month/filename
    
    Args:
        instance: Model instance (can be None for new instances)
        filename: Original filename
        category: Category/subdirectory name (e.g., 'stories', 'users', 'news')
    
    Returns:
        str: Path in format: {year}/{month}/{storyid}/{filename} for stories
             or {category}/{year}/{month}/{filename} for others
    
    Example:
        For Story: 2024/01/<story-id>/story_image.jpg
        For Story audio: 2024/01/<story-id>/audio.mp3
        For User: users/2024/12/profile_pic.png
    """
    now = datetime.now()
    year = now.strftime('%Y')
    month = now.strftime('%m')
    
    # Get file extension
    _, ext = os.path.splitext(filename)
    
    # Special handling for stories - group by story ID
    if category == 'stories' and instance and hasattr(instance, 'id') and instance.id:
        # For stories, use: year/month/storyid/filename
        story_id = str(instance.id)
        
        # Generate filename
        if 'audio' in filename.lower() or ext.lower() in ['.mp3', '.wav', '.pcm']:
            # Audio file
            base_name = f"audio_{now.strftime('%Y%m%d_%H%M%S')}"
        else:
            # Image or other file
            base_name = f"image_{now.strftime('%Y%m%d_%H%M%S')}"
        
        filename = f"{base_name}{ext}"
        return os.path.join(year, month, story_id, filename)
    
    # For non-story files or when instance doesn't have ID, use category structure
    if instance and hasattr(instance, 'id') and instance.id:
        # Use instance ID to make filename unique
        filename_prefix = category.split('/')[-1]
        base_name = f"{filename_prefix}_{instance.id}_{now.strftime('%Y%m%d_%H%M%S')}"
    else:
        # Use original filename (sanitized)
        base_name = os.path.splitext(filename)[0]
        # Remove any path separators and special characters
        base_name = "".join(c for c in base_name if c.isalnum() or c in ('-', '_'))
    
    filename = f"{base_name}{ext}"
    
    # Return path: category/year/month/filename
    return os.path.join(category, year, month, filename)


def story_image_upload_path(instance, filename):
    """
    Upload path function for Story model images.
    Returns: year/month/storyid/image_<timestamp>.jpg
    This is a callable that Django migrations can serialize.
    """
    return get_image_upload_path(instance, filename, 'stories')


def story_audio_upload_path(instance, filename):
    """
    Upload path function for Story model audio files.
    Returns: year/month/storyid/audio_<timestamp>.mp3
    This is a callable that Django migrations can serialize.
    """
    return get_image_upload_path(instance, filename, 'stories')


def story_scene_image_upload_path(instance, filename):
    """
    Upload path function for StoryScene model images.
    Returns: year/month/storyid/scenes/scene_<number>_<timestamp>.jpg
    This is a callable that Django migrations can serialize.
    """
    now = datetime.now()
    year = now.strftime('%Y')
    month = now.strftime('%m')
    timestamp = now.strftime('%Y%m%d_%H%M%S')
    
    # Get file extension
    _, ext = os.path.splitext(filename)
    if not ext:
        ext = '.jpg'
    
    # Get story ID from instance
    story_id = str(instance.story.id) if instance and hasattr(instance, 'story') and instance.story else 'unknown'
    scene_number = instance.scene_number if instance and hasattr(instance, 'scene_number') else 1
    
    # Return path: year/month/storyid/scenes/scene_<number>_<timestamp>.ext
    return f"{year}/{month}/{story_id}/scenes/scene_{scene_number}_{timestamp}{ext}"


def save_image_file(uploaded_file, category='images', instance=None, filename=None):
    """
    Save uploaded image file to media storage with year/month structure.
    
    Args:
        uploaded_file: Django UploadedFile or file-like object (bytes)
        category: Category/subdirectory name (e.g., 'stories', 'users', 'news')
        instance: Model instance (optional, for unique filename generation)
        filename (str, optional): Explicit filename to use. If None, derived from uploaded_file.
    
    Returns:
        str: Relative path to saved file (for storing in database)
    
    Example:
        save_image_file(file, 'stories', story_instance)
        Returns: 'stories/2024/01/story_123_20240116_143022.jpg'
    """
    if not uploaded_file:
        return None
    
    # Determine filename if not explicitly provided
    if filename is None:
        if hasattr(uploaded_file, 'name'):
            filename = uploaded_file.name
        elif isinstance(uploaded_file, bytes):
            # Determine if it's MP3 or WAV based on category or content
            if 'audio' in category.lower() or category == 'stories': # 'stories' category can contain audio
                filename = 'audio.mp3'  # Default to MP3 for audio
            else:
                filename = 'uploaded_file'
        else:
            filename = 'uploaded_file'
    
    upload_path = get_image_upload_path(instance, filename, category)
    
    # Ensure directory exists
    full_path = os.path.join(settings.MEDIA_ROOT, upload_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    
    # Save file
    if isinstance(uploaded_file, UploadedFile):
        # Django UploadedFile
        with default_storage.open(upload_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)
    else:
        # File-like object (bytes, etc.)
        with open(full_path, 'wb') as destination:
            if hasattr(uploaded_file, 'read'):
                destination.write(uploaded_file.read())
            else:
                destination.write(uploaded_file)
    
    return upload_path


def get_image_url(image_path):
    """
    Get full URL for an image path.
    
    Args:
        image_path: Relative path from MEDIA_ROOT
    
    Returns:
        str: Full URL to the image
    """
    if not image_path:
        return None
    
    return f"{settings.MEDIA_URL}{image_path}"


def delete_image_file(image_path):
    """
    Delete an image file from storage.
    
    Args:
        image_path: Relative path from MEDIA_ROOT
    
    Returns:
        bool: True if deleted, False if not found
    """
    if not image_path:
        return False
    
    try:
        full_path = os.path.join(settings.MEDIA_ROOT, image_path)
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
    except Exception as e:
        print(f"Error deleting image file {image_path}: {e}")
    
    return False


def text_to_audio_pcm(text, polly_client, language_code='en-US', sample_rate=16000, voice_id=None):
    """
    Convert text to audio in PCM format (16kHz, mono) using Amazon Polly.
    
    This is used in the hybrid approach:
    1. Generate story text with Nova 2 Lite
    2. Convert text to audio using Amazon Polly (AWS-native)
    3. Send audio to Nova 2 Sonic for natural voice narration
    
    Args:
        text (str): Text to convert to speech
        polly_client: boto3 Polly client instance
        language_code (str): Language code (default: 'en-US')
            Supported: en-US, en-GB, es-ES, fr-FR, de-DE, it-IT, etc.
        sample_rate (int): Target sample rate in Hz (default: 16000 for Nova Sonic)
        voice_id (str, optional): Specific voice ID to use. If None, auto-selects based on language.
    
    Returns:
        bytes: Audio data in PCM format (16kHz, mono, 16-bit)
    
    Raises:
        Exception: If conversion fails
    """
    try:
        # Map language codes for Polly
        # Polly uses format like 'en-US', 'es-ES', etc.
        polly_lang = language_code
        
        # Get appropriate voice for language if not specified
        if not voice_id:
            voice_map = {
                'en-US': 'Joanna',  # Neural voice
                'en-GB': 'Amy',
                'es-ES': 'Conchita',
                'fr-FR': 'Celine',
                'de-DE': 'Marlene',
                'it-IT': 'Carla'
            }
            voice_id = voice_map.get(language_code, 'Joanna')
        
        # Use Amazon Polly to synthesize speech in PCM format
        # Polly supports PCM output directly
        response = polly_client.synthesize_speech(
            Text=text,
            OutputFormat='pcm',  # Direct PCM output
            SampleRate=str(sample_rate),  # 16kHz
            VoiceId=voice_id,
            LanguageCode=polly_lang,
            Engine='neural'  # Use neural engine for better quality
        )
        
        # Read PCM audio stream
        audio_stream = response['AudioStream']
        pcm_data = audio_stream.read()
        
        if not pcm_data:
            raise Exception("No audio data received from Amazon Polly")
        
        return pcm_data
        
    except Exception as e:
        raise Exception(f"Error converting text to audio with Amazon Polly: {str(e)}")


def pcm_to_wav(pcm_data, sample_rate=24000, channels=1, sample_width=2):
    """
    Convert PCM audio data to WAV format for playback.
    
    Uses pydub for format conversion. If pydub is not available,
    creates a simple WAV file with wave module (native Python).
    
    Args:
        pcm_data (bytes): Raw PCM audio data
        sample_rate (int): Sample rate in Hz (default: 24000 for Nova Sonic output)
        channels (int): Number of channels (default: 1 for mono)
        sample_width (int): Sample width in bytes (default: 2 for 16-bit)
    
    Returns:
        bytes: WAV file data
    """
    if AUDIO_AVAILABLE:
        try:
            # Use pydub for conversion (better quality)
            audio = AudioSegment(
                pcm_data,
                frame_rate=sample_rate,
                channels=channels,
                sample_width=sample_width
            )
            
            wav_buffer = io.BytesIO()
            audio.export(wav_buffer, format="wav")
            wav_buffer.seek(0)
            return wav_buffer.read()
        except Exception:
            pass  # Fall back to native method
    
    # Native Python WAV creation
    wav_buffer = io.BytesIO()
    
    # WAV file header
    wav_file = wave.open(wav_buffer, 'wb')
    wav_file.setnchannels(channels)
    wav_file.setsampwidth(sample_width)
    wav_file.setframerate(sample_rate)
    wav_file.writeframes(pcm_data)
    wav_file.close()
    
    wav_buffer.seek(0)
    return wav_buffer.read()


def upsample_audio(pcm_data, from_rate=16000, to_rate=24000, channels=1, sample_width=2):
    """
    Simple audio upsampling from one sample rate to another.
    
    This is a basic linear interpolation. For production, use a proper audio library.
    
    Args:
        pcm_data (bytes): Raw PCM audio data
        from_rate (int): Source sample rate
        to_rate (int): Target sample rate
        channels (int): Number of channels
        sample_width (int): Sample width in bytes
    
    Returns:
        bytes: Upsampled PCM audio data
    """
    if from_rate == to_rate:
        return pcm_data
    
    # Simple linear interpolation upsampling
    # For production, use librosa, scipy.signal.resample, or similar
    try:
        import numpy as np
        # Convert bytes to numpy array
        samples = np.frombuffer(pcm_data, dtype=np.int16)
        
        # Calculate resampling ratio
        ratio = to_rate / from_rate
        
        # Simple linear interpolation
        indices = np.linspace(0, len(samples) - 1, int(len(samples) * ratio))
        upsampled = np.interp(indices, np.arange(len(samples)), samples)
        
        # Convert back to int16 and then bytes
        upsampled_int16 = upsampled.astype(np.int16)
        return upsampled_int16.tobytes()
    except ImportError:
        # If numpy not available, return original (will work but at wrong sample rate)
        return pcm_data


def pcm_to_mp3(pcm_data, sample_rate=24000, channels=1, sample_width=2):
    """
    Convert PCM audio data to MP3 format for storage and playback.
    
    Requires pydub for MP3 conversion. If not available, returns WAV format instead.
    
    Args:
        pcm_data (bytes): Raw PCM audio data
        sample_rate (int): Sample rate in Hz (default: 24000 for Nova Sonic output)
        channels (int): Number of channels (default: 1 for mono)
        sample_width (int): Sample width in bytes (default: 2 for 16-bit)
    
    Returns:
        bytes: MP3 file data (or WAV if pydub not available)
    """
    if not AUDIO_AVAILABLE:
        # Fall back to WAV if pydub not available
        return pcm_to_wav(pcm_data, sample_rate, channels, sample_width)
    
    try:
        # Create AudioSegment from raw PCM data
        audio = AudioSegment(
            pcm_data,
            frame_rate=sample_rate,
            channels=channels,
            sample_width=sample_width
        )
        
        # Export to MP3 format
        mp3_buffer = io.BytesIO()
        audio.export(mp3_buffer, format="mp3", bitrate="128k")
        mp3_buffer.seek(0)
        
        return mp3_buffer.read()
        
    except Exception as e:
        # Fall back to WAV if MP3 conversion fails
        return pcm_to_wav(pcm_data, sample_rate, channels, sample_width)

