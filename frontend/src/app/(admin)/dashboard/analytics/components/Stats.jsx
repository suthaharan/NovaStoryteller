import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { Card, CardBody, CardFooter, Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useApiData } from '@/hooks/useApiData';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const StatCard = ({
  change,
  icon,
  stat,
  title,
  variant,
  link
}) => {
  return <Card>
      <CardBody>
        <Row>
          <Col xs={6}>
            <div className="avatar-md bg-light bg-opacity-50 rounded flex-centered">
              <IconifyIcon icon={icon} className="fs-32 text-success" />
            </div>
          </Col>
          <Col xs={6} className="text-end">
            <p className="text-muted mb-0 text-truncate">{title}</p>
            <h3 className="text-dark mt-2 mb-0">{stat}</h3>
          </Col>
        </Row>
      </CardBody>
      {change && (
        <CardFooter className="border-0 py-2 bg-light bg-opacity-50">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <span className={`text-${variant} icons-center`}>
                {' '}
                <IconifyIcon icon={`bxs:${variant === 'danger' ? 'down' : 'up'}-arrow`} className="fs-12 " />
                &nbsp;{change}
              </span>
              <span className="text-muted ms-1 fs-12">&nbsp;Last 30 Days</span>
            </div>
            {link && (
              <Link to={link} className="text-reset fw-medium fs-12">
                View More
              </Link>
            )}
          </div>
        </CardFooter>
      )}
    </Card>;
};

const Stats = () => {
  const { data: stats, loading } = useApiData('/dashboard-stats/', {
    showToast: false, // We'll handle errors in the component
    autoFetch: true,
    dependencies: [], // No additional dependencies
  });

  if (loading) {
    return (
      <Row>
        <Col xs={12}>
          <LoadingSpinner message="Loading statistics..." />
        </Col>
      </Row>
    );
  }

  if (!stats || !stats.stats) {
    return (
      <Row>
        <Col xs={12}>
          <Card>
            <CardBody>
              <p className="text-muted mb-0">No statistics available</p>
            </CardBody>
          </Card>
        </Col>
      </Row>
    );
  }

  const statData = [
    {
      title: 'Total Stories',
      icon: 'solar:book-2-bold-duotone',
      stat: stats.stats.total_stories || 0,
      change: stats.stats.recent_stories > 0 ? `+${stats.stats.recent_stories}` : '0',
      variant: stats.stats.recent_stories > 0 ? 'success' : 'secondary',
      link: '/stories'
    },
    {
      title: 'Listening Sessions',
      icon: 'solar:headphones-round-sound-bold-duotone',
      stat: stats.stats.total_sessions || 0,
      change: null,
      variant: 'info',
      link: '/story-sessions'
    },
    {
      title: 'Total Playlists',
      icon: 'solar:playlist-bold-duotone',
      stat: stats.stats.total_playlists || 0,
      change: null,
      variant: 'warning',
      link: '/playlists'
    },
    ...(stats.is_admin ? [{
      title: 'Active Users',
      icon: 'solar:users-group-two-rounded-bold-duotone',
      stat: stats.stats.total_users || 0,
      change: null,
      variant: 'primary',
      link: '/users'
    }] : [{
      title: 'Listening Time',
      icon: 'solar:clock-circle-bold-duotone',
      stat: stats.stats.total_listening_time_formatted || '0h 0m',
      change: null,
      variant: 'success',
      link: '/story-sessions'
    }])
  ];

  return (
    <Row>
      {statData.map((stat, idx) => (
        <Col md={6} xl={3} key={idx}>
          <StatCard {...stat} />
        </Col>
      ))}
    </Row>
  );
};

export default Stats;
