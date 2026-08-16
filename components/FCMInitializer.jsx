'use client';
/**
 * FCMInitializer.jsx
 * Thin client component that calls useFCM() hook.
 * Rendered inside layout.js after user is available.
 */
import { useFCM } from '../lib/useFCM';
import { useUserContext } from './providers/UserProvider';

export default function FCMInitializer() {
  const { user } = useUserContext();
  useFCM(user);
  return null; // Renders nothing — side-effect only
}
