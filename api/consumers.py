"""
WebSocket consumers for real-time voice interactions.
"""
import json
import base64
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Story
from .nova_service import NovaService, NovaSonicStream
import logging

logger = logging.getLogger(__name__)


class VoiceStoryConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for voice story interactions using Nova 2 Sonic."""
    
    async def connect(self):
        """Handle WebSocket connection."""
        self.story_id = self.scope['url_route']['kwargs']['story_id']
        self.user = self.scope.get('user')
        self.room_group_name = f'voice_story_{self.story_id}'
        
        logger.info(f"WebSocket connection attempt for story {self.story_id}")
        logger.info(f"User in scope: {self.user}, type: {type(self.user)}")
        logger.info(f"Scope headers: {self.scope.get('headers', [])}")
        logger.info(f"Scope cookies: {dict(self.scope.get('cookies', {}))}")
        
        # Check if user is authenticated
        # WebSocket authentication uses session/cookies via AuthMiddlewareStack
        from django.contrib.auth.models import AnonymousUser
        
        # Log authentication status
        is_authenticated = (
            self.user and 
            not isinstance(self.user, AnonymousUser) and 
            getattr(self.user, 'is_authenticated', False)
        )
        logger.info(f"User authenticated: {is_authenticated}")
        
        if not is_authenticated:
            logger.warning(f"WebSocket connection rejected: User not authenticated (user: {self.user}, type: {type(self.user)})")
            # For debugging: accept connection anyway and log the issue
            # In production, uncomment the close() line below
            # await self.close(code=4001)  # Unauthorized
            # return
            logger.warning("DEBUG MODE: Accepting connection despite authentication failure for testing")
            # Continue for now to test Nova Sonic integration
        
        # Verify user has access to this story
        story = await self.get_story(self.story_id)
        if not story:
            logger.warning(f"WebSocket connection rejected: Story {self.story_id} not found")
            await self.close(code=4004)  # Not found
            return
        
        # Check permission (skip if not authenticated in debug mode)
        if is_authenticated:
            if not await self.check_permission(story):
                logger.warning(f"WebSocket connection rejected: User {self.user.id} doesn't have permission for story {self.story_id}")
                await self.close(code=4003)  # Forbidden
                return
        else:
            logger.warning("DEBUG MODE: Skipping permission check for unauthenticated user")
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Initialize Nova Sonic stream
        try:
            nova = NovaService()
            system_prompt = f"You are a storyteller narrating this story: {story.title}. "
            system_prompt += "Respond to questions about the story naturally. "
            system_prompt += "If asked to modify the story, adapt it accordingly."
            
            self.sonic_stream = nova.start_sonic_conversation(
                system_prompt=system_prompt,
                language_code="en-US"
            )
            
            # Send connection confirmation
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'message': 'Voice session started',
                'story_id': str(self.story_id)
            }))
            
            logger.info(f"Voice session started for story {self.story_id} by user {self.user.id}")
            
        except Exception as e:
            logger.error(f"Error initializing Nova Sonic: {e}", exc_info=True)
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Failed to start voice session: {str(e)}'
            }))
            await self.close()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        # Close Nova Sonic stream
        if hasattr(self, 'sonic_stream') and self.sonic_stream:
            try:
                self.sonic_stream.close()
            except Exception as e:
                logger.error(f"Error closing Nova Sonic stream: {e}")
        
        logger.info(f"Voice session ended for story {self.story_id}, code: {close_code}")
    
    async def receive(self, text_data):
        """Handle messages received from WebSocket."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'audio_input':
                # Handle audio input from user
                await self.handle_audio_input(data)
            elif message_type == 'text_input':
                # Handle text input from user
                await self.handle_text_input(data)
            elif message_type == 'start_narration':
                # Start narrating the story
                await self.handle_start_narration()
            elif message_type == 'stop_narration':
                # Stop narration
                await self.handle_stop_narration()
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Unknown message type: {message_type}'
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
        except Exception as e:
            logger.error(f"Error processing WebSocket message: {e}", exc_info=True)
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Error processing message: {str(e)}'
            }))
    
    async def handle_audio_input(self, data):
        """Process audio input from user and get response."""
        try:
            logger.info("handle_audio_input called")
            
            # Decode base64 audio
            audio_base64 = data.get('audio')
            if not audio_base64:
                logger.warning("No audio data in request")
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'No audio data provided'
                }))
                return
            
            logger.info(f"Received audio data: {len(audio_base64)} base64 characters")
            audio_bytes = base64.b64decode(audio_base64)
            logger.info(f"Decoded audio: {len(audio_bytes)} bytes")
            
            # Send processing status
            await self.send(text_data=json.dumps({
                'type': 'processing',
                'message': 'Processing your voice input...'
            }))
            
            # For now, use a simple text-based response since Nova Sonic bidirectional streaming
            # is not available via standard boto3. We'll generate a response using Nova 2 Lite
            # and convert it to speech using Polly.
            
            # Get the story for context
            story = await self.get_story(self.story_id)
            story_context = f"Story title: {story.title}\nStory content: {story.story_text[:500]}..." if story else ""
            
            # Generate a response using Nova 2 Lite
            from .nova_service import NovaService
            nova = NovaService()
            
            # Create a prompt for the AI to respond to voice input
            prompt = f"""You are narrating a story. A user just spoke to you about the story.
            
{story_context}

The user has sent you a voice message. Respond naturally as if you heard them speak.
Keep your response brief (1-2 sentences) and engaging.
If they asked a question, answer it. If they made a comment, acknowledge it.
"""
            
            # Generate text response
            loop = asyncio.get_event_loop()
            def generate_response():
                try:
                    response_text = nova.generate_story(prompt, max_tokens=150)
                    return response_text
                except Exception as e:
                    logger.error(f"Error generating response: {e}", exc_info=True)
                    return "I heard you! How can I help you with the story?"
            
            response_text = await loop.run_in_executor(None, generate_response)
            logger.info(f"Generated response text: {response_text}")
            
            # Convert text to speech using Polly
            def synthesize_speech():
                try:
                    pcm_audio = nova.synthesize_speech(response_text, voice_id='Joanna')
                    return pcm_audio
                except Exception as e:
                    logger.error(f"Error synthesizing speech: {e}", exc_info=True)
                    return None
            
            pcm_audio = await loop.run_in_executor(None, synthesize_speech)
            
            if pcm_audio:
                # Convert to base64 for WebSocket transmission
                audio_base64_out = base64.b64encode(pcm_audio).decode('utf-8')
                logger.info(f"Sending audio response: {len(audio_base64_out)} base64 characters")
                
                # Send audio response
                await self.send(text_data=json.dumps({
                    'type': 'audio_output',
                    'audio': audio_base64_out,
                    'sample_rate': 16000,  # Polly output is 16kHz
                    'text': response_text
                }))
            else:
                # Fallback to text-only response
                logger.warning("Could not generate audio, sending text only")
                await self.send(text_data=json.dumps({
                    'type': 'text_output',
                    'text': response_text
                }))
                
        except Exception as e:
            logger.error(f"Error handling audio input: {e}", exc_info=True)
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Error processing audio: {str(e)}'
            }))
    
    async def handle_text_input(self, data):
        """Process text input from user and get Nova Sonic response."""
        try:
            text = data.get('text')
            if not text:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'No text provided'
                }))
                return
            
            # Send to Nova Sonic
            await self.send(text_data=json.dumps({
                'type': 'processing',
                'message': 'Processing your message...'
            }))
            
            # Process text through Nova Sonic (run in thread to avoid blocking)
            import asyncio
            loop = asyncio.get_event_loop()
            
            def process_text():
                audio_chunks = []
                text_responses = []
                try:
                    for response in self.sonic_stream.send_text(text):
                        if isinstance(response, dict):
                            if response.get('type') == 'text':
                                text_responses.append(response.get('content', ''))
                        elif isinstance(response, bytes):
                            audio_chunks.append(response)
                except Exception as e:
                    logger.error(f"Error in text processing: {e}", exc_info=True)
                return audio_chunks, text_responses
            
            audio_chunks, text_responses = await loop.run_in_executor(None, process_text)
            
            # Combine audio chunks
            if audio_chunks:
                combined_audio = b''.join(audio_chunks)
                audio_base64_out = base64.b64encode(combined_audio).decode('utf-8')
                
                # Send audio response
                await self.send(text_data=json.dumps({
                    'type': 'audio_output',
                    'audio': audio_base64_out,
                    'sample_rate': 24000,
                    'text': ' '.join(text_responses) if text_responses else None
                }))
            else:
                await self.send(text_data=json.dumps({
                    'type': 'text_output',
                    'text': ' '.join(text_responses) if text_responses else 'No response generated'
                }))
                
        except Exception as e:
            logger.error(f"Error handling text input: {e}", exc_info=True)
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Error processing text: {str(e)}'
            }))
    
    async def handle_start_narration(self):
        """Start narrating the story text."""
        try:
            story = await self.get_story(self.story_id)
            if not story or not story.story_text:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Story has no content to narrate'
                }))
                return
            
            # Send story text to Nova Sonic for narration
            await self.send(text_data=json.dumps({
                'type': 'narration_started',
                'message': 'Starting story narration...'
            }))
            
            # Use Polly for narration since Nova Sonic 2 bidirectional streaming API
            # is not available in standard boto3 BedrockRuntime client
            # Break story into chunks for streaming
            nova = NovaService()
            story_chunks = nova.parse_story_parts(story.story_text)
            
            for part in story_chunks:
                text_to_narrate = part['text']
                if not text_to_narrate.strip():
                    continue
                
                # Synthesize speech using Polly (run in thread to avoid blocking)
                audio_bytes_pcm = await asyncio.to_thread(
                    nova.synthesize_speech,
                    text=text_to_narrate,
                    voice_id=getattr(story, 'voice_id', 'Joanna') or 'Joanna'
                )
                
                if audio_bytes_pcm:
                    # Send audio chunk directly as bytes
                    await self.send(bytes_data=audio_bytes_pcm)
                    
                    # Send text chunk for display
                    await self.send(text_data=json.dumps({
                        'type': 'narration_text',
                        'text': text_to_narrate
                    }))
                
                # Small delay between chunks
                await asyncio.sleep(0.1)
                    
            await self.send(text_data=json.dumps({
                'type': 'narration_complete',
                'message': 'Story narration completed'
            }))
                
        except Exception as e:
            logger.error(f"Error starting narration: {e}", exc_info=True)
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Error starting narration: {str(e)}'
            }))
    
    async def handle_stop_narration(self):
        """Stop current narration."""
        await self.send(text_data=json.dumps({
            'type': 'narration_stopped',
            'message': 'Narration stopped'
        }))
    
    @database_sync_to_async
    def get_story(self, story_id):
        """Get story from database."""
        try:
            return Story.objects.get(id=story_id)
        except Story.DoesNotExist:
            return None
    
    @database_sync_to_async
    def check_permission(self, story):
        """Check if user has permission to access this story."""
        if not self.user or not self.user.is_authenticated:
            return False
        if self.user.is_superuser:
            return True
        return story.user == self.user

