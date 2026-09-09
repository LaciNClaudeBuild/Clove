'use client';
import { useEffect, useRef, useState } from 'react';
import QRCodeStyling, { DotType, CornerSquareType } from 'qr-code-styling';

const dotStyles: DotType[] = ['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'];
const cornerStyles: CornerSquareType[] = ['square', 'dot', 'extra-rounded'];

function formatLabel(value: string): string {
  const words = value.split('-');
  return words[0][0].toUpperCase() + words[0].slice(1) + (words[1] ? ' ' + words[1] : '');
}

const MAX_LOGO_DIMENSION = 300;
const MAX_LOGO_LENGTH = 250_000;

export type EditableLink = {
  slug: string;
  destinationUrl: string;
  dotStyle: string | null;
  cornerStyle: string | null;
  fgColor: string | null;
  bgColor: string | null;
  logoDataUrl: string | null;
  emoji: string | null;
};

export default function EditLinkPanel({
  link,
  onSave,
  onCancel,
}: {
  link: EditableLink;
  onSave: (updated: EditableLink) => void;
  onCancel: () => void;
}) {
  const [destinationUrl, setDestinationUrl] = useState(link.destinationUrl);
  const [slug, setSlug] = useState(link.slug);
  const [dotStyle, setDotStyle] = useState<DotType>((link.dotStyle as DotType) || 'square');
  const [cornerStyle, setCornerStyle] = useState<CornerSquareType>(
    (link.cornerStyle as CornerSquareType) || 'square'
  );
  const [fgColor, setFgColor] = useState(link.fgColor || '#4a3f35');
  const [bgColor, setBgColor] = useState(link.bgColor || '#fffdf9');
  const [logoDataUrl, setLogoDataUrl] = useState(link.logoDataUrl || '');
  const [emoji, setEmoji] = useState(link.emoji || '');
  const [logoError, setLogoError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);
  const qrInstance = useRef<QRCodeStyling | null>(null);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError('');

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_LOGO_DIMENSION / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const resized = canvas.toDataURL('image/png');

        if (resized.length > MAX_LOGO_LENGTH) {
          setLogoError('That logo is too large even after resizing. Try a simpler image.');
          return;
        }

        setLogoDataUrl(resized);
        setEmoji('');
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  function emojiToDataUrl(char: string): string {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.font = '80px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, 50, 55);
    return canvas.toDataURL();
  }

  useEffect(() => {
    if (!qrRef.current) return;
    const url = `${window.location.origin}/${slug || link.slug}`;

    let image = '';
    if (logoDataUrl) image = logoDataUrl;
    else if (emoji) image = emojiToDataUrl(emoji);

    const options = {
      width: 180,
      height: 180,
      data: url,
      image: image || undefined,
      dotsOptions: { color: fgColor, type: dotStyle },
      backgroundOptions: { color: bgColor },
      cornersSquareOptions: { type: cornerStyle },
      imageOptions: { crossOrigin: 'anonymous' as const, margin: 6, imageSize: 0.4 },
      qrOptions: { errorCorrectionLevel: (image ? 'H' : 'M') as 'H' | 'M' },
    };

    if (!qrInstance.current) {
      qrInstance.current = new QRCodeStyling(options);
      qrRef.current.innerHTML = '';
      qrInstance.current.append(qrRef.current);
    } else {
      qrInstance.current.update(options);
    }
  }, [slug, dotStyle, cornerStyle, fgColor, bgColor, logoDataUrl, emoji, link.slug]);

  async function saveLink(): Promise<boolean> {
    setSaving(true);
    setFormError('');
    try {
      const res = await fetch(`/api/links/${link.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationUrl,
          newSlug: slug,
          dotStyle,
          cornerStyle,
          fgColor,
          bgColor,
          logoDataUrl,
          emoji,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Something went wrong.');
        return false;
      }
      onSave({
        slug: data.slug,
        destinationUrl,
        dotStyle,
        cornerStyle,
        fgColor,
        bgColor,
        logoDataUrl,
        emoji,
      });
      return true;
    } catch {
      setFormError('Something went wrong. Try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload(extension: 'png' | 'svg') {
    qrInstance.current?.download({ name: 'qr-code', extension });
    await saveLink();
  }

  return (
    <div className="mt-3 space-y-4 border-t border-border pt-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1 space-y-3">
          <div>
            <label className="mb-1.5 block text-sm text-text">Destination URL</label>
            <input
              type="url"
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-text focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/25"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-text">Custom back-half</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-text focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/25"
            />
          </div>

          <div>
            <p className="mb-2 text-sm text-text">Dot style</p>
            <div className="flex flex-wrap gap-2">
              {dotStyles.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDotStyle(s)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    dotStyle === s
                      ? 'border-terracotta bg-terracotta text-cream'
                      : 'border-border bg-white text-text hover:bg-sand'
                  }`}
                >
                  {formatLabel(s)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-text">Corner style</p>
            <div className="flex flex-wrap gap-2">
              {cornerStyles.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setCornerStyle(s)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    cornerStyle === s
                      ? 'border-terracotta bg-terracotta text-cream'
                      : 'border-border bg-white text-text hover:bg-sand'
                  }`}
                >
                  {formatLabel(s)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="h-7 w-7 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
              />
              Foreground
            </label>
            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-7 w-7 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
              />
              Background
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-sand">
              Upload logo
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
            <span className="text-xs text-text-muted">or</span>
            <input
              type="text"
              placeholder="🌿"
              value={emoji}
              onChange={(e) => {
                setEmoji(e.target.value);
                setLogoDataUrl('');
              }}
              className="w-16 rounded-lg border border-border bg-white px-3 py-1.5 text-center text-sm focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/25"
            />
            {(logoDataUrl || emoji) && (
              <button
                type="button"
                onClick={() => {
                  setLogoDataUrl('');
                  setEmoji('');
                }}
                className="text-xs text-text-muted hover:text-text"
              >
                Clear
              </button>
            )}
          </div>
          {logoError && <p className="text-xs text-terracotta-hover">{logoError}</p>}
        </div>

        <div className="flex flex-col items-center gap-2">
          <div
            ref={qrRef}
            className="flex h-[180px] w-[180px] items-center justify-center overflow-hidden rounded-xl border border-border bg-white"
          />
        </div>
      </div>

      {formError && <p className="text-xs text-terracotta-hover">{formError}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleDownload('png')}
          disabled={saving}
          className="rounded-xl bg-olive px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-olive-hover disabled:opacity-60"
        >
          Download PNG
        </button>
        <button
          type="button"
          onClick={() => handleDownload('svg')}
          disabled={saving}
          className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-sand disabled:opacity-60"
        >
          Download SVG
        </button>
        <button
          type="button"
          onClick={saveLink}
          disabled={saving}
          className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-sand disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save without downloading'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
