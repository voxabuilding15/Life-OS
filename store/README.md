# Google Play launch kit

| Asset | File |
| --- | --- |
| App icon 512x512 | `play/icon-512.png` |
| Feature graphic 1024x500 | `play/feature-graphic-1024x500.png` |
| 8 phone screenshots 1080x1920 | `play/screenshots/01-08.png` |
| Listing copy (title, short + full description, release notes) | `listing.md`, `listing.fr.md`, `listing.ar.md` |
| Localized graphics (screenshots + feature graphic) | `play/fr/`, `play/ar/` |
| Privacy policy (draft), account deletion page (draft) | `privacy-policy.md`, `account-deletion.md` |
| Data safety + content rating answers | `data-safety.md` |
| Step-by-step release and device test plan | `release-checklist.md` |

Regenerate graphics after UI or brand changes: `npm run brand` (icons, logo SVGs) and `node scripts/generate-store-assets.mjs <captures-dir> [en|fr|ar]` (screenshots + feature graphic; Arabic is laid out right-to-left). Captures are real app screenshots (build the web preview with `EXPO_PUBLIC_ALLOW_PREVIEW=1`).
