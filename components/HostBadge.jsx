import React from 'react';
import { ShieldCheck, Sparkles, Crown } from '@/lib/icons';

export default function HostBadge({ role, size = 'sm', className = '' }) {
  if (role !== 'verified_host' && role !== 'campus_lead' && role !== 'admin') {
    return null;
  }

  const isLead = role === 'campus_lead';
  const isAdmin = role === 'admin';

  if (size === 'xs') {
    return (
      <span
        title={isAdmin ? 'Administrator' : isLead ? 'Campus Lead' : 'Verified Campus Host'}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider ${
          isAdmin
            ? 'bg-purple-50 text-purple-700 border border-purple-200'
            : isLead
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'bg-[var(--accent-tint-10)] text-[var(--accent)] border border-[var(--accent-tint-20)]'
        } ${className}`}
      >
        {isAdmin ? <Crown size={9} /> : isLead ? <Sparkles size={9} /> : <ShieldCheck size={9} />}
        <span>{isAdmin ? 'ADMIN' : isLead ? 'LEAD' : 'HOST'}</span>
      </span>
    );
  }

  return (
    <span
      title={isAdmin ? 'Administrator' : isLead ? 'Campus Lead' : 'Verified Campus Host'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-2xs ${
        isAdmin
          ? 'bg-purple-50 text-purple-700 border border-purple-200'
          : isLead
          ? 'bg-blue-50 text-blue-700 border border-blue-200'
          : 'bg-[var(--accent-tint-10)] text-[var(--accent)] border border-[var(--accent-tint-20)]'
      } ${className}`}
    >
      {isAdmin ? (
        <Crown size={11} className="text-purple-600" />
      ) : isLead ? (
        <Sparkles size={11} className="text-blue-600" />
      ) : (
        <ShieldCheck size={11} className="text-[var(--accent)]" />
      )}
      <span>{isAdmin ? 'Admin' : isLead ? 'Campus Lead' : 'Verified Host'}</span>
    </span>
  );
}
