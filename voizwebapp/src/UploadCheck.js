import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import "./UploadCheck.css";
import CheckIcon from "@mui/icons-material/Check";
import {
  Typography,
  DialogTitle,
  Button,
  Divider,
  Checkbox,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  Link,
  LinearProgress,
  Paper,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Tooltip from "@mui/material/Tooltip";
import SideBar from "./SideBar";
import { useNavigate, useLocation } from "react-router-dom";
import uploadIcon from "./assets/Vector.png";

// Progress bar component
const UploadProgress = ({ progress }) => (
  <Paper
    elevation={3}
    sx={{
      p: 1,
      mb: 1,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: 2,
      height: 8,
      width: "250px !important",
      //maxWidth: 300,
      margin: "0.5rem auto",
      overflow: "visible",
    }}
  >
    {/* <Typography variant="body2" sx={{ color: "white", mb: 1,mb: 0.5,fontSize: "13px" }}>
      Uploading: {fileName}
    </Typography> */}
    <LinearProgress
      variant="determinate"
      value={progress}
      sx={{
        height: 4, // Reduced height
        borderRadius: 5,
        marginTop: "-1.5px",
        width: "100%", // Use 100% to fit within the container
        maxWidth: "100%", // Ensure it doesn't exceed container width
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        "& .MuiLinearProgress-bar": {
          backgroundColor: "#8055d1",
        },
      }}
    />
    <Typography
      variant="body2"
      sx={{
        color: "white",
        mt: 0.5,
        textAlign: "center",
        fontSize: "12px",
        width: "100%",
      
      }}
    >
      {Math.round(progress)}%
    </Typography>
  </Paper>
);

export default function UploadCheck() {
  const navigate = useNavigate();

  const [termsConditions, setTermsConditions] = useState(false);
  const [antiNational, setAntiNational] = useState(false);
  const [copyrightIssue, setCopyrightIssue] = useState(false);
  const [lyricsFile, setLyricsFile] = useState(null);
  const [songFile, setSongFile] = useState(null);
  const [songDuration, setSongDuration] = useState(null);
  const StageName = localStorage.getItem("StageName");
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    lyrics: 0,
    song: 0,
  });
  const [currentlyUploading, setCurrentlyUploading] = useState({
    lyrics: false,
    song: false,
  });
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const isAllChecked = antiNational && termsConditions && copyrightIssue;

  const [error, setError] = useState({
    lyricsFile: "",
    songFile: "",
    termsConditions: "",
    antiNational: "",
    copyrightIssue: "",
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Update dialog open state effect
  useEffect(() => {
    // Update isDialogOpen state when either success or error dialog is open
    setIsDialogOpen(successDialogOpen || errorDialogOpen);
  }, [successDialogOpen, errorDialogOpen]);

  // Blur effect for dialogs
  useEffect(() => {
    const container = document.querySelector(".formContainer");
    if (container) {
      if (isDialogOpen) {
        container.classList.add("dialog-open");
      } else {
        container.classList.remove("dialog-open");
      }
    }
  }, [isDialogOpen]);

  useEffect(() => {
    setError({
      lyricsFile: "",
      songFile: "",
      termsConditions: "",
      antiNational: "",
      copyrightIssue: "",
    });
  }, [lyricsFile, songFile, termsConditions, antiNational, copyrightIssue]);

  const lyricsInputRef = React.useRef(null);
  const songInputRef = React.useRef(null);

  const handleLyricsChange = (e) => {
    const file = e.target.files[0];
    setLyricsFile(file);
  };

  const handleSongChange = (e) => {
    const file = e.target.files[0];
    setSongFile(file);

    const audio = new Audio(URL.createObjectURL(file));
    audio.addEventListener("loadedmetadata", () => {
      const durationInSeconds = audio.duration;
      const minutes = Math.floor(durationInSeconds / 60);
      const seconds = Math.floor(durationInSeconds % 60);
      const formattedDuration = `${minutes}:${
        seconds < 10 ? "0" : ""
      }${seconds}`;
      setSongDuration(formattedDuration);
    });
  };

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

  const uploadFileWithProgress = async (file, presignedUrl, type) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress((prev) => ({
            ...prev,
            [type]: progress,
          }));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          setUploadProgress((prev) => ({
            ...prev,
            [type]: 100,
          }));
          setTimeout(() => {
            setCurrentlyUploading((prev) => ({
              ...prev,
              [type]: false,
            }));
          }, 1000);
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      xhr.open("PUT", presignedUrl);
      xhr.setRequestHeader(
        "Content-Type",
        type === "song" ? "audio/mpeg" : file.type
      );
      xhr.send(file);
    });
  };

  const updatedTimestamp = formatTimestamp();
  const location = useLocation();
  const { data } = location.state || {};

  const songName = data.songName;
  const FullName = data.name;
  const story = data.story;
  const lyricist = data.lyricist;
  const singer = data.singer;
  const producer = data.producer;
  const composer = data.composer;
  const languages = data.language;
  const genre = data.genre;
  const mood = data.mood;
  const span = songDuration;
  const coverPageUrl = "";
  const stage_name = StageName;
  const playCount = "0";
  const user_id = localStorage.getItem("user_id");
  const shareSongCount = "0";
  const playlistCount = "0";

  const handleUpload = async () => {
    const errors = {};

    if (!lyricsFile) errors.lyricsFile = "Please upload the lyrics file.";
    if (!songFile) errors.songFile = "Please upload the song file.";
    if (!termsConditions)
      errors.termsConditions = "Please agree to the terms and conditions.";
    if (!antiNational)
      errors.antiNational = "Please confirm the content is not anti-national.";
    if (!copyrightIssue)
      errors.copyrightIssue = "Please confirm there are no copyright issues.";

    if (Object.keys(errors).length > 0) {
      setError(errors);
      return;
    }

    setUploading(true);

    try {
      const payload = {
        songName: songName + ".mp3",
        lyricsFileName: lyricsFile.name,
        user_id: user_id,
      };

      const presignedUrlsResponse = await fetch(
        "https://y6mkdwd71i.execute-api.ap-south-1.amazonaws.com/voiznew/generate-presigned-urls",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (presignedUrlsResponse.ok) {
        const data = await presignedUrlsResponse.json();
        const songPresignedUrl = data.songUrl;
        const lyricsPresignedUrl = data.lyricsUrl;

        if (!songPresignedUrl || !lyricsPresignedUrl) {
          throw new Error("Failed to get presigned URLs for song and lyrics.");
        }

        // Upload lyrics with progress
        setCurrentlyUploading((prev) => ({ ...prev, lyrics: true }));
        await uploadFileWithProgress(lyricsFile, lyricsPresignedUrl, "lyrics");

        // Upload song with progress
        setCurrentlyUploading((prev) => ({ ...prev, song: true }));
        await uploadFileWithProgress(songFile, songPresignedUrl, "song");

        const processSongPayload = {
          user_id: user_id,
          FullName: FullName,
          songName: songName,
          stage_name: stage_name,
          story: story,
          lyricist: lyricist,
          singer: singer,
          producer: producer,
          composer: composer,
          languages: languages,
          genre: genre,
          mood: mood,
          span: span,
          coverPageUrl: coverPageUrl,
          fileName: songName + ".mp3",
          playCount: playCount,
          playlistCount: playlistCount,
          shareSongCount: shareSongCount,
          lyricsFileName: lyricsFile.name,
          updatedTimestamp: updatedTimestamp,
          createdTimestamp: updatedTimestamp,
        };

        const processSongResponse = await fetch(
          "https://g076kfytq4.execute-api.ap-south-1.amazonaws.com/voiznew/processSong",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(processSongPayload),
          }
        );

        if (processSongResponse.ok) {
          sessionStorage.removeItem("addSongFormData");
          sessionStorage.removeItem("songBasketFormData");
          sessionStorage.removeItem("uploadEssentialsFormData");
          sessionStorage.removeItem("comingFromUpload");

          const processSongData = await processSongResponse.json();
          console.log(
            "Song processing completed successfully:",
            processSongData
          );
          // Define fallback emails
  const fallbackEmails = [
    "ankitad@cloudmotivglobal.com",
    "mriganka@voiz.co.in"
  ];

  try {
    // Fetch all admin emails from the API
    const adminEmailsResponse = await fetch(
      "https://knjixc4wse.execute-api.ap-south-1.amazonaws.com/admin_report/get_admin_emails",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (adminEmailsResponse.ok) {
      const adminEmailsData = await adminEmailsResponse.json();
      
      if (adminEmailsData.success && adminEmailsData.admins && adminEmailsData.admins.length > 0) {
        // Extract all admin emails as an array
        const adminEmails = adminEmailsData.admins.map(admin => admin.email);
        console.log(`Sending notification to ${adminEmails.length} admins`);
        
        // Send a single notification to all admins
        await fetch(
          "https://kdr7woc3ih.execute-api.ap-south-1.amazonaws.com/default/AdminSendApprovalEmail",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              adminEmails: adminEmails, // Send the entire array of emails
              songTitle: songName,
              singerName: FullName
            }),
          }
        );
      } else {
        // If no admins found in API response, use fallback emails
        console.warn("No admin emails found, using fallback emails");
        await fetch(
          "https://kdr7woc3ih.execute-api.ap-south-1.amazonaws.com/default/AdminSendApprovalEmail",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              adminEmails: fallbackEmails,
              songTitle: songName,
              singerName: FullName
            }),
          }
        );
      }
    } else {
      // If API call fails, use fallback emails
      console.error("Failed to fetch admin emails, using fallback emails");
      await fetch(
        "https://kdr7woc3ih.execute-api.ap-south-1.amazonaws.com/default/AdminSendApprovalEmail",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminEmails: fallbackEmails,
            songTitle: songName,
            singerName: FullName
          }),
        }
      );
    }
  } catch (error) {
    // If any error occurs, use fallback emails
    console.error("Error in admin notification process:", error);
    await fetch(
      "https://kdr7woc3ih.execute-api.ap-south-1.amazonaws.com/default/AdminSendApprovalEmail",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmails: fallbackEmails,
          songTitle: songName,
          singerName: FullName
        }),
      }
    );
  }
          navigate("/addsong");
        } else {
          const errorData = await processSongResponse.json();
          setErrorMessage(
            errorData.error ||
              errorData.message ||
              "Failed to process the song."
          );
          setErrorDialogOpen(true);
          setUploading(false);
        }
      } else {
        const errorData = await presignedUrlsResponse.json();
        setErrorMessage(
          errorData.error ||
            errorData.message ||
            "Failed to get presigned URLs."
        );
        setErrorDialogOpen(true);
        setUploading(false);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setErrorMessage(error.message || "An unexpected error occurred.");
      setErrorDialogOpen(true);
      setUploading(false);
    }
  };

  const handleCloseSuccessDialog = () => {
    // Double-check that session storage is cleared
    sessionStorage.removeItem("addSongFormData");
    sessionStorage.removeItem("songBasketFormData");
    sessionStorage.removeItem("uploadEssentialsFormData");
    sessionStorage.removeItem("comingFromUpload");

    setSuccessDialogOpen(false);
    navigate("/homepage");
  };

  return (
    <Box className="drawer">
      <SideBar />
      <Box className="formContainer" sx={{}}>
        <Box sx={{ marginBottom: 5, marginTop: 4 }}>
          <Typography
            variant="h4"
            sx={{ color: "white", fontWeight: 700, mr: 3 }}
          >
            Upload and Check
          </Typography>
        </Box>

        {/* Progress bars */}
        {/* <Box sx={{ width: "100%", maxWidth: 400, mb: 2 }}>
          {currentlyUploading.lyrics && (
            <UploadProgress
              progress={uploadProgress.lyrics}
              fileName={lyricsFile?.name || "lyrics"}
            />
          )}
          {currentlyUploading.song && (
            <UploadProgress
              progress={uploadProgress.song}
              fileName={songFile?.name || "song"}
            />
          )}
        </Box> */}

        <Box sx={{ width: "130% !important" }}>
          <Box className="Uploadbuttons">
            <Button
              variant="contained"
              color="primary"
              className="uploadButton"
              sx={{
                textTransform: "none",
                fontSize: "20px",
                borderRadius: "10px !important",
              }}
              onClick={() => lyricsInputRef.current.click()}
            >
              Upload Lyrics
              {/* <img
                src={uploadIcon}
                style={{ width: "22px", height: "22px", marginLeft: 10 }}
              /> */}
            </Button>
            {/* <Tooltip
              title="Supported File Formats: .doc, .docx, .pdf and .txt "
              placement="bottom-start"
              arrow
            > */}
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
                    marginLeft: "-12px",
                    marginBottom: "-20px",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: "500",
                      fontSize: "18px !important",
                      height: "25px",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ fontSize: "18px !important" }}>
                      Information
                    </span>
                  </Typography>
                  <Typography
                    style={{
                      lineHeight: "100%",
                      letterSpacing: "1px !important",
                      fontFamily: "sans-serif !important",
                    }}
                  >
                    Supported File Formats:
                    <br /> .doc, .docx, .pdf and .txt
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
              <IconButton sx={{ ml: -2, mb: 1 }}>
                <InfoOutlinedIcon sx={{ color: "white" }} />
              </IconButton>
            </Tooltip>
            <input
              type="file"
              accept=".doc,.docx,.txt,.pdf"
              ref={lyricsInputRef}
              style={{ display: "none" }}
              onChange={handleLyricsChange}
            />
          </Box>

          {/* Lyrics Progress and File Info */}
          <Box sx={{ maxWidth: 400, ml: 10, mb: 2 }}>
            {currentlyUploading.lyrics && (
              <UploadProgress
                progress={uploadProgress.lyrics}
                fileName={lyricsFile?.name || "lyrics"}
              />
            )}
            {lyricsFile && !currentlyUploading.lyrics && (
              <Typography
                variant="body2"
                sx={{
                  color: "white",
                  textAlign: "center",
                  marginRight: "-40px !important",
                }}
              >
                {lyricsFile.name}
              </Typography>
            )}
            {error.lyricsFile && (
              <Typography
                className="errorMessage1"
                variant="body2"
                textAlign={"center !important"}
                sx={{ color: "red !important" }}
              >
                {error.lyricsFile}
              </Typography>
            )}
          </Box>

          {/* Song Upload Section */}
          <Box className="button">
            <Button
              variant="contained"
              color="primary"
              className="uploadButton"
              sx={{
                borderRadius: "10px !important",
                fontSize: "20px !important",
                font: "poppins !important",
                fontWeight: "800 !importanat",
              }}
              onClick={() => songInputRef.current.click()}
            >
              Upload Song
              {/* <img
                src={uploadIcon}
                style={{ width: "22px", height: "22px", marginLeft: 15 }}
              /> */}
            </Button>
            {/* <Tooltip
              title="Supported File Formats: .wav and .mp3"
              placement="bottom-start"
              arrow
            > */}
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
                    marginLeft: "-12px",
                    marginBottom: "-20px",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: "500",
                      fontSize: "18px !important",
                      height: "25px",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ fontSize: "18px !important" }}>
                      Information
                    </span>
                  </Typography>
                  <Typography
                    style={{
                      lineHeight: "100%",
                      letterSpacing: "1px !important",
                      fontFamily: "sans-serif !important",
                    }}
                  >
                    Supported File Formats:
                    <br />
                    .wav and .mp3
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
              <IconButton sx={{ mb: 1, height: "40px" }}>
                <InfoOutlinedIcon sx={{ color: "white" }} />
              </IconButton>
            </Tooltip>
            <input
              type="file"
              accept=".wav,.mp3"
              ref={songInputRef}
              style={{ display: "none" }}
              onChange={handleSongChange}
            />
          </Box>

          {/* Song Progress and File Info */}
          <Box sx={{ maxWidth: 400, ml: 10, mb: 2 }}>
            {currentlyUploading.song && (
              <UploadProgress
                progress={uploadProgress.song}
                // fileName={songFile?.name || "song"}
              />
            )}
            {songFile && !currentlyUploading.song && (
              <Typography
                variant="body2"
                sx={{
                  color: "white",
                  textAlign: "center",
                  marginRight: "-40px !important",
                }}
              >
                {songFile.name}
              </Typography>
            )}
            {error.songFile && (
              <Typography
                className="errorMessage1"
                variant="body2"
                textAlign={"center !important"}
                sx={{ color: "red !important" }}
              >
                {error.songFile}
              </Typography>
            )}
          </Box>

          {/* From here  */}
          <Box
            display={"flex"}
            sx={{
              marginTop: 5,
              marginLeft: 8,
              alignItems: "center",
            }}
          >
            <Checkbox
              checked={termsConditions}
              onChange={(e) => setTermsConditions(e.target.checked)}
              disableRipple // Prevents ripple effect to avoid shifting
              icon={
                <Box
                  sx={{
                    width: 26,
                    height: 22,
                    backgroundColor: "white", // Unchecked background
                    border: "2px solid #ffffff", // White border for unchecked
                    borderRadius: "2px", // Optional for rounded corners
                    display: "flex", // Ensures consistent alignment
                    alignItems: "center",
                    mb: 3.6,
                    justifyContent: "center",
                    marginLeft: "-10px",
                  }}
                />
              }
              checkedIcon={
                <Box
                  sx={{
                    width: 26, //19
                    height: 22, //18
                    backgroundColor: "#2782EECC", // Blue background for checked
                    borderRadius: "2px", // Optional for rounded corners
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 3.6,
                    marginLeft: "-10px",
                  }}
                >
                  <CheckIcon sx={{ color: "white", fontSize: 16 }} />{" "}
                  {/* White tick */}
                </Box>
              }
              sx={{
                padding: 0, // Removes default padding
                marginRight: 1, // Adds spacing between checkbox and text
              }}
            />
            <Typography
              variant="body2"
              sx={{
                marginRight: 3,
                fontSize: "20px !important",
                padding: 1,
                color: "white",
                mt: 0,
                fontWeight: "400 !important",
              }}
            >
              I have read and agree with the{" "}
              <Link
                href="https://voiz.co.in/standard-terms-and-conditions-artist/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  textDecoration: "none",
                  cursor: "pointer",
                  fontWeight: "bold",
                  color: "#0057FF",
                  fontWeight: "400 !important",
                }}
              >
                terms and conditions
              </Link>
            </Typography>
          </Box>
          {/* From here end */}

          {error.termsConditions && (
            <Typography variant="body2" sx={{ color: "red", marginLeft: 10 }}>
              {error.termsConditions}
            </Typography>
          )}

          <Box display={"flex"} sx={{ marginLeft: 8, alignItems: "center" }}>
            <Checkbox
              checked={antiNational}
              onChange={(e) => setAntiNational(e.target.checked)}
              disableRipple
              icon={
                <Box
                  sx={{
                    width: 26,
                    height: 22,
                    backgroundColor: "white",
                    border: "2px solid #ffffff",
                    borderRadius: "2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 3.6,
                    marginLeft: "-10px",
                  }}
                />
              }
              checkedIcon={
                <Box
                  sx={{
                    width: 26,
                    height: 22,
                    backgroundColor: "#2782EECC",
                    borderRadius: "2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 3.6,
                    marginLeft: "-10px",
                  }}
                >
                  <CheckIcon sx={{ color: "white", fontSize: 16 }} />{" "}
                  {/* White tick */}
                </Box>
              }
              sx={{
                padding: 0, // Removes default padding
                marginRight: 1, // Adds spacing between checkbox and text
              }}
            />
            <Typography
              variant="body2"
              sx={{
                marginRight: 3,
                fontSize: "20px !important",
                padding: 1,
                color: "white",
                mt: 0,
                fontWeight: "400 !important",
              }}
            >
              Content uploaded meets the platform{" "}
              <Link
                href="https://voiz.co.in/code-of-conduct/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  textDecoration: "none",
                  cursor: "pointer",
                  fontWeight: "bold",
                  color: "#0057FF",
                  fontWeight: "400 !important",
                }}
              >
                Code of conduct
              </Link>
            </Typography>
          </Box>

          {error.antiNational && (
            <Typography variant="body2" sx={{ color: "red", marginLeft: 10 }}>
              {error.antiNational}
            </Typography>
          )}

          <Box
            display={"flex"}
            sx={{ marginLeft: 8, alignItems: "center", marginBottom: -3, mt: -3 }}
          >
            <Checkbox
              checked={copyrightIssue}
              onChange={(e) => setCopyrightIssue(e.target.checked)}
              disableRipple // Prevents ripple effect to avoid shifting
              icon={
                <Box
                  sx={{
                    width: 26,
                    height: 22,
                    backgroundColor: "white", // Unchecked background
                    border: "2px solid #ffffff", // White border for unchecked
                    borderRadius: "2px", // Optional for rounded corners
                    display: "flex", // Ensures consistent alignment
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 0,
                    marginLeft: "-10px",
                  }}
                />
              }
              checkedIcon={
                <Box
                  sx={{
                    width: 26,
                    height: 22,
                    backgroundColor: "#2782EECC", // Blue background for checked
                    borderRadius: "2px", // Optional for rounded corners
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 0,
                    marginLeft: "-10px",
                  }}
                >
                  <CheckIcon sx={{ color: "white", fontSize: 16 }} />{" "}
                  {/* White tick */}
                </Box>
              }
              sx={{
                padding: 0, // Removes default padding
                marginRight: 1, // Adds spacing between checkbox and text
              }}
            />
            <Typography
              variant="body2"
              sx={{
                marginRight: 3,
                fontSize: "20px !important",
                padding: 1,
                color: "white",
                mt: 3,
                fontWeight: "400 !important",
              }}
            >
             Content uploaded is mine and doesn't infringe other’s copyrights
            </Typography>
          </Box>

          {error.copyrightIssue && (
            <Typography variant="body2" sx={{ color: "red", marginLeft: 10 }}>
              {error.copyrightIssue}
            </Typography>
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
                bgcolor: "white",
                width: " 70px !important",
                marginLeft: "20px !important",
              }}
            />
            <Divider
              sx={{
                flexGrow: 1,
                height: "3.5px !important",
                bgcolor: "white",
                width: "70px !important",
                marginLeft: "20px !important",
                marginRight: "60px !important",
              }}
            />
          </Box>
          <Box className="button">
            <Button
              variant="contained"
              color="primary"
              //    className="uploadButton"
              sx={{
                borderRadius: 10,
                marginTop: 2,
                textTransform: "none",
                fontSize: "20px",
              }}
              onClick={handleUpload}
              disabled={
                !isAllChecked ||
                currentlyUploading.lyrics ||
                currentlyUploading.song ||
                uploading
              }
            >
              Upload
            </Button>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={successDialogOpen}
        onClose={handleCloseSuccessDialog}
        PaperProps={{
          sx: {
            backgroundColor: "#efeae9 !important",
            borderRadius: "28px !important",
            width: "478px !important",
            height: " 316px !important",
            backgroundColor: "#100F32",
            marginRight: "90px !important",
          },
        }}
        aria-labelledby="success-dialog-title"
      >
        <DialogContent sx={{ position: "relative" }}>
          <IconButton
            aria-label="close"
            onClick={handleCloseSuccessDialog}
            sx={{
              position: "absolute",
              right: 1,
              top: 1,
              color: "#FFFFFF",
              fontSize: "30px !important",
            }}
          >
            <HighlightOffIcon
              sx={{
                fontSize: 40,
              }}
            />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              textAlign: "center",
              marginTop: 4,
              color: "#FFFFFF",
              fontWeight: "500",
            }}
          >
            <h2 className="Popup">Confirmation!</h2>
            <span className="Pophead">
              Your song has been <br />
              uploaded for approval !
            </span>
          </Typography>
          <Box sx={{ textAlign: "center", marginTop: 2 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 60,
                height: 60,
                borderRadius: "50%",
              }}
              onClick={handleCloseSuccessDialog}
            >
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "50%",
                    width: "45px",
                    height: "45px",
                    position: "absolute",
                    marginLeft: "-18px",
                    marginTop: "1px",
                  }}
                ></div>
                <CheckCircleIcon
                  sx={{
                    color: "#2782EE",
                    fontSize: "60px",
                    position: "absolute",
                    borderRadius: "50%",
                    marginLeft: "-25px",
                    marginTop: "-5px",
                  }}
                />
              </div>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
        sx={{
          "& .MuiDialog-paper": {
            width: "300px !important",
            minHeight: "150px !important",
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
            fontSize: "18px",
            fontWeight: "500",
          }}
        >
          Warning
        </DialogTitle>
        <DialogContent>
          <Typography
            sx={{
              color: "white",
              textAlign: "center",
              marginTop: "10px !important",
            }}
          >
            {errorMessage}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setErrorDialogOpen(false)}
            sx={{
              color: "#2782EE",
              textTransform: "none",
              fontSize: "16px",
              marginBottom: "-10px",
              "&:hover": {
                backgroundColor: "rgba(39, 130, 238, 0.08)",
              },
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
