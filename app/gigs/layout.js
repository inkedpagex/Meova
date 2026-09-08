// Gigs page layout — wraps the 'use client' GigsPage with server-side metadata
export const metadata = {
  title: 'Campus Gigs | Meova',
  robots: { index: false, follow: false },
};

export default function GigsLayout({ children }) {
  return children;
}
