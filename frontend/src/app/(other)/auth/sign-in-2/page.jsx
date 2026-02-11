import { Card, CardBody, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import LogoBox from '@/components/LogoBox';
import PageMetaData from '@/components/PageTitle';
import ThirdPartyAuth from '@/components/ThirdPartyAuth';
import LoginForm from './components/LoginForm';
const SignIn2 = () => {
  return <>
      <PageMetaData title="Sign In" />

      <Col xl={5} className="mx-auto">
        <Card className="auth-card">
          <CardBody className="px-3 py-5">
            <LogoBox textLogo={{
            height: 24,
            width: 110
          }} squareLogo={{
            className: 'me-2',
            width: 33,
            height: 28
          }} containerClassName="mx-auto mb-4 text-center auth-logo" />
            <h2 className="fw-bold text-center fs-18">Sign In</h2>
            <p className="text-muted text-center mt-1 mb-4">Enter your email address and password to access admin panel.</p>
            <div className="px-4">
              <LoginForm />
              <ThirdPartyAuth />
            </div>
          </CardBody>
        </Card>
        <p className="mb-0 text-center">
          New here?
          <Link to="/auth/sign-up" className="fw-bold ms-1">
            Sign Up
          </Link>
        </p>
      </Col>
    </>;
};
export default SignIn2;