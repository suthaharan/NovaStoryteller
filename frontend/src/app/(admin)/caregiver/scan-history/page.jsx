import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Col, Row, Card, Button, Spinner, Badge, Table, Form, Tabs, Tab } from 'react-bootstrap';
import PageMetaData from '@/components/PageTitle';
import httpClient from '@/helpers/httpClient';
import { useNotificationContext } from '@/context/useNotificationContext';

export default function SeniorScanHistory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showNotification } = useNotificationContext();
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seniorId, setSeniorId] = useState(searchParams.get('senior_id') || '');
  const [seniors, setSeniors] = useState([]);
  const [selectedSenior, setSelectedSenior] = useState(null);
  const [activeTab, setActiveTab] = useState('by_date');

  useEffect(() => {
    loadSeniors();
    if (seniorId) {
      loadHistory(seniorId);
    }
  }, []);

  const loadSeniors = async () => {
    try {
      const response = await httpClient.get('/eagleview/caregiver-dashboard/');
      setSeniors(response.data.seniors || []);
      if (seniorId) {
        const senior = response.data.seniors.find(s => s.id.toString() === seniorId.toString());
        setSelectedSenior(senior);
      }
    } catch (error) {
      console.error('Error loading seniors:', error);
    }
  };

  const loadHistory = async (id) => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await httpClient.get(`/eagleview/senior-scan-history/?senior_id=${id}`);
      setHistoryData(response.data);
    } catch (error) {
      console.error('Error loading scan history:', error);
      showNotification('Failed to load scan history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSeniorChange = (e) => {
    const id = e.target.value;
    setSeniorId(id);
    if (id) {
      const senior = seniors.find(s => s.id.toString() === id.toString());
      setSelectedSenior(senior);
      loadHistory(id);
      // Update URL
      navigate(`/caregiver/scan-history?senior_id=${id}`, { replace: true });
    } else {
      setHistoryData(null);
      setSelectedSenior(null);
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

  const getTypeBadge = (type) => {
    const variants = {
      pillbox: 'primary',
      fine_print: 'info',
      document: 'warning'
    };
    const labels = {
      pillbox: 'Pillbox',
      fine_print: 'Fine Print',
      document: 'Document'
    };
    return <Badge bg={variants[type] || 'secondary'}>{labels[type] || type}</Badge>;
  };

  return (
    <>
      <PageMetaData title="Senior Scan History - EagleView" />
      
      <Row className="mb-3">
        <Col>
          <Button variant="outline-secondary" onClick={() => navigate('/caregiver/dashboard')}>
            ← Back to Dashboard
          </Button>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <Row className="align-items-center">
            <Col md={6}>
              <h4 className="mb-0">Scan History</h4>
            </Col>
            <Col md={6}>
              <Form.Select
                value={seniorId}
                onChange={handleSeniorChange}
              >
                <option value="">Select a senior...</option>
                {seniors.map((senior) => (
                  <option key={senior.id} value={senior.id}>
                    {senior.name} ({senior.email})
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {!seniorId ? (
            <div className="text-center py-5">
              <p className="text-muted">Please select a senior to view their scan history.</p>
            </div>
          ) : loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-3">Loading scan history...</p>
            </div>
          ) : !historyData ? (
            <div className="text-center py-5">
              <p className="text-muted">No history data available.</p>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <strong>Total Scans:</strong> {historyData.total_scans || 0}
              </div>

              <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                <Tab eventKey="by_date" title="By Date">
                  {historyData.by_date && historyData.by_date.length > 0 ? (
                    <div>
                      {historyData.by_date.map((dateGroup, idx) => (
                        <Card key={idx} className="mb-3">
                          <Card.Header>
                            <strong>{dateGroup.date}</strong> - {dateGroup.count} scan(s)
                          </Card.Header>
                          <Card.Body>
                            <Table hover size="sm">
                              <thead>
                                <tr>
                                  <th>Time</th>
                                  <th>Type</th>
                                  <th>Status</th>
                                  <th>Summary</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dateGroup.analyses.map((analysis) => (
                                  <tr key={analysis.uuid}>
                                    <td>{new Date(analysis.created_at).toLocaleTimeString()}</td>
                                    <td>{getTypeBadge(analysis.analysis_type)}</td>
                                    <td>
                                      <Badge bg={
                                        analysis.status === 'completed' ? 'success' :
                                        analysis.status === 'processing' ? 'warning' : 'secondary'
                                      }>
                                        {analysis.status}
                                      </Badge>
                                    </td>
                                    <td>
                                      <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {analysis.summary || analysis.analysis_text?.substring(0, 50) || 'No summary'}
                                      </div>
                                    </td>
                                    <td>
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => navigate(`/eagleview/results/${analysis.uuid}`)}
                                      >
                                        View
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted text-center py-4">No scans found for this date range.</p>
                  )}
                </Tab>

                <Tab eventKey="by_category" title="By Category">
                  {historyData.by_category && Object.keys(historyData.by_category).length > 0 ? (
                    <div>
                      {Object.entries(historyData.by_category).map(([category, categoryData]) => (
                        <Card key={category} className="mb-3">
                          <Card.Header>
                            <strong>{getTypeBadge(category)}</strong> - {categoryData.count} scan(s)
                          </Card.Header>
                          <Card.Body>
                            <Table hover size="sm">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Status</th>
                                  <th>Summary</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {categoryData.analyses.map((analysis) => (
                                  <tr key={analysis.uuid}>
                                    <td>{formatDate(analysis.created_at)}</td>
                                    <td>
                                      <Badge bg={
                                        analysis.status === 'completed' ? 'success' :
                                        analysis.status === 'processing' ? 'warning' : 'secondary'
                                      }>
                                        {analysis.status}
                                      </Badge>
                                    </td>
                                    <td>
                                      <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {analysis.summary || analysis.analysis_text?.substring(0, 50) || 'No summary'}
                                      </div>
                                    </td>
                                    <td>
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => navigate(`/eagleview/results/${analysis.uuid}`)}
                                      >
                                        View
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted text-center py-4">No scans found by category.</p>
                  )}
                </Tab>
              </Tabs>
            </>
          )}
        </Card.Body>
      </Card>
    </>
  );
}

