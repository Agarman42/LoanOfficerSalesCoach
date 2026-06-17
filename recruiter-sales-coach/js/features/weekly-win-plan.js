/**
 * js/features/weekly-win-plan.js
 *
 * Weekly Recruiting Plan / Business Planning & Setup
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
  // Weekly Recruiting Plan (generateWeeklyPlan + #weekly-win-plan + #generate-win-plan-btn + weekly-tasks-container + weekly-plan-results + its own custom loading backup/replace + savedWeeklyPlan + userSetup prefs)
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
      name: central.name || local.name || "Recruiter",
      email: central.email || '',
      monthlyUnits: central.monthlyUnits || local.monthlyUnits || 5,
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
      targetPartners: central.targetPartners || central.partnerTypes || local.targetPartners || local.partnerTypes || [],
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
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 min-w-0">
          <div class="flex items-center gap-2 text-[#00A89D] mb-1"><i class="fas fa-user text-sm"></i> <span class="text-xs font-bold tracking-wider">NAME</span></div>
          <div class="font-semibold text-gray-900 dark:text-white text-[15px] break-words leading-tight">${p.name || eff.name || '—'}</div>
        </div>
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 min-w-0">
          <div class="flex items-center gap-2 text-[#00A89D] mb-1"><i class="fas fa-bullseye text-sm"></i> <span class="text-xs font-bold tracking-wider">MONTHLY NET HIRES</span></div>
          <div class="font-semibold text-gray-900 dark:text-white text-[15px] break-words leading-tight">${p.monthlyUnits || eff.monthlyUnits || '—'}</div>
        </div>
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 min-w-0">
          <div class="flex items-center gap-2 text-[#00A89D] mb-1"><i class="fas fa-chart-line text-sm"></i> <span class="text-xs font-bold tracking-wider">ANNUAL NET HIRES</span></div>
          <div class="font-semibold text-gray-900 dark:text-white text-[15px] break-words leading-tight">${p.monthlyGoal || eff.monthlyVolume || (p.monthlyUnits ? (parseInt(p.monthlyUnits, 10) * 12 || '—') : '—')}</div>
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
    // 2026 BUSINESS PLAN ONLY - see top of file for separation from generateWeeklyPlan / Weekly Recruiting Plan


    // ABSOLUTE FIRST ACTION: force the progress modal visible with the rich overlay (enrich panel + cycling tips).
    // This must happen before ANY DOM writes to output areas so the user NEVER sees a "generating" note in the page.
    if (typeof window.forceShowGlobalLoading === 'function') {
      window.forceShowGlobalLoading('Crafting Your 2026 Recruiting Plan...');
    }

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
      window.showLoadingWithTips(businessTips, 'Crafting Your 2026 Recruiting Plan...');
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

      const content = loadingEl.querySelector('div.bg-white') || loadingEl.querySelector('.bg-white') || loadingEl.firstElementChild || loadingEl.querySelector('div'); // the inner white card (robust selector after dynamic create or static)
      if (!content) return;

      loadingEl.classList.remove('hidden');
      loadingEl.style.setProperty('display', 'flex', 'important');
      loadingEl.style.setProperty('z-index', '99999', 'important');
      loadingEl.style.setProperty('visibility', 'visible', 'important');
      loadingEl.style.setProperty('opacity', '1', 'important');

      // Enrich with plan-specific value, status, and a visual progress simulation
      const styleVal = document.querySelector('input[name="plan-style"]:checked')?.value || 'Balanced Recruiting';
      const monthlyHires = document.getElementById('target-income')?.value || '?';
      const annualHires = document.getElementById('target-closings')?.value || '?';
      const hobbyEls = Array.from(document.querySelectorAll('.hobby-checkbox:checked')).map(cb => cb.nextElementSibling ? cb.nextElementSibling.textContent.trim() : '');
      const hobbiesStr = hobbyEls.length ? hobbyEls.join(', ') : 'your selected hobbies';

      const enrichHTML = `
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-left">
          <div class="text-xs uppercase tracking-widest text-[#00A89D] mb-2">Building your plan around</div>
          <div class="text-sm text-gray-700 dark:text-gray-300 mb-3">
            <strong>Style:</strong> ${styleVal} &nbsp;•&nbsp; <strong>Targets:</strong> ${monthlyHires} net hires/mo • ${annualHires} annual<br>
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
            <div class="flex items-center gap-2 mb-1"><i class="fas fa-spinner fa-spin text-[#F15A29]"></i> Generating quarterly milestones + Weekly Recruiting Plan actions</div>
            <div class="flex items-center gap-2"><i class="fas fa-spinner fa-spin text-[#F15A29]"></i> Creating cross-tool execution links (Weekly Plan, Social, Playbook, Prospect Nurturing)</div>
          </div>
        </div>
      `;

      // Ensure / populate the enrich panel (works whether placeholder in static or created by JS)
      let panel = content.querySelector('#plan-enrich-panel');
      if (panel) {
        panel.innerHTML = enrichHTML;
      } else {
        panel = document.createElement('div');
        panel.id = 'plan-enrich-panel';
        panel.innerHTML = enrichHTML;
        content.appendChild(panel);
      }

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
    })();

    const style = document.querySelector('input[name="plan-style"]:checked')?.value || 'Balanced Recruiting';
    const metrics = window.RECRUITING_METRICS || {};
    const wk = metrics.weekly || {};
    const mo = metrics.monthly || {};

    const inputs = {
        annualNetHires: document.getElementById('target-closings')?.value || String(metrics.annualGoal?.netHires || 60),
        monthlyNetHires: document.getElementById('target-income')?.value || String(mo.netHires || 5),
        weeklyOutreach: document.getElementById('avg-commission')?.value || String(wk.outreachAttempts || 270),
        weeklyQualityConvos: document.getElementById('avg-loan')?.value || String(wk.qualityConversations?.min || 24),
        weeklyExecCalls: document.getElementById('closing-ratio')?.value || String(wk.executiveCallsScheduled?.min || 5),
        weeklySocialConnections: document.getElementById('new-partners')?.value || '17',
        activeShapeProspects: document.getElementById('current-partners')?.value || '',
        warmPipelineSize: document.getElementById('database-size')?.value || ''
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

    // NOTE: We deliberately do NOT touch the output container here. The rich #global-loading overlay (with enrich panel, live profile snapshot, animated progress, and cycling tips) is the ONLY thing the user should see while the API works.
    // Final rich plan HTML is injected only in the finally{} after hideLoading().

    let fullPlan = '';
    let planContent = '';

    try {
    const prompt = `You are an elite Ruoff Mortgage recruiting strategist who has built high-performing recruiting teams. Create a 2026 Recruiting Plan that is simultaneously world-class and deeply personal — something a serious recruiter would proudly print and run their year from. NO EMOJIS.

Plan Style Chosen: ${style}

DEEP PERSONALIZATION FROM PROFILE:
- Name: ${richProfile.name}
- Email: ${richProfile.email || profile.email || 'not specified'}
- Years in recruiting/mortgage: ${profile.years || 'not specified'}
- Personality / Voice: ${profile.personality || richProfile.personality || 'not specified'}
- Preferred Tone: ${profile.tone || richProfile.tone || 'warm and professional'}
- Key Challenges: ${(profile.challenges || []).join(', ') || 'outreach consistency and quality conversations'}
- Ideal LO Candidate Profiles: ${(profile.partnerTypes || profile.targetPartners || []).join(', ') || '30-70 units, 50%+ purchase'}
- Hobbies & Passions: ${[...(profile.hobbies || []), profile.hobbiesOther].filter(Boolean).join(', ') || (hobbiesList.length ? hobbiesList.join(', ') : 'not specified')}
- Preferred Activities: ${[...(profile.activities || []), ...(richProfile.preferredActivities || [])].filter(Boolean).join(', ') || (activitiesList.length ? activitiesList.join(', ') : 'phone, LinkedIn, Shape')}
- Weekly Prospecting Hours: ${richProfile.hours || 'not specified'}

RECRUITING TARGETS (from form):
- Annual net hires goal: ${inputs.annualNetHires}
- Monthly net hires target: ${inputs.monthlyNetHires}
- Weekly outreach attempts: ${inputs.weeklyOutreach} (Tue-Thu weighted)
- Quality conversations/week: ${inputs.weeklyQualityConvos}
- Executive leadership calls scheduled/week: ${inputs.weeklyExecCalls}
- New LO social connections/week: ${inputs.weeklySocialConnections}
- Active Shape prospects: ${inputs.activeShapeProspects || 'not specified'}
- Warm nurture pipeline size: ${inputs.warmPipelineSize || 'not specified'}
- Preferred recruiting activities: ${activitiesList.length ? activitiesList.join(', ') : 'not specified'}
- Additional notes: ${document.getElementById('plan-notes')?.value || 'none provided'}

REFERENCE FUNNEL BENCHMARKS (Ruoff 2026):
${(metrics.conversions || []).map(c => `- ${c.from} → ${c.to}: ${c.rate}`).join('\n')}

REQUIRED STRUCTURE — exact markdown headings in order:

# Your 2026 Recruiting Power Theme
## Executive Snapshot
## Recruiting Funnel & Conversion Model
## Your 2026 Strategic Focus
## Quarterly Milestones
(Use exactly four subheadings — ### Q1, ### Q2, ### Q3, ### Q4 — each followed by 2-4 bullet points with specific hire/outreach/exec-call targets for that quarter.)
### Q1
### Q2
### Q3
### Q4
## Weekly Rhythm & Scorecard
(Mon–Fri execution: Tue–Thu phone priority, Shape, nurture, social connections. Saturdays and Sundays are rest/family/recharge — optional light prep only, never networking events or heavy outreach.)
## Tactics That Actually Fit You
## Tool Ties — Execute Inside Recruiting Sales Coach
## Your 90-Day Launch Plan
## Personal Fuel & Accountability
## Obstacles & Sustainable Workarounds
## Key Success Metrics
## 12-Month Strategic Calendar

Make it feel like an elite recruiting document — warm, specific, motivating. Output ONLY clean markdown with exact headings above.`;

    // Note: The form also has plan-notes for extra context, hobbiesList, activitiesList already collected.

    // Centralized API call (Phase 0) - no more hardcoded key
    console.log('[weekly-win-plan] About to call Grok API...');

    // Incorporate any pending feedback from the user for this regeneration
    const feedbackNote = (window.lastPlanFeedback && window.lastPlanFeedback.trim()) 
      ? `\n\nADDITIONAL USER FEEDBACK / REQUESTED EDITS FOR THIS VERSION (please specifically incorporate these changes while keeping the required structure and personal tone):\n${window.lastPlanFeedback.trim()}` 
      : '';

    planContent = await window.callGrokAPI(prompt + feedbackNote, {
        temperature: 0.7,
        max_tokens: 4500
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
            friendlyMessage = 'Proxy returned 404. Make sure the proxy is running with <code>bash start-proxy.sh</code> (or start-proxy.bat) in your project folder. API calls use port 3000 by default (HTML can be on 8080).';
        }

        fullPlan = `
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-300 p-6 rounded-2xl">
                <p class="text-red-600 dark:text-red-400 font-bold mb-2">API call failed</p>
                <p class="text-sm text-red-600/80">${friendlyMessage}</p>
                <p class="mt-3 text-sm">Make sure the local Grok proxy is running (use <code>bash start-proxy.sh</code> or <code>start-proxy.bat</code> in your project folder) and you have a valid xai- API key. The proxy typically runs on port 3000 (API calls go there even if you open the HTML from another port like 8080). In browser console run <code>window.testProxyConnection()</code> to diagnose.</p>
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

            // === PREMIUM v3 OUTPUT WRAPPER — Professional strategic document with human soul ===
            // Key metrics dashboard + clean AI content (preserves full compatibility with Copy for Word and Download .doc)
            const planHTML = `
              <div class="bg-white dark:bg-gray-900 border-2 border-[#F15A29]/30 rounded-3xl shadow-2xl p-8 md:p-10 mt-8">
                <!-- Hero header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <div class="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#F15A29] text-white text-xs font-bold tracking-[2px] mb-3">
                      <i class="fas fa-check-circle"></i> 2026 BUSINESS PLAN READY
                    </div>
                    <h3 class="text-3xl md:text-4xl font-bold text-[#002B5C] dark:text-white">Your 2026 Business Plan</h3>
                    <p class="text-gray-600 dark:text-gray-400 mt-1">Strategic. Personal. Built for execution.</p>
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

                <!-- Key Metrics Dashboard (recruiting funnel targets from form) -->
                <div class="mb-8">
                  <div class="text-xs font-bold tracking-[1.5px] text-[#00A89D] mb-3">2026 RECRUITING TARGET SNAPSHOT</div>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                      <div class="text-xs text-gray-500">ANNUAL NET HIRES</div>
                      <div class="text-2xl font-bold text-[#002B5C] dark:text-white mt-1">${inputs.annualNetHires}</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                      <div class="text-xs text-gray-500">MONTHLY NET HIRES</div>
                      <div class="text-2xl font-bold text-[#002B5C] dark:text-white mt-1">${inputs.monthlyNetHires}</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                      <div class="text-xs text-gray-500">OUTREACH / WEEK</div>
                      <div class="text-2xl font-bold text-[#002B5C] dark:text-white mt-1">${inputs.weeklyOutreach}</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                      <div class="text-xs text-gray-500">QUALITY CONVOS / WK</div>
                      <div class="text-2xl font-bold text-[#00A89D] mt-1">${inputs.weeklyQualityConvos}</div>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                      <div class="text-xs text-gray-500">EXEC CALLS SCHED. / WK</div>
                      <div class="text-2xl font-bold text-[#F15A29] mt-1">${inputs.weeklyExecCalls}</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                      <div class="text-xs text-gray-500">NEW SOCIAL CONNECTIONS / WK</div>
                      <div class="text-2xl font-bold text-[#002B5C] dark:text-white mt-1">${inputs.weeklySocialConnections}</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                      <div class="text-xs text-gray-500">WARM PIPELINE SIZE</div>
                      <div class="text-2xl font-bold text-[#002B5C] dark:text-white mt-1">${inputs.warmPipelineSize || '—'}</div>
                    </div>
                  </div>
                </div>

                <!-- The AI-generated content (MUST stay in #plan-preview for Copy + Download to continue working perfectly) -->
                <div id="plan-preview" class="prose prose-lg max-w-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 md:p-10 text-[15px] leading-relaxed">
                  ${contentToShow}
                </div>

                <!-- Feedback / Refine section -->
                <div class="mt-8 p-5 border border-dashed border-[#00A89D]/40 rounded-3xl bg-[#00A89D]/5">
                  <div class="font-semibold text-[#002B5C] dark:text-white mb-1">Not quite right? Give feedback for a better version.</div>
                  <p class="text-xs text-gray-500 mb-2">Be specific for best results. Good examples:<br>
                    • "Add more LinkedIn sourcing and connection outreach blocks"<br>
                    • "Weight Tuesday–Thursday phone blocks heavier — I'm stronger on calls"<br>
                    • "Make Q1 more aggressive on executive leadership call volume"<br>
                    • "Emphasize Shape pipeline review and B-tier nurture touches"<br>
                    • "Include more personal brand content tied to my hobbies"
                  </p>
                  <textarea id="plan-feedback-input" class="w-full text-sm p-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900" rows="2" placeholder="Your requested changes or focus areas..."></textarea>
                  <div class="mt-2 flex gap-2">
                    <button onclick="applyPlanFeedbackAndRegenerate()" class="px-4 py-1.5 text-sm rounded-2xl bg-[#00A89D] text-white font-medium flex items-center gap-2 hover:bg-[#008F85] transition">
                      <i class="fas fa-redo"></i> <span>Apply feedback &amp; regenerate</span>
                    </button>
                    <button onclick="document.getElementById('plan-feedback-input').value=''; if(window.lastPlanFeedback) window.lastPlanFeedback='';" class="px-3 py-1.5 text-sm rounded-2xl border border-gray-300 text-gray-600 hover:bg-gray-100">Clear</button>
                  </div>
                </div>

                <!-- Bring This Plan to Life — Premium Execution Hub -->
                <div class="mt-10 pt-8 border-t-2 border-dashed border-[#00A89D]/30">
                  <div class="flex items-center gap-3 mb-5">
                    <div class="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#00A89D] to-[#F15A29] flex items-center justify-center text-white">
                      <i class="fas fa-rocket"></i>
                    </div>
                    <div>
                      <div class="font-bold text-xl text-[#002B5C] dark:text-white">Bring This Plan to Life</div>
                      <div class="text-sm text-gray-500">Your entire Sales Coach toolkit was built for exactly these tactics. Turn strategy into action in one click.</div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div onclick="window.showSection('weekly-win-plan');" class="group cursor-pointer bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#00A89D] hover:-translate-y-0.5 rounded-3xl p-5 transition-all hover:shadow-xl">
                      <div class="flex items-start gap-3">
                        <i class="fas fa-fire text-2xl text-[#F15A29] mt-0.5"></i>
                        <div class="flex-1">
                          <div class="font-bold group-hover:text-[#00A89D] text-[15px]">Turn your quarterly milestones into Weekly Wins</div>
                          <div class="text-xs text-gray-500 mt-1.5 leading-snug">Open Weekly Recruiting Plan. Drop one of your Q1 milestones directly into a time block and build the precise prospecting and partner activities the plan calls for.</div>
                          <div class="mt-3 text-[11px] text-[#00A89D] font-semibold flex items-center">Execute this week <i class="fas fa-arrow-right ml-1.5 text-xs"></i></div>
                        </div>
                      </div>
                    </div>

                    <div onclick="window.showSection('social-post');" class="group cursor-pointer bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#00A89D] hover:-translate-y-0.5 rounded-3xl p-5 transition-all hover:shadow-xl">
                      <div class="flex items-start gap-3">
                        <i class="fas fa-share-alt text-2xl text-[#F15A29] mt-0.5"></i>
                        <div class="flex-1">
                          <div class="font-bold group-hover:text-[#00A89D] text-[15px]">Turn your Power Theme + hobbies into content</div>
                          <div class="text-xs text-gray-500 mt-1.5 leading-snug">Open Social Post Creator. Use angles from your Power Theme and hobbies for authentic LO-facing posts. Save 2–3 pieces for your 30-day calendar.</div>
                          <div class="mt-3 text-[11px] text-[#00A89D] font-semibold flex items-center">Start posting this week <i class="fas fa-arrow-right ml-1.5 text-xs"></i></div>
                        </div>
                      </div>
                    </div>

                    <div onclick="window.showSection('recruiting-playbook');" class="group cursor-pointer bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#00A89D] hover:-translate-y-0.5 rounded-3xl p-5 transition-all hover:shadow-xl">
                      <div class="flex items-start gap-3">
                        <i class="fas fa-book-open text-2xl text-[#F15A29] mt-0.5"></i>
                        <div class="flex-1">
                          <div class="font-bold group-hover:text-[#00A89D] text-[15px]">Run the playbook for your hire goal</div>
                          <div class="text-xs text-gray-500 mt-1.5 leading-snug">Open Recruiting Playbook. Use objection handlers, funnel math, and scripts aligned to your quarterly milestones.</div>
                          <div class="mt-3 text-[11px] text-[#00A89D] font-semibold flex items-center">Open the playbook now <i class="fas fa-arrow-right ml-1.5 text-xs"></i></div>
                        </div>
                      </div>
                    </div>

                    <div onclick="window.showSection('database');" class="group cursor-pointer bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#00A89D] hover:-translate-y-0.5 rounded-3xl p-5 transition-all hover:shadow-xl">
                      <div class="flex items-start gap-3">
                        <i class="fas fa-layer-group text-2xl text-[#F15A29] mt-0.5"></i>
                        <div class="flex-1">
                          <div class="font-bold group-hover:text-[#00A89D] text-[15px]">Nurture the pipeline your plan depends on</div>
                          <div class="text-xs text-gray-500 mt-1.5 leading-snug">Open Prospect Nurturing. Run A/B/C tier cadences and warm touches for Shape prospects your plan calls for this quarter.</div>
                          <div class="mt-3 text-[11px] text-[#00A89D] font-semibold flex items-center">Open nurturing now <i class="fas fa-arrow-right ml-1.5 text-xs"></i></div>
                        </div>
                      </div>
                    </div>

                    <div onclick="window.showSection('books');" class="group cursor-pointer bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#00A89D] hover:-translate-y-0.5 rounded-3xl p-5 transition-all hover:shadow-xl">
                      <div class="flex items-start gap-3">
                        <i class="fas fa-book text-2xl text-[#F15A29] mt-0.5"></i>
                        <div class="flex-1">
                          <div class="font-bold group-hover:text-[#00A89D] text-[15px]">The one book that will move the needle for you</div>
                          <div class="text-xs text-gray-500 mt-1.5 leading-snug">Open Book Vault. Your plan recommends the single best title for your specific challenge or goal. Save the key takeaway and make it your next Weekly Win focus.</div>
                          <div class="mt-3 text-[11px] text-[#00A89D] font-semibold flex items-center">Browse the vault <i class="fas fa-arrow-right ml-1.5 text-xs"></i></div>
                        </div>
                      </div>
                    </div>

                    <div onclick="window.showSection('mindset-motivation');" class="group cursor-pointer bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#00A89D] hover:-translate-y-0.5 rounded-3xl p-5 transition-all hover:shadow-xl">
                      <div class="flex items-start gap-3">
                        <i class="fas fa-brain text-2xl text-[#F15A29] mt-0.5"></i>
                        <div class="flex-1">
                          <div class="font-bold group-hover:text-[#00A89D] text-[15px]">Your personal mindset anchor for tough days</div>
                          <div class="text-xs text-gray-500 mt-1.5 leading-snug">Open Mindset Lab. Save the exact principle your plan recommends for your rough days. Drop it into your Weekly Win mindset block or daily Random.</div>
                          <div class="mt-3 text-[11px] text-[#00A89D] font-semibold flex items-center">Get your reframe <i class="fas fa-arrow-right ml-1.5 text-xs"></i></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-6 text-center">
                    <button onclick="window.showSection('weekly-win-plan'); document.getElementById('recruiting-wwp-customize')?.scrollIntoView({behavior:'smooth',block:'start'});" class="inline-flex items-center gap-2 text-sm px-6 py-2.5 rounded-2xl border-2 border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition font-semibold">
                      <i class="fas fa-clock"></i> 
                      <span>Also: Tune your weekly hours and outreach targets in the Weekly Recruiting Plan</span>
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
            if (typeof window.ToolBridges?.saveAnnualPlanContext === 'function' && planContent) {
                window.ToolBridges.saveAnnualPlanContext(planContent, { fromApi: true });
            }
        }
    }
}

function restoreSavedWeeklyPlan() {
    const container = document.getElementById('weekly-tasks-container');
    if (!container) return;

    migrateLegacyWeeklyStorage();

    if (savedWeeklyPlan && savedWeeklyPlan.days) {
        savedWeeklyPlan.days = normalizeDaysToV2(savedWeeklyPlan.days);
        currentWeeklyPlanMeta = {
          summary: savedWeeklyPlan.summary || '',
          totalHours: savedWeeklyPlan.totalHours || null
        };
        const resultsWrapper = document.getElementById('weekly-plan-results');
        if (resultsWrapper) resultsWrapper.classList.remove('hidden');

        const generateWrapper = document.getElementById('generate-plan-wrapper');
        if (generateWrapper) generateWrapper.classList.add('hidden');

        const pregen = document.getElementById('weekly-pregen-guidance');
        if (pregen) pregen.classList.add('hidden');

        renderWeeklyTiles(savedWeeklyPlan.days, container);
        updateWeeklyResultsHeader();
        ensureWeeklyPlanFeedbackUI();
        // Ensure progress UI is in sync on restore
        const checked = JSON.parse(localStorage.getItem('weeklyCheckedTasks') || '[]');
        updatePlanProgress(savedWeeklyPlan.days, checked);
    } else {
        // Show helpful empty state on first visit
        showWeeklyPlanEmptyState(container);

        // Defensively ensure the rich pre-gen guidance + generate wrapper are visible
        // (prevents any stale 'hidden' state from prior saves or partial clears, and makes the
        // "top of the section before a plan is generated" always look rich as designed).
        const generateWrapper = document.getElementById('generate-plan-wrapper');
        if (generateWrapper) generateWrapper.classList.remove('hidden');

        const pregen = document.getElementById('weekly-pregen-guidance');
        if (pregen) pregen.classList.remove('hidden');

        const resultsWrapper = document.getElementById('weekly-plan-results');
        if (resultsWrapper) resultsWrapper.classList.add('hidden');
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

        if (!window.ToolBridges?.loadAnnualPlanContext?.()) {
            setTimeout(() => window.ToolBridges?.rebuildAnnualContextFromDom?.(), 100);
        }

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
// UNIFIED WEEKLY EXECUTION (v2) — time blocks + daily tasks in one plan
// Merges former Prospecting Time Blocks + Weekly Recruiting Plan (Option A)
// =====================================================
const WEEKLY_PLAN_VERSION = 2;
let currentWeeklyPlanMeta = { summary: '', totalHours: null };
const weeklyOpenTimeEditors = new Set();

function weeklyTimeEditorKey(dayName, blockIndex, taskIndex) {
  if (taskIndex !== undefined && taskIndex !== null && !Number.isNaN(taskIndex)) {
    return `${dayName}::block::${blockIndex}::task::${taskIndex}`;
  }
  return `${dayName}::block::${blockIndex}`;
}

function isWeeklyTimeEditorOpen(key) {
  return weeklyOpenTimeEditors.has(key);
}

window.toggleWeeklyTimeEditor = function(btn) {
  const key = btn && btn.dataset ? btn.dataset.editorKey : '';
  if (!key) return;
  if (weeklyOpenTimeEditors.has(key)) weeklyOpenTimeEditors.delete(key);
  else weeklyOpenTimeEditors.add(key);
  const container = document.getElementById('weekly-tasks-container');
  if (container && currentWeeklyDays) {
    renderWeeklyTiles(currentWeeklyDays, container);
    if (weeklyOpenTimeEditors.has(key)) {
      setTimeout(() => {
        const panel = container.querySelector(`[data-editor-panel="${key}"]`);
        const input = panel && panel.querySelector('input[type="time"]');
        if (input) input.focus();
      }, 50);
    }
  }
};

function renderWeeklyBlockTimeUI(dayName, blockIndex, block, timeInputs) {
  const editorKey = weeklyTimeEditorKey(dayName, blockIndex);
  const displayTime = block.time || 'Flexible';
  if (!timeInputs.editable) {
    return `<div class="font-bold text-sm tabular-nums text-[#002B5C] dark:text-white">${displayTime}</div>`;
  }
  const isOpen = isWeeklyTimeEditorOpen(editorKey);
  const editorPanel = isOpen
    ? `<div class="w-full basis-full flex items-center gap-1.5 flex-wrap wwp-time-editor mt-1.5" data-editor-panel="${editorKey}" title="Adjust times before calendar export">
        <input type="time" class="wwp-block-time-start text-xs px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-[#002B5C] dark:text-white tabular-nums"
               value="${timeInputs.start}" data-day="${dayName}" data-block-index="${blockIndex}" aria-label="Block start time">
        <span class="text-xs text-gray-400">–</span>
        <input type="time" class="wwp-block-time-end text-xs px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-[#002B5C] dark:text-white tabular-nums"
               value="${timeInputs.end}" data-day="${dayName}" data-block-index="${blockIndex}" aria-label="Block end time">
       </div>`
    : '';
  return `<div class="flex items-center gap-2 flex-wrap">
      <div class="font-bold text-sm tabular-nums text-[#002B5C] dark:text-white">${displayTime}</div>
      <button type="button" class="wwp-time-edit-btn text-[10px] px-1.5 py-0.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 hover:border-[#00A89D] hover:text-[#00A89D] transition"
              data-editor-key="${editorKey}" onclick="if(typeof window.toggleWeeklyTimeEditor==='function')window.toggleWeeklyTimeEditor(this)"
              aria-label="Edit block time" title="Edit time"><i class="fas fa-pen text-[9px]"></i></button>
      ${editorPanel}
    </div>`;
}

function renderWeeklyCustomTaskTimeUI(dayName, blockIndex, taskIndex, task, customTimeInputs) {
  const editorKey = weeklyTimeEditorKey(dayName, blockIndex, taskIndex);
  const isOpen = isWeeklyTimeEditorOpen(editorKey);
  const hasTime = !!(task.time && customTimeInputs && customTimeInputs.hasValue);
  const scheduleLabel = hasTime
    ? `<span class="text-[10px] text-gray-500 dark:text-gray-400 tabular-nums">${task.time}</span>`
    : '';
  const editorPanel = isOpen
    ? `<div class="w-full flex items-center gap-1.5 flex-wrap wwp-time-editor mt-1" data-editor-panel="${editorKey}" title="Optional — adds this task to calendar export">
        <input type="time" class="wwp-task-time-start text-xs px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-[#002B5C] dark:text-white tabular-nums"
               ${customTimeInputs && customTimeInputs.start ? `value="${customTimeInputs.start}"` : ''}
               data-day="${dayName}" data-block-index="${blockIndex}" data-task-index="${taskIndex}" aria-label="Custom task start time">
        <span class="text-xs text-gray-400">–</span>
        <input type="time" class="wwp-task-time-end text-xs px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-[#002B5C] dark:text-white tabular-nums"
               ${customTimeInputs && customTimeInputs.end ? `value="${customTimeInputs.end}"` : ''}
               data-day="${dayName}" data-block-index="${blockIndex}" data-task-index="${taskIndex}" aria-label="Custom task end time">
       </div>`
    : '';
  return `<div class="mt-2 ml-5 flex items-center gap-2 flex-wrap">
      ${scheduleLabel}
      <button type="button" class="wwp-time-edit-btn text-[10px] px-1.5 py-0.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 hover:border-[#00A89D] hover:text-[#00A89D] transition"
              data-editor-key="${editorKey}" onclick="if(typeof window.toggleWeeklyTimeEditor==='function')window.toggleWeeklyTimeEditor(this)"
              aria-label="${hasTime ? 'Edit task time' : 'Add task time'}" title="${hasTime ? 'Edit time' : 'Add time'}">
        <i class="fas ${hasTime ? 'fa-pen' : 'fa-clock'} text-[9px]"></i>
      </button>
      ${editorPanel}
    </div>`;
}

function getWeeklyCustomizePrefs() {
  const hours = parseInt(document.getElementById('wwp-hours')?.value) || 15;
  const weaveHobbies = document.getElementById('wwp-weave-hobbies')?.checked !== false;
  const focusAreas = [];
  const emphasisMap = [
    ['wwp-emphasis-phone', 'Phone outreach (Tue–Thu priority)'],
    ['wwp-emphasis-linkedin', 'LinkedIn & Facebook messaging'],
    ['wwp-emphasis-shape', 'Shape sourcing review & logging'],
    ['wwp-emphasis-nurture', 'Long-term nurture touches'],
    ['wwp-emphasis-social', 'Social connection building']
  ];
  emphasisMap.forEach(([id, label]) => {
    const el = document.getElementById(id);
    if (el && el.checked) focusAreas.push(label);
  });
  return { hours, weaveHobbies, focusAreas };
}

function getAllTasksFromDays(days) {
  const tasks = [];
  (days || []).forEach(day => {
    (day.blocks || []).forEach(block => {
      (block.tasks || []).forEach(t => tasks.push({ day: day.day, block, task: t }));
    });
    // Legacy v1 flat tasks
    (day.tasks || []).forEach(t => tasks.push({ day: day.day, block: null, task: t }));
  });
  return tasks;
}

function countTasksInDays(days) {
  return getAllTasksFromDays(days).length;
}

function normalizeDaysToV2(days) {
  if (!days || !Array.isArray(days)) return [];
  return days.map(day => {
    if (day.blocks && Array.isArray(day.blocks)) {
      return {
        day: day.day,
        blocks: day.blocks.map(b => ({
          time: b.time || 'Flexible',
          focus: b.focus || '',
          why: b.why || '',
          tasks: (b.tasks && b.tasks.length)
            ? b.tasks
            : (b.activity ? [{ task: b.activity, tip: b.why || '' }] : [])
        }))
      };
    }
    // v1: flat tasks per day → single flexible block
    return {
      day: day.day,
      blocks: [{
        time: 'Flexible',
        focus: 'General',
        why: 'Protected prospecting window',
        tasks: day.tasks || []
      }]
    };
  });
}

function migrateLegacyWeeklyStorage() {
  let plan = null;
  try {
    plan = JSON.parse(localStorage.getItem('savedWeeklyPlan') || 'null');
  } catch (e) {}

  const ptbRaw = localStorage.getItem('savedProspectingTimeBlocks');
  if (!plan && ptbRaw) {
    try {
      const ptb = JSON.parse(ptbRaw);
      plan = {
        version: WEEKLY_PLAN_VERSION,
        summary: ptb.summary || '',
        totalHours: ptb.totalHours || null,
        days: normalizeDaysToV2(ptb.days)
      };
      localStorage.setItem('savedWeeklyPlan', JSON.stringify(plan));
      localStorage.removeItem('savedProspectingTimeBlocks');
      const ptbChecked = localStorage.getItem('ptbCheckedBlocks');
      if (ptbChecked && !localStorage.getItem('weeklyCheckedTasks')) {
        localStorage.setItem('weeklyCheckedTasks', ptbChecked);
      }
    } catch (e) {}
  }

  if (plan && plan.days) {
    if (!plan.version || plan.version < WEEKLY_PLAN_VERSION) {
      plan = {
        version: WEEKLY_PLAN_VERSION,
        summary: plan.summary || '',
        totalHours: plan.totalHours || null,
        days: normalizeDaysToV2(plan.days)
      };
      localStorage.setItem('savedWeeklyPlan', JSON.stringify(plan));
    }
    savedWeeklyPlan = plan;
  }
}

function updateWeeklyCustomizeDisplays() {
  const p = getCentralProfile();
  const goalEl = document.getElementById('wwp-goal-display');
  const hoursEl = document.getElementById('wwp-hours-display');
  const focusEl = document.getElementById('wwp-focus-display');
  if (goalEl) goalEl.textContent = p.monthlyUnits || p.monthlyGoal || 8;
  if (hoursEl) hoursEl.textContent = p.hours || '15–20';
  if (focusEl) focusEl.textContent = p.focus || 'Balanced';
  updateWeeklyLiveSummary();
}

function updateWeeklyLiveSummary() {
  const summaryEl = document.getElementById('wwp-live-summary');
  if (!summaryEl) return;
  const { hours, weaveHobbies, focusAreas } = getWeeklyCustomizePrefs();
  const focusCount = focusAreas.length || 1;
  const estBlocks = Math.max(8, Math.round(hours * 1.1));
  let text = `~${estBlocks} protected blocks • ${focusCount} focus area${focusCount > 1 ? 's' : ''}`;
  if (weaveHobbies) text += ' • hobbies woven in';
  summaryEl.textContent = text;
}

function wireWeeklyCustomizeControls() {
  const slider = document.getElementById('wwp-hours');
  const hoursDisplay = document.getElementById('wwp-hours-value');
  if (slider && hoursDisplay) {
    hoursDisplay.textContent = slider.value;
    slider.addEventListener('input', () => {
      hoursDisplay.textContent = slider.value;
      updateWeeklyLiveSummary();
    });
  }
  ['wwp-emphasis-phone', 'wwp-emphasis-linkedin', 'wwp-emphasis-shape',
    'wwp-emphasis-nurture', 'wwp-emphasis-social', 'wwp-weave-hobbies'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', updateWeeklyLiveSummary);
  });
  updateWeeklyCustomizeDisplays();
}

function buildUnifiedWeeklyPrompt() {
  const p = getCentralProfile();
  const eff = getEffectiveSetup();
  const { hours, weaveHobbies, focusAreas } = getWeeklyCustomizePrefs();
  const metrics = window.RECRUITING_METRICS?.weekly || {};

  const annualBridge = (typeof window.ToolBridges?.getAnnualPlanPromptSlice === 'function')
    ? window.ToolBridges.getAnnualPlanPromptSlice()
    : '';

  return `You are an expert Ruoff Mortgage recruiting sales coach. Create a realistic weekly execution plan for a loan officer recruiter.

User Profile:
- Name: ${p.name || eff.name || ''}
- Email: ${p.email || ''}
- Monthly net hires goal: ${p.monthlyUnits || p.monthlyGoal || eff.monthlyUnits || '5-7'}
- Recruiting focus: ${p.focus || eff.focus || ''}
- Weekly prospecting hours available: ${p.hours || eff.hours || ''}
- Territory / market: ${p.localArea || p.market || ''}
- Hobbies/Passions: ${[...(p.hobbies || []), p.hobbiesOther].filter(Boolean).join(', ') || [...(eff.hobbies || []), eff.hobbiesOther].filter(Boolean).join(', ') || 'none specified'}
- Preferred activities: ${(p.activities || p.preferredActivities || eff.preferredActivities || []).join(', ') || 'phone, LinkedIn, Shape review'}
- Target candidate profiles: ${(p.targetPartners || p.partners || []).join(', ') || '30-70 units, 50%+ purchase'}
- This week they want to block approximately ${hours} hours total.

Emphasis this week: ${focusAreas.length ? focusAreas.join(', ') : 'balanced phone, social, Shape, and nurture'}
${weaveHobbies ? 'Naturally weave in their hobbies where it makes sense for warmer outreach.' : ''}

Weekly recruiting metrics (coach toward these):
- Outreach attempts: ~${metrics.outreachAttempts || 270}/week (heavier Tue-Wed-Thu)
- Quality conversations: ${metrics.qualityConversations?.min || 24}-${metrics.qualityConversations?.max || 25}
- Executive leadership calls scheduled: ${metrics.executiveCallsScheduled?.min || 4.8}-${metrics.executiveCallsScheduled?.max || 5.1}
${annualBridge}

${typeof window.getWeekendPlanRules === 'function' ? window.getWeekendPlanRules() : ''}

Create a practical, motivating 7-day (Monday through Sunday) execution plan that combines PROTECTED TIME BLOCKS with SPECIFIC RECRUITING TASKS inside each block.

Rules:
- Respect their total weekly hours (${hours}) — count only Mon–Fri toward the hours target; weekend blocks are optional and do not add to the total.
- Use realistic time slots with AM or PM (e.g. "9:00 AM - 9:45 AM").
- 2-5 blocks per day Mon–Fri; Tue-Thu should have the heaviest phone outreach. Saturday and Sunday: 0–1 optional light block each, or empty/rest days. Never schedule networking events, executive calls, or heavy outreach on weekends.
- Each block gets 1-3 specific tasks: Shape review, phone blocks, LinkedIn/Facebook outreach, quality conversation goals, leadership call prep, nurture touches (no pitch), Shape logging.
- Never assign LO borrower tasks, realtor pop-bys, or rate pitches.
- Include block "focus" category and optional "why".
- Include a short practical tip on each task.

Return ONLY valid JSON in this exact format:
{
  "summary": "One sentence overview of the week's recruiting strategy",
  "totalHours": ${hours},
  "days": [
    {
      "day": "Monday",
      "blocks": [
        {
          "time": "9:00 - 9:45 AM",
          "focus": "Shape Review",
          "why": "Start the week knowing who to call",
          "tasks": [
            {"task": "Specific actionable recruiting task here", "tip": "Short practical tip"}
          ]
        }
      ]
    }
  ]
}`;
}

function buildWeeklyFeedbackPrompt(feedback) {
  persistCurrentWeeklyPlan();
  const planSnapshot = savedWeeklyPlan || {
    summary: currentWeeklyPlanMeta.summary || '',
    totalHours: currentWeeklyPlanMeta.totalHours || getWeeklyCustomizePrefs().hours,
    days: currentWeeklyDays || []
  };
  const { hours, weaveHobbies, focusAreas } = getWeeklyCustomizePrefs();
  const defaultFocus = [
    'Phone outreach (Tue–Thu priority)',
    'LinkedIn & Facebook messaging',
    'Shape sourcing review & logging',
    'Long-term nurture touches',
    'Social connection building'
  ];
  const prefsContext = `Weekly hours target: ~${hours}. Focus areas: ${(focusAreas.length ? focusAreas : defaultFocus).join(', ')}. Weave hobbies: ${weaveHobbies ? 'yes' : 'no'}.`;

  const annualBridge = (typeof window.ToolBridges?.getAnnualPlanPromptSlice === 'function')
    ? window.ToolBridges.getAnnualPlanPromptSlice()
    : '';

  return `You are an expert Ruoff recruiting coach editing an existing Weekly Recruiting Plan.

${prefsContext}
${annualBridge}

CURRENT PLAN (JSON — preserve structure and anything the user did not ask to change):
${JSON.stringify(planSnapshot, null, 2)}

USER FEEDBACK — apply these requested changes intelligently:
${feedback.trim()}

Rules:
- Return ONLY valid JSON in the exact same schema (summary, totalHours, days with blocks/tasks).
- Tasks must stay recruiter-focused: Shape, phone blocks, LinkedIn/Facebook, quality conversations, leadership calls, nurture — never borrower or realtor tasks.
- Keep realistic times with AM/PM on every block.
- Respect total weekly hours (~${hours}) unless feedback explicitly changes that.
- ${typeof window.getWeekendPlanRules === 'function' ? window.getWeekendPlanRules() : 'Keep Saturday and Sunday light — rest, family, optional prep only.'}`;
}

function getWeeklyPlanFeedbackInnerHTML() {
  return `
    <div class="font-semibold text-[#002B5C] dark:text-white mb-1 flex items-center gap-2">
      <i class="fas fa-comment-dots text-[#00A89D]"></i>
      Refine this plan before you export
      <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F15A29]/15 text-[#F15A29]">Weekly Recruiting Plan</span>
    </div>
    <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
      Tweak focus, timing, or tasks — then regenerate. Your time edits and custom tasks are sent as context so the AI adjusts instead of starting over blind.
      <span class="block mt-1 text-gray-600 dark:text-gray-300">Examples: “More phone blocks Tuesday–Thursday” • “Lighten Monday — only 1 block” • “Keep Saturday/Sunday fully off” • “Add LinkedIn nurture touches Wednesday”</span>
    </p>
    <textarea id="weekly-plan-feedback-input" rows="3" class="w-full text-sm p-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-[#00A89D]/50" placeholder="What should change in this week's plan?"></textarea>
    <div class="mt-3 flex flex-wrap gap-2 items-center">
      <button type="button" id="weekly-plan-feedback-apply-btn" class="px-4 py-2 text-sm rounded-2xl bg-[#00A89D] text-white font-medium flex items-center gap-2 hover:bg-[#008F85] transition">
        <i class="fas fa-redo"></i>
        <span>Apply feedback &amp; regenerate</span>
      </button>
      <button type="button" id="weekly-plan-feedback-clear-btn" class="px-3 py-2 text-sm rounded-2xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition">Clear</button>
      <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">Then export to calendar or copy when it looks right.</span>
    </div>`;
}

/** Ensures feedback UI exists and is visible whenever a weekly plan is shown (handles stale cached index.html). */
function ensureWeeklyPlanFeedbackUI() {
  const results = document.getElementById('weekly-plan-results');
  if (!results || results.classList.contains('hidden')) return;
  if (!currentWeeklyDays || !currentWeeklyDays.length) return;

  let section = document.getElementById('weekly-plan-feedback-section');
  const tasksContainer = document.getElementById('weekly-tasks-container');
  const tasksCard = tasksContainer?.parentElement;
  if (!section) {
    section = document.createElement('div');
    section.id = 'weekly-plan-feedback-section';
  }
  // Below the weekly calendar grid, inside the results card (matches realtor layout)
  if (tasksContainer?.parentNode) {
    const anchor = tasksContainer.nextSibling;
    if (section.parentNode !== tasksContainer.parentNode || section.previousSibling !== tasksContainer) {
      tasksContainer.parentNode.insertBefore(section, anchor);
    }
  } else if (!section.parentNode) {
    results.appendChild(section);
  }

  section.className = 'mt-8 p-5 border border-dashed border-[#00A89D]/40 rounded-3xl bg-[#00A89D]/5';
  section.classList.remove('hidden');
  section.hidden = false;
  section.style.removeProperty('display');
  section.setAttribute('data-wwp-feedback', 'v3');

  if (!section.querySelector('#weekly-plan-feedback-input')) {
    section.innerHTML = getWeeklyPlanFeedbackInnerHTML();
    const applyBtn = section.querySelector('#weekly-plan-feedback-apply-btn');
    const clearBtn = section.querySelector('#weekly-plan-feedback-clear-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        if (typeof window.applyWeeklyPlanFeedbackAndRegenerate === 'function') {
          window.applyWeeklyPlanFeedbackAndRegenerate();
        }
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const input = document.getElementById('weekly-plan-feedback-input');
        if (input) input.value = '';
      });
    }
  }
}

function updateWeeklyResultsHeader() {
  const summaryEl = document.getElementById('weekly-plan-summary');
  const hoursEl = document.getElementById('weekly-plan-hours');
  window.currentWeeklyPlanMeta = currentWeeklyPlanMeta;
  if (summaryEl) summaryEl.textContent = currentWeeklyPlanMeta.summary || 'Your protected time + daily execution plan.';
  if (hoursEl && currentWeeklyPlanMeta.totalHours) {
    hoursEl.textContent = `${currentWeeklyPlanMeta.totalHours} hrs protected`;
  } else if (hoursEl) {
    hoursEl.textContent = '';
  }
}

// ICS export (from former Prospecting Time Blocks)
function exportWeeklyPlanToICS() {
  if (!currentWeeklyDays || !currentWeeklyDays.length) {
    alert('No plan available to export.');
    return;
  }
  const ics = generateWeeklyICS(currentWeeklyDays);
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Weekly-Win-Plan.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function generateWeeklyICS(days) {
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//Sales Coach//Weekly Recruiting Plan//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:Weekly Recruiting Plan',
    'X-WR-CALDESC:Protected prospecting blocks from your Weekly Recruiting Plan'
  ];
  const baseDate = getMondayOfCurrentWeek();
  days.forEach((day, dayIndex) => {
    const eventDate = new Date(baseDate);
    eventDate.setDate(baseDate.getDate() + dayIndex);
    (day.blocks || []).forEach(block => {
      const scheduledCustom = (block.tasks || []).filter((t) => t.isCustom && t.time);
      const blockTasks = (block.tasks || []).filter((t) => !(t.isCustom && t.time));
      const timeRange = parseWeeklyTimeRange(block.time);
      if (timeRange) {
        const start = new Date(eventDate);
        start.setHours(timeRange.startHour, timeRange.startMinute, 0);
        const end = new Date(eventDate);
        end.setHours(timeRange.endHour, timeRange.endMinute, 0);
        const taskSummary = blockTasks.map((t) => t.task).join('; ');
        const summary = taskSummary || block.focus || 'Prospecting block';
        lines.push('BEGIN:VEVENT');
        lines.push(`UID:wwp-${Date.now()}-${Math.random().toString(36).slice(2)}@salescoach`);
        lines.push(`DTSTART:${formatWeeklyICSDate(start)}`);
        lines.push(`DTEND:${formatWeeklyICSDate(end)}`);
        lines.push(`SUMMARY:${escapeWeeklyICSText(summary)}`);
        if (block.why) lines.push(`DESCRIPTION:${escapeWeeklyICSText(block.why)}`);
        lines.push('END:VEVENT');
      }
      scheduledCustom.forEach((task) => {
        const taskRange = parseWeeklyTimeRange(task.time);
        if (!taskRange) return;
        const start = new Date(eventDate);
        start.setHours(taskRange.startHour, taskRange.startMinute, 0);
        const end = new Date(eventDate);
        end.setHours(taskRange.endHour, taskRange.endMinute, 0);
        lines.push('BEGIN:VEVENT');
        lines.push(`UID:wwp-custom-${Date.now()}-${Math.random().toString(36).slice(2)}@salescoach`);
        lines.push(`DTSTART:${formatWeeklyICSDate(start)}`);
        lines.push(`DTEND:${formatWeeklyICSDate(end)}`);
        lines.push(`SUMMARY:${escapeWeeklyICSText(task.task)}`);
        if (task.tip) lines.push(`DESCRIPTION:${escapeWeeklyICSText(task.tip)}`);
        lines.push('END:VEVENT');
      });
    });
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function getMondayOfCurrentWeek() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function parseWeeklyTimeRange(timeStr) {
  if (!timeStr || timeStr === 'Flexible') return null;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[-–]\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;
  let [, h1, m1, ap1, h2, m2, ap2] = match;
  let startHour = parseInt(h1);
  let endHour = parseInt(h2);
  if (!ap1 && ap2) ap1 = ap2;
  if (!ap2 && ap1) ap2 = ap1;
  if (ap1) {
    const ap = ap1.toUpperCase();
    if (ap === 'PM' && startHour !== 12) startHour += 12;
    if (ap === 'AM' && startHour === 12) startHour = 0;
  }
  if (ap2) {
    const ap = ap2.toUpperCase();
    if (ap === 'PM' && endHour !== 12) endHour += 12;
    if (ap === 'AM' && endHour === 12) endHour = 0;
  }
  return { startHour, startMinute: parseInt(m1), endHour, endMinute: parseInt(m2) };
}

function weeklyTimeToInputValue(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function weeklyInputValueToParts(value) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return { hour: h, minute: m };
}

function weeklyFormatTime12h(hour, minute) {
  const ap = hour >= 12 ? 'PM' : 'AM';
  let h = hour % 12;
  if (h === 0) h = 12;
  return `${h}:${String(minute).padStart(2, '0')} ${ap}`;
}

function weeklyFormatBlockTimeRange(startParts, endParts) {
  if (!startParts || !endParts) return 'Flexible';
  return `${weeklyFormatTime12h(startParts.hour, startParts.minute)} - ${weeklyFormatTime12h(endParts.hour, endParts.minute)}`;
}

function weeklyPartsToMinutes(parts) {
  return parts.hour * 60 + parts.minute;
}

function weeklyMinutesToParts(totalMinutes) {
  const capped = Math.max(0, Math.min(totalMinutes, 23 * 60 + 59));
  return { hour: Math.floor(capped / 60), minute: capped % 60 };
}

function weeklyMinutesToInputValue(totalMinutes) {
  const parts = weeklyMinutesToParts(totalMinutes);
  return weeklyTimeToInputValue(parts.hour, parts.minute);
}

function weeklyGetDurationMinutes(startValue, endValue, fallback = 30) {
  const startParts = weeklyInputValueToParts(startValue);
  const endParts = weeklyInputValueToParts(endValue);
  if (!startParts || !endParts) return fallback;
  let diff = weeklyPartsToMinutes(endParts) - weeklyPartsToMinutes(startParts);
  if (diff <= 0) diff = fallback;
  return diff;
}

function weeklyShiftEndFromStart(startInput, endInput) {
  if (!startInput || !endInput) return;
  const duration = parseInt(startInput.dataset.durationMinutes, 10)
    || weeklyGetDurationMinutes(startInput.value, endInput.value);
  const startParts = weeklyInputValueToParts(startInput.value);
  if (!startParts) return;
  endInput.value = weeklyMinutesToInputValue(weeklyPartsToMinutes(startParts) + duration);
  startInput.dataset.durationMinutes = String(duration);
}

function weeklySyncDurationDataset(startInput, endInput) {
  if (!startInput || !endInput) return;
  startInput.dataset.durationMinutes = String(weeklyGetDurationMinutes(startInput.value, endInput.value));
}

function weeklyBlockTimeToInputs(timeStr) {
  const parsed = parseWeeklyTimeRange(timeStr);
  if (!parsed) return { start: '', end: '', editable: false, hasValue: false };
  return {
    start: weeklyTimeToInputValue(parsed.startHour, parsed.startMinute),
    end: weeklyTimeToInputValue(parsed.endHour, parsed.endMinute),
    editable: true,
    hasValue: true
  };
}

function persistCurrentWeeklyPlan() {
  if (!currentWeeklyDays || !currentWeeklyDays.length) return;
  savedWeeklyPlan = {
    ...(savedWeeklyPlan || {}),
    version: WEEKLY_PLAN_VERSION,
    days: currentWeeklyDays,
    summary: (savedWeeklyPlan && savedWeeklyPlan.summary) || '',
    totalHours: (savedWeeklyPlan && savedWeeklyPlan.totalHours) || null
  };
  localStorage.setItem('savedWeeklyPlan', JSON.stringify(savedWeeklyPlan));
}

function migrateWeeklyCheckedTasksOnTimeChange(dayName, oldTime, newTime) {
  if (!oldTime || oldTime === newTime) return;
  let current = [];
  try { current = JSON.parse(localStorage.getItem('weeklyCheckedTasks') || '[]'); } catch (e) {}
  const prefix = `${dayName}::${oldTime}::`;
  const migrated = current.map((key) => (key.startsWith(prefix)
    ? `${dayName}::${newTime}::${key.slice(prefix.length)}`
    : key));
  localStorage.setItem('weeklyCheckedTasks', JSON.stringify(migrated));
}

function updateWeeklyBlockTime(dayName, blockIndex, startValue, endValue) {
  if (!currentWeeklyDays) return;
  const dayObj = currentWeeklyDays.find((d) => d.day === dayName);
  if (!dayObj || !dayObj.blocks || !dayObj.blocks[blockIndex]) return;

  const block = dayObj.blocks[blockIndex];
  const oldTime = block.time;
  const startParts = weeklyInputValueToParts(startValue);
  const endParts = weeklyInputValueToParts(endValue);
  if (!startParts || !endParts) return;

  const newTime = weeklyFormatBlockTimeRange(startParts, endParts);
  if (newTime === oldTime) return;

  block.time = newTime;
  migrateWeeklyCheckedTasksOnTimeChange(dayName, oldTime, newTime);
  persistCurrentWeeklyPlan();

  const container = document.getElementById('weekly-tasks-container');
  if (container) renderWeeklyTiles(currentWeeklyDays, container);
}

function updateWeeklyCustomTaskTime(dayName, blockIndex, taskIndex, startValue, endValue) {
  if (!currentWeeklyDays) return;
  const dayObj = currentWeeklyDays.find((d) => d.day === dayName);
  if (!dayObj || !dayObj.blocks || !dayObj.blocks[blockIndex]) return;
  const tasks = dayObj.blocks[blockIndex].tasks;
  if (!tasks || !tasks[taskIndex]) return;

  const task = tasks[taskIndex];
  if (!startValue && !endValue) {
    delete task.time;
    persistCurrentWeeklyPlan();
    const container = document.getElementById('weekly-tasks-container');
    if (container && currentWeeklyDays) renderWeeklyTiles(currentWeeklyDays, container);
    return;
  }

  const startParts = weeklyInputValueToParts(startValue);
  if (!startParts) return;
  let endParts = weeklyInputValueToParts(endValue);
  if (!endParts) {
    endParts = weeklyMinutesToParts(weeklyPartsToMinutes(startParts) + 30);
  }

  task.time = weeklyFormatBlockTimeRange(startParts, endParts);
  persistCurrentWeeklyPlan();
  const container = document.getElementById('weekly-tasks-container');
  if (container && currentWeeklyDays) renderWeeklyTiles(currentWeeklyDays, container);
}

function wireWeeklyTimeEditors(container) {
  container.querySelectorAll('.wwp-time-editor').forEach((editor) => {
    const startInput = editor.querySelector('.wwp-block-time-start, .wwp-task-time-start');
    const endInput = editor.querySelector('.wwp-block-time-end, .wwp-task-time-end');
    if (!startInput || !endInput) return;

    weeklySyncDurationDataset(startInput, endInput);

    const commit = () => {
      const dayName = startInput.dataset.day;
      const blockIndex = parseInt(startInput.dataset.blockIndex, 10);
      if (Number.isNaN(blockIndex)) return;

      if (startInput.classList.contains('wwp-task-time-start')) {
        const taskIndex = parseInt(startInput.dataset.taskIndex, 10);
        if (Number.isNaN(taskIndex)) return;
        updateWeeklyCustomTaskTime(dayName, blockIndex, taskIndex, startInput.value, endInput.value);
        return;
      }

      updateWeeklyBlockTime(dayName, blockIndex, startInput.value, endInput.value);
    };

    startInput.addEventListener('input', () => weeklyShiftEndFromStart(startInput, endInput));
    endInput.addEventListener('input', () => weeklySyncDurationDataset(startInput, endInput));
    startInput.addEventListener('change', commit);
    endInput.addEventListener('change', () => {
      weeklySyncDurationDataset(startInput, endInput);
      commit();
    });
  });
}

function formatWeeklyICSDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeWeeklyICSText(text) {
  return String(text).replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
}

// =====================================================
// WEEKLY WIN PLAN - Unified execution (uses API)
// =====================================================
async function generateWeeklyPlan(options = {}) {
    const feedback = (typeof options === 'string' ? options : options.feedback || '').trim();
    const isFeedbackRegen = !!feedback;
    const btn = document.getElementById('generate-win-plan-btn');
    const container = document.getElementById('weekly-tasks-container');

    // 2026 Business Plan and Weekly Recruiting Plan are completely separate — this function is WEEKLY ONLY.
    // ABSOLUTE FIRST ACTION: force the custom progress "modal" (we replace #global-loading inner content for Weekly).
    if (typeof window.forceShowGlobalLoading === 'function') {
      window.forceShowGlobalLoading(isFeedbackRegen ? 'Applying your feedback...' : 'Building Your Weekly Recruiting Plan...');
    }

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
                        ${isFeedbackRegen ? 'Applying Your Feedback...' : 'Building Your Weekly Recruiting Plan...'}
                    </h3>
                    <p class="text-lg text-gray-700 dark:text-gray-300 mb-1">
                        ${isFeedbackRegen ? 'Updating your plan based on your notes — usually 30–60 seconds.' : 'This usually takes 30–60 seconds — grab coffee! ☕'}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Creating 7 days of protected recruiting blocks + daily outreach tasks
                    </p>
                </div>

                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                    <h4 class="text-xl font-bold text-[#F15A29] mb-5 text-center">
                        Why a Weekly Recruiting Plan Works
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
        btn.innerHTML = isFeedbackRegen
            ? '<i class="fas fa-spinner fa-spin mr-3"></i> Applying feedback...'
            : '<i class="fas fa-spinner fa-spin mr-3"></i> Building Your Weekly Recruiting Plan...';
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

    // Hide the generate button + pre-gen explanatory guidance (now that we have a plan)
    const generateWrapper = document.getElementById('generate-plan-wrapper');
    if (generateWrapper) generateWrapper.classList.add('hidden');

    const pregen = document.getElementById('weekly-pregen-guidance');
    if (pregen) pregen.classList.add('hidden');

    // Clear checked tasks only on a full fresh generate — keep progress when refining via feedback.
    if (!isFeedbackRegen) {
        localStorage.removeItem('weeklyCheckedTasks');
    }
    if (container) container.innerHTML = '';

    const prompt = isFeedbackRegen
        ? buildWeeklyFeedbackPrompt(feedback)
        : buildUnifiedWeeklyPrompt();

    try {
        const response = await window.callGrokAPI(prompt, {
            temperature: 0.7,
            max_tokens: 4000
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

        data.days = normalizeDaysToV2(data.days);
        if (typeof window.sanitizeWeekendDays === 'function') {
          data.days = window.sanitizeWeekendDays(data.days);
        }
        data.version = WEEKLY_PLAN_VERSION;
        currentWeeklyPlanMeta = {
          summary: data.summary || '',
          totalHours: data.totalHours || getWeeklyCustomizePrefs().hours
        };

        // Persist the plan so it survives page reloads
        savedWeeklyPlan = data;
        window.savedWeeklyPlan = savedWeeklyPlan;
        localStorage.setItem('savedWeeklyPlan', JSON.stringify(data));
        localStorage.removeItem('savedProspectingTimeBlocks');

        // Render the tiles + show polished results wrapper
        const resultsWrapper = document.getElementById('weekly-plan-results');
        if (resultsWrapper) resultsWrapper.classList.remove('hidden');

        const generateWrapper = document.getElementById('generate-plan-wrapper');
        if (generateWrapper) generateWrapper.classList.add('hidden');

        const pregen = document.getElementById('weekly-pregen-guidance');
        if (pregen) pregen.classList.add('hidden');

        renderWeeklyTiles(data.days, container);
        updateWeeklyResultsHeader();
        ensureWeeklyPlanFeedbackUI();

    } catch (error) {
        console.error('[weekly-win-plan] generateWeeklyPlan failed:', error);
        container.innerHTML = `
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-300 p-6 rounded-2xl">
                <p class="text-red-600 font-bold">Could not generate your weekly plan right now.</p>
                <p class="text-sm mt-2">Please make sure the local Grok proxy is running (bash start-proxy.sh) and try again. API proxy on 3000 (HTML serve port like 8080 is fine; use CUSTOM_PROXY_URL if proxy port differs). You can also use the Business Planning section for a full 2026 plan.</p>
            </div>
        `;
        // On failure, restore the pre-gen UI so user can retry easily
        const gw = document.getElementById('generate-plan-wrapper');
        if (gw) gw.classList.remove('hidden');
        const pg = document.getElementById('weekly-pregen-guidance');
        if (pg) pg.classList.remove('hidden');
        const rw = document.getElementById('weekly-plan-results');
        if (rw) rw.classList.add('hidden');
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

// Restore values into the Weekly Recruiting Plan preferences accordion
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
        'closing-ratio', 'current-partners', 'new-partners', 'database-size', 'plan-notes', 'hobby-other'
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

    // Restore plan-style radio (persists user's choice for this tool)
    const savedStyle = localStorage.getItem('winPlan_plan-style');
    if (savedStyle) {
        const radio = document.querySelector(`input[name="plan-style"][value="${savedStyle}"]`);
        if (radio) radio.checked = true;
    }

    // Restore hobby checkboxes in the Business Planning form (local overrides win over profile)
    const savedHobbies = localStorage.getItem('winPlan_hobbies');
    if (savedHobbies) {
        try {
            const hobbies = JSON.parse(savedHobbies);
            document.querySelectorAll('.hobby-checkbox').forEach(cb => {
                cb.checked = hobbies.includes(cb.value);
            });
        } catch (e) {}
    } else {
        // No local override yet — will be populated by sync from central profile
    }

    // Restore activity checkboxes in the Business Planning form (local overrides win)
    const savedActivities = localStorage.getItem('winPlan_activities');
    if (savedActivities) {
        try {
            const activities = JSON.parse(savedActivities);
            document.querySelectorAll('.activity-checkbox').forEach(cb => {
                cb.checked = activities.includes(cb.value);
            });
        } catch (e) {}
    } else {
        // No local override — sync will pull from profile
    }
}

function renderWeeklyTiles(days, container) {
    currentWeeklyDays = normalizeDaysToV2(days);
    window.currentWeeklyDays = currentWeeklyDays;

    let checkedTasks = [];
    try {
        checkedTasks = JSON.parse(localStorage.getItem('weeklyCheckedTasks') || '[]');
    } catch (e) {}

    let html = '';

        currentWeeklyDays.forEach((day, dayIndex) => {
        const blocks = day.blocks || [];
        const blockCount = blocks.length;
        const taskCount = blocks.reduce((n, b) => n + (b.tasks || []).length, 0);

        const blocksHtml = blocks.map((block, blockIndex) => {
            const timeInputs = weeklyBlockTimeToInputs(block.time);
            const tasksHtml = (block.tasks || []).map((t, taskIndex) => {
                const taskKey = `${day.day}::${block.time}::${t.task}`;
                const isChecked = checkedTasks.includes(taskKey);
                const isCustom = t.isCustom === true;
                const customTimeInputs = isCustom ? weeklyBlockTimeToInputs(t.time || '') : null;

                let icon = 'fa-check-circle';
                const lower = (t.task || '').toLowerCase();
                if (lower.includes('call') || lower.includes('text') || lower.includes('dm') || lower.includes('reach out')) icon = 'fa-phone';
                else if (lower.includes('social') || lower.includes('post') || lower.includes('reel') || lower.includes('linkedin')) icon = 'fa-share-alt';
                else if (lower.includes('pop') || lower.includes('gift') || lower.includes('coffee') || lower.includes('lunch') || lower.includes('note')) icon = 'fa-gift';
                else if (lower.includes('value') || lower.includes('article') || lower.includes('checklist')) icon = 'fa-lightbulb';

                return `
                    <div class="group flex items-start gap-3 p-3 rounded-xl border transition-all
                        ${isChecked ? 'bg-[#00A89D]/5 border-[#00A89D]/40' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-[#00A89D]/50'}
                        ${isCustom ? 'border-dashed border-[#F15A29]/50' : ''}">
                        <input type="checkbox" class="weekly-task-checkbox w-4 h-4 mt-1 accent-[#00A89D] cursor-pointer flex-shrink-0"
                               data-key="${taskKey}" ${isChecked ? 'checked' : ''}>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start gap-2">
                                <i class="fas ${icon} text-[#00A89D] mt-0.5 text-xs flex-shrink-0"></i>
                                <div class="font-medium text-sm leading-snug ${isChecked ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}">
                                    ${t.task}
                                    ${isCustom ? '<span class="ml-1 text-[9px] px-1 py-px rounded bg-[#F15A29]/10 text-[#F15A29] font-bold">CUSTOM</span>' : ''}
                                </div>
                            </div>
                            ${t.tip ? `<div class="mt-1.5 ml-5 text-xs text-gray-500 dark:text-gray-400"><span class="text-[#00A89D] font-semibold">Tip:</span> ${t.tip}</div>` : ''}
                            ${isCustom ? renderWeeklyCustomTaskTimeUI(day.day, blockIndex, taskIndex, t, customTimeInputs) : ''}
                            <div class="mt-1.5 ml-5 flex flex-wrap gap-2">
                              <button onclick="if(typeof window.saveWeeklyTask==='function') window.saveWeeklyTask(this)"
                                      data-day="${day.day}" data-task="${(t.task || '').replace(/"/g, '&quot;')}"
                                      data-tip="${(t.tip || '').replace(/"/g, '&quot;')}"
                                      class="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition inline-flex items-center gap-1">
                                  <i class="far fa-bookmark text-[9px]"></i> Save
                              </button>
                              <button type="button" class="weekly-bridge-social text-[10px] px-2 py-0.5 rounded-full border border-[#F15A29]/40 text-[#F15A29] hover:bg-[#F15A29] hover:text-white transition inline-flex items-center gap-1"
                                      data-day-idx="${dayIndex}" data-block-idx="${blockIndex}" data-task-idx="${taskIndex}">
                                  <i class="fas fa-share-alt text-[9px]"></i> → Social
                              </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            const timeEditorHtml = renderWeeklyBlockTimeUI(day.day, blockIndex, block, timeInputs);

            return `
                <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 p-3.5 mb-3">
                    <div class="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        ${timeEditorHtml}
                        ${block.focus ? `<span class="text-[10px] px-2 py-0.5 rounded-full bg-[#00A89D]/10 text-[#00A89D] font-semibold">${block.focus}</span>` : ''}
                    </div>
                    ${block.why ? `<div class="text-xs text-[#00A89D]/90 mb-2 italic">${block.why}</div>` : ''}
                    <div class="space-y-2">${tasksHtml || '<div class="text-xs text-gray-400 italic">No tasks in this block</div>'}</div>
                </div>
            `;
        }).join('');

        html += `
            <div class="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col hover:border-[#00A89D]/40 transition-all">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <div class="font-extrabold text-2xl text-[#F15A29] tracking-tighter">${day.day}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">${blockCount} block${blockCount !== 1 ? 's' : ''} • ${taskCount} task${taskCount !== 1 ? 's' : ''}</div>
                    </div>
                    <div class="text-xs px-2.5 py-1 rounded-full bg-[#F15A29]/10 text-[#F15A29] font-bold">FOCUS DAY</div>
                </div>
                <div class="flex-1 mb-3">${blocksHtml || '<div class="text-sm text-gray-500 italic py-2">Light day — protect energy.</div>'}</div>
                <button onclick="addCustomTaskToDay('${day.day}', this)"
                        class="mt-auto text-xs flex items-center justify-center gap-2 text-[#00A89D] hover:text-white hover:bg-[#00A89D] font-semibold py-2.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:border-[#00A89D] transition-all">
                    <i class="fas fa-plus text-xs"></i>
                    <span class="font-medium">Add your own task</span>
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
    updatePlanProgress(currentWeeklyDays, checkedTasks);

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
            renderWeeklyTiles(currentWeeklyDays, container);
        });
    });

    wireWeeklyTimeEditors(container);
    ensureWeeklyPlanFeedbackUI();

    container.querySelectorAll('.weekly-bridge-social').forEach(btn => {
      btn.addEventListener('click', () => {
        const d = parseInt(btn.dataset.dayIdx, 10);
        const b = parseInt(btn.dataset.blockIdx, 10);
        const t = parseInt(btn.dataset.taskIdx, 10);
        if (window.ToolBridges?.sendTaskToSocial) window.ToolBridges.sendTaskToSocial(d, b, t);
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

    // Show generate button + pre-gen guidance again
    const generateWrapper = document.getElementById('generate-plan-wrapper');
    if (generateWrapper) generateWrapper.classList.remove('hidden');

    const pregen = document.getElementById('weekly-pregen-guidance');
    if (pregen) pregen.classList.remove('hidden');
}

// Updates the progress numbers, bar, and message in the new polished layout
function updatePlanProgress(days, checkedTasks = []) {
    const total = countTasksInDays(days);
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

    let text = `My Weekly Recruiting Plan\n\n`;

    currentWeeklyDays.forEach(day => {
        text += `${day.day}\n`;
        (day.blocks || []).forEach(b => {
            text += `  ${b.time}${b.focus ? ` (${b.focus})` : ''}\n`;
            (b.tasks || []).forEach(t => {
                text += `    • ${t.task}`;
                if (t.time) text += ` [${t.time}]`;
                if (t.tip) text += ` — ${t.tip}`;
                text += `\n`;
            });
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

// Save the current weekly plan (full) to the unified vault as type 'plan' (rich saved items library)
function saveWeeklyPlanToVault() {
    if (!currentWeeklyDays || !currentWeeklyDays.length) {
        if (window.showToast) window.showToast('No weekly plan to save yet.');
        return;
    }
    let richHtml = `<div class="plan-saved">
  <div class="mb-3">
    <span class="text-xs uppercase tracking-widest font-bold text-[#F15A29]">Weekly Recruiting Plan</span>
  </div>`;
    currentWeeklyDays.forEach(day => {
        richHtml += `<div class="mb-3"><div class="font-bold text-[#F15A29]">${day.day}</div>`;
        (day.blocks || []).forEach(b => {
            richHtml += `<div class="ml-2 text-sm font-semibold text-[#002B5C]">${b.time}${b.focus ? ` — ${b.focus}` : ''}</div>`;
            (b.tasks || []).forEach(t => {
                richHtml += `<div class="ml-4 text-sm">• ${t.task}${t.tip ? ` <span class="text-gray-500">— ${t.tip}</span>` : ''}</div>`;
            });
        });
        richHtml += `</div>`;
    });
    richHtml += `<div class="text-xs text-gray-500 mt-2">Personalized weekly plan • Check off tasks in the Weekly Recruiting Plan tool</div></div>`;
    const title = `Weekly Recruiting Plan — ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    if (typeof window.toggleSaveIdea === 'function') {
        window.toggleSaveIdea(title, richHtml, null, 'plan');
        if (typeof window.showSavedFeedback === 'function') {
            window.showSavedFeedback('Weekly plan saved to My Saved Items');
        } else if (typeof window.showToast === 'function') {
            window.showToast('Weekly plan saved to My Saved Items');
        } else {
            const fb = document.createElement('div');
            fb.textContent = '✓ Weekly plan saved to My Saved Items';
            fb.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#00A89D;color:white;padding:10px 18px;border-radius:9999px;font-size:13px;z-index:999999;box-shadow:0 10px 15px -3px rgb(0 0 0 / 0.1)';
            document.body.appendChild(fb);
            setTimeout(() => fb.remove(), 2200);
        }
    }
}

// Per-task save helper (used by buttons injected in renderWeeklyTiles)
window.saveWeeklyTask = function(btn) {
    if (!btn) return;
    const day = btn.dataset.day || '';
    const task = btn.dataset.task || '';
    const tip = btn.dataset.tip || '';
    if (!task) return;
    const title = `Weekly Task: ${day} — ${task}`;
    const content = task + (tip ? ' — ' + tip : '');
    if (typeof window.toggleSaveIdea === 'function') {
        window.toggleSaveIdea(title, content, btn, 'plan');
    }
};

function addCustomTaskToDay(dayName, buttonElement) {
    if (!currentWeeklyDays) return;

    const dayObj = currentWeeklyDays.find(d => d.day === dayName);
    if (!dayObj) return;

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'mt-3 space-y-2';
    inputWrapper.innerHTML = `
        <input type="text" placeholder="Your custom task..." 
               class="w-full px-3 py-2 text-sm rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900">
        <button type="button" class="wwp-custom-add-schedule-toggle text-xs text-[#00A89D] hover:underline flex items-center gap-1">
            <i class="fas fa-clock text-[10px]"></i> Add time for calendar (optional)
        </button>
        <div class="hidden flex items-center gap-2 flex-wrap wwp-time-editor">
            <input type="time" class="wwp-custom-add-start text-xs px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900" aria-label="Custom task start time">
            <span class="text-xs text-gray-400">–</span>
            <input type="time" class="wwp-custom-add-end text-xs px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900" aria-label="Custom task end time">
        </div>
        <div class="flex gap-2">
            <button type="button" class="wwp-custom-add-submit px-4 py-2 text-sm rounded-2xl bg-[#00A89D] text-white font-medium">Add</button>
            <button type="button" class="wwp-custom-add-cancel px-3 py-2 text-sm rounded-2xl border border-gray-300 dark:border-gray-600">Cancel</button>
        </div>
    `;

    const input = inputWrapper.querySelector('input[type="text"]');
    const scheduleToggle = inputWrapper.querySelector('.wwp-custom-add-schedule-toggle');
    const schedulePanel = scheduleToggle && scheduleToggle.nextElementSibling;
    const startTimeInput = inputWrapper.querySelector('.wwp-custom-add-start');
    const endTimeInput = inputWrapper.querySelector('.wwp-custom-add-end');
    const addBtn = inputWrapper.querySelector('.wwp-custom-add-submit');
    const cancelBtn = inputWrapper.querySelector('.wwp-custom-add-cancel');

    if (scheduleToggle && schedulePanel) {
        scheduleToggle.addEventListener('click', () => {
            schedulePanel.classList.toggle('hidden');
            schedulePanel.classList.toggle('flex');
            if (!schedulePanel.classList.contains('hidden') && startTimeInput) startTimeInput.focus();
        });
    }

    if (startTimeInput && endTimeInput) {
        startTimeInput.addEventListener('input', () => {
            if (startTimeInput.value) weeklyShiftEndFromStart(startTimeInput, endTimeInput);
        });
        endTimeInput.addEventListener('input', () => weeklySyncDurationDataset(startTimeInput, endTimeInput));
    }

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

        if (!dayObj.blocks) dayObj.blocks = [];
        let targetBlock = dayObj.blocks.find(b => b.time === 'Flexible' || b.time === 'Custom');
        if (!targetBlock) {
            targetBlock = { time: 'Flexible', focus: 'Custom', why: 'You added this', tasks: [] };
            dayObj.blocks.push(targetBlock);
        }
        if (!targetBlock.tasks) targetBlock.tasks = [];

        const newTask = {
            task: value,
            tip: 'You added this task',
            isCustom: true
        };

        if (startTimeInput && endTimeInput && startTimeInput.value) {
            const startParts = weeklyInputValueToParts(startTimeInput.value);
            let endParts = weeklyInputValueToParts(endTimeInput.value);
            if (startParts) {
                if (!endParts) {
                    endParts = weeklyMinutesToParts(weeklyPartsToMinutes(startParts) + 30);
                }
                newTask.time = weeklyFormatBlockTimeRange(startParts, endParts);
            }
        }

        targetBlock.tasks.push(newTask);

        savedWeeklyPlan = {
            version: WEEKLY_PLAN_VERSION,
            summary: currentWeeklyPlanMeta.summary || '',
            totalHours: currentWeeklyPlanMeta.totalHours,
            days: currentWeeklyDays
        };
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

        // Save a *cleaner*, polished version for My Saved Items.
        // Produce a self-contained .plan-saved card with nice header, controlled typography (no huge orange headings, no big blocks of text), good spacing, and preserved structure (headings, lists, bold).
        let raw = (preview ? preview.innerHTML : (output ? (output.querySelector('#plan-preview') ? output.querySelector('#plan-preview').innerHTML : output.innerHTML) : '')) || 'Custom 2026 Business Plan';

        // Sanitize: neutralize orange accents, remove generator-specific chrome/headers, keep useful formatting.
        let cleaned = raw
          .replace(/text-\[#F15A29\]/g, 'text-[#002B5C]')
          .replace(/bg-\[#F15A29\][^\s"']*/g, 'bg-gray-100')
          .replace(/border-\[#F15A29\][^\s"']*/g, 'border-gray-200')
          .replace(/ring-\[#F15A29\][^\s"']*/g, '')
          .replace(/prose-lg|prose-xl|prose-2xl/g, 'prose prose-base')
          .replace(/shadow-2xl|shadow-xl/g, 'shadow-sm')
          .replace(/border-2 border-\[#F15A29\]\/30/g, 'border border-gray-200')
          .replace(/YOUR 2026 ROADMAP IS READY|Your Custom 2026 Business Plan|Bring This Plan to Life/g, '')
          .replace(/<div class="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-\[#F15A29\] text-white text-xs[^>]*>.*?<\/div>/gi, '')
          .replace(/<h3 class="text-3xl[^>]*>.*?<\/h3>/gi, '');

        // Build ultra-premium saved structure — feels like a high-end, printable business document asset
        const planStyle = document.querySelector('input[name="plan-style"]:checked')?.value || 'Custom';
        const cleanContent = `
<div class="plan-saved border border-gray-200 dark:border-gray-700 rounded-3xl overflow-hidden bg-white dark:bg-gray-900 shadow-md">
  <!-- Executive Document Header -->
  <div class="px-8 py-6 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-3">
        <span class="inline-block px-4 py-1 text-[10px] font-bold tracking-[2px] rounded-full bg-[#002B5C] text-white">2026 BUSINESS PLAN</span>
        <span class="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">${planStyle}</span>
      </div>
      <div class="text-[10px] font-medium text-gray-400">Strategic • Personal • Actionable</div>
    </div>
    <div class="text-2xl font-bold text-[#002B5C] dark:text-white tracking-tight">Your 2026 Business Plan</div>
    <div class="mt-1 text-sm text-gray-500">Built from your exact profile, hobbies, goals, and real life. Designed for quarterly reviews and team alignment.</div>
  </div>

  <!-- Premium Snapshot Bar -->
  <div class="px-8 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
    <div class="text-[10px] font-bold tracking-widest text-[#00A89D] mb-2">PLAN SNAPSHOT</div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
      <div class="flex items-center gap-2">
        <div class="font-semibold text-[#002B5C] dark:text-white">Power Theme:</div>
        <div class="text-gray-600 dark:text-gray-300 italic">See first section below</div>
      </div>
      <div class="flex items-center gap-2">
        <div class="font-semibold text-[#002B5C] dark:text-white">Core Focus:</div>
        <div class="text-gray-600 dark:text-gray-300">Quarterly Milestones + Weekly Rhythm</div>
      </div>
      <div class="flex items-center gap-2">
        <div class="font-semibold text-[#002B5C] dark:text-white">Execution:</div>
        <div class="text-gray-600 dark:text-gray-300">90-Day Launch + Tool Ties</div>
      </div>
    </div>
  </div>

  <div class="p-6">
    <div class="plan-content prose prose-sm dark:prose-invert max-w-none p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl leading-relaxed overflow-auto max-h-[520px] shadow-inner
      [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[#002B5C] dark:[&_h1]:text-white [&_h1]:mt-0 [&_h1]:mb-3 [&_h1]:tracking-tight
      [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[#002B5C] dark:[&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-gray-200 [&_h2]:pb-1
      [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-[#00A89D] dark:[&_h3]:text-[#00A89D] [&_h3]:mt-5
      [&_p]:mb-4 [&_p]:text-gray-700 dark:[&_p]:text-gray-300 [&_p]:leading-relaxed
      [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:mb-2 [&_li]:text-gray-700 dark:[&_li]:text-gray-300
      [&_strong]:font-semibold [&_strong]:text-[#002B5C] dark:[&_strong]:text-white
    ">
      ${cleaned}
    </div>
  </div>

  <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t flex items-center justify-between text-[10px] text-gray-500">
    <div class="font-medium">Ready for quarterly reviews • Regenerate with updated profile anytime</div>
    <div class="hidden sm:block">Built for high-performers & teams</div>
  </div>
</div>`;

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
    localStorage.removeItem('recruiter_savedBusinessPlanContext');
    localStorage.removeItem('recruiter_savedBusinessPlanMarkdown');
    window.ToolBridges?.refreshAnnualBridgeUI?.();
    output.innerHTML = '';
    output.classList.add('hidden');
    output.style.display = 'none';
}

// Setup & Persistence
let userSetup = JSON.parse(localStorage.getItem('winPlanSetup')) || {
    name: "Recruiter",
    email: "",
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
window.currentWeeklyDays = null;
window.savedWeeklyPlan = savedWeeklyPlan;

function updateSetupDisplays() {
    const effective = getEffectiveSetup();
    const name = (effective.name || '').trim() || "Recruiter";
    const monthlyHires = parseInt(effective.monthlyUnits, 10) || 5;
    const weeklyOutreach = window.RECRUITING_METRICS?.weekly?.outreachAttempts || 270;

    const titleEl = document.getElementById('personalized-title');
    if (titleEl) titleEl.textContent = `${name}'s Weekly Recruiting Plan`;

    const goalEl = document.getElementById('monthly-goal-display');
    if (goalEl) goalEl.textContent = monthlyHires;

    const targetEl = document.getElementById('weekly-target');
    if (targetEl) targetEl.textContent = `For ${monthlyHires} net hires/mo: aim for ~${weeklyOutreach} outreach attempts this week (Tue–Thu weighted)`;

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

    if (nameEl) userSetup.name = nameEl.value.trim() || "Recruiter";
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

    // === Auto-save for main Business Plan input fields (target income, closings, etc.) + notes + style + hobbies/activities ===
    const planInputIds = ['target-income', 'avg-commission', 'target-closings', 'avg-loan', 'closing-ratio', 'current-partners', 'new-partners', 'database-size', 'plan-notes', 'hobby-other'];
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

    // Persist plan-style radio selection
    document.querySelectorAll('input[name="plan-style"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.checked) {
                localStorage.setItem('winPlan_plan-style', radio.value);
            }
        });
    });

    // Save hobby/activity checkbox state on change (so local overrides persist for this tool)
    document.querySelectorAll('.hobby-checkbox, .activity-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            // Collect current checked for hobbies
            const checkedHobbies = Array.from(document.querySelectorAll('.hobby-checkbox'))
                .filter(c => c.checked).map(c => c.value);
            localStorage.setItem('winPlan_hobbies', JSON.stringify(checkedHobbies));

            const checkedActivities = Array.from(document.querySelectorAll('.activity-checkbox'))
                .filter(c => c.checked).map(c => c.value);
            localStorage.setItem('winPlan_activities', JSON.stringify(checkedActivities));
        });
    });

    // Also persist hobby-other on input (in case user types after profile sync)
    const hobbyOtherEl = document.getElementById('hobby-other');
    if (hobbyOtherEl) {
        hobbyOtherEl.addEventListener('input', () => {
            localStorage.setItem('winPlan_hobby-other', hobbyOtherEl.value || '');
        });
    }

    console.log('🔄 Weekly Recruiting Plan auto-save enabled — changes save instantly');
})();

// =====================================================
// PUBLIC API EXPOSURE
// =====================================================
window.generatePlan = generatePlan;

window.applyWeeklyPlanFeedbackAndRegenerate = function() {
  const input = document.getElementById('weekly-plan-feedback-input');
  if (!input) return;
  const val = (input.value || '').trim();
  if (!val) {
    if (window.showToast) window.showToast('Enter feedback first — e.g. "more phone blocks Tuesday–Thursday"', 'warning');
    else alert('Enter feedback first — e.g. "more phone blocks Tuesday–Thursday"');
    return;
  }
  if (!currentWeeklyDays || !currentWeeklyDays.length) {
    if (window.showToast) window.showToast('Generate a plan first, then refine with feedback.', 'warning');
    else alert('Generate a plan first, then refine with feedback.');
    return;
  }
  generateWeeklyPlan({ feedback: val });
  input.value = '';
};

window.lastPlanFeedback = window.lastPlanFeedback || '';

window.applyPlanFeedbackAndRegenerate = function() {
  const input = document.getElementById('plan-feedback-input');
  if (!input) return;
  const val = (input.value || '').trim();
  if (!val) {
    if (window.showToast) window.showToast('Enter some feedback first (e.g. "more focus on social and golf").');
    else alert('Enter some feedback first.');
    return;
  }
  window.lastPlanFeedback = val;
  // Re-run generation with the current form values + the feedback appended to prompt
  if (typeof generatePlan === 'function') {
    generatePlan('plan-output');
  } else if (typeof window.generatePlan === 'function') {
    window.generatePlan('plan-output');
  }
  // Clear the input after triggering (feedback is captured for this run)
  setTimeout(() => { 
    if (input) input.value = ''; 
    window.lastPlanFeedback = ''; // clear after use so next normal generate is clean
  }, 300);
};

window.syncPlanningFormFromProfile = function() {
  const p = (typeof window.getUserProfile === 'function') ? window.getUserProfile() : {};
  const eff = (typeof window.getEffectiveSetup === 'function') ? window.getEffectiveSetup() : {};

  const setVal = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };

  // Only pull annual numbers from profile if the user hasn't set specific local values yet (persistence wins for 2026-specific targets)
  const hasLocalClosings = localStorage.getItem('winPlan_target-closings');
  const hasLocalIncome = localStorage.getItem('winPlan_target-income');
  const metrics = window.RECRUITING_METRICS || {};
  const monthlyHires = parseInt(p.monthlyUnits || eff.monthlyUnits || metrics.monthly?.netHires || 5, 10);
  if (monthlyHires && !hasLocalIncome) {
    setVal('target-income', String(monthlyHires));
  }
  if (monthlyHires && !hasLocalClosings) {
    setVal('target-closings', String(monthlyHires * 12));
  }
  if (p.hours) setVal('weekly-hours-hint', p.hours);

  const wk = metrics.weekly || {};
  if (!localStorage.getItem('winPlan_avg-commission')) setVal('avg-commission', String(wk.outreachAttempts || 270));
  if (!localStorage.getItem('winPlan_avg-loan')) setVal('avg-loan', String(wk.qualityConversations?.min || 24));
  if (!localStorage.getItem('winPlan_closing-ratio')) setVal('closing-ratio', String(wk.executiveCallsScheduled?.min || 5));
  if (!localStorage.getItem('winPlan_new-partners')) setVal('new-partners', '17');

  // Set a balanced style by default ONLY if nothing chosen and no local saved style
  const savedStyle = localStorage.getItem('winPlan_plan-style');
  const checked = document.querySelector('input[name="plan-style"]:checked');
  if (!checked && !savedStyle) {
    const bal = Array.from(document.querySelectorAll('input[name="plan-style"]')).find(r =>
      r.value === 'Balanced Recruiting' || r.value === 'Balanced Growth'
    );
    if (bal) bal.checked = true;
  }

  // === Pull hobbies & activities from central profile ONLY if no local overrides saved for this tool ===
  // This way: profile provides smart defaults the first time (no clicking needed), but user's changes in the plan form persist.
  const hasLocalHobbies = localStorage.getItem('winPlan_hobbies');
  if (!hasLocalHobbies || hasLocalHobbies === '[]') {
    const profileHobbies = p.hobbies || [];
    document.querySelectorAll('.hobby-checkbox').forEach(cb => {
      cb.checked = profileHobbies.includes(cb.value);
    });
    if (p.hobbiesOther) {
      setVal('hobby-other', p.hobbiesOther);
    }
    // Save the profile defaults as the initial local state so they persist
    const defaultHobbies = Array.from(document.querySelectorAll('.hobby-checkbox')).filter(c => c.checked).map(c => c.value);
    if (defaultHobbies.length) localStorage.setItem('winPlan_hobbies', JSON.stringify(defaultHobbies));
  }

  const hasLocalActivities = localStorage.getItem('winPlan_activities');
  if (!hasLocalActivities || hasLocalActivities === '[]') {
    // Support both p.activities and p.preferredActivities for compatibility
    const profileActivities = [...(p.activities || []), ...(p.preferredActivities || [])];
    document.querySelectorAll('.activity-checkbox').forEach(cb => {
      cb.checked = profileActivities.includes(cb.value);
    });
    const defaultActivities = Array.from(document.querySelectorAll('.activity-checkbox')).filter(c => c.checked).map(c => c.value);
    if (defaultActivities.length) localStorage.setItem('winPlan_activities', JSON.stringify(defaultActivities));
  }

  // Pre-fill notes with profile context ONLY if the notes field is still empty (don't overwrite user's 2026 vision/notes)
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

  // Silent sync — no toast to prevent corner popups saying "something was loaded"

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
  if (partnerTypes) parts.push(`<div><span class="font-semibold text-[#002B5C] dark:text-white">Ideal LO Candidates:</span> ${partnerTypes}</div>`);

  const family = p.family || '';
  if (family) parts.push(`<div><span class="font-semibold text-[#002B5C] dark:text-white">Life/Family:</span> ${family}</div>`);

  const voice = (p.voiceTraits || []).join(', ');
  if (voice) parts.push(`<div><span class="font-semibold text-[#002B5C] dark:text-white">Voice:</span> ${voice}</div>`);

  container.innerHTML = parts.length ? parts.join('') : '<div class="text-gray-400">Complete your profile for even richer personalization (challenges, voice, ideal LO profiles, etc. all feed the plan).</div>';
}

window.renderExtendedProfileInfo = renderExtendedProfileInfo;window.copyPlanFormatted = copyPlanFormatted;

// === Fun Quick Start Presets (ported + active) ===
window.applyPlanPreset = function(preset) {
  // Sets realistic target numbers (and hobby hints for hobby-first) but DOES NOT touch the Your 2026 Vision / style radios.
  // Presets only affect the numeric targets as requested.
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

  if (preset === 'conservative') {
    setVal('target-income', '4');
    setVal('target-closings', '48');
    setVal('avg-commission', '220');
    setVal('avg-loan', '18');
    setVal('closing-ratio', '4');
    setVal('current-partners', '80');
    setVal('new-partners', '12');
    setVal('database-size', '300');
  } else if (preset === 'realistic') {
    setVal('target-income', '5');
    setVal('target-closings', '60');
    setVal('avg-commission', '270');
    setVal('avg-loan', '24');
    setVal('closing-ratio', '5');
    setVal('current-partners', '120');
    setVal('new-partners', '17');
    setVal('database-size', '450');
  } else if (preset === 'stretch') {
    setVal('target-income', '6');
    setVal('target-closings', '72');
    setVal('avg-commission', '300');
    setVal('avg-loan', '28');
    setVal('closing-ratio', '6');
    setVal('current-partners', '150');
    setVal('new-partners', '20');
    setVal('database-size', '550');
  } else if (preset === 'moonshot') {
    setVal('target-income', '7');
    setVal('target-closings', '84');
    setVal('avg-commission', '330');
    setVal('avg-loan', '32');
    setVal('closing-ratio', '7');
    setVal('current-partners', '200');
    setVal('new-partners', '25');
    setVal('database-size', '700');
  } else if (preset === 'hobby-first') {
    setVal('target-income', '4');
    setVal('target-closings', '52');
    setVal('avg-commission', '240');
    setVal('avg-loan', '20');
    setVal('closing-ratio', '4.5');
    setVal('current-partners', '100');
    setVal('new-partners', '15');
    setVal('database-size', '400');
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

  // No toast — the visual highlight on the preset button is sufficient and cleaner


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
    style: document.querySelector('input[name="plan-style"]:checked')?.value || 'Balanced Recruiting',
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
  const legacyStyleMap = {
    'Referral Mastery': 'Phone-Heavy Outreach',
    'Database Reactor': 'Nurture Pipeline',
    'Balanced Growth': 'Balanced Recruiting'
  };
  const styleVal = legacyStyleMap[state.style] || state.style;

  // set style
  document.querySelectorAll('input[name="plan-style"]').forEach(r => {
    r.checked = (r.value === styleVal);
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

  // No toast for baseline load — UI update + highlight is enough
};

// === Hobby-Tied Tactics (richer, live suggestions based on selected hobbies) ===
const hobbyTacticsMap = {
  'Golf': 'Invite a 30–70 unit LO prospect for 9 holes. No pitch — ask what would make their next year easier, then listen.',
  'Family Time': 'Share a quick family moment on LinkedIn and DM 3 warm Shape prospects: “hope your crew is having a great season.” Zero ask.',
  'Cooking': 'Post a “what I’m cooking this week” story and offer a casual lunch to one A-tier prospect who engages.',
  'Outdoors': 'Suggest a short walk or hike with a local LO you’re nurturing. Position as peer connection, not a hard close.',
  'Fitness': 'Start a friendly step challenge with 2–3 LO prospects. Loser buys coffee — natural follow-up for a quality conversation.',
  'Crafts': 'Hand-write 5 notes to warm Shape prospects: one personal detail + one Ruoff differentiator they’d actually care about.',
  'Cards/Poker': 'Host a low-key game night for 4–6 LOs in your market. Winner gets a small gift — relationships deepen without pressure.',
  'Sports': 'Text 5 prospects “big game this weekend?” then follow up mid-week with a 1-line recruiting insight or market note.',
  'Crafts / DIY': 'Share a hobby project on social and tag a prospect you’re warming — authenticity beats another templated LinkedIn pitch.',
  'Fitness / Gym': 'Offer to be an accountability buddy for an LO who also trains — turns into regular non-recruiting conversations that build trust.'
};

window.updateHobbyTactics = function() {
  const container = document.getElementById('hobby-tactics-content');
  if (!container) return;
  const checkedVals = Array.from(document.querySelectorAll('.hobby-checkbox:checked')).map(cb => cb.value);
  if (checkedVals.length === 0) {
    container.innerHTML = 'Select one or more hobbies above — we’ll suggest authentic, low-pressure ways to turn your real passions into recruiting relationship moves.';
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
  { title: "Never Split the Difference", content: "Use calibrated questions and tactical empathy instead of arguing comp or culture objections.", why: "Builds trust fast with LO prospects — perfect for Phone-Heavy Outreach or any style.", tags: ['phone','objections'], saveLabel: 'Book idea: Never Split the Difference' },
  { title: "Atomic Habits", content: "You do not rise to the level of your goals. You fall to the level of your systems.", why: "Turn outreach blocks into a non-negotiable system instead of a motivation-dependent event.", tags: ['discipline','habits'], saveLabel: 'Mindset from Atomic Habits' },
  { title: "The Go-Giver", content: "Your results are determined by how many LOs you serve and how well you serve them.", why: "Shift from “what can I get” to “how can I add value first” in every prospect conversation.", tags: ['value','nurture'], saveLabel: 'Book takeaway: The Go-Giver' },
  { title: "Fanatical Prospecting", content: "Prospecting is a numbers game fueled by discipline and the right activity mix.", why: "Even on slow days, the mix (calls + Shape touches + social + nurture) compounds.", tags: ['prospecting','discipline'], saveLabel: 'Prospecting truth: Fanatical Prospecting' },
  { title: "Mindset Lab — Rejection", content: "Your job is not to avoid hearing no. Your job is to make 'no' meaningless by having so many conversations that the nos become background noise.", why: "Great reframe when Shape feels quiet — just keep the activity volume up.", tags: ['resilience','mindset'], saveLabel: 'Mindset reframe for tough days' },
  { title: "Book of Yes", content: "Your success is directly tied to the quality of your conversations with LO prospects.", why: "Every touch should make the LO feel like the hero of their own career story.", tags: ['phone','conversations'], saveLabel: 'LO conversation tip: Book of Yes' },
  { title: "Mindset Lab — Discipline", content: "If it isn’t scheduled, it isn’t real. Hope is not a calendar entry.", why: "Block Tue–Thu phone time and Shape review — protect it like an executive call.", tags: ['discipline','habits'], saveLabel: 'Scheduling truth from Mindset Lab' },
  { title: "Building a StoryBrand", content: "If you confuse, you lose. Make the LO prospect the hero of the story.", why: "Your social content should position the LO as the hero, not Ruoff or you.", tags: ['social','branding'], saveLabel: 'StoryBrand content principle' }
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
  const styleLower = currentStyle.toLowerCase();
  const styleMatch = inspirations.filter(i =>
    (styleLower.includes('phone') && i.tags.includes('phone')) ||
    (styleLower.includes('nurture') && i.tags.includes('nurture')) ||
    (styleLower.includes('balanced') && i.tags.includes('discipline'))
  );
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

// Live "what this means" calculator — recruiting funnel clarity
function calcWeeklyFunnelFromAnnual(annualHires) {
  const weeklyHires = annualHires / 48;
  const execCompleted = weeklyHires / 0.72;
  const execScheduled = execCompleted / 0.75;
  const qualityConvos = execScheduled / 0.20;
  const outreach = qualityConvos / 0.09;
  return {
    outreach: Math.round(outreach),
    qualityConvos: Math.round(qualityConvos),
    execScheduled: Math.round(execScheduled * 10) / 10
  };
}

function updatePlanLiveInsight() {
  const insight = document.getElementById('plan-insight-text');
  if (!insight) return;

  let annualHires = parseFloat(document.getElementById('target-closings')?.value) || 0;
  let monthlyHires = parseFloat(document.getElementById('target-income')?.value) || 0;
  const outreach = parseFloat(document.getElementById('avg-commission')?.value) || 0;
  const qualityConvos = parseFloat(document.getElementById('avg-loan')?.value) || 0;
  const execCalls = parseFloat(document.getElementById('closing-ratio')?.value) || 0;
  const shapeProspects = parseFloat(document.getElementById('current-partners')?.value) || 0;

  if (!annualHires && monthlyHires) annualHires = monthlyHires * 12;
  if (!monthlyHires && annualHires) monthlyHires = Math.round((annualHires / 12) * 10) / 10;

  if (!annualHires && !monthlyHires) {
    insight.innerHTML = 'Fill in your hire goals above and we’ll show you the weekly recruiting activity it takes — no judgment, just clarity.';
    return;
  }

  const derived = calcWeeklyFunnelFromAnnual(annualHires);
  const showOutreach = outreach || derived.outreach;
  const showConvos = qualityConvos || derived.qualityConvos;
  const showExec = execCalls || derived.execScheduled;
  const pipelineGap = shapeProspects ? Math.max(0, Math.ceil(annualHires * 2.5) - shapeProspects) : 0;

  let html = `<div class="flex flex-wrap gap-x-6 gap-y-1 items-start">`;
  html += `<div class="flex items-center gap-2"><i class="fas fa-user-check text-[#F15A29]"></i> <span>To hit <strong class="tabular-nums">${annualHires}</strong> net hires (<strong class="tabular-nums">${monthlyHires}</strong>/mo): plan for consistent weekly funnel activity.</span></div>`;
  html += `<div class="flex items-center gap-2"><i class="fas fa-phone text-[#00A89D]"></i> <span>~<strong class="tabular-nums">${showOutreach}</strong> outreach attempts/week • <strong class="tabular-nums">${showConvos}</strong> quality conversations • <strong class="tabular-nums">${showExec}</strong> exec calls scheduled.</span></div>`;
  if (pipelineGap > 0) {
    html += `<div class="flex items-center gap-2"><i class="fas fa-layer-group text-[#002B5C]"></i> <span>Grow Shape by ~<strong class="tabular-nums">${pipelineGap}</strong> active prospects to support this pace.</span></div>`;
  }
  html += `</div><div class="text-[11px] mt-1 text-gray-500">Tue–Thu phone blocks carry most of the load. The AI will build around your real capacity and preferred activities.</div>`;

  insight.innerHTML = html;

  const note = document.getElementById('plan-style-note');
  if (note) {
    const style = document.querySelector('input[name="plan-style"]:checked')?.value || '';
    if (style) note.textContent = style + ' focus selected.';
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
window.exportWeeklyPlanToICS = exportWeeklyPlanToICS;
window.updateWeeklyBlockTime = updateWeeklyBlockTime;
window.updateWeeklyCustomTaskTime = updateWeeklyCustomTaskTime;

// =====================================================
function wireGeneratePlanButton() {
  const handler = (ev) => {
    try {
      console.log('%c[weekly-win-plan] Business Planning "Build My 2026 Plan — Make It Real & Fun" button clicked', 'color:lime');
      if (ev && ev.preventDefault) ev.preventDefault();

      // Force the rich progress modal (enrich panel + tips) as the VERY FIRST thing. This guarantees the user sees the modal instead of any note in #plan-output.
      if (typeof window.forceShowGlobalLoading === 'function') {
        window.forceShowGlobalLoading('Crafting Your 2026 Recruiting Plan...');
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
        if (typeof window.forceShowGlobalLoading === 'function') window.forceShowGlobalLoading('Crafting Your 2026 Recruiting Plan...');
        (window.generatePlan || generatePlan)('plan-output');
      };
    }

    // Weekly Recruiting Plan button (the one inside the Weekly Recruiting Plan tool)
    const weeklyWinBtn = document.getElementById('generate-win-plan-btn');
    if (weeklyWinBtn && !weeklyWinBtn._wwpWired) {
        weeklyWinBtn._wwpWired = true;
        // Use addEventListener only, no override to avoid conflicts
        weeklyWinBtn.addEventListener('click', () => {
            console.log('%c[weekly-win-plan] Weekly Recruiting Plan "Build This Week\'s Plan" button clicked', 'color: lime');
            // Force the progress experience FIRST (uses the shared ultra force helper so the custom weekly loading card appears immediately)
            if (typeof window.forceShowGlobalLoading === 'function') {
              window.forceShowGlobalLoading('Building Your Weekly Recruiting Plan...');
            }
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
    migrateLegacyWeeklyStorage();
    restoreSavedWeeklyPlan();
    wireWeeklyCustomizeControls();

    window.generateWeeklyPlan = generateWeeklyPlan;
    window.saveWeeklyPlanToVault = saveWeeklyPlanToVault;
    window.exportWeeklyPlanToICS = exportWeeklyPlanToICS;
window.updateWeeklyBlockTime = updateWeeklyBlockTime;
window.updateWeeklyCustomTaskTime = updateWeeklyCustomTaskTime;
    window.updateWeeklyCustomizeDisplays = updateWeeklyCustomizeDisplays;

    console.log('%c[weekly-win-plan.js] Weekly Recruiting Plan / Business Planning initialized', 'color:#00A89D');

    // Restore values into the new inline preferences accordion
    restoreWeeklyPreferencesForm();

    // Live sync: any change in the Weekly Recruiting Plan preferences updates the top summary immediately
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
          oc = oc.replace(/social-media-strategy/g, 'social-post');
          oc = oc.replace(/referral-partners/g, 'recruiting-playbook');
          oc = oc.replace(/showSection\('social'\)/g, "window.showSection('social-post')");
          oc = oc.replace(/showSection\('referrals'\)/g, "window.showSection('recruiting-playbook')");
          oc = oc.replace(/showSection\('value-vault'\)/g, "window.showSection('database')");
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
