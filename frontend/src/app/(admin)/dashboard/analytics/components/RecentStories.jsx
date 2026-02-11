import { useCallback, useEffect } from 'react';
import { Card, CardBody, CardHeader, CardTitle, Table, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useApiData } from '@/hooks/useApiData';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorAlert from '@/components/common/ErrorAlert';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { formatDate } from '@/utils/dateFormatter';

const RecentStories = () => {
  // Memoize transform function to prevent infinite loops
  const transformRecentStories = useCallback((responseData) => {
    // The API returns recent_stories at the root level
    // Handle both direct array and object with recent_stories property
    let stories = [];
    if (Array.isArray(responseData)) {
      stories = responseData;
    } else if (responseData && typeof responseData === 'object') {
      stories = responseData.recent_stories || [];
    }
    return stories;
  }, []);

  const { data, loading, error, refetch } = useApiData('/dashboard-stats/', {
    transformData: transformRecentStories,
    showToast: false, // Don't show toast, we'll handle errors in the component
    autoFetch: true,
    dependencies: [], // No additional dependencies
  });

  const recentStories = Array.isArray(data) ? data : [];

  if (loading) {
    return (
      <Card>
        <CardBody>
          <LoadingSpinner message="Loading recent stories..." />
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="card-height-100">
        <CardBody>
          <ErrorAlert message={error} />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="card-height-100">
      <CardHeader className="d-flex align-items-center justify-content-between gap-2">
        <CardTitle as="h4" className="flex-grow-1">
          Recent Stories
        </CardTitle>
        <div>
          <Link to="/stories">
            <Button variant="soft-primary" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <div className="table-responsive">
        <Table className="table-hover table-nowrap table-centered m-0">
          <thead className="bg-light bg-opacity-50">
            <tr>
              <th className="text-muted py-1">Title</th>
              <th className="text-muted py-1">Status</th>
              {recentStories.length > 0 && recentStories[0].user__username && (
                <th className="text-muted py-1">Created By</th>
              )}
              <th className="text-muted py-1">Created At</th>
              <th className="text-muted py-1">Action</th>
            </tr>
          </thead>
          <tbody>
            {recentStories.length === 0 ? (
              <tr>
                <td colSpan={recentStories.length > 0 && recentStories[0].user__username ? 5 : 4} className="text-center py-4">
                  <p className="text-muted mb-0">No stories yet</p>
                  <Link to="/stories/create">
                    <Button variant="primary" size="sm" className="mt-2">
                      <IconifyIcon icon="solar:add-circle-bold" className="me-1" />
                      Create Your First Story
                    </Button>
                  </Link>
                </td>
              </tr>
            ) : (
              recentStories.map((story) => (
                <tr key={story.id}>
                  <td>
                    <Link to={`/stories/${story.id}`} className="text-muted fw-medium">
                      {story.title || 'Untitled Story'}
                    </Link>
                  </td>
                  <td>
                    <Badge bg={story.is_published ? 'success' : 'secondary'}>
                      {story.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </td>
                  {story.user__username && (
                    <td>
                      <span className="text-muted">{story.user__username}</span>
                    </td>
                  )}
                  <td>
                    <span className="text-muted">
                      {story.created_at ? formatDate(story.created_at) : 'N/A'}
                    </span>
                  </td>
                  <td>
                    <Link to={`/stories/${story.id}`}>
                      <IconifyIcon icon="solar:eye-bold" className="fs-16 text-primary" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </Card>
  );
};

export default RecentStories;

