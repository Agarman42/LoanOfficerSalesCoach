/**
 * js/features/social-modals.js
 * Social Media Strategy pillar modals — world-class playbooks with reliable open/close.
 */
(function () {
  'use strict';

  let _view = { pillar: null, mode: 'summary' };

  function escAttr(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function escJs(s) {
    return (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
  }

  function getEls() {
    return {
      modal: document.getElementById('content-modal'),
      eyebrow: document.getElementById('social-modal-eyebrow'),
      title: document.getElementById('social-modal-title'),
      badge: document.getElementById('social-modal-badge'),
      body: document.getElementById('social-modal-body'),
      backBtn: document.getElementById('social-modal-back')
    };
  }

  function openShell() {
    const { modal } = getEls();
    if (!modal) return;
    if (typeof window.openNamedModal === 'function') window.openNamedModal(modal);
    else if (typeof window.openAppModal === 'function') window.openAppModal(modal);
    else {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      modal.style.display = 'flex';
      document.body.classList.add('modal-open');
    }
  }

  function closeShell() {
    const { modal, backBtn } = getEls();
    _view = { pillar: null, mode: 'summary' };
    if (backBtn) backBtn.classList.add('hidden');
    if (!modal) return;
    if (typeof window.closeNamedModal === 'function') window.closeNamedModal(modal);
    else if (typeof window.closeAppModal === 'function') window.closeAppModal(modal);
    else {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      modal.style.display = 'none';
      modal.style.pointerEvents = 'none';
      if (typeof window.releaseModalScrollLock === 'function') window.releaseModalScrollLock();
      else document.body.classList.remove('modal-open');
    }
  }

  function renderExampleCard(pillar, title, text, prefix) {
    const saveTitle = escJs((prefix || pillar) + ': ' + title);
    const safe = escAttr(text);
    return `<div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-5" data-copy-text="${safe}">
      <div class="flex justify-between items-start gap-3">
        <div class="flex-1 min-w-0">
          <strong class="text-base text-[#002B5C] dark:text-white">${title}</strong>
          <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-line">${text}</div>
        </div>
        <div class="flex flex-col gap-1 shrink-0">
          <button type="button" onclick="window.copyModalSection(this)" class="text-xs px-3 py-1.5 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
          <button type="button" onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('${saveTitle}', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'social');}" class="text-xs px-3 py-1.5 rounded-xl border border-[#F15A29] text-[#F15A29] hover:bg-[#F15A29] hover:text-white font-semibold whitespace-nowrap">Save</button>
        </div>
      </div>
    </div>`;
  }

  function renderProTips(tips) {
    if (!tips || !tips.length) return '';
    return `<div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-6">
      <strong class="block mb-2 text-[#F15A29]">Pro Tips</strong>
      <ul class="list-disc pl-5 space-y-1">${tips.map(t => `<li>${t}</li>`).join('')}</ul>
    </div>`;
  }

  function renderExecutionGuide(steps) {
    if (!steps || !steps.length) return '';
    return `<h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">4-Step Execution Playbook</h4>
      <div class="space-y-2 mb-6 text-[15px]">
        ${steps.map((s, i) => `<div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Step ${i + 1}:</strong> ${s}</div>`).join('')}
      </div>`;
  }

  function renderCadence(cadence) {
    if (!cadence) return '';
    return `<h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Weekly Posting Rhythm</h4>
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-6 text-[15px]">${cadence}</div>`;
  }

  function renderReelBlock(reelTips) {
    if (!reelTips || !reelTips.length) return '';
    return `<h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Turn Posts Into Reels (60 sec)</h4>
      <ul class="text-sm space-y-1.5 mb-6 pl-4 list-disc text-gray-700 dark:text-gray-300">
        ${reelTips.map(t => `<li>${t}</li>`).join('')}
      </ul>`;
  }

  function socialNextSteps(extra) {
    const base = [
      { label: 'AI Social Post Creator', onclick: "window.closeSocialContentModal(); if(typeof window.showSocialPostCreator==='function')window.showSocialPostCreator(); else if(typeof window.showSection==='function')window.showSection('social-post');", style: 'primary' },
      { label: 'Content Pillars (Vault)', onclick: "window.closeSocialContentModal(); if(typeof window.openVaultItemWhenReady==='function')window.openVaultItemWhenReady('content-pillars');", style: 'accent' },
      { label: 'Reel Hook Formulas', onclick: "window.closeSocialContentModal(); if(typeof window.openVaultItemWhenReady==='function')window.openVaultItemWhenReady('reel-hook-formula');", style: 'accent' },
      { label: '30-Day Content Sprint', onclick: "window.closeSocialContentModal(); if(typeof window.openVaultItemWhenReady==='function')window.openVaultItemWhenReady('content-30day-sprint');", style: 'accent' },
      { label: 'Weekly Win Plan (Content Block)', onclick: "window.closeSocialContentModal(); if(typeof window.showSection==='function')window.showSection('weekly-win-plan');", style: 'accent' },
      { label: 'My Saved Items', onclick: "window.closeSocialContentModal(); if(typeof window.showSavedItemsLibrary==='function')window.showSavedItemsLibrary('social');", style: 'accent' }
    ];
    const links = extra ? base.concat(extra) : base;
    if (typeof window.renderModalNextSteps === 'function') {
      return window.renderModalNextSteps(links, 'Put This Pillar to Work');
    }
    return '';
  }

  const SOCIAL_PILLAR_CONTENT = {
    Personal: {
      title: 'Personal Content Pillar',
      badge: '50% of your feed',
      whyWorks: 'People follow YOU, not a mortgage company. When 50%+ of your content is genuinely personal — hobbies, family (with permission), travel, pets, Sunday resets — you become a real human in their feed. Mortgage posts get likes from tire-kickers. Personal posts get comments from future clients and their realtors.',
      cadence: 'Aim for <strong>3–4 personal posts per week</strong> (weekends + 1 weekday evening). Batch captions Sunday night; post when people scroll for fun, not during business hours only.',
      execution: [
        'Pick one real moment from the last 7 days — no staging required.',
        'Write 2–3 sentences + one open question (never “DM me for rates”).',
        'Use a photo you actually took; skip stock imagery.',
        'Reply to every comment same-day; save high-engagement posts to My Saved Items.'
      ],
      reelTips: [
        'Same photo + 15-sec voiceover: “Here’s what my Sunday actually looks like as an LO…”',
        'Use trending audio at low volume under your voice — authenticity beats production.',
        'End with a question on screen text so silent viewers still engage.'
      ],
      examples: [
        { title: 'Sunday Reset Routine', text: 'Sunday reset ritual: coffee on the porch, planning the week, and walking the dog before pre-approvals start Monday. What does your Sunday look like?' },
        { title: 'Family + Local Love', text: 'Took the kids to the new splash pad in town this weekend. Zero emails, full presence. These are the moments that make all the late nights worth it. What’s one thing you’re doing this weekend to actually unplug?' },
        { title: 'Hobby Share', text: 'Finally finished that book I’ve been dragging through for 3 months. The last chapter wrecked me. Drop your current read below — I need my next one.' },
        { title: 'Behind the Scenes', text: 'My desk right now: three half-drunk coffees, a stack of rate sheets, and my dog asleep under it. This is the glamorous life of helping families buy homes. Worth every second.' },
        { title: 'Travel / Perspective', text: 'Just got back from a quick trip to the mountains. Standing on that ridge made me realize how small day-to-day worries are — and how big the decision to buy a home really is. Perspective is everything.' },
        { title: 'Gratitude + Why Moment', text: 'Grateful for this job today. Helped a young couple get the keys to their first home — the look on their faces when they realized “we actually did it” never gets old. What reminded you this week why you do what you do?' }
      ],
      proTips: [
        'Always get explicit permission before posting family or clients.',
        'End with a real, open question — not “DM me for rates.”',
        'Post evenings/weekends when people scroll for fun.',
        'Turn your best personal posts into Reels within 48 hours.'
      ]
    },
    Local: {
      title: 'Local & Community Pillar',
      badge: '10–15% of your feed',
      whyWorks: 'Local content converts followers into referral partners faster than almost anything else. When you celebrate your town, spotlight businesses, and cover neighborhood events, you become the trusted local expert realtors want on their team.',
      cadence: '<strong>1–2 local posts per week minimum.</strong> Mix business spotlights, event coverage, and “hidden gem” recommendations. Tag locations — the algorithm and locals both reward it.',
      execution: [
        'Snap a photo on your phone while out in the community (coffee run, event, park).',
        'Name the place specifically; say why you love it in one sentence.',
        'Tag the business or location when appropriate.',
        'Log which posts get realtor comments — double down on that format next month.'
      ],
      reelTips: [
        'Walk-and-talk 30 sec outside the spot you’re featuring.',
        '“3 things I love about [Neighborhood] this month” carousel or quick cuts.',
        'Repost local event footage with your voiceover on what it means for buyers.'
      ],
      examples: [
        { title: 'Local Business Spotlight', text: 'Shoutout to the new coffee spot on Main — already my official closing-day ritual. If you haven’t tried their oat milk latte, you’re missing out. Go support them this week.' },
        { title: 'Farmers Market Run-In', text: 'The farmers market was slammed yesterday. Ran into three families I’ve helped buy homes. Nothing beats seeing people you know living in neighborhoods you love.' },
        { title: 'Neighborhood Market Note', text: 'Inventory in [Your Neighborhood] is up about 14% from last month. Real movement for buyers who’ve been waiting. If you’ve been on the fence about looking, this is the window.' },
        { title: 'Hidden Gem', text: 'Random local win: the little park behind the library has the best sunset view in town and almost nobody knows about it. Perfect 20-minute reset between appointments.' },
        { title: 'Community Pride', text: 'So proud of our local high school robotics team — top 5 at state this weekend. These kids are building the future right here in our backyard.' },
        { title: 'Realtor Partner Shoutout', text: 'Huge thank you to the realtors who communicate like partners instead of competitors. You make this job 10x better. Tag one who’s in your corner.' }
      ],
      proTips: [
        'Tag actual businesses and locations — they often repost you.',
        'Phone photos beat stock every time.',
        'Partner with 3–4 local businesses for cross-promotion.',
        'One “local love” post per week compounds over 6–12 months.'
      ]
    },
    Educational: {
      title: 'Educational & Expertise Pillar',
      badge: '10% max — myth-busting only',
      whyWorks: 'This is expert content in small doses. Posts must feel generous and myth-busting — not “call me.” Make the complex simple so people feel smarter choosing you later.',
      cadence: '<strong>1 educational post every 7–10 days</strong> — never two in a row. Pair with a personal or local post the same week so you don’t sound like a billboard.',
      execution: [
        'Lead with the myth in plain language (“Most people think…”).',
        'Give the reality in 2–3 short sentences.',
        'Add one anonymized client outcome if possible.',
        'End with “Comment if this is you” or “Tag someone who needs this.”'
      ],
      reelTips: [
        'Green-screen style: you + screenshot of headline myth, then your correction.',
        '“3 myths about [topic] in 45 seconds” — fast cuts, text on screen.',
        'Use a whiteboard or notepad prop — feels teacher-like, not salesy.'
      ],
      examples: [
        { title: '20% Down Myth', text: 'Myth: You need 20% down to buy.\nReality: Many programs let you buy with 3–5% (sometimes 0%). The 20% number keeps good people renting longer than they need to.' },
        { title: 'PMI Explained', text: 'PMI isn’t a punishment — it’s a tool. Buy with less than 20% today, remove it when you hit 20% equity. I walk every client through exactly when that happens before we start.' },
        { title: '2-1 Buydown', text: 'A 2-1 buydown can lower your rate a full point for the first two years. For many buyers right now, that temporary payment reduction is the difference between waiting and moving in.' },
        { title: 'Credit Quick Win', text: 'Fastest score boost before applying: get card balances under 30% of limits. Do it 30–45 days before you apply and watch what happens.' },
        { title: 'Rent vs Own Math', text: 'Rent vs own: I just helped a family whose new payment was only $87 more than rent — and they’re building equity. The numbers often surprise people when you run them properly.' }
      ],
      proTips: [
        'If a 7th grader can’t understand it, rewrite it.',
        'Include one real (anonymized) story per post.',
        'Save winners — they become blogs, newsletters, and Reels.',
        'Never post rates without full context — myth-bust instead.'
      ]
    },
    'Client Wins': {
      title: 'Client Wins & Testimonials',
      badge: 'High-engagement subset',
      whyWorks: 'Social proof without sleaze. Real stories (with permission) show your value better than rate graphics and spark shares from realtors who want to be associated with wins.',
      cadence: '<strong>1–2 client win posts per month</strong> when you have permission. Quality over quantity — one great story beats four generic “another closing” posts.',
      execution: [
        'Get written permission + ask what details they’re comfortable sharing.',
        'Focus on emotion and obstacle overcome — not loan amount.',
        'Tag the realtor when appropriate (they share it).',
        'Follow up privately with a thank-you; ask if anyone else in their world needs help.'
      ],
      reelTips: [
        'Before/after energy: “They were told no. Here’s what we did.”',
        'Screenshot testimonial + your voice reading the best line.',
        'Keys photo (with permission) + 20-sec story of the journey.'
      ],
      examples: [
        { title: 'First-Time Buyer Win', text: 'Helped a couple close in 28 days. They’d been told “impossible right now” by three lenders. We found the right program, moved fast, and they got keys before rates moved again.' },
        { title: 'Self-Employed Success', text: 'Self-employed borrower, wild tax returns, dream house under contract. Most lenders passed. We got creative with bank statements and closed on time.' },
        { title: 'Rate Lock Save', text: 'Locked Tuesday. By Friday the market moved 0.375% against us. Because we moved fast and communicated every step, they still got the payment they needed.' },
        { title: 'Teacher 3% Down', text: 'Helped a teacher buy with 3% down using a state program she didn’t know existed. Another lender said it wasn’t possible. The smile at closing was everything.' },
        { title: 'Partner Win Shoutout', text: 'Favorite realtor partner brought a tough file last month. We got it done together. These partnerships are the real engine of this business.' }
      ],
      proTips: [
        'Permission first — always.',
        'Emotion + outcome, not numbers.',
        'Tag agents when it helps them look good.',
        'One win post can fuel a week of Stories reposts.'
      ]
    },
    Value: {
      title: 'Value & Resources Pillar',
      badge: '15% of your feed',
      whyWorks: 'Free useful tools position you as the generous expert who helps before someone is ready to buy — digital “give before you ask.”',
      cadence: '<strong>1 value/resource post per week.</strong> Rotate checklists, vendor lists, and maintenance tips. Refresh and re-announce quarterly.',
      execution: [
        'Offer one specific resource with a clear CTA (“Comment CHECKLIST”).',
        'Deliver personally via DM when possible — builds relationship.',
        'Track who requests — light CRM note, no hard pitch.',
        'Repurpose the resource into newsletter + blog within 2 weeks.'
      ],
      reelTips: [
        'Flip through the PDF/checklist on camera — “Page 3 is the one everyone misses.”',
        '“Free tool I give every client” + link in bio or DM keyword.',
        'Screen-record scrolling the guide with voiceover tips.'
      ],
      examples: [
        { title: '2026 Buyer Checklist', text: 'Grabbing my updated 2026 Home Buyer Checklist? DM “CHECKLIST” — 11 pages, zero fluff, updated for current programs.' },
        { title: 'Post-Close Checklist', text: 'Just closed? Here’s my 7-day, 30-day, and 90-day checklist so you feel supported after the keys. Comment “POST CLOSE” and I’ll send it.' },
        { title: 'Vendor List', text: 'My go-to inspectors, movers, painters, and handymen who actually show up. Updated quarterly. Happy to share if you’re under contract.' },
        { title: 'Maintenance Calendar', text: 'Seasonal home maintenance calendar — one task per month so nothing falls through the cracks. Comment “MAINTENANCE” if you want it.' },
        { title: 'Current Programs Sheet', text: '2026 first-time buyer programs actually working in our area — DPA, low down, buydown strategies. DM “PROGRAMS” for the latest one-pager.' }
      ],
      proTips: [
        'Genuinely valuable — not disguised lead magnets.',
        'Personal delivery beats auto-DM bots when you can.',
        'Co-brand with realtors on buyer guides.',
        'Best resources become permanent site/blog assets.'
      ]
    },
    Engagement: {
      title: 'Engagement & Polls Pillar',
      badge: '15% of your feed',
      whyWorks: 'The algorithm rewards conversation. Polls and open questions generate comments and votes — signals that expand your reach for free.',
      cadence: '<strong>2–3 engagement posts per week.</strong> Run the same question in Stories and feed. Reply to every comment the same day.',
      execution: [
        'Ask one clear question — binary poll or open-ended.',
        'Keep it fun or local when possible (not always mortgage).',
        'Reply to every comment with a real sentence, not “Thanks!”',
        'Mine comments for next week’s content ideas — log in CRM.'
      ],
      reelTips: [
        'Text-on-screen poll: “Team A or Team B?” with trending audio.',
        'Stitch or duet local business content with your take.',
        '“Answer in the comments” hook in first 2 seconds.'
      ],
      examples: [
        { title: 'This or That', text: 'Beach house or mountain cabin? Vote below — I’ll tell you which financing angles actually matter for each (most people get it wrong).' },
        { title: 'Local Poll', text: 'Best taco truck in town? Drop it below — winner gets a shoutout in next week’s Stories.' },
        { title: 'First-Time Buyer Question', text: 'What’s one thing you wish you knew before buying your first home? No judgment — real answers for anyone looking now.' },
        { title: 'Fun Personality', text: 'Real tree or fake tree this year? I’m team fake. Fight me in the comments (nicely).' },
        { title: 'Tag a Friend', text: 'Tag the friend who still thinks you need 20% down. I have a 3-minute voice note ready that might change their mind.' },
        { title: 'Lunch Spot Poll', text: 'Favorite local spot for a quick client or realtor lunch? I’m always looking for recommendations that feel special but not stuffy.' }
      ],
      proTips: [
        '2–3 polls/questions per week minimum.',
        'Same-day replies on every comment.',
        'Mirror Story polls on feed posts — double the data.',
        'Comments = your content calendar for next month.'
      ]
    }
  };

  const WEEKLY_CONTENT_MATRIX = {
    Personal: [
      { day: 'Mon', type: 'Behind the scenes', note: 'Desk, coffee, week preview — no rates' },
      { day: 'Wed', type: 'Hobby / family moment', note: 'Evening post — ask an open question' },
      { day: 'Sat', type: 'Weekend reset', note: 'Reel-friendly: 15-sec voiceover' }
    ],
    Local: [
      { day: 'Tue', type: 'Business spotlight', note: 'Tag the business — they often repost' },
      { day: 'Fri', type: 'Neighborhood note', note: 'Inventory, event, or hidden gem' }
    ],
    Educational: [
      { day: 'Thu', type: 'One myth-buster', note: 'Never back-to-back with another edu post' }
    ],
    'Client Wins': [
      { day: 'Any', type: '1×/month when permitted', note: 'Emotion + obstacle, not loan amount' }
    ],
    Value: [
      { day: 'Mon', type: 'Resource offer', note: 'Comment keyword → personal DM delivery' }
    ],
    Engagement: [
      { day: 'Wed', type: 'Poll / this-or-that', note: 'Mirror same question in Stories' },
      { day: 'Sun', type: 'Tag-a-friend or open question', note: 'Reply to every comment same day' }
    ]
  };

  const STORY_PROMPTS = {
    Personal: ['Sunday reset in 3 photos', 'What I\'m reading / listening to', 'One thing I\'m grateful for this week'],
    Local: ['Coffee run + local spot tag', 'Open house drive-by (no client faces)', '3 things I love about [neighborhood]'],
    Educational: ['Myth → truth in 3 Story slides', 'Whiteboard 30-sec explainer', 'Screenshot headline + your correction'],
    'Client Wins': ['Keys photo (permission) + 1-line win', 'Testimonial screenshot + thank you', 'Before/after energy caption'],
    Value: ['Flip through checklist PDF', 'DM keyword reminder', 'Free tool I give every client'],
    Engagement: ['Poll sticker: A or B', 'Question box: "What\'s your biggest buyer fear?"', 'Quiz: rent vs own']
  };

  function renderWeeklyMatrix(pillar) {
    const rows = WEEKLY_CONTENT_MATRIX[pillar];
    if (!rows || !rows.length) return '';
    return `
      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Suggested Weekly Rhythm</h4>
      <div class="overflow-x-auto mb-6">
        <table class="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr><th class="text-left p-3 font-semibold">When</th><th class="text-left p-3 font-semibold">Post type</th><th class="text-left p-3 font-semibold">Execution note</th></tr>
          </thead>
          <tbody>
            ${rows.map((r) => `<tr class="border-t border-gray-200 dark:border-gray-700"><td class="p-3 font-medium text-[#00A89D]">${escAttr(r.day)}</td><td class="p-3">${escAttr(r.type)}</td><td class="p-3 text-gray-600 dark:text-gray-400">${escAttr(r.note)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function renderStoryPrompts(pillar) {
    const prompts = STORY_PROMPTS[pillar];
    if (!prompts || !prompts.length) return '';
    return `
      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Stories &amp; Reels Prompts</h4>
      <ul class="text-sm space-y-1.5 mb-6 pl-4 list-disc text-gray-700 dark:text-gray-300">
        ${prompts.map((p) => `<li>${p}</li>`).join('')}
      </ul>`;
  }

  const EXPANDED_EXTRA = {
    Personal: [
      { title: 'Pet + Morning Reset', text: 'Long trail walk with the pup before first call. Zero podcasts — just headspace for client conversations. What do you do to protect bandwidth?' },
      { title: 'Holiday + Roots', text: 'Our family’s favorite July 4th tradition + why I love helping families plant roots in this community.' }
    ],
    Local: [
      { title: 'Restaurant Spotlight', text: 'New restaurant on 3rd — my go-to for client dinners. Great food, better for supporting local.' },
      { title: 'Market Walk-Through', text: 'Walked [Street] open houses Saturday — seeing real price movement buyers can use. Happy to share what I noticed if you’re shopping.' }
    ],
    Educational: [
      { title: 'VA Benefits', text: 'VA loans: more than no down payment — funding fee waiver, no PMI, assumability. Huge advantages right now for eligible buyers.' },
      { title: 'DTI Explained Simply', text: 'DTI isn’t arbitrary — here’s how lenders actually calculate it and what moves the needle before you apply.' }
    ],
    'Client Wins': [
      { title: 'Appraisal Save', text: 'Appraisal came in low — we renegotiated, restructured, and still closed on time. Communication saved the deal.' },
      { title: 'Short Close Timeline', text: '30-day close on a jumbo purchase. Speed + transparency turned a stressed agent into a repeat referrer.' }
    ],
    Value: [
      { title: 'New Homeowner Insurance Prompts', text: 'One-page “after closing” insurance review prompts I send with every keys delivery. Comment INSURANCE for a copy.' },
      { title: 'Rate Watch Explainer', text: 'How I help clients think about rate moves without panic — a simple framework, not a sales pitch. DM FRAMEWORK.' }
    ],
    Engagement: [
      { title: 'Would You Rather (Housing)', text: 'Would you rather: smaller home in your dream neighborhood OR bigger home with a commute? There’s no wrong answer — curious what wins in the comments.' },
      { title: 'Realtor Shoutout Ask', text: 'Drop the name of a realtor who communicates like a true partner. I want to follow and learn from the best in our market.' }
    ]
  };

  function buildSummaryHtml(pillar) {
    const data = SOCIAL_PILLAR_CONTENT[pillar];
    if (!data) return '<p class="p-6">Content coming soon.</p>';

    let html = `<div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
      <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why This Works</span></div>
      <p class="text-[15px] leading-relaxed">${data.whyWorks}</p>
    </div>`;

    html += renderCadence(data.cadence);
    html += renderWeeklyMatrix(pillar);
    html += renderExecutionGuide(data.execution);
    html += renderReelBlock(data.reelTips);
    html += renderStoryPrompts(pillar);

    html += `<h4 class="font-bold text-lg mb-4 text-[#002B5C] dark:text-white">Ready-to-Use Examples (Copy + Save)</h4><div class="space-y-4 mb-6">`;
    data.examples.forEach(ex => { html += renderExampleCard(pillar, ex.title, ex.text); });
    html += '</div>';

    html += renderProTips(data.proTips);

    html += `<button type="button" onclick="window.openExpandedSocialExamplesModal('${escJs(pillar)}')"
      class="w-full mt-2 cursor-pointer border-2 border-dashed border-[#00A89D] hover:bg-[#00A89D]/5 rounded-2xl p-5 flex items-center justify-between text-[#00A89D] font-semibold text-left">
      <span>See full expanded library + bonus scripts →</span><i class="fas fa-arrow-right"></i>
    </button>`;

    html += socialNextSteps([
      { label: 'Blog Creator', onclick: "window.closeSocialContentModal(); if(typeof window.showSection==='function')window.showSection('blog');" }
    ]);

    return html;
  }

  function buildExpandedHtml(pillar) {
    const data = SOCIAL_PILLAR_CONTENT[pillar];
    const extras = EXPANDED_EXTRA[pillar] || [];
    const allExamples = data ? data.examples.concat(extras) : extras;

    let html = `<div class="bg-[#F15A29]/10 border border-[#F15A29]/30 rounded-3xl p-6 mb-6">
      <div class="font-bold text-[#F15A29] mb-2 uppercase tracking-wider text-sm">Expanded Library</div>
      <p class="text-[15px]">Every script below is ready to copy, personalize with your market/voice, and post. Batch 3 on Sunday, schedule the week, reply to every comment.</p>
    </div>`;

    html += `<div class="space-y-4 mb-6">`;
    allExamples.forEach(ex => { html += renderExampleCard(pillar, ex.title, ex.text, 'Expanded ' + pillar); });
    html += '</div>';

    if (data) {
      html += `<div class="p-4 bg-[#002B5C]/5 border border-[#002B5C]/20 rounded-2xl text-sm mb-6">
        <strong>CRM note:</strong> Log which pillar post got the most comments this month. Double that format next month — consistency beats guessing.
      </div>`;
      html += renderProTips(data.proTips);
    }

    html += socialNextSteps([
      { label: 'Newsletter Generator', onclick: "window.closeSocialContentModal(); if(typeof window.showSection==='function')window.showSection('newsletter-generator');" }
    ]);

    return html;
  }

  function setHeader(pillar, mode) {
    const { eyebrow, title, badge, backBtn } = getEls();
    const data = SOCIAL_PILLAR_CONTENT[pillar] || { title: pillar, badge: '' };
    if (eyebrow) eyebrow.textContent = mode === 'expanded' ? 'Social Media Strategy — Expanded Library' : 'Social Media Strategy Playbooks';
    if (title) title.textContent = mode === 'expanded' ? (pillar + ' — Full Script Library') : data.title;
    if (badge) {
      if (data.badge) {
        badge.textContent = data.badge;
        badge.classList.remove('hidden');
      } else badge.classList.add('hidden');
    }
    if (backBtn) {
      if (mode === 'expanded') {
        backBtn.classList.remove('hidden');
        backBtn.onclick = function () { window.openSocialPillarModal(pillar); };
      } else backBtn.classList.add('hidden');
    }
  }

  window.openSocialPillarModal = function (pillar) {
    const { body } = getEls();
    if (!body) { console.error('[Social] modal body not found'); return; }
    _view = { pillar, mode: 'summary' };
    setHeader(pillar, 'summary');
    body.innerHTML = buildSummaryHtml(pillar);
    openShell();
  };

  window.openExpandedSocialExamplesModal = function (pillar) {
    const { body } = getEls();
    if (!body) return;
    _view = { pillar, mode: 'expanded' };
    setHeader(pillar, 'expanded');
    body.innerHTML = buildExpandedHtml(pillar);
    openShell();
  };

  window.openSocialModal = function (pillar) {
    window.openSocialPillarModal(pillar);
  };

  window.closeSocialContentModal = closeShell;
  window.closeSocialModal = closeShell;

  window.toggleSocialPillar = function (pillar) {
    window.openSocialPillarModal(pillar);
  };

  window.SOCIAL_PILLAR_CONTENT = SOCIAL_PILLAR_CONTENT;

  window.closeModal = function () {
    const modal = document.getElementById('content-modal');
    if (modal && (modal.classList.contains('flex') || modal.style.display === 'flex') && !modal.classList.contains('hidden')) {
      closeShell();
      return;
    }
  };

  window.__SOCIAL_MODALS_EXPORTS = {
    openSocialPillarModal: window.openSocialPillarModal,
    openExpandedSocialExamplesModal: window.openExpandedSocialExamplesModal,
    openSocialModal: window.openSocialModal,
    closeSocialContentModal: window.closeSocialContentModal,
    closeSocialModal: window.closeSocialModal,
    toggleSocialPillar: window.toggleSocialPillar,
    closeModal: window.closeModal,
    SOCIAL_PILLAR_CONTENT: SOCIAL_PILLAR_CONTENT
  };

  window.restoreSocialModals = function () {
    const exp = window.__SOCIAL_MODALS_EXPORTS;
    if (!exp) return;
    Object.keys(exp).forEach(function (key) {
      window[key] = exp[key];
    });
  };

  console.log('%c[Social Modals] World-class playbooks loaded (reliable open/close)', 'color:#00A89D;font-weight:bold');
})();