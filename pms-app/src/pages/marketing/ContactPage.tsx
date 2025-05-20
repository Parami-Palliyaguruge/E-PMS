import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Card, 
  CardContent, 
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Alert,
  useTheme,
  alpha,
  Grid,
  IconButton,
  InputAdornment
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SendIcon from '@mui/icons-material/Send';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
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

const faqs = [
  {
    question: "How quickly will I get a response to my inquiry?",
    answer: "We aim to respond to all inquiries within 24 business hours. For urgent matters, please call our sales team directly."
  },
  {
    question: "Do you offer product demos?",
    answer: "Yes! We offer personalized demos for all potential customers. Request a demo through the form or call our sales team to schedule."
  },
  {
    question: "How can I request custom features for my business?",
    answer: "Enterprise customers can request custom features through their dedicated account manager. Contact us to discuss your specific requirements."
  },
  {
    question: "Do you offer implementation support?",
    answer: "Yes, we provide implementation support for all plans. Premium support with dedicated onboarding specialists is available for Professional and Enterprise plans."
  },
  {
    question: "How do I report technical issues?",
    answer: "Current customers can report issues through the in-app support portal. If you're unable to access your account, please email support@pmssystem.com."
  }
];

const ContactPage: React.FC = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [formStatus, setFormStatus] = useState<{
    submitted: boolean;
    success: boolean;
    message: string;
  }>({
    submitted: false,
    success: false,
    message: ''
  });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: ''
  });

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, you would send this data to your backend
    console.log('Form submitted:', formData);
    
    // Simulate API call success
    setFormStatus({
      submitted: true,
      success: true,
      message: 'Thank you for your message! Our team will contact you shortly.'
    });
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      company: '',
      phone: '',
      message: ''
    });
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{ 
          position: 'relative',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          pt: { xs: 10, md: 16 },
          pb: { xs: 14, md: 20 },
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
          {[...Array(5)].map((_, i) => (
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
            <Typography 
              variant="h2" 
              fontWeight="bold"
              align="center"
              sx={{ mb: 2 }}
            >
              Contact Us
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ mb: 4, opacity: 0.9, textAlign: 'center', maxWidth: 800, mx: 'auto' }}
            >
              Have questions about our products or services? Reach out to our team and we'll be happy to help.
            </Typography>
          </motion.div>
        </Container>
      </Box>

      {/* Contact Form and Info Section */}
      <Container maxWidth="lg" sx={{ my: { xs: -8, md: -12 }, position: 'relative', zIndex: 1 }}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <Paper 
            elevation={5} 
            sx={{ 
              p: { xs: 3, md: 5 }, 
              borderRadius: 4,
              boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
              overflow: 'hidden'
            }}
          >
            <Stack 
              direction={{ xs: 'column', md: 'row' }} 
              spacing={6}
            >
              <Box sx={{ width: '100%', maxWidth: { md: '58.33%' } }}>
                <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom>
                  Send Us a Message
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Fill out the form below and we'll get back to you as soon as possible.
                </Typography>
                
                {formStatus.submitted && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Alert 
                      severity={formStatus.success ? "success" : "error"}
                      sx={{ 
                        mb: 4, 
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                      }}
                      variant="filled"
                    >
                      {formStatus.message}
                    </Alert>
                  </motion.div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <motion.div
                    variants={staggerChildren}
                    initial="hidden"
                    animate="visible"
                  >
                    <Stack direction="row" flexWrap="wrap" sx={{ mb: 3, gap: 3 }}>
                      <motion.div variants={childVariant} style={{ width: '100%', flex: '1 1 calc(50% - 12px)' }}>
                        <TextField
                          fullWidth
                          label="Name"
                          name="name"
                          variant="outlined"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2
                            }
                          }}
                        />
                      </motion.div>
                      <motion.div variants={childVariant} style={{ width: '100%', flex: '1 1 calc(50% - 12px)' }}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          type="email"
                          variant="outlined"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2
                            }
                          }}
                        />
                      </motion.div>
                    </Stack>
                    <Stack direction="row" flexWrap="wrap" sx={{ mb: 3, gap: 3 }}>
                      <motion.div variants={childVariant} style={{ width: '100%', flex: '1 1 calc(50% - 12px)' }}>
                        <TextField
                          fullWidth
                          label="Company"
                          name="company"
                          variant="outlined"
                          value={formData.company}
                          onChange={handleChange}
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2
                            }
                          }}
                        />
                      </motion.div>
                      <motion.div variants={childVariant} style={{ width: '100%', flex: '1 1 calc(50% - 12px)' }}>
                        <TextField
                          fullWidth
                          label="Phone"
                          name="phone"
                          variant="outlined"
                          value={formData.phone}
                          onChange={handleChange}
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2
                            }
                          }}
                        />
                      </motion.div>
                    </Stack>
                    <motion.div variants={childVariant} style={{ width: '100%', marginBottom: '24px' }}>
                      <TextField
                        fullWidth
                        label="Message"
                        name="message"
                        variant="outlined"
                        multiline
                        rows={6}
                        required
                        value={formData.message}
                        onChange={handleChange}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          }
                        }}
                      />
                    </motion.div>
                    <motion.div 
                      variants={childVariant}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        type="submit"
                        variant="contained" 
                        color="primary"
                        size="large"
                        endIcon={<SendIcon />}
                        sx={{ 
                          py: 1.5, 
                          px: 4,
                          borderRadius: 8,
                          fontWeight: 'bold',
                          boxShadow: '0 8px 16px rgba(25, 118, 210, 0.2)'
                        }}
                      >
                        Send Message
                      </Button>
                    </motion.div>
                  </motion.div>
                </form>
              </Box>
              
              <Box sx={{ width: '100%', maxWidth: { md: '41.67%' } }}>
                <motion.div 
                  variants={staggerChildren}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div variants={childVariant}>
                    <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom>
                      Contact Information
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
                      You can also reach us through the following channels:
                    </Typography>
                  </motion.div>
                  
                  <Stack spacing={3} sx={{ mb: 5 }}>
                    <motion.div variants={childVariant} whileHover={{ y: -5, transition: { type: "spring", stiffness: 300 } }}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          borderRadius: 3,
                          borderWidth: 1,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                            borderColor: theme.palette.primary.main
                          }
                        }}
                      >
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                          <Box 
                            sx={{ 
                              mr: 3, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main',
                              p: 1.5,
                              borderRadius: '50%'
                            }}
                          >
                            <EmailIcon sx={{ fontSize: 30 }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              Email Us
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              sales@pmssystem.com
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div variants={childVariant} whileHover={{ y: -5, transition: { type: "spring", stiffness: 300 } }}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          borderRadius: 3,
                          borderWidth: 1,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                            borderColor: theme.palette.primary.main
                          }
                        }}
                      >
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                          <Box 
                            sx={{ 
                              mr: 3, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main',
                              p: 1.5,
                              borderRadius: '50%'
                            }}
                          >
                            <PhoneIcon sx={{ fontSize: 30 }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              Call Us
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              +1 (555) 123-4567
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div variants={childVariant} whileHover={{ y: -5, transition: { type: "spring", stiffness: 300 } }}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          borderRadius: 3,
                          borderWidth: 1,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                            borderColor: theme.palette.primary.main
                          }
                        }}
                      >
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                          <Box 
                            sx={{ 
                              mr: 3, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main',
                              p: 1.5,
                              borderRadius: '50%'
                            }}
                          >
                            <LocationOnIcon sx={{ fontSize: 30 }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              Visit Us
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              123 Business Ave, Suite 100<br />
                              San Francisco, CA 94107
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Stack>
                  
                  <Divider sx={{ my: 4 }} />
                  
                  <motion.div variants={childVariant}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Business Hours
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 4 }}>
                      Monday - Friday: 9:00 AM - 6:00 PM PST<br />
                      Saturday & Sunday: Closed
                    </Typography>
                  </motion.div>

                  <motion.div variants={childVariant}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Follow Us
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <IconButton 
                        color="primary" 
                        sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.2)
                          }
                        }}
                      >
                        <LinkedInIcon />
                      </IconButton>
                      <IconButton 
                        color="primary" 
                        sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.2)
                          }
                        }}
                      >
                        <TwitterIcon />
                      </IconButton>
                      <IconButton 
                        color="primary" 
                        sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.2)
                          }
                        }}
                      >
                        <FacebookIcon />
                      </IconButton>
                      <IconButton 
                        color="primary" 
                        sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.2)
                          }
                        }}
                      >
                        <InstagramIcon />
                      </IconButton>
                    </Stack>
                  </motion.div>
                </motion.div>
              </Box>
            </Stack>
          </Paper>
        </motion.div>
      </Container>
      
      {/* FAQs Section */}
      <Box 
        sx={{ 
          bgcolor: alpha(theme.palette.grey[100], 0.5),
          py: 14, 
          mt: 8,
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
            <Typography variant="body1" align="center" color="text.secondary" paragraph sx={{ mb: 8 }}>
              Find quick answers to common questions about contacting our team.
            </Typography>
          </motion.div>
          
          <motion.div
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {faqs.map((faq, index) => (
              <motion.div 
                key={index} 
                variants={childVariant}
              >
                <Accordion 
                  sx={{ 
                    mb: 3,
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    '&::before': {
                      display: 'none',
                    }
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
          </motion.div>
        </Container>
      </Box>
      
      {/* Map Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
        >
          <Box 
            sx={{ 
              borderRadius: 4, 
              overflow: 'hidden',
              height: 400,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}
          >
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.0668189475366!2d-122.40142648433782!3d37.78518721942779!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80858085bbc30f9f%3A0x4b48af6c239b2e01!2sSan%20Francisco%2C%20CA%2094107!5e0!3m2!1sen!2sus!4v1631493637819!5m2!1sen!2sus" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={false} 
              loading="lazy"
              title="Office Location"
            />
          </Box>
        </motion.div>
      </Container>
      
      {/* CTA Section */}
      <Box 
        sx={{ 
          py: 12,
          backgroundImage: `linear-gradient(to right, ${alpha(theme.palette.primary.dark, 0.8)}, ${alpha(theme.palette.primary.main, 0.8)}), url(https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          textAlign: 'center'
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
              Ready to get started?
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
                  to={currentUser ? "/app/dashboard" : "/register"}
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
                  to="/pricing"
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
                  View Pricing
                </Button>
              </motion.div>
            </Stack>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default ContactPage; 