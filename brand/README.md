# Life OS brand system

The mark is an **orbit**: a ring in progress, a node that has just left the top (momentum), and a core (you). It is built on a 96 x 96 grid: ring radius 34, stroke 6, orbit node radius 6.5 at 12 o'clock, core radius 11 with a 4.5 hole.

## Colours (only these)
| Name | Hex | Use |
| --- | --- | --- |
| Life Blue | `#68C7EC` | the mark, accents, primary actions |
| Deep Teal Black | `#000F0F` | backgrounds, the mark on light surfaces |
| White | `#FFFFFF` | wordmark, text, the orbit node |

## Typeface
Inter ExtraBold, -3.2 tracking, converted to outlines (`src/lib/brandPaths.ts`) so the wordmark is identical on every platform.

## Files
| File | Use |
| --- | --- |
| `mark.svg` | full-colour mark on dark |
| `mark-white.svg`, `mark-dark.svg` | single-colour mark (notification icon, themed icons, light backgrounds) |
| `wordmark-white.svg`, `wordmark-dark.svg` | wordmark only |
| `logo-horizontal.svg` (+ `-dark`) | headers, store graphics, web |
| `logo-stacked.svg` | splash, posters |

App icon, adaptive foreground + monochrome (Android 13 themed icons), splash, notification and favicon PNGs are generated into `assets/` by `npm run brand`.

## Rules
- Clear space: at least the core diameter (22 units) on every side of the mark; at least the node diameter around the lockup.
- Minimum size: mark 16 px, horizontal lockup 72 px wide.
- On white or light backgrounds use `*-dark` files. Never recolour, outline, rotate, stretch, add shadows, or place the full-colour mark on busy photos.
- The ambient glow is an app/store flourish, not part of the logo.
