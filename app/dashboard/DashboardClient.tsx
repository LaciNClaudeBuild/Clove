'use client';
import { useMemo, useState } from 'react';
import QRCodeStyling, { DotType, CornerSquareType } from 'qr-code-styling';
import ClickTime from './ClickTime';
import { signOutAction } from '../actions';
import QrThumbnail from './QrThumbnail';
import EditLinkPanel, { EditableLink } from './EditLinkPanel';

type ClickInfo = {
  country: string | null;
  city: string | null;
  device_type: string;
  browser: string;
  created_at: string;
};

type LinkInfo = {
  id: number;
  slug: string;
  destinationUrl: string;
  ownerEmail: string;
  createdAt: string;
  totalClicks: number;
  dotStyle: string | null;
  cornerStyle: string | null;
  fgColor: string | null;
  bgColor: string | null;
  logoDataUrl: string | null;
  emoji: string | null;
  clicks: ClickInfo[];
};

type SortOption = 'newest' | 'clicks' | 'alpha';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'clicks', label: 'Most clicked' },
  { value: 'alpha', label: 'A–Z' },
];

export default function DashboardClient({
  links,
  isAdmin,
  userEmail,
}: {
  links: LinkInfo[];
  isAdmin: boolean;
  userEmail: string;
}) {
  const [linksState, setLinksState] = useState(links);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewFilter, setViewFilter] = useState<'all' | 'mine'>('all');
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmingBulk, setConfirmingBulk] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function handleDelete(id: number, slug: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/links/${slug}`, { method: 'DELETE' });
      if (res.ok) {
        setLinksState((prev) => prev.filter((l) => l.id !== id));
      }
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  function toggleSelected(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    try {
      const targets = linksState.filter((l) => selectedIds.has(l.id));
      const results = await Promise.all(
        targets.map((l) => fetch(`/api/links/${l.slug}`, { method: 'DELETE' }))
      );
      const succeededIds = targets
        .filter((_, i) => results[i].ok)
        .map((l) => l.id);
      setLinksState((prev) => prev.filter((l) => !succeededIds.includes(l.id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        succeededIds.forEach((id) => next.delete(id));
        return next;
      });
    } finally {
      setBulkDeleting(false);
      setConfirmingBulk(false);
    }
  }

  function handleQuickDownload(link: LinkInfo) {
    const url = `${window.location.origin}/${link.slug}`;

    let image = '';
    if (link.logoDataUrl) {
      image = link.logoDataUrl;
    } else if (link.emoji) {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = '80px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(link.emoji, 50, 55);
        image = canvas.toDataURL();
      }
    }

    const qr = new QRCodeStyling({
      width: 300,
      height: 300,
      data: url,
      image: image || undefined,
      dotsOptions: {
        color: link.fgColor || '#4a3f35',
        type: (link.dotStyle || 'square') as DotType,
      },
      backgroundOptions: { color: link.bgColor || '#fffdf9' },
      cornersSquareOptions: { type: (link.cornerStyle || 'square') as CornerSquareType },
      imageOptions: { crossOrigin: 'anonymous' as const, margin: 8, imageSize: 0.4 },
      qrOptions: { errorCorrectionLevel: (image ? 'H' : 'M') as 'H' | 'M' },
    });

    qr.download({ name: `qr-${link.slug}`, extension: 'png' });
  }

  function handleEditSave(id: number, updated: EditableLink) {
    setLinksState((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              slug: updated.slug,
              destinationUrl: updated.destinationUrl,
              dotStyle: updated.dotStyle,
              cornerStyle: updated.cornerStyle,
              fgColor: updated.fgColor,
              bgColor: updated.bgColor,
              logoDataUrl: updated.logoDataUrl,
              emoji: updated.emoji,
            }
          : l
      )
    );
    setEditingId(null);
  }

  const filtered = useMemo(() => {
    let list = linksState;

    if (isAdmin && viewFilter === 'mine') {
      list = list.filter((l) => l.ownerEmail === userEmail);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (l) => l.slug.toLowerCase().includes(q) || l.destinationUrl.toLowerCase().includes(q)
      );
    }

    const sorted = [...list];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'clicks') {
      sorted.sort((a, b) => b.totalClicks - a.totalClicks);
    } else {
      sorted.sort((a, b) => a.slug.localeCompare(b.slug));
    }

    return sorted;
  }, [linksState, isAdmin, viewFilter, search, sortBy]);

  const totalClicksFiltered = filtered.reduce((sum, l) => sum + l.totalClicks, 0);
  const topLink = filtered.reduce<LinkInfo | null>((top, l) => {
    if (l.totalClicks === 0) return top;
    if (!top || l.totalClicks > top.totalClicks) return l;
    return top;
  }, null);

  return (
    <main className="flex flex-1 justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="mb-4 flex items-center justify-end gap-4 px-1">
          <a href="/" className="text-sm text-olive hover:underline">
            Generator
          </a>
          <form action={signOutAction}>
            <button type="submit" className="text-sm text-text-muted hover:text-text hover:underline">
              Sign out
            </button>
          </form>
        </div>

        <div className="mb-6">
          <h1 className="font-serif text-3xl text-text">Dashboard</h1>
          {isAdmin && viewFilter === 'all' && (
            <p className="mt-1 inline-block rounded-full bg-[#f0dfc0] px-3 py-1 text-xs font-medium text-[#7a5c1e]">
              Viewing all links (admin)
            </p>
          )}
        </div>

        <div className="mb-4 rounded-[20px] border border-border bg-cream p-5">
          <input
            type="text"
            placeholder="Search by slug or destination"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-3 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/25"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSortBy(opt.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    sortBy === opt.value
                      ? 'border-terracotta bg-terracotta text-cream'
                      : 'border-border bg-white text-text hover:bg-sand'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {isAdmin && (
              <div className="flex overflow-hidden rounded-full border border-border">
                <button
                  type="button"
                  onClick={() => setViewFilter('all')}
                  className={`px-3 py-1.5 text-xs transition-colors ${
                    viewFilter === 'all' ? 'bg-olive text-cream' : 'bg-white text-text hover:bg-sand'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setViewFilter('mine')}
                  className={`px-3 py-1.5 text-xs transition-colors ${
                    viewFilter === 'mine' ? 'bg-olive text-cream' : 'bg-white text-text hover:bg-sand'
                  }`}
                >
                  Mine
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[110px] rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-xs text-text-muted">Links</p>
            <p className="font-serif text-xl text-text">{filtered.length}</p>
          </div>
          <div className="flex-1 min-w-[110px] rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-xs text-text-muted">Total clicks</p>
            <p className="font-serif text-xl text-text">{totalClicksFiltered}</p>
          </div>
          <div className="flex-1 min-w-[160px] rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-xs text-text-muted">Top link</p>
            <p className="truncate font-serif text-xl text-text">
              {topLink ? `/${topLink.slug}` : '—'}
            </p>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <label className="flex items-center gap-2 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={filtered.length > 0 && filtered.every((l) => selectedIds.has(l.id))}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds(new Set(filtered.map((l) => l.id)));
                } else {
                  setSelectedIds(new Set());
                }
              }}
              className="h-4 w-4 rounded border-border accent-olive"
            />
            Select all
          </label>

          {selectedIds.size > 0 &&
            (confirmingBulk ? (
              <span className="flex items-center gap-2 text-xs">
                <span className="text-text-muted">
                  Delete {selectedIds.size} link{selectedIds.size === 1 ? '' : 's'}?
                </span>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="text-terracotta-hover hover:underline"
                >
                  {bulkDeleting ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingBulk(false)}
                  className="text-text-muted hover:underline"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <span className="flex items-center gap-3 text-xs">
                <span className="text-text-muted">{selectedIds.size} selected</span>
                <button
                  type="button"
                  onClick={() => setConfirmingBulk(true)}
                  className="text-terracotta-hover hover:underline"
                >
                  Delete selected
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-text-muted hover:underline"
                >
                  Clear
                </button>
              </span>
            ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-[20px] border border-border bg-cream p-8 text-center">
            <p className="text-sm text-text-muted">
              {linksState.length === 0
                ? "You haven't created a link yet."
                : 'No links match your search.'}
            </p>
            {linksState.length === 0 && (
              <a
                href="/"
                className="mt-4 inline-block rounded-xl bg-terracotta px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-terracotta-hover"
              >
                Create your first link
              </a>
            )}
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((link) => (
            <div key={link.id} className="flex gap-3 rounded-xl border border-border bg-white p-4">
              <input
                type="checkbox"
                checked={selectedIds.has(link.id)}
                onChange={() => toggleSelected(link.id)}
                className="mt-1 h-4 w-4 shrink-0 self-start rounded border-border accent-olive"
              />
              <QrThumbnail
                slug={link.slug}
                dotStyle={link.dotStyle}
                cornerStyle={link.cornerStyle}
                fgColor={link.fgColor}
                bgColor={link.bgColor}
                logoDataUrl={link.logoDataUrl}
                emoji={link.emoji}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm text-text">
                    <span className="font-medium">/{link.slug}</span>{' '}
                    <span className="text-text-muted">→ {link.destinationUrl}</span>
                  </p>
                  <span className="shrink-0 text-xs text-text-muted">
                    {link.totalClicks} click{link.totalClicks === 1 ? '' : 's'}
                  </span>
                </div>
                {isAdmin && (
                  <p className="mt-1 text-xs text-text-muted">Owner: {link.ownerEmail}</p>
                )}
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuickDownload(link)}
                    className="text-xs text-text-muted hover:text-olive hover:underline"
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(editingId === link.id ? null : link.id)}
                    className="text-xs text-text-muted hover:text-olive hover:underline"
                  >
                    {editingId === link.id ? 'Close' : 'Edit'}
                  </button>
                  {confirmingId === link.id ? (
                    <span className="inline-flex items-center gap-2 text-xs">
                      <span className="text-text-muted">Delete this link?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(link.id, link.slug)}
                        disabled={deletingId === link.id}
                        className="text-terracotta-hover hover:underline"
                      >
                        {deletingId === link.id ? 'Deleting…' : 'Yes, delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="text-text-muted hover:underline"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(link.id)}
                      className="text-xs text-text-muted hover:text-terracotta-hover hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>

                {editingId === link.id && (
                  <EditLinkPanel
                    link={{
                      slug: link.slug,
                      destinationUrl: link.destinationUrl,
                      dotStyle: link.dotStyle,
                      cornerStyle: link.cornerStyle,
                      fgColor: link.fgColor,
                      bgColor: link.bgColor,
                      logoDataUrl: link.logoDataUrl,
                      emoji: link.emoji,
                    }}
                    onSave={(updated) => handleEditSave(link.id, updated)}
                    onCancel={() => setEditingId(null)}
                  />
                )}
                {link.clicks.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-olive hover:underline">
                      Recent clicks
                    </summary>
                    <ul className="mt-2 space-y-1 border-t border-border pt-2">
                      {link.clicks.slice(0, 10).map((c, i) => (
                        <li key={i} className="text-xs text-text-muted">
                          <ClickTime iso={c.created_at} /> — {c.city || 'Unknown location'}, {c.country || ''} — {c.device_type} / {c.browser}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
