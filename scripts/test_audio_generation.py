#!/usr/bin/env python
"""
Test script to debug audio generation.
Run this to verify Polly and audio conversion are working.
"""
import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

def test_audio_generation():
    """Test audio generation step by step."""
    print("=" * 60)
    print("Audio Generation Debug Test")
    print("=" * 60)
    
    # Step 1: Check environment variables
    print("\n[Step 1] Checking environment variables...")
    aws_key = os.getenv('AWS_ACCESS_KEY_ID')
    aws_secret = os.getenv('AWS_SECRET_ACCESS_KEY')
    aws_region = os.getenv('AWS_REGION') or os.getenv('AWS_BEDROCK_REGION', 'us-east-1')
    
    if not aws_key or not aws_secret:
        print("❌ ERROR: AWS credentials not found in environment")
        print("   Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file")
        return False
    else:
        print(f"✅ AWS credentials found (Key ID: {aws_key[:10]}...)")
        print(f"✅ Region: {aws_region}")
    
    # Step 2: Test NovaService initialization
    print("\n[Step 2] Testing NovaService initialization...")
    try:
        from api.nova_service import NovaService
        nova = NovaService()
        print("✅ NovaService initialized successfully")
    except Exception as e:
        print(f"❌ ERROR: Failed to initialize NovaService: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Step 3: Test Polly directly
    print("\n[Step 3] Testing Amazon Polly directly...")
    try:
        test_text = "Hello, this is a test of Amazon Polly text to speech conversion."
        print(f"   Test text: {test_text}")
        
        pcm_audio = nova.synthesize_speech(test_text)
        
        if not pcm_audio or len(pcm_audio) == 0:
            print("❌ ERROR: No audio data returned from Polly")
            return False
        
        print(f"✅ Polly generated audio: {len(pcm_audio)} bytes")
    except Exception as e:
        print(f"❌ ERROR: Polly test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Step 4: Test PCM to MP3 conversion
    print("\n[Step 4] Testing PCM to MP3 conversion...")
    try:
        from api.utils import pcm_to_mp3
        mp3_data = pcm_to_mp3(pcm_audio, sample_rate=24000)
        
        if not mp3_data or len(mp3_data) == 0:
            print("❌ ERROR: MP3 conversion failed - no data")
            return False
        
        print(f"✅ MP3 conversion successful: {len(mp3_data)} bytes")
    except Exception as e:
        print(f"❌ ERROR: MP3 conversion failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Step 5: Save test file
    print("\n[Step 5] Saving test audio file...")
    try:
        test_file = project_root / 'test_audio_output.mp3'
        with open(test_file, 'wb') as f:
            f.write(mp3_data)
        print(f"✅ Test audio saved to: {test_file}")
        print(f"   File size: {len(mp3_data)} bytes")
        print(f"   Try playing this file to verify audio quality")
    except Exception as e:
        print(f"❌ ERROR: Failed to save test file: {e}")
        return False
    
    # Step 6: Test with longer text (like a story)
    print("\n[Step 6] Testing with longer story text...")
    try:
        story_text = """
        Once upon a time, there was a brave astronaut named Alex who loved exploring the stars.
        One day, Alex discovered a mysterious planet with friendly aliens.
        The aliens showed Alex their beautiful world filled with colorful flowers and singing birds.
        Alex and the aliens became great friends and explored the galaxy together.
        """
        
        print(f"   Story text length: {len(story_text)} characters")
        pcm_audio_long = nova.synthesize_speech(story_text)
        mp3_data_long = pcm_to_mp3(pcm_audio_long, sample_rate=24000)
        
        test_file_long = project_root / 'test_story_audio.mp3'
        with open(test_file_long, 'wb') as f:
            f.write(mp3_data_long)
        
        print(f"✅ Long story audio generated: {len(mp3_data_long)} bytes")
        print(f"   Saved to: {test_file_long}")
    except Exception as e:
        print(f"❌ ERROR: Long story test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print("\n" + "=" * 60)
    print("✅ All tests passed! Audio generation is working.")
    print("=" * 60)
    print("\nIf stories still don't generate audio, check:")
    print("  1. Django console logs when creating/regenerating stories")
    print("  2. Story has story_text populated")
    print("  3. Media directory permissions")
    print("  4. Check projectdocs/AUDIO_DEBUG_GUIDE.md for more details")
    
    return True

if __name__ == '__main__':
    success = test_audio_generation()
    sys.exit(0 if success else 1)

