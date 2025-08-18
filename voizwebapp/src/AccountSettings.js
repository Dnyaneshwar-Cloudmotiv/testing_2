import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  InputAdornment,
  Snackbar,
} from "@mui/material";
import SideBar from "./SideBar";
import CloseIcon from "@mui/icons-material/Close";
import coverpage from "./assets/RectangleBannerImage.png";
import "./AccountSettings.css";
import edit from "./assets/Edit.png";
import { useNavigate } from "react-router-dom";
import { updatePassword } from "aws-amplify/auth";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Cross1 from "./assets/Cross.png";

import EditBg from "./assets/VectorEditBg.png";
import Edit from "./assets/VectorEdit.png";

const ChangePasswordDialog = ({ open, onClose, setIsDialogOpen }) => {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [throttledDialogOpen, setThrottledDialogOpen] = useState(false);
  const [generalErrorMessage, setGeneralErrorMessage] = useState("");

  const handleClickShowOldPassword = () => {
    setShowOldPassword((show) => !show);
  };
  const handleClickShowNewPassword = () => setShowNewPassword((show) => !show);
  const handleClickShowConfirmPassword = () =>
    setShowConfirmPassword((show) => !show);
  const userCategory = localStorage.getItem("Category");

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    general: "",
  });

  const handleChange = (field) => (event) => {
    setError((prev) => ({
      ...prev,
      [field]: "",
      general: "",
    }));

    setPasswordData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  // Add this function to check if user is a listener
  const isListener = () => {
    const category = localStorage.getItem("Category");
    return category && category.toLowerCase() !== "singer";
  };

  const resetForm = () => {
    setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setError({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      general: "",
    });
  };

  const handleClose = () => {
    resetForm();
    setIsDialogOpen(false);
    onClose();
  };

  const handleSubmit = async () => {
    const errors = {};
    if (!passwordData.oldPassword)
      errors.oldPassword = "Please Enter Old Password";

    // Add new password validation
    if (!passwordData.newPassword) {
      errors.newPassword = "Please Enter New Password";
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters long";
    }

    if (!passwordData.confirmPassword)
      errors.confirmPassword = "Please Enter Confirm Password";
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.general = "New passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setError(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      // Show success dialog
      setSuccessDialogOpen(true);
      // Don't close the main dialog yet
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Password update error:", err);

      // Check for specific error messages that might indicate temporary blocking
      if (
        err.message &&
        (err.message.includes("attempt limit exceeded") ||
          err.message.includes("too many failed attempts") ||
          err.message.includes("throttled") ||
          err.message.includes("Attempt limit exceeded"))
      ) {
        // Show throttled dialog instead of in-form error
        setGeneralErrorMessage(
          "Too many password change attempts. Please try again after some time."
        );
        setThrottledDialogOpen(true);
      } else if (
        err.message &&
        err.message.includes("NotAuthorizedException")
      ) {
        setError({ oldPassword: "Incorrect old password" });
      } else {
        setError({
          general: "Error updating password. Please try again later.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (open) {
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setError({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
        general: "",
      });
    }
  }, [open]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        className="dialog"
        PaperProps={{
          style: {
            borderRadius: "12px",
            width: "400px !important",
            padding: "24px",
            backgroundColor: "#151415 !important",
          },
        }}
        sx={{
          width: "600px !important",
          height: "699px !important",
          marginLeft: "450px !important",
          marginTop: "-20px !important",
          "& .MuiDialog-paper": {
            backgroundColor: "#151415 !important",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "600px !important",
            marginLeft: "-15px !important",
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              marginLeft: "425px !important",
              top: -10,
              color: "white",
            }}
          >
            <img
              src={Cross1}
              alt="Cross1"
              sx={{ height: "10px !important", width: "10px !important" }}
            />
          </IconButton>

          <DialogContent sx={{ p: 0, paddingLeft: "25px !important" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: "white",
                    mb: 2,
                    fontSize: "16px",
                    fontWeight: 500,
                    marginBottom: "-10px !important",
                    marginLeft: "26px !important",
                    paddingTop: "40px !important",
                  }}
                >
                  Old Password
                </Typography>
                <TextField
                  type={showOldPassword ? "text" : "password"}
                  variant="standard"
                  value={passwordData.oldPassword}
                  onChange={handleChange("oldPassword")}
                  required
                  fullWidth
                  InputProps={{
                    disableUnderline: false,
                    endAdornment: (
                      <IconButton
                        onClick={handleClickShowOldPassword}
                        edge="end"
                        className="eye-icon"
                        sx={{ marginRight: "15px" }}
                      >
                        {showOldPassword ? (
                          <Visibility sx={{ color: "white" }} />
                        ) : (
                          <VisibilityOff sx={{ color: "white" }} />
                        )}
                      </IconButton>
                    ),
                  }}
                  sx={{
                    backgroundColor: "#151415 !important",
                    "&..MuiTextField-root": {
                      height: "30px !important",
                    },
                    "& .MuiInputBase-root": {
                      backgroundColor: "#151415 !important",
                      color: "white !important",
                      fontSize: "16px",
                      marginLeft: "20px !important",
                      height: "30px !important",
                    },
                    "& .MuiInputBase-input": {
                      backgroundColor: "#151415 !important",
                      "&::placeholder": {
                        color: "rgba(255,255,255,0.7)",
                      },
                      "&:-webkit-autofill": {
                        "-webkit-box-shadow":
                          "0 0 0 30px #151415 inset !important",
                        "-webkit-text-fill-color": "white !important",
                      },
                      "&::selection": {
                        backgroundColor: "rgba(255, 255, 255, 0.1) !important",
                      },
                    },
                    "& .MuiInput-underline:before": {
                      borderBottom: "2px solid white",
                    },
                    "& .MuiInput-underline:hover:before": {
                      borderBottom: "2px solid white",
                    },
                    "& .MuiInput-underline:after": {
                      borderBottom: "2px solid white",
                    },
                    "& .MuiFormHelperText-root": {
                      color: "rgba(255, 255, 255, 0.7)",
                    },
                    "& .MuiInputLabel-root": {
                      color: "white",
                      "&.Mui-focused": {
                        color: "white",
                      },
                    },
                    marginBottom: "16px",
                    height: "30px !important",
                  }}
                />
                {error.oldPassword && (
                  <Typography
                    variant="body2"
                    color="error"
                    sx={{
                      textAlign: "left",
                      width: "100%",
                      marginLeft: "22px",
                      color: "red !important",
                    }}
                  >
                    {error.oldPassword}
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: "white",
                    mb: 2,
                    fontSize: "16px",
                    fontWeight: 500,
                    marginBottom: "-10px !important",
                    marginLeft: "26px !important",
                  }}
                >
                  New Password
                </Typography>
                <TextField
                  type={showNewPassword ? "text" : "password"}
                  variant="standard"
                  value={passwordData.newPassword}
                  onChange={handleChange("newPassword")}
                  required
                  fullWidth
                  InputProps={{
                    disableUnderline: false,
                    endAdornment: (
                      <IconButton
                        onClick={handleClickShowNewPassword}
                        edge="end"
                        className="eye-icon"
                        sx={{ marginRight: "15px" }}
                      >
                        {showNewPassword ? (
                          <Visibility sx={{ color: "white" }} />
                        ) : (
                          <VisibilityOff sx={{ color: "white" }} />
                        )}
                      </IconButton>
                    ),
                  }}
                  sx={{
                    backgroundColor: "#151415 !important",
                    "&..MuiTextField-root": {
                      height: "30px !important",
                    },
                    "& .MuiInputBase-root": {
                      backgroundColor: "#151415 !important",
                      color: "white !important",
                      fontSize: "16px",
                      marginLeft: "20px !important",
                      height: "30px !important",
                    },
                    "& .MuiInputBase-input": {
                      backgroundColor: "#151415 !important",
                      "&::placeholder": {
                        color: "rgba(255,255,255,0.7)",
                      },
                      "&:-webkit-autofill": {
                        "-webkit-box-shadow":
                          "0 0 0 30px #151415 inset !important",
                        "-webkit-text-fill-color": "white !important",
                      },
                      "&::selection": {
                        backgroundColor: "rgba(255, 255, 255, 0.1) !important",
                      },
                    },
                    "& .MuiInput-underline:before": {
                      borderBottom: "2px solid white",
                    },
                    "& .MuiInput-underline:hover:before": {
                      borderBottom: "2px solid white",
                    },
                    "& .MuiInput-underline:after": {
                      borderBottom: "2px solid white",
                    },
                    "& .MuiFormHelperText-root": {
                      color: "rgba(255, 255, 255, 0.7)",
                    },
                    "& .MuiInputLabel-root": {
                      color: "white",
                      "&.Mui-focused": {
                        color: "white",
                      },
                    },
                    marginBottom: "16px",
                    height: "30px !important",
                  }}
                />
                {error.newPassword && (
                  <Typography
                    variant="body2"
                    color="error"
                    sx={{
                      textAlign: "left",
                      width: "100%",
                      color: "red !important",
                      marginLeft: "20px",
                    }}
                  >
                    {error.newPassword}
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: "white",
                    mb: 2,
                    fontSize: "16px",
                    fontWeight: 500,
                    marginBottom: "-10px !important",
                    marginLeft: "28px !important",
                  }}
                >
                  Confirm New Password
                </Typography>
                <TextField
                  type={showConfirmPassword ? "text" : "password"}
                  variant="standard"
                  value={passwordData.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  required
                  fullWidth
                  InputProps={{
                    disableUnderline: false,
                    endAdornment: (
                      <IconButton
                        onClick={handleClickShowConfirmPassword}
                        className="eye-icon"
                        sx={{
                          marginRight: "15px",
                        }}
                      >
                        {showConfirmPassword ? (
                          <Visibility sx={{ color: "white" }} />
                        ) : (
                          <VisibilityOff sx={{ color: "white" }} />
                        )}
                      </IconButton>
                    ),
                  }}
                  sx={{
                    backgroundColor: "#151415 !important",
                    "&..MuiTextField-root": {
                      height: "30px !important",
                    },
                    "& .MuiInputBase-root": {
                      backgroundColor: "#151415 !important",
                      color: "white !important",
                      fontSize: "16px",
                      marginLeft: "20px !important",
                      height: "30px !important",
                    },
                    "& .MuiInputBase-input": {
                      backgroundColor: "#151415 !important",
                      "&::placeholder": {
                        color: "rgba(255,255,255,0.7)",
                      },
                      "&:-webkit-autofill": {
                        "-webkit-box-shadow":
                          "0 0 0 30px #151415 inset !important",
                        "-webkit-text-fill-color": "white !important",
                      },
                      "&::selection": {
                        backgroundColor: "rgba(255, 255, 255, 0.1) !important",
                      },
                    },
                    "& .MuiInput-underline:before": {
                      borderBottom: "2px solid white",
                    },
                    "& .MuiInput-underline:hover:before": {
                      borderBottom: "2px solid white",
                    },
                    "& .MuiInput-underline:after": {
                      borderBottom: "2px solid white",
                    },
                    "& .MuiFormHelperText-root": {
                      color: "rgba(255, 255, 255, 0.7)",
                    },
                    "& .MuiInputLabel-root": {
                      color: "white",
                      "&.Mui-focused": {
                        color: "white",
                      },
                    },
                    marginBottom: "16px",
                    height: "30px !important",
                  }}
                />
                {error.confirmPassword && (
                  <Typography
                    variant="body2"
                    color="error"
                    sx={{
                      textAlign: "left",
                      width: "100%",
                      marginLeft: "20px",
                      color: "red !important",
                      zIndex: 1000,
                    }}
                  >
                    {error.confirmPassword}
                  </Typography>
                )}
                {error.general && (
                  <Typography
                    variant="body2"
                    color="error"
                    sx={{
                      textAlign: "left",
                      width: "100%",
                      color: "red !important",
                      marginLeft: "20px",
                    }}
                  >
                    {error.general}
                  </Typography>
                )}
              </Box>

              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isSubmitting}
                sx={{
                  mt: 2,
                  textTransform: "none",
                  backgroundColor: "#2782EE",
                  borderRadius: "25px",
                  padding: "10px",
                  fontSize: "16px",
                  marginLeft: "100px !important",
                  "&:hover": {
                    backgroundColor: "#2376d5",
                  },
                }}
              >
                {isSubmitting ? "Updating..." : "Update"}
              </Button>
            </Box>
          </DialogContent>
        </Box>
      </Dialog>

      {/* Password Changed Success Dialog */}
      <Dialog
        open={successDialogOpen}
        onClose={() => {
          setSuccessDialogOpen(false);
          onClose();
        }}
        sx={{
          "& .MuiDialog-paper": {
            width: "300px !important",
            borderRadius: "16px",
            backgroundColor: "#131337",
            color: "white",
          },
        }}
      >
        <DialogTitle
          sx={{ textAlign: "center", fontSize: "18px", fontWeight: "500" }}
        >
          Success
        </DialogTitle>
        <DialogContent>
          <Typography
            sx={{ textAlign: "center", mt: 1, fontSize: "12px !important" }}
          >
            Password changed successfully!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSuccessDialogOpen(false);
              onClose();
            }}
            sx={{ color: "white", marginRight: "70px !important" }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Too Many Attempts Dialog */}
      <Dialog
        open={throttledDialogOpen}
        onClose={() => {
          setThrottledDialogOpen(false);
        }}
        sx={{
          "& .MuiDialog-paper": {
            width: "350px !important",
            borderRadius: "16px",
            backgroundColor: "#151415 !important",
            color: "white",
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: "center",
            fontSize: "18px",
            fontWeight: "500",
            // color: "#f44336",
            color: "white",
          }}
        >
          Account Temporarily Locked
        </DialogTitle>
        <DialogContent>
          <Typography
            sx={{ textAlign: "center", mt: 1, fontSize: "14px !important" }}
          >
            {generalErrorMessage}
          </Typography>
          <Typography
            sx={{
              textAlign: "center",
              mt: 2,
              fontSize: "14px !important",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            For security reasons, we've temporarily disabled password changes
            for your account. Please try again later.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button
            onClick={() => {
              setThrottledDialogOpen(false);
            }}
            sx={{
              color: "white",
              // backgroundColor: "#2782EE",
              borderRadius: "20px",
              paddingX: 3,
              "&:hover": {
                // backgroundColor: "#2376d5",
              },
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const AccountSettings = () => {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const bannerImage = localStorage.getItem("CoverPageUrl");
  const profileImage = localStorage.getItem("ProfilePhotoUrl");
  const userEmail = localStorage.getItem("EmailId");
  const userPhone = localStorage.getItem("PhoneNumber");
  const StageName = localStorage.getItem("StageName");
  const FullName = localStorage.getItem("FullName");
  const userRole = localStorage.getItem("UserRole"); // Get user role
  const isGoogleSignup = localStorage.getItem("GoogleSignup") === "true";
  const navigate = useNavigate();
  const APP_VERSION = "1.0.0"; // Add app version
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

    // Cleanup on unmount
    return () => {
      if (accountContainer) accountContainer.classList.remove("dialog-open");
      if (contentSection) contentSection.classList.remove("dialog-open");
      if (drawer) drawer.classList.remove("dialog-open");
      if (formContainer) formContainer.classList.remove("dialog-open");
      if (profileContent) profileContent.classList.remove("dialog-open");
    };
  }, [isDialogOpen]);

  const maskEmail = (email) => {
    if (!email) return "";
    const [username, domain] = email.split("@");
    if (!domain) return email;
    const maskedUsername =
      username.charAt(0) +
      "*".repeat(username.length - 2) +
      username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
  };

  const isListener = () => {
    const category = localStorage.getItem("Category");
    return category && category.toLowerCase() !== "singer";
  };

  const handleDeleteAccount = () => {
    navigate("/delete-account");
  };

  const maskPhoneNumber = (phone) => {
    if (!phone) return "";
    return "*".repeat(phone.length - 3) + phone.slice(-3);
  };

  const handleChangePassword = () => {
    // If signed up through Google, show a dialog explaining why
    if (isGoogleSignup) {
      // Open a dialog explaining why password change is not available
      setIsGoogleSignupDialogOpen(true);
    } else {
      setIsPasswordDialogOpen(true);
      setIsDialogOpen(true);
    }
  };

  // New state and dialog for Google signup explanation
  const [isGoogleSignupDialogOpen, setIsGoogleSignupDialogOpen] =
    useState(false);

  return (
    <Box display="flex">
      <SideBar />
      <Box className="account">
        <Box className="account__banner">
          <img
            src={bannerImage || coverpage}
            alt="Profile Banner"
            className="account__banner-image"
          />
        </Box>

        <Box className="account__info">
          <Box className="account__avatar-container">
            <Avatar
              src={profileImage}
              alt="Profile"
              className="account__avatar"
              sx={{
                backgroundColor: profileImage ? "transparent" : "",
                color: "white",
                fontWeight: "bold",
                fontSize: "50px",
                width: "120px !important",
                height: "120px !important",
              }}
            />
            <Box
              className="account__edit-container"
              onClick={() => navigate("/editprofile")}
              style={{
                cursor: "pointer",
                position: "absolute",
                bottom: 0,
                right: 0,
                width: "36px", // Adjusted to match your layout
                height: "38px",
                padding: 0, // Remove padding since we'll handle it with image positioning
                background: "transparent", // Make container background transparent
                textAlign: "center",
                marginRight: "20px",
              }}
            >
              <img
                src={EditBg}
                alt="Edit Background"
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  backgroundColor: "#479BFF",
                }}
              />
              <img
                src={Edit}
                alt="Edit"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "15.57px",
                  height: "16.89px",
                  marginLeft: "18px",
                }}
              />
            </Box>
          </Box>
        </Box>

        <Typography variant="h5" className="account__name">
          {StageName || FullName}
        </Typography>

        <Box className="account__settings">
          <Box className="account__settings-content">
            <Box className="account__settings-item">
              <Typography variant="h6" className="account__settings-title">
                Email
              </Typography>
              <Typography variant="body1" className="account__settings-text">
                {maskEmail(userEmail)}
              </Typography>
              <Divider className="account__divider" />
            </Box>

            <Box className="account__settings-item">
              <Typography variant="h6" className="account__settings-title">
                Phone Number
              </Typography>
              <Typography variant="body1" className="account__settings-text">
                {maskPhoneNumber(userPhone)}
              </Typography>
              <Divider className="account__divider" />
            </Box>

            <Box className="account__settings-item">
              <Button
                variant="text"
                onClick={handleChangePassword}
                className="account__button"
              >
                Change Password
              </Button>
              <Divider className="account__divider" />
            </Box>

            {/* App Version Section */}
            <Box className="account__settings-item" sx={{ mt: 4 }}>
              <Typography variant="h6" className="account__settings-title">
                About
              </Typography>
              <Typography variant="body1" className="account__settings-text">
                App Version: {APP_VERSION}
              </Typography>
              <Divider className="account__divider" />
            </Box>

            {/* Show Delete Account only for Listeners */}
            {/* Updated Delete Account section */}
            {isListener() && (
              <Box className="account__settings-item" sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleDeleteAccount}
                  fullWidth
                  sx={{
                    padding: "10px",
                    borderRadius: "8px",
                    textTransform: "none",
                    fontSize: "14px",
                    fontWeight: 500,
                    backgroundColor: "#d32f2f",
                    "&:hover": {
                      backgroundColor: "#b71c1c",
                    },
                  }}
                >
                  Delete Account
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        <ChangePasswordDialog
          open={isPasswordDialogOpen}
          onClose={() => {
            setIsPasswordDialogOpen(false);
            setIsDialogOpen(false);
          }}
          setIsDialogOpen={setIsDialogOpen}
        />

        <Dialog
          open={isGoogleSignupDialogOpen}
          onClose={() => setIsGoogleSignupDialogOpen(false)}
          PaperProps={{
            style: {
              backgroundColor: "#151415",
              borderRadius: "12px",
              color: "white",
            },
          }}
          sx={{
            width: "400px !important",
            marginLeft: "600px !important",
            textAlign: "center !important",
          }}
        >
          <DialogTitle>Password Change Unavailable</DialogTitle>
          <DialogContent>
            <Typography>
              Since you signed in with Google, you cannot change your password
              through this app.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setIsGoogleSignupDialogOpen(false)}
              color="primary"
              sx={{
                color: "white !important",
                marginRight: "100px !important",
              }}
            >
              Ok
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AccountSettings;
