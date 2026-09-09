import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ClickTime from './ClickTime';

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/api/auth/signin');
  }

  const userResult = await db.query(
    'SELECT role FROM users WHERE email = $1',
    [session.user.email]
  );
  const role = userResult.rows[0]?.role || 'member';
  const isAdmin = role === 'admin';

  const linksResult = isAdmin
    ? await db.query(
        'SELECT id, slug, destination_url, created_at, owner_email FROM links ORDER BY created_at DESC'
      )
    : await db.query(
        'SELECT id, slug, destination_url, created_at, owner_email FROM links WHERE owner_email = $1 ORDER BY created_at DESC',
        [session.user.email]
      );
  const links = linksResult.rows;

  const clicksResult = await db.query(
    `SELECT link_id, COUNT(*) as total,
     json_agg(json_build_object('country', country, 'city', city, 'device_type', device_type, 'browser', browser, 'created_at', created_at) ORDER BY created_at DESC) as clicks
     FROM clicks GROUP BY link_id`
  );

  const clicksByLink: Record<number, any> = {};
  for (const row of clicksResult.rows) {
    clicksByLink[row.link_id] = row;
  }

  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Dashboard</h1>
      {isAdmin && <p style={{ color: '#888', marginBottom: 20 }}>Viewing all links (admin)</p>}
      {links.map((link) => {
        const stats = clicksByLink[link.id];
        return (
          <div key={link.id} style={{ border: '1px solid #ccc', padding: 16, marginBottom: 16, borderRadius: 8 }}>
            <p><strong>/{link.slug}</strong> → {link.destination_url}</p>
            {isAdmin && <p style={{ fontSize: 13, color: '#888' }}>Owner: {link.owner_email}</p>}
            <p>Total clicks: {stats ? stats.total : 0}</p>
            {stats && (
              <details>
                <summary>Recent clicks</summary>
                <ul>
                  {stats.clicks.slice(0, 10).map((c: any, i: number) => (
                    <li key={i}>
                      <ClickTime iso={c.created_at} /> — {c.city || 'Unknown location'}, {c.country || ''} — {c.device_type} / {c.browser}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        );
      })}
    </main>
  );
}