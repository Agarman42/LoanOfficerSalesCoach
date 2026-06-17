/**
 * Recruiting Script Generator — scenario library
 * Source: Recruiting Sales Playbook + 2026 Recruiting Plan
 */
window.RECRUITING_SCENARIO_DATA = {
  custom: {
    label: 'Write Your Own Situation',
    icon: 'fa-edit',
    color: '#002B5C',
    scenarios: []
  },
  'most-common': {
    label: 'Most Common Right Now',
    icon: 'fa-bolt',
    color: '#F15A29',
    scenarios: [
      { value: 'Cold call — first touch with a producer I sourced', label: 'Cold call — first touch', contextTip: 'Include: production volume, purchase mix, current company, how you found them, and any mutual connection.' },
      { value: 'Warm call — met at event or mutual connection', label: 'Warm call — event or referral', contextTip: 'Include: where you met, who connected you, what stood out, and their production level.' },
      { value: 'Follow-up after no response to first outreach', label: 'Follow-up — no response yet', contextTip: 'Include: touches so far, channel (phone/text/LinkedIn), and anything new you learned about them.' },
      { value: 'Re-engage prospect I spoke with 3–6 months ago', label: 'Re-engage — spoke months ago', contextTip: 'Include: what they said last time, why they were not ready, and what may have changed.' },
      { value: 'LinkedIn or Facebook DM to a producer prospect', label: 'Social DM outreach', contextTip: 'Include: platform, profile details that caught your eye, and prior social interaction.' }
    ]
  },
  'openers-discovery': {
    label: 'Openers & Discovery',
    icon: 'fa-comments',
    color: '#00A89D',
    scenarios: [
      { value: 'Neutral opener before the main recruiting pitch', label: 'Neutral opener (warm-up)', contextTip: 'Include: time of day, personal details you know, and how cold vs. warm the relationship is.' },
      { value: 'Primary recruiting opener — executive team asked me to reach out', label: 'Primary recruiting opener', contextTip: 'Include: production stats, why leadership flagged them, and a specific compliment about their business.' },
      { value: 'Discovery — what do they love about where they are?', label: 'Discovery: what they love', contextTip: 'Include: current company, tenure, and what they have said about support, comp, or culture.' },
      { value: 'Discovery — what would have to be true to consider something new?', label: 'Discovery: what would have to be true', contextTip: 'Include: pain points hinted (ops, leads, technology, leadership).' },
      { value: 'They are talking a lot — listen and ask one strong follow-up', label: 'Listen more, one follow-up', contextTip: 'Include: the story they shared and the emotion underneath (frustration, pride, uncertainty).' }
    ]
  },
  'objections-happy': {
    label: '"Happy / Not Looking" Objections',
    icon: 'fa-shield-alt',
    color: '#002B5C',
    scenarios: [
      { value: 'I am happy where I am at — not interested', label: '"I\'m happy where I\'m at"', contextTip: 'Include: production level, tenure, and whether they sounded closed or cautious.' },
      { value: 'I am not looking right now', label: '"I\'m not looking right now"', contextTip: 'Include: whether they shut down quickly or left the door open.' },
      { value: 'The sign-on bonus at my current place is too good to leave', label: 'Sign-on bonus is too good', contextTip: 'Include: volume, purchase mix, and platform/support gaps that matter long-term.' },
      { value: 'I do not know anything about Ruoff', label: '"I don\'t know Ruoff"', contextTip: 'Include: their market, respected local lenders, and 1–2 Ruoff facts (no hard pitch).' },
      { value: 'I get calls like this all the time', label: '"I get calls like this all the time"', contextTip: 'Include: what makes this candidate different and proof you did homework.' }
    ]
  },
  'objections-contract': {
    label: 'New Role / Contract / Timing',
    icon: 'fa-clock',
    color: '#F15A29',
    scenarios: [
      { value: 'I just started at a new company — too early to talk', label: 'Just started somewhere new', contextTip: 'Include: months in role, contract concerns, and whether they seemed curious.' },
      { value: 'I am under contract or have a non-compete', label: 'Under contract / non-compete', contextTip: 'Include: contract end date, future touch preference, and tone.' },
      { value: 'Maybe in 6 months — not now', label: '"Maybe in 6 months"', contextTip: 'Include: what would need to change and permission to stay connected on social.' },
      { value: 'I need to talk to my spouse or business partner first', label: 'Need to talk to spouse/partner', contextTip: 'Include: who influences the decision and whether a joint leadership call makes sense.' }
    ]
  },
  'leadership-meeting': {
    label: 'Leadership Meeting Ask',
    icon: 'fa-users',
    color: '#00A89D',
    scenarios: [
      { value: 'Ask for executive leadership conversation — they are hesitant', label: 'Hesitant on leadership meeting', contextTip: 'Include: production level, worries (time, pressure, pitch), and who from leadership joins.' },
      { value: 'Ask for executive leadership conversation — they are warm', label: 'Warm — schedule leadership call', contextTip: 'Include: what excited them, availability, and leadership prep notes.' },
      { value: 'Confirm logistics for scheduled leadership call', label: 'Confirm leadership call logistics', contextTip: 'Include: date/time, attendees, and what to expect (no pitch, clarity call).' },
      { value: 'Post-leadership call follow-up — still thinking', label: 'Post-leadership call — still thinking', contextTip: 'Include: what resonated, open questions, and realistic timeline.' }
    ]
  },
  'nurture-close': {
    label: 'Nurture & Close',
    icon: 'fa-heart',
    color: '#002B5C',
    scenarios: [
      { value: 'End call — ask for LinkedIn or Facebook connection', label: 'Ask for social connection', contextTip: 'Include: which platform they use most and how the call ended.' },
      { value: 'End call — schedule low-pressure future touchpoint', label: 'Schedule future touchpoint', contextTip: 'Include: preferred timeframe (3 months, fall, 6 months).' },
      { value: 'Text follow-up after a good phone conversation', label: 'Text follow-up after good call', contextTip: 'Include: one specific thing they said and any promises made.' },
      { value: 'Check-in touch with no ask — pure relationship', label: 'Value-only nurture touch', contextTip: 'Include: personal detail, market insight, or content to share with no recruiting ask.' },
      { value: 'They went quiet — gentle re-engagement', label: 'Gentle re-engagement after silence', contextTip: 'Include: last conversation, channels tried, and time since response.' }
    ]
  }
};