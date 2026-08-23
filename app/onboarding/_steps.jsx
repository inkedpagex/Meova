'use client';
import React, { useState, useRef, useEffect } from 'react';
import { GraduationCap, Building2, BookOpen, PenLine, AtSign, ArrowRight, ArrowLeft, ChevronDown } from 'lucide-react';

const YEARS = ['1st Year','2nd Year','3rd Year','4th Year','5th Year'];

const BRANCHES = [
  'B.Tech Computer Science',
  'B.Tech Information Tech',
  'B.Tech Electronics (ECE)',
  'B.Tech Mechanical',
  'B.Tech Civil',
  'BCA (Computer Apps)',
  'BBA (Business Admin)',
  'B.Com (Commerce)',
  'B.Sc (Science)',
  'B.A. (Arts)',
  'B.Des (Design)',
  'B.Arch (Architecture)',
  'M.Tech',
  'MBA',
  'MCA',
  'Other'
];

const INTEREST_TAGS = [
  'Coding & Tech','Music & Bands','Dance','Photography & Film',
  'Public Speaking','Art & Sketching','Sports & Fitness',
  'Gaming & E-sports','Literature & Poetry','Entrepreneurship',
  'Theatre & Drama','Anime & Manga','Volunteering','Fashion & Styling','Astronomy & Science',
];

// ─── Step 2: Academic ─────────────────────────────────────────────────────────
export function Step2({ data, onChange, onNext, onBack }) {
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const branchDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target)) {
        setShowBranchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const canNext = data.year && data.branch.trim();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Academic info 🎓</h2>
        <p className="text-sm text-zinc-400 mt-1 font-medium">Tell us about your campus life</p>
      </div>

      {/* Year */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Year of Study *</label>
        <div className="grid grid-cols-5 gap-2">
          {YEARS.map(y => (
            <button
              key={y} type="button"
              onClick={() => onChange('year', y)}
              className="py-3 rounded-2xl text-xs font-black transition-all active:scale-95"
              style={{
                background: data.year === y ? '#8C3573' : '#f4f4f5',
                color: data.year === y ? '#fff' : '#71717a',
                boxShadow: data.year === y ? '0 4px 14px rgba(140,53,115,0.3)' : 'none',
              }}
            >
              {y.replace(' Year', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Branch */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Branch / Course *</label>
        <div className="relative" ref={branchDropdownRef}>
          <BookOpen size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 z-10 pointer-events-none"/>
          <button
            type="button"
            onClick={() => setShowBranchDropdown(!showBranchDropdown)}
            className="w-full pl-10 pr-4 py-3.5 rounded-2xl border-2 text-sm font-medium outline-none transition-all flex items-center justify-between text-left"
            style={{ borderColor: data.branch ? '#8C3573' : '#e5e7eb', background: '#fafafa', color: data.branch ? '#111' : '#9ca3af' }}
          >
            <span className="truncate">{data.branch || 'Select your course...'}</span>
            <ChevronDown size={16} className={`text-zinc-400 transition-transform duration-200 ${showBranchDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Dropdown Menu */}
          {showBranchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-100 shadow-xl rounded-2xl overflow-hidden z-50 max-h-56 overflow-y-auto anim-scale-in">
              {BRANCHES.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    onChange('branch', b);
                    setShowBranchDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-[#f3f0ff] hover:text-[#8C3573] border-b border-zinc-50 last:border-0"
                  style={{ 
                    color: data.branch === b ? '#8C3573' : '#3f3f46', 
                    background: data.branch === b ? '#f3f0ff' : 'transparent',
                    fontWeight: data.branch === b ? 700 : 500
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* University */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">University / College</label>
        <div className="relative">
          <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"/>
          <input
            type="text" value={data.university}
            onChange={e => onChange('university', e.target.value)}
            placeholder="e.g. Delhi University"
            className="w-full pl-10 pr-4 py-3.5 rounded-2xl border-2 text-sm font-medium outline-none transition-all"
            style={{ borderColor: data.university ? '#8C3573' : '#e5e7eb', background: '#fafafa', color: '#111' }}
          />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Short Bio <span className="text-zinc-300 font-normal normal-case">(optional)</span></label>
        <div className="relative">
          <PenLine size={16} className="absolute left-3.5 top-4 text-zinc-400"/>
          <textarea
            value={data.bio} rows={2}
            onChange={e => onChange('bio', e.target.value)}
            placeholder="What are you currently working on or excited about?"
            className="w-full pl-10 pr-4 py-3.5 rounded-2xl border-2 text-sm font-medium outline-none transition-all resize-none"
            style={{ borderColor: data.bio ? '#8C3573' : '#e5e7eb', background: '#fafafa', color: '#111' }}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-5 py-4 rounded-2xl font-bold text-sm border-2 border-zinc-100 text-zinc-500 hover:border-zinc-200 transition-all active:scale-95"
        >
          <ArrowLeft size={16}/> Back
        </button>
        <button
          onClick={onNext} disabled={!canNext}
          className="flex-1 py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: canNext ? 'linear-gradient(135deg,#8C3573,#b5609d)' : '#e5e7eb', color: canNext ? '#fff' : '#9ca3af', boxShadow: canNext ? '0 8px 24px rgba(140,53,115,0.3)' : 'none' }}
        >
          Continue <ArrowRight size={16}/>
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Vibe ─────────────────────────────────────────────────────────────
export function Step3({ data, onChange, onSubmit, onBack, loading, error }) {
  const toggleInterest = (tag) => {
    const current = data.interests;
    if (current.includes(tag)) onChange('interests', current.filter(t => t !== tag));
    else if (current.length < 5) onChange('interests', [...current, tag]);
  };

  const canSubmit = data.interests.length >= 1 && !loading;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Your vibe ✨</h2>
        <p className="text-sm text-zinc-400 mt-1 font-medium">Pick 1–5 interests that define you</p>
      </div>

      {/* Instagram */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Instagram <span className="text-zinc-300 font-normal normal-case">(optional)</span></label>
        <div className="relative">
          <AtSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"/>
          <input
            type="text" value={data.instagram}
            onChange={e => onChange('instagram', e.target.value.replace('@', ''))}
            placeholder="your_handle"
            className="w-full pl-10 pr-4 py-3.5 rounded-2xl border-2 text-sm font-medium outline-none transition-all"
            style={{ borderColor: data.instagram ? '#8C3573' : '#e5e7eb', background: '#fafafa', color: '#111' }}
          />
        </div>
      </div>

      {/* Interests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Interests *</label>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${data.interests.length >= 1 ? 'bg-[#8C3573] text-white' : 'bg-zinc-100 text-zinc-400'}`}>
            {data.interests.length}/5
          </span>
        </div>
        <div className="flex flex-wrap gap-2 p-4 rounded-2xl bg-zinc-50 border-2 border-zinc-100">
          {INTEREST_TAGS.map(tag => {
            const sel = data.interests.includes(tag);
            const maxed = data.interests.length >= 5 && !sel;
            return (
              <button
                key={tag} type="button"
                onClick={() => !maxed && toggleInterest(tag)}
                disabled={maxed}
                className="text-[11px] uppercase tracking-wider py-2 px-3.5 rounded-xl font-bold transition-all duration-200 active:scale-95 disabled:opacity-40"
                style={{
                  background: sel ? '#8C3573' : '#fff',
                  color: sel ? '#fff' : '#71717a',
                  border: `1.5px solid ${sel ? '#8C3573' : '#e5e7eb'}`,
                  boxShadow: sel ? '0 4px 12px rgba(140,53,115,0.25)' : '0 1px 3px rgba(0,0,0,0.06)',
                  transform: sel ? 'translateY(-1px)' : 'none',
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">Pick at least 1, up to 5</p>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack} disabled={loading}
          className="flex items-center gap-1.5 px-5 py-4 rounded-2xl font-bold text-sm border-2 border-zinc-100 text-zinc-500 hover:border-zinc-200 transition-all active:scale-95"
        >
          <ArrowLeft size={16}/> Back
        </button>
        <button
          onClick={onSubmit} disabled={!canSubmit}
          className="flex-1 py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: canSubmit ? 'linear-gradient(135deg,#8C3573,#b5609d)' : '#e5e7eb', color: canSubmit ? '#fff' : '#9ca3af', boxShadow: canSubmit ? '0 8px 24px rgba(140,53,115,0.3)' : 'none' }}
        >
          {loading ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"/> Saving...</>
          ) : (
            <>🚀 Enter Meetify</>
          )}
        </button>
      </div>
    </div>
  );
}
