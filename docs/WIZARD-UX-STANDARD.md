# Wizard & form UX standard

**Last updated:** 2026-07-19

## The rule

Every tool that has a guided path and a full form uses the **same control**:

| Control | Label | Behavior |
|---------|--------|----------|
| Segmented toggle | **Guided setup** | Opens modal/step wizard |
| Segmented toggle | **Full form** | Scrolls to / shows full page form |

Smart Savings uses the same chrome with domain labels:

| Control | Label | Behavior |
|---------|--------|----------|
| Segmented toggle | **Guided setup** | Guided meeting modal (step flow) |
| Segmented toggle | **Full form** | Full workspace (all sections) |

## Placement

```
Title + short intro
How it works (3 cards + maximize)   ← keep on generators
[ Guided setup | Full form ]        ← ONE control only
Profile strip (optional, one line)
Form / workspace
Generate
Cross-tool handoff (bottom only)
```

## Do not

- Stack a big “GUIDED SETUP” card **and** a coach guide button that opens the same wizard  
- Put “jump to another tool” CTAs in the hero  
- Add Sync / Baseline / Edit Full Profile button walls when profile auto-loads  

## Implementation

- Markup: `.coach-mode-bar` + `.coach-mode-toggle` + `.coach-mode-btn`  
- Wiring: `js/features/coach-mode-switch.js`  
- Wizards call `setCoachModeSwitch(tool, 'guided'|'full')` on open/close  
- Tools: `planning`, `bio`, `newsletter` (+ Smart Savings native mode-bar)

## Cleanup done

- Removed duplicate Profile Awareness banners on Social / Blog / Scripts / Newsletter  
- Business Plan coach guide no longer has a second guided CTA  
- Shared mode switch on Bio, Newsletter, Business Plan  
- Smart Savings toggle labels aligned to Guided setup / Full form  
