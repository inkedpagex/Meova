import { Suspense } from 'react';
import DiscoverClient from './DiscoverClient';

export const metadata = {
  title: 'Discover Campus Peers by Branch, Year & Skills | Meova',
  description: 'Find verified GLA University students to connect with on Meova. Filter by branch (CSE, ECE, MBA), year, and availability. Book a coffee meet or send a quick message instantly.',
  keywords: [
    'GLA University students', 'find college peers', 'campus networking GLA',
    'discover students Mathura', 'college meet app GLA', 'student connect GLA University',
    'meet students GLA', 'meetify alternative', 'meetifyy alternative', 'campus social GLA'
  ],
  alternates: { canonical: 'https://meova.in/discover' },
  openGraph: {
    title: 'Discover Campus Peers | Meova — GLA University Social Platform',
    description: 'Find verified GLA University students by branch, year, and skills. Book meets and network on Meova.',
    url: 'https://meova.in/discover',
    siteName: 'Meova',
    images: [{ url: '/icon-512.png', width: 512, height: 512 }],
  },
};

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-[#F05A00]">Loading Discover...</div>}>
      <DiscoverClient />
    </Suspense>
  );
}
