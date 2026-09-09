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

  const currentResult = await db.query('SELECT * FROM links WHERE slug = $1', [slug]);
  const current = currentResult.rows[0];

  const body = await req.json();
  const { destinationUrl, newSlug, dotStyle, cornerStyle, fgColor, bgColor, logoDataUrl, emoji } = body;

  if (logoDataUrl && logoDataUrl.length > MAX_LOGO_LENGTH) {
    return NextResponse.json(
      { error: 'That logo is too large. Try a smaller or simpler image.' },
      { status: 400 }
    );
  }

  const finalUrl = destinationUrl?.trim() || current.destination_url;
  const finalSlug = newSlug?.trim() || current.slug;

  if (finalSlug !== current.slug) {
    const existing = await db.query('SELECT id FROM links WHERE slug = $1', [finalSlug]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'That custom link is already taken, try another.' },
        { status: 400 }
      );
    }
  }

  await db.query(
    `UPDATE links
     SET destination_url = $1, slug = $2, dot_style = $3, corner_style = $4, fg_color = $5, bg_color = $6, logo_data_url = $7, emoji = $8
     WHERE id = $9`,
    [
      finalUrl,
      finalSlug,
      dotStyle ?? current.dot_style,
      cornerStyle ?? current.corner_style,
      fgColor ?? current.fg_color,
      bgColor ?? current.bg_color,
      logoDataUrl !== undefined ? logoDataUrl || null : current.logo_data_url,
      emoji !== undefined ? emoji || null : current.emoji,
      current.id,
    ]
  );

  return NextResponse.json({ ok: true, slug: finalSlug });
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
