'use client';
import { useEffect, useRef } from 'react';
import QRCodeStyling, { DotType, CornerSquareType } from 'qr-code-styling';

export default function QrThumbnail({
  slug,
  dotStyle,
  cornerStyle,
  fgColor,
  bgColor,
  logoDataUrl,
  emoji,
}: {
  slug: string;
  dotStyle: string | null;
  cornerStyle: string | null;
  fgColor: string | null;
  bgColor: string | null;
  logoDataUrl: string | null;
  emoji: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const url = `${window.location.origin}/${slug}`;

    let image = '';
    if (logoDataUrl) {
      image = logoDataUrl;
    } else if (emoji) {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = '80px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 50, 55);
        image = canvas.toDataURL();
      }
    }

    const qr = new QRCodeStyling({
      width: 56,
      height: 56,
      data: url,
      image: image || undefined,
      dotsOptions: { color: fgColor || '#4a3f35', type: (dotStyle || 'square') as DotType },
      backgroundOptions: { color: bgColor || '#fffdf9' },
      cornersSquareOptions: { type: (cornerStyle || 'square') as CornerSquareType },
      imageOptions: { crossOrigin: 'anonymous' as const, margin: 4, imageSize: 0.4 },
      qrOptions: { errorCorrectionLevel: (image ? 'H' : 'M') as 'H' | 'M' },
    });

    ref.current.innerHTML = '';
    qr.append(ref.current);
  }, [slug, dotStyle, cornerStyle, fgColor, bgColor, logoDataUrl, emoji]);

  return (
    <div
      ref={ref}
      className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-white"
    />
  );
}
