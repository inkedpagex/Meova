'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Code, Music, Dumbbell, Camera, Rocket, Palette, Gamepad2, 
  BookOpen, Star, Sparkles, X, ChevronRight, Zap
} from '@/lib/icons';
import { getUserAvatarUrl, getCartoonAvatar } from '../utils/avatar';
import BookCoffeeButton from '../features/users/BookCoffeeButton';

const INTEREST_META = {
  'Coding & Tech':        { Icon: Code,        color: '#3b82f6' },
  'Music & Bands':        { Icon: Music,        color: '#5B21B6' },
  'Sports & Fitness':     { Icon: Dumbbell,     color: '#22c55e' },
  'Photography & Film':   { Icon: Camera,       color: '#06b6d4' },
  'Entrepreneurship':     { Icon: Rocket,       color: '#f97316' },
  'Art & Sketching':      { Icon: Palette,      color: '#ec4899' },
  'Gaming & E-sports':    { Icon: Gamepad2,     color: '#a78bfa' },
  'Literature & Poetry':  { Icon: BookOpen,     color: '#3b82f6' },
  'Dance':                { Icon: Star,         color: '#ec4899' },
};

function getAvatar(user) {
  if (user && typeof user === 'object') return getUserAvatarUrl(user);
  return getCartoonAvatar(user);
}

export default function ProfileHighlightsSection({ interests = [], allUsers = [], currentUserId }) {
  const router = useRouter();
  const [selectedInterest, setSelectedInterest] = useState(null);

  if (!interests || interests.length === 0) return null;

  // Filter users matching selected interest (excluding profile owner)
  const matchingUsers = selectedInterest
    ? allUsers.filter(u => 
        u.id !== currentUserId && 
        (u.interests || []).some(i => i.toLowerCase().includes(selectedInterest.toLowerCase()) || selectedInterest.toLowerCase().includes(i.toLowerCase()))
      )
    : [];

  const handleInterestClick = (interest) => {
    if (selectedInterest === interest) {
      setSelectedInterest(null); // Toggle off
    } else {
      setSelectedInterest(interest);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#A8A29E]">
          Highlights &amp; Interests
        </p>
        {selectedInterest && (
          <button 
            onClick={() => setSelectedInterest(null)}
            className="text-[10px] font-bold text-[#6D28D9] hover:text-[#5B21B6] flex items-center gap-1 cursor-pointer"
          >
            Clear Filter <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Interest Circles Row */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {interests.map(interest => {
          const meta = INTEREST_META[interest] || { Icon: Star, color: '#6D28D9' };
          const { Icon } = meta;
          const isSelected = selectedInterest === interest;

          return (
            <button
              key={interest}
              type="button"
              onClick={() => handleInterestClick(interest)}
              className={`flex flex-col items-center flex-shrink-0 cursor-pointer group transition-all outline-none focus:outline-none ${
                isSelected ? 'scale-105' : 'hover:scale-105'
              }`}
            >
              <div 
                className={`w-14 h-14 rounded-full transition-all ${
                  isSelected 
                    ? 'p-[2.5px] bg-[#6D28D9] shadow-md shadow-[#6D28D9]/25' 
                    : 'p-[2px] border-2 border-[#E7E5E4] group-hover:border-[#E4D9F7]'
                }`}
              >
                <div 
                  className={`w-full h-full rounded-full flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-[#F3EEFC]' : 'bg-[#FAFAF8]'
                  }`}
                  style={{ color: meta.color }}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <span className={`text-[10px] font-bold max-w-[70px] truncate text-center mt-1 transition-colors ${
                isSelected ? 'text-[#5B21B6] font-extrabold' : 'text-[#78716C]'
              }`}>
                {interest}
              </span>
            </button>
          );
        })}
      </div>

      {/* Suggested Students Drawer / Section */}
      {selectedInterest && (
        <div className="mt-4 p-4 rounded-2xl bg-[#F3EEFC]/60 border border-[#E4D9F7] anim-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#6D28D9]" />
              <h3 className="text-xs font-bold text-[#1C1917] tracking-tight">
                Students into <span className="text-[#6D28D9]">{selectedInterest}</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3EEFC] text-[#6D28D9]">
                {matchingUsers.length}
              </span>
            </div>
            
            <Link 
              href={`/discover?interest=${encodeURIComponent(selectedInterest)}`}
              className="text-[10px] font-bold text-[#6D28D9] hover:underline flex items-center gap-0.5"
            >
              Explore All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {matchingUsers.length === 0 ? (
            <div className="text-center py-6 bg-white/80 rounded-2xl border border-[#E4D9F7]">
              <p className="text-xs font-semibold text-[#78716C]">
                No other students tagged with <span className="font-bold text-[#6D28D9]">{selectedInterest}</span> yet.
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {matchingUsers.map(student => (
                <div
                  key={student.id}
                  onClick={() => router.push(`/users/${student.id}`)}
                  className="w-[150px] flex-shrink-0 bg-white rounded-2xl p-3 border border-[#E7E5E4] flex flex-col items-center text-center cursor-pointer hover:border-[#E4D9F7] hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden mb-2 relative border-2 border-[#E4D9F7] group-hover:scale-105 transition-transform">
                    <img 
                      src={getAvatar(student)} 
                      alt={student.full_name || 'Student'} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <span className="text-xs font-bold text-[#1C1917] truncate max-w-full group-hover:text-[#6D28D9] transition-colors">
                    {student.full_name || 'Student'}
                  </span>
                  <span className="text-[9.5px] font-semibold text-[#A8A29E] mt-0.5 truncate">
                    {student.year ? `${student.year} Yr` : ''} {student.branch ? `· ${student.branch}` : ''}
                  </span>
                  <BookCoffeeButton 
                    targetUserId={student.id}
                    targetName={student.full_name}
                    targetPhoto={getUserAvatarUrl(student)}
                    isLoggedIn={!!currentUserId}
                    accentColor="#6D28D9"
                    completedMeets={student.completed_meets_count || 0}
                    renderButton={({ onClick }) => (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClick(e);
                        }}
                        className="mt-2 w-full py-1.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] transition-colors text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                      >
                        Meet 100 <Zap className="w-3 h-3 text-yellow-300 fill-current" />
                      </button>
                    )}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
