import { Link } from 'react-router-dom';

const LogoBox = ({
  containerClassName,
  squareLogo,
  textLogo
}) => {
  return (
    <div className={containerClassName ?? ''}>
      <Link to="/" className="text-decoration-none d-flex align-items-center justify-content-center">
        <span 
          className="fw-bold" 
          style={{
            fontFamily: '"Arial Narrow", "Roboto Condensed", "Oswald", "Impact", sans-serif',
            fontSize: '1.5rem',
            color: '#ffffff',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            display: 'inline-block',
            lineHeight: '1.2',
            fontWeight: '700',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            fontStretch: 'condensed',
            marginRight: '0.5rem'
          }}
        >
          Nova
        </span>
        <span 
          style={{
            fontFamily: 'inherit',
            fontSize: '1.5rem',
            color: '#ffffff',
            letterSpacing: 'normal',
            textTransform: 'none',
            display: 'inline-block',
            lineHeight: '1.2',
            fontWeight: '400',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}
        >
          Storyteller
        </span>
      </Link>
    </div>
  );
};

export default LogoBox;