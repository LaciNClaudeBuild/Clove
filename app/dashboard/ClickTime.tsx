'use client';
import { useEffect, useState } from 'react';

export default function ClickTime({ iso }: { iso: string }) {
  const [text, setText] = useState('');

  useEffect(() => {
    const utcIso = iso.endsWith('Z') ? iso : `${iso}Z`;
    setText(new Date(utcIso).toLocaleString());
  }, [iso]);

  return <>{text}</>;
}
