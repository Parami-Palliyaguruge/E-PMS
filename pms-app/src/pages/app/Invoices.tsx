import React, { useState, useEffect, useRef } from 'react';
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
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Stack,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  InputAdornment,
  Autocomplete,
  CircularProgress,
  Link,
  FormControlLabel,
  Checkbox,
  FormHelperText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { collection, query, getDocs, addDoc, doc, updateDoc, deleteDoc, where, orderBy, Timestamp, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useBusiness } from '../../contexts/BusinessContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { uploadFileToStorage } from '../../firebase/firebaseUtils';
import { useData } from '../../contexts/DataContext';

// Create an inline NoDataPlaceholder component
interface NoDataPlaceholderProps {
  message: string;
  actionText?: string;
  onAction?: () => void;
}

const NoDataPlaceholder: React.FC<NoDataPlaceholderProps> = ({ message, actionText, onAction }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
    <Typography variant="body1" color="text.secondary" gutterBottom>
      {message}
    </Typography>
    {actionText && onAction && (
      <Button 
        variant="contained" 
        color="primary" 
        startIcon={<AddIcon />}
        onClick={onAction}
        sx={{ mt: 2 }}
      >
        {actionText}
      </Button>
    )}
  </Box>
);

// Invoice status types
type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

// Define the interface for an Invoice
interface Invoice {
  id: string;
  invoiceNumber: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  supplierId: string;
  supplierName: string;
  dateIssued: Date | Timestamp;
  dateDue: Date | Timestamp;
  status: InvoiceStatus;
  total: number;
  items: InvoiceItem[];
  notes?: string;
  attachmentUrl?: string;
  paymentDate?: Date | Timestamp | null;
  paymentReference?: string;
}

// Interface for invoice items
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Form data interface
interface InvoiceFormData {
  id?: string;
  invoiceNumber: string;
  purchaseOrderId: string;
  supplierId: string;
  dateIssued: Date | null;
  dateDue: Date | null;
  status: InvoiceStatus;
  items: InvoiceItem[];
  notes: string;
  attachmentUrl: string;
  paymentDate: Date | null;
  paymentReference: string;
}

// Supplier interface
interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
}

// Purchase Order interface
interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: {
    id: string;
    name: string;
  };
  total: number;
  budgetCategory?: string;
}

// Add these interfaces for budget selection after the other interfaces
interface Budget {
  id: string;
  name: string;
  category: string;
  amount: number;
  spent: number;
  year: number;
  period: string;
  startDate: Date | string;
  endDate: Date | string;
  status: 'active' | 'completed' | 'draft';
  createdAt?: Date;
  updatedAt?: Date;
}

const Invoices: React.FC = () => {
  const { currentBusiness } = useBusiness();
  const { triggerBudgetUpdate, triggerDashboardUpdate } = useData();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<string | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // Add new state variables for budget selection
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [deductFromBudget, setDeductFromBudget] = useState<boolean>(false);

  // Invoice form initial state
  const initialFormState: InvoiceFormData = {
    invoiceNumber: '',
    purchaseOrderId: '',
    supplierId: '',
    dateIssued: new Date(),
    dateDue: new Date(new Date().setDate(new Date().getDate() + 30)), // Default due date 30 days from now
    status: 'pending',
    items: [],
    notes: '',
    attachmentUrl: '',
    paymentDate: null,
    paymentReference: ''
  };

  const [formData, setFormData] = useState<InvoiceFormData>(initialFormState);

  // Load invoices, suppliers, and purchase orders
  useEffect(() => {
    const loadData = async () => {
      if (!currentBusiness) return;
      
      try {
        setLoading(true);
        const businessId = currentBusiness.id;
        
        // Load invoices
        const invoicesQuery = query(
          collection(db, 'businesses', businessId, 'invoices'),
          orderBy('dateIssued', 'desc')
        );
        
        const invoicesSnapshot = await getDocs(invoicesQuery);
        const invoicesData = invoicesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            dateIssued: data.dateIssued,
            dateDue: data.dateDue,
            paymentDate: data.paymentDate || null
          } as Invoice;
        });
        
        setInvoices(invoicesData);
        
        // Load suppliers
        const suppliersQuery = query(
          collection(db, 'businesses', businessId, 'suppliers')
        );
        
        const suppliersSnapshot = await getDocs(suppliersQuery);
        const suppliersData = suppliersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Supplier[];
        
        setSuppliers(suppliersData);
        
        // Load purchase orders
        const purchaseOrdersQuery = query(
          collection(db, 'businesses', businessId, 'purchaseOrders'),
          where('status', 'in', ['submitted', 'received', 'partial'])
        );
        
        const poSnapshot = await getDocs(purchaseOrdersQuery);
        const poData = poSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PurchaseOrder[];
        
        setPurchaseOrders(poData);
        
        // Add budget loading
        const currentYear = new Date().getFullYear();
        const budgetsQuery = query(
          collection(db, 'businesses', businessId, 'budgets'),
          where('year', '==', currentYear)
        );
        
        const budgetsSnapshot = await getDocs(budgetsQuery);
        const budgetsData = budgetsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Budget[];
        
        setBudgets(budgetsData);
        
      } catch (error) {
        console.error('Error loading data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load data',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [currentBusiness]);

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Open dialog to add or edit invoice
  const handleOpenDialog = () => {
    setFormData(initialFormState);
    setInvoiceItems([{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, total: 0 }]);
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentInvoice(null);
  };

  // Handle edit invoice
  const handleEditInvoice = (invoice: Invoice) => {
    setCurrentInvoice(invoice.id);
    
    const formData: InvoiceFormData = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      purchaseOrderId: invoice.purchaseOrderId || '',
      supplierId: invoice.supplierId,
      dateIssued: invoice.dateIssued instanceof Timestamp 
        ? new Date(invoice.dateIssued.seconds * 1000) 
        : invoice.dateIssued,
      dateDue: invoice.dateDue instanceof Timestamp 
        ? new Date(invoice.dateDue.seconds * 1000) 
        : invoice.dateDue,
      status: invoice.status,
      items: invoice.items || [],
      notes: invoice.notes || '',
      attachmentUrl: invoice.attachmentUrl || '',
      paymentDate: invoice.paymentDate 
        ? (invoice.paymentDate instanceof Timestamp 
          ? new Date(invoice.paymentDate.seconds * 1000) 
          : invoice.paymentDate)
        : null,
      paymentReference: invoice.paymentReference || ''
    };
    
    setFormData(formData);
    setInvoiceItems(invoice.items || []);
    setOpenDialog(true);
  };

  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (id: string) => {
    setCurrentInvoice(id);
    setOpenDeleteDialog(true);
  };

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setCurrentInvoice(null);
  };

  // Handle form field changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const name = e.target.name as keyof InvoiceFormData;
    const value = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle date changes
  const handleDateChange = (field: 'dateIssued' | 'dateDue' | 'paymentDate', value: Date | null) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  // Handle supplier selection
  const handleSupplierChange = (event: any, newValue: Supplier | null) => {
    if (newValue) {
      setFormData(prev => ({
        ...prev,
        supplierId: newValue.id
      }));
    }
  };

  // Handle purchase order selection
  const handlePOChange = (event: any, newValue: PurchaseOrder | null) => {
    if (newValue) {
      setFormData(prev => ({
        ...prev,
        purchaseOrderId: newValue.id,
        supplierId: newValue.supplier.id
      }));
      
      // Auto-select budget if PO has a budget category
      if (newValue.budgetCategory && formData.status === 'paid') {
        // Find budget by category
        const matchingBudget = budgets.find(budget => budget.category === newValue.budgetCategory);
        if (matchingBudget) {
          setSelectedBudget(matchingBudget.id);
          setDeductFromBudget(true);
        }
      }
    }
  };

  // Handle invoice item changes
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index][field] = value as never; // Type assertion
    
    // Recalculate total for this item
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? Number(value) : updatedItems[index].quantity;
      const unitPrice = field === 'unitPrice' ? Number(value) : updatedItems[index].unitPrice;
      updatedItems[index].total = quantity * unitPrice;
    }
    
    setInvoiceItems(updatedItems);
  };

  // Add invoice item
  const handleAddItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, total: 0 }
    ]);
  };

  // Remove invoice item
  const handleRemoveItem = (index: number) => {
    if (invoiceItems.length > 1) {
      const updatedItems = invoiceItems.filter((_, i) => i !== index);
      setInvoiceItems(updatedItems);
    }
  };

  // Calculate invoice total
  const calculateTotal = () => {
    // Safety check if invoiceItems is null or undefined
    if (!invoiceItems || !Array.isArray(invoiceItems)) {
      return 0;
    }
    
    // Use safe number handling to ensure we always return a valid number
    return invoiceItems.reduce((sum, item) => {
      const itemTotal = Number(item?.total) || 0;
      return sum + itemTotal;
    }, 0);
  };

  // Handle invoice status change
  const handleStatusChange = (e: SelectChangeEvent) => {
    const status = e.target.value as InvoiceStatus;
    
    setFormData(prev => ({
      ...prev,
      status
    }));
    
    // If status is changed to paid and no payment date is set, set it to today
    if (status === 'paid' && !formData.paymentDate) {
      setFormData(prev => ({
        ...prev,
        paymentDate: new Date()
      }));
    }
    
    // Reset budget selection when status changes from paid to something else
    if (status !== 'paid') {
      setSelectedBudget('');
      setDeductFromBudget(false);
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async () => {
    if (!currentBusiness || !currentInvoice) return;
    
    try {
      const businessId = currentBusiness.id;
      await deleteDoc(doc(db, 'businesses', businessId, 'invoices', currentInvoice));
      
      setInvoices(invoices.filter(invoice => invoice.id !== currentInvoice));
      setSnackbar({
        open: true,
        message: 'Invoice deleted successfully',
        severity: 'success'
      });
      
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete invoice',
        severity: 'error'
      });
    }
  };

  // Add a more comprehensive function to update annual budget summary
  const updateAnnualBudgetSummary = async (budgetCategory: string, amount: number) => {
    if (!currentBusiness) return false;
    
    try {
      const year = new Date().getFullYear();
      const businessId = currentBusiness.id;
      
      console.log(`Updating annual budget summary for year ${year}, amount ${amount}, category ${budgetCategory}`);
      
      // First, get all budgets for the year to calculate accurate totals
      const budgetsRef = collection(db, 'businesses', businessId, 'budgets');
      const budgetsQuery = query(budgetsRef, where('year', '==', year));
      const budgetsSnapshot = await getDocs(budgetsQuery);
      
      // Track totals and categories
      let totalAmount = 0;
      const categoryMap = new Map();
      
      // Process all budgets to rebuild category data
      budgetsSnapshot.forEach(doc => {
        const budget = doc.data();
        const category = budget.category || 'Uncategorized';
        const amount = Number(budget.amount) || 0;
        
        totalAmount += amount;
        
        // Add to category map
        if (categoryMap.has(category)) {
          categoryMap.set(category, categoryMap.get(category) + amount);
        } else {
          categoryMap.set(category, amount);
        }
      });
      
      // Convert map to array format for Firestore
      const categories = Array.from(categoryMap.entries()).map(([name, amount]) => ({
        name,
        amount
      }));
      
      // Check if annual budget document exists
      const annualBudgetRef = doc(db, 'businesses', businessId, 'annualBudgets', year.toString());
      const annualBudgetDoc = await getDoc(annualBudgetRef);
      
      // Update or create the annual budget document
      if (annualBudgetDoc.exists()) {
        await updateDoc(annualBudgetRef, {
          totalAmount,
          categories,
          updatedAt: new Date()
        });
        console.log(`Updated annual budget for ${year} with total: ${totalAmount}`);
      } else {
        await setDoc(annualBudgetRef, {
          year,
          totalAmount,
          categories,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Created annual budget for ${year} with total: ${totalAmount}`);
      }
      
      return true;
    } catch (err) {
      console.error('Error updating annual budget summary:', err);
      return false;
    }
  };

  // Modify the handleBudgetDeduction function to use the comprehensive annual budget update
  const handleBudgetDeduction = async (invoiceTotal: number) => {
    if (!currentBusiness || !selectedBudget || !deductFromBudget) {
      console.error("Cannot deduct: missing business, budget selection, or deduction flag is off");
      return false;
    }
    
    console.log('=== BUDGET DEDUCTION DEBUG ===');
    console.log('Invoice Total:', invoiceTotal);
    console.log('Selected Budget ID:', selectedBudget);
    console.log('Deduct from Budget Flag:', deductFromBudget);
    
    try {
      const businessId = currentBusiness.id;
      
      // 1. Get the current budget document directly (do not rely on the state)
      const budgetRef = doc(db, 'businesses', businessId, 'budgets', selectedBudget);
      const budgetSnap = await getDoc(budgetRef);
      
      if (!budgetSnap.exists()) {
        console.error(`Budget document with ID ${selectedBudget} not found`);
        setSnackbar({
          open: true,
          message: 'Budget not found. Please try again.',
          severity: 'error'
        });
        return false;
      }
      
      // 2. Extract budget data and handle type conversions carefully
      const budgetData = budgetSnap.data();
      console.log('Raw Budget Data from Firestore:', budgetData);
      
      // 3. Safely convert spent amount to number (handle undefined, null, or string values)
      let currentSpent = 0;
      if (budgetData.spent !== undefined && budgetData.spent !== null) {
        currentSpent = typeof budgetData.spent === 'number' 
          ? budgetData.spent 
          : parseFloat(budgetData.spent as string) || 0;
      }
      
      // 4. Calculate new spent amount
      const newSpentAmount = currentSpent + invoiceTotal;
      console.log(`Current spent: ${currentSpent} (${typeof currentSpent}), adding: ${invoiceTotal}, new total: ${newSpentAmount}`);
      
      // 5. Create expense description with PO info if available
      let expenseDescription = `Payment for Invoice ${formData.invoiceNumber}`;
      if (formData.purchaseOrderId) {
        const poInfo = purchaseOrders.find(po => po.id === formData.purchaseOrderId);
        if (poInfo) {
          expenseDescription += ` (PO: ${poInfo.poNumber})`;
        }
      }
      
      // 6. Update budget spent amount - explicit numeric conversion
      await updateDoc(budgetRef, {
        spent: Number(newSpentAmount),
        updatedAt: new Date()
      });
      
      console.log(`Successfully updated budget spent amount to ${newSpentAmount}`);
      
      // 7. Record the expense
      const expensesCollection = collection(db, 'businesses', businessId, 'expenses');
      const expenseRef = await addDoc(expensesCollection, {
        amount: Number(invoiceTotal),
        date: new Date(),
        budgetId: selectedBudget,
        year: new Date().getFullYear(),
        category: budgetData.category || 'Uncategorized',
        description: expenseDescription,
        createdAt: new Date(),
        invoiceId: currentInvoice || null
      });
      
      console.log(`Created expense record with ID ${expenseRef.id}`);
      
      // 8. Update annual budget with our comprehensive function
      await updateAnnualBudgetSummary(budgetData.category || 'Uncategorized', 0); // Zero for amount since we're just refreshing
      
      // After successfully updating budgets, trigger updates via DataContext
      console.log('Budget deduction complete - triggering updates');
      triggerBudgetUpdate();
      triggerDashboardUpdate();
      
      // Budget deduction successful
      return true;
      
    } catch (error) {
      console.error('Critical error in budget deduction:', error);
      setSnackbar({
        open: true,
        message: 'Error deducting from budget: ' + (error instanceof Error ? error.message : 'Unknown error'),
        severity: 'error'
      });
      return false;
    }
  };

  // Modify the handleSubmit function to handle budget deduction
  const handleSubmit = async () => {
    if (!currentBusiness) return;
    
    try {
      console.log('=== INVOICE SUBMISSION DEBUG ===');
      console.log('Invoice Status:', formData.status);
      console.log('Deduct from Budget:', deductFromBudget);
      console.log('Selected Budget ID:', selectedBudget);
      console.log('Total Amount:', calculateTotal());
      
      if (selectedBudget) {
        const budget = budgets.find(b => b.id === selectedBudget);
        console.log('Selected Budget:', budget ? {
          id: budget.id,
          name: budget.name,
          category: budget.category,
          amount: budget.amount,
          spent: budget.spent,
          year: budget.year
        } : 'Not found');
      }
      
      // Add budget validation if deduction is enabled
      if (formData.status === 'paid' && deductFromBudget && !selectedBudget) {
        setSnackbar({
          open: true,
          message: 'Please select a budget to deduct from',
          severity: 'error'
        });
        return;
      }
      
      const businessId = currentBusiness.id;
      const invoiceTotal = calculateTotal();
      const submitData = {
        ...formData,
        items: invoiceItems,
        total: invoiceTotal,
        dateIssued: Timestamp.fromDate(formData.dateIssued as Date),
        dateDue: Timestamp.fromDate(formData.dateDue as Date),
        paymentDate: formData.paymentDate ? Timestamp.fromDate(formData.paymentDate as Date) : null,
        purchaseOrderNumber: formData.purchaseOrderId ? 
          purchaseOrders.find(po => po.id === formData.purchaseOrderId)?.poNumber : '',
        supplierName: suppliers.find(s => s.id === formData.supplierId)?.name || ''
      };
      
      let budgetDeductionSuccess = false;
      
      if (currentInvoice) {
        // Update existing invoice
        await updateDoc(doc(db, 'businesses', businessId, 'invoices', currentInvoice), submitData);
        
        // Handle budget deduction if invoice is being marked as paid
        if (formData.status === 'paid' && deductFromBudget && selectedBudget) {
          console.log(`Attempting to deduct ${invoiceTotal} from budget ${selectedBudget}...`);
          budgetDeductionSuccess = await handleBudgetDeduction(invoiceTotal);
          console.log('Budget deduction result:', budgetDeductionSuccess ? 'SUCCESS' : 'FAILED');
        }
        
        // Update local state
        setInvoices(prev => prev.map(invoice => 
          invoice.id === currentInvoice ? { ...invoice, ...submitData, id: currentInvoice } as Invoice : invoice
        ));
        
        setSnackbar({
          open: true,
          message: 'Invoice updated successfully' + 
            (formData.status === 'paid' && deductFromBudget ? 
              (budgetDeductionSuccess ? ' and budget updated' : ' but budget update failed') : ''),
          severity: budgetDeductionSuccess ? 'success' : 'warning'
        });
      } else {
        // Add new invoice
        const docRef = await addDoc(collection(db, 'businesses', businessId, 'invoices'), submitData);
        
        // Handle budget deduction if new invoice is marked as paid
        if (formData.status === 'paid' && deductFromBudget && selectedBudget) {
          console.log(`Attempting to deduct ${invoiceTotal} from budget ${selectedBudget}...`);
          budgetDeductionSuccess = await handleBudgetDeduction(invoiceTotal);
          console.log('Budget deduction result:', budgetDeductionSuccess ? 'SUCCESS' : 'FAILED');
        }
        
        // Update local state
        const newInvoice = { ...submitData, id: docRef.id } as Invoice;
        setInvoices(prev => [newInvoice, ...prev]);
        
        setSnackbar({
          open: true,
          message: 'Invoice added successfully' + 
            (formData.status === 'paid' && deductFromBudget ? 
              (budgetDeductionSuccess ? ' and budget updated' : ' but budget update failed') : ''),
          severity: budgetDeductionSuccess || !deductFromBudget ? 'success' : 'warning'
        });
      }
      
      handleCloseDialog();
      
      // Always trigger dashboard update after creating/updating an invoice
      triggerDashboardUpdate();
      
      // Reload budgets if there was a budget update to reflect changes
      if (budgetDeductionSuccess) {
        const loadBudgets = async () => {
          if (!currentBusiness) return;
          
          try {
            // Load current year budgets for the current business
            const currentYear = new Date().getFullYear();
            const budgetsQuery = query(
              collection(db, 'businesses', businessId, 'budgets'),
              where('year', '==', currentYear)
            );
            
            const budgetsSnapshot = await getDocs(budgetsQuery);
            const budgetsData = budgetsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Budget[];
            
            setBudgets(budgetsData);
            console.log('Budgets reloaded after deduction');
          } catch (err) {
            console.error('Error reloading budgets:', err);
          }
        };
        
        loadBudgets();
      }
    } catch (error) {
      console.error('Error submitting invoice:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save invoice: ' + (error instanceof Error ? error.message : 'Unknown error'),
        severity: 'error'
      });
    }
  };

  // Handle closing snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Get selected purchase order
  const getSelectedPO = () => {
    if (!formData.purchaseOrderId) return null;
    return purchaseOrders.find(po => po.id === formData.purchaseOrderId) || null;
  };
  
  // Get selected supplier
  const getSelectedSupplier = () => {
    if (!formData.supplierId) return null;
    return suppliers.find(s => s.id === formData.supplierId) || null;
  };

  // Filter invoices based on status and search query
  const filteredInvoices = invoices.filter(invoice => {
    // Filter by status
    if (filterStatus !== 'all' && invoice.status !== filterStatus) {
      return false;
    }
    
    // Filter by search query (invoice number, supplier name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.supplierName.toLowerCase().includes(query) ||
        (invoice.purchaseOrderNumber && invoice.purchaseOrderNumber.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  // Get status chip color
  const getStatusChipColor = (status: InvoiceStatus): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  // Add function to handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !currentBusiness) {
      return;
    }
    
    try {
      setUploading(true);
      const file = event.target.files[0];
      
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'File size exceeds 10MB limit',
          severity: 'error'
        });
        setUploading(false);
        return;
      }
      
      // Upload file to Firebase Storage
      const downloadURL = await uploadFileToStorage(
        file, 
        'invoices', 
        currentBusiness.id
      );
      
      // Set the attachment URL in form data
      setFormData(prev => ({
        ...prev,
        attachmentUrl: downloadURL
      }));
      
      setSnackbar({
        open: true,
        message: 'File uploaded successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      setSnackbar({
        open: true,
        message: 'Error uploading file',
        severity: 'error'
      });
    } finally {
      setUploading(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Function to handle file open/download
  const handleOpenFile = (url: string) => {
    if (!url) return;
    
    // Check if it's a PDF file
    if (url.toLowerCase().endsWith('.pdf')) {
      setPreviewUrl(url);
      setPreviewDialog(true);
    } else {
      // For other file types, open in a new tab
      window.open(url, '_blank');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Invoices
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Invoice
        </Button>
      </Box>

      {/* Search and filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ width: { xs: '100%', sm: '48%', md: '32%' } }}>
            <TextField
              fullWidth
              placeholder="Search by invoice #, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Box sx={{ width: { xs: '100%', sm: '48%', md: '24%' } }}>
            <FormControl fullWidth>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value as InvoiceStatus | 'all')}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      {/* Invoices table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice #</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>PO #</TableCell>
              <TableCell>Date Issued</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Doc</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Loading...</TableCell>
              </TableRow>
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <NoDataPlaceholder 
                    message="No invoices found" 
                    actionText="Add Invoice"
                    onAction={handleOpenDialog}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.supplierName}</TableCell>
                    <TableCell>{invoice.purchaseOrderNumber || '-'}</TableCell>
                    <TableCell>
                      {invoice.dateIssued instanceof Timestamp 
                        ? formatDate(new Date(invoice.dateIssued.seconds * 1000))
                        : formatDate(invoice.dateIssued)}
                    </TableCell>
                    <TableCell>
                      {invoice.dateDue instanceof Timestamp 
                        ? formatDate(new Date(invoice.dateDue.seconds * 1000))
                        : formatDate(invoice.dateDue)}
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.total)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)} 
                        color={getStatusChipColor(invoice.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {invoice.attachmentUrl ? (
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleOpenFile(invoice.attachmentUrl || '')}
                          title="View Document"
                        >
                          <FileIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditInvoice(invoice)}
                          aria-label="edit"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDeleteDialog(invoice.id)}
                          aria-label="delete"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredInvoices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Add/Edit Invoice Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{currentInvoice ? 'Edit Invoice' : 'Add New Invoice'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Basic invoice details */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                <TextField
                  fullWidth
                  label="Invoice Number"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleFormChange}
                  required
                />
              </Box>
              <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                <FormControl fullWidth>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={formData.status}
                    label="Status"
                    onChange={handleStatusChange}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="overdue">Overdue</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Purchase Order and Supplier selection */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                <Autocomplete
                  options={purchaseOrders}
                  getOptionLabel={(option) => `${option.poNumber} - ${option.supplier.name}`}
                  value={getSelectedPO()}
                  onChange={handlePOChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      label="Related Purchase Order"
                    />
                  )}
                />
              </Box>
              <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                <Autocomplete
                  options={suppliers}
                  getOptionLabel={(option) => option.name}
                  value={getSelectedSupplier()}
                  onChange={handleSupplierChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      label="Supplier"
                      required
                    />
                  )}
                  disabled={!!formData.purchaseOrderId} // Disable if PO is selected
                />
              </Box>
            </Box>

            {/* Date fields */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                <DatePicker
                  label="Date Issued"
                  value={formData.dateIssued}
                  onChange={(date) => handleDateChange('dateIssued', date)}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true 
                    } 
                  }}
                />
              </Box>
              <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                <DatePicker
                  label="Due Date"
                  value={formData.dateDue}
                  onChange={(date) => handleDateChange('dateDue', date)}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true,
                      error: !!validationErrors.dateDue,
                      helperText: validationErrors.dateDue,
                      required: true
                    } 
                  }}
                />
              </Box>
            </Box>

            {/* Payment details - show only if status is paid */}
            {formData.status === 'paid' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Payment Details
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                    <DatePicker
                      label="Payment Date"
                      value={formData.paymentDate}
                      onChange={(date) => handleDateChange('paymentDate', date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: "outlined"
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                    <TextField
                      fullWidth
                      label="Payment Reference"
                      name="paymentReference"
                      value={formData.paymentReference || ''}
                      onChange={handleFormChange}
                      variant="outlined"
                    />
                  </Box>
                  
                  {/* Budget Deduction Section */}
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1, mt: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={deductFromBudget}
                            onChange={(e) => setDeductFromBudget(e.target.checked)}
                            name="deductFromBudget"
                          />
                        }
                        label="Deduct from budget?"
                      />
                      
                      {deductFromBudget && (
                        <FormControl fullWidth sx={{ mt: 2 }}>
                          <InputLabel id="budget-select-label">Budget</InputLabel>
                          <Select
                            labelId="budget-select-label"
                            value={selectedBudget}
                            onChange={(e) => {
                              console.log(`Selected budget: ${e.target.value}`);
                              setSelectedBudget(e.target.value);
                            }}
                            label="Budget"
                            disabled={!deductFromBudget}
                          >
                            <MenuItem value="">
                              <em>Select a budget</em>
                            </MenuItem>
                            {budgets.map((budget) => {
                              const remaining = budget.amount - budget.spent;
                              const isOverBudget = remaining < 0;
                              const remainingText = isOverBudget 
                                ? `Over budget by ${formatCurrency(Math.abs(remaining))}` 
                                : `Remaining: ${formatCurrency(remaining)}`;
                              
                              return (
                                <MenuItem 
                                  key={budget.id} 
                                  value={budget.id}
                                  disabled={isOverBudget}
                                  sx={{ 
                                    color: isOverBudget ? 'error.main' : 'inherit',
                                    fontWeight: remaining < calculateTotal() ? 'bold' : 'normal'
                                  }}
                                >
                                  {budget.name} - {budget.category} ({remainingText})
                                </MenuItem>
                              )
                            })}
                          </Select>
                          {deductFromBudget && !selectedBudget && (
                            <FormHelperText error>Please select a budget</FormHelperText>
                          )}
                          <FormHelperText>
                            {selectedBudget && (
                              <>
                                You are about to deduct <strong>{formatCurrency(calculateTotal())}</strong> from this budget.
                              </>
                            )}
                          </FormHelperText>
                        </FormControl>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Invoice line items */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Invoice Items</Typography>
              {invoiceItems.map((item, index) => (
                <Box key={item.id} sx={{ mb: 2, display: 'flex', gap: 1 }}>
                  <TextField
                    label="Description"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    sx={{ flexGrow: 2 }}
                  />
                  <TextField
                    label="Quantity"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1 } }}
                    sx={{ width: '100px' }}
                  />
                  <TextField
                    label="Unit Price"
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                    sx={{ width: '150px' }}
                  />
                  <TextField
                    label="Total"
                    type="number"
                    value={item.total}
                    InputProps={{ readOnly: true }}
                    sx={{ width: '150px' }}
                  />
                  <IconButton color="error" onClick={() => handleRemoveItem(index)} disabled={invoiceItems.length === 1}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button startIcon={<AddIcon />} onClick={handleAddItem}>
                Add Item
              </Button>
            </Box>

            {/* Invoice total */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Typography variant="h6">
                Total: {formatCurrency(calculateTotal())}
              </Typography>
            </Box>

            {/* Notes */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                multiline
                rows={3}
              />
            </Box>

            {/* Attachment Upload */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Invoice Document
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  id="invoice-file-upload"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                />
                <label htmlFor="invoice-file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload Document'}
                  </Button>
                </label>
                
                {uploading && (
                  <CircularProgress size={24} sx={{ ml: 2 }} />
                )}
                
                {formData.attachmentUrl && (
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                    <FileIcon color="primary" sx={{ mr: 1 }} />
                    <Link
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleOpenFile(formData.attachmentUrl);
                      }}
                      sx={{ cursor: 'pointer' }}
                    >
                      View Attached Document
                    </Link>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={!formData.invoiceNumber || !formData.supplierId}
          >
            {currentInvoice ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this invoice? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteInvoice} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Document Preview Dialog */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Document Preview
          <IconButton
            onClick={() => setPreviewDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ height: '70vh', width: '100%' }}>
            <iframe 
              src={previewUrl} 
              style={{ width: '100%', height: '100%', border: 'none' }} 
              title="Document Preview"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Close</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => window.open(previewUrl, '_blank')}
          >
            Open in New Tab
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Invoices; 