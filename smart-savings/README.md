# Smart Savings Calculator (LO — native coach section)

Loan Officer refinance calculator, embedded **natively** in the Loan Officer Sales Coach (no iframe).

## How it works

1. Sidebar → **Smart Savings Calculator** (`#smart-savings`)
2. Host (`js/features/smart-savings-host.js`) on first open:
   - Scopes `/smart-savings/css/app.css` under `.smart-savings-root` **and** `#ss-guided-scroll`
   - Injects body markup from `/smart-savings/app.html` into `#smart-savings-root`
   - Calls `window.initSmartSavings()`
3. **Full workspace** (default for LO): calculator stays in-page for client meetings
4. **Guided tour**: opens a body-level modal (`#ss-guided-layer`), moves `.app-shell` into `#ss-guided-scroll`, and walks 6 steps with sticky chrome + footer nav
5. Nested calc modals (mortgage, debts, etc.) lift into `#ss-modal-host` above the guided layer
6. AI uses LO coach proxy: `POST /api/v1/chat/completions`

### Guided modal notes

- Host never scrubs/restores while `#ss-guided-layer.is-open` (that race was the old in-page fallback)
- Multi-monitor safety: window-scoped `position: fixed`, no transform/filter hover thrash, `contain: layout paint` on the dialog

## Sync assets (after calculator worktree changes)

```bash
npm run sync:smart-savings
# or
node smart-savings/_boot_sync.cjs
```

Source default:

`/home/adam/.grok/worktrees/refinance calculators/2026-07-16-baa3a2de`

Override: `SMART_SAVINGS_SRC=/path node smart-savings/_boot_sync.cjs`

## Standalone (optional)

`/smart-savings/app.html` still works as a full page for debugging.

## Tests

```bash
node smart-savings/js/calculator-core.test.js
```
