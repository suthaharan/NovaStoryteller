import { useState, useEffect, useCallback } from 'react';
import { Table, Badge, InputGroup, FormControl, Spinner, Pagination, Button, Row, Col, Card, CardBody, Dropdown } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';
import { useNavigate } from 'react-router-dom';
import { getCookie } from 'cookies-next';
import Swal from 'sweetalert2';

const PlansList = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deletingUuid, setDeletingUuid] = useState(null);
  const { showNotification } = useNotificationContext();
  const navigate = useNavigate();
  
  // Check if user is staff
  const isStaff = (() => {
    try {
      const authCookie = getCookie('_Ace_AUTH_KEY_');
      if (authCookie) {
        const userData = typeof authCookie === 'string' ? JSON.parse(authCookie) : authCookie;
        return userData?.role === 'Admin' || userData?.is_staff === true;
      }
    } catch (e) {
      console.warn('Failed to parse auth cookie:', e);
    }
    return false;
  })();

  // Redirect non-staff users
  useEffect(() => {
    if (!isStaff) {
      showNotification({ message: 'Access denied. Staff only.', variant: 'danger' });
      navigate('/subscriptions/my-plan');
      return;
    }
  }, [isStaff, navigate, showNotification]);

  // Don't render if not staff
  if (!isStaff) {
    return null;
  }

  // Fetch plans
  const fetchPlans = useCallback(async (page = 1, search = '', isActive = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      
      if (search) params.append('search', search);
      if (isActive !== '') params.append('is_active', isActive);

      const response = await httpClient.get(`/plans/?${params.toString()}`);
      
      if (response.data) {
        setPlans(response.data.results || response.data);
        const count = response.data.count || response.data.length;
        setTotalCount(count);
        setTotalPages(Math.ceil(count / pageSize));
      }
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED' || error.message?.includes('cancelled')) {
        return;
      }
      showNotification({ message: 'Failed to load plans.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [pageSize, showNotification]);

  useEffect(() => {
    fetchPlans(currentPage, searchQuery, isActiveFilter);
  }, [currentPage, searchQuery, isActiveFilter, fetchPlans]);

  const handleDelete = async (uuid, planName) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete the plan "${planName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;
    
    setDeletingUuid(uuid);
    try {
      await httpClient.delete(`/plans/${uuid}/`);
      showNotification({ message: 'Plan deleted successfully.', variant: 'success' });
      fetchPlans(currentPage, searchQuery, isActiveFilter);
    } catch (error) {
      showNotification({ message: 'Failed to delete plan.', variant: 'danger' });
    } finally {
      setDeletingUuid(null);
    }
  };

  const handleToggleActive = async (uuid, currentStatus) => {
    try {
      await httpClient.patch(`/plans/${uuid}/`, {
        is_active: !currentStatus
      });
      showNotification({ message: `Plan ${!currentStatus ? 'activated' : 'deactivated'} successfully.`, variant: 'success' });
      fetchPlans(currentPage, searchQuery, isActiveFilter);
    } catch (error) {
      showNotification({ message: 'Failed to update plan status.', variant: 'danger' });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
          Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} plans
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
    <ComponentContainerCard title="Plans Management" description="Manage subscription plans.">
      {isStaff && (
        <Row className="mb-3">
          <Col md={6}>
            <Button variant="primary" onClick={() => navigate('/subscriptions/plans/create')}>
              <IconifyIcon icon="solar:add-circle-bold-duotone" width={20} height={20} className="me-1" />
              Create Plan
            </Button>
          </Col>
        </Row>
      )}

      <Card className="mb-4">
        <CardBody>
          <Row className="g-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text><IconifyIcon icon="solar:magnifer-linear" width={20} height={20} /></InputGroup.Text>
                <FormControl placeholder="Search plans..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </InputGroup>
            </Col>
            <Col md={3}>
              <FormControl as="select" value={isActiveFilter} onChange={(e) => setIsActiveFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </FormControl>
            </Col>
            <Col md={3}>
              {(searchQuery || isActiveFilter) && (
                <Button variant="outline-secondary" onClick={() => { setSearchQuery(''); setIsActiveFilter(''); }}>
                  Clear
                </Button>
              )}
            </Col>
          </Row>
        </CardBody>
      </Card>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /><p className="mt-2">Loading...</p></div>
      ) : plans.length === 0 ? (
        <div className="text-center py-5">
          <IconifyIcon icon="solar:document-text-bold-duotone" width={64} height={64} className="text-muted mb-3" />
          <p className="text-muted">No plans found.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <Table striped hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Popular</th>
                  <th>Status</th>
                  <th>Display Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td>
                      <strong>{plan.name}</strong>
                      {plan.description && (
                        <div className="text-muted small">
                          {plan.description.replace(/<[^>]*>/g, '').substring(0, 50)}...
                        </div>
                      )}
                    </td>
                    <td>{formatCurrency(plan.price)}</td>
                    <td>{plan.duration_months} {plan.duration_months === 1 ? 'Month' : 'Months'}</td>
                    <td>{plan.is_popular ? <Badge bg="info">Popular</Badge> : <Badge bg="secondary">No</Badge>}</td>
                    <td>
                      <Badge bg={plan.is_active ? 'success' : 'secondary'}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>{plan.display_order}</td>
                    <td>
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-primary" size="sm" id={`dropdown-${plan.id}`}>
                          Actions
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          {isStaff && (
                            <>
                              <Dropdown.Item onClick={() => navigate(`/subscriptions/plans/${plan.uuid}/edit`)}>
                                <IconifyIcon icon="solar:pen-bold-duotone" width={16} height={16} className="me-2" />
                                Edit
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleToggleActive(plan.uuid, plan.is_active)}>
                                <IconifyIcon icon={plan.is_active ? "solar:eye-closed-bold-duotone" : "solar:eye-bold-duotone"} width={16} height={16} className="me-2" />
                                {plan.is_active ? 'Deactivate' : 'Activate'}
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item onClick={() => handleDelete(plan.uuid, plan.name)} disabled={deletingUuid === plan.uuid} className="text-danger">
                                {deletingUuid === plan.uuid ? <Spinner size="sm" /> : <><IconifyIcon icon="solar:trash-bin-minimalistic-bold-duotone" width={16} height={16} className="me-2" />Delete</>}
                              </Dropdown.Item>
                            </>
                          )}
                          {!isStaff && (
                            <Dropdown.Item onClick={() => navigate('/subscriptions/plans/subscribe')}>
                              <IconifyIcon icon="solar:cart-bold-duotone" width={16} height={16} className="me-2" />
                              Subscribe
                            </Dropdown.Item>
                          )}
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

export default PlansList;

