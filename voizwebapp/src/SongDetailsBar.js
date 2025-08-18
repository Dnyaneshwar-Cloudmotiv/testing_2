import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Button,
  Menu,
  MenuItem,
  CircularProgress,
  Divider,
  styled,
} from "@mui/material";
import { usePlayer } from "./PlayerContext";
import { useComments } from "./CommentsContext";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import LogoutIcon from "@mui/icons-material/Logout";
import SendIcon from "@mui/icons-material/Send";
import { Bell } from "lucide-react";
import { Badge } from "@mui/material";

// Assets
import profile from "./assets/AccountSettings.png";
import feedback from "./assets/feedback.png";
import emptyReaction from "./assets/reaction_empty.png";
import smile from "./assets/loved_tracks1.png";
import share from "./assets/share1.png";
import report from "./assets/report.png";
import logo from "./assets/new-logo.png";
import menuIcon from "./assets/menu.png";

import { useNavigate } from "react-router-dom";
import "./SongDetailsBar.css";
import Report from "./Report";
import { Icon } from "lucide-react";
import CloseIcon from "@mui/icons-material/Close";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

// Utility function to format text in proper case
const formatDisplayText = (text) => {
  if (!text) return "";
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const SongDetailsBar = ({ onClose }) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") !== "false";
  });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [reportVisible, setReportVisible] = useState(false);
  const prevSongIdRef = useRef();

  const [lastMetricsUpdate, setLastMetricsUpdate] = useState(Date.now());

  const [isViewMoreComments, setIsViewMoreComments] = useState(false);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);

  // State to track if any dialog is open for blur effect
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);

  const {
    currentCover,
    currentTitle,
    currentLanguage,
    currentArtist,
    currentSong,
    currentSongId,
    currentSinger,
    currentComposer,
    currentProducer,
    currentLyricist,
    resetPlayerState,
    playSong,
    currentIndex,
  } = usePlayer();

  const {
    showComments,
    comments,
    isLoading,
    postComment,
    fetchComments,
    setShowComments,
  } = useComments();

  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [songMetrics, setSongMetrics] = useState({
    favoriteCount: 0,
    reactionCount: 0,
    playCount: "0",
    playlistCount: "0",
    shareSongCount: "0",
  });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);

  // const fullName =
  //   formatDisplayText(localStorage.getItem("FullName")) || "User";
  // const stageName = formatDisplayText(localStorage.getItem("StageName")) || "";
  const [fullName, setFullName] = useState(
    formatDisplayText(localStorage.getItem("FullName")) || "User"
  );
  const [stageName, setStageName] = useState(
    formatDisplayText(localStorage.getItem("StageName")) || ""
  );

  // const profilePhotoUrl = localStorage.getItem("ProfilePhotoUrl");

  const [profilePhotoUrl, setProfilePhotoUrl] = useState(localStorage.getItem("ProfilePhotoUrl") || "");

  const [openShareDialog, setOpenShareDialog] = useState(false);
  const [shareableLink, setShareableLink] = useState("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  const [category, setCategory] = useState(null);
  // Add this after the isDialogOpen state
  const [isMenuOpen, setIsMenuOpen] = useState(false);


  useEffect(() => {
    // Function to update username from localStorage
    const updateUsername = () => {
      const newFullName = formatDisplayText(localStorage.getItem("FullName")) || "User";
      const newStageName = formatDisplayText(localStorage.getItem("StageName")) || "";
      if (newFullName !== fullName) {
        setFullName(newFullName);
      }
      if (newStageName !== stageName) {
        setStageName(newStageName);
      }
    };
  
    // Listen for storage events (triggered when localStorage changes in another tab/window)
    window.addEventListener("storage", (event) => {
      if (event.key === "FullName" || event.key === "StageName") {
        updateUsername();
      }
    });
  
    // Since the storage event doesn't fire in the same tab, manually check for changes
    const intervalId = setInterval(updateUsername, 1000); // Check every 1 second
  
    // Initial check
    updateUsername();
  
    // Cleanup
    return () => {
      window.removeEventListener("storage", updateUsername);
      clearInterval(intervalId);
    };
  }, [fullName, stageName]);
  
  useEffect(() => {
    // Function to update profile photo URL from localStorage
    const updateProfilePhoto = () => {
      const newPhotoUrl = localStorage.getItem("ProfilePhotoUrl") || "";
      if (newPhotoUrl !== profilePhotoUrl) {
        setProfilePhotoUrl(newPhotoUrl);
      }
    };
  
    // Listen for storage events (triggered when localStorage changes in another tab/window)
    window.addEventListener("storage", (event) => {
      if (event.key === "ProfilePhotoUrl") {
        updateProfilePhoto();
      }
    });
  
    // Since the storage event doesn't fire in the same tab, manually check for changes
    const intervalId = setInterval(updateProfilePhoto, 1000); // Check every 1 second
  
    // Initial check
    updateProfilePhoto();
  
    // Cleanup
    return () => {
      window.removeEventListener("storage", updateProfilePhoto);
      clearInterval(intervalId);
    };
  }, [profilePhotoUrl]);

  // Apply blur effect when any dialog opens
  useEffect(() => {
    const shouldApplyBlur = isDialogOpen;
    const shouldApplyBlur1 = isMenuOpen;
    const shouldApplyBlur2 = isNotificationMenuOpen;
    // Apply blur to content container but not sidebar
    const contentContainer = document.querySelector(".content-container");
    if (contentContainer && shouldApplyBlur) {
      contentContainer.classList.add("dialog-open");
    } else if (contentContainer) {
      contentContainer.classList.remove("dialog-open");
    }

    // Apply blur to content section
    const contentSection = document.querySelector(".content-section");
    if (contentSection && shouldApplyBlur) {
      contentSection.classList.add("dialog-open");
    } else if (contentSection) {
      contentSection.classList.remove("dialog-open");
    }

    // Apply blur to drawer content (HomePage) but not sidebar
    const drawer = document.querySelector(".drawer");
    if (drawer && shouldApplyBlur) {
      drawer.classList.add("dialog-open");
    } else if (drawer) {
      drawer.classList.remove("dialog-open");
    }

    // Apply blur to form container (SongBasket)
    const formContainer = document.querySelector(".formContainer");
    if (formContainer && shouldApplyBlur) {
      formContainer.classList.add("dialog-open");
    } else if (formContainer) {
      formContainer.classList.remove("dialog-open");
    }

    const accountContainer = document.querySelector(".account");
    if (accountContainer && shouldApplyBlur) {
      accountContainer.classList.add("dialog-open");
    } else if (accountContainer) {
      accountContainer.classList.remove("dialog-open");
    }

    const profileContent = document.querySelector(".profile");
    if (profileContent && shouldApplyBlur) {
      profileContent.classList.add("dialog-open");
    } else if (profileContent) {
      profileContent.classList.remove("dialog-open");
    }

    const yourUploadsContent = document.querySelector(".admin-card");
    if (yourUploadsContent && shouldApplyBlur) {
      yourUploadsContent.classList.add("dialog-open");
    } else if (yourUploadsContent) {
      yourUploadsContent.classList.remove("dialog-open");
    }
    const exploreContent = document.querySelector(".explore-body");
    if (exploreContent && shouldApplyBlur) {
      exploreContent.classList.add("dialog-open");
    } else if (exploreContent) {
      exploreContent.classList.remove("dialog-open");
    }

    // Add blur to key Explore page elements
    const languageGrid = document.querySelector(".language-grid");
    if (languageGrid && shouldApplyBlur) {
      languageGrid.classList.add("dialog-open");
    } else if (languageGrid) {
      languageGrid.classList.remove("dialog-open");
    }

    const artistContainer = document.querySelector(".artist-container");
    if (artistContainer && shouldApplyBlur) {
      artistContainer.classList.add("dialog-open");
    } else if (artistContainer) {
      artistContainer.classList.remove("dialog-open");
    }

    const searchContainer = document.querySelector(".search-container");
    if (searchContainer && shouldApplyBlur) {
      searchContainer.classList.add("dialog-open");
    } else if (searchContainer) {
      searchContainer.classList.remove("dialog-open");
    }

    const detailsContent = document.querySelector(".for-blur");
    if ((detailsContent && shouldApplyBlur1) || shouldApplyBlur2) {
      detailsContent.classList.add("dialog-open");
    } else if (detailsContent) {
      detailsContent.classList.remove("dialog-open");
    }

    // const SongContent = document.querySelector(".for-blur");
    // if (SongContent && shouldApplyBlur) {
    //   detailsContent1.classList.add("dialog-open");
    // } else if (detailsContent1) {
    //   detailsContent1.classList.remove("dialog-open");
    // }

    const feedbackPage = document.querySelector(".feedback");
    if (feedbackPage && shouldApplyBlur) {
      feedbackPage.classList.add("dialog-open");
    } else if (feedbackPage) {
      feedbackPage.classList.remove("dialog-open");
    }
    // Cleanup on unmount
    return () => {
      if (contentContainer) contentContainer.classList.remove("dialog-open");
      if (contentSection) contentSection.classList.remove("dialog-open");
      if (drawer) drawer.classList.remove("dialog-open");
      if (formContainer) formContainer.classList.remove("dialog-open");
      if (accountContainer) accountContainer.classList.remove("dialog-open");
      if (profileContent) profileContent.classList.remove("dialog-open");
      if (yourUploadsContent)
        yourUploadsContent.classList.remove("dialog-open");
      if (exploreContent) exploreContent.classList.remove("dialog-open");
      if (languageGrid) languageGrid.classList.remove("dialog-open");
      if (artistContainer) artistContainer.classList.remove("dialog-open");
      if (searchContainer) searchContainer.classList.remove("dialog-open");
      if (detailsContent) detailsContent.classList.remove("dialog-open");

      if (feedbackPage) feedbackPage.classList.remove("dialog-open");
    };
  }, [isDialogOpen, isMenuOpen, isNotificationMenuOpen]);

  useEffect(() => {
    const storedCategory = localStorage.getItem("Category");
    setCategory(storedCategory);
  }, []);

  useEffect(() => {
    if (showComments) {
      setIsCollapsed(false);
      setIsCommentsExpanded(true);
    } else if (!showComments && isCommentsExpanded) {
      setIsCommentsExpanded(false);
    }
  }, [showComments]);

  // Add these methods inside the component
  const handleShareClick = async () => {
    if (currentSongId) {
      setIsGeneratingLink(true);
      setOpenShareDialog(true);
      setIsDialogOpen(true); // Set dialog open for blur effect

      try {
        // First fetch the song info
        const songInfoResponse = await fetch(
          `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/song/info?song_id=${currentSongId}`
        );
        const songInfo = await songInfoResponse.json();

        // Extract the cover page URL from the response
        const coverPageUrl = songInfo?.coverPageUrl?.S;
        const songTitle = songInfo?.songName?.S;

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
                link: `${window.location.origin}/song/${currentSongId}`,
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
          const fallbackUrl = `${window.location.origin}/song/${currentSongId}`;
          setShareableLink(
            `Hey, see what I found! Listen to this amazing song 😍 on VOIZ! Just download the app, listen and enjoy! ${fallbackUrl}`
          );
        }
      } catch (err) {
        console.error("Failed to generate link:", err);
        const fallbackUrl = `${window.location.origin}/song/${currentSongId}`;
        setShareableLink(
          `Hey, see what I found! Listen to this amazing song 😍 on VOIZ! Just download the app, listen and enjoy! ${fallbackUrl}`
        );
      } finally {
        setIsGeneratingLink(false);
      }
    }
  };

  const handleCopyShare = async () => {
    if (!shareableLink) return;

    try {
      await navigator.clipboard.writeText(shareableLink);
      setShowCopyAlert(true);
      setOpenShareDialog(false);
      setIsDialogOpen(false); // Remove blur effect
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleCloseAlert = (event, reason) => {
    if (reason === "clickaway") return;
    setShowCopyAlert(false);
  };

  useEffect(() => {
    // Reset view more state when comments are collapsed
    if (!isCommentsExpanded) {
      setIsViewMoreComments(false);
    }
  }, [isCommentsExpanded]);

  useEffect(() => {
    const fetchSongInfo = async () => {
      if (currentSongId) {
        try {
          const response = await fetch(
            `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/song/info?song_id=${currentSongId}`
          );
          if (response.ok) {
            const data = await response.json();

            // Determine artist name - use stage_name if available, otherwise use FullName
            const artistName =
              data.stage_name?.S ||
              data.FullName?.S ||
              currentArtist ||
              "Unknown Artist";

            playSong(
              currentSong,
              currentTitle,
              data.FullName?.S || fullName,
              currentCover,
              data.composer?.S || currentComposer,
              data.producer?.S || currentProducer,
              data.lyricist?.S || currentLyricist,
              data.singer?.S || currentSinger,
              currentLanguage,
              currentIndex,
              currentSongId
            );
          }
        } catch (error) {
          console.error("Error fetching song info:", error);
        }
      }
    };

    fetchSongInfo();
  }, [
    currentSongId,
    currentSinger,
    currentComposer,
    currentLyricist,
    currentProducer,
  ]);

  useEffect(() => {
    if (currentSong && isCollapsed === "true") {
      setIsCollapsed(true);
    }
  }, [currentSong]);

  useEffect(() => {
    // Function to handle storage changes
    const handleStorageChange = async (e) => {
      if (e.key === "metricsUpdate") {
        const updateData = JSON.parse(
          localStorage.getItem("metricsUpdate") || "{}"
        );
        // Only update the specific metric that changed
        if (updateData.type === "reaction") {
          setSongMetrics((prev) => ({
            ...prev,
            reactionCount: prev.reactionCount + (updateData.increment ? 1 : -1),
          }));
        } else if (updateData.type === "favorite") {
          setSongMetrics((prev) => ({
            ...prev,
            favoriteCount: prev.favoriteCount + (updateData.increment ? 1 : -1),
          }));
        }
      }
    };

    // Listen for storage events
    window.addEventListener("storage", handleStorageChange);

    const interval = setInterval(() => {
      const latestUpdate = localStorage.getItem("metricsUpdate");
      if (latestUpdate) {
        const updateData = JSON.parse(latestUpdate);
        if (
          updateData.timestamp > lastMetricsUpdate &&
          updateData.songId === currentSongId
        ) {
          handleStorageChange({ key: "metricsUpdate" });
          setLastMetricsUpdate(updateData.timestamp);
        }
      }
    }, 100);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [lastMetricsUpdate, currentSongId]);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isCollapsed);
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      if (isCollapsed) {
        mainContent.classList.add("with-collapsed-details");
      } else {
        mainContent.classList.remove("with-collapsed-details");
      }
    }
  }, [isCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      // Dispatch event to notify HomePage
      window.dispatchEvent(
        new CustomEvent("sidebarStateChange", {
          detail: newState ? "collapsed" : "expanded",
        })
      );
      return newState;
    });
  };

  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
    setIsMenuOpen(true);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setIsMenuOpen(false);
  };

  const handleSettingsClick = () => {
    navigate("/profile");
    setMenuAnchor(null);
    setIsMenuOpen(false);
  };

  const handleFeedbackClick = () => {
    navigate("/feedback");
    setMenuAnchor(null);
    setIsMenuOpen(false);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleAddComment();
    }
  };

  const handleLogoutClick = () => {
    setSignOutDialogOpen(true);
    setIsDialogOpen(true); // Set dialog open for blur effect
    setMenuAnchor(null); // Close the menu
    setIsMenuOpen(false);
    
  };

  const { clearCurrentSong } = usePlayer();

  const handleLogoutConfirm = async () => {
    try {
      // Clear all localStorage (auth + player)
      localStorage.clear();
  
      // Clear player state
      clearCurrentSong();
  
      // Sign out from Firebase
      try {
        const { getAuth, signOut } = await import("firebase/auth");
        const auth = getAuth();
        await signOut(auth);
        console.log("Successfully signed out from Firebase");
      } catch (fbError) {
        console.error("Firebase sign out error:", fbError);
      }
  
      // Force page reload (optional but ensures fresh state)
      window.location.href = "/loginpage";
      // OR if using navigate:
      // navigate("/loginpage", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/loginpage";
    }
  };
  

  // const handleLogoutConfirm = async () => {
  //   try {
  //     // Clear localStorage
  //     localStorage.clear();

  //     // Sign out from Firebase
  //     try {
  //       // Import needed Firebase functions
  //       const { getAuth, signOut } = await import("firebase/auth");
  //       const auth = getAuth();
  //       await signOut(auth);
  //       console.log("Successfully signed out from Firebase");
  //     } catch (fbError) {
  //       console.error("Firebase sign out error:", fbError);
  //       // Continue with logout even if Firebase signout fails
  //     }

  //     // Navigate to login page
  //     navigate("/loginpage");

  //     // Reset player state if function exists
  //     if (typeof resetPlayerState === "function") {
  //       resetPlayerState();
  //     }
  //   } catch (error) {
  //     console.error("Logout error:", error);
  //     navigate("/loginpage");
  //   }

  //   setSignOutDialogOpen(false);
  //   setIsDialogOpen(false); // Remove blur effect
  // };

  const handleLogoutCancel = () => {
    setSignOutDialogOpen(false);
    setIsDialogOpen(false); // Remove blur effect
  };

  useEffect(() => {
    const handleCommentClick = () => {
      setIsCollapsed(false);
    };

    window.addEventListener("expandSongDetails", handleCommentClick);
    return () => {
      window.removeEventListener("expandSongDetails", handleCommentClick);
    };
  }, []);

  const handleReportClick = () => {
    setReportVisible(true);
    setIsDialogOpen(true); // Set dialog open for blur effect
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentSongId || isPosting) return;
    setIsPosting(true);
    try {
      const success = await postComment(currentSongId, newComment);
      if (success) {
        setNewComment("");
        fetchComments(currentSongId);
      }
    } finally {
      setIsPosting(false);
    }
  };

  useEffect(() => {
    if (currentSongId && prevSongIdRef.current !== currentSongId) {
      fetchComments(currentSongId);
      prevSongIdRef.current = currentSongId;
      window.dispatchEvent(new CustomEvent("expandSongDetails"));
    }
  }, [currentSongId, fetchComments]);

  useEffect(() => {
    let intervalId;

    const fetchSongMetrics = async () => {
      if (currentSongId) {
        try {
          const response = await fetch(
            `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/song/counts?song_id=${currentSongId}`
          );
          if (response.ok) {
            const data = await response.json();
            setSongMetrics(data); // Update the state with new metrics

            // Clear any stale metrics update from localStorage when song changes
            localStorage.removeItem("metricsUpdate");
          }
        } catch (error) {
          console.error("Error fetching song metrics:", error);
        }
      }
    };

    // Fetch metrics immediately when the song changes
    // if (currentSongId) {
    //   fetchSongMetrics();
    //   // Set up polling every 5 seconds
    //   intervalId = setInterval(fetchSongMetrics, 1000);
    // }

    // // Clean up the interval when the component unmounts or the song changes
    // return () => {
    //   clearInterval(intervalId);
    // };
    if (currentSongId) {
      fetchSongMetrics();
    }
  }, [currentSongId]);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationMenuAnchor, setNotificationMenuAnchor] = useState(null);

  const fetchNotifications = async () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    try {
      const response = await fetch(
        `https://6htqk6p035.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/decision/approve/In_app_getNotify?user_id=${userId}`
      );

      if (response.ok) {
        const data = await response.json();
        // Sort notifications: unviewed first, then by timestamp
        const sortedNotifications = (data.notifications || []).sort((a, b) => {
          if (a.notify_view !== b.notify_view) {
            return a.notify_view ? 1 : -1; // false values (unviewed) come first
          }
          // If notify_view is the same, sort by timestamp (newest first)
          return new Date(b.timeStamp_created) - new Date(a.timeStamp_created);
        });

        setNotifications(sortedNotifications);
        const unreadCount = sortedNotifications.filter(
          (notification) => !notification.notify_view && !notification.dismissed
        ).length;
        setUnreadCount(unreadCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotificationClick = (event) => {
    event.stopPropagation();
    setNotificationMenuAnchor(event.currentTarget);
    setIsNotificationMenuOpen(true);
  };

  const handleNotificationClose = () => {
    setNotificationMenuAnchor(null);
    setIsNotificationMenuOpen(false);
  };

  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleDismissNotification = async (event, notifyId) => {
    event.stopPropagation(); // Prevent menu from closing and prevent read action

    try {
      // Use the existing endpoint to delete the notification
      const response = await fetch(
        "https://6htqk6p035.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/decision/approve/In_app_deleteNotify",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notify_id: notifyId }),
        }
      );

      if (response.ok) {
        // Find notification before removing it to check if it was unread
        const notificationToRemove = notifications.find(
          (n) => n.notify_id === notifyId
        );

        // Update the local state to remove the notification
        setNotifications((prevNotifications) =>
          prevNotifications.filter(
            (notification) => notification.notify_id !== notifyId
          )
        );

        // If we're removing an unread notification, update the unread count
        if (notificationToRemove && !notificationToRemove.notify_view) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleClearAllNotifications = async () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    try {
      const response = await fetch(
        "https://6htqk6p035.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/decision/approve/In_app_deleteAllNotify",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );

      if (response.ok) {
        // Clear all notifications from state
        setNotifications([]);
        setUnreadCount(0);
        // Close the notification menu
        handleNotificationClose();
      }
    } catch (error) {
      console.error("Error clearing all notifications:", error);
    }
  };

  const getInitials = (name) => {
    if (!name) return "";
    const names = name.split(" ");
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const handleNotificationRead = async (notification) => {
    // Skip if already viewed
    if (notification.notify_view) return;

    try {
      // Update notify_view to true when notification is clicked/read
      const response = await fetch(
        "https://6htqk6p035.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/decision/approve/In_app_getNotify",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notify_id: notification.notify_id,
            action: "view", // Specify we're marking as viewed, not dismissed
          }),
        }
      );

      if (response.ok) {
        // Update the local state to mark notification as viewed
        setNotifications((prevNotifications) =>
          prevNotifications.map((n) =>
            n.notify_id === notification.notify_id
              ? { ...n, notify_view: true }
              : n
          )
        );

        // Update unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <Box className={`song-details-bar ${isCollapsed ? "collapsed" : ""}`}
    sx={{
      
      boxShadow: "-4px 0 8px -2px #151415",
      
      zIndex: 10,
     
    
    }}
    >
      
      <Box className="integrated-topbar">
        <IconButton
          className="collapse-button"
          onClick={toggleCollapse}
          sx={{
            color: "white",
            padding: "8px",
            opacity: 1,
            height: "50px !important",
            width: " 40px !important",
            borderRadius: "0px !important",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "0px !important",
            },
          }}
        >
          {isCollapsed ? (
            <KeyboardArrowLeftIcon
              sx={{
                height: "50px !important",
                width: " 40px !important",
                fontWeight: "300 !important",
                marginRight: "10px !important",
              }}
            />
          ) : (
            <KeyboardArrowRightIcon
              sx={{
                height: "50px !important",
                width: " 40px !important",
                fontWeight: "300 !important",
              }}
            />
          )}
        </IconButton>

        {!isCollapsed && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flex: 1,
              ml: 0,
            }}
          >
            <Avatar
              src={profilePhotoUrl}
              sx={{
                backgroundColor: profilePhotoUrl ? "transparent" : "#222", fontSize: "48px",
                color: "white",
                fontWeight: "bold",
                fontSize: "13px",
                width: "32px !important", // Add this line to reduce width
                height: "32px !important", // Add this line to reduce height
                // width: 32,
                // height: 32,
                border: "1px solid rgba(255, 255, 255, 0.2)",
                marginLeft: "px !important",
              }}
            > {!profilePhotoUrl && getInitials(stageName || fullName)}
            </Avatar>
            <Box>
              <Typography
                sx={{
                  color: "white",
                  fontWeight: "600",
                  fontSize: "0.8rem",
                  lineHeight: "1.0",
                }}
              >
                {fullName}
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "0.7rem",
                  lineHeight: "1.0",
                }}
              >
                {stageName}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", marginLeft: "auto", gap: 1 }}>
              {/* Only show bell icon for Singer and Admin */}
              {(category === "Singer" || category === "Admin") && (
                <IconButton
                  onClick={handleNotificationClick}
                  sx={{
                    color: "white",
                    padding: "2px",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  <Badge badgeContent={unreadCount} color="error">
                    <Bell size={18} />
                  </Badge>
                </IconButton>
              )}
              <IconButton
                onClick={handleMenuOpen}
                sx={{
                  color: "white",
                  padding: "2px",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                <KeyboardArrowDownIcon sx={{ fontSize: "1.2rem" }} />
              </IconButton>
            </Box>
          </Box>
        )}

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 180,
              backgroundColor: "#151415",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
              color: "white",
              "& .MuiMenuItem-root": {
                fontSize: "12px",
                padding: "12px 16px",
                gap: "12px",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  transform: "translateX(4px)",
                },
                "&:active": {
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                },
              },
              "& .MuiDivider-root": {
                borderColor: "rgba(255, 255, 255, 0.1)",
              },
            },
          }}
        >
          <MenuItem onClick={handleSettingsClick}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                fontWeight: "bold",
              }}
            >
              <img
                src={profile}
                alt="Profile"
                style={{
                  width: "20px",
                  height: "20px",
                  marginRight: "12px",
                  //opacity: 0.9,
                }}
              />
              View Profile
            </Box>
          </MenuItem>
          <MenuItem onClick={handleFeedbackClick}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                fontWeight: "bold",
              }}
            >
              <img
                src={feedback}
                alt="Feedback"
                style={{
                  width: "20px",
                  height: "20px",
                  marginRight: "12px",
                  //opacity: 0.9,
                }}
              />
              Feedback
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={handleLogoutClick}
            sx={{
              color: "#ff4d4f",
              "&:hover": {
                backgroundColor: "rgba(255, 77, 79, 0.1)",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                fontWeight: "bold",
              }}
            >
              <LogoutIcon sx={{ fontSize: 20, mr: 1.5 }} />
              Sign Out
            </Box>
          </MenuItem>
        </Menu>

        <Menu
          anchorEl={notificationMenuAnchor}
          open={Boolean(notificationMenuAnchor)}
          onClose={handleNotificationClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          PaperProps={{
            sx: {
              mt: 1.5,
              maxHeight: "400px",
              width: "300px",
              backgroundColor: "#151415",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
              color: "white",
              overflowY: "auto",
              "&::-webkit-scrollbar": {
                width: "4px",
              },
              "&::-webkit-scrollbar-track": {
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "2px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(255, 255, 255, 0.2)",
                borderRadius: "2px",
                "&:hover": {
                  background: "rgba(255, 255, 255, 0.3)",
                },
              },
              scrollbarWidth: "thin",
              scrollbarColor:
                "rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 12px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <Typography sx={{ fontSize: "14px", fontWeight: "bold" }}>
              Notifications
            </Typography>
            {notifications.length > 0 && (
              <Button
                onClick={handleClearAllNotifications}
                sx={{
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "12px",
                  textTransform: "none",
                  padding: "4px 8px",
                  minWidth: "auto",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    color: "white",
                  },
                }}
              >
                Clear All
              </Button>
            )}
          </Box>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <MenuItem
                key={notification.notify_id}
                onClick={() => handleNotificationRead(notification)}
                sx={{
                  whiteSpace: "normal",
                  padding: "12px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: notification.notify_view
                    ? "rgba(255, 255, 255, 0.02)" // Subtle background for read notifications
                    : "rgba(255, 255, 255, 0.1)", // More prominent background for unread notifications
                  "&:hover": {
                    backgroundColor: notification.notify_view
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(255, 255, 255, 0.15)",
                  },
                  opacity: notification.notify_view ? 0.7 : 1, // Lower opacity for read notifications
                  position: "relative",
                }}
              >
                <Box sx={{ width: "100%" }}>
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: notification.notify_view ? "normal" : "bold", // Bold for unread, normal for read
                      mb: 0.5,
                    }}
                  >
                    {notification.song_name}
                  </Typography>
                  <Typography
                    sx={{ fontSize: "12px",fontStyle: "italic !important", color: "rgba(255, 255, 255, 0.7)" }}
                  >
                    {notification.notify_type === "song_approved"
                      ? "Your song has been approved!"
                      : `Song rejected: ${notification.song_reject_res}`}
                  </Typography>
                </Box>

                <IconButton
                  onClick={(e) =>
                    handleDismissNotification(e, notification.notify_id)
                  }
                  sx={{
                    position: "absolute",
                    right: 8,
                    top: 8,
                    padding: "4px",
                    color: "rgba(255, 255, 255, 0.5)",
                    "&:hover": {
                      color: "rgba(255, 255, 255, 0.8)",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </MenuItem>
            ))
          ) : (
            <MenuItem sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
              No notifications
            </MenuItem>
          )}
        </Menu>
      </Box>

      {!isCollapsed && (
        <Box
          className="details-content for-blur"
          sx={{ overflow: "auto", height: "calc(100% - 64px)" }}
        >
          {currentSong ? (
            <>
              <Box className="song-card">
                {/* First Section: Song Details */}
                <Box
                  sx={{
                    backgroundColor: "#151415 !important",
                    padding: 1.2,
                    borderRadius: "18px",
                    mb: 1,
                  }}
                >
                  <Box className="song-image-container">
                    <img
                      src={currentCover || Icon}
                      alt={formatDisplayText(currentTitle)}
                      className="song-image"
                    />
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          color: "white",
                          fontWeight: 600,
                          fontSize: "20px",
                        }}
                      >
                        {formatDisplayText(currentTitle)}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "14px",
                      }}
                    >
                      {formatDisplayText(currentArtist)}
                    </Typography>
                    <Typography
                      sx={{
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "14px",
                      }}
                    >
                      {formatDisplayText(currentLanguage)}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      p: 1,
                      // backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: "30px",
                      mt: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        ml: 2.5,
                      }}
                    >
                        <img
                        src={emptyReaction}
                        alt="reaction"
                        style={{ width: "33px", height: "27px", opacity: 1 }}
                      />
                      
                      <Typography
                        sx={{
                          color: "white",
                          fontSize: "20px !important",
                          fontWeight: 600,
                        }}
                      >
                        {songMetrics.reactionCount}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      
                      <img
                        src={smile}
                        alt="smiles"
                        style={{ width: "25px", height: "25px", opacity: 0.8 }}
                      />
                      <Typography
                        sx={{
                          color: "white",
                          fontSize: "21px !important",
                          fontWeight: 600,
                        }}
                      >
                        {songMetrics.favoriteCount}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Second Section: Artists */}
                <Box
                  sx={{
                    backgroundColor: "#151415",
                    padding: 1.2,
                    borderRadius: "18px",
                    mb: 1,
                  }}
                >
                  <Box className="artists">
                    <Box className="artist-row">
                      <Avatar src={currentCover} className="artist-avatar" />
                      <Box className="artist-info">
                        <Typography className="artist-name">
                          {formatDisplayText(currentSinger) || "Unknown Singer"}
                        </Typography>
                        <Typography className="artist-role">Singer</Typography>
                      </Box>
                    </Box>
                    <Box className="artist-row">
                      <Avatar src={currentCover} className="artist-avatar" />
                      <Box className="artist-info">
                        <Typography className="artist-name">
                          {formatDisplayText(currentComposer) ||
                            "Unknown Composer"}
                        </Typography>
                        <Typography className="artist-role">
                          Composer
                        </Typography>
                      </Box>
                    </Box>
                    <Box className="artist-row">
                      <Avatar src={currentCover} className="artist-avatar" />
                      <Box className="artist-info">
                        <Typography className="artist-name">
                          {formatDisplayText(currentLyricist) ||
                            "Unknown Lyricist"}
                        </Typography>
                        <Typography className="artist-role">
                          Lyricist
                        </Typography>
                      </Box>
                    </Box>
                    <Box className="artist-row">
                      <Avatar src={currentCover} className="artist-avatar" />
                      <Box className="artist-info">
                        <Typography className="artist-name">
                          {formatDisplayText(currentProducer) ||
                            "Unknown Producer"}
                        </Typography>
                        <Typography className="artist-role">
                          Producer
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    position: "relative",
                    mt: isCommentsExpanded ? 13.9 : 3,
                  }}
                >
                  {!isCommentsExpanded && (
                    <Box
                      sx={{
                        backgroundColor: "#151415",
                        padding: 1.2,
                        borderRadius: "18px",
                        mb: -1,
                        mt: -3,
                        cursor: "pointer",
                        position: "relative",
                        zIndex: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                      onClick={() => {
                        setIsCommentsExpanded(true);
                        setShowComments(true); // Add this line
                      }}
                    >
                      <Typography
                        variant="body"
                        sx={{
                          color: "white",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        Comments
                      </Typography>
                      <KeyboardArrowDownIcon
                        sx={{
                          transform: "rotate(180deg)",
                          transition: "transform 0.3s ease",
                          color: "white",
                        }}
                      />
                    </Box>
                  )}

                  <Box
                    sx={{
                      position: "absolute",
                      bottom: "100%",
                      left: 0,
                      right: 0,
                      backgroundColor: "#151415",
                      borderRadius: "18px",
                      overflow: "hidden",
                      height: isCommentsExpanded ? "332px" : "0",
                      transition: "height 0.3s ease-in-out",
                      visibility: isCommentsExpanded ? "visible" : "hidden",
                      opacity: isCommentsExpanded ? 1 : 0,
                      zIndex: 1,
                      mb: -1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Box
                      sx={{
                        padding: 1.2,
                        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                      onClick={() => {
                        setIsCommentsExpanded(!isCommentsExpanded);
                        setShowComments(false);
                      }}
                    >
                      <Typography
                        variant="body"
                        sx={{
                          color: "white",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        Comments
                      </Typography>
                      <KeyboardArrowDownIcon
                        sx={{
                          transform: "rotate(0deg)",
                          color: "white",
                        }}
                      />
                    </Box>

                    {/* Comments Content */}
                    <Box
                      className="comments-section"
                      sx={{
                        height: "calc(100% - 56px)",
                        display: "flex",
                        flexDirection: "column",
                        p: 1.2,
                      }}
                    >
                      {/* Input box */}
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          mb: 0.5,
                          alignItems: "flex-start",
                          position: "relative",
                          width: "50%",
                          flexShrink: 0,
                          ml: -1,
                          mt: -2,
                        }}
                      >
                        <Box sx={{ flex: 1, position: "relative" }}>
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            variant="standard"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Add a comment"
                            disabled={isPosting}
                            sx={{
                              mb: 1,
                              maxWidth: "215px",
                              ml: "10px !important",
                              height: "40px",
                              backgroundColor: "transparent !important", // Ensures the whole field is transparent
                              ".MuiInputBase-root": {
                                color: "black",
                                fontSize: "15px",
                                height: "40px",
                                backgroundColor: "transparent !important", // Removes background from input root
                                "&:before": {
                                  borderBottomColor: "rgba(255, 255, 255, 0.3)",
                                },
                                "&:after": {
                                  borderBottomColor: "rgba(255, 255, 255, 0.7)",
                                },
                              },
                              ".MuiInputBase-input": {
                                color: "white",
                                padding: "8px 0",
                                height: "24px !important",
                                backgroundColor: "transparent !important", // Ensures input itself is transparent
                                "&::placeholder": {
                                  color: "rgba(255, 255, 255, 0.5)",
                                  opacity: 1,
                                },
                              },
                              "& textarea": {
                                backgroundColor: "transparent !important",
                                color: "white",
                              },
                              "& .MuiInputBase-inputMultiline": {
                                backgroundColor: "transparent !important", // Removes background from multiline input
                              },
                              "& .MuiInput-underline:before": {
                                borderBottomColor: "rgba(255, 255, 255, 0.3)",
                              },
                              "& .MuiInput-underline:hover:before": {
                                borderBottomColor: "rgba(255, 255, 255, 0.5)",
                              },
                              "& .MuiInput-underline:after": {
                                borderBottomColor: "rgba(255, 255, 255, 0.7)",
                              },
                            }}
                          />
                          <IconButton
                            onClick={handleAddComment}
                            disabled={!newComment.trim() || isPosting}
                            sx={{
                              position: "absolute",
                              right: -5,
                              top: "43%",
                              transform: "translateY(-60%)",
                              color: "white",
                              "&.Mui-disabled": {
                                color: "grey !important",
                              },
                            }}
                          >
                            {isPosting ? (
                              <CircularProgress size={20} />
                            ) : (
                              <SendIcon sx={{ fontSize: 25 }} />
                            )}
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Comments List */}
                      <Box
                        sx={{
                          // overflow: "auto",
                          overflowY: isViewMoreComments ? "hidden" : "scroll",
                            // overflowY: "scroll",
                            flex: 1,
                            pr: 1,
                           // scrollbarWidth: "thin", // For Firefox
                            scrollbarColor: "#e0e0e0 transparent", // For Firefox (thumb and track colors)
                            "&::-webkit-scrollbar": {
                              width: "15px",
                              height: "30%",
                            },
                            "&::-webkit-scrollbar-track": {
                              backgroundColor: "transparent",
                              borderRadius: "2px",
                            },
                            "&::-webkit-scrollbar-thumb": {
                              backgroundColor: "#e0e0e0 ",
                              borderRadius: "10px",
                              minHeight: "40%",
                              paddingX: "5px",
                              backgroundImage: `url(${menuIcon})`, //"url('/src/assets/menu.png')",
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "center",
                              backgroundSize: "14px",
                            },
                            "&::-webkit-scrollbar-thumb:hover": {
                              backgroundColor: "#ccc",
                            },
                          // "&::-webkit-scrollbar": {
                          //   width: "15px",
                          //   height: "30%"
                          // },
                          // "&::-webkit-scrollbar-track": {
                          //   backgroundColor: "transparent",
                          //   borderRadius: "2px"
                          // },
                          // "&::-webkit-scrollbar-thumb": {
                          //   backgroundColor: "#e0e0e0",
                          //   borderRadius: "10px",
                          //   minHeight: "40%",
                          //   paddingX: "5px",
                            
                          //   /* 👇 Use your icon here */
                          //   backgroundImage: `url(${menuIcon})`,//"url('/src/assets/menu.png')",
                          //   backgroundRepeat: "no-repeat",
                          //   backgroundPosition: "center",
                          //   backgroundSize: "14px", // Adjust size as needed
                          // },
                          // "&::-webkit-scrollbar-thumb:hover": {
                          //   backgroundColor: "#ccc",
                          // },
                          // flex: 1,
                          // pr: 1,
                          
                          // "&::-webkit-scrollbar": {
                          //   width: "15px",
                          //   height: "30%"
                          // },
                          // "&::-webkit-scrollbar-track": {
                          //   backgroundColor: "transparent",
                          //   borderRadius: "2px"
                          // },
                          // "&::-webkit-scrollbar-thumb": {
                          //   backgroundColor: "#e0e0e0",
                          //   borderRadius: "10px",
                          //   minHeight: "40%",
                          //   paddingX: "5px",
                            
                          //   /* 👇 Use your icon here */
                          //   backgroundImage: `url(${menuIcon})`,  // backgroundImage: "url('/menu.png')",
                          //   backgroundRepeat: "no-repeat",
                          //   backgroundPosition: "center",
                          //   backgroundSize: "14px", // Adjust size as needed
                          // },
                          // "&::-webkit-scrollbar-thumb:hover": {
                          //   backgroundColor: "#ccc",
                          // },
                          // "&::-webkit-scrollbar": {
                          //   width: "4px",
                          // },
                          // "&::-webkit-scrollbar-track": {
                          //   background: "rgba(255, 255, 255, 0.05)",
                          //   borderRadius: "2px",
                          // },
                          // "&::-webkit-scrollbar-thumb": {
                          //   background: "rgba(255, 255, 255, 0.2)",
                          //   borderRadius: "2px",
                          //   "&:hover": {
                          //     background: "rgba(255, 255, 255, 0.3)",
                          //   },
                          // },
                          // scrollbarWidth: "thin",
                          // scrollbarColor:
                          //   "rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)",
                        }}
                      >
                        {/* Comments List */}
                        <Box
                          sx={{
                            height: "200px",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <Box
                            sx={{
                              flex:1,
                              pr:1,
                              // overflowY: "scroll",
                              overflowY: isViewMoreComments ? "auto" : "hidden",
                              scrollbarColor: "#e0e0e0 transparent", // For Firefox (thumb and track colors)
                            "&::-webkit-scrollbar": {
                              width: "15px",
                              height: "30%",
                            },
                            "&::-webkit-scrollbar-track": {
                              backgroundColor: "transparent",
                              borderRadius: "2px",
                            },
                            "&::-webkit-scrollbar-thumb": {
                              backgroundColor: "#e0e0e0 ",
                              borderRadius: "10px",
                              minHeight: "40%",
                              paddingX: "5px",
                              backgroundImage: `url(${menuIcon})`, //"url('/src/assets/menu.png')",
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "center",
                              backgroundSize: "14px",
                            },
                            "&::-webkit-scrollbar-thumb:hover": {
                              backgroundColor: "#ccc",
                            },
                              // "&::-webkit-scrollbar": {
                              //   width: "15px",
                              //   height: "30%"
                              // },
                              // "&::-webkit-scrollbar-track": {
                              //   backgroundColor: "transparent",
                              //   borderRadius: "2px"
                              // },
                              // "&::-webkit-scrollbar-thumb": {
                              //   backgroundColor: "#e0e0e0",
                              //   borderRadius: "10px",
                              //   minHeight: "40%",
                              //   paddingX: "5px",
                                
                              //   /* 👇 Use your icon here */
                              //   backgroundImage: "url('/menu.png')",
                              //   backgroundRepeat: "no-repeat",
                              //   backgroundPosition: "center",
                              //   backgroundSize: "14px", // Adjust size as needed
                              // },
                              // "&::-webkit-scrollbar-thumb:hover": {
                              //   backgroundColor: "#ccc",
                              // },
                              // scrollbarWidth: "thin",
                              // scrollbarColor:
                              //   "rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)",
                              // overflow: isViewMoreComments ? "auto" : "hidden",
                              // flex: 1,
                              // pr: 1,
                              
                                
                              // "&::-webkit-scrollbar": {
                              //   width: "15px",
                              //   height: "30%"
                              // },
                              // "&::-webkit-scrollbar-track": {
                              //   backgroundColor: "transparent",
                              //   borderRadius: "2px"
                              // },
                              // "&::-webkit-scrollbar-thumb": {
                              //   backgroundColor: "#e0e0e0",
                              //   borderRadius: "10px",
                              //   minHeight: "40%",
                              //   paddingX: "5px",
                                
                              //   /* 👇 Use your icon here */
                              //   backgroundImage: "url('/menu.png')",
                              //   backgroundRepeat: "no-repeat",
                              //   backgroundPosition: "center",
                              //   backgroundSize: "14px", // Adjust size as needed
                              // },
                              // "&::-webkit-scrollbar-thumb:hover": {
                              //   backgroundColor: "#ccc",
                              // },
                              // // "&::-webkit-scrollbar": {
                              // //   width: "4px",
                              // // },
                              // // "&::-webkit-scrollbar-track": {
                              // //   background: "rgba(255, 255, 255, 0.05)",
                              // //   borderRadius: "2px",
                              // // },
                              // // "&::-webkit-scrollbar-thumb": {
                              // //   background: "rgba(255, 255, 255, 0.2)",
                              // //   borderRadius: "2px",
                              // //   "&:hover": {
                              // //     background: "rgba(255, 255, 255, 0.3)",
                              // //   },
                              // // },
                              // scrollbarWidth: "thin",
                              // scrollbarColor:
                              //   "rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)",
                            }}
                          >
                            {isLoading ? (
                              <Typography
                                sx={{
                                  color: "rgba(255, 255, 255, 0.7)",
                                  textAlign: "center",
                                  py: 4,
                                }}
                              >
                                Loading comments...
                              </Typography>
                            ) : comments.length > 0 ? (
                              (isViewMoreComments
                                ? comments
                                : comments.slice(0, 3)
                              ).map((comment) => (
                                <Box
                                  key={comment.comment_id}
                                  sx={{
                                    mb: 1.1,
                                    p: 1,
                                    backgroundColor:
                                      "rgba(255, 255, 255, 0.05)",
                                    borderRadius: "8px",
                                    transition: "background-color 0.2s ease",
                                    "&:hover": {
                                      backgroundColor:
                                        "rgba(255, 255, 255, 0.08)",
                                    },
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: 2,
                                    }}
                                  >
                                    <Avatar
                                      src={comment.profilePhotoUrl}
                                      alt={formatDisplayText(comment.FullName)}
                                      sx={{ width: 32, height: 32 }}
                                    />
                                    <Box sx={{ flex: 1 }}>
                                      <Typography
                                        sx={{
                                          color: "rgba(255, 255, 255, 0.6)",
                                          fontSize: "0.6rem",
                                        }}
                                      >
                                        {formatDisplayText(
                                          comment.StageName || comment.FullName
                                        )}
                                      </Typography>
                                      <Typography
                                        sx={{
                                          color: "rgba(255, 255, 255, 0.9)",
                                          fontSize: "0.80rem",
                                          lineHeight: 2,
                                        }}
                                      >
                                        {comment.comments}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              ))
                            ) : (
                              <Typography
                                sx={{
                                  color: "rgba(255, 255, 255, 0.7)",
                                  textAlign: "center",
                                  py: 4,
                                }}
                              >
                                No comments yet. Be the first to comment!
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                      {comments.length > 3 && (
                        <Box
                          sx={{
                            height: "25px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            mb: -2,
                            background: "#1a191a",
                            // "linear-gradient(to top, rgba(16, 15, 50, 1) 0%, rgba(16, 15, 50, 0) 100%)",
                          }}
                        >
                          <Typography
                            onClick={() =>
                              setIsViewMoreComments(!isViewMoreComments)
                            }
                            sx={{
                              color: "white",
                              fontSize: "16px",
                              cursor: "pointer",
                              fontWeight: 400,
                              transition: "opacity 0.3s ease",
                              "&:hover": {
                                opacity: 1,
                              },
                            }}
                          >
                            View More ...
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Third Section: Share */}
                <Box
                  sx={{
                    backgroundColor: "#151415",
                    pt: 0.4,
                    borderRadius: "18px",
                    mb: 13,
                    mt: 2,
                    height: "42px",
                  }}
                >
                  <MenuItem onClick={handleShareClick}>
                    <img
                      src={share}
                      alt="share"
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "18px",
                        // color: "white !important",
                      }}
                    />
                    Share
                  </MenuItem>
                </Box>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                padding: 2,
                textAlign: "center",
              }}
            >
              <img
                src={logo}
                alt="Logo"
                style={{
                  width: "120px",
                  marginBottom: "20px",
                  opacity: 0.7,
                }}
              />
              <Typography
                sx={{
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "14px",
                }}
              >
                Play a song to see details
              </Typography>
            </Box>
          )}
        </Box>
      )}

      <Dialog
        open={openShareDialog}
        onClose={() => {
          setOpenShareDialog(false);
          setIsDialogOpen(false); // Remove blur effect when dialog closes
        }}
        PaperProps={{
          sx: {
            width: "300px !important",
            minHeight: "150px",
            borderRadius: "16px",
            backgroundColor: "#100F32",
            color: "white",
            padding: "16px",
            boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.5)",
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
            color: "white",
            textAlign: "center",
            fontSize: "18px",
            fontWeight: "500",
          }}
        >
          Share Song
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            value={
              isGeneratingLink ? "Generating share link..." : shareableLink
            }
            InputProps={{
              readOnly: true,
              sx: {
                height: "50.5px !important",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                "& .MuiInputBase-input": {
                  overflow: "hidden !important",
                  textOverflow: "ellipsis !important",
                  whiteSpace: "nowrap !important",
                  height: "80px !important",
                  padding: "8px 14px !important",
                },
              },
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
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: "16px" }}>
          <Button
            onClick={() => {
              setOpenShareDialog(false);
              setIsDialogOpen(false); // Remove blur effect when dialog closes
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

      <Snackbar
        open={showCopyAlert}
        autoHideDuration={3000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity="success"
          sx={{ width: "100%", mb: 6 }}
        >
          Link copied to clipboard!
        </Alert>
      </Snackbar>

      <Report
        open={reportVisible}
        onClose={() => {
          setReportVisible(false);
          setIsDialogOpen(false); // Remove blur effect when dialog closes
        }}
      />

      <Dialog
        open={signOutDialogOpen}
        onClose={() => {
          setSignOutDialogOpen(false);
          setIsDialogOpen(false); // Remove blur effect when dialog closes
        }}
        sx={{
          "& .MuiDialog-paper": {
            width: "280px !important",
            height: "160px !important",
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
        BackdropProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "white",
            fontSize: "18px",
            fontWeight: "500",
            mt: "-12px !important",
            mb: "-5px !important",
          }}
        >
          Sign out of your account ?
        </DialogTitle>
        <DialogActions>
          <Button
            onClick={handleLogoutCancel}
            sx={{
              color: "white",
              textTransform: "none",
              fontSize: "14px",
              padding: "6px 6px",
              fontWeight: "300 !important",
              fontFamily: "Poppins !important",
              letterSpacing: "1px !important",
              "&:hover": {
                backgroundColor: "rgba(39, 130, 238, 0.08)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLogoutConfirm}
            sx={{
              color: "Red",
              textTransform: "none",
              fontSize: "14px",
              marginLeft: "5px !important",
              fontWeight: "300 !important",
              fontFamily: "Poppins !important",
              letterSpacing: "1px !important",
              "&:hover": {
                backgroundColor: "rgba(39, 130, 238, 0.08)",
              },
            }}
          >
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>
   
    </Box>
  );
};

export default SongDetailsBar;
