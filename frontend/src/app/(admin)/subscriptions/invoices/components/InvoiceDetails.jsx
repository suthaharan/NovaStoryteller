import { useState, useEffect } from 'react';
import { Card, CardBody, CardTitle, Col, Row, Spinner, Badge, Button } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import logoDark from '@/assets/images/logo-dark-full.png';
import logoLight from '@/assets/images/logo-light-full.png';

const InvoiceDetails = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotificationContext();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uuid) {
      fetchInvoice();
    }
  }, [uuid]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const response = await httpClient.get(`/invoices/${uuid}/`);
      setInvoice(response.data);
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        return;
      }
      showNotification({ message: 'Failed to load invoice.', variant: 'danger' });
      navigate('/subscriptions/invoices');
    } finally {
      setLoading(false);
    }
  };

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
      month: 'long',
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

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <ComponentContainerCard title="Invoice Not Found" description="The invoice you're looking for doesn't exist.">
        <Button variant="primary" onClick={() => navigate('/subscriptions/invoices')}>
          Back to Invoices
        </Button>
      </ComponentContainerCard>
    );
  }

  return (
    <ComponentContainerCard
      title={`Invoice #${invoice.invoice_number}`}
      description="Invoice details and payment information"
    >
      <Card>
        <CardBody>
          <div className="clearfix mb-4">
            <div className="float-sm-end text-end">
              <div className="auth-logo mb-3">
                <img className="logo-dark me-1" height={24} src={logoDark} alt="logo-dark" />
                <img className="logo-light me-1" height={24} src={logoLight} alt="logo-light" />
              </div>
            </div>
            <div className="float-sm-start">
              <CardTitle as={'h5'} className="mb-2">
                Invoice: #{invoice.invoice_number}
              </CardTitle>
              <div className="mb-2">
                Status: {getStatusBadge(invoice.status)}
              </div>
            </div>
          </div>

          <Row className="mt-3">
            <Col md={6}>
              <h6 className="fw-normal text-muted">Bill To</h6>
              <h6 className="fs-16">{invoice.user?.username || 'N/A'}</h6>
              {invoice.user?.email && (
                <p className="text-muted mb-0">{invoice.user.email}</p>
              )}
            </Col>
            <Col md={6} className="text-end">
              <h6 className="fw-normal text-muted">Plan</h6>
              <h6 className="fs-16">{invoice.plan?.name || 'N/A'}</h6>
              {invoice.subscription && (
                <p className="text-muted mb-0">
                  Subscription: {invoice.subscription.status}
                </p>
              )}
            </Col>
          </Row>

          <Row className="mt-4">
            <Col xs={12}>
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead className="bg-light bg-opacity-50">
                    <tr>
                      <th className="border-0 py-2">Description</th>
                      <th className="text-end border-0 py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>{invoice.plan?.name || 'Subscription Plan'}</strong>
                        {invoice.plan?.description && (
                          <div className="text-muted small">{invoice.plan.description}</div>
                        )}
                      </td>
                      <td className="text-end">{formatCurrency(invoice.subtotal)}</td>
                    </tr>
                    {invoice.discount > 0 && (
                      <tr>
                        <td>Discount</td>
                        <td className="text-end text-danger">-{formatCurrency(invoice.discount)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Col>
          </Row>

          <Row className="mt-3">
            <Col sm={7}>
              {invoice.notes && (
                <div className="clearfix pt-xl-3 pt-0">
                  <h6 className="text-muted">Notes:</h6>
                  <small className="text-muted">{invoice.notes}</small>
                </div>
              )}
            </Col>
            <Col sm={5}>
              <div className="float-end">
                <p>
                  <span className="fw-medium">Subtotal:</span>
                  <span className="float-end">{formatCurrency(invoice.subtotal)}</span>
                </p>
                {invoice.discount > 0 && (
                  <p>
                    <span className="fw-medium">Discount:</span>
                    <span className="float-end text-danger">
                      &nbsp;&nbsp;&nbsp;&nbsp;
                      -{formatCurrency(invoice.discount)}
                    </span>
                  </p>
                )}
                <h3 className="mt-2">{formatCurrency(invoice.total)}</h3>
              </div>
              <div className="clearfix" />
            </Col>
          </Row>

          <Row className="mt-4">
            <Col md={6}>
              <div className="mb-3">
                <strong>Due Date:</strong> {formatDate(invoice.due_date)}
              </div>
              {invoice.paid_date && (
                <div className="mb-3">
                  <strong>Paid Date:</strong> {formatDate(invoice.paid_date)}
                </div>
              )}
              {invoice.payment_method && (
                <div className="mb-3">
                  <strong>Payment Method:</strong> {invoice.payment_method}
                </div>
              )}
            </Col>
          </Row>

          <div className="mt-5 mb-1">
            <Button variant="secondary" onClick={() => navigate('/subscriptions/invoices')}>
              <IconifyIcon icon="solar:arrow-left-bold-duotone" width={16} height={16} className="me-1" />
              Back to Invoices
            </Button>
            {invoice.status === 'pending' && (
              <Button variant="primary" className="ms-2">
                <IconifyIcon icon="solar:wallet-money-broken" width={16} height={16} className="me-1" />
                Pay Now
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    </ComponentContainerCard>
  );
};

export default InvoiceDetails;

