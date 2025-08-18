// // // // import React, { useRef, useState, useEffect } from "react";
// // // // import {
// // // //   Box,
// // // //   Typography,
// // // //   Avatar,
// // // //   IconButton,
// // // //   TextField,
// // // //   Button,
// // // //   Menu,
// // // //   MenuItem,
// // // //   Alert,
// // // // } from "@mui/material";
// // // // import SideBar from "./SideBar";
// // // // // import Edit from './assets/Edit.png';
// // // // import Edit from "./assets/VectorEdit.png";
// // // // import EditBg from "./assets/VectorEditBg_new.png";
// // // // import { useNavigate } from "react-router-dom";
// // // // import "./EditProfile.css";
// // // // import Dialog from "@mui/material/Dialog";
// // // // import { Check as CheckIcon } from "lucide-react";
// // // // import cross from "./assets/Cross.png";
// // // // import bannerImage1 from "./assets/RectangleBannerImage.png";


// // // // const EditProfile = () => {
// // // //   const [coverPage, setCoverPage] = useState(null);
// // // //   // const bannerImage = "https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/cover.png";
// // // //   const bannerImage = bannerImage1;
// // // //   const [profileImage, setProfileImage] = useState(null);
// // // //   const [anchorEl, setAnchorEl] = useState(null);
// // // //   const user_id = localStorage.getItem("user_id");
// // // //   const StageName = localStorage.getItem("StageName");
// // // //   const FullName = localStorage.getItem("FullName");
// // // //   const navigate = useNavigate();
// // // //   const fileInputRef = useRef(null);
// // // //   const coverPageInputRef = useRef(null);
// // // //   const [ImageFile, setImageFile] = useState(null);
// // // //   const [fullName, setFullName] = useState("");
// // // //   const [stageName, setStageName] = useState("");
// // // //   const [bio, setBio] = useState("");
// // // //   const [errors, setErrors] = useState({
// // // //     fullName: "",
// // // //     stageName: "", // Add this line
// // // //     bio: "",
// // // //   });

// // // //   const [isEditing, setIsEditing] = useState(false);
// // // //   const [tempStageName, setTempStageName] = useState("");

// // // //   const [showStageNameWarning, setShowStageNameWarning] = useState(false);
// // // //   const [showStageName, setShowStageName] = useState(false);

// // // //   const [openSuccessDialog, setOpenSuccessDialog] = useState(false);

// // // //   const [initialFullName, setInitialFullName] = useState("");
// // // //   const [initialStageName, setInitialStageName] = useState("");
// // // //   const [initialBio, setInitialBio] = useState("");
// // // //   const [hasChanges, setHasChanges] = useState(false); // Track input changes

// // // //   const [openCameraDialog, setOpenCameraDialog] = useState(false);
// // // // const videoRef = useRef(null);
// // // // const canvasRef = useRef(null);
// // // // const [stream, setStream] = useState(null);

// // // //   const [sidebarMargin, setSidebarMargin] = useState(
// // // //     localStorage.getItem("sidebarCollapsed") === "true"
// // // //       ? "-80px !important"
// // // //       : "99px !important"
// // // //   );
// // // //   useEffect(() => {
// // // //     // Initial check
// // // //     setSidebarMargin(
// // // //       localStorage.getItem("sidebarCollapsed") === "true"
// // // //         ? "-80px !important"
// // // //         : "99px !important"
// // // //     );

// // // //     // Add event listener for storage changes
// // // //     const handleStorageChange = () => {
// // // //       setSidebarMargin(
// // // //         localStorage.getItem("sidebarCollapsed") === "true"
// // // //           ? "-80px !important"
// // // //           : "99px !important"
// // // //       );
// // // //     };

// // // //     // Add event listener for custom event (same as in HomePage)
// // // //     const handleSidebarChange = (event) => {
// // // //       if (event.detail === "collapsed") {
// // // //         setSidebarMargin("-80px !important");
// // // //       } else {
// // // //         setSidebarMargin("99px !important");
// // // //       }
// // // //     };

// // // //     window.addEventListener("storage", handleStorageChange);
// // // //     window.addEventListener("sidebarStateChange", handleSidebarChange);

// // // //     return () => {
// // // //       window.removeEventListener("storage", handleStorageChange);
// // // //       window.removeEventListener("sidebarStateChange", handleSidebarChange);
// // // //     };
// // // //   }, []);

// // // //   useEffect(() => {
// // // //     const fetchProfilePhoto = async () => {
// // // //       try {
// // // //         const response = await fetch(
// // // //           `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getprofilephoto?user_id=${user_id}`
// // // //         );
// // // //         const data = await response.json();
// // // //         setProfileImage(data.profilePhotoUrl?.S || null);
// // // //       } catch (err) {
// // // //         console.error("Error loading profile photo", err);
// // // //       }
// // // //     };
// // // //     fetchProfilePhoto();
// // // //   }, [user_id]);

// // // //   // useEffect(() => {
// // // //   //   const fetchProfilePhoto = async () => {
// // // //   //     try {
// // // //   //       const response = await fetch(
// // // //   //         `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getprofilephoto?user_id=${user_id}`,
// // // //   //         {
// // // //   //           method: "GET",
// // // //   //           headers: {
// // // //   //             "Content-Type": "application/json",
// // // //   //           },
// // // //   //         }
// // // //   //       );

// // // //   //       if (!response.ok) {
// // // //   //         throw new Error("Failed to fetch profile photo");
// // // //   //       }

// // // //   //       const data = await response.json();
// // // //   //       setProfileImage(data.profilePhotoUrl.S);
// // // //   //       localStorage.setItem("ProfilePhotoUrl", data.profilePhotoUrl.S);
// // // //   //     } catch (error) {
// // // //   //       console.error("Error fetching profile photo:", error);
// // // //   //     }
// // // //   //   };

// // // //   //   fetchProfilePhoto();
// // // //   // }, [user_id]);

// // // //   useEffect(() => {
// // // //     const fetchCoverPage = async () => {
// // // //       try {
// // // //         const response = await fetch(
// // // //           `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getcoverpage?user_id=${user_id}`,
// // // //           {
// // // //             method: "GET",
// // // //             headers: {
// // // //               "Content-Type": "application/json",
// // // //             },
// // // //           }
// // // //         );

// // // //         if (!response.ok) {
// // // //           throw new Error("Failed to fetch profile photo");
// // // //         }

// // // //         const data = await response.json();
// // // //         setCoverPage(data.coverPageUrl.S);
// // // //         localStorage.setItem("CoverPageUrl", data.coverPageUrl.S);
// // // //       } catch (error) {
// // // //         console.error("Error fetching CoverPage:", error);
// // // //       }
// // // //     };

// // // //     fetchCoverPage();
// // // //   }, [user_id]);

// // // //   const [savedDisplayName, setSavedDisplayName] = useState("");

// // // //   useEffect(() => {
// // // //     const fetchProfileDetails = async () => {
// // // //       try {
// // // //         const response = await fetch(
// // // //           `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getprofiledetails?user_id=${user_id}`,
// // // //           {
// // // //             method: "GET",
// // // //             headers: {
// // // //               "Content-Type": "application/json",
// // // //             },
// // // //           }
// // // //         );

// // // //         if (!response.ok) {
// // // //           throw new Error("Failed to fetch profile details");
// // // //         }

// // // //         const data = await response.json();
// // // //         setFullName(data.FullName.S || "");
// // // //         setInitialFullName(data.FullName.S || "");
// // // //         const fetchedStageName = data.StageName.S || "";
// // // //         setStageName(fetchedStageName);
// // // //         setInitialStageName(fetchedStageName);
// // // //         setBio(data.bio.S || "");
// // // //         setInitialBio(data.bio.S || "");
// // // //         setShowStageName(!!fetchedStageName);
// // // //         // Add this line after setting other states
// // // //         setSavedDisplayName(data.StageName.S || data.FullName.S || "");
// // // //       } catch (error) {
// // // //         console.error("Error fetching profile details:", error);
// // // //       }
// // // //     };

// // // //     fetchProfileDetails();
// // // //   }, [user_id]);

// // // //   useEffect(() => {
// // // //     const hasFieldChanges =
// // // //       fullName !== initialFullName ||
// // // //       (showStageName && stageName !== initialStageName) ||
// // // //       bio !== initialBio;
// // // //     setHasChanges(hasFieldChanges);
// // // //   }, [fullName, stageName, bio, showStageName, initialFullName, initialStageName, initialBio]);

// // // //   const formatTimestamp = () => {
// // // //     const now = new Date();
// // // //     const year = now.getFullYear();
// // // //     const month = String(now.getMonth() + 1).padStart(2, "0");
// // // //     const day = String(now.getDate()).padStart(2, "0");
// // // //     const hours = String(now.getHours()).padStart(2, "0");
// // // //     const minutes = String(now.getMinutes()).padStart(2, "0");
// // // //     const seconds = String(now.getSeconds()).padStart(2, "0");

// // // //     return `${year}${month}${day}_${hours}${minutes}${seconds}`;
// // // //   };

// // // //   const validateFullName = (name) => {
// // // //     if (!name.trim()) {
// // // //       setErrors((prev) => ({
// // // //         ...prev,
// // // //         fullName: "Username cannot be empty",
// // // //       }));
// // // //       return false;
// // // //     }
// // // //     setErrors((prev) => ({
// // // //       ...prev,
// // // //       fullName: "",
// // // //     }));
// // // //     return true;
// // // //   };
// // // //   const validateStageName = (name) => {
// // // //     if (showStageName && !name.trim()) {
// // // //       setErrors((prev) => ({
// // // //         ...prev,
// // // //         stageName: "Stage name cannot be empty",
// // // //       }));
// // // //       return false;
// // // //     }
// // // //     setErrors((prev) => ({
// // // //       ...prev,
// // // //       stageName: "",
// // // //     }));
// // // //     return true;
// // // //   };

// // // //   const getWordCount = (text) => {
// // // //     // return text.trim() ? text.trim().split(/\s+/).length : 0; //for300 words
// // // //     return text.length; // Now counts characters instead of words
// // // //   };

// // // //   const handleBioChange = (e) => {
// // // //     const newBio = e.target.value;
// // // //     const wordCount = getWordCount(newBio);

// // // //     // Only update if word count is within limit or if deleting
// // // //     if (wordCount <= 300 || newBio.length < bio.length) {
// // // //       setBio(newBio);
// // // //       validateBio(newBio);
// // // //     }
// // // //   };

// // // //   const handleStageNameClick = () => {
// // // //     if (!isEditing) {
// // // //       setTempStageName(stageName); // Store current stage name
// // // //       setShowStageNameDialog(true);
// // // //     }
// // // //   };

// // // //   const validateBio = (bioText) => {
// // // //     const wordCount = getWordCount(bioText);
// // // //     if (wordCount > 300) {
// // // //       setErrors((prev) => ({
// // // //         ...prev,
// // // //         bio: "Bio cannot exceed 300 characters",
// // // //       }));
// // // //       return false;
// // // //     }
// // // //     setErrors((prev) => ({
// // // //       ...prev,
// // // //       bio: "",
// // // //     }));
// // // //     return true;
// // // //   };

// // // //   const capitalizeWords = (str) => {
// // // //     return str
// // // //       .toLowerCase()
// // // //       .split(" ")
// // // //       .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
// // // //       .join(" ")
// // // //       .trim();
// // // //   };

// // // //   const handleUpdate = async () => {
// // // //     const isFullNameValid = validateFullName(fullName);
// // // //     const isStageNameValid = showStageName ? validateStageName(stageName) : true;
// // // //     const isBioValid = validateBio(bio);

// // // //     if (!isFullNameValid || !isStageNameValid || !isBioValid) {
// // // //       return;
// // // //     }

// // // //     // Check if any changes were made
// // // //     const hasChanges =
// // // //       fullName !== (FullName || "") ||
// // // //       (showStageName && stageName !== (StageName || "")) ||
// // // //       bio !== (localStorage.getItem("bio") || "");

// // // //     if (!hasChanges) {
// // // //       // Display warning if no changes are detected
// // // //       alert("Please update your profile");
// // // //       return;
// // // //     }

// // // //     try {
// // // //       const payload = {
// // // //         FullName: capitalizeWords(fullName),
// // // //         bio: bio,
// // // //         user_id: user_id,
// // // //         StageName: showStageName ? capitalizeWords(stageName) : undefined,
// // // //         updatedTimestamp: formatTimestamp(),
// // // //       };

// // // //       const response = await fetch(
// // // //         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/editprofile",
// // // //         {
// // // //           method: "POST",
// // // //           headers: {
// // // //             "Content-Type": "application/json",
// // // //           },
// // // //           body: JSON.stringify(payload),
// // // //         }
// // // //       );

// // // //       if (!response.ok) {
// // // //         throw new Error("Failed to update profile details");
// // // //       }

// // // //       // Update localStorage values
// // // //       localStorage.setItem("FullName", capitalizeWords(fullName));
// // // //       if (showStageName) {
// // // //         localStorage.setItem("StageName", capitalizeWords(stageName));
// // // //       }
// // // //       localStorage.setItem("bio", bio);

// // // //       setSavedDisplayName(
// // // //         showStageName ? capitalizeWords(stageName) : capitalizeWords(fullName)
// // // //       );
// // // //       setInitialFullName(capitalizeWords(fullName));
// // // //       setInitialStageName(showStageName ? capitalizeWords(stageName) : "");
// // // //       setInitialBio(bio);
// // // //       setOpenSuccessDialog(true);
// // // //       setTimeout(() => {
// // // //         setOpenSuccessDialog(false);
// // // //         // Instead of reload, reset form and update UI
// // // //         setFullName(capitalizeWords(fullName));
// // // //         setStageName(showStageName ? capitalizeWords(stageName) : "");
// // // //         setBio(bio);
// // // //       }, 3000);
// // // //     } catch (error) {
// // // //       console.error("Error updating profile:", error);
// // // //       alert("Failed to update profile. Please try again.");
// // // //     }
// // // //   };

// // // //   // const handleUpdate = async () => {
// // // //   //   const isFullNameValid = validateFullName(fullName);
// // // //   //   const isStageNameValid = showStageName ? validateStageName(stageName) : true;
// // // //   //   const isBioValid = validateBio(bio);

// // // //   //   if (!isFullNameValid || !isStageNameValid || !isBioValid) {
// // // //   //     return;
// // // //   //   }

// // // //   //   // Check if any changes were made
// // // //   //   const hasChanges =
// // // //   //     fullName !== (FullName || "") ||
// // // //   //     (showStageName && stageName !== (StageName || "")) ||
// // // //   //     bio !== (localStorage.getItem("bio") || "");

// // // //   //   if (!hasChanges) {
// // // //   //     // Display warning if no changes are detected
// // // //   //     alert("Please update your profile");
// // // //   //     return;
// // // //   //   }

// // // //   //   try {
// // // //   //     const payload = {
// // // //   //       FullName: capitalizeWords(fullName),
// // // //   //       bio: bio,
// // // //   //       user_id: user_id,
// // // //   //       StageName: showStageName ? capitalizeWords(stageName) : undefined,
// // // //   //       updatedTimestamp: formatTimestamp(),
// // // //   //     };

// // // //   //     const response = await fetch(
// // // //   //       "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/editprofile",
// // // //   //       {
// // // //   //         method: "POST",
// // // //   //         headers: {
// // // //   //           "Content-Type": "application/json",
// // // //   //         },
// // // //   //         body: JSON.stringify(payload),
// // // //   //       }
// // // //   //     );

// // // //   //     if (!response.ok) {
// // // //   //       throw new Error("Failed to update profile details");
// // // //   //     }

// // // //   //     // Update localStorage values
// // // //   //     localStorage.setItem("FullName", capitalizeWords(fullName));
// // // //   //     if (showStageName) {
// // // //   //       localStorage.setItem("StageName", capitalizeWords(stageName));
// // // //   //     }
// // // //   //     localStorage.setItem("bio", bio);

// // // //   //     setSavedDisplayName(
// // // //   //       showStageName ? capitalizeWords(stageName) : capitalizeWords(fullName)
// // // //   //     );
// // // //   //     setInitialFullName(capitalizeWords(fullName));
// // // //   //     setInitialStageName(showStageName ? capitalizeWords(stageName) : "");
// // // //   //     setInitialBio(bio);
// // // //   //     setOpenSuccessDialog(true);
// // // //   //     setTimeout(() => {
// // // //   //       setOpenSuccessDialog(false);
// // // //   //       window.location.reload();
// // // //   //     }, 3000);
// // // //   //   } catch (error) {
// // // //   //     console.error("Error updating profile:", error);
// // // //   //     alert("Failed to update profile. Please try again.");
// // // //   //   }
// // // //   // };

// // // //   // const handleUpdate = async () => {
// // // //   //   const isFullNameValid = validateFullName(fullName);
// // // //   //   const isStageNameValid = showStageName
// // // //   //     ? validateStageName(stageName)
// // // //   //     : true;
// // // //   //   const isBioValid = validateBio(bio);

// // // //   //   if (!isFullNameValid || !isStageNameValid || !isBioValid) {
// // // //   //     return;
// // // //   //   }

// // // //   //   try {
// // // //   //     const payload = {
// // // //   //       FullName: capitalizeWords(fullName), // Capitalize the name here
// // // //   //       bio: bio,
// // // //   //       user_id: user_id,
// // // //   //       StageName: capitalizeWords(stageName),
// // // //   //       updatedTimestamp: formatTimestamp(),
// // // //   //     };

// // // //   //     const response = await fetch(
// // // //   //       "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/editprofile",
// // // //   //       {
// // // //   //         method: "POST",
// // // //   //         headers: {
// // // //   //           "Content-Type": "application/json",
// // // //   //         },
// // // //   //         body: JSON.stringify(payload),
// // // //   //       }
// // // //   //     );

// // // //   //     if (!response.ok) {
// // // //   //       throw new Error("Failed to update profile details");
// // // //   //     }

// // // //   //     // alert('Profile updated successfully');
// // // //   //     // window.location.reload();
// // // //   //     // Add this line before setOpenSuccessDialog(true)

// // // //   //     // Update localStorage values
// // // //   //     localStorage.setItem("FullName", capitalizeWords(fullName));
// // // //   //     localStorage.setItem("StageName", capitalizeWords(stageName));

// // // //   //     setSavedDisplayName(
// // // //   //       showStageName ? capitalizeWords(stageName) : capitalizeWords(fullName)
// // // //   //     );
// // // //   //     setOpenSuccessDialog(true);
// // // //   //     setTimeout(() => {
// // // //   //       setOpenSuccessDialog(false);
// // // //   //       window.location.reload();
// // // //   //     }, 3000);
// // // //   //   } catch (error) {
// // // //   //     console.error("Error updating profile:", error);
// // // //   //     alert("Failed to update profile. Please try again.");
// // // //   //   }
// // // //   // };

// // // //   const handleImageClick = () => {
// // // //     fileInputRef.current.click();
// // // //   };

// // // //   const uploadImageToSignedUrl = async (url, file) => {
// // // //     try {
// // // //       const response = await fetch(url, {
// // // //         method: "PUT",
// // // //         headers: {
// // // //           "Content-Type": file.type,
// // // //         },
// // // //         body: file,
// // // //       });

// // // //       if (!response.ok) {
// // // //         throw new Error(`Upload failed with status: ${response.status}`);
// // // //       }

// // // //       return response;
// // // //     } catch (error) {
// // // //       console.error("Error in uploadImageToSignedUrl:", error);
// // // //       throw error;
// // // //     }
// // // //   };

// // // //   const handleImageUpload = async (file) => {
// // // //     try {
// // // //       if (!file) {
// // // //         throw new Error("No file selected");
// // // //       }

// // // //       if (!file.type.startsWith("image/")) {
// // // //         throw new Error("Please select an image file");
// // // //       }

// // // //       setImageFile(file);
// // // //       const updatedTimestamp = formatTimestamp();
// // // //       const fileName = `profile#${updatedTimestamp}`;

// // // //       const presignedUrlResponse = await fetch(
// // // //         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/generate-presigned-url/profilePhoto",
// // // //         {
// // // //           method: "POST",
// // // //           headers: {
// // // //             "Content-Type": "application/json",
// // // //           },
// // // //           body: JSON.stringify({
// // // //             user_id: user_id,
// // // //             fileName: fileName,
// // // //           }),
// // // //         }
// // // //       );

// // // //       if (!presignedUrlResponse.ok) {
// // // //         throw new Error("Failed to generate presigned URL");
// // // //       }

// // // //       const presignedData = await presignedUrlResponse.json();

// // // //       if (!presignedData.url) {
// // // //         throw new Error("No presigned URL received");
// // // //       }

// // // //       const uploadResponse = await uploadImageToSignedUrl(
// // // //         presignedData.url,
// // // //         file
// // // //       );

// // // //       if (!uploadResponse.ok) {
// // // //         throw new Error("Failed to upload image to S3");
// // // //       }

// // // //       const updateUrlResponse = await fetch(
// // // //         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/profilePhotoUrl",
// // // //         {
// // // //           method: "POST",
// // // //           headers: {
// // // //             "Content-Type": "application/json",
// // // //           },
// // // //           body: JSON.stringify({
// // // //             user_id: user_id,
// // // //             fileName: fileName,
// // // //             updatedTimestamp: updatedTimestamp,
// // // //           }),
// // // //         }
// // // //       );

// // // //       if (!updateUrlResponse.ok) {
// // // //         throw new Error("Failed to update profile photo URL");
// // // //       }

// // // //       const updatedData = await updateUrlResponse.json();
// // // //       if (updatedData.profilePhotoUrl) {
// // // //         setProfileImage(updatedData.profilePhotoUrl);
// // // //       }

// // // //       if (fileInputRef.current) {
// // // //         fileInputRef.current.value = "";
// // // //       }
// // // //       window.location.reload();
// // // //     } catch (error) {
// // // //       console.error("Error uploading image:", error);
// // // //       alert(error.message || "Failed to upload image. Please try again.");
// // // //     }
// // // //   };

// // // //   const [showStageNameDialog, setShowStageNameDialog] = useState(false);
// // // //   const [previousStageName, setPreviousStageName] = useState("");
// // // //   const [isFirstInteraction, setIsFirstInteraction] = useState(true);
// // // //   const [canEdit, setCanEdit] = useState(true);
// // // //   const stageNameRef = useRef(null);
// // // //   const [key, setKey] = useState(0);

// // // //   const handleStageNameFocus = () => {
// // // //     // Store the current stage name before potential changes
// // // //     setPreviousStageName(stageName);

// // // //     // Show dialog only on first interaction
// // // //     if (isFirstInteraction) {
// // // //       setShowStageNameDialog(true);
// // // //       console.log("handleStageNameFocus");
// // // //     }
// // // //   };

// // // //   const handleStageNameChange = (e) => {
// // // //     if (isEditing) {
// // // //       const newStageName = e.target.value;
// // // //       setStageName(newStageName);
// // // //       validateStageName(newStageName);
// // // //     }
// // // //   };

// // // //   const handleStageNameDialogCancel = () => {
// // // //     setShowStageNameDialog(false);
// // // //     setStageName(tempStageName); // Restore original stage name
// // // //     setIsEditing(false);
// // // //   };

// // // //   const handleStageNameDialogConfirm = () => {
// // // //     setShowStageNameDialog(false);
// // // //     setIsEditing(true);
// // // //     // Focus the input after a brief delay to ensure the dialog is closed
// // // //     setTimeout(() => {
// // // //       if (stageNameRef.current) {
// // // //         stageNameRef.current.focus();
// // // //       }
// // // //     }, 100);
// // // //   };

// // // //   // When blurring out of the field, reset first interaction
// // // //   const handleStageNameBlur = () => {
// // // //     if (isEditing) {
// // // //       setIsEditing(false);
// // // //     }
// // // //   };

// // // //   const handleCoverPageClick = () => {
// // // //     coverPageInputRef.current.click();
// // // //   };

// // // //   const getInitials = (name) => {
// // // //     if (!name) return "";
// // // //     const names = name.split(" ");
// // // //     if (names.length > 1) {
// // // //       return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
// // // //     }
// // // //     return names[0][0].toUpperCase();
// // // //   };

// // // //   //added for set profile image

// // // //   const menuOpen = Boolean(anchorEl);

// // // //   const handleEditIconClick = (event) => {
// // // //     setAnchorEl(event.currentTarget);
// // // //   };

// // // //   const handleClose = () => {
// // // //     setAnchorEl(null);
// // // //   };

// // // //   // const handleImageUpload = async (file) => {
// // // //   //   if (!file || !file.type.startsWith("image/")) return;
// // // //   //   const updatedTimestamp = new Date().toISOString().replace(/[:.-]/g, "");
// // // //   //   const fileName = `profile#${updatedTimestamp}`;

// // // //   //   const presignedUrlRes = await fetch(
// // // //   //     "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/generate-presigned-url/profilePhoto",
// // // //   //     {
// // // //   //       method: "POST",
// // // //   //       headers: { "Content-Type": "application/json" },
// // // //   //       body: JSON.stringify({ user_id, fileName })
// // // //   //     }
// // // //   //   );
// // // //   //   const { url } = await presignedUrlRes.json();

// // // //   //   await fetch(url, {
// // // //   //     method: "PUT",
// // // //   //     headers: { "Content-Type": file.type },
// // // //   //     body: file
// // // //   //   });

// // // //   //   const updateRes = await fetch(
// // // //   //     "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/profilePhotoUrl",
// // // //   //     {
// // // //   //       method: "POST",
// // // //   //       headers: { "Content-Type": "application/json" },
// // // //   //       body: JSON.stringify({ user_id, fileName, updatedTimestamp })
// // // //   //     }
// // // //   //   );
// // // //   //   const updated = await updateRes.json();
// // // //   //   if (updated.profilePhotoUrl) {
// // // //   //     setProfileImage(updated.profilePhotoUrl);
// // // //   //   }
// // // //   //   window.location.reload();
// // // //   // };

// // // //   const handleRemoveProfileImage = async () => {
// // // //     try {
// // // //       const res = await fetch(

// // // //         // "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/removeprofilephoto",
// // // //         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/clearProfilePhoto",
// // // //         {
// // // //           method: "POST",
// // // //           headers: { "Content-Type": "application/json" },
// // // //           body: JSON.stringify({ user_id })
// // // //         }
// // // //       );
// // // //       if (!res.ok) throw new Error("Remove failed");
// // // //       setProfileImage(null);
// // // //       localStorage.removeItem("ProfilePhotoUrl");
// // // //       window.location.reload();
// // // //     } catch (err) {
// // // //       console.error("Error removing image", err);
// // // //     }
// // // //   };

// // // //   const handleCameraCapture = async () => {
// // // //     try {
// // // //       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
// // // //       const video = document.createElement("video");
// // // //       video.srcObject = stream;
// // // //       video.play();

// // // //       const canvas = document.createElement("canvas");
// // // //       const ctx = canvas.getContext("2d");
// // // //       video.addEventListener("loadeddata", () => {
// // // //         canvas.width = video.videoWidth;
// // // //         canvas.height = video.videoHeight;
// // // //         ctx.drawImage(video, 0, 0);
// // // //         canvas.toBlob((blob) => {
// // // //           if (blob) {
// // // //             const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
// // // //             handleImageUpload(file);
// // // //           }
// // // //           stream.getTracks().forEach((track) => track.stop());
// // // //         }, "image/jpeg");
// // // //       });
// // // //     } catch (error) {
// // // //       alert("Camera not available or permission denied.");
// // // //     }
// // // //   };

// // // //   // const getInitials = (name) => {
// // // //   //   const parts = name?.trim().split(" ") || [];
// // // //   //   return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0]?.[0]?.toUpperCase() || "";
// // // //   // };



// // // //   const handleCoverPageUpload = async (file) => {
// // // //     try {
// // // //       if (!file) {
// // // //         throw new Error("No file selected");
// // // //       }

// // // //       if (!file.type.startsWith("image/")) {
// // // //         throw new Error("Please select an image file");
// // // //       }

// // // //       const updatedTimestamp = formatTimestamp();
// // // //       const fileName = `CoverPage#${updatedTimestamp}`;

// // // //       // Step 1: Get the presigned URL for cover page
// // // //       const presignedUrlResponse = await fetch(
// // // //         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/generate-presigned-url/coverPage",
// // // //         {
// // // //           method: "POST",
// // // //           headers: {
// // // //             "Content-Type": "application/json",
// // // //           },
// // // //           body: JSON.stringify({
// // // //             user_id: user_id,
// // // //             fileName: fileName,
// // // //           }),
// // // //         }
// // // //       );

// // // //       if (!presignedUrlResponse.ok) {
// // // //         throw new Error("Failed to generate presigned URL for cover page");
// // // //       }

// // // //       const presignedData = await presignedUrlResponse.json();

// // // //       if (!presignedData.url) {
// // // //         throw new Error("No presigned URL received for cover page");
// // // //       }

// // // //       // Step 2: Upload the cover page image to S3 using presigned URL
// // // //       const uploadResponse = await uploadImageToSignedUrl(
// // // //         presignedData.url,
// // // //         file
// // // //       );

// // // //       if (!uploadResponse.ok) {
// // // //         throw new Error("Failed to upload cover page to S3");
// // // //       }

// // // //       // Step 3: Update the cover page URL in the backend
// // // //       const updateUrlResponse = await fetch(
// // // //         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/coverPageUrl",
// // // //         {
// // // //           method: "POST",
// // // //           headers: {
// // // //             "Content-Type": "application/json",
// // // //           },
// // // //           body: JSON.stringify({
// // // //             user_id: user_id,
// // // //             fileName: fileName,
// // // //             updatedTimestamp: updatedTimestamp,
// // // //           }),
// // // //         }
// // // //       );

// // // //       if (!updateUrlResponse.ok) {
// // // //         throw new Error("Failed to update cover page URL");
// // // //       }

// // // //       const updatedData = await updateUrlResponse.json();

// // // //       if (updatedData.coverPageUrl) {
// // // //         setCoverPage(updatedData.coverPageUrl);
// // // //         localStorage.setItem("CoverPageUrl", updatedData.coverPageUrl);
// // // //       }

// // // //       if (coverPageInputRef.current) {
// // // //         coverPageInputRef.current.value = "";
// // // //       }

// // // //       window.location.reload();
// // // //     } catch (error) {
// // // //       console.error("Error uploading cover page:", error);
// // // //       alert(error.message || "Failed to upload cover page. Please try again.");
// // // //     }
// // // //   };

// // // //   const [coverAnchorEl, setCoverAnchorEl] = useState(null);
// // // // const coverMenuOpen = Boolean(coverAnchorEl);

// // // // const handleCoverEditIconClick = (event) => {
// // // //   // setCoverAnchorEl(event.currentTarget);

// // // //   event.stopPropagation();
// // // //   if (!coverAnchorEl) {
// // // //     setCoverAnchorEl(event.currentTarget);
// // // //   }
// // // // };

// // // // const handleCoverMenuClose = () => {
// // // //   setCoverAnchorEl(null);
// // // // };

// // // // const coverFileInputRef = useRef(null);

// // // // const handleRemoveCoverImage = async () => {
// // // //   try {
// // // //     const res = await fetch(
// // // //       "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/clearCoverPage",
// // // //       {
// // // //         method: "POST",
// // // //         headers: { "Content-Type": "application/json" },
// // // //         body: JSON.stringify({ user_id })
// // // //       }
// // // //     );
// // // //     if (!res.ok) throw new Error("Remove failed");
// // // //     setCoverPage(null);
// // // //     localStorage.removeItem("CoverPageUrl");
// // // //     window.location.reload();
// // // //   } catch (err) {
// // // //     console.error("Error removing cover image", err);
// // // //   }
// // // // };

// // // // const handleCoverCameraCapture = async () => {
// // // //   try {
// // // //     const stream = await navigator.mediaDevices.getUserMedia({ video: true });
// // // //     const video = document.createElement("video");
// // // //     video.srcObject = stream;
// // // //     video.play();

// // // //     const canvas = document.createElement("canvas");
// // // //     const ctx = canvas.getContext("2d");
// // // //     video.addEventListener("loadeddata", () => {
// // // //       canvas.width = video.videoWidth;
// // // //       canvas.height = video.videoHeight;
// // // //       ctx.drawImage(video, 0, 0);
// // // //       canvas.toBlob((blob) => {
// // // //         if (blob) {
// // // //           const file = new File([blob], "camera-cover.jpg", { type: "image/jpeg" });
// // // //           handleCoverPageUpload(file);
// // // //         }
// // // //         stream.getTracks().forEach((track) => track.stop());
// // // //       }, "image/jpeg");
// // // //     });
// // // //   } catch (error) {
// // // //     alert("Camera not available or permission denied.");
// // // //   }
// // // // };

// // // //   return (
// // // //     <Box display="flex">
// // // //       <SideBar />
// // // //       <Box className="edit">
// // // //         <Box className="edit__banner">
// // // //           <img
// // // //             src={coverPage || bannerImage}
// // // //             alt="Profile Banner"
// // // //             className="edit__banner-image"
// // // //           />
// // // //         </Box>
// // // //         {localStorage.getItem("Category") !== "Listener" && (
// // // //           <Box
// // // //             className="editIconContainer"
// // // //             sx={{
// // // //               backgroundColor: "#2644D9",
// // // //               marginRight: sidebarMargin,
// // // //               transition: "all 0.4s ease-in-out",
// // // //             }}
// // // //             // onClick={handleCoverPageClick}
// // // //             onClick={handleCoverEditIconClick}
// // // //             style={{ cursor: "pointer" }}
// // // //           >
// // // //             <img src={Edit} alt="Edit" className="editIcon" />
// // // //             <input
// // // //               type="file"
// // // //               ref={coverPageInputRef}
// // // //               accept="image/*"
// // // //               onChange={(event) => {
// // // //                 const file = event.target.files[0];
// // // //                 if (file) {
// // // //                   handleCoverPageUpload(file);
// // // //                 }
// // // //               }}
// // // //               style={{ display: "none" }}
// // // //             />

// // // //           <Menu anchorEl={coverAnchorEl} open={coverMenuOpen} onClose={handleCoverMenuClose} >
// // // //             <MenuItem onClick={() => { handleCoverMenuClose(); coverFileInputRef.current.click(); }}>Choose from Gallery</MenuItem>
// // // //             <MenuItem onClick={() => { handleCoverMenuClose(); handleCoverCameraCapture(); }}>Capture from Camera</MenuItem>
// // // //             <MenuItem onClick={() => { handleCoverMenuClose(); handleRemoveCoverImage(); }}>Remove Cover Image</MenuItem>
// // // //           </Menu>
// // // //           </Box>
// // // //         )}

// // // //         <Box className="edit__info">
// // // //           <Box className="edit__avatar-container">
// // // //             {/* <Avatar
// // // //               src={profileImage}
// // // //               alt="Profile"
// // // //               className="edit__avatar"
// // // //               sx={{
// // // //                 backgroundColor: profileImage ? "transparent" : "",
// // // //                 color: "white",
// // // //                 fontWeight: "bold",
// // // //                 fontSize: "50px",
// // // //               }}
// // // //             >
// // // //               {!profileImage && getInitials(savedDisplayName)}
// // // //               {/* {!profileImage && (showStageName && stageName 
// // // //                             ? getInitials(stageName) 
// // // //                             : getInitials(fullName))} */}
// // // //             {/* </Avatar>
// // // //             <Box
// // // //               className="edit__icon-container"
// // // //               onClick={handleImageClick}
// // // //               style={{
// // // //                 cursor: "pointer",
// // // //                 position: "absolute",
// // // //                 bottom: 0,
// // // //                 right: 0,
// // // //                 width: "36px", // Adjusted to match your layout
// // // //                 height: "38px",
// // // //                 padding: 0, // Remove padding since we'll handle it with image positioning
// // // //                 background: "transparent", // Make container background transparent
// // // //                 textAlign: "center",

// // // //                 marginRight: "20px",
// // // //               }}
// // // //             >
// // // //               <img
// // // //                 src={EditBg}
// // // //                 alt="Edit Background"
// // // //                 style={{
// // // //                   position: "absolute",
// // // //                   width: "100%",
// // // //                   height: "100%",
// // // //                   borderRadius: "50%",
// // // //                   backgroundColor: "#2644D9 !important",
// // // //                 }}
// // // //                 sx={{
// // // //                   // "& element.style": {
// // // //                   //   marginLeft: "8px !important",
// // // //                   // },
// // // //                 }}
// // // //               />
// // // //               <img
// // // //                 src={Edit}
// // // //                 alt="Edit"
// // // //                 style={{
// // // //                   position: "absolute",
// // // //                   top: "50%",
// // // //                   left: "50%",
// // // //                   transform: "translate(-50%, -50%)",
// // // //                   width: "15.57px",
// // // //                   height: "16.89px",
// // // //                   marginLeft: "18px",
// // // //                 }}
// // // //               />
// // // //               <input
// // // //                 type="file"
// // // //                 ref={fileInputRef}
// // // //                 accept="image/*"
// // // //                 onChange={(event) => {
// // // //                   const file = event.target.files[0];
// // // //                   if (file) {
// // // //                     handleImageUpload(file);
// // // //                   }
// // // //                 }}
// // // //                 style={{ display: "none" }}
// // // //               />
// // // //             </Box> */}
// // // //              <Avatar
// // // //             src={profileImage}
// // // //             alt="Profile"
// // // //             className="edit__avatar"
// // // //             sx={{ backgroundColor: profileImage ? "transparent" : "#222", fontSize: "48px" }}
// // // //           >
// // // //             {!profileImage && getInitials(savedDisplayName)}
// // // //           </Avatar>
// // // //           <Box
// // // //             onClick={handleEditIconClick}
// // // //             style={{ position: "absolute", bottom: 0, right: 20, cursor: "pointer" }}
// // // //           >
// // // //             <img src={EditBg} alt="EditBg" style={{ width: 36, height: 36 }} />
// // // //             <img src={Edit} alt="Edit" style={{ position: "absolute", top: 10, left: 10, width: 16 }} />
// // // //           </Box>
// // // //           <input
// // // //             type="file"
// // // //             ref={fileInputRef}
// // // //             accept="image/*"
// // // //             style={{ display: "none" }}
// // // //             onChange={(e) => {
// // // //               const file = e.target.files[0];
// // // //               if (file) handleImageUpload(file);
// // // //             }}
// // // //           />
// // // //           <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleClose}>
// // // //             <MenuItem onClick={() => { handleClose(); fileInputRef.current.click(); }}>Choose from Gallery</MenuItem>
// // // //             <MenuItem onClick={() => { handleClose(); handleCameraCapture(); }}>Capture from Camera</MenuItem>
// // // //             <MenuItem onClick={() => { handleClose(); handleRemoveProfileImage(); }}>Remove Profile Image</MenuItem>
// // // //           </Menu>
// // // //           </Box>

// // // //           <Box className="edit__content">
// // // //             <Typography
// // // //               variant="h4"
// // // //               className="edit__title"
// // // //               style={{
// // // //                 textDecoration: "underline",
// // // //                 textDecorationColor: "white",
// // // //                 textUnderlineOffset: "5px",
// // // //                 textDecorationThickness: "2px",
// // // //               }}
// // // //             >
// // // //               Edit Profile
// // // //             </Typography>

// // // //             <Typography variant="h5" className="edit__subtitle">
// // // //               Update Details:
// // // //             </Typography>

// // // //             <Box className="edit__field-container">
// // // //               <Typography variant="h6" className="edit__field-label">
// // // //                 Username
// // // //               </Typography>
// // // //               <TextField
// // // //                 variant="filled"
// // // //                 required
// // // //                 name="name"
// // // //                 // fullWidth
// // // //                 value={fullName}
// // // //                 onChange={(e) => {
// // // //                   setFullName(e.target.value);
// // // //                   validateFullName(e.target.value);
// // // //                 }}
// // // //                 error={!!errors.fullName}
// // // //                 className="edit__field"
// // // //                 sx={{
// // // //                   "& .MuiFilledInput-input": {
// // // //                     padding: "15px",
// // // //                   },
// // // //                   width: "499px !important",
// // // //                   maxWidth: "499px !important",
// // // //                 }}
// // // //               />
// // // //               {errors.fullName && (
// // // //                 <Typography
// // // //                   variant="body2"
// // // //                   sx={{
// // // //                     color: "red !important",
// // // //                     textAlign: "left",
// // // //                     width: "100%",
// // // //                   }}
// // // //                 >
// // // //                   {errors.fullName}
// // // //                 </Typography>
// // // //               )}
// // // //             </Box>
// // // //             {showStageName && (
// // // //               <Box className="edit__field-container">
// // // //                 <Typography variant="h6" className="edit__field-label">
// // // //                   Stage name
// // // //                 </Typography>

// // // //                 <TextField
// // // //                   inputRef={stageNameRef}
// // // //                   variant="filled"
// // // //                   required
// // // //                   name="stageName"
// // // //                   fullWidth
// // // //                   value={stageName}
// // // //                   onChange={handleStageNameChange}
// // // //                   onClick={handleStageNameClick}
// // // //                   onBlur={handleStageNameBlur}
// // // //                   InputProps={{
// // // //                     readOnly: !isEditing,
// // // //                   }}
// // // //                   error={!!errors.stageName}
// // // //                   className="edit__field"
// // // //                   sx={{
// // // //                     "& .MuiFilledInput-root": {
// // // //                       borderRadius: "10px !important",
// // // //                     },
// // // //                     "& .MuiFilledInput-input": {
// // // //                       padding: "15px",
// // // //                     },
// // // //                     width: "499px !important",
// // // //                     maxWidth: "499px !important",
// // // //                   }}
// // // //                 />

// // // //                 <Dialog
// // // //                   open={showStageNameDialog}
// // // //                   onClose={handleStageNameDialogCancel}
// // // //                   sx={{
// // // //                     "& .MuiDialog-paper": {
// // // //                       background: "#1C1B46",
// // // //                       borderRadius: "16px",
// // // //                       maxWidth: "300px",
// // // //                       width: "350px !important",
// // // //                       height: "180px !important",
// // // //                       margin: "20px",
// // // //                       padding: "24px",
// // // //                     },
// // // //                     "& .MuiBackdrop-root": {
// // // //                       backgroundColor: "rgba(0, 0, 0, 0.75)",
// // // //                     },
// // // //                   }}
// // // //                 >
// // // //                   {/* Keep the existing Dialog content the same */}
// // // //                   <Box
// // // //                     sx={{
// // // //                       display: "flex",
// // // //                       flexDirection: "column",
// // // //                       alignItems: "center",
// // // //                       textAlign: "center",
// // // //                     }}
// // // //                   >
// // // //                     <Typography
// // // //                       sx={{
// // // //                         color: "white",
// // // //                         fontSize: "18px !important",
// // // //                         fontWeight: 600,
// // // //                         marginBottom: "8px",
// // // //                       }}
// // // //                     >
// // // //                       Warning
// // // //                     </Typography>
// // // //                     <Typography
// // // //                       sx={{
// // // //                         color: "white",
// // // //                         fontSize: "16px",
// // // //                         marginTop: "16px !important",
// // // //                       }}
// // // //                     >
// // // //                       Your identity with the audience will be changed.
// // // //                     </Typography>
// // // //                     <Box
// // // //                       sx={{
// // // //                         display: "flex",
// // // //                         gap: "32px",
// // // //                         justifyContent: "center",
// // // //                       }}
// // // //                     >
// // // //                       <Button
// // // //                         onClick={handleStageNameDialogCancel}
// // // //                         sx={{
// // // //                           color: "white",
// // // //                           fontSize: "16px",
// // // //                           textTransform: "none",
// // // //                           marginTop: "30px !important",
// // // //                           padding: "8px 16px",
// // // //                           "&:hover": {
// // // //                             background: "transparent",
// // // //                           },
// // // //                         }}
// // // //                       >
// // // //                         Cancel
// // // //                       </Button>
// // // //                       <Button
// // // //                         onClick={handleStageNameDialogConfirm}
// // // //                         sx={{
// // // //                           color: "white",
// // // //                           fontSize: "16px",
// // // //                           textTransform: "none",
// // // //                           padding: "8px 16px",
// // // //                           marginTop: "30px !important",
// // // //                           "&:hover": {
// // // //                             background: "transparent",
// // // //                           },
// // // //                         }}
// // // //                       >
// // // //                         Yes
// // // //                       </Button>
// // // //                     </Box>
// // // //                   </Box>
// // // //                 </Dialog>

// // // //                 {/* {errors.stageName && (  // Add this error message section
// // // //                                     <Typography variant="body2" sx={{ color: 'red', textAlign: 'left', width: '100%' }}>
// // // //                                         {errors.stageName}
// // // //                                     </Typography>
// // // //                                 )} */}
// // // //                 {/* {showStageNameWarning && (
// // // //                                     <Alert severity="warning" sx={{ mb: 1 ,width:"499px" }}>
// // // //                                         Your identity with the audience will be changed
// // // //                                     </Alert>
// // // //                                 )} */}
// // // //               </Box>
// // // //             )}

// // // //             {localStorage.getItem("Category") !== "Listener" && (
// // // //               <Box className="edit__field-container">
// // // //                 <Typography variant="h6" className="edit__field-label">
// // // //                   Bio
// // // //                 </Typography>

// // // //                 <TextField
// // // //                   variant="filled"
// // // //                   required
// // // //                   name="bio"
// // // //                   value={bio}
// // // //                   multiline
// // // //                   rows={2}
// // // //                   onChange={handleBioChange}
// // // //                   error={!!errors.bio}
// // // //                   helperText={errors.bio}
// // // //                   fullWidth
// // // //                   className="edit__field edit__field_height"
// // // //                   sx={{
// // // //                     // '& .MuiFilledInput-input': {
// // // //                     //     padding: '0px',
// // // //                     // },
// // // //                     width: "499px !important",
// // // //                     maxWidth: "499px !important",
// // // //                     '& .MuiInputBase-root': {
// // // //                       height: '70px !important',
// // // //                       minHeight: '70px !important'
// // // //                     }
// // // //                   }}
// // // //                 />
// // // //                 <Typography
// // // //                   variant="caption"
// // // //                   color={getWordCount(bio) >= 300 ? "error" : "textSecondary"}
// // // //                   sx={{
// // // //                     mb: 1,
// // // //                     display: "flex",
// // // //                     justifyContent: "flex-end",
// // // //                     mt: 1,
// // // //                     marginRight: "35px !important",
// // // //                     color: "white",
// // // //                   }}
// // // //                 >
// // // //                   {getWordCount(bio)}/300 characters
// // // //                   {getWordCount(bio) >= 300 && (
// // // //                     <span style={{ marginLeft: "8px" }}>
// // // //                       (Maximum characters limit reached)
// // // //                     </span>
// // // //                   )}
// // // //                 </Typography>
// // // //               </Box>
// // // //             )}

// // // //             <Box alignContent={"center"}>
// // // //               <Button
// // // //                 variant="contained"
// // // //                 onClick={handleUpdate}
// // // //                 className="edit__update-button"
// // // //                 disabled={!hasChanges || !!errors.fullName || (showStageName && !!errors.stageName) || !!errors.bio}
// // // //                 sx={{
// // // //                   margin: "0 auto",
// // // //                   marginLeft: "135px",
// // // //                   display: "block",
// // // //                   backgroundColor: hasChanges && !errors.fullName && !(showStageName && errors.stageName) && !errors.bio ? "#1976d2 !important" : "gray !important",
// // // //                   "&:hover": {
// // // //                     backgroundColor: hasChanges && !errors.fullName && !(showStageName && errors.stageName) && !errors.bio ? "#1565c0 !important" : "gray !important",
// // // //                   },
// // // //                 }}
// // // //               >
// // // //                 Update
// // // //               </Button>
// // // //               <Dialog
// // // //                 open={openSuccessDialog}
// // // //                 onClose={() => setOpenSuccessDialog(false)}
// // // //                 sx={{
// // // //                   "& .MuiDialog-paper": {
// // // //                     background: "#0F0B2C",
// // // //                     borderRadius: "16px",
// // // //                     maxWidth: "478px",
// // // //                     width: "478px",
// // // //                     height: "316px",
// // // //                     margin: "20px",
// // // //                     marginTop: "-20px !important",
// // // //                     position: "relative",
// // // //                     padding: "40px 20px",
// // // //                   },
// // // //                   "& .MuiBackdrop-root": {
// // // //                     backgroundColor: "rgba(0, 0, 0, 0.8)",
// // // //                   },
// // // //                 }}
// // // //               >
// // // //                 <IconButton
// // // //                   onClick={() => setOpenSuccessDialog(false)}
// // // //                   sx={{
// // // //                     position: "absolute",
// // // //                     right: 8,
// // // //                     top: 8,
// // // //                     color: "white",
// // // //                   }}
// // // //                 >
// // // //                   <img
// // // //                     src={cross}
// // // //                     alt="Close"
// // // //                     style={{
// // // //                       height: "35px",
// // // //                       width: "33px",
// // // //                     }}
// // // //                   />
// // // //                 </IconButton>
// // // //                 <Box
// // // //                   sx={{
// // // //                     display: "flex",
// // // //                     flexDirection: "column",
// // // //                     alignItems: "center",
// // // //                     textAlign: "center",
// // // //                     padding: "20px",
// // // //                     marginTop: "30px",
// // // //                   }}
// // // //                 >
// // // //                   <Typography
// // // //                     sx={{
// // // //                       color: "white",
// // // //                       fontSize: "24px !important",
// // // //                       fontWeight: 600,
// // // //                       marginBottom: "20px",
// // // //                     }}
// // // //                   >
// // // //                     Profile updated successfully
// // // //                   </Typography>
// // // //                   <Box
// // // //                     sx={{
// // // //                       width: "49.41px",
// // // //                       height: "50.86px",
// // // //                       borderRadius: "50%",
// // // //                       backgroundColor: "#2782EE",
// // // //                       display: "flex",
// // // //                       alignItems: "center",
// // // //                       justifyContent: "center",
// // // //                       cursor: "pointer",
// // // //                     }}
// // // //                     onClick={() => setOpenSuccessDialog(false)}
// // // //                   >
// // // //                     <CheckIcon sx={{ color: "white", fontSize: "32px" }} />
// // // //                   </Box>
// // // //                 </Box>
// // // //               </Dialog>
// // // //             </Box>
// // // //           </Box>
// // // //         </Box>
// // // //       </Box>
// // // //     </Box>
// // // //   );
// // // // };

// // // // export default EditProfile;

// // // import React, { useRef, useState, useEffect } from "react";
// // // import {
// // //   Box,
// // //   Typography,
// // //   Avatar,
// // //   IconButton,
// // //   TextField,
// // //   Button,
// // //   Menu,
// // //   MenuItem,
// // //   Alert,
// // //   Dialog,
// // //   DialogContent,
// // //   DialogActions,
// // // } from "@mui/material";
// // // import SideBar from "./SideBar";
// // // import Edit from "./assets/VectorEdit.png";
// // // import EditBg from "./assets/VectorEditBg_new.png";
// // // import { useNavigate } from "react-router-dom";
// // // import "./EditProfile.css";
// // // import { Check as CheckIcon } from "lucide-react";
// // // import cross from "./assets/Cross.png";
// // // import bannerImage1 from "./assets/RectangleBannerImage.png";

// // // const EditProfile = () => {
// // //   const [coverPage, setCoverPage] = useState(null);
// // //   const bannerImage = bannerImage1;
// // //   const [profileImage, setProfileImage] = useState(null);
// // //   const [anchorEl, setAnchorEl] = useState(null);
// // //   const user_id = localStorage.getItem("user_id");
// // //   const StageName = localStorage.getItem("StageName");
// // //   const FullName = localStorage.getItem("FullName");
// // //   const navigate = useNavigate();
// // //   const fileInputRef = useRef(null);
// // //   const coverPageInputRef = useRef(null);
// // //   const [ImageFile, setImageFile] = useState(null);
// // //   const [fullName, setFullName] = useState("");
// // //   const [stageName, setStageName] = useState("");
// // //   const [bio, setBio] = useState("");
// // //   const [errors, setErrors] = useState({
// // //     fullName: "",
// // //     stageName: "",
// // //     bio: "",
// // //   });

// // //   const [isEditing, setIsEditing] = useState(false);
// // //   const [tempStageName, setTempStageName] = useState("");
// // //   const [showStageNameWarning, setShowStageNameWarning] = useState(false);
// // //   const [showStageName, setShowStageName] = useState(false);
// // //   const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
// // //   const [initialFullName, setInitialFullName] = useState("");
// // //   const [initialStageName, setInitialStageName] = useState("");
// // //   const [initialBio, setInitialBio] = useState("");
// // //   const [hasChanges, setHasChanges] = useState(false);

// // //   const [sidebarMargin, setSidebarMargin] = useState(
// // //     localStorage.getItem("sidebarCollapsed") === "true"
// // //       ? "-80px !important"
// // //       : "99px !important"
// // //   );

// // //   // State for camera preview dialog
// // //   const [openCameraDialog, setOpenCameraDialog] = useState(false);
// // //   const videoRef = useRef(null);
// // //   const canvasRef = useRef(null);
// // //   const [stream, setStream] = useState(null);

// // //   useEffect(() => {
// // //     setSidebarMargin(
// // //       localStorage.getItem("sidebarCollapsed") === "true"
// // //         ? "-80px !important"
// // //         : "99px !important"
// // //     );

// // //     const handleStorageChange = () => {
// // //       setSidebarMargin(
// // //         localStorage.getItem("sidebarCollapsed") === "true"
// // //           ? "-80px !important"
// // //           : "99px !important"
// // //       );
// // //     };

// // //     const handleSidebarChange = (event) => {
// // //       if (event.detail === "collapsed") {
// // //         setSidebarMargin("-80px !important");
// // //       } else {
// // //         setSidebarMargin("99px !important");
// // //       }
// // //     };

// // //     window.addEventListener("storage", handleStorageChange);
// // //     window.addEventListener("sidebarStateChange", handleSidebarChange);

// // //     return () => {
// // //       window.removeEventListener("storage", handleStorageChange);
// // //       window.removeEventListener("sidebarStateChange", handleSidebarChange);
// // //     };
// // //   }, []);

// // //   useEffect(() => {
// // //     const fetchProfilePhoto = async () => {
// // //       try {
// // //         const response = await fetch(
// // //           `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getprofilephoto?user_id=${user_id}`
// // //         );
// // //         const data = await response.json();
// // //         setProfileImage(data.profilePhotoUrl?.S || null);
// // //       } catch (err) {
// // //         console.error("Error loading profile photo", err);
// // //       }
// // //     };
// // //     fetchProfilePhoto();
// // //   }, [user_id]);

// // //   useEffect(() => {
// // //     const fetchCoverPage = async () => {
// // //       try {
// // //         const response = await fetch(
// // //           `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getcoverpage?user_id=${user_id}`,
// // //           {
// // //             method: "GET",
// // //             headers: {
// // //               "Content-Type": "application/json",
// // //             },
// // //           }
// // //         );

// // //         if (!response.ok) {
// // //           throw new Error("Failed to fetch profile photo");
// // //         }

// // //         const data = await response.json();
// // //         setCoverPage(data.coverPageUrl.S);
// // //         localStorage.setItem("CoverPageUrl", data.coverPageUrl.S);
// // //       } catch (error) {
// // //         console.error("Error fetching CoverPage:", error);
// // //       }
// // //     };

// // //     fetchCoverPage();
// // //   }, [user_id]);

// // //   const [savedDisplayName, setSavedDisplayName] = useState("");

// // //   useEffect(() => {
// // //     const fetchProfileDetails = async () => {
// // //       try {
// // //         const response = await fetch(
// // //           `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getprofiledetails?user_id=${user_id}`,
// // //           {
// // //             method: "GET",
// // //             headers: {
// // //               "Content-Type": "application/json",
// // //             },
// // //           }
// // //         );

// // //         if (!response.ok) {
// // //           throw new Error("Failed to fetch profile details");
// // //         }

// // //         const data = await response.json();
// // //         setFullName(data.FullName.S || "");
// // //         setInitialFullName(data.FullName.S || "");
// // //         const fetchedStageName = data.StageName.S || "";
// // //         setStageName(fetchedStageName);
// // //         setInitialStageName(fetchedStageName);
// // //         setBio(data.bio.S || "");
// // //         setInitialBio(data.bio.S || "");
// // //         setShowStageName(!!fetchedStageName);
// // //         setSavedDisplayName(data.StageName.S || data.FullName.S || "");
// // //       } catch (error) {
// // //         console.error("Error fetching profile details:", error);
// // //       }
// // //     };

// // //     fetchProfileDetails();
// // //   }, [user_id]);

// // //   useEffect(() => {
// // //     const hasFieldChanges =
// // //       fullName !== initialFullName ||
// // //       (showStageName && stageName !== initialStageName) ||
// // //       bio !== initialBio;
// // //     setHasChanges(hasFieldChanges);
// // //   }, [fullName, stageName, bio, showStageName, initialFullName, initialStageName, initialBio]);

// // //   const formatTimestamp = () => {
// // //     const now = new Date();
// // //     const year = now.getFullYear();
// // //     const month = String(now.getMonth() + 1).padStart(2, "0");
// // //     const day = String(now.getDate()).padStart(2, "0");
// // //     const hours = String(now.getHours()).padStart(2, "0");
// // //     const minutes = String(now.getMinutes()).padStart(2, "0");
// // //     const seconds = String(now.getSeconds()).padStart(2, "0");

// // //     return `${year}${month}${day}_${hours}${minutes}${seconds}`;
// // //   };

// // //   const validateFullName = (name) => {
// // //     if (!name.trim()) {
// // //       setErrors((prev) => ({
// // //         ...prev,
// // //         fullName: "Username cannot be empty",
// // //       }));
// // //       return false;
// // //     }
// // //     setErrors((prev) => ({
// // //       ...prev,
// // //       fullName: "",
// // //     }));
// // //     return true;
// // //   };

// // //   const validateStageName = (name) => {
// // //     if (showStageName && !name.trim()) {
// // //       setErrors((prev) => ({
// // //         ...prev,
// // //         stageName: "Stage name cannot be empty",
// // //       }));
// // //       return false;
// // //     }
// // //     setErrors((prev) => ({
// // //       ...prev,
// // //       stageName: "",
// // //     }));
// // //     return true;
// // //   };

// // //   const getWordCount = (text) => {
// // //     return text.length;
// // //   };

// // //   const handleBioChange = (e) => {
// // //     const newBio = e.target.value;
// // //     const wordCount = getWordCount(newBio);

// // //     if (wordCount <= 300 || newBio.length < bio.length) {
// // //       setBio(newBio);
// // //       validateBio(newBio);
// // //     }
// // //   };

// // //   const handleStageNameClick = () => {
// // //     if (!isEditing) {
// // //       setTempStageName(stageName);
// // //       setShowStageNameDialog(true);
// // //     }
// // //   };

// // //   const validateBio = (bioText) => {
// // //     const wordCount = getWordCount(bioText);
// // //     if (wordCount > 300) {
// // //       setErrors((prev) => ({
// // //         ...prev,
// // //         bio: "Bio cannot exceed 300 characters",
// // //       }));
// // //       return false;
// // //     }
// // //     setErrors((prev) => ({
// // //       ...prev,
// // //       bio: "",
// // //     }));
// // //     return true;
// // //   };

// // //   const capitalizeWords = (str) => {
// // //     return str
// // //       .toLowerCase()
// // //       .split(" ")
// // //       .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
// // //       .join(" ")
// // //       .trim();
// // //   };

// // //   const handleUpdate = async () => {
// // //     const isFullNameValid = validateFullName(fullName);
// // //     const isStageNameValid = showStageName ? validateStageName(stageName) : true;
// // //     const isBioValid = validateBio(bio);

// // //     if (!isFullNameValid || !isStageNameValid || !isBioValid) {
// // //       return;
// // //     }

// // //     const hasChanges =
// // //       fullName !== (FullName || "") ||
// // //       (showStageName && stageName !== (StageName || "")) ||
// // //       bio !== (localStorage.getItem("bio") || "");

// // //     if (!hasChanges) {
// // //       alert("Please update your profile");
// // //       return;
// // //     }

// // //     try {
// // //       const payload = {
// // //         FullName: capitalizeWords(fullName),
// // //         bio: bio,
// // //         user_id: user_id,
// // //         StageName: showStageName ? capitalizeWords(stageName) : undefined,
// // //         updatedTimestamp: formatTimestamp(),
// // //       };

// // //       const response = await fetch(
// // //         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/editprofile",
// // //         {
// // //           method: "POST",
// // //           headers: {
// // //             "Content-Type": "application/json",
// // //           },
// // //           body: JSON.stringify(payload),
// // //         }
// // //       );

// // //       if (!response.ok) {
// // //         throw new Error("Failed to update profile details");
// // //       }

// // //       localStorage.setItem("FullName", capitalizeWords(fullName));
// // //       if (showStageName) {
// // //         localStorage.setItem("StageName", capitalizeWords(stageName));
// // //       }
// // //       localStorage.setItem("bio", bio);

// // //       setSavedDisplayName(
// // //         showStageName ? capitalizeWords(stageName) : capitalizeWords(fullName)
// // //       );
// // //       setInitialFullName(capitalizeWords(fullName));
// // //       setInitialStageName(showStageName ? capitalizeWords(stageName) : "");
// // //       setInitialBio(bio);
// // //       setOpenSuccessDialog(true);
// // //       setTimeout(() => {
// // //         setOpenSuccessDialog(false);
// // //         setFullName(capitalizeWords(fullName));
// // //         setStageName(showStageName ? capitalizeWords(stageName) : "");
// // //         setBio(bio);
// // //       }, 3000);
// // //     } catch (error) {
// // //       console.error("Error updating profile:", error);
// // //       alert("Failed to update profile. Please try again.");
// // //     }
// // //   };

// // //   const handleImageClick = () => {
// // //     fileInputRef.current.click();
// // //   };

// // //   const uploadImageToSignedUrl = async (url, file) => {
// // //     try {
// // //       const response = await fetch(url, {
// // //         method: "PUT",
// // //         headers: {
// // //           "Content-Type": file.type,
// // //         },
// // //         body: file,
// // //       });

// // //       if (!response.ok) {
// // //         throw new Error(`Upload failed with status: ${response.status}`);
// // //       }

// // //       return response;
// // //     } catch (error) {
// // //       console.error("Error in uploadImageToSignedUrl:", error);
// // //       throw error;
// // //     }
// // //   };

// // //   const handleImageUpload = async (file) => {
// // //     try {
// // //       if (!file) {
// // //         throw new Error("No file selected");
// // //       }

// // //       if (!file.type.startsWith("image/")) {
// // //         throw new Error("Please select an image file");
// // //       }

// // //       setImageFile(file);
// // //       const updatedTimestamp = formatTimestamp();
// // //       const fileName = `profile#${updatedTimestamp}`;

// // //       const presignedUrlResponse = await fetch(
// // //         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/generate-presigned-url/profilePhoto",
// // //         {
// // //           method: "POST",
// // //           headers: {
// // //             "Content-Type": "application/json",
// // //           },
// // //           body: JSON.stringify({
// // //             user_id: user_id,
// // //             fileName: fileName,
// // //           }),
// // //         }
// // //       );

// // //       if (!presignedUrlResponse.ok) {
// // //         throw new Error("Failed to generate presigned URL");
// // //       }

// // //       const presignedData = await presignedUrlResponse.json();

// // //       if (!presignedData.url) {
// // //         throw new Error("No presigned URL received");
// // //       }

// // //       const uploadResponse = await uploadImageToSignedUrl(
// // //         presignedData.url,
// // //         file
// // //       );

// // //       if (!uploadResponse.ok) {
// // //         throw new Error("Failed to upload image to S3");
// // //       }

// // //       const updateUrlResponse = await fetch(
// // //         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/profilePhotoUrl",
// // //         {
// // //           method: "POST",
// // //           headers: {
// // //             "Content-Type": "application/json",
// // //           },
// // //           body: JSON.stringify({
// // //             user_id: user_id,
// // //             fileName: fileName,
// // //             updatedTimestamp: updatedTimestamp,
// // //           }),
// // //         }
// // //       );

// // //       if (!updateUrlResponse.ok) {
// // //         throw new Error("Failed to update profile photo URL");
// // //       }

// // //       const updatedData = await updateUrlResponse.json();
// // //       if (updatedData.profilePhotoUrl) {
// // //         setProfileImage(updatedData.profilePhotoUrl);
// // //       }

// // //       if (fileInputRef.current) {
// // //         fileInputRef.current.value = "";
// // //       }
// // //       window.location.reload();
// // //     } catch (error) {
// // //       console.error("Error uploading image:", error);
// // //       alert(error.message || "Failed to upload image. Please try again.");
// // //     }
// // //   };

// // //   const [showStageNameDialog, setShowStageNameDialog] = useState(false);
// // //   const [previousStageName, setPreviousStageName] = useState("");
// // //   const [isFirstInteraction, setIsFirstInteraction] = useState(true);
// // //   const [canEdit, setCanEdit] = useState(true);
// // //   const stageNameRef = useRef(null);
// // //   const [key, setKey] = useState(0);

// // //   const handleStageNameFocus = () => {
// // //     setPreviousStageName(stageName);
// // //     if (isFirstInteraction) {
// // //       setShowStageNameDialog(true);
// // //       console.log("handleStageNameFocus");
// // //     }
// // //   };

// // //   const handleStageNameChange = (e) => {
// // //     if (isEditing) {
// // //       const newStageName = e.target.value;
// // //       setStageName(newStageName);
// // //       validateStageName(newStageName);
// // //     }
// // //   };

// // //   const handleStageNameDialogCancel = () => {
// // //     setShowStageNameDialog(false);
// // //     setStageName(tempStageName);
// // //     setIsEditing(false);
// // //   };

// // //   const handleStageNameDialogConfirm = () => {
// // //     setShowStageNameDialog(false);
// // //     setIsEditing(true);
// // //     setTimeout(() => {
// // //       if (stageNameRef.current) {
// // //         stageNameRef.current.focus();
// // //       }
// // //     }, 100);
// // //   };

// // //   const handleStageNameBlur = () => {
// // //     if (isEditing) {
// // //       setIsEditing(false);
// // //     }
// // //   };

// // //   const handleCoverPageClick = () => {
// // //     coverPageInputRef.current.click();
// // //   };

// // //   const getInitials = (name) => {
// // //     if (!name) return "";
// // //     const names = name.split(" ");
// // //     if (names.length > 1) {
// // //       return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
// // //     }
// // //     return names[0][0].toUpperCase();
// // //   };

// // //   const menuOpen = Boolean(anchorEl);

// // //   const handleEditIconClick = (event) => {
// // //     setAnchorEl(event.currentTarget);
// // //   };

// // //   const handleClose = () => {
// // //     setAnchorEl(null);
// // //   };

// // //   const handleRemoveProfileImage = async () => {
// // //     try {
// // //       const res = await fetch(
// // //         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/clearProfilePhoto",
// // //         {
// // //           method: "POST",
// // //           headers: { "Content-Type": "application/json" },
// // //           body: JSON.stringify({ user_id })
// // //         }
// // //       );
// // //       if (!res.ok) throw new Error("Remove failed");
// // //       setProfileImage(null);
// // //       localStorage.removeItem("ProfilePhotoUrl");
// // //       window.location.reload();
// // //     } catch (err) {
// // //       console.error("Error removing image", err);
// // //     }
// // //   };

// // //   const handleCameraCapture = async () => {
// // //     try {
// // //       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
// // //       setStream(stream);
// // //       setOpenCameraDialog(true);
// // //       handleClose(); // Close the menu
// // //     } catch (error) {
// // //       alert("Camera not available or permission denied.");
// // //     }
// // //   };

// // //   const handleCapturePhoto = () => {
// // //     const video = videoRef.current;
// // //     const canvas = canvasRef.current;
// // //     if (video && canvas) {
// // //       canvas.width = video.videoWidth;
// // //       canvas.height = video.videoHeight;
// // //       const ctx = canvas.getContext("2d");
// // //       ctx.drawImage(video, 0, 0);
// // //       canvas.toBlob((blob) => {
// // //         if (blob) {
// // //           const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
// // //           handleImageUpload(file);
// // //           handleCloseCameraDialog();
// // //         }
// // //       }, "image/jpeg");
// // //     }
// // //   };

// // //   const handleCloseCameraDialog = () => {
// // //     if (stream) {
// // //       stream.getTracks().forEach((track) => track.stop());
// // //     }
// // //     setStream(null);
// // //     setOpenCameraDialog(false);
// // //   };

// // //   const handleCoverPageUpload = async (file) => {
// // //     try {
// // //       if (!file) {
// // //         throw new Error("No file selected");
// // //       }

// // //       if (!file.type.startsWith("image/")) {
// // //         throw new Error("Please select an image file");
// // //       }

// // //       const updatedTimestamp = formatTimestamp();
// // //       const fileName = `CoverPage#${updatedTimestamp}`;

// // //       const presignedUrlResponse = await fetch(
// // //         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/generate-presigned-url/coverPage",
// // //         {
// // //           method: "POST",
// // //           headers: {
// // //             "Content-Type": "application/json",
// // //           },
// // //           body: JSON.stringify({
// // //             user_id: user_id,
// // //             fileName: fileName,
// // //           }),
// // //         }
// // //       );

// // //       if (!presignedUrlResponse.ok) {
// // //         throw new Error("Failed to generate presigned URL for cover page");
// // //       }

// // //       const presignedData = await presignedUrlResponse.json();

// // //       if (!presignedData.url) {
// // //         throw new Error("No presigned URL received for cover page");
// // //       }

// // //       const uploadResponse = await uploadImageToSignedUrl(
// // //         presignedData.url,
// // //         file
// // //       );

// // //       if (!uploadResponse.ok) {
// // //         throw new Error("Failed to upload cover page to S3");
// // //       }

// // //       const updateUrlResponse = await fetch(
// // //         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/coverPageUrl",
// // //         {
// // //           method: "POST",
// // //           headers: {
// // //             "Content-Type": "application/json",
// // //           },
// // //           body: JSON.stringify({
// // //             user_id: user_id,
// // //             fileName: fileName,
// // //             updatedTimestamp: updatedTimestamp,
// // //           }),
// // //         }
// // //       );

// // //       if (!updateUrlResponse.ok) {
// // //         throw new Error("Failed to update cover page URL");
// // //       }

// // //       const updatedData = await updateUrlResponse.json();

// // //       if (updatedData.coverPageUrl) {
// // //         setCoverPage(updatedData.coverPageUrl);
// // //         localStorage.setItem("CoverPageUrl", updatedData.coverPageUrl);
// // //       }

// // //       if (coverPageInputRef.current) {
// // //         coverPageInputRef.current.value = "";
// // //       }

// // //       window.location.reload();
// // //     } catch (error) {
// // //       console.error("Error uploading cover page:", error);
// // //       alert(error.message || "Failed to upload cover page. Please try again.");
// // //     }
// // //   };

// // //   const [coverAnchorEl, setCoverAnchorEl] = useState(null);
// // //   const coverMenuOpen = Boolean(coverAnchorEl);

// // //   const handleCoverEditIconClick = (event) => {
// // //     event.stopPropagation();
// // //     if (!coverAnchorEl) {
// // //       setCoverAnchorEl(event.currentTarget);
// // //     }
// // //   };

// // //   const handleCoverMenuClose = () => {
// // //     setCoverAnchorEl(null);
// // //   };

// // //   const coverFileInputRef = useRef(null);

// // //   const handleRemoveCoverImage = async () => {
// // //     try {
// // //       const res = await fetch(
// // //         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/clearCoverPage",
// // //         {
// // //           method: "POST",
// // //           headers: { "Content-Type": "application/json" },
// // //           body: JSON.stringify({ user_id })
// // //         }
// // //       );
// // //       if (!res.ok) throw new Error("Remove failed");
// // //       setCoverPage(null);
// // //       localStorage.removeItem("CoverPageUrl");
// // //       window.location.reload();
// // //     } catch (err) {
// // //       console.error("Error removing cover image", err);
// // //     }
// // //   };

// // //   const handleCoverCameraCapture = async () => {
// // //     try {
// // //       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
// // //       setStream(stream);
// // //       setOpenCameraDialog(true);
// // //       handleCoverMenuClose();
// // //     } catch (error) {
// // //       alert("Camera not available or permission denied.");
// // //     }
// // //   };

// // //   const handleCoverCapturePhoto = () => {
// // //     const video = videoRef.current;
// // //     const canvas = canvasRef.current;
// // //     if (video && canvas) {
// // //       canvas.width = video.videoWidth;
// // //       canvas.height = video.videoHeight;
// // //       const ctx = canvas.getContext("2d");
// // //       ctx.drawImage(video, 0, 0);
// // //       canvas.toBlob((blob) => {
// // //         if (blob) {
// // //           const file = new File([blob], "camera-cover.jpg", { type: "image/jpeg" });
// // //           handleCoverPageUpload(file);
// // //           handleCloseCameraDialog();
// // //         }
// // //       }, "image/jpeg");
// // //     }
// // //   };

// // //   return (
// // //     <Box display="flex">
// // //       <SideBar />
// // //       <Box className="edit">
// // //         <Box className="edit__banner">
// // //           <img
// // //             src={coverPage || bannerImage}
// // //             alt="Profile Banner"
// // //             className="edit__banner-image"
// // //           />
// // //         </Box>
// // //         {localStorage.getItem("Category") !== "Listener" && (
// // //           <Box
// // //             className="editIconContainer"
// // //             sx={{
// // //               backgroundColor: "#2644D9",
// // //               marginRight: sidebarMargin,
// // //               transition: "all 0.4s ease-in-out",
// // //             }}
// // //             onClick={handleCoverEditIconClick}
// // //             style={{ cursor: "pointer" }}
// // //           >
// // //             <img src={Edit} alt="Edit" className="editIcon" />
// // //             <input
// // //               type="file"
// // //               ref={coverPageInputRef}
// // //               accept="image/*"
// // //               onChange={(event) => {
// // //                 const file = event.target.files[0];
// // //                 if (file) {
// // //                   handleCoverPageUpload(file);
// // //                 }
// // //               }}
// // //               style={{ display: "none" }}
// // //             />
// // //             <Menu
// // //               anchorEl={coverAnchorEl}
// // //               open={coverMenuOpen}
// // //               onClose={handleCoverMenuClose}
// // //               disableScrollLock
// // //             >
// // //               <MenuItem
// // //                 onClick={() => {
// // //                   handleCoverMenuClose();
// // //                   coverFileInputRef.current.click();
// // //                 }}
// // //               >
// // //                 Choose from Gallery
// // //               </MenuItem>
// // //               <MenuItem
// // //                 onClick={() => {
// // //                   handleCoverCameraCapture();
// // //                 }}
// // //               >
// // //                 Capture from Camera
// // //               </MenuItem>
// // //               <MenuItem
// // //                 onClick={() => {
// // //                   handleCoverMenuClose();
// // //                   handleRemoveCoverImage();
// // //                 }}
// // //               >
// // //                 Remove Cover Image
// // //               </MenuItem>
// // //             </Menu>
// // //           </Box>
// // //         )}

// // //         <Box className="edit__info">
// // //           <Box className="edit__avatar-container">
// // //             <Avatar
// // //               src={profileImage}
// // //               alt="Profile"
// // //               className="edit__avatar"
// // //               sx={{ backgroundColor: profileImage ? "transparent" : "#222", fontSize: "48px" }}
// // //             >
// // //               {!profileImage && getInitials(savedDisplayName)}
// // //             </Avatar>
// // //             <Box
// // //               onClick={handleEditIconClick}
// // //               style={{ position: "absolute", bottom: 0, right: 20, cursor: "pointer" }}
// // //             >
// // //               <img src={EditBg} alt="EditBg" style={{ width: 36, height: 36 }} />
// // //               <img src={Edit} alt="Edit" style={{ position: "absolute", top: 10, left: 10, width: 16 }} />
// // //             </Box>
// // //             <input
// // //               type="file"
// // //               ref={fileInputRef}
// // //               accept="image/*"
// // //               style={{ display: "none" }}
// // //               onChange={(e) => {
// // //                 const file = e.target.files[0];
// // //                 if (file) handleImageUpload(file);
// // //               }}
// // //             />
// // //             <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleClose}>
// // //               <MenuItem
// // //                 onClick={() => {
// // //                   handleClose();
// // //                   fileInputRef.current.click();
// // //                 }}
// // //               >
// // //                 Choose from Gallery
// // //               </MenuItem>
// // //               <MenuItem
// // //                 onClick={() => {
// // //                   handleCameraCapture();
// // //                 }}
// // //               >
// // //                 Capture from Camera
// // //               </MenuItem>
// // //               <MenuItem
// // //                 onClick={() => {
// // //                   handleClose();
// // //                   handleRemoveProfileImage();
// // //                 }}
// // //               >
// // //                 Remove Profile Image
// // //               </MenuItem>
// // //             </Menu>
// // //           </Box>

// // //           <Box className="edit__content">
// // //             <Typography
// // //               variant="h4"
// // //               className="edit__title"
// // //               style={{
// // //                 textDecoration: "underline",
// // //                 textDecorationColor: "white",
// // //                 textUnderlineOffset: "5px",
// // //                 textDecorationThickness: "2px",
// // //               }}
// // //             >
// // //               Edit Profile
// // //             </Typography>

// // //             <Typography variant="h5" className="edit__subtitle">
// // //               Update Details:
// // //             </Typography>

// // //             <Box className="edit__field-container">
// // //               <Typography variant="h6" className="edit__field-label">
// // //                 Username
// // //               </Typography>
// // //               <TextField
// // //                 variant="filled"
// // //                 required
// // //                 name="name"
// // //                 value={fullName}
// // //                 onChange={(e) => {
// // //                   setFullName(e.target.value);
// // //                   validateFullName(e.target.value);
// // //                 }}
// // //                 error={!!errors.fullName}
// // //                 className="edit__field"
// // //                 sx={{
// // //                   "& .MuiFilledInput-input": {
// // //                     padding: "15px",
// // //                   },
// // //                   width: "499px !important",
// // //                   maxWidth: "499px !important",
// // //                 }}
// // //               />
// // //               {errors.fullName && (
// // //                 <Typography
// // //                   variant="body2"
// // //                   sx={{
// // //                     color: "red !important",
// // //                     textAlign: "left",
// // //                     width: "100%",
// // //                   }}
// // //                 >
// // //                   {errors.fullName}
// // //                 </Typography>
// // //               )}
// // //             </Box>
// // //             {showStageName && (
// // //               <Box className="edit__field-container">
// // //                 <Typography variant="h6" className="edit__field-label">
// // //                   Stage name
// // //                 </Typography>

// // //                 <TextField
// // //                   inputRef={stageNameRef}
// // //                   variant="filled"
// // //                   required
// // //                   name="stageName"
// // //                   fullWidth
// // //                   value={stageName}
// // //                   onChange={handleStageNameChange}
// // //                   onClick={handleStageNameClick}
// // //                   onBlur={handleStageNameBlur}
// // //                   InputProps={{
// // //                     readOnly: !isEditing,
// // //                   }}
// // //                   error={!!errors.stageName}
// // //                   className="edit__field"
// // //                   sx={{
// // //                     "& .MuiFilledInput-root": {
// // //                       borderRadius: "10px !important",
// // //                     },
// // //                     "& .MuiFilledInput-input": {
// // //                       padding: "15px",
// // //                     },
// // //                     width: "499px !important",
// // //                     maxWidth: "499px !important",
// // //                   }}
// // //                 />

// // //                 <Dialog
// // //                   open={showStageNameDialog}
// // //                   onClose={handleStageNameDialogCancel}
// // //                   sx={{
// // //                     "& .MuiDialog-paper": {
// // //                       background: "#1C1B46",
// // //                       borderRadius: "16px",
// // //                       maxWidth: "300px",
// // //                       width: "350px !important",
// // //                       height: "180px !important",
// // //                       margin: "20px",
// // //                       padding: "24px",
// // //                     },
// // //                     "& .MuiBackdrop-root": {
// // //                       backgroundColor: "rgba(0, 0, 0, 0.75)",
// // //                     },
// // //                   }}
// // //                 >
// // //                   <Box
// // //                     sx={{
// // //                       display: "flex",
// // //                       flexDirection: "column",
// // //                       alignItems: "center",
// // //                       textAlign: "center",
// // //                     }}
// // //                   >
// // //                     <Typography
// // //                       sx={{
// // //                         color: "white",
// // //                         fontSize: "18px !important",
// // //                         fontWeight: 600,
// // //                         marginBottom: "8px",
// // //                       }}
// // //                     >
// // //                       Warning
// // //                     </Typography>
// // //                     <Typography
// // //                       sx={{
// // //                         color: "white",
// // //                         fontSize: "16px",
// // //                         marginTop: "16px !important",
// // //                       }}
// // //                     >
// // //                       Your identity with the audience will be changed.
// // //                     </Typography>
// // //                     <Box
// // //                       sx={{
// // //                         display: "flex",
// // //                         gap: "32px",
// // //                         justifyContent: "center",
// // //                       }}
// // //                     >
// // //                       <Button
// // //                         onClick={handleStageNameDialogCancel}
// // //                         sx={{
// // //                           color: "white",
// // //                           fontSize: "16px",
// // //                           textTransform: "none",
// // //                           marginTop: "30px !important",
// // //                           padding: "8px 16px",
// // //                           "&:hover": {
// // //                             background: "transparent",
// // //                           },
// // //                         }}
// // //                       >
// // //                         Cancel
// // //                       </Button>
// // //                       <Button
// // //                         onClick={handleStageNameDialogConfirm}
// // //                         sx={{
// // //                           color: "white",
// // //                           fontSize: "16px",
// // //                           textTransform: "none",
// // //                           padding: "8px 16px",
// // //                           marginTop: "30px !important",
// // //                           "&:hover": {
// // //                             background: "transparent",
// // //                           },
// // //                         }}
// // //                       >
// // //                         Yes
// // //                       </Button>
// // //                     </Box>
// // //                   </Box>
// // //                 </Dialog>
// // //               </Box>
// // //             )}

// // //             {localStorage.getItem("Category") !== "Listener" && (
// // //               <Box className="edit__field-container">
// // //                 <Typography variant="h6" className="edit__field-label">
// // //                   Bio
// // //                 </Typography>

// // //                 <TextField
// // //                   variant="filled"
// // //                   required
// // //                   name="bio"
// // //                   value={bio}
// // //                   multiline
// // //                   rows={2}
// // //                   onChange={handleBioChange}
// // //                   error={!!errors.bio}
// // //                   helperText={errors.bio}
// // //                   fullWidth
// // //                   className="edit__field edit__field_height"
// // //                   sx={{
// // //                     width: "499px !important",
// // //                     maxWidth: "499px !important",
// // //                     '& .MuiInputBase-root': {
// // //                       height: '70px !important',
// // //                       minHeight: '70px !important'
// // //                     }
// // //                   }}
// // //                 />
// // //                 <Typography
// // //                   variant="caption"
// // //                   color={getWordCount(bio) >= 300 ? "error" : "textSecondary"}
// // //                   sx={{
// // //                     mb: 1,
// // //                     display: "flex",
// // //                     justifyContent: "flex-end",
// // //                     mt: 1,
// // //                     marginRight: "35px !important",
// // //                     color: "white",
// // //                   }}
// // //                 >
// // //                   {getWordCount(bio)}/300 characters
// // //                   {getWordCount(bio) >= 300 && (
// // //                     <span style={{ marginLeft: "8px" }}>
// // //                       (Maximum characters limit reached)
// // //                     </span>
// // //                   )}
// // //                 </Typography>
// // //               </Box>
// // //             )}

// // //             <Box alignContent={"center"}>
// // //               <Button
// // //                 variant="contained"
// // //                 onClick={handleUpdate}
// // //                 className="edit__update-button"
// // //                 disabled={!hasChanges || !!errors.fullName || (showStageName && !!errors.stageName) || !!errors.bio}
// // //                 sx={{
// // //                   margin: "0 auto",
// // //                   marginLeft: "135px",
// // //                   display: "block",
// // //                   backgroundColor: hasChanges && !errors.fullName && !(showStageName && errors.stageName) && !errors.bio ? "#1976d2 !important" : "gray !important",
// // //                   "&:hover": {
// // //                     backgroundColor: hasChanges && !errors.fullName && !(showStageName && errors.stageName) && !errors.bio ? "#1565c0 !important" : "gray !important",
// // //                   },
// // //                 }}
// // //               >
// // //                 Update
// // //               </Button>
// // //               <Dialog
// // //                 open={openSuccessDialog}
// // //                 onClose={() => setOpenSuccessDialog(false)}
// // //                 sx={{
// // //                   "& .MuiDialog-paper": {
// // //                     background: "#0F0B2C",
// // //                     borderRadius: "16px",
// // //                     maxWidth: "478px",
// // //                     width: "478px",
// // //                     height: "316px",
// // //                     margin: "20px",
// // //                     marginTop: "-20px !important",
// // //                     position: "relative",
// // //                     padding: "40px 20px",
// // //                   },
// // //                   "& .MuiBackdrop-root": {
// // //                     backgroundColor: "rgba(0, 0, 0, 0.8)",
// // //                   },
// // //                 }}
// // //               >
// // //                 <IconButton
// // //                   onClick={() => setOpenSuccessDialog(false)}
// // //                   sx={{
// // //                     position: "absolute",
// // //                     right: 8,
// // //                     top: 8,
// // //                     color: "white",
// // //                   }}
// // //                 >
// // //                   <img
// // //                     src={cross}
// // //                     alt="Close"
// // //                     style={{
// // //                       height: "35px",
// // //                       width: "33px",
// // //                     }}
// // //                   />
// // //                 </IconButton>
// // //                 <Box
// // //                   sx={{
// // //                     display: "flex",
// // //                     flexDirection: "column",
// // //                     alignItems: "center",
// // //                     textAlign: "center",
// // //                     padding: "20px",
// // //                     marginTop: "30px",
// // //                   }}
// // //                 >
// // //                   <Typography
// // //                     sx={{
// // //                       color: "white",
// // //                       fontSize: "24px !important",
// // //                       fontWeight: 600,
// // //                       marginBottom: "20px",
// // //                     }}
// // //                   >
// // //                     Profile updated successfully
// // //                   </Typography>
// // //                   <Box
// // //                     sx={{
// // //                       width: "49.41px",
// // //                       height: "50.86px",
// // //                       borderRadius: "50%",
// // //                       backgroundColor: "#2782EE",
// // //                       display: "flex",
// // //                       alignItems: "center",
// // //                       justifyContent: "center",
// // //                       cursor: "pointer",
// // //                     }}
// // //                     onClick={() => setOpenSuccessDialog(false)}
// // //                   >
// // //                     <CheckIcon sx={{ color: "white", fontSize: "32px" }} />
// // //                   </Box>
// // //                 </Box>
// // //               </Dialog>

// // //               {/* Camera Preview Dialog */}
// // //               <Dialog
// // //                 open={openCameraDialog}
// // //                 onClose={handleCloseCameraDialog}
// // //                 sx={{
// // //                   "& .MuiDialog-paper": {
// // //                     background: "#1C1B46",
// // //                     borderRadius: "16px",
// // //                     maxWidth: "600px",
// // //                     width: "100%",
// // //                     padding: "20px",
// // //                   },
// // //                   "& .MuiBackdrop-root": {
// // //                     backgroundColor: "rgba(0, 0, 0, 0.75)",
// // //                   },
// // //                 }}
// // //               >
// // //                 <DialogContent>
// // //                   <Typography
// // //                     sx={{
// // //                       color: "white",
// // //                       fontSize: "18px",
// // //                       fontWeight: 600,
// // //                       mb: 2,
// // //                     }}
// // //                   >
// // //                     Camera Preview
// // //                   </Typography>
// // //                   <video
// // //                     ref={videoRef}
// // //                     autoPlay
// // //                     style={{ width: "100%", borderRadius: "8px" }}
// // //                   />
// // //                   <canvas ref={canvasRef} style={{ display: "none" }} />
// // //                 </DialogContent>
// // //                 <DialogActions>
// // //                   <Button
// // //                     onClick={handleCloseCameraDialog}
// // //                     sx={{
// // //                       color: "white",
// // //                       textTransform: "none",
// // //                       "&:hover": { background: "transparent" },
// // //                     }}
// // //                   >
// // //                     Cancel
// // //                   </Button>
// // //                   <Button
// // //                     onClick={handleCapturePhoto}
// // //                     sx={{
// // //                       color: "white",
// // //                       textTransform: "none",
// // //                       "&:hover": { background: "transparent" },
// // //                     }}
// // //                   >
// // //                     Capture
// // //                   </Button>
// // //                 </DialogActions>
// // //               </Dialog>
// // //             </Box>
// // //           </Box>
// // //         </Box>
// // //       </Box>
// // //     </Box>
// // //   );
// // // };

// // // export default EditProfile;

// // import React, { useRef, useState, useEffect } from "react";
// // import {
// //   Box,
// //   Typography,
// //   Avatar,
// //   IconButton,
// //   TextField,
// //   Button,
// //   Menu,
// //   MenuItem,
// //   Alert,
// //   Dialog,
// //   DialogContent,
// //   DialogActions,
// // } from "@mui/material";
// // import SideBar from "./SideBar";
// // import Edit from "./assets/VectorEdit.png";
// // import EditBg from "./assets/VectorEditBg_new.png";
// // import { useNavigate } from "react-router-dom";
// // import "./EditProfile.css";
// // import { Check as CheckIcon } from "lucide-react";
// // import cross from "./assets/Cross.png";
// // import bannerImage1 from "./assets/RectangleBannerImage.png";

// // const EditProfile = () => {
// //   const [coverPage, setCoverPage] = useState(null);
// //   const bannerImage = bannerImage1;
// //   const [profileImage, setProfileImage] = useState(null);
// //   const [anchorEl, setAnchorEl] = useState(null);
// //   const user_id = localStorage.getItem("user_id");
// //   const StageName = localStorage.getItem("StageName");
// //   const FullName = localStorage.getItem("FullName");
// //   const navigate = useNavigate();
// //   const fileInputRef = useRef(null);
// //   const coverPageInputRef = useRef(null);
// //   const [ImageFile, setImageFile] = useState(null);
// //   const [fullName, setFullName] = useState("");
// //   const [stageName, setStageName] = useState("");
// //   const [bio, setBio] = useState("");
// //   const [errors, setErrors] = useState({
// //     fullName: "",
// //     stageName: "",
// //     bio: "",
// //   });

// //   const [isEditing, setIsEditing] = useState(false);
// //   const [tempStageName, setTempStageName] = useState("");
// //   const [showStageNameWarning, setShowStageNameWarning] = useState(false);
// //   const [showStageName, setShowStageName] = useState(false);
// //   const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
// //   const [initialFullName, setInitialFullName] = useState("");
// //   const [initialStageName, setInitialStageName] = useState("");
// //   const [initialBio, setInitialBio] = useState("");
// //   const [hasChanges, setHasChanges] = useState(false);

// //   const [sidebarMargin, setSidebarMargin] = useState(
// //     localStorage.getItem("sidebarCollapsed") === "true"
// //       ? "-80px !important"
// //       : "99px !important"
// //   );

// //   // State for camera preview dialog
// //   const [openCameraDialog, setOpenCameraDialog] = useState(false);
// //   const videoRef = useRef(null);
// //   const canvasRef = useRef(null);
// //   const [stream, setStream] = useState(null);

// //   useEffect(() => {
// //     setSidebarMargin(
// //       localStorage.getItem("sidebarCollapsed") === "true"
// //         ? "-80px !important"
// //         : "99px !important"
// //     );

// //     const handleStorageChange = () => {
// //       setSidebarMargin(
// //         localStorage.getItem("sidebarCollapsed") === "true"
// //           ? "-80px !important"
// //           : "99px !important"
// //       );
// //     };

// //     const handleSidebarChange = (event) => {
// //       if (event.detail === "collapsed") {
// //         setSidebarMargin("-80px !important");
// //       } else {
// //         setSidebarMargin("99px !important");
// //       }
// //     };

// //     window.addEventListener("storage", handleStorageChange);
// //     window.addEventListener("sidebarStateChange", handleSidebarChange);

// //     return () => {
// //       window.removeEventListener("storage", handleStorageChange);
// //       window.removeEventListener("sidebarStateChange", handleSidebarChange);
// //     };
// //   }, []);

// //   useEffect(() => {
// //     const fetchProfilePhoto = async () => {
// //       try {
// //         const response = await fetch(
// //           `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getprofilephoto?user_id=${user_id}`
// //         );
// //         const data = await response.json();
// //         setProfileImage(data.profilePhotoUrl?.S || null);
// //       } catch (err) {
// //         console.error("Error loading profile photo", err);
// //       }
// //     };
// //     fetchProfilePhoto();
// //   }, [user_id]);

// //   useEffect(() => {
// //     const fetchCoverPage = async () => {
// //       try {
// //         const response = await fetch(
// //           `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getcoverpage?user_id=${user_id}`,
// //           {
// //             method: "GET",
// //             headers: {
// //               "Content-Type": "application/json",
// //             },
// //           }
// //         );

// //         if (!response.ok) {
// //           throw new Error("Failed to fetch profile photo");
// //         }

// //         const data = await response.json();
// //         setCoverPage(data.coverPageUrl.S);
// //         localStorage.setItem("CoverPageUrl", data.coverPageUrl.S);
// //       } catch (error) {
// //         console.error("Error fetching CoverPage:", error);
// //       }
// //     };

// //     fetchCoverPage();
// //   }, [user_id]);

// //   const [savedDisplayName, setSavedDisplayName] = useState("");

// //   useEffect(() => {
// //     const fetchProfileDetails = async () => {
// //       try {
// //         const response = await fetch(
// //           `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getprofiledetails?user_id=${user_id}`,
// //           {
// //             method: "GET",
// //             headers: {
// //               "Content-Type": "application/json",
// //             },
// //           }
// //         );

// //         if (!response.ok) {
// //           throw new Error("Failed to fetch profile details");
// //         }

// //         const data = await response.json();
// //         setFullName(data.FullName.S || "");
// //         setInitialFullName(data.FullName.S || "");
// //         const fetchedStageName = data.StageName.S || "";
// //         setStageName(fetchedStageName);
// //         setInitialStageName(fetchedStageName);
// //         setBio(data.bio.S || "");
// //         setInitialBio(data.bio.S || "");
// //         setShowStageName(!!fetchedStageName);
// //         setSavedDisplayName(data.StageName.S || data.FullName.S || "");
// //       } catch (error) {
// //         console.error("Error fetching profile details:", error);
// //       }
// //     };

// //     fetchProfileDetails();
// //   }, [user_id]);

// //   useEffect(() => {
// //     const hasFieldChanges =
// //       fullName !== initialFullName ||
// //       (showStageName && stageName !== initialStageName) ||
// //       bio !== initialBio;
// //     setHasChanges(hasFieldChanges);
// //   }, [fullName, stageName, bio, showStageName, initialFullName, initialStageName, initialBio]);

// //   // Set up video stream for camera preview
// //   useEffect(() => {
// //     if (openCameraDialog && stream && videoRef.current) {
// //       console.log("Assigning stream to video element");
// //       videoRef.current.srcObject = stream;
// //       videoRef.current.play().catch((err) => {
// //         console.error("Error playing video:", err);
// //       });
// //     }
// //     return () => {
// //       if (stream) {
// //         console.log("Cleaning up stream");
// //         stream.getTracks().forEach((track) => track.stop());
// //       }
// //     };
// //   }, [openCameraDialog, stream]);

// //   const formatTimestamp = () => {
// //     const now = new Date();
// //     const year = now.getFullYear();
// //     const month = String(now.getMonth() + 1).padStart(2, "0");
// //     const day = String(now.getDate()).padStart(2, "0");
// //     const hours = String(now.getHours()).padStart(2, "0");
// //     const minutes = String(now.getMinutes()).padStart(2, "0");
// //     const seconds = String(now.getSeconds()).padStart(2, "0");

// //     return `${year}${month}${day}_${hours}${minutes}${seconds}`;
// //   };

// //   const validateFullName = (name) => {
// //     if (!name.trim()) {
// //       setErrors((prev) => ({
// //         ...prev,
// //         fullName: "Username cannot be empty",
// //       }));
// //       return false;
// //     }
// //     setErrors((prev) => ({
// //       ...prev,
// //       fullName: "",
// //     }));
// //     return true;
// //   };

// //   const validateStageName = (name) => {
// //     if (showStageName && !name.trim()) {
// //       setErrors((prev) => ({
// //         ...prev,
// //         stageName: "Stage name cannot be empty",
// //       }));
// //       return false;
// //     }
// //     setErrors((prev) => ({
// //       ...prev,
// //       stageName: "",
// //     }));
// //     return true;
// //   };

// //   const getWordCount = (text) => {
// //     return text.length;
// //   };

// //   const handleBioChange = (e) => {
// //     const newBio = e.target.value;
// //     const wordCount = getWordCount(newBio);

// //     if (wordCount <= 300 || newBio.length < bio.length) {
// //       setBio(newBio);
// //       validateBio(newBio);
// //     }
// //   };

// //   const handleStageNameClick = () => {
// //     if (!isEditing) {
// //       setTempStageName(stageName);
// //       setShowStageNameDialog(true);
// //     }
// //   };

// //   const validateBio = (bioText) => {
// //     const wordCount = getWordCount(bioText);
// //     if (wordCount > 300) {
// //       setErrors((prev) => ({
// //         ...prev,
// //         bio: "Bio cannot exceed 300 characters",
// //       }));
// //       return false;
// //     }
// //     setErrors((prev) => ({
// //       ...prev,
// //       bio: "",
// //     }));
// //     return true;
// //   };

// //   const capitalizeWords = (str) => {
// //     return str
// //       .toLowerCase()
// //       .split(" ")
// //       .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
// //       .join(" ")
// //       .trim();
// //   };

// //   const handleUpdate = async () => {
// //     const isFullNameValid = validateFullName(fullName);
// //     const isStageNameValid = showStageName ? validateStageName(stageName) : true;
// //     const isBioValid = validateBio(bio);

// //     if (!isFullNameValid || !isStageNameValid || !isBioValid) {
// //       return;
// //     }

// //     const hasChanges =
// //       fullName !== (FullName || "") ||
// //       (showStageName && stageName !== (StageName || "")) ||
// //       bio !== (localStorage.getItem("bio") || "");

// //     if (!hasChanges) {
// //       alert("Please update your profile");
// //       return;
// //     }

// //     try {
// //       const payload = {
// //         FullName: capitalizeWords(fullName),
// //         bio: bio,
// //         user_id: user_id,
// //         StageName: showStageName ? capitalizeWords(stageName) : undefined,
// //         updatedTimestamp: formatTimestamp(),
// //       };

// //       const response = await fetch(
// //         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/editprofile",
// //         {
// //           method: "POST",
// //           headers: {
// //             "Content-Type": "application/json",
// //           },
// //           body: JSON.stringify(payload),
// //         }
// //       );

// //       if (!response.ok) {
// //         throw new Error("Failed to update profile details");
// //       }

// //       localStorage.setItem("FullName", capitalizeWords(fullName));
// //       if (showStageName) {
// //         localStorage.setItem("StageName", capitalizeWords(stageName));
// //       }
// //       localStorage.setItem("bio", bio);

// //       setSavedDisplayName(
// //         showStageName ? capitalizeWords(stageName) : capitalizeWords(fullName)
// //       );
// //       setInitialFullName(capitalizeWords(fullName));
// //       setInitialStageName(showStageName ? capitalizeWords(stageName) : "");
// //       setInitialBio(bio);
// //       setOpenSuccessDialog(true);
// //       setTimeout(() => {
// //         setOpenSuccessDialog(false);
// //         setFullName(capitalizeWords(fullName));
// //         setStageName(showStageName ? capitalizeWords(stageName) : "");
// //         setBio(bio);
// //       }, 3000);
// //     } catch (error) {
// //       console.error("Error updating profile:", error);
// //       alert("Failed to update profile. Please try again.");
// //     }
// //   };

// //   const handleImageClick = () => {
// //     fileInputRef.current.click();
// //   };

// //   const uploadImageToSignedUrl = async (url, file) => {
// //     try {
// //       const response = await fetch(url, {
// //         method: "PUT",
// //         headers: {
// //           "Content-Type": file.type,
// //         },
// //         body: file,
// //       });

// //       if (!response.ok) {
// //         throw new Error(`Upload failed with status: ${response.status}`);
// //       }

// //       return response;
// //     } catch (error) {
// //       console.error("Error in uploadImageToSignedUrl:", error);
// //       throw error;
// //     }
// //   };

// //   const handleImageUpload = async (file) => {
// //     try {
// //       if (!file) {
// //         throw new Error("No file selected");
// //       }

// //       if (!file.type.startsWith("image/")) {
// //         throw new Error("Please select an image file");
// //       }

// //       setImageFile(file);
// //       const updatedTimestamp = formatTimestamp();
// //       const fileName = `profile#${updatedTimestamp}`;

// //       const presignedUrlResponse = await fetch(
// //         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/generate-presigned-url/profilePhoto",
// //         {
// //           method: "POST",
// //           headers: {
// //             "Content-Type": "application/json",
// //           },
// //           body: JSON.stringify({
// //             user_id: user_id,
// //             fileName: fileName,
// //           }),
// //         }
// //       );

// //       if (!presignedUrlResponse.ok) {
// //         throw new Error("Failed to generate presigned URL");
// //       }

// //       const presignedData = await presignedUrlResponse.json();

// //       if (!presignedData.url) {
// //         throw new Error("No presigned URL received");
// //       }

// //       const uploadResponse = await uploadImageToSignedUrl(
// //         presignedData.url,
// //         file
// //       );

// //       if (!uploadResponse.ok) {
// //         throw new Error("Failed to upload image to S3");
// //       }

// //       const updateUrlResponse = await fetch(
// //         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/profilePhotoUrl",
// //         {
// //           method: "POST",
// //           headers: {
// //             "Content-Type": "application/json",
// //           },
// //           body: JSON.stringify({
// //             user_id: user_id,
// //             fileName: fileName,
// //             updatedTimestamp: updatedTimestamp,
// //           }),
// //         }
// //       );

// //       if (!updateUrlResponse.ok) {
// //         throw new Error("Failed to update profile photo URL");
// //       }

// //       const updatedData = await updateUrlResponse.json();
// //       if (updatedData.profilePhotoUrl) {
// //         setProfileImage(updatedData.profilePhotoUrl);
// //       }

// //       if (fileInputRef.current) {
// //         fileInputRef.current.value = "";
// //       }
// //       window.location.reload();
// //     } catch (error) {
// //       console.error("Error uploading image:", error);
// //       alert(error.message || "Failed to upload image. Please try again.");
// //     }
// //   };

// //   const [showStageNameDialog, setShowStageNameDialog] = useState(false);
// //   const [previousStageName, setPreviousStageName] = useState("");
// //   const [isFirstInteraction, setIsFirstInteraction] = useState(true);
// //   const [canEdit, setCanEdit] = useState(true);
// //   const stageNameRef = useRef(null);
// //   const [key, setKey] = useState(0);

// //   const handleStageNameFocus = () => {
// //     setPreviousStageName(stageName);
// //     if (isFirstInteraction) {
// //       setShowStageNameDialog(true);
// //       console.log("handleStageNameFocus");
// //     }
// //   };

// //   const handleStageNameChange = (e) => {
// //     if (isEditing) {
// //       const newStageName = e.target.value;
// //       setStageName(newStageName);
// //       validateStageName(newStageName);
// //     }
// //   };

// //   const handleStageNameDialogCancel = () => {
// //     setShowStageNameDialog(false);
// //     setStageName(tempStageName);
// //     setIsEditing(false);
// //   };

// //   const handleStageNameDialogConfirm = () => {
// //     setShowStageNameDialog(false);
// //     setIsEditing(true);
// //     setTimeout(() => {
// //       if (stageNameRef.current) {
// //         stageNameRef.current.focus();
// //       }
// //     }, 100);
// //   };

// //   const handleStageNameBlur = () => {
// //     if (isEditing) {
// //       setIsEditing(false);
// //     }
// //   };

// //   const handleCoverPageClick = () => {
// //     coverPageInputRef.current.click();
// //   };

// //   const getInitials = (name) => {
// //     if (!name) return "";
// //     const names = name.split(" ");
// //     if (names.length > 1) {
// //       return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
// //     }
// //     return names[0][0].toUpperCase();
// //   };

// //   const menuOpen = Boolean(anchorEl);

// //   const handleEditIconClick = (event) => {
// //     setAnchorEl(event.currentTarget);
// //   };

// //   const handleClose = () => {
// //     setAnchorEl(null);
// //   };

// //   const handleRemoveProfileImage = async () => {
// //     try {
// //       const res = await fetch(
// //         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/clearProfilePhoto",
// //         {
// //           method: "POST",
// //           headers: { "Content-Type": "application/json" },
// //           body: JSON.stringify({ user_id })
// //         }
// //       );
// //       if (!res.ok) throw new Error("Remove failed");
// //       setProfileImage(null);
// //       localStorage.removeItem("ProfilePhotoUrl");
// //       window.location.reload();
// //     } catch (err) {
// //       console.error("Error removing image", err);
// //     }
// //   };

// //   const handleCameraCapture = async () => {
// //     try {
// //       console.log("Requesting camera access");
// //       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
// //       setStream(stream);
// //       setOpenCameraDialog(true);
// //       handleClose();
// //     } catch (error) {
// //       console.error("Camera access error:", error);
// //       alert("Camera not available or permission denied.");
// //     }
// //   };

// //   const handleCapturePhoto = () => {
// //     const video = videoRef.current;
// //     const canvas = canvasRef.current;
// //     if (video && canvas) {
// //       console.log("Capturing photo");
// //       canvas.width = video.videoWidth;
// //       canvas.height = video.videoHeight;
// //       const ctx = canvas.getContext("2d");
// //       ctx.drawImage(video, 0, 0);
// //       canvas.toBlob((blob) => {
// //         if (blob) {
// //           console.log("Photo captured, uploading");
// //           const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
// //           handleImageUpload(file);
// //           handleCloseCameraDialog();
// //         } else {
// //           console.error("Failed to create blob");
// //           alert("Failed to capture photo.");
// //         }
// //       }, "image/jpeg");
// //     } else {
// //       console.error("Video or canvas not available");
// //       alert("Unable to capture photo. Please try again.");
// //     }
// //   };

// //   const handleCloseCameraDialog = () => {
// //     console.log("Closing camera dialog");
// //     setOpenCameraDialog(false);
// //     setStream(null);
// //   };

// //   const handleCoverPageUpload = async (file) => {
// //     try {
// //       if (!file) {
// //         throw new Error("No file selected");
// //       }

// //       if (!file.type.startsWith("image/")) {
// //         throw new Error("Please select an image file");
// //       }

// //       const updatedTimestamp = formatTimestamp();
// //       const fileName = `CoverPage#${updatedTimestamp}`;

// //       const presignedUrlResponse = await fetch(
// //         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/generate-presigned-url/coverPage",
// //         {
// //           method: "POST",
// //           headers: {
// //             "Content-Type": "application/json",
// //           },
// //           body: JSON.stringify({
// //             user_id: user_id,
// //             fileName: fileName,
// //           }),
// //         }
// //       );

// //       if (!presignedUrlResponse.ok) {
// //         throw new Error("Failed to generate presigned URL for cover page");
// //       }

// //       const presignedData = await presignedUrlResponse.json();

// //       if (!presignedData.url) {
// //         throw new Error("No presigned URL received for cover page");
// //       }

// //       const uploadResponse = await uploadImageToSignedUrl(
// //         presignedData.url,
// //         file
// //       );

// //       if (!uploadResponse.ok) {
// //         throw new Error("Failed to upload cover page to S3");
// //       }

// //       const updateUrlResponse = await fetch(
// //         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/coverPageUrl",
// //         {
// //           method: "POST",
// //           headers: {
// //             "Content-Type": "application/json",
// //           },
// //           body: JSON.stringify({
// //             user_id: user_id,
// //             fileName: fileName,
// //             updatedTimestamp: updatedTimestamp,
// //           }),
// //         }
// //       );

// //       if (!updateUrlResponse.ok) {
// //         throw new Error("Failed to update cover page URL");
// //       }

// //       const updatedData = await updateUrlResponse.json();

// //       if (updatedData.coverPageUrl) {
// //         setCoverPage(updatedData.coverPageUrl);
// //         localStorage.setItem("CoverPageUrl", updatedData.coverPageUrl);
// //       }

// //       if (coverPageInputRef.current) {
// //         coverPageInputRef.current.value = "";
// //       }

// //       window.location.reload();
// //     } catch (error) {
// //       console.error("Error uploading cover page:", error);
// //       alert(error.message || "Failed to upload cover page. Please try again.");
// //     }
// //   };

// //   const [coverAnchorEl, setCoverAnchorEl] = useState(null);
// //   const coverMenuOpen = Boolean(coverAnchorEl);

// //   const handleCoverEditIconClick = (event) => {
// //     event.stopPropagation();
// //     if (!coverAnchorEl) {
// //       setCoverAnchorEl(event.currentTarget);
// //     }
// //   };

// //   const handleCoverMenuClose = () => {
// //     setCoverAnchorEl(null);
// //   };

// //   const coverFileInputRef = useRef(null);

// //   const handleRemoveCoverImage = async () => {
// //     try {
// //       const res = await fetch(
// //         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/clearCoverPage",
// //         {
// //           method: "POST",
// //           headers: { "Content-Type": "application/json" },
// //           body: JSON.stringify({ user_id })
// //         }
// //       );
// //       if (!res.ok) throw new Error("Remove failed");
// //       setCoverPage(null);
// //       localStorage.removeItem("CoverPageUrl");
// //       window.location.reload();
// //     } catch (err) {
// //       console.error("Error removing cover image", err);
// //     }
// //   };

// //   const handleCoverCameraCapture = async () => {
// //     try {
// //       console.log("Requesting camera access for cover");
// //       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
// //       setStream(stream);
// //       setOpenCameraDialog(true);
// //       handleCoverMenuClose();
// //     } catch (error) {
// //       console.error("Camera access error for cover:", error);
// //       alert("Camera not available or permission denied.");
// //     }
// //   };

// //   const handleCoverCapturePhoto = () => {
// //     const video = videoRef.current;
// //     const canvas = canvasRef.current;
// //     if (video && canvas) {
// //       console.log("Capturing cover photo");
// //       canvas.width = video.videoWidth;
// //       canvas.height = video.videoHeight;
// //       const ctx = canvas.getContext("2d");
// //       ctx.drawImage(video, 0, 0);
// //       canvas.toBlob((blob) => {
// //         if (blob) {
// //           console.log("Cover photo captured, uploading");
// //           const file = new File([blob], "camera-cover.jpg", { type: "image/jpeg" });
// //           handleCoverPageUpload(file);
// //           handleCloseCameraDialog();
// //         } else {
// //           console.error("Failed to create blob for cover");
// //           alert("Failed to capture photo.");
// //         }
// //       }, "image/jpeg");
// //     } else {
// //       console.error("Video or canvas not available for cover");
// //       alert("Unable to capture photo. Please try again.");
// //     }
// //   };

// //   return (
// //     <Box display="flex">
// //       <SideBar />
// //       <Box className="edit">
// //         <Box className="edit__banner">
// //           <img
// //             src={coverPage || bannerImage}
// //             alt="Profile Banner"
// //             className="edit__banner-image"
// //           />
// //         </Box>
// //         {localStorage.getItem("Category") !== "Listener" && (
// //           <Box
// //             className="editIconContainer"
// //             sx={{
// //               backgroundColor: "#2644D9",
// //               marginRight: sidebarMargin,
// //               transition: "all 0.4s ease-in-out",
// //             }}
// //             onClick={handleCoverEditIconClick}
// //             style={{ cursor: "pointer" }}
// //           >
// //             <img src={Edit} alt="Edit" className="editIcon" />
// //             <input
// //               type="file"
// //               ref={coverPageInputRef}
// //               accept="image/*"
// //               onChange={(event) => {
// //                 const file = event.target.files[0];
// //                 if (file) {
// //                   handleCoverPageUpload(file);
// //                 }
// //               }}
// //               style={{ display: "none" }}
// //             />
// //             <Menu
// //               anchorEl={coverAnchorEl}
// //               open={coverMenuOpen}
// //               onClose={handleCoverMenuClose}
// //               disableScrollLock
// //             >
// //               <MenuItem
// //                 onClick={() => {
// //                   handleCoverMenuClose();
// //                   coverFileInputRef.current.click();
// //                 }}
// //               >
// //                 Choose from Gallery
// //               </MenuItem>
// //               <MenuItem
// //                 onClick={() => {
// //                   handleCoverCameraCapture();
// //                 }}
// //               >
// //                 Capture from Camera
// //               </MenuItem>
// //               <MenuItem
// //                 onClick={() => {
// //                   handleCoverMenuClose();
// //                   handleRemoveCoverImage();
// //                 }}
// //               >
// //                 Remove Cover Image
// //               </MenuItem>
// //             </Menu>
// //           </Box>
// //         )}

// //         <Box className="edit__info">
// //           <Box className="edit__avatar-container">
// //             <Avatar
// //               src={profileImage}
// //               alt="Profile"
// //               className="edit__avatar"
// //               sx={{ backgroundColor: profileImage ? "transparent" : "#222", fontSize: "48px" }}
// //             >
// //               {!profileImage && getInitials(savedDisplayName)}
// //             </Avatar>
// //             <Box
// //               onClick={handleEditIconClick}
// //               style={{ position: "absolute", bottom: 0, right: 20, cursor: "pointer" }}
// //             >
// //               <img src={EditBg} alt="EditBg" style={{ width: 36, height: 36 }} />
// //               <img src={Edit} alt="Edit" style={{ position: "absolute", top: 10, left: 10, width: 16 }} />
// //             </Box>
// //             <input
// //               type="file"
// //               ref={fileInputRef}
// //               accept="image/*"
// //               style={{ display: "none" }}
// //               onChange={(e) => {
// //                 const file = e.target.files[0];
// //                 if (file) handleImageUpload(file);
// //               }}
// //             />
// //             <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleClose}>
// //               <MenuItem
// //                 onClick={() => {
// //                   handleClose();
// //                   fileInputRef.current.click();
// //                 }}
// //               >
// //                 Choose from Gallery
// //               </MenuItem>
// //               <MenuItem
// //                 onClick={() => {
// //                   handleCameraCapture();
// //                 }}
// //               >
// //                 Capture from Camera
// //               </MenuItem>
// //               <MenuItem
// //                 onClick={() => {
// //                   handleClose();
// //                   handleRemoveProfileImage();
// //                 }}
// //               >
// //                 Remove Profile Image
// //               </MenuItem>
// //             </Menu>
// //           </Box>

// //           <Box className="edit__content">
// //             <Typography
// //               variant="h4"
// //               className="edit__title"
// //               style={{
// //                 textDecoration: "underline",
// //                 textDecorationColor: "white",
// //                 textUnderlineOffset: "5px",
// //                 textDecorationThickness: "2px",
// //               }}
// //             >
// //               Edit Profile
// //             </Typography>

// //             <Typography variant="h5" className="edit__subtitle">
// //               Update Details:
// //             </Typography>

// //             <Box className="edit__field-container">
// //               <Typography variant="h6" className="edit__field-label">
// //                 Username
// //               </Typography>
// //               <TextField
// //                 variant="filled"
// //                 required
// //                 name="name"
// //                 value={fullName}
// //                 onChange={(e) => {
// //                   setFullName(e.target.value);
// //                   validateFullName(e.target.value);
// //                 }}
// //                 error={!!errors.fullName}
// //                 className="edit__field"
// //                 sx={{
// //                   "& .MuiFilledInput-input": {
// //                     padding: "15px",
// //                   },
// //                   width: "499px !important",
// //                   maxWidth: "499px !important",
// //                 }}
// //               />
// //               {errors.fullName && (
// //                 <Typography
// //                   variant="body2"
// //                   sx={{
// //                     color: "red !important",
// //                     textAlign: "left",
// //                     width: "100%",
// //                   }}
// //                 >
// //                   {errors.fullName}
// //                 </Typography>
// //               )}
// //             </Box>
// //             {showStageName && (
// //               <Box className="edit__field-container">
// //                 <Typography variant="h6" className="edit__field-label">
// //                   Stage name
// //                 </Typography>

// //                 <TextField
// //                   inputRef={stageNameRef}
// //                   variant="filled"
// //                   required
// //                   name="stageName"
// //                   fullWidth
// //                   value={stageName}
// //                   onChange={handleStageNameChange}
// //                   onClick={handleStageNameClick}
// //                   onBlur={handleStageNameBlur}
// //                   InputProps={{
// //                     readOnly: !isEditing,
// //                   }}
// //                   error={!!errors.stageName}
// //                   className="edit__field"
// //                   sx={{
// //                     "& .MuiFilledInput-root": {
// //                       borderRadius: "10px !important",
// //                     },
// //                     "& .MuiFilledInput-input": {
// //                       padding: "15px",
// //                     },
// //                     width: "499px !important",
// //                     maxWidth: "499px !important",
// //                   }}
// //                 />

// //                 <Dialog
// //                   open={showStageNameDialog}
// //                   onClose={handleStageNameDialogCancel}
// //                   sx={{
// //                     "& .MuiDialog-paper": {
// //                       background: "#1C1B46",
// //                       borderRadius: "16px",
// //                       maxWidth: "300px",
// //                       width: "350px !important",
// //                       height: "180px !important",
// //                       margin: "20px",
// //                       padding: "24px",
// //                     },
// //                     "& .MuiBackdrop-root": {
// //                       backgroundColor: "rgba(0, 0, 0, 0.75)",
// //                     },
// //                   }}
// //                 >
// //                   <Box
// //                     sx={{
// //                       display: "flex",
// //                       flexDirection: "column",
// //                       alignItems: "center",
// //                       textAlign: "center",
// //                     }}
// //                   >
// //                     <Typography
// //                       sx={{
// //                         color: "white",
// //                         fontSize: "18px !important",
// //                         fontWeight: 600,
// //                         marginBottom: "8px",
// //                       }}
// //                     >
// //                       Warning
// //                     </Typography>
// //                     <Typography
// //                       sx={{
// //                         color: "white",
// //                         fontSize: "16px",
// //                         marginTop: "16px !important",
// //                       }}
// //                     >
// //                       Your identity with the audience will be changed.
// //                     </Typography>
// //                     <Box
// //                       sx={{
// //                         display: "flex",
// //                         gap: "32px",
// //                         justifyContent: "center",
// //                       }}
// //                     >
// //                       <Button
// //                         onClick={handleStageNameDialogCancel}
// //                         sx={{
// //                           color: "white",
// //                           fontSize: "16px",
// //                           textTransform: "none",
// //                           marginTop: "30px !important",
// //                           padding: "8px 16px",
// //                           "&:hover": {
// //                             background: "transparent",
// //                           },
// //                         }}
// //                       >
// //                         Cancel
// //                       </Button>
// //                       <Button
// //                         onClick={handleStageNameDialogConfirm}
// //                         sx={{
// //                           color: "white",
// //                           fontSize: "16px",
// //                           textTransform: "none",
// //                           padding: "8px 16px",
// //                           marginTop: "30px !important",
// //                           "&:hover": {
// //                             background: "transparent",
// //                           },
// //                         }}
// //                       >
// //                         Yes
// //                       </Button>
// //                     </Box>
// //                   </Box>
// //                 </Dialog>
// //               </Box>
// //             )}

// //             {localStorage.getItem("Category") !== "Listener" && (
// //               <Box className="edit__field-container">
// //                 <Typography variant="h6" className="edit__field-label">
// //                   Bio
// //                 </Typography>

// //                 <TextField
// //                   variant="filled"
// //                   required
// //                   name="bio"
// //                   value={bio}
// //                   multiline
// //                   rows={2}
// //                   onChange={handleBioChange}
// //                   error={!!errors.bio}
// //                   helperText={errors.bio}
// //                   fullWidth
// //                   className="edit__field edit__field_height"
// //                   sx={{
// //                     width: "499px !important",
// //                     maxWidth: "499px !important",
// //                     '& .MuiInputBase-root': {
// //                       height: '70px !important',
// //                       minHeight: '70px !important'
// //                     }
// //                   }}
// //                 />
// //                 <Typography
// //                   variant="caption"
// //                   color={getWordCount(bio) >= 300 ? "error" : "textSecondary"}
// //                   sx={{
// //                     mb: 1,
// //                     display: "flex",
// //                     justifyContent: "flex-end",
// //                     mt: 1,
// //                     marginRight: "35px !important",
// //                     color: "white",
// //                   }}
// //                 >
// //                   {getWordCount(bio)}/300 characters
// //                   {getWordCount(bio) >= 300 && (
// //                     <span style={{ marginLeft: "8px" }}>
// //                       (Maximum characters limit reached)
// //                     </span>
// //                   )}
// //                 </Typography>
// //               </Box>
// //             )}

// //             <Box alignContent={"center"}>
// //               <Button
// //                 variant="contained"
// //                 onClick={handleUpdate}
// //                 className="edit__update-button"
// //                 disabled={!hasChanges || !!errors.fullName || (showStageName && !!errors.stageName) || !!errors.bio}
// //                 sx={{
// //                   margin: "0 auto",
// //                   marginLeft: "135px",
// //                   display: "block",
// //                   backgroundColor: hasChanges && !errors.fullName && !(showStageName && errors.stageName) && !errors.bio ? "#1976d2 !important" : "gray !important",
// //                   "&:hover": {
// //                     backgroundColor: hasChanges && !errors.fullName && !(showStageName && errors.stageName) && !errors.bio ? "#1565c0 !important" : "gray !important",
// //                   },
// //                 }}
// //               >
// //                 Update
// //               </Button>
// //               <Dialog
// //                 open={openSuccessDialog}
// //                 onClose={() => setOpenSuccessDialog(false)}
// //                 sx={{
// //                   "& .MuiDialog-paper": {
// //                     background: "#0F0B2C",
// //                     borderRadius: "16px",
// //                     maxWidth: "478px",
// //                     width: "478px",
// //                     height: "316px",
// //                     margin: "20px",
// //                     marginTop: "-20px !important",
// //                     position: "relative",
// //                     padding: "40px 20px",
// //                   },
// //                   "& .MuiBackdrop-root": {
// //                     backgroundColor: "rgba(0, 0, 0, 0.8)",
// //                   },
// //                 }}
// //               >
// //                 <IconButton
// //                   onClick={() => setOpenSuccessDialog(false)}
// //                   sx={{
// //                     position: "absolute",
// //                     right: 8,
// //                     top: 8,
// //                     color: "white",
// //                   }}
// //                 >
// //                   <img
// //                     src={cross}
// //                     alt="Close"
// //                     style={{
// //                       height: "35px",
// //                       width: "33px",
// //                     }}
// //                   />
// //                 </IconButton>
// //                 <Box
// //                   sx={{
// //                     display: "flex",
// //                     flexDirection: "column",
// //                     alignItems: "center",
// //                     textAlign: "center",
// //                     padding: "20px",
// //                     marginTop: "30px",
// //                   }}
// //                 >
// //                   <Typography
// //                     sx={{
// //                       color: "white",
// //                       fontSize: "24px !important",
// //                       fontWeight: 600,
// //                       marginBottom: "20px",
// //                     }}
// //                   >
// //                     Profile updated successfully
// //                   </Typography>
// //                   <Box
// //                     sx={{
// //                       width: "49.41px",
// //                       height: "50.86px",
// //                       borderRadius: "50%",
// //                       backgroundColor: "#2782EE",
// //                       display: "flex",
// //                       alignItems: "center",
// //                       justifyContent: "center",
// //                       cursor: "pointer",
// //                     }}
// //                     onClick={() => setOpenSuccessDialog(false)}
// //                   >
// //                     <CheckIcon sx={{ color: "white", fontSize: "32px" }} />
// //                   </Box>
// //                 </Box>
// //               </Dialog>

// //               <Dialog
// //                 open={openCameraDialog}
// //                 onClose={handleCloseCameraDialog}
// //                 sx={{
// //                   "& .MuiDialog-paper": {
// //                     background: "#1C1B46",
// //                     borderRadius: "16px",
// //                     maxWidth: "600px",
// //                     width: "100%",
// //                     padding: "20px",
// //                   },
// //                   "& .MuiBackdrop-root": {
// //                     backgroundColor: "rgba(0, 0, 0, 0.75)",
// //                   },
// //                 }}
// //               >
// //                 <DialogContent>
// //                   <Typography
// //                     sx={{
// //                       color: "white",
// //                       fontSize: "18px",
// //                       fontWeight: 600,
// //                       mb: 2,
// //                     }}
// //                   >
// //                     Camera Preview
// //                   </Typography>
// //                   {stream ? (
// //                     <video
// //                       ref={videoRef}
// //                       autoPlay
// //                       style={{ width: "100%", borderRadius: "8px", backgroundColor: "black" }}
// //                     />
// //                   ) : (
// //                     <Typography sx={{ color: "white" }}>
// //                       Loading camera...
// //                     </Typography>
// //                   )}
// //                   <canvas ref={canvasRef} style={{ display: "none" }} />
// //                 </DialogContent>
// //                 <DialogActions>
// //                   <Button
// //                     onClick={handleCloseCameraDialog}
// //                     sx={{
// //                       color: "white",
// //                       textTransform: "none",
// //                       "&:hover": { background: "transparent" },
// //                     }}
// //                   >
// //                     Cancel
// //                   </Button>
// //                   <Button
// //                     onClick={handleCapturePhoto}
// //                     sx={{
// //                       color: "white",
// //                       textTransform: "none",
// //                       "&:hover": { background: "transparent" },
// //                     }}
// //                     disabled={!stream}
// //                   >
// //                     Capture
// //                   </Button>
// //                 </DialogActions>
// //               </Dialog>
// //             </Box>
// //           </Box>
// //         </Box>
// //       </Box>
// //     </Box>
// //   );
// // };

// // export default EditProfile;

// import React, { useRef, useState, useEffect } from "react";
// import {
//   Box,
//   Typography,
//   Avatar,
//   IconButton,
//   TextField,
//   Button,
//   Menu,
//   MenuItem,
//   Alert,
//   Dialog,
//   DialogContent,
//   DialogActions,
// } from "@mui/material";
// import SideBar from "./SideBar";
// import Edit from "./assets/VectorEdit.png";
// import EditBg from "./assets/VectorEditBg_new.png";
// import { useNavigate } from "react-router-dom";
// import "./EditProfile.css";
// import { Check as CheckIcon } from "lucide-react";
// import cross from "./assets/Cross.png";
// import bannerImage1 from "./assets/RectangleBannerImage.png";

// const EditProfile = () => {
//   const [coverPage, setCoverPage] = useState(null);
//   const bannerImage = bannerImage1;
//   const [profileImage, setProfileImage] = useState(null);
//   const [anchorEl, setAnchorEl] = useState(null);
//   const user_id = localStorage.getItem("user_id");
//   const StageName = localStorage.getItem("StageName");
//   const FullName = localStorage.getItem("FullName");
//   const navigate = useNavigate();
//   const fileInputRef = useRef(null);
//   const coverPageInputRef = useRef(null);
//   const [ImageFile, setImageFile] = useState(null);
//   const [fullName, setFullName] = useState("");
//   const [stageName, setStageName] = useState("");
//   const [bio, setBio] = useState("");
//   const [errors, setErrors] = useState({
//     fullName: "",
//     stageName: "",
//     bio: "",
//   });

//   const [isEditing, setIsEditing] = useState(false);
//   const [tempStageName, setTempStageName] = useState("");
//   const [showStageNameWarning, setShowStageNameWarning] = useState(false);
//   const [showStageName, setShowStageName] = useState(false);
//   const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
//   const [initialFullName, setInitialFullName] = useState("");
//   const [initialStageName, setInitialStageName] = useState("");
//   const [initialBio, setInitialBio] = useState("");
//   const [hasChanges, setHasChanges] = useState(false);

//   const [sidebarMargin, setSidebarMargin] = useState(
//     localStorage.getItem("sidebarCollapsed") === "true"
//       ? "-80px !important"
//       : "99px !important"
//   );

//   // State for camera preview dialog
//   const [openCameraDialog, setOpenCameraDialog] = useState(false);
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [stream, setStream] = useState(null);
//   const [cameraError, setCameraError] = useState(null);

//   useEffect(() => {
//     setSidebarMargin(
//       localStorage.getItem("sidebarCollapsed") === "true"
//         ? "-80px !important"
//         : "99px !important"
//     );

//     const handleStorageChange = () => {
//       setSidebarMargin(
//         localStorage.getItem("sidebarCollapsed") === "true"
//           ? "-80px !important"
//           : "99px !important"
//       );
//     };

//     const handleSidebarChange = (event) => {
//       if (event.detail === "collapsed") {
//         setSidebarMargin("-80px !important");
//       } else {
//         setSidebarMargin("99px !important");
//       }
//     };

//     window.addEventListener("storage", handleStorageChange);
//     window.addEventListener("sidebarStateChange", handleSidebarChange);

//     return () => {
//       window.removeEventListener("storage", handleStorageChange);
//       window.removeEventListener("sidebarStateChange", handleSidebarChange);
//     };
//   }, []);

//   useEffect(() => {
//     const fetchProfilePhoto = async () => {
//       try {
//         const response = await fetch(
//           `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getprofilephoto?user_id=${user_id}`
//         );
//         const data = await response.json();
//         setProfileImage(data.profilePhotoUrl?.S || null);
//       } catch (err) {
//         console.error("Error loading profile photo", err);
//       }
//     };
//     fetchProfilePhoto();
//   }, [user_id]);

//   useEffect(() => {
//     const fetchCoverPage = async () => {
//       try {
//         const response = await fetch(
//           `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getcoverpage?user_id=${user_id}`,
//           {
//             method: "GET",
//             headers: {
//               "Content-Type": "application/json",
//             },
//           }
//         );

//         if (!response.ok) {
//           throw new Error("Failed to fetch profile photo");
//         }

//         const data = await response.json();
//         setCoverPage(data.coverPageUrl.S);
//         localStorage.setItem("CoverPageUrl", data.coverPageUrl.S);
//       } catch (error) {
//         console.error("Error fetching CoverPage:", error);
//       }
//     };

//     fetchCoverPage();
//   }, [user_id]);

//   const [savedDisplayName, setSavedDisplayName] = useState("");

//   useEffect(() => {
//     const fetchProfileDetails = async () => {
//       try {
//         const response = await fetch(
//           `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getprofiledetails?user_id=${user_id}`,
//           {
//             method: "GET",
//             headers: {
//               "Content-Type": "application/json",
//             },
//           }
//         );

//         if (!response.ok) {
//           throw new Error("Failed to fetch profile details");
//         }

//         const data = await response.json();
//         setFullName(data.FullName.S || "");
//         setInitialFullName(data.FullName.S || "");
//         const fetchedStageName = data.StageName.S || "";
//         setStageName(fetchedStageName);
//         setInitialStageName(fetchedStageName);
//         setBio(data.bio.S || "");
//         setInitialBio(data.bio.S || "");
//         setShowStageName(!!fetchedStageName);
//         setSavedDisplayName(data.StageName.S || data.FullName.S || "");
//       } catch (error) {
//         console.error("Error fetching profile details:", error);
//       }
//     };

//     fetchProfileDetails();
//   }, [user_id]);

//   useEffect(() => {
//     const hasFieldChanges =
//       fullName !== initialFullName ||
//       (showStageName && stageName !== initialStageName) ||
//       bio !== initialBio;
//     setHasChanges(hasFieldChanges);
//   }, [fullName, stageName, bio, showStageName, initialFullName, initialStageName, initialBio]);

//   // Clean up stream when dialog closes
//   useEffect(() => {
//     return () => {
//       if (stream) {
//         console.log("Cleaning up stream on unmount");
//         stream.getTracks().forEach((track) => track.stop());
//         setStream(null);
//       }
//     };
//   }, [stream]);

//   const formatTimestamp = () => {
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, "0");
//     const day = String(now.getDate()).padStart(2, "0");
//     const hours = String(now.getHours()).padStart(2, "0");
//     const minutes = String(now.getMinutes()).padStart(2, "0");
//     const seconds = String(now.getSeconds()).padStart(2, "0");

//     return `${year}${month}${day}_${hours}${minutes}${seconds}`;
//   };

//   const validateFullName = (name) => {
//     if (!name.trim()) {
//       setErrors((prev) => ({
//         ...prev,
//         fullName: "Username cannot be empty",
//       }));
//       return false;
//     }
//     setErrors((prev) => ({
//       ...prev,
//       fullName: "",
//     }));
//     return true;
//   };

//   const validateStageName = (name) => {
//     if (showStageName && !name.trim()) {
//       setErrors((prev) => ({
//         ...prev,
//         stageName: "Stage name cannot be empty",
//       }));
//       return false;
//     }
//     setErrors((prev) => ({
//       ...prev,
//       stageName: "",
//     }));
//     return true;
//   };

//   const getWordCount = (text) => {
//     return text.length;
//   };

//   const handleBioChange = (e) => {
//     const newBio = e.target.value;
//     const wordCount = getWordCount(newBio);

//     if (wordCount <= 300 || newBio.length < bio.length) {
//       setBio(newBio);
//       validateBio(newBio);
//     }
//   };

//   const handleStageNameClick = () => {
//     if (!isEditing) {
//       setTempStageName(stageName);
//       setShowStageNameDialog(true);
//     }
//   };

//   const validateBio = (bioText) => {
//     const wordCount = getWordCount(bioText);
//     if (wordCount > 300) {
//       setErrors((prev) => ({
//         ...prev,
//         bio: "Bio cannot exceed 300 characters",
//       }));
//       return false;
//     }
//     setErrors((prev) => ({
//       ...prev,
//       bio: "",
//     }));
//     return true;
//   };

//   const capitalizeWords = (str) => {
//     return str
//       .toLowerCase()
//       .split(" ")
//       .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(" ")
//       .trim();
//   };

//   const handleUpdate = async () => {
//     const isFullNameValid = validateFullName(fullName);
//     const isStageNameValid = showStageName ? validateStageName(stageName) : true;
//     const isBioValid = validateBio(bio);

//     if (!isFullNameValid || !isStageNameValid || !isBioValid) {
//       return;
//     }

//     const hasChanges =
//       fullName !== (FullName || "") ||
//       (showStageName && stageName !== (StageName || "")) ||
//       bio !== (localStorage.getItem("bio") || "");

//     if (!hasChanges) {
//       alert("Please update your profile");
//       return;
//     }

//     try {
//       const payload = {
//         FullName: capitalizeWords(fullName),
//         bio: bio,
//         user_id: user_id,
//         StageName: showStageName ? capitalizeWords(stageName) : undefined,
//         updatedTimestamp: formatTimestamp(),
//       };

//       const response = await fetch(
//         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/editprofile",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(payload),
//         }
//       );

//       if (!response.ok) {
//         throw new Error("Failed to update profile details");
//       }

//       localStorage.setItem("FullName", capitalizeWords(fullName));
//       if (showStageName) {
//         localStorage.setItem("StageName", capitalizeWords(stageName));
//       }
//       localStorage.setItem("bio", bio);

//       setSavedDisplayName(
//         showStageName ? capitalizeWords(stageName) : capitalizeWords(fullName)
//       );
//       setInitialFullName(capitalizeWords(fullName));
//       setInitialStageName(showStageName ? capitalizeWords(stageName) : "");
//       setInitialBio(bio);
//       setOpenSuccessDialog(true);
//       setTimeout(() => {
//         setOpenSuccessDialog(false);
//         setFullName(capitalizeWords(fullName));
//         setStageName(showStageName ? capitalizeWords(stageName) : "");
//         setBio(bio);
//       }, 3000);
//     } catch (error) {
//       console.error("Error updating profile:", error);
//       alert("Failed to update profile. Please try again.");
//     }
//   };

//   const handleImageClick = () => {
//     fileInputRef.current.click();
//   };

//   const uploadImageToSignedUrl = async (url, file) => {
//     try {
//       const response = await fetch(url, {
//         method: "PUT",
//         headers: {
//           "Content-Type": file.type,
//         },
//         body: file,
//       });

//       if (!response.ok) {
//         throw new Error(`Upload failed with status: ${response.status}`);
//       }

//       return response;
//     } catch (error) {
//       console.error("Error in uploadImageToSignedUrl:", error);
//       throw error;
//     }
//   };

//   const handleImageUpload = async (file) => {
//     try {
//       if (!file) {
//         throw new Error("No file selected");
//       }

//       if (!file.type.startsWith("image/")) {
//         throw new Error("Please select an image file");
//       }

//       setImageFile(file);
//       const updatedTimestamp = formatTimestamp();
//       const fileName = `profile#${updatedTimestamp}`;

//       const presignedUrlResponse = await fetch(
//         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/generate-presigned-url/profilePhoto",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             user_id: user_id,
//             fileName: fileName,
//           }),
//         }
//       );

//       if (!presignedUrlResponse.ok) {
//         throw new Error("Failed to generate presigned URL");
//       }

//       const presignedData = await presignedUrlResponse.json();

//       if (!presignedData.url) {
//         throw new Error("No presigned URL received");
//       }

//       const uploadResponse = await uploadImageToSignedUrl(
//         presignedData.url,
//         file
//       );

//       if (!uploadResponse.ok) {
//         throw new Error("Failed to upload image to S3");
//       }

//       const updateUrlResponse = await fetch(
//         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/profilePhotoUrl",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             user_id: user_id,
//             fileName: fileName,
//             updatedTimestamp: updatedTimestamp,
//           }),
//         }
//       );

//       if (!updateUrlResponse.ok) {
//         throw new Error("Failed to update profile photo URL");
//       }

//       const updatedData = await updateUrlResponse.json();
//       if (updatedData.profilePhotoUrl) {
//         setProfileImage(updatedData.profilePhotoUrl);
//       }

//       if (fileInputRef.current) {
//         fileInputRef.current.value = "";
//       }
//       window.location.reload();
//     } catch (error) {
//       console.error("Error uploading image:", error);
//       alert(error.message || "Failed to upload image. Please try again.");
//     }
//   };

//   const [showStageNameDialog, setShowStageNameDialog] = useState(false);
//   const [previousStageName, setPreviousStageName] = useState("");
//   const [isFirstInteraction, setIsFirstInteraction] = useState(true);
//   const [canEdit, setCanEdit] = useState(true);
//   const stageNameRef = useRef(null);
//   const [key, setKey] = useState(0);

//   const handleStageNameFocus = () => {
//     setPreviousStageName(stageName);
//     if (isFirstInteraction) {
//       setShowStageNameDialog(true);
//       console.log("handleStageNameFocus");
//     }
//   };

//   const handleStageNameChange = (e) => {
//     if (isEditing) {
//       const newStageName = e.target.value;
//       setStageName(newStageName);
//       validateStageName(newStageName);
//     }
//   };

//   const handleStageNameDialogCancel = () => {
//     setShowStageNameDialog(false);
//     setStageName(tempStageName);
//     setIsEditing(false);
//   };

//   const handleStageNameDialogConfirm = () => {
//     setShowStageNameDialog(false);
//     setIsEditing(true);
//     setTimeout(() => {
//       if (stageNameRef.current) {
//         stageNameRef.current.focus();
//       }
//     }, 100);
//   };

//   const handleStageNameBlur = () => {
//     if (isEditing) {
//       setIsEditing(false);
//     }
//   };

//   const handleCoverPageClick = () => {
//     coverPageInputRef.current.click();
//   };

//   const getInitials = (name) => {
//     if (!name) return "";
//     const names = name.split(" ");
//     if (names.length > 1) {
//       return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
//     }
//     return names[0][0].toUpperCase();
//   };

//   const menuOpen = Boolean(anchorEl);

//   const handleEditIconClick = (event) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleClose = () => {
//     setAnchorEl(null);
//   };

//   const handleRemoveProfileImage = async () => {
//     try {
//       const res = await fetch(
//         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/clearProfilePhoto",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ user_id })
//         }
//       );
//       if (!res.ok) throw new Error("Remove failed");
//       setProfileImage(null);
//       localStorage.removeItem("ProfilePhotoUrl");
//       // window.location.reload();
//     } catch (err) {
//       console.error("Error removing image", err);
//     }
//   };

//   const handleCameraCapture = async () => {
//     try {
//       console.log("Requesting camera access");
//       setCameraError(null);
//       const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
//       console.log("Camera stream obtained:", mediaStream);

//       // Set the stream and ensure the video element is ready
//       setStream(mediaStream);

//       // Wait for the dialog to open and video element to be available
//       setOpenCameraDialog(true);

//       // Ensure the video element is ready before assigning the stream
//       setTimeout(() => {
//         if (videoRef.current) {
//           console.log("Assigning stream to video element");
//           videoRef.current.srcObject = mediaStream;
//           videoRef.current.play().then(() => {
//             console.log("Video playback started");
//           }).catch((err) => {
//             console.error("Error playing video:", err);
//             setCameraError("Failed to start video playback. Please try again.");
//           });
//         } else {
//           console.error("Video element not available");
//           setCameraError("Video element not found. Please try again.");
//         }
//       }, 100);

//       handleClose();
//     } catch (error) {
//       console.error("Camera access error:", error);
//       setCameraError("Camera not available or permission denied. Please check your camera settings.");
//       setOpenCameraDialog(false);
//     }
//   };

//   const handleCapturePhoto = () => {
//     const video = videoRef.current;
//     const canvas = canvasRef.current;
//     if (video && canvas) {
//       console.log("Capturing photo");
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;
//       const ctx = canvas.getContext("2d");
//       ctx.drawImage(video, 0, 0);
//       canvas.toBlob((blob) => {
//         if (blob) {
//           console.log("Photo captured, uploading");
//           const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
//           // handleImageUpload(file);
//           handleCoverPageUpload(file);
//           handleCloseCameraDialog();
//         } else {
//           console.error("Failed to create blob");
//           alert("Failed to capture photo.");
//         }
//       }, "image/jpeg");
//     } else {
//       console.error("Video or canvas not available");
//       alert("Unable to capture photo. Please try again.");
//     }
//   };

//   const handleCloseCameraDialog = () => {
//     console.log("Closing camera dialog");
//     if (stream) {
//       stream.getTracks().forEach((track) => track.stop());
//       console.log("Camera stream stopped");
//     }
//     setStream(null);
//     setCameraError(null);
//     setOpenCameraDialog(false);
//   };

//   const handleCoverPageUpload = async (file) => {
//     try {
//       if (!file) {
//         throw new Error("No file selected");
//       }

//       if (!file.type.startsWith("image/")) {
//         throw new Error("Please select an image file");
//       }

//       const updatedTimestamp = formatTimestamp();
//       const fileName = `CoverPage#${updatedTimestamp}`;

//       const presignedUrlResponse = await fetch(
//         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/generate-presigned-url/coverPage",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             user_id: user_id,
//             fileName: fileName,
//           }),
//         }
//       );

//       if (!presignedUrlResponse.ok) {
//         throw new Error("Failed to generate presigned URL for cover page");
//       }

//       const presignedData = await presignedUrlResponse.json();

//       if (!presignedData.url) {
//         throw new Error("No presigned URL received for cover page");
//       }

//       const uploadResponse = await uploadImageToSignedUrl(
//         presignedData.url,
//         file
//       );

//       if (!uploadResponse.ok) {
//         throw new Error("Failed to upload cover page to S3");
//       }

//       const updateUrlResponse = await fetch(
//         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/coverPageUrl",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             user_id: user_id,
//             fileName: fileName,
//             updatedTimestamp: updatedTimestamp,
//           }),
//         }
//       );

//       if (!updateUrlResponse.ok) {
//         throw new Error("Failed to update cover page URL");
//       }

//       const updatedData = await updateUrlResponse.json();

//       if (updatedData.coverPageUrl) {
//         setCoverPage(updatedData.coverPageUrl);
//         localStorage.setItem("CoverPageUrl", updatedData.coverPageUrl);
//       }

//       if (coverPageInputRef.current) {
//         coverPageInputRef.current.value = "";
//       }

//       window.location.reload();
//     } catch (error) {
//       console.error("Error uploading cover page:", error);
//       alert(error.message || "Failed to upload cover page. Please try again.");
//     }
//   };

//   const [coverAnchorEl, setCoverAnchorEl] = useState(null);
//   const coverMenuOpen = Boolean(coverAnchorEl);

//   const handleCoverEditIconClick = (event) => {
//     event.stopPropagation();
//     if (!coverAnchorEl) {
//       setCoverAnchorEl(event.currentTarget);
//     }
//   };

//   const handleCoverMenuClose = () => {
//     setCoverAnchorEl(null);
//   };

//   const coverFileInputRef = useRef(null);

//   const handleRemoveCoverImage = async () => {
//     try {
//       const res = await fetch(
//         "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/clearCoverPagePhoto",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ user_id })
//         }
//       );
//       if (!res.ok) throw new Error("Remove failed");
//       setCoverPage(null);
//       localStorage.removeItem("CoverPageUrl");
//       // window.location.reload();
//     } catch (err) {
//       console.error("Error removing cover image", err);
//     }
//   };

//   const handleCoverCameraCapture = async () => {
//     try {
//       console.log("Requesting camera access for cover");
//       setCameraError(null);
//       const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });

//       console.log("Camera stream obtained for cover:", mediaStream);

//       setStream(mediaStream);
//       setOpenCameraDialog(true);

//       setTimeout(() => {
//         if (videoRef.current) {
//           console.log("Assigning stream to video element for cover");
//           videoRef.current.srcObject = mediaStream;
//           videoRef.current.play().then(() => {
//             console.log("Video playback started for cover");
//           }).catch((err) => {
//             console.error("Error playing video for cover:", err);
//             setCameraError("Failed to start video playback. Please try again.");
//           });
//         } else {
//           console.error("Video element not available for cover");
//           setCameraError("Video element not found. Please try again.");
//         }
//       }, 100);

//       handleCoverMenuClose();
//     } catch (error) {
//       console.error("Camera access error for cover:", error);
//       setCameraError("Camera not available or permission denied. Please check your camera settings.");
//       setOpenCameraDialog(false);
//     }
//   };

//   const handleCoverCapturePhoto = () => {
//     const video = videoRef.current;
//     const canvas = canvasRef.current;
//     if (video && canvas) {
//       console.log("Capturing cover photo");
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;
//       const ctx = canvas.getContext("2d");
//       ctx.drawImage(video, 0, 0);
//       canvas.toBlob((blob) => {
//         if (blob) {
//           console.log("Cover photo captured, uploading");
//           const file = new File([blob], "camera-cover.jpg", { type: "image/jpeg" });
//           handleCoverPageUpload(file);
//           handleCloseCameraDialog();
//         } else {
//           console.error("Failed to create blob for cover");
//           alert("Failed to capture photo.");
//         }
//       }, "image/jpeg");
//     } else {
//       console.error("Video or canvas not available for cover");
//       alert("Unable to capture photo. Please try again.");
//     }
//   };

//   return (
//     <Box display="flex">
//       <SideBar />
//       <Box className="edit">
//         <Box className="edit__banner">
//           <img
//             src={coverPage || bannerImage}
//             alt="Profile Banner"
//             className="edit__banner-image"
//           />
//         </Box>
//         {localStorage.getItem("Category") !== "Listener" && (
//           <Box
//             className="editIconContainer"
//             sx={{
//               backgroundColor: "#2644D9",
//               marginRight: sidebarMargin,
//               transition: "all 0.4s ease-in-out",
//             }}
//             onClick={handleCoverEditIconClick}
//             style={{ cursor: "pointer" }}
//           >
//             <img src={Edit} alt="Edit" className="editIcon" />
//             <input
//               type="file"
//               ref={coverPageInputRef}
//               accept="image/*"
//               onChange={(event) => {
//                 const file = event.target.files[0];
//                 if (file) {
//                   handleCoverPageUpload(file);
//                 }
//               }}
//               style={{ display: "none" }}
//             />
//             <Menu
//                sx={{ marginleft: "-30px !important",

//               }}
//               anchorEl={coverAnchorEl}
//               open={coverMenuOpen}
//               onClose={handleCoverMenuClose}
//               disableScrollLock
//               PaperProps={{
//                 sx: {
//                   backgroundColor: "#1e1e1e", // full background color
//                   color: "white",
//                   boxShadow: "0px 3px 10px rgba(0,0,0,0.3)",
//                   borderRadius: "4px",
//                   minWidth: "200px" // optional: ensure consistent width
//                 }
//               }}
//             >
//               <MenuItem
//                 onClick={() => {
//                   handleCoverMenuClose();
//                   coverPageInputRef.current.click()
//                   // coverFileInputRef.current.click();
//                 }}
//               >
//                 Choose from Gallery
//               </MenuItem>
//               <MenuItem
//                 onClick={() => {
//                   handleCoverCameraCapture();
//                 }}
//               >
//                 Capture from Camera
//               </MenuItem>
//               <MenuItem
//                 onClick={() => {
//                   handleCoverMenuClose();
//                   handleRemoveCoverImage();
//                 }}
//               >
//                 Remove Cover Image
//               </MenuItem>
//             </Menu>
//           </Box>
//         )}

//         <Box className="edit__info">
//           <Box className="edit__avatar-container">
//             <Avatar
//               src={profileImage}
//               alt="Profile"
//               className="edit__avatar"
//               sx={{ backgroundColor: profileImage ? "transparent" : "#222", fontSize: "48px" }}
//             >
//               {!profileImage && getInitials(savedDisplayName)}
//             </Avatar>
//             <Box
//               onClick={handleEditIconClick}
//               style={{ position: "absolute", bottom: 0, right: 20, cursor: "pointer"  }}
//             >
//               <img src={EditBg} alt="EditBg" style={{ width: 36, height: 36 }} />
//               <img src={Edit} alt="Edit" style={{ position: "absolute", top: 10, left: 10, width: 16 }} />
//             </Box>
//             <input

//               type="file"
//               ref={fileInputRef}
//               accept="image/*"
//               style={{ display: "none" }}
//               onChange={(e) => {
//                 e.preventDefault();
//                 const file = e.target.files[0];
//                 if (file) handleImageUpload(file);
//               }}
//             />
//             <Menu 
//             sx={{ marginLeft: "70px",
//               marginTop: "-80px"
//             }} anchorEl={anchorEl} open={menuOpen} onClose={handleClose}
//             PaperProps={{
//               sx: {
//                 backgroundColor: "#1e1e1e", // full background color
//                 color: "white",
//                 boxShadow: "0px 3px 10px rgba(0,0,0,0.3)",
//                 borderRadius: "4px",
//                 minWidth: "200px" // optional: ensure consistent width
//               }
//             }}
//             >

//               <MenuItem

//                 onClick={() => {
//                   handleClose();
//                   fileInputRef.current.click();
//                 }}
//               >
//                 Choose from Gallery
//               </MenuItem>
//               <MenuItem

//                 onClick={() => {
//                   handleCameraCapture();
//                 }}
//               >
//                 Capture from Camera
//               </MenuItem>
//               <MenuItem

//                 onClick={() => {
//                   handleClose();
//                   handleRemoveProfileImage();
//                 }}
//               >
//                 Remove Profile Image
//               </MenuItem>

//             </Menu>
//           </Box>

//           <Box className="edit__content">
//             <Typography
//               variant="h4"
//               className="edit__title"
//               style={{
//                 textDecoration: "underline",
//                 textDecorationColor: "white",
//                 textUnderlineOffset: "5px",
//                 textDecorationThickness: "2px",
//               }}
//             >
//               Edit Profile
//             </Typography>

//             <Typography variant="h5" className="edit__subtitle">
//               Update Details:
//             </Typography>

//             <Box className="edit__field-container">
//               <Typography variant="h6" className="edit__field-label">
//                 Username
//               </Typography>
//               <TextField
//                 variant="filled"
//                 required
//                 name="name"
//                 value={fullName}
//                 onChange={(e) => {
//                   setFullName(e.target.value);
//                   validateFullName(e.target.value);
//                 }}
//                 error={!!errors.fullName}
//                 className="edit__field"
//                 sx={{
//                   "& .MuiFilledInput-input": {
//                     padding: "15px",
//                   },
//                   width: "499px !important",
//                   maxWidth: "499px !important",
//                 }}
//               />
//               {errors.fullName && (
//                 <Typography
//                   variant="body2"
//                   sx={{
//                     color: "red !important",
//                     textAlign: "left",
//                     width: "100%",
//                   }}
//                 >
//                   {errors.fullName}
//                 </Typography>
//               )}
//             </Box>
//             {showStageName && (
//               <Box className="edit__field-container">
//                 <Typography variant="h6" className="edit__field-label">
//                   Stage name
//                 </Typography>

//                 <TextField
//                   inputRef={stageNameRef}
//                   variant="filled"
//                   required
//                   name="stageName"
//                   fullWidth
//                   value={stageName}
//                   onChange={handleStageNameChange}
//                   onClick={handleStageNameClick}
//                   onBlur={handleStageNameBlur}
//                   InputProps={{
//                     readOnly: !isEditing,
//                   }}
//                   error={!!errors.stageName}
//                   className="edit__field"
//                   sx={{
//                     "& .MuiFilledInput-root": {
//                       borderRadius: "10px !important",
//                     },
//                     "& .MuiFilledInput-input": {
//                       padding: "15px",
//                     },
//                     width: "499px !important",
//                     maxWidth: "499px !important",
//                   }}
//                 />

//                 <Dialog
//                   open={showStageNameDialog}
//                   onClose={handleStageNameDialogCancel}
//                   sx={{
//                     "& .MuiDialog-paper": {
//                       background: "#1C1B46",
//                       borderRadius: "16px",
//                       maxWidth: "300px",
//                       width: "350px !important",
//                       height: "180px !important",
//                       margin: "20px",
//                       padding: "24px",
//                     },
//                     "& .MuiBackdrop-root": {
//                       backgroundColor: "rgba(0, 0, 0, 0.75)",
//                     },
//                   }}
//                 >
//                   <Box
//                     sx={{
//                       display: "flex",
//                       flexDirection: "column",
//                       alignItems: "center",
//                       textAlign: "center",
//                     }}
//                   >
//                     <Typography
//                       sx={{
//                         color: "white",
//                         fontSize: "18px !important",
//                         fontWeight: 600,
//                         marginBottom: "8px",
//                       }}
//                     >
//                       Warning
//                     </Typography>
//                     <Typography
//                       sx={{
//                         color: "white",
//                         fontSize: "16px",
//                         marginTop: "16px !important",
//                       }}
//                     >
//                       Your identity with the audience will be changed.
//                     </Typography>
//                     <Box
//                       sx={{
//                         display: "flex",
//                         gap: "32px",
//                         justifyContent: "center",
//                       }}
//                     >
//                       <Button
//                         onClick={handleStageNameDialogCancel}
//                         sx={{
//                           color: "white",
//                           fontSize: "16px",
//                           textTransform: "none",
//                           marginTop: "30px !important",
//                           padding: "8px 16px",
//                           "&:hover": {
//                             background: "transparent",
//                           },
//                         }}
//                       >
//                         Cancel
//                       </Button>
//                       <Button
//                         onClick={handleStageNameDialogConfirm}
//                         sx={{
//                           color: "white",
//                           fontSize: "16px",
//                           textTransform: "none",
//                           padding: "8px 16px",
//                           marginTop: "30px !important",
//                           "&:hover": {
//                             background: "transparent",
//                           },
//                         }}
//                       >
//                         Yes
//                       </Button>
//                     </Box>
//                   </Box>
//                 </Dialog>
//               </Box>
//             )}

//             {localStorage.getItem("Category") !== "Listener" && (
//               <Box className="edit__field-container">
//                 <Typography variant="h6" className="edit__field-label">
//                   Bio
//                 </Typography>

//                 <TextField
//                   variant="filled"
//                   required
//                   name="bio"
//                   value={bio}
//                   multiline
//                   rows={2}
//                   onChange={handleBioChange}
//                   error={!!errors.bio}
//                   helperText={errors.bio}
//                   fullWidth
//                   className="edit__field edit__field_height"
//                   sx={{
//                     width: "499px !important",
//                     maxWidth: "499px !important",
//                     '& .MuiInputBase-root': {
//                       height: '70px !important',
//                       minHeight: '70px !important'
//                     }
//                   }}
//                 />
//                 <Typography
//                   variant="caption"
//                   color={getWordCount(bio) >= 300 ? "error" : "textSecondary"}
//                   sx={{
//                     mb: 1,
//                     display: "flex",
//                     justifyContent: "flex-end",
//                     mt: 1,
//                     marginRight: "35px !important",
//                     color: "white",
//                   }}
//                 >
//                   {getWordCount(bio)}/300 characters
//                   {getWordCount(bio) >= 300 && (
//                     <span style={{ marginLeft: "8px" }}>
//                       (Maximum characters limit reached)
//                     </span>
//                   )}
//                 </Typography>
//               </Box>
//             )}

//             <Box alignContent={"center"}>
//               <Button
//                 variant="contained"
//                 onClick={handleUpdate}
//                 className="edit__update-button"
//                 disabled={!hasChanges || !!errors.fullName || (showStageName && !!errors.stageName) || !!errors.bio}
//                 sx={{
//                   margin: "0 auto",
//                   marginLeft: "135px",
//                   display: "block",
//                   backgroundColor: hasChanges && !errors.fullName && !(showStageName && errors.stageName) && !errors.bio ? "#1976d2 !important" : "gray !important",
//                   "&:hover": {
//                     backgroundColor: hasChanges && !errors.fullName && !(showStageName && errors.stageName) && !errors.bio ? "#1565c0 !important" : "gray !important",
//                   },
//                 }}
//               >
//                 Update
//               </Button>
//               <Dialog
//                 open={openSuccessDialog}
//                 onClose={() => setOpenSuccessDialog(false)}
//                 sx={{
//                   "& .MuiDialog-paper": {
//                     background: "#0F0B2C",
//                     borderRadius: "16px",
//                     maxWidth: "478px",
//                     width: "478px",
//                     height: "316px",
//                     margin: "20px",
//                     marginTop: "-20px !important",
//                     position: "relative",
//                     padding: "40px 20px",
//                   },
//                   "& .MuiBackdrop-root": {
//                     backgroundColor: "rgba(0, 0, 0, 0.8)",
//                   },
//                 }}
//               >
//                 <IconButton
//                   onClick={() => setOpenSuccessDialog(false)}
//                   sx={{
//                     position: "absolute",
//                     right: 8,
//                     top: 8,
//                     color: "white",
//                   }}
//                 >
//                   <img
//                     src={cross}
//                     alt="Close"
//                     style={{
//                       height: "35px",
//                       width: "33px",
//                     }}
//                   />
//                 </IconButton>
//                 <Box
//                   sx={{
//                     display: "flex",
//                     flexDirection: "column",
//                     alignItems: "center",
//                     textAlign: "center",
//                     padding: "20px",
//                     marginTop: "30px",
//                   }}
//                 >
//                   <Typography
//                     sx={{
//                       color: "white",
//                       fontSize: "24px !important",
//                       fontWeight: 600,
//                       marginBottom: "20px",
//                     }}
//                   >
//                     Profile updated successfully
//                   </Typography>
//                   <Box
//                     sx={{
//                       width: "49.41px",
//                       height: "50.86px",
//                       borderRadius: "50%",
//                       backgroundColor: "#2782EE",
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "center",
//                       cursor: "pointer",
//                     }}
//                     onClick={() => setOpenSuccessDialog(false)}
//                   >
//                     <CheckIcon sx={{ color: "white", fontSize: "32px" }} />
//                   </Box>
//                 </Box>
//               </Dialog>

//               <Dialog
//                 open={openCameraDialog}
//                 onClose={handleCloseCameraDialog}
//                 sx={{
//                   "& .MuiDialog-paper": {
//                     background: "#1C1B46",
//                     borderRadius: "16px",
//                     maxWidth: "600px",
//                     width: "100%",
//                     padding: "20px",
//                   },
//                   "& .MuiBackdrop-root": {
//                     backgroundColor: "rgba(0, 0, 0, 0.75)",
//                   },
//                 }}
//               >
//                 <DialogContent>
//                   <Typography
//                     sx={{
//                       color: "white",
//                       fontSize: "18px",
//                       fontWeight: 600,
//                       mb: 2,
//                     }}
//                   >
//                     Camera Preview
//                   </Typography>
//                   {cameraError ? (
//                     <Typography sx={{ color: "red" }}>
//                       {cameraError}
//                     </Typography>
//                   ) : stream ? (
//                     <video
//                       ref={videoRef}
//                       autoPlay
//                       playsInline
//                       style={{ width: "100%", borderRadius: "8px", backgroundColor: "black" }}
//                     />
//                   ) : (
//                     <Typography sx={{ color: "white" }}>
//                       Opening camera...
//                     </Typography>
//                   )}
//                   <canvas ref={canvasRef} style={{ display: "none" }} />
//                 </DialogContent>
//                 <DialogActions>
//                   <Button
//                     onClick={handleCloseCameraDialog}
//                     sx={{
//                       color: "white",
//                       textTransform: "none",
//                       "&:hover": { background: "transparent" },
//                     }}
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     onClick={handleCapturePhoto}
//                     sx={{
//                       color: "white",
//                       textTransform: "none",
//                       "&:hover": { background: "transparent" },
//                     }}
//                     disabled={!stream || !!cameraError}
//                   >
//                     Capture
//                   </Button>
//                 </DialogActions>
//               </Dialog>
//             </Box>
//           </Box>
//         </Box>
//       </Box>
//     </Box>
//   );
// };

// export default EditProfile;

import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Button,
  Menu,
  MenuItem,
  Alert,
  Dialog,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SideBar from "./SideBar";
import Edit from "./assets/VectorEdit.png";
import EditBg from "./assets/VectorEditBg_new.png";
import { useNavigate } from "react-router-dom";
import "./EditProfile.css";
import { Check as CheckIcon } from "lucide-react";
import cross from "./assets/Cross.png";
import bannerImage1 from "./assets/RectangleBannerImage.png";

const EditProfile = () => {
  const [coverPage, setCoverPage] = useState(null);
  const bannerImage = bannerImage1;
  const [profileImage, setProfileImage] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const user_id = localStorage.getItem("user_id");
  const StageName = localStorage.getItem("StageName");
  const FullName = localStorage.getItem("FullName");
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const coverPageInputRef = useRef(null);
  const [ImageFile, setImageFile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [stageName, setStageName] = useState("");
  const [bio, setBio] = useState("");
  const [errors, setErrors] = useState({
    fullName: "",
    stageName: "",
    bio: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempStageName, setTempStageName] = useState("");
  const [showStageNameWarning, setShowStageNameWarning] = useState(false);
  const [showStageName, setShowStageName] = useState(false);
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
  const [initialFullName, setInitialFullName] = useState("");
  const [initialStageName, setInitialStageName] = useState("");
  const [initialBio, setInitialBio] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const [sidebarMargin, setSidebarMargin] = useState(
    localStorage.getItem("sidebarCollapsed") === "true"
      ? "-80px !important"
      : "99px !important"
  );

  // State for camera preview dialog
  const [openCameraDialog, setOpenCameraDialog] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isCapturingForCover, setIsCapturingForCover] = useState(false);

  useEffect(() => {
    setSidebarMargin(
      localStorage.getItem("sidebarCollapsed") === "true"
        ? "-80px !important"
        : "99px !important"
    );

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
    const fetchProfilePhoto = async () => {
      try {
        const response = await fetch(
          `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getprofilephoto?user_id=${user_id}`
        );
        const data = await response.json();
        setProfileImage(data.profilePhotoUrl?.S || null);
      } catch (err) {
        console.error("Error loading profile photo", err);
      }
    };
    fetchProfilePhoto();
  }, [user_id]);

  useEffect(() => {
    const fetchCoverPage = async () => {
      try {
        const response = await fetch(
          `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getcoverpage?user_id=${user_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch profile photo");
        }

        const data = await response.json();
        setCoverPage(data.coverPageUrl.S);
        localStorage.setItem("CoverPageUrl", data.coverPageUrl.S);
      } catch (error) {
        console.error("Error fetching CoverPage:", error);
      }
    };

    fetchCoverPage();
  }, [user_id]);

  const [savedDisplayName, setSavedDisplayName] = useState("");

  useEffect(() => {
    const fetchProfileDetails = async () => {
      try {
        const response = await fetch(
          `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getprofiledetails?user_id=${user_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch profile details");
        }

        const data = await response.json();
        setFullName(data.FullName.S || "");
        setInitialFullName(data.FullName.S || "");
        const fetchedStageName = data.StageName.S || "";
        setStageName(fetchedStageName);
        setInitialStageName(fetchedStageName);
        setBio(data.bio.S || "");
        setInitialBio(data.bio.S || "");
        setShowStageName(!!fetchedStageName);
        setSavedDisplayName(data.StageName.S || data.FullName.S || "");
      } catch (error) {
        console.error("Error fetching profile details:", error);
      }
    };

    fetchProfileDetails();
  }, [user_id]);

  useEffect(() => {
    const hasFieldChanges =
      fullName !== initialFullName ||
      (showStageName && stageName !== initialStageName) ||
      bio !== initialBio;
    setHasChanges(hasFieldChanges);
  }, [fullName, stageName, bio, showStageName, initialFullName, initialStageName, initialBio]);

  // Clean up stream when dialog closes
  useEffect(() => {
    return () => {
      if (stream) {
        console.log("Cleaning up stream on unmount");
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    };
  }, [stream]);

  const formatTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  };

  const validateFullName = (name) => {
    if (!name.trim()) {
      setErrors((prev) => ({
        ...prev,
        fullName: "Username cannot be empty",
      }));
      return false;
    }
    setErrors((prev) => ({
      ...prev,
      fullName: "",
    }));
    return true;
  };

  const validateStageName = (name) => {
    if (showStageName && !name.trim()) {
      setErrors((prev) => ({
        ...prev,
        stageName: "Stage name cannot be empty",
      }));
      return false;
    }
    setErrors((prev) => ({
      ...prev,
      stageName: "",
    }));
    return true;
  };

  const getWordCount = (text) => {
    return text.length;
  };

  const handleBioChange = (e) => {
    const newBio = e.target.value;
    const wordCount = getWordCount(newBio);

    if (wordCount <= 300 || newBio.length < bio.length) {
      setBio(newBio);
      validateBio(newBio);
    }
  };

  const handleStageNameClick = () => {
    if (!isEditing) {
      setTempStageName(stageName);
      setShowStageNameDialog(true);
    }
  };

  const validateBio = (bioText) => {
    const wordCount = getWordCount(bioText);
    if (wordCount > 300) {
      setErrors((prev) => ({
        ...prev,
        bio: "Bio cannot exceed 300 characters",
      }));
      return false;
    }
    setErrors((prev) => ({
      ...prev,
      bio: "",
    }));
    return true;
  };

  const capitalizeWords = (str) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
      .trim();
  };

  // const handleUpdate = async () => {
  //   const isFullNameValid = validateFullName(fullName);
  //   const isStageNameValid = showStageName ? validateStageName(stageName) : true;
  //   const isBioValid = validateBio(bio);

  //   if (!isFullNameValid || !isStageNameValid || !isBioValid) {
  //     return;
  //   }

  //   const hasChanges =
  //     fullName !== (FullName || "") ||
  //     (showStageName && stageName !== (StageName || "")) ||
  //     bio !== (localStorage.getItem("bio") || "");

  //   if (!hasChanges) {
  //     alert("Please update your profile");
  //     return;
  //   }

  //   try {

  //     const response = await fetch(
  //       "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/editprofile",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify(payload),
  //       }
  //     );

  //     const payload = {
  //       FullName: capitalizeWords(fullName),
  //       bio: bio,
  //       user_id: user_id,
  //       StageName: showStageName ? capitalizeWords(stageName) : undefined,
  //       updatedTimestamp: formatTimestamp(),
  //     };

     

  //     if (!response.ok) {
  //       throw new Error("Failed to update profile details");
  //     }

  //     localStorage.setItem("FullName", capitalizeWords(fullName));
  //     if (showStageName) {
  //       localStorage.setItem("StageName", capitalizeWords(stageName));
  //     }
  //     localStorage.setItem("bio", bio);

  //     setSavedDisplayName(
  //       showStageName ? capitalizeWords(stageName) : capitalizeWords(fullName)
  //     );
  //     setInitialFullName(capitalizeWords(fullName));
  //     setInitialStageName(showStageName ? capitalizeWords(stageName) : "");
  //     setInitialBio(bio);
  //     setOpenSuccessDialog(true);
  //     setTimeout(() => {
  //       setOpenSuccessDialog(false);
  //       setFullName(capitalizeWords(fullName));
  //       setStageName(showStageName ? capitalizeWords(stageName) : "");
  //       setBio(bio);
  //     }, 3000);
  //   } catch (error) {
  //     console.error("Error updating profile:", error);
  //     alert("Failed to update profile. Please try again.");
  //   }
  // };


  const handleUpdate = async () => {
  const isFullNameValid = validateFullName(fullName);
  const isStageNameValid = showStageName ? validateStageName(stageName) : true;
  const isBioValid = validateBio(bio);

  if (!isFullNameValid || !isStageNameValid || !isBioValid) {
    return;
  }

  const hasChanges =
    fullName !== (FullName || "") ||
    (showStageName && stageName !== (StageName || "")) ||
    bio !== (localStorage.getItem("bio") || "");

  if (!hasChanges) {
    alert("Please update your profile");
    return;
  }

  try {
    // Define payload before the fetch request
    const payload = {
      FullName: capitalizeWords(fullName),
      bio: bio,
      user_id: user_id,
      StageName: showStageName ? capitalizeWords(stageName) : "", // Use empty string instead of undefined for consistency with Flutter
      updatedTimestamp: formatTimestamp(),
    };

    const response = await fetch(
      "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/editprofile",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to update profile:", {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });
      throw new Error(`Failed to update profile: ${response.status} ${response.statusText}`);
    }

    // Update localStorage values
    localStorage.setItem("FullName", capitalizeWords(fullName));
    if (showStageName) {
      localStorage.setItem("StageName", capitalizeWords(stageName));
    }
    localStorage.setItem("bio", bio);

    setSavedDisplayName(
      showStageName ? capitalizeWords(stageName) : capitalizeWords(fullName)
    );
    setInitialFullName(capitalizeWords(fullName));
    setInitialStageName(showStageName ? capitalizeWords(stageName) : "");
    setInitialBio(bio);
    setOpenSuccessDialog(true);
    setTimeout(() => {
      setOpenSuccessDialog(false);
      setFullName(capitalizeWords(fullName));
      setStageName(showStageName ? capitalizeWords(stageName) : "");
      setBio(bio);
    }, 3000);
  } catch (error) {
    console.error("Error updating profile:", error);
    alert(error.message || "Failed to update profile. Please try again.");
  }
};

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const uploadImageToSignedUrl = async (url, file) => {
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error("Error in uploadImageToSignedUrl:", error);
      throw error;
    }
  };

  const handleImageUpload = async (file) => {
    try {
      if (!file) {
        throw new Error("No file selected");
      }
  
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file");
      }
  
      // Set temporary local URL for immediate display
      const tempImageUrl = URL.createObjectURL(file);
      setProfileImage(tempImageUrl);
      setImageFile(file);
  
      const updatedTimestamp = formatTimestamp();
      const fileName = `profile#${updatedTimestamp}`;
  
      // Generate presigned URL
      const presignedUrlResponse = await fetch(
        "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/generate-presigned-url/profilePhoto",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user_id,
            fileName: fileName,
          }),
        }
      );
  
      if (!presignedUrlResponse.ok) {
        throw new Error("Failed to generate presigned URL");
      }
  
      const presignedData = await presignedUrlResponse.json();
  
      if (!presignedData.url) {
        throw new Error("No presigned URL received");
      }
  
      // Upload image to S3
      const uploadResponse = await uploadImageToSignedUrl(
        presignedData.url,
        file
      );
  
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image to S3");
      }
  
      // Update profile photo URL in backend
      const updateUrlResponse = await fetch(
        "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/profilePhotoUrl",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user_id,
            fileName: fileName,
            updatedTimestamp: updatedTimestamp,
          }),
        }
      );
  
      if (!updateUrlResponse.ok) {
        throw new Error("Failed to update profile photo URL");
      }
  
      const updatedData = await updateUrlResponse.json();
      if (updatedData.profilePhotoUrl) {
        // Append a cache-busting query parameter to the URL
        const cacheBustedUrl = `${updatedData.profilePhotoUrl}?t=${Date.now()}`;
        setProfileImage(cacheBustedUrl);
        localStorage.setItem("ProfilePhotoUrl", cacheBustedUrl); // Update localStorage
        // Clean up temporary URL
        URL.revokeObjectURL(tempImageUrl);
      }
  
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
  
      // Re-fetch the profile photo to ensure consistency
      const fetchProfilePhoto = async () => {
        try {
          const response = await fetch(
            `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getprofilephoto?user_id=${user_id}`
          );
          const data = await response.json();
          const newProfilePhotoUrl = data.profilePhotoUrl?.S || null;
          if (newProfilePhotoUrl) {
            setProfileImage(`${newProfilePhotoUrl}?t=${Date.now()}`); // Add cache-busting parameter
            localStorage.setItem("ProfilePhotoUrl", newProfilePhotoUrl);
          } else {
            setProfileImage(null);
            localStorage.removeItem("ProfilePhotoUrl");
          }
        } catch (err) {
          console.error("Error re-fetching profile photo", err);
        }
      };
      fetchProfilePhoto();
  
    } catch (error) {
      console.error("Error uploading image:", error);
      // Revert to previous image or null if upload fails
      setProfileImage(null);
      localStorage.removeItem("ProfilePhotoUrl");
      alert(error.message || "Failed to upload image. Please try again.");
    }
  };

  // const handleImageUpload = async (file) => {
  //   try {
  //     if (!file) {
  //       throw new Error("No file selected");
  //     }

  //     if (!file.type.startsWith("image/")) {
  //       throw new Error("Please select an image file");
  //     }

  //     // Set temporary local URL for immediate display
  //     const tempImageUrl = URL.createObjectURL(file);
  //     setProfileImage(tempImageUrl);
  //     setImageFile(file);

  //     const updatedTimestamp = formatTimestamp();
  //     const fileName = `profile#${updatedTimestamp}`;

  //     // Generate presigned URL
  //     const presignedUrlResponse = await fetch(
  //       "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/generate-presigned-url/profilePhoto",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           user_id: user_id,
  //           fileName: fileName,
  //         }),
  //       }
  //     );

  //     if (!presignedUrlResponse.ok) {
  //       throw new Error("Failed to generate presigned URL");
  //     }

  //     const presignedData = await presignedUrlResponse.json();

  //     if (!presignedData.url) {
  //       throw new Error("No presigned URL received");
  //     }

  //     // Upload image to S3
  //     const uploadResponse = await uploadImageToSignedUrl(
  //       presignedData.url,
  //       file
  //     );

  //     if (!uploadResponse.ok) {
  //       throw new Error("Failed to upload image to S3");
  //     }

  //     // Update profile photo URL in backend
  //     const updateUrlResponse = await fetch(
  //       "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/profilePhotoUrl",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           user_id: user_id,
  //           fileName: fileName,
  //           updatedTimestamp: updatedTimestamp,
  //         }),
  //       }
  //     );

  //     if (!updateUrlResponse.ok) {
  //       throw new Error("Failed to update profile photo URL");
  //     }

  //     const updatedData = await updateUrlResponse.json();
  //     if (updatedData.profilePhotoUrl) {
  //       // Replace temporary URL with final S3 URL
  //       setProfileImage(updatedData.profilePhotoUrl);
  //       // Clean up temporary URL
  //       URL.revokeObjectURL(tempImageUrl);
  //     }

  //     if (fileInputRef.current) {
  //       fileInputRef.current.value = "";
  //     }
  //   } catch (error) {
  //     console.error("Error uploading image:", error);
  //     // Revert to previous image or null if upload fails
  //     setProfileImage(null);
  //     alert(error.message || "Failed to upload image. Please try again.");
  //   }
  // };

  // const handleImageUpload = async (file) => {
  //   try {
  //     if (!file) {
  //       throw new Error("No file selected");
  //     }

  //     if (!file.type.startsWith("image/")) {
  //       throw new Error("Please select an image file");
  //     }

  //     setImageFile(file);
  //     const updatedTimestamp = formatTimestamp();
  //     const fileName = `profile#${updatedTimestamp}`;

  //     const presignedUrlResponse = await fetch(
  //       "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/generate-presigned-url/profilePhoto",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           user_id: user_id,
  //           fileName: fileName,
  //         }),
  //       }
  //     );

  //     if (!presignedUrlResponse.ok) {
  //       throw new Error("Failed to generate presigned URL");
  //     }

  //     const presignedData = await presignedUrlResponse.json();

  //     if (!presignedData.url) {
  //       throw new Error("No presigned URL received");
  //     }

  //     const uploadResponse = await uploadImageToSignedUrl(
  //       presignedData.url,
  //       file
  //     );

  //     if (!uploadResponse.ok) {
  //       throw new Error("Failed to upload image to S3");
  //     }

  //     const updateUrlResponse = await fetch(
  //       "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/profilePhotoUrl",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           user_id: user_id,
  //           fileName: fileName,
  //           updatedTimestamp: updatedTimestamp,
  //         }),
  //       }
  //     );

  //     if (!updateUrlResponse.ok) {
  //       throw new Error("Failed to update profile photo URL");
  //     }

  //     const updatedData = await updateUrlResponse.json();
  //     if (updatedData.profilePhotoUrl) {
  //       setProfileImage(updatedData.profilePhotoUrl);
  //     }

  //     if (fileInputRef.current) {
  //       fileInputRef.current.value = "";
  //     }
  //     window.location.reload();
  //   } catch (error) {
  //     console.error("Error uploading image:", error);
  //     alert(error.message || "Failed to upload image. Please try again.");
  //   }
  // };

  const [showStageNameDialog, setShowStageNameDialog] = useState(false);
  const [previousStageName, setPreviousStageName] = useState("");
  const [isFirstInteraction, setIsFirstInteraction] = useState(true);
  const [canEdit, setCanEdit] = useState(true);
  const stageNameRef = useRef(null);
  const [key, setKey] = useState(0);

  const handleStageNameFocus = () => {
    setPreviousStageName(stageName);
    if (isFirstInteraction) {
      setShowStageNameDialog(true);
      console.log("handleStageNameFocus");
    }
  };

  const handleStageNameChange = (e) => {
    if (isEditing) {
      const newStageName = e.target.value;
      setStageName(newStageName);
      validateStageName(newStageName);
    }
  };

  const handleStageNameDialogCancel = () => {
    setShowStageNameDialog(false);
    setStageName(tempStageName);
    setIsEditing(false);
  };

  const handleStageNameDialogConfirm = () => {
    setShowStageNameDialog(false);
    setIsEditing(true);
    setTimeout(() => {
      if (stageNameRef.current) {
        stageNameRef.current.focus();
      }
    }, 100);
  };

  const handleStageNameBlur = () => {
    if (isEditing) {
      setIsEditing(false);
    }
  };

  const handleCoverPageClick = () => {
    coverPageInputRef.current.click();
  };

  const getInitials = (name) => {
    if (!name) return "";
    const names = name.split(" ");
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const menuOpen = Boolean(anchorEl);

  const handleEditIconClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRemoveProfileImage = async () => {
    try {
      const res = await fetch(
        "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/clearProfilePhoto",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id })
        }
      );
      if (!res.ok) throw new Error("Remove failed");
      
      setProfileImage(null);
      localStorage.removeItem("ProfilePhotoUrl");
  
      // Re-fetch the profile photo to ensure consistency
      const fetchProfilePhoto = async () => {
        try {
          const response = await fetch(
            `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getprofilephoto?user_id=${user_id}`
          );
          const data = await response.json();
          const newProfilePhotoUrl = data.profilePhotoUrl?.S || null;
          if (newProfilePhotoUrl) {
            setProfileImage(`${newProfilePhotoUrl}?t=${Date.now()}`);
            localStorage.setItem("ProfilePhotoUrl", newProfilePhotoUrl);
          } else {
            setProfileImage(null);
            localStorage.removeItem("ProfilePhotoUrl");
          }
        } catch (err) {
          console.error("Error re-fetching profile photo after removal", err);
        }
      };
      fetchProfilePhoto();
  
    } catch (err) {
      console.error("Error removing image", err);
      alert("Failed to remove profile image. Please try again.");
    }
  };

  // const handleRemoveProfileImage = async () => {
  //   try {
  //     const res = await fetch(
  //       "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/clearProfilePhoto",
  //       {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ user_id })
  //       }
  //     );
  //     if (!res.ok) throw new Error("Remove failed");
  //     setProfileImage(null);
  //     localStorage.removeItem("ProfilePhotoUrl");
  //     // window.location.reload();
  //   } catch (err) {
  //     console.error("Error removing image", err);
  //   }
  // };

  const handleCameraCapture = async () => {
    try {
      console.log("Requesting camera access");
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log("Camera stream obtained:", mediaStream);
      
      setStream(mediaStream);
      setIsCapturingForCover(false);
      setOpenCameraDialog(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          console.log("Assigning stream to video element");
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().then(() => {
            console.log("Video playback started");
          }).catch((err) => {
            console.error("Error playing video:", err);
            setCameraError("Failed to start video playback. Please try again.");
          });
        } else {
          console.error("Video element not available");
          setCameraError("Video element not found. Please try again.");
        }
      }, 100);

      handleClose();
    } catch (error) {
      console.error("Camera access error:", error);
      setCameraError("Camera not available or permission denied. Please check your camera settings.");
      setOpenCameraDialog(false);
    }
  };

  const handleCoverCameraCapture = async () => {
    try {
      console.log("Requesting camera access for cover");
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      console.log("Camera stream obtained for cover:", mediaStream);
      
      setStream(mediaStream);
      setIsCapturingForCover(true);
      setOpenCameraDialog(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          console.log("Assigning stream to video element for cover");
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().then(() => {
            console.log("Video playback started for cover");
          }).catch((err) => {
            console.error("Error playing video for cover:", err);
            setCameraError("Failed to start video playback. Please try again.");
          });
        } else {
          console.error("Video element not available for cover");
          setCameraError("Video element not found. Please try again.");
        }
      }, 100);

      handleCoverMenuClose();
    } catch (error) {
      console.error("Camera access error for cover:", error);
      setCameraError("Camera not available or permission denied. Please check your camera settings.");
      setOpenCameraDialog(false);
    }
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      console.log("Capturing photo");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          console.log("Photo captured, uploading");
          const file = new File([blob], `camera-${isCapturingForCover ? 'cover' : 'profile'}.jpg`, { type: "image/jpeg" });
          if (isCapturingForCover) {
            handleCoverPageUpload(file);
          } else {
            handleImageUpload(file);
          }
          handleCloseCameraDialog();
        } else {
          console.error("Failed to create blob");
          alert("Failed to capture photo.");
        }
      }, "image/jpeg");
    } else {
      console.error("Video or canvas not available");
      alert("Unable to capture photo. Please try again.");
    }
  };

  // const handleCameraCapture = async () => {
  //   try {
  //     console.log("Requesting camera access");
  //     setCameraError(null);
  //     const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
  //     console.log("Camera stream obtained:", mediaStream);
      
  //     // Set the stream and ensure the video element is ready
  //     setStream(mediaStream);
      
  //     // Wait for the dialog to open and video element to be available
  //     setOpenCameraDialog(true);
      
  //     // Ensure the video element is ready before assigning the stream
  //     setTimeout(() => {
  //       if (videoRef.current) {
  //         console.log("Assigning stream to video element");
  //         videoRef.current.srcObject = mediaStream;
  //         videoRef.current.play().then(() => {
  //           console.log("Video playback started");
  //         }).catch((err) => {
  //           console.error("Error playing video:", err);
  //           setCameraError("Failed to start video playback. Please try again.");
  //         });
  //       } else {
  //         console.error("Video element not available");
  //         setCameraError("Video element not found. Please try again.");
  //       }
  //     }, 100);

  //     handleClose();
  //   } catch (error) {
  //     console.error("Camera access error:", error);
  //     setCameraError("Camera not available or permission denied. Please check your camera settings.");
  //     setOpenCameraDialog(false);
  //   }
  // };

  // const handleCoverCameraCapture = async () => {
  //   try {
  //     console.log("Requesting camera access for cover");
  //     setCameraError(null);
  //     const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      
  //     console.log("Camera stream obtained for cover:", mediaStream);
      
  //     setStream(mediaStream);
  //     setOpenCameraDialog(true);
      
  //     setTimeout(() => {
  //       if (videoRef.current) {
  //         console.log("Assigning stream to video element for cover");
  //         videoRef.current.srcObject = mediaStream;
  //         videoRef.current.play().then(() => {
  //           console.log("Video playback started for cover");
  //         }).catch((err) => {
  //           console.error("Error playing video for cover:", err);
  //           setCameraError("Failed to start video playback. Please try again.");
  //         });
  //       } else {
  //         console.error("Video element not available for cover");
  //         setCameraError("Video element not found. Please try again.");
  //       }
  //     }, 100);

  //     handleCoverMenuClose();
  //   } catch (error) {
  //     console.error("Camera access error for cover:", error);
  //     setCameraError("Camera not available or permission denied. Please check your camera settings.");
  //     setOpenCameraDialog(false);
  //   }
  // };

  // const handleCapturePhoto = () => {
  //   const video = videoRef.current;
  //   const canvas = canvasRef.current;
  //   if (video && canvas) {
  //     console.log("Capturing photo");
  //     canvas.width = video.videoWidth;
  //     canvas.height = video.videoHeight;
  //     const ctx = canvas.getContext("2d");
  //     ctx.drawImage(video, 0, 0);
  //     canvas.toBlob((blob) => {
  //       if (blob) {
  //         console.log("Photo captured, uploading");
  //         const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
  //         // handleImageUpload(file);
  //         handleCoverPageUpload(file);
  //         handleCloseCameraDialog();
  //       } else {
  //         console.error("Failed to create blob");
  //         alert("Failed to capture photo.");
  //       }
  //     }, "image/jpeg");
  //   } else {
  //     console.error("Video or canvas not available");
  //     alert("Unable to capture photo. Please try again.");
  //   }
  // };

  

  const handleCloseCameraDialog = () => {
    console.log("Closing camera dialog");
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      console.log("Camera stream stopped");
    }
    setStream(null);
    setCameraError(null);
    setOpenCameraDialog(false);
  };

  const handleCoverPageUpload = async (file) => {
    try {
      if (!file) {
        throw new Error("No file selected");
      }

      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file");
      }

      const tempCoverUrl = URL.createObjectURL(file);
      setCoverPage(tempCoverUrl);

      const updatedTimestamp = formatTimestamp();
      const fileName = `CoverPage#${updatedTimestamp}`;

      const presignedUrlResponse = await fetch(
        "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/generate-presigned-url/coverPage",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user_id,
            fileName: fileName,
          }),
        }
      );

      if (!presignedUrlResponse.ok) {
        throw new Error("Failed to generate presigned URL for cover page");
      }

      const presignedData = await presignedUrlResponse.json();

      if (!presignedData.url) {
        throw new Error("No presigned URL received for cover page");
      }

      const uploadResponse = await uploadImageToSignedUrl(presignedData.url, file);

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload cover page to S3");
      }

      const updateUrlResponse = await fetch(
        "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/coverPageUrl",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user_id,
            fileName: fileName,
            updatedTimestamp: updatedTimestamp,
          }),
        }
      );

      if (!updateUrlResponse.ok) {
        throw new Error("Failed to update cover page URL");
      }

      const updatedData = await updateUrlResponse.json();

      if (updatedData.coverPageUrl) {
        const cacheBustedUrl = `${updatedData.coverPageUrl}?t=${Date.now()}`;
        setCoverPage(cacheBustedUrl);
        localStorage.setItem("CoverPageUrl", cacheBustedUrl);
        URL.revokeObjectURL(tempCoverUrl);
      }

      if (coverPageInputRef.current) {
        coverPageInputRef.current.value = "";
      }

      const fetchCoverPage = async () => {
        try {
          const response = await fetch(
            `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getcoverpage?user_id=${user_id}`
          );
          const data = await response.json();
          const newCoverPageUrl = data.coverPageUrl?.S || null;
          if (newCoverPageUrl) {
            setCoverPage(`${newCoverPageUrl}?t=${Date.now()}`);
            localStorage.setItem("CoverPageUrl", newCoverPageUrl);
          } else {
            setCoverPage(null);
            localStorage.removeItem("CoverPageUrl");
          }
        } catch (err) {
          console.error("Error re-fetching cover page", err);
        }
      };
      fetchCoverPage();
    } catch (error) {
      console.error("Error uploading cover page:", error);
      setCoverPage(null);
      localStorage.removeItem("CoverPageUrl");
      alert(error.message || "Failed to upload cover page. Please try again.");
    }
  };

  // const handleCoverPageUpload = async (file) => {
  //   try {
  //     if (!file) {
  //       throw new Error("No file selected");
  //     }

  //     if (!file.type.startsWith("image/")) {
  //       throw new Error("Please select an image file");
  //     }

  //     // Set temporary local URL for immediate display
  //     const tempCoverUrl = URL.createObjectURL(file);
  //     setCoverPage(tempCoverUrl);

  //     const updatedTimestamp = formatTimestamp();
  //     const fileName = `CoverPage#${updatedTimestamp}`;

  //     // Generate presigned URL
  //     const presignedUrlResponse = await fetch(
  //       "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/generate-presigned-url/coverPage",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           user_id: user_id,
  //           fileName: fileName,
  //         }),
  //       }
  //     );

  //     if (!presignedUrlResponse.ok) {
  //       throw new Error("Failed to generate presigned URL for cover page");
  //     }

  //     const presignedData = await presignedUrlResponse.json();

  //     if (!presignedData.url) {
  //       throw new Error("No presigned URL received for cover page");
  //     }

  //     // Upload image to S3
  //     const uploadResponse = await uploadImageToSignedUrl(
  //       presignedData.url,
  //       file
  //     );

  //     if (!uploadResponse.ok) {
  //       throw new Error("Failed to upload cover page to S3");
  //     }

  //     // Update cover page URL in backend
  //     const updateUrlResponse = await fetch(
  //       "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/coverPageUrl",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           user_id: user_id,
  //           fileName: fileName,
  //           updatedTimestamp: updatedTimestamp,
  //         }),
  //       }
  //     );

  //     if (!updateUrlResponse.ok) {
  //       throw new Error("Failed to update cover page URL");
  //     }

  //     const updatedData = await updateUrlResponse.json();

  //     if (updatedData.coverPageUrl) {
  //       // Replace temporary URL with final S3 URL
  //       setCoverPage(updatedData.coverPageUrl);
  //       // Clean up temporary URL
  //       URL.revokeObjectURL(tempCoverUrl);
  //       localStorage.setItem("CoverPageUrl", updatedData.coverPageUrl);
  //     }

  //     if (coverPageInputRef.current) {
  //       coverPageInputRef.current.value = "";
  //     }
  //   } catch (error) {
  //     console.error("Error uploading cover page:", error);
  //     // Revert to previous cover or default banner if upload fails
  //     setCoverPage(null);
  //     alert(error.message || "Failed to upload cover page. Please try again.");
  //   }
  // };

  // const handleCoverPageUpload = async (file) => {
  //   try {
  //     if (!file) {
  //       throw new Error("No file selected");
  //     }

  //     if (!file.type.startsWith("image/")) {
  //       throw new Error("Please select an image file");
  //     }

  //     const updatedTimestamp = formatTimestamp();
  //     const fileName = `CoverPage#${updatedTimestamp}`;

  //     const presignedUrlResponse = await fetch(
  //       "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/generate-presigned-url/coverPage",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           user_id: user_id,
  //           fileName: fileName,
  //         }),
  //       }
  //     );

  //     if (!presignedUrlResponse.ok) {
  //       throw new Error("Failed to generate presigned URL for cover page");
  //     }

  //     const presignedData = await presignedUrlResponse.json();

  //     if (!presignedData.url) {
  //       throw new Error("No presigned URL received for cover page");
  //     }

  //     const uploadResponse = await uploadImageToSignedUrl(
  //       presignedData.url,
  //       file
  //     );

  //     if (!uploadResponse.ok) {
  //       throw new Error("Failed to upload cover page to S3");
  //     }

  //     const updateUrlResponse = await fetch(
  //       "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/coverPageUrl",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           user_id: user_id,
  //           fileName: fileName,
  //           updatedTimestamp: updatedTimestamp,
  //         }),
  //       }
  //     );

  //     if (!updateUrlResponse.ok) {
  //       throw new Error("Failed to update cover page URL");
  //     }

  //     const updatedData = await updateUrlResponse.json();

  //     if (updatedData.coverPageUrl) {
  //       setCoverPage(updatedData.coverPageUrl);
  //       localStorage.setItem("CoverPageUrl", updatedData.coverPageUrl);
  //     }

  //     if (coverPageInputRef.current) {
  //       coverPageInputRef.current.value = "";
  //     }

  //     window.location.reload();
  //   } catch (error) {
  //     console.error("Error uploading cover page:", error);
  //     alert(error.message || "Failed to upload cover page. Please try again.");
  //   }
  // };

  const [coverAnchorEl, setCoverAnchorEl] = useState(null);
  const coverMenuOpen = Boolean(coverAnchorEl);

  const handleCoverEditIconClick = (event) => {
    event.stopPropagation();
    if (!coverAnchorEl) {
      setCoverAnchorEl(event.currentTarget);
    }
  };

  const handleCoverMenuClose = () => {
    setCoverAnchorEl(null);
  };

  const coverFileInputRef = useRef(null);

  const handleRemoveCoverImage = async () => {
    try {
      const res = await fetch(
        "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/clearCoverPagePhoto",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id }),
        }
      );
      if (!res.ok) throw new Error("Remove failed");

      setCoverPage(null);
      localStorage.removeItem("CoverPageUrl");

      const fetchCoverPage = async () => {
        try {
          const response = await fetch(
            `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getcoverpage?user_id=${user_id}`
          );
          const data = await response.json();
          const newCoverPageUrl = data.coverPageUrl?.S || null;
          if (newCoverPageUrl) {
            setCoverPage(`${newCoverPageUrl}?t=${Date.now()}`);
            localStorage.setItem("CoverPageUrl", newCoverPageUrl);
          } else {
            setCoverPage(null);
            localStorage.removeItem("CoverPageUrl");
          }
        } catch (err) {
          console.error("Error re-fetching cover page after removal", err);
        }
      };
      fetchCoverPage();
    } catch (err) {
      console.error("Error removing cover image", err);
      alert("Failed to remove cover image. Please try again.");
    }
  };

  // const handleRemoveCoverImage = async () => {
  //   try {
  //     const res = await fetch(
  //       "https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/clearCoverPagePhoto",
  //       {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ user_id })
  //       }
  //     );
  //     if (!res.ok) throw new Error("Remove failed");
  //     setCoverPage(null);
  //     localStorage.removeItem("CoverPageUrl");
  //     // window.location.reload();
  //   } catch (err) {
  //     console.error("Error removing cover image", err);
  //   }
  // };



  const handleCoverCapturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      console.log("Capturing cover photo");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          console.log("Cover photo captured, uploading");
          const file = new File([blob], "camera-cover.jpg", { type: "image/jpeg" });
          handleCoverPageUpload(file);
          handleCloseCameraDialog();
        } else {
          console.error("Failed to create blob for cover");
          alert("Failed to capture photo.");
        }
      }, "image/jpeg");
    } else {
      console.error("Video or canvas not available for cover");
      alert("Unable to capture photo. Please try again.");
    }
  };

  return (
    <Box display="flex">
      <SideBar />
      <Box className="edit">
        <Box className="edit__banner">
          <img
            src={coverPage || bannerImage}
            alt="Profile Banner"
            className="edit__banner-image"
          />
        </Box>
        {/* {localStorage.getItem("Category") !== "Listener" && ( */}
          <Box
            className="editIconContainer"
            sx={{
              backgroundColor: "#2644D9",
              marginRight: sidebarMargin,
              transition: "all 0.4s ease-in-out",
            }}
            onClick={handleCoverEditIconClick}
            style={{ cursor: "pointer",
               top:"222px"
             }}
          >
            <img src={Edit} alt="Edit" className="editIcon" />
            <input
              type="file"
              ref={coverPageInputRef}
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files[0];
                if (file) {
                  handleCoverPageUpload(file);
                }
              }}
              style={{ display: "none" }}
            />
            <Menu
               sx={{ marginleft: "-30px !important",
               
              }}
              anchorEl={coverAnchorEl}
              open={coverMenuOpen}
              onClose={handleCoverMenuClose}
              disableScrollLock
              PaperProps={{
                sx: {
                  backgroundColor: "#1e1e1e", // full background color
                  color: "white",
                  boxShadow: "0px 3px 10px rgba(0,0,0,0.3)",
                  borderRadius: "4px",
                  minWidth: "200px" // optional: ensure consistent width
                }
              }}
            >
              <MenuItem
                onClick={() => {
                  handleCoverMenuClose();
                  coverPageInputRef.current.click()
                  // coverFileInputRef.current.click();
                }}
              >
                Choose from Gallery
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleCoverCameraCapture();
                }}
              >
                Capture from Camera
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleCoverMenuClose();
                  handleRemoveCoverImage();
                }}
              >
                Remove Cover Image
              </MenuItem>
            </Menu>
          </Box>
        {/* )} */}

        <Box className="edit__info">
          <Box className="edit__avatar-container">
            <Avatar
              src={profileImage}
              alt="Profile"
              className="edit__avatar"
              sx={{ 
                // backgroundColor: profileImage ? "transparent" : "#222", fontSize: "48px"
                backgroundColor: profileImage ? "transparent" : "#222", fontSize: "48px",
                color: "white",
                fontWeight: "bold",
                fontSize: "50px",
                width: "120px !important", // Add this line to reduce width
                height: "120px !important", // Add this line to reduce height
               }}
            >
              {!profileImage && getInitials(StageName || FullName) /*getInitials(savedDisplayName)*/}
              {/* {!profileImage && getInitials(savedDisplayName)} */}
            </Avatar>
            <Box
              onClick={handleEditIconClick}
              // style={{ position: "absolute", bottom: 0, right: 20, cursor: "pointer"  }}
              style={{ 
                position: "absolute", 
                bottom: 0, 
                right: 0, 
                cursor: "pointer"
               }}
            >
              <img src={EditBg} alt="EditBg" style={{ width: 36, height: 36 }} />
              <img src={Edit} alt="Edit" style={{ position: "absolute", top: 10, left: 10, width: 16 }} />
            </Box>
            <input
              
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                e.preventDefault();
                const file = e.target.files[0];
                if (file) handleImageUpload(file);
              }}
            />
            <Menu 
            sx={{ marginLeft: "70px",
              marginTop: "-80px"
            }} anchorEl={anchorEl} open={menuOpen} onClose={handleClose}
            PaperProps={{
              sx: {
                backgroundColor: "#1e1e1e", // full background color
                color: "white",
                boxShadow: "0px 3px 10px rgba(0,0,0,0.3)",
                borderRadius: "4px",
                minWidth: "200px" // optional: ensure consistent width
              }
            }}
            >
           
              <MenuItem
              
                onClick={() => {
                  handleClose();
                  fileInputRef.current.click();
                }}
              >
                Choose from Gallery
              </MenuItem>
              <MenuItem
               
                onClick={() => {
                  handleCameraCapture();
                }}
              >
                Capture from Camera
              </MenuItem>
              <MenuItem
               
                onClick={() => {
                  handleClose();
                  handleRemoveProfileImage();
                }}
              >
                Remove Profile Image
              </MenuItem>
              
            </Menu>
          </Box>

          <Box className="edit__content">
            <Typography
              variant="h4"
              className="edit__title"
              style={{
                textDecoration: "underline",
                textDecorationColor: "white",
                textUnderlineOffset: "5px",
                textDecorationThickness: "2px",
              }}
            >
              Edit Profile
            </Typography>

            <Typography variant="h5" className="edit__subtitle">
              Update Details:
            </Typography>

            <Box className="edit__field-container">
              <Typography variant="h6" className="edit__field-label">
                Username
              </Typography>
              <TextField
                variant="filled"
                required
                name="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  validateFullName(e.target.value);
                }}
                error={!!errors.fullName}
                className="edit__field"
                sx={{
                  "& .MuiFilledInput-input": {
                    padding: "15px",
                  },
                  width: "499px !important",
                  maxWidth: "499px !important",
                }}
              />
              {errors.fullName && (
                <Typography
                  variant="body2"
                  sx={{
                    color: "red !important",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  {errors.fullName}
                </Typography>
              )}
            </Box>
            {showStageName && (
              <Box className="edit__field-container">
                <Typography variant="h6" className="edit__field-label">
                  Stage name
                </Typography>

                <TextField
                  inputRef={stageNameRef}
                  variant="filled"
                  required
                  name="stageName"
                  fullWidth
                  value={stageName}
                  onChange={handleStageNameChange}
                  onClick={handleStageNameClick}
                  onBlur={handleStageNameBlur}
                  InputProps={{
                    readOnly: !isEditing,
                  }}
                  error={!!errors.stageName}
                  className="edit__field"
                  sx={{
                    "& .MuiFilledInput-root": {
                      borderRadius: "10px !important",
                    },
                    "& .MuiFilledInput-input": {
                      padding: "15px",
                    },
                    width: "499px !important",
                    maxWidth: "499px !important",
                  }}
                />

                <Dialog
                  open={showStageNameDialog}
                  onClose={handleStageNameDialogCancel}
                  sx={{
                    "& .MuiDialog-paper": {
                      background: "#1C1B46",
                      borderRadius: "16px",
                      maxWidth: "300px",
                      width: "350px !important",
                      height: "180px !important",
                      margin: "20px",
                      padding: "24px",
                    },
                    "& .MuiBackdrop-root": {
                      backgroundColor: "rgba(0, 0, 0, 0.75)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        color: "white",
                        fontSize: "18px !important",
                        fontWeight: 600,
                        marginBottom: "8px",
                      }}
                    >
                      Warning
                    </Typography>
                    <Typography
                      sx={{
                        color: "white",
                        fontSize: "16px",
                        marginTop: "16px !important",
                      }}
                    >
                      Your identity with the audience will be changed.
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        gap: "32px",
                        justifyContent: "center",
                      }}
                    >
                      <Button
                        onClick={handleStageNameDialogCancel}
                        sx={{
                          color: "white",
                          fontSize: "16px",
                          textTransform: "none",
                          marginTop: "30px !important",
                          padding: "8px 16px",
                          "&:hover": {
                            background: "transparent",
                          },
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleStageNameDialogConfirm}
                        sx={{
                          color: "white",
                          fontSize: "16px",
                          textTransform: "none",
                          padding: "8px 16px",
                          marginTop: "30px !important",
                          "&:hover": {
                            background: "transparent",
                          },
                        }}
                      >
                        Yes
                      </Button>
                    </Box>
                  </Box>
                </Dialog>
              </Box>
            )}

            {localStorage.getItem("Category") !== "Listener" && (
              <Box className="edit__field-container">
                <Typography variant="h6" className="edit__field-label">
                  Bio
                </Typography>

                <TextField
                  variant="filled"
                  required
                  name="bio"
                  value={bio}
                  multiline
                  rows={2}
                  onChange={handleBioChange}
                  error={!!errors.bio}
                  helperText={errors.bio}
                  fullWidth
                  className="edit__field edit__field_height"
                  sx={{
                    width: "499px !important",
                    maxWidth: "499px !important",
                    '& .MuiInputBase-root': {
                      height: '70px !important',
                      minHeight: '70px !important'
                    }
                  }}
                />
                <Typography
                  variant="caption"
                  color={getWordCount(bio) >= 300 ? "error" : "textSecondary"}
                  sx={{
                    mb: 1,
                    display: "flex",
                    justifyContent: "flex-end",
                    mt: 1,
                    marginRight: "35px !important",
                    color: "white",
                  }}
                >
                  {getWordCount(bio)}/300 characters
                  {getWordCount(bio) >= 300 && (
                    <span style={{ marginLeft: "8px" }}>
                      (Maximum characters limit reached)
                    </span>
                  )}
                </Typography>
              </Box>
            )}

            <Box alignContent={"center"}>
              <Button
                variant="contained"
                onClick={handleUpdate}
                className="edit__update-button"
                disabled={!hasChanges || !!errors.fullName || (showStageName && !!errors.stageName) || !!errors.bio}
                sx={{
                  margin: "0 auto",
                  marginLeft: "135px",
                  display: "block",
                  backgroundColor: hasChanges && !errors.fullName && !(showStageName && errors.stageName) && !errors.bio ? "#1976d2 !important" : "gray !important",
                  "&:hover": {
                    backgroundColor: hasChanges && !errors.fullName && !(showStageName && errors.stageName) && !errors.bio ? "#1565c0 !important" : "gray !important",
                  },
                }}
              >
                Update
              </Button>
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
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
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
                    Profile updated successfully
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
                    <CheckIcon sx={{ color: "white", fontSize: "32px" }} />
                  </Box>
                </Box>
              </Dialog>

              <Dialog
                open={openCameraDialog}
                onClose={handleCloseCameraDialog}
                sx={{
                  "& .MuiDialog-paper": {
                    background: "#1C1B46",
                    borderRadius: "16px",
                    maxWidth: "600px",
                    width: "100%",
                    padding: "20px",
                  },
                  "& .MuiBackdrop-root": {
                    backgroundColor: "rgba(0, 0, 0, 0.75)",
                  },
                }}
              >
                <DialogContent>
                  <Typography
                    sx={{
                      color: "white",
                      fontSize: "18px",
                      fontWeight: 600,
                      mb: 2,
                    }}
                  >
                    Camera Preview
                  </Typography>
                  {cameraError ? (
                    <Typography sx={{ color: "red" }}>
                      {cameraError}
                    </Typography>
                  ) : stream ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      style={{ width: "100%", borderRadius: "8px", backgroundColor: "black" }}
                    />
                  ) : (
                    <Typography sx={{ color: "white" }}>
                      Opening camera...
                    </Typography>
                  )}
                  <canvas ref={canvasRef} style={{ display: "none" }} />
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={handleCloseCameraDialog}
                    sx={{
                      color: "white",
                      textTransform: "none",
                      "&:hover": { background: "transparent" },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCapturePhoto}
                    sx={{
                      color: "white",
                      textTransform: "none",
                      "&:hover": { background: "transparent" },
                    }}
                    disabled={!stream || !!cameraError}
                  >
                    Capture
                  </Button>
                </DialogActions>
              </Dialog>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default EditProfile;