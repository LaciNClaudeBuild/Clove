import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/sign-in');
  }

  const userResult = await db.query('SELECT role FROM users WHERE email = $1', [session.user!.email]);
  const role = userResult.rows[0]?.role || 'member';
  const isAdmin = role === 'admin';

  const linksResult = isAdmin
    ? await db.query(
        'SELECT id, slug, destination_url, created_at, owner_email FROM links ORDER BY created_at DESC'
      )
    : await db.query(
        'SELECT id, slug, destination_url, created_at, owner_email FROM links WHERE owner_email = $1 ORDER BY created_at DESC',
        [session.user!.email]
      );

  const clicksResult = await db.query(
    `SELECT link_id, COUNT(*) as total,
     json_agg(json_build_object('country', country, 'city', city, 'device_type', device_type, 'browser', browser, 'created_at', created_at) ORDER BY created_at DESC) as clicks
     FROM clicks GROUP BY link_id`
  );

  const clicksByLink: Record<number, { total: string; clicks: unknown[] }> = {};
  for (const row of clicksResult.rows) {
    clicksByLink[row.link_id] = row;
  }

  const links = linksResult.rows.map((link) => ({
    id: link.id,
    slug: link.slug,
    destinationUrl: link.destination_url,
    ownerEmail: link.owner_email,
    createdAt: new Date(link.created_at).toISOString(),
    totalClicks: Number(clicksByLink[link.id]?.total || 0),
    clicks: (clicksByLink[link.id]?.clicks || []) as {
      country: string | null;
      city: string | null;
      device_type: string;
      browser: string;
      created_at: string;
    }[],
  }));

  return <DashboardClient links={links} isAdmin={isAdmin} userEmail={session.user!.email!} />;
}
