// Custom hook for connecting Circle Join actions UI to circles.api.js.
// No UI rendering here.
import { useState } from 'react';
import { joinCircle, leaveCircle } from './circles.api';

export function useCircles(circleId, userId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleJoin = async () => {
    setLoading(true);
    setError(null);
    try {
      await joinCircle(circleId, userId);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to join circle');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    setLoading(true);
    setError(null);
    try {
      await leaveCircle(circleId, userId);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to leave circle');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    join: handleJoin,
    leave: handleLeave,
  };
}
