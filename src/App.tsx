import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import VotingPage from './components/VotingPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AddAdminPage from './components/AddAdmin'; // Import AddAdminPage
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { admin, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
};

// Admin Route Component (redirects if already logged in)
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { admin, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (admin) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<VotingPage />} />
            <Route 
              path="admin/login" 
              element={
                <AdminRoute>
                  <AdminLogin />
                </AdminRoute>
              } 
            />
            <Route 
              path="admin/dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            {/* Route baru untuk AddAdmin */}
            <Route 
              path="admin/add-admin" 
              element={
                
                  <AddAdminPage />
                
              } 
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;