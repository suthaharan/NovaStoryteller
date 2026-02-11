import { ToastContainer } from 'react-toastify';
import { AuthProvider } from '@/context/useAuthContext';
import { LayoutProvider } from '@/context/useLayoutContext';
import { NotificationProvider } from '@/context/useNotificationContext';
const AppProvidersWrapper = ({
  children
}) => {
  return <AuthProvider>
        <LayoutProvider>
          <NotificationProvider>
            {children}
            <ToastContainer 
              theme="colored" 
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={true}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </NotificationProvider>
        </LayoutProvider>
      </AuthProvider>;
};
export default AppProvidersWrapper;