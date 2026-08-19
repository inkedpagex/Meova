// app/onboarding/page.js — Server Component, auth-guarded
import { redirect } from 'next/navigation';
import { getUserWithRole } from '@/lib/getAdminUser';
import OnboardingClient from './OnboardingClient';

export const metadata = {
  title: 'Complete Your Profile — meetifyy',
  description: 'Set up your campus identity on Meetify.',
};

export default async function OnboardingPage() {
  const user = await getUserWithRole();

  if (!user) {
    redirect('/login');
  }

  // Already completed — send to home
  if (user.profileComplete === true) {
    redirect('/');
  }

  return (
    <OnboardingClient
      initialName={user.full_name || ''}
      initialPhoto={user.photo_url || ''}
    />
  );
}

export const dynamic = 'force-dynamic';
