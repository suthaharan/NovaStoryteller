import { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Badge, InputGroup, FormControl, Spinner, Pagination, Button, Row, Col, Card, CardBody, Dropdown } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const PageCategoriesList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deletingUuid, setDeletingUuid] = useState(null);
  const { showNotification } = useNotificationContext();
  const navigate = useNavigate();
  const fetchingRef = useRef(false);

  const fetchCategories = useCallback(async (page = 1, search = '') => {
    // Prevent concurrent fetches
    if (fetchingRef.current) return;
    
    fetchingRef.current = true;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      
      if (search) params.append('search', search);

      const response = await httpClient.get(`/page-categories/?${params.toString()}`);
      
      if (response.data) {
        setCategories(response.data.results || response.data);
        const count = response.data.count || response.data.length;
        setTotalCount(count);
        setTotalPages(Math.ceil(count / pageSize));
      }
    } catch (error) {
      // Ignore cancelled/aborted errors (from request throttling)
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED' || error.message?.includes('cancelled')) {
        return; // Silently ignore cancelled requests
      }
      showNotification({ message: 'Failed to load page categories.', variant: 'danger' });
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [pageSize, showNotification]);

  // Single useEffect to handle all fetches - initial load, page changes, and search changes
  // httpClient will deduplicate requests within 2 seconds (handles StrictMode remounts)
  useEffect(() => {
    // If search changed and we're not on page 1, reset to page 1 first (don't fetch yet)
    if (searchQuery && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }
    
    // Fetch with current values
    fetchCategories(currentPage, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery]);

  const handleDelete = async (uuid, categoryName) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete the category "${categoryName}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      customClass: {
        confirmButton: 'btn btn-danger',
        cancelButton: 'btn btn-secondary'
      },
      buttonsStyling: false
    });

    if (!result.isConfirmed) return;
    
    setDeletingUuid(uuid);
    try {
      await httpClient.delete(`/page-categories/${uuid}/`);
      showNotification({ message: 'Category deleted successfully.', variant: 'success' });
      fetchCategories(currentPage, searchQuery);
    } catch (error) {
      showNotification({ message: 'Failed to delete category.', variant: 'danger' });
    } finally {
      setDeletingUuid(null);
    }
  };

  const handleToggleActive = async (uuid, currentStatus) => {
    try {
      await httpClient.patch(`/page-categories/${uuid}/`, {
        is_active: !currentStatus
      });
      showNotification({ 
        message: `Category ${!currentStatus ? 'activated' : 'deactivated'} successfully.`, 
        variant: 'success' 
      });
      fetchCategories(currentPage, searchQuery);
    } catch (error) {
      showNotification({ message: 'Failed to update category status.', variant: 'danger' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const items = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    if (startPage > 1) {
      items.push(<Pagination.Item key={1} onClick={() => handlePageChange(1)}>1</Pagination.Item>);
      if (startPage > 2) items.push(<Pagination.Ellipsis key="ellipsis-start" />);
    }
    for (let i = startPage; i <= endPage; i++) {
      items.push(<Pagination.Item key={i} active={i === currentPage} onClick={() => handlePageChange(i)}>{i}</Pagination.Item>);
    }
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) items.push(<Pagination.Ellipsis key="ellipsis-end" />);
      items.push(<Pagination.Item key={totalPages} onClick={() => handlePageChange(totalPages)}>{totalPages}</Pagination.Item>);
    }
    return (
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted">
          Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} categories
        </div>
        <Pagination>
          <Pagination.First disabled={currentPage === 1} onClick={() => currentPage > 1 && handlePageChange(1)} />
          <Pagination.Prev disabled={currentPage === 1} onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)} />
          {items}
          <Pagination.Next disabled={currentPage === totalPages} onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)} />
          <Pagination.Last disabled={currentPage === totalPages} onClick={() => currentPage < totalPages && handlePageChange(totalPages)} />
        </Pagination>
      </div>
    );
  };

  return (
    <ComponentContainerCard title="Page Categories Management" description="Manage page categories.">
      <Row className="mb-3">
        <Col md={6}>
          <Button variant="primary" onClick={() => navigate('/page-categories/create')}>
            <IconifyIcon icon="solar:add-circle-bold-duotone" width={20} height={20} className="me-1" />
            Create Category
          </Button>
        </Col>
      </Row>

      <Card className="mb-4">
        <CardBody>
          <Row className="g-3">
            <Col md={10}>
              <InputGroup>
                <InputGroup.Text><IconifyIcon icon="solar:magnifer-linear" width={20} height={20} /></InputGroup.Text>
                <FormControl placeholder="Search categories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </InputGroup>
            </Col>
            <Col md={2}>
              {searchQuery && (
                <Button variant="outline-secondary" onClick={() => setSearchQuery('')}>
                  Clear
                </Button>
              )}
            </Col>
          </Row>
        </CardBody>
      </Card>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /><p className="mt-2">Loading...</p></div>
      ) : categories.length === 0 ? (
        <div className="text-center py-5">
          <IconifyIcon icon="solar:folder-bold-duotone" width={64} height={64} className="text-muted mb-3" />
          <p className="text-muted">No categories found.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <Table striped hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Description</th>
                  <th>Display Order</th>
                  <th>Page Count</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong></td>
                    <td><code>{item.slug}</code></td>
                    <td>{item.description || 'N/A'}</td>
                    <td>{item.display_order || 0}</td>
                    <td><Badge bg="info">{item.page_count || 0}</Badge></td>
                    <td>
                      <Badge bg={item.is_active ? 'success' : 'secondary'}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>{formatDate(item.created_at)}</td>
                    <td>
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-primary" size="sm" id={`dropdown-${item.uuid}`}>
                          Actions
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => navigate(`/page-categories/${item.uuid}/edit`)}>
                            <IconifyIcon icon="solar:pen-bold-duotone" width={16} height={16} className="me-2" />
                            Edit
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleToggleActive(item.uuid, item.is_active)}>
                            <IconifyIcon icon={item.is_active ? "solar:eye-closed-bold-duotone" : "solar:eye-bold-duotone"} width={16} height={16} className="me-2" />
                            {item.is_active ? 'Deactivate' : 'Activate'}
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item onClick={() => handleDelete(item.uuid, item.name)} disabled={deletingUuid === item.uuid} className="text-danger">
                            {deletingUuid === item.uuid ? <Spinner size="sm" /> : <><IconifyIcon icon="solar:trash-bin-minimalistic-bold-duotone" width={16} height={16} className="me-2" />Delete</>}
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

export default PageCategoriesList;

