import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
  Link,
} from "@mui/material";
import logo from "./assets/voizlogo.png";
import "./LoginPage.css";
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";
import { Amplify } from "aws-amplify";
import { signIn } from "aws-amplify/auth";
import { resetPassword, confirmResetPassword } from "aws-amplify/auth";
import awsExports from "./aws-exports";
import { useNavigate } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { grey } from "@mui/material/colors";

import GoogleAuthService from "./GoogleAuthService";
import google from "./assets/Google.png";
import CircularProgress from "@mui/material/CircularProgress";
import MergeAccountDialog from "./MergeAccountDialog";
import checkmarkicon from "./assets/checkmarkicon.png";

Amplify.configure(awsExports);

export default function LoginPage() {
  // Login state variables
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };
  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  // Forgot Password dialog state variables
  const [openForgotPassword, setOpenForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(null);

  // Timer state variables
  const [timer, setTimer] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);

  // Validation state variables
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [resetPasswordStatus, setResetPasswordStatus] = useState(null); // New state to track the status
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);

  // Ref for the "Forgot Password?" button
  const forgotPasswordButtonRef = useRef(null);
  const [isCodeSent, setIsCodeSent] = useState(false); // Tracks if code has been sent
  const [isSendDisabled, setIsSendDisabled] = useState(false); // Tracks if "Send Code" is disabled
  const [confirmationCodeError, setConfirmationCodeError] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeEmail, setMergeEmail] = useState("");

  // Effect to apply blur when any dialog is open
  useEffect(() => {
    // Update dialog open state based on both dialogs
    const dialogOpen = openForgotPassword || forgotSuccess !== null;
    setIsDialogOpen(dialogOpen);

    // Apply blur when any dialog is open
    const loginContainer = document.querySelector(".userInfoForm");
    if (loginContainer) {
      if (dialogOpen) {
        loginContainer.classList.add("dialog-open");
      } else {
        loginContainer.classList.remove("dialog-open");
      }
    }

    // Cleanup on unmount
    return () => {
      if (loginContainer) {
        loginContainer.classList.remove("dialog-open");
      }
    };
  }, [openForgotPassword, forgotSuccess]);

  const handleToggleNewPasswordVisibility = () => {
    setShowNewPassword((prev) => !prev);
  };

  const handleToggleConfirmNewPasswordVisibility = () => {
    setShowConfirmNewPassword((prev) => !prev);
  };

  // const validateEmail = (email) => {
  //   const trimmedEmail = email.trim();
  //   const regex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|hotmail\.com|msn\.com|iol\.co\.in|iol\.com|outlook\.com|protonmail\.com|icloud\.com|cloudmotivglobal\.com|mmcoe\.edu\.in|voiz\.info\.in)$/i;
  //   return regex.test(trimmedEmail);
  // };
  useEffect(() => {
    // Defensive cleanup on login page load
    localStorage.clear();
    sessionStorage.clear();
  }, []);
  

  useEffect(() => {
    let countdown = null;
    if (timer > 0) {
      countdown = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsResendDisabled(false); // Enable "Resend Code" button when timer ends
    }
    return () => clearInterval(countdown);
  }, [timer]);

  async function handleResetPassword(username) {
    try {
      const output = await resetPassword({ username });
      setResetPasswordStatus("success"); // Mark success
      setForgotError(null); // Clear any existing error
      setIsCodeSent(true); // Enable resend button visibility
      handleResetPasswordNextSteps(output);
      return "success"; // Return success status
    } catch (error) {
      if (error.name === "UserNotFoundException") {
        setResetPasswordStatus("userNotFound"); // Set user not found status
        setForgotError("User does not exist");
      } else {
        setResetPasswordStatus("error"); // Generic error
        setForgotError("An unexpected error occurred. Please try again later");
      }
      return "error"; // Return error status
    }
  }

  // Update the handleConfirmResetPassword function:
  async function handleConfirmResetPassword({
    username,
    confirmationCode,
    newPassword,
  }) {
    try {
      await confirmResetPassword({ username, confirmationCode, newPassword });
      setForgotSuccess("Your password has been reset successfully");
      setForgotError(null); // Clear any existing errors
      setConfirmationCodeError(""); // Clear confirmation code error
      setTimeout(() => {
        setOpenForgotPassword(false);
        resetForgotPasswordStates();
        // Reset all states to their initial values
        setForgotPasswordStep(1);
        setForgotEmail("");
        setConfirmationCode("");
        setNewPassword("");
        setConfirmNewPassword("");
        setForgotSuccess(null);
        setForgotError(null);
        setConfirmationCodeError("");
        setEmailError("");
        setPasswordError("");
        setConfirmPasswordError("");
        setIsEmailValid(false);
        setIsPasswordValid(false);
        setIsConfirmPasswordValid(false);
        setIsCodeSent(false);
        setIsSendDisabled(false);
        setIsResendDisabled(false);
        setTimer(0);
        setShowNewPassword(false);
        setShowConfirmNewPassword(false);
      }, 2000);
    } catch (error) {
      // Set error specifically for confirmation code instead of general error
      if (error.name === "CodeMismatchException") {
        setConfirmationCodeError(
          "Invalid confirmation code. Please try again."
        );
      } else {
        setConfirmationCodeError("Error verifying code. Please try again.");
      }
      setForgotError(null); // Clear the general error
    }
  }

  function resetForgotPasswordStates() {
    setForgotPasswordStep(1);
    setForgotEmail("");
    setConfirmationCode("");
    setNewPassword("");
    setConfirmNewPassword("");
    setForgotSuccess(null);
    setForgotError(null);
    setConfirmationCodeError(""); // Clear confirmation code error
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setIsEmailValid(false);
    setIsPasswordValid(false);
    setIsConfirmPasswordValid(false);
  }

  function handleResetPasswordNextSteps(output) {
    const { nextStep } = output;
    switch (nextStep.resetPasswordStep) {
      case "CONFIRM_RESET_PASSWORD_WITH_CODE":
        setForgotSuccess("Password reset code sent to your email");
        setForgotPasswordStep(2);
        break;
      case "DONE":
        setForgotSuccess("Your password has been reset successfully");
        setTimeout(() => {
          setOpenForgotPassword(false);
          resetForgotPasswordStates();
        }, 2000);
        break;
      default:
        setForgotError("Unexpected step in password reset process");
    }
  }

  const handleLogin = async () => {
    const errors = {};
    // localStorage.clear();

    // Input validation
    if (!username.trim()) {
      errors.username = "Please enter your Email ID";
    }

    if (!password.trim()) {
      errors.password = "Please enter your password";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    if (Object.keys(errors).length > 0) {
      setError(errors);
      return;
    }

    try {
      setError(null);
      const result = await signIn({ username, password });
      console.log("Sign in result:", result);

      if (result.isSignedIn === true) {
        // Get user ID first
        const userResponse = await fetch(
          `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/userId?email=${username}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user ID");
        }

        const userData = await userResponse.json();
        if (!userData || !userData[0]) {
          navigate("/userdetails", {
            state: { email: username },
          });
          return;
        }

        const user = userData[0];
        const userId = user.user_id?.S;

        // Update lastLogin value to "Web"
        if (userId) {
          try {
            const updateLoginResponse = await fetch(
              "https://knjixc4wse.execute-api.ap-south-1.amazonaws.com/admin_report/update_last_login",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  user_id: userId,
                  lastLogin: "Web", // Setting the lastLogin value to "Web"
                }),
              }
            );

            if (updateLoginResponse.ok) {
              console.log("Last login platform updated to Web successfully");
            } else {
              console.warn("Failed to update last login platform");
            }
          } catch (loginError) {
            // Don't stop the login flow if this fails, just log the error
            console.error("Error updating last login platform:", loginError);
          }
        }

        // Store user data in localStorage
        localStorage.setItem("user_id", userId || "");
        localStorage.setItem("FullName", user.FullName?.S || "");
        localStorage.setItem("EmailId", user.EmailId?.S || "");
        localStorage.setItem("Category", user.Category?.S || "");
        localStorage.setItem("StageName", user.StageName?.S || "");
        localStorage.setItem("ProfilePhotoUrl", user.profilePhotoUrl?.S || "");
        localStorage.setItem("PhoneNumber", user.PhoneNumber?.S || "");

        // Check mandate details
        if (userId) {
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
              state: { email: username },
            });
            return;
          }

          const mandateData = await mandateResponse.json();
          if (mandateData.FillMandateDetails) {
            // Handle shared playlist/song navigation after successful login
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
          } else {
            // If mandate not filled, go to userdetails
            navigate("/userdetails", {
              state: { email: username },
            });
          }
        } else {
          // If no userId, go to userdetails
          navigate("/userdetails", {
            state: { email: username },
          });
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.name === "UserNotFoundException") {
        setError({
          username: "Account doesn't exist. Please create a new one",
        });
      } else if (error.name === "NotAuthorizedException") {
        setError({ password: "Incorrect password. Please try again" });
      } else {
        setError({ general: "Login failed. Please check your credentials" });
      }
    }
  };

  async function getUserId(email) {
    try {
      const response = await fetch(
        `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/userId?email=${email}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data[0]?.user_id?.S || null;
    } catch (error) {
      console.error("Error getting user ID:", error);
      return null;
    }
  }

  const handleOpenForgotPassword = () => {
    resetForgotPasswordStates();
    setOpenForgotPassword(true);
  };

  const handleCloseForgotPassword = () => {
    setOpenForgotPassword(false); // Close the dialog

    // Reset all state variables related to the Forgot Password process
    setForgotPasswordStep(1);
    setForgotEmail("");
    setConfirmationCode("");
    setNewPassword("");
    setConfirmNewPassword("");
    setForgotSuccess(null);
    setForgotError(null);
    setConfirmationCodeError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setIsEmailValid(false);
    setIsPasswordValid(false);
    setIsConfirmPasswordValid(false);
    setIsCodeSent(false); // Reset code sent status
    setIsSendDisabled(false); // Enable the "Send Reset Code" button
    setIsResendDisabled(true); // Disable the "Resend Code" button
    setTimer(0); // Reset the timer for resend code

    if (forgotPasswordButtonRef.current) {
      forgotPasswordButtonRef.current.focus(); // Return focus to the "Forgot Password" button
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!forgotEmail.trim()) {
      setEmailError("Please enter your email address");
      setIsEmailValid(false);
      return;
    }

    // if (!validateEmail(forgotEmail)) {
    //   setEmailError("Please enter a valid email address");
    //   setIsEmailValid(false);
    //   return;
    // }

    setIsEmailValid(true);

    try {
      setEmailError("");
      setForgotError(""); // Clear previous error
      setIsEmailValid(true);

      const resetStatus = await handleResetPassword(forgotEmail.trim()); // Trigger the email sending

      if (resetStatus === "success") {
        setForgotSuccess("Verification code sent to your email");
        setIsCodeSent(true); // Enable confirmation code field
        setIsSendDisabled(true); // Disable Send Reset Code button
        setTimer(30); // Start timer for Resend Code button
        setIsResendDisabled(true); // Disable Resend Code button temporarily
        setForgotPasswordStep(2); // Move to the next step
      } else if (resetStatus === "userNotFound") {
        setForgotPasswordStep(1); // Reset step if user not found
        setIsCodeSent(false); // Keep code fields disabled
        setIsSendDisabled(false); // Keep Send Reset Code enabled
        setIsResendDisabled(true); // Disable Resend Code
      }
    } catch (error) {
      setForgotError("Failed to send reset code. Please try again.");
      setIsSendDisabled(false);
      setIsResendDisabled(true);
    }
  };

  const handleResendCode = async () => {
    if (!forgotEmail.trim()) {
      setEmailError("Please enter your email address");
      setIsEmailValid(false);
      return;
    }

    // if (!validateEmail(forgotEmail)) {
    //   setEmailError("Please enter a valid email address");
    //   setIsEmailValid(false);
    //   return;
    // }

    setIsEmailValid(true);

    try {
      setEmailError("");
      setIsEmailValid(true);
      await handleResetPassword(forgotEmail.trim()); // Trigger the email resending
      setForgotSuccess("Verification code resent to your email");
      setTimer(30); // Restart the 30-second timer
      setIsResendDisabled(true); // Disable "Resend Code" button initially
    } catch (error) {
      setForgotError("Failed to resend code. Please try again.");
    }
  };

  const handleNewPasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);

    if (!value) {
      setPasswordError("Please enter a new password");
      setIsPasswordValid(false);
    } else if (value.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      setIsPasswordValid(false);
    } else if (value.length > 16) {
      setPasswordError("Password must not exceed 16 characters");
      setIsPasswordValid(false);
    } else {
      setPasswordError("");
      setIsPasswordValid(true);
    }

    if (confirmNewPassword && value !== confirmNewPassword) {
      setConfirmPasswordError("Passwords do not match");
      setIsConfirmPasswordValid(false);
    } else if (confirmNewPassword) {
      setConfirmPasswordError("");
      setIsConfirmPasswordValid(true);
    }
  };

  const handleConfirmNewPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmNewPassword(value);

    if (!value) {
      setConfirmPasswordError("Please confirm your new password");
      setIsConfirmPasswordValid(false);
    } else if (value !== newPassword) {
      setConfirmPasswordError("Passwords do not match");
      setIsConfirmPasswordValid(false);
    } else {
      setConfirmPasswordError("");
      setIsConfirmPasswordValid(true);
    }
  };

  const handleSubmitNewPassword = () => {
    let hasError = false;

    // Validate confirmation code
    if (!confirmationCode.trim()) {
      setConfirmationCodeError("Confirmation code is required");
      setForgotError(null); // Clear general error
      hasError = true;
    } else {
      setConfirmationCodeError(""); // Clear error if valid
    }

    // Validate new password
    if (!newPassword.trim()) {
      setPasswordError("Password must be at least 8 characters long");
      setIsPasswordValid(false);
      hasError = true;
    } else if (newPassword.length < 8 || newPassword.length > 16) {
      setPasswordError("Password must be at least 8 characters long");
      setIsPasswordValid(false);
      hasError = true;
    } else {
      setPasswordError(null);
      setIsPasswordValid(true);
    }

    // Validate confirm password
    if (!confirmNewPassword.trim()) {
      setConfirmPasswordError("Passwords do not match");
      setIsConfirmPasswordValid(false);
      hasError = true;
    } else if (newPassword !== confirmNewPassword) {
      setConfirmPasswordError("Passwords do not match");
      setIsConfirmPasswordValid(false);
      hasError = true;
    } else {
      setConfirmPasswordError(null);
      setIsConfirmPasswordValid(true);
    }

    if (hasError) return;

    handleConfirmResetPassword({
      username: forgotEmail,
      confirmationCode,
      newPassword,
    });
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null); // Clear any existing errors

    try {
      // Use Google Auth Service's signInWithGoogle method
      const result = await GoogleAuthService.signInWithGoogle();

      if (result.success) {
        if (result.requiresMerge) {
          // Show merge account dialog
          setMergeEmail(result.email);
          setMergeDialogOpen(true);
        } else if (result.userDetails) {
          // Successfully logged in
          // Store user data in localStorage
          localStorage.setItem("user_id", result.userDetails.userId || "");
          localStorage.setItem("FullName", result.userDetails.fullName || "");
          localStorage.setItem("EmailId", result.userDetails.email || "");
          localStorage.setItem(
            "Category",
            result.userDetails.userCategory || ""
          );
          localStorage.setItem("StageName", result.userDetails.stageName || "");
          localStorage.setItem(
            "PhoneNumber",
            result.userDetails.phoneNumber || ""
          );
          localStorage.setItem(
            "ProfilePhotoUrl",
            result.userDetails.profilePhotoUrl || ""
          );

          // Check if mandate details need to be filled
          if (result.shouldFillDetails) {
            navigate("/userdetails", {
              state: {
                email: result.userDetails.email,
                userId: result.userDetails.userId,
                shouldFillDetails: true,
              },
            });
          } else {
            // Handle shared playlist/song navigation after successful login
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
        } else {
          navigate("/userdetails", {
            state: {
              email: result.email,
              shouldFillDetails: true,
            },
          });
        }
      } else if (result.userNotFound) {
        // User doesn't exist - redirect to signup
        navigate("/signup", {
          state: {
            message: "Please create an account first.",
          },
        });
      } else {
        // Show error
        setError({ general: result.error || "Failed to sign in with Google" });
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      setError({ general: "Failed to sign in with Google. Please try again." });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleMergeComplete = async (mergeResult) => {
    setMergeDialogOpen(false);

    if (mergeResult && mergeResult.success) {
      // Store user data in localStorage if available
      if (mergeResult.userDetails) {
        localStorage.setItem("user_id", mergeResult.userDetails.userId || "");
        localStorage.setItem(
          "FullName",
          mergeResult.userDetails.fullName || ""
        );
        localStorage.setItem("EmailId", mergeResult.userDetails.email || "");
        localStorage.setItem(
          "Category",
          mergeResult.userDetails.userCategory || ""
        );
        localStorage.setItem(
          "StageName",
          mergeResult.userDetails.stageName || ""
        );
        localStorage.setItem(
          "PhoneNumber",
          mergeResult.userDetails.phoneNumber || ""
        );
        localStorage.setItem(
          "ProfilePhotoUrl",
          mergeResult.userDetails.profilePhotoUrl || ""
        );
      }

      // If we have confirmation of successful sign-in from the merge result
      if (mergeResult.isSignedIn) {
        // If shouldFillDetails is explicitly provided in the result, use it
        if (mergeResult.shouldFillDetails !== undefined) {
          if (mergeResult.shouldFillDetails) {
            navigate("/userdetails", {
              state: {
                email: mergeResult.userDetails.email,
                userId: mergeResult.userDetails.userId,
                shouldFillDetails: true,
              },
            });
            return;
          } else {
            // Navigate to homepage or intended path
            handlePostLoginNavigation();
            return;
          }
        }
      }

      // Fallback to original behavior - check mandate details
      const userId = mergeResult.userDetails.userId;
      if (userId) {
        try {
          const mandateResponse = await fetch(
            `https://i3lmfmc1h2.execute-api.ap-south-1.amazonaws.com/voizpost/save/getmandate?user_id=${userId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (mandateResponse.ok) {
            const mandateData = await mandateResponse.json();

            if (mandateData.FillMandateDetails) {
              // Handle shared playlist/song navigation
              handlePostLoginNavigation();
            } else {
              // If mandate not filled, go to userdetails
              navigate("/userdetails", {
                state: {
                  email: mergeResult.userDetails.email,
                  userId: userId,
                  shouldFillDetails: true,
                },
              });
            }
          } else {
            console.error("Failed to fetch mandate details");
            setError({
              general: "Failed to fetch mandate details. Please try again.",
            });
          }
        } catch (error) {
          console.error("Error checking mandate details:", error);
          setError({
            general: "Failed to check mandate details. Please try again.",
          });
        }
      } else {
        console.error("No user ID found after merge");
        setError({
          general: "Failed to retrieve user details. Please try again.",
        });
      }
    } else {
      setError({
        general:
          mergeResult?.error ||
          "Failed to complete account linking. Please try again.",
      });
    }
  };

  // Helper function for post-login navigation
  const handlePostLoginNavigation = () => {
    const intendedPath = sessionStorage.getItem("intendedPath");
    const sharedPlaylistInfo = sessionStorage.getItem("shared_playlist_info");
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
  };

  return (
    <Box className="userInfoForm">
      <img src={logo} alt="Logo" className="logo2" style={{ filter: `brightness(5) contrast(5) saturate(1.2) blur(15px) !important` }} />
      <Typography
        variant="h5"
        sx={{
          fontWeight: "bold",
          fontSize: "40px",
          color: "white",
        }}
      >
        Login
      </Typography>
      <Box
        className="LoginformContainer"
        sx={{ width: "280px !important", margin: "0 auto" }}
      >
        <TextField
          variant="outlined"
          placeholder="Email"
          type="email"
          fullWidth
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon sx={{ color: "black" }} />
              </InputAdornment>
            ),
            sx: {
              "& input::placeholder": {
                paddingLeft: "10px",
                color: "black !important",
                opacity: 1,
                fontFamily: "Poppins !important",
                letterSpacing: "1px !important",
              },
            },
          }}
          sx={{
            marginTop: 2,
            backgroundColor: "#d3d2d2",
            borderRadius: 2,
            marginTop: "20px !important",
            height: "55px !important",

            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#d3d2d2 !important",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#d3d2d2 !important",
            },
            // Override autofill styles to maintain #d3d2d2 background
            "& .MuiInputBase-input": {
              "&:-webkit-autofill": {
                WebkitBoxShadow: "0 0 0 100px #d3d2d2 inset !important",
                WebkitTextFillColor: "black !important",
              },
              "&:-webkit-autofill:hover": {
                WebkitBoxShadow: "0 0 0 100px #d3d2d2 inset !important",
              },
              "&:-webkit-autofill:focus": {
                WebkitBoxShadow: "0 0 0 100px #d3d2d2 inset !important",
              },
              "&:-webkit-autofill:active": {
                WebkitBoxShadow: "0 0 0 100px #d3d2d2 inset !important",
              },
            },
          }}
        />
        {error?.username && (
          <Typography
            variant="bodyLogin1"
            color="error"
            sx={{ textAlign: "left", width: "100%", mt: 1 }}
          >
            {error.username}
          </Typography>
        )}

        <TextField
          variant="outlined"
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          required
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= 16) {
              setPassword(value);
            }
          }}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon sx={{ color: "black" }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleTogglePasswordVisibility} edge="end">
                  {showPassword ? (
                    <Visibility
                      sx={{ color: "black", marginRight: "20px !important" }}
                    />
                  ) : (
                    <VisibilityOff
                      sx={{ color: "black", marginRight: "20px !important" }}
                    />
                  )}
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              "& input::placeholder": {
                paddingLeft: "10px",
                color: "black !important",
                opacity: 1,
                fontFamily: "Poppins !important",
                letterSpacing: "1px !important",
              },
            },
          }}
          sx={{
            marginTop: 2,
            borderRadius: 2,
            marginTop: "20px !important",
            height: "55px !important",
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "white !important", // Change border color on hover
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "white !important", // Default border color
            },
          }}
        />

        {error?.password && (
          <Typography
            variant="bodyLogin1"
            color="error"
            sx={{ textAlign: "left", width: "100%", mt: 1, ml: -4.5 }}
          >
            {error.password}
          </Typography>
        )}
        {error?.general && (
          <Typography
            variant="bodyLogin1"
            color="error"
            sx={{ textAlign: "left", width: "100%", mt: 1, ml: -4.5 }}
          >
            {error.general}
          </Typography>
        )}
        <Button
          variant="text"
          sx={{
            marginBottom: 4,
            color: "#7DC4FFE5",
            textTransform: "none",
            textDecoration: "underline",
            marginTop: "-10px !important",
            fontWeight: "600 !important",
          }}
          onClick={handleOpenForgotPassword}
          ref={forgotPasswordButtonRef}
        >
          Forgot Password
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleLogin}
          sx={{
            width: "300px",
            borderRadius: "30px",
            height: "50px",
            fontSize: "20px",
            fontWeight: "bold",
            textTransform: "none",
            marginTop: "20px",
          }}
        >
          Login
        </Button>

        {/* <Box sx={{ textAlign: "center", my: 2 }}>
          <Typography variant="body2" sx={{ color: "white" }}>
            OR
          </Typography>
        </Box> */}

        <Button
          variant="outlined"
          className="googleButton"
          onClick={handleGoogleLogin}
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
            width: "260px !important",
            height: "50px !important",
            borderRadius: "25px !important",

            fontSize: "14.5px !important",
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
        </Button>
      </Box>
      <Box sx={{ display: "flex", gap: 1, marginTop: "px" }}>
        <Typography
          variant="body2"
          sx={{ fontFamily: "Poppins", fontSize: "10px !important" }}
        >
          By logging in,
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "white",
            fontFamily: "Poppins",
            fontSize: "10px !important",
            marginLeft: "-6px !important",
          }}
        >
          you agree to the
        </Typography>
      </Box>
      <br />
      <Box sx={{ display: "flex", gap: 1, marginTop: "-20px !important" }}>
        <Link
          href="https://voiz.co.in/terms-of-use/"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: "white",
            textDecoration: "none",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontFamily: "Poppins",
              fontSize: "10px !important",
              marginTop: "-5px",
            }}
          >
            Terms of Use
          </Typography>
        </Link>
        <Typography
          variant="body2"
          sx={{
            color: "white",
            fontFamily: "Poppins",
            fontSize: "10px !important",
            marginTop: "-5px",
            marginLeft: "-4px",
          }}
        >
          and
        </Typography>
        <Link
          href="https://voiz.co.in/privacy-policy/"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: "white",
            textDecoration: "none",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontFamily: "Poppins",
              fontSize: "10px !important",
              marginTop: "-5px",
              marginLeft: "-4px",
            }}
          >
            Privacy Policy
          </Typography>
        </Link>
      </Box>

      {/* Forgot Password Dialog */}
      <Dialog
        open={openForgotPassword}
        onClose={handleCloseForgotPassword}
        maxWidth="sm"
        fullWidth
        classes={{ paper: "MuiDialog-paper" }}
        PaperProps={{
          sx: {
            height: forgotPasswordStep > 1 ? "620px" : "auto", // Set height to 612px only in second step
            minHeight: forgotPasswordStep > 1 ? "620px" : "auto",
            maxHeight: forgotPasswordStep > 1 ? "620px" : "auto",
            backgroundColor: "#151415 !important",
            borderRadius: "12px",
            overflow: "hidden",
          },
        }}
      >
        <IconButton
          onClick={handleCloseForgotPassword}
          className="close-button"
        >
          <HighlightOffIcon
            sx={{
              fontSize: 40,
              marginRight: "60px !important",
              width: "48px !important",
              height: "50px",
            }}
          />
        </IconButton>

        <DialogTitle className="dialog-title" sx={{ color: "white" }}>
          Forgot Password
        </DialogTitle>

        <DialogContent className="dialog-content">
          <Box
            component="form"
            sx={{
              width: "80%",
              marginLeft: "47px",
              marginTop: "20px !important",
            }}
          >
            <div className="dialog-input-container">
              <label className="dialog-label">Email</label>
              <input
                fullWidth
                variant="outlined"
                value={forgotEmail}
                onChange={(e) => {
                  setForgotEmail(e.target.value);
                  setResetPasswordStatus(null);
                }}
                // error={Boolean(emailError)}
                // helperText={emailError}
                className="dialog-input"
                disabled={forgotPasswordStep > 1}
              />
              {forgotError && (
                <span className="dialog-error">{forgotError}</span>
              )}
              {emailError && <span className="dialog-error">{emailError}</span>}
            </div>

            <Box
              sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2 }}
            >
              <Button
                variant="contained"
                onClick={handleRequestPasswordReset}
                disabled={isSendDisabled || !forgotEmail.trim()} // Add resetPasswordStatus check
                className="dialog-button"
                sx={{
                  width: "160px !important",
                  height: "40px !important",
                  cursor: isSendDisabled ? "not-allowed" : "pointer",
                  marginLeft: "20px !important",
                }}
              >
                Send Code
              </Button>

              {/* Resend Code Button - Visible only after the first code is sent */}
              {isCodeSent && (
                <Button
                  onClick={handleResendCode}
                  disabled={isResendDisabled}
                  className="resend-button"
                  sx={{
                    color: isResendDisabled ? "grey" : "blue",
                    cursor: isResendDisabled ? "not-allowed" : "pointer",
                  }}
                >
                  {isResendDisabled ? `Resend in ${timer}s` : "Resend Code"}
                </Button>
              )}
            </Box>
            {/* Conditionally Render Rest of the Fields */}
            {forgotPasswordStep > 1 && (
              <>
                <div className="dialog-input-container">
                  <label className="dialog-label">Confirmation code</label>
                  <input
                    fullWidth
                    // placeholder="Confirmation code"
                    variant="outlined"
                    value={confirmationCode}
                    onChange={(e) => {
                      // Only allow 6 digits, trim whitespace
                      const trimmedValue = e.target.value.trim();
                      const digitsOnly = trimmedValue.replace(/\D/g, '').slice(0, 6);
                      setConfirmationCode(digitsOnly);
                      setConfirmationCodeError("");
                    }}
                    // error={Boolean(confirmationCodeError)} // Highlights the field if there's an error
                    // helperText={confirmationCodeError} // Displays the error message
                    className="dialog-input"
                    disabled={!isCodeSent} // Disable if code is not sent
                  />
                  {confirmationCodeError && (
                    <span className="dialog-error">
                      {confirmationCodeError}
                    </span>
                  )}
                </div>

                <div className="dialog-input-container">
                  <label className="dialog-label">New Password</label>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <input
                      fullWidth
                      //placeholder="New Password"
                      type={showNewPassword ? "text" : "password"} // Toggle visibility
                      variant="outlined"
                      value={newPassword}
                      onChange={handleNewPasswordChange}
                      // error={Boolean(passwordError)}
                      // helperText={passwordError}
                      className="dialog-input"
                      disabled={!isCodeSent} // Disable if code is not sent
                      style={{
                        paddingRight: "40px", // Make space for the icon button
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={handleTogglePasswordVisibility}
                              edge="end"
                            >
                              {showPassword ? (
                                <Visibility />
                              ) : (
                                <VisibilityOff />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <IconButton
                      onClick={handleToggleNewPasswordVisibility}
                      style={{
                        position: "absolute",
                        right: "0",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "white",
                      }}
                    >
                      {showNewPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </Box>
                  {passwordError && (
                    <span className="dialog-error">{passwordError}</span>
                  )}
                </div>

                <div className="dialog-input-container">
                  <label className="dialog-label">Confirm New Password</label>
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <input
                      fullWidth
                      //placeholder="Confirm New Password"
                      type={showConfirmNewPassword ? "text" : "password"}
                      variant="outlined"
                      value={confirmNewPassword}
                      onChange={handleConfirmNewPasswordChange}
                      // error={Boolean(confirmPasswordError)}
                      // helperText={confirmPasswordError}
                      className="dialog-input"
                      disabled={!isCodeSent} // Disable if code is not sent
                      style={{
                        paddingRight: "40px", // Make space for the icon button
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={handleToggleConfirmPasswordVisibility}
                              edge="end"
                            >
                              {showConfirmPassword ? (
                                <Visibility />
                              ) : (
                                <VisibilityOff />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <IconButton
                      onClick={handleToggleConfirmNewPasswordVisibility}
                      style={{
                        position: "absolute",
                        right: "0",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "white",
                      }}
                    >
                      {showConfirmNewPassword ? (
                        <Visibility />
                      ) : (
                        <VisibilityOff />
                      )}
                    </IconButton>
                  </div>
                  {confirmPasswordError && (
                    <span className="dialog-error">{confirmPasswordError}</span>
                  )}
                </div>

                {forgotError && (
                  <Typography
                    color="error"
                    className="Error-resetting"
                    sx={{
                      mb: 2,
                      mt: "10px !important",
                      fontSize: "12px",
                      ml: "2px !important",
                      color: "#d32f2f !important",
                    }}
                  >
                    {forgotError}
                  </Typography>
                )}

                {/* {forgotSuccess && (
            <Typography
              color="success.main"
              variant="bodyLogin1"
              sx={{ mb: 2 }}
            >
              {forgotSuccess}
            </Typography>
          )} */}

                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Button
                    variant="contained"
                    onClick={handleSubmitNewPassword}
                    // disabled={
                    //   !confirmationCode ||
                    //   !newPassword ||
                    //   !confirmNewPassword ||
                    //   Boolean(passwordError) ||
                    //   Boolean(confirmPasswordError)
                    // }
                    className="dialog-button-submit"
                  >
                    Update
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      {/* <Dialog
        open={forgotSuccess !== null}
        onClose={() => setForgotSuccess(null)}
        PaperProps={{
          sx: {
            backgroundColor: "#151415 !important",
            border: "1px solid #151415",
            borderRadius: 3,
            minHeight: "60px !important",
          },
        }}
        aria-labelledby="success-dialog-title"
      >
        <DialogContent sx={{ position: "relative" }}>
          <IconButton
            aria-label="close"
            onClick={() => setForgotSuccess(null)}
            sx={{
              position: "absolute",
              right: 1,
              top: 0,
              marginTop: "-10px",
              color: "white",
            }}
          >
            <HighlightOffIcon sx={{ fontSize: 40 }} />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              textAlign: "center",
              fontWeight: "bold",
              marginTop: 4,
              color: "white",
            }}
          >
            {forgotSuccess}
          </Typography>
          <Box sx={{ textAlign: "center", marginTop: 2 }}>
            <CheckCircleIcon
              sx={{
                color: "#2782ee",
                fontSize: 50,
                cursor: "pointer",
              }}
              onClick={() => setForgotSuccess(null)}
            />
          </Box>
        </DialogContent>
      </Dialog> */}
            <Dialog
  open={forgotSuccess !== null}
  onClose={() => setForgotSuccess(null)}
  PaperProps={{
    sx: {
      backgroundColor: "#151415 !important",
      borderRadius: "16px",
      maxWidth: "478px",
      width: "478px",
      height: "316px",
      margin: "20px",
      marginTop: "-20px !important",
      position: "relative",
      padding: "40px 20px",
    },
  }}
  aria-labelledby="success-dialog-title"
>
  <IconButton
    aria-label="close"
    onClick={() => setForgotSuccess(null)}
    sx={{
      position: "absolute",
      right: 8,
      top: 8,
      color: "white",
    }}
  >
    <HighlightOffIcon sx={{ fontSize: 40 }} />
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
      variant="h6"
      sx={{
        color: "white",
        fontSize: "24px !important",
        fontWeight: 600,
        marginBottom: "20px",
      }}
    >
      {forgotSuccess}
    </Typography>
    <Box
      sx={{
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        backgroundColor: "#2782EE",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
      onClick={() => setForgotSuccess(null)}
    >
      <img src={checkmarkicon} alt="Check Icon" style={{ width: "46px", height: "46px" }} />
    </Box>
  </Box>
</Dialog>

      {/* Merge Account Dialog */}
      <MergeAccountDialog
        open={mergeDialogOpen}
        onClose={() => setMergeDialogOpen(false)}
        email={mergeEmail}
        onMergeComplete={handleMergeComplete}
      />
    </Box>
  );
}
