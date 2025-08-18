import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { usePlayer } from "./PlayerContext";
import SideBar from "./SideBar";
import PlayIcon from "@mui/icons-material/PlayArrow";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { MoreVertical, Share, Info } from "lucide-react";
import { IoShareSocialOutline } from "react-icons/io5";
import { ImShuffle } from "react-icons/im";
import bannerImage1 from "./assets/RectangleBannerImage.png";
import menuIcon from "./assets/menu.png";

import "./SongList.css";

const formatDisplayText = (text) => {
  console.log("formatDisplayText input in Top10Songs:", text, typeof text); // Added for debugging
  if (!text) return "";
  if (typeof text !== "string") {
    console.log("Non-string input detected in Top10Songs:", text); // Added for debugging
    return String(text);
  }
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const INITIAL_BATCH_SIZE = 10;
const BATCH_SIZE = 20;

const Top10Songs = () => {
  const {
    playSong,
    playPlaylist,
    isShuffled,
    toggleShuffle,
    currentSongId,
    isPlaying,
    playSongWithData,
    saveToHistory,
  } = usePlayer();

  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const [shareableLink, setShareableLink] = useState("");
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [songMenuAnchor, setSongMenuAnchor] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [allSongs, setAllSongs] = useState([]);
  const [displayedSongs, setDisplayedSongs] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const songRefs = useRef({});
  const [pageInfo, setPageInfo] = useState({
    title: "Fresh Songs",
    subtitle: "Latest and trending songs",
    coverImage: bannerImage1,
    type: "fresh",
  });
  const [openShareDialog, setOpenShareDialog] = useState(false);
  const [openInfoDialog, setOpenInfoDialog] = useState(false);
  const [songInfo, setSongInfo] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem("user_id");

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "true"
  );

  const handleSongMenuOpen = useCallback((event, song) => {
    event.stopPropagation();
    setSongMenuAnchor(event.currentTarget);
    setSelectedSong(song);
  }, []);

  const handleSongMenuClose = useCallback((event) => {
    if (event) event.stopPropagation();
    setSongMenuAnchor(null);
    // Do not clear selectedSong here to ensure song name persists for the dialog
    // setSelectedSong(null); // Removed to fix song name display issue
  }, []);

  const handleShareClick = useCallback(async (event) => {
    event.stopPropagation();
    if (selectedSong?.id) {
      setIsDialogOpen(true);
      try {
        const songInfoResponse = await fetch(
          `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/song/info?song_id=${selectedSong.id}`
        );
        const songInfo = await songInfoResponse.json();
        const coverPageUrl = songInfo?.coverPageUrl?.S;
        const songTitle = songInfo?.songName?.S;

        const response = await fetch(
          "https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=AIzaSyDTf6FWaqhLd1sAsy-JmygkH7DkPzol7WY",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              dynamicLinkInfo: {
                domainUriPrefix: "voiznewapp.page.link",
                link: `${window.location.origin}/song/${selectedSong.id}`,
                androidInfo: {
                  androidPackageName: "com.voizapp.voiceapp",
                },
                socialMetaTagInfo: {
                  socialTitle: songTitle || "Listen on VOIZ",
                  socialDescription:
                    "Hey, see what I found! Listen to this amazing song 😍 on VOIZ! Just download the app, listen and enjoy!",
                  socialImageLink: coverPageUrl,
                },
                navigationInfo: {
                  enableForcedRedirect: true,
                },
              },
              suffix: {
                option: "SHORT",
              },
            }),
          }
        );

        const data = await response.json();
        if (data.shortLink) {
          setShareableLink(
            `Hey, see what I found! Listen to this amazing song 😍 on VOIZ! Just download the app, listen and enjoy! ${data.shortLink}`
          );
        } else {
          const fallbackUrl = `${window.location.origin}/song/${selectedSong.id}`;
          setShareableLink(
            `Hey, see what I found! Listen to this amazing song 😍 on VOIZ! Just download the app, listen and enjoy! ${fallbackUrl}`
          );
        }
      } catch (error) {
        console.error("Error generating share link:", error);
        const fallbackUrl = `${window.location.origin}/song/${selectedSong.id}`;
        setShareableLink(
          `Hey, see what I found! Listen to this amazing song 😍 on VOIZ! Just download the app, listen and enjoy! ${fallbackUrl}`
        );
      }
      setOpenShareDialog(true);
      handleSongMenuClose();
    }
  }, [selectedSong]);

  const handleCopyShare = async () => {
    if (!shareableLink) return;

    try {
      await navigator.clipboard.writeText(shareableLink);
      setShowCopyAlert(true);
      setOpenShareDialog(false);
      setIsDialogOpen(false);
      setSelectedSong(null); // Clear selectedSong when closing the share dialog

      if (selectedSong?.id) {
        await fetch(
          "https://i3lmfmc1h2.execute-api.ap-south-1.amazonaws.com/voizpost/save/shareSongCount",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ song_id: selectedSong.id }),
          }
        );
      }
    } catch (err) {
      console.error("Failed to copy link or increment count:", err);
    }
  };


    const DialogContent = () => {
      if (loading) {
        return (
          <Typography sx={{ color: "white", textAlign: "center" }}>
            Loading...
          </Typography>
        );
      }
  
      if (!songInfo) {
        return (
          <Typography sx={{ color: "white", textAlign: "center" }}></Typography>
        );
      }
  
      const credits = [
        { name: songInfo.singer, role: "Singer" },
        { name: songInfo.composer, role: "Composer" },
        { name: songInfo.lyricist, role: "Lyricist" },
        { name: songInfo.producer, role: "Producer" },
      ].filter((credit) => credit.name);
  
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, }}>
          <Typography
            sx={{
              color: "white",
              fontSize: "20px !important",
              fontWeight: "400 !important",
              mb: 1,
              marginTop: "20px !important",
            }}
          >
           
          </Typography>
          {credits.map((credit, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                sx={{
                  // backgroundColor: "#A5D7FF",
                  color: "#FFFF",
                  px: 2,
                  py: 0.5,
                  borderRadius: 20,
                  width: "100px !important",
                  fontSize: "16px !important",
                  fontWeight: "bold !important",
                  display: "flex !important",
                  alignItems: "center !important",
                }}
              >
                {credit.role}
              </Typography>
              {/* <Typography
                sx={{
                  color: "white",
                  fontSize: credit.name.length > 20 ? "14px !important" : "16px !important",
                  fontWeight: "600 !important",
                  marginLeft: "10px !important",
                  ...(credit.name.length > 20 && {
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "150px", // or whatever fits your layout
                  }),
                }}
              >
                {formatDisplayText(credit.name)}
              </Typography> */}
  
              <Typography
                sx={{
                  color: "white",
                  display: "flex",
                  fontSize: credit.name.length > 20 ? "14px !important" : "16px !important",
                  fontWeight: "600 !important",
                  marginLeft: credit.name.length > 20 ? "20px !important" : "10px !important",
                }}
              >
                {formatDisplayText(credit.name)}
              </Typography>
            </Box>
          ))}
        </Box>
      );
    };

  const handleSongInfo = async (event) => {
    event.stopPropagation();
    setIsDialogOpen(true);
    if (selectedSong?.song_id) { // Changed to song_id for consistency with SongList.js
      console.log("Selected Song:", selectedSong); // Debug log
      try {
        const response = await fetch(
          `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/song/info?song_id=${selectedSong.song_id}` // Updated to song_id
        );
        const data = await response.json();
        setSongInfo({
          singer: data.singer?.S || "Unknown",
          composer: data.composer?.S || "Unknown",
          lyricist: data.lyricist?.S || "Unknown",
          producer: data.producer?.S || "Unknown",
        });
      } catch (error) {
        console.error("Error fetching song info:", error);
      }
    } else {
      console.error("No selected song ID available"); // Added for debugging
    }
    setOpenInfoDialog(true);
    handleSongMenuClose(); // No need to pass event
  };

  const handleCloseInfo = () => {
    setIsDialogOpen(false);
    setOpenInfoDialog(false);
    setSongInfo(null);
    setSelectedSong(null); // Clear selectedSong when closing the info dialog
  };

  const loadMoreSongs = useCallback(() => {
    if (loadingMoreRef.current) return;

    loadingMoreRef.current = true;
    const currentLength = displayedSongs.length;
    const nextBatch = allSongs.slice(currentLength, currentLength + BATCH_SIZE);

    if (nextBatch.length > 0) {
      setDisplayedSongs((prev) => [...prev, ...nextBatch]);
      setSongs((prev) => [...prev, ...nextBatch]);
    }

    loadingMoreRef.current = false;
  }, [allSongs, displayedSongs]);

  const handleSongSelect = (song, index) => {
    playPlaylist(songs, index);
    playSongWithData(song);
    saveToHistory(song);
  };

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playPlaylist(songs, 0, false);
      saveToHistory(songs[0]);
    }
  };

  const handleShuffle = () => {
    if (songs.length > 0) {
      toggleShuffle();
      localStorage.setItem("shuffleState", (!isShuffled).toString());
    }
  };

  useEffect(() => {
    const fetchFreshSongs = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/songs/fresh?user_id=${userId}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const songsData = await response.json();
        console.log("API Response:", songsData);

        if (Array.isArray(songsData)) {
          const transformedSongs = songsData.map((song) => ({
            id: song.song_id,
            song_id: song.song_id,
            title: song.songName,
            songName: song.songName,
            artist: song.stage_name,
            stage_name: song.stage_name,
            albumArt: song.coverPageUrl,
            coverPageUrl: song.coverPageUrl,
            streamUrl: song.songStreamUrl,
            songStreamUrl: song.songStreamUrl,
            languages: song.languages,
            genre: song.genre,
            span: song.span || "--:--",
          }));

          setAllSongs(transformedSongs);
          setDisplayedSongs(transformedSongs.slice(0, INITIAL_BATCH_SIZE));
          setSongs(transformedSongs.slice(0, INITIAL_BATCH_SIZE));
          setPageInfo((prev) => ({
            ...prev,
            subtitle: `${transformedSongs.length} Song${
              transformedSongs.length !== 1 ? "s" : ""
            }`,
          }));
        } else {
          console.error("Invalid API response:", songsData);
          setError("Failed to fetch fresh songs. Please try again.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(
          "Error fetching fresh songs. Please check your internet connection and try again."
        );
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchFreshSongs();
    } else {
      setError("User ID not found. Please log in again.");
      setLoading(false);
    }
  }, [userId]);

  const [buttonClicked, setButtonClicked] = useState(false);

  const handlePlayAllClick = () => {
    if (songs.length === 0) return;
    setButtonClicked(true);
    setTimeout(() => setButtonClicked(false), 500);
    handlePlayAll();
  };

  if (loading) {
    return (
      <Box className="main-container">
        <SideBar />
        <Box className="content-container">
          <Typography className="loading-text">Loading...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="main-container">
        <SideBar />
        <Box className="content-container">
          <Typography className="error-text">{error}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="main-container">
      <SideBar
        collapsed={sidebarCollapsed}
        onCollapseChange={(collapsed) => {
          setSidebarCollapsed(collapsed);
          localStorage.setItem("sidebarCollapsed", String(collapsed));
        }}
      />
      <Box
        className="content-container"
        sx={{
          paddingBottom: "0px",
          height: "105vh",
          overflowY: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          className={`hero-section ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
        >
          <Box className="hero-image-container">
            <img
              src={pageInfo.coverImage}
              alt={formatDisplayText(pageInfo.title)}
              className="hero-image"
              onError={(e) => {
                e.target.src = bannerImage1;
              }}
              style={{ marginLeft: -3.8 }}
            />
            <Box className="hero-overlay" sx={{ marginLeft: -0.5 }} />
          </Box>
        </Box>

        <Box
          className="content-section"
          sx={{
            marginLeft: -12,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            height: "calc(100vh - 200px)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              marginLeft: 14,
              justifyContent: "space-between",
              marginBottom: "0px",
              position: "sticky",
              top: 0,
              zIndex: 1,
              padding: "18px 0",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                marginRight: "24px",
                flex: 1,
              }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontSize: "48px",
                  fontWeight: "bold",
                  color: "white",
                  maxWidth: "60%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginRight: "12px",
                }}
              >
                {formatDisplayText(pageInfo.title)}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2, marginRight: 65 }}>
              <IconButton
                onClick={handleShuffle}
                disabled={songs.length === 0}
                sx={{
                  width: "65px",
                  height: "65px",
                  backgroundColor: isShuffled ? "#2644D9" : "#464445",
                  "&:hover": { backgroundColor: isShuffled ? "#2644D9" : "#464445" },
                  "&.Mui-disabled": {
                    backgroundColor: "#464445 !important",
                  },
                }}
              >
                <ImShuffle
                  color="white"
                  style={{
                    height: "42.62px",
                    width: "41.27px",
                    opacity: songs.length === 0 ? 0.5 : 1,
                  }}
                />
              </IconButton>
              <IconButton
                onClick={handlePlayAllClick}
                disabled={songs.length === 0}
                sx={{
                  width: "65px",
                  height: "65px",
                  backgroundColor: buttonClicked ? "#2644D9" : "#464445",
                  "&:hover": { backgroundColor: buttonClicked ? "#2644D9" : "#464445" },
                  "&.Mui-disabled": {
                    backgroundColor: "#464445 !important",
                  },
                }}
              >
                <PlayIcon
                  sx={{
                    color: "white",
                    fontSize: 45,
                    height: "42.62px !important",
                    width: "41.27px !important",
                    opacity: songs.length === 0 ? 0.5 : 1,
                  }}
                />
              </IconButton>
            </Box>
          </Box>

          <Box
            className="songs-section"
            sx={{
              overflowY: "auto",
              flex: 1,
              paddingBottom: "115px",
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(255, 255, 255, 0.2)",
                borderRadius: "4px",
              },
            }}
          >
            {displayedSongs.length > 0 ? (
              <List
                sx={{
                  overflowY: "scroll",
                  "&::-webkit-scrollbar": {
                    width: "15px",
                    height: "30%",
                  },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: "transparent",
                    borderRadius: "2px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#e0e0e0",
                    borderRadius: "10px",
                    minHeight: "40%",
                    paddingX: "5px",
                    backgroundImage: `url(${menuIcon})`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: "14px",
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    backgroundColor: "#ccc",
                  },
                }}
              >
                {displayedSongs.map((song, index) => {
                  const isActive = currentSongId === (song.song_id || song.id);
                  return (
                    <ListItem
                      key={song.id}
                      ref={(el) => (songRefs.current[song.song_id || song.id] = el)}
                      onClick={() => handleSongSelect(song, index)}
                      className={`song-item ${isActive ? "active-song" : ""}`}
                    >
                      <Box className="song-content">
                        <div className="number-play-wrapper">
                          {isActive && isPlaying && (
                            <div className="playing-indicator" />
                          )}
                        </div>
                        <div className="title-cell">
                          <Avatar
                            src={song.coverPageUrl || song.albumArt}
                            alt={formatDisplayText(song.songName || song.title)}
                            className="song-avatar"
                            variant="rounded"
                            sx={{
                              borderRadius: isActive ? "11px !important" : "",
                            }}
                          />
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <span
                              className={`song-name ${isActive ? "active" : ""}`}
                            >
                              {formatDisplayText(song.songName || song.title) ||
                                "Untitled"}
                            </span>
                            <Typography
                              className="stage-name"
                              sx={{ color: isActive ? "white" : "#A5A5A5" }}
                            >
                              {formatDisplayText(song.stage_name || song.artist) ||
                                "Unknown Artist"}
                            </Typography>
                          </Box>
                        </div>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            ml: "auto",
                          }}
                        >
                          <div
                            className={`song-duration ${isActive ? "active" : ""}`}
                          >
                            {song.span || "--:--"}
                          </div>
                          <IconButton
                            onClick={(e) => handleSongMenuOpen(e, song)}
                            sx={{
                              color: "white",
                              padding: "4px",
                              "&:hover": {
                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                              },
                              position: "absolute",
                              right: 30,
                              "& svg": { width: 20, height: 20 },
                            }}
                          >
                            <MoreVertical size={16} />
                          </IconButton>
                        </Box>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Typography className="empty-state">
                No songs available
              </Typography>
            )}
            {displayedSongs.length < allSongs.length && !isLoadingMore && (
              <Box
                className="load-more"
                onClick={loadMoreSongs}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  py: 2,
                  cursor: "pointer",
                  color: "primary.main",
                  "&:hover": {
                    color: "primary.dark",
                  },
                }}
              >
                Load More
              </Box>
            )}
          </Box>

          <Menu
            anchorEl={songMenuAnchor}
            open={Boolean(songMenuAnchor)}
            onClose={handleSongMenuClose}
            sx={{
              "& .MuiPaper-root": {
                backgroundColor: "#151415 !important",
                color: "white",
                marginLeft: 5,
                borderRadius: "15px",
                marginTop: "-40px",
                marginLeft: "-130px",
              },
            }}
          >
            <MenuItem onClick={handleSongInfo} sx={{ gap: 2 }}>
              <Info size={16} />
              Song Info
            </MenuItem>
            <MenuItem onClick={handleShareClick} sx={{ gap: 2 }}>
              <IoShareSocialOutline size={16} />
              Share
            </MenuItem>
          </Menu>

          <Dialog
            open={openShareDialog}
            onClose={() => {
              setOpenShareDialog(false);
              setIsDialogOpen(false);
              setSelectedSong(null); // Clear selectedSong when closing the share dialog
            }}
            sx={{
              "& .MuiDialog-paper": {
                width: "300px !important",
                minHeight: "150px !important",
                borderRadius: "16px",
                backgroundColor: "#151415 !important",
                color: "white",
                padding: "16px",
                boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.5)",
              },
            }}
          >
            <DialogTitle
              sx={{
                color: "white",
                textAlign: "center",
                fontSize: "18px",
                fontWeight: "500",
              }}
            >
              Share Song
            </DialogTitle>
            <TextField
              fullWidth
              value={shareableLink}
              InputProps={{
                readOnly: true,
              }}
              sx={{
                backgroundColor: "white !important",
                borderRadius: "4px",
                width: "240px !important",
                height: "50.5px !important",
                marginLeft: "10px !important",
                "& .MuiOutlinedInput-root": {
                  color: "black",
                  "& fieldset": {
                    borderColor: "rgba(0, 0, 0, 0.23)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(0, 0, 0, 0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#2782EE",
                  },
                },
                "& .MuiInputBase-input": {
                  color: "black",
                },
              }}
            />
            <DialogActions sx={{ justifyContent: "center", gap: "16px" }}>
              <Button
                onClick={() => {
                  setOpenShareDialog(false);
                  setIsDialogOpen(false);
                }}
                sx={{
                  color: "white",
                  textTransform: "none",
                  fontSize: "16px",
                  "&:hover": {
                    backgroundColor: "rgba(39, 130, 238, 0.08)",
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCopyShare}
                sx={{
                  color: "white",
                  textTransform: "none",
                  fontSize: "16px",
                  "&:hover": {
                    backgroundColor: "rgba(39, 130, 238, 0.08)",
                  },
                }}
              >
                Copy Link
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={openInfoDialog}
            onClose={handleCloseInfo}
            sx={{
              "& .MuiDialog-paper": {
                width: "350px !important",
                minHeight: "200px",
                borderRadius: "16px",
                backgroundColor: "#151415 !important",
                color: "white",
                boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.5)",
              },
            }}
          >
            <DialogTitle
              sx={{
                color: "white",
                textAlign: "center",
                fontSize: "24px",
                fontWeight: "600",
                py: 2,
              }}
            >
              {formatDisplayText(selectedSong?.songName || "")}
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              {!songInfo ? (
                <Typography sx={{ color: "white", textAlign: "center" }}>
                  Loading...
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  <h2></h2>
                  {[
                    { name: songInfo.singer, role: "Singer" },
                    { name: songInfo.composer, role: "Composer" },
                    { name: songInfo.lyricist, role: "Lyricist" },
                    { name: songInfo.producer, role: "Producer" },
                  ]
                    .filter((credit) => credit.name && credit.name !== "Unknown")
                    .map((credit, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          sx={{
                            color: "white",
                            fontSize: "16px",
                            fontWeight: "500",
                          }}
                        >
                          {formatDisplayText(credit.name)}
                        </Typography>
                        <Box
                          sx={{
                            backgroundColor: "#A5D7FF !important",
                            color: "white",
                            borderRadius: 20,
                            width: "100px !important",
                            height: "36px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "16px",
                          }}
                        >
                          {credit.role}
                        </Box>
                      </Box>
                    ))}
                </Box>
              )}
            </DialogContent>
          </Dialog>

          <Snackbar
            open={showCopyAlert}
            autoHideDuration={3000}
            onClose={() => setShowCopyAlert(false)}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            sx={{ zIndex: "9999 !important" }}
          >
            <Alert
              onClose={() => setShowCopyAlert(false)}
              severity="success"
              sx={{ width: "100%" }}
            >
              Link copied to clipboard!
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </Box>
  );
};

export default Top10Songs;