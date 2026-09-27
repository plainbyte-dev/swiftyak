import type { BillSettings } from './types';

const INK = '#1f2a44';
const LETTER_SPACING = 1;

/** Transparent navy/orange version of the SwiftYak logo, used when no logo is uploaded. */
export const DEFAULT_LOGO_PATH = '/assets/images/logo-bill.png';

let defaultLogoPromise: Promise<string> | null = null;

/** The default logo as a data URL (SVG stamps and Excel can't reference external files). */
export function loadDefaultLogo(): Promise<string> {
  defaultLogoPromise ??= fetch(DEFAULT_LOGO_PATH)
    .then((res) => {
      if (!res.ok) throw new Error('Logo not found');
      return res.blob();
    })
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        })
    )
    .catch((err) => {
      defaultLogoPromise = null; // allow a retry later
      throw err;
    });
  return defaultLogoPromise;
}

/** Settings with the default logo filled in, ready to render. */
export async function withDefaultLogo(settings: BillSettings): Promise<BillSettings> {
  if (settings.logo) return settings;
  try {
    return { ...settings, logo: await loadDefaultLogo() };
  } catch {
    return settings;
  }
}

function escapeXml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** "Balaju, Kathmandu 44600, Nepal" → "KATHMANDU, NEPAL" */
function stampPlace(address: string) {
  const parts = address
    .split(',')
    .map((p) => p.replace(/[\d[\]-]+/g, ' ').trim())
    .filter(Boolean);
  const place = parts.length > 1 ? parts.slice(1) : parts;
  return place.join(', ').toUpperCase();
}

/** "Swift Yak Pvt. Ltd." → "SWIFTYAK" — the brand word printed under the logo. */
function brandWord(name: string) {
  return name
    .replace(/\b(pvt|private|ltd|limited|co|company)\b\.?/gi, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .toUpperCase();
}

/**
 * A round rubber-stamp style seal: short name around the top, place around the bottom,
 * logo (inked in one colour) and brand word in the middle. Returned as a self-contained
 * SVG string so it renders identically on screen, in the PDF and in Excel.
 */
export function buildStampSvg(settings: Pick<BillSettings, 'businessName' | 'shortName' | 'address' | 'logo'>) {
  const name = settings.shortName || settings.businessName;
  const top = name.toUpperCase();
  const bottom = stampPlace(settings.address);
  const brand = brandWord(name);

  // Size each line so it fills ~80% of its half of the ring, leaving room for the stars.
  // Approximate glyph width is 0.66em plus letter-spacing.
  // Very long text that would still overflow at the minimum size is squeezed with textLength.
  const fit = (text: string, radius: number, max: number) => {
    const room = Math.PI * radius * 0.8;
    const ideal = (room / Math.max(text.length, 1) - LETTER_SPACING) / 0.66;
    const size = Math.max(8, Math.min(max, ideal));
    return { size: size.toFixed(1), squeeze: ideal < 8 ? ` textLength="${room.toFixed(0)}" lengthAdjust="spacingAndGlyphs"` : '' };
  };
  const topFit = fit(top, 72, 16);
  const bottomFit = fit(bottom, 80, 13);

  const centre = settings.logo
    ? `<image href="${settings.logo}" x="62" y="60" width="76" height="56" preserveAspectRatio="xMidYMid meet" filter="url(#ink)" />
    <text x="100" y="134" font-size="${Math.min(15, 90 / Math.max(brand.length * 0.62, 1)).toFixed(1)}" text-anchor="middle" font-style="italic" font-weight="800" letter-spacing="0.5">${escapeXml(brand)}</text>`
    : `<text x="100" y="105" font-size="${Math.min(18, 100 / Math.max(brand.length * 0.62, 1)).toFixed(1)}" text-anchor="middle" font-style="italic" font-weight="800">${escapeXml(brand)}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <path id="top" d="M 28,100 A 72,72 0 0,1 172,100" />
    <path id="bottom" d="M 16,100 A 84,84 0 0,0 184,100" />
    <filter id="ink"><feFlood flood-color="${INK}" /><feComposite in2="SourceAlpha" operator="in" /></filter>
  </defs>
  <g fill="none" stroke="${INK}">
    <circle cx="100" cy="100" r="96" stroke-width="3" />
    <circle cx="100" cy="100" r="90" stroke-width="1" />
    <circle cx="100" cy="100" r="58" stroke-width="1.2" />
  </g>
  <g fill="${INK}" font-family="Arial, Helvetica, sans-serif" font-weight="700">
    <text font-size="${topFit.size}" letter-spacing="${LETTER_SPACING}">
      <textPath href="#top" startOffset="50%" text-anchor="middle"${topFit.squeeze}>${escapeXml(top)}</textPath>
    </text>
    <text font-size="${bottomFit.size}" letter-spacing="${LETTER_SPACING}">
      <textPath href="#bottom" startOffset="50%" text-anchor="middle"${bottomFit.squeeze}>${escapeXml(bottom)}</textPath>
    </text>
    <text x="19" y="104" font-size="11">★</text>
    <text x="170" y="104" font-size="11">★</text>
    ${centre}
  </g>
</svg>`;
}

export function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** The stamp image to use: the uploaded one if there is one, otherwise the generated seal. */
export function stampSrc(settings: BillSettings) {
  return settings.stamp || svgToDataUrl(buildStampSvg(settings));
}

/**
 * Rasterize any image data URL (including SVG) to PNG — Excel can't embed SVG.
 * With `knockOutWhite`, near-white pixels become transparent: Excel has no blend modes,
 * so a signature photographed on white paper would otherwise cover the stamp.
 */
export function toPngDataUrl(src: string, size = 400, knockOutWhite = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = size / Math.max(img.naturalWidth || size, img.naturalHeight || size);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round((img.naturalWidth || size) * scale);
      canvas.height = Math.round((img.naturalHeight || size) * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (knockOutWhite) {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = data.data;
        for (let i = 0; i < px.length; i += 4) {
          const lightness = Math.min(px[i], px[i + 1], px[i + 2]);
          // Fade from opaque ink (≤150) to fully transparent paper (≥230).
          if (lightness > 150) px[i + 3] = Math.round(px[i + 3] * Math.max(0, (230 - lightness) / 80));
        }
        ctx.putImageData(data, 0, 0);
      }
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = src;
  });
}
