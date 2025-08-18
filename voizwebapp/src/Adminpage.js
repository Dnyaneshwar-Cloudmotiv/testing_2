import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Card from "@mui/material/Card";
import TabContext from "@mui/lab/TabContext";
import { Typography } from "@mui/material";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import "./Adminpage.css";
import logo from "./assets/bg-logo.png";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Logout from "@mui/icons-material/Logout";
import { Amplify } from "aws-amplify";
import awsExports from "./aws-exports";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Divider from "@mui/material/Divider";
import { signOut } from "aws-amplify/auth";
import { useLocation } from "react-router-dom";
import { MoreVertical } from "lucide-react";
import Delete from "./assets/Delete.png"; // Make sure this image exists in your assets folder
import coverpage from "./assets/mic.jpg";
import { TextField } from "@mui/material";

import {
  IconButton,
  Button,
  DialogTitle,
  DialogActions,
  Dialog,
} from "@mui/material";
import { Label } from "@aws-amplify/ui-react";

Amplify.configure(awsExports);

export default function Adminpage() {
  const location = useLocation();
  const [value, setValue] = React.useState(location.state?.tabValue || "1");

  const [songs, setSongs] = React.useState([]);
  const [albums, setAlbums] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [controller, setController] = React.useState(null); // To control API requests
  const [feedback, setFeedback] = React.useState([]);
  const [expandedAlbumId, setExpandedAlbumId] = React.useState(null);
  const [albumTotalCounts, setAlbumTotalCounts] = React.useState({});
  // console.log(songs);
  const [feedbackDetails, setFeedbackDetails] = React.useState([]);
  const [loadingFeedback, setLoadingFeedback] = React.useState(false);
  const [loadingFeedbackDetails, setLoadingFeedbackDetails] =
    React.useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const navigate = useNavigate();

  const [songMenuAnchor, setSongMenuAnchor] = React.useState(null);
  const [selectedSong, setSelectedSong] = React.useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);

  const [deleteReason, setDeleteReason] = useState("");
  const [deleteAttachment, setDeleteAttachment] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [deleteAttachmentFile, setDeleteAttachmentFile] = useState(null);

  useEffect(() => {
    // Update the tab value if it's passed through navigation
    if (location.state?.tabValue) {
      setValue(location.state.tabValue);
      // Optionally clear the state after using it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  useEffect(() => {
    const handlePopState = () => {
      setValue("1"); // Reset to default tab
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Function to fetch total song counts for all albums
  const fetchAllAlbumSongCounts = async () => {
    try {
      const response = await fetch(
        "https://6htqk6p035.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/albums/songCounts"
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch album song counts: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("All album song counts:", data);
      
      if (data && data.albumCounts) {
        // Update the albumTotalCounts state with all album counts at once
        setAlbumTotalCounts(data.albumCounts);
      }
    } catch (err) {
      console.error("Error fetching album song counts:", err);
    }
  };
  
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

  // At the top of your file, add this constant
  const ALLOWED_FILE_TYPES = {
    "application/pdf": "PDF",
    "text/plain": "Text",
    "image/jpeg": "JPEG Image",
    "image/png": "PNG Image",
    "image/jpg": "JPG Image",
    "application/msword": "DOC",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "DOCX",
  };

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // const handleChange = (event, newValue) => {
  //     setValue(newValue);
  //     if (newValue === '4') {
  //         fetchFeedback();
  //     } else {
  //         fetchSongsByDecision(newValue);
  //     }
  // };
  const handleChange = (event, newValue) => {
    setValue(newValue);
    if (newValue === "4") {
      fetchFeedback();
    } else {
      fetchSongsByDecision(newValue);
    }
  };

  const fetchFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const response = await fetch(
        "https://01bgjtw3s9.execute-api.ap-south-1.amazonaws.com/voiz/getusers"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch feedback");
      }
      const data = await response.json();
      // console.log(data);
      setFeedback(data.userDetails || []);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const fetchSongsByDecision = async (tabValue) => {
    let decision = "";
    if (tabValue === "1") decision = "Pending";
    if (tabValue === "2") decision = "Approved";
    if (tabValue === "3") decision = "Rejected";
    if (tabValue === "5") decision = "Deleted";

    // Cancel any previous API requests
    if (controller) {
      controller.abort();
    }

    const newController = new AbortController();
    setController(newController);

    setLoading(true);
    setError(null);
    setSongs([]);
    setAlbums([]);
    setExpandedAlbumId(null);

    try {
      const response = await fetch(
        `https://6htqk6p035.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/getsongs?decision=${decision}`,
        {
          signal: newController.signal,
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      console.log(data);

      if (Array.isArray(data.songDetails) && data.songDetails.length > 0) {
        // Process and format all songs
        const processedSongs = data.songDetails
          .flat()
          .map((song) => {
            // Format each timestamp
            const [datePart, timePart] = song.createdTimestamp.split("_");
            const year = datePart.slice(0, 4);
            const month = datePart.slice(4, 6);
            const day = datePart.slice(6, 8);
            const hours = timePart.slice(0, 2);
            const minutes = timePart.slice(2, 4);

            return {
              ...song,
              user_id: song.user_id,
              coverPageUrl: song.coverPageUrl
                ? `${song.coverPageUrl}?t=${new Date().getTime()}`
                : null,
              formattedTimestamp: `${year}-${month}-${day} ${hours}:${minutes}`,
            };
          })
          .sort((a, b) => {
            const dateA = new Date(
              `${a.createdTimestamp.slice(0, 4)}-${a.createdTimestamp.slice(4, 6)}-${a.createdTimestamp.slice(6, 8)}T${a.createdTimestamp.slice(9, 11)}:${a.createdTimestamp.slice(11, 13)}:${a.createdTimestamp.slice(13, 15)}`
            );
            const dateB = new Date(
              `${b.createdTimestamp.slice(0, 4)}-${b.createdTimestamp.slice(4, 6)}-${b.createdTimestamp.slice(6, 8)}T${b.createdTimestamp.slice(9, 11)}:${b.createdTimestamp.slice(11, 13)}:${b.createdTimestamp.slice(13, 15)}`
            );
            return dateB - dateA;
          });

        // For Pending Songs, Approved Songs, or Rejected Songs tab, group by album_id
        if (tabValue === "1" || tabValue === "2" || tabValue === "3") {
          // Group songs by album_id
          const albumGroups = {};
          const singleSongs = [];

          processedSongs.forEach(song => {
            if (song.album_id) {
              if (!albumGroups[song.album_id]) {
                albumGroups[song.album_id] = {
                  album_id: song.album_id,
                  albumName: song.albumName || "Unknown Album",
                  coverPageUrl: song.albumCoverUrl,
                  songs: [],
                  stage_name: song.stage_name || song.FullName,
                  formattedTimestamp: song.formattedTimestamp,
                  createdTimestamp: song.createdTimestamp
                };
              }
              albumGroups[song.album_id].songs.push(song);
            } else {
              singleSongs.push(song);
            }
          });

          // Convert album groups to array
          const albumsArray = Object.values(albumGroups);
          
          // Sort albums by timestamp, latest first
          albumsArray.sort((a, b) => {
            const dateA = new Date(
              `${a.createdTimestamp?.slice(0, 4)}-${a.createdTimestamp?.slice(4, 6)}-${a.createdTimestamp?.slice(6, 8)}T${a.createdTimestamp?.slice(9, 11)}:${a.createdTimestamp?.slice(11, 13)}:${a.createdTimestamp?.slice(13, 15)}` || 0
            );
            const dateB = new Date(
              `${b.createdTimestamp?.slice(0, 4)}-${b.createdTimestamp?.slice(4, 6)}-${b.createdTimestamp?.slice(6, 8)}T${b.createdTimestamp?.slice(9, 11)}:${b.createdTimestamp?.slice(11, 13)}:${b.createdTimestamp?.slice(13, 15)}` || 0
            );
            return dateB - dateA; // Latest first
          });
          
          // Fetch total song counts for all albums at once
          fetchAllAlbumSongCounts();
          
          // Set albums and single songs
          setAlbums(albumsArray);
          setSongs(singleSongs);
        } else {
          // For other tabs, just set the songs array
          setSongs(processedSongs);
          setAlbums([]);
        }
      } else {
        // If songDetails is empty or not an array, set songs to an empty array
        setSongs([]);
        setAlbums([]);
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Fetch request was cancelled.");
      } else {
        setError(error.message || "Failed to fetch data.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSongClick = (song) => {
    navigate(`/songdetail/${song.song_id}`, {
      state: {
        workflowId: song.workflowId,
        decision: song.decision,
      },
    });
  };

  const handleUserClick = async (user_id) => {
    setSelectedUserId(user_id);
    setLoadingFeedbackDetails(true);
    try {
      const response = await fetch(
        `https://01bgjtw3s9.execute-api.ap-south-1.amazonaws.com/voiz/getfeedback?user_id=${user_id}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch feedback details");
      }
      const data = await response.json();

      // Sort and format feedback details by timestamp
      const sortedFeedback = (data || [])
        .sort((a, b) => {
          const dateA = new Date(
            `${a.updatedTimestamp.S.slice(0, 4)}-${a.updatedTimestamp.S.slice(
              4,
              6
            )}-${a.updatedTimestamp.S.slice(6, 8)}T${a.updatedTimestamp.S.slice(
              9,
              11
            )}:${a.updatedTimestamp.S.slice(
              11,
              13
            )}:${a.updatedTimestamp.S.slice(13, 15)}`
          );
          const dateB = new Date(
            `${b.updatedTimestamp.S.slice(0, 4)}-${b.updatedTimestamp.S.slice(
              4,
              6
            )}-${b.updatedTimestamp.S.slice(6, 8)}T${b.updatedTimestamp.S.slice(
              9,
              11
            )}:${b.updatedTimestamp.S.slice(
              11,
              13
            )}:${b.updatedTimestamp.S.slice(13, 15)}`
          );
          return dateB - dateA;
        })
        .map((item) => {
          // Format each timestamp
          const [datePart, timePart] = item.updatedTimestamp.S.split("_");
          const year = datePart.slice(0, 4);
          const month = datePart.slice(4, 6);
          const day = datePart.slice(6, 8);
          const hours = timePart.slice(0, 2);
          const minutes = timePart.slice(2, 4);
          const seconds = timePart.slice(4, 6);

          // Return item with formatted timestamp
          return {
            ...item,
            formattedTimestamp: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
          };
        });

      console.log(sortedFeedback);
      setFeedbackDetails(sortedFeedback);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoadingFeedbackDetails(false);
    }
  };

  // Modify the initial useEffect to use the current tab value
  React.useEffect(() => {
    if (value === "4") {
      fetchFeedback();
    } else {
      fetchSongsByDecision(value);
    }
  }, [value]);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    // setAnchorEl(null);
    navigate("/homepage");
  };

  const handleReport = () => {
    navigate("/admin-reports");
  };

  const handleSongMenuOpen = (event, song) => {
    event.stopPropagation();
    console.log("Selected Song:", song);
    setSongMenuAnchor(event.currentTarget);
    setSelectedSong(song);
  };

  const handleSongMenuClose = (event) => {
    if (event) {
      event.stopPropagation();
    }
    setSongMenuAnchor(null);
  };

  //   const handleDeleteSong = async () => {
  //     if (!selectedSong) return;

  // if (!deleteReason.trim()) {
  //     setDeleteError('Please provide a reason for deletion');
  //     return;
  // }

  // // Check if we have all required fields
  // if (!selectedSong.workflowId || !selectedSong.user_id || !selectedSong.songName) {
  //     setDeleteError('Missing song information. Please try again.');
  //     return;
  // }

  // try {
  //     const admin_id = localStorage.getItem('user_id');
  //     if (!admin_id) {
  //         setDeleteError('Admin ID not found. Please log in again.');
  //         return;
  //     }

  //     let attachmentUrl = null;

  //     // File upload logic (if a file is selected)
  //     if (deleteAttachmentFile) {
  //         const formData = new FormData();
  //         formData.append('file', deleteAttachmentFile);
  //         formData.append('admin_id', admin_id);

  //         // Replace with your actual file upload endpoint
  //         const uploadResponse = await fetch(
  //             "https://YOUR_FILE_UPLOAD_ENDPOINT",
  //             {
  //                 method: "POST",
  //                 body: formData
  //             }
  //         );

  //         if (!uploadResponse.ok) {
  //             throw new Error('File upload failed');
  //         }

  //         const uploadResult = await uploadResponse.json();
  //         attachmentUrl = uploadResult.fileUrl; // Adjust based on your backend response
  //     }

  //     const deletePayload = {
  //         workflowId: selectedSong.workflowId,
  //         admin_id: admin_id,
  //         reason: deleteReason,
  //         user_id: selectedSong.user_id,
  //         songName: selectedSong.songName,
  //         delete_attachment: attachmentUrl || deleteAttachment.trim() || null
  //     };

  //         console.log('Delete Payload:', deletePayload); // For debugging

  //         const response = await fetch(
  //             "https://6htqk6p035.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/song/delete",
  //             {
  //                 method: "POST",
  //                 headers: {
  //                     "Content-Type": "application/json",
  //                 },
  //                 body: JSON.stringify(deletePayload)
  //             }
  //         );

  //         if (!response.ok) {
  //             const errorData = await response.json();
  //             throw new Error(errorData.message || "Failed to delete song");
  //         }

  //         const result = await response.json();

  //         if (result.success) {
  //             // Remove the song from the songs list
  //             setSongs((prevSongs) =>
  //                 prevSongs.filter((song) => song.song_id !== selectedSong.song_id)
  //             );

  //             // Reset all states
  //             setOpenDeleteDialog(false);
  //             setSelectedSong(null);
  //             setSongMenuAnchor(null);
  //             setDeleteReason('');
  //             setDeleteAttachment('');
  //             setDeleteError('');
  //         } else {
  //             throw new Error(result.message || "Failed to delete song");
  //         }
  //     } catch (error) {
  //         console.error("Error deleting song:", error);
  //         setDeleteError(error.message || 'Failed to delete song. Please try again.');
  //     }
  // };

  // Frontend: Updated handleDeleteSong function

  async function handleDeleteSong() {
    if (!selectedSong) return;

    if (!deleteReason.trim()) {
      return setDeleteError("Please provide a reason for deletion");
      
    }
  
    
  
    


    try {
      
      const admin_id = localStorage.getItem("user_id");
      if (!admin_id) {
        setDeleteError("Admin ID not found. Please log in again.");
        return;
      }

      const artist_user_id = selectedSong.user_id;
      let attachmentUrl = null;

      // Handle file upload if a file is selected
      if (deleteAttachmentFile) {
        // Get pre-signed URL for file upload
        const presignedResponse = await fetch(
          "https://6htqk6p035.execute-api.ap-south-1.amazonaws.com/voizadmin/generate-presigned-url/delete-attachment",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileName: deleteAttachmentFile.name,
              user_id: artist_user_id,
              mimetype: deleteAttachmentFile.type,
            }),
          }
        );

        // Read the response body only once
        const presignedData = await presignedResponse.json();

        if (!presignedResponse.ok) {
          throw new Error(
            presignedData.message || "Failed to get pre-signed URL"
          );
        }

        const url = presignedData.url;

        // Upload file using pre-signed URL
        const uploadResponse = await fetch(url, {
          method: "PUT",
          body: deleteAttachmentFile,
          headers: {
            "Content-Type": deleteAttachmentFile.type,
          },
        });

        if (!uploadResponse.ok) {
          // Try to get error text if possible
          const errorText = await uploadResponse.text();
          throw new Error(`Upload failed: ${errorText}`);
        }

        // Construct the final attachment URL using artist's user_id
        attachmentUrl = `https://delete-attached-file.s3.amazonaws.com/${artist_user_id}/${deleteAttachmentFile.name}`;
      }

      // Prepare payload for song deletion
      const deletePayload = {
        workflowId: selectedSong.workflowId,
        admin_id: admin_id,
        reason: deleteReason,
        user_id: artist_user_id,
        songName: selectedSong.songName,
        delete_attachment: attachmentUrl,
      };

      // Call song deletion API
      const response = await fetch(
        "https://6htqk6p035.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/song/delete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(deletePayload),
        }
      );

      // Read response body only once
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete song");
      }

      if (result.success) {
        // Remove the song from the songs list
        setSongs((prevSongs) =>
          prevSongs.filter((song) => song.song_id !== selectedSong.song_id)
        );

        // Reset all states
        setOpenDeleteDialog(false);
        setSelectedSong(null);
        setSongMenuAnchor(null);
        setDeleteReason("");
        setDeleteAttachment("");
        setDeleteAttachmentFile(null);
        setDeleteError("");
        
      } else {
        throw new Error(result.message || "Failed to delete song");
      }
    } catch (error) {
      console.error("Error deleting song:", error);
      setDeleteError(
        error.message || "Failed to delete song. Please try again."
      );
    }
    
  }

  return (
    <Box
      className="PageAdmin"
      sx={{ width: "100%", typography: "body1", padding: 4 }}
    >
      <Box className="adminHeader">
        <img src={logo} alt="Logo" className="adminLogo" />
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
              onClick={handleReport}
              sx={{ fontSize: "18px", margin: "15px" }}
            >
              {" "}
              Report
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
      <Box className="BodyAdmin">
        <Card
          className="CardAdmin"
          sx={{
            backgroundColor: "#1e1e1e !important",
            boxShadow: "none",
            border: "none",
          }}
        >
          <TabContext value={value}>
            <Box className="tab-list-container">
              <TabList onChange={handleChange} className="admin-tablist">
                <Tab
                  label="Pending Songs"
                  value="1"
                  sx={{ textTransform: "none" }}
                  className={`tab-item ${value === "1" ? "active" : ""}`}
                />
                <Tab
                  label="Approved Songs"
                  value="2"
                  sx={{ textTransform: "none" }}
                  className={`tab-item ${value === "2" ? "active" : ""}`}
                />
                <Tab
                  label="Rejected Songs"
                  value="3"
                  sx={{ textTransform: "none" }}
                  className={`tab-item ${value === "3" ? "active" : ""}`}
                />
                <Tab
                  label="Feedback"
                  value="4"
                  sx={{ textTransform: "none" }}
                  className={`tab-item ${value === "4" ? "active" : ""}`}
                />
                <Tab
                  label="Deleted Songs"
                  value="5"
                  sx={{ textTransform: "none" }}
                  className={`tab-item ${value === "5" ? "active" : ""}`}
                />
              </TabList>
            </Box>
            {/* {value === '1' && (
                            <TabPanel value="1" className="SongPanel">
                                {loading ? (
                                    <p>Loading...</p>
                                ) : error ? (
                                    <p className="error-message">Error: {error}</p>
                                ) : songs.length > 0 ? (
                                    <Box className="SongGrid">
                                        {songs.map((song, index) => (
                                            <Box key={index} className="song-item" onClick={() => handleSongClick(song)}>
                                                {song.coverPageUrl ? (
                                                    <img
                                                        src={song.coverPageUrl}
                                                        alt={song.songName}
                                                        className="songcover"
                                                    />
                                                ) : (
                                                    <Avatar
                                                        alt={song.songName}
                                                        variant="square"
                                                        sx={{ width: 100, height: 100 }}
                                                        className='songcover'
                                                    >
                                                    </Avatar>
                                                )}
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="body1" sx={{ fontSize: '22px' }}>{song.songName}</Typography>
                                                    <Typography variant="body2" sx={{ marginTop: '5px', fontSize: '20px', color: '#A5A5A5' }}>{song.stage_name}</Typography>
                                                    <Typography variant="body2" sx={{ marginTop: '5px', fontSize: '20px', color: '#A5A5A5' }}>{song.languages}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" sx={{ marginLeft: '15px', alignSelf: 'flex-start', marginTop: '3px' }}>{song.span}</Typography>
                                                    <Typography variant="body2" sx={{ marginLeft: '15px', alignSelf: 'flex-start', marginTop: '3px' }}>{song.formattedTimestamp}</Typography>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                ) : (
                                    <p>No pending songs available</p>
                                )}
                            </TabPanel>
                        )} */}

            {value === "1" && (
              <TabPanel value="1" className="SongPanel">
                {loading ? (
                  <p>Loading...</p>
                ) : error ? (
                  <p className="error-message">Error: {error}</p>
                ) : (albums.length > 0 || songs.length > 0) ? (
                  <Box className="SongGrid">
                    {/* Display Albums as folders */}
                    {albums.map((album, index) => (
                      <Box
                        key={`album-${album.album_id}`}
                        className="song-item album-item"
                        sx={{
                          position: "relative",
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "8px",
                        }}
                        onClick={() => {
                          navigate(`/admin/album/${album.album_id}`, { state: { decision: value === "1" ? "Pending" : "Approved" } });
                        }}
                      >
                        <img
                          src={album.coverPageUrl || coverpage}
                          alt={album.albumName}
                          className="songcover"
                          onError={(e) => {
                            e.target.src = coverpage; // fallback if URL is broken
                          }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" sx={{ fontSize: "22px" }}>
                            {album.albumName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginTop: "5px",
                              fontSize: "20px",
                              color: "#A5A5A5",
                            }}
                          >
                            {album.stage_name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginTop: "5px",
                              fontSize: "20px",
                              color: "#A5A5A5",
                            }}
                          >
                            {album.songs.length} out of {albumTotalCounts[album.album_id] || album.songs.length} songs
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              marginLeft: "15px",
                              alignSelf: "flex-start",
                              marginTop: "3px",
                            }}
                          >
                            {album.formattedTimestamp}
                          </Typography>
                        </Box>

                      </Box>
                    ))}

                    {/* Display individual songs (not part of albums) */}
                    {songs.map((song, index) => (
                      <Box
                        key={`single-song-${index}`}
                        className="song-item"
                        sx={{ position: "relative" }}
                        onClick={() => handleSongClick(song)}
                      >
                        <img
                          src={song.coverPageUrl || coverpage}
                          alt={song.songName}
                          className="songcover"
                          onError={(e) => {
                            e.target.src = coverpage; // fallback if URL is broken
                          }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" sx={{ fontSize: "22px" }}>
                            {song.songName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginTop: "5px",
                              fontSize: "20px",
                              color: "#A5A5A5",
                            }}
                          >
                            {song.stage_name || song.FullName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginTop: "5px",
                              fontSize: "20px",
                              color: "#A5A5A5",
                            }}
                          >
                            {song.languages}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              marginLeft: "15px",
                              alignSelf: "flex-start",
                              marginTop: "3px",
                            }}
                          >
                            {song.span}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginLeft: "15px",
                              alignSelf: "flex-start",
                              marginTop: "3px",
                            }}
                          >
                            {song.formattedTimestamp}
                          </Typography>
                        </Box>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSongMenuOpen(e, song);
                          }}
                          sx={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            color: "white",
                            zIndex: 10,
                            marginRight: "-35px",
                          }}
                        >
                          <MoreVertical size={20} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <p>No pending songs available</p>
                )}
              </TabPanel>
            )}

            {value === "2" && (
              <TabPanel value="2" className="SongPanel">
                {loading ? (
                  <p>Loading...</p>
                ) : error ? (
                  <p className="error-message">Error: {error}</p>
                ) : (albums.length > 0 || songs.length > 0) ? (
                  <Box className="SongGrid">
                    {/* Display Albums as folders */}
                    {albums.map((album, index) => (
                      <Box
                        key={`album-${album.album_id}`}
                        className="song-item album-item"
                        sx={{
                          position: "relative",
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "8px",
                        }}
                        onClick={() => {
                          navigate(`/admin/album/${album.album_id}`, { state: { decision: value === "1" ? "Pending" : "Approved" } });
                        }}
                      >
                        <img
                          src={album.coverPageUrl || coverpage}
                          alt={album.albumName}
                          className="songcover"
                          onError={(e) => {
                            e.target.src = coverpage; // fallback if URL is broken
                          }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" sx={{ fontSize: "22px" }}>
                            {album.albumName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginTop: "5px",
                              fontSize: "20px",
                              color: "#A5A5A5",
                            }}
                          >
                            {album.stage_name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginTop: "5px",
                              fontSize: "20px",
                              color: "#A5A5A5",
                            }}
                          >
                            {album.songs.length} out of {albumTotalCounts[album.album_id] || album.songs.length} songs
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              marginLeft: "15px",
                              alignSelf: "flex-start",
                              marginTop: "3px",
                            }}
                          >
                            {album.formattedTimestamp}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                    
                    {/* Display individual songs */}
                    {songs.map((song, index) => (
                      <Box
                        key={index}
                        className="song-item"
                        sx={{ position: "relative" }}
                        onClick={() => handleSongClick(song)}
                      >
                        <img
                          src={song.coverPageUrl || coverpage}
                          alt={song.songName}
                          className="songcover"
                          onError={(e) => {
                            e.target.src = coverpage; // fallback if URL is broken
                          }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" sx={{ fontSize: "22px" }}>
                            {song.songName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginTop: "5px",
                              fontSize: "20px",
                              color: "#A5A5A5",
                            }}
                          >
                            {song.stage_name || song.FullName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginTop: "5px",
                              fontSize: "20px",
                              color: "#A5A5A5",
                            }}
                          >
                            {song.languages}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              marginLeft: "15px",
                              alignSelf: "flex-start",
                              marginTop: "3px",
                            }}
                          >
                            {song.span}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginLeft: "15px",
                              alignSelf: "flex-start",
                              marginTop: "3px",
                            }}
                          >
                            {song.formattedTimestamp}
                          </Typography>
                        </Box>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSongMenuOpen(e, song);
                          }}
                          sx={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            color: "white",
                            zIndex: 10,
                            marginRight: "-35px",
                          }}
                        >
                          <MoreVertical size={20} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <p>No approved songs available</p>
                )}
              </TabPanel>
            )}

            {/* {value === '2' && (
{{ ... }}
                            <TabPanel value="2" className="SongPanel">
                                {loading ? (
                                    <p>Loading...</p>
                                ) : error ? (
                                    <p className="error-message">Error: {error}</p>
                                ) : songs.length > 0 ? (
                                    <Box className="SongGrid">
                                        {songs.map((song, index) => (
                                            <Box key={index} className="song-item" onClick={() => handleSongClick(song)}>
                                                {song.coverPageUrl ? (
                                                    <img
                                                        src={song.coverPageUrl}
                                                        alt={song.songName}
                                                        className="songcover"
                                                    />
                                                ) : (
                                                    <Avatar
                                                        alt={song.songName}
                                                        variant="square"
                                                        sx={{ width: 100, height: 100 }}
                                                        className='songcover'
                                                    >
                                                    </Avatar>
                                                )}
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="body1" sx={{ fontSize: '22px' }}>{song.songName}</Typography>
                                                    <Typography variant="body2" sx={{ marginTop: '5px', fontSize: '20px', color: '#A5A5A5' }}>{song.stage_name}</Typography>
                                                    <Typography variant="body2" sx={{ marginTop: '5px', fontSize: '20px', color: '#A5A5A5' }}>{song.languages}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" sx={{ marginLeft: '15px', alignSelf: 'flex-start', marginTop: '3px' }}>{song.span}</Typography>
                                                    <Typography variant="body2" sx={{ marginLeft: '15px', alignSelf: 'flex-start', marginTop: '3px' }}>{song.formattedTimestamp}</Typography>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                ) : (
                                    <p>No approved songs available</p>
                                )}
                            </TabPanel>
                        )} */}

            {value === "3" && (
              <TabPanel value="3" className="SongPanel">
                {loading ? (
                  <p>Loading...</p>
                ) : error ? (
                  <p className="error-message">Error: {error}</p>
                ) : (albums.length > 0 || songs.length > 0) ? (
                  <Box className="SongGrid">
                    {/* Display albums */}
                    {albums.map((album) => (
                      <Box
                        key={`album-${album.album_id}`}
                        className="song-item album-item"
                        sx={{
                          position: "relative",
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "8px",
                        }}
                        onClick={() => navigate(`/admin/album/${album.album_id}`, { state: { decision: value === "1" ? "Pending" : value === "2" ? "Approved" : "Rejected" } })}
                      >
                        <img
                          src={album.coverPageUrl || coverpage}
                          alt={album.albumName}
                          className="songcover"
                          onError={(e) => {
                            e.target.src = coverpage; // fallback if URL is broken
                          }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" sx={{ fontSize: "22px" }}>
                            {album.albumName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginTop: "5px",
                              fontSize: "20px",
                              color: "#A5A5A5",
                            }}
                          >
                            {album.stage_name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginTop: "5px",
                              fontSize: "20px",
                              color: "#A5A5A5",
                            }}
                          >
                            {album.songs.length} out of {albumTotalCounts[album.album_id] || album.songs.length} songs
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              marginLeft: "15px",
                              alignSelf: "flex-start",
                              marginTop: "3px",
                            }}
                          >
                            {album.formattedTimestamp}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                    
                    {/* Display individual songs */}
                    {songs.map((song, index) => (
                      <Box
                        key={index}
                        className="song-item"
                        onClick={() => handleSongClick(song)}
                      >
                        <img
                          src={song.coverPageUrl || coverpage}
                          alt={song.songName}
                          className="songcover"
                          onError={(e) => {
                            e.target.src = coverpage; // fallback if URL is broken
                          }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" sx={{ fontSize: "22px" }}>
                            {song.songName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginTop: "5px",
                              fontSize: "20px",
                              color: "#A5A5A5",
                            }}
                          >
                            {song.stage_name || song.FullName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginTop: "5px",
                              fontSize: "20px",
                              color: "#A5A5A5",
                            }}
                          >
                            {song.languages}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              marginLeft: "15px",
                              alignSelf: "flex-start",
                              marginTop: "3px",
                            }}
                          >
                            {song.span}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginLeft: "15px",
                              alignSelf: "flex-start",
                              marginTop: "3px",
                            }}
                          >
                            {song.formattedTimestamp}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <p>No rejected songs available</p>
                )}
              </TabPanel>
            )}

            {/* {value === "4" && (
              <TabPanel value="4">
                {loadingFeedback ? (
                  <p>Loading feedback...</p>
                ) : error ? (
                  <p className="error-message">Error: {error}</p>
                ) : feedback.length > 0 ? (
                  <Box display={"flex"}>
                    <Box
                      sx={{
                        maxHeight: "70vh",
                        overflowY: "auto",
                        paddingRight: 2,
                        "&::-webkit-scrollbar": {
                          width: "8px",
                        },
                        "&::-webkit-scrollbar-track": {
                          background: "#f1f1f1",
                        },
                        "&::-webkit-scrollbar-thumb": {
                          background: "#888",
                          borderRadius: "4px",
                        },
                        "&::-webkit-scrollbar-thumb:hover": {
                          background: "#555",
                        },
                      }}
                    >
                      {feedback.map((user, index) => (
                        <Box
                          key={index}
                          sx={{
                            marginBottom: 2,
                            padding: 2,
                            borderRadius: 1,
                            marginRight: 10,
                            cursor: "pointer",
                            backgroundColor:
                              selectedUserId === user.user_id ? "#3b4a6b" : "", // Highlight if selected
                          }}
                          onClick={() => handleUserClick(user.user_id)}
                        >
                          <Box display={"flex"} alignItems="center">
                            {user.profilePhotoUrl ? (
                              <img
                                src={user.profilePhotoUrl}
                                style={{
                                  width: 86,
                                  height: 86,
                                  borderRadius: "50%",
                                  marginRight: 15,
                                }}
                              />
                            ) : (
                              <Avatar
                                sx={{ marginRight: 2, width: 76, height: 76 }}
                              />
                            )}

                            <Box>
                              <Typography
                                variant="h6"
                                sx={{ fontSize: "22px", color: "#FFFF" }}
                              >
                                {user.StageName || user.FullName}
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{ fontSize: "18px", color: "#A5A5A5" }}
                              >
                                {user.Category}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontSize: "16px", color: "#A5A5A5" }}
                              >
                                {user.EmailId}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>

                    <Box>
                      <Card
                        sx={{
                          marginTop: 2,
                          padding: 1,
                          width: 680,
                          marginLeft: 2,
                          backgroundColor: "#d9d9d9",
                          maxHeight: "70vh",
                          overflowY: "auto",
                          "&::-webkit-scrollbar": {
                            width: "8px",
                          },
                          "&::-webkit-scrollbar-track": {
                            background: "#f1f1f1",
                          },
                          "&::-webkit-scrollbar-thumb": {
                            background: "#888",
                            borderRadius: "4px",
                          },
                          "&::-webkit-scrollbar-thumb:hover": {
                            background: "#555",
                          },
                        }}
                      >
                        {loadingFeedbackDetails ? (
                          <p>Loading feedback details...</p>
                        ) : feedbackDetails && feedbackDetails.length > 0 ? (
                          feedbackDetails.map((detail, index) => (
                            <Box
                              key={index}
                              sx={{ marginBottom: 1, padding: 3 }}
                            >
                              <Box
                                sx={{ marginBottom: 3, textAlign: "center" }}
                              >
                                <Typography variant="h6">Feedback</Typography>
                              </Box>
                              <Box sx={{ textAlign: "right" }}>
                                <Typography variant="h7">
                                  {detail.formattedTimestamp}
                                </Typography>
                              </Box>
                              <Box sx={{ marginBottom: 3 }}>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontSize: "22px",
                                    color: "black !important",
                                    fontWeight: 700,
                                  }}
                                >
                                  How's your experience using Voiz app?
                                </Typography>
                                <RadioGroup row value={detail.experience.S}>
                                  {[1, 2, 3, 4, 5].map((value) => (
                                    <FormControlLabel
                                      key={value}
                                      value={value.toString()}
                                      control={
                                        <Radio
                                          sx={{ color: "black !important" }}
                                        />
                                      }
                                      label={
                                        <Typography
                                          sx={{ color: "black !important" }}
                                        >
                                          {value}
                                        </Typography>
                                      }
                                      disabled
                                    />
                                  ))}
                                </RadioGroup>
                              </Box>
                              <Box sx={{ marginBottom: 3 }}>
                                {" "}
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontSize: "22px",
                                    color: "black !important",
                                    fontWeight: 700,
                                  }}
                                >
                                  How can we improve?
                                </Typography>
                                <Typography
                                  className="underlinedValue"
                                  sx={{
                                    fontSize: "18px",
                                    color: "black !important",
                                  }}
                                >
                                  {detail.improve.S}
                                </Typography>
                              </Box>
                              <Box sx={{ marginBottom: 3 }}>
                                {" "}
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontSize: "20px",
                                    color: "black !important",
                                    fontWeight: 700,
                                  }}
                                >
                                  Share your Ideas:
                                </Typography>
                                <Typography
                                  className="underlinedValue"
                                  sx={{
                                    fontSize: "18px",
                                    color: "black !important",
                                  }}
                                >
                                  {detail.yourIdeas.S}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontSize: "20px",
                                    color: "black !important",
                                    fontWeight: 700,
                                  }}
                                >
                                  What would motivate you to share our app with
                                  friends and family?
                                </Typography>
                                <Typography
                                  className="underlinedValue"
                                  sx={{
                                    fontSize: "18px",
                                    color: "black !important",
                                  }}
                                >
                                  {" "}
                                  {detail.motivation.S}
                                </Typography>
                              </Box>
                              {index < feedbackDetails.length - 1 && (
                                <Divider
                                  sx={{
                                    flexGrow: 1,
                                    height: "3px",
                                    bgcolor: "gray",
                                    width: "100%",
                                    marginTop: 7,
                                  }}
                                />
                              )}{" "}
                              {/* Divider between sections */}
                            {/* </Box>
                          ))
                        ) : (
                          <p>Click on a user to view feedback details.</p>
                        )}
                      </Card>
                    </Box>
                  </Box>
                ) : (
                  <p>No feedback available</p>
                )}
              </TabPanel>
            // )} */}
              {value === "4" && (
  <TabPanel value="4">
    {loadingFeedback ? (
      <p>Loading feedback...</p>
    ) : error ? (
      <p className="error-message">Error: {error}</p>
    ) : feedback.length > 0 ? (
      <Box display={"flex"}>
        <Box
          sx={{
            maxHeight: "70vh",
            overflowY: "auto",
            paddingRight: 2,
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "#f1f1f1",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#888",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "#555",
            },
          }}
        >
          {feedback.map((user, index) => (
            <Box
              key={index}
              sx={{
                marginBottom: 2,
                padding: 2,
                borderRadius: 1,
                marginRight: 10,
                cursor: "pointer",
                backgroundColor:
                  selectedUserId === user.user_id ? "#3b4a6b" : "",
              }}
              onClick={() => handleUserClick(user.user_id)}
            >
              <Box display={"flex"} alignItems="center">
                {user.profilePhotoUrl ? (
                  <img
                    src={user.profilePhotoUrl}
                    style={{
                      width: 86,
                      height: 86,
                      borderRadius: "50%",
                      marginRight: 15,
                    }}
                  />
                ) : (
                  <Avatar
                    sx={{ marginRight: 2, width: 76, height: 76 }}
                  />
                )}

                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: "22px", color: "#FFFF" }}
                  >
                    {user.StageName || user.FullName}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ fontSize: "18px", color: "#A5A5A5" }}
                  >
                    {user.Category}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: "16px", color: "#A5A5A5" }}
                  >
                    {user.EmailId}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>

        <Box>
          <Card
            sx={{
              marginTop: 2,
              padding: 1,
              width: 680,
              marginLeft: 2,
              backgroundColor: "#d9d9d9",
              maxHeight: "70vh",
              overflowY: "auto",
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: "#f1f1f1",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#888",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                background: "#555",
              },
            }}
          >
            {loadingFeedbackDetails ? (
              <p>Loading feedback details...</p>
            ) : feedbackDetails && feedbackDetails.length > 0 ? (
              feedbackDetails.map((detail, index) => (
                <Box
                  key={index}
                  sx={{ marginBottom: 1, padding: 3 }}
                >
                  <Box
                    sx={{ marginBottom: 3, textAlign: "center" }}
                  >
                    <Typography variant="h6">Feedback</Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="h7">
                      {detail.formattedTimestamp}
                    </Typography>
                  </Box>
                  <Box sx={{ marginBottom: 3 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: "22px",
                        color: "black !important",
                        fontWeight: 700,
                      }}
                    >
                      How's your experience using Voiz app?
                    </Typography>
                    <RadioGroup row value={detail.experience.S}>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <FormControlLabel
                          key={value}
                          value={value.toString()}
                          control={
                            <Radio
                              sx={{ color: "black !important" }}
                            />
                          }
                          label={
                            <Typography
                              sx={{ color: "black !important" }}
                            >
                              {value}
                            </Typography>
                          }
                          disabled
                        />
                      ))}
                    </RadioGroup>
                  </Box>
                  <Box sx={{ marginBottom: 3 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: "22px",
                        color: "black !important",
                        fontWeight: 700,
                      }}
                    >
                      How do you like the content?
                    </Typography>
                    <RadioGroup row value={detail.content?.S || "0"}>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <FormControlLabel
                          key={value}
                          value={value.toString()}
                          control={
                            <Radio
                              sx={{ color: "black !important" }}
                            />
                          }
                          label={
                            <Typography
                              sx={{ color: "black !important" }}
                            >
                              {value}
                            </Typography>
                          }
                          disabled
                        />
                      ))}
                    </RadioGroup>
                  </Box>
                  <Box sx={{ marginBottom: 3 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: "22px",
                        color: "black !important",
                        fontWeight: 700,
                      }}
                    >
                      How can we improve?
                    </Typography>
                    <Typography
                      className="underlinedValue"
                      sx={{
                        fontSize: "18px",
                        color: "black !important",
                      }}
                    >
                      {detail.improve.S}
                    </Typography>
                  </Box>
                  <Box sx={{ marginBottom: 3 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: "20px",
                        color: "black !important",
                        fontWeight: 700,
                      }}
                    >
                      Share your Ideas:
                    </Typography>
                    <Typography
                      className="underlinedValue"
                      sx={{
                        fontSize: "18px",
                        color: "black !important",
                      }}
                    >
                      {detail.yourIdeas.S}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: "20px",
                        color: "black !important",
                        fontWeight: 700,
                      }}
                    >
                      What would motivate you to share our app with
                      friends and family?
                    </Typography>
                    <Typography
                      className="underlinedValue"
                      sx={{
                        fontSize: "18px",
                        color: "black !important",
                      }}
                    >
                      {detail.motivation.S}
                    </Typography>
                  </Box>
                  {index < feedbackDetails.length - 1 && (
                    <Divider
                      sx={{
                        flexGrow: 1,
                        height: "3px",
                        bgcolor: "gray",
                        width: "100%",
                        marginTop: 7,
                      }}
                    />
                  )}
                </Box>
              ))
            ) : (
              <p>Click on a user to view feedback details.</p>
            )}
          </Card>
        </Box>
      </Box>
    ) : (
      <p>No feedback available</p>
    )}
  </TabPanel>
)}

            {value === "5" && (
              <TabPanel value="5" className="SongPanel">
                {loading ? (
                  <p>Loading...</p>
                ) : error ? (
                  <p className="error-message">Error: {error}</p>
                ) : songs.length > 0 ? (
                  <Box className="SongGrid">
                    {songs.map((song, index) => (
                      <Box
                        key={index}
                        className="song-item"
                        onClick={() => handleSongClick(song)}
                      >
                        {song.coverPageUrl ? (
                          <img
                            // src={song.coverPageUrl}
                            // alt={song.songName}
                            // className="songcover"
                            src={song.coverPageUrl || coverpage}
                            alt={song.songName}
                            className="songcover"
                            onError={(e) => {
                              e.target.src = coverpage; // fallback if URL is broken
                            }}
                          />
                        ) : (
                          <Avatar
                            alt={song.songName}
                            variant="square"
                            sx={{ width: 100, height: 100 }}
                            className="songcover"
                          />
                        )}
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" sx={{ fontSize: "22px" }}>
                            {song.songName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginTop: "5px",
                              fontSize: "20px",
                              color: "#A5A5A5",
                            }}
                          >
                            {song.stage_name || song.FullName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginTop: "5px",
                              fontSize: "20px",
                              color: "#A5A5A5",
                            }}
                          >
                            {song.languages}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              marginLeft: "15px",
                              alignSelf: "flex-start",
                              marginTop: "3px",
                            }}
                          >
                            {song.span}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              marginLeft: "15px",
                              alignSelf: "flex-start",
                              marginTop: "3px",
                            }}
                          >
                            {song.formattedTimestamp}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <p>No deleted songs available</p>
                )}
              </TabPanel>
            )}
          </TabContext>
        </Card>
      </Box>
      {/* Song Menu */}
      <Menu
        anchorEl={songMenuAnchor}
        open={Boolean(songMenuAnchor)}
        onClose={handleSongMenuClose}
        sx={{
          "& .MuiPaper-root": {
            backgroundColor: "#131337",
            color: "white",
            borderRadius: "15px",
          },
        }}
      >
        <MenuItem onClick={() => setOpenDeleteDialog(true)}>
          <img
            src={Delete}
            alt="Delete"
            style={{
              width: "16px",
              height: "16px",
            }}
          />
          &nbsp; &nbsp; Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        disableEnforceFocus
        onClose={() => {
          setOpenDeleteDialog(false);
          setDeleteReason("");
          setDeleteAttachment("");
          setDeleteAttachmentFile(null);
          setDeleteError("");
        }}
        
        sx={{
          "& .MuiDialog-paper": {
            width: "400px !important",
            minHeight: "300px !important",
            borderRadius: "16px",
            backgroundColor: "#100F32",
            color: "white",
            boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.5)",
            padding: "20px",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "white",
            textAlign: "center",
            fontSize: "18px",
            fontWeight: "500",
            paddingBottom: "20px",
          }}
        >
          Delete Song?
        </DialogTitle>
        <Label
          style={{
            color: "white",
            marginLeft: "25px",
          }}
        >
          Reason for Deletion <span style={{ color: "red" }}>*</span>
        </Label>
        <Box sx={{ padding: "0 24px" }}>
          {/* <TextField
            placeholder="Reason for Deletion"
            required
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            
            multiline
            rows={3}
            sx={{
              marginBottom: "10px",
              width: "310px !important",
              "& .MuiOutlinedInput-root": {
                color: "black",
                "& fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.23)",
                },
                "&:hover fieldset": {
                  borderColor: "white",
                },
              },
              "& .MuiInputLabel-root": {
                color: "black",
              },
            }}
          /> */
          
          <input
          type="text"
          placeholder="Reason for Deletion"
          value={deleteReason}
          onChange={(e) => setDeleteReason(e.target.value)}
          style={{
            width: "310px",
            minHeight: "55px", // Match multiline height
            padding: "10px",
            marginBottom: "12px",
            marginTop: "8px",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.23)",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            color: "black",
            fontSize: "16px",
            outline: "none",
            resize: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "white")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.23)")}
        />

          }
          <Label
            style={{
              color: "white",
            }}
          >
            Attachment
            {/* (PDF, Text, Word, Images) */}
          </Label>
          {/* <TextField
            
            fullWidth
            type="file"
            InputLabelProps={{
              accept: ".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png",
            }}
            inputProps={{
              accept: ".pdf",
            }}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                // Validate file type
                if (!ALLOWED_FILE_TYPES[file.type]) {
                  setDeleteError(
                    "Please upload only PDF, Text, Word documents (DOC/DOCX), or Image files (JPG/JPEG/PNG)"
                  );
                  e.target.value = ""; // Clear the input
                  return;
                }

                // Validate file size
                if (file.size > MAX_FILE_SIZE) {
                  setDeleteError("File size should not exceed 5MB");
                  e.target.value = ""; // Clear the input
                  return;
                }

                // Set the file
                setDeleteAttachmentFile(file);
                setDeleteError("");
              }
            }}
            sx={{
              marginBottom: "20px",
              width: "310px !important",
              "& .MuiOutlinedInput-root": {
                color: "black",
                "& fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.23)",
                },
                "&:hover fieldset": {
                  borderColor: "white",
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255, 255, 255, 0.7)",
              },
            }}
          /> */}

<Box sx={{ marginBottom: "20px", width: "310px" }}>
  {/* <label htmlFor="file-upload">
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px",
        borderRadius: "4px",
        border: "1px solid rgba(255, 255, 255, 0.23)",
        backgroundColor: "transparent",
        color: "white",
        cursor: "pointer",
        "&:hover": {
          borderColor: "white",
        },
      }}
    >
      {deleteAttachmentFile ? deleteAttachmentFile.name : "Choose File"}
    </Box>
  </label>
  
  <input
    id="file-upload"
    type="file"
    accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png"
    style={{ display: "none" }}
    onChange={(e) => {
      const file = e.target.files[0];
      if (file) {
        // Validate file type
        if (!ALLOWED_FILE_TYPES[file.type]) {
          setDeleteError("Please upload only allowed file types.");
          e.target.value = ""; // Clear input
          return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          setDeleteError("File size should not exceed 5MB");
          e.target.value = ""; // Clear input
          return;
        }

        // Set the file
        setDeleteAttachmentFile(file);
        setDeleteError("");
      }
    }}
  />

  {deleteAttachmentFile && (
    <Typography sx={{ color: "green", fontSize: "14px", marginTop: "5px" }}>
      Selected file: {deleteAttachmentFile.name}
    </Typography>
  )} */}




      <div style={{ position: "relative", width: "310px", marginBottom: "20px" }}>
        {/* Styled input for display */}
        <input
          type="text"
          readOnly
          placeholder=""
          value={deleteAttachmentFile?.name || ""}
          style={{
            width: "310px",
            minHeight: "50px",
            padding: "10px",
            marginTop: "8px",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.23)",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            color: "black",
            fontSize: "16px",
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "white")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.23)")}
        />

        {/* Real hidden file input */}
        <input
          type="file"
          accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png"
          onChange={(e) => setDeleteAttachment(e.target.value)}
          style={{
            position: "absolute",
            color: "black",
            top: "17px",
            left: "11px",
            width: "310px",
            height: "55px",
            opacity: 0,
            cursor: "pointer",
          }}
        />
      </div>

      

</Box>

          {deleteAttachmentFile && (
            <Typography
              sx={{
                color: "green",
                marginBottom: "10px",
                fontSize: "14px",
                textAlign: "center",
              }}
            >
              Selected file: {deleteAttachmentFile.name} (
              {ALLOWED_FILE_TYPES[deleteAttachmentFile.type]})
            </Typography>
          )}

          {/* <TextField
                        fullWidth
                        placeholder="Attachment URL (Optional)"
                        value={deleteAttachment}
                        onChange={(e) => setDeleteAttachment(e.target.value)}
                        sx={{
                            marginBottom: "20px",
                            width: "310px !important",
                            "& .MuiOutlinedInput-root": {
                                color: "black",
                                "& fieldset": {
                                    borderColor: "rgba(255, 255, 255, 0.23)",
                                },
                                "&:hover fieldset": {
                                    borderColor: "white",
                                },
                            },
                            "& .MuiInputLabel-root": {
                                color: "rgba(255, 255, 255, 0.7)",
                            },
                        }}
                    /> */}

          {deleteError && (
            <Typography
              color="error"
              sx={{
                marginBottom: "15px",
                fontSize: "14px",
                textAlign: "center",
              }}
            >
              {deleteError}
            </Typography>
          )}
        </Box>

        <DialogActions
          sx={{ justifyContent: "center", gap: "16px", padding: "20px" }}
        >
          <Button
            onClick={() => {
              setOpenDeleteDialog(false);
              setDeleteReason("");
              setDeleteAttachment("");
              setDeleteError("");
              setSongMenuAnchor(false);
            }}
            sx={{
              color: "#2782EE",
              textTransform: "none",
              fontSize: "16px",
              "&:hover": {
                backgroundColor: "rgba(39, 130, 238, 0.08)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteSong}
            sx={{
              color: "#2782EE",
              textTransform: "none",
              fontSize: "16px",
              "&:hover": {
                backgroundColor: "rgba(255, 77, 77, 0.08)",
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
