/**
 * Ruoff Recruiting Plan 2026 — structured ops data for the recruiting coach.
 * Source: Ruoff Recruiting Plan 2026_Final EXTENDED (+ prior plan text / tool summary).
 */
window.RECRUITING_PLAN_2026 = {
  annualGoal: 60,
  /** Working-capacity funnel (gross) so ~60 net survives attrition */
  grossHireCapacity: 85,
  planTitle: 'Ruoff Mortgage Loan Officer Recruiting Plan 2026',
  planOverview:
    'A structured, multi-channel approach to attracting top-performing Loan Officers to Ruoff Mortgage. Built on a relationship-first philosophy, it combines strategic candidate sourcing and outreach, authentic social media presence, and ongoing collaboration with Area Managers.',
  vision: {
    headline: 'Dominant in every market we enter. Clear #1 in Midwest purchase share.',
    statement:
      'Our vision is simple but ambitious: We want to be the dominant mortgage company in every market we enter and become the clear #1 in purchase market share across the Midwest.',
    how:
      'We’ll achieve this by giving elite loan officers the autonomy they want, the technology and support they need, and a true family culture that actually backs them. At Ruoff, you don’t have to choose between high production and a great life — you get both. We’re building something special, and we’re looking for high-performing professionals who want to be part of it.',
    shortLine:
      'Autonomy + technology + family culture — high production and a great life. No false choice.'
  },
  pillars: [
    { num: 1, title: 'Candidate Sourcing', frequency: 'Weekly', goal: 'Identify qualified prospects at 30–70 units, 50%+ purchase' },
    { num: 2, title: 'Outreach & Messaging', frequency: 'Weekly + bi-monthly value content', goal: 'Relationship-first engagement across phone, text, LinkedIn, Facebook' },
    { num: 3, title: 'Social Media Strategy', frequency: '3–4×/week', goal: '80% personal / 20% Ruoff — attract LO prospects authentically' },
    { num: 4, title: 'Area Manager Collaboration', frequency: 'Monthly', goal: 'Pipeline alignment, market intel, coordinated recruiting (Clint + Adam participate)' },
    { num: 5, title: 'Weekly Meetings with Adam', frequency: 'Mon + Wed', goal: 'Accountability, call review, role-play, prospect planning' },
    { num: 6, title: '2026 Goal & Trackable Metrics', frequency: 'Daily / weekly / monthly', goal: '60 net hires via funnel discipline in Shape (~85 gross capacity)' }
  ],
  keysToSuccess: [
    'Consistency: Momentum is built through repetition and reliability.',
    'Human First: Every interaction starts with real human care, empathy, and connection — before any pitch or process.',
    'Authenticity: Be genuine!',
    'Relationships First: Every touchpoint leads with value, not a pitch.',
    'Input: Every meeting, prospect, and conversation gets input into Shape so nothing drops.',
    'Speed: Timely follow-up after events or active conversations is non-negotiable.',
    'Market Awareness: Intel gathered in Area Manager meetings directly shapes your timing and messaging.',
    'AI as an Enhancer: AI tools refine, analyze, and coach. Relationships remain the core.',
    'The Long Game: Convert as quickly as possible when the window is open — and keep building brand recognition and genuine relationships until that window appears. Not every conversation is an immediate move; every meaningful touchpoint gets us closer.'
  ],
  aiToolsInPlan: [
    { name: 'Recruiter Sales Coach', purpose: 'Content, scripts, blog generation, coaching, voice roleplay, call review' },
    { name: 'AI (messaging)', purpose: 'Draft polish, tone clarity, engagement rating, pitch-free filter' },
    { name: '“What’s It Really Like at Ruoff” Survey', purpose: 'Peer social proof for outreach, social, and live recruiting calls' }
  ],
  sourcingTools: [
    { name: 'Cotality / Marketrac', note: 'Primary weekly sourcing tool' },
    { name: 'Model Match', note: 'LO production data and analytics' },
    { name: 'MMI (Mortgage Market Intelligence)', note: 'Market-level LO performance data' },
    { name: 'Hunter', note: 'Clint-built LO sourcing / research dossiers' },
    { name: 'Executive / AM / Branch collab', note: 'Warm intros and market intel' },
    { name: 'Shape CRM', note: 'Log every prospect — system of record' }
  ],
  mondaySourcingChecklist: [
    'Review Shape pipeline — hot, warm, long-game tiers current?',
    'Run Marketrac / Model Match / MMI / Hunter for 30–70 unit, 50%+ purchase producers',
    'Add new prospects to Shape with tier (A/B/C) and source notes',
    'Flag 10–15 priority names for Tue–Thu phone blocks',
    'Coordinate with Area Managers on any warm introductions',
    'Block Tue–Thu outreach on calendar before the week fills up'
  ],
  outreachContentTypes: [
    {
      id: 'sales-tips',
      label: 'Sales Tips',
      cadence: 'Weekly rotation (~1 value message/week)',
      description: 'Actionable, value-add tips to help LOs grow their business — pitch-free.',
      promptHint: 'Write a short, copy-paste-ready Sales Tip message for a loan officer prospect. Actionable business advice. No recruiting pitch. Warm and helpful.'
    },
    {
      id: 'friday-funny',
      label: 'Friday Funny',
      cadence: 'Weekly rotation (~1 value message/week)',
      description: 'Lighthearted, personable content to stay top of mind.',
      promptHint: 'Write a short Friday Funny text or DM — light, human, memorable. No hard sell. Appropriate for a recruiter who knows this LO casually.'
    },
    {
      id: 'value-add',
      label: 'Value-Add Message',
      cadence: 'Weekly rotation (~1 value message/week)',
      description: 'Intentional message with something useful or insightful — not a sales pitch.',
      promptHint: 'Write a value-add outreach message — market insight, ops tip, or career growth thought. Genuinely helpful, zero pitch pressure.'
    }
  ],
  amMeetingParticipants: 'Clint Morgan and Adam Garman join the monthly Area Manager group sessions.',
  amMeetingAgenda: [
    {
      topic: 1,
      title: 'Office Needs & Current Openings',
      question: 'What are the biggest needs within your offices right now? Include current openings and which branches they tie to.'
    },
    {
      topic: 2,
      title: 'Active Candidate Conversations',
      question: 'Are there active conversations with potential candidates by you or your Branch Managers?'
    },
    {
      topic: 3,
      title: 'Top Recruiting Prospects & Key Relationships',
      question: 'Who are the top recruiting prospects or relationships worth focusing on right now in your market?'
    },
    {
      topic: 4,
      title: 'Competitor Activity & Market Intelligence',
      question: 'Any recent competitor activity, LO movement, or market changes that create recruiting opportunities?'
    },
    {
      topic: 5,
      title: 'Upcoming Networking & Community Events',
      question: 'Any networking events, conferences, association meetings, or community activities in the next month worth attending?'
    }
  ],
  territories: [
    { recruiter: 'Krista Kenney', region: 'Ohio & Kentucky', areaManagers: 'Dave Scully, Jack Hammons, Matt Koch' },
    { recruiter: 'Maggie Stockwell', region: 'Michigan & Indiana', areaManagers: 'Teresa Shultz-Miller, Ryan Frantz, David Foley' }
  ],
  adamMeetings: {
    monday: {
      title: 'Monday — Weekly Review & Strategy',
      items: [
        'Review calls from prior week — what worked, what needs adjustment',
        'Discuss results vs weekly scorecard (outreach, quality convos, exec calls)',
        'Review monthly funnel progress toward 60 net hires',
        'Refine strategy and priorities for the week ahead',
        'Set non-negotiable Tue–Thu phone blocks'
      ]
    },
    wednesday: {
      title: 'Wednesday — Development & Prospect Planning',
      items: [
        'Role-play exercises — objection handling, leadership call asks',
        'Build plans for high-priority prospects (exec call path)',
        'Work through challenging situations or stalled conversations',
        'Prep for upcoming leadership conversations',
        'Sharpen conversion from outreach → quality conversations'
      ]
    }
  },
  surveySnippets: [
    {
      quote: 'The combination of strong operational support, efficient processes, and direct access to decision-makers has removed friction and allowed me to scale production while maintaining service quality.',
      attribution: 'Nick Staker, Senior Loan Officer'
    },
    {
      quote: 'Growth may define our journey, but heart is what defines Ruoff.',
      attribution: 'Samantha Conrad, Senior Loan Officer — 17 years with Ruoff'
    },
    {
      quote: 'Leadership accessibility and operational support were the biggest factors in my decision.',
      attribution: 'Ruoff LO Survey — "What influenced your decision?"'
    },
    {
      quote: 'White-glove onboarding and a team that actually answers the phone changed everything for my transition.',
      attribution: 'Ruoff LO Survey — peer perspectives'
    }
  ],
  rolePlayScenarios: [
    'Ice-breaking opener — bring their walls down in the first 60 seconds of a cold call',
    'Candidate says "I\'m happy where I\'m at" / "not interested in leaving" — respectfully move toward a leadership clarity conversation',
    'Ask for an executive leadership call with Clint or Adam — low-pressure framing when they hesitate',
    'Candidate mentions they just started somewhere new — long-game nurture + permission to follow up',
    'Warm prospect went quiet after a good call — gentle re-engagement',
    'Discovery call — practice letting them talk 70% of the time'
  ],
  pillarDetails: {
    1: {
      northStar: 'Every week starts with fresh names in Shape — purchase-focused producers you can actually have a real conversation with. Sourcing is not busywork; it fuels Tuesday–Thursday phones.',
      rhythm: 'Monday morning (45–60 min): market search → Hunter research → Shape tiering → flag Tue–Thu call list. Markets outside Indiana often need the most intentional sourcing time.',
      checklist: [
        'Search target markets for LOs in the 30–70 unit range (sweet spot for A-tier: 40–60 self-generated purchase business)',
        'Run Marketrac / Model Match / MMI, then Hunter for individual dossiers or batch dossiers (10+ candidates)',
        'Review Hunter output for conversation angles — production mix, career notes, market context',
        'Add every viable name to Shape with tier (A/B/C), source, and one-line angle',
        'Flag 10–15 priority names for Tue–Thu phone blocks',
        'Block Tue–Thu outreach on your calendar before the week fills up'
      ],
      tierGuide: {
        A: 'Engaged with us OR strong fit: 40–60 loans/year, self-generated business, purchase-focused, real conversation potential',
        B: 'Meets criteria but cold or early-stage — nurture with value touches',
        C: 'Long-game — right profile but wrong timing; stay present, no pressure'
      },
      pitfalls: [
        'Spending Monday on "other stuff" instead of filling the Tue–Thu call list',
        'Chasing extremely low producers or LOs with little/no purchase business',
        'Involving too many people too early — most conversations should continue with Adam or Clint first',
        'Skipping Shape logging — if it is not in Shape, it did not happen'
      ],
      redFlags: [
        'Extremely low annual production',
        'Very little to no purchase business',
        'Bank or credit union LOs who rely on branch/retail flow vs self-generated purchase (not automatic disqualifiers — just harder fits for our model)'
      ],
      hunterNote: 'Hunter (Clint-built AI sourcing agent) produces individual LO research dossiers and batch dossiers for 10+ candidates. Use it after initial market search to walk into Tue–Thu calls with real context.',
      examples: [
        {
          situation: 'Hunter flags a Columbus producer at 52 units, 68% purchase, mostly self-generated',
          angle: 'Open with curiosity about purchase ops support and leadership access — not a job pitch. Log dossier notes in Shape before you dial.'
        }
      ],
      ruoffAngles: ['Ideal LO Candidate Profile', 'Operations & closing speed', 'Culture & leadership access'],
      metrics: 'Weekly: new prospects added to Shape + 10–15 names queued for Tue–Thu. Quality of list matters more than volume of bad fits.',
      actions: [
        { label: 'Monday Sourcing Checklist', tab: 'sourcing' },
        { label: 'Build Weekly Plan', section: 'weekly-win-plan' },
        { label: 'Ruoff Fact Vault', section: 'ruoff-fact-vault' }
      ]
    },
    2: {
      northStar: 'Relationship-first outreach — every touch delivers value before any recruiting conversation. Phones win Tue–Thu; one weekly value message keeps you top of mind between calls.',
      rhythm: 'Tue–Thu: 2–3 protected phone blocks (60–90 min each) toward ~270 weekly outreach attempts. Rotate one Sales Tip / Friday Funny / Value-Add message per week (not three blasts). Log every meaningful touch in Shape.',
      checklist: [
        'Open Tue–Thu with your A-tier and warm B-tier list from Monday sourcing',
        'Between blocks: log outcomes, objections, and follow-up dates in Shape',
        'Send one pitch-free value message this week (rotate content type)',
        'Move quality conversations toward an executive leadership call with Clint or Adam',
        'Loop Area/Branch managers in only when a hire is actually progressing — fewer cooks, better conversion'
      ],
      pitfalls: [
        'Letting rejection shut down the week — this job is full of "no" and competition is fierce',
        'Leading with Ruoff comp, sign-on, or "we\'re hiring" before rapport exists',
        'Treating LinkedIn, text, and phone as interchangeable — match channel to relationship stage',
        'Skipping follow-up speed after a good conversation'
      ],
      pitchFreeFails: [
        'Mentions compensation, sign-on bonus, or "open role" in the first touch',
        'Reads like a mass blast with no personal detail',
        'Asks them to send a resume before you have earned curiosity',
        'Uses corporate language instead of human, peer-to-peer tone'
      ],
      channelGuide: [
        { channel: 'Phone (Tue–Thu priority)', use: 'New outreach, moving warm prospects, asking for leadership clarity calls' },
        { channel: 'Text', use: 'Concise follow-ups, Friday Funny, quick value drops after a real conversation' },
        { channel: 'LinkedIn', use: 'Professional cold open, sharing useful content, connecting with prospects you have researched' },
        { channel: 'Facebook', use: 'Warmer relationship-based outreach — often after social familiarity' }
      ],
      examples: [
        {
          situation: '"I\'m happy where I\'m at" / "Not interested in leaving"',
          good: '"Totally fair — most strong producers are. I\'m not asking you to move. I\'d love 15 minutes with our leadership so you have a real picture of how we operate if your situation ever changes. Would that be unreasonable?"',
          bad: '"We have an amazing opportunity at Ruoff with great comp — you should really take a look."'
        },
        {
          situation: 'Cold text after researching their market',
          good: '"Saw your purchase volume in [market] — no pitch. Genuinely curious how ops support has been on turn times lately. Worth a quick compare note?"',
          bad: '"Hey! Ruoff Mortgage is hiring top LOs. Interested in learning more about our platform?"'
        }
      ],
      ruoffAngles: ['How to talk about Ruoff+ with LO prospects', 'Operations & closing speed', 'Culture & leadership access'],
      metrics: '~270 outreach attempts/week • 24–25 quality conversations • 4.8–5.1 executive calls scheduled',
      actions: [
        { label: 'Generate Outreach Message', tab: 'outreach' },
        { label: 'Script Generator', section: 'recruiting-script' },
        { label: 'Weekly Recruiting Plan', section: 'weekly-win-plan' }
      ]
    },
    3: {
      northStar: '80% personal, 20% Ruoff — prospects follow people, not corporate pages. Consistent, authentic posts build familiarity and brand recognition until the right window opens.',
      rhythm: '3–4 posts/week across Facebook + LinkedIn. 15–20 new LO prospect connections/week. Weekends = personal/rest content only — not recruiting hustle posts.',
      checklist: [
        'Post 3–4× this week — majority personal (family, hobbies, community, values)',
        'Add 15–20 new LO connections with a short personal note (not a pitch)',
        'Sprinkle Ruoff culture, survey proof, or ops highlights (~20% of content)',
        'When someone engages meaningfully, note it in Shape and follow up human-to-human',
        'Paid Facebook ads only when strategically warranted — not a default for everyone'
      ],
      pitfalls: [
        'Corporate-only recruiting posts that feel like HR announcements',
        'Inconsistent posting — then bursts of 10 posts in one week',
        'Using weekends for "go prospect" or networking captions instead of authentic life content',
        'Expecting every post to convert — social is the long game'
      ],
      examples: [
        {
          situation: 'Personal post that builds connection',
          good: 'Family milestone, community event, hobby, or values moment — zero pitch. Comment replies become warm outreach later.',
          bad: '"We\'re growing! Join Ruoff Mortgage — best comp in the industry!" with a stock graphic.'
        }
      ],
      ruoffAngles: ['Social content rule for recruiters', 'Culture & leadership access'],
      metrics: '3–4 posts/week • 15–20 new social connections/week • Track inbound DMs/comments as bonus pipeline signals',
      actions: [
        { label: 'Social Post Creator', section: 'social-post' },
        { label: 'Survey Proof → Social', tab: 'survey' },
        { label: 'Recruiting Content', section: 'blog' }
      ]
    },
    4: {
      northStar: 'Monthly AM meetings turn market intelligence into recruiting timing — leadership changes, mergers, and operational pain create windows you cannot see from Shape alone.',
      rhythm: 'Monthly group session with all Area Managers (Clint + Adam participate). Prep 15 min before; update Shape + Tue–Thu priorities within 24 hours after.',
      checklist: [
        'Review Shape pipeline and note which prospects tie to which branches/markets',
        'Prep answers for all 5 agenda topics — especially competitor movement and top relationships',
        'Capture intel on leadership changes, mergers, operational struggles, and branch openings',
        'After meeting: update Shape notes, adjust A/B tiers, and share hot intel with Adam/Clint',
        'Prioritize markets that need lift — especially outside Indiana (OH, KY, MI focus)'
      ],
      pitfalls: [
        'Showing up without notes — wastes the group\'s time',
        'Failing to translate intel into a specific call list for the next 2 weeks',
        'Looping AMs into candidate conversations too early instead of keeping momentum with leadership'
      ],
      examples: [
        {
          situation: 'AM shares a competitor branch struggling with turn times after a leadership change',
          action: 'Pull affected LO names from Hunter/Marketrac, tier in Shape, and lead Tue–Thu calls with ops curiosity — not "your company is failing."'
        }
      ],
      territoryNote: 'Ohio, Kentucky, and Michigan often need more intentional recruiting focus than Indiana. Use AM intel to concentrate sourcing and outreach where the opportunity is hottest.',
      ruoffAngles: ['Operations & closing speed', 'Culture & leadership access'],
      metrics: 'Monthly: 5 topics covered • actionable intel logged • at least 3 prospect priority shifts per meeting',
      actions: [
        { label: 'AM Meeting Notes', tab: 'am' },
        { label: 'Monday Sourcing', tab: 'sourcing' },
        { label: 'Weekly Plan', section: 'weekly-win-plan' }
      ]
    },
    5: {
      northStar: 'Monday sets the week\'s direction from real activity data. Wednesday sharpens skills so rejection does not own the funnel. Adam leads with empathy when needed — and always pushes toward better sales technique.',
      rhythm: 'Monday: prior-week call review + scorecard vs targets + strategy for the week. Wednesday: role-play, objection work, and high-priority prospect planning.',
      checklist: [
        'Monday — bring Shape activity summary, notable calls, and where you felt stuck',
        'Monday — agree on Tue–Thu non-negotiable blocks and monthly funnel check-in',
        'Wednesday — role-play: ice-breaking, "happy where I\'m at," and leadership call asks',
        'Wednesday — workshop 1–2 live stalled prospects and plan the next touch',
        'Log coaching takeaways in Shape or weekly notes — apply before next dial session'
      ],
      pitfalls: [
        'Showing up to Monday without reviewing your own calls first',
        'Treating Wednesday as optional when conversions are slipping',
        'Confusing polite brush-offs with quality conversations (see below)',
        'New recruiters spreading focus across everything except outreach activity'
      ],
      qualityConversation: {
        yes: 'Two-way dialogue — they share real friction (ops, leadership, support), ask you questions back, and agree to a concrete next step (follow-up, leadership call, deeper discovery)',
        no: 'Short polite answers, no curiosity, "I\'m all set" with no opening — log as outreach attempt, nurture lightly, try again in 30–90 days'
      },
      adamCoaching: 'Hard job, significant rejection, serious competition — Adam balances empathy with motivation. Expect sales tactics, objection drills, role-play, and collaborative new ideas when you are behind; reinforcement and refinement when you are on track.',
      ruoffAngles: ['2026 Recruiting Funnel', 'How to talk about Ruoff+ with LO prospects'],
      metrics: 'Weekly scorecard review every Monday • Wednesday role-play when conversion slips below 8–10% outreach→quality',
      actions: [
        { label: 'Adam Weekly Agenda', tab: 'adam' },
        { label: 'Practice in Script Generator', section: 'recruiting-script' },
        { label: 'Weekly Scorecard', section: 'weekly-win-plan' }
      ]
    },
    6: {
      northStar: '60 net hires is the finish line — work the funnel backwards with discipline in Shape. Gross hires minus attrition is why the annual funnel shows ~85 hires to land 60 net.',
      rhythm: 'Daily: log touches. Weekly: scorecard (Mon with Adam). Monthly: dashboard review — hires, net headcount, and funnel adjustments.',
      checklist: [
        'Track weekly: outreach attempts, quality conversations, exec calls scheduled/completed',
        'Compare to targets: 270 outreach • 24–25 quality convos • 4.8–5.1 exec scheduled • 3.6–3.8 exec completed',
        'Monthly: hires secured + net headcount change (goal ~7 net hires/month)',
        'If below ~80% of weekly targets for 2+ weeks — coaching conversation on tactics, not guilt',
        'Celebrate momentum — consistency compounds'
      ],
      pitfalls: [
        'Watching only hires and ignoring leading indicators (outreach, quality convos)',
        'Explaining away a soft week without changing Tue–Thu block protection',
        'Forgetting attrition — 85 gross hires at ~25 departures = 60 net'
      ],
      funnelExplain: 'If we lose ~25 LOs over the year, we need ~85 gross hires to hit 60 net. The funnel table shows gross activity required; net headcount is the score that matters.',
      coachingThreshold: 'On pace: hitting weekly outreach and quality conversation targets most weeks. Coaching trigger: sustained shortfall (~80% or below) for 2+ consecutive weeks on outreach or quality conversations — focus shifts to call technique, list quality, and role-play.',
      monthlyReview: 'Adam facilitates during Monday meetings: review outreach, quality conversations, executive calls, hires secured, and net headcount. Decide what to double down on, what to stop, and which prospects need executive path attention.',
      ruoffAngles: ['2026 Recruiting Funnel (Shape is system of record)'],
      metrics: 'Annual: 60 net hires • Monthly: ~7 net • Weekly: 270 / 24–25 / 4.8–5.1 exec scheduled',
      actions: [
        { label: 'Monthly Tracker', tab: 'monthly' },
        { label: 'Weekly Recruiting Plan', section: 'weekly-win-plan' },
        { label: 'Recruiting Playbook', section: 'recruiting-playbook' }
      ]
    }
  }
};