import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  LinearProgress,
  Link,
  Divider,
  Breadcrumbs
} from '@mui/material';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { auth } from '../../firebase/firebaseConfig';
import BusinessIcon from '@mui/icons-material/Business';
import HomeIcon from '@mui/icons-material/Home';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface BusinessData {
  name: string;
  industry: string;
  email: string;
  phone: string;
  website: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

// Define additional types for Firebase User and Business context
interface FirebaseUser {
  uid: string;
  email: string | null;
}

// List of countries for dropdown
const countries = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Japan',
  'China',
  'India',
  'Brazil',
  'Mexico',
  'South Africa',
  'Nigeria',
  'Kenya',
  'Russia',
  'Italy',
  'Spain',
  'Netherlands',
  'Sweden',
  'Norway',
  // Add more countries as needed
];

const initialBusinessData: BusinessData = {
  name: '',
  industry: '',
  email: '',
  phone: '',
  website: '',
  address: {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: ''
  }
};

const steps = ['Business Information', 'Contact Details', 'Address'];

const CreateBusiness: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, createBusiness } = useAuth();
  // Type cast the BusinessContext to include setCurrentBusiness
  const businessContext = useBusiness() as unknown as { 
    setCurrentBusiness: (business: { id: string; name: string }) => void 
  };
  const { setCurrentBusiness } = businessContext;
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<BusinessData>(initialBusinessData);

  // Check if user is logged in
  useEffect(() => {
    if (!currentUser) {
      // If no user is logged in, redirect to login
      navigate('/login', { 
        replace: true,
        state: { message: "Please login to create your business profile" } 
      });
    }
  }, [currentUser, navigate]);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'address') {
        setFormData({
          ...formData,
          address: {
            ...formData.address,
            [child]: value
          }
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const validateStep = () => {
    if (activeStep === 0) {
      if (!formData.name || !formData.industry) {
        setError('Please fill out all required fields');
        return false;
      }
    } else if (activeStep === 1) {
      if (!formData.email || !formData.phone) {
        setError('Please fill out all required fields');
        return false;
      }
    } else if (activeStep === 2) {
      if (!formData.address.street || !formData.address.city || !formData.address.country) {
        setError('Please fill out all required fields');
        return false;
      }
    }
    
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!currentUser) {
      setError('You must be logged in to create a business');
      return;
    }

    try {
      setLoading(true);
      // Log the current user to debug
      console.log('Current user in CreateBusiness:', currentUser);
      
      // Ensure we have a valid user ID
      if (!currentUser.id) {
        console.error('User ID is missing:', currentUser);
        setError('Your user account is missing an ID. Please try logging out and back in.');
        return;
      }
      
      // Ensure the user is authenticated
      if (!auth.currentUser) {
        console.error('Firebase auth user is null');
        setError('Authentication error. Please log out and log back in.');
        return;
      }
      
      // Explicitly add ownerId to formData
      const businessFormData = {
        ...formData,
        ownerId: currentUser.id
      };
      
      console.log('Creating business with data:', businessFormData);
      
      try {
        // Use the auth context's createBusiness function
        const businessId = await createBusiness(formData.name, businessFormData);
        
        console.log('Business created successfully with ID:', businessId);
        
        // Create a complete business object from the form data
        const businessObject = {
          id: businessId,
          name: formData.name,
          ownerId: currentUser.id,
          industry: formData.industry,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          address: formData.address,
          createdAt: new Date().toISOString()
        };
        
        // Set business in context
        setCurrentBusiness(businessObject);
        
        // Wait for the auth state to update
        console.log('Waiting for auth state to refresh...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force update the current user with the business ID
        if (auth.currentUser) {
          // Check if the displayName was updated correctly
          await auth.currentUser.reload();
          console.log('User profile after reload:', auth.currentUser);
          
          if (auth.currentUser.displayName !== businessId) {
            console.log('Business ID not properly set in user profile, fixing manually');
            // Update the current user in memory
            const updatedUser = { 
              ...currentUser, 
              businessId: businessId 
            };
            // No way to directly modify the AuthContext state from here,
            // but we can at least update the business context
          }
        }
        
        // Log before navigation
        console.log('Ready to navigate to dashboard. Business context is updated.');
        
        // Navigate to dashboard
        navigate('/app/dashboard', { replace: true });
      } catch (err: any) {
        console.error('Error in business creation:', err);
        
        // Check for specific error messages
        if (err.message && err.message.includes('permission')) {
          setError('Permission error: ' + err.message);
        } else if (err.code === 'permission-denied') {
          setError('You don\'t have permission to create a business. Please contact support.');
        } else {
          setError(err.message || 'Failed to create business. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Error creating business:', err);
      setError(err.message || 'Failed to create business. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Business Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="industry"
              label="Industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
            />
          </Box>
        );
      case 1:
        return (
          <Box>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Business Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="phone"
              label="Business Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              fullWidth
              id="website"
              label="Website"
              name="website"
              value={formData.website}
              onChange={handleChange}
            />
          </Box>
        );
      case 2:
        return (
          <Box>
            <TextField
              margin="normal"
              required
              fullWidth
              id="street"
              label="Street Address"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="city"
              label="City"
              name="address.city"
              value={formData.address.city}
              onChange={handleChange}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                margin="normal"
                fullWidth
                id="state"
                label="State/Province"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
              />
              <TextField
                margin="normal"
                fullWidth
                id="zip"
                label="ZIP/Postal Code"
                name="address.zip"
                value={formData.address.zip}
                onChange={handleChange}
              />
            </Box>
            <FormControl 
              fullWidth 
              margin="normal"
              required
            >
              <InputLabel id="country-label">Country</InputLabel>
              <Select
                labelId="country-label"
                id="country"
                name="address.country"
                value={formData.address.country}
                label="Country"
                onChange={(e) => {
                  const { name, value } = e.target;
                  setFormData({
                    ...formData,
                    address: {
                      ...formData.address,
                      country: value
                    }
                  });
                }}
              >
                {countries.map((country) => (
                  <MenuItem key={country} value={country}>
                    {country}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Please select your country</FormHelperText>
            </FormControl>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 6,
          marginBottom: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Breadcrumb navigation */}
        <Breadcrumbs sx={{ alignSelf: 'flex-start', mb: 2 }}>
          <Link 
            component={RouterLink} 
            to="/"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
            Home
          </Link>
          <Link 
            component={RouterLink} 
            to="/login"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            Login
          </Link>
          <Typography 
            color="text.primary"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <BusinessIcon sx={{ mr: 0.5 }} fontSize="small" />
            Business Setup
          </Typography>
        </Breadcrumbs>

        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <BusinessIcon color="primary" sx={{ fontSize: 36, mr: 2 }} />
            <Typography component="h1" variant="h4" gutterBottom sx={{ mb: 0 }}>
              Business Setup
            </Typography>
          </Box>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" color="text.primary" paragraph sx={{ fontWeight: 'medium' }}>
              Welcome to the final step of your account setup!
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              You've successfully logged in. Now, let's set up your business profile 
              to customize your procurement management experience.
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={66} 
                sx={{ flexGrow: 1, height: 8, borderRadius: 4 }} 
              />
              <Typography variant="body2" color="primary" sx={{ ml: 2, fontWeight: 'bold' }}>
                Step 2 of 3
              </Typography>
            </Box>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box>{getStepContent(activeStep)}</Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
              endIcon={activeStep === steps.length - 1 ? <ArrowForwardIcon /> : null}
            >
              {activeStep === steps.length - 1 ? (
                loading ? <CircularProgress size={24} /> : 'Complete Setup'
              ) : (
                'Next'
              )}
            </Button>
          </Box>
        </Paper>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Need to use a different account? <Link component={RouterLink} to="/logout">Sign out</Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default CreateBusiness; 