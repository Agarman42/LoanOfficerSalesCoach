/**
 * Recruiting Sales Playbook — static reference + AI grounding
 * Source: Recruiting_Sales_Tool_Summary.docx
 */
window.RECRUITING_PLAYBOOK = {
  philosophy: [
    'Lead with curiosity and respect rather than pressure.',
    'Make every interaction feel personal and targeted.',
    'Focus on long-term relationship building, not just immediate results.',
    'Quality conversations matter more than raw activity volume.',
    'Help candidates see platform and long-term support — not just the upfront offer.',
    'Senior leadership conversations should be positioned as high-value and low-risk.'
  ],
  neutralOpeners: [
    'How\'s your week going so far?',
    'Working toward Friday?',
    'How\'s summer treating you?',
    'How are things going in your world these days?'
  ],
  primaryOpener:
    'Our executive team has been impressed with the business you\'ve been building, and they specifically asked me to reach out to see if you would be open to a short conversation.',
  discoveryQuestions: [
    'What\'s your favorite thing about where you\'re at right now?',
    'What\'s keeping you there?',
    'What do you love most about your current situation?',
    'What\'s been working really well for you lately?',
    'What would have to be true for you to even consider exploring something new?'
  ],
  objectionMindset: [
    'Acknowledge their position first.',
    'Reframe value around long-term fit and platform support.',
    'Decisions should weigh more than just the sign-on bonus.',
    'Position senior leadership conversation as low-risk and high-value.'
  ],
  objectionResponses: {
    happyOrNotLooking: [
      'I completely understand. At the same time, with the kind of production you\'re putting up, I\'d argue you owe it to yourself to put as much weight on the platform and long-term support as you do on the sign-on bonus. When someone\'s operating at a high level, the upfront number becomes less of a deciding factor than whether the infrastructure can actually help sustain and grow that success.',
      'I respect that. A lot of strong producers we talk to feel the same way initially. What we\'ve found is that taking a short conversation with senior leadership often gives people real clarity — even if they ultimately decide to stay where they are.',
      'Fair enough. With everything you have going on, it makes sense to be selective. That\'s exactly why I think a quick conversation with our leadership team would be worthwhile. They can speak directly to what support and structure look like here, so you can make the best decision for your situation.'
    ],
    newRoleOrContract: [
      'I completely get that. A lot of people in that situation still find value in understanding what else is out there, especially when they\'re early in a new role. Would you be open to a short conversation with our leadership team just to learn what we have to offer?',
      'Totally fair. Since you\'re still getting settled, I won\'t push. That said, I\'d love to keep the door open. Would you be okay if I reached back out in a few months to see how things are going?'
    ],
    hesitantOnLeadership: [
      'I understand it can feel like a big step. At the same time, with the production level you\'re at, our overall compensation and support structure would be well north of a standard sign-on offer. The real question is whether the platform can actually help you hit your bigger goals long-term. A short conversation with leadership is the best way to get clarity on that.',
      'No pressure at all. Many people we speak with aren\'t actively looking but still find it valuable to understand what\'s possible elsewhere. Our leadership team is very good at having honest, no-pressure conversations about exactly that.'
    ]
  },
  leadershipMeetingScripts: [
    'Based on what you\'ve shared, I think a 20-minute conversation with [our leadership team / Clint or Adam] would be worth your time — not to pitch you, but to give you a clear picture of how our platform and support actually work for producers at your level.',
    'Would you be open to a brief call with our executive team? They specifically wanted to connect with producers building strong purchase business — and there\'s zero obligation. Worst case, you walk away with more clarity about your options.'
  ],
  nurtureClose: [
    'Would you be open to connecting on social so we can stay in touch?',
    'Would it be okay if I checked in with you again in a few months?',
    'I\'ll follow up in the fall — no pressure, just want to stay connected.'
  ],
  coachingPoints: [
    'Pronunciation: Always say "Ruoff" cleanly and confidently.',
    'Use a short neutral opener before the main pitch on most calls.',
    'Let the candidate speak more than you do — especially on personal or career stories.',
    'On "I\'m happy" calls, ask at least one strong discovery question before scheduling a future touch.',
    'At higher production levels, emphasize platform and infrastructure over the upfront bonus.',
    'Log every meaningful touch in Shape — nothing should drop.',
    'Protect weekends for rest and family — heavy outreach belongs Tue–Thu.'
  ],
  keysToSuccess: window.RECRUITING_PLAN_2026?.keysToSuccess || [
    'Consistency: Momentum is built through repetition and reliability.',
    'Human First: Real care and connection before any pitch or process.',
    'Authenticity: Be genuine.',
    'Relationships First: Every touchpoint leads with value, not a pitch.',
    'Input: Every meeting, prospect, and conversation gets logged in Shape.',
    'Speed: Timely follow-up after events or active conversations is non-negotiable.',
    'Market Awareness: Area Manager intel shapes timing and messaging.',
    'AI as an Enhancer: AI refines and coaches — relationships remain the core.',
    'The Long Game: Brand recognition and genuine relationships until the right window opens.'
  ],
  linkedinSnippets: [
    {
      title: 'Connection request — value first',
      text: 'Hi [Name] — I follow your work in [market] and appreciate how you show up for your purchase clients. I\'m with Ruoff Mortgage and share recruiting insights (not pitches) for producers building long-term careers. Would love to connect.'
    },
    {
      title: 'Connection request — mutual respect',
      text: 'Hi [Name] — your production consistency in [market] stood out. I help LOs explore platform fit when timing is right — zero pressure. Open to connecting?'
    },
    {
      title: 'Follow-up DM after connect',
      text: 'Thanks for connecting, [Name]. No agenda today — I share occasional content on ops support and career growth for purchase-focused producers. If you\'re ever curious what leadership support looks like at Ruoff, happy to facilitate a short clarity call.'
    },
    {
      title: 'Comment on production post',
      text: 'Strong month, [Name] — purchase business at that volume is no accident. Appreciate you leading with clients first.'
    },
    {
      title: 'Re-engage after silence',
      text: 'Hi [Name] — we connected a while back. Saw your recent [post/milestone] — congrats. Still happy to be a resource if you ever want a no-pressure leadership conversation.'
    },
    {
      title: 'Invite to exec call (soft)',
      text: 'Based on what you\'ve built, I think a 20-minute conversation with our leadership team could be worthwhile — not to pitch, but to give you a clear picture of platform and support. Open to it?'
    }
  ],
  execCallPrep: {
    preCallChecklist: [
      'Review Shape notes — last touch, tier (A/B/C), and any objections logged',
      'Confirm production: units, purchase %, tenure at current shop',
      'Prepare one specific compliment tied to their business (not generic)',
      'Have 2–3 discovery questions ready — let them talk first',
      'Know the leadership value prop: low-risk, clarity-focused, not a hard pitch',
      'Calendar link ready + backup times if they hesitate'
    ],
    duringCallReminders: [
      'Open with neutral warmth — not a pitch in the first 60 seconds',
      'Acknowledge their current situation before exploring "what would have to be true"',
      'If happy/not looking: validate, then one strong discovery question minimum',
      'Position leadership call as clarity, not commitment',
      'End with clear next step + permission for future touch'
    ],
    postCallDebrief: [
      'Log every detail in Shape within 30 minutes — non-negotiable',
      'Send same-day thank-you text or LinkedIn message referencing something specific they said',
      'Schedule nurture touch if not ready (30-day / 90-day / 6-month)',
      'If exec call booked: send prep note to leadership with candidate context',
      'If declined: note reason and re-rank tier — no guilt follow-ups'
    ]
  }
};