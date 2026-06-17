/**
 * Recruiting funnel metrics — reference/coaching (Shape is system of record).
 * Source: Ruoff Recruiting Plan 2026 + Recruiting Sales Tool Summary
 */
window.RECRUITING_METRICS = {
  annualGoal: { netHires: 60, label: '2026 Net Hires Goal' },
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
    newConnectionsPerWeek: '15–20 new social connections with LO prospects'
  },
  outreachChannels: ['Phone calls', 'Text messaging', 'LinkedIn messaging', 'Facebook messaging']
};