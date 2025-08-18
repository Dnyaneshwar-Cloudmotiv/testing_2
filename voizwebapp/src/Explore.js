import React, { useState, useEffect, useRef } from "react";
import algoliasearch from "algoliasearch/lite";
import {
  InstantSearch,
  SearchBox,
  Index,
  Configure,
  connectStateResults,
} from "react-instantsearch-dom";
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  Avatar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "./PlayerContext";
import SideBar from "./SideBar";
import "./Explore.css";
import coverpage from "./assets/Common_cover_page.png";
import { IoMdSearch } from "react-icons/io";
import Ellipse_1925 from "./assets/Ellipse_1925.png";
import Vector1 from "./assets/Vector1.png";
import Vector2 from "./assets/Vector2.png";

const searchClient = algoliasearch(
  "Y84C0QMOOU",
  "e4bb4276844957c3a9d8f3ce71f80026"
);

// Helper function to format song metadata
const formatSongMetadata = (hit) => ({
  songStreamUrl: hit.songStreamUrl,
  songName: hit.songName,
  stage_name: hit.stage_name,
  coverPageUrl: hit.coverPageUrl,
  song_id: hit.objectID,
  objectID: hit.objectID,
  composer: hit.composer || "",
  producer: hit.producer || "",
  lyricist: hit.lyricist || "",
  singer: hit.singer || hit.stage_name || "",
  languages: hit.languages || "",
  span: hit.span || "",
  approved: hit.approved,
});

const SongHit = ({ hit, onSelect }) => (
  <ListItem
    component="div"
    onClick={() => onSelect(hit)}
    className="song-item"
    sx={{ cursor: "pointer" }}
  >
    <Box className="song-content">
      <Box className="song-info">
        <Avatar
          src={hit.coverPageUrl}
          alt={hit.songName}
          className="song-avatar"
        />
        <Box className="song-details">
          <Typography className="song-name">{hit.songName}</Typography>
          <Typography className="artist-name">{hit.stage_name}</Typography>
          <Typography variant="caption" className="song-id">
            ID: {hit.objectID}
          </Typography>
        </Box>
      </Box>
      <Typography className="song-duration">{hit.span}</Typography>
    </Box>
  </ListItem>
);

const ArtistHit = ({ hit, onSelect }) => (
  <ListItem
    component="div"
    onClick={() => onSelect(hit)}
    className="artist-search-item"
    sx={{ cursor: "pointer" }}
  >
    <Box className="artist-search-content">
      <Box className="artist-search-info">
        <Avatar
          src={hit.profilePhotoUrl}
          alt={hit.stageName}
          className="artist-search-avatar"
        />
        <Box className="artist-search-details">
          <Typography className="artist-search-name">
            {hit.stageName || hit.fullName}
          </Typography>
          <Typography className="artist-search-category">
            {hit.category}
          </Typography>
        </Box>
      </Box>
    </Box>
  </ListItem>
);

const ConnectedArtistResults = connectStateResults(
  ({ searchResults, onSelect }) => {
    if (!searchResults?.hits?.length) return null;

    return (
      <Box
        className="custom-search-section"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          padding: "1rem",
        }}
      >
        <Typography
          variant="h6"
          className="custom-artist-header"
          sx={{
            fontWeight: "bold !important",
            color: "#ffffff !important",
            textAlign: "left !important",
          }}
        >
          Artists
        </Typography>

        <Box
          className="custom-artist-grid"
          sx={{
            display: "flex",
            gap: "6px",
            overflowX: "auto !important",
            marginTop: "-10px",
          }}
        >
          {searchResults.hits.map((hit) => (
            <Box
              key={hit.objectID}
              onClick={() => onSelect(hit)}
              className="custom-artist-search-item"
              sx={{
                display: "flex !important",
                flexDirection: "column !important",
                alignItems: "center !important",
                cursor: "pointer !important",
                minWidth: "150px !important",
                maxWidth: "150px !important",
                textAlign: "center !important",
              }}
            >
              <Avatar
                src={hit.profilePhotoUrl || coverpage}
                alt={hit.stageName || hit.fullName}
                className="custom-artist-search-avatar"
                sx={{
                  width: "60px !important",
                  height: "60px !important",
                  borderRadius: "50% !important",
                  marginBottom: "6px !important",
                }}
              />
              <Box className="custom-artist-search-details">
                <Typography
                  className="custom-artist-search-name"
                  sx={{
                    fontSize: "14px !important",
                    fontWeight: "400 !important",
                    color: "#ffffff !important",
                    wordWrap: "break-word !important",
                    whiteSpace: "normal !important",
                    textAlign: "center !important",
                  }}
                >
                  {hit.stageName || hit.fullName}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }
);

const ConnectedSongResults = connectStateResults(
  ({ searchResults, onSelect }) => {
    if (!searchResults?.hits?.length) return null;

    const approvedSongs = searchResults.hits.filter(
      (song) => song.approved === "true"
    );
    if (!approvedSongs.length) return null;

    // Transform search results to include all metadata
    const transformedSongs = approvedSongs.map((hit) =>
      formatSongMetadata(hit)
    );

    return (
      <Box className="search-section">
        <Typography
          variant="h6"
          className="search-header"
          sx={{
            fontWeight: "bold !important",
            color: "#ffffff !important",
            textAlign: "left !important",
            marginBottom: "1rem !important",
            marginLeft: "1rem !important",
          }}
        >
          Songs
        </Typography>
        <List className="search-list">
          {transformedSongs.map((song) => (
            <ListItem
              key={song.song_id}
              onClick={() => onSelect(song)}
              className="song-item"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                padding: "0.5rem 0",
                cursor: "pointer",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <Avatar
                  src={song.coverPageUrl}
                  alt={song.songName}
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: "4px",
                  }}
                />
                <Box>
                  <Typography
                    sx={{
                      fontSize: "1rem",
                      fontWeight: "400",
                      color: "#ffffff",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {song.songName}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.9rem",
                      color: "#aaaaaa",
                    }}
                  >
                    {song.stage_name}
                  </Typography>
                </Box>
              </Box>
              <Typography
                sx={{
                  fontSize: "0.9rem",
                  color: "#aaaaaa",
                }}
              >
                {song.span}
              </Typography>
            </ListItem>
          ))}
        </List>
      </Box>
    );
  }
);

const Results = connectStateResults(
  ({ searchState, searchResults, onArtistSelect, onSongSelect, onClose }) => {
    const resultsRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        // Check if the clicked element is the search icon or search input
        const isSearchElement =
          event.target.classList.contains("search-icon") ||
          event.target.classList.contains("ais-SearchBox-input");

        if (
          resultsRef.current &&
          !resultsRef.current.contains(event.target) &&
          !isSearchElement
        ) {
          onClose && onClose();
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    if (!searchState?.query) return null;

    if (!searchResults?.hits?.length) {
      return <Typography className="no-results">No results found</Typography>;
    }

    return (
      <Box ref={resultsRef}>
        <Index indexName="Artist_index">
          <Configure hitsPerPage={3} />
          <ConnectedArtistResults onSelect={onArtistSelect} />
        </Index>

        <Index indexName="song_index">
          <Configure hitsPerPage={5} />
          <ConnectedSongResults onSelect={onSongSelect} />
        </Index>
      </Box>
    );
  }
);

export default function Explore() {
  const navigate = useNavigate();
  const { playSong, playPlaylist } = usePlayer();
  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followStatus, setFollowStatus] = useState({});
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [followLoading, setFollowLoading] = useState({});
  const loggedInUserId = localStorage.getItem("user_id");
  const [loadedArtists, setLoadedArtists] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);

  // const [isHovering, setIsHovering] = useState(false);

  const fetchFollowerCount = async (userId) => {
    try {
      const response = await fetch(
        `https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/followers/count?user_id=${userId}`
      );
      const data = await response.json();
      return data.count;
    } catch (error) {
      console.error("Error fetching follower count:", error);
      return 0;
    }
  };

  const loadArtistWithStatus = async (artist) => {
    try {
      const [followStatusResponse, followerCount] = await Promise.all([
        fetch(
          `https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/checkFollow?user_id=${loggedInUserId}&artistId=${artist.user_id}`
        ),
        fetchFollowerCount(artist.user_id),
      ]);

      const statusData = await followStatusResponse.json();

      return {
        ...artist,
        followers: followerCount,
        isFollowed: statusData.follows,
        isLoaded: true,
      };
    } catch (error) {
      console.error(
        `Error loading status for artist ${artist.user_id}:`,
        error
      );
      return {
        ...artist,
        followers: 0,
        isFollowed: false,
        isLoaded: true,
      };
    }
  };

  useEffect(() => {
    const fetchArtistsProgressively = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          "https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/artist"
        );
        const data = await response.json();

        // Filter artists with songs
        const artistsWithSongs = data.filter((artist) => artist.songCount > 0);
        const limitedData = artistsWithSongs.slice(0, 10);
        setArtists(limitedData);

        // Create new array to store loaded artists
        let newLoadedArtists = [];

        for (const artist of limitedData) {
          const loadedArtist = await loadArtistWithStatus(artist);
          newLoadedArtists = [...newLoadedArtists, loadedArtist].slice(0, 10);
          setLoadedArtists(newLoadedArtists);
        }
      } catch (error) {
        console.error("Error fetching artists:", error);
        setError("Failed to load artists");
      } finally {
        setIsLoading(false);
      }
    };

    if (loggedInUserId) {
      fetchArtistsProgressively();
    }
  }, [loggedInUserId]);

  // useEffect(() => {
  //     let interval;

  //     // Only start the interval if not hovering
  //     if (!isHovering) {
  //         interval = setInterval(() => {
  //             setCurrentIndex(prev => (prev + 1) % loadedArtists.length);
  //         }, 5000);
  //     }

  //     // Cleanup function to clear interval
  //     return () => {
  //         if (interval) {
  //             clearInterval(interval);
  //         }
  //     };
  // }, [loadedArtists.length, isHovering]);

  // useEffect(() => {
  //     const fetchArtistsProgressively = async () => {
  //         try {
  //             setIsLoading(true);
  //             const response = await fetch('https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/artist');
  //             const data = await response.json();

  //             const artistsWithSongs = data.filter(artist => artist.songCount > 0);

  //             console.log(artistsWithSongs);

  //             const limitedData = artistsWithSongs.slice(0, 10);
  //             setArtists(limitedData);

  //             setLoadedArtists([]);

  //             for (const artist of limitedData) {
  //                 const loadedArtist = await loadArtistWithStatus(artist);
  //                 setLoadedArtists(prev => [...prev.slice(0, 9), loadedArtist].slice(0, 10));
  //             }
  //         } catch (error) {
  //             console.error('Error fetching artists:', error);
  //             setError('Failed to load artists');
  //         } finally {
  //             setIsLoading(false);
  //         }
  //     };

  //     if (loggedInUserId) {
  //         fetchArtistsProgressively();
  //     }
  // }, [loggedInUserId]);

  const formatTimestamp = () => {
    const now = new Date();
    return now.toISOString();
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchFollowStatus = async (artistId) => {
    try {
      await delay(500);
      const response = await fetch(
        `https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/checkFollow?user_id=${loggedInUserId}&artistId=${artistId}`
      );
      if (!response.ok) throw new Error("Failed to fetch follow status");
      const data = await response.json();
      return data.follows;
    } catch (error) {
      console.error("Error checking follow status:", error);
      return false;
    }
  };

  // useEffect(() => {
  //     const fetchArtists = async () => {
  //         if (!loggedInUserId) return;

  //         try {
  //             setIsLoading(true);
  //             setError(null);

  //             const response = await fetch('https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/artist');
  //             const data = await response.json();
  //             const limitedData = data.slice(0, 10);
  //             setArtists(limitedData);

  //             const newLoadedArtists = [];
  //             const newFollowStatus = {};

  //             for (const artist of limitedData) {
  //                 const loadedArtist = await loadArtistWithStatus(artist);
  //                 newLoadedArtists.push(loadedArtist);
  //                 newFollowStatus[artist.user_id] = loadedArtist.isFollowed;

  //                 setLoadedArtists([...newLoadedArtists]);
  //                 setFollowStatus(newFollowStatus);
  //             }

  //         } catch (error) {
  //             console.error('Error fetching artists:', error);
  //             setError('Failed to load artists');
  //         } finally {
  //             setIsLoading(false);
  //         }
  //     };

  //     fetchArtists();
  // }, [loggedInUserId]);

  // ... continuing from previous code

  const handleFollow = async (artistId) => {
    // Create a copy of the current loaded artists
    const updatedArtists = loadedArtists.map((artist) =>
      artist.user_id === artistId
        ? {
            ...artist,
            followers: (artist.followers || 0) + 1,
            isFollowed: true,
          }
        : artist
    );

    // Update the loaded artists state
    setLoadedArtists(updatedArtists);

    try {
      setFollowLoading((prev) => ({ ...prev, [artistId]: true }));
      setFollowStatus((prev) => ({ ...prev, [artistId]: true }));

      const updatedTimestamp = formatTimestamp();
      const payload = {
        followed_id: loggedInUserId,
        following_id: artistId,
        updatedTimestamp: updatedTimestamp,
      };

      const response = await fetch(
        "https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/follow",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to follow artist");
      }
    } catch (err) {
      // Revert changes if the API call fails
      setLoadedArtists((prevArtists) =>
        prevArtists.map((artist) =>
          artist.user_id === artistId
            ? {
                ...artist,
                followers: Math.max((artist.followers || 0) - 1, 0),
                isFollowed: false,
              }
            : artist
        )
      );
      console.error("Error following the artist:", err);
      setFollowStatus((prev) => ({ ...prev, [artistId]: false }));
    } finally {
      setFollowLoading((prev) => ({ ...prev, [artistId]: false }));
    }
  };

  // const handleFollow = async (artistId) => {
  //     try {
  //         setFollowLoading(prev => ({ ...prev, [artistId]: true }));
  //         setFollowStatus(prev => ({ ...prev, [artistId]: true }));

  //         const updatedTimestamp = formatTimestamp();
  //         const payload = {
  //             followed_id: loggedInUserId,
  //             following_id: artistId,
  //             updatedTimestamp: updatedTimestamp,
  //         };

  //         const response = await fetch(
  //             'https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/follow',
  //             {
  //                 method: 'POST',
  //                 headers: {
  //                     'Content-Type': 'application/json',
  //                 },
  //                 body: JSON.stringify(payload),
  //             }
  //         );

  //         if (!response.ok) {
  //             throw new Error('Failed to follow artist');
  //         }

  //         await delay(500);
  //         const isFollowing = await fetchFollowStatus(artistId);
  //         setFollowStatus(prev => ({ ...prev, [artistId]: isFollowing }));

  //     } catch (err) {
  //         console.error('Error following the artist:', err);
  //         setFollowStatus(prev => ({ ...prev, [artistId]: false }));
  //     } finally {
  //         setFollowLoading(prev => ({ ...prev, [artistId]: false }));
  //     }
  // };

  const handleUnfollow = async (artistId) => {
    // Create a copy of the current loaded artists
    const updatedArtists = loadedArtists.map((artist) =>
      artist.user_id === artistId
        ? {
            ...artist,
            followers: Math.max((artist.followers || 0) - 1, 0),
            isFollowed: false,
          }
        : artist
    );

    // Update the loaded artists state
    setLoadedArtists(updatedArtists);

    try {
      setFollowLoading((prev) => ({ ...prev, [artistId]: true }));
      setFollowStatus((prev) => ({ ...prev, [artistId]: false }));

      const updatedTimestamp = formatTimestamp();
      const payload = {
        followed_id: loggedInUserId,
        following_id: [artistId],
        updatedTimestamp: updatedTimestamp,
      };

      const response = await fetch(
        "https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/unfollow",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to unfollow artist");
      }
    } catch (err) {
      // Revert changes if the API call fails
      setLoadedArtists((prevArtists) =>
        prevArtists.map((artist) =>
          artist.user_id === artistId
            ? {
                ...artist,
                followers: (artist.followers || 0) + 1,
                isFollowed: true,
              }
            : artist
        )
      );
      console.error("Error unfollowing the artist:", err);
      setFollowStatus((prev) => ({ ...prev, [artistId]: true }));
    } finally {
      setFollowLoading((prev) => ({ ...prev, [artistId]: false }));
    }
  };

  // const handleUnfollow = async (artistId) => {
  //     try {
  //         setFollowLoading(prev => ({ ...prev, [artistId]: true }));
  //         setFollowStatus(prev => ({ ...prev, [artistId]: false }));

  //         const updatedTimestamp = formatTimestamp();
  //         const payload = {
  //             followed_id: loggedInUserId,
  //             following_id: [artistId],
  //             updatedTimestamp: updatedTimestamp
  //         };

  //         const response = await fetch(
  //             'https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/unfollow',
  //             {
  //                 method: 'POST',
  //                 headers: {
  //                     'Content-Type': 'application/json',
  //                 },
  //                 body: JSON.stringify(payload),
  //             }
  //         );

  //         if (!response.ok) {
  //             throw new Error('Failed to unfollow artist');
  //         }

  //         await delay(500);
  //         const isFollowing = await fetchFollowStatus(artistId);
  //         setFollowStatus(prev => ({ ...prev, [artistId]: isFollowing }));

  //     } catch (err) {
  //         console.error('Error unfollowing the artist:', err);
  //         setFollowStatus(prev => ({ ...prev, [artistId]: true }));
  //     } finally {
  //         setFollowLoading(prev => ({ ...prev, [artistId]: false }));
  //     }
  // };

  const handleLanguageSelect = (language) => {
    navigate("/language", { state: { language } });
  };

  const handleSongSelect = (selectedSong) => {
    console.log("Playing song ID:", selectedSong.objectID);

    // Format the song metadata
    const song = formatSongMetadata(selectedSong);
    const singleSongPlaylist = [song];

    playPlaylist(singleSongPlaylist);
    playSong(
      song.songStreamUrl,
      song.songName,
      song.stage_name,
      song.coverPageUrl,
      song.composer,
      song.producer,
      song.lyricist,
      song.singer,
      song.languages,
      0,
      song.song_id
    );
  };

  const handleSearchArtistSelect = (artist) => {
    const formattedArtist = {
      user_id: artist.objectID,
      FullName: artist.stageName || artist.fullName,
      profilePhotoUrl: artist.profilePhotoUrl,
    };
    navigate("/artist", { state: { artist: formattedArtist } });
  };

  const handleTopArtistSelect = (artist) => {
    const formattedArtist = {
      user_id: artist.user_id,
      FullName: artist.StageName || artist.FullName,
      profilePhotoUrl: artist.profilePhotoUrl,
    };
    navigate("/artist", { state: { artist: formattedArtist } });
  };

  return (
    <Box className="explore-page">
      <SideBar />
      <Box className="explore-body">
        <InstantSearch searchClient={searchClient} indexName="song_index">
          <Box className="search-container" sx={{ ml: 14 }}>
            <SearchBox
              translations={{
                placeholder: "Search Songs / Artists",
                submitTitle: "",
              }}
              submitIconComponent={() => <IoMdSearch className="search-icon" />}
              resetIconComponent={() => null}
              className="algolia-searchbox"
              onChange={() => setShowSearchResults(true)}
              onSubmit={(e) => {
                e.preventDefault();
                setShowSearchResults(true);
              }}
            />
            {showSearchResults && (
              <Paper className="search-results" elevation={3}>
                <Results
                  onSongSelect={handleSongSelect}
                  onArtistSelect={handleSearchArtistSelect}
                  onClose={() => setShowSearchResults(false)}
                />
              </Paper>
            )}
          </Box>
        </InstantSearch>

        <Box className="language-grid" sx={{ ml: 14 }}>
          {[
            "Bengali",
            "English",
            "Gujarati",
            "Hindi",
            "Malayalam",
            "Marathi",
            "Punjabi",
            "Sanskrit",
            "Tamil",
          ].map((category, index) => (
            <Button
              key={index}
              variant="contained"
              onClick={() => handleLanguageSelect(category)}
              className="language-button"
            >
              {category}
            </Button>
          ))}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            ml: "120px",
            gap: 2,
            mb: 2,
            mt: -2.5,
          }}
        >
          <Typography variant="h6" className="section-title">
            Top Artists
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 0,
              ml: 62,
            }}
          >
            <Button
              onClick={() =>
                setCurrentIndex((prev) =>
                  prev === 0 ? loadedArtists.length - 1 : prev - 1
                )
              }
              disableRipple
              sx={{
                minWidth: "32px",
                height: "32px",
                padding: "4px",
                borderRadius: "50%",
                // backgroundColor: 'transparent',
                // '&:hover': {
                //     backgroundColor: 'rgba(255, 255, 255, 0.1)',
                // },
              }}
            >
              <Box sx={{ position: "relative" }}>
                <img
                  src={Ellipse_1925}
                  alt="Previous"
                  style={{
                    width: "35px",
                    height: "36px",
                    backgroundColor: "#707070 !important",
                    borderRadius: "50%",
                  }}
                />
                <img
                  src={Vector2}
                  alt="Next"
                  style={{
                    position: "absolute",
                    top: "40%",
                    left: "45%",
                    transform: "translate(-50%, -50%)",
                    width: "10px",
                    height: "18px",
                    pointerEvents: "none",
                  }}
                />
              </Box>
            </Button>
            <Button
              onClick={() =>
                setCurrentIndex((prev) => (prev + 1) % loadedArtists.length)
              }
              disableRipple
              sx={{
                minWidth: "32px",
                height: "32px",
                padding: "4px",
                borderRadius: "50%",
                backgroundColor: "transparent",
                // '&:hover': {
                //     backgroundColor: 'rgba(255, 255, 255, 0.1)',
                //     width: '35px',
                //         height: '36px',
                // },
              }}
            >
              <Box sx={{ position: "relative" }}>
                <img
                  src={Ellipse_1925}
                  alt="Next"
                  style={{
                    width: "35px",
                    height: "36px",
                    backgroundColor: "#707070 !important",
                    borderRadius: "50%",
                  }}
                />
                <img
                  src={Vector1}
                  alt="Next"
                  style={{
                    position: "absolute",
                    top: "40%",
                    left: "54%",
                    transform: "translate(-50%, -50%)",
                    width: "10px",
                    height: "18px",
                    pointerEvents: "none",
                  }}
                />
              </Box>
            </Button>
          </Box>
        </Box>

        <Box className="artist-container">
          {/* <Typography variant="h6" className="section-title">
                        Top Artists
                    </Typography> */}

          <Box
            className="artist-scroll-container"
            //    onMouseEnter={() => setIsHovering(true)}
            //    onMouseLeave={() => setIsHovering(false)}
          >
            <Box
              className="artist-spotlight"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
                transition: "transform 0.5s ease-in-out",
                cursor: "pointer",
              }}
            >
              {loadedArtists.slice(0, 10).map((artist) => (
                <Box
                  key={artist.user_id}
                  className="artist-card"
                  sx={{
                    backgroundImage: `url(${
                      artist.profilePhotoUrl || coverpage
                    })`,
                    backgroundPosition: "center top 18%",
                    backgroundSize: "cover",
                  }}
                  onClick={() => handleTopArtistSelect(artist)}
                >
                  <Box className="artist-overlay">
                    <Box className="artist-details">
                      <Box className="artist-info">
                        <Typography
                          className="artist-name"
                          sx={{ fontSize: "20px !important", fontWeight: 700 }}
                        >
                          {artist.StageName || artist.FullName}
                        </Typography>
                        <Typography
                          className="artist-followers"
                          sx={{ fontSize: "12px !important", fontWeight: 400 }}
                        >
                          {artist.followers || 0} Followers
                        </Typography>
                      </Box>
                      {loggedInUserId !== artist.user_id && (
                        <Button
                          className={`follow-button ${
                            followStatus[artist.user_id] ? "following" : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (followLoading[artist.user_id]) return;

                            if (followStatus[artist.user_id]) {
                              handleUnfollow(artist.user_id);
                            } else {
                              handleFollow(artist.user_id);
                            }
                          }}
                          disabled={followLoading[artist.user_id]}
                        >
                          {followLoading[artist.user_id]
                            ? "Loading..."
                            : followStatus[artist.user_id]
                            ? "Unfollow"
                            : "Follow +"}
                        </Button>
                      )}
                      {/* <Button
                                                className={`follow-button ${followStatus[artist.user_id] ? 'following' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (followLoading[artist.user_id]) return;
                                                    
                                                    if (followStatus[artist.user_id]) {
                                                        handleUnfollow(artist.user_id);
                                                    } else {
                                                        handleFollow(artist.user_id);
                                                    }
                                                }}
                                                disabled={followLoading[artist.user_id]}
                                                
                                            >
                                                {followLoading[artist.user_id] ? 'Loading...' : 
                                                 followStatus[artist.user_id] ? 'Unfollow' : 'Follow +'}
                                            </Button> */}
                    </Box>
                  </Box>
                </Box>
              ))}
              {isLoading && loadedArtists.length === 0 ? (
                <Typography>Loading artists...</Typography>
              ) : error ? (
                <Typography color="error">{error}</Typography>
              ) : null}
            </Box>
            <Box className="artist-dots">
              {loadedArtists.slice(0, 10).map((_, idx) => (
                <Box
                  key={idx}
                  className={`artist-dot ${
                    idx === currentIndex ? "active" : ""
                  }`}
                  onClick={() => setCurrentIndex(idx)}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
