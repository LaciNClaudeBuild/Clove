'use client';
import { useState, useRef, useEffect } from 'react';
import QRCodeStyling, { DotType, CornerSquareType } from 'qr-code-styling';

const dotStyles: DotType[] = ['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'];
const cornerStyles: CornerSquareType[] = ['square', 'dot', 'extra-rounded'];

function formatLabel(value: string): string {
  const words = value.split('-');
  return words[0][0].toUpperCase() + words[0].slice(1) + (words[1] ? ' ' + words[1] : '');
}

export default function QrGenerator() {
  const [url, setUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [dotStyle, setDotStyle] = useState<DotType>('square');
  const [cornerStyle, setCornerStyle] = useState<CornerSquareType>('square');
  const [fgColor, setFgColor] = useState('#4a3f35');
  const [bgColor, setBgColor] = useState('#fffdf9');
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [emoji, setEmoji] = useState('');

  const qrRef = useRef<HTMLDivElement>(null);
  const qrInstance = useRef<QRCodeStyling | null>(null);

  const isError = result && !result.startsWith('http');
  const isSuccess = result && result.startsWith('http');

  async function createLink(e: React.FormEvent) {
    e.preventDefault();
    setCopied(false);
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, customSlug }),
    });
    const data = await res.json();
    setResult(data.shortUrl || data.error);
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogoDataUrl(reader.result as string);
      setEmoji('');
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
    if (!isSuccess) return;

    let image = '';
    if (logoDataUrl) image = logoDataUrl;
    else if (emoji) image = emojiToDataUrl(emoji);

    const hasImage = !!image;

    const options = {
      width: 260,
      height: 260,
      data: result,
      image: image || undefined,
      dotsOptions: { color: fgColor, type: dotStyle },
      backgroundOptions: { color: bgColor },
      cornersSquareOptions: { type: cornerStyle },
      imageOptions: { crossOrigin: 'anonymous' as const, margin: 8, imageSize: 0.4 },
      qrOptions: { errorCorrectionLevel: (hasImage ? 'H' : 'M') as 'H' | 'M' },
    };

    if (!qrInstance.current) {
      qrInstance.current = new QRCodeStyling(options);
      if (qrRef.current) {
        qrRef.current.innerHTML = '';
        qrInstance.current.append(qrRef.current);
      }
    } else {
      qrInstance.current.update(options);
    }
  }, [result, isSuccess, dotStyle, cornerStyle, fgColor, bgColor, logoDataUrl, emoji]);

  function download(extension: 'png' | 'svg') {
    qrInstance.current?.download({ name: 'qr-code', extension });
  }

  function copyResult() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="flex flex-1 justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-4 flex justify-end px-1">
          <a href="/dashboard" className="text-sm text-olive hover:underline">
            Dashboard
          </a>
        </div>

        <div className="rounded-[20px] border border-border bg-cream p-8 shadow-[0_1px_2px_rgba(74,63,53,0.06),0_10px_28px_rgba(74,63,53,0.08)]">
          <div className="mb-8 text-center">
            <h1 className="font-serif text-3xl text-text">Tender</h1>
            <p className="mt-2 text-sm text-text-muted">
              Paste a link to shorten it and build a matching QR code.
            </p>
          </div>

          <form onSubmit={createLink} className="space-y-3">
            <div>
              <label htmlFor="url" className="mb-1.5 block text-sm text-text">
                Destination URL
              </label>
              <input
                id="url"
                type="url"
                placeholder="https://example.com/your-page"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/25"
              />
            </div>
            <div>
              <label htmlFor="slug" className="mb-1.5 block text-sm text-text">
                Custom back-half (optional)
              </label>
              <input
                id="slug"
                type="text"
                placeholder="my-link"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/25"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-terracotta px-4 py-3 text-sm font-medium text-cream transition-colors hover:bg-terracotta-hover"
            >
              Shorten
            </button>
          </form>

          {isError && (
            <p className="mt-4 rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 text-sm text-terracotta-hover">
              {result}
            </p>
          )}
        </div>

        {isSuccess && (
          <div className="mt-4 rounded-[20px] border border-border bg-cream p-8 shadow-[0_1px_2px_rgba(74,63,53,0.06),0_10px_28px_rgba(74,63,53,0.08)]">
            <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3">
              <a
                href={result}
                target="_blank"
                rel="noreferrer"
                className="truncate text-sm text-olive hover:underline"
              >
                {result}
              </a>
              <button
                onClick={copyResult}
                className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-sand"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm text-text">Dot style</p>
                <div className="flex flex-wrap gap-2">
                  {dotStyles.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setDotStyle(s)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
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
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
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
                    className="h-8 w-8 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                  />
                  Foreground
                </label>
                <label className="flex items-center gap-2 text-sm text-text">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
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
            </div>

            <div className="mt-6 flex flex-col items-center gap-4 border-t border-border pt-6">
              <div
                ref={qrRef}
                className="flex h-[260px] w-[260px] items-center justify-center overflow-hidden rounded-xl border border-border bg-white"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => download('png')}
                  className="rounded-xl bg-olive px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-olive-hover"
                >
                  Download PNG
                </button>
                <button
                  onClick={() => download('svg')}
                  className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-sand"
                >
                  Download SVG
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
