import { Suspense } from 'react';
import DiscoverClient from './DiscoverClient';

export const metadata = { title: 'Discover — meetuply' };

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-purple-600">Loading Discover...</div>}>
      <DiscoverClient />
    </Suspense>
  );
}
