import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import home from "./assets/home.png";
import add from "./assets/Add.png";
import favorite from "./assets/loved_tracks1.png";
import history from "./assets/history.png";
import playlist from "./assets/Playlists.png";
import refer from "./assets/refer.png";
import logo from "./assets/new-logo.png";
import explore from "./assets/explore.png";
import upload from "./assets/upload.png";
import admin from "./assets/admin.png";
import "./SideBar.css";
import Refer from "./Refer";
import folder from "./assets/folder.png";
import coverpage from "./assets/coverpage1.jpeg";
import bannerImage1 from "./assets/RectangleBannerImage.png";
import menuIcon from "./assets/menu.png";

const usePlaylistManager = (userId) => {
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshPlaylists = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `https://67avbampgi.execute-api.ap-south-1.amazonaws.com/voiz/playlist/list?user_id=${userId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const playlistsData = data.playlists || [];

      const playlistsWithDetails = await Promise.all(
        playlistsData.map(async (playlist) => {
          const { coverUrl, songCount } = await fetchPlaylistSongs(
            playlist.playlist_id?.S
          );

          return {
            id: playlist.playlist_id?.S,
            name: playlist.playlistName?.S,
            songCount: songCount,
            coverUrl: coverUrl,
          };
        })
      );

      setPlaylists(playlistsWithDetails);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      setPlaylists([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlaylistSongs = async (playlistId, songIds) => {
    try {
      const response = await fetch(
        `https://67avbampgi.execute-api.ap-south-1.amazonaws.com/voiz/playlist/songList?playlist_id=${playlistId}`
      );
      if (!response.ok) throw new Error("Failed to fetch playlist songs");
      const data = await response.json();

      return {
        coverUrl: data.songDetails?.[0]?.coverPageUrl || bannerImage1,
        songCount: data.songDetails?.length || 0,
      };
    } catch (error) {
      console.error("Error fetching playlist songs:", error);
      return {
        coverUrl: bannerImage1,
        songCount: 0,
      };
    }
  };

  const handlePlaylistRename = (playlistId, newName) => {
    setPlaylists((prevPlaylists) =>
      prevPlaylists.map((playlist) =>
        playlist.id === playlistId ? { ...playlist, name: newName } : playlist
      )
    );
  };

  const handlePlaylistDelete = (playlistId) => {
    setPlaylists((prevPlaylists) =>
      prevPlaylists.filter((playlist) => playlist.id !== playlistId)
    );
  };

  const fetchPlaylists = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `https://67avbampgi.execute-api.ap-south-1.amazonaws.com/voiz/playlist/list?user_id=${userId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const playlistsData = data.playlists || [];

      const playlistsWithDetails = await Promise.all(
        playlistsData.map(async (playlist) => {
          const { coverUrl, songCount } = await fetchPlaylistSongs(
            playlist.playlist_id?.S
          );

          return {
            id: playlist.playlist_id?.S,
            name: playlist.playlistName?.S,
            songCount: songCount,
            coverUrl: coverUrl,
          };
        })
      );

      setPlaylists(playlistsWithDetails);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      setPlaylists([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addNewPlaylist = async (newPlaylist) => {
    setPlaylists((prev) => {
      // Check if playlist already exists
      const exists = prev.some(
        (p) => p.id === (newPlaylist.playlist_id?.S || newPlaylist.playlist_id)
      );
      if (exists) return prev;

      const processedPlaylist = {
        id: newPlaylist.playlist_id?.S || newPlaylist.playlist_id,
        name: newPlaylist.playlistName?.S || newPlaylist.playlistName,
        songCount: Array.isArray(newPlaylist.songIds)
          ? newPlaylist.songIds.length
          : 0,
        coverUrl: bannerImage1,
      };
      return [...prev, processedPlaylist];
    });
  };

  const updatePlaylistSongCount = (playlistId, increment = true) => {
    setPlaylists((prevPlaylists) =>
      prevPlaylists.map((playlist) => {
        if (playlist.id === playlistId) {
          const newCount = increment
            ? playlist.songCount + 1
            : Math.max(0, playlist.songCount - 1);
          return {
            ...playlist,
            songCount: newCount,
          };
        }
        return playlist;
      })
    );
  };

  useEffect(() => {
    const handleNewPlaylist = async (event) => {
      if (event.detail) {
        await refreshPlaylists();
      }
    };

    const handlePlaylistUpdate = async (event) => {
      if (event.detail && event.detail.playlistId) {
        // Immediately update the count
        await refreshPlaylists();

        // Then refresh to sync with backend
        refreshPlaylists();
      }
    };

    refreshPlaylists();

    window.addEventListener("newPlaylistCreated", handleNewPlaylist);
    window.addEventListener("playlistSongAdded", handlePlaylistUpdate);
    window.addEventListener("playlistSongRemoved", handlePlaylistUpdate);
    window.addEventListener("playlistRenamed", handlePlaylistUpdate);
    window.addEventListener("playlistDeleted", handlePlaylistUpdate);

    return () => {
      window.removeEventListener("newPlaylistCreated", handleNewPlaylist);
      window.removeEventListener("playlistSongAdded", handlePlaylistUpdate);
      window.removeEventListener("playlistSongRemoved", handlePlaylistUpdate);
      window.removeEventListener("playlistRenamed", handlePlaylistUpdate);
      window.removeEventListener("playlistDeleted", handlePlaylistUpdate);
    };
  }, [userId]);

  return {
    playlists,
    isLoading,
    addNewPlaylist,
    updatePlaylistSongCount,
    handlePlaylistRename,
    handlePlaylistDelete,
  };
};

export default function SideBar() {
  const navigate = useNavigate();
  const drawerWidth = 200;
  const [category, setCategory] = useState(null);
  const [activeSubMenu, setActiveSubMenu] = useState("home");
  const [referVisible, setReferVisible] = useState(false);

  const userId = localStorage.getItem("user_id");

  const {
    playlists,
    isLoading,
    addNewPlaylist,
    updatePlaylistSongCount,
    handlePlaylistRename,
    handlePlaylistDelete,
  } = usePlaylistManager(userId);

  const formatDisplayText = (text) => {
    if (!text) return "";
    return text
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const menuItems = [
    {
      icon: (
        <img
          src={logo}
          alt="home"
          style={{ width: "140px", height: "100px" }}
        />
      ),
      path: "/homepage",
    },
    {
      text: "Explore",
      icon: (
        <img
          src={explore}
          alt="explore"
          style={{ width: "35px", height: "35px" }}
        />
      ),
      path: "/explore",
    },
    {
      text: "Loved Tracks",
      icon: (
        <img
          src={favorite}
          alt="loved tracks"
          style={{ width: "30px", height: "30px" }}
        />
      ),
      path: "/lovedtracks",
    },
    {
      text: "History",
      icon: (
        <img
          src={history}
          alt="history"
          style={{ width: "35px", height: "35px" }}
        />
      ),
      path: "/history",
    },
    {
      text: "Playlists",
      icon: (
        <img
          src={playlist}
          alt="playlists"
          style={{ width: "30px", height: "30px" }}
        />
      ),
      path: "/playlists",
    },
    {
      text: "Refer",
      icon: (
        <img
          src={refer}
          alt="refer"
          style={{ width: "35px", height: "35px" }}
        />
      ),
    },
  ];

  useEffect(() => {
    const handleNewPlaylist = (event) => {
      if (event.detail) {
        addNewPlaylist(event.detail);
      }
    };

    const handleSongAdded = (event) => {
      if (event.detail && event.detail.playlistId) {
        updatePlaylistSongCount(event.detail.playlistId, true);
      }
    };

    const handleSongRemoved = (event) => {
      if (event.detail && event.detail.playlistId) {
        updatePlaylistSongCount(event.detail.playlistId, false);
      }
    };

    const handlePlaylistRenamed = (event) => {
      if (event.detail && event.detail.playlistId) {
        handlePlaylistRename(event.detail.playlistId, event.detail.newName);
      }
    };

    const handlePlaylistDeleted = (event) => {
      if (event.detail && event.detail.playlistId) {
        handlePlaylistDelete(event.detail.playlistId);
      }
    };

    window.addEventListener("newPlaylistCreated", handleNewPlaylist);
    window.addEventListener("playlistSongAdded", handleSongAdded);
    window.addEventListener("playlistSongRemoved", handleSongRemoved);
    window.addEventListener("playlistRenamed", handlePlaylistRenamed);
    window.addEventListener("playlistDeleted", handlePlaylistDeleted);

    return () => {
      window.removeEventListener("newPlaylistCreated", handleNewPlaylist);
      window.removeEventListener("playlistSongAdded", handleSongAdded);
      window.removeEventListener("playlistSongRemoved", handleSongRemoved);
      window.removeEventListener("playlistRenamed", handlePlaylistRenamed);
      window.removeEventListener("playlistDeleted", handlePlaylistDeleted);
    };
  }, [
    addNewPlaylist,
    updatePlaylistSongCount,
    handlePlaylistRename,
    handlePlaylistDelete,
  ]);

  useEffect(() => {
    const storedCategory = localStorage.getItem("Category");
    setCategory(storedCategory);
    const storedSubMenu = localStorage.getItem("ActiveSubMenu");
    if (storedSubMenu) setActiveSubMenu(storedSubMenu);
  }, []);

  const handleSubMenuToggle = (menu) => {
    navigate("/homepage");
    setActiveSubMenu(menu);
    localStorage.setItem("ActiveSubMenu", menu);
  };

  const handleMenuClick = (item) => {
    if (item.text === "Refer") {
      setReferVisible(true);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <Box className="drawer" sx={{ fontFamily: "Poppins" }}>
      <Box>
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              backgroundColor: "#041f46",
              fontFamily: "Poppins",
              boxShadow: "4px 0 8px -2px #151415",
            },
          }}
          variant="permanent"
          anchor="left"
        >
          {category === "Listener" && (
            <>
              <List sx={{ fontFamily: "Poppins" }}>
                {menuItems.map((item) => (
                  <ListItem key={item.text || "logo"} disablePadding>
                    <ListItemButton
                      onClick={() => handleMenuClick(item)}
                      disabled={!item.path && item.text !== "Refer"}
                      sx={{ fontFamily: "Poppins" }}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body1"
                            sx={{
                              fontFamily: "Poppins",
                              fontSize: "18px",
                              color: "white !important",
                              pl: 1,
                            }}
                          >
                            {item.text}
                          </Typography>
                        }
                        sx={{
                          color: "white !important",
                          "& .MuiTypography-root": {
                            color: "white !important",
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>

              {/* Divider for Listener's playlists */}
              <Box
                sx={{
                  width: "140px !important",
                  borderTop: "4px solid white",
                  borderRadius: "10px",
                  marginLeft: "10px",
                  my: 2,
                }}
              />

              {/* Playlists section for Listener */}
              <Box
                sx={{
                  maxHeight: "130px",
                  overflowY: "auto",
                  minHeight: "50px !important",
                  "&::-webkit-scrollbar": {
                    width: "6px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "3px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: "rgba(255, 255, 255, 0.3)",
                    borderRadius: "3px",
                    "&:hover": {
                      background: "rgba(255, 255, 255, 0.4)",
                    },
                  },
                }}
              >
                {isLoading ? (
                  <Typography sx={{ color: "rgba(255, 255, 255, 0.7)", pl: 2 }}>
                    Loading playlists...
                  </Typography>
                ) : playlists.length === 0 ? (
                  <Typography sx={{ color: "rgba(255, 255, 255, 0.7)", pl: 2 }}>
                    No playlists found
                  </Typography>
                ) : (
                  playlists.map((userPlaylist) => (
                    <ListItemButton
                      key={userPlaylist.id}
                      onClick={() => {
                        navigate(`/playlist/${userPlaylist.id}`, {
                          state: {
                            playlistId: userPlaylist.id,
                            playlistName: formatDisplayText(userPlaylist.name),
                            fetchPlaylist: true,
                          },
                        });
                      }}
                      sx={{
                        padding: "8px 0",
                        "&:hover": {
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <Box
                          sx={{
                            width: "48px",
                            height: "48px",
                            backgroundColor: "#2A2A2A",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                          }}
                        >
                          <img
                            src={userPlaylist.coverUrl}
                            alt={formatDisplayText(userPlaylist.name)}
                            style={{
                              width: "50px",
                              position: "absolute",
                              height: "45px",
                              marginTop: "-10px",
                              objectFit: "cover",

                              marginRight: "2px",
                              borderRadius: "4px",
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
                              width: "70px",
                              height: "55px",
                              marginRight: "5px",
                              zIndex: 1,
                            }}
                          />
                        </Box>
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{
                              color: "white",
                              fontSize: "14px !important",
                              fontFamily: "Poppins !important",
                              fontWeight: "500 !important",
                            }}
                          >
                            {formatDisplayText(userPlaylist.name)}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "rgba(255, 255, 255, 0.7)",
                              fontSize: "12px",
                              fontFamily: "Poppins",
                              color: "grey !important",
                            }}
                          >
                            {userPlaylist.songCount} songs
                          </Typography>
                        </Box>
                      </Box>
                    </ListItemButton>
                  ))
                )}
              </Box>
            </>
          )}

          {/* Singer/Admin Header */}
          {(category === "Singer" || category === "Admin") && (
            <Box
              sx={{
                textAlign: "center",
                marginBottom: 3,
                fontFamily: "Poppins",
              }}
            >
              <Box sx={{ margin: "10px 0" }}>
                <img
                  src={logo}
                  alt="logo"
                  style={{ width: "60%", height: "60%" }}
                />
              </Box>
              <Box
                sx={{
                  marginTop: 2,
                  display: "flex",
                  justifyContent: "center",
                  fontFamily: "Poppins",
                }}
              >
                <Button
                  onClick={() => handleSubMenuToggle("home")}
                  sx={{
                    color: "white",
                    backgroundColor:
                      activeSubMenu === "home" ? "#908f8f" : "transparent",
                    textTransform: "none",
                    borderRadius: "22px",
                    fontSize: "18px",
                    paddingLeft: 2,
                    paddingRight: 2,
                    fontFamily: "Poppins",
                  }}
                >
                  Home
                </Button>
                <Button
                  onClick={() => handleSubMenuToggle("library")}
                  sx={{
                    color: "white",
                    backgroundColor:
                      activeSubMenu === "library" ? "#908f8f" : "transparent",
                    textTransform: "none",
                    borderRadius: "22px",
                    fontSize: "18px",
                    paddingLeft: 2,
                    paddingRight: 2,
                    fontFamily: "Poppins",
                  }}
                >
                  Library
                </Button>
              </Box>
            </Box>
          )}

          {/* Home Submenu */}
          {(category === "Singer" || category === "Admin") &&
            activeSubMenu === "home" && (
              <Box sx={{ paddingLeft: 1.1, fontFamily: "Poppins" }}>
                <ListItemButton
                  onClick={() => navigate("/explore")}
                  sx={{ gap: 1 }}
                >
                  <ListItemIcon>
                    <img
                      src={explore}
                      alt="explore"
                      style={{ width: "35px", height: "35px" }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        className="your-uploads-text"
                        sx={{
                          fontFamily: "Poppins",
                          fontSize: "18px",
                          color: "white !important",
                        }}
                      >
                        Explore
                      </Typography>
                    }
                    sx={{ color: "white !important" }}
                  />
                </ListItemButton>
                <ListItemButton
                  onClick={() => navigate("/addsong")}
                  sx={{ gap: 1 }}
                >
                  <ListItemIcon>
                    <img
                      src={add}
                      alt="addSong"
                      style={{ width: "32px", height: "32px" }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        sx={{ fontFamily: "Poppins", fontSize: "18px" }}
                        className="your-uploads-text"
                      >
                        Add Song
                      </Typography>
                    }
                    sx={{ color: "white" }}
                  />
                </ListItemButton>
                <ListItemButton
                  onClick={() => navigate("/youruploads")}
                  sx={{ gap: 1 }}
                >
                  <ListItemIcon>
                    <img
                      src={upload}
                      alt="upload"
                      style={{ width: "35px", height: "35px" }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        className="your-uploads-text"
                        sx={{ fontFamily: "Poppins", fontSize: "18px" }}
                      >
                        Your Uploads
                      </Typography>
                    }
                    sx={{ color: "white" }}
                  />
                </ListItemButton>
                <ListItemButton
                  onClick={() => setReferVisible(true)}
                  sx={{ gap: 1 }}
                >
                  <ListItemIcon>
                    <img
                      src={refer}
                      alt="refer"
                      style={{ width: "35px", height: "35px" }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        sx={{ fontFamily: "Poppins", fontSize: "18px" }}
                        className="your-uploads-text"
                      >
                        Refer
                      </Typography>
                    }
                    sx={{ color: "white" }}
                  />
                </ListItemButton>
                {category === "Admin" && (
                  <ListItemButton onClick={() => navigate("/adminpage")}>
                    <ListItemIcon>
                      <img
                        src={admin}
                        alt="admin"
                        style={{ width: "30px", height: "30px" }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body1"
                          sx={{
                            fontFamily: "Poppins",
                            fontSize: "18px",
                            color: "white !important",
                            pl: 1,
                          }}
                        >
                          Admin
                        </Typography>
                      }
                      sx={{
                        color: "white !important",
                        "& .MuiTypography-root": {
                          color: "white !important",
                        },
                      }}
                    />
                  </ListItemButton>
                )}

                {/* Divider */}
                <Box
                  sx={{
                    width: "140px !important",
                    borderTop: "4px solid white",
                    borderRadius: "10px",
                    marginLeft: "10px",
                    my: 2,
                  }}
                />

                {/* Playlists Section with Scrollbar */}
                <Box
                  sx={{
                    maxHeight: "170px !important",
                    overflowY: "scroll",
                    "&::-webkit-scrollbar": {
                      width: "13px",
                      
                     
                    },
                    "&::-webkit-scrollbar-track": {
                      backgroundColor: "transparent",
                      // marginTop: "20px",      // 👈 shortens top of the track
                      // marginBottom: "30px",
                      borderRadius: "2px"
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "#e0e0e0",
                      borderRadius: "10px",
                      minHeight: "15%",
                      paddingX: "10px",
                      
                      /* 👇 Use your icon here */
                      backgroundImage: `url(${menuIcon})` , //"url('/menu.png')",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                      backgroundSize: "12px", // Adjust size as needed
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                      backgroundColor: "#ccc",
                    },
                    // overflowY: "auto",
                    // "&::-webkit-scrollbar": {
                    //   width: "6px",
                    // },
                    // "&::-webkit-scrollbar-track": {
                    //   background: "rgba(255, 255, 255, 0.1)",
                    //   borderRadius: "3px",
                    // },
                    // "&::-webkit-scrollbar-thumb": {
                    //   background: "rgba(255, 255, 255, 0.3)",
                    //   borderRadius: "3px",
                    //   "&:hover": {
                    //     background: "rgba(255, 255, 255, 0.4)",
                    //   },
                    // },
                  }}
                >
                  {isLoading ? (
                    <Typography
                      sx={{ color: "rgba(255, 255, 255, 0.7)", pl: 2 }}
                    >
                      Loading playlists...
                    </Typography>
                  ) : playlists.length === 0 ? (
                    <Typography
                      sx={{ color: "rgba(255, 255, 255, 0.7)", pl: 2 }}
                    >
                      No playlists found
                    </Typography>
                  ) : (
                    playlists.map((userPlaylist) => (
                      <ListItemButton
                        key={userPlaylist.id}
                        onClick={() => {
                          navigate(`/playlist/${userPlaylist.id}`, {
                            state: {
                              playlistId: userPlaylist.id,
                              playlistName: formatDisplayText(
                                userPlaylist.name
                              ),
                              fetchPlaylist: true,
                            },
                          });
                        }}
                        sx={{
                          padding: "8px 0",
                          "&:hover": {
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <Box
                            sx={{
                              width: "48px",
                              height: "48px",
                              backgroundColor: "#2A2A2A",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                            }}
                          >
                            <img
                              src={userPlaylist.coverUrl}
                              alt={formatDisplayText(userPlaylist.name)}
                              style={{
                                width: "50px",
                                position: "absolute",
                                height: "45px",
                                marginTop: "-10px",
                                objectFit: "cover",
                                marginRight: "2px",
                                borderRadius: "4px",
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
                                width: "70px",
                                height: "55px",
                                marginRight: "5px",
                                zIndex: 1,
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography
                              variant="body1"
                              sx={{
                                color: "white",
                                fontSize: "14px !important",
                                fontFamily: "Poppins !important",
                                fontWeight: "500 !important",
                              }}
                            >
                              {formatDisplayText(userPlaylist.name)}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "rgba(255, 255, 255, 0.7)",
                                fontSize: "12px",
                                fontFamily: "Poppins",
                                color: "grey !important",
                              }}
                            >
                              {userPlaylist.songCount} songs
                            </Typography>
                          </Box>
                        </Box>
                      </ListItemButton>
                    ))
                  )}
                </Box>
              </Box>
            )}
          {/* Library Submenu - Visible for both Singer and Admin */}
          {(category === "Singer" || category === "Admin") &&
            activeSubMenu === "library" && (
              <Box sx={{ paddingLeft: 1.2, fontFamily: "Poppins" }}>
                <ListItemButton
                  onClick={() => navigate("/playlists")}
                  sx={{ gap: 1 }}
                >
                  <ListItemIcon>
                    <img
                      src={playlist}
                      alt="playlist"
                      style={{ width: "30px", height: "30px" }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        sx={{ fontFamily: "Poppins", fontSize: "18px" }}
                        className="your-uploads-text"
                      >
                        Playlists
                      </Typography>
                    }
                    sx={{ color: "white" }}
                  />
                </ListItemButton>

                <ListItemButton
                  onClick={() => navigate("/lovedtracks")}
                  sx={{ gap: 1 }}
                >
                  <ListItemIcon>
                    <img
                      src={favorite}
                      alt="lovedtracks"
                      style={{ width: "30px", height: "30px" }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        sx={{ fontFamily: "Poppins", fontSize: "18px" }}
                        className="your-uploads-text"
                      >
                        Loved Tracks
                      </Typography>
                    }
                    sx={{ color: "white" }}
                  />
                </ListItemButton>

                <ListItemButton
                  onClick={() => navigate("/history")}
                  sx={{ gap: 1 }}
                >
                  <ListItemIcon>
                    <img
                      src={history}
                      alt="history"
                      style={{ width: "35px", height: "35px" }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        sx={{ fontFamily: "Poppins", fontSize: "18px" }}
                        className="your-uploads-text"
                      >
                        History
                      </Typography>
                    }
                    sx={{ color: "white" }}
                  />
                </ListItemButton>

                {/* Divider */}
                <Box
                  sx={{
                    width: "140px !important",
                    borderTop: "4px solid white",
                    borderRadius: "10px",
                    marginLeft: "10px",
                    my: 2,
                  }}
                />

                {/* Playlists Section with Scrollbar */}
                <Box
                  sx={{
                    maxHeight: "220px",
                    overflowY: "auto",
                    // "&::-webkit-scrollbar": {
                    //   width: "6px",
                    // },
                    // "&::-webkit-scrollbar-track": {
                    //   background: "rgba(255, 255, 255, 0.1)",
                    //   borderRadius: "3px",
                    // },
                    // "&::-webkit-scrollbar-thumb": {
                    //   background: "rgba(255, 255, 255, 0.3)",
                    //   borderRadius: "3px",
                    //   "&:hover": {
                    //     background: "rgba(255, 255, 255, 0.4)",
                    //   },
                    // },
                    
                    "&::-webkit-scrollbar": {
                      width: "14px",
                      height: "30%"
                    },
                    "&::-webkit-scrollbar-track": {
                      backgroundColor: "transparent",
                      marginTop: "20px",      // 👈 shortens top of the track
                      marginBottom: "20px",
                      borderRadius: "2px"
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "#e0e0e0",
                      borderRadius: "10px",
                      minHeight: "15%",
                      paddingX: "10px",
                      
                      /* 👇 Use your icon here */
                      backgroundImage: `url(${menuIcon})`, // "url('/menu.png')",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                      backgroundSize: "12px", // Adjust size as needed
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                      backgroundColor: "#ccc",
                    },
                  }}
                >
                  {isLoading ? (
                    <Typography
                      sx={{ color: "rgba(255, 255, 255, 0.7)", pl: 2 }}
                    >
                      Loading playlists...
                    </Typography>
                  ) : playlists.length === 0 ? (
                    <Typography
                      sx={{ color: "rgba(255, 255, 255, 0.7)", pl: 2 }}
                    >
                      No playlists found
                    </Typography>
                  ) : (
                    playlists.map((userPlaylist) => (
                      <ListItemButton
                        key={userPlaylist.id}
                        onClick={() => {
                          navigate(`/playlist/${userPlaylist.id}`, {
                            state: {
                              playlistId: userPlaylist.id,
                              playlistName: formatDisplayText(
                                userPlaylist.name
                              ),
                              fetchPlaylist: true,
                            },
                          });
                        }}
                        sx={{
                          padding: "8px 0",
                          "&:hover": {
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <Box
                            sx={{
                              width: "48px",
                              height: "48px",
                              backgroundColor: "#2A2A2A",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                            }}
                          >
                            <img
                              src={userPlaylist.coverUrl}
                              alt={formatDisplayText(userPlaylist.name)}
                              style={{
                                width: "50px",
                                position: "absolute",
                                height: "45px",
                                marginTop: "-10px",
                                objectFit: "cover",

                                marginRight: "2px",
                                borderRadius: "4px",
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
                                width: "70px",
                                height: "55px",
                                marginRight: "5px",
                                zIndex: 1,
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography
                              variant="body1"
                              sx={{
                                color: "white",
                                fontSize: "14px !important",
                                fontFamily: "Poppins !important",
                                fontWeight: "500 !important",
                              }}
                            >
                              {formatDisplayText(userPlaylist.name)}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "rgba(255, 255, 255, 0.7)",
                                fontSize: "12px",
                                fontFamily: "Poppins",
                                color: "grey !important",
                              }}
                            >
                              {userPlaylist.songCount} songs
                            </Typography>
                          </Box>
                        </Box>
                      </ListItemButton>
                    ))
                  )}
                </Box>
              </Box>
            )}
        </Drawer>
      </Box>

      <Refer open={referVisible} onClose={() => setReferVisible(false)} />
    </Box>
  );
}
