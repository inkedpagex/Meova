'use client';
import { useState, useEffect } from 'react';
import { Shield, X, ChevronRight } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';

const DISMISS_KEY = 'meova_college_confirm_dismissed_at';
const REDISPLAY_DAYS = 3;

/**
 * CollegeConfirmBanner
 * Shows a non-blocking top banner prompting users to confirm their college
 * if college_confirmed = false. Dismissible — reappears after 3 days.
 * 
 * Props:
 *   userId: string
 *   collegeConfirmed: boolean
 *   currentCollegeId: string | null
 */
export default function CollegeConfirmBanner({ userId, collegeConfirmed, currentCollegeId }) {
  const [visible, setVisible] = useState(false);
  const [showSelect, setShowSelect] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(currentCollegeId || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!userId || collegeConfirmed) return;

    // Check dismiss timestamp
    const dismissed = localStorage.getItem(`${DISMISS_KEY}_${userId}`);
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed, 10)) / 86400000;
      if (daysSince < REDISPLAY_DAYS) return;
    }

    setVisible(true);
  }, [userId, collegeConfirmed]);

  useEffect(() => {
    if (showSelect && colleges.length === 0) {
      fetch('/api/colleges')
        .then(r => r.json())
        .then(d => setColleges(d.colleges || []))
        .catch(() => {});
    }
  }, [showSelect, colleges.length]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(`${DISMISS_KEY}_${userId}`, String(Date.now()));
  };

  const handleSave = async () => {
    if (!selectedCollege) return;
    setSaving(true);
    try {
      const res = await fetch('/api/users/set-college', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ college_id: selectedCollege }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setVisible(false), 2000);
      }
    } catch {}
    finally { setSaving(false); }
  };

  if (!visible) return null;

  const collegeOptions = colleges.map(c => ({
    value: c.id,
    label: `${c.name}${c.city ? `, ${c.city}` : ''}`,
  }));

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#7C3AED] text-white px-4 py-3 shadow-lg">
      <div className="max-w-2xl mx-auto">
        {saved ? (
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-semibold">College saved! An ambassador will verify you soon.</span>
          </div>
        ) : !showSelect ? (
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <p className="flex-1 text-sm font-medium">
              Confirm your college to unlock full campus features.
            </p>
            <button
              onClick={() => setShowSelect(true)}
              className="text-sm font-bold bg-white text-[#7C3AED] px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 flex items-center gap-1"
            >
              Confirm <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={dismiss} className="text-white/70 hover:text-white flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <CustomSelect
                options={[{ value: '', label: 'Select your college...' }, ...collegeOptions]}
                value={selectedCollege}
                onChange={setSelectedCollege}
                placeholder="Select your college"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={!selectedCollege || saving}
              className="text-sm font-bold bg-white text-[#7C3AED] px-4 py-2 rounded-full whitespace-nowrap flex-shrink-0 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setShowSelect(false)} className="text-white/70 hover:text-white flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
