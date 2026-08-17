// Client Component for editing user profile
'use client';

import React, { useState } from 'react';
import { updateProfileAdmin } from './profile.actions';
import { User, GraduationCap, BookOpen, Tag, Loader2, Save, PenLine, CheckCircle2, AlertCircle, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';

const INTEREST_TAGS = [
  'Coding & Tech', 'Music & Bands', 'Dance', 'Photography & Film',
  'Public Speaking & Debating', 'Art & Sketching', 'Sports & Fitness',
  'Gaming & E-sports', 'Literature & Poetry', 'Entrepreneurship',
  'Theatre & Drama', 'Anime & Manga', 'Volunteering & Social Service',
  'Fashion & Styling', 'Astronomy & Science',
];

export default function ProfileEditForm({ initialProfile, onSaveSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [fullName, setFullName] = useState(initialProfile?.full_name || '');
  const [year, setYear] = useState(initialProfile?.year || '1st');
  const [branch, setBranch] = useState(initialProfile?.branch || '');
  const [instagram, setInstagram] = useState(initialProfile?.instagram || '');
  const [photoUrl, setPhotoUrl] = useState(initialProfile?.photo_url || '');
  const [bio, setBio] = useState(initialProfile?.bio || '');
  const [selectedInterests, setSelectedInterests] = useState(initialProfile?.interests || []);

  const fileInputRef = React.useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image size must be less than 5MB.');
        return;
      }
      
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      
      try {
        const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1024, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dqq68y5ep';
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';
        
        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append('upload_preset', uploadPreset);
        
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        });
        
        if (!res.ok) {
          throw new Error('Failed to upload image to Cloudinary. Please check your cloud configuration.');
        }
        
        const data = await res.json();
        if (data.secure_url) {
          setPhotoUrl(data.secure_url);
          
          // Auto-save to prevent data loss trap
          await updateProfileAdmin({
            full_name: fullName,
            year,
            branch,
            bio,
            interests: selectedInterests,
            instagram: instagram,
            photo_url: data.secure_url
          });
          
          setSuccessMsg('Photo uploaded and saved successfully!');
          router.refresh();
        } else {
          throw new Error('Invalid response from Cloudinary.');
        }
      } catch (err) {
        console.error('Cloudinary upload error:', err);
        setErrorMsg(err.message || 'Failed to upload photo to Cloudinary.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
      const res = await updateProfileAdmin({
        full_name: fullName,
        year,
        branch,
        bio,
        interests: selectedInterests,
        instagram: instagram,
        photo_url: photoUrl
      });
      
      if (!res.success) {
        throw new Error(res.error || 'Failed to update profile.');
      }

      setSuccessMsg('Profile updated successfully!');
      router.refresh();
      
      if (onSaveSuccess) {
        onSaveSuccess({
          full_name: fullName,
          year,
          branch,
          bio,
          interests: selectedInterests,
          instagram: instagram,
          photo_url: photoUrl
        });
      }
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  // Premium UI Classes mapping to globals.css variables
  const inputClass = "w-full rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-white/20";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5";
  const iconWrapperClass = "absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none";

  return (
    <form onSubmit={handleSave} className="space-y-8 relative">
      
      {/* Toast Notifications */}
      <div className="absolute -top-16 left-0 right-0 z-50 flex justify-center pointer-events-none">
        {errorMsg && (
          <div className="anim-fade-up flex items-center gap-2 px-4 py-3 rounded-2xl shadow-popup" style={{ background: '#2a1215', border: '1px solid #ff4444', color: '#ff4444' }}>
            <AlertCircle size={16} />
            <span className="text-xs font-bold">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="anim-fade-up flex items-center gap-2 px-4 py-3 rounded-2xl shadow-popup" style={{ background: '#12251a', border: '1px solid #22c55e', color: '#22c55e' }}>
            <CheckCircle2 size={16} />
            <span className="text-xs font-bold">{successMsg}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Full Name</label>
          <div className="relative group">
            <span className={iconWrapperClass} style={{ color: 'var(--text-muted)' }}><User size={16} className="group-focus-within:text-white transition-colors" /></span>
            <input 
              type="text" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              placeholder="e.g. Alex Johnson" 
              className={inputClass} 
              style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
              required 
            />
          </div>
        </div>

        {/* Branch / Course */}
        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Branch / Course</label>
          <div className="relative group">
            <span className={iconWrapperClass} style={{ color: 'var(--text-muted)' }}><BookOpen size={16} className="group-focus-within:text-white transition-colors" /></span>
            <input 
              type="text" 
              value={branch} 
              onChange={(e) => setBranch(e.target.value)} 
              placeholder="e.g. B.Tech CSE" 
              className={inputClass} 
              style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
              required 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Year */}
        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Year of Study</label>
          <div className="relative group">
            <span className={iconWrapperClass} style={{ color: 'var(--text-muted)' }}><GraduationCap size={16} className="group-focus-within:text-white transition-colors" /></span>
            <select 
              value={year} 
              onChange={(e) => setYear(e.target.value)} 
              className={`${inputClass} appearance-none cursor-pointer`}
              style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              <option value="1st">1st Year</option>
              <option value="2nd">2nd Year</option>
              <option value="3rd">3rd Year</option>
              <option value="4th">4th Year</option>
            </select>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Short Bio <span style={{ color: 'var(--text-muted)', fontSize: '9px', fontWeight: 'normal' }}>(Optional)</span></label>
          <div className="relative group">
            <span className={`${iconWrapperClass} top-3`} style={{ color: 'var(--text-muted)' }}><PenLine size={16} className="group-focus-within:text-white transition-colors" /></span>
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              placeholder="What are you currently working on?" 
              className={`${inputClass} resize-none min-h-[50px] pt-3.5`} 
              style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
              rows={1}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instagram Handle */}
        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Instagram Username / Link <span style={{ color: 'var(--text-muted)', fontSize: '9px', fontWeight: 'normal' }}>(Optional)</span></label>
          <div className="relative group">
            <span className={iconWrapperClass} style={{ color: 'var(--text-muted)' }}><Camera size={16} className="group-focus-within:text-white transition-colors" /></span>
            <input 
              type="text" 
              value={instagram} 
              onChange={(e) => setInstagram(e.target.value)} 
              placeholder="e.g. chir_ag897" 
              className={inputClass} 
              style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            />
          </div>
          <p className="text-[9px] text-[var(--text-muted)] mt-1.5 font-bold uppercase tracking-wider">
            Used to show your Instagram profile embed on your public profile page.
          </p>
        </div>

        {/* Profile Image Upload */}
        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Profile Photo <span style={{ color: 'var(--text-muted)', fontSize: '9px', fontWeight: 'normal' }}>(Optional)</span></label>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

          <div className="flex items-center gap-4 p-3 rounded-2xl bg-[var(--bg-overlay)] border border-[var(--border-subtle)]">
            {photoUrl ? (
              <div className="flex items-center gap-3 w-full">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex-shrink-0">
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] font-black uppercase tracking-wider text-[#818cf8] hover:text-[#a5b4fc] text-left transition-colors cursor-pointer"
                  >
                    Change Photo
                  </button>
                  <button 
                    type="button" 
                    onClick={handleRemovePhoto}
                    className="text-[10px] font-black uppercase tracking-wider text-rose-400 hover:text-rose-300 text-left transition-colors cursor-pointer"
                  >
                    Remove Photo
                  </button>
                </div>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-4 border border-dashed border-[var(--border-subtle)] hover:border-neutral-500 rounded-xl transition-all text-xs font-bold text-[var(--text-secondary)] hover:text-white cursor-pointer active:scale-95"
              >
                <Camera size={16} />
                <span>Upload Profile Photo</span>
              </button>
            )}
          </div>
          <p className="text-[9px] text-[var(--text-muted)] mt-1.5 font-bold uppercase tracking-wider">
            Upload a photo to use as your custom avatar. Keep it under 2MB.
          </p>
        </div>
      </div>

      {/* Interactive Chip Cloud */}
      <div className="pt-2">
        <div className="flex justify-between items-end mb-3">
          <div>
            <label className={labelClass} style={{ color: 'var(--text-secondary)' }}><Tag size={12} /> Top 3 Interests</label>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Select exactly 3 tags that describe your campus vibe.</p>
          </div>
          <span 
            className="text-[10px] font-black px-3 py-1.5 rounded-full transition-all" 
            style={
              selectedInterests.length === 3 
                ? { background: 'var(--text-primary)', color: 'var(--bg-base)' } 
                : { background: 'var(--bg-overlay)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }
            }
          >
            {selectedInterests.length}/3
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2.5 p-4 rounded-2xl" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)' }}>
          {INTEREST_TAGS.map((tag) => {
            const sel = selectedInterests.includes(tag);
            return (
              <button 
                key={tag} 
                type="button" 
                onClick={() => handleInterestToggle(tag)}
                className="text-[11px] uppercase tracking-widest py-2 px-4 rounded-full transition-all duration-300 font-bold active:scale-95"
                style={
                  sel 
                    ? { background: 'var(--text-primary)', color: 'var(--bg-base)', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(255,255,255,0.1)' }
                    : { background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }
                }
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-6 border-t flex justify-end" style={{ borderColor: 'var(--border-subtle)' }}>
        <button 
          type="submit" 
          disabled={loading}
          className="btn btn-primary text-xs px-8 py-3.5 shadow-xl hover:-translate-y-0.5"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Profile
        </button>
      </div>
    </form>
  );
}
