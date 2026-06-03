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
    console.log('%c[weekly-win-plan] generatePlan() called', 'color: #00A89D', 'target:', targetOutputId);

    const businessTips = [
      "Great 2026 plans are built on consistent daily activity, not heroic sprints.",
      "The average top producer has 3–5 different lead sources. What's yours?",
      "While we build your plan: Focus on the activities that only you can do.",
      "Pro tip: Review your plan every 90 days and adjust ruthlessly."
    ];
    window.showLoadingWithTips(businessTips, 'Crafting Your 2026 Business Plan...');

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

    // === FIX: Collect Hobbies & Activities Lists ===
    const hobbiesList = Array.from(document.querySelectorAll('.hobby-checkbox:checked'))
                             .map(cb => cb.nextElementSibling.textContent.trim());

    const activitiesList = Array.from(document.querySelectorAll('.activity-checkbox:checked'))
                               .map(cb => cb.nextElementSibling.textContent.trim());

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
    const prompt = `You are an expert mortgage sales coach. Create a detailed, motivational 2026 business plan for a loan officer.

Plan Style: ${style}

Core User Profile (from their central preferences - use this heavily for personalization):
- Name: ${richProfile.name}
- Years in the business: ${profile.years || 'not specified'}
- Personality / Lifestyle: ${profile.personality || richProfile.personality || 'not specified'}
- Preferred Content Tone: ${profile.tone || richProfile.tone || 'warm and professional'}
- Key Challenges: ${(profile.challenges || []).join(', ') || 'general growth'}
- Target Partner Types: ${(profile.partnerTypes || []).join(', ') || 'realtors and local businesses'}
- Hobbies & Interests: ${[...(profile.hobbies || []), profile.hobbiesOther].filter(Boolean).join(', ') || (hobbiesList.length ? hobbiesList.join(', ') : 'not specified')}
- Preferred Prospecting Style: ${[...(profile.activities || []), ...(richProfile.preferredActivities || [])].filter(Boolean).join(', ') || (activitiesList.length ? activitiesList.join(', ') : 'balanced mix')}

Business Inputs (use defaults where blank):
- Target Income: ${inputs.income || 'calculated from closings'}
- Target Closings: ${inputs.closings || 'calculated'}
- Avg Loan Size: ${inputs.loanAmount || '400000'}
- Current Partners: ${inputs.currentPartners || 'not specified'}
- Weekly Prospecting Hours: ${richProfile.hours || 'not specified'}

Structure the plan:
1. Executive Summary with key numbers
2. Focus Areas tailored to their style, personality, and challenges
3. Monthly/Quarterly Milestones
4. Weekly Scorecard Targets
5. Specific Tactics that match their preferred activities and hobbies (weave personal interests in naturally)
6. Accountability & Motivation written in their preferred tone

Make every section specific, actionable, and motivating. Incorporate their hobbies and personality naturally. NO EMOJIS.

Output ONLY the Markdown content — no JSON, no extra text.`;

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

            planContainer.innerHTML = 
                '<div style="background:#f8fafc; border:4px solid #F15A29; border-radius:20px; padding:30px; box-shadow:0 10px 30px rgba(0,0,0,0.15); margin-top:30px;">' +
                    '<div style="background:#F15A29; color:white; display:inline-block; padding:6px 18px; border-radius:9999px; font-weight:700; font-size:15px; margin-bottom:20px;">✓ RESULTS BELOW</div>' +
                    '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; flex-wrap:wrap; gap:15px;">' +
                        '<h3 style="font-size:28px; font-weight:700; color:#F15A29; margin:0;">Your Custom 2026 Business Plan</h3>' +
                        '<div style="display:flex; gap:12px; flex-wrap:wrap;">' +
                            '<button onclick="copyPlanFormatted()" style="background:#002B5C; color:white; padding:12px 24px; border-radius:9999px; font-weight:700; border:none; cursor:pointer;">Copy Formatted (for Word)</button>' +
                            '<button onclick="downloadPlanWord()" style="background:#F15A29; color:white; padding:12px 24px; border-radius:9999px; font-weight:700; border:none; cursor:pointer;">Download Word Doc</button>' +
                        '</div>' +
                    '</div>' +
                    '<div id="plan-preview" style="background:white; padding:25px; border-radius:12px; border:1px solid #ddd; line-height:1.65; font-size:15px;">' +
                        contentToShow +
                    '</div>' +
                '</div>';

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

// Restore saved Weekly Win Plan (persists across refreshes until new plan is generated)
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
window.copyPlanFormatted = copyPlanFormatted;
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
// INITIALIZATION - Button Wiring
// =====================================================
function initWeeklyWinPlan() {
    console.log('%c[weekly-win-plan.js] initWeeklyWinPlan running - attaching listeners', 'color:#00A89D');

    // Edit Preferences button (now expands the inline accordion)
    const editPrefsBtn = document.getElementById('edit-preferences-btn');
    if (editPrefsBtn) {
        editPrefsBtn.addEventListener('click', expandPreferencesAccordion);
    }

    // Business Planning button (the big "Generate My Custom 2026 Plan" form)
    const businessPlanBtn = document.getElementById('generate-plan-btn');
    if (businessPlanBtn) {
        businessPlanBtn.addEventListener('click', () => {
            console.log('%c[weekly-win-plan] Business Planning "Generate My Custom 2026 Plan" button clicked', 'color: lime');
            generatePlan('plan-output');   // Business Planning output
        });
    }

    // Weekly Win Plan button (the one inside the Weekly Win Plan tool)
    const weeklyWinBtn = document.getElementById('generate-win-plan-btn');
    if (weeklyWinBtn) {
        weeklyWinBtn.onclick = null; // clear any old fallback
        weeklyWinBtn.addEventListener('click', () => {
            console.log('%c[weekly-win-plan] Weekly Win Plan "Build This Week\'s Plan" button clicked', 'color: lime');
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

    // Restore any previously generated Business Plan + add clear button
    restoreSavedBusinessPlan();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWeeklyWinPlan);
} else {
    initWeeklyWinPlan();
}

})();   // ← This is the ONLY closing for the main outer IIFE
