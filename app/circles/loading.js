import React from 'react';
import Skeleton from '../../components/Skeleton';

export default function CirclesLoading() {
  return (
    <div className="w-full max-w-[640px] mx-auto pb-24 anim-fade-in px-0 animate-pulse">
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center p-4 bg-white border border-zinc-100 rounded-3xl mb-4">
            <Skeleton variant="circular" className="w-14 h-14 flex-shrink-0" />
            <div className="ml-4 flex-1">
              <Skeleton variant="text" className="h-5 w-48 mb-2" />
              <Skeleton variant="text" className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
