import React, { useState, useEffect, useRef } from "react";
import { Box, Card, Typography, IconButton } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import SideBar from "./SideBar";
import coverpage from "./assets/coverpage1.jpeg";
import frame1 from "./assets/Frame1.png";
import frame2 from "./assets/Frame2.png";
import frame3 from "./assets/Frame3.png";
import genreImage1 from "./assets/Devotional.jpg";
import genreImage2 from "./assets/Classical.png";
import genreImage3 from "./assets/others.png";
import genreImage4 from "./assets/Pop.png";
import genreImage5 from "./assets/Rock.png";
import genreImage6 from "./assets/Romatic.png";
import genreImage7 from "./assets/rap2.png";
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
import FolkImage from "./assets/Folk1.png";
import FusionImage from "./assets/fusion.png";
import OtherImage from "./assets/others.png";
import RabindraSangeet from "./assets/rabindra sangeet.png";
import coverpage1 from "./assets/CoverPage1.png";
import coverpage2 from "./assets/CoverPage2.png";
import coverpage3 from "./assets/CoverPage3.png";
import play_arrow from "./assets/play_arrow.png";
import AssameseImage from "./assets/Assamese.png";
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
import default1 from "./assets/default1.png";
import default2 from "./assets/default2.png";
import default3 from "./assets/default3.png";
import default4 from "./assets/default4.png";

const ImageSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: frame1,
      title: "ADV",
      artist: "Micky",
      plays: "2450",
      likes: "922",
      shares: "4349",
    },
    {
      image: frame2,
      title: "Slide 2",
      artist: "Artist 2",
      plays: "1890",
      likes: "756",
      shares: "3200",
    },
    {
      image: frame3,
      title: "Slide 3",
      artist: "Artist 3",
      plays: "2100",
      likes: "845",
      shares: "3800",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <Box className="slider-container" sx={{ fontFamily: "Poppins" }}>
      <IconButton className="slider-arrow left" onClick={prevSlide}>
        <ChevronLeftIcon />
      </IconButton>

      <Box className="slide">
        <Box className="slide-content">
          <Box className="slide-info">
            <Typography variant="h2" sx={{ fontFamily: "Poppins" }}>
              {slides[currentSlide].title}
            </Typography>
            <Typography variant="subtitle1" sx={{ fontFamily: "Poppins" }}>
              By {slides[currentSlide].artist}
            </Typography>
            <Box className="stats" sx={{ fontFamily: "Poppins" }}>
              <span>▶ {slides[currentSlide].plays} Plays</span>
              <span>♥ {slides[currentSlide].likes}</span>
              <span>↗ {slides[currentSlide].shares}</span>
            </Box>
          </Box>
          <img
            src={slides[currentSlide].image}
            alt={slides[currentSlide].title}
            className="slide-image"
          />
        </Box>
      </Box>

      <IconButton className="slider-arrow right" onClick={nextSlide}>
        <ChevronRightIcon />
      </IconButton>

      <Box className="slider-dots" sx={{ fontFamily: "Poppins" }}>
        {slides.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentSlide ? "active" : ""}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </Box>
    </Box>
  );
};

export default function HomePage() {
  const navigate = useNavigate();
  const defaultImages = [default1, default2, default3, default4];
  const [artists, setArtists] = useState([]);
  const [isLanguagesScrollable, setIsLanguagesScrollable] = useState(false);
  const [isGenresScrollable, setIsGenresScrollable] = useState(false);
  const [isArtistsScrollable, setIsArtistsScrollable] = useState(false);
  const scrollRefLanguages = useRef(null);
  const scrollRefGenres = useRef(null);
  const scrollRefArtists = useRef(null);
  const user_id = localStorage.getItem("user_id");
  const [genres, setGenres] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preloadedArtists, setPreloadedArtists] = useState([]);

  const sidebarCollapsedss =
    JSON.parse(localStorage.getItem("sidebarCollapsed")) || false;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(sidebarCollapsedss);

  // Add this effect to listen for changes from SongDetailsBar
  useEffect(() => {
    const handleSidebarChange = (event) => {
      if (event.detail === "collapsed") {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    window.addEventListener("sidebarStateChange", handleSidebarChange);
    return () =>
      window.removeEventListener("sidebarStateChange", handleSidebarChange);
  }, []);

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
    Assamese: AssameseImage,
    Kannada: KannadaImage,
    Kashmiri: KashmiriImage,
    Konkani: KonkaniImage,
    Oriya: OriyaImage,
    Tamil: TamilImage,
    Urdu: UrduImage,
    Bhojpuri: BhojpuriImage,
    Pahari: PahariImage,
    Rajasthani: RajasthaniImage,
  };

  const genreImages = {
    Devotional: genreImage1,
    Classical: genreImage2,
    Pop: genreImage4,
    Rock: genreImage5,
    Romantic: genreImage6,
    Ghazal: GhazalImage,
    Rap: genreImage7,
    Folk: FolkImage,
    Jazz: JazzImage,
    Fusion: FusionImage,
    Sufi: SufiImage,
    "Rabindra Sangeet": RabindraSangeet,
    Others: OtherImage,
  };

  const formatName = (name) => {
    if (!name) return "";

    // Split the name into parts
    const nameParts = name
      .split(" ")
      .map(
        (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      );

    return nameParts.join(" ");
  };

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch(
          "https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/genre/count"
        );
        const data = await response.json();

        const sortedGenres = data.sort((a, b) => b.count - a.count);
        // Set the genres to the state
        setGenres(sortedGenres);
      } catch (error) {
        console.error("Error fetching genres:", error);
      }
    };

    const fetchArtists = async () => {
      try {
        const response = await fetch(
          "https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/artist"
        );
        const data = await response.json();
        console.log(data);
        // Filter out artists with songCount = 0
        const filteredArtists = data.filter((artist) => artist.songCount > 0);

        // Sort the filtered artists by songCount in descending order
        const sortedArtists = filteredArtists.sort(
          (a, b) => b.songCount - a.songCount
        );

        // Set the filtered artists to the state
        setArtists(sortedArtists);

        await preloadArtistImages(sortedArtists);
      } catch (error) {
        console.error("Error fetching artists:", error);
      }
    };

    fetchArtists();
    fetchGenres();
  }, []);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch(
          "https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/language/count"
        );
        const data = await response.json();

        // Sort the languages by count in descending order
        const sortedLanguages = data.sort((a, b) => b.count - a.count);

        setLanguages(sortedLanguages);
      } catch (error) {
        console.error("Error fetching languages:", error);
      }
    };

    fetchLanguages();
  }, []);

  useEffect(() => {
    if (scrollRefLanguages.current) {
      setIsLanguagesScrollable(
        scrollRefLanguages.current.scrollWidth >
          scrollRefLanguages.current.clientWidth
      );
    }
  }, [languages]);

  useEffect(() => {
    if (scrollRefLanguages.current) {
      setIsLanguagesScrollable(
        scrollRefLanguages.current.scrollWidth >
          scrollRefLanguages.current.clientWidth
      );
    }
  }, [languages]);

  useEffect(() => {
    if (scrollRefGenres.current) {
      setIsGenresScrollable(
        scrollRefGenres.current.scrollWidth >
          scrollRefGenres.current.clientWidth
      );
    }
  }, [genres]);

  useEffect(() => {
    if (scrollRefArtists.current) {
      setIsArtistsScrollable(
        scrollRefArtists.current.scrollWidth >
          scrollRefArtists.current.clientWidth
      );
    }
  }, [preloadedArtists]);

  useEffect(() => {
    const fetchCoverPage = async () => {
      try {
        const response = await fetch(
          `https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getcoverpage?user_id=${user_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch cover page URL");
        }

        const data = await response.json();
        const coverPageUrl = data.coverPageUrl?.S;

        if (coverPageUrl) {
          localStorage.setItem("CoverPageUrl", coverPageUrl);
        }
      } catch (error) {
        console.error("Error fetching cover page URL:", error);
      }
    };

    fetchCoverPage();
  }, [user_id]);

  // New function to preload artist images
  const preloadArtistImages = async (artistsList) => {
    setLoading(true);

    const preloadPromises = artistsList.map((artist, index) => {
      return new Promise((resolve) => {
        const imgSrc =
          artist.profilePhotoUrl || defaultImages[index % defaultImages.length];
        const img = new Image();
        img.src = imgSrc;
        img.onload = () => resolve({ ...artist, preloadedSrc: imgSrc });
        img.onerror = () =>
          resolve({
            ...artist,
            preloadedSrc: defaultImages[index % defaultImages.length],
          });
      });
    });

    const preloadedResults = await Promise.all(preloadPromises);
    setPreloadedArtists(preloadedResults);
    setLoading(false);
  };

  const handleLanguageSelect = (language) => {
    navigate("/language", { state: { language } });
  };

  const handleGenreSelect = (genre) => {
    navigate("/genre", { state: { genre } });
  };

  const handleArtistSelect = (artist) => {
    navigate("/artist/songs", { state: { artist } });
  };

  const scrollLeftArtists = () => {
    if (scrollRefArtists.current) {
      scrollRefArtists.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRightArtists = () => {
    if (scrollRefArtists.current) {
      scrollRefArtists.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const scrollLeftLanguages = () => {
    if (scrollRefLanguages.current) {
      scrollRefLanguages.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRightLanguages = () => {
    if (scrollRefLanguages.current) {
      scrollRefLanguages.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const scrollLeftGenres = () => {
    if (scrollRefGenres.current) {
      scrollRefGenres.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRightGenres = () => {
    if (scrollRefGenres.current) {
      scrollRefGenres.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };
  const getRandomCoverImage = () => {
    const coverImages = [coverpage1, coverpage2, coverpage3];
    const randomIndex = Math.floor(Math.random() * coverImages.length);
    return coverImages[randomIndex];
  };

  // Preload default images
  useEffect(() => {
    defaultImages.forEach((img) => {
      const image = new Image();
      image.src = img;
    });
  }, []);

  return (
    <Box className="drawer" sx={{ fontFamily: "Poppins" }}>
      <SideBar />
      <Box sx={{ flexGrow: 1, minWidth: 100, fontFamily: "Poppins" }}>
        {/* Image Slider */}
        {/* <ImageSlider /> */}

        {/* Latest Music Section */}
        <Box
          sx={{
            padding: 2,
            fontFamily: "Poppins",
            width: sidebarCollapsed ? "calc(100% - 32px)" : "1080px",
            transition: "all 0.4s ease-in-out",
          }}
          data-section="latest-music"
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              marginBottom: 2,
              fontFamily: "Poppins",
              marginRight: sidebarCollapsed ? -2 : 0,
              transition: "all 0.3s ease-in-out",
            }}
          >
            <Typography
              variant="h4"
              sx={{ color: "white", fontFamily: "Poppins", fontWeight: "bold" }}
              gutterBottom
            >
              Latest Music
            </Typography>
            {isArtistsScrollable && (
              <Box>
                <IconButton
                  onClick={scrollLeftArtists}
                  sx={{
                    backgroundColor: "#707070",
                    color: "white",
                    "&:hover": { backgroundColor: "#707070" },
                    marginRight: 1,
                    fontFamily: "Poppins",
                  }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton
                  onClick={scrollRightArtists}
                  sx={{
                    backgroundColor: "#707070",
                    color: "white",
                    "&:hover": { backgroundColor: "#707070" },
                    fontFamily: "Poppins",
                  }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Box>
            )}
          </Box>

          <Box
            ref={scrollRefArtists}
            display="flex"
            overflow="hidden"
            whiteSpace="nowrap"
            gap={2}
            sx={{
              overflowX: "hidden",
              paddingBottom: 1,
              scrollBehavior: "smooth",
              fontFamily: "Poppins",
              transition: "all 0.4s ease-in-out",
              width: "calc(6 * (200px + 6px) - 8px)",
              minHeight: "180px", // Ensure the container has a minimum height while loading
            }}
          >
            {loading
              ? // Show placeholders while loading
                Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="artist-card-container"
                    style={{
                      width: "190px",
                      height: "180px",
                      backgroundColor: "#1C1C1C",
                      borderRadius: "none !important",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "10px",
                      boxSizing: "border-box",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "160px",
                        height: "120px",
                        backgroundColor: "#2A2A2A",
                        animation: "pulse 1.5s infinite ease-in-out",
                      }}
                    />
                    <div
                      style={{
                        width: "100%",
                        height: "16px",
                        backgroundColor: "#2A2A2A",
                        marginTop: "10px",
                        animation: "pulse 1.5s infinite ease-in-out",
                      }}
                    />
                  </div>
                ))
              : // Show the actual artist cards once loaded
                preloadedArtists.map((artist, index) => (
                  <div
                    key={index}
                    className="artist-card-container"
                    onClick={() => handleArtistSelect(artist)}
                    style={{
                      width: "190px",
                      height: "180px",
                      backgroundColor: "black",
                      borderRadius: "none !important",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "10px",
                      boxSizing: "border-box",
                      flexShrink: 0, // Prevent items from shrinking
                    }}
                  >
                    <img
                      src={artist.preloadedSrc}
                      style={{
                        width: "160px",
                        height: "120px",
                        borderRadius: "none !important",
                        objectFit: "cover",
                      }}
                      alt={artist.StageName}
                    />
                    <div
                      style={{
                        color: "white",
                        marginTop: "5px",
                        textAlign: "left",
                        fontFamily: "Helvetica, Arial, sans-serif",
                        fontSize: "16px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        width: "100%",
                        letterSpacing: "1px",
                        paddingLeft: "5px",
                      }}
                    >
                      {formatName(artist.StageName || artist.FullName)}
                    </div>
                  </div>
                ))}
          </Box>
        </Box>

        {/* Languages Section */}
        <Box
          sx={{
            padding: 2,
            fontFamily: "Poppins",
            width: sidebarCollapsed ? "calc(100% - 32px)" : "1080px",
            transition: "all 0.4s ease-in-out",
          }}
          data-section="languages"
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              marginBottom: 2,
              fontFamily: "Poppins",
              marginRight: sidebarCollapsed ? -2 : 0,
              transition: "margin-right 0.3s ease-in-out",
            }}
          >
            <Typography
              variant="h4"
              sx={{ color: "white", fontFamily: "Poppins", fontWeight: "bold" }}
              gutterBottom
            >
              For You From India
            </Typography>
            {isLanguagesScrollable && (
              <Box>
                <IconButton
                  onClick={scrollLeftLanguages}
                  sx={{
                    backgroundColor: "#707070",
                    color: "white",
                    "&:hover": { backgroundColor: "#707070" },
                    marginRight: 1,
                    fontFamily: "Poppins",
                  }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton
                  onClick={scrollRightLanguages}
                  sx={{
                    backgroundColor: "#707070",
                    color: "white",
                    "&:hover": { backgroundColor: "#707070" },
                    fontFamily: "Poppins",
                  }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Box>
            )}
          </Box>

          <Box
            ref={scrollRefLanguages}
            display="flex"
            overflow="hidden"
            whiteSpace="nowrap"
            gap={5.2}
            sx={{
              overflowX: "hidden",
              paddingBottom: 1,
              scrollBehavior: "smooth",
              fontFamily: "Poppins",
            }}
          >
            {languages.map((language, index) => (
              <Box
                key={index}
                sx={{
                  width: "140px",
                  cursor: "pointer",
                  position: "relative",
                  borderRadius: "0px !important",
                }}
                onClick={() => handleLanguageSelect(language.language)}
              >
                <Card
                  sx={{
                    bgcolor: "#1C2C46",
                    color: "white",
                    marginBottom: 1,
                    borderRadius: "0px !important",
                  }}
                >
                  <img
                    src={languageImages[language.language] || ""}
                    style={{
                      width: "140px",
                      height: "140px",
                      borderRadius: "0px !important",
                    }}
                    alt={language.language}
                  />
                  <Box className="play-icon-overlay">
                    <Box className="custom-play-button">
                      <img src={play_arrow} alt="Play" />
                    </Box>
                  </Box>
                </Card>
                <Typography variant="h7" sx={{ color: "white" }}>
                  {language.language}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Genres Section */}
        <Box
          sx={{
            padding: 2,
            fontFamily: "Poppins",
            width: sidebarCollapsed ? "calc(100% - 32px)" : "1080px",
            transition: "all 0.4s ease-in-out",
          }}
          data-section="genres"
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              marginBottom: 2,
              fontFamily: "Poppins",
              marginRight: sidebarCollapsed ? -2 : 0,
              transition: "margin-right 0.3s ease-in-out",
            }}
          >
            <Typography
              variant="h4"
              sx={{ color: "white", fontFamily: "Poppins", fontWeight: "bold" }}
              gutterBottom
            >
              Genre
            </Typography>
            {isGenresScrollable && (
              <Box>
                <IconButton
                  onClick={scrollLeftGenres}
                  sx={{
                    backgroundColor: "#707070",
                    color: "white",
                    "&:hover": { backgroundColor: "#707070" },
                    marginRight: 1,
                    fontFamily: "Poppins",
                  }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton
                  onClick={scrollRightGenres}
                  sx={{
                    backgroundColor: "#707070",
                    color: "white",
                    "&:hover": { backgroundColor: "#707070" },
                    fontFamily: "Poppins",
                  }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Box>
            )}
          </Box>

          <Box
            ref={scrollRefGenres}
            display="flex"
            overflow="hidden"
            whiteSpace="nowrap"
            gap={5.2}
            sx={{
              overflowX: "hidden",
              paddingBottom: 1,
              scrollBehavior: "smooth",
              fontFamily: "Poppins",
            }}
          >
            {genres.map((genre, index) => (
              <Box
                key={index}
                sx={{
                  width: "140px",
                  cursor: "pointer",
                  position: "relative",
                  fontFamily: "Poppins",
                }}
                onClick={() => handleGenreSelect(genre.genre)}
              >
                <Card
                  sx={{
                    bgcolor: "#1C2C46",
                    color: "white",
                    marginBottom: 1,
                    position: "relative",
                    fontFamily: "Poppins",
                    borderRadius: "0px !important",
                  }}
                >
                  <img
                    src={genreImages[genre.genre] || coverpage}
                    style={{
                      width: "140px",
                      height: "140px",
                      borderRadius: "8px",
                    }}
                    alt={genre}
                  />
                  {/* Play Arrow Overlay */}
                  <Box className="play-icon-overlay">
                    <Box className="custom-play-button">
                      <img src={play_arrow} alt="Play" />
                    </Box>
                  </Box>
                </Card>
                <Typography
                  variant="h7"
                  sx={{ color: "white", fontFamily: "Poppins" }}
                >
                  {genre.genre}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
