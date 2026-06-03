/**
 * js/features/weekly-win-plan.js
 *
 * Weekly Win Plan / Business Planning & Setup
 * Extracted from monolithic index.html (Phase 1)
 *
 * Includes:
 * - generatePlan (AI-powered custom 2026 plan + snapshot)
 * - copyPlanFormatted / downloadPlanWord
 * - Full userSetup object + wizard (openSetupWizard, saveSetup)
 * - updateSetupDisplays, updateProgress, streak tracking
 * - Heavy localStorage persistence (winPlan_* keys + winPlanSetup)
 * - Auto-save listeners for all fields, hobbies, activities
 * - Load-on-start logic
 *
 * Self-initializes. Exposes public API on window.
 */

(function () {
  'use strict';

  console.log('%c[weekly-win-plan.js] FILE STARTED EXECUTING', 'color: lime; font-size: 13px');
  console.log('[weekly-win-plan.js] Script is running - looking for generate button...');

  // =====================================================
  // CENTRAL PROFILE INTEGRATION (new)
  // =====================================================
  function getCentralProfile() {
    try {
      if (window.getUserProfile) return window.getUserProfile();
      return JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch (e) {
      return {};
    }
  }

  // Merge central profile into the local userSetup for this tool
  // (central profile wins for rich fields; keeps backward compat)
  function getEffectiveSetup() {
    const central = getCentralProfile();
    const local = userSetup || {};

    return {
      ...local,
      name: central.name || local.name || "Loan Officer",
      // Unit goal (number of loans) — this is what the Weekly Win Plan cares about for "Monthly Target"
      monthlyUnits: central.monthlyUnits || local.monthlyGoal || local.monthlyUnits || 8,
      // Dollar volume goal (for future use)
      monthlyVolume: central.monthlyGoal || '',
      focus: central.focus || local.focus || '',
      hours: central.hours || local.hours || '',
      hobbies: central.hobbies || local.hobbies || [],
      hobbiesOther: central.hobbiesOther || local.hobbiesOther || '',
      preferredActivities: central.activities || local.preferredActivities || [],
      personality: central.personality || '',
      voiceTraits: central.voiceTraits || [],
      tone: central.tone || '',
      challenges: central.challenges || [],
      partnerTypes: central.partnerTypes || [],
    };
  }

  function renderWeeklyProfileSummary() {
    const container = document.getElementById('weekly-profile-summary');
    if (!container) return;

    const p = getCentralProfile();
    const eff = getEffectiveSetup();

    // Build a nice combined Personality / Voice / Tone string
    const personalityText = p.personality || '';
    const voiceTraits = (p.voiceTraits && p.voiceTraits.length) ? p.voiceTraits.join(', ') : '';
    const tone = p.tone || '';
    const personalityParts = [personalityText, voiceTraits, tone].filter(Boolean);
    const personalityDisplay = personalityParts.length ? personalityParts.join(' • ') : '—';

    const html = `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 min-w-0">
          <div class="flex items-center gap-2 text-[#00A89D] mb-1"><i class="fas fa-user text-sm"></i> <span class="text-xs font-bold tracking-wider">NAME</span></div>
          <div class="font-semibold text-gray-900 dark:text-white text-[15px] break-words leading-tight">${p.name || eff.name || '—'}</div>
        </div>
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 min-w-0">
          <div class="flex items-center gap-2 text-[#00A89D] mb-1"><i class="fas fa-bullseye text-sm"></i> <span class="text-xs font-bold tracking-wider">MONTHLY GOAL</span></div>
          <div class="font-semibold text-gray-900 dark:text-white text-[15px] break-words leading-tight">${p.monthlyUnits || eff.monthlyUnits || '—'} loans</div>
        </div>
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 min-w-0">
          <div class="flex items-center gap-2 text-[#00A89D] mb-1"><i class="fas fa-dollar-sign text-sm"></i> <span class="text-xs font-bold tracking-wider">VOLUME GOAL</span></div>
          <div class="font-semibold text-gray-900 dark:text-white text-[15px] break-words leading-tight">${p.monthlyGoal || eff.monthlyVolume || '—'}</div>
        </div>
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 min-w-0">
          <div class="flex items-center gap-2 text-[#00A89D] mb-1"><i class="fas fa-clock text-sm"></i> <span class="text-xs font-bold tracking-wider">HOURS/WEEK</span></div>
          <div class="font-semibold text-gray-900 dark:text-white text-[15px] break-words leading-tight">${p.hours || eff.hours || '—'} hrs</div>
        </div>
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 min-w-0 col-span-2">
          <div class="flex items-center gap-2 text-[#00A89D] mb-1"><i class="fas fa-bullseye text-sm"></i> <span class="text-xs font-bold tracking-wider">PRIMARY FOCUS</span></div>
          <div class="font-semibold text-gray-900 dark:text-white text-[15px] break-words leading-tight">${p.focus || eff.focus || '—'}</div>
        </div>
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 min-w-0 col-span-2">
          <div class="flex items-center gap-2 text-[#00A89D] mb-1"><i class="fas fa-microphone text-sm"></i> <span class="text-xs font-bold tracking-wider">PERSONALITY / VOICE</span></div>
          <div class="font-semibold text-gray-900 dark:text-white text-[15px] break-words leading-tight">${personalityDisplay}</div>
        </div>
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 min-w-0 col-span-2">
          <div class="flex items-center gap-2 text-[#00A89D] mb-1"><i class="fas fa-heart text-sm"></i> <span class="text-xs font-bold tracking-wider">TOP HOBBIES</span></div>
          <div class="font-semibold text-gray-900 dark:text-white text-[15px] break-words leading-tight">${(p.hobbies || []).slice(0,4).join(', ') || p.hobbiesOther || '—'}</div>
        </div>
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 min-w-0 col-span-2">
          <div class="flex items-center gap-2 text-[#00A89D] mb-1"><i class="fas fa-exclamation-triangle text-sm"></i> <span class="text-xs font-bold tracking-wider">KEY CHALLENGES</span></div>
          <div class="font-semibold text-gray-900 dark:text-white text-[15px] break-words leading-tight">${(p.challenges || []).join(', ') || '—'}</div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // Expose for live refresh when central profile is updated
  window.renderWeeklyProfileSummary = renderWeeklyProfileSummary;

  // =====================================================
  // ORIGINAL WEEKLY WIN PLAN CODE (moved as-is)
  // =====================================================

    async function generatePlan(targetOutputId = 'plan-output') {
    // 2026 BUSINESS PLAN ONLY - see top of file for separation from generateWeeklyPlan / Weekly Win Plan
    console.log('%c[weekly-win-plan] generatePlan() called', 'color: #00A89D', 'target:', targetOutputId);

    // ULTRA-DEFENSIVE inline forces (no extra helper fn to avoid any block delta)
    const le0 = document.getElementById('global-loading');
    if (le0) {
      le0.classList.remove('hidden');
      le0.style.setProperty('display', 'flex', 'important');
      le0.style.setProperty('z-index', '99999', 'important');
      le0.style.setProperty('visibility', 'visible', 'important');
      le0.style.setProperty('opacity', '1', 'important');
      le0.style.setProperty('position', 'fixed', 'important');
      le0.style.setProperty('inset', '0', 'important');
    }

    const businessTips = [
      "Great 2026 plans are built on consistent daily activity, not heroic sprints. Small wins compound.",
      "Top producers have 3-5 lead sources. We're tailoring yours based on your profile and chosen style.",
      "Focusing on the activities YOU actually enjoy — that's what makes this plan stick.",
      "Review every 90 days. Markets change, you change, your plan should too.",
      "Your hobbies aren't distractions — they're your secret weapon for authentic relationships and content.",
      "We're weaving in specific tool actions: Weekly Win blocks, Social angles, Referral plays, Value Vault touches, Book & Mindset anchors.",
      "Realistic math first: your targets, your ratios, your current partners and database size.",
      "The best plans feel personal because they are. We're using your exact personality, challenges, and voice.",
      "While you wait: Remember — the plan is a starting point. Execution in Weekly Win is where the magic happens.",
      "Consistency > intensity. We're building a rhythm you can actually maintain all year."
    ];

    if (typeof window.showLoadingWithTips === 'function') {
      window.showLoadingWithTips(businessTips, 'Crafting Your 2026 Business Plan...');
    }

    // force again
    const le1 = document.getElementById('global-loading');
    if (le1) {
      le1.classList.remove('hidden');
      le1.style.setProperty('display', 'flex', 'important');
      le1.style.setProperty('z-index', '99999', 'important');
      le1.style.setProperty('visibility', 'visible', 'important');
      le1.style.setProperty('opacity', '1', 'important');
    }

    // Make the loading experience INCREDIBLE and value-packed while user waits (30-60s)
    // Run enrich synchronously right after show to ensure the modal and progress are visible immediately
    (function enrichPlanLoading() {
      const loadingEl = document.getElementById('global-loading');
      if (!loadingEl) return;

      // Force visible (in case of any timing/CSS race) — extra aggressive
      loadingEl.classList.remove('hidden');
      loadingEl.style.setProperty('display', 'flex', 'important');
      loadingEl.style.setProperty('z-index', '99999', 'important');
      loadingEl.style.setProperty('visibility', 'visible', 'important');
      loadingEl.style.setProperty('opacity', '1', 'important');

      const content = loadingEl.querySelector('div'); // the inner white card
      if (!content) return;

      loadingEl.classList.remove('hidden');
      loadingEl.style.setProperty('display', 'flex', 'important');
      loadingEl.style.setProperty('z-index', '99999', 'important');
      loadingEl.style.setProperty('visibility', 'visible', 'important');
      loadingEl.style.setProperty('opacity', '1', 'important');

      // Enrich with plan-specific value, status, and a visual progress simulation
      const styleVal = document.querySelector('input[name="plan-style"]:checked')?.value || 'Balanced Growth';
      const incomeVal = document.getElementById('target-income')?.value || 'your target';
      const closingsVal = document.getElementById('target-closings')?.value || '?';
      const hobbyEls = Array.from(document.querySelectorAll('.hobby-checkbox:checked')).map(cb => cb.nextElementSibling ? cb.nextElementSibling.textContent.trim() : '');
      const hobbiesStr = hobbyEls.length ? hobbyEls.join(', ') : 'your selected hobbies';

      const enrichHTML = `
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-left">
          <div class="text-xs uppercase tracking-widest text-[#00A89D] mb-2">Building your plan around</div>
          <div class="text-sm text-gray-700 dark:text-gray-300 mb-3">
            <strong>Style:</strong> ${styleVal} &nbsp;•&nbsp; <strong>Target:</strong> ${incomeVal} / ${closingsVal} closings<br>
            <strong>Hobbies fueling it:</strong> ${hobbiesStr}
          </div>

          <div class="mb-3">
            <div class="flex justify-between text-xs mb-1 text-gray-500 dark:text-gray-400">
              <span>AI Analysis Progress</span>
              <span id="plan-progress-pct">12%</span>
            </div>
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div id="plan-progress-bar" class="h-2 bg-gradient-to-r from-[#00A89D] via-[#F15A29] to-[#00A89D] transition-all duration-1000" style="width:12%"></div>
            </div>
          </div>

          <div class="text-xs text-gray-500 dark:text-gray-400">
            <div class="flex items-center gap-2 mb-1"><i class="fas fa-check text-[#00A89D]"></i> Loading your central profile, goals &amp; challenges</div>
            <div class="flex items-center gap-2 mb-1"><i class="fas fa-check text-[#00A89D]"></i> Matching hobbies &amp; preferred activities to real tactics</div>
            <div class="flex items-center gap-2 mb-1"><i class="fas fa-spinner fa-spin text-[#F15A29]"></i> Generating quarterly milestones + Weekly Win actions</div>
            <div class="flex items-center gap-2"><i class="fas fa-spinner fa-spin text-[#F15A29]"></i> Creating cross-tool execution links (Social, Referral, Value Vault, Books, Mindset)</div>
          </div>
        </div>
      `;

      // Clean any previous
      const oldPanel = content.querySelector('#plan-enrich-panel');
      if (oldPanel) oldPanel.remove();

      if (!content.querySelector('#plan-enrich-panel')) {
        const panel = document.createElement('div');
        panel.id = 'plan-enrich-panel';
        panel.innerHTML = enrichHTML;
        content.appendChild(panel);

        // Animate fake progress over ~45 seconds (realistic for the API)
        let pct = 12;
        const bar = panel.querySelector('#plan-progress-bar');
        const pctEl = panel.querySelector('#plan-progress-pct');
        const progressInterval = setInterval(() => {
          pct = Math.min(98, pct + Math.random() * 8 + 3);
          if (bar) bar.style.width = pct + '%';
          if (pctEl) pctEl.textContent = Math.floor(pct) + '%';
          if (pct > 95 || !loadingEl || loadingEl.style.display === 'none') {
            clearInterval(progressInterval);
          }
        }, 2200);
      }
    })();

    const style = document.querySelector('input[name="plan-style"]:checked')?.value || 'Balanced Growth';

    const inputs = {
        income: document.getElementById('target-income')?.value || '',
        commission: document.getElementById('avg-commission')?.value || '',
        closings: document.getElementById('target-closings')?.value || '',
        loanAmount: document.getElementById('avg-loan')?.value || '',
        ratio: document.getElementById('closing-ratio')?.value || '',
        currentPartners: document.getElementById('current-partners')?.value || '',
        newPartners: document.getElementById('new-partners')?.value || '',
        database: document.getElementById('database-size')?.value || ''
    };

    // === FIX: Collect Hobbies & Activities Lists (prefer explicit value for consistency with profile) ===
    const hobbiesList = Array.from(document.querySelectorAll('.hobby-checkbox:checked'))
                             .map(cb => cb.value || (cb.nextElementSibling ? cb.nextElementSibling.textContent.trim() : ''));

    const activitiesList = Array.from(document.querySelectorAll('.activity-checkbox:checked'))
                               .map(cb => cb.value || (cb.nextElementSibling ? cb.nextElementSibling.textContent.trim() : ''));

    const hobbyOther = document.getElementById('hobby-other')?.value || '';

    // Pull rich data from central profile for much better personalization
    const profile = getCentralProfile();
    const richProfile = getEffectiveSetup();

    // Quick client-side calc (unchanged)
    let closings = parseFloat(inputs.closings) || 60;
    const commission = parseFloat(inputs.commission) || 6500;
    if (inputs.income) closings = Math.ceil(parseFloat(inputs.income) / commission);

    const volume = closings * (parseFloat(inputs.loanAmount) || 400000);
    const ratio = (parseFloat(inputs.ratio) || 30) / 100;
    const referrals = Math.ceil(closings / ratio);

    // Show snapshot immediately (in the correct target container)
    const snapshotContainer = document.getElementById(targetOutputId);
    if (snapshotContainer) {
        snapshotContainer.innerHTML = 
            '<div class="bg-gray-50 dark:bg-gray-900 p-10 rounded-3xl mb-8">' +
                '<h3 class="text-2xl font-bold mb-6 text-[#F15A29]">Quick Snapshot (Full Plan Coming...)</h3>' +
                '<ul class="space-y-3 text-lg">' +
                    '<li><strong>Target Closings:</strong> ' + closings + '</li>' +
                    '<li><strong>Target Volume:</strong> $' + volume.toLocaleString() + '</li>' +
                    '<li><strong>Referrals/Leads Needed:</strong> ~' + referrals + '</li>' +
                '</ul>' +
            '</div>';
        snapshotContainer.classList.remove('hidden');
        snapshotContainer.style.display = 'block';
    }

    let fullPlan = '';

    try {
    const prompt = `You are a world-class, empathetic mortgage business coach who makes planning feel exciting and doable instead of stressful. Create a warm, specific, motivating, and realistic 2026 Business Plan for this loan officer. The tone should feel like a supportive mentor who knows their real life — use their hobbies, personality, and challenges to make it personal and fun where it makes sense, but always practical and grounded. NO EMOJIS. Use encouraging language that reduces anxiety ("You don't have to be perfect", "small consistent moves win", "this is built around what already works for you").

Plan Style Chosen: ${style}

DEEP PERSONALIZATION FROM PROFILE (use this heavily — make the plan feel written just for them):
- Name: ${richProfile.name}
- Years in business: ${profile.years || 'not specified'}
- Personality / Voice / Lifestyle: ${profile.personality || richProfile.personality || 'not specified'}
- Preferred Tone for communication: ${profile.tone || richProfile.tone || 'warm and professional'}
- Key Challenges they face: ${(profile.challenges || []).join(', ') || 'general growth and consistency'}
- Target Partner Types: ${(profile.partnerTypes || []).join(', ') || 'realtors and local businesses'}
- Hobbies & Passions (weave these naturally into motivation, content ideas, and relationship building — this is key for authenticity and stickiness): ${[...(profile.hobbies || []), profile.hobbiesOther].filter(Boolean).join(', ') || (hobbiesList.length ? hobbiesList.join(', ') : 'not specified')}
- Preferred Prospecting Activities (prioritize and expand on these): ${[...(profile.activities || []), ...(richProfile.preferredActivities || [])].filter(Boolean).join(', ') || (activitiesList.length ? activitiesList.join(', ') : 'balanced mix')}
- Family / Life notes: ${profile.family || 'not specified'}

BUSINESS NUMBERS (calculate realistically, be honest but inspiring):
- Target Income: ${inputs.income || 'user will calculate from closings'}
- Target Closings / Units: ${inputs.closings || closings}
- Avg Loan Size: ${inputs.loanAmount || '400000'}
- Current Active Referral Partners: ${inputs.currentPartners || 'not specified'}
- New Partners Goal: ${inputs.newPartners || 'not specified'}
- Database Size: ${inputs.database || 'not specified'}
- Closing Ratio: ${inputs.ratio || '30'}%
- Weekly Prospecting Hours available: ${richProfile.hours || 'not specified'}
- Additional notes/priorities: ${document.getElementById('plan-notes')?.value || 'none provided'}

REQUIRED STRUCTURE (use clear markdown headings exactly like this so it renders beautifully):

# Your 2026 Power Theme
Give them one short, memorable, fun-yet-powerful theme phrase or "power word" (e.g. "The Connector Era" or "Steady Fire") inspired directly by their hobbies + personality + style. Explain in 2-3 sentences why this theme fits them perfectly and will keep them motivated.

## Executive Snapshot
Big inspiring numbers: target closings, volume, income, key ratios/leads needed. 1-2 sentences of "you've got this" realism.

## Your 2026 Focus (Tailored to ${style})
2-3 paragraphs specific to the chosen style, their challenges, personality, and how their hobbies will actually help them execute (e.g. if they love golf, how that becomes natural relationship building).

## Quarterly Milestones
4 simple, achievable quarterly targets with 2-3 concrete moves per quarter. Make them feel doable, not overwhelming.

## Weekly Rhythm & Scorecard
Realistic weekly targets for prospecting touches, partner touches, database touches, personal brand. Blend in 1-2 hobby mentions so it feels human. Include a simple "non-negotiable 3" list.

## Tactics That Actually Fit You
Bullet list of 6-8 very specific tactics. For each, tie it to their preferred activities, hobbies, or personality. Make them copy-paste ready where possible.

## Low-Anxiety Starter Kit (Do These This Week)
Exactly 3 tiny, almost-too-easy actions they can take in the next 7 days to get momentum without pressure. These should feel like "I can do that today."

## Motivation & Accountability (In Your Voice)
A short personalized pep talk + 1-2 accountability ideas written in their preferred tone. Reference one of their hobbies or family notes for warmth.

## Tool Ties — Execute This Plan Inside Your Loan Officer Coach Toolkit
For each of these, give 1 short specific recommendation that maps to another part of this exact tool:
- Social Media Strategy: 1-2 content angles or personal story ideas they can use immediately in the Personal pillar or Evergreen vault.
- Referral Partners: Name 1 specific High-Impact Play or Tier strategy they should open and use this quarter.
- Value Vault / Gifts: 1 pop-by or appreciation idea tied to their hobbies or a partner type.
- Book Vault: Recommend exactly 1 book from the list that matches a challenge or goal they have, with the one key takeaway to apply.
- Mindset Lab: 1 specific principle or reframe they should save and read on tough days.
- Prospecting Time Blocks + Weekly Win: How to turn one quarterly milestone into actual time blocks.
- Database Nurturing: 1 simple  cadence idea or touch type for their current database size.

Make the entire plan feel kind, realistic, and exciting — like a coach who gets that planning can cause anxiety but this one is built from their actual life so it will stick. Use their hobbies to make relationship building and content feel natural and fun. Be specific with numbers and examples. Output ONLY clean markdown with the exact headings above — nothing else before or after.`;

    // Note: The form also has plan-notes for extra context, hobbiesList, activitiesList already collected.

    // Centralized API call (Phase 0) - no more hardcoded key
    console.log('[weekly-win-plan] About to call Grok API...');

    const planContent = await window.callGrokAPI(prompt, {
        temperature: 0.7,
        max_tokens: 4000
    });

    console.log('[weekly-win-plan] API response received. Length:', planContent ? planContent.length : 0);

    if (!planContent) throw new Error('Empty response from API');

    // Safe parsing
    if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
        fullPlan = marked.parse(planContent);
    } else {
        console.warn('[weekly-win-plan] marked.js not available - showing raw markdown');
        fullPlan = '<pre style="white-space:pre-wrap">' + planContent.replace(/</g, '&lt;') + '</pre>';
    }

    console.log('[weekly-win-plan] Successfully parsed plan. fullPlan length:', fullPlan.length);

        if (typeof gtag === 'function') {
            gtag('event', 'generate_plan', {
                event_category: 'Tool Usage',
                event_label: 'Business Plan Generated',
                value: 1
            });
        }

    } catch (error) {
        console.error('[weekly-win-plan] generatePlan failed:', error);

        let friendlyMessage = `Error: ${error.message || error}`;

        if (error.message && error.message.includes('404')) {
            friendlyMessage = 'Proxy returned 404. Make sure the proxy is running with <code>bash start-proxy.sh</code> in your WSL terminal.';
        }

        fullPlan = `
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-300 p-6 rounded-2xl">
                <p class="text-red-600 dark:text-red-400 font-bold mb-2">API call failed</p>
                <p class="text-sm text-red-600/80">${friendlyMessage}</p>
                <p class="mt-3 text-sm">Proxy must be running on http://localhost:3000 and you need a valid xai- API key.</p>
            </div>
        `;
    } finally {
        window.hideLoading();

        const planContainer = document.getElementById(targetOutputId);

        if (planContainer) {
            // Extremely aggressive visibility forcing
            planContainer.classList.remove('hidden');
            planContainer.style.display = 'block';
            planContainer.style.visibility = 'visible';
            planContainer.style.opacity = '1';
            planContainer.style.minHeight = '200px';   // make sure it has height even if content is weird

            console.log('[weekly-win-plan] Injecting final HTML into #plan-output. fullPlan starts with:', fullPlan ? fullPlan.substring(0, 200) : 'EMPTY');

            // Safety net: if fullPlan is empty for any reason, show a clear message
            const contentToShow = (fullPlan && fullPlan.trim().length > 10) 
                ? fullPlan 
                : '<div style="padding:20px; background:#fff3cd; border:2px solid #ffc107; border-radius:12px;"><strong>Generation finished, but no content was returned.</strong><br>Check the browser console and the proxy terminal for errors.</div>';

            // === PREMIUM v2 OUTPUT WRAPPER — World class, fun, anxiety-reducing, deeply integrated ===
            const planHTML = `
              <div class="bg-white dark:bg-gray-900 border-2 border-[#F15A29]/30 rounded-3xl shadow-2xl p-8 md:p-10 mt-8">
                <!-- Hero header with results badge -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <div class="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#F15A29] text-white text-xs font-bold tracking-[2px] mb-3">
                      <i class="fas fa-check-circle"></i> YOUR 2026 ROADMAP IS READY
                    </div>
                    <h3 class="text-3xl md:text-4xl font-bold text-[#F15A29]">Your Custom 2026 Business Plan</h3>
                    <p class="text-gray-600 dark:text-gray-400 mt-1">Built from your real life, your profile, your style, and what actually works for you. No fluff. No overwhelm.</p>
                  </div>
                  <div class="flex flex-wrap gap-3">
                    <button onclick="window.copyPlanFormatted()" class="px-6 py-3 rounded-2xl bg-[#002B5C] text-white font-semibold text-sm flex items-center gap-2 hover:bg-black transition">
                      <i class="fas fa-copy"></i> <span>Copy for Word</span>
                    </button>
                    <button onclick="window.downloadPlanWord()" class="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#F15A29] to-[#F15A29]/90 text-white font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition">
                      <i class="fas fa-file-download"></i> <span>Download .doc</span>
                    </button>
                    <button onclick="window.saveFullPlanToVault()" class="px-6 py-3 rounded-2xl border-2 border-[#00A89D] text-[#00A89D] font-semibold text-sm flex items-center gap-2 hover:bg-[#00A89D] hover:text-white transition">
                      <i class="fas fa-bookmark"></i> <span>Save Plan</span>
                    </button>
                  </div>
                </div>

                <!-- The AI content (kept clean) -->
                <div id="plan-preview" class="prose prose-lg max-w-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 md:p-10 text-[15px] leading-relaxed">
                  ${contentToShow}
                </div>

                <!-- NEW: Bring It To Life — The Execution Hub (weaves every other tool in the app) -->
                <div class="mt-10 pt-8 border-t-2 border-dashed border-[#00A89D]/30">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#00A89D] to-[#F15A29] flex items-center justify-center text-white">
                      <i class="fas fa-rocket"></i>
                    </div>
                    <div>
                      <div class="font-bold text-xl text-[#002B5C] dark:text-white">Bring This Plan to Life</div>
                      <div class="text-sm text-gray-500">Your toolkit is already built for exactly this. Jump in with one click.</div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- Dynamic-ish cards based on style + profile. All open the right tool + encourage save of related ideas -->
                    <div onclick="window.showSection('weekly-win-plan');" class="group cursor-pointer bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#00A89D] rounded-3xl p-5 transition-all hover:shadow-xl">
                      <div class="flex items-start gap-3">
                        <i class="fas fa-fire text-2xl text-[#F15A29] mt-0.5"></i>
                        <div class="flex-1">
                          <div class="font-bold group-hover:text-[#00A89D]">Turn milestones into Weekly Wins</div>
                          <div class="text-xs text-gray-500 mt-1">Open Weekly Win Plan. Paste 1 quarterly target as your daily mindset block and build the exact prospecting blocks to hit it.</div>
                          <div class="mt-3 text-[11px] text-[#00A89D] font-semibold">→ Go execute this week <i class="fas fa-arrow-right ml-1"></i></div>
                        </div>
                      </div>
                    </div>

                    <div onclick="window.showSection('social');" class="group cursor-pointer bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#00A89D] rounded-3xl p-5 transition-all hover:shadow-xl">
                      <div class="flex items-start gap-3">
                        <i class="fas fa-share-alt text-2xl text-[#F15A29] mt-0.5"></i>
                        <div class="flex-1">
                          <div class="font-bold group-hover:text-[#00A89D]">Turn hobbies & personality into content</div>
                          <div class="text-xs text-gray-500 mt-1">Open Social Media Strategy. Use your Power Theme + hobbies for the Personal pillar. Save 2 angles straight into the 121+ Evergreen Vault.</div>
                          <div class="mt-3 text-[11px] text-[#00A89D] font-semibold">→ Start creating authentic posts <i class="fas fa-arrow-right ml-1"></i></div>
                        </div>
                      </div>
                    </div>

                    <div onclick="window.showSection('referrals');" class="group cursor-pointer bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#00A89D] rounded-3xl p-5 transition-all hover:shadow-xl">
                      <div class="flex items-start gap-3">
                        <i class="fas fa-handshake text-2xl text-[#F15A29] mt-0.5"></i>
                        <div class="flex-1">
                          <div class="font-bold group-hover:text-[#00A89D]">Hit your new partner goal faster</div>
                          <div class="text-xs text-gray-500 mt-1">Open Referral Partners. Use the exact Tier playbook + High-Impact Play the plan recommends for your style (First 30 Days or Weekly Value Cadence).</div>
                          <div class="mt-3 text-[11px] text-[#00A89D] font-semibold">→ Open playbooks now <i class="fas fa-arrow-right ml-1"></i></div>
                        </div>
                      </div>
                    </div>

                    <div onclick="window.showSection('value-vault');" class="group cursor-pointer bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#00A89D] rounded-3xl p-5 transition-all hover:shadow-xl">
                      <div class="flex items-start gap-3">
                        <i class="fas fa-gift text-2xl text-[#F15A29] mt-0.5"></i>
                        <div class="flex-1">
                          <div class="font-bold group-hover:text-[#00A89D]">Appreciation that actually builds loyalty</div>
                          <div class="text-xs text-gray-500 mt-1">Open Value Vault + Giftology. Turn one of your hobbies into a memorable pop-by or note for top partners. Save the idea so you never forget it.</div>
                          <div class="mt-3 text-[11px] text-[#00A89D] font-semibold">→ Find the perfect touch <i class="fas fa-arrow-right ml-1"></i></div>
                        </div>
                      </div>
                    </div>

                    <div onclick="window.showSection('books');" class="group cursor-pointer bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#00A89D] rounded-3xl p-5 transition-all hover:shadow-xl">
                      <div class="flex items-start gap-3">
                        <i class="fas fa-book text-2xl text-[#F15A29] mt-0.5"></i>
                        <div class="flex-1">
                          <div class="font-bold group-hover:text-[#00A89D]">Read the one book that moves the needle</div>
                          <div class="text-xs text-gray-500 mt-1">Open Book Vault. The plan recommends the perfect title for your specific challenge. Save the key takeaway and drop it straight into next month’s Weekly Win focus.</div>
                          <div class="mt-3 text-[11px] text-[#00A89D] font-semibold">→ Browse the vault <i class="fas fa-arrow-right ml-1"></i></div>
                        </div>
                      </div>
                    </div>

                    <div onclick="window.showSection('mindset-motivation');" class="group cursor-pointer bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#00A89D] rounded-3xl p-5 transition-all hover:shadow-xl">
                      <div class="flex items-start gap-3">
                        <i class="fas fa-brain text-2xl text-[#F15A29] mt-0.5"></i>
                        <div class="flex-1">
                          <div class="font-bold group-hover:text-[#00A89D]">Your personal mindset anchor</div>
                          <div class="text-xs text-gray-500 mt-1">Open Mindset Lab. Save the exact principle the plan suggests for your rough days. Make it your daily Random or Weekly Win mindset block.</div>
                          <div class="mt-3 text-[11px] text-[#00A89D] font-semibold">→ Get your reframe <i class="fas fa-arrow-right ml-1"></i></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-5 text-center">
                    <button onclick="window.showSection('prospecting');" class="text-sm px-5 py-2 rounded-2xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition font-semibold">
                      <i class="fas fa-clock mr-2"></i> Also: Build the exact prospecting blocks for your weekly rhythm →
                    </button>
                  </div>
                </div>

                <div class="mt-8 pt-6 border-t text-xs text-center text-gray-500">
                  This plan lives here until you generate a new one. Come back anytime. <span class="font-semibold">Pro tip for consistency:</span> Adjust any inputs or profile above, then hit Generate again to iterate instantly. Small consistent action beats perfect plans you never open.
                </div>
              </div>
            `;

            planContainer.innerHTML = planHTML;

            // Very aggressive scroll so the user actually sees the results
            setTimeout(() => {
                planContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Extra safety scroll
                window.scrollBy(0, -100);
                
                console.log('%c[weekly-win-plan] Plan output updated and scrolled into view', 'color:#00A89D');
            }, 200);
        } else {
            console.error('[weekly-win-plan] Target output element does not exist in the page!');
        }

        if (typeof confetti === 'function') confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

        // Save the generated business plan for persistence (so user can come back later)
        if (targetOutputId === 'plan-output' && planContainer && planContainer.innerHTML.trim().length > 100) {
            localStorage.setItem('savedBusinessPlan', planContainer.innerHTML);
        }
    }
}

function restoreSavedWeeklyPlan() {
    const container = document.getElementById('weekly-tasks-container');
    if (!container) return;

    if (savedWeeklyPlan && savedWeeklyPlan.days) {
        const resultsWrapper = document.getElementById('weekly-plan-results');
        if (resultsWrapper) resultsWrapper.classList.remove('hidden');

        const generateWrapper = document.getElementById('generate-plan-wrapper');
        if (generateWrapper) generateWrapper.classList.add('hidden');

        renderWeeklyTiles(savedWeeklyPlan.days, container);
        // Ensure progress UI is in sync on restore
        const checked = JSON.parse(localStorage.getItem('weeklyCheckedTasks') || '[]');
        updatePlanProgress(savedWeeklyPlan.days, checked);
    } else {
        // Show helpful empty state on first visit
        showWeeklyPlanEmptyState(container);
    }
}

function showWeeklyPlanEmptyState(container) {
    container.classList.remove('hidden');
    container.innerHTML = `
        <div class="text-center py-14 px-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl">
            <div class="max-w-sm mx-auto">
                <div class="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00A89D]/10 to-[#F15A29]/10">
                    <i class="fas fa-calendar-check text-4xl text-[#00A89D]"></i>
                </div>
                <h3 class="text-2xl font-bold text-[#002B5C] dark:text-white mb-2">Your week, your wins</h3>
                <p class="text-gray-600 dark:text-gray-400 text-[15px]">
                    One click builds a full 7-day prospecting plan tailored to your goals, available hours, and preferred activities.
                </p>
                <p class="text-xs text-gray-500 mt-5">Plan stays saved. Check tasks off as you go. Add your own anytime.</p>
            </div>
        </div>
    `;
}

// Restore saved Business Plan on load (if exists) + add Clear button
function restoreSavedBusinessPlan() {
    const saved = localStorage.getItem('savedBusinessPlan');
    const output = document.getElementById('plan-output');
    if (saved && output && output.innerHTML.trim() === '') {
        output.innerHTML = saved;
        output.classList.remove('hidden');
        output.style.display = 'block';

        // Add a small Clear button if one doesn't exist
        if (!output.querySelector('.clear-business-plan')) {
            const clearBtn = document.createElement('button');
            clearBtn.className = 'clear-business-plan ml-3 text-xs text-red-500 hover:text-red-700 underline';
            clearBtn.textContent = 'Clear saved plan';
            clearBtn.onclick = () => {
                localStorage.removeItem('savedBusinessPlan');
                output.innerHTML = '';
                output.style.display = 'none';
            };

            // Try to append it to the header area if possible
            const header = output.querySelector('div[style*="flex"]') || output.firstChild;
            if (header) header.appendChild(clearBtn);
        }
    }
}

// Call restore on init
// (will be called from initWeeklyWinPlan or main init)

// =====================================================
// WEEKLY WIN PLAN - Daily Prospecting Tiles (uses API)
// =====================================================
async function generateWeeklyPlan() {
    const btn = document.getElementById('generate-win-plan-btn');
    const container = document.getElementById('weekly-tasks-container');

    // Force immediately in case handler force missed
    const le0 = document.getElementById('global-loading');
    if (le0) {
      le0.classList.remove('hidden');
      le0.style.setProperty('display', 'flex', 'important');
      le0.style.setProperty('z-index', '99999', 'important');
      le0.style.setProperty('visibility', 'visible', 'important');
      le0.style.setProperty('opacity', '1', 'important');
    }

    const loadingEl = document.getElementById('global-loading');
    if (loadingEl) {
        loadingEl.dataset.originalContent = loadingEl.innerHTML;
    }

    const weeklyLoadingContent = `
        <div class="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
            <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-3xl border border-gray-200 dark:border-gray-700">
                
                <div class="text-center mb-8">
                    <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#F15A29] mb-5"></div>
                    <h3 class="text-3xl font-bold text-[#002B5C] dark:text-white mb-2 tracking-tight">
                        Building Your Weekly Win Plan...
                    </h3>
                    <p class="text-lg text-gray-700 dark:text-gray-300 mb-1">
                        This usually takes 30–60 seconds — grab coffee! ☕
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Creating 7 days of personalized, high-impact prospecting tasks
                    </p>
                </div>

                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                    <h4 class="text-xl font-bold text-[#F15A29] mb-5 text-center">
                        Why a Weekly Win Plan Works
                    </h4>
                    <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                        <div class="flex gap-3">
                            <i class="fas fa-calendar-check text-[#F15A29] mt-0.5"></i>
                            <div><strong>Consistency beats intensity:</strong> Small daily actions compound into massive results over time.</div>
                        </div>
                        <div class="flex gap-3">
                            <i class="fas fa-user-friends text-[#00A89D] mt-0.5"></i>
                            <div><strong>Personal + Business mix:</strong> Top producers blend value touches with genuine relationship building.</div>
                        </div>
                        <div class="flex gap-3">
                            <i class="fas fa-chart-line text-[#002B5C] mt-0.5"></i>
                            <div><strong>Personalized to you:</strong> Your plan is built around your actual schedule, goals, and strengths.</div>
                        </div>
                    </div>

                    <div class="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p class="text-xs font-semibold text-[#F15A29] mb-2">Quick Reminders:</p>
                        <ul class="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-5">
                            <li>Block time on your calendar like an appointment.</li>
                            <li>Track what actually gets done each week.</li>
                            <li>Adjust based on what’s working for your market.</li>
                        </ul>
                    </div>
                </div>

                <p class="text-center text-xs text-gray-500 dark:text-gray-400 mt-5">
                    Momentum compounds. Keep showing up.
                </p>
            </div>
        </div>
    `;

    if (loadingEl) {
        loadingEl.innerHTML = weeklyLoadingContent;
        loadingEl.classList.remove('hidden');
        loadingEl.style.display = 'flex';
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-3"></i> Building Your Weekly Win Plan...';
    }

    if (!container) {
        console.error('Weekly tasks container not found');
        const loadingEl = document.getElementById('global-loading');
        if (loadingEl && loadingEl.dataset.originalContent) {
            loadingEl.innerHTML = loadingEl.dataset.originalContent;
            delete loadingEl.dataset.originalContent;
        }
        if (loadingEl) {
            loadingEl.classList.add('hidden');
            loadingEl.style.display = 'none';
        }
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-bolt-lightning mr-2"></i> Build This Week\'s Plan';
        }
        return;
    }

    // Clear any old content from the Business Planning section so it doesn't appear mixed in
    const businessOutput = document.getElementById('plan-output');
    if (businessOutput) businessOutput.innerHTML = '';

    // Show the entire polished results wrapper
    const resultsWrapper = document.getElementById('weekly-plan-results');
    if (resultsWrapper) resultsWrapper.classList.remove('hidden');

    // Hide the generate button
    const generateWrapper = document.getElementById('generate-plan-wrapper');
    if (generateWrapper) generateWrapper.classList.add('hidden');

    // Clear previous week's checked tasks when generating a fresh plan
    localStorage.removeItem('weeklyCheckedTasks');
    container.innerHTML = '<div class="text-center p-8 text-lg text-gray-400">Generating personalized daily prospecting plan with AI...</div>';

    const prompt = `You are an expert mortgage sales coach. Create a practical, motivating 7-day prospecting plan for a loan officer.

User Profile:
- Name: ${userSetup.name}
- Monthly loan goal: ${userSetup.monthlyGoal}
- Focus area: ${userSetup.focus}
- Weekly prospecting hours available: ${userSetup.hours}
- Hobbies/Passions: ${[...(userSetup.hobbies || []), userSetup.hobbiesOther].filter(Boolean).join(', ') || 'none specified'}
- Preferred prospecting activities: ${ (userSetup.preferredActivities || []).join(', ') || 'balanced mix' }

Create exactly 7 days (Monday through Sunday). For each day give 2-4 specific, actionable prospecting or relationship tasks that fit the user's available time and preferred style. Weave in their hobbies naturally when it makes sense (e.g. golf with a realtor partner).

Return ONLY valid JSON in this exact format:
{
  "days": [
    {
      "day": "Monday",
      "tasks": [
        {"task": "Specific actionable task here", "tip": "Short practical tip"}
      ]
    }
  ]
}`;

    try {
        const response = await window.callGrokAPI(prompt, {
            temperature: 0.7,
            max_tokens: 2500
        });

        // Try to parse JSON from the response
        let data;
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            data = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response);
        } catch (e) {
            throw new Error('Could not parse AI response as JSON');
        }

        if (!data.days || !Array.isArray(data.days)) {
            throw new Error('Invalid plan structure from AI');
        }

        // Persist the plan so it survives page reloads
        savedWeeklyPlan = data;
        localStorage.setItem('savedWeeklyPlan', JSON.stringify(data));

        // Render the tiles + show polished results wrapper
        const resultsWrapper = document.getElementById('weekly-plan-results');
        if (resultsWrapper) resultsWrapper.classList.remove('hidden');

        const generateWrapper = document.getElementById('generate-plan-wrapper');
        if (generateWrapper) generateWrapper.classList.add('hidden');

        renderWeeklyTiles(data.days, container);

    } catch (error) {
        console.error('[weekly-win-plan] generateWeeklyPlan failed:', error);
        container.innerHTML = `
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-300 p-6 rounded-2xl">
                <p class="text-red-600 font-bold">Could not generate your weekly plan right now.</p>
                <p class="text-sm mt-2">Please make sure the proxy is running and try again. You can also use the Business Planning section for a full 2026 plan.</p>
            </div>
        `;
    } finally {
        const loadingEl = document.getElementById('global-loading');
        if (loadingEl && loadingEl.dataset.originalContent) {
            loadingEl.innerHTML = loadingEl.dataset.originalContent;
            delete loadingEl.dataset.originalContent;
        }
        if (loadingEl) {
            loadingEl.classList.add('hidden');
            loadingEl.style.display = 'none';
        }
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-bolt-lightning mr-2"></i> Build This Week\'s Plan';
        }
    }
}

// Restore values into the Weekly Win Plan preferences accordion
function restoreWeeklyPreferencesForm() {
    if (!userSetup) return;

    const fields = {
        'setup-name': userSetup.name || '',
        'setup-monthly-goal': userSetup.monthlyGoal || 8,
        'setup-last-month': userSetup.lastMonth || '',
        'setup-hours': userSetup.hours || '',
        'setup-focus': userSetup.focus || '',
        'setup-hobbies-other': userSetup.hobbiesOther || ''
    };

    Object.entries(fields).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    });

    // Restore hobby checkboxes
    document.querySelectorAll('#weekly-win-plan .hobby-checkbox').forEach(cb => {
        cb.checked = userSetup.hobbies && userSetup.hobbies.includes(cb.value);
    });

    // Restore activity checkboxes
    document.querySelectorAll('#weekly-win-plan .activity-checkbox').forEach(cb => {
        cb.checked = userSetup.preferredActivities && userSetup.preferredActivities.includes(cb.value);
    });
}

// Restore values for the Business Planning form (the big form with income/closings inputs)
function restoreBusinessPlanningForm() {
    const businessInputs = [
        'target-income', 'avg-commission', 'target-closings', 'avg-loan',
        'closing-ratio', 'current-partners', 'new-partners', 'database-size'
    ];

    businessInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const saved = localStorage.getItem('winPlan_' + id);
            if (saved !== null && saved !== '') {
                el.value = saved;
            }
        }
    });

    // Restore hobby checkboxes in the Business Planning form
    const savedHobbies = localStorage.getItem('winPlan_hobbies');
    if (savedHobbies) {
        try {
            const hobbies = JSON.parse(savedHobbies);
            document.querySelectorAll('.hobby-checkbox').forEach(cb => {
                if (hobbies.includes(cb.value)) cb.checked = true;
            });
        } catch (e) {}
    }

    // Restore activity checkboxes in the Business Planning form
    const savedActivities = localStorage.getItem('winPlan_activities');
    if (savedActivities) {
        try {
            const activities = JSON.parse(savedActivities);
            document.querySelectorAll('.activity-checkbox').forEach(cb => {
                if (activities.includes(cb.value)) cb.checked = true;
            });
        } catch (e) {}
    }
}

function renderWeeklyTiles(days, container) {
    // Store for later use (custom tasks, reset, copy, etc.)
    currentWeeklyDays = days;

    // Load previously checked tasks
    let checkedTasks = [];
    try {
        checkedTasks = JSON.parse(localStorage.getItem('weeklyCheckedTasks') || '[]');
    } catch (e) {}

    let html = '';

    days.forEach((day) => {
        const tasks = day.tasks || [];
        const tasksHtml = tasks.map((t) => {
            const taskKey = `${day.day}::${t.task}`;
            const isChecked = checkedTasks.includes(taskKey);
            const isCustom = t.isCustom === true;

            // Simple icon based on task content for visual pop (keeps it dead simple)
            let icon = 'fa-check-circle';
            const lower = (t.task || '').toLowerCase();
            if (lower.includes('call') || lower.includes('text') || lower.includes('dm') || lower.includes('reach out')) icon = 'fa-phone';
            else if (lower.includes('social') || lower.includes('post') || lower.includes('reel') || lower.includes('linkedin')) icon = 'fa-share-alt';
            else if (lower.includes('pop') || lower.includes('gift') || lower.includes('coffee') || lower.includes('lunch') || lower.includes('note')) icon = 'fa-gift';
            else if (lower.includes('value') || lower.includes('article') || lower.includes('checklist')) icon = 'fa-lightbulb';

            return `
                <div class="group flex items-start gap-3 p-3.5 rounded-2xl border transition-all hover:shadow-sm
                    ${isChecked ? 'bg-[#00A89D]/5 border-[#00A89D]/50' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-[#00A89D]/60'}
                    ${isCustom ? 'border-dashed border-[#F15A29]/50' : ''}">

                    <div class="mt-0.5">
                        <input type="checkbox" 
                               class="weekly-task-checkbox w-5 h-5 accent-[#00A89D] cursor-pointer"
                               data-key="${taskKey}"
                               ${isChecked ? 'checked' : ''}>
                    </div>

                    <div class="flex-1 min-w-0">
                        <div class="flex items-start gap-2">
                            <i class="fas ${icon} text-[#00A89D] mt-1 text-sm flex-shrink-0"></i>
                            <div class="font-semibold text-[15px] leading-snug tracking-[-0.1px] ${isChecked ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}">
                                ${t.task}
                                ${isCustom ? '<span class="ml-2 text-[9px] px-1.5 py-px rounded bg-[#F15A29]/10 text-[#F15A29] font-bold tracking-wider">CUSTOM</span>' : ''}
                            </div>
                        </div>

                        ${t.tip ? `
                            <div class="mt-2 ml-6 text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 text-gray-600 dark:text-gray-400">
                                <span class="font-semibold text-[#00A89D] mr-1">💡</span> ${t.tip}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        const taskCount = tasks.length;
        html += `
            <div class="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col hover:border-[#00A89D]/40 transition-all">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <div class="font-extrabold text-2xl text-[#F15A29] tracking-tighter">${day.day}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">${taskCount} task${taskCount !== 1 ? 's' : ''}</div>
                    </div>
                    <div class="text-xs px-2.5 py-1 rounded-full bg-[#F15A29]/10 text-[#F15A29] font-bold">FOCUS DAY</div>
                </div>

                <div class="space-y-2 flex-1 mb-3">
                    ${tasksHtml || '<div class="text-sm text-gray-500 dark:text-gray-400 italic py-2">Light day — protect energy and focus on relationships.</div>'}
                </div>

                <button onclick="addCustomTaskToDay('${day.day}', this)" 
                        class="mt-auto text-xs flex items-center justify-center gap-2 text-[#00A89D] hover:text-white hover:bg-[#00A89D] font-semibold py-2.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:border-[#00A89D] transition-all">
                    <i class="fas fa-plus text-xs"></i>
                    <span class="font-medium">Add your own task</span>
                </button>
            </div>
        `;
    });

    container.innerHTML = html;

    // Update the static progress UI
    updatePlanProgress(days, checkedTasks);

    // Attach checkbox handlers (re-render on change for visual update)
    container.querySelectorAll('.weekly-task-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            const key = cb.dataset.key;
            let current = [];
            try { current = JSON.parse(localStorage.getItem('weeklyCheckedTasks') || '[]'); } catch (e) {}

            if (cb.checked) {
                if (!current.includes(key)) current.push(key);
            } else {
                current = current.filter(k => k !== key);
            }
            localStorage.setItem('weeklyCheckedTasks', JSON.stringify(current));

            renderWeeklyTiles(days, container);
        });
    });
}

// =====================================================
// WEEKLY PLAN ACTIONS
// =====================================================

function resetWeeklyProgress() {
    if (!confirm('Reset all task progress for this week?')) return;

    localStorage.removeItem('weeklyCheckedTasks');
    if (currentWeeklyDays) {
        const container = document.getElementById('weekly-tasks-container');
        if (container) renderWeeklyTiles(currentWeeklyDays, container);
    }
}

function clearWeeklyPlan() {
    if (!confirm('Delete the entire generated weekly plan? This cannot be undone.')) return;

    localStorage.removeItem('savedWeeklyPlan');
    localStorage.removeItem('weeklyCheckedTasks');
    currentWeeklyDays = null;

    const resultsWrapper = document.getElementById('weekly-plan-results');
    if (resultsWrapper) resultsWrapper.classList.add('hidden');

    // Show generate button again
    const generateWrapper = document.getElementById('generate-plan-wrapper');
    if (generateWrapper) generateWrapper.classList.remove('hidden');
}

// Updates the progress numbers, bar, and message in the new polished layout
function updatePlanProgress(days, checkedTasks = []) {
    const total = days.reduce((sum, d) => sum + (d.tasks ? d.tasks.length : 0), 0);
    const completed = checkedTasks.length || 0;

    const completedEl = document.getElementById('tasks-completed');
    const totalEl = document.getElementById('tasks-total');
    const bar = document.getElementById('weekly-progress-bar');
    const msg = document.getElementById('completion-message');

    if (completedEl) completedEl.textContent = completed;
    if (totalEl) totalEl.textContent = total;

    if (bar) {
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        bar.style.width = pct + '%';
    }

    if (msg) {
        if (completed === 0) {
            msg.textContent = 'Let\'s get some wins on the board this week.';
        } else if (completed === total) {
            msg.textContent = 'Week crushed. Momentum is real.';
        } else {
            msg.textContent = 'Momentum compounds. Keep showing up.';
        }
    }
}

function copyWeeklyPlan() {
    if (!currentWeeklyDays || !currentWeeklyDays.length) {
        alert('No weekly plan to copy yet.');
        return;
    }

    let text = `My Weekly Win Plan\n\n`;

    currentWeeklyDays.forEach(day => {
        text += `${day.day}\n`;
        (day.tasks || []).forEach(t => {
            text += `• ${t.task}`;
            if (t.tip) text += ` — ${t.tip}`;
            text += `\n`;
        });
        text += `\n`;
    });

    navigator.clipboard.writeText(text.trim()).then(() => {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#002B5C] text-white px-6 py-3 rounded-2xl shadow-xl text-sm z-[999]';
        toast.textContent = 'Weekly plan copied to clipboard!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2200);
    }).catch(() => {
        prompt('Copy this weekly plan:', text.trim());
    });
}

function addCustomTaskToDay(dayName, buttonElement) {
    if (!currentWeeklyDays) return;

    const dayObj = currentWeeklyDays.find(d => d.day === dayName);
    if (!dayObj) return;

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'mt-3 flex gap-2';
    inputWrapper.innerHTML = `
        <input type="text" placeholder="Your custom task..." 
               class="flex-1 px-3 py-2 text-sm rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900">
        <button class="px-4 py-2 text-sm rounded-2xl bg-[#00A89D] text-white font-medium">Add</button>
        <button class="px-3 py-2 text-sm rounded-2xl border border-gray-300">Cancel</button>
    `;

    const input = inputWrapper.querySelector('input');
    const addBtn = inputWrapper.querySelector('button');
    const cancelBtn = inputWrapper.querySelectorAll('button')[1];

    buttonElement.style.display = 'none';
    buttonElement.parentNode.appendChild(inputWrapper);

    const cleanup = () => {
        inputWrapper.remove();
        buttonElement.style.display = '';
    };

    cancelBtn.onclick = cleanup;

    const doAdd = () => {
        const value = input.value.trim();
        if (!value) {
            cleanup();
            return;
        }

        if (!dayObj.tasks) dayObj.tasks = [];

        dayObj.tasks.push({
            task: value,
            tip: 'You added this task',
            isCustom: true
        });

        savedWeeklyPlan = { days: currentWeeklyDays };
        localStorage.setItem('savedWeeklyPlan', JSON.stringify(savedWeeklyPlan));

        const container = document.getElementById('weekly-tasks-container');
        if (container) renderWeeklyTiles(currentWeeklyDays, container);
    };

    addBtn.onclick = doAdd;
    input.onkeydown = (e) => {
        if (e.key === 'Enter') doAdd();
        if (e.key === 'Escape') cleanup();
    };

    input.focus();
}



// Copy & Download (rich formatting + Word)
function copyPlanFormatted() {
    const preview = document.getElementById('plan-preview');
    if (!preview) return;

    const range = document.createRange();
    range.selectNode(preview);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);

    try {
        document.execCommand('copy');
        alert('Formatted plan copied! Paste into Word.');
    } catch (err) {
        alert('Copy failed — select text manually.');
    }

    window.getSelection().removeAllRanges();
}

function downloadPlanWord() {
    const preview = document.getElementById('plan-preview');
    if (!preview) return;

    const header = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>2026 Business Plan</title><style>body{font-family:Calibri,Arial,sans-serif;margin:40px;line-height:1.6;color:#000;}' +
                   'h1{color:#002B5C;text-align:center;}h2{color:#00A89D;border-bottom:2px solid #00A89D;padding-bottom:8px;}' +
                   'ul{padding-left:30px;}li{margin:12px 0;}</style></head><bo' + 'dy>';  // Split here to prevent any parsing issues
    const content = preview.innerHTML;
    const footer = '</bo' + 'dy></ht' + 'ml>';  // Split the problematic line
    const blob = new Blob([header + content + footer], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2026_Business_Plan.doc';
    a.click();
    URL.revokeObjectURL(url);
}

// Setup & Persistence
let userSetup = JSON.parse(localStorage.getItem('winPlanSetup')) || {
    name: "Loan Officer",
    monthlyGoal: 8,
    focus: "Balanced",
    lastMonth: 0,
    partners: 0,
    pastClients: 0,
    hours: "15–20",
    hobbies: [],
    hobbiesOther: "",
    preferredActivities: []
};

window.userSetup = userSetup; // Expose for other tools (Prospecting Time Blocks, etc.)
let streak = parseInt(localStorage.getItem('winPlanStreak')) || 0;

// === PERSISTENCE FOR GENERATED PLAN ===
let savedWeeklyPlan = JSON.parse(localStorage.getItem('savedWeeklyPlan')) || null;
let savedWeeklyChecked = JSON.parse(localStorage.getItem('savedWeeklyChecked') || '[]');

// Current in-memory weekly plan days (used for adding custom tasks + re-rendering)
let currentWeeklyDays = null;

function updateSetupDisplays() {
    const effective = getEffectiveSetup();
    const name = (effective.name || '').trim() || "Loan Officer";

    const titleEl = document.getElementById('personalized-title');
    if (titleEl) titleEl.textContent = `${name}'s Weekly Win Plan`;

    const goalEl = document.getElementById('monthly-goal-display');
    if (goalEl) goalEl.textContent = effective.monthlyUnits || 8;

    const touchesNeeded = (effective.monthlyUnits || 8) * 9;
    const targetEl = document.getElementById('weekly-target');
    if (targetEl) targetEl.textContent = `For ${effective.monthlyUnits || 8} loans: Aim for ~${touchesNeeded} touches this week`;

    const streakEl = document.getElementById('streak-display');
    if (streakEl) streakEl.textContent = `${streak} Week Streak`;

    const messageEl = document.getElementById('streak-message');
    if (messageEl) {
        messageEl.textContent = streak > 0 
            ? `${name}, keep the momentum going` 
            : `Let's build your streak this week`;
    }
}

updateSetupDisplays();
renderWeeklyProfileSummary();

// Expand the inline preferences accordion (new UX)
function expandPreferencesAccordion() {
    const accordion = document.querySelector('#weekly-win-plan .accordion');
    if (!accordion) return;

    const headerBtn = accordion.querySelector('button[onclick*="toggleAccordion"]');
    const content = accordion.querySelector('.accordion-content');

    if (headerBtn) {
        // Trigger the existing toggle
        headerBtn.click();
    } else if (content) {
        content.classList.add('open');
    }

    // Scroll into view
    setTimeout(() => {
        accordion.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 180);
}

// Legacy stubs (kept so nothing breaks if old calls exist)
function openSetupWizard() { expandPreferencesAccordion(); }
function closeSetupWizard() {}
function saveSetup() {}

// Live sync from the inline preferences accordion back to userSetup + top summary
function syncWeeklyPreferencesToUserSetup() {
    const nameEl = document.getElementById('setup-name');
    const goalEl = document.getElementById('setup-monthly-goal');
    const hoursEl = document.getElementById('setup-hours');
    const focusEl = document.getElementById('setup-focus');
    const lastMonthEl = document.getElementById('setup-last-month');
    const hobbiesOtherEl = document.getElementById('setup-hobbies-other');

    if (nameEl) userSetup.name = nameEl.value.trim() || "Loan Officer";
    if (goalEl) userSetup.monthlyGoal = parseInt(goalEl.value) || 8;
    if (hoursEl) userSetup.hours = hoursEl.value;
    if (focusEl) userSetup.focus = focusEl.value;
    if (lastMonthEl) userSetup.lastMonth = parseInt(lastMonthEl.value) || 0;
    if (hobbiesOtherEl) userSetup.hobbiesOther = hobbiesOtherEl.value.trim();

    // Hobbies & activities (scoped to weekly win plan section)
    userSetup.hobbies = Array.from(
        document.querySelectorAll('#weekly-win-plan .hobby-checkbox:checked')
    ).map(cb => cb.value);

    userSetup.preferredActivities = Array.from(
        document.querySelectorAll('#weekly-win-plan .activity-checkbox:checked')
    ).map(cb => cb.value);

    localStorage.setItem('winPlanSetup', JSON.stringify(userSetup));
    updateSetupDisplays();
}

// Task Help (placeholder)
function showTaskHelp(task) {
    console.log('Help requested for task:', task);
}

// === STEP 2: AUTO-SAVE ON EVERY CHANGE ===
(function autoSaveSetup() {
    // Helper to save a single field
    function saveField(id) {
        const el = document.getElementById(id);
        if (el) {
            localStorage.setItem('winPlan_' + id, el.value || '');
        }
    }

    // Text/Number/Select fields — save on 'change' (when user finishes editing)
    const singleFields = [
        'setup-name',
        'setup-monthly-goal',
        'setup-last-month',
        'setup-partners',
        'setup-past-clients',
        'setup-hours',
        'setup-focus',
        'setup-hobbies-other'
    ];

    singleFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => saveField(id));
            // Optional: Also save live while typing for text fields
            if (el.type === 'text') {
                el.addEventListener('input', () => saveField(id));
            }
        }
    });

    // Hobby Checkboxes — save entire array on any change
    document.querySelectorAll('.hobby-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            const checked = Array.from(document.querySelectorAll('.hobby-checkbox:checked'))
                                 .map(c => c.value);
            localStorage.setItem('winPlan_hobbies', JSON.stringify(checked));
        });
    });

    // Preferred Activity Checkboxes — save entire array on any change
    document.querySelectorAll('.activity-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            const checked = Array.from(document.querySelectorAll('.activity-checkbox:checked'))
                                 .map(c => c.value);
            localStorage.setItem('winPlan_activities', JSON.stringify(checked));
        });
    });

    // === Auto-save for main Business Plan input fields (target income, closings, etc.) ===
    const planInputIds = ['target-income', 'avg-commission', 'target-closings', 'avg-loan', 'closing-ratio', 'current-partners', 'new-partners', 'database-size'];
    planInputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // Restore saved value on load
            const saved = localStorage.getItem('winPlan_' + id);
            if (saved !== null) el.value = saved;

            el.addEventListener('input', () => {
                localStorage.setItem('winPlan_' + id, el.value || '');
            });
            el.addEventListener('change', () => {
                localStorage.setItem('winPlan_' + id, el.value || '');
            });
        }
    });

    console.log('🔄 Weekly Win Plan auto-save enabled — changes save instantly');
})();

// =====================================================
// PUBLIC API EXPOSURE
// =====================================================
window.generatePlan = generatePlan;

window.syncPlanningFormFromProfile = function() {
  const p = (typeof window.getUserProfile === 'function') ? window.getUserProfile() : {};
  const eff = (typeof window.getEffectiveSetup === 'function') ? window.getEffectiveSetup() : {};

  const setVal = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };

  // Pull sensible annual numbers from monthly profile data
  const monthlyUnits = parseInt(p.monthlyUnits || eff.monthlyUnits || 8, 10);
  if (monthlyUnits) {
    setVal('target-closings', String(monthlyUnits * 12));
  }
  if (p.monthlyGoal || eff.monthlyVolume) {
    setVal('target-income', p.monthlyGoal || eff.monthlyVolume);
  }
  if (p.hours) setVal('weekly-hours-hint', p.hours); // not a real field but we can surface in insight

  // Set a balanced style by default if nothing chosen
  const checked = document.querySelector('input[name="plan-style"]:checked');
  if (!checked) {
    const bal = Array.from(document.querySelectorAll('input[name="plan-style"]')).find(r => r.value === 'Balanced Growth');
    if (bal) bal.checked = true;
  }

  // === Pull hobbies & activities from central profile into the planning form checkboxes ===
  // This ensures the page always reflects the user's selected profile info consistently.
  const profileHobbies = p.hobbies || [];
  document.querySelectorAll('.hobby-checkbox').forEach(cb => {
    cb.checked = profileHobbies.includes(cb.value);
  });
  if (p.hobbiesOther) {
    setVal('hobby-other', p.hobbiesOther);
  }

  const profileActivities = p.activities || [];
  document.querySelectorAll('.activity-checkbox').forEach(cb => {
    cb.checked = profileActivities.includes(cb.value);
  });

  // Optionally pre-fill notes with key profile challenges/personality if empty (valuable context without overwriting user input)
  const notesEl = document.getElementById('plan-notes');
  if (notesEl && !notesEl.value.trim()) {
    const challenges = (p.challenges || []).join(', ');
    const personality = p.personality || '';
    const family = p.family || '';
    let autoNote = '';
    if (challenges) autoNote += `Key challenges: ${challenges}. `;
    if (personality) autoNote += `Personality/voice: ${personality}. `;
    if (family) autoNote += `Family/life notes: ${family}. `;
    if (autoNote) notesEl.value = autoNote.trim();
  }

  updatePlanLiveInsight();
  if (typeof window.updatePlanCompleteness === 'function') window.updatePlanCompleteness();
  if (typeof window.updateHobbyTactics === 'function') window.updateHobbyTactics();
  if (typeof window.renderExtendedProfileInfo === 'function') window.renderExtendedProfileInfo();

  if (typeof window.showToast === 'function') {
    window.showToast('Synced your full profile (goals, hobbies, activities, challenges) into the plan form');
  }

  // Populate extended relevant profile info visibly on the planning page (so user sees all valuable profile data is being used)
  renderExtendedProfileInfo();
};

function renderExtendedProfileInfo() {
  const container = document.getElementById('plan-extended-profile');
  if (!container) return;

  const p = (typeof window.getUserProfile === 'function') ? window.getUserProfile() : {};
  const eff = (typeof window.getEffectiveSetup === 'function') ? window.getEffectiveSetup() : {};

  const parts = [];

  const challenges = (p.challenges || []).join(', ') || (eff.challenges || []).join(', ');
  if (challenges) parts.push(`<div><span class="font-semibold text-[#002B5C] dark:text-white">Challenges:</span> ${challenges}</div>`);

  const personality = p.personality || eff.personality || '';
  const tone = p.tone || eff.tone || '';
  if (personality || tone) parts.push(`<div><span class="font-semibold text-[#002B5C] dark:text-white">Personality/Tone:</span> ${[personality, tone].filter(Boolean).join(' • ')}</div>`);

  const partnerTypes = (p.partnerTypes || []).join(', ') || (eff.partnerTypes || []).join(', ');
  if (partnerTypes) parts.push(`<div><span class="font-semibold text-[#002B5C] dark:text-white">Focus Partners:</span> ${partnerTypes}</div>`);

  const family = p.family || '';
  if (family) parts.push(`<div><span class="font-semibold text-[#002B5C] dark:text-white">Life/Family:</span> ${family}</div>`);

  const voice = (p.voiceTraits || []).join(', ');
  if (voice) parts.push(`<div><span class="font-semibold text-[#002B5C] dark:text-white">Voice:</span> ${voice}</div>`);

  container.innerHTML = parts.length ? parts.join('') : '<div class="text-gray-400">Complete your profile for even richer personalization (challenges, voice, partners, etc. all feed the plan).</div>';
}

window.renderExtendedProfileInfo = renderExtendedProfileInfo;window.copyPlanFormatted = copyPlanFormatted;
function updatePlanLiveInsight() { /* stub for v2 form live update */ }
function wirePlanLiveCalculations() { /* stub */ }
function wirePlanStyleCards() { /* stub */ }
function updatePlanCompleteness() { /* stub */ }
function updateHobbyTactics() { /* stub; calls render if available */ if (typeof window.renderExtendedProfileInfo === "function") window.renderExtendedProfileInfo(); }
function refreshPlanProfileHeader() { /* stub */ }

window.downloadPlanWord = downloadPlanWord;
window.openSetupWizard = openSetupWizard;
window.closeSetupWizard = closeSetupWizard;
window.saveSetup = saveSetup;
window.updateSetupDisplays = updateSetupDisplays;
window.resetWeeklyProgress = resetWeeklyProgress;
window.copyWeeklyPlan = copyWeeklyPlan;
window.clearWeeklyPlan = clearWeeklyPlan;
window.addCustomTaskToDay = addCustomTaskToDay;

// =====================================================
function wireGeneratePlanButton() {
  const handler = (ev) => {
    try {
      console.log('%c[weekly-win-plan] Business Planning "Build My 2026 Plan — Make It Real & Fun" button clicked', 'color:lime');
      if (ev && ev.preventDefault) ev.preventDefault();

      const le = document.getElementById('global-loading');
      if (le) {
        le.classList.remove('hidden');
        le.style.setProperty('display', 'flex', 'important');
        le.style.setProperty('z-index', '99999', 'important');
        le.style.setProperty('visibility', 'visible', 'important');
        le.style.setProperty('opacity', '1', 'important');
        le.style.setProperty('position', 'fixed', 'important');
        le.style.setProperty('inset', '0', 'important');
      }

      if (typeof generatePlan === 'function') {
        generatePlan('plan-output');
      } else if (typeof window.generatePlan === 'function') {
        window.generatePlan('plan-output');
      } else {
        console.warn('[weekly-win-plan] generatePlan not found');
        if (le) {
          const title = document.getElementById('global-loading-title');
          if (title) title.textContent = 'Starting plan generation...';
        }
      }
    } catch (err) {
      console.error('[weekly-win-plan] handler error:', err);
      const le = document.getElementById('global-loading');
      if (le) {
        le.classList.remove('hidden');
        le.style.setProperty('display', 'flex', 'important');
        le.style.setProperty('z-index', '99999', 'important');
      }
    }
  };

  const btn = document.getElementById('generate-plan-btn');
  if (btn && !btn._gpwWired) {
    btn._gpwWired = true;
    // only addEventListener, no onclick override to prevent conflicts
    btn.addEventListener('click', handler);
  }

  const container = document.getElementById('planning') || document.body;
  if (container && !container._gpwWired) {
    container._gpwWired = true;
    container.addEventListener('click', (e) => {
      if (e.target.closest && e.target.closest('#generate-plan-btn')) {
        handler(e);
      }
    });
  }
}

window.wireGeneratePlanButton = wireGeneratePlanButton;
// INITIALIZATION - Button Wiring
// =====================================================
function initWeeklyWinPlan() {
    console.log('%c[weekly-win-plan.js] initWeeklyWinPlan running - attaching listeners', 'color:#00A89D');

    // Edit Preferences button (now expands the inline accordion)
    const editPrefsBtn = document.getElementById('edit-preferences-btn');
    if (editPrefsBtn) {
        editPrefsBtn.addEventListener('click', expandPreferencesAccordion);
    }

    // Wire the big generate plan button with delegation + direct (bulletproof against any replaces)
    if (typeof wireGeneratePlanButton === 'function') {
      wireGeneratePlanButton();
    } else if (document.getElementById('generate-plan-btn')) {
      document.getElementById('generate-plan-btn').onclick = () => (window.generatePlan || generatePlan)('plan-output');
    }

    // Weekly Win Plan button (the one inside the Weekly Win Plan tool)
    const weeklyWinBtn = document.getElementById('generate-win-plan-btn');
    if (weeklyWinBtn && !weeklyWinBtn._wwpWired) {
        weeklyWinBtn._wwpWired = true;
        // Use addEventListener only, no override to avoid conflicts
        weeklyWinBtn.addEventListener('click', () => {
            console.log('%c[weekly-win-plan] Weekly Win Plan "Build This Week\'s Plan" button clicked', 'color: lime');
            // Force the loading modal immediately for progress while waiting
            const le = document.getElementById('global-loading');
            if (le) {
              le.classList.remove('hidden');
              le.style.setProperty('display', 'flex', 'important');
              le.style.setProperty('z-index', '99999', 'important');
              le.style.setProperty('visibility', 'visible', 'important');
              le.style.setProperty('opacity', '1', 'important');
            }
            generateWeeklyPlan();
        });
    }

    // Auto-restore previously generated weekly plan (persistence)
    restoreSavedWeeklyPlan();

    window.generateWeeklyPlan = generateWeeklyPlan;

    console.log('%c[weekly-win-plan.js] Weekly Win Plan / Business Planning initialized', 'color:#00A89D');

    // Restore values into the new inline preferences accordion
    restoreWeeklyPreferencesForm();

    // Live sync: any change in the Weekly Win Plan preferences updates the top summary immediately
    const weeklyPrefsSection = document.getElementById('weekly-win-plan');
    if (weeklyPrefsSection) {
        // Core fields that affect the top bar
        const syncFields = ['setup-name', 'setup-monthly-goal', 'setup-hours', 'setup-focus', 'setup-last-month', 'setup-hobbies-other'];

        syncFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', syncWeeklyPreferencesToUserSetup);
                el.addEventListener('change', syncWeeklyPreferencesToUserSetup);
            }
        });

        // Hobby & activity checkboxes also need to trigger sync
        weeklyPrefsSection.querySelectorAll('.hobby-checkbox, .activity-checkbox').forEach(cb => {
            cb.addEventListener('change', syncWeeklyPreferencesToUserSetup);
        });
    }

    // Restore Business Planning form fields (separate from wizard)
    restoreBusinessPlanningForm();

    // Auto-save listeners for the business plan form (selections persist)
    const planInputIds = ['target-income', 'avg-commission', 'target-closings', 'avg-loan', 'closing-ratio', 'current-partners', 'new-partners', 'database-size'];
    planInputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => { localStorage.setItem('winPlan_' + id, el.value || ''); });
            el.addEventListener('change', () => { localStorage.setItem('winPlan_' + id, el.value || ''); });
        }
    });
    document.querySelectorAll('.hobby-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            const checked = Array.from(document.querySelectorAll('.hobby-checkbox:checked')).map(c => c.value);
            localStorage.setItem('winPlan_hobbies', JSON.stringify(checked));
        });
    });
    document.querySelectorAll('.activity-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            const checked = Array.from(document.querySelectorAll('.activity-checkbox:checked')).map(c => c.value);
            localStorage.setItem('winPlan_activities', JSON.stringify(checked));
        });
    });

    // Restore any previously generated Business Plan + add clear button
    restoreSavedBusinessPlan();

    // One-time patch for any in-memory or previously rendered plan hub with stale links (helps if user has a plan from before ID fixes)
    setTimeout(() => {
      const out = document.getElementById('plan-output');
      if (out) {
        out.querySelectorAll('[onclick*="social-media-strategy"], [onclick*="referral-partners"]').forEach(el => {
          let oc = el.getAttribute('onclick') || '';
          oc = oc.replace(/social-media-strategy/g, 'social');
          oc = oc.replace(/referral-partners/g, 'referrals');
          if (oc.includes("showSection('social')") && !oc.includes('window.showSection')) {
            oc = oc.replace(/showSection\('social'\)/g, "window.showSection('social')");
          }
          if (oc.includes("showSection('referrals')") && !oc.includes('window.showSection')) {
            oc = oc.replace(/showSection\('referrals'\)/g, "window.showSection('referrals')");
          }
          el.setAttribute('onclick', oc);
        });
      }
    }, 100);

    // Show extended profile info on the business plan page
    if (typeof renderExtendedProfileInfo === 'function') renderExtendedProfileInfo();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWeeklyWinPlan);
} else {
    initWeeklyWinPlan();
}

})();   // ← This is the ONLY closing for the main outer IIFE
