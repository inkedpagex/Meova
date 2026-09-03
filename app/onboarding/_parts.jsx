'use client';
import React, { useState, useRef, useCallback } from 'react';
import { Camera, User, AtSign, CheckCircle2, XCircle, Loader2, ArrowRight } from '@/lib/icons';
import imageCompression from 'browser-image-compression';

const INTEREST_TAGS = [
  'Coding & Tech','Music & Bands','Dance','Photography & Film',
  'Public Speaking & Debating','Art & Sketching','Sports & Fitness',
  'Gaming & E-sports','Literature & Poetry','Entrepreneurship',
  'Theatre & Drama','Anime & Manga','Volunteering & Social Service','Fashion & Styling','Astronomy & Science',
];

const YEARS = ['1st', '2nd', '3rd', '4th', '5th'];

// ─── Step Progress Bar ───────────────────────────────────────────────────────
function StepBar({ step }) {
  const steps = ['Identity','Academic','Vibe'];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                done ? 'bg-emerald-500 text-white' :
                active ? 'bg-[#F05A00] text-white shadow-lg shadow-orange-200/50' :
                'bg-zinc-100 text-zinc-400'
              }`}>
                {done ? <CheckCircle2 size={16}/> : idx}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${active ? 'text-[#F05A00]' : 'text-zinc-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 rounded-full transition-all duration-500 ${step > idx ? 'bg-emerald-400' : step > i ? 'bg-[#F05A00]' : 'bg-zinc-100'}`}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Step 1: Identity ────────────────────────────────────────────────────────
function Step1({ data, onChange, onNext }) {
  const [usernameStatus, setUsernameStatus] = useState('idle'); // idle | checking | ok | taken | invalid
  const [usernameMsg, setUsernameMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState(''); // 'Compressing image...' | 'Uploading to cloud...' | 'Photo uploaded!'
  const [uploadErr, setUploadErr] = useState('');
  const fileRef = useRef(null);
  const debounceRef = useRef(null);

  const checkUsername = useCallback(async (val) => {
    const clean = val.toLowerCase().trim();
    if (!clean) {
      setUsernameStatus('idle'); setUsernameMsg(''); return;
    }
    if (clean.length < 5) {
      setUsernameStatus('invalid'); setUsernameMsg('Minimum 5 characters required'); return;
    }
    if (!/^[a-z]/.test(clean)) {
      setUsernameStatus('invalid'); setUsernameMsg('Must start with a letter (a-z)'); return;
    }
    if (!/^[a-z][a-z0-9_]{4,19}$/.test(clean)) {
      setUsernameStatus('invalid'); setUsernameMsg('Only letters, numbers, underscores (5-20 chars)'); return;
    }
    const digitCount = (clean.match(/\d/g) || []).length;
    if (digitCount < 2) {
      setUsernameStatus('invalid'); setUsernameMsg('Must contain at least 2 digits / numbers (e.g. chirag_04)'); return;
    }
    setUsernameStatus('checking'); setUsernameMsg('Checking...');
    try {
      const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(clean)}`);
      const json = await res.json();
      if (json.available) { setUsernameStatus('ok'); setUsernameMsg('@' + clean + ' is available'); }
      else { setUsernameStatus('taken'); setUsernameMsg(json.error || 'Username not available'); }
    } catch { setUsernameStatus('idle'); setUsernameMsg(''); }
  }, []);

  const handleUsernameChange = (e) => {
    const val = e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase();
    onChange('username', val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => checkUsername(val), 250);
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setUploadErr('Image must be under 8MB'); return; }
    setUploading(true); setUploadStage('Compressing image...'); setUploadErr('');
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.25, maxWidthOrHeight: 800, useWebWorker: true });
      setUploadStage('Uploading to cloud...');
      const fd = new FormData();
      fd.append('file', compressed);
      fd.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Meova_unsigned');
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dqq68y5ep';
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
      const json = await res.json();
      if (json.secure_url) {
        onChange('photo_url', json.secure_url);
        setUploadStage('Photo uploaded!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      setUploadErr(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadStage(''), 2000);
    }
  };

  const canNext = data.full_name.trim() && data.username && usernameStatus === 'ok' && data.photo_url && data.gender;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-zinc-950 tracking-tight">Set your identity</h2>
        <p className="text-xs text-zinc-400 font-medium">How other students will see you on campus</p>
      </div>

      {/* Photo Upload */}
      <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80">
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          className={`relative w-16 h-16 rounded-2xl overflow-hidden group transition-all hover:scale-105 active:scale-95 shrink-0 bg-white ${
            uploading ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'
          }`}
          style={{ border: data.photo_url ? '2.5px solid #F05A00' : '2px dashed #fed7aa' }}
        >
          {data.photo_url ? (
            <img 
              src={data.photo_url} 
              alt="avatar" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => onChange('photo_url', '')}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#F05A00]">
              <Camera size={20} />
            </div>
          )}

          {/* In-box upload loader */}
          {uploading && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1 z-20 text-white">
              <Loader2 size={16} className="text-[#F05A00] animate-spin" />
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading}/>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-zinc-900 truncate">
            {data.photo_url ? 'Profile Photo Added' : 'Upload Profile Photo *'}
          </p>
          <button
            type="button"
            onClick={() => !uploading && fileRef.current?.click()}
            className="text-[11px] font-black text-[#F05A00] hover:underline mt-0.5 block"
          >
            {uploading ? (uploadStage || 'Uploading...') : (data.photo_url ? 'Tap to change photo' : 'Choose photo from gallery')}
          </button>
          {uploadErr && <p className="text-[10px] text-rose-500 font-bold mt-0.5">{uploadErr}</p>}
        </div>
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-600 mb-1">
          Full Name *
        </label>
        <div className="relative">
          <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"/>
          <input
            type="text" 
            value={data.full_name}
            onChange={e => onChange('full_name', e.target.value)}
            placeholder="e.g. Chirag Sharma"
            className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl border border-zinc-200 text-xs font-bold outline-none transition-all focus:border-[#F05A00] focus:ring-2 focus:ring-[#F05A00]/10 bg-zinc-50 focus:bg-white text-zinc-950"
          />
        </div>
      </div>

      {/* Username */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-600 mb-1">
          Username *
        </label>
        <div className="relative">
          <AtSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"/>
          <input
            type="text" 
            value={data.username} 
            maxLength={20}
            onChange={handleUsernameChange}
            placeholder="chirag_04"
            className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-zinc-200 text-xs font-bold outline-none transition-all focus:border-[#F05A00] focus:ring-2 focus:ring-[#F05A00]/10 bg-zinc-50 focus:bg-white text-zinc-950"
            style={{
              borderColor: usernameStatus === 'ok' ? '#10b981' : usernameStatus === 'taken' || usernameStatus === 'invalid' ? '#f43f5e' : undefined,
            }}
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {usernameStatus === 'checking' && <Loader2 size={15} className="text-zinc-400 animate-spin"/>}
            {usernameStatus === 'ok' && <CheckCircle2 size={15} className="text-emerald-500"/>}
            {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <XCircle size={15} className="text-rose-500"/>}
          </div>
        </div>
        {usernameMsg && (
          <p suppressHydrationWarning className={`text-[10.5px] font-bold mt-1 ${usernameStatus === 'ok' ? 'text-emerald-600' : 'text-rose-500'}`}>
            {usernameMsg}
          </p>
        )}
        <p suppressHydrationWarning className="text-[9.5px] text-zinc-400 mt-0.5">Start with a letter · 2+ digits (e.g. chirag_04)</p>
      </div>

      {/* Gender Selection */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-600 mb-1">
          Gender * <span className="text-zinc-400 font-medium normal-case">(Private)</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'male', label: 'Male' },
            { id: 'female', label: 'Female' },
            { id: 'other', label: 'Other' },
          ].map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onChange('gender', g.id)}
              className={`py-2 px-2 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                data.gender === g.id
                  ? 'border-[#F05A00] bg-orange-50 text-[#F05A00] shadow-xs'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onNext} 
        disabled={!canNext}
        className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 mt-2"
        style={{ background: canNext ? 'linear-gradient(135deg,#F05A00,#D94F00)' : '#e5e7eb', color: canNext ? '#fff' : '#9ca3af' }}
      >
        <span>Continue to Academic Info</span>
        <ArrowRight size={14}/>
      </button>
    </div>
  );
}

export { Step1, StepBar, INTEREST_TAGS, YEARS };
