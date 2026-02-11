"""
Amazon Nova Service for story generation and speech synthesis.

This module provides integration with Amazon Bedrock's Nova models:
- Nova 2 Lite: Story generation and text completion
- Nova 2 Sonic: Speech-to-speech synthesis via InvokeModelWithBidirectionalStream API
- Titan Multimodal Embeddings: Image analysis

Nova 2 Sonic enables bidirectional speech-to-speech conversations with:
- Real-time audio streaming (16kHz input, 24kHz output)
- Contextual awareness and conversation memory
- Interruptible responses
- Multiple expressive voices for characters
- Multi-language support (en-US, en-GB, es-ES, fr-FR, de-DE, it-IT)
"""

import boto3
import json
import os
import base64
import io
import struct
from django.conf import settings
from botocore.exceptions import ClientError


class NovaService:
    """Service for interacting with Amazon Nova models via Bedrock."""
    
    def __init__(self):
        """Initialize Bedrock client with credentials from environment."""
        self.region = os.getenv('AWS_BEDROCK_REGION', os.getenv('AWS_REGION', 'us-east-1'))
        
        # Get AWS credentials from environment
        aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
        aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        
        if not aws_access_key or not aws_secret_key:
            raise ValueError(
                "AWS credentials not found. Please set AWS_ACCESS_KEY_ID and "
                "AWS_SECRET_ACCESS_KEY in your .env file."
            )
        
        # Initialize Bedrock Runtime client
        self.bedrock_runtime = boto3.client(
            'bedrock-runtime',
            region_name=self.region,
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key
        )
        
        # Model IDs for Amazon Bedrock
        self.nova_lite_model = "amazon.nova-lite-v1:0"
        self.nova_sonic_model = "amazon.nova-2-sonic-v1:0"  # Speech-to-speech model
        self.titan_embedding_model = "amazon.titan-embed-image-v1"
        # Image generation models
        # Note: Nova Canvas doesn't support programmatic image generation via API
        # Using Titan Image Generator v2 as primary (most reliable for programmatic use)
        # Stable Diffusion XL as fallback
        self.titan_image_generator_model = "amazon.titan-image-generator-v2:0"  # Primary
        self.stable_diffusion_model = "stability.stable-diffusion-xl-base-v1:0"  # Fallback
        
        # Initialize Polly client for text-to-audio conversion (AWS-native)
        # Used in hybrid approach: Text → Polly (PCM) → Nova 2 Sonic → Enhanced PCM
        # Polly supports direct PCM output at 16kHz, perfect for Nova 2 Sonic input
        self.polly_client = boto3.client(
            'polly',
            region_name=self.region,
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key
        )
    
    def generate_story(self, prompt, image_description=None, template="adventure", user_settings=None, return_system_prompt=False):
        """
        Generate a story using Nova 2 Lite.
        
        Args:
            prompt (str): User's story prompt (e.g., "Tell me a story about a brave astronaut")
            image_description (str, optional): Description of uploaded image
            template (str): Story template type (adventure, fantasy, sci-fi, mystery, educational)
            user_settings (UserStorySettings, optional): User's story generation settings
            return_system_prompt (bool): If True, returns tuple (story_text, system_prompt)
        
        Returns:
            str or tuple: Generated story text, or (story_text, system_prompt) if return_system_prompt=True
        
        Raises:
            Exception: If story generation fails
        """
        # Build system prompt based on template and user settings
        system_prompt = self._get_system_prompt(template, user_settings)
        
        # Build user message
        user_message = prompt
        if image_description:
            user_message += f"\n\nIncorporate this image into the story: {image_description}"
        
        try:
            # Use Bedrock Converse API for Nova Lite
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
            
            # Extract story text from response
            story_text = response['output']['message']['content'][0]['text']
            
            if return_system_prompt:
                return story_text, system_prompt
            return story_text
            
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_message = e.response.get('Error', {}).get('Message', str(e))
            raise Exception(
                f"Error generating story (Code: {error_code}): {error_message}. "
                f"Please check your AWS credentials and Bedrock model access."
            )
        except Exception as e:
            raise Exception(f"Unexpected error generating story: {str(e)}")
    
    def synthesize_speech_from_text(self, text, voice_id=None, system_prompt=None, language_code="en-US"):
        """
        Convert text to speech using Amazon Polly (with Nova 2 Sonic placeholder).
        
        Currently uses Amazon Polly directly for reliable text-to-speech.
        Nova 2 Sonic bidirectional streaming will be implemented in a future update.
        
        Args:
            text (str): Text to convert to speech
            voice_id (str, optional): Voice ID (e.g., 'Joanna', 'Matthew', 'Joey'). If None, uses default.
            system_prompt (str, optional): System prompt for Nova Sonic behavior (not used currently)
            language_code (str): Language code (default: "en-US")
                Supported: en-US, en-GB, es-ES, fr-FR, de-DE, it-IT
        
        Returns:
            bytes: Audio data in PCM format (16kHz)
        
        Raises:
            Exception: If speech synthesis fails
        """
        try:
            # Convert text to PCM audio using Amazon Polly (AWS-native, reliable)
            from .utils import text_to_audio_pcm
            
            # Convert text to PCM audio using Amazon Polly (16kHz output)
            # Pass voice_id to ensure correct voice is used
            pcm_audio = text_to_audio_pcm(
                text,
                polly_client=self.polly_client,
                language_code=language_code,
                sample_rate=16000,
                voice_id=voice_id  # Pass voice_id to text_to_audio_pcm
            )
            
            # Return 16kHz PCM audio directly (no upsampling to avoid distortion)
            return pcm_audio
            
        except Exception as e:
            raise Exception(f"Error converting text to speech: {str(e)}")
    
    def synthesize_speech_from_audio(self, audio_bytes, system_prompt=None, language_code="en-US"):
        """
        Convert audio input to speech output using Nova 2 Sonic.
        
        NOTE: Nova 2 Sonic bidirectional streaming is complex and requires WebSocket setup.
        For now, we'll use Polly directly for text-to-speech as a reliable fallback.
        This can be enhanced later with proper Nova 2 Sonic streaming implementation.
        
        Args:
            audio_bytes (bytes): Audio data in PCM format (16kHz, mono)
            system_prompt (str, optional): System prompt for Nova Sonic behavior
            language_code (str): Language code (default: "en-US")
        
        Returns:
            bytes: Audio data in PCM format (24kHz) - currently returns input audio upsampled
        """
        # For now, return the input audio (Polly output) as-is
        # Nova 2 Sonic bidirectional streaming requires complex WebSocket implementation
        # This is a placeholder - in production, implement proper streaming
        return audio_bytes
    
    def start_sonic_conversation(self, system_prompt=None, language_code="en-US"):
        """
        Start a bidirectional speech-to-speech conversation with Nova 2 Sonic.
        
        This method sets up a streaming connection for real-time audio conversations.
        Use this for interactive voice storytelling where users can interrupt and modify stories.
        
        Args:
            system_prompt (str, optional): System prompt defining Nova Sonic's role and behavior
            language_code (str): Language code (default: "en-US")
        
        Returns:
            NovaSonicStream: Stream handler for bidirectional audio
        
        Example:
            stream = nova.start_sonic_conversation(
                system_prompt="You are a storyteller for children. Tell engaging stories.",
                language_code="en-US"
            )
            # Send audio
            stream.send_audio(audio_bytes)
            # Receive audio
            for audio_chunk in stream.receive_audio():
                # Process audio chunk
                pass
        """
        return NovaSonicStream(
            bedrock_client=self.bedrock_runtime,
            model_id=self.nova_sonic_model,
            system_prompt=system_prompt,
            language_code=language_code
        )
    
    def synthesize_speech(self, text, voice_id=None, language_code="en-US"):
        """
        Convert text to speech using Amazon Polly.
        
        This is the main method for text-to-speech using Amazon Polly directly.
        
        Args:
            text (str): Text to convert to speech
            voice_id (str): Voice ID (e.g., 'Joanna', 'Matthew', 'Joey'). If None, uses default.
            language_code (str): Language code (default: "en-US")
                Supported: en-US, en-GB, es-ES, fr-FR, de-DE, it-IT
        
        Returns:
            bytes: Audio data in PCM format (16kHz)
        """
        return self.synthesize_speech_from_text(text, voice_id=voice_id, language_code=language_code)
    
    def analyze_image(self, image_bytes, image_format="jpeg"):
        """
        Analyze uploaded image using Titan Multimodal Embeddings.
        
        Args:
            image_bytes (bytes): Image file bytes
            image_format (str): Image format ("jpeg" or "png")
        
        Returns:
            str: Image description text
        
        Raises:
            Exception: If image analysis fails
        """
        try:
            # Use Bedrock Converse API with image input
            response = self.bedrock_runtime.converse(
                modelId=self.titan_embedding_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "image": {
                                    "format": image_format,
                                    "source": {
                                        "bytes": image_bytes
                                    }
                                }
                            },
                            {
                                "text": "Describe this image in detail for a children's story. Focus on characters, objects, colors, and setting."
                            }
                        ]
                    }
                ],
                inferenceConfig={
                    "maxTokens": 500,
                    "temperature": 0.3
                }
            )
            
            # Extract description from response
            description = response['output']['message']['content'][0]['text']
            return description
            
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_message = e.response.get('Error', {}).get('Message', str(e))
            raise Exception(
                f"Error analyzing image (Code: {error_code}): {error_message}. "
                f"Please check your AWS credentials and Bedrock model access."
            )
        except Exception as e:
            raise Exception(f"Unexpected error analyzing image: {str(e)}")
    
    def regenerate_story(self, original_prompt, modifications, image_description=None, template="adventure"):
        """
        Regenerate a story with modifications based on user input.
        
        Args:
            original_prompt (str): Original story prompt
            modifications (str): User's modifications (e.g., "Make the astronaut have a pet robot")
            image_description (str, optional): Description of uploaded image
            template (str): Story template type
        
        Returns:
            str: Regenerated story text
        """
        # Combine original prompt with modifications
        new_prompt = f"{original_prompt}\n\nUser requested changes: {modifications}"
        
        return self.generate_story(
            prompt=new_prompt,
            image_description=image_description,
            template=template
        )
    
    def generate_image(self, prompt, width=1024, height=1024, style_preset="photographic"):
        """
        Generate an image from a text prompt using Amazon Bedrock.
        
        Tries Stable Diffusion XL first, falls back to Titan Image Generator if not available.
        
        Args:
            prompt (str): Text prompt describing the image to generate
            width (int): Image width in pixels (default: 1024)
            height (int): Image height in pixels (default: 1024, portrait orientation)
            style_preset (str): Style preset for Stable Diffusion (default: "photographic")
        
        Returns:
            bytes: Generated image as PNG/JPEG bytes
        
        Raises:
            Exception: If image generation fails
        """
        errors = []
        
        # Try Titan Image Generator v2 first (most reliable for programmatic use)
        try:
            # Titan Image Generator v2 request format
            request_body = {
                "taskType": "TEXT_IMAGE",
                "textToImageParams": {
                    "text": prompt,
                    "width": width,
                    "height": height,
                    "numberOfImages": 1
                }
            }
            
            response = self.bedrock_runtime.invoke_model(
                modelId=self.titan_image_generator_model,
                body=json.dumps(request_body),
                contentType="application/json",
                accept="application/json"
            )
            
            response_body = json.loads(response['body'].read())
            
            # Titan v2 returns images in 'images' array as base64 strings
            if 'images' in response_body and len(response_body['images']) > 0:
                image_base64 = response_body['images'][0]
                if image_base64:
                    image_bytes = base64.b64decode(image_base64)
                    return image_bytes
            
            errors.append("Titan Image Generator: Empty response")
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_message = e.response.get('Error', {}).get('Message', str(e))
            errors.append(f"Titan Image Generator: {error_code} - {error_message}")
        except Exception as e:
            errors.append(f"Titan Image Generator: {str(e)}")
        
        # Try Stable Diffusion XL as fallback (uses InvokeModel)
        try:
            request_body = {
                "text_prompts": [
                    {
                        "text": prompt,
                        "weight": 1.0
                    }
                ],
                "cfg_scale": 7,
                "height": height,
                "width": width,
                "steps": 50,
                "style_preset": style_preset
            }
            
            response = self.bedrock_runtime.invoke_model(
                modelId=self.stable_diffusion_model,
                body=json.dumps(request_body),
                contentType="application/json",
                accept="application/json"
            )
            
            response_body = json.loads(response['body'].read())
            
            if 'artifacts' in response_body and len(response_body['artifacts']) > 0:
                image_base64 = response_body['artifacts'][0].get('base64')
                if image_base64:
                    image_bytes = base64.b64decode(image_base64)
                    return image_bytes
            
            errors.append("Stable Diffusion XL: Empty response")
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_message = e.response.get('Error', {}).get('Message', str(e))
            errors.append(f"Stable Diffusion XL: {error_code} - {error_message}")
        except Exception as e:
            errors.append(f"Stable Diffusion XL: {str(e)}")
        
        # All models failed
        raise Exception(
            f"All image generation models failed:\n" + "\n".join(f"- {err}" for err in errors) + 
            "\n\nPlease check your AWS Bedrock model access and ensure at least one image generation model is enabled in your region."
        )
    
    def parse_story_parts(self, story_text):
        """
        Parse story text to extract parts/chapters.
        
        Looks for patterns like:
        - Markdown headers: "### Part 5", "### Scene 5", "## Part 2", etc.
        - "Part 1:", "Part 2:", etc.
        - "Chapter 1:", "Chapter 2:", etc.
        - "Scene 1:", "Scene 2:", etc.
        - Numbered sections: "1.", "2.", etc. (if they appear as major sections)
        
        Args:
            story_text (str): Full story text
        
        Returns:
            list: List of dictionaries with 'number' and 'text' keys, or single item if no parts found
        """
        import re
        
        if not story_text or not story_text.strip():
            return []
        
        parts = []
        
        # First, try markdown headers (### Part 5, ### Scene 5, ## Part 2, etc.)
        # Pattern: ### Part 5, ### Scene 5, ## Chapter 3, etc.
        markdown_pattern = r'(?i)^#{1,6}\s+(?:Part|Chapter|Scene)\s+(\d+)\s*$'
        markdown_matches = list(re.finditer(markdown_pattern, story_text, re.MULTILINE))
        
        if markdown_matches:
            # Split text by markdown headers
            lines = story_text.split('\n')
            current_part = None
            current_text = []
            
            for line in lines:
                # Check if this line is a markdown header
                header_match = re.match(markdown_pattern, line.strip())
                if header_match:
                    # Save previous part if exists
                    if current_part is not None:
                        part_text = '\n'.join(current_text).strip()
                        if part_text:
                            parts.append({
                                'number': current_part,
                                'text': part_text
                            })
                    
                    # Start new part
                    current_part = int(header_match.group(1))
                    current_text = []
                else:
                    # Add line to current part
                    if current_part is not None:
                        current_text.append(line)
            
            # Save last part
            if current_part is not None:
                part_text = '\n'.join(current_text).strip()
                if part_text:
                    parts.append({
                        'number': current_part,
                        'text': part_text
                    })
        
        # If no markdown headers found, try regular patterns
        if not parts:
            # Patterns to match: "Part 1:", "Chapter 2:", "Scene 3:", etc.
            part_patterns = [
                r'(?i)^(?:Part|Chapter|Scene)\s+(\d+)[:\.]\s*(.+?)(?=(?:Part|Chapter|Scene)\s+\d+[:\.]|$)',
                r'(?i)^(\d+)[:\.]\s+(.+?)(?=^\d+[:\.]|$)',  # Numbered sections (1., 2., etc.)
            ]
            
            # Try first pattern (Part/Chapter/Scene)
            matches = re.finditer(part_patterns[0], story_text, re.MULTILINE | re.DOTALL)
            for match in matches:
                part_num = int(match.group(1))
                part_text = match.group(2).strip()
                if part_text:
                    parts.append({
                        'number': part_num,
                        'text': part_text
                    })
            
            # If no parts found with first pattern, try numbered sections
            if not parts:
                matches = re.finditer(part_patterns[1], story_text, re.MULTILINE | re.DOTALL)
                for match in matches:
                    part_num = int(match.group(1))
                    part_text = match.group(2).strip()
                    # Only include if it's a substantial section (at least 50 chars)
                    if part_text and len(part_text) > 50:
                        parts.append({
                            'number': part_num,
                            'text': part_text
                        })
        
        # If still no parts found, return the entire story as a single scene
        if not parts:
            parts.append({
                'number': 1,
                'text': story_text.strip()
            })
        
        # Sort by number to ensure correct order
        parts.sort(key=lambda x: x['number'])
        
        return parts
    
    def _get_system_prompt(self, template, user_settings=None):
        """
        Get system prompt based on story template and user settings.
        
        Args:
            template (str): Story template type
            user_settings (UserStorySettings, optional): User's story generation settings
        
        Returns:
            str: System prompt for the template with user settings applied
        """
        # Base system prompt based on user requirements
        base_prompt = """You are Ace Storyteller, a fun, positive AI companion for kids aged 3-12. Your role is to create interactive, educational stories that spark imagination, teach gentle lessons, and adapt to the child's input. Always keep stories age-appropriate: short and simple for younger kids (3-5: 200-300 words, basic words), engaging with some challenges for mid-ages (6-8: 400-500 words, introduce morals), and adventurous with deeper themes for older kids (9-12: 600-700 words, encourage critical thinking).

Core Rules:
- Themes: Positive, inclusive, adventurous. Focus on friendship, kindness, bravery, curiosity, and learning from mistakes. Avoid scary, violent, or negative elements.
- Structure: 4-6 parts with a beginning (setup characters/world), middle (adventure/challenge), end (resolution + moral). Pause for input if interactive.
- Language: Simple vocabulary, short sentences for young kids; build complexity for older. Use repetition for learners. Make it vivid and fun with sounds (e.g., "Whoosh!").
- Adaptation: Incorporate user details exactly (e.g., if they say "pet robot", add it seamlessly). If multimodal (e.g., image description), weave it in (e.g., "The hero found your drawn castle!").
- End: Always include a moral (e.g., "Friendship makes us stronger") and a question to continue (e.g., "What happens next?").

If age is specified, adjust accordingly. If not, default to 6-8. Start narrating in an expressive, storytelling voice."""
        
        # Apply user settings if provided
        if user_settings:
            # Get preset string from user settings
            presets = user_settings.get_system_prompt_presets()
            base_prompt += f"\n\nPresets:\n{presets}"
        
        template_prompts = {
            "adventure": "Create an exciting adventure story with brave heroes, exciting quests, and amazing discoveries. Include elements like treasure, maps, and overcoming challenges.",
            "fantasy": "Create a magical fantasy story with wizards, dragons, enchanted lands, and mystical creatures. Include elements like magic spells, quests, and good vs. evil.",
            "sci-fi": "Create a science fiction story with space travel, robots, futuristic technology, and alien worlds. Include elements like spaceships, planets, and scientific discoveries.",
            "mystery": "Create a mystery story with clues, puzzles, detective work, and solving problems. Include elements like hidden objects, secret codes, and finding answers.",
            "educational": "Create an educational story that teaches while entertaining. Include facts, learning moments, and positive messages about topics like nature, science, or history."
        }
        
        template_instruction = template_prompts.get(template.lower(), template_prompts["adventure"])
        return f"{base_prompt}\n\nTemplate Style: {template_instruction}"


# Example usage (for testing)
if __name__ == "__main__":
    import sys
    import os
    
    # Add project root to path
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Test Nova service
    try:
        nova = NovaService()
        print("✅ Nova Service initialized successfully")
        
        # Test story generation
        print("\n📖 Testing story generation...")
        story = nova.generate_story(
            prompt="Tell me a story about a brave astronaut",
            template="adventure"
        )
        print(f"Story generated ({len(story)} characters)")
        print(f"Preview: {story[:200]}...")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)


class NovaSonicStream:
    """
    Handler for bidirectional streaming with Nova 2 Sonic.
    
    This class manages the InvokeModelWithBidirectionalStream API call
    for real-time speech-to-speech conversations.
    """
    
    def __init__(self, bedrock_client, model_id, system_prompt=None, language_code="en-US"):
        """
        Initialize Nova Sonic bidirectional stream.
        
        Args:
            bedrock_client: boto3 bedrock-runtime client
            model_id: Nova Sonic model ID (amazon.nova-2-sonic-v1:0)
            system_prompt: System prompt for conversation context
            language_code: Language code (default: "en-US")
        """
        self.bedrock_client = bedrock_client
        self.model_id = model_id
        self.system_prompt = system_prompt or "You are a helpful assistant."
        self.language_code = language_code
        self.event_stream = None
        
    def _create_request_body(self, audio_bytes=None, text_input=None):
        """
        Create request body for Nova Sonic API.
        
        Args:
            audio_bytes: PCM audio bytes (16kHz, mono) - optional
            text_input: Text input - optional
        
        Returns:
            dict: Request body for InvokeModelWithBidirectionalStream
        """
        body = {
            "messages": []
        }
        
        # Add system message if provided
        if self.system_prompt:
            body["messages"].append({
                "role": "system",
                "content": [{"text": self.system_prompt}]
            })
        
        # Add user input (audio or text)
        if audio_bytes:
            # Convert audio bytes to base64
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            body["messages"].append({
                "role": "user",
                "content": [{
                    "audio": {
                        "format": "pcm",
                        "source": {
                            "bytes": audio_base64
                        },
                        "sampleRate": 16000,
                        "channels": 1
                    }
                }]
            })
        elif text_input:
            body["messages"].append({
                "role": "user",
                "content": [{"text": text_input}]
            })
        
        return body
    
    def send_audio(self, audio_bytes):
        """
        Send audio input to Nova Sonic stream.
        
        Args:
            audio_bytes: PCM audio bytes (16kHz, mono, 16-bit)
        
        Yields:
            bytes or dict: Audio response chunks or metadata
        """
        try:
            # Create request body for ConverseStream API
            # Nova Sonic 2 uses the ConverseStream API, not invoke_model_with_bidirectional_stream
            body = self._create_request_body(audio_bytes=audio_bytes)
            
            # Use converse_stream API for Nova Sonic 2
            response = self.bedrock_client.converse_stream(
                modelId=self.model_id,
                messages=body['messages'],
                system=body.get('system', []) if 'system' in body else None
            )
            
            self.event_stream = response.get('stream')
            
            # Process stream events
            if self.event_stream:
                for event in self.event_stream:
                    # ConverseStream returns different event structure
                    if 'contentBlockDelta' in event:
                        delta = event['contentBlockDelta']
                        delta_block = delta.get('delta', {})
                        
                        # Check for audio output
                        if 'audio' in delta_block:
                            audio_data = delta_block['audio']
                            if 'bytes' in audio_data:
                                # Decode base64 audio
                                audio_bytes = base64.b64decode(audio_data['bytes'])
                                yield audio_bytes
                        
                        # Check for text output
                        if 'text' in delta_block:
                            text = delta_block['text']
                            yield {'type': 'text', 'content': text}
                    
                    # Check for metadata
                    if 'metadata' in event:
                        metadata = event['metadata']
                        yield {'type': 'metadata', 'content': metadata}
                        
        except AttributeError as e:
            # If converse_stream doesn't exist, try alternative approach
            raise Exception(f"Nova Sonic 2 API not available. Error: {str(e)}. Please check boto3 version and AWS Bedrock API availability.")
        except Exception as e:
            raise Exception(f"Error in Nova Sonic stream: {str(e)}")
    
    def send_text(self, text_input):
        """
        Send text input to Nova Sonic stream.
        
        Args:
            text_input: Text string
        
        Yields:
            bytes or dict: Audio response chunks or metadata
        """
        try:
            # Create request body for ConverseStream API
            body = self._create_request_body(text_input=text_input)
            
            # Use converse_stream API for Nova Sonic 2
            response = self.bedrock_client.converse_stream(
                modelId=self.model_id,
                messages=body['messages'],
                system=body.get('system', []) if 'system' in body else None
            )
            
            self.event_stream = response.get('stream')
            
            # Process stream events
            if self.event_stream:
                for event in self.event_stream:
                    # ConverseStream returns different event structure
                    if 'contentBlockDelta' in event:
                        delta = event['contentBlockDelta']
                        delta_block = delta.get('delta', {})
                        
                        # Check for audio output
                        if 'audio' in delta_block:
                            audio_data = delta_block['audio']
                            if 'bytes' in audio_data:
                                # Decode base64 audio
                                audio_bytes = base64.b64decode(audio_data['bytes'])
                                yield audio_bytes
                        
                        # Check for text output
                        if 'text' in delta_block:
                            text = delta_block['text']
                            yield {'type': 'text', 'content': text}
                    
                    # Check for metadata
                    if 'metadata' in event:
                        metadata = event['metadata']
                        yield {'type': 'metadata', 'content': metadata}
                            
        except AttributeError as e:
            # If converse_stream doesn't exist, try alternative approach
            raise Exception(f"Nova Sonic 2 API not available. Error: {str(e)}. Please check boto3 version and AWS Bedrock API availability.")
        except Exception as e:
            raise Exception(f"Error in Nova Sonic stream: {str(e)}")
    
    def close(self):
        """Close the stream connection."""
        if self.event_stream:
            try:
                self.event_stream.close()
            except Exception:
                pass
            self.event_stream = None

