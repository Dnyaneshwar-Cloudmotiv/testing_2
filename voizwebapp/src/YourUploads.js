
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Card from "@mui/material/Card";
import TabContext from "@mui/lab/TabContext";
import { Typography, Select, MenuItem, FormControl, Button, IconButton } from "@mui/material";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Amplify } from "aws-amplify";
import "./YourUploads.css";
import SideBar from "./SideBar";
import coverpage from "./assets/mic.jpg";
import awsExports from "./aws-exports";
import ApprovedGraph from "./assets/VectorApproveGraph.png";
import FavoriteIcon from "./assets/loved_tracks1.png";
import Reaction from "./assets/reaction_empty.png";
import SortIcon from "@mui/icons-material/Sort";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import menuIcon from "./assets/menu.png"; // Importing the menu icon for scrollbar

Amplify.configure(awsExports);

export default function YourUploads() {
  const [value, setValue] = useState("1");
  const [songs, setSongs] = useState([]);
  const [displayedSongs, setDisplayedSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [displayedAlbums, setDisplayedAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [songStats, setSongStats] = useState(null);
  const [selectRejectSong, setSelectRejectSong] = useState(null);
  const [rejectReason, setRejectReason] = useState(null);
  const navigate = useNavigate();
  const [isMiniPlayerActive, setIsMiniPlayerActive] = useState(false);
  const [sortOption, setSortOption] = useState("all");
  const [songDetails, setSongDetails] = useState(null);
  const [songsWithPlayCounts, setSongsWithPlayCounts] = useState({});
  const [fetchingPlayCounts, setFetchingPlayCounts] = useState(false);
  const user_id = localStorage.getItem("user_id");
  const [abortController, setAbortController] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [lastMetricsUpdate, setLastMetricsUpdate] = useState(Date.now());
  const [ListHeight, Setlistheight] = useState(true);
  const [singleSongs, setSingleSongs] = useState([]);
  const [displayedSingleSongs, setDisplayedSingleSongs] = useState([]);
  const [combinedItems, setCombinedItems] = useState([]);

  useEffect(() => {
    if (!selectedSong) return;

    const handlePlayCountUpdate = () => {
      const playCountUpdate = sessionStorage.getItem("playCountUpdate");

      if (playCountUpdate) {
        const updateData = JSON.parse(playCountUpdate);

        if (updateData.songId === selectedSong.song_id) {
          setSongStats((prev) => ({
            ...prev,
            playCount: (prev.playCount || 0) + 1,
          }));

          sessionStorage.removeItem("playCountUpdate");
        }
      }
    };

    const interval = setInterval(() => {
      handlePlayCountUpdate();
    }, 100);

    handlePlayCountUpdate();

    return () => {
      clearInterval(interval);
    };
  }, [selectedSong]);

  useEffect(() => {
    const checkMiniPlayerStatus = () => {
      const currentSong = localStorage.getItem("currentSong");
      setIsMiniPlayerActive(!!currentSong);
    };
    checkMiniPlayerStatus();
  }, []);

  const handleChange = (event, newValue) => {
    Setlistheight(true);
    setValue(newValue);
    setSelectRejectSong(null);
    setSelectedSong(null);
    setSortOption("all");
    setSongsWithPlayCounts({});

    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }

    filterSongsByDecision(newValue, singleSongs);
    filterAlbumsByDecision(newValue);
    updateCombinedItems(newValue);
  };

  const fetchAllSongsPlayCounts = async (songsToFetch) => {
    if (fetchingPlayCounts || !songsToFetch || songsToFetch.length === 0) return;

    setFetchingPlayCounts(true);

    try {
      const playCountsObj = {};

      await Promise.all(
        songsToFetch.map(async (song) => {
          try {
            const response = await fetch(
              `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/song/counts?song_id=${song.song_id}`
            );

            if (response.ok) {
              const stats = await response.json();
              playCountsObj[song.song_id] = parseInt(stats.playCount) || 0;
            } else {
              playCountsObj[song.song_id] = 0;
            }
          } catch (error) {
            console.error(`Error fetching play count for song ${song.song_id}:`, error);
            playCountsObj[song.song_id] = 0;
          }
        })
      );

      setSongsWithPlayCounts(playCountsObj);

      if (sortOption === "streams-asc" || sortOption === "streams-desc") {
        handleSortChange({ target: { value: sortOption } });
      }
    } catch (error) {
      console.error("Error fetching all song play counts:", error);
    } finally {
      setFetchingPlayCounts(false);
    }
  };

  const fetchData = async () => {
    if (abortController) {
      abortController.abort();
    }

    const newAbortController = new AbortController();
    setAbortController(newAbortController);

    setLoading(true);
    setError(null);
    setSongs([]);
    setDisplayedSongs([]);
    setSingleSongs([]);
    setDisplayedSingleSongs([]);
    setAlbums([]);
    setDisplayedAlbums([]);
    setCombinedItems([]);

    try {
      console.log("Fetching all songs for user_id:", user_id);
      const songResponse = await fetch(
        `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/approverList?user_id=${user_id}`,
        {
          signal: newAbortController.signal,
        }
      );

      if (!songResponse.ok) {
        throw new Error("Network response was not ok for songs");
      }

      const songData = await songResponse.json();
      console.log("Songs API Response:", songData);

      let formattedSongs = [];
      if (typeof songData === "string") {
        console.log("Song response is a string:", songData);
        setSongs([]);
        setDisplayedSongs([]);
        setSingleSongs([]);
        setDisplayedSingleSongs([]);
      } else if (Array.isArray(songData)) {
        formattedSongs = songData.map((song) => ({
          ...song,
          coverPageUrl: song.coverPageUrl
            ? `${song.coverPageUrl}?t=${new Date().getTime()}`
            : null,
        }));
        setSongs(formattedSongs);
      } else {
        throw new Error("Unexpected song response format");
      }

      console.log("Fetching all albums for user_id:", user_id);
      const albumResponse = await fetch(
        `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/userAlbums?user_id=${user_id}`,
        {
          signal: newAbortController.signal,
        }
      );

      if (!albumResponse.ok) {
        throw new Error("Network response was not ok for albums");
      }

      const albumData = await albumResponse.json();
      console.log("Albums API Response:", albumData);

      let formattedAlbums = [];
      if (albumData && typeof albumData === "object") {
        const albumsArray = Array.isArray(albumData.data) ? albumData.data :
                          Array.isArray(albumData.albums) ? albumData.albums :
                          Array.isArray(albumData) ? albumData : [];

        formattedAlbums = albumsArray.map((album) => ({
          ...album,
          coverPageUrl: album.albumCoverUrl
            ? `${album.albumCoverUrl}?t=${new Date().getTime()}`
            : null,
          decision: album.decision || "Pending",
          albumName: album.albumName || "Untitled Album",
          songCount: album.songCount || (Array.isArray(album.songs) ? album.songs.length : 0),
          songs: Array.isArray(album.songs) ? album.songs.map((song) => ({
            ...song,
            coverPageUrl: song.coverPageUrl
              ? `${song.coverPageUrl}?t=${new Date().getTime()}`
              : null,
            decision: song.decision || "Pending",
          })) : [],
        }));

        setAlbums(formattedAlbums);
        filterAlbumsByDecision(value, formattedAlbums);
      } else {
        console.log("No albums found in response");
        setAlbums([]);
        setDisplayedAlbums([]);
      }

      const albumSongIds = new Set();
      formattedAlbums.forEach((album) => {
        album.songs.forEach((song) => {
          if (song.song_id) {
            albumSongIds.add(song.song_id);
          }
        });
      });

      const filteredSingleSongs = formattedSongs.filter(
        (song) => !albumSongIds.has(song.song_id)
      );
      setSingleSongs(filteredSingleSongs);
      filterSongsByDecision(value, filteredSingleSongs);
      updateCombinedItems(value, formattedAlbums, filteredSingleSongs);
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Fetch request was cancelled.");
      } else {
        setError(error.message || "Failed to fetch data.");
      }
    } finally {
      setLoading(false);
    }
  };

  const filterAlbumsByDecision = (tabValue, allAlbums = albums) => {
    let filteredAlbums = [];
    if (tabValue === "1") {
      filteredAlbums = allAlbums.filter((album) =>
        album.songs.some((song) => song.decision === "Pending")
      );
    }
    if (tabValue === "2") {
      filteredAlbums = allAlbums.filter((album) =>
        album.songs.some((song) => song.decision === "Approved")
      );
    }
    if (tabValue === "3") {
      filteredAlbums = allAlbums.filter((album) =>
        album.songs.some((song) => song.decision === "Rejected")
      );
    }

    setDisplayedAlbums(filteredAlbums);
  };

  const filterSongsByDecision = (tabValue, allSongs = singleSongs) => {
    let filteredSongs = [];
    if (tabValue === "1") filteredSongs = allSongs.filter((song) => song.decision === "Pending");
    if (tabValue === "2") filteredSongs = allSongs.filter((song) => song.decision === "Approved");
    if (tabValue === "3") filteredSongs = allSongs.filter((song) => song.decision === "Rejected");

    setDisplayedSingleSongs(filteredSongs);
    if (tabValue === "2") {
      fetchAllSongsPlayCounts(filteredSongs);
    }
  };

  const updateCombinedItems = (tabValue, allAlbums = albums, allSongs = singleSongs) => {
    let filteredAlbums = [];
    let filteredSongs = [];
    const decisionMap = {
      "1": "Pending",
      "2": "Approved",
      "3": "Rejected",
    };
    const currentDecision = decisionMap[tabValue];

    if (tabValue === "2") {
      filteredAlbums = allAlbums.filter((album) =>
        album.songs.some((song) => song.decision === "Approved")
      );
      filteredSongs = allSongs.filter((song) => song.decision === "Approved");
    } else if (tabValue === "3") {
      filteredAlbums = allAlbums.filter((album) =>
        album.songs.some((song) => song.decision === "Rejected")
      );
      filteredSongs = allSongs.filter((song) => song.decision === "Rejected");
    }

    const combined = [
      ...filteredAlbums.map((album) => ({
        ...album,
        type: "album",
        matchingSongCount: album.songs.filter((song) => song.decision === currentDecision).length,
      })),
      ...filteredSongs.map((song) => ({ ...song, type: "song" })),
    ];

    setCombinedItems(combined);
  };

  const handleSortChange = (event) => {
    const selectedOption = event.target.value;
    setSortOption(selectedOption);

    if (value === "1") {
      const sortedSongs = [...displayedSingleSongs];
      console.log("Before sorting songs by date:", [...sortedSongs]);

      switch (selectedOption) {
        case "date":
          sortedSongs.sort((a, b) => {
            const parseTimestamp = (timestamp) => {
              if (!timestamp) return new Date(0);
              try {
                if (timestamp.includes('_')) {
                  const [datePart, timePart] = timestamp.split('_');
                  const year = datePart.substring(0, 4);
                  const month = datePart.substring(4, 6) - 1;
                  const day = datePart.substring(6, 8);
                  const hour = timePart.substring(0, 2);
                  const minute = timePart.substring(2, 4);
                  const second = timePart.substring(4, 6);
                  return new Date(year, month, day, hour, minute, second);
                } else {
                  return new Date(timestamp);
                }
              } catch (error) {
                console.error("Error parsing timestamp:", timestamp, error);
                return new Date(0);
              }
            };
            const dateA = parseTimestamp(a.updatedTimestamp);
            const dateB = parseTimestamp(b.updatedTimestamp);
            return dateB - dateA;
          });
          break;
        case "a-z":
          sortedSongs.sort((a, b) => {
            const nameA = (a.songName || "").toLowerCase();
            const nameB = (b.songName || "").toLowerCase();
            return nameA.localeCompare(nameB);
          });
          break;
        case "z-a":
          sortedSongs.sort((a, b) => {
            const nameA = (a.songName || "").toLowerCase();
            const nameB = (b.songName || "").toLowerCase();
            return nameB.localeCompare(nameB);
          });
          break;
        case "streams-asc":
          sortedSongs.sort((a, b) => {
            const streamsA = songsWithPlayCounts[a.song_id] || 0;
            const streamsB = songsWithPlayCounts[b.song_id] || 0;
            return streamsA - streamsB;
          });
          break;
        case "streams-desc":
          sortedSongs.sort((a, b) => {
            const streamsA = songsWithPlayCounts[a.song_id] || 0;
            const streamsB = songsWithPlayCounts[b.song_id] || 0;
            return streamsB - streamsA;
          });
          break;
        default:
          break;
      }
      setDisplayedSingleSongs(sortedSongs);

      const sortedAlbums = [...displayedAlbums];
      switch (selectedOption) {
        case "date":
          sortedAlbums.sort((a, b) => {
            const parseTimestamp = (timestamp) => {
              if (!timestamp) return new Date(0);
              try {
                if (timestamp.includes('_')) {
                  const [datePart, timePart] = timestamp.split('_');
                  const year = datePart.substring(0, 4);
                  const month = datePart.substring(4, 6) - 1;
                  const day = datePart.substring(6, 8);
                  const hour = timePart.substring(0, 2);
                  const minute = timePart.substring(2, 4);
                  const second = timePart.substring(4, 6);
                  return new Date(year, month, day, hour, minute, second);
                } else {
                  return new Date(timestamp);
                }
              } catch (error) {
                console.error("Error parsing timestamp:", timestamp, error);
                return new Date(0);
              }
            };
            const dateA = parseTimestamp(a.updatedTimestamp);
            const dateB = parseTimestamp(b.updatedTimestamp);
            return dateB - dateA;
          });
          break;
        case "a-z":
          sortedAlbums.sort((a, b) => {
            const nameA = (a.albumName || "").toLowerCase();
            const nameB = (b.albumName || "").toLowerCase();
            return nameA.localeCompare(nameB);
          });
          break;
        case "z-a":
          sortedAlbums.sort((a, b) => {
            const nameA = (a.albumName || "").toLowerCase();
            const nameB = (b.albumName || "").toLowerCase();
            return nameB.localeCompare(nameA);
          });
          break;
        default:
          break;
      }
      setDisplayedAlbums(sortedAlbums);
    } else {
      const sortedCombined = [...combinedItems];
      switch (selectedOption) {
        case "date":
          sortedCombined.sort((a, b) => {
            const parseTimestamp = (timestamp) => {
              if (!timestamp) return new Date(0);
              try {
                if (timestamp.includes('_')) {
                  const [datePart, timePart] = timestamp.split('_');
                  const year = datePart.substring(0, 4);
                  const month = datePart.substring(4, 6) - 1;
                  const day = datePart.substring(6, 8);
                  const hour = timePart.substring(0, 2);
                  const minute = timePart.substring(2, 4);
                  const second = timePart.substring(4, 6);
                  return new Date(year, month, day, hour, minute, second);
                } else {
                  return new Date(timestamp);
                }
              } catch (error) {
                console.error("Error parsing timestamp:", timestamp, error);
                return new Date(0);
              }
            };
            const dateA = parseTimestamp(a.updatedTimestamp);
            const dateB = parseTimestamp(b.updatedTimestamp);
            return dateB - dateA;
          });
          break;
        case "a-z":
          sortedCombined.sort((a, b) => {
            const nameA = (a.albumName || a.songName || "").toLowerCase();
            const nameB = (b.albumName || b.songName || "").toLowerCase();
            return nameA.localeCompare(nameB);
          });
          break;
        case "z-a":
          sortedCombined.sort((a, b) => {
            const nameA = (a.albumName || a.songName || "").toLowerCase();
            const nameB = (b.albumName || b.songName || "").toLowerCase();
            return nameB.localeCompare(nameA);
          });
          break;
        case "streams-asc":
          sortedCombined.sort((a, b) => {
            const streamsA = a.type === "song" ? (songsWithPlayCounts[a.song_id] || 0) : 0;
            const streamsB = b.type === "song" ? (songsWithPlayCounts[b.song_id] || 0) : 0;
            return streamsA - streamsB;
          });
          break;
        case "streams-desc":
          sortedCombined.sort((a, b) => {
            const streamsA = a.type === "song" ? (songsWithPlayCounts[a.song_id] || 0) : 0;
            const streamsB = b.type === "song" ? (songsWithPlayCounts[b.song_id] || 0) : 0;
            return streamsB - streamsA;
          });
          break;
        default:
          break;
      }
      setCombinedItems(sortedCombined);
    }
  };

  const handleSongClick = async (song) => {
    const isSameSong = selectedSong && selectedSong.song_id === song.song_id;

    if (isSameSong) {
      setSelectedSong(null);
      Setlistheight(true);
      return;
    }

    Setlistheight(false);
    setSelectedSong(song);
    setSelectRejectSong(null);

    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const fetchSongStats = async () => {
      try {
        const response = await fetch(
          `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/song/counts?song_id=${song.song_id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch song statistics");
        }

        const stats = await response.json();

        const formattedStats = {
          favoriteCount: parseInt(stats.favoriteCount) || 0,
          reactionCount: parseInt(stats.reactionCount) || 0,
          playCount: parseInt(stats.playCount) || 0,
          playlistCount: parseInt(stats.playlistCount) || 0,
          shareSongCount: parseInt(stats.shareSongCount) || 0,
        };

        setSongStats(formattedStats);

        setSongsWithPlayCounts((prev) => ({
          ...prev,
          [song.song_id]: formattedStats.playCount,
        }));
      } catch (error) {
        console.error("Error fetching song statistics:", error);
        setSongStats({
          favoriteCount: 0,
          reactionCount: 0,
          playCount: 0,
          playlistCount: 0,
          shareSongCount: 0,
        });
      }
    };

    fetchSongStats();
  };

  const handleRejectedSongClick = async (song) => {
    const isSameSong = selectRejectSong && selectRejectSong.song_id === song.song_id;

    if (isSameSong) {
      setSelectRejectSong(null);
      Setlistheight(true);
      return;
    }

    Setlistheight(false);
    setSelectRejectSong(song);
    console.log("Selected rejected song:", song);

    try {
      const reasonResponse = await fetch(
        `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/song/rejected/reason?workflowId=${song.workflowId}`
      );
      if (!reasonResponse.ok) {
        throw new Error("Failed to fetch rejection reason");
      }
      const reasonData = await reasonResponse.json();
      console.log("Rejection reason data:", reasonData);
      setRejectReason(reasonData);

      try {
        console.log("Fetching song details for song_id:", song.song_id);
        const detailsResponse = await fetch(
          `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/song?song_id=${song.song_id}`
        );
        if (!detailsResponse.ok) {
          throw new Error("Failed to fetch song details");
        }
        const detailsData = await detailsResponse.json();
        console.log("Song details response:", detailsData);
        setSongDetails(detailsData);
      } catch (error) {
        console.error("Error fetching song details:", error);
        setSongDetails(null);
      }
    } catch (error) {
      console.error("Error fetching rejection reason:", error);
      setRejectReason(null);
    }
  };

  const handleAlbumClick = async (album) => {
    navigate(`/album/${album.albumId}`,
      //  { state: { songs: album.songs } });
     {
        state: {
          songs: album.songs,
          defaultTab: value, // Pass the current tab value (e.g., "1", "2", "3")
        },
      });
  };

  const handlePendingSongClick = async () => {
    setSelectRejectSong(null);
    setSelectedSong(null);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      if (abortController) {
        abortController.abort();
      }
    };
  }, [pollingInterval, abortController]);

  useEffect(() => {
    if (!selectedSong) return;

    const handleStorageChange = async (e) => {
      if (e.key === "metricsUpdate") {
        const updateData = JSON.parse(localStorage.getItem("metricsUpdate") || "{}");

        if (updateData.songId === selectedSong.song_id) {
          if (updateData.type === "reaction") {
            setSongStats((prev) => ({
              ...prev,
              reactionCount: prev.reactionCount + (updateData.increment ? 1 : -1),
            }));
          } else if (updateData.type === "favorite") {
            setSongStats((prev) => ({
              ...prev,
              favoriteCount: prev.favoriteCount + (updateData.increment ? 1 : -1),
            }));
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    const interval = setInterval(() => {
      const latestUpdate = localStorage.getItem("metricsUpdate");
      if (latestUpdate) {
        const updateData = JSON.parse(latestUpdate);
        if (updateData.timestamp > lastMetricsUpdate && updateData.songId === selectedSong.song_id) {
          handleStorageChange({ key: "metricsUpdate" });
          setLastMetricsUpdate(updateData.timestamp);
        }
      }
    }, 100);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [selectedSong, lastMetricsUpdate]);

  const getSortMenuItems = () => {
    const baseMenuItems = [
      <MenuItem key="all" value="all" sx={{ fontSize: "16px" }}>
        All Items
      </MenuItem>,
      <MenuItem key="date" value="date" sx={{ fontSize: "16px" }}>
        By Date
      </MenuItem>,
      <MenuItem key="a-z" value="a-z" sx={{ fontSize: "16px" }}>
        A-Z
      </MenuItem>,
      <MenuItem key="z-a" value="z-a" sx={{ fontSize: "16px" }}>
        Z-A
      </MenuItem>,
    ];

    if (value === "2") {
      return [
        ...baseMenuItems,
        <MenuItem key="streams-asc" value="streams-asc" sx={{ fontSize: "16px" }}>
          Streams (Low to High)
        </MenuItem>,
        <MenuItem key="streams-desc" value="streams-desc" sx={{ fontSize: "16px" }}>
          Streams (High to Low)
        </MenuItem>,
      ];
    }

    return baseMenuItems;
  };

  return (
    <Box className="main-wrapper">
      <SideBar />
      <Card
        className="admin-card"
        sx={{
          backgroundColor: "#211f20",
          boxShadow: "none",
          border: "none",
          height: "100vh",
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingRight: 5,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: "white",
              marginTop: 3,
              marginLeft: 5,
              textAlign: "left",
              fontWeight: "bold",
              fontSize: "32px",
            }}
          >
            Your Uploads
          </Typography>
          <FormControl
            variant="outlined"
            size="small"
            sx={{
              height: "40px !important",
              width: "200px !important",
              borderRadius: "20px !important",
              marginRight: "240px !important",
              "& .MuiOutlinedInput-root": {
                color: "white",
                borderColor: "#white !important",
                height: "40px !important",
                width: "200px !important",
                backgroundColor: "#151415 !important",
                borderRadius: "20px !important",
                "& fieldset": {
                  borderColor: "white !important",
                  borderRadius: "20px !important",
                },
                "&:hover fieldset": {
                  borderColor: "white !important",
                },
              },
              "& .MuiSelect-icon": {
                color: "white",
              },
            }}
          >
            <Select
              value={sortOption}
              onChange={handleSortChange}
              displayEmpty
              sx={{
                color: "white",
                fontSize: "16px",
                height: "40px",
                borderRadius: "20px",
                textTransform: "none",
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: "#2D2D2D",
                    color: "white",
                  },
                },
              }}
              startAdornment={<SortIcon sx={{ color: "white", mr: 1 }} />}
            >
              {getSortMenuItems()}
            </Select>
          </FormControl>
        </Box>

        <TabContext value={value}>
          <Box className="tab-list-container">
            <TabList onChange={handleChange} className="adminTablist">
              <Tab
                label="Pending"
                value="1"
                sx={{
                  textTransform: "none",
                  fontSize: "26px !important",
                  fontWeight: 600,
                  mr: 10,
                }}
                className={`tab-item ${value === "1" ? "active" : ""}`}
              />
              <Tab
                label="Approved"
                value="2"
                sx={{
                  textTransform: "none",
                  fontSize: "26px !important",
                  fontWeight: 600,
                  mr: 10,
                }}
                className={`tab-item ${value === "2" ? "active" : ""}`}
              />
              <Tab
                label="Rejected"
                value="3"
                sx={{
                  textTransform: "none",
                  fontSize: "26px !important",
                  fontWeight: 600,
                }}
                className={`tab-item ${value === "3" ? "active" : ""}`}
              />
            </TabList>
          </Box>

          <TabPanel value="1" className="PanelList">
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="error-message">Error: {error}</p>
            ) : (
              <>
                <Typography className="section-header">Your Albums</Typography>
                {displayedAlbums.length > 0 ? (
                  <Box
                    className="albumlistgrid"
                    sx={{
                      height: ListHeight ? "220px" : "100px",
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
                    {displayedAlbums.map((album, index) => {
                      const pendingSongs = album.songs.filter(
                        (song) => song.decision === "Pending"
                      ).length;
                      return (
                        <Box
                          key={`album-${index}`}
                          className="albumItem"
                          onClick={() => handleAlbumClick(album)}
                        >
                          <img
                            src={album.coverPageUrl || coverpage}
                            alt={album.albumName}
                            className="albumcover"
                            onError={(e) => {
                              e.target.src = coverpage; // Fallback to default image on error
                            }}
                          />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography
                              variant="body1"
                              sx={{ fontSize: "20px !important", color: "white" }}
                            >
                              {album.albumName}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                marginTop: "5px !important",
                                fontSize: "16px !important",
                                color: "#A5A5A5 !important",
                              }}
                            >
                              {pendingSongs === album.songCount
                                ? `${pendingSongs} ${album.songCount === 1 ? "song" : "songs"}`
                                : `${pendingSongs} out of ${album.songCount} ${album.songCount === 1 ? "song" : "songs"}`}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Button
                              sx={{
                                backgroundColor: '#464445 !important',
                                color: "white",
                                marginLeft: "5px",
                                marginRight: "-70px",
                                alignSelf: "flex-start",
                                marginTop: "3px",
                                width: "150px !important",
                                height: "40px !important",
                                textTransform: "none",
                                fontSize: "20px",
                                fontWeight: 600,
                                borderRadius: "20px",
                              }}
                            >
                              {album.decision}
                            </Button>
                          </Box>
                          {album.decision === "Pending" && (
                              <IconButton
                                sx={{
                                  minWidth: "30px",
                                  width: "30px",
                                  height: "30px",
                                  borderRadius: "50%",
                                  backgroundColor: "#464445",
                                  color: "white",
                                  marginLeft: "10px",
                                  marginRight: "20px",
                                  '&:hover': {
                                    backgroundColor: '#333333'
                                  }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent triggering the parent onClick
                                  console.log("Album ID:", album.album_id || album.albumId || "No ID available");
                                  const albumId = album.album_id || album.albumId;
                                  if (albumId) {
                                    navigate(`/album-single-song-add/${albumId}`, { state: { album } });
                                  } else {
                                    console.error("Album ID not available");
                                  }
                                }}
                              >
                                <AddIcon />
                              </IconButton>
                            )}
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Typography sx={{ color: "white", mb: 2, ml: "30%" }}>
                    No pending albums available
                  </Typography>
                )}

                <Typography className="section-header">Your Songs</Typography>
                {displayedSingleSongs.length > 0 ? (
                  <Box
                    className="songlistgrid"
                    sx={{
                      height: ListHeight ? "250px" : "100px",
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
                    {displayedSingleSongs.map((song, index) => (
                      <Box
                        key={`song-${index}`}
                        className="songItem"
                        onClick={() => handlePendingSongClick()}
                      >
                        <img
                          src={song.coverPageUrl || coverpage}
                          alt={song.songName}
                          className="songcover"
                          onError={(e) => {
                            e.target.src = coverpage; // Fallback to default image on error
                          }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography
                            variant="body1"
                            sx={{ fontSize: "20px !important", color: "white" }}
                          >
                            {song.songName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginTop: "5px !important",
                              fontSize: "16px !important",
                              color: "#A5A5A5 !important",
                            }}
                          >
                            {song.genre}
                          </Typography>
                        </Box>
                        <Box>
                          <Button
                            sx={{
                              backgroundColor: "#464445 !important",
                              color: "white",
                              marginLeft: "5px",
                              marginRight: "-70px",
                              alignSelf: "flex-start",
                              marginTop: "3px",
                              width: "150px !important",
                              height: "40px !important",
                              textTransform: "none",
                              fontSize: "20px",
                              fontWeight: 600,
                              borderRadius: "20px",
                            }}
                          >
                            {song.decision}
                          </Button>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography sx={{ color: "white", mb: 2, ml: "30%" }}>
                    No pending songs available
                  </Typography>
                )}
              </>
            )}
          </TabPanel>

          <TabPanel
            value="2"
            className={`PanelList ${selectedSong || selectRejectSong ? "scrollable" : ""}`}
          >
            {loading || fetchingPlayCounts ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="error-message">Error: {error}</p>
            ) : (
              <>
                <Typography className="section-header">Your Uploads</Typography>
                {combinedItems.length > 0 ? (
                  <Box
                    className="albumlistgrid"
                    sx={{
                      height: ListHeight ? "500px" : "180px",
                      overflowY: "scroll",
                      "&::-webkit-scrollbar": {
                        width: "15px",
                        height: "30%",
                      },
                      "&::-webkit-scrollbar-track": {
                        backgroundColor: "transparent",
                        borderRadius: "2px",
                        marginTop: "50px",
                        marginBottom: "50px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "#e0e0e0",
                        borderRadius: "10px",
                        minHeight: "40px",
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
                    {combinedItems.map((item, index) => (
                      <Box
                        key={`${item.type}-${index}`}
                        className={item.type === "album" ? "albumItem" : "songItem"}
                        onClick={() =>
                          item.type === "album"
                            ? handleAlbumClick(item)
                            : handleSongClick(item)
                        }
                      >
                        <img
                          src={item.coverPageUrl || coverpage}
                          alt={item.albumName || item.songName}
                          className={item.type === "album" ? "albumcover" : "songcover"}
                          onError={(e) => {
                            e.target.src = coverpage; // Fallback to default image on error
                          }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography
                            variant="body1"
                            sx={{ fontSize: "20px !important", color: "white" }}
                          >
                            {item.albumName || item.songName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginTop: "5px !important",
                              fontSize: "16px !important",
                              color: "#A5A5A5 !important",
                            }}
                          >
                            {item.type === "album"
                              ? item.matchingSongCount === item.songCount
                                ? `${item.matchingSongCount} ${item.songCount === 1 ? "song" : "songs"}`
                                : `${item.matchingSongCount} out of ${item.songCount} ${item.songCount === 1 ? "song" : "songs"}`
                              : item.genre}
                          </Typography>
                        </Box>
                        {(sortOption === "streams-asc" || sortOption === "streams-desc") &&
                          item.type === "song" && (
                            <Box sx={{ mr: 2 }}>
                              <Typography
                                sx={{
                                  color: "white",
                                  fontSize: "18px",
                                  fontWeight: 600,
                                  marginLeft: "-20px !important",
                                }}
                              >
                                {songsWithPlayCounts[item.song_id] || 0}
                                <Typography
                                  component="span"
                                  sx={{
                                    color: "#A5A5A5",
                                    fontSize: "14px",
                                    ml: 0.5,
                                  }}
                                >
                                  streams
                                </Typography>
                              </Typography>
                            </Box>
                          )}
                        {item.type === "song" && (
                          <Box sx={{ display: "flex", alignItems: "center", mr: 5 }}>
                            <img
                              src={ApprovedGraph}
                              alt="Growth Graph Image"
                              className="image_Growth_graph"
                            />
                          </Box>
                        )}
                        <Box>
                          <Button
                            sx={{
                              backgroundColor: "#464445",
                              color: "#FFFFFF",
                              marginLeft: "5px",
                              marginRight: "-80px",
                              alignSelf: "flex-start",
                              marginTop: "3px",
                              width: "156px !important",
                              height: "43px !important",
                              textTransform: "none",
                              fontSize: "20px",
                              fontWeight: 600,
                              borderRadius: "20px",
                            }}
                          >
                            Approved
                          </Button>
                          {item.type === "album" && (
                            <IconButton
                              sx={{
                                minWidth: "30px",
                                width: "30px",
                                height: "30px",
                                borderRadius: "50%",
                                backgroundColor: "#464445",
                                color: "white",
                                marginLeft: "10px",
                                marginRight: "20px",
                                '&:hover': {
                                  backgroundColor: '#333333'
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the parent onClick
                                console.log("Album ID:", item.album_id || item.albumId || "No ID available");
                                const albumId = item.album_id || item.albumId;
                                if (albumId) {
                                  navigate(`/album-single-song-add/${albumId}`, { state: { album: item } });
                                } else {
                                  console.error("Album ID not available");
                                }
                              }}
                            >
                              <AddIcon />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography sx={{ color: "white", mb: 2, ml: "30%" }}>
                    No approved uploads available
                  </Typography>
                )}
              </>
            )}
          </TabPanel>

          <TabPanel
            value="3"
            className={`PanelList ${selectedSong || selectRejectSong ? "scrollable" : ""}`}
          >
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="error-message">Error: {error}</p>
            ) : (
              <>
                <Typography className="section-header">Your Uploads</Typography>
                {combinedItems.length > 0 ? (
                  <Box
                    className="albumlistgrid"
                    sx={{
                      height: ListHeight ? "550px" : "200px",
                      // height: "540px",
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
                    {combinedItems.map((item, index) => (
                      <Box
                        key={`${item.type}-${index}`}
                        className={item.type === "album" ? "albumItem" : "songItem"}
                        onClick={() =>
                          item.type === "album"
                            ? handleAlbumClick(item)
                            : handleRejectedSongClick(item)
                        }
                      >
                        <img
                          src={item.coverPageUrl || coverpage}
                          alt={item.albumName || item.songName}
                          className={item.type === "album" ? "albumcover" : "songcover"}
                          onError={(e) => {
                            e.target.src = coverpage; // Fallback to default image on error
                          }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography
                            variant="body1"
                            sx={{ fontSize: "20px !important", color: "white" }}
                          >
                            {item.albumName || item.songName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginTop: "5px !important",
                              fontSize: "16px !important",
                              color: "#A5A5A5 !important",
                            }}
                          >
                            {item.type === "album"
                              ? item.matchingSongCount === item.songCount
                                ? `${item.matchingSongCount} ${item.songCount === 1 ? "song" : "songs"}`
                                : `${item.matchingSongCount} out of ${item.songCount} ${item.songCount === 1 ? "song" : "songs"}`
                              : item.genre}
                          </Typography>
                        </Box>
                        <Box>
                          <Button
                            className="reject_button"
                            sx={{
                              backgroundColor: "#464445",
                              color: "white",
                              marginLeft: "15px",
                              marginRight: "-100px",
                              alignSelf: "flex-start",
                              marginTop: "3px",
                              width: "149px !important",
                              height: "40px !important",
                              textTransform: "none",
                              fontSize: "20px",
                              fontWeight: 600,
                              borderRadius: "20px",
                            }}
                          >
                            Rejected
                          </Button>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography sx={{ color: "white", mb: 2, ml: "30%" }}>
                    No rejected uploads available
                  </Typography>
                )}
              </>
            )}
          </TabPanel>
        </TabContext>
      </Card>

      {selectedSong && (
        <Box
          className="fixedBox"
          sx={{
            position: "fixed",
            bottom: isMiniPlayerActive ? 90 : 10,
            left: "20%",
            right: "22%",
            backgroundColor: "#04040466",
            color: "white",
            borderRadius: 2,
            width: "850px",
            boxShadow: 3,
            mt: 5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignContent: "center",
              justifyContent: "center",
              mt: 1,
            }}
          >
            <img
              src={selectedSong.coverPageUrl || coverpage}
              alt={selectedSong.songName}
              style={{
                width: 80,
                height: 70,
                borderRadius: 8,
                marginRight: 16,
              }}
              onError={(e) => {
                e.target.src = coverpage; // Fallback to default image on error
              }}
            />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {selectedSong.songName}
              </Typography>
              <Typography variant="h6" color="#707785">
                {selectedSong.genre}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" justifyContent="space-around" mt={1}>
            <Box display="flex" flexDirection="column" alignItems="center">
              <Typography variant="h5" fontSize={"40px"} fontWeight={700}>
                {songStats?.playCount || "0"}
              </Typography>
              <Typography variant="h6" fontWeight={400} fontSize={"20px"}>
                Streams
              </Typography>
            </Box>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              ml={10}
            >
              <Typography variant="h5" fontWeight={700} fontSize={"40px"}>
                {songStats?.playlistCount || "0"}
              </Typography>
              <Typography variant="h6" fontWeight={400} fontSize={"18px"}>
                Added to Playlists
              </Typography>
            </Box>
            <Box display="flex" flexDirection="column" alignItems="center">
              <Typography variant="h5" fontWeight={700} fontSize={"40px"}>
                {songStats?.shareSongCount || "0"}
              </Typography>
              <Typography variant="h6" component="div">
                <Box
                  display="flex"
                  alignItems="center"
                  fontWeight={400}
                  fontSize={"18px"}
                >
                  <span>Shares</span>
                </Box>
              </Typography>
            </Box>
          </Box>
          <Box display="flex" justifyContent="center" mt={2}>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              mr={-5}
            >
              <Typography variant="h5" fontWeight={700} fontSize={"40px"}>
                {songStats?.reactionCount || "0"}
              </Typography>
              <Typography variant="h6">
                <Box
                  display="flex"
                  alignItems="center"
                  fontWeight={400}
                  fontSize={"18px"}
                >
                  <img
                    src={Reaction}
                    style={{ width: "34px", height: "27px", marginLeft: 6 }}
                  />
                </Box>
              </Typography>
            </Box>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              mr={-10}
              ml={45}
            >
              <Typography variant="h5" fontWeight={700} fontSize={"40px"}>
                {songStats?.favoriteCount || "0"}
              </Typography>
              <Typography variant="h6">
                <Box
                  display="flex"
                  alignItems="center"
                  fontWeight={400}
                  fontSize={"18px"}
                  marginBottom={"20px "}
                >
                  <img
                    src={FavoriteIcon}
                    style={{
                      width: "32px",
                      height: "32px",
                      marginLeft: 6,
                    }}
                  />
                </Box>
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {selectRejectSong && (
        <Box
          className="fixedBox"
          sx={{
            position: "fixed",
            bottom: isMiniPlayerActive ? 90 : 10,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#040404",
            padding: 2,
            color: "white",
            borderRadius: 2,
            boxShadow: 3,
            width: "812px",
            mt: 5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 10,
              mt: 2,
              ml: 2,
              mr: 0,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                flex: 1,
                ml: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  mb: 2,
                }}
              >
                <img
                  src={selectRejectSong.coverPageUrl || coverpage}
                  alt={selectRejectSong.songName}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "8px",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.target.src = coverpage; // Fallback to default image on error
                  }}
                />
                <Box>
                  <Typography
                    sx={{
                      fontSize: "18px !important",
                      fontWeight: 500,
                      mb: 0.5,
                    }}
                  >
                    {selectRejectSong.songName}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "14px !important",
                      color: "#d7d2d2 !important",
                    }}
                  >
                    {songDetails?.genre ||
                      songDetails?.genres ||
                      selectRejectSong.genre ||
                      "Unknown"}
                  </Typography>
                </Box>
                <Button
                  sx={{
                    backgroundColor: "#464445",
                    color: "white",
                    marginLeft: "6px",
                    textTransform: "none",
                    fontSize: "14px",
                    borderRadius: "20px",
                    height: "30px",
                    width: "110px",
                  }}
                >
                  <Typography fontWeight={600} fontSize="14px">
                    Rejected
                  </Typography>
                </Button>
              </Box>
              <Box sx={{ mb: 6 }}>
                <Typography
                  sx={{
                    fontSize: "22px !important",
                    fontWeight: 500,
                    mb: 1,
                  }}
                >
                  Reason for Rejection:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "15px !important",
                    color: "#d7d2d2 !important",
                  }}
                >
                  {rejectReason?.rejectionReason?.S || "No reason provided"}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flexGrow: true }}>
              <Box sx={{ mb: 4, textAlign: "left" }}>
                <Typography
                  sx={{
                    fontSize: "22px !important",
                    fontWeight: 500,
                    mb: 2,
                  }}
                >
                  How can you improve:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "15px !important",
                    color: "#d7d2d2 !important",
                    whiteSpace: "normal",
                    wordWrap: "break-word",
                  }}
                >
                  {rejectReason?.improvement?.S || "No improvement advice provided"}
                </Typography>
              </Box>
              <Box sx={{ mt: 7, textAlign: "left" }}>
                <Typography
                  sx={{
                    fontSize: "22px !important",
                    fontWeight: 500,
                    mb: 1,
                  }}
                >
                  Contact Support
                </Typography>
                <Typography
                  sx={{
                    fontSize: "15px !important",
                    color: "#d7d2d2",
                  }}
                >
                  info@voiz.co
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}