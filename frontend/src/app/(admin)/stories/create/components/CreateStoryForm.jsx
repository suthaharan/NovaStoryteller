import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Col, Row, Form, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import httpClient from '@/helpers/httpClient';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { storyToasts, validationToasts, handleApiError } from '@/utils/toastNotifications';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const CreateStoryForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    prompt: '',
    template: 'adventure',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  const storyTemplates = [
    { value: 'adventure', label: 'Adventure' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'sci-fi', label: 'Science Fiction' },
    { value: 'mystery', label: 'Mystery' },
    { value: 'educational', label: 'Educational' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          image: 'Please select an image file'
        }));
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          image: 'Image size must be less than 10MB'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Clear error
      if (errors.image) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.image;
          return newErrors;
        });
      }
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null
    }));
    setImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.prompt.trim()) {
      newErrors.prompt = 'Story prompt is required';
    } else if (formData.prompt.trim().length < 10) {
      newErrors.prompt = 'Story prompt must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      validationToasts.empty('Form', { autoClose: 3000 });
      return;
    }

    setLoading(true);

    try {
      // Create FormData for file upload
      const data = new FormData();
      data.append('title', formData.title);
      data.append('prompt', formData.prompt);
      data.append('template', formData.template);
      if (formData.image) {
        data.append('image', formData.image);
      }

      // Show info toast
      storyToasts.processing();

      const response = await httpClient.post('/stories/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      storyToasts.created();
      
      // Navigate to story detail page
      navigate(`/stories/${response.data.id}`);
    } catch (error) {
      console.error('Error creating story:', error);
      const errorMessage = handleApiError(error, { 
        item: 'Story', 
        action: 'create', 
        defaultMessage: 'Failed to create story. Please try again.' 
      });
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageBreadcrumb title="Create Story" subName="Stories" />
      <Row>
        <Col xs={12} lg={8}>
          <ComponentContainerCard
            title="Create New Story"
            description="Use Amazon Nova AI to generate an interactive story. Upload an image to incorporate it into your story."
          >
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Story Title <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., The Brave Astronaut"
                  isInvalid={!!errors.title}
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.title}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Give your story a catchy title
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  Story Prompt <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="prompt"
                  value={formData.prompt}
                  onChange={handleChange}
                  placeholder="e.g., Tell me a story about a brave astronaut who discovers a new planet with friendly aliens..."
                  isInvalid={!!errors.prompt}
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.prompt}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Describe what you want your story to be about. Be creative! (Minimum 10 characters)
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  Story Template <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="template"
                  value={formData.template}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {storyTemplates.map(template => (
                    <option key={template.value} value={template.value}>
                      {template.label}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Choose a template style for your story
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  Story Image (Optional)
                </Form.Label>
                <Form.Control
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={loading}
                  isInvalid={!!errors.image}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.image}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Upload an image to incorporate into your story. Amazon Nova will analyze it and include it in the narrative. (Max 10MB)
                </Form.Text>
              </Form.Group>

              {imagePreview && (
                <div className="mb-3">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <strong>Image Preview:</strong>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={removeImage}
                      disabled={loading}
                    >
                      <IconifyIcon icon="solar:trash-bin-minimalistic-bold-duotone" width={16} height={16} className="me-1" />
                      Remove
                    </Button>
                  </div>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="img-fluid rounded"
                    style={{ maxHeight: '300px', maxWidth: '100%' }}
                  />
                </div>
              )}

              {errors.submit && (
                <Alert variant="danger" className="mt-3">
                  {errors.submit}
                </Alert>
              )}

              <div className="d-flex gap-2 mt-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Creating Story...
                    </>
                  ) : (
                    <>
                      <IconifyIcon icon="solar:magic-stick-bold-duotone" width={20} height={20} className="me-2" />
                      Create Story with Nova AI
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={() => navigate('/stories')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </ComponentContainerCard>
        </Col>
        <Col xs={12} lg={4}>
          <Card className="border-info">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">
                <IconifyIcon icon="solar:info-circle-bold-duotone" width={20} height={20} className="me-2" />
                About Nova AI Stories
              </h5>
            </Card.Header>
            <Card.Body>
              <p className="mb-3">
                <strong>Amazon Nova Lite</strong> will generate your story based on your prompt and template.
              </p>
              <p className="mb-3">
                <strong>Amazon Nova 2 Sonic</strong> will create natural voice narration for your story.
              </p>
              <p className="mb-3">
                <strong>Titan Multimodal</strong> will analyze uploaded images and incorporate them into the story.
              </p>
              <div className="mt-3">
                <Badge bg="info" className="me-2">Nova Lite</Badge>
                <Badge bg="info" className="me-2">Nova 2 Sonic</Badge>
                <Badge bg="info">Titan</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default CreateStoryForm;

