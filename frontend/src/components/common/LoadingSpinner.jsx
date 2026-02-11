import { Spinner } from 'react-bootstrap';

/**
 * Reusable loading spinner component
 * @param {Object} props
 * @param {string} props.message - Loading message
 * @param {string} props.size - Spinner size ('sm', 'lg', or undefined)
 * @param {string} props.variant - Spinner variant ('border' or 'grow', default: 'border')
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 * @param {boolean} props.centered - Center the spinner (default: true)
 * @param {number} props.minHeight - Minimum height in pixels (default: 400)
 */
const LoadingSpinner = ({
  message = 'Loading...',
  size,
  variant = 'border',
  className = '',
  style = {},
  centered = true,
  minHeight = 400,
}) => {
  const containerStyle = {
    ...(centered && {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: `${minHeight}px`,
    }),
    ...style,
  };

  return (
    <div className={className} style={containerStyle}>
      <Spinner animation={variant} size={size} role="status">
        <span className="visually-hidden">{message}</span>
      </Spinner>
    </div>
  );
};

export default LoadingSpinner;

