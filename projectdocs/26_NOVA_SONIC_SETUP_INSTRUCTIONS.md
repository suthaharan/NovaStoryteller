# Nova 2 Sonic JavaScript Implementation - Setup Instructions

## Prerequisites

1. **Install AWS SDK v3** (run this manually):
```bash
cd frontend
npm install @aws-sdk/client-bedrock-runtime
```

2. **AWS Credentials** - Ensure your `.env` file has:
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

3. **AWS Permissions** - Your IAM user/role needs:
- `sts:GetSessionToken` (for temporary credentials)
- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithBidirectionalStream`

## Implementation Status

### ✅ Completed

1. **Backend Endpoint** (`/api/aws-credentials/`)
   - Returns temporary AWS credentials (15 minutes)
   - Uses AWS STS with scoped permissions
   - Located in `api/views.py`

2. **Nova Sonic Client Service** (`frontend/src/services/novaSonicClient.js`)
   - Client class for bidirectional streaming
   - Handles audio/text input/output
   - Ready for integration

3. **URL Configuration**
   - Endpoint registered in `api/urls.py`

### ⚠️ Pending

1. **Frontend Integration**
   - Update `VoiceStoryPlayer.jsx` to use Nova Sonic client
   - Replace WebSocket-based audio with direct AWS connection
   - Keep WebSocket for session coordination only

2. **AWS SDK Method Verification**
   - Verify `InvokeModelWithBidirectionalStream` method name in SDK v3
   - May need to adjust based on actual SDK API

## Next Steps

### Step 1: Install Package
```bash
cd frontend
npm install @aws-sdk/client-bedrock-runtime
```

### Step 2: Update VoiceStoryPlayer

The component needs to:
1. Fetch AWS credentials from `/api/aws-credentials/`
2. Initialize Nova Sonic client with credentials
3. Start bidirectional stream
4. Send audio from VoiceRecorder to Nova Sonic
5. Play audio responses from Nova Sonic

### Step 3: Test

1. Start voice session
2. Record audio
3. Verify bidirectional streaming works
4. Check audio playback

## Important Notes

1. **Credentials Security**: Never expose permanent AWS credentials in frontend code. Always use temporary credentials from backend.

2. **CORS Configuration**: Ensure your Django backend allows CORS for AWS Bedrock API calls if needed.

3. **SDK Version**: The actual method name for bidirectional streaming may differ. Check AWS SDK v3 documentation for the latest API.

4. **Error Handling**: Implement proper error handling for:
   - Credential expiration (refresh tokens)
   - Network failures
   - AWS API errors

## Troubleshooting

### "InvokeModelWithBidirectionalStream not found"
- Check AWS SDK v3 version
- Verify method name in SDK documentation
- May need to use different SDK or API approach

### "Access Denied" errors
- Check IAM permissions
- Verify credentials are valid
- Check region configuration

### Audio not playing
- Verify audio format (PCM, 24kHz)
- Check Web Audio API compatibility
- Verify audio context initialization

## References

- AWS SDK v3 JavaScript: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/
- Bedrock Runtime API: https://docs.aws.amazon.com/bedrock/latest/APIReference/
- Nova Sonic Overview: https://docs.aws.amazon.com/ai/responsible-ai/nova-sonic/overview.html

