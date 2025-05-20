import { collection, getDocs, query, orderBy, limit, where, getDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

/**
 * Utility functions for loading data from Firestore with consistency handling of businessId
 */

// Cache storage for performance improvements
const dataCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_EXPIRY_MS = 30000; // 30 seconds cache expiry

/**
 * Gets the business ID from various possible sources
 * @param user Current user object
 * @param business Current business object 
 * @returns The business ID or null if not found
 */
export const getBusinessId = async (user: any, business: any): Promise<string | null> => {
  // Try sources in order of reliability
  if (business?.id) {
    return business.id;
  }
  
  if (user?.businessId) {
    return user.businessId;
  }
  
  if (user?.id) {
    // Try to find from user's businesses subcollection
    try {
      const userBusinessesRef = collection(db, 'users', user.id, 'businesses');
      const snapshot = await getDocs(userBusinessesRef);
      
      if (!snapshot.empty) {
        // Return the first business ID found
        return snapshot.docs[0].id;
      }
    } catch (error) {
      console.error('Error getting business ID from user businesses:', error);
    }
  }
  
  return null;
};

/**
 * Generic function to load data with caching
 * @param businessId The business ID
 * @param collectionName The collection name
 * @param orderByField Field to order by (optional)
 * @param orderDirection Order direction (optional)
 * @returns Array of documents
 */
const loadCollectionData = async (
  businessId: string | null, 
  collectionName: string,
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'asc',
  userId?: string
) => {
  if (!businessId) {
    console.error(`No business ID provided to load ${collectionName}`);
    return [];
  }
  
  // Check cache first
  const cacheKey = `${businessId}:${collectionName}`;
  const cached = dataCache[cacheKey];
  const now = Date.now();
  
  if (cached && (now - cached.timestamp < CACHE_EXPIRY_MS)) {
    console.log(`Using cached ${collectionName} data`);
    return cached.data;
  }
  
  try {
    console.log(`Loading ${collectionName} from Firestore for business ${businessId}`);
    
    // If userId is provided, check permission first (helps with debugging)
    if (userId) {
      await checkPermission(userId, businessId, collectionName);
    }
    
    const collectionRef = collection(db, 'businesses', businessId, collectionName);
    
    let q;
    if (orderByField) {
      q = query(collectionRef, orderBy(orderByField, orderDirection));
    } else {
      q = collectionRef;
    }
    
    try {
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        console.log(`Loaded ${snapshot.docs.length} ${collectionName} items`);
      } else {
        console.log(`No ${collectionName} items found`);
      }
      
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Update cache
      dataCache[cacheKey] = { data, timestamp: now };
      
      return data;
    } catch (innerError: any) {
      // This is likely a permissions error
      console.error(`Error querying ${collectionName} collection:`, innerError);
      throw new Error(`Permission denied while accessing ${collectionName}: ${innerError.message}`);
    }
  } catch (error) {
    console.error(`Error loading ${collectionName}:`, error);
    throw error; // Rethrow to make the error visible to caller
  }
};

/**
 * Loads inventory items for a business
 * @param businessId The business ID
 * @param userId Optional user ID to check permissions
 * @returns Array of inventory items
 */
export const loadInventoryItems = async (businessId: string | null, userId?: string) => {
  return loadCollectionData(businessId, 'inventoryItems', 'name', 'asc', userId);
};

/**
 * Loads suppliers for a business
 * @param businessId The business ID
 * @param userId Optional user ID to check permissions
 * @returns Array of suppliers
 */
export const loadSuppliers = async (businessId: string | null, userId?: string) => {
  return loadCollectionData(businessId, 'suppliers', 'name', 'asc', userId);
};

/**
 * Loads invoices for a business
 * @param businessId The business ID
 * @param userId Optional user ID to check permissions
 * @returns Array of invoices
 */
export const loadInvoices = async (businessId: string | null, userId?: string) => {
  return loadCollectionData(businessId, 'invoices', 'date', 'desc', userId);
};

/**
 * Loads purchase orders for a business
 * @param businessId The business ID
 * @param userId Optional user ID to check permissions
 * @returns Array of purchase orders
 */
export const loadPurchaseOrders = async (businessId: string | null, userId?: string) => {
  return loadCollectionData(businessId, 'purchaseOrders', 'createdAt', 'desc', userId);
};

/**
 * Clears the cache for a specific collection or all collections
 * @param businessId The business ID
 * @param collectionName Optional collection name to clear specific cache
 */
export const clearCache = (businessId: string | null, collectionName?: string) => {
  if (!businessId) return;
  
  if (collectionName) {
    const cacheKey = `${businessId}:${collectionName}`;
    delete dataCache[cacheKey];
    console.log(`Cleared cache for ${collectionName}`);
  } else {
    // Clear all cache for this business
    Object.keys(dataCache).forEach(key => {
      if (key.startsWith(`${businessId}:`)) {
        delete dataCache[key];
      }
    });
    console.log(`Cleared all cache for business ${businessId}`);
  }
};

/**
 * Verifies that a user has access to a business by checking various collections
 * and fixing missing connections if needed
 */
export const verifyBusinessAccess = async (userId: string, businessId: string) => {
  if (!userId || !businessId) return false;
  
  try {
    console.log(`Verifying business access for user ${userId} to business ${businessId}`);
    
    // Check if user is the business owner
    const businessDoc = await getDoc(doc(db, 'businesses', businessId));
    if (!businessDoc.exists()) {
      console.error(`Business ${businessId} does not exist`);
      return false;
    }
    
    if (businessDoc.exists() && businessDoc.data().ownerId === userId) {
      console.log(`User ${userId} is the owner of business ${businessId}`);
      
      // Ensure the owner is also in business/users collection for consistent access
      const businessUserRef = doc(db, 'businesses', businessId, 'users', userId);
      const businessUserDoc = await getDoc(businessUserRef);
      
      if (!businessUserDoc.exists()) {
        console.log(`Business owner not found in business/users collection. Adding record...`);
        await setDoc(businessUserRef, {
          userId,
          role: 'admin',
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
          email: (await getDoc(doc(db, 'users', userId))).data()?.email || '',
          name: (await getDoc(doc(db, 'users', userId))).data()?.name || 'Business Owner',
          createdAt: new Date().toISOString()
        });
        console.log(`Added business owner to business/users collection`);
      }
      
      // Also ensure user has the business in their subcollection
      const userBusinessRef = doc(db, 'users', userId, 'businesses', businessId);
      const userBusinessDoc = await getDoc(userBusinessRef);
      
      if (!userBusinessDoc.exists()) {
        console.log(`Business not found in user's businesses subcollection. Adding record...`);
        await setDoc(userBusinessRef, {
          businessId: businessId,
          role: 'admin',
          createdAt: new Date().toISOString()
        });
        console.log(`Added business to user's businesses subcollection`);
      }
      
      // Also ensure user document has businessId
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists() && !userDoc.data().businessId) {
        console.log(`User document missing businessId. Adding...`);
        await setDoc(userRef, {
          businessId: businessId
        }, { merge: true });
        console.log(`Added businessId to user document`);
      }
      
      return true;
    }
    
    // Check if user is in business/users collection
    const businessUserRef = doc(db, 'businesses', businessId, 'users', userId);
    const businessUserDoc = await getDoc(businessUserRef);
    
    // If user exists in business/users collection, ensure other associations
    if (businessUserDoc.exists()) {
      console.log(`User ${userId} found in business/users collection`);
      
      // Auto-repair: Ensure user also has business in their subcollection
      const userBusinessRef = doc(db, 'users', userId, 'businesses', businessId);
      const userBusinessDoc = await getDoc(userBusinessRef);
      
      if (!userBusinessDoc.exists()) {
        console.log(`Business association missing in user's subcollection. Repairing...`);
        const role = businessUserDoc.data().role || 'officer';
        await setDoc(userBusinessRef, {
          businessId: businessId,
          role: role,
          createdAt: businessUserDoc.data().createdAt || new Date().toISOString()
        });
        console.log(`Added missing user/businesses association`);
      }
      
      // Auto-repair: Ensure user's main document has businessId
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists() && !userDoc.data().businessId) {
        console.log(`User document missing businessId. Adding...`);
        await setDoc(userRef, {
          businessId: businessId
        }, { merge: true });
        console.log(`Added businessId to user document`);
      }
      
      return true;
    }
    
    // If user doesn't exist in business/users collection, check if they should have access
    if (!businessUserDoc.exists()) {
      console.log(`User ${userId} not found in business/users collection, checking user's businesses`);
      
      // Check user's businesses subcollection
      const userBusinessRef = doc(db, 'users', userId, 'businesses', businessId);
      const userBusinessDoc = await getDoc(userBusinessRef);
      
      if (userBusinessDoc.exists()) {
        console.log(`User ${userId} found in user's businesses subcollection, repairing business/users record`);
        
        // User should have access - fix the business/users record
        const userData = userBusinessDoc.data();
        const role = userData.role || 'officer';
        
        // Create default permissions based on role
        const permissions = {
          canCreateAccounts: role !== 'officer',
          canCreateItems: true,
          canCreateInvoices: true,
          canCreatePOs: true,
          canEditItems: true,
          canDeleteItems: role !== 'officer',
          canApprove: role !== 'officer',
          requiresApproval: role === 'officer'
        };
        
        // Get user details
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userEmail = userDoc.exists() ? userDoc.data().email : '';
        const userName = userDoc.exists() ? userDoc.data().name : '';
        
        // Create the missing business/users record
        await setDoc(businessUserRef, {
          userId,
          role,
          permissions,
          email: userEmail,
          name: userName,
          createdAt: userData.createdAt || new Date().toISOString()
        });
        
        // Also ensure user document has businessId
        if (userDoc.exists() && !userDoc.data().businessId) {
          console.log(`User document missing businessId. Adding...`);
          await setDoc(doc(db, 'users', userId), {
            businessId: businessId
          }, { merge: true });
          console.log(`Added businessId to user document`);
        }
        
        console.log('Fixed business access for user', userId, 'in business', businessId);
        return true;
      } else {
        console.log(`User ${userId} not found in user's businesses subcollection. Attempting auto-repair...`);
        
        // Get user details
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Check if user has a role saved in their main document
          if (userData.role) {
            console.log(`Found user role in main document: ${userData.role}`);
            
            // Auto-repair: Create both associations
            
            // 1. Add to user/businesses subcollection
            await setDoc(doc(db, 'users', userId, 'businesses', businessId), {
              businessId: businessId,
              role: userData.role,
              createdAt: new Date().toISOString()
            });
            
            // 2. Add to business/users subcollection
            const permissions = {
              canCreateAccounts: userData.role !== 'officer',
              canCreateItems: true,
              canCreateInvoices: true,
              canCreatePOs: true,
              canEditItems: true,
              canDeleteItems: userData.role !== 'officer',
              canApprove: userData.role !== 'officer',
              requiresApproval: userData.role === 'officer'
            };
            
            await setDoc(doc(db, 'businesses', businessId, 'users', userId), {
              userId: userId,
              role: userData.role,
              permissions: permissions,
              email: userData.email || '',
              name: userData.name || '',
              createdAt: new Date().toISOString()
            });
            
            // 3. Make sure user document has businessId
            if (!userData.businessId) {
              await setDoc(userRef, {
                businessId: businessId
              }, { merge: true });
            }
            
            console.log(`Auto-repaired all business associations for user ${userId}`);
            return true;
          }
        }
        
        console.log(`No data available to auto-repair. User needs manual association.`);
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying business access:', error);
    return false;
  }
};

/**
 * Check if a user has permission to read from a specific business subcollection
 * @param userId User ID to check
 * @param businessId Business ID to check
 * @param collectionName The collection to check (inventoryItems, purchaseOrders, etc.)
 * @returns True if the user has access, throws an error if not
 */
export const checkPermission = async (userId: string, businessId: string, collectionName: string): Promise<boolean> => {
  if (!userId || !businessId) {
    throw new Error(`Invalid user ID (${userId}) or business ID (${businessId})`);
  }
  
  try {
    // Check if user is business owner
    const businessDoc = await getDoc(doc(db, 'businesses', businessId));
    if (!businessDoc.exists()) {
      throw new Error(`Business ${businessId} does not exist`);
    }
    
    if (businessDoc.data().ownerId === userId) {
      console.log(`User ${userId} is owner of business ${businessId}, full access granted`);
      return true;
    }
    
    // Check if user is in business/users collection
    const businessUserRef = doc(db, 'businesses', businessId, 'users', userId);
    const businessUserDoc = await getDoc(businessUserRef);
    
    if (!businessUserDoc.exists()) {
      throw new Error(`User ${userId} is not associated with business ${businessId}`);
    }
    
    console.log(`User ${userId} is a member of business ${businessId} with role: ${businessUserDoc.data().role}`);
    return true;
  } catch (error: any) {
    console.error(`Permission check failed for ${userId} accessing ${collectionName} in ${businessId}:`, error);
    throw new Error(`Access denied: ${error.message}`);
  }
}; 