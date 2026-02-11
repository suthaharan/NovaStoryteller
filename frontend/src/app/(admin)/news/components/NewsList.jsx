import { useState } from 'react';
import { Table, Badge, InputGroup, FormControl, Spinner, Pagination, Button, Row, Col, Card, CardBody, Dropdown } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';
import { useNavigate } from 'react-router-dom';
import { useFilteredPaginatedData } from '@/hooks/useFilteredPaginatedData';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorAlert from '@/components/common/ErrorAlert';
import { formatDate } from '@/utils/dateFormatter';

const NewsList = () => {
  const [deletingId, setDeletingId] = useState(null);
  const { showNotification } = useNotificationContext();
  const navigate = useNavigate();

  // Use filtered paginated data hook
  const {
    data: news,
    loading,
    error,
    pagination,
    categories,
    searchQuery,
    selectedCategory,
    selectedStatus,
    setSearchQuery,
    setSelectedCategory,
    setSelectedStatus,
    handlePageChange,
    refetch,
    clearFilters,
  } = useFilteredPaginatedData('/news/', '/news-categories/?is_active=true', {
    defaultPageSize: 10,
    debounceMs: 500,
    showToast: false, // We'll use showNotification instead
    onError: (err) => {
      showNotification({ message: 'Failed to load news.', variant: 'danger' });
    },
  });

  const handleDelete = async (uuid) => {
    if (!window.confirm('Are you sure you want to delete this news article?')) return;
    
    setDeletingId(uuid);
    try {
      await httpClient.delete(`/news/${uuid}/`);
      showNotification({ message: 'News deleted successfully.', variant: 'success' });
      refetch(pagination.currentPage);
    } catch (error) {
      showNotification({ message: 'Failed to delete news.', variant: 'danger' });
    } finally {
      setDeletingId(null);
    }
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    const items = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    if (startPage > 1) {
      items.push(<Pagination.Item key={1} onClick={() => handlePageChange(1)}>1</Pagination.Item>);
      if (startPage > 2) items.push(<Pagination.Ellipsis key="ellipsis-start" />);
    }
    for (let i = startPage; i <= endPage; i++) {
      items.push(<Pagination.Item key={i} active={i === pagination.currentPage} onClick={() => handlePageChange(i)}>{i}</Pagination.Item>);
    }
    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) items.push(<Pagination.Ellipsis key="ellipsis-end" />);
      items.push(<Pagination.Item key={pagination.totalPages} onClick={() => handlePageChange(pagination.totalPages)}>{pagination.totalPages}</Pagination.Item>);
    }
    return (
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted">
          Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.total)} of {pagination.total} news
        </div>
        <Pagination>
          <Pagination.First disabled={pagination.currentPage === 1} onClick={() => pagination.currentPage > 1 && handlePageChange(1)} />
          <Pagination.Prev disabled={pagination.currentPage === 1} onClick={() => pagination.currentPage > 1 && handlePageChange(pagination.currentPage - 1)} />
          {items}
          <Pagination.Next disabled={pagination.currentPage === pagination.totalPages} onClick={() => pagination.currentPage < pagination.totalPages && handlePageChange(pagination.currentPage + 1)} />
          <Pagination.Last disabled={pagination.currentPage === pagination.totalPages} onClick={() => pagination.currentPage < pagination.totalPages && handlePageChange(pagination.totalPages)} />
        </Pagination>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const variants = { draft: 'secondary', published: 'success', archived: 'warning' };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <ComponentContainerCard title="News Management" description="Manage news articles and categories.">
      <Row className="mb-3">
        <Col md={6}>
          <Button variant="primary" onClick={() => navigate('/news/create')}>
            <IconifyIcon icon="solar:add-circle-bold-duotone" width={20} height={20} className="me-1" />
            Create News
          </Button>
        </Col>
      </Row>

      <Card className="mb-4">
        <CardBody>
          <Row className="g-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text><IconifyIcon icon="solar:magnifer-linear" width={20} height={20} /></InputGroup.Text>
                <FormControl placeholder="Search news..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </InputGroup>
            </Col>
            <Col md={3}>
              <FormControl as="select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </FormControl>
            </Col>
            <Col md={3}>
              <FormControl as="select" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </FormControl>
            </Col>
            <Col md={2}>
              {(searchQuery || selectedCategory || selectedStatus) && (
                <Button variant="outline-secondary" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </Col>
          </Row>
        </CardBody>
      </Card>

      <ErrorAlert error={error} />
      
      {loading ? (
        <LoadingSpinner message="Loading news..." />
      ) : news.length === 0 ? (
        <div className="text-center py-5">
          <IconifyIcon icon="solar:document-text-bold-duotone" width={64} height={64} className="text-muted mb-3" />
          <p className="text-muted">No news found.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <Table striped hover>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Views</th>
                  <th>Published</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {news.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.category_name || 'N/A'}</td>
                    <td>{item.author_username || 'N/A'}</td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td>{item.is_featured ? <Badge bg="info">Yes</Badge> : <Badge bg="secondary">No</Badge>}</td>
                    <td>{item.views_count || 0}</td>
                    <td>{formatDate(item.published_at)}</td>
                    <td>
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-primary" size="sm" id={`dropdown-${item.id}`}>
                          Actions
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => navigate(`/news/${item.uuid}/edit`)}>
                            <IconifyIcon icon="solar:pen-bold-duotone" width={16} height={16} className="me-2" />
                            Edit
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleDelete(item.uuid)} disabled={deletingId === item.uuid}>
                            {deletingId === item.id ? <Spinner size="sm" /> : <><IconifyIcon icon="solar:trash-bin-minimalistic-bold-duotone" width={16} height={16} className="me-2" />Delete</>}
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          {renderPagination()}
        </>
      )}
    </ComponentContainerCard>
  );
};

export default NewsList;

