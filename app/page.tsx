import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import QrGenerator from './QrGenerator';

export default async function Home() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/sign-in');
  }

  return <QrGenerator />;
}
