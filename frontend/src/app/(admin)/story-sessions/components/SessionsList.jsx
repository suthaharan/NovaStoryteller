import { useEffect, useMemo } from 'react';
import { Col, Row, Badge } from 'react-bootstrap';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getFilteredRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import Pagination from '@/components/Table/Pagination';
import { usePaginatedData } from '@/hooks/usePaginatedData';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorAlert from '@/components/common/ErrorAlert';
import { formatDateTime } from '@/utils/dateFormatter';

const SessionsList = () => {
  // Use paginated data hook
  const {
    data: sessions,
    loading,
    error,
    pagination,
    fetchData: fetchSessions,
    handlePageChange,
    handlePageSizeChange,
  } = usePaginatedData('/story-sessions/', {
    defaultPageSize: 10,
    showToast: true,
  });

  // Initial fetch
  useEffect(() => {
    fetchSessions(1, 10);
  }, [fetchSessions]);

  // Table columns
  const columns = useMemo(
    () => [
      {
        accessorKey: 'story_title',
        header: 'Story',
        cell: ({ row }) => (
          <div className="fw-semibold">{row.original.story_title}</div>
        ),
      },
      {
        accessorKey: 'user_name',
        header: 'User',
        cell: ({ row }) => (
          <div>{row.original.user_name}</div>
        ),
      },
      {
        accessorKey: 'started_at',
        header: 'Started At',
        cell: ({ row }) => (
          <div>
            {formatDateTime(row.original.started_at)}
          </div>
        ),
      },
      {
        accessorKey: 'ended_at',
        header: 'Ended At',
        cell: ({ row }) => (
          <div>
            {row.original.ended_at
              ? formatDateTime(row.original.ended_at)
              : <span className="text-muted">In progress</span>}
          </div>
        ),
      },
      {
        accessorKey: 'duration_formatted',
        header: 'Duration',
        cell: ({ row }) => (
          <div>
            {row.original.duration_formatted || (
              <span className="text-muted">-</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'completed',
        header: 'Status',
        cell: ({ row }) => (
          <Badge bg={row.original.completed ? 'success' : row.original.ended_at ? 'warning' : 'info'}>
            {row.original.completed
              ? 'Completed'
              : row.original.ended_at
              ? 'Incomplete'
              : 'In Progress'}
          </Badge>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: sessions,
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

  if (loading && sessions.length === 0) {
    return <LoadingSpinner message="Loading sessions..." />;
  }

  return (
    <>
      <PageBreadcrumb title="Story Sessions" subName="Sessions" />
      <Row>
        <Col xs={12}>
          <ComponentContainerCard title="Listening Sessions">
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
                        <div className="text-muted">No sessions found</div>
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

export default SessionsList;

