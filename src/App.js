import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar/NavBar'; // Sử dụng một NavBar duy nhất
import { routes } from './routes';
import Login from './pages/Login/Login'; // Nhập component Login
import { AuthProvider, useAuth } from './authContext'; // Nhập AuthContext
import Register from './pages/Register/Register'; // Nhập component Register

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
      {routes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={isAuthenticated ? <route.page /> : <Navigate to="/login" replace />}
        />
      ))}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <div>
        {/* Sử dụng useAuth trong component con để kiểm tra trạng thái người dùng */}
        <AppContent />
      </div>
    </AuthProvider>
  );
};

// Component con để sử dụng useAuth
const AppContent = () => {
  const { isAuthenticated, userRole } = useAuth();

  return (
    <>
      {/* Hiển thị NavBar nếu người dùng đã xác thực và route yêu cầu */}
      {isAuthenticated && routes.some(route => window.location.pathname === route.path && route.isShowHeader) && (
        <NavBar userRole={userRole} /> // Truyền vai trò người dùng vào NavBar
      )}
      <AppRoutes />
    </>
  );
};

export default App;