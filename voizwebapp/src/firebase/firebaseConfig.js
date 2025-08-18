import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserSessionPersistence,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDTf6FWaqhLd1sAsy-JmygkH7DkPzol7WY",
  authDomain: "voiz-android.firebaseapp.com",
  projectId: "voiz-android",
  storageBucket: "voiz-android.firebasestorage.app",
  messagingSenderId: "144502365323",
  appId: "1:144502365323:web:f782ebc9c3a182e38a088e",
  measurementId: "G-G73GDJ8175",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure persistence to session only
setPersistence(auth, browserSessionPersistence).catch((error) => {
  console.error("Error setting auth persistence:", error);
});

export const googleProvider = new GoogleAuthProvider();
// Always prompt user to select account
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Helper function to clear existing auth state
export const clearAuthState = async () => {
  try {
    const auth = getAuth();
    if (auth.currentUser) {
      await signOut(auth);
      // Force a small delay to ensure signOut completes
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return true;
  } catch (error) {
    console.error("Error clearing auth state:", error);
    return false;
  }
};

// Function to handle Google Sign In
const signInWithGoogle = async () => {
  try {
    // Clear any existing auth state first
    await clearAuthState();

    // Create a fresh provider for each sign-in attempt
    const freshProvider = new GoogleAuthProvider();
    freshProvider.setCustomParameters({
      prompt: "select_account",
    });

    const result = await signInWithPopup(auth, freshProvider);
    const user = result.user;

    return {
      success: true,
      user: {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        uid: user.uid,
      },
    };
  } catch (error) {
    console.error("Google sign-in error:", error);

    // Provide more specific error messages
    if (
      error.code === "auth/cancelled-popup-request" ||
      error.code === "auth/popup-closed-by-user"
    ) {
      return {
        success: false,
        error: "Sign-in was cancelled. Please try again.",
      };
    } else if (error.code === "auth/account-exists-with-different-credential") {
      return {
        success: false,
        error:
          "An account already exists with the same email but different sign-in credentials.",
      };
    } else if (error.code === "auth/popup-blocked") {
      return {
        success: false,
        error:
          "Sign-in popup was blocked by the browser. Please enable popups for this site.",
      };
    } else if (error.code === "auth/network-request-failed") {
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to sign in with Google",
    };
  }
};

export default signInWithGoogle;
