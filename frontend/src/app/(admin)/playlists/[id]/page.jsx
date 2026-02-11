import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Col, Row, Badge, Button, Spinner, Table } from 'react-bootstrap';
import httpClient from '@/helpers/httpClient';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { useAuthContext } from '@/context/useAuthContext';
import { crudToasts, showSuccessTemplate, handleApiError } from '@/utils/toastNotifications';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorAlert from '@/components/common/ErrorAlert';

const PlaylistDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlaylist();
  }, [id]);

  const fetchPlaylist = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get(`/playlists/${id}/`);
      setPlaylist(response.data);
    } catch (err) {
      const errorMessage = handleApiError(err, { item: 'Playlist', action: 'fetch', defaultMessage: 'Failed to fetch playlist' });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStory = async (storyId, storyTitle) => {
    if (!window.confirm(`Remove "${storyTitle}" from this playlist?`)) {
      return;
    }

    try {
      const currentStoryIds = playlist.stories.map(s => s.id).filter(id => id !== storyId);
      await httpClient.patch(`/playlists/${id}/`, {
        story_ids: currentStoryIds
      });
      showSuccessTemplate('removed', 'Story');
      fetchPlaylist();
    } catch (err) {
      handleApiError(err, { item: 'Story', action: 'remove', defaultMessage: 'Failed to remove story' });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
      return;
    }

    try {
      await httpClient.delete(`/playlists/${id}/`);
      crudToasts.deleted('Playlist');
      navigate('/playlists');
    } catch (err) {
      crudToasts.deleteError(err, 'Playlist');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading playlist..." />;
  }

  if (error || !playlist) {
    return (
      <>
        <PageBreadcrumb title="Playlist Detail" subName="Playlists" />
        <Row>
          <Col xs={12}>
            <ComponentContainerCard title="Error">
              <ErrorAlert error={error || 'Playlist not found'} />
              <Button variant="primary" onClick={() => navigate('/playlists')}>
                Back to Playlists
              </Button>
            </ComponentContainerCard>
          </Col>
        </Row>
      </>
    );
  }

  const canEdit = user?.is_superuser || playlist.user === user?.id;

  return (
    <>
      <PageBreadcrumb title="Playlist Detail" subName="Playlists" />
      <Row>
        <Col xs={12}>
          <ComponentContainerCard title={playlist.name}>
            <div className="mb-4 d-flex flex-wrap gap-2">
              <Button variant="outline-secondary" onClick={() => navigate('/playlists')}>
                <IconifyIcon icon="solar:arrow-left-bold-duotone" width={18} height={18} className="me-2" />
                Back to Playlists
              </Button>
              
              {canEdit && (
                <>
                  <Button
                    variant="outline-primary"
                    onClick={() => navigate(`/playlists/${id}/edit`)}
                  >
                    <IconifyIcon icon="solar:pen-bold-duotone" width={18} height={18} className="me-2" />
                    Edit Playlist
                  </Button>
                  <Button
                    variant="outline-danger"
                    onClick={handleDelete}
                  >
                    <IconifyIcon icon="solar:trash-bin-minimalistic-bold-duotone" width={18} height={18} className="me-2" />
                    Delete Playlist
                  </Button>
                </>
              )}
            </div>

            <Row className="mb-4">
              <Col md={6}>
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <div className="mb-3">
                      <strong className="text-muted d-block mb-1">Created By</strong>
                      <span>{playlist.user_name}</span>
                    </div>
                    <div className="mb-3">
                      <strong className="text-muted d-block mb-1">Visibility</strong>
                      <Badge bg={playlist.is_public ? 'success' : 'secondary'}>
                        {playlist.is_public ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                    <div className="mb-3">
                      <strong className="text-muted d-block mb-1">Stories</strong>
                      <Badge bg="info">{playlist.story_count || 0} stories</Badge>
                    </div>
                    <div>
                      <strong className="text-muted d-block mb-1">Created</strong>
                      <span>{new Date(playlist.created_at).toLocaleString()}</span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                {playlist.description && (
                  <Card className="border">
                    <Card.Body>
                      <strong>Description</strong>
                      <p className="mb-0 mt-2">{playlist.description}</p>
                    </Card.Body>
                  </Card>
                )}
              </Col>
            </Row>

            <hr />

            <div className="mb-3">
              <h5>
                <IconifyIcon icon="solar:book-2-bold-duotone" width={20} height={20} className="me-2" />
                Stories in Playlist
              </h5>
            </div>

            {playlist.stories && playlist.stories.length > 0 ? (
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Template</th>
                      <th>Created</th>
                      {canEdit && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {playlist.stories.map((story) => (
                      <tr key={story.id}>
                        <td>
                          <a
                            href={`/stories/${story.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/stories/${story.id}`);
                            }}
                            className="text-decoration-none fw-semibold"
                          >
                            {story.title}
                          </a>
                        </td>
                        <td>
                          <Badge bg="primary">{story.template}</Badge>
                        </td>
                        <td>{new Date(story.created_at).toLocaleDateString()}</td>
                        {canEdit && (
                          <td>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleRemoveStory(story.id, story.title)}
                            >
                              <IconifyIcon icon="solar:trash-bin-minimalistic-bold-duotone" width={16} height={16} />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-5">
                <IconifyIcon icon="solar:book-2-bold-duotone" width={64} height={64} className="text-muted mb-3" />
                <p className="text-muted">No stories in this playlist yet.</p>
                {canEdit && (
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/playlists/${id}/edit`)}
                  >
                    Add Stories
                  </Button>
                )}
              </div>
            )}
          </ComponentContainerCard>
        </Col>
      </Row>
    </>
  );
};

export default PlaylistDetailPage;

