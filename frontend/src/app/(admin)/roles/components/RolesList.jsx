import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Badge, InputGroup, FormControl, Spinner, Pagination } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';

const RolesList = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { showNotification } = useNotificationContext();

  const fetchRoles = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (search) params.append('search', search);
      const response = await httpClient.get(`/roles/?${params.toString()}`);
      setRoles(response.data.results || response.data);
      setTotalCount(response.data.count || response.data.length);
    } catch (error) {
      showNotification({ message: 'Failed to load roles.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchRoles(currentPage, searchQuery);
  }, [currentPage, fetchRoles]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) fetchRoles(1, searchQuery);
      else setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchRoles]);

  return (
    <ComponentContainerCard title="Roles Management" description="Manage system roles and their permissions.">
      <InputGroup className="mb-3">
        <InputGroup.Text><IconifyIcon icon="solar:magnifer-linear" width={20} /></InputGroup.Text>
        <FormControl placeholder="Search roles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </InputGroup>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /><p className="mt-2">Loading...</p></div>
      ) : roles.length === 0 ? (
        <div className="text-center py-5"><p className="text-muted">No roles found.</p></div>
      ) : (
        <Table striped hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Permissions</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id}>
                <td><strong>{role.name}</strong></td>
                <td>{role.description || 'N/A'}</td>
                <td><Badge bg="info">{role.permission_count || 0} permissions</Badge></td>
                <td><Badge bg={role.is_active ? 'success' : 'danger'}>{role.is_active ? 'Active' : 'Inactive'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </ComponentContainerCard>
  );
};

export default RolesList;


