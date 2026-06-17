/**
 * js/features/calculator.js
 *
 * Advanced Payment Calculator + Mortgage Math Helpers
 * Extracted from monolithic index.html (Phase 1)
 *
 * Includes:
 * - calculateAdvanced() - main bidirectional calculator
 * - calculateMonthlyPayment()
 * - toggleHomeNow(), setDPA(), autoSelectDPA()
 * - updatePMIRate(), autoSetFHA_MIP()
 * - All input listeners, mode switching, DPA buttons, slider sync
 * - Initial state setup
 *
 * Self-initializes. Exposes public functions on window.
 */

// === GLOBAL STATE (hoisted at top to avoid TDZ errors) ===
let homeNowEnabled = false;
let selectedDPAPercent = 3.5;



// === IMPROVED CALCULATOR WITH FULL BIDIRECTIONAL SYNC ===
function calculateAdvanced() {
    updatePMIRate();

    const isPurchase = document.getElementById('mode-purchase').classList.contains('bg-gradient-to-r');

    let homePrice = 0;
    let downPaymentInput = 0;
    let isPercent = true;
    let loanAmountInput = 0;
    let loanAmount = 0;
    let downAmount = 0;

    if (isPurchase) {
        homePrice = parseFloat(document.getElementById('homePrice').value) || 0;
        downPaymentInput = parseFloat(document.getElementById('downPayment').value) || 0;
        isPercent = document.getElementById('dp-percent-btn').classList.contains('bg-gradient-to-r');
        loanAmountInput = parseFloat(document.getElementById('loanAmountManual').value) || 0;

        const focusedId = document.activeElement ? document.activeElement.id : '';

        if (focusedId === 'loanAmountManual' && loanAmountInput > 0) {
            loanAmount = loanAmountInput;
            downAmount = Math.max(0, homePrice - loanAmount);
            const newDown = isPercent ? (homePrice > 0 ? (downAmount / homePrice * 100) : 0) : downAmount;
            if (Math.abs(newDown - downPaymentInput) > 1) {
                document.getElementById('downPayment').value = isPercent ? newDown.toFixed(2) : newDown.toFixed(0);
            }
        } else {
            downAmount = isPercent ? (downPaymentInput / 100 * homePrice) : downPaymentInput;
            loanAmount = Math.max(0, homePrice - downAmount);
            if (focusedId !== 'loanAmountManual' && Math.abs(loanAmount - loanAmountInput) > 1) {
                document.getElementById('loanAmountManual').value = loanAmount.toFixed(0);
            }
        }
    } else {
        loanAmount = parseFloat(document.getElementById('loanAmountDirect').value) || 0;
    }

    // ==================== UFMIP FOR HOMENOW ====================
    const baseLoanAmount = loanAmount;
    if (isPurchase && homeNowEnabled) {
        const ufmip = baseLoanAmount * 0.0175;
        loanAmount = baseLoanAmount + ufmip;
    }

    const annualRate = parseFloat(document.getElementById('rate').value) || 0;
    const termYears = parseFloat(document.getElementById('term').value) || 30;
    const annualTaxes = parseFloat(document.getElementById('taxes').value) || 0;
    const annualInsurance = parseFloat(document.getElementById('insurance').value) || 0;
    const pmiRateInput = parseFloat(document.getElementById('pmi').value) || 0;
    const extraMonthly = parseFloat(document.getElementById('extraMonthly').value) || 0;
    const biweekly = document.getElementById('biweekly').checked;

    if (loanAmount <= 0 || annualRate <= 0 || termYears <= 0) {
        document.getElementById('calc-output').innerHTML = '<p class="text-red-600 font-bold text-center text-2xl">Please enter valid values.</p>';
        return;
    }

    const monthlyRate = annualRate / 100 / 12;
    const totalPayments = termYears * 12;

    const standardPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
                      (Math.pow(1 + monthlyRate, totalPayments) - 1) || 0;

    const monthlyTaxes = annualTaxes / 12;
    const monthlyInsurance = annualInsurance / 12;

    // ==================== PMI CALCULATION ====================
    let monthlyPMI = 0;
    if (isPurchase) {
        const downPercent = homePrice > 0 ? ((homePrice - baseLoanAmount) / homePrice * 100) : 0;
        if (homeNowEnabled) {
            monthlyPMI = (baseLoanAmount * pmiRateInput / 100 / 12);
        } else {
            monthlyPMI = downPercent < 20 ? (baseLoanAmount * pmiRateInput / 100 / 12) : 0;
        }
    } else {
        monthlyPMI = baseLoanAmount * pmiRateInput / 100 / 12;
    }

    // ==================== HOMENOW SECOND MORTGAGE (ALWAYS MONTHLY) ====================
    let secondPmt = 0;
    let homenowHTML = '';
    if (isPurchase && homeNowEnabled) {
        const dpaAmount = Math.ceil(homePrice * (selectedDPAPercent / 100));
        const secondRate = annualRate + 2;
        secondPmt = calculateMonthlyPayment(dpaAmount, secondRate, 10);

        document.getElementById('dpa-amt').textContent = '$' + dpaAmount.toLocaleString();
        document.getElementById('second-rate').textContent = secondRate.toFixed(3) + '%';
        document.getElementById('second-pmt').textContent = '$' + Math.round(secondPmt).toLocaleString();

        homenowHTML = `
            <div class="mt-4 p-3 bg-[#00A89D]/5 border border-[#00A89D]/30 rounded-2xl text-sm">
                <span class="font-semibold text-[#00A89D]">+ HomeNow 2nd:</span> $${Math.round(secondPmt).toLocaleString()}/mo @ ${secondRate.toFixed(3)}% (10yr term)
            </div>`;
    }

    // === PAYMENT LOGIC - Biweekly ONLY accelerates FIRST mortgage ===
    let basePITI = standardPI + monthlyTaxes + monthlyInsurance + monthlyPMI;
    let displayPayment = basePITI + extraMonthly;
    let principalPayment = standardPI + extraMonthly;

    if (biweekly) {
        displayPayment = (basePITI + extraMonthly) * 13 / 12;
        principalPayment = (standardPI + extraMonthly) * 13 / 12;
    }

    if (isPurchase && homeNowEnabled) {
        displayPayment += secondPmt;
    }

    // === STANDARD TOTAL PAYMENT (includes HomeNow 2nd mortgage) ===
    let standardTotalPayment = basePITI;
    if (isPurchase && homeNowEnabled) {
        standardTotalPayment += secondPmt;
    }

    // Payoff calculation (only on first mortgage)
    let monthsToPayoff = totalPayments;
    if (extraMonthly > 0 || biweekly) {
        const r = monthlyRate;
        const p = principalPayment;
        const logArg = p / (p - loanAmount * r);
        if (logArg > 1) {
            monthsToPayoff = Math.log(logArg) / Math.log(1 + r);
            monthsToPayoff = Math.ceil(monthsToPayoff);
        }
    }

    const yearsToPayoff = Math.floor(monthsToPayoff / 12);
    const remainingMonths = monthsToPayoff % 12;

    // Second mortgage interest (always full 10-year term)
    let secondInterest = 0;
    if (isPurchase && homeNowEnabled) {
        const dpaAmount = Math.ceil(homePrice * (selectedDPAPercent / 100));
        const secondPmtCalc = calculateMonthlyPayment(dpaAmount, annualRate + 2, 10);
        secondInterest = (secondPmtCalc * 120) - dpaAmount;
    }

    // Standard scenario = first mortgage normal + second mortgage full interest
    const standardInterest = (standardPI * totalPayments - baseLoanAmount) + secondInterest;

    // Custom scenario = first mortgage accelerated + second mortgage full interest
    const customInterest = (principalPayment * monthsToPayoff - baseLoanAmount) + secondInterest;

    // SAVINGS CALCULATION — ONLY on the FIRST mortgage when HomeNow is checked
    let interestDiff = standardInterest - customInterest;
    if (homeNowEnabled) {
        const firstMortgageStandardInterest = standardPI * totalPayments - baseLoanAmount;
        const firstMortgageCustomInterest = principalPayment * monthsToPayoff - baseLoanAmount;
        interestDiff = firstMortgageStandardInterest - firstMortgageCustomInterest;
    }

    // ==================== OUTPUT ====================
    document.getElementById('calc-output').innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border-2 border-[#002B5C] dark:border-[#00A89D]/60">
            <div class="flex items-center gap-3 mb-6">
                <i class="fas fa-balance-scale text-2xl text-[#002B5C] dark:text-[#00A89D]"></i>
                <h4 class="text-2xl font-bold text-[#002B5C] dark:text-[#00A89D]">Standard ${termYears}-Year Loan</h4>
            </div>
            <div class="space-y-4 text-[15px]">
                <div class="flex justify-between"><span class="text-gray-600 dark:text-gray-400">Base Loan Amount</span> <span class="font-semibold">$${baseLoanAmount.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span></div>
                <div class="flex justify-between"><span class="text-gray-600 dark:text-gray-400">P&I</span> <span class="font-semibold">$${standardPI.toFixed(2)}/mo</span></div>
                <div class="flex justify-between"><span class="text-gray-600 dark:text-gray-400">Taxes + Insurance</span> <span class="font-semibold">$${(monthlyTaxes + monthlyInsurance).toFixed(2)}/mo</span></div>
                <div class="flex justify-between"><span class="text-gray-600 dark:text-gray-400">PMI / MIP</span> <span class="font-semibold">$${monthlyPMI.toFixed(2)}/mo</span></div>
                ${homeNowEnabled ? `<div class="text-xs text-[#00A89D]">Includes 1.75% UFMIP financed into 1st mortgage</div>` : ''}
                ${homenowHTML}
                <div class="pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-baseline">
                    <span class="font-semibold text-lg">Total Monthly Payment</span>
                    <span class="text-3xl font-extrabold text-[#002B5C] dark:text-[#00A89D]">$${standardTotalPayment.toFixed(2)}</span>
                </div>
                <div class="pt-2 flex justify-between items-baseline">
                    <span class="text-sm text-gray-500">Total Interest (full term)</span>
                    <span class="text-2xl font-bold text-[#002B5C] dark:text-[#00A89D]">$${standardInterest.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                </div>
            </div>
        </div>

        <div class="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border-2 border-[#F15A29]">
            <div class="flex items-center gap-3 mb-6">
                <i class="fas fa-rocket text-2xl text-[#F15A29]"></i>
                <h4 class="text-2xl font-bold text-[#F15A29]">Your Accelerated Plan</h4>
            </div>
            <div class="space-y-4 text-[15px]">
                <div class="flex justify-between"><span class="text-gray-600 dark:text-gray-400">Extra Payments</span> <span class="font-semibold">$${extraMonthly.toFixed(2)}${extraMonthly > 0 ? '/mo' : ''} ${biweekly ? ' (biweekly mode)' : ''}</span></div>
                <div class="flex justify-between"><span class="text-gray-600 dark:text-gray-400">Your Monthly Payment</span> <span class="font-semibold">$${displayPayment.toFixed(2)}</span></div>
                <div class="flex justify-between"><span class="text-gray-600 dark:text-gray-400">Payoff Time</span> <span class="font-semibold">${yearsToPayoff} yrs${remainingMonths ? ` + ${remainingMonths} mo` : ''}</span></div>
                <div class="pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-baseline">
                    <span class="font-semibold text-lg">Total Interest Paid</span>
                    <span class="text-3xl font-extrabold text-[#F15A29]">$${customInterest.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                </div>
                <div class="pt-4">
                  <div class="text-sm text-gray-500">Interest ${interestDiff > 0 ? 'Savings' : interestDiff < 0 ? 'Difference' : 'Impact'}</div>
                  <div class="text-4xl font-black ${interestDiff > 0 ? 'text-green-600' : interestDiff < 0 ? 'text-red-600' : 'text-gray-500'}">
                    ${interestDiff > 0 ? 'Save' : interestDiff < 0 ? 'Extra' : 'No change'}: $${Math.abs(interestDiff).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                  </div>
                </div>
                <p class="text-xs text-gray-500 mt-4 italic">* Estimates only. Confirm with your lender for exact figures, rounding rules, and program eligibility (especially HomeNow DPA).</p>
            </div>
        </div>
    </div>

    <div class="mt-6 flex justify-center">
      <button onclick="copyCalcResults()" class="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-2xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition">
        <i class="fas fa-copy"></i>
        <span>Copy Full Breakdown</span>
      </button>
    </div>
`;
}

function copyCalcResults() {
  const output = document.getElementById('calc-output');
  if (!output || !output.textContent.trim()) {
    alert('No results to copy yet. Run a calculation first.');
    return;
  }
  const text = output.innerText || output.textContent;
  navigator.clipboard.writeText(text.trim()).then(() => {
    const orig = event.currentTarget ? event.currentTarget.innerHTML : '';
    // simple toast
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#002B5C] text-white px-5 py-2 rounded-2xl text-sm shadow-xl z-[999]';
    toast.textContent = 'Calculator results copied!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1800);
  }).catch(() => {
    prompt('Copy the results below:', text.trim());
  });
}

// Quick presets for common scenarios (world-class UX - instant "what if")
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

  if (!hp || !dp) return;

  if (bi) bi.checked = false;
  if (extra) extra.value = '0';

  if (type === 'firsttime') {
    hp.value = '350000';
    dp.value = '3.5';
    if (rate) rate.value = '6.75';
    if (term) term.value = '30';
    if (taxes) taxes.value = '3200';
    if (ins) ins.value = '1400';
    if (hn) { hn.checked = true; homeNowEnabled = true; }
    const pct = document.getElementById('dp-percent-btn');
    if (pct) pct.click();
  } else if (type === 'investor') {
    hp.value = '425000';
    dp.value = '25';
    if (rate) rate.value = '7.25';
    if (term) term.value = '30';
    if (taxes) taxes.value = '5100';
    if (ins) ins.value = '1650';
    if (extra) extra.value = '250';
    if (hn) hn.checked = false;
    const pct = document.getElementById('dp-percent-btn');
    if (pct) pct.click();
  } else if (type === 'refi') {
    const refiBtn = document.getElementById('mode-refinance');
    if (refiBtn) refiBtn.click();
    const la = document.getElementById('loanAmountDirect');
    if (la) la.value = '285000';
    if (rate) rate.value = '6.125';
    if (term) term.value = '30';
    if (taxes) taxes.value = '2900';
    if (ins) ins.value = '1250';
    if (extra) extra.value = '200';
  }

  calculateAdvanced();
}







// ====================== HOMENOW SUPPORT ======================

function toggleHomeNow() {
  homeNowEnabled = document.getElementById('homenow-checkbox').checked;
  const dpaOpts = document.getElementById('dpa-options');
  const breakdown = document.getElementById('homenow-breakdown');
  if (dpaOpts) dpaOpts.classList.toggle('hidden', !homeNowEnabled);
  if (breakdown) breakdown.classList.toggle('hidden', !homeNowEnabled);

  if (homeNowEnabled) {
    // For 100% financing programs, default down payment to 0 (DPA covers it as 2nd)
    const dp = document.getElementById('downPayment');
    if (dp) {
      dp.value = '0';
    }
    setDPA(3.5);
    autoSetFHA_MIP();
  }

  calculateAdvanced();

  // Force the clear AFTER the entire calculation finishes
  if (!homeNowEnabled) {
    const pmi = document.getElementById('pmi');
    if (pmi) pmi.value = '';
  }
}

function setDPA(pct) {
  selectedDPAPercent = pct;

  // Style the buttons only — no longer auto-fills down payment
  document.getElementById('dpa35-btn').classList.toggle('bg-[#00A89D]', pct === 3.5);
  document.getElementById('dpa35-btn').classList.toggle('text-white', pct === 3.5);
  document.getElementById('dpa5-btn').classList.toggle('bg-[#00A89D]', pct === 5);
  document.getElementById('dpa5-btn').classList.toggle('text-white', pct === 5);

  calculateAdvanced();
}

function autoSelectDPA() {
  const price = parseFloat(document.getElementById('homePrice').value) || 0;
  const loan = parseFloat(document.getElementById('loanAmountManual').value) || 0;
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
        autoSetFHA_MIP();   // Only runs when HomeNow is checked
    } else {
        pmiEl.value = '0.00';   // Always zero out when HomeNow is unchecked
    }
}

function calculateMonthlyPayment(principal, annualRate, years) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}


// Auto-set correct FHA MIP rate when HomeNow is checked
function autoSetFHA_MIP() {
    const pmiEl = document.getElementById('pmi');
    if (!pmiEl) return;

    const homePrice = parseFloat(document.getElementById('homePrice').value) || 0;
    const downPaymentInput = parseFloat(document.getElementById('downPayment').value) || 0;
    const isPercentMode = document.getElementById('dp-percent-btn').classList.contains('bg-gradient-to-r');

    if (homePrice <= 0) return;

    // Calculate LTV from whatever the user actually entered in the down payment box
    let downPercent = isPercentMode 
        ? downPaymentInput 
        : (downPaymentInput / homePrice * 100);

    const ltv = 1 - (downPercent / 100);

    let mipBps = 55;   // default

    if (ltv > 0.95) {
        mipBps = 55;   // >95% LTV = 0.55
    } else {
        mipBps = 50;   // ≤95% LTV = 0.50
    }

    pmiEl.value = (mipBps / 100).toFixed(2);
}


  // =====================================================
  // PUBLIC API EXPOSURE
  // =====================================================
  window.calculateAdvanced = calculateAdvanced;
  window.toggleHomeNow = toggleHomeNow;
  window.setDPA = setDPA;
  window.autoSelectDPA = autoSelectDPA;
  window.updatePMIRate = updatePMIRate;
  window.calculateMonthlyPayment = calculateMonthlyPayment;
  window.autoSetFHA_MIP = autoSetFHA_MIP;
  window.applyCalcPreset = applyCalcPreset;

  // =====================================================
  // INITIALIZATION (all listeners and startup inside ready to avoid race conditions)
  // =====================================================
  function initCalculator() {
    // Mode toggle listeners (purchase/refi)
    const purchaseBtn = document.getElementById('mode-purchase');
    const refiBtn = document.getElementById('mode-refinance');
    if (purchaseBtn) {
      purchaseBtn.addEventListener('click', () => {
        purchaseBtn.classList.add('bg-gradient-to-r', 'from-[#00A89D]', 'to-[#00A89D]/80', 'text-white', 'shadow-md');
        purchaseBtn.classList.remove('text-gray-700', 'dark:text-gray-300');
        if (refiBtn) {
          refiBtn.classList.remove('bg-gradient-to-r', 'from-[#00A89D]', 'to-[#00A89D]/80', 'text-white', 'shadow-md');
          refiBtn.classList.add('text-gray-700', 'dark:text-gray-300');
        }
        const purch = document.getElementById('purchase-inputs');
        const refi = document.getElementById('refinance-inputs');
        if (purch) purch.classList.remove('hidden');
        if (refi) refi.classList.add('hidden');
        const homenowW = document.getElementById('homenow-wrapper');
        if (homenowW) homenowW.classList.remove('hidden');
        calculateAdvanced();
      });
    }
    if (refiBtn) {
      refiBtn.addEventListener('click', () => {
        refiBtn.classList.add('bg-gradient-to-r', 'from-[#00A89D]', 'to-[#00A89D]/80', 'text-white', 'shadow-md');
        refiBtn.classList.remove('text-gray-700', 'dark:text-gray-300');
        if (purchaseBtn) {
          purchaseBtn.classList.remove('bg-gradient-to-r', 'from-[#00A89D]', 'to-[#00A89D]/80', 'text-white', 'shadow-md');
          purchaseBtn.classList.add('text-gray-700', 'dark:text-gray-300');
        }
        const purch = document.getElementById('purchase-inputs');
        const refi = document.getElementById('refinance-inputs');
        if (purch) purch.classList.add('hidden');
        if (refi) refi.classList.remove('hidden');
        const homenowW = document.getElementById('homenow-wrapper');
        if (homenowW) {
          homenowW.classList.add('hidden');
          const chk = document.getElementById('homenow-checkbox');
          if (chk) chk.checked = false;
        }
        calculateAdvanced();
      });
    }

    // DP % / $ toggle
    const pctBtn = document.getElementById('dp-percent-btn');
    const dolBtn = document.getElementById('dp-dollar-btn');
    if (pctBtn) {
      pctBtn.addEventListener('click', () => {
        pctBtn.classList.add('bg-gradient-to-r', 'from-[#00A89D]', 'to-[#00A89D]/80', 'text-white');
        pctBtn.classList.remove('bg-gray-300', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200');
        if (dolBtn) {
          dolBtn.classList.remove('bg-gradient-to-r', 'from-[#00A89D]', 'to-[#00A89D]/80', 'text-white');
          dolBtn.classList.add('bg-gray-300', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200');
        }
        const dp = document.getElementById('downPayment');
        if (dp) dp.placeholder = 'e.g., 20 for 20%';
        calculateAdvanced();
      });
    }
    if (dolBtn) {
      dolBtn.addEventListener('click', () => {
        dolBtn.classList.add('bg-gradient-to-r', 'from-[#00A89D]', 'to-[#00A89D]/80', 'text-white');
        dolBtn.classList.remove('bg-gray-300', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200');
        if (pctBtn) {
          pctBtn.classList.remove('bg-gradient-to-r', 'from-[#00A89D]', 'to-[#00A89D]/80', 'text-white');
          pctBtn.classList.add('bg-gray-300', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200');
        }
        const dp = document.getElementById('downPayment');
        if (dp) dp.placeholder = 'e.g., 75000';
        calculateAdvanced();
      });
    }

    // Auto-calc on inputs
    document.querySelectorAll('#calculator input, #calculator input[type="checkbox"]').forEach(el => {
      el.addEventListener('input', calculateAdvanced);
      el.addEventListener('change', calculateAdvanced);
    });

    // HomeNow checkbox (defensive)
    const hnChk = document.getElementById('homenow-checkbox');
    if (hnChk) {
      hnChk.addEventListener('change', toggleHomeNow);
    }

    // DPA buttons (defensive rebind)
    const d35 = document.getElementById('dpa35-btn');
    const d5 = document.getElementById('dpa5-btn');
    if (d35) d35.addEventListener('click', () => setDPA(3.5));
    if (d5) d5.addEventListener('click', () => setDPA(5));

    // Mode listeners for HomeNow wrapper visibility (already above but safe)
    if (purchaseBtn) {
      // already bound above
    }
    if (refiBtn) {
      refiBtn.addEventListener('click', () => {
        const hnW = document.getElementById('homenow-wrapper');
        if (hnW) hnW.classList.add('hidden');
        const chk = document.getElementById('homenow-checkbox');
        if (chk) {
          chk.checked = false;
          homeNowEnabled = false;
        }
        calculateAdvanced();
      });
    }

    // Initial state for calculator (safe defaults)
    // Default to Purchase + Percent mode
    if (purchaseBtn) {
      purchaseBtn.classList.add('bg-gradient-to-r', 'from-[#00A89D]', 'to-[#00A89D]/80', 'text-white', 'shadow-md');
      purchaseBtn.classList.remove('text-gray-700', 'dark:text-gray-300');
    }
    if (refiBtn) {
      refiBtn.classList.remove('bg-gradient-to-r', 'from-[#00A89D]', 'to-[#00A89D]/80', 'text-white', 'shadow-md');
      refiBtn.classList.add('text-gray-700', 'dark:text-gray-300');
    }
    const purchIn = document.getElementById('purchase-inputs');
    const refiIn = document.getElementById('refinance-inputs');
    if (purchIn) purchIn.classList.remove('hidden');
    if (refiIn) refiIn.classList.add('hidden');

    const pctB = document.getElementById('dp-percent-btn');
    const dolB = document.getElementById('dp-dollar-btn');
    if (pctB) {
      pctB.classList.add('bg-gradient-to-r', 'from-[#00A89D]', 'to-[#00A89D]/80', 'text-white');
      pctB.classList.remove('bg-gray-300', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200');
    }
    if (dolB) {
      dolB.classList.remove('bg-gradient-to-r', 'from-[#00A89D]', 'to-[#00A89D]/80', 'text-white');
      dolB.classList.add('bg-gray-300', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200');
    }
    const dpIn = document.getElementById('downPayment');
    if (dpIn) dpIn.placeholder = 'e.g., 20 for 20%';

    // Hide HomeNow by default (will show on purchase click, but since default purchase, show it)
    const hnW = document.getElementById('homenow-wrapper');
    if (hnW) hnW.classList.remove('hidden');

    // Initial calc
    calculateAdvanced();

    console.log('%c[calculator.js] Advanced Payment Calculator initialized (v2 polished)', 'color:#00A89D');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalculator);
  } else {
    initCalculator();
  }

  // Safety: re-calc if section becomes visible later (e.g. via showSection)
  setTimeout(() => {
    const calcSection = document.getElementById('calculator');
    if (calcSection && !calcSection.classList.contains('hidden') && typeof calculateAdvanced === 'function') {
      calculateAdvanced();
    }
  }, 300);

