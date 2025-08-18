import "./App.css";
import React, { useEffect, useState } from "react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  Navigate,
  Outlet,
  useNavigate, // Add this import
} from "react-router-dom";
import { PlayerProvider, usePlayer } from "./PlayerContext";
import { CommentsProvider } from "./CommentsContext";
import awsExports from "./aws-exports";
import { CircularProgress, Box } from "@mui/material";
import MetaPixel from "./meta/MetaPixel";
import Reports from "./Reports";
// Component imports
import HomePage from "./HomePage";
import LandingPage from "./LandingPage";
import SignUp from "./SignUp";
import UserDetails from "./UserDetails";
import LoginPage from "./LoginPage";
import SingleSong from "./SingleSong";
import AddSongPage from "./AddSongPage";
import AddMultipleSong from "./AddMultipleSong";
import SongBasket from "./SongBasket";
import UploadEssentials from "./UploadEssentials";
import UploadCheck from "./UploadCheck";
import SplashScreen from "./SplashScreen";
import SideBar from "./SideBar";
import YourUploads from "./YourUploads";
import UploadAlbumSong from "./UploadAlbumSong";
import Explore from "./Explore";
import MiniPlayer from "./MiniPlayer";
import Adminpage from "./Adminpage";
import Adminsongdetails from "./Adminsongdetails";
import ApprovalPage from "./ApprovalPage";
import AlbumAdminPage from "./AlbumAdminPage";
import SongDetailsBar from "./SongDetailsBar";
import SongList from "./SongList";
import TermsAndConditions from "./documents/TermsAndConditions";
import Top10Songs from "./Top10Songs";
import TechnicalSpecification from "./documents/TechnicalSpecification";
import CodeOfConduct from "./documents/CodeOfConduct";
import CookiesPolicy from "./documents/CookiesPolicy";
import PrivacyPolicy from "./documents/PrivacyPolicy";
import TermsOfService from "./documents/TermsOfService";
import TakeDownPolicy from "./documents/TakeDownPolicy";
import ArtistProfilePage from "./ArtistProfilePage";
import ContactSupport from "./ContactSupport";
import Feedback from "./Feedback";
import Profile from "./Profile";
import AccountSettings from "./AccountSettings";
import EditProfile from "./EditProfile";
import DeleteAccountPage from "./DeleteAccountPage";
import PlayLists from "./PlayLists";

import SharedLinkHandler from "./SharedLinkHandler";
import Follow from "./Follow";
import AlbumSingleSongAdd from "./AlbumSingleSongAdd";

// Configure Amplify
Amplify.configure(awsExports);

// Protected Route Component with enhanced protection
const ProtectedRoute = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = localStorage.getItem("user_id");
  const navigate = useNavigate();

  useEffect(() => {
    const checkMandateAndRedirect = async () => {
      // Handle shared resources - if it's a shared playlist or song link, save it before redirect
      if (!isAuthenticated) {
        // Save the path for post-login redirect
        console.log("Saving path:", location.pathname);
        sessionStorage.setItem("intendedPath", location.pathname);

        // If it's a shared playlist link, save the playlist info
        if (location.pathname.includes("/playlist/")) {
          const playlistId = location.pathname.split("/").pop();
          const urlParams = new URLSearchParams(location.search);
          const sharedPlaylistName = urlParams.get("name");

          if (sharedPlaylistName) {
            sessionStorage.setItem(
              "shared_playlist_info",
              JSON.stringify({
                id: playlistId,
                name: sharedPlaylistName,
                timestamp: Date.now(),
              })
            );
          }
        }
        // If it's a shared song link, save the song ID
        else if (location.pathname.includes("/song/")) {
          const songId = location.pathname.split("/").pop();
          localStorage.setItem("sharedSongId", songId);
        }

        setIsLoading(false);
        return;
      }

      try {
        // Check mandate status
        const userId = localStorage.getItem("user_id");
        const mandateResponse = await fetch(
          `https://i3lmfmc1h2.execute-api.ap-south-1.amazonaws.com/voizpost/save/getmandate?user_id=${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!mandateResponse.ok) {
          throw new Error("Failed to check mandate status");
        }

        const mandateData = await mandateResponse.json();

        if (
          !mandateData.FillMandateDetails &&
          location.pathname !== "/userdetails"
        ) {
          const userResponse = await fetch(
            `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/userId?email=${localStorage.getItem(
              "EmailId"
            )}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (!userResponse.ok) {
            throw new Error("Failed to verify user details");
          }

          const email = localStorage.getItem("EmailId");
          navigate("/userdetails", {
            state: { email },
            replace: true,
          });
        }
      } catch (error) {
        console.error("Error in protected route:", error);
        const email = localStorage.getItem("EmailId");
        navigate("/userdetails", {
          state: { email },
          replace: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkMandateAndRedirect();
  }, [location.pathname, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/loginpage" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

// UserDetails Route with protection
const UserDetailsRoute = () => {
  const location = useLocation();
  const { state } = location;

  if (!state?.email) {
    return <Navigate to="/loginpage" replace />;
  }

  return <UserDetails />;
};

function MainLayout() {
  const { currentSong } = usePlayer();
  const location = useLocation();

  // useEffect(() => {
  //   if (location.pathname === '/addsong') {
  //     sessionStorage.removeItem('songBasketFormData');
  //     sessionStorage.removeItem('uploadEssentialsFormData');
  //   } else if (location.pathname === '/songbasket') {
  //     sessionStorage.removeItem('uploadEssentialsFormData');
  //   }
  // }, [location.pathname]);

  // useEffect(() => {
  //   if (location.pathname === '/addsong' && !sessionStorage.getItem('comingFromUpload')) {
  //     sessionStorage.removeItem('songBasketFormData');
  //     sessionStorage.removeItem('uploadEssentialsFormData');
  //   }
  //   // else if (location.pathname === '/songbasket') {
  //   //   sessionStorage.removeItem('uploadEssentialsFormData');
  //   //   sessionStorage.setItem('comingFromUpload', 'true');
  //   // }
  //   return () => {
  //     if (location.pathname === '/addsong') {
  //       sessionStorage.removeItem('comingFromUpload');
  //     }
  //   };
  //  }, [location.pathname]);

  useEffect(() => {
    // Define upload flow pages
    const uploadFlowPages = [
      "/addsong",
      "/songbasket",
      "/uploadessentials",
      "/uploadcheck",
    ];

    // Check if we're navigating away from upload flow
    const isLeavingUploadFlow = uploadFlowPages.some((page) => {
      // Get previous location from sessionStorage
      const prevPath = sessionStorage.getItem("currentPath");
      return (
        prevPath?.startsWith(page) &&
        !uploadFlowPages.some((p) => location.pathname.startsWith(p))
      );
    });

    // If navigating away from upload flow, clear session storage data
    if (isLeavingUploadFlow) {
      sessionStorage.removeItem("addSongFormData");
      sessionStorage.removeItem("songBasketFormData");
      sessionStorage.removeItem("uploadEssentialsFormData");
      sessionStorage.removeItem("comingFromUpload");
    }

    // Store current path for next comparison
    sessionStorage.setItem("currentPath", location.pathname);
  }, [location.pathname]);

  const publicRoutes = [
    "/",
    "/landingpage",
    "/signup",
    "/loginpage",
    "/userdetails",
    "/Standard-terms-and-conditions",
    "/Technical-Specification",
    "/Code-of-Conduct",
    "/cookies-policy",
    "/privacy_policy",
    "/terms-of-service",
    "/takedown-policy",
  ];

  const isPublicRoute = publicRoutes.includes(location.pathname);
  const shouldShowPlayer = currentSong && !isPublicRoute;

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("user_id");
    if (!isAuthenticated && !isPublicRoute) {
      console.log("Setting intended path:", location.pathname);
      sessionStorage.setItem("intendedPath", location.pathname);
    }
  }, [location.pathname, isPublicRoute]);

  return (
    <Box className="app-layout">
      <Box className="main-wrapper">
        <Box className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<SplashScreen />} />
            <Route path="/landingpage" element={<LandingPage />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/loginpage" element={<LoginPage />} />
            <Route path="/userdetails" element={<UserDetailsRoute />} />
            <Route
              path="/Standard-terms-and-conditions"
              element={<TermsAndConditions />}
            />
            <Route
              path="/Technical-Specification"
              element={<TechnicalSpecification />}
            />
            <Route path="/Code-of-Conduct" element={<CodeOfConduct />} />
            <Route path="/cookies-policy" element={<CookiesPolicy />} />
            <Route path="/privacy_policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/takedown-policy" element={<TakeDownPolicy />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/song/:songId" element={<SharedLinkHandler />} />
              <Route path="/homepage" element={<HomePage />} />
              <Route path="/playlist/:id" element={<SongList />} />
              <Route path="/addsong" element={<AddSongPage />} />
              <Route path="/single-song" element={<SingleSong />} />
              <Route path="/addmultiple" element={<AddMultipleSong />} />
              <Route path="/album-single-song-add/:albumId" element={<AlbumSingleSongAdd />} />
              <Route path="/songbasket" element={<SongBasket />} />
              <Route path="/uploadessentials" element={<UploadEssentials />} />
              <Route path="/uploadcheck" element={<UploadCheck />} />
              <Route path="/youruploads" element={<YourUploads />} />
              <Route path="/album/:albumId" element={<UploadAlbumSong />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/adminpage" element={<Adminpage />} />
              <Route
                path="/songdetail/:song_id"
                element={<Adminsongdetails />}
              />
              <Route path="/album-single-song-add/:albumId" element={<AlbumSingleSongAdd />} />
              <Route path="/admin/album/:album_id" element={<AlbumAdminPage />} />
              <Route path="/approvepage" element={<ApprovalPage />} />
              <Route path="/language" element={<SongList />} />
              <Route path="/genre" element={<SongList />} />
              <Route path="/top10songs" element={<Top10Songs />} />
              <Route path="/history" element={<SongList />} />
              <Route path="/lovedtracks" element={<SongList />} />
              <Route path="/playlists" element={<PlayLists />} />
              <Route path="/playlist/:id" element={<SongList />} />
              <Route path="/artist/genre" element={<SongList />} />
              <Route path="/artist/language" element={<SongList />} />
              <Route path="/artist/songs" element={<SongList />} />
              <Route path="/artist" element={<ArtistProfilePage />} />
              <Route path="/artist/:userId" element={<ArtistProfilePage />} /> {/* added new route*/}
              <Route path="/artist/follow/:userId" element={<Follow />} /> {/* userid added */}
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/accountsettings" element={<AccountSettings />} />
              <Route path="/editprofile" element={<EditProfile />} />
              <Route path="/contactsupport" element={<ContactSupport />} />
              <Route path="/delete-account" element={<DeleteAccountPage />} />
              <Route path="/admin-reports" element={<Reports />} />
            </Route>
          </Routes>
        </Box>

        {!isPublicRoute && (
          <Box className="details-bar">
            <SongDetailsBar />
          </Box>
        )}
      </Box>

      {shouldShowPlayer && (
        <Box className="player-bar">
          <MiniPlayer />
        </Box>
      )}
    </Box>
  );
}

function App() {
  return (
    <PlayerProvider>
      <CommentsProvider>
        <Router>
          <MetaPixel />
          <MainLayout />
        </Router>
      </CommentsProvider>
    </PlayerProvider>
  );
}

export default App;
