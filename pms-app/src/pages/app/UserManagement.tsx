import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Avatar,
  Tooltip,
  useTheme,
  SelectChangeEvent,
  Switch,
  FormControlLabel,
  Divider,
  FormGroup,
  FormLabel,
  Checkbox,
  Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useBusiness } from '../../contexts/BusinessContext';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/app/PageHeader';
import NoDataPlaceholder from '../../components/NoDataPlaceholder';
import PeopleIcon from '@mui/icons-material/People';
import { createUserWithEmailAndPassword, updatePassword, EmailAuthProvider, reauthenticateWithCredential, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, setDoc, collection, getDocs, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebaseConfig';
import { createBusinessUser } from '../../firebase/auth';

// Define Firebase Auth User type (simplified)
interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'officer';
  status: 'active' | 'inactive' | 'pending';
  lastActive?: string;
  avatarUrl?: string;
  department?: string;
  createdBy?: string | null;
  createdAt?: string;
  permissions: {
    canCreateAccounts: boolean;
    canCreateItems: boolean;
    canCreateInvoices: boolean;
    canCreatePOs: boolean;
    canEditItems: boolean;
    canDeleteItems: boolean;
    canApprove: boolean;
    requiresApproval: boolean;
  };
  businessId: string;
}

const DUMMY_USERS: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'admin',
    status: 'active',
    lastActive: '2023-06-01T12:30:45Z',
    department: 'Management',
    permissions: {
      canCreateAccounts: true,
      canCreateItems: true,
      canCreateInvoices: true,
      canCreatePOs: true,
      canEditItems: true,
      canDeleteItems: true,
      canApprove: true,
      requiresApproval: false
    },
    businessId: 'business1'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'manager',
    status: 'active',
    lastActive: '2023-06-02T09:15:30Z',
    department: 'Procurement',
    permissions: {
      canCreateAccounts: true, // Managers can create officer accounts
      canCreateItems: true,
      canCreateInvoices: true,
      canCreatePOs: true,
      canEditItems: true,
      canDeleteItems: true,
      canApprove: true,
      requiresApproval: false
    },
    businessId: 'business1'
  },
  {
    id: '3',
    name: 'Robert Johnson',
    email: 'robert.johnson@example.com',
    role: 'officer',
    status: 'inactive',
    lastActive: '2023-05-15T14:20:10Z',
    department: 'Finance',
    permissions: {
      canCreateAccounts: false,
      canCreateItems: true,
      canCreateInvoices: true,
      canCreatePOs: true,
      canEditItems: true,
      canDeleteItems: false,
      canApprove: false,
      requiresApproval: true
    },
    businessId: 'business1'
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    role: 'officer',
    status: 'pending',
    department: 'Operations',
    permissions: {
      canCreateAccounts: false,
      canCreateItems: true,
      canCreateInvoices: true,
      canCreatePOs: true,
      canEditItems: true,
      canDeleteItems: false,
      canApprove: false,
      requiresApproval: true
    },
    businessId: 'business1'
  }
];

const UserManagement: React.FC = () => {
  const theme = useTheme();
  const { currentBusiness } = useBusiness();
  const { currentUser } = useAuth() as { currentUser: FirebaseUser | null };
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'officer' as 'admin' | 'manager' | 'officer',
    department: '',
    permissions: {
      canCreateAccounts: false,
      canCreateItems: true,
      canCreateInvoices: true,
      canCreatePOs: true,
      canEditItems: true,
      canDeleteItems: false,
      canApprove: false,
      requiresApproval: true
    }
  });
  
  const [formErrors, setFormErrors] = useState({
    password: '',
    confirmPassword: '',
    email: ''
  });

  // Define loadUsers function first so it can be referenced in the useEffect hooks
    const loadUsers = async () => {
      try {
        setLoading(true);
      setError('');

      // Emergency fix for admin permissions
      await repairAdminPermissions();

      if (!currentBusiness?.id) {
        setError('No business ID found');
        setLoading(false);
        return;
      }

      // First get all users in the current business from the business/users subcollection
      const businessUsersRef = collection(db, 'businesses', currentBusiness.id, 'users');
      const businessUsersSnapshot = await getDocs(businessUsersRef);
      
      if (businessUsersSnapshot.empty) {
        console.log('No users found in business/users subcollection. Checking if current user is an admin...');
        
        // If collection is empty but this user is the business owner,
        // we need to add the current user to it as an admin (this fixes migration issues)
        if (currentUser && currentBusiness.ownerId === currentUser.uid) {
          console.log('Current user is the business owner. Creating admin entry...');
          
          // Admin permissions
          const adminPermissions = {
            canCreateAccounts: true,
            canCreateItems: true,
            canCreateInvoices: true,
            canCreatePOs: true,
            canEditItems: true,
            canDeleteItems: true,
            canApprove: true,
            requiresApproval: false
          };
          
          // Create admin entry for the current user
          await setDoc(doc(db, 'businesses', currentBusiness.id, 'users', currentUser.uid), {
            userId: currentUser.uid,
            role: 'admin',
            permissions: adminPermissions,
            createdAt: new Date().toISOString(),
            email: currentUser.email || '',
            name: currentUser.displayName || 'Business Admin'
          });
          
          console.log('Admin entry created for current user');
          
          // Reload the business users
          const reloadedSnapshot = await getDocs(businessUsersRef);
          
          if (reloadedSnapshot.empty) {
            console.log('Still no users found after creating admin entry. Using placeholder data.');
            setUsers([{
              id: currentUser.uid,
              name: currentUser.displayName || 'Business Admin',
              email: currentUser.email || '',
              role: 'admin',
              status: 'active',
              department: 'Management',
              permissions: adminPermissions,
              businessId: currentBusiness.id,
              createdAt: new Date().toISOString()
            }]);
            setLoading(false);
            return;
          }
          
          // Use the reloaded snapshot
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const user: User = {
              id: currentUser.uid,
              name: userData.name || currentUser.displayName || 'Business Admin',
              email: userData.email || currentUser.email || '',
              role: 'admin',
              status: 'active',
              lastActive: userData.lastActive || new Date().toISOString(),
              department: userData.department || 'Management',
              createdBy: null,
              createdAt: userData.createdAt || new Date().toISOString(),
              permissions: adminPermissions,
              businessId: currentBusiness.id
            };
            setUsers([user]);
          } else {
            // Create the user document if it doesn't exist
            const user: User = {
              id: currentUser.uid,
              name: currentUser.displayName || 'Business Admin',
              email: currentUser.email || '',
              role: 'admin',
              status: 'active',
              lastActive: new Date().toISOString(),
              department: 'Management',
              createdBy: null,
              createdAt: new Date().toISOString(),
              permissions: adminPermissions,
              businessId: currentBusiness.id
            };
            
            await setDoc(doc(db, 'users', currentUser.uid), {
              name: user.name,
              email: user.email,
              role: user.role,
              status: user.status,
              lastActive: user.lastActive,
              department: user.department,
              createdAt: user.createdAt,
              businessId: user.businessId
            });
            
            setUsers([user]);
          }
          setLoading(false);
          return;
        }
        
        setUsers([]);
        setLoading(false);
        return;
      }
      
      // Get the IDs of all users in this business
      const userIds = businessUsersSnapshot.docs.map(doc => doc.id);
      
      // Load the full user details from the users collection
      const fetchedUsers: User[] = [];
      
      for (const userId of userIds) {
        // Get user data from users collection
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        // Get specific business role and permissions for this user
        const businessUserDoc = businessUsersSnapshot.docs.find(doc => doc.id === userId);
        const businessUserData = businessUserDoc?.data();
        
        if (!businessUserData) {
          console.log(`No business user data found for user ${userId}`);
          continue;
        }
        
        // Merge data from both sources
        const userData = userDoc.exists() ? userDoc.data() : {};
        
        const user: User = {
          id: userId,
          name: businessUserData.name || userData.name || '',
          email: businessUserData.email || userData.email || '',
          role: businessUserData.role || 'officer',
          status: userData.status || 'active',
          lastActive: userData.lastActive,
          department: userData.department || '',
          createdBy: businessUserData.createdBy || userData.createdBy,
          createdAt: businessUserData.createdAt || userData.createdAt,
          // Use the permissions from the business/users subcollection as it's specific to this business
          permissions: businessUserData.permissions || {
            canCreateAccounts: businessUserData.role === 'admin' || businessUserData.role === 'manager',
            canCreateItems: true,
            canCreateInvoices: true,
            canCreatePOs: true,
            canEditItems: true,
            canDeleteItems: businessUserData.role !== 'officer',
            canApprove: businessUserData.role !== 'officer',
            requiresApproval: businessUserData.role === 'officer'
          },
          businessId: currentBusiness.id,
          avatarUrl: userData.avatarUrl
        };
        
        fetchedUsers.push(user);
      }
      
      console.log('Loaded users:', fetchedUsers);
      setUsers(fetchedUsers);
    } catch (error: any) {
      console.error("Error loading users:", error);
      setError(`Error loading users: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

  // Emergency fix for broken admin permissions - add this at top level
  useEffect(() => {
    const fixAdminPermissions = async () => {
      if (!currentUser || !currentBusiness) return;
      
      console.log("PERMISSION DEBUG - Current user:", currentUser);
      console.log("PERMISSION DEBUG - Current business:", currentBusiness);
      
      try {
        // Check if user is business owner
        const isOwner = currentBusiness.ownerId === currentUser.uid;
        console.log("PERMISSION DEBUG - Is owner:", isOwner);
        
        if (isOwner) {
          // Check if user exists in business/users collection
          const businessUserRef = doc(db, 'businesses', currentBusiness.id, 'users', currentUser.uid);
          const businessUserDoc = await getDoc(businessUserRef);
          
          if (!businessUserDoc.exists()) {
            console.log("PERMISSION DEBUG - User does not exist in business/users. Creating admin entry...");
            
            // Define admin permissions
            const adminPermissions = {
              canCreateAccounts: true,
              canCreateItems: true,
              canCreateInvoices: true,
              canCreatePOs: true,
              canEditItems: true,
              canDeleteItems: true,
              canApprove: true,
              requiresApproval: false
            };
            
            // Create admin entry for business owner
            await setDoc(businessUserRef, {
              userId: currentUser.uid,
              role: 'admin',
              permissions: adminPermissions,
              createdAt: new Date().toISOString(),
              email: currentUser.email || '',
              name: currentUser.displayName || 'Business Admin'
            });
            
            console.log("PERMISSION DEBUG - Admin entry created successfully");
            setSuccessMessage("Administrative access restored");
            
            // Also make sure user exists in main users collection
            const userRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
              console.log("PERMISSION DEBUG - Creating user document");
              await setDoc(userRef, {
                id: currentUser.uid,
                email: currentUser.email,
                name: currentUser.displayName || 'Business Admin',
                role: 'admin',
                businessId: currentBusiness.id,
                createdAt: new Date().toISOString()
              });
            }
            
            // Also ensure user/businesses association exists
            const userBusinessRef = doc(db, 'users', currentUser.uid, 'businesses', currentBusiness.id);
            const userBusinessDoc = await getDoc(userBusinessRef);
            
            if (!userBusinessDoc.exists()) {
              console.log("PERMISSION DEBUG - Creating user/businesses association");
              await setDoc(userBusinessRef, {
                businessId: currentBusiness.id,
                role: 'admin',
                createdAt: new Date().toISOString()
              });
            }
            
            // Force reload users
            loadUsers();
          } else {
            console.log("PERMISSION DEBUG - User exists in business/users:", businessUserDoc.data());
            
            // Make sure role and permissions are correct for owner
            const data = businessUserDoc.data();
            if (data.role !== 'admin') {
              console.log("PERMISSION DEBUG - Fixing owner's role to admin");
              
              const adminPermissions = {
                canCreateAccounts: true,
                canCreateItems: true,
                canCreateInvoices: true,
                canCreatePOs: true,
                canEditItems: true,
                canDeleteItems: true,
                canApprove: true,
                requiresApproval: false
              };
              
              await updateDoc(businessUserRef, {
                role: 'admin',
                permissions: adminPermissions
              });
              
              console.log("PERMISSION DEBUG - Owner's role fixed to admin");
              setSuccessMessage("Administrative access restored");
              
              // Force reload users
              loadUsers();
            }
          }
        }
      } catch (error) {
        console.error("PERMISSION DEBUG - Error fixing permissions:", error);
      }
    };
    
    fixAdminPermissions();
  }, [currentUser, currentBusiness]);

  useEffect(() => {
    if (currentBusiness) {
      loadUsers();
    }
  }, [currentBusiness]);

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        confirmPassword: '',
        role: user.role,
        department: user.department || '',
        permissions: user.permissions as {
          canCreateAccounts: boolean;
          canCreateItems: boolean;
          canCreateInvoices: boolean;
          canCreatePOs: boolean;
          canEditItems: boolean;
          canDeleteItems: boolean;
          canApprove: boolean;
          requiresApproval: boolean;
        }
      });
    } else {
      setSelectedUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'officer' as 'admin' | 'manager' | 'officer',
        department: '',
        permissions: {
          canCreateAccounts: false,
          canCreateItems: true,
          canCreateInvoices: true,
          canCreatePOs: true,
          canEditItems: true,
          canDeleteItems: false,
          canApprove: false,
          requiresApproval: true
        }
      });
    }
    setFormErrors({
      password: '',
      confirmPassword: '',
      email: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [name]: checked
      }
    }));
  };

  const handleRoleChange = (e: SelectChangeEvent<string>) => {
    const { value } = e.target;
    const role = value as 'admin' | 'manager' | 'officer';
    
    // Update permissions based on role - ensure all permissions are correctly set
    let permissions = {
      canCreateAccounts: false,
      canCreateItems: true,
      canCreateInvoices: true,
      canCreatePOs: true,
      canEditItems: true,
      canDeleteItems: false,
      canApprove: false,
      requiresApproval: false
    };
    
    // Set specific permissions based on role
    switch (role) {
      case 'admin':
        permissions = {
          canCreateAccounts: true,
          canCreateItems: true,
          canCreateInvoices: true,
          canCreatePOs: true,
          canEditItems: true,
          canDeleteItems: true,
          canApprove: true,
          requiresApproval: false
        };
        break;
      case 'manager':
        permissions = {
          canCreateAccounts: true,
          canCreateItems: true,
          canCreateInvoices: true,
          canCreatePOs: true,
          canEditItems: true,
          canDeleteItems: true,
          canApprove: true,
          requiresApproval: false
        };
        break;
      case 'officer':
        permissions = {
          canCreateAccounts: false,
          canCreateItems: true,
          canCreateInvoices: true,
          canCreatePOs: true,
          canEditItems: true,
          canDeleteItems: false,
          canApprove: false,
          requiresApproval: true
        };
        break;
    }
    
    setFormData(prev => ({
      ...prev,
      role,
      permissions
    }));
  };

  const handleSubmit = async () => {
    // Reset error messages
    setFormErrors({
      password: '',
      confirmPassword: '',
      email: ''
    });
    
    // Password validations for new user or when password is provided
    if (!selectedUser || (selectedUser && formData.password)) {
      // Validate password
      if (formData.password.length < 6) {
        setFormErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
        return;
      }
      
      // Confirm passwords match
      if (formData.password !== formData.confirmPassword) {
        setFormErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
        return;
      }
    }

    // Check if user has permission to create account with this role
    if (!selectedUser && currentUser) {
      // Find the currently logged-in user's data from our users array
      const currentUserData = users.find(u => u.id === currentUser.uid);
      
      // Check if the current user can create accounts
      if (currentUserData && !currentUserData.permissions.canCreateAccounts) {
        setError('You do not have permission to create user accounts.');
        return;
      }
      
      // Check if user can create this specific role
      if (currentUserData && currentUserData.role === 'manager' && formData.role === 'admin') {
        setError('Only administrators can create admin accounts.');
        return;
      }
    }
    
    try {
      // Show loading state
      setLoading(true);
    
    if (selectedUser) {
        // Update existing user in Firestore
        await updateDoc(doc(db, "users", selectedUser.id), {
          name: formData.name,
          email: formData.email,
          department: formData.department || '',
          updatedAt: new Date().toISOString()
        });
        
        // Also update the user in the business/users subcollection
        if (currentBusiness?.id) {
          await updateDoc(doc(db, "businesses", currentBusiness.id, "users", selectedUser.id), {
            role: formData.role as 'admin' | 'manager' | 'officer',
            permissions: formData.permissions,
            updatedAt: new Date().toISOString()
          });
        }
        
        // Update user password if provided
        if (formData.password) {
          // Note: Updating password directly from client isn't easy without the user
          // This typically requires a Cloud Function or Admin SDK, but we'll simulate it
          setSuccessMessage("Password update requested. In a production app, this would be handled securely.");
        }
        
        // Update local state
        const updatedUsers: User[] = users.map(user => 
        user.id === selectedUser.id 
          ? { 
              ...user, 
              name: formData.name,
              email: formData.email,
                role: formData.role as 'admin' | 'manager' | 'officer',
                department: formData.department,
                permissions: formData.permissions
              } as User
          : user
      );
      setUsers(updatedUsers);
        
        setSuccessMessage(`User ${formData.name} updated successfully.`);
        handleCloseDialog();
    } else {
        // Create new authenticated user
        try {
          // Check if email is already in use
          const signInMethods = await fetchSignInMethodsForEmail(auth, formData.email);
          if (signInMethods.length > 0) {
            setFormErrors(prev => ({ 
              ...prev, 
              email: 'This email is already associated with an account' 
            }));
            setLoading(false);
            return;
          }
          
          // Check if user already exists in Firestore
          const userSnapshot = await getDocs(collection(db, "users"));
          const emailExists = userSnapshot.docs.some(doc => 
            doc.data().email?.toLowerCase() === formData.email.toLowerCase()
          );
          
          if (emailExists) {
            setFormErrors(prev => ({ 
              ...prev, 
              email: 'This email is already associated with an account in this system' 
            }));
            setLoading(false);
            return;
          }
          
          // Get the current business ID 
          const businessId = currentBusiness?.id;
          
          if (!businessId) {
            throw new Error('No business ID found');
          }
          
          // Ensure permissions match the selected role
          const roleBasedPermissions = {
            canCreateAccounts: formData.role === 'admin' || formData.role === 'manager',
            canCreateItems: true,
            canCreateInvoices: true,
            canCreatePOs: true,
            canEditItems: true,
            canDeleteItems: formData.role !== 'officer',
            canApprove: formData.role !== 'officer',
            requiresApproval: formData.role === 'officer'
          };
          
          // For officers, explicitly ensure these permissions are set
          if (formData.role === 'officer') {
            console.log("Setting officer permissions explicitly to fix issues");
            roleBasedPermissions.canCreateItems = true;
            roleBasedPermissions.canCreateInvoices = true;
            roleBasedPermissions.canCreatePOs = true;
            roleBasedPermissions.canEditItems = true;
          }
          
          // User data to save with complete information needed for business associations
          const userData = {
        name: formData.name,
            role: formData.role as 'admin' | 'manager' | 'officer',
        status: 'active',  // Set status to active by default
            department: formData.department || '',
            createdBy: currentUser?.uid || null,
            permissions: roleBasedPermissions,
            businessId: businessId, // Important: set the businessId explicitly
            createdAt: new Date().toISOString()
          };
          
          console.log(`Creating user with business association to: ${businessId}`);
          
          try {
            // Create user using our enhanced function that creates all necessary business associations
            const createdUser = await createBusinessUser(
              formData.email, 
              formData.password, 
              userData
            );
            
            // Ensure all associations are properly created
            if (createdUser && createdUser.id) {
              // Double-check that businessId is set in the user document
              await setDoc(doc(db, "users", createdUser.id), {
                businessId: businessId
              }, { merge: true });
              
              // Ensure user exists in business/users collection
              const businessUserRef = doc(db, "businesses", businessId, "users", createdUser.id);
              const businessUserDoc = await getDoc(businessUserRef);
              
              if (!businessUserDoc.exists()) {
                await setDoc(businessUserRef, {
                  userId: createdUser.id,
                  name: formData.name,
                  email: formData.email,
                  role: formData.role,
                  permissions: roleBasedPermissions,
                  createdAt: new Date().toISOString(),
                  createdBy: currentUser?.uid || null
                });
                console.log(`Created user in business/users collection`);
              }
              
              // Ensure user has business in users/businesses collection
              const userBusinessRef = doc(db, "users", createdUser.id, "businesses", businessId);
              const userBusinessDoc = await getDoc(userBusinessRef);
              
              if (!userBusinessDoc.exists()) {
                await setDoc(userBusinessRef, {
                  businessId: businessId,
                  role: formData.role,
                  createdAt: new Date().toISOString()
                });
                console.log(`Created business association in user/businesses collection`);
              }
            }
            
            // Add to local state
            setUsers([...users, createdUser as User]);
            setSuccessMessage(`User ${formData.name} created successfully with full business access.`);
            handleCloseDialog();
          } catch (error: any) {
            console.error("Error creating user:", error);
            setError(`Failed to create user: ${error.message}`);
          }
        } catch (error: any) {
          console.error("Error creating user:", error);
          
          // Handle specific Firebase errors
          if (error.code === 'auth/email-already-in-use') {
            setFormErrors(prev => ({ 
              ...prev, 
              email: 'This email is already in use. Please use a different email address.' 
            }));
          } else {
            setError(`Failed to create user: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      console.error("Error managing user:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = (userId: string) => {
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        return {
          ...user,
          status: newStatus as 'active' | 'inactive' | 'pending'
        };
      }
      return user;
    });
    setUsers(updatedUsers);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        // Delete from Firestore
        await deleteDoc(doc(db, "users", userId));
        
        // Update local state
      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
        
        // Note: Deleting the actual Firebase Auth user requires Admin SDK
        alert("User data deleted. In a production app, the authentication record would also be deleted.");
      } catch (error: any) {
        console.error("Error deleting user:", error);
        alert(`Failed to delete user: ${error.message}`);
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return theme.palette.error.main;
      case 'manager':
        return theme.palette.warning.main;
      case 'officer':
        return theme.palette.primary.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Get active users that can be assigned as managers
  const potentialManagers = users.filter(user => 
    user.status === 'active' && 
    (user.role === 'admin' || user.role === 'manager')
  );

  // Function to close success message
  const handleCloseSuccessMessage = () => {
    setSuccessMessage('');
  };

  // Function to close error message
  const handleCloseError = () => {
    setError('');
  };

  // Add a self-repair function to fix admin permissions
  const repairAdminPermissions = async () => {
    try {
      if (!currentUser || !currentBusiness?.id) return;
      
      console.log("PERMISSION DEBUG - Checking admin permissions");
      
      // Check if user is business owner
      const isOwner = currentBusiness.ownerId === currentUser.uid;
      if (!isOwner) return;
      
      // Check if user exists in business/users collection
      const businessUserRef = doc(db, 'businesses', currentBusiness.id, 'users', currentUser.uid);
      const businessUserDoc = await getDoc(businessUserRef);
      
      const adminPermissions = {
        canCreateAccounts: true,
        canCreateItems: true,
        canCreateInvoices: true,
        canCreatePOs: true,
        canEditItems: true,
        canDeleteItems: true,
        canApprove: true,
        requiresApproval: false
      };
      
      if (!businessUserDoc.exists()) {
        console.log("PERMISSION DEBUG - Creating missing admin entry for business owner");
        
        // Create admin entry for business owner
        await setDoc(businessUserRef, {
          userId: currentUser.uid,
          role: 'admin',
          permissions: adminPermissions,
          createdAt: new Date().toISOString(),
          email: currentUser.email || '',
          name: currentUser.displayName || 'Business Admin'
        });
        
        setSuccessMessage("Administrative access granted");
        
        // Also make sure user exists in main users collection
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            id: currentUser.uid,
            email: currentUser.email,
            role: 'admin',
            name: currentUser.displayName || 'Business Admin',
            businessId: currentBusiness.id,
            createdAt: new Date().toISOString()
          });
        }
        
        // Also ensure user/businesses association exists
        const userBusinessRef = doc(db, 'users', currentUser.uid, 'businesses', currentBusiness.id);
        const userBusinessDoc = await getDoc(userBusinessRef);
        
        if (!userBusinessDoc.exists()) {
          await setDoc(userBusinessRef, {
            businessId: currentBusiness.id,
            role: 'admin',
            createdAt: new Date().toISOString()
          });
        }
      } else {
        // Check if permissions are correct
        const data = businessUserDoc.data();
        if (data.role !== 'admin') {
          console.log("PERMISSION DEBUG - Fixing incorrect role for business owner");
          await updateDoc(businessUserRef, {
            role: 'admin',
            permissions: adminPermissions
          });
          setSuccessMessage("Administrative access restored");
        }
      }
    } catch (error) {
      console.error("Error repairing admin permissions:", error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader 
        title="User Management"
        subtitle="Manage users and their permissions"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add User
          </Button>
        }
      />

      {/* Success Message Alert */}
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000} 
        onClose={handleCloseSuccessMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccessMessage} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
      
      {/* Error Message Alert */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {users.length === 0 ? (
        <NoDataPlaceholder
          title="No Users Found"
          message="There are no users in this business yet. Add users to collaborate."
          icon={<PeopleIcon sx={{ fontSize: 60 }} />}
          actionText="Add User"
          onAction={() => handleOpenDialog()}
        />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Last Active</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => {
                const createdByUser = user.createdBy ? users.find(u => u.id === user.createdBy) : null;
                return (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        src={user.avatarUrl} 
                        alt={user.name}
                        sx={{ mr: 2 }}
                      >
                        {user.name.charAt(0)}
                      </Avatar>
                      <Typography>{user.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role.toUpperCase()}
                      size="small"
                      sx={{ 
                        bgcolor: getRoleColor(user.role) + '20',
                        color: getRoleColor(user.role),
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                  <TableCell>{user.department || '—'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.status.toUpperCase()}
                      size="small"
                      color={getStatusColor(user.status) as 'success' | 'error' | 'warning' | 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {createdByUser ? (
                      <Tooltip title={`Created by ${createdByUser.name}`}>
                        <Chip
                          label={createdByUser.name}
                          size="small"
                          color="info"
                        />
                      </Tooltip>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {user.lastActive 
                      ? new Date(user.lastActive).toLocaleDateString()
                      : '—'
                    }
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleOpenDialog(user)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={user.status === 'active' ? 'Deactivate' : 'Activate'}>
                        <IconButton onClick={() => handleToggleStatus(user.id)}>
                          {user.status === 'active' ? <BlockIcon /> : <CheckCircleIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          onClick={() => handleDeleteUser(user.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleFormChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
            />
            <TextField
              margin="normal"
              required={!selectedUser}
              fullWidth
              id="password"
              label={selectedUser ? "New Password (leave blank to keep unchanged)" : "Password"}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleFormChange}
              error={!!formErrors.password}
              helperText={formErrors.password}
            />
            <TextField
              margin="normal"
              required={!selectedUser || !!formData.password}
              fullWidth
              id="confirmPassword"
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleFormChange}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={formData.role}
                label="Role"
                onChange={handleRoleChange}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="officer">Officer</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin="normal"
              fullWidth
              id="department"
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleFormChange}
            />
            <FormControlLabel
              control={<Switch checked={false} name="isSubAccount" />}
              label="This is a sub-account for procurement staff"
              sx={{ display: 'none' }}
            />
            
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Role Permissions
            </Typography>
            
            <FormControl component="fieldset" sx={{ mt: 2 }}>
              <FormLabel component="legend">User Capabilities</FormLabel>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
                {formData.role === 'admin' 
                  ? 'Administrators have full system access and can create all account types.'
                  : formData.role === 'manager'
                  ? 'Managers can manage officers and have approval rights.'
                  : 'Officers can create items, invoices, and purchase orders.'}
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={formData.permissions.canCreateAccounts}
                      onChange={handleCheckboxChange}
                      name="canCreateAccounts"
                      disabled={formData.role === 'officer'}
                    />
                  }
                  label="Can create user accounts"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={formData.permissions.canCreateItems}
                      onChange={handleCheckboxChange}
                      name="canCreateItems"
                    />
                  }
                  label="Can create items"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={formData.permissions.canCreateInvoices}
                      onChange={handleCheckboxChange}
                      name="canCreateInvoices"
                    />
                  }
                  label="Can create invoices"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={formData.permissions.canCreatePOs}
                      onChange={handleCheckboxChange}
                      name="canCreatePOs"
                    />
                  }
                  label="Can create purchase orders"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={formData.permissions.canApprove}
                      onChange={handleCheckboxChange}
                      name="canApprove"
                      disabled={formData.role === 'officer'}
                    />
                  }
                  label="Can approve requests"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={formData.permissions.requiresApproval}
                      onChange={handleCheckboxChange}
                      name="requiresApproval"
                      disabled={formData.role !== 'officer'}
                    />
                  }
                  label="Requires approval for actions"
                />
              </FormGroup>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedUser ? 'Save Changes' : 'Add User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 