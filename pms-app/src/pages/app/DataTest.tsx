import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Paper, List, ListItem, ListItemText, Divider, Stack, Accordion, AccordionSummary, AccordionDetails, TextField, ListItemButton } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { 
  loadInventoryItems, 
  loadSuppliers, 
  loadInvoices, 
  loadPurchaseOrders, 
  verifyBusinessAccess,
  clearCache
} from '../../utils/dataLoaders';

const DataTest: React.FC = () => {
  const { currentUser } = useAuth();
  const { currentBusiness } = useBusiness();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [accessVerified, setAccessVerified] = useState<boolean | null>(null);
  const [showReloadOption, setShowReloadOption] = useState(false);

  // Add function to fix business association
  const [businessIdInput, setBusinessIdInput] = useState('');
  
  // Add function to find available businesses
  const [availableBusinesses, setAvailableBusinesses] = useState<any[]>([]);
  const [showBusinessList, setShowBusinessList] = useState(false);
  
  // Add a state to track auto-repair status
  const [autoRepairStatus, setAutoRepairStatus] = useState<string | null>(null);
  
  const directAssociateWithBusiness = async (businessId: string) => {
    if (!currentUser) {
      setError("No user logged in");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setAutoRepairStatus("Directly associating user with business...");
      
      console.log(`Directly associating user ${currentUser.id} with business ${businessId}`);
      
      // Get business info to verify it exists
      const businessDoc = await getDoc(doc(db, 'businesses', businessId));
      if (!businessDoc.exists()) {
        setError(`Business with ID ${businessId} does not exist`);
        setLoading(false);
        return;
      }
      
      // 1. Add user to user's businesses collection
      await setDoc(doc(db, 'users', currentUser.id, 'businesses', businessId), {
        businessId: businessId,
        role: 'officer',
        createdAt: new Date().toISOString()
      });
      
      // 2. Add user to business/users collection
      await setDoc(doc(db, 'businesses', businessId, 'users', currentUser.id), {
        userId: currentUser.id,
        role: 'officer',
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
        email: currentUser.email,
        name: currentUser.displayName || currentUser.email,
        createdAt: new Date().toISOString()
      });
      
      // 3. Update user document
      await setDoc(doc(db, 'users', currentUser.id), {
        businessId: businessId,
        role: 'officer'
      }, { merge: true });
      
      setAutoRepairStatus("User directly associated with business! Reloading page in 3 seconds...");
      
      // Force reload after a short delay to allow changes to propagate
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (err: any) {
      console.error('Error in direct association:', err);
      setError(`Error in direct association: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fixBusinessAssociation = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const businessId = businessIdInput.trim();
      if (!businessId) {
        setError("Please enter a valid business ID");
        setLoading(false);
        return;
      }
      
      // Check if business exists
      const businessDoc = await getDoc(doc(db, 'businesses', businessId));
      if (!businessDoc.exists()) {
        setError(`Business with ID ${businessId} does not exist`);
        setLoading(false);
        return;
      }
      
      console.log(`Associating user ${currentUser.id} with business ${businessId}`);
      
      // 1. Add user to user's businesses collection
      await setDoc(doc(db, 'users', currentUser.id, 'businesses', businessId), {
        businessId: businessId,
        role: 'officer',
        createdAt: new Date().toISOString()
      });
      
      // 2. Add user to business/users collection
      await setDoc(doc(db, 'businesses', businessId, 'users', currentUser.id), {
        userId: currentUser.id,
        role: 'officer',
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
        email: currentUser.email,
        name: currentUser.displayName || currentUser.email,
        createdAt: new Date().toISOString()
      });
      
      // 3. Update user document
      await setDoc(doc(db, 'users', currentUser.id), {
        businessId: businessId
      }, { merge: true });
      
      console.log('Business association fixed successfully');
      
      // Show success message and reload option
      setError(null);
      setShowReloadOption(true);
      
    } catch (err: any) {
      console.error('Error fixing business association:', err);
      setError(`Error fixing business association: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const findAvailableBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);
      setShowBusinessList(true);
      
      // Get all businesses
      const businessesRef = collection(db, 'businesses');
      const snapshot = await getDocs(businessesRef);
      
      const businesses = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Unnamed Business',
        ownerId: doc.data().ownerId
      }));
      
      setAvailableBusinesses(businesses);
      console.log('Found businesses:', businesses);
      
    } catch (err: any) {
      console.error('Error finding businesses:', err);
      setError(`Error finding businesses: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const selectBusiness = (businessId: string) => {
    setBusinessIdInput(businessId);
    setShowBusinessList(false);
  };

  const reloadPage = () => {
    window.location.reload();
  };

  const autoRepairAssociations = async () => {
    if (!currentUser || !currentBusiness) {
      setError("No user or business information available");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setAutoRepairStatus("Attempting to repair business associations...");
      
      const userId = currentUser.id;
      const businessId = currentBusiness.id;
      
      console.log(`Auto-repairing business associations for user ${userId} and business ${businessId}`);
      
      // Call the enhanced verifyBusinessAccess function which now has more robust repair logic
      const repaired = await verifyBusinessAccess(userId, businessId);
      
      if (repaired) {
        setAutoRepairStatus("Business associations repaired successfully! Refreshing data...");
        // Clear cache to ensure fresh data load
        clearCache(businessId);
        // Wait a bit to ensure Firestore changes propagate
        setTimeout(() => {
          refreshData();
          setAutoRepairStatus("Repair complete and data refreshed!");
        }, 1500);
      } else {
        setAutoRepairStatus("Could not automatically repair business associations.");
        setError("Auto-repair failed. Please try manual association.");
      }
    } catch (err: any) {
      console.error("Error during auto-repair:", err);
      setError(`Auto-repair error: ${err.message}`);
      setAutoRepairStatus("Auto-repair failed with an error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !currentBusiness) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Verify business access first
        const businessId = currentBusiness.id;
        const userId = currentUser.id;
        
        console.log(`Testing access for user ${userId} to business ${businessId}`);
        console.log(`User role: ${currentUser.role}`);
        
        // Verify business access
        const hasAccess = await verifyBusinessAccess(userId, businessId);
        setAccessVerified(hasAccess);
        console.log(`Business access verified: ${hasAccess}`);
        
        if (!hasAccess) {
          setError("Access verification failed. The user does not have access to this business.");
          setLoading(false);
          return;
        }
        
        try {
          // Load data using utility functions
          const items = await loadInventoryItems(businessId, userId);
          setInventoryItems(items);
          console.log(`Loaded ${items.length} inventory items`);
        } catch (itemsError: any) {
          console.error('Error loading inventory items:', itemsError);
          setError(`Inventory error: ${itemsError.message}`);
        }
        
        try {
          const suppliersData = await loadSuppliers(businessId, userId);
          setSuppliers(suppliersData);
          console.log(`Loaded ${suppliersData.length} suppliers`);
        } catch (suppliersError: any) {
          console.error('Error loading suppliers:', suppliersError);
          setError(prev => prev ? `${prev}, Suppliers error: ${suppliersError.message}` : `Suppliers error: ${suppliersError.message}`);
        }
        
        try {
          const invoicesData = await loadInvoices(businessId, userId);
          setInvoices(invoicesData);
          console.log(`Loaded ${invoicesData.length} invoices`);
        } catch (invoicesError: any) {
          console.error('Error loading invoices:', invoicesError);
          setError(prev => prev ? `${prev}, Invoices error: ${invoicesError.message}` : `Invoices error: ${invoicesError.message}`);
        }
        
        try {
          const poData = await loadPurchaseOrders(businessId, userId);
          setPurchaseOrders(poData);
          console.log(`Loaded ${poData.length} purchase orders`);
        } catch (poError: any) {
          console.error('Error loading purchase orders:', poError);
          setError(prev => prev ? `${prev}, PO error: ${poError.message}` : `PO error: ${poError.message}`);
        }
        
      } catch (err: any) {
        console.error('General error loading data:', err);
        setError(`Error loading data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, currentBusiness]);

  const refreshData = () => {
    setLoading(true);
    setError(null);
    
    // Force a refresh by calling the effect again
    if (currentUser && currentBusiness) {
      const businessId = currentBusiness.id;
      const userId = currentUser.id;
      
      // Re-verify business access and reload data
      verifyBusinessAccess(userId, businessId)
        .then(hasAccess => {
          setAccessVerified(hasAccess);
          console.log(`Business access re-verified: ${hasAccess}`);
          
          if (!hasAccess) {
            throw new Error("Access verification failed. The user does not have access to this business.");
          }
          
          // Clear cache to force fresh data
          clearCache(businessId);
          
          // Load each data type separately to isolate errors
          const promises = [];
          
          // Load inventory
          promises.push(
            loadInventoryItems(businessId, userId)
              .then(items => {
                setInventoryItems(items);
                console.log(`Refreshed ${items.length} inventory items`);
              })
              .catch(err => {
                console.error('Error refreshing inventory:', err);
                setError(prev => prev ? `${prev}, Inventory error: ${err.message}` : `Inventory error: ${err.message}`);
              })
          );
          
          // Load suppliers
          promises.push(
            loadSuppliers(businessId, userId)
              .then(data => {
                setSuppliers(data);
                console.log(`Refreshed ${data.length} suppliers`);
              })
              .catch(err => {
                console.error('Error refreshing suppliers:', err);
                setError(prev => prev ? `${prev}, Suppliers error: ${err.message}` : `Suppliers error: ${err.message}`);
              })
          );
          
          // Load invoices
          promises.push(
            loadInvoices(businessId, userId)
              .then(data => {
                setInvoices(data);
                console.log(`Refreshed ${data.length} invoices`);
              })
              .catch(err => {
                console.error('Error refreshing invoices:', err);
                setError(prev => prev ? `${prev}, Invoices error: ${err.message}` : `Invoices error: ${err.message}`);
              })
          );
          
          // Load purchase orders
          promises.push(
            loadPurchaseOrders(businessId, userId)
              .then(data => {
                setPurchaseOrders(data);
                console.log(`Refreshed ${data.length} purchase orders`);
              })
              .catch(err => {
                console.error('Error refreshing purchase orders:', err);
                setError(prev => prev ? `${prev}, PO error: ${err.message}` : `PO error: ${err.message}`);
              })
          );
          
          // Wait for all promises to settle
          return Promise.allSettled(promises);
        })
        .catch(err => {
          console.error('Error refreshing data:', err);
          setError(`${err.message || 'Error refreshing data'}`);
        })
        .finally(() => {
          setLoading(false);
          console.log('Refresh complete');
        });
    } else {
      setLoading(false);
      setError('No user or business available');
    }
  };
  
  const handleClearCache = () => {
    if (currentBusiness?.id) {
      clearCache(currentBusiness.id);
      console.log('Cache cleared');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Data Loading Test</Typography>
      
      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}
      
      {autoRepairStatus && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#e8f5e9' }}>
          <Typography color="success.main">{autoRepairStatus}</Typography>
        </Paper>
      )}
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1">
          User: {currentUser?.email} (Role: {currentUser?.role})
        </Typography>
        <Typography variant="body1">
          Business: {currentBusiness?.name} (ID: {currentBusiness?.id})
        </Typography>
        <Typography variant="body1">
          Business Access Verified: {accessVerified === null ? 'Checking...' : accessVerified ? 'Yes' : 'No'}
        </Typography>
        
        {/* Add Auto-Repair button */}
        {currentUser && currentBusiness && !accessVerified && (
          <Button
            variant="contained"
            color="success"
            onClick={autoRepairAssociations}
            disabled={loading}
            sx={{ mt: 2, mb: 2 }}
          >
            Auto-Repair Business Associations
          </Button>
        )}
        
        {/* Add UI for fixing business association if businessId is null */}
        {currentUser && !currentUser.businessId && (
          <Paper sx={{ p: 2, mt: 2, bgcolor: '#fff9c4' }}>
            <Typography variant="h6" gutterBottom>Business Association Missing</Typography>
            <Typography variant="body2" paragraph>
              This user account is not associated with any business. Please enter a valid business ID to fix this issue.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <TextField 
                label="Business ID" 
                variant="outlined"
                size="small" 
                fullWidth
                value={businessIdInput}
                onChange={(e) => setBusinessIdInput(e.target.value)}
              />
              <Button 
                variant="contained"
                color="warning"
                onClick={fixBusinessAssociation}
                disabled={loading || !businessIdInput.trim()}
              >
                Fix Association
              </Button>
            </Box>
            
            <Button
              variant="text"
              color="info"
              onClick={findAvailableBusinesses}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              Find Available Businesses
            </Button>
            
            {showBusinessList && (
              <Paper sx={{ p: 2, mb: 2, maxHeight: '200px', overflow: 'auto' }}>
                <Typography variant="subtitle2" gutterBottom>Available Businesses:</Typography>
                {availableBusinesses.length === 0 ? (
                  <Typography variant="body2">No businesses found.</Typography>
                ) : (
                  <List dense>
                    {availableBusinesses.map(business => (
                      <ListItemButton 
                        key={business.id}
                        onClick={() => selectBusiness(business.id)}
                        sx={{ 
                          bgcolor: businessIdInput === business.id ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                          borderRadius: 1
                        }}
                      >
                        <ListItemText 
                          primary={business.name} 
                          secondary={`ID: ${business.id.substring(0, 8)}...`} 
                        />
                      </ListItemButton>
                    ))}
                  </List>
                )}
              </Paper>
            )}
          </Paper>
        )}
        
        {currentUser && (!currentBusiness || !currentBusiness.id) && (
          <Paper sx={{ p: 2, mt: 2, mb: 2, bgcolor: '#e3f2fd' }}>
            <Typography variant="h6" gutterBottom>Direct Business Association</Typography>
            <Typography variant="body2" paragraph>
              No business association detected. Use this option to directly force association with an existing business.
            </Typography>
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Enter Business ID"
                variant="outlined"
                size="small"
                fullWidth
                sx={{ mb: 2 }}
                value={businessIdInput}
                onChange={(e) => setBusinessIdInput(e.target.value)}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => directAssociateWithBusiness(businessIdInput)}
                disabled={loading || !businessIdInput.trim()}
                sx={{ mr: 1 }}
              >
                Force Associate with Business
              </Button>
              <Button
                variant="outlined"
                color="info"
                onClick={findAvailableBusinesses}
                disabled={loading}
              >
                Find Available Businesses
              </Button>
            </Box>
            
            {showBusinessList && (
              <Paper sx={{ p: 2, maxHeight: '200px', overflow: 'auto' }}>
                <Typography variant="subtitle2" gutterBottom>Available Businesses:</Typography>
                {availableBusinesses.length === 0 ? (
                  <Typography variant="body2">No businesses found.</Typography>
                ) : (
                  <List dense>
                    {availableBusinesses.map(business => (
                      <ListItemButton 
                        key={business.id}
                        onClick={() => selectBusiness(business.id)}
                        sx={{ 
                          bgcolor: businessIdInput === business.id ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                          borderRadius: 1
                        }}
                      >
                        <ListItemText 
                          primary={business.name} 
                          secondary={`ID: ${business.id.substring(0, 8)}...`} 
                        />
                      </ListItemButton>
                    ))}
                  </List>
                )}
              </Paper>
            )}
          </Paper>
        )}
        
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Debug User Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
              {JSON.stringify(currentUser, null, 2)}
            </Typography>
          </AccordionDetails>
        </Accordion>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Debug Business Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
              {JSON.stringify(currentBusiness, null, 2)}
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
      
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={refreshData} 
          disabled={loading}
        >
          Refresh Data
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleClearCache}
          disabled={loading}
        >
          Clear Cache
        </Button>
      </Stack>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Inventory Items ({inventoryItems.length})</Typography>
            <List>
              {inventoryItems.slice(0, 5).map(item => (
                <ListItem key={item.id}>
                  <ListItemText 
                    primary={item.name} 
                    secondary={`Quantity: ${item.quantity}, Price: $${item.unitPrice}`} 
                  />
                </ListItem>
              ))}
              {inventoryItems.length > 5 && (
                <ListItem>
                  <ListItemText primary={`... and ${inventoryItems.length - 5} more items`} />
                </ListItem>
              )}
            </List>
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Suppliers ({suppliers.length})</Typography>
            <List>
              {suppliers.slice(0, 5).map(supplier => (
                <ListItem key={supplier.id}>
                  <ListItemText 
                    primary={supplier.name} 
                    secondary={supplier.email || 'No email'} 
                  />
                </ListItem>
              ))}
              {suppliers.length > 5 && (
                <ListItem>
                  <ListItemText primary={`... and ${suppliers.length - 5} more suppliers`} />
                </ListItem>
              )}
            </List>
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Invoices ({invoices.length})</Typography>
            <List>
              {invoices.slice(0, 5).map(invoice => (
                <ListItem key={invoice.id}>
                  <ListItemText 
                    primary={`Invoice #${invoice.invoiceNumber}`} 
                    secondary={`Amount: $${invoice.total}, Status: ${invoice.status}`} 
                  />
                </ListItem>
              ))}
              {invoices.length > 5 && (
                <ListItem>
                  <ListItemText primary={`... and ${invoices.length - 5} more invoices`} />
                </ListItem>
              )}
            </List>
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Purchase Orders ({purchaseOrders.length})</Typography>
            <List>
              {purchaseOrders.slice(0, 5).map(po => (
                <ListItem key={po.id}>
                  <ListItemText 
                    primary={`PO #${po.poNumber}`} 
                    secondary={`Amount: $${po.total}, Status: ${po.status}`} 
                  />
                </ListItem>
              ))}
              {purchaseOrders.length > 5 && (
                <ListItem>
                  <ListItemText primary={`... and ${purchaseOrders.length - 5} more POs`} />
                </ListItem>
              )}
            </List>
          </Paper>
        </Box>
      )}
      
      {showReloadOption && (
        <Paper sx={{ mt: 2, p: 2, bgcolor: '#e8f5e9' }}>
          <Typography variant="h6" gutterBottom>Business Association Fixed Successfully</Typography>
          <Typography variant="body2" paragraph>
            Your account has been associated with the business. Please reload the page to see your data.
          </Typography>
          <Button
            variant="contained"
            color="success"
            onClick={reloadPage}
          >
            Reload Page
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default DataTest; 