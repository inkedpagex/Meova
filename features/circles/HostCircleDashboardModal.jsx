'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, Sparkles, Search, Link as LinkIcon, Edit3, Settings, Check, Loader2, Save } from '@/lib/icons';
import { getUserAvatarUrl, getCartoonAvatar } from '../../utils/avatar';
import { toast } from '../../lib/toast';

export default function HostCircleDashboardModal({ circleId, circleName, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'settings'

  // Edit form state
  const [editLink, setEditLink] = useState('');
  const [editMembersCount, setEditMembersCount] = useState('1');
  const [editPrice, setEditPrice] = useState('0');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    if (isOpen && circleId) {
      setLoading(true);
      Promise.all([
        fetch(`/api/circles/${circleId}/members`).then(res => res.json()),
        fetch(`/api/circles/${circleId}`).then(res => res.json()).catch(() => ({ circle: null }))
      ])
        .then(([resData, detailData]) => {
          if (resData.success) {
            setData(resData);
          }
          if (detailData?.circle) {
            setEditLink(detailData.circle.invite_link || detailData.circle.whatsapp_link || '');
            setEditMembersCount(String(detailData.circle.member_count || detailData.circle.members_count || 1));
            setEditPrice(String(detailData.circle.price || 0));
            setEditDesc(detailData.circle.description || '');
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen, circleId]);

  if (!isOpen) return null;

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const cleanLink = editLink.trim();
    if (!cleanLink || (!cleanLink.startsWith('http://') && !cleanLink.startsWith('https://'))) {
      toast.error('Please enter a valid link (starting with https://)');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/circles/${circleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_link: cleanLink,
          initial_members_count: Math.max(1, parseInt(editMembersCount, 10) || 1),
          price: Math.max(0, parseInt(editPrice, 10) || 0),
          description: editDesc.trim(),
        }),
      });

      const resJson = await res.json();
      setSaving(false);

      if (res.ok && resJson.success) {
        toast.success('Community settings updated!');
        if (data) {
          setData(prev => ({
            ...prev,
            total_members: resJson.circle.member_count || prev.total_members,
          }));
        }
      } else {
        toast.error(resJson.error || 'Failed to update community');
      }
    } catch {
      setSaving(false);
      toast.error('Network error. Please try again.');
    }
  };

  const roster = data?.roster || [];
  const filteredRoster = roster.filter(m => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const name = (m.student?.full_name || '').toLowerCase();
    const email = (m.student?.email || '').toLowerCase();
    const branch = (m.student?.branch || '').toLowerCase();
    return name.includes(q) || email.includes(q) || branch.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl border border-[#E7E5E4] anim-fade-in flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7E5E4] flex items-center justify-between bg-[#FAFAF8]/60">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] bg-[var(--accent-tint-10)] px-2.5 py-0.5 rounded-full border border-[var(--accent-tint-20)]">
              Host Channel Dashboard
            </span>
            <h3 className="text-lg font-bold text-[#1C1917] tracking-tight mt-0.5">
              {circleName || data?.circleName || 'Community'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--accent-tint-10)] text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-2 gap-4 p-5 bg-[var(--accent-tint-10)]/30 border-b border-[#E7E5E4]">
          <div className="bg-white border border-[var(--accent-tint-20)] rounded-[16px] p-4 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-tint-10)] text-[var(--accent)] flex items-center justify-center flex-shrink-0">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29E]">Total Joined</p>
              <p className="text-xl font-bold text-[#1C1917]">{data?.total_members || editMembersCount || 0} <span className="text-xs text-[#78716C] font-bold">Students</span></p>
            </div>
          </div>

          <div className="bg-white border border-amber-100 rounded-[16px] p-4 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} className="fill-current text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29E]">Sparks Earned</p>
              <p className="text-xl font-bold text-amber-600">{(data?.total_sparks_earned || 0).toLocaleString()} <span className="text-xs text-[#A8A29E] font-bold">Sparks</span></p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E7E5E4] bg-[#FAFAF8]/50 px-6">
          <button
            onClick={() => setActiveTab('roster')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'roster'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Users size={14} />
            <span>Member Roster ({roster.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Settings size={14} />
            <span>Edit Settings</span>
          </button>
        </div>

        {/* TAB 1: ROSTER */}
        {activeTab === 'roster' && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Member Search Bar */}
            <div className="px-6 py-3 border-b border-[#E7E5E4] flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A29E]" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search members by name or branch..."
                  className="w-full bg-[#FAFAF8] border border-[#E7E5E4]/80 rounded-[12px] pl-9 pr-3 py-2 text-xs font-bold text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <span className="text-xs font-bold text-[#78716C]">
                Showing {filteredRoster.length} of {roster.length}
              </span>
            </div>

            {/* Member Roster List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#A8A29E]">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)] mb-2" />
                  <p className="text-xs font-bold">Loading member directory...</p>
                </div>
              ) : filteredRoster.length === 0 ? (
                <div className="text-center py-14 text-[#A8A29E] font-semibold">
                  <p className="text-xs">No members found matching your search.</p>
                </div>
              ) : (
                filteredRoster.map((m, idx) => {
                  const student = m.student;
                  const isHost = m.role === 'host';

                  return (
                    <div
                      key={m.user_id || idx}
                      className="flex items-center justify-between p-3.5 rounded-[16px] border border-[#E7E5E4] hover:border-[var(--accent-tint-20)] hover:bg-[var(--accent-tint-10)]/20 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-[#E7E5E4] flex-shrink-0">
                          <img
                            src={getUserAvatarUrl(student)}
                            alt={student?.full_name || ''}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = getCartoonAvatar(student?.full_name || student?.id);
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-[#1C1917] truncate">
                              {student?.full_name || 'Student Member'}
                            </h4>
                            {isHost && (
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-[var(--accent-tint-10)] text-[var(--accent)]">
                                Host
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-[#A8A29E] truncate mt-0.5">
                            {student?.college || student?.university || 'Campus'} · {student?.year || ''} {student?.branch ? `(${student.branch})` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-[11px] font-bold text-[var(--accent)] block">
                          {isHost ? 'Owner' : `+${m.sparks_paid || 0} Sparks`}
                        </span>
                        <span className="text-[9.5px] font-semibold text-[#A8A29E] block mt-0.5">
                          {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : 'Joined'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: EDIT SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-semibold">
            {/* WhatsApp / Telegram Invite Link */}
            <div>
              <label className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Private Invite Link (WhatsApp Group / Telegram Link) *
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  value={editLink}
                  onChange={e => setEditLink(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full bg-[#FAFAF8] border border-[#E7E5E4] rounded-[12px] px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[var(--accent)] font-bold pl-9"
                />
                <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A29E]" />
              </div>
              <p className="text-[10px] text-[#A8A29E] mt-1">
                Members unlock this link immediately after joining or paying entry Sparks.
              </p>
            </div>

            {/* Base / Initial Member Count */}
            <div>
              <label className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Existing Group Member Count
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={editMembersCount}
                onChange={e => setEditMembersCount(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 127"
                className="w-full bg-[#FAFAF8] border border-[#E7E5E4] rounded-[12px] px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[var(--accent)] font-bold"
              />
              <p className="text-[10px] text-[#A8A29E] mt-1">
                If your WhatsApp group already has 127 members, set 127 so the displayed counter is accurate.
              </p>
            </div>

            {/* Entry Fee (Sparks) */}
            <div>
              <label className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Entry Fee (Sparks)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={editPrice}
                onChange={e => setEditPrice(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0 for Free"
                className="w-full bg-[#FAFAF8] border border-[#E7E5E4] rounded-[12px] px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[var(--accent)] font-bold"
              />
              <p className="text-[10px] text-[#A8A29E] mt-1">
                Set 0 for free community, or any amount to monetize your channel.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                Description & Rules
              </label>
              <textarea
                rows={3}
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Community goals, rules, and value proposition..."
                className="w-full bg-[#FAFAF8] border border-[#E7E5E4] rounded-[12px] px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[var(--accent)] font-medium"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-[16px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Community Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
