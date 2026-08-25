import { Suspense } from 'react';
import DiscoverClient from './DiscoverClient';

export const metadata = { title: 'Discover — Meova' };

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-[#F05A00]">Loading Discover...</div>}>
      <DiscoverClient />
    </Suspense>
  );
}
