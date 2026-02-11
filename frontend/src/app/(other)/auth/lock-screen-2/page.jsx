import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import LogoBox from '@/components/LogoBox';
import PageMetaData from '@/components/PageTitle';
import LockScreenForm from './components/LockScreenForm';
import { useAuthContext } from '@/context/useAuthContext';
import { useNotificationContext } from '@/context/useNotificationContext';

const LockScreen2 = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLockScreenExpired, removeSession, getLockScreenTimestamp } = useAuthContext();
  const { showNotification } = useNotificationContext();
  const [remainingTime, setRemainingTime] = useState(null);

  // Calculate remaining time
  const calculateRemainingTime = () => {
    const timestamp = getLockScreenTimestamp();
    if (!timestamp) return null;
    const now = Date.now();
    const elapsed = now - timestamp;
    const remaining = 5 * 60 * 1000 - elapsed; // 5 minutes in milliseconds
    if (remaining <= 0) return null;
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return { minutes, seconds };
  };

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      navigate('/auth/sign-in-2');
      return;
    }

    // Check if lock screen timestamp exists (user should have locked the screen)
    const lockTimestamp = getLockScreenTimestamp();
    if (!lockTimestamp) {
      // If no lock timestamp, redirect to dashboard
      navigate('/dashboard');
      return;
    }

    // Check if lock screen has expired (5 minutes)
    if (isLockScreenExpired()) {
      showNotification({
        message: 'Lock screen has expired. Please login again.',
        variant: 'warning'
      });
      removeSession();
      navigate('/auth/sign-in-2');
      return;
    }

    // Update remaining time immediately
    setRemainingTime(calculateRemainingTime());

    // Set up interval to check expiration and update remaining time
    const interval = setInterval(() => {
      if (isLockScreenExpired()) {
        showNotification({
          message: 'Lock screen has expired. Please login again.',
          variant: 'warning'
        });
        removeSession();
        navigate('/auth/sign-in-2');
        clearInterval(interval);
        return;
      }
      const time = calculateRemainingTime();
      if (!time) {
        // Time expired
        showNotification({
          message: 'Lock screen has expired. Please login again.',
          variant: 'warning'
        });
        removeSession();
        navigate('/auth/sign-in-2');
        clearInterval(interval);
        return;
      }
      setRemainingTime(time);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isAuthenticated, user, isLockScreenExpired, getLockScreenTimestamp, navigate, removeSession, showNotification]);

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return 'User';
    if (user.firstName) {
      return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
    }
    return user.username || 'User';
  };

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <PageMetaData title="Lock Screen" />

      <Col xl={5} className="mx-auto">
        <Card className="auth-card">
          <CardBody className="px-3 py-5">
            <LogoBox 
              textLogo={{
                height: 24,
                width: 110
              }} 
              squareLogo={{
                className: 'me-2',
                width: 33,
                height: 28
              }} 
              containerClassName="mx-auto mb-4 text-center auth-logo" 
            />
            <h2 className="fw-bold text-center fs-18">Hi! {getUserDisplayName()}</h2>
            <p className="text-muted text-center mt-1 mb-2">Enter your password to access the admin.</p>
            {remainingTime && (
              <p className="text-warning text-center mb-4 small">
                Lock screen expires in {remainingTime.minutes}m {remainingTime.seconds}s
              </p>
            )}
            <div className="px-4">
              <LockScreenForm />
            </div>
          </CardBody>
        </Card>
        <p className="mb-0 text-center">
          Not you? return{' '}
          <Link to="/auth/sign-in-2" className="fw-bold ms-1" onClick={() => removeSession()}>
            Sign In
          </Link>
        </p>
      </Col>
    </>
  );
};

export default LockScreen2;