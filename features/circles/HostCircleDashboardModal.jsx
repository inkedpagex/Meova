'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, Sparkles, Calendar, Shield, Search, ExternalLink, Loader2 } from 'lucide-react';
import { getUserAvatarUrl, getCartoonAvatar } from '../../utils/avatar';

export default function HostCircleDashboardModal({ circleId, circleName, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen && circleId) {
      setLoading(true);
      fetch(`/api/circles/${circleId}/members`)
        .then(res => res.json())
        .then(resData => {
          if (resData.success) {
            setData(resData);
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
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-zinc-100 anim-fade-in flex flex-col h-[80vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/60">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8C3573] bg-[#fcf6fa] px-2.5 py-0.5 rounded-full border border-[#f5ebf4]">
              Host Analytics & Roster
            </span>
            <h3 className="text-lg font-black text-zinc-900 tracking-tight mt-0.5">
              {circleName || data?.circleName || 'Community Members'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-2 gap-4 p-5 bg-gradient-to-r from-[#fcf6fa]/50 via-[#fcf6fa]/30 to-white border-b border-zinc-100">
          <div className="bg-white border border-[#f5ebf4] rounded-2xl p-4 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f5ebf4] text-[#74295d] flex items-center justify-center flex-shrink-0">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Total Joined</p>
              <p className="text-xl font-black text-zinc-900">{data?.total_members || 0} <span className="text-xs text-zinc-500 font-bold">Students</span></p>
            </div>
          </div>

          <div className="bg-white border border-amber-100 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} className="fill-current text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Sparks Earned</p>
              <p className="text-xl font-black text-amber-600">{(data?.total_sparks_earned || 0).toLocaleString()} <span className="text-xs text-zinc-400 font-bold">Sparks</span></p>
            </div>
          </div>
        </div>

        {/* Member Search Bar */}
        <div className="px-6 py-3 border-b border-zinc-100 flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search members by name or branch..."
              className="w-full bg-zinc-50 border border-zinc-200/80 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#8C3573]"
            />
          </div>
          <span className="text-xs font-bold text-zinc-500">
            Showing {filteredRoster.length} of {roster.length}
          </span>
        </div>

        {/* Member Roster List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#8C3573] mb-2" />
              <p className="text-xs font-bold">Loading member directory...</p>
            </div>
          ) : filteredRoster.length === 0 ? (
            <div className="text-center py-14 text-zinc-400 font-semibold">
              <p className="text-xs">No members found matching your search.</p>
            </div>
          ) : (
            filteredRoster.map((m, idx) => {
              const student = m.student;
              const isHost = m.role === 'host';

              return (
                <div
                  key={m.user_id || idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-zinc-100 hover:border-[#eac5e0] hover:bg-[#fcf6fa]/20 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-200 flex-shrink-0">
                      <img
                        src={getUserAvatarUrl(student)}
                        alt={student.full_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = getCartoonAvatar(student.full_name || student.id);
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-zinc-900 truncate">
                          {student.full_name}
                        </h4>
                        {isHost && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#f5ebf4] text-[#74295d]">
                            Host
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-zinc-400 truncate mt-0.5">
                        {student.college} · {student.year} {student.branch ? `(${student.branch})` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-[11px] font-black text-[#8C3573] block">
                      {isHost ? 'Owner' : `+${m.sparks_paid || 0} Sparks`}
                    </span>
                    <span className="text-[9.5px] font-semibold text-zinc-400 block mt-0.5">
                      {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : 'Joined'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
