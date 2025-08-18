import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import SideBar from "./SideBar";
import Dialog from "@mui/material/Dialog";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import cross from "./assets/Cross.png";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarFeed from "./assets/star_feedback.png";
import StarFeedFill from "./assets/star_feedback_fill.png";

// Styled custom radio button that uses stars instead of numbers
const CustomRadio = styled(Radio)(({ theme }) => ({
  "& .MuiSvgIcon-root": {
    display: "none", // Hide the default radio icon
  },
  padding: 6,
  marginRight: theme.spacing(1),
}));

// Styled label for the radio button
const CustomFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  marginRight: theme.spacing(2),
  "& .MuiFormControlLabel-label": {
    padding: 0,
  },
}));

const Feedback = () => {
  const [experienceRating, setExperienceRating] = useState(0);
  const [contentRating, setContentRating] = useState(0);
  const [improvementText, setImprovementText] = useState("");
  const [shareIdeas, setShareIdeas] = useState("");
  const [motivationText, setMotivationText] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // State for sidebar collapse

  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);

  const [openErrorDialog, setOpenErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Function to update sidebarCollapsed state
  const updateSidebarState = () => {
    const sidebarState = localStorage.getItem("sidebarCollapsed");
    setSidebarCollapsed(sidebarState === "true");
  };

  // Sync sidebarCollapsed with localStorage on component mount and whenever it changes
  useEffect(() => {
    updateSidebarState(); // Initialize on mount

    // Listen for storage events to handle updates from other tabs or components
    const handleStorageChange = (event) => {
      if (event.key === "sidebarCollapsed") {
        updateSidebarState();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Update `sidebarCollapsed` when toggled within the same tab
  useEffect(() => {
    const interval = setInterval(updateSidebarState, 500);
    return () => clearInterval(interval);
  }, []);

  // Function to format the timestamp
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

  const handleSubmit = async () => {
  if (!experienceRating) {
    setErrorMessage("'How's your experience using Voiz app?' is required");
    setOpenErrorDialog(true);
    return;
  }
  if (experienceRating < 5 && !improvementText.trim()) {
    setErrorMessage("'How can we improve?' is required");
    setOpenErrorDialog(true);
    return;
  }

  if (!contentRating) {
    setErrorMessage("'How do you like the content?' is required");
    setOpenErrorDialog(true);
    return;
  }

  const user_id = localStorage.getItem("user_id");
  const createdTimestamp = formatTimestamp();
  const updatedTimestamp = formatTimestamp();

  const feedbackData = {
    user_id: user_id,
    experience: experienceRating.toString(),
    content: contentRating.toString(),
    improve: experienceRating < 5 ? improvementText : "NA",
    yourIdeas: shareIdeas,
    motivation: motivationText,
    createdTimestamp,
    updatedTimestamp,
  };

  console.log("Submitting Feedback:", feedbackData);

  try {
    const response = await fetch(
      "https://6p682bzafk.execute-api.ap-south-1.amazonaws.com/voiz/feedback",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackData),
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Feedback submitted successfully:", result);

    // Reset form state after successful submission
    setExperienceRating(0);
    setContentRating(0);
    setImprovementText("");
    setShareIdeas("");
    setMotivationText("");

    // Show success dialog
    setOpenSuccessDialog(true);
    setTimeout(() => {
      setOpenSuccessDialog(false);
      // Refresh the page to clear the form and start fresh
      window.location.reload();
    }, 3000);
  } catch (error) {
    console.error("Error submitting feedback:", error);
    alert("Failed to submit feedback. Please try again.");
  }
};

  // const handleSubmit = async () => {
  //   if (!experienceRating) {
  //     setErrorMessage("'How's your experience using Voiz app?' is required");
  //     setOpenErrorDialog(true);
  //     return;
  //   }
  //   if (experienceRating < 5 && !improvementText.trim()) {
  //     setErrorMessage("'How can we improve?' is required");
  //     setOpenErrorDialog(true);
  //     return;
  //   }

  //   if (!contentRating) {
  //     setErrorMessage("'How do you like the content?' is required");
  //     setOpenErrorDialog(true);
  //     return;
  //   }

  //   const user_id = localStorage.getItem("user_id");
  //   const createdTimestamp = formatTimestamp();
  //   const updatedTimestamp = formatTimestamp();

  //   const feedbackData = {
  //     user_id: user_id, // Replace with the actual user ID if available
  //     experience: experienceRating.toString(),
  //     content: contentRating.toString(),
  //     improve: experienceRating < 5 ? improvementText : "NA",
  //     yourIdeas: shareIdeas,
  //     motivation: motivationText,
  //     createdTimestamp,
  //     updatedTimestamp,
  //   };

  //   console.log("Submitting Feedback:", feedbackData);

  //   try {
  //     const response = await fetch(
  //       "https://6p682bzafk.execute-api.ap-south-1.amazonaws.com/voiz/feedback",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify(feedbackData),
  //       }
  //     );

  //     if (!response.ok) {
  //       throw new Error(`Error: ${response.statusText}`);
  //     }

  //     const result = await response.json();
  //     console.log("Feedback submitted successfully:", result);
  //     setOpenSuccessDialog(true);
  //     setTimeout(() => {
  //       setOpenSuccessDialog(false);
  //     }, 3000);
  //   } catch (error) {
  //     console.error("Error submitting feedback:", error);
  //     alert("Failed to submit feedback. Please try again.");
  //   }
  // };

  // Custom star rating component
  const renderStarRating = (value, selectedValue, onChange) => {
    return (
      <Box
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <IconButton
            key={star}
            onClick={() => onChange(star)}
            sx={{
              color: star <= selectedValue ? "#FFFFFF" : "#dae0eb",
              padding: "8px",
              transition: "all 0.2s",
              "&:hover": {
                transform: "scale(1.2)",
                color: star <= selectedValue ? "#FFFFFF" : "#FFFFFFF",
              },
            }}
          >
            <img 
              src={star <= selectedValue ? StarFeedFill : StarFeed} 
              alt={`${star} star`}
              style={{
                width: "46px", 
                height: "46px",
              }}
            />
            {/* {star <= selectedValue ? (
              <StarIcon sx={{ fontSize: "46px" }} />
            ) : (
              <StarBorderIcon sx={{ fontSize: "46px" }} />
            )} */}
          </IconButton>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ display: "flex", marginLeft: sidebarCollapsed ? 0 : -30 }}>
      <SideBar />
      <Box className="feedback" sx={{ flexGrow: 1, minWidth: 100, padding: 5 }}>
        <Typography
          variant="h4"
          sx={{
            marginBottom: "20px",
            textAlign: "center",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            fontWeight: 700,
            fontSize: "36px",
          }}
        >
          Feedback
        </Typography>

        {/* Question 1 - Experience Rating with Stars */}
        <Box
          sx={{
            textAlign: "center",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "#dae0eb",
              marginBottom: 1.5,
              fontSize: "20px",
              fontWeight: 600,
            }}
          >
            How's your experience using Voiz app?
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            {renderStarRating(
              experienceRating,
              experienceRating,
              setExperienceRating
            )}
          </Box>
        </Box>

        {/* Conditionally Show "How can we improve?" */}
        {experienceRating < 5 && experienceRating > 0 && (
          <Box
            sx={{
              textAlign: "center",
              marginBottom: "10px",
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: "#dae0eb", fontWeight: 600, fontSize: "20px" }}
            >
              How can we improve?
            </Typography>
            <TextField
              multiline
              rows={2}
              value={improvementText}
              onChange={(e) => setImprovementText(e.target.value)}
              sx={{
                marginTop: "10px",
                backgroundColor: "#dae0eb",
                borderRadius: "5px",
                "& .MuiOutlinedInput-root": {
                  width: "542px !important",
                  height: "91px !important",
                  marginLeft: "-65px !important",
                  "& fieldset": {
                    borderColor: "transparent",
                    width: "542px !important",
                    height: "91px !important",
                  },
                  "&:hover fieldset": {
                    borderColor: "transparent !important", // Explicitly remove hover border
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "transparent !important", // Remove focus border as well
                  },
                },
              }}
            />
          </Box>
        )}

        {/* Question 2 - Content Rating with Stars */}
        <Box
          sx={{
            textAlign: "center",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "#dae0eb",
              marginBottom: 1.5,
              fontSize: "20px",
              fontWeight: 600,
            }}
          >
            How do you like the content?*
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            {renderStarRating(contentRating, contentRating, setContentRating)}
          </Box>
        </Box>

        {/* Question 3 */}
        <Box sx={{ textAlign: "center", marginBottom: "20px" }}>
          <Typography
            variant="h6"
            sx={{ color: "#dae0eb", fontSize: "20px", fontWeight: 600 }}
          >
            Share your ideas:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={shareIdeas}
            onChange={(e) => setShareIdeas(e.target.value)}
            sx={{
              marginTop: "10px",
              backgroundColor: "#dae0eb",
              borderRadius: "5px",
              "& .MuiOutlinedInput-root": {
                width: "542px !important",
                height: "91px !important",
                marginLeft: "-65px !important",
                "& fieldset": {
                  borderColor: "transparent",
                  width: "542px !important",
                  height: "91px !important",
                },
                "&:hover fieldset": {
                  borderColor: "transparent !important", // Explicitly remove hover border
                },
                "&.Mui-focused fieldset": {
                  borderColor: "transparent !important", // Remove focus border as well
                },
              },
            }}
          />
        </Box>

        {/* Question 4 */}
        <Box
          sx={{
            textAlign: "center",
            marginBottom: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              width: "553px",
              height: "60px",
              textAlign: "center",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "#dae0eb",
                fontSize: "20px",
                fontWeight: 600,
                marginBottom: 2,
              }}
            >
              What would motivate you to share our app with friends and family?
            </Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={motivationText}
            onChange={(e) => setMotivationText(e.target.value)}
            sx={{
              marginTop: "10px",
              marginLeft: "-130px !important",
              backgroundColor: "#dae0eb",
              borderRadius: "5px",
              "& .MuiOutlinedInput-root": {
                width: "542px !important",
                height: "91px !important",
                "& fieldset": {
                  borderColor: "transparent",
                  width: "542px !important",
                  height: "91px !important",
                },
                "&:hover fieldset": {
                  borderColor: "transparent !important",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "transparent !important",
                },
              },
            }}
          />
        </Box>

        {/* Submit Button */}
        <Box sx={{ textAlign: "center", marginTop: 2 }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              textTransform: "none",
              color: "white",
              fontSize: "24px !important",
              fontWeight: 700,
              borderRadius: "24px",
              paddingX: 4,
              width: "312px !important",
              height: "52px !important",
              backgroundColor: "#2644d9 !important",
              "&:hover": {
                backgroundColor: "#2644d9 !important",
              },
            }}
          >
            Submit
          </Button>
        </Box>
      </Box>
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
            Thank you for your feedback
            <br />
            in helping us improve
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
      {/* Error Dialog */}
      <Dialog
        open={openErrorDialog}
        onClose={() => setOpenErrorDialog(false)}
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
          onClick={() => setOpenErrorDialog(false)}
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
            {errorMessage}
          </Typography>
        </Box>
      </Dialog>
    </Box>
  );
};

export default Feedback;
