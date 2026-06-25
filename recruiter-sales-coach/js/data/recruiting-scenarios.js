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
      { value: 'I am not interested — timing or value', label: '"Not interested"', contextTip: 'Include: whether it felt like timing, low perceived value, or a hard no.' },
      { value: 'I do not think a different company would make much of a difference', label: '"No real difference between companies"', contextTip: 'Include: what they compared, what they wish they could change, and gaps in ops/support/comp.' },
      { value: 'I already know where I would go if I ever left', label: '"I already know where I\'d go"', contextTip: 'Include: which company they named, how recent the decision was, and what they like about that option.' },
      { value: 'The sign-on bonus at my current place is too good to leave', label: 'Sign-on bonus is too good', contextTip: 'Include: volume, purchase mix, and platform/support gaps that matter long-term.' },
      { value: 'I do not know anything about Ruoff', label: '"I don\'t know Ruoff"', contextTip: 'Include: their market, respected local lenders, and 1–2 Ruoff facts (no hard pitch).' },
      { value: 'I get calls like this all the time / recruiters reach out all the time', label: '"Recruiters reach out all the time"', contextTip: 'Include: what makes this candidate different and proof you did homework.' },
      { value: 'I have heard bad things about your company', label: '"I\'ve heard bad things"', contextTip: 'Include: what they heard, from whom, and whether they\'ve verified firsthand.' },
      { value: 'Your company is not the right fit for me', label: '"Not the right fit"', contextTip: 'Include: what "fit" means to them and which concerns felt addressable vs. deal-breakers.' }
    ]
  },
  'objections-comp-ops': {
    label: 'Comp, Benefits, Pricing & Ops',
    icon: 'fa-balance-scale',
    color: '#F15A29',
    scenarios: [
      { value: 'I do not want to lose my benefits or compensation structure', label: 'Benefits / comp structure', contextTip: 'Include: what they value most (base, bonus, health, 401k) and what "matched or improved" would mean.' },
      { value: 'I enjoy my current pricing and do not want to change', label: 'Enjoys current pricing', contextTip: 'Include: margin concerns, client pushback on price, and whether strategic pricing matters to them.' },
      { value: 'I enjoy my current loan programs', label: 'Enjoys current programs', contextTip: 'Include: strongest programs, gaps for certain client types, and what they\'d add if they could.' },
      { value: 'My current company has strong operations — hard to beat', label: 'Operational strength', contextTip: 'Include: what ops does well, stress level, and which non-ops area they\'d upgrade if they could.' },
      { value: 'I love being on a P and L', label: 'Loves being on a P&L', contextTip: 'Include: P&L trends 12–24 months, margin/expense goals, and whether they\'ve stress-tested other models.' },
      { value: 'I love being a broker', label: 'Loves being a broker', contextTip: 'Include: what they love about the broker model and whether they feel maxed out in current seat.' },
      { value: 'I have strong autonomy at my current company', label: 'Autonomy at current company', contextTip: 'Include: what autonomy means day-to-day and any hidden constraints they\'ve adapted to.' }
    ]
  },
  'objections-contract': {
    label: 'Timing, Market & Decision Partners',
    icon: 'fa-clock',
    color: '#F15A29',
    scenarios: [
      { value: 'I just started at a new company — too early to talk', label: 'Just started somewhere new', contextTip: 'Include: months in role, contract concerns, and whether they seemed curious.' },
      { value: 'I am under contract or have a non-compete', label: 'Under contract / non-compete', contextTip: 'Include: contract end date, future touch preference, and tone.' },
      { value: 'Maybe in 6 months — not now / timing is not right', label: 'Timing is not right', contextTip: 'Include: what would need to change, realistic timeline, and permission to stay connected.' },
      { value: 'I am waiting to see what happens with rates and the market', label: 'Waiting on rates / market', contextTip: 'Include: what would need to change, explore-vs-commit framing, and goals if nothing changes in 6–12 months.' },
      { value: 'I need to talk to my spouse or business partner first', label: 'Need to talk to spouse/partner', contextTip: 'Include: who influences the decision, what they think the spouse will ask, and whether a joint leadership call makes sense.' },
      { value: 'I am too busy right now', label: '"Too busy"', contextTip: 'Include: whether busy means thriving or overloaded, and if scale/breathing room would matter.' },
      { value: 'I am worried about how my clients and referral partners would react', label: 'Clients / referral partner concern', contextTip: 'Include: reputation vs. business impact fears and how they frame moves to their sphere today.' },
      { value: 'I have team loyalty and emotional ties at my current company', label: 'Team loyalty / emotional tie', contextTip: 'Include: what they value about the team and whether growth could happen without burning bridges.' }
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