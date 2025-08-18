import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Link,
  CircularProgress,
} from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import logo from "./assets/voizlogo.png";
import google from "./assets/Google.png";
import "./SignUp.css";
import Divider from "@mui/material/Divider";
import {
  signUp,
  confirmSignUp,
  signIn,
  resendSignUpCode,
} from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import GoogleAuthService from "./GoogleAuthService";
import MergeAccountDialog from "./MergeAccountDialog";

export default function SignUp() {
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeEmail, setMergeEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");

  const handleTogglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    if (value.length <= 16) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        password: value,
      }));
    }
  };

  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState({
    email: "",
    password: "",
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [confirmationError, setConfirmationError] = useState("");
  const [activate, setActivate] = useState(null);

  useEffect(() => {
    setError({
      email: "",
      password: "",
    });
  }, [formData.email, formData.password]);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    localStorage.clear();

    const { email, password } = formData;
    const errors = {};

    if (!email) {
      errors.email = (
        <p style={{ color: "red", fontSize: "14px", marginLeft: "-18px" }}>
          Please enter your Email ID
        </p>
      );
    }

    if (!password) {
      errors.password = (
        <p style={{ marginLeft: "-18px" }}>Please enter a password</p>
      );
    } else if (password.length < 8) {
      errors.password = (
        <p style={{ marginLeft: "-18px" }}>
          Password must be at least 8 characters long
        </p>
      );
    }

    if (Object.keys(errors).length > 0) {
      setError(errors);
      return;
    }

    try {
      const result = await signUp({
        username: email,
        password,
        attributes: { email },
      });

      console.log("Sign up successful", result);
      setUserId(email);
      setActivate("email");
      setIsDialogOpen(true);
      setTimer(30);
      setCanResend(false);
    } catch (error) {
      console.error("Error signing up:", error);

      if (error.name === "UsernameExistsException") {
        setSnackbarMessage("This email is already registered. Please log in instead.");
        setSnackbarOpen(true);
        setTimeout(() => {
          navigate("/loginpage");
        }, 3000);
      } else {
        setError({
          email: (
            <p style={{ fontSize: "14px", color: "red", marginLeft: "-18px" }}>
              Error signing up. Please try again
            </p>
          ),
        });
      }
    }
  };

  // const handleSubmit = async () => {
  //   localStorage.clear();

  //   const { email, password } = formData;
  //   const errors = {};

  //   if (!email) {
  //     errors.email = (
  //       <p style={{ color: "red", fontSize: "14px", marginLeft: "-18px" }}>
  //         Please enter your Email ID
  //       </p>
  //     );
  //   }

  //   if (!password) {
  //     errors.password = (
  //       <p style={{ marginLeft: "-18px" }}>Please enter a password</p>
  //     );
  //   } else if (password.length < 8) {
  //     errors.password = (
  //       <p style={{ marginLeft: "-18px" }}>
  //         Password must be at least 8 characters long
  //       </p>
  //     );
  //   }

  //   if (Object.keys(errors).length > 0) {
  //     setError(errors);
  //     return;
  //   }

  //   try {
  //     const result = await signUp({
  //       username: email,
  //       password,
  //       attributes: { email },
  //     });

  //     console.log("Sign up successful", result);
  //     setUserId(email);
  //     setActivate("email");
  //     setIsDialogOpen(true);
  //     setTimer(30);
  //     setCanResend(false);
  //   } catch (error) {
  //     console.error("Error signing up:", error);

  //     if (error.name === "UsernameExistsException") {
  //       try {
  //         await ResendConfirmationCode(email);
  //         setUserId(email);
  //         setActivate("email");
  //         setIsDialogOpen(true);
  //       } catch (resendError) {
  //         setError({
  //           email: "Error processing signup. Please try again later",
  //         });
  //       }
  //     } else {
  //       setError({
  //         email: (
  //           <p style={{ fontSize: "14px", color: "red", marginLeft: "-18px" }}>
  //             Error signing up. Please try again
  //           </p>
  //         ),
  //       });
  //     }
  //   }
  // };

  const ResendConfirmationCode = async (email) => {
    try {
      const result = await resendSignUpCode({ username: email });
      if (result) {
        setSnackbarMessage("New confirmation code sent successfully");
        setSnackbarOpen(true);
      }
      console.log("Resend confirmation code successful", result);
    } catch (error) {
      if (error.name === "InvalidParameterException") {
        setSnackbarMessage("User is already confirmed. Please login");
        setSnackbarOpen(true);
        setIsDialogOpen(false);
      } else if (error.name === "LimitExceededException") {
        setSnackbarMessage(
          <p>
            Too many attempts.Please contact the
            <br />
            administrator at info@voiz.co.in
          </p>
        );
        setSnackbarOpen(true);
      } else {
        console.error("Failed to send code", error);
        setSnackbarMessage("Failed to resend confirmation code");
        setSnackbarOpen(true);
      }
    }
  };

  useEffect(() => {
    let interval;
    if (isDialogOpen && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [isDialogOpen, timer]);

  const handleResendCode = async () => {
    try {
      await ResendConfirmationCode(userId || confirmEmail); // Use confirmEmail for Google
      setTimer(30);
      setCanResend(false);
    } catch (error) {
      console.error("Error resending code:", error);
    }
  };

  const handleConfirmSignUp = async () => {
    if (!confirmationCode) {
      setConfirmationError("Please enter the verification code");
      return;
    }

    const username = activate === "google" ? confirmEmail : userId;
    if (!username) {
      setConfirmationError("Email is required for confirmation");
      return;
    }

    try {
      if (activate === "google") {
        const result = await GoogleAuthService.confirmSignUp(username, confirmationCode);

        if (result.success) {
          setIsDialogOpen(false);
          const googlePassword = await GoogleAuthService.fetchGooglePassword(username);
          const saveResult = await GoogleAuthService.createUserInDynamoDB(username);
          if (!saveResult.success) {
            setConfirmationError("Failed to save user data.");
            return;
          }
          const userId = saveResult.userId;
          await signIn({ username, password: googlePassword });
          localStorage.setItem("user_id", userId);
          localStorage.setItem("EmailId", username);
          localStorage.setItem("GoogleSignup", "true");

          const mandateResponse = await fetch(
            `https://i3lmfmc1h2.execute-api.ap-south-1.amazonaws.com/voizpost/save/getmandate?user_id=${userId}`
          );
          const mandateData = await mandateResponse.json();

          if (mandateData.FillMandateDetails) {
            navigate("/homepage");
          } else {
            navigate("/userdetails", {
              state: { email: username, userId, shouldFillDetails: true },
            });
          }
        } else {
          setConfirmationError(result.error || "Failed to confirm account");
        }
      } else {
        await confirmSignUp({ username, confirmationCode });
        console.log("Confirmation successful");
        setConfirmationError("");

        const response = await fetch(
          "https://i3lmfmc1h2.execute-api.ap-south-1.amazonaws.com/voizpost/save/usernew",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ EmailId: formData.email }),
          }
        );
        const data = await response.json();

        if (data.user_id) {
          localStorage.setItem("user_id", data.user_id);
          const signInResponse = await signIn({
            username,
            password: formData.password,
          });

          if (signInResponse) {
            console.log("Sign-in successful");
            setIsDialogOpen(false);
            navigate("/userdetails", {
              state: { email: formData.email },
            });
          } else {
            setConfirmationError("Failed to sign in. Please try again");
          }
        } else {
          setConfirmationError("Failed to create user. Please try again");
        }
      }
    } catch (error) {
      console.error("Confirmation error:", error);
      setConfirmationError(
        <p style={{ color: "red" }}>
          Invalid confirmation code. Please try again
        </p>
      );
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setConfirmationCode("");
    setConfirmationError("");
  };

  const maskEmail = (email) => {
    if (!email) return "";
    const [username, domain] = email.split("@");
    return `xxxxxx@${domain}`;
  };

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
  
    try {
      const result = await GoogleAuthService.signUpWithGoogle();
  
      if (result.success) {
        if (result.requiresConfirmation) {
          setConfirmEmail(result.email);
          setUserId(result.email); // Ensure userId is set for Google flow
          setActivate("google");
          setIsDialogOpen(true);
          setTimer(30);
          setCanResend(false);
          localStorage.setItem("GoogleSignup", "true");
        } else if (result.requiresMerge) {
          setMergeEmail(result.email);
          setMergeDialogOpen(true);
        } else {
          if (result.userDetails) {
            localStorage.setItem("user_id", result.userDetails.userId || "");
            localStorage.setItem("FullName", result.userDetails.fullName || "");
            localStorage.setItem("EmailId", result.userDetails.email || "");
            localStorage.setItem("Category", result.userDetails.userCategory || "");
            localStorage.setItem("StageName", result.userDetails.stageName || "");
            localStorage.setItem("PhoneNumber", result.userDetails.phoneNumber || "");
          }
  
          if (result.shouldFillDetails) {
            navigate("/userdetails", {
              state: {
                email: result.userDetails.email,
                userId: result.userDetails.userId,
                shouldFillDetails: true,
              },
            });
          } else {
            const intendedPath = sessionStorage.getItem("intendedPath");
            const sharedPlaylistInfo = sessionStorage.getItem("shared_playlist_info");
            const sharedSongId = localStorage.getItem("sharedSongId");
  
            if (intendedPath && sharedPlaylistInfo) {
              const playlistData = JSON.parse(sharedPlaylistInfo);
              navigate(`/playlist/${playlistData.id}?name=${encodeURIComponent(playlistData.name)}`);
            } else if (intendedPath && sharedSongId) {
              navigate(`/song/${sharedSongId}`);
            } else if (intendedPath) {
              navigate(intendedPath);
            } else {
              navigate("/homepage");
            }
            sessionStorage.removeItem("intendedPath");
          }
        }
      } else if (result.userNotFound) {
        navigate("/signup", { state: { message: "Please create an account first." } });
      } else if (result.existingGoogleUser) {
        setSnackbarMessage("This Google account is already registered. Please log in instead.");
        setSnackbarOpen(true);
        setTimeout(() => {
          navigate("/loginpage");
        }, 3000);
      } else {
        setSnackbarMessage(result.error || "Failed to sign up with Google. Please try again.");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Google sign-up error:", error);
      setSnackbarMessage("Failed to sign up with Google. Please try again.");
      setSnackbarOpen(true);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // const handleGoogleAuth = async () => {
  //   setIsGoogleLoading(true);

  //   try {
  //     const result = await GoogleAuthService.signUpWithGoogle();

  //     if (result.success) {
  //       if (result.requiresConfirmation) {
  //         setConfirmEmail(result.email);
  //         setUserId(result.email); // Ensure userId is set for Google flow
  //         setActivate("google");
  //         setIsDialogOpen(true);
  //         setTimer(30);
  //         setCanResend(false);
  //         localStorage.setItem("GoogleSignup", "true");
  //       } else if (result.requiresMerge) {
  //         setMergeEmail(result.email);
  //         setMergeDialogOpen(true);
  //       } else {
  //         if (result.userDetails) {
  //           localStorage.setItem("user_id", result.userDetails.userId || "");
  //           localStorage.setItem("FullName", result.userDetails.fullName || "");
  //           localStorage.setItem("EmailId", result.userDetails.email || "");
  //           localStorage.setItem("Category", result.userDetails.userCategory || "");
  //           localStorage.setItem("StageName", result.userDetails.stageName || "");
  //           localStorage.setItem("PhoneNumber", result.userDetails.phoneNumber || "");
  //         }

  //         if (result.shouldFillDetails) {
  //           navigate("/userdetails", {
  //             state: {
  //               email: result.userDetails.email,
  //               userId: result.userDetails.userId,
  //               shouldFillDetails: true,
  //             },
  //           });
  //         } else {
  //           const intendedPath = sessionStorage.getItem("intendedPath");
  //           const sharedPlaylistInfo = sessionStorage.getItem("shared_playlist_info");
  //           const sharedSongId = localStorage.getItem("sharedSongId");

  //           if (intendedPath && sharedPlaylistInfo) {
  //             const playlistData = JSON.parse(sharedPlaylistInfo);
  //             navigate(`/playlist/${playlistData.id}?name=${encodeURIComponent(playlistData.name)}`);
  //           } else if (intendedPath && sharedSongId) {
  //             navigate(`/song/${sharedSongId}`);
  //           } else if (intendedPath) {
  //             navigate(intendedPath);
  //           } else {
  //             navigate("/homepage");
  //           }
  //           sessionStorage.removeItem("intendedPath");
  //         }
  //       }
  //     } else if (result.userNotFound) {
  //       navigate("/signup", { state: { message: "Please create an account first." } });
  //     } else if (result.existingGoogleUser) {
  //       showNotification("You've already signed up with Google. Please login instead.", "info");
  //       setTimeout(() => navigate("/loginpage"), 3000);
  //     } else {
  //       showNotification(result.error || "Failed to sign up with Google", "error");
  //     }
  //   } catch (error) {
  //     console.error("Google sign-up error:", error);
  //     showNotification("Failed to sign up with Google. Please try again.", "error");
  //   } finally {
  //     setIsGoogleLoading(false);
  //   }
  // };

  const handleMergeComplete = (mergeResult) => {
    setMergeDialogOpen(false);

    if (mergeResult && mergeResult.success) {
      if (mergeResult.userDetails) {
        localStorage.setItem("user_id", mergeResult.userDetails.userId || "");
        localStorage.setItem("FullName", mergeResult.userDetails.fullName || "");
        localStorage.setItem("EmailId", mergeResult.userDetails.email || "");
        localStorage.setItem("Category", mergeResult.userDetails.userCategory || "");
        localStorage.setItem("StageName", mergeResult.userDetails.stageName || "");
      }

      if (mergeResult.shouldFillDetails) {
        navigate("/userdetails", {
          state: {
            email: mergeResult.userDetails.email,
            userId: mergeResult.userDetails.userId,
            shouldFillDetails: true,
          },
        });
      } else {
        const intendedPath = sessionStorage.getItem("intendedPath");
        const sharedPlaylistInfo = sessionStorage.getItem("shared_playlist_info");
        const sharedSongId = localStorage.getItem("sharedSongId");

        if (intendedPath && sharedPlaylistInfo) {
          const playlistData = JSON.parse(sharedPlaylistInfo);
          navigate(`/playlist/${playlistData.id}?name=${encodeURIComponent(playlistData.name)}`);
        } else if (intendedPath && sharedSongId) {
          navigate(`/song/${sharedSongId}`);
        } else if (intendedPath) {
          navigate(intendedPath);
        } else {
          navigate("/homepage");
        }
        sessionStorage.removeItem("intendedPath");
      }
    } else {
      showNotification("Failed to complete account linking", "error");
    }
  };

  const showNotification = (message, type) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  return (
    <Box className="signUpPage">
      <img
        src={logo}
        alt="Logo"
        className="SignUpLogo"
        style={{ filter: `brightness(15) contrast(15) saturate(1.2) blur(0.3px) !important` }}
      />
      <Typography
        variant="h6"
        sx={{
          marginBottom: 2,
          fontWeight: "bold",
          fontSize: "38px",
          color: "white",
          fontFamily: "Poppins",
          width: "380px !important",
        }}
      >
        Create an account
      </Typography>
      <Box className="signupformContainer">
        <TextField
          variant="outlined"
          placeholder="Email"
          type="email"
          name="email"
          required
          value={formData.email}
          fullWidth
          onChange={handleChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon sx={{ color: "#230404 !important" }} />
              </InputAdornment>
            ),
            sx: {
              height: "70px !important",
              "& input::placeholder": {
                paddingLeft: "10px",
                color: "black !important",
                opacity: 1,
                fontFamily: "Poppins !important",
                letterSpacing: "1px !important",
              },
              "& input:-webkit-autofill": {
                "-webkit-box-shadow": "0 0 0 100px #d3d2d2 inset !important",
                "-webkit-text-fill-color": "black !important",
                "background-color": "#d3d2d2 !important",
              },
              "& input:-webkit-autofill:hover": {
                "-webkit-box-shadow": "0 0 0 100px #d3d2d2 inset !important",
              },
              "& input:-webkit-autofill:focus": {
                "-webkit-box-shadow": "0 0 0 100px #d3d2d2 inset !important",
              },
              "& input:-webkit-autofill:active": {
                "-webkit-box-shadow": "0 0 0 100px #d3d2d2 inset !important",
              },
            },
          }}
          sx={{
            marginBottom: "1px !important",
            height: "70px !important",
            width: "400px !important",
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px !important",
              backgroundColor: "#d3d2d2 !important",
              transition: "all 0.3s ease !important",
              height: "70px !important",
              "&:hover": {
                backgroundColor: "#d3d2d2 !important",
              },
              "&.Mui-focused": {
                backgroundColor: "#d3d2d2 !important",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "white !important",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "white !important",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "white !important",
              },
            },
          }}
        />

        {error.email && (
          <Typography
            variant="body2"
            sx={{
              color: "red",
              textAlign: "left",
              width: "100%",
              mt: 0,
              fontFamily: "Poppins",
            }}
          >
            {error.email}
          </Typography>
        )}

        <TextField
          variant="outlined"
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={formData.password}
          required
          onChange={handlePasswordChange}
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
            backgroundColor: "#d3d2d2 !important",
            borderRadius: 2,
            width: "400px !important",
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "white !important",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "white !important",
            },
          }}
        />

        {error.password ? (
          <Typography
            variant="body2"
            sx={{
              color: "red",
              textAlign: "left",
              width: "100%",
              mt: 0,
              fontFamily: "Poppins",
            }}
          >
            {error.password}
          </Typography>
        ) : (
          <Typography
            variant="body1"
            sx={{
              color: "#FFFFFF",
              opacity: "0.6",
              textAlign: "left",
              width: "100%",
              fontSize: 12,
              mt: 0,
              fontFamily: "Poppins",
              marginRight: "30px !important",
              fontWeight: "300 !important",
            }}
          >
            Password must be at least 8 characters long
          </Typography>
        )}
        {snackbarOpen && (
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            message={snackbarMessage}
          />
        )}

        {/* Divider Lines */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40%",
            marginBottom: "-10px",
            marginTop: "20px",
          }}
        >
          <Divider
            sx={{
              flexGrow: 1,
              height: "3px",
              bgcolor: "white",
              margin: "0 5px",
              width: "90px !important",
            }}
          />
          <Divider
            sx={{
              flexGrow: 1,
              height: "3px",
              bgcolor: "#302f2f",
              width: "90px !important",
              marginLeft: "10px !important",
            }}
          />
        </Box>

        <Button
          variant="contained"
          color="primary"
          className="continueButtons"
          onClick={handleSubmit}
          sx={{
            width: "300px !important",
            backgroundColor: "#2644d9 !important",
            "&:hover": {
              backgroundColor: "#2644d9 !important",
              boxShadow: "none !important",
            },
          }}
        >
          Continue
        </Button>

        <Button
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
            width: "300px !important",
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
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1, marginTop: "px" }}>
        <Typography
          variant="body2"
          sx={{ fontFamily: "Poppins", fontSize: "10px !important" }}
        >
          By clicking Continue,
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
            Terms of use
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
          &
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
            privacy policy
          </Typography>
        </Link>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        sx={{
          marginTop: "160px !important",
          "& .MuiDialog-paper": {
            height: "440px !important",
            width: "410px !important",
            maxWidth: "400px !important",
            borderRadius: "28px !important",
            overflowY: "hidden",
            marginRight: "18px !important",
            backgroundColor: "#151415 !important",
          },
        }}
      >
        <DialogTitle>Confirm Sign Up</DialogTitle>
        <DialogContent
          sx={{
            overflowY: "hidden",
            "&.MuiDialogContent-root": {
              padding: "20px 24px",
            },
          }}
        >
          <Typography
            variant="body1"
            sx={{
              marginBottom: 2,
              width: "348px !important",
              marginLeft: "30px !important",
              fontFamily: "Poppins !important",
              letterSpacing: "1px !important",
              fontSize: "13px !important",
              fontWeight: "300",
            }}
          >
            {`A confirmation code has been sent to:`}
            <Typography
              component="span"
              sx={{
                fontWeight: 600,
                marginTop: "50px !important",
                fontFamily: "Poppins !important",
                letterSpacing: "1px !important",
                fontSize: "13px !important",
              }}
            >
              {" "}
              <br />
              <br />
                            
              <span>
                {activate === "google" ? maskEmail(confirmEmail) : maskEmail(formData.email)}
              </span>
            </Typography>
            <br />
            <br />
            <Typography
              sx={{
                marginLeft: "-0px !important",
                fontFamily: "Poppins !important",
                letterSpacing: "1px !important",
                fontSize: "13px !important",
                fontWeight: "300",
              }}
            >
              Enter the confirmation code below to
              <br />              
                  verify your account.
            </Typography>
          </Typography>
          <TextField
            variant="outlined"
            type="text"
            fullWidth
            value={confirmationCode}
            onChange={(e) => {
              const trimmedValue = e.target.value.trim();
              const digitsOnly = trimmedValue.replace(/\D/g, "").slice(0, 6);
              setConfirmationCode(digitsOnly);
            }}
            sx={{
              marginTop: "20px !important",
              width: "330px !important",
              height: "50px !important",
              "& .MuiOutlinedInput-notchedOutline": {
                position: "static !important",
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
                color: "black !important",
                position: "relative !important",
              },
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.5) !important",
                },
                "&:hover fieldset": {
                  borderColor: "white !important",
                },
              },
            }}
            InputLabelProps={{ shrink: true }}
            placeholder="Code"
          />
          {confirmationError && (
            <Typography sx={{ color: "red" }}>{confirmationError}</Typography>
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
              onClick={handleResendCode}
              disabled={!canResend}
              sx={{
                textTransform: "none",
                fontFamily: "Poppins !important",
                letterSpacing: "1px !important",
                fontWeight: "300",
                color: canResend ? "#2644D9 !important" : "#2644D9 !important",
                opacity: canResend ? 1 : 0.5,
              }}
            >
              {canResend ? (
                <span
                  style={{
                    color: "#2644D9 !important",
                    fontSize: "13px",
                  }}
                >
                  Resend code
                </span>
              ) : (
                <span
                  style={{
                    color: "#2644D9 !important",
                    fontSize: "13px",
                  }}
                >
                  Resend code in {timer}s
                </span>
              )}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleConfirmSignUp} // Updated to use handleConfirmSignUp
            color="primary"
            variant="contained"
            sx={{
              width: "200px !important",
              height: "50px !important",
              fontWeight: "600 !important",
              borderRadius: "32px !important",
              marginBottom: "-10px !important",
              marginRight: "50px !important",
            }}
          >
            Confirm
          </Button>
        </DialogActions>
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