import React, { useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import { signOut, getCurrentUser, deleteUser } from "aws-amplify/auth";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
  IconButton,
} from "@mui/material";
import SideBar from "./SideBar";
import { useNavigate } from "react-router-dom";
import CheckIcon from "@mui/icons-material/Check";
import cross from "./assets/Cross.png";
import "./DeleteAccountPage.css";

const DeleteAccountPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userCategory, setUserCategory] = useState("");
  const [showEmailInfo, setShowEmailInfo] = useState(false);
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Apply blur to content container
    const contentContainer = document.querySelector(".delete-account-page");
    if (contentContainer && isDialogOpen) {
      contentContainer.classList.add("dialog-open");
    } else if (contentContainer) {
      contentContainer.classList.remove("dialog-open");
    }

    // Cleanup on unmount
    return () => {
      if (contentContainer) contentContainer.classList.remove("dialog-open");
    };
  }, [isDialogOpen]);

  useEffect(() => {
    const category = localStorage.getItem("Category");
    setUserCategory(category || "");
  }, []);

  const handleCognitoDelete = async () => {
    try {
      await deleteUser();
      console.log("Successfully deleted from Cognito");

      await signOut();
      console.log("Successfully signed out");

      localStorage.clear();

      // Directly open success dialog before navigating
      setOpenSuccessDialog(true);

      // Optional: Use setTimeout to ensure dialog is visible before navigation
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Cognito deletion error:", error);
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (userCategory === "Singer") {
      setShowEmailInfo(true);
      setIsDialogOpen(false);
      return;
    }

    setIsLoading(true);
    const userId = localStorage.getItem("user_id");
    const token = localStorage.getItem("token");

    try {
      await getCurrentUser();

      const response = await fetch(
        "https://xkn24pj0ba.execute-api.ap-south-1.amazonaws.com/default/delete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          mode: "cors",
          body: JSON.stringify({
            user_id: `${userId}`,
            action: "delete"
          }),
        }
      );

      const data = await response.json();

      if (response.status !== 200) {
        throw new Error(
          data.message || "Failed to delete account from backend"
        );
      }

      // Call Cognito delete which now triggers success dialog
      await handleCognitoDelete();
    } catch (error) {
      console.error("Error during deletion process:", error);

      if (error.message.includes("backend")) {
        alert("Failed to delete account from our systems. Please try again.");
      } else if (error.message.includes("Cognito")) {
        alert(
          "Account removed from our systems but failed to complete cleanup. Please contact support."
        );
      } else {
        alert(
          "An unexpected error occurred. Please try again or contact support."
        );
      }
    } finally {
      setIsLoading(false);
      setIsDialogOpen(false);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("info@voiz.co.in");
    alert("Email address copied to clipboard!");
  };

  const handleSuccessClose = () => {
    setOpenSuccessDialog(false);
    navigate("/");
  };

  return (
    <Box display="flex">
      <SideBar />
      <Box
        className="delete-account-page"
        flex={1}
        p={4}
        sx={{
          marginTop: "80px",
          overflow: "none !important",
          height: "80vh !important",
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            marginTop: "30px !important",
            color: "white !important",
            marginRight: "240px !important",
          }}
        >
          Delete Account
        </Typography>

        {userCategory === "Singer" ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            As a Singer account holder, you'll need to request account deletion
            via email.
          </Alert>
        ) : (
          <Typography
            gutterBottom
            sx={{
              marginLeft: "200px !important",
              marginTop: "50px !important",
              fontSize: "20px !important",
            }}
          >
            Deleting your account is permanent and cannot be undone.
            <br /> All your data will be permanently removed. Please confirm to
            proceed.
          </Typography>
        )}

        <Button
          variant="contained"
          color="error"
          onClick={() => setIsDialogOpen(true)}
          sx={{ marginTop: "50px !important", marginLeft: "30% !important" }}
          disabled={isLoading}
        >
          Delete Account
        </Button>

        {/* Confirmation Dialog */}
        <Dialog
          open={isDialogOpen}
          onClose={() => !isLoading && setIsDialogOpen(false)}
          sx={{
            width: "350px !important",
            marginLeft: "590px !important",
            marginBottom: "50px !important",
            "& .MuiDialog-paper": {
              backgroundColor: "#151415 !important",
              color: "white",
            },
          }}
        >
          <DialogTitle>Confirm Account Deletion</DialogTitle>
          <DialogContent>
            <Typography sx={{ textAlign: "center !important" }}>
              Are you sure you want to delete your account? This action cannot
              be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
              sx={{
                color: "white !important",
                textTransform: "none",
                fontSize: "16px",
                marginRight: "80px !important",

                "&:hover": {
                  backgroundColor: "rgba(39, 130, 238, 0.08)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={isLoading}
              sx={{
                color: "white !important",
                textTransform: "none",
                fontSize: "16px",

                "&:hover": {
                  backgroundColor: "rgba(39, 130, 238, 0.08)",
                },
              }}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Email Info Dialog for Singers */}
        <Dialog open={showEmailInfo} onClose={() => setShowEmailInfo(false)}>
          <DialogTitle>Contact Us to Delete Account</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              Please send an email to request account deletion:
            </Typography>
            <Typography
              sx={{
                backgroundColor: "#f5f5f5",
                p: 2,
                borderRadius: 1,
                mt: 1,
                fontWeight: "medium",
              }}
            >
              info@voiz.co.in
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEmailInfo(false)}>Close</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCopyEmail}
            >
              Copy Email
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openSuccessDialog}
          onClose={handleSuccessClose}
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
              backgroundColor: "rgba(0, 0, 0, 0.8)",
            },
          }}
        >
          <IconButton
            onClick={handleSuccessClose}
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
              Account deleted successfully
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
              onClick={handleSuccessClose}
            >
              <CheckIcon sx={{ color: "white", fontSize: "32px" }} />
            </Box>
          </Box>
        </Dialog>
      </Box>
    </Box>
  );
};

export default DeleteAccountPage;
