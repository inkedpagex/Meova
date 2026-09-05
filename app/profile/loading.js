'use client';
import React from 'react';
import Skeleton from '../../components/Skeleton';

export default function ProfileLoading() {
  return (
    <div className="w-full max-w-[640px] mx-auto pb-24 px-2 sm:px-4 anim-fade-in">
      {/* ── Main Profile Card Skeleton ─────────────────── */}
      <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-[#E7E5E4] shadow-xs mb-4">
        {/* Top Header / Avatar & Badges */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" className="w-20 h-20 sm:w-22 sm:h-22 flex-shrink-0" />
            <div className="space-y-2">
              <Skeleton variant="text" className="h-6 w-36 sm:w-48" />
              <Skeleton variant="text" className="h-4 w-24 sm:w-32" />
              <div className="flex items-center gap-2 pt-1">
                <Skeleton variant="text" className="h-5 w-20 rounded-full" />
                <Skeleton variant="text" className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
          <Skeleton variant="circular" className="w-9 h-9 flex-shrink-0" />
        </div>

        {/* Bio Skeleton */}
        <div className="space-y-1.5 pt-2 pb-3">
          <Skeleton variant="text" className="h-4 w-full" />
          <Skeleton variant="text" className="h-4 w-3/4" />
        </div>

        {/* Action Buttons Skeleton */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <Skeleton variant="rectangular" className="h-10 rounded-xl" />
          <Skeleton variant="rectangular" className="h-10 rounded-xl" />
        </div>
      </div>

      {/* ── Sparks & Wallet Balance Card Skeleton ──────── */}
      <div className="bg-white rounded-[20px] p-4 border border-[#E7E5E4] shadow-xs mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" className="w-10 h-10" />
          <div className="space-y-1.5">
            <Skeleton variant="text" className="h-4 w-24" />
            <Skeleton variant="text" className="h-5 w-32" />
          </div>
        </div>
        <Skeleton variant="rectangular" className="h-8 w-20 rounded-full" />
      </div>

      {/* ── Moments / Grid Skeleton ────────────────────── */}
      <div className="bg-white rounded-[20px] p-5 border border-[#E7E5E4] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <Skeleton variant="text" className="h-4 w-28" />
          <Skeleton variant="text" className="h-6 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} variant="rectangular" className="aspect-square rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
