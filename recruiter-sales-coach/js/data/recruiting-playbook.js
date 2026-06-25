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
    spouseFamily: {
      label: 'Need to talk to my spouse or family first',
      questions: [
        'Out of curiosity, what do you think they\'ll want to know before you move forward?',
        'Is there anything you\'re personally unsure about that you want their input on?',
        'Aside from talking it over with them, is there anything else holding you back?',
        'If they were fully on board, would you feel comfortable moving forward?',
        'What do you think they would be most concerned about?',
        'Would it help if I gave you a few key pointers you can share with them?',
        'What part of this opportunity are you still weighing?',
        'You mentioned earlier you were looking for [goal] — how do you think your spouse would feel about that?',
        'Do you think they\'d be supportive of you exploring something that could help with [pain point]?'
      ]
    },
    ratesMarket: {
      label: 'Waiting to see what happens with rates and the market',
      questions: [
        'What specifically would you need to change before you felt it\'s the right time?',
        'What would that timeline look like realistically?',
        'Some of the best times to explore something new are when things feel uncertain.',
        'If you start learning about us now, you\'re positioned ahead of everyone that waited.',
        'Does waiting move you closer to your goals or keep things the same?',
        'If nothing changes over the next 6–12 months, how would you feel about staying where you are?',
        'Instead of jumping all in, we\'re looking at this as getting educated and exploring while the market plays out.',
        'Aside from the market conditions, what is holding you back?',
        'If the market felt stable today, would you feel ready to move forward?'
      ]
    },
    clientsReferrals: {
      label: 'Worried about how my clients and referral partners would react',
      questions: [
        'What do you think they might be concerned about?',
        'Is it more about how it would look or how it might impact your business directly?',
        'Aside from that concern, is there anything else holding you back?',
        'If you knew clients would be supportive, would this feel like a no-brainer?',
        'When it\'s framed as expanding how you help clients, it tends to strengthen credibility, not hurt it.'
      ]
    },
    benefitsComp: {
      label: 'Don\'t want to lose my benefits or compensation structure',
      questions: [
        'Totally fair — what specifically about your current comp/benefits would you want to make sure is matched or improved?',
        'If you could maintain — or improve — that piece, would you be open to exploring?',
        'How often do you review if your current structure is still the best available?',
        'How confident are you that what you have today is the most competitive option in the market?',
        'Have you ever seen a structure that made you rethink what\'s possible?',
        'What would an ideal comp/benefit setup look like if you could design it?'
      ]
    },
    recruitersReachOut: {
      label: 'Recruiters reach out all the time',
      questions: [
        'I believe that — what usually makes you actually take a deeper look vs. ignore it?',
        'Out of curiosity, has anyone shown you something meaningfully different, or does it all sound the same?',
        'What would have to be different for it to be worth 10 minutes of your time?',
        'What do most recruiters miss when they reach out to you?',
        'Has anyone taken the time to really understand your business before pitching you?',
        'What would make a conversation like this actually valuable instead of repetitive?'
      ]
    },
    alreadyKnowWhere: {
      label: 'I already know where I\'d go if I ever left',
      questions: [
        'That\'s great — what do you like about them?',
        'Have you actually compared that option side-by-side with others recently?',
        'If something aligned even better with what you want long-term, would you want to at least be aware of it?',
        'How long ago did you make that decision?',
        'What would have to change for you to reconsider that option?',
        'Have you seen everything they offer recently or just going off past info?'
      ]
    },
    noDifference: {
      label: 'I don\'t think a different company would make much of a difference',
      questions: [
        'What drives that feeling — have you seen similar setups everywhere you\'ve looked?',
        'If you could change one thing, what would it be?',
        'At what point would you consider exploring — what would have to shift?',
        'What would you need to see to change your mind?',
        'Where do you feel your current setup falls short, if anywhere?',
        'Do you think small differences compound over time in your business?'
      ]
    },
    happyWhereAt: {
      label: 'Happy where I\'m at',
      questions: [
        'That\'s a good place to be — what do you enjoy most about it?',
        'If you could change one thing, what would it be?',
        'At what point would you consider exploring — what would have to shift?',
        'What\'s made you stay as long as you have?',
        'Do you ever explore options just to benchmark where you\'re at?',
        'If a better opportunity existed, how would you want to find out?'
      ],
      responses: [
        'I completely understand. At the same time, with the kind of production you\'re putting up, I\'d argue you owe it to yourself to put as much weight on the platform and long-term support as you do on the sign-on bonus. When someone\'s operating at a high level, the upfront number becomes less of a deciding factor than whether the infrastructure can actually help sustain and grow that success.',
        'I respect that. A lot of strong producers we talk to feel the same way initially. What we\'ve found is that taking a short conversation with senior leadership often gives people real clarity — even if they ultimately decide to stay where they are.',
        'Fair enough. With everything you have going on, it makes sense to be selective. That\'s exactly why I think a quick conversation with our leadership team would be worthwhile. They can speak directly to what support and structure look like here, so you can make the best decision for your situation.'
      ]
    },
    tooBusy: {
      label: 'Too busy',
      questions: [
        'Totally get it — does that usually mean things are going really well, or just a packed schedule?',
        'If something could actually help you scale or create more breathing room, would it be worth a quick look?',
        'Is it time, or just not a priority yet?',
        'How often do your clients push back on pricing today?',
        'Do you feel like pricing ever limits your ability to win deals?',
        'If pricing could be leveraged more strategically, how would that impact your business?'
      ]
    },
    enjoysPricing: {
      label: 'Enjoys current pricing',
      questions: [
        'That\'s great — how often do you revisit whether it\'s still the most competitive option?',
        'If there were ways to increase margin without hurting competitiveness, would that be valuable?',
        'What matters more to you — price, or overall value to your clients?',
        'How often do your clients push back on pricing today?',
        'Do you feel like pricing ever limits your ability to win deals?',
        'If pricing could be leveraged more strategically, how would that impact your business?'
      ]
    },
    enjoysPrograms: {
      label: 'Enjoys current programs',
      questions: [
        'What do you feel those programs do best for you?',
        'Anything you feel they\'re missing?',
        'If there were complementary tools that enhanced what you already do, would that be worth exploring?',
        'Which programs do you feel drive the most value for your clients?',
        'Are there clients you can\'t serve well with your current setup?',
        'If you could add one thing to your programs, what would it be?'
      ]
    },
    operationalStrength: {
      label: 'Operational strength at current company',
      questions: [
        'That\'s huge — what makes them stand out?',
        'If you could keep that level of ops and improve another area, what would you focus on?',
        'Outside of ops, what impacts your business most?',
        'How much does that impact your day-to-day stress level?',
        'Have you ever experienced better — or just consistently strong?',
        'If you could replicate that and upgrade another area, where would you look?'
      ]
    },
    teamLoyalty: {
      label: 'Team loyalty / emotional tie',
      questions: [
        'That says a lot about you — what do you value most about that team?',
        'If you could grow without fully disconnecting from those relationships, would that change how you look at things?',
        'Do you see your long-term goals happening where you are now?',
        'What role does that team play in your success today?',
        'If you ever outgrew that environment, how would you recognize it?',
        'Do you feel like your current setup is built for your next level?'
      ]
    },
    timing: {
      label: 'Timing',
      questions: [
        'Totally fair — what specifically would need to change for the timing to feel right?',
        'Is that something you see changing in the next few months?',
        'Would it make sense to at least explore so you\'re ready when timing is right?',
        'What\'s making timing feel off right now specifically?',
        'Does waiting change the opportunity or just delay the decision?',
        'Would you rather be reactive to timing or prepared for it?'
      ],
      responses: [
        'I completely get that. A lot of people in that situation still find value in understanding what else is out there, especially when they\'re early in a new role. Would you be open to a short conversation with our leadership team just to learn what we have to offer?',
        'Totally fair. Since you\'re still getting settled, I won\'t push. That said, I\'d love to keep the door open. Would you be okay if I reached back out in a few months to see how things are going?'
      ]
    },
    lovesBroker: {
      label: 'Loves being a broker',
      questions: [
        'What about being a broker is most fulfilling for you?',
        'Do you feel like you\'re maximizing that position where you are?',
        'If you could expand your influence beyond that, would that interest you?'
      ]
    },
    autonomy: {
      label: 'Autonomy at current company',
      questions: [
        'What does autonomy look like for you day-to-day?',
        'Have you felt limited at all, or fully supported?',
        'If you could keep autonomy but gain more support/resources, would that matter?',
        'Where do you feel most in control of your business today?',
        'Are there any hidden constraints you\'ve just adapted to?',
        'If you had even more leverage without losing control, what would that look like?'
      ]
    },
    notInterested: {
      label: 'Not interested',
      questions: [
        'Is it the timing or the opportunity itself?',
        'What typically would get your attention?',
        'What would make something interesting to you?',
        'Is it about timing or not seeing enough value yet?'
      ]
    },
    wrongFit: {
      label: 'Company isn\'t the right fit for them',
      questions: [
        'What makes something feel like the right fit for you?',
        'What have you seen so far that makes it feel off?',
        'If those concerns were addressed, would it change your view?',
        'What defines "fit" for you at this stage in your career?',
        'What would a perfect fit actually look like day-to-day?',
        'Do you feel you\'ve seen the full picture or just part of it?'
      ]
    },
    heardBadThings: {
      label: 'I\'ve heard bad things',
      questions: [
        'What specifically have you heard?',
        'How much of that do you feel you\'ve been able to verify?',
        'If you found out the reality was different, would you be open to taking a fresh look?',
        'How much weight do you usually give to what you hear vs. what you experience?',
        'Was that from someone you trust or just general chatter?',
        'Would it be worth getting a firsthand look to validate that?'
      ]
    },
    lovesPnL: {
      label: 'I love being on a P&L',
      questions: [
        'How often do you compare your current P&L to other models?',
        'If there was a way to improve margin or reduce expense, what would that need to look like for you?',
        'What trends are you seeing in your P&L over the last 12–24 months?',
        'Where do you see an opportunity for improvement?',
        'Have you stress-tested your model against other options recently?'
      ]
    },
    hesitantOnLeadership: {
      label: 'Hesitant on leadership meeting',
      questions: [
        'What specifically makes a leadership conversation feel like a big step right now?',
        'Is it time, fear of a hard pitch, or something else?',
        'What would need to be true for a 20-minute clarity call to feel worthwhile?'
      ],
      responses: [
        'I understand it can feel like a big step. At the same time, with the production level you\'re at, our overall compensation and support structure would be well north of a standard sign-on offer. The real question is whether the platform can actually help you hit your bigger goals long-term. A short conversation with leadership is the best way to get clarity on that.',
        'No pressure at all. Many people we speak with aren\'t actively looking but still find it valuable to understand what\'s possible elsewhere. Our leadership team is very good at having honest, no-pressure conversations about exactly that.'
      ]
    }
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