/**
 * js/features/weekly-win-plan.js
 *
 * Weekly Win Plan / Business Planning & Setup
 * Extracted from monolithic index.html (Phase 1)
 *
 * Includes:
 * - generatePlan (AI-powered custom 2026 plan + snapshot)
 * - copyPlanFormatted / downloadPlanWord (now PDF via html2pdf for direct-to-Downloads auto save, no location prompt)
 * - clearBusinessPlan + improved restoreSavedBusinessPlan (plan content persists in localStorage + rehydrates on section visit until explicit clear or new generate)
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
  // CRITICAL SEPARATION NOTE (DO NOT REMOVE OR MIX)
  // =====================================================
  // 2026 Business Plan (generatePlan + #planning + #generate-plan-btn + plan-output + businessTips + enrichPlanLoading + #plan-enrich-panel + profile sync via syncPlanningFormFromProfile/restoreBusinessPlanningForm + winPlan_* localStorage + .hobby-checkbox etc.)
  //   vs
  // Weekly Win Plan (generateWeeklyPlan + #weekly-win-plan + #generate-win-plan-btn + weekly-tasks-container + weekly-plan-results + its own custom loading backup/replace + savedWeeklyPlan + userSetup prefs)
  //
  // These are INTENTIONALLY CO-LOCATED in one file for legacy reasons but MUST remain 100% separate in:
  // functions, API prompts/calls, button IDs, output targets, loading strategies (overlay + enrich vs full innerHTML replace), persistence keys, wiring, and side effects.
  // verify BOTH buttons + BOTH progress UIs + 2026 profile defaults + weekly prefs INDEPENDENTLY after ANY edit.
  // Never reuse IDs, containers, or call one generate from the other path.
  // See also the matching separation comments in js/main.js showSection for 'planning' vs 'weekly-win-plan'.
  // If you are touching one, explicitly test the other button and confirm the correct progress experience appears (rich overlay, NOT a "generating..." text note in the results area).

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

    // ABSOLUTE FIRST ACTION: force the progress modal visible with the rich overlay (enrich panel + cycling tips).
    // This must happen before ANY DOM writes to output areas so the user NEVER sees a "generating" note in the page.
    if (typeof window.forceShowGlobalLoading === 'function') {
      window.forceShowGlobalLoading('Crafting Your 2026 Business Plan...');
    }

    // Extra legacy defensive forces (kept for belt-and-suspenders; the helper above is the primary)
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

    // force again after showLoading (which internally forces)
    const le1 = document.getElementById('global-loading');
    if (le1) {
      le1.classList.remove('hidden');
      le1.style.setProperty('display', 'flex', 'important');
      le1.style.setProperty('z-index', '99999', 'important');
      le1.style.setProperty('visibility', 'visible', 'important');
      le1.style.setProperty('opacity', '1', 'important');
    }

    // Clear the output container immediately (under the cover of the now-visible modal) so no old content or notes flash.
    const targetOutClear = document.getElementById(targetOutputId);
    if (targetOutClear) {
      targetOutClear.innerHTML = '';
      targetOutClear.classList.add('hidden');
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
          const disp = loadingEl.style.getPropertyValue('display') || loadingEl.style.display;
          if (pct > 95 || !loadingEl || disp === 'none' || loadingEl.classList.contains('hidden')) {
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

    // NOTE: We deliberately do NOT touch the output container here. The rich #global-loading overlay (with enrich panel, live profile snapshot, animated progress, and cycling tips) is the ONLY thing the user should see while the API works.
    // Final rich plan HTML is injected only in the finally{} after hideLoading().

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
For each of these, give 1 short specific recommendation that maps to another part of this exact tool (use real feature names like "Personal pillar", "Evergreen vault", "A+ tier", "Value Vault save button", "Weekly Win Plan time blocks"):
- Social Media Strategy: 1-2 content angles or personal story ideas they can use immediately in the Personal pillar or Evergreen vault (tell them exactly which pillar).
- Referral Partners: Name 1 specific High-Impact Play or Tier strategy they should open and use this quarter (e.g. "open Referral Partners tool and run the 'Coffee + Value Drop' play with your top A+ realtor").
- Value Vault / Gifts: 1 pop-by or appreciation idea tied to their hobbies or a partner type (suggest saving it directly in the Value Vault).
- Book Vault: Recommend exactly 1 book from the list that matches a challenge or goal they have, with the one key takeaway to apply (and how it ties to a hobby).
- Mindset Lab: 1 specific principle or reframe they should save and read on tough days.
- Prospecting Time Blocks + Weekly Win: How to turn one quarterly milestone into actual time blocks (reference blocking in Weekly Win Plan).
- Database Nurturing: 1 simple cadence idea or touch type for their current database size.

## Obstacles & Simple Workarounds
Based on their listed challenges + personality, list 2-3 likely roadblocks they might hit (e.g. "time crunch from family") and give one tiny, realistic workaround for each that uses a hobby or preferred activity.

## Your First 30 Days (Momentum Builder)
A short prioritized 30-day calendar of the absolute easiest wins pulled from the Low-Anxiety Starter Kit + Tactics. 1-2 actions per week, super specific, low pressure, with "do this on [day]" suggestions.

Make the entire plan feel kind, realistic, and exciting — like a coach who gets that planning can cause anxiety but this one is built from their actual life so it will stick. Use their hobbies to make relationship building and content feel natural and fun. Be extremely specific with numbers, real examples using their exact hobbies/personality, and copy-paste ready language the user can act on today. Never generic. Output ONLY clean markdown with the exact headings above — nothing else before or after.`;

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
                    <button onclick="if(window.clearBusinessPlan){window.clearBusinessPlan();}" class="px-6 py-3 rounded-2xl border border-red-300 text-red-500 font-semibold text-sm flex items-center gap-2 hover:bg-red-50 hover:text-red-600 transition">
                      <i class="fas fa-trash"></i> <span>Clear</span>
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

// Restore saved Business Plan on load (if exists) + ensure Clear button for legacy saves
function restoreSavedBusinessPlan() {
    const saved = localStorage.getItem('savedBusinessPlan');
    const output = document.getElementById('plan-output');
    if (saved && output && output.innerHTML.trim() === '') {
        output.innerHTML = saved;
        output.classList.remove('hidden');
        output.style.display = 'block';

        // For legacy saved plans (that predate the built-in Clear button in the template),
        // ensure a visible Clear control exists at the top.
        if (!output.querySelector('button[onclick*="clearBusinessPlan"]') && !output.querySelector('.clear-business-plan')) {
            const clearBar = document.createElement('div');
            clearBar.className = 'text-right -mt-2 mb-3';
            const clearBtn = document.createElement('button');
            clearBtn.className = 'clear-business-plan text-xs px-3 py-1 rounded-xl border border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600 transition';
            clearBtn.textContent = 'Clear this saved plan';
            clearBtn.onclick = () => {
                if (window.clearBusinessPlan) {
                    window.clearBusinessPlan();
                } else {
                    localStorage.removeItem('savedBusinessPlan');
                    output.innerHTML = '';
                    output.style.display = 'none';
                }
            };
            clearBar.appendChild(clearBtn);
            // Insert near top so it's obvious
            if (output.firstChild) {
                output.insertBefore(clearBar, output.firstChild);
            } else {
                output.appendChild(clearBar);
            }
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

    // 2026 Business Plan and Weekly Win Plan are completely separate — this function is WEEKLY ONLY.
    // ABSOLUTE FIRST ACTION: force the custom progress "modal" (we replace #global-loading inner content for Weekly).
    if (typeof window.forceShowGlobalLoading === 'function') {
      window.forceShowGlobalLoading('Building Your Weekly Win Plan...');
    }

    // Force immediately in case handler force missed (belt and suspenders)
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
        // Re-force after replacing innerHTML (the custom weekly content does not have the original title/message children)
        loadingEl.classList.remove('hidden');
        loadingEl.style.setProperty('display', 'flex', 'important');
        loadingEl.style.setProperty('z-index', '99999', 'important');
        loadingEl.style.setProperty('visibility', 'visible', 'important');
        loadingEl.style.setProperty('opacity', '1', 'important');
        loadingEl.style.setProperty('position', 'fixed', 'important');
        loadingEl.style.setProperty('inset', '0', 'important');
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
        if (typeof window.hideLoading === 'function') {
            window.hideLoading();
        } else if (loadingEl) {
            loadingEl.classList.add('hidden');
            loadingEl.style.setProperty('display', 'none', 'important');
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

    // Clear previous week's checked tasks when generating a fresh plan.
    // IMPORTANT: Do NOT put any "Generating..." placeholder text into the container. The custom rich content we injected into #global-loading (the full "Building Your Weekly Win Plan..." card with Why it Works + Reminders) is the progress UI the user sees.
    // The tasks grid will be populated only after the API succeeds (in renderWeeklyTiles).
    localStorage.removeItem('weeklyCheckedTasks');
    if (container) container.innerHTML = '';   // keep it clean while the overlay is up

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
        // Restore the original #global-loading markup (the standard spinner + title + message) then hide via the shared helper
        const loadingEl = document.getElementById('global-loading');
        if (loadingEl && loadingEl.dataset.originalContent) {
            loadingEl.innerHTML = loadingEl.dataset.originalContent;
            delete loadingEl.dataset.originalContent;
        }
        if (typeof window.hideLoading === 'function') {
            window.hideLoading();
        } else if (loadingEl) {
            loadingEl.classList.add('hidden');
            loadingEl.style.setProperty('display', 'none', 'important');
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

    // Build clean, Word-friendly HTML document (disguised .doc).
    // Use octet-stream to treat as generic binary download (best chance to go straight to Downloads without "open with" or picker).
    // Aggressive link handling + trusted user gesture (button click) to force direct save.
    // NOTE: If it STILL prompts for location, check your browser settings (chrome://settings/downloads > "Ask where to save each file"). We cannot fully override that from code.
    const header = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>2026 Business Plan</title><style>body{font-family:Calibri,Arial,sans-serif;margin:40px;line-height:1.6;color:#000;}' +
                   'h1{color:#002B5C;text-align:center;}h2{color:#00A89D;border-bottom:2px solid #00A89D;padding-bottom:8px;}' +
                   'ul{padding-left:30px;}li{margin:12px 0;}</style></head><body>';
    const content = preview.innerHTML;
    const footer = '</body></html>';
    const blob = new Blob([header + content + footer], { type: 'application/octet-stream' });

    // IE/Edge legacy
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, '2026_Business_Plan.doc');
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2026_Business_Plan.doc';
    a.style.display = 'none';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    // cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
}

// Save the entire generated plan as a rich item in My Saved Items (unified vault) - type 'plan'
function saveFullPlanToVault() {
    try {
        const preview = document.getElementById('plan-preview');
        const output = document.getElementById('plan-output');
        if (!preview && !output) {
            if (window.showToast) window.showToast('No plan content found to save.', 'error');
            return;
        }

        // Save a *cleaner* version for My Saved Items: prefer the core AI content (preview).
        // Strip heavy orange branding / large v2 accents / prose classes so it's readable as plain-ish formatted text (bold, headings, lists kept; no huge orange letters).
        // User requested: some formatting ok (bold etc), but not the big orange from the tool UI.
        let raw = (preview ? preview.innerHTML : (output ? (output.querySelector('#plan-preview') ? output.querySelector('#plan-preview').innerHTML : output.innerHTML) : '')) || 'Custom 2026 Business Plan';

        // Sanitize: replace orange accents with neutral dark, remove large prose / shadow / border-2 orange wrappers if leaked, keep structure.
        let cleanContent = raw
          .replace(/text-\[#F15A29\]/g, 'text-[#002B5C]')
          .replace(/bg-\[#F15A29\][^\s"']*/g, 'bg-gray-100')
          .replace(/border-\[#F15A29\][^\s"']*/g, 'border-gray-200')
          .replace(/ring-\[#F15A29\][^\s"']*/g, '')
          .replace(/prose-lg|prose-xl|prose-2xl/g, 'prose prose-base')
          .replace(/shadow-2xl|shadow-xl/g, 'shadow-sm')
          .replace(/border-2 border-\[#F15A29\]\/30/g, 'border border-gray-200')
          .replace(/YOUR 2026 ROADMAP IS READY|Your Custom 2026 Business Plan|Bring This Plan to Life/g, '') // strip hero chrome if present in fallback
          .replace(/<div class="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-\[#F15A29\] text-white text-xs[^>]*>.*?<\/div>/gi, '')
          .replace(/<h3 class="text-3xl[^>]*>.*?<\/h3>/gi, ''); // remove the big orange h3 if in full output

        // Add a small neutral header note
        cleanContent = '<div style="margin-bottom:12px;font-size:12px;color:#666;border-bottom:1px solid #eee;padding-bottom:6px;">2026 Business Plan (clean view — original formatting preserved where helpful)</div>' + cleanContent;

        const title = '2026 Business Plan — ' + (document.querySelector('input[name="plan-style"]:checked')?.value || 'Custom');

        const contentToStore = cleanContent.length > 12000 ? cleanContent.substring(0, 12000) + '<!-- truncated for storage -->' : cleanContent;

        if (typeof window.toggleSaveIdea === 'function') {
            // Use the unified system with correct type label 'plan'
            window.toggleSaveIdea(title, contentToStore, null, 'plan');
            if (typeof window.showSavedFeedback === 'function') {
                window.showSavedFeedback('Full plan saved to My Saved Items');
            } else if (typeof window.showToast === 'function') {
                window.showToast('Full plan saved to My Saved Items');
            } else {
                // Last-resort visible feedback
                const fb = document.createElement('div');
                fb.textContent = '✓ 2026 Plan saved to My Saved Items';
                fb.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#00A89D;color:white;padding:10px 18px;border-radius:9999px;font-size:13px;z-index:999999;box-shadow:0 10px 15px -3px rgb(0 0 0 / 0.1)';
                document.body.appendChild(fb);
                setTimeout(() => fb.remove(), 2400);
            }
        } else {
            // Fallback direct to localStorage using same key the vault reads
            let saved = [];
            try { saved = JSON.parse(localStorage.getItem('socialSavedIdeas') || '[]'); } catch(e){}
            const exists = saved.some(s => s.title === title);
            if (!exists) {
                saved.push({ title, content: contentToStore, savedAt: new Date().toISOString(), type: 'plan' });
                localStorage.setItem('socialSavedIdeas', JSON.stringify(saved));
                if (typeof window.updateSavedCount === 'function') window.updateSavedCount();
                if (typeof window.showToast === 'function') window.showToast('Full plan saved to My Saved Items (fallback)');
            } else {
                if (window.showToast) window.showToast('Already saved in your vault.');
                else alert('Already saved in your vault.');
            }
        }
    } catch (err) {
        console.error('[saveFullPlanToVault] failed:', err);
        if (window.showToast) window.showToast('Could not save plan — see console.', 'error');
        else alert('Could not save plan. Check console for details.');
    }
}
window.saveFullPlanToVault = saveFullPlanToVault;

// Clear the saved 2026 Business Plan (called from the Clear button in the plan output)
function clearBusinessPlan() {
    const output = document.getElementById('plan-output');
    if (!output) return;

    if (!confirm('Clear your saved 2026 Business Plan? This removes it from this browser and cannot be undone.')) {
        return;
    }

    localStorage.removeItem('savedBusinessPlan');
    output.innerHTML = '';
    output.classList.add('hidden');
    output.style.display = 'none';
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

  // Only toast if the planning section is currently visible (avoids spam toast on every page load from init call)
  const planningSection = document.getElementById('planning');
  if (typeof window.showToast === 'function' && planningSection && !planningSection.classList.contains('hidden')) {
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

// === Fun Quick Start Presets (ported + active) ===
window.applyPlanPreset = function(preset) {
  // Sets realistic target numbers (and hobby hints for hobby-first) but DOES NOT touch the Your 2026 Vision / style radios.
  // Presets only affect the numeric targets as requested.
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

  if (preset === 'conservative') {
    setVal('target-income', '180000');
    setVal('target-closings', '42');
    setVal('avg-commission', '6200');
    setVal('closing-ratio', '35');
    setVal('current-partners', '12');
    setVal('new-partners', '8');
    setVal('database-size', '420');
  } else if (preset === 'realistic') {
    setVal('target-income', '260000');
    setVal('target-closings', '58');
    setVal('avg-commission', '6800');
    setVal('closing-ratio', '30');
    setVal('current-partners', '22');
    setVal('new-partners', '14');
    setVal('database-size', '780');
  } else if (preset === 'stretch') {
    setVal('target-income', '340000');
    setVal('target-closings', '75');
    setVal('avg-commission', '7200');
    setVal('closing-ratio', '28');
    setVal('current-partners', '28');
    setVal('new-partners', '22');
    setVal('database-size', '950');
  } else if (preset === 'moonshot') {
    setVal('target-income', '475000');
    setVal('target-closings', '95');
    setVal('avg-commission', '7800');
    setVal('closing-ratio', '25');
    setVal('current-partners', '35');
    setVal('new-partners', '30');
    setVal('database-size', '1100');
  } else if (preset === 'hobby-first') {
    setVal('target-income', '235000');
    setVal('target-closings', '52');
    setVal('avg-commission', '6500');
    setVal('closing-ratio', '32');
    setVal('current-partners', '18');
    setVal('new-partners', '12');
    setVal('database-size', '600');
    // Check a couple hobby-ish boxes to signal the vibe (ids from HTML) -- use exact map keys
    const fam = document.getElementById('hobby-family'); if (fam) fam.checked = true;
    const golf = document.getElementById('hobby-golf'); if (golf) golf.checked = true;
  }

  // Trigger live insight update + highlights + tactics (style radios untouched)
  setTimeout(() => {
    if (typeof window.updatePlanLiveInsight === 'function') window.updatePlanLiveInsight();
    if (typeof window.updatePlanCompleteness === 'function') window.updatePlanCompleteness();
    if (typeof window.wirePlanStyleCards === 'function') window.wirePlanStyleCards();
    if (typeof window.updateHobbyTactics === 'function') window.updateHobbyTactics();
  }, 80);

  // Gentle toast
  if (typeof window.showToast === 'function') {
    window.showToast('Preset loaded — tweak anything you want (vision style left as you chose)');
  }

  // Highlight the selected preset button (similar to Your 2026 Vision cards) so selection is obvious
  highlightActivePreset(preset);
};

// Helper to visually highlight the chosen "Start here" preset (only one at a time)
function highlightActivePreset(preset) {
  document.querySelectorAll('.plan-preset-btn').forEach(btn => {
    btn.classList.remove('!border-[#F15A29]', 'bg-[#F15A29]/10', 'text-[#F15A29]', 'ring-2', 'ring-[#F15A29]/30');
    const oc = btn.getAttribute('onclick') || '';
    if (oc.includes(`'${preset}'`)) {
      btn.classList.add('!border-[#F15A29]', 'bg-[#F15A29]/10', 'text-[#F15A29]', 'ring-2', 'ring-[#F15A29]/30');
    }
  });
}

// Save current entire form state as "My Baseline"
window.savePlanBaseline = function() {
  const state = {
    style: document.querySelector('input[name="plan-style"]:checked')?.value || 'Balanced Growth',
    'target-income': document.getElementById('target-income')?.value || '',
    'target-closings': document.getElementById('target-closings')?.value || '',
    'avg-commission': document.getElementById('avg-commission')?.value || '',
    'avg-loan': document.getElementById('avg-loan')?.value || '',
    'closing-ratio': document.getElementById('closing-ratio')?.value || '',
    'current-partners': document.getElementById('current-partners')?.value || '',
    'new-partners': document.getElementById('new-partners')?.value || '',
    'database-size': document.getElementById('database-size')?.value || '',
    hobbies: Array.from(document.querySelectorAll('.hobby-checkbox:checked')).map(c => c.value),
    hobbyOther: document.getElementById('hobby-other')?.value || '',
    activities: Array.from(document.querySelectorAll('.activity-checkbox:checked')).map(c => c.value),
    notes: document.getElementById('plan-notes')?.value || ''
  };
  localStorage.setItem('planBaseline', JSON.stringify(state));
  if (typeof window.showToast === 'function') {
    window.showToast('Form state saved as your Baseline. Use Load to restore anytime.');
  } else {
    alert('Saved as My Baseline!');
  }
};

// Load previously saved baseline
window.loadPlanBaseline = function() {
  const raw = localStorage.getItem('planBaseline');
  if (!raw) {
    if (typeof window.showToast === 'function') window.showToast('No baseline saved yet — use the Save button first.');
    else alert('No baseline saved yet. Fill the form and click "Save as My Baseline".');
    return;
  }
  const state = JSON.parse(raw);

  // set style
  document.querySelectorAll('input[name="plan-style"]').forEach(r => {
    r.checked = (r.value === state.style);
  });

  // set number fields
  const numIds = ['target-income','target-closings','avg-commission','avg-loan','closing-ratio','current-partners','new-partners','database-size'];
  numIds.forEach(id => {
    const el = document.getElementById(id);
    if (el && state[id] !== undefined) el.value = state[id];
  });

  // reset and set hobbies
  document.querySelectorAll('.hobby-checkbox').forEach(cb => cb.checked = false);
  (state.hobbies || []).forEach(v => {
    const cb = document.querySelector(`.hobby-checkbox[value="${CSS.escape(v)}"]`);
    if (cb) cb.checked = true;
  });
  const ho = document.getElementById('hobby-other');
  if (ho) ho.value = state.hobbyOther || '';

  // reset and set activities
  document.querySelectorAll('.activity-checkbox').forEach(cb => cb.checked = false);
  (state.activities || []).forEach(v => {
    const cb = document.querySelector(`.activity-checkbox[value="${CSS.escape(v)}"]`);
    if (cb) cb.checked = true;
  });

  const notes = document.getElementById('plan-notes');
  if (notes) notes.value = state.notes || '';

  // refresh everything
  if (typeof window.updatePlanLiveInsight === 'function') window.updatePlanLiveInsight();
  if (typeof window.updatePlanCompleteness === 'function') window.updatePlanCompleteness();
  if (typeof window.wirePlanStyleCards === 'function') window.wirePlanStyleCards();
  if (typeof window.updateHobbyTactics === 'function') window.updateHobbyTactics();
  if (typeof window.renderExtendedProfileInfo === 'function') window.renderExtendedProfileInfo();

  if (typeof window.showToast === 'function') {
    window.showToast('Baseline loaded into the form.');
  }
};

// === Hobby-Tied Tactics (richer, live suggestions based on selected hobbies) ===
const hobbyTacticsMap = {
  'Golf': 'Invite a top realtor for 9 holes this month. No pitch — just ask about their toughest client challenge over the back nine.',
  'Family Time': 'Text 3 past clients with kids the same age as yours a quick family photo + “hope your crew is loving the season”. Zero ask.',
  'Cooking': 'Host a tiny “client appreciation” cooking demo or dinner for 4-6 sphere members. Share one recipe + one market stat.',
  'Outdoors': 'Organize a casual group hike or park walk with 2-3 sphere + one agent. Position as community value, not sales.',
  'Fitness': 'Start a friendly monthly step challenge with one partner. Loser buys coffee and you casually discuss one referral opportunity.',
  'Crafts': 'Hand-write 5 “thank you + local market update” cards to your best referrers this month. Your authenticity stands out.',
  'Cards/Poker': 'Host a low-key poker or game night for 6-8 people from sphere + one agent. Winner gets a small gift from you.',
  'Sports': 'Group text 5 sphere “big game this weekend?” then follow up mid-week with a 1-line market insight that feels natural.',
  'Crafts / DIY': 'Make or customize a small “welcome home” item for a recent client closing and drop it by with a photo for social.',
  'Fitness / Gym': 'Offer to be a “accountability buddy” for a partner who also works out — turns into regular non-mortgage conversations.'
};

window.updateHobbyTactics = function() {
  const container = document.getElementById('hobby-tactics-content');
  if (!container) return;
  const checkedVals = Array.from(document.querySelectorAll('.hobby-checkbox:checked')).map(cb => cb.value);
  if (checkedVals.length === 0) {
    container.innerHTML = 'Select one or more hobbies above — we’ll suggest authentic, low-pressure ways to turn your real passions into referral-building moves.';
    return;
  }
  let tactics = [];
  checkedVals.forEach(h => {
    if (hobbyTacticsMap[h]) tactics.push(hobbyTacticsMap[h]);
  });
  if (tactics.length === 0) {
    tactics = ['Your real life interests are your secret weapon. Even without a specific script, mentioning what you love doing makes every touch feel human and memorable.'];
  }
  container.innerHTML = tactics.slice(0, 3).map(t => `<div class="mb-1.5">• ${t}</div>`).join('');
};

// === Inspiration Pull (richer, from curated Book Vault + Mindset Lab ideas) ===
const inspirations = [
  { title: "Never Split the Difference", content: "Use calibrated questions and tactical empathy instead of arguing rate objections.", why: "Builds trust fast with both clients and realtors — perfect for Referral Mastery or any style.", tags: ['referral','objections'], saveLabel: 'Book idea: Never Split the Difference' },
  { title: "Atomic Habits", content: "You do not rise to the level of your goals. You fall to the level of your systems.", why: "Turn prospecting into a non-negotiable system instead of a motivation-dependent event.", tags: ['discipline','habits'], saveLabel: 'Mindset from Atomic Habits' },
  { title: "The Go-Giver", content: "Your income is determined by how many people you serve and how well you serve them.", why: "Shift from “what can I get” to “how can I add value first” in every partner conversation.", tags: ['value','referral'], saveLabel: 'Book takeaway: The Go-Giver' },
  { title: "Fanatical Prospecting", content: "Prospecting is a numbers game fueled by discipline and the right activity mix.", why: "Even on slow days, the mix (calls + notes + social + pop-bys) compounds.", tags: ['prospecting','discipline'], saveLabel: 'Prospecting truth: Fanatical Prospecting' },
  { title: "Mindset Lab — Rejection", content: "Your job is not to avoid hearing no. Your job is to make 'no' meaningless by having so many conversations that the nos become background noise.", why: "Great reframe when the pipeline feels quiet — just keep the activity volume up.", tags: ['resilience','mindset'], saveLabel: 'Mindset reframe for tough days' },
  { title: "Book of Yes", content: "Your success is directly tied to the quality of your conversations with real estate agents.", why: "Every realtor touch should make them look like the hero to their clients.", tags: ['referral','realtors'], saveLabel: 'Realtor conversation tip: Book of Yes' },
  { title: "Mindset Lab — Discipline", content: "If it isn’t scheduled, it isn’t real. Hope is not a calendar entry.", why: "Block the exact time for the activities you chose above — protect it like a client appointment.", tags: ['discipline','habits'], saveLabel: 'Scheduling truth from Mindset Lab' },
  { title: "Building a StoryBrand", content: "If you confuse, you lose. Make the customer the hero of the story.", why: "Your social and partner content should position the client/realtor as the hero, not you.", tags: ['social','branding'], saveLabel: 'StoryBrand content principle' }
];

window.pullInspiration = function() {
  const box = document.getElementById('inspiration-pull');
  if (!box) return;
  box.classList.remove('hidden');
  box.style.display = 'block';

  // bias toward current style or hobbies if possible
  const currentStyle = document.querySelector('input[name="plan-style"]:checked')?.value || '';
  const currentHobbies = Array.from(document.querySelectorAll('.hobby-checkbox:checked')).map(c => c.value.toLowerCase());
  let pool = inspirations;
  const styleMatch = inspirations.filter(i => currentStyle.toLowerCase().includes('referral') && i.tags.includes('referral') || currentStyle.toLowerCase().includes('database') && i.tags.includes('value'));
  if (styleMatch.length) pool = styleMatch;
  const hobbyMatch = inspirations.filter(i => i.tags.some(t => currentHobbies.some(h => h.includes(t) || t.includes(h))));
  if (hobbyMatch.length > 0) pool = hobbyMatch;

  const pick = pool[Math.floor(Math.random() * pool.length)];
  box.innerHTML = `
    <div class="flex justify-between items-start">
      <div class="flex-1">
        <div class="font-semibold text-[#002B5C] dark:text-white">${pick.title}</div>
        <div class="mt-1 text-gray-700 dark:text-gray-300">${pick.content}</div>
        <div class="mt-2 text-xs italic text-[#00A89D]">Why this fits you right now: ${pick.why}</div>
      </div>
      <button class="insp-save-btn ml-3 text-xs px-3 py-1 rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white flex-shrink-0">Save</button>
    </div>
    <div class="mt-2 text-[10px] text-gray-400">Pulled for your current plan — hit the button again for another.</div>
  `;
  // attach safely (avoids quote issues in template)
  const saveBtn = box.querySelector('.insp-save-btn');
  if (saveBtn) {
    saveBtn.onclick = () => window.saveInspiration(saveBtn, pick.saveLabel, pick.content + ' ' + pick.why);
  }
};

window.saveInspiration = function(btn, title, text) {
  if (typeof window.toggleSaveIdea === 'function') {
    window.toggleSaveIdea(title, text, btn, 'plan');
  } else {
    // fallback
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem('socialSavedIdeas') || '[]'); } catch(e){}
    if (!saved.some(s => s.title === title)) {
      saved.push({ title, content: text, savedAt: new Date().toISOString(), type: 'plan' });
      localStorage.setItem('socialSavedIdeas', JSON.stringify(saved));
      if (typeof window.updateSavedCount === 'function') window.updateSavedCount();
      if (typeof window.showSavedFeedback === 'function') window.showSavedFeedback('Saved to My Saved Items');
    }
    if (btn) btn.textContent = 'Saved!';
  }
};

// Live "what this means" calculator — makes the numbers human and removes anxiety
function updatePlanLiveInsight() {
  const insight = document.getElementById('plan-insight-text');
  if (!insight) return;

  const closings = parseFloat(document.getElementById('target-closings')?.value) || 0;
  const income = parseFloat(document.getElementById('target-income')?.value) || 0;
  const ratio = (parseFloat(document.getElementById('closing-ratio')?.value) || 30) / 100;
  const partners = parseFloat(document.getElementById('current-partners')?.value) || 0;

  if (!closings && !income) {
    insight.innerHTML = 'Fill in a couple numbers above and we’ll show you the real weekly activity it takes — no judgment, just clarity.';
    return;
  }

  const leadsNeeded = closings ? Math.ceil(closings / Math.max(ratio, 0.1)) : 0;
  const weeklyConvos = leadsNeeded ? Math.ceil(leadsNeeded / 48) : 0; // rough 48 working weeks
  const partnerGrowth = Math.max(0, (partners ? Math.ceil((closings * 0.6) / 12) - partners : 8)); // simplistic but directionally helpful

  let html = `<div class="flex flex-wrap gap-x-6 gap-y-1 items-start">`;
  if (closings) {
    html += `<div class="flex items-center gap-2"><i class="fas fa-home text-[#F15A29]"></i> <span>To close <strong class="tabular-nums">${closings}</strong> loans: ~<strong class="tabular-nums">${leadsNeeded}</strong> conversations/referrals needed (${Math.round(ratio*100)}% ratio).</span></div>`;
  }
  if (weeklyConvos) {
    html += `<div class="flex items-center gap-2"><i class="fas fa-comments text-[#00A89D]"></i> <span><strong class="tabular-nums">${weeklyConvos}</strong> focused convos/week on avg — easy when you use the activities you picked.</span></div>`;
  }
  if (partnerGrowth > 0) {
    html += `<div class="flex items-center gap-2"><i class="fas fa-user-plus text-[#002B5C]"></i> <span>Adding <strong class="tabular-nums">${partnerGrowth}</strong> solid new partners this year changes everything.</span></div>`;
  }
  html += `</div><div class="text-[11px] mt-1 text-gray-500">The AI will build the plan around your real capacity and what you enjoy — no heroic sprints required.</div>`;
  if (!closings && !weeklyConvos) html = 'Nice numbers. The AI will turn these into a plan that respects your actual schedule and personality.';

  insight.innerHTML = html;

  // also dedicated style note (set not append, per requirements)
  const note = document.getElementById('plan-style-note');
  if (note) {
    const style = document.querySelector('input[name="plan-style"]:checked')?.value || '';
    if (style) {
      note.textContent = style + ' focus selected.';
    }
  }
}

// Wire live updates on the key number fields (call once on load + on input)
function wirePlanLiveCalculations() {
  // Expand to all numeric fields that can affect the live insight / completeness for immediate updates
  const fields = ['target-closings', 'target-income', 'avg-commission', 'avg-loan', 'closing-ratio', 'current-partners', 'new-partners', 'database-size'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el && !el._liveWired) {
      el._liveWired = true;
      el.addEventListener('input', () => {
        updatePlanLiveInsight();
        if (typeof window.updatePlanCompleteness === 'function') window.updatePlanCompleteness();
      });
      el.addEventListener('change', () => {
        updatePlanLiveInsight();
        if (typeof window.updatePlanCompleteness === 'function') window.updatePlanCompleteness();
      });
    }
  });

  // React to style changes: update the dedicated note + full insight immediately (no temp clear)
  document.querySelectorAll('input[name="plan-style"]').forEach(r => {
    if (!r._liveWired) {
      r._liveWired = true;
      r.addEventListener('change', () => {
        updatePlanLiveInsight();  // this will set the style note properly to "XXX focus selected."
        if (typeof window.updatePlanCompleteness === 'function') window.updatePlanCompleteness();
        // If user manually picks a vision, clear any active "start here" preset highlight (so it's obvious the preset is no longer the selection)
        document.querySelectorAll('.plan-preset-btn').forEach(b => b.classList.remove('!border-[#F15A29]', 'bg-[#F15A29]/10', 'text-[#F15A29]', 'ring-2', 'ring-[#F15A29]/30'));
      });
    }
  });

  // Also wire plan-notes for completeness
  const notesEl = document.getElementById('plan-notes');
  if (notesEl && !notesEl._liveWired) {
    notesEl._liveWired = true;
    notesEl.addEventListener('input', () => {
      if (typeof window.updatePlanCompleteness === 'function') window.updatePlanCompleteness();
    });
  }

  // Initial calculation if values are pre-filled by restore
  setTimeout(() => {
    updatePlanLiveInsight();
    if (typeof window.updatePlanCompleteness === 'function') window.updatePlanCompleteness();
  }, 180);

  // Plan Completeness meter (gamifies filling the form, shows value of profile + details)
  function updatePlanCompleteness() {
    const pctEl = document.getElementById('plan-completeness-pct');
    const barEl = document.getElementById('plan-completeness-bar');
    if (!pctEl || !barEl) return;

    let score = 0;
    const checks = [
      () => !!document.querySelector('input[name="plan-style"]:checked'),
      () => !!document.getElementById('target-closings')?.value,
      () => !!document.getElementById('target-income')?.value,
      () => !!document.getElementById('current-partners')?.value,
      () => !!document.getElementById('database-size')?.value,
      () => document.querySelectorAll('.hobby-checkbox:checked').length > 0 || !!document.getElementById('hobby-other')?.value,
      () => document.querySelectorAll('.activity-checkbox:checked').length > 0,
      () => !!document.getElementById('plan-notes')?.value,
    ];
    // Bonus for profile data
    const p = (typeof window.getUserProfile === 'function') ? window.getUserProfile() : {};
    if (p.name || p.hobbies?.length || p.challenges?.length) score += 15;
    if (p.monthlyUnits || p.hours) score += 10;

    const filled = checks.filter(c => c()).length;
    const base = Math.round((filled / checks.length) * 80);  // bumped to reach 100% easier when main things + profile filled
    const total = Math.min(100, base + score);

    pctEl.textContent = total + '%';
    barEl.style.width = total + '%';
    if (total > 75) {
      barEl.style.background = 'linear-gradient(to right, #00A89D, #F15A29)';
    }
  }
  window.updatePlanCompleteness = updatePlanCompleteness;

  // Wire completeness to relevant fields
  function wirePlanCompleteness() {
    const ids = ['target-income','target-closings','current-partners','database-size','plan-notes','hobby-other'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', updatePlanCompleteness);
        el.addEventListener('change', updatePlanCompleteness);
      }
    });
    // checkboxes
    document.querySelectorAll('.hobby-checkbox, .activity-checkbox').forEach(cb => {
      cb.addEventListener('change', updatePlanCompleteness);
      // also live update hobby tactics when hobbies change
      if (cb.classList.contains('hobby-checkbox')) {
        cb.addEventListener('change', () => {
          if (typeof window.updateHobbyTactics === 'function') window.updateHobbyTactics();
        });
      }
    });
    // also on profile changes indirectly
    setTimeout(updatePlanCompleteness, 300);
  }
  setTimeout(wirePlanCompleteness, 800);
  setTimeout(() => { if (typeof window.updateHobbyTactics === 'function') window.updateHobbyTactics(); }, 900);

  // Visual active state for the pretty plan-style cards (only selected one highlighted)
  function wirePlanStyleCards() {
    document.querySelectorAll('.plan-style-card').forEach(card => {
      const radio = card.querySelector('input[type="radio"]');
      if (!radio) return;
      if (card._styleWired) return; // guard against duplicate listeners (prevents freeze on repeated calls)
      card._styleWired = true;
      const update = () => {
        document.querySelectorAll('.plan-style-card').forEach(c => c.classList.remove('!border-[#F15A29]', 'ring-2', 'ring-[#F15A29]/30', 'bg-[#F15A29]/5', 'border-[#00A89D]', 'ring-2', 'ring-[#00A89D]/30', 'bg-[#00A89D]/5'));
        if (radio.checked) {
          // use orange for selected to match accent
          card.classList.add('!border-[#F15A29]', 'ring-2', 'ring-[#F15A29]/30', 'bg-[#F15A29]/5');
        }
      };
      radio.addEventListener('change', update);
      card.addEventListener('click', () => {
        radio.checked = true;
        update();
        // Fire change so live insight / "what this means in real life" + note updates immediately
        radio.dispatchEvent(new Event('change', { bubbles: true }));
      });
      // initial
      if (radio.checked) update();
    });
  }
  setTimeout(wirePlanStyleCards, 700);
  window.wirePlanStyleCards = wirePlanStyleCards;
}

// Call the wiring when this file loads (it will also be safe if called multiple times)
if (typeof window.wirePlanLiveCalculations !== 'function') {
  window.wirePlanLiveCalculations = wirePlanLiveCalculations;
  window.updatePlanLiveInsight = updatePlanLiveInsight;
  // Auto-run after a moment so DOM is ready
  setTimeout(wirePlanLiveCalculations, 650);
}

window.downloadPlanWord = downloadPlanWord;
window.restoreSavedBusinessPlan = restoreSavedBusinessPlan;
window.clearBusinessPlan = clearBusinessPlan;
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

      // Force the rich progress modal (enrich panel + tips) as the VERY FIRST thing. This guarantees the user sees the modal instead of any note in #plan-output.
      if (typeof window.forceShowGlobalLoading === 'function') {
        window.forceShowGlobalLoading('Crafting Your 2026 Business Plan...');
      }

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
      document.getElementById('generate-plan-btn').onclick = () => {
        if (typeof window.forceShowGlobalLoading === 'function') window.forceShowGlobalLoading('Crafting Your 2026 Business Plan...');
        (window.generatePlan || generatePlan)('plan-output');
      };
    }

    // Weekly Win Plan button (the one inside the Weekly Win Plan tool)
    const weeklyWinBtn = document.getElementById('generate-win-plan-btn');
    if (weeklyWinBtn && !weeklyWinBtn._wwpWired) {
        weeklyWinBtn._wwpWired = true;
        // Use addEventListener only, no override to avoid conflicts
        weeklyWinBtn.addEventListener('click', () => {
            console.log('%c[weekly-win-plan] Weekly Win Plan "Build This Week\'s Plan" button clicked', 'color: lime');
            // Force the progress experience FIRST (uses the shared ultra force helper so the custom weekly loading card appears immediately)
            if (typeof window.forceShowGlobalLoading === 'function') {
              window.forceShowGlobalLoading('Building Your Weekly Win Plan...');
            }
            // Extra defensive force for the container itself
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

    // Auto-sync profile prefs by default on init (so when you land on #planning via direct load/hash, profile values like hobbies/activities/numbers are there as baseline)
    // (toast only happens if section visible at time of call)
    if (typeof window.syncPlanningFormFromProfile === 'function') {
      try { window.syncPlanningFormFromProfile(); } catch(e){}
    }

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

    // Wire the v2 live UI (style highlights, live insight, completeness meter, tactics, listeners for inputs/hobbies)
    if (typeof window.wirePlanLiveCalculations === 'function') {
      try { window.wirePlanLiveCalculations(); } catch(e){}
    }
    if (typeof window.wirePlanStyleCards === 'function') {
      try { window.wirePlanStyleCards(); } catch(e){}
    }
    if (typeof window.updatePlanLiveInsight === 'function') {
      try { window.updatePlanLiveInsight(); } catch(e){}
    }
    if (typeof window.updatePlanCompleteness === 'function') {
      try { window.updatePlanCompleteness(); } catch(e){}
    }
    if (typeof window.updateHobbyTactics === 'function') {
      try { window.updateHobbyTactics(); } catch(e){}
    }

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

        // Update legacy download button labels back to .doc (we use Word doc for this tool)
        out.querySelectorAll('button[onclick*="downloadPlanWord"]').forEach(btn => {
          const txt = (btn.textContent || '').toLowerCase();
          if (txt.includes('pdf') || txt.includes('download pdf')) {
            btn.innerHTML = '<i class="fas fa-file-download"></i> <span>Download .doc</span>';
          }
        });

        // If a super-old saved plan has no clear button at all, add one (new saves have it baked in)
        if (!out.querySelector('button[onclick*="clearBusinessPlan"]') && !out.querySelector('.clear-business-plan')) {
          const clearBar = document.createElement('div');
          clearBar.className = 'text-right -mt-2 mb-3';
          const clearBtn = document.createElement('button');
          clearBtn.className = 'clear-business-plan text-xs px-3 py-1 rounded-xl border border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600 transition';
          clearBtn.textContent = 'Clear this saved plan';
          clearBtn.onclick = () => { if (window.clearBusinessPlan) window.clearBusinessPlan(); };
          clearBar.appendChild(clearBtn);
          if (out.firstChild) out.insertBefore(clearBar, out.firstChild);
          else out.appendChild(clearBar);
        }
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
