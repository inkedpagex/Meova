// Custom hook for connecting Event RSVP actions UI to events.api.js.
// No UI rendering here.
import { useState } from 'react';
import { rsvpToEvent, cancelRsvp } from './events.api';

export function useEvents(eventId, userId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRSVP = async () => {
    setLoading(true);
    setError(null);
    try {
      await rsvpToEvent(eventId, userId);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to RSVP');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    setError(null);
    try {
      await cancelRsvp(eventId, userId);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to cancel RSVP');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    rsvp: handleRSVP,
    cancel: handleCancel,
  };
}
