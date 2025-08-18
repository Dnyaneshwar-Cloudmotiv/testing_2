import React, { useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import HomePage from "./HomePage";
import SideBar from "./SideBar";
import Box from "@mui/material/Box";

const SharedLinkHandler = () => {
  const { songId } = useParams();

  useEffect(() => {
    if (songId) {
      // Store the songId in localStorage or context for later use
      localStorage.setItem("sharedSongId", songId);

      // You might want to trigger the player to play this song
      // This depends on your player implementation
      const event = new CustomEvent("playSharedSong", { detail: songId });
      window.dispatchEvent(event);
    }
  }, [songId]);

  return (
    <Box>
      <SideBar />
      <Box sx={{ overflow: "none !important", marginTop: "-100vh !important" }}>
        <HomePage />
      </Box>
    </Box>
  );
};

export default SharedLinkHandler;
