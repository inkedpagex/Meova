'use client';
/**
 * useCampusPresence.js
 * Client hook: watches user's GPS position and updates their "isLiveOnCampus"
 * status in Firestore via the /api/users/location API every 5 minutes.
 *
 * Usage:
 *   const { isOnCampus } = useCampusPresence(user, {
 *     lat: 28.6139, lng: 77.2090,  // your campus center coords
 *     radiusMeters: 500,           // how far is "on campus"
 *   });
 *
 * Default campus: GLA University, Mathura (update as needed)
 */
import { useState, useEffect, useRef } from 'react';

// ── Haversine distance formula ────────────────────────────────────────────────
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const UPDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Default: GLA University, Mathura, UP
const DEFAULT_CAMPUS = {
  lat: 27.6676,
  lng: 77.7832,
  radiusMeters: 800, // 800m covers most campuses
};

export function useCampusPresence(user, campusConfig = {}) {
  const campus = { ...DEFAULT_CAMPUS, ...campusConfig };
  const [isOnCampus, setIsOnCampus] = useState(false);
  const [coords, setCoords] = useState(null);
  const lastUpdateRef = useRef(0);
  const watchIdRef = useRef(null);
  const lastStatusRef = useRef(null); // Prevent redundant API calls

  useEffect(() => {
    if (!user?.uid) return;
    if (typeof window === 'undefined') return;
    if (!navigator.geolocation) return;

    const sendUpdate = async (onCampus) => {
      // Throttle: don't send if status hasn't changed
      if (lastStatusRef.current === onCampus) return;
      // Throttle: don't send more often than UPDATE_INTERVAL_MS
      const now = Date.now();
      if (now - lastUpdateRef.current < UPDATE_INTERVAL_MS && lastStatusRef.current !== null) return;

      lastUpdateRef.current = now;
      lastStatusRef.current = onCampus;

      try {
        await fetch('/api/users/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isLiveOnCampus: onCampus }),
        });
      } catch {
        // Non-fatal
      }
    };

    const handlePosition = (position) => {
      const { latitude, longitude } = position.coords;
      setCoords({ lat: latitude, lng: longitude });

      const distance = haversineDistance(latitude, longitude, campus.lat, campus.lng);
      const onCampus = distance <= campus.radiusMeters;
      setIsOnCampus(onCampus);
      sendUpdate(onCampus);
    };

    const handleError = () => {
      // Geolocation denied or unavailable — set offline
      sendUpdate(false);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );

    // Also fire an initial check
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 120000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      // Mark offline when component unmounts (page closed)
      if (lastStatusRef.current === true) {
        fetch('/api/users/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isLiveOnCampus: false }),
          keepalive: true, // ensures the request completes even if page unloads
        }).catch(() => {});
      }
    };
  }, [user?.uid, campus.lat, campus.lng, campus.radiusMeters]);

  return { isOnCampus, coords };
}
