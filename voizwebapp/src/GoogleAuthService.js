import {
  signIn,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
} from "aws-amplify/auth";
import signInWithGoogle, { clearAuthState } from "./firebase/firebaseConfig";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";

class GoogleAuthService {
  static async clearPreviousAuthSessions() {
    try {
      // Get the Firebase auth instance
      const auth = getAuth();

      // Check if there's a current user
      if (auth.currentUser) {
        console.log("Found existing user session, signing out...");
        // Sign out of any existing Firebase authentication
        await signOut(auth);

        // Add a small delay to ensure Firebase completes the sign-out process
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Force a refresh of the auth state
      await auth.updateCurrentUser(null);

      console.log("Previous sessions cleared successfully");
    } catch (error) {
      console.error("Error clearing previous authentication sessions:", error);
      // Even if there's an error, try to force clear the current user
      try {
        const auth = getAuth();
        await auth.updateCurrentUser(null);
      } catch (e) {
        console.error("Failed to force clear auth state:", e);
      }
    }
  }
  /**
   * Generates a deterministic password for Google authentication
   */
  static generateSecureGooglePassword(email) {
    return `Google_${email.hashCode()}!123`;
  }

  static async fetchGooglePassword(email) {
    try {
      const response = await fetch("https://knjixc4wse.execute-api.ap-south-1.amazonaws.com/admin_report/create_password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
  
      const data = await response.json();
  
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to generate password");
      }
  
      return data.password;
    } catch (error) {
      console.error("Error fetching password from API:", error);
      throw new Error("Unable to generate password. Please try again.");
    }
  }

  /**
   * Check if a user with this email exists in our database
   */
  static async checkUserExistsInDatabase(email) {
    try {
      const response = await fetch(
        `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/userId?email=${email}`
      );

      if (response.status === 200) {
        const data = await response.json();
        return data && data.length > 0;
      }
      return false;
    } catch (error) {
      console.error("Error checking if user exists:", error);
      return false;
    }
  }

  /**
   * Fetch user ID and category from the database
   */
  static async fetchUserIdAndCategory(email) {
    try {
      const response = await fetch(
        `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/userId?email=${email}`
      );

      if (response.status === 200) {
        const data = await response.json();

        if (data && data.length > 0) {
          const userData = data[0];

          return {
            userId: userData.user_id?.S || "",
            userCategory: userData.Category?.S || "",
            userfullname: userData.FullName?.S || "",
          };
        }
      }
      return null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  }

  /**
   * Save user to API with enhanced error handling and logging
   */
  static async saveUserToApi(email) {
    console.log("Attempting to save user to DynamoDB:", email);
    try {
      const response = await fetch(
        "https://i3lmfmc1h2.execute-api.ap-south-1.amazonaws.com/voizpost/save/usernew",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            EmailId: email,
          }),
        }
      );

      console.log("API response status:", response.status);

      // Get response body regardless of status
      const responseText = await response.text();
      console.log("API response body:", responseText);

      // Check for errors (but don't throw on 409 - user already exists)
      if (!response.ok && response.status !== 409) {
        throw new Error(
          `Failed to create user: ${response.status} - ${responseText}`
        );
      }

      let userData;
      try {
        userData = responseText ? JSON.parse(responseText) : null;
      } catch (e) {
        console.error("Error parsing response JSON:", e);
        userData = null;
      }

      // For existing user (409) or error parsing, get user_id through userId endpoint
      if (response.status === 409 || !userData) {
        console.log(
          "User exists or no data returned, fetching from userId endpoint"
        );
        const userIdResponse = await fetch(
          `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/userId?email=${email}`
        );

        console.log("userId endpoint status:", userIdResponse.status);

        if (userIdResponse.ok) {
          const userData = await userIdResponse.json();
          console.log("userId endpoint data:", userData);

          if (userData && userData.length > 0) {
            return userData[0].user_id?.S;
          }
        }
        throw new Error("User exists but couldn't fetch user ID");
      }

      // Parse response for new user
      console.log("User created successfully:", userData);
      return userData?.user_id;
    } catch (error) {
      console.error("Error saving user to API:", error);
      throw error;
    }
  }

  // save user to dynamodb
  static async createUserInDynamoDB(email) {
    console.log("Creating user in DynamoDB:", email);
    try {
      // First, try to save user to API
      const response = await fetch(
        "https://i3lmfmc1h2.execute-api.ap-south-1.amazonaws.com/voizpost/save/usernew",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            EmailId: email,
          }),
        }
      );

      console.log("API response status:", response.status);

      // Get response body regardless of status
      const responseText = await response.text();
      console.log("API response body:", responseText);

      // Check for errors (but don't throw on 409 - user already exists)
      if (!response.ok && response.status !== 409) {
        throw new Error(
          `Failed to create user: ${response.status} - ${responseText}`
        );
      }

      let userId;
      try {
        const userData = responseText ? JSON.parse(responseText) : null;
        userId = userData?.user_id;
      } catch (e) {
        console.error("Error parsing response JSON:", e);
      }

      // For existing user (409) or error parsing, get user_id through userId endpoint
      if (response.status === 409 || !userId) {
        console.log(
          "User exists or no data returned, fetching from userId endpoint"
        );
        const userIdResponse = await fetch(
          `https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/userId?email=${email}`
        );

        console.log("userId endpoint status:", userIdResponse.status);

        if (userIdResponse.ok) {
          const userData = await userIdResponse.json();
          console.log("userId endpoint data:", userData);

          if (userData && userData.length > 0) {
            userId = userData[0].user_id?.S;
          }
        }
      }

      if (!userId) {
        throw new Error("Failed to get or create user ID");
      }

      return { success: true, userId };
    } catch (error) {
      console.error("Error creating user in DynamoDB:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update the user's last login platform
   */
  static async updateLastLoginPlatform(userId) {
    try {
      const response = await fetch(
        `https://knjixc4wse.execute-api.ap-south-1.amazonaws.com/admin_report/update_last_login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            lastLogin: "Web",
          }),
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error("Error updating last login platform:", error);
      return false;
    }
  }

  /**
   * Check mandate details for a user
   */
  static async checkMandateDetails(userId) {
    try {
      const response = await fetch(
        `https://i3lmfmc1h2.execute-api.ap-south-1.amazonaws.com/voizpost/save/getmandate?user_id=${userId}`
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          fillMandateDetails: data.FillMandateDetails || false,
        };
      }

      return { success: false, fillMandateDetails: true };
    } catch (error) {
      console.error("Error checking mandate details:", error);
      return { success: false, fillMandateDetails: true };
    }
  }
  /**
   * Handle Google Sign In for existing users
   */
  static async signInWithGoogle() {
    try {
      // Clear any existing sessions first
      await clearAuthState();

      // Use the Firebase Google sign-in
      const googleResult = await signInWithGoogle();

      if (!googleResult.success) {
        throw new Error(googleResult.error || "Google authentication failed");
      }

      const email = googleResult.user.email;
      console.log("Google auth successful for:", email);

      // Check if user exists in our database
      const userExists = await this.checkUserExistsInDatabase(email);
      console.log("User exists check:", userExists);

      if (!userExists) {
        return {
          success: false,
          userNotFound: true,
          error: "Account not found. Please sign up first.",
        };
      }

      // Existing user flow
      try {
        localStorage.clear();
        // Generate the deterministic password for this Google user
        const googlePassword = await this.fetchGooglePassword(email);

        // Sign in to Cognito
        await signIn({
          username: email,
          password: googlePassword,
        });

        // Fetch user details
        const userDetails = await this.fetchUserIdAndCategory(email);
        localStorage.setItem("GoogleSignup", "true");

        if (userDetails) {
          // Update last login platform
          await this.updateLastLoginPlatform(userDetails.userId);

          // Check mandate details
          const mandateCheck = await this.checkMandateDetails(
            userDetails.userId
          );

          return {
            success: true,
            userDetails: {
              userId: userDetails.userId,
              fullName: userDetails.userfullname || "",
              email: email,
              userCategory: userDetails.userCategory || "",
              stageName: "", // You might need to fetch this separately
              phoneNumber: "", // You might need to fetch this separately
            },
            shouldFillDetails: mandateCheck.fillMandateDetails,
          };
        }

        throw new Error("Failed to retrieve user details");
      } catch (error) {
        console.error("Error during Cognito sign-in:", error);

        // Handle potential account merge scenarios
        if (error.name === "NotAuthorizedException") {
          return {
            success: true,
            requiresMerge: true,
            email,
            message: "Account exists but needs to be linked with Google",
          };
        }

        return {
          success: false,
          error: error.message || "Authentication failed. Please try again.",
        };
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      return {
        success: false,
        error: error.message || "Failed to sign in with Google",
      };
    }
  }
  /**
   * Main method to handle Google Sign Up with enhanced flow
   */
  static async signUpWithGoogle() {
    try {
      await this.clearPreviousAuthSessions();

      // Use Firebase Google Sign-In with account selection
      const auth = getAuth();
      const provider = new GoogleAuthProvider();

      // Force account selection dialog
      provider.setCustomParameters({ prompt: "select_account" });

      // Authenticate with Google
      const result = await signInWithPopup(auth, provider);

      if (!result.user) {
        throw new Error("Google sign-in failed");
      }

      const { email } = result.user;
      console.log("Google auth successful for:", email);

      // Check if user exists first
      const userExists = await this.checkUserExistsInDatabase(email);
      console.log("User exists check:", userExists);

      if (userExists) {
        // Check if this is a Google-authenticated user (based on our password pattern)
        try {
          const googlePassword = await this.fetchGooglePassword(email);

          // Try signing in with our Google-specific password pattern
          const signInResult = await signIn({
            username: email,
            password: googlePassword,
          });

          // If sign-in succeeds, this is an existing Google user
          if (signInResult && signInResult.isSignedIn) {
            // Sign out immediately to avoid session conflicts
            try {
              const auth = getAuth();
              await signOut(auth);
            } catch (e) {
              console.error("Error signing out after check:", e);
            }

            return {
              success: false,
              existingGoogleUser: true,
              error: "Account already exists. Please login instead.",
            };
          }
        } catch (signInError) {
          // If sign-in fails with NotAuthorizedException, this is likely a regular user account
          // that needs to be merged with Google
          if (signInError.name === "NotAuthorizedException") {
            try {
              await resetPassword({ username: email });

              return {
                success: true,
                requiresMerge: true,
                email,
                message: "Account exists but needs to be linked with Google",
              };
            } catch (resetError) {
              console.error("Error initiating password reset:", resetError);
              return {
                success: false,
                error: "Failed to initiate account linking. Please try again.",
              };
            }
          }
        }

        // Continue with existing user flow if no determination made above

        try {
          const googlePassword = await this.fetchGooglePassword(email);

          await signIn({
            username: email,
            password: googlePassword,
          });

          // Fetch user details

          const userDetails = await this.fetchUserIdAndCategory(email);
          localStorage.setItem("GoogleSignup", "true");

          if (userDetails) {
            // Update last login platform
            await this.updateLastLoginPlatform(userDetails.userId);

            // Check mandate details
            const mandateCheck = await this.checkMandateDetails(
              userDetails.userId
            );

            return {
              success: true,
              isNewUser: false,
              userDetails,
              nextRoute: mandateCheck.fillMandateDetails
                ? "/userdetails"
                : "/homepage",
              shouldFillDetails: mandateCheck.fillMandateDetails,
            };
          }
        } catch (error) {
          throw error;
        }
      } else {
        // New user signup flow
        const googlePassword = await this.fetchGooglePassword(email);

        try {
          // Sign up with Cognito
          const signUpResult = await signUp({
            username: email,
            password: googlePassword,
            attributes: { email },
          });

          // Handle signup result
          if (signUpResult.isSignUpComplete) {
            // No verification needed, create user in database
            const userId = await this.saveUserToApi(email);

            // Sign in the user
            await signIn({
              username: email,
              password: googlePassword,
            });

            // Check mandate details
            const mandateCheck = await this.checkMandateDetails(userId);

            return {
              success: true,
              isNewUser: true,
              userDetails: {
                userId,
                email,
              },
              nextRoute: mandateCheck.fillMandateDetails
                ? "/userdetails"
                : "/homepage",
              shouldFillDetails: mandateCheck.fillMandateDetails,
            };
          } else {
            // User needs to confirm email
            return {
              success: true,
              isNewUser: true,
              requiresConfirmation: true,
              email,
            };
          }
        } catch (error) {
          // Handle signup errors
          if (error.name === "UsernameExistsException") {
            try {
              // Attempt to resend confirmation code
              await resendSignUpCode({ username: email });

              // Return a result that indicates confirmation is needed
              return {
                success: true,
                requiresConfirmation: true,
                email,
                message: "Verification code resent. Please complete signup.",
              };
            } catch (resendError) {
              console.error("Error resending confirmation code:", resendError);

              // Existing error handling
              if (resendError.name === "InvalidParameterException") {
                return {
                  success: false,
                  existingGoogleUser: true,
                  error: "Account already exists. Please login instead.",
                };
              }

              return {
                success: false,
                error: "Failed to process signup. Please try again.",
              };
            }
          }

          return {
            success: false,
            error: error.message || "Failed to sign up with Google",
          };
        }
      }
    } catch (error) {
      console.error("Google sign-up error:", error);
      return {
        success: false,
        error: error.message || "Failed to sign up with Google",
      };
    }
  }
  /**
   * Reset password for account merging
   */

  static async resetPassword(email) {
    try {
      // Make sure we're using the AWS Amplify resetPassword function correctly
      const result = await resetPassword({ username: email });

      console.log("Reset password result:", result);
      return { success: true };
    } catch (error) {
      console.error("Error initiating password reset:", error);

      // Provide more detailed error information
      if (error.name === "UserNotFoundException") {
        return {
          success: false,
          error: "User not found. Please check your email address.",
        };
      } else if (error.name === "LimitExceededException") {
        return {
          success: false,
          error: "Too many attempts. Please try again later.",
        };
      }

      return {
        success: false,
        error: error.message || "Failed to send verification code",
      };
    }
  }
  /**
   * Confirm sign-up (for email verification)
   */
  static async confirmSignUp(email, code) {
    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code,
      });
      return { success: true };
    } catch (error) {
      console.error("Error confirming sign-up:", error);

      // Provide user-friendly error messages
      if (error.name === "CodeMismatchException") {
        return {
          success: false,
          error: "Incorrect verification code. Please try again.",
        };
      } else if (error.name === "ExpiredCodeException") {
        return {
          success: false,
          error: "Verification code has expired. Please request a new one.",
        };
      }

      return {
        success: false,
        error: error.message || "Failed to confirm sign-up",
      };
    }
  }

  /**
   * Resend confirmation code
   */
  static async resendConfirmationCode(email) {
    try {
      await resendSignUpCode({ username: email });
      return { success: true };
    } catch (error) {
      console.error("Error resending code:", error);
      return {
        success: false,
        error: error.message || "Failed to resend confirmation code",
      };
    }
  }

  /**
   * Complete account merge process after receiving confirmation code
   */
  static async completeAccountMerge(email, code) {
    try {
      const googlePassword = await this.fetchGooglePassword(email);
      localStorage.setItem("GoogleSignup", "true");

      // Confirm password reset with the Google password
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword: googlePassword,
      });

      // Sign in with the new password and verify the result
      const signInResult = await signIn({
        username: email,
        password: googlePassword,
      });

      // Check if sign in was successful
      if (!signInResult.isSignedIn) {
        console.error("Failed to sign in after resetting password");
      }

      // Fetch user details
      const userDetails = await this.fetchUserIdAndCategory(email);

      if (userDetails) {
        // Update last login platform
        await this.updateLastLoginPlatform(userDetails.userId);

        // Check mandate details
        const mandateCheck = await this.checkMandateDetails(userDetails.userId);

        return {
          success: true,
          isSignedIn: signInResult.isSignedIn === true,
          userDetails: {
            userId: userDetails.userId,
            fullName: userDetails.userfullname || "",
            email: email,
            userCategory: userDetails.userCategory || "",
            stageName: "", // You might need to fetch this separately
            phoneNumber: "", // You might need to fetch this separately
          },
          shouldFillDetails: !mandateCheck.fillMandateDetails,
        };
      }

      return {
        success: false,
        error: "Failed to retrieve user details after merge",
      };
    } catch (error) {
      console.error("Error completing account merge:", error);

      // Provide user-friendly error messages
      if (error.name === "CodeMismatchException") {
        return {
          success: false,
          error: "Incorrect verification code. Please try again.",
        };
      } else if (error.name === "ExpiredCodeException") {
        return {
          success: false,
          error: "Verification code has expired. Please request a new one.",
        };
      }

      return {
        success: false,
        error: error.message || "Failed to complete account merge",
      };
    }
  }
}

// Add hash code method to String prototype
String.prototype.hashCode = function () {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString();
};

export default GoogleAuthService;
