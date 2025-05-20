import React, { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  Tab,
  Tabs,
  useMediaQuery,
  alpha
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  Group as GroupIcon,
  InsertChart as ChartIcon,
  Settings as SettingsIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const childVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`feature-tabpanel-${index}`}
      aria-labelledby={`feature-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const FeatureSection: React.FC<{
  title: string;
  description: string;
  image: string;
  bullets: string[];
  reverse?: boolean;
  delay?: number;
}> = ({ title, description, image, bullets, reverse, delay = 0 }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={{
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: { delay: delay * 0.2, staggerChildren: 0.1, delayChildren: delay * 0.2 } 
      }
    }}
  >
    <Stack 
      direction={{ xs: 'column', md: reverse ? 'row-reverse' : 'row' }}
      spacing={4} 
      alignItems="center" 
      sx={{ my: 6 }}
    >
      <Box sx={{ width: '100%', maxWidth: { md: '50%' } }}>
        <motion.div variants={childVariant}>
          <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom>
            {title}
          </Typography>
        </motion.div>
        <motion.div variants={childVariant}>
          <Typography variant="body1" paragraph color="text.secondary">
            {description}
          </Typography>
        </motion.div>
        <motion.div 
          variants={staggerChildren}
        >
          <List>
            {bullets.map((bullet, index) => (
              <motion.div key={index} variants={childVariant}>
                <ListItem disableGutters sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary={bullet} />
                </ListItem>
              </motion.div>
            ))}
          </List>
        </motion.div>
      </Box>
      <Box sx={{ width: '100%', maxWidth: { md: '50%' } }}>
        <motion.div
          variants={childVariant}
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Box
            component="img"
            src={image}
            alt={title}
            sx={{
              width: '100%',
              borderRadius: 4,
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              transform: 'perspective(1000px) rotateY(0deg)',
              transition: 'all 0.5s ease',
              '&:hover': {
                boxShadow: '0 15px 60px rgba(0,0,0,0.15)',
              }
            }}
          />
        </motion.div>
      </Box>
    </Stack>
  </motion.div>
);

// Feature categories
const features = [
  {
    id: 'suppliers',
    title: 'Supplier Management',
    description: 'Build stronger relationships with your suppliers and streamline your vendor management processes.',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    icon: <GroupIcon />,
    bullets: [
      'Maintain a centralized supplier database',
      'Track supplier performance metrics',
      'Store key contact information and documents',
      'Categorize and tag suppliers for easy filtering',
      'Supplier onboarding and approval workflows'
    ]
  },
  {
    id: 'purchase-orders',
    title: 'Purchase Order Management',
    description: 'Create, track, and manage purchase orders through their entire lifecycle.',
    image: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    icon: <ShoppingCartIcon />,
    bullets: [
      'Intuitive PO creation and editing',
      'Approval workflows with audit trails',
      'Auto-generated PO numbers',
      'Track orders from creation to delivery',
      'Email POs directly to suppliers',
      'Order change management'
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory Management',
    description: 'Keep track of your inventory levels and streamline reordering processes.',
    image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    icon: <InventoryIcon />,
    bullets: [
      'Real-time inventory tracking',
      'Low stock alerts and automatic reordering',
      'Detailed product information management',
      'Barcode scanning support',
      'Inventory valuation reporting',
      'Batch and lot tracking capabilities'
    ]
  },
  {
    id: 'invoices',
    title: 'Invoice Management',
    description: 'Efficiently manage supplier invoices and payment processes.',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    icon: <ReceiptIcon />,
    bullets: [
      'Invoice capture and processing',
      'Match invoices to purchase orders',
      'Track invoice approval status',
      'Payment scheduling and tracking',
      'Invoice discrepancy management',
      'Early payment discount optimization'
    ]
  },
  {
    id: 'reports',
    title: 'Analytics & Reporting',
    description: 'Gain valuable insights into your procurement process with comprehensive reporting.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    icon: <ChartIcon />,
    bullets: [
      'Customizable dashboard with key metrics',
      'Spending analysis by supplier, category, or time period',
      'Purchase order status reporting',
      'Inventory level and valuation reports',
      'Supplier performance metrics',
      'Export reports to PDF or Excel'
    ]
  },
  {
    id: 'settings',
    title: 'System Configuration',
    description: 'Configure the system to match your business processes and requirements.',
    image: 'https://images.unsplash.com/photo-1585909695284-32d2985ac9c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    icon: <SettingsIcon />,
    bullets: [
      'User role and permission management',
      'Approval workflow customization',
      'Email notification settings',
      'Custom fields for forms and documents',
      'Integrations with accounting and ERP systems',
      'Data import and export tools'
    ]
  }
];

const FeaturesPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { currentUser } = useAuth();
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{ 
          position: 'relative',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          pt: { xs: 10, md: 16 },
          pb: { xs: 12, md: 18 },
          overflow: 'hidden'
        }}
      >
        {/* Background animated shapes */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          overflow: 'hidden',
          zIndex: 0
        }}>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                x: [0, Math.random() * 100 - 50],
                y: [0, Math.random() * 100 - 50],
                rotate: [0, Math.random() * 360],
                scale: [1, 1 + Math.random() * 0.3]
              }}
              transition={{
                duration: 20 + Math.random() * 10,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
              style={{
                position: 'absolute',
                width: 150 + Math.random() * 300,
                height: 150 + Math.random() * 300,
                borderRadius: '50%',
                background: 'white',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                opacity: 0.07 + Math.random() * 0.05
              }}
            />
          ))}
        </Box>

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <Box textAlign="center">
              <Typography 
                variant="h2" 
                fontWeight="bold"
                sx={{ mb: 2 }}
              >
                Powerful Features for Modern Procurement
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ mb: 6, maxWidth: 800, mx: 'auto', opacity: 0.9 }}
              >
                Our comprehensive suite of tools helps businesses of all sizes
                streamline their procurement operations and reduce costs.
              </Typography>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  component={RouterLink}
                  to={currentUser ? "/app/dashboard" : "/auth/register"}
                  variant="contained"
                  color="secondary"
                  size="large"
                  sx={{ 
                    py: 1.5, 
                    px: 4,
                    borderRadius: '30px',
                    boxShadow: '0 10px 20px rgba(245,0,87,0.3)'
                  }}
                >
                  {currentUser ? 'Go to Dashboard' : 'Try It Free'}
                </Button>
              </motion.div>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Features Tabs Section */}
      <Container maxWidth="lg" sx={{ mt: { xs: -8, md: -10 }, mb: 8, position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card sx={{ 
            boxShadow: '0 15px 50px rgba(0,0,0,0.1)', 
            borderRadius: 4,
            overflow: 'hidden'
          }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="features tabs"
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                bgcolor: 'background.paper',
                '& .MuiTab-root': {
                  py: 3,
                  minWidth: { xs: 'auto', md: 160 }
                },
                '& .Mui-selected': {
                  color: 'primary.main',
                  fontWeight: 'bold'
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                }
              }}
            >
              {features.map((feature, index) => (
                <Tab 
                  key={feature.id} 
                  icon={feature.icon} 
                  label={feature.title} 
                  id={`feature-tab-${index}`}
                  aria-controls={`feature-tabpanel-${index}`}
                  sx={{ 
                    flexDirection: { xs: 'row', md: 'column' },
                    alignItems: 'center',
                    gap: 1
                  }}
                />
              ))}
            </Tabs>

            {features.map((feature, index) => (
              <TabPanel key={feature.id} value={tabValue} index={index}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center">
                    <Box sx={{ width: '100%', maxWidth: { md: '50%' } }}>
                      <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom>
                        {feature.title}
                      </Typography>
                      <Typography variant="body1" paragraph color="text.secondary">
                        {feature.description}
                      </Typography>
                      <List>
                        {feature.bullets.map((bullet, idx) => (
                          <ListItem key={idx} disableGutters sx={{ py: 1 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <CheckIcon color="success" />
                            </ListItemIcon>
                            <ListItemText primary={bullet} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                    <Box sx={{ width: '100%', maxWidth: { md: '50%' } }}>
                      <motion.div
                        whileHover={{ 
                          scale: 1.03,
                          rotate: 1 
                        }}
                        transition={{ 
                          type: "spring",
                          stiffness: 300
                        }}
                      >
                        <Box
                          component="img"
                          src={feature.image}
                          alt={feature.title}
                          sx={{
                            width: '100%',
                            borderRadius: 4,
                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                          }}
                        />
                      </motion.div>
                    </Box>
                  </Stack>
                </motion.div>
              </TabPanel>
            ))}
          </Card>
        </motion.div>
      </Container>

      {/* Detailed Feature Sections */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <Divider sx={{ my: 6 }}>
            <Typography variant="h4" component="h2" fontWeight="bold">
              Explore Our Features in Detail
            </Typography>
          </Divider>
        </motion.div>

        <FeatureSection
          title="Streamline Supplier Management"
          description="Build stronger relationships with your suppliers and gain visibility into supplier performance with our comprehensive supplier management module."
          image="https://images.unsplash.com/photo-1556740758-90de374c12ad?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
          bullets={[
            'Create detailed supplier profiles with contact information, certifications, and documents',
            'Track supplier performance with customizable KPIs and scorecards',
            'Segment suppliers by category, spend, or other custom criteria',
            'Manage contracts and renewal dates with automatic notifications',
            'Simplify supplier onboarding with standardized processes'
          ]}
          delay={0}
        />

        <FeatureSection
          title="Effortless Purchase Order Processing"
          description="Create, manage, and track purchase orders throughout their entire lifecycle with our intuitive purchase order management system."
          image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
          bullets={[
            'Create purchase orders from templates or requisitions with just a few clicks',
            'Implement customizable approval workflows based on your business rules',
            'Track PO status from creation to delivery',
            'Generate and send professional PO documents directly to suppliers',
            'Link POs to invoices for streamlined three-way matching'
          ]}
          reverse
          delay={1}
        />

        <FeatureSection
          title="Real-time Inventory Visibility"
          description="Keep track of your inventory levels in real-time and ensure you never run out of critical items with our inventory management system."
          image="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
          bullets={[
            'Monitor stock levels across multiple locations',
            'Set up automatic reordering based on minimum stock levels',
            'Track product costs and valuation over time',
            'Generate inventory reports to identify slow-moving or obsolete items',
            'Integrate with barcode scanning for efficient receiving and stock counts'
          ]}
          delay={2}
        />

        <FeatureSection
          title="Powerful Analytics and Reporting"
          description="Make data-driven decisions with our comprehensive analytics and reporting tools that provide deep insights into your procurement operations."
          image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
          bullets={[
            'View key metrics on customizable dashboards',
            'Analyze spending patterns by category, supplier, or department',
            'Track cost savings and avoidance',
            'Monitor procurement KPIs with real-time data',
            'Export reports in multiple formats for sharing with stakeholders'
          ]}
          reverse
          delay={3}
        />
      </Container>

      {/* CTA Section */}
      <Box 
        sx={{ 
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          py: 10,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background effect */}
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            backgroundImage: 'radial-gradient(circle at 20% 90%, rgba(25, 118, 210, 0.1) 0%, transparent 40%), radial-gradient(circle at 80% 20%, rgba(245, 0, 87, 0.1) 0%, transparent 40%)'
          }}
        />
        
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
              Ready to streamline your procurement?
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 6 }}>
              Join thousands of businesses that have transformed their procurement process 
              with our powerful yet easy-to-use platform.
            </Typography>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={3}
              justifyContent="center"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  component={RouterLink}
                  to="/pricing"
                  variant="contained" 
                  color="primary" 
                  size="large"
                  sx={{ 
                    py: 1.5, 
                    px: 4,
                    borderRadius: '30px',
                    boxShadow: '0 10px 20px rgba(25,118,210,0.3)'
                  }}
                >
                  View Pricing
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  component={RouterLink}
                  to="/contact"
                  variant="outlined" 
                  color="primary" 
                  size="large"
                  sx={{ 
                    py: 1.5, 
                    px: 4,
                    borderRadius: '30px',
                    borderWidth: 2
                  }}
                >
                  Contact Sales
                </Button>
              </motion.div>
            </Stack>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default FeaturesPage; 