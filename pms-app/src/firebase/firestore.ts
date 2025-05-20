import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint,
  addDoc
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// Generic function to create a document with a custom ID
export const createDocWithId = async (
  collectionPath: string,
  id: string,
  data: any
) => {
  try {
    const docRef = doc(db, collectionPath, id);
    await setDoc(docRef, {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return id;
  } catch (error) {
    throw error;
  }
};

// Generic function to create a document with auto-generated ID
export const createDoc = async (
  collectionPath: string,
  data: any
) => {
  try {
    const collectionRef = collection(db, collectionPath);
    const docRef = await addDoc(collectionRef, {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

// Generic function to get a document by ID
export const getDocById = async (
  collectionPath: string,
  id: string
) => {
  try {
    const docRef = doc(db, collectionPath, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};

// Generic function to update a document
export const updateDocById = async (
  collectionPath: string,
  id: string,
  data: any
) => {
  try {
    const docRef = doc(db, collectionPath, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    throw error;
  }
};

// Generic function to delete a document
export const deleteDocById = async (
  collectionPath: string,
  id: string
) => {
  try {
    const docRef = doc(db, collectionPath, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    throw error;
  }
};

// Generic function to query documents
export const queryDocs = async (
  collectionPath: string,
  constraints: QueryConstraint[] = []
) => {
  try {
    const collectionRef = collection(db, collectionPath);
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const docs: DocumentData[] = [];
    querySnapshot.forEach((doc) => {
      docs.push({ id: doc.id, ...doc.data() });
    });
    
    return docs;
  } catch (error) {
    throw error;
  }
};

// Helper function to get all documents in a collection
export const getAllDocs = async (collectionPath: string) => {
  try {
    return await queryDocs(collectionPath);
  } catch (error) {
    throw error;
  }
};

// Helper function to get documents with filters
export const getFilteredDocs = async (
  collectionPath: string,
  field: string,
  operator: any,
  value: any
) => {
  try {
    return await queryDocs(collectionPath, [where(field, operator, value)]);
  } catch (error) {
    throw error;
  }
};

// Helper function to get ordered documents
export const getOrderedDocs = async (
  collectionPath: string,
  field: string,
  direction: 'asc' | 'desc' = 'asc',
  limitCount?: number
) => {
  try {
    const constraints: QueryConstraint[] = [orderBy(field, direction)];
    
    if (limitCount) {
      constraints.push(limit(limitCount));
    }
    
    return await queryDocs(collectionPath, constraints);
  } catch (error) {
    throw error;
  }
}; 