/**
 * Recruiting Sales Coach — content overrides for LO-cloned sections
 */
(function () {
  'use strict';

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setLabelText(forId, text) {
    const el = document.getElementById(forId);
    if (!el) return;
    const label = el.closest('div')?.querySelector('label') || document.querySelector(`label[for="${forId}"]`);
    if (label) label.textContent = text;
  }

  function replaceCheckboxGrid(selector, items, className) {
    const first = document.querySelector(selector);
    if (!first) return;
    const grid = first.closest('.grid');
    if (!grid) return;
    grid.innerHTML = items.map(v => `
      <label class="flex items-center gap-2">
        <input type="checkbox" value="${escapeHtml(v)}" class="${className}"> ${escapeHtml(v)}
      </label>`).join('');
  }

  // ─── Profile & Preferences ───────────────────────────────────────────
  function initRecruitingProfile() {
    const modal = document.getElementById('user-profile-modal');
    if (!modal) return;

    const h2 = modal.querySelector('h2');
    if (h2) h2.textContent = 'Recruiter Profile & Preferences';
    const sub = modal.querySelector('h2 + p');
    if (sub) sub.textContent = 'Powers every recruiting tool — scripts, weekly plan, social, content, and AI Coach.';

    setLabelText('profile-years', 'Years in Recruiting / Mortgage');
    setLabelText('profile-monthly-units', 'Monthly Net Hires Goal');
    setLabelText('profile-monthly-goal', 'Annual Net Hires Goal (optional)');
    setLabelText('profile-focus', 'Primary Recruiting Focus');
    setLabelText('profile-hours', 'Weekly Prospecting Hours Available');

    const teamSel = document.getElementById('profile-team');
    if (teamSel) {
      teamSel.innerHTML = `
        <option value="">Select...</option>
        <option>Solo Recruiter</option>
        <option>Recruiter + Coordinator</option>
        <option>Small Recruiting Team (2–4)</option>
        <option>Regional / Branch Recruiting Lead</option>`;
    }

    const focusSel = document.getElementById('profile-focus');
    if (focusSel) {
      focusSel.innerHTML = `
        <option value="">Select...</option>
        <option>Phone-Heavy Outreach (Tue–Thu bias)</option>
        <option>Social Sourcing (LinkedIn + Facebook)</option>
        <option>Territory / Market Penetration</option>
        <option>Leadership Pipeline (exec calls → hires)</option>
        <option>Balanced Mix (outreach + nurture + social)</option>`;
    }

    const unitsInput = document.getElementById('profile-monthly-units');
    const unitsQuick = unitsInput?.parentElement?.querySelector('select');
    if (unitsQuick) {
      unitsQuick.innerHTML = `
        <option value="">Quick suggestions...</option>
        <option value="4-5 hires">4–5 net hires / mo</option>
        <option value="5-6 hires">5–6 net hires / mo</option>
        <option value="6-7 hires">6–7 net hires / mo</option>
        <option value="7+ hires">7+ net hires / mo</option>`;
    }
    if (unitsInput) unitsInput.placeholder = 'e.g. 5–7 net hires';

    const annualInput = document.getElementById('profile-monthly-goal');
    const annualQuick = annualInput?.parentElement?.querySelector('select');
    if (annualQuick) {
      annualQuick.innerHTML = `
        <option value="">Quick suggestions...</option>
        <option value="48">48 net hires / yr</option>
        <option value="60">60 net hires / yr</option>
        <option value="72">72 net hires / yr</option>
        <option value="84">84 net hires / yr</option>`;
    }
    if (annualInput) annualInput.placeholder = 'e.g. 60';

    const incomeWrap = document.getElementById('profile-income')?.closest('div');
    if (incomeWrap) incomeWrap.classList.add('hidden');

    replaceCheckboxGrid('.profile-partner', [
      'Purchase-focused LOs (30–70 units)',
      'High producers (70+ units)',
      'Ex-Ruoff alumni',
      'New-to-industry LOs with potential',
      'Team leads / branch managers',
      'Self-employed / broker shop LOs',
      'Bank LOs open to movement',
      'Geographic expansion targets'
    ], 'profile-partner');

    const partnerLabel = document.querySelector('.profile-partner')?.closest('.p-5')?.querySelector('label.block');
    if (partnerLabel) partnerLabel.textContent = 'Ideal LO Candidate Profiles (who you recruit)';

    replaceCheckboxGrid('.profile-niche', [
      '30–50 units, 50%+ purchase',
      '50–70 units, purchase-heavy',
      'Strong realtor referral base',
      'First-time LO recruiters (ex-producer)',
      'Frustrated with ops/support',
      'Contract expiring in 3–6 months',
      'Market expansion candidates',
      'Leadership-track producers'
    ], 'profile-niche');

    const nicheLabel = document.querySelector('.profile-niche')?.closest('.p-5')?.querySelector('label.block');
    if (nicheLabel) nicheLabel.textContent = 'Sourcing Criteria & Niches';

    replaceCheckboxGrid('.profile-challenge', [
      'Hitting weekly outreach targets (270/wk)',
      'Converting to quality conversations',
      'Scheduling executive leadership calls',
      'Handling "I\'m happy" objections',
      'Consistent Shape logging',
      'Building authentic social presence',
      'Long-term nurture discipline',
      'Standing out from other recruiters'
    ], 'profile-challenge');

    replaceCheckboxGrid('.profile-activity', [
      'Phone calls (Tue–Thu blocks)',
      'Text follow-ups',
      'LinkedIn messaging',
      'Facebook messaging',
      'Social connection requests',
      'Shape prospect review',
      'Leadership call prep',
      'Value-only nurture touches'
    ], 'profile-activity');

    console.log('[recruiting-content] Profile fields updated for recruiting');
  }

  // ─── Social Post Types ─────────────────────────────────────────────────
  function initRecruitingSocialPostTypes() {
    const sel = document.getElementById('post-type');
    if (!sel) return;

    sel.innerHTML = `
      <option value=" " selected class="font-bold">Use Custom Idea (type below)</option>
      <option value="" disabled>──────────────────</option>
      <optgroup label="Personal & Authentic (80% Rule)">
        <option value="Behind the scenes of my recruiting week">Behind the scenes of my recruiting week</option>
        <option value="Family or personal milestone — human first">Family or personal milestone</option>
        <option value="Favorite local spot or community moment">Favorite local spot or community moment</option>
        <option value="Hobby, sports, or weekend activity">Hobby, sports, or weekend activity</option>
        <option value="What I love about helping LOs grow">What I love about helping LOs grow</option>
        <option value="Grateful for this chapter of my career">Grateful for this chapter of my career</option>
        <option value="Relatable work-life balance moment">Relatable work-life balance moment</option>
        <option value="Book or podcast that shaped my recruiting mindset">Book or podcast that shaped my recruiting mindset</option>
      </optgroup>
      <optgroup label="Ruoff Culture & Platform (20%)">
        <option value="Why producers choose Ruoff — culture story">Why producers choose Ruoff — culture story</option>
        <option value="Operations support that actually shows up">Operations support that actually shows up</option>
        <option value="Technology / Ruoff+ without a hard pitch">Technology / Ruoff+ without a hard pitch</option>
        <option value="Leadership accessibility — low-pressure clarity">Leadership accessibility — low-pressure clarity</option>
        <option value="Team event or branch culture moment">Team event or branch culture moment</option>
      </optgroup>
      <optgroup label="Recruiting Thought Leadership">
        <option value="Quality conversations beat raw volume">Quality conversations beat raw volume</option>
        <option value="Platform vs sign-on bonus — long-term thinking">Platform vs sign-on bonus — long-term thinking</option>
        <option value="How I nurture prospects who aren't ready yet">How I nurture prospects who aren't ready yet</option>
        <option value="What makes a great LO recruiting conversation">What makes a great LO recruiting conversation</option>
        <option value="Tuesday–Thursday phone rhythm that works">Tuesday–Thursday phone rhythm that works</option>
      </optgroup>
      <optgroup label="Connection & Engagement">
        <option value="Celebrating a newly hired LO (with permission)">Celebrating a newly hired LO (with permission)</option>
        <option value="Congrats to a producer on a production milestone">Congrats to a producer on a production milestone</option>
        <option value="Poll: what matters most in your next shop?">Poll: what matters most in your next shop?</option>
        <option value="Open question for LOs in my market">Open question for LOs in my market</option>
        <option value="LinkedIn connection invite post — value first">LinkedIn connection invite — value first</option>
      </optgroup>
      <optgroup label="Industry Insight (no rate pitch)">
        <option value="Purchase business focus in today's market">Purchase business focus in today's market</option>
        <option value="What strong producers look for in a platform">What strong producers look for in a platform</option>
        <option value="Career growth paths for loan officers">Career growth paths for loan officers</option>
      </optgroup>`;

    const helper = sel.parentElement?.querySelector('p.text-sm');
    if (helper) {
      helper.innerHTML = 'Ruoff recruiting social: <strong>80% personal/authentic</strong>, <strong>20% Ruoff-focused</strong>. Goal: 15–20 new LO connections per week on Facebook + LinkedIn.';
    }

    window.RECRUITING_IDEA_POOLS = {
      personal: ['Recruiting week behind the scenes', 'Family milestone', 'Local community shoutout', 'Hobby or sports moment', 'Grateful career post', 'Work-life balance truth'],
      engagement: ['What matters most in your next shop?', 'Purchase vs refi focus poll', 'Open question for local LOs', 'Tag a producer who leads with heart'],
      tips: ['Quality convos over volume', 'Platform vs bonus framing', 'Nurture without pressure', 'Shape logging discipline', 'Tue–Thu phone blocks'],
      fun: ['Weekend plans', 'Favorite coffee run', 'Team celebration'],
      community: ['Local event', 'Market shoutout', 'Congrats on production win']
    };

    console.log('[recruiting-content] Social post types replaced');
  }

  // ─── Prospect Nurturing overhaul ─────────────────────────────────────
  const NURTURE_PILLARS = {
    'hot-pipeline': {
      title: 'Hot Pipeline',
      icon: 'fa-fire',
      desc: 'Active conversations and executive calls in motion. Highest-touch — nothing drops.',
      cadence: 'Same-day follow-up after every quality call. Log every touch in Shape.',
      scripts: [
        'Thanks for the time today — I appreciated hearing about [specific thing they shared]. I\'ll send a quick calendar link for the leadership conversation we discussed.',
        'Quick follow-up from our call — no pressure, just wanted to confirm [day/time] still works for a 20-minute clarity call with our leadership team.'
      ]
    },
    'warm-nurture': {
      title: 'Warm Nurture',
      icon: 'fa-seedling',
      desc: 'Quality conversations had, not ready yet. Social connected, scheduled future touch.',
      cadence: 'Monthly value touch + quarterly phone check-in. 3–6 month revisit windows.',
      scripts: [
        'Hey [Name] — thinking about our conversation about [topic]. No agenda — just saw [personal/market thing] and thought of you.',
        'Would it be okay if I checked back in this fall? I\'ll keep sharing useful content in the meantime — zero pressure.'
      ]
    },
    'long-game': {
      title: 'Long-Game Prospects',
      icon: 'fa-hourglass-half',
      desc: 'Sourced in Shape, early outreach, or "maybe later" — stay visible without recruiting pressure.',
      cadence: 'Light social engagement + 90-day check-in cycle. Automated birthday/anniversary where possible.',
      scripts: [
        'Would you be open to connecting on LinkedIn? I share recruiting insights and industry content — no constant pitching.',
        'I\'ll circle back in a few months — in the meantime, congrats on [recent production post / milestone].'
      ]
    },
    're-engage': {
      title: 'Re-Engage (Went Quiet)',
      icon: 'fa-redo',
      desc: 'Had a good conversation then silence. Gentle, specific, no guilt.',
      cadence: 'One thoughtful touch every 4–6 weeks max. Change channel if needed (text vs LinkedIn).',
      scripts: [
        'Hi [Name] — we spoke a while back about [specific topic]. Totally understand if timing still isn\'t right — wanted to share [one useful thing] and leave the door open.',
        'Quick note — no ask attached. If you\'re ever curious what platform support looks like at Ruoff, I\'m always happy to facilitate a no-pressure leadership chat.'
      ]
    },
    'hired-alumni': {
      title: 'Hired LOs & Alumni',
      icon: 'fa-star',
      desc: 'Stay connected with hired producers and ex-Ruoff relationships for referrals and market intel.',
      cadence: 'Quarterly check-in + celebrate their wins publicly (with permission).',
      scripts: [
        'Congrats on [milestone] — really enjoyed being part of your journey to Ruoff.',
        'Saw your post about [win] — proud to see you thriving. Let me know if I can ever support you or your team.'
      ]
    },
    'sourcing-pool': {
      title: 'Weekly Sourcing Pool',
      icon: 'fa-search',
      desc: 'Fresh Shape prospects matching criteria: 30–70 units, 50%+ purchase. Weekly review ritual.',
      cadence: 'Review every Monday. Prioritize Tue–Thu outreach blocks.',
      scripts: [
        'Our executive team has been impressed with the business you\'ve been building — they asked me to see if you\'d be open to a short conversation.',
        'How\'s your week going so far? [pause] I\'m reaching out because [specific production compliment] stood out in our market.'
      ]
    }
  };

  function showRecruitingNurtureModal(pillarId) {
    const p = NURTURE_PILLARS[pillarId];
    if (!p) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h3 class="text-2xl font-bold text-[#002B5C] dark:text-white">${escapeHtml(p.title)}</h3>
            <p class="text-sm text-gray-500 mt-1">${escapeHtml(p.desc)}</p>
          </div>
          <button class="text-3xl text-gray-400 hover:text-red-500" type="button" data-close>&times;</button>
        </div>
        <div class="p-6 overflow-y-auto max-h-[65vh] space-y-4 text-sm">
          <div class="p-4 rounded-2xl bg-[#00A89D]/5 border border-[#00A89D]/20">
            <strong class="text-[#00A89D]">Cadence:</strong> ${escapeHtml(p.cadence)}
          </div>
          <div>
            <strong class="text-[#F15A29]">Sample language:</strong>
            <ul class="mt-2 space-y-3">
              ${p.scripts.map(s => `<li class="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">${escapeHtml(s)}</li>`).join('')}
            </ul>
          </div>
          <button type="button" onclick="if(typeof window.showSection==='function')window.showSection('recruiting-script')"
                  class="w-full py-3 rounded-2xl bg-[#002B5C] text-white font-semibold hover:bg-black transition">
            Generate custom scripts for this pillar →
          </button>
        </div>
      </div>`;
    modal.querySelector('[data-close]').onclick = () => modal.remove();
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  }

  function initRecruitingProspectNurturing() {
    const section = document.getElementById('database');
    if (!section) return;

    const metrics = window.RECRUITING_METRICS || {};
    const w = metrics.weekly || {};

    const pillarCards = Object.keys(NURTURE_PILLARS).map(id => {
      const p = NURTURE_PILLARS[id];
      return `
        <div data-nurture-pillar="${id}" class="cursor-pointer group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-[#00A89D] rounded-3xl p-6 transition-all hover:shadow-lg">
          <div class="flex items-start gap-3">
            <i class="fas ${p.icon} text-2xl text-[#00A89D] mt-0.5"></i>
            <div class="flex-1">
              <div class="font-bold text-lg mb-1 group-hover:text-[#00A89D]">${escapeHtml(p.title)}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">${escapeHtml(p.desc)}</div>
              <div class="mt-2 text-xs text-[#00A89D] font-semibold group-hover:underline">Cadence, scripts &amp; actions →</div>
            </div>
          </div>
        </div>`;
    }).join('');

    section.innerHTML = `
      <div class="text-center mb-6">
        <h2 class="text-3xl font-bold mb-2 text-[#F15A29]">Prospect Nurturing</h2>
        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-4xl mx-auto">Your Shape pipeline — tiered, systematic, and built for the long game. Quality conversations move to leadership; everyone else stays warm.</p>
        <div class="mt-3 inline-block text-sm px-4 py-1 rounded-full bg-[#00A89D]/10 text-[#00A89D] font-medium">
          Shape is system of record — log every meaningful touch
        </div>
      </div>

      <div class="mb-10 rounded-3xl border-2 border-[#002B5C]/20 bg-gradient-to-br from-[#002B5C]/5 to-white dark:from-gray-900 dark:to-gray-800 p-6">
        <h3 class="text-xl font-bold text-[#002B5C] dark:text-white mb-4 flex items-center gap-2">
          <i class="fas fa-layer-group text-[#00A89D]"></i> Prospect Tiering (A / B / C)
        </h3>
        <div class="grid md:grid-cols-3 gap-4 mb-4">
          <div class="bg-white dark:bg-gray-900 border border-[#F15A29]/30 rounded-2xl p-5">
            <div class="font-bold text-[#F15A29] mb-1">A — Hot (Top 30–50)</div>
            <p class="text-sm text-gray-600 dark:text-gray-400">50+ units or active leadership track. Same-day follow-up, exec call prep, personal touches.</p>
          </div>
          <div class="bg-white dark:bg-gray-900 border border-[#00A89D]/30 rounded-2xl p-5">
            <div class="font-bold text-[#00A89D] mb-1">B — Warm (Next 100–150)</div>
            <p class="text-sm text-gray-600 dark:text-gray-400">30–70 units, quality convo had. Monthly nurture, quarterly call, social engagement.</p>
          </div>
          <div class="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-2xl p-5">
            <div class="font-bold text-gray-700 dark:text-gray-300 mb-1">C — Long Game</div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Sourced but cold or "not now." Light automated + social only. Re-rank every 90 days.</p>
          </div>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400"><strong class="text-[#F15A29]">Time rule:</strong> 50%+ personal time on A • 30–35% on B • 10–15% on C. Block A-tier touches in your <span class="text-[#00A89D] font-semibold cursor-pointer underline" data-goto="weekly-win-plan">Weekly Recruiting Plan</span>.</p>
      </div>

      <div class="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
        <div class="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <div class="text-xl font-black text-[#002B5C] dark:text-white">${w.outreachAttempts || 270}</div>
          <div class="text-[10px] font-semibold text-gray-500 uppercase">Outreach / wk</div>
        </div>
        <div class="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <div class="text-xl font-black text-[#00A89D]">${w.qualityConversations?.min || 24}–${w.qualityConversations?.max || 25}</div>
          <div class="text-[10px] font-semibold text-gray-500 uppercase">Quality convos</div>
        </div>
        <div class="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <div class="text-xl font-black text-[#F15A29]">${w.executiveCallsScheduled?.min || 4.8}–${w.executiveCallsScheduled?.max || 5.1}</div>
          <div class="text-[10px] font-semibold text-gray-500 uppercase">Exec calls sched.</div>
        </div>
        <div class="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <div class="text-xl font-black text-[#002B5C] dark:text-white">${(w.bestOutreachDays || ['Tue','Wed','Thu']).join('·')}</div>
          <div class="text-[10px] font-semibold text-gray-500 uppercase">Best call days</div>
        </div>
      </div>

      <h3 class="text-xl font-bold mb-5 text-[#002B5C] dark:text-white">6 Nurturing Pillars for Recruiters</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">${pillarCards}</div>

      <div class="rounded-3xl border border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
        <h4 class="font-bold text-[#002B5C] dark:text-white mb-3">12-Touch Nurture Cadence (Practical)</h4>
        <div class="grid md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
          <ul class="space-y-1.5 list-disc list-inside">
            <li>Post-call thank-you text (same day)</li>
            <li>LinkedIn/Facebook connection request</li>
            <li>30-day value-only check-in</li>
            <li>Comment on their production post</li>
            <li>90-day "how are things going" call</li>
            <li>6-month scheduled revisit</li>
          </ul>
          <ul class="space-y-1.5 list-disc list-inside">
            <li>Share relevant Ruoff culture content (no pitch)</li>
            <li>Congratulate visible production win</li>
            <li>Invite to low-pressure virtual event</li>
            <li>Leadership call re-offer when window opens</li>
            <li>Annual "still here if curious" touch</li>
            <li>Log every touch in Shape — non-negotiable</li>
          </ul>
        </div>
      </div>`;

    section.querySelectorAll('[data-nurture-pillar]').forEach(card => {
      card.addEventListener('click', () => showRecruitingNurtureModal(card.getAttribute('data-nurture-pillar')));
    });
    section.querySelector('[data-goto="weekly-win-plan"]')?.addEventListener('click', () => {
      if (typeof window.showSection === 'function') window.showSection('weekly-win-plan');
    });

    window.openDatabaseModal = function (pillar) {
      const map = {
        'a-plus-vips': 'hot-pipeline',
        'past-clients': 'hired-alumni',
        'sphere-of-influence': 'warm-nurture',
        'referral-partners': 'sourcing-pool',
        'community-connections': 'long-game',
        'prospects': 're-engage'
      };
      showRecruitingNurtureModal(map[pillar] || 'warm-nurture');
    };

    console.log('[recruiting-content] Prospect Nurturing section rebuilt');
  }

  // ─── Weekly Win Plan section copy ────────────────────────────────────
  function initRecruitingWeeklyCopy() {
    const section = document.getElementById('weekly-win-plan');
    if (!section) return;

    section.querySelectorAll('h2, h3, p').forEach(el => {
      const t = el.textContent || '';
      if (t.includes('Weekly Win Plan')) el.textContent = t.replace(/Weekly Win Plan/g, 'Weekly Recruiting Plan');
      if (t.includes('loan officer') || t.includes('Loan Officer')) {
        el.textContent = t.replace(/loan officers?/gi, 'recruiters').replace(/Loan Officers?/g, 'Recruiters');
      }
    });

    const pregen = section.querySelector('#weekly-pregen-guidance');
    if (pregen) {
      pregen.querySelectorAll('p, span, div').forEach(el => {
        if ((el.textContent || '').includes('referral')) {
          el.textContent = el.textContent.replace(/referral partners?/gi, 'LO prospects').replace(/realtor/gi, 'candidate');
        }
      });
    }

    const genBtn = document.getElementById('generate-win-plan-btn');
    if (genBtn && genBtn.textContent.includes('Weekly Win')) {
      genBtn.innerHTML = genBtn.innerHTML.replace(/Weekly Win Plan/g, 'Weekly Recruiting Plan');
    }
  }

  function initRecruitingBlogTopics() {
    const sel = document.getElementById('blog-topic-select');
    if (!sel) return;

    sel.innerHTML = `
      <option value="">Select a recruiting topic...</option>
      <optgroup label="Recruiting Thought Leadership">
        <option value="Why purchase-focused producers choose platform over sign-on bonuses">Why purchase-focused producers choose platform over sign-on bonuses</option>
        <option value="Quality conversations beat raw outreach volume">Quality conversations beat raw outreach volume</option>
        <option value="How to nurture LOs who aren't ready to move yet">How to nurture LOs who aren't ready to move yet</option>
        <option value="What makes a great executive leadership recruiting call">What makes a great executive leadership recruiting call</option>
        <option value="Tuesday–Thursday phone rhythm that actually works">Tuesday–Thursday phone rhythm that actually works</option>
      </optgroup>
      <optgroup label="Ruoff Platform & Culture">
        <option value="Operations support that shows up when producers need it">Operations support that shows up when producers need it</option>
        <option value="Ruoff+ and technology without a hard pitch">Ruoff+ and technology without a hard pitch</option>
        <option value="Leadership accessibility — low-pressure clarity">Leadership accessibility — low-pressure clarity</option>
        <option value="Culture stories from producers who chose Ruoff">Culture stories from producers who chose Ruoff</option>
      </optgroup>
      <optgroup label="LO Career Growth">
        <option value="Career paths for purchase-focused loan officers">Career paths for purchase-focused loan officers</option>
        <option value="What 30–70 unit producers look for in their next shop">What 30–70 unit producers look for in their next shop</option>
        <option value="Building a personal brand that attracts the right LOs">Building a personal brand that attracts the right LOs</option>
      </optgroup>
      <optgroup label="Authentic Recruiter Brand">
        <option value="Behind the scenes of my recruiting week">Behind the scenes of my recruiting week</option>
        <option value="What I love about helping LOs grow their business">What I love about helping LOs grow their business</option>
        <option value="Books and habits that shaped my recruiting mindset">Books and habits that shaped my recruiting mindset</option>
      </optgroup>
      <optgroup label="Industry Insight (no rate pitch)">
        <option value="Purchase business focus in today's market">Purchase business focus in today's market</option>
        <option value="Platform vs comp — long-term thinking for producers">Platform vs comp — long-term thinking for producers</option>
      </optgroup>`;
    console.log('[recruiting-content] Blog topics replaced');
  }

  function initRecruitingSocialThemes() {
    const map = {
      'theme-refi': 'Career growth & platform thinking',
      'theme-cashout': 'Ops support & leadership stories',
      'theme-purchase': 'Purchase-focused producer culture',
      'theme-equity': 'Ruoff tech / Ruoff+ (light touch)'
    };
    Object.entries(map).forEach(([id, label]) => {
      const cb = document.getElementById(id);
      if (!cb) return;
      const span = cb.parentElement?.querySelector('span') || cb.nextElementSibling;
      if (span) span.textContent = label;
    });
  }

  function initRecruitingWeeklyUnified() {
    document.querySelectorAll('a[href="#prospecting"]').forEach((a) => {
      a.closest('li')?.classList.add('hidden');
    });
    const prospecting = document.getElementById('prospecting');
    if (prospecting) {
      prospecting.classList.add('hidden');
      prospecting.setAttribute('aria-hidden', 'true');
    }

    const wrapper = document.getElementById('generate-plan-wrapper');
    if (!wrapper || document.getElementById('wwp-hours')) return;

    const panel = document.createElement('div');
    panel.id = 'recruiting-wwp-customize';
    panel.innerHTML = `
      <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 mb-8 shadow-sm">
        <div class="flex flex-col md:flex-row md:items-center gap-5">
          <div class="flex-1">
            <div class="uppercase tracking-[1.5px] text-xs font-bold text-[#00A89D] mb-2">PULLED FROM YOUR PROFILE</div>
            <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-lg font-semibold">
              <div><span id="wwp-goal-display" class="text-2xl font-extrabold text-[#002B5C] dark:text-white">5</span> <span class="text-sm font-normal text-gray-500">net hires/mo</span></div>
              <div class="text-gray-300">•</div>
              <div><span id="wwp-hours-display" class="text-2xl font-extrabold text-[#002B5C] dark:text-white">15–20</span> <span class="text-sm font-normal text-gray-500">hrs/week</span></div>
              <div class="text-gray-300">•</div>
              <div><span id="wwp-focus-display" class="font-bold text-[#F15A29]">Balanced</span></div>
            </div>
          </div>
          <button type="button" onclick="openUserProfile()" class="text-sm px-6 py-3 rounded-2xl border-2 border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold"><i class="fas fa-cog"></i> Edit Profile</button>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 mb-8 shadow-sm">
        <div class="text-sm font-bold tracking-wider text-[#00A89D] mb-1">CUSTOMIZE THIS WEEK</div>
        <div class="text-xl font-semibold mb-5">Protected time blocks + daily recruiting tasks</div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="bg-gray-50 dark:bg-gray-900/60 rounded-2xl p-5 border">
            <label class="text-sm font-semibold text-[#00A89D]"><i class="fas fa-clock mr-1"></i> Target Hours</label>
            <div class="font-extrabold text-3xl tabular-nums mt-2" id="wwp-hours-value">15</div>
            <input type="range" id="wwp-hours" min="5" max="30" step="1" value="15" class="w-full accent-[#00A89D] mt-2 cursor-pointer">
          </div>
          <div class="bg-gray-50 dark:bg-gray-900/60 rounded-2xl p-5 border">
            <label class="block text-sm font-semibold text-[#00A89D] mb-3"><i class="fas fa-bullseye mr-1"></i> Focus This Week</label>
            <div class="flex flex-wrap gap-2 text-sm">
              <label class="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border cursor-pointer"><input type="checkbox" id="wwp-emphasis-phone" checked class="accent-[#00A89D]"> Phone (Tue–Thu)</label>
              <label class="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border cursor-pointer"><input type="checkbox" id="wwp-emphasis-linkedin" checked class="accent-[#00A89D]"> LinkedIn/FB</label>
              <label class="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border cursor-pointer"><input type="checkbox" id="wwp-emphasis-shape" class="accent-[#00A89D]"> Shape review</label>
              <label class="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border cursor-pointer"><input type="checkbox" id="wwp-emphasis-nurture" class="accent-[#00A89D]"> Nurture</label>
              <label class="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border cursor-pointer"><input type="checkbox" id="wwp-emphasis-social" class="accent-[#00A89D]"> Social connections</label>
            </div>
          </div>
          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-2xl p-5">
            <label class="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" id="wwp-weave-hobbies" checked class="w-5 h-5 mt-0.5 accent-[#00A89D]">
              <div><span class="font-bold text-[#00A89D]">Blend hobbies</span><div class="text-xs text-gray-600 dark:text-gray-300 mt-1">Warmer outreach that feels like you.</div></div>
            </label>
          </div>
        </div>
        <div id="wwp-live-summary" class="mt-5 text-center text-xs font-medium text-[#00A89D]">~16 protected blocks • customize above</div>
      </div>`;
    wrapper.parentNode.insertBefore(panel, wrapper);

    setTimeout(() => {
      if (typeof window.wireWeeklyCustomizeControls === 'function') {
        window.wireWeeklyCustomizeControls();
      } else if (typeof window.updateWeeklyCustomizeDisplays === 'function') {
        window.updateWeeklyCustomizeDisplays();
      }
    }, 50);
    console.log('[recruiting-content] Weekly unified customize panel injected');
  }

  function initRecruitingPlanStyles() {
    // Migrate legacy LO plan-style values from localStorage / saved baselines
    const legacyStyleMap = {
      'Referral Mastery': 'Phone-Heavy Outreach',
      'Database Reactor': 'Nurture Pipeline',
      'Balanced Growth': 'Balanced Recruiting'
    };
    const savedStyle = localStorage.getItem('winPlan_plan-style');
    if (savedStyle && legacyStyleMap[savedStyle]) {
      localStorage.setItem('winPlan_plan-style', legacyStyleMap[savedStyle]);
    }
    const checked = document.querySelector('input[name="plan-style"]:checked');
    if (checked && legacyStyleMap[checked.value]) {
      const mapped = legacyStyleMap[checked.value];
      const target = Array.from(document.querySelectorAll('input[name="plan-style"]')).find(r => r.value === mapped);
      if (target) {
        checked.checked = false;
        target.checked = true;
        if (typeof window.wirePlanStyleCards === 'function') window.wirePlanStyleCards();
      }
    }
  }

  function applyRecruitingTextPatches(root) {
    if (!root) return;
    const reps = [
      [/loan origination/gi, 'mortgage recruiting'],
      [/loan officers?/gi, 'recruiters'],
      [/LOAN OFFICER/g, 'RECRUITER'],
      [/referral partners?/gi, 'LO prospects'],
      [/realtors?/gi, 'LO prospects'],
      [/borrowers?/gi, 'LO prospects'],
      [/Value Vault/gi, 'Prospect Nurturing'],
      [/Weekly Win Plan/gi, 'Weekly Recruiting Plan'],
      [/CORE TRUTHS EVERY LO NEEDS/gi, 'CORE TRUTHS EVERY RECRUITER NEEDS'],
      [/FOUNDATIONAL FOR EVERY LOAN OFFICER/gi, 'FOUNDATIONAL FOR EVERY RECRUITER'],
    ];
    root.querySelectorAll('p, h2, h3, h4, span, label, div.text-xs').forEach((el) => {
      if (el.children.length > 2) return;
      let t = el.textContent || '';
      if (!/loan|realtor|referral partner|borrower|LO NEEDS|LOAN OFFICER|Value Vault|Weekly Win/i.test(t)) return;
      reps.forEach(([re, r]) => { t = t.replace(re, r); });
      el.textContent = t;
    });
  }

  function initRecruitingMindsetCopy() {
    const section = document.getElementById('mindset-motivation');
    if (!section) return;
    applyRecruitingTextPatches(section);
    const sub = section.querySelector('h2 + p');
    if (sub && sub.textContent.includes('top producers')) {
      sub.textContent = sub.textContent.replace(/top producers/gi, 'top recruiters');
    }
  }

  function initRecruitingBookCopy() {
    const section = document.getElementById('books');
    if (!section) return;
    applyRecruitingTextPatches(section);
    const sub = section.querySelector('h2 + p');
    if (sub && !sub.textContent.includes('recruiters')) {
      sub.textContent = 'Curated books that actually move the needle for mortgage recruiters.';
    }
  }

  function initRecruitingBlogCopy() {
    const section = document.getElementById('blog');
    if (!section) return;

    section.querySelectorAll('p').forEach(p => {
      const t = p.textContent || '';
      if (t.includes('loan officer') || t.includes('GEO') || t.includes('borrower')) {
        p.textContent = t
          .replace(/loan officers?/gi, 'recruiters')
          .replace(/borrowers?/gi, 'LO prospects')
          .replace(/clients? and realtors/gi, 'LO prospects')
          .replace(/mortgage content/gi, 'recruiting content');
      }
    });

    const topicInput = document.getElementById('blog-topic');
    if (topicInput) topicInput.placeholder = 'e.g. Why purchase-focused producers value platform support over sign-on bonuses';

    const keywordInput = document.getElementById('blog-keyword');
    if (keywordInput) keywordInput.placeholder = 'e.g. loan officer recruiting, mortgage career growth';
  }

  function init() {
    initRecruitingProfile();
    initRecruitingSocialPostTypes();
    initRecruitingSocialThemes();
    initRecruitingProspectNurturing();
    initRecruitingWeeklyCopy();
    initRecruitingWeeklyUnified();
    initRecruitingPlanStyles();
    initRecruitingBlogTopics();
    initRecruitingBlogCopy();
    initRecruitingMindsetCopy();
    initRecruitingBookCopy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.initRecruitingContentOverrides = init;
  console.log('[recruiting-content-overrides] Loaded');
})();