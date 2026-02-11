import AppProvidersWrapper from './components/wrappers/AppProvidersWrapper';
import AppRouter from './routes/router';
import '@/assets/scss/app.scss';
import 'react-toastify/dist/ReactToastify.css';

// Only enable fake backend in development mode when not using real API
// In production or when using Django API, disable fake backend
// CRITICAL: Only import fake-backend if we're actually using it
// This prevents MockAdapter from being created when not needed
const isDevelopment = import.meta.env.DEV;
const useFakeBackend = import.meta.env.VITE_USE_FAKE_BACKEND === 'true';

if (isDevelopment && useFakeBackend) {
  // Dynamically import fake-backend only when needed
  import('./helpers/fake-backend').then(module => {
    module.default();
  });
}

const App = () => {
  return (
    <AppProvidersWrapper>
      <AppRouter />
    </AppProvidersWrapper>
  );
};

export default App;
