import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Link,
  Paper,
  Alert,
  Grid,
  CircularProgress
} from '@mui/material';
import { LoginFormInputs } from '../../types';

interface LocationState {
  message?: string;
}

const Login: React.FC = () => {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const [formData, setFormData] = useState<LoginFormInputs>({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState<Partial<LoginFormInputs>>({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [messageFromRedirect, setMessageFromRedirect] = useState<string | null>(
    state?.message || null
  );
  
  // Check if user is already logged in
  useEffect(() => {
    if (currentUser) {
      // User is already logged in, go directly to dashboard
      navigate('/app/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);
  
  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormInputs> = {};
    let isValid = true;
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof LoginFormInputs]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Clear general error message
    if (errorMessage) {
      setErrorMessage(null);
    }
    
    // Clear redirect message
    if (messageFromRedirect) {
      setMessageFromRedirect(null);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);
    
    try {
      const user = await login(formData.email, formData.password);
      console.log('Login successful:', user);
      
      // Always navigate directly to dashboard after successful login
      navigate('/app/dashboard', { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle different Firebase auth errors with more detailed messages
      if (error.code === 'auth/user-not-found') {
        setErrorMessage('No account found with this email address');
      } else if (error.code === 'auth/wrong-password') {
        setErrorMessage('Incorrect password');
      } else if (error.code === 'auth/too-many-requests') {
        setErrorMessage('Too many failed login attempts. Please try again later or reset your password');
      } else if (error.code === 'auth/network-request-failed') {
        setErrorMessage('Network error. Please check your internet connection');
      } else if (error.code === 'auth/user-disabled') {
        setErrorMessage('This account has been disabled. Please contact support');
      } else {
        setErrorMessage('An error occurred during login: ' + (error.message || 'Please try again'));
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Login to ProcureFlow
          </Typography>
          
          {messageFromRedirect && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {messageFromRedirect}
            </Alert>
          )}
          
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              disabled={loading}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
              onClick={!loading ? handleSubmit : undefined}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            
            <Grid container>
              <Grid sx={{ flexGrow: 1 }}>
                <Link component={RouterLink} to="/forgot-password" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
              <Grid>
                <Link component={RouterLink} to="/register" variant="body2">
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 