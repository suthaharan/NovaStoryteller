import { useState, useEffect, useCallback } from 'react';
import { Table, Badge, InputGroup, FormControl, Spinner } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';

const PermissionsList = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { showNotification } = useNotificationContext();

  const fetchPermissions = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const response = await httpClient.get(`/permissions/?${params.toString()}`);
      setPermissions(response.data.results || response.data);
    } catch (error) {
      showNotification({ message: 'Failed to load permissions.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchPermissions(searchQuery);
  }, [fetchPermissions]);

  useEffect(() => {
    const timer = setTimeout(() => fetchPermissions(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchPermissions]);

  return (
    <ComponentContainerCard title="Permissions Management" description="Manage system permissions for endpoint access control.">
      <InputGroup className="mb-3">
        <InputGroup.Text><IconifyIcon icon="solar:magnifer-linear" width={20} /></InputGroup.Text>
        <FormControl placeholder="Search permissions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </InputGroup>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /><p className="mt-2">Loading...</p></div>
      ) : permissions.length === 0 ? (
        <div className="text-center py-5"><p className="text-muted">No permissions found.</p></div>
      ) : (
        <Table striped hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Endpoint</th>
              <th>Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((perm) => (
              <tr key={perm.id}>
                <td><strong>{perm.name}</strong></td>
                <td><code>{perm.codename}</code></td>
                <td>{perm.endpoint || 'N/A'}</td>
                <td><Badge bg="secondary">{perm.method || 'N/A'}</Badge></td>
                <td><Badge bg={perm.is_active ? 'success' : 'danger'}>{perm.is_active ? 'Active' : 'Inactive'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </ComponentContainerCard>
  );
};

export default PermissionsList;


