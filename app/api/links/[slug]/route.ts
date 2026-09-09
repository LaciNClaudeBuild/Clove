import { db } from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const MAX_LOGO_LENGTH = 250_000; // roughly 180KB of actual image data, once you account for base64 overhead

async function checkAccess(slug: string) {
  const session = await auth();

  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: 'You must be signed in.' }, { status: 401 }) };
  }

  const linkResult = await db.query('SELECT owner_email FROM links WHERE slug = $1', [slug]);

  if (linkResult.rows.length === 0) {
    return { error: NextResponse.json({ error: 'Link not found.' }, { status: 404 }) };
  }

  const userResult = await db.query('SELECT role FROM users WHERE email = $1', [session.user.email]);
  const isAdmin = userResult.rows[0]?.role === 'admin';
  const isOwner = linkResult.rows[0].owner_email === session.user.email;

  if (!isOwner && !isAdmin) {
    return {
      error: NextResponse.json({ error: 'You can only manage your own links.' }, { status: 403 }),
    };
  }

  return { ok: true as const };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const access = await checkAccess(slug);
  if (access.error) return access.error;

  const { dotStyle, cornerStyle, fgColor, bgColor, logoDataUrl, emoji } = await req.json();

  if (logoDataUrl && logoDataUrl.length > MAX_LOGO_LENGTH) {
    return NextResponse.json(
      { error: 'That logo is too large. Try a smaller or simpler image.' },
      { status: 400 }
    );
  }

  await db.query(
    `UPDATE links
     SET dot_style = $1, corner_style = $2, fg_color = $3, bg_color = $4, logo_data_url = $5, emoji = $6
     WHERE slug = $7`,
    [dotStyle, cornerStyle, fgColor, bgColor, logoDataUrl || null, emoji || null, slug]
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const access = await checkAccess(slug);
  if (access.error) return access.error;

  const linkResult = await db.query('SELECT id FROM links WHERE slug = $1', [slug]);
  const linkId = linkResult.rows[0]?.id;

  if (linkId) {
    await db.query('DELETE FROM clicks WHERE link_id = $1', [linkId]);
    await db.query('DELETE FROM links WHERE id = $1', [linkId]);
  }

  return NextResponse.json({ ok: true });
}
