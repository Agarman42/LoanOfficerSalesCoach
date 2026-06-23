/**
 * js/features/equity-scanner.js
 * Equity & Opportunity Scanner - fully extracted (Phase 1)
 *
 * Original functionality preserved 100%.
 * Self-initializes. Exposes necessary globals for any remaining inline handlers.
 */

(function () {
  'use strict';

  // =====================================================
  // CENTRAL PROFILE INTEGRATION (to match other polished tools)
  // =====================================================
  function getCentralProfile() {
    try {
      if (window.getUserProfile) return window.getUserProfile();
      return JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch (e) {
      return {};
    }
  }

  // =====================================================
  // ORIGINAL EQUITY SCANNER CODE BEGINS ===
  // (verbatim from the monolithic version, minus the outer <script> tags)


const CURRENT_DATE = new Date();

// Assign elements immediately (script is at end of body, DOM is ready)
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('database-upload');
const fileStatus = document.getElementById('file-status');
const fileNameDisplay = document.getElementById('file-name');

// Premium drag & drop + click upload wiring
if (uploadArea && fileInput) {
  uploadArea.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('border-[#00A89D]', 'bg-[#00A89D]/10');
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('border-[#00A89D]', 'bg-[#00A89D]/10');
  });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('border-[#00A89D]', 'bg-[#00A89D]/10');
    if (e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      const file = e.dataTransfer.files[0];
      if (fileNameDisplay) {
        fileNameDisplay.textContent = file.name;
        fileNameDisplay.classList.remove('hidden');
      }
      if (fileStatus) fileStatus.classList.remove('hidden');
    }
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file && fileNameDisplay) {
      fileNameDisplay.textContent = file.name;
      fileNameDisplay.classList.remove('hidden');
    }
    if (file && fileStatus) fileStatus.classList.remove('hidden');
  });
}

function syncRateControls() {
    const slider = document.getElementById('new-rate-slider');
    const input = document.getElementById('new-rate-input');

    if (!slider || !input) {
        console.warn('Rate slider or input not found');
        return;
    }

    const clamp = (val) => Math.max(3.0, Math.min(8.0, parseFloat(val) || 6.0));

    // Load persisted preferences (rate + mode) for continuity
    try {
        const savedRate = localStorage.getItem('equityLastRate');
        if (savedRate) {
            const r = parseFloat(savedRate);
            if (!isNaN(r) && r >= 3 && r <= 8) {
                slider.value = r;
                input.value = r.toFixed(3);
            }
        }
        const savedMode = localStorage.getItem('equitySavingsMode');
        if (savedMode === 'full' || savedMode === 'remaining') {
            savingsMode = savedMode;
        }
    } catch (e) {}

    // Initial sync
    let currentVal = clamp(slider.value);
    slider.value = currentVal;
    input.value = currentVal.toFixed(3);

    // Clone for clean reset (fixes any post-generate glitches)
    const freshSlider = slider.cloneNode(true);
    slider.parentNode.replaceChild(freshSlider, slider);

    // Real-time drag: Update input box only (lightweight = no glitch/lag)
    freshSlider.addEventListener('input', () => {
        input.value = parseFloat(freshSlider.value).toFixed(3);
    });

    // On release: Final sync + trigger live dashboard update
    freshSlider.addEventListener('change', () => {
        let val = parseFloat(freshSlider.value);
        input.value = val.toFixed(3);

        try { localStorage.setItem('equityLastRate', val); } catch (e) {}

        updateDashboardWithNewRate(val);

        console.log('Rate changed to:', val, '— recalculating savings...');

        // FIX: If in remaining term mode, force a second recalc after short delay
        if (savingsMode === 'remaining') {
            setTimeout(() => updateDashboardWithNewRate(val), 80);
        }

        // Force repaint (keeps smooth thumb movement)
        freshSlider.style.display = 'none';
        freshSlider.offsetHeight;
        freshSlider.style.display = '';
    });

    // Box typing: Update slider live
    input.addEventListener('input', () => {
        let val = clamp(input.value);
        freshSlider.value = val;
        input.value = val.toFixed(3);
    });

    // Box finish (blur/Enter): Trigger live dashboard update
    input.addEventListener('change', () => {
        let val = clamp(input.value);
        freshSlider.value = val;
        input.value = val.toFixed(3);

        try { localStorage.setItem('equityLastRate', val); } catch (e) {}

        updateDashboardWithNewRate(val);

        console.log('Rate changed to:', val, '— recalculating savings...');

        // FIX: If in remaining term mode, force a second recalc after short delay
        if (savingsMode === 'remaining') {
            setTimeout(() => updateDashboardWithNewRate(val), 80);
        }
    });
}

// Run immediately (script at end of body)
syncRateControls();
initSavingsModeToggle(); // safe no-op if toggle not present yet (appears after Generate)

// Savings Mode Toggle wiring (called on load + after dashboard is injected since toggle now lives in results)
function syncSavingsToggleVisual() {
    const thumb = document.getElementById('toggle-thumb');
    const toggleBtn = document.getElementById('savings-mode-toggle');
    const modeLabel = document.getElementById('mode-label');
    if (!thumb || !toggleBtn) return;

    if (savingsMode === 'full') {
        thumb.classList.remove('translate-x-7', 'translate-x-11', 'translate-x-1');
        thumb.classList.add('translate-x-0.5');
        toggleBtn.classList.remove('bg-orange-500');
        toggleBtn.classList.add('bg-[#00A89D]');
        // base gray classes stay; accent color class wins for bg
    } else {
        thumb.classList.remove('translate-x-0.5', 'translate-x-1', 'translate-x-11');
        thumb.classList.add('translate-x-7');
        toggleBtn.classList.remove('bg-[#00A89D]');
        toggleBtn.classList.add('bg-orange-500');
        // base gray classes stay; accent color class wins for bg
    }

    if (modeLabel) {
        modeLabel.textContent = savingsMode === 'full' ? 'Full Term Reset' : 'Remaining Term';
    }
}

function initSavingsModeToggle() {
    const savingsToggle = document.getElementById('savings-mode-toggle');
    if (!savingsToggle || savingsToggle.dataset.listenerAttached === 'true') return;
    savingsToggle.dataset.listenerAttached = 'true';

    savingsToggle.addEventListener('click', () => {
        savingsMode = savingsMode === 'full' ? 'remaining' : 'full';

        try { localStorage.setItem('equitySavingsMode', savingsMode); } catch (e) {}

        // update visuals immediately
        syncSavingsToggleVisual();

        const currentRate = parseFloat(
            document.getElementById('new-rate-input')?.value ||
            document.getElementById('new-rate-slider')?.value || '6.0'
        );

        updateDashboardWithNewRate(currentRate);

        // FIX: Force a second recalc after mode switch (especially critical for remaining term sync)
        setTimeout(() => updateDashboardWithNewRate(currentRate), 100);
    });

    // Set initial visual state to match current savingsMode
    syncSavingsToggleVisual();
}

// Helpers
function excelSerialToDate(serial) {
    if (!serial || isNaN(serial)) return null;
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400 * 1000;
    const date = new Date(utc_value);
    date.setUTCDate(date.getUTCDate() + 1);
    return date;
}

function monthsBetween(start) {
    if (!start) return 0;
    let months = (CURRENT_DATE.getFullYear() - start.getFullYear()) * 12 + (CURRENT_DATE.getMonth() - start.getMonth());
    if (CURRENT_DATE.getDate() < start.getDate()) months--;
    return Math.max(0, months);
}

function getTermMonths(program, termCol) {
    // Priority 1: Use TERM column if present and valid (it's in months, e.g., 120 for 10yr, 360 for 30yr)
    if (termCol && !isNaN(termCol) && termCol > 0) {
        return parseInt(termCol);
    }

    // Priority 2: Parse years from Loan Program string (robust for "10 Yr.", "15 Yr.", "30 Yr.", etc.)
    if (program) {
        const match = program.match(/(\d+)\s*[Yy]r\.?/i);  // Matches "10 Yr", "15 Yr.", "30 Yr." etc.
        if (match) {
            return parseInt(match[1]) * 12;
        }
    }

    // Safe default (30 years) if nothing matches
    return 360;
}

function pmt(ratePercent, nper, pv) {
    const rate = ratePercent / 100 / 12;
    if (rate === 0) return pv / nper;
    return pv * rate / (1 - Math.pow(1 + rate, -nper));
}

function remainingBalance(principal, ratePercent, totalMonths, monthsPaid) {
    if (monthsPaid >= totalMonths || principal <= 0) return 0;
    const monthlyRate = ratePercent / 100 / 12;
    const payment = pmt(ratePercent, totalMonths, principal);
    let balance = principal;
    for (let i = 0; i < monthsPaid; i++) {
        const interest = balance * monthlyRate;
        balance -= (payment - interest);
        if (balance <= 0) return 0;
    }
    return Math.round(balance);
}

function formatMoney(num) {
    num = parseFloat(num) || 0;
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
let savingsMode = 'full';  // 'full' = Full Term Reset (Option 2, default), 'remaining' = Remaining Term (Option 1)
// Generate Report
function generateEquityReport() {
    if (!fileInput || !fileInput.files.length) {
        alert('Please upload a file');
        return;
    }

    const file = fileInput.files[0];
    const loadingEl = document.getElementById('global-loading');
    const output = document.getElementById('equity-output');

    // === CUSTOM RICH PROGRESS MODAL (match premium style of Newsletter, Underwriting, Weekly Win, etc.) ===
    if (loadingEl) {
        loadingEl.dataset.originalContent = loadingEl.innerHTML;

        const customLoadingHTML = `
            <div class="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
                <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-3xl border border-gray-200 dark:border-gray-700">
                    
                    <div class="text-center mb-8">
                        <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00A89D] mb-5"></div>
                        <h3 class="text-3xl font-bold text-[#002B5C] dark:text-white mb-2 tracking-tight">
                            Scanning Your Database for Equity &amp; Opportunities...
                        </h3>
                        <p class="text-lg text-gray-700 dark:text-gray-300 mb-1">
                            This usually takes a few seconds for typical files.
                        </p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Parsing loans, calculating current equity (5% annual appreciation), refi savings, cash-out, move-up power, and PMI eligibility.
                        </p>
                    </div>

                    <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                        <h4 class="text-xl font-bold text-[#00A89D] mb-5 text-center">
                            While we crunch the numbers
                        </h4>
                        <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                            <div class="flex gap-3">
                                <i class="fas fa-home text-[#00A89D] mt-0.5"></i>
                                <div><strong>Equity Model:</strong> Home value grown at conservative 5% compounded annually since closing.</div>
                            </div>
                            <div class="flex gap-3">
                                <i class="fas fa-calculator text-[#00A89D] mt-0.5"></i>
                                <div><strong>Savings Calc:</strong> Current P&amp;I + MI vs. new loan at your selected rate (plus ~$4k costs).</div>
                            </div>
                            <div class="flex gap-3">
                                <i class="fas fa-chart-line text-[#002B5C] mt-0.5"></i>
                                <div><strong>Opportunity Flags:</strong> Refi ready (savings &gt;$100/mo), Cash-out (&gt;$50k), Move-up (&gt;$100k equity), PMI removal (LTV ≤80%).</div>
                            </div>
                        </div>

                        <div class="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p class="text-xs font-semibold text-[#00A89D] mb-2">Pro Tips:</p>
                            <ul class="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-5">
                                <li>Use the rate slider after results to instantly model different scenarios live.</li>
                                <li>Toggle "Remaining Term" vs "Full Term Reset" to compare realistic (shorter remaining) vs. full-term savings.</li>
                                <li>Filter by opportunity type or closing date to focus your outreach.</li>
                            </ul>
                        </div>
                    </div>

                    <p class="text-center text-xs text-gray-500 dark:text-gray-400 mt-5">
                        All calculations are client-side. Your data never leaves your browser.
                    </p>
                </div>
            </div>
        `;

        loadingEl.innerHTML = customLoadingHTML;
        loadingEl.classList.remove('hidden');
        loadingEl.style.setProperty('display', 'flex', 'important');
        loadingEl.style.setProperty('z-index', '99999', 'important');
        loadingEl.style.setProperty('visibility', 'visible', 'important');
        loadingEl.style.setProperty('opacity', '1', 'important');
        loadingEl.style.setProperty('position', 'fixed', 'important');
        loadingEl.style.setProperty('inset', '0', 'important');
    } else if (typeof window.forceShowGlobalLoading === 'function') {
        window.forceShowGlobalLoading('Scanning Your Database for Equity &amp; Opportunities...');
    }

    if (output) {
        output.classList.add('hidden');
        output.innerHTML = '';
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        let rawRows = [];
        try {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            const sheet = workbook.Sheets['Data'] || workbook.Sheets[workbook.SheetNames[0]];
            rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            const headers = rawRows[0] || [];
            const col = {};
            const map = {
                first: 'BORROWER FIRST NAME',
                last: 'Borrower Last Name',
                email: 'BORR EMAIL',
                phone: 'BORR HOME PHONE',
                address: 'Subject Property Address',
                city: 'Subject Property City',
                state: 'Subject Property State',
                zip: 'Subject Property Zip',
                closing: 'CLOSING DATE',
                program: 'Loan Program',
                amount: 'Loan Amount',
                rate: 'Note Rate',
                term: 'TERM',
                appraised: 'Appraised Value',
                purchase: 'SUBJECT PROPERTY PURCHASE PRICE',
                mi: 'Monthly Mortgage Insurance at closing',
                pi: 'Principal and Interest Payment',
                ltv: 'LTV',
                insurance: 'UNDERWRITING HAZARD INS',
                taxes: 'UNDERWRITING TAXES',
                agent: 'BUYERS AGENT CONTACT NAME',
                transactionType: 'Loan Purpose'
            };

            Object.keys(map).forEach(k => {
                col[k] = headers.findIndex(h => h && h.trim() === map[k]);
            });

            // Temporary array for all processed rows
const tempRows = [];

// First pass: Process all rows
for (let i = 1; i < rawRows.length; i++) {
    const r = rawRows[i];
    if (!r || r.length < 10) continue;

    const loanAmount = parseFloat(r[col.amount]) || 0;
    if (loanAmount === 0) continue;

    const closingDate = excelSerialToDate(r[col.closing]);
    if (!closingDate) continue;

    let baseValue = parseFloat(r[col.purchase]) || 0;
    if (baseValue === 0) baseValue = parseFloat(r[col.appraised]) || 0;
    if (baseValue === 0) continue;

    const years = (CURRENT_DATE - closingDate) / (365.25 * 24 * 60 * 60 * 1000);
    const yearsInHome = Math.round(years);
    const currentValue = Math.round(baseValue * Math.pow(1.05, years));

    const rate = parseFloat(r[col.rate]) || 0;
    const termMonths = getTermMonths(r[col.program], r[col.term]);
    const monthsPaid = monthsBetween(closingDate);
    const balance = remainingBalance(loanAmount, rate, termMonths, monthsPaid);

    const originalLTV = parseFloat(r[col.ltv]) || 0;
    const currentLTV = currentValue > 0 ? (balance / currentValue) * 100 : 0;
    const pmiEligible = originalLTV > 80 && currentLTV <= 80;

    const equity = currentValue - balance;
    const cashOut = Math.max(0, Math.round(currentValue * 0.80 - balance));
    const moveUp = Math.max(0, Math.round(currentValue * 0.95 - balance));

    const fullName = `${r[col.first] || ''} ${r[col.last] || ''}`.trim() || 'Unknown Client';
    const fullAddress = `${r[col.address] || ''}, ${r[col.city] || ''}, ${r[col.state] || ''} ${r[col.zip] || ''}`.trim();

    let originalPI = parseFloat(r[col.pi]) || 0;
    if (originalPI <= 0 && rate >= 0 && termMonths > 0 && loanAmount > 0) {
        originalPI = pmt(rate, termMonths, loanAmount);
    }

    const monthlyMI = parseFloat(r[col.mi]) || (originalLTV > 80 ? Math.round(loanAmount * 0.008 / 12) : 0);
    const monthlyInsurance = parseFloat(r[col.insurance]) || Math.round(baseValue * 0.0035 / 12);
    const monthlyTaxes = parseFloat(r[col.taxes]) || Math.round(baseValue * 0.011 / 12);

    tempRows.push({
        fullName,
        fullAddress,
        phone: r[col.phone] || '',
        email: r[col.email] || '',
        loanProgram: r[col.program] || 'N/A',
        closingDate: closingDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
        closingDateObj: closingDate,
        rate,
        termMonths,
        remainingMonths: Math.max(termMonths - monthsPaid, 0),
        estimatedBalance: balance,
        currentValue,
        equity,
        cashOut,
        moveUp,
        yearsInHome,
        originalPI,
        originalMI: monthlyMI,
        originalInsurance: monthlyInsurance,
        originalTaxes: monthlyTaxes,
        originalLTV,
        currentLTV,
        pmiEligible,
        buyersAgent: r[col.agent] || '',
        transactionType: (r[col.transactionType] || 'N/A').trim(),
        monthlySavings: 0,
        isRefiReady: false,
        isCashOut: cashOut > 30000,
        isMoveUpReady: yearsInHome >= 3 && moveUp > 50000
    });
}

// Normalize address for duplicate key (removes punctuation, standardizes spacing, strips units if present)
const normalizeAddress = (addr) => {
    if (!addr) return '';
    return addr
        .toLowerCase()
        .replace(/\./g, '')  // Remove periods (E. -> E)
        .replace(/,/g, '')   // Remove commas
        .replace(/\s+(apt|unit|#|ste|suite)\s*\w*/gi, '') // strip common unit/apt numbers
        .replace(/\s+/g, ' ') // Multiple spaces to single
        .trim();
};

// De-duplication: Keep only the *newest* loan per address.
// Older loans at the same address are previous mortgages that have been refinanced/paid off and are irrelevant.
const seen = new Map();
tempRows.forEach(row => {
    const key = normalizeAddress(row.fullAddress);
    const existing = seen.get(key);

    if (!existing || row.closingDateObj > existing.closingDateObj) {
        seen.set(key, row);
    }
});

// Final unique clients (newest loans only per address)
const clients = Array.from(seen.values());

window.currentOpportunities = clients;
buildDashboard();

const currentRate = parseFloat(document.getElementById('new-rate-input')?.value || 
                               document.getElementById('new-rate-slider')?.value || '6.0');
updateDashboardWithNewRate(currentRate);

        } catch (err) {
            console.error('Processing error:', err);
            if (output) {
                output.innerHTML = `<p class="text-red-600 text-center py-20 text-xl font-bold">Error processing file: ${err.message || 'Unknown error'}</p>`;
                output.classList.remove('hidden');
            }
        } finally {
            // Restore original loading content + hide
            const loadingElFinal = document.getElementById('global-loading');
            if (loadingElFinal && loadingElFinal.dataset.originalContent) {
                loadingElFinal.innerHTML = loadingElFinal.dataset.originalContent;
                delete loadingElFinal.dataset.originalContent;
            }
            if (typeof window.hideLoading === 'function') {
                window.hideLoading();
            } else if (loadingElFinal) {
                loadingElFinal.classList.add('hidden');
                loadingElFinal.style.setProperty('display', 'none', 'important');
            }
        }
    };

    reader.onerror = function() {
        if (output) {
            output.innerHTML = '<p class="text-red-600 text-center py-20 text-xl font-bold">Error reading file.</p>';
            output.classList.remove('hidden');
        }
        // Restore + hide
        const loadingElFinal = document.getElementById('global-loading');
        if (loadingElFinal && loadingElFinal.dataset.originalContent) {
            loadingElFinal.innerHTML = loadingElFinal.dataset.originalContent;
            delete loadingElFinal.dataset.originalContent;
        }
        if (typeof window.hideLoading === 'function') {
            window.hideLoading();
        } else if (loadingElFinal) {
            loadingElFinal.classList.add('hidden');
            loadingElFinal.style.setProperty('display', 'none', 'important');
        }
    };

    reader.readAsBinaryString(file);
}

// Dashboard - Updated to align initial savings with slider rate
function buildDashboard() {
    const opps = window.currentOpportunities || [];
    const output = document.getElementById('equity-output');
    if (!output) return;

    // Default rate; actual elements injected below so we init after
    let currentRate = 6.0;

    output.innerHTML = `
    <div class="max-w-7xl mx-auto">
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl mb-8 p-8 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00A89D]/10 to-transparent rounded-full -mr-8 -mt-8"></div>
            <button onclick="resetEquityTool()" class="absolute top-4 left-4 text-sm px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2">
                <i class="fas fa-redo"></i> <span>New Scan</span>
            </button>
            <!-- Savings Mode toggle at far right of dashboard, directly above its mode indicator text -->
            <div class="absolute top-3 right-4 text-right">
                <label class="block text-[10px] font-semibold text-[#002B5C] dark:text-[#00A89D] mb-0.5">Savings Mode</label>
                <button id="savings-mode-toggle" class="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-200 dark:bg-gray-700 border border-[#00A89D] px-0.5 focus:outline-none focus:ring-2 focus:ring-[#00A89D]/50 transition-all">
                    <span id="toggle-thumb" class="inline-block h-6 w-6 transform rounded-full bg-white shadow transition-all duration-200 ease-out translate-x-0.5"></span>
                </button>
                <div class="text-[10px] text-gray-500 leading-none mt-0.5">
                    <span id="mode-label" class="font-bold text-[#00A89D]">Full Term Reset</span>
                </div>
            </div>
            <div class="text-center pt-8">
                <h3 class="text-3xl font-bold text-[#002B5C] dark:text-white mb-1">Equity Opportunity Dashboard</h3>
                <p class="text-[#00A89D] font-medium">Analyzed <span class="font-bold">${opps.length}</span> clients from your database</p>
            </div>

            <!-- Live rate controls inside dashboard header (only visible after generate, matching savings toggle) -->
            <div class="mt-4 flex flex-col items-center w-full max-w-full">
              <div class="flex items-center gap-2">
                <label class="text-xs font-semibold text-[#002B5C] dark:text-[#00A89D]">New Refi Rate</label>
                <input 
                    id="new-rate-input" 
                    type="number" 
                    step="0.125" 
                    min="3.0" 
                    max="8.0" 
                    value="6.000" 
                    class="w-16 sm:w-20 p-1 text-center text-base sm:text-lg font-bold border border-[#00A89D] rounded-lg bg-white dark:bg-gray-800 text-[#00A89D] focus:outline-none focus:ring-2 focus:ring-[#00A89D]/30"
                >
                <span class="text-base sm:text-lg font-bold text-[#00A89D]">%</span>
              </div>
              <input 
                id="new-rate-slider" 
                type="range" 
                min="3.0" 
                max="8.0" 
                step="0.125" 
                value="6.0" 
                class="w-full max-w-[200px] sm:max-w-[240px] h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-[#00A89D] mt-1"
              >
              <div class="flex justify-between text-[7px] sm:text-[8px] text-gray-400 w-full max-w-[200px] sm:max-w-[240px] px-0.5 mt-0.5">
                <span>3.0%</span><span>8.0%</span>
              </div>
              <div class="text-[8px] sm:text-[9px] text-gray-400 mt-0.5">live — updates tiles &amp; modal instantly</div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div class="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 text-center">
                    <p class="text-4xl font-black text-[#00A89D]" id="count-refi">0</p>
                    <p class="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-1">Refi Ready</p>
                </div>
                <div class="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 text-center">
                    <p class="text-4xl font-black text-green-600" id="count-cash">0</p>
                    <p class="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-1">Cash-Out Goldmine</p>
                </div>
                <div class="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 text-center">
                    <p class="text-4xl font-black text-blue-600" id="count-move">0</p>
                    <p class="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-1">Move-Up Ready</p>
                </div>
                <div class="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 text-center">
                    <p class="text-4xl font-black text-purple-600" id="count-pmi">0</p>
                    <p class="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-1">PMI Removal</p>
                </div>
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-8">
            <div class="flex flex-wrap gap-x-6 gap-y-4 items-end">
                <div>
                    <label class="block text-xs font-semibold text-gray-500 mb-1">SORT BY</label>
                    <select id="sort-select" class="p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm">
                        <option value="savings">Highest Monthly Savings</option>
                        <option value="equity">Most Equity Built</option>
                        <option value="cash">Most Cash-Out Potential</option>
                        <option value="move">Most Move-Up Equity</option>
                        <option value="name">Name (A–Z)</option>
                    </select>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-500 mb-1">TRANSACTION</label>
                    <select id="filter-transaction-type" class="p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm">
                        <option value="All">All</option>
                        <option value="Purchase">Purchase</option>
                        <option value="Refinance">Refinance</option>
                    </select>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-500 mb-1">OPPORTUNITY TYPE</label>
                    <select id="filter-opportunity-type" class="p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm">
                        <option value="All">All Types</option>
                        <option value="Refi Ready">Refi Ready</option>
                        <option value="Cash-Out Goldmine">Cash-Out</option>
                        <option value="Move-Up Ready">Move-Up</option>
                        <option value="PMI Removal">PMI Removal</option>
                    </select>
                </div>

                <div class="flex gap-3">
                    <div>
                        <label class="block text-xs font-semibold text-gray-500 mb-1">CLOSED FROM</label>
                        <input type="date" id="filter-closing-from" class="p-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-500 mb-1">TO</label>
                        <input type="date" id="filter-closing-to" class="p-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm">
                    </div>
                </div>

                <div class="flex-1 min-w-[220px]">
                    <label class="block text-xs font-semibold text-gray-500 mb-1">SEARCH CLIENTS</label>
                    <input type="search" id="opportunity-search" placeholder="Name, address, phone..." class="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm">
                </div>
            </div>
        </div>

        <div class="flex flex-wrap justify-center gap-4 mb-8">
            <button onclick="copyDashboard()" class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#002B5C] text-white font-semibold shadow-lg hover:bg-black transition">
                <i class="fas fa-copy"></i> Copy All Data
            </button>
            <button onclick="saveFullReportToVault()" class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D] hover:text-white transition">
                <i class="far fa-bookmark"></i> Save Report to My Saved Items
            </button>
        </div>

        <div id="opportunity-cards" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-12"></div>
    </div>
`;

    output.classList.remove('hidden');

    // Rate controls are now inside the injected dashboard header (like the savings mode toggle)
    // so initialize the slider/input listeners here (static ones were removed)
    syncRateControls();

    const rateInputEl = document.getElementById('new-rate-input');
    currentRate = rateInputEl ? parseFloat(rateInputEl.value) || 6.0 : 6.0;

    // Now that dashboard (incl. savings toggle) is injected, wire up the toggle (far right)
    initSavingsModeToggle();

    // Recalculate savings/flags/counts consistently (respects toggle mode and Math.abs)
    updateDashboardWithNewRate(currentRate);

    renderCards(opps);
    attachSearchAndSort();
}
function updateDashboardWithNewRate(newRate) {
    const opps = window.currentOpportunities || [];
    if (opps.length === 0) return;

    // Determine the actual rate to use (priority: passed newRate > fallback to 6%)
    let marketRate;
    
    if (typeof newRate === 'number' && !isNaN(newRate) && newRate > 0) {
        marketRate = newRate;  // No /100 — pmt expects percent
    } else {
        const rateInput = document.getElementById('new-rate-input')?.value;
        const rateSlider = document.getElementById('new-rate-slider')?.value;
        
        const fallbackRate = parseFloat(rateInput || rateSlider || '6.0');
        marketRate = isNaN(fallbackRate) || fallbackRate <= 0 ? 6.0 : fallbackRate;
    }

    opps.forEach(opp => {
        const paddedBalance = (opp.estimatedBalance || 0) + 4000;
        let newPI = 0;

        const termToUse = savingsMode === 'full' 
            ? opp.termMonths 
            : (opp.remainingMonths || 0);

        if (termToUse > 0 && paddedBalance > 0 && marketRate > 0) {
            newPI = Math.abs(pmt(marketRate, termToUse, paddedBalance));
        }

        const newLTV = opp.currentValue > 0 ? (paddedBalance / opp.currentValue) * 100 : 100;
        const newMI = (newLTV > 80) ? (opp.originalMI || 0) : 0;

        let monthlySavings = (opp.originalPI + (opp.originalMI || 0)) - (newPI + newMI);
        monthlySavings = Math.max(0, Math.round(monthlySavings || 0));

        opp.monthlySavings = monthlySavings;

        const isRefiReady = monthlySavings > 100;
        const isCashOut = opp.cashOut > 50000;
        const isMoveUpReady = (opp.yearsInHome || 0) >= 3 && opp.moveUp > 100000;

        let primaryType = 'Standard Opportunity';
        if (isRefiReady) {
            primaryType = 'Refi Ready';
        } else if (isCashOut) {
            primaryType = 'Cash-Out Goldmine';
        } else if (isMoveUpReady) {
            primaryType = 'Move-Up Ready';
        }

        opp.isRefiReady = isRefiReady;
        opp.isCashOut = isCashOut;
        opp.isMoveUpReady = isMoveUpReady;
        opp.type = primaryType;

        opp.score = Math.round((monthlySavings / 5) + (opp.moveUp / 4000) + (opp.cashOut / 4000));
    });

    // Re-render tiles with updated data
    sortAndRenderCards();

    // Inline header counts update (uses the existing opps from top)
    if (opps.length > 0) {
        const refiReadyCount = opps.filter(opp => opp.isRefiReady).length;
        const cashOutCount = opps.filter(opp => opp.isCashOut).length;
        const moveUpCount = opps.filter(opp => opp.isMoveUpReady).length;
        const pmiCount = opps.filter(opp => opp.pmiEligible).length;

        document.getElementById('count-refi').textContent = refiReadyCount;
        document.getElementById('count-cash').textContent = cashOutCount;
        document.getElementById('count-move').textContent = moveUpCount;
        document.getElementById('count-pmi').textContent = pmiCount;

        // Polish: make count cards clickable to instantly filter the tiles
        const countFilters = [
            {id: 'count-refi', val: 'Refi Ready'},
            {id: 'count-cash', val: 'Cash-Out Goldmine'},
            {id: 'count-move', val: 'Move-Up Ready'},
            {id: 'count-pmi', val: 'PMI Removal'}
        ];
        countFilters.forEach(({id, val}) => {
            const p = document.getElementById(id);
            if (p) {
                const container = p.parentElement;
                container.style.cursor = 'pointer';
                container.onclick = (e) => {
                    e.stopPropagation();
                    const sel = document.getElementById('filter-opportunity-type');
                    if (sel) {
                        sel.value = val;
                        sel.dispatchEvent(new Event('change'));
                    }
                };
            }
        });
    }

    // Keep open modal comparison in sync when rate or mode changes (was previously only in legacy rate block)
    if (window.currentOpenClient) {
        updateRefiComparison(window.currentOpenClient);
    }
}

// Render Cards (badges, no fallback)
function renderCards(opps) {
    const container = document.getElementById('opportunity-cards');
    if (!container) return;
    container.innerHTML = '';

    opps.forEach(c => {
        const card = document.createElement('div');
        let leftAccent = 'border-l-4 border-transparent';
        if (c.isRefiReady) leftAccent = 'border-l-4 border-[#00A89D]';
        else if (c.isCashOut) leftAccent = 'border-l-4 border-green-600';
        else if (c.isMoveUpReady) leftAccent = 'border-l-4 border-blue-600';
        else if (c.pmiEligible) leftAccent = 'border-l-4 border-purple-600';
        card.className = `bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg p-4 sm:p-6 hover:shadow-2xl hover:border-[#00A89D] hover:-translate-y-0.5 transition-all group cursor-pointer relative overflow-hidden ${leftAccent}`;
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div class="flex-1 min-w-0 pr-2">
                    <h3 class="text-lg sm:text-xl font-bold text-[#002B5C] dark:text-white group-hover:text-[#00A89D] transition-colors truncate">${c.fullName}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">${c.fullAddress}</p>
                </div>
                <button class="save-opp-btn flex-shrink-0 ml-2 text-xs px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold flex items-center gap-1">
                    <i class="far fa-bookmark"></i> Save
                </button>
            </div>

            <div class="grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:text-sm mb-4">
                <div class="flex items-center"><i class="fas fa-home text-gray-400 w-4 mr-1.5"></i><span class="text-gray-500">Est. Value:</span> <span class="font-semibold ml-1">${formatMoney(c.currentValue)}</span></div>
                <div class="flex items-center"><i class="fas fa-wallet text-gray-400 w-4 mr-1.5"></i><span class="text-gray-500">Est. Balance:</span> <span class="font-semibold ml-1">${formatMoney(c.estimatedBalance)}</span></div>
                <div class="flex items-center"><i class="fas fa-piggy-bank text-[#00A89D] w-4 mr-1.5"></i><span class="text-gray-500">Equity:</span> <span class="font-bold text-[#00A89D] ml-1">${formatMoney(c.equity)}</span></div>
                <div class="flex items-center bg-green-50 dark:bg-green-900/20 -mx-1 px-1 py-0.5 rounded"><i class="fas fa-dollar-sign text-green-600 w-4 mr-1.5"></i><span class="text-gray-500">Savings/mo:</span> <span class="font-bold text-green-600 ml-1">${formatMoney(c.monthlySavings)}</span></div>
                ${c.cashOut > 50000 ? `<div class="col-span-2 flex items-center min-w-0"><i class="fas fa-hand-holding-usd text-green-600 w-4 mr-1.5 flex-shrink-0"></i><span class="text-gray-500 truncate">Cash-Out Potential:</span> <span class="font-bold text-green-600 text-xs sm:text-base ml-1 flex-shrink-0">${formatMoney(c.cashOut)}</span></div>` : ''}
                ${c.moveUp > 100000 ? `<div class="col-span-2 flex items-center min-w-0"><i class="fas fa-arrow-up text-blue-600 w-4 mr-1.5 flex-shrink-0"></i><span class="text-gray-500 truncate">Move-Up Equity:</span> <span class="font-bold text-blue-600 text-xs sm:text-base ml-1 flex-shrink-0">${formatMoney(c.moveUp)}</span></div>` : ''}
            </div>

            <div class="flex flex-wrap gap-1 sm:gap-2">
                ${c.isRefiReady ? '<span class="px-3 py-1 text-xs rounded-full text-white font-bold bg-[#00A89D]">Refi Ready</span>' : ''}
                ${c.isCashOut ? '<span class="px-3 py-1 text-xs rounded-full text-white font-bold bg-green-600">Cash-Out</span>' : ''}
                ${c.isMoveUpReady ? '<span class="px-3 py-1 text-xs rounded-full text-white font-bold bg-blue-600">Move-Up Ready</span>' : ''}
                ${c.pmiEligible ? '<span class="px-3 py-1 text-xs rounded-full text-white font-bold bg-purple-600">PMI Removal</span>' : ''}
            </div>

            <div class="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-[10px] sm:text-xs">
                <span class="text-gray-400 group-hover:text-[#00A89D] transition-colors flex items-center gap-1"><i class="fas fa-info-circle"></i> Click for full details &amp; scripts</span>
                <span class="text-[#00A89D]/70">→</span>
            </div>
        `;
        card.addEventListener('click', (e) => {
          console.log('[equity] Tile clicked for client:', c.fullName, 'target:', e.target.tagName, e.target.className);
          const fn = window.openDetailModal || openDetailModal;
          if (fn) {
            fn(c);
          } else {
            console.error('openDetailModal not available');
          }
        });

        const saveBtn = card.querySelector('.save-opp-btn');
        if (saveBtn) {
            saveBtn.onclick = (e) => {
                e.stopImmediatePropagation();
                const originalHTML = saveBtn.innerHTML;
                saveOpportunityToVault(c);
                saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved';
                saveBtn.disabled = true;
                setTimeout(() => {
                    if (saveBtn && saveBtn.parentNode) {
                        saveBtn.innerHTML = originalHTML;
                        saveBtn.disabled = false;
                    }
                }, 1600);
            };
        }

        container.appendChild(card);
    });
}
function sortAndRenderCards() {
    // Re-apply current UI filters + sort (so rate/mode tweaks don't nuke user's filter state)
    let filtered = window.currentOpportunities || [];

    const search = document.getElementById('opportunity-search');
    const sortSel = document.getElementById('sort-select');
    const filterTransaction = document.getElementById('filter-transaction-type');
    const filterOpportunity = document.getElementById('filter-opportunity-type');
    const filterFrom = document.getElementById('filter-closing-from');
    const filterTo = document.getElementById('filter-closing-to');

    // Search
    const term = (search?.value || '').toLowerCase();
    if (term) {
        filtered = filtered.filter(c =>
            (c.fullName || '').toLowerCase().includes(term) ||
            (c.fullAddress || '').toLowerCase().includes(term) ||
            (c.phone || '').includes(term) ||
            (c.email || '').toLowerCase().includes(term)
        );
    }

    // Transaction filter
    const transType = filterTransaction?.value || 'All';
    if (transType !== 'All') {
        if (transType === 'Purchase') {
            filtered = filtered.filter(c => c.transactionType && c.transactionType.toLowerCase().includes('purchase'));
        } else if (transType === 'Refinance') {
            filtered = filtered.filter(c => c.transactionType && c.transactionType.toLowerCase().includes('refinance'));
        }
    }

    // Opportunity type
    const oppType = filterOpportunity?.value || 'All';
    if (oppType !== 'All') {
        if (oppType === 'Refi Ready') filtered = filtered.filter(c => c.isRefiReady);
        else if (oppType === 'Cash-Out Goldmine') filtered = filtered.filter(c => c.isCashOut);
        else if (oppType === 'Move-Up Ready') filtered = filtered.filter(c => c.isMoveUpReady);
        else if (oppType === 'PMI Removal') filtered = filtered.filter(c => c.pmiEligible);
    }

    // Date range (simplified, same as attach)
    const fromDateStr = filterFrom?.value;
    const toDateStr = filterTo?.value;
    if (fromDateStr || toDateStr) {
        filtered = filtered.filter(c => {
            if (!c.closingDate) return false;
            const parts = c.closingDate.split('/');
            if (parts.length !== 3) return false;
            const clientDate = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
            if (isNaN(clientDate.getTime())) return false;
            if (fromDateStr) {
                const fromDate = new Date(fromDateStr);
                if (clientDate < fromDate) return false;
            }
            if (toDateStr) {
                const toDate = new Date(toDateStr);
                toDate.setHours(23, 59, 59, 999);
                if (clientDate > toDate) return false;
            }
            return true;
        });
    }

    // Sort (match attach)
    const val = sortSel?.value || 'savings';
    filtered.sort((a, b) => {
        if (val === 'savings') return b.monthlySavings - a.monthlySavings;
        if (val === 'equity') return b.equity - a.equity;
        if (val === 'cash') return b.cashOut - a.cashOut;
        if (val === 'move') return b.moveUp - a.moveUp;
        if (val === 'name') return a.fullName.localeCompare(b.fullName);
        return 0;
    });

    renderCards(filtered);
}
// Search & Sort
function attachSearchAndSort() {
    const search = document.getElementById('opportunity-search');
    const sort = document.getElementById('sort-select');
    const filterTransaction = document.getElementById('filter-transaction-type');
    const filterOpportunity = document.getElementById('filter-opportunity-type');
    const filterFrom = document.getElementById('filter-closing-from');
    const filterTo = document.getElementById('filter-closing-to');

    const refresh = () => {
        let list = window.currentOpportunities || [];

        // Search
        const term = search?.value.toLowerCase() || '';
        if (term) {
            list = list.filter(c => 
                c.fullName.toLowerCase().includes(term) ||
                c.fullAddress.toLowerCase().includes(term) ||
                (c.phone || '').includes(term) ||
                (c.email || '').toLowerCase().includes(term)
            );
        }

        // Transaction Type Filter (matches variations like "NoCash-Out Refinance", "Cash-Out Refinance")
        const transType = filterTransaction?.value || 'All';
        if (transType !== 'All') {
            if (transType === 'Purchase') {
                list = list.filter(c => c.transactionType && c.transactionType.toLowerCase().includes('purchase'));
            } else if (transType === 'Refinance') {
                list = list.filter(c => c.transactionType && c.transactionType.toLowerCase().includes('refinance'));
            }
        }

        // Opportunity Type Filter
        const oppType = filterOpportunity?.value || 'All';
        if (oppType !== 'All') {
            if (oppType === 'Refi Ready') list = list.filter(c => c.isRefiReady);
            else if (oppType === 'Cash-Out Goldmine') list = list.filter(c => c.isCashOut);
            else if (oppType === 'Move-Up Ready') list = list.filter(c => c.isMoveUpReady);
            else if (oppType === 'PMI Removal') list = list.filter(c => c.pmiEligible);
        }

        // Closing Date Range Filter (native calendar pickers)
        const fromDateStr = filterFrom?.value;
        const toDateStr = filterTo?.value;
        if (fromDateStr || toDateStr) {
            list = list.filter(c => {
                if (!c.closingDate) return false;
                const parts = c.closingDate.split('/');
                if (parts.length !== 3) return false;
                const clientDate = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
                if (isNaN(clientDate.getTime())) return false;

                if (fromDateStr) {
                    const fromDate = new Date(fromDateStr);
                    if (clientDate < fromDate) return false;
                }
                if (toDateStr) {
                    const toDate = new Date(toDateStr);
                    toDate.setHours(23, 59, 59, 999);  // Include full end day
                    if (clientDate > toDate) return false;
                }
                return true;
            });
        }

        // Sort
        const val = sort?.value || 'savings';
        list.sort((a, b) => {
            if (val === 'savings') return b.monthlySavings - a.monthlySavings;
            if (val === 'equity') return b.equity - a.equity;
            if (val === 'cash') return b.cashOut - a.cashOut;
            if (val === 'move') return b.moveUp - a.moveUp;
            if (val === 'name') return a.fullName.localeCompare(b.fullName);
            return 0;
        });

        renderCards(list);
    };

    // Listeners
    if (search) search.addEventListener('input', refresh);
    if (sort) sort.addEventListener('change', refresh);
    if (filterTransaction) filterTransaction.addEventListener('change', refresh);
    if (filterOpportunity) filterOpportunity.addEventListener('change', refresh);
    if (filterFrom) filterFrom.addEventListener('change', refresh);
    if (filterTo) filterTo.addEventListener('change', refresh);

    refresh();  // Initial render
}

// Dual Refi Comparison
function updateRefiComparison(client) {
    if (!client) return;

    const newRate = parseFloat(document.getElementById('new-rate-input')?.value || document.getElementById('new-rate-slider')?.value) || 6.0;
    const balance = client.estimatedBalance;
    const value = client.currentValue;
    const currentPI = client.originalPI;
    const currentMI = client.originalMI;

    let remainingMonths = client.termMonths;
    if (client.closingDate) {
        const parts = client.closingDate.split('/');
        if (parts.length === 3) {
            const closingDateObj = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
            if (!isNaN(closingDateObj.getTime())) {
                const monthsPassed = monthsBetween(closingDateObj);
                remainingMonths = Math.max(client.termMonths - monthsPassed, 0);
            }
        }
    }

    const paddedBalance = balance + 4000;
    const currentLTV = value > 0 ? ((balance / value) * 100).toFixed(2) : 'N/A';

    // Use Math.abs to ensure positive payment values (consistent with dashboard)
    const newPIOpt1 = remainingMonths <= 0 ? 0 : Math.abs(pmt(newRate, remainingMonths, paddedBalance));
    const newMIOpt1 = currentMI;  // MI removal logic is already in dashboard; keep simple for modal (or add LTV check if desired)

    const newPIOpt2 = Math.abs(pmt(newRate, client.termMonths, paddedBalance));

    const savingsOpt1 = Math.max(0, Math.round(currentPI + currentMI - newPIOpt1 - newMIOpt1));
    const savingsOpt2 = Math.max(0, Math.round(currentPI + currentMI - newPIOpt2 - newMIOpt1));

    // Format values for the note
    const balanceFormatted = formatMoney(balance);
    const currentPIFormatted = formatMoney(currentPI);

    const note1 = `Savings calculated as: Current P&I (${currentPIFormatted}) - New P&I (${formatMoney(newPIOpt1)}) based on current balance (${balanceFormatted}), assuming $4,000 added for closing costs, new rate (${newRate.toFixed(3)}%), and remaining term (${remainingMonths} months).`;

    const note2 = `Savings calculated as: Current P&I (${currentPIFormatted}) - New P&I (${formatMoney(newPIOpt2)}) based on current balance (${balanceFormatted}), assuming $4,000 added for closing costs, new rate (${newRate.toFixed(3)}%), and reset to original term (${client.termMonths} months).`;

    const gridEl = document.getElementById('refi-comparison-grid');
    if (gridEl) {
        gridEl.innerHTML = `
        <div class="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-300 dark:border-gray-600">
            <div class="flex items-center gap-2">
                <i class="fas fa-clock text-[#00A89D]"></i>
                <h5 class="text-2xl font-extrabold text-[#002B5C] dark:text-[#00A89D]">Option 1: Keep Remaining Term (~${remainingMonths} months)</h5>
            </div>
            <p class="text-lg"><span class="text-gray-500">Current Est. LTV:</span> <span class="font-bold text-blue-600 text-xl">${currentLTV}%</span></p>
            <p class="text-lg"><span class="text-gray-500">Current P&I:</span> <span class="text-xl font-bold">${formatMoney(currentPI)}</span></p>
            <p class="text-lg"><span class="text-gray-500">New P&I @ ${newRate.toFixed(3)}%:</span> <span class="text-xl font-bold text-green-600">${formatMoney(newPIOpt1)}</span></p>
            <p class="text-lg"><span class="text-gray-500">Monthly Savings:</span> <span class="text-2xl font-extrabold text-green-600">${formatMoney(savingsOpt1)}</span></p>
            <p class="text-sm text-gray-500 italic mt-4">${note1}</p>
        </div>

        <div class="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-300 dark:border-gray-600">
            <div class="flex items-center gap-2">
                <i class="fas fa-sync-alt text-[#00A89D]"></i>
                <h5 class="text-2xl font-extrabold text-[#002B5C] dark:text-[#00A89D]">Option 2: Reset to Original Term (${client.termMonths} months)</h5>
            </div>
            <p class="text-lg"><span class="text-gray-500">Current Est. LTV:</span> <span class="font-bold text-blue-600 text-xl">${currentLTV}%</span></p>
            <p class="text-lg"><span class="text-gray-500">Current P&I:</span> <span class="text-xl font-bold">${formatMoney(currentPI)}</span></p>
            <p class="text-lg"><span class="text-gray-500">New P&I @ ${newRate.toFixed(3)}%:</span> <span class="text-xl font-bold text-green-600">${formatMoney(newPIOpt2)}</span></p>
            <p class="text-lg"><span class="text-gray-500">Monthly Savings:</span> <span class="text-2xl font-extrabold text-green-600">${formatMoney(savingsOpt2)}</span></p>
            <p class="text-sm text-gray-500 italic mt-4">${note2}</p>
        </div>
    `;
    }
}
// Open Modal
function openDetailModal(client) {
    window.currentOpenClient = client;
    window.currentClientForModal = client; // for vault save from modal

    const nameEl = document.getElementById('modal-client-name');
    if (nameEl) nameEl.textContent = client.fullName || 'N/A';
    const addrEl = document.getElementById('modal-address');
    if (addrEl) addrEl.textContent = client.fullAddress || 'N/A';

    const phoneLink = document.getElementById('modal-phone-link');
    const phoneNa = document.getElementById('modal-phone-na');
    if (phoneLink && phoneNa) {
        if (client.phone) {
            phoneLink.href = 'tel:' + client.phone.replace(/\D/g, '');
            phoneLink.textContent = client.phone;
            phoneNa.classList.add('hidden');
        } else {
            phoneNa.classList.remove('hidden');
        }
    }

    const emailLink = document.getElementById('modal-email-link');
    const emailNa = document.getElementById('modal-email-na');
    if (emailLink && emailNa) {
        if (client.email) {
            emailLink.href = 'mailto:' + client.email;
            emailLink.textContent = client.email;
            emailNa.classList.add('hidden');
        } else {
            emailNa.classList.remove('hidden');
        }
    }

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText('modal-program', client.loanProgram || 'N/A');
    setText('modal-closing-date', client.closingDate || 'N/A');
    setText('modal-current-rate', client.rate.toFixed(3) + '%');
    setText('modal-term', Math.round(client.termMonths / 12) + ' years');
    setText('modal-original-ltv', client.originalLTV.toFixed(2) + '%');
    setText('modal-balance', formatMoney(client.estimatedBalance));
    setText('modal-value', formatMoney(client.currentValue));
    setText('modal-original-pi', formatMoney(client.originalPI));
    setText('modal-original-mi', formatMoney(client.originalMI));
    setText('modal-original-insurance', formatMoney(client.originalInsurance));
    setText('modal-original-taxes', formatMoney(client.originalTaxes));
    
    const pmiEl = document.getElementById('modal-pmi-alert');
    if (pmiEl) pmiEl.style.display = client.pmiEligible ? 'flex' : 'none';

    const agentSection = document.getElementById('modal-buyers-agent-section');
    if (agentSection) agentSection.style.display = client.buyersAgent ? 'block' : 'none';
    const buyersAgentEl = document.getElementById('modal-buyers-agent');
    if (client.buyersAgent && buyersAgentEl) buyersAgentEl.textContent = client.buyersAgent;

    const transTypeEl = document.getElementById('modal-transaction-type');
    if (transTypeEl) transTypeEl.textContent = client.transactionType || 'N/A';

    const types = [];
    if (client.monthlySavings > 100) types.push('Refi Ready');
    if (client.cashOut > 50000) types.push('Cash-Out');
    if (client.moveUp > 100000) types.push('Move-Up Ready');
    if (client.pmiEligible) types.push('PMI Removal');

    const badgeColorMap = {
      'Refi Ready': 'bg-[#00A89D]',
      'Cash-Out': 'bg-green-600',
      'Move-Up Ready': 'bg-blue-600',
      'PMI Removal': 'bg-purple-600'
    };
    const typeBadgeEl = document.getElementById('modal-type-badge');
    if (typeBadgeEl) {
      typeBadgeEl.innerHTML = types.length ? types.map(t => `<span class="${badgeColorMap[t] || 'bg-[#00A89D]'} text-white px-4 py-2 rounded-full mr-2">${t}</span>`).join('') : '';
    }

    updateRefiComparison(client);

    let scriptContent = '';
    const profile = getCentralProfile();
    const userFirst = (profile.name || '').split(' ')[0] || 'there';
    const firstName = client.fullName.split(' ')[0] || 'there';
    const refiSavings = client.savingsOpt2 || 0;

    if (refiSavings > 50) {
        scriptContent = `Hi ${firstName},\n\nHope you're doing great! Quick update — with current rates, we could **save you approximately $${Math.round(refiSavings)} per month** on your mortgage`;
        if (client.pmiEligible && client.originalMI > 0) {
            scriptContent += `, **including removing your $${Math.round(client.originalMI)} monthly PMI** since your equity has grown significantly.`;
        }
        scriptContent += `\n\nThis is one of the strongest opportunities I've seen for you right now. No pressure — just wanted to offer a free review and see if this makes sense for your goals.\n\nWhen's a good time for a quick chat?\n\nBest,\n${userFirst}`;
    } else if (client.cashOut > 50000) {
        scriptContent = `Hi ${firstName},\n\nYour home has built up **$${Math.round(client.cashOut)} in potential cash-out equity** — perfect for home improvements, debt consolidation, or any big plans you have.\n\nWith rates where they are, this could be a great time to access that equity. Interested in exploring your options?\n\nBest,\n${userFirst}`;
    } else if (client.moveUp > 100000) {
        scriptContent = `Hi ${firstName},\n\nWith **$${Math.round(client.moveUp)} in equity**, you're in a fantastic position to move up to your next dream home with a strong down payment.\n\nI'd love to help you explore what's possible in today's market. When can we chat?\n\nBest,\n${userFirst}`;
    } else {
        scriptContent = `Hi ${firstName},\n\nJust checking in on your loan from ${client.closingDate}. Your home has built solid equity since then — wanted to see if there's anything we can do to improve your situation or prepare for your next steps.\n\nNo rush — just let me know if you'd like a quick review!\n\nBest,\n${userFirst}`;
    }

        const scriptsSection = document.getElementById('modal-scripts');
    if (scriptsSection) {
        scriptsSection.innerHTML = `
            <div class="mt-12 p-8 bg-gradient-to-br from-[#00A89D]/10 to-[#00A89D]/10 rounded-2xl">
                <div class="flex justify-between items-center mb-6">
                    <h4 class="text-2xl font-bold text-[#002B5C] dark:text-[#00A89D]">Personalized Outreach Script</h4>
                    <div class="flex gap-3">
                        <button id="copy-script-btn" class="bg-[#00A89D] hover:bg-[#00887A] text-white px-6 py-3 rounded-full font-bold flex items-center gap-3 shadow-lg transition-all">
                            <i class="fas fa-copy"></i> Copy Script
                        </button>
                        <button onclick="saveOpportunityToVault(window.currentClientForModal)" class="bg-[#002B5C] hover:bg-black text-white px-6 py-3 rounded-full font-bold flex items-center gap-3 shadow-lg transition-all">
                            <i class="far fa-bookmark"></i> Save to My Saved Items
                        </button>
                        <button id="ai-enhance-script-btn" class="bg-gradient-to-r from-[#002B5C] to-[#00A89D] text-white px-5 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg transition-all text-sm">
                            <i class="fas fa-magic"></i> Enhance with AI
                        </button>
                    </div>
                </div>
                <div id="script-content" class="whitespace-pre-wrap text-lg bg-gray-50 dark:bg-gray-900 p-6 rounded-xl">${scriptContent}</div>
            </div>

            <div class="mt-8 p-4 bg-gradient-to-br from-[#00A89D]/5 to-[#00A89D]/5 rounded-xl text-sm">
                <h4 class="text-lg font-bold mb-3 text-[#002B5C] dark:text-[#00A89D]">Calculation Key</h4>
                <ul class="space-y-2 text-gray-700 dark:text-gray-300">
                    <li>• <strong>Direct from file:</strong> Rate, P&I, MI, insurance, taxes, closing date, value, contacts</li>
                    <li>• <strong>Home Value:</strong> Starting value × 5% annual compounded appreciation</li>
                    <li>• <strong>Balance:</strong> Amortized from original terms</li>
                    <li>• <strong>Cash-Out:</strong> 80% of value − balance</li>
                    <li>• <strong>Move-Up:</strong> 95% of value (net selling costs) − balance</li>
                    <li>• <strong>Savings:</strong> Current P&I + MI vs new loan @ selected rate (+$4k costs)</li>
                </ul>
            </div>
        `;

        // Copy button functionality with success feedback
        const copyBtn = document.getElementById('copy-script-btn');
        const scriptText = document.getElementById('script-content');
        if (copyBtn && scriptText) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(scriptText.textContent).then(() => {
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    copyBtn.classList.remove('bg-[#00A89D]', 'hover:bg-[#00887A]');
                    copyBtn.classList.add('bg-green-600');
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Script';
                        copyBtn.classList.remove('bg-green-600');
                        copyBtn.classList.add('bg-[#00A89D]', 'hover:bg-[#00887A]');
                    }, 2000);
                }).catch(() => {
                    alert('Copy failed — please select and copy manually');
                });
            });
        }

        // AI Enhance button (restored per user preference - liked this feature)
        const aiBtn = document.getElementById('ai-enhance-script-btn');
        if (aiBtn && scriptText) {
            aiBtn.addEventListener('click', async () => {
                const profile = getCentralProfile();
                const origText = scriptText.textContent;
                aiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enhancing...';
                aiBtn.disabled = true;

                // Pull agent voice/profile so the enhanced message matches how *this* agent speaks (consistent with sales scripts, social, blog, etc.)
                const loVoice = [
                    profile.personality ? `Personality: ${profile.personality}` : '',
                    (profile.voiceTraits && profile.voiceTraits.length) ? `Voice traits: ${profile.voiceTraits.join(', ')}` : '',
                    profile.tone ? `Preferred tone: ${profile.tone}` : '',
                    profile.hobbies && profile.hobbies.length ? `Hobbies (use for natural warmth): ${profile.hobbies.slice(0,3).join(', ')}` : ''
                ].filter(Boolean).join('. ');

                try {
                    const enhancePrompt = `You are an expert real estate advisor known for warm, authentic, non-salesy communication that builds real relationships.

AGENT PROFILE & VOICE (match this exact style and personality — make it sound like this specific person wrote it):
- Name: ${profile.name || 'the agent'}
${loVoice ? loVoice + '\n' : ''}

Client details:
- Name: ${client.fullName}
- Opportunity: ${types.join(', ') || 'General follow-up'}
- Key numbers: Equity ~$${Math.round(client.currentValue - client.estimatedBalance)}, Monthly savings potential ~$${client.monthlySavings}, Cash-out ~$${Math.round(client.cashOut)}

Original script:
${origText}

Rewrite this as a warmer, more personalized, relationship-first outreach message. Keep it under 120 words. Match the agent's natural voice from the profile above (helpful, low-pressure, focused on the client's goals, weave personality/hobbies if it fits naturally). End with a soft, easy next step. Do not add specific rate or price promises. Just the message body.`;

                    const enhanced = await window.callGrokAPI(enhancePrompt, { temperature: 0.7, max_tokens: 400 });
                    scriptText.textContent = enhanced.trim();
                    aiBtn.innerHTML = '<i class="fas fa-magic"></i> Enhanced!';
                    setTimeout(() => {
                        if (aiBtn) {
                            aiBtn.innerHTML = '<i class="fas fa-magic"></i> Enhance with AI';
                            aiBtn.disabled = false;
                        }
                    }, 1800);
                } catch (e) {
                    console.error(e);
                    alert('AI enhance failed — using original.');
                    aiBtn.innerHTML = '<i class="fas fa-magic"></i> Enhance with AI';
                    aiBtn.disabled = false;
                }
            });
        }
    }

    // Force the equity modal (prefer it over the generic detail-modal which has different content)
    const equityModal = document.getElementById('equity-detail-modal');
    const detailModal = document.getElementById('detail-modal');
    if (equityModal) {
        equityModal.style.display = 'flex';
        equityModal.classList.remove('hidden');
    }
    if (detailModal) {
        detailModal.style.display = 'none';
        detailModal.classList.add('hidden');
    }
}

function closeDetailModal() {
    const equityModal = document.getElementById('equity-detail-modal');
    if (equityModal) {
        equityModal.style.display = 'none';
        equityModal.classList.add('hidden');
    }
    const detailModal = document.getElementById('detail-modal');
    if (detailModal) {
        detailModal.style.display = 'none';
        detailModal.classList.add('hidden');
    }
}

function copyDashboard() {
    const opps = window.currentOpportunities || [];
    if (opps.length === 0) return alert('No data');
    let text = 'Name\tAddress\tPhone\tEmail\tSavings\tCash-Out\tMove-Up\tValue\tBalance\n';
    opps.forEach(o => text += `${o.fullName}\t${o.fullAddress}\t${o.phone}\t${o.email}\t${o.monthlySavings}\t${o.cashOut}\t${o.moveUp}\t${o.currentValue}\t${o.estimatedBalance}\n`);
    navigator.clipboard.writeText(text).then(() => alert('Copied!'));
}

function resetEquityTool() {
    document.getElementById('equity-output')?.classList.add('hidden');
    fileInput.value = '';
    window.currentOpportunities = null;
}

// Demo data for pre-report polish / testing (realistic numbers, client-side only)
function loadDemoEquityData() {
    const demoClients = [
        { fullName: "Sarah Thompson", fullAddress: "142 Oak Lane, Austin, TX 78701", phone: "(512) 555-0142", email: "sarah.t@email.com", loanProgram: "30 Yr Fixed", closingDate: "2019-03-15", rate: 4.25, termMonths: 360, remainingMonths: 240, estimatedBalance: 248500, currentValue: 412000, equity: 163500, cashOut: 81200, moveUp: 142900, yearsInHome: 5, originalPI: 1680, originalMI: 0, originalInsurance: 142, originalTaxes: 385, originalLTV: 78.5, currentLTV: 60.3, pmiEligible: false, buyersAgent: "", transactionType: "Refinance", monthlySavings: 285, isRefiReady: true, isCashOut: true, isMoveUpReady: true },
        { fullName: "Marcus Chen", fullAddress: "88 Pine Street, Denver, CO 80203", phone: "(303) 555-0198", email: "mchen@workmail.com", loanProgram: "15 Yr Fixed", closingDate: "2021-08-22", rate: 3.1, termMonths: 180, remainingMonths: 95, estimatedBalance: 187200, currentValue: 295000, equity: 107800, cashOut: 48800, moveUp: 92750, yearsInHome: 3, originalPI: 1425, originalMI: 95, originalInsurance: 98, originalTaxes: 265, originalLTV: 82.4, currentLTV: 63.5, pmiEligible: true, buyersAgent: "Lisa Rivera", transactionType: "Purchase", monthlySavings: 192, isRefiReady: true, isCashOut: false, isMoveUpReady: true },
        { fullName: "Elena Rodriguez", fullAddress: "215 Maple Ave, Phoenix, AZ 85004", phone: "(602) 555-0234", email: "elena.r@family.net", loanProgram: "30 Yr Fixed", closingDate: "2018-11-05", rate: 4.75, termMonths: 360, remainingMonths: 195, estimatedBalance: 312800, currentValue: 478000, equity: 165200, cashOut: 69500, moveUp: 141100, yearsInHome: 6, originalPI: 1895, originalMI: 210, originalInsurance: 165, originalTaxes: 410, originalLTV: 89.2, currentLTV: 65.4, pmiEligible: true, buyersAgent: "", transactionType: "Refinance", monthlySavings: 340, isRefiReady: true, isCashOut: true, isMoveUpReady: true }
    ];
    window.currentOpportunities = demoClients;
    const output = document.getElementById('equity-output');
    if (output) {
        output.innerHTML = `<div class="max-w-7xl mx-auto"><div class="text-center text-sm text-amber-600 mb-3">Demo data loaded (3 sample clients). All numbers are simulated for illustration.</div></div>`;
    }
    buildDashboard();
    const currentRate = parseFloat(document.getElementById('new-rate-input')?.value || document.getElementById('new-rate-slider')?.value || '6.0');
    updateDashboardWithNewRate(currentRate);
    renderCards(demoClients);
    attachSearchAndSort();
    // No toast for demo load — the inline note in output is sufficient and less intrusive
}

function saveOpportunityToVault(client) {
    if (!client || typeof window.toggleSaveIdea !== 'function') {
        alert('Unable to save — vault not ready or no client data.');
        return;
    }

    const profile = getCentralProfile();
    const userName = profile.name ? profile.name.split(' ')[0] : '[Your Name]';

    const title = `Equity Opportunity: ${client.fullName} — ${client.fullAddress.substring(0, 40)}`;
    const equityNum = Math.round(client.currentValue - client.estimatedBalance);
    const oppTypes = [];
    if (client.monthlySavings > 100) oppTypes.push('Refi Ready');
    if (client.cashOut > 50000) oppTypes.push('Cash-Out');
    if (client.moveUp > 100000) oppTypes.push('Move-Up Ready');
    if (client.pmiEligible) oppTypes.push('PMI Removal');

    let content = `
<div class="equity-saved">
  <div class="mb-3">
    <strong class="text-lg">${client.fullName}</strong><br>
    <span class="text-sm text-gray-600 dark:text-gray-400">${client.fullAddress}</span>
  </div>
  <div class="text-sm mb-3">
    <span class="text-gray-500">Phone:</span> <strong>${client.phone || 'N/A'}</strong> &nbsp;|&nbsp; 
    <span class="text-gray-500">Email:</span> <strong>${client.email || 'N/A'}</strong>
  </div>
  <div class="mb-3">
    <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Opportunity Types</span><br>
    <span class="font-medium">${oppTypes.length ? oppTypes.join(' • ') : 'General follow-up'}</span>
  </div>
  <div class="grid grid-cols-2 gap-2 text-sm mb-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl">
    <div><span class="text-gray-500">Est. Equity:</span> <strong class="text-[#00A89D]">$${equityNum.toLocaleString()}</strong></div>
    <div><span class="text-gray-500">Monthly Savings:</span> <strong class="text-green-600">$${client.monthlySavings}</strong></div>
    <div><span class="text-gray-500">Cash-Out Potential:</span> <strong>$${Math.round(client.cashOut).toLocaleString()}</strong></div>
    <div><span class="text-gray-500">Move-Up Equity:</span> <strong>$${Math.round(client.moveUp).toLocaleString()}</strong></div>
  </div>
  <div class="mb-3">
    <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Suggested Script</span>
    <div class="mt-1 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm whitespace-pre-wrap font-sans leading-snug">${document.getElementById('script-content') ? document.getElementById('script-content').textContent : 'See detail modal for script.'}</div>
  </div>
  <div class="text-xs text-gray-500">Generated for ${userName} • All calcs client-side using current rate/mode assumptions. Verify with latest data.</div>
</div>`;

    window.toggleSaveIdea(title, content, null, 'equity-opportunity');

    if (window.showToast) {
        window.showToast('Opportunity saved to My Saved Items!', 'success');
    } else {
        alert('Saved to My Saved Items');
    }
}

function saveFullReportToVault() {
    const opps = window.currentOpportunities || [];
    if (opps.length === 0 || typeof window.toggleSaveIdea !== 'function') {
        alert('No report to save or vault not ready.');
        return;
    }

    const profile = getCentralProfile();
    const userName = profile.name ? profile.name.split(' ')[0] : '[Your Name]';

    const title = `Full Equity Scan — ${opps.length} Opportunities`;
    const counts = { refi: 0, cash: 0, move: 0, pmi: 0 };
    opps.forEach(o => {
        if (o.monthlySavings > 100) counts.refi++;
        if (o.cashOut > 50000) counts.cash++;
        if (o.moveUp > 100000) counts.move++;
        if (o.pmiEligible) counts.pmi++;
    });

    let topList = opps.slice(0, 5).map((o, i) => {
      const eq = Math.round(o.currentValue - o.estimatedBalance);
      return `<li>${i+1}. <strong>${o.fullName}</strong> — Equity ~$${eq.toLocaleString()}, Savings $${o.monthlySavings}/mo</li>`;
    }).join('');

    let content = `
<div class="equity-saved">
  <div class="mb-3">
    <strong class="text-lg">Full Equity Scan</strong><br>
    <span class="text-sm">Analyzed ${opps.length} clients • Generated for ${userName}</span>
  </div>
  <div class="mb-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl text-sm">
    <div class="font-semibold mb-1">Opportunities Found</div>
    <div class="grid grid-cols-2 gap-x-4 text-xs">
      <div>Refi Ready: <strong>${counts.refi}</strong></div>
      <div>Cash-Out: <strong>${counts.cash}</strong></div>
      <div>Move-Up Ready: <strong>${counts.move}</strong></div>
      <div>PMI Removal: <strong>${counts.pmi}</strong></div>
    </div>
  </div>
  <div class="mb-3">
    <div class="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Top Opportunities</div>
    <ul class="text-sm list-decimal pl-4 space-y-0.5">${topList || '<li>No opportunities</li>'}</ul>
  </div>
  <div class="text-xs text-gray-500">Full interactive dashboard available in the Equity Scanner. Use filters and rate slider for what-if modeling. All calcs use 5% annual appreciation model + $4k costs.</div>
</div>`;

    window.toggleSaveIdea(title, content, null, 'equity-scan');

    if (window.showToast) {
        window.showToast('Full report saved to My Saved Items!', 'success');
    } else {
        alert('Saved to My Saved Items');
    }
}


  // === ORIGINAL EQUITY SCANNER CODE ENDS ===

  // Expose functions that may be referenced from HTML onclick or other modules
  if (typeof openDetailModal === 'function') window.openDetailModal = openDetailModal;
  if (typeof saveOpportunityToVault === 'function') window.saveOpportunityToVault = saveOpportunityToVault;
  if (typeof saveFullReportToVault === 'function') window.saveFullReportToVault = saveFullReportToVault;
  if (typeof copyDashboard === 'function') window.copyDashboard = copyDashboard;
  if (typeof closeDetailModal === 'function') window.closeDetailModal = closeDetailModal;
  if (typeof resetEquityTool === 'function') window.resetEquityTool = resetEquityTool;
  if (typeof generateEquityReport === 'function') window.generateEquityReport = generateEquityReport;
  if (typeof formatMoney === 'function') window.formatMoney = formatMoney;
  if (typeof loadDemoEquityData === 'function') window.loadDemoEquityData = loadDemoEquityData;

  console.log('%c[equity-scanner.js] Equity Scanner module loaded and ready', 'color:#00A89D');
})();
