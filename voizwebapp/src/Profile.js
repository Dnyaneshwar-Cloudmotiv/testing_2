import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Switch,
  Divider,
  Button,
  Avatar,
  Link,
} from "@mui/material";
import SideBar from "./SideBar";
import { useNavigate } from "react-router-dom";
import { signOut } from "aws-amplify/auth";
import coverpage from "./assets/RectangleBannerImage.png";
import "./Profile.css";
import edit from "./assets/Edit.png";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import EditBg from "./assets/VectorEditBg.png";
import Edit from "./assets/VectorEdit.png";
import { usePlayer } from "./PlayerContext"; // adjust the path if needed


import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";

const Profile = () => {
  const bannerImage = localStorage.getItem("CoverPageUrl");
  const navigate = useNavigate();
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const StageName = localStorage.getItem("StageName");
  const FullName = localStorage.getItem("FullName");
  const ProfilePhotoUrl = localStorage.getItem("ProfilePhotoUrl");
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

    // Apply blur to profile content
    const profileContent = document.querySelector(".profile");
    if (profileContent && isDialogOpen) {
      profileContent.classList.add("dialog-open");
    } else if (profileContent) {
      profileContent.classList.remove("dialog-open");
    }

    // Cleanup on unmount
    return () => {
      if (contentContainer) contentContainer.classList.remove("dialog-open");
      if (contentSection) contentSection.classList.remove("dialog-open");
      if (drawer) drawer.classList.remove("dialog-open");
      if (profileContent) profileContent.classList.remove("dialog-open");
    };
  }, [isDialogOpen]);

  useEffect(() => {
    const handleStorageChange = () => {
      setSidebarMargin(
        localStorage.getItem("sidebarCollapsed") === "true"
          ? "-80px !important"
          : "99px !important"
      );
    };

    const handleSidebarChange = (event) => {
      if (event.detail === "collapsed") {
        setSidebarMargin("-80px !important");
      } else {
        setSidebarMargin("99px !important");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("sidebarStateChange", handleSidebarChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("sidebarStateChange", handleSidebarChange);
    };
  }, []);

  useEffect(() => {
    const fetchAutoplayStatus = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        const response = await fetch(
          `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/artist/viewprofile?user_id=${userId}`
        );

        if (response.ok) {
          const data = await response.json();
          setAutoplayEnabled(data.Item?.isAutorelatedtrackenable?.BOOL ?? true);
          localStorage.setItem(
            "isAutorelatedtrackenable",
            JSON.stringify(data.Item?.isAutorelatedtrackenable?.BOOL ?? true)
          );
        }
      } catch (error) {
        console.error("Error fetching autoplay status:", error);
      }
    };

    fetchAutoplayStatus();
  }, []);

  const handleAutoplayChange = async (event) => {
    const newStatus = event.target.checked;
    setAutoplayEnabled(newStatus);
    localStorage.setItem("isAutorelatedtrackenable", String(newStatus));

    try {
      const userId = localStorage.getItem("user_id") || "1";
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .split(".")[0]
        .replace("T", "_");

      const response = await fetch(
        "https://i3lmfmc1h2.execute-api.ap-south-1.amazonaws.com/voizpost/save/autoplaystatus",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            isAutorelatedtrackenable: String(newStatus),
            updatedTimestamp: timestamp,
          }),
        }
      );

      if (response.ok) {
        // Dispatch event to notify other components
        window.dispatchEvent(new Event("autoplayStatusChanged"));
      } else {
        // Revert on failure
        setAutoplayEnabled(!newStatus);
        localStorage.setItem("isAutorelatedtrackenable", String(!newStatus));
      }
    } catch (error) {
      console.error("Error updating autoplay status:", error);
      // Revert on error
      setAutoplayEnabled(!newStatus);
      localStorage.setItem("isAutorelatedtrackenable", String(!newStatus));
    }
  };

  const handleNotificationsChange = (event) => {
    setNotificationsEnabled(event.target.checked);
  };

  const handleSignOutClick = () => {
    setSignOutDialogOpen(true);
    setIsDialogOpen(true);
  };

  const [sidebarMargin, setSidebarMargin] = useState(
    localStorage.getItem("sidebarCollapsed") === "true"
      ? "-80px !important"
      : "99px !important"
  );

  const getInitials = (name) => {
    if (!name) return "";
    const names = name.split(" ");
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const { clearCurrentSong } = usePlayer();


  const handleSignOutConfirm = async () => {
    try {
      await signOut(); // Firebase signOut
      localStorage.clear(); // clear auth + playback data
      clearCurrentSong();   // reset player state in context
      navigate("/landingpage"); // or "/loginpage"
    } catch (error) {
      console.log("error signing out: ", error);
      navigate("/landingpage"); // fallback
    }

    // Close any open dialogs
    setSignOutDialogOpen(false);
    setIsDialogOpen(false);
  };

  // const handleSignOutConfirm = async () => {
  //   try {
  //     await signOut();
  //     localStorage.clear();
  //     navigate("/landingpage");
  //   } catch (error) {
  //     console.log("error signing out: ", error);
  //   }
  //   setSignOutDialogOpen(false);
  //   setIsDialogOpen(false);
  // };

  return (
    <Box className="mainScreen" sx={{ height: "300px !important" }}>
      <SideBar />
      <Box className="profile">
        <Box className="profile__banner">
          <img
            src={bannerImage || coverpage}
            alt="Profile Banner"
            className="profile__banner-image"
          />
        </Box>
        <Box
          className="editIconContainer"
          sx={{
            backgroundColor: "#2644D9",
            marginRight: sidebarMargin,
            transition: "all 0.4s ease-in-out",
            borderRadius: "50%",
            width: "42px",
            height: "42px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => navigate("/editprofile")}
          style={{ cursor: "pointer",
            top:"222px"
           }}
        >
          <img
            src={Edit}
            alt="Edit"
            className="editIcon" 
            // style={{
            //   width: "17.57px",
            //   height: "18.89px",
            // }}
          />
        </Box>

        <Box className="profile__info">
          <Box className="profile__avatar-container">
            <Avatar
              src={ProfilePhotoUrl}
              alt="Profile"
              className="profile__avatar"
              sx={{
                backgroundColor: ProfilePhotoUrl ? "transparent" : "#222", fontSize: "48px",
                color: "white",
                fontWeight: "bold",
                fontSize: "50px",
                width: "120px !important", // Add this line to reduce width
                height: "120px !important", // Add this line to reduce height
              }}
            >
              {!ProfilePhotoUrl && getInitials(StageName || FullName)}
            </Avatar>
            <Box
              className="profile__edit-container"
              onClick={() => navigate("/editprofile")}
              style={{
                cursor: "pointer",
                position: "absolute",
                bottom: 0,
                right: 0,
                width: "36px",
                height: "38px",
                padding: 0,
                background: "transparent",
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
                  marginLeft: "-1px",
                }}
              />
              <img
                src={Edit}
                alt="Edit"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  marginLeft: "-1px",
                  transform: "translate(-50%, -50%)",
                  width: "15.57px",
                  height: "16.89px",
                }}
              />
            </Box>
          </Box>
        </Box>

        <Typography
          variant="h4"
          className="profile__name"
          sx={{ marginBottom: 2, ml: "-18px" }}
        >
          {StageName || FullName}
        </Typography>

        <Box className="profile__settings-content">
          <Typography
            variant="h6"
            className="profile__settings-item profile__settings-item--clickable"
            onClick={() => navigate("/accountsettings")}
          >
            Account Settings
            <KeyboardArrowRightIcon sx={{ mr: 14, fontSize: "35px" }} />
          </Typography>
          <Divider className="profile__divider" />

          <Box className="profile__settings-item">
            <Typography variant="h6">Autoplay Related Tracks</Typography>
            <Switch
              name="autoplay"
              checked={autoplayEnabled}
              onChange={handleAutoplayChange}
              sx={{
                mr: "100px",
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#27c46d",
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#27c46d",
                },
              }}
            />
          </Box>
          {/* <Divider className="profile__divider" /> */}

          {/* <Box className="profile__settings-item">
            <Typography variant="h6">Notifications</Typography>
            <Switch
              name="notifications"
              checked={notificationsEnabled}
              onChange={handleNotificationsChange}
            />
          </Box> */}
          <Divider className="profile__divider" />

          <Typography
            variant="h6"
            className="profile__settings-item profile__settings-item--clickable"
            onClick={() => navigate("/contactsupport")}
          >
            Contact Support
            <KeyboardArrowRightIcon sx={{ mr: 14, fontSize: "35px" }} />
          </Typography>
          <Divider className="profile__divider" />

          <Link
            href="https://voiz.co.in/terms-of-use/"
            target="_blank"
            sx={{
              color: "white !important",
              textDecoration: "none",
              "&:hover": {
                color: "white !important",
              },
            }}
          >
            <Typography
              variant="h6"
              className="profile__settings-item profile__settings-item--clickable"
            >
              Terms & Condition
              <KeyboardArrowRightIcon sx={{ mr: 14, fontSize: "35px" }} />
            </Typography>
          </Link>
        </Box>

        <Button
          variant="text"
          color="error"
          onClick={handleSignOutClick}
          className="profile__signout"
          disableRipple
          // sx={{
          //   color: "error.main", // Retains the error text color
          //   "&:hover": {
          //     backgroundColor: "transparent", // Removes the reddish hover background
          //     color: "error.main", // Ensures text color stays consistent
          //   },
          // }}

          sx={{
            color: "error.main",
            "&:hover": {
              backgroundColor: "transparent",
              textDecoration: "none",
            },
          }}
        >
          Sign Out
        </Button>



        {/* <Button
          variant="text"
          color="error"
          onClick={handleSignOutClick}
          className="profile__signout"
        >
          Sign Out
        </Button> */}
      </Box>
      {/* <DialogTitle
                    sx={{
                      color: "white",
                      fontSize: "18px",
                      fontWeight: "500",
                      mt: "-12px !important",
                      mb: "-5px !important",
                    }}
                  >
                    Sign Out of your account ?
                  </DialogTitle>
                  <DialogActions>
                    <Button
                       onClick={() => {
                        setSignOutDialogOpen(false);
                        setIsDialogOpen(false);
                      }}
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
                      onClick={handleSignOutConfirm}
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
                  </DialogActions> */}

      <Dialog
        open={signOutDialogOpen}
        onClose={() => {
          setSignOutDialogOpen(false);
          setIsDialogOpen(false);
        }}
        sx={{
          "& .MuiDialog-paper": {
            width: "260px !important",
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
      >
        <DialogTitle
          sx={{
            color: "white",
            fontFamily: " sans-serif",
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
            onClick={() => {
              setSignOutDialogOpen(false);
              setIsDialogOpen(false);
            }}
            sx={{
              // color: "#2782EE",
              // textTransform: "none",
              // fontSize: "16px",
              // padding: "6px 6px",
              // "&:hover": {
              //   backgroundColor: "rgba(39, 130, 238, 0.08)",
              // },
              color: "white",
              textTransform: "none",
              fontSize: "14px",
              padding: "6px 6px",
              fontWeight: "300 !important",
              fontFamily: "Poppins !important",

              "&:hover": {
                backgroundColor: "rgba(39, 130, 238, 0.08)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSignOutConfirm}
            sx={{
              // color: "red",
              // textTransform: "none",
              // fontSize: "16px",

              // marginLeft: "5px !important",
              // "&:hover": {
              //   backgroundColor: "rgba(39, 130, 238, 0.08) !important",
              // },
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

export default Profile;
