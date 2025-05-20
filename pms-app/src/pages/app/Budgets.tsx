import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Snackbar,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useBusiness } from '../../contexts/BusinessContext';
import { formatCurrency } from '../../utils/formatters';
import PageHeader from '../../components/app/PageHeader';
import NoDataPlaceholder from '../../components/NoDataPlaceholder';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { collection, addDoc, query, getDocs, Timestamp, orderBy, where, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  category: string;
  period: string;
  startDate: Date | string;
  endDate: Date | string;
  status: 'active' | 'completed' | 'draft';
  createdAt?: Date;
  updatedAt?: Date;
  year?: number;
}

interface AnnualBudget {
  id: string;
  year: number;
  totalAmount: number;
  categories: {
    name: string;
    amount: number;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Define budget categories
const BUDGET_CATEGORIES = [
  'Inventory',
  'Raw Materials',
  'Office Supplies',
  'Production',
  'IT',
  'Marketing',
  'Shipping',
  'Other'
];

// Define budget periods
const BUDGET_PERIODS = [
  'Monthly',
  'Quarterly',
  'Semi-Annual',
  'Annual'
];

const Budgets: React.FC = () => {
  const { currentBusiness } = useBusiness();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [annualBudgets, setAnnualBudgets] = useState<AnnualBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Form state
  const initialFormState = {
    name: '',
    category: '',
    period: '',
    amount: 0,
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)), // Default to 3 months from now
    status: 'draft' as 'active' | 'completed' | 'draft',
    spent: 0,
    year: new Date().getFullYear()
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Calculate totals based on annual budgets instead of individual budgets
  const currentYear = new Date().getFullYear();
  const currentAnnualBudget = annualBudgets.find(budget => budget.year === currentYear);
  
  // Use annual budget totals for the current year (more accurate for dashboard)
  const totalBudget = currentAnnualBudget ? currentAnnualBudget.totalAmount : 0;
  
  // Calculate total spent from the individual budgets for the current year
  const currentYearBudgets = budgets.filter(budget => 
    budget.year === currentYear || 
    (new Date(budget.startDate as Date).getFullYear() === currentYear)
  );
  const totalSpent = currentYearBudgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  
  useEffect(() => {
    if (currentBusiness) {
      loadBudgets();
      loadAnnualBudgets();
    }
  }, [currentBusiness]);
  
  const loadBudgets = async () => {
    if (!currentBusiness) return;
    
    try {
      setLoading(true);
      setError('');
      
      const budgetQuery = query(
        collection(db, 'businesses', currentBusiness.id, 'budgets'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(budgetQuery);
      const budgetData: Budget[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const startDate = data.startDate instanceof Timestamp 
          ? new Date(data.startDate.seconds * 1000) 
          : new Date(data.startDate);
        const endDate = data.endDate instanceof Timestamp 
          ? new Date(data.endDate.seconds * 1000) 
          : new Date(data.endDate);
        
        // Ensure spent value is a number - fix potential Firebase type issues
        const spent = typeof data.spent === 'number' ? data.spent : 0;
        console.log(`Budget ${doc.id} - ${data.name}, spent: ${spent} (type: ${typeof data.spent})`);
        
        budgetData.push({
          id: doc.id,
          name: data.name,
          amount: data.amount,
          spent: spent,
          category: data.category,
          period: data.period,
          startDate,
          endDate,
          status: data.status,
          year: data.year || new Date(startDate).getFullYear(),
          createdAt: data.createdAt instanceof Timestamp 
            ? new Date(data.createdAt.seconds * 1000) 
            : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp 
            ? new Date(data.updatedAt.seconds * 1000) 
            : undefined
        });
      });
      
      setBudgets(budgetData);
    } catch (err) {
      console.error('Error loading budgets:', err);
      setError('Failed to load budgets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAnnualBudgets = async () => {
    if (!currentBusiness) return;
    
    try {
      const annualBudgetQuery = query(
        collection(db, 'businesses', currentBusiness.id, 'annualBudgets')
      );
      
      const querySnapshot = await getDocs(annualBudgetQuery);
      const annualBudgetData: AnnualBudget[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        annualBudgetData.push({
          id: doc.id,
          year: data.year,
          totalAmount: data.totalAmount,
          categories: data.categories || [],
          createdAt: data.createdAt instanceof Timestamp 
            ? new Date(data.createdAt.seconds * 1000) 
            : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp 
            ? new Date(data.updatedAt.seconds * 1000) 
            : undefined
        });
      });
      
      setAnnualBudgets(annualBudgetData);
    } catch (err) {
      console.error('Error loading annual budgets:', err);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      ...initialFormState,
      year: new Date().getFullYear()
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
      
      // Clear validation error when user corrects the field
      if (formErrors[name]) {
        setFormErrors((prev) => ({
          ...prev,
          [name]: ''
        }));
      }
    }
  };
  
  const handleCategoryChange = (e: SelectChangeEvent) => {
    setFormData((prev) => ({
      ...prev,
      category: e.target.value
    }));
  };
  
  const handlePeriodChange = (e: SelectChangeEvent) => {
    setFormData((prev) => ({
      ...prev,
      period: e.target.value
    }));
  };
  
  const handleStatusChange = (e: SelectChangeEvent<'active' | 'completed' | 'draft'>) => {
    setFormData((prev) => ({
      ...prev,
      status: e.target.value as 'active' | 'completed' | 'draft'
    }));
  };
  
  const handleDateChange = (field: 'startDate' | 'endDate', value: Date | null) => {
    if (value) {
      // Update year when start date changes
      if (field === 'startDate') {
        setFormData((prev) => ({
          ...prev,
          [field]: value,
          year: value.getFullYear()
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [field]: value
        }));
      }
    }
  };
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Budget name is required';
    }
    
    if (!formData.category) {
      errors.category = 'Please select a category';
    }
    
    if (!formData.period) {
      errors.period = 'Please select a period';
    }
    
    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'Please enter a valid amount';
    }
    
    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }
    
    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }
    
    if (formData.startDate && formData.endDate && 
        new Date(formData.startDate) >= new Date(formData.endDate)) {
      errors.endDate = 'End date must be after start date';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Update the updateAnnualBudgetSummary function to better sync with dashboard
  const updateAnnualBudgetSummary = async (budgetData: Budget) => {
    if (!currentBusiness) return;
    
    const year = budgetData.year || new Date().getFullYear();
    const annualBudgetRef = doc(db, 'businesses', currentBusiness.id, 'annualBudgets', year.toString());
    
    try {
      // Check if annual budget exists
      const annualBudgetDoc = await getDoc(annualBudgetRef);
      
      if (annualBudgetDoc.exists()) {
        // Update existing annual budget
        const existingData = annualBudgetDoc.data() as AnnualBudget;
        
        // Find if category already exists in the annual budget
        const categoryExists = existingData.categories && 
          existingData.categories.findIndex(c => c.name === budgetData.category) !== -1;
        
        let updatedCategories = existingData.categories || [];
        
        if (categoryExists) {
          // Update existing category
          updatedCategories = updatedCategories.map(c => 
            c.name === budgetData.category 
              ? { ...c, amount: c.amount + budgetData.amount }
              : c
          );
        } else {
          // Add new category
          updatedCategories.push({
            name: budgetData.category,
            amount: budgetData.amount
          });
        }
        
        // Calculate new total
        const newTotal = updatedCategories.reduce((sum, cat) => sum + cat.amount, 0);
        
        console.log("Updating annual budget:", {
          totalAmount: newTotal,
          categories: updatedCategories
        });
        
        // Update document with exact schema dashboard expects
        await updateDoc(annualBudgetRef, {
          year: year,
          totalAmount: newTotal,
          categories: updatedCategories,
          updatedAt: new Date()
        });
        
      } else {
        // Create new annual budget
        console.log("Creating new annual budget for year:", year);
        
        const newBudgetData = {
          year,
          totalAmount: budgetData.amount,
          categories: [
            {
              name: budgetData.category,
              amount: budgetData.amount
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        console.log("New annual budget data:", newBudgetData);
        
        await setDoc(annualBudgetRef, newBudgetData);
      }
    } catch (err) {
      console.error('Error updating annual budget summary:', err);
      throw err;
    }
  };
  
  const handleCreateBudget = async () => {
    if (!currentBusiness) return;
    
    // Validate form
    if (!validateForm()) return;
    
    try {
      const now = new Date();
      const year = new Date(formData.startDate).getFullYear();
      
      // Ensure amount is a number
      const amount = Number(formData.amount);
      if (isNaN(amount)) {
        throw new Error("Invalid budget amount");
      }
      
      // Prepare the budget data with proper types for Firestore
      const budgetData = {
        name: formData.name,
        category: formData.category,
        period: formData.period,
        amount: amount,
        spent: 0,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        year: year,
        createdAt: now,
        updatedAt: now
      };
      
      console.log("Creating budget with data:", budgetData);
      
      // Create individual budget
      const budgetRef = await addDoc(
        collection(db, 'businesses', currentBusiness.id, 'budgets'),
        budgetData
      );
      
      console.log("Budget created with ID:", budgetRef.id);
      
      // Update annual budget summary for dashboard
      await updateAnnualBudgetSummary({
        ...budgetData,
        id: budgetRef.id
      } as Budget);
      
      setSnackbar({
        open: true,
        message: 'Budget created successfully',
        severity: 'success'
      });
      
      handleCloseDialog();
      loadBudgets();
      loadAnnualBudgets();
    } catch (err: any) {
      console.error('Error creating budget:', err);
      
      // Show more detailed error message
      setSnackbar({
        open: true,
        message: `Failed to create budget: ${err.message || 'Please try again.'}`,
        severity: 'error'
      });
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const getBudgetStatus = (budget: Budget) => {
    const percentUsed = (budget.spent / budget.amount) * 100;
    if (percentUsed >= 90) return 'error';
    if (percentUsed >= 75) return 'warning';
    return 'success';
  };

  const getProgressColor = (budget: Budget) => {
    const status = getBudgetStatus(budget);
    if (status === 'error') return '#f44336';
    if (status === 'warning') return '#ff9800';
    return '#4caf50';
  };

  // Add a function to update expense data to track spending
  const updateExpenseData = async (budgetId: string, amount: number) => {
    if (!currentBusiness) return;
    
    try {
      const now = new Date();
      const year = now.getFullYear();
      
      // Create expense record
      await addDoc(collection(db, 'businesses', currentBusiness.id, 'expenses'), {
        amount: amount,
        date: now,
        budgetId: budgetId,
        year: year,
        category: formData.category,
        description: `Expense for ${formData.name}`,
        createdAt: now
      });
      
      // Update budget spent amount
      const budgetRef = doc(db, 'businesses', currentBusiness.id, 'budgets', budgetId);
      await updateDoc(budgetRef, {
        spent: amount,
        updatedAt: now
      });
      
      console.log(`Added expense of ${amount} to budget ${budgetId}`);
    } catch (err) {
      console.error('Error updating expense data:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader 
        title="Budget Management"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Create Budget
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Budget Summary Cards - Use current year data */}
      <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Card sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 'calc(33% - 16px)' } }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              {currentYear} Budget
            </Typography>
            <Typography variant="h4" component="div">
              {formatCurrency(totalBudget)}
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 'calc(33% - 16px)' } }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              {currentYear} Spent
            </Typography>
            <Typography variant="h4" component="div">
              {formatCurrency(totalSpent)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0}% of budget
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 'calc(33% - 16px)' } }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              {currentYear} Remaining
            </Typography>
            <Typography variant="h4" component="div" color={totalRemaining < 0 ? 'error' : 'inherit'}>
              {formatCurrency(totalRemaining)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Annual Budget Summary */}
      {annualBudgets.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Annual Budgets
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Year</TableCell>
                  <TableCell align="right">Total Budget</TableCell>
                  <TableCell>Categories</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {annualBudgets.map((budget) => (
                  <TableRow key={budget.id} hover>
                    <TableCell>{budget.year}</TableCell>
                    <TableCell align="right">{formatCurrency(budget.totalAmount)}</TableCell>
                    <TableCell>
                      {budget.categories.map((cat, index) => (
                        <Chip 
                          key={index}
                          label={`${cat.name}: ${formatCurrency(cat.amount)}`}
                          size="small"
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {budgets.length === 0 ? (
        <NoDataPlaceholder
          title="No Budgets Found"
          message="You haven't created any budgets yet. Create a budget to start tracking your procurement spending."
          icon={<InsertChartIcon sx={{ fontSize: 60 }} />}
          actionText="Create Budget"
          onAction={handleOpenDialog}
        />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Budget Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Period</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Spent</TableCell>
                <TableCell align="right">Remaining</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {budgets.map((budget) => {
                const remaining = budget.amount - budget.spent;
                const percentUsed = (budget.spent / budget.amount) * 100;
                
                return (
                  <TableRow key={budget.id} hover>
                    <TableCell>{budget.name}</TableCell>
                    <TableCell>{budget.category}</TableCell>
                    <TableCell>{budget.period}</TableCell>
                    <TableCell align="right">{formatCurrency(budget.amount)}</TableCell>
                    <TableCell align="right">{formatCurrency(budget.spent)}</TableCell>
                    <TableCell 
                      align="right"
                      sx={{ color: remaining < 0 ? 'error.main' : 'inherit' }}
                    >
                      {formatCurrency(remaining)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        width: '100%' 
                      }}>
                        <Box
                          sx={{
                            flexGrow: 1,
                            mr: 1,
                            height: 8,
                            borderRadius: 1,
                            bgcolor: 'grey.300',
                            overflow: 'hidden'
                          }}
                        >
                          <Box
                            sx={{
                              height: '100%',
                              width: `${Math.min(percentUsed, 100)}%`,
                              bgcolor: getProgressColor(budget)
                            }}
                          />
                        </Box>
                        <Typography variant="body2">
                          {Math.round(percentUsed)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{budget.status}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Create Budget Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Create New Budget</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Budget Name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              error={!!formErrors.name}
              helperText={formErrors.name}
              required
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth error={!!formErrors.category}>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  label="Category"
                  value={formData.category}
                  onChange={handleCategoryChange}
                  required
                >
                  {BUDGET_CATEGORIES.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.category && (
                  <Typography variant="caption" color="error">
                    {formErrors.category}
                  </Typography>
                )}
              </FormControl>
              
              <FormControl fullWidth error={!!formErrors.period}>
                <InputLabel id="period-label">Period</InputLabel>
                <Select
                  labelId="period-label"
                  label="Period"
                  value={formData.period}
                  onChange={handlePeriodChange}
                  required
                >
                  {BUDGET_PERIODS.map((period) => (
                    <MenuItem key={period} value={period}>
                      {period}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.period && (
                  <Typography variant="caption" color="error">
                    {formErrors.period}
                  </Typography>
                )}
              </FormControl>
            </Box>
            
            <TextField
              fullWidth
              label="Budget Amount"
              name="amount"
              type="number"
              value={formData.amount || ''}
              onChange={handleFormChange}
              error={!!formErrors.amount}
              helperText={formErrors.amount}
              InputProps={{ inputProps: { min: 0 } }}
              required
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(date) => handleDateChange('startDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!formErrors.startDate,
                      helperText: formErrors.startDate,
                    },
                  }}
                />
                
                <DatePicker
                  label="End Date"
                  value={formData.endDate}
                  onChange={(date) => handleDateChange('endDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!formErrors.endDate,
                      helperText: formErrors.endDate,
                    },
                  }}
                />
              </LocalizationProvider>
            </Box>
            
            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                name="status"
                label="Status"
                value={formData.status}
                onChange={handleStatusChange}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleCreateBudget} variant="contained" color="primary">
            Create Budget
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  );
};

export default Budgets; 