// import React from "react";
// At the top of the file
import React, { useState, useEffect } from "react";
// Remove ContentCopyIcon import since we'll use Lucide icons
import { Copy, Check } from "lucide-react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Typography,
  IconButton,
  TextField,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import cross from "./assets/Cross.png";
import VectorPaste from "./assets/VectorPaste.png";
import "./Refer.css";

const Refer = ({ open, onClose }) => {
  const referLink = "https://voiz.co.in";

  // // Function to handle copying the link
  // const handleCopyLink = () => {
  //   navigator.clipboard.writeText(referLink);
  //   alert("Link copied to clipboard!");
  // };
  // Add this state near the top of the component
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // Apply blur to account container but not sidebar
    const accountContainer = document.querySelector(".account");
    if (accountContainer && isDialogOpen) {
      accountContainer.classList.add("dialog-open");
    } else if (accountContainer) {
      accountContainer.classList.remove("dialog-open");
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

    const feedbackContent = document.querySelector(".feedback");
    if (feedbackContent && isDialogOpen) {
      feedbackContent.classList.add("dialog-open");
    } else if (feedbackContent) {
      feedbackContent.classList.remove("dialog-open");
    }

    // Apply blur to form container (SongBasket)
    const formContainer = document.querySelector(".formContainer");
    if (formContainer && isDialogOpen) {
      formContainer.classList.add("dialog-open");
    } else if (formContainer) {
      formContainer.classList.remove("dialog-open");
    }

    // Apply blur to profile content
    const profileContent = document.querySelector(".profile");
    if (profileContent && isDialogOpen) {
      profileContent.classList.add("dialog-open");
    } else if (profileContent) {
      profileContent.classList.remove("dialog-open");
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
    setIsDialogOpen(open || openSuccessDialog);

    // Cleanup on unmount
    return () => {
      if (accountContainer) accountContainer.classList.remove("dialog-open");
      if (contentSection) contentSection.classList.remove("dialog-open");
      if (drawer) drawer.classList.remove("dialog-open");
      if (formContainer) formContainer.classList.remove("dialog-open");
      if (profileContent) profileContent.classList.remove("dialog-open");
      if (feedbackContent) feedbackContent.classList.remove("dialog-open");
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
  }, [open, isDialogOpen]);

  // Replace the existing handleCopyLink function with this one
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referLink);
    setOpenSuccessDialog(true);
    setIsDialogOpen(true);
    setTimeout(() => {
      setOpenSuccessDialog(false);
    }, 3000);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            borderRadius: "18px",
            backgroundColor: "#1c1f26",
            color: "white",
            textAlign: "center",
            padding: 3,
            width: "400px !important",
            height: "",
            position: "relative", // Add this line
            border:"none"
          },
        }}
      >
        {/* Add this IconButton */}
        {/* <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "white",
          }}
        >
          <img
            src={cross}
            alt="Close"
            style={{
              height: "35px",
              width: "33px",
            }}
          />
        </IconButton> */}
        <DialogContent>
          {/* Title */}
          <Typography variant="h6" sx={{ marginBottom: 2 }}>
            Share Your VOIZ !!
          </Typography>

          {/* Refer Link */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              // backgroundColor: "#33363f",
              borderRadius: "22px !important",
              marginBottom: 1,
              marginLeft: 5,
              justifyContent: "space-between",
              width: "270px",
              height:"50px !important"
            }}
          >
            <TextField
              value={referLink}
              onClick={handleCopyLink}
              sx={{
                backgroundColor: "white",
                height:"52px !important",
                borderRadius: "22px !important",
                "& .MuiOutlinedInput-root": {
                  paddingRight: 0, // Remove right padding to fit the icon
                  borderRadius: "22px !important",
                  width: "270px",
                  height:"52px !important",
                  cursor:"pointer !important"
                },
                "& .MuiInputBase-input": {
                  fontSize: "16px !important", // Increased font size
                  fontWeight: "600 !important",
                },
              }}
              InputProps={{
                readOnly: true,
                startAdornment: (
                  <IconButton
                    onClick={handleCopyLink}
                    sx={{
                      color: "black",
                      marginRight: "24px",
                      fontSize: "24px !important",
                      "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                      },
                    }}
                  >
                    <img
                      src={VectorPaste}
                      alt="Copy"
                      style={{
                        height: "30px",
                        width: "21px",
                      }}
                    />
                    {/* <ContentCopyIcon /> */}
                  </IconButton>
                ),
                sx: {
                  color: "black",
                  fontWeight: "bold",
                  fontSize: "14px",
                },
              }}
            />
            {/* <IconButton
            onClick={handleCopyLink}
            sx={{
              color: "white",
            }}
          >
            <ContentCopyIcon />
          </IconButton> */}
          </Box>

          {/* Close Button */}
          {/* <Button
          variant="contained"
          onClick={onClose}
          sx={{
            borderRadius: "24px",
            paddingX: 4,
            backgroundColor: "#2196f3",
            "&:hover": {
              backgroundColor: "#1976d2",
            },
          }}
        >
          Close
        </Button> */}
        </DialogContent>
      </Dialog>
      {/* Add this right before the final closing tag */}
      <Dialog
        open={openSuccessDialog}
        onClose={() => setOpenSuccessDialog(false)}
        sx={{
          "& .MuiDialog-paper": {
            background: "#0F0B2C",
            borderRadius: "16px",
            maxWidth: "478px",
            width: "478px",
            height: "316px",
            margin: "20px",
            marginTop: "-20px !important",
            position: "relative",
            padding: "40px 20px",
          },
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0.8) !important",
          },
        }}
      >
        <IconButton
          onClick={() => setOpenSuccessDialog(false)}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "white",
          }}
        >
          <img
            src={cross}
            alt="Close"
            style={{
              height: "35px",
              width: "33px",
            }}
          />
        </IconButton>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "20px",
            marginTop: "30px",
          }}
        >
          <Typography
            sx={{
              color: "white",
              fontSize: "24px !important",
              fontWeight: 600,
              marginBottom: "20px",
            }}
          >
            Link copied to clipboard!
          </Typography>
          <Box
            sx={{
              width: "49.41px",
              height: "50.86px",
              borderRadius: "50%",
              backgroundColor: "#2782EE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            onClick={() => setOpenSuccessDialog(false)}
          >
            <Check style={{ color: "white", fontSize: "32px" }} />
          </Box>
        </Box>
      </Dialog>
    </>
  );
};

export default Refer;
