import React, { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import "./SongBasket.css";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Typography,
  TextField,
  Button,
  MenuItem,
  Divider,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import SideBar from "./SideBar";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import IconButton from "@mui/material/IconButton";

export default function SongBasket() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data } = location.state || {};

  // State to manage form data
  const [formData, setFormData] = useState({
    mood: "",
    story: "",
  });

  const inputRef = useRef(null);
  const minRows = 0;
  const maxRows = 6;
  const rowHeight = 24;
  const minHeight = 30;
  const maxHeight = rowHeight * maxRows;
  const lineHeight = 20;
  const [wordCount, setWordCount] = useState(0);

  const exceedsOneRow =
    formData.story &&
    (formData.story.length > 50 || formData.story.includes("\n"));

  // Load saved form data from sessionStorage on component mount
  useEffect(() => {
    const savedFormData = sessionStorage.getItem("songBasketFormData");
    if (savedFormData) {
      const parsedData = JSON.parse(savedFormData);
      setFormData(parsedData);
      // Initialize word count for saved story
      if (parsedData.story) {
        setWordCount(getWordCount(parsedData.story));
      }
    }
  }, []);

  // State for managing validation errors
  const [errors, setErrors] = useState({
    mood: "",
    story: "",
  });

  // Helper function to get word count
  const getWordCount = (text) => {
    // Remove extra spaces and split by whitespace
    const words = text.trim().split(/\s+/).filter((word) => word.length > 0);
    // Return 0 if it's empty string, otherwise return word count
    return text.trim() === "" ? 0 : words.length;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Dynamically adjust the height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      const newHeight = Math.min(
        Math.max(inputRef.current.scrollHeight, minHeight),
        maxHeight
      );
      inputRef.current.style.height = `${newHeight}px`;
    }

    // Handle word limit and show error message
    const wordCount = value.split(/\s+/).filter((word) => word).length;
    if (wordCount > 400) {
      // If it's the story field, trim to 400 words
      if (name === "story") {
        const words = value
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0);
        const processedText = words.slice(0, 400).join(" ");

        const updatedFormData = {
          ...formData,
          [name]: processedText,
        };
        setFormData(updatedFormData);
        setWordCount(400);
        setErrors((prev) => ({
          ...prev,
          story: "Maximum word limit reached!",
        }));
        sessionStorage.setItem(
          "songBasketFormData",
          JSON.stringify(updatedFormData)
        );
      }
    } else {
      if (name === "story") {
        const currentWordCount = getWordCount(value);
        const updatedFormData = {
          ...formData,
          [name]: value,
        };
        setFormData(updatedFormData);
        setWordCount(currentWordCount);
        setErrors((prev) => ({ ...prev, story: "" })); // Clear error when under limit
        sessionStorage.setItem(
          "songBasketFormData",
          JSON.stringify(updatedFormData)
        );
        validateStory(value);
      } else {
        const updatedFormData = {
          ...formData,
          [name]: value,
        };
        setFormData(updatedFormData);
        sessionStorage.setItem(
          "songBasketFormData",
          JSON.stringify(updatedFormData)
        );
      }
    }
  };

  const validateStory = (storyText) => {
    const currentWordCount = getWordCount(storyText);
    if (!storyText.trim()) {
      setErrors((prev) => ({
        ...prev,
        story: "Story behind song is required",
      }));
      return false;
    }
    if (currentWordCount > 400) {
      setErrors((prev) => ({
        ...prev,
        story: "Story cannot exceed 400 words",
      }));
      return false;
    }
    setErrors((prev) => ({
      ...prev,
      story: "",
    }));
    return true;
  };

  // Form validation
  const handleNext = () => {
    const { story } = formData;
    const newErrors = {};
    if (!story) newErrors.story = "Story behind song is required";
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      navigate("/uploadessentials", {
        state: {
          data: {
            ...data,
            ...formData,
          },
        },
      });
    }
  };

  return (
    <Box className="drawer">
      <SideBar />
      <Box className="formContainer">
        <Box sx={{ marginBottom: 10 }}>
          <Typography variant="h4" sx={{ color: "white", fontWeight: "700" }}>
            Song Basket
          </Typography>
        </Box>

        <TextField
          variant="filled"
          label={formData.mood ? "" : "Mood and Pace"}
          name="mood"
          value={formData.mood}
          onChange={handleChange}
          fullWidth
          sx={{
            marginBottom: 1,
            Top: 1,
            backgroundColor: "#d3d2d2 !important",
            borderRadius: "10px !important",
            height: "56px !important",
            color: "black !important",
            opacity: 1,
            fontFamily: "Poppins !important",
            letterSpacing: "1px !important",
            "& .MuiInputBase-root": {
              height: "56px",
              borderRadius: "10px !important",
              backgroundColor: "#d3d2d2 !important",
              boxShadow: "0px 0px 0px 1px transparent",
              "&:hover": {
                backgroundColor: "#d3d2d2 !important",
              },
              "&:focus-within": {
                boxShadow: "0px 0px 0px 2px #2782EE",
                backgroundColor: "#d3d2d2 !important",
              },
              "&:before, &:after": {
                display: "none !important",
              },
              "&:hover:before": {
                display: "none !important",
              },
              "&.Mui-focused": {
                borderRadius: "10px !important",
              },
              "&.Mui-filled": {
                borderRadius: "10px !important",
              },
            },
            "& .MuiInputBase-input": {
              height: "56px !important",
              padding: "0 12px !important",
              display: "flex",
              alignItems: "center",
              borderRadius: "10px !important",
            },
            "& .MuiInputLabel-root": {
              position: "absolute",
              left: "12px",
              top: "50% !important",
              transform: "translateY(-50%)",
              fontSize: "16px",
              color: "grey",
              pointerEvents: "none",
              transition: "all 0.2s ease-in-out",
              opacity: formData.mood ? 0 : 1,
              paddingLeft: "10px",
              color: "black !important",
              opacity: 1,
              fontFamily: "Poppins !important",
              letterSpacing: "1px !important",
            },
            "& .MuiInputLabel-shrink": {
              display: "none",
            },
            "& .MuiFilledInput-root": {
              borderRadius: "10px !important",
              "&:after": {
                display: "none !important",
              },
              "&:before": {
                display: "none !important",
              },
              "& .MuiFilledInput-input": {
                padding: "0 12px",
                height: "56px",
                display: "flex",
                alignItems: "center",
                backgroundColor: "#d3d2d2 !important",
                borderRadius: "10px !important",
                paddingLeft: "20px !important",
                color: "black !important",
                fontFamily: "Poppins !important",
                letterSpacing: "1px !important",
                "&:-webkit-autofill": {
                  "-webkit-box-shadow": "0 0 0 100px #d3d2d2 inset !important",
                  "-webkit-text-fill-color": "inherit !important",
                  "transition-delay": "9999s",
                  "transition-property": "background-color, color",
                },
                "&:-webkit-autofill:hover": {
                  "-webkit-box-shadow": "0 0 0 100px #d3d2d2 inset !important",
                },
                "&:-webkit-autofill:focus": {
                  "-webkit-box-shadow": "0 0 0 100px #d3d2d2 inset !important",
                },
                "&:-webkit-autofill:active": {
                  "-webkit-box-shadow": "0 0 0 100px #d3d2d2 inset !important",
                },
              },
            },
          }}
        />

        <TextField
          variant="filled"
          label={formData.story ? "" : "Story behind the song"}
          name="story"
          value={formData.story}
          onChange={handleChange}
          fullWidth
          multiline
          minRows={exceedsOneRow ? 2 : 1}
          maxRows={maxRows}
          className="story-textarea"
          sx={{
            marginBottom: 1,
            marginTop: 1,
            backgroundColor: "#d3d2d2 !important",
            borderRadius: "10px",
            height: exceedsOneRow ? "auto" : "56px !important",
            position: "relative",
            "& .MuiInputBase-root": {
              borderRadius: "10px",
              backgroundColor: "#d3d2d2 !important",
              boxShadow: "0px 0px 0px 1px transparent",
              minHeight: exceedsOneRow ? "auto" : "56px",
              paddingRight: "40px",
              "&:hover": {
                backgroundColor: "#d3d2d2 !important",
              },
              "&:focus-within": {
                boxShadow: "0px 0px 0px 2px #2782EE",
              },
              "&:before, &:after": {
                borderBottom: "none !important",
              },
              "&:hover:before": {
                borderBottom: "none !important",
              },
            },
            "& .MuiInputBase-input": {
              marginLeft: "4px",
              marginBottom: "12px",
              overflowY: "auto",
              maxHeight: `${maxHeight}px`,
              boxSizing: "border-box",
              minHeight: exceedsOneRow ? "auto" : "24px",
              lineHeight: "24px",
              paddingLeft: "6px !important",
              color: "black !important",
              fontFamily: "Poppins !important",
              letterSpacing: "1px !important",
            },
            "& .MuiInputLabel-root": {
              position: "absolute",
              left: "16px",
              top: "5px",
              transform: "none",
              fontSize: "16px",
              lineHeight: "24px",
              color: "grey",
              pointerEvents: "none",
              transition: "all 0.2s ease-in-out",
              display: formData.story ? "none" : "block",
              paddingLeft: "6px",
              paddingTop: "8px !important",
              color: "black !important",
              opacity: 1,
              fontFamily: "Poppins !important",
              letterSpacing: "1px !important",
            },
            "& .MuiInputLabel-shrink": {
              display: "none",
            },
            "& .MuiInputAdornment-root": {
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              height: "100%",
              maxHeight: "56px",
              pointerEvents: "auto",
              marginLeft: 0,
              paddingLeft: "8px",
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment
                position="end"
                sx={{
                  alignItems: "center",
                  marginRight: "-5px !important",
                }}
              >
                <Tooltip
                  placement="top-start"
                  title={
                    <div
                      style={{
                        backgroundColor: "#151415",
                        color: "white",
                        padding: "16px 0px 16px 16px",
                        borderRadius: "20px 20px 20px 0px",
                        minWidth: "180px",
                        fontFamily: "Arial, sans-serif",
                        fontSize: "12px",
                        lineHeight: "1.5",
                        position: "relative",
                        left: "20px",
                        bottom: "-20px",
                      }}
                    >
                      <Typography
                        style={{
                          fontWeight: "bold",
                          fontSize: "14px",
                          marginBottom: "8px",
                        }}
                      >
                        Information
                      </Typography>
                      <Typography>
                        What inspired you to <br /> make this song
                      </Typography>
                    </div>
                  }
                  componentsProps={{
                    tooltip: {
                      sx: {
                        background: "transparent",
                        boxShadow: "none",
                      },
                    },
                  }}
                >
                  <IconButton>
                    <InfoOutlinedIcon
                      sx={{ color: "black", cursor: "pointer" }}
                    />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />

        {(errors.story || true) && (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 0,
              marginLeft: "-20px",
            }}
          >
            <Typography
              variant="body2"
              className="error-message2"
              sx={{
                marginLeft: "135px !important",
                marginRight: "-10px",
                marginTop: "-5px !important",
                color: "red",
              }}
            >
              {errors.story}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                marginTop: "-5px !important",
                marginRight: "30px",
                color: "grey",
              }}
            >
              {getWordCount(formData.story)}/400 words
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "space-evenly !important",
            justifyContent: "center",
            marginBottom: 1,
            marginTop: 6,
          }}
        >
          <Divider
            sx={{
              flexGrow: 1,
              height: "3.5px !important",
              bgcolor: "white",
              width: " 70px !important",
              marginLeft: "60px !important",
            }}
          />
          <Divider
            sx={{
              flexGrow: 1,
              height: "3.5px",
              bgcolor: "white",
              width: " 70px !important",
              marginLeft: "20px !important",
            }}
          />
          <Divider
            sx={{
              flexGrow: 1,
              height: "3.5px",
              bgcolor: "gray",
              width: " 70px !important",
              marginLeft: "20px !important",
            }}
          />
          <Divider
            sx={{
              flexGrow: 1,
              height: "3.5px !important",
              bgcolor: "gray",
              width: "70px !important",
              marginLeft: "20px !important",
              marginRight: "60px !important",
            }}
          />
        </Box>
        <Button
          variant="contained"
          onClick={handleNext}
          color="primary"
          className="continueButton"
          sx={{
            fontWeight: "600 !important",
            borderRadius: 10,
            marginTop: 1,
            textTransform: "none",
            fontSize: "20px",
            backgroundColor: "#2644d9 !important",
            height: "46px !important",
            width: "300px !important",
          }}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}
