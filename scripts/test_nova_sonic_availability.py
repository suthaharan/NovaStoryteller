#!/usr/bin/env python3
"""
Test script to check if Nova 2 Sonic API is available in AWS Bedrock.
"""
import os
import sys
import boto3
import json
from botocore.exceptions import ClientError

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

def test_nova_sonic_availability():
    """Test if Nova 2 Sonic is available in AWS Bedrock."""
    print("=" * 60)
    print("Testing Nova 2 Sonic API Availability")
    print("=" * 60)
    
    # Initialize Bedrock client
    try:
        bedrock_runtime = boto3.client(
            'bedrock-runtime',
            region_name=os.getenv('AWS_REGION', 'us-east-1')
        )
        bedrock = boto3.client(
            'bedrock',
            region_name=os.getenv('AWS_REGION', 'us-east-1')
        )
        print(f"✓ Bedrock clients initialized (region: {os.getenv('AWS_REGION', 'us-east-1')})")
    except Exception as e:
        print(f"✗ Failed to initialize Bedrock clients: {e}")
        return False
    
    # Test 1: List available foundation models
    print("\n1. Checking available foundation models...")
    try:
        response = bedrock.list_foundation_models()
        models = response.get('modelSummaries', [])
        
        nova_models = [m for m in models if 'nova' in m.get('modelId', '').lower()]
        
        print(f"   Found {len(models)} total models")
        print(f"   Found {len(nova_models)} Nova-related models:")
        
        for model in nova_models:
            model_id = model.get('modelId', '')
            model_name = model.get('modelName', 'N/A')
            print(f"     - {model_id} ({model_name})")
        
        # Check specifically for Nova Sonic
        nova_sonic_models = [m for m in nova_models if 'sonic' in m.get('modelId', '').lower()]
        if nova_sonic_models:
            print(f"\n   ✓ Found {len(nova_sonic_models)} Nova Sonic model(s)!")
            for model in nova_sonic_models:
                print(f"     Model ID: {model.get('modelId')}")
        else:
            print(f"\n   ✗ No Nova Sonic models found in foundation models list")
            
    except ClientError as e:
        print(f"   ✗ Error listing models: {e}")
        return False
    except Exception as e:
        print(f"   ✗ Unexpected error: {e}")
        return False
    
    # Test 2: Try to invoke Nova Sonic using ConverseStream API
    print("\n2. Testing ConverseStream API with Nova Sonic...")
    nova_sonic_model_id = "amazon.nova-2-sonic-v1:0"
    
    try:
        # Check if converse_stream method exists
        if hasattr(bedrock_runtime, 'converse_stream'):
            print(f"   ✓ converse_stream method is available")
            
            # Try a simple test call
            try:
                response = bedrock_runtime.converse_stream(
                    modelId=nova_sonic_model_id,
                    messages=[
                        {
                            "role": "user",
                            "content": [{"text": "Hello"}]
                        }
                    ]
                )
                print(f"   ✓ Successfully called converse_stream with {nova_sonic_model_id}")
                print(f"   ✓ Nova 2 Sonic API is ENABLED and accessible!")
                return True
            except ClientError as e:
                error_code = e.response.get('Error', {}).get('Code', '')
                error_message = e.response.get('Error', {}).get('Message', '')
                
                if error_code == 'ValidationException':
                    print(f"   ⚠ Validation error (model might not support this format): {error_message}")
                elif error_code == 'AccessDeniedException':
                    print(f"   ✗ Access denied: {error_message}")
                    print(f"   ✗ Nova 2 Sonic API might not be enabled for your account")
                elif error_code == 'ResourceNotFoundException':
                    print(f"   ✗ Model not found: {error_message}")
                    print(f"   ✗ Nova 2 Sonic might not be available in this region")
                else:
                    print(f"   ✗ Error calling API: {error_code} - {error_message}")
                return False
        else:
            print(f"   ✗ converse_stream method not available in boto3")
            print(f"   ✗ You may need to update boto3: pip install --upgrade boto3")
            return False
            
    except Exception as e:
        print(f"   ✗ Unexpected error: {e}")
        return False
    
    # Test 3: Check for invoke_model_with_bidirectional_stream (if it exists)
    print("\n3. Checking for bidirectional streaming API...")
    try:
        if hasattr(bedrock_runtime, 'invoke_model_with_bidirectional_stream'):
            print(f"   ✓ invoke_model_with_bidirectional_stream method exists")
        else:
            print(f"   ✗ invoke_model_with_bidirectional_stream method not available")
            print(f"   ✗ This method doesn't exist in standard boto3 BedrockRuntime client")
    except Exception as e:
        print(f"   ✗ Error checking method: {e}")
    
    # Test 4: Check AWS credentials
    print("\n4. Checking AWS credentials...")
    try:
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        print(f"   ✓ AWS credentials valid")
        print(f"   ✓ Account ID: {identity.get('Account')}")
        print(f"   ✓ User/Role: {identity.get('Arn')}")
    except Exception as e:
        print(f"   ✗ AWS credentials error: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("Summary:")
    print("=" * 60)
    print("Nova 2 Sonic bidirectional streaming requires:")
    print("1. Model access enabled in AWS Bedrock console")
    print("2. Correct IAM permissions for Bedrock")
    print("3. Model available in your region")
    print("4. Updated boto3 library (if using converse_stream)")
    print("\nNote: Nova 2 Sonic may use a different API endpoint")
    print("than standard Bedrock models. Check AWS documentation")
    print("for the latest API details.")
    print("=" * 60)
    
    return False

if __name__ == '__main__':
    success = test_nova_sonic_availability()
    sys.exit(0 if success else 1)

