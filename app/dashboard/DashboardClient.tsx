'use client';
import { useMemo, useState } from 'react';
import ClickTime from './ClickTime';
import { signOutAction } from '../actions';

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
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewFilter, setViewFilter] = useState<'all' | 'mine'>('all');

  const filtered = useMemo(() => {
    let list = links;

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
  }, [links, isAdmin, viewFilter, search, sortBy]);

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

        {filtered.length === 0 && (
          <div className="rounded-[20px] border border-border bg-cream p-8 text-center">
            <p className="text-sm text-text-muted">
              {links.length === 0
                ? "You haven't created a link yet."
                : 'No links match your search.'}
            </p>
            {links.length === 0 && (
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
            <div key={link.id} className="rounded-xl border border-border bg-white p-4">
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
          ))}
        </div>
      </div>
    </main>
  );
}
