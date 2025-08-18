import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import "./UploadEssentials.css";
import { useNavigate, useLocation } from "react-router-dom";
import { Typography, TextField, Button, Divider } from "@mui/material";
import SideBar from "./SideBar";

export default function UploadEssentials() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data } = location.state || {};

  // State to manage form data
  const [formData, setFormData] = useState({
    singer: "",
    producer: "",
    lyricist: "",
    composer: "",
  });

  // Load saved form data from sessionStorage on component mount
  useEffect(() => {
    const savedFormData = sessionStorage.getItem("uploadEssentialsFormData");
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData));
    }
  }, []);

  // State for managing validation errors
  const [errors, setErrors] = useState({
    singer: "",
    producer: "",
    lyricist: "",
    composer: "",
  });

  // Helper function to capitalize first letter of each word
  const capitalizeWords = (str) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
      .trim();
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Keep unformatted value for display
    const updatedFormData = {
      ...formData,
      [name]: value, // Original value for display
    };

    // Format data for storage
    const formattedFormData = {
      ...formData,
      [name]: capitalizeWords(value), // Formatted value for storage
    };

    setFormData(updatedFormData); // Set unformatted data for display

    // Store formatted data in sessionStorage
    sessionStorage.setItem(
      "uploadEssentialsFormData",
      JSON.stringify(formattedFormData) // Save formatted data
    );
  };

  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  //   const updatedFormData = {
  //     ...formData,
  //     [name]: value,
  //   };
  //   setFormData(updatedFormData);
  //   // Save to sessionStorage whenever form data changes
  //   sessionStorage.setItem(
  //     "uploadEssentialsFormData",
  //     JSON.stringify(updatedFormData)
  //   );
  // };

  // Form validation
  const handleNext = () => {
    const { singer, producer, lyricist, composer } = formData;
    const newErrors = {};
    if (!singer) newErrors.singer = "Singer is required";
    if (!producer) newErrors.producer = "Producer is required";
    if (!lyricist) newErrors.lyricist = "Lyricist is required";
    if (!composer) newErrors.composer = "Composer is required";
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Format the data again before sending to ensure consistency
      const formattedData = {
        singer: capitalizeWords(singer),
        producer: capitalizeWords(producer),
        lyricist: capitalizeWords(lyricist),
        composer: capitalizeWords(composer),
      };

      navigate("/uploadcheck", {
        state: {
          data: {
            ...data,
            ...formattedData,
          },
        },
      });
    }
  };

  // const handleNext = () => {
  //   const { singer, producer, lyricist, composer } = formData;
  //   const newErrors = {};
  //   if (!singer) newErrors.singer = "Singer is required";
  //   if (!producer) newErrors.producer = "Producer is required";
  //   if (!lyricist) newErrors.lyricist = "Lyricist is required";
  //   if (!composer) newErrors.composer = "Composer is required";
  //   setErrors(newErrors);

  //   if (Object.keys(newErrors).length === 0) {
  //     navigate("/uploadcheck", {
  //       state: {
  //         data: {
  //           ...data,
  //           ...formData,
  //         },
  //       },
  //     });
  //   }
  // };

  return (
    <Box className="drawer">
      <SideBar />
      <Box className="formContainer">
        <Typography
          variant="h4"
          sx={{
            color: "white",
            marginBottom: 3,
            // marginTop: "20px",
            fontWeight: "700",
          }}
        >
          Update Credits
        </Typography>
      

        <TextField
          variant="filled"
          label={formData.singer ? "" : "Singer"}
          name="singer"
          fullWidth
          value={formData.singer}
          onChange={handleChange}
          onFocus={() => {}}
          onBlur={() => {}}
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
        {errors.singer && (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginTop: "-8px",
              marginLeft: "-48px",
            }}
          >
            <Typography variant="body2" className="error-message6">
              {errors.singer}
            </Typography>
          </Box>
        )}
        <TextField
          variant="filled"
          label={formData.composer ? "" : "Composer"}
          name="composer"
          fullWidth
          value={formData.composer}
          onChange={handleChange}
          onFocus={() => {}}
          onBlur={() => {}}
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
        {errors.composer && (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginTop: "-8px",
              marginLeft: "-22px",
            }}
          >
            <Typography variant="body2" className="error-message6">
              {errors.composer}
            </Typography>
          </Box>
        )}

        <TextField
          variant="filled"
          label={formData.lyricist ? "" : "Lyricist"}
          name="lyricist"
          fullWidth
          value={formData.lyricist}
          onChange={handleChange}
          onFocus={() => {}}
          onBlur={() => {}}
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
        {errors.lyricist && (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginTop: "-8px",
              marginLeft: "-26px",
            }}
          >
            <Typography variant="body2" className="error-message5">
              {errors.lyricist}
            </Typography>
          </Box>
        )}

        <TextField
          variant="filled"
          label={formData.producer ? "" : "Producer"}
          name="producer"
          fullWidth
          value={formData.producer}
          onChange={handleChange}
          onFocus={() => {}}
          onBlur={() => {}}
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
        {errors.producer && (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginTop: "-8px",
              marginLeft: "-22px",
            }}
          >
            <Typography variant="body2" className="error-message6">
              {errors.producer}
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
              height: "3px !important",
              bgcolor: "white",
              width: " 70px !important",
              marginLeft: "60px !important",
            }}
          />
          <Divider
            sx={{
              flexGrow: 1,
              height: "3px",
              bgcolor: "white",
              width: " 70px !important",
              marginLeft: "20px !important",
            }}
          />
          <Divider
            sx={{
              flexGrow: 1,
              height: "3px",
              bgcolor: "white",
              width: " 70px !important",
              marginLeft: "20px !important",
            }}
          />
          <Divider
            sx={{
              flexGrow: 1,
              height: "3px",
              bgcolor: "gray",
              width: "70px",
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
            fontSize: "20px !important",
          }}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}
