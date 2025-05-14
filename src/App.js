import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './authContext';
import NavBar from './components/NavBar/NavBar';
import { routes } from './routes';

const App = () => {
  const [sidebar, setSidebar] = useState(true);

  return (
    <AuthProvider>
      <AppContent sidebar={sidebar} setSidebar={setSidebar} />
    </AuthProvider>
  );
};

const AppContent = ({ sidebar, setSidebar }) => {
  const { isAuthenticated, userRole } = useAuth();
  const location = useLocation();

  // Tìm route hiện tại để kiểm tra có cần hiển thị NavBar không
  const currentRoute = routes.find(route => location.pathname === route.path);
  const shouldShowHeader = currentRoute?.isShowHeader && isAuthenticated;

  return (
    <>
      {shouldShowHeader && <NavBar userRole={userRole} setSidebar={setSidebar} />}
      <Routes>
        {routes.map(({ path, page: PageComponent }) => (
          <Route
            key={path}
            path={path}
            element={
              // Nếu là /login hoặc /register, không cần kiểm tra xác thực
              (path === '/login' || path === '/register')
                ? <PageComponent />
                : (isAuthenticated
                  ? <PageComponent sidebar={sidebar} />
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
