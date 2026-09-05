import React, { useState, useRef, useEffect } from 'react';
import { updateProfileAdmin } from './profile.actions';
import {
  User, GraduationCap, BookOpen, Tag, Loader2, Save, PenLine,
  CheckCircle2, AlertCircle, Camera, Zap, Globe, Sparkles, ChevronDown, Check
} from '@/lib/icons';
import { Linkedin, Github, Instagram } from '../../components/ui/SocialIcons';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import UniversitySelector from '../../components/UniversitySelector';

const INTEREST_TAGS = [
  'Coding & Tech', 'Music & Bands', 'Dance', 'Photography & Film',
  'Public Speaking & Debating', 'Art & Sketching', 'Sports & Fitness',
  'Gaming & E-sports', 'Literature & Poetry', 'Entrepreneurship',
  'Theatre & Drama', 'Anime & Manga', 'Volunteering & Social Service',
  'Fashion & Styling', 'Astronomy & Science',
];

const STUDY_YEARS = ['1st', '2nd', '3rd', '4th', '5th', 'Alumni'];

export default function ProfileEditForm({ initialProfile, onSaveSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const yearDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target)) {
        setShowYearDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [fullName, setFullName] = useState(initialProfile?.full_name || '');
  const [year, setYear] = useState(initialProfile?.year?.replace(/\s+Year$/i, '') || '1st');
  const [branch, setBranch] = useState(initialProfile?.branch || '');
  const [university, setUniversity] = useState(initialProfile?.university || 'GLA University, Mathura');
  const [instagram, setInstagram] = useState(initialProfile?.instagram || '');
  const [linkedin, setLinkedin] = useState(initialProfile?.linkedin || '');
  const [github, setGithub] = useState(initialProfile?.github || '');
  const [photoUrl, setPhotoUrl] = useState(initialProfile?.photo_url || '');
  const [bio, setBio] = useState(initialProfile?.bio || '');
  const [rate, setRate] = useState(initialProfile?.rate !== undefined ? String(Math.min(initialProfile.rate, 500)) : '100');
  const [selectedInterests, setSelectedInterests] = useState(initialProfile?.interests || []);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadStage, setPhotoUploadStage] = useState('');

  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 8MB.');
      return;
    }

    setPhotoUploading(true);
    setPhotoUploadStage('Compressing image...');
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const options = { maxSizeMB: 0.25, maxWidthOrHeight: 1024, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      setPhotoUploadStage('Uploading to cloud...');

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dqq68y5ep';
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Meova_unsigned';

      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to upload image. Please try again.');
      }

      const data = await res.json();
      if (data.secure_url) {
        setPhotoUrl(data.secure_url);
        setPhotoUploadStage('Photo saved!');

        // Auto-save photo URL immediately
        await updateProfileAdmin({
          full_name: fullName,
          year,
          branch,
          bio,
          interests: selectedInterests,
          instagram,
          linkedin,
          github,
          photo_url: data.secure_url,
          rate: parseInt(rate, 10) || 100,
        });

        setSuccessMsg('Avatar updated successfully!');
        router.refresh();
      } else {
        throw new Error('Invalid response from image server.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setErrorMsg(err.message || 'Failed to upload photo.');
    } finally {
      setPhotoUploading(false);
      setTimeout(() => setPhotoUploadStage(''), 2000);
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
      if (selectedInterests.length >= 5) {
        setErrorMsg('You can select up to 5 interests.');
        return;
      }
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName?.trim() || !branch?.trim()) {
      return setErrorMsg('Name and course / branch are required.');
    }

    const rateNum = parseInt(rate, 10);
    if (isNaN(rateNum) || rateNum < 10 || rateNum > 500) {
      return setErrorMsg('Meeting rate must be between 10 and 500 Sparks.');
    }

    if (selectedInterests.length < 1 || selectedInterests.length > 5) {
      return setErrorMsg('Please select between 1 and 5 campus interests.');
    }

    const cleanInstagram = instagram.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '');
    const cleanLinkedin = linkedin.trim().replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '');
    const cleanGithub = github.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '');

    setLoading(true);
    try {
      const res = await updateProfileAdmin({
        full_name: fullName.trim(),
        year,
        branch: branch.trim(),
        university: (university || 'GLA University, Mathura').trim(),
        bio: bio.trim(),
        interests: selectedInterests,
        instagram: cleanInstagram,
        linkedin: cleanLinkedin,
        github: cleanGithub,
        photo_url: photoUrl,
        rate: rateNum,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to update profile.');
      }

      setSuccessMsg('Profile changes saved successfully!');
      router.refresh();

      if (onSaveSuccess) {
        onSaveSuccess({
          full_name: fullName.trim(),
          year,
          branch: branch.trim(),
          university: (university || 'GLA University, Mathura').trim(),
          bio: bio.trim(),
          interests: selectedInterests,
          instagram: cleanInstagram,
          linkedin: cleanLinkedin,
          github: cleanGithub,
          photo_url: photoUrl,
          rate: rateNum,
        });
      }

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-7">
      {/* Alert Banners */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-[12px] bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold animate-in fade-in">
          <AlertCircle size={18} className="shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-[12px] bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Avatar Uploader Section ────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-[var(--accent-tint-10)]/60 to-white border border-[var(--accent-tint-20)]/60 text-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <div className="relative group mb-3">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl shadow-purple-500/20 bg-[#FAFAF8] flex items-center justify-center">
            {photoUrl ? (
              <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={36} className="text-[#A8A29E]" />
            )}
          </div>

          {photoUploading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs rounded-full flex flex-col items-center justify-center text-white">
              <Loader2 size={20} className="animate-spin text-[var(--accent)]" />
              <span className="text-[10px] font-bold mt-1">Uploading...</span>
            </div>
          )}

          <button
            type="button"
            disabled={photoUploading}
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--accent)] text-white shadow-md flex items-center justify-center hover:bg-[var(--accent-hover)] transition-transform active:scale-90 cursor-pointer disabled:opacity-50"
            title="Change Avatar"
          >
            <Camera size={14} />
          </button>
        </div>

        <div className="flex items-center gap-3 mt-1">
          <button
            type="button"
            disabled={photoUploading}
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors cursor-pointer"
          >
            {photoUrl ? 'Change Photo' : 'Upload Avatar'}
          </button>
          {photoUrl && (
            <>
              <span className="text-[#A8A29E]">·</span>
              <button
                type="button"
                disabled={photoUploading}
                onClick={handleRemovePhoto}
                className="text-xs font-medium text-[#A8A29E] hover:text-rose-500 transition-colors cursor-pointer"
              >
                Remove
              </button>
            </>
          )}
        </div>
        <p className="text-[11px] text-[#A8A29E] mt-1 font-medium">JPEG or PNG under 8MB</p>
      </div>

      {/* ── Basic Info ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">Academic Identity</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-[#78716C] mb-1.5">Full Name *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A29E]">
                <User size={16} />
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-[12px] py-2.5 pl-10 pr-4 text-sm font-semibold text-[#1C1917] bg-[#FAFAF8]/70 border border-[#E7E5E4]/80 placeholder:text-[#A8A29E] focus:outline-none focus:bg-white focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 transition-all"
                required
              />
            </div>
          </div>

          {/* Course / Branch */}
          <div>
            <label className="block text-xs font-semibold text-[#78716C] mb-1.5">Course / Branch *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A29E]">
                <BookOpen size={16} />
              </span>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. B.Tech Computer Science"
                className="w-full rounded-[12px] py-2.5 pl-10 pr-4 text-sm font-semibold text-[#1C1917] bg-[#FAFAF8]/70 border border-[#E7E5E4]/80 placeholder:text-[#A8A29E] focus:outline-none focus:bg-white focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 transition-all"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* University / College */}
          <div>
            <label className="block text-xs font-semibold text-[#78716C] mb-1.5">University / College *</label>
            <UniversitySelector
              value={university}
              onChange={(val) => setUniversity(val)}
              placeholder="Search campus..."
            />
          </div>

          {/* Year of Study */}
          <div className="relative" ref={yearDropdownRef}>
            <label className="block text-xs font-semibold text-[#78716C] mb-1.5">Year of Study *</label>
            <button
              type="button"
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className="w-full rounded-[12px] py-2.5 pl-10 pr-4 text-sm font-semibold text-[#1C1917] bg-[#FAFAF8]/70 border border-[#E7E5E4]/80 focus:bg-white focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 flex items-center justify-between cursor-pointer transition-all"
            >
              <span className="absolute left-3.5 text-[#A8A29E] pointer-events-none">
                <GraduationCap size={16} />
              </span>
              <span>{year ? `${year} Year` : 'Select Year'}</span>
              <ChevronDown size={16} className={`text-[#A8A29E] transition-transform ${showYearDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showYearDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#E7E5E4] shadow-xl rounded-[12px] p-1.5 z-50 animate-in fade-in duration-150">
                {STUDY_YEARS.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setYear(y);
                      setShowYearDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-xs font-semibold transition-colors cursor-pointer ${
                      year === y ? 'bg-[var(--accent-tint-10)] text-[var(--accent)]' : 'text-[#78716C] hover:bg-[#FAFAF8]'
                    }`}
                  >
                    <span>{y === 'Alumni' ? 'Alumni' : `${y} Year`}</span>
                    {year === y && <Check size={14} className="text-[var(--accent)]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Meetup Hourly Rate */}
        <div>
          <label className="block text-xs font-semibold text-[#78716C] mb-1.5">
            Meetup Rate <span className="text-[#A8A29E] font-normal">(Sparks / Hour)</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--accent)]">
              <Zap size={16} className="fill-current" />
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={rate}
              onChange={(e) => setRate(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="100"
              className="w-full rounded-[12px] py-2.5 pl-10 pr-4 text-sm font-semibold text-[#1C1917] bg-[#FAFAF8]/70 border border-[#E7E5E4]/80 placeholder:text-[#A8A29E] focus:outline-none focus:bg-white focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 transition-all"
              required
            />
          </div>
          <p className="text-[11px] text-[#A8A29E] mt-1 font-medium">10 - 500 Sparks for 1-on-1 sessions</p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-[#78716C] mb-1.5">
            Short Bio <span className="text-[#A8A29E] font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What are you currently learning or building?"
              rows={2}
              maxLength={250}
              className="w-full rounded-[12px] p-3 text-sm font-medium text-[#1C1917] bg-[#FAFAF8]/70 border border-[#E7E5E4]/80 placeholder:text-[#A8A29E] focus:outline-none focus:bg-white focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 transition-all resize-none"
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-[11px] text-[#A8A29E] font-medium">Shown on your campus profile card</span>
            <span className="text-[11px] text-[#A8A29E] font-semibold">{bio.length}/250</span>
          </div>
        </div>
      </div>

      {/* ── Social Profiles ────────────────────────────────────────── */}
      <div className="space-y-4 pt-2">
        <h3 className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">Socials & Portfolio</h3>

        <div className="space-y-3">
          {/* Instagram */}
          <div>
            <label className="block text-xs font-semibold text-[#78716C] mb-1.5">
              Instagram Handle <span className="text-[#A8A29E] font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-rose-500">
                <Instagram size={16} />
              </span>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="e.g. chirag_gla"
                className="w-full rounded-[12px] py-2.5 pl-10 pr-4 text-sm font-medium text-[#1C1917] bg-[#FAFAF8]/70 border border-[#E7E5E4]/80 placeholder:text-[#A8A29E] focus:outline-none focus:bg-white focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 transition-all"
              />
            </div>
          </div>

          {/* LinkedIn */}
          <div>
            <label className="block text-xs font-semibold text-[#78716C] mb-1.5">
              LinkedIn Profile / Username <span className="text-[#A8A29E] font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-600">
                <Linkedin size={16} />
              </span>
              <input
                type="text"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="e.g. in/chirag-sharma or username"
                className="w-full rounded-[12px] py-2.5 pl-10 pr-4 text-sm font-medium text-[#1C1917] bg-[#FAFAF8]/70 border border-[#E7E5E4]/80 placeholder:text-[#A8A29E] focus:outline-none focus:bg-white focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 transition-all"
              />
            </div>
          </div>

          {/* GitHub / Portfolio */}
          <div>
            <label className="block text-xs font-semibold text-[#78716C] mb-1.5">
              GitHub Profile <span className="text-[#A8A29E] font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#78716C]">
                <Github size={16} />
              </span>
              <input
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="e.g. chirag-dev"
                className="w-full rounded-[12px] py-2.5 pl-10 pr-4 text-sm font-medium text-[#1C1917] bg-[#FAFAF8]/70 border border-[#E7E5E4]/80 placeholder:text-[#A8A29E] focus:outline-none focus:bg-white focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Campus Interests ────────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">Campus Interests</h3>
            <p className="text-xs text-[#78716C] mt-0.5 font-medium">Pick 1 to 5 tags that define your vibe</p>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              selectedInterests.length >= 1 && selectedInterests.length <= 5
                ? 'bg-[var(--accent-tint-10)] text-[var(--accent)]'
                : 'bg-[#FAFAF8] text-[#78716C]'
            }`}
          >
            {selectedInterests.length} / 5
          </span>
        </div>

        <div className="flex flex-wrap gap-2 p-4 rounded-3xl bg-[#FAFAF8]/80 border border-[#E7E5E4]/80">
          {INTEREST_TAGS.map((tag) => {
            const isSelected = selectedInterests.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleInterestToggle(tag)}
                className={`text-xs font-semibold px-3.5 py-2 rounded-[10px] transition-all cursor-pointer active:scale-95 border ${
                  isSelected
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm shadow-purple-500/20'
                    : 'bg-white text-[#78716C] border-[#E7E5E4] hover:border-[#E7E5E4] hover:text-[#1C1917]'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Submit Action ─────────────────────────────────────────── */}
      <div className="pt-4 border-t border-[#E7E5E4]">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs uppercase tracking-wider shadow-xs active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  );
}
