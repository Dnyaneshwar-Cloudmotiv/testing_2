import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Tooltip,
  Link,
} from "@mui/material";
import logo from "./assets/new-logo.png";
import "./UserDetails.css";
import Divider from "@mui/material/Divider";
import { signOut } from "aws-amplify/auth";
import { useNavigate, useLocation } from "react-router-dom";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import IconButton from "@mui/material/IconButton";
import "@fontsource/open-sans/500.css"; // Medium
import "@fontsource/open-sans/600.css"; // Semi-bold
import "@fontsource/open-sans/700.css";

export default function UserDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email } = location.state || {};

  const [isFocused, setIsFocused] = useState(false);

  // Check mandate details on component load
  // In UserDetails.js - modify useEffect for mandate check
  useEffect(() => {
    const checkUserAndMandateDetails = async () => {
      try {
        // Get email from state or localStorage
        const userEmail =
          location.state?.email || localStorage.getItem("EmailId");

        if (!userEmail) {
          console.error("No email found in state or localStorage");
          navigate("/signup");
          return;
        }

        // First, try to fetch the user ID using the email
        let userId =
          location.state?.userId ||
          localStorage.getItem("userId") ||
          localStorage.getItem("user_id");

        // If no userId, we MUST create the user in DynamoDB first
        if (!userId) {
          console.log(
            "No userId found, attempting to create user with email:",
            userEmail
          );

          try {
            // Create user in DynamoDB - ENSURE THIS HAPPENS FIRST
            const createResponse = await fetch(
              "https://i3lmfmc1h2.execute-api.ap-south-1.amazonaws.com/voizpost/save/usernew",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  EmailId: userEmail,
                }),
              }
            );

            console.log(
              "Create user API response status:",
              createResponse.status
            );

            // For new user
            if (createResponse.ok) {
              const createData = await createResponse.json();
              userId = createData.user_id;
              console.log("User created with ID:", userId);
              localStorage.setItem("userId", userId);
            }
            // For existing user (409)
            else if (createResponse.status === 409) {
              console.log("User already exists, fetching the userId");
              const userIdResponse = await fetch(
                `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/userId?email=${userEmail}`
              );

              if (userIdResponse.ok) {
                const userData = await userIdResponse.json();
                if (userData && userData.length > 0) {
                  userId = userData[0].user_id?.S;
                  console.log("Retrieved existing userId:", userId);
                  localStorage.setItem("userId", userId);
                }
              }
            }
          } catch (error) {
            console.error("Error creating or fetching user:", error);
          }
        }

        // Now check mandate details with the userId, but ONLY if we have a userId
        if (userId) {
          console.log("Checking mandate details with userId:", userId);

          const response = await fetch(
            `https://i3lmfmc1h2.execute-api.ap-south-1.amazonaws.com/voizpost/save/getmandate?user_id=${userId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            console.error(
              "Failed to fetch mandate details, status:",
              response.status
            );
            return; // Don't redirect, let user fill out the form
          }

          const data = await response.json();
          console.log("Mandate details:", data);

          // Only redirect if mandate details already filled
          if (data.FillMandateDetails === true) {
            navigate("/homepage");
          }
        } else {
          console.error(
            "Could not determine userId, staying on UserDetails page"
          );
        }
      } catch (error) {
        console.error("Error in checkUserAndMandateDetails:", error);
      }
    };

    checkUserAndMandateDetails();
  }, [navigate, location.state]);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      navigate("/signup", {
        state: {
          message: "Please complete the signup process first.",
        },
      });
    }
  }, [email, navigate]);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    category: "",
    gender: "",
    age: "",
    stageName: "",
  });

  const [error, setError] = useState({
    name: "",
    phone: "",
    category: "",
    gender: "",
    age: "",
  });

  useEffect(() => {
    setError({
      name: "",
      phone: "",
      category: "",
      gender: "",
      age: "",
    });
  }, [formData]);

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "age") {
      if (/^\d{0,2}$/.test(value)) {
        setFormData({
          ...formData,
          [name]: value,
        });
      }
    } else if (name === "phone") {
      if (/^\d*$/.test(value) && value.length <= 10) {
        setFormData({
          ...formData,
          [name]: value,
        });
        return;
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    setSubmitted(false);
  };

  // Utility function to capitalize first letter of each word
  const capitalizeWords = (str) => {
    if (!str) return "";
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const { name, phone, category, gender, age, stageName } = formData;
    const errors = {};

    if (!name) errors.name = "Name is required";
    if (!phone) {
      errors.phone = "Please enter your Mobile Number";
    } else if (phone.length < 10) {
      errors.phone = "Phone number must be at least 10 digits long";
    }
    if (!category) errors.category = "Category is required";
    if (!gender) errors.gender = "Gender is required";
    if (!age) {
      errors.age = "Age is required";
    } else if (!/^\d{2}$/.test(age)) {
      errors.age = "Age must be a two-digit number";
    }

    if (Object.keys(errors).length > 0) {
      setError(errors);
      return;
    }

    const currentDate = new Date();
    const registrationDate = currentDate.toISOString().split("T")[0];
    const timestamp = currentDate.toISOString();

    try {
      const userId =
        location.state?.userId ||
        localStorage.getItem("userId") ||
        localStorage.getItem("user_id");

      if (!userId) {
        navigate("/signup");
        return;
      }

      // Capitalize name and stage name before sending
      const capitalizedName = capitalizeWords(name);
      const capitalizedStageName = capitalizeWords(stageName);

      const payload = {
        user_id: userId,
        FullName: capitalizedName,
        Age: age,
        Category: category,
        Gender: gender,
        registrationDate: registrationDate,
        StageName: capitalizedStageName || "",
        PhoneNumber: phone,
        createdTimestamp: timestamp,
        updatedTimestamp: timestamp,
        device: "web",
        lastLogin: "web",
      };

      const response = await fetch(
        "https://i3lmfmc1h2.execute-api.ap-south-1.amazonaws.com/voizpost/save/updateprofiledetails",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        // Store all user details in localStorage for access on homepage
        localStorage.setItem("userId", userId);
        localStorage.setItem("FullName", capitalizedName);
        localStorage.setItem("Category", category);
        localStorage.setItem("StageName", capitalizedStageName || "");
        localStorage.setItem("PhoneNumber", phone);
        localStorage.setItem("EmailId", email || location.state?.email || "");
        localStorage.setItem("Age", age);
        localStorage.setItem("Gender", gender);

        // Add a flag to indicate completion of profile details
        localStorage.setItem("profileComplete", "true");

        // Navigate to homepage with state data to ensure user details are available
        navigate("/homepage", {
          state: {
            userId: userId,
            email: email || location.state?.email,
            fullName: capitalizedName,
            category: category,
            stageName: capitalizedStageName || "",
            phoneNumber: phone,
            age: age,
            gender: gender,
            profileComplete: true,
          },
        });
      } else {
        console.error("Error updating profile details");

        // Even in case of error, attempt to navigate but with an error flag
        const errorMessage =
          "There was an issue updating your profile. Some features may be limited.";
        navigate("/homepage", {
          state: {
            userId: userId,
            profileError: errorMessage,
          },
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);

      // Navigate to homepage even on error, but with error message
      const userId =
        location.state?.userId ||
        localStorage.getItem("userId") ||
        localStorage.getItem("user_id");
      if (userId) {
        navigate("/homepage", {
          state: {
            userId: userId,
            profileError:
              "An error occurred. Please try updating your profile again later.",
          },
        });
      } else {
        navigate("/signup");
      }
    }
  };

  return (
    <Box className="UserDetailsPage">
      <img src={logo} alt="Logo" className="UserDetailsLogo" />
      <Typography
        variant="h5"
        sx={{
          marginBottom: 1,
          fontWeight: "bold",
          fontSize: "26px",
          fontFamily: "Poppins",
          marginTop: "-35px",
        }}
      >
        Tell us more about you
      </Typography>
      <Box
        className="formContainer"
        sx={{
          marginLeft: "790px !important;",
        }}
      >
        <TextField
          variant="filled"
          placeholder={!formData.name ? "Name" : ""}
          name="name"
          fullWidth
          value={formData.name}
          onChange={handleChange}
          sx={{
            backgroundColor: "#d3d2d2 !important",
            borderRadius: "10px",
            height: "56px !important",
            // Add these new rules
            "&:-webkit-autofill": {
              WebkitBoxShadow: "0 0 0 1000px #d3d2d2 inset !important",
              WebkitTextFillColor: "black !important",
            },
            "& .MuiInputBase-input:-webkit-autofill": {
              WebkitBoxShadow: "0 0 0 1000px #d3d2d2 inset !important",
              WebkitTextFillColor: "black !important",
            },
            "& .MuiInputBase-input::placeholder": {
              color: "black",
              opacity: 1,
              fontFamily: "Poppins !important",
              letterSpacing: "1px !important",
            },

            "& .MuiFilledInput-root": {
              borderRadius: "10px",
              overflow: "hidden",
              backgroundColor: "#d3d2d2 !important",

              "&:hover": {
                backgroundColor: "#d3d2d2 !important",
                "&:before": {
                  borderBottom: "none !important",
                },
              },
              "&.Mui-focused": {
                backgroundColor: "#d3d2d2 !important",
                "&:before, &:after": {
                  borderBottom: "none",
                },
              },
              "& input": {
                paddingTop: "16.5px",
                marginLeft: "10px",
                paddingBottom: "16.5px",
                color: "black !important",
              },
            },
            "& .MuiInputLabel-root": {
              "&.MuiInputLabel-shrink": {
                transform: "translate(0, -8px) scale(0.75)",
              },
              "&.Mui-focused": {
                color: "#2782EE",
              },
            },
          }}
          InputLabelProps={{ shrink: formData.name ? true : undefined }}
        />
        {error.name && (
          <Typography
            variant="error"
            sx={{
              color: "red",
              textAlign: "left",
              marginLeft: "-54%",
              fontSize: "12px",
              marginTop: "-2px",
            }}
          >
            {error.name}
          </Typography>
        )}

        <TextField
          variant="filled"
          placeholder={!formData.phone ? "Phone" : ""}
          name="phone"
          fullWidth
          value={formData.phone}
          onChange={handleChange}
          sx={{
            marginTop: 1,
            backgroundColor: "#d3d2d2 !important",
            borderRadius: "10px",
            height: "56px !important",
            // Add these new rules
            "&:-webkit-autofill": {
              WebkitBoxShadow: "0 0 0 1000px #d3d2d2 inset !important",
              WebkitTextFillColor: "black !important",
            },
            "& .MuiInputBase-input:-webkit-autofill": {
              WebkitBoxShadow: "0 0 0 1000px #d3d2d2 inset !important",
              WebkitTextFillColor: "black !important",
            },
            "& .MuiInputBase-input::placeholder": {
              color: "black",
              opacity: 1,
              fontFamily: "Poppins !important",
              letterSpacing: "1px !important",
            },
            "& .MuiFilledInput-root": {
              borderRadius: "10px",
              overflow: "hidden",
              backgroundColor: "#d3d2d2 !important",
              "&:hover": {
                backgroundColor: "#d3d2d2 !important",
                "&:before": {
                  borderBottom: "none !important",
                },
              },
              "&.Mui-focused": {
                backgroundColor: "#d3d2d2 !important",
                "&:before, &:after": {
                  borderBottom: "none",
                },
              },
              "& input": {
                marginLeft: "10px",
                paddingTop: "16.5px",
                paddingBottom: "16.5px",
                color: "black !important",
              },
            },
            "& .MuiInputLabel-root": {
              "&.MuiInputLabel-shrink": {
                transform: "translate(0, -8px) scale(0.75)",
              },
              "&.Mui-focused": {
                color: "#2782EE",
              },
            },
          }}
          InputLabelProps={{ shrink: formData.phone ? true : undefined }}
        />
        {error.phone && (
          <Typography
            variant="error"
            sx={{
              color: "red",
              textAlign: "left",
              marginLeft:
                error.phone === "Phone number must be at least 10 digits long"
                  ? "-23%"
                  : "-36%",
              fontSize: "12px",
              marginTop: "-4px",
            }}
          >
            {error.phone}
          </Typography>
        )}

        <FormControl
          variant="filled"
          fullWidth
          sx={{
            marginTop:
              (!formData.age || !formData.email || !formData.name) && submitted
                ? "25px !important"
                : 1,
            backgroundColor: "#d3d2d2",
            borderRadius: "10px",
            height: "56px !important",

            "& .MuiInputBase-root": {
              borderRadius: "10px",
              height: "100%",
              backgroundColor: "#d3d2d2",
              "&:hover": {
                backgroundColor: "#d3d2d2 !important",
                "&:before": {
                  borderBottom: "none !important",
                },
              },
              "&:before, &:after": {
                borderBottom: "none !important",
              },
              "&.Mui-focused": {
                backgroundColor: "#d3d2d2 !important",
                "&:before, &:after": {
                  borderBottom: "none !important",
                },
              },
            },
          }}
        >
          <InputLabel
            shrink={false}
            sx={{
              marginLeft: "10px",
              position: "absolute",
              left: "12px",
              top: isFocused || formData.gender ? "8px" : "50%",
              transform:
                isFocused || formData.gender ? "none" : "translateY(-50%)",
              fontSize: isFocused || formData.gender ? "12px" : "16px",
              color: isFocused || formData.gender ? "#2782EE" : "grey",
              transition: "all 0.2s ease-in-out",
              pointerEvents: "none",
              opacity: isFocused || formData.gender ? 0 : 1,
              color: "black",
              // opacity: 1,
              fontFamily: "Poppins !important",
              letterSpacing: "1px !important",
            }}
          >
            Gender
          </InputLabel>
          <Select
            value={formData.gender}
            name="gender"
            onChange={handleChange}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: "#d3d2d2",
                  marginTop: "20px",
                  width: "400px",
                  marginLeft: "1px",
                  borderRadius: "0px !important",

                  "& .MuiMenuItem-root": {
                    color: "black",
                    backgroundColor: "#d3d2d2",
                    height: "50px",
                    marginTop: "-8px",
                    paddingTop: "0px",
                    paddingBottom: "0px",
                    marginBottom: "-8px",
                    "&:hover": {
                      backgroundColor: "#2364C6",
                      color: "white",
                    },
                    "&.Mui-selected": {
                      backgroundColor: "#d3d2d2", // Match the default background
                      "&:hover": {
                        backgroundColor: "#2364C6",
                      },
                    },
                  },
                },
              },
              anchorOrigin: {
                vertical: "center",
                horizontal: "right",
              },
              transformOrigin: {
                vertical: "center",
                horizontal: "left",
              },
            }}
            sx={{
              marginLeft: "10px",
              marginBottom: "10px",
              borderRadius: "10px",
              height: "100%",
              overflow: "hidden",
              "&:hover": {
                backgroundColor: "white",
                "&:before": {
                  borderBottom: "none !important",
                },
              },
              "&:before, &:after": {
                borderBottom: "none !important",
              },
              "&.Mui-focused": {
                "&:before, &:after": {
                  borderBottom: "none !important",
                },
              },
              "& .MuiSvgIcon-root": {
                width: "50px !important",
                height: "50px !important",
                marginTop: "-10px !important",
                color: "black !important",
              },
            }}
          >
            <MenuItem
              value="Male"
              sx={{
                fontFamily: "Poppins !important",
                letterSpacing: "1px !important",
              }}
            >
              Male
            </MenuItem>
            <MenuItem
              value="Female"
              sx={{
                fontFamily: "Poppins !important",
                letterSpacing: "1px !important",
              }}
            >
              Female
            </MenuItem>
            <MenuItem
              value="Other"
              sx={{
                fontFamily: "Poppins !important",
                letterSpacing: "1px !important",
              }}
            >
              Other
            </MenuItem>
          </Select>
          {error.gender && (
            <Typography
              variant="error"
              sx={{
                color: "red",
                textAlign: "left",
                marginLeft: "5px",
                fontSize: "12px",
                marginBottom: "-28px",
                marginTop: "5px",
              }}
            >
              {error.gender}
            </Typography>
          )}
        </FormControl>

        <TextField
          variant="filled"
          placeholder={!formData.age ? "Age" : ""}
          value={formData.age}
          name="age"
          fullWidth
          onChange={handleChange}
          sx={{
            marginTop:
              (!formData.age || !formData.gender) && submitted
                ? "25px !important"
                : 1,
            backgroundColor: "#d3d2d2 !important",
            borderRadius: "10px",
            height: "56px !important",
            // Add these new rules
            "&:-webkit-autofill": {
              WebkitBoxShadow: "0 0 0 1000px #d3d2d2 inset !important",
              WebkitTextFillColor: "black !important",
            },
            "& .MuiInputBase-input:-webkit-autofill": {
              WebkitBoxShadow: "0 0 0 1000px #d3d2d2 inset !important",
              WebkitTextFillColor: "black !important",
            },
            "& .MuiInputBase-input::placeholder": {
              color: "black",
              opacity: 1,
              fontFamily: "Poppins !important",
              letterSpacing: "1px !important",
            },
            "& .MuiFilledInput-root": {
              borderRadius: "10px",
              overflow: "hidden",
              backgroundColor: "#d3d2d2 !important",
              "&:hover": {
                backgroundColor: "#d3d2d2 !important",
                "&:before": {
                  borderBottom: "none !important",
                },
              },
              "&.Mui-focused": {
                backgroundColor: "#d3d2d2 !important",
                "&:before, &:after": {
                  borderBottom: "none",
                },
              },
              "& input": {
                paddingTop: "16.5px",
                paddingBottom: "16.5px",
                marginLeft: "10px",
                color: "black !important",
              },
            },
            "& .MuiInputLabel-root": {
              "&.MuiInputLabel-shrink": {
                transform: "translate(0, -8px) scale(0.75)",
              },
              "&.Mui-focused": {
                color: "#2782EE",
              },
            },
          }}
          InputLabelProps={{ shrink: formData.age ? true : undefined }}
        />
        {error.age && (
          <Typography
            variant="error"
            sx={{
              color: "red",
              textAlign: "left",
              marginLeft: "-56%",
              fontSize: "12px",
              marginTop: "-2px",
            }}
          >
            {error.age}
          </Typography>
        )}

        <FormControl
          variant="filled"
          fullWidth
          sx={{
            marginTop: 1,
            backgroundColor: "#d3d2d2",
            borderRadius: "10px",
            width: "100%",
            height: "56px !important",
            "& .MuiFilledInput-root": {
              borderRadius: "10px",
              height: "56px",
              overflow: "hidden",
              padding: "0 12px",
              backgroundColor: "#d3d2d2 !important",
              "&:hover": {
                backgroundColor: "#d3d2d2 !important",
                "&:before": {
                  borderBottom: "none !important",
                },
              },
              "&.Mui-focused": {
                backgroundColor: "#d3d2d2",
                "&:before, &:after": {
                  borderBottom: "none !important",
                },
              },
            },
            "& .MuiSelect-select": {
              padding: "16.5px 12px",
              lineHeight: "1.4375em",
            },
          }}
        >
          <InputLabel
            shrink={false}
            sx={{
              marginLeft: "10px",
              position: "absolute",
              left: "12px",
              top: isFocused || formData.category ? "8px" : "50%",
              transform:
                isFocused || formData.category ? "none" : "translateY(-50%)",
              fontSize: isFocused || formData.category ? "12px" : "16px",
              color: isFocused || formData.category ? "#2782EE" : "grey",
              transition: "all 0.2s ease-in-out",
              pointerEvents: "none",
              opacity: isFocused || formData.category ? 0 : 1,
              color: "black",
              // opacity: 1,
              fontFamily: "Poppins !important",
              letterSpacing: "1px !important",
            }}
          >
            Category (Artist / Listener)
          </InputLabel>
          <Select
            value={formData.category}
            name="category"
            onChange={handleChange}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: "#d3d2d2",
                  borderRadius: "0px !important",
                  marginLeft: "1px !important",
                  "& .MuiMenuItem-root": {
                    color: "black",
                    backgroundColor: "#d3d2d2",
                    marginTop: "-8px",
                    paddingTop: "0px",
                    paddingBottom: "0px",
                    marginBottom: "-8px",
                    height: "50px",

                    "&:hover": {
                      backgroundColor: "#2364C6",
                      color: "white",
                    },
                    "&.Mui-selected": {
                      backgroundColor: "#d3d2d2", // Match the default background
                      "&:hover": {
                        backgroundColor: "#2364C6",
                      },
                    },
                  },
                },
              },
              anchorOrigin: {
                vertical: "center",
                horizontal: "right",
              },
              transformOrigin: {
                vertical: "center",
                horizontal: "left",
              },
            }}
            sx={{
              borderRadius: "10px",
              height: "56px",
              "&:hover": {
                backgroundColor: "white",
                "&:before": {
                  borderBottom: "none !important",
                },
              },
              "&:before, &:after": {
                borderBottom: "none !important",
              },
              "&.Mui-focused": {
                "&:before, &:after": {
                  borderBottom: "none !important",
                },
              },
              "& .MuiSvgIcon-root": {
                width: "50px !important",
                height: "50px !important",
                marginTop: "-12px !important",
                color: "black !important",
              },
            }}
          >
            <MenuItem
              value="Singer"
              sx={{
                fontFamily: "Poppins !important",
                letterSpacing: "1px !important",
              }}
            >
              Artist
            </MenuItem>
            <MenuItem
              value="Listener"
              sx={{
                fontFamily: "Poppins !important",
                letterSpacing: "1px !important",
              }}
            >
              Listener
            </MenuItem>
          </Select>
          {error.category && (
            <Typography
              variant="error"
              sx={{
                color: "red",
                textAlign: "left",
                fontSize: "12px",
                marginBottom: "-30px",
                marginLeft: "5px",
                marginTop: "5px",
              }}
            >
              {error.category}
            </Typography>
          )}
        </FormControl>

        {formData.category === "Singer" && (
          <TextField
            variant="filled"
            placeholder={!formData.stageName ? "Stage Name" : ""}
            name="stageName"
            fullWidth
            value={formData.stageName}
            onChange={handleChange}
            sx={{
              marginTop:
                !formData.stageName &&
                formData.category === "Singer" &&
                submitted
                  ? "25px !important"
                  : 1,
              backgroundColor: "#d3d2d2 !important",
              borderRadius: "10px",
              height: "56px !important",
              // Add these new rules
              "&:-webkit-autofill": {
                WebkitBoxShadow: "0 0 0 1000px #d3d2d2 inset !important",
                WebkitTextFillColor: "black !important",
              },
              "& .MuiInputBase-input:-webkit-autofill": {
                WebkitBoxShadow: "0 0 0 1000px #d3d2d2 inset !important",
                WebkitTextFillColor: "black !important",
              },
              "& .MuiInputBase-input::placeholder": {
                color: "black",
                opacity: 1,
                fontFamily: "Poppins !important",
                letterSpacing: "1px !important",
              },

              "& .MuiFilledInput-root": {
                borderRadius: "10px",
                overflow: "hidden",
                paddingLeft: "10px",
                backgroundColor: "#d3d2d2 !important",
                "&:hover": {
                  backgroundColor: "#d3d2d2 !important",
                  "&:before": {
                    borderBottom: "none !important",
                  },
                },
                "&.Mui-focused": {
                  backgroundColor: "#d3d2d2 !important",
                  "&:before, &:after": {
                    borderBottom: "none",
                  },
                },
                "& input": {
                  paddingTop: "16.5px",
                  paddingBottom: "16.5px",
                  color: "black !important",
                },
              },
            }}
            InputLabelProps={{ shrink: formData.stageName ? true : undefined }}
            InputProps={{
              endAdornment: (
                <div style={{}}>
                  <Tooltip
                    placement="top-start"
                    title={
                      <div
                        style={{
                          backgroundColor: "#28282B",
                          color: "white",
                          padding: "16px 0px 16px 16px",
                          borderRadius: "20px 20px 20px 0px",
                          minWidth: "200px",
                          fontFamily: "Arial, sans-serif",
                          fontSize: "12px",
                          lineHeight: "1.5",
                          // marginBottom: "-10px !important",
                        }}
                      >
                        <Typography
                          style={{
                            fontWeight: "bold",
                            fontSize: "14px",
                            marginBottom: "8px",
                          }}
                        >
                          Stage Name
                        </Typography>
                        <Typography>
                          Name by which the <br />
                          audience will identify you
                        </Typography>
                      </div>
                    }
                    arrow
                    componentsProps={{
                      tooltip: {
                        sx: {
                          background: "transparent",
                          boxShadow: "none",
                        },
                      },
                      arrow: {
                        sx: {
                          color: "#28282B",
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
                </div>
              ),
            }}
          />
        )}

        <Box
          sx={{
            display: "flex !important",
            alignItems: "center",
            justifyContent: "space-evenly !important",
            width: "50%",
            marginBottom: 1,
            marginTop: "-4px !important",
          }}
        >
          <Divider
            sx={{
              flexGrow: 1,
              height: "3px",
              bgcolor: "white",
              width: "10px !important",
            }}
          />
          <Divider
            sx={{
              flexGrow: 1,
              height: "3px",
              bgcolor: "white",
              width: "10px !important",
              marginLeft: "15px !important",
            }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            marginBottom: 1,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            className="startButton"
            onClick={handleSubmit}
            sx={{
              width: "380px !important",
              fontFamily: "'Open Sans', sans-serif !important",
              fontSize: "20px !important",
              fontWeight: "700 !important",
            }}
          >
            Let's Start
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 1, marginTop: "-45px", zIndex: 999 }}>
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
              font: "poppins",
              fontWeight: "800 !important",
              fontSize: "10px !important",
            }}
          >
            Terms of Use
          </Typography>
        </Link>
        <Typography
          variant="body2"
          sx={{
            color: "white",
            font: "poppins",
            fontWeight: "800 !important",
            fontSize: "10px !important",
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
              font: "poppins",
              fontWeight: "800 !important",
              fontSize: "10px !important",
            }}
          >
            Privacy Policy
          </Typography>
        </Link>
      </Box>
    </Box>
  );
}
