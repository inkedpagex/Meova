// Bookings page layout — wraps the 'use client' BookingsPage with server-side metadata
export const metadata = {
  title: 'Book 1-on-1 Campus Meetups | Meova',
  description: 'Book verified 1-on-1 coffee meets and study sessions with campus peers on Meova. QR-verified and Sparks-secured meetups on campus.',
  keywords: [
    'campus meetup', 'book campus meet', 'coffee meet students',
    'campus booking app', 'student meet booking', 'student meetup',
    'meet campus peers', 'QR meet campus', 'campus booking Meova'
  ],
  alternates: { canonical: 'https://meova.in/bookings' },
  openGraph: {
    title: 'Book 1-on-1 Campus Meetups | Meova',
    description: 'Book verified coffee meets and study sessions with college peers. QR verified & Sparks secured.',
    url: 'https://meova.in/bookings',
    siteName: 'Meova',
    images: [{ url: '/icon-512.png', width: 512, height: 512 }],
  },
};

export default function BookingsLayout({ children }) {
  return children;
}
