import React, { useRef, useState, useEffect } from "react";
import ReactPlayer from "react-player";
import {
  Box,
  Typography,
  Slider,
  IconButton,
  Snackbar,
  Alert,
  Tooltip
} from "@mui/material";
import { FaPlay, FaPause } from "react-icons/fa";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import RepeatIcon from "@mui/icons-material/Repeat";
import RepeatOneIcon from "@mui/icons-material/RepeatOne";
import reaction_empty from "./assets/reaction_empty.png";
import reaction_filled1 from "./assets/reaction_filled1.png";
import like from "./assets/like.png";
import loop from "./assets/loop.png";
import loved_tracks from "./assets/loved_tracks1.png";
import addPlaylist from "./assets/add-playlist1.png";
import more from "./assets/more.png";
import { usePlayer } from "./PlayerContext";
import { useComments } from "./CommentsContext";
import PlaylistMenu from "./PlaylistMenu";
import QueueMenu from "./QueueMenu";
import MoreOptionsMenu from "./MoreOptionsMenu";
import "./MiniPlayer.css";
import { useNavigate } from "react-router-dom";
import Shuffle1 from "./assets/Shuffle1.png";

const MiniPlayer = () => {
  const {
    currentSong,
    currentCover,
    currentTitle,
    currentArtist,
    isPlaying,
    setIsPlaying,
    playNext,
    playPrevious,
    playlist,
    currentSongId,
    currentIndex,
    playSongWithData,
    isReacted,
    isFavorite,
    setIsReacted,
    setIsFavorite,
    handleEnded,
    isShuffled,
    toggleShuffle,
    originalPlaylist,
    shuffledPlaylist,
    autoplayEnabled,
  } = usePlayer();

  const { setShowComments } = useComments();
  const navigate = useNavigate();

  const [isLooping, setIsLooping] = useState(false);

  // States
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem("playerVolume");
    return savedVolume ? parseFloat(savedVolume) : 0.5;
  });
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isMuted, setIsMuted] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [queueAnchorEl, setQueueAnchorEl] = useState(null);
  const [playlistAnchorEl, setPlaylistAnchorEl] = useState(null);
  const [availablePlaylists, setAvailablePlaylists] = useState([]);
  const [isNewPlaylistDialogOpen, setIsNewPlaylistDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [repeatMode, setRepeatMode] = useState(1);
  const wasPlayingRef = useRef(false);
  const playerRef = useRef(null);
  const [showAnimation, setShowAnimation] = useState({
    reaction: false,
    favorite: false,
  });
  const [animationPosition, setAnimationPosition] = useState({ x: 0, y: 0 });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [isPressed, setIsPressed] = useState(false);
  const [showAnimation1, setShowAnimation1] = useState(false);
  const [isPressedSmile, setIsPressedSmile] = useState(false);
  const [showAnimation2, setShowAnimation2] = useState(false);

  // Add these near the top with other state declarations
  const [hasIncrementedPlayCount, setHasIncrementedPlayCount] = useState(false);

  useEffect(() => {
    const handleLoopReset = () => {
      setIsLooping(false);
    };

    window.addEventListener("resetLoop", handleLoopReset);
    return () => window.removeEventListener("resetLoop", handleLoopReset);
  }, []);

  // Add this with your other useEffect hooks
  useEffect(() => {
    if (currentSongId) {
      setHasIncrementedPlayCount(false);
    }
  }, [currentSongId]);

  useEffect(() => {
    localStorage.setItem("playerVolume", volume.toString());
  }, [volume]);

  if (!currentSong) return null;

  const getCurrentTimestamp = () => {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}${String(now.getDate()).padStart(2, "0")}_${String(
      now.getHours()
    ).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(
      now.getSeconds()
    ).padStart(2, "0")}`;
  };

  const updateAnimationPosition = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setAnimationPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const showNotification = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleRepeatClick = () => {
    setRepeatMode((prevMode) => (prevMode + 1) % 3);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ ...snackbar, open: false });
  };

  // Add this with your other functions (like handleProgress, handleSeekChange, etc.)
  const incrementPlayCount = async (songId) => {
    if (!songId || hasIncrementedPlayCount) return;

    const timestamp = getCurrentTimestamp();

    try {
      const response = await fetch(
        "https://i3lmfmc1h2.execute-api.ap-south-1.amazonaws.com/voizpost/save/playcount",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            song_id: songId,
            user_id: localStorage.getItem("user_id") || "1",
            updatedTimestamp: timestamp,
          }),
        }
      );

      if (response.ok) {
        console.log("Play count incremented successfully");

        // Store play count update in session storage
        sessionStorage.setItem(
          "playCountUpdate",
          JSON.stringify({
            songId: songId,
            timestamp: Date.now(),
          })
        );

        setHasIncrementedPlayCount(true);
      }
    } catch (error) {
      console.error("Error incrementing play count:", error);
    }
  };

  // const handleProgress = (state) => {
  //   if (!isSeeking) {
  //     setProgress(state.played);
  //     if (state.played > 0.99) {
  //       handleSongEnd();
  //     }
  //   }
  // };

  // Replace your existing handleProgress function with this one
  const handleProgress = (state) => {
    if (!isSeeking) {
      setProgress(state.played);

      // Check if played for 30 seconds and hasn't been counted yet
      if (
        currentSongId &&
        isPlaying &&
        state.playedSeconds >= 30 &&
        !hasIncrementedPlayCount
      ) {
        incrementPlayCount(currentSongId);
      }

      if (state.played > 0.99) {
        handleSongEnd();
      }
    }
  };

  const handleSongEnd = () => {
    // If loop is enabled, restart the current song
    if (isLooping) {
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        setIsPlaying(true);
      }
      return;
    }

    // If repeat one is enabled, just replay the current song
    if (repeatMode === 2) {
      playerRef.current?.seekTo(0);
      setIsPlaying(true);
      return;
    }

    const isLastSong = currentIndex === playlist.length - 1;

    // If it's the last song
    if (isLastSong) {
      if (repeatMode === 1) {
        // Repeat all mode
        playSongWithData(playlist[0], 0, true, autoplayEnabled).then(() => {
          setIsPlaying(autoplayEnabled);
        });
      } else {
        setIsPlaying(false);
        setProgress(0);
      }
      return;
    }

    // For all other cases (not last song)
    if (!autoplayEnabled) {
      // If autoplay is OFF: Load next song but don't play it
      const nextIndex = currentIndex + 1;
      const nextSong = playlist[nextIndex];

      // Ensure current song is properly stopped
      setIsPlaying(false);

      // Load next song with a slight delay to ensure proper state reset
      setTimeout(() => {
        playSongWithData(nextSong, nextIndex, true, false).then(() => {
          setProgress(0);
          setIsPlaying(false);
        });
      }, 100);
    } else {
      // If autoplay is ON: Play next song normally
      playNext();
    }
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
  };

  const handleDuration = (duration) => {
    setDuration(duration);
  };

  const handleSeekStart = () => {
    wasPlayingRef.current = isPlaying;
    if (isPlaying) {
      setIsPlaying(false);
    }
    setIsSeeking(true);
  };

  const handleSeekChange = (e, newValue) => {
    setProgress(newValue);
  };

  const handleSeekEnd = (e, newValue) => {
    if (playerRef.current) {
      if (newValue >= 0.99) {
        handleSongEnd();
      } else {
        playerRef.current.seekTo(newValue);
        if (wasPlayingRef.current) {
          setIsPlaying(true);
        }
      }
    }
    setIsSeeking(false);
  };

  const handleVolumeChange = (e, newValue) => {
    if (newValue > 0) {
      setIsMuted(false);
    }
    setVolume(newValue);
    setPrevVolume(newValue > 0 ? newValue : prevVolume);
  };

  const toggleMute = () => {
    if (isMuted) {
      const volumeToSet = prevVolume > 0 ? prevVolume : 0.5;
      setVolume(volumeToSet);
      setPrevVolume(volumeToSet);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeOffIcon />;
    if (volume < 0.5) return <VolumeDownIcon />;
    return <VolumeUpIcon />;
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 1:
        return <RepeatIcon style={{ color: "#1DB954" }} />;
      case 2:
        return <RepeatOneIcon style={{ color: "#1DB954" }} />;
      default:
        return <RepeatIcon />;
    }
  };

  const handleNextClick = () => {
    if (!playlist.length) return;

    // Reset loop state when changing songs
    setIsLooping(false);

    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextSong = playlist[nextIndex];

    if (!autoplayEnabled) {
      // If autoplay is OFF: Load next song but don't play it
      playSongWithData(nextSong, nextIndex, true, false).then(() => {
        setProgress(0);
        setIsPlaying(false);
        // Reset player state
        if (playerRef.current) {
          playerRef.current.seekTo(0);
        }
      });
    } else {
      // If autoplay is ON: Play next song normally
      playNext();
    }
  };

  const togglePlay = () => {
    if (!currentSong) return;

    // Modified implementation
    if (!isPlaying) {
      // Ensure player is ready before playing
      if (playerRef.current) {
        if (progress === 0) {
          playerRef.current.seekTo(0);
        }
        // Force player update
        playerRef.current.getInternalPlayer()?.play();
      }
    }

    setIsPlaying(!isPlaying);
  };

  const handleReaction = async () => {
    if (!currentSongId) return;
    const userId = localStorage.getItem("user_id") || "1";
    const newReactionState = !isReacted;
    const timestamp = getCurrentTimestamp();

    try {
      const response = await fetch(
        "https://i3lmfmc1h2.execute-api.ap-south-1.amazonaws.com/voizpost/song/reaction",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reaction: String(newReactionState),
            user_id: userId,
            song_id: currentSongId,
            updatedTimestamp: timestamp,
          }),
        }
      );

      if (response.ok) {
        setIsReacted(newReactionState);
        setShowAnimation((prev) => ({ ...prev, reaction: true }));
        setTimeout(() => {
          setShowAnimation((prev) => ({ ...prev, reaction: false }));
        }, 500);
      }

      localStorage.setItem(
        "metricsUpdate",
        JSON.stringify({
          type: "reaction",
          increment: newReactionState,
          timestamp: Date.now(),
          songId: currentSongId,
        })
      );

      if (newReactionState) {
        setShowAnimation1(true);
        setTimeout(() => setShowAnimation1(false), 1000);
      }

      setTimeout(() => {
        setShowAnimation((prev) => ({ ...prev, reaction: false }));
      }, 500);
    } catch (error) {
      console.error("Error in reaction update:", error);
    }
    setIsPressed(!isPressed);
  };

  const handleFavorite = async () => {
    if (!currentSongId) return;
    const userId = localStorage.getItem("user_id") || "1";
    const newFavoriteState = !isFavorite;
    const timestamp = getCurrentTimestamp();

    try {
      const response = await fetch(
        "https://2a11hm9ls1.execute-api.ap-south-1.amazonaws.com/voizfavorite/api/song/favorite",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            favorite: String(newFavoriteState),
            user_id: userId,
            song_id: currentSongId,
            updatedTimestamp: timestamp,
          }),
        }
      );

      if (response.ok) {
        setIsFavorite(newFavoriteState);
        setShowAnimation((prev) => ({ ...prev, favorite: true }));
        setTimeout(() => {
          setShowAnimation((prev) => ({ ...prev, favorite: false }));
        }, 500);
      }

      localStorage.setItem(
        "metricsUpdate",
        JSON.stringify({
          type: "favorite",
          increment: newFavoriteState,
          timestamp: Date.now(),
          songId: currentSongId,
        })
      );

      if (newFavoriteState) {
        setShowAnimation2(true);
        setTimeout(() => setShowAnimation2(false), 1000);
      }

      setTimeout(() => {
        setShowAnimation((prev) => ({ ...prev, reaction: false }));
      }, 500);
    } catch (error) {
      console.error("Error in favorite update:", error);
    }
    setIsPressedSmile(!isPressedSmile);
  };

  const handleMoreClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleQueueClick = (event) => {
    console.log("Queue clicked, current playlists:", {
      original: originalPlaylist,
      shuffled: shuffledPlaylist,
      isShuffled: isShuffled,
    });
    window.dispatchEvent(new Event("showQueue"));
  };

  const handlePlaylistClick = async (event) => {
    setPlaylistAnchorEl(event.currentTarget);
    setIsPlaylistLoading(true);

    try {
      const userId = localStorage.getItem("user_id") || "1";
      const response = await fetch(
        `https://67avbampgi.execute-api.ap-south-1.amazonaws.com/voiz/playlist/list?user_id=${userId}`
      );

      if (response.ok) {
        const data = await response.json();
        setAvailablePlaylists(data.playlists || []);
      } else {
        showNotification("Failed to load playlists", "error");
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
      // showNotification("Failed to load playlists", "error");
    } finally {
      setIsPlaylistLoading(false);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleQueueClose = () => {
    setQueueAnchorEl(null);
  };

  const handlePlaylistClose = () => {
    setPlaylistAnchorEl(null);
  };

  const handleQueueItemClick = (index) => {
    playSongWithData(playlist[index], index, false, true);
    handleQueueClose();
  };

  const handleCommentClick = () => {
    handleMenuClose();
    window.dispatchEvent(new Event("expandSongDetails"));
    setShowComments(true);
    setTimeout(() => {
      const commentsSection = document.querySelector(".comments-section");
      if (commentsSection) {
        commentsSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const addSongToPlaylist = async (playlistId, playlistName) => {
    try {
      // First check if song exists in the playlist
      const checkResponse = await fetch(
        `https://67avbampgi.execute-api.ap-south-1.amazonaws.com/voiz/playlist/songList?playlist_id=${playlistId}`
      );

      if (!checkResponse.ok) {
        setSnackbar({
          open: true,
          message: "Failed to check playlist songs",
          severity: "error",
          background: "#2644d9 !important", // Using same background for consistency
        });
        return false;
      }

      const data = await checkResponse.json();

      // Check if song already exists in playlist
      const songExists = data.songDetails?.some(
        (song) => String(song.song_id) === String(currentSongId)
      );

      if (songExists) {
        setSnackbar({
          open: true,
          message: "Song already exists in the playlist",
          severity: "success", // Changed to success to maintain consistent styling
          background: "#2644d9 !important",
        });
        return false;
      }

      // If song doesn't exist, proceed with adding it
      const timestamp = getCurrentTimestamp();
      const addResponse = await fetch(
        "https://67avbampgi.execute-api.ap-south-1.amazonaws.com/voiz/playlist/addSong",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playlist_id: playlistId,
            songIds: [currentSongId],
            updatedTimestamp: timestamp,
          }),
        }
      );

      if (addResponse.ok) {
        setSnackbar({
          open: true,
          message: `Song added to playlist : ${playlistName}`,
          severity: "success",
          background: "#2644d9 !important",
        });
        return true;
      } else {
        setSnackbar({
          open: true,
          message: "Failed to add song to playlist",
          severity: "error",
          background: "#2644d9 !important", // Using same background for consistency
        });
        return false;
      }
    } catch (error) {
      console.error("Error adding song to playlist:", error);
      setSnackbar({
        open: true,
        message: "Failed to add song to playlist",
        severity: "error",
        background: "#2644d9 !important", // Using same background for consistency
      });
      return false;
    }
  };

  const createNewPlaylist = async (name) => {
    if (!name?.trim()) {
      showNotification("Please enter a playlist name", "error");
      return null;
    }

    const userId = localStorage.getItem("user_id");
    const timestamp = new Date().toISOString();

    try {
      const response = await fetch(
        "https://67avbampgi.execute-api.ap-south-1.amazonaws.com/voiz/newPlaylist",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            playlistName: name.trim(),
            songIds: currentSongId ? [currentSongId] : [],
            createdTimestamp: timestamp,
            updatedTimestamp: timestamp,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create playlist");
      }

      const newPlaylist = await response.json();
      showNotification("Playlist created successfully!", "success");
      return newPlaylist;
    } catch (error) {
      console.error("Error creating playlist:", error);
      showNotification("Failed to create playlist", "error");
      return null;
    }
  };

  const handleNewPlaylistClick = () => {
    setIsNewPlaylistDialogOpen(true);
  };

  const handleNewPlaylistClose = () => {
    setIsNewPlaylistDialogOpen(false);
    setNewPlaylistName("");
  };

  const wrapText = (text, maxLength = 20) => {
    if (!text) return "";
    const words = text.split(" ");
    let lines = [];
    let currentLine = "";

    words.forEach((word) => {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines.join("\n");
  };


  return (
    <div className="mini-player">
      <Box
        component="img"
        src={currentCover}
        alt="Album Art"
        className="album-art"
      />

<div className="song-info">
          <Tooltip title={currentTitle || "No song selected"} placement="top">
            <Typography
              className="song-title"
              sx={{
                fontFamily: "Poppins !important",
                fontWeight: "600 !important",
                fontSize: "14px !important",
                lineHeight: "140% !important",
                letterSpacing: "-0.4px !important",
                whiteSpace: "pre-wrap", // Allow line breaks
                wordBreak: "break-word", // Ensure words break if necessary
                maxWidth: "200px", // Limit width to prevent excessive expansion
              }}
            >
              {wrapText(currentTitle || "No song selected")}
            </Typography>
          </Tooltip>
          <Typography
            className="song-artist"
            sx={{
              fontFamily: "Poppins !important",
              fontSize: "12px !important",
              lineHeight: "140% !important",
              letterSpacing: "-0.4px !important",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "200px",
            }}
          >
            {currentArtist}
          </Typography>
        </div>

      <div className="progress-section">
        <Typography
          className="time-text"
          sx={{
            fontSize: "10px !important",
            fontFamily: "Open Sans !important",
            lineHeight: "140% !important",
            // letterSpacing: "-0.4px",
            fontWeight: "300 !important",
            marginRight: "-16px !important",
          }}
        >
          {formatTime(progress * duration)}
        </Typography>
        <Slider
          className="progress-slider"
          value={progress}
          min={0}
          max={1}
          step={0.001}
          onMouseDown={handleSeekStart}
          onChange={handleSeekChange}
          onChangeCommitted={handleSeekEnd}
          sx={{
            "& .MuiSlider-thumb": {
              transition: isSeeking ? "none" : "all 0.2s",
            },
          }}
        />
        <Typography
          className="time-text"
          sx={{
            fontSize: "10px !important",
            fontFamily: "Open Sans !important",
            lineHeight: "140% !important",
            // letterSpacing: "-0.4px",
            fontWeight: "300 !important",
            marginLeft: "-16px !important",
          }}
        >
          {formatTime(duration)}
        </Typography>
      </div>

      <div className="controls">
        {/* <IconButton
          onClick={toggleShuffle}
          className={`control-icon ${isShuffled ? "active-shuffle" : ""}`}
          sx={{
            color: isShuffled ? "#1DB954" : "inherit",
          }}
        >
          {" "}
          <img
            src={Shuffle1}
            alt="Shuffle"
            style={{
              width: "26px",
              height: "26px",
              // marginLeft: "10px",
            }}
          />
        </IconButton> */}

        <IconButton
          onClick={() => {
            setIsLooping(false);
            playPrevious();
          }}
          disabled={!playlist.length}
          className="control-icon prev-play"
          sx={{ fontSize: "60px !important" }}
        >
          <SkipPreviousIcon
            sx={{ fontSize: "40px !important", marginRight: "-20px" }}
          />
        </IconButton>

        <IconButton
          onClick={togglePlay}
          className="control-icon play-button"
          sx={{
            "&:hover": {
              backgroundColor: "#2644d9 !important",
            },
          }}
        >
          {isPlaying ? (
            <FaPause className="play-icon" />
          ) : (
            <FaPlay className="play-icon" />
          )}
        </IconButton>

        <IconButton
          onClick={handleNextClick}
          disabled={!playlist.length}
          className="control-icon"
        >
          <SkipNextIcon
            sx={{ fontSize: "40px !important", marginLeft: "-20px" }}
          />
        </IconButton>

        <div className="volume-control">
          <IconButton onClick={toggleMute} className="control-icon volume-icon">
            {getVolumeIcon()}
          </IconButton>
          <Slider
            className="volume-slider"
            value={volume}
            min={0}
            max={1}
            step={0.01}
            onChange={handleVolumeChange}
            orientation="horizontal"
            sx={{
              width: 60,
              "& .MuiSlider-thumb": {
                width: 12,
                height: 12,
                background:" #2644d9"
              
              },
              "& .MuiSlider-track": {
                height: 4,
              },
              "& .MuiSlider-rail": {
                height: 4,
              },
            }}
          />
        </div>

        <IconButton
          onClick={handleReaction}
          className={`control-icon interaction-button clap ${
            isPressed ? "pressed" : ""
          }`}
          onMouseEnter={updateAnimationPosition}
          data-active={isPressed}
          style={{ position: "relative" }}
        >
          {isReacted && showAnimation1 && (
            <div className="clap-animation">
              <img
                src={reaction_filled1}
                alt="Love Icon"
                className="clap-icon"
              />
            </div>
          )}
          <img
            src={isReacted ? reaction_filled1 : reaction_empty}
            alt="Reaction"
            className="control-icon-img "
          />
          {showAnimation.reaction && (
            <div
              className="animation-popup"
              style={{
                position: "fixed",
                left: `${animationPosition.x}px`,
                top: `${animationPosition.y}px`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <img
                src={reaction_filled1}
                alt=""
                style={{
                  width: "32px !important",
                  height: "32px !important",
                }}
              />
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
            </div>
          )}
        </IconButton>

        <IconButton
          onClick={handleFavorite}
          className={`control-icon interaction-button favorite ${
            isPressedSmile ? "pressed" : ""
          }`}
          onMouseEnter={updateAnimationPosition}
          data-active={isFavorite}
        >
          {isFavorite && showAnimation2 && (
            <div className="clap-animation">
              <img src={loved_tracks} alt="Love Icon" className="love-icon" />
            </div>
          )}
          <img
            src={isFavorite ? loved_tracks : like}
            alt="Favorite"
            className="control-icon-img"
          />
          {showAnimation.favorite && (
            <div
              className="animation-popup"
              style={{
                position: "fixed",
                left: `${animationPosition.x}px`,
                top: `${animationPosition.y}px`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <img
                src={loved_tracks}
                alt=""
                style={{
                  width: "24px",
                  height: "24px",
                }}
              />
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
            </div>
          )}
        </IconButton>

        <IconButton
          className="control-icon loop"
          onClick={handlePlaylistClick}
          sx={{ height: "20px !important", width: "20px !important" }}
        >
          <img
            src={addPlaylist}
            alt="Add to Playlist"
            className="control-icon-img"
          />
        </IconButton>

        <IconButton
          className="control-icon loop"
          onClick={toggleLoop}
          sx={{
            backgroundColor: "transparent !important",
            "& img": {
              filter: isLooping
                ? "brightness(0) saturate(100%) invert(77%) sepia(64%) saturate(4628%) hue-rotate(177deg) brightness(101%) contrast(101%)"
                : "none",
            },
          }}
        >
          <img src={loop} alt="loop" className="control-icon-img" />
        </IconButton>

        <IconButton onClick={handleMoreClick} className="control-icon">
          <img src={more} alt="More options" className="control-icon-img" />
        </IconButton>
      </div>

      <ReactPlayer
        ref={playerRef}
        url={currentSong}
        playing={isPlaying}
        volume={volume}
        muted={isMuted}
        onProgress={handleProgress}
        onDuration={handleDuration}
        onEnded={handleSongEnd}
        loop={isLooping}
        width="0"
        height="0"
      />

      <PlaylistMenu
        anchorEl={playlistAnchorEl}
        onClose={handlePlaylistClose}
        isOpen={Boolean(playlistAnchorEl)}
        playlists={availablePlaylists}
        isLoading={isPlaylistLoading}
        onNewPlaylist={handleNewPlaylistClick}
        onAddToPlaylist={addSongToPlaylist}
        isNewPlaylistDialogOpen={isNewPlaylistDialogOpen}
        newPlaylistName={newPlaylistName}
        onNewPlaylistNameChange={(e) => setNewPlaylistName(e.target.value)}
        onNewPlaylistClose={handleNewPlaylistClose}
        onCreatePlaylist={createNewPlaylist}
        snackbar={snackbar}
        onSnackbarClose={handleSnackbarClose}
        currentSongId={currentSongId}
      />

      <QueueMenu
        anchorEl={queueAnchorEl}
        onClose={handleQueueClose}
        isOpen={Boolean(queueAnchorEl)}
        playlist={playlist}
        currentIndex={currentIndex}
        onSongSelect={handleQueueItemClick}
      />

      <MoreOptionsMenu
        anchorEl={anchorEl}
        onClose={handleMenuClose}
        isOpen={Boolean(anchorEl)}
        onCommentClick={handleCommentClick}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{
          position: "fixed",
          top: "10%",

          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{
            backgroundColor: snackbar.background || "#2644d9",
            color: "white",
            "& .MuiAlert-icon": {
              color: "white",
              marginTop: "auto",
              marginBottom: "auto",
            },
            "& .MuiAlert-action": {
              marginTop: "auto",
              marginBottom: "auto",
              padding: "0px",
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              "& .MuiButtonBase-root": {
                padding: "0px",
                minWidth: "24px",
                height: "24px",
              },
            },
            "& .MuiAlert-message": {
              padding: "8px 0",
              marginRight: "24px",
            },
            alignItems: "center",
            minHeight: "48px",
            padding: "6px 15px",
            position: "relative",
            width: "auto",
            minWidth: "300px",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default MiniPlayer;
