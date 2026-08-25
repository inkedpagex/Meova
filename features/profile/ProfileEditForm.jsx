// Client Component for editing user profile
'use client';

import React, { useState } from 'react';
import { updateProfileAdmin } from './profile.actions';
import { User, GraduationCap, BookOpen, Tag, Loader2, Save, PenLine, CheckCircle2, AlertCircle, Camera, Zap } from 'lucide-react';
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
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const yearDropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target)) {
        setShowYearDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [fullName, setFullName] = useState(initialProfile?.full_name || '');
  const [year, setYear] = useState(initialProfile?.year || '1st');
  const [branch, setBranch] = useState(initialProfile?.branch || '');
  const [instagram, setInstagram] = useState(initialProfile?.instagram || '');
  const [photoUrl, setPhotoUrl] = useState(initialProfile?.photo_url || '');
  const [bio, setBio] = useState(initialProfile?.bio || '');
  const [rate, setRate] = useState(initialProfile?.rate || '100');
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
            photo_url: data.secure_url,
            rate: parseInt(rate, 10) || 100
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
    
    const rateNum = parseInt(rate, 10);
    if (isNaN(rateNum) || rateNum < 50 || rateNum > 1000) {
      return setErrorMsg('Meeting rate must be between 50 and 1000 Sparks.');
    }

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
        photo_url: photoUrl,
        rate: parseInt(rate, 10) || 100
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
          photo_url: photoUrl,
          rate: parseInt(rate, 10) || 100
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

  // Premium UI Classes
  const inputClass = "w-full rounded-2xl py-4 pl-12 pr-5 text-[13px] font-black text-zinc-900 bg-[#f8fafc] border-[1.5px] border-[#e2e8f0] transition-all duration-300 placeholder:text-zinc-400/80 focus:outline-none focus:bg-white focus:border-[#F05A00] focus:ring-4 focus:ring-[#F05A00]/15 hover:border-[#cbd5e1]";
  const labelClass = "block text-[11px] font-black text-zinc-700 uppercase tracking-[0.15em] mb-2.5 flex items-center gap-2 ml-1";
  const iconWrapperClass = "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none";

  return (
    <form noValidate onSubmit={handleSave} className="space-y-10 relative">
      
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
          <label className={labelClass}>Full Name</label>
          <div className="relative group">
            <span className={iconWrapperClass}><User size={16} className="text-zinc-400 group-focus-within:text-[#9e4685] transition-colors" /></span>
            <input 
              type="text" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              placeholder="e.g. Alex Johnson" 
              className={inputClass} 
              required 
            />
          </div>
        </div>

        {/* Branch / Course */}
        <div>
          <label className={labelClass}>Branch / Course</label>
          <div className="relative group">
            <span className={iconWrapperClass}><BookOpen size={16} className="text-zinc-400 group-focus-within:text-[#9e4685] transition-colors" /></span>
            <input 
              type="text" 
              value={branch} 
              onChange={(e) => setBranch(e.target.value)} 
              placeholder="e.g. B.Tech CSE" 
              className={inputClass} 
              required 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Year */}
        <div>
          <label className={labelClass}>Year of Study</label>
          <div className="relative group" ref={yearDropdownRef}>
            <span className={iconWrapperClass}><GraduationCap size={16} className="text-zinc-400 group-focus-within:text-[#9e4685] transition-colors" /></span>
            <button 
              type="button"
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className={`${inputClass} flex items-center justify-between cursor-pointer`}
            >
              <span>{year === '1st' ? '1st Year' : year === '2nd' ? '2nd Year' : year === '3rd' ? '3rd Year' : year === '4th' ? '4th Year' : 'Select Year'}</span>
              <svg className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${showYearDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            
            {showYearDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-100 shadow-[0_12px_40px_rgba(0,0,0,0.08)] rounded-2xl overflow-hidden z-50 p-1">
                {['1st', '2nd', '3rd', '4th'].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => { setYear(y); setShowYearDropdown(false); }}
                    className={`w-full text-left px-4 py-3 text-sm font-bold transition-all rounded-xl cursor-pointer ${
                      year === y ? 'bg-[#fcf6fa] text-[#D94F00]' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                    }`}
                  >
                    {y} Year
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className={labelClass}>Short Bio <span className="text-zinc-400 text-[10px] font-bold ml-1">(Optional)</span></label>
          <div className="relative group">
            <span className={`${iconWrapperClass} top-[18px]`}><PenLine size={16} className="text-zinc-400 group-focus-within:text-[#F05A00] transition-colors" /></span>
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              placeholder="What are you currently working on?" 
              className={`${inputClass} resize-none min-h-[60px] pt-4 leading-relaxed`} 
              rows={2}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instagram Handle */}
        <div>
          <label className={labelClass}>Instagram Username / Link <span className="text-zinc-400 text-[9px] font-bold ml-1">(Optional)</span></label>
          <div className="relative group">
            <span className={iconWrapperClass}><Camera size={16} className="text-zinc-400 group-focus-within:text-[#9e4685] transition-colors" /></span>
            <input 
              type="text" 
              value={instagram} 
              onChange={(e) => setInstagram(e.target.value)} 
              placeholder="e.g. chir_ag897" 
              className={inputClass} 
            />
          </div>
          <p className="text-[9px] text-zinc-400 mt-2 font-black uppercase tracking-wider ml-1">
            Used to show your Instagram profile embed on your public profile page.
          </p>
        </div>

        {/* Meeting Rate */}
        <div>
          <label className={labelClass}>Meeting Rate (Sparks)</label>
          <div className="relative group">
            <span className={iconWrapperClass}><Zap size={16} className="text-zinc-400 group-focus-within:text-[#9e4685] transition-colors" /></span>
            <input 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]*"
              value={rate} 
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setRate(val);
              }} 
              placeholder="100" 
              className={inputClass} 
              required 
            />
          </div>
          <p className="text-[9px] text-zinc-400 mt-2 font-black uppercase tracking-wider ml-1">
            Set between 50 and 1000 Sparks. This is what users pay to book a coffee session with you.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Image Upload */}
        <div>
          <label className={labelClass}>Profile Photo <span className="text-zinc-400 text-[9px] font-bold ml-1">(Optional)</span></label>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

          <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#f8fafc] border-[1.5px] border-dashed border-[#cbd5e1] hover:border-[#F05A00]/40 hover:bg-[#F05A00]/5 transition-all h-[64px]">
            {photoUrl ? (
              <div className="flex items-center gap-3 w-full">
                <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center justify-between flex-1 gap-2 pr-2">
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-black uppercase tracking-wider text-[#F05A00] hover:text-[#D94F00] transition-colors cursor-pointer"
                  >
                    Change
                  </button>
                  <button 
                    type="button" 
                    onClick={handleRemovePhoto}
                    className="text-[11px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 h-full text-[13px] font-black text-[#F05A00] hover:text-[#D94F00] transition-colors cursor-pointer active:scale-95"
              >
                <Camera size={16} />
                <span>Upload a sleek avatar</span>
              </button>
            )}
          </div>
          <p className="text-[10px] text-zinc-400 mt-2.5 font-bold uppercase tracking-widest ml-1">
            Keep it under 2MB. Square images look best.
          </p>
        </div>
      </div>

      <div className="pt-2">
        <div className="flex justify-between items-end mb-4">
          <div>
            <label className={labelClass}><Tag size={14} className="text-[#F05A00]" /> Top 3 Interests</label>
            <p className="text-[11px] font-bold text-zinc-400 ml-1">Select exactly 3 tags that describe your campus vibe.</p>
          </div>
          <span className={`text-[11px] font-black px-3.5 py-1.5 rounded-full transition-all ${
            selectedInterests.length === 3
              ? 'bg-[#F05A00] text-white shadow-lg shadow-[#F05A00]/30'
              : 'bg-zinc-100 text-zinc-400'
          }`}>
            {selectedInterests.length}/3
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2.5 p-6 rounded-[24px] bg-[#f8fafc] border-[1.5px] border-[#e2e8f0]">
          {INTEREST_TAGS.map((tag) => {
            const sel = selectedInterests.includes(tag);
            return (
              <button 
                key={tag} 
                type="button" 
                onClick={() => handleInterestToggle(tag)}
                className={`text-[11px] uppercase tracking-widest py-2.5 px-4 rounded-full transition-all duration-300 font-black active:scale-95 border-[1.5px] cursor-pointer ${
                  sel 
                    ? 'bg-white text-[#F05A00] border-[#F05A00] shadow-[0_4px_16px_rgba(140,53,115,0.2)] -translate-y-0.5'
                    : 'bg-white border-transparent text-zinc-500 shadow-sm hover:border-[#cbd5e1] hover:text-zinc-700 hover:-translate-y-0.5'
                }`}
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
          className="flex items-center gap-2 bg-gradient-to-r from-[#F05A00] to-[#D94F00] text-white text-[13px] font-black uppercase tracking-widest px-8 py-4 rounded-2xl shadow-[0_8px_20px_rgba(140,53,115,0.3)] hover:shadow-[0_10px_25px_rgba(140,53,115,0.4)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Profile
        </button>
      </div>
    </form>
  );
}
