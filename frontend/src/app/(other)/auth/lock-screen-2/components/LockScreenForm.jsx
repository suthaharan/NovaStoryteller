import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PasswordFormInput from '@/components/form/PasswordFormInput';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useAuthContext } from '@/context/useAuthContext';
import httpClient from '@/helpers/httpClient';
import { useNotificationContext } from '@/context/useNotificationContext';

const LockScreenForm = () => {
  const navigate = useNavigate();
  const { unlockScreen, isLockScreenExpired, removeSession } = useAuthContext();
  const { showNotification } = useNotificationContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lockScreenSchema = yup.object({
    password: yup.string().required('Please enter your password')
  });

  const {
    control,
    handleSubmit,
    formState: { errors: formErrors }
  } = useForm({
    resolver: yupResolver(lockScreenSchema)
  });

  const onSubmit = handleSubmit(async (values) => {
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

    setLoading(true);
    setError('');

    try {
      const response = await httpClient.post('/unlock-screen/', {
        password: values.password
      });

      if (response.status === 200) {
        // Unlock screen
        unlockScreen();
        showNotification({
          message: 'Screen unlocked successfully!',
          variant: 'success'
        });
        
        // Navigate back to the previous page or dashboard
        const previousPath = sessionStorage.getItem('previousPath') || '/dashboard';
        sessionStorage.removeItem('previousPath');
        navigate(previousPath);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Invalid password. Please try again.');
      } else if (error.response?.status === 400) {
        setError(error.response.data?.error || 'Invalid input');
      } else {
        setError('An error occurred. Please try again.');
      }
      console.error('Unlock screen error:', error);
    } finally {
      setLoading(false);
    }
  });

  return (
    <form className="authentication-form" onSubmit={onSubmit}>
      <PasswordFormInput 
        control={control} 
        name="password" 
        containerClassName="mb-3" 
        placeholder="Enter your password" 
        id="password-id" 
      />
      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}
      {formErrors.password && (
        <div className="text-danger mb-3">
          {formErrors.password.message}
        </div>
      )}
      <div className="mb-1 text-center d-grid">
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Unlocking...
            </>
          ) : (
            'Unlock'
          )}
        </Button>
      </div>
    </form>
  );
};

export default LockScreenForm;