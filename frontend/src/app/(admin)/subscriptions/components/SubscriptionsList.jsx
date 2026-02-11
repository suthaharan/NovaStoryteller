import { useState, useEffect, useCallback } from 'react';
import { Table, Badge, InputGroup, FormControl, Spinner, Pagination } from 'react-bootstrap';
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
  return `${month} ${day}, ${year}`;
};

const SubscriptionsList = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { showNotification } = useNotificationContext();

  const fetchSubscriptions = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (search) params.append('search', search);
      const response = await httpClient.get(`/subscriptions/?${params.toString()}`);
      setSubscriptions(response.data.results || response.data);
    } catch (error) {
      showNotification({ message: 'Failed to load subscriptions.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchSubscriptions(currentPage, searchQuery);
  }, [currentPage, fetchSubscriptions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) fetchSubscriptions(1, searchQuery);
      else setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchSubscriptions]);

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
      cancelled: 'warning',
      expired: 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <ComponentContainerCard title="Subscriptions Management" description="Manage user subscriptions and plans.">
      <InputGroup className="mb-3">
        <InputGroup.Text><IconifyIcon icon="solar:magnifer-linear" width={20} /></InputGroup.Text>
        <FormControl placeholder="Search subscriptions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </InputGroup>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /><p className="mt-2">Loading...</p></div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-5"><p className="text-muted">No subscriptions found.</p></div>
      ) : (
        <Table striped hover>
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub.id}>
                <td>{sub.username || sub.full_name}</td>
                <td><Badge bg="info">{sub.plan}</Badge></td>
                <td>{getStatusBadge(sub.status)}</td>
                <td>{formatDate(sub.start_date)}</td>
                <td>{formatDate(sub.end_date)}</td>
                <td>${sub.price || '0.00'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </ComponentContainerCard>
  );
};

export default SubscriptionsList;

