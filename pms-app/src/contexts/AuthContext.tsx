import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser, updateProfile, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  createBusinessAccount,
  resetPassword as resetPasswordService 
} from '../firebase/auth';
import { AuthContextType, User, UserRole, Permission } from '../types';

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  isAdmin: false,
  login: async () => ({ id: '', email: '', displayName: '', role: 'staff', permissions: [], createdAt: new Date().toISOString() }),
  register: async () => ({ id: '', email: '', displayName: '', role: 'staff', permissions: [], createdAt: new Date().toISOString() }),
  logout: async () => false,
  createBusiness: async () => '',
  resetPassword: async () => false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Format Firebase user to our User type and ensure businessId is correctly set
  const formatUser = async (firebaseUser: any): Promise<User> => {
    try {
      // Get user role and permissions
      let role: UserRole = 'officer'; // Default to officer instead of owner as a safer default
      let permissions: Permission[] = [];
      let businessId = null;
      let detailedPermissions = null;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Handle role with fallback to legacy role system
          role = (userData.role as UserRole) || 'officer';
          console.log(`User document role: ${role}`);
          
          // Extract business ID from user document if available
          businessId = userData.businessId || firebaseUser.displayName || null;
          
          // If we still don't have a businessId, check the user's businesses subcollection
          if (!businessId) {
            console.log("Checking user's businesses subcollection for businessId");
            const userBusinessesRef = collection(db, 'users', firebaseUser.uid, 'businesses');
            const userBusinessesSnapshot = await getDocs(userBusinessesRef);
            
            if (!userBusinessesSnapshot.empty) {
              // Get the first business from the collection
              const firstBusinessDoc = userBusinessesSnapshot.docs[0];
              businessId = firstBusinessDoc.id;
              console.log("Found businessId in user's businesses collection:", businessId);
              
              // Get role from the businesses subcollection if not already set
              if (firstBusinessDoc.data().role) {
                role = firstBusinessDoc.data().role;
                console.log(`Updated role from businesses subcollection: ${role}`);
              }
              
              // Auto-repair: Update the main user document with businessId
              if (businessId) {
                console.log(`Auto-repairing user document with businessId: ${businessId}`);
                await setDoc(doc(db, 'users', firebaseUser.uid), {
                  businessId: businessId
                }, { merge: true });
              }
              
              // Check if this user is in the business/users collection
              if (businessId) {
                const businessUserRef = doc(db, 'businesses', businessId, 'users', firebaseUser.uid);
                const businessUserDoc = await getDoc(businessUserRef);
                
                if (businessUserDoc.exists()) {
                  // Use role from business/users if available
                  const businessUserData = businessUserDoc.data();
                  if (businessUserData.role) {
                    role = businessUserData.role;
                    console.log(`Using role from business/users collection: ${role}`);
                  }
                  
                  // Extract detailed permissions
                  if (businessUserData.permissions) {
                    detailedPermissions = businessUserData.permissions;
                    console.log("Found detailed permissions:", detailedPermissions);
                  }
                } else {
                  console.log("User is not in business/users collection. Fixing...");
                  // Create default permissions based on role
                  const rolePermissions = {
                    canCreateAccounts: role === 'admin' || role === 'manager',
                    canCreateItems: true,
                    canCreateInvoices: true,
                    canCreatePOs: true,
                    canEditItems: true,
                    canDeleteItems: role !== 'officer',
                    canApprove: role !== 'officer',
                    requiresApproval: role === 'officer'
                  };
                  
                  // Add user to business/users collection
                  await setDoc(businessUserRef, {
                    userId: firebaseUser.uid,
                    role: role,
                    permissions: rolePermissions, 
                    createdAt: new Date().toISOString(),
                    email: firebaseUser.email || '',
                    name: userData.name || firebaseUser.displayName || 'User'
                  });
                  console.log("Fixed user association with business");
                  
                  // Use the permissions we just created
                  detailedPermissions = rolePermissions;
                }
              }
            }
          } else {
            console.log(`Found businessId in user document: ${businessId}`);
            
            // Auto-repair: Check if the user is in the business/users collection
            if (businessId) {
              const businessUserRef = doc(db, 'businesses', businessId, 'users', firebaseUser.uid);
              const businessUserDoc = await getDoc(businessUserRef);
              
              if (!businessUserDoc.exists()) {
                console.log("User not found in business/users collection. Creating entry...");
                
                // Create default permissions based on role
                const rolePermissions = {
                  canCreateAccounts: role === 'admin' || role === 'manager',
                  canCreateItems: true,
                  canCreateInvoices: true,
                  canCreatePOs: true,
                  canEditItems: true,
                  canDeleteItems: role !== 'officer',
                  canApprove: role !== 'officer',
                  requiresApproval: role === 'officer'
                };
                
                // Add user to business/users collection
                await setDoc(businessUserRef, {
                  userId: firebaseUser.uid,
                  role: role,
                  permissions: rolePermissions,
                  createdAt: new Date().toISOString(),
                  email: firebaseUser.email || '',
                  name: userData.name || firebaseUser.displayName || 'User'
                });
                console.log("Created user in business/users collection");
                
                // Use the permissions we just created
                detailedPermissions = rolePermissions;
              } else {
                // Use role and permissions from business/users if available
                const businessUserData = businessUserDoc.data();
                if (businessUserData.role) {
                  role = businessUserData.role;
                  console.log(`Updated role from business/users collection: ${role}`);
                }
                
                if (businessUserData.permissions) {
                  detailedPermissions = businessUserData.permissions;
                  console.log("Found detailed permissions:", detailedPermissions);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user role and permissions:', error);
        // Default permissions if there's an error
        permissions = ['manage_inventory', 'create_purchase_orders', 'create_invoices'];
      }
      
      // Convert detailed permissions to array format
      if (detailedPermissions) {
        permissions = Object.entries(detailedPermissions)
          .filter(([_, value]) => value === true)
          .map(([key]) => key as Permission);
      } else {
        // Set basic permissions based on role
        if (role === 'admin') {
          permissions = ['create_users', 'edit_users', 'view_users', 'delete_users', 'approve_purchase_orders', 'manage_inventory', 'create_purchase_orders', 'create_invoices'];
        } else if (role === 'manager') {
          permissions = ['create_users', 'view_users', 'approve_purchase_orders', 'manage_inventory', 'create_purchase_orders', 'create_invoices'];
        } else {
          // For officers - ensure they get basic permissions
          permissions = ['manage_inventory', 'create_purchase_orders', 'create_invoices'];
        }
      }
      
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || '',
        role,
        permissions,
        businessId,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error formatting user:', error);
      // Return minimal user data in case of error
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || '',
        role: 'officer',
        permissions: [],
        createdAt: new Date().toISOString()
      };
    }
  };

  // Register handler
  const register = async (email: string, password: string): Promise<User> => {
    try {
      const firebaseUser = await registerUser(email, password);
      const user = await formatUser(firebaseUser);
      setCurrentUser(user);
      return user;
    } catch (error) {
      throw error;
    }
  };

  // Login handler
  const login = async (email: string, password: string): Promise<User> => {
    try {
      const firebaseUser = await loginUser(email, password);
      const user = await formatUser(firebaseUser);
      setCurrentUser(user);
      
      // Wait a brief moment to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return user;
    } catch (error) {
      throw error;
    }
  };

  // Logout handler
  const logout = async (): Promise<boolean> => {
    try {
      await logoutUser();
      setCurrentUser(null);
      return true;
    } catch (error) {
      throw error;
    }
  };

  // Create business handler
  const createBusiness = async (businessName: string, businessData: any): Promise<string> => {
    console.log("AuthContext: Creating business with name:", businessName);
    console.log("AuthContext: Current user:", currentUser);
    
    if (!currentUser) {
      console.error("AuthContext: No current user");
      throw new Error("You must be logged in to create a business.");
    }
    
    try {
      // Explicitly provide the ownerId to avoid undefined errors
      const uid = currentUser.id;
      
      if (!uid) {
        console.error("AuthContext: User ID is missing");
        throw new Error("User ID is missing. Please log in again.");
      }
      
      // Create enhanced business data with explicit ownerId
      const enhancedBusinessData = {
        ...businessData,
        ownerId: uid
      };
      
      console.log("AuthContext: Creating business with data:", enhancedBusinessData);
      
      // Create the business
      const businessId = await createBusinessAccount(uid, businessName, enhancedBusinessData);
      console.log("AuthContext: Business created with ID:", businessId);
      
      // Update the current user with the new business info
      if (auth.currentUser) {
        // Force refresh the user to get the updated profile
        await auth.currentUser.reload();
        
        // Check if displayName was properly updated
        if (auth.currentUser.displayName !== businessId) {
          console.log("AuthContext: Manual update of displayName required");
          try {
            // Try to update the profile again
            await updateProfile(auth.currentUser, {
              displayName: businessId
            });
            console.log("AuthContext: User profile displayName updated to:", businessId);
          } catch (profileError) {
            console.error("AuthContext: Error updating profile:", profileError);
          }
        }
        
        // Force update the currentUser object even if Firebase Auth profile update failed
        const updatedUser = await formatUser(auth.currentUser);
        
        // Explicitly set the businessId
        updatedUser.businessId = businessId;
        
        console.log("AuthContext: Updated user object:", updatedUser);
        setCurrentUser(updatedUser);
        
        // Add a small delay to ensure state changes propagate
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Return the business ID
      return businessId;
    } catch (error: any) {
      console.error("AuthContext: Error creating business:", error);
      throw error;
    }
  };

  // Reset password handler
  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      return await resetPasswordService(email);
    } catch (error) {
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? `User: ${firebaseUser.email}` : 'No user');
      
      if (firebaseUser) {
        try {
          const user = await formatUser(firebaseUser);
          console.log('User formatted:', user);
          setCurrentUser(user);
          setIsAdmin(user.role === 'admin');
        } catch (error) {
          console.error('Error formatting user:', error);
          // Even on error, update loading state
          setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => {
      console.log('Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    createBusiness,
    resetPassword,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 