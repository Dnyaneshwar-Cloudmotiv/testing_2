import React from "react";
// import { Box, Button, Dialog, DialogContent, Typography } from "@mui/material";
import { usePlayer } from "./PlayerContext";
import {
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import cross from "./assets/Cross.png";

const Report = ({ open, onClose }) => {
  const { currentTitle } = usePlayer();
  const handleEmailClick = () => {
    const subject = `Report#${currentTitle}`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=info@voiz.co.in&su=${encodeURIComponent(
      subject
    )}`;
    window.open(gmailUrl, "_blank");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: "28px !important",
          backgroundColor: "#151415 !important",
          color: "white",
          textAlign: "center",
          padding: 3,
          minWidth: "300px",
          width: "382px !important",
          marginTop: "-2px !important",
          height: "311px !important",
        },
      }}
    >
      <DialogContent>
        {/* Title stays the same */}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            marginLeft: "130px !important",
            marginTop: "-15px",
            color: "white",
          }}
        >
          <img
            src={cross}
            alt="Close"
            style={{
              height: "25px",
              width: "25px",
            }}
          />
        </IconButton>
        <Typography
          variant="h5"
          sx={{
            marginBottom: 2.5,
            fontSize: "32px !important",
            fontWeight: 500,
            marginTop: "60px",
          }}
        >
          Report a Song
        </Typography>

        {/* Write an email text stays the same */}
        <Typography
          variant="body1"
          sx={{ marginBottom: 0, fontWeight: 300, fontSize: "16px !important" }}
        >
          Please write an email to
        </Typography>

        {/* Email button - add bottom margin */}
        <Button
          variant="text"
          onClick={handleEmailClick}
          sx={{
            color: "#2196f3",
            fontSize: "16px !important",
            fontWeight: 400,
            "&:hover": {
              color: "#1976d2",
              textDecoration: "underline 1px",
            },
            textTransform: "lowercase",
            textDecoration: "underline 1px",
          }}
        >
          <i> info@voiz.co.in</i>
        </Button>

        {/* Cancel button stays the same
            <Button
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
              Cancel
            </Button> */}
      </DialogContent>
    </Dialog>
  );
};

export default Report;
