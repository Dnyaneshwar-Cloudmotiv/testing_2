import * as React from "react";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import "./SingleSong.css";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
} from "@mui/material";
import SideBar from "./SideBar";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

export default function AddSongPage() {
  const location = useLocation();
  const StageName = localStorage.getItem("StageName");
  const FullName = localStorage.getItem("FullName");
  const defaultName = StageName || FullName || "";
  const user_id = localStorage.getItem("user_id");
  const navigate = useNavigate();

  const [isFocused, setIsFocused] = useState(false); // Track focus state
  const [isGenreFocused, setIsGenreFocused] = useState(false); // Track genre focus state

  // State to manage form data
  const [formData, setFormData] = useState({
    name: defaultName,
    songName: "",
    language: "",
    genre: "", // Added genre field here
  });

  // Load saved form data from sessionStorage on component mount
  useEffect(() => {
    const savedFormData = sessionStorage.getItem("addSongFormData");
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData));
    }
  }, []);

  // State for managing validation errors
  const [errors, setErrors] = useState({
    name: "",
    songName: "",
    language: "",
    genre: "", // Added genre error field
  });

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value,
    };
    setFormData(updatedFormData);
    // Save to sessionStorage whenever form data changes
    sessionStorage.setItem("addSongFormData", JSON.stringify(updatedFormData));
  };

  // Helper function to capitalize first letter of each word
  const capitalizeFirstLetter = (text) => {
    if (!text) return "";
    return text
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };
  const [openDialog, setOpenDialog] = useState(false);
  const [duplicateSong, setDuplicateSong] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkDuplicateSongs = async () => {
    setIsLoading(true);
    try {
      const approvedResponse = await fetch(
        `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/approverList/decision?user_id=${user_id}&decision=Approved`
      );
      if (!approvedResponse.ok) throw new Error("Failed to fetch songs");
      const approvedSongs = await approvedResponse.json();

      const duplicate = Array.isArray(approvedSongs)
        ? approvedSongs.find(
            (song) =>
              song.songName.toLowerCase() === formData.songName.toLowerCase()
          )
        : null;

      return duplicate;
    } catch (error) {
      console.error("Error checking duplicates:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDuplicateSong(null);
  };

  const handleProceed = () => {
    handleCloseDialog();
    proceedToNext();
  };

  const proceedToNext = () => {
    const formattedData = {
      ...formData,
      songName: capitalizeFirstLetter(formData.songName),
    };
    navigate("/songbasket", {
      state: {
        data: formattedData,
      },
    });
  };

  const handleNext = async () => {
    const { name, songName, language, genre } = formData;
    const newErrors = {};
    if (!name) newErrors.name = "Name is required";
    if (!songName) newErrors.songName = "Song name is required";
    if (!language) newErrors.language = "Language is required";
    if (!genre) newErrors.genre = "Genre is required"; // Added genre validation
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const duplicate = await checkDuplicateSongs();
      if (duplicate) {
        setDuplicateSong(duplicate);
        setOpenDialog(true);
      } else {
        proceedToNext();
      }
    }
  };

  return (
    <Box className="drawer">
      <SideBar />
      <Box className="formContainer">
        <Box
          sx={{
            marginBottom: 10,
            marginBottom: "-40px !important",
            marginTop: "30px !important",
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: "white",
              fontWeight: "700",
            }}
          >
            About Your Song
          </Typography>
        </Box>

        <TextField
          variant="filled"
          name="name"
          fullWidth
          value={formData.name}
          InputProps={{
            readOnly: true,
          }}
          onChange={handleChange}
          sx={{
            backgroundColor: "#d3d2d2",
            borderRadius: "10px !important",
            height: "56px !important",
            paddingLeft: "10px !important",
            visibility: "hidden !important",

            "& .MuiFilledInput-root": {
              borderRadius: "10px !important",
              boxShadow: "0px 0px 0px 1px transparent",
              height: "56px",
              backgroundColor: "#d3d2d2 !important",

              "& .MuiFilledInput-input": {
                color: "black !important",
                fontFamily: "Poppins !important",
                letterSpacing: "1px !important",
                padding: "0 12px",
                height: "56px",
                display: "flex",
                alignItems: "center",
                backgroundColor: "#d3d2d2 !important",
                borderRadius: "10px !important",
              },

              "&:hover": {
                backgroundColor: "#d3d2d2 !important",
                borderBottom: "none !important",
                borderRadius: "10px !important",
              },
              "&:focus-within": {
                backgroundColor: "#d3d2d2 !important",
                borderRadius: "10px !important",
              },
              "&:before, &:after": {
                borderBottom: "none !important",
              },
              "&:hover:before": {
                borderBottom: "none !important",
              },
            },
          }}
        />
        {errors.name && (
          <Typography variant="body2" sx={{ color: "red", width: "100%" }}>
            {errors.name}
          </Typography>
        )}

        <TextField
          placeholder={!formData.songName ? "Song Name" : ""}
          name="songName"
          variant="filled"
          fullWidth
          value={formData.songName}
          onChange={handleChange}
          onFocus={(e) => e.target.setAttribute("placeholder", "")}
          onBlur={(e) =>
            !formData.songName &&
            e.target.setAttribute("placeholder", "Song Name")
          }
          sx={{
            backgroundColor: "#d3d2d2",
            borderRadius: "10px !important",
            height: "56px !important",
            "& .MuiFilledInput-root": {
              borderRadius: "10px !important",
              boxShadow: "0px 0px 0px 1px transparent",
              height: "56px",
              backgroundColor: "#d3d2d2 !important",
              "&:hover": {
                backgroundColor: "#d3d2d2 !important",
                borderBottom: "none !important",
                borderRadius: "10px !important",
              },
              "&:focus-within": {
                boxShadow: "0px 0px 0px 2px #2782EE",
                backgroundColor: "#d3d2d2 !important",
                borderRadius: "10px !important",
              },
              "&:before, &:after": {
                borderBottom: "none !important",
              },
              "&:hover:before": {
                borderBottom: "none !important",
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
                // Add these styles for autofill
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

            "& input::placeholder": {
              // paddingLeft: "10px",
              color: "black !important",
              opacity: 1,
              fontFamily: "Poppins !important",
              letterSpacing: "1px !important",
            },
          }}
        />
        {errors.songName && (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginTop: "-6px",
              marginLeft: "-30px !important",
            }}
          >
            <Typography variant="body2" className="error-message">
              {errors.songName}
            </Typography>
          </Box>
        )}

        <FormControl
          variant="filled"
          fullWidth
          sx={{
            marginTop: 1,
            backgroundColor: "#d3d2d2 !important",
            borderRadius: "10px",
            "& .MuiInputBase-root": {
              height: "56px", // Fixed height
              borderRadius: "10px",
              backgroundColor: "#d3d2d2 !important",
              boxShadow: "0px 0px 0px 1px transparent",
              "&:hover": {
                backgroundColor: "#d3d2d2 !important",
                borderBottom: "none !important",
              },
              "&:focus-within": {
                backgroundColor: "#d3d2d2 !important",
                boxShadow: "0px 0px 0px 2px #2782EE",
              },
              "&:before, &:after": {
                borderBottom: "none !important",
              },
              "&:hover:before": {
                borderBottom: "none !important",
              },
              "&:hover:after": {
                borderBottom: "none !important",
              },
            },
          }}
        >
          <InputLabel
            shrink={false}
            sx={{
              position: "absolute",
              left: "12px",
              top: isFocused || formData.language ? "8px" : "50%",
              transform:
                isFocused || formData.language ? "none" : "translateY(-50%)",
              fontSize: isFocused || formData.language ? "12px" : "16px",
              color: isFocused || formData.language ? "#2782EE" : "grey",
              transition: "all 0.2s ease-in-out",
              pointerEvents: "none",
              opacity: isFocused || formData.language ? 0 : 1,
              paddingLeft: "10px",
              color: "black !important",
              fontFamily: "Poppins !important",
              letterSpacing: "1px !important",
            }}
          >
            Language
          </InputLabel>
          <Select
            name="language"
            value={formData.language}
            onChange={(e) => handleChange(e)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            sx={{
              height: "56px",
              borderRadius: "10px",
              paddingLeft: "10px",
              color: "black !important",
              fontFamily: "Poppins !important",
              letterSpacing: "1px !important",
              "& .MuiSelect-icon": {
                // Style for the dropdown icon
                fontSize: "45px", // Increase icon size (adjust this value as needed)
                right: "12px",
                color: "black",
              },
              "& .MuiSelect-select": {
                height: "56px !important",
                padding: "0 12px !important",
                display: "flex",
                alignItems: "center",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "transparent",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderBottom: "none !important",
              },
              "&:focus-within .MuiOutlinedInput-notchedOutline": {
                borderColor: "#2782EE",
                borderBottom: "none !important",
              },
              "&:before, &:after": {
                border: "none !important",
              },
              "&:hover:before, &:hover:after": {
                border: "none !important",
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  maxHeight: 150,
                  width: 300,
                  backgroundColor: "#28282B",
                  color: "white",
                },
              },
            }}
          >
            <MenuItem value="Assamese">Assamese</MenuItem>
            <MenuItem value="Bengali">Bengali</MenuItem>
            <MenuItem value="Bhojpuri">Bhojpuri</MenuItem>
            <MenuItem value="English">English</MenuItem>
            <MenuItem value="Gujarati">Gujarati</MenuItem>
            <MenuItem value="Hindi">Hindi</MenuItem>
            <MenuItem value="Kannada">Kannada</MenuItem>
            <MenuItem value="Kashmiri">Kashmiri</MenuItem>
            <MenuItem value="Konkani">Konkani</MenuItem>
            <MenuItem value="Malayalam">Malayalam</MenuItem>
            <MenuItem value="Manipuri">Manipuri</MenuItem>
            <MenuItem value="Marathi">Marathi</MenuItem>
            <MenuItem value="Oriya">Oriya</MenuItem>
            <MenuItem value="Pahari">Pahari</MenuItem>
            <MenuItem value="Punjabi">Punjabi</MenuItem>
            <MenuItem value="Rajasthani">Rajasthani</MenuItem>
            <MenuItem value="Sanskrit">Sanskrit</MenuItem>
            <MenuItem value="Tamil">Tamil</MenuItem>
            <MenuItem value="Telugu">Telugu</MenuItem>
            <MenuItem value="Urdu">Urdu</MenuItem>
          </Select>
          {errors.language && (
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                mt: 0,
              }}
            >
              <Typography
                variant="body2"
                className="error-message2"
                sx={{
                  marginBottom: "-30px !important",
                  marginTop: "5px !important",
                  marginLeft: "-25% !important",
                  backgroundColor: "none !important",
                }}
              >
                {errors.language}
              </Typography>
            </Box>
          )}
        </FormControl>

        {/* Add Genre Field (copied from SongBasket) */}
        <FormControl
          variant="filled"
          fullWidth
          sx={{
            marginTop: 2,
            backgroundColor: "#d3d2d2",
            borderRadius: "10px !important",
            height: "56px !important",

            "& .MuiFilledInput-root": {
              borderRadius: "10px !important",
              boxShadow: "0px 0px 0px 1px transparent",
              height: "56px",
              backgroundColor: "#d3d2d2 !important",
              "&:hover": {
                backgroundColor: "#d3d2d2 !important",
                borderBottom: "none !important",
                borderRadius: "10px !important",
              },
              "&:focus-within": {
                boxShadow: "0px 0px 0px 2px #2782EE",
                backgroundColor: "#d3d2d2 !important",
                borderRadius: "10px !important",
              },
              "&:before, &:after": {
                borderBottom: "none !important",
              },
              "&:hover:before": {
                borderBottom: "none !important",
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
              },
            },
          }}
        >
          <InputLabel
            shrink={false}
            sx={{
              position: "absolute",
              left: "12px",
              top: isGenreFocused || formData.genre ? "8px" : "50%",
              transform:
                isGenreFocused || formData.genre ? "none" : "translateY(-50%)",
              fontSize: isGenreFocused || formData.genre ? "12px" : "16px",
              color: isGenreFocused || formData.genre ? "#2782EE" : "grey",
              transition: "all 0.2s ease-in-out",
              pointerEvents: "none",
              opacity: isGenreFocused || formData.genre ? 0 : 1,
              paddingLeft: "10px !important",
              color: "black !important",
              fontFamily: "Poppins !important",
              letterSpacing: "1px !important",
            }}
          >
            Genre
          </InputLabel>
          <Select
            name="genre"
            value={formData.genre}
            onChange={(e) => handleChange(e)}
            onFocus={() => setIsGenreFocused(true)}
            onBlur={() => setIsGenreFocused(false)}
            MenuProps={{
              PaperProps: {
                sx: {
                  maxHeight: 150,
                  width: 300,
                  backgroundColor: "#28282B",
                  color: "white",
                },
              },
            }}
            sx={{
              borderRadius: "10px",
              backgroundColor: "white",
              height: "56px",
              "& .MuiSelect-icon": {
                fontSize: "45px",
                right: "12px",
                color: "black",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "transparent",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "transparent",
              },
              "&:focus-within .MuiOutlinedInput-notchedOutline": {
                borderColor: "#2782EE",
              },
              "& .MuiSelect-select": {
                height: "56px !important",
                padding: "0 12px !important",
                display: "flex",
                alignItems: "center",
              },
            }}
          >
            <MenuItem value="Classical">Classical</MenuItem>
            <MenuItem value="Devotional">Devotional</MenuItem>
            <MenuItem value="Folk">Folk</MenuItem>
            <MenuItem value="Fusion">Fusion</MenuItem>
            <MenuItem value="Ghazal">Ghazal</MenuItem>
            <MenuItem value="Jazz">Jazz</MenuItem>
            <MenuItem value="Pop">Pop</MenuItem>
            <MenuItem value="Rabindra Sangeet">Rabindra Sangeet</MenuItem>
            <MenuItem value="Rap">Rap</MenuItem>
            <MenuItem value="Rock">Rock</MenuItem>
            <MenuItem value="Romantic">Romantic</MenuItem>
            <MenuItem value="Sufi">Sufi</MenuItem>
            {/* <MenuItem value="Kids">Kids</MenuItem> */}
            <MenuItem value="Others">Others</MenuItem>
          </Select>
          {errors.genre && (
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                mt: 0,
              }}
            >
              <Typography
                variant="body2"
                className="error-message1"
                sx={{
                  marginBottom: "-25px !important",
                  marginTop: "1px !important",
                  marginLeft: "-19% !important",
                  backgroundColor: "none !important",
                }}
              >
                {errors.genre}
              </Typography>
            </Box>
          )}
        </FormControl>

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
              bgcolor: "gray",
              width: " 70px !important",
              marginLeft: "20px !important",
            }}
          />
          <Divider
            sx={{
              flexGrow: 1,
              height: "3px",
              bgcolor: "gray",
              width: " 70px !important",
              marginLeft: "20px !important",
            }}
          />
          <Divider
            sx={{
              flexGrow: 1,
              height: "3px !important",
              bgcolor: "gray",
              width: "70px",
              marginLeft: "20px !important",
              marginRight: "60px !important",
            }}
          />
        </Box>

        <Button
          variant="contained"
          // color="primary"
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
          onClick={handleNext}
        >
          Next
        </Button>
      </Box>
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            bgcolor: "#1A1A1A",
            color: "white",
            width: "300px !important",
            height: "250px !important",
            borderRadius: "15px",
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: "center",
            fontSize: "24px",
            mt: "-20px",
            fontWeight: "bold",
          }}
        >
          Duplicate Song
          <br /> Detected
        </DialogTitle>
        <DialogContent>
          <Typography
            sx={{
              mb: 0,
              textAlign: "center",
              mt: "-15px !important",
              fontSize: "15px",
            }}
          >
            This song has already been <br></br>uploaded by you. Do you want to{" "}
            <br />
            continue ?
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{ justifyContent: "center", mb: "0px !important", gap: 5 }}
        >
          <Typography
            onClick={handleCloseDialog}
            sx={{
              color: "#1976d2 !important",
              fontSize: "18px !important",
              cursor: "pointer",
            }}
          >
            Cancel
          </Typography>
          <Typography
            onClick={handleProceed}
            sx={{
              color: "#1976d2 !important",
              fontSize: "18px !important",
              cursor: "pointer",
            }}
          >
            Proceed
          </Typography>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
