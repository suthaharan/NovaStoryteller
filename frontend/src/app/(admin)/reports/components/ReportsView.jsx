import { useState, useEffect } from 'react';
import { Card, CardBody, Row, Col, Spinner, Button, ButtonGroup, Badge, Alert } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';
import ReactApexChart from 'react-apexcharts';

// Stat Card Component (similar to Statistics widget)
const StatCard = ({ stat }) => {
  const { amount, icon, iconColor, title } = stat;
  return (
    <Card>
      <CardBody>
        <Row>
          <Col xs={6}>
            <div className={`avatar-md bg-${iconColor} rounded flex-centered`}>
              <IconifyIcon icon={icon} className="fs-24 text-white" />
            </div>
          </Col>
          <Col xs={6} className="text-end">
            <p className="text-muted mb-0 text-truncate">{title}</p>
            <h3 className="text-dark mt-1 mb-0">{amount}</h3>
          </Col>
        </Row>
      </CardBody>
    </Card>
  );
};

// Enhanced Stat Card Component (similar to Stats widget)
const EnhancedStatCard = ({ stat }) => {
  const { amount, change, changeColor, badgeIcon, icon, iconColor, title } = stat;
  return (
    <Card>
      <CardBody className="overflow-hidden position-relative">
        <IconifyIcon icon={icon} className={`fs-36 text-${iconColor}`} />
        <h3 className="mb-0 fw-bold mt-3 mb-1">{amount}</h3>
        <p className="text-muted">{title}</p>
        {change && (
          <>
            <span className={`badge fs-12 badge-soft-${changeColor}`}>{change}</span>
            <IconifyIcon icon={badgeIcon} className="widget-icon" />
          </>
        )}
      </CardBody>
    </Card>
  );
};

const ReportsView = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('summary');
  const { showNotification } = useNotificationContext();

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const response = await httpClient.get(`/reports/?type=${reportType}`);
        setReportData(response.data);
      } catch (error) {
        showNotification({ message: 'Failed to load report.', variant: 'danger' });
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [reportType, showNotification]);

  // Prepare summary statistics
  const getSummaryStats = () => {
    if (!reportData?.summary) return [];
    
    const { summary } = reportData;
    return [
      {
        icon: 'solar:users-group-two-rounded-bold-duotone',
        iconColor: 'primary',
        title: 'Total Users',
        amount: summary.total_users?.toLocaleString() || '0'
      },
      {
        icon: 'solar:user-check-rounded-bold-duotone',
        iconColor: 'success',
        title: 'Active Users',
        amount: summary.active_users?.toLocaleString() || '0'
      },
      {
        icon: 'solar:user-block-rounded-bold-duotone',
        iconColor: 'danger',
        title: 'Inactive Users',
        amount: summary.inactive_users?.toLocaleString() || '0'
      },
      {
        icon: 'solar:tag-broken',
        iconColor: 'info',
        title: 'Total Roles',
        amount: summary.total_roles?.toLocaleString() || '0'
      },
      {
        icon: 'solar:lock-password-unlocked-broken',
        iconColor: 'warning',
        title: 'Total Permissions',
        amount: summary.total_permissions?.toLocaleString() || '0'
      },
      {
        icon: 'solar:wallet-broken',
        iconColor: 'primary',
        title: 'Total Subscriptions',
        amount: summary.total_subscriptions?.toLocaleString() || '0'
      },
      {
        icon: 'solar:wallet-money-bold-duotone',
        iconColor: 'success',
        title: 'Active Subscriptions',
        amount: summary.active_subscriptions?.toLocaleString() || '0'
      },
      {
        icon: 'solar:document-text-bold-duotone',
        iconColor: 'secondary',
        title: 'Total Activities',
        amount: summary.total_activities?.toLocaleString() || '0'
      }
    ];
  };

  // Prepare enhanced stats for summary
  const getEnhancedStats = () => {
    if (!reportData?.summary) return [];
    
    const { summary } = reportData;
    const activePercentage = summary.total_users > 0 
      ? ((summary.active_users / summary.total_users) * 100).toFixed(1)
      : 0;
    const subscriptionActivePercentage = summary.total_subscriptions > 0
      ? ((summary.active_subscriptions / summary.total_subscriptions) * 100).toFixed(1)
      : 0;

    return [
      {
        icon: 'solar:users-group-two-rounded-bold-duotone',
        iconColor: 'primary',
        title: 'User Activity Rate',
        amount: `${activePercentage}%`,
        change: `${activePercentage}% active`,
        changeColor: 'success',
        badgeIcon: 'bx:user-check'
      },
      {
        icon: 'solar:wallet-money-bold-duotone',
        iconColor: 'success',
        title: 'Subscription Rate',
        amount: `${subscriptionActivePercentage}%`,
        change: `${subscriptionActivePercentage}% active`,
        changeColor: 'success',
        badgeIcon: 'bx:wallet'
      },
      {
        icon: 'solar:document-text-bold-duotone',
        iconColor: 'info',
        title: 'System Activities',
        amount: summary.total_activities?.toLocaleString() || '0',
        change: 'Total logged',
        changeColor: 'info',
        badgeIcon: 'bx:file-blank'
      }
    ];
  };

  // Prepare activity chart data
  const getActivityChartData = () => {
    if (!reportData?.by_action) return null;
    
    const categories = reportData.by_action.map(item => item.action);
    const data = reportData.by_action.map(item => item.count);
    
    return {
      series: [{
        name: 'Activities',
        data: data
      }],
      options: {
        chart: {
          type: 'bar',
          height: 350,
          toolbar: { show: false }
        },
        plotOptions: {
          bar: {
            borderRadius: 4,
            horizontal: false,
          }
        },
        dataLabels: {
          enabled: false
        },
        xaxis: {
          categories: categories
        },
        colors: ['#7f56da'],
        grid: {
          strokeDashArray: 3
        }
      }
    };
  };

  // Prepare subscription chart data
  const getSubscriptionChartData = () => {
    if (!reportData?.by_plan) return null;
    
    const categories = reportData.by_plan.map(item => item.plan);
    const data = reportData.by_plan.map(item => item.count);
    const revenue = reportData.by_plan.map(item => item.total_revenue || 0);
    
    return {
      series: [
        {
          name: 'Count',
          type: 'column',
          data: data
        },
        {
          name: 'Revenue',
          type: 'line',
          data: revenue
        }
      ],
      options: {
        chart: {
          height: 350,
          type: 'line',
          toolbar: { show: false }
        },
        stroke: {
          width: [0, 4]
        },
        dataLabels: {
          enabled: true,
          enabledOnSeries: [1]
        },
        labels: categories,
        xaxis: {
          categories: categories
        },
        yaxis: [
          {
            title: {
              text: 'Count'
            }
          },
          {
            opposite: true,
            title: {
              text: 'Revenue ($)'
            }
          }
        ],
        colors: ['#7f56da', '#22c55e']
      }
    };
  };

  return (
    <ComponentContainerCard title="Reports" description="View system reports and analytics.">
      <ButtonGroup className="mb-4">
        <Button variant={reportType === 'summary' ? 'primary' : 'outline-primary'} onClick={() => setReportType('summary')}>
          Summary
        </Button>
        <Button variant={reportType === 'user_activity' ? 'primary' : 'outline-primary'} onClick={() => setReportType('user_activity')}>
          User Activity
        </Button>
        <Button variant={reportType === 'subscriptions' ? 'primary' : 'outline-primary'} onClick={() => setReportType('subscriptions')}>
          Subscriptions
        </Button>
      </ButtonGroup>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /><p className="mt-2">Loading report...</p></div>
      ) : reportData ? (
        <>
          {reportType === 'summary' && reportData.summary && (
            <>
              {/* Summary Statistics Cards */}
              <Row className="mb-4">
                {getSummaryStats().map((stat, idx) => (
                  <Col md={6} xl={3} key={idx} className="mb-3">
                    <StatCard stat={stat} />
                  </Col>
                ))}
              </Row>

              {/* Enhanced Statistics Cards */}
              <Row className="mb-4">
                {getEnhancedStats().map((stat, idx) => (
                  <Col lg={4} md={6} key={idx} className="mb-3">
                    <EnhancedStatCard stat={stat} />
                  </Col>
                ))}
              </Row>

              {/* Summary Details */}
              <Row>
                <Col md={4} className="mb-3">
                  <Card>
                    <CardBody>
                      <div className="d-flex align-items-center mb-3">
                        <div className="avatar-md bg-primary rounded flex-centered me-3">
                          <IconifyIcon icon="solar:users-group-two-rounded-bold-duotone" className="fs-24 text-white" />
                        </div>
                        <div>
                          <h5 className="mb-0">Users Overview</h5>
                          <p className="text-muted mb-0">System user statistics</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Total Users:</span>
                          <strong>{reportData.summary.total_users}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Active:</span>
                          <Badge bg="success">{reportData.summary.active_users}</Badge>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Inactive:</span>
                          <Badge bg="danger">{reportData.summary.inactive_users}</Badge>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
                <Col md={4} className="mb-3">
                  <Card>
                    <CardBody>
                      <div className="d-flex align-items-center mb-3">
                        <div className="avatar-md bg-info rounded flex-centered me-3">
                          <IconifyIcon icon="solar:tag-broken" className="fs-24 text-white" />
                        </div>
                        <div>
                          <h5 className="mb-0">Roles & Permissions</h5>
                          <p className="text-muted mb-0">Access control statistics</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Total Roles:</span>
                          <strong>{reportData.summary.total_roles}</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Total Permissions:</span>
                          <strong>{reportData.summary.total_permissions}</strong>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
                <Col md={4} className="mb-3">
                  <Card>
                    <CardBody>
                      <div className="d-flex align-items-center mb-3">
                        <div className="avatar-md bg-success rounded flex-centered me-3">
                          <IconifyIcon icon="solar:wallet-broken" className="fs-24 text-white" />
                        </div>
                        <div>
                          <h5 className="mb-0">Subscriptions</h5>
                          <p className="text-muted mb-0">Subscription statistics</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Total:</span>
                          <strong>{reportData.summary.total_subscriptions}</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Active:</span>
                          <Badge bg="success">{reportData.summary.active_subscriptions}</Badge>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </>
          )}

          {reportType === 'user_activity' && reportData.by_action && (
            <Row>
              <Col md={12} className="mb-4">
                <Card>
                  <CardBody>
                    <h5 className="mb-3">Activity Report</h5>
                    <Alert variant="info" className="mb-3">
                      <strong>Period:</strong> Last {reportData.period_days} days<br />
                      <strong>Total Activities:</strong> {reportData.total_activities}
                    </Alert>
                
                    {getActivityChartData() && (
                      <div dir="ltr">
                        <ReactApexChart
                          options={getActivityChartData().options}
                          series={getActivityChartData().series}
                          type="bar"
                          height={350}
                          className="apex-charts"
                        />
                      </div>
                    )}

                    <Row className="mt-4">
                      <Col md={6}>
                        <h6>Activities by Action</h6>
                        <div className="table-responsive">
                          <table className="table table-sm">
                            <thead>
                              <tr>
                                <th>Action</th>
                                <th className="text-end">Count</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.by_action.map((item, idx) => (
                                <tr key={idx}>
                                  <td><Badge bg="primary">{item.action}</Badge></td>
                                  <td className="text-end">{item.count}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Col>
                      <Col md={6}>
                        <h6>Top Users by Activity</h6>
                        <div className="table-responsive">
                          <table className="table table-sm">
                            <thead>
                              <tr>
                                <th>User</th>
                                <th className="text-end">Count</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.top_users?.map((item, idx) => (
                                <tr key={idx}>
                                  <td>{item.user__username}</td>
                                  <td className="text-end">{item.count}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}

          {reportType === 'subscriptions' && reportData.by_plan && (
            <Row>
              <Col md={12} className="mb-4">
                <Card>
                  <CardBody>
                    <h5 className="mb-3">Subscription Report</h5>
                    
                    {getSubscriptionChartData() && (
                      <div dir="ltr">
                        <ReactApexChart
                          options={getSubscriptionChartData().options}
                          series={getSubscriptionChartData().series}
                          type="line"
                          height={350}
                          className="apex-charts"
                        />
                      </div>
                    )}

                    <Row className="mt-4">
                      <Col md={6}>
                        <h6>Subscriptions by Plan</h6>
                        <div className="table-responsive">
                          <table className="table table-sm">
                            <thead>
                              <tr>
                                <th>Plan</th>
                                <th className="text-end">Count</th>
                                <th className="text-end">Revenue</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.by_plan.map((item, idx) => (
                                <tr key={idx}>
                                  <td><Badge bg="info">{item.plan}</Badge></td>
                                  <td className="text-end">{item.count}</td>
                                  <td className="text-end">${parseFloat(item.total_revenue || 0).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Col>
                      <Col md={6}>
                        <h6>Subscriptions by Status</h6>
                        <div className="table-responsive">
                          <table className="table table-sm">
                            <thead>
                              <tr>
                                <th>Status</th>
                                <th className="text-end">Count</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.by_status?.map((item, idx) => (
                                <tr key={idx}>
                                  <td>
                                    <Badge bg={
                                      item.status === 'active' ? 'success' :
                                      item.status === 'cancelled' ? 'warning' :
                                      item.status === 'expired' ? 'danger' : 'secondary'
                                    }>
                                      {item.status}
                                    </Badge>
                                  </td>
                                  <td className="text-end">{item.count}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}
        </>
      ) : (
        <div className="text-center py-5"><p className="text-muted">No report data available.</p></div>
      )}
    </ComponentContainerCard>
  );
};

export default ReportsView;
