# Newsletter → Outlook paste (lessons learned)

**Date confirmed:** 2026-07-20  
**Applies to:** Loan Officer coach **and** Realtor / Agent Sales Coach  

## Root cause of the formatting break (personal note + photo/video)

Desktop Outlook (Word HTML engine, e.g. Click-to-Run build 2606) often **mis-aligns or blows up layout** when personal photo / video thumbnails render at **full newsletter content width** (~540px inside a 600px column).

**What fixed it (user-confirmed):** scale personal media **down** so it no longer fills the card edge-to-edge.

**What did *not* help (and regressed the product):** aggressive HTML rewrites (table-nesting “repair”, flattening/rebuilding sections, MSO wrapper experiments). Those caused:

- Double teal bars in preview  
- Partial paste (e.g. only trivia answer + referral + disclaimer)  
- Lost content after post-processing  

**Do not re-open that path** unless you have a fixture HTML sample and can prove preview + full paste after each tiny change.

## Permanent product rule (media size caps)

Both apps enforce the same caps in newsletter generators:

| Constant | Value | Role |
|----------|--------|------|
| `NL_MEDIA_SIZE_DEFAULT` | **70** | Default slider % |
| `NL_MEDIA_SIZE_MAX` | **75** | Max slider % |
| `NL_MEDIA_MAX_PX` | **400** | Hard max rendered width (px) |

Locations:

- LO: `js/features/newsletter-generator.js`  
- Realtor: `realtor-sales-coach/js/features/newsletter-generator.js`  
- Sliders: `#nl-personal-photo-size`, `#nl-personal-video-size` in each app’s `index.html` (`min=30`, `max=75`, default `value=70`)

`getPersonalPhotoWidthPx()` / `getPersonalVideoWidthPx()` always clamp with `Math.min(NL_MEDIA_MAX_PX, …)` so even old localStorage values of 100% cannot emit 540px media.

## Related historical baseline (different bug)

`realtor-sales-coach/backups/VERSION-v312-outlook-paste-good-baseline.txt` (2026-07-07) fixed a **partial paste / footer-only** bug caused by **destructive signature orphan stripping**, not by image size. That is separate from the 2026-07-20 media-width formatting fix.

## Copy path (2026-07-20+)

Both LO and Realtor **Copy for Outlook** use the same light pipeline:

1. Optional branding inject if signature/disclaimer markers are missing (Realtor only)  
2. Hero centering + teal-card padding tweaks  
3. Personal photo/video media caps  
4. Module width normalize + content-row centering  
5. Simple `wrapBodyForOutlookPaste` (one outer presentation table)  

Realtor previously also ran `hardenNewsletterForOutlookPaste` (module stacking, title rebuild, footer peel/rebuild). That path is **disabled for copy** because it produced partial paste (referral + disclaimer only). Keep those helpers in the file for emergency recovery only — do not re-wire them into `getCleanOutlookHTML` without a full-paste fixture test.

## If Outlook paste looks wrong again

1. Confirm personal photo/video are capped (preview should show ≤ ~400px media).  
2. Hard-refresh so `newsletter-generator.js` cache bust is current.  
3. Generate a **new** newsletter (don’t reuse old HTML stuck in `localStorage` / `#nl-html-raw`).  
4. Use **Copy for Outlook**, paste into a **new blank** email.  
5. Only then investigate structure/clipboard — **do not** first “fix tables” across the whole letter.

## Optional future experiments (low priority)

- Slightly wider email column (e.g. 600 → 640) **while keeping** the 400px media cap  
- Do **not** remove the media cap to “match full card width” without re-testing Outlook desktop paste  
