import { getUserAdmin } from '../../../lib/getUserAdmin';
import CreateExperienceClient from './CreateExperienceClient';

export const metadata = { title: 'Create Experience — meetifyy.in' };

export default async function CreateExperiencePage() {
  const currentUser = await getUserAdmin();

  return (
    <CreateExperienceClient 
      currentUser={currentUser} 
    />
  );
}

export const dynamic = 'force-dynamic';
