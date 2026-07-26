import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import { getStoredToken } from './api/auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = getStoredToken();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!getStoredToken());

  useEffect(() => {
    const handleStorage = () => setIsLoggedIn(!!getStoredToken());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <Routes>
      <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login onLogin={() => setIsLoggedIn(true)} />} />
      <Route path="/register" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Register onRegister={() => setIsLoggedIn(true)} />} />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <Dashboard onLogout={() => setIsLoggedIn(false)} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
