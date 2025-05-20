import React, { ReactNode } from 'react';
import { Box, Typography, Button, SxProps, Theme } from '@mui/material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  actionIcon?: ReactNode;
  onActionClick?: () => void;
  icon?: ReactNode;
  actions?: ReactNode;
  sx?: SxProps<Theme>;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actionText,
  actionIcon,
  onActionClick,
  icon,
  actions,
  sx
}) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        ...sx
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {icon && (
          <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
            {icon}
          </Box>
        )}
        <Box>
          <Typography variant="h4" component="h1">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="subtitle1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      
      {actions ? (
        actions
      ) : actionText && onActionClick ? (
        <Button
          variant="contained"
          startIcon={actionIcon}
          onClick={onActionClick}
        >
          {actionText}
        </Button>
      ) : null}
    </Box>
  );
};

export default PageHeader; 