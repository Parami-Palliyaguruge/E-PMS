import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  TablePagination,
  Tooltip,
  Autocomplete,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { formatCurrency } from '../../utils/formatters';
import { InventoryItem, Supplier } from '../../types';

interface InventoryFormData {
  id?: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  reorderPoint: number;
  location: string;
  supplierIds: string[];
}

const initialFormData: InventoryFormData = {
  name: '',
  sku: '',
  description: '',
  category: '',
  quantity: 0,
  unit: 'ea',
  unitPrice: 0,
  reorderPoint: 0,
  location: '',
  supplierIds: []
};

const Inventory: React.FC = () => {
  const { currentUser } = useAuth();
  const { currentBusiness } = useBusiness();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<InventoryFormData>(initialFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([]);

  // Load inventory data
  useEffect(() => {
    const loadData = async () => {
      if (!currentBusiness) return;
      
      try {
        setLoading(true);
        
        // Fetch inventory items
        const inventoryQuery = query(
          collection(db, 'businesses', currentBusiness.id, 'inventoryItems'),
          orderBy('name', 'asc')
        );
        const inventorySnapshot = await getDocs(inventoryQuery);
        const inventoryData = inventorySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as InventoryItem));
        
        setInventory(inventoryData);
        setFilteredItems(inventoryData);
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(inventoryData.map(item => item.category || ''))).filter(cat => cat);
        setCategories(uniqueCategories);
        
        // Fetch suppliers for supplier selection
        const suppliersQuery = query(
          collection(db, 'businesses', currentBusiness.id, 'suppliers'),
          where('status', '==', 'active')
        );
        const suppliersSnapshot = await getDocs(suppliersQuery);
        const suppliersData = suppliersSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Supplier));
        setSuppliers(suppliersData);
        
      } catch (error) {
        console.error('Error loading inventory data:', error);
        setSnackbar({
          open: true,
          message: 'Error loading inventory data',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentBusiness]);

  // Apply filters to inventory
  useEffect(() => {
    let result = [...inventory];
    
    // Apply search term
    if (searchTerm.trim()) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter(item => item.category === categoryFilter);
    }
    
    // Apply stock filter
    if (stockFilter === 'low') {
      result = result.filter(item => item.reorderPoint && item.quantity <= item.reorderPoint);
    } else if (stockFilter === 'out') {
      result = result.filter(item => item.quantity === 0);
    }
    
    setFilteredItems(result);
  }, [searchTerm, categoryFilter, stockFilter, inventory]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = () => {
    setFormData(initialFormData);
    setCurrentItem(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleEditItem = (item: InventoryItem) => {
    setCurrentItem(item);
    setFormData({
      id: item.id,
      name: item.name,
      sku: item.sku || '',
      description: item.description || '',
      category: item.category || '',
      quantity: item.quantity,
      unit: item.unit || 'ea',
      unitPrice: item.unitPrice || 0,
      reorderPoint: item.reorderPoint || 0,
      location: item.location || '',
      supplierIds: item.supplierIds || []
    });
    setSelectedSuppliers(suppliers.filter(supplier => (item.supplierIds || []).includes(supplier.id)));
    setOpenDialog(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSupplierChange = (event: any, newValues: Supplier[]) => {
    setFormData(prev => ({
      ...prev,
      supplierIds: newValues.map(supplier => supplier.id)
    }));
    setSelectedSuppliers(newValues);
  };

  const handleDeleteItem = async (id: string) => {
    if (!currentBusiness) return;
    
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await deleteDoc(doc(db, 'businesses', currentBusiness.id, 'inventoryItems', id));
        setInventory(prev => prev.filter(item => item.id !== id));
        setSnackbar({
          open: true,
          message: 'Inventory item deleted successfully',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error deleting inventory item:', error);
        setSnackbar({
          open: true,
          message: 'Error deleting inventory item',
          severity: 'error'
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (!currentBusiness || !currentUser) return;
    
    // Validate required fields
    if (!formData.name) {
      setSnackbar({
        open: true,
        message: 'Please enter a product name',
        severity: 'error'
      });
      return;
    }
    
    try {
      const now = new Date();
      const itemData = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        category: formData.category,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        unitPrice: Number(formData.unitPrice),
        reorderPoint: Number(formData.reorderPoint),
        location: formData.location,
        supplierIds: formData.supplierIds,
        updatedAt: now
      };
      
      if (currentItem) {
        // Update existing item
        await setDoc(
          doc(db, 'businesses', currentBusiness.id, 'inventoryItems', currentItem.id),
          {
            ...itemData,
            createdAt: currentItem.createdAt
          },
          { merge: true }
        );
        
        // Update local state
        setInventory(prev => prev.map(item => 
          item.id === currentItem.id 
            ? { ...item, ...itemData } as InventoryItem 
            : item
        ));
        
      } else {
        // Create new item
        const newDocRef = doc(collection(db, 'businesses', currentBusiness.id, 'inventoryItems'));
        await setDoc(newDocRef, {
          ...itemData,
          createdAt: now
        });
        
        // Update local state
        const newItem = { 
          id: newDocRef.id, 
          ...itemData,
          createdAt: now
        } as InventoryItem;
        
        setInventory(prev => [...prev, newItem]);
      }
      
      setOpenDialog(false);
      setSnackbar({
        open: true,
        message: `Inventory item ${currentItem ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Error saving inventory item:', error);
      setSnackbar({
        open: true,
        message: `Error ${currentItem ? 'updating' : 'creating'} inventory item`,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Helper to find supplier names for display
  const getSupplierNames = (supplierIds: string[] = []) => {
    return supplierIds.map(id => {
      const supplier = suppliers.find(s => s.id === id);
      return supplier ? supplier.name : '';
    }).filter(name => name).join(', ');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Inventory Management
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add New Item
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: '200px' }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
            }}
          />
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: '150px' }}>
            <InputLabel>Category</InputLabel>
            <Select
              label="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as string)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map(category => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: '150px' }}>
            <InputLabel>Stock Level</InputLabel>
            <Select
              label="Stock Level"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as string)}
            >
              <MenuItem value="all">All Stock Levels</MenuItem>
              <MenuItem value="low">Low Stock</MenuItem>
              <MenuItem value="out">Out of Stock</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Unit Price</TableCell>
                  <TableCell>Supplier(s)</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {item.reorderPoint && item.quantity <= item.reorderPoint && (
                              <Tooltip title="Low Stock">
                                <WarningIcon 
                                  color="warning" 
                                  fontSize="small" 
                                  sx={{ mr: 1 }} 
                                />
                              </Tooltip>
                            )}
                            {item.name}
                          </Box>
                        </TableCell>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell>
                          {item.category && (
                            <Chip 
                              label={item.category} 
                              size="small"
                              sx={{ backgroundColor: '#e0e0e0' }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography 
                              variant="body2" 
                              color={item.quantity === 0 ? 'error.main' : 'text.primary'}
                              fontWeight={item.quantity === 0 ? 'bold' : 'normal'}
                            >
                              {item.quantity} {item.unit || 'ea'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{formatCurrency(item.unitPrice || 0)}</TableCell>
                        <TableCell>{getSupplierNames(item.supplierIds)}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Tooltip title="Edit">
                              <IconButton onClick={() => handleEditItem(item)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton onClick={() => handleDeleteItem(item.id)}>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredItems.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
              <TextField
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
              <TextField
                label="SKU"
                name="sku"
                value={formData.sku}
                onChange={handleFormChange}
                fullWidth
              />
            </Grid>
            
            <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
              <TextField
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                fullWidth
              />
            </Grid>
            
            <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
              <TextField
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleFormChange}
                fullWidth
              />
            </Grid>
            
            <Grid sx={{ width: { xs: '100%' }, padding: 1 }}>
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid sx={{ width: { xs: '100%', md: '33.33%' }, padding: 1 }}>
              <TextField
                label="Quantity"
                name="quantity"
                type="number"
                InputProps={{ inputProps: { min: 0 } }}
                value={formData.quantity}
                onChange={handleFormChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid sx={{ width: { xs: '100%', md: '33.33%' }, padding: 1 }}>
              <TextField
                label="Unit"
                name="unit"
                value={formData.unit}
                onChange={handleFormChange}
                fullWidth
              />
            </Grid>
            
            <Grid sx={{ width: { xs: '100%', md: '33.33%' }, padding: 1 }}>
              <TextField
                label="Reorder Point"
                name="reorderPoint"
                type="number"
                InputProps={{ inputProps: { min: 0 } }}
                value={formData.reorderPoint}
                onChange={handleFormChange}
                fullWidth
              />
            </Grid>
            
            <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
              <TextField
                label="Unit Price"
                name="unitPrice"
                type="number"
                InputProps={{ 
                  inputProps: { min: 0, step: 0.01 },
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                value={formData.unitPrice}
                onChange={handleFormChange}
                fullWidth
              />
            </Grid>
            
            <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
              <Autocomplete
                multiple
                options={suppliers}
                getOptionLabel={(option) => option.name}
                value={selectedSuppliers}
                onChange={(e, newValue) => setSelectedSuppliers(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Suppliers"
                    placeholder="Select suppliers"
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmit}
          >
            {currentItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default Inventory; 