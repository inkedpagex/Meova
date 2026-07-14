'use client';

import React from 'react';
import { Users, ArrowRight } from 'lucide-react';
import CircleJoinButton from './CircleJoinButton';
import Link from 'next/link';
import { CircleAvatar } from '../../components/CircleAvatar';

const CATEGORY_META = {
  'Coding & Tech':              { color: '#3b82f6', glow: 'rgba(59,130,246,0.2)',  emoji: '💻' },
  'Music & Bands':              { color: '#a855f7', glow: 'rgba(168,85,247,0.2)', emoji: '🎵' },
  'Sports & Fitness':           { color: '#22c55e', glow: 'rgba(34,197,94,0.2)',  emoji: '⚡' },
  'Dance':                      { color: '#ec4899', glow: 'rgba(236,72,153,0.2)', emoji: '💃' },
  'Theatre & Drama':            { color: '#a855f7', glow: 'rgba(168,85,247,0.2)', emoji: '🎭' },
  'Photography & Film':         { color: '#06b6d4', glow: 'rgba(6,182,212,0.2)',  emoji: '📸' },
  'Gaming & E-sports':          { color: '#f97316', glow: 'rgba(249,115,22,0.2)', emoji: '🎮' },
  'Literature & Poetry':        { color: '#3b82f6', glow: 'rgba(59,130,246,0.2)', emoji: '📖' },
  'Entrepreneurship':           { color: '#f97316', glow: 'rgba(249,115,22,0.2)', emoji: '🚀' },
  'Art & Sketching':            { color: '#ec4899', glow: 'rgba(236,72,153,0.2)', emoji: '🎨' },
  'Astronomy & Science':        { color: '#06b6d4', glow: 'rgba(6,182,212,0.2)',  emoji: '🔭' },
  'Fashion & Styling':          { color: '#ec4899', glow: 'rgba(236,72,153,0.2)', emoji: '✨' },
  'Volunteering & Social Service': { color: '#22c55e', glow: 'rgba(34,197,94,0.2)', emoji: '🤝' },
  'Public Speaking & Debating': { color: '#3b82f6', glow: 'rgba(59,130,246,0.2)', emoji: '🎙️' },
  'Anime & Manga':              { color: '#a855f7', glow: 'rgba(168,85,247,0.2)', emoji: '⛩️' },
};

const DEFAULT_META = { color: '#6b7280', glow: 'rgba(107,114,128,0.2)', emoji: '🌐' };

export default function CirclesList({ circles, joinedCircleIds, userId }) {
  return (
    <div className="flex flex-col">
      {circles.map((circle, idx) => {
        const isJoined = joinedCircleIds.has(circle.id);
        const meta = CATEGORY_META[circle.category] || DEFAULT_META;
        const memberCount = circle.member_count || 0;

        return (
          <div
            key={circle.id}
            className="group relative flex items-center gap-4 px-4 py-4 border-b border-white/[0.08] hover:bg-white/[0.02] transition-colors duration-200"
          >
            {/* Circle avatar */}
            <Link href={`/circles/${circle.id}`} className="flex-shrink-0">
              <div
                className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10"
              >
                <CircleAvatar name={circle.name} size={48} radius="50%" />
              </div>
            </Link>

            {/* Main info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Link href={`/circles/${circle.id}`} className="truncate">
                  <h3 className="font-bold text-white text-[15px] truncate hover:underline underline-offset-2">
                    {circle.name}
                  </h3>
                </Link>
              </div>
              <div className="flex items-center gap-1.5 text-[13px] text-neutral-400 truncate">
                <span className="truncate">{circle.category}</span>
                <span className="text-neutral-600 px-1">•</span>
                <span className="flex-shrink-0 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {memberCount}
                </span>
              </div>
            </div>

            {/* Join button */}
            <div className="flex-shrink-0 ml-2 w-24">
              <CircleJoinButton
                circleId={circle.id}
                userId={userId}
                isInitialMember={isJoined}
                accentColor={meta.color}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
