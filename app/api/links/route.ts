import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

function randomSlug() {
  return Math.random().toString(36).substring(2, 8);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'You must be signed in to create a link.' }, { status: 401 });
  }

  const { url, customSlug } = await req.json();

  if (!url) {
    return NextResponse.json({ error: 'A URL is required' }, { status: 400 });
  }

  const slug = customSlug?.trim() || randomSlug();

  const existing = await db.query('SELECT id FROM links WHERE slug = $1', [slug]);

  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'That custom link is already taken, try another.' }, { status: 400 });
  }

  await db.query(
    'INSERT INTO links (slug, destination_url, owner_email) VALUES ($1, $2, $3)',
    [slug, url, session.user.email]
  );

  return NextResponse.json({
    shortUrl: `${req.headers.get('origin')}/${slug}`,
    slug,
  });
}
