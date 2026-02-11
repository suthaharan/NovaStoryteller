import TextFormInput from '@/components/form/TextFormInput';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';

const ResetPassForm = () => {
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotificationContext();
  
  const resetPasswordSchema = yup.object({
    email: yup.string().email('Please enter a valid email').required('Please enter your email')
  });
  
  const {
    control,
    handleSubmit,
    reset
  } = useForm({
    resolver: yupResolver(resetPasswordSchema)
  });
  
  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      const res = await httpClient.post('/password-reset/', values);
      
      if (res && res.data) {
        showNotification({
          message: res.data.message || 'Password reset instructions have been sent to your email.',
          variant: 'success'
        });
        // Clear the form after successful submission
        reset();
      }
    } catch (e) {
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      if (e.response?.data) {
        if (e.response.data.error) {
          errorMessage = e.response.data.error;
        } else if (e.response.data.detail) {
          errorMessage = e.response.data.detail;
        } else if (typeof e.response.data === 'string') {
          errorMessage = e.response.data;
        } else if (Array.isArray(e.response.data)) {
          errorMessage = e.response.data.join(', ');
        } else if (e.response.data.details) {
          errorMessage = e.response.data.details;
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
  
  return (
    <form className="authentication-form" onSubmit={onSubmit}>
      <TextFormInput 
        control={control} 
        name="email" 
        containerClassName="mb-3" 
        label="Email" 
        id="email-id" 
        placeholder="Enter your email" 
      />
      <div className="mb-1 text-center d-grid">
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Reset Password'}
        </Button>
      </div>
    </form>
  );
};

export default ResetPassForm;