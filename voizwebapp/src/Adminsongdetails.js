import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
} from "@mui/material";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Logout from "@mui/icons-material/Logout";
import Hls from "hls.js";
import "./Adminsongdetails.css";
import logo from "./assets/bg-logo.png";
import { signOut } from "aws-amplify/auth";

const Adminsongdetails = () => {
  const { song_id } = useParams();
  const [songDetails, setSongDetails] = useState(null);
  const [songUrl, setSongUrl] = useState(""); // State to store song URL
  const { state } = useLocation();
  const [coverPageUrl, setCoverPageUrl] = useState("");
  const { workflowId, decision } = state || {};
  const audioRef = useRef(null); // Ref to the audio element
  const navigate = useNavigate();
  const [lyricsUrl, setLyricsUrl] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const hlsRef = useRef(null); // Ref to store Hls instance
  console.log(songDetails);

  console.log(songUrl);

  async function handleSignOut() {
    try {
      await signOut();
      localStorage.removeItem("StageName");
      localStorage.removeItem("EmailId");
      localStorage.removeItem("FullName");
      localStorage.removeItem("Category");
      localStorage.removeItem("user_id");
      localStorage.removeItem("ActiveSubMenu");
      navigate("/landingpage");
    } catch (error) {
      console.log("error signing out: ", error);
    }
  }

  // Handle navigation back to the previous page
  const handleBack = () => {
    navigate(-1);
  };

  // Handle opening the menu
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle closing the menu
  const handleClose = () => {
    navigate("/homepage");
    setAnchorEl(null);
  };

  // Fetch song details on component mount
  useEffect(() => {
    fetch(
      `https://6htqk6p035.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/song/detail?song_id=${song_id}`
    )
      .then((response) => response.json())
      .then((data) => {
        setSongDetails(data);
        if (data.coverPageUrl?.S) {
          // Using optional chaining for safety
          setCoverPageUrl(`${data.coverPageUrl.S}?t=${new Date().getTime()}`);
        }
        if (data.lyricsUrl?.S) {
          setLyricsUrl(data.lyricsUrl.S);
        }
      })
      .catch((error) => {
        console.error("Error fetching song details:", error);
        alert("Failed to fetch song details.");
      });
  }, [song_id]);

  // Initialize Hls.js when songUrl changes
  useEffect(() => {
    if (songUrl && audioRef.current) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(songUrl);
        hls.attachMedia(audioRef.current);
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error("HLS error:", data);
        });
      } else if (
        audioRef.current.canPlayType("application/vnd.apple.mpegurl")
      ) {
        // Fallback for Safari
        audioRef.current.src = songUrl;
      }
    }

    // Cleanup previous Hls instance if songUrl changes
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [songUrl]);

  if (!songDetails) {
    return <p>Loading song details...</p>;
  }

  const handleSongClick = () => {
    const navigateState = {
      songName: songDetails.songName.S,
      EmailId: songDetails.user_EmailId.S,
      FullName: songDetails.user_FullName.S,
      StageName: songDetails.stage_name?.S || "N/A",
      span: songDetails.span.S,
      workflowId: workflowId,
      decision: decision,
      song_id: songDetails.song_id.S,
      user_id: songDetails.user_id.S,
    };

    // Conditionally add firebaseToken if it's present
    if (songDetails.user_firebaseToken && songDetails.user_firebaseToken.S) {
      navigateState.firebaseToken = songDetails.user_firebaseToken.S;
    }

    navigate(`/approvepage`, {
      state: navigateState,
    });
  };

  // Function to fetch song URL when "Listen Song" button is clicked
  const handleListenSongClick = () => {
    if (songDetails.songStreamUrl?.S) {
      setSongUrl(songDetails.songStreamUrl.S);
    } else {
      console.error("Song URL not available");
      alert("Song URL not available.");
    }
  };

  // Function to handle "Lyrics" button click
  const handleLyricsClick = () => {
    if (lyricsUrl) {
      const fileExtension = lyricsUrl.split(".").pop().toLowerCase();
      let viewerUrl;

      if (["pdf", "doc", "docx", "txt"].includes(fileExtension)) {
        viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
          lyricsUrl
        )}&embedded=true`;
      } else {
        console.error("Unsupported file type");
        alert("Unsupported file type for lyrics.");
        return;
      }

      window.open(viewerUrl, "_blank");
    } else {
      console.error("Lyrics URL not available");
      alert("Lyrics URL not available.");
    }
  };

  // Error handler for the audio player
  const handlePlayerError = (error) => {
    console.error("Error playing the song:", error);
    alert("There was an issue playing the song.");
  };

  return (
    <Box
      className="song-detail-container"
      sx={{ width: "100%", typography: "body1", padding: 4 }}
    >
      {/* Header with logo */}
      <Box className="admin-header">
        <img src={logo} alt="Logo" className="admin-logo" />
        <Box className="avatar" sx={{ marginLeft: "auto" }}>
          <Avatar
            sx={{ width: 66, height: 66 }}
            aria-controls={open ? "basic-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={handleClick}
          >
            A
          </Avatar>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              "aria-labelledby": "basic-button",
            }}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: "visible",
                filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                mt: 1.5,
                "& .MuiAvatar-root": {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                "&::before": {
                  content: '""',
                  display: "block",
                  position: "absolute",
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: "background.paper",
                  transform: "translateY(-50%) rotate(45deg)",
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            sx={{ transform: "translateX(-10px)" }}
          >
            <MenuItem
              onClick={handleClose}
              sx={{ fontSize: "18px", margin: "15px" }}
            >
              <Avatar /> HomePage
            </MenuItem>
            <MenuItem
              onClick={handleSignOut}
              sx={{ fontSize: "18px", margin: "15px" }}
            >
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Container for song details and buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          padding: "8px",
        }}
      >
        {/* Back Button */}
        <Box sx={{ padding: "5px" }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ backgroundColor: "2644d9 !important" }}
          >
            Back
          </Button>
        </Box>

        {/* Song Details Section */}
        <Box className="song-details-section">
          {/* Song Header with Cover Image and Info */}
          <Box className="song-header">
            {coverPageUrl ? (
              <img
                src={coverPageUrl}
                alt={songDetails.songName.S}
                className="song-cover"
              />
            ) : (
              <Avatar
                alt={songDetails.songName.S}
                variant="square"
                sx={{ width: 120, height: 130 }}
                className="song-cover"
              ></Avatar>
            )}
            <Box className="song-info">
              <Typography variant="h4" component="h1">
                {songDetails.songName.S}
              </Typography>
              <Typography variant="subtitle1" className="fontsize">
                {songDetails.user_FullName.S}
              </Typography>
              <Typography variant="subtitle2" className="fontsize">
                {songDetails.span.S}
              </Typography>
              <Typography variant="subtitle2" className="fontsize">
                {songDetails.user_EmailId.S}
              </Typography>
            </Box>
          </Box>

          {/* Song Metadata */}
          <Box className="song-metadata">
            {/* Metadata Columns */}
            <Box className="metadata-column">
              <Box className="metadata-row">
                <Typography
                  variant="body1"
                  sx={{ fontSize: "20px", fontWeight: "Bold" }}
                >
                  Name
                </Typography>
                <Typography variant="body2" className="underlined-value">
                  {songDetails.FullName.S}
                </Typography>
              </Box>
              <Box className="metadata-row">
                <Typography
                  variant="body1"
                  sx={{ fontSize: "20px", fontWeight: "Bold" }}
                >
                  Song Name
                </Typography>
                <Typography variant="body2" className="underlined-value">
                  {songDetails.songName.S}
                </Typography>
              </Box>
              <Box className="metadata-row">
                <Typography
                  variant="body1"
                  sx={{ fontSize: "20px", fontWeight: "Bold" }}
                >
                  Stage Name
                </Typography>
                <Typography variant="body2" className="underlined-value">
                  {songDetails.stage_name.S}
                </Typography>
              </Box>
              <Box className="metadata-row">
                <Typography
                  variant="body1"
                  sx={{ fontSize: "20px", fontWeight: "Bold" }}
                >
                  Language
                </Typography>
                <Typography variant="body2" className="underlined-value">
                  {songDetails.languages.S}
                </Typography>
              </Box>
            </Box>

            <Box className="metadata-column">
              <Box className="metadata-row">
                <Typography
                  variant="body1"
                  sx={{ fontSize: "20px", fontWeight: "Bold" }}
                >
                  Genre
                </Typography>
                <Typography variant="body2" className="underlined-value">
                  {songDetails.genre.S}
                </Typography>
              </Box>
              <Box className="metadata-row">
                <Typography
                  variant="body1"
                  sx={{ fontSize: "20px", fontWeight: "Bold" }}
                >
                  Mood and Pace
                </Typography>
                <Typography variant="body2" className="underlined-value">
                  {songDetails.mood.S}
                </Typography>
              </Box>
              <Box className="metadata-row">
                <Typography
                  variant="body1"
                  sx={{ fontSize: "20px", fontWeight: "Bold" }}
                >
                  Story Behind the Song
                </Typography>
                <Typography variant="body2" className="underlined-value">
                  {songDetails.story.S}
                </Typography>
              </Box>
              <Box className="metadata-row">
                <Button
                  variant="contained"
                  className="SongLyrics"
                  sx={{ backgroundColor: "#4285f4", textTransform: "none" }}
                  onClick={handleListenSongClick}
                >
                  Listen Song
                </Button>
              </Box>
            </Box>

            <Box className="metadata-column">
              <Typography
                variant="h5"
                sx={{ fontWeight: "Bold", marginBottom: "3px" }}
              >
                Credits:
              </Typography>
              <Box className="metadata-row">
                <Typography
                  variant="body1"
                  sx={{ fontSize: "20px", fontWeight: "Bold" }}
                >
                  Singer
                </Typography>
                <Typography variant="body2" className="underlined-value">
                  {songDetails.singer.S}
                </Typography>
              </Box>
              <Box className="metadata-row">
                <Typography
                  variant="body1"
                  sx={{ fontSize: "20px", fontWeight: "Bold" }}
                >
                  Composer
                </Typography>
                <Typography variant="body2" className="underlined-value">
                  {songDetails.composer.S}
                </Typography>
              </Box>
              <Box className="metadata-row">
                <Typography
                  variant="body1"
                  sx={{ fontSize: "20px", fontWeight: "Bold" }}
                >
                  Lyricist
                </Typography>
                <Typography variant="body2" className="underlined-value">
                  {songDetails.lyricist.S}
                </Typography>
              </Box>
              <Box className="metadata-row">
                <Typography
                  variant="body1"
                  sx={{ fontSize: "20px", fontWeight: "Bold" }}
                >
                  Producer
                </Typography>
                <Typography variant="body2" className="underlined-value">
                  {songDetails.producer.S}
                </Typography>
              </Box>

              <Box className="metadata-row">
                <Button
                  variant="contained"
                  className="SongLyrics"
                  sx={{ backgroundColor: "#4285f4", textTransform: "none" }}
                  onClick={handleLyricsClick}
                >
                  Check Lyrics
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Next button beside the card */}
        <Box sx={{ display: "flex", marginRight: "75px" }}>
          <Button
            variant="contained"
            onClick={handleSongClick}
            className="next-button"
            endIcon={<ArrowForwardIosRoundedIcon />}
          ></Button>
        </Box>
      </Box>

      {/* Audio Player for Streaming */}
      {songUrl && (
        <Box
          sx={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <audio
            ref={audioRef}
            controls
            style={{ width: "100%", maxWidth: "600px" }}
            onError={handlePlayerError}
          ></audio>
        </Box>
      )}
    </Box>
  );
};

export default Adminsongdetails;
