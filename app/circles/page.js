import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function CirclesPage() {
  redirect('/discover?tab=circles');
}
