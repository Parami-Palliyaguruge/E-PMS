import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stack,
  Paper,
  useTheme
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Groups as GroupsIcon,
  Lightbulb as LightbulbIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Devices as DevicesIcon,
} from '@mui/icons-material';

// Define an interface for company values for stronger typing
interface CompanyValue {
  title: string;
  description: string;
  icon: React.ReactNode;
}

// Company values
const companyValues: CompanyValue[] = [
  {
    title: 'Customer Focus',
    description: 'We put our customers at the center of everything we do, ensuring our solutions solve real procurement challenges.',
    icon: <GroupsIcon fontSize="large" color="primary" />
  },
  {
    title: 'Innovation',
    description: 'We\'re constantly exploring new technologies and approaches to improve procurement management.',
    icon: <LightbulbIcon fontSize="large" color="primary" />
  },
  {
    title: 'Security',
    description: 'We maintain the highest standards of data security and privacy to protect our customers\' information.',
    icon: <SecurityIcon fontSize="large" color="primary" />
  },
  {
    title: 'Performance',
    description: 'We build systems that are fast, reliable, and scalable to meet the needs of businesses of all sizes.',
    icon: <SpeedIcon fontSize="large" color="primary" />
  },
  {
    title: 'Accessibility',
    description: 'We design our products to be intuitive and accessible to users regardless of technical expertise.',
    icon: <DevicesIcon fontSize="large" color="primary" />
  }
];

// Team members
const teamMembers = [
  {
    name: 'Sarah Johnson',
    title: 'CEO & Co-Founder',
    bio: 'Sarah has 15+ years of experience in procurement and supply chain management. She founded PMS with a vision to make procurement accessible to businesses of all sizes.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80'
  },
  {
    name: 'Michael Chen',
    title: 'CTO & Co-Founder',
    bio: 'Michael brings 12+ years of software development expertise, specializing in creating scalable SaaS applications with a focus on user experience.',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80'
  },
  {
    name: 'David Rodriguez',
    title: 'Head of Product',
    bio: 'David has a decade of experience in product management, with a passion for creating solutions that solve complex business problems.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80'
  },
  {
    name: 'Priya Patel',
    title: 'Head of Customer Success',
    bio: 'Priya leads our customer success team, ensuring our clients achieve their procurement goals and maximize ROI from our platform.',
    image: 'https://images.unsplash.com/photo-1598550880863-4e8aa3d0edb4?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80'
  },
  {
    name: 'James Wilson',
    title: 'Head of Sales',
    bio: 'James has extensive experience in B2B SaaS sales, helping businesses find the right solutions for their procurement challenges.',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80'
  },
  {
    name: 'Aisha Kwame',
    title: 'Lead UX Designer',
    bio: 'Aisha focuses on creating intuitive and user-friendly interfaces that make complex procurement processes simple and efficient.',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80'
  }
];

// Company milestones
const companyMilestones = [
  {
    year: 2018,
    title: 'Founded',
    description: 'PMS was founded by Sarah Johnson and Michael Chen with a vision to simplify procurement for all businesses.'
  },
  {
    year: 2019,
    title: 'First Product Launch',
    description: 'Launched the first version of our procurement management platform, focusing on supplier management and purchase orders.'
  },
  {
    year: 2020,
    title: 'Seed Funding',
    description: 'Raised $2.5M in seed funding to expand our product capabilities and grow our team.'
  },
  {
    year: 2021,
    title: 'Platform Expansion',
    description: 'Added inventory management, invoice processing, and advanced analytics features to our platform.'
  },
  {
    year: 2022,
    title: 'Series A Funding',
    description: 'Secured $10M in Series A funding to accelerate growth and expand into new markets.'
  },
  {
    year: 2023,
    title: 'Global Expansion',
    description: 'Opened offices in London and Singapore to better serve our growing international customer base.'
  }
];

const AboutPage: React.FC = () => {
  const theme = useTheme();

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          pt: { xs: 8, md: 12 },
          pb: { xs: 10, md: 12 }
        }}
      >
        <Container maxWidth="lg">
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={4} 
            alignItems="center"
          >
            <Box sx={{ width: '100%', maxWidth: { md: '58.33%' } }}>
              <Typography 
                variant="h2" 
                fontWeight="bold"
                sx={{ mb: 2 }}
              >
                Our Mission
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ mb: 4, opacity: 0.9 }}
              >
                We're transforming how businesses manage procurement by providing powerful, yet simple-to-use software that makes procurement processes more efficient, transparent, and cost-effective.
              </Typography>
              <Button 
                component={RouterLink}
                to="/contact"
                variant="contained" 
                color="secondary" 
                size="large"
                sx={{ py: 1.5, px: 4 }}
              >
                Get in Touch
              </Button>
            </Box>
            <Box sx={{ width: '100%', maxWidth: { md: '41.67%' } }}>
              <Box 
                component="img"
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Team collaboration"
                sx={{
                  width: '100%',
                  borderRadius: 2,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                }}
              />
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Our Story Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={6} 
          alignItems="center"
        >
          <Box sx={{ width: '100%', maxWidth: { md: '50%' } }}>
            <Box 
              component="img"
              src="https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
              alt="Our story"
              sx={{
                width: '100%',
                borderRadius: 2,
                boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
              }}
            />
          </Box>
          <Box sx={{ width: '100%', maxWidth: { md: '50%' } }}>
            <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
              Our Story
            </Typography>
            <Typography variant="body1" paragraph>
              Founded in 2018, Procurement Management System (PMS) was born out of a simple observation: procurement was too complex and inaccessible for many businesses, particularly small and medium-sized enterprises.
            </Typography>
            <Typography variant="body1" paragraph>
              Our founders, Sarah Johnson and Michael Chen, experienced firsthand the challenges of managing procurement processes with spreadsheets and emails. They recognized the need for a modern, intuitive solution that could help businesses of all sizes streamline their procurement operations.
            </Typography>
            <Typography variant="body1" paragraph>
              What started as a simple tool for managing purchase orders has evolved into a comprehensive platform covering the entire procurement lifecycle – from supplier management to inventory tracking, purchase orders, invoice processing, and analytics.
            </Typography>
            <Typography variant="body1">
              Today, we serve thousands of businesses across various industries, helping them save time, reduce costs, and make better procurement decisions. Our commitment to simplicity, innovation, and customer success continues to drive everything we do.
            </Typography>
          </Box>
        </Stack>
      </Container>

      {/* Company Values Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 10 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" sx={{ mb: 6 }}>
            <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
              Our Values
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
              These core principles guide how we build our product, serve our customers, and work together as a team.
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -2 }}>
            {companyValues.map((value, index) => (
              <Box 
                key={index} 
                sx={{ 
                  width: { 
                    xs: '100%', 
                    sm: '50%', 
                    md: '33.33%' 
                  }, 
                  p: 2 
                }}
              >
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    borderRadius: 2,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    {value.icon}
                  </Box>
                  <Typography variant="h5" component="h3" fontWeight="bold" gutterBottom>
                    {value.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {value.description}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Team Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box textAlign="center" sx={{ mb: 6 }}>
          <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
            Meet Our Team
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
            Our diverse team brings together expertise in procurement, software development, design, and customer success.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -2 }}>
          {teamMembers.map((member, index) => (
            <Box 
              key={index} 
              sx={{ 
                width: { 
                  xs: '100%', 
                  sm: '50%', 
                  md: '33.33%' 
                }, 
                p: 2 
              }}
            >
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="240"
                  image={member.image}
                  alt={member.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h3" fontWeight="bold" gutterBottom>
                    {member.name}
                  </Typography>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    {member.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {member.bio}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Container>

      {/* Company Timeline */}
      <Box sx={{ bgcolor: 'grey.50', py: 10 }}>
        <Container maxWidth="md">
          <Box textAlign="center" sx={{ mb: 6 }}>
            <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
              Our Journey
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
              Key milestones in our company's growth and evolution
            </Typography>
          </Box>
          
          <Box sx={{ position: 'relative' }}>
            {/* Timeline line */}
            <Box 
              sx={{ 
                position: 'absolute', 
                left: { xs: 16, sm: 20 }, 
                top: 0, 
                bottom: 0, 
                width: 2, 
                bgcolor: 'primary.main',
                zIndex: 0
              }} 
            />
            
            {/* Timeline events */}
            {companyMilestones.map((milestone, index) => (
              <Box 
                key={index} 
                sx={{ 
                  position: 'relative',
                  pl: { xs: 5, sm: 6 },
                  pb: 4,
                  ml: { xs: 3, sm: 4 }
                }}
              >
                {/* Timeline dot */}
                <Box 
                  sx={{ 
                    position: 'absolute',
                    left: 0,
                    top: 8,
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 2,
                    borderColor: 'primary.main',
                    zIndex: 1,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold">{milestone.year}</Typography>
                </Box>
                
                {/* Content */}
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                  }}
                >
                  <Typography variant="h5" component="h3" fontWeight="bold" gutterBottom>
                    {milestone.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {milestone.description}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={4} 
          textAlign="center" 
          justifyContent="space-between"
        >
          <Box sx={{ width: '100%' }}>
            <Typography variant="h2" component="p" fontWeight="bold" color="primary">
              5,000+
            </Typography>
            <Typography variant="h6">Active Customers</Typography>
          </Box>
          <Box sx={{ width: '100%' }}>
            <Typography variant="h2" component="p" fontWeight="bold" color="primary">
              $1.2B+
            </Typography>
            <Typography variant="h6">Procurement Managed</Typography>
          </Box>
          <Box sx={{ width: '100%' }}>
            <Typography variant="h2" component="p" fontWeight="bold" color="primary">
              12
            </Typography>
            <Typography variant="h6">Countries</Typography>
          </Box>
        </Stack>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 10 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
            Join Our Team
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            We're always looking for talented individuals who are passionate about creating great software and helping businesses succeed.
          </Typography>
          <Button 
            component={RouterLink}
            to="/contact"
            variant="contained" 
            color="secondary" 
            size="large"
            sx={{ py: 1.5, px: 4 }}
          >
            View Open Positions
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default AboutPage; 