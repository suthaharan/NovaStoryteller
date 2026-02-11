import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as yup from 'yup';
import { useAuthContext } from '@/context/useAuthContext';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';

const useSignIn = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    saveSession
  } = useAuthContext();
  const [searchParams] = useSearchParams();
  const {
    showNotification
  } = useNotificationContext();

  const loginFormSchema = yup.object({
    email: yup.string().email('Please enter a valid email').required('Please enter your email'),
    password: yup.string().required('Please enter your password'),
    rememberMe: yup.boolean()
  });

  const {
    control,
    handleSubmit
  } = useForm({
    resolver: yupResolver(loginFormSchema),
    defaultValues: {
      email: 'user@test.com',
      password: 'password',
      rememberMe: false
    }
  });

  const redirectUser = () => {
    const redirectLink = searchParams.get('redirectTo');
    if (redirectLink) {
      navigate(redirectLink);
    } else {
      navigate('/dashboard');
    }
  };

  const login = handleSubmit(async (values) => {
    setLoading(true);
    try {
      // Extract rememberMe from values (don't send it to backend)
      const { rememberMe, ...loginData } = values;
      
      const res = await httpClient.post('/login/', loginData);
      
      // Check if response has data and token
      if (res && res.data && res.data.token) {
        const sessionData = {
          ...(res.data ?? {}),
          token: res.data.token,
          // Ensure role is set correctly for menu filtering
          role: res.data.role || (res.data.is_staff ? (res.data.is_superuser ? 'Admin' : 'Staff') : 'User'),
          is_staff: res.data.is_staff || false,
          is_superuser: res.data.is_superuser || false
        };
        // Pass rememberMe to saveSession to control cookie expiration
        saveSession(sessionData, rememberMe);
        showNotification({
          message: 'Successfully logged in. Redirecting....',
          variant: 'success'
        });
        // Small delay to ensure cookie is set before redirect
        setTimeout(() => {
          redirectUser(sessionData);
        }, 100);
      } else {
        showNotification({
          message: 'Login failed: No token received',
          variant: 'danger'
        });
      }
    } catch (e) {
      // Extract error message from response
      let errorMessage = 'Login failed. Please try again.';
      
      if (e.response?.data) {
        // Django REST Framework error format
        if (e.response.data.error) {
          errorMessage = e.response.data.error;
        } else if (e.response.data.detail) {
          errorMessage = e.response.data.detail;
        } else if (typeof e.response.data === 'string') {
          errorMessage = e.response.data;
        } else if (Array.isArray(e.response.data)) {
          errorMessage = e.response.data.join(', ');
        } else {
          errorMessage = JSON.stringify(e.response.data);
        }
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      showNotification({
        message: errorMessage,
        variant: 'danger'
      });
    } finally {
      setLoading(false);
    }
  });

  return {
    loading,
    login,
    control
  };
};

export default useSignIn;
