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
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold animate-in fade-in">
          <AlertCircle size={18} className="shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Avatar Uploader Section ────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-orange-50/50 to-zinc-50/80 border border-orange-100/60 text-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <div className="relative group mb-3">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl shadow-orange-500/10 bg-zinc-100 flex items-center justify-center">
            {photoUrl ? (
              <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={36} className="text-zinc-400" />
            )}
          </div>

          {photoUploading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs rounded-full flex flex-col items-center justify-center text-white">
              <Loader2 size={20} className="animate-spin text-[#F05A00]" />
              <span className="text-[10px] font-bold mt-1">Uploading...</span>
            </div>
          )}

          <button
            type="button"
            disabled={photoUploading}
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#F05A00] text-white shadow-md flex items-center justify-center hover:bg-[#D94F00] transition-transform active:scale-90 cursor-pointer disabled:opacity-50"
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
            className="text-xs font-bold text-[#F05A00] hover:text-[#D94F00] transition-colors cursor-pointer"
          >
            {photoUrl ? 'Change Photo' : 'Upload Avatar'}
          </button>
          {photoUrl && (
            <>
              <span className="text-zinc-300">·</span>
              <button
                type="button"
                disabled={photoUploading}
                onClick={handleRemovePhoto}
                className="text-xs font-medium text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                Remove
              </button>
            </>
          )}
        </div>
        <p className="text-[11px] text-zinc-400 mt-1 font-medium">JPEG or PNG under 8MB</p>
      </div>

      {/* ── Basic Info ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Academic Identity</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Full Name *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <User size={16} />
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-2xl py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 bg-zinc-50/70 border border-zinc-200/80 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-[#F05A00] focus:ring-4 focus:ring-[#F05A00]/10 transition-all"
                required
              />
            </div>
          </div>

          {/* Course / Branch */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Course / Branch *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <BookOpen size={16} />
              </span>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. B.Tech Computer Science"
                className="w-full rounded-2xl py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 bg-zinc-50/70 border border-zinc-200/80 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-[#F05A00] focus:ring-4 focus:ring-[#F05A00]/10 transition-all"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* University / College */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">University / College *</label>
            <UniversitySelector
              value={university}
              onChange={(val) => setUniversity(val)}
              placeholder="Search campus..."
            />
          </div>

          {/* Year of Study */}
          <div className="relative" ref={yearDropdownRef}>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Year of Study *</label>
            <button
              type="button"
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className="w-full rounded-2xl py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 bg-zinc-50/70 border border-zinc-200/80 focus:bg-white focus:border-[#F05A00] focus:ring-4 focus:ring-[#F05A00]/10 flex items-center justify-between cursor-pointer transition-all"
            >
              <span className="absolute left-3.5 text-zinc-400 pointer-events-none">
                <GraduationCap size={16} />
              </span>
              <span>{year ? `${year} Year` : 'Select Year'}</span>
              <ChevronDown size={16} className={`text-zinc-400 transition-transform ${showYearDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showYearDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-zinc-100 shadow-xl rounded-2xl p-1.5 z-50 animate-in fade-in duration-150">
                {STUDY_YEARS.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setYear(y);
                      setShowYearDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      year === y ? 'bg-orange-50 text-[#F05A00]' : 'text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <span>{y === 'Alumni' ? 'Alumni' : `${y} Year`}</span>
                    {year === y && <Check size={14} className="text-[#F05A00]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Meetup Hourly Rate */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
            Meetup Rate <span className="text-zinc-400 font-normal">(Sparks / Hour)</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F05A00]">
              <Zap size={16} className="fill-current" />
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={rate}
              onChange={(e) => setRate(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="100"
              className="w-full rounded-2xl py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 bg-zinc-50/70 border border-zinc-200/80 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-[#F05A00] focus:ring-4 focus:ring-[#F05A00]/10 transition-all"
              required
            />
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 font-medium">10 - 500 Sparks for 1-on-1 sessions</p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
            Short Bio <span className="text-zinc-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What are you currently learning or building?"
              rows={2}
              maxLength={250}
              className="w-full rounded-2xl p-3.5 text-sm font-medium text-zinc-900 bg-zinc-50/70 border border-zinc-200/80 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-[#F05A00] focus:ring-4 focus:ring-[#F05A00]/10 transition-all resize-none"
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-[11px] text-zinc-400 font-medium">Shown on your campus profile card</span>
            <span className="text-[11px] text-zinc-400 font-semibold">{bio.length}/250</span>
          </div>
        </div>
      </div>

      {/* ── Social Profiles ────────────────────────────────────────── */}
      <div className="space-y-4 pt-2">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Socials & Portfolio</h3>

        <div className="space-y-3">
          {/* Instagram */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Instagram Handle <span className="text-zinc-400 font-normal">(Optional)</span>
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
                className="w-full rounded-2xl py-3 pl-10 pr-4 text-sm font-medium text-zinc-900 bg-zinc-50/70 border border-zinc-200/80 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-[#F05A00] focus:ring-4 focus:ring-[#F05A00]/10 transition-all"
              />
            </div>
          </div>

          {/* LinkedIn */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              LinkedIn Profile / Username <span className="text-zinc-400 font-normal">(Optional)</span>
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
                className="w-full rounded-2xl py-3 pl-10 pr-4 text-sm font-medium text-zinc-900 bg-zinc-50/70 border border-zinc-200/80 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-[#F05A00] focus:ring-4 focus:ring-[#F05A00]/10 transition-all"
              />
            </div>
          </div>

          {/* GitHub / Portfolio */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              GitHub Profile <span className="text-zinc-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-700">
                <Github size={16} />
              </span>
              <input
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="e.g. chirag-dev"
                className="w-full rounded-2xl py-3 pl-10 pr-4 text-sm font-medium text-zinc-900 bg-zinc-50/70 border border-zinc-200/80 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-[#F05A00] focus:ring-4 focus:ring-[#F05A00]/10 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Campus Interests ────────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Campus Interests</h3>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">Pick 1 to 5 tags that define your vibe</p>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              selectedInterests.length >= 1 && selectedInterests.length <= 5
                ? 'bg-orange-100 text-[#F05A00]'
                : 'bg-zinc-100 text-zinc-500'
            }`}
          >
            {selectedInterests.length} / 5
          </span>
        </div>

        <div className="flex flex-wrap gap-2 p-4 rounded-3xl bg-zinc-50/80 border border-zinc-200/80">
          {INTEREST_TAGS.map((tag) => {
            const isSelected = selectedInterests.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleInterestToggle(tag)}
                className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-all cursor-pointer active:scale-95 border ${
                  isSelected
                    ? 'bg-[#F05A00] text-white border-[#F05A00] shadow-sm shadow-orange-500/20'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:text-zinc-900'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Submit Action ─────────────────────────────────────────── */}
      <div className="pt-4 border-t border-zinc-100">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#F05A00] to-[#D94F00] text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  );
}
