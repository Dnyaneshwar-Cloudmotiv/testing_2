import React from 'react';
import { Menu, Typography, List, ListItem, ListItemText } from '@mui/material';

const QueueMenu = ({
  anchorEl,
  onClose,
  isOpen,
  playlist,
  currentIndex,
  onSongSelect
}) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={isOpen}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          backgroundColor: '#1a1b1f',
          mt: '-28px',
          color: 'white',
          borderRadius: '12px',
          maxHeight: '400px',
          minWidth: '300px',
          '& .MuiList-root': {
            padding: '8px 0',
          },
          '& .MuiListItem-root': {
            padding: '1px 16px',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&.current-song': {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
            },
          },
        },
      }}
    >
      <Typography sx={{ padding: '12px 16px', fontWeight: 'bold' }}>
        Current Queue
      </Typography>
      <List sx={{ padding: 0 }}>
        {playlist.map((song, index) => (
          <ListItem
            key={index}
            onClick={() => onSongSelect(index)}
            className={index === currentIndex ? 'current-song' : ''}
            sx={{ cursor: 'pointer' }}
          >
            <ListItemText
              primary={song.songName}
              secondary={song.stage_name}
              primaryTypographyProps={{
                style: {
                  color: index === currentIndex ? '#1db954' : 'white',
                },
              }}
              secondaryTypographyProps={{
                style: {
                  color: index === currentIndex ? '#1db954' : 'rgba(255, 255, 255, 0.7)',
                },
              }}
            />
          </ListItem>
        ))}
      </List>
    </Menu>
  );
};

export default QueueMenu;