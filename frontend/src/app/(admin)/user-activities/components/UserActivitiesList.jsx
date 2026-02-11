import { useState, useEffect, useCallback } from 'react';
import { Table, Badge, InputGroup, FormControl, Spinner, Pagination, Row, Col, Button, Card, CardBody } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month} ${day}, ${year} ${hours}:${minutes}`;
};

const UserActivitiesList = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  
  // Filter states
  const [filterDescription, setFilterDescription] = useState('');
  const [filterUsername, setFilterUsername] = useState('');
  const [filterIpAddress, setFilterIpAddress] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  const { showNotification } = useNotificationContext();

  const fetchActivities = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      
      // Add filters
      if (filterDescription) {
        params.append('description', filterDescription);
      }
      if (filterUsername) {
        params.append('username', filterUsername);
      }
      if (filterIpAddress) {
        params.append('ip_address', filterIpAddress);
      }
      if (filterStartDate) {
        // Convert YYYY-MM-DD to ISO format for backend (local timezone)
        const [year, month, day] = filterStartDate.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
        params.append('start_date', startDate.toISOString());
      }
      if (filterEndDate) {
        // Convert YYYY-MM-DD to ISO format for backend (local timezone)
        const [year, month, day] = filterEndDate.split('-');
        const endDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999);
        params.append('end_date', endDate.toISOString());
      }

      const response = await httpClient.get(`/user-activities/?${params.toString()}`);
      
      if (response.data) {
        setActivities(response.data.results || response.data);
        const count = response.data.count || response.data.length;
        setTotalCount(count);
        setTotalPages(Math.ceil(count / pageSize));
      }
    } catch (error) {
      showNotification({ message: 'Failed to load activities.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [pageSize, showNotification, filterDescription, filterUsername, filterIpAddress, filterStartDate, filterEndDate]);

  useEffect(() => {
    fetchActivities(currentPage);
  }, [currentPage, fetchActivities]);

  // Debounced filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchActivities(1);
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filterDescription, filterUsername, filterIpAddress, filterStartDate, filterEndDate, fetchActivities]);

  const handleClearFilters = () => {
    setFilterDescription('');
    setFilterUsername('');
    setFilterIpAddress('');
    setFilterStartDate('');
    setFilterEndDate('');
    setCurrentPage(1);
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

    // First page
    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis-start" />);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis-end" />);
      }
      items.push(
        <Pagination.Item key={totalPages} onClick={() => handlePageChange(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    return (
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted">
          Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} activities
        </div>
        <Pagination>
          <Pagination.First
            disabled={currentPage === 1}
            onClick={() => currentPage > 1 && handlePageChange(1)}
          />
          <Pagination.Prev
            disabled={currentPage === 1}
            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
          />
          {items}
          <Pagination.Next
            disabled={currentPage === totalPages}
            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
          />
          <Pagination.Last
            disabled={currentPage === totalPages}
            onClick={() => currentPage < totalPages && handlePageChange(totalPages)}
          />
        </Pagination>
      </div>
    );
  };

  const hasActiveFilters = filterDescription || filterUsername || filterIpAddress || filterStartDate || filterEndDate;

  return (
    <ComponentContainerCard title="User Activities" description="View user activity logs and system events.">
      {/* Filters */}
      <Card className="mb-4">
        <CardBody>
          <Row className="g-3">
            <Col md={6} lg={3}>
              <FormControl
                type="text"
                placeholder="Filter by description..."
                value={filterDescription}
                onChange={(e) => setFilterDescription(e.target.value)}
              />
            </Col>
            <Col md={6} lg={3}>
              <FormControl
                type="text"
                placeholder="Filter by username..."
                value={filterUsername}
                onChange={(e) => setFilterUsername(e.target.value)}
              />
            </Col>
            <Col md={6} lg={2}>
              <FormControl
                type="text"
                placeholder="Filter by IP address..."
                value={filterIpAddress}
                onChange={(e) => setFilterIpAddress(e.target.value)}
              />
            </Col>
            <Col md={6} lg={2}>
              <FormControl
                type="date"
                placeholder="Start date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </Col>
            <Col md={6} lg={2}>
              <FormControl
                type="date"
                placeholder="End date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </Col>
          </Row>
          {hasActiveFilters && (
            <div className="mt-2">
              <Button variant="outline-secondary" size="sm" onClick={handleClearFilters}>
                <IconifyIcon icon="solar:close-circle-linear" width={16} height={16} className="me-1" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Activities Table */}
      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /><p className="mt-2">Loading...</p></div>
      ) : activities.length === 0 ? (
        <div className="text-center py-5">
          <IconifyIcon icon="solar:document-text-bold-duotone" width={64} height={64} className="text-muted mb-3" />
          <p className="text-muted">No activities found.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <Table striped hover>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Description</th>
                  <th>IP Address</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id}>
                    <td>{activity.username || activity.full_name}</td>
                    <td><Badge bg="primary">{activity.action}</Badge></td>
                    <td>{activity.resource_type || 'N/A'}</td>
                    <td>{activity.description || 'N/A'}</td>
                    <td>{activity.ip_address || 'N/A'}</td>
                    <td>{formatDate(activity.created_at)}</td>
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

export default UserActivitiesList;
