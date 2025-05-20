/* eslint-disable */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Tabs, 
  Tab, 
  Tooltip,
  TablePagination, 
  Autocomplete,
  InputAdornment,
  FormHelperText,
  Divider,
  Pagination
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  Visibility as ViewIcon, 
  Search as SearchIcon, 
  FilterList as FilterIcon, 
  Print as PrintIcon, 
  Send as SendIcon,
  Close as CloseIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Save as SaveIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Address } from '../../types';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { SelectChangeEvent } from '@mui/material';
import { sendEmail, generatePOAttachment } from '../../utils/emailService';

interface OrderItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productName?: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: Supplier;
  status: 'draft' | 'sent' | 'approved' | 'received' | 'cancelled' | 'pending_approval';
  createdAt: string;
  orderDate: string;
  expectedDeliveryDate: string;
  deliveryAddress: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  notes: string;
  currency: string;
  budgetCategory: string;
  updatedAt?: string;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const statusColors = {
  draft: '#607d8b',
  sent: '#2196f3',
  approved: '#ff9800',
  received: '#4caf50',
  cancelled: '#f44336'
};

const PurchaseOrders: React.FC = () => {
  const { currentUser } = useAuth();
  const { currentBusiness } = useBusiness();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [filteredPOs, setFilteredPOs] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [currentPO, setCurrentPO] = useState<PurchaseOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderItems, setOrderItems] = useState<PurchaseOrder['items']>([]);
  const [sortBy, setSortBy] = useState('poNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [itemsPerPage] = useState(10);

  // Form state
  const [formData, setFormData] = useState({
    poNumber: '',
    supplier: { id: '', name: '', email: '' },
    status: 'draft' as PurchaseOrder['status'],
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    deliveryAddress: currentBusiness?.address 
      ? (typeof currentBusiness.address === 'string' 
          ? currentBusiness.address 
          : `${currentBusiness.address.street}, ${currentBusiness.address.city}, ${currentBusiness.address.state} ${currentBusiness.address.zipCode}, ${currentBusiness.address.country}`) 
      : '',
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0,
    notes: '',
    currency: 'USD',
    budgetCategory: '',
    items: [] as OrderItem[]
  });

  // Add validation errors object
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Add budget categories - match the ones from Budgets.tsx
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

  // Load purchase orders
  useEffect(() => {
    const loadData = async () => {
      if (!currentBusiness) return;
      
      try {
        setLoading(true);
        
        // Fetch purchase orders
        const poQuery = query(
          collection(db, 'businesses', currentBusiness.id, 'purchaseOrders'),
          orderBy('createdAt', 'desc')
        );
        const poSnapshot = await getDocs(poQuery);
        const poData = poSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as PurchaseOrder));
        
        setPurchaseOrders(poData);
        setFilteredPOs(poData);
        
        // Fetch suppliers
        const suppliersQuery = query(
          collection(db, 'businesses', currentBusiness.id, 'suppliers')
        );
        const suppliersSnapshot = await getDocs(suppliersQuery);
        const suppliersData = suppliersSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          name: doc.data().name,
          email: doc.data().email || ''
        }));
        setSuppliers(suppliersData);

        // Fetch products
        const productsQuery = query(
          collection(db, 'businesses', currentBusiness.id, 'products')
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          name: doc.data().name,
          description: doc.data().description || '',
          unitPrice: doc.data().unitPrice || 0
        }));
        setProducts(productsData);
        
      } catch (error) {
        console.error('Error loading purchase orders:', error);
        setSnackbar({
          open: true,
          message: 'Error loading purchase orders',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentBusiness]);

  // Filter purchase orders
  useEffect(() => {
    let result = [...purchaseOrders];
    
    // Apply search term
    if (searchTerm.trim()) {
      result = result.filter(po => 
        po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(po => po.status === statusFilter);
    }
    
    setFilteredPOs(result);
  }, [searchTerm, statusFilter, purchaseOrders]);

  // Calculate totals when order items change
  useEffect(() => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal + formData.tax + formData.shipping;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      total
    }));
  }, [orderItems, formData.tax, formData.shipping]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = () => {
    setOrderItems([
      {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0
      }
    ]);
    
    // Get current date in YYYY-MM-DD format
    const today = new Date();
    const safeToday = isNaN(today.getTime()) ? '' : today.toISOString().split('T')[0];
    
    setFormData({
      poNumber: `PO-${Date.now()}`,
      supplier: { id: '', name: '', email: '' },
      status: 'draft',
      orderDate: safeToday,
      expectedDeliveryDate: '',
      deliveryAddress: currentBusiness?.address 
        ? (typeof currentBusiness.address === 'string' 
            ? currentBusiness.address 
            : `${currentBusiness.address.street}, ${currentBusiness.address.city}, ${currentBusiness.address.state} ${currentBusiness.address.zipCode}, ${currentBusiness.address.country}`) 
        : '',
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      notes: '',
      currency: 'USD',
      budgetCategory: '',
      items: []
    });
    
    setOpenDialog(true);
    setCurrentPO(null);
  };

  const handleViewPO = (po: PurchaseOrder) => {
    setCurrentPO(po);
    setViewDialog(true);
  };

  const handleEditPO = (po: PurchaseOrder) => {
    setCurrentPO(po);
    setFormData({
      poNumber: po.poNumber,
      supplier: po.supplier,
      status: po.status,
      orderDate: po.orderDate,
      expectedDeliveryDate: po.expectedDeliveryDate,
      deliveryAddress: po.deliveryAddress,
      subtotal: po.subtotal,
      tax: po.tax,
      shipping: po.shipping,
      total: po.total,
      notes: po.notes,
      currency: po.currency,
      budgetCategory: po.budgetCategory,
      items: po.items
    });
    setOrderItems(po.items);
    setOpenDialog(true);
  };

  const handleDeletePO = async (id: string) => {
    if (!currentBusiness) return;
    
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      try {
        await deleteDoc(doc(db, 'businesses', currentBusiness.id, 'purchaseOrders', id));
        setPurchaseOrders(prev => prev.filter(po => po.id !== id));
        setSnackbar({
          open: true,
          message: 'Purchase order deleted successfully',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error deleting purchase order:', error);
        setSnackbar({
          open: true,
          message: 'Error deleting purchase order',
          severity: 'error'
        });
      }
    }
  };

  const handleAddItem = () => {
    setOrderItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // If this is a product selection, update all related fields
        if (field === 'productName') {
          const selectedProduct = products.find(p => p.name === value);
          if (selectedProduct) {
            updatedItem.name = selectedProduct.name;
            updatedItem.description = selectedProduct.description;
            updatedItem.unitPrice = selectedProduct.unitPrice;
            updatedItem.total = updatedItem.quantity * selectedProduct.unitPrice;
          }
        }
        
        // Recalculate total if quantity or price changes
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        
        // Ensure name is set even if no product is selected
        if (!updatedItem.name && updatedItem.productName) {
          updatedItem.name = updatedItem.productName;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const handleProductSelect = (id: string, product: Product | null) => {
    if (!product) return;
    
    setOrderItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          name: product.name,
          description: product.description,
          unitPrice: product.unitPrice,
          total: item.quantity * product.unitPrice
        };
      }
      return item;
    }));
  };

  const handleSubmit = async () => {
    if (!currentBusiness || !currentUser) return;
    
    // Validate
    const errors: Record<string, string> = {};
    
    if (!formData.supplier.id) {
      errors.supplier = 'Please select a supplier';
    }
    
    if (!formData.expectedDeliveryDate) {
      errors.expectedDeliveryDate = 'Please select an expected delivery date';
    }
    
    if (orderItems.length === 0) {
      errors.items = 'Please add at least one item';
    }

    // Validate each item has at least a name/productName
    orderItems.forEach((item, index) => {
      if (!item.name && !item.productName) {
        errors[`items[${index}].name`] = 'Please select a product or enter a name';
      }
    });
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setSnackbar({
        open: true,
        message: 'Please fix the errors before submitting',
        severity: 'error'
      });
      return;
    }

    try {
      // Safely get current date in ISO format
      const currentDate = new Date();
      const now = isNaN(currentDate.getTime()) ? new Date(0).toISOString() : currentDate.toISOString();
      
      // Ensure all items have a name
      const validatedItems = orderItems.map(item => ({
        ...item,
        name: item.name || item.productName || 'Unnamed Product'
      }));
      
      const poData: Omit<PurchaseOrder, 'id'> = {
        poNumber: formData.poNumber,
        supplier: formData.supplier,
        status: formData.status,
        orderDate: formData.orderDate,
        expectedDeliveryDate: formData.expectedDeliveryDate,
        deliveryAddress: formData.deliveryAddress,
        items: validatedItems,
        subtotal: formData.subtotal,
        tax: formData.tax,
        shipping: formData.shipping,
        total: formData.total,
        notes: formData.notes,
        currency: formData.currency,
        budgetCategory: formData.budgetCategory,
        createdAt: currentPO ? currentPO.createdAt : now,
        updatedAt: now
      };
      
      let id: string;
      if (currentPO) {
        id = currentPO.id;
        await setDoc(
          doc(db, 'businesses', currentBusiness.id, 'purchaseOrders', id),
          poData,
          { merge: true }
        );
      } else {
        const newDocRef = doc(collection(db, 'businesses', currentBusiness.id, 'purchaseOrders'));
        id = newDocRef.id;
        await setDoc(newDocRef, poData);
      }
      
      const newPO = { id, ...poData } as PurchaseOrder;
      
      if (currentPO) {
        setPurchaseOrders(prev => prev.map(po => po.id === id ? newPO : po));
      } else {
        setPurchaseOrders(prev => [newPO, ...prev]);
      }
      
      setOpenDialog(false);
      setSnackbar({
        open: true,
        message: `Purchase order ${currentPO ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving purchase order:', error);
      setSnackbar({
        open: true,
        message: `Error ${currentPO ? 'updating' : 'creating'} purchase order`,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Helper functions
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      'draft': 'Draft',
      'pending_approval': 'Pending Approval',
      'approved': 'Approved',
      'sent': 'Sent to Supplier',
      'received': 'Received',
      'cancelled': 'Cancelled'
    };
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    const colors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
      'draft': 'default',
      'pending_approval': 'warning',
      'approved': 'info',
      'sent': 'primary',
      'received': 'success',
      'cancelled': 'error'
    };
    return colors[status] || 'default';
  };

  // Filter and sort purchase orders
  const filteredPurchaseOrders = useMemo(() => {
    let filtered = [...purchaseOrders];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(po => 
        po.poNumber.toLowerCase().includes(term) || 
        po.supplier.name.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(po => po.status === statusFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'poNumber':
          comparison = a.poNumber.localeCompare(b.poNumber);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'expectedDeliveryDate':
          if (!a.expectedDeliveryDate) return 1;
          if (!b.expectedDeliveryDate) return -1;
          comparison = new Date(a.expectedDeliveryDate).getTime() - new Date(b.expectedDeliveryDate).getTime();
          break;
        case 'total':
          comparison = a.total - b.total;
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [purchaseOrders, searchTerm, statusFilter, sortBy, sortDirection]);

  // Update the handleApproveOrder function to improve logging
  const handleApproveOrder = (poId: string) => {
    if (!currentBusiness) return;
    
    console.log('Starting approval process for PO:', poId);
    
    // Safely get current date in ISO format
    const currentDate = new Date();
    const now = isNaN(currentDate.getTime()) ? new Date(0).toISOString() : currentDate.toISOString();
    
    const poRef = doc(db, 'businesses', currentBusiness.id, 'purchaseOrders', poId);
    
    // First get the current PO data
    getDoc(poRef).then((docSnap) => {
      if (docSnap.exists()) {
        const poData = { id: poId, ...docSnap.data() } as PurchaseOrder;
        console.log('Found PO data:', poData);
        
        // Update the status
        setDoc(poRef, { status: 'approved', updatedAt: now }, { merge: true })
          .then(() => {
            console.log('PO status updated to approved');
            
            setSnackbar({
              open: true,
              message: 'Purchase order approved successfully',
              severity: 'success'
            });
            
            // Send detailed email notification to supplier
            const updatedPO = {
              ...poData,
              status: 'approved' as PurchaseOrder['status'],
              updatedAt: now
            };
            
            console.log('Sending notification for approved PO:', updatedPO);
            sendSupplierNotification(updatedPO, 'approved');
            
            // Update local state
            setPurchaseOrders(prev => prev.map(po => 
              po.id === poId ? { ...po, status: 'approved', updatedAt: now } : po
            ));
          })
          .catch(error => {
            console.error('Error updating PO status:', error);
            setSnackbar({
              open: true,
              message: `Error approving purchase order: ${error instanceof Error ? error.message : String(error)}`,
              severity: 'error'
            });
          });
      } else {
        console.error('PO not found:', poId);
        setSnackbar({
          open: true,
          message: `Error: Purchase order not found`,
          severity: 'error'
        });
      }
    }).catch(error => {
      console.error('Error fetching purchase order details:', error);
      setSnackbar({
        open: true,
        message: `Error fetching purchase order details: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error'
      });
    });
  };

  // Update the handleMarkReceived function to include email notification
  const handleMarkReceived = (poId: string) => {
    if (!currentBusiness) return;
    
    // Safely get current date in ISO format
    const currentDate = new Date();
    const now = isNaN(currentDate.getTime()) ? new Date(0).toISOString() : currentDate.toISOString();
    
    // Logic to mark PO as received
    const poRef = doc(db, 'businesses', currentBusiness.id, 'purchaseOrders', poId);
    
    // First get the PO data to use in the email
    getDoc(poRef).then((docSnap) => {
      if (docSnap.exists()) {
        const poData = { id: poId, ...docSnap.data() } as PurchaseOrder;
        
        // Update the status
        setDoc(poRef, { status: 'received', updatedAt: now }, { merge: true })
          .then(() => {
            setSnackbar({
              open: true,
              message: 'Purchase order marked as received',
              severity: 'success'
            });
            
            // Send email notification to supplier
            const updatedPO = {
              ...poData,
              status: 'received' as PurchaseOrder['status'],
              updatedAt: now
            };
            sendSupplierNotification(updatedPO, 'received');
            
            // Update the local state
            setPurchaseOrders(prev => prev.map(po => 
              po.id === poId ? { ...po, status: 'received', updatedAt: now } : po
            ));
          })
          .catch(error => {
            setSnackbar({
              open: true,
              message: `Error updating purchase order: ${error instanceof Error ? error.message : String(error)}`,
              severity: 'error'
            });
          });
      }
    }).catch(error => {
      console.error('Error fetching purchase order details:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching purchase order details',
        severity: 'error'
      });
    });
  };

  // Update the sendSupplierNotification function with better logging
  const sendSupplierNotification = (poData: PurchaseOrder | Omit<PurchaseOrder, 'id'>, status: string) => {
    console.log('Starting supplier notification process');
    console.log('PO Data:', poData);
    console.log('Status:', status);
    
    // Get supplier email directly from the PO data
    const supplierEmail = poData.supplier.email;
    
    if (!supplierEmail) {
      console.error('No email found for supplier:', poData.supplier);
      setSnackbar({
        open: true,
        message: `Cannot send email: No email address found for supplier ${poData.supplier.name}`,
        severity: 'error'
      });
      return;
    }
    
    console.log('Using supplier email:', supplierEmail);
    
    let subject = `Purchase Order ${poData.poNumber} has been ${status}`;
    console.log('Email subject:', subject);
    
    let emailBody = `Dear ${poData.supplier.name},\n\n`;
    
    // Build email body based on status
    if (status === 'approved') {
      console.log('Building approved PO email body');
      emailBody += `We are pleased to inform you that Purchase Order ${poData.poNumber} has been approved.\n\n`;
      emailBody += `Order Details:\n`;
      emailBody += `Order Date: ${new Date(poData.orderDate).toLocaleDateString()}\n`;
      emailBody += `Expected Delivery Date: ${new Date(poData.expectedDeliveryDate).toLocaleDateString()}\n`;
      emailBody += `Delivery Address: ${poData.deliveryAddress}\n\n`;
      
      emailBody += `Items:\n`;
      poData.items.forEach((item, index) => {
        emailBody += `${index + 1}. ${item.name || item.productName || 'Product'} - Quantity: ${item.quantity}, Unit Price: ${poData.currency} ${item.unitPrice.toFixed(2)}, Total: ${poData.currency} ${item.total.toFixed(2)}\n`;
      });
      
      emailBody += `\nSubtotal: ${poData.currency} ${poData.subtotal.toFixed(2)}\n`;
      emailBody += `Tax: ${poData.currency} ${Number(poData.tax || 0).toFixed(2)}\n`;
      emailBody += `Shipping: ${poData.currency} ${Number(poData.shipping || 0).toFixed(2)}\n`;
      emailBody += `Total: ${poData.currency} ${Number(poData.total).toFixed(2)}\n\n`;
      
      if (poData.notes) {
        emailBody += `Notes: ${poData.notes}\n\n`;
      }
      
      emailBody += `Please review this order carefully and confirm your acceptance.\n`;
      emailBody += `A copy of this order is attached for your records.\n`;
    } else if (status === 'sent') {
      console.log('Building sent PO email body');
      emailBody += `Purchase Order ${poData.poNumber} has been sent to you.\n\n`;
      emailBody += `The total amount is ${poData.currency} ${Number(poData.total).toFixed(2)}.\n\n`;
      emailBody += `Please review the order details and proceed accordingly.\n`;
    } else if (status === 'received') {
      console.log('Building received PO email body');
      emailBody += `We wanted to inform you that Purchase Order ${poData.poNumber} has been received by us.\n\n`;
      emailBody += `Order Details:\n`;
      emailBody += `Order ID: ${poData.poNumber}\n`;
      emailBody += `Received Date: ${new Date().toLocaleDateString()}\n`;
      emailBody += `Original Order Date: ${new Date(poData.orderDate).toLocaleDateString()}\n\n`;
      
      emailBody += `All items have been checked and verified as per our order specifications.\n`;
      emailBody += `Thank you for your prompt delivery and quality service.\n\n`;
      
      emailBody += `If you have any questions regarding this order, please contact our procurement department.\n`;
    }
    
    emailBody += `\nRegards,\n${currentBusiness?.name || 'Our Company'}`;
    
    console.log('Email body preview:', emailBody.substring(0, 100) + '...');
    
    // Generate attachment for approved POs
    const attachmentData = status === 'approved' ? generatePOAttachment(poData as any) : undefined;
    console.log('Attachment data:', attachmentData);
    
    // Send the email using our email service
    console.log('Calling sendEmail function');
    sendEmail(supplierEmail, subject, emailBody, attachmentData)
      .then(result => {
        console.log('Email sent successfully:', result);
        setSnackbar({
          open: true,
          message: `Notification email sent to ${poData.supplier.name}`,
          severity: 'success'
        });
      })
      .catch(error => {
        console.error('Error sending email:', error);
        setSnackbar({
          open: true,
          message: `Error sending email to ${poData.supplier.name}: ${error.message}`,
          severity: 'error'
        });
      });
  };

  // Also update the handleSendPO function to align with the new pattern
  const handleSendPO = (po: PurchaseOrder) => {
    if (!currentBusiness) return;
    
    // Safely get current date in ISO format
    const currentDate = new Date();
    const now = isNaN(currentDate.getTime()) ? new Date(0).toISOString() : currentDate.toISOString();
    
    // Logic to send PO to supplier
    const poRef = doc(db, 'businesses', currentBusiness.id, 'purchaseOrders', po.id);
    setDoc(poRef, { status: 'sent', updatedAt: now }, { merge: true })
      .then(() => {
        setSnackbar({
          open: true,
          message: 'Purchase order sent to supplier successfully',
          severity: 'success'
        });
        
        // Send email notification to supplier
        sendSupplierNotification(po, 'sent');
        
        // Update the local state
        setPurchaseOrders(prev => prev.map(p => 
          p.id === po.id ? { ...p, status: 'sent', updatedAt: now } : p
        ));
      })
      .catch(error => {
        setSnackbar({
          open: true,
          message: `Error sending purchase order: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error'
        });
      });
  };

  // Load purchase orders function
  const loadPurchaseOrders = useCallback(() => {
    if (!currentBusiness) return;
    
    setLoading(true);
    getDocs(collection(db, 'businesses', currentBusiness.id, 'purchaseOrders'))
      .then(snapshot => {
        const poList: PurchaseOrder[] = [];
        snapshot.forEach(doc => {
          poList.push({ id: doc.id, ...doc.data() } as PurchaseOrder);
        });
        setPurchaseOrders(poList);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading purchase orders: ', error);
        setSnackbar({
          open: true,
          message: `Error loading purchase orders: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error'
        });
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBusiness]); // Remove 'db' from dependencies

  // Add missing calculate functions
  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const calculateTotal = () => {
    // Ensure all values are numbers and handle potential undefined/NaN values
    try {
      const subtotal = calculateSubtotal();
      const tax = formData.tax ? parseFloat(formData.tax.toString()) : 0;
      const shipping = formData.shipping ? parseFloat(formData.shipping.toString()) : 0;
      
      const total = Number(subtotal) + Number(tax) + Number(shipping);
      return isNaN(total) ? 0 : total;
    } catch (error) {
      console.error('Error calculating total:', error);
      return 0;
    }
  };

  // Handle form change
  const handleFormChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is updated
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Update the handleFormChangeEvent function to handle Select changes
  const handleFormChangeEvent = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<any>) => {
    const { name, value } = e.target;
    handleFormChange(name, value);
  };

  // Add handleSavePO function
  const handleSavePO = async (status: PurchaseOrder['status']) => {
    if (!currentBusiness || !currentUser) return;
    
    // Validate
    const errors: Record<string, string> = {};
    
    if (!formData.supplier.id) {
      errors.supplier = 'Please select a supplier';
    }
    
    if (!formData.expectedDeliveryDate) {
      errors.expectedDeliveryDate = 'Please select an expected delivery date';
    }
    
    if (orderItems.length === 0) {
      errors.items = 'Please add at least one item';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setSnackbar({
        open: true,
        message: 'Please fix the errors before submitting',
        severity: 'error'
      });
      return;
    }
    
    try {
      // Safely get current date in ISO format
      const currentDate = new Date();
      const now = isNaN(currentDate.getTime()) ? new Date(0).toISOString() : currentDate.toISOString();
      
      const poData = {
        poNumber: formData.poNumber,
        supplier: formData.supplier,
        status: status,
        orderDate: formData.orderDate,
        expectedDeliveryDate: formData.expectedDeliveryDate,
        deliveryAddress: formData.deliveryAddress,
        items: orderItems,
        subtotal: calculateSubtotal(),
        tax: formData.tax,
        shipping: formData.shipping,
        total: calculateTotal(),
        notes: formData.notes,
        currency: formData.currency,
        budgetCategory: formData.budgetCategory,
        createdAt: currentPO ? currentPO.createdAt : now,
        updatedAt: now
      };
      
      let id: string;
      if (currentPO) {
        id = currentPO.id;
        await setDoc(
          doc(db, 'businesses', currentBusiness.id, 'purchaseOrders', id),
          poData,
          { merge: true }
        );
      } else {
        const newDocRef = doc(collection(db, 'businesses', currentBusiness.id, 'purchaseOrders'));
        id = newDocRef.id;
        await setDoc(newDocRef, poData);
      }
      
      const newPO = { id, ...poData } as PurchaseOrder;
      
      if (currentPO) {
        setPurchaseOrders(prev => prev.map(po => po.id === id ? newPO : po));
      } else {
        setPurchaseOrders(prev => [newPO, ...prev]);
      }
      
      setOpenDialog(false);
      setSnackbar({
        open: true,
        message: `Purchase order ${currentPO ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving purchase order:', error);
      setSnackbar({
        open: true,
        message: `Error ${currentPO ? 'updating' : 'creating'} purchase order`,
        severity: 'error'
      });
    }
  };

  // Add handlePrintPO function
  const handlePrintPO = (po: PurchaseOrder) => {
    // Logic to print PO
    // For now, just open a print dialog for the current window
    window.print();
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Purchase Orders
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          New Purchase Order
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Search Purchase Orders"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="pending_approval">Pending Approval</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="sent">Sent to Supplier</MenuItem>
              <MenuItem value="received">Received</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as string)}
              label="Sort By"
            >
              <MenuItem value="poNumber">PO Number</MenuItem>
              <MenuItem value="createdAt">Creation Date</MenuItem>
              <MenuItem value="expectedDeliveryDate">Delivery Date</MenuItem>
              <MenuItem value="total">Total Amount</MenuItem>
            </Select>
          </FormControl>

          <IconButton onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}>
            {sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
          </IconButton>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : purchaseOrders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <ReceiptIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Purchase Orders Found
            </Typography>
            <Typography color="text.secondary" paragraph>
              You haven't created any purchase orders yet.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
            >
              Create Your First PO
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>PO #</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Date Created</TableCell>
                    <TableCell>Expected Delivery</TableCell>
                    <TableCell>Budget Category</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPurchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell>{po.poNumber}</TableCell>
                      <TableCell>{po.supplier.name}</TableCell>
                      <TableCell>{new Date(po.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {po.expectedDeliveryDate
                          ? new Date(po.expectedDeliveryDate).toLocaleDateString()
                          : 'Not specified'}
                      </TableCell>
                      <TableCell>
                        {po.budgetCategory ? (
                          <Chip 
                            label={po.budgetCategory}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ) : (
                          'Not specified'
                        )}
                      </TableCell>
                      <TableCell>
                        {po.currency} {po.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(po.status)}
                          color={getStatusColor(po.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            onClick={() => handleViewPO(po)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {(po.status === 'draft' || po.status === 'pending_approval') && (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEditPO(po)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {po.status === 'pending_approval' && (
                          <Tooltip title="Approve Order">
                            <IconButton
                              size="small"
                              onClick={() => handleApproveOrder(po.id)}
                              color="info"
                            >
                              <CheckCircleOutlineIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {po.status === 'approved' && (
                          <Tooltip title="Send to Supplier">
                            <IconButton
                              size="small"
                              onClick={() => handleSendPO(po)}
                              color="primary"
                            >
                              <SendIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {po.status === 'sent' && (
                          <Tooltip title="Mark as Received">
                            <IconButton
                              size="small"
                              onClick={() => handleMarkReceived(po.id)}
                              color="success"
                            >
                              <InventoryIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {(po.status === 'draft' || po.status === 'pending_approval') && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeletePO(po.id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Pagination
                count={Math.ceil(filteredPurchaseOrders.length / itemsPerPage)}
                page={page}
                onChange={(event, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          </>
        )}
      </Paper>

      {/* Purchase Order Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentPO ? 'Edit Purchase Order' : 'Create Purchase Order'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
              <FormControl fullWidth error={Boolean(validationErrors.supplier)}>
                <InputLabel>Supplier</InputLabel>
                <Select
                  value={formData.supplier.id || ''}
                  onChange={(e) => {
                    const supplierId = e.target.value as string;
                    const supplier = suppliers.find(s => s.id === supplierId);
                    if (supplier) {
                      console.log('Selected supplier with email:', supplier.email);
                      handleFormChange('supplier', { 
                        id: supplier.id, 
                        name: supplier.name,
                        email: supplier.email
                      });
                    } else {
                      handleFormChange('supplier', { id: '', name: '', email: '' });
                    }
                  }}
                  label="Supplier"
                  disabled={!!currentPO && currentPO.status !== 'draft'}
                >
                  <MenuItem value="">Select a supplier</MenuItem>
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.name} {supplier.email ? `(${supplier.email})` : '(No email)'}
                    </MenuItem>
                  ))}
                </Select>
                {validationErrors.supplier && (
                  <FormHelperText>{validationErrors.supplier}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
              <TextField
                fullWidth
                name="poNumber"
                label="PO Number"
                value={formData.poNumber || ''}
                onChange={(e) => handleFormChangeEvent(e)}
                disabled
                helperText="Automatically generated"
              />
            </Grid>

            <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
              <DatePicker
                label="Order Date"
                value={formData.orderDate ? new Date(formData.orderDate) : null}
                onChange={(newValue) => {
                  // Check if the value is valid before trying to convert to ISO string
                  if (newValue && !isNaN(newValue.getTime())) {
                    handleFormChange('orderDate', newValue.toISOString().split('T')[0]);
                  } else {
                    handleFormChange('orderDate', '');
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: Boolean(validationErrors.orderDate),
                    helperText: validationErrors.orderDate,
                  }
                }}
                disabled={!!currentPO && currentPO.status !== 'draft'}
              />
            </Grid>

            <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
              <DatePicker
                label="Expected Delivery Date"
                value={formData.expectedDeliveryDate ? new Date(formData.expectedDeliveryDate) : null}
                onChange={(newValue) => {
                  // Check if the value is valid before trying to convert to ISO string
                  if (newValue && !isNaN(newValue.getTime())) {
                    handleFormChange('expectedDeliveryDate', newValue.toISOString().split('T')[0]);
                  } else {
                    handleFormChange('expectedDeliveryDate', '');
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: Boolean(validationErrors.expectedDeliveryDate),
                    helperText: validationErrors.expectedDeliveryDate,
                  }
                }}
                disabled={!!currentPO && currentPO.status !== 'draft'}
              />
            </Grid>

            <Grid sx={{ width: { xs: '100%', md: '100%' }, padding: 1 }}>
              <TextField
                fullWidth
                name="deliveryAddress"
                label="Delivery Address"
                multiline
                rows={2}
                value={formData.deliveryAddress || ''}
                onChange={(e) => handleFormChangeEvent(e)}
                error={Boolean(validationErrors.deliveryAddress)}
                helperText={validationErrors.deliveryAddress}
                disabled={!!currentPO && currentPO.status !== 'draft'}
              />
            </Grid>

            {/* Add Budget Category field */}
            <Grid sx={{ width: { xs: '100%', md: '100%' }, padding: 1 }}>
              <FormControl fullWidth error={Boolean(validationErrors.budgetCategory)}>
                <InputLabel>Budget Category</InputLabel>
                <Select
                  name="budgetCategory"
                  value={formData.budgetCategory || ''}
                  onChange={(e) => handleFormChangeEvent(e)}
                  label="Budget Category"
                  disabled={!!currentPO && currentPO.status !== 'draft'}
                >
                  <MenuItem value="">Select a budget category</MenuItem>
                  {BUDGET_CATEGORIES.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
                {validationErrors.budgetCategory && (
                  <FormHelperText>{validationErrors.budgetCategory}</FormHelperText>
                )}
                <FormHelperText>
                  Selecting a budget category helps track spending against your budget
                </FormHelperText>
              </FormControl>
            </Grid>

            <Grid sx={{ width: { xs: '100%', md: '100%' }, padding: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Order Items
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {orderItems.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
                    <FormControl fullWidth error={Boolean(validationErrors[`items[${index}].product`])}>
                      <InputLabel>Product</InputLabel>
                      <Select
                        value={item.productName || ''}
                        onChange={(e) => handleItemChange(item.id, 'productName', e.target.value)}
                        label="Product"
                        disabled={!!currentPO && currentPO.status !== 'draft'}
                      >
                        <MenuItem value="">Select a product</MenuItem>
                        {products.map((product) => (
                          <MenuItem key={product.id} value={product.name}>
                            {product.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {validationErrors[`items[${index}].product`] && (
                        <FormHelperText>{validationErrors[`items[${index}].product`]}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={item.description || ''}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      disabled={!!currentPO && currentPO.status !== 'draft'}
                      error={Boolean(validationErrors[`items[${index}].description`])}
                      helperText={validationErrors[`items[${index}].description`]}
                    />
                  </Grid>

                  <Grid sx={{ width: { xs: '100%', md: '25%' }, padding: 1 }}>
                    <TextField
                      fullWidth
                      label="Qty"
                      type="number"
                      InputProps={{ inputProps: { min: 1 } }}
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value, 10))}
                      disabled={!!currentPO && currentPO.status !== 'draft'}
                      error={Boolean(validationErrors[`items[${index}].quantity`])}
                      helperText={validationErrors[`items[${index}].quantity`]}
                    />
                  </Grid>

                  <Grid sx={{ width: { xs: '100%', md: '25%' }, padding: 1 }}>
                    <TextField
                      fullWidth
                      label="Unit Price"
                      type="number"
                      InputProps={{ 
                        inputProps: { min: 0, step: 0.01 },
                        startAdornment: <InputAdornment position="start">{formData.currency || 'USD'}</InputAdornment>
                      }}
                      value={item.unitPrice || ''}
                      onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value))}
                      disabled={!!currentPO && currentPO.status !== 'draft'}
                      error={Boolean(validationErrors[`items[${index}].unitPrice`])}
                      helperText={validationErrors[`items[${index}].unitPrice`]}
                    />
                  </Grid>

                  <Grid sx={{ width: { xs: '100%', md: '25%' }, padding: 1 }}>
                    <TextField
                      fullWidth
                      label="Total"
                      InputProps={{ 
                        readOnly: true,
                        startAdornment: <InputAdornment position="start">{formData.currency || 'USD'}</InputAdornment>
                      }}
                      value={(item.quantity && item.unitPrice) 
                        ? (item.quantity * item.unitPrice).toFixed(2) 
                        : '0.00'}
                    />
                  </Grid>

                  <Grid sx={{ width: { xs: '100%', md: '100%' }, padding: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {((!currentPO || currentPO.status === 'draft') && orderItems.length > 1) && (
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              ))}

              {((!currentPO || currentPO.status === 'draft') && orderItems.length > 1) && (
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                  sx={{ mt: 1 }}
                >
                  Add Item
                </Button>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Grid container spacing={2} justifyContent="flex-end">
                  <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
                    <TextField
                      fullWidth
                      name="currency"
                      label="Currency"
                      select
                      value={formData.currency || 'USD'}
                      onChange={(e) => handleFormChangeEvent(e)}
                      disabled={!!currentPO && currentPO.status !== 'draft'}
                    >
                      <MenuItem value="USD">USD ($)</MenuItem>
                      <MenuItem value="EUR">EUR (€)</MenuItem>
                      <MenuItem value="GBP">GBP (£)</MenuItem>
                      <MenuItem value="CAD">CAD ($)</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
                    <TextField
                      fullWidth
                      label="Subtotal"
                      InputProps={{ 
                        readOnly: true,
                        startAdornment: <InputAdornment position="start">{formData.currency || 'USD'}</InputAdornment>
                      }}
                      value={calculateSubtotal().toFixed(2)}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Grid container spacing={2} justifyContent="flex-end">
                  <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
                    <TextField
                      fullWidth
                      name="tax"
                      label="Tax"
                      type="number"
                      InputProps={{ 
                        inputProps: { min: 0, step: 0.01 },
                        startAdornment: <InputAdornment position="start">{formData.currency || 'USD'}</InputAdornment>
                      }}
                      value={formData.tax || ''}
                      onChange={(e) => handleFormChangeEvent(e)}
                      disabled={!!currentPO && currentPO.status !== 'draft'}
                    />
                  </Grid>

                  <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
                    <TextField
                      fullWidth
                      name="shipping"
                      label="Shipping"
                      type="number"
                      InputProps={{ 
                        inputProps: { min: 0, step: 0.01 },
                        startAdornment: <InputAdornment position="start">{formData.currency || 'USD'}</InputAdornment>
                      }}
                      value={formData.shipping || ''}
                      onChange={(e) => handleFormChangeEvent(e)}
                      disabled={!!currentPO && currentPO.status !== 'draft'}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Grid container spacing={2} justifyContent="flex-end">
                  <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
                    <TextField
                      fullWidth
                      label="Total"
                      InputProps={{ 
                        readOnly: true,
                        startAdornment: <InputAdornment position="start">{formData.currency || 'USD'}</InputAdornment>
                      }}
                      value={(calculateTotal() || 0).toFixed(2)}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Grid sx={{ width: { xs: '100%', md: '100%' }, padding: 1 }}>
                <TextField
                  fullWidth
                  name="notes"
                  label="Notes"
                  multiline
                  rows={3}
                  value={formData.notes || ''}
                  onChange={(e) => handleFormChangeEvent(e)}
                  disabled={!!currentPO && currentPO.status !== 'draft'}
                />
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>
          {(!currentPO || currentPO.status === 'draft') && (
            <Button
              variant="contained"
              onClick={() => handleSavePO('draft')}
              startIcon={<SaveIcon />}
            >
              Save as Draft
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleSavePO('pending_approval')}
            startIcon={<SendIcon />}
          >
            {!currentPO || currentPO.status === 'draft' 
              ? 'Submit for Approval' 
              : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View PO Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Purchase Order #{currentPO?.poNumber}
          <IconButton
            onClick={() => setViewDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {currentPO && (
            <>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
                  <Typography variant="body1" fontWeight="bold">Supplier:</Typography>
                  <Typography variant="body1">{currentPO.supplier.name}</Typography>
                </Grid>
                <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
                  <Typography variant="body1" fontWeight="bold">Status:</Typography>
                  <Chip
                    label={getStatusLabel(currentPO.status)}
                    color={getStatusColor(currentPO.status)}
                    size="small"
                  />
                </Grid>
                <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
                  <Typography variant="body1" fontWeight="bold">Order Date:</Typography>
                  <Typography variant="body1">
                    {new Date(currentPO.orderDate).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
                  <Typography variant="body1" fontWeight="bold">Expected Delivery:</Typography>
                  <Typography variant="body1">
                    {currentPO.expectedDeliveryDate
                      ? new Date(currentPO.expectedDeliveryDate).toLocaleDateString()
                      : 'Not specified'}
                  </Typography>
                </Grid>
                <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1 }}>
                  <Typography variant="body1" fontWeight="bold">Budget Category:</Typography>
                  <Typography variant="body1">
                    {currentPO.budgetCategory ? (
                      <Chip 
                        label={currentPO.budgetCategory}
                        size="small"
                        color="primary"
                      />
                    ) : (
                      'Not specified'
                    )}
                  </Typography>
                </Grid>
                <Grid sx={{ width: { xs: '100%', md: '100%' }, padding: 1 }}>
                  <Typography variant="body1" fontWeight="bold">Delivery Address:</Typography>
                  <Typography variant="body1">{currentPO.deliveryAddress}</Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Order Items
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentPO.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">
                          {currentPO.currency} {item.unitPrice.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          {currentPO.currency} {(item.quantity * item.unitPrice).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} />
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold">Subtotal:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        {currentPO.currency} {(currentPO.total - (currentPO.tax || 0) - (currentPO.shipping || 0)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                    {currentPO.tax > 0 && (
                      <TableRow>
                        <TableCell colSpan={3} />
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight="bold">Tax:</Typography>
                        </TableCell>
                        <TableCell align="right">
                          {currentPO.currency} {Number(currentPO.tax || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )}
                    {currentPO.shipping > 0 && (
                      <TableRow>
                        <TableCell colSpan={3} />
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight="bold">Shipping:</Typography>
                        </TableCell>
                        <TableCell align="right">
                          {currentPO.currency} {Number(currentPO.shipping || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell colSpan={3} />
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold">Total:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold">
                          {currentPO.currency} {currentPO.total.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {currentPO.notes && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body1" fontWeight="bold">Notes:</Typography>
                  <Typography variant="body1">{currentPO.notes}</Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>
            Close
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => handlePrintPO(currentPO!)}
          >
            Print
          </Button>
          {currentPO?.status === 'approved' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<SendIcon />}
              onClick={() => handleSendPO(currentPO!)}
            >
              Send to Supplier
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar.message}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={handleCloseSnackbar}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </>
  );
};

export default PurchaseOrders; 