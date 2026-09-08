'use client';
import { useState, useRef, useEffect } from 'react';
import QRCodeStyling, { DotType, CornerSquareType } from 'qr-code-styling';

const dotStyles: DotType[] = ['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'];
const cornerStyles: CornerSquareType[] = ['square', 'dot', 'extra-rounded'];

export default function Home() {
  const [url, setUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [result, setResult] = useState('');
  const [dotStyle, setDotStyle] = useState<DotType>('square');
  const [cornerStyle, setCornerStyle] = useState<CornerSquareType>('square');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [emoji, setEmoji] = useState('');

  const qrRef = useRef<HTMLDivElement>(null);
  const qrInstance = useRef<QRCodeStyling | null>(null);

  async function createLink(e: React.FormEvent) {
    e.preventDefault();
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
    if (!result || !result.startsWith('http')) return;

    let image = '';
    if (logoDataUrl) image = logoDataUrl;
    else if (emoji) image = emojiToDataUrl(emoji);

    const hasImage = !!image;

    const options = {
      width: 300,
      height: 300,
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
  }, [result, dotStyle, cornerStyle, fgColor, bgColor, logoDataUrl, emoji]);

  function download(extension: 'png' | 'svg') {
    qrInstance.current?.download({ name: 'qr-code', extension });
  }

  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif', maxWidth: 500 }}>
      <h1>Tender</h1>
      <form onSubmit={createLink}>
        <input
          type="url"
          placeholder="Paste a URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          style={{ padding: 8, width: 300, display: 'block', marginBottom: 8 }}
        />
        <input
          type="text"
          placeholder="Custom back-half (optional)"
          value={customSlug}
          onChange={(e) => setCustomSlug(e.target.value)}
          style={{ padding: 8, width: 300, display: 'block', marginBottom: 8 }}
        />
        <button type="submit" style={{ padding: 8 }}>
          Shorten
        </button>
      </form>

      {result && !result.startsWith('http') && (
        <p style={{ marginTop: 16, color: 'red' }}>{result}</p>
      )}

      {result && result.startsWith('http') && (
        <div style={{ marginTop: 24 }}>
          <p>{result}</p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Dot style</label>
            <select value={dotStyle} onChange={(e) => setDotStyle(e.target.value as DotType)}>
              {dotStyles.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <label style={{ display: 'block', margin: '8px 0 4px' }}>Corner style</label>
            <select value={cornerStyle} onChange={(e) => setCornerStyle(e.target.value as CornerSquareType)}>
              {cornerStyles.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <label style={{ display: 'block', margin: '8px 0 4px' }}>Foreground color</label>
            <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} />

            <label style={{ display: 'block', margin: '8px 0 4px' }}>Background color</label>
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />

            <label style={{ display: 'block', margin: '8px 0 4px' }}>Logo image (optional)</label>
            <input type="file" accept="image/*" onChange={handleLogoUpload} />

            <label style={{ display: 'block', margin: '8px 0 4px' }}>Or emoji (optional)</label>
            <input
              type="text"
              placeholder="e.g. 🌿"
              value={emoji}
              onChange={(e) => {
                setEmoji(e.target.value);
                setLogoDataUrl('');
              }}
              style={{ width: 60, padding: 4 }}
            />
          </div>

          <div ref={qrRef}></div>

          <div style={{ marginTop: 12 }}>
            <button onClick={() => download('png')} style={{ marginRight: 8, padding: 8 }}>
              Download PNG
            </button>
            <button onClick={() => download('svg')} style={{ padding: 8 }}>
              Download SVG
            </button>
          </div>
        </div>
      )}
    </main>
  );
}