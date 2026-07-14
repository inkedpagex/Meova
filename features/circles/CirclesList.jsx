'use client';

import React from 'react';
import { Users, ArrowRight } from 'lucide-react';
import CircleJoinButton from './CircleJoinButton';
import Link from 'next/link';
import { CircleAvatar } from '../../components/CircleAvatar';

const CATEGORY_META = {
  'Coding & Tech':              { color: '#3b82f6', glow: 'rgba(59,130,246,0.2)' },
  'Music & Bands':              { color: '#a855f7', glow: 'rgba(168,85,247,0.2)' },
  'Sports & Fitness':           { color: '#22c55e', glow: 'rgba(34,197,94,0.2)' },
  'Dance':                      { color: '#ec4899', glow: 'rgba(236,72,153,0.2)' },
  'Photography & Film':         { color: '#06b6d4', glow: 'rgba(6,182,212,0.2)' },
  'Gaming & E-sports':          { color: '#f97316', glow: 'rgba(249,115,22,0.2)' },
};

const DEFAULT_META = { color: '#6b7280', glow: 'rgba(107,114,128,0.2)' };

export default function CirclesList({ circles, joinedCircleIds, userId }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 pb-12">
      {circles.map((circle, idx) => {
        const isJoined = joinedCircleIds.has(circle.id);
        const meta = CATEGORY_META[circle.category] || DEFAULT_META;
        const memberCount = circle.member_count || 0;

        return (
          <div
            key={circle.id}
            className="group relative flex flex-col bg-white/[0.02] border border-white/[0.06] rounded-[1.5rem] p-5 hover:bg-white/[0.04] transition-all duration-300 overflow-hidden"
          >
            {/* Ambient background glow based on category color */}
            <div 
              className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"
              style={{ background: meta.color }}
            />

            <div className="flex items-start justify-between mb-4 relative z-10">
              <Link href={`/circles/${circle.id}`} className="flex-shrink-0">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/10 group-hover:scale-105 transition-transform duration-300 bg-black shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                  <CircleAvatar name={circle.name} size={56} radius={16} />
                </div>
              </Link>
              <div className="flex-shrink-0">
                <CircleJoinButton
                  circleId={circle.id}
                  userId={userId}
                  isInitialMember={isJoined}
                  accentColor={meta.color}
                />
              </div>
            </div>

            <div className="flex flex-col flex-1 relative z-10">
              <Link href={`/circles/${circle.id}`} className="mb-1">
                <h3 className="font-extrabold text-white text-[17px] leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-neutral-400 transition-all duration-300">
                  {circle.name}
                </h3>
              </Link>
              
              <div className="flex items-center gap-2 text-[13px] text-neutral-400 font-medium mb-4">
                <span className="px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/[0.05]">{circle.category}</span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/[0.05]">
                  <Users className="w-3.5 h-3.5 text-neutral-500" />
                  {memberCount}
                </span>
              </div>

              <p className="text-[13px] text-neutral-500 font-medium line-clamp-2 mt-auto leading-relaxed">
                {circle.desc || "Join this community to connect with like-minded peers and stay updated on upcoming events."}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
