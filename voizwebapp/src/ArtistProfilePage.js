
// import React, { useState, useEffect } from "react";
// import {
//   Box,
//   Typography,
//   Avatar,
//   Button,
//   IconButton,
//   CircularProgress,
//   Card,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   Snackbar,
//   Alert,
// } from "@mui/material";
// import { useLocation, useNavigate, useParams } from "react-router-dom";
// import ArrowBackIcon from "@mui/icons-material/ArrowBack";
// import SideBar from "./SideBar";
// import coverpage from "./assets/coverpage1.jpeg";
// import play_arrow from "./assets/play_arrow.png";
// import "./ArtistProfilePage.css";
// import { IoShareSocialOutline } from "react-icons/io5";

// // Import genre images
// import genreImage1 from "./assets/Devotional.png";
// import genreImage2 from "./assets/Classical.png";
// import genreImage3 from "./assets/others.png";
// import genreImage4 from "./assets/Pop.png";
// import genreImage5 from "./assets/Rock.png";
// import genreImage6 from "./assets/Romatic.png";
// import genreImage7 from "./assets/rap2.png";
// import FolkImage from "./assets/Folk1.png";
// import FusionImage from "./assets/fusion.png";
// import OtherImage from "./assets/others.png";
// import RabindraSangeet from "./assets/rabindra sangeet.png";

// // Import language images
// import languageImage1 from "./assets/Bengali.png";
// import languageImage2 from "./assets/English.png";
// import languageImage3 from "./assets/Gujarati.png";
// import languageImage4 from "./assets/Hindi.png";
// import languageImage5 from "./assets/Malayalam.png";
// import languageImage6 from "./assets/Marathi.png";
// import PunjabiImage from "./assets/Punjabi.png";
// import SanskritImage from "./assets/Sanskrit.png";
// import TeluguImage from "./assets/Telugu.png";
// import ManipuriImage from "./assets/Manipuri.png";
// import KannadaImage from "./assets/Kannada.png";
// import KashmiriImage from "./assets/Kashmiri.png";
// import KonkaniImage from "./assets/Konkani.png";
// import OriyaImage from "./assets/Oriya.png";
// import TamilImage from "./assets/Tamil.png";
// import UrduImage from "./assets/Urdu.png";
// import BhojpuriImage from "./assets/Bhojpuri.png";
// import PahariImage from "./assets/Pahari.png";
// import RajasthaniImage from "./assets/Rajasthani.png";
// import JazzImage from "./assets/jazz.png";
// import GhazalImage from "./assets/ghazal.png";
// import SufiImage from "./assets/sufi.png";
// import AssameseImage from "./assets/Assamese.png";
// import { AlignRight } from "lucide-react";

// const ArtistProfilePage = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { userId: userIdParam } = useParams();
//   const [artistDetails, setArtistDetails] = useState(null);
//   const [followersCount, setFollowersCount] = useState(0);
//   const [followingCount, setFollowingCount] = useState(0);
//   const [followersList, setFollowersList] = useState([]);
//   const [followingList, setFollowingList] = useState([]);
//   const [isFollowing, setIsFollowing] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [followLoading, setFollowLoading] = useState(false);
//   const [showFollowButton, setShowFollowButton] = useState(false);
//   const [openShareDialog, setOpenShareDialog] = useState(false);
//   const [shareableLink, setShareableLink] = useState("");
//   const [isGeneratingLink, setIsGeneratingLink] = useState(false);
//   const [showCopyAlert, setShowCopyAlert] = useState(false);
//   const loggedInUserId = localStorage.getItem("user_id");

//   // Log userIdParam for debugging
//   console.log("userIdParam from useParams:", userIdParam);

//   // Use userId from URL params, with fallback to location.state
//   const artistFromState = location.state?.artist;
//   const userId = userIdParam || (artistFromState?.user_id ? String(artistFromState.user_id) : null);

//   console.log("Processed userId:", userId);
//   console.log("location.state:", location.state);

//   const genreImages = {
//     Devotional: genreImage1,
//     Classical: genreImage2,
//     Kids: genreImage3,
//     Pop: genreImage4,
//     Rock: genreImage5,
//     Romantic: genreImage6,
//     Rap: genreImage7,
//     Folk: FolkImage,
//     Fusion: FusionImage,
//     Others: OtherImage,
//     "Rabindra Sangeet": RabindraSangeet,
//   };

//   const languageImages = {
//     Bengali: languageImage1,
//     English: languageImage2,
//     Gujarati: languageImage3,
//     Hindi: languageImage4,
//     Malayalam: languageImage5,
//     Marathi: languageImage6,
//     Punjabi: PunjabiImage,
//     Sanskrit: SanskritImage,
//     Telugu: TeluguImage,
//     Manipuri: ManipuriImage,
//     Kannada: KannadaImage,
//     Kashmiri: KashmiriImage,
//     Rajasthani: RajasthaniImage,
//     Konkani: KonkaniImage,
//     Oriya: OriyaImage,
//     Tamil: TamilImage,
//     Urdu: UrduImage,
//     Bhojpuri: BhojpuriImage,
//     Pahari: PahariImage,
//     Jazz: JazzImage,
//     Ghazal: GhazalImage,
//     Sufi: SufiImage,
//     Assamese: AssameseImage,
//   };

//   useEffect(() => {
//     if (!userId) {
//       setError("Artist ID is missing");
//       setLoading(false);
//       navigate("/homepage", { replace: true });
//       return;
//     }
//     fetchData();
//   }, [userId, loggedInUserId, navigate]);

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

//   const filterValidUsers = (users) => {
//     return users.filter((user) => user.FullName && user.FullName.trim() !== "");
//   };

//   const fetchData = async () => {
//     if (!userId) {
//       setError("Invalid artist ID");
//       setLoading(false);
//       return;
//     }

//     try {
//       setLoading(true);
//       setError(null);

//       console.log("Fetching artist data for ID:", userId);

//       const [
//         detailsResponse,
//         followersCountResponse,
//         followingCountResponse,
//         followersListResponse,
//         followingListResponse,
//         followStatusResponse,
//       ] = await Promise.allSettled([
//         fetch(
//           `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/artist/details?user_id=${userId}`
//         ),
//         fetch(
//           `https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/followers/count?user_id=${userId}`
//         ),
//         fetch(
//           `https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/following/count?user_id=${userId}`
//         ),
//         fetch(
//           `https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/followers/List?user_id=${userId}`
//         ),
//         fetch(
//           `https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/following/List?user_id=${userId}`
//         ),
//         fetch(
//           `https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/checkFollow?user_id=${loggedInUserId}&artistId=${userId}`
//         ),
//       ]);

//       if (detailsResponse.status === "fulfilled" && detailsResponse.value.ok) {
//         const detailsData = await detailsResponse.value.json();
//         console.log("Artist details:", detailsData);
//         setArtistDetails(detailsData);
//         const isNotSameUser = loggedInUserId !== userId;
//         setShowFollowButton(isNotSameUser);
//       } else {
//         throw new Error("Failed to fetch artist details");
//       }

//       if (
//         followersCountResponse.status === "fulfilled" &&
//         followersCountResponse.value.ok
//       ) {
//         const followersData = await followersCountResponse.value.json();
//         setFollowersCount(followersData.count || 0);
//       }

//       if (
//         followingCountResponse.status === "fulfilled" &&
//         followingCountResponse.value.ok
//       ) {
//         const followingData = await followingCountResponse.value.json();
//         setFollowingCount(followingData.count || 0);
//       }

//       if (
//         followersListResponse.status === "fulfilled" &&
//         followersListResponse.value.ok
//       ) {
//         const contentType =
//           followersListResponse.value.headers.get("content-type");
//         if (contentType && contentType.includes("application/json")) {
//           try {
//             const followersData = await followersListResponse.value.json();
//             const followers = Array.isArray(followersData)
//               ? followersData
//               : followersData.followDetails || followersData.followers || [];
//             const validFollowers = filterValidUsers(followers);
//             setFollowersList(validFollowers);
//             setFollowersCount(validFollowers.length);
//           } catch (error) {
//             console.log("No followers data available");
//             setFollowersList([]);
//           }
//         } else {
//           const textResponse = await followersListResponse.value.text();
//           console.log("Followers text response:", textResponse);
//           setFollowersList([]);
//         }
//       }

//       if (
//         followingListResponse.status === "fulfilled" &&
//         followingListResponse.value.ok
//       ) {
//         const contentType =
//           followingListResponse.value.headers.get("content-type");
//         if (contentType && contentType.includes("application/json")) {
//           try {
//             const followingData = await followingListResponse.value.json();
//             const validFollowing = filterValidUsers(
//               followingData.followDetails || []
//             );
//             setFollowingList(validFollowing);
//             setFollowingCount(validFollowing.length);
//           } catch (error) {
//             console.log("No following data available");
//             setFollowingList([]);
//           }
//         } else {
//           const textResponse = await followingListResponse.value.text();
//           console.log("Following text response:", textResponse);
//           setFollowingList([]);
//         }
//       }

//       if (
//         followStatusResponse.status === "fulfilled" &&
//         followStatusResponse.value.ok
//       ) {
//         try {
//           const statusData = await followStatusResponse.value.json();
//           setIsFollowing(statusData.follows);
//         } catch (error) {
//           console.log("Follow status not available");
//           setIsFollowing(false);
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       setError(error.message || "Failed to load artist data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleFollow = async () => {
//     if (followLoading) return;

//     try {
//       setFollowLoading(true);
//       setIsFollowing(true);

//       const payload = {
//         followed_id: loggedInUserId,
//         following_id: userId,
//         updatedTimestamp: formatTimestamp(),
//       };

//       const response = await fetch(
//         "https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/follow",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         }
//       );

//       if (!response.ok) {
//         throw new Error("Failed to follow the artist");
//       }

//       await fetchData();
//     } catch (err) {
//       console.error("Error following the artist:", err);
//       setIsFollowing(false);
//     } finally {
//       setFollowLoading(false);
//     }
//   };

//   const handleUnfollow = async () => {
//     if (followLoading) return;

//     try {
//       setFollowLoading(true);
//       setIsFollowing(false);

//       const payload = {
//         followed_id: loggedInUserId,
//         following_id: [userId],
//         updatedTimestamp: formatTimestamp(),
//       };

//       const response = await fetch(
//         "https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/unfollow",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         }
//       );

//       if (!response.ok) {
//         throw new Error("Failed to unfollow the artist");
//       }

//       await fetchData();
//     } catch (err) {
//       console.error("Error unfollowing the artist:", err);
//       setIsFollowing(true);
//     } finally {
//       setFollowLoading(false);
//     }
//   };

//   const handleArtistShareClick = async () => {
//     if (!userId) return;

//     setIsGeneratingLink(true);
//     setOpenShareDialog(true);

//     try {
//       const response = await fetch(
//         "https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=AIzaSyDTf6FWaqhLd1sAsy-JmygkH7DkPzol7WY",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             dynamicLinkInfo: {
//               domainUriPrefix: "voiznewapp.page.link",
//               link: `${window.location.origin}/artist/${userId}`,
//               androidInfo: {
//                 androidPackageName: "com.voizapp.voiceapp",
//               },
//               socialMetaTagInfo: {
//                 socialTitle: artistDetails?.FullName || "VOIZ Artist",
//                 socialDescription: "Check out this amazing artist on VOIZ! 🎶",
//                 socialImageLink: artistDetails?.profilePhotoUrl || coverpage,
//               },
//               navigationInfo: {
//                 enableForcedRedirect: true,
//               },
//             },
//             suffix: {
//               option: "SHORT",
//             },
//           }),
//         }
//       );

//       const data = await response.json();
//       if (data.shortLink) {
//         setShareableLink(`${data.shortLink}`);
//       } else {
//         setShareableLink(`${window.location.origin}/artist/${userId}`);
//       }
//     } catch (error) {
//       console.error("Failed to generate artist share link:", error);
//       setShareableLink(`${window.location.origin}/artist/${userId}`);
//     } finally {
//       setIsGeneratingLink(false);
//     }
//   };

//   const handleCopyArtistShare = async () => {
//     if (!shareableLink) return;

//     try {
//       await navigator.clipboard.writeText(shareableLink);
//       setShowCopyAlert(true);
//       setOpenShareDialog(false);
//     } catch (err) {
//       console.error("Failed to copy artist link:", err);
//     }
//   };

//   const handleViewFollow = (tab) => {
//     navigate("/artist/follow", {
//       state: {
//         artist: artistDetails,
//         followersList,
//         followingList,
//         followersCount,
//         followingCount,
//         userId,
//         activeTab: tab,
//       },
//     });
//   };

//   const handleCloseAlert = (event, reason) => {
//     if (reason === "clickaway") return;
//     setShowCopyAlert(false);
//   };

//   // Handle backward navigation with fallback
//   const handleBack = () => {
//     console.log("History length:", window.history.length);
//     console.log("History state:", window.history.state);

//     // Check if there's a previous page in the history stack
//     if (window.history.length > 1 && window.history.state) {
//       navigate(-1); // Go back to the previous page
//     } else {
//       // Fallback to home page or another default route
//       navigate("/homepage", { replace: true });
//     }
//   };

//   const getShareButtonMarginLeft = (name) => {
//     const nameLength = name?.length || 0;
//     console.log(`Calculating marginLeft, Name length: ${nameLength}`);
//     return nameLength > 15 ? "-120px" : "50px";
//   };

//   return (
//     <Box
//       className="artist-page-container"
//       sx={{
//         display: "flex",
//         position: "relative",
//       }}
//     >
//       <SideBar />

//       <Box sx={{ flex: 1, padding: 4, marginTop: "30px !important" }}>
//         <IconButton
//           onClick={handleBack} // Use the new handleBack function
//           sx={{ mb: 2, color: "white", position: "relative", zIndex: 2 }}
//         >
//           <ArrowBackIcon />
//         </IconButton>

//         {loading ? (
//           <Box
//             display="flex"
//             justifyContent="center"
//             alignItems="center"
//             height="200px"
//           >
//             <CircularProgress />
//           </Box>
//         ) : error ? (
//           <Typography variant="h6" color="error">
//             {error}
//           </Typography>
//         ) : (
//           <>
//             <Box
//               display="flex"
//               alignItems="center"
//               gap={4}
//               sx={{ mb: 4, ml: 6, mt: -8, position: "relative", zIndex: 2 }}
//             >
//               <Avatar
//                 src={artistDetails?.profilePhotoUrl || coverpage}
//                 alt={artistDetails?.FullName || "Artist"}
//                 sx={{ width: "194px", height: "194px", borderRadius: "8px" }}
//               />
//               <Box sx={{ mt: -8  }}>
//                 <Box sx={{ display: "flex", alignItems: "center", width: "150%" }}>
//                   <Typography
//                     className="fullName"
//                     variant="h4"
//                     sx={{
//                       color: "#FFFFFF",
//                       mb: 1,
//                       fontWeight: 700,
//                       textAlign: "left",
//                       marginRight: "24px",
//                       flex: "1 1 auto",
//                     }}
//                   >
//                     {artistDetails?.FullName || "Unknown Artist"}
//                   </Typography>
//                   <Box
//                    sx={{
//                     // marginleft: "900px !important"
//                     marginLeft: getShareButtonMarginLeft(artistDetails?.FullName),zIndex: 10,
//                    }}
//                   >
//                     <IoShareSocialOutline
//                       onClick={handleArtistShareClick}
//                       style={{
//                         color: "white",
//                         height: "29px",
//                         width: "30px",
//                       }}
//                     />
//                   </Box>
//                 </Box>
//                 <Typography
//                   variant="body1"
//                   sx={{
//                     color: "#FFFFFF",
//                     mb: 2,
//                     width: "450px",
//                     fontWeight: 700,
//                     fontSize: "18px",
//                   }}
//                 >
//                   {artistDetails?.bio || "No bio available"}
//                 </Typography>
//                 <Box display="flex" gap={2}>
//                   {showFollowButton && (
//                     <Button
//                       variant="contained"
//                       color={isFollowing ? "#2782EE" : "#2782EE"}
//                       sx={{
//                         mb: 2,
//                         width: "102px !important",
//                         height: "33px !important",
//                         color: "#FFFFFF",
//                         fontSize: "15px !important",
//                         fontWeight: 600,
//                       }}
//                       onClick={isFollowing ? handleUnfollow : handleFollow}
//                       disabled={followLoading}
//                     >
//                       {followLoading
//                         ? "Loading..."
//                         : isFollowing
//                         ? "Unfollow"
//                         : "Follow"}
//                     </Button>
//                   )}
//                   <Button
//                     variant="text"
//                     sx={{
//                       color: "white",
//                       mt: -1,
//                       fontWeight: 700,
//                       fontSize: "14px !important",
//                       textTransform: "none",
//                     }}
//                     onClick={() => handleViewFollow(0)}
//                   >
//                     {followersCount} Followers
//                   </Button>
//                   <Button
//                     variant="text"
//                     sx={{
//                       color: "white",
//                       mt: -1,
//                       fontWeight: 700,
//                       fontSize: "14px !important",
//                       textTransform: "none",
//                     }}
//                     onClick={() => handleViewFollow(1)}
//                   >
//                     {followingCount} Following
//                   </Button>
//                 </Box>
//               </Box>
//             </Box>

//             <Box sx={{ mb: 4, position: "relative", zIndex: 2 }}>
//               <Typography
//                 variant="h5"
//                 sx={{
//                   color: "white",
//                   mb: 2,
//                   fontWeight: 700,
//                   fontSize: "32px !important",
//                 }}
//               >
//                 Popular Albums
//               </Typography>
//               {artistDetails?.genres && artistDetails.genres.length > 0 ? (
//                 <Box display="flex" gap={3} flexWrap="wrap">
//                   {[...new Set(artistDetails.genres)].map((genre, index) => (
//                     <Box
//                       key={index}
//                       sx={{
//                         width: "140px",
//                         cursor: "pointer",
//                         position: "relative",
//                       }}
//                       onClick={() =>
//                         navigate("/artist/genre", {
//                           state: { genre, genreUserId: userId },
//                         })
//                       }
//                     >
//                       <Card
//                         sx={{
//                           bgcolor: "#1C2C46",
//                           color: "white",
//                           marginBottom: 1,
//                           position: "relative",
//                           height: "140px",
//                         }}
//                       >
//                         <img
//                           src={genreImages[genre] || OtherImage}
//                           style={{
//                             width: "140px",
//                             height: "140px",
//                             borderRadius: "8px",
//                           }}
//                           alt={genre}
//                         />
//                         <Box className="play-icon-overlay">
//                           <Box className="custom-play-button">
//                             <img
//                               src={play_arrow}
//                               alt="Play"
//                               style={{ width: "52px", height: "52px" }}
//                             />
//                           </Box>
//                         </Box>
//                       </Card>
//                       <Typography
//                         variant="h7"
//                         sx={{
//                           color: "white",
//                           fontWeight: 700,
//                           fontSize: "16px !important",
//                         }}
//                       >
//                         {genre}
//                       </Typography>
//                     </Box>
//                   ))}
//                 </Box>
//               ) : (
//                 <Typography sx={{ color: "gray" }}>
//                   No genres available
//                 </Typography>
//               )}
//             </Box>

//             <Box>
//               <Typography
//                 variant="h5"
//                 sx={{
//                   color: "white",
//                   mb: 2,
//                   fontWeight: 700,
//                   fontSize: "32px !important",
//                 }}
//               >
//                 From {artistDetails?.FullName || "Unknown Artist"}
//               </Typography>
//               {artistDetails?.languages && artistDetails.languages.length > 0 ? (
//                 <Box display="flex" gap={3} flexWrap="wrap">
//                   {[...new Set(artistDetails.languages)].map((language, index) => (
//                     <Box
//                       key={index}
//                       sx={{
//                         width: "140px",
//                         cursor: "pointer",
//                         position: "relative",
//                       }}
//                       onClick={() =>
//                         navigate("/artist/language", {
//                           state: { language, languageUserId: userId },
//                         })
//                       }
//                     >
//                       <Card
//                         sx={{
//                           bgcolor: "#1C2C46",
//                           color: "white",
//                           marginBottom: 1,
//                           position: "relative",
//                           height: "140px",
//                         }}
//                       >
//                         <img
//                           src={languageImages[language] || coverpage}
//                           style={{
//                             width: "140px",
//                             height: "140px",
//                             borderRadius: "8px",
//                           }}
//                           alt={language}
//                         />
//                         <Box className="play-icon-overlay">
//                           <Box className="custom-play-button">
//                             <img
//                               src={play_arrow}
//                               alt="Play"
//                               style={{ width: "52px", height: "52px" }}
//                             />
//                           </Box>
//                         </Box>
//                       </Card>
//                       <Typography
//                         variant="h7"
//                         sx={{
//                           color: "white",
//                           fontWeight: 700,
//                           fontSize: "16px !important",
//                         }}
//                       >
//                         {language}
//                       </Typography>
//                     </Box>
//                   ))}
//                 </Box>
//               ) : (
//                 <Typography sx={{ color: "gray" }}>
//                   No languages available
//                 </Typography>
//               )}
//             </Box>
//           </>
//         )}
//       </Box>

//       <Dialog
//         open={openShareDialog}
//         onClose={() => setOpenShareDialog(false)}
//         PaperProps={{
//           sx: {
//             width: "300px !important",
//             minHeight: "150px",
//             borderRadius: "16px",
//             backgroundColor: "#151415 !important",
//             color: "white",
//             padding: "16px",
//             boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.5)",
//           },
//         }}
//         BackdropProps={{
//           sx: {
//             backgroundColor: "rgba(0, 0, 0, 0.5)",
//           },
//         }}
//       >
//         <DialogTitle
//           sx={{
//             color: "white",
//             textAlign: "center",
//             fontSize: "18px",
//             fontWeight: "500",
//           }}
//         >
//           Share Artist
//         </DialogTitle>

//         <DialogContent sx={{ width: "100%", mt: 1 }}>
//           <TextField
//             fullWidth
//             value={isGeneratingLink ? "Generating share link..." : shareableLink}
//             InputProps={{
//               readOnly: true,
//               sx: {
//                 height: "50px !important",
//                 overflow: "hidden",
//                 whiteSpace: "nowrap",
//                 textOverflow: "ellipsis",
//                 "& .MuiInputBase-input": {
//                   height: "50px !important",
//                   overflow: "hidden !important",
//                   textOverflow: "ellipsis !important",
//                   whiteSpace: "nowrap !important",
//                   padding: "8px 14px !important",
//                 },
//               },
//             }}
//             sx={{
//               backgroundColor: "white",
//               borderRadius: "4px",
//               height: "50.5px !important",
//               width: "240px !important",
//               "& .MuiOutlinedInput-root": {
//                 color: "black",
//               },
//               "& .MuiInputBase-input": {
//                 color: "black",
//               },
//             }}
//           />
//         </DialogContent>

//         <DialogActions sx={{ justifyContent: "center", gap: "16px" }}>
//           <Button
//             onClick={() => setOpenShareDialog(false)}
//             sx={{
//               color: "white",
//               textTransform: "none",
//               fontSize: "16px",
//               "&:hover": {
//                 backgroundColor: "rgba(39, 130, 238, 0.08)",
//               },
//             }}
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={handleCopyArtistShare}
//             sx={{
//               color: "white",
//               textTransform: "none",
//               fontSize: "16px",
//               "&:hover": {
//                 backgroundColor: "rgba(39, 130, 238, 0.08)",
//               },
//             }}
//           >
//             Copy Link
//           </Button>
//         </DialogActions>
//       </Dialog>

//       <Snackbar
//         open={showCopyAlert}
//         autoHideDuration={3000}
//         onClose={handleCloseAlert}
//         anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
//       >
//         <Alert
//           onClose={handleCloseAlert}
//           severity="success"
//           sx={{
//             width: "100%",
//             backgroundColor: "#2644d9 !important",
//             textAlign: "center",
//             color: "white !important",
//             "& .MuiAlert-icon": {
//               color: "white !important",
//               marginRight: 1,
//               marginTop: 1,
//             },
//             "& .MuiAlert-message": {
//               color: "white !important",
//               padding: "8px 0",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//             },
//             "& .MuiAlert-action": {
//               color: "white !important",
//               padding: "8px 0",
//               alignItems: "center",
//             },
//           }}
//         >
//           Link copied to clipboard!
//         </Alert>
//       </Snackbar>
//     </Box>
//   );
// };

// export default ArtistProfilePage;

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  IconButton,
  CircularProgress,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SideBar from "./SideBar";
import coverpage from "./assets/coverpage1.jpeg";
import play_arrow from "./assets/play_arrow.png";
import "./ArtistProfilePage.css";
import { IoShareSocialOutline } from "react-icons/io5";

// Import genre images
import genreImage1 from "./assets/Devotional.jpg";
import genreImage2 from "./assets/Classical.png";
import genreImage3 from "./assets/others.png";
import genreImage4 from "./assets/Pop.png";
import genreImage5 from "./assets/Rock.png";
import genreImage6 from "./assets/Romatic.png";
import genreImage7 from "./assets/rap2.png";
import FolkImage from "./assets/Folk1.png";
import FusionImage from "./assets/fusion.png";
import OtherImage from "./assets/others.png";
import RabindraSangeet from "./assets/rabindra sangeet.png";

// Import language images
import languageImage1 from "./assets/Bengali.png";
import languageImage2 from "./assets/English.png";
import languageImage3 from "./assets/Gujarati.png";
import languageImage4 from "./assets/Hindi.png";
import languageImage5 from "./assets/Malayalam.png";
import languageImage6 from "./assets/Marathi.png";
import PunjabiImage from "./assets/Punjabi.png";
import SanskritImage from "./assets/Sanskrit.png";
import TeluguImage from "./assets/Telugu.png";
import ManipuriImage from "./assets/Manipuri.png";
import KannadaImage from "./assets/Kannada.png";
import KashmiriImage from "./assets/Kashmiri.png";
import KonkaniImage from "./assets/Konkani.png";
import OriyaImage from "./assets/Oriya.png";
import TamilImage from "./assets/Tamil.png";
import UrduImage from "./assets/Urdu.png";
import BhojpuriImage from "./assets/Bhojpuri.png";
import PahariImage from "./assets/Pahari.png";
import RajasthaniImage from "./assets/Rajasthani.png";
import JazzImage from "./assets/jazz.png";
import GhazalImage from "./assets/ghazal.png";
import SufiImage from "./assets/sufi.png";
import AssameseImage from "./assets/Assamese.png";
import { AlignRight } from "lucide-react";

const ArtistProfilePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId: userIdParam } = useParams();
  const [artistDetails, setArtistDetails] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowButton, setShowFollowButton] = useState(false);
  const [openShareDialog, setOpenShareDialog] = useState(false);
  const [shareableLink, setShareableLink] = useState("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const loggedInUserId = localStorage.getItem("user_id");

  // Log userIdParam for debugging
  console.log("userIdParam from useParams:", userIdParam);

  // Use userId from URL params, with fallback to location.state
  const artistFromState = location.state?.artist;
  const userId = userIdParam || (artistFromState?.user_id ? String(artistFromState.user_id) : null);

  console.log("Processed userId:", userId);
  console.log("location.state:", location.state);

  const genreImages = {
    Devotional: genreImage1,
    Classical: genreImage2,
    Kids: genreImage3,
    Pop: genreImage4,
    Rock: genreImage5,
    Romantic: genreImage6,
    Rap: genreImage7,
    Folk: FolkImage,
    Fusion: FusionImage,
    Others: OtherImage,
    "Rabindra Sangeet": RabindraSangeet,
  };

  const languageImages = {
    Bengali: languageImage1,
    English: languageImage2,
    Gujarati: languageImage3,
    Hindi: languageImage4,
    Malayalam: languageImage5,
    Marathi: languageImage6,
    Punjabi: PunjabiImage,
    Sanskrit: SanskritImage,
    Telugu: TeluguImage,
    Manipuri: ManipuriImage,
    Kannada: KannadaImage,
    Kashmiri: KashmiriImage,
    Rajasthani: RajasthaniImage,
    Konkani: KonkaniImage,
    Oriya: OriyaImage,
    Tamil: TamilImage,
    Urdu: UrduImage,
    Bhojpuri: BhojpuriImage,
    Pahari: PahariImage,
    Jazz: JazzImage,
    Ghazal: GhazalImage,
    Sufi: SufiImage,
    Assamese: AssameseImage,
  };

  useEffect(() => {
    if (!userId) {
      setError("Artist ID is missing");
      setLoading(false);
      navigate("/homepage", { replace: true });
      return;
    }
    fetchData();
  }, [userId, loggedInUserId, navigate]);

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

  const filterValidUsers = (users) => {
    return users.filter((user) => user.FullName && user.FullName.trim() !== "");
  };

  const fetchData = async () => {
    if (!userId) {
      setError("Invalid artist ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Fetching artist data for ID:", userId);

      const [
        detailsResponse,
        followersCountResponse,
        followingCountResponse,
        followersListResponse,
        followingListResponse,
        followStatusResponse,
      ] = await Promise.allSettled([
        fetch(
          `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/artist/details?user_id=${userId}`
        ),
        fetch(
          `https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/followers/count?user_id=${userId}`
        ),
        fetch(
          `https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/following/count?user_id=${userId}`
        ),
        fetch(
          `https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/followers/List?user_id=${userId}`
        ),
        fetch(
          `https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/following/List?user_id=${userId}`
        ),
        fetch(
          `https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/checkFollow?user_id=${loggedInUserId}&artistId=${userId}`
        ),
      ]);

      if (detailsResponse.status === "fulfilled" && detailsResponse.value.ok) {
        const detailsData = await detailsResponse.value.json();
        console.log("Artist details:", detailsData);
        setArtistDetails(detailsData);
        const isNotSameUser = loggedInUserId !== userId;
        setShowFollowButton(isNotSameUser);
      } else {
        throw new Error("Failed to fetch artist details");
      }

      if (
        followersCountResponse.status === "fulfilled" &&
        followersCountResponse.value.ok
      ) {
        const followersData = await followersCountResponse.value.json();
        setFollowersCount(followersData.count || 0);
      }

      if (
        followingCountResponse.status === "fulfilled" &&
        followingCountResponse.value.ok
      ) {
        const followingData = await followingCountResponse.value.json();
        setFollowingCount(followingData.count || 0);
      }

      if (
        followersListResponse.status === "fulfilled" &&
        followersListResponse.value.ok
      ) {
        const contentType =
          followersListResponse.value.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            const followersData = await followersListResponse.value.json();
            const followers = Array.isArray(followersData)
              ? followersData
              : followersData.followDetails || followersData.followers || [];
            const validFollowers = filterValidUsers(followers);
            setFollowersList(validFollowers);
            setFollowersCount(validFollowers.length);
          } catch (error) {
            console.log("No followers data available");
            setFollowersList([]);
          }
        } else {
          const textResponse = await followersListResponse.value.text();
          console.log("Followers text response:", textResponse);
          setFollowersList([]);
        }
      }

      if (
        followingListResponse.status === "fulfilled" &&
        followingListResponse.value.ok
      ) {
        const contentType =
          followingListResponse.value.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            const followingData = await followingListResponse.value.json();
            const validFollowing = filterValidUsers(
              followingData.followDetails || []
            );
            setFollowingList(validFollowing);
            setFollowingCount(validFollowing.length);
          } catch (error) {
            console.log("No following data available");
            setFollowingList([]);
          }
        } else {
          const textResponse = await followingListResponse.value.text();
          console.log("Following text response:", textResponse);
          setFollowingList([]);
        }
      }

      if (
        followStatusResponse.status === "fulfilled" &&
        followStatusResponse.value.ok
      ) {
        try {
          const statusData = await followStatusResponse.value.json();
          setIsFollowing(statusData.follows);
        } catch (error) {
          console.log("Follow status not available");
          setIsFollowing(false);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message || "Failed to load artist data");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (followLoading) return;

    try {
      setFollowLoading(true);
      setIsFollowing(true);

      const payload = {
        followed_id: loggedInUserId,
        following_id: userId,
        updatedTimestamp: formatTimestamp(),
      };

      const response = await fetch(
        "https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/follow",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to follow the artist");
      }

      await fetchData();
    } catch (err) {
      console.error("Error following the artist:", err);
      setIsFollowing(false);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (followLoading) return;

    try {
      setFollowLoading(true);
      setIsFollowing(false);

      const payload = {
        followed_id: loggedInUserId,
        following_id: [userId],
        updatedTimestamp: formatTimestamp(),
      };

      const response = await fetch(
        "https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/unfollow",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to unfollow the artist");
      }

      await fetchData();
    } catch (err) {
      console.error("Error unfollowing the artist:", err);
      setIsFollowing(true);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleArtistShareClick = async () => {
    if (!userId) return;

    setIsGeneratingLink(true);
    setOpenShareDialog(true);

    try {
      const response = await fetch(
        "https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=AIzaSyDTf6FWaqhLd1sAsy-JmygkH7DkPzol7WY",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dynamicLinkInfo: {
              domainUriPrefix: "voiznewapp.page.link",
              link: `${window.location.origin}/artist/${userId}`,
              androidInfo: {
                androidPackageName: "com.voizapp.voiceapp",
              },
              socialMetaTagInfo: {
                socialTitle: artistDetails?.FullName || "VOIZ Artist",
                socialDescription: "Check out this amazing artist on VOIZ! 🎶",
                socialImageLink: artistDetails?.profilePhotoUrl || coverpage,
              },
              navigationInfo: {
                enableForcedRedirect: true,
              },
            },
            suffix: {
              option: "SHORT",
            },
          }),
        }
      );

      const data = await response.json();
      if (data.shortLink) {
        setShareableLink(`${data.shortLink}`);
      } else {
        setShareableLink(`${window.location.origin}/artist/${userId}`);
      }
    } catch (error) {
      console.error("Failed to generate artist share link:", error);
      setShareableLink(`${window.location.origin}/artist/${userId}`);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyArtistShare = async () => {
    if (!shareableLink) return;

    try {
      await navigator.clipboard.writeText(shareableLink);
      setShowCopyAlert(true);
      setOpenShareDialog(false);
    } catch (err) {
      console.error("Failed to copy artist link:", err);
    }
  };

  const handleViewFollow = (tab) => {
    navigate(`/artist/follow/${userId}`, {
      state: {
        artist: artistDetails,
        followersList,
        followingList,
        followersCount,
        followingCount,
        userId,
        activeTab: tab,
      },
    });
  };

  const handleCloseAlert = (event, reason) => {
    if (reason === "clickaway") return;
    setShowCopyAlert(false);
  };

  // Handle backward navigation with fallback
  const handleBack = () => {
    console.log("History length:", window.history.length);
    console.log("History state:", window.history.state);

    // Check if there's a previous page in the history stack
    if (window.history.length > 1 && window.history.state) {
      navigate(-1); // Go back to the previous page
    } else {
      // Fallback to home page or another default route
      navigate("/homepage", { replace: true });
    }
  };

  return (
    <Box
      className="artist-page-container"
      sx={{
        display: "flex",
        position: "relative",
      }}
    >
      <SideBar />

      <Box sx={{ flex: 1, padding: 4, marginTop: "30px !important" }}>
        <IconButton
          onClick={handleBack}
          sx={{ mb: 2, color: "white", position: "relative", zIndex: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>

        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="200px"
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography variant="h6" color="error">
            {error}
          </Typography>
        ) : (
          <>
            <Box
              display="flex"
              alignItems="center"
              gap={4}
              sx={{ mb: 4, ml: 6, mt: -8, position: "relative", zIndex: 2 }}
            >
              <Avatar
                src={artistDetails?.profilePhotoUrl || coverpage}
                alt={artistDetails?.FullName || "Artist"}
                sx={{ width: "194px", height: "194px", borderRadius: "8px" }}
              />
              <Box sx={{ mt: -8 }}>
                <Box sx={{ display: "flex", alignItems: "center", width: "150%" }}>
                  <Typography
                    className="fullName"
                    variant="h4"
                    sx={{
                      color: "#FFFFFF",
                      mb: 1,
                      fontWeight: 700,
                      textAlign: "left",
                      marginRight: "24px",
                      flex: "1 1 auto",
                    }}
                  >
                    {artistDetails?.FullName || "Unknown Artist"}
                  </Typography>
                  <Box
                    sx={{
                      marginLeft: "10px",
                      position: "relative",
                      zIndex: 10,
                    }}
                  >
                    <IoShareSocialOutline
                      onClick={handleArtistShareClick}
                      style={{
                        color: "white",
                        height: "29px",
                        width: "30px",
                        cursor: "pointer",
                      }}
                    />
                  </Box>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    color: "#FFFFFF",
                    mb: 2,
                    width: "450px",
                    fontWeight: 700,
                    fontSize: "18px",
                  }}
                >
                  {artistDetails?.bio || "No bio available"}
                </Typography>
                <Box display="flex" gap={2}>
                  {showFollowButton && (
                    <Button
                      variant="contained"
                      sx={{
                        mb: 2,
                        width: "102px !important",
                        height: "33px !important",
                        color: "#FFFFFF",
                        fontSize: "15px !important",
                        fontWeight: 600,
                        backgroundColor: "#2782EE",
                        "&:hover": {
                          backgroundColor: "#1a6cd8",
                        },
                      }}
                      onClick={isFollowing ? handleUnfollow : handleFollow}
                      disabled={followLoading}
                    >
                      {followLoading
                        ? "Loading..."
                        : isFollowing
                        ? "Unfollow"
                        : "Follow"}
                    </Button>
                  )}
                  <Button
                    variant="text"
                    sx={{
                      color: "white",
                      mt: -1,
                      fontWeight: 700,
                      fontSize: "14px !important",
                      textTransform: "none",
                    }}
                    onClick={() => handleViewFollow(0)}
                  >
                    {followersCount} Followers
                  </Button>
                  <Button
                    variant="text"
                    sx={{
                      color: "white",
                      mt: -1,
                      fontWeight: 700,
                      fontSize: "14px !important",
                      textTransform: "none",
                    }}
                    onClick={() => handleViewFollow(1)}
                  >
                    {followingCount} Following
                  </Button>
                </Box>
              </Box>
            </Box>

            <Box sx={{ mb: 4, position: "relative", zIndex: 2 }}>
              <Typography
                variant="h5"
                sx={{
                  color: "white",
                  mb: 2,
                  fontWeight: 700,
                  fontSize: "32px !important",
                }}
              >
                Popular Albums
              </Typography>
              {artistDetails?.genres && artistDetails.genres.length > 0 ? (
                <Box display="flex" gap={3} flexWrap="wrap">
                  {[...new Set(artistDetails.genres)].map((genre, index) => (
                    <Box
                      key={index}
                      sx={{
                        width: "140px",
                        cursor: "pointer",
                        position: "relative",
                      }}
                      onClick={() =>
                        navigate("/artist/genre", {
                          state: { genre, genreUserId: userId },
                        })
                      }
                    >
                      <Card
                        sx={{
                          bgcolor: "#1C2C46",
                          color: "white",
                          marginBottom: 1,
                          position: "relative",
                          height: "140px",
                        }}
                      >
                        <img
                          src={genreImages[genre] || OtherImage}
                          style={{
                            width: "140px",
                            height: "140px",
                            borderRadius: "8px",
                          }}
                          alt={genre}
                        />
                        <Box className="play-icon-overlay">
                          <Box className="custom-play-button">
                            <img
                              src={play_arrow}
                              alt="Play"
                              style={{ width: "52px", height: "52px" }}
                            />
                          </Box>
                        </Box>
                      </Card>
                      <Typography
                        variant="h7"
                        sx={{
                          color: "white",
                          fontWeight: 700,
                          fontSize: "16px !important",
                        }}
                      >
                        {genre}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography sx={{ color: "gray" }}>
                  No genres available
                </Typography>
              )}
            </Box>

            <Box>
              <Typography
                variant="h5"
                sx={{
                  color: "white",
                  mb: 2,
                  fontWeight: 700,
                  fontSize: "32px !important",
                }}
              >
                From {artistDetails?.FullName || "Unknown Artist"}
              </Typography>
              {artistDetails?.languages && artistDetails.languages.length > 0 ? (
                <Box display="flex" gap={3} flexWrap="wrap">
                  {[...new Set(artistDetails.languages)].map((language, index) => (
                    <Box
                      key={index}
                      sx={{
                        width: "140px",
                        cursor: "pointer",
                        position: "relative",
                      }}
                      onClick={() =>
                        navigate("/artist/language", {
                          state: { language, languageUserId: userId },
                        })
                      }
                    >
                      <Card
                        sx={{
                          bgcolor: "#1C2C46",
                          color: "white",
                          marginBottom: 1,
                          position: "relative",
                          height: "140px",
                        }}
                      >
                        <img
                          src={languageImages[language] || coverpage}
                          style={{
                            width: "140px",
                            height: "140px",
                            borderRadius: "8px",
                          }}
                          alt={language}
                        />
                        <Box className="play-icon-overlay">
                          <Box className="custom-play-button">
                            <img
                              src={play_arrow}
                              alt="Play"
                              style={{ width: "52px", height: "52px" }}
                            />
                          </Box>
                        </Box>
                      </Card>
                      <Typography
                        variant="h7"
                        sx={{
                          color: "white",
                          fontWeight: 700,
                          fontSize: "16px !important",
                        }}
                      >
                        {language}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography sx={{ color: "gray" }}>
                  No languages available
                </Typography>
              )}
            </Box>
          </>
        )}
      </Box>

      <Dialog
        open={openShareDialog}
        onClose={() => setOpenShareDialog(false)}
        PaperProps={{
          sx: {
            width: "300px !important",
            minHeight: "150px",
            borderRadius: "16px",
            backgroundColor: "#151415 !important",
            color: "white",
            padding: "16px",
            boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.5)",
          },
        }}
        BackdropProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "white",
            textAlign: "center",
            fontSize: "18px",
            fontWeight: "500",
          }}
        >
          Share Artist
        </DialogTitle>

        <DialogContent sx={{ width: "100%", mt: 1 }}>
          <TextField
            fullWidth
            value={isGeneratingLink ? "Generating share link..." : shareableLink}
            InputProps={{
              readOnly: true,
              sx: {
                height: "50px !important",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                "& .MuiInputBase-input": {
                  height: "50px !important",
                  overflow: "hidden !important",
                  textOverflow: "ellipsis !important",
                  whiteSpace: "nowrap !important",
                  padding: "8px 14px !important",
                },
              },
            }}
            sx={{
              backgroundColor: "white",
              borderRadius: "4px",
              height: "50.5px !important",
              width: "240px !important",
              "& .MuiOutlinedInput-root": {
                color: "black",
              },
              "& .MuiInputBase-input": {
                color: "black",
              },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", gap: "16px" }}>
          <Button
            onClick={() => setOpenShareDialog(false)}
            sx={{
              color: "white",
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
            onClick={handleCopyArtistShare}
            sx={{
              color: "white",
              textTransform: "none",
              fontSize: "16px",
              "&:hover": {
                backgroundColor: "rgba(39, 130, 238, 0.08)",
              },
            }}
          >
            Copy Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* <Snackbar
        open={showCopyAlert}
        autoHideDuration={3000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity="success"
          sx={{
            width: "100%",
            backgroundColor: "#2644d9 !important",
            textAlign: "center",
            color: "white !important",
            "& .MuiAlert-icon": {
              color: "white !important",
              marginRight: 1,
              marginTop: 1,
            },
            "& .MuiAlert-message": {
              color: "white !important",
              padding: "8px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            },
            "& .MuiAlert-action": {
              color: "white !important",
              padding: "8px 0",
              alignItems: "center",
            },
          }}
        >
          Link copied to clipboard!
        </Alert>
      </Snackbar> */}
    </Box>
  );
};

export default ArtistProfilePage;