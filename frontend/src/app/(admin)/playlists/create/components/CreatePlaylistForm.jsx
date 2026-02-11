import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader, Col, Row, Form, Button, Spinner, Alert, Badge, Table } from 'react-bootstrap';
import httpClient from '@/helpers/httpClient';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { crudToasts, validationToasts, handleApiError } from '@/utils/toastNotifications';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const CreatePlaylistForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingStories, setLoadingStories] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false,
    story_ids: [],
  });
  const [availableStories, setAvailableStories] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoadingStories(true);
      const response = await httpClient.get('/stories/', {
        params: {
          page_size: 100, // Get all user stories
        },
      });
      
      if (response.data && response.data.results) {
        setAvailableStories(response.data.results);
      }
    } catch (err) {
      handleApiError(err, { item: 'Stories', action: 'fetch', defaultMessage: 'Failed to fetch stories' });
    } finally {
      setLoadingStories(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const toggleStory = (storyId) => {
    setFormData(prev => {
      const storyIds = prev.story_ids || [];
      if (storyIds.includes(storyId)) {
        return {
          ...prev,
          story_ids: storyIds.filter(id => id !== storyId)
        };
      } else {
        return {
          ...prev,
          story_ids: [...storyIds, storyId]
        };
      }
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Playlist name is required';
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
      const response = await httpClient.post('/playlists/', formData);
      crudToasts.created('Playlist');
      navigate(`/playlists/${response.data.id}`);
    } catch (error) {
      const errorMessage = handleApiError(error, { 
        item: 'Playlist', 
        action: 'create', 
        defaultMessage: 'Failed to create playlist. Please try again.' 
      });
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageBreadcrumb title="Create Playlist" subName="Playlists" />
      <Row>
        <Col xs={12} lg={8}>
          <ComponentContainerCard
            title="Create New Playlist"
            description="Organize your stories into playlists for easy access and sequential playback."
          >
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Playlist Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Bedtime Stories"
                  isInvalid={!!errors.name}
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Optional description for your playlist"
                  disabled={loading}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  name="is_public"
                  checked={formData.is_public}
                  onChange={handleChange}
                  label="Make this playlist public (visible to all users)"
                  disabled={loading}
                />
              </Form.Group>

              <hr />

              <div className="mb-3">
                <h5>Select Stories</h5>
                <p className="text-muted">Choose stories to add to your playlist</p>
                
                {loadingStories ? (
                  <div className="text-center py-3">
                    <Spinner size="sm" />
                    <span className="ms-2">Loading stories...</span>
                  </div>
                ) : availableStories.length === 0 ? (
                  <Alert variant="info">
                    No stories available. <a href="/stories/create">Create a story</a> first.
                  </Alert>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <Table striped hover>
                      <thead className="table-light sticky-top">
                        <tr>
                          <th style={{ width: '50px' }}>Add</th>
                          <th>Title</th>
                          <th>Template</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableStories.map((story) => (
                          <tr key={story.id}>
                            <td>
                              <Form.Check
                                type="checkbox"
                                checked={formData.story_ids?.includes(story.id) || false}
                                onChange={() => toggleStory(story.id)}
                              />
                            </td>
                            <td>
                              <a
                                href={`/stories/${story.id}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  window.open(`/stories/${story.id}`, '_blank');
                                }}
                                className="text-decoration-none"
                              >
                                {story.title}
                              </a>
                            </td>
                            <td>
                              <Badge bg="primary">{story.template}</Badge>
                            </td>
                            <td>{new Date(story.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
                
                {formData.story_ids.length > 0 && (
                  <div className="mt-2">
                    <Badge bg="success">{formData.story_ids.length} story{formData.story_ids.length !== 1 ? 's' : ''} selected</Badge>
                  </div>
                )}
              </div>

              {errors.submit && (
                <Alert variant="danger" className="mt-3">
                  {errors.submit}
                </Alert>
              )}

              <div className="d-flex gap-2 mt-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || loadingStories}
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <IconifyIcon icon="solar:add-circle-bold-duotone" width={20} height={20} className="me-2" />
                      Create Playlist
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={() => navigate('/playlists')}
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
                About Playlists
              </h5>
            </Card.Header>
            <Card.Body>
              <p className="mb-3">
                <strong>Organize Stories:</strong> Group your favorite stories together for easy access.
              </p>
              <p className="mb-3">
                <strong>Sequential Playback:</strong> Play all stories in a playlist one after another.
              </p>
              <p className="mb-3">
                <strong>Public or Private:</strong> Share your playlists with others or keep them private.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default CreatePlaylistForm;

