import { getUserAdmin } from '../../../lib/getUserAdmin';
import CreatePhotoClient from './CreatePhotoClient';

export const metadata = { title: 'Post Campus Photo — meetuply.in' };

export default async function CreatePhotoPage() {
  const currentUser = await getUserAdmin();

  return (
    <CreatePhotoClient 
      currentUser={currentUser} 
    />
  );
}

export const dynamic = 'force-dynamic';
