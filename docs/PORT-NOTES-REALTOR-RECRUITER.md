# Port Notes: LO Coach → Realtor & Recruiter Tools

**Last updated:** 2026-07-19  
**Source of truth:** Loan Officer Sales Coach (`index.html` + `js/features/*`)  
**Targets:** `realtor-sales-coach/`, `realtor-push-repo/`, `recruiter-sales-coach/`

---

## Explicitly DO NOT port

| Item | Why |
|------|-----|
| **Smart Savings calculator** | LO / mortgage borrower tool only |
| Mortgage-only underwriting depth | Re-author for audience if needed |

---

## Port status

| Feature | LO | Realtor | Recruiter |
|---------|----|---------|-----------|
| Newsletter 8upload Hotlink + YouTube tips | ✅ form + wizard | ✅ form + profile branding | n/a |
| Newsletter guided wizard | ✅ | ✅ | n/a |
| Home favorites | ✅ | ✅ | ✅ |
| Business Plan wizard | ✅ | ✅ | ✅ |
| Content Studio hub | ✅ | ✅ | ✅ |
| Content daily-loop → hub | ✅ | ✅ | ✅ |
| Clickable home status chips | ✅ | ✅ | ✅ |
| Profile logo + headshot + 8upload tip | ✅ | ✅ (already) | optional |
| Global search → Content Studio | ✅ | ✅ | ✅ |
| Denser home polish | ✅ | partial | partial |
| Smart Savings | ✅ LO only | ❌ | ❌ |

---

## Remaining optional polish

- [ ] Pixel-match LO `home-loop-rail` markup on Realtor/Recruiter  
- [ ] Recruiter profile logo/headshot if newsletters/branding expand  
- [ ] Wire LO logo/headshot into newsletter HTML generation when company signature uses them  

---

## Free media tips

- Photos / logos / headshots: [8upload.com](https://8upload.com/) — **Hotlink / Direct link**  
- Video: free [YouTube upload](https://www.youtube.com/upload) — Unlisted or Public  

---

## Smoke checklist (hard refresh)

```
[ ] My Profile → Voice & Links → logo/headshot fields + 8upload tip
[ ] Global search "content studio" → Content Studio hub
[ ] Home favorites + chips + content loop
[ ] Realtor NL guided wizard + plan wizard
[ ] Smart Savings only on LO
```
