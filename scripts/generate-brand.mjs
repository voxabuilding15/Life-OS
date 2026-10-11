/**
 * Generates every brand asset (SVG sources in brand/, PNGs in assets/ and store/play/) from one definition.
 *   node scripts/generate-brand.mjs
 * Needs Chromium (set CHROME_PATH, or PLAYWRIGHT_BROWSERS_PATH with an installed browser).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'src/lib/brandPaths.ts'), 'utf8');
const WORDMARK = src.match(/WORDMARK_PATH =\s*'([^']+)'/)[1];
const BOX = { x: 5.66, y: -77.4, w: 322.7, h: 78.4 };

const BLUE = '#68C7EC';
const DARK = '#000F0F';
const WHITE = '#FFFFFF';

/** The Life OS mark, drawn on a 96 x 96 grid. `mono` flattens it into a single-colour silhouette. */
const markBody = ({ mono, ring = BLUE, dot = WHITE, core = BLUE, hole = DARK, id = 'ring' }) =>
  mono
    ? `<circle cx="48" cy="48" r="34" stroke="${mono}" stroke-opacity=".35" stroke-width="6" fill="none"/>
<path d="M48 14 A34 34 0 1 1 15.7 59.5" stroke="${mono}" stroke-width="6" stroke-linecap="round" fill="none"/>
<circle cx="48" cy="14" r="6.5" fill="${mono}"/>
<path fill="${mono}" fill-rule="evenodd" d="M48 37a11 11 0 1 0 0 22 11 11 0 0 0 0-22zm0 6.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z"/>`
    : `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${WHITE}"/><stop offset="1" stop-color="${ring}"/></linearGradient></defs>
<circle cx="48" cy="48" r="34" stroke="${ring}" stroke-opacity=".18" stroke-width="6" fill="none"/>
<path d="M48 14 A34 34 0 1 1 15.7 59.5" stroke="url(#${id})" stroke-width="6" stroke-linecap="round" fill="none"/>
<circle cx="48" cy="14" r="6.5" fill="${dot}"/>
<circle cx="48" cy="48" r="11" fill="${core}"/>
<circle cx="48" cy="48" r="4.5" fill="${hole}"/>`;

const svg = (w, h, vb, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">${body}</svg>\n`;
const wordmark = (fill, scale, x, y) => `<g transform="translate(${x - BOX.x * scale} ${y - BOX.y * scale}) scale(${scale})"><path d="${WORDMARK}" fill="${fill}"/></g>`;

// Horizontal lockup: mark (96) + gap + wordmark centred on the mark.
const hScale = 0.95;
const hW = 96 + 28 + BOX.w * hScale;

const brandFiles = {
  'mark.svg': svg(512, 512, '0 0 96 96', markBody({})),
  'mark-white.svg': svg(512, 512, '0 0 96 96', markBody({ mono: WHITE })),
  'mark-dark.svg': svg(512, 512, '0 0 96 96', markBody({ mono: DARK })),
  'wordmark-white.svg': svg(Math.round(BOX.w * 3), Math.round(BOX.h * 3), `0 0 ${BOX.w} ${BOX.h}`, wordmark(WHITE, 1, 0, 0)),
  'wordmark-dark.svg': svg(Math.round(BOX.w * 3), Math.round(BOX.h * 3), `0 0 ${BOX.w} ${BOX.h}`, wordmark(DARK, 1, 0, 0)),
  'logo-horizontal.svg': svg(Math.round(hW * 4), 384, `0 0 ${hW} 96`, `${markBody({ id: 'h' })}${wordmark(WHITE, hScale, 124, 48 - (BOX.h * hScale) / 2)}`),
  'logo-horizontal-dark.svg': svg(Math.round(hW * 4), 384, `0 0 ${hW} 96`, `${markBody({ mono: DARK, id: 'hd' })}${wordmark(DARK, hScale, 124, 48 - (BOX.h * hScale) / 2)}`),
  'logo-stacked.svg': svg(640, 640, '0 0 200 200', `<g transform="translate(52 10) scale(1)">${markBody({ id: 's' })}</g>${wordmark(WHITE, 0.46, 200 / 2 - (BOX.w * 0.46) / 2, 150)}`),
};
const glow = (size, a) =>
  `<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,rgba(104,199,236,${a}),rgba(104,199,236,0) 62%)"></div>`;
const page = (w, h, bg, inner) =>
  `<html><body style="margin:0;width:${w}px;height:${h}px;background:${bg};position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center">${inner}</body></html>`;
const mark = (size, opts) => svg(size, size, '0 0 96 96', markBody(opts)).replace('<svg ', '<svg style="position:relative" ');

for (const [name, content] of Object.entries(brandFiles)) fs.writeFileSync(path.join(root, 'brand', name), content);

const pngs = [
  // [file, size, html, transparent]
  ['assets/icon.png', 1024, page(1024, 1024, DARK, `${glow(1024, 0.38)}${mark(640, {})}`), false],
  ['assets/adaptive-icon.png', 1024, page(1024, 1024, 'transparent', mark(520, {})), true],
  ['assets/adaptive-icon-monochrome.png', 1024, page(1024, 1024, 'transparent', mark(520, { mono: WHITE })), true],
  ['assets/splash-icon.png', 1024, page(1024, 1024, 'transparent', mark(560, {})), true],
  ['assets/notification-icon.png', 96, page(96, 96, 'transparent', mark(96, { mono: WHITE })), true],
  ['assets/favicon.png', 96, page(96, 96, DARK, mark(76, {})), false],
  ['store/play/icon-512.png', 512, page(512, 512, DARK, `${glow(512, 0.38)}${mark(320, {})}`), false],
];

const exe = process.env.CHROME_PATH;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
for (const [file, size, html, transparent] of pngs) {
  const p = await browser.newPage({ viewport: { width: size, height: size } });
  await p.setContent(html);
  await p.screenshot({ path: path.join(root, file), omitBackground: transparent });
  await p.close();
}
await browser.close();
console.log(`brand: ${Object.keys(brandFiles).length} SVGs, ${pngs.length} PNGs`);
