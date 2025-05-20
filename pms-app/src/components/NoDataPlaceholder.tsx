import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { SxProps } from '@mui/system';

interface NoDataPlaceholderProps {
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  sx?: SxProps;
}

/**
 * A placeholder component to display when no data is available
 */
const NoDataPlaceholder: React.FC<NoDataPlaceholderProps> = ({
  title = 'No Data Available',
  message = 'There are no items to display at the moment.',
  actionText,
  onAction,
  icon,
  sx
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 4,
        margin: 'auto',
        minHeight: '200px',
        ...sx
      }}
    >
      {icon && (
        <Box sx={{ mb: 2, color: 'text.secondary', fontSize: '3rem' }}>
          {icon}
        </Box>
      )}
      
      <Typography variant="h6" component="h3" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {message}
      </Typography>
      
      {actionText && onAction && (
        <Button 
          variant="contained" 
          color="primary"
          onClick={onAction}
        >
          {actionText}
        </Button>
      )}
    </Box>
  );
};

export default NoDataPlaceholder; 