import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useBusiness } from '../../contexts/BusinessContext';
import { formatCurrency } from '../../utils/formatters';

// Add proper interface definitions for data types
interface PurchaseOrder {
  id: string;
  createdAt: { seconds: number; nanoseconds: number } | string;
  total: number;
  supplier: {
    name: string;
  };
  // Add other properties as needed
}

interface InventoryItem {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  // Add other properties as needed
}

// For the TabPanel component (unchanged)
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Reports: React.FC = () => {
  const { currentBusiness } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('month');
  
  // Report data - use proper types
  const [purchasesData, setPurchasesData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [supplierData, setSupplierData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  
  // Load report data
  useEffect(() => {
    const loadReportData = async () => {
      if (!currentBusiness) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const businessId = currentBusiness.id;
        
        // Define time range filter based on selection
        const dateFilter = () => {
          const now = new Date();
          let filterDate = new Date();
          
          switch (timeRange) {
            case 'week':
              filterDate.setDate(now.getDate() - 7);
              break;
            case 'month':
              filterDate.setMonth(now.getMonth() - 1);
              break;
            case 'quarter':
              filterDate.setMonth(now.getMonth() - 3);
              break;
            case 'year':
              filterDate.setFullYear(now.getFullYear() - 1);
              break;
            default:
              filterDate.setMonth(now.getMonth() - 1);
          }
          return filterDate;
        };

        // Fetch all purchase orders first (without date filter)
        const purchaseOrdersRef = collection(db, 'businesses', businessId, 'purchaseOrders');
        const purchaseOrdersSnapshot = await getDocs(purchaseOrdersRef);
        
        if (purchaseOrdersSnapshot.empty) {
          console.log('No purchase orders found');
          setPurchasesData([]);
          setSupplierData([]);
          return;
        }

        const poData = purchaseOrdersSnapshot.docs
          .map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
            
            return {
              id: doc.id,
              ...data,
              createdAt,
              total: Number(data.totalAmount || data.total || 0),
              supplier: {
                name: data.supplierName || (data.supplier && data.supplier.name) || 'Unknown'
              }
            };
          })
          .filter(po => {
            const poDate = new Date(po.createdAt);
            return poDate >= dateFilter();
          });

        console.log('Filtered PO Data:', poData);
        
        // Process purchase orders by date
        const purchasesByDate = poData.reduce((acc: {[key: string]: number}, po) => {
          const dateStr = new Date(po.createdAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          });
          acc[dateStr] = (acc[dateStr] || 0) + po.total;
          return acc;
        }, {});
        
        // Convert to chart data format and sort by date
        const purchasesChartData = Object.entries(purchasesByDate)
          .map(([date, amount]) => ({
            date,
            amount
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        console.log('Purchases Chart Data:', purchasesChartData);
        setPurchasesData(purchasesChartData);
        
        // Process purchase orders by supplier
        const purchasesBySupplier = poData.reduce((acc: {[key: string]: number}, po) => {
          const supplierName = po.supplier?.name || 'Unknown';
          acc[supplierName] = (acc[supplierName] || 0) + po.total;
          return acc;
        }, {});
        
        // Convert to chart data format and sort by amount
        const supplierChartData = Object.entries(purchasesBySupplier)
          .map(([name, value]) => ({
            name: name === 'Unknown' ? 'Other' : name,
            value
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5); // Top 5 suppliers

        console.log('Supplier Chart Data:', supplierChartData);
        setSupplierData(supplierChartData);

        // Fetch inventory data for stock analysis
        const inventoryQuery = query(
          collection(db, 'businesses', businessId, 'inventoryItems')
        );
        
        const inventorySnapshot = await getDocs(inventoryQuery);
        const inventoryItems = inventorySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as InventoryItem[];
        
        // Process inventory by category
        const stockByCategory = inventoryItems.reduce((acc: {[key: string]: number}, item) => {
          const category = item.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + (item.quantity || 0);
          return acc;
        }, {});
        
        // Convert to chart data format
        const categoryChartData = Object.entries(stockByCategory)
          .map(([name, value]) => ({
            name,
            value
          }))
          .filter(item => item.value > 0);
        
        setCategoryData(categoryChartData);
        
        // Get top inventory items by value
        const inventoryByValue = inventoryItems
          .map(item => ({
            name: item.name,
            value: (item.quantity || 0) * (item.unitPrice || 0)
          }))
          .filter(item => item.value > 0)
          .sort((a, b) => b.value - a.value)
          .slice(0, 10); // Top 10 items by value
        
        setInventoryData(inventoryByValue);
        
      } catch (err) {
        console.error('Error loading report data:', err);
        setError('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };
    
    loadReportData();
  }, [currentBusiness, timeRange]);
  
  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleTimeRangeChange = (event: any) => {
    setTimeRange(event.target.value);
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Reports & Analytics
        </Typography>
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="time-range-label">Time Range</InputLabel>
          <Select
            labelId="time-range-label"
            id="time-range-select"
            value={timeRange}
            label="Time Range"
            onChange={handleTimeRangeChange}
          >
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="quarter">Last Quarter</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleChangeTab}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Spending Analysis" />
          <Tab label="Inventory Analysis" />
          <Tab label="Supplier Analysis" />
        </Tabs>
        
        {/* Spending Analysis Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3} component="div">
            <Grid component="div" sx={{ width: { xs: '100%' } }}>
              <Card>
                <CardHeader 
                  title="Purchase Spending Over Time" 
                  subheader={purchasesData.length === 0 ? "No purchase data available for the selected time range" : undefined}
                />
                <CardContent sx={{ height: 400 }}>
                  {purchasesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={purchasesData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          tickFormatter={(value) => formatCurrency(value).replace(/\.00$/, '')}
                        />
                        <Tooltip 
                          formatter={(value) => formatCurrency(value as number)}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="amount" 
                          name="Spending" 
                          stroke="#8884d8" 
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                      <Typography variant="body1" color="text.secondary">
                        No data available
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Inventory Analysis Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3} component="div">
            <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
              <Card>
                <CardHeader title="Inventory by Category" />
                <CardContent sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        nameKey="name"
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label={(entry) => entry.name}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
              <Card>
                <CardHeader title="Top Inventory Items by Value" />
                <CardContent sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={inventoryData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number" 
                        tickFormatter={(value) => formatCurrency(value).replace(/\.00$/, '')}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        tick={{ fontSize: 11 }}
                        width={150}
                      />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Bar dataKey="value" name="Value" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Supplier Analysis Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3} component="div">
            <Grid component="div" sx={{ width: { xs: '100%' } }}>
              <Card>
                <CardHeader 
                  title="Top 5 Suppliers by Spend" 
                  subheader={supplierData.length === 0 ? "No supplier data available for the selected time range" : undefined}
                />
                <CardContent sx={{ height: 400 }}>
                  {supplierData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={supplierData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12 }}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          tickFormatter={(value) => formatCurrency(value).replace(/\.00$/, '')}
                        />
                        <Tooltip 
                          formatter={(value) => formatCurrency(value as number)}
                          labelFormatter={(label) => `Supplier: ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="value" name="Spend" fill="#8884d8">
                          {supplierData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                      <Typography variant="body1" color="text.secondary">
                        No data available
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Reports; 