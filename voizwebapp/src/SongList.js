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
  styled,
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
import Delete from "./assets/Delete.png";
import history from "./assets/history.png";
import loved_tracks from "./assets/loved_tracks1.png";
import bannerImage1 from "./assets/RectangleBannerImage.png";
import menuIcon from "./assets/menu.png";

import "./SongList.css";

const formatDisplayText = (text) => {
  if (typeof text === "object") {
    return JSON.stringify(text);
  }
  return text || "Unknown";
};

const INITIAL_BATCH_SIZE = 10; // Initial songs to show
const BATCH_SIZE = 20; // Additional songs to load each time

const SongList = () => {
  const {
    playSong,
    playPlaylist,
    isShuffled,
    toggleShuffle,
    currentSongId,
    isPlaying,
    originalPlaylist,
    shuffledPlaylist,
    playSongWithData,
    currentIndex,
    saveToHistory,
  } = usePlayer();

  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const [shareableLink, setShareableLink] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [songMenuAnchor, setSongMenuAnchor] = React.useState(null);
  const [selectedSong, setSelectedSong] = React.useState(null);
  const [showQueueView, setShowQueueView] = useState(() => {
    const savedQueueView = localStorage.getItem("showQueueView");
    return savedQueueView ? JSON.parse(savedQueueView) : false;
  });
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

  const [shareLink, setShareLink] = useState("");
  const [openShareDialog, setOpenShareDialog] = useState(false);

  const [allHistorySongs, setAllHistorySongs] = useState([]);
  const [displayedHistorySongs, setDisplayedHistorySongs] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);

  const [songInfo, setSongInfo] = useState(null);
  const [pageInfo, setPageInfo] = useState({
    title: "",
    subtitle: "",
    // coverImage:
    //   "https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/cover.png",
    coverImage: bannerImage1,
    type: "",
  });

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const songRefs = useRef({});

  const navigate = useNavigate();
  const location = useLocation();
  const { language, languageUserId, playlist, genre, genreUserId, artist } =
    location.state || {};
  const userId = localStorage.getItem("user_id");

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "true"
  );

  // Event Handlers
  const handleSongMenuOpen = (event, song) => {
    event.stopPropagation();
    setSongMenuAnchor(event.currentTarget);
    setSelectedSong(song);
  };

  const handleDeleteSong = (event) => {
    event.stopPropagation();
    setIsDialogOpen(true);
    setOpenDeleteDialog(true);
    handleSongMenuClose();
  };

  const loadMoreHistorySongs = useCallback(() => {
    if (loadingMoreRef.current) return;

    loadingMoreRef.current = true;
    const currentLength = displayedHistorySongs.length;
    const nextBatch = allHistorySongs.slice(
      currentLength,
      currentLength + BATCH_SIZE
    );

    if (nextBatch.length > 0) {
      setDisplayedHistorySongs((prev) => [...prev, ...nextBatch]);
      setSongs((prev) => [...prev, ...nextBatch]);
    }

    loadingMoreRef.current = false;
  }, [allHistorySongs, displayedHistorySongs]);

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

  // Add this at the beginning of your SongList component
  useEffect(() => {
    // Handle initial shared link access
    const handleSharedPlaylist = () => {
      if (location.pathname.includes("/playlist/")) {
        const playlistId = location.pathname.split("/").pop();
        const urlParams = new URLSearchParams(window.location.search);
        const sharedPlaylistName = urlParams.get("name");

        if (sharedPlaylistName) {
          // Store both the ID and name of the shared playlist
          sessionStorage.setItem(
            "shared_playlist_info",
            JSON.stringify({
              id: playlistId,
              name: sharedPlaylistName,
              timestamp: Date.now(), // Add timestamp to clear old data
            })
          );
        }
      }
    };

    handleSharedPlaylist();
  }, [location.pathname, location.search]);

  const handleHistoryScroll = useCallback(
    (e) => {
      if (location.pathname !== "/history") return;

      const element = e.target;
      const bottom =
        element.scrollHeight - element.scrollTop <= element.clientHeight + 100;

      if (
        bottom &&
        !loadingMoreRef.current &&
        displayedHistorySongs.length < allHistorySongs.length
      ) {
        loadMoreHistorySongs();
      }
    },
    [loadMoreHistorySongs, displayedHistorySongs.length, allHistorySongs.length]
  );

  const handleConfirmDelete = async () => {
    // Get playlist ID from URL
    const playlistId = location.pathname.split("/").pop();

    try {
      const timestamp = new Date().toISOString();
      const response = await fetch(
        "https://67avbampgi.execute-api.ap-south-1.amazonaws.com/voiz/playlist/removeSong",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playlist_id: playlistId,
            songIds: [selectedSong.song_id || selectedSong.id],
            updatedTimestamp: timestamp,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove song from playlist");
      }

      // Remove song from local state
      setSongs((prevSongs) =>
        prevSongs.filter(
          (song) =>
            (song.song_id || song.id) !==
            (selectedSong.song_id || selectedSong.id)
        )
      );

      // Update page subtitle
      setPageInfo((prev) => ({
        ...prev,
        subtitle: `${songs.length - 1} Song${
          songs.length - 1 !== 1 ? "s" : ""
        }`,
      }));

      // Dispatch event for real-time sidebar update
      window.dispatchEvent(
        new CustomEvent("playlistSongRemoved", {
          detail: {
            playlistId: playlistId,
          },
        })
      );
      setIsDialogOpen(false);
      setOpenDeleteDialog(false);
      setSelectedSong(null);
    } catch (error) {
      console.error("Error removing song:", error);
    }
  };

  const handleSongMenuClose = (event) => {
    if (event) {
      event.stopPropagation();
    }
    setSongMenuAnchor(null);
    // setSelectedSong(null);
  };

  const [openInfoDialog, setOpenInfoDialog] = useState(false);

  const handleSongInfo = async (event) => {
    event.stopPropagation();
    setIsDialogOpen(true);
    if (selectedSong?.song_id) {
      try {
        const response = await fetch(
          `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/song/info?song_id=${selectedSong.song_id}`
        );
        const data = await response.json();
        console.log("APIs data", data);
        // Assuming data is the root object containing song info
        setSongInfo({
          singer: data.singer?.S || "Unknown",
          composer: data.composer?.S || "Unknown",
          lyricist: data.lyricist?.S || "Unknown",
          producer: data.producer?.S || "Unknown",
        });

        console.log("Data Song", songInfo);
      } catch (error) {
        console.error("Error:", error);
      }
    }
    setOpenInfoDialog(true);
    handleSongMenuClose(event);
  };

  const handleShareSong = async (event) => {
    event.stopPropagation();
    if (selectedSong?.song_id) {
      setIsDialogOpen(true);
      try {
        // First fetch the song info
        const songInfoResponse = await fetch(
          `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/song/info?song_id=${selectedSong.song_id}`
        );
        const songInfo = await songInfoResponse.json();

        // Extract the cover page URL and song title from the response
        const coverPageUrl = songInfo?.coverPageUrl?.S;
        const songTitle = songInfo?.songName?.S;

        // Generate Firebase Dynamic Link
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
                link: `${window.location.origin}/song/${selectedSong.song_id}`,
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
          const fallbackUrl = `${window.location.origin}/song/${selectedSong.song_id}`;
          setShareableLink(
            `Hey, see what I found! Listen to this amazing song 😍 on VOIZ! Just download the app, listen and enjoy! ${fallbackUrl}`
          );
        }
      } catch (error) {
        console.error("Error generating share link:", error);
        const fallbackUrl = `${window.location.origin}/song/${selectedSong.song_id}`;
        setShareableLink(
          `Hey, see what I found! Listen to this amazing song 😍 on VOIZ! Just download the app, listen and enjoy! ${fallbackUrl}`
        );
      }

      setOpenShareDialog(true);
      handleSongMenuClose();
    }
  };

  const handleCopyShare = async () => {
    if (!shareableLink) return;
  
    try {
      await navigator.clipboard.writeText(shareableLink);
      setShowCopyAlert(true);
      setOpenShareDialog(false);
      setIsDialogOpen(false);
  
      // ✅ NEW: Increment share count
      if (selectedSong?.song_id) {
        await fetch("https://i3lmfmc1h2.execute-api.ap-south-1.amazonaws.com/voizpost/save/shareSongCount", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ song_id: selectedSong.song_id }),
        });
      }
    } catch (err) {
      console.error("Failed to copy link or increment count:", err);
    }
  };
  

  // const handleCopyShare = async () => {
  //   if (!shareableLink) return;

  //   try {
  //     await navigator.clipboard.writeText(shareableLink);
  //     setShowCopyAlert(true);
  //     setOpenShareDialog(false);
  //     setIsDialogOpen(false);
  //   } catch (err) {
  //     console.error("Failed to copy link:", err);
  //   }
  // };

  const handleCloseInfo = () => {
    setIsDialogOpen(false);
    setOpenInfoDialog(false);
    setSongInfo(null); // Reset song info
  };

  const formatDisplayText = (text) => {
    console.log("formatDisplayText input:", text, typeof text);
    if (!text) return "";
    if (typeof text !== "string") {
      console.log("Non-string input detected:", text);
      return String(text);
    }
    return text
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
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
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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

  const handleBackFromQueue = () => {
    setShowQueueView(false);
    localStorage.setItem("showQueueView", "false");
    window.history.replaceState({ threadView: false }, "", location.pathname);
  };

  const handlePlaySong = (song, index) => {
    if (!song.songStreamUrl || !song.songName) {
      console.error("Invalid song data:", song);
      return;
    }

    playPlaylist(songs);
    playSong(
      song.songStreamUrl,
      formatDisplayText(song.songName),
      formatDisplayText(song.stage_name) || "Unknown Artist",
      song.coverPageUrl,
      formatDisplayText(song.composer),
      formatDisplayText(song.producer),
      formatDisplayText(song.lyricist),
      formatDisplayText(song.singer),
      formatDisplayText(song.languages),
      index,
      song.song_id || song.id
    );
  };

  window.addEventListener("resetLoop", () => {
    // This event will be handled in MiniPlayer
  });

  const handleSongSelect = (song, index) => {
    if (showQueueView) {
      return;
    } else {
      // Dispatch event to reset loop state
      window.dispatchEvent(new Event("resetLoop"));

      // Continue with existing functionality
      playPlaylist(songs, index);
      saveToHistory(song.song_id || song.id);
    }
  };
  const [buttonClicked, setButtonClicked] = useState(false);

  const handlePlayAllClick = () => {
    if (songs.length === 0) return;
  
    setButtonClicked(true);
    setTimeout(() => setButtonClicked(false), 500);
  
    // handlePlayAll(); // Calls the original function
  };

  const handlePlayAll = () => {
    if (songs.length > 0) {
      // Pass false to prevent shuffling
      playPlaylist(songs, 0, false);
      saveToHistory(songs[0].song_id || songs[0].id);
    }
    handlePlayAllClick();
  };

  const handleShuffle = () => {
    if (songs.length > 0) {
      toggleShuffle();
      localStorage.setItem("shuffleState", (!isShuffled).toString());
    }
  };

  const getPageTitle = (pageType, language, playlist, genre, artist) => {
    switch (pageType) {
      case "lovedTracks":
        return "Loved Tracks";
      case "history":
        return "History";
      case "language":
        return formatDisplayText(language) || "Language";
      case "genre":
        return formatDisplayText(genre) || "Genre";
      case "artistGenre":
        return `Genre: ${formatDisplayText(genre)}`;
      case "artistLanguage":
        return `Language: ${formatDisplayText(language)}`;
      case "artistSongs":
        return formatDisplayText(artist?.StageName || artist?.FullName);
      case "playlistSongs":
        return (
          formatDisplayText(playlist?.playlistName || playlist?.name) ||
          "Playlist"
        );
      default:
        return "Music Collection";
    }
  };

  useEffect(() => {
    const handleSharedSong = async (event) => {
      const sharedSongId = event.detail || localStorage.getItem("sharedSongId");
      if (!sharedSongId) return;

      try {
        const songInfoResponse = await fetch(
          `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/song/info?song_id=${sharedSongId}`
        );

        if (!songInfoResponse.ok) throw new Error("Song not found");
        const songInfo = await songInfoResponse.json();

        const singleSongPlaylist = [
          {
            songStreamUrl: songInfo.songStreamUrl.S,
            songName: songInfo.songName.S,
            stage_name: songInfo.stage_name.S || "Unknown Artist",
            coverPageUrl: songInfo.coverPageUrl.S,
            composer: songInfo.composer.S,
            producer: songInfo.producer.S,
            lyricist: songInfo.lyricist.S,
            singer: songInfo.singer.S,
            languages: songInfo.languages.S,
            song_id: sharedSongId,
            nameFull: songInfo.FullName.S,
          },
        ];

        playPlaylist(singleSongPlaylist);
        playSongWithData(singleSongPlaylist[0], 0, false, true);
        localStorage.removeItem("sharedSongId"); // Clear after use
      } catch (error) {
        console.error("Error loading shared song:", error);
      }
    };

    window.addEventListener("playSharedSong", handleSharedSong);
    // Check for shared song on component mount
    const sharedSongId = localStorage.getItem("sharedSongId");
    if (sharedSongId) {
      handleSharedSong({ detail: sharedSongId });
    }

    return () => window.removeEventListener("playSharedSong", handleSharedSong);
  }, []);

  useEffect(() => {
    if (currentSongId && songRefs.current[currentSongId]) {
      // Add a small delay to ensure consistent scroll behavior
      setTimeout(() => {
        songRefs.current[currentSongId]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [currentSongId]);

  // Effects
  useEffect(() => {
    const handleSidebarChange = (event) => {
      setSidebarCollapsed(event.detail === "collapsed");
    };

    window.addEventListener("sidebarStateChange", handleSidebarChange);
    return () =>
      window.removeEventListener("sidebarStateChange", handleSidebarChange);
  }, []);

  useEffect(() => {
    localStorage.setItem("showQueueView", JSON.stringify(showQueueView));
  }, [showQueueView]);

  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state;
      if (state?.threadView) {
        setShowQueueView(true);
      } else {
        setShowQueueView(false);
        localStorage.setItem("showQueueView", "false");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    const handleQueueIconClick = () => {
      setShowQueueView(true);
      window.history.pushState({ threadView: true }, "", location.pathname);
      if (!originalPlaylist?.length && songs.length > 0) {
        playPlaylist(songs);
      }
    };

    window.addEventListener("showQueue", handleQueueIconClick);
    return () => window.removeEventListener("showQueue", handleQueueIconClick);
  }, [songs, originalPlaylist, playPlaylist]);

  useEffect(() => {
    const savedShuffleState = localStorage.getItem("shuffleState");
    if (savedShuffleState === "true" && !isShuffled) {
      toggleShuffle();
    }
  }, []);

  useEffect(() => {
    const savePlaybackState = () => {
      const currentPlaylist = isShuffled ? shuffledPlaylist : originalPlaylist;
      const state = {
        currentSong: currentPlaylist?.[currentIndex],
        currentIndex,
        isPlaying,
        shuffleState: isShuffled,
        playlist: originalPlaylist,
      };
      localStorage.setItem("playbackState", JSON.stringify(state));
      localStorage.setItem("shuffleState", isShuffled.toString());
    };

    if (originalPlaylist?.length) {
      savePlaybackState();
    }
  }, [currentIndex, isPlaying, isShuffled, originalPlaylist, shuffledPlaylist]);

  const parseCustomDateTime = (timestamp) => {
    try {
      if (!timestamp) return new Date(0);

      const year = parseInt(timestamp.substring(0, 4));
      const month = parseInt(timestamp.substring(4, 6));
      const day = parseInt(timestamp.substring(6, 8));
      const hour = parseInt(timestamp.substring(9, 11));
      const minute = parseInt(timestamp.substring(11, 13));
      const second = parseInt(timestamp.substring(13, 15));

      return new Date(year, month - 1, day, hour, minute, second);
    } catch (e) {
      console.error("Error parsing timestamp:", e);
      return new Date(0); // Return epoch time for invalid dates
    }
  };

  useEffect(() => {
    const fetchPageContent = async () => {
      if (
        !userId &&
        ["lovedtracks", "history"].includes(location.pathname.slice(1))
      ) {
        setError("User ID is required for this content");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let apiUrl = "";
        let pageType = "";
        let playlistDetails = null;

        switch (location.pathname) {
          case "/lovedtracks":
            apiUrl = `https://2a11hm9ls1.execute-api.ap-south-1.amazonaws.com/voizfavorite/api/lovedtracks?user_id=${userId}`;
            pageType = "lovedTracks";
            break;
          case "/history":
            apiUrl = `https://3ujjsgu42d.execute-api.ap-south-1.amazonaws.com/history/gethistory?user_id=${userId}`;
            pageType = "history";
            break;
          case "/language":
            apiUrl = `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/language?languages=${encodeURIComponent(
              language
            )}`;
            pageType = "language";
            break;
          case "/genre":
            apiUrl = `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/genre?genre=${encodeURIComponent(
              genre
            )}`;
            pageType = "genre";
            break;
          case "/artist/genre":
            apiUrl = `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/artist/genre/songs?genre=${encodeURIComponent(
              genre
            )}&user_id=${encodeURIComponent(genreUserId)}`;
            pageType = "artistGenre";
            break;
          case "/artist/language":
            apiUrl = `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/artist/language/songs?languages=${encodeURIComponent(
              language
            )}&user_id=${encodeURIComponent(languageUserId)}`;
            pageType = "artistLanguage";
            break;
          case "/artist/songs":
            apiUrl = `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/artist/songs?user_id=${encodeURIComponent(
              artist.user_id
            )}`;
            pageType = "artistSongs";
            break;
          default:
            if (location.pathname.includes("/playlist/")) {
              const playlistId = location.pathname.split("/").pop();
              const urlParams = new URLSearchParams(window.location.search);
              const sharedPlaylistName = urlParams.get("name");

              // Get stored playlist info from sessionStorage
              let storedPlaylistInfo = null;
              try {
                storedPlaylistInfo = JSON.parse(
                  sessionStorage.getItem("shared_playlist_info")
                );
              } catch (e) {
                console.error("Error parsing stored playlist info:", e);
              }

              // Store new shared playlist info if available in URL
              if (sharedPlaylistName) {
                const newPlaylistInfo = {
                  id: playlistId,
                  name: sharedPlaylistName,
                };
                sessionStorage.setItem(
                  "shared_playlist_info",
                  JSON.stringify(newPlaylistInfo)
                );
                storedPlaylistInfo = newPlaylistInfo;
              }

              // Only fetch details if we don't have the name from URL or stored info
              if (
                !sharedPlaylistName &&
                (!storedPlaylistInfo || storedPlaylistInfo.id !== playlistId)
              ) {
                try {
                  const playlistResponse = await fetch(
                    `https://67avbampgi.execute-api.ap-south-1.amazonaws.com/voiz/playlist/details?playlist_id=${playlistId}`
                  );

                  if (playlistResponse.ok) {
                    const playlistData = await playlistResponse.json();
                    playlistDetails = playlistData.playlist || {};
                  }
                } catch (error) {
                  console.error("Error fetching playlist details:", error);
                }
              }

              apiUrl = `https://67avbampgi.execute-api.ap-south-1.amazonaws.com/voiz/playlist/songList?playlist_id=${playlistId}`;
              pageType = "playlistSongs";
            } else {
              throw new Error("Invalid route");
            }
        }

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const processedSongs = data.message
          ? []
          : await Promise.all(
              (data.songDetails || data || []).map(async (song, index) => {
                try {
                  // Fetch additional song info
                  const songInfoResponse = await fetch(
                    `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/song/info?song_id=${song.song_id}`
                  );
                  const songInfo = await songInfoResponse.json();

                  return {
                    ...song,
                    id:
                      song.song_id ||
                      `${pageType}-${Date.now()}-${Math.random()}`,
                    originalIndex: index,
                    artistFullName: songInfo?.FullName?.S || "", // Add the FullName here
                  };
                } catch (error) {
                  console.error(
                    `Error fetching song info for song ${song.song_id}:`,
                    error
                  );
                  return {
                    ...song,
                    id:
                      song.song_id ||
                      `${pageType}-${Date.now()}-${Math.random()}`,
                    originalIndex: index,
                    artistFullName: "", // Return empty string if fetch fails
                  };
                }
              })
            );

        const sortedSongs = processedSongs.sort((a, b) => {
          if (a.updatedTimestamp && b.updatedTimestamp) {
            const dateTimeA = parseCustomDateTime(a.updatedTimestamp);
            const dateTimeB = parseCustomDateTime(b.updatedTimestamp);
            const timeCompare = dateTimeB.getTime() - dateTimeA.getTime();
            if (timeCompare !== 0) return timeCompare;
          }
          return a.originalIndex - b.originalIndex;
        });

        setSongs(sortedSongs);

        // Enhanced title resolution logic
        let displayTitle;
        if (pageType === "playlistSongs") {
          const playlistId = location.pathname.split("/").pop();
          const urlParams = new URLSearchParams(window.location.search);
          const sharedPlaylistName = urlParams.get("name");
          let storedPlaylistInfo = null;
          try {
            storedPlaylistInfo = JSON.parse(
              sessionStorage.getItem("shared_playlist_info")
            );
          } catch (e) {
            console.error("Error parsing stored playlist info:", e);
          }

          displayTitle = formatDisplayText(
            sharedPlaylistName || // First priority: URL parameter
              (storedPlaylistInfo && storedPlaylistInfo.id === playlistId
                ? storedPlaylistInfo.name
                : null) || // Second priority: Stored info
              playlistDetails?.playlistName?.S || // Third priority: API response
              playlist?.name || // Fourth priority: Passed props
              location.state?.playlistName || // Fifth priority: Location state
              "Playlist" // Fallback
          );
        } else {
          displayTitle = getPageTitle(
            pageType,
            language,
            { name: playlist?.name || location.state?.playlistName },
            genre,
            artist
          );
        }

        setPageInfo({
          title: displayTitle,
          subtitle: `${sortedSongs.length} Song${
            sortedSongs.length !== 1 ? "s" : ""
          }`,
          // coverImage:
          //   playlistDetails?.coverPageUrl?.S ||
          //   playlist?.coverImage ||
          //   "https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/cover.png",
          coverImage:
            playlistDetails?.coverPageUrl?.S ||
            playlist?.coverImage ||
            bannerImage1,
            type: pageType,
        });

        setPageInfo({
          title: displayTitle,
          subtitle: `${sortedSongs.length} Song${
            sortedSongs.length !== 1 ? "s" : ""
          }`,
          coverImage:
            playlistDetails?.coverPageUrl?.S ||
            playlist?.coverImage ||
            bannerImage1, // Always use bannerImage1 as the fallback
          // coverImage:
          //   pageType === "playlistSongs"
          //     ? bannerImage1 // Use the new banner image for playlists
          //     : playlistDetails?.coverPageUrl?.S ||
          //       playlist?.coverImage ||
          //       "https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/cover.png",
          type: pageType,
        });

        setError(null);
      } catch (error) {
        console.error("Error fetching content:", error);
        setError(error.message || "Failed to load content");
      } finally {
        setLoading(false);
      }
    };

    fetchPageContent();
  }, [
    location.pathname,
    location.search,
    language,
    playlist,
    genre,
    userId,
    genreUserId,
    languageUserId,
    artist,
  ]);

  useEffect(() => {
    return () => {
      if (!location.pathname.includes("/playlist/")) {
        localStorage.removeItem("shared_playlist_info");
      }
    };
  }, [location.pathname]);

  const renderQueueView = () => {
    const currentPlaylist =
      isShuffled && shuffledPlaylist ? shuffledPlaylist : originalPlaylist;

    return (
      <Box className="thread-queue-container">
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <IconButton
            onClick={handleBackFromQueue}
            sx={{ color: "white", mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h5"
            sx={{
              color: "white",
              fontFamily: "Poppins",
              fontWeight: 700,
              fontSize: "24px",
            }}
          >
            Thread
          </Typography>
        </Box>

        {!currentPlaylist || currentPlaylist.length === 0 ? (
          <Typography sx={{ color: "white", textAlign: "center", mt: 4 }}>
            No songs in the queue
          </Typography>
        ) : (
          <div className="thread-queue-content">
            {currentPlaylist.map((song, index) => {
              const isActive = (song.song_id || song.id) === currentSongId;
              return (
                <Box
                  key={song.song_id || song.id || index}
                  ref={
                    isActive
                      ? (el) => {
                          if (el) {
                            setTimeout(() => {
                              el.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                            }, 100);
                          }
                        }
                      : null
                  }
                  onClick={() => {
                    // Add click handler to play the song
                    playPlaylist(currentPlaylist);
                    playSongWithData(song, index, false, true);
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 2,
                    cursor: "pointer",
                    bgcolor: isActive ? "#151415 !important" : "transparent",
                    boxShadow: isActive
                      ? " 5px 5px 5px rgba(0, 0, 0, 0.5) !important"
                      : "none",
                    "&:hover": {
                      bgcolor: isActive
                        ? "#151415 !important"
                        : "rgba(255, 255, 255, 0.05)",
                      boxShadow: isActive
                        ? " 5px 5px 5px rgba(0, 0, 0, 0.5) !important"
                        : "none",
                    },
                    transition: "background-color 0.2s, box-shadow 0.3s",
                    borderRadius: "28px",
                    position: "relative",
                    zIndex: isActive ? 2 : 1,
                    marginBottom: "12px",
                  }}
                >
                  <img
                    src={song.coverPageUrl || song.cover}
                    alt={song.songName || song.title}
                    style={{
                      width: "90px",
                      height: "82px",
                      borderRadius: "8px",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      // e.target.src =
                      //   "https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/cover.png";
                      e.target.src = bannerImage1;
                    }}
                  />
                  <Box sx={{ ml: 2, flex: 1 }}>
                    <Typography
                      className="song-title"
                      sx={{
                        color: isActive ? "#2644D9 !important" : "#FFFFFF",
                        fontWeight: 600,
                        fontSize: "18px !important",
                        fontFamily: "Poppins",
                      }}
                    >
                      {formatDisplayText(song.songName || song.title)}
                    </Typography>
                    <Typography
                      className="song-artist"
                      sx={{
                        color: isActive
                          ? "#A5A5A5 !important"
                          : "#A5A5A5 !important",
                        fontSize: "14px !important",
                        mt: 0.5,
                      }}
                    >
                      {formatDisplayText(song.stage_name || song.artist)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      ml: "auto",
                      textAlign: "right",
                      color: isActive
                        ? "#2644D9 !important"
                        : "#FFFFFF !important",
                      fontFamily: "Poppins",
                      fontSize: "14px",
                      fontWeight: 400,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "60px",
                    }}
                  >
                    {song.span || "--:--"}
                  </Box>
                </Box>
              );
            })}
          </div>
        )}
      </Box>
    );
  };

  // Main Render
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
      <SideBar />
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
        {showQueueView ? (
          renderQueueView()
        ) : (
          <>
            <Box
              className={`hero-section ${
                sidebarCollapsed ? "sidebar-collapsed" : ""
              }`}
            >
              <Box className="hero-image-container">
                <img
                  src={pageInfo.coverImage}
                  alt={formatDisplayText(pageInfo.title)}
                  className="hero-image"
                  onError={(e) => {
                    // e.target.src =
                    //   "https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/cover.png";
                    e.target.src = bannerImage1;
                  }}
                  style={{ marginLeft: -3.8 }}
                />
                <Box className="hero-overlay" sx={{ marginLeft: -0.5 }}>
                  <Box className="hero-controls"></Box>
                </Box>
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
                height: "calc(100vh - 200px",
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
                    marginRight: 65,
                    flex: 1,
                    marginRight: "24px",
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

                  {location.pathname === "/history" && (
                    <img
                      src={history}
                      alt="history"
                      style={{
                        width: "52px",
                        height: "52px",
                        marginTop: "10px",
                        marginLeft: "-12px",
                      }}
                    />
                  )}

                  {location.pathname === "/lovedtracks" && (
                    <img
                      src={loved_tracks}
                      alt="loved_tracks"
                      style={{
                        width: "48px",
                        height: "48px",
                        marginTop: "6px",
                        marginLeft: "-12px",
                        backgroundColor: "none !important",
                      }}
                    />
                  )}
                </Box>

                {/* <Typography
                  variant="h1"
                  sx={{
                    fontSize: "48px",
                    fontWeight: "bold",
                    color: "white",
                    maxWidth: "60%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatDisplayText(pageInfo.title)}
                </Typography> */}

                <Box sx={{ display: "flex", gap: 2, marginRight: 65 }}>
                  {pageInfo.type !== "lovedTracks" &&
                    pageInfo.type !== "history" && (
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
                            // opacity: 0.5, // Added opacity for disabled state
                          },
                        }}
                      >
                        <ImShuffle
                          color={isShuffled ? "white" : "white"}
                          style={{
                            height: "42.62px",
                            width: "41.27px",
                            opacity: songs.length === 0 ? 0.5 : 1, // Added opacity for the icon
                          }}
                        />
                      </IconButton>
                    )}

                  <IconButton
                    onClick={handlePlayAll}
                    disabled={songs.length === 0}
                    sx={{
                      width: "65px",
                      height: "65px",
                      backgroundColor: buttonClicked ? "#2644D9" : "#464445",
                      "&:hover": { backgroundColor: buttonClicked ? "#2644D9" : "#464445" },
                      "&.Mui-disabled": {
                        backgroundColor: "#464445 !important",
                        // opacity: 0.5, // Added opacity for disabled state
                      },
                    }}
                  >
                    <PlayIcon
                      sx={{
                        color: "white",
                        fontSize: 45,
                        height: "42.62px !important",
                        width: "41.27px !important",
                        opacity: songs.length === 0 ? 0.5 : 1, // Added opacity for the icon
                      }}
                    />
                  </IconButton>
                </Box>
              </Box>

              <Box
                className="songs-section"
                sx={{
                  overflowY: "auto",
                  flex: 1, // Add this
                  paddingBottom: "115px", // Add this
                  "&::-webkit-scrollbar": {
                    // Optional - for better scrollbar styling
                    width: "8px",
                  },
                  "&::-webkit-scrollbar-track": {
                    // Optional
                    background: "transparent",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    // Optional
                    background: "rgba(255, 255, 255, 0.2)",
                    borderRadius: "4px",
                  },
                }}
              >
                {songs.length > 0 ? (
                  <List
                  // className="songs-list"
                  sx={{
                    overflowY: "scroll",
                    "&::-webkit-scrollbar": {
                      width: "15px",
                      height: "30%"
                    },
                    "&::-webkit-scrollbar-track": {
                      backgroundColor: "transparent",
                      borderRadius: "2px"
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "#e0e0e0",
                      borderRadius: "10px",
                      minHeight: "40%",
                      paddingX: "5px",
                      
                      /* 👇 Use your icon here */
                      backgroundImage: `url(${menuIcon})`,//"url('/src/assets/menu.png')",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                      backgroundSize: "14px", // Adjust size as needed
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                      backgroundColor: "#ccc",
                    },
                  }}
                  >
                    {songs.map((song, index) => {
                      const isActive =
                        currentSongId === (song.song_id || song.id);
                      return (
                        <ListItem
                          key={song.id}
                          ref={(el) =>
                            (songRefs.current[song.song_id || song.id] = el)
                          } // Attach ref dynamically
                          onClick={() => handleSongSelect(song, index)}
                          className={`song-item ${
                            isActive ? "active-song" : ""
                          }`}
                          
                        >
                          <Box className="song-content">
                            <div className="number-play-wrapper">
                              {isActive && isPlaying && (
                                <div className="playing-indicator" />
                              )}
                            </div>
                            <div className="title-cell">
                              <Avatar
                                src={song.coverPageUrl }
                                alt={formatDisplayText(song.songName)}
                                className="song-avatar"
                                variant="rounded"
                                sx={{
                                  borderRadius: isActive ? "11px !important" : ""
                                }}
                              />
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <span
                                  className={`song-name ${
                                    isActive ? "active" : ""
                                  }`}
                                >
                                  {formatDisplayText(song.songName) ||
                                    "Untitled"}
                                </span>
                                <Typography
                                  className="stage-name"
                                  sx={{ color: isActive ? "white" : "#A5A5A5" }}
                                >
                                  {formatDisplayText(
                                    song.stage_name ||
                                      song.artistFullName ||
                                      "Unknown Artist"
                                  )}
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
                                className={`song-duration ${
                                  isActive ? "active" : ""
                                }`}
                              >
                                {song.span || "--:--"}
                              </div>
                              {pageInfo.type !== "lovedTracks" &&
                                pageInfo.type !== "history" && (
                                  <IconButton
                                    onClick={(e) => handleSongMenuOpen(e, song)}
                                    sx={{
                                      color: "white",
                                      padding: "4px",
                                      "&:hover": {
                                        backgroundColor:
                                          "rgba(255, 255, 255, 0.1)",
                                      },
                                      position: "absolute",
                                      right: 30,
                                      "& svg": { width: 20, height: 20 },
                                    }}
                                  >
                                    <MoreVertical size={16} />
                                  </IconButton>
                                )}
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
                        {/* <Typography
                          sx={{
                            color: "white",
                            fontSize: "26px !important",
                            fontWeight: "700 !important",
                            mb: 1,
                          }}
                        > */}
                        <h2></h2>
                        {/* </Typography> */}
                        {[
                          { name: songInfo.singer, role: "Singer" },
                          { name: songInfo.composer, role: "Composer" },
                          { name: songInfo.lyricist, role: "Lyricist" },
                          { name: songInfo.producer, role: "Producer" },
                        ]
                          .filter(
                            (credit) => credit.name && credit.name !== "Unknown"
                          )
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
                                  color: "#000",
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

                  <DialogActions sx={{ justifyContent: "center", p: 2 }}>
                    {/* <Button
                      onClick={handleCloseInfo}
                      sx={{
                        color: "#2782EE",
                        textTransform: "none",
                        fontSize: "16px",
                        "&:hover": {
                          backgroundColor: "rgba(39, 130, 238, 0.08)",
                        },
                      }}
                    >
                      Close
                    </Button> */}
                  </DialogActions>
                </Dialog>

                <Dialog
                  open={openDeleteDialog}
                  onClose={() => {
                    setOpenDeleteDialog(false);
                    setIsDialogOpen(false);
                  }}
                  sx={{
                    "& .MuiDialog-paper": {
                      width: "300px !important",
                      minHeight: "150px !important",
                      borderRadius: "16px",
                      backgroundColor: "#151415 !important",
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
                    Delete Song?
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
                        marginLeft: "10px !important",
                        // padding: "6px 16px",
                        "&:hover": {
                          backgroundColor: "rgba(255, 77, 77, 0.08)",
                        },
                      }}
                    >
                      Delete
                    </Button>
                  </DialogActions>
                </Dialog>

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
                  {location.pathname.includes("/playlist/") && (
                    <MenuItem onClick={handleDeleteSong}>
                      <img
                        src={Delete}
                        alt="Delete"
                        style={{
                          width: "16px",
                          height: "16px",
                        }}
                      />
                      &nbsp; &nbsp; Delete
                    </MenuItem>
                  )}

                  <MenuItem onClick={handleSongInfo} sx={{ gap: 2 }}>
                    <Info size={16} />
                    Song Info
                  </MenuItem>
                  <MenuItem
                    onClick={(e) =>
                      handleShareSong(
                        e,
                        selectedSong,
                        setOpenShareDialog,
                        handleSongMenuClose
                      )
                    }
                    sx={{ gap: 2 }}
                  >
                    <IoShareSocialOutline size={16} />
                    Share
                  </MenuItem>
                </Menu>
              </Box>
            </Box>

            <Dialog
              open={openShareDialog}
              onClose={() => {
                setOpenShareDialog(false);
                setIsDialogOpen(false);
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
                  onClick={() => {
                    handleCopyShare(
                      selectedSong,
                      setOpenShareDialog,
                      setShowCopyAlert
                    );
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
                  Copy Link
                </Button>
              </DialogActions>
            </Dialog>
            {/* <Snackbar
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
            </Snackbar> */}
          </>
        )}
      </Box>
    </Box>
  );
};

export default SongList;
