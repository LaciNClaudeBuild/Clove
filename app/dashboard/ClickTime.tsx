'use client';

export default function ClickTime({ iso }: { iso: string }) {
  return <>{new Date(iso).toLocaleString()}</>;
}