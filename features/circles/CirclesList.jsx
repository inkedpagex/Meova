'use client';

import React from 'react';
import { Users, ArrowRight } from 'lucide-react';
import CircleJoinButton from './CircleJoinButton';
import Link from 'next/link';
import { circleAvatarUrl } from '../../components/CircleAvatar';

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
    <div className="space-y-3">
      {circles.map((circle, idx) => {
        const isJoined = joinedCircleIds.has(circle.id);
        const meta = CATEGORY_META[circle.category] || DEFAULT_META;
        const avatarUrl = circleAvatarUrl(circle.name);
        const memberCount = circle.member_count || 0;

        return (
          <div
            key={circle.id}
            className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {/* Hovered background glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 0% 50%, ${meta.glow} 0%, transparent 60%)`,
              }}
            />

            {/* Left color accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
              style={{ background: meta.color }}
            />

            <div className="flex items-center gap-5 px-6 py-4 pl-8">
              {/* Index number — minimal aesthetic touch */}
              <span
                className="text-xs font-black tabular-nums flex-shrink-0 hidden sm:block"
                style={{ color: 'rgba(255,255,255,0.1)', width: 20, textAlign: 'right' }}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>

              {/* Circle avatar */}
              <div
                className="flex-shrink-0 relative w-10 h-10 rounded-xl overflow-hidden"
                style={{
                  boxShadow: `0 0 12px ${meta.glow}`,
                  border: `1px solid ${meta.color}30`,
                }}
              >
                <img src={avatarUrl} alt={circle.name} className="w-full h-full object-cover" />
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm" aria-hidden>{meta.emoji}</span>
                  <Link href={`/circles/${circle.id}`}>
                    <h3
                      className="font-bold text-white text-sm truncate hover:underline underline-offset-2"
                      style={{ letterSpacing: '-0.01em' }}
                    >
                      {circle.name}
                    </h3>
                  </Link>
                  {isJoined && (
                    <span
                      className="flex-shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                      style={{ background: `${meta.color}20`, color: meta.color }}
                    >
                      Joined
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 truncate leading-relaxed pr-4">
                  {circle.description || circle.category}
                </p>
              </div>

              {/* Member count */}
              <div
                className="flex-shrink-0 hidden md:flex items-center gap-1.5 text-[11px] font-bold"
                style={{ color: 'rgba(255,255,255,0.2)' }}
              >
                <Users className="w-3 h-3" />
                <span>{memberCount}</span>
              </div>

              {/* Category pill */}
              <div
                className="flex-shrink-0 hidden lg:block text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full whitespace-nowrap"
                style={{ background: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}20` }}
              >
                {circle.category}
              </div>

              {/* Join button */}
              <div className="flex-shrink-0 w-28">
                <CircleJoinButton
                  circleId={circle.id}
                  userId={userId}
                  isInitialMember={isJoined}
                  accentColor={meta.color}
                />
              </div>

              {/* Arrow hint */}
              <Link href={`/circles/${circle.id}`} className="flex-shrink-0 text-neutral-700 group-hover:text-neutral-400 transition-colors hidden md:block">
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
