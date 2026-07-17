/**
 * Recruiting funnel metrics — reference/coaching (Shape is system of record).
 * Source: Ruoff Recruiting Plan 2026_Final EXTENDED
 *
 * Headline goal = 60 net hires. Funnel capacity ~85 gross hires (~7/mo) so net
 * survives attrition. Activity targets below work backwards from that capacity.
 */
window.RECRUITING_METRICS = {
  annualGoal: { netHires: 60, label: '2026 Net Hires Goal' },
  grossHireCapacity: { annual: 85, monthly: 7, note: 'Working capacity so ~60 net survives attrition' },
  weekly: {
    outreachAttempts: 270,
    qualityConversations: { min: 24, max: 25 },
    executiveCallsScheduled: { min: 4.8, max: 5.1 },
    executiveCallsCompleted: { min: 3.6, max: 3.8 },
    bestOutreachDays: ['Tuesday', 'Wednesday', 'Thursday']
  },
  monthly: {
    outreachAttempts: { min: 1170, max: 1210 },
    qualityConversations: { min: 105, max: 110 },
    executiveCallsScheduled: { min: 21, max: 22 },
    executiveCallsCompleted: { min: 16, max: 17 },
    netHires: 7
  },
  annualFunnel: {
    outreachAttempts: { min: 14000, max: 14500 },
    qualityConversations: { min: 1260, max: 1300 },
    executiveCallsScheduled: { min: 255, max: 265 },
    executiveCallsCompleted: { min: 190, max: 200 },
    netHiresGoal: 60,
    grossHireCapacity: 85
  },
  conversions: [
    { from: 'Outreach Attempts', to: 'Quality Conversations', rate: '8–10%' },
    { from: 'Quality Conversations', to: 'Executive Calls Scheduled', rate: '20%' },
    { from: 'Executive Calls Scheduled', to: 'Executive Calls Completed', rate: '75%' },
    { from: 'Executive Calls Completed', to: 'Hire', rate: '70–75%' }
  ],
  candidateCriteria: {
    productionVolume: '30–70 units annually',
    purchaseFocus: 'Minimum 50% purchase transactions',
    sourcingFrequency: 'Weekly review and prospecting'
  },
  social: {
    postsPerWeek: '3–4 (Facebook + LinkedIn combined)',
    contentMix: '80% personal/authentic, 20% Ruoff-focused',
    newConnectionsPerWeek: '15–20 new social connections with LO prospects',
    paidAds: 'Paid Facebook as needed for LO promotion — not a default for every week'
  },
  outreachChannels: ['Phone calls', 'Text messaging', 'LinkedIn messaging', 'Facebook messaging'],
  valueContentTypes: ['Sales Tips', 'Friday Funny', 'Value-Add Messages']
};