'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Code, Music, Dumbbell, Camera, Rocket, Palette, Gamepad2, 
  BookOpen, Star, Sparkles, X, ChevronRight, Zap, Users
} from '@/lib/icons';
import { getUserAvatarUrl, getCartoonAvatar } from '../utils/avatar';
import BookCoffeeButton from '../features/users/BookCoffeeButton';

const INTEREST_META = {
  'Coding & Tech':        { Icon: Code },
  'Music & Bands':        { Icon: Music },
  'Sports & Fitness':     { Icon: Dumbbell },
  'Photography & Film':   { Icon: Camera },
  'Entrepreneurship':     { Icon: Rocket },
  'Art & Sketching':      { Icon: Palette },
  'Gaming & E-sports':    { Icon: Gamepad2 },
  'Literature & Poetry':  { Icon: BookOpen },
  'Dance':                { Icon: Star },
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
      setSelectedInterest(null);
    } else {
      setSelectedInterest(interest);
    }
  };

  return (
    <div className="rounded-[24px] p-4 sm:p-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Interests &amp; Skills
          </span>
          <span className="ml-2 text-[10px] font-bold text-[var(--accent)] bg-[var(--accent-tint-10)] px-2 py-0.5 rounded-full">
            {interests.length} topics
          </span>
        </div>
        {selectedInterest ? (
          <button 
            type="button"
            onClick={() => setSelectedInterest(null)}
            className="text-[11px] font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Clear Filter</span>
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="text-[10.5px] font-medium text-[var(--text-muted)] flex items-center gap-1">
            <Sparkles size={11} className="text-[var(--accent)]" /> Tap to explore peers
          </span>
        )}
      </div>

      {/* Interactive Interest Pill Capsules (No truncation, High contrast) */}
      <div className="flex flex-wrap gap-2">
        {interests.map(interest => {
          const meta = INTEREST_META[interest] || { Icon: Star };
          const { Icon } = meta;
          const isSelected = selectedInterest === interest;

          return (
            <button
              key={interest}
              type="button"
              onClick={() => handleInterestClick(interest)}
              className={`px-3.5 py-2 rounded-full text-[12px] font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs select-none border ${
                isSelected
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md shadow-[var(--accent)]/20'
                  : 'bg-[var(--bg-base)] text-[var(--text-secondary)] border-[var(--border-hairline)] hover:border-[var(--accent-tint-20)] hover:text-[var(--accent)]'
              }`}
            >
              <Icon size={14} className={isSelected ? 'text-white' : 'text-[var(--accent)]'} />
              <span>{interest}</span>
              {isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Suggested Students Drawer / Section */}
      {selectedInterest && (
        <div className="mt-4 p-4 rounded-[20px] bg-[var(--accent-tint-10)]/50 border border-[var(--accent-tint-20)] anim-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-[12.5px] font-bold text-[var(--text-primary)] tracking-tight">
                Peers into <span className="text-[var(--accent)]">{selectedInterest}</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent)] text-white shadow-xs">
                {matchingUsers.length}
              </span>
            </div>
            
            <Link 
              href={`/discover?interest=${encodeURIComponent(selectedInterest)}`}
              className="text-[11px] font-bold text-[var(--accent)] hover:underline flex items-center gap-0.5"
            >
              Explore All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {matchingUsers.length === 0 ? (
            <div className="text-center py-5 bg-[var(--bg-surface)] rounded-[16px] border border-[var(--border-hairline)]">
              <p className="text-[12px] font-semibold text-[var(--text-secondary)]">
                No other students tagged with <span className="font-bold text-[var(--accent)]">{selectedInterest}</span> yet.
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {matchingUsers.map(student => (
                <div
                  key={student.id}
                  onClick={() => router.push(`/users/${student.id}`)}
                  className="w-[160px] flex-shrink-0 bg-[var(--bg-surface)] rounded-[20px] p-3 border border-[var(--border-hairline)] flex flex-col items-center text-center cursor-pointer hover:border-[var(--accent)] hover:shadow-md transition-all group select-none shadow-xs"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden mb-2 relative ring-2 ring-[var(--accent-tint-20)] group-hover:scale-105 transition-transform bg-[var(--bg-base)]">
                    <img 
                      src={getAvatar(student)} 
                      alt={student.full_name || 'Student'} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <span className="text-[12px] font-bold text-[var(--text-primary)] truncate max-w-full group-hover:text-[var(--accent)] transition-colors leading-tight">
                    {student.full_name || 'Student'}
                  </span>
                  <span className="text-[10px] font-semibold text-[var(--text-secondary)] mt-0.5 truncate">
                    {student.year ? `${student.year} Yr` : ''} {student.branch ? `· ${student.branch}` : ''}
                  </span>
                  <BookCoffeeButton 
                    targetUserId={student.id}
                    targetName={student.full_name}
                    targetPhoto={getUserAvatarUrl(student)}
                    isLoggedIn={!!currentUserId}
                    completedMeets={student.completed_meets_count || 0}
                    renderButton={({ onClick }) => (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClick(e);
                        }}
                        className="mt-2.5 w-full py-1.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
                      >
                        <Zap size={11} className="fill-white" />
                        <span>Meet</span>
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

