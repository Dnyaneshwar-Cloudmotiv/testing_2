import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const playerRef = useRef(null);

  // Initialize states with localStorage values if available
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(() => {
    return localStorage.getItem("currentSong") || null;
  });
  const [currentSongId, setCurrentSongId] = useState(() => {
    return localStorage.getItem("currentSongId") || null;
  });
  const [currentCover, setCurrentCover] = useState(() => {
    return localStorage.getItem("currentCover") || null;
  });
  const [currentTitle, setCurrentTitle] = useState(() => {
    return localStorage.getItem("currentTitle") || null;
  });
  const [currentArtist, setCurrentArtist] = useState(() => {
    return localStorage.getItem("currentArtist") || null;
  });
  const [currentSinger, setCurrentSinger] = useState(() => {
    return localStorage.getItem("currentSinger") || null;
  });
  const [currentComposer, setCurrentComposer] = useState(() => {
    return localStorage.getItem("currentComposer") || null;
  });
  const [currentProducer, setCurrentProducer] = useState(() => {
    return localStorage.getItem("currentProducer") || null;
  });
  const [currentLyricist, setCurrentLyricist] = useState(() => {
    return localStorage.getItem("currentLyricist") || null;
  });
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem("currentLanguage") || null;
  });
  const [playlist, setPlaylist] = useState(() => {
    const savedPlaylist = localStorage.getItem("playlist");
    return savedPlaylist ? JSON.parse(savedPlaylist) : [];
  });
  const [originalPlaylist, setOriginalPlaylist] = useState(() => {
    const savedOriginalPlaylist = localStorage.getItem("originalPlaylist");
    return savedOriginalPlaylist ? JSON.parse(savedOriginalPlaylist) : [];
  });
  const [currentIndex, setCurrentIndex] = useState(() => {
    return parseInt(localStorage.getItem("currentIndex")) || 0;
  });
  const [isReacted, setIsReacted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isShuffled, setIsShuffled] = useState(() => {
    return localStorage.getItem("isShuffled") === "true";
  });
  const [repeatMode, setRepeatMode] = useState(() => {
    return parseInt(localStorage.getItem("repeatMode")) || 0;
  });

  const [autoplayEnabled, setAutoplayEnabled] = useState(() => {
    // Get from localStorage with a default of true
    return localStorage.getItem("isAutorelatedtrackenable") === "false"
      ? false
      : true;
  });

  useEffect(() => {
    const updateAutoplayState = () => {
      const autoplayStatus = localStorage.getItem("isAutorelatedtrackenable");
      setAutoplayEnabled(autoplayStatus === "false" ? false : true);
    };

    // Listen for autoplay changes
    window.addEventListener("autoplayStatusChanged", updateAutoplayState);
    return () =>
      window.removeEventListener("autoplayStatusChanged", updateAutoplayState);
  }, []);

  useEffect(() => {
    const handleSharedSong = async (event) => {
      const songId = event.detail;
      try {
        const response = await fetch(
          `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/song/info?song_id=${songId}`
        );
        const songInfo = await response.json();
        const formattedSongData = {
          songStreamUrl: songInfo.songStreamUrl.S,
          songName: songInfo.songName.S,
          stage_name: songInfo.stage_name.S || songInfo.FullName.S,
          coverPageUrl: songInfo.coverPageUrl.S,
          id: songId,
        };
        playSongWithData(formattedSongData);
      } catch (error) {
        console.error("Error loading shared song:", error);
      }
    };

    window.addEventListener("playSharedSong", handleSharedSong);
    return () => window.removeEventListener("playSharedSong", handleSharedSong);
  }, []);

  // Save to localStorage whenever these values change
  useEffect(() => {
    if (currentSong) {
      localStorage.setItem("currentSong", currentSong);
      localStorage.setItem("currentSongId", currentSongId);
      localStorage.setItem("currentCover", currentCover);
      localStorage.setItem("currentTitle", currentTitle);
      localStorage.setItem("currentArtist", currentArtist);
      localStorage.setItem("currentSinger", currentSinger);
      localStorage.setItem("currentComposer", currentComposer);
      localStorage.setItem("currentProducer", currentProducer);
      localStorage.setItem("currentLyricist", currentLyricist);
      localStorage.setItem("currentIndex", currentIndex.toString());
      localStorage.setItem("currentLanguage", currentLanguage);
      localStorage.setItem("playlist", JSON.stringify(playlist));
      localStorage.setItem(
        "originalPlaylist",
        JSON.stringify(originalPlaylist)
      );
      localStorage.setItem("isShuffled", isShuffled.toString());
      localStorage.setItem("repeatMode", repeatMode.toString());
    } else {
      localStorage.removeItem("currentSong");
      localStorage.removeItem("currentSongId");
      localStorage.removeItem("currentCover");
      localStorage.removeItem("currentTitle");
      localStorage.removeItem("currentArtist");
      localStorage.removeItem("currentIndex");
      localStorage.removeItem("currentSinger");
      localStorage.removeItem("currentComposer");
      localStorage.removeItem("currentProducer");
      localStorage.removeItem("currentLyricist");
      localStorage.removeItem("currentLanguage");
      localStorage.removeItem("playlist");
      localStorage.removeItem("originalPlaylist");
      localStorage.removeItem("isShuffled");
      localStorage.removeItem("repeatMode");
    }
  }, [
    currentSong,
    currentSongId,
    currentLanguage,
    currentCover,
    currentTitle,
    currentArtist,
    currentIndex,
    playlist,
    originalPlaylist,
    currentSinger,
    currentComposer,
    currentLyricist,
    currentProducer,
    isShuffled,
    repeatMode,
  ]);

  // Fetch autoplay status on mount and when currentSongId changes
  useEffect(() => {
    const fetchAutoplayStatus = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        const response = await fetch(
          `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/artist/viewprofile?user_id=${userId}`
        );

        if (response.ok) {
          const data = await response.json();
          setAutoplayEnabled(
            data.Item?.isAutorelatedtrackenable?.BOOL !== false
          );
        }
      } catch (error) {
        console.error("Error fetching autoplay status:", error);
        setAutoplayEnabled(true); // Default to true if error
      }
    };

    fetchAutoplayStatus();
  }, [currentSongId]);

  // Fetch reaction/favorite status when song changes
  useEffect(() => {
    const fetchReactionStatus = async () => {
      if (!currentSongId) return;

      try {
        const userId = localStorage.getItem("user_id") || "1";
        const response = await fetch(
          `https://2a11hm9ls1.execute-api.ap-south-1.amazonaws.com/voizfavorite/song/favoriteReaction?song_id=${currentSongId}&user_id=${userId}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const status = data[0];
            setIsReacted(status.reaction?.BOOL || false);
            setIsFavorite(status.favorite?.BOOL || false);
          } else {
            setIsReacted(false);
            setIsFavorite(false);
          }
        }
      } catch (error) {
        console.error("Error fetching reaction status:", error);
        setIsReacted(false);
        setIsFavorite(false);
      }
    };

    fetchReactionStatus();
  }, [currentSongId]);

  const saveToHistory = async (songId) => {
    if (!songId) return;

    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    const formatTimestamp = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");

      return `${year}${month}${day}_${hours}${minutes}${seconds}`;
    };

    const timestamp = formatTimestamp();

    try {
      const response = await fetch(
        "https://3ujjsgu42d.execute-api.ap-south-1.amazonaws.com/history/save/history",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            song_id: songId,
            user_id: userId,
            updatedTimestamp: timestamp,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save to history");
      }
    } catch (error) {
      console.error("Error saving to history:", error);
    }
  };

  const extractSongId = (songData) => {
    if (!songData) return null;
    return songData.id || songData.song_id || songData.objectID || null;
  };

  const playSong = async (
    songUrl,
    title,
    artist,
    coverUrl,
    composer,
    producer,
    lyricist,
    singer,
    language,
    playlistIndex = -1,
    songId = null,
    skipHistory = false,
    shouldAutoPlay = true
  ) => {
    if (!songUrl) return;

    setCurrentSong(songUrl);
    setCurrentCover(coverUrl);
    setCurrentTitle(title);
    setCurrentArtist(artist);
    setCurrentSongId(songId);
    setCurrentComposer(composer);
    setCurrentProducer(producer);
    setCurrentLyricist(lyricist);
    setCurrentSinger(singer);
    setCurrentLanguage(language);
    
    // Only set isPlaying to true if shouldAutoPlay is true and autoplay is enabled
    setIsPlaying(shouldAutoPlay && autoplayEnabled);

    if (playlistIndex >= 0 && playlistIndex < playlist.length) {
      setCurrentIndex(playlistIndex);
    }

    // Save to history only if skipHistory is false
    if (songId && !skipHistory) {
      await saveToHistory(songId);
    }
  };

  const playSongWithData = async (
    songData,
    playlistIndex = -1,
    skipHistory = false,
    shouldAutoPlay = true
  ) => {
    if (!songData || !songData.songStreamUrl) return;

    // Determine artist name - use stage_name if available, otherwise use FullName
    const artistName =
      songData.stage_name || songData.FullName || "Unknown Artist";

    const songId = extractSongId(songData);
    await playSong(
      songData.songStreamUrl,
      songData.songName,
      songData.FullName, // Use the determined artist name
      songData.coverPageUrl,
      songData.composer,
      songData.producer,
      songData.lyricist,
      songData.singer,
      songData.languages,
      playlistIndex,
      songId,
      skipHistory,
      shouldAutoPlay
    );
    // Only set isPlaying to true if shouldAutoPlay is true
    setIsPlaying(shouldAutoPlay && autoplayEnabled);
  };

  // Helper function to shuffle array
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const playPlaylist = async (songs, startIndex = 0) => {
    if (!Array.isArray(songs) || songs.length === 0) return;

    setOriginalPlaylist(songs);

    // If shuffle is enabled, shuffle the new playlist while keeping the selected song first
    if (isShuffled) {
      const selectedSong = songs[startIndex];
      const remainingSongs = songs.filter((_, index) => index !== startIndex);
      const shuffledRemaining = shuffleArray(remainingSongs);
      const shuffledPlaylist = [selectedSong, ...shuffledRemaining];
      setPlaylist(shuffledPlaylist);
      setCurrentIndex(0);
    } else {
      setPlaylist(songs);
      setCurrentIndex(startIndex);
    }

    // Play the selected song, setting skipHistory to true since we'll save history in handleSongSelect
    const selectedSong = songs[startIndex];
    await playSongWithData(selectedSong, startIndex, true);
  };

  const toggleShuffle = () => {
    if (!isShuffled) {
      // Enable shuffle
      const currentSong = playlist[currentIndex];
      const remainingSongs = playlist.filter(
        (_, index) => index !== currentIndex
      );
      const shuffledRemaining = shuffleArray(remainingSongs);
      const newPlaylist = [currentSong, ...shuffledRemaining];

      setPlaylist(newPlaylist);
      setCurrentIndex(0);
      setIsShuffled(true);
    } else {
      // Disable shuffle and restore original order
      const currentSong = playlist[currentIndex];
      const currentSongOriginalIndex = originalPlaylist.findIndex(
        (song) => extractSongId(song) === extractSongId(currentSong)
      );

      setPlaylist(originalPlaylist);
      setCurrentIndex(
        currentSongOriginalIndex !== -1 ? currentSongOriginalIndex : 0
      );
      setIsShuffled(false);
    }
  };

  const toggleRepeat = () => {
    setRepeatMode((prevMode) => (prevMode + 1) % 3); // 0: no repeat, 1: repeat all, 2: repeat one
  };

  const playNext = async (shouldAutoPlay = true) => {
    if (playlist.length === 0) return;

    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIndex);

    const nextSong = playlist[nextIndex];
    await playSongWithData(nextSong, nextIndex, false, shouldAutoPlay);
    // playSongWithData will handle setting isPlaying based on shouldAutoPlay and autoplayEnabled
  };

  const playPrevious = async () => {
    if (playlist.length === 0) return;

    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentIndex(prevIndex);

    const prevSong = playlist[prevIndex];
    await playSongWithData(prevSong, prevIndex, false, autoplayEnabled);
    setIsPlaying(autoplayEnabled); // Respect autoplay setting
  };

  const updateCurrentSongMetadata = (metadata) => {
    if (!metadata) return;

    const songId = extractSongId(metadata);

    if (metadata.songStreamUrl) setCurrentSong(metadata.songStreamUrl);
    if (songId) setCurrentSongId(songId);
    if (metadata.coverPageUrl) setCurrentCover(metadata.coverPageUrl);
    if (metadata.songName) setCurrentTitle(metadata.songName);
    if (metadata.stage_name) setCurrentArtist(metadata.stage_name);
  };

  const handleEnded = async () => {
    if (playlist.length === 0) return;

    if (repeatMode === 2) {
      // Repeat current song
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        setIsPlaying(autoplayEnabled);
      }
    } else if (repeatMode === 1) {
      // Repeat all mode
      if (currentIndex === playlist.length - 1) {
        // If it's the last song, start from the beginning
        const firstSong = playlist[0];
        await playSongWithData(firstSong, 0, false, autoplayEnabled);
        // playSongWithData will handle setting isPlaying based on autoplayEnabled
      } else {
        await playNext(autoplayEnabled);
      }
    } else if (autoplayEnabled) {
      // Autoplay is enabled
      if (currentIndex === playlist.length - 1) {
        // If it's the last song and we're not repeating, stop
        setIsPlaying(false);
      } else {
        await playNext(true);
      }
    } else {
      // Autoplay is disabled, just load the next song but don't play it
      if (currentIndex < playlist.length - 1) {
        await playNext(false);
      } else {
        setIsPlaying(false);
      }
    }
  };

  const clearCurrentSong = () => {
    setCurrentSong(null);
    setCurrentSongId(null);
    setCurrentCover(null);
    setCurrentTitle(null);
    setCurrentArtist(null);
    setCurrentComposer(null);
    setCurrentLyricist(null);
    setCurrentProducer(null);
    setCurrentSinger(null);
    setCurrentLanguage(null);
    setIsPlaying(false);
    setCurrentIndex(0);
    setIsReacted(false);
    setIsFavorite(false);
    setPlaylist([]);
    setOriginalPlaylist([]);
    // Note: We don't reset isShuffled here to maintain the shuffle state
    setRepeatMode(0);
  };

  return (
    <PlayerContext.Provider
      value={{
        isPlaying,
        currentSong,
        currentSongId,
        currentCover,
        currentTitle,
        currentArtist,
        playlist,
        originalPlaylist,
        currentComposer,
        currentLanguage,
        currentProducer,
        currentLyricist,
        currentSinger,
        currentIndex,
        isReacted,
        isFavorite,
        isShuffled,
        repeatMode,
        autoplayEnabled,
        playSong,
        playSongWithData,
        playPlaylist,
        toggleShuffle,
        toggleRepeat,
        playNext,
        playPrevious,
        setIsPlaying,
        updateCurrentSongMetadata,
        clearCurrentSong,
        setIsReacted,
        setIsFavorite,
        handleEnded,
        playerRef,
        saveToHistory,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerContext;
