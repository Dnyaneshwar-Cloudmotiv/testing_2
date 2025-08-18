import React from "react";
import { Box, Typography, Avatar, IconButton } from "@mui/material";
import SideBar from "./SideBar";
// import coverpage from './assets/coverpage1.jpeg';
import coverpage from "./assets/RectangleBannerImage.png";
import "./ContactSupport.css";
import edit from "./assets/Edit.png";
import { useNavigate } from "react-router-dom";

// Add these two new imports
import Edit from "./assets/VectorEdit.png";
import EditBg from "./assets/VectorEditBg.png";

const ContactSupport = () => {
  const bannerImage = localStorage.getItem("CoverPageUrl"); // Replace with your banner image
  const profileImage = localStorage.getItem("ProfilePhotoUrl"); // Replace with your profile image

  const StageName = localStorage.getItem("StageName");
  const FullName = localStorage.getItem("FullName");
  const navigate = useNavigate();

  return (
    <Box className="profile-page">
      <SideBar />
      <Box className="profile-content">
        {/* Banner Section */}
        <Box className="banner-section">
          <img
            src={bannerImage || coverpage}
            alt="Profile Banner"
            className="banner-image"
          />
        </Box>

        {/* Profile Info Section */}
        <Box className="profile-info-section">
          {/* Profile Image */}
          <Box className="profile-image-container">
            <Avatar
              src={profileImage}
              alt="Profile"
              className="profile-image"
            />
            <Box
              className="edit-icon-container"
              onClick={() => {
                navigate("/editprofile");
              }}
              style={{
                // cursor: "pointer",
                // position: "absolute",
                // bottom: -20,
                // right: 0,
                // width: "36px",
                // height: "38px",
                // padding: 0,
                // background: "transparent",
                // // marginTop: "-60px !important",
                // marginBottom: "25px",
                marginLeft: "-18px",
                cursor: "pointer",
                position: "absolute",
                bottom: 0,
                right: 0,
                width: "36px", // Adjusted to match your layout
                height: "38px",
                padding: 0, // Remove padding since we'll handle it with image positioning
                background: "transparent", // Make container background transparent
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
                  marginLeft: "-8px",
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
                  marginLeft: "-7px",
                }}
              />
            </Box>
            {/* <Box className="edit-icon-container" onClick={() => {
                            navigate("/editprofile");
                        }}>
                            <img src={edit} alt="Edit" className="edit-icon" />
                        </Box> */}
          </Box>

          {/* Profile Details */}
          <Box className="profile-details">
            <Box className="name-section">
              <Typography variant="h4" className="profile-name">
                {StageName || FullName}
              </Typography>
            </Box>

            {/* Email Support */}
            <Box className="email-support">
              <Typography variant="h6" className="support-title">
                Email Support:
              </Typography>
              <Typography
                className="email-text"
                sx={{
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                info@voiz.co.in
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ContactSupport;
