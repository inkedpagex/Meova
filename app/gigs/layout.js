// Gigs page layout — wraps the 'use client' GigsPage with server-side metadata
export const metadata = {
  title: 'Campus Gigs for GLA Students — Earn Sparks as a Freelancer | Meova',
  description: 'Find campus freelance gigs posted by GLA University students. Logo design, coding help, content writing, photography and more. Apply and earn Sparks today.',
  keywords: [
    'GLA University gigs', 'campus gigs GLA', 'student freelance Mathura',
    'earn money GLA University', 'student tasks GLA', 'campus freelance app GLA',
    'meetify gigs alternative', 'meetifyy gigs alternative', 'college gigs India', 'GLA student earn Sparks'
  ],
  alternates: { canonical: 'https://meova.in/gigs' },
  openGraph: {
    title: 'Campus Gigs — Earn Sparks as a GLA University Freelancer | Meova',
    description: 'Post and apply for campus gigs at GLA University. Earn Sparks on logo design, coding, tutoring and more.',
    url: 'https://meova.in/gigs',
    siteName: 'Meova',
    images: [{ url: '/icon-512.png', width: 512, height: 512 }],
  },
};

export default function GigsLayout({ children }) {
  return children;
}
