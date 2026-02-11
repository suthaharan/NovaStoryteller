import { useState, useEffect } from 'react';
import { Button, Card, CardBody, Col, Row, Spinner, Badge } from 'react-bootstrap';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import Swal from 'sweetalert2';

const PlansSubscribe = () => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const { showNotification } = useNotificationContext();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch active plans
      const plansResponse = await httpClient.get('/plans/?is_active=true');
      const plansData = plansResponse.data.results || plansResponse.data;
      setPlans(plansData.sort((a, b) => a.display_order - b.display_order));

      // Fetch current subscription
      try {
        const subscriptionResponse = await httpClient.get('/subscriptions/?status=active');
        const subscriptions = subscriptionResponse.data.results || subscriptionResponse.data;
        if (subscriptions.length > 0) {
          setCurrentSubscription(subscriptions[0]);
        }
      } catch (error) {
        // No active subscription
        setCurrentSubscription(null);
      }
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        return;
      }
      showNotification({ message: 'Failed to load plans.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planUuid) => {
    const result = await Swal.fire({
      title: 'Subscribe to Plan?',
      text: 'Are you sure you want to subscribe to this plan?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, subscribe!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setSubscribing(planUuid);
    try {
      const response = await httpClient.post('/subscribe/', {
        plan_uuid: planUuid
      });
      
      await Swal.fire({
        title: 'Success!',
        text: response.data.message || 'Subscription successful!',
        icon: 'success',
        confirmButtonText: 'OK'
      });
      
      // Refresh data
      fetchData();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to subscribe to plan.';
      Swal.fire({
        title: 'Error!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setSubscribing(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const isCurrentPlan = (planUuid) => {
    return currentSubscription?.plan?.uuid === planUuid;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading plans...</p>
      </div>
    );
  }

  return (
    <ComponentContainerCard
      title="Subscription Plans"
      description="Choose a plan that fits your needs"
    >
      <Row className="justify-content-center">
        {plans.map((plan) => {
          const isCurrent = isCurrentPlan(plan.uuid);
          return (
            <Col lg={4} md={6} key={plan.uuid} className="mb-4">
              <Card className={`h-100 ${isCurrent ? 'border-primary border-2' : ''}`}>
                {plan.is_popular && (
                  <div className="position-absolute top-0 end-0 m-2">
                    <Badge bg="primary">Popular</Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className="position-absolute top-0 start-0 m-2">
                    <Badge bg="success">Current Plan</Badge>
                  </div>
                )}
                <CardBody className="d-flex flex-column">
                  <h5 className="mt-0 mb-3">{plan.name}</h5>
                  <h2 className="mt-0 mb-3 fw-bold">
                    {formatCurrency(plan.price)}
                    <span className="fs-14 fw-medium text-muted ms-1">
                      / {plan.duration_months === 1 ? 'Month' : `${plan.duration_months} Months`}
                    </span>
                  </h2>
                  {plan.description && (
                    <p className="text-muted mb-3">{plan.description}</p>
                  )}
                  {plan.features && plan.features.length > 0 && (
                    <ul className="list-unstyled mb-4 flex-grow-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="mb-2">
                          <IconifyIcon icon="bx:check-circle" className="text-primary me-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-auto">
                    <Button
                      variant={isCurrent ? "success" : "primary"}
                      className="w-100"
                      disabled={isCurrent || subscribing === plan.uuid}
                      onClick={() => handleSubscribe(plan.uuid)}
                    >
                      {subscribing === plan.uuid ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Subscribing...
                        </>
                      ) : isCurrent ? (
                        <>
                          <IconifyIcon icon="solar:check-circle-bold-duotone" width={20} height={20} className="me-1" />
                          Current Plan
                        </>
                      ) : (
                        <>
                          <IconifyIcon icon="solar:cart-bold-duotone" width={20} height={20} className="me-1" />
                          Subscribe Now
                        </>
                      )}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </Col>
          );
        })}
      </Row>
      {plans.length === 0 && (
        <div className="text-center py-5">
          <IconifyIcon icon="solar:document-text-bold-duotone" width={64} height={64} className="text-muted mb-3" />
          <p className="text-muted">No active plans available.</p>
        </div>
      )}
    </ComponentContainerCard>
  );
};

export default PlansSubscribe;

