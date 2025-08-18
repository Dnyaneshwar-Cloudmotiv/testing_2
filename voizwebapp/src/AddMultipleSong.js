// import React, { useState, useEffect } from "react";
// import ConfirmationModal from './ConfirmationModal';
// import UploadTermsModal from './UploadTermsModal';
// import './ConfirmationModal.css';
// import { useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Box,
//   Typography,
//   TextField,
//   Button,
//   MenuItem,
//   Select,
//   FormControl,
//   InputLabel,
//   IconButton,
//   Paper,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Grid,
//   Tabs,
//   Tab,
//   FormHelperText,
//   Tooltip,
//   InputAdornment,
// } from "@mui/material";
// import { LoadingButton } from '@mui/lab';
// import DeleteIcon from "@mui/icons-material/Delete"; // Import Delete icon
// import AddIcon from "@mui/icons-material/Add";
// import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
// import SideBar from "./SideBar";
// import "./AddMultipleSong.css";

// export default function AddMultipleSong() {
//   const StageName = localStorage.getItem("StageName");
//   const FullName = localStorage.getItem("FullName");
//   const defaultName = StageName || FullName || "";
//   const user_id = localStorage.getItem("user_id");
//   const navigate = useNavigate();

//   // State for album details
//   const [albumDetails, setAlbumDetails] = useState({
//     albumName: "",
//     albumCoverImg: "",
//     albumCoverFileName: "",
//   });

//   // State for multiple song entries
//   const [songs, setSongs] = useState([
//     {
//       songName: "",
//       language: "",
//       genre: "",
//       lyricsFileName: "",
//       fileName: "",
//       singer: "",
//       producer: "",
//       composer: "",
//       lyricist: "",
//       songCoverImg: "",
//       songImageFileName: "", // Add field for song cover image filename
//       mood: "",
//       story: "",
//       span: "", // Add span field
//       id: Date.now(),
//       isValidated: false, // Track if song details are validated
//     },
//   ]);

//   // State for active tab
//   const [activeTab, setActiveTab] = useState(0);

//   // State for validation errors
//   const [errors, setErrors] = useState({
//     albumName: "",
//     albumCoverImg: "",
//     songs: [
//       {
//         songName: "",
//         language: "",
//         genre: "",
//         lyricsFileName: "",
//         fileName: "",
//         singer: "",
//         producer: "",
//         composer: "",
//         lyricist: "",
//         songCoverImg: "",
//         mood: "",
//         story: "",
//       },
//     ],
//   });

//   // State for dialog and loading
//   const [openDialog, setOpenDialog] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   // State for focus tracking
//   const [isFocused, setIsFocused] = useState(false); // Track language focus
//   const [isGenreFocused, setIsGenreFocused] = useState(false); // Track genre focus

//   // Handle album details change
//   const handleAlbumChange = (e) => {
//     const { name, value } = e.target;
//     setAlbumDetails({ ...albumDetails, [name]: value });
//     setErrors({ ...errors, [name]: "" });
//   };

//   // Handle song input change
//   const handleSongChange = (index) => (e) => {
//     const { name, value } = e.target;
//     const updatedSongs = [...songs];
//     const updatedErrors = [...errors.songs];
//     updatedSongs[index] = { ...updatedSongs[index], [name]: value, isValidated: false };
//     updatedErrors[index] = { ...updatedErrors[index], [name]: "" };
//     setSongs(updatedSongs);
//     setErrors({ ...errors, songs: updatedErrors });
//   };

//   const handleStoryChange = (index) => (e) => {
//     const { value } = e.target;
//     const words = value.split(/\s+/).filter(Boolean);

//     if (words.length <= 400) {
//       const updatedSongs = [...songs];
//       updatedSongs[index] = { ...updatedSongs[index], story: value };
//       setSongs(updatedSongs);
//     }
//   };

//   // Handle file input change
//   // const handleFileChange = (index, field) => (e) => {
//   //   const file = e.target.files[0];
//   //   if (file) {
//   //     // Define valid formats based on field type
//   //     const validFormats = {
//   //       lyricsFileName: ['text/plain', 'application/pdf'], // TXT and PDF for lyrics
//   //       fileName: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'], // Audio formats for song file
//   //       songCoverImg: ['image/jpeg', 'image/png', 'image/webp'], // JPG, PNG, WEBP for song cover
//   //       albumCoverImg: ['image/jpeg', 'image/png', 'image/webp'] // JPG, PNG, WEBP for album cover
//   //     };
      
//   //     // Get the valid formats for this field
//   //     const validTypes = validFormats[field] || validFormats.fileName;
      
//   //     // Check if file is valid format
//   //     if (!validTypes.includes(file.type)) {
//   //       const fileType = field === 'lyricsFileName' ? 'lyrics' : 'audio';
//   //       const allowedFormats = validTypes.map(type => {
//   //         if (type === 'text/plain') return 'TXT';
//   //         if (type === 'application/pdf') return 'PDF';
//   //         return type.split('/')[1].toUpperCase();
//   //       }).join(', ');
        
//   //       const updatedErrors = [...errors.songs];
//   //       updatedErrors[index] = { 
//   //         ...updatedErrors[index], 
//   //         [field]: `Please upload a valid ${fileType} file (${allowedFormats})`
//   //       };
//   //       setErrors({ ...errors, songs: updatedErrors });
//   //       e.target.value = ''; // Clear the input
//   //       return;
//   //     }

//   //     // Check file size (optional, you can adjust the limit)
//   //     if (file.size > 50 * 1024 * 1024) { // 50MB limit
//   //       const updatedErrors = [...errors.songs];
//   //       updatedErrors[index] = { 
//   //         ...updatedErrors[index], 
//   //         [field]: "File size too large. Maximum allowed size is 50MB"
//   //       };
//   //       setErrors({ ...errors, songs: updatedErrors });
//   //       e.target.value = '';
//   //       return;
//   //     }

//   //     const updatedSongs = [...songs];
//   //     const updatedErrors = [...errors.songs];
//   //     updatedSongs[index] = { ...updatedSongs[index], [field]: file.name, isValidated: false };
//   //     updatedErrors[index] = { ...updatedErrors[index], [field]: "" };
//   //     setSongs(updatedSongs);
//   //     setErrors({ ...errors, songs: updatedErrors });
//   //   }
//   // };

//   const handleFileChange = (index, field) => (e) => {
//     const file = e.target.files[0];
//     const updatedSongs = [...songs];
//     const updatedErrors = [...errors.songs];
    
//     // Clear error for this field
//     updatedErrors[index] = { ...updatedErrors[index], [field]: "" };
//     setErrors({ ...errors, songs: updatedErrors });
    
//     // If file is cleared (removed), update state with empty string
//     if (!file && (field === 'songImageFileName' || field === 'albumCoverImg')) {
//       updatedSongs[index] = { ...updatedSongs[index], [field]: "" };
//       setSongs(updatedSongs);
//       return;
//     }
    
//     if (file) {
//       // Define valid formats based on field type
//       const validFormats = {
//         lyricsFileName: ['text/plain', 'application/pdf'],
//         fileName: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'],
//         songCoverImg: ['image/jpeg', 'image/png', 'image/webp'],
//         songImageFileName: ['image/jpeg', 'image/png', 'image/webp'],
//         albumCoverImg: ['image/jpeg', 'image/png', 'image/webp']
//       };
      
//       const validTypes = validFormats[field] || validFormats.fileName;
      
//       if (!validTypes.includes(file.type)) {
//         // Determine the file type based on the field
//         let fileType;
//         if (field === 'lyricsFileName') {
//           fileType = 'lyrics';
//         } else if (field === 'songImageFileName' || field === 'albumCoverImg') {
//           fileType = 'image';
//         } else {
//           fileType = 'audio';
//         }
        
//         const allowedFormats = validTypes.map(type => {
//           if (type === 'text/plain') return 'TXT';
//           if (type === 'application/pdf') return 'PDF';
//           return type.split('/')[1].toUpperCase();
//         }).join(', ');
        
//         const updatedErrors = [...errors.songs];
//         updatedErrors[index] = { 
//           ...updatedErrors[index], 
//           [field]: `Please upload a valid ${fileType} file (${allowedFormats})`
//         };
//         setErrors({ ...errors, songs: updatedErrors });
//         e.target.value = '';
//         return;
//       }
  
//       if (file.size > 50 * 1024 * 1024) {
//         const updatedErrors = [...errors.songs];
//         updatedErrors[index] = { 
//           ...updatedErrors[index], 
//           [field]: "File size too large. Maximum allowed size is 50MB"
//         };
//         setErrors({ ...errors, songs: updatedErrors });
//         e.target.value = '';
//         return;
//       }
      
//       // Create a copy of the songs array
//       const updatedSongs = [...songs];
//       const updatedErrors = [...errors.songs];
      
//       // Update the file name in the songs array
//       updatedSongs[index] = { ...updatedSongs[index], [field]: file.name };
//       updatedErrors[index] = { ...updatedErrors[index], [field]: "" };
      
//       // Store the file reference for later retrieval
//       if (field === 'fileName') {
//         storeFileReference(file, index, 'song');
        
//         // Calculate duration for song file
//         const audio = new Audio(URL.createObjectURL(file));
//         audio.addEventListener("loadedmetadata", () => {
//           const durationInSeconds = audio.duration;
//           const minutes = Math.floor(durationInSeconds / 60);
//           const seconds = Math.floor(durationInSeconds % 60);
//           const formattedDuration = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
          
//           const songsWithDuration = [...updatedSongs];
//           songsWithDuration[index] = { ...songsWithDuration[index], span: formattedDuration };
//           setSongs(songsWithDuration);
//         });
//       } else if (field === 'lyricsFileName') {
//         storeFileReference(file, index, 'lyrics');
//       } else if (field === 'songImageFileName') {
//         storeFileReference(file, index, 'songImage');
//       } else if (field === "albumCoverImg") {
//         setAlbumDetails(prev => ({ ...prev, albumCoverImg: file.name }));
//         storeFileReference(file, null, 'albumCover');
//       }
      
//       // Update the songs state
//       setSongs(updatedSongs);
//       setErrors({ ...errors, songs: updatedErrors });
//     }
//   };

//   // Validate a single song
//   const validateSingleSong = (song, index) => {
//     const songErrors = {
//       songName: song.songName ? "" : "Song name is required",
//       language: song.language ? "" : "Language is required",
//       genre: song.genre ? "" : "Genre is required",
//       lyricsFileName: song.lyricsFileName ? "" : "Lyrics file is required",
//       fileName: song.fileName ? "" : "Song file is required",
//       songImageFileName: song.songImageFileName ? "" : "", // Optional field - no error if not provided
//       singer: song.singer ? "" : "Singer name is required",
//       mood: "",
//       story: "",
//       span: song.span ? "" : "Song duration is required",
//       producer: song.producer ? "" : "Producer is required",
//       composer: song.composer ? "" : "Composer is required",
//       lyricist: song.lyricist ? "" : "Lyricist is required",
//       songCoverImg: song.songCoverImg ? "" : "", // Optional field - no error if not provided
//     };
//     const updatedErrors = [...errors.songs];
//     updatedErrors[index] = songErrors;
//     setErrors({ ...errors, songs: updatedErrors });
//     return !Object.values(songErrors).some(Boolean);
//   };

//   // Add new song entry
//   const addSongEntry = () => {
//     const currentSong = songs[activeTab];
//     if (!validateSingleSong(currentSong, activeTab)) {
//       alert("Please fill all required fields for the current song before adding a new one.");
//       return;
//     }

//     // Mark current song as validated
//     const updatedSongs = [...songs];
//     updatedSongs[activeTab] = { ...updatedSongs[activeTab], isValidated: true };

//     // Create new song
//     const newSong = {
//       songName: "",
//       language: "",
//       genre: "",
//       lyricsFileName: "",
//       fileName: "",
//       singer: "",
//       producer: "",
//       composer: "",
//       lyricist: "",
//       songCoverImg: "",
//       mood: "",
//       story: "",
//       span: "", // Add span field
//       id: Date.now(),
//       isValidated: false,
//     };

//     // Append new song and update errors
//     updatedSongs.push(newSong);
//     const updatedErrors = [
//       ...errors.songs,
//       {
//         songName: "",
//         language: "",
//         genre: "",
//         lyricsFileName: "",
//         fileName: "",
//         singer: "",
//         producer: "",
//         composer: "",
//         lyricist: "",
//         songCoverImg: "",
//         mood: "",
//         story: "",
//       },
//     ];

//     setSongs(updatedSongs);
//     setErrors({ ...errors, songs: updatedErrors });
//     setActiveTab(updatedSongs.length - 1); // Switch to new song tab
//   };

//   // Remove song entry
//   const removeSongEntry = (index) => {
//     if (songs.length > 1) {
//       const updatedSongs = songs.filter((_, i) => i !== index);
//       const updatedErrors = errors.songs.filter((_, i) => i !== index);
//       setSongs(updatedSongs);
//       setErrors({ ...errors, songs: updatedErrors });
//       // Adjust active tab if the removed song was active or after it
//       if (index <= activeTab) {
//         setActiveTab(Math.max(0, activeTab - 1));
//       }
//     }
//   };

//   // Capitalize first letter of each word
//   const capitalizeFirstLetter = (text) => {
//     if (!text) return "";
//     return text
//       .split(" ")
//       .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//       .join(" ");
//   };

//   // Check for duplicate songs
//   const checkDuplicateSongs = async () => {
//     setIsLoading(true);
//     try {
//       const response = await fetch(
//         `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/approverList/decision?user_id=${user_id}&decision=Approved`
//       );
//       if (!response.ok) throw new Error("Failed to fetch songs");
//       const approvedSongs = await response.json();
//       return songs.map((song) =>
//         Array.isArray(approvedSongs)
//           ? approvedSongs.find(
//               (approvedSong) =>
//                 approvedSong.songName.toLowerCase() === song.songName.toLowerCase()
//             )
//           : null
//       );
//     } catch (error) {
//       console.error("Error checking duplicates:", error);
//       return Array(songs.length).fill(null);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Validate entire form
//   const validateForm = () => {
//     let hasErrors = false;
//     const newErrors = {
//       albumName: albumDetails.albumName ? "" : "Album name is required",
//       albumCoverImg: "", // Optional field - no error if not provided
//       songs: songs.map((song) => ({
//         songName: song.songName ? "" : "Song name is required",
//         language: song.language ? "" : "Language is required",
//         genre: song.genre ? "" : "Genre is required",
//         lyricsFileName: song.lyricsFileName ? "" : "Lyrics file is required",
//         fileName: song.fileName ? "" : "Song file is required",
//         singer: song.singer ? "" : "Singer is required",
//         mood: "",
//         story: "",
//         producer: song.producer ? "" : "Producer is required",
//         composer: song.composer ? "" : "Composer is required",
//         lyricist: song.lyricist ? "" : "Lyricist is required",
//         songCoverImg: "", // Optional field
//       })),
//     };
//     setErrors(newErrors);
//     hasErrors = Object.values(newErrors).some((error) =>
//       typeof error === "string" ? error : error.some((songError) => Object.values(songError).some(Boolean))
//     );
//     return !hasErrors;
//   };

//   // Handle form submission
//   const [showConfirmation, setShowConfirmation] = useState(false);
//   const [navigationData, setNavigationData] = useState(null);
//   const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

//   useEffect(() => {
//     // This effect triggers navigation only after the confirmation modal has been shown and then closed.
//     if (navigationData && !showConfirmation) {
//       // Clear navigation data to prevent multiple navigation attempts
//       setNavigationData(null);
//       navigate("/addsong", { state: { data: navigationData } });
//     }
//   }, [showConfirmation, navigationData, navigate]);



//   const handleSubmit = async () => {
//     // Validate current song before submission
//     if (!validateSingleSong(songs[activeTab], activeTab)) {
//       return;
//     }
//     if (!validateForm()) return;

//     // Mark current song as validated
//     const updatedSongs = [...songs];
//     updatedSongs[activeTab] = { ...updatedSongs[activeTab], isValidated: true };
//     setSongs(updatedSongs);

//     const duplicates = await checkDuplicateSongs();
//     const hasDuplicates = duplicates.some((song) => song !== null);
//     if (hasDuplicates) {
//       setOpenDialog(true);
//     } else {
//       handleOpenTermsModal();
//     }
//   };



//   // Upload file with progress tracking
//   const uploadFileWithProgress = async (file, presignedUrl, type) => {
//     return new Promise((resolve, reject) => {
//       const xhr = new XMLHttpRequest();
      
//       // Log the file details before upload
//       console.log(`Starting upload for ${type}:`, {
//         fileName: file.name,
//         fileSize: file.size,
//         fileType: file.type,
//         urlLength: presignedUrl.length
//       });

//       xhr.upload.addEventListener("progress", (event) => {
//         if (event.lengthComputable) {
//           const progress = (event.loaded / event.total) * 100;
//           console.log(`${type} upload progress for ${file.name}: ${progress.toFixed(2)}%`);
//           // You can add state to track progress if needed
//         }
//       });

//       xhr.addEventListener("load", () => {
//         if (xhr.status >= 200 && xhr.status < 300) {
//           console.log(`${type} upload complete for ${file.name}`);
//           resolve();
//         } else {
//           console.error(`Upload failed for ${file.name} with status ${xhr.status}:`, xhr.responseText);
//           reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
//         }
//       });

//       xhr.addEventListener("error", (e) => {
//         console.error(`Error uploading ${file.name}:`, e);
//         reject(new Error(`Upload failed for ${type} ${file.name}: ${e.message || 'Unknown error'}`));
//       });
      
//       xhr.addEventListener("timeout", () => {
//         console.error(`Upload timeout for ${file.name}`);
//         reject(new Error(`Upload timed out for ${type} ${file.name}`));
//       });
      
//       xhr.addEventListener("abort", () => {
//         console.error(`Upload aborted for ${file.name}`);
//         reject(new Error(`Upload aborted for ${type} ${file.name}`));
//       });

//       try {
//         xhr.open("PUT", presignedUrl);
        
//         // Set the appropriate Content-Type header based on file type
//         let contentType;
//         if (type === "song") {
//           contentType = "audio/mpeg";
//         } else if (type === "lyrics") {
//           contentType = "text/plain";
//         } else if (type === "songCoverImg" || type === "albumCover") {
//           // For image files, use the file's actual content type
//           contentType = file.type || "image/jpeg";
//         } else {
//           // Default fallback
//           contentType = "application/octet-stream";
//         }
        
//         xhr.setRequestHeader("Content-Type", contentType);
//         xhr.send(file);
//       } catch (error) {
//         console.error(`Exception during upload setup for ${file.name}:`, error);
//         reject(error);
//       }
//     });
//   };

//   // State  // Store uploaded files in memory for later retrieval using useRef to persist between renders
//   const uploadedFilesRef = useRef({
//     songs: {},
//     lyrics: {},
//     songImages: {},
//     albumCover: null,
//     songCount: 0,
//     lyricsCount: 0,
//     songImagesCount: 0
//   });

//   // Function to store file references when files are selected
//   const storeFileReference = (file, index, type) => {
//     if (!file) return;
    
//     if (type === 'song') {
//       uploadedFilesRef.current.songs[index] = file;
//       uploadedFilesRef.current.songs[file.name] = file;
//       uploadedFilesRef.current.songCount++;
//       console.log(`Stored song file reference for index ${index}, name: ${file.name}`);
//     } else if (type === 'lyrics') {
//       uploadedFilesRef.current.lyrics[index] = file;
//       uploadedFilesRef.current.lyrics[file.name] = file;
//       uploadedFilesRef.current.lyricsCount++;
//       console.log(`Stored lyrics file reference for index ${index}, name: ${file.name}`);
//     } else if (type === 'songImage') {
//       uploadedFilesRef.current.songImages[index] = file;
//       uploadedFilesRef.current.songImages[file.name] = file;
//       // Also store with songCoverImg field name for consistency with API
//       if (index !== null) {
//         const songData = songs[index];
//         if (songData && songData.songImageFileName) {
//           // Store using both field names for redundancy
//           uploadedFilesRef.current.songImages[songData.songImageFileName] = file;
//         }
//       }
//       uploadedFilesRef.current.songImagesCount++;
//       console.log(`Stored song image reference for index ${index}, name: ${file.name}`);
//     } else if (type === 'albumCover') {
//       uploadedFilesRef.current.albumCover = file;
//       console.log(`Stored album cover reference, name: ${file.name}`);
//     }
//   };



//   // Create timestamp in the format YYYYMMDD_HHMMSS
//   const createTimestamp = () => {
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, '0');
//     const day = String(now.getDate()).padStart(2, '0');
//     const hours = String(now.getHours()).padStart(2, '0');
//     const minutes = String(now.getMinutes()).padStart(2, '0');
//     const seconds = String(now.getSeconds()).padStart(2, '0');

//     return `${year}${month}${day}_${hours}${minutes}${seconds}`;
//   };

//   // Proceed to submit data to API
// const proceedToSubmit = async () => {
//   setIsLoading(true);
//   try {
//     // Generate timestamps for all songs
//     const currentTimestamp = createTimestamp();

//     // Format each song with all required fields
//     const formattedSongs = await Promise.all(songs.map(async (song) => {
//       const processedSong = {
//         songName: capitalizeFirstLetter(song.songName),
//         singer: capitalizeFirstLetter(song.singer || ""),
//         producer: capitalizeFirstLetter(song.producer || ""),
//         composer: capitalizeFirstLetter(song.composer || ""),
//         lyricist: capitalizeFirstLetter(song.lyricist || ""),
//         language: song.language || "",
//         genre: song.genre || "",
//         mood: song.mood || "",
//         story: song.story || "",
//         fileName: song.fileName,
//         lyricsFileName: song.lyricsFileName,
//         songImageFileName: song.songImageFileName || "", // Ensure optional
//       };
//       return processedSong;
//     }));

//     // Prepare songs for presigned URL request
//     const songsForPresignedUrls = formattedSongs.map(song => ({
//       songName: song.fileName,
//       lyricsFileName: song.lyricsFileName,
//       songImageFileName: song.songImageFileName // Consistent naming for presigned URLs
//     }));

//     // Log the formatted songs and presigned URL request for debugging
//     console.log('Formatted songs:', formattedSongs);
//     console.log('Songs for presigned URLs:', songsForPresignedUrls);

//     // Prepare the payload for presigned URLs
//     const presignedUrlPayload = {
//       user_id,
//       albumName: capitalizeFirstLetter(albumDetails.albumName),
//       albumCoverFileName: albumDetails.albumCoverImg || "",
//       songs: songsForPresignedUrls
//     };

//     console.log("Requesting presigned URLs for:", presignedUrlPayload);

//     // Get presigned URLs for all songs
//     const presignedUrlsResponse = await fetch(
//       "https://y6mkdwd71i.execute-api.ap-south-1.amazonaws.com/voiznew/generate-presigned-urls-bulk-parallel",
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(presignedUrlPayload),
//       }
//     );

//     if (!presignedUrlsResponse.ok) {
//       const errorData = await presignedUrlsResponse.json();
//       throw new Error(errorData.error || "Failed to get presigned URLs");
//     }

//     const presignedUrlsData = await presignedUrlsResponse.json();
//     console.log("Received presigned URLs:", presignedUrlsData);

//     // Dump the current state of uploadedFiles to console for debugging
//     console.log('Current uploadedFiles state:', uploadedFilesRef.current);

//     // Log actual file objects for verification
//     console.log('First song file:', uploadedFilesRef.current.songs[0] || 'Not found');
//     console.log('First lyrics file:', uploadedFilesRef.current.lyrics[0] || 'Not found');
//     console.log('First song image file:', uploadedFilesRef.current.songImages[0] || 'Not found');
//     console.log('Album cover file:', uploadedFilesRef.current.albumCover || 'Not found');

//     // Debug: print all song image files
//     console.log('All song image files:');
//     for (const key in uploadedFilesRef.current.songImages) {
//       if (uploadedFilesRef.current.songImages[key]) {
//         console.log(`- ${key}: ${uploadedFilesRef.current.songImages[key].name}`);
//       }
//     }

//     // Upload all files in parallel
//     const uploadPromises = [];
//     const failedUploads = [];

//     // Map to track which song index corresponds to which file name
//     const songNameToIndexMap = {};
//     const lyricsNameToIndexMap = {};
//     const songCoverImgToIndexMap = {};

//     // Build the mapping from file names to song indices
//     songs.forEach((song, index) => {
//       if (song.fileName) {
//         songNameToIndexMap[song.fileName] = index;
//       }
//       if (song.lyricsFileName) {
//         lyricsNameToIndexMap[song.lyricsFileName] = index;
//       }
//       if (song.songImageFileName) {
//         songCoverImgToIndexMap[song.songImageFileName] = index;
//       }
//     });

//     console.log('File to index mapping:', { songNameToIndexMap, lyricsNameToIndexMap, songCoverImgToIndexMap });

//     // Handle album cover image upload if available
//     let albumCoverFile = uploadedFilesRef.current.albumCover;

//     // If album cover file is not found in the ref, try to find it in the DOM
//     if (!albumCoverFile && albumDetails.albumCoverImg) {
//       console.log(`Album cover not found in ref, searching DOM for: ${albumDetails.albumCoverImg}`);
//       const fileInputs = document.querySelectorAll('input[type="file"]');
//       for (let input of fileInputs) {
//         if (input.files && input.files[0] && input.files[0].name === albumDetails.albumCoverImg) {
//           albumCoverFile = input.files[0];
//           console.log(`Found album cover file in DOM: ${albumCoverFile.name}`);
//           // Store it for future reference
//           uploadedFilesRef.current.albumCover = albumCoverFile;
//           break;
//         }
//       }
//     }

//     if (albumCoverFile && presignedUrlsData.albumCoverUrl) {
//       console.log(`Processing album cover: ${albumCoverFile.name}`);
//       uploadPromises.push(
//         uploadFileWithProgress(albumCoverFile, presignedUrlsData.albumCoverUrl, 'albumCover')
//           .catch(error => {
//             console.error(`Failed to upload album cover: ${error.message}`);
//             failedUploads.push(`Album cover: ${error.message}`);
//             return null;
//           })
//       );
//     } else {
//       console.log('No album cover file or no presigned URL provided. Treating as optional.');
//     }

//     // Process each song
//     for (const songData of presignedUrlsData.songs) {
//       const { songName, lyricsFileName, songImageFileName, songUrl, lyricsUrl, songImageUrl } = songData;

//       // Get the song index for this file
//       const songIndex = songNameToIndexMap[songName];
//       const lyricsIndex = lyricsNameToIndexMap[lyricsFileName];
//       const songImageIndex = songCoverImgToIndexMap[songImageFileName];

//       console.log(`Processing song: ${songName}, index: ${songIndex}`);
//       console.log(`Processing lyrics: ${lyricsFileName}, index: ${lyricsIndex}`);
//       console.log(`Processing song cover: ${songImageFileName}, index: ${songImageIndex}`);

//       // Try multiple methods to get the file
//       let songFile = null;
//       let lyricsFile = null;
//       let songImageFile = null;

//       // Method 1: Try by index
//       if (songIndex !== undefined) {
//         songFile = uploadedFilesRef.current.songs[songIndex];
//         if (songFile) console.log(`Found song file by index: ${songIndex}`);
//       }

//       if (lyricsIndex !== undefined) {
//         lyricsFile = uploadedFilesRef.current.lyrics[lyricsIndex];
//         if (lyricsFile) console.log(`Found lyrics file by index: ${lyricsIndex}`);
//       }

//       if (songImageIndex !== undefined) {
//         songImageFile = uploadedFilesRef.current.songImages[songImageIndex];
//         if (songImageFile) console.log(`Found song image file by index: ${songImageIndex}`);
//       }

//       // Try to find song image file by original field name in the songs array
//       if (!songImageFile && songIndex !== undefined) {
//         const songData = songs[songIndex];
//         if (songData && songData.songImageFileName) {
//           songImageFile = uploadedFilesRef.current.songImages[songData.songImageFileName];
//           if (songImageFile) console.log(`Found song image file by original field name: ${songData.songImageFileName}`);
//         }
//       }

//       // Method 2: Try by filename
//       if (!songFile) {
//         songFile = uploadedFilesRef.current.songs[songName];
//         if (songFile) console.log(`Found song file by name: ${songName}`);
//       }

//       if (!lyricsFile) {
//         lyricsFile = uploadedFilesRef.current.lyrics[lyricsFileName];
//         if (lyricsFile) console.log(`Found lyrics file by name: ${lyricsFileName}`);
//       }

//       if (!songImageFile) {
//         // Try using both field names for the song cover image
//         songImageFile = uploadedFilesRef.current.songImages[songImageFileName];
//         if (songImageFile) {
//           console.log(`Found song cover image file by name: ${songImageFileName}`);
//         } else {
//           // Try to find the song cover image by looking through all stored song images
//           for (const key in uploadedFilesRef.current.songImages) {
//             if (uploadedFilesRef.current.songImages[key]) {
//               console.log(`Checking stored image: ${key} -> ${uploadedFilesRef.current.songImages[key].name}`);
//               if (songIndex !== undefined && key == songIndex) {
//                 songImageFile = uploadedFilesRef.current.songImages[key];
//                 console.log(`Found song cover image file by index key: ${key}`);
//                 break;
//               }
//             }
//           }

//           // If we still don't have the song image file, try to find it by checking all files
//           if (!songImageFile && songIndex !== undefined) {
//             // Get the original song data to find the image filename
//             const originalSongData = songs[songIndex];
//             if (originalSongData && originalSongData.songImageFileName) {
//               // Look for any file that matches the original filename
//               for (const key in uploadedFilesRef.current.songImages) {
//                 const file = uploadedFilesRef.current.songImages[key];
//                 if (file && file.name === originalSongData.songImageFileName) {
//                   songImageFile = file;
//                   console.log(`Found song image file by matching original filename: ${originalSongData.songImageFileName}`);
//                   break;
//                 }
//               }
//             }
//           }
//         }
//       }

//       // Method 3: Search DOM
//       if (!songFile || !lyricsFile || (!songImageFile && songImageFileName)) {
//         const fileInputs = document.querySelectorAll('input[type="file"]');

//         if (!songFile) {
//           for (let input of fileInputs) {
//             if (input.files && input.files[0] && input.files[0].name === songName) {
//               songFile = input.files[0];
//               console.log(`Found song file in DOM: ${songName}`);
//               // Store for future use
//               uploadedFilesRef.current.songs[songIndex] = songFile;
//               uploadedFilesRef.current.songs[songName] = songFile;
//               break;
//             }
//           }
//         }

//         if (!lyricsFile) {
//           for (let input of fileInputs) {
//             if (input.files && input.files[0] && input.files[0].name === lyricsFileName) {
//               lyricsFile = input.files[0];
//               console.log(`Found lyrics file in DOM: ${lyricsFileName}`);
//               // Store for future use
//               uploadedFilesRef.current.lyrics[lyricsIndex] = lyricsFile;
//               uploadedFilesRef.current.lyrics[lyricsFileName] = lyricsFile;
//               break;
//             }
//           }
//         }

//         if (!songImageFile && songImageFileName) {
//           for (let input of fileInputs) {
//             if (input.files && input.files[0] && input.files[0].name === songImageFileName) {
//               songImageFile = input.files[0];
//               console.log(`Found song cover image file in DOM: ${songImageFileName}`);
//               // Store for future use
//               uploadedFilesRef.current.songImages[songImageIndex] = songImageFile;
//               uploadedFilesRef.current.songImages[songImageFileName] = songImageFile;
//               break;
//             }
//           }
//         }
//       }

//       // Only require songFile and lyricsFile
//       if (songFile && lyricsFile) {
//         console.log(`Found required files for song: ${songName}, lyrics: ${lyricsFileName}`);
//         uploadPromises.push(uploadFileWithProgress(songFile, songUrl, "song"));
//         uploadPromises.push(uploadFileWithProgress(lyricsFile, lyricsUrl, "lyrics"));

//         // Upload song cover image only if both file and URL exist
//         if (songImageFile && songImageUrl) {
//           console.log(`Uploading song cover image: ${songImageFile.name} to URL of length: ${songImageUrl.length}`);
//           uploadPromises.push(uploadFileWithProgress(songImageFile, songImageUrl, "songCoverImg"));
//         } else {
//           console.log(`No song cover image file or URL for ${songName}. Treating as optional.`);
//         }
//       } else {
//         failedUploads.push({
//           songName,
//           lyricsFileName,
//           songImageFileName,
//           reason: `Required files not found: ${!songFile ? 'song, ' : ''}${!lyricsFile ? 'lyrics' : ''}`
//         });
//         console.error(`Missing required files for song: ${songName}, lyrics: ${lyricsFileName}`);
//         if (!songFile) console.error(`Missing song file: ${songName}`);
//         if (!lyricsFile) console.error(`Missing lyrics file: ${lyricsFileName}`);
//       }
//     }

//     // Only fail if required files are missing
//     if (failedUploads.length > 0) {
//       console.error('Some required files could not be found:', failedUploads);
//       if (!window.confirm('Some required files (song or lyrics) could not be found. Continue anyway?')) {
//         throw new Error('Upload cancelled due to missing required files');
//       }
//     }

//     // Wait for all uploads to complete
//     await Promise.all(uploadPromises);
//     console.log("All files uploaded successfully");

//     // Prepare the payload for processing songs - match the backend API requirements exactly
//     const payload = {
//       user_id,
//       FullName: defaultName,
//       albumName: capitalizeFirstLetter(albumDetails.albumName),
//       albumCoverImg: albumDetails.albumCoverImg || "",
//       songs: formattedSongs,
//       stage_name: StageName || "",
//       story: albumDetails.story || "",
//       createdTimestamp: currentTimestamp,
//       updatedTimestamp: currentTimestamp
//     };

//     // Log payload for debugging
//     console.log("Submitting payload for processing:", payload);

//     // Submit to AWS API for processing
//     const response = await fetch(
//       "https://g076kfytq4.execute-api.ap-south-1.amazonaws.com/voiznew/processMultipleSongs",
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json",
//         },
//         body: JSON.stringify(payload),
//       }
//     );

//     // Log response status
//     console.log("Response status:", response.status);

//     if (!response.ok) {
//       const errorData = await response.json();
//       console.error("Error response:", errorData);
//       throw new Error(errorData.error || errorData.message || "Failed to submit songs");
//     }

//     const result = await response.json();
//     console.log("Success response:", result);

//     const fallbackEmails = [
//       "ankitad@cloudmotivglobal.com",
//       "mriganka@voiz.co.in"
//     ];

//     try {
//       // Fetch admin emails
//       const adminEmailsResponse = await fetch(
//         "https://knjixc4wse.execute-api.ap-south-1.amazonaws.com/admin_report/get_admin_emails",
//         {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       let adminEmails = fallbackEmails;

//       if (adminEmailsResponse.ok) {
//         const adminEmailsData = await adminEmailsResponse.json();
//         if (adminEmailsData.success && adminEmailsData.admins && adminEmailsData.admins.length > 0) {
//           adminEmails = adminEmailsData.admins.map(admin => admin.email);
//           console.log(`Sending notification to ${adminEmails.length} admins`);
//         } else {
//           console.warn("No admin emails found, using fallback emails");
//         }
//       } else {
//         console.error("Failed to fetch admin emails, using fallback emails");
//       }

//       // Prepare song titles for email
//       const songTitles = formattedSongs.map(song => song.songName);

//       // Send email notification
//       await fetch(
//         "https://eegkqhka27.execute-api.ap-south-1.amazonaws.com/new/AdminSendApprovalEmailForMultipleSongs",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             adminEmails: adminEmails,
//             songTitles: songTitles,
//             singerName: defaultName,
//             albumName: capitalizeFirstLetter(albumDetails.albumName)
//           }),
//         }
//       );

//       console.log("Email notification sent successfully to admins");
//     } catch (emailError) {
//       console.error("Error sending email notification:", emailError);
//       // Continue with success flow even if email fails, as it's not critical
//     }

//     // Set the data needed for navigation and show the confirmation modal.
//     const navData = {
//       name: defaultName,
//       albumName: albumDetails.albumName,
//       albumId: result.albumId || null,
//       songs: formattedSongs,
//       processedSongs: result.processedSongs,
//       failedSongs: result.failedSongs || [],
//       success: true,
//     };
    
//     // First show confirmation modal
//     setShowConfirmation(true);
    
//     // Set navigation data after a short delay to ensure modal is shown first
//     setTimeout(() => {
//       setNavigationData(navData);
//     }, 1000); // 1 second delay to ensure modal is visible
//   } catch (error) {
//     console.error("Submission error:", error);
//     alert(`Error: ${error.message}\n\nPlease check the browser console for more details.`);
//   } finally {
//     setIsLoading(false);
//   }
// };

//   const handleCloseDialog = () => setOpenDialog(false);
//   const handleOpenTermsModal = () => {
//     setIsTermsModalOpen(true);
//   };

//   const handleCloseTermsModal = () => {
//     setIsTermsModalOpen(false);
//   };

//   const handleUploadFromTerms = () => {
//     // Close the terms modal first
//     setIsTermsModalOpen(false);
    
//     // Proceed with upload after a short delay to ensure modal is closed
//     setTimeout(() => {
//       proceedToSubmit();
//     }, 100); // Small delay to ensure modal animation completes
//   };

//   const handleProceed = () => {
//     handleCloseDialog();
//     handleOpenTermsModal();
//   };

//   // Handle tab change
//   const handleTabChange = (event, newValue) => {
//     setActiveTab(newValue);
//   };

//   return (
//     <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#211f20" }}>
//       <SideBar />
//       <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 2 }, maxWidth: "1000px", ml: "20px", mt: "20px" }}>
//         <Typography
//           variant="h5"
//           sx={{
//             color: "white",
//             fontWeight: 600,
//             mb: 2,
//             textAlign: "center",
//             fontSize: { xs: "1.25rem", sm: "1.75rem" },
//           }}
//         >
//           Create Your Album
//         </Typography>

//         {/* Album Details */}
//         <Paper
//           elevation={2}
//           sx={{
//             p: { xs: 1.5, sm: 2 },
//             mb: 2,
//             borderRadius: 2,
//             color: "white",
//             bgcolor: "#211f20",
//           }}
//         >
//           <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, fontSize: "1rem" }}>
//             Album Details
//           </Typography>
//           <Grid container spacing={2}>
//             <Grid item xs={12}>
//               <Grid container spacing={2} alignItems="center" mb={2}>
//                 <Grid item xs={4}>
//                   <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textAlign: "right" }}>
//                     Album Name:
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={8}>
//                 <TextField
//                   fullWidth
//                   name="albumName"
//                   placeholder="Enter album name"
//                   value={albumDetails.albumName}
//                   onChange={handleAlbumChange}
//                   error={Boolean(errors.albumName)}
//                   helperText={errors.albumName}
//                   variant="filled"
//                   size="small"
//                   sx={{
//                     backgroundColor: "#d3d2d2",
//                     borderRadius: "10px !important",
//                     height: "56px !important",
//                     paddingLeft: "10px !important",
//                     "& .MuiFilledInput-root": {
//                       borderRadius: "10px !important",
//                       boxShadow: "0px 0px 0px 1px transparent",
//                       height: "56px",
//                       backgroundColor: "#d3d2d2 !important",
//                       "&:hover": {
//                         backgroundColor: "#d3d2d2 !important",
//                         borderBottom: "none !important",
//                       },
//                       "&.Mui-focused": {
//                         backgroundColor: "#d3d2d2 !important",
//                       },
//                       "&:before, &:after": {
//                         borderBottom: "none !important",
//                       },
//                       "& .MuiFilledInput-input": {
//                         color: "black !important",
//                         fontFamily: "Poppins !important",
//                         letterSpacing: "1px !important",
//                         padding: "0 12px",
//                         height: "56px",
//                       },
//                     },
//                     "& .MuiFormHelperText-root": {
//                       color: "#FF5C5C !important",
//                       position: "absolute",
//                       bottom: "-20px",
//                       left: "0",
//                     },
//                   }}
//                   autoComplete="off"
//                 />
//                 </Grid>
//               </Grid>
//             </Grid>
//             <Grid item xs={12}>
//               <Grid container alignItems="center">
//                 <Grid item xs={2.5}></Grid>
//                 <Grid item xs={8}>
//                   <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
//                       <Button
//                         variant="contained"
//                         component="label"
//                         sx={{ padding: '10px 24px', textTransform: 'none', whiteSpace: 'nowrap' }}
//                       >
//                         Album Cover Image
//                         <input
//                           type="file"
//                           hidden
//                           name="albumCoverImg"
//                           accept="image/jpeg,image/png,image/webp"
//                           onChange={handleFileChange(null, 'albumCoverImg')}
//                         />
//                       </Button>
//                         <Tooltip
//                           placement="top-start"
//                           title={
//                             <div
//                               style={{
//                                 backgroundColor: "black",
//                                 color: "white",
//                                 padding: "10px",
//                                 borderRadius: "24px",
//                                 border: "1px solid #333",
//                                 boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
//                                 maxWidth: "250px",
//                                 textAlign: "left",
//                               }}
//                             >
//                               <Typography
//                                 variant="h6"
//                                 style={{
//                                   fontWeight: "bold",
//                                   marginBottom: "8px",
//                                   fontSize: "16px",
//                                 }}
//                               >
//                                 Information
//                               </Typography>
//                               <Typography style={{ fontSize: "14px" }}>
//                                 Add Album Cover Image Supported File Formats:<strong> .jpeg, .jpg and .png</strong>
//                               </Typography>
//                             </div>
//                           }
//                           componentsProps={{
//                             tooltip: {
//                               sx: {
//                                 background: "transparent",
//                                 boxShadow: "none",
//                               },
//                             },
//                           }}
//                           arrow
//                         >
//                           <InfoOutlinedIcon sx={{ color: 'white', cursor: 'pointer', ml: 1 }} />
//                         </Tooltip>
//                         </Box>
//                         {albumDetails.albumCoverImg && (
//                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
//                             <Typography variant="body2" sx={{ color: "white", textAlign: 'center' }}>
//                               {albumDetails.albumCoverImg}
//                             </Typography>
//                             <Button
//                               size="small"
//                               color="error"
//                               onClick={() => {
//                                 setAlbumDetails(prev => ({ ...prev, albumCoverImg: "" }));
//                                 uploadedFilesRef.current.albumCover = null;
//                               }}
//                             >
//                               Clear
//                             </Button>
//                           </Box>
//                         )}
//                         {errors.albumCoverImg && (
//                           <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
//                             {errors.albumCoverImg}
//                           </Typography>
//                         )}
//                       </Box>
//                 </Grid>
//               </Grid>
//             </Grid>
//           </Grid>
//         </Paper>

//         {/* Song Tabs */}
//         <Tabs
//           value={activeTab}
//           onChange={handleTabChange}
//           variant="scrollable"
//           scrollButtons="auto"
//           sx={{
//             mb: 2,
//             "& .MuiTabs-indicator": { backgroundColor: "#1E88E5" },
//           }}
//         >
//           {songs.map((song, index) => (
//             <Tab
//               key={song.id}
//               label={`Song ${index + 1}`}
//               sx={{ bgcolor: "#211f20", color: "white", borderRadius: "4px", mx: 0.5 }}
//             />
//           ))}
//         </Tabs>

//         {/* Song Entry (Active Tab) */}
//         <Paper
//           elevation={2}
//           sx={{
//             p: { xs: 1.5, sm: 2 },
//             mb: 2,
//             borderRadius: 2,
//             bgcolor: "#211f20",
//             color: "white",
//           }}
//         >
//           <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
//             <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem",  }}>
//               Song {activeTab + 1}
//             </Typography>
//             <IconButton
//               onClick={() => removeSongEntry(activeTab)}
//               disabled={songs.length === 1}
//               size="small"
//               sx={{
//                 color: "#ef5350",
//                 '&:hover': {
//                   backgroundColor: "rgba(239, 83, 80, 0.1)",
//                   color: "#cc181e",

//                 }
//               }}
//             >
//               <DeleteIcon />
//             </IconButton>
//           </Box>
//           <Grid container spacing={2}>
//             <Grid item xs={12}>
//               <Grid container spacing={2} alignItems="center" mb={2}>
//                 <Grid item xs={4}>
//                   <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textAlign: "right" }}>
//                     Song Name:
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={8}>
//                   <TextField
//             sx={{
//               backgroundColor: "#d3d2d2",
//               borderRadius: "10px !important",
//               height: "56px !important",
//               paddingLeft: "10px !important",
//               '& .MuiFilledInput-root': {
//                 borderRadius: "10px !important",
//                 boxShadow: "0px 0px 0px 1px transparent",
//                 height: "56px",
//                 backgroundColor: "#d3d2d2 !important",
//                 '&:hover': {
//                   backgroundColor: '#d3d2d2 !important',
//                 },
//                 '&.Mui-focused': {
//                   backgroundColor: '#d3d2d2 !important',
//                 },
//                 '&::before, &::after': {
//                   borderBottom: 'none !important',
//                 },
//                 '& .MuiFilledInput-input': {
//                   color: "black !important",
//                   fontFamily: "Poppins !important",
//                   letterSpacing: "1px !important",
//                   padding: "0 12px",
//                   height: "56px",
//                 }
//               }
//             }}
//                     fullWidth
//                     name="songName"
//                     placeholder="Enter song name"
//                     value={songs[activeTab].songName}
//                     onChange={handleSongChange(activeTab)}
//                     error={Boolean(errors.songs[activeTab]?.songName)}
//                     helperText={errors.songs[activeTab]?.songName}
//                     variant="filled"
//                     size="small"
//                     autoComplete="off"
//                   />
//                 </Grid>
//               </Grid>
//             </Grid>

//             <Grid item xs={12}>
//               <Grid container spacing={2} alignItems="center" mb={2}>
//                 <Grid item xs={4}>
//                   <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textAlign: "right" }}>
//                     Language:
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={8}>
//                   <FormControl
//                     variant="filled"
//                     error={Boolean(errors.songs[activeTab]?.language)}
//                     size="small"
//                     sx={{
//                       position: "relative",
//                       width: "100%",
//                       backgroundColor: "#d3d2d2 !important",
//                       borderRadius: "10px",
//                       "& .MuiInputBase-root": {
//                         height: "68px",
//                         borderRadius: "10px",
//                         backgroundColor: "#d3d2d2 !important",
//                         boxShadow: "0px 0px 0px 1px transparent",
//                         "&:hover": {
//                           backgroundColor: "#d3d2d2 !important",
//                           borderBottom: "none !important",
//                         },
//                         "&.Mui-focused": {
//                           backgroundColor: "#d3d2d2 !important",
//                         },
//                         "&:before, &:after": {
//                           borderBottom: "none !important",
//                         },
//                         "&:hover:before": {
//                           borderBottom: "none !important",
//                         },
//                         "&:hover:after": {
//                           borderBottom: "none !important",
//                         },
//                       },
//                       "& .MuiSelect-select": {
//                         backgroundColor: "#d3d2d2 !important",
//                         "&:hover": {
//                           backgroundColor: "#d3d2d2 !important",
//                         },
//                         "&.Mui-focused": {
//                           backgroundColor: "#d3d2d2 !important",
//                         },
//                       },
//                       "& .MuiFormHelperText-root": {
//                         color: "#FF5C5C !important",
//                         position: "absolute",
//                         bottom: "-20px",
//                         left: "0",
//                       },
//                     }}
//                   >
//                     <InputLabel
//                       shrink={false}
//                       sx={{
//                         position: "absolute",
//                         left: "12px",
//                         top: isFocused || songs[activeTab].language ? "8px" : "50%",
//                         transform: isFocused || songs[activeTab].language ? "none" : "translateY(-50%)",
//                         fontSize: isFocused || songs[activeTab].language ? "12px" : "16px",
//                         color: isFocused || songs[activeTab].language ? "#2782EE" : "grey",
//                         transition: "all 0.2s ease-in-out",
//                         pointerEvents: "none",
//                         opacity: isFocused || songs[activeTab].language ? 0 : 1,
//                         paddingLeft: "10px",
//                       }}
//                     >
//                       Language
//                     </InputLabel>
//                     <Select
//                       name="language"
//                       value={songs[activeTab].language}
//                       onChange={handleSongChange(activeTab)}
//                       onFocus={() => setIsFocused(true)}
//                       onBlur={() => setIsFocused(false)}
//                       placeholder="Language"
//                       MenuProps={{
//                         PaperProps: {
//                           sx: {
//                             maxHeight: 150,
//                             width: 300,
//                             backgroundColor: "#28282B",
//                             color: "white",
//                           },
//                         },
//                       }}
//                     >
//                       <MenuItem value="Assamese">Assamese</MenuItem>
//                       <MenuItem value="Bengali">Bengali</MenuItem>
//                       <MenuItem value="Bhojpuri">Bhojpuri</MenuItem>
//                       <MenuItem value="English">English</MenuItem>
//                       <MenuItem value="Gujarati">Gujarati</MenuItem>
//                       <MenuItem value="Hindi">Hindi</MenuItem>
//                       <MenuItem value="Kannada">Kannada</MenuItem>
//                       <MenuItem value="Kashmiri">Kashmiri</MenuItem>
//                       <MenuItem value="Konkani">Konkani</MenuItem>
//                       <MenuItem value="Malayalam">Malayalam</MenuItem>
//                       <MenuItem value="Manipuri">Manipuri</MenuItem>
//                       <MenuItem value="Marathi">Marathi</MenuItem>
//                       <MenuItem value="Oriya">Oriya</MenuItem>
//                       <MenuItem value="Pahari">Pahari</MenuItem>
//                       <MenuItem value="Punjabi">Punjabi</MenuItem>
//                       <MenuItem value="Rajasthani">Rajasthani</MenuItem>
//                       <MenuItem value="Sanskrit">Sanskrit</MenuItem>
//                       <MenuItem value="Tamil">Tamil</MenuItem>
//                       <MenuItem value="Telugu">Telugu</MenuItem>
//                       <MenuItem value="Urdu">Urdu</MenuItem>
//                     </Select>
//                     <FormHelperText>{errors.songs[activeTab]?.language}</FormHelperText>
//                   </FormControl>
//                 </Grid>
//               </Grid>
              
//             </Grid>

//             <Grid item xs={12}>
//               <Grid container spacing={2} alignItems="center" mb={2}>
//                 <Grid item xs={4}>
//                   <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textAlign: "right" }}>
//                     Genre:
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={8}>
//                   <FormControl
//                     variant="filled"
//                     error={Boolean(errors.songs[activeTab]?.genre)}
//                     size="small"
//                     fullWidth
//                     sx={{
//                       position: "relative",
//                       backgroundColor: "#d3d2d2 !important",
//                       borderRadius: "10px",
//                       "& .MuiInputBase-root": {
//                         height: "68px",
//                         borderRadius: "10px",
//                         backgroundColor: "#d3d2d2 !important",
//                         boxShadow: "0px 0px 0px 1px transparent",
//                         '&:hover': {
//                           backgroundColor: '#d3d2d2 !important',
//                         },
//                         '&.Mui-focused': {
//                           backgroundColor: '#d3d2d2 !important',
//                         },
//                         '&::before, &::after': {
//                           borderBottom: 'none !important',
//                         },
//                       },
//                       "& .MuiFormHelperText-root": {
//                         color: "#FF5C5C !important",
//                         position: "absolute",
//                         bottom: "-20px",
//                         left: "0",
//                       },
//                     }}
//                   >
//                     <InputLabel
//                       shrink={false}
//                       sx={{
//                         position: "absolute",
//                         left: "12px",
//                         top: isGenreFocused || songs[activeTab].genre ? "8px" : "50%",
//                         transform:
//                           isGenreFocused || songs[activeTab].genre
//                             ? "none"
//                             : "translateY(-50%)",
//                         fontSize: isGenreFocused || songs[activeTab].genre ? "12px" : "16px",
//                         color: isGenreFocused || songs[activeTab].genre ? "#2782EE" : "grey",
//                         transition: "all 0.2s ease-in-out",
//                         pointerEvents: "none",
//                         opacity: isGenreFocused || songs[activeTab].genre ? 0 : 1,
//                         paddingLeft: "10px",
//                       }}
//                     >
//                       Genre
//                     </InputLabel>
//                     <Select
//                       name="genre"
//                       value={songs[activeTab].genre}
//                       onChange={handleSongChange(activeTab)}
//                       onFocus={() => setIsGenreFocused(true)}
//                       onBlur={() => setIsGenreFocused(false)}
//                       placeholder="Genre"
//                       MenuProps={{
//                         PaperProps: {
//                           sx: {
//                             maxHeight: 150,
//                             width: 300,
//                             backgroundColor: "#28282B",
//                             color: "white",
//                           },
//                         },
//                       }}
//                     >
//                       <MenuItem value="Devotional">Devotional</MenuItem>
//                       <MenuItem value="Ghazal">Ghazal</MenuItem>
//                       <MenuItem value="Indie">Indie</MenuItem>
//                       <MenuItem value="Pop">Pop</MenuItem>
//                       <MenuItem value="Rock">Rock</MenuItem>
//                       <MenuItem value="Hip Hop">Hip Hop</MenuItem>
//                       <MenuItem value="R&B">R&B</MenuItem>
//                       <MenuItem value="Jazz">Jazz</MenuItem>
//                       <MenuItem value="Classical">Classical</MenuItem>
//                     </Select>
//                     <FormHelperText>{errors.songs[activeTab]?.genre}</FormHelperText>
//                   </FormControl>
//                 </Grid>
//               </Grid>
              
//              </Grid>
//             </Grid>

//             <Grid item xs={12}>
//               <Grid container spacing={2} alignItems="center" mb={2}>
//                 <Grid item xs={4}>
//                   <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textAlign: "right" }}>
//                     Mood and Pace:
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={8}>
//                   <TextField
//             sx={{
//               backgroundColor: "#d3d2d2",
//               borderRadius: "10px !important",
//               height: "56px !important",
//               paddingLeft: "10px !important",
//               '& .MuiFilledInput-root': {
//                 borderRadius: "10px !important",
//                 boxShadow: "0px 0px 0px 1px transparent",
//                 height: "56px",
//                 backgroundColor: "#d3d2d2 !important",
//                 '&:hover': {
//                   backgroundColor: '#d3d2d2 !important',
//                 },
//                 '&.Mui-focused': {
//                   backgroundColor: '#d3d2d2 !important',
//                 },
//                 '&::before, &::after': {
//                   borderBottom: 'none !important',
//                 },
//                 '& .MuiFilledInput-input': {
//                   color: "black !important",
//                   fontFamily: "Poppins !important",
//                   letterSpacing: "1px !important",
//                   padding: "0 12px",
//                   height: "56px",
//                 }
//               }
//             }}
//                     fullWidth
//                     name="mood"
//                     placeholder="Enter mood and pace"
//                     value={songs[activeTab].mood}
//                     onChange={handleSongChange(activeTab)}
//                     error={Boolean(errors.songs[activeTab]?.mood)}
//                     helperText={errors.songs[activeTab]?.mood}
//                     variant="filled"
//                     size="small"
//                     autoComplete="off"
//                   />
//                 </Grid>
//               </Grid>
//             </Grid>

//             <Grid item xs={12}>
//               <Grid container spacing={2} alignItems="flex-start" mb={4}>
//                 <Grid item xs={4}>
//                   <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textAlign: "right", pt: 1.5 }}>
//                     Story behind song:
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={8}>
//                   <Box sx={{ width: '100%' }}>
//                     <TextField
//                       fullWidth
//                       multiline
//                       minRows={1}
//                       maxRows={4}
//                       variant="filled"
//                       placeholder="Enter story behind song"
//                       name="story"
//                       value={songs[activeTab].story}
//                       onChange={handleStoryChange(activeTab)}
//                       autoComplete="off"
//                       sx={{
//                         borderRadius: '10px',
//                         backgroundColor: '#d3d2d2',
//                         '& .MuiFilledInput-root': {
//                           borderRadius: '10px',
//                           backgroundColor: '#d3d2d2 !important',
//                           padding: '12px 15px',
//                           alignItems: 'flex-start',
//                           '&:hover, &.Mui-focused': {
//                             backgroundColor: '#d3d2d2 !important',
//                           },
//                           '&::before, &::after': {
//                             borderBottom: 'none !important',
//                           },
//                         },
//                         '& .MuiFilledInput-input': {
//                           padding: '0px !important',
//                           color: 'black !important',
//                           overflowY: 'auto !important',
//                           '&::-webkit-scrollbar': { width: '8px' },
//                           '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
//                           '&::-webkit-scrollbar-thumb': {
//                             backgroundColor: '#888',
//                             borderRadius: '4px',
//                             '&:hover': { backgroundColor: '#555' },
//                           },
//                         },
//                       }}
//                       InputProps={{
//                         endAdornment: (
//                           <InputAdornment position="end">
//                             <Tooltip
//                               title={
//                                 <React.Fragment>
//                                   <Typography color="inherit" sx={{ fontWeight: 'bold' }}>Information</Typography>
//                                   What inspired you to make this song
//                                 </React.Fragment>
//                               }
//                               placement="top-start"
//                               leaveDelay={200}
//                               componentsProps={{
//                                 tooltip: {
//                                   sx: {
//                                     backgroundColor: 'black',
//                                     color: 'white',
//                                     borderRadius: '24px',
//                                     padding: '12px',
//                                     fontSize: '14px',
//                                   },
//                                 },
//                               }}
//                             >
//                               <InfoOutlinedIcon sx={{ color: 'black', cursor: 'pointer' }} />
//                             </Tooltip>
//                           </InputAdornment>
//                         ),
//                       }}
//                     />
//                     <Box>
//                       <FormHelperText error={Boolean(errors.songs[activeTab]?.story)} sx={{ color: '#FF5C5C', pl: '14px', mt: 0.5 }}>
//                         {errors.songs[activeTab]?.story}
//                       </FormHelperText>
//                       <Box sx={{ width: '100%', textAlign: 'center', mt: 0.5 }}>
//                         <Typography variant="caption" sx={{ color: 'white' }}>
//                           {`${(songs[activeTab].story || '').split(/\s+/).filter(Boolean).length}/400 words`}
//                         </Typography>
//                       </Box>
//                     </Box>
//                   </Box>
//                 </Grid>
//               </Grid>
//             </Grid>

//             <Grid item xs={12}>
//               <Grid container spacing={2} alignItems="center" mb={2}>
//                 <Grid item xs={4}>
//                   <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textAlign: "right" }}>
//                     Singer Name:
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={8}>
//                   <TextField
//             sx={{
//               backgroundColor: "#d3d2d2",
//               borderRadius: "10px !important",
//               height: "56px !important",
//               paddingLeft: "10px !important",
//               '& .MuiFilledInput-root': {
//                 borderRadius: "10px !important",
//                 boxShadow: "0px 0px 0px 1px transparent",
//                 height: "56px",
//                 backgroundColor: "#d3d2d2 !important",
//                 '&:hover': {
//                   backgroundColor: '#d3d2d2 !important',
//                 },
//                 '&.Mui-focused': {
//                   backgroundColor: '#d3d2d2 !important',
//                 },
//                 '&::before, &::after': {
//                   borderBottom: 'none !important',
//                 },
//                 '& .MuiFilledInput-input': {
//                   color: "black !important",
//                   fontFamily: "Poppins !important",
//                   letterSpacing: "1px !important",
//                   padding: "0 12px",
//                   height: "56px",
//                 }
//               }
//             }}
//                     fullWidth
//                     name="singer"
//                     placeholder="Enter singer name"
//                     value={songs[activeTab].singer}
//                     onChange={handleSongChange(activeTab)}
//                     error={Boolean(errors.songs[activeTab]?.singer)}
//                     helperText={errors.songs[activeTab]?.singer}
//                     variant="filled"
//                     size="small"
//                     autoComplete="off"
//                   />
//                 </Grid>
//               </Grid>
//             </Grid>

//             <Grid item xs={12}>
//               <Grid container spacing={2} alignItems="center" mb={2}>
//                 <Grid item xs={4}>
//                   <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textAlign: "right" }}>
//                     Producer:
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={8}>
//                   <TextField
//             sx={{
//               backgroundColor: "#d3d2d2",
//               borderRadius: "10px !important",
//               height: "56px !important",
//               paddingLeft: "10px !important",
//               '& .MuiFilledInput-root': {
//                 borderRadius: "10px !important",
//                 boxShadow: "0px 0px 0px 1px transparent",
//                 height: "56px",
//                 backgroundColor: "#d3d2d2 !important",
//                 '&:hover': {
//                   backgroundColor: '#d3d2d2 !important',
//                 },
//                 '&.Mui-focused': {
//                   backgroundColor: '#d3d2d2 !important',
//                 },
//                 '&::before, &::after': {
//                   borderBottom: 'none !important',
//                 },
//                 '& .MuiFilledInput-input': {
//                   color: "black !important",
//                   fontFamily: "Poppins !important",
//                   letterSpacing: "1px !important",
//                   padding: "0 12px",
//                   height: "56px",
//                 }
//               }
//             }}
//                     fullWidth
//                     name="producer"
//                     placeholder="Enter producer name"
//                     value={songs[activeTab].producer}
//                     onChange={handleSongChange(activeTab)}
//                     error={Boolean(errors.songs[activeTab]?.producer)}
//                     helperText={errors.songs[activeTab]?.producer}
//                     variant="filled"
//                     size="small"
//                     autoComplete="off"
//                   />
//                 </Grid>
//               </Grid>
//             </Grid>

//             <Grid item xs={12}>
//               <Grid container spacing={2} alignItems="center" mb={2}>
//                 <Grid item xs={4}>
//                   <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textAlign: "right" }}>
//                     Composer:
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={8}>
//                   <TextField
//             sx={{
//               backgroundColor: "#d3d2d2",
//               borderRadius: "10px !important",
//               height: "56px !important",
//               paddingLeft: "10px !important",
//               '& .MuiFilledInput-root': {
//                 borderRadius: "10px !important",
//                 boxShadow: "0px 0px 0px 1px transparent",
//                 height: "56px",
//                 backgroundColor: "#d3d2d2 !important",
//                 '&:hover': {
//                   backgroundColor: '#d3d2d2 !important',
//                 },
//                 '&.Mui-focused': {
//                   backgroundColor: '#d3d2d2 !important',
//                 },
//                 '&::before, &::after': {
//                   borderBottom: 'none !important',
//                 },
//                 '& .MuiFilledInput-input': {
//                   color: "black !important",
//                   fontFamily: "Poppins !important",
//                   letterSpacing: "1px !important",
//                   padding: "0 12px",
//                   height: "56px",
//                 }
//               }
//             }}
//                     fullWidth
//                     name="composer"
//                     placeholder="Enter composer name"
//                     value={songs[activeTab].composer}
//                     onChange={handleSongChange(activeTab)}
//                     error={Boolean(errors.songs[activeTab]?.composer)}
//                     helperText={errors.songs[activeTab]?.composer}
//                     variant="filled"
//                     size="small"
//                     autoComplete="off"
//                   />
//                 </Grid>
//               </Grid>
//             </Grid>

//             <Grid item xs={12}>
//               <Grid container spacing={2} alignItems="center" mb={2}>
//                 <Grid item xs={4}>
//                   <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textAlign: "right" }}>
//                     Lyricist:
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={8}>
//                   <TextField
//             sx={{
//               backgroundColor: "#d3d2d2",
//               borderRadius: "10px !important",
//               height: "56px !important",
//               paddingLeft: "10px !important",
//               '& .MuiFilledInput-root': {
//                 borderRadius: "10px !important",
//                 boxShadow: "0px 0px 0px 1px transparent",
//                 height: "56px",
//                 backgroundColor: "#d3d2d2 !important",
//                 '&:hover': {
//                   backgroundColor: '#d3d2d2 !important',
//                 },
//                 '&.Mui-focused': {
//                   backgroundColor: '#d3d2d2 !important',
//                 },
//                 '&::before, &::after': {
//                   borderBottom: 'none !important',
//                 },
//                 '& .MuiFilledInput-input': {
//                   color: "black !important",
//                   fontFamily: "Poppins !important",
//                   letterSpacing: "1px !important",
//                   padding: "0 12px",
//                   height: "56px",
//                 }
//               }
//             }}
//                     fullWidth
//                     name="lyricist"
//                     placeholder="Enter lyricist name"
//                     value={songs[activeTab].lyricist}
//                     onChange={handleSongChange(activeTab)}
//                     error={Boolean(errors.songs[activeTab]?.lyricist)}
//                     helperText={errors.songs[activeTab]?.lyricist}
//                     variant="filled"
//                     size="small"
//                   />
//                 </Grid>
//               </Grid>
//             </Grid>
            
//             <Grid item xs={12}>
//               <Grid container>
//                 <Grid item xs={2.5} />
//                 <Grid item xs={8}>
//                   <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 2 }}>
//                     {/* Upload Lyrics Button */}
//                     <Box>
//                       <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
//                         <Button
//                           variant="contained"
//                           component="label"
//                           sx={{
//                             padding: '10px 24px',
//                             textTransform: 'none',
//                             whiteSpace: 'nowrap'
//                           }}
//                         >
//                           Upload Lyrics
//                           <input
//                             type="file"
//                             hidden
//                             name="lyricsFileName"
//                             onChange={handleFileChange(activeTab, "lyricsFileName")}
//                           />
//                         </Button>
//                         <Tooltip
//                           placement="top-start"
//                           title={
//                             <div
//                               style={{
//                                 backgroundColor: "black",
//                                 color: "white",
//                                 padding: "10px",
//                                 borderRadius: "24px",
//                                 border: "1px solid #333",
//                                 boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
//                                 maxWidth: "250px",
//                                 textAlign: "left",
//                               }}
//                             >
//                               <Typography
//                                 variant="h6"
//                                 style={{
//                                   fontWeight: "bold",
//                                   marginBottom: "8px",
//                                   fontSize: "16px",
//                                 }}
//                               >
//                                 Information
//                               </Typography>
//                               <Typography style={{ fontSize: "14px" }}>
//                                 Supported File Formats:<strong> .txt, .pdf</strong>
//                               </Typography>
//                             </div>
//                           }
//                           componentsProps={{
//                             tooltip: {
//                               sx: {
//                                 background: "transparent",
//                                 boxShadow: "none",
//                               },
//                             },
//                           }}
//                           arrow
//                         >
//                           <InfoOutlinedIcon sx={{ color: 'white', cursor: 'pointer' }} />
//                         </Tooltip>
//                       </Box>
//                       {songs[activeTab].lyricsFileName && (
//                         <Typography variant="body2" sx={{ color: "white", mt: 1, textAlign: 'center' }}>
//                           {songs[activeTab].lyricsFileName}
//                         </Typography>
//                       )}
//                       {errors.songs[activeTab]?.lyricsFileName && (
//                         <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
//                           {errors.songs[activeTab]?.lyricsFileName}
//                         </Typography>
//                       )}
//                     </Box>

//                     {/* Upload Song Button */}
//                     <Box>
//                       <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
//                         <Button
//                           variant="contained"
//                           component="label"
//                           sx={{
//                             padding: '10px 24px',
//                             textTransform: 'none',
//                             whiteSpace: 'nowrap'
//                           }}
//                         >
//                           Upload Song
//                           <input
//                             type="file"
//                             hidden
//                             name="fileName"
//                             onChange={handleFileChange(activeTab, "fileName")}
//                           />
//                         </Button>
//                         <Tooltip
//                           placement="top-start"
//                           title={
//                             <div
//                               style={{
//                                 backgroundColor: "black",
//                                 color: "white",
//                                 padding: "10px",
//                                 borderRadius: "24px",
//                                 border: "1px solid #333",
//                                 boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
//                                 maxWidth: "250px",
//                                 textAlign: "left",
//                               }}
//                             >
//                               <Typography
//                                 variant="h6"
//                                 style={{
//                                   fontWeight: "bold",
//                                   marginBottom: "8px",
//                                   fontSize: "16px",
//                                 }}
//                               >
//                                 Information
//                               </Typography>
//                               <Typography style={{ fontSize: "14px" }}>
//                                 Supported File Formats:<strong> .mp3, .wav</strong>
//                               </Typography>
//                             </div>
//                           }
//                           componentsProps={{
//                             tooltip: {
//                               sx: {
//                                 background: "transparent",
//                                 boxShadow: "none",
//                               },
//                             },
//                           }}
//                           arrow
//                         >
//                           <InfoOutlinedIcon sx={{ color: 'white', cursor: 'pointer' }} />
//                         </Tooltip>
//                       </Box>
//                       {songs[activeTab].fileName && (
//                         <Typography variant="body2" sx={{ color: "white", mt: 1, textAlign: 'center' }}>
//                           {songs[activeTab].fileName}
//                         </Typography>
//                       )}
//                       {errors.songs[activeTab]?.fileName && (
//                         <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
//                           {errors.songs[activeTab]?.fileName}
//                         </Typography>
//                       )}
//                     </Box>
//                   </Box>
//                 </Grid>
//               </Grid>
//             </Grid>

//             <Grid item xs={12}>
//               <Grid container alignItems="center">
//                 <Grid item xs={2.5}></Grid>
//                 <Grid item xs={8}>
//                   <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
//                     <Box>
//                       <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
//                         <Button
//                           variant="contained"
//                           component="label"
//                           sx={{ padding: '10px 24px', textTransform: 'none', whiteSpace: 'nowrap' }}
//                         >
//                           Song Cover Image
//                           <input
//                             type="file"
//                             hidden
//                             name="songImageFileName"
//                             onChange={handleFileChange(activeTab, "songImageFileName")}
//                           />
//                         </Button>
//                         <Tooltip
//                           placement="top-start"
//                           title={
//                             <div
//                               style={{
//                                 backgroundColor: "black",
//                                 color: "white",
//                                 padding: "10px",
//                                 borderRadius: "24px",
//                                 border: "1px solid #333",
//                                 boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
//                                 maxWidth: "250px",
//                                 textAlign: "left",
//                               }}
//                             >
//                               <Typography
//                                 variant="h6"
//                                 style={{
//                                   fontWeight: "bold",
//                                   marginBottom: "8px",
//                                   fontSize: "16px",
//                                 }}
//                               >
//                                 Information
//                               </Typography>
//                               <Typography style={{ fontSize: "14px" }}>
//                                 Add Song Cover Image Supported File Formats:<strong> .jpeg, .jpg and .png</strong>
//                               </Typography>
//                             </div>
//                           }
//                           componentsProps={{
//                             tooltip: {
//                               sx: {
//                                 background: "transparent",
//                                 boxShadow: "none",
//                               },
//                             },
//                           }}
//                           arrow
//                         >
//                           <InfoOutlinedIcon sx={{ color: 'white', cursor: 'pointer' }} />
//                         </Tooltip>
//                         </Box>
//                         {songs[activeTab].songImageFileName && (
//                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
//                             <Typography variant="body2" sx={{ color: "white", textAlign: 'center' }}>
//                               {songs[activeTab].songImageFileName}
//                             </Typography>
//                             <Button
//                               size="small"
//                               color="error"
//                               onClick={() => {
//                                 const updatedSongs = [...songs];
//                                 updatedSongs[activeTab] = { ...updatedSongs[activeTab], songImageFileName: "" };
//                                 setSongs(updatedSongs);
//                                 uploadedFilesRef.current.songImages[activeTab] = null;
//                                 uploadedFilesRef.current.songImages[songs[activeTab].songImageFileName] = null;
//                               }}
//                             >
//                               Clear
//                             </Button>
//                           </Box>
//                         )}
//                         {errors.songs[activeTab]?.songImageFileName && (
//                           <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
//                             {errors.songs[activeTab]?.songImageFileName}
//                           </Typography>
//                         )}
//                       </Box>
//                     </Box>
//                 </Grid>
//               </Grid>
//             </Grid>
//             <Grid item xs={12}>
//             </Grid>
//         </Paper>

//         {/* Show buttons only on the last song tab */}
//         {activeTab === songs.length - 1 && (
//           <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2, mb: 2 }}>
//             <Button
//               startIcon={<AddIcon />}
//               variant="contained"
//               onClick={addSongEntry}
//               sx={{
//                 bgcolor: "#1E88e5",
//                 color: "white",
//                 textTransform: "none",
//                 borderRadius: "20px",
//                 px: 2,
//                 py: 0.5,
//                 fontSize: "0.875rem",
//                 "&:hover": { bgcolor: "#1976d2" },
//               }}
//             >
//               Add Song
//             </Button>
//             <LoadingButton
//               onClick={handleSubmit}
//               loading={isLoading && !isTermsModalOpen && !showConfirmation}
//               variant="contained"
//               sx={{
//                 width: '100%',
//                 bgcolor: '#1E88E5',
//                 '&:hover': { bgcolor: '#1976D2' },
//                 py: 1.5,
//                 fontSize: '1rem',
//                 fontWeight: 'bold',
//               }}
//             >
//               {isLoading ? "Submitting..." : "Submit"}
//             </LoadingButton>
//           </Box>
//         )}

//         <Dialog open={openDialog} onClose={handleCloseDialog}>
//           <DialogTitle sx={{ bgcolor: "#1E88E5", color: "white", fontWeight: 600, fontSize: "1rem" }}>
//             Warning
//           </DialogTitle>
//           <DialogContent sx={{ pt: 2 }}>
//             <Typography sx={{ fontSize: "0.9rem" }}>
//               Some of your songs might already exist in your approved songs list. Are you sure you want to proceed?
//             </Typography>
//           </DialogContent>
//             <DialogActions>
//               <Button onClick={handleCloseDialog} sx={{ color: "#ef5350", fontSize: "0.875rem" }}>
//                 Cancel
//               </Button>
//               <Button onClick={handleProceed} sx={{ color: "#1E88E5", fontSize: "0.875rem" }}>
//                 Proceed
//               </Button>
//             </DialogActions>
//           </Dialog>

//           {showConfirmation && (
//             <ConfirmationModal
//               message={`Your album has been created with '${songs.length}' songs and has been<br />uploaded for approval!`}
//               onClose={() => setShowConfirmation(false)}
//             />
//           )}

//           <UploadTermsModal
//             open={isTermsModalOpen}
//             onClose={handleCloseTermsModal}
//             onUpload={handleUploadFromTerms}
//             songCount={songs.length}
//             isUploading={isLoading}
//           />
//         </Box>
//       </Box>
    
//   );
// }

import React, { useState, useEffect } from "react";
import ConfirmationModal from './ConfirmationModal';
import UploadTermsModal from './UploadTermsModal';
import './ConfirmationModal.css';
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Tabs,
  Tab,
  FormHelperText,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import { LoadingButton } from '@mui/lab';
import DeleteIcon from "@mui/icons-material/Delete"; // Import Delete icon
import AddIcon from "@mui/icons-material/Add";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SideBar from "./SideBar";
import "./AddMultipleSong.css";

export default function AddMultipleSong() {
  const StageName = localStorage.getItem("StageName");
  const FullName = localStorage.getItem("FullName");
  const defaultName = StageName || FullName || "";
  const user_id = localStorage.getItem("user_id");
  const navigate = useNavigate();

  // State for album details
  const [albumDetails, setAlbumDetails] = useState({
    albumName: "",
    albumCoverImg: "",
    albumCoverFileName: "",
  });

  // State for multiple song entries
  const [songs, setSongs] = useState([
    {
      songName: "",
      language: "",
      genre: "",
      lyricsFileName: "",
      fileName: "",
      singer: "",
      producer: "",
      composer: "",
      lyricist: "",
      songCoverImg: "",
      songImageFileName: "", // Add field for song cover image filename
      mood: "",
      story: "",
      span: "", // Add span field
      id: Date.now(),
      isValidated: false, // Track if song details are validated
    },
  ]);

  // State for active tab
  const [activeTab, setActiveTab] = useState(0);

  // State for validation errors
  const [errors, setErrors] = useState({
    albumName: "",
    albumCoverImg: "",
    songs: [
      {
        songName: "",
        language: "",
        genre: "",
        lyricsFileName: "",
        fileName: "",
        singer: "",
        producer: "",
        composer: "",
        lyricist: "",
        songCoverImg: "",
        mood: "",
        story: "",
      },
    ],
  });

  // State for dialog and loading
  const [openDialog, setOpenDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State for focus tracking
  const [isFocused, setIsFocused] = useState(false); // Track language focus
  const [isGenreFocused, setIsGenreFocused] = useState(false); // Track genre focus

  // Handle album details change
  const handleAlbumChange = (e) => {
    const { name, value } = e.target;
    setAlbumDetails({ ...albumDetails, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  // Handle song input change
  const handleSongChange = (index) => (e) => {
    const { name, value } = e.target;
    const updatedSongs = [...songs];
    const updatedErrors = [...errors.songs];
    updatedSongs[index] = { ...updatedSongs[index], [name]: value, isValidated: false };
    updatedErrors[index] = { ...updatedErrors[index], [name]: "" };
    setSongs(updatedSongs);
    setErrors({ ...errors, songs: updatedErrors });
  };

  const handleStoryChange = (index) => (e) => {
    const { value } = e.target;
    const words = value.split(/\s+/).filter(Boolean);

    if (words.length <= 400) {
      const updatedSongs = [...songs];
      updatedSongs[index] = { ...updatedSongs[index], story: value };
      setSongs(updatedSongs);
    }
  };

  // Handle file input change
  // const handleFileChange = (index, field) => (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     // Define valid formats based on field type
  //     const validFormats = {
  //       lyricsFileName: ['text/plain', 'application/pdf'], // TXT and PDF for lyrics
  //       fileName: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'], // Audio formats for song file
  //       songCoverImg: ['image/jpeg', 'image/png', 'image/webp'], // JPG, PNG, WEBP for song cover
  //       albumCoverImg: ['image/jpeg', 'image/png', 'image/webp'] // JPG, PNG, WEBP for album cover
  //     };
      
  //     // Get the valid formats for this field
  //     const validTypes = validFormats[field] || validFormats.fileName;
      
  //     // Check if file is valid format
  //     if (!validTypes.includes(file.type)) {
  //       const fileType = field === 'lyricsFileName' ? 'lyrics' : 'audio';
  //       const allowedFormats = validTypes.map(type => {
  //         if (type === 'text/plain') return 'TXT';
  //         if (type === 'application/pdf') return 'PDF';
  //         return type.split('/')[1].toUpperCase();
  //       }).join(', ');
        
  //       const updatedErrors = [...errors.songs];
  //       updatedErrors[index] = { 
  //         ...updatedErrors[index], 
  //         [field]: `Please upload a valid ${fileType} file (${allowedFormats})`
  //       };
  //       setErrors({ ...errors, songs: updatedErrors });
  //       e.target.value = ''; // Clear the input
  //       return;
  //     }

  //     // Check file size (optional, you can adjust the limit)
  //     if (file.size > 50 * 1024 * 1024) { // 50MB limit
  //       const updatedErrors = [...errors.songs];
  //       updatedErrors[index] = { 
  //         ...updatedErrors[index], 
  //         [field]: "File size too large. Maximum allowed size is 50MB"
  //       };
  //       setErrors({ ...errors, songs: updatedErrors });
  //       e.target.value = '';
  //       return;
  //     }

  //     const updatedSongs = [...songs];
  //     const updatedErrors = [...errors.songs];
  //     updatedSongs[index] = { ...updatedSongs[index], [field]: file.name, isValidated: false };
  //     updatedErrors[index] = { ...updatedErrors[index], [field]: "" };
  //     setSongs(updatedSongs);
  //     setErrors({ ...errors, songs: updatedErrors });
  //   }
  // };

  const handleFileChange = (index, field) => (e) => {
    const file = e.target.files[0];
    const updatedSongs = [...songs];
    const updatedErrors = [...errors.songs];
    
    // Clear error for this field
    updatedErrors[index] = { ...updatedErrors[index], [field]: "" };
    setErrors({ ...errors, songs: updatedErrors });
    
    // If file is cleared (removed), update state with empty string
    if (!file && (field === 'songImageFileName' || field === 'albumCoverImg')) {
      updatedSongs[index] = { ...updatedSongs[index], [field]: "" };
      setSongs(updatedSongs);
      return;
    }
    
    if (file) {
      // Define valid formats based on field type
      const validFormats = {
        lyricsFileName: ['text/plain', 'application/pdf'],
        fileName: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'],
        songCoverImg: ['image/jpeg', 'image/png', 'image/webp'],
        songImageFileName: ['image/jpeg', 'image/png', 'image/webp'],
        albumCoverImg: ['image/jpeg', 'image/png', 'image/webp']
      };
      
      const validTypes = validFormats[field] || validFormats.fileName;
      
      if (!validTypes.includes(file.type)) {
        // Determine the file type based on the field
        let fileType;
        if (field === 'lyricsFileName') {
          fileType = 'lyrics';
        } else if (field === 'songImageFileName' || field === 'albumCoverImg') {
          fileType = 'image';
        } else {
          fileType = 'audio';
        }
        
        const allowedFormats = validTypes.map(type => {
          if (type === 'text/plain') return 'TXT';
          if (type === 'application/pdf') return 'PDF';
          return type.split('/')[1].toUpperCase();
        }).join(', ');
        
        const updatedErrors = [...errors.songs];
        updatedErrors[index] = { 
          ...updatedErrors[index], 
          [field]: `Please upload a valid ${fileType} file (${allowedFormats})`
        };
        setErrors({ ...errors, songs: updatedErrors });
        e.target.value = '';
        return;
      }
  
      if (file.size > 50 * 1024 * 1024) {
        const updatedErrors = [...errors.songs];
        updatedErrors[index] = { 
          ...updatedErrors[index], 
          [field]: "File size too large. Maximum allowed size is 50MB"
        };
        setErrors({ ...errors, songs: updatedErrors });
        e.target.value = '';
        return;
      }
      
      // Create a copy of the songs array
      const updatedSongs = [...songs];
      const updatedErrors = [...errors.songs];
      
      // Update the file name in the songs array
      updatedSongs[index] = { ...updatedSongs[index], [field]: file.name };
      updatedErrors[index] = { ...updatedErrors[index], [field]: "" };
      
      // Store the file reference for later retrieval
      if (field === 'fileName') {
        storeFileReference(file, index, 'song');
        
        // Calculate duration for song file
        const audio = new Audio(URL.createObjectURL(file));
        audio.addEventListener("loadedmetadata", () => {
          const durationInSeconds = audio.duration;
          const minutes = Math.floor(durationInSeconds / 60);
          const seconds = Math.floor(durationInSeconds % 60);
          const formattedDuration = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
          
          const songsWithDuration = [...updatedSongs];
          songsWithDuration[index] = { ...songsWithDuration[index], span: formattedDuration };
          setSongs(songsWithDuration);
        });
      } else if (field === 'lyricsFileName') {
        storeFileReference(file, index, 'lyrics');
      } else if (field === 'songImageFileName') {
        storeFileReference(file, index, 'songImage');
      } else if (field === "albumCoverImg") {
        setAlbumDetails(prev => ({ ...prev, albumCoverImg: file.name }));
        storeFileReference(file, null, 'albumCover');
      }
      
      // Update the songs state
      setSongs(updatedSongs);
      setErrors({ ...errors, songs: updatedErrors });
    }
  };

  // Validate a single song
  const validateSingleSong = (song, index) => {
    const songErrors = {
      songName: song.songName ? "" : "Song name is required",
      language: song.language ? "" : "Language is required",
      genre: song.genre ? "" : "Genre is required",
      lyricsFileName: song.lyricsFileName ? "" : "Lyrics file is required",
      fileName: song.fileName ? "" : "Song file is required",
      songImageFileName: song.songImageFileName ? "" : "", // Optional field - no error if not provided
      singer: song.singer ? "" : "Singer name is required",
      mood: "",
      story: "",
      span: song.span ? "" : "Song duration is required",
      producer: song.producer ? "" : "Producer is required",
      composer: song.composer ? "" : "Composer is required",
      lyricist: song.lyricist ? "" : "Lyricist is required",
      songCoverImg: song.songCoverImg ? "" : "", // Optional field - no error if not provided
    };
    const updatedErrors = [...errors.songs];
    updatedErrors[index] = songErrors;
    setErrors({ ...errors, songs: updatedErrors });
    return !Object.values(songErrors).some(Boolean);
  };

  // Add new song entry
  const addSongEntry = () => {
    const currentSong = songs[activeTab];
    if (!validateSingleSong(currentSong, activeTab)) {
      alert("Please fill all required fields for the current song before adding a new one.");
      return;
    }

    // Mark current song as validated
    const updatedSongs = [...songs];
    updatedSongs[activeTab] = { ...updatedSongs[activeTab], isValidated: true };

    // Create new song
    const newSong = {
      songName: "",
      language: "",
      genre: "",
      lyricsFileName: "",
      fileName: "",
      singer: "",
      producer: "",
      composer: "",
      lyricist: "",
      songCoverImg: "",
      mood: "",
      story: "",
      span: "", // Add span field
      id: Date.now(),
      isValidated: false,
    };

    // Append new song and update errors
    updatedSongs.push(newSong);
    const updatedErrors = [
      ...errors.songs,
      {
        songName: "",
        language: "",
        genre: "",
        lyricsFileName: "",
        fileName: "",
        singer: "",
        producer: "",
        composer: "",
        lyricist: "",
        songCoverImg: "",
        mood: "",
        story: "",
      },
    ];

    setSongs(updatedSongs);
    setErrors({ ...errors, songs: updatedErrors });
    setActiveTab(updatedSongs.length - 1); // Switch to new song tab
  };

  // Remove song entry
  const removeSongEntry = (index) => {
    if (songs.length > 1) {
      const updatedSongs = songs.filter((_, i) => i !== index);
      const updatedErrors = errors.songs.filter((_, i) => i !== index);
      setSongs(updatedSongs);
      setErrors({ ...errors, songs: updatedErrors });
      // Adjust active tab if the removed song was active or after it
      if (index <= activeTab) {
        setActiveTab(Math.max(0, activeTab - 1));
      }
    }
  };

  // Capitalize first letter of each word
  const capitalizeFirstLetter = (text) => {
    if (!text) return "";
    return text
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Check for duplicate songs
  const checkDuplicateSongs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/approverList/decision?user_id=${user_id}&decision=Approved`
      );
      if (!response.ok) throw new Error("Failed to fetch songs");
      const approvedSongs = await response.json();
      return songs.map((song) =>
        Array.isArray(approvedSongs)
          ? approvedSongs.find(
              (approvedSong) =>
                approvedSong.songName.toLowerCase() === song.songName.toLowerCase()
            )
          : null
      );
    } catch (error) {
      console.error("Error checking duplicates:", error);
      return Array(songs.length).fill(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Validate entire form
  const validateForm = () => {
    let hasErrors = false;
    const newErrors = {
      albumName: albumDetails.albumName ? "" : "Album name is required",
      albumCoverImg: "", // Optional field - no error if not provided
      songs: songs.map((song) => ({
        songName: song.songName ? "" : "Song name is required",
        language: song.language ? "" : "Language is required",
        genre: song.genre ? "" : "Genre is required",
        lyricsFileName: song.lyricsFileName ? "" : "Lyrics file is required",
        fileName: song.fileName ? "" : "Song file is required",
        singer: song.singer ? "" : "Singer is required",
        mood: "",
        story: "",
        producer: song.producer ? "" : "Producer is required",
        composer: song.composer ? "" : "Composer is required",
        lyricist: song.lyricist ? "" : "Lyricist is required",
        songCoverImg: "", // Optional field
      })),
    };
    setErrors(newErrors);
    hasErrors = Object.values(newErrors).some((error) =>
      typeof error === "string" ? error : error.some((songError) => Object.values(songError).some(Boolean))
    );
    return !hasErrors;
  };

  // Handle form submission
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [navigationData, setNavigationData] = useState(null);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  useEffect(() => {
    // This effect triggers navigation only after the confirmation modal has been shown and then closed.
    if (navigationData && !showConfirmation) {
      // Clear navigation data to prevent multiple navigation attempts
      setNavigationData(null);
      navigate("/addsong", { state: { data: navigationData } });
    }
  }, [showConfirmation, navigationData, navigate]);



  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Mark current song as validated
    const updatedSongs = [...songs];
    updatedSongs[activeTab] = { ...updatedSongs[activeTab], isValidated: true };
    setSongs(updatedSongs);

    const duplicates = await checkDuplicateSongs();
    const hasDuplicates = duplicates.some((song) => song !== null);
    if (hasDuplicates) {
      setOpenDialog(true);
    } else {
      handleOpenTermsModal();
    }
  };



  // Upload file with progress tracking
  const uploadFileWithProgress = async (file, presignedUrl, type) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Log the file details before upload
      console.log(`Starting upload for ${type}:`, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        urlLength: presignedUrl.length
      });

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          console.log(`${type} upload progress for ${file.name}: ${progress.toFixed(2)}%`);
          // You can add state to track progress if needed
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log(`${type} upload complete for ${file.name}`);
          resolve();
        } else {
          console.error(`Upload failed for ${file.name} with status ${xhr.status}:`, xhr.responseText);
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
        }
      });

      xhr.addEventListener("error", (e) => {
        console.error(`Error uploading ${file.name}:`, e);
        reject(new Error(`Upload failed for ${type} ${file.name}: ${e.message || 'Unknown error'}`));
      });
      
      xhr.addEventListener("timeout", () => {
        console.error(`Upload timeout for ${file.name}`);
        reject(new Error(`Upload timed out for ${type} ${file.name}`));
      });
      
      xhr.addEventListener("abort", () => {
        console.error(`Upload aborted for ${file.name}`);
        reject(new Error(`Upload aborted for ${type} ${file.name}`));
      });

      try {
        xhr.open("PUT", presignedUrl);
        
        // Set the appropriate Content-Type header based on file type
        let contentType;
        if (type === "song") {
          contentType = "audio/mpeg";
        } else if (type === "lyrics") {
          contentType = "text/plain";
        } else if (type === "songCoverImg" || type === "albumCover") {
          // For image files, use the file's actual content type
          contentType = file.type || "image/jpeg";
        } else {
          // Default fallback
          contentType = "application/octet-stream";
        }
        
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.send(file);
      } catch (error) {
        console.error(`Exception during upload setup for ${file.name}:`, error);
        reject(error);
      }
    });
  };

  // State  // Store uploaded files in memory for later retrieval using useRef to persist between renders
  const uploadedFilesRef = useRef({
    songs: {},
    lyrics: {},
    songImages: {},
    albumCover: null,
    songCount: 0,
    lyricsCount: 0,
    songImagesCount: 0
  });

  // Function to store file references when files are selected
  const storeFileReference = (file, index, type) => {
    if (!file) return;
    
    if (type === 'song') {
      uploadedFilesRef.current.songs[index] = file;
      uploadedFilesRef.current.songs[file.name] = file;
      uploadedFilesRef.current.songCount++;
      console.log(`Stored song file reference for index ${index}, name: ${file.name}`);
    } else if (type === 'lyrics') {
      uploadedFilesRef.current.lyrics[index] = file;
      uploadedFilesRef.current.lyrics[file.name] = file;
      uploadedFilesRef.current.lyricsCount++;
      console.log(`Stored lyrics file reference for index ${index}, name: ${file.name}`);
    } else if (type === 'songImage') {
      uploadedFilesRef.current.songImages[index] = file;
      uploadedFilesRef.current.songImages[file.name] = file;
      // Also store with songCoverImg field name for consistency with API
      if (index !== null) {
        const songData = songs[index];
        if (songData && songData.songImageFileName) {
          // Store using both field names for redundancy
          uploadedFilesRef.current.songImages[songData.songImageFileName] = file;
        }
      }
      uploadedFilesRef.current.songImagesCount++;
      console.log(`Stored song image reference for index ${index}, name: ${file.name}`);
    } else if (type === 'albumCover') {
      uploadedFilesRef.current.albumCover = file;
      console.log(`Stored album cover reference, name: ${file.name}`);
    }
  };



  // Create timestamp in the format YYYYMMDD_HHMMSS
  const createTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  };

  // Proceed to submit data to API
const proceedToSubmit = async () => {
  setIsLoading(true);
  try {
    // Generate timestamps for all songs
    const currentTimestamp = createTimestamp();

    // Format each song with all required fields
    const formattedSongs = await Promise.all(songs.map(async (song) => {
      const processedSong = {
        songName: capitalizeFirstLetter(song.songName),
        singer: capitalizeFirstLetter(song.singer || ""),
        producer: capitalizeFirstLetter(song.producer || ""),
        composer: capitalizeFirstLetter(song.composer || ""),
        lyricist: capitalizeFirstLetter(song.lyricist || ""),
        language: song.language || "",
        genre: song.genre || "",
        mood: song.mood || "",
        story: song.story || "",
        fileName: song.fileName,
        lyricsFileName: song.lyricsFileName,
        songImageFileName: song.songImageFileName || "", // Ensure optional
        span: song.span || "",
      };
      return processedSong;
    }));

    // Prepare songs for presigned URL request
    const songsForPresignedUrls = formattedSongs.map(song => ({
      songName: song.fileName,
      lyricsFileName: song.lyricsFileName,
      songImageFileName: song.songImageFileName // Consistent naming for presigned URLs
    }));

    // Log the formatted songs and presigned URL request for debugging
    console.log('Formatted songs:', formattedSongs);
    console.log('Songs for presigned URLs:', songsForPresignedUrls);

    // Prepare the payload for presigned URLs
    const presignedUrlPayload = {
      user_id,
      albumName: capitalizeFirstLetter(albumDetails.albumName),
      albumCoverFileName: albumDetails.albumCoverImg || "",
      songs: songsForPresignedUrls
    };

    console.log("Requesting presigned URLs for:", presignedUrlPayload);

    // Get presigned URLs for all songs
    const presignedUrlsResponse = await fetch(
      "https://y6mkdwd71i.execute-api.ap-south-1.amazonaws.com/voiznew/generate-presigned-urls-bulk-parallel",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(presignedUrlPayload),
      }
    );

    if (!presignedUrlsResponse.ok) {
      const errorData = await presignedUrlsResponse.json();
      throw new Error(errorData.error || "Failed to get presigned URLs");
    }

    const presignedUrlsData = await presignedUrlsResponse.json();
    console.log("Received presigned URLs:", presignedUrlsData);

    // Dump the current state of uploadedFiles to console for debugging
    console.log('Current uploadedFiles state:', uploadedFilesRef.current);

    // Log actual file objects for verification
    console.log('First song file:', uploadedFilesRef.current.songs[0] || 'Not found');
    console.log('First lyrics file:', uploadedFilesRef.current.lyrics[0] || 'Not found');
    console.log('First song image file:', uploadedFilesRef.current.songImages[0] || 'Not found');
    console.log('Album cover file:', uploadedFilesRef.current.albumCover || 'Not found');

    // Debug: print all song image files
    console.log('All song image files:');
    for (const key in uploadedFilesRef.current.songImages) {
      if (uploadedFilesRef.current.songImages[key]) {
        console.log(`- ${key}: ${uploadedFilesRef.current.songImages[key].name}`);
      }
    }

    // Upload all files in parallel
    const uploadPromises = [];
    const failedUploads = [];

    // Map to track which song index corresponds to which file name
    const songNameToIndexMap = {};
    const lyricsNameToIndexMap = {};
    const songCoverImgToIndexMap = {};

    // Build the mapping from file names to song indices
    songs.forEach((song, index) => {
      if (song.fileName) {
        songNameToIndexMap[song.fileName] = index;
      }
      if (song.lyricsFileName) {
        lyricsNameToIndexMap[song.lyricsFileName] = index;
      }
      if (song.songImageFileName) {
        songCoverImgToIndexMap[song.songImageFileName] = index;
      }
    });

    console.log('File to index mapping:', { songNameToIndexMap, lyricsNameToIndexMap, songCoverImgToIndexMap });

    // Handle album cover image upload if available
    let albumCoverFile = uploadedFilesRef.current.albumCover;

    // If album cover file is not found in the ref, try to find it in the DOM
    if (!albumCoverFile && albumDetails.albumCoverImg) {
      console.log(`Album cover not found in ref, searching DOM for: ${albumDetails.albumCoverImg}`);
      const fileInputs = document.querySelectorAll('input[type="file"]');
      for (let input of fileInputs) {
        if (input.files && input.files[0] && input.files[0].name === albumDetails.albumCoverImg) {
          albumCoverFile = input.files[0];
          console.log(`Found album cover file in DOM: ${albumCoverFile.name}`);
          // Store it for future reference
          uploadedFilesRef.current.albumCover = albumCoverFile;
          break;
        }
      }
    }

    if (albumCoverFile && presignedUrlsData.albumCoverUrl) {
      console.log(`Processing album cover: ${albumCoverFile.name}`);
      uploadPromises.push(
        uploadFileWithProgress(albumCoverFile, presignedUrlsData.albumCoverUrl, 'albumCover')
          .catch(error => {
            console.error(`Failed to upload album cover: ${error.message}`);
            failedUploads.push(`Album cover: ${error.message}`);
            return null;
          })
      );
    } else {
      console.log('No album cover file or no presigned URL provided. Treating as optional.');
    }

    // Process each song
    for (const songData of presignedUrlsData.songs) {
      const { songName, lyricsFileName, songImageFileName, songUrl, lyricsUrl, songImageUrl } = songData;

      // Get the song index for this file
      const songIndex = songNameToIndexMap[songName];
      const lyricsIndex = lyricsNameToIndexMap[lyricsFileName];
      const songImageIndex = songCoverImgToIndexMap[songImageFileName];

      console.log(`Processing song: ${songName}, index: ${songIndex}`);
      console.log(`Processing lyrics: ${lyricsFileName}, index: ${lyricsIndex}`);
      console.log(`Processing song cover: ${songImageFileName}, index: ${songImageIndex}`);

      // Try multiple methods to get the file
      let songFile = null;
      let lyricsFile = null;
      let songImageFile = null;

      // Method 1: Try by index
      if (songIndex !== undefined) {
        songFile = uploadedFilesRef.current.songs[songIndex];
        if (songFile) console.log(`Found song file by index: ${songIndex}`);
      }

      if (lyricsIndex !== undefined) {
        lyricsFile = uploadedFilesRef.current.lyrics[lyricsIndex];
        if (lyricsFile) console.log(`Found lyrics file by index: ${lyricsIndex}`);
      }

      if (songImageIndex !== undefined) {
        songImageFile = uploadedFilesRef.current.songImages[songImageIndex];
        if (songImageFile) console.log(`Found song image file by index: ${songImageIndex}`);
      }

      // Try to find song image file by original field name in the songs array
      if (!songImageFile && songIndex !== undefined) {
        const songData = songs[songIndex];
        if (songData && songData.songImageFileName) {
          songImageFile = uploadedFilesRef.current.songImages[songData.songImageFileName];
          if (songImageFile) console.log(`Found song image file by original field name: ${songData.songImageFileName}`);
        }
      }

      // Method 2: Try by filename
      if (!songFile) {
        songFile = uploadedFilesRef.current.songs[songName];
        if (songFile) console.log(`Found song file by name: ${songName}`);
      }

      if (!lyricsFile) {
        lyricsFile = uploadedFilesRef.current.lyrics[lyricsFileName];
        if (lyricsFile) console.log(`Found lyrics file by name: ${lyricsFileName}`);
      }

      if (!songImageFile) {
        // Try using both field names for the song cover image
        songImageFile = uploadedFilesRef.current.songImages[songImageFileName];
        if (songImageFile) {
          console.log(`Found song cover image file by name: ${songImageFileName}`);
        } else {
          // Try to find the song cover image by looking through all stored song images
          for (const key in uploadedFilesRef.current.songImages) {
            if (uploadedFilesRef.current.songImages[key]) {
              console.log(`Checking stored image: ${key} -> ${uploadedFilesRef.current.songImages[key].name}`);
              if (songIndex !== undefined && key == songIndex) {
                songImageFile = uploadedFilesRef.current.songImages[key];
                console.log(`Found song cover image file by index key: ${key}`);
                break;
              }
            }
          }

          // If we still don't have the song image file, try to find it by checking all files
          if (!songImageFile && songIndex !== undefined) {
            // Get the original song data to find the image filename
            const originalSongData = songs[songIndex];
            if (originalSongData && originalSongData.songImageFileName) {
              // Look for any file that matches the original filename
              for (const key in uploadedFilesRef.current.songImages) {
                const file = uploadedFilesRef.current.songImages[key];
                if (file && file.name === originalSongData.songImageFileName) {
                  songImageFile = file;
                  console.log(`Found song image file by matching original filename: ${originalSongData.songImageFileName}`);
                  break;
                }
              }
            }
          }
        }
      }

      // Method 3: Search DOM
      if (!songFile || !lyricsFile || (!songImageFile && songImageFileName)) {
        const fileInputs = document.querySelectorAll('input[type="file"]');

        if (!songFile) {
          for (let input of fileInputs) {
            if (input.files && input.files[0] && input.files[0].name === songName) {
              songFile = input.files[0];
              console.log(`Found song file in DOM: ${songName}`);
              // Store for future use
              uploadedFilesRef.current.songs[songIndex] = songFile;
              uploadedFilesRef.current.songs[songName] = songFile;
              break;
            }
          }
        }

        if (!lyricsFile) {
          for (let input of fileInputs) {
            if (input.files && input.files[0] && input.files[0].name === lyricsFileName) {
              lyricsFile = input.files[0];
              console.log(`Found lyrics file in DOM: ${lyricsFileName}`);
              // Store for future use
              uploadedFilesRef.current.lyrics[lyricsIndex] = lyricsFile;
              uploadedFilesRef.current.lyrics[lyricsFileName] = lyricsFile;
              break;
            }
          }
        }

        if (!songImageFile && songImageFileName) {
          for (let input of fileInputs) {
            if (input.files && input.files[0] && input.files[0].name === songImageFileName) {
              songImageFile = input.files[0];
              console.log(`Found song cover image file in DOM: ${songImageFileName}`);
              // Store for future use
              uploadedFilesRef.current.songImages[songImageIndex] = songImageFile;
              uploadedFilesRef.current.songImages[songImageFileName] = songImageFile;
              break;
            }
          }
        }
      }

      // Only require songFile and lyricsFile
      if (songFile && lyricsFile) {
        console.log(`Found required files for song: ${songName}, lyrics: ${lyricsFileName}`);
        uploadPromises.push(uploadFileWithProgress(songFile, songUrl, "song"));
        uploadPromises.push(uploadFileWithProgress(lyricsFile, lyricsUrl, "lyrics"));

        // Upload song cover image only if both file and URL exist
        if (songImageFile && songImageUrl) {
          console.log(`Uploading song cover image: ${songImageFile.name} to URL of length: ${songImageUrl.length}`);
          uploadPromises.push(uploadFileWithProgress(songImageFile, songImageUrl, "songCoverImg"));
        } else {
          console.log(`No song cover image file or URL for ${songName}. Treating as optional.`);
        }
      } else {
        failedUploads.push({
          songName,
          lyricsFileName,
          songImageFileName,
          reason: `Required files not found: ${!songFile ? 'song, ' : ''}${!lyricsFile ? 'lyrics' : ''}`
        });
        console.error(`Missing required files for song: ${songName}, lyrics: ${lyricsFileName}`);
        if (!songFile) console.error(`Missing song file: ${songName}`);
        if (!lyricsFile) console.error(`Missing lyrics file: ${lyricsFileName}`);
      }
    }

    // Only fail if required files are missing
    if (failedUploads.length > 0) {
      console.error('Some required files could not be found:', failedUploads);
      if (!window.confirm('Some required files (song or lyrics) could not be found. Continue anyway?')) {
        throw new Error('Upload cancelled due to missing required files');
      }
    }

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);
    console.log("All files uploaded successfully");

    // Prepare the payload for processing songs - match the backend API requirements exactly
    const payload = {
      user_id,
      FullName: defaultName,
      albumName: capitalizeFirstLetter(albumDetails.albumName),
      albumCoverImg: albumDetails.albumCoverImg || "",
      songs: formattedSongs,
      stage_name: StageName || "",
      story: albumDetails.story || "",
      createdTimestamp: currentTimestamp,
      updatedTimestamp: currentTimestamp
    };

    // Log payload for debugging
    console.log("Submitting payload for processing:", payload);

    // Submit to AWS API for processing
    const response = await fetch(
      "https://g076kfytq4.execute-api.ap-south-1.amazonaws.com/voiznew/processMultipleSongs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    // Log response status
    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error response:", errorData);
      throw new Error(errorData.error || errorData.message || "Failed to submit songs");
    }

    const result = await response.json();
    console.log("Success response:", result);

    // Send email notification to admins
const fallbackEmails = [
  "ankitad@cloudmotivglobal.com",
  "mriganka@voiz.co.in"
];

try {
  // Fetch admin emails
  const adminEmailsResponse = await fetch(
    "https://knjixc4wse.execute-api.ap-south-1.amazonaws.com/admin_report/get_admin_emails",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  let adminEmails = fallbackEmails;

  if (adminEmailsResponse.ok) {
    const adminEmailsData = await adminEmailsResponse.json();
    if (adminEmailsData.success && adminEmailsData.admins && adminEmailsData.admins.length > 0) {
      adminEmails = adminEmailsData.admins.map(admin => admin.email);
      console.log(`Sending notification to ${adminEmails.length} admins`);
    } else {
      console.warn("No admin emails found, using fallback emails");
    }
  } else {
    console.error("Failed to fetch admin emails, using fallback emails");
  }

  // Prepare song titles for email
  const songTitles = formattedSongs.map(song => song.songName);

  // Send email notification
  await fetch(
    "https://eegkqhka27.execute-api.ap-south-1.amazonaws.com/new/AdminSendApprovalEmailForMultipleSongs",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        adminEmails: adminEmails,
        songTitles: songTitles,
        singerName: defaultName,
        albumName: capitalizeFirstLetter(albumDetails.albumName)
      }),
    }
  );

  console.log("Email notification sent successfully to admins");
} catch (emailError) {
  console.error("Error sending email notification:", emailError);
  // Continue with success flow even if email fails, as it's not critical
}

    // Set the data needed for navigation and show the confirmation modal.
    const navData = {
      name: defaultName,
      albumName: albumDetails.albumName,
      albumId: result.albumId || null,
      songs: formattedSongs,
      processedSongs: result.processedSongs,
      failedSongs: result.failedSongs || [],
      success: true,
    };
    
    // First show confirmation modal
      // Send email notification to admins
      await sendAlbumUploadEmail(
        capitalizeFirstLetter(albumDetails.albumName),
        songs.map(s => capitalizeFirstLetter(s.songName)),
        StageName || FullName || "Unknown Artist"
      );

      setShowConfirmation(true);
    
    // Set navigation data after a short delay to ensure modal is shown first
    setTimeout(() => {
      setNavigationData(navData);
    }, 1000); // 1 second delay to ensure modal is visible
  } catch (error) {
    console.error("Submission error:", error);
    alert(`Error: ${error.message}\n\nPlease check the browser console for more details.`);
  } finally {
    setIsLoading(false);
  }
};

  const sendAlbumUploadEmail = async (albumName, songTitles, singerName) => {
    const fallbackEmails = [
      "ankitad@cloudmotivglobal.com",
      "mriganka@voiz.co.in"
    ];

    try {
      const adminEmailsResponse = await fetch(
        "https://knjixc4wse.execute-api.ap-south-1.amazonaws.com/admin_report/get_admin_emails",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      let adminEmails = fallbackEmails;
      if (adminEmailsResponse.ok) {
        const adminEmailsData = await adminEmailsResponse.json();
        if (adminEmailsData.success && adminEmailsData.admins && adminEmailsData.admins.length > 0) {
          adminEmails = adminEmailsData.admins.map(admin => admin.email);
        }
      }

      console.log(`Sending notification to ${adminEmails.length} admins for album: ${albumName}`);

      const response = await fetch(
        "https://kdr7woc3ih.execute-api.ap-south-1.amazonaws.com/default/AdminSendApprovalEmailForMultipleSongs",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminEmails: adminEmails,
            songTitles: songTitles,
            singerName: singerName,
            albumName: albumName,
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Backend returned an error:', response.status, responseData);
        throw new Error(`Failed to send email. Status: ${response.status}`);
      }

      console.log('Album upload email sent successfully:', responseData);
    } catch (error) {
      console.error("Failed to send album upload email:", error);
    }
  };

  const handleCloseDialog = () => setOpenDialog(false);
  const handleOpenTermsModal = () => {
    setIsTermsModalOpen(true);
  };

  const handleCloseTermsModal = () => {
    setIsTermsModalOpen(false);
  };

  const handleUploadFromTerms = () => {
    // Close the terms modal first
    setIsTermsModalOpen(false);
    
    // Proceed with upload after a short delay to ensure modal is closed
    setTimeout(() => {
      proceedToSubmit();
    }, 100); // Small delay to ensure modal animation completes
  };

  const handleProceed = () => {
    handleCloseDialog();
    handleOpenTermsModal();
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#211f20" }}>
      <SideBar />
      <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 2 }, maxWidth: "1000px", ml: "20px", mt: "20px" }}>
        <Typography
          variant="h5"
          sx={{
            color: "white",
            fontWeight: 600,
            mb: 2,
            textAlign: "center",
            fontSize: { xs: "1.25rem", sm: "1.75rem" },
          }}
        >
          Create Your Album
        </Typography>

        {/* Album Details */}
        <Paper
          elevation={2}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            borderRadius: 2,
            color: "white",
            bgcolor: "#211f20",
          }}
        >
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, fontSize: "1rem" }}>
            Album Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Grid container spacing={2} alignItems="center" mb={2}>
                <Grid item xs={4}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textAlign: "right" }}>
                    Album Name:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                <TextField
                  fullWidth
                  name="albumName"
                  placeholder="Enter album name"
                  value={albumDetails.albumName}
                  onChange={handleAlbumChange}
                  error={Boolean(errors.albumName)}
                  helperText={errors.albumName}
                  variant="filled"
                  size="small"
                  sx={{
                    backgroundColor: "#d3d2d2",
                    borderRadius: "10px !important",
                    height: "56px !important",
                    paddingLeft: "10px !important",
                    "& .MuiFilledInput-root": {
                      borderRadius: "10px !important",
                      boxShadow: "0px 0px 0px 1px transparent",
                      height: "56px",
                      backgroundColor: "#d3d2d2 !important",
                      "&:hover": {
                        backgroundColor: "#d3d2d2 !important",
                        borderBottom: "none !important",
                      },
                      "&.Mui-focused": {
                        backgroundColor: "#d3d2d2 !important",
                      },
                      "&:before, &:after": {
                        borderBottom: "none !important",
                      },
                      "& .MuiFilledInput-input": {
                        color: "black !important",
                        fontFamily: "Poppins !important",
                        letterSpacing: "1px !important",
                        padding: "0 12px",
                        height: "56px",
                      },
                    },
                  }}
                  autoComplete="off"
                />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Grid container alignItems="center">
                <Grid item xs={2.5}></Grid>
                <Grid item xs={8}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Button
                        variant="contained"
                        component="label"
                        sx={{ padding: '10px 24px', textTransform: 'none', whiteSpace: 'nowrap' }}
                      >
                        Album Cover Image
                        <input
                          type="file"
                          hidden
                          name="albumCoverImg"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileChange(null, 'albumCoverImg')}
                        />
                      </Button>
                        <Tooltip
                          placement="top-start"
                          leaveDelay={200}
                          title={
                            <React.Fragment>
                              <Typography color="inherit" sx={{ fontSize: '24px', fontWeight: 'bold', mb: 1 }}>Information</Typography>
                              <Typography sx={{ fontSize: '18px' }}>
                                Add Album Cover Image Supported File Formats:<strong> .jpeg, .jpg and .png</strong>
                              </Typography>
                            </React.Fragment>
                          }
                          PopperProps={{
                            modifiers: [
                              {
                                name: 'offset',
                                options: {
                                  offset: [0, -14],
                                },
                              },
                            ],
                          }}
                          componentsProps={{
                            tooltip: {
                              sx: {
                                backgroundColor: 'black',
                                color: 'white',
                                borderRadius: '24px 24px 24px 0',
                                padding: '12px',
                                width: '269px',
                                height: '100px',
                              },
                            },
                          }}
                        >
                          <InfoOutlinedIcon sx={{ color: 'white', cursor: 'pointer', ml: 1 }} />
                        </Tooltip>
                        </Box>
                        {albumDetails.albumCoverImg && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Typography variant="body2" sx={{ color: "white", textAlign: 'center' }}>
                              {albumDetails.albumCoverImg}
                            </Typography>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => {
                                setAlbumDetails(prev => ({ ...prev, albumCoverImg: "" }));
                                uploadedFilesRef.current.albumCover = null;
                              }}
                            >
                              Clear
                            </Button>
                          </Box>
                        )}
                        {errors.albumCoverImg && (
                          <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                            {errors.albumCoverImg}
                          </Typography>
                        )}
                      </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        {/* Song Tabs */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 2,
            "& .MuiTabs-indicator": { backgroundColor: "#1E88E5" },
          }}
        >
          {songs.map((song, index) => (
            <Tab
              key={song.id}
              label={`Song ${index + 1}`}
              sx={{ bgcolor: "#211f20", color: "white", borderRadius: "4px", mx: 0.5 }}
            />
          ))}
        </Tabs>

        {/* Song Entry (Active Tab) */}
        <Paper
          elevation={2}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            borderRadius: 2,
            bgcolor: "#211f20",
            color: "white",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem",  }}>
              Song {activeTab + 1}
            </Typography>
            <IconButton
              onClick={() => removeSongEntry(activeTab)}
              disabled={songs.length === 1}
              size="small"
              sx={{
                color: "#ef5350",
                '&:hover': {
                  backgroundColor: "rgba(239, 83, 80, 0.1)",
                  color: "#cc181e",

                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Grid container spacing={2} alignItems="center" mb={2}>
                <Grid item xs={4}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textAlign: "right" }}>
                    Song Name:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <TextField
            sx={{
              backgroundColor: "#d3d2d2",
              borderRadius: "10px !important",
              height: "56px !important",
              paddingLeft: "10px !important",
              '& .MuiFilledInput-root': {
                borderRadius: "10px !important",
                boxShadow: "0px 0px 0px 1px transparent",
                height: "56px",
                backgroundColor: "#d3d2d2 !important",
                '&:hover': {
                  backgroundColor: '#d3d2d2 !important',
                },
                '&.Mui-focused': {
                  backgroundColor: '#d3d2d2 !important',
                },
                '&::before, &::after': {
                  borderBottom: 'none !important',
                },
                '& .MuiFilledInput-input': {
                  color: "black !important",
                  fontFamily: "Poppins !important",
                  letterSpacing: "1px !important",
                  padding: "0 12px",
                  height: "56px",
                }
              }
            }}
                    fullWidth
                    name="songName"
                    placeholder="Enter song name"
                    value={songs[activeTab].songName}
                    onChange={handleSongChange(activeTab)}
                    error={Boolean(errors.songs[activeTab]?.songName)}
                    helperText={errors.songs[activeTab]?.songName}
                    variant="filled"
                    size="small"
                    autoComplete="off"
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Grid container spacing={2} alignItems="center" mb={2}>
                <Grid item xs={4}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textAlign: "right" }}>
                    Language:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <FormControl
                    variant="filled"
                    error={Boolean(errors.songs[activeTab]?.language)}
                    size="small"
                    fullWidth
                    sx={{
                      position: "relative",
                      backgroundColor: "#d3d2d2 !important",
                      borderRadius: "10px",
                      "& .MuiInputBase-root": {
                        height: "56px",
                        borderRadius: "10px",
                        backgroundColor: "#d3d2d2 !important",
                        boxShadow: "0px 0px 0px 1px transparent",
                        '&:hover': {
                          backgroundColor: '#d3d2d2 !important',
                        },
                        '&.Mui-focused': {
                          backgroundColor: '#d3d2d2 !important',
                        },
                        '&::before, &::after': {
                          borderBottom: 'none !important',
                        },
                        "&:hover:before": {
                          borderBottom: "none !important",
                        },
                        "&:hover:after": {
                          borderBottom: "none !important",
                        },
                      },
                      "& .MuiSelect-select": {
                        backgroundColor: "#d3d2d2 !important",
                        "&:hover": {
                          backgroundColor: "#d3d2d2 !important",
                        },
                        "&.Mui-focused": {
                          backgroundColor: "#d3d2d2 !important",
                        },
                      },
                    }}
                  >
                    <InputLabel
                      shrink={false}
                      sx={{
                        position: "absolute",
                        left: "12px",
                        top: isFocused || songs[activeTab].language ? "8px" : "50%",
                        transform: isFocused || songs[activeTab].language ? "none" : "translateY(-50%)",
                        fontSize: isFocused || songs[activeTab].language ? "12px" : "16px",
                        color: isFocused || songs[activeTab].language ? "#2782EE" : "grey",
                        "&.Mui-error": {
                          color: isFocused || songs[activeTab].language ? "#2782EE" : "grey",
                        },
                        transition: "all 0.2s ease-in-out",
                        pointerEvents: "none",
                        opacity: isFocused || songs[activeTab].language ? 0 : 1,
                        paddingLeft: "10px",
                      }}
                    >
                      Language
                    </InputLabel>
                    <Select
                      name="language"
                      value={songs[activeTab].language}
                      onChange={handleSongChange(activeTab)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="Language"
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
                    <FormHelperText sx={{ color: "#FF5C5C", position: "absolute", bottom: "-20px", left: "0" }}>
                      {errors.songs[activeTab]?.language}
                    </FormHelperText>
                  </FormControl>
                </Grid>
              </Grid>
              
            </Grid>

            <Grid item xs={12}>
              <Grid container spacing={2} alignItems="center" mb={2}>
                <Grid item xs={4}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textAlign: "right" }}>
                    Genre:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <FormControl
                    variant="filled"
                    error={Boolean(errors.songs[activeTab]?.genre)}
                    size="small"
                    fullWidth
                    sx={{
                      position: "relative",
                      backgroundColor: "#d3d2d2 !important",
                      borderRadius: "10px",
                      "& .MuiInputBase-root": {
                        height: "56px",
                        borderRadius: "10px",
                        backgroundColor: "#d3d2d2 !important",
                        boxShadow: "0px 0px 0px 1px transparent",
                        '&:hover': {
                          backgroundColor: '#d3d2d2 !important',
                        },
                        '&.Mui-focused': {
                          backgroundColor: '#d3d2d2 !important',
                        },
                        '&::before, &::after': {
                          borderBottom: 'none !important',
                        },
                      },
                    }}
                  >
                    <InputLabel
                      shrink={false}
                      sx={{
                        position: "absolute",
                        left: "12px",
                        top: isGenreFocused || songs[activeTab].genre ? "8px" : "50%",
                        transform:
                          isGenreFocused || songs[activeTab].genre
                            ? "none"
                            : "translateY(-50%)",
                        fontSize: isGenreFocused || songs[activeTab].genre ? "12px" : "16px",
                        color: isGenreFocused || songs[activeTab].genre ? "#2782EE" : "grey",
                        "&.Mui-error": {
                          color: isGenreFocused || songs[activeTab].genre ? "#2782EE" : "grey",
                        },
                        transition: "all 0.2s ease-in-out",
                        pointerEvents: "none",
                        opacity: isGenreFocused || songs[activeTab].genre ? 0 : 1,
                        paddingLeft: "10px",
                      }}
                    >
                      Genre
                    </InputLabel>
                    <Select
                      name="genre"
                      value={songs[activeTab].genre}
                      onChange={handleSongChange(activeTab)}
                      onFocus={() => setIsGenreFocused(true)}
                      onBlur={() => setIsGenreFocused(false)}
                      placeholder="Genre"
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
                      <MenuItem value="Devotional">Devotional</MenuItem>
                      <MenuItem value="Ghazal">Ghazal</MenuItem>
                      <MenuItem value="Indie">Indie</MenuItem>
                      <MenuItem value="Pop">Pop</MenuItem>
                      <MenuItem value="Rock">Rock</MenuItem>
                      <MenuItem value="Hip Hop">Hip Hop</MenuItem>
                      <MenuItem value="R&B">R&B</MenuItem>
                      <MenuItem value="Jazz">Jazz</MenuItem>
                      <MenuItem value="Classical">Classical</MenuItem>
                    </Select>
                    <FormHelperText sx={{ color: "#FF5C5C", position: "absolute", bottom: "-20px", left: "0" }}>
                      {errors.songs[activeTab]?.genre}
                    </FormHelperText>
                  </FormControl>
                </Grid>
              </Grid>
              
             </Grid>
            </Grid>

            <Grid item xs={12}>
              <Grid container spacing={2} alignItems="center" mb={2}>
                <Grid item xs={4}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textAlign: "right" }}>
                    Mood and Pace:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <TextField
            sx={{
              backgroundColor: "#d3d2d2",
              borderRadius: "10px !important",
              height: "56px !important",
              paddingLeft: "10px !important",
              '& .MuiFilledInput-root': {
                borderRadius: "10px !important",
                boxShadow: "0px 0px 0px 1px transparent",
                height: "56px",
                backgroundColor: "#d3d2d2 !important",
                '&:hover': {
                  backgroundColor: '#d3d2d2 !important',
                },
                '&.Mui-focused': {
                  backgroundColor: '#d3d2d2 !important',
                },
                '&::before, &::after': {
                  borderBottom: 'none !important',
                },
                '& .MuiFilledInput-input': {
                  color: "black !important",
                  fontFamily: "Poppins !important",
                  letterSpacing: "1px !important",
                  padding: "0 12px",
                  height: "56px",
                }
              }
            }}
                    fullWidth
                    name="mood"
                    placeholder="Enter mood and pace"
                    value={songs[activeTab].mood}
                    onChange={handleSongChange(activeTab)}
                    error={Boolean(errors.songs[activeTab]?.mood)}
                    helperText={errors.songs[activeTab]?.mood}
                    variant="filled"
                    size="small"
                    autoComplete="off"
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
  <Grid container spacing={2} alignItems="flex-start">
    <Grid item xs={4}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textAlign: "right", pt: 1.5 }}>
        Story behind song:
      </Typography>
    </Grid>
    <Grid item xs={8}>
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', mb: 4 }}>
        <TextField
          fullWidth
          multiline
          minRows={1}
          maxRows={8} // Increased max rows to allow more expansion
          variant="filled"
          placeholder="Enter story behind song"
          name="story"
          value={songs[activeTab].story}
          onChange={handleStoryChange(activeTab)}
          autoComplete="off"
          sx={{
            borderRadius: '10px',
            backgroundColor: '#d3d2d2',
            '& .MuiFilledInput-root': {
              borderRadius: '10px',
              backgroundColor: '#d3d2d2 !important',
              padding: songs[activeTab].story ? '12px 15px' : '22px 15px',
              alignItems: songs[activeTab].story ? 'flex-start' : 'center',
              overflow: 'hidden',
              '&:hover, &.Mui-focused': {
                backgroundColor: '#d3d2d2 !important',
              },
              '&::before, &::after': {
                borderBottom: 'none !important',
              },
            },
            '& .MuiFilledInput-input': {
              padding: '0px 8px 0px 0px !important',
              resize: 'none',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              overflowY: 'auto',
              maxHeight: '160px',
              '&::-webkit-scrollbar': {
                width: '8px',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: '4px',
                margin: '4px 0',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#888',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: '#555',
                },
              },
              'scrollbarWidth': 'thin',
              'scrollbarColor': '#888 rgba(0,0,0,0.1)',
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip
                  title={
                    <React.Fragment>
                      <Typography color="inherit" sx={{ fontSize: '24px', fontWeight: 'bold', mb: 1 }}>Information</Typography>
                      <Typography sx={{ fontSize: '18px' }}>What inspired you to make this song</Typography>
                    </React.Fragment>
                  }
                  placement="top-start"
                  leaveDelay={200}
                  PopperProps={{
                    modifiers: [
                      {
                        name: 'offset',
                        options: {
                          offset: [0, -14],
                        },
                      },
                    ],
                  }}
                  componentsProps={{
                    tooltip: {
                      sx: {
                        backgroundColor: 'black',
                        color: 'white',
                        borderRadius: '24px 24px 24px 0',
                        padding: '12px',
                        width: '269px',
                        height: '100px',
                      },
                    },
                  }}
                >
                  <InfoOutlinedIcon sx={{ color: 'black', cursor: 'pointer' }} />
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />
        
        {/* Container for error messages and word count */}
        <Box sx={{ 
          position: 'relative',
          width: '100%',
          minHeight: '24px',
          mt: 0.5
        }}>
          {/* Word count positioned at bottom-right of the field */}
          <Typography variant="caption" sx={{ 
            color: 'white',
            position: 'absolute',
            right: '15px',
            top: '4px'
          }}>
            {`${(songs[activeTab].story || '').split(/\s+/).filter(Boolean).length}/400 words`}
          </Typography>
          
          {/* Error messages below the field */}
          <Box sx={{ mt: 1 }}>
            {/* Validation error */}
            {errors.songs[activeTab]?.story && (
              <FormHelperText error sx={{ color: '#FF5C5C', pl: '0px', mt: 0 }}>
                {errors.songs[activeTab]?.story}
              </FormHelperText>
            )}
            
            {/* Word limit error */}
            {(songs[activeTab].story || '').split(/\s+/).filter(Boolean).length >= 400 && (
              <FormHelperText error sx={{ color: '#FF5C5C', pl: '0px', mt: 0.5 }}>
                Maximum word count limit reached
              </FormHelperText>
            )}
          </Box>
        </Box>
      </Box>
    </Grid>
  </Grid>
</Grid>
            <Grid item xs={12}>
              <Grid container spacing={2} alignItems="center" mb={2}>
                <Grid item xs={4}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textAlign: "right" }}>
                    Singer Name:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <TextField
            sx={{
              backgroundColor: "#d3d2d2",
              borderRadius: "10px !important",
              height: "56px !important",
              paddingLeft: "10px !important",
              '& .MuiFilledInput-root': {
                borderRadius: "10px !important",
                boxShadow: "0px 0px 0px 1px transparent",
                height: "56px",
                backgroundColor: "#d3d2d2 !important",
                '&:hover': {
                  backgroundColor: '#d3d2d2 !important',
                },
                '&.Mui-focused': {
                  backgroundColor: '#d3d2d2 !important',
                },
                '&::before, &::after': {
                  borderBottom: 'none !important',
                },
                '& .MuiFilledInput-input': {
                  color: "black !important",
                  fontFamily: "Poppins !important",
                  letterSpacing: "1px !important",
                  padding: "0 12px",
                  height: "56px",
                }
              }
            }}
                    fullWidth
                    name="singer"
                    placeholder="Singer"
                    value={songs[activeTab].singer}
                    onChange={handleSongChange(activeTab)}
                    error={Boolean(errors.songs[activeTab]?.singer)}
                    helperText={errors.songs[activeTab]?.singer}
                    variant="filled"
                    size="small"
                    autoComplete="off"
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Grid container spacing={2} alignItems="center" mb={2}>
                <Grid item xs={4}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textAlign: "right" }}>
                    Producer:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <TextField
            sx={{
              backgroundColor: "#d3d2d2",
              borderRadius: "10px !important",
              height: "56px !important",
              paddingLeft: "10px !important",
              '& .MuiFilledInput-root': {
                borderRadius: "10px !important",
                boxShadow: "0px 0px 0px 1px transparent",
                height: "56px",
                backgroundColor: "#d3d2d2 !important",
                '&:hover': {
                  backgroundColor: '#d3d2d2 !important',
                },
                '&.Mui-focused': {
                  backgroundColor: '#d3d2d2 !important',
                },
                '&::before, &::after': {
                  borderBottom: 'none !important',
                },
                '& .MuiFilledInput-input': {
                  color: "black !important",
                  fontFamily: "Poppins !important",
                  letterSpacing: "1px !important",
                  padding: "0 12px",
                  height: "56px",
                }
              }
            }}
                    fullWidth
                    name="producer"
                    placeholder="Producer"
                    value={songs[activeTab].producer}
                    onChange={handleSongChange(activeTab)}
                    error={Boolean(errors.songs[activeTab]?.producer)}
                    helperText={errors.songs[activeTab]?.producer}
                    variant="filled"
                    size="small"
                    autoComplete="off"
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Grid container spacing={2} alignItems="center" mb={2}>
                <Grid item xs={4}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textAlign: "right" }}>
                    Composer:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <TextField
            sx={{
              backgroundColor: "#d3d2d2",
              borderRadius: "10px !important",
              height: "56px !important",
              paddingLeft: "10px !important",
              '& .MuiFilledInput-root': {
                borderRadius: "10px !important",
                boxShadow: "0px 0px 0px 1px transparent",
                height: "56px",
                backgroundColor: "#d3d2d2 !important",
                '&:hover': {
                  backgroundColor: '#d3d2d2 !important',
                },
                '&.Mui-focused': {
                  backgroundColor: '#d3d2d2 !important',
                },
                '&::before, &::after': {
                  borderBottom: 'none !important',
                },
                '& .MuiFilledInput-input': {
                  color: "black !important",
                  fontFamily: "Poppins !important",
                  letterSpacing: "1px !important",
                  padding: "0 12px",
                  height: "56px",
                }
              }
            }}
                    fullWidth
                    name="composer"
                    placeholder="Composer"
                    value={songs[activeTab].composer}
                    onChange={handleSongChange(activeTab)}
                    error={Boolean(errors.songs[activeTab]?.composer)}
                    helperText={errors.songs[activeTab]?.composer}
                    variant="filled"
                    size="small"
                    autoComplete="off"
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Grid container spacing={2} alignItems="center" mb={2}>
                <Grid item xs={4}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textAlign: "right" }}>
                    Lyricist:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <TextField
            sx={{
              backgroundColor: "#d3d2d2",
              borderRadius: "10px !important",
              height: "56px !important",
              paddingLeft: "10px !important",
              '& .MuiFilledInput-root': {
                borderRadius: "10px !important",
                boxShadow: "0px 0px 0px 1px transparent",
                height: "56px",
                backgroundColor: "#d3d2d2 !important",
                '&:hover': {
                  backgroundColor: '#d3d2d2 !important',
                },
                '&.Mui-focused': {
                  backgroundColor: '#d3d2d2 !important',
                },
                '&::before, &::after': {
                  borderBottom: 'none !important',
                },
                '& .MuiFilledInput-input': {
                  color: "black !important",
                  fontFamily: "Poppins !important",
                  letterSpacing: "1px !important",
                  padding: "0 12px",
                  height: "56px",
                }
              }
            }}
                    fullWidth
                    name="lyricist"
                    placeholder="Lyricist"
                    value={songs[activeTab].lyricist}
                    onChange={handleSongChange(activeTab)}
                    error={Boolean(errors.songs[activeTab]?.lyricist)}
                    helperText={errors.songs[activeTab]?.lyricist}
                    variant="filled"
                    size="small"
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Grid container>
                <Grid item xs={2.5} />
                <Grid item xs={8}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 2 }}>
                    {/* Upload Lyrics Button */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Button
                          variant="contained"
                          component="label"
                          sx={{
                            padding: '10px 24px',
                            textTransform: 'none',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Upload Lyrics
                          <input
                            type="file"
                            hidden
                            name="lyricsFileName"
                            onChange={handleFileChange(activeTab, "lyricsFileName")}
                          />
                        </Button>
                        <Tooltip
                          placement="top-start"
                          leaveDelay={200}
                          title={
                            <React.Fragment>
                              <Typography color="inherit" sx={{ fontSize: '24px', fontWeight: 'bold', mb: 1 }}>Information</Typography>
                              <Typography sx={{ fontSize: '18px' }}>
                                Supported File Formats:<strong> .txt and .pdf</strong>
                              </Typography>
                            </React.Fragment>
                          }
                          PopperProps={{
                            modifiers: [
                              {
                                name: 'offset',
                                options: {
                                  offset: [0, -14],
                                },
                              },
                            ],
                          }}
                          componentsProps={{
                            tooltip: {
                              sx: {
                                backgroundColor: 'black',
                                color: 'white',
                                borderRadius: '24px 24px 24px 0',
                                padding: '12px',
                                width: '269px',
                                height: '100px',
                              },
                            },
                          }}
                        >
                          <InfoOutlinedIcon sx={{ color: 'white', cursor: 'pointer' }} />
                        </Tooltip>
                      </Box>
                      {songs[activeTab].lyricsFileName && (
                        <Typography variant="body2" sx={{ color: "white", mt: 1, textAlign: 'center' }}>
                          {songs[activeTab].lyricsFileName}
                        </Typography>
                      )}
                      {errors.songs[activeTab]?.lyricsFileName && (
                        <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                          {errors.songs[activeTab]?.lyricsFileName}
                        </Typography>
                      )}
                    </Box>

                    {/* Upload Song Button */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Button
                          variant="contained"
                          component="label"
                          sx={{
                            padding: '10px 24px',
                            textTransform: 'none',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Upload Song
                          <input
                            type="file"
                            hidden
                            name="fileName"
                            onChange={handleFileChange(activeTab, "fileName")}
                          />
                        </Button>
                        <Tooltip
                          placement="top-start"
                          leaveDelay={200}
                          title={
                            <React.Fragment>
                              <Typography color="inherit" sx={{ fontSize: '24px', fontWeight: 'bold', mb: 1 }}>Information</Typography>
                              <Typography sx={{ fontSize: '18px' }}>
                                Supported File Formats:<strong> .mp3 and .wav</strong>
                              </Typography>
                            </React.Fragment>
                          }
                          PopperProps={{
                            modifiers: [
                              {
                                name: 'offset',
                                options: {
                                  offset: [0, -14],
                                },
                              },
                            ],
                          }}
                          componentsProps={{
                            tooltip: {
                              sx: {
                                backgroundColor: 'black',
                                color: 'white',
                                borderRadius: '24px 24px 24px 0',
                                padding: '12px',
                                width: '269px',
                                height: '100px',
                              },
                            },
                          }}
                        >
                          <InfoOutlinedIcon sx={{ color: 'white', cursor: 'pointer' }} />
                        </Tooltip>
                      </Box>
                      {songs[activeTab].fileName && (
                        <Typography variant="body2" sx={{ color: "white", mt: 1, textAlign: 'center' }}>
                          {songs[activeTab].fileName}
                        </Typography>
                      )}
                      {errors.songs[activeTab]?.fileName && (
                        <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                          {errors.songs[activeTab]?.fileName}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Grid container alignItems="center">
                <Grid item xs={2.5}></Grid>
                <Grid item xs={8}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Button
                          variant="contained"
                          component="label"
                          sx={{ padding: '10px 24px', textTransform: 'none', whiteSpace: 'nowrap' }}
                        >
                          Song Cover Image
                          <input
                            type="file"
                            hidden
                            name="songImageFileName"
                            onChange={handleFileChange(activeTab, "songImageFileName")}
                          />
                        </Button>
                        <Tooltip
                          placement="top-start"
                          leaveDelay={200}
                          title={
                            <React.Fragment>
                              <Typography color="inherit" sx={{ fontSize: '24px', fontWeight: 'bold', mb: 1 }}>Information</Typography>
                              <Typography sx={{ fontSize: '18px' }}>
                                Add Song Cover Image Supported File Formats:<strong> .jpeg, .jpg and .png</strong>
                              </Typography>
                            </React.Fragment>
                          }
                          PopperProps={{
                            modifiers: [
                              {
                                name: 'offset',
                                options: {
                                  offset: [0, -14],
                                },
                              },
                            ],
                          }}
                          componentsProps={{
                            tooltip: {
                              sx: {
                                backgroundColor: 'black',
                                color: 'white',
                                borderRadius: '24px 24px 24px 0',
                                padding: '12px',
                                width: '269px',
                                height: '100px',
                              },
                            },
                          }}
                        >
                          <InfoOutlinedIcon sx={{ color: 'white', cursor: 'pointer' }} />
                        </Tooltip>
                        </Box>
                        {songs[activeTab].songImageFileName && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Typography variant="body2" sx={{ color: "white", textAlign: 'center' }}>
                              {songs[activeTab].songImageFileName}
                            </Typography>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => {
                                const updatedSongs = [...songs];
                                updatedSongs[activeTab] = { ...updatedSongs[activeTab], songImageFileName: "" };
                                setSongs(updatedSongs);
                                uploadedFilesRef.current.songImages[activeTab] = null;
                                uploadedFilesRef.current.songImages[songs[activeTab].songImageFileName] = null;
                              }}
                            >
                              Clear
                            </Button>
                          </Box>
                        )}
                        {errors.songs[activeTab]?.songImageFileName && (
                          <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                            {errors.songs[activeTab]?.songImageFileName}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
            </Grid>
        </Paper>

        {/* Show buttons only on the last song tab */}
        {activeTab === songs.length - 1 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2, mb: 2 }}>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={addSongEntry}
              sx={{
                bgcolor: "#1E88e5",
                color: "white",
                textTransform: "none",
                borderRadius: "20px",
                px: 2,
                py: 0.5,
                fontSize: "0.875rem",
                "&:hover": { bgcolor: "#1976d2" },
              }}
            >
              Add Song
            </Button>
            <LoadingButton
              onClick={handleSubmit}
              loading={isLoading && !isTermsModalOpen && !showConfirmation}
              variant="contained"
              sx={{
                width: '100%',
                bgcolor: '#1E88E5',
                '&:hover': { bgcolor: '#1976D2' },
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
              }}
            >
              {isLoading ? "Submitting..." : "Submit"}
            </LoadingButton>
          </Box>
        )}

        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle sx={{ bgcolor: "#1E88E5", color: "white", fontWeight: 600, fontSize: "1rem" }}>
            Warning
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Typography sx={{ fontSize: "0.9rem" }}>
              Some of your songs might already exist in your approved songs list. Are you sure you want to proceed?
            </Typography>
          </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} sx={{ color: "#ef5350", fontSize: "0.875rem" }}>
                Cancel
              </Button>
              <Button onClick={handleProceed} sx={{ color: "#1E88E5", fontSize: "0.875rem" }}>
                Proceed
              </Button>
            </DialogActions>
          </Dialog>

          {showConfirmation && (
            <ConfirmationModal
              message={`Your album has been created with '${songs.length}' songs and has been<br />uploaded for approval!`}
              onClose={() => setShowConfirmation(false)}
            />
          )}

          <UploadTermsModal
            open={isTermsModalOpen}
            onClose={handleCloseTermsModal}
            onUpload={handleUploadFromTerms}
            songCount={songs.length}
            isUploading={isLoading}
          />
        </Box>
      </Box>
    
  );
}