'use client';

import React, { useState, useRef } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, MapPin, Calendar } from 'lucide-react';
import RsvpButton from './RsvpButton';
import { formatEventDate } from '../../utils/dateFormatter';

// Deterministic image from Unsplash based on event id
function getCoverImage(event) {
  const imgs = [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80', // conference
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80', // music
    'https://images.unsplash.com/photo-1518605368461-1ee7a99652c2?w=800&q=80', // sports
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80', // coding
    'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80', // dance
    'https://images.unsplash.com/photo-1507676184212-d0c30a7bf241?w=800&q=80', // drama
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80', // debate
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80', // gaming
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80', // art
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80', // stars
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80', // social
    'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&q=80', // books
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80', // startup
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80', // fashion
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80', // photography
  ];
  const idx = parseInt(event.id?.replace(/\D/g, '') || '0') % imgs.length;
  return imgs[idx];
}

function getCircleAvatar(event) {
  const avatars = [
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=100&q=80',
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=100&q=80',
    'https://images.unsplash.com/photo-1518605368461-1ee7a99652c2?w=100&q=80',
    'https://images.unsplash.com/photo-1547153760-18fc86324498?w=100&q=80',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&q=80',
  ];
  const idx = parseInt(event.id?.replace(/\D/g, '') || '0') % avatars.length;
  return avatars[idx];
}

export default function EventCard({ event, userId }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const lastTap = useRef(0);

  const isRsvp = userId
    ? (event.rsvps_list || []).some(r => r.user_id === userId)
    : false;

  const totalGoing = (event.rsvps_list || []).length;
  const likesCount = totalGoing + 11 + (liked ? 1 : 0);

  const handleLike = () => {
    setLiked(l => !l);
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 400);
  };

  // Double-tap to like (mobile gesture)
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) handleLike();
    }
    lastTap.current = now;
  };

  const cover = getCoverImage(event);
  const avatar = getCircleAvatar(event);

  return (
    <article
      className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden w-full fade-up"
      style={{ maxWidth: 470 }}
    >
      {/* ── POST HEADER ──────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Circle avatar with story ring */}
          <div className="story-ring rounded-full p-[1.5px] flex-shrink-0">
            <div className="bg-[#0a0a0a] rounded-full p-[2px]">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img src={avatar} alt={event.circle_name} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-white leading-tight truncate">
              {event.circle_name}
            </p>
            {event.location && (
              <p className="text-[11px] text-[#666] flex items-center gap-1 leading-tight mt-0.5 truncate">
                <MapPin size={9} />
                {event.location}
              </p>
            )}
          </div>
        </div>

        <button className="text-[#555] hover:text-white transition-colors p-1 rounded-full hover:bg-white/[0.05] flex-shrink-0">
          <MoreHorizontal size={17} />
        </button>
      </div>

      {/* ── COVER IMAGE ──────────────────────────────── */}
      <div
        className="relative w-full bg-[#111] overflow-hidden cursor-pointer"
        style={{ aspectRatio: '4/3' }}
        onClick={handleDoubleTap}
      >
        <img
          src={cover}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]"
          loading="lazy"
        />

        {/* Dark gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Event title overlaid on image (like Instagram stories text) */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="inline-block bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1.5">
            <p className="text-[13px] font-bold text-white leading-tight">{event.title}</p>
            <p className="text-[11px] text-white/60 font-medium mt-0.5 flex items-center gap-1">
              <Calendar size={9} /> {formatEventDate(event.date)}
            </p>
          </div>
        </div>
      </div>

      {/* ── ACTION BAR ───────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-1">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`like-btn p-2 rounded-full hover:bg-white/[0.05] transition-colors ${heartAnim ? 'heart-pop' : ''}`}
          >
            <Heart
              size={22}
              strokeWidth={liked ? 0 : 1.75}
              fill={liked ? '#ef4444' : 'none'}
              className={liked ? 'text-red-500' : 'text-[#888]'}
            />
          </button>

          {/* Comment */}
          <button className="p-2 rounded-full hover:bg-white/[0.05] transition-colors text-[#888] hover:text-white">
            <MessageCircle size={21} strokeWidth={1.75} />
          </button>

          {/* Share */}
          <button className="p-2 rounded-full hover:bg-white/[0.05] transition-colors text-[#888] hover:text-white">
            <Share2 size={19} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <RsvpButton eventId={event.id} userId={userId} isInitialRsvp={isRsvp} />

          {/* Save */}
          <button
            onClick={() => setSaved(s => !s)}
            className="p-2 rounded-full hover:bg-white/[0.05] transition-colors"
          >
            <Bookmark
              size={20}
              strokeWidth={saved ? 0 : 1.75}
              fill={saved ? 'white' : 'none'}
              className={saved ? 'text-white' : 'text-[#888]'}
            />
          </button>
        </div>
      </div>

      {/* ── LIKES + CAPTION ──────────────────────────── */}
      <div className="px-4 pb-4 space-y-1">
        {/* Likes row */}
        <p className="text-[13px] font-semibold text-white">
          {likesCount.toLocaleString()} likes
        </p>

        {/* Caption */}
        <p className="text-[13px] text-[#ccc] leading-[1.55]">
          <span className="font-semibold text-white mr-2">{event.circle_name}</span>
          {event.description}
        </p>

        {/* RSVP count */}
        <p className="text-[12px] text-[#555] font-medium">{totalGoing} people going</p>

        {/* Timestamp */}
        <p className="text-[10.5px] text-[#3a3a3a] uppercase tracking-wide font-medium pt-0.5">
          {formatEventDate(event.date)}
        </p>
      </div>
    </article>
  );
}
