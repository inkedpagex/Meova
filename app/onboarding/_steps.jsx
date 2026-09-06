'use client';
import React, { useState, useRef, useEffect } from 'react';
import { GraduationCap, Building2, BookOpen, PenLine, AtSign, ArrowRight, ArrowLeft, ChevronDown } from '@/lib/icons';
import UniversitySelector from '../../components/UniversitySelector';

const YEARS = ['1st', '2nd', '3rd', '4th', '5th'];

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
  'Public Speaking & Debating','Art & Sketching','Sports & Fitness',
  'Gaming & E-sports','Literature & Poetry','Entrepreneurship',
  'Theatre & Drama','Anime & Manga','Volunteering & Social Service','Fashion & Styling','Astronomy & Science',
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
    <div className="space-y-3.5">
      <div>
        <h2 className="text-xl font-bold text-[#1C1917] tracking-tight">Academic Info</h2>
        <p className="text-xs text-[#A8A29E] font-medium">Tell us about your campus life</p>
      </div>

      {/* Year */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#78716C] mb-1.5">
          Year of Study *
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {YEARS.map(y => {
            const isSelected = data.year === y || data.year === `${y} Year`;
            return (
              <button
                key={y} type="button"
                onClick={() => onChange('year', y)}
                className="py-2.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer border"
                style={{
                  background: isSelected ? 'var(--accent)' : '#141414',
                  color: isSelected ? '#fff' : '#A3A3A3',
                  borderColor: isSelected ? 'var(--accent)' : '#2A2A2A',
                }}
              >
                {y}
              </button>
            );
          })}
        </div>
      </div>

      {/* Branch */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#78716C] mb-1">
          Branch / Course *
        </label>
        <div className="relative" ref={branchDropdownRef}>
          <BookOpen size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8A29E] z-10 pointer-events-none"/>
          <button
            type="button"
            onClick={() => setShowBranchDropdown(!showBranchDropdown)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-full border text-xs font-bold outline-none transition-all flex items-center justify-between text-left cursor-pointer"
            style={{ borderColor: data.branch ? 'var(--accent)' : '#2A2A2A', background: '#141414', color: data.branch ? '#FFFFFF' : '#737373' }}
          >
            <span className="truncate">{data.branch || 'Select your course...'}</span>
            <ChevronDown size={15} className={`text-[#A8A29E] transition-transform duration-200 ${showBranchDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Dropdown Menu */}
          {showBranchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#E7E5E4] shadow-xl rounded-2xl overflow-hidden z-50 max-h-52 overflow-y-auto anim-scale-in">
              {BRANCHES.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    onChange('branch', b);
                    setShowBranchDropdown(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs font-semibold transition-colors hover:bg-[var(--accent-tint-10)] hover:text-[var(--accent)] border-b border-[#E7E5E4]/50 last:border-0 cursor-pointer"
                  style={{ 
                    color: data.branch === b ? 'var(--accent)' : '#FFFFFF', 
                    background: data.branch === b ? 'var(--accent-tint-10)' : 'transparent',
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
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#78716C] mb-1">
          University / College
        </label>
        <UniversitySelector
          value={data.university}
          onChange={(val) => onChange('university', val)}
          placeholder="Search college (e.g. DTU, Delhi University, IIT, Bennett...)"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#78716C] mb-1">
          Short Bio <span className="text-[#A8A29E] font-normal normal-case">(optional)</span>
        </label>
        <div className="relative">
          <PenLine size={15} className="absolute left-3.5 top-3 text-[#A8A29E]"/>
          <textarea
            value={data.bio} 
            rows={2}
            onChange={e => onChange('bio', e.target.value)}
            placeholder="What are you interested in on campus?"
            className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-[#E7E5E4] text-xs font-medium outline-none transition-all resize-none focus:border-[var(--accent)] bg-[#FAFAF8] focus:bg-white text-[#1C1917]"
          />
        </div>
      </div>

      <div className="flex gap-2.5 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-5 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider border border-[#E7E5E4] text-[#78716C] hover:bg-[#FAFAF8] transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={14}/> Back
        </button>
        <button
          type="button"
          onClick={onNext} 
          disabled={!canNext}
          className="flex-1 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-xs bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
        >
          <span>Continue to Interests</span>
          <ArrowRight size={14}/>
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
    <div className="space-y-3.5">
      <div>
        <h2 className="text-xl font-bold text-[#1C1917] tracking-tight">Your Interests</h2>
        <p className="text-xs text-[#A8A29E] font-medium">Pick 1–5 tags that match your vibe</p>
      </div>

      {/* Instagram */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#78716C] mb-1">
          Instagram Handle <span className="text-[#A8A29E] font-normal normal-case">(optional)</span>
        </label>
        <div className="relative">
          <AtSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8A29E]"/>
          <input
            type="text" 
            value={data.instagram}
            onChange={e => onChange('instagram', e.target.value.replace('@', ''))}
            placeholder="your_handle"
            className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl border border-[#E7E5E4] text-xs font-bold outline-none transition-all focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 bg-[#FAFAF8] focus:bg-white text-[#1C1917]"
          />
        </div>
      </div>

      {/* Interests */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
            Interests *
          </label>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${data.interests.length >= 1 ? 'bg-[var(--accent-tint-10)] text-[var(--accent)] border border-[var(--accent-tint-20)]' : 'bg-[#FAFAF8] text-[#A8A29E]'}`}>
            {data.interests.length}/5 selected
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-[#FAFAF8] border border-[#E7E5E4]/80 max-h-48 overflow-y-auto">
          {INTEREST_TAGS.map(tag => {
            const sel = data.interests.includes(tag);
            const maxed = data.interests.length >= 5 && !sel;
            return (
              <button
                key={tag} 
                type="button"
                onClick={() => !maxed && toggleInterest(tag)}
                disabled={maxed}
                className="text-[10.5px] uppercase tracking-wider py-1.5 px-3 rounded-full font-bold transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                style={{
                  background: sel ? 'var(--accent)' : '#fff',
                  color: sel ? '#fff' : '#A3A3A3',
                  border: `1px solid ${sel ? 'var(--accent)' : '#2A2A2A'}`,
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold">
          {error}
        </div>
      )}

      <div className="flex gap-2.5 pt-1">
        <button
          type="button"
          onClick={onBack} 
          disabled={loading}
          className="flex items-center gap-1.5 px-5 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider border border-[#E7E5E4] text-[#78716C] hover:bg-[#FAFAF8] transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={14}/> Back
        </button>
        <button
          type="button"
          onClick={onSubmit} 
          disabled={!canSubmit}
          className="flex-1 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-xs bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
        >
          {loading ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"/> Setting up Profile...</>
          ) : (
            <>Complete &amp; Enter Meova</>
          )}
        </button>
      </div>
    </div>
  );
}
