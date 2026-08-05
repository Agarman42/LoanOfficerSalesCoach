# Mortgage Calculator Scenario Studio — Design Spec

**Date:** 2026-08-05  
**Status:** Approved (conversation) — awaiting user review of this written spec  
**Apps in scope:** Loan Officer Sales Coach (`#calculator` in monorepo root)  
**Out of scope (v1):** Smart Savings refi tool, hosted share links, full CD cash-to-close, Realtor port  

---

## 1. Problem

The existing Mortgage Calculator + HomeNow DPA math is solid, but the UX is form-first:

- Results sit below a long form; the monthly payment is easy to lose mid-conversation.
- Standard vs “accelerated” is only one comparison; LOs cannot park multiple full scenarios (e.g. 5% conventional vs HomeNow 3.5% vs +$200 extra).
- Client handoff is raw copy of on-screen text — not a clear multi-option story.
- HomeNow is easy to under-explain (1st + DPA 2nd + UFMIP).

**Primary jobs (ranked):**

1. Calculate a realistic housing payment quickly.
2. Compare 2–3 full scenarios side by side.
3. Send those scenarios to a client in a clear, easy-to-process format.

---

## 2. Goals & success criteria

| Goal | Success measure |
|------|-----------------|
| Speed | LO runs a useful payment in &lt; 30s from open |
| Compare | LO parks up to 3 scenarios and loads/renames/removes any |
| Client send | Copy + print/PDF produce something sendable without heavy rewrite |
| HomeNow story | Combined payment + explicit 1st vs 2nd breakdown always visible when enabled |
| Math fidelity | No silent formula drift vs current `calculateAdvanced()` behavior |

**Non-goals (v1):** shareable URLs, email-template HTML pipeline, full closing-cost engine, multi-user scenario cloud sync.

---

## 3. Recommended approach

**Scenario Studio** — redesign the existing calculator section (Approach B).

| Approach | Verdict |
|----------|---------|
| A — Visual polish only | Rejected — insufficient for multi-scenario send |
| **B — Scenario Studio** | **Chosen** — sticky hero, 3 slots, compare board, copy + PDF |
| C — Hosted share links | Deferred — needs infra; design for later extension |

**Client delivery (v1):**

- **Copy for client** — short multi-option plain text (email/SMS friendly).
- **Print / PDF** — browser print with dedicated print CSS (Save as PDF).
- Keep existing **Save to My Saved Items** for LO vault.

---

## 4. User experience

### 4.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Sticky hero: monthly $ · PITI stack · mode + HomeNow chips  │
│ Actions: Save scenario · Copy for client · Print/PDF        │
├──────────────────────┬──────────────────────────────────────┤
│ Compact inputs       │ Live results (payment stack,         │
│ Loan · Costs · Extra │ interest, payoff, HomeNow strip)     │
├──────────────────────┴──────────────────────────────────────┤
│ Scenario board (0–3 cards): label · monthly · key facts     │
│ Load · Rename · Remove · badges (lowest payment / etc.)     │
└─────────────────────────────────────────────────────────────┘
```

- **Desktop:** two-column inputs | live results; scenario board full width below.
- **Mobile:** stack hero → inputs → results → board; large tap targets.
- **Dark mode:** existing Ruoff tokens (`#002B5C`, `#00A89D`, `#F15A29`).

### 4.2 Sticky hero

Always shows **current working** scenario:

- Large **total monthly housing payment** (includes HomeNow 2nd when on).
- Compact horizontal **payment stack** (P&I, taxes, insurance, PMI/MIP, HomeNow 2nd if any).
- Chips: Purchase | Refinance; HomeNow on/off (Purchase only); optional “biweekly / extra” active chip.
- Primary CTA: **Save scenario** (disabled or toast when board full at 3).

### 4.3 Inputs (compact, same fields)

Group into three blocks (collapse secondary on small screens if needed):

1. **Loan** — Home price / DP %|$ / loan amount (purchase) or loan amount (refi); rate; term.
2. **Housing costs** — annual taxes; annual insurance; PMI/MIP rate.
3. **Accelerate** — extra monthly; biweekly checkbox.

**HomeNow block** (Purchase only):

- Toggle (chip or switch, not only buried checkbox).
- DPA 3.5% | 5%.
- When on: force/default DP guidance to 0 for 100% financing story; set FHA MIP as today.
- Microcopy: “Zero traditional down; DPA is a second mortgage. UFMIP financed into the 1st.”

Presets remain (First-time HomeNow, Investor, Refi + extra) but fill the **working** scenario only (do not auto-save).

### 4.4 Live results panel

Replace pure dual-card dump with:

1. **Payment stack** (visual bar + line items) for current monthly housing.
2. **Standard vs accelerated** (only when extra &gt; 0 or biweekly): payoff time + interest savings (existing math).
3. **HomeNow strip** when enabled: DPA amount, 2nd rate, 2nd payment, note on UFMIP.

Disclaimer remains: estimates only; confirm with lender; HomeNow eligibility applies.

### 4.5 Scenario board

- Max **3** slots (`A`, `B`, `C` or custom labels).
- **Save current** → next free slot with auto-label (see naming rules).
- Each card shows:
  - Label (editable)
  - Total monthly (primary)
  - Loan amount(s); down/cash-lite; HomeNow badge if applicable
  - Actions: Load · Rename · Remove
- When ≥2 scenarios: highlight **Lowest monthly** (and **Lowest cash-to-close lite** when both have comparable purchase cash fields).
- **Load** overwrites working inputs and re-runs calc.
- Optional: persist board to `localStorage` so refresh does not wipe mid-meeting.

### 4.6 Auto-label rules

| Condition | Default label |
|-----------|----------------|
| HomeNow + DPA % | `HomeNow {pct}%` |
| Purchase + DP % | `{dp}% down` |
| Refinance | `Refi {term}yr` |
| Extra or biweekly | append `+extra` or `+biweekly` |
| Collision | append ` (2)`, ` (3)` |

User can rename any time.

---

## 5. Client send formats

### 5.1 Copy for client

Structured plain text, LO voice, multi-scenario:

```
Hi — payment options for a $[price] home:

Option A — [label]
  Monthly housing ≈ $[mo]  |  Down ≈ $[down]

Option B — [label]
  Monthly housing ≈ $[mo]  (includes HomeNow 2nd if applicable)  |  Down ≈ $[down]

Estimates only — not a commitment to lend. Program eligibility may apply (HomeNow).
```

- If only working scenario and board empty: copy **current** only.
- Prefer board contents when ≥1 saved; include current as “Working” only if not already saved (implementation detail: copy **board slots** when any exist, else current).

### 5.2 Print / PDF

- Hidden or on-demand **print root** (`#calc-print-sheet`) populated from board (or current if empty).
- `@media print` stylesheet: hide coach chrome/sidebar; white background; scenario columns; LO name/NMLS from profile when available; disclaimer footer.
- User uses browser **Print → Save as PDF**.

### 5.3 Existing vault save

Keep **Save to My Saved Items** using a clean multi-scenario text payload (same structure as copy, or slightly longer breakdown).

---

## 6. Math fidelity (must preserve)

Re-use current rules from `js/features/calculator.js` (`calculateAdvanced`):

| Rule | Behavior |
|------|----------|
| Purchase DP | % or $ toggle; bidirectional with loan amount |
| HomeNow | UFMIP 1.75% financed into 1st; DPA = ceil(price × pct); 2nd rate = note rate + 2%; 10-year term; 2nd payment always monthly |
| PMI/MIP | HomeNow → FHA MIP path via `autoSetFHA_MIP`; else PMI if down &lt; 20% on purchase |
| Biweekly | Accelerates first mortgage only (`× 13/12`); HomeNow 2nd stays monthly |
| Interest savings | On HomeNow, savings computed on first mortgage only |
| Refi mode | Direct loan amount; hide HomeNow UI |

Extract pure functions (e.g. `computeMortgageScenario(inputs) → result`) so UI render and scenario snapshots share one path. Add lightweight unit smoke tests for: standard purchase, HomeNow 3.5%, biweekly + extra, refi.

**Cash-to-close lite (v1):** for purchase, show **down payment amount** only (not full CD). HomeNow with 0 down shows `$0 down` with asterisk. Do not invent prepaid interest, title, or HOA.

---

## 7. Data model

```js
// Working + saved scenarios
{
  id: string,           // uuid-ish
  label: string,
  createdAt: ISO string,
  inputs: {
    mode: 'purchase' | 'refinance',
    homePrice: number,
    downPayment: number,
    downIsPercent: boolean,
    loanAmount: number,      // effective first-mortgage base before UFMIP
    rate: number,
    termYears: number,
    taxesAnnual: number,
    insuranceAnnual: number,
    pmiRate: number,
    extraMonthly: number,
    biweekly: boolean,
    homeNow: boolean,
    dpaPercent: 3.5 | 5
  },
  results: {
    baseLoanAmount: number,
    firstLoanWithUfmip: number,  // if HomeNow
    monthlyPI: number,
    monthlyTaxes: number,
    monthlyInsurance: number,
    monthlyPMI: number,
    monthlyHomeNowSecond: number,
    totalMonthly: number,        // display housing payment
    standardTotalMonthly: number,
    totalInterestStandard: number,
    totalInterestCustom: number,
    interestSavings: number,
    monthsToPayoff: number,
    dpaAmount: number,
    secondRate: number,
    downAmount: number
  }
}
```

Storage key (optional persist): `loCalcScenarioBoard_v1`.

---

## 8. Technical plan

### Files

| File | Change |
|------|--------|
| `index.html` | Rebuild `#calculator` markup: hero, grouped inputs, results shell, scenario board, print root |
| `js/features/calculator.js` | Pure compute; render functions; scenario CRUD; copy/print; wire listeners |
| `css/main.css` (or small calculator CSS block) | Sticky hero, stack bar, board cards, print media |
| `js/feature-loader.js` | Cache-bust query for calculator.js |
| `js/app-version.js` | Bump on ship |
| Optional: `js/features/calculator-core.test.js` or extend smoke | Math regression |

### Architecture

1. `readInputsFromDom()` → inputs object  
2. `computeMortgageScenario(inputs)` → results (no DOM)  
3. `renderHero(results)` / `renderResults(results)` / `renderBoard(scenarios)`  
4. On any input change: recompute → re-render live surfaces  
5. Save: push `{ inputs, results, label }` to board array  
6. Load: write inputs to DOM → recompute  

Avoid full `innerHTML` wipe of inputs (preserve focus). Prefer updating result/board containers only.

### Accessibility

- Labels on all inputs; keyboard operable DPA and mode toggles.
- Scenario card buttons have clear names (`Load HomeNow 3.5%`).
- Color is not the only indicator for “lowest monthly” (badge text).

---

## 9. Phased delivery

| Phase | Scope |
|-------|--------|
| **P1 (this ship)** | Layout + sticky hero + payment stack + HomeNow as first-class + scenario board (3) + rename/load/remove + copy client text + print/PDF + localStorage |
| **P2** | Email HTML block; richer cash-to-close lite; LO profile branding on print |
| **P3** | Hosted share links (if product wants) |
| **P4** | Realtor port if product prioritizes |

---

## 10. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Math regression | Pure extract + smoke tests for HomeNow / biweekly / DP toggle |
| Focus loss while typing | Do not re-render input tree on every keystroke |
| Board full confusion | Toast “Replace a scenario or remove one” + optional replace-oldest |
| Print looks broken | Dedicated print root + `@media print` hide chrome |
| Scope creep into Smart Savings | Explicit out of scope |

---

## 11. Open decisions (resolved)

| Decision | Resolution |
|----------|------------|
| Primary use cases | Meeting + prep + send (speed → compare → client) |
| Delivery | Copy + print/PDF first |
| Scenario count | Max 3 |
| Share links | Not v1 |
| Cash-to-close | Down only (lite) |

---

## 12. Approval

- Conversation design approved by user 2026-08-05.
- This document is the written spec for implementation planning.

**Next step after user confirms this file:** write implementation plan (`writing-plans`), then implement P1.
