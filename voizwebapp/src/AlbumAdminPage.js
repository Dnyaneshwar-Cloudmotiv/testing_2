import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
  Tab,
  Tabs,
  Menu,
  MenuItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import coverpage from "./assets/mic.jpg";

// Helper function to format timestamp
const formatTimestamp = (timestamp) => {
  try {
    // Handle custom timestamp format: "20250618_100420"
    if (timestamp && timestamp.includes('_')) {
      const [datePart, timePart] = timestamp.split('_');
      const year = datePart.substring(0, 4);
      const month = datePart.substring(4, 6);
      const day = datePart.substring(6, 8);
      const hour = timePart.substring(0, 2);
      const minute = timePart.substring(2, 4);
      const second = timePart.length >= 6 ? timePart.substring(4, 6) : '00';
      
      const dateObj = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
      return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return new Date(timestamp).toLocaleString();
    }
  } catch (e) {
    console.error("Error formatting timestamp:", e);
    return timestamp || "";
  }
};

function AlbumAdminPage() {
  const { album_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const decision = location.state?.decision || "Pending"; // Default to Pending if no decision is provided
  
  const [album, setAlbum] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [songMenuAnchor, setSongMenuAnchor] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [totalSongCount, setTotalSongCount] = useState(0);
  
  // Fetch total song count for the album
  const fetchTotalSongCount = async (albumId) => {
    try {
      const response = await fetch(
        `https://6htqk6p035.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/album/songCount?album_id=${albumId}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch total song count: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Total Song Count Response:", data);
      
      setTotalSongCount(data.songCount);
    } catch (err) {
      console.error("Error fetching total song count:", err);
    }
  };
  
  // Fetch album details and songs
  useEffect(() => {
    const fetchAlbumDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch songs by album ID and decision status
        const response = await fetch(
          `https://6htqk6p035.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/getSongsByAlbumAndDecision?decision=${decision}&album_id=${album_id}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch album details: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("API Response:", data);
        
        // Fetch total song count for the album
        await fetchTotalSongCount(album_id);
        
        // Check if data has songDetails array
        const songDetails = data.songDetails || [];
        console.log("Song details:", songDetails);
        
        if (songDetails && songDetails.length > 0) {
          // Extract album details from the first song
          const firstSong = songDetails[0];
          const albumInfo = {
            album_id: firstSong.album_id,
            albumName: firstSong.albumName || "Unknown Album",
            coverPageUrl: firstSong.albumCoverUrl,
            stage_name: firstSong.stage_name || firstSong.FullName,
            createdTimestamp: firstSong.createdTimestamp,
            story: firstSong.story || ""
          };
          
          setAlbum(albumInfo);
          
          // Process songs
          const processedSongs = songDetails.map(song => {
            // Add cache-busting parameter to cover image URL
            const coverUrl = song.coverPageUrl ? `${song.coverPageUrl}?t=${new Date().getTime()}` : null;
            
            // Format timestamp for display using the helper function
            const formattedTimestamp = formatTimestamp(song.createdTimestamp);
            
            return {
              ...song,
              coverPageUrl: coverUrl,
              formattedTimestamp: formattedTimestamp
            };
          });
          
          console.log("Processed songs:", processedSongs);
          setSongs(processedSongs);
        } else {
          setSongs([]);
        }
      } catch (err) {
        console.error("Error fetching album details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (album_id) {
      fetchAlbumDetails();
    }
  }, [album_id]);
  
  const handleSongClick = (song) => {
    navigate(`/songdetail/${song.song_id}`, {
      state: {
        workflowId: song.workflowId,
        decision: song.decision,
      },
    });
  };
  
  const handleSongMenuOpen = (event, song) => {
    event.stopPropagation();
    setSelectedSong(song);
    setSongMenuAnchor(event.currentTarget);
  };
  
  const handleSongMenuClose = () => {
    setSongMenuAnchor(null);
  };
  
  const handleBackClick = () => {
    navigate(-1);
  };
  
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#100F32",
        }}
      >
        <CircularProgress sx={{ color: "white" }} />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#100F32",
          color: "white",
        }}
      >
        <Typography variant="h6" sx={{ marginBottom: "20px" }}>
          Error: {error}
        </Typography>
        <Button
          variant="contained"
          onClick={handleBackClick}
          sx={{
            backgroundColor: "#2782EE",
            "&:hover": { backgroundColor: "#1c6ac6" },
          }}
        >
          Go Back
        </Button>
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        backgroundColor: "#100F32",
        minHeight: "100vh",
        color: "white",
        padding: "20px",
      }}
    >
      {/* Header with back button */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <IconButton
          onClick={handleBackClick}
          sx={{ color: "white", marginRight: "10px" }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">Album Details</Typography>
      </Box>
      
      {album && (
        <Box sx={{ marginBottom: "30px" }}>
          <Box sx={{ display: "flex", marginBottom: "20px" }}>
            <img
              src={album.albumCoverUrl || coverpage}
              alt={album.albumName}
              style={{
                width: "200px",
                height: "200px",
                borderRadius: "8px",
                objectFit: "cover",
              }}
              onError={(e) => {
                e.target.src = coverpage; // fallback if URL is broken
              }}
            />
            <Box sx={{ marginLeft: "20px", flex: 1 }}>
              <Typography variant="h6" sx={{ marginBottom: "5px" }}>
                {album.albumName}
              </Typography>
              <Typography variant="body1" sx={{ color: "#A5A5A5" }}>
                {album.stage_name}
              </Typography>
              <Typography variant="body2" sx={{ color: "#A5A5A5" }}>
                {songs.length} out of {totalSongCount} songs
              </Typography>
              {album.createdTimestamp && (
                <Typography variant="body2" sx={{ color: "#A5A5A5" }}>
                  Uploaded: {formatTimestamp(album.createdTimestamp)}
                </Typography>
              )}
            </Box>
          </Box>
          
          {/* {album.story && (
            <Box sx={{ marginBottom: "20px" }}>
              <Typography variant="h6" sx={{ marginBottom: "10px",display:"hidden" }}>
                Album Story
              </Typography>
              <Typography variant="body1">{album.story}</Typography>
            </Box>
          )} */}
        </Box>
      )}
      
      {/* Songs list */}
      <Typography variant="h6" sx={{ marginBottom: "15px" }}>
        Songs in this Album
      </Typography>
      
      {songs.length > 0 ? (
        <Box className="SongGrid">
          {songs.map((song, index) => (
            <Box
              key={index}
              className="song-item"
              sx={{ position: "relative" }}
              onClick={() => handleSongClick(song)}
            >
              <img
                src={song.coverPageUrl || coverpage}
                alt={song.songName}
                className="songcover"
                onError={(e) => {
                  e.target.src = coverpage; // fallback if URL is broken
                }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1" sx={{ fontSize: "22px" }}>
                  {song.songName}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    marginTop: "5px",
                    fontSize: "20px",
                    color: "#A5A5A5",
                  }}
                >
                  {song.stage_name || song.FullName}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    marginTop: "5px",
                    fontSize: "20px",
                    color: "#A5A5A5",
                  }}
                >
                  {song.languages}
                </Typography>

              </Box>
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    marginLeft: "15px",
                    alignSelf: "flex-start",
                    marginTop: "3px",
                  }}
                >
                  {song.span}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    marginLeft: "15px",
                    alignSelf: "flex-start",
                    marginTop: "3px",
                  }}
                >
                  {song.formattedTimestamp}
                </Typography>
              </Box>
              <IconButton
                onClick={(e) => handleSongMenuOpen(e, song)}
                sx={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  color: "white",
                  zIndex: 10,
                  marginRight: "-35px",
                }}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography variant="body1" sx={{ textAlign: "center", marginTop: "20px" }}>
          No songs found in this album
        </Typography>
      )}
      
      {/* Song menu */}
      <Menu
        anchorEl={songMenuAnchor}
        open={Boolean(songMenuAnchor)}
        onClose={handleSongMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: "#1E1D45",
            color: "white",
            minWidth: "150px",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            handleSongClick(selectedSong);
            handleSongMenuClose();
          }}
        >
          View Details
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default AlbumAdminPage;