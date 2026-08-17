'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';

export default function GoogleAuthProviderWrapper({ children }) {
  // Use a fallback dummy string so the app doesn't fatally crash if the env var is missing on Vercel
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id.apps.googleusercontent.com';

  if (clientId === 'dummy-client-id.apps.googleusercontent.com') {
    console.error('Google Client ID is missing. Google Login will not work. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID.');
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
