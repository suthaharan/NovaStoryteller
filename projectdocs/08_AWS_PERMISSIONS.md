# AWS Permissions Required for Nova Storyteller

## Overview
Nova Storyteller uses Amazon Web Services (AWS) for AI-powered story generation and audio narration. This document outlines the required AWS permissions and setup.

## Required AWS Services

### 1. Amazon Bedrock
**Purpose:** Story generation (Nova Lite) and image analysis (Titan)

**Required Permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/amazon.nova-lite-v1:0",
        "arn:aws:bedrock:*::foundation-model/amazon.titan-embed-image-v1"
      ]
    }
  ]
}
```

**Models Used:**
- `amazon.nova-lite-v1:0` - Story text generation
- `amazon.titan-embed-image-v1` - Image analysis and description

**Note:** Bedrock foundation models are automatically enabled on first invocation. No manual activation needed.

### 2. Amazon Polly
**Purpose:** Text-to-speech conversion for story narration

**Required Permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "polly:SynthesizeSpeech"
      ],
      "Resource": "*"
    }
  ]
  ]
}
```

**Voices Used:**
- `Joanna` (en-US) - Neural voice
- `Amy` (en-GB)
- `Conchita` (es-ES)
- `Celine` (fr-FR)
- `Marlene` (de-DE)
- `Carla` (it-IT)

## IAM Policy Example

Here's a complete IAM policy that grants all required permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockAccess",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/amazon.nova-lite-v1:0",
        "arn:aws:bedrock:*::foundation-model/amazon.titan-embed-image-v1"
      ]
    },
    {
      "Sid": "PollyAccess",
      "Effect": "Allow",
      "Action": [
        "polly:SynthesizeSpeech"
      ],
      "Resource": "*"
    }
  ]
}
```

## Setup Instructions

### 1. Create IAM User
1. Go to AWS IAM Console
2. Create a new user (e.g., `novastoryteller-app`)
3. Attach the policy above (or create a custom policy with the permissions)

### 2. Generate Access Keys
1. Go to the IAM user's "Security credentials" tab
2. Click "Create access key"
3. Choose "Application running outside AWS"
4. Save the Access Key ID and Secret Access Key

### 3. Configure Environment Variables
Add to your `.env` file:

```bash
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_BEDROCK_REGION=us-east-1  # or your preferred region
AWS_REGION=us-east-1
```

### 4. Verify Region Support
Ensure your selected region supports:
- Amazon Bedrock (Nova Lite, Titan)
- Amazon Polly

**Supported Regions:**
- `us-east-1` (N. Virginia) ✅
- `us-west-2` (Oregon) ✅
- `eu-west-1` (Ireland) ✅
- `ap-southeast-1` (Singapore) ✅

Check AWS documentation for the latest region availability.

## Testing Permissions

### Test Bedrock Access
```bash
python scripts/test_nova.py
```

### Test Polly Access
The application will automatically test Polly when generating audio for stories.

## Troubleshooting

### Error: "Access Denied" or "UnauthorizedOperation"
- Check IAM user has the required permissions
- Verify access keys are correct in `.env`
- Ensure region is supported

### Error: "Model not found" or "Model access not enabled"
- Bedrock models are auto-enabled on first use
- Wait a few minutes and try again
- Check region supports the model

### Error: "No audio generated"
- Check Polly permissions
- Verify AWS credentials
- Check network connectivity
- Review Django console logs for detailed errors

## Cost Considerations

### Amazon Bedrock (Nova Lite)
- Pay-per-use pricing
- Check AWS pricing page for current rates

### Amazon Polly
- Pay-per-character pricing
- Neural voices cost more than standard voices
- Check AWS pricing page for current rates

## Security Best Practices

1. **Never commit credentials to Git**
   - Use `.env` file (already in `.gitignore`)
   - Use environment variables in production

2. **Use IAM roles in production**
   - For AWS-hosted deployments (EC2, ECS, Lambda)
   - More secure than access keys

3. **Rotate access keys regularly**
   - Every 90 days recommended
   - Update `.env` file when rotating

4. **Limit permissions**
   - Only grant necessary permissions
   - Use least privilege principle

## Additional Resources

- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Amazon Polly Documentation](https://docs.aws.amazon.com/polly/)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

