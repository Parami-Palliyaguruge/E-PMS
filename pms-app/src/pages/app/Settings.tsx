import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Divider,
  Grid,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Snackbar,
  LinearProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  PhotoCamera
} from '@mui/icons-material';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { Address } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

interface ProfileFormState {
  displayName: string;
  email: string | null;
  photoURL: string;
}

interface BusinessFormState {
  name: string;
  contactEmail: string;
  contactPhone: string;
  logo: string;
  address: Address;
}

interface NotificationSettings {
  emailNotifications: {
    orderUpdates: boolean;
    inventoryAlerts: boolean;
    paymentReceipts: boolean;
  };
  lowStockAlerts: boolean;
  orderUpdates: boolean;
  invoiceReminders: boolean;
}

const initialAddress = {
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: ''
};

const Settings: React.FC = () => {
  const { currentUser } = useAuth();
  const { currentBusiness } = useBusiness();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  
  // Form states
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    displayName: '',
    email: null,
    photoURL: ''
  });
  
  const [businessForm, setBusinessForm] = useState<BusinessFormState>({
    name: '',
    contactEmail: '',
    contactPhone: '',
    logo: '',
    address: initialAddress
  });
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: {
      orderUpdates: true,
      inventoryAlerts: true,
      paymentReceipts: true
    },
    lowStockAlerts: true,
    orderUpdates: true,
    invoiceReminders: true
  });
  
  // Load user and business data
  useEffect(() => {
    const loadSettingsData = async () => {
      if (!currentUser || !currentBusiness) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Set profile form data
        setProfileForm({
          displayName: currentUser.displayName || '',
          email: currentUser.email || null,
          photoURL: currentUser.photoURL || ''
        });
        
        // Set business form data
        setBusinessForm({
          name: currentBusiness.name,
          contactEmail: currentBusiness.contactEmail || '',
          contactPhone: currentBusiness.contactPhone || '',
          logo: currentBusiness.logo || '',
          address: currentBusiness.address || initialAddress
        });
        
        // Load notification settings
        const settingsDoc = await getDoc(
          doc(db, 'businesses', currentBusiness.id, 'settings', 'notifications')
        );
        
        if (settingsDoc.exists()) {
          const data = settingsDoc.data() as NotificationSettings;
          setNotificationSettings({
            emailNotifications: data.emailNotifications ?? {
              orderUpdates: true,
              inventoryAlerts: true,
              paymentReceipts: true
            },
            lowStockAlerts: data.lowStockAlerts ?? true,
            orderUpdates: data.orderUpdates ?? true,
            invoiceReminders: data.invoiceReminders ?? true
          });
        }
        
      } catch (err) {
        console.error('Error loading settings data:', err);
        setError('Failed to load settings data');
      } finally {
        setLoading(false);
      }
    };
    
    loadSettingsData();
  }, [currentUser, currentBusiness]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleProfileFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleBusinessFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setBusinessForm(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setBusinessForm(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleNotificationChange = (category: string, setting: string, checked: boolean) => {
    if (category === 'emailNotifications') {
      setNotificationSettings(prev => ({
        ...prev,
        emailNotifications: {
          ...prev.emailNotifications,
          [setting]: checked
        }
      }));
    } else {
      setNotificationSettings(prev => ({ ...prev, [category]: checked }));
    }
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'business') => {
    if (!e.target.files || !e.target.files[0]) return;
    if (!currentUser || !currentBusiness) return;
    
    const file = e.target.files[0];
    
    try {
      setUploadingFile(true);
      setError(null);
      
      // Upload file to Firebase Storage
      const storage = getStorage();
      const path = type === 'profile'
        ? `users/${currentUser.id}/profile`
        : `businesses/${currentBusiness.id}/logo`;
      
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update form state
      if (type === 'profile') {
        setProfileForm(prev => ({ ...prev, photoURL: downloadURL }));
      } else {
        setBusinessForm(prev => ({ ...prev, logo: downloadURL }));
      }
      
      setSnackbar({
        open: true,
        message: 'File uploaded successfully',
        severity: 'success'
      });
      
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file');
      setSnackbar({
        open: true,
        message: 'Failed to upload file',
        severity: 'error'
      });
    } finally {
      setUploadingFile(false);
      // Reset the input
      e.target.value = '';
    }
  };
  
  const handleDeleteFile = async (type: 'profile' | 'business') => {
    if (!currentUser || !currentBusiness) return;
    
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }
    
    try {
      setUploadingFile(true);
      setError(null);
      
      // Delete file from Firebase Storage
      const storage = getStorage();
      const path = type === 'profile'
        ? `users/${currentUser.id}/profile`
        : `businesses/${currentBusiness.id}/logo`;
      
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      
      // Update form state
      if (type === 'profile') {
        setProfileForm(prev => ({ ...prev, photoURL: '' }));
      } else {
        setBusinessForm(prev => ({ ...prev, logo: '' }));
      }
      
      setSnackbar({
        open: true,
        message: 'File deleted successfully',
        severity: 'success'
      });
      
    } catch (err) {
      console.error('Error deleting file:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete file',
        severity: 'error'
      });
    } finally {
      setUploadingFile(false);
    }
  };
  
  const saveProfileSettings = async () => {
    if (!currentUser || !currentBusiness) return;
    
    try {
      setSaving(true);
      setError(null);
      
      // Update user profile in Firestore
      const userRef = doc(db, 'businesses', currentBusiness.id, 'users', currentUser.id);
      await updateDoc(userRef, {
        displayName: profileForm.displayName,
        photoURL: profileForm.photoURL,
        updatedAt: new Date()
      });
      
      setSnackbar({
        open: true,
        message: 'Profile settings saved successfully',
        severity: 'success'
      });
      
    } catch (err) {
      console.error('Error saving profile settings:', err);
      setError('Failed to save profile settings');
      setSnackbar({
        open: true,
        message: 'Failed to save profile settings',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };
  
  const saveBusinessSettings = async () => {
    if (!currentBusiness) return;
    
    try {
      setSaving(true);
      setError(null);
      
      // Update business in Firestore
      const businessRef = doc(db, 'businesses', currentBusiness.id);
      await updateDoc(businessRef, {
        name: businessForm.name,
        contactEmail: businessForm.contactEmail,
        contactPhone: businessForm.contactPhone,
        logo: businessForm.logo,
        address: businessForm.address,
        updatedAt: new Date()
      });
      
      setSnackbar({
        open: true,
        message: 'Business settings saved successfully',
        severity: 'success'
      });
      
    } catch (err) {
      console.error('Error saving business settings:', err);
      setError('Failed to save business settings');
      setSnackbar({
        open: true,
        message: 'Failed to save business settings',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };
  
  const saveNotificationSettings = async () => {
    if (!currentBusiness) return;
    
    try {
      setSaving(true);
      setError(null);
      
      // Update notification settings in Firestore
      const settingsRef = doc(db, 'businesses', currentBusiness.id, 'settings', 'notifications');
      await setDoc(settingsRef, {
        ...notificationSettings,
        updatedAt: new Date()
      });
      
      setSnackbar({
        open: true,
        message: 'Notification settings saved successfully',
        severity: 'success'
      });
      
    } catch (err) {
      console.error('Error saving notification settings:', err);
      setError('Failed to save notification settings');
      setSnackbar({
        open: true,
        message: 'Failed to save notification settings',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      
      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Profile" />
          <Tab label="Business" />
          <Tab label="Notifications" />
        </Tabs>
        
        {/* Profile Settings */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={4}>
            <Grid sx={{ width: { xs: '100%', md: '33.33%' }, padding: 1 }}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar
                  src={profileForm.photoURL}
                  alt={profileForm.displayName}
                  sx={{ width: 120, height: 120, mb: 2 }}
                />
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoCamera />}
                  sx={{ mb: 1 }}
                >
                  Upload Photo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'profile')}
                  />
                </Button>
                {uploadingFile && (
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <LinearProgress />
                  </Box>
                )}
              </Box>
            </Grid>
            
            <Grid sx={{ width: { xs: '100%', md: '66.67%' }, padding: 1 }}>
              <form>
                <TextField
                  fullWidth
                  label="Display Name"
                  name="displayName"
                  value={profileForm.displayName}
                  onChange={handleProfileFormChange}
                  margin="normal"
                />
                
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  value={profileForm.email || ''}
                  onChange={handleProfileFormChange}
                  margin="normal"
                  disabled
                  helperText="Email address cannot be changed"
                />
                
                <Box sx={{ mt: 3 }}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={saveProfileSettings}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={20} /> : undefined}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </form>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Business Settings */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={4}>
            <Grid sx={{ width: { xs: '100%', md: '33.33%' } }}>
              <Box display="flex" flexDirection="column" alignItems="center">
                {businessForm.logo ? (
                  <Box 
                    component="img"
                    src={businessForm.logo}
                    alt={businessForm.name}
                    sx={{ 
                      width: 180, 
                      height: 180, 
                      objectFit: 'contain',
                      mb: 2 
                    }}
                  />
                ) : (
                  <Avatar
                    sx={{ 
                      width: 180, 
                      height: 180, 
                      mb: 2,
                      fontSize: '3rem',
                      bgcolor: 'primary.main'
                    }}
                  >
                    {businessForm.name.charAt(0)}
                  </Avatar>
                )}
                
                <Box display="flex" alignItems="center" gap={1}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    disabled={uploadingFile}
                  >
                    Upload Logo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'business')}
                    />
                  </Button>
                  
                  {businessForm.logo && (
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeleteFile('business')}
                      disabled={uploadingFile}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
                {uploadingFile && <CircularProgress size={24} sx={{ mt: 1 }} />}
              </Box>
            </Grid>
            
            <Grid sx={{ width: { xs: '100%', md: '66.67%' } }}>
              <form>
                <TextField
                  fullWidth
                  label="Business Name"
                  name="name"
                  value={businessForm.name}
                  onChange={handleBusinessFormChange}
                  margin="normal"
                  required
                />
                
                <TextField
                  fullWidth
                  label="Contact Email"
                  name="contactEmail"
                  value={businessForm.contactEmail}
                  onChange={handleBusinessFormChange}
                  margin="normal"
                />
                
                <TextField
                  fullWidth
                  label="Contact Phone"
                  name="contactPhone"
                  value={businessForm.contactPhone}
                  onChange={handleBusinessFormChange}
                  margin="normal"
                />
                
                <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                  Business Address
                </Typography>
                
                <TextField
                  fullWidth
                  label="Street"
                  name="address.street"
                  value={businessForm.address?.street || ''}
                  onChange={handleBusinessFormChange}
                  margin="normal"
                />
                
                <Grid container spacing={2}>
                  <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <TextField
                      fullWidth
                      label="City"
                      name="address.city"
                      value={businessForm.address?.city || ''}
                      onChange={handleBusinessFormChange}
                      margin="normal"
                    />
                  </Grid>
                  <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <TextField
                      fullWidth
                      label="State/Province"
                      name="address.state"
                      value={businessForm.address?.state || ''}
                      onChange={handleBusinessFormChange}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
                
                <Grid container spacing={2}>
                  <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <TextField
                      fullWidth
                      label="Zip/Postal Code"
                      name="address.zipCode"
                      value={businessForm.address?.zipCode || ''}
                      onChange={handleBusinessFormChange}
                      margin="normal"
                    />
                  </Grid>
                  <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <TextField
                      fullWidth
                      label="Country"
                      name="address.country"
                      value={businessForm.address?.country || ''}
                      onChange={handleBusinessFormChange}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={saveBusinessSettings}
                  disabled={saving}
                  sx={{ mt: 2 }}
                >
                  Save Business Settings
                </Button>
                {saving && <CircularProgress size={24} sx={{ ml: 2 }} />}
              </form>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Notification Settings */}
        <TabPanel value={tabValue} index={2}>
          <Card sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Email Notifications
            </Typography>
            <Grid container spacing={2}>
              <Grid sx={{ width: '100%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.emailNotifications.orderUpdates}
                      onChange={(e) => handleNotificationChange('emailNotifications', 'orderUpdates', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Order Updates"
                />
                <Typography variant="body2" color="text.secondary">
                  Receive emails when order status changes
                </Typography>
              </Grid>
              
              <Grid sx={{ width: '100%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.emailNotifications.inventoryAlerts}
                      onChange={(e) => handleNotificationChange('emailNotifications', 'inventoryAlerts', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Inventory Alerts"
                />
                <Typography variant="body2" color="text.secondary">
                  Get notified when inventory levels are low
                </Typography>
              </Grid>
              
              <Grid sx={{ width: '100%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.emailNotifications.paymentReceipts}
                      onChange={(e) => handleNotificationChange('emailNotifications', 'paymentReceipts', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Payment Receipts"
                />
                <Typography variant="body2" color="text.secondary">
                  Receive receipts for payments processed
                </Typography>
              </Grid>
            </Grid>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={saveNotificationSettings}
              disabled={saving}
              sx={{ mt: 3 }}
            >
              Save Notification Settings
            </Button>
            {saving && <CircularProgress size={24} sx={{ ml: 2 }} />}
          </Card>
        </TabPanel>
      </Paper>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings; 