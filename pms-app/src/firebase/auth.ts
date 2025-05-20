import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  User,
  getAuth,
  connectAuthEmulator 
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

// Sign up with email and password
export const registerUser = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Send email verification
    if (userCredential.user) {
      await sendEmailVerification(userCredential.user);
    }
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Sign in with email and password
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Sign out
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    throw error;
  }
};

// Create a business account
export const createBusinessAccount = async (
  userId: string,
  businessName: string,
  businessData: any
): Promise<string> => {
  try {
    // Validate userId more strictly
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error('Invalid user ID provided:', userId);
      throw new Error('A valid user ID is required to create a business');
    }

    console.log('Creating business account with userId:', userId);
    
    // Generate a unique business ID
    const businessId = crypto.randomUUID();
    
    // Create a simplified business document with essential fields
    const businessDoc = {
      id: businessId,
      name: businessName,
      ownerId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Creating business with data:', businessDoc);
    
    // Create the business document
    await setDoc(doc(db, 'businesses', businessId), businessDoc);
    console.log('Business document created');
    
    // Associate user with business in the user's subcollection
    await setDoc(doc(db, 'users', userId, 'businesses', businessId), {
      businessId,
      role: 'admin', // Changed from 'owner' to 'admin' to match role system
      createdAt: new Date().toISOString()
    });
    console.log('User-business association created in user document');
    
    // CRITICAL FIX: Also add the user to the business/users subcollection as an admin
    // This is needed for the security rules to recognize the user as an admin
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
    
    await setDoc(doc(db, 'businesses', businessId, 'users', userId), {
      userId: userId,
      role: 'admin',
      permissions: adminPermissions,
      createdAt: new Date().toISOString(),
      email: auth.currentUser?.email || '',
      name: businessData.ownerName || auth.currentUser?.displayName || 'Business Owner'
    });
    console.log('User added to business/users collection as admin');
    
    // Update user profile with business ID
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: businessId
      });
      console.log('User profile updated with business ID');
    } else {
      console.warn('No current user to update profile');
    }
    
    // CRITICAL FIX: Also update the user document with the businessId field
    await setDoc(doc(db, 'users', userId), {
      businessId: businessId,
      role: 'admin'
    }, { merge: true });
    console.log('User document updated with businessId field');
    
    console.log('Business created successfully:', businessId);
    return businessId;
  } catch (error: any) {
    console.error('Error creating business account:', error);
    // Add more specific error handling
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. The current security rules do not allow this operation.');
    }
    throw error;
  }
};

// Reset password
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Check if user belongs to a business
export const getUserBusiness = async (userId: string) => {
  try {
    const businessesRef = doc(db, 'businesses', auth.currentUser?.displayName || '');
    const businessDoc = await getDoc(businessesRef);
    
    if (businessDoc.exists()) {
      return businessDoc.data();
    }
    
    return null;
  } catch (error) {
    throw error;
  }
};

// Create a business user (staff member) without signing in as them
export const createBusinessUser = async (
  email: string, 
  password: string, 
  userData: any
) => {
  try {
    // Store current auth state
    const currentAuthUser = auth.currentUser;
    let newUserUid: string;
    
    // Create a new auth instance that won't affect the current one
    const tempAuth = getAuth();
    
    try {
      // Create the user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
      const newUser = userCredential.user;
      newUserUid = newUser.uid;
      
      // Sign out the new user from the temporary auth instance
      await tempAuth.signOut();
      
      // Create the user document in Firestore with businessId
      await setDoc(doc(db, "users", newUserUid), {
        ...userData,
        id: newUserUid,
        email: email,
        createdAt: new Date().toISOString(),
        businessId: userData.businessId // Ensure businessId is set in main user document
      });
      
      console.log(`User document created with ID: ${newUserUid} and businessId: ${userData.businessId}`);
      
      // Link user to the business for role-based access control
      // This is crucial for permissions to work correctly
      if (userData.businessId) {
        // Create entry in business/users collection
        await setDoc(doc(db, "businesses", userData.businessId, "users", newUserUid), {
          userId: newUserUid,
          name: userData.name,
          email: email,
          role: userData.role,
          permissions: userData.permissions,
          createdAt: new Date().toISOString(),
          createdBy: userData.createdBy || null
        });
        
        console.log(`User added to business/users collection: ${userData.businessId}/users/${newUserUid}`);
        
        // Also create an entry in the user's businesses subcollection
        await setDoc(doc(db, "users", newUserUid, "businesses", userData.businessId), {
          businessId: userData.businessId,
          role: userData.role,
          createdAt: new Date().toISOString()
        });
        
        console.log(`Business association created: users/${newUserUid}/businesses/${userData.businessId}`);
      } else {
        console.warn("No businessId provided - user will not have business associations");
      }
      
      return {
        id: newUserUid,
        email,
        ...userData
      };
    } catch (error) {
      console.error('Error creating business user:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in createBusinessUser:', error);
    throw error;
  }
}; 