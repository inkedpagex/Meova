'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Building2, Search, Check, Sparkles, ChevronDown, X } from '@/lib/icons';
import { UNIVERSITIES, searchUniversities, DEFAULT_UNIVERSITY } from '../lib/constants/universities';

export default function UniversitySelector({
  value = '',
  onChange,
  placeholder = 'Select your campus / university...',
  required = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  const filtered = searchUniversities(searchQuery);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (univName) => {
    onChange?.(univName);
    setSearchQuery('');
    setIsOpen(false);
  };

  const isCustom = searchQuery.trim() && !UNIVERSITIES.some(u => u.name.toLowerCase() === searchQuery.trim().toLowerCase());

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Input Field / Trigger */}
      <div className="relative">
        <Building2
          size={16}
          className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
            isOpen ? 'text-black' : 'text-[#A8A29E]'
          }`}
        />

        <input
          type="text"
          value={isOpen ? searchQuery : value || ''}
          placeholder={value || placeholder}
          onFocus={() => {
            setSearchQuery(value || '');
            setIsOpen(true);
          }}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          className={`w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border text-xs font-bold outline-none transition-all ${
            isOpen
              ? 'border-[#1C1917] ring-2 ring-black/5 bg-white text-[#1C1917]'
              : 'border-[#E7E5E4] bg-[#FAFAF8] focus:bg-white text-[#1C1917]'
          }`}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {isOpen && searchQuery && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSearchQuery('');
              }}
              className="p-1 rounded-full hover:bg-[#FAFAF8] text-[#A8A29E] hover:text-[#78716C]"
            >
              <X size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-[#A8A29E] hover:text-[#78716C] p-0.5"
          >
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-black' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#E7E5E4] shadow-2xl rounded-2xl overflow-hidden z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 divide-y divide-[var(--border-hairline)]">
          
          {/* Quick Suggestion Header */}
          <div className="px-3.5 py-2 bg-[#FAFAF8]/80 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#A8A29E]">
            <span>Popular Campus Hubs</span>
            {searchQuery && <span>{filtered.length} found</span>}
          </div>

          {/* Custom typed option if not exact match */}
          {isCustom && (
            <button
              type="button"
              onClick={() => handleSelect(searchQuery.trim())}
              className="w-full text-left px-3.5 py-2.5 text-xs font-bold transition-colors bg-black/5 hover:bg-black/10 text-[#1C1917] flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-500" />
                <span>Use &quot;{searchQuery.trim()}&quot;</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1C1917] bg-white px-2 py-0.5 rounded-full border border-black/10">
                Custom
              </span>
            </button>
          )}

          {/* List of Universities */}
          {filtered.map((univ) => {
            const isSelected = value === univ.name;
            const isGLA = univ.id === 'gla';

            return (
              <button
                key={univ.id}
                type="button"
                onClick={() => handleSelect(univ.name)}
                className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-black text-white font-bold'
                    : isGLA
                    ? 'bg-[#FAFAF8] hover:bg-black/5 text-[#1C1917] font-bold'
                    : 'hover:bg-[#FAFAF8] text-[#1C1917] font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-white text-black'
                        : isGLA
                        ? 'bg-black text-white shadow-xs'
                        : 'bg-[#FAFAF8] text-[#78716C]'
                    }`}
                  >
                    <Building2 size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className={`truncate text-xs ${isGLA || isSelected ? 'font-bold' : 'font-semibold'}`}>
                      {univ.name}
                    </p>
                    <p className={`text-[10px] font-medium truncate ${isSelected ? 'text-white/70' : 'text-[#A8A29E]'}`}>
                      {univ.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isGLA && !isSelected && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black/5 text-[#1C1917] border border-black/10">
                      <Sparkles size={10} className="text-amber-500" />
                      <span>Featured</span>
                    </span>
                  )}
                  {isSelected && <Check size={14} className="text-white stroke-[3]" />}
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && !isCustom && (
            <div className="p-4 text-center text-xs text-[#A8A29E] font-medium">
              No campus found. Type custom name above to add.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
