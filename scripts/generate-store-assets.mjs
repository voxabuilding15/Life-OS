/**
 * Builds the Google Play graphics from raw app captures.
 *   node scripts/generate-store-assets.mjs <dir-with-captures> [en|fr|ar]
 * Captures (390x844 @2x PNGs of the real app, in that language): dashboard, lifescore, habits, challenges, focus,
 * report, achievements, paywall.
 * Output: store/play/screenshots/01-08.png (1080x1920) + feature-graphic-1024x500.png for English,
 *         store/play/<lang>/... for French and Arabic (Arabic is laid out right-to-left).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = process.argv[2];
const lang = process.argv[3] ?? 'en';
if (!dir || !['en', 'fr', 'ar'].includes(lang)) throw new Error('usage: generate-store-assets.mjs <captures-dir> [en|fr|ar]');
const rtl = lang === 'ar';
const out = lang === 'en' ? path.join(root, 'store/play') : path.join(root, 'store/play', lang);
fs.mkdirSync(path.join(out, 'screenshots'), { recursive: true });

const b64 = (f, mime = 'image/png') => `data:${mime};base64,${fs.readFileSync(f).toString('base64')}`;
const font = (w, f) => `@font-face{font-family:Inter;font-weight:${w};src:url(${b64(path.join(root, `node_modules/@expo-google-fonts/inter/${f}/Inter_${f}.ttf`), 'font/ttf')})}`;
const arFont = (w, f) => `@font-face{font-family:Plex;font-weight:${w};src:url(${b64(path.join(root, `node_modules/@expo-google-fonts/ibm-plex-sans-arabic/${f}/IBMPlexSansArabic_${f}.ttf`), 'font/ttf')})}`;
const css = `${font(800, '800ExtraBold')}${font(500, '500Medium')}${arFont(700, '700Bold')}${arFont(500, '500Medium')}*{box-sizing:border-box}`;
const family = rtl ? 'Plex, Inter' : 'Inter';

const FRAMES = {"en": [["dashboard.png", "Your life.", "Organized.", "Tasks, habits, goals and focus in one place"], ["lifescore.png", "One number for", "your whole life", "Your daily Life Score, from 0 to 100"], ["habits.png", "Never lose a", "streak again", "Streak Freeze keeps your progress safe"], ["challenges.png", "New challenges", "every single day", "Earn XP and keep your momentum"], ["focus.png", "Deep focus,", "zero distractions", "A calm Pomodoro timer with stats"], ["report.png", "Your week,", "decoded", "See how you improved, every week"], ["achievements.png", "Level up with", "every win", "26 badges, XP and levels to unlock"], ["paywall.png", "Try Pro free", "for 7 days", "Monthly or yearly. Cancel anytime"]], "fr": [["dashboard.png", "Votre vie.", "Organisée.", "Tâches, habitudes, objectifs et concentration réunis"], ["lifescore.png", "Un score pour", "toute votre vie", "Votre Score de vie, de 0 à 100"], ["habits.png", "Ne perdez plus", "jamais une série", "Le Gel de série protège votre progression"], ["challenges.png", "De nouveaux défis", "chaque jour", "Gagnez de l’XP et gardez l’élan"], ["focus.png", "Concentration", "sans distraction", "Un minuteur Pomodoro calme avec statistiques"], ["report.png", "Votre semaine,", "décryptée", "Voyez vos progrès, chaque semaine"], ["achievements.png", "Progressez à", "chaque victoire", "26 badges, de l’XP et des niveaux à débloquer"], ["paywall.png", "Essayez Pro", "7 jours gratuits", "Mensuel ou annuel. Annulable à tout moment"]], "ar": [["dashboard.png", "حياتك.", "منظّمة.", "المهام والعادات والأهداف والتركيز في مكان واحد"], ["lifescore.png", "رقم واحد", "لحياتك كلها", "نقاط حياتك من 0 إلى 100"], ["habits.png", "لا تخسر", "سلسلتك أبدًا", "تجميد السلسلة يحمي تقدّمك"], ["challenges.png", "تحديات جديدة", "كل يوم", "اكسب XP وحافظ على زخمك"], ["focus.png", "تركيز عميق", "بلا مشتتات", "مؤقت بومودورو هادئ مع إحصاءات"], ["report.png", "أسبوعك", "مُفسَّرًا", "شاهد تقدّمك كل أسبوع"], ["achievements.png", "ارتقِ مع", "كل إنجاز", "26 وسامًا ونقاط XP ومستويات لتفتحها"], ["paywall.png", "جرّب Pro", "7 أيام مجانًا", "شهري أو سنوي. إلغاء في أي وقت"]]};
const frames = FRAMES[lang];
const TAGLINES = { en: ['Your life. ', 'Organized.', 'Habits · Tasks · Goals · Focus · Life Score'], fr: ['Votre vie. ', 'Organisée.', 'Habitudes · Tâches · Objectifs · Concentration · Score de vie'], ar: ['حياتك. ', 'منظّمة.', 'العادات · المهام · الأهداف · التركيز · نقاط الحياة'] };

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const shot = async (html, w, h, file) => {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  await p.setContent(html);
  await p.waitForTimeout(250);
  await p.screenshot({ path: file });
  await p.close();
};

for (const [i, [file, l1, l2, sub]] of frames.entries()) {
  const html = `<html><style>${css}
  body{margin:0;width:1080px;height:1920px;background:#000F0F;font-family:${family};color:#fff;position:relative;overflow:hidden}
  .g1{position:absolute;${rtl ? 'left' : 'right'}:-320px;top:-320px;width:1150px;height:1150px;background:radial-gradient(circle,rgba(104,199,236,.32),rgba(104,199,236,0) 65%)}
  .g2{position:absolute;${rtl ? 'right' : 'left'}:-420px;bottom:-320px;width:1150px;height:1150px;background:radial-gradient(circle,rgba(104,199,236,.14),rgba(104,199,236,0) 65%)}
  h1{direction:${rtl ? 'rtl' : 'ltr'};text-align:${rtl ? 'right' : 'left'};position:absolute;${rtl ? 'right' : 'left'}:84px;top:96px;margin:0;font-weight:${rtl ? 700 : 800};font-size:${rtl ? 120 : 112}px;line-height:${rtl ? 150 : 118}px;letter-spacing:${rtl ? 0 : -4}px}
  h1 span{color:#68C7EC}
  p{direction:${rtl ? 'rtl' : 'ltr'};text-align:${rtl ? 'right' : 'left'};position:absolute;${rtl ? 'right' : 'left'}:88px;top:${rtl ? 400 : 352}px;margin:0;font-weight:500;font-size:40px;color:rgba(255,255,255,.62)}
  .phone{position:absolute;left:150px;top:470px;width:780px;height:1700px;border-radius:88px;border:12px solid rgba(255,255,255,.18);overflow:hidden;box-shadow:0 0 140px rgba(104,199,236,.30);background:#000F0F}
  .phone img{width:100%;display:block}</style><body><div class="g1"></div><div class="g2"></div>
  <h1>${l1}<br><span>${l2}</span></h1><p>${sub}</p><div class="phone"><img src="${b64(path.join(dir, file))}"/></div></body></html>`;
  await shot(html, 1080, 1920, path.join(out, 'screenshots', `${String(i + 1).padStart(2, '0')}.png`));
}

// Feature graphic: horizontal lockup + tagline + a phone bleeding off the bottom edge.
const lockup = b64(path.join(root, 'brand/logo-horizontal.svg'), 'image/svg+xml');
const [t1, t2, line] = TAGLINES[lang];
await shot(`<html><style>${css}
  body{margin:0;width:1024px;height:500px;background:#000F0F;font-family:${family};color:#fff;position:relative;overflow:hidden}
  .g{position:absolute;${rtl ? 'left' : 'right'}:-60px;top:-220px;width:900px;height:900px;background:radial-gradient(circle,rgba(104,199,236,.34),rgba(104,199,236,0) 62%)}
  .phone{position:absolute;width:250px;border-radius:34px 34px 0 0;border:5px solid rgba(255,255,255,.18);border-bottom:0;overflow:hidden;box-shadow:0 0 60px rgba(104,199,236,.3)}
  .phone img{width:100%;display:block}</style><body><div class="g"></div>
  <img src="${lockup}" style="position:absolute;${rtl ? 'right' : 'left'}:64px;top:130px" width="400"/>
  <div style="direction:${rtl ? 'rtl' : 'ltr'};position:absolute;${rtl ? 'right' : 'left'}:68px;top:268px;font-weight:500;font-size:34px;color:rgba(255,255,255,.7)">${t1}<span style="color:#68C7EC;font-weight:${rtl ? 700 : 800}">${t2}</span></div>
  <div style="direction:${rtl ? 'rtl' : 'ltr'};position:absolute;${rtl ? 'right' : 'left'}:68px;top:330px;font-weight:500;font-size:22px;color:rgba(255,255,255,.5)">${line}</div>
  <div class="phone" style="${rtl ? 'right' : 'left'}:560px;top:70px"><img src="${b64(path.join(dir, 'dashboard.png'))}"/></div>
  <div class="phone" style="${rtl ? 'right' : 'left'}:790px;top:130px"><img src="${b64(path.join(dir, 'lifescore.png'))}"/></div>
  </body></html>`, 1024, 500, path.join(out, 'feature-graphic-1024x500.png'));
await browser.close();
console.log(`store assets (${lang}): ${frames.length} screenshots + feature graphic`);
