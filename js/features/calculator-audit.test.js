/**
 * Hard audit of mortgage calculator math (Scenario Studio).
 * Run: node js/features/calculator-audit.test.js
 *
 * Validates against closed-form amort formulas and production business rules
 * (HomeNow UFMIP, DPA 2nd @ note+2%/10yr, biweekly 13/12, PMI <20%).
 */
const {
  calculateMonthlyPayment,
  computeMortgageScenario,
  fhaMipRatePercent
} = require('./calculator.js');

let failed = 0;
let passed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('  FAIL:', msg);
  } else {
    passed += 1;
    console.log('  OK:', msg);
  }
}

function almostEqual(a, b, tol, msg) {
  const ok = Math.abs(Number(a) - Number(b)) <= (tol == null ? 0.02 : tol);
  assert(ok, `${msg} (got ${Number(a).toFixed(4)}, expected ${Number(b).toFixed(4)}, tol=${tol == null ? 0.02 : tol})`);
}

/** Standard amortizing payment M = P * r(1+r)^n / ((1+r)^n - 1) */
function formulaPI(principal, annualRatePct, years) {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function section(title) {
  console.log('\n=== ' + title + ' ===');
}

// ─── 1. Payment formula ───────────────────────────────────────
section('1. P&I closed-form accuracy');
almostEqual(calculateMonthlyPayment(300000, 6, 30), formulaPI(300000, 6, 30), 1e-9, 'helper matches formula 300k/6%/30');
almostEqual(calculateMonthlyPayment(300000, 6, 30), 1798.65, 0.02, 'industry ballpark 300k @ 6% 30yr ≈ $1,798.65');
almostEqual(calculateMonthlyPayment(250000, 7.5, 15), formulaPI(250000, 7.5, 15), 1e-9, '15-year formula');
almostEqual(calculateMonthlyPayment(100000, 0, 10), 100000 / 120, 0.01, '0% rate = principal/n');
assert(calculateMonthlyPayment(0, 6, 30) === 0, 'zero principal → 0');
assert(calculateMonthlyPayment(100000, 6, 0) === 0, 'zero years → 0');

// ─── 2. Standard purchase (no HomeNow, 20% down) ──────────────
section('2. Standard purchase 20% down (no PMI)');
{
  const price = 400000;
  const loan = 320000;
  const rate = 6.5;
  const years = 30;
  const taxes = 4800;
  const ins = 1200;
  const out = computeMortgageScenario({
    mode: 'purchase',
    homePrice: price,
    downPayment: 20,
    downIsPercent: true,
    loanAmount: loan,
    rate,
    termYears: years,
    taxesAnnual: taxes,
    insuranceAnnual: ins,
    pmiRate: 0.55,
    extraMonthly: 0,
    biweekly: false,
    homeNow: false,
    dpaPercent: 3.5,
    pmiIsDollar: false
  });
  assert(out.valid, 'valid');
  const r = out.results;
  almostEqual(r.baseLoanAmount, loan, 0.5, 'base loan');
  almostEqual(r.downAmount, 80000, 0.5, 'down $80k');
  almostEqual(r.monthlyPI, formulaPI(loan, rate, years), 0.02, 'P&I');
  almostEqual(r.monthlyTaxes, taxes / 12, 0.01, 'taxes/12');
  almostEqual(r.monthlyInsurance, ins / 12, 0.01, 'ins/12');
  almostEqual(r.monthlyPMI, 0, 0.001, 'no PMI at 20% down even if rate set');
  almostEqual(r.monthlyHomeNowSecond, 0, 0.001, 'no 2nd');
  const expectedTotal = r.monthlyPI + taxes / 12 + ins / 12;
  almostEqual(r.standardTotalMonthly, expectedTotal, 0.02, 'standard monthly = P&I+T+I');
  almostEqual(r.totalMonthly, expectedTotal, 0.02, 'total monthly same when not accelerated');
  almostEqual(r.totalInterestStandard, r.monthlyPI * 360 - loan, 1, 'interest = PI*n - principal');
  almostEqual(r.interestSavings, 0, 0.5, 'no savings without accelerate');
  assert(r.monthsToPayoff === 360, 'payoff 360 months');
}

// ─── 3. PMI threshold ─────────────────────────────────────────
section('3. PMI threshold (<20% down)');
{
  const withPmi = computeMortgageScenario({
    mode: 'purchase',
    homePrice: 400000,
    downPayment: 10,
    downIsPercent: true,
    loanAmount: 360000,
    rate: 6.5,
    termYears: 30,
    taxesAnnual: 0,
    insuranceAnnual: 0,
    pmiRate: 0.5,
    extraMonthly: 0,
    biweekly: false,
    homeNow: false,
    dpaPercent: 3.5,
    pmiIsDollar: false
  });
  const noPmi = computeMortgageScenario({
    mode: 'purchase',
    homePrice: 400000,
    downPayment: 20,
    downIsPercent: true,
    loanAmount: 320000,
    rate: 6.5,
    termYears: 30,
    taxesAnnual: 0,
    insuranceAnnual: 0,
    pmiRate: 0.5,
    extraMonthly: 0,
    biweekly: false,
    homeNow: false,
    dpaPercent: 3.5,
    pmiIsDollar: false
  });
  almostEqual(withPmi.results.monthlyPMI, (360000 * 0.5) / 100 / 12, 0.02, 'PMI at 10% down = loan*rate/12');
  almostEqual(noPmi.results.monthlyPMI, 0, 0.001, 'PMI zero at exactly 20%');
  // 19.99% should still get PMI
  const justUnder = computeMortgageScenario({
    mode: 'purchase',
    homePrice: 100000,
    downPayment: 19.99,
    downIsPercent: true,
    loanAmount: 80010,
    rate: 6,
    termYears: 30,
    taxesAnnual: 0,
    insuranceAnnual: 0,
    pmiRate: 1,
    extraMonthly: 0,
    biweekly: false,
    homeNow: false,
    dpaPercent: 3.5,
    pmiIsDollar: false
  });
  assert(justUnder.results.monthlyPMI > 0, 'PMI applies just under 20%');
}

// ─── 4. Dollar down path ──────────────────────────────────────
section('4. Dollar down / force-from-down');
{
  const out = computeMortgageScenario({
    mode: 'purchase',
    homePrice: 500000,
    downPayment: 50000,
    downIsPercent: false,
    loanAmount: 0,
    _forceFromDown: true,
    rate: 6,
    termYears: 30,
    taxesAnnual: 0,
    insuranceAnnual: 0,
    pmiRate: 0,
    extraMonthly: 0,
    biweekly: false,
    homeNow: false,
    dpaPercent: 3.5,
    pmiIsDollar: false
  });
  almostEqual(out.results.baseLoanAmount, 450000, 0.5, 'loan = price - $ down');
  almostEqual(out.results.downAmount, 50000, 0.5, 'down amount');
}

// ─── 5. HomeNow 3.5% ──────────────────────────────────────────
section('5. HomeNow 3.5% DPA + UFMIP + 2nd mortgage');
{
  const price = 350000;
  const base = 350000;
  const rate = 6.75;
  const years = 30;
  const taxes = 3200;
  const ins = 1400;
  const pmiRate = 0.55;
  const out = computeMortgageScenario({
    mode: 'purchase',
    homePrice: price,
    downPayment: 0,
    downIsPercent: true,
    loanAmount: base,
    rate,
    termYears: years,
    taxesAnnual: taxes,
    insuranceAnnual: ins,
    pmiRate,
    extraMonthly: 0,
    biweekly: false,
    homeNow: true,
    dpaPercent: 3.5,
    pmiIsDollar: false
  });
  assert(out.valid, 'HomeNow valid');
  const r = out.results;
  const firstLoan = base * 1.0175;
  almostEqual(r.firstLoanWithUfmip, firstLoan, 0.02, 'UFMIP 1.75% into 1st');
  almostEqual(r.dpaAmount, Math.ceil(price * 0.035), 0, 'DPA = ceil(price * 3.5%)');
  almostEqual(r.secondRate, 8.75, 0.001, '2nd rate = note + 2');
  almostEqual(r.monthlyPI, formulaPI(firstLoan, rate, years), 0.02, 'P&I on 1st w/ UFMIP');
  almostEqual(r.monthlyHomeNowSecond, formulaPI(r.dpaAmount, 8.75, 10), 0.02, '2nd P&I 10yr');
  almostEqual(r.monthlyPMI, (base * pmiRate) / 100 / 12, 0.02, 'MIP on base loan (not UFMIP stack)');
  const stack =
    r.monthlyPI + r.monthlyTaxes + r.monthlyInsurance + r.monthlyPMI + r.monthlyHomeNowSecond;
  almostEqual(r.totalMonthly, stack, 0.02, 'total = full housing stack');
  almostEqual(r.standardTotalMonthly, stack, 0.02, 'standard total includes 2nd');
  // 2nd interest full term
  const secondInt = r.monthlyHomeNowSecond * 120 - r.dpaAmount;
  // Production rule: first interest uses baseLoanAmount (not firstLoan) — preserved from original
  const firstIntProd = r.monthlyPI * 360 - base;
  almostEqual(r.totalInterestStandard, firstIntProd + secondInt, 1, 'std interest = (PI*n - base) + 2nd interest');
  assert(r.downAmount === 0 || r.downAmount < 1, '0 down for HomeNow 0%');
}

// ─── 6. HomeNow 5% DPA ────────────────────────────────────────
section('6. HomeNow 5% DPA');
{
  const out = computeMortgageScenario({
    mode: 'purchase',
    homePrice: 400000,
    downPayment: 0,
    downIsPercent: true,
    loanAmount: 400000,
    rate: 7,
    termYears: 30,
    taxesAnnual: 0,
    insuranceAnnual: 0,
    pmiRate: 0.55,
    extraMonthly: 0,
    biweekly: false,
    homeNow: true,
    dpaPercent: 5,
    pmiIsDollar: false
  });
  almostEqual(out.results.dpaAmount, Math.ceil(400000 * 0.05), 0, '5% DPA amount');
  almostEqual(out.results.secondRate, 9, 0.001, '2nd = 7+2');
  almostEqual(out.results.dpaPercent, 5, 0, 'dpaPercent stored as 5');
}

// ─── 7. FHA MIP table ─────────────────────────────────────────
section('7. FHA MIP rate table');
assert(fhaMipRatePercent(0) === 0.55, '0% down → 0.55');
assert(fhaMipRatePercent(3.5) === 0.55, '3.5% down LTV 96.5 → 0.55');
assert(fhaMipRatePercent(4.9) === 0.55, '4.9% down LTV >95 → 0.55');
assert(fhaMipRatePercent(5) === 0.5, '5% down LTV 95 → 0.50');
assert(fhaMipRatePercent(10) === 0.5, '10% down → 0.50');

// ─── 8. Extra monthly only ────────────────────────────────────
section('8. Extra monthly (no biweekly)');
{
  const base = computeMortgageScenario({
    mode: 'purchase',
    homePrice: 375000,
    downPayment: 20,
    downIsPercent: true,
    loanAmount: 300000,
    rate: 6.5,
    termYears: 30,
    taxesAnnual: 3600,
    insuranceAnnual: 1500,
    pmiRate: 0,
    extraMonthly: 0,
    biweekly: false,
    homeNow: false,
    dpaPercent: 3.5,
    pmiIsDollar: false
  });
  const extra = computeMortgageScenario({
    mode: 'purchase',
    homePrice: 375000,
    downPayment: 20,
    downIsPercent: true,
    loanAmount: 300000,
    rate: 6.5,
    termYears: 30,
    taxesAnnual: 3600,
    insuranceAnnual: 1500,
    pmiRate: 0,
    extraMonthly: 250,
    biweekly: false,
    homeNow: false,
    dpaPercent: 3.5,
    pmiIsDollar: false
  });
  almostEqual(
    extra.results.totalMonthly,
    base.results.standardTotalMonthly + 250,
    0.02,
    'display monthly = standard + $250 extra'
  );
  almostEqual(extra.results.standardTotalMonthly, base.results.standardTotalMonthly, 0.02, 'standard monthly unchanged by extra');
  assert(extra.results.monthsToPayoff < 360, 'payoff shorter with extra');
  assert(extra.results.interestSavings > 0, 'interest savings > 0');
  // Payoff formula: n = log(p/(p - L*r)) / log(1+r)
  const L = 300000;
  const r = 6.5 / 100 / 12;
  const p = extra.results.monthlyPI + 250;
  const nExpect = Math.ceil(Math.log(p / (p - L * r)) / Math.log(1 + r));
  almostEqual(extra.results.monthsToPayoff, nExpect, 0, 'payoff months closed-form');
  almostEqual(
    extra.results.totalInterestCustom,
    p * extra.results.monthsToPayoff - L,
    1,
    'custom interest = principalPayment * months - loan'
  );
}

// ─── 9. Biweekly only ─────────────────────────────────────────
section('9. Biweekly (13/12 production rule)');
{
  const out = computeMortgageScenario({
    mode: 'purchase',
    homePrice: 375000,
    downPayment: 20,
    downIsPercent: true,
    loanAmount: 300000,
    rate: 6.5,
    termYears: 30,
    taxesAnnual: 3600,
    insuranceAnnual: 1500,
    pmiRate: 0,
    extraMonthly: 0,
    biweekly: true,
    homeNow: false,
    dpaPercent: 3.5,
    pmiIsDollar: false
  });
  const r = out.results;
  const basePITI = r.monthlyPI + r.monthlyTaxes + r.monthlyInsurance + r.monthlyPMI;
  // Production: scales full PITI+extra by 13/12 for display
  almostEqual(r.totalMonthly, (basePITI * 13) / 12, 0.02, 'biweekly display = PITI * 13/12');
  almostEqual(r.standardTotalMonthly, basePITI, 0.02, 'standard stays calendar monthly');
  const principalPayment = (r.monthlyPI * 13) / 12;
  const L = 300000;
  const mr = 6.5 / 100 / 12;
  const nExpect = Math.ceil(Math.log(principalPayment / (principalPayment - L * mr)) / Math.log(1 + mr));
  almostEqual(r.monthsToPayoff, nExpect, 0, 'biweekly payoff months');
  assert(r.interestSavings > 0, 'biweekly saves interest');
}

// ─── 10. Biweekly + extra ─────────────────────────────────────
section('10. Biweekly + extra combined');
{
  const out = computeMortgageScenario({
    mode: 'purchase',
    homePrice: 375000,
    downPayment: 20,
    downIsPercent: true,
    loanAmount: 300000,
    rate: 6.5,
    termYears: 30,
    taxesAnnual: 3600,
    insuranceAnnual: 1500,
    pmiRate: 0,
    extraMonthly: 200,
    biweekly: true,
    homeNow: false,
    dpaPercent: 3.5,
    pmiIsDollar: false
  });
  const r = out.results;
  const basePITI = r.monthlyPI + 3600 / 12 + 1500 / 12;
  almostEqual(r.totalMonthly, ((basePITI + 200) * 13) / 12, 0.05, 'biweekly+extra display');
  assert(r.monthsToPayoff < 300, 'payoff much shorter');
  assert(r.interestSavings > 50000, 'substantial savings');
}

// ─── 11. HomeNow + accelerate (2nd not accelerated) ───────────
section('11. HomeNow + extra: 2nd stays full term; savings on 1st only');
{
  const std = computeMortgageScenario({
    mode: 'purchase',
    homePrice: 350000,
    downPayment: 0,
    downIsPercent: true,
    loanAmount: 350000,
    rate: 6.75,
    termYears: 30,
    taxesAnnual: 3200,
    insuranceAnnual: 1400,
    pmiRate: 0.55,
    extraMonthly: 0,
    biweekly: false,
    homeNow: true,
    dpaPercent: 3.5,
    pmiIsDollar: false
  });
  const acc = computeMortgageScenario({
    mode: 'purchase',
    homePrice: 350000,
    downPayment: 0,
    downIsPercent: true,
    loanAmount: 350000,
    rate: 6.75,
    termYears: 30,
    taxesAnnual: 3200,
    insuranceAnnual: 1400,
    pmiRate: 0.55,
    extraMonthly: 300,
    biweekly: false,
    homeNow: true,
    dpaPercent: 3.5,
    pmiIsDollar: false
  });
  almostEqual(
    acc.results.totalMonthly,
    std.results.standardTotalMonthly + 300,
    0.05,
    'HomeNow total = standard stack + extra (2nd already in standard)'
  );
  almostEqual(
    acc.results.monthlyHomeNowSecond,
    std.results.monthlyHomeNowSecond,
    0.02,
    '2nd payment unchanged by extra'
  );
  // Savings only on first: should be less than if we compared full standardInterest - customInterest without HN split
  assert(acc.results.interestSavings > 0, '1st mortgage savings positive');
  const firstStd = acc.results.monthlyPI * 360 - 350000;
  const p = acc.results.monthlyPI + 300;
  const customFirst = p * acc.results.monthsToPayoff - 350000;
  almostEqual(acc.results.interestSavings, firstStd - customFirst, 2, 'savings = first-only delta');
}

// ─── 12. Refinance ────────────────────────────────────────────
section('12. Refinance mode');
{
  const out = computeMortgageScenario({
    mode: 'refinance',
    homePrice: 999999,
    downPayment: 50,
    downIsPercent: true,
    loanAmount: 285000,
    rate: 6.125,
    termYears: 30,
    taxesAnnual: 2900,
    insuranceAnnual: 1250,
    pmiRate: 0.4,
    extraMonthly: 0,
    biweekly: false,
    homeNow: true, // must be ignored
    dpaPercent: 5,
    pmiIsDollar: false
  });
  assert(out.valid, 'refi valid');
  assert(out.results.homeNow === false, 'HomeNow forced off in refinance results');
  almostEqual(out.results.baseLoanAmount, 285000, 0.5, 'refi loan amount');
  almostEqual(out.results.monthlyHomeNowSecond, 0, 0.001, 'no 2nd on refi');
  almostEqual(out.results.monthlyPI, formulaPI(285000, 6.125, 30), 0.02, 'refi P&I');
  // Refi applies PMI always if rate set (production rule)
  almostEqual(out.results.monthlyPMI, (285000 * 0.4) / 100 / 12, 0.02, 'refi PMI if rate provided');
}

// ─── 13. Invalid inputs ───────────────────────────────────────
section('13. Invalid / edge inputs');
{
  assert(!computeMortgageScenario({ mode: 'refinance', loanAmount: 0, rate: 6, termYears: 30 }).valid, 'zero loan invalid (refi)');
  assert(!computeMortgageScenario({ mode: 'refinance', loanAmount: 200000, rate: 0, termYears: 30 }).valid, 'zero rate invalid');
  assert(!computeMortgageScenario({ mode: 'refinance', loanAmount: 200000, rate: 6, termYears: 0 }).valid, 'zero term invalid');
  // Purchase with loanAmount 0 falls back to price − down (valid)
  const fallback = computeMortgageScenario({
    mode: 'purchase',
    homePrice: 100000,
    downPayment: 0,
    downIsPercent: true,
    loanAmount: 0,
    rate: 6,
    termYears: 30,
    taxesAnnual: 0,
    insuranceAnnual: 0,
    pmiRate: 0,
    extraMonthly: 0,
    biweekly: false,
    homeNow: false,
    dpaPercent: 3.5,
    pmiIsDollar: false
  });
  assert(fallback.valid, 'purchase loanAmount 0 still valid via price−down');
  almostEqual(fallback.results.baseLoanAmount, 100000, 0.5, 'purchase loanAmount 0 → uses price − down');
}

// ─── 14. Loan amount preference when both set ─────────────────
section('14. Loan amount wins when provided (DOM sync path)');
{
  // loanAmount 300k on 400k home → down should recompute to 100k even if downPayment says 5%
  const out = computeMortgageScenario({
    mode: 'purchase',
    homePrice: 400000,
    downPayment: 5,
    downIsPercent: true,
    loanAmount: 300000,
    rate: 6,
    termYears: 30,
    taxesAnnual: 0,
    insuranceAnnual: 0,
    pmiRate: 0,
    extraMonthly: 0,
    biweekly: false,
    homeNow: false,
    dpaPercent: 3.5,
    pmiIsDollar: false
  });
  almostEqual(out.results.baseLoanAmount, 300000, 0.5, 'uses loanAmount');
  almostEqual(out.results.downAmount, 100000, 0.5, 'down derived from price - loan');
}

// ─── 15. UI dual-card consistency ─────────────────────────────
section('15. Dual-card invariants (standard vs accelerated display)');
{
  const r = computeMortgageScenario({
    mode: 'purchase',
    homePrice: 400000,
    downPayment: 20,
    downIsPercent: true,
    loanAmount: 320000,
    rate: 6.5,
    termYears: 30,
    taxesAnnual: 4800,
    insuranceAnnual: 1200,
    pmiRate: 0,
    extraMonthly: 400,
    biweekly: false,
    homeNow: false,
    dpaPercent: 3.5,
    pmiIsDollar: false
  }).results;
  assert(r.standardTotalMonthly < r.totalMonthly, 'accelerated total monthly >= standard (extra added)');
  assert(r.totalInterestCustom < r.totalInterestStandard, 'custom interest < standard');
  almostEqual(r.interestSavings, r.totalInterestStandard - r.totalInterestCustom, 1, 'savings = std - custom interest');
  assert(r.yearsToPayoff * 12 + r.remainingMonths === r.monthsToPayoff, 'years/months split matches monthsToPayoff');
}

// ─── 16. Known reference: $200k @ 5% 30yr ─────────────────────
section('16. Known reference payment');
{
  // Classic textbook: roughly $1073.64
  almostEqual(calculateMonthlyPayment(200000, 5, 30), 1073.64, 0.05, '$200k @ 5% 30yr ≈ $1,073.64');
  const out = computeMortgageScenario({
    mode: 'refinance',
    loanAmount: 200000,
    rate: 5,
    termYears: 30,
    taxesAnnual: 0,
    insuranceAnnual: 0,
    pmiRate: 0,
    extraMonthly: 0,
    biweekly: false,
    homeNow: false,
    dpaPercent: 3.5,
    pmiIsDollar: false
  });
  almostEqual(out.results.monthlyPI, 1073.64, 0.05, 'compute scenario matches reference');
  almostEqual(
    out.results.totalInterestStandard,
    out.results.monthlyPI * 360 - 200000,
    0.5,
    'interest over term = PI * n − principal'
  );
}

// ─── 17. PMI dollar mode (default LO path) ───────────────────
section('17. PMI monthly $ mode');
{
  const C = require('./calculator.js');
  const out = C.computeMortgageScenario({
    mode: 'purchase',
    homePrice: 400000,
    downPayment: 10,
    downIsPercent: true,
    loanAmount: 360000,
    rate: 6.5,
    termYears: 30,
    taxesAnnual: 0,
    insuranceAnnual: 0,
    pmiInput: 150,
    pmiIsDollar: true,
    extraMonthly: 0,
    biweekly: false,
    homeNow: false,
    dpaPercent: 3.5
  });
  almostEqual(out.results.monthlyPMI, 150, 0.01, 'dollar mode uses $150/mo directly');
  almostEqual(out.results.pmiRateUsed, (150 * 12 / 360000) * 100, 0.02, 'implied annual % from $');

  const equiv = C.computeMortgageScenario({
    mode: 'purchase',
    homePrice: 400000,
    downPayment: 10,
    downIsPercent: true,
    loanAmount: 360000,
    rate: 6.5,
    termYears: 30,
    taxesAnnual: 0,
    insuranceAnnual: 0,
    pmiInput: 0.5,
    pmiIsDollar: false,
    extraMonthly: 0,
    biweekly: false,
    homeNow: false,
    dpaPercent: 3.5
  });
  almostEqual(equiv.results.monthlyPMI, 150, 0.02, '0.5% of 360k = $150/mo');

  const zeroAt20 = C.computeMortgageScenario({
    mode: 'purchase',
    homePrice: 400000,
    downPayment: 20,
    downIsPercent: true,
    loanAmount: 320000,
    rate: 6.5,
    termYears: 30,
    taxesAnnual: 0,
    insuranceAnnual: 0,
    pmiInput: 0,
    pmiIsDollar: true,
    extraMonthly: 0,
    biweekly: false,
    homeNow: false,
    dpaPercent: 3.5
  });
  almostEqual(zeroAt20.results.monthlyPMI, 0, 0.001, '$0 at 20% down stays 0');

  const forceAt20 = C.computeMortgageScenario({
    mode: 'purchase',
    homePrice: 400000,
    downPayment: 20,
    downIsPercent: true,
    loanAmount: 320000,
    rate: 6.5,
    termYears: 30,
    taxesAnnual: 0,
    insuranceAnnual: 0,
    pmiInput: 80,
    pmiIsDollar: true,
    extraMonthly: 0,
    biweekly: false,
    homeNow: false,
    dpaPercent: 3.5
  });
  almostEqual(forceAt20.results.monthlyPMI, 80, 0.01, 'explicit $ at ≥20% down still honored');
}

// ─── Summary ──────────────────────────────────────────────────
console.log('\n========================================');
console.log(`Audit complete: ${passed} passed, ${failed} failed`);
console.log('========================================');
if (failed) {
  process.exit(1);
}
console.log('\nAll hard-check calculations PASSED.');
console.log('\nNotes (documented production rules, not bugs):');
console.log(' • Biweekly multiplies full PITI (not only P&I) by 13/12 for display payment.');
console.log(' • HomeNow interest uses (PI*n - baseLoan) + 2nd interest; UFMIP sits in amortized principal.');
console.log(' • PMI: $/mo mode (default) uses entered dollars; % mode applies <20% LTV gate on purchase.');
console.log(' • PMI on purchase % mode only when down < 20%; always applied on refi if rate entered.');
console.log(' • HomeNow 2nd is never accelerated by extra/biweekly.');
