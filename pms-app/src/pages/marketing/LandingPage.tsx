import React, { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Paper,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  InsertChart as ChartIcon,
  Settings as SettingsIcon,
  ArrowForward as ArrowForwardIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  CreditCard as CreditCardIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 1 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3
    }
  }
};

const cardVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1]
    }
  })
};

const slideInLeft = {
  hidden: { opacity: 0, x: -80 },
  visible: { opacity: 1, x: 0, transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } }
};

const slideInRight = {
  hidden: { opacity: 0, x: 80 },
  visible: { opacity: 1, x: 0, transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } }
};

// Company logos
const companyLogos = [
  { name: 'Amazon', logo: 'https://images.unsplash.com/photo-1622570075083-bac115aefae6?w=100&auto=format' },
  { name: 'Microsoft', logo: 'https://images.unsplash.com/photo-1623281765929-2f5eb1bd2323?w=100&auto=format' },
  { name: 'Google', logo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=100&auto=format' },
  { name: 'IBM', logo: 'https://images.unsplash.com/photo-1630866580589-3c299776fb40?w=100&auto=format' },
  { name: 'Salesforce', logo: 'https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=100&auto=format' },
  { name: 'Oracle', logo: 'https://images.unsplash.com/photo-1601581975053-7c899da7347e?w=100&auto=format' }
];

// Metrics data
const metrics = [
  { value: '700%', label: 'Higher Conversion', icon: <CreditCardIcon fontSize="large" /> },
  { value: '42x', label: 'Faster Processing', icon: <SpeedIcon fontSize="large" /> },
  { value: '300%', label: 'Better Supplier Management', icon: <SecurityIcon fontSize="large" /> }
];

// Testimonial data
const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Supply Chain Manager',
    company: 'TechCorp Inc.',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format',
    content: 'This procurement management system has completely streamlined our purchasing process. We\'ve reduced order processing time by 60% and have much better visibility into our spending.'
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Operations Director',
    company: 'Global Manufacturing',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format',
    content: 'The inventory tracking and supplier management features have transformed how we handle our procurement. The reporting tools give us insights we never had before.'
  },
  {
    id: 3,
    name: 'Jessica Wong',
    role: 'Procurement Officer',
    company: 'Healthcare Solutions',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format',
    content: 'As a small business, we needed an affordable solution that could grow with us. This platform has all the features we need without the enterprise price tag.'
  }
];

// Feature list data
const features = [
  {
    title: 'Supplier Management',
    description: 'Track and manage relationships with your suppliers, store contact information, and track performance.',
    icon: <InventoryIcon fontSize="large" color="primary" />,
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=500&auto=format'
  },
  {
    title: 'Purchase Order Management',
    description: 'Create, track, and manage purchase orders from creation to fulfillment with intuitive workflows.',
    icon: <ShoppingCartIcon fontSize="large" color="primary" />,
    image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=500&auto=format'
  },
  {
    title: 'Inventory Tracking',
    description: 'Keep track of your inventory levels, set reorder points, and avoid stockouts with real-time alerts.',
    icon: <InventoryIcon fontSize="large" color="primary" />,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500&auto=format'
  },
  {
    title: 'Invoice Management',
    description: 'Manage supplier invoices, track payment status, and maintain complete payment history.',
    icon: <ReceiptIcon fontSize="large" color="primary" />,
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=500&auto=format'
  },
  {
    title: 'Reporting & Analytics',
    description: 'Gain insights into your procurement process with comprehensive reports and visual analytics.',
    icon: <ChartIcon fontSize="large" color="primary" />,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format'
  },
  {
    title: 'Customizable Settings',
    description: 'Configure the system to meet your specific business needs and customize your workflows.',
    icon: <SettingsIcon fontSize="large" color="primary" />,
    image: 'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=500&auto=format'
  }
];

// Benefits list
const benefits = [
  'Reduce manual paperwork and data entry by up to 80%',
  'Streamline purchasing and approval processes',
  'Improve visibility into spending and supplier performance',
  'Prevent stockouts with intelligent inventory tracking',
  'Enhance supplier collaboration and communication',
  'Access critical data from anywhere, anytime'
];

const useCases = [
  {
    title: 'Centralize Procurement',
    description: 'Create a single source of truth for all procurement activities, from supplier management to purchase orders.',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&auto=format',
  },
  {
    title: 'Automate Workflows',
    description: 'Set up automated approval flows and notifications to keep processes moving without manual intervention.',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format',
  },
  {
    title: 'Improve Decision Making',
    description: 'Leverage powerful analytics and reporting to make data-driven procurement decisions at every level.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format',
  }
];

const LandingPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser } = useAuth();

  // Main blue colors
  const blueMain = '#2563EB';
  const blueLight = '#EBF2FF';
  const blueDark = '#1E40AF';

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Box sx={{ 
      bgcolor: 'white',
      color: '#333',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Hero Section */}
      <Box sx={{ 
        position: 'relative',
        bgcolor: blueMain,
        background: `linear-gradient(135deg, ${blueMain} 0%, ${blueDark} 100%)`,
        pt: { xs: 12, md: 10 },
        pb: { xs: 20, md: 20 },
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden'
      }}>
        {/* Wave shape at bottom */}
        <Box 
          sx={{
            position: 'absolute',
            bottom: -1,
            left: 0,
            width: '100%',
            height: '150px',
            background: 'white',
            borderRadius: '100% 100% 0 0',
            zIndex: 2
          }}
        />
        
        {/* Dot pattern decorations */}
        <Box sx={{ 
          position: 'absolute',
          right: 20,
          top: 180,
          width: 60,
          height: 60,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.3'%3E%3Ccircle cx='10' cy='10' r='3' /%3E%3Ccircle cx='30' cy='10' r='3' /%3E%3Ccircle cx='50' cy='10' r='3' /%3E%3Ccircle cx='70' cy='10' r='3' /%3E%3Ccircle cx='90' cy='10' r='3' /%3E%3Ccircle cx='10' cy='30' r='3' /%3E%3Ccircle cx='30' cy='30' r='3' /%3E%3Ccircle cx='50' cy='30' r='3' /%3E%3Ccircle cx='70' cy='30' r='3' /%3E%3Ccircle cx='90' cy='30' r='3' /%3E%3Ccircle cx='10' cy='50' r='3' /%3E%3Ccircle cx='30' cy='50' r='3' /%3E%3Ccircle cx='50' cy='50' r='3' /%3E%3Ccircle cx='70' cy='50' r='3' /%3E%3Ccircle cx='90' cy='50' r='3' /%3E%3Ccircle cx='10' cy='70' r='3' /%3E%3Ccircle cx='30' cy='70' r='3' /%3E%3Ccircle cx='50' cy='70' r='3' /%3E%3Ccircle cx='70' cy='70' r='3' /%3E%3Ccircle cx='90' cy='70' r='3' /%3E%3Ccircle cx='10' cy='90' r='3' /%3E%3Ccircle cx='30' cy='90' r='3' /%3E%3Ccircle cx='50' cy='90' r='3' /%3E%3Ccircle cx='70' cy='90' r='3' /%3E%3Ccircle cx='90' cy='90' r='3' /%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          opacity: 0.8,
          zIndex: 2
        }}/>
        
        <Box sx={{ 
          position: 'absolute',
          left: '5%',
          bottom: '15%',
          width: 80,
          height: 80,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.3'%3E%3Ccircle cx='10' cy='10' r='3' /%3E%3Ccircle cx='30' cy='10' r='3' /%3E%3Ccircle cx='50' cy='10' r='3' /%3E%3Ccircle cx='70' cy='10' r='3' /%3E%3Ccircle cx='90' cy='10' r='3' /%3E%3Ccircle cx='10' cy='30' r='3' /%3E%3Ccircle cx='30' cy='30' r='3' /%3E%3Ccircle cx='50' cy='30' r='3' /%3E%3Ccircle cx='70' cy='30' r='3' /%3E%3Ccircle cx='90' cy='30' r='3' /%3E%3Ccircle cx='10' cy='50' r='3' /%3E%3Ccircle cx='30' cy='50' r='3' /%3E%3Ccircle cx='50' cy='50' r='3' /%3E%3Ccircle cx='70' cy='50' r='3' /%3E%3Ccircle cx='90' cy='50' r='3' /%3E%3Ccircle cx='10' cy='70' r='3' /%3E%3Ccircle cx='30' cy='70' r='3' /%3E%3Ccircle cx='50' cy='70' r='3' /%3E%3Ccircle cx='70' cy='70' r='3' /%3E%3Ccircle cx='90' cy='70' r='3' /%3E%3Ccircle cx='10' cy='90' r='3' /%3E%3Ccircle cx='30' cy='90' r='3' /%3E%3Ccircle cx='50' cy='90' r='3' /%3E%3Ccircle cx='70' cy='90' r='3' /%3E%3Ccircle cx='90' cy='90' r='3' /%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          opacity: 0.8,
          zIndex: 2
        }}/>

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 3 }}>
          <Grid container alignItems="center">
            <Grid size={{xs:12, md:6}} sx={{ position: 'relative' }}>
              <Box sx={{ 
                color: 'white',
                textAlign: { xs: 'center', md: 'left' }
              }}>
                <Typography 
                  variant="h1" 
                  sx={{ 
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 700,
                  lineHeight: 1.2,
                  mb: 3,
                  color: 'white',
                }}
                >
                  We Are Fully Services <br/>Procurement Agency
                </Typography>
              
                <Typography 
                  variant="body1"
                  sx={{ 
                    color: 'rgba(255,255,255,0.85)',
                    mb: 4,
                    maxWidth: 500,
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    lineHeight: 1.6,
                    textAlign: { xs: 'center', md: 'left' }
                  }}
                >
                  Our platform uses intuitive tools, techniques and technology to streamline your procurement process and help you make better decisions with data-driven insights.
                </Typography>
              
                <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      bgcolor: 'white',
                      color: blueMain,
                      borderRadius: '50px',
                      px: 4,
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 500,
                      boxShadow: '0px 4px 10px rgba(0,0,0,0.1)',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.9)',
                      }
                    }}
                  >
                    Get Started
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    sx={{ 
                      borderColor: 'white',
                      color: 'white',
                      borderRadius: '50px',
                      px: 4,
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)',
                      }
                    }}
                  >
                    Learn More
                  </Button>
                </Box>
              </Box>
            </Grid>
            
            <Grid size={{xs:12, md:6}} sx={{ mt: { xs: 6, md: 0 } }}>
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <Box 
                  component="img"
                  src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                  alt="Team working on procurement"
                  sx={{
                    width: '100%',
                    maxHeight: { xs: 300, md: 400 },
                    objectFit: 'cover',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                    zIndex: 1
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Client Logos Section */}
      <Box 
        sx={{ 
          py: { xs: 10, md: 12 }, 
          backgroundColor: 'white',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            <Typography 
              variant="subtitle1" 
              textAlign="center" 
              color="text.secondary"
              sx={{ mb: 6, fontWeight: 500, letterSpacing: 1 }}
            >
              TRUSTED BY LEADING COMPANIES WORLDWIDE
            </Typography>
            
            <Box 
              sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                justifyContent: 'center',
                alignItems: 'center',
                gap: { xs: 6, md: 12 },
                px: { xs: 2, md: 0 }
              }}
            >
              {companyLogos.map((company, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 0.6 }}
                  whileHover={{ opacity: 1, scale: 1.05 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Box 
                    component="img" 
                    src={company.logo} 
                    alt={company.name}
                    sx={{ 
                      height: { xs: 40, md: 50 },
                      filter: 'grayscale(100%)',
                      transition: 'all 0.3s',
                      '&:hover': {
                        filter: 'grayscale(0%)'
                      }
                    }}
                  />
                </motion.div>
              ))}
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: { xs: 12, md: 16 }, bgcolor: blueLight }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 12, textAlign: 'center' }}>
            <Typography 
              variant="overline" 
              sx={{ 
                color: blueMain, 
                fontWeight: 600, 
                letterSpacing: 1.5,
                display: 'block',
                mb: 1
              }}
            >
              CORE FEATURES
            </Typography>
            <Typography 
              variant="h3" 
              component="h2" 
              sx={{ 
                fontSize: { xs: '2rem', md: '2.5rem' },
                fontWeight: 700,
                mb: 3,
                color: '#111'
              }}
            >
              Essential Procurement Management Tools
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#555', 
                maxWidth: 600, 
                mx: 'auto',
                fontSize: '1.1rem'
              }}
            >
              Our comprehensive suite of tools helps businesses streamline procurement operations and reduce costs with powerful, intuitive features.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.slice(0, 3).map((feature, index) => (
              <Grid size={{xs:12, md:4}} key={index}>
                <motion.div
                  variants={cardVariant}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                >
                  <Box sx={{ 
                    height: '100%',
                    background: 'white',
                    p: 4,
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    }
                  }}>
                    <Box sx={{ 
                      color: blueMain,
                      mb: 2,
                      display: 'flex'
                    }}>
                      {feature.icon}
                    </Box>
                    <Typography 
                      variant="h5" 
                      component="h3" 
                      fontWeight="bold" 
                      sx={{ mb: 2 }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Metrics Section */}
      <Box sx={{ py: { xs: 12, md: 16 }, bgcolor: 'white', color: '#333', position: 'relative' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{xs:12, md:5}}>
              <Typography 
                variant="overline" 
                sx={{ 
                  color: blueMain, 
                  fontWeight: 600, 
                  letterSpacing: 1.5,
                  display: 'block',
                  mb: 1
                }}
              >
                REAL RESULTS
              </Typography>
              <Typography 
                variant="h3" 
                component="h2" 
                sx={{ 
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  fontWeight: 700,
                  mb: 3,
                  color: '#111'
                }}
              >
                Measurable Impact on Your Business
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#555', 
                  mb: 4
                }}
              >
                Our solution has transformed procurement operations for thousands of companies worldwide, delivering significant improvements in efficiency, cost, and supply chain management.
              </Typography>
              <Button
                variant="outlined"
                sx={{ 
                  color: blueMain,
                  borderColor: blueMain,
                  borderRadius: '50px',
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    borderColor: blueMain,
                    bgcolor: 'rgba(37, 99, 235, 0.04)'
                  }
                }}
              >
                View Case Studies
              </Button>
            </Grid>
            
            <Grid size={{xs:12, md:7}}>
              <Grid container spacing={3}>
                {metrics.map((metric, index) => (
                  <Grid size={{xs:12, md:4}} key={index}>
                    <Box sx={{ 
                      bgcolor: 'white', 
                      p: 3,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                      }
                    }}>
                      <Box sx={{ 
                        color: blueMain,
                        mb: 2,
                        display: 'flex'
                      }}>
                        {metric.icon}
                      </Box>
                      <Typography 
                        variant="h2" 
                        component="p" 
                        sx={{ 
                          fontSize: '3rem',
                          fontWeight: 800,
                          mb: 1,
                          color: blueMain
                        }}
                      >
                        {metric.value}
                      </Typography>
                      <Typography 
                        variant="body1"
                        sx={{ 
                          color: '#555',
                          fontWeight: 500
                        }}
                      >
                        {metric.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Use Cases Section */}
      <Box sx={{ bgcolor: '#f8fafc', py: { xs: 14, md: 20 } }}>
        <Container maxWidth="lg">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            <Typography 
              variant="h3" 
              component="h2" 
              fontWeight="900" 
              gutterBottom
              textAlign="center"
              sx={{
                mb: 2,
                fontSize: { xs: '2.25rem', md: '3.5rem' },
                color: '#4F46E5'
              }}
            >
              Why Choose Our Solution?
            </Typography>
            <Typography 
              variant="body1" 
              paragraph
              color="text.secondary"
              textAlign="center"
              sx={{ mb: 14, maxWidth: 800, mx: 'auto', fontSize: '1.25rem' }}
            >
              Our procurement management system is designed to help businesses of all sizes 
              optimize their purchasing processes, reduce costs, and improve efficiency.
            </Typography>
          </motion.div>

          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={index % 2 === 0 ? slideInLeft : slideInRight}
            >
              <Paper
                elevation={0}
                sx={{ 
                  mb: 14,
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(249,250,251,1) 100%)',
                  border: '1px solid rgba(0,0,0,0.04)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1)',
                }}
              >
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', md: index % 2 === 0 ? 'row' : 'row-reverse' },
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ width: { xs: '100%', md: '50%' }, p: { xs: 6, md: 10 } }}>
                    <Typography 
                      variant="h4" 
                      component="h3" 
                      fontWeight="bold" 
                      gutterBottom 
                      sx={{ 
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        color: '#4F46E5'
                      }}
                    >
                      {useCase.title}
                    </Typography>
                    <Typography variant="body1" paragraph color="text.secondary" sx={{ mb: 4, fontSize: '1.1rem', lineHeight: 1.7 }}>
                      {useCase.description}
                    </Typography>

                    <List disablePadding>
                      {benefits.slice(index * 2, index * 2 + 2).map((benefit, i) => (
                        <ListItem key={i} disableGutters sx={{ py: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <CheckCircleIcon sx={{ color: '#4F46E5' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={benefit} 
                            primaryTypographyProps={{ 
                              sx: { fontWeight: 'medium', fontSize: '1.05rem' } 
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    
                    <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400 }}>
                      <Button 
                        component={RouterLink}
                        to="/features"
                        size="large"
                        endIcon={<ArrowForwardIcon />}
                        sx={{ 
                          mt: 4,
                          fontWeight: 'bold',
                          fontSize: '1.05rem',
                          color: '#4F46E5',
                          '&:hover': {
                            background: 'transparent',
                            color: '#4338CA'
                          }
                        }}
                      >
                        Learn more
                      </Button>
                    </motion.div>
                  </Box>
                  <Box sx={{ width: { xs: '100%', md: '50%' }, height: { md: '500px' }, overflow: 'hidden' }}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Box 
                        component="img"
                        src={useCase.image}
                        alt={useCase.title}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </motion.div>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          ))}
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box sx={{ py: { xs: 12, md: 16 }, bgcolor: blueLight }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 10, textAlign: 'center' }}>
            <Typography 
              variant="overline" 
              sx={{ 
                color: blueMain, 
                fontWeight: 600, 
                letterSpacing: 1.5,
                display: 'block',
                mb: 1
              }}
            >
              CLIENT SUCCESS
            </Typography>
            <Typography 
              variant="h3" 
              component="h2" 
              sx={{ 
                fontSize: { xs: '2rem', md: '2.5rem' },
                fontWeight: 700,
                mb: 2,
                color: '#111'
              }}
            >
              Trusted by Industry Leaders
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#555', 
                maxWidth: 600, 
                mx: 'auto',
                fontSize: '1.1rem'
              }}
            >
              See what businesses like yours have achieved with our procurement management system.
            </Typography>
          </Box>

          <Box sx={{ position: 'relative' }}>
            <Grid container spacing={4}>
              {testimonials.slice(0, 1).map((testimonial) => (
                <Grid size={{xs:12, md:10}} sx={{ mx: 'auto' }} key={testimonial.id}>
                  <Box sx={{
                    bgcolor: 'white',
                    p: { xs: 4, md: 6 },
                    position: 'relative',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: 'center',
                    gap: 5
                  }}>
                    <Box sx={{ 
                      width: { xs: 80, md: 120 }, 
                      height: { xs: 80, md: 120 },
                      flexShrink: 0
                    }}>
                      <Avatar 
                        src={testimonial.avatar} 
                        alt={testimonial.name}
                        sx={{ 
                          width: '100%', 
                          height: '100%'
                        }}
                      />
                    </Box>
                    
                    <Box>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          mb: 3,
                          fontSize: '1.1rem',
                          lineHeight: 1.6,
                          color: '#444',
                          position: 'relative',
                          fontStyle: 'italic'
                        }}
                      >
                        <Box 
                          component="span" 
                          sx={{ 
                            position: 'absolute',
                            left: -20,
                            top: -10,
                            color: blueMain,
                            fontSize: '3rem',
                            opacity: 0.2,
                            fontFamily: 'Georgia, serif'
                          }}
                        >
                          "
                        </Box>
                        {testimonial.content}
                      </Typography>
                      
                      <Box sx={{ 
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <Typography variant="h6" fontWeight="bold">
                          {testimonial.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {testimonial.role}, {testimonial.company}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{
                      position: 'absolute',
                      right: 20,
                      bottom: 20,
                      display: 'flex',
                      gap: 1
                    }}>
                      <Button 
                        size="small" 
                        sx={{ 
                          minWidth: 'auto', 
                          p: 1,
                          color: '#999',
                          '&:hover': {
                            color: blueMain
                          }
                        }}
                      >
                        <ArrowForwardIcon style={{ transform: 'rotate(180deg)' }} />
                      </Button>
                      <Button 
                        size="small" 
                        sx={{ 
                          minWidth: 'auto', 
                          p: 1,
                          color: '#999',
                          '&:hover': {
                            color: blueMain
                          }
                        }}
                      >
                        <ArrowForwardIcon />
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: { xs: 12, md: 16 }, bgcolor: blueMain, position: 'relative' }}>
        {/* Wave shape at top */}
        <Box 
          sx={{
            position: 'absolute',
            top: -1,
            left: 0,
            width: '100%',
            height: '120px',
            background: 'white',
            borderRadius: '0 0 100% 100%',
            zIndex: 1
          }}
        />
        
        {/* Dot pattern decoration */}
        <Box sx={{ 
          position: 'absolute',
          right: '10%',
          bottom: '10%',
          width: 80,
          height: 80,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Ccircle cx='10' cy='10' r='3' /%3E%3Ccircle cx='30' cy='10' r='3' /%3E%3Ccircle cx='50' cy='10' r='3' /%3E%3Ccircle cx='70' cy='10' r='3' /%3E%3Ccircle cx='90' cy='10' r='3' /%3E%3Ccircle cx='10' cy='30' r='3' /%3E%3Ccircle cx='30' cy='30' r='3' /%3E%3Ccircle cx='50' cy='30' r='3' /%3E%3Ccircle cx='70' cy='30' r='3' /%3E%3Ccircle cx='90' cy='30' r='3' /%3E%3Ccircle cx='10' cy='50' r='3' /%3E%3Ccircle cx='30' cy='50' r='3' /%3E%3Ccircle cx='50' cy='50' r='3' /%3E%3Ccircle cx='70' cy='50' r='3' /%3E%3Ccircle cx='90' cy='50' r='3' /%3E%3Ccircle cx='10' cy='70' r='3' /%3E%3Ccircle cx='30' cy='70' r='3' /%3E%3Ccircle cx='50' cy='70' r='3' /%3E%3Ccircle cx='70' cy='70' r='3' /%3E%3Ccircle cx='90' cy='70' r='3' /%3E%3Ccircle cx='10' cy='90' r='3' /%3E%3Ccircle cx='30' cy='90' r='3' /%3E%3Ccircle cx='50' cy='90' r='3' /%3E%3Ccircle cx='70' cy='90' r='3' /%3E%3Ccircle cx='90' cy='90' r='3' /%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          opacity: 0.8,
          zIndex: 2
        }}/>
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 3 }}>
          <Box sx={{
            textAlign: 'center',
            color: 'white',
            maxWidth: 800,
            mx: 'auto'
          }}>
            <Typography 
              variant="h3" 
              component="h2" 
              sx={{ 
                fontSize: { xs: '2rem', md: '2.75rem' },
                fontWeight: 700,
                mb: 3,
              }}
            >
              Transform Your Procurement Process Today
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 5,
                fontSize: '1.1rem',
                opacity: 0.9
              }}
            >
              Join thousands of businesses that have streamlined their purchasing operations and reduced costs with our platform.
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              sx={{ 
                bgcolor: 'white',
                color: blueMain,
                borderRadius: '50px',
                px: 5,
                py: 1.5,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 500,
                boxShadow: '0px 4px 15px rgba(0,0,0,0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)',
                }
              }}
            >
              {currentUser ? 'Go to Dashboard' : 'Start Free Trial'}
            </Button>
            
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 3,
                color: 'rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}
            >
              <CheckCircleIcon sx={{ fontSize: '1rem' }} />
              No credit card required • Free 14-day trial
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 10, bgcolor: '#111', color: 'white' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{xs:12, md:4}}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1,
                mb: 3
              }}>
                <InventoryIcon sx={{ color: blueMain, fontSize: '2rem' }} />
                <Typography variant="h6" component="div" sx={{ 
                  fontWeight: 'bold',
                  fontSize: '1.25rem',
                  letterSpacing: '0.5px'
                }}>
                  ProcureFlow
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#aaa', mb: 3 }}>
                A comprehensive procurement management system designed to simplify purchasing, track inventory, and manage suppliers all in one platform.
              </Typography>
              <Typography variant="body2" sx={{ color: '#aaa' }}>
                © {new Date().getFullYear()} ProcureFlow. All rights reserved.
              </Typography>
            </Grid>
            
            <Grid size={{xs:6, md:2}}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: 'white', fontWeight: 'bold' }}>
                Platform
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#aaa', cursor: 'pointer', '&:hover': { color: blueMain } }}>Features</Typography>
                <Typography variant="body2" sx={{ color: '#aaa', cursor: 'pointer', '&:hover': { color: blueMain } }}>Pricing</Typography>
                <Typography variant="body2" sx={{ color: '#aaa', cursor: 'pointer', '&:hover': { color: blueMain } }}>Demo</Typography>
                <Typography variant="body2" sx={{ color: '#aaa', cursor: 'pointer', '&:hover': { color: blueMain } }}>Security</Typography>
              </Box>
            </Grid>
            
            <Grid size={{xs:6, md:2}}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: 'white', fontWeight: 'bold' }}>
                Resources
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#aaa', cursor: 'pointer', '&:hover': { color: blueMain } }}>Blog</Typography>
                <Typography variant="body2" sx={{ color: '#aaa', cursor: 'pointer', '&:hover': { color: blueMain } }}>Documentation</Typography>
                <Typography variant="body2" sx={{ color: '#aaa', cursor: 'pointer', '&:hover': { color: blueMain } }}>Guides</Typography>
                <Typography variant="body2" sx={{ color: '#aaa', cursor: 'pointer', '&:hover': { color: blueMain } }}>Support</Typography>
              </Box>
            </Grid>
            
            <Grid size={{xs:6, md:2}}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: 'white', fontWeight: 'bold' }}>
                Company
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#aaa', cursor: 'pointer', '&:hover': { color: blueMain } }}>About</Typography>
                <Typography variant="body2" sx={{ color: '#aaa', cursor: 'pointer', '&:hover': { color: blueMain } }}>Careers</Typography>
                <Typography variant="body2" sx={{ color: '#aaa', cursor: 'pointer', '&:hover': { color: blueMain } }}>News</Typography>
                <Typography variant="body2" sx={{ color: '#aaa', cursor: 'pointer', '&:hover': { color: blueMain } }}>Contact</Typography>
              </Box>
            </Grid>
            
            <Grid size={{xs:6, md:2}}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: 'white', fontWeight: 'bold' }}>
                Legal
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#aaa', cursor: 'pointer', '&:hover': { color: blueMain } }}>Terms</Typography>
                <Typography variant="body2" sx={{ color: '#aaa', cursor: 'pointer', '&:hover': { color: blueMain } }}>Privacy</Typography>
                <Typography variant="body2" sx={{ color: '#aaa', cursor: 'pointer', '&:hover': { color: blueMain } }}>Cookies</Typography>
                <Typography variant="body2" sx={{ color: '#aaa', cursor: 'pointer', '&:hover': { color: blueMain } }}>Licenses</Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage; 