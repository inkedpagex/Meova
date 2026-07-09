// Client Component for editing user profile
'use client';

import React, { useState } from 'react';
import { updateProfile } from './profile.api';
import { User, GraduationCap, BookOpen, Tag, Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

const INTEREST_TAGS = [
  'Coding & Tech', 'Music & Bands', 'Dance', 'Photography & Film',
  'Public Speaking & Debating', 'Art & Sketching', 'Sports & Fitness',
  'Gaming & E-sports', 'Literature & Poetry', 'Entrepreneurship',
  'Theatre & Drama', 'Anime & Manga', 'Volunteering & Social Service',
  'Fashion & Styling', 'Astronomy & Science',
];

export default function ProfileEditForm({ initialProfile }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [fullName, setFullName] = useState(initialProfile?.full_name || '');
  const [year, setYear] = useState(initialProfile?.year || '1st');
  const [branch, setBranch] = useState(initialProfile?.branch || '');
  const [selectedInterests, setSelectedInterests] = useState(initialProfile?.interests || []);

  const handleInterestToggle = (tag) => {
    setErrorMsg('');
    setSuccessMsg('');
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== tag));
    } else {
      if (selectedInterests.length >= 3) {
        setErrorMsg('Max 3 interests allowed.');
        return;
      }
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName || !branch) return setErrorMsg('Name and course/branch are required.');
    if (selectedInterests.length !== 3) return setErrorMsg('Please select exactly 3 interests.');

    setLoading(true);
    try {
      await updateProfile(initialProfile.id, {
        full_name: fullName,
        year,
        branch,
        interests: selectedInterests
      });
      setSuccessMsg('Profile updated successfully!');
      router.refresh();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[#111111] border border-[#333333] rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white transition-all placeholder:text-[#555555] font-medium";
  const labelClass = "block text-[10px] font-extrabold text-[#888888] mb-2 uppercase tracking-widest";
  const iconClass = "absolute inset-y-0 left-0 pl-3 flex items-center text-[#555555]";

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {errorMsg && (
        <div className="bg-[#1a0f0f] border border-[#ff4444] text-[#ff4444] text-sm font-medium rounded-xl p-4">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-[#0f1a14] border border-[#22c55e] text-[#22c55e] text-sm font-medium rounded-xl p-4">
          {successMsg}
        </div>
      )}

      <div>
        <label className={labelClass}>Full Name</label>
        <div className="relative">
          <span className={iconClass}><User size={16} /></span>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your Name" className={inputClass} required />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Year</label>
          <div className="relative">
            <span className={iconClass + " pointer-events-none"}><GraduationCap size={16} /></span>
            <select value={year} onChange={(e) => setYear(e.target.value)} className={inputClass + " appearance-none cursor-pointer"}>
              <option value="1st">1st Year</option>
              <option value="2nd">2nd Year</option>
              <option value="3rd">3rd Year</option>
              <option value="4th">4th Year</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Branch / Course</label>
          <div className="relative">
            <span className={iconClass}><BookOpen size={16} /></span>
            <input type="text" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="e.g. B.Tech CSE" className={inputClass} required />
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className={labelClass + " mb-0 flex items-center gap-1.5"}><Tag size={12} /> Top 3 Interests</label>
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${selectedInterests.length === 3 ? 'bg-white text-black' : 'bg-[#111111] text-[#555555] border border-[#222222]'}`}>
            {selectedInterests.length}/3
          </span>
        </div>
        <div className="flex flex-wrap gap-2 p-3 bg-[#111111] border border-[#222222] rounded-2xl max-h-48 overflow-y-auto">
          {INTEREST_TAGS.map((tag) => {
            const sel = selectedInterests.includes(tag);
            return (
              <button key={tag} type="button" onClick={() => handleInterestToggle(tag)}
                className={`text-[10px] uppercase tracking-widest py-2 px-4 rounded-full border transition-all cursor-pointer font-bold ${
                  sel 
                    ? 'bg-white border-white text-black' 
                    : 'bg-black border-[#333333] text-[#888888] hover:border-white hover:text-white'
                }`}>
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button type="submit" disabled={loading}
          className="bg-white hover:bg-gray-200 text-black font-extrabold uppercase tracking-widest rounded-xl px-8 py-3 text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Changes
        </button>
      </div>
    </form>
  );
}
