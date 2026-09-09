// Custom hook for connecting Auth UI to auth.api.js.
// No UI rendering here.
import { useState } from 'react';
import { signUpUser, logInUser, logOutUser, logInWithGoogle } from './auth.api';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignUp = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await signUpUser(userData);
      return { success: true, data };
    } catch (err) {
      setError(err.message || 'Signup failed');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const handleLogIn = async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await logInUser({ email, password });
      return { success: true, data };
    } catch (err) {
      setError(err.message || 'Login failed');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogIn = async (idToken = null, accessToken = null, termsAccepted = false, termsVersion = '2026.1') => {
    setLoading(true);
    setError(null);
    try {
      const data = await logInWithGoogle(idToken, accessToken, termsAccepted, termsVersion);
      return { success: true, data };
    } catch (err) {
      console.error("Google Auth error:", err);
      let errMsg = err.message || 'Google login failed';
      if (err.code === 'auth/operation-not-allowed') {
        errMsg = "Google Sign-In is not enabled. Go to Firebase Console → Authentication → Sign-in Method and enable Google.";
      } else if (errMsg.includes('is not valid JSON') || errMsg.includes('Unexpected token')) {
        errMsg = "Unable to connect to authentication server. Please refresh and try again.";
      }
      setError(errMsg);
      return { success: false, error: { message: errMsg } };
    } finally {
      setLoading(false);
    }
  };

  const handleLogOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await logOutUser();
      return { success: true };
    } catch (err) {
      setError(err.message || 'Logout failed');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    signUp: handleSignUp,
    logIn: handleLogIn,
    logInWithGoogle: handleGoogleLogIn,
    logOut: handleLogOut,
  };
}
