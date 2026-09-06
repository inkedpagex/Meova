import { permanentRedirect } from 'next/navigation';

export const metadata = {
  title: 'Redirecting to GLA University Community | Meova',
  robots: { index: false, follow: true },
};

export default function GlaRedirectPage() {
  permanentRedirect('/college/gla-university');
}
