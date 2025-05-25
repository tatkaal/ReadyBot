import React from 'react';
import { Box, Typography, Card, CardContent, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const RecentActivityCard = ({ title, description, date, icon, onClick }) => {
  return (
    <Card 
      elevation={1} 
      sx={{ 
        borderRadius: 2,
        mb: 2,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': onClick ? {
          transform: 'translateX(5px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            sx={{ 
              bgcolor: 'primary.light', 
              opacity: 0.1,
              borderRadius: '50%', 
              width: 40, 
              height: 40, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'primary.main',
              mr: 2
            }}
          >
            {icon}
          </Box>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" component="div" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            
            {description && (
              <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '80%' }}>
                {description}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              {date}
            </Typography>
            
            {onClick && (
              <ArrowForwardIcon fontSize="small" color="action" />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RecentActivityCard;
