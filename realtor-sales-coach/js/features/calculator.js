/**
 * js/features/calculator.js
 *
 * Mortgage Calculator — Scenario Studio
 * - Pure compute (HomeNow DPA math preserved)
 * - Sticky hero + payment stack
 * - Up to 3 parked scenarios (localStorage)
 * - Copy for client + Print/PDF
 *
 * Self-initializes. Exposes public API on window.
 */

// === GLOBAL STATE ===
let homeNowEnabled = false;
let selectedDPAPercent = 3.5;
let calcScenarioBoard = [];
let lastCalcBundle = null; // { inputs, results, valid, error }

const CALC_BOARD_KEY =
  (typeof window !== 'undefined' && window.CALC_COACH_VARIANT === 'realtor')
    ? 'reCalcScenarioBoard_v1'
    : 'loCalcScenarioBoard_v1';
const CALC_MAX_SCENARIOS = 3;

// ─────────────────────────────────────────────────────────────
// Pure math
// ─────────────────────────────────────────────────────────────

function calculateMonthlyPayment(principal, annualRate, years) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (!principal || principal <= 0 || !years || years <= 0) return 0;
  if (!r) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function fhaMipRatePercent(downPercent) {
  const ltv = 1 - (Number(downPercent) || 0) / 100;
  return ltv > 0.95 ? 0.55 : 0.5;
}

/**
 * @param {object} inputs
 * @returns {{ valid: boolean, error?: string, results?: object }}
 */
function computeMortgageScenario(inputs) {
  const isPurchase = inputs.mode === 'purchase';
  const homePrice = Number(inputs.homePrice) || 0;
  const annualRate = Number(inputs.rate) || 0;
  const termYears = Number(inputs.termYears) || 0;
  const annualTaxes = Number(inputs.taxesAnnual) || 0;
  const annualInsurance = Number(inputs.insuranceAnnual) || 0;
  // PMI input: default monthly $; optional annual % of base loan
  const pmiIsPercent =
    inputs.pmiIsDollar === false ||
    inputs.pmiIsDollar === 'percent' ||
    inputs.pmiInputMode === 'percent';
  let pmiInput = Number(inputs.pmiInput != null ? inputs.pmiInput : inputs.pmiRate) || 0;
  const extraMonthly = Number(inputs.extraMonthly) || 0;
  const biweekly = !!inputs.biweekly;
  const homeNow = isPurchase && !!inputs.homeNow;
  const dpaPercent = Number(inputs.dpaPercent) === 5 ? 5 : 3.5;

  let baseLoanAmount = Number(inputs.loanAmount) || 0;
  let downAmount = Number(inputs.downAmount) || 0;

  if (isPurchase) {
    if (inputs.downIsPercent) {
      downAmount = (Number(inputs.downPayment) / 100) * homePrice;
    } else {
      downAmount = Number(inputs.downPayment) || 0;
    }
    // Prefer explicit loanAmount when provided as the source of truth after DOM sync
    if (inputs.loanAmount != null && inputs.loanAmount !== '' && Number(inputs.loanAmount) > 0 && !inputs._forceFromDown) {
      baseLoanAmount = Number(inputs.loanAmount);
      downAmount = Math.max(0, homePrice - baseLoanAmount);
    } else {
      baseLoanAmount = Math.max(0, homePrice - downAmount);
    }
  }

  if (baseLoanAmount <= 0 || annualRate <= 0 || termYears <= 0) {
    return { valid: false, error: 'Please enter valid loan amount, rate, and term.' };
  }

  // HomeNow: finance UFMIP into first mortgage
  let firstLoan = baseLoanAmount;
  if (homeNow) {
    firstLoan = baseLoanAmount + baseLoanAmount * 0.0175;
  }

  const downPctForMip = homePrice > 0 ? (downAmount / homePrice) * 100 : 0;
  // Auto MIP when HomeNow and field empty
  if (homeNow && !pmiInput) {
    const mipPct = fhaMipRatePercent(downPctForMip);
    if (pmiIsPercent) {
      pmiInput = mipPct;
    } else {
      pmiInput = (baseLoanAmount * mipPct) / 100 / 12;
    }
  }

  const monthlyRate = annualRate / 100 / 12;
  const totalPayments = termYears * 12;
  const standardPI =
    firstLoan * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1) || 0;

  const monthlyTaxes = annualTaxes / 12;
  const monthlyInsurance = annualInsurance / 12;

  let monthlyPMI = 0;
  let pmiRateUsed = 0;
  if (pmiIsPercent) {
    pmiRateUsed = pmiInput;
    if (isPurchase) {
      const downPercent = homePrice > 0 ? ((homePrice - baseLoanAmount) / homePrice) * 100 : 0;
      if (homeNow) {
        monthlyPMI = (baseLoanAmount * pmiRateUsed) / 100 / 12;
      } else {
        monthlyPMI = downPercent < 20 ? (baseLoanAmount * pmiRateUsed) / 100 / 12 : 0;
      }
    } else {
      monthlyPMI = (baseLoanAmount * pmiRateUsed) / 100 / 12;
    }
  } else {
    // Dollar mode: LO enters monthly PMI/MIP $ (most common)
    monthlyPMI = Math.max(0, pmiInput);
    if (isPurchase && !homeNow) {
      const downPercent = homePrice > 0 ? ((homePrice - baseLoanAmount) / homePrice) * 100 : 0;
      // If down ≥ 20% and they left $0, stay 0; if they typed a $ amount, honor it
      if (downPercent >= 20 && pmiInput === 0) monthlyPMI = 0;
    }
    pmiRateUsed = baseLoanAmount > 0 ? ((monthlyPMI * 12) / baseLoanAmount) * 100 : 0;
  }

  let monthlyHomeNowSecond = 0;
  let dpaAmount = 0;
  let secondRate = 0;
  if (homeNow) {
    dpaAmount = Math.ceil(homePrice * (dpaPercent / 100));
    secondRate = annualRate + 2;
    monthlyHomeNowSecond = calculateMonthlyPayment(dpaAmount, secondRate, 10);
  }

  const basePITI = standardPI + monthlyTaxes + monthlyInsurance + monthlyPMI;
  let displayPayment = basePITI + extraMonthly;
  let principalPayment = standardPI + extraMonthly;

  if (biweekly) {
    displayPayment = ((basePITI + extraMonthly) * 13) / 12;
    principalPayment = ((standardPI + extraMonthly) * 13) / 12;
  }
  if (homeNow) displayPayment += monthlyHomeNowSecond;

  let standardTotalMonthly = basePITI;
  if (homeNow) standardTotalMonthly += monthlyHomeNowSecond;

  let monthsToPayoff = totalPayments;
  if (extraMonthly > 0 || biweekly) {
    const r = monthlyRate;
    const p = principalPayment;
    const logArg = p / (p - firstLoan * r);
    if (logArg > 1) {
      monthsToPayoff = Math.ceil(Math.log(logArg) / Math.log(1 + r));
    }
  }

  let secondInterest = 0;
  if (homeNow) {
    const secondPmtCalc = calculateMonthlyPayment(dpaAmount, secondRate, 10);
    secondInterest = secondPmtCalc * 120 - dpaAmount;
  }

  const standardInterest = standardPI * totalPayments - baseLoanAmount + secondInterest;
  const customInterest = principalPayment * monthsToPayoff - baseLoanAmount + secondInterest;

  let interestSavings = standardInterest - customInterest;
  if (homeNow) {
    const firstStd = standardPI * totalPayments - baseLoanAmount;
    const firstCustom = principalPayment * monthsToPayoff - baseLoanAmount;
    interestSavings = firstStd - firstCustom;
  }

  return {
    valid: true,
    results: {
      baseLoanAmount,
      firstLoanWithUfmip: firstLoan,
      monthlyPI: standardPI,
      monthlyTaxes,
      monthlyInsurance,
      monthlyPMI,
      monthlyHomeNowSecond,
      totalMonthly: displayPayment,
      standardTotalMonthly,
      totalInterestStandard: standardInterest,
      totalInterestCustom: customInterest,
      interestSavings,
      monthsToPayoff,
      yearsToPayoff: Math.floor(monthsToPayoff / 12),
      remainingMonths: monthsToPayoff % 12,
      dpaAmount,
      secondRate,
      downAmount,
      homePrice,
      termYears,
      annualRate,
      extraMonthly,
      biweekly,
      homeNow,
      dpaPercent,
      mode: isPurchase ? 'purchase' : 'refinance',
      pmiRateUsed,
      pmiIsDollar: !pmiIsPercent,
      pmiInput
    }
  };
}

// ─────────────────────────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────────────────────────

function money0(n) {
  return '$' + Math.round(Number(n) || 0).toLocaleString();
}

function money2(n) {
  return (
    '$' +
    (Number(n) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  );
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function calcToast(msg) {
  const toast = document.createElement('div');
  toast.className =
    'fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#002B5C] text-white px-5 py-2.5 rounded-2xl text-sm shadow-xl z-[999]';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// ─────────────────────────────────────────────────────────────
// DOM ↔ inputs
// ─────────────────────────────────────────────────────────────

function isPurchaseMode() {
  const btn = document.getElementById('mode-purchase');
  if (!btn) return true;
  return btn.classList.contains('is-active') || btn.classList.contains('bg-gradient-to-r');
}

function isDownPercentMode() {
  const btn = document.getElementById('dp-percent-btn');
  if (!btn) return true;
  return btn.classList.contains('is-active') || btn.classList.contains('bg-gradient-to-r');
}

/** PMI unit: default dollar/month (more common for LOs). */
function isPmiDollarMode() {
  const btn = document.getElementById('pmi-dollar-btn');
  if (!btn) return true;
  // If neither marked, default dollar
  if (!btn.classList.contains('is-active') && document.getElementById('pmi-percent-btn')?.classList.contains('is-active')) {
    return false;
  }
  return btn.classList.contains('is-active') || !document.getElementById('pmi-percent-btn')?.classList.contains('is-active');
}

/**
 * Keep purchase price / down / loan linked.
 * - Edit price or down → loan = price − down
 * - Edit loan → down updates (as % or $ depending on toggle)
 * While the user is typing loan amount, loan is the driver so down % tracks correctly.
 */
function syncPurchaseLoanFields() {
  if (!isPurchaseMode()) return;
  const homePrice = parseFloat(document.getElementById('homePrice')?.value) || 0;
  const dpEl = document.getElementById('downPayment');
  const loanEl = document.getElementById('loanAmountManual');
  if (!dpEl || !loanEl) return;

  const isPercent = isDownPercentMode();
  const focusedId = document.activeElement ? document.activeElement.id : '';
  const downPaymentInput = parseFloat(dpEl.value) || 0;
  const loanAmountInput = parseFloat(loanEl.value) || 0;

  // Loan field is driving: update down payment to match price − loan
  if (focusedId === 'loanAmountManual' && homePrice > 0) {
    const loanClamped = Math.max(0, Math.min(loanAmountInput || 0, homePrice));
    const downAmount = Math.max(0, homePrice - loanClamped);
    if (isPercent) {
      const pct = (downAmount / homePrice) * 100;
      if (Math.abs(pct - downPaymentInput) > 0.005) {
        dpEl.value = Math.abs(pct - Math.round(pct)) < 0.005 ? String(Math.round(pct)) : pct.toFixed(2);
      }
    } else if (Math.abs(downAmount - downPaymentInput) > 0.5) {
      dpEl.value = String(Math.round(downAmount));
    }
    return;
  }

  // Price or down is driving: update loan = price − down
  const downAmount = isPercent ? (downPaymentInput / 100) * homePrice : downPaymentInput;
  const loanAmount = Math.max(0, homePrice - downAmount);
  const cur = parseFloat(loanEl.value) || 0;
  if (Math.abs(loanAmount - cur) > 0.5) {
    loanEl.value = String(Math.round(loanAmount));
  }
}

function readInputsFromDom() {
  const isPurchase = isPurchaseMode();
  const isPercent = isDownPercentMode();
  const homePrice = parseFloat(document.getElementById('homePrice')?.value) || 0;
  const downPayment = parseFloat(document.getElementById('downPayment')?.value) || 0;
  let loanAmount = isPurchase
    ? parseFloat(document.getElementById('loanAmountManual')?.value) || 0
    : parseFloat(document.getElementById('loanAmountDirect')?.value) || 0;

  let downAmount = 0;
  if (isPurchase) {
    const focusedId = document.activeElement ? document.activeElement.id : '';
    if (focusedId === 'loanAmountManual' && loanAmount > 0) {
      // Loan is source of truth while typing it
      loanAmount = Math.max(0, Math.min(loanAmount, homePrice || loanAmount));
      downAmount = Math.max(0, homePrice - loanAmount);
    } else {
      downAmount = isPercent ? (downPayment / 100) * homePrice : downPayment;
      loanAmount = Math.max(0, homePrice - downAmount);
    }
  }

  return {
    mode: isPurchase ? 'purchase' : 'refinance',
    homePrice,
    downPayment: isPurchase
      ? (isPercent
          ? (homePrice > 0 ? (downAmount / homePrice) * 100 : downPayment)
          : downAmount)
      : downPayment,
    downIsPercent: isPercent,
    downAmount,
    loanAmount,
    rate: parseFloat(document.getElementById('rate')?.value) || 0,
    termYears: parseFloat(document.getElementById('term')?.value) || 30,
    taxesAnnual: parseFloat(document.getElementById('taxes')?.value) || 0,
    insuranceAnnual: parseFloat(document.getElementById('insurance')?.value) || 0,
    pmiRate: parseFloat(document.getElementById('pmi')?.value) || 0,
    pmiInput: parseFloat(document.getElementById('pmi')?.value) || 0,
    pmiIsDollar: isPmiDollarMode(),
    extraMonthly: parseFloat(document.getElementById('extraMonthly')?.value) || 0,
    biweekly: !!(document.getElementById('biweekly')?.checked),
    homeNow: homeNowEnabled && isPurchase,
    dpaPercent: selectedDPAPercent
  };
}

function writeInputsToDom(inputs) {
  const isPurchase = inputs.mode === 'purchase';
  setCalcMode(isPurchase ? 'purchase' : 'refinance', { silent: true });

  if (inputs.downIsPercent !== false) {
    setDownMode('percent', { silent: true });
  } else {
    setDownMode('dollar', { silent: true });
  }

  const pmiDollar = inputs.pmiIsDollar !== false && inputs.pmiInputMode !== 'percent';
  setPmiMode(pmiDollar ? 'dollar' : 'percent', { silent: true });

  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el && v != null && v !== '') el.value = v;
  };

  setVal('homePrice', inputs.homePrice);
  setVal('downPayment', inputs.downPayment);
  setVal('loanAmountManual', Math.round(inputs.loanAmount || 0));
  setVal('loanAmountDirect', Math.round(inputs.loanAmount || 0));
  setVal('rate', inputs.rate);
  setVal('term', inputs.termYears);
  setVal('taxes', inputs.taxesAnnual);
  setVal('insurance', inputs.insuranceAnnual);
  // Prefer raw pmiInput; fall back to rate or monthly from results path
  const pmiVal =
    inputs.pmiInput != null
      ? inputs.pmiInput
      : pmiDollar
        ? inputs.pmiMonthly != null
          ? inputs.pmiMonthly
          : inputs.pmiRate
        : inputs.pmiRate;
  setVal('pmi', pmiVal);
  setVal('extraMonthly', inputs.extraMonthly || 0);

  const bi = document.getElementById('biweekly');
  if (bi) bi.checked = !!inputs.biweekly;

  homeNowEnabled = isPurchase && !!inputs.homeNow;
  selectedDPAPercent = Number(inputs.dpaPercent) === 5 ? 5 : 3.5;
  const hn = document.getElementById('homenow-checkbox');
  if (hn) hn.checked = homeNowEnabled;
  updateHomeNowUi();
  styleDpaButtons();
}

function setCalcMode(mode, opts) {
  const silent = opts && opts.silent;
  const purchaseBtn = document.getElementById('mode-purchase');
  const refiBtn = document.getElementById('mode-refinance');
  const purch = document.getElementById('purchase-inputs');
  const refi = document.getElementById('refinance-inputs');
  const homenowW = document.getElementById('homenow-wrapper');
  const isPurchase = mode === 'purchase';

  if (purchaseBtn) purchaseBtn.classList.toggle('is-active', isPurchase);
  if (refiBtn) refiBtn.classList.toggle('is-active', !isPurchase);
  if (purch) purch.classList.toggle('hidden', !isPurchase);
  if (refi) refi.classList.toggle('hidden', isPurchase);
  if (homenowW) homenowW.classList.toggle('hidden', !isPurchase);

  if (!isPurchase) {
    homeNowEnabled = false;
    const chk = document.getElementById('homenow-checkbox');
    if (chk) chk.checked = false;
    updateHomeNowUi();
  }
  if (!silent) calculateAdvanced();
}

function setDownMode(mode, opts) {
  const silent = opts && opts.silent;
  const pctBtn = document.getElementById('dp-percent-btn');
  const dolBtn = document.getElementById('dp-dollar-btn');
  const dp = document.getElementById('downPayment');
  const isPct = mode === 'percent';
  if (pctBtn) pctBtn.classList.toggle('is-active', isPct);
  if (dolBtn) dolBtn.classList.toggle('is-active', !isPct);
  if (dp) dp.placeholder = isPct ? 'e.g., 20 for 20%' : 'e.g., 75000';
  if (!silent) calculateAdvanced();
}

const TERM_PRESETS = [30, 25, 20, 15, 10];

function syncTermPresetChips() {
  const termEl = document.getElementById('term');
  const years = termEl ? Math.round(parseFloat(termEl.value) || 0) : 0;
  document.querySelectorAll('.calc-term-chip').forEach((chip) => {
    const t = parseInt(chip.getAttribute('data-term'), 10);
    chip.classList.toggle('is-active', t === years);
  });
}

function setTermYears(years, opts) {
  const silent = opts && opts.silent;
  const termEl = document.getElementById('term');
  let y = Math.round(Number(years) || 0);
  if (y < 1) y = 1;
  if (y > 50) y = 50;
  if (termEl) termEl.value = String(y);
  syncTermPresetChips();
  if (!silent) calculateAdvanced();
}

function setPmiMode(mode, opts) {
  const silent = opts && opts.silent;
  const convert = !(opts && opts.skipConvert);
  const dolBtn = document.getElementById('pmi-dollar-btn');
  const pctBtn = document.getElementById('pmi-percent-btn');
  const pmiEl = document.getElementById('pmi');
  const label = document.getElementById('pmi-label');
  const hint = document.getElementById('pmi-hint');
  const affixStart = document.getElementById('pmi-affix-start');
  const affixEnd = document.getElementById('pmi-affix-end');
  const wrap = document.getElementById('pmi-input-wrap');
  const toDollar = mode === 'dollar';

  const wasDollar = isPmiDollarMode();
  if (dolBtn) dolBtn.classList.toggle('is-active', toDollar);
  if (pctBtn) pctBtn.classList.toggle('is-active', !toDollar);

  if (label) label.textContent = toDollar ? 'PMI / MIP (monthly $)' : 'PMI / MIP (% of loan)';
  if (hint) {
    hint.textContent = toDollar
      ? 'Enter monthly PMI/MIP dollars (most common). Or switch to % of loan. Auto-filled for HomeNow FHA MIP.'
      : 'Annual PMI/MIP as % of base loan (e.g. 0.55). Auto for HomeNow; otherwise when down < 20%.';
  }
  if (affixStart) affixStart.classList.toggle('hidden', !toDollar);
  if (affixEnd) affixEnd.classList.toggle('hidden', toDollar);
  if (wrap) wrap.classList.toggle('calc-input-wrap--pct', !toDollar);
  if (pmiEl) {
    pmiEl.step = toDollar ? '1' : '0.01';
    pmiEl.placeholder = toDollar ? 'e.g. 125' : 'e.g. 0.55';
  }

  // Convert displayed value when switching units (once, not on silent restore without convert)
  if (convert && pmiEl && wasDollar !== toDollar) {
    const loan =
      parseFloat(
        document.getElementById(isPurchaseMode() ? 'loanAmountManual' : 'loanAmountDirect')?.value
      ) || 0;
    const cur = parseFloat(pmiEl.value) || 0;
    if (toDollar) {
      // % → monthly $
      pmiEl.value = loan > 0 ? ((loan * cur) / 100 / 12).toFixed(0) : '0';
    } else {
      // monthly $ → %
      pmiEl.value = loan > 0 ? (((cur * 12) / loan) * 100).toFixed(2) : '0';
    }
  }

  if (!silent) calculateAdvanced();
}

// ─────────────────────────────────────────────────────────────
// HomeNow UI helpers
// ─────────────────────────────────────────────────────────────

function updateHomeNowUi() {
  const dpaOpts = document.getElementById('dpa-options');
  const breakdown = document.getElementById('homenow-breakdown');
  if (dpaOpts) dpaOpts.classList.toggle('hidden', !homeNowEnabled);
  if (breakdown) breakdown.classList.toggle('hidden', !homeNowEnabled);
}

function styleDpaButtons() {
  const b35 = document.getElementById('dpa35-btn');
  const b5 = document.getElementById('dpa5-btn');
  if (b35) b35.classList.toggle('is-active', selectedDPAPercent === 3.5);
  if (b5) b5.classList.toggle('is-active', selectedDPAPercent === 5);
}

function toggleHomeNow() {
  const chk = document.getElementById('homenow-checkbox');
  homeNowEnabled = !!(chk && chk.checked);
  updateHomeNowUi();

  if (homeNowEnabled) {
    const dp = document.getElementById('downPayment');
    if (dp) dp.value = '0';
    selectedDPAPercent = 3.5;
    styleDpaButtons();
    autoSetFHA_MIP();
  } else {
    const pmi = document.getElementById('pmi');
    if (pmi) pmi.value = '0';
  }
  calculateAdvanced();
}

function setDPA(pct) {
  selectedDPAPercent = pct === 5 ? 5 : 3.5;
  styleDpaButtons();
  if (homeNowEnabled) autoSetFHA_MIP();
  calculateAdvanced();
}

function autoSelectDPA() {
  const price = parseFloat(document.getElementById('homePrice')?.value) || 0;
  const loan = parseFloat(document.getElementById('loanAmountManual')?.value) || 0;
  if (price > 0 && loan > 0) {
    const ltv = loan / price;
    if (ltv >= 0.965) setDPA(3.5);
    else if (ltv >= 0.95) setDPA(5);
  }
}

function updatePMIRate() {
  const pmiEl = document.getElementById('pmi');
  if (!pmiEl) return;
  if (homeNowEnabled) {
    autoSetFHA_MIP();
  }
  // Spec note: original zeroed PMI when HomeNow off on every calc — that wiped user PMI.
  // Scenario Studio only auto-clears when toggling HomeNow off (toggleHomeNow).
}

function autoSetFHA_MIP() {
  const pmiEl = document.getElementById('pmi');
  if (!pmiEl) return;
  const homePrice = parseFloat(document.getElementById('homePrice')?.value) || 0;
  const downPaymentInput = parseFloat(document.getElementById('downPayment')?.value) || 0;
  if (homePrice <= 0) return;
  const downPercent = isDownPercentMode()
    ? downPaymentInput
    : (downPaymentInput / homePrice) * 100;
  const mipPct = fhaMipRatePercent(downPercent);
  if (isPmiDollarMode()) {
    const loan =
      parseFloat(
        document.getElementById(isPurchaseMode() ? 'loanAmountManual' : 'loanAmountDirect')?.value
      ) || Math.max(0, homePrice - (isDownPercentMode() ? (downPaymentInput / 100) * homePrice : downPaymentInput));
    pmiEl.value = loan > 0 ? ((loan * mipPct) / 100 / 12).toFixed(0) : '0';
  } else {
    pmiEl.value = mipPct.toFixed(2);
  }
}

// ─────────────────────────────────────────────────────────────
// Render: stack, hero, results
// ─────────────────────────────────────────────────────────────

function buildPaymentStackHtml(r, compact) {
  const parts = [
    { key: 'pi', label: 'P&I', value: r.monthlyPI, color: '#002B5C' },
    { key: 'tax', label: 'Taxes', value: r.monthlyTaxes, color: '#0ea5e9' },
    { key: 'ins', label: 'Ins', value: r.monthlyInsurance, color: '#6366f1' },
    { key: 'pmi', label: r.homeNow ? 'MIP' : 'PMI', value: r.monthlyPMI, color: '#a855f7' }
  ];
  if (r.homeNow && r.monthlyHomeNowSecond > 0) {
    parts.push({ key: 'hn', label: 'HomeNow 2nd', value: r.monthlyHomeNowSecond, color: '#00A89D' });
  }
  if (r.extraMonthly > 0 && !r.biweekly) {
    parts.push({ key: 'ex', label: 'Extra', value: r.extraMonthly, color: '#F15A29' });
  }
  const total = parts.reduce((s, p) => s + (p.value || 0), 0) || 1;
  const segs = parts
    .filter((p) => p.value > 0.5)
    .map(
      (p) =>
        `<span class="calc-stack-seg" style="width:${Math.max(3, (p.value / total) * 100)}%;background:${p.color}" title="${escapeHtml(p.label)}: ${money2(p.value)}"></span>`
    )
    .join('');
  const legend = parts
    .filter((p) => p.value > 0.5)
    .map(
      (p) =>
        `<span class="calc-stack-legend-item"><i style="background:${p.color}"></i>${escapeHtml(p.label)} ${compact ? '' : money0(p.value)}</span>`
    )
    .join('');
  return `<div class="calc-stack-bar">${segs}</div><div class="calc-stack-legend">${legend}</div>`;
}

function renderHero(results, valid, error) {
  const payEl = document.getElementById('calc-hero-payment');
  const subEl = document.getElementById('calc-hero-sub');
  const stackEl = document.getElementById('calc-hero-stack');
  const chipsEl = document.getElementById('calc-hero-chips');
  const metricsEl = document.getElementById('calc-hero-metrics');
  if (!payEl) return;

  if (!valid || !results) {
    payEl.textContent = '—';
    if (subEl) subEl.textContent = error || 'Enter loan details';
    if (stackEl) stackEl.innerHTML = '';
    if (chipsEl) chipsEl.innerHTML = '';
    if (metricsEl) metricsEl.innerHTML = '';
    return;
  }

  const nextPay = money2(results.totalMonthly);
  if (payEl.textContent !== nextPay) {
    payEl.textContent = nextPay;
    payEl.classList.remove('is-pulse');
    // force reflow for pulse
    void payEl.offsetWidth;
    payEl.classList.add('is-pulse');
    setTimeout(() => payEl.classList.remove('is-pulse'), 280);
  } else {
    payEl.textContent = nextPay;
  }

  if (subEl) {
    subEl.textContent = results.homeNow
      ? 'Includes 1st + HomeNow 2nd · estimates only'
      : results.biweekly || results.extraMonthly > 0
        ? 'Includes accelerate options · estimates only'
        : 'PITI housing payment · estimates only';
  }
  if (stackEl) stackEl.innerHTML = buildPaymentStackHtml(results, true);
  if (chipsEl) {
    const chips = [];
    chips.push(
      `<span class="calc-chip">${results.mode === 'purchase' ? 'Purchase' : 'Refinance'}</span>`
    );
    if (results.homeNow) {
      chips.push(`<span class="calc-chip calc-chip-hn">HomeNow ${results.dpaPercent}%</span>`);
    }
    if (results.extraMonthly > 0) {
      chips.push(`<span class="calc-chip calc-chip-extra">+${money0(results.extraMonthly)}/mo</span>`);
    }
    if (results.biweekly) chips.push(`<span class="calc-chip">Biweekly</span>`);
    chipsEl.innerHTML = chips.join('');
  }
  if (metricsEl) {
    const m1 =
      results.mode === 'purchase'
        ? { label: 'Down payment', val: money0(results.downAmount) }
        : { label: 'Loan amount', val: money0(results.baseLoanAmount) };
    const m2 = { label: 'Interest rate', val: results.annualRate + '%' };
    const m3 = results.homeNow
      ? { label: 'HomeNow 2nd', val: money2(results.monthlyHomeNowSecond) + '/mo' }
      : { label: 'Interest (full term)', val: money0(results.totalInterestStandard) };
    metricsEl.innerHTML = [m1, m2, m3]
      .map(
        (m) =>
          `<div class="calc-metric" title="${escapeHtml(m.label + ': ' + m.val)}"><div class="calc-metric-label">${escapeHtml(m.label)}</div><div class="calc-metric-val">${escapeHtml(m.val)}</div></div>`
      )
      .join('');
  }
}

function renderResults(results, valid, error) {
  const out = document.getElementById('calc-output');
  if (!out) return;

  if (!valid || !results) {
    out.innerHTML = `<div class="rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 p-6 text-center text-red-600 dark:text-red-300 font-semibold">${escapeHtml(error || 'Invalid inputs')}</div>`;
    return;
  }

  const r = results;
  const accelerated = r.extraMonthly > 0 || r.biweekly;

  // Update HomeNow mini breakdown if present
  if (r.homeNow) {
    const da = document.getElementById('dpa-amt');
    const sr = document.getElementById('second-rate');
    const sp = document.getElementById('second-pmt');
    if (da) da.textContent = money0(r.dpaAmount);
    if (sr) sr.textContent = r.secondRate.toFixed(3) + '%';
    if (sp) sp.textContent = money0(r.monthlyHomeNowSecond);
  }

  let hnBlock = '';
  if (r.homeNow) {
    hnBlock = `
      <div class="calc-result-card calc-result-card--hn">
        <div class="calc-result-card-head">
          <h4><i class="fas fa-home" style="color:#00A89D;margin-right:0.35rem"></i>HomeNow story</h4>
        </div>
        <p class="calc-hint" style="margin:0 0 0.75rem">Zero traditional down. DPA is a <strong>second mortgage</strong>. 1.75% UFMIP is financed into the 1st.</p>
        <div class="calc-hn-stats" style="margin-top:0">
          <div class="calc-hn-stat"><div class="calc-hn-stat-label">DPA 2nd</div><div class="calc-hn-stat-val calc-hn-stat-val--orange">${money0(r.dpaAmount)}</div></div>
          <div class="calc-hn-stat"><div class="calc-hn-stat-label">2nd rate</div><div class="calc-hn-stat-val">${r.secondRate.toFixed(3)}%</div></div>
          <div class="calc-hn-stat"><div class="calc-hn-stat-label">2nd pmt</div><div class="calc-hn-stat-val calc-hn-stat-val--teal">${money0(r.monthlyHomeNowSecond)}/mo</div></div>
        </div>
      </div>`;
  }

  // Always show the classic dual boxes: Standard vs Accelerated
  const saveWarn = r.interestSavings < 0;
  const saveLabel =
    r.interestSavings > 0 ? 'Interest savings' : r.interestSavings < 0 ? 'Extra interest' : 'Interest impact';
  const payoffTxt = `${r.yearsToPayoff} yrs${r.remainingMonths ? ' + ' + r.remainingMonths + ' mo' : ''}`;
  const fullTermTxt = `${r.termYears} years`;

  const standardCard = `
    <div class="calc-result-card calc-result-card--standard">
      <div class="calc-result-card-head">
        <h4><i class="fas fa-balance-scale" style="margin-right:0.4rem;opacity:0.85"></i>Standard ${r.termYears}-year loan</h4>
        <span class="calc-result-meta">${r.annualRate}%</span>
      </div>
      <div class="calc-rows">
        <div class="calc-row"><span>Base loan</span><span>${money0(r.baseLoanAmount)}</span></div>
        ${r.homeNow ? `<div class="calc-row"><span>1st w/ UFMIP</span><span>${money0(r.firstLoanWithUfmip)}</span></div>` : ''}
        <div class="calc-row"><span>P&amp;I</span><span>${money2(r.monthlyPI)}</span></div>
        <div class="calc-row"><span>Taxes + insurance</span><span>${money2(r.monthlyTaxes + r.monthlyInsurance)}</span></div>
        <div class="calc-row"><span>${r.homeNow ? 'MIP' : 'PMI'}</span><span>${money2(r.monthlyPMI)}</span></div>
        ${r.homeNow ? `<div class="calc-row calc-row--accent"><span>HomeNow 2nd</span><span>${money2(r.monthlyHomeNowSecond)}</span></div>` : ''}
        ${r.homeNow ? `<div class="calc-row"><span style="font-size:0.72rem">Includes 1.75% UFMIP in 1st</span><span></span></div>` : ''}
        <div class="calc-row calc-row--total">
          <span>Total monthly</span>
          <span>${money2(r.standardTotalMonthly)}</span>
        </div>
        <div class="calc-row"><span>Total interest (full term)</span><span>${money0(r.totalInterestStandard)}</span></div>
        <div class="calc-row"><span>Payoff time</span><span>${fullTermTxt}</span></div>
      </div>
    </div>`;

  const accelCard = accelerated
    ? `
    <div class="calc-result-card calc-result-card--accel">
      <div class="calc-result-card-head">
        <h4 style="color:#F15A29"><i class="fas fa-rocket" style="margin-right:0.4rem"></i>Your accelerated plan</h4>
        <span class="calc-result-meta calc-result-meta--orange">Active</span>
      </div>
      <div class="calc-rows">
        <div class="calc-row"><span>Extra payments</span><span>${money2(r.extraMonthly)}${r.extraMonthly > 0 ? '/mo' : ''}${r.biweekly ? ' · biweekly' : ''}</span></div>
        <div class="calc-row"><span>Your monthly payment</span><span>${money2(r.totalMonthly)}</span></div>
        <div class="calc-row"><span>Payoff time</span><span>${payoffTxt}</span></div>
        <div class="calc-row calc-row--total calc-row--total-orange">
          <span>Total interest paid</span>
          <span>${money0(r.totalInterestCustom)}</span>
        </div>
      </div>
      <div class="calc-save-pill${saveWarn ? ' is-warn' : ''}">
        <div class="calc-save-pill-label">${saveLabel}${r.homeNow ? ' (1st mortgage only)' : ''}</div>
        <div class="calc-save-pill-val">${r.interestSavings > 0 ? 'Save ' : r.interestSavings < 0 ? 'Extra ' : ''}${money0(Math.abs(r.interestSavings))}</div>
      </div>
    </div>`
    : `
    <div class="calc-result-card calc-result-card--accel calc-result-card--idle">
      <div class="calc-result-card-head">
        <h4 style="color:#F15A29"><i class="fas fa-rocket" style="margin-right:0.4rem"></i>Your accelerated plan</h4>
        <span class="calc-result-meta">Optional</span>
      </div>
      <div class="calc-accel-idle">
        <p>Add <strong>extra monthly</strong> or turn on <strong>biweekly</strong> to see payoff time and interest savings vs the standard loan.</p>
        <div class="calc-accel-idle-hint">
          <span><i class="fas fa-plus-circle"></i> Extra payment</span>
          <span><i class="fas fa-calendar-week"></i> Biweekly</span>
        </div>
        <div class="calc-rows" style="margin-top:0.75rem;opacity:0.75">
          <div class="calc-row"><span>Same as standard for now</span><span>${money2(r.standardTotalMonthly)}</span></div>
          <div class="calc-row"><span>Interest (full term)</span><span>${money0(r.totalInterestStandard)}</span></div>
        </div>
      </div>
    </div>`;

  out.innerHTML = `
    <div class="calc-result-card calc-result-card--stack">
      <div class="calc-result-card-head">
        <h4>Payment mix</h4>
        <span class="calc-result-meta">${r.termYears}-year · ${r.annualRate}%</span>
      </div>
      ${buildPaymentStackHtml(r, false)}
      ${r.mode === 'purchase' ? `<div class="calc-rows" style="margin-top:0.65rem"><div class="calc-row"><span>Down payment</span><span>${money0(r.downAmount)}${r.homeNow && r.downAmount < 1 ? ' *' : ''}</span></div></div>` : ''}
    </div>
    <div class="calc-compare-grid">
      ${standardCard}
      ${accelCard}
    </div>
    ${hnBlock}
  `;
}

// ─────────────────────────────────────────────────────────────
// Scenario board
// ─────────────────────────────────────────────────────────────

function loadBoardFromStorage() {
  try {
    const raw = localStorage.getItem(CALC_BOARD_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) calcScenarioBoard = arr.slice(0, CALC_MAX_SCENARIOS);
  } catch (e) {
    calcScenarioBoard = [];
  }
}

function persistBoard() {
  try {
    localStorage.setItem(CALC_BOARD_KEY, JSON.stringify(calcScenarioBoard));
  } catch (e) {
    /* private mode */
  }
}

function autoScenarioLabel(inputs, results) {
  let label;
  if (results.homeNow) label = `HomeNow ${results.dpaPercent}%`;
  else if (inputs.mode === 'refinance') label = `Refi ${inputs.termYears || 30}yr`;
  else if (inputs.downIsPercent) label = `${Number(inputs.downPayment).toFixed(inputs.downPayment % 1 ? 1 : 0)}% down`;
  else label = `${money0(results.downAmount)} down`;

  if (inputs.extraMonthly > 0) label += ' +extra';
  if (inputs.biweekly) label += ' +biweekly';

  const base = label;
  let n = 2;
  while (calcScenarioBoard.some((s) => s.label === label)) {
    label = `${base} (${n})`;
    n += 1;
  }
  return label;
}

function scenarioFingerprint(inputs, results) {
  const r = results || {};
  const i = inputs || {};
  return [
    i.mode,
    Math.round(r.homePrice || i.homePrice || 0),
    Math.round(r.baseLoanAmount || 0),
    Math.round((r.downAmount || 0) * 100) / 100,
    Number(r.annualRate || i.rate || 0).toFixed(3),
    r.termYears || i.termYears || 0,
    r.homeNow ? 1 : 0,
    r.dpaPercent || 0,
    Math.round(r.extraMonthly || 0),
    r.biweekly ? 1 : 0,
    Math.round(r.monthlyPMI || 0)
  ].join('|');
}

function makeScenarioFromCurrent() {
  if (!lastCalcBundle || !lastCalcBundle.valid) return null;
  const inputs = lastCalcBundle.inputs;
  const results = lastCalcBundle.results;
  return {
    id: 'sc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    label: autoScenarioLabel(inputs, results),
    createdAt: new Date().toISOString(),
    inputs: Object.assign({}, inputs),
    results: Object.assign({}, results)
  };
}

function findDuplicateOnBoard(inputs, results) {
  const fp = scenarioFingerprint(inputs, results);
  return calcScenarioBoard.find(function (s) {
    return scenarioFingerprint(s.inputs, s.results) === fp;
  });
}

/**
 * Add current payment as Option A, then B, then C.
 * If the board already has 3, offer to replace A/B/C instead of blocking.
 */
function saveCurrentScenario() {
  if (!lastCalcBundle || !lastCalcBundle.valid) {
    calcToast('Enter valid loan details first');
    return;
  }

  const inputs = lastCalcBundle.inputs;
  const results = lastCalcBundle.results;
  const dup = findDuplicateOnBoard(inputs, results);
  if (dup) {
    calcToast(
      'Already on the board as “' +
        dup.label +
        '”. Change something first (down %, rate, HomeNow, term, extra…), then add again.'
    );
    scrollToScenarioBoard();
    return;
  }

  // Board full → replace a slot (never a dead end)
  if (calcScenarioBoard.length >= CALC_MAX_SCENARIOS) {
    scrollToScenarioBoard();
    const choice = window.prompt(
      'Board is full (A, B, and C).\n\n' +
        'Type A, B, or C to replace that option with your CURRENT numbers.\n\n' +
        'Tip: use “Clear board” below the cards to wipe all three and start over.',
      'A'
    );
    if (choice == null) return;
    const letter = String(choice).trim().toUpperCase().charAt(0);
    const idx = letter.charCodeAt(0) - 65;
    if (idx < 0 || idx >= CALC_MAX_SCENARIOS) {
      calcToast('Type A, B, or C — or click Clear board to wipe the tray.');
      return;
    }
    replaceScenarioAt(idx);
    return;
  }

  const scenario = makeScenarioFromCurrent();
  if (!scenario) return;
  const letter = String.fromCharCode(65 + calcScenarioBoard.length);
  calcScenarioBoard.push(scenario);
  persistBoard();
  renderScenarioBoard();
  scrollToScenarioBoard();

  const n = calcScenarioBoard.length;
  if (n < CALC_MAX_SCENARIOS) {
    const next = String.fromCharCode(65 + n);
    calcToast(
      'Option ' +
        letter +
        ' saved. Now CHANGE the numbers, then click Add to compare for Option ' +
        next +
        '.'
    );
  } else {
    calcToast(
      'Option ' +
        letter +
        ' saved — board full (3/3). Copy / Email / Print, or Save comparison. Clear board to start over.'
    );
  }
}

function replaceScenarioAt(idx) {
  if (!lastCalcBundle || !lastCalcBundle.valid) {
    calcToast('Enter valid loan details first');
    return;
  }
  if (idx < 0 || idx >= CALC_MAX_SCENARIOS) return;

  const inputs = lastCalcBundle.inputs;
  const results = lastCalcBundle.results;
  const dup = findDuplicateOnBoard(inputs, results);
  // Allow replace of the same slot with itself (no-op message); block only if another slot matches
  if (dup) {
    const dupIdx = calcScenarioBoard.indexOf(dup);
    if (dupIdx !== idx) {
      calcToast(
        'Those numbers are already Option ' +
          String.fromCharCode(65 + dupIdx) +
          '. Change something first, then replace.'
      );
      return;
    }
  }

  const scenario = makeScenarioFromCurrent();
  if (!scenario) return;
  const letter = String.fromCharCode(65 + idx);
  const prevLabel = calcScenarioBoard[idx] ? calcScenarioBoard[idx].label : letter;
  calcScenarioBoard[idx] = scenario;
  persistBoard();
  renderScenarioBoard();
  scrollToScenarioBoard();
  calcToast('Option ' + letter + ' replaced (“' + prevLabel + '” → “' + scenario.label + '”)');
}

function scrollToScenarioBoard() {
  const el = document.getElementById('calc-scenario-board');
  if (el && typeof el.scrollIntoView === 'function') {
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {
      el.scrollIntoView(true);
    }
  }
}

function clearScenarioBoard() {
  if (!calcScenarioBoard.length) {
    calcToast('Board is already empty');
    return;
  }
  if (!window.confirm('Clear Options A, B, and C from the comparison board?\n\n(This does not delete My Saved Items.)')) {
    return;
  }
  calcScenarioBoard = [];
  persistBoard();
  renderScenarioBoard();
  calcToast('Board cleared — ready for a new Option A');
}

function saveBoardComparisonToVault() {
  if (!calcScenarioBoard.length) {
    calcToast('Add at least one option to the board first');
    return;
  }
  const labels = calcScenarioBoard.map(function (s) { return s.label; }).join(' vs ');
  saveCalcToVault({
    title:
      'Mortgage compare (' +
      calcScenarioBoard.length +
      '): ' +
      labels.slice(0, 60) +
      ' — ' +
      new Date().toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }),
    feedback: 'Full A/B/C comparison saved to My Saved Items'
  });
}

function removeScenario(id) {
  calcScenarioBoard = calcScenarioBoard.filter((s) => s.id !== id);
  persistBoard();
  renderScenarioBoard();
  calcToast('Option removed — free slot ready');
}

function loadScenario(id) {
  const s = calcScenarioBoard.find((x) => x.id === id);
  if (!s) return;
  writeInputsToDom(s.inputs);
  calculateAdvanced();
  calcToast('Loaded: ' + s.label);
}

function renameScenario(id) {
  const s = calcScenarioBoard.find((x) => x.id === id);
  if (!s) return;
  const next = window.prompt('Name this option', s.label);
  if (next == null) return;
  const trimmed = String(next).trim().slice(0, 48);
  if (!trimmed) return;
  s.label = trimmed;
  persistBoard();
  renderScenarioBoard();
}

function renderScenarioBoard() {
  const slots = document.getElementById('calc-scenario-slots');
  const empty = document.getElementById('calc-board-empty');
  const count = document.getElementById('calc-board-count');
  const saveVaultBtn = document.getElementById('calc-board-save-vault-btn');
  const clearBtn = document.getElementById('calc-board-clear-btn');
  const saveHeroBtn = document.getElementById('calc-save-scenario-btn');
  const fullHint = document.getElementById('calc-board-full-hint');
  const n = calcScenarioBoard.length;
  const full = n >= CALC_MAX_SCENARIOS;

  if (count) count.textContent = n + ' / ' + CALC_MAX_SCENARIOS;
  if (empty) empty.classList.add('hidden');
  if (saveVaultBtn) saveVaultBtn.classList.toggle('hidden', n === 0);
  // Always show Clear when anything is on the board (this was the missing escape hatch)
  if (clearBtn) {
    clearBtn.classList.toggle('hidden', n === 0);
    clearBtn.disabled = false;
  }
  if (fullHint) fullHint.classList.toggle('hidden', !full);
  if (saveHeroBtn) {
    const nextLetter = n < CALC_MAX_SCENARIOS ? String.fromCharCode(65 + n) : null;
    const span = saveHeroBtn.querySelector('span');
    if (span) {
      span.textContent = full
        ? 'Replace option…'
        : 'Add to compare (' + nextLetter + ')';
    }
    // Never disable — when full, click = replace A/B/C
    saveHeroBtn.disabled = false;
    saveHeroBtn.classList.remove('is-disabled');
    saveHeroBtn.title = full
      ? 'Board is full. Click to replace Option A, B, or C with the current numbers — or Clear board below.'
      : 'Pin this payment as Option ' + nextLetter + ' on the comparison board';
  }
  if (!slots) return;

  let minPay = Infinity;
  let minDown = Infinity;
  calcScenarioBoard.forEach((s) => {
    const p = s.results && s.results.totalMonthly;
    const d = s.results && s.results.downAmount;
    if (typeof p === 'number' && p < minPay) minPay = p;
    if (s.inputs && s.inputs.mode === 'purchase' && typeof d === 'number' && d < minDown) minDown = d;
  });

  const cards = [];
  for (let idx = 0; idx < CALC_MAX_SCENARIOS; idx++) {
    const letter = String.fromCharCode(65 + idx);
    const s = calcScenarioBoard[idx];
    if (!s) {
      const isNext = idx === n;
      cards.push(`
        <article class="calc-scenario-card calc-scenario-card--empty ${isNext ? 'is-next' : ''}" data-empty-slot="${letter}">
          <div class="calc-card-top">
            <div class="calc-card-identity">
              <span class="calc-card-letter calc-card-letter--ghost">${letter}</span>
              <div class="calc-card-titles">
                <div class="calc-card-kicker">Option ${letter}</div>
                <h4 class="calc-card-title">${isNext ? 'Waiting for you…' : 'Empty slot'}</h4>
              </div>
            </div>
          </div>
          <div class="calc-empty-body">
            ${
              isNext
                ? `<p><strong>Next:</strong> set this payment above, then click <strong>Add to compare (${letter})</strong>.</p>
                   <p class="calc-empty-examples">Ideas: HomeNow 3.5% · Conventional 5% · 20% down · +$200 extra</p>`
                : n === 0 && idx === 0
                  ? `<p>Start with any payment, then <strong>Add to compare (A)</strong>.</p>`
                  : `<p>Fill Option ${String.fromCharCode(65 + n)} first.</p>`
            }
          </div>
        </article>`);
      continue;
    }

    const r = s.results || {};
    const isLowPay = r.totalMonthly === minPay && n > 1;
    const isLowDown =
      s.inputs &&
      s.inputs.mode === 'purchase' &&
      r.downAmount === minDown &&
      n > 1 &&
      minDown < Infinity;
    const badges = [];
    if (isLowPay) badges.push('<span class="calc-badge calc-badge-best">Lowest monthly</span>');
    if (isLowDown) badges.push('<span class="calc-badge">Lowest down</span>');
    if (r.homeNow) badges.push(`<span class="calc-badge calc-badge-hn">HomeNow ${r.dpaPercent}%</span>`);

    cards.push(`
      <article class="calc-scenario-card ${isLowPay ? 'is-best' : ''}" data-scenario-id="${escapeHtml(s.id)}">
        <div class="calc-card-top">
          <div class="calc-card-identity">
            <span class="calc-card-letter">${letter}</span>
            <div class="calc-card-titles">
              <div class="calc-card-kicker">Option ${letter}</div>
              <h4 class="calc-card-title" title="${escapeHtml(s.label)}">${escapeHtml(s.label)}</h4>
            </div>
          </div>
          ${badges.length ? `<div class="calc-card-badges">${badges.join('')}</div>` : ''}
        </div>
        <div class="calc-card-pay">${money2(r.totalMonthly)}<span>/mo</span></div>
        <div class="calc-card-stat-grid">
          <div class="calc-card-stat"><span>Loan</span><strong>${money0(r.baseLoanAmount)}</strong></div>
          <div class="calc-card-stat"><span>${s.inputs && s.inputs.mode === 'purchase' ? 'Down' : 'Mode'}</span><strong>${s.inputs && s.inputs.mode === 'purchase' ? money0(r.downAmount) : 'Refi'}</strong></div>
          <div class="calc-card-stat"><span>Rate</span><strong>${r.annualRate}%</strong></div>
          <div class="calc-card-stat"><span>Term</span><strong>${r.termYears} yr</strong></div>
        </div>
        ${r.homeNow ? `<div class="calc-card-hn">HomeNow ${r.dpaPercent}% · 2nd ${money0(r.dpaAmount)} · ${money2(r.monthlyHomeNowSecond)}/mo</div>` : ''}
        <div class="calc-card-actions">
          <button type="button" class="calc-card-btn calc-card-btn-primary" data-action="replace" data-idx="${idx}" title="Overwrite Option ${letter} with the numbers currently in the form">Replace</button>
          <button type="button" class="calc-card-btn" data-action="load" data-id="${escapeHtml(s.id)}" aria-label="Load ${escapeHtml(s.label)}">Load</button>
          <button type="button" class="calc-card-btn" data-action="rename" data-id="${escapeHtml(s.id)}">Rename</button>
          <button type="button" class="calc-card-btn calc-card-btn-danger" data-action="remove" data-id="${escapeHtml(s.id)}">Remove</button>
        </div>
      </article>`);
  }

  slots.innerHTML = cards.join('');

  slots.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (action === 'load') loadScenario(id);
      else if (action === 'rename') renameScenario(id);
      else if (action === 'remove') removeScenario(id);
      else if (action === 'replace') {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        if (!Number.isNaN(idx)) replaceScenarioAt(idx);
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────
// Main calculate + client send
// ─────────────────────────────────────────────────────────────

function calculateAdvanced() {
  if (homeNowEnabled) updatePMIRate();
  syncPurchaseLoanFields();
  syncTermPresetChips();

  const inputs = readInputsFromDom();
  const computed = computeMortgageScenario(inputs);
  lastCalcBundle = {
    inputs,
    results: computed.results || null,
    valid: computed.valid,
    error: computed.error
  };

  renderHero(computed.results, computed.valid, computed.error);
  renderResults(computed.results, computed.valid, computed.error);
  return computed;
}

function getClientScenarioSources() {
  if (calcScenarioBoard.length > 0) {
    return calcScenarioBoard.map((s, i) => ({
      label: s.label || 'Option ' + String.fromCharCode(65 + i),
      results: s.results,
      inputs: s.inputs
    }));
  }
  if (lastCalcBundle && lastCalcBundle.valid) {
    return [
      {
        label: autoScenarioLabel(lastCalcBundle.inputs, lastCalcBundle.results),
        results: lastCalcBundle.results,
        inputs: lastCalcBundle.inputs
      }
    ];
  }
  return [];
}

/** Left-align label, right-align value in plain text (works in most mail clients). */
function emailRow(label, value, width) {
  const w = width || 22;
  const l = String(label || '');
  const v = String(value || '');
  const pad = Math.max(1, w - l.length);
  return '  ' + l + ' '.repeat(pad) + v;
}

/**
 * Polished plain-text client summary for Copy + Email.
 * mailto: only supports plain text — structure, spacing, and hierarchy do the work.
 */
function getClientCopyText() {
  const sources = getClientScenarioSources();
  if (!sources.length) return '';

  const r0 = sources[0].results || {};
  const price =
    (r0.homePrice > 0 && r0.homePrice) ||
    (sources[0].inputs && sources[0].inputs.homePrice) ||
    0;
  const isRefi = r0.mode === 'refinance';
  const hasHomeNow = sources.some((s) => s.results && s.results.homeNow);
  const multi = sources.length > 1;

  const lines = [];
  lines.push('Hi there —');
  lines.push('');
  if (price && !isRefi) {
    lines.push(
      multi
        ? `I put together ${sources.length} payment options for a ${money0(price)} home so you can compare them side by side.`
        : `Here is a clear payment snapshot for a ${money0(price)} home.`
    );
  } else if (isRefi) {
    lines.push(
      multi
        ? `I put together ${sources.length} refinance payment options for you to compare.`
        : 'Here is a clear refinance payment snapshot for you to review.'
    );
  } else {
    lines.push(
      multi
        ? `I put together ${sources.length} payment options for you to compare side by side.`
        : 'Here is a clear payment snapshot for you to review.'
    );
  }
  lines.push('All figures are estimates for discussion — happy to walk through any of them.');
  lines.push('');

  // Quick compare strip when 2–3 options
  if (multi) {
    lines.push('┌─────────────────────────────────────────────');
    lines.push('│  QUICK COMPARE');
    lines.push('├─────────────────────────────────────────────');
    sources.forEach((s, i) => {
      const r = s.results || {};
      const letter = String.fromCharCode(65 + i);
      const downBit =
        r.mode === 'purchase'
          ? money0(r.downAmount) + ' down'
          : 'refi';
      const prog = r.homeNow ? `HomeNow ${r.dpaPercent}%` : r.mode === 'purchase' ? 'Purchase' : 'Refinance';
      lines.push(
        `│  ${letter}.  ${money2(r.totalMonthly)}/mo   ·   ${downBit}   ·   ${prog}`
      );
      lines.push(`│      ${s.label}`);
    });
    lines.push('└─────────────────────────────────────────────');
    lines.push('');
  }

  sources.forEach((s, i) => {
    const r = s.results || {};
    const letter = String.fromCharCode(65 + i);
    const accelerated = (r.extraMonthly > 0) || r.biweekly;
    const rule = '────────────────────────────────────────';

    lines.push(rule);
    lines.push(`  OPTION ${letter}  ·  ${s.label}`);
    lines.push(rule);
    lines.push('');
    lines.push(emailRow('Monthly housing', money2(r.totalMonthly) + ' /mo'));
    if (r.homeNow) {
      lines.push(emailRow('', '(includes 1st + HomeNow 2nd)'));
    }
    lines.push('');
    if (r.mode === 'purchase') {
      lines.push(
        emailRow(
          'Down payment',
          money0(r.downAmount) + (r.homeNow && r.downAmount < 1 ? ' *' : '')
        )
      );
      if (r.homePrice > 0) lines.push(emailRow('Home price', money0(r.homePrice)));
    }
    lines.push(emailRow('Base loan', money0(r.baseLoanAmount)));
    if (r.homeNow) lines.push(emailRow('1st w/ UFMIP', money0(r.firstLoanWithUfmip)));
    lines.push(emailRow('Rate / term', `${r.annualRate}%  ·  ${r.termYears}-year`));
    lines.push(emailRow('Principal & interest', money2(r.monthlyPI) + ' /mo'));
    lines.push(
      emailRow('Taxes + insurance', money2((r.monthlyTaxes || 0) + (r.monthlyInsurance || 0)) + ' /mo')
    );
    lines.push(emailRow(r.homeNow ? 'MIP' : 'PMI', money2(r.monthlyPMI) + ' /mo'));
    if (r.homeNow) {
      lines.push(
        emailRow(
          `HomeNow 2nd (${r.dpaPercent}%)`,
          money2(r.monthlyHomeNowSecond) + ' /mo'
        )
      );
      lines.push(
        emailRow(
          '  DPA amount / rate',
          `${money0(r.dpaAmount)}  @  ${Number(r.secondRate).toFixed(3)}% · 10 yr`
        )
      );
    }

    // Standard vs accelerated (always useful)
    lines.push('');
    lines.push('  Standard vs accelerated');
    lines.push(emailRow('  Standard monthly', money2(r.standardTotalMonthly) + ' /mo'));
    if (accelerated) {
      const accelBits = [];
      if (r.extraMonthly > 0) accelBits.push('+' + money0(r.extraMonthly) + '/mo extra');
      if (r.biweekly) accelBits.push('biweekly');
      lines.push(emailRow('  Accelerated monthly', money2(r.totalMonthly) + ' /mo'));
      lines.push(emailRow('  Accelerate with', accelBits.join(' · ') || '—'));
      lines.push(
        emailRow(
          '  Payoff time',
          `${r.yearsToPayoff} yrs` + (r.remainingMonths ? ` + ${r.remainingMonths} mo` : '')
        )
      );
      if (r.interestSavings > 0) {
        lines.push(
          emailRow(
            '  Interest savings',
            money0(r.interestSavings) + (r.homeNow ? ' (1st mtg only)' : '')
          )
        );
      }
    } else {
      lines.push(emailRow('  Accelerated', 'Not applied (same as standard)'));
      lines.push(emailRow('  Full-term interest', money0(r.totalInterestStandard)));
    }
    lines.push('');
  });

  lines.push('────────────────────────────────────────');
  lines.push('');
  lines.push('Happy to hop on a quick call and walk through which path fits best.');
  lines.push('');

  if (hasHomeNow) {
    lines.push(
      '* HomeNow: $0 traditional down may apply; the DPA is a second mortgage (not a gift). Program eligibility required.'
    );
    lines.push('');
  }
  lines.push(
    'These figures are estimates for conversation only — not a commitment to lend or a final Closing Disclosure. Rates, payments, and program details are subject to underwriting and can change.'
  );

  return lines.join('\n').trim();
}

function getCalcResultsText() {
  const client = getClientCopyText();
  if (!client) return '';
  // Prefer structured client text; append board labels for vault richness
  return client;
}

function copyForClient() {
  const text = getClientCopyText();
  if (!text) {
    calcToast('Nothing to copy yet');
    return;
  }
  navigator.clipboard.writeText(text).then(
    () => calcToast('Client summary copied'),
    () => {
      window.prompt('Copy the text below:', text);
    }
  );
}

function getClientEmailSubject() {
  const sources = getPrintSources();
  const r0 = sources[0] && sources[0].results;
  const price = r0 && r0.homePrice > 0 ? r0.homePrice : 0;
  if (price) return `Payment options for a ${money0(price)} home`;
  if (r0 && r0.mode === 'refinance') return 'Refinance payment options to review';
  return 'Payment options to review';
}

/**
 * Open the OS/default email client with subject + body pre-filled.
 * User only needs to enter the recipient and send.
 * mailto: has no "To" so the address field stays empty for them to fill.
 */
function buildClientEmailSignOff() {
  const profile = getCalcProfileForPrint();
  const lines = [];
  lines.push('Warm regards,');
  lines.push('');
  if (profile.name) {
    lines.push(profile.name);
    if (profile.title) lines.push(profile.title);
    if (profile.nmls) {
      lines.push((profile.isRealtor ? 'License # ' : 'NMLS# ') + profile.nmls);
    }
    if (profile.phone) lines.push(profile.phone);
    if (profile.email) lines.push(profile.email);
    if (profile.location) lines.push(profile.location);
  } else {
    lines.push('[Your name]');
  }
  return lines.join('\n');
}

/**
 * Full email body: polished summary + professional sign-off.
 * Kept as plain text (mailto limitation) but structured for readability.
 */
function getClientEmailBody() {
  const body = getClientCopyText();
  if (!body) return '';
  return body + '\n\n' + buildClientEmailSignOff();
}

function emailForClient() {
  const fullBody = getClientEmailBody();
  if (!fullBody) {
    calcToast('Save a scenario or run a calculation first');
    return;
  }
  const subject = getClientEmailSubject();

  // mailto URL length limits vary (esp. Outlook desktop). Stay under ~2000 chars
  // of encoded payload when possible; always copy full body so nothing is lost.
  let useBody = fullBody;
  const encodedProbe = encodeURIComponent(useBody);
  if (encodedProbe.length > 1800) {
    // Prefer full summary without sign-off, then hard trim only if needed
    const core = getClientCopyText();
    useBody = core + '\n\n' + buildClientEmailSignOff().split('\n').slice(0, 4).join('\n');
    if (encodeURIComponent(useBody).length > 1800) {
      useBody =
        core.slice(0, 1200).trim() +
        '\n\n…\n(Full breakdown was copied to your clipboard — paste below if anything is cut off.)\n\n' +
        buildClientEmailSignOff();
    }
  }

  // Always copy the full polished body so user can paste if the client truncates
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fullBody).catch(function () { /* ignore */ });
  }

  const mailto =
    'mailto:?' +
    'subject=' +
    encodeURIComponent(subject) +
    '&body=' +
    encodeURIComponent(useBody);

  try {
    const a = document.createElement('a');
    a.href = mailto;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    calcToast('Email opening with formatted summary — add address & send');
  } catch (e) {
    navigator.clipboard.writeText(fullBody).then(
      () => calcToast('Could not open mail — full message copied. Paste into a new email.'),
      () => window.prompt('Paste this into your email body:', fullBody)
    );
  }
}

function copyCalcResults() {
  copyForClient();
}

/**
 * Rich HTML for My Saved Items viewer (email/copy stay plain text).
 * Inline styles so the vault modal always looks polished.
 */
function getClientVaultHtml() {
  const sources = getClientScenarioSources();
  if (!sources.length) return '';

  const r0 = sources[0].results || {};
  const price =
    (r0.homePrice > 0 && r0.homePrice) ||
    (sources[0].inputs && sources[0].inputs.homePrice) ||
    0;
  const isRefi = r0.mode === 'refinance';
  const hasHomeNow = sources.some((s) => s.results && s.results.homeNow);
  const multi = sources.length > 1;

  let intro = '';
  if (price && !isRefi) {
    intro = multi
      ? `I put together <strong>${sources.length} payment options</strong> for a <strong>${money0(price)}</strong> home so you can compare them side by side.`
      : `Here is a clear payment snapshot for a <strong>${money0(price)}</strong> home.`;
  } else if (isRefi) {
    intro = multi
      ? `I put together <strong>${sources.length} refinance options</strong> for you to compare.`
      : 'Here is a clear refinance payment snapshot for you to review.';
  } else {
    intro = multi
      ? `I put together <strong>${sources.length} payment options</strong> for you to compare.`
      : 'Here is a clear payment snapshot for you to review.';
  }

  let compareHtml = '';
  if (multi) {
    const rows = sources
      .map((s, i) => {
        const r = s.results || {};
        const letter = String.fromCharCode(65 + i);
        const downBit = r.mode === 'purchase' ? money0(r.downAmount) + ' down' : 'Refi';
        const prog = r.homeNow
          ? 'HomeNow ' + r.dpaPercent + '%'
          : r.mode === 'purchase'
            ? 'Purchase'
            : 'Refinance';
        return `<tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:800;color:#002B5C;width:36px">${letter}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0">
            <div style="font-weight:800;color:#0f172a;font-size:14px">${escapeHtml(s.label)}</div>
            <div style="font-size:12px;color:#64748b;margin-top:2px">${escapeHtml(prog)} · ${escapeHtml(downBit)}</div>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;white-space:nowrap">
            <div style="font-size:18px;font-weight:900;color:#00A89D;letter-spacing:-0.02em">${money2(r.totalMonthly)}</div>
            <div style="font-size:11px;color:#94a3b8;font-weight:700">/mo</div>
          </td>
        </tr>`;
      })
      .join('');
    compareHtml = `
      <div style="margin:0 0 18px;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;background:#fff">
        <div style="background:linear-gradient(90deg,#002B5C,#00A89D);color:#fff;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;padding:10px 14px">Quick compare</div>
        <table style="width:100%;border-collapse:collapse">${rows}</table>
      </div>`;
  }

  const optionCards = sources
    .map((s, i) => {
      const r = s.results || {};
      const letter = String.fromCharCode(65 + i);
      const accelerated = (r.extraMonthly > 0) || r.biweekly;
      const rows = [];
      if (r.mode === 'purchase') {
        rows.push(['Down payment', money0(r.downAmount) + (r.homeNow && r.downAmount < 1 ? ' *' : '')]);
        if (r.homePrice > 0) rows.push(['Home price', money0(r.homePrice)]);
      }
      rows.push(['Base loan', money0(r.baseLoanAmount)]);
      if (r.homeNow) rows.push(['1st w/ UFMIP', money0(r.firstLoanWithUfmip)]);
      rows.push(['Rate / term', `${r.annualRate}% · ${r.termYears}-year`]);
      rows.push(['Principal & interest', money2(r.monthlyPI) + '/mo']);
      rows.push(['Taxes + insurance', money2((r.monthlyTaxes || 0) + (r.monthlyInsurance || 0)) + '/mo']);
      rows.push([r.homeNow ? 'MIP' : 'PMI', money2(r.monthlyPMI) + '/mo']);
      if (r.homeNow) {
        rows.push([
          `HomeNow 2nd (${r.dpaPercent}%)`,
          `${money2(r.monthlyHomeNowSecond)}/mo · ${money0(r.dpaAmount)} @ ${Number(r.secondRate).toFixed(3)}%`
        ]);
      }

      const detailRows = rows
        .map(
          ([k, v], ri) =>
            `<tr style="background:${ri % 2 ? '#f8fafc' : '#fff'}">
              <td style="padding:8px 12px;font-size:12px;color:#64748b;font-weight:600;width:42%">${escapeHtml(k)}</td>
              <td style="padding:8px 12px;font-size:13px;font-weight:800;color:#0f172a;text-align:right;font-variant-numeric:tabular-nums">${escapeHtml(v)}</td>
            </tr>`
        )
        .join('');

      let vsHtml = '';
      if (accelerated) {
        const accelBits = [];
        if (r.extraMonthly > 0) accelBits.push('+' + money0(r.extraMonthly) + '/mo extra');
        if (r.biweekly) accelBits.push('biweekly');
        vsHtml = `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px;background:#f8fafc;border-top:1px solid #e2e8f0">
            <div style="border:1px solid #e2e8f0;border-radius:10px;padding:10px;background:#fff">
              <div style="font-size:10px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#64748b">Standard</div>
              <div style="font-size:18px;font-weight:900;color:#002B5C;margin-top:4px">${money2(r.standardTotalMonthly)}<span style="font-size:11px;color:#94a3b8;font-weight:700">/mo</span></div>
              <div style="font-size:11px;color:#64748b;margin-top:4px">Interest ${money0(r.totalInterestStandard)}</div>
            </div>
            <div style="border:1px solid rgba(241,90,41,0.35);border-radius:10px;padding:10px;background:linear-gradient(180deg,rgba(241,90,41,0.06),#fff)">
              <div style="font-size:10px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#F15A29">Accelerated</div>
              <div style="font-size:18px;font-weight:900;color:#F15A29;margin-top:4px">${money2(r.totalMonthly)}<span style="font-size:11px;color:#94a3b8;font-weight:700">/mo</span></div>
              <div style="font-size:11px;color:#64748b;margin-top:4px">${escapeHtml(accelBits.join(' · '))}</div>
              ${r.interestSavings > 0 ? `<div style="margin-top:6px;font-size:12px;font-weight:800;color:#059669">Save ${money0(r.interestSavings)}</div>` : ''}
            </div>
          </div>`;
      } else {
        vsHtml = `
          <div style="padding:10px 12px;border-top:1px solid #e2e8f0;background:#f8fafc;font-size:12px;color:#64748b">
            Full-term interest <strong style="color:#0f172a">${money0(r.totalInterestStandard)}</strong>
            <span style="color:#94a3b8"> · </span>
            Accelerated plan not applied
          </div>`;
      }

      return `
        <div style="margin:0 0 14px;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 8px 24px -16px rgba(0,43,92,0.25)">
          <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:linear-gradient(180deg,#f8fafc,#fff);border-bottom:1px solid #f1f5f9">
            <div style="width:28px;height:28px;border-radius:8px;background:#002B5C;color:#fff;font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center">${letter}</div>
            <div style="min-width:0;flex:1">
              <div style="font-size:10px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8">Option ${letter}</div>
              <div style="font-size:15px;font-weight:800;color:#002B5C;line-height:1.2">${escapeHtml(s.label)}</div>
            </div>
            ${r.homeNow ? `<span style="font-size:10px;font-weight:800;padding:4px 8px;border-radius:999px;background:rgba(0,168,157,0.12);color:#0f766e">HomeNow ${r.dpaPercent}%</span>` : ''}
          </div>
          <div style="padding:12px 14px 8px">
            <div style="font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8">Monthly housing</div>
            <div style="font-size:28px;font-weight:900;letter-spacing:-0.03em;color:#00A89D;line-height:1.1">${money2(r.totalMonthly)}<span style="font-size:13px;font-weight:700;color:#94a3b8">/mo</span></div>
            ${r.homeNow ? '<div style="font-size:11px;color:#64748b;margin-top:2px">Includes 1st mortgage + HomeNow 2nd</div>' : ''}
          </div>
          <table style="width:100%;border-collapse:collapse;border-top:1px solid #e2e8f0">${detailRows}</table>
          ${vsHtml}
        </div>`;
    })
    .join('');

  return `
    <div class="calc-vault-doc" style="font-family:Segoe UI,system-ui,-apple-system,sans-serif;color:#0f172a;line-height:1.45;max-width:720px;margin:0 auto">
      <div style="margin:0 0 16px;padding:14px 16px;border-radius:14px;background:linear-gradient(135deg,rgba(0,168,157,0.08),rgba(0,43,92,0.04));border:1px solid rgba(0,168,157,0.2)">
        <div style="font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#00A89D;margin-bottom:6px">Client payment summary</div>
        <p style="margin:0;font-size:14px;color:#334155">${intro} All figures are estimates for discussion.</p>
      </div>
      ${compareHtml}
      ${optionCards}
      <div style="margin-top:4px;padding:12px 14px;border-radius:12px;background:#fffbeb;border:1px solid #fde68a;font-size:11px;color:#78716c;line-height:1.45">
        <strong style="color:#92400e">Important:</strong> Estimates only — not a commitment to lend or a final Closing Disclosure.
        Rates, payments, and program eligibility (including HomeNow DPA) are subject to underwriting and may change.
        ${hasHomeNow ? ' HomeNow DPA is a second mortgage, not a gift.' : ''}
      </div>
    </div>`.trim();
}

/**
 * Always APPEND to My Saved Items (toggleSaveIdea removes on second click with same title).
 * Saves polished HTML for the vault viewer; plain text remains available via getClientCopyText().
 */
function saveCalcToVault(opts) {
  opts = opts || {};
  const plain = opts.text || getCalcResultsText();
  const html = opts.html || getClientVaultHtml();
  if (!plain && !html) {
    if (!opts.silent) calcToast('Nothing to save yet — run a calculation first');
    return false;
  }
  const now = new Date();
  const title =
    opts.title ||
    'Mortgage calc — ' +
      now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
      ' ' +
      now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  // Prefer direct vault write so we never accidentally toggle-remove
  try {
    const key = 'socialSavedIdeas';
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      saved = [];
    }
    if (!Array.isArray(saved)) saved = [];
    saved.push({
      title: title,
      content: html || plain,
      plainText: plain || '',
      savedAt: now.toISOString(),
      type: 'calculator',
      format: html ? 'html' : 'text'
    });
    localStorage.setItem(key, JSON.stringify(saved));
    if (typeof window.updateSavedCount === 'function') window.updateSavedCount();
    if (typeof window.refreshGeneratorSavedIdeas === 'function') {
      try {
        window.refreshGeneratorSavedIdeas();
      } catch (e2) { /* ignore */ }
    }
    if (!opts.silent) {
      if (typeof window.showSavedFeedback === 'function') {
        window.showSavedFeedback(opts.feedback || 'Saved to My Saved Items');
      } else {
        calcToast(opts.feedback || 'Saved to My Saved Items');
      }
    }
    return true;
  } catch (err) {
    // Fallback to toggleSaveIdea API
    if (typeof window.toggleSaveIdea === 'function') {
      window.toggleSaveIdea(title, html || plain, opts.btn || null, 'calculator', {
        format: html ? 'html' : 'text'
      });
      if (!opts.silent) {
        if (typeof window.showSavedFeedback === 'function') {
          window.showSavedFeedback(opts.feedback || 'Saved to My Saved Items');
        } else {
          calcToast(opts.feedback || 'Saved to My Saved Items');
        }
      }
      return true;
    }
    if (!opts.silent) calcToast('Saved Items unavailable');
    return false;
  }
}

function saveCalcResults() {
  const btn =
    typeof event !== 'undefined' && event.currentTarget ? event.currentTarget : null;
  saveCalcToVault({ btn: btn });
}

function getCalcProfileForPrint() {
  let profile = {};
  try {
    if (typeof window.getUserProfile === 'function') profile = window.getUserProfile() || {};
    else profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  } catch (e) {
    profile = {};
  }
  const name =
    (profile.name || '').trim() ||
    [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
  const isRealtor = typeof window !== 'undefined' && window.CALC_COACH_VARIANT === 'realtor';
  const defaultTitle = isRealtor ? 'Real Estate Agent' : 'Loan Officer';
  return {
    name,
    nmls: String(profile.nmls || profile.nmlsNumber || profile.license || profile.licenseNumber || '').trim(),
    phone: String(profile.phone || '').trim(),
    email: String(profile.email || '').trim(),
    location: String(profile.location || '').trim(),
    title: String(profile.title || profile.role || defaultTitle).trim() || defaultTitle,
    isRealtor
  };
}

function getPrintSources() {
  if (calcScenarioBoard.length > 0) return calcScenarioBoard.slice();
  if (lastCalcBundle && lastCalcBundle.valid) {
    return [
      {
        label: autoScenarioLabel(lastCalcBundle.inputs, lastCalcBundle.results),
        results: lastCalcBundle.results,
        inputs: lastCalcBundle.inputs
      }
    ];
  }
  return [];
}

/** Self-contained client PDF HTML (opened in print window — not app chrome). */
function buildClientPdfDocument(sources, profile) {
  const dateStr = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let minPay = Infinity;
  let minDown = Infinity;
  sources.forEach((s) => {
    const r = s.results || {};
    if (typeof r.totalMonthly === 'number' && r.totalMonthly < minPay) minPay = r.totalMonthly;
    if (s.inputs && s.inputs.mode === 'purchase' && typeof r.downAmount === 'number' && r.downAmount < minDown) {
      minDown = r.downAmount;
    }
  });

  const priceHint = (() => {
    const r0 = sources[0] && sources[0].results;
    if (r0 && r0.mode === 'purchase' && r0.homePrice > 0) {
      return `Home price context: <strong>${money0(r0.homePrice)}</strong>`;
    }
    if (r0 && r0.mode === 'refinance') return 'Refinance payment comparison';
    return 'Payment scenario comparison';
  })();

  function buildStdVsAccelBoxes(r) {
    const accelerated = (r.extraMonthly > 0) || r.biweekly;
    const payoffTxt = `${r.yearsToPayoff || r.termYears} yrs${r.remainingMonths ? ' + ' + r.remainingMonths + ' mo' : ''}`;
    const saveAmt = Math.abs(Number(r.interestSavings) || 0);
    const saveLine =
      !accelerated
        ? '<div class="vs-save vs-save-idle">Add extra or biweekly to unlock savings</div>'
        : r.interestSavings > 0
          ? `<div class="vs-save">Interest savings${r.homeNow ? ' (1st only)' : ''}: <strong>Save ${money0(saveAmt)}</strong></div>`
          : r.interestSavings < 0
            ? `<div class="vs-save vs-save-warn">Interest impact: <strong>Extra ${money0(saveAmt)}</strong></div>`
            : '<div class="vs-save vs-save-idle">No interest change</div>';

    return `
      <div class="vs-wrap">
        <div class="vs-title">Standard vs accelerated</div>
        <div class="vs-grid">
          <div class="vs-box vs-box-std">
            <div class="vs-box-head">Standard ${r.termYears || 30}-year</div>
            <div class="vs-pay">${money2(r.standardTotalMonthly)}<span>/mo</span></div>
            <div class="vs-row"><span>P&amp;I</span><span>${money2(r.monthlyPI)}</span></div>
            <div class="vs-row"><span>Taxes + insurance</span><span>${money2((r.monthlyTaxes || 0) + (r.monthlyInsurance || 0))}</span></div>
            <div class="vs-row"><span>${r.homeNow ? 'MIP' : 'PMI'}</span><span>${money2(r.monthlyPMI)}</span></div>
            ${r.homeNow ? `<div class="vs-row"><span>HomeNow 2nd</span><span>${money2(r.monthlyHomeNowSecond)}</span></div>` : ''}
            <div class="vs-row vs-row-em"><span>Total interest</span><span>${money0(r.totalInterestStandard)}</span></div>
            <div class="vs-row"><span>Payoff time</span><span>${r.termYears || 30} years</span></div>
          </div>
          <div class="vs-box vs-box-acc${accelerated ? ' is-active' : ''}">
            <div class="vs-box-head">Accelerated plan${accelerated ? '' : ' <em>(not applied)</em>'}</div>
            <div class="vs-pay vs-pay-acc">${money2(accelerated ? r.totalMonthly : r.standardTotalMonthly)}<span>/mo</span></div>
            <div class="vs-row"><span>Extra / biweekly</span><span>${
              accelerated
                ? `${r.extraMonthly > 0 ? money0(r.extraMonthly) + '/mo' : '—'}${r.biweekly ? (r.extraMonthly > 0 ? ' · ' : '') + 'biweekly' : ''}`
                : 'None'
            }</span></div>
            <div class="vs-row vs-row-em"><span>Total interest</span><span>${money0(accelerated ? r.totalInterestCustom : r.totalInterestStandard)}</span></div>
            <div class="vs-row"><span>Payoff time</span><span>${accelerated ? payoffTxt : (r.termYears || 30) + ' years'}</span></div>
            ${saveLine}
          </div>
        </div>
      </div>`;
  }

  const n = Math.min(3, sources.length);
  const cards = sources
    .slice(0, 3)
    .map((s, i) => {
      const r = s.results || {};
      const letter = String.fromCharCode(65 + i);
      const isBestPay = sources.length > 1 && r.totalMonthly === minPay;
      const isBestDown =
        sources.length > 1 &&
        s.inputs &&
        s.inputs.mode === 'purchase' &&
        r.downAmount === minDown &&
        minDown < Infinity;
      const badges = [];
      if (isBestPay) badges.push('<span class="badge badge-best">Lowest monthly</span>');
      if (isBestDown) badges.push('<span class="badge">Lowest down</span>');
      if (r.homeNow) badges.push(`<span class="badge badge-hn">HomeNow ${r.dpaPercent}%</span>`);
      if (r.extraMonthly > 0 || r.biweekly) badges.push('<span class="badge badge-acc">Accelerated</span>');

      const rows = [];
      rows.push(['Loan type', r.mode === 'purchase' ? 'Purchase' : 'Refinance']);
      if (r.mode === 'purchase') {
        rows.push(['Home price', money0(r.homePrice)]);
        rows.push(['Down payment', money0(r.downAmount) + (r.homeNow && r.downAmount < 1 ? ' *' : '')]);
      }
      rows.push(['Base loan amount', money0(r.baseLoanAmount)]);
      if (r.homeNow) rows.push(['1st loan (w/ UFMIP)', money0(r.firstLoanWithUfmip)]);
      rows.push(['Interest rate', `${r.annualRate}%`]);
      rows.push(['Term', `${r.termYears} years`]);
      rows.push(['Principal & interest', money2(r.monthlyPI)]);
      rows.push(['Taxes + insurance', money2((r.monthlyTaxes || 0) + (r.monthlyInsurance || 0))]);
      rows.push([r.homeNow ? 'MIP (monthly)' : 'PMI (monthly)', money2(r.monthlyPMI)]);
      if (r.homeNow) {
        rows.push([
          `HomeNow 2nd (${r.dpaPercent}% DPA)`,
          `${money2(r.monthlyHomeNowSecond)} · ${money0(r.dpaAmount)} @ ${Number(r.secondRate).toFixed(3)}%`
        ]);
      }

      const rowHtml = rows
        .map(
          ([k, v], ri) =>
            `<tr class="${ri % 2 ? 'alt' : ''}"><td>${escapeHtml(k)}</td><td>${escapeHtml(String(v))}</td></tr>`
        )
        .join('');

      // Hero payment: show standard as primary when not accelerated, else accelerated with note
      const heroPay = money2(r.totalMonthly);
      const heroNote = r.homeNow
        ? 'Includes 1st mortgage + HomeNow 2nd'
        : r.extraMonthly > 0 || r.biweekly
          ? 'Includes accelerate options (see Standard vs Accelerated below)'
          : 'P&amp;I + taxes + insurance + PMI/MIP';

      return `
        <section class="card${isBestPay ? ' card-best' : ''}">
          <div class="card-top">
            <div class="letter">${letter}</div>
            <div class="card-top-text">
              <div class="card-label">Option ${letter}</div>
              <h2>${escapeHtml(s.label || 'Scenario')}</h2>
            </div>
          </div>
          ${badges.length ? `<div class="badges">${badges.join('')}</div>` : ''}
          <div class="pay-block">
            <div class="pay-label">Estimated monthly housing</div>
            <div class="pay">${heroPay}<span>/mo</span></div>
            <div class="pay-note">${heroNote}</div>
          </div>
          <table class="detail">${rowHtml}</table>
          ${buildStdVsAccelBoxes(r)}
        </section>`;
    })
    .join('');

  // Compact comparison strip (includes standard vs accelerated monthly)
  const compareRows = sources
    .slice(0, 3)
    .map((s, i) => {
      const r = s.results || {};
      const letter = String.fromCharCode(65 + i);
      const accelerated = (r.extraMonthly > 0) || r.biweekly;
      const best = sources.length > 1 && r.totalMonthly === minPay;
      return `<tr class="${best ? 'best-row' : ''}">
        <td><strong>${letter}.</strong> ${escapeHtml(s.label || 'Scenario')}</td>
        <td class="num">${money2(r.standardTotalMonthly)}</td>
        <td class="num">${money2(r.totalMonthly)}${accelerated ? ' *' : ''}</td>
        <td class="num">${r.mode === 'purchase' ? money0(r.downAmount) : '—'}</td>
        <td class="num">${r.annualRate}%</td>
        <td>${r.homeNow ? 'HomeNow ' + r.dpaPercent + '%' : r.mode === 'purchase' ? 'Purchase' : 'Refi'}${accelerated ? ' · Accel' : ''}</td>
      </tr>`;
    })
    .join('');

  const loBits = [];
  if (profile.name) loBits.push(`<div class="lo-name">${escapeHtml(profile.name)}</div>`);
  loBits.push(`<div class="lo-title">${escapeHtml(profile.title || (profile.isRealtor ? 'Real Estate Agent' : 'Loan Officer'))}</div>`);
  if (profile.nmls) loBits.push(`<div>${profile.isRealtor ? 'License' : 'NMLS'}# ${escapeHtml(profile.nmls)}</div>`);
  if (profile.phone) loBits.push(`<div>${escapeHtml(profile.phone)}</div>`);
  if (profile.email) loBits.push(`<div>${escapeHtml(profile.email)}</div>`);
  if (profile.location) loBits.push(`<div>${escapeHtml(profile.location)}</div>`);

  const css = `
    @page { size: letter; margin: 0.45in 0.5in 0.5in 0.5in; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0;
      background: #fff;
      color: #0f172a;
      font-family: "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page { max-width: 8in; margin: 0 auto; }
    .masthead {
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      gap: 16px;
      border-bottom: 3px solid #00A89D;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .brand-mark {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #00A89D;
      margin-bottom: 4px;
    }
    h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #002B5C;
      line-height: 1.15;
    }
    .subtitle {
      margin: 6px 0 0;
      color: #64748b;
      font-size: 11px;
    }
    .date-line {
      margin-top: 4px;
      color: #94a3b8;
      font-size: 10px;
    }
    .lo-card {
      min-width: 2.4in;
      max-width: 2.8in;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 12px;
      background: #f8fafc;
      text-align: right;
      font-size: 10px;
      color: #475569;
      line-height: 1.45;
    }
    .lo-name {
      font-size: 13px;
      font-weight: 800;
      color: #002B5C;
      margin-bottom: 1px;
    }
    .lo-title {
      font-weight: 700;
      color: #00A89D;
      margin-bottom: 4px;
    }
    .intro {
      margin: 0 0 14px;
      color: #475569;
      font-size: 11px;
    }
    .grid {
      display: grid;
      gap: 12px;
      margin-bottom: 16px;
      align-items: start;
    }
    .grid.cols-1 { grid-template-columns: 1fr; }
    .grid.cols-2 { grid-template-columns: 1fr 1fr; }
    .grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      background: #fff;
      page-break-inside: avoid;
    }
    .card-best {
      border-color: #00A89D;
      box-shadow: 0 0 0 1px rgba(0,168,157,0.25);
    }
    .card-top {
      display: flex;
      gap: 10px;
      align-items: center;
      padding: 12px 12px 8px;
      background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
      border-bottom: 1px solid #f1f5f9;
    }
    .card-best .card-top {
      background: linear-gradient(180deg, rgba(0,168,157,0.1) 0%, #fff 100%);
    }
    .letter {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: #002B5C;
      color: #fff;
      font-weight: 800;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .card-best .letter { background: #00A89D; }
    .card-label {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #94a3b8;
    }
    .card-top h2 {
      margin: 1px 0 0;
      font-size: 13px;
      font-weight: 800;
      color: #002B5C;
      line-height: 1.2;
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      padding: 0 12px 8px;
    }
    .badge {
      display: inline-block;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 999px;
      background: #f1f5f9;
      color: #64748b;
    }
    .badge-best {
      background: rgba(0,168,157,0.14);
      color: #0f766e;
    }
    .badge-hn {
      background: rgba(0,43,92,0.08);
      color: #002B5C;
    }
    .pay-block {
      padding: 4px 12px 12px;
      text-align: left;
    }
    .pay-label {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #94a3b8;
    }
    .pay {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.03em;
      color: #00A89D;
      line-height: 1.1;
      margin-top: 2px;
    }
    .pay span {
      font-size: 12px;
      font-weight: 700;
      color: #94a3b8;
      margin-left: 2px;
    }
    .pay-note {
      font-size: 9px;
      color: #94a3b8;
      margin-top: 3px;
    }
    table.detail {
      width: 100%;
      border-collapse: collapse;
      border-top: 1px solid #e2e8f0;
    }
    table.detail td {
      padding: 5px 12px;
      font-size: 10px;
      vertical-align: top;
    }
    table.detail td:first-child {
      color: #64748b;
      font-weight: 600;
      width: 46%;
    }
    table.detail td:last-child {
      text-align: right;
      font-weight: 700;
      color: #0f172a;
    }
    table.detail tr.alt td { background: #f8fafc; }

    /* Standard vs Accelerated dual boxes (matches on-screen calculator) */
    .vs-wrap {
      border-top: 1px solid #e2e8f0;
      padding: 10px 10px 12px;
      background: #fafbfc;
    }
    .vs-title {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #64748b;
      margin: 0 0 8px 2px;
    }
    .vs-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .vs-box {
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      background: #fff;
      padding: 10px 10px 8px;
      page-break-inside: avoid;
    }
    .vs-box-std {
      border-color: rgba(0, 43, 92, 0.22);
    }
    .vs-box-acc {
      border-color: rgba(241, 90, 41, 0.28);
      border-style: dashed;
    }
    .vs-box-acc.is-active {
      border-style: solid;
      border-color: rgba(241, 90, 41, 0.45);
      background: linear-gradient(180deg, rgba(241, 90, 41, 0.06) 0%, #fff 55%);
    }
    .vs-box-head {
      font-size: 10px;
      font-weight: 800;
      color: #002B5C;
      margin-bottom: 4px;
      line-height: 1.25;
    }
    .vs-box-acc .vs-box-head { color: #F15A29; }
    .vs-box-head em {
      font-style: normal;
      font-weight: 700;
      font-size: 8px;
      color: #94a3b8;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .vs-pay {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: -0.02em;
      color: #002B5C;
      line-height: 1.1;
      margin-bottom: 6px;
    }
    .vs-pay-acc { color: #F15A29; }
    .vs-pay span {
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      margin-left: 1px;
    }
    .vs-row {
      display: flex;
      justify-content: space-between;
      gap: 6px;
      font-size: 9px;
      padding: 3px 0;
      border-top: 1px dashed #f1f5f9;
      color: #64748b;
    }
    .vs-row span:last-child {
      font-weight: 700;
      color: #0f172a;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .vs-row-em span:last-child { font-weight: 800; }
    .vs-save {
      margin-top: 7px;
      padding: 6px 8px;
      border-radius: 8px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.28);
      font-size: 9px;
      color: #047857;
      font-weight: 700;
      line-height: 1.3;
    }
    .vs-save strong {
      display: block;
      font-size: 13px;
      font-weight: 900;
      color: #059669;
      margin-top: 1px;
    }
    .vs-save-warn {
      background: rgba(239, 68, 68, 0.08);
      border-color: rgba(239, 68, 68, 0.22);
      color: #b91c1c;
    }
    .vs-save-warn strong { color: #dc2626; }
    .vs-save-idle {
      background: #f1f5f9;
      border-color: #e2e8f0;
      color: #64748b;
      font-weight: 600;
    }
    .badge-acc {
      background: rgba(241, 90, 41, 0.12);
      color: #c2410c;
    }

    .compare-wrap {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .compare-head {
      background: #002B5C;
      color: #fff;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 8px 12px;
    }
    table.compare {
      width: 100%;
      border-collapse: collapse;
    }
    table.compare th {
      text-align: left;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #64748b;
      background: #f8fafc;
      padding: 7px 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    table.compare th.num, table.compare td.num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    table.compare td {
      padding: 8px 10px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 10.5px;
    }
    table.compare tr:last-child td { border-bottom: 0; }
    table.compare tr.best-row td {
      background: rgba(0,168,157,0.08);
      font-weight: 700;
    }

    .disclaimer {
      border: 1px solid #fde68a;
      background: #fffbeb;
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 9px;
      color: #78716c;
      line-height: 1.45;
      margin-bottom: 10px;
    }
    .disclaimer strong { color: #92400e; }
    .footnote {
      font-size: 8.5px;
      color: #94a3b8;
      line-height: 1.4;
    }
    .footnote em { color: #64748b; }
    @media print {
      .no-print { display: none !important; }
      a { color: inherit; text-decoration: none; }
    }
    .toolbar {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-bottom: 12px;
    }
    .toolbar button {
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #002B5C;
      font-weight: 700;
      font-size: 12px;
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
    }
    .toolbar button.primary {
      background: #00A89D;
      border-color: #00A89D;
      color: #fff;
    }
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Payment Scenarios — ${escapeHtml(profile.name || 'Ruoff Mortgage')}</title>
  <style>${css}</style>
</head>
<body>
  <div class="page">
    <div class="toolbar no-print">
      <button type="button" onclick="window.close()">Close</button>
      <button type="button" class="primary" onclick="window.print()">Print / Save as PDF</button>
    </div>
    <header class="masthead">
      <div>
        <div class="brand-mark">Ruoff Mortgage</div>
        <h1>Payment Scenario Comparison</h1>
        <p class="subtitle">${priceHint}</p>
        <div class="date-line">Prepared ${escapeHtml(dateStr)}</div>
      </div>
      <aside class="lo-card">
        <div style="font-size:8px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;margin-bottom:4px">Prepared by</div>
        ${loBits.join('') || ('<div class="lo-name">Your ' + (profile.isRealtor ? 'Agent' : 'Loan Officer') + '</div>')}
      </aside>
    </header>

    <p class="intro">Below are estimated housing payment options for discussion. Figures include principal &amp; interest plus taxes, insurance, and PMI/MIP when applicable${sources.some((s) => s.results && s.results.homeNow) ? ', and HomeNow second-mortgage payment when selected' : ''}.</p>

    <div class="grid cols-${n}">
      ${cards}
    </div>

    ${
      sources.length > 1
        ? `<div class="compare-wrap">
      <div class="compare-head">Side-by-side summary</div>
      <table class="compare">
        <thead>
          <tr>
            <th>Scenario</th>
            <th class="num">Standard /mo</th>
            <th class="num">Accelerated /mo</th>
            <th class="num">Down</th>
            <th class="num">Rate</th>
            <th>Program</th>
          </tr>
        </thead>
        <tbody>${compareRows}</tbody>
      </table>
      <div style="padding:6px 10px 8px;font-size:8.5px;color:#94a3b8">* Accelerated monthly differs from standard when extra payments or biweekly are applied.</div>
    </div>`
        : ''
    }

    <div class="disclaimer">
      <strong>Important:</strong> These figures are estimates for educational and conversation purposes only.
      They are <em>not</em> a commitment to lend, a pre-approval, or a final Closing Disclosure.
      Actual rates, payments, taxes, insurance, PMI/MIP, and program eligibility (including Ruoff HomeNow DPA) are subject to underwriting, credit, property, and investor guidelines and may change.
      Confirm all numbers with your loan officer before making decisions.
    </div>
    <div class="footnote">
      ${sources.some((s) => s.results && s.results.homeNow) ? '* HomeNow options may show $0 traditional down; the DPA amount is a second mortgage, not a gift. ' : ''}
      Equal Housing Opportunity. NMLS Consumer Access: nmlsconsumeraccess.org.
      Document generated from Ruoff ${typeof window !== 'undefined' && window.CALC_COACH_VARIANT === 'realtor' ? 'Agent' : 'Loan Officer'} Sales Coach · Scenario Studio.
    </div>
  </div>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        try { window.focus(); window.print(); } catch (e) {}
      }, 200);
    });
  <\/script>
</body>
</html>`;
}

function buildPrintSheet() {
  // Keep a minimal on-page mirror for accessibility / fallback
  const root = document.getElementById('calc-print-sheet');
  if (!root) return;
  const sources = getPrintSources();
  if (!sources.length) {
    root.innerHTML = '';
    return;
  }
  root.innerHTML = buildClientPdfDocument(sources, getCalcProfileForPrint());
}

function printCalcScenarios() {
  const sources = getPrintSources();
  if (!sources.length) {
    calcToast('Save a scenario (or run a calculation) first');
    return;
  }
  const profile = getCalcProfileForPrint();
  const html = buildClientPdfDocument(sources, profile);

  // Preferred: dedicated print window (clean PDF, no app chrome)
  let win = null;
  try {
    // Do not use noopener here — we need to write the document, then auto-print.
    win = window.open('about:blank', '_blank', 'width=920,height=1100');
  } catch (e) {
    win = null;
  }

  if (win && win.document) {
    try {
      win.document.open();
      win.document.write(html);
      win.document.close();
      try { win.focus(); } catch (e2) { /* ignore */ }
      calcToast('Client PDF ready — Print → Save as PDF');
      return;
    } catch (writeErr) {
      try { win.close(); } catch (e3) { /* ignore */ }
      win = null;
    }
  }

  // Popup blocked: inject full document styles into on-page print root
  const root = document.getElementById('calc-print-sheet');
  if (root) {
    root.innerHTML = html;
    // Extract body content for on-page print CSS path
    const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (match) {
      // Use a clean print-only wrapper with embedded style from the document
      const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      root.innerHTML =
        (styleMatch ? `<style id="calc-print-inline-style">${styleMatch[1]}</style>` : '') +
        `<div class="calc-print-fallback">${match[1].replace(/<script[\s\S]*?<\/script>/gi, '')}</div>`;
    }
  }
  setTimeout(() => window.print(), 100);
  calcToast('Print dialog opening — choose Save as PDF');
}

// ─────────────────────────────────────────────────────────────
// Presets
// ─────────────────────────────────────────────────────────────

function applyCalcPreset(type) {
  const hp = document.getElementById('homePrice');
  const dp = document.getElementById('downPayment');
  const rate = document.getElementById('rate');
  const term = document.getElementById('term');
  const taxes = document.getElementById('taxes');
  const ins = document.getElementById('insurance');
  const extra = document.getElementById('extraMonthly');
  const bi = document.getElementById('biweekly');
  const hn = document.getElementById('homenow-checkbox');
  const pmi = document.getElementById('pmi');

  if (!hp || !dp) return;
  if (bi) bi.checked = false;
  if (extra) extra.value = '0';

  if (type === 'firsttime') {
    setCalcMode('purchase', { silent: true });
    setDownMode('percent', { silent: true });
    setPmiMode('dollar', { silent: true, skipConvert: true });
    hp.value = '350000';
    dp.value = '0';
    if (rate) rate.value = '6.75';
    if (term) term.value = '30';
    if (taxes) taxes.value = '3200';
    if (ins) ins.value = '1400';
    if (hn) {
      hn.checked = true;
      homeNowEnabled = true;
    }
    selectedDPAPercent = 3.5;
    styleDpaButtons();
    updateHomeNowUi();
    autoSetFHA_MIP();
  } else if (type === 'conventional5') {
    setCalcMode('purchase', { silent: true });
    setDownMode('percent', { silent: true });
    setPmiMode('dollar', { silent: true, skipConvert: true });
    hp.value = '375000';
    dp.value = '5';
    if (rate) rate.value = '6.625';
    if (term) term.value = '30';
    if (taxes) taxes.value = '3600';
    if (ins) ins.value = '1500';
    // ~0.55% of $356,250 loan ≈ $163/mo
    if (pmi) pmi.value = '163';
    if (hn) {
      hn.checked = false;
      homeNowEnabled = false;
    }
    updateHomeNowUi();
  } else if (type === 'investor') {
    setCalcMode('purchase', { silent: true });
    setDownMode('percent', { silent: true });
    setPmiMode('dollar', { silent: true, skipConvert: true });
    hp.value = '425000';
    dp.value = '25';
    if (rate) rate.value = '7.25';
    if (term) term.value = '30';
    if (taxes) taxes.value = '5100';
    if (ins) ins.value = '1650';
    if (extra) extra.value = '250';
    if (pmi) pmi.value = '0';
    if (hn) {
      hn.checked = false;
      homeNowEnabled = false;
    }
    updateHomeNowUi();
  } else if (type === 'refi') {
    setCalcMode('refinance', { silent: true });
    setPmiMode('dollar', { silent: true, skipConvert: true });
    const la = document.getElementById('loanAmountDirect');
    if (la) la.value = '285000';
    if (rate) rate.value = '6.125';
    if (term) term.value = '30';
    if (taxes) taxes.value = '2900';
    if (ins) ins.value = '1250';
    if (extra) extra.value = '200';
    if (pmi) pmi.value = '0';
  }

  calculateAdvanced();
}

// ─────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.calculateAdvanced = calculateAdvanced;
  window.toggleHomeNow = toggleHomeNow;
  window.setDPA = setDPA;
  window.autoSelectDPA = autoSelectDPA;
  window.updatePMIRate = updatePMIRate;
  window.calculateMonthlyPayment = calculateMonthlyPayment;
  window.autoSetFHA_MIP = autoSetFHA_MIP;
  window.applyCalcPreset = applyCalcPreset;
  window.setPmiMode = setPmiMode;
  window.setTermYears = setTermYears;
  window.copyCalcResults = copyCalcResults;
  window.saveCalcResults = saveCalcResults;
  window.copyForClient = copyForClient;
  window.emailForClient = emailForClient;
  window.printCalcScenarios = printCalcScenarios;
  window.saveCurrentScenario = saveCurrentScenario;
  window.clearScenarioBoard = clearScenarioBoard;
  window.saveBoardComparisonToVault = saveBoardComparisonToVault;
  window.computeMortgageScenario = computeMortgageScenario;
}

function initCalculator() {
  if (typeof document === 'undefined') return;
  const section = document.getElementById('calculator');
  if (!section) return;

  loadBoardFromStorage();

  document.getElementById('mode-purchase')?.addEventListener('click', () => setCalcMode('purchase'));
  document.getElementById('mode-refinance')?.addEventListener('click', () => setCalcMode('refinance'));
  document.getElementById('dp-percent-btn')?.addEventListener('click', () => setDownMode('percent'));
  document.getElementById('dp-dollar-btn')?.addEventListener('click', () => setDownMode('dollar'));
  document.getElementById('pmi-dollar-btn')?.addEventListener('click', () => setPmiMode('dollar'));
  document.getElementById('pmi-percent-btn')?.addEventListener('click', () => setPmiMode('percent'));

  document.querySelectorAll('.calc-term-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const y = parseInt(chip.getAttribute('data-term'), 10);
      if (y) setTermYears(y);
    });
  });

  document.querySelectorAll('#calculator input').forEach((el) => {
    el.addEventListener('input', calculateAdvanced);
    el.addEventListener('change', calculateAdvanced);
  });

  const hnChk = document.getElementById('homenow-checkbox');
  if (hnChk) hnChk.addEventListener('change', toggleHomeNow);

  document.getElementById('dpa35-btn')?.addEventListener('click', () => setDPA(3.5));
  document.getElementById('dpa5-btn')?.addEventListener('click', () => setDPA(5));

  document.getElementById('calc-save-scenario-btn')?.addEventListener('click', saveCurrentScenario);
  document.getElementById('calc-copy-client-btn')?.addEventListener('click', copyForClient);
  document.getElementById('calc-email-client-btn')?.addEventListener('click', emailForClient);
  document.getElementById('calc-print-btn')?.addEventListener('click', printCalcScenarios);
  document.getElementById('calc-board-save-vault-btn')?.addEventListener('click', saveBoardComparisonToVault);
  document.getElementById('calc-board-clear-btn')?.addEventListener('click', clearScenarioBoard);

  // Defaults — PMI in monthly $ (most common for LOs)
  setCalcMode('purchase', { silent: true });
  setDownMode('percent', { silent: true });
  setPmiMode('dollar', { silent: true, skipConvert: true });
  styleDpaButtons();
  updateHomeNowUi();
  renderScenarioBoard();
  calculateAdvanced();

  console.log('%c[calculator.js] Scenario Studio ready', 'color:#00A89D');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalculator);
  } else {
    initCalculator();
  }

  setTimeout(() => {
    const calcSection = document.getElementById('calculator');
    if (calcSection && !calcSection.classList.contains('hidden') && typeof calculateAdvanced === 'function') {
      calculateAdvanced();
    }
  }, 300);
}

// Node / test export (after init guards so requiring this file is safe)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateMonthlyPayment,
    computeMortgageScenario,
    fhaMipRatePercent
  };
}
