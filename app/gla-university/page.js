import { permanentRedirect } from 'next/navigation';

export const metadata = {
  title: 'Redirecting | Meova',
  robots: { index: false, follow: false },
};

export default function GlaRedirectPage() {
  permanentRedirect('/college/gla-university');
}
