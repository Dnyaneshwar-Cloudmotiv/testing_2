import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Box,
  Typography,
  Checkbox,
  TextField,
  Snackbar,
  IconButton,
} from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import "./ApprovalPage.css";
import logo from "./assets/bg-logo.png";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Logout from "@mui/icons-material/Logout";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import coverpage1 from "./assets/coverpage_new_1.png";
import coverpage2 from "./assets/coverpage_new_2.png";
import coverpage3 from "./assets/coverpage_new_3.png";
import coverpage4 from "./assets/coverpage_new_4.png";
import { signOut } from "aws-amplify/auth";
import CheckIcon from "@mui/icons-material/Check";

const ApprovalPage = () => {
  const { state } = useLocation(); // Use location to access passed state
  const {
    songName,
    StageName,
    FullName,
    EmailId,
    span,
    workflowId,
    song_id,
    user_id,
    decision,
    firebaseToken,
  } = state || {}; // Destructure the parameters
  const [audioQuality, setAudioQuality] = useState(false);
  const [contentChecked, setContentChecked] = useState(false);
  const [copyRight, setCopyRight] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [improvementFeedback, setImprovementFeedback] = useState(""); // New state for improvement feedback
  const [internal_remark, setInternalRemark] = useState(""); // New state for internal remark (matches backend field name)
  const [snackbarOpen, setSnackbarOpen] = useState(false); // Snackbar state
  const [snackbarMessage, setSnackbarMessage] = useState(""); // Snackbar message state
  const [imageFile, setImageFile] = useState(null); // To hold the file object
  const [fileName, setFileName] = useState(""); // State to hold file name for display

  const [coverPageUrl, setCoverPageUrl] = useState("");
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(decision === "Pending");
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [workflowDetails, setWorkflowDetails] = useState("");
  const [editReason, setEditReason] = useState(""); // New state for edit reason
  const [showEditReasonField, setShowEditReasonField] = useState(false); // Control visibility of edit reason field
  const [imageURL, setImageURL] = useState("");

  console.log(workflowDetails);
  console.log(songName);

  const colors = ["#0A5AF5", "#F50AD0", "#F5A50A", "#0AF52F"];

  async function handleSignOut() {
    try {
      await signOut();
      localStorage.removeItem("StageName");
      localStorage.removeItem("EmailId");
      localStorage.removeItem("FullName");
      localStorage.removeItem("Category");
      localStorage.removeItem("user_id");
      localStorage.removeItem("ActiveSubMenu");
      navigate("/landingpage");
    } catch (error) {
      console.log("error signing out: ", error);
    }
  }

  const handleBack = () => {
    // You can specify a route if needed, like: navigate('/another-page');
    navigate(-1); // This navigates back to the previous page in history
  };
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    navigate("/homepage");
    setAnchorEl(null);
  };
  const handleEditClick = () => {
    setIsEditMode(true);
    setShowEditReasonField(true); // Show the reason field on edit click
  };
  const fetchCoverPage = async (song_id) => {
    try {
      const response = await fetch(
        `https://6htqk6p035.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/song/getcoverpage?song_id=${song_id}`
      );
      if (!response.ok) throw new Error("Failed to fetch cover page URL");
      const data = await response.json();
      if (data.coverPageUrl && data.coverPageUrl.S) {
        // Check if coverPageUrl is present
        setCoverPageUrl(`${data.coverPageUrl.S}?t=${new Date().getTime()}`);
      }
    } catch (error) {
      console.error("Error fetching cover page URL:", error);
      setSnackbarMessage("Error fetching cover page URL.");
      setSnackbarOpen(true);
    }
  };

  const fetchWorkflowDetails = async (workflowId) => {
    try {
      const response = await fetch(
        `https://6htqk6p035.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/song/getworkflow?workflowId=${workflowId}`
      );
      if (!response.ok) throw new Error("Failed to fetch workflow details");
      const data = await response.json();
      setWorkflowDetails(data);
      setAudioQuality(data.audioQuality?.BOOL || false);
      setContentChecked(data.contentChecked?.BOOL || false);
      setCopyRight(data.copyRight?.BOOL || false);
      setRejectionReason(data.rejectionReason?.S || "");
      setImprovementFeedback(data.improvement?.S || "");
      setInternalRemark(data.internal_remark?.S || "");
      const editReasonValue = data.editReason?.S || "";
      setEditReason(editReasonValue);
      setShowEditReasonField(editReasonValue !== "");
    } catch (error) {
      console.error("Error fetching workflow details:", error);
      setSnackbarMessage("Error fetching workflow details.");
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    fetchCoverPage(song_id);
    fetchWorkflowDetails(workflowId);
  }, [song_id, workflowId]); // Fetch once when page loads

  // const handleGenerateImage = () => {
  //     // Create an off-screen canvas
  //     const canvas = document.createElement('canvas');
  //     canvas.width = 500;
  //     canvas.height = 500;
  //     const ctx = canvas.getContext('2d');

  //     // Pick a random color from the list
  //     const randomColor = colors[Math.floor(Math.random() * colors.length)];

  //     // Set the background color of the canvas
  //     ctx.fillStyle = randomColor;
  //     ctx.fillRect(0, 0, canvas.width, canvas.height);

  //     // Load the logo image
  //     const img = new Image();
  //     img.src = logo; // Ensure this path is correct

  //     // Function to wrap text
  //     const wrapText = (context, text, x, y, maxWidth, lineHeight, fontSize) => {
  //         const words = text.split(' ');
  //         let line = '';
  //         let lines = [];
  //         context.font = `${fontSize}px Pacifico`;

  //         for (let n = 0; n < words.length; n++) {
  //             let testLine = line + words[n] + ' ';
  //             let metrics = context.measureText(testLine);
  //             let testWidth = metrics.width;
  //             if (testWidth > maxWidth && n > 0) {
  //                 lines.push(line.trim());
  //                 line = words[n] + ' ';
  //             } else {
  //                 line = testLine;
  //             }
  //         }
  //         lines.push(line.trim());
  //         return lines;
  //     };

  //     // Use Promises to wait for the logo to load
  //     img.onload = () => {
  //         // Draw the logo in the top left corner
  //         const logoWidth = 120; // Set desired logo width
  //         const logoHeight = 100; // Set desired logo height
  //         const logoX = 20; // Position from left edge with some padding
  //         const logoY = 20; // Position from top edge with some padding

  //         // Draw the logo once it is loaded
  //         ctx.drawImage(img, logoX, logoY, logoWidth, logoHeight);

  //         // Set up text properties for song name
  //         const songFontSize = 60;
  //         const songLineHeight = 70;
  //         const songLines = wrapText(ctx, songName, canvas.width / 2, canvas.height / 2 - 10, canvas.width - 40, songLineHeight, songFontSize);

  //         // Draw song name (wrap if too long)
  //         ctx.fillStyle = 'white';
  //         ctx.textAlign = 'center';

  //         let yOffset = canvas.height / 2 - (songLines.length - 1) * songLineHeight / 2;
  //         songLines.forEach((line, index) => {
  //             ctx.fillText(line, canvas.width / 2, yOffset + index * songLineHeight);
  //         });

  //         // Set up text properties for full name (stage name)
  //         const fullNameFontSize = 50;
  //         const fullNameLineHeight = 60;
  //         const fullNameLines = wrapText(ctx, `Singer: ${StageName}`, canvas.width / 2, canvas.height / 2 + 40, canvas.width - 40, fullNameLineHeight, fullNameFontSize);

  //         // Draw stage name (wrap if too long)
  //         yOffset = canvas.height / 2 + (songLines.length * songLineHeight) + 10;
  //         fullNameLines.forEach((line, index) => {
  //             ctx.fillText(line, canvas.width / 2, yOffset + index * fullNameLineHeight);
  //         });

  //         // Convert the canvas to an image URL
  //         const dataURL = canvas.toDataURL('image/png');
  //         setImageURL(dataURL);
  //         convertDataURLToFileAndUpload(dataURL);
  //     };

  //     // Handle image loading error
  //     img.onerror = () => {
  //         console.error("Failed to load logo image.");
  //     };
  // };

  const backgroundImages = [coverpage1, coverpage2, coverpage3];

  // const handleGenerateImage = () => {
  //     // Create an off-screen canvas
  //     const canvas = document.createElement('canvas');
  //     canvas.width = 500;
  //     canvas.height = 500;
  //     const ctx = canvas.getContext('2d');

  //     // Pick a random background image from the array
  //     const randomImage = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];

  //     // Create image object for background
  //     const bgImg = new Image();
  //     bgImg.crossOrigin = "anonymous"; // If loading from different domain
  //     bgImg.src = randomImage;

  //     bgImg.onload = () => {
  //         // Draw background image
  //         ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  //         // Function to wrap text
  //         const wrapText = (context, text, x, y, maxWidth, lineHeight, fontSize) => {
  //             const words = text.split(' ');
  //             let line = '';
  //             let lines = [];
  //             context.font = `${fontSize}px Pacifico`;

  //             for (let n = 0; n < words.length; n++) {
  //                 let testLine = line + words[n] + ' ';
  //                 let metrics = context.measureText(testLine);
  //                 let testWidth = metrics.width;
  //                 if (testWidth > maxWidth && n > 0) {
  //                     lines.push(line.trim());
  //                     line = words[n] + ' ';
  //                 } else {
  //                     line = testLine;
  //                 }
  //             }
  //             lines.push(line.trim());
  //             return lines;
  //         };

  //         // Set up text properties for song name
  //         const songFontSize = 60;
  //         const songLineHeight = 70;
  //         const songLines = wrapText(ctx, songName, canvas.width / 2, canvas.height / 2 - 10, canvas.width - 40, songLineHeight, songFontSize);

  //         // Add a semi-transparent overlay to make text more readable
  //         // ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  //         // ctx.fillRect(0, 0, canvas.width, canvas.height);

  //         // Draw song name
  //         ctx.fillStyle = '#FFFFFF'; // Pure white color
  //         ctx.font = `bold ${songFontSize}px Pacifico`; // Added 'bold'
  //         ctx.textAlign = 'center';

  //         let yOffset = canvas.height / 2 - (songLines.length - 1) * songLineHeight / 2;
  //         songLines.forEach((line, index) => {
  //             ctx.fillText(line, canvas.width / 2, yOffset + index * songLineHeight);
  //         });

  //         // Set up text properties for stage name
  //         const fullNameFontSize = 50;
  //         const fullNameLineHeight = 60;

  //         // Check for N/A and null/undefined values
  //         const getDisplayName = () => {
  //             if (!StageName || StageName === "N/A") {
  //                 return FullName;
  //             }
  //             return StageName;
  //         };
  //         const displayName = getDisplayName();
  //         ctx.font = `bold ${fullNameFontSize}px Pacifico`;
  //         const fullNameLines = wrapText(ctx, `By: ${displayName}`, canvas.width / 2, canvas.height / 2 + 40, canvas.width - 40, fullNameLineHeight, fullNameFontSize);
  //         // console.log(FullName);
  //         // console.log(StageName);

  //         // Draw stage name
  //         yOffset = canvas.height / 2 + (songLines.length * songLineHeight) + 10;
  //         fullNameLines.forEach((line, index) => {
  //             ctx.fillText(line, canvas.width / 2, yOffset + index * fullNameLineHeight);
  //         });

  //         // Convert the canvas to an image URL
  //         const dataURL = canvas.toDataURL('image/png');
  //         setImageURL(dataURL);
  //         convertDataURLToFileAndUpload(dataURL);
  //     };

  //     // Handle background image loading error
  //     bgImg.onerror = () => {
  //         console.error("Failed to load background image.");
  //         setSnackbarMessage('Error loading background image');
  //         setSnackbarOpen(true);
  //     };
  // };

  const handleGenerateImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 500;
    const ctx = canvas.getContext("2d");

    const randomImage =
      backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    bgImg.src = randomImage;

    bgImg.onload = () => {
      // Draw background image
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      // Add a gradient overlay to make the middle portion lighter
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0, // Inner circle center and radius
        canvas.width / 2,
        canvas.height / 2,
        300 // Outer circle center and radius
      );
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.4)"); // Center: semi-transparent white
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // Edge: fully transparent

      // Apply gradient overlay
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Function to wrap text
      const wrapText = (context, text, maxWidth, fontSize) => {
        const words = text.split(" ");
        let lines = [];
        let currentLine = "";

        context.font = `bold ${fontSize}px Pacifico`;

        words.forEach((word) => {
          const testLine = currentLine + (currentLine ? " " : "") + word;
          const metrics = context.measureText(testLine);

          if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        lines.push(currentLine);
        return lines;
      };

      // Draw song name with shadow
      const songFontSize = 60;
      const songLines = wrapText(
        ctx,
        songName,
        canvas.width - 80,
        songFontSize
      );

      ctx.textAlign = "center";

      // Calculate starting Y position for song name
      let songY =
        canvas.height / 2 - ((songLines.length - 1) * songFontSize) / 1.5;

      // Add text shadow and draw song name
      songLines.forEach((line) => {
        // Draw shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.font = `bold ${songFontSize}px Pacifico`;
        ctx.fillText(line, canvas.width / 2 + 2, songY + 2);

        // Draw main text
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(line, canvas.width / 2, songY);
        songY += songFontSize;
      });

      // Draw "By: [name]" with shadow
      const artistFontSize = 40;
      const displayName =
        !StageName || StageName === "N/A" ? FullName : StageName;
      const artistText = `By: ${displayName}`;
      const artistLines = wrapText(
        ctx,
        artistText,
        canvas.width - 100,
        artistFontSize
      );

      let artistY = songY + 20;

      artistLines.forEach((line) => {
        // Draw shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.font = `bold ${artistFontSize}px Pacifico`;
        ctx.fillText(line, canvas.width / 2 + 2, artistY + 2);

        // Draw main text
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(line, canvas.width / 2, artistY);
        artistY += artistFontSize;
      });

      // Convert to image and trigger upload
      const dataURL = canvas.toDataURL("image/png");
      setImageURL(dataURL);
      convertDataURLToFileAndUpload(dataURL);
    };

    bgImg.onerror = () => {
      console.error("Failed to load background image.");
      setSnackbarMessage("Error loading background image");
      setSnackbarOpen(true);
    };
  };

  const convertDataURLToFileAndUpload = async (dataURL) => {
    try {
      // Convert data URL to Blob
      const response = await fetch(dataURL);
      const blob = await response.blob();

      // Create a File from the Blob
      const file = new File([blob], `CoverPage_${Date.now()}.png`, {
        type: "image/png",
      });

      // Now proceed to upload the image using your existing API logic
      await handleImageUpload(file);
    } catch (error) {
      console.error("Error converting image to file:", error);
      setSnackbarMessage("Error converting image to file.");
      setSnackbarOpen(true);
    }
  };

  const handleImageUpload = async (file) => {
    // const file = event.target.files[0];
    const fileName1 = `CoverPage_${Date.now()}`; // Adds a timestamp to make it unique
    const songFileName = `${songName}.mp3`;

    if (!file) {
      console.log("No file selected.");
      return;
    }

    console.log("Selected file:", file); // Log the file to check if it's defined
    setImageFile(file); // Set the file object to state
    setFileName(file.name); // Set the file name to separate state for easy display

    try {
      // Payload to get the signed URL
      const payload = {
        songName: songFileName,
        user_id,
        fileName: fileName1,
      };

      const response = await fetch(
        "https://6htqk6p035.execute-api.ap-south-1.amazonaws.com/voizadmin/generate-presigned-url/song/coverPage",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Failed to generate signed URL");
      const { url } = await response.json();

      // Proceed with uploading the image to the signed URL
      const uploadSuccess = await uploadImageToSignedUrl(url, file);

      if (uploadSuccess) {
        const formatTimestamp = () => {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
          const day = String(now.getDate()).padStart(2, "0");
          const hours = String(now.getHours()).padStart(2, "0");
          const minutes = String(now.getMinutes()).padStart(2, "0");
          const seconds = String(now.getSeconds()).padStart(2, "0");

          return `${year}${month}${day}_${hours}${minutes}${seconds}`;
        };

        const updatedTimestamp = formatTimestamp();
        // Final save cover page API call after successful upload
        const saveResponse = await fetch(
          "https://6htqk6p035.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/song/coverpage",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              songName: songFileName,
              song_id,
              user_id,
              fileName: fileName1,
              updatedTimestamp: updatedTimestamp,
            }),
          }
        );

        if (!saveResponse.ok)
          throw new Error("Failed to save cover page information");
        setSnackbarMessage("Cover page uploaded and saved successfully!");
        fetchCoverPage(song_id);
      } else {
        setSnackbarMessage("Failed to upload cover page.");
      }
    } catch (error) {
      console.error("Error uploading cover page:", error);
      setSnackbarMessage("Error uploading cover page.");
    } finally {
      setSnackbarOpen(true);
    }
  };

  const uploadImageToSignedUrl = async (url, file) => {
    if (!file) {
      console.log("Image file is null or undefined.");
      return false;
    }
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type }, // Use specific file type
        body: file,
      });
      if (!response.ok) throw new Error("Failed to upload image to signed URL");
      return true;
    } catch (error) {
      console.error("Error uploading image:", error);
      return false;
    }
  };

  const handleApprove = () => {
    if (showEditReasonField && editReason.trim() === "") {
      setSnackbarMessage("Reason for editing decision is mandatory");
      setSnackbarOpen(true);
      return;
    }

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

    const updatedTimestamp = formatTimestamp();

    const payload = {
      workflowId,
      songName, // Add songName to the payload
      decision: "Approved",
      audioQuality,
      contentChecked,
      copyRight,
      editReason,
      improvement: improvementFeedback,
      internal_remark, // Add internal_remark to the payload
      rejectionReason,
      updatedTimestamp,
      user_id, // Add user_id to the payload
    };

    fetch(
      "https://6htqk6p035.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/decision/approve",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setSnackbarMessage("Approved successfully!");
        setSnackbarOpen(true);

        // Create email payload
        const emailPayload = {
          email: EmailId,
          songTitle: songName,
          status: "Approved",
        };

        // Send email first
        return fetch(
          "https://dvb7tixsk1.execute-api.ap-south-1.amazonaws.com/voiz/sendEmail",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(emailPayload),
          }
        ).then(emailResponse => {
          if (!emailResponse.ok) {
            console.error("Failed to send email");
          } else {
            console.log("Email sent successfully");
            setSnackbarMessage(prev => prev + " Email sent successfully.");
            setSnackbarOpen(true);
          }
          
          // Then try to send notification if device token is available
          if (firebaseToken) {
            const notificationPayload = {
              deviceToken: firebaseToken,
              title: "Congratulations!!!",
              body: `Your song ${songName} has been approved`,
            };

            return fetch(
              "https://ni7k1cglnh.execute-api.ap-south-1.amazonaws.com/voiz/send-notification",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(notificationPayload),
              }
            ).then(notificationResponse => {
              if (!notificationResponse.ok) {
                console.error("Failed to send notification");
              } else {
                console.log("Notification sent successfully");
                setSnackbarMessage(prev => (prev || "") + " Notification sent successfully.");
                setSnackbarOpen(true);
              }
              return notificationResponse;
            });
          }
          return emailResponse;
        });
      })
      .then((emailResponse) => {
        if (!emailResponse.ok) {
          throw new Error("Email not sent");
        }
        console.log("Email sent successfully");
        setSnackbarMessage("Email sent successfully");
        setSnackbarOpen(true);

        // Navigate back after a delay
        setTimeout(
          () => navigate("/adminpage", { state: { tabValue: "2" } }),
          2000
        );
      })
      .catch((error) => {
        console.error("Error:", error);
        setSnackbarMessage("Error processing approval.");
        setSnackbarOpen(true);
      });
  };

  const handleReject = () => {
    if (rejectionReason.trim() === "") {
      setSnackbarMessage("Reason for rejection is mandatory");
      setSnackbarOpen(true);
      return;
    }
    if (showEditReasonField && editReason.trim() === "") {
      setSnackbarMessage("Reason for editing decision is mandatory");
      setSnackbarOpen(true);
      return;
    }

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

    const updatedTimestamp = formatTimestamp();

    const payload = {
      workflowId,
      songName,
      decision: "Rejected",
      audioQuality,
      contentChecked,
      copyRight,
      rejectionReason: rejectionReason,
      improvement: improvementFeedback,
      internal_remark,
      editReason,
      updatedTimestamp,
      user_id, // Add user_id to the payload
    };

    fetch(
      "https://6htqk6p035.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/decision/approve",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setSnackbarMessage("Rejected successfully!"); // Set the snackbar message
        setSnackbarOpen(true); // Open the snackbar

        // Create email payload
        const emailPayload = {
          email: EmailId,
          songTitle: songName,
          status: "Rejected",
          rejectionReason: rejectionReason,
        };

        // Send email first
        return fetch(
          "https://dvb7tixsk1.execute-api.ap-south-1.amazonaws.com/voiz/sendEmail",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(emailPayload),
          }
        ).then(emailResponse => {
          if (!emailResponse.ok) {
            console.error("Failed to send email");
          } else {
            console.log("Email sent successfully");
            setSnackbarMessage(prev => prev + " Email sent successfully.");
            setSnackbarOpen(true);
          }
          
          // Then try to send notification if device token is available
          if (firebaseToken) {
            const notificationPayload = {
              deviceToken: firebaseToken,
              title: "Song Update",
              body: `Your song ${songName} has been rejected. Reason: ${rejectionReason}`,
            };

            return fetch(
              "https://ni7k1cglnh.execute-api.ap-south-1.amazonaws.com/voiz/send-notification",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(notificationPayload),
              }
            ).then(notificationResponse => {
              if (!notificationResponse.ok) {
                console.error("Failed to send notification");
              } else {
                console.log("Notification sent successfully");
                setSnackbarMessage(prev => (prev || "") + " Notification sent successfully.");
                setSnackbarOpen(true);
              }
              return notificationResponse;
            });
          }
          return emailResponse;
        });
      })
      .then((emailResponse) => {
        if (!emailResponse.ok) {
          throw new Error("Email not sent");
        }
        console.log("Email sent successfully");
        setSnackbarMessage("Email sent successfully");
        setSnackbarOpen(true);

        // Navigate back after a delay
        setTimeout(
          () => navigate("/adminpage", { state: { tabValue: "3" } }),
          2000
        );
      })
      .catch((error) => {
        console.error("Error:", error);
        setSnackbarMessage("Error rejecting the song or sending notification.");
        setSnackbarOpen(true);
      });
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false); // Close snackbar
  };

  const isAllChecked = audioQuality && contentChecked && copyRight;
  const isAnyChecked = audioQuality || contentChecked || copyRight;

  return (
    <Box
      className="approval-page"
      sx={{ width: "100%", typography: "body1", padding: 3 }}
    >
      <Box className="admin-header">
        <img src={logo} alt="Logo" className="admin-logo" />
        <Box className="avtar" sx={{ marginLeft: "auto" }}>
          <Avatar
            sx={{ width: 66, height: 66 }}
            aria-controls={open ? "basic-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={handleClick}
          >
            A
          </Avatar>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              "aria-labelledby": "basic-button",
            }}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  overflow: "visible",
                  filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                  mt: 1.5,
                  "& .MuiAvatar-root": {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  "&::before": {
                    content: '""',
                    display: "block",
                    position: "absolute",
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: "background.paper",
                    transform: "translateY(-50%) rotate(45deg)",
                    zIndex: 0,
                  },
                },
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            sx={{ transform: "translateX(-10px)" }}
          >
            <MenuItem
              onClick={handleClose}
              sx={{ fontSize: "18px", margin: "15px" }}
            >
              {" "}
              <Avatar /> HomePage
            </MenuItem>
            <MenuItem
              onClick={handleSignOut}
              sx={{ fontSize: "18px", margin: "15px" }}
            >
              {" "}
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      <Box sx={{ marginTop: 5 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back
        </Button>
      </Box>
      <Card
        className="approvalCard"
        sx={{ width: 700, backgroundColor: "#d9d9d9" }}
      >
        <CardContent>
          <Typography variant="h6" align="center" gutterBottom>
            Quality Checklist
          </Typography>
          <Box
            sx={{ display: "flex", alignItems: "center", marginBottom: "15px" }}
          >
            {/* <CardMedia
                            component="img"
                            sx={{ width: 120, height: 140, borderRadius: '5px', marginRight: '15px' }}
                            image={coverImage}
                            alt="Cover Page"
                        /> */}
            {coverPageUrl ? (
              <img src={coverPageUrl} alt={songName} className="songCover" />
            ) : (
              <Avatar
                alt={songName}
                variant="square"
                sx={{
                  width: 120,
                  height: 140,
                  borderRadius: "5px",
                  marginRight: "15px",
                }}
              ></Avatar>
            )}
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="body1"
                sx={{ fontSize: "22px", color: "black !important" }}
              >
                {songName}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  marginTop: "5px",
                  fontSize: "16px",
                  color: "black !important",
                }}
              >
                {FullName}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  marginTop: "5px",
                  fontSize: "16px",
                  color: "black !important",
                }}
              >
                {EmailId}
              </Typography>
              <Box sx={{ marginTop: "5px" }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files[0];
                    if (file) {
                      handleImageUpload(file); // Make sure to pass the file correctly here
                    }
                  }}
                  style={{ display: "none" }} // Hide the default file input
                  id="file-upload"
                  disabled={!isEditMode}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="contained"
                    component="span"
                    sx={{ whiteSpace: "nowrap", marginRight: 5 }} // Ensure the text stays on one line
                    startIcon={<UploadFileIcon />}
                    disabled={!isEditMode}
                  >
                    Cover Page
                  </Button>
                </label>
                <Button
                  variant="contained"
                  component="span"
                  sx={{ whiteSpace: "nowrap" }} // Ensure the text stays on one line
                  startIcon={<UploadFileIcon />}
                  onClick={handleGenerateImage}
                  disabled={!isEditMode}
                >
                  Generate Image
                </Button>
              </Box>
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={{
                  marginLeft: "15px",
                  alignSelf: "flex-start",
                  fontSize: "16px",
                  color: "black !important",
                }}
              >
                {span}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" sx={{ gap: 2 }}>
            {/* Audio Quality Checkbox */}
            <Box display="flex" alignItems="center">
              <Checkbox
                checked={audioQuality}
                onChange={(e) => setAudioQuality(e.target.checked)}
                inputProps={{ "aria-label": "Audio Quality" }}
                disabled={!isEditMode}
                disableRipple
                icon={
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: "white", // Unchecked color
                      border: "2px solid #d9d9d9", // Border for unchecked
                      borderRadius: "4px",
                    }}
                  />
                }
                checkedIcon={
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: "white", // Checked color
                      border: "2px solid #d9d9d9", // Border for checked
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckIcon sx={{ color: "black", fontSize: 16 }} />{" "}
                    {/* Black tick */}
                  </Box>
                }
              />
              <Typography
                variant="body2"
                display="inline"
                sx={{ fontSize: "16px", color: "black !important" }}
              >
                Audio Quality
              </Typography>
            </Box>

            {/* Content Checked Checkbox */}
            <Box display="flex" alignItems="center">
              <Checkbox
                checked={contentChecked}
                onChange={(e) => setContentChecked(e.target.checked)}
                inputProps={{ "aria-label": "Content Checked" }}
                disabled={!isEditMode}
                disableRipple
                icon={
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: "white", // Unchecked color
                      border: "2px solid #d9d9d9", // Border for unchecked
                      borderRadius: "4px",
                    }}
                  />
                }
                checkedIcon={
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: "white", // Checked color
                      border: "2px solid #d9d9d9", // Border for checked
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckIcon sx={{ color: "black", fontSize: 16 }} />{" "}
                    {/* Black tick */}
                  </Box>
                }
              />
              <Typography
                variant="body2"
                display="inline"
                sx={{ fontSize: "16px", color: "black !important" }}
              >
                Content Checked
              </Typography>
            </Box>

            {/* Copyright & Legal Compliance Checkbox */}
            <Box display="flex" alignItems="center">
              <Checkbox
                checked={copyRight}
                onChange={(e) => setCopyRight(e.target.checked)}
                inputProps={{ "aria-label": "Copyright and Legal Compliance" }}
                disabled={!isEditMode}
                disableRipple
                icon={
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: "white", // Unchecked color
                      border: "2px solid #d9d9d9", // Border for unchecked
                      borderRadius: "4px",
                    }}
                  />
                }
                checkedIcon={
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: "white", // Checked color
                      border: "2px solid #d9d9d9", // Border for checked
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckIcon sx={{ color: "black", fontSize: 16 }} />{" "}
                    {/* Black tick */}
                  </Box>
                }
              />
              <Typography
                variant="body2"
                display="inline"
                sx={{ fontSize: "16px", color: "black !important" }}
              >
                Copyright & Legal Compliance
              </Typography>
            </Box>
          </Box>
          {/* <Box>
                        <Checkbox
                            checked={contentChecked}
                            onChange={(e) => setContentChecked(e.target.checked)}
                            inputProps={{ 'aria-label': 'Content Checked' }}
                        />
                        <Typography variant="body2" display="inline">Content Checked</Typography>
                    </Box>
                    <Box>
                        <Checkbox
                            checked={copyRight}
                            onChange={(e) => setcopyRight(e.target.checked)}
                            inputProps={{ 'aria-label': 'Copyright and Legal Compliance' }}
                        />
                        <Typography variant="body2" display="inline">Copyright and Legal Compliance</Typography>
                    </Box> */}

          <Box sx={{ marginTop: "15px" }}>
            <Typography
              variant="body2"
              sx={{ fontSize: "18px", color: "black !important" }}
              gutterBottom
            >
              Reason for rejection<span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              variant="outlined"
              fullWidth
              required
              multiline
              rows={1}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection"
              disabled={!isEditMode}
            />
          </Box>

          {/* Improvement feedback section */}
          <Box sx={{ marginTop: "15px" }}>
            <Typography
              variant="body2"
              sx={{ fontSize: "18px", color: "black !important" }}
              gutterBottom
            >
              How can you improve?
            </Typography>
            <TextField
              variant="outlined"
              fullWidth
              multiline
              rows={1}
              value={improvementFeedback}
              onChange={(e) => setImprovementFeedback(e.target.value)}
              placeholder="Enter your feedback here"
              disabled={!isEditMode}
            />
          </Box>


          <Box sx={{ marginTop: "15px" }}>
            <Typography
              variant="body2"
              sx={{ fontSize: "18px", color: "black !important" }}
              gutterBottom
            >
              Internal Remark
            </Typography>
            <TextField
              variant="outlined"
              fullWidth
              multiline
              rows={2}
              value={internal_remark}
              onChange={(e) => setInternalRemark(e.target.value)}
              placeholder="Enter internal remarks here"
              disabled={!isEditMode}
             
            />
          </Box>

          {showEditReasonField && (
            <Box sx={{ marginTop: "15px" }}>
              <Typography
                variant="body2"
                sx={{ fontSize: "18px", color: "black !important" }}
              >
                Reason for editing decision
                <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                required
                multiline
                rows={1}
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Enter your reason here"
                disabled={!isEditMode}
              />
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              marginTop: "20px",
            }}
          >
            <Button
              variant="contained"
              color="primary"
              sx={{ marginRight: "10px" }}
              onClick={handleApprove}
              disabled={!isAllChecked || !isEditMode}
            >
              Approve
            </Button>
            <Button
              variant="contained"
              color="secondary"
              sx={{ marginRight: "10px" }}
              onClick={handleReject}
              disabled={!isAnyChecked || !isEditMode}
            >
              Reject
            </Button>
            {decision !== "Pending" && (
              <Button
                variant="contained"
                color="secondary"
                sx={{ marginRight: "10px" }}
                onClick={handleEditClick}
              >
                Edit
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Snackbar for error messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage} // Update the message to show success or error
      />
    </Box>
  );
};

export default ApprovalPage;
