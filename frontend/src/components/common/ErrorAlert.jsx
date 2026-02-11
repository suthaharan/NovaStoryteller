import { Alert } from 'react-bootstrap';

/**
 * Reusable error alert component
 * @param {Object} props
 * @param {string} props.error - Error message
 * @param {string} props.variant - Alert variant (default: 'danger')
 * @param {Function} props.onDismiss - Callback when alert is dismissed
 * @param {string} props.className - Additional CSS classes
 */
const ErrorAlert = ({
  error,
  variant = 'danger',
  onDismiss,
  className = '',
}) => {
  if (!error) {
    return null;
  }

  return (
    <Alert variant={variant} dismissible={!!onDismiss} onClose={onDismiss} className={className}>
      {error}
    </Alert>
  );
};

export default ErrorAlert;

