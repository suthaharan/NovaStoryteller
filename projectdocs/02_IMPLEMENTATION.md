# Nova Storyteller - Implementation Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [User Management System](#user-management-system)
3. [Application Features & Flow](#application-features--flow)
4. [Amazon Nova Integration](#amazon-nova-integration)
5. [Implementation Steps](#implementation-steps)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Frontend Components](#frontend-components)

---

## Project Overview

Nova Storyteller is a simplified interactive storytelling application where:
- **One Superadmin** manages all users and system settings
- **Regular Users** register, sign in, and create interactive stories
- **Stories** are generated using Amazon Nova AI models with voice input/output
- **Simple Flow**: Register → Login → Create Story → Listen/Interact → Save Story

---

## User Management System

### User Roles

#### 1. Superadmin
- **Access**: Django Admin Panel (`/admin/`)
- **Capabilities**:
  - Manage all users (view, edit, activate/deactivate, delete)
  - View all stories created by users
  - System configuration
  - Access analytics and reports
- **Creation**: Created via Django `createsuperuser` command

#### 2. Regular Users
- **Access**: Main application interface
- **Capabilities**:
  - Register new account
  - Sign in/Sign out
  - Create new stories
  - View their own stories
  - Edit/Delete their own stories
  - Upload images for story generation
- **Registration**: Public registration endpoint (`/api/register/`)

### User Flow

```
┌─────────────────┐
│   New User      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Register      │
│   /api/register/│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Sign In       │
│   /api/login/   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Main App       │
│  (Dashboard)    │
└────────┬────────┘
         │
    ┌────┴────┐
    │        │
    ▼        ▼
┌──────┐  ┌──────────┐
│Create│  │View My   │
│Story │  │Stories   │
└──────┘  └──────────┘
```

---

## Application Features & Flow

### Core Features

#### 1. User Authentication
- **Registration**: Email, username, password, first name, last name
- **Login**: Email/username + password
- **Token-based Authentication**: Django REST Framework tokens
- **Session Management**: Token stored in localStorage (frontend)

#### 2. Story Creation
- **Voice Input**: Web Speech API for voice-to-text
- **Text Input**: Manual text input option
- **Image Upload**: Upload drawings/photos to incorporate into story
- **Story Templates**: Pre-defined templates (Adventure, Fantasy, Sci-Fi, Mystery, Educational)
- **Story Generation**: Amazon Nova 2 Lite for story generation
- **Voice Narration**: Amazon Nova 2 Sonic for speech-to-speech (via Bedrock bidirectional streaming API)

#### 3. Story Management
- **Save Stories**: Store in database with metadata
- **View Stories**: List all user's stories
- **Edit Stories**: Modify existing stories
- **Delete Stories**: Remove stories
- **Story History**: Track story creation and modification dates

#### 4. Interactive Storytelling
- **Real-time Adaptation**: Interrupt and modify story during narration
- **Character Voices**: Different voices for different characters
- **Story Continuation**: Resume paused stories
- **Story Sharing**: Share stories with others (future feature)

### Application Flow

#### Story Creation Flow

```
┌─────────────────────┐
│  User Dashboard     │
│  (My Stories)       │
└──────────┬──────────┘
           │
           │ Click "Create New Story"
           ▼
┌─────────────────────┐
│  Story Creation Page│
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │            │
    ▼            ▼
┌─────────┐  ┌──────────────┐
│Choose   │  │Upload Image  │
│Template │  │(Optional)    │
└────┬────┘  └──────┬───────┘
     │             │
     └──────┬──────┘
            │
            ▼
┌─────────────────────┐
│  Voice/Text Input   │
│  "Tell me a story   │
│   about..."         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Send to Backend    │
│  /api/stories/      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Backend calls      │
│  Amazon Nova API    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Generate Story     │
│  (Nova 2 Lite)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Convert to Speech  │
│  (Nova 2 Sonic)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Stream Audio       │
│  to Frontend        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Play Narration     │
│  (User Listens)     │
└──────────┬──────────┘
           │
           │ User can interrupt
           ▼
┌─────────────────────┐
│  Modify Story       │
│  (Real-time)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Save Story         │
│  (Database)         │
└─────────────────────┘
```

#### Story Listening Flow

```
┌─────────────────────┐
│  Select Story       │
│  from Dashboard     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Story Player Page  │
│  (Text + Audio)     │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │            │
    ▼            ▼
┌─────────┐  ┌──────────────┐
│Play     │  │Pause/Resume  │
│Story    │  │              │
└────┬────┘  └──────┬───────┘
     │             │
     └──────┬──────┘
            │
            ▼
┌─────────────────────┐
│  Audio Streaming    │
│  (Nova 2 Sonic)     │
└─────────────────────┘
```

---

## Amazon Nova Integration

### Prerequisites

1. **AWS Account**: Active AWS account with billing enabled
2. **AWS Bedrock Access**: Bedrock is automatically available in all AWS commercial regions (no manual activation needed)
3. **IAM User/Role**: Create IAM user with Bedrock permissions
4. **AWS Credentials**: Access Key ID and Secret Access Key

**Important**: 
- Nova 2 Lite, Nova 2 Sonic, and Titan Multimodal Embeddings are automatically enabled when first invoked - no manual model access request is required!
- **Nova 2 Sonic** is accessed through Bedrock's bidirectional streaming API but may not appear in the standard Bedrock catalog UI. It's available via API using model ID `amazon.nova-2-sonic-v1:0`.

### Step 1: AWS Account Setup

#### 1.1 Create AWS Account (if not exists)
- Go to https://aws.amazon.com/
- Sign up for AWS account
- Complete verification process

#### 1.2 Amazon Bedrock Model Access (Automatic)
**Important Update**: The Model access page has been retired. Serverless foundation models are now **automatically enabled** across all AWS commercial regions when first invoked in your account.

**No manual activation required!** The following models will be automatically enabled on first use:
- **Amazon Nova 2 Lite** (for text generation) - `amazon.nova-lite-v1:0`
- **Amazon Nova 2 Sonic** (for speech-to-speech) - `amazon.nova-2-sonic-v1:0`
- **Amazon Titan Multimodal Embeddings** (for image analysis) - `amazon.titan-embed-image-v1`

**Important Note**: Nova 2 Sonic is accessed through Bedrock's bidirectional streaming API but may not appear in the standard Bedrock catalog UI. It's available via API calls using the model ID `amazon.nova-2-sonic-v1:0`. See: https://docs.aws.amazon.com/ai/responsible-ai/nova-sonic/overview.html

**How it works:**
1. Models are automatically enabled when you first invoke them via the Bedrock API
2. No need to request access or wait for approval
3. Simply configure your AWS credentials and start using the models
4. The first API call will automatically enable the model for your account

**Note**: For models served from AWS Marketplace, a user with AWS Marketplace permissions must invoke the model once to enable it account-wide for all users.

### Step 2: IAM Setup

#### 2.1 Create IAM User
1. Go to **IAM** service in AWS Console
2. Click **Users** → **Create user**
3. Username: `novastoryteller-bedrock`
4. Select **Provide user access to the AWS Management Console** (optional)
5. Click **Next**

#### 2.2 Attach Permissions
1. Select **Attach policies directly**
2. Search and attach:
   - `AmazonBedrockFullAccess` (or create custom policy with minimal permissions)
3. Click **Next** → **Create user**

**Note**: If creating a custom policy, ensure it includes:
- `bedrock:InvokeModel` and `bedrock:InvokeModelWithResponseStream` for Bedrock (required for Nova Sonic bidirectional streaming)

#### 2.3 Create Access Keys
1. Click on the created user
2. Go to **Security credentials** tab
3. Click **Create access key**
4. Select **Application running outside AWS**
5. Click **Next** → **Create access key**
6. **IMPORTANT**: Download or copy:
   - **Access Key ID**
   - **Secret Access Key** (shown only once)

### Step 3: Set Up Python Environment

#### 3.1 Create/Recreate Virtual Environment

If your virtual environment has issues (e.g., broken Python interpreter path), recreate it:

```bash
# Navigate to project root
cd /Users/kurinchi/valet/novastoryteller

# Remove old venv (if broken)
rm -rf venv

# Create new venv with current Python
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate
```

#### 3.2 Install Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Install all requirements (includes boto3, PyMySQL, Django, etc.)
pip install -r requirements.txt
```

**Note**: The project uses **PyMySQL** instead of `mysqlclient` to avoid requiring system MySQL libraries. PyMySQL is a pure Python MySQL client that works without additional system dependencies.

**If you prefer to use `mysqlclient`** (for production or better performance):
1. Install MySQL client: `brew install mysql-client`
2. Set environment variables:
   ```bash
   export PATH="/opt/homebrew/opt/mysql-client/bin:$PATH"
   export LDFLAGS="-L/opt/homebrew/opt/mysql-client/lib"
   export CPPFLAGS="-I/opt/homebrew/opt/mysql-client/include"
   ```
3. Update `requirements.txt` to use `mysqlclient==2.2.7` instead of `PyMySQL==1.1.0`

### Step 4: Configure AWS Credentials

**✅ Status**: AWS credentials have been configured in `.env` file with Bedrock access.

#### Option A: Environment Variables (Recommended)

**Step 1: Create `.env` file** (if it doesn't exist)

In your project root directory (`/Users/kurinchi/valet/novastoryteller/`), create a `.env` file:

```bash
# Navigate to project root
cd /Users/kurinchi/valet/novastoryteller

# Create .env file (if it doesn't exist)
touch .env
```

**Step 2: Add AWS Configuration**

Open the `.env` file and add the following:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=us-east-1
AWS_BEDROCK_REGION=us-east-1
```

**Step 3: Replace placeholder values**

1. **AWS_ACCESS_KEY_ID**: Replace `your_access_key_id_here` with your actual AWS Access Key ID (from Step 2.3)
2. **AWS_SECRET_ACCESS_KEY**: Replace `your_secret_access_key_here` with your actual AWS Secret Access Key
3. **AWS_REGION**: Set to your preferred AWS region. Common options:
   - `us-east-1` (N. Virginia) - Recommended, fastest
   - `us-west-2` (Oregon)
   - `eu-west-1` (Ireland)
   - `ap-southeast-1` (Singapore)
   - See full list: https://docs.aws.amazon.com/general/latest/gr/bedrock.html
4. **AWS_BEDROCK_REGION**: Should match `AWS_REGION` (same region where you want to use Bedrock)

**Example `.env` file:**

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_BEDROCK_REGION=us-east-1
```

**Important Notes:**
- The `.env` file is already in `.gitignore`, so it won't be committed to Git
- Never share your AWS credentials publicly
- Both `AWS_REGION` and `AWS_BEDROCK_REGION` should be the same value
- Nova models are available in all AWS commercial regions

#### Option B: AWS Credentials File

Create `~/.aws/credentials`:

```ini
[default]
aws_access_key_id = your_access_key_id_here
aws_secret_access_key = your_secret_access_key_here
```

Create `~/.aws/config`:

```ini
[default]
region = us-east-1
```

### Step 5: Verify Bedrock Access (Optional)

Before creating the Nova service, you can verify that Bedrock is accessible in your region:

1. Log in to AWS Console
2. Navigate to **Amazon Bedrock** service
3. Go to **Playgrounds** or **API** section
4. Confirm you can see the available models (Nova models should appear automatically)

**Supported Regions**: Nova models are available in all AWS commercial regions including:
- `us-east-1` (N. Virginia) - Recommended
- `us-west-2` (Oregon)
- `eu-west-1` (Ireland)
- `ap-southeast-1` (Singapore)
- And other commercial regions

**Note**: Even if you don't see the models in the console, they will be automatically enabled on first API invocation.

### Step 6: Create Nova Service Module

Create `api/nova_service.py`:

```python
import boto3
import json
import os
from django.conf import settings
from botocore.exceptions import ClientError

class NovaService:
    """Service for interacting with Amazon Nova models via Bedrock."""
    
    def __init__(self):
        self.region = os.getenv('AWS_BEDROCK_REGION', 'us-east-1')
        self.bedrock_runtime = boto3.client(
            'bedrock-runtime',
            region_name=self.region,
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        
        # Model IDs (automatically enabled on first use - no manual activation needed)
        self.nova_lite_model = "amazon.nova-lite-v1:0"
        self.titan_embedding_model = "amazon.titan-embed-image-v1"
        
        # Nova Sonic is accessed via Bedrock API but may not appear in catalog UI
        # Uses bidirectional streaming API for real-time speech-to-speech
        self.nova_sonic_model = "amazon.nova-2-sonic-v1:0"
    
    def generate_story(self, prompt, image_description=None, template="adventure"):
        """
        Generate a story using Nova 2 Lite.
        
        Args:
            prompt: User's story prompt
            image_description: Description of uploaded image (optional)
            template: Story template type
        
        Returns:
            Generated story text
        """
        # Build system prompt
        system_prompt = self._get_system_prompt(template)
        
        # Build user message
        user_message = prompt
        if image_description:
            user_message += f"\n\nIncorporate this image into the story: {image_description}"
        
        try:
            # Use Bedrock Converse API
            response = self.bedrock_runtime.converse(
                modelId=self.nova_lite_model,
                messages=[
                    {
                        "role": "user",
                        "content": [{"text": user_message}]
                    }
                ],
                system=[{"text": system_prompt}],
                inferenceConfig={
                    "maxTokens": 2000,
                    "temperature": 0.7,
                    "topP": 0.9
                }
            )
            
            # Extract story text
            story_text = response['output']['message']['content'][0]['text']
            return story_text
            
        except ClientError as e:
            raise Exception(f"Error generating story: {str(e)}")
    
    def synthesize_speech(self, text, voice_id="Joanna", language_code="en-US"):
        """
        Convert text to speech using Amazon Nova 2 Sonic via Bedrock bidirectional streaming.
        
        Note: Nova Sonic is accessed through Bedrock but not shown in standard catalog UI.
        
        Args:
            text: Text to convert to speech
            voice_id: Voice ID for Nova Sonic (default: "default")
            language_code: Language code (default: "en-US")
                Supported: en-US, en-GB, es-ES, fr-FR, de-DE, it-IT
        
        Returns:
            Audio data (bytes)
        """
        try:
            # Use Bedrock Converse Stream API for Nova Sonic
            response = self.bedrock_runtime.converse_stream(
                modelId=self.nova_sonic_model,
                messages=[
                    {
                        "role": "user",
                        "content": [{"text": text}]
                    }
                ],
                system=[{"text": f"Language: {language_code}"}],
                inferenceConfig={
                    "maxTokens": 2000,
                    "temperature": 0.7
                },
                additionalModelRequestFields={
                    "voice": voice_id
                }
            )
            
            # Stream and collect audio chunks
            audio_chunks = []
            for event in response['stream']:
                if 'audioChunk' in event:
                    audio_chunks.append(event['audioChunk']['bytes'])
            
            # Combine all chunks
            audio_data = b''.join(audio_chunks)
            return audio_data
            
        except ClientError as e:
            raise Exception(f"Error synthesizing speech: {str(e)}")
    
    def analyze_image(self, image_bytes):
        """
        Analyze uploaded image using Titan Multimodal Embeddings.
        
        Args:
            image_bytes: Image file bytes
        
        Returns:
            Image description text
        """
        try:
            # Convert image to base64
            import base64
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            
            response = self.bedrock_runtime.converse(
                modelId=self.titan_embedding_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "image": {
                                    "format": "jpeg",  # or "png"
                                    "source": {
                                        "bytes": image_bytes
                                    }
                                }
                            },
                            {
                                "text": "Describe this image in detail for a children's story."
                            }
                        ]
                    }
                ]
            )
            
            description = response['output']['message']['content'][0]['text']
            return description
            
        except ClientError as e:
            raise Exception(f"Error analyzing image: {str(e)}")
    
    def _get_system_prompt(self, template):
        """Get system prompt based on template."""
        base_prompt = """You are Nova Storyteller, a fun, engaging AI companion for kids aged 5-12 or language learners. Your role is to create interactive bedtime or educational stories that adapt in real-time. Maintain story consistency, age-appropriate language (simple vocabulary, positive themes), and excitement.

Core Rules:
- Start with a user's prompt and build a short, 3-5 part story.
- Incorporate interruptions or changes immediately.
- If an image is described, weave it into the story naturally.
- Use expressive, varied voices for characters.
- Keep sessions under 5-10 minutes; end with a moral or question to engage.
- Adapt difficulty: For younger kids, short sentences; for learners, repeat key words."""
        
        template_prompts = {
            "adventure": "Create an exciting adventure story with heroes, quests, and discoveries.",
            "fantasy": "Create a magical fantasy story with wizards, dragons, and enchanted lands.",
            "sci-fi": "Create a science fiction story with space travel, robots, and futuristic technology.",
            "mystery": "Create a mystery story with clues, puzzles, and detective work.",
            "educational": "Create an educational story that teaches while entertaining."
        }
        
        template_instruction = template_prompts.get(template, template_prompts["adventure"])
        return f"{base_prompt}\n\nTemplate: {template_instruction}"
```

### Step 7: Seed Initial Data

Before testing Nova integration, you can seed the database with test data:

```bash
# Run the seeder command
python manage.py seed_data
```

This creates:
- **1 Superadmin**: `admin` / `password` (admin@test.com)
- **2 Staff Users**: `staff1`, `staff2` / `password`
- **5 Regular Users**: `user1`-`user5` / `password`
- **15 Sample Stories**: Various stories across all templates
- **Additional Data**: Permissions, Roles, Plans, Subscriptions, News, FAQs, Pages

**See `projectdocs/SEEDER_INFO.md` for complete details.**

**Test Credentials**:
- Admin: `admin` / `password`
- Regular User: `user1` / `password`

### Step 8: Test Nova Integration

Create `scripts/test_nova.py`:

```python
#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.nova_service import NovaService

def test_story_generation():
    """Test story generation."""
    print("Testing Nova Story Generation...")
    nova = NovaService()
    
    try:
        story = nova.generate_story(
            prompt="Tell me a story about a brave astronaut",
            template="adventure"
        )
        print("\n✅ Story Generated:")
        print(story)
        return True
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False

def test_speech_synthesis():
    """Test speech synthesis."""
    print("\nTesting Nova Speech Synthesis...")
    nova = NovaService()
    
    try:
        audio = nova.synthesize_speech("Hello, this is a test of Amazon Nova 2 Sonic.")
        print(f"\n✅ Audio Generated: {len(audio)} bytes")
        # Save to file for testing
        with open('test_audio.mp3', 'wb') as f:
            f.write(audio)
        print("Audio saved to test_audio.mp3")
        return True
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("Amazon Nova Integration Test")
    print("=" * 60)
    
    # Test story generation
    story_ok = test_story_generation()
    
    # Test speech synthesis
    speech_ok = test_speech_synthesis()
    
    print("\n" + "=" * 60)
    if story_ok and speech_ok:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed. Check AWS credentials and Bedrock access.")
    print("=" * 60)
```

Run test:
```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Run Nova integration test
python scripts/test_nova.py
```

**Expected Output**:
- ✅ Service Initialization: PASS
- ✅ Story Generation: PASS
- ✅ Speech Synthesis: PASS
- ⏭️ Image Analysis: SKIPPED (unless test image provided)

**First-time usage**: When you run the test for the first time, the models will be automatically enabled in your account. You may see a brief delay (1-2 seconds) on the first API call as the model is being activated in the background.

**Troubleshooting**:
- **Model not available error**: Wait a few seconds and try again. The first invocation enables the model automatically.
- **Access denied error**: Ensure your AWS credentials have Bedrock permissions:
  - `AmazonBedrockFullAccess` policy (or custom policy with `bedrock:InvokeModel` and `bedrock:InvokeModelWithResponseStream` permissions)
  - Nova Sonic requires bidirectional streaming API access
- **Region not supported**: Verify you're using a supported AWS commercial region (check the list in Step 5).
- **Billing required**: Ensure your AWS account has billing enabled (required for Bedrock usage).
- **Credentials not found**: Verify your `.env` file has `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_BEDROCK_REGION` set correctly.

---

## Implementation Steps

### Phase 1: Database Models

**Note**: The Story model has already been created. If you need to recreate migrations, follow the steps below.

#### 1.1 Create Story Model

Add to `api/models.py`:

```python
class Story(models.Model):
    """Story model for storing user-generated stories."""
    STORY_TEMPLATES = [
        ('adventure', 'Adventure'),
        ('fantasy', 'Fantasy'),
        ('sci-fi', 'Science Fiction'),
        ('mystery', 'Mystery'),
        ('educational', 'Educational'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stories')
    title = models.CharField(max_length=200)
    prompt = models.TextField(help_text="User's initial story prompt")
    story_text = models.TextField(help_text="Generated story text")
    template = models.CharField(max_length=20, choices=STORY_TEMPLATES, default='adventure')
    image = models.ImageField(upload_to='stories/images/', null=True, blank=True)
    image_description = models.TextField(blank=True, help_text="AI-generated image description")
    audio_file = models.FileField(upload_to='stories/audio/', null=True, blank=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Story'
        verbose_name_plural = 'Stories'
    
    def __str__(self):
        return f"{self.title} by {self.user.username}"
```

#### 1.2 Create Migration

```bash
python manage.py makemigrations
python manage.py migrate
```

### Phase 2: API Endpoints

#### 2.1 Create Story Serializer

Add to `api/serializers.py`:

```python
class StorySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Story
        fields = ['id', 'user', 'user_name', 'title', 'prompt', 'story_text', 
                  'template', 'image', 'image_description', 'audio_file', 
                  'is_published', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
```

#### 2.2 Create Story Views

Add to `api/views.py`:

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Story
from .serializers import StorySerializer
from .nova_service import NovaService
import os

class StoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing stories."""
    serializer_class = StorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return stories for the authenticated user."""
        if self.request.user.is_superuser:
            # Superadmin can see all stories
            return Story.objects.all()
        return Story.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Create story and generate content using Nova."""
        story = serializer.save(user=self.request.user)
        
        # Generate story using Nova
        nova = NovaService()
        
        # Analyze image if provided
        image_description = None
        if story.image:
            try:
                with open(story.image.path, 'rb') as f:
                    image_bytes = f.read()
                image_description = nova.analyze_image(image_bytes)
                story.image_description = image_description
            except Exception as e:
                print(f"Error analyzing image: {e}")
        
        # Generate story text
        try:
            story_text = nova.generate_story(
                prompt=story.prompt,
                image_description=image_description,
                template=story.template
            )
            story.story_text = story_text
            
            # Generate audio
            audio_data = nova.synthesize_speech(story_text)
            
            # Save audio file
            audio_filename = f"story_{story.id}.mp3"
            audio_path = os.path.join(settings.MEDIA_ROOT, 'stories', 'audio', audio_filename)
            os.makedirs(os.path.dirname(audio_path), exist_ok=True)
            
            with open(audio_path, 'wb') as f:
                f.write(audio_data)
            
            story.audio_file.name = f'stories/audio/{audio_filename}'
            story.save()
            
        except Exception as e:
            # If Nova fails, save story with error message
            story.story_text = f"Error generating story: {str(e)}"
            story.save()
            raise serializers.ValidationError(f"Failed to generate story: {str(e)}")
    
    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """Regenerate story with modifications."""
        story = self.get_object()
        modifications = request.data.get('modifications', '')
        
        nova = NovaService()
        new_prompt = f"{story.prompt}\n\nModifications: {modifications}"
        
        try:
            story_text = nova.generate_story(
                prompt=new_prompt,
                image_description=story.image_description,
                template=story.template
            )
            story.story_text = story_text
            story.save()
            
            return Response({'message': 'Story regenerated', 'story_text': story_text})
        except Exception as e:
            return Response(
                {'error': f"Failed to regenerate story: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

#### 2.3 Add Story URLs

Add to `api/urls.py`:

```python
router.register(r'stories', views.StoryViewSet, basename='story')
```

### Phase 3: Frontend Implementation

#### 3.1 Create Story Components

**Create `frontend/src/app/(other)/stories/StoriesList.jsx`**:

```jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthContext } from '@/context/useAuthContext';

const StoriesList = () => {
  const { token } = useAuthContext();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await axios.get('/api/stories/', {
        headers: { Authorization: `Token ${token}` }
      });
      setStories(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stories-list">
      <h1>My Stories</h1>
      <Link to="/stories/create" className="btn btn-primary">
        Create New Story
      </Link>
      {/* List stories */}
    </div>
  );
};

export default StoriesList;
```

**Create `frontend/src/app/(other)/stories/CreateStory.jsx`**:

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthContext } from '@/context/useAuthContext';

const CreateStory = () => {
  const { token } = useAuthContext();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    prompt: '',
    template: 'adventure',
    image: null
  });
  const [recording, setRecording] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Submit story creation
  };

  const startVoiceRecording = () => {
    // Web Speech API implementation
  };

  return (
    <div className="create-story">
      <h1>Create New Story</h1>
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>
    </div>
  );
};

export default CreateStory;
```

---

## Database Schema

### Stories Table

```sql
CREATE TABLE api_story (
    id UUID PRIMARY KEY,
    user_id INTEGER REFERENCES auth_user(id),
    title VARCHAR(200),
    prompt TEXT,
    story_text TEXT,
    template VARCHAR(20),
    image VARCHAR(100),
    image_description TEXT,
    audio_file VARCHAR(100),
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## API Endpoints

### Story Endpoints

- `GET /api/stories/` - List user's stories (all for superadmin)
- `POST /api/stories/` - Create new story
- `GET /api/stories/{id}/` - Get story details
- `PUT /api/stories/{id}/` - Update story
- `DELETE /api/stories/{id}/` - Delete story
- `POST /api/stories/{id}/regenerate/` - Regenerate story with modifications

### Authentication Endpoints

- `POST /api/register/` - Register new user
- `POST /api/login/` - Login user
- `POST /api/logout/` - Logout user
- `GET /api/current-user/` - Get current user info

---

## Frontend Components

### Required Components

1. **Dashboard** - List user's stories
2. **CreateStory** - Story creation form
3. **StoryPlayer** - Play story audio and display text
4. **StoryEditor** - Edit existing story
5. **VoiceRecorder** - Web Speech API wrapper
6. **ImageUploader** - Image upload component

---

## Next Steps

### Completed ✅

1. ✅ **AWS Bedrock Setup**: Credentials configured in `.env` file
2. ✅ **Python Environment**: Virtual environment recreated and dependencies installed
3. ✅ **Database Configuration**: PyMySQL configured (no system dependencies required)
4. ✅ **Nova Service Module**: Created `api/nova_service.py` with Nova 2 Lite, Nova 2 Sonic, and Titan integration
5. ✅ **Story Model**: Created and migrated to database
6. ✅ **API Endpoints**: StoryViewSet implemented with CRUD operations and regenerate action
7. ✅ **Seeder Data**: Management command created to seed test data (users, stories, etc.)

### In Progress / Next Steps

8. **Test Nova Integration**:
   ```bash
   # Run Nova integration test
   python scripts/test_nova.py
   ```
   - Verify story generation works
   - Verify speech synthesis works
   - Verify image analysis works (if image provided)

9. **Seed Initial Data**:
   ```bash
   # Create test users and sample stories
   python manage.py seed_data
   ```
   - Creates 1 superadmin (`admin` / `password`)
   - Creates 2 staff users (`staff1`, `staff2` / `password`)
   - Creates 5 regular users (`user1`-`user5` / `password`)
   - Creates 15 sample stories
   - See `projectdocs/SEEDER_INFO.md` for full details

10. **Test API Endpoints**:
    ```bash
    # Start Django development server
    python manage.py runserver
    
    # Test endpoints (use Postman, curl, or frontend)
    # - POST /api/login/ (login with seeded users)
    # - GET /api/stories/ (list stories)
    # - POST /api/stories/ (create new story with Nova AI)
    ```

11. **Frontend Development**:
    - Create Story List component
    - Create Story Creation form with voice input
    - Create Story Player component
    - Integrate with API endpoints
    - Test end-to-end story creation flow

12. **Production Deployment**:
    - Set up production database (MySQL)
    - Configure production settings
    - Deploy backend (Railway/Render/AWS)
    - Deploy frontend (Vercel/Netlify)
    - Set up environment variables in production

---

## Recent Changes & Updates

### Database Configuration
- **PyMySQL**: Switched from `mysqlclient` to `PyMySQL` (pure Python, no system dependencies)
- **Configuration**: Added PyMySQL setup in `backend/settings.py` to work with Django's MySQL backend
- **Benefits**: Easier installation, no need for system MySQL client libraries

### Virtual Environment
- **Recreated**: Virtual environment recreated with current Python 3.14.2 interpreter
- **Dependencies**: All packages installed via `requirements.txt` including:
  - `boto3>=1.34.0` (AWS SDK)
  - `PyMySQL==1.1.0` (MySQL client)
  - `Django==6.0` and all other dependencies

### AWS Configuration
- **✅ Credentials Configured**: AWS Bedrock credentials added to `.env` file
- **Nova Models**: Ready to use Nova 2 Lite, Nova 2 Sonic, and Titan Multimodal Embeddings
- **Auto-Enablement**: Models automatically enabled on first API invocation

### Seeder Data
- **Management Command**: `python manage.py seed_data` creates comprehensive test data
- **Test Users**: 1 admin, 2 staff, 5 regular users (all with password: `password`)
- **Sample Stories**: 15 stories across all templates for testing
- **See**: `projectdocs/SEEDER_INFO.md` for complete seeder documentation

### Implementation Status
- ✅ Database models created and migrated
- ✅ Nova service module implemented
- ✅ API endpoints implemented (StoryViewSet)
- ✅ Seeder command created
- ⏳ Frontend components (next step)
- ⏳ End-to-end testing (next step)

## Notes

- All markdown documentation should be in `projectdocs/` folder
- This folder is excluded from git (see `.gitignore`)
- Update this document as implementation progresses
- **Current Status**: Backend implementation complete, ready for frontend development and testing

