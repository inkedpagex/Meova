'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from '@/lib/icons';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Normalize options to { value, label }
  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-black/10 hover:border-[#F05A00] rounded-2xl px-4 py-3 text-xs font-bold text-black flex items-center justify-between shadow-xs transition-all cursor-pointer active:scale-[0.99] focus:outline-none focus:border-[#F05A00] focus:ring-2 focus:ring-[#F05A00]/10"
      >
        <span className={selectedOption ? 'text-black' : 'text-black/40'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-black/60 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-[#F05A00]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-black/10 rounded-2xl p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto">
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer mb-0.5 last:mb-0 ${
                  isSelected
                    ? 'bg-orange-50 text-[#F05A00] font-black border border-orange-200/80 shadow-2xs'
                    : 'text-black hover:bg-orange-50/50 hover:text-black border border-transparent'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} className="text-[#F05A00] stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
