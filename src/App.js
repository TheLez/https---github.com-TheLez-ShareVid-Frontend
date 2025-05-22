import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './authContext';
import NavBar from './components/NavBar/NavBar';
import { routes } from './routes';
import { NotificationProvider } from './NotificationContext';

const App = () => {
  const [sidebar, setSidebar] = useState(true); // Mặc định sidebar mở rộng

  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent sidebar={sidebar} setSidebar={setSidebar} />
      </NotificationProvider>
    </AuthProvider>
  );
};

const AppContent = ({ sidebar, setSidebar }) => {
  const { isAuthenticated, userRole } = useAuth();
  const location = useLocation();

  const currentRoute = routes.find(route => location.pathname === route.path);
  const shouldShowHeader = isAuthenticated && (currentRoute?.isShowHeader !== false);

  return (
    <>
      {shouldShowHeader && <NavBar userRole={userRole} setSidebar={setSidebar} />}
      <Routes>
        {routes.map(({ path, page: PageComponent }) => (
          <Route
            key={path}
            path={path}
            element={
              (path === '/login' || path === '/register')
                ? <PageComponent />
                : (isAuthenticated
                  ? <PageComponent sidebar={sidebar} setSidebar={setSidebar} /> // Truyền setSidebar
                  : <Navigate to="/login" replace />)
            }
          />
        ))}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

export default App;