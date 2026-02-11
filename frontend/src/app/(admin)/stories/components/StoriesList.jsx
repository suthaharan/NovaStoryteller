import { useState, useEffect, useMemo } from 'react';
import { Card, Col, Row, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getFilteredRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table';
import httpClient from '@/helpers/httpClient';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import Pagination from '@/components/Table/Pagination';
import AudioPlayer from './AudioPlayer';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { useAuthContext } from '@/context/useAuthContext';
import { usePaginatedData } from '@/hooks/usePaginatedData';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorAlert from '@/components/common/ErrorAlert';
import { formatDate } from '@/utils/dateFormatter';
import { showError, showSuccessTemplate, handleApiError } from '@/utils/toastNotifications';

const StoriesList = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [playingStoryId, setPlayingStoryId] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // Use paginated data hook
  const {
    data: stories,
    loading,
    error,
    pagination,
    fetchData: fetchStories,
    handlePageChange,
    handlePageSizeChange,
  } = usePaginatedData('/stories/', {
    defaultPageSize: 10,
    showToast: true,
  });

  // Initial fetch
  useEffect(() => {
    fetchStories(1, 10);
  }, [fetchStories]);

  // Start listening session
  const startSession = async (storyId) => {
    try {
      const response = await httpClient.post('/story-sessions/', {
        story: storyId,
      });
      setCurrentSessionId(response.data.id);
      return response.data.id;
    } catch (err) {
      showError(err, { defaultMessage: 'Failed to start session' });
      console.error('Start session error:', err);
      return null;
    }
  };

  // End listening session
  const endSession = async (sessionId, completed = false) => {
    if (!sessionId) return;
    
    try {
      await httpClient.post(`/story-sessions/${sessionId}/end_session/`, {
        completed,
      });
      setCurrentSessionId(null);
    } catch (err) {
      showError(err, { defaultMessage: 'Failed to end session' });
      console.error('End session error:', err);
    }
  };

  // Handle play/pause
  const handlePlayPause = async (story) => {
    if (playingStoryId === story.id) {
      // Pause - end current session
      if (currentSessionId) {
        await endSession(currentSessionId, false);
      }
      setPlayingStoryId(null);
    } else {
      // Play - start new session
      if (playingStoryId && currentSessionId) {
        // End previous session
        await endSession(currentSessionId, false);
      }
      const sessionId = await startSession(story.id);
      if (sessionId) {
        setPlayingStoryId(story.id);
      }
    }
  };

  // Handle audio end
  const handleAudioEnd = async () => {
    if (currentSessionId) {
      await endSession(currentSessionId, true);
    }
    setPlayingStoryId(null);
  };

  // Table columns
  const columns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <div>
            <div className="fw-semibold">
              <a
                href={`/stories/${row.original.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/stories/${row.original.id}`);
                }}
                className="text-decoration-none"
                style={{ cursor: 'pointer' }}
              >
                {row.original.title}
              </a>
            </div>
            <div className="text-muted small">{row.original.user_name}</div>
          </div>
        ),
      },
      {
        accessorKey: 'template',
        header: 'Template',
        cell: ({ row }) => (
          <Badge bg="primary">{row.original.template}</Badge>
        ),
      },
      {
        accessorKey: 'is_published',
        header: 'Status',
        cell: ({ row }) => {
          const story = row.original;
          // Check if user can edit: superuser or story owner
          // story.user is the user ID from the API
          const canEdit = user?.is_superuser || String(story.user) === String(user?.id);
          return (
            <div className="d-flex align-items-center gap-2">
              <Badge bg={story.is_published ? 'success' : 'secondary'}>
                {story.is_published ? 'Published' : 'Draft'}
              </Badge>
              {canEdit ? (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={async (e) => {
                    e.stopPropagation(); // Prevent row click
                    try {
                      const newStatus = !story.is_published;
                      await httpClient.patch(`/stories/${story.id}/`, {
                        is_published: newStatus
                      });
                      showSuccessTemplate(newStatus ? 'published' : 'unpublished', 'Story');
                      fetchStories(pagination.currentPage, pagination.pageSize);
                    } catch (err) {
                      handleApiError(err, { item: 'Story status', action: 'update', defaultMessage: 'Failed to update status' });
                    }
                  }}
                  title={story.is_published ? 'Unpublish' : 'Publish'}
                >
                  <IconifyIcon 
                    icon={story.is_published ? 'solar:eye-closed-bold-duotone' : 'solar:eye-bold-duotone'} 
                    width={14} 
                    height={14} 
                  />
                </Button>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: 'audio_url',
        header: 'Audio',
        cell: ({ row }) => (
          <div>
            {row.original.audio_url ? (
              <AudioPlayer
                audioUrl={row.original.audio_url}
                storyId={row.original.id}
                isPlaying={playingStoryId === row.original.id}
                onPlayPause={() => handlePlayPause(row.original)}
                onEnd={handleAudioEnd}
              />
            ) : (
              <span className="text-muted">No audio</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ row }) => (
          <div>
            {formatDate(row.original.created_at)}
          </div>
        ),
      },
    ],
    [playingStoryId, currentSessionId, navigate, user]
  );

  const table = useReactTable({
    data: stories,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Disable client-side pagination - we're using server-side pagination
    manualPagination: true,
    pageCount: pagination.totalPages,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      pagination: {
        pageIndex: pagination.currentPage - 1, // TanStack uses 0-based index
        pageSize: pagination.pageSize,
      },
    },
    onPaginationChange: (updater) => {
      const newState = typeof updater === 'function' 
        ? updater({ pageIndex: pagination.currentPage - 1, pageSize: pagination.pageSize })
        : updater;
      
      if (newState.pageIndex !== undefined && newState.pageIndex !== pagination.currentPage - 1) {
        handlePageChange(newState.pageIndex + 1);
      }
      if (newState.pageSize !== undefined && newState.pageSize !== pagination.pageSize) {
        handlePageSizeChange(newState.pageSize);
      }
    },
  });

  if (loading && stories.length === 0) {
    return <LoadingSpinner message="Loading stories..." />;
  }

  return (
    <>
      <PageBreadcrumb title="Stories" subName="Stories" />
      <Row>
        <Col xs={12}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Stories List</h4>
            <Button
              variant="primary"
              onClick={() => navigate('/stories/create')}
            >
              <IconifyIcon icon="solar:add-circle-bold-duotone" width={20} height={20} className="me-2" />
              Create New Story
            </Button>
          </div>
          <ComponentContainerCard title="Stories List">
            <ErrorAlert error={error} />
            
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          scope="col"
                          style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: ' ↑',
                            desc: ' ↓',
                          }[header.column.getIsSorted()] ?? null}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-4">
                        <div className="text-muted">No stories found</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 0 && (
              <Pagination
                table={table}
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
              />
            )}
          </ComponentContainerCard>
        </Col>
      </Row>
    </>
  );
};

export default StoriesList;

