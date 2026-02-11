import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Col, Row, Card, Button, Spinner, Badge, Table } from 'react-bootstrap';
import PageMetaData from '@/components/PageTitle';
import httpClient from '@/helpers/httpClient';
import { useNotificationContext } from '@/context/useNotificationContext';

export default function CaregiverDashboard() {
  const navigate = useNavigate();
  const { showNotification } = useNotificationContext();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get('/eagleview/caregiver-dashboard/');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading caregiver dashboard:', error);
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <>
        <PageMetaData title="Caregiver Dashboard - EagleView" />
        <div className="text-center py-5">
          <Spinner animation="border" size="lg" />
          <p className="mt-3">Loading dashboard...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMetaData title="Caregiver Dashboard - EagleView" />
      
      <Row className="mb-4">
        <Col>
          <h2>Caregiver Dashboard</h2>
          <p className="text-muted">Manage your seniors and view their scan history</p>
        </Col>
      </Row>

      {/* Statistics Cards */}
      {dashboardData?.statistics && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="mb-0">{dashboardData.statistics.total_analyses || 0}</h3>
                <p className="text-muted mb-0">Total Scans</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="mb-0">{dashboardData.seniors?.length || 0}</h3>
                <p className="text-muted mb-0">Managed Seniors</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="mb-0">{dashboardData.statistics.unread_alerts || 0}</h3>
                <p className="text-muted mb-0">Unread Alerts</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="mb-0 text-danger">{dashboardData.statistics.urgent_alerts || 0}</h3>
                <p className="text-muted mb-0">Urgent Alerts</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row>
        {/* Managed Seniors */}
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Managed Seniors</h5>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/caregiver/seniors')}
              >
                Manage Seniors
              </Button>
            </Card.Header>
            <Card.Body>
              {dashboardData?.seniors && dashboardData.seniors.length > 0 ? (
                <Table hover>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.seniors.map((senior) => (
                      <tr key={senior.id}>
                        <td>{senior.name}</td>
                        <td>{senior.email}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate(`/caregiver/scan-history?senior_id=${senior.id}`)}
                          >
                            View History
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">No seniors managed yet.</p>
                  <Button
                    variant="primary"
                    onClick={() => navigate('/caregiver/seniors')}
                  >
                    Add Your First Senior
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Scans */}
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Recent Scans</h5>
            </Card.Header>
            <Card.Body>
              {dashboardData?.recent_analyses && dashboardData.recent_analyses.length > 0 ? (
                <div className="table-responsive">
                  <Table hover size="sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Senior</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.recent_analyses.map((analysis) => (
                        <tr key={analysis.uuid}>
                          <td>{formatDate(analysis.created_at)}</td>
                          <td>
                            <Badge bg={
                              analysis.analysis_type === 'pillbox' ? 'primary' :
                              analysis.analysis_type === 'fine_print' ? 'info' : 'warning'
                            }>
                              {analysis.analysis_type}
                            </Badge>
                          </td>
                          <td>{analysis.user_name || 'Unknown'}</td>
                          <td>
                            <Badge bg={
                              analysis.status === 'completed' ? 'success' :
                              analysis.status === 'processing' ? 'warning' : 'secondary'
                            }>
                              {analysis.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted text-center py-4">No recent scans</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Unread Alerts */}
      {dashboardData?.unread_alerts && dashboardData.unread_alerts.length > 0 && (
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Unread Alerts</h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Message</th>
                        <th>Senior</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.unread_alerts.map((alert) => (
                        <tr key={alert.uuid}>
                          <td>{formatDate(alert.created_at)}</td>
                          <td>
                            <Badge bg={
                              alert.alert_type === 'fraud_detection' ? 'danger' :
                              alert.alert_type === 'pillbox_warning' ? 'warning' : 'info'
                            }>
                              {alert.alert_type}
                            </Badge>
                          </td>
                          <td>{alert.message}</td>
                          <td>{alert.senior_name || 'Unknown'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
}

