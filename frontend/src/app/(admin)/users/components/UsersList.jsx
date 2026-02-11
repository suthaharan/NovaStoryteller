import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardBody, CardTitle, Table, Badge, Button, InputGroup, FormControl, Spinner, Pagination } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [togglingUserId, setTogglingUserId] = useState(null);
  const { showNotification } = useNotificationContext();
  const searchQueryRef = useRef(searchQuery);
  const showNotificationRef = useRef(showNotification);
  const isFetchingRef = useRef(false);

  // Keep refs in sync
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    showNotificationRef.current = showNotification;
  }, [showNotification]);

  // Fetch users from API
  const fetchUsers = useCallback(async (page = 1, search = '') => {
    // Prevent duplicate concurrent requests
    if (isFetchingRef.current) {
      return;
    }
    
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      
      if (search) {
        params.append('search', search);
      }

      const response = await httpClient.get(`/users/?${params.toString()}`);
      
      if (response && response.data) {
        // Handle paginated response
        if (response.data.results) {
          setUsers(response.data.results);
          setTotalCount(response.data.count || 0);
          setTotalPages(response.data.total_pages || Math.ceil((response.data.count || 0) / pageSize));
        } 
        // Handle non-paginated response (array)
        else if (Array.isArray(response.data)) {
          setUsers(response.data);
          setTotalCount(response.data.length);
          setTotalPages(Math.ceil(response.data.length / pageSize));
        }
        // Handle single object (shouldn't happen for list, but handle it)
        else {
          console.warn('Unexpected response format:', response.data);
          setUsers([]);
          setTotalCount(0);
          setTotalPages(0);
        }
      } else {
        console.warn('No data in response:', response);
        setUsers([]);
        setTotalCount(0);
        setTotalPages(0);
      }
    } catch (error) {
      // Ignore cancelled duplicate requests - they're not real errors
      if (error.message?.includes('Duplicate request cancelled') || 
          error.name === 'AbortError' || 
          error.code === 'ERR_CANCELED') {
        // This is a cancelled duplicate request, just return silently
        return;
      }
      
      console.error('Error fetching users:', error);
      
      let errorMessage = 'Failed to load users. Please try again.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      showNotificationRef.current({
        message: errorMessage,
        variant: 'danger'
      });
      
      // Set empty state on error
      setUsers([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [pageSize]);

  // Handle page changes (immediate)
  useEffect(() => {
    // Only fetch if not already fetching
    if (!isFetchingRef.current) {
      fetchUsers(currentPage, searchQueryRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Handle search changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      // If we're on page 1, fetch immediately
      if (currentPage === 1) {
        if (!isFetchingRef.current) {
          fetchUsers(1, searchQueryRef.current);
        }
      } else {
        // If not on page 1, reset to page 1 (which will trigger the page effect above)
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Toggle user active/inactive status
  const toggleUserStatus = async (userId, currentStatus) => {
    // Check if user is superuser
    const user = users.find(u => u.id === userId);
    if (user?.is_superuser) {
      showNotification({
        message: 'Superusers cannot be deactivated.',
        variant: 'warning'
      });
      return;
    }

    setTogglingUserId(userId);
    try {
      const response = await httpClient.patch(`/users/${userId}/`, {
        is_active: !currentStatus
      });

      if (response.data) {
        // Update user in local state
        setUsers(users.map(u => 
          u.id === userId 
            ? { ...u, is_active: response.data.is_active }
            : u
        ));
        
        showNotification({
          message: `User ${response.data.is_active ? 'activated' : 'deactivated'} successfully.`,
          variant: 'success'
        });
      }
    } catch (error) {
      let errorMessage = 'Failed to update user status.';
      
      if (error.response?.data) {
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      }
      
      showNotification({
        message: errorMessage,
        variant: 'danger'
      });
    } finally {
      setTogglingUserId(null);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Pagination handlers
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
          Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} users
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

  return (
    <ComponentContainerCard
      id="users-list"
      title="Users Management"
      description="Manage all users in the system. Search, view, and toggle user active status."
    >
      {/* Search Bar */}
      <div className="mb-4">
        <InputGroup>
          <InputGroup.Text>
            <IconifyIcon icon="solar:magnifer-linear" width={20} height={20} />
          </InputGroup.Text>
          <FormControl
            placeholder="Search by username, email, first name, or last name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="outline-secondary"
              onClick={() => setSearchQuery('')}
            >
              <IconifyIcon icon="solar:close-circle-linear" width={20} height={20} />
            </Button>
          )}
        </InputGroup>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-5">
          <IconifyIcon icon="solar:users-group-two-rounded-bold-duotone" width={64} height={64} className="text-muted mb-3" />
          <p className="text-muted">No users found.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <Table striped hover className="table-centered">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span>{user.username}</span>
                        {user.is_superuser && (
                          <Badge bg="danger" title="Superuser">
                            <IconifyIcon icon="solar:crown-bold-duotone" width={16} height={16} />
                          </Badge>
                        )}
                        {user.is_staff && !user.is_superuser && (
                          <Badge bg="info" title="Staff Member">
                            <IconifyIcon icon="solar:user-id-bold-duotone" width={16} height={16} />
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td>{user.full_name || user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <Badge bg={user.is_active ? 'success' : 'secondary'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      {user.is_superuser ? (
                        <Badge bg="danger">Superuser</Badge>
                      ) : user.is_staff ? (
                        <Badge bg="info">Staff</Badge>
                      ) : (
                        <Badge bg="secondary">User</Badge>
                      )}
                    </td>
                    <td>{formatDate(user.date_joined)}</td>
                    <td>
                      <Button
                        variant={user.is_active ? 'outline-danger' : 'outline-success'}
                        size="sm"
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        disabled={user.is_superuser || togglingUserId === user.id}
                        title={user.is_superuser ? 'Superusers cannot be deactivated' : ''}
                      >
                        {togglingUserId === user.id ? (
                          <Spinner animation="border" size="sm" />
                        ) : user.is_active ? (
                          <>
                            <IconifyIcon icon="solar:user-block-bold-duotone" width={16} height={16} className="me-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <IconifyIcon icon="solar:user-check-bold-duotone" width={16} height={16} className="me-1" />
                            Activate
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          {renderPagination()}
        </>
      )}
    </ComponentContainerCard>
  );
};

export default UsersList;

