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
            isOpen ? 'text-[var(--accent)]' : 'text-[#A8A29E]'
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
              ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/10 bg-white'
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
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--accent)]' : ''}`}
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
              className="w-full text-left px-3.5 py-2.5 text-xs font-bold transition-colors bg-[var(--accent-tint-10)]/60 hover:bg-[var(--accent-tint-10)]/70 text-[var(--accent)] flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--accent)]" />
                <span>Use &quot;{searchQuery.trim()}&quot;</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] bg-white px-2 py-0.5 rounded-full border border-[var(--accent-tint-20)]">
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
                    ? 'bg-[var(--accent-tint-10)] text-[var(--accent)] font-bold'
                    : isGLA
                    ? 'bg-gradient-to-r from-[var(--accent-tint-10)]/40 to-transparent hover:bg-[var(--accent-tint-10)]/70 text-[#1C1917] font-bold'
                    : 'hover:bg-[#FAFAF8] text-[#1C1917] font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isGLA
                        ? 'bg-[var(--accent)] text-white shadow-xs'
                        : isSelected
                        ? 'bg-[var(--accent-tint-10)] text-[var(--accent)]'
                        : 'bg-[#FAFAF8] text-[#78716C]'
                    }`}
                  >
                    <Building2 size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className={`truncate text-xs ${isGLA || isSelected ? 'font-bold' : 'font-semibold'}`}>
                      {univ.name}
                    </p>
                    <p className="text-[10px] text-[#A8A29E] font-medium truncate">
                      {univ.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isGLA && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[var(--accent-tint-10)] text-[var(--accent)] border border-[var(--accent-tint-20)]/60">
                      <Sparkles size={10} />
                      <span>Featured</span>
                    </span>
                  )}
                  {isSelected && <Check size={14} className="text-[var(--accent)] stroke-[3]" />}
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
