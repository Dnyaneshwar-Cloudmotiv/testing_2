import React, { useState, useEffect } from "react";
import {
  Button,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Typography,
} from "@mui/material";
import { signIn, signOut } from "aws-amplify/auth";
import logo from "./assets/voizlogo.png";
import "./LandingPage.css";
import google from "./assets/Google.png";
import { useNavigate } from "react-router-dom";
import GoogleAuthService from "./GoogleAuthService";
import MergeAccountDialog from "./MergeAccountDialog";

export default function LandingPage() {
  const navigate = useNavigate();

  // States for standard login/signup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // States for Google Sign-In
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // States for confirmation dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // State for account merge dialog
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeEmail, setMergeEmail] = useState("");

  // Add this useEffect at the top of your component after your state declarations
  useEffect(() => {
    const clearSessions = async () => {
      try {
        setLoading(true);

        // Clear Firebase/Google auth sessions
        await GoogleAuthService.clearPreviousAuthSessions();

        // Also clear Cognito sessions if user is signed in
        try {
          await signOut();
          console.log("Successfully signed out of Cognito");
        } catch (cognitoError) {
          // Ignore errors, as the user might not be signed in
          console.log("Cognito sign out not needed or failed:", cognitoError);
        }

        // Clear any stored auth data except navigation-critical items
        localStorage.removeItem("user_id");
        localStorage.removeItem("FullName");
        localStorage.removeItem("EmailId");
        localStorage.removeItem("Category");
        localStorage.removeItem("StageName");
        localStorage.removeItem("PhoneNumber");
        localStorage.removeItem("GoogleSignup");

        console.log("Auth sessions cleared on landing page load");
      } catch (error) {
        console.error("Error clearing sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    clearSessions();
  }, []);

  // Countdown timer for resend code button
  useEffect(() => {
    let timer;
    if (confirmDialogOpen && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [confirmDialogOpen, resendCountdown]);

  // Original login/signup navigation functions
  const handleSignUp = () => {
    localStorage.clear(); // Clear any existing data
    navigate("/signup");
  };

  const handleLogin = () => {
    localStorage.clear(); // Clear any existing data
    navigate("/loginpage");
  };

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);

    try {
      const result = await GoogleAuthService.signUpWithGoogle();

      if (result.success) {
        // Handle different authentication scenarios
        if (result.requiresConfirmation) {
          // Show email confirmation dialog
          setConfirmEmail(result.email);
          setConfirmDialogOpen(true);
          setResendCountdown(30);
        } else if (result.requiresMerge) {
          // Show merge account dialog
          setMergeEmail(result.email);
          setMergeDialogOpen(true);
        } else {
          // Store user data in localStorage if available
          if (result.userDetails) {
            localStorage.setItem("user_id", result.userDetails.userId || "");
            localStorage.setItem("FullName", result.userDetails.fullName || "");
            localStorage.setItem("EmailId", result.userDetails.email || "");
            localStorage.setItem(
              "Category",
              result.userDetails.userCategory || ""
            );
            localStorage.setItem(
              "StageName",
              result.userDetails.stageName || ""
            );
            localStorage.setItem(
              "PhoneNumber",
              result.userDetails.phoneNumber || ""
            );
          }

          // Check if mandate needs to be filled
          if (result.shouldFillDetails) {
            navigate("/userdetails", {
              state: {
                email: result.userDetails.email,
                userId: result.userDetails.userId,
                shouldFillDetails: true,
              },
            });
          } else {
            // Handle shared playlist/song navigation similar to normal login
            const intendedPath = sessionStorage.getItem("intendedPath");
            const sharedPlaylistInfo = sessionStorage.getItem(
              "shared_playlist_info"
            );
            const sharedSongId = localStorage.getItem("sharedSongId");

            if (intendedPath && sharedPlaylistInfo) {
              // If we have shared playlist info, use it for navigation
              const playlistData = JSON.parse(sharedPlaylistInfo);
              navigate(
                `/playlist/${playlistData.id}?name=${encodeURIComponent(
                  playlistData.name
                )}`
              );
            } else if (intendedPath && sharedSongId) {
              // If we have a shared song ID, navigate to it
              navigate(`/song/${sharedSongId}`);
            } else if (intendedPath) {
              // Use the intended path if available
              navigate(intendedPath);
            } else {
              // Default to homepage
              navigate("/homepage");
            }

            // Clean up session storage
            sessionStorage.removeItem("intendedPath");
          }
        }
      } else if (result.userNotFound) {
        // User doesn't exist - redirect to signup
        navigate("/signup", {
          state: {
            message: "Please create an account first.",
          },
        });
      } else if (result.existingGoogleUser) {
        // This is a new condition we're checking for users who already signed up with Google
        showNotification(
          "You've already signed up with Google. Please login instead.",
          "info"
        );
        // Wait a moment for notification to be visible before redirecting
        setTimeout(() => {
          navigate("/loginpage");
        }, 3000);
      } else {
        // Show error notification
        showNotification(
          result.error || "Failed to sign up with Google",
          "error"
        );
      }
    } catch (error) {
      console.error("Google sign-up error:", error);
      showNotification(
        "Failed to sign up with Google. Please try again.",
        "error"
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // const handleMergeComplete = (mergeResult) => {
  //   setMergeDialogOpen(false);

  //   if (mergeResult && mergeResult.success) {
  //     // Store user data in localStorage if available
  //     if (mergeResult.userDetails) {
  //       localStorage.setItem("user_id", mergeResult.userDetails.userId || "");
  //       localStorage.setItem(
  //         "FullName",
  //         mergeResult.userDetails.fullName || ""
  //       );
  //       localStorage.setItem("EmailId", mergeResult.userDetails.email || "");
  //       localStorage.setItem(
  //         "Category",
  //         mergeResult.userDetails.userCategory || ""
  //       );
  //       localStorage.setItem(
  //         "StageName",
  //         mergeResult.userDetails.stageName || ""
  //       );
  //     }

  //     // Check if mandate needs to be filled
  //     if (mergeResult.shouldFillDetails) {
  //       navigate("/userdetails", {
  //         state: {
  //           email: mergeResult.userDetails.email,
  //           userId: mergeResult.userDetails.userId,
  //           shouldFillDetails: true,
  //         },
  //       });
  //     } else {
  //       // Handle shared playlist/song navigation similar to normal login
  //       const intendedPath = sessionStorage.getItem("intendedPath");
  //       const sharedPlaylistInfo = sessionStorage.getItem(
  //         "shared_playlist_info"
  //       );
  //       const sharedSongId = localStorage.getItem("sharedSongId");

  //       if (intendedPath && sharedPlaylistInfo) {
  //         const playlistData = JSON.parse(sharedPlaylistInfo);
  //         navigate(
  //           `/playlist/${playlistData.id}?name=${encodeURIComponent(
  //             playlistData.name
  //           )}`
  //         );
  //       } else if (intendedPath && sharedSongId) {
  //         navigate(`/song/${sharedSongId}`);
  //       } else if (intendedPath) {
  //         navigate(intendedPath);
  //       } else {
  //         navigate("/homepage");
  //       }

  //       // Clean up session storage
  //       sessionStorage.removeItem("intendedPath");
  //     }
  //   } else {
  //     showNotification("Failed to complete account linking", "error");
  //   }
  // };

  const handleConfirmSignUp = async () => {
    if (!confirmCode) {
      setConfirmError("Please enter the verification code");
      return;
    }

    setIsConfirmLoading(true);
    setConfirmError("");

    try {
      // Confirm sign up in Cognito
      const result = await GoogleAuthService.confirmSignUp(
        confirmEmail,
        confirmCode
      );

      if (result.success) {
        // Close confirmation dialog
        setConfirmDialogOpen(false);

        try {
          // Generate Google-specific password
          const googlePassword = await GoogleAuthService.fetchGooglePassword(confirmEmail);

          // Create the user in DynamoDB
          const saveResult = await GoogleAuthService.createUserInDynamoDB(
            confirmEmail
          );

          if (!saveResult.success) {
            setConfirmError("Failed to save user data.");
            setIsConfirmLoading(false);
            return;
          }

          const userId = saveResult.userId;
          console.log("User saved in DynamoDB:", userId);

          // Sign in the user to maintain the session
          const signInResult = await signIn({
            username: confirmEmail,
            password: googlePassword,
          });

          if (!signInResult) {
            console.error("Failed to sign in after confirmation");
          }

          // Store important user data in localStorage
          localStorage.setItem("user_id", userId);
          localStorage.setItem("EmailId", confirmEmail);
          localStorage.setItem("GoogleSignup", "true");

          // Check if mandate details need to be filled
          const mandateResponse = await fetch(
            `https://i3lmfmc1h2.execute-api.ap-south-1.amazonaws.com/voizpost/save/getmandate?user_id=${userId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (!mandateResponse.ok) {
            navigate("/userdetails", {
              state: {
                email: confirmEmail,
                userId: userId,
                shouldFillDetails: true,
              },
            });
            return;
          }

          const mandateData = await mandateResponse.json();
          if (mandateData.FillMandateDetails) {
            // Handle shared playlist/song navigation
            const intendedPath = sessionStorage.getItem("intendedPath");
            const sharedPlaylistInfo = sessionStorage.getItem(
              "shared_playlist_info"
            );
            const sharedSongId = localStorage.getItem("sharedSongId");

            if (intendedPath && sharedPlaylistInfo) {
              const playlistData = JSON.parse(sharedPlaylistInfo);
              navigate(
                `/playlist/${playlistData.id}?name=${encodeURIComponent(
                  playlistData.name
                )}`
              );
            } else if (intendedPath && sharedSongId) {
              navigate(`/song/${sharedSongId}`);
            } else if (intendedPath) {
              navigate(intendedPath);
            } else {
              navigate("/homepage");
            }

            // Clean up session storage
            sessionStorage.removeItem("intendedPath");
          } else {
            // If mandate not filled, go to userdetails
            navigate("/userdetails", {
              state: {
                email: confirmEmail,
                userId: userId,
                shouldFillDetails: true,
              },
            });
          }
        } catch (error) {
          console.error("Error after confirmation:", error);

          // Even on error, try to navigate to UserDetails if we have an email
          navigate("/userdetails", {
            state: {
              email: confirmEmail,
              shouldFillDetails: true,
            },
          });
        }
      } else {
        setConfirmError(result.error || "Failed to confirm account");
      }
    } catch (error) {
      console.error("Confirmation error:", error);
      setConfirmError("Failed to confirm account. Please try again.");
    } finally {
      setIsConfirmLoading(false);
    }
  };

  const handleResendConfirmationCode = async () => {
    setIsConfirmLoading(true);

    try {
      const result = await GoogleAuthService.resendConfirmationCode(
        confirmEmail
      );

      if (result.success) {
        setConfirmError("Verification code resent to your email");
        setResendCountdown(30);
      } else {
        setConfirmError(result.error || "Failed to resend code");
      }
    } catch (error) {
      console.error("Resend code error:", error);
      setConfirmError("Failed to resend code. Please try again.");
    } finally {
      setIsConfirmLoading(false);
    }
  };

  // Notification handler functions
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // const showNotification = (message, severity = "info") => {
  //   setNotification({
  //     open: true,
  //     message,
  //     severity,
  //   });
  // };

  const showNotification = (message, type) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  return (
    <Box className="HomePage">
      <img
        src={logo}
        alt="Logo"
        className="LandingPageLogo"
        style={{ marginTop: "27px" }}
      />
      <Box className="buttonContainer" sx={{ mt: 5 }}>
        <Button
          variant="contained"
          color="primary"
          className="homeButton"
          onClick={handleLogin}
          disabled={loading || isGoogleLoading}
          sx={{
            width: "320px !important",
            height: "60px !important",
            fontSize: "24px !important",
            borderRadius: "25px !important",
            "&:hover": {
              backgroundColor: "#2644d9 !important",
            },
          }}
        >
          Log in
        </Button>

        <Button
          variant="contained"
          color="primary"
          className="homeButton"
          onClick={handleSignUp}
          disabled={loading || isGoogleLoading}
          sx={{
            backgroundColor: "#2644d9 !important",
            width: "320px !important",
            height: "60px !important",
            fontSize: "24px !important",
            borderRadius: "25px !important",
            "&:hover": {
              backgroundColor: "#2644d9 !important",
            },
          }}
        >
          Sign up
        </Button>

        {/* <Button
          variant="outlined"
          className="googleButton"
          onClick={handleGoogleAuth}
          disabled={isGoogleLoading}
          sx={{
            color: "#3a3a3a !important",
            borderColor: "gray",
            backgroundColor: "white",
            fontSize: "15px",
            fontWeight: "bold",
            padding: "10px 18px",
            textTransform: "none",
            textAlign: "center !important",
            position: "relative",
            fontFamily: "Poppins",
            width: "320px !important",
            height: "60px !important",
            borderRadius: "25px !important",
            fontSize: "18px",
          }}
        >
          {isGoogleLoading ? (
            <CircularProgress size={20} sx={{ position: "absolute" }} />
          ) : (
            <>
              <img
                src={google}
                alt="Google Icon"
                className="googleIcon"
                sx={{
                  padding: "0 0 0 -5px",
                  backgroundColor: "#e9e9e9 !important",
                }}
              />
              Continue with Google
            </>
          )}
        </Button> */}
      </Box>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Original error notification */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Email Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => !isConfirmLoading && setConfirmDialogOpen(false)}
        PaperProps={{
          style: {
            backgroundColor: "#160101",
            borderRadius: "12px",
            width: "400px",
            padding: "24px",
          },
        }}
      >
        <DialogTitle sx={{ color: "white", textAlign: "center" }}>
          Confirm Sign Up
        </DialogTitle>

        <DialogContent sx={{ textAlign: "center" }}>
          <Typography sx={{ color: "white", mb: 1 }}>
            A confirmation code was sent to:
          </Typography>
          <Typography sx={{ color: "white", fontWeight: "bold", mb: 2 }}>
            {confirmEmail}
          </Typography>
          <Typography sx={{ color: "white", mb: 3 }}>
            Enter the confirmation code below to verify your account.
          </Typography>

          <TextField
  value={confirmCode}
  onChange={(e) => {
    // Only allow 6 digits, trim whitespace
    const trimmedValue = e.target.value.trim();
    const digitsOnly = trimmedValue.replace(/\D/g, '').slice(0, 6);
    setConfirmCode(digitsOnly);
    setConfirmError("");
  }}
  placeholder="Code"
  variant="outlined"
  fullWidth
  sx={{
    marginTop: "20px !important",
    width: "330px !important",
    height: "50px !important",

    "& .MuiOutlinedInput-notchedOutline": {
      position: "static !important", // Override the absolute position
    },
    "& input::placeholder": {
      paddingLeft: "30px",
      fontSize: "14px",
      color: "black !important",
      opacity: 1,
      fontFamily: "Poppins !important",
      letterSpacing: "1px !important",
    },
    "& .MuiOutlinedInput-input": {
      color: "black !important", // Make text visible on dark background
      position: "relative !important",
    },
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        borderColor: "rgba(255, 255, 255, 0.5) !important", // Make border visible
      },
      "&:hover fieldset": {
        borderColor: "white !important",
      },
    },
  }}
  inputProps={{
    maxLength: 6,
  }}
/>

          {confirmError && (
            <Typography
              sx={{
                color: confirmError.includes("resent") ? "#4caf50" : "#f44336",
                textAlign: "center",
                fontSize: "14px",
                mb: 2,
              }}
            >
              {confirmError}
            </Typography>
          )}

<Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mt: 0,
  }}
>
  <Button
    onClick={handleResendConfirmationCode}
    disabled={resendCountdown > 0 || isConfirmLoading}
    sx={{
      textTransform: "none",
      fontFamily: "Poppins !important",
      letterSpacing: "1px !important",
      fontWeight: "300",
      color: resendCountdown > 0 ? "#2644D9 !important" : "#2644D9 !important",
      opacity: resendCountdown > 0 ? 0.5 : 1,
    }}
  >
    {resendCountdown > 0 ? (
      <span
        style={{
          color: "#2644D9 !important",
          fontSize: "13px",
        }}
      >
        Resend code in {resendCountdown}s
      </span>
    ) : (
      <span
        style={{
          color: "#2644D9 !important",
          fontSize: "13px",
        }}
      >
        Resend code
      </span>
    )}
  </Button>
</Box>

          <Button
            onClick={handleConfirmSignUp}
            disabled={isConfirmLoading}
            variant="contained"
            sx={{
              backgroundColor: "#2644D9",
              color: "white",
              borderRadius: "25px",
              padding: "10px 30px",
              fontSize: "16px",
              fontWeight: "bold",
              width: "174px",
              height: "47px",
            }}
          >
            {isConfirmLoading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Merge Account Dialog */}
      {/* <MergeAccountDialog
        open={mergeDialogOpen}
        onClose={() => setMergeDialogOpen(false)}
        email={mergeEmail}
        onMergeComplete={handleMergeComplete}
      /> */}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{
          maxWidth: "80%",
          position: "absolute",
          top: "600px !important", // Adjust based on your layout
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        {snackbarMessage ===
        "You've already signed up with Google. Please login instead." ? (
          <Box
            sx={{
              backgroundColor: "#2644d9",
              color: "white",
              padding: "12px 16px",
              borderRadius: "10px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <Typography sx={{ display: "block" }}>
              You've already signed up with Google.
            </Typography>
            <Typography sx={{ display: "block" }}>
              Please login instead.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              backgroundColor: "#2196f3",
              color: "white",
              padding: "12px 16px",
              borderRadius: "4px",
              marginTop: "200px !important",
            }}
          >
            <Typography>{snackbarMessage}</Typography>
          </Box>
        )}
      </Snackbar>
    </Box>
  );
}