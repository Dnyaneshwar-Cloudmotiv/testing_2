import * as React from 'react';
import logo from './assets/voizlogo.png';
import Box from '@mui/material/Box';
import './SplashScreen.css';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from 'aws-amplify/auth';

export default function SplashScreen() {
  const navigate = useNavigate(); // Initialize the navigate function

  React.useEffect(() => {

    const checkLoginStatus = async () => {
      try {
        const { username, userId, signInDetails } = await getCurrentUser();
        if (username && userId && signInDetails) {
          console.log('User is already logged in');
          const timer = setTimeout(() => {
            navigate('/homepage'); // Replace '/next-page' with the actual path of the next page
          }, 3000);

          // Clear the timeout when the component unmounts
          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.log(err);
        console.log('User is not logged in');
          // Set a timeout to navigate after 3 seconds (3000 milliseconds)
          const timer = setTimeout(() => {
            navigate('/landingpage'); // Replace '/next-page' with the actual path of the next page
          }, 3000);

          // Clear the timeout when the component unmounts
          return () => clearTimeout(timer);
      }

    };

    checkLoginStatus();
  }, [navigate]);
  return (
    <Box className='homePage'>
      <img src={logo} alt="Logo" className="logo" />
    </Box>
  );
}