import React, { createContext, useContext, useState } from 'react';

// Define the context type
interface DataContextType {
  // Triggers to signal when data changes
  budgetUpdated: number;
  invoiceUpdated: number;
  dashboardUpdated: number;
  
  // Update methods
  triggerBudgetUpdate: () => void;
  triggerInvoiceUpdate: () => void;
  triggerDashboardUpdate: () => void;
}

// Create context with default values
const DataContext = createContext<DataContextType>({
  budgetUpdated: 0,
  invoiceUpdated: 0,
  dashboardUpdated: 0,
  triggerBudgetUpdate: () => {},
  triggerInvoiceUpdate: () => {},
  triggerDashboardUpdate: () => {}
});

// Export hook for easy context access
export const useData = () => useContext(DataContext);

// Context provider component
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use timestamps as triggers to force component updates
  const [budgetUpdated, setBudgetUpdated] = useState<number>(Date.now());
  const [invoiceUpdated, setInvoiceUpdated] = useState<number>(Date.now());
  const [dashboardUpdated, setDashboardUpdated] = useState<number>(Date.now());
  
  // Trigger methods that components can call
  const triggerBudgetUpdate = () => {
    console.log('DataContext: Budget update triggered');
    const timestamp = Date.now();
    setBudgetUpdated(timestamp);
    // Also trigger dashboard update since it displays budget info
    setDashboardUpdated(timestamp);
  };
  
  const triggerInvoiceUpdate = () => {
    console.log('DataContext: Invoice update triggered');
    const timestamp = Date.now();
    setInvoiceUpdated(timestamp);
  };
  
  const triggerDashboardUpdate = () => {
    console.log('DataContext: Dashboard update triggered');
    setDashboardUpdated(Date.now());
  };
  
  // Context value containing state and functions
  const value = {
    budgetUpdated,
    invoiceUpdated,
    dashboardUpdated,
    triggerBudgetUpdate,
    triggerInvoiceUpdate,
    triggerDashboardUpdate
  };
  
  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export default DataProvider; 