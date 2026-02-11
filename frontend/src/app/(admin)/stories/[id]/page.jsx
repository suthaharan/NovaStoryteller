import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Col, Row, Badge, Button, Spinner, Form, Alert } from 'react-bootstrap';
import httpClient from '@/helpers/httpClient';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { useAuthContext } from '@/context/useAuthContext';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { storyToasts, validationToasts, crudToasts, handleApiError, showError, showInfo } from '@/utils/toastNotifications';
import VoiceStoryPlayer from './components/VoiceStoryPlayer';

// Toast configuration - dismiss all toasts on navigation
import { toast } from 'react-toastify';
const dismissAllToasts = () => {
  toast.dismiss();
};

const StoryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState('Joanna');
  const [editingTranscript, setEditingTranscript] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState('');
  const [savingTranscript, setSavingTranscript] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [regeneratingStory, setRegeneratingStory] = useState(false);
  const [revisions, setRevisions] = useState([]);
  const [selectedRevisionId, setSelectedRevisionId] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [generatingScenes, setGeneratingScenes] = useState(false);
  const [uploadingSceneImage, setUploadingSceneImage] = useState(null); // Track which scene is uploading
  const [initializingScenes, setInitializingScenes] = useState(false);
  const [addingScene, setAddingScene] = useState(false);
  const [newSceneNumber, setNewSceneNumber] = useState('');
  const [deletingScene, setDeletingScene] = useState(null);
  const fileInputRef = useRef(null);
  const sceneFileInputRefs = useRef({}); // Refs for scene image upload inputs
  const audioRef = useRef(null);
  const audioRegenerationAttempted = useRef(false);
  const isInitialLoad = useRef(true);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);

  useEffect(() => {
    // Dismiss any existing toasts when component mounts or story ID changes
    dismissAllToasts();
    
    // Mark as initial load
    isInitialLoad.current = true;
    audioRegenerationAttempted.current = false; // Reset on story change
    fetchStory(false); // Don't show error toast on initial load
    fetchAvailableVoices();
    fetchRevisions();
    // Note: fetchScenes() removed - fetchStory() already includes scenes in response
    
    // Mark initial load as complete after a short delay
    setTimeout(() => {
      isInitialLoad.current = false;
    }, 1000);
    
    // Cleanup: dismiss toasts when component unmounts
    return () => {
      dismissAllToasts();
    };
  }, [id]);

  useEffect(() => {
    if (story) {
      setEditedTranscript(story.story_text || '');
      setEditedPrompt(story.prompt || '');
      setSelectedRevisionId(null);
    }
  }, [story]);

  // Fetch available voices
  const fetchAvailableVoices = async () => {
    try {
      const response = await httpClient.get('/stories/available_voices/', {
        params: { language_code: 'en-US' }
      });
      const voices = response.data.voices || [];
      setAvailableVoices(voices);
      // Set default voice to first in list if not already set
      if (voices.length > 0 && !selectedVoiceId) {
        setSelectedVoiceId(voices[0].id);
      }
    } catch (err) {
      // Error fetching voices - use default voices
      // Use default voices if API fails
      const defaultVoices = [
        { id: 'Joanna', name: 'Joanna', gender: 'Female' },
        { id: 'Matthew', name: 'Matthew', gender: 'Male' },
        { id: 'Ivy', name: 'Ivy', gender: 'Female' },
        { id: 'Joey', name: 'Joey', gender: 'Male' },
        { id: 'Justin', name: 'Justin', gender: 'Male' },
        { id: 'Kendra', name: 'Kendra', gender: 'Female' },
        { id: 'Kimberly', name: 'Kimberly', gender: 'Female' },
        { id: 'Salli', name: 'Salli', gender: 'Female' },
      ];
      setAvailableVoices(defaultVoices);
      if (!selectedVoiceId) {
        setSelectedVoiceId(defaultVoices[0].id);
      }
    }
  };

  // Fetch revisions
  const fetchRevisions = async () => {
    if (!id) return;
    try {
      const response = await httpClient.get(`/stories/${id}/revisions/`);
      setRevisions(response.data.results || response.data || []);
    } catch (err) {
      // Error fetching revisions - continue without them
      setRevisions([]);
    }
  };

  // Fetch scenes (only used when we need to refresh scenes without fetching full story)
  // Note: Usually we just call fetchStory() which already includes scenes
  const fetchScenes = async () => {
    if (!id) return;
    try {
      const response = await httpClient.get(`/stories/${id}/`);
      // Scenes are included in the story response
      if (response.data.scenes) {
        setScenes(response.data.scenes);
      } else {
        setScenes([]);
      }
    } catch (err) {
      // Ignore duplicate request cancellation errors (expected behavior)
      if (err.message?.includes('Duplicate request cancelled')) {
        return;
      }
      // Error fetching scenes - continue without them
      setScenes([]);
    }
  };

  const fetchStory = async (showErrorToast = true) => {
    try {
      setLoading(true);
      setError(null);
      const response = await httpClient.get(`/stories/${id}/`);
      setStory(response.data);
      if (response.data.image_url) {
        setImagePreview(response.data.image_url);
      } else {
        setImagePreview(null);
      }
      // Set selected voice from story or default
      if (response.data.voice_id) {
        setSelectedVoiceId(response.data.voice_id);
      }
      
      // Set scenes if available
      if (response.data.scenes) {
        setScenes(response.data.scenes);
      } else {
        setScenes([]);
      }
      
      // Reload audio element if audio URL changed
      if (audioRef.current && response.data.audio_url) {
        const newAudioUrl = response.data.audio_url;
        const currentSrc = audioRef.current.src;
        // Check if URL changed (compare without query params)
        const currentUrlBase = currentSrc.split('?')[0];
        const newUrlBase = newAudioUrl.split('?')[0];
        
        if (currentUrlBase !== newUrlBase) {
          // Audio URL changed - reload the audio element with cache busting
          audioRef.current.pause();
          // Add timestamp to prevent caching
          const cacheBuster = `?t=${Date.now()}`;
          audioRef.current.src = newAudioUrl + (newAudioUrl.includes('?') ? '&' : '?') + cacheBuster.substring(1);
          audioRef.current.load();
          setIsPlaying(false);
          setAudioCurrentTime(0);
          setAudioDuration(0);
          // Audio URL changed, reload audio element
        }
      } else if (audioRef.current && !response.data.audio_url) {
        // Audio was removed - clear the source
        audioRef.current.pause();
        audioRef.current.src = '';
        setIsPlaying(false);
        setAudioCurrentTime(0);
        setAudioDuration(0);
      }
    } catch (err) {
      // Ignore duplicate request cancellation errors (expected behavior from httpClient)
      if (err.message?.includes('Duplicate request cancelled')) {
        // Story fetch cancelled (duplicate request) - ignore
        // Don't set error or show toast for duplicate cancellations
        setLoading(false);
        return;
      }
      
      // Error fetching story
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.detail || 
                          err.message || 
                          'Failed to fetch story';
      setError(errorMessage);
      // Only show toast if explicitly requested (not on initial page load)
      if (showErrorToast) {
        showError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-regenerate audio if file is missing
  const handleAudioError = async (silent = false) => {
    const audio = audioRef.current;
    if (!audio || !story || audioRegenerationAttempted.current) return;

    // Don't auto-regenerate on initial page load - only on user interaction
    if (isInitialLoad.current) {
      return;
    }

    // Check if it's a 404 or network error
    const error = audio.error;
    if (error) {
      // Check for 404 or network errors
      // MEDIA_ERR_SRC_NOT_SUPPORTED (code 4) = file not found or unsupported format
      // MEDIA_ERR_NETWORK (code 2) = network error
      const is404 = error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || 
                    error.code === MediaError.MEDIA_ERR_NETWORK ||
                    error.code === MediaError.MEDIA_ERR_ABORTED;
      
      if (is404) {
        // Audio file not found (404), attempting to regenerate
        
        // Only regenerate if story has content and we haven't already tried
        if (story.story_text && story.story_text.trim().length > 0 && !regenerating) {
          audioRegenerationAttempted.current = true; // Prevent duplicate attempts
          if (!silent) {
            storyToasts.audioNotFound();
          }
          try {
            setRegenerating(true);
            await httpClient.post(`/stories/${id}/generate_audio/`, {
              voice_id: story.voice_id || selectedVoiceId
            });
            if (!silent) {
              storyToasts.audioRegenerated();
            }
            // Refresh story after a short delay to allow file to be saved
            setTimeout(() => {
              audioRegenerationAttempted.current = false; // Reset for next attempt
              fetchStory(true); // Show error toast on refresh
            }, 3000);
          } catch (err) {
            audioRegenerationAttempted.current = false; // Reset on error
            if (!silent) {
              storyToasts.audioError(err);
            }
            // Audio regeneration error
          } finally {
            setRegenerating(false);
          }
        } else if (!story.story_text || story.story_text.trim().length === 0) {
          if (!silent) {
            storyToasts.noContent();
          }
        }
      }
    }
  };

  // Audio controls
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !story?.audio_url) return;

    const updateTime = () => setAudioCurrentTime(audio.currentTime);
    const updateDuration = () => setAudioDuration(audio.duration);
    const handleEnd = () => {
      setAudioCurrentTime(0);
      setIsPlaying(false);
      if (currentSessionId) {
        endSession(true);
      }
    };
    const handleError = (e) => {
      // Audio error event detected
      // Only auto-regenerate if user tried to play (not on initial page load)
      // Small delay to ensure error object is populated
      setTimeout(() => {
        if (audio.error && isPlaying) {
          // Only regenerate if user was trying to play
          handleAudioError(false);
        }
      }, 200);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnd);
    audio.addEventListener('error', handleError);
    
    // Try to load the audio to trigger error if file is missing
    // Don't auto-regenerate on page load - only on user interaction
    // The audio error handler will be called if user tries to play and file is missing
    try {
      const loadResult = audio.load();
      if (loadResult && typeof loadResult.catch === 'function') {
        loadResult.catch((err) => {
          // Audio load() promise rejection
          // Don't auto-regenerate on page load - wait for user interaction
        });
      }
    } catch (err) {
      // If load() throws synchronously, don't auto-regenerate on page load
      // Audio load() threw error
    }

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnd);
      audio.removeEventListener('error', handleError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.audio_url, currentSessionId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        // Error playing audio
        // If it's a NotSupportedError, the file might be missing - trigger error handler
        if (err.name === 'NotSupportedError' || err.name === 'NotAllowedError') {
          // NotSupportedError detected, checking audio error
          setTimeout(() => {
            if (audio.error) {
              handleAudioError(false); // Show message when user tries to play
            }
          }, 100);
        } else {
          showError('Failed to play audio');
        }
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Start listening session
  const startSession = async () => {
    try {
      const response = await httpClient.post('/story-sessions/', {
        story: id,
      });
      setCurrentSessionId(response.data.id);
      return response.data.id;
    } catch (err) {
      showError(err, { defaultMessage: 'Failed to start session' });
      // Start session error
      return null;
    }
  };

  // End listening session
  const endSession = async (completed = false) => {
    if (!currentSessionId) return;
    
    try {
      await httpClient.post(`/story-sessions/${currentSessionId}/end_session/`, {
        completed,
      });
      setCurrentSessionId(null);
    } catch (err) {
      // End session error
    }
  };

  // Handle play/pause
  const handlePlayPause = async () => {
    if (!story?.audio_url) {
      storyToasts.audioUnavailable();
      return;
    }

    if (isPlaying) {
      // Pause - end current session
      await endSession(false);
      setIsPlaying(false);
    } else {
      // Play - start new session
      const sessionId = await startSession();
      if (sessionId) {
        setIsPlaying(true);
      }
    }
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      validationToasts.invalidFileType('image');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      validationToasts.fileTooLarge('10MB');
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      storyToasts.imageUploading();
      
      // Upload image - backend will automatically regenerate story
      const response = await httpClient.patch(`/stories/${id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes timeout for story generation
      });

      storyToasts.imageUploaded();
      
      // Wait a bit for backend processing, then refresh
      setTimeout(async () => {
        await fetchStory();
        storyToasts.regenerated();
      }, 2000);
      
    } catch (err) {
      // Error uploading image
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.detail || 
                          err.message || 
                          'Failed to upload image';
      handleApiError(err, { item: 'Image', action: 'upload', defaultMessage: errorMessage });
      
      // Still try to refresh story in case image was uploaded but regeneration failed
      setTimeout(() => {
        fetchStory().catch(() => {
          // Ignore refresh errors
        });
      }, 1000);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle regenerate
  const handleRegenerate = async () => {
    if (!story) return;

    setRegenerating(true);
    try {
      storyToasts.processing();
      const response = await httpClient.post(`/stories/${id}/regenerate/`, {
        prompt: story.prompt,
        template: story.template
      });
      storyToasts.regenerated();
      await fetchStory(); // Refresh the story
    } catch (err) {
      storyToasts.generationError(err);
    } finally {
      setRegenerating(false);
    }
  };

  // Initialize scenes based on story text
  const handleInitializeScenes = async () => {
    if (!story || !story.story_text) return;
    
    setInitializingScenes(true);
    try {
      showInfo('Initializing scenes from story text...', { autoClose: 3000 });
      const response = await httpClient.post(`/stories/${id}/initialize_scenes/`);
      storyToasts.scenesInitialized(response.data.scenes?.length || 0);
      await fetchStory(); // Refresh to get updated scenes
    } catch (err) {
      storyToasts.scenesError(err);
    } finally {
      setInitializingScenes(false);
    }
  };

  // Handle scene image upload
  const handleSceneImageUpload = async (sceneNumber, file) => {
    if (!file) return;
    
    setUploadingSceneImage(sceneNumber);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('scene_number', sceneNumber);
      
      const response = await httpClient.post(`/stories/${id}/upload_scene_image/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes for image upload
      });
      
      storyToasts.sceneImageUploaded();
      await fetchStory(); // Refresh to get updated scene
    } catch (err) {
      handleApiError(err, { item: 'Scene image', action: 'upload', defaultMessage: 'Failed to upload scene image' });
    } finally {
      setUploadingSceneImage(null);
      // Clear the file input
      const sceneKey = `scene_${sceneNumber}`;
      if (sceneFileInputRefs.current[sceneKey]?.current) {
        sceneFileInputRefs.current[sceneKey].current.value = '';
      }
    }
  };

  // Handle adding a new scene manually
  const handleAddScene = async () => {
    if (!newSceneNumber || isNaN(parseInt(newSceneNumber))) {
      validationToasts.required('Scene number');
      return;
    }
    
    setAddingScene(true);
    try {
      const response = await httpClient.post(`/stories/${id}/add_scene/`, {
        scene_number: parseInt(newSceneNumber),
        scene_text: ''
      });
      storyToasts.sceneAdded(parseInt(newSceneNumber));
      setNewSceneNumber('');
      await fetchStory(); // Refresh to get updated scenes
    } catch (err) {
      handleApiError(err, { item: 'Scene', action: 'add', defaultMessage: 'Failed to add scene' });
    } finally {
      setAddingScene(false);
    }
  };

  // Handle deleting a scene
  const handleDeleteScene = async (sceneId) => {
    if (!window.confirm('Are you sure you want to delete this scene? This action cannot be undone.')) {
      return;
    }
    
    setDeletingScene(sceneId);
    try {
      await httpClient.post(`/stories/${id}/delete_scene/`, {
        scene_id: sceneId
      });
      crudToasts.deleted('Scene');
      await fetchStory(); // Refresh to get updated scenes
    } catch (err) {
      handleApiError(err, { item: 'Scene', action: 'delete', defaultMessage: 'Failed to delete scene' });
    } finally {
      setDeletingScene(null);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error || !story) {
    return (
      <>
        <PageBreadcrumb title="Story Detail" subName="Stories" />
        <Row>
          <Col xs={12}>
            <ComponentContainerCard title="Error">
              <div className="alert alert-danger" role="alert">
                {error || 'Story not found'}
              </div>
              <Button variant="primary" onClick={() => navigate('/stories')}>
                Back to Stories
              </Button>
            </ComponentContainerCard>
          </Col>
        </Row>
      </>
    );
  }

  const canEdit = user?.is_superuser || story.user === user?.id;

  return (
    <>
      <PageBreadcrumb title="Story Detail" subName="Stories" />
      <Row>
        <Col xs={12}>
          <ComponentContainerCard title={story.title}>
            {/* Action Buttons */}
            <div className="mb-4 d-flex flex-wrap gap-2">
              <Button variant="outline-secondary" onClick={() => navigate('/stories')}>
                <IconifyIcon icon="solar:arrow-left-bold-duotone" width={18} height={18} className="me-2" />
                Back to Stories
              </Button>
              
              {canEdit && (
                <>
                  <Button
                    variant={story.is_published ? 'outline-warning' : 'outline-success'}
                    size="sm"
                    onClick={async () => {
                      try {
                        const newStatus = !story.is_published;
                        await httpClient.patch(`/stories/${id}/`, {
                          is_published: newStatus
                        });
                        storyToasts.published(newStatus);
                        fetchStory();
                      } catch (err) {
                        handleApiError(err, { item: 'Story status', action: 'update', defaultMessage: 'Failed to update story status' });
                      }
                    }}
                  >
                    <IconifyIcon 
                      icon={story.is_published ? 'solar:eye-closed-bold-duotone' : 'solar:eye-bold-duotone'} 
                      width={18} 
                      height={18} 
                      className="me-2" 
                    />
                    {story.is_published ? 'Unpublish' : 'Publish'}
                  </Button>

                  <Button 
                    variant="outline-primary"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                  >
                    {regenerating ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <IconifyIcon icon="solar:refresh-bold-duotone" width={18} height={18} className="me-2" />
                        Regenerate Story
                      </>
                    )}
                  </Button>

                  <Form.Group className="d-inline-block">
                    <Form.Control
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      style={{ display: 'none' }}
                      id="image-upload-input"
                    />
                    <Button
                      variant="outline-info"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <IconifyIcon icon="solar:gallery-upload-bold-duotone" width={18} height={18} className="me-2" />
                          {story.image_url ? 'Change Image' : 'Upload Image'}
                        </>
                      )}
                    </Button>
                  </Form.Group>
                </>
              )}

              {story.story_text && story.story_text.trim().length > 0 ? (
                <div className="d-flex gap-2 ms-auto align-items-center">
                  {/* Voice Selection - Always visible when story has content */}
                  <Form.Group className="mb-0" style={{ minWidth: '200px' }}>
                    <Form.Select
                      size="sm"
                      value={selectedVoiceId}
                      onChange={(e) => setSelectedVoiceId(e.target.value)}
                      disabled={regenerating}
                    >
                      {availableVoices.map((voice) => (
                        <option key={voice.id} value={voice.id}>
                          {voice.name} ({voice.gender})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  
                  {/* Play/Pause button if audio exists */}
                  {story.audio_url ? (
                    <>
                      <Button
                        variant={isPlaying ? 'danger' : 'success'}
                        size="sm"
                        onClick={handlePlayPause}
                        disabled={isVoiceSpeaking}
                      >
                        <IconifyIcon
                          icon={isPlaying ? 'solar:pause-bold-duotone' : 'solar:play-bold-duotone'}
                          width={18}
                          height={18}
                          className="me-2"
                        />
                        {isPlaying ? 'Pause' : 'Play'}
                      </Button>
                      {/* Regenerate Audio button */}
                      <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={async () => {
                          if (!story.story_text || story.story_text.trim().length === 0) {
                            storyToasts.noContent();
                            return;
                          }
                          setRegenerating(true);
                          try {
                            const voiceName = availableVoices.find(v => v.id === selectedVoiceId)?.name || selectedVoiceId;
                            showInfo(`Regenerating audio with ${voiceName}...`);
                            const response = await httpClient.post(`/stories/${id}/generate_audio/`, {
                              voice_id: selectedVoiceId
                            });
                            storyToasts.audioRegenerated();
                            // Stop any currently playing audio
                            if (audioRef.current) {
                              audioRef.current.pause();
                              audioRef.current.currentTime = 0;
                              setIsPlaying(false);
                              if (currentSessionId) {
                                endSession(false);
                              }
                            }
                            // Refresh story to get updated audio_url - wait longer for file to be saved
                            setTimeout(async () => {
                              const response = await httpClient.get(`/stories/${id}/`);
                              setStory(response.data);
                              // Force audio element reload with new URL
                              if (audioRef.current && response.data.audio_url) {
                                const cacheBuster = `?t=${Date.now()}`;
                                audioRef.current.src = response.data.audio_url + (response.data.audio_url.includes('?') ? '&' : '?') + cacheBuster.substring(1);
                                audioRef.current.load();
                                setIsPlaying(false);
                                setAudioCurrentTime(0);
                                setAudioDuration(0);
                              }
                            }, 3000);
                          } catch (err) {
                            storyToasts.audioError(err);
                            // Audio regeneration error
                            // Still refresh to see if audio was partially generated
                            setTimeout(() => {
                              fetchStory();
                            }, 1000);
                          } finally {
                            setRegenerating(false);
                          }
                        }}
                        disabled={regenerating || !story.story_text}
                        title="Regenerate audio with selected voice"
                      >
                        {regenerating ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <IconifyIcon icon="solar:refresh-bold-duotone" width={18} height={18} className="me-2" />
                            Regenerate
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    /* Generate Audio button if no audio exists */
                    <Button
                      variant="outline-info"
                      size="sm"
                      onClick={async () => {
                        if (!story.story_text || story.story_text.trim().length === 0) {
                          storyToasts.noContent();
                          return;
                        }
                        setRegenerating(true);
                        try {
                          const voiceName = availableVoices.find(v => v.id === selectedVoiceId)?.name || selectedVoiceId;
                          showInfo(`Generating audio with ${voiceName}...`);
                          const response = await httpClient.post(`/stories/${id}/generate_audio/`, {
                            voice_id: selectedVoiceId
                          });
                          storyToasts.audioGenerated();
                          // Refresh story to get updated audio_url - wait longer for file to be saved
                          setTimeout(async () => {
                            const response = await httpClient.get(`/stories/${id}/`);
                            setStory(response.data);
                            // Force audio element reload with new URL
                            if (audioRef.current && response.data.audio_url) {
                              const cacheBuster = `?t=${Date.now()}`;
                              audioRef.current.src = response.data.audio_url + (response.data.audio_url.includes('?') ? '&' : '?') + cacheBuster.substring(1);
                              audioRef.current.load();
                              setIsPlaying(false);
                              setAudioCurrentTime(0);
                              setAudioDuration(0);
                            }
                          }, 3000);
                        } catch (err) {
                          storyToasts.audioError(err);
                          // Audio generation error
                          // Still refresh to see if audio was partially generated
                          setTimeout(() => {
                            fetchStory();
                          }, 1000);
                        } finally {
                          setRegenerating(false);
                        }
                      }}
                      disabled={regenerating || !story.story_text}
                      title={!story.story_text ? 'Story has no content' : 'Generate audio narration'}
                    >
                      {regenerating ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <IconifyIcon icon="solar:music-note-bold-duotone" width={18} height={18} className="me-2" />
                          Generate Audio
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline-secondary"
                  disabled
                  className="ms-auto"
                  title="Story has no content. Please regenerate the story first."
                >
                  <IconifyIcon icon="solar:music-note-bold-duotone" width={18} height={18} className="me-2" />
                  No Story Content
                </Button>
              )}
            </div>

            {/* Story Info and Image */}
            <Row className="mb-4">
              <Col md={6}>
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <div className="mb-3">
                      <strong className="text-muted d-block mb-1">Author</strong>
                      <span>{story.user_name}</span>
                    </div>
                    <div className="mb-3">
                      <strong className="text-muted d-block mb-1">Template</strong>
                      <Badge bg="primary">{story.template}</Badge>
                    </div>
                    <div className="mb-3">
                      <strong className="text-muted d-block mb-1">Status</strong>
                      <Badge bg={story.is_published ? 'success' : 'secondary'}>
                        {story.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <div>
                      <strong className="text-muted d-block mb-1">Created</strong>
                      <span>{new Date(story.created_at).toLocaleString()}</span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="border">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>Story Image</strong>
                    </div>
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt={story.title}
                        className="img-fluid rounded"
                        style={{ maxHeight: '300px', width: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div className="text-center text-muted py-5">
                        <IconifyIcon icon="solar:gallery-bold-duotone" width={48} height={48} className="mb-2" />
                        <p className="mb-0">No image uploaded</p>
                        {canEdit && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="mt-2"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Upload Image
                          </Button>
                        )}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <hr />

            {/* Story Prompt */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  <IconifyIcon icon="solar:document-text-bold-duotone" width={20} height={20} className="me-2" />
                  Story Prompt
                </h5>
                {canEdit && (
                  <div className="d-flex gap-2">
                    {!editingPrompt ? (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          setEditingPrompt(true);
                          setEditedPrompt(story.prompt || '');
                        }}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        <IconifyIcon icon="solar:pen-bold-duotone" width={18} height={18} className="me-2" />
                        Edit Prompt
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={async () => {
                            if (!editedPrompt || editedPrompt.trim().length === 0) {
                              validationToasts.empty('Prompt');
                              return;
                            }
                            setRegeneratingStory(true);
                            try {
                              storyToasts.processing();
                              // Backend will automatically save old story as revision before regenerating
                              // Update prompt and regenerate story
                              const response = await httpClient.post(`/stories/${id}/regenerate/`, {
                                prompt: editedPrompt.trim(),
                                template: story.template
                              });
                              storyToasts.regenerated();
                              setEditingPrompt(false);
                              await fetchStory();
                              await fetchRevisions();
                            } catch (err) {
                              storyToasts.generationError(err);
                            } finally {
                              setRegeneratingStory(false);
                            }
                          }}
                          disabled={regeneratingStory || !editedPrompt || editedPrompt.trim().length === 0}
                        >
                          {regeneratingStory ? (
                            <>
                              <Spinner size="sm" className="me-2" />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <IconifyIcon icon="solar:refresh-bold-duotone" width={18} height={18} className="me-2" />
                              Regenerate Story
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            setEditingPrompt(false);
                            setEditedPrompt(story.prompt || '');
                          }}
                          disabled={regeneratingStory}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          <IconifyIcon icon="solar:close-circle-bold-duotone" width={18} height={18} className="me-2" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <Card className="border-0 bg-light">
                <Card.Body>
                  {editingPrompt && canEdit ? (
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={editedPrompt}
                      onChange={(e) => setEditedPrompt(e.target.value)}
                      placeholder="Enter your story prompt..."
                      disabled={regeneratingStory}
                    />
                  ) : (
                    <p className="mb-0">{story.prompt}</p>
                  )}
                </Card.Body>
              </Card>
              
              {/* System Prompt Used */}
              {story.system_prompt_used && (
                <div className="mt-3">
                  <h6 className="mb-2 text-muted">
                    <IconifyIcon icon="solar:settings-bold-duotone" width={16} height={16} className="me-2" />
                    Full System Prompt Used (includes Settings & Template)
                  </h6>
                  <Card className="border-0 bg-secondary bg-opacity-10">
                    <Card.Body>
                      <Form.Control
                        as="textarea"
                        rows={8}
                        value={story.system_prompt_used}
                        readOnly
                        style={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}
                      />
                    </Card.Body>
                  </Card>
                </div>
              )}
            </div>

            {/* Image Description */}
            {story.image_description && (
              <div className="mb-4">
                <h5 className="mb-3">
                  <IconifyIcon icon="solar:eye-bold-duotone" width={20} height={20} className="me-2" />
                  Image Analysis (Titan AI)
                </h5>
                <Card className="border-0 bg-info bg-opacity-10">
                  <Card.Body>
                    <p className="mb-0">{story.image_description}</p>
                  </Card.Body>
                </Card>
              </div>
            )}

            {/* Story Transcript */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  <IconifyIcon icon="solar:book-2-bold-duotone" width={20} height={20} className="me-2" />
                  Story Transcript
                </h5>
                {canEdit && story.story_text && story.story_text.trim().length > 0 && (
                  <div className="d-flex gap-2 align-items-center">
                    {revisions.length > 0 && (
                      <Form.Select
                        size="sm"
                        value={selectedRevisionId || ''}
                        onChange={(e) => {
                          const revId = e.target.value;
                          setSelectedRevisionId(revId);
                          if (revId) {
                            const revision = revisions.find(r => r.id === revId);
                            if (revision) {
                              setEditedTranscript(revision.story_text);
                              setEditingTranscript(true);
                            }
                          } else {
                            setEditedTranscript(story.story_text);
                            setEditingTranscript(false);
                          }
                        }}
                        style={{ minWidth: '250px' }}
                      >
                        <option value="">Current Version</option>
                        {revisions.map((rev) => (
                          <option key={rev.id} value={rev.id}>
                            {new Date(rev.created_at).toLocaleString()}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                    {!editingTranscript ? (
                      <>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setEditingTranscript(true);
                            setEditedTranscript(story.story_text || '');
                          }}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          <IconifyIcon icon="solar:pen-bold-duotone" width={18} height={18} className="me-2" />
                          Edit Transcript
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={async () => {
                            if (!story.story_text || story.story_text.trim().length === 0) {
                              storyToasts.noContent();
                              return;
                            }
                            setGeneratingScenes(true);
                            try {
                              showInfo('Generating scene images... This may take a moment.', { autoClose: 10000 });
                              const response = await httpClient.post(`/stories/${id}/generate_scenes/`);
                              storyToasts.scenesGenerated();
                              // fetchStory() already includes scenes, so no need to call fetchScenes()
                              await fetchStory();
                            } catch (err) {
                              storyToasts.scenesError(err);
                            } finally {
                              setGeneratingScenes(false);
                            }
                          }}
                          disabled={generatingScenes || !story.story_text || story.story_text.trim().length === 0}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {generatingScenes ? (
                            <>
                              <Spinner size="sm" className="me-2" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <IconifyIcon icon="solar:gallery-bold-duotone" width={18} height={18} className="me-2" />
                              Generate Scenes
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={async () => {
                            setSavingTranscript(true);
                            try {
                              await httpClient.patch(`/stories/${id}/`, {
                                story_text: editedTranscript
                              });
                              crudToasts.saved('Transcript');
                              setEditingTranscript(false);
                              await fetchStory();
                              await fetchRevisions();
                            } catch (err) {
                              crudToasts.saveError(err, 'Transcript');
                            } finally {
                              setSavingTranscript(false);
                            }
                          }}
                          disabled={savingTranscript}
                        >
                          {savingTranscript ? (
                            <>
                              <Spinner size="sm" className="me-2" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <IconifyIcon icon="solar:check-circle-bold-duotone" width={18} height={18} className="me-2" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            setEditingTranscript(false);
                            setEditedTranscript(story.story_text || '');
                            setSelectedRevisionId(null);
                          }}
                          disabled={savingTranscript}
                        >
                          <IconifyIcon icon="solar:close-circle-bold-duotone" width={18} height={18} className="me-2" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <Card className="border">
                <Card.Body>
                  {editingTranscript && canEdit ? (
                    <Form.Control
                      as="textarea"
                      rows={15}
                      value={editedTranscript}
                      onChange={(e) => setEditedTranscript(e.target.value)}
                      style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontFamily: 'inherit' }}
                    />
                  ) : (
                    <div style={{ minHeight: '200px', whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                      {story.story_text ? (
                        story.story_text
                      ) : story && !loading ? (
                        // Story is loaded but has no text - show empty state
                        <div className="text-center text-muted py-4">
                          <p className="mb-0">No story text available yet.</p>
                          <p className="mb-0 small">Generate the story to see the transcript here.</p>
                        </div>
                      ) : (
                        // Story is still loading
                        <div className="text-center text-muted py-4">
                          <Spinner size="sm" className="me-2" />
                          Loading story...
                        </div>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Story Scenes */}
              {story.story_text && story.story_text.trim().length > 0 && (
                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">
                      <IconifyIcon icon="solar:gallery-bold-duotone" width={20} height={20} className="me-2" />
                      Story Scenes
                    </h5>
                    {canEdit && (
                      <div className="d-flex gap-2 align-items-center">
                        {/* Add Scene Manually */}
                        <div className="d-flex gap-2 align-items-center">
                          <Form.Control
                            type="number"
                            placeholder="Scene #"
                            value={newSceneNumber}
                            onChange={(e) => setNewSceneNumber(e.target.value)}
                            style={{ width: '100px' }}
                            size="sm"
                            min="1"
                          />
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={handleAddScene}
                            disabled={addingScene || !newSceneNumber || isNaN(parseInt(newSceneNumber))}
                          >
                            {addingScene ? (
                              <>
                                <Spinner size="sm" className="me-2" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <IconifyIcon icon="solar:add-circle-bold-duotone" width={18} height={18} className="me-2" />
                                Add Scene
                              </>
                            )}
                          </Button>
                        </div>
                        {/* Initialize from Story Text */}
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={handleInitializeScenes}
                          disabled={initializingScenes}
                        >
                          {initializingScenes ? (
                            <>
                              <Spinner size="sm" className="me-2" />
                              Initializing...
                            </>
                          ) : (
                            <>
                              <IconifyIcon icon="solar:refresh-bold-duotone" width={18} height={18} className="me-2" />
                              Auto-Detect Scenes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {scenes && scenes.length > 0 ? (
                    <div className="d-flex gap-3 overflow-auto pb-3" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
                      {scenes.map((scene) => {
                        // Get or create ref for this scene using useRef pattern
                        const sceneKey = `scene_${scene.scene_number}`;
                        if (!sceneFileInputRefs.current[sceneKey]) {
                          sceneFileInputRefs.current[sceneKey] = { current: null };
                        }
                        const fileInputRef = sceneFileInputRefs.current[sceneKey];
                        
                        return (
                          <Card key={scene.id} style={{ minWidth: '300px', maxWidth: '300px', flexShrink: 0 }}>
                            <Card.Body className="p-2">
                              {scene.image_url ? (
                                <div className="position-relative">
                                  <img
                                    src={scene.image_url}
                                    alt={`Scene ${scene.scene_number}`}
                                    className="img-fluid rounded"
                                    style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                                  />
                                  {canEdit && (
                                    <>
                                      <div className="position-absolute top-0 end-0 m-2 d-flex gap-1">
                                        <Button
                                          variant="light"
                                          size="sm"
                                          onClick={() => fileInputRef.current?.click()}
                                          disabled={uploadingSceneImage === scene.scene_number}
                                          style={{ opacity: 0.9 }}
                                          title="Replace image"
                                        >
                                          {uploadingSceneImage === scene.scene_number ? (
                                            <Spinner size="sm" />
                                          ) : (
                                            <IconifyIcon icon="solar:gallery-upload-bold-duotone" width={16} height={16} />
                                          )}
                                        </Button>
                                        <Button
                                          variant="danger"
                                          size="sm"
                                          onClick={() => handleDeleteScene(scene.id)}
                                          disabled={deletingScene === scene.id}
                                          style={{ opacity: 0.9 }}
                                          title="Delete scene"
                                        >
                                          {deletingScene === scene.id ? (
                                            <Spinner size="sm" />
                                          ) : (
                                            <IconifyIcon icon="solar:trash-bin-minimalistic-bold-duotone" width={16} height={16} />
                                          )}
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center text-muted py-3 border rounded">
                                  <IconifyIcon icon="solar:image-bold-duotone" width={32} height={32} />
                                  <p className="mb-2 mt-2 small">Scene {scene.scene_number}</p>
                                  {canEdit && (
                                    <div className="d-flex gap-2 justify-content-center">
                                      <Form.Control
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            handleSceneImageUpload(scene.scene_number, file);
                                          }
                                        }}
                                        disabled={uploadingSceneImage === scene.scene_number}
                                        style={{ display: 'none' }}
                                      />
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingSceneImage === scene.scene_number}
                                      >
                                        {uploadingSceneImage === scene.scene_number ? (
                                          <>
                                            <Spinner size="sm" className="me-2" />
                                            Uploading...
                                          </>
                                        ) : (
                                          <>
                                            <IconifyIcon icon="solar:gallery-upload-bold-duotone" width={16} height={16} className="me-2" />
                                            Upload Image
                                          </>
                                        )}
                                      </Button>
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => handleDeleteScene(scene.id)}
                                        disabled={deletingScene === scene.id}
                                      >
                                        {deletingScene === scene.id ? (
                                          <Spinner size="sm" />
                                        ) : (
                                          <IconifyIcon icon="solar:trash-bin-minimalistic-bold-duotone" width={16} height={16} />
                                        )}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="mt-2">
                                <Badge bg="primary" className="mb-2">Scene {scene.scene_number}</Badge>
                                {scene.scene_text && (
                                  <p className="text-muted small mb-0" style={{ 
                                    fontSize: '0.75rem', 
                                    maxHeight: '60px', 
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>
                                    {scene.scene_text.substring(0, 100)}...
                                  </p>
                                )}
                              </div>
                            </Card.Body>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Alert variant="info" className="mb-0">
                      <IconifyIcon icon="solar:info-circle-bold-duotone" width={20} height={20} className="me-2" />
                      No scenes initialized yet. {canEdit && 'Click "Initialize Scenes" to create scene slots based on story parts/chapters, or use "Generate Scenes" to create AI-generated images.'}
                    </Alert>
                  )}
                </div>
              )}
            </div>

            {/* Interactive Voice Storytelling */}
            {story.story_text && story.story_text.trim().length > 0 && (
              <VoiceStoryPlayer
                story={story}
                audioUrl={story.audio_url}
                onSessionStart={() => {}}
                onSessionEnd={() => {}}
                canEdit={canEdit}
                onSpeakingChange={setIsVoiceSpeaking}
              />
            )}

            {/* Audio Narration */}
            {story.audio_url ? (
              <div className="mb-4">
                <h5 className="mb-3">
                  <IconifyIcon icon="solar:music-note-bold-duotone" width={20} height={20} className="me-2" />
                  Story Narration
                </h5>
                <Card className="border">
                  <Card.Body>
                    <div className="d-flex align-items-center gap-3">
                      <Button
                        variant={isPlaying ? 'danger' : 'success'}
                        size="lg"
                        onClick={handlePlayPause}
                        className="d-flex align-items-center"
                        disabled={isVoiceSpeaking}
                        title={isVoiceSpeaking ? 'Voice narration is active. Please wait for it to finish.' : ''}
                      >
                        <IconifyIcon
                          icon={isPlaying ? 'solar:pause-bold-duotone' : 'solar:play-bold-duotone'}
                          width={24}
                          height={24}
                          className="me-2"
                        />
                        {isPlaying ? 'Pause' : 'Play'}
                      </Button>
                      <div className="flex-grow-1">
                        <div className="progress" style={{ height: '8px' }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{
                              width: audioDuration > 0 ? `${(audioCurrentTime / audioDuration) * 100}%` : '0%'
                            }}
                          />
                        </div>
                        <div className="d-flex justify-content-between mt-1 small text-muted">
                          <span>{formatTime(audioCurrentTime)}</span>
                          <span>{formatTime(audioDuration)}</span>
                        </div>
                      </div>
                    </div>
                    <audio 
                      ref={audioRef} 
                      src={story.audio_url} 
                      preload="metadata"
                      onError={(e) => {
                        // Audio element onError
                        // Only auto-regenerate if user is trying to play
                        if (isPlaying) {
                          handleAudioError(false);
                        }
                      }}
                    />
                  </Card.Body>
                </Card>
              </div>
            ) : (
              <div className="mb-4">
                <Alert variant="info" className="d-flex align-items-center">
                  <IconifyIcon icon="solar:info-circle-bold" width={20} height={20} className="me-2" />
                  Audio narration is not available yet. The story will be narrated automatically when generated.
                </Alert>
              </div>
            )}
          </ComponentContainerCard>
        </Col>
      </Row>
    </>
  );
};

export default StoryDetailPage;
