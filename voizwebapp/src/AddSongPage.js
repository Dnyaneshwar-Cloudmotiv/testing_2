import * as React from "react";
import { Button, Box, Typography, Paper, Grid, Card, CardContent } from "@mui/material";
import { useNavigate } from "react-router-dom";
import SideBar from "./SideBar";
import AudiotrackIcon from "@mui/icons-material/Audiotrack"; // Icon for single song
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic"; // Icon for multiple songs

export default function AddSongPage() {
  const navigate = useNavigate();

  const handleSingleSongUpload = () => {
    navigate("/single-song");
  };

  const handleMultipleSongsUpload = () => {
    navigate("/addmultiple");
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <SideBar />
      
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
   
      <Box sx={{ flexGrow: 1, p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ml: 9, mb: 4, color: 'white' }}>
          Upload Your Music
        </Typography>
        
        <Grid container spacing={4}>
          {/* Single Song Upload Section */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              backgroundColor: '#212121', // Dark background like Android UI
              borderRadius: '16px', // Rounded corners
            }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'left' }}>
                {/* Icon for Single Song */}
                <Box sx={{ mb: 2 }}>
                  <AudiotrackIcon sx={{ fontSize: 40, color: '#1E88E5' }} />
                </Box>
                <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 1, color: '#fff' }}>
                  Upload Single Song
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph sx={{ color: '#B0BEC5' }}>
                  Upload one song at a time
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSingleSongUpload}
                    sx={{
                      px: 4,
                      py: 1,
                      fontSize: '1rem',
                      borderRadius: '24px', // Rounded button
                      textTransform: 'none',
                      backgroundColor: '#1E88E5', // Blue like Android UI
                      '&:hover': {
                        backgroundColor: '#1976D2',
                      },
                    }}
                  >
                    Select
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Multiple Songs Upload Section */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              backgroundColor: '#212121', // Dark background like Android UI
              borderRadius: '16px', // Rounded corners
            }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'left' }}>
                {/* Icon for Multiple Songs */}
                <Box sx={{ mb: 2 }}>
                  <LibraryMusicIcon sx={{ fontSize: 40, color: '#AB47BC' }} />
                </Box>
                <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 1, color: '#fff' }}>
                  Upload Multiple Songs
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph sx={{ color: '#B0BEC5' }}>
                  Upload multiple songs together
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleMultipleSongsUpload}
                    sx={{
                      px: 4,
                      py: 1,
                      fontSize: '1rem',
                      borderRadius: '24px', // Rounded button
                      textTransform: 'none',
                      backgroundColor: '#AB47BC', // Purple like Android UI
                      '&:hover': {
                        backgroundColor: '#8E24AA',
                      },
                    }}
                  >
                    Select
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>

    </Box>
  );
}