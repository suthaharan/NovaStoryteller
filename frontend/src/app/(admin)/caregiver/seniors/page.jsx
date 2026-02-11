import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Col, Row, Card, Button, Spinner, Badge, Table, Modal, Form } from 'react-bootstrap';
import PageMetaData from '@/components/PageTitle';
import httpClient from '@/helpers/httpClient';
import { useNotificationContext } from '@/context/useNotificationContext';

export default function ManageSeniors() {
  const navigate = useNavigate();
  const { showNotification } = useNotificationContext();
  const [seniors, setSeniors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    preferred_font_size: 'medium',
    high_contrast_mode: false,
    voice_navigation_enabled: true
  });

  useEffect(() => {
    loadSeniors();
  }, []);

  const loadSeniors = async () => {
    try {
      setLoading(true);
      // Load dashboard to get seniors list
      const response = await httpClient.get('/eagleview/caregiver-dashboard/');
      setSeniors(response.data.seniors || []);
    } catch (error) {
      console.error('Error loading seniors:', error);
      showNotification('Failed to load seniors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSenior = async (e) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      const response = await httpClient.post('/users/', {
        ...formData,
        is_senior: true
      });
      
      showNotification('Senior created successfully', 'success');
      setShowCreateModal(false);
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        preferred_font_size: 'medium',
        high_contrast_mode: false,
        voice_navigation_enabled: true
      });
      loadSeniors();
    } catch (error) {
      let errorMessage = 'Failed to create senior';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      }
      showNotification(errorMessage, 'error');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageMetaData title="Manage Seniors - EagleView" />
        <div className="text-center py-5">
          <Spinner animation="border" size="lg" />
          <p className="mt-3">Loading seniors...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMetaData title="Manage Seniors - EagleView" />
      
      <Row className="mb-3">
        <Col>
          <Button variant="outline-secondary" onClick={() => navigate('/caregiver/dashboard')}>
            ← Back to Dashboard
          </Button>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            + Create New Senior
          </Button>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <h4 className="mb-0">Manage Seniors</h4>
        </Card.Header>
        <Card.Body>
          {seniors.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No seniors managed yet.</p>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                Create Your First Senior
              </Button>
            </div>
          ) : (
            <Table hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {seniors.map((senior) => (
                  <tr key={senior.id}>
                    <td>{senior.name}</td>
                    <td>{senior.email}</td>
                    <td>{senior.username || 'N/A'}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => navigate(`/caregiver/scan-history?senior_id=${senior.id}`)}
                      >
                        View History
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Create Senior Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Senior</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateSenior}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    minLength={4}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Password *</Form.Label>
              <Form.Control
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
              <Form.Text className="text-muted">Minimum 8 characters</Form.Text>
            </Form.Group>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Preferred Font Size</Form.Label>
                  <Form.Select
                    value={formData.preferred_font_size}
                    onChange={(e) => setFormData({ ...formData, preferred_font_size: e.target.value })}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="extra-large">Extra Large</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Enable High Contrast Mode"
                    checked={formData.high_contrast_mode}
                    onChange={(e) => setFormData({ ...formData, high_contrast_mode: e.target.checked })}
                  />
                  <Form.Check
                    type="checkbox"
                    label="Enable Voice Navigation"
                    checked={formData.voice_navigation_enabled}
                    onChange={(e) => setFormData({ ...formData, voice_navigation_enabled: e.target.checked })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={creating}>
              {creating ? <Spinner size="sm" /> : 'Create Senior'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

