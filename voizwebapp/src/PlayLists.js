import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SideBar from "./SideBar";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { IoShareSocialOutline } from "react-icons/io5";

import "./PlayLists.css";

import Playlists1 from "./assets/Playlists1.png";
import folder from "./assets/folder.png";
import Edit from "./assets/Edit.png";
import Delete from "./assets/Delete.png";
import coverpage from "./assets/coverpage1.jpeg";
import bannerImage1 from "./assets/RectangleBannerImage.png";

const formatDisplayText = (text) => {
  if (!text) return "";
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const PlayLists = () => {
  const [relatedPlaylists, setRelatedPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playlistSongCounts, setPlaylistSongCounts] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");

  const [shareableLink, setShareableLink] = useState("");

  // New state for dialogs
  const [openRenameDialog, setOpenRenameDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openShareDialog, setOpenShareDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const contentContainer = document.querySelector(".content-container");
    if (contentContainer) {
      if (isDialogOpen) {
        contentContainer.classList.add("dialog-open");
      } else {
        contentContainer.classList.remove("dialog-open");
      }
    }
  }, [isDialogOpen]);

  useEffect(() => {
    const fetchPlaylistSongs = async (playlistId, songIds) => {
      try {
        const response = await fetch(
          `https://67avbampgi.execute-api.ap-south-1.amazonaws.com/voiz/playlist/songList?playlist_id=${playlistId}`
        );
        if (!response.ok) throw new Error("Failed to fetch playlist songs");
        const data = await response.json();

        if (data.songDetails?.length > 0) {
          return {
            coverUrl: data.songDetails[0].coverPageUrl || bannerImage1,
            songCount: data.songDetails.length,
          };
        } else {
          return {
            coverUrl: bannerImage1, // Use default cover image if no songs
            songCount: 0,
          };
        }
      } catch (error) {
        console.error("Error fetching playlist songs:", error);
        return {
          coverUrl: bannerImage1, // Use default cover image on error
          songCount: songIds ? Object.keys(songIds).length : 0,
        };
      }
    };

    const fetchPlaylists = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://67avbampgi.execute-api.ap-south-1.amazonaws.com/voiz/playlist/list?user_id=${userId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const playlists = data.playlists || [];

        const playlistsWithCovers = await Promise.all(
          playlists.map(async (playlist) => {
            const songIds = playlist.songIds?.M || {};
            const { coverUrl, songCount } = await fetchPlaylistSongs(
              playlist.playlist_id?.S,
              songIds
            );

            return {
              id: playlist.playlist_id?.S,
              name: playlist.playlistName?.S,
              createdTimestamp: playlist.createdTimestamp?.S,
              songCount: songCount,
              coverPageUrl: coverUrl,
            };
          })
        );

        const counts = playlistsWithCovers.reduce((acc, playlist) => {
          acc[playlist.id] = playlist.songCount;
          return acc;
        }, {});

        setPlaylistSongCounts(counts);
        setRelatedPlaylists(playlistsWithCovers);
      } catch (error) {
        console.error("Error fetching playlists:", error);
        setRelatedPlaylists([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();

    const handleNewPlaylist = async (event) => {
      if (event.detail) {
        // First update the UI immediately
        const newPlaylist = event.detail;
        const processedPlaylist = {
          id: newPlaylist.playlist_id?.S,
          name: newPlaylist.playlistName?.S,
          createdTimestamp: newPlaylist.createdTimestamp?.S,
          songCount: newPlaylist.songIds
            ? Array.isArray(newPlaylist.songIds)
              ? newPlaylist.songIds.length
              : 0
            : 0,
          coverPageUrl: bannerImage1,
        };

        setRelatedPlaylists((prev) => [...prev, processedPlaylist]);
        setPlaylistSongCounts((prev) => ({
          ...prev,
          [processedPlaylist.id]: processedPlaylist.songCount,
        }));

        // Then refresh to get the latest data
        await fetchPlaylists();
      }
    };

    const handleSongAdded = async (event) => {
      if (event.detail && event.detail.playlistId) {
        const { playlistId } = event.detail;
        // First update the UI immediately
        setPlaylistSongCounts((prev) => ({
          ...prev,
          [playlistId]: (prev[playlistId] || 0) + 1,
        }));

        setRelatedPlaylists((prev) =>
          prev.map((playlist) => {
            if (playlist.id === playlistId) {
              return {
                ...playlist,
                songCount: (playlist.songCount || 0) + 1,
              };
            }
            return playlist;
          })
        );

        // Then refresh to get the latest data
        await fetchPlaylists();
      }
    };

    const handleSongRemoved = async (event) => {
      if (event.detail && event.detail.playlistId) {
        const { playlistId } = event.detail;
        // First update the UI immediately
        setPlaylistSongCounts((prev) => ({
          ...prev,
          [playlistId]: Math.max(0, (prev[playlistId] || 0) - 1),
        }));

        setRelatedPlaylists((prev) =>
          prev.map((playlist) => {
            if (playlist.id === playlistId) {
              return {
                ...playlist,
                songCount: Math.max(0, (playlist.songCount || 0) - 1),
              };
            }
            return playlist;
          })
        );

        // Then refresh to get the latest data
        await fetchPlaylists();
      }
    };

    window.addEventListener("newPlaylistCreated", handleNewPlaylist);
    window.addEventListener("playlistSongAdded", handleSongAdded);
    window.addEventListener("playlistSongRemoved", handleSongRemoved);

    return () => {
      window.removeEventListener("newPlaylistCreated", handleNewPlaylist);
      window.removeEventListener("playlistSongAdded", handleSongAdded);
      window.removeEventListener("playlistSongRemoved", handleSongRemoved);
    };
  }, [userId]);

  const handleMenuOpen = (event, playlist) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedPlaylist(playlist);
    setNewPlaylistName(playlist.name); // Initialize rename dialog with current name
  };

  const handleMenuClose = (event) => {
    if (event) {
      event.stopPropagation();
    }
    setAnchorEl(null);
  };

  const handleRenameClick = (event) => {
    event.stopPropagation();
    setIsDialogOpen(true);
    setOpenRenameDialog(true);
    handleMenuClose(event);
  };

  const handleDeleteClick = (event) => {
    event.stopPropagation();
    setIsDialogOpen(true);
    setOpenDeleteDialog(true);
    handleMenuClose(event);
  };

  const handleShareClick = async (event) => {
    event.stopPropagation();
    setIsDialogOpen(true);
    if (selectedPlaylist?.id) {
      try {
        const encodedName = encodeURIComponent(selectedPlaylist.name);
        const playlistLink = `${window.location.origin}/playlist/${selectedPlaylist.id}?name=${encodedName}`;

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
                link: playlistLink,
                androidInfo: {
                  androidPackageName: "com.voizapp.voiceapp",
                },
                socialMetaTagInfo: {
                  socialTitle: selectedPlaylist.name || "VOIZ Playlist",
                  socialDescription:
                    "Hey, check out this amazing playlist 😍 on VOIZ! Just download the app, listen and enjoy!",
                  socialImageLink:
                    selectedPlaylist.coverPageUrl ||
                    "https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/cover.png",
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
            `Hey, check out this amazing playlist 😍 on VOIZ! Just download the app, listen and enjoy! ${data.shortLink}`
          );
        } else {
          setShareableLink(
            `Hey, check out this amazing playlist 😍 on VOIZ! Just download the app, listen and enjoy! ${playlistLink}`
          );
        }
      } catch (error) {
        console.error("Error generating share link:", error);
        const fallbackUrl = `${window.location.origin}/playlist/${
          selectedPlaylist.id
        }?name=${encodeURIComponent(selectedPlaylist.name)}`;
        setShareableLink(
          `Hey, check out this amazing playlist 😍 on VOIZ! Just download the app, listen and enjoy! ${fallbackUrl}`
        );
      }
      setOpenShareDialog(true);
      handleMenuClose(event);
    }
  };

  const handleConfirmRename = async () => {
    try {
      const response = await fetch(
        "https://67avbampgi.execute-api.ap-south-1.amazonaws.com/voiz/updatePlaylistName",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playlistName: newPlaylistName.trim(),
            playlist_id: selectedPlaylist.id,
            updatedTimestamp: new Date().toISOString(),
          }),
        }
      );

      if (response.ok) {
        setRelatedPlaylists((playlists) =>
          playlists.map((p) =>
            p.id === selectedPlaylist.id
              ? { ...p, name: newPlaylistName.trim() }
              : p
          )
        );

        window.dispatchEvent(
          new CustomEvent("playlistRenamed", {
            detail: {
              playlistId: selectedPlaylist.id,
              newName: newPlaylistName.trim(),
            },
          })
        );
      } else {
        throw new Error("Failed to rename playlist");
      }
    } catch (error) {
      console.error("Error renaming playlist:", error);
    }
    setOpenRenameDialog(false);
    setIsDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(
        "https://67avbampgi.execute-api.ap-south-1.amazonaws.com/voiz/playlist/deletePlaylist",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playlist_id: selectedPlaylist.id,
          }),
        }
      );

      if (response.ok) {
        setRelatedPlaylists((playlists) =>
          playlists.filter((p) => p.id !== selectedPlaylist.id)
        );

        // Dispatch event for playlist deletion
        window.dispatchEvent(
          new CustomEvent("playlistDeleted", {
            detail: {
              playlistId: selectedPlaylist.id,
            },
          })
        );
      } else {
        throw new Error("Failed to delete playlist");
      }
    } catch (error) {
      console.error("Error deleting playlist:", error);
    }
    setOpenDeleteDialog(false);
    setIsDialogOpen(false);
  };

  const handleCopyShare = async () => {
    if (!shareableLink) return;
    try {
      await navigator.clipboard.writeText(shareableLink);
      setOpenShareDialog(false);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  const handlePlaylistClick = (playlist) => {
    navigate(`/playlist/${playlist.id}`, {
      state: {
        playlistId: playlist.id,
        playlistName: playlist.name,
        fetchPlaylist: true,
      },
    });
  };

  useEffect(() => {
    const handleNewPlaylist = (event) => {
      if (event.detail) {
        const newPlaylist = event.detail;
        // Check if playlist already exists to prevent duplicates
        setRelatedPlaylists((prev) => {
          const exists = prev.some((p) => p.id === newPlaylist.playlist_id?.S);
          if (exists) return prev;

          const processedPlaylist = {
            id: newPlaylist.playlist_id?.S,
            name: newPlaylist.playlistName?.S,
            createdTimestamp: newPlaylist.createdTimestamp?.S,
            songCount: newPlaylist.songIds
              ? Array.isArray(newPlaylist.songIds)
                ? newPlaylist.songIds.length
                : 0
              : 0,
            coverPageUrl: bannerImage1,
          };
          return [...prev, processedPlaylist];
        });
      }
    };

    const handleSongAdded = (event) => {
      if (event.detail && event.detail.playlistId) {
        const { playlistId } = event.detail;
        setPlaylistSongCounts((prev) => ({
          ...prev,
          [playlistId]: (prev[playlistId] || 0) + 1,
        }));

        setRelatedPlaylists((prev) =>
          prev.map((playlist) => {
            if (playlist.id === playlistId) {
              return {
                ...playlist,
                songCount: (playlist.songCount || 0) + 1,
              };
            }
            return playlist;
          })
        );
      }
    };

    const handleSongRemoved = (event) => {
      if (event.detail && event.detail.playlistId) {
        const { playlistId } = event.detail;
        // Only update state, don't trigger additional events
        setPlaylistSongCounts((prev) => ({
          ...prev,
          [playlistId]: Math.max(0, (prev[playlistId] || 0) - 1),
        }));

        setRelatedPlaylists((prev) =>
          prev.map((playlist) => {
            if (playlist.id === playlistId) {
              return {
                ...playlist,
                songCount: Math.max(0, (playlist.songCount || 0) - 1),
              };
            }
            return playlist;
          })
        );
      }
    };

    window.addEventListener("newPlaylistCreated", handleNewPlaylist);
    window.addEventListener("playlistSongAdded", handleSongAdded);
    window.addEventListener("playlistSongRemoved", handleSongRemoved);

    return () => {
      window.removeEventListener("newPlaylistCreated", handleNewPlaylist);
      window.removeEventListener("playlistSongAdded", handleSongAdded);
      window.removeEventListener("playlistSongRemoved", handleSongRemoved);
    };
  }, []);

  return (
    <Box className="main-container">
      <SideBar />
      <Box className="content-container">
        <Box className="hero-section">
          <Box className="hero-image-container" sx={{ marginLeft: "-4px" }}>
            <img src={bannerImage1} alt="Playlists" className="hero-image" />
            <Box className="hero-overlay">
              <Typography variant="h1" className="hero-title"></Typography>
            </Box>
          </Box>
        </Box>

        <Box
          className="playlists-section"
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 220px)",
            position: "relative",
            width: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              position: "sticky",
              top: 0,
              zIndex: 1,
              padding: "18px 20px",
              width: "100%",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "white",
                fontWeight: "bold",
                fontSize: "40px",
                lineHeight: "32px",
                marginTop: "10px",
                marginLeft: "20px",
              }}
            >
              Playlists
            </Typography>
            <img
              src={Playlists1}
              alt="Playlists"
              style={{
                height: "35px",
                width: "40px",
                marginTop: "15px",
                marginLeft: "10px",
              }}
            />
          </Box>

          {loading ? (
            <Typography sx={{ color: "white", p: 2 }}>Loading...</Typography>
          ) : (
            <>
              {relatedPlaylists.length > 0 ? (
                <Box
                  sx={{
                    flex: 1,
                    overflowY: "scroll",
                    width: "80%",
                    "&::-webkit-scrollbar": {
                      width: "8px",
                      display: "block",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "rgba(255, 255, 255, 0.05)",
                      borderRadius: "4px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "rgba(255, 255, 255, 0.3)",
                      borderRadius: "4px",
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                      background: "rgba(255, 255, 255, 0.4)",
                    },
                  }}
                >
                  <List sx={{ padding: 0 }}>
                    {relatedPlaylists.map((playlist) => (
                      <ListItem
                        key={playlist.id}
                        onClick={() => handlePlaylistClick(playlist)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          padding: "10px 20px",
                          "&:hover": {
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                          },
                          height: "82px",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            flex: 1,
                            height: "82px",
                            marginLeft: "30px",
                            marginTop: "20px !important",
                          }}
                        >
                          <Box
                            sx={{
                              position: "relative",
                              width: "76px",
                              height: "60px",
                              marginRight: "16px",
                            }}
                          >
                            <img
                              src={playlist.coverPageUrl}
                              alt={formatDisplayText(playlist.name)}
                              style={{
                                position: "absolute",
                                width: "65px",
                                height: "50px",
                                left: -3,
                                top: "-8px",
                                borderRadius: "4px",
                                objectFit: "cover",
                                zIndex: 0,
                              }}
                              onError={(e) => {
                                e.target.src =
                                  "https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/cover.png";
                              }}
                            />
                            <img
                              src={folder}
                              alt="Folder"
                              style={{
                                position: "absolute",
                                width: "90px",
                                height: "55px",
                                zIndex: 1,
                                right: 2,
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography
                              sx={{
                                color: "white",
                                fontWeight: "600",
                                fontSize: "18px",
                                marginLeft: "15px",
                              }}
                            >
                              {formatDisplayText(playlist.name) ||
                                "Untitled Playlist"}
                            </Typography>
                            <Typography
                              sx={{
                                color: "#A5A5A5 !important",
                                fontSize: "0.8rem",
                                marginLeft: "15px",
                              }}
                            >
                              {playlistSongCounts[playlist.id] || 0} songs
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, playlist)}
                          sx={{ color: "white" }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : (
                <Typography sx={{ color: "white", textAlign: "center", mt: 4 }}>
                  No playlists available
                </Typography>
              )}
            </>
          )}

          {/* Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            sx={{
              "& .MuiPaper-root": {
                backgroundColor: "#151415 !important",
                color: "white",
                marginLeft: 5,
                borderRadius: "15px",
                marginTop: "-35px",
                marginLeft: "-110px !important",
              },
            }}
          >
            <MenuItem onClick={handleRenameClick}>
              <img
                src={Edit}
                alt="Edit1"
                style={{
                  width: "16px",
                  height: "16px",
                }}
              />
              &nbsp; Rename
            </MenuItem>
            <MenuItem onClick={handleDeleteClick}>
              <img
                src={Delete}
                alt="Delete"
                style={{
                  width: "16px",
                  height: "16px",
                }}
              />
              &nbsp; Delete
            </MenuItem>
            <MenuItem onClick={handleShareClick}>
              <IoShareSocialOutline size={16} /> &nbsp; Share
            </MenuItem>
          </Menu>

          {/* Rename Dialog */}
          <Dialog
            open={openRenameDialog}
            onClose={() => {
              setOpenRenameDialog(false);
              setIsDialogOpen(false);
            }}
            sx={{
              "& .MuiDialog-paper": {
                width: "300px !important", // Reduced width
                minHeight: "150px !important",
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
                fontSize: "18px",
                fontWeight: "500",
              }}
            >
              Rename Playlist
            </DialogTitle>
            <DialogContent>

            <input
              type="text"
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              style={{
                width: "240px",
                height: "50.5px",
                backgroundColor: "white",
                borderRadius: "8px",
                border: "1px solid rgba(0, 0, 0, 0.23)",
                color: "black",
                padding: "12px 14px",
                fontSize: "16px",
                outline: "none",
              }}
              onFocus={(e) =>
                (e.target.style.border = "1px solid #2782EE")
              }
              onBlur={(e) =>
                (e.target.style.border = "1px solid rgba(0, 0, 0, 0.23)")
              }
            />

              {/* <TextField
                autoFocus
                fullWidth
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                sx={{
                  backgroundColor: "white",
                  borderRadius: "4px",
                  width: "240px !important",
                  height: "50.5px !important",
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
                    color: "black", // Ensuring input text is black
                  },
                }}
              /> */}
            </DialogContent>
            <DialogActions sx={{ justifyContent: "center", gap: "16px" }}>
              <Button
                onClick={() => {
                  setOpenRenameDialog(false);
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
                onClick={handleConfirmRename}
                sx={{
                  color: "white",
                  textTransform: "none",
                  fontSize: "16px",
                  "&:hover": {
                    backgroundColor: "rgba(39, 130, 238, 0.08)",
                  },
                }}
              >
                Rename
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Dialog */}
          <Dialog
            open={openDeleteDialog}
            onClose={() => {
              setOpenDeleteDialog(false);
              setIsDialogOpen(false);
            }}
            sx={{
              "& .MuiDialog-paper": {
                width: "300px !important", // Reduced width
                minHeight: "150px !important",
                borderRadius: "16px",
                backgroundColor: "#100F32",
                color: "white",

                boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.5)",
              },
              "& .MuiDialogTitle-root": {
                textAlign: "center",
                padding: "16px 24px 8px",
              },
              "& .MuiDialogContent-root": {
                padding: "8px 24px",
              },
              "& .MuiDialogActions-root": {
                padding: "16px 24px",
                justifyContent: "center",
                gap: "16px",
              },
            }}
          >
            <DialogTitle
              sx={{
                color: "white",
                fontSize: "18px",
                fontWeight: "500",
              }}
            >
              Delete Playlist?
            </DialogTitle>
            <DialogActions>
              <Button
                onClick={() => {
                  setOpenDeleteDialog(false);
                  setIsDialogOpen(false);
                }}
                sx={{
                  color: "white",
                  textTransform: "none",
                  fontSize: "16px",
                  padding: "6px 16px",
                  "&:hover": {
                    backgroundColor: "rgba(39, 130, 238, 0.08)",
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                sx={{
                  color: "white",
                  textTransform: "none",
                  fontSize: "16px",
                  padding: "6px 16px",
                  "&:hover": {
                    backgroundColor: "rgba(39, 130, 238, 0.08)",
                  },
                }}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          {/* Share Dialog */}
          <Dialog
            open={openShareDialog}
            onClose={() => {
              setOpenShareDialog(false);
              setIsDialogOpen(false);
            }}
            sx={{
              "& .MuiDialog-paper": {
                width: "300px !important", // Reduced width
                minHeight: "150px !important",
                borderRadius: "16px",
                backgroundColor: "#100F32",
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
              Share Playlist
            </DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                value={shareableLink}
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  backgroundColor: "white",
                  borderRadius: "4px",
                  width: "240px !important",
                  height: "50.5px !important",
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
                    textOverflow: " ellipsis !important",
                  },
                }}
              />
            </DialogContent>
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
        </Box>
      </Box>
    </Box>
  );
};

export default PlayLists;
