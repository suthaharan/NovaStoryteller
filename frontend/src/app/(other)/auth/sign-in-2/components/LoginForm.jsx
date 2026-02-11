import PasswordFormInput from '@/components/form/PasswordFormInput';
import TextFormInput from '@/components/form/TextFormInput';
import { Button, FormCheck } from 'react-bootstrap';
import { Controller } from 'react-hook-form';
import { Link } from 'react-router-dom';
import useSignIn from './useSignIn';

const LoginForm = () => {
  const {
    loading,
    login,
    control
  } = useSignIn();
  
  return (
    <form className="authentication-form" onSubmit={login}>
      <TextFormInput control={control} name="email" containerClassName="mb-3" label="Email" id="email-id" placeholder="Enter your email" />

      <PasswordFormInput control={control} name="password" containerClassName="mb-3" placeholder="Enter your password" id="password-id" label={
        <>
          <Link to="/auth/reset-pass" className="float-end text-muted text-unline-dashed ms-1">
            Reset password
          </Link>
          <label className="form-label" htmlFor="example-password">
            Password
          </label>
        </>
      } />
      <div className="mb-3">
        <Controller
          name="rememberMe"
          control={control}
          render={({ field }) => (
            <FormCheck
              type="checkbox"
              label="Remember me"
              id="sign-in"
              checked={field.value || false}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
      </div>
      <div className="mb-1 text-center d-grid">
        <Button variant="primary" type="submit" disabled={loading}>
          Sign In
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;
