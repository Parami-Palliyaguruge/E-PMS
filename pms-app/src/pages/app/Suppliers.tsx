import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
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
  Grid,
  CircularProgress,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useBusiness } from '../../contexts/BusinessContext';
import { Supplier, Address } from '../../types';
import { 
  getAllDocs, 
  createDoc, 
  updateDocById, 
  deleteDocById 
} from '../../firebase/firestore';

interface SupplierFormState {
  id?: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: Address;
  category: string;
  status: 'active' | 'inactive';
  notes: string;
}

const initialFormState: SupplierFormState = {
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  },
  category: '',
  status: 'active',
  notes: ''
};

const Suppliers: React.FC = () => {
  const { businessData, loading: businessLoading } = useBusiness();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<SupplierFormState>(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  // Fetch suppliers data
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!businessData) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const businessId = businessData.id;
        const suppliersPath = `businesses/${businessId}/suppliers`;
        
        const suppliersData = await getAllDocs(suppliersPath);
        setSuppliers(suppliersData as Supplier[]);
      } catch (err) {
        console.error('Error fetching suppliers:', err);
        setError('Failed to load suppliers');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuppliers();
  }, [businessData]);
  
  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter(
    supplier => 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle form data changes - updated to handle both input changes and select changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    
    if (name?.includes('.')) {
      // Handle nested address fields
      const [parent, child] = name.split('.');
      
      // Safe approach to handle address updates
      if (parent === 'address') {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            [child]: value
          }
        }));
      }
    } else if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!businessData) return;
    
    try {
      setLoading(true);
      
      const businessId = businessData.id;
      const suppliersPath = `businesses/${businessId}/suppliers`;
      
      const supplierData = {
        ...formData,
        createdAt: new Date()
      };
      
      if (isEditing && formData.id) {
        // Update existing supplier
        await updateDocById(
          suppliersPath,
          formData.id,
          supplierData
        );
        
        // Update local state
        setSuppliers(prev => 
          prev.map(supplier => 
            supplier.id === formData.id 
              ? { ...supplier, ...supplierData }
              : supplier
          )
        );
      } else {
        // Create new supplier
        const newSupplierId = await createDoc(
          suppliersPath,
          supplierData
        );
        
        // Update local state
        setSuppliers(prev => [
          ...prev,
          { id: newSupplierId, ...supplierData } as Supplier
        ]);
      }
      
      // Reset form and close dialog
      setFormData(initialFormState);
      setOpenDialog(false);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving supplier:', err);
      setError('Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle delete supplier
  const handleDelete = async (id: string) => {
    if (!businessData) return;
    
    try {
      setLoading(true);
      
      const businessId = businessData.id;
      const suppliersPath = `businesses/${businessId}/suppliers`;
      
      await deleteDocById(suppliersPath, id);
      
      // Update local state
      setSuppliers(prev => prev.filter(supplier => supplier.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting supplier:', err);
      setError('Failed to delete supplier');
    } finally {
      setLoading(false);
    }
  };
  
  // Open edit dialog with supplier data
  const handleEdit = (supplier: Supplier) => {
    setFormData({
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      category: supplier.category || '',
      status: supplier.status,
      notes: supplier.notes || ''
    });
    setIsEditing(true);
    setOpenDialog(true);
  };
  
  // Reset form and open dialog for new supplier
  const handleAddNew = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setOpenDialog(true);
  };
  
  if (businessLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (!businessData) {
    return (
      <Alert severity="warning">
        No business data found. Please create a business first.
      </Alert>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Suppliers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddNew}
        >
          Add Supplier
        </Button>
      </Box>
      
      {/* Search and filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid component="div" sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }}>
            <TextField
              fullWidth
              label="Search Suppliers"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Suppliers Table */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="suppliers table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Contact Person</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSuppliers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell component="th" scope="row">
                    {supplier.name}
                  </TableCell>
                  <TableCell>{supplier.contactPerson}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>{supplier.category}</TableCell>
                  <TableCell>
                    <Chip
                      label={supplier.status}
                      color={supplier.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(supplier)}
                      aria-label="edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setConfirmDelete(supplier.id)}
                      aria-label="delete"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            {filteredSuppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No suppliers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredSuppliers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      
      {/* Add/Edit Supplier Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Supplier Name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
                margin="normal"
              />
            </Grid>
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Contact Person"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleFormChange}
                margin="normal"
              />
            </Grid>
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                margin="normal"
              />
            </Grid>
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                margin="normal"
              />
            </Grid>
            <Grid component="div" sx={{ width: { xs: '100%' } }}>
              <Typography variant="subtitle1" gutterBottom>
                Address
              </Typography>
            </Grid>
            <Grid component="div" sx={{ width: { xs: '100%' } }}>
              <TextField
                fullWidth
                label="Street"
                name="address.street"
                value={formData.address.street}
                onChange={handleFormChange}
                margin="normal"
              />
            </Grid>
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
              <TextField
                fullWidth
                label="City"
                name="address.city"
                value={formData.address.city}
                onChange={handleFormChange}
                margin="normal"
              />
            </Grid>
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
              <TextField
                fullWidth
                label="State/Province"
                name="address.state"
                value={formData.address.state}
                onChange={handleFormChange}
                margin="normal"
              />
            </Grid>
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
              <TextField
                fullWidth
                label="Zip/Postal Code"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleFormChange}
                margin="normal"
              />
            </Grid>
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
              <TextField
                fullWidth
                label="Country"
                name="address.country"
                value={formData.address.country}
                onChange={handleFormChange}
                margin="normal"
              />
            </Grid>
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                margin="normal"
              />
            </Grid>
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  name="status"
                  onChange={handleFormChange as (event: SelectChangeEvent<"active" | "inactive">) => void}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid component="div" sx={{ width: { xs: '100%' } }}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                multiline
                rows={4}
                margin="normal"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name.trim()}
          >
            {isEditing ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this supplier? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button
            onClick={() => confirmDelete && handleDelete(confirmDelete)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Suppliers; 