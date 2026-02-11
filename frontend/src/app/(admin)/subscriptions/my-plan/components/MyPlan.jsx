import { useState, useEffect } from 'react';
import { Button, Card, CardBody, Col, Row, Spinner } from 'react-bootstrap';
import PageMetaData from '@/components/PageTitle';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { currency } from '@/context/constants';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';
import Swal from 'sweetalert2';

const PricingCard = ({ plan, isCurrentPlan, onSubscribe, subscribing }) => {
  const { features, name, price, is_popular, duration_months } = plan;
  const subscribed = isCurrentPlan;

  return (
    <Card className="card-pricing">
      <CardBody>
        {is_popular && (
          <div className="pricing-ribbon pricing-ribbon-primary float-end">Popular</div>
        )}
        {subscribed && (
          <div className="pricing-ribbon pricing-ribbon-success float-start">Current Plan</div>
        )}
        <h5 className="mt-0 mb-3 fs-14 text-uppercase fw-semibold">{name}</h5>
        <h2 className="mt-0 mb-3 fw-bold">
          {currency}
          {price}&nbsp;
          <span className="fs-14 fw-medium text-muted">
            / {duration_months === 1 ? 'Month' : `${duration_months} Months`}
          </span>
        </h2>
        {plan.description && (
          <div 
            className="text-muted mb-3" 
            dangerouslySetInnerHTML={{ __html: plan.description }}
            style={{ fontSize: '0.9rem' }}
          />
        )}
        {features && features.length > 0 && (
          <ul className="card-pricing-features text-muted border-top pt-2 mt-2 ps-0 list-unstyled">
            {features.map((feature, idx) => (
              <li className="text-dark" key={idx}>
                <span className="icons-center">
                  <IconifyIcon icon="bx:check-circle" className="text-primary fs-15 me-1" />
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 text-center">
          <Button
            variant={subscribed ? "success" : "primary"}
            disabled={subscribed || subscribing === plan.uuid}
            className="px-sm-4 w-100"
            onClick={() => onSubscribe(plan.uuid)}
          >
            {subscribing === plan.uuid ? (
              <>
                <Spinner size="sm" className="me-2" />
                Subscribing...
              </>
            ) : subscribed ? (
              'Current Plan'
            ) : (
              'Get Started'
            )}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

const MyPlan = () => {
  const [pricingPlans, setPricingPlans] = useState([]);
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
      setPricingPlans(plansData.sort((a, b) => a.display_order - b.display_order));

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

  const isCurrentPlan = (planUuid) => {
    return currentSubscription?.plan?.uuid === planUuid;
  };

  if (loading) {
    return (
      <>
        <PageMetaData title="My Plan" />
        <div className="container-xxl">
          <div className="text-center py-5">
            <Spinner animation="border" />
            <p className="mt-2">Loading plans...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMetaData title="My Plan" />

      <div className="container-xxl">
        <Row>
          <Col xs={12}>
            <div className="text-center my-4">
              <h3>Simple Pricing Plans</h3>
              <p className="text-muted text-center">
                Get the power and control you need to manage your organization&apos;s technical documentation
              </p>
            </div>
            <Row className="justify-content-center">
              {pricingPlans.map((plan, idx) => (
                <Col lg={3} key={plan.uuid || idx}>
                  <PricingCard
                    plan={plan}
                    isCurrentPlan={isCurrentPlan(plan.uuid)}
                    onSubscribe={handleSubscribe}
                    subscribing={subscribing}
                  />
                </Col>
              ))}
            </Row>
            {pricingPlans.length === 0 && (
              <div className="text-center py-5">
                <IconifyIcon icon="solar:document-text-bold-duotone" width={64} height={64} className="text-muted mb-3" />
                <p className="text-muted">No active plans available.</p>
              </div>
            )}
          </Col>
        </Row>
      </div>
    </>
  );
};

export default MyPlan;

