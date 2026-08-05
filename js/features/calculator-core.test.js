/**
 * Smoke tests for mortgage Scenario Studio pure compute.
 * Run: node js/features/calculator-core.test.js
 */
const {
  calculateMonthlyPayment,
  computeMortgageScenario,
  fhaMipRatePercent
} = require('./calculator.js');

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else {
    console.log('OK:', msg);
  }
}

// Monthly payment known ballpark: 300k @ 6% / 30yr ≈ 1798.65
const pmt = calculateMonthlyPayment(300000, 6, 30);
assert(pmt > 1790 && pmt < 1810, `P&I ~1799 got ${pmt.toFixed(2)}`);

assert(fhaMipRatePercent(0) === 0.55, 'FHA MIP >95% LTV = 0.55');
// ltv = 1 - 0.05 = 0.95 → not > 0.95 → 0.50
assert(fhaMipRatePercent(5) === 0.5, 'FHA MIP at 5% down (LTV 95%) = 0.50');
assert(fhaMipRatePercent(3.5) === 0.55, 'FHA MIP at 3.5% down = 0.55');

// Standard purchase 20% down — no PMI
const std = computeMortgageScenario({
  mode: 'purchase',
  homePrice: 400000,
  downPayment: 20,
  downIsPercent: true,
  loanAmount: 320000,
  rate: 6.5,
  termYears: 30,
  taxesAnnual: 4800,
  insuranceAnnual: 1200,
  pmiRate: 0.5,
  extraMonthly: 0,
  biweekly: false,
  homeNow: false,
  dpaPercent: 3.5,
    pmiIsDollar: false
  });
assert(std.valid, 'standard valid');
assert(std.results.monthlyPMI === 0, 'no PMI at 20% down');
assert(std.results.monthlyHomeNowSecond === 0, 'no HomeNow 2nd');
assert(std.results.totalMonthly > 2000, 'total monthly sane');

// HomeNow 0 down
const hn = computeMortgageScenario({
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
assert(hn.valid, 'HomeNow valid');
assert(Math.abs(hn.results.firstLoanWithUfmip - 350000 * 1.0175) < 1, 'UFMIP financed into 1st');
assert(hn.results.dpaAmount === Math.ceil(350000 * 0.035), 'DPA 3.5%');
assert(hn.results.secondRate === 8.75, '2nd rate = note + 2');
assert(hn.results.monthlyHomeNowSecond > 0, '2nd payment > 0');
assert(
  Math.abs(hn.results.totalMonthly - (hn.results.monthlyPI + hn.results.monthlyTaxes + hn.results.monthlyInsurance + hn.results.monthlyPMI + hn.results.monthlyHomeNowSecond)) < 0.02,
  'total = components'
);

// Biweekly + extra interest savings
const acc = computeMortgageScenario({
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
assert(acc.valid, 'accelerated valid');
assert(acc.results.interestSavings > 0, 'interest savings with extra+biweekly');
assert(acc.results.monthsToPayoff < 360, 'payoff faster than 30yr');

// Refi
const refi = computeMortgageScenario({
  mode: 'refinance',
  homePrice: 0,
  downPayment: 0,
  downIsPercent: true,
  loanAmount: 285000,
  rate: 6.125,
  termYears: 30,
  taxesAnnual: 2900,
  insuranceAnnual: 1250,
  pmiRate: 0,
  extraMonthly: 200,
  biweekly: false,
  homeNow: false,
  dpaPercent: 3.5,
    pmiIsDollar: false
  });
assert(refi.valid, 'refi valid');
assert(refi.results.monthlyHomeNowSecond === 0, 'refi ignores HomeNow');

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log('\nAll calculator core tests passed.');
