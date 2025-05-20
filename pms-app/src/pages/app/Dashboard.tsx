import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Alert,
  Container,
  Tab,
  Tabs,
  IconButton
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  Warning as WarningIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  Business as BusinessIcon,
  Payments as PaymentsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useBusiness } from '../../contexts/BusinessContext';
import { PurchaseOrder, InventoryItem, Invoice } from '../../types';
import { getFilteredDocs, getOrderedDocs } from '../../firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useData } from '../../contexts/DataContext';

// Remove the sample monthly spending data and budget breakdown data
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const Dashboard: React.FC = () => {
  const { businessData, loading: businessLoading } = useBusiness();
  const { currentUser } = useAuth();
  const { dashboardUpdated, triggerDashboardUpdate } = useData();
  const navigate = useNavigate();
  
  const [pendingPurchaseOrders, setPendingPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budgetTabValue, setBudgetTabValue] = useState(0);
  
  // Budget data states
  const [annualBudget, setAnnualBudget] = useState<number>(0);
  const [spentSoFar, setSpentSoFar] = useState<number>(0);
  const [monthlySpending, setMonthlySpending] = useState<any[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<any[]>([]);
  
  const remainingBudget = annualBudget - spentSoFar;
  const percentSpent = annualBudget > 0 ? Math.round((spentSoFar / annualBudget) * 100) : 0;
  
  const handleBudgetTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setBudgetTabValue(newValue);
  };
  
  // Update the refreshDashboard function to use triggerDashboardUpdate
  const refreshDashboard = useCallback(() => {
    console.log("Manually refreshing dashboard data");
    triggerDashboardUpdate(); // This will cause the dashboard to re-fetch data
  }, [triggerDashboardUpdate]);
  
  // Add a focus/visibility event handler to refresh data when user returns to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Page became visible - refreshing dashboard data");
        refreshDashboard();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up on component unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshDashboard]);
  
  useEffect(() => {
    console.log('Dashboard mount - Auth state:', {
      currentUser: currentUser ? `${currentUser.email} (${currentUser.id})` : 'No user',
      businessData: businessData ? `${businessData.name} (${businessData.id})` : 'No business data',
      loading: loading || businessLoading,
      userBusinessId: currentUser?.businessId || 'none'
    });
    
    // Only handle redirects if all loading is complete
    if (!loading && !businessLoading) {
      if (!currentUser) {
        console.warn('No user logged in at Dashboard - redirecting to login');
        navigate('/login', { replace: true });
      } else {
        console.log('Dashboard access granted - user authenticated');
      }
    }
  }, [currentUser, businessData, loading, businessLoading, navigate]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!businessData) {
        setLoading(false);
        return;
      }
      
      console.log("Dashboard: Fetching data triggered by dashboardUpdated:", dashboardUpdated);
      
      try {
        setLoading(true);
        setError(null);
        
        const businessId = businessData.id;
        const purchaseOrdersPath = `businesses/${businessId}/purchaseOrders`;
        const inventoryPath = `businesses/${businessId}/inventoryItems`;
        const invoicesPath = `businesses/${businessId}/invoices`;
        const budgetsPath = `businesses/${businessId}/budgets`;
        const annualBudgetsPath = `businesses/${businessId}/annualBudgets`;
        const expensesPath = `businesses/${businessId}/expenses`;
        
        // Fetch pending purchase orders
        const pendingPOs = await getFilteredDocs(
          purchaseOrdersPath,
          'status',
          'in',
          ['pending_approval', 'approved']
        );
        setPendingPurchaseOrders(pendingPOs as PurchaseOrder[]);
        
        // Fetch low stock items
        const inventoryItems = await getOrderedDocs(inventoryPath, 'quantity', 'asc');
        const lowStock = (inventoryItems as InventoryItem[]).filter((item: InventoryItem) => {
          return item.reorderPoint && item.quantity <= item.reorderPoint;
        });
        setLowStockItems(lowStock);
        
        // Fetch unpaid invoices
        const invoices = await getFilteredDocs(
          invoicesPath,
          'status',
          'in',
          ['pending', 'approved', 'overdue']
        );
        setUnpaidInvoices(invoices as Invoice[]);
        
        // Fetch recent activity (combine and sort by date)
        const recentPOs = await getOrderedDocs(purchaseOrdersPath, 'createdAt', 'desc', 5);
        const recentInvoices = await getOrderedDocs(invoicesPath, 'createdAt', 'desc', 5);
        
        const combinedActivity = [
          ...recentPOs.map(po => ({ 
            type: 'purchase_order', 
            data: po,
            date: po.createdAt
          })),
          ...recentInvoices.map(invoice => ({ 
            type: 'invoice', 
            data: invoice,
            date: invoice.createdAt
          }))
        ];
        
        // Sort by date descending
        combinedActivity.sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        setRecentActivity(combinedActivity.slice(0, 5));
        
        // Fetch budget data with improved approach
        const currentYear = new Date().getFullYear();
        
        console.log(`Fetching budget data for year ${currentYear} with timestamp ${dashboardUpdated}`);
        
        // STEP 1: Fetch and process individual budgets first to ensure we have accurate spending data
        const budgetsQuery = await getFilteredDocs(
          budgetsPath,
          'year',
          '==',
          currentYear
        );
        
        console.log(`Found ${budgetsQuery.length} budgets for year ${currentYear}`);
        
        // Calculate category totals and spent amounts
        const categoryTotals = new Map();
        let totalBudgetAmount = 0;
        let totalBudgetSpent = 0;
        
        budgetsQuery.forEach((budget: any) => {
          const category = budget.category || 'Uncategorized';
          const amount = typeof budget.amount === 'number' ? budget.amount : parseFloat(budget.amount) || 0;
          const spent = typeof budget.spent === 'number' ? budget.spent : parseFloat(budget.spent) || 0;
          
          totalBudgetAmount += amount;
          totalBudgetSpent += spent;
          
          // Add to category map
          if (categoryTotals.has(category)) {
            const current = categoryTotals.get(category);
            categoryTotals.set(category, {
              amount: current.amount + amount,
              spent: current.spent + spent
            });
          } else {
            categoryTotals.set(category, {
              amount,
              spent
            });
          }
        });
        
        console.log(`Total budget amount: ${totalBudgetAmount}, Total spent: ${totalBudgetSpent}`);
        console.log('Category totals:', Object.fromEntries(categoryTotals));
        
        // STEP 2: Then get the annual budget for official numbers
        const annualBudgetRef = doc(db, annualBudgetsPath, currentYear.toString());
        const annualBudgetDoc = await getDoc(annualBudgetRef);
        
        // Use either annual budget or calculated totals
        if (annualBudgetDoc.exists()) {
          const annualBudgetData = annualBudgetDoc.data();
          console.log("Annual budget data found:", annualBudgetData);
          
          // Use annual budget amount but the actual spent totals from individual budgets
          setAnnualBudget(annualBudgetData.totalAmount || totalBudgetAmount);
          
          // Process budget categories from annual budget
          if (annualBudgetData.categories && annualBudgetData.categories.length > 0) {
            // Create enhanced categories with both amount and spent information
            const enhancedCategories = annualBudgetData.categories.map((category: any, index: number) => {
              const categorySpent = categoryTotals.has(category.name) 
                ? categoryTotals.get(category.name).spent 
                : 0;
                
              return {
                name: category.name,
                value: category.amount,
                spent: categorySpent,
                remaining: category.amount - categorySpent,
                color: COLORS[index % COLORS.length]
              };
            });
            
            setBudgetCategories(enhancedCategories);
          } else {
            // If annual budget has no categories, create from our category totals
            const generatedCategories = Array.from(categoryTotals.entries()).map(([name, data], index) => ({
              name,
              value: data.amount,
              spent: data.spent,
              remaining: data.amount - data.spent,
              color: COLORS[index % COLORS.length]
            }));
            
            setBudgetCategories(generatedCategories);
          }
        } else {
          console.log("No annual budget found for year:", currentYear);
          // No annual budget, use calculated totals
          setAnnualBudget(totalBudgetAmount);
          
          // Create categories from our direct calculations
          const generatedCategories = Array.from(categoryTotals.entries()).map(([name, data], index) => ({
            name,
            value: data.amount,
            spent: data.spent,
            remaining: data.amount - data.spent,
            color: COLORS[index % COLORS.length]
          }));
          
          setBudgetCategories(generatedCategories);
        }
        
        // STEP 3: Always use real spent amount from budgets collection
        setSpentSoFar(totalBudgetSpent);
        
        // STEP 4: Fetch expenses for monthly spending data with improved processing
        const expensesDocs = await getFilteredDocs(
          expensesPath,
          'date',
          '>=',
          new Date(currentYear, 0, 1).toISOString()
        );
        
        console.log(`Found ${expensesDocs.length} expenses for year ${currentYear}`);
        
        // Process monthly spending with better date handling
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlySpendings = Array(12).fill(0);
        
        expensesDocs.forEach((expense: any) => {
          if (expense.date) {
            try {
              // Handle different date formats
              const expenseDate = expense.date instanceof Date 
                ? expense.date 
                : new Date(expense.date.seconds ? expense.date.seconds * 1000 : expense.date);
                
              const month = expenseDate.getMonth();
              
              // Ensure we have a valid month index
              if (month >= 0 && month < 12) {
                const amount = typeof expense.amount === 'number' 
                  ? expense.amount 
                  : parseFloat(expense.amount) || 0;
                  
                monthlySpendings[month] += amount;
              }
            } catch (err) {
              console.warn('Error processing expense date:', expense.date, err);
            }
          }
        });
        
        const monthlyData = monthNames.map((name, index) => ({
          name,
          amount: monthlySpendings[index]
        }));
        
        console.log('Monthly spending data processed:', monthlyData);
        setMonthlySpending(monthlyData);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [businessData, dashboardUpdated]);
  
  if (businessLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  // Show business setup prompt if no business data is available
  if (!businessData) {
    return (
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, mt: 4, textAlign: 'center' }}>
          <BusinessIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" component="h1" gutterBottom>
            Set Up Your Business Profile
          </Typography>
          <Typography variant="body1" paragraph>
            Welcome to ProcureFlow! To get started, you'll need to set up your business profile.
            This will enable you to manage inventory, create purchase orders, and track invoices.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            component={RouterLink} 
            to="/create-business"
            size="large"
            sx={{ mt: 2 }}
          >
            Set Up Business Now
          </Button>
        </Paper>
      </Container>
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
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid sx={{ width: { xs: '100%', md: '25%' } }}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCartIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Pending POs
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ mt: 2 }}>
                {pendingPurchaseOrders.length}
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                component={RouterLink} 
                to="/app/purchase-orders"
              >
                View All
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid sx={{ width: { xs: '100%', md: '25%' } }}>
          <Card sx={{ bgcolor: '#ffebee' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <InventoryIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Low Stock Items
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ mt: 2 }}>
                {lowStockItems.length}
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                component={RouterLink} 
                to="/app/inventory"
              >
                View All
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid sx={{ width: { xs: '100%', md: '25%' } }}>
          <Card sx={{ bgcolor: '#fff8e1' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ReceiptIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Unpaid Invoices
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ mt: 2 }}>
                {unpaidInvoices.length}
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                component={RouterLink} 
                to="/app/invoices"
              >
                View All
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid sx={{ width: { xs: '100%', md: '25%' } }}>
          <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalanceIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Budget Status
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <Typography variant="h3" component="div">
                  {percentSpent}%
                </Typography>
                <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                  <DownIcon color="success" fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    {remainingBudget.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} remaining
                  </Typography>
                </Box>
              </Box>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={() => document.getElementById('budget-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Details
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Budget Overview Section */}
        <Grid sx={{ width: '100%' }} id="budget-section">
          <Paper sx={{ p: 2, bgcolor: '#f0f4ff' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PaymentsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Budget Overview
                </Typography>
              </Box>
              <IconButton 
                size="small" 
                onClick={() => {
                  console.log("Manual budget refresh requested");
                  refreshDashboard();
                }}
                title="Refresh Budget Data"
              >
                <RefreshIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {annualBudget === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No budget data found for the current year. Please set up your annual budget.
                <Button 
                  size="small" 
                  component={RouterLink} 
                  to="/app/budgets/create"
                  sx={{ ml: 2 }}
                >
                  Set Up Budget
                </Button>
              </Alert>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#e3f2fd', borderRadius: 1, width: '32%' }}>
                    <Typography variant="h6" gutterBottom>
                      Annual Budget
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {annualBudget.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#fff8e1', borderRadius: 1, width: '32%' }}>
                    <Typography variant="h6" gutterBottom>
                      Spent So Far
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {spentSoFar.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#e8f5e9', borderRadius: 1, width: '32%' }}>
                    <Typography variant="h6" gutterBottom>
                      Remaining
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {remainingBudget.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Tabs value={budgetTabValue} onChange={handleBudgetTabChange} centered>
                    <Tab label="Monthly Spending" />
                    <Tab label="Budget Breakdown" />
                  </Tabs>
                </Box>
                
                {budgetTabValue === 0 && (
                  <Box sx={{ height: 300 }}>
                    {monthlySpending.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={monthlySpending}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [`${value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`, 'Amount']}
                            labelFormatter={(label) => `${label} ${new Date().getFullYear()}`}
                          />
                          <Legend />
                          <Bar dataKey="amount" name="Monthly Spending" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography color="text.secondary">No monthly spending data available</Typography>
                      </Box>
                    )}
                  </Box>
                )}
                
                {budgetTabValue === 1 && (
                  <Box sx={{ height: 300, display: 'flex' }}>
                    {budgetCategories.length > 0 ? (
                      <>
                        <ResponsiveContainer width="60%" height="100%">
                          <PieChart>
                            <Pie
                              data={budgetCategories}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {budgetCategories.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value) => [`${value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`, 'Amount']}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <Box sx={{ width: '40%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Typography variant="h6" gutterBottom>Budget Allocation</Typography>
                          <List dense>
                            {budgetCategories.map((item, index) => (
                              <ListItem key={index}>
                                <Box sx={{ width: 14, height: 14, bgcolor: COLORS[index % COLORS.length], mr: 1, borderRadius: '50%' }} />
                                <ListItemText 
                                  primary={`${item.name}`}
                                  secondary={
                                    <>
                                      Total: {item.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                      <br />
                                      Spent: {(item.spent || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                      <br />
                                      <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        mt: 0.5
                                      }}>
                                        <Box
                                          sx={{
                                            flexGrow: 1,
                                            mr: 1,
                                            height: 6,
                                            borderRadius: 1,
                                            bgcolor: 'grey.300',
                                            overflow: 'hidden'
                                          }}
                                        >
                                          <Box
                                            sx={{
                                              height: '100%',
                                              width: `${Math.min((item.spent / item.value) * 100, 100)}%`,
                                              bgcolor: (item.spent / item.value) > 0.9 ? 'error.main' : 
                                                      (item.spent / item.value) > 0.7 ? 'warning.main' : 'success.main'
                                            }}
                                          />
                                        </Box>
                                        <Typography variant="caption">
                                          {Math.round((item.spent / item.value) * 100)}%
                                        </Typography>
                                      </Box>
                                    </>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      </>
                    ) : (
                      <Box display="flex" justifyContent="center" alignItems="center" width="100%">
                        <Typography color="text.secondary">No budget category data available</Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </>
            )}
            
            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <Button 
                size="small" 
                component={RouterLink} 
                to="/app/budgets"
                variant="outlined"
              >
                Budget Management
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Low Stock Items */}
        <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
          <Paper sx={{ p: 2, bgcolor: '#f3e5f5' }}>
            <Typography variant="h6" gutterBottom>
              Low Stock Items
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {lowStockItems.length === 0 ? (
              <Typography color="text.secondary">
                No items are low in stock
              </Typography>
            ) : (
              <List dense>
                {lowStockItems.slice(0, 5).map((item) => (
                  <ListItem key={item.id}>
                    <ListItemIcon>
                      <WarningIcon color="error" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.name}
                      secondary={`Quantity: ${item.quantity} / Reorder at: ${item.reorderPoint}`}
                    />
                    <Chip 
                      label={`${item.quantity} ${item.unit || 'units'}`} 
                      color="error" 
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            )}
            
            {lowStockItems.length > 5 && (
              <Box sx={{ mt: 1, textAlign: 'right' }}>
                <Button
                  size="small"
                  component={RouterLink}
                  to="/app/inventory"
                >
                  View All ({lowStockItems.length})
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Pending Purchase Orders */}
        <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
          <Paper sx={{ p: 2, bgcolor: '#e0f7fa' }}>
            <Typography variant="h6" gutterBottom>
              Pending Purchase Orders
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {pendingPurchaseOrders.length === 0 ? (
              <Typography color="text.secondary">
                No pending purchase orders
              </Typography>
            ) : (
              <List dense>
                {pendingPurchaseOrders.slice(0, 5).map((order) => (
                  <ListItem key={order.id}>
                    <ListItemIcon>
                      <ShoppingCartIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`PO #${order.poNumber}`}
                      secondary={`Supplier: ${order.supplierName} - ${order.status}`}
                    />
                    <Chip 
                      label={order.status === 'pending_approval' ? 'Pending' : 'Approved'} 
                      color={order.status === 'pending_approval' ? 'warning' : 'success'} 
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            )}
            
            {pendingPurchaseOrders.length > 5 && (
              <Box sx={{ mt: 1, textAlign: 'right' }}>
                <Button
                  size="small"
                  component={RouterLink}
                  to="/app/purchase-orders"
                >
                  View All ({pendingPurchaseOrders.length})
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Recent Activity */}
        <Grid sx={{ width: { xs: '100%' } }}>
          <Paper sx={{ p: 2, bgcolor: '#f1f8e9' }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {recentActivity.length === 0 ? (
              <Typography color="text.secondary">
                No recent activity
              </Typography>
            ) : (
              <List dense>
                {recentActivity.map((activity, index) => {
                  const { type, data } = activity;
                  let primary = '';
                  let secondary = '';
                  let icon = null;
                  
                  if (type === 'purchase_order') {
                    primary = `Purchase Order #${data.poNumber}`;
                    secondary = `Created for ${data.supplierName} - Status: ${data.status}`;
                    icon = <ShoppingCartIcon color="primary" />;
                  } else if (type === 'invoice') {
                    primary = `Invoice #${data.invoiceNumber}`;
                    secondary = `From ${data.supplierName} - Status: ${data.status}`;
                    icon = <ReceiptIcon color="action" />;
                  }
                  
                  return (
                    <ListItem key={`${type}-${data.id}`}>
                      <ListItemIcon>
                        {icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={primary}
                        secondary={secondary}
                      />
                      <Chip 
                        label={new Date(data.createdAt).toLocaleDateString()}
                        size="small"
                        variant="outlined"
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 