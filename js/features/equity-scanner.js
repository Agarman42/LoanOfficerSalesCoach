/**
 * js/features/equity-scanner.js
 * Equity & Opportunity Scanner - fully extracted (Phase 1)
 *
 * Original functionality preserved 100%.
 * Self-initializes. Exposes necessary globals for any remaining inline handlers.
 */

(function () {
  'use strict';

  // === ORIGINAL EQUITY SCANNER CODE BEGINS ===
  // (verbatim from the monolithic version, minus the outer <script> tags)


const CURRENT_DATE = new Date();

// Upload Listeners + Success Indicator (fixed)
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('database-upload');
const fileStatus = document.getElementById('file-status');
const fileNameDisplay = document.getElementById('file-name');

// Single clean listener for file selection + drag/drop feedback
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];

    // User canceled / no file selected
    if (!file) {
        if (fileStatus) fileStatus.textContent = 'No file selected';
        if (fileNameDisplay) fileNameDisplay.textContent = '';
        if (fileStatus) fileStatus.classList.add('hidden'); // optional: hide status area
        return;
    }

    // File was actually selected — show UI feedback immediately
    if (fileNameDisplay) {
        fileNameDisplay.textContent = file.name;
        fileNameDisplay.classList.remove('hidden');
    }
    if (fileStatus) {
        fileStatus.textContent = 'File selected — processing...';
        fileStatus.classList.remove('hidden');
    }
    console.log('✅ File selected:', file.name);

    // Start reading the file
    const reader = new FileReader();

    reader.onload = (event) => {
        // ── YOUR FULL XLSX PARSING LOGIC GOES HERE ──
        // Example structure (replace with your actual code from generateEquityReport):
        try {
            const workbook = XLSX.read(event.target.result, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            // ... rest of your parsing, column mapping, processing rows, etc. ...

            if (fileStatus) fileStatus.textContent = 'File processed successfully!';
            // Optionally: auto-call generateEquityReport() or buildDashboard() here
            // if you want processing to happen automatically on upload
        } catch (err) {
            console.error('File processing error:', err);
            if (fileStatus) fileStatus.textContent = 'Error processing file — try again';
            if (fileStatus) fileStatus.classList.add('text-red-600');
        }
    };

    reader.onerror = () => {
        if (fileStatus) {
            fileStatus.textContent = 'Error reading file';
            fileStatus.classList.add('text-red-600');
        }
    };

    reader.readAsArrayBuffer(file);

    // Optional: Reset input so user can re-select the same file later
    // e.target.value = '';
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('border-[#F15A29]', 'bg-[#F15A29]/10');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('border-[#F15A29]', 'bg-[#F15A29]/10');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('border-[#F15A29]', 'bg-[#F15A29]/10');
    if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        const file = e.dataTransfer.files[0];
        fileStatus.textContent = 'File selected:';
        fileNameDisplay.textContent = file.name;
        fileNameDisplay.classList.remove('hidden');
    }
});

function syncRateControls() {
    const slider = document.getElementById('new-rate-slider');
    const input = document.getElementById('new-rate-input');

    if (!slider || !input) {
        console.warn('Rate slider or input not found');
        return;
    }

    const clamp = (val) => Math.max(3.0, Math.min(8.0, parseFloat(val) || 6.0));

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

        updateDashboardWithNewRate(val);

        console.log('Rate changed to:', val, '— recalculating savings...');

        // FIX: If in remaining term mode, force a second recalc after short delay
        if (savingsMode === 'remaining') {
            setTimeout(() => updateDashboardWithNewRate(val), 80);
        }
    });
}

// Run on page load
document.addEventListener('DOMContentLoaded', syncRateControls);

// Savings Mode Toggle
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('savings-mode-toggle')?.addEventListener('click', () => {
        savingsMode = savingsMode === 'full' ? 'remaining' : 'full';

        const thumb = document.getElementById('toggle-thumb');
        if (thumb) {
            if (savingsMode === 'full') {
                thumb.classList.remove('translate-x-11');
                thumb.classList.add('translate-x-1');
            } else {
                thumb.classList.remove('translate-x-1');
                thumb.classList.add('translate-x-11');
            }
        }

        const toggleBtn = document.getElementById('savings-mode-toggle');
        if (toggleBtn) {
            toggleBtn.classList.toggle('bg-[#00A89D]', savingsMode === 'full');
            toggleBtn.classList.toggle('bg-orange-500', savingsMode === 'remaining');
        }

        const modeLabel = document.getElementById('mode-label');
        if (modeLabel) {
            modeLabel.textContent = savingsMode === 'full' ? 'Full Term Reset' : 'Remaining Term';
        }

        const currentRate = parseFloat(
            document.getElementById('new-rate-input')?.value ||
            document.getElementById('new-rate-slider')?.value || '6.0'
        );

        updateDashboardWithNewRate(currentRate);

        // FIX: Force a second recalc after mode switch (especially critical for remaining term sync)
        setTimeout(() => updateDashboardWithNewRate(currentRate), 100);
    });
});

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
    if (!fileInput.files.length) {
        alert('Please upload a file');
        return;
    }

    const file = fileInput.files[0];
    const loading = document.getElementById('global-loading');
    const output = document.getElementById('equity-output');

    if (loading) loading.classList.remove('hidden');
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

// Normalize address for duplicate key (removes punctuation, standardizes spacing)
const normalizeAddress = (addr) => addr
    .toLowerCase()
    .replace(/\./g, '')  // Remove periods (E. -> E)
    .replace(/,/g, '')   // Remove commas
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .trim();

// De-duplication: Keep only newest loan per name + address
const seen = new Map();
tempRows.forEach(row => {
    const key = `${row.fullName.toLowerCase()}|${normalizeAddress(row.fullAddress)}`;
    const existing = seen.get(key);

    if (!existing || row.closingDateObj > existing.closingDateObj) {
        seen.set(key, row);
    }
});

// Final unique clients (newest loans only)
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
            if (loading) loading.classList.add('hidden');
        }
    };

    reader.onerror = function() {
        if (output) {
            output.innerHTML = '<p class="text-red-600 text-center py-20 text-xl font-bold">Error reading file.</p>';
            output.classList.remove('hidden');
        }
        if (loading) loading.classList.add('hidden');
    };

    reader.readAsBinaryString(file);
}

// Dashboard - Updated to align initial savings with slider rate
function buildDashboard() {
    const opps = window.currentOpportunities || [];
    const output = document.getElementById('equity-output');
    if (!output) return;

    // Get current slider rate for initial recalc
    const currentRate = parseFloat(document.getElementById('new-rate-input')?.value || 
                                   document.getElementById('new-rate-slider')?.value || '6.0');

    output.innerHTML = `
    <div class="max-w-7xl mx-auto">
        <div class="bg-gradient-to-r from-[#F15A29] to-[#7c3aed] text-white p-8 rounded-3xl shadow-2xl mb-10 text-center relative">
            <button onclick="resetEquityTool()" class="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-full font-bold transition-all shadow-md text-lg">
                ← New Scan
            </button>
            <h3 class="text-4xl font-bold mb-3">Equity Opportunity Dashboard</h3>
            <p class="text-xl mb-6">Analyzed ${opps.length} clients</p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div class="bg-white/20 p-6 rounded-2xl">
                    <p class="text-5xl font-bold" id="count-refi">0</p>
                    <p class="text-xl mt-2">Refi Ready</p>
                </div>
                <div class="bg-white/20 p-6 rounded-2xl">
                    <p class="text-5xl font-bold" id="count-cash">0</p>
                    <p class="text-xl mt-2">Cash-Out</p>
                </div>
                <div class="bg-white/20 p-6 rounded-2xl">
                    <p class="text-5xl font-bold" id="count-move">0</p>
                    <p class="text-xl mt-2">Move-Up Ready</p>
                </div>
                <div class="bg-white/20 p-6 rounded-2xl">
                    <p class="text-5xl font-bold" id="count-pmi">0</p>
                    <p class="text-xl mt-2">PMI Removal</p>
                </div>
            </div>
        </div>

        <div class="flex flex-wrap gap-6 my-8 items-end justify-start">
            <div class="flex gap-4 items-center">
                <label class="text-xl font-semibold text-[#00A89D]">Sort by:</label>
                <select id="sort-select" class="p-3 rounded-xl border-2 border-[#00A89D] bg-white dark:bg-gray-800">
                    <option value="savings">Highest Savings</option>
                    <option value="equity">Most Equity</option>
                    <option value="cash">Most Cash-Out</option>
                    <option value="move">Most Move-Up</option>
                    <option value="name">Name A–Z</option>
                </select>
            </div>

            <div class="flex gap-4 items-center">
                <label class="text-xl font-semibold text-[#00A89D]">Transaction Type:</label>
                <select id="filter-transaction-type" class="p-3 rounded-xl border-2 border-[#00A89D] bg-white dark:bg-gray-800">
                    <option value="All">All</option>
                    <option value="Purchase">Purchase</option>
                    <option value="Refinance">Refinance</option>
                </select>
            </div>

            <div class="flex gap-4 items-center">
                <label class="text-xl font-semibold text-[#00A89D]">Opportunity Type:</label>
                <select id="filter-opportunity-type" class="p-3 rounded-xl border-2 border-[#00A89D] bg-white dark:bg-gray-800">
                    <option value="All">All</option>
                    <option value="Refi Ready">Refi Ready</option>
                    <option value="Cash-Out Goldmine">Cash-Out Goldmine</option>
                    <option value="Move-Up Ready">Move-Up Ready</option>
                    <option value="PMI Removal">PMI Removal</option>
                </select>
            </div>

            <div class="flex flex-nowrap items-center gap-8">
                <div class="flex gap-4 items-center">
                    <label class="text-xl font-semibold text-[#00A89D]">Closing Date From:</label>
                    <input type="date" id="filter-closing-from" class="p-3 w-48 rounded-xl border-2 border-[#00A89D] bg-white dark:bg-gray-800">
                </div>
                <div class="flex gap-4 items-center">
                    <label class="text-xl font-semibold text-[#00A89D]">Closing Date To:</label>
                    <input type="date" id="filter-closing-to" class="p-3 w-48 rounded-xl border-2 border-[#00A89D] bg-white dark:bg-gray-800">
                </div>
            </div>

            <div class="flex gap-4 items-center flex-1 max-w-lg ml-auto">
                <label class="text-xl font-semibold text-[#00A89D]">Search:</label>
                <input type="search" id="opportunity-search" placeholder="Name, address, city, phone, email..." class="flex-1 p-3 rounded-xl border-2 border-[#00A89D] bg-white dark:bg-gray-800">
            </div>
        </div>

        <div id="opportunity-cards" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12"></div>

        <div class="text-center mt-12 space-x-8">
            <button onclick="copyDashboard()" class="bg-[#002B5C] text-white px-12 py-6 rounded-full font-bold text-xl shadow-2xl">📋 Copy All Data</button>
         </div>
    </div>
`;

    output.classList.remove('hidden');

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
    }
}
// Render Cards (badges, no fallback)
function renderCards(opps) {
    const container = document.getElementById('opportunity-cards');
    if (!container) return;
    container.innerHTML = '';

    opps.forEach(c => {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 cursor-pointer hover:translate-y-[-8px] transition-all';
        card.innerHTML = `
            <h3 class="text-2xl font-bold text-[#00A89D] mb-2">${c.fullName}</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">${c.fullAddress}</p>
            <div class="grid grid-cols-2 gap-4 text-lg mb-6">
    <div><strong>Est. Value:</strong> ${formatMoney(c.currentValue)}</div>
    <div><strong>Est. Balance:</strong> ${formatMoney(c.estimatedBalance)}</div>
    <div><strong>Equity:</strong> ${formatMoney(c.equity)}</div>
    <div><strong>Savings/mo:</strong> <span class="text-green-600 font-bold">${formatMoney(c.monthlySavings)}</span></div>
    
    <!-- NEW: Conditional Cash-Out Amount -->
    ${c.cashOut > 50000 ? `<div><strong>Cash-Out Potential:</strong> <span class="text-green-600 font-bold text-xl">${formatMoney(c.cashOut)}</span></div>` : ''}
    
    <!-- NEW: Conditional Move-Up Amount -->
    ${c.moveUp > 100000 ? `<div><strong>Move-Up Equity:</strong> <span class="text-blue-600 font-bold text-xl">${formatMoney(c.moveUp)}</span></div>` : ''}
</div>
            <div class="flex flex-wrap gap-3">
                ${c.isRefiReady ? '<span class="px-5 py-2.5 rounded-full text-white font-bold bg-teal-600 shadow-md">Refi Ready</span>' : ''}
                ${c.isCashOut ? '<span class="px-5 py-2.5 rounded-full text-white font-bold bg-green-600 shadow-md">Cash-Out</span>' : ''}
                ${c.isMoveUpReady ? '<span class="px-5 py-2.5 rounded-full text-white font-bold bg-blue-600 shadow-md">Move-Up Ready</span>' : ''}
                ${c.pmiEligible ? '<span class="px-5 py-2.5 rounded-full text-white font-bold bg-purple-600 shadow-md">PMI Removal</span>' : ''}
            </div>
        `;
        card.onclick = () => openDetailModal(c);
        container.appendChild(card);
    });
}
function sortAndRenderCards() {
    let filtered = window.currentOpportunities || [];

    // Search
    const searchQuery = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
    if (searchQuery) {
        filtered = filtered.filter(o => 
            (o.fullName || '').toLowerCase().includes(searchQuery) ||
            (o.fullAddress || '').toLowerCase().includes(searchQuery)
        );
    }

    // Filter type
    const filterType = document.getElementById('filter-type')?.value || 'All';
    if (filterType !== 'All') {
        if (filterType === 'Refi Ready') filtered = filtered.filter(o => o.isRefiReady);
        else if (filterType === 'Cash-Out Goldmine') filtered = filtered.filter(o => o.isCashOut);
        else if (filterType === 'Move-Up Ready') filtered = filtered.filter(o => o.isMoveUpReady);
        else if (filterType === 'PMI Removal Eligible') filtered = filtered.filter(o => o.pmiEligible);
    }

    // Sort
    const sortBy = document.getElementById('sort-by')?.value || 'score';
    filtered.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));

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

// Live Rate Updates (tiles savings match modal Option 2, badges/counts live)
document.addEventListener('DOMContentLoaded', () => {
    const rateSlider = document.getElementById('new-rate-slider');
    const rateInput = document.getElementById('new-rate-input');

    if (!rateSlider || !rateInput) return;

    const updateLive = () => {
        let rate = parseFloat(rateInput.value) || parseFloat(rateSlider.value) || 6.0;
        rate = Math.max(3.0, Math.min(8.0, rate));

        rateSlider.value = rate;
        rateInput.value = rate.toFixed(3);

        const opps = window.currentOpportunities;
        if (opps) {
            let refiCount = 0;
            opps.forEach(c => {
                const padded = c.estimatedBalance + 4000;
                const newPI = pmt(rate, c.termMonths, padded); // Match modal Option 2
                const newLTV = c.currentValue ? (padded / c.currentValue) * 100 : 100;
                const newMI = newLTV > 80 ? c.originalMI : 0;
                const savings = Math.max(0, Math.round(c.originalPI + c.originalMI - newPI - newMI));

                c.monthlySavings = savings;
                c.isRefiReady = savings > 100;

                if (c.isRefiReady) refiCount++;
            });

            document.getElementById('count-refi').textContent = refiCount;
        }

        renderCards(opps);
        if (window.currentOpenClient) updateRefiComparison(window.currentOpenClient);
    };

    rateSlider.addEventListener('input', updateLive);
    rateSlider.addEventListener('change', updateLive);
    rateInput.addEventListener('input', updateLive);
    rateInput.addEventListener('change', updateLive);

    updateLive();
});

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

    document.getElementById('refi-comparison-grid').innerHTML = `
        <div class="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-300 dark:border-gray-600">
            <h5 class="text-2xl font-extrabold text-[#002B5C] dark:text-[#00A89D]">Option 1: Keep Remaining Term (~${remainingMonths} months)</h5>
            <p class="text-lg"><strong>Current Est. LTV:</strong> <span class="font-bold text-blue-600 text-xl">${currentLTV}%</span></p>
            <p class="text-lg"><strong>Current P&I:</strong> <span class="text-xl font-bold">${formatMoney(currentPI)}</span></p>
            <p class="text-lg"><strong>New P&I @ ${newRate.toFixed(3)}%:</strong> <span class="text-xl font-bold text-green-600">${formatMoney(newPIOpt1)}</span></p>
            <p class="text-lg"><strong>Monthly Savings:</strong> <span class="text-2xl font-extrabold text-green-600">${formatMoney(savingsOpt1)}</span></p>
            <p class="text-sm text-gray-500 italic mt-4">${note1}</p>
        </div>

        <div class="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-300 dark:border-gray-600">
            <h5 class="text-2xl font-extrabold text-[#002B5C] dark:text-[#00A89D]">Option 2: Reset to Original Term (${client.termMonths} months)</h5>
            <p class="text-lg"><strong>Current Est. LTV:</strong> <span class="font-bold text-blue-600 text-xl">${currentLTV}%</span></p>
            <p class="text-lg"><strong>Current P&I:</strong> <span class="text-xl font-bold">${formatMoney(currentPI)}</span></p>
            <p class="text-lg"><strong>New P&I @ ${newRate.toFixed(3)}%:</strong> <span class="text-xl font-bold text-green-600">${formatMoney(newPIOpt2)}</span></p>
            <p class="text-lg"><strong>Monthly Savings:</strong> <span class="text-2xl font-extrabold text-green-600">${formatMoney(savingsOpt2)}</span></p>
            <p class="text-sm text-gray-500 italic mt-4">${note2}</p>
        </div>
    `;
}
// Open Modal
function openDetailModal(client) {
    window.currentOpenClient = client;

    document.getElementById('modal-client-name').textContent = client.fullName || 'N/A';
    document.getElementById('modal-address').textContent = client.fullAddress || 'N/A';

    const phoneLink = document.getElementById('modal-phone-link');
    if (client.phone) {
        phoneLink.href = 'tel:' + client.phone.replace(/\D/g, '');
        phoneLink.textContent = client.phone;
        document.getElementById('modal-phone-na').classList.add('hidden');
    } else {
        document.getElementById('modal-phone-na').classList.remove('hidden');
    }

    const emailLink = document.getElementById('modal-email-link');
    if (client.email) {
        emailLink.href = 'mailto:' + client.email;
        emailLink.textContent = client.email;
        document.getElementById('modal-email-na').classList.add('hidden');
    } else {
        document.getElementById('modal-email-na').classList.remove('hidden');
    }

    document.getElementById('modal-program').textContent = client.loanProgram || 'N/A';
    document.getElementById('modal-closing-date').textContent = client.closingDate || 'N/A';
    document.getElementById('modal-current-rate').textContent = client.rate.toFixed(3) + '%';
    document.getElementById('modal-term').textContent = Math.round(client.termMonths / 12) + ' years';
    document.getElementById('modal-original-ltv').textContent = client.originalLTV.toFixed(2) + '%';
    document.getElementById('modal-balance').textContent = formatMoney(client.estimatedBalance);
    document.getElementById('modal-value').textContent = formatMoney(client.currentValue);
    document.getElementById('modal-original-pi').textContent = formatMoney(client.originalPI);
    document.getElementById('modal-original-mi').textContent = formatMoney(client.originalMI);
    document.getElementById('modal-original-insurance').textContent = formatMoney(client.originalInsurance);
    document.getElementById('modal-original-taxes').textContent = formatMoney(client.originalTaxes);
    
    document.getElementById('modal-pmi-alert').style.display = client.pmiEligible ? 'flex' : 'none';
// Add Equity Opportunities section (clean, high-impact, no duplicates)
let equitySection = document.getElementById('equity-opportunities-section');
if (equitySection) equitySection.remove();  // Remove previous if exists

equitySection = document.createElement('div');
equitySection.id = 'equity-opportunities-section';
equitySection.className = 'mt-10 p-8 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-2xl shadow-inner';

equitySection.innerHTML = `
    <h4 class="text-2xl font-bold text-[#002B5C] dark:text-[#00A89D] mb-6 flex items-center">
        <i class="fas fa-coins mr-3 text-[#F15A29]"></i>Equity Opportunities
    </h4>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-lg">
        <div>
            <p class="text-4xl font-black text-green-600">${formatMoney(client.cashOut)}</p>
            <p class="mt-3 text-gray-700 dark:text-gray-300">Cash-Out Potential<br><span class="text-sm">(80% LTV)</span></p>
        </div>
        <div>
            <p class="text-4xl font-black text-blue-600">${formatMoney(client.moveUp)}</p>
            <p class="mt-3 text-gray-700 dark:text-gray-300">Move-Up Equity<br><span class="text-sm">(95% net proceeds)</span></p>
        </div>
        <div>
            <p class="text-4xl font-black text-purple-600">${formatMoney(client.equity)}</p>
            <p class="mt-3 text-gray-700 dark:text-gray-300">Total Current Equity</p>
        </div>
    </div>
`;

// Insert after Original Loan Details (before Refinance Comparison)
const originalDetailsDiv = document.querySelector('.mt-10.p-8.bg-gradient-to-br.from-gray-100');  // Targets Original Loan Details div
if (originalDetailsDiv) {
    originalDetailsDiv.parentNode.insertBefore(equitySection, originalDetailsDiv.nextElementSibling.nextElementSibling);  // Adjusts for any siblings; safe placement before refi
} else {
    // Fallback: append to modal content if selector fails
    document.querySelector('#detail-modal .p-10').appendChild(equitySection);
}

    const agentSection = document.getElementById('modal-buyers-agent-section');
    agentSection.style.display = client.buyersAgent ? 'block' : 'none';
    if (client.buyersAgent) document.getElementById('modal-buyers-agent').textContent = client.buyersAgent;

    document.getElementById('modal-transaction-type').textContent = client.transactionType || 'N/A';

    const types = [];
    if (client.monthlySavings > 100) types.push('Refi Ready');
    if (client.cashOut > 50000) types.push('Cash-Out');
    if (client.moveUp > 100000) types.push('Move-Up Ready');
    if (client.pmiEligible) types.push('PMI Removal');
    document.getElementById('modal-type-badge').innerHTML = types.length ? types.map(t => `<span class="bg-[#F15A29] text-white px-4 py-2 rounded-full mr-2">${t}</span>`).join('') : '';

    updateRefiComparison(client);

    let scriptContent = '';
    const firstName = client.fullName.split(' ')[0] || 'there';
    const refiSavings = client.savingsOpt2 || 0;

    if (refiSavings > 50) {
        scriptContent = `Hi ${firstName},\n\nHope you're doing great! Quick update — with current rates, we could **save you approximately $${Math.round(refiSavings)} per month** on your mortgage`;
        if (client.pmiEligible && client.originalMI > 0) {
            scriptContent += `, **including removing your $${Math.round(client.originalMI)} monthly PMI** since your equity has grown significantly.`;
        }
        scriptContent += `\n\nThis is one of the strongest opportunities I've seen for you right now. No pressure — just wanted to offer a free review and see if this makes sense for your goals.\n\nWhen's a good time for a quick chat?\n\nBest,\n[Your Name]`;
    } else if (client.cashOut > 50000) {
        scriptContent = `Hi ${firstName},\n\nYour home has built up **$${Math.round(client.cashOut)} in potential cash-out equity** — perfect for home improvements, debt consolidation, or any big plans you have.\n\nWith rates where they are, this could be a great time to access that equity. Interested in exploring your options?\n\nBest,\n[Your Name]`;
    } else if (client.moveUp > 100000) {
        scriptContent = `Hi ${firstName},\n\nWith **$${Math.round(client.moveUp)} in equity**, you're in a fantastic position to move up to your next dream home with a strong down payment.\n\nI'd love to help you explore what's possible in today's market. When can we chat?\n\nBest,\n[Your Name]`;
    } else {
        scriptContent = `Hi ${firstName},\n\nJust checking in on your loan from ${client.closingDate}. Your home has built solid equity since then — wanted to see if there's anything we can do to improve your situation or prepare for your next steps.\n\nNo rush — just let me know if you'd like a quick review!\n\nBest,\n[Your Name]`;
    }

        const scriptsSection = document.getElementById('modal-scripts');
    if (scriptsSection) {
        scriptsSection.innerHTML = `
            <div class="mt-12 p-8 bg-gradient-to-br from-[#00A89D]/10 to-[#F15A29]/10 rounded-2xl">
                <div class="flex justify-between items-center mb-6">
                    <h4 class="text-2xl font-bold text-[#002B5C] dark:text-[#00A89D]">Personalized Outreach Script</h4>
                    <button id="copy-script-btn" class="bg-[#00A89D] hover:bg-[#00887A] text-white px-6 py-3 rounded-full font-bold flex items-center gap-3 shadow-lg transition-all">
                        <i class="fas fa-copy"></i> Copy Script
                    </button>
                </div>
                <div id="script-content" class="whitespace-pre-wrap text-lg bg-gray-50 dark:bg-gray-900 p-6 rounded-xl">${scriptContent}</div>
            </div>

            <div class="mt-8 p-4 bg-gradient-to-br from-[#00A89D]/5 to-[#F15A29]/5 rounded-xl text-sm">
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
    }

    document.getElementById('detail-modal').style.display = 'flex';
}

function closeDetailModal() {
    document.getElementById('detail-modal').style.display = 'none';
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


  // === ORIGINAL EQUITY SCANNER CODE ENDS ===

  // Expose functions that may be referenced from HTML onclick or other modules
  if (typeof openDetailModal === 'function') window.openDetailModal = openDetailModal;
  if (typeof closeDetailModal === 'function') window.closeDetailModal = closeDetailModal;
  if (typeof resetEquityTool === 'function') window.resetEquityTool = resetEquityTool;
  if (typeof generateEquityReport === 'function') window.generateEquityReport = generateEquityReport;
  if (typeof formatMoney === 'function') window.formatMoney = formatMoney;

  console.log('%c[equity-scanner.js] Equity Scanner module loaded and ready', 'color:#00A89D');
})();
