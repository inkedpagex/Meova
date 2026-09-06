import HelpCenterClient from './HelpCenterClient';

export const metadata = {
  title: 'Help Center & Campus Support — Meova',
  description: 'Find answers to common questions about Meova: student verification, 1-on-1 campus meetups, Sparks wallet, and campus circles.',
  alternates: { canonical: 'https://meova.in/help' },
  openGraph: {
    title: 'Help Center & Campus Support — Meova',
    description: 'Get instant answers to questions about college verification, meetups, wallet, and community safety on Meova.',
    url: 'https://meova.in/help',
    siteName: 'Meova',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

export default function HelpCenterPage() {
  return <HelpCenterClient />;
}
