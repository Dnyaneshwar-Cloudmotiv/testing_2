import React, { useState, useEffect } from "react";
import {
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import { usePlayer } from "./PlayerContext";
import thread from "./assets/thread1.png";
import Report from "./Report";
import report from "./assets/report1.png";
import share from "./assets/share1.png";
import comment from "./assets/comment1.png";
import "./MoreOptionsMenu.css";

const MoreOptionsMenu = ({ anchorEl, onClose, isOpen, onCommentClick }) => {
  const { currentSongId, currentSongDetails } = usePlayer();
  const [reportVisible, setReportVisible] = useState(false);
  const [openShareDialog, setOpenShareDialog] = useState(false);
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const [shareableLink, setShareableLink] = useState("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { originalPlaylist, shuffledPlaylist, isShuffled, Queueicon } =
    usePlayer();

  // Apply blur effect when dialog opens
  useEffect(() => {
    // Apply blur to content container but not sidebar
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

    // Apply blur to drawer content (HomePage) but not sidebar
    const drawer = document.querySelector(".drawer");
    if (drawer && isDialogOpen) {
      drawer.classList.add("dialog-open");
    } else if (drawer) {
      drawer.classList.remove("dialog-open");
    }
    const accountContainer = document.querySelector(".account");
    if (accountContainer && isDialogOpen) {
      accountContainer.classList.add("dialog-open");
    } else if (accountContainer) {
      accountContainer.classList.remove("dialog-open");
    }

    // Apply blur to form container (SongBasket)
    const formContainer = document.querySelector(".formContainer");
    if (formContainer && isDialogOpen) {
      formContainer.classList.add("dialog-open");
    } else if (formContainer) {
      formContainer.classList.remove("dialog-open");
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
      if (feedbackPage) feedbackPage.classList.remove("dialog-open");
    };
  }, [isDialogOpen]);

  const handleReportClick = () => {
    setReportVisible(true);
    setIsDialogOpen(true);
    onClose();
  };

  const handleQueueClick = (event) => {
    console.log("Queue clicked, current playlists:", {
      original: originalPlaylist,
      shuffled: shuffledPlaylist,
      isShuffled: isShuffled,
    });
    window.dispatchEvent(new Event("showQueue"));
  };

  const handleShareClick = async () => {
    if (currentSongId) {
      setIsGeneratingLink(true);
      setOpenShareDialog(true);
      setIsDialogOpen(true);
      onClose();

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
      setIsDialogOpen(false);
  
      // ✅ NEW CODE: Increment Share Count
      if (currentSongId) {
        await fetch("https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/song/incrementShareCount", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ song_id: currentSongId }),
        });
      }
    } catch (err) {
      console.error("Failed to copy link or increment share count:", err);
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

  const handleCloseAlert = (event, reason) => {
    if (reason === "clickaway") return;
    setShowCopyAlert(false);
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
        // sx={{ maxHeight:"700px !important",overflow:"hidden !important"}}
        PaperProps={{
          sx: {
            backgroundColor: "#151415 !important",
            mt: "-25px",
            color: "white",
            borderRadius: "12px",
            "& .MuiMenuItem-root": {
              fontSize: "14px",
              padding: "10px 16px",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            },
          },
        }}
      >
        <MenuItem onClick={onCommentClick}>
          <img
            src={comment}
            alt="share"
            style={{
              width: "24px",
              height: "24px",
              marginRight: "18px",
              color: "#2364C6 !important",
            }}
          />
          Comments
        </MenuItem>
        <MenuItem onClick={handleQueueClick}>
          <img
            src={thread}
            alt="Queue"
            style={{
              width: "24px",
              height: "24px",
              marginRight: "18px",
              color: "#2364C6 !important",
            }}
          />
          Thread
        </MenuItem>
        <MenuItem onClick={handleShareClick}>
          <img
            src={share}
            alt="share"
            style={{
              width: "24px",
              height: "24px",
              marginRight: "18px",
              color: "#2364C6 !important",
            }}
          />
          Share
        </MenuItem>
        <MenuItem onClick={handleReportClick}>
          <img
            src={report}
            alt="report"
            style={{
              width: "24px",
              height: "24px",
              marginRight: "18px",
              color: "#2364C6 !important",
              backgroundColor: "#2364C6 !important",
            }}
          />
          Report
        </MenuItem>
      </Menu>

      <Dialog
        open={openShareDialog}
        onClose={() => {
          setOpenShareDialog(false);
          setIsDialogOpen(false);
        }}
        PaperProps={{
          sx: {
            width: "300px !important",
            minHeight: "150px",
            borderRadius: "16px",
            backgroundColor: "#151415 !important",
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
                height: "50px !important",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                "& .MuiInputBase-input": {
                  height: "50px !important",
                  overflow: "hidden !important",
                  textOverflow: "ellipsis !important",
                  whiteSpace: "nowrap !important",
                  height: "50px !important",
                  padding: "8px 14px !important",
                },
              },
            }}
            sx={{
              backgroundColor: "white",
              borderRadius: "4px",
              height: "50.5px !important",
              width: "240px !important",
              border: "none !important",
              "& .MuiOutlinedInput-root": {
                color: "black",
                border: "none !important",
                // "& fieldset": {
                //   borderColor: "rgba(0, 0, 0, 0.23)",
                // },
                // "&:hover fieldset": {
                //   borderColor: "rgba(0, 0, 0, 0.5)",
                // },
                // "&.Mui-focused fieldset": {
                //   borderColor: "#2782EE",
                // },
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

      <Snackbar
        open={showCopyAlert}
        autoHideDuration={3000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity="success"
          sx={{
            width: "100%",
            backgroundColor: "#2644d9 !important",
            textAlign: "center",
            color: "white !important",
            "& .MuiAlert-icon": {
              color: "white !important",
              marginRight: 1,
              marginTop: 1,
            },
            "& .MuiAlert-message": {
              color: "white !important",
              padding: "8px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            },
            "& .MuiAlert-action": {
              color: "white !important",
              padding: "8px 0",
              alignItems: "center",
            },
          }}
        >
          Link copied to clipboard!
        </Alert>
      </Snackbar>

      <Report
        open={reportVisible}
        onClose={() => {
          setReportVisible(false);
          setIsDialogOpen(false);
        }}
      />
    </>
  );
};

export default MoreOptionsMenu;
