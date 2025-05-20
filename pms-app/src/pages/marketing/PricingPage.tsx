import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormGroup,
  FormControlLabel,
  Divider,
  Chip,
  Paper,
  Stack,
  Tab,
  Tabs,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha
} from '@mui/material';
import {
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
};

const fadeInRight = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5
    }
  })
};

// Pricing plans
const pricingPlans = [
  {
    title: 'Free',
    price: {
      monthly: 0,
      annually: 0
    },
    description: 'Perfect for small businesses just getting started with procurement management.',
    features: [
      { name: 'Up to 5 users', included: true },
      { name: 'Supplier management (up to 25 suppliers)', included: true },
      { name: 'Basic purchase orders', included: true },
      { name: 'Basic inventory tracking', included: true },
      { name: 'Email support', included: true },
      { name: 'Advanced reporting', included: false },
      { name: 'Approval workflows', included: false },
      { name: 'Invoice management', included: false },
      { name: 'API access', included: false },
      { name: 'Custom branding', included: false },
    ],
    cta: 'Get Started',
    popular: false
  },
  {
    title: 'Professional',
    price: {
      monthly: 49,
      annually: 39
    },
    description: 'Ideal for growing businesses that need more advanced features and automation.',
    features: [
      { name: 'Up to 20 users', included: true },
      { name: 'Unlimited suppliers', included: true },
      { name: 'Advanced purchase orders', included: true },
      { name: 'Advanced inventory tracking', included: true },
      { name: 'Priority email support', included: true },
      { name: 'Advanced reporting', included: true },
      { name: 'Approval workflows', included: true },
      { name: 'Invoice management', included: true },
      { name: 'API access', included: false },
      { name: 'Custom branding', included: false },
    ],
    cta: 'Try Free for 14 Days',
    popular: true
  },
  {
    title: 'Enterprise',
    price: {
      monthly: 99,
      annually: 79
    },
    description: 'For organizations that need the highest level of customization, security, and support.',
    features: [
      { name: 'Unlimited users', included: true },
      { name: 'Unlimited suppliers', included: true },
      { name: 'Advanced purchase orders', included: true },
      { name: 'Advanced inventory tracking', included: true },
      { name: 'Priority phone & email support', included: true },
      { name: 'Advanced reporting', included: true },
      { name: 'Approval workflows', included: true },
      { name: 'Invoice management', included: true },
      { name: 'API access', included: true },
      { name: 'Custom branding', included: true },
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

// FAQs
const faqs = [
  {
    question: 'Can I switch plans later?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. If you upgrade, the new pricing will be effective immediately. If you downgrade, the new pricing will take effect at the start of your next billing cycle.'
  },
  {
    question: 'Is there a setup fee?',
    answer: 'No, there are no setup fees for any of our plans. You only pay the subscription fee for the plan you choose.'
  },
  {
    question: 'Do you offer a free trial?',
    answer: 'Yes, we offer a 14-day free trial for our Professional and Enterprise plans. No credit card is required to start your trial.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. For Enterprise plans, we also offer invoicing options.'
  },
  {
    question: 'Can I cancel my subscription at any time?',
    answer: 'Yes, you can cancel your subscription at any time. If you cancel, you\'ll have access to your plan until the end of your current billing cycle.'
  },
  {
    question: 'Do you offer discounts for nonprofits or educational institutions?',
    answer: 'Yes, we offer special pricing for nonprofits, educational institutions, and startups. Please contact our sales team for more information.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we take data security very seriously. We use industry-standard encryption and security practices to protect your data. Our system is hosted on secure cloud infrastructure with regular backups and monitoring.'
  }
];

const PricingPage: React.FC = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly');
  const [comparisonTab, setComparisonTab] = useState(0);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBillingPeriodChange = () => {
    setBillingPeriod(prev => prev === 'monthly' ? 'annually' : 'monthly');
  };

  const handleComparisonTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setComparisonTab(newValue);
  };

  // Calculate yearly savings percentage
  const calculateSavings = (monthly: number, annually: number) => {
    if (monthly === 0) return 0;
    return Math.round(100 - ((annually * 12) / (monthly * 12) * 100));
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{ 
          position: 'relative',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          pt: { xs: 12, md: 16 },
          pb: { xs: 16, md: 20 },
          overflow: 'hidden'
        }}
      >
        {/* Background animated patterns */}
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
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                x: [0, Math.random() * 100 - 50],
                y: [0, Math.random() * 100 - 50],
                rotate: [0, Math.random() * 360],
                scale: [1, 1 + Math.random() * 0.2]
              }}
              transition={{
                duration: 15 + Math.random() * 10,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
              style={{
                position: 'absolute',
                width: 200 + Math.random() * 400,
                height: 200 + Math.random() * 400,
                borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
                background: 'white',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                opacity: 0.1
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
                Simple, Transparent Pricing
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ mb: 6, maxWidth: 700, mx: 'auto', opacity: 0.9 }}
              >
                Choose the plan that's right for your business. All plans include a 14-day free trial.
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 8 }}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FormGroup>
                    <FormControlLabel 
                      control={
                        <Switch 
                          checked={billingPeriod === 'annually'} 
                          onChange={handleBillingPeriodChange}
                          color="secondary"
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: 'secondary.main',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: 'secondary.main',
                            },
                          }}
                        />
                      } 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography sx={{ mr: 1, color: billingPeriod === 'monthly' ? 'white' : alpha(theme.palette.common.white, 0.7) }}>
                            Bill Monthly
                          </Typography>
                          <Typography fontWeight="bold" sx={{ color: billingPeriod === 'annually' ? 'white' : alpha(theme.palette.common.white, 0.7) }}>
                            Bill Annually
                          </Typography>
                          <Chip 
                            label="Save 20%" 
                            color="secondary" 
                            size="small" 
                            sx={{ 
                              ml: 1,
                              fontWeight: 'bold',
                              bgcolor: alpha(theme.palette.secondary.main, 0.9),
                            }}
                          />
                        </Box>
                      }
                      sx={{ 
                        p: 1.5,
                        pl: 2,
                        pr: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 3,
                        backdropFilter: 'blur(5px)',
                        '& .MuiFormControlLabel-label': { 
                          display: 'flex', 
                          alignItems: 'center' 
                        }
                      }}
                    />
                  </FormGroup>
                </motion.div>
              </Box>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Pricing Cards */}
      <Container maxWidth="lg" sx={{ mt: { xs: -10, md: -12 }, position: 'relative', zIndex: 1, mb: 12 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
          {pricingPlans.map((plan, i) => (
            <motion.div
              key={plan.title}
              variants={cardVariants}
              custom={i}
              initial="hidden"
              animate="visible"
              style={{
                width: '100%',
                maxWidth: 350,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Card 
                raised={plan.popular} 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  borderRadius: 4,
                  overflow: 'hidden',
                  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                  },
                  ...(plan.popular ? {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                    borderStyle: 'solid',
                    transform: 'scale(1.05)',
                    zIndex: 2
                  } : {})
                }}
              >
                {plan.popular && (
                  <Chip
                    label="Most Popular"
                    color="primary"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      px: 1,
                      fontWeight: 'bold',
                      fontSize: '0.875rem'
                    }}
                  />
                )}
                <CardHeader
                  title={plan.title}
                  titleTypographyProps={{ 
                    align: 'center', 
                    variant: 'h5', 
                    fontWeight: 'bold' 
                  }}
                  sx={{ 
                    bgcolor: plan.popular ? alpha(theme.palette.primary.main, 0.1) : 'grey.100',
                    py: 3
                  }}
                />
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 4 }}>
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <motion.div
                      key={`${plan.title}-${billingPeriod}`}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Typography component="h2" variant="h3" color="text.primary" fontWeight="bold">
                        ${billingPeriod === 'monthly' ? plan.price.monthly : plan.price.annually}
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary">
                        per user / month
                      </Typography>
                      {billingPeriod === 'annually' && plan.price.monthly > 0 && (
                        <Chip
                          label={`Save ${calculateSavings(plan.price.monthly, plan.price.annually)}%`}
                          color="success"
                          size="small"
                          sx={{ mt: 1, fontWeight: 'medium' }}
                        />
                      )}
                    </motion.div>
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    paragraph
                    align="center"
                    sx={{ mb: 3 }}
                  >
                    {plan.description}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ flexGrow: 1, mb: 4 }}>
                    <List dense>
                      {plan.features.map((feature, index) => (
                        <ListItem key={index} sx={{ py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            {feature.included ? (
                              <CheckCircleIcon color="success" />
                            ) : (
                              <CancelIcon color="disabled" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={feature.name}
                            primaryTypographyProps={{
                              color: feature.included ? 'text.primary' : 'text.secondary',
                              fontSize: '0.9rem',
                              ...(feature.included ? {} : { fontWeight: 'normal' })
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                  
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      component={RouterLink}
                      to={plan.title === 'Enterprise' ? '/contact' : currentUser ? '/app/dashboard' : '/auth/register'}
                      fullWidth
                      variant={plan.popular ? 'contained' : 'outlined'}
                      color="primary"
                      size="large"
                      sx={{ 
                        py: 1.5, 
                        borderRadius: 8,
                        fontWeight: 'bold',
                        ...(plan.popular ? {
                          boxShadow: '0 8px 16px rgba(25, 118, 210, 0.3)'
                        } : {
                          borderWidth: 2,
                        })
                      }}
                    >
                      {plan.cta}
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </Box>
      </Container>

      {/* Feature Comparison */}
      <Container maxWidth="lg" sx={{ py: 8, mb: 8 }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
        >
          <Typography variant="h4" component="h2" align="center" fontWeight="bold" gutterBottom>
            Compare Plan Features
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
            See which plan is right for your business needs
          </Typography>
        </motion.div>
        
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
        >
          <Paper 
            sx={{ 
              overflow: 'hidden', 
              mb: 8, 
              borderRadius: 4,
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={comparisonTab}
                onChange={handleComparisonTabChange}
                variant="fullWidth"
                aria-label="feature comparison tabs"
                sx={{
                  '& .MuiTab-root': {
                    py: 2,
                    fontWeight: 'medium'
                  },
                  '& .Mui-selected': {
                    fontWeight: 'bold'
                  }
                }}
              >
                <Tab label="Core Features" />
                <Tab label="Users & Support" />
                <Tab label="Advanced Features" />
              </Tabs>
            </Box>
            
            {/* Core Features Tab */}
            {comparisonTab === 0 && (
              <Box sx={{ p: { xs: 2, md: 4 } }}>
                <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider', py: 2 }}>
                  <Box sx={{ width: '33%', fontWeight: 'bold' }}>Feature</Box>
                  <Box sx={{ width: '67%', display: 'flex' }}>
                    <Box sx={{ width: '33%', textAlign: 'center', fontWeight: 'bold' }}>Free</Box>
                    <Box sx={{ width: '33%', textAlign: 'center', fontWeight: 'bold' }}>Professional</Box>
                    <Box sx={{ width: '33%', textAlign: 'center', fontWeight: 'bold' }}>Enterprise</Box>
                  </Box>
                </Box>
                
                {[
                  { name: 'Supplier Management', free: 'Up to 25 suppliers', pro: 'Unlimited', enterprise: 'Unlimited' },
                  { name: 'Purchase Orders', free: 'Basic', pro: 'Advanced', enterprise: 'Advanced with custom fields' },
                  { name: 'Inventory Tracking', free: 'Basic', pro: 'Advanced', enterprise: 'Multi-location' },
                  { name: 'Document Storage', free: '50MB', pro: '1GB', enterprise: '10GB' },
                  { name: 'Templates', free: 'Basic templates', pro: 'Advanced templates', enterprise: 'Custom templates' },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider', py: 2 }}>
                      <Box sx={{ width: '33%' }}>{feature.name}</Box>
                      <Box sx={{ width: '67%', display: 'flex' }}>
                        <Box sx={{ width: '33%', textAlign: 'center' }}>{feature.free}</Box>
                        <Box sx={{ width: '33%', textAlign: 'center' }}>{feature.pro}</Box>
                        <Box sx={{ width: '33%', textAlign: 'center' }}>{feature.enterprise}</Box>
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            )}
            
            {/* Users & Support Tab */}
            {comparisonTab === 1 && (
              <Box sx={{ p: { xs: 2, md: 4 } }}>
                <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider', py: 2 }}>
                  <Box sx={{ width: '33%', fontWeight: 'bold' }}>Feature</Box>
                  <Box sx={{ width: '67%', display: 'flex' }}>
                    <Box sx={{ width: '33%', textAlign: 'center', fontWeight: 'bold' }}>Free</Box>
                    <Box sx={{ width: '33%', textAlign: 'center', fontWeight: 'bold' }}>Professional</Box>
                    <Box sx={{ width: '33%', textAlign: 'center', fontWeight: 'bold' }}>Enterprise</Box>
                  </Box>
                </Box>
                
                {[
                  { name: 'Users', free: 'Up to 5', pro: 'Up to 20', enterprise: 'Unlimited' },
                  { name: 'User Roles', free: 'Basic', pro: 'Advanced', enterprise: 'Custom roles' },
                  { name: 'Support', free: 'Email support', pro: 'Priority email support', enterprise: 'Phone & email support' },
                  { name: 'Response Time', free: '48 hours', pro: '24 hours', enterprise: '4 hours' },
                  { name: 'Training', free: 'Documentation', pro: 'Documentation & webinars', enterprise: 'Custom training' },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider', py: 2 }}>
                      <Box sx={{ width: '33%' }}>{feature.name}</Box>
                      <Box sx={{ width: '67%', display: 'flex' }}>
                        <Box sx={{ width: '33%', textAlign: 'center' }}>{feature.free}</Box>
                        <Box sx={{ width: '33%', textAlign: 'center' }}>{feature.pro}</Box>
                        <Box sx={{ width: '33%', textAlign: 'center' }}>{feature.enterprise}</Box>
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            )}
            
            {/* Advanced Features Tab */}
            {comparisonTab === 2 && (
              <Box sx={{ p: { xs: 2, md: 4 } }}>
                <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider', py: 2 }}>
                  <Box sx={{ width: '33%', fontWeight: 'bold' }}>Feature</Box>
                  <Box sx={{ width: '67%', display: 'flex' }}>
                    <Box sx={{ width: '33%', textAlign: 'center', fontWeight: 'bold' }}>Free</Box>
                    <Box sx={{ width: '33%', textAlign: 'center', fontWeight: 'bold' }}>Professional</Box>
                    <Box sx={{ width: '33%', textAlign: 'center', fontWeight: 'bold' }}>Enterprise</Box>
                  </Box>
                </Box>
                
                {[
                  { name: 'API Access', free: <CancelIcon color="error" />, pro: <CancelIcon color="error" />, enterprise: <CheckIcon color="success" /> },
                  { name: 'Approval Workflows', free: <CancelIcon color="error" />, pro: <CheckIcon color="success" />, enterprise: <CheckIcon color="success" /> },
                  { name: 'Custom Branding', free: <CancelIcon color="error" />, pro: <CancelIcon color="error" />, enterprise: <CheckIcon color="success" /> },
                  { name: 'Advanced Analytics', free: <CancelIcon color="error" />, pro: <CheckIcon color="success" />, enterprise: <CheckIcon color="success" /> },
                  { name: 'Data Export', free: 'CSV', pro: 'CSV, Excel', enterprise: 'CSV, Excel, API' },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider', py: 2 }}>
                      <Box sx={{ width: '33%' }}>{feature.name}</Box>
                      <Box sx={{ width: '67%', display: 'flex' }}>
                        <Box sx={{ width: '33%', textAlign: 'center' }}>{feature.free}</Box>
                        <Box sx={{ width: '33%', textAlign: 'center' }}>{feature.pro}</Box>
                        <Box sx={{ width: '33%', textAlign: 'center' }}>{feature.enterprise}</Box>
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            )}
          </Paper>
        </motion.div>
      </Container>

      {/* FAQs Section */}
      <Box 
        sx={{ 
          bgcolor: alpha(theme.palette.grey[100], 0.5), 
          py: 10,
          backgroundImage: 'radial-gradient(circle at 20% 90%, rgba(25, 118, 210, 0.03) 0%, transparent 40%), radial-gradient(circle at 80% 20%, rgba(245, 0, 87, 0.03) 0%, transparent 40%)'
        }}
      >
        <Container maxWidth="md">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            <Typography variant="h4" component="h2" align="center" fontWeight="bold" gutterBottom>
              Frequently Asked Questions
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
              Still have questions? Contact our <RouterLink to="/contact" style={{ color: theme.palette.primary.main, fontWeight: 500 }}>sales team</RouterLink>.
            </Typography>
          </motion.div>
          
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={index % 2 === 0 ? fadeInLeft : fadeInRight}
              custom={index}
            >
              <Accordion 
                sx={{ 
                  mb: 2,
                  borderRadius: 2,
                  overflow: 'hidden',
                  '&::before': {
                    display: 'none',
                  },
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`faq-content-${index}`}
                  id={`faq-header-${index}`}
                  sx={{
                    '&.Mui-expanded': {
                      bgcolor: alpha(theme.palette.primary.main, 0.03),
                    }
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>{faq.question}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: 'background.paper' }}>
                  <Typography variant="body1" color="text.secondary">
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </motion.div>
          ))}
        </Container>
      </Box>

      {/* CTA Section */}
      <Box 
        sx={{ 
          py: 12,
          backgroundImage: `linear-gradient(to right, ${alpha(theme.palette.primary.dark, 0.8)}, ${alpha(theme.palette.primary.main, 0.8)}), url(https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        <Container maxWidth="md">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
              Ready to streamline your procurement?
            </Typography>
            <Typography variant="h6" sx={{ mb: 6, opacity: 0.9, maxWidth: 700, mx: 'auto' }}>
              Try our platform free for 14 days. No credit card required.
            </Typography>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={3}
              justifyContent="center"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  component={RouterLink}
                  to={currentUser ? "/app/dashboard" : "/auth/register"}
                  variant="contained" 
                  color="secondary" 
                  size="large"
                  sx={{ 
                    py: 1.5, 
                    px: 4,
                    borderRadius: 8,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 20px rgba(245,0,87,0.3)'
                  }}
                >
                  {currentUser ? 'Go to Dashboard' : 'Start Free Trial'}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  component={RouterLink}
                  to="/contact"
                  variant="outlined" 
                  color="inherit" 
                  size="large"
                  sx={{ 
                    py: 1.5, 
                    px: 4,
                    borderRadius: 8,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    borderWidth: 2
                  }}
                >
                  Talk to Sales
                </Button>
              </motion.div>
            </Stack>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default PricingPage; 