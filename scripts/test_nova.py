#!/usr/bin/env python
"""
Test script for Amazon Nova integration.

This script tests the Nova service to ensure:
1. AWS credentials are configured correctly
2. Bedrock access is enabled
3. Nova models are accessible
4. Story generation works
5. Speech synthesis works (optional - saves audio file)

Usage:
    python scripts/test_nova.py
"""

import os
import sys
import django
from pathlib import Path

# Add project root to path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.nova_service import NovaService


def print_header(text):
    """Print a formatted header."""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)


def print_success(message):
    """Print success message."""
    print(f"✅ {message}")


def print_error(message):
    """Print error message."""
    print(f"❌ {message}")


def print_info(message):
    """Print info message."""
    print(f"ℹ️  {message}")


def test_nova_service_initialization():
    """Test Nova service initialization."""
    print_header("Testing Nova Service Initialization")
    
    try:
        nova = NovaService()
        print_success("Nova Service initialized successfully")
        print_info(f"Region: {nova.region}")
        print_info(f"Nova Lite Model: {nova.nova_lite_model}")
        print_info("Text-to-Speech: Amazon Polly (automatically available)")
        return nova
    except ValueError as e:
        print_error(f"Configuration error: {str(e)}")
        print_info("Please check your .env file for AWS credentials")
        return None
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        return None


def test_story_generation(nova):
    """Test story generation."""
    print_header("Testing Story Generation (Nova 2 Lite)")
    
    if not nova:
        print_error("Cannot test - Nova service not initialized")
        return False
    
    test_prompt = "Tell me a short story about a brave astronaut exploring a new planet"
    test_template = "adventure"
    
    print_info(f"Prompt: {test_prompt}")
    print_info(f"Template: {test_template}")
    print_info("Generating story...")
    
    try:
        story = nova.generate_story(
            prompt=test_prompt,
            template=test_template
        )
        
        print_success(f"Story generated successfully!")
        print_info(f"Story length: {len(story)} characters")
        print("\n" + "-" * 60)
        print("Story Preview:")
        print("-" * 60)
        # Print first 500 characters
        preview = story[:500] + "..." if len(story) > 500 else story
        print(preview)
        print("-" * 60)
        
        return True
        
    except Exception as e:
        print_error(f"Story generation failed: {str(e)}")
        print_info("Possible issues:")
        print_info("  - AWS credentials incorrect")
        print_info("  - Bedrock access not enabled")
        print_info("  - Nova 2 Lite model access not approved")
        print_info("  - Network connectivity issues")
        return False


def test_speech_synthesis(nova):
    """Test speech synthesis."""
    print_header("Testing Speech Synthesis (Amazon Polly)")
    
    if not nova:
        print_error("Cannot test - Nova service not initialized")
        return False
    
    test_text = "Hello! This is a test of Amazon Polly text to speech synthesis."
    
    print_info(f"Text: {test_text}")
    print_info("Synthesizing speech...")
    
    try:
        audio_data = nova.synthesize_speech(test_text)
        
        print_success(f"Speech synthesized successfully!")
        print_info(f"Audio size: {len(audio_data)} bytes")
        
        # Save audio file for testing
        test_audio_path = project_root / "test_audio.mp3"
        with open(test_audio_path, 'wb') as f:
            f.write(audio_data)
        
        print_success(f"Audio saved to: {test_audio_path}")
        print_info("You can play this file to verify audio quality")
        
        return True
        
    except Exception as e:
        print_error(f"Speech synthesis failed: {str(e)}")
        print_info("Possible issues:")
        print_info("  - AWS credentials incorrect")
        print_info("  - Bedrock access not enabled")
        print_info("  - Amazon Polly access (automatically available)")
        print_info("  - Network connectivity issues")
        return False


def test_image_analysis(nova):
    """Test image analysis (optional - requires test image)."""
    print_header("Testing Image Analysis (Titan Embeddings)")
    
    if not nova:
        print_error("Cannot test - Nova service not initialized")
        return False
    
    # Look for test image in project
    test_image_paths = [
        project_root / "test_image.jpg",
        project_root / "test_image.png",
        project_root / "media" / "test_image.jpg"
    ]
    
    test_image = None
    for path in test_image_paths:
        if path.exists():
            test_image = path
            break
    
    if not test_image:
        print_info("No test image found. Skipping image analysis test.")
        print_info("To test image analysis, place a test image at:")
        print_info("  - test_image.jpg (project root)")
        print_info("  - test_image.png (project root)")
        return None  # Not an error, just skipped
    
    print_info(f"Using test image: {test_image}")
    print_info("Analyzing image...")
    
    try:
        with open(test_image, 'rb') as f:
            image_bytes = f.read()
        
        description = nova.analyze_image(image_bytes)
        
        print_success("Image analyzed successfully!")
        print("\n" + "-" * 60)
        print("Image Description:")
        print("-" * 60)
        print(description)
        print("-" * 60)
        
        return True
        
    except Exception as e:
        print_error(f"Image analysis failed: {str(e)}")
        return False


def main():
    """Run all tests."""
    print_header("Amazon Nova Integration Test Suite")
    print_info("This script tests the integration with Amazon Bedrock Nova models")
    print_info("Make sure you have:")
    print_info("  1. AWS credentials in .env file")
    print_info("  2. Bedrock access enabled in AWS Console")
    print_info("  3. Nova 2 Lite model (auto-enabled on first use)")
    print_info("  4. Amazon Polly access (automatically available)")
    
    results = {
        'initialization': False,
        'story_generation': False,
        'speech_synthesis': False,
        'image_analysis': None
    }
    
    # Test 1: Initialize service
    nova = test_nova_service_initialization()
    results['initialization'] = nova is not None
    
    if not nova:
        print_header("Test Results Summary")
        print_error("Cannot continue - Nova service initialization failed")
        print_info("Please fix configuration issues and try again")
        sys.exit(1)
    
    # Test 2: Story generation
    results['story_generation'] = test_story_generation(nova)
    
    # Test 3: Speech synthesis
    results['speech_synthesis'] = test_speech_synthesis(nova)
    
    # Test 4: Image analysis (optional)
    results['image_analysis'] = test_image_analysis(nova)
    
    # Summary
    print_header("Test Results Summary")
    
    print(f"Service Initialization: {'✅ PASS' if results['initialization'] else '❌ FAIL'}")
    print(f"Story Generation:       {'✅ PASS' if results['story_generation'] else '❌ FAIL'}")
    print(f"Speech Synthesis:       {'✅ PASS' if results['speech_synthesis'] else '❌ FAIL'}")
    
    if results['image_analysis'] is not None:
        print(f"Image Analysis:         {'✅ PASS' if results['image_analysis'] else '❌ FAIL'}")
    else:
        print(f"Image Analysis:         ⏭️  SKIPPED (no test image)")
    
    # Overall result
    critical_tests = [
        results['initialization'],
        results['story_generation'],
        results['speech_synthesis']
    ]
    
    all_passed = all(critical_tests)
    
    print("\n" + "=" * 60)
    if all_passed:
        print_success("All critical tests passed! Nova integration is working.")
        print_info("You can now proceed with implementing the story creation feature.")
    else:
        print_error("Some tests failed. Please review the errors above.")
        print_info("Common fixes:")
        print_info("  - Verify AWS credentials in .env file")
        print_info("  - Check Bedrock model access in AWS Console")
        print_info("  - Ensure network connectivity to AWS")
    print("=" * 60)
    
    sys.exit(0 if all_passed else 1)


if __name__ == '__main__':
    main()

