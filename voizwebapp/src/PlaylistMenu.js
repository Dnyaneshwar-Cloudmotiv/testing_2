import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  MenuItem,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Snackbar,
  Alert,
  Checkbox,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EmptyCheckbox from "./assets/EmptyCheckbox.png";
import FileedCheckbox from "./assets/FilledCheckbox.png";
import "./PlaylistMenu.css";

const PlaylistMenu = ({
  anchorEl,
  onClose,
  isOpen,
  playlists = [],
  isLoading,
  onNewPlaylist,
  onAddToPlaylist,
  isNewPlaylistDialogOpen,
  newPlaylistName,
  onNewPlaylistNameChange,
  onNewPlaylistClose,
  onCreatePlaylist,
  snackbar,
  onSnackbarClose,
  currentSongId,
}) => {
  const navigate = useNavigate();
  const [localPlaylists, setLocalPlaylists] = useState(playlists);
  const [localSnackbar, setLocalSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistDialog, setNewPlaylistDialog] = useState({
    open: false,
    name: "",
    error: "",
  });
  const [checkedState, setCheckedState] = useState({});

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Apply blur effect when dialog opens
  useEffect(() => {
    // Apply blur to content container
    const contentContainer = document.querySelector(".content-container");
    if (contentContainer && isDialogOpen) {
      contentContainer.classList.add("dialog-open");
    } else if (contentContainer) {
      contentContainer.classList.remove("dialog-open");
    }

    // Apply blur to content section
    const contentSection = document.querySelector(".content-section");
    if (contentSection && isDialogOpen) {
      contentSection.classList.add("dialog-open");
    } else if (contentSection) {
      contentSection.classList.remove("dialog-open");
    }

    // Apply blur to drawer content (HomePage)
    const drawer = document.querySelector(".drawer");
    if (drawer && isDialogOpen) {
      drawer.classList.add("dialog-open");
    } else if (drawer) {
      drawer.classList.remove("dialog-open");
    }

    // Apply blur to form container (SongBasket)
    const formContainer = document.querySelector(".formContainer");
    if (formContainer && isDialogOpen) {
      formContainer.classList.add("dialog-open");
    } else if (formContainer) {
      formContainer.classList.remove("dialog-open");
    }

    const accountContainer = document.querySelector(".account");
    if (accountContainer && isDialogOpen) {
      accountContainer.classList.add("dialog-open");
    } else if (accountContainer) {
      accountContainer.classList.remove("dialog-open");
    }
    const yourUploadsContent = document.querySelector(".admin-card");
    if (yourUploadsContent && isDialogOpen) {
      yourUploadsContent.classList.add("dialog-open");
    } else if (yourUploadsContent) {
      yourUploadsContent.classList.remove("dialog-open");
    }

    const exploreContent = document.querySelector(".explore-body");
    if (exploreContent && isDialogOpen) {
      exploreContent.classList.add("dialog-open");
    } else if (exploreContent) {
      exploreContent.classList.remove("dialog-open");
    }

    // Add blur to key Explore page elements
    const languageGrid = document.querySelector(".language-grid");
    if (languageGrid && isDialogOpen) {
      languageGrid.classList.add("dialog-open");
    } else if (languageGrid) {
      languageGrid.classList.remove("dialog-open");
    }

    const artistContainer = document.querySelector(".artist-container");
    if (artistContainer && isDialogOpen) {
      artistContainer.classList.add("dialog-open");
    } else if (artistContainer) {
      artistContainer.classList.remove("dialog-open");
    }

    const searchContainer = document.querySelector(".search-container");
    if (searchContainer && isDialogOpen) {
      searchContainer.classList.add("dialog-open");
    } else if (searchContainer) {
      searchContainer.classList.remove("dialog-open");
    }

    const panelLists = document.querySelectorAll(".PanelList");
    panelLists.forEach((panel) => {
      if (isDialogOpen) {
        panel.classList.add("dialog-open");
      } else {
        panel.classList.remove("dialog-open");
      }
    });
    const songList = document.querySelector(".songlistgrid");
    if (songList && isDialogOpen) {
      songList.classList.add("dialog-open");
    } else if (songList) {
      songList.classList.remove("dialog-open");
    }

    const feedbackPage = document.querySelector(".feedback");
    if (feedbackPage && isDialogOpen) {
      feedbackPage.classList.add("dialog-open");
    } else if (feedbackPage) {
      feedbackPage.classList.remove("dialog-open");
    }
    // Cleanup on unmount
    return () => {
      if (contentContainer) contentContainer.classList.remove("dialog-open");
      if (contentSection) contentSection.classList.remove("dialog-open");
      if (drawer) drawer.classList.remove("dialog-open");
      if (accountContainer) accountContainer.classList.remove("dialog-open");
      if (formContainer) formContainer.classList.remove("dialog-open");
      if (yourUploadsContent)
        yourUploadsContent.classList.remove("dialog-open");
      if (exploreContent) exploreContent.classList.remove("dialog-open");

      if (languageGrid) languageGrid.classList.remove("dialog-open");
      if (artistContainer) artistContainer.classList.remove("dialog-open");
      if (searchContainer) searchContainer.classList.remove("dialog-open");
      panelLists.forEach((panel) => {
        panel.classList.remove("dialog-open");
      });

      if (songList) songList.classList.remove("dialog-open");
      if (feedbackPage) feedbackPage.classList.remove("dialog-open");
    };
  }, [isDialogOpen]);

  const refreshPlaylists = async () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    try {
      const response = await fetch(
        `https://67avbampgi.execute-api.ap-south-1.amazonaws.com/voiz/playlist/list?user_id=${userId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const playlistsData = data.playlists || [];
      setLocalPlaylists(playlistsData);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      setLocalPlaylists([]);
    }
  };

  // Reset checkedState when currentSongId changes
  useEffect(() => {
    setCheckedState({});
  }, [currentSongId]);

  useEffect(() => {
    setLocalPlaylists(playlists);
  }, [playlists]);

  const handleCheckboxClick = async (event, playlistId, playlistName) => {
    event.stopPropagation();

    const isCurrentlyChecked = checkedState[playlistId];

    if (isCurrentlyChecked) {
      setLocalSnackbar({
        open: true,
        message: "Song is already in this playlist",
        severity: "info",
        background: "#041F46",
      });
      return;
    }

    // Set the checkbox state before making the API call
    setCheckedState((prev) => ({
      ...prev,
      [playlistId]: true,
    }));

    // Dispatch the event before making the API call for immediate UI update
    window.dispatchEvent(
      new CustomEvent("playlistSongAdded", {
        detail: {
          playlistId: playlistId,
          songId: currentSongId,
          playlistName: playlistName,
          timestamp: new Date().toISOString(),
          songCount: true,
        },
      })
    );

    // Call the parent handler
    onAddToPlaylist(playlistId, playlistName);

    // Refresh playlists for backend sync
    await refreshPlaylists();
  };

  const handleCreatePlaylist = async (name) => {
    if (name && !name.trim()) {
      setNewPlaylistDialog((prev) => ({
        ...prev,
        error: "Please enter a playlist name",
      }));
      return;
    }

    setIsCreatingPlaylist(true);
    const userId = localStorage.getItem("user_id");
    const timestamp = new Date().toISOString();

    const playlistData = {
      user_id: userId,
      playlistName: name?.trim() || "",
      songIds: currentSongId ? [currentSongId] : [],
      createdTimestamp: timestamp,
      updatedTimestamp: timestamp,
    };

    try {
      const response = await fetch(
        "https://67avbampgi.execute-api.ap-south-1.amazonaws.com/voiz/newPlaylist",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(playlistData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || "Failed to create playlist");
        } catch (e) {
          throw new Error(`Server error: ${response.status}`);
        }
      }

      const newPlaylist = await response.json();
      const processedNewPlaylist = {
        playlist_id: {
          S:
            newPlaylist?.playlist_id?.S ||
            newPlaylist?.playlist_id ||
            newPlaylist?.id,
        },
        playlistName: { S: name.trim() },
        songIds: currentSongId
          ? { M: { [currentSongId]: { S: timestamp } } }
          : { M: {} },
        createdTimestamp: { S: timestamp },
        updatedTimestamp: { S: timestamp },
      };

      setLocalPlaylists((prev) => [...prev, processedNewPlaylist]);

      setLocalSnackbar({
        open: true,
        message: "Playlist created successfully!",
        severity: "success",
      });

      window.dispatchEvent(
        new CustomEvent("newPlaylistCreated", {
          detail: {
            ...processedNewPlaylist,
            songIds: currentSongId ? [currentSongId] : [],
          },
        })
      );

      if (currentSongId) {
        window.dispatchEvent(
          new CustomEvent("playlistSongAdded", {
            detail: {
              playlistId: processedNewPlaylist.playlist_id.S,
              songId: currentSongId,
            },
          })
        );
      }

      setNewPlaylistDialog({ open: false, name: "", error: "" });
      setIsDialogOpen(false);
      await refreshPlaylists();
      return processedNewPlaylist;
    } catch (error) {
      console.error("Error creating playlist:", error);
      const errorMessage = error.message.includes("Access denied")
        ? "Please log in to create a playlist"
        : error.message || "Failed to create playlist";

      setLocalSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
      throw error;
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  const handleNewPlaylistClick = () => {
    setNewPlaylistDialog((prev) => ({ ...prev, open: true }));
    setIsDialogOpen(true);
  };

  const handleNewPlaylistClose = () => {
    setNewPlaylistDialog({ open: false, name: "", error: "" });
    setIsDialogOpen(false);
  };

  const handleLocalSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setLocalSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={onClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            backgroundColor: "#151415 !important",
            color: "white",
            borderRadius: "12px",
            minWidth: "250px",
            marginLeft: "140px !important",
            mt: "-18px",
            marginLeft: "120px !important",
            overflow: "hidden",
            "& .MuiList-root": {
              padding: 0,
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
      >
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            backgroundColor: "#151415  !important",
          }}
        >
          <MenuItem
            onClick={handleNewPlaylistClick}
            sx={{
              color: "white",
              font: "Open Sans",
              fontWeight: "400 !important",
              "&:hover": {
                backgroundColor: "rgba(29, 185, 84, 0.1)",
              },
              padding: "12px 16px",
            }}
          >
            <AddIcon
              sx={{ mr: 1, color: "white !important", marginLeft: "15px" }}
            />{" "}
            <span>Create New Playlist</span>
          </MenuItem>
          <Box sx={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)" }} />
        </Box>

        <Box
          sx={{
            overflowY: "auto",
            maxHeight: "150px",
            minHeight: "70px !important",
            "&::-webkit-scrollbar": {
              width: "6px",
              backgroundColor: "rgba(0, 0, 0, 0.1) !important",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(255, 255, 255, 0.3)",
              borderRadius: "3px",
              minHeight: "50px",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.4)",
              },
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
            },
          }}
        >
          {isLoading ? (
            <MenuItem disabled>Loading playlists...</MenuItem>
          ) : localPlaylists.length === 0 ? (
            <MenuItem disabled sx={{ marginLeft: "46px !important" }}>
              No playlists found
            </MenuItem>
          ) : (
            localPlaylists.map((playlist) => {
              const playlistId =
                playlist?.playlist_id?.S || playlist?.playlist_id;
              const playlistName =
                playlist?.playlistName?.S || playlist?.playlistName;

              return (
                <MenuItem
                  key={playlistId}
                  sx={{
                    padding: "8px 16px",
                    height: "37px !important",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingLeft: "38px !important",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                  onClick={(e) =>
                    handleCheckboxClick(e, playlistId, playlistName)
                  }
                >
                  <span>{playlistName}</span>
                  <Checkbox
                    checked={checkedState[playlistId] || false}
                    onChange={(e) =>
                      handleCheckboxClick(e, playlistId, playlistName)
                    }
                    icon={
                      <img
                        src={EmptyCheckbox}
                        alt="EmptyCheckbox"
                        style={{ height: "24px", width: "24px" }}
                      />
                    }
                    checkedIcon={
                      <img
                        src={FileedCheckbox}
                        alt="FilledCheckbox"
                        style={{ height: "24px", width: "24px" }}
                      />
                    }
                    sx={{
                      color: "white",
                      "&.Mui-checked": {
                        color: "#2782EE",
                      },
                    }}
                  />
                </MenuItem>
              );
            })
          )}
        </Box>
      </Menu>

      <Dialog
        open={newPlaylistDialog.open}
        onClose={handleNewPlaylistClose}
        PaperProps={{
          sx: {
            backgroundColor: "#151415  !important",
            borderRadius: "12px",
            Width: "200px !important",
            padding: 0,
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.5)",
            marginRight: "100px !important",
          },
        }}
        BackdropProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: "18px",
            fontWeight: "bold",
            textAlign: "center",
            color: "white",
            marginBottom: "16px",
          }}
        >
          Create New Playlist
        </DialogTitle>

        <DialogContent>
          <TextField
            id="custom-textfield"
            placeholder={!newPlaylistDialog.name ? "Playlist name" : ""}
            variant="standard"
            fullWidth
            value={newPlaylistDialog.name}
            onChange={(e) =>
              setNewPlaylistDialog((prev) => ({
                ...prev,
                name: e.target.value,
                error: "",
              }))
            }
            error={!!newPlaylistDialog.error}
            helperText={newPlaylistDialog.error}
            InputProps={{
              disableUnderline: false,
              style: { backgroundColor: "#151415" }, // Add direct style here
            }}
            sx={{
              "& .MuiInputBase-root": {
                backgroundColor: "#151415 !important",
                color: "white !important",
                fontSize: "16px",
                marginLeft: "20px !important",
              },
              "& .MuiInputBase-input": {
                backgroundColor: "#151415 !important",
                "&::placeholder": {
                  color: "rgba(255,255,255,0.7)",
                },
              },
              // Target autofill specifically
              "& .MuiInputBase-input:-webkit-autofill": {
                WebkitBoxShadow: "0 0 0 1000px #151415 inset !important",
                WebkitTextFillColor: "white !important",
                caretColor: "white !important",
                borderRadius: "inherit",
              },
              "& .MuiInput-underline:before": {
                borderBottom: "1px solid white",
              },
              "& .MuiInput-underline:hover:before": {
                borderBottom: "1px solid white",
              },
              "& .MuiInput-underline:after": {
                borderBottom: "1px solid white",
              },
              "& .MuiFormHelperText-root": {
                color: "rgba(255, 255, 255, 0.7)",
              },
              "& .MuiInputLabel-root": {
                color: "white",
                "&.Mui-focused": {
                  color: "white",
                },
              },
              marginBottom: "16px",
              backgroundColor: "#151415 !important", // Change this to transparent
            }}
          />
        </DialogContent>

        <DialogActions
          sx={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "16px",
          }}
        >
          <Button
            onClick={handleNewPlaylistClose}
            sx={{
              backgroundColor: "transparent",
              color: "white",
              fontWeight: "600",
              textTransform: "none",
              fontSize: "14px",
              marginLeft: "20px !important",
              fontWeight: "400 !important",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleCreatePlaylist(newPlaylistDialog.name)}
            disabled={!newPlaylistDialog.name?.trim() || isCreatingPlaylist}
            sx={{
              // backgroundColor: "#2644d9",
              color: "white",
              fontWeight: "600",
              textTransform: "none",
              fontSize: "14px",
              borderRadius: "15px",
              padding: "6px 24px",
              fontWeight: "400 !important",
              "&:hover": {
                // backgroundColor:#2644d9",
              },
              "&:disabled": {
                backgroundColor: "#151415 !important",
                color: "rgba(255, 255, 255, 0.5)",
              },
            }}
          >
            {isCreatingPlaylist ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={localSnackbar.open}
        autoHideDuration={3000}
        onClose={handleLocalSnackbarClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        sx={{
          position: "fixed",
          top: "34%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Alert
          onClose={handleLocalSnackbarClose}
          severity={localSnackbar.severity}
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
            marginBottom: "20px",
            paddingLeft: "12px",
            position: "relative",
            width: "auto",
          }}
        >
          {localSnackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PlaylistMenu;
