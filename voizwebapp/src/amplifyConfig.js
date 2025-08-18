import { Amplify } from "aws-amplify";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import amplifyConfig from "./amplifyConfig"; // Adjust path if needed
import { auth, googleProvider } from "./firebase/firebaseConfig";
import { signInWithPopup } from "firebase/auth";

// Initialize Amplify with the configuration
Amplify.configure(amplifyConfig);

// Assuming these functions are defined in your API layer
const fetchUserDetails = async (email) => {
  try {
    const response = await fetch(`/api/users/${email}`);
    if (!response.ok) {
      if (response.status === 404) {
        return { exists: false, mandateFilled: false };
      }
      throw new Error(`Error fetching user details: ${response.statusText}`);
    }
    const data = await response.json();
    return {
      exists: true,
      mandateFilled: data.mandateFilled || false,
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    return { exists: false, mandateFilled: false };
  }
};

const createUserWithGoogle = async (userData) => {
  try {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userData.email,
        name: userData.displayName || "",
        profilePhoto: userData.photoURL || "",
        authProvider: "google",
      }),
    });

    if (!response.ok) {
      throw new Error(`Error creating user: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

const CognitoGoogleAuth = {
  /**
   * Generates a deterministic password for Google accounts
   * @param {string} email - User's email address
   * @returns {string} - Deterministic password
   */
  generateSecurePasswordForGoogle: (email) => {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = (hash << 5) - hash + email.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return `Google_${hash.toString()}!123`;
  },

  /**
   * Creates a new user in Cognito with Google credentials
   * @param {Object} userData - User data from Google
   * @returns {Promise} - Promise resolving to the sign up result
   */
  createCognitoUserWithGoogle: async (userData) => {
    try {
      const { email, displayName } = userData;
      const password = CognitoGoogleAuth.generateSecurePasswordForGoogle(email);

      // You'll need to use AWS SDK v3 for Cognito operations
      const client = new CognitoIdentityProviderClient({
        region: "ap-south-1",
      });

      // Implement sign-up logic using AWS SDK v3
      // This is a placeholder and needs to be replaced with actual AWS SDK v3 code
      return { userConfirmed: true };
    } catch (error) {
      // Handle username exists exception
      if (error.name === "UsernameExistsException") {
        // Try signing in since user exists
        return { userExists: true };
      }
      throw error;
    }
  },

  /**
   * Main function to handle Google authentication
   * @returns {Promise} - Promise with authentication result
   */
  handleGoogleAuthentication: async () => {
    try {
      // Step 1: Firebase Google authentication
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user || !user.email) {
        throw new Error("Could not get user information from Google");
      }

      // Step 2: Create or verify Cognito user
      const cognitoSignUpResult =
        await CognitoGoogleAuth.createCognitoUserWithGoogle({
          email: user.email,
          displayName: user.displayName,
        });

      // Step 3: Check if user exists in database
      const { exists, mandateFilled } = await fetchUserDetails(user.email);

      if (!exists) {
        // Create user in database
        await createUserWithGoogle({
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });

        return {
          status: "new_user",
          email: user.email,
          user,
        };
      }

      return {
        status: "existing_user",
        mandateFilled,
        email: user.email,
        user,
      };
    } catch (error) {
      console.error("Error during Google authentication:", error);
      throw error;
    }
  },

  /**
   * Confirms a new user sign up with verification code
   * @param {string} email - User's email
   * @param {string} code - Verification code
   * @returns {Promise} - Promise resolving to confirmation result
   */
  confirmUserSignUp: async (email, code) => {
    try {
      // Implement confirmation logic
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Resends confirmation code
   * @param {string} email - User's email
   * @returns {Promise} - Promise resolving when code is sent
   */
  resendConfirmationCode: async (email) => {
    try {
      // Implement code resend logic
      return { success: true };
    } catch (error) {
      throw error;
    }
  },
};

export default CognitoGoogleAuth;
