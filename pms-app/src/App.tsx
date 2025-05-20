import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, CircularProgress } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthProvider } from './contexts/AuthContext';
import { BusinessProvider } from './contexts/BusinessContext';
import DataProvider from './contexts/DataContext';
import ProtectedRoute from './components/app/ProtectedRoute';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase/firebaseConfig';
import { ref, get } from 'firebase/database';
import { rtdb } from './firebase/firebaseConfig';
import { initializeFirebase } from './firebase/firebaseUtils';
import AdminRoute from './components/auth/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/Dashboard';
import AdminUsers from './components/admin/Users';
import AdminSettings from './components/admin/Settings';

// Marketing Pages
import MarketingLayout from './components/marketing/MarketingLayout';
import LandingPage from './pages/marketing/LandingPage';
import FeaturesPage from './pages/marketing/FeaturesPage';
import PricingPage from './pages/marketing/PricingPage';
import ContactPage from './pages/marketing/ContactPage';
import Login from './pages/marketing/Login';
import Register from './pages/marketing/Register';
import ForgotPassword from './pages/marketing/ForgotPassword';
import CreateBusiness from './pages/marketing/CreateBusiness';
import Logout from './pages/marketing/Logout';

// App Pages
import AppLayout from './components/app/AppLayout';
import Dashboard from './pages/app/Dashboard';
import Suppliers from './pages/app/Suppliers';
import PurchaseOrders from './pages/app/PurchaseOrders';
import Inventory from './pages/app/Inventory';
import Settings from './pages/app/Settings';
import DataTest from './pages/app/DataTest';

// Placeholder components for missing app pages
const Invoices = React.lazy(() => import('./pages/app/Invoices'));
const Budgets = React.lazy(() => import('./pages/app/Budgets'));
const Reports = React.lazy(() => import('./pages/app/Reports'));
const UserManagement = React.lazy(() => import('./pages/app/UserManagement'));

// Loading component for suspense fallback
const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </div>
);

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// Simple function to check Firebase connection
const checkFirebaseConnection = async () => {
  try {
    // Check Firestore connection
    console.log('Testing Firestore connection...');
    const testDoc = await getDoc(doc(db, 'system', 'status'));
    console.log('Firestore connection successful:', testDoc.exists() 
      ? 'Document exists' 
      : 'Document not found (expected)');
    
    // Check Realtime Database connection
    console.log('Testing Realtime Database connection...');
    try {
      const dbRef = ref(rtdb, 'connectionTest');
      await get(dbRef);
      console.log('Realtime Database connection successful');
    } catch (dbError) {
      console.log('Realtime Database connection test complete with expected permissions error');
    }
    
    return true;
  } catch (error) {
    console.error('Firebase connection error:', error);
    return false;
  }
};

function App() {
  // Initialize Firebase when app starts
  useEffect(() => {
    initializeFirebase();
  }, []);

  // Run connection check when app starts
  useEffect(() => {
    checkFirebaseConnection();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AuthProvider>
          <BusinessProvider>
            <DataProvider>
              <Router>
                <Suspense fallback={<Loading />}>
                  <Routes>
                    {/* Marketing Routes */}
                    <Route path="/" element={<MarketingLayout />}>
                      <Route index element={<LandingPage />} />
                      <Route path="features" element={<FeaturesPage />} />
                      <Route path="pricing" element={<PricingPage />} />
                      <Route path="contact" element={<ContactPage />} />
                      <Route path="login" element={<Login />} />
                      <Route path="register" element={<Register />} />
                      <Route path="forgot-password" element={<ForgotPassword />} />
                    </Route>

                    {/* Auth-related standalone routes */}
                    <Route path="/logout" element={<Logout />} />

                    {/* App Routes */}
                    <Route 
                      path="/app" 
                      element={
                        <Suspense fallback={<Loading />}>
                          <ProtectedRoute requiresBusiness={true}>
                            <AppLayout />
                          </ProtectedRoute>
                        </Suspense>
                      }
                    >
                      <Route index element={<Navigate to="/app/dashboard" replace />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="suppliers" element={<Suppliers />} />
                      <Route path="purchase-orders" element={<PurchaseOrders />} />
                      <Route path="inventory" element={<Inventory />} />
                      <Route path="invoices" element={<Invoices />} />
                      <Route path="budgets" element={<Budgets />} />
                      <Route path="reports" element={<Reports />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="data-test" element={<DataTest />} />
                    </Route>

                    {/* Create Business Route - Move outside app routes since it's an onboarding step */}
                    <Route 
                      path="/create-business" 
                      element={
                        <ProtectedRoute requiresBusiness={false}>
                          <CreateBusiness />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Admin Routes */}
                    <Route
                      path="/admin/*"
                      element={
                        <AdminRoute>
                          <AdminLayout />
                        </AdminRoute>
                      }
                    >
                      <Route index element={<AdminDashboard />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="settings" element={<AdminSettings />} />
                    </Route>

                    {/* Catch-all route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </Router>
            </DataProvider>
          </BusinessProvider>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
