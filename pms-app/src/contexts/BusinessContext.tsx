import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from './AuthContext';
import { Business } from '../types';

export interface BusinessContextType {
  businessData: Business | null;
  loading: boolean;
  error: string | null;
  currentBusiness: Business | null;
  setCurrentBusiness: (business: Business | null) => void;
}

// Create context with default values
const BusinessContext = createContext<BusinessContextType>({
  businessData: null,
  loading: false,
  error: null,
  currentBusiness: null,
  setCurrentBusiness: () => {}
});

export const useBusiness = () => useContext(BusinessContext);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [businessData, setBusinessData] = useState<Business | null>(null);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!currentUser) {
        console.log('BusinessContext: No user available');
        setBusinessData(null);
        setLoading(false);
        return;
      }

      if (!currentUser.businessId || currentUser.businessId === '') {
        console.log('BusinessContext: No business ID available');
        setBusinessData(null);
        setLoading(false);
        return;
      }
      
      try {
        console.log(`BusinessContext: Fetching business data for ID: ${currentUser.businessId}`);
        setLoading(true);
        setError(null);
        
        const businessRef = doc(db, 'businesses', currentUser.businessId);
        const businessDoc = await getDoc(businessRef);
        
        if (businessDoc.exists()) {
          const business = { 
            id: businessDoc.id, 
            ...businessDoc.data() 
          } as Business;
          
          console.log('BusinessContext: Business data fetched successfully:', business.name);
          setBusinessData(business);
          setCurrentBusiness(business);
        } else {
          console.error(`BusinessContext: No business document found for ID: ${currentUser.businessId}`);
          setError('Business not found');
          setBusinessData(null);
          setCurrentBusiness(null);
        }
      } catch (err) {
        console.error('BusinessContext: Error fetching business data:', err);
        setError('Failed to load business data');
        setBusinessData(null);
        setCurrentBusiness(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBusinessData();
  }, [currentUser]);

  const value = {
    businessData,
    loading,
    error,
    currentBusiness,
    setCurrentBusiness
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}; 