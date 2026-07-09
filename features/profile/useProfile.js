// Custom hook for connecting Profile edit form UI to profile.api.js.
// No UI rendering here.
import { useState } from 'react';
import { updateProfile } from './profile.api';

export function useProfile(userId) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleUpdate = async (updates) => {
    setSaving(true);
    setError(null);
    try {
      await updateProfile(userId, updates);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      return { success: false, error: err };
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    error,
    update: handleUpdate,
  };
}
