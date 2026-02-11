# Nova 2 Sonic API Status

## Test Results

**Date**: 2026-02-11  
**Test Script**: `scripts/test_nova_sonic_availability.py`

### Findings

1. ✅ **`converse_stream` API exists** in boto3 BedrockRuntime client
2. ❌ **Nova 2 Sonic does NOT support `converse_stream`**
   - Error: `"This action doesn't support the model that you provided. Try again with a supported text or chat model."`
   - **Reason**: Nova 2 Sonic is a **speech-to-speech** model, not a text/chat model
   - `converse_stream` is designed for text/chat models (like Nova Lite, Claude, etc.)

3. ❌ **`InvokeModelWithBidirectionalStream` is NOT available** in standard boto3
   - This is the API that Nova 2 Sonic actually requires
   - It's not implemented in the standard `bedrock-runtime` client

## Current Status

### ✅ What Works
- **Amazon Polly** for text-to-speech narration
- Story generation with Nova 2 Lite
- Image analysis with Titan Multimodal Embeddings
- WebSocket infrastructure for real-time communication

### ❌ What Doesn't Work
- **Nova 2 Sonic bidirectional streaming** via standard boto3
- The `InvokeModelWithBidirectionalStream` API is not available in Python boto3

## Why This Matters

Nova 2 Sonic is designed for:
- **Bidirectional speech-to-speech** conversations
- **Real-time audio streaming** (16kHz input, 24kHz output)
- **Interactive voice** storytelling where users can interrupt and modify stories

However, the API required (`InvokeModelWithBidirectionalStream`) is:
- Not available in standard boto3 BedrockRuntime client
- May require a different AWS SDK (Java, JavaScript, .NET, Rust, Swift)
- May require a custom implementation
- May not be publicly available yet

## Current Implementation

The application currently uses **Amazon Polly** for narration, which:
- ✅ Works perfectly for text-to-speech
- ✅ Supports multiple voices
- ✅ Has low latency
- ✅ Is fully supported in boto3
- ✅ Produces high-quality audio

## Future Options

If Nova 2 Sonic bidirectional streaming becomes available:

1. **Wait for boto3 support** - AWS may add `InvokeModelWithBidirectionalStream` to boto3
2. **Use a different SDK** - Java, JavaScript, or .NET SDKs may have support
3. **Custom implementation** - Build a custom client using AWS SDK for another language
4. **AWS API Gateway** - Use API Gateway to proxy requests to Nova Sonic

## Recommendation

**Continue using Amazon Polly** for narration. It:
- Works reliably
- Has excellent voice quality
- Supports all required features
- Is fully integrated and tested

Nova 2 Sonic would add value for **interactive voice conversations** (speech-to-speech), but for simple text-to-speech narration, Polly is sufficient and more reliable.

## References

- AWS Bedrock Documentation: https://docs.aws.amazon.com/bedrock/
- Nova Sonic Overview: https://docs.aws.amazon.com/ai/responsible-ai/nova-sonic/overview.html
- boto3 Bedrock Runtime: https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/bedrock-runtime.html

