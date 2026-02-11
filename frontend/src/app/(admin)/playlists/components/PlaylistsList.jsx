import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Col, Row, Badge, Button, Table } from 'react-bootstrap';
import httpClient from '@/helpers/httpClient';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { usePaginatedData } from '@/hooks/usePaginatedData';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorAlert from '@/components/common/ErrorAlert';
import { formatDate } from '@/utils/dateFormatter';
import { crudToasts, handleApiError } from '@/utils/toastNotifications';

const PlaylistsList = () => {
  const navigate = useNavigate();

  // Use paginated data hook
  const {
    data: playlists,
    loading,
    error,
    pagination,
    fetchData: fetchPlaylists,
  } = usePaginatedData('/playlists/', {
    defaultPageSize: 10,
    showToast: true,
  });

  // Fetch when page changes
  useEffect(() => {
    fetchPlaylists(pagination.currentPage, pagination.pageSize);
  }, [pagination.currentPage, fetchPlaylists, pagination.pageSize]);

  const handleDelete = async (playlistId, playlistName) => {
    if (!window.confirm(`Are you sure you want to delete "${playlistName}"?`)) {
      return;
    }

    try {
      await httpClient.delete(`/playlists/${playlistId}/`);
      crudToasts.deleted('Playlist');
      fetchPlaylists();
    } catch (err) {
      crudToasts.deleteError(err, 'Playlist');
    }
  };

  const handlePageChange = (page) => {
    fetchPlaylists(page, pagination.pageSize);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && playlists.length === 0) {
    return <LoadingSpinner message="Loading playlists..." />;
  }

  return (
    <>
      <PageBreadcrumb title="Playlists" subName="Playlists" />
      <Row>
        <Col xs={12}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>My Playlists</h4>
            <Button
              variant="primary"
              onClick={() => navigate('/playlists/create')}
            >
              <IconifyIcon icon="solar:add-circle-bold-duotone" width={20} height={20} className="me-2" />
              Create Playlist
            </Button>
          </div>
          <ComponentContainerCard title="Playlists">
            <ErrorAlert error={error} />

            {playlists.length === 0 ? (
              <div className="text-center py-5">
                <IconifyIcon icon="solar:playlist-bold-duotone" width={64} height={64} className="text-muted mb-3" />
                <p className="text-muted">No playlists found.</p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/playlists/create')}
                >
                  Create Your First Playlist
                </Button>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table striped hover className="table-centered">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Stories</th>
                        <th>Visibility</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playlists.map((playlist) => (
                        <tr key={playlist.id}>
                          <td>
                            <div>
                              <div className="fw-semibold">
                                <a
                                  href={`/playlists/${playlist.id}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    navigate(`/playlists/${playlist.id}`);
                                  }}
                                  className="text-decoration-none"
                                >
                                  {playlist.name}
                                </a>
                              </div>
                              <div className="text-muted small">{playlist.user_name}</div>
                            </div>
                          </td>
                          <td>
                            <span className="text-muted">
                              {playlist.description || 'No description'}
                            </span>
                          </td>
                          <td>
                            <Badge bg="info">{playlist.story_count || 0} stories</Badge>
                          </td>
                          <td>
                            <Badge bg={playlist.is_public ? 'success' : 'secondary'}>
                              {playlist.is_public ? 'Public' : 'Private'}
                            </Badge>
                          </td>
                          <td>{formatDate(playlist.created_at)}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => navigate(`/playlists/${playlist.id}`)}
                              >
                                <IconifyIcon icon="solar:eye-bold-duotone" width={16} height={16} />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(playlist.id, playlist.name)}
                              >
                                <IconifyIcon icon="solar:trash-bin-minimalistic-bold-duotone" width={16} height={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {pagination.totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="text-muted">
                      Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.total)} of {pagination.total} playlists
                    </div>
                    <nav>
                      <ul className="pagination mb-0">
                        <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                          <button className="page-link" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}>
                            Previous
                          </button>
                        </li>
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                          <li key={page} className={`page-item ${page === pagination.currentPage ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => handlePageChange(page)}>
                              {page}
                            </button>
                          </li>
                        ))}
                        <li className={`page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                          <button className="page-link" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages}>
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </>
            )}
          </ComponentContainerCard>
        </Col>
      </Row>
    </>
  );
};

export default PlaylistsList;

