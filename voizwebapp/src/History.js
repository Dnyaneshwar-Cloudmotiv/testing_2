import React, { useEffect, useState, useRef } from "react";
import { Box, Typography, IconButton, Slider } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import Hls from "hls.js";
import SideBar from "./SideBar";
import coverpage from "./assets/mic.jpg"; // Fallback cover image
import "./History.css";
import MiniPlayer from "./MiniPlayer";

export default function History() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSong, setCurrentSong] = useState(null); // Track the currently playing song
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null); // Reference to the audio element
  const hlsRef = useRef(null); // Reference to the Hls instance
  const user_id = localStorage.getItem("user_id"); // Assuming user_id is stored in localStorage

  // Fetch song history from the API
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch(
          `https://3ujjsgu42d.execute-api.ap-south-1.amazonaws.com/history/gethistory?user_id=${user_id}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch history");
        }

        const data = await response.json();
        if (typeof data === "string") {
          console.log("Response is a string:", data);
          setSongs([]); // No history available
        } else {
          setSongs(data.songDetails.flat()); // Flatten the array of arrays
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching history:", error);
        setError("Failed to load history");
        setLoading(false);
      }
    };

    fetchSongs();
  }, [user_id]);

  // Initialize Hls.js when currentSong changes
  useEffect(() => {
    if (currentSong && audioRef.current) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls; // Store hls instance for cleanup
        hls.loadSource(currentSong.songStreamUrl);
        hls.attachMedia(audioRef.current);
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error("HLS error:", data);
        });
      } else if (
        audioRef.current.canPlayType("application/vnd.apple.mpegurl")
      ) {
        // Fallback for Safari
        audioRef.current.src = currentSong.songStreamUrl;
      }
    }

    // Cleanup previous Hls instance if songUrl changes
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentSong]);

  // Function to handle song click
  const handleSongClick = (song) => {
    setCurrentSong(song); // Set the current song to play
    setIsPlaying(true); // Start playing immediately
  };

  // Function to toggle play/pause
  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <Box className="adminPage">
      <SideBar />
      <Box className="adminBody">
        <Typography
          variant="h3"
          sx={{ color: "white", marginBottom: 2, marginTop: 5 }}
        >
          History
        </Typography>

        <Box className="songListPanel">
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="error-message">Error: {error}</p>
          ) : songs.length > 0 ? (
            <Box className="songListGrid">
              {songs.map((song, index) => (
                <Box
                  key={index}
                  className="song-item"
                  onClick={() => handleSongClick(song)} // Set the song in mini player on click
                  sx={{ cursor: "pointer" }}
                >
                  {song.coverPageUrl ? (
                    <img
                      src={song.coverPageUrl}
                      alt={song.songName}
                      className="songcover"
                    />
                  ) : (
                    <img
                      src={coverpage}
                      alt={song.songName}
                      className="songcover"
                    />
                  )}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="body1"
                      sx={{ fontSize: "20px", color: "white" }}
                    >
                      {song.songName}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        marginTop: "5px",
                        fontSize: "18px",
                        color: "#A5A5A5",
                      }}
                    >
                      {song.stage_name}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        marginLeft: "15px",
                        alignSelf: "flex-start",
                        marginTop: "3px",
                        color: "#A5A5A5",
                      }}
                    >
                      {song.span}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <p>No history available</p>
          )}
        </Box>
      </Box>
    </Box>
  );
}
