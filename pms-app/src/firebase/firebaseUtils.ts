import { auth, db, storage, rtdb, app } from './firebaseConfig';
import { 
  collection, 
  getDocs, 
  query, 
  limit, 
  doc, 
  getDoc
} from 'firebase/firestore';
import { ref, get, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// Function to check if Firebase is properly connected
export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    // Get Firebase project info
    console.log('Firebase project info:', {
      projectId: app.options.projectId,
      appId: app.options.appId,
      authDomain: app.options.authDomain,
      databaseURL: app.options.databaseURL,
      storageBucket: app.options.storageBucket
    });
    
    // Check Firestore connection
    console.log('Testing Firestore connection...');
    try {
      const testCollection = collection(db, 'system');
      const testQuery = query(testCollection, limit(1));
      await getDocs(testQuery);
      console.log('Firestore connection successful');
    } catch (firestoreError) {
      console.error('Firestore connection error:', firestoreError);
    }
    
    // Check Realtime Database connection
    console.log('Testing Realtime Database connection...');
    try {
      const dbRef = ref(rtdb, 'connectionTest');
      await get(dbRef);
      console.log('Realtime Database connection successful');
    } catch (dbError: any) {
      console.log('Realtime Database access error (expected if no permission):', dbError.message);
    }
    
    return true;
  } catch (error) {
    console.error('Firebase connection error:', error);
    return false;
  }
};

// Function to initialize Firebase (call this on app startup)
export const initializeFirebase = async (): Promise<void> => {
  console.log('Initializing Firebase connection...');
  
  // Set up connection status in Realtime Database
  if (auth.currentUser) {
    const uid = auth.currentUser.uid;
    const userStatusRef = ref(rtdb, `status/${uid}`);
    
    // When app comes online
    set(userStatusRef, { 
      online: true, 
      lastSeen: new Date().toISOString() 
    });
    
    // When app goes offline (disconnect)
    set(userStatusRef, { 
      online: false,
      lastSeen: new Date().toISOString()
    });
  }
  
  // Check Firebase connection
  await checkFirebaseConnection();
};

// Export additional convenient functions for database operations
export const getDocumentById = async (collectionPath: string, id: string) => {
  const docRef = doc(db, collectionPath, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    return null;
  }
};

export const getCollectionDocs = async (collectionPath: string) => {
  const querySnapshot = await getDocs(collection(db, collectionPath));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Function to upload a file to Firebase Storage
export const uploadFileToStorage = async (
  file: File, 
  path: string, 
  businessId: string
): Promise<string> => {
  try {
    // Create a unique file name with timestamp to avoid overwriting
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}_${file.name}`;
    const fullPath = `businesses/${businessId}/${path}/${fileName}`;
    
    // Create a reference to the file location
    const fileRef = storageRef(storage, fullPath);
    
    // Upload the file
    const snapshot = await uploadBytes(fileRef, file);
    console.log('File uploaded successfully:', snapshot.metadata.name);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}; 