'use client';
import React, { useState } from 'react';
import { Bell, Check, Zap, MessageSquare, UserPlus, Calendar, Music, Sparkles } from 'lucide-react';

import { getCartoonAvatar } from '../../utils/avatar';

const INITIAL_NEW = [
  {
    id: 'n_1',
    type: 'social',
    title: 'Riya Sharma accepted your Coffee Meet request.',
    desc: 'You can now start messaging each other under the messages tab.',
    time: '2m ago',
    avatar: getCartoonAvatar('Riya'),
    unread: true,
  },
  {
    id: 'n_2',
    type: 'sparks',
    title: 'You received 300 Sparks from Startup Circle event.',
    desc: 'Your wallet has been credited. High value engagement bonus.',
    time: '12m ago',
    unread: true,
  },
  {
    id: 'n_3',
    type: 'invite',
    title: 'Ananya invited you to join AI/ML Club.',
    desc: 'Join the circle to get access to custom research posts and events.',
    time: '1h ago',
    avatar: getCartoonAvatar('Ananya'),
    unread: true,
  },
  {
    id: 'n_4',
    type: 'reply',
    title: 'Kabir replied to your post in Startup Circle.',
    desc: '"Let\'s connect, collaborate and open for all students."',
    time: '2h ago',
    avatar: getCartoonAvatar('Kabir'),
    unread: true,
  },
];

const INITIAL_EARLIER = [
  {
    id: 'n_5',
    type: 'event',
    title: 'Event reminder: Photography Walk tomorrow at 6:00 AM.',
    desc: 'Assemble at the Main Gate with your gear. DSLR or phone works!',
    time: '20h ago',
    unread: false,
  },
  {
    id: 'n_6',
    type: 'event',
    title: 'New event near you: Open Mic Night.',
    desc: 'Host: Campus Symphony. 6:00 PM at the Central Lawn.',
    time: '1d ago',
    unread: false,
  },
];

export default function NotificationsPage() {
  const [newNotifs, setNewNotifs] = useState(INITIAL_NEW);
  const [earlierNotifs, setEarlierNotifs] = useState(INITIAL_EARLIER);

  const handleMarkAllRead = () => {
    setNewNotifs(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'sparks':
        return <Zap size={14} className="text-[#fb923c] fill-current" />;
      case 'reply':
        return <MessageSquare size={14} className="text-[#818cf8]" />;
      case 'invite':
        return <UserPlus size={14} className="text-[#38bdf8]" />;
      case 'event':
        return <Calendar size={14} className="text-[#fb7185]" />;
      default:
        return <Bell size={14} className="text-neutral-400" />;
    }
  };

  const hasUnread = newNotifs.some(n => n.unread);

  return (
    <div className="anim-fade-in w-full max-w-2xl mx-auto space-y-8 pb-12 px-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            Notifications
          </h1>
          <p className="text-[10px] text-[var(--text-secondary)] mt-2 font-bold uppercase tracking-widest">
            Stay updated with your campus vibe
          </p>
        </div>
        {hasUnread && (
          <button
            onClick={handleMarkAllRead}
            className="btn btn-ghost text-xs px-4 py-2 flex items-center gap-1.5 font-bold"
          >
            <Check size={14} />
            Mark all as read
          </button>
        )}
      </div>

      {/* New Notifications */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-[#818cf8] flex items-center gap-2">
          <span>New Alerts</span>
          {hasUnread && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-ping" />
          )}
        </h2>

        <div className="space-y-2">
          {newNotifs.map(n => (
            <div
              key={n.id}
              className={`border rounded-2xl p-4.5 flex gap-4 transition-all duration-200 shadow-sm ${
                n.unread ? 'bg-[var(--accent-glow)] border-[var(--accent-dim)]' : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)]'
              }`}
            >
              {/* Left Indicator (Avatar or Icon) */}
              <div className="relative flex-shrink-0">
                {n.avatar ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                    <img src={n.avatar} alt="Avatar" className="w-full h-full" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
                    {getIcon(n.type)}
                  </div>
                )}
                {n.unread && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#6366f1] border-2 border-[var(--bg-elevated)]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex justify-between items-start gap-4">
                  <p className={`text-xs font-black leading-normal ${n.unread ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                    {n.title}
                  </p>
                  <span className="text-[10px] text-[var(--text-muted)] font-bold whitespace-nowrap">
                    {n.time}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-semibold">
                  {n.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Earlier Notifications */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
          Earlier
        </h2>

        <div className="space-y-2">
          {earlierNotifs.map(n => (
            <div
              key={n.id}
              className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-4.5 flex gap-4 transition-all duration-200 shadow-sm"
            >
              {/* Left Indicator */}
              <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0">
                {getIcon(n.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex justify-between items-start gap-4">
                  <p className="text-xs font-black leading-normal text-[var(--text-secondary)]">
                    {n.title}
                  </p>
                  <span className="text-[10px] text-[var(--text-muted)] font-bold whitespace-nowrap">
                    {n.time}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-semibold">
                  {n.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
