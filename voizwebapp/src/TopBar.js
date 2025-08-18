import React, { useState } from 'react';
import { Box, Typography, Avatar, IconButton, Menu, MenuItem } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import profile from './assets/AccountSettings.png';
import feedback from './assets/feedback.png';
import { useNavigate } from 'react-router-dom';

const TopBar = () => {
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get user details from localStorage
  const fullName = localStorage.getItem('FullName') || 'User';
  const stageName = localStorage.getItem('StageName') || '';
  const profilePhotoUrl = localStorage.getItem('ProfilePhotoUrl');

  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleSettingsClick = () => {
    navigate('/profile');
    setMenuAnchor(null);
  };

  const handleFeedbackClick = () => {
    navigate('/feedback');
    setMenuAnchor(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/loginpage');
    setMenuAnchor(null);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: isCollapsed ? '48px' : '260px',
        height: '51px',
        backgroundColor: 'rgba(4, 31, 70, 0.85)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 1001,
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        backdropFilter: 'blur(10px)',
        transition: 'width 0.3s ease-in-out',
        '&:hover': {
          '& .collapse-arrow': {
            opacity: 1,
          },
        },
      }}
    >
      {/* Collapse Toggle Button */}
      <IconButton
        className="collapse-arrow"
        onClick={toggleCollapse}
        sx={{
          position: 'absolute',
          left: 0,
          color: 'white',
          padding: '2px',
          opacity: 0,
          transition: 'opacity 0.2s',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        {isCollapsed ? <KeyboardArrowLeftIcon /> : <KeyboardArrowRightIcon />}
      </IconButton>

      {/* User Info - Only shown when not collapsed */}
      {!isCollapsed && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, ml: 4 }}>
          <Avatar
            src={profilePhotoUrl}
            sx={{
              width: 32,
              height: 32,
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          />
          <Box>
            <Typography
              sx={{
                color: 'white',
                fontWeight: '600',
                fontSize: '0.8rem',
                lineHeight: '1.0'
              }}
            >
              {fullName}
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.7rem',
                lineHeight: '1.0'
              }}
            >
              {stageName}
            </Typography>
          </Box>
          <IconButton
            sx={{
              color: 'white',
              padding: '1px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
            onClick={handleMenuOpen}
          >
            <KeyboardArrowDownIcon sx={{ fontSize: '1.2rem' }} />
          </IconButton>
        </Box>
      )}

      {/* Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(26, 27, 31, 0.95)',
            color: 'white',
            '& .MuiMenuItem-root': {
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }
          }
        }}
      >
        <MenuItem onClick={handleSettingsClick} sx={{ padding: 1.5, fontSize: '12px' }}>
          <img src={profile} alt="Profile" style={{ width: '24px', height: '24px', marginRight: '18px' }} />
          Account Settings
        </MenuItem>
        <MenuItem onClick={handleFeedbackClick} sx={{ padding: 1.5, fontSize: '12px' }}>
          <img src={feedback} alt="Feedback" style={{ width: '28px', height: '28px', marginRight: '18px' }} />
          Feedback
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ padding: 1.5, fontSize: '12px', color: '#ff4d4f' }}>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TopBar;