// import React, { useState, useEffect } from "react";
// import {
//   Box,
//   Typography,
//   Avatar,
//   Button,
//   IconButton,
//   Tabs,
//   Tab,
//   CircularProgress,
//   Card,
// } from "@mui/material";
// import { useLocation, useNavigate } from "react-router-dom";
// import ArrowBackIcon from "@mui/icons-material/ArrowBack";
// import SideBar from "./SideBar";
// import coverpage from "./assets/coverpage1.jpeg";
// import play_arrow from "./assets/play_arrow.png";
// // import './HomePage.css';
// import "./ArtistProfilePage.css";
// import bgSong from "./assets/bgSong.jpeg";

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
// import { IoShareSocialOutline } from "react-icons/io5";

// {
//   /* <IoShareSocialOutline size={16} /> */
// }

// const Follow = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const artist = location.state?.artist || {};
//   const [artistDetails, setArtistDetails] = useState(null);
//   const [followersCount, setFollowersCount] = useState(0);
//   const [followingCount, setFollowingCount] = useState(0);
//   const [followersList, setFollowersList] = useState([]);
//   const [followingList, setFollowingList] = useState([]);
//   const [isFollowing, setIsFollowing] = useState(false);
//   const [showTabs, setShowTabs] = useState(false);
//   const [activeTab, setActiveTab] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [followLoading, setFollowLoading] = useState(false);
//   const loggedInUserId = localStorage.getItem("user_id");

//   const [showFollowButton, setShowFollowButton] = useState(false);

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

//   // Handle different formats of user_id from different sources
//   const userId =
//     typeof artist.user_id === "object"
//       ? artist.user_id?.S || artist.user_id
//       : artist.user_id?.toString();

//   console.log("Artist Data:", artist);
//   console.log("Processed User ID:", userId);

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

//   // Modified function to filter out followers with empty names
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

//       // Process details
//       if (detailsResponse.status === "fulfilled" && detailsResponse.value.ok) {
//         const detailsData = await detailsResponse.value.json();
//         console.log("Artist details:", detailsData);
//         setArtistDetails(detailsData);

//         // Add this line after setArtistDetails
//         const isNotSameUser = loggedInUserId !== userId;
//         setShowFollowButton(isNotSameUser);
//       }

//       // Process followers count
//       if (
//         followersCountResponse.status === "fulfilled" &&
//         followersCountResponse.value.ok
//       ) {
//         const followersData = await followersCountResponse.value.json();
//         setFollowersCount(followersData.count || 0);
//       }

//       // Process following count
//       if (
//         followingCountResponse.status === "fulfilled" &&
//         followingCountResponse.value.ok
//       ) {
//         const followingData = await followingCountResponse.value.json();
//         setFollowingCount(followingData.count || 0);
//       }

//       // Process followers list with text response handling
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
//             const validFollowers = followers.filter(
//               (follower) => follower.FullName && follower.FullName.trim() !== ""
//             );
//             //setFollowersList(followers);
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

//       // Process following list with text response handling
//       if (
//         followingListResponse.status === "fulfilled" &&
//         followingListResponse.value.ok
//       ) {
//         const contentType =
//           followingListResponse.value.headers.get("content-type");
//         if (contentType && contentType.includes("application/json")) {
//           try {
//             const followingData = await followingListResponse.value.json();
//             const validFollowing = (followingData.followDetails || []).filter(
//               (following) =>
//                 following.FullName && following.FullName.trim() !== ""
//             );
//             //setFollowingList(followingData.followDetails || []);
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

//       // Process follow status
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

//   useEffect(() => {
//     if (!userId) {
//       setError("Artist ID is missing");
//       setLoading(false);
//       return;
//     }

//     fetchData();
//   }, [userId, loggedInUserId]);

//   const handleFollow = async () => {
//     if (followLoading) return;

//     try {
//       setFollowLoading(true);
//       setIsFollowing(true); // Optimistic update

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

//       await fetchData(); // Refresh all data
//     } catch (err) {
//       console.error("Error following the artist:", err);
//       setIsFollowing(false); // Revert optimistic update
//     } finally {
//       setFollowLoading(false);
//     }
//   };

//   const handleUnfollow = async () => {
//     if (followLoading) return;

//     try {
//       setFollowLoading(true);
//       setIsFollowing(false); // Optimistic update

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

//       await fetchData(); // Refresh all data
//     } catch (err) {
//       console.error("Error unfollowing the artist:", err);
//       setIsFollowing(true); // Revert optimistic update
//     } finally {
//       setFollowLoading(false);
//     }
//   };

//   const handleTabChange = (event, newValue) => {
//     setActiveTab(newValue);
//   };

//   return (
//     <Box
//       className="artist-page-container"
//       sx={{
//         display: "flex",
//         position: "relative",
//         ...(showTabs && {
//           "&::before": {
//             content: '""',
//             position: "fixed",
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: 0,
//             //   backgroundImage: `
//             //   linear-gradient(to left, #4E899E63 39%, #4E899E 100%),
//             //   url(${bgSong})
//             // `,
//             backgroundSize: "cover",
//             backgroundPosition: "center",
//             backgroundRepeat: "no-repeat",
//             filter: "blur(8px)",
//             zIndex: 0,
//           },
//           "&::after": {
//             content: '""',
//             position: "fixed",
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: 0,
//             backdropFilter: "blur(8px)",
//             zIndex: 1,
//           },
//         }),
//       }}
//     >
//       <SideBar />

//       <Box sx={{ flex: 1, padding: 4, marginTop: "30px !important" }}>
//         <IconButton
//           onClick={() => navigate(-1)}
//           sx={{ mb: 2, color: "white", position: "relative", zIndex: 2 }}
//         >
//           {/* <ArrowBackIcon /> */}
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
//                 src={artist.profilePhotoUrl || coverpage}
//                 alt={artistDetails?.FullName || "Artist"}
//                 sx={{ width: "194px", height: "194px", borderRadius: "8px" }}
//               />
//               <Box sx={{ mt: -8 }}>
//                 <Box
//                   sx={{ display: "flex", alignItems: "center", width: "220%" }}
//                 >
//                   <Typography
//                     className="fullName"
//                     variant="h4"
//                     sx={{
//                       color: "#FFFFFF",
//                       mb: 1,
//                       fontWeight: 700,
//                       textAlign: "left",
//                       marginRight: "24px", // Fixed spacing between name and icon
//                       flex: "1 1 auto", // Allow text to take available space
//                     }}
//                   >
//                     {artist.FullName}
//                   </Typography>
//                   {showTabs && ( // Only show the icon when showTabs is true
//                     <Box>
//                       <IoShareSocialOutline
//                         style={{
//                           color: "white",
//                           height: "29px",
//                           width: "30px",
//                         }}
//                       />
//                     </Box>
//                   )}
//                 </Box>
//                 {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
//                 <Typography className='fullName' variant="h4" sx={{ color: '#FFFFFF', mb: 1, fontWeight:700, textAlign:'left'}}>
//                     {artist.FullName}
//                 </Typography>
//                 <IoShareSocialOutline style={{color:'white', height:"29px", width:"30px"}} />
//               </Box> */}
//                 {/* <Typography className='fullName' variant="h4" sx={{ color: '#FFFFFF', mb: 1,fontWeight:700,textAlign:'left'}}>
//                   {artist.FullName}
//                 </Typography> */}
//                 <Typography
//                   variant="body1"
//                   sx={{
//                     color: "#FFFFFF",
//                     mb: 2,
//                     fontWeight: 700,
//                     fontSize: "18px",
//                   }}
//                 >
//                   {artistDetails?.bio || "No bio available"}
//                 </Typography>
//                 {/* <Button
//                   variant="contained"
//                   color={isFollowing ? 'secondary' : 'primary'}
//                   sx={{ mb: 2 }}
//                   onClick={isFollowing ? handleUnfollow : handleFollow}
//                   disabled={followLoading}
//                 >
//                   {followLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
//                 </Button> */}
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
//                         "& .MuiButtonBase-root": {
//                           fontSize: "15px !important",
//                           fontWeight: 600,
//                         },
//                         "& .MuiButton-root": {
//                           fontSize: "15px !important",
//                           fontWeight: 600,
//                         },
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
//                   {/* <Button
//                   variant="contained"
//                   color={isFollowing ? '#2782EE' : '#2782EE'}
//                   sx={{ 
//                     mb: 2,
//                     width: "102px !important",
//                     height: "33px !important",
//                     color:"#FFFFFF",
//                     fontSize: "15px !important",
//                     fontWeight: 600,
//                     '& .MuiButtonBase-root': {
//                       fontSize: "15px !important",
//                       fontWeight: 600
//                     },
//                     '& .MuiButton-root': {
//                       fontSize: "15px !important",
//                       fontWeight: 600
//                     }
//                   }}
//                   onClick={isFollowing ? handleUnfollow : handleFollow}
//                   disabled={followLoading}
//                 >
//                   {followLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
//                 </Button> */}
//                   <Button
//                     variant="text"
//                     sx={{
//                       color: "white",
//                       mt: -1,
//                       fontWeight: 700,
//                       fontSize: "14px !important",
//                       textTransform: "none",
//                     }}
//                     onClick={() => {
//                       setShowTabs(true);
//                       setActiveTab(0);
//                     }}
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
//                     onClick={() => {
//                       setShowTabs(true);
//                       setActiveTab(1);
//                     }}
//                   >
//                     {followingCount} Following
//                   </Button>
//                 </Box>
//               </Box>
//             </Box>

//             {(
//               <>
//                 <Tabs
//                   value={activeTab}
//                   onChange={handleTabChange}
//                   textColor="primary"
//                   indicatorColor="primary"
//                   sx={{
//                     mb: 4,
//                     ml: 25,
//                     position: "relative",
//                     zIndex: 2,
//                     "& .MuiTabs-indicator": {
//                       backgroundColor: "white !important",
//                       // width:'200px !important',
//                     },
//                   }}
//                 >
//                   <Tab
//                     className="followersListName"
//                     label={`${followersList.length} Followers `}
//                   />
//                   <Tab
//                     className="followersListName2"
//                     label={`${followingList.length} Following `}
//                   />
//                 </Tabs>

//                 {activeTab === 0 && (
//                   <Box
//                     sx={{
//                       ml: 29,
//                       position: "relative",
//                       zIndex: 2,
//                     }}
//                   >
//                     {followersList?.length > 0 ? (
//                       followersList.map((follower, index) => (
//                         <Box
//                           key={index}
//                           display="flex"
//                           alignItems="center"
//                           gap={2}
//                           sx={{ mb: 4 }}
//                         >
//                           <Avatar
//                             className="profilePhotoUrl"
//                             src={follower.profilePhotoUrl}
//                           />
//                           <Box>
//                             <Typography
//                               className="follower-FullName"
//                               sx={{ color: "#FFFFFF" }}
//                             >
//                               {follower.FullName || "Unknown User"}
//                             </Typography>
//                             <Typography sx={{ color: "gray" }}>
//                               {follower.Category || "No Category"}
//                             </Typography>
//                           </Box>
//                         </Box>
//                       ))
//                     ) : (
//                       <Typography sx={{ color: "gray" }}>
//                         No followers found
//                       </Typography>
//                     )}
//                   </Box>
//                 )}

//                 {activeTab === 1 && (
//                   <Box sx={{ ml: 59, position: "relative", zIndex: 2 }}>
//                     {followingList.length > 0 ? (
//                       followingList.map((following, index) => (
//                         <Box
//                           key={index}
//                           display="flex"
//                           alignItems="center"
//                           gap={2}
//                           sx={{ mb: 4 }}
//                         >
//                           <Avatar
//                             className="profilePhotoUrl"
//                             src={following.profilePhotoUrl}
//                           />
//                           <Box>
//                             <Typography
//                               className="follower-FullName"
//                               sx={{ color: "white" }}
//                             >
//                               {following.FullName}
//                             </Typography>
//                             <Typography sx={{ color: "gray" }}>
//                               {following.Category}
//                             </Typography>
//                           </Box>
//                         </Box>
//                       ))
//                     ) : (
//                       <Typography sx={{ color: "gray" }}>
//                         No following found
//                       </Typography>
//                     )}
//                   </Box>
//                 )}
//               </>
//             )}
//           </>
//         )}
//       </Box>
//     </Box>
//   );
// };

// export default Follow;

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Card,
} from "@mui/material";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SideBar from "./SideBar";
import coverpage from "./assets/coverpage1.jpeg";
import play_arrow from "./assets/play_arrow.png";
import "./ArtistProfilePage.css";
import bgSong from "./assets/bgSong.jpeg";

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
import { IoShareSocialOutline } from "react-icons/io5";

const Follow = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const artist = location.state?.artist || {};
  const [artistDetails, setArtistDetails] = useState(null);
  const [followersCount, setFollowersCount] = useState(location.state?.followersCount || 0);
  const [followingCount, setFollowingCount] = useState(location.state?.followingCount || 0);
  const [followersList, setFollowersList] = useState(location.state?.followersList || []);
  const [followingList, setFollowingList] = useState(location.state?.followingList || []);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);
  const loggedInUserId = localStorage.getItem("user_id");
  const [showFollowButton, setShowFollowButton] = useState(false);

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
        setArtistDetails(detailsData);
        const isNotSameUser = loggedInUserId !== userId;
        setShowFollowButton(isNotSameUser);
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
            console.log("No followers data available:", error);
            setFollowersList([]);
          }
        } else {
          console.log("Followers text response:", await followersListResponse.value.text());
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
            const validFollowing = filterValidUsers(followingData.followDetails || []);
            setFollowingList(validFollowing);
            setFollowingCount(validFollowing.length);
          } catch (error) {
            console.log("No following data available:", error);
            setFollowingList([]);
          }
        } else {
          console.log("Following text response:", await followingListResponse.value.text());
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
          console.log("Follow status not available:", error);
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

  useEffect(() => {
    if (!userId) {
      setError("Artist ID is missing");
      setLoading(false);
      navigate("/homepage");
      return;
    }

    if (
      location.state?.followersList &&
      location.state?.followingList &&
      location.state?.followersCount !== undefined &&
      location.state?.followingCount !== undefined
    ) {
      setFollowersList(location.state.followersList);
      setFollowingList(location.state.followingList);
      setFollowersCount(location.state.followersCount);
      setFollowingCount(location.state.followingCount);
      setActiveTab(location.state.activeTab || 0);
      setLoading(false);
    } else {
      fetchData();
    }
  }, [userId, location.state, navigate]);

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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box
      className="artist-page-container"
      sx={{
        display: "flex",
        position: "relative",
        "&::before": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "blur(8px)",
          zIndex: 0,
        },
        "&::after": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backdropFilter: "blur(8px)",
          zIndex: 1,
        },
      }}
    >
      <SideBar />

      <Box sx={{ flex: 1, padding: 4, marginTop: "30px !important" }}>
        <IconButton
          onClick={() => navigate(-1)}
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
                src={artist.profilePhotoUrl || coverpage}
                alt={artistDetails?.FullName || "Artist"}
                sx={{ width: "194px", height: "194px", borderRadius: "8px" }}
              />
              <Box sx={{ mt: -8 }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", width: "220%" }}
                >
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
                    {artist.FullName}
                  </Typography>
                  <Box>
                    <IoShareSocialOutline
                      style={{
                        color: "white",
                        height: "29px",
                        width: "30px",
                      }}
                    />
                  </Box>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    color: "#FFFFFF",
                    mb: 2,
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
                      color={isFollowing ? "#2782EE" : "#2782EE"}
                      sx={{
                        mb: 2,
                        width: "102px !important",
                        height: "33px !important",
                        color: "#FFFFFF",
                        fontSize: "15px !important",
                        fontWeight: 600,
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
                    onClick={() => setActiveTab(0)}
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
                    onClick={() => setActiveTab(1)}
                  >
                    {followingCount} Following
                  </Button>
                </Box>
              </Box>
            </Box>

            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              textColor="primary"
              indicatorColor="primary"
              sx={{
                mb: 4,
                ml: 25,
                position: "relative",
                zIndex: 2,
                "& .MuiTabs-indicator": {
                  backgroundColor: "white !important",
                },
              }}
            >
              <Tab
                className="followersListName"
                label={`${followersCount} Followers`}
              />
              <Tab
                className="followersListName2"
                label={`${followingCount} Following`}
              />
            </Tabs>

            {activeTab === 0 && (
              <Box
                sx={{
                  ml: 29,
                  position: "relative",
                  zIndex: 2,
                }}
              >
                {followersList?.length > 0 ? (
                  followersList.map((follower, index) => (
                    <Box
                      key={index}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      sx={{ mb: 4 }}
                    >
                      <Avatar
                        className="profilePhotoUrl"
                        src={follower.profilePhotoUrl}
                      />
                      <Box>
                        <Typography
                          className="follower-FullName"
                          sx={{ color: "#FFFFFF" }}
                        >
                          {follower.FullName || "Unknown User"}
                        </Typography>
                        <Typography sx={{ color: "gray" }}>
                          {follower.Category || "No Category"}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography sx={{ color: "gray" }}>
                    No followers found
                  </Typography>
                )}
              </Box>
            )}

            {activeTab === 1 && (
              <Box sx={{ ml: 59, position: "relative", zIndex: 2 }}>
                {followingList.length > 0 ? (
                  followingList.map((following, index) => (
                    <Box
                      key={index}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      sx={{ mb: 4 }}
                    >
                      <Avatar
                        className="profilePhotoUrl"
                        src={following.profilePhotoUrl }
                      />
                      <Box>
                        <Typography
                          className="follower-FullName"
                          sx={{ color: "white" }}
                        >
                          {following.FullName || "Unknown User"}
                        </Typography>
                        <Typography sx={{ color: "gray" }}>
                          {following.Category || "No Category"}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography sx={{ color: "gray" }}>
                    No following found
                  </Typography>
                )}
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default Follow;