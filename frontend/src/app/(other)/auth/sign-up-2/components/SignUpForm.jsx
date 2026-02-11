import PasswordFormInput from '@/components/form/PasswordFormInput';
import TextFormInput from '@/components/form/TextFormInput';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { Button, FormCheck, FormSelect } from 'react-bootstrap';
import { Controller } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { useAuthContext } from '@/context/useAuthContext';
import { useNotificationContext } from '@/context/useNotificationContext';
import httpClient from '@/helpers/httpClient';

const SignUpForm = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { saveSession } = useAuthContext();
  const { showNotification } = useNotificationContext();

  const signUpSchema = yup.object({
    username: yup
      .string()
      .required('Please enter your username')
      .min(4, 'Username must be at least 4 characters long'),
    first_name: yup.string().required('Please enter your first name'),
    last_name: yup.string().required('Please enter your last name'),
    email: yup
      .string()
      .email('Please enter a valid email')
      .required('Please enter your email'),
    password: yup
      .string()
      .required('Please enter your password')
      .min(8, 'Password must be at least 8 characters long'),
    confirm_password: yup
      .string()
      .required('Please confirm your password')
      .oneOf([yup.ref('password')], 'Passwords do not match'),
    user_type: yup
      .string()
      .oneOf(['admin', 'caregiver'], 'Please select a valid user type')
      .required('Please select user type'),
    accept_terms: yup
      .boolean()
      .oneOf([true], 'You must accept the terms and conditions to register')
      .required('You must accept the terms and conditions')
  });

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(signUpSchema),
    defaultValues: {
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirm_password: '',
      user_type: 'caregiver',  // Default to caregiver
      accept_terms: false
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      // Remove confirm_password before sending to API
      const { confirm_password, ...registrationData } = values;
      
      // Ensure user_type is included (admin or caregiver only)
      if (!registrationData.user_type || !['admin', 'caregiver'].includes(registrationData.user_type)) {
        registrationData.user_type = 'caregiver';  // Default to caregiver
      }
      
      const res = await httpClient.post('/register/', registrationData);
      
      if (res && res.data && res.data.token) {
        const sessionData = {
          ...(res.data ?? {}),
          token: res.data.token
        };
        saveSession(sessionData);
        showNotification({
          message: res.data.message || 'Registration successful! Redirecting...',
          variant: 'success'
        });
        // Redirect based on user role after successful registration
        setTimeout(() => {
          const role = sessionData.role;
          if (role === 'Admin') {
            navigate('/dashboard');
          } else if (role === 'Caregiver') {
            navigate('/caregiver/dashboard');
          } else {
            navigate('/dashboard');
          }
        }, 1500);
      } else {
        showNotification({
          message: 'Registration failed: No token received',
          variant: 'danger'
        });
      }
    } catch (e) {
      let errorMessage = 'Registration failed. Please try again.';
      
      if (e.response?.data) {
        if (e.response.data.error) {
          errorMessage = e.response.data.error;
        } else if (e.response.data.detail) {
          errorMessage = e.response.data.detail;
        } else if (e.response.data.details) {
          // Handle validation errors from backend
          const details = e.response.data.details;
          if (typeof details === 'object') {
            const errorMessages = Object.entries(details)
              .map(([field, messages]) => {
                if (Array.isArray(messages)) {
                  return `${field}: ${messages.join(', ')}`;
                }
                return `${field}: ${messages}`;
              })
              .join('; ');
            errorMessage = errorMessages || errorMessage;
          } else if (typeof details === 'string') {
            errorMessage = details;
          }
        } else if (typeof e.response.data === 'string') {
          errorMessage = e.response.data;
        } else if (Array.isArray(e.response.data)) {
          errorMessage = e.response.data.join(', ');
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
    <form 
      className="authentication-form" 
      onSubmit={onSubmit} 
      autoComplete="off"
      noValidate
    >
      <TextFormInput
        control={control}
        name="username"
        containerClassName="mb-3"
        label="Username"
        id="signup-username"
        placeholder="Enter your username (min 4 characters)"
        autoComplete="off"
      />
      
      <TextFormInput
        control={control}
        name="first_name"
        containerClassName="mb-3"
        label="First Name"
        id="signup-first-name"
        placeholder="Enter your first name"
        autoComplete="off"
      />
      
      <TextFormInput
        control={control}
        name="last_name"
        containerClassName="mb-3"
        label="Last Name"
        id="signup-last-name"
        placeholder="Enter your last name"
        autoComplete="off"
      />
      
      <TextFormInput
        control={control}
        name="email"
        containerClassName="mb-3"
        label="Email"
        id="signup-email"
        placeholder="Enter your email"
        type="email"
        autoComplete="off"
      />
      
      <PasswordFormInput
        control={control}
        name="password"
        containerClassName="mb-3"
        placeholder="Enter your password (min 8 characters)"
        id="signup-password"
        label="Password"
        autoComplete="new-password"
      />
      
      <PasswordFormInput
        control={control}
        name="confirm_password"
        containerClassName="mb-3"
        placeholder="Confirm your password"
        id="signup-confirm-password"
        label="Confirm Password"
        autoComplete="new-password"
      />
      
      <div className="mb-3">
        <Controller
          name="user_type"
          control={control}
          render={({ field }) => (
            <>
              <label htmlFor="signup-user-type" className="form-label">
                Account Type <span className="text-danger">*</span>
              </label>
              <FormSelect
                {...field}
                id="signup-user-type"
                isInvalid={!!errors.user_type}
              >
                <option value="">Select account type</option>
                <option value="caregiver">Caregiver</option>
                <option value="admin">Admin</option>
              </FormSelect>
              {errors.user_type && (
                <div className="text-danger small mt-1">
                  {errors.user_type.message}
                </div>
              )}
              <small className="text-muted d-block mt-1">
                Note: Seniors are created by caregivers after registration.
              </small>
            </>
          )}
        />
      </div>
      
      <div className="mb-3">
        <Controller
          name="accept_terms"
          control={control}
          render={({ field }) => (
            <>
              <FormCheck
                type="checkbox"
                label="I accept Terms and Conditions"
                id="termAndCondition2"
                checked={field.value || false}
                onChange={(e) => field.onChange(e.target.checked)}
                isInvalid={!!errors.accept_terms}
              />
              {errors.accept_terms && (
                <div className="text-danger small mt-1">
                  {errors.accept_terms.message}
                </div>
              )}
            </>
          )}
        />
      </div>
      
      <div className="mb-1 text-center d-grid">
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Sign Up'}
        </Button>
      </div>
    </form>
  );
};

export default SignUpForm;