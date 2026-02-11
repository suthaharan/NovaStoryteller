import { useState, useEffect, useCallback } from 'react';
import { Table, Badge, InputGroup, FormControl, Spinner, Pagination, Button, Row, Col, Card, CardBody, Dropdown } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';
import { useNavigate } from 'react-router-dom';

const InvoicesList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { showNotification } = useNotificationContext();
  const navigate = useNavigate();

  // Fetch invoices
  const fetchInvoices = useCallback(async (page = 1, search = '', status = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      
      if (search) params.append('search', search);
      if (status) params.append('status', status);

      const response = await httpClient.get(`/invoices/?${params.toString()}`);
      
      if (response.data) {
        setInvoices(response.data.results || response.data);
        const count = response.data.count || response.data.length;
        setTotalCount(count);
        setTotalPages(Math.ceil(count / pageSize));
      }
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED' || error.message?.includes('cancelled')) {
        return;
      }
      showNotification({ message: 'Failed to load invoices.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [pageSize, showNotification]);

  useEffect(() => {
    fetchInvoices(currentPage, searchQuery, statusFilter);
  }, [currentPage, searchQuery, statusFilter, fetchInvoices]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      paid: 'success',
      overdue: 'danger',
      cancelled: 'secondary'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
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
          Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} invoices
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
    <ComponentContainerCard title="Invoices" description="View and manage your invoices.">
      <Card className="mb-4">
        <CardBody>
          <Row className="g-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text><IconifyIcon icon="solar:magnifer-linear" width={20} height={20} /></InputGroup.Text>
                <FormControl placeholder="Search invoices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </InputGroup>
            </Col>
            <Col md={3}>
              <FormControl as="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </FormControl>
            </Col>
            <Col md={3}>
              {(searchQuery || statusFilter) && (
                <Button variant="outline-secondary" onClick={() => { setSearchQuery(''); setStatusFilter(''); }}>
                  Clear
                </Button>
              )}
            </Col>
          </Row>
        </CardBody>
      </Card>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /><p className="mt-2">Loading...</p></div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-5">
          <IconifyIcon icon="solar:document-text-bold-duotone" width={64} height={64} className="text-muted mb-3" />
          <p className="text-muted">No invoices found.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <Table striped hover>
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Plan</th>
                  <th>User</th>
                  <th>Subtotal</th>
                  <th>Discount</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <strong>#{invoice.invoice_number}</strong>
                    </td>
                    <td>{invoice.plan?.name || 'N/A'}</td>
                    <td>{invoice.user?.username || 'N/A'}</td>
                    <td>{formatCurrency(invoice.subtotal)}</td>
                    <td>{formatCurrency(invoice.discount)}</td>
                    <td><strong>{formatCurrency(invoice.total)}</strong></td>
                    <td>{getStatusBadge(invoice.status)}</td>
                    <td>{formatDate(invoice.due_date)}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/subscriptions/invoices/${invoice.uuid}`)}
                      >
                        <IconifyIcon icon="solar:eye-bold-duotone" width={16} height={16} className="me-1" />
                        View
                      </Button>
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

export default InvoicesList;

