import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  IconButton,
} from "@mui/material";
import GoogleAuthService from "./GoogleAuthService";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { resetPassword } from "aws-amplify/auth";

const MergeAccountDialog = ({ open, onClose, email, onMergeComplete }) => {
  const [confirmationCode, setConfirmationCode] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [success, setSuccess] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  // Try to send the initial code when the dialog opens
  useEffect(() => {
    if (open && email && !codeSent) {
      sendResetCode();
    }
  }, [open, email]);

  // Countdown timer for resend button
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const sendResetCode = async () => {
    if (!email) return;

    setResendLoading(true);
    setError(null);

    try {
      console.log("Sending reset code to:", email);

      // Use AWS Amplify's resetPassword directly to ensure it works
      await resetPassword({ username: email });

      setCodeSent(true);
      setError("Verification code sent to your email");
      setResendCountdown(30);
    } catch (error) {
      console.error("Error sending reset code:", error);
      setError("Failed to send verification code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirmationCode.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Submitting code:", confirmationCode, "for email:", email);
      const result = await GoogleAuthService.completeAccountMerge(
        email,
        confirmationCode
      );

      console.log("Account merge result:", result);

      if (result.success) {
        // Show success message and animate before closing
        setSuccess(true);

        // Wait a moment to show the success message before completing
        setTimeout(() => {
          // Call the parent component's handler to complete the process
          onMergeComplete(result);
        }, 1500);
      } else {
        setError(result.error || "Failed to verify code. Please try again.");
      }
    } catch (error) {
      console.error("Error during account merge:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    await sendResetCode();
  };

  const handleDialogClose = () => {
    // Reset all state when dialog closes
    setConfirmationCode("");
    setError(null);
    setSuccess(false);
    setCodeSent(false);
    onClose();
  };

  if (success) {
    return (
      <Dialog
        open={open}
        PaperProps={{
          style: {
            backgroundColor: "#160101",
            borderRadius: "12px",
            width: "400px",
            padding: "24px",
          },
        }}
      >
        <DialogContent sx={{ textAlign: "center", py: 4 }}>
          <CheckCircleIcon sx={{ color: "#4caf50", fontSize: 60, mb: 2 }} />
          <Typography
            sx={{ color: "white", fontWeight: "bold", fontSize: "18px" }}
          >
            Account Linked Successfully!
          </Typography>
          <Typography sx={{ color: "white", mt: 1 }}>
            Redirecting to your account...
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      PaperProps={{
        style: {
          backgroundColor: "#160101",
          borderRadius: "12px",
          width: "400px",
          padding: "24px",
        },
      }}
    >
      <IconButton
        onClick={handleDialogClose}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          color: "white",
        }}
      >
        <HighlightOffIcon />
      </IconButton>

      <DialogTitle sx={{ color: "white", textAlign: "center" }}>
        Link Your Google Account
      </DialogTitle>

      <DialogContent sx={{ textAlign: "center" }}>
        <Typography sx={{ color: "white", mb: 1 }}>
          {codeSent
            ? "We've sent a verification code to:"
            : "Sending verification code to:"}
        </Typography>
        <Typography sx={{ color: "white", fontWeight: "bold", mb: 2 }}>
          {email}
        </Typography>
        <Typography sx={{ color: "white", mb: 3 }}>
          Enter the code to link your existing account with Google.
        </Typography>
        <TextField
          value={confirmationCode}
          type="text"

          onChange={(e) => {
            const value = e.target.value;
            const numbersOnly = value.replace(/\D/g, '').slice(0, 6);
            setConfirmationCode(numbersOnly);
            setError("");
          }}
          onPaste={(e) => {
            e.preventDefault();
            const paste = e.clipboardData.getData("text");
            const numbersOnly = paste.replace(/\D/g, '').slice(0, 6);
            setConfirmationCode(numbersOnly);
          }}


          // onChange={(e) => {
          //   // Allow only numbers, no trimming, limit to 6 digits
          //   const value = e.target.value.trim();
          //   const numbersOnly = value.replace(/\D/g, '').slice(0, 6);
          //   setConfirmationCode(numbersOnly);
          //   setError("");
          // }}
          placeholder="Verification Code"
          variant="outlined"
          fullWidth
          sx={{
            marginTop: "20px !important",
            width: "330px !important",
            height: "50px !important",
            backgroundColor: "#d3d2d2",
            "& .MuiOutlinedInput-notchedOutline": {
              position: "static !important",
              borderColor: "#d3d2d2 !important",
            },
            "& input::placeholder": {
              fontSize: "14px",
              color: "black !important",
              opacity: 0.7,
              fontFamily: "Poppins !important",
            },
            "& .MuiOutlinedInput-input": {
              color: "black !important",
              position: "relative !important",
            },
            "& .MuiOutlinedInput-root": {
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#d3d2d2 !important",
              },
            },
          }}
          inputProps={{
            maxLength: 6,
            inputMode: "numeric", // Brings up number keyboard on mobile
            pattern: "[0-9]*",     // Hints that only numbers are allowed
          }}
        />

        {/* <TextField
          value={confirmationCode}
          onChange={(e) => {
            setConfirmationCode(e.target.value);
            setError(null);
          }}
          placeholder="Verification Code"
          variant="outlined"
          fullWidth
          sx={{
            marginTop: "20px !important",
            width: "330px !important",
            height: "50px !important",
            backgroundColor: "#d3d2d2",
            "& .MuiOutlinedInput-notchedOutline": {
              position: "static !important",
              borderColor: "#d3d2d2 !important",
            },
            "& input::placeholder": {
              fontSize: "14px",
              color: "black !important",
              opacity: 0.7,
              fontFamily: "Poppins !important",
            },
            "& .MuiOutlinedInput-input": {
              color: "black !important",
              position: "relative !important",
            },
            "& .MuiOutlinedInput-root": {
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#d3d2d2 !important",
              },
            },
          }}
          inputProps={{
            maxLength: 6,
          }}
        /> */}

        {error && (
          <Typography
            sx={{
              color: error.includes("sent") ? "#4caf50" : "#f44336",
              textAlign: "center",
              fontSize: "14px",
              mb: 2,
              mt: 1,
            }}
          >
            {error}
          </Typography>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            mt: 2,
            px: 1,
          }}
        >
          <Button
            onClick={handleResendCode}
            disabled={resendCountdown > 0 || resendLoading || isLoading}
            sx={{
              color: resendCountdown > 0 ? "gray" : "white",
              textTransform: "none",
              fontSize: "14px",
              "&.Mui-disabled": {
                color: "gray",
              },
            }}
          >
            {resendLoading ? (
              <CircularProgress size={16} sx={{ color: "white", mr: 1 }} />
            ) : resendCountdown > 0 ? (
              `Resend Code (${resendCountdown}s)`
            ) : (
              "Resend Code"
            )}
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isLoading || !confirmationCode.trim()}
            variant="contained"
            sx={{
              backgroundColor: "#2644D9",
              color: "white",
              borderRadius: "25px",
              padding: "8px 24px",
              fontSize: "16px",
              fontWeight: "bold",
              "&.Mui-disabled": {
                backgroundColor: "#4a4a4a",
              },
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : (
              "Verify"
            )}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default MergeAccountDialog;
