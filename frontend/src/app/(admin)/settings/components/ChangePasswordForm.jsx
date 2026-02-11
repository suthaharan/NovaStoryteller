import { useState } from 'react';
import { Button, Card, CardBody, Row, Col, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import TextFormInput from '@/components/form/TextFormInput';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const ChangePasswordForm = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotificationContext();
  const [loading, setLoading] = useState(false);

  const passwordSchema = yup.object({
    new_password: yup
      .string()
      .required('New password is required')
      .min(8, 'Password must be at least 8 characters long'),
    confirm_password: yup
      .string()
      .required('Please confirm your password')
      .oneOf([yup.ref('new_password')], 'Passwords must match'),
  });

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(passwordSchema),
    defaultValues: {
      new_password: '',
      confirm_password: '',
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      await httpClient.post('/change-password/', {
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      });

      showNotification({
        message: 'Password changed successfully!',
        variant: 'success'
      });
      
      // Reset form
      setTimeout(() => {
        navigate('/settings/profile');
      }, 1500);
    } catch (error) {
      let errorMessage = 'Failed to change password.';
      if (error.response?.data) {
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.details) {
          // Handle validation errors
          const details = error.response.data.details;
          if (typeof details === 'object') {
            const firstError = Object.values(details)[0];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          } else {
            errorMessage = details;
          }
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      }
      showNotification({ message: errorMessage, variant: 'danger' });
    } finally {
      setLoading(false);
    }
  });

  return (
    <ComponentContainerCard title="Change Password" subtitle="Update your account password">
      <form onSubmit={onSubmit}>
        <Row>
          <Col md={8}>
            <Card className="mb-3">
              <CardBody>
                <h5 className="mb-3">Password Information</h5>
                
                <TextFormInput
                  control={control}
                  name="new_password"
                  label="New Password"
                  type="password"
                  containerClassName="mb-3"
                  placeholder="Enter your new password"
                  helpText="Password must be at least 8 characters long"
                />

                <TextFormInput
                  control={control}
                  name="confirm_password"
                  label="Confirm Password"
                  type="password"
                  containerClassName="mb-3"
                  placeholder="Confirm your new password"
                  helpText="Please re-enter your new password to confirm"
                />
              </CardBody>
            </Card>
          </Col>
        </Row>

        <div className="d-flex gap-2">
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Changing Password...
              </>
            ) : (
              <>
                <IconifyIcon icon="solar:lock-password-bold-duotone" width={16} height={16} className="me-1" />
                Change Password
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </ComponentContainerCard>
  );
};

export default ChangePasswordForm;

