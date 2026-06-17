/**
 * Mindset Lab – Interactive toolkit for recruiter mindset
 * Premium card-based experience with unified "My Saved Items" integration.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'socialSavedIdeas';

  const categories = [
    "Resilience & Rejection",
    "Daily Discipline",
    "Relationship Philosophy",
    "Self-Belief & Confidence",
    "Prospecting Psychology",
    "Growth & Long-term Thinking",
    "Value-First Mindset"
  ];

  // Expanded high-value, loan-officer-specific content (Big expansion v2 — includes best of classic sales quotes + many new LO-specific items)
  let mindsetItems = [
    // === RESILIENCE & REJECTION (16) ===
    { id: "res-1", category: "Resilience & Rejection", content: "Every “no” gets you closer to a “yes.” The top producers simply hear more nos than everyone else.", source: "Classic Sales Truth", action: "Track your 'No' count this week. Celebrate the number — it means you're in the game." },
    { id: "res-2", category: "Resilience & Rejection", content: "Rejection is not a reflection of your worth. It is feedback about timing, fit, or communication.", source: "Mindset Lab Original", action: "After every 'no' this week, write one sentence about what you learned instead of how it felt." },
    { id: "res-3", category: "Resilience & Rejection", content: "The loan officer who wins is usually the one who simply refuses to quit after the 7th follow-up.", source: "Industry Pattern", action: "Pick your toughest current file and commit to one more high-value touch today." },
    { id: "res-4", category: "Resilience & Rejection", content: "Your job is not to avoid hearing no. Your job is to make 'no' meaningless by having so many conversations that the nos become background noise.", source: "Mindset Lab Original", action: "Set a daily conversation target (calls + texts + in-person) and hit it regardless of outcomes." },
    { id: "res-5", category: "Resilience & Rejection", content: "Slow markets don’t create slow producers. Slow producers create slow markets in their own mind.", source: "Mindset Lab Original", action: "Write down the three market complaints you hear yourself saying most. Reframe each as an opportunity." },
    { id: "res-6", category: "Resilience & Rejection", content: "The difference between a bad day and a good story is usually 48 hours and one more call.", source: "Mindset Lab Original", action: "End every difficult day by scheduling tomorrow’s first three prospecting activities before you leave." },
    { id: "res-7", category: "Resilience & Rejection", content: "You don’t lose deals because of rates. You lose them because you stopped adding value after the first objection.", source: "Referral Partner Truth", action: "On your next rate objection, lead with a specific value move (equity scan, pre-approval speed, partner intro) instead of defending the rate." },
    { id: "res-8", category: "Resilience & Rejection", content: "Top producers get rejected at the same rate as everyone else. They just interpret it as data, not drama.", source: "Mindset Lab Original", action: "After your next three rejections, ask yourself: 'What did this teach me about my process or positioning?'" },
    { id: "res-9", category: "Resilience & Rejection", content: "Every “no” closer to “yes.”", source: "Classic Sales Truth", action: "Say this out loud after your next rejection and immediately schedule the next conversation." },
    { id: "res-10", category: "Resilience & Rejection", content: "Failure is success in progress.", source: "Antoine de Saint-Exupéry", action: "At the end of a tough day, write down one thing that went wrong and one thing it taught you." },
    { id: "res-11", category: "Resilience & Rejection", content: "Doubt kills more dreams than failure.", source: "Classic", action: "When you feel doubt creeping in, call one person on your list within the next 10 minutes." },
    { id: "res-12", category: "Resilience & Rejection", content: "The harder you work, the luckier you get.", source: "Classic", action: "When a deal falls through, immediately book two new appointments the same day." },
    { id: "res-13", category: "Resilience & Rejection", content: "Start to be great.", source: "Classic", action: "Pick the one activity you’ve been putting off and do the first 5 minutes of it right now." },
    { id: "res-14", category: "Resilience & Rejection", content: "Turn obstacles into opportunities; hustle beats talent.", source: "Motivational", action: "Identify the biggest obstacle in your pipeline today and turn it into a reason to reach out to that client or partner." },
    { id: "res-15", category: "Resilience & Rejection", content: "Be so good they can’t ignore you.", source: "Classic", action: "This week, do one thing for a past client or partner that is noticeably above average." },
    { id: "res-16", category: "Resilience & Rejection", content: "Hustle beats talent when talent doesn’t hustle.", source: "Classic", action: "Audit your last 7 days. Where did you coast? Replace one coasting day with a full hustle day this week." },

    // === DAILY DISCIPLINE (18) ===
    { id: "dis-1", category: "Daily Discipline", content: "Motivation is fleeting. Discipline is the decision you make when motivation is gone.", source: "Core Principle", action: "Pick one non-negotiable daily activity (prospecting block, follow-up calls, etc.) and protect it like a client appointment." },
    { id: "dis-2", category: "Daily Discipline", content: "The difference between where you are and where you want to be is the discipline you lack.", source: "Mindset Lab Original", action: "Choose one 15-minute activity that moves the needle and do it at the same time every day for the next 7 days." },
    { id: "dis-3", category: "Daily Discipline", content: "You will never 'find' time for the important things. You have to make time for them.", source: "Mindset Lab Original", action: "Block your first 60 minutes of every workday for revenue-generating activity before opening email or Slack." },
    { id: "dis-4", category: "Daily Discipline", content: "Consistency compounds. Inconsistency cancels.", source: "Mindset Lab Original", action: "Audit your last 10 business days. How many days had a protected prospecting block? Make it 9 out of 10 this month." },
    { id: "dis-5", category: "Daily Discipline", content: "The best loan officers don’t work harder than everyone else on the days they feel like it. They work steadily on the days they don’t.", source: "Mindset Lab Original", action: "When you don’t feel like prospecting, do the first 10 minutes anyway. Momentum usually shows up by minute 4." },
    { id: "dis-6", category: "Daily Discipline", content: "Database neglect is the most expensive habit in this business.", source: "Mindset Lab Original", action: "Today: send 5 handwritten notes or personal videos to people who have not heard from you in 90+ days." },
    { id: "dis-7", category: "Daily Discipline", content: "If it isn’t scheduled, it isn’t real. Hope is not a calendar entry.", source: "Mindset Lab Original", action: "Put every important non-urgent activity (database touches, partner lunches, content creation) on your calendar this week with a hard time block." },
    { id: "dis-8", category: "Daily Discipline", content: "Prospect daily or become obsolete.", source: "Tom Ferry", action: "Block 45 minutes on your calendar right now for prospecting tomorrow morning." },
    { id: "dis-9", category: "Daily Discipline", content: "Focus on revenue-generating activities.", source: "Tom Ferry", action: "List your top 3 revenue-generating activities. Protect time for all three this week." },
    { id: "dis-10", category: "Daily Discipline", content: "Time block for success.", source: "Tom Ferry", action: "Time-block your entire next business day before you leave today." },
    { id: "dis-11", category: "Daily Discipline", content: "Leverage technology for efficiency.", source: "Tom Ferry", action: "Pick one repetitive task this week and find a tool, template, or automation to speed it up." },
    { id: "dis-12", category: "Daily Discipline", content: "Consistent marketing builds brand.", source: "Tom Ferry", action: "Commit to publishing one piece of content on the same day every week for the next 8 weeks." },
    { id: "dis-13", category: "Daily Discipline", content: "Be disciplined in prospecting.", source: "Mike Ferry", action: "Set a minimum daily number of conversations (calls + texts) and hit it for 5 straight days." },
    { id: "dis-14", category: "Daily Discipline", content: "Build your database daily.", source: "Mike Ferry", action: "Add at least 3 new people to your database with a same-day personal note every day this week." },
    { id: "dis-15", category: "Daily Discipline", content: "Consistency creates champions.", source: "Mike Ferry", action: "Choose one daily habit and do it for the next 21 days without missing." },
    { id: "dis-16", category: "Daily Discipline", content: "Done better than perfect.", source: "Motivational", action: "Pick one task you’ve been overthinking and ship a “good enough” version today." },
    { id: "dis-17", category: "Daily Discipline", content: "Winners stay consistent unseen.", source: "Motivational", action: "Do the boring, unsexy work (follow-up, database cleaning, CRM notes) for 30 minutes today." },
    { id: "dis-18", category: "Daily Discipline", content: "Do boring work consistently for results.", source: "Motivational", action: "Identify the most boring but highest-leverage activity in your business and schedule it daily for the next two weeks." },

    // === RELATIONSHIP PHILOSOPHY (16) ===
    { id: "rel-1", category: "Relationship Philosophy", content: "People do business with those they know, like, and trust. Everything else is secondary.", source: "Buffini Philosophy", action: "Send one genuine, non-business text or note today to someone in your database." },
    { id: "rel-2", category: "Relationship Philosophy", content: "Your referral partners don’t need another lunch. They need to know you will make them look good in front of their clients.", source: "Mindset Lab Original", action: "On your next partner touch, lead with something that makes them the hero (fast pre-approval, smooth closing story, client win)." },
    { id: "rel-3", category: "Relationship Philosophy", content: "The strongest relationships are built in the spaces between transactions.", source: "Mindset Lab Original", action: "This week, reach out to three past clients with zero ask — just a market update or personal note." },
    { id: "rel-4", category: "Relationship Philosophy", content: "You don’t earn trust by being the smartest person in the room. You earn it by being the most reliable.", source: "Mindset Lab Original", action: "Pick one partner or client and over-communicate on their file this week. Make the experience feel unusually safe." },
    { id: "rel-5", category: "Relationship Philosophy", content: "The best time to plant a tree was 20 years ago. The second best time is today — for your database.", source: "Mindset Lab Original", action: "Add 5 new people to your database this week with a personal note within 24 hours of meeting them." },
    { id: "rel-6", category: "Relationship Philosophy", content: "Your sphere doesn’t care how good you are at mortgages. They care how often you show up when you don’t need anything.", source: "Mindset Lab Original", action: "Schedule three 'value only' touches this week (article, local event, family photo, market insight)." },
    { id: "rel-7", category: "Relationship Philosophy", content: "Referral partners stay loyal to the loan officer who makes their life easier, not the one who buys the most lunches.", source: "Mindset Lab Original", action: "Ask one of your top referral partners: 'What would make working with me easier for you and your clients?' Then do it." },
    { id: "rel-8", category: "Relationship Philosophy", content: "Relationships over transactions.", source: "Ricky Carruth", action: "On your next three conversations, focus entirely on the other person for the first 5 minutes." },
    { id: "rel-9", category: "Relationship Philosophy", content: "Give value freely.", source: "Ricky Carruth", action: "Give one person something useful today with zero expectation of anything in return." },
    { id: "rel-10", category: "Relationship Philosophy", content: "Build your sphere.", source: "Ricky Carruth", action: "Add one person from a different profession to your sphere this week and find a way to help them." },
    { id: "rel-11", category: "Relationship Philosophy", content: "Follow up relentlessly.", source: "Ricky Carruth", action: "Pick 5 people you’ve lost touch with and send a personal follow-up today." },
    { id: "rel-12", category: "Relationship Philosophy", content: "Be the go-to expert.", source: "Ricky Carruth", action: "Share one valuable insight or resource with your database this week that positions you as the expert." },
    { id: "rel-13", category: "Relationship Philosophy", content: "Focus on serving.", source: "Ricky Carruth", action: "Ask one client or partner this week: 'How can I serve you better right now?'" },
    { id: "rel-14", category: "Relationship Philosophy", content: "Network with purpose.", source: "Ricky Carruth", action: "Attend one event or schedule one coffee this week with someone who can expand your reach." },
    { id: "rel-15", category: "Relationship Philosophy", content: "Personal branding matters.", source: "Ricky Carruth", action: "Post one authentic piece of content this week that shows who you are, not just what you do." },
    { id: "rel-16", category: "Relationship Philosophy", content: "Grow through giving.", source: "Ricky Carruth", action: "Give a warm referral or introduction to someone in your network this week." },

    // === SELF-BELIEF & CONFIDENCE (14) ===
    { id: "conf-1", category: "Self-Belief & Confidence", content: "Your attitude, not your aptitude, will determine your altitude.", source: "Zig Ziglar", action: "Before your next call or appointment, write down three reasons the other person is lucky to work with you." },
    { id: "conf-2", category: "Self-Belief & Confidence", content: "You don’t rise to the level of your goals. You fall to the level of your systems and self-talk.", source: "Mindset Lab Original", action: "Write down the three most common negative thoughts you have about your production. Rewrite them as facts or questions." },
    { id: "conf-3", category: "Self-Belief & Confidence", content: "The market doesn’t decide your income. Your willingness to have uncomfortable conversations does.", source: "Mindset Lab Original", action: "Today, have the conversation you’ve been avoiding (rate objection, partner ask, past client follow-up)." },
    { id: "conf-4", category: "Self-Belief & Confidence", content: "You are not 'just a loan officer.' You are the person who helps families achieve one of the biggest financial decisions of their lives.", source: "Mindset Lab Original", action: "On your next application, say out loud (to yourself or the client): 'My job is to make this feel safe and successful for you.'" },
    { id: "conf-5", category: "Self-Belief & Confidence", content: "Confidence is a byproduct of preparation and repetition. You cannot fake it long-term.", source: "Mindset Lab Original", action: "This week, role-play your three most common objections with a colleague or spouse for 15 minutes." },
    { id: "conf-6", category: "Self-Belief & Confidence", content: "The loan officer who believes they are 'lucky' when deals close is usually the one who quietly did the work others skipped.", source: "Mindset Lab Original", action: "At the end of this week, list three wins that 'just happened' and trace the disciplined actions that made them possible." },
    { id: "conf-7", category: "Self-Belief & Confidence", content: "Believe and act as if impossible to fail.", source: "Antoine de Saint-Exupéry", action: "Before your next big appointment, write 'This is going to go well' and list three reasons why." },
    { id: "conf-8", category: "Self-Belief & Confidence", content: "Success is getting what you want, happiness is wanting what you get.", source: "Brian Tracy", action: "Write down three things you already have in your business that you’re grateful for." },
    { id: "conf-9", category: "Self-Belief & Confidence", content: "Leaders think and talk about solutions.", source: "Brian Tracy", action: "Catch yourself complaining this week and immediately reframe it as a question about solutions." },
    { id: "conf-10", category: "Self-Belief & Confidence", content: "Action cures fear.", source: "Classic", action: "When you feel fear about a call or meeting, take one small action toward it within 60 seconds." },
    { id: "conf-11", category: "Self-Belief & Confidence", content: "Be the change you wish to see.", source: "Classic", action: "Identify one behavior you want to see more of in your market and model it publicly this week." },
    { id: "conf-12", category: "Self-Belief & Confidence", content: "Make someone’s dream come true today.", source: "Classic", action: "Help one person move closer to a goal (homeownership, business growth, etc.) this week with no direct benefit to you." },
    { id: "conf-13", category: "Self-Belief & Confidence", content: "Pressure makes diamonds—thrive in it.", source: "Motivational", action: "When you feel pressure this week, remind yourself: 'This is where I get better.'" },
    { id: "conf-14", category: "Self-Belief & Confidence", content: "Outwork yesterday’s you.", source: "Motivational", action: "At the end of today, ask: 'Did I outwork yesterday’s version of me?'" },

    // === PROSPECTING PSYCHOLOGY (20) ===
    { id: "pros-1", category: "Prospecting Psychology", content: "Prospecting is the lifeblood of your business. Do the work others won’t do to have what others don’t.", source: "Mike Ferry", action: "Commit to one prospecting block today that you will not cancel, no matter what." },
    { id: "pros-2", category: "Prospecting Psychology", content: "Most loan officers hate prospecting because they made it about them instead of about the other person.", source: "Mindset Lab Original", action: "For the next 10 conversations, lead with a question about them (their business, their clients, their goals) before any mortgage talk." },
    { id: "pros-3", category: "Prospecting Psychology", content: "Your database is not a list. It is a group of people who once trusted you enough to let you into their biggest financial decision.", source: "Mindset Lab Original", action: "Call or text five people from your database this week with zero agenda except 'I was thinking about you.'" },
    { id: "pros-4", category: "Prospecting Psychology", content: "The fortune is in the follow-up. The follow-up is where most loan officers quietly quit.", source: "Mindset Lab Original", action: "Open your CRM or spreadsheet right now and schedule the next follow-up for every open opportunity or past client." },
    { id: "pros-5", category: "Prospecting Psychology", content: "People don’t refer the smartest loan officer. They refer the one they think about when the topic of mortgages comes up.", source: "Mindset Lab Original", action: "Create one simple, memorable way you show up (weekly video, specific niche tip, local market update) that makes you top of mind." },
    { id: "pros-6", category: "Prospecting Psychology", content: "The best prospecting feels like catching up with a friend, not pitching a stranger.", source: "Mindset Lab Original", action: "This week, turn three prospecting calls into genuine conversations by asking about their family, business, or recent wins first." },
    { id: "pros-7", category: "Prospecting Psychology", content: "If you only prospect when you need deals, your tone will betray you every single time.", source: "Mindset Lab Original", action: "Schedule two 'just because' prospecting blocks this month with zero production pressure attached." },
    { id: "pros-8", category: "Prospecting Psychology", content: "Your next referral is currently talking to someone who is not you. Go be in that conversation.", source: "Mindset Lab Original", action: "Send one proactive, valuable message to a partner or past client before the end of today." },
    { id: "pros-9", category: "Prospecting Psychology", content: "How open-minded are you to exploring options?", source: "Phil M. Jones", action: "Use this exact question on your next three conversations with partners or clients who seem stuck." },
    { id: "pros-10", category: "Prospecting Psychology", content: "Just one more thing before you go...", source: "Phil M. Jones", action: "Practice ending conversations with this line and one additional valuable question." },
    { id: "pros-11", category: "Prospecting Psychology", content: "When would be a good time to...?", source: "Phil M. Jones", action: "Use this on your next follow-up call instead of 'Can we talk?'" },
    { id: "pros-12", category: "Prospecting Psychology", content: "If I could, would you...?", source: "Phil M. Jones", action: "Turn this into a powerful assumptive close for your next appointment." },
    { id: "pros-13", category: "Prospecting Psychology", content: "What makes you say that?", source: "Phil M. Jones", action: "Use this when you hear an objection — then stay silent and listen." },
    { id: "pros-14", category: "Prospecting Psychology", content: "How do you mean?", source: "Phil M. Jones", action: "Practice this clarifying question on your next three calls." },
    { id: "pros-15", category: "Prospecting Psychology", content: "Most people in your situation...", source: "Phil M. Jones", action: "Use this social proof line (then finish with a positive outcome) on your next prospecting call." },
    { id: "pros-16", category: "Prospecting Psychology", content: "What would success look like for you?", source: "Phil M. Jones", action: "Ask this early in discovery conversations this week." },
    { id: "pros-17", category: "Prospecting Psychology", content: "Prospecting is essential; do it authentically.", source: "Mike Weinberg", action: "Write down your authentic reason for prospecting and read it before your next block." },
    { id: "pros-18", category: "Prospecting Psychology", content: "Focus on new business.", source: "Mike Weinberg", action: "Dedicate at least 60% of your prospecting time this week to people who have never done business with you." },
    { id: "pros-19", category: "Prospecting Psychology", content: "Be proactive in sales.", source: "Mike Weinberg", action: "Reach out to one person today before they reach out to you." },
    { id: "pros-20", category: "Prospecting Psychology", content: "Prospect with purpose.", source: "Mike Weinberg", action: "Before your next prospecting block, write down the exact outcome you want from those conversations." },

    // === GROWTH & LONG-TERM THINKING (16) ===
    { id: "growth-1", category: "Growth & Long-term Thinking", content: "Success is 80% mindset and 20% strategy.", source: "Tom Ferry", action: "Identify one limiting belief you have about your market or ability, and write the opposite empowering belief." },
    { id: "growth-2", category: "Growth & Long-term Thinking", content: "The loan officer who is still doing everything the same way in three years is choosing to be replaced.", source: "Mindset Lab Original", action: "Pick one skill or tool (AI, video, niche content, new partner channel) and spend 3 focused hours on it this week." },
    { id: "growth-3", category: "Growth & Long-term Thinking", content: "Your business will only grow to the level you are willing to let other people help you.", source: "Mindset Lab Original", action: "This month, delegate or systemize one task that currently lives only in your head." },
    { id: "growth-4", category: "Growth & Long-term Thinking", content: "The producers who survive rate cycles and market shifts are the ones who built a personal brand, not just a pipeline.", source: "Mindset Lab Original", action: "Publish one piece of content (social, newsletter, video) this week that positions you as the local expert, not just a rate shopper." },
    { id: "growth-5", category: "Growth & Long-term Thinking", content: "Short-term thinking creates long-term pain. Long-term thinking creates short-term discomfort that pays off for years.", source: "Mindset Lab Original", action: "Choose one activity that feels slow today (nurturing, content, partner development) but compounds in 12 months. Do it weekly." },
    { id: "growth-6", category: "Growth & Long-term Thinking", content: "The goal is not to close more loans. The goal is to become the kind of professional people fight to send their best clients to.", source: "Mindset Lab Original", action: "Write one sentence describing the loan officer you want to be known as in your market. Read it every morning this month." },
    { id: "growth-7", category: "Growth & Long-term Thinking", content: "Build a business, not just a job.", source: "Tom Ferry", action: "Write down one thing you do today that only you can do — then start documenting how someone else could do it." },
    { id: "growth-8", category: "Growth & Long-term Thinking", content: "Scale your business with systems.", source: "Tom Ferry", action: "Document one process this week that you currently do from memory." },
    { id: "growth-9", category: "Growth & Long-term Thinking", content: "Be the knowledge broker.", source: "Tom Ferry", action: "Share one valuable piece of market or lending knowledge with your database or a partner this week." },
    { id: "growth-10", category: "Growth & Long-term Thinking", content: "Goals are the fuel in the furnace of achievement.", source: "Brian Tracy", action: "Write down your top 3 production and lifestyle goals for the next 12 months and review them every morning." },
    { id: "growth-11", category: "Growth & Long-term Thinking", content: "Disciplined planning leads to success.", source: "Brian Tracy", action: "Spend 30 minutes this week planning the next 90 days in detail." },
    { id: "growth-12", category: "Growth & Long-term Thinking", content: "Invest in yourself.", source: "Brian Tracy", action: "Schedule one learning or development activity (course, book, mentor call, conference) in the next 14 days." },
    { id: "growth-13", category: "Growth & Long-term Thinking", content: "Continuous learning is key.", source: "Brian Tracy", action: "Read or listen to 20 minutes of sales/mindset content every day this week." },
    { id: "growth-14", category: "Growth & Long-term Thinking", content: "A goal without a plan is just a wish.", source: "Antoine de Saint-Exupéry", action: "Take one big goal you have and break it into the first three concrete weekly actions." },
    { id: "growth-15", category: "Growth & Long-term Thinking", content: "Success is rented, rent due every day.", source: "Classic", action: "Ask yourself every evening: 'What did I do today to pay the rent on my success?'" },
    { id: "growth-16", category: "Growth & Long-term Thinking", content: "Success is a journey, not destination.", source: "Classic", action: "Celebrate one small win this week that moves you forward even if the big goal isn’t finished yet." },

    // === VALUE-FIRST MINDSET (15) ===
    { id: "value-1", category: "Value-First Mindset", content: "Stop selling. Start helping. Givers gain.", source: "Bob Burg / Jeffrey Gitomer", action: "Find one piece of value (article, connection, idea) you can give someone today with zero expectation." },
    { id: "value-2", category: "Value-First Mindset", content: "The fastest way to become referable is to make other people more successful because they know you.", source: "Mindset Lab Original", action: "Introduce two people in your network who should know each other this week (no mortgage ask attached)." },
    { id: "value-3", category: "Value-First Mindset", content: "When you lead with value, the ask becomes a natural next step instead of an awkward request.", source: "Mindset Lab Original", action: "On your next three partner touches, give something specific and useful before you ask for anything." },
    { id: "value-4", category: "Value-First Mindset", content: "Your clients and partners remember how you made them feel long after they forget the rate you gave them.", source: "Mindset Lab Original", action: "After your next closing, send a handwritten note + a small, thoughtful gift or local recommendation that has nothing to do with mortgages." },
    { id: "value-5", category: "Value-First Mindset", content: "The most powerful marketing is the story your referral partner tells about you when you are not in the room.", source: "Mindset Lab Original", action: "Do one thing this week that gives your best partner a story worth repeating to their clients and colleagues." },
    { id: "value-6", category: "Value-First Mindset", content: "You don’t have to be the cheapest. You have to be the one they trust to protect their reputation.", source: "Mindset Lab Original", action: "On your next file, over-communicate one thing that protects your partner’s relationship with their client." },
    { id: "value-7", category: "Value-First Mindset", content: "Generosity scales. Transactional behavior caps.", source: "Mindset Lab Original", action: "Find one way this week to make a past client or partner look good publicly (tag, shoutout, referral back) with zero direct benefit to you." },
    { id: "value-8", category: "Value-First Mindset", content: "Givers gain.", source: "Bob Burg", action: "Give something valuable to three different people this week with zero strings attached." },
    { id: "value-9", category: "Value-First Mindset", content: "Focus on serving others.", source: "Bob Burg", action: "Ask one person today: 'How can I help you?' and mean it." },
    { id: "value-10", category: "Value-First Mindset", content: "Value first, success follows.", source: "Bob Burg", action: "Lead with a specific, useful piece of information or introduction in your next three conversations." },
    { id: "value-11", category: "Value-First Mindset", content: "The more you give, the more you receive.", source: "Bob Burg", action: "Track every value-giving action you take this week and notice what comes back." },
    { id: "value-12", category: "Value-First Mindset", content: "Be a go-giver, not go-taker.", source: "Bob Burg", action: "Catch yourself this week when you’re about to ask for something and give first instead." },
    { id: "value-13", category: "Value-First Mindset", content: "People don't like to be sold, but they love to buy.", source: "Jeffrey Gitomer", action: "Reframe your next conversation as helping them buy instead of you selling." },
    { id: "value-14", category: "Value-First Mindset", content: "Value first, sales second.", source: "Jeffrey Gitomer", action: "Give one piece of value before you ever mention what you do on your next three calls." },
    { id: "value-15", category: "Value-First Mindset", content: "Sales success comes from helping.", source: "Jeffrey Gitomer", action: "On your next call, ask 'How can I help you today?' before talking about rates or products." },

    // === ADDITIONAL HIGH-VALUE LO-SPECIFIC & CLASSIC ADDITIONS (15 more) ===
    { id: "extra-1", category: "Prospecting Psychology", content: "Build credibility fast.", source: "Jill Konrath", action: "Lead your next conversation with a specific, relevant insight about their market or situation." },
    { id: "extra-2", category: "Prospecting Psychology", content: "Create urgency.", source: "Jill Konrath", action: "Use a legitimate, time-sensitive reason in your next three follow-ups." },
    { id: "extra-3", category: "Prospecting Psychology", content: "Be relevant to needs.", source: "Jill Konrath", action: "Before every call this week, write down the one thing that matters most to that specific person right now." },
    { id: "extra-4", category: "Daily Discipline", content: "Intentional mornings create unstoppable months.", source: "Motivational", action: "Design and protect your first 30 minutes tomorrow morning." },
    { id: "extra-5", category: "Resilience & Rejection", content: "Learn from every no.", source: "Jeffrey Gitomer", action: "After your next rejection, write down exactly what you will do differently next time." },
    { id: "extra-6", category: "Value-First Mindset", content: "Build relationships for loyalty.", source: "Jeffrey Gitomer", action: "Do one thing this week that has no immediate ROI but deepens a real relationship." },
    { id: "extra-7", category: "Growth & Long-term Thinking", content: "Time management is life management.", source: "Brian Tracy", action: "Track how you actually spend your time for two days, then cut one low-value activity." },
    { id: "extra-8", category: "Self-Belief & Confidence", content: "Develop an attitude of gratitude.", source: "Brian Tracy", action: "Write down five things you’re grateful for in your business before you start work tomorrow." },
    { id: "extra-9", category: "Relationship Philosophy", content: "Relationships are currency of sales.", source: "Classic", action: "Treat every relationship like a long-term investment this week." },
    { id: "extra-10", category: "Prospecting Psychology", content: "Avoid excuses, take action.", source: "Mike Weinberg", action: "Catch yourself making an excuse today and replace it with one concrete action." },
    { id: "extra-11", category: "Resilience & Rejection", content: "Consistency the silent closer.", source: "Classic", action: "Keep showing up for one person or file this week even when it feels slow." },
    { id: "extra-12", category: "Daily Discipline", content: "Show up on purpose daily.", source: "Motivational", action: "Write down your 'why' and read it before you start work for the next 5 days." },
    { id: "extra-13", category: "Value-First Mindset", content: "Lead with value, close with ease.", source: "Motivational", action: "Give significant value in your next three conversations before you ever ask for anything." },
    { id: "extra-14", category: "Growth & Long-term Thinking", content: "Be relentless about paying activities.", source: "Motivational", action: "List your top 3 paying activities and protect time for them every single day this week." },
    { id: "extra-15", category: "Prospecting Psychology", content: "Your next loan is one call away.", source: "Classic", action: "Make that call right now." }
  ];

  // --- Filter persistence ---
  function getPersistedFilter() {
    try {
      return localStorage.getItem('mindsetLabLastFilter') || 'All';
    } catch (e) { return 'All'; }
  }
  function persistFilter(filter) {
    try { localStorage.setItem('mindsetLabLastFilter', filter); } catch (e) {}
  }

  let currentFilter = getPersistedFilter();
  let currentSearch = '';

  // 3 Core truths for the premium "Start Here" featured row (hand-picked for immediate LO impact)
  let FEATURED_MINDSET_IDS = ['rec-m-1', 'res-4', 'dis-13'];

  function renderFeaturedMindset() {
    const container = document.getElementById('mindset-featured-row');
    if (!container) return;
    container.innerHTML = '';

    FEATURED_MINDSET_IDS.forEach(id => {
      const item = mindsetItems.find(i => i.id === id);
      if (!item) return;

      const card = document.createElement('div');
      card.className = 'group bg-white dark:bg-gray-900 border-2 border-[#00A89D]/30 hover:border-[#00A89D] rounded-3xl p-5 flex flex-col transition-all hover:shadow-lg';

      const short = item.content.length > 110 ? item.content.substring(0, 108) + '…' : item.content;

      card.innerHTML = `
        <div class="flex items-center gap-2 mb-2">
          <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#00A89D] text-white">CORE TRUTH</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">${item.category}</span>
        </div>
        <div class="text-sm leading-snug mb-3 flex-1">"${short}"</div>
        <div class="text-[10px] text-gray-500 mb-3">${item.source}</div>
        <div class="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
          <button onclick="filterToMindset('${item.id}', this)" class="flex-1 text-xs px-3 py-1.5 rounded-2xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition font-semibold">Focus on this</button>
          <button onclick="saveMindsetItem('${item.id}', this)" class="text-xs px-3 py-1.5 rounded-2xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">Save</button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  window.filterToMindset = function(itemId, el) {
    const item = mindsetItems.find(i => i.id === itemId);
    if (!item) return;
    currentFilter = item.category;
    persistFilter(currentFilter);
    const searchEl = document.getElementById('mindset-search');
    if (searchEl) searchEl.value = '';
    renderItems();
    renderFilters();
    const grid = document.getElementById('mindset-items-grid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Copy principle (for Weekly Win blocks, Social captions, notes). Matches tool-wide copy UX.
  window.copyMindsetPrinciple = function(itemId, btnEl) {
    const item = mindsetItems.find(i => i.id === itemId);
    if (!item) return;
    const text = `"${item.content}"\n\nApply this: ${item.action || 'Reflect and act on this today.'}\n— ${item.source}`;

    const finish = () => {
      if (btnEl) {
        const orig = btnEl.innerHTML;
        btnEl.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => { if (btnEl) btnEl.innerHTML = orig; }, 1400);
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(finish).catch(() => {
        const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch(e){}
        document.body.removeChild(ta);
        finish();
      });
    } else {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch(e){}
      document.body.removeChild(ta);
      finish();
    }
  };

  function getSavedIdeas() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) { return []; }
  }

  function isMindsetSaved(item) {
    const saved = getSavedIdeas();
    const title = `Mindset: ${item.content.substring(0, 78)}`;
    return saved.some(s => s.title === title);
  }

  function renderFilters() {
    const container = document.getElementById('mindset-category-filters');
    if (!container) return;

    container.innerHTML = '';

    // All button
    const allBtn = document.createElement('button');
    allBtn.className = `px-4 py-1.5 text-sm rounded-full border transition ${currentFilter === 'All' ? 'bg-[#00A89D] text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`;
    allBtn.textContent = 'All';
    allBtn.onclick = () => {
      currentFilter = 'All';
      persistFilter('All');
      renderItems();
      updateFilterActive(allBtn);
    };
    container.appendChild(allBtn);

    categories.forEach(cat => {
      const btn = document.createElement('button');
      const isActive = currentFilter === cat;
      btn.className = `px-4 py-1.5 text-sm rounded-full border transition ${isActive ? 'bg-[#00A89D] text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`;
      btn.textContent = cat;
      btn.onclick = () => {
        currentFilter = cat;
        persistFilter(cat);
        renderItems();
        updateFilterActive(btn);
      };
      container.appendChild(btn);
    });
  }

  function updateFilterActive(activeBtn) {
    const container = document.getElementById('mindset-category-filters');
    if (!container) return;
    container.querySelectorAll('button').forEach(b => {
      if (b === activeBtn) {
        b.classList.add('bg-[#00A89D]', 'text-white');
        b.classList.remove('border', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
      } else {
        b.classList.remove('bg-[#00A89D]', 'text-white');
        b.classList.add('border', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
      }
    });
  }

  function renderItems() {
    const container = document.getElementById('mindset-items-grid');
    if (!container) return;

    const searchEl = document.getElementById('mindset-search');
    currentSearch = searchEl ? searchEl.value.trim().toLowerCase() : '';

    let filtered = mindsetItems;

    if (currentFilter !== 'All') {
      filtered = filtered.filter(item => item.category === currentFilter);
    }

    if (currentSearch) {
      filtered = filtered.filter(item =>
        item.content.toLowerCase().includes(currentSearch) ||
        item.category.toLowerCase().includes(currentSearch) ||
        (item.action && item.action.toLowerCase().includes(currentSearch)) ||
        (item.source && item.source.toLowerCase().includes(currentSearch))
      );
    }

    container.innerHTML = '';

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-search text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
          <p class="text-lg text-gray-500">No mindset items match your search or filter.</p>
          <button onclick="document.getElementById('mindset-search').value=''; currentFilter='All'; persistFilter('All'); renderItems(); renderFilters();" 
                  class="mt-4 px-4 py-2 text-sm rounded-2xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">
            Clear filters
          </button>
        </div>`;
      return;
    }

    filtered.forEach(item => {
      const alreadySaved = isMindsetSaved(item);

      const saveBtnHTML = alreadySaved
        ? `<button onclick="saveMindsetItem('${item.id}', this)" 
                   class="text-sm px-3 py-1 rounded-full border border-[#00A89D] text-[#00A89D] bg-[#00A89D]/5 flex items-center gap-1 transition" 
                   title="Saved to My Saved Items — click to remove">
             <i class="fas fa-bookmark"></i> <span>Saved</span>
           </button>`
        : `<button onclick="saveMindsetItem('${item.id}', this)" 
                   class="text-sm px-3 py-1 rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition flex items-center gap-1" 
                   title="Save to My Saved Items">
             <i class="far fa-bookmark"></i> <span>Save</span>
           </button>`;

      // Premium v2 card treatment matching Book Vault + other tools
      const card = document.createElement('div');
      card.className = 'bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-[#00A89D]/70 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all flex flex-col h-full';

      card.innerHTML = `
        <div class="flex-1">
          <div class="text-xs font-semibold text-[#00A89D] mb-2 tracking-wide">${item.category}</div>
          <div class="flex gap-2 mb-4">
            <i class="fas fa-quote-left text-[#00A89D] mt-1 text-xs opacity-70"></i>
            <p class="text-base leading-relaxed">"${item.content}"</p>
          </div>
          ${item.action ? `<div class="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl mb-4 border-l-2 border-[#F15A29]"><strong class="text-[#F15A29]">Apply this:</strong> ${item.action}</div>` : ''}
        </div>
        <div class="flex justify-between items-center mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
          <span class="text-xs text-gray-500">${item.source}</span>
          <div class="flex gap-1.5">
            <button onclick="copyMindsetPrinciple('${item.id}', this)" class="text-xs px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-1" title="Copy principle">
              <i class="fas fa-copy"></i>
            </button>
            ${saveBtnHTML}
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // Premium save function — matches Sales Script Generator quality and behavior
  window.saveMindsetItem = function(id, btnEl) {
    const item = mindsetItems.find(i => i.id === id);
    if (!item) return;

    const title = `Mindset: ${item.content.substring(0, 78)}`;
    let saved = getSavedIdeas();
    const alreadyIndex = saved.findIndex(s => s.title === title);

    if (alreadyIndex !== -1) {
      // Unsave
      saved.splice(alreadyIndex, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

      if (btnEl) {
        btnEl.innerHTML = '<i class="far fa-bookmark"></i> <span>Save</span>';
        btnEl.classList.remove('!bg-[#00A89D]', 'text-white', 'border-[#00A89D]', 'bg-[#00A89D]/5');
        btnEl.title = 'Save to My Saved Items';
      }

      if (typeof window.updateSavedCount === 'function') {
        try { window.updateSavedCount(); } catch (e) {}
      }
      if (typeof window.showToast === 'function') {
        window.showToast('Removed from My Saved Items');
      }
      renderItems(); // refresh all cards
      return;
    }

    // Save
    saved.push({
      title: title,
      content: `${item.content}\n\nApply this: ${item.action || 'Reflect on this principle today.'}`,
      savedAt: new Date().toISOString(),
      type: 'mindset'
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

    if (btnEl) {
      const originalHTML = btnEl.innerHTML;
      btnEl.innerHTML = '<i class="fas fa-check"></i> <span>Saved!</span>';
      btnEl.classList.add('!bg-[#00A89D]', 'text-white', 'border-[#00A89D]');
      btnEl.disabled = true;
      btnEl.title = 'Saved to My Saved Items — click to unsave';

      setTimeout(() => {
        if (btnEl) {
          btnEl.innerHTML = '<i class="fas fa-bookmark"></i> <span>Saved</span>';
          btnEl.classList.remove('!bg-[#00A89D]', 'text-white');
          btnEl.classList.add('text-[#00A89D]', 'border-[#00A89D]', 'bg-[#00A89D]/5');
          btnEl.disabled = false;
        }
      }, 2400);
    }

    if (typeof window.updateSavedCount === 'function') {
      try { window.updateSavedCount(); } catch (e) {}
    }

    if (typeof window.showSavedFeedback === 'function') {
      window.showSavedFeedback('Saved to My Saved Items');
    } else if (typeof window.showToast === 'function') {
      window.showToast('Saved to My Saved Items');
    }

    // Success note with "Open now" (matches sales scripts pattern)
    const grid = document.getElementById('mindset-items-grid');
    if (grid) {
      let note = grid.parentElement.querySelector('.save-success-note');
      if (!note) {
        note = document.createElement('div');
        note.className = 'save-success-note mt-4 p-3 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm flex items-center gap-2';
        grid.parentElement.appendChild(note);
      }
      note.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>
          Saved to <strong>My Saved Items</strong>. 
          <a href="#" onclick="showSavedItemsLibrary('mindset'); return false;" class="underline font-semibold">Open now</a>
        </span>
      `;
      setTimeout(() => {
        if (note && note.parentNode) note.parentNode.removeChild(note);
      }, 6200);
    }

    // Refresh cards so other buttons reflect the new saved state
    setTimeout(() => renderItems(), 2600);
  };

  window.showRandomMindset = function() {
    const container = document.getElementById('mindset-items-grid');
    if (!container || mindsetItems.length === 0) return;

    const randomItem = mindsetItems[Math.floor(Math.random() * mindsetItems.length)];
    const alreadySaved = isMindsetSaved(randomItem);

    container.innerHTML = '';

    const saveHTML = alreadySaved
      ? `<button onclick="saveMindsetItem('${randomItem.id}', this)" class="px-4 py-2 rounded-2xl border border-[#00A89D] text-[#00A89D] bg-[#00A89D]/5">Saved</button>`
      : `<button onclick="saveMindsetItem('${randomItem.id}', this)" class="px-4 py-2 rounded-2xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Save This</button>`;

    const card = document.createElement('div');
    card.className = 'col-span-full bg-white dark:bg-gray-900 border border-[#00A89D] rounded-3xl p-8 shadow-lg';

    card.innerHTML = `
      <div class="text-xs font-medium text-[#00A89D] mb-2">${randomItem.category} • Random Pick</div>
      <p class="text-xl leading-relaxed mb-4">"${randomItem.content}"</p>
      ${randomItem.action ? `<div class="text-base bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl mb-6"><strong>Apply this:</strong> ${randomItem.action}</div>` : ''}
      <div class="flex gap-3">
        ${saveHTML}
        <button onclick="renderItems(); renderFilters();" class="px-4 py-2 rounded-2xl border">Show All</button>
      </div>
    `;
    container.appendChild(card);
  };

  function applyRecruitingMindsetPatches() {
    const recruitingExtras = [
      { id: 'rec-m-1', category: 'Prospecting Psychology', content: '270 outreach attempts per week is not punishment — it is the price of predictable net hires. Volume with humanity beats sporadic heroics.', source: 'Ruoff Recruiting 2026', action: 'Block Tue–Thu phone time before you open email. Protect it like an executive call.' },
      { id: 'rec-m-2', category: 'Resilience & Rejection', content: '"I\'m happy where I am" is data, not defeat. Your job is to stay curious long enough for timing to change.', source: 'Recruiting Coach', action: 'After your next "happy" conversation, log one personal detail in Shape and schedule a 90-day nurture touch.' },
      { id: 'rec-m-3', category: 'Daily Discipline', content: 'Shape is system of record. If it isn\'t logged, it didn\'t happen — and your pipeline will lie to you.', source: 'Recruiting Coach', action: 'End today by logging every meaningful touch and tiering every active prospect A/B/C.' }
    ];
    if (!mindsetItems.some(i => i.id === 'rec-m-1')) {
      mindsetItems = [...recruitingExtras, ...mindsetItems];
    }
    FEATURED_MINDSET_IDS = ['rec-m-1', 'res-4', 'dis-13'];

    const reps = [
      [/loan officers?/gi, 'recruiters'],
      [/Loan Officers?/g, 'Recruiters'],
      [/referral partners?/gi, 'LO prospects'],
      [/realtors?/gi, 'LO prospects'],
      [/borrowers?/gi, 'LO prospects'],
      [/clients?/gi, 'LO prospects'],
      [/rate objections?/gi, '"I\'m happy" objections'],
      [/equity scan/gi, 'Shape review'],
      [/Your next loan/gi, 'Your next quality conversation'],
      [/loan origination/gi, 'mortgage recruiting'],
      [/funded loans?/gi, 'net hires'],
      [/closings?/gi, 'hires'],
      [/database/gi, 'Shape pipeline'],
      [/sphere/gi, 'prospect pipeline'],
      [/pop-by/gi, 'nurture touch'],
    ];
    mindsetItems = mindsetItems.map((item) => {
      let content = item.content;
      let action = item.action || '';
      reps.forEach(([re, r]) => { content = content.replace(re, r); action = action.replace(re, r); });
      return { ...item, content, action };
    });
  }

  function initMindsetLab() {
    const grid = document.getElementById('mindset-items-grid');
    const search = document.getElementById('mindset-search');

    if (!grid) return;

    applyRecruitingMindsetPatches();

    // Restore persisted filter on init
    currentFilter = getPersistedFilter();

    renderFeaturedMindset();
    renderFilters();
    renderItems();

    if (search) {
      // Restore previous search if desired (optional — simple version keeps it empty)
      search.addEventListener('input', () => {
        renderItems();
      });
    }

    // Re-render saved states when global count updates (in case saved elsewhere)
    if (typeof window.updateSavedCount === 'function') {
      const orig = window.updateSavedCount;
      window.updateSavedCount = function() {
        const result = orig.apply(this, arguments);
        // Refresh mindset cards if the section is visible
        const mindsetSection = document.getElementById('mindset-motivation');
        if (mindsetSection && !mindsetSection.classList.contains('hidden')) {
          renderItems();
        }
        return result;
      };
    }

    console.log('%c[mindset-lab.js] Mindset Lab initialized (expanded content + premium save)', 'color:#00A89D');
  }

  // Public API
  window.renderMindsetLab = function() {
    renderFeaturedMindset();
    renderFilters();
    renderItems();
  };
  window.renderMindsetItems = renderItems;
  window.filterMindsetByCategory = function(cat) {
    currentFilter = cat;
    persistFilter(cat);
    renderItems();
    renderFilters();
  };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMindsetLab);
  } else {
    initMindsetLab();
  }

  // Also re-render saved button states when navigating back to the section (via main.js hook)
})();
