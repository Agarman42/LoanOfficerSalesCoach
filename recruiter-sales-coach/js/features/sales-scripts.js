/**
 * js/features/sales-scripts.js
 *
 * Recruiting Script Generator (Recruiting Sales Coach)
 * Recruiting scenarios, prompts, and premium card UI.
 *
 * Self-initializes. Exposes public functions on window.
 */

(function () {
  'use strict';

  // =====================================================
  // CENTRAL PROFILE INTEGRATION + SCENARIO DATA
  // =====================================================
  function getCentralProfile() {
    try {
      if (window.getUserProfile) return window.getUserProfile();
      return JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch (e) {
      return {};
    }
  }

  function getEffectiveSetup() {
    const central = getCentralProfile();
    return {
      ...central,
      name: central.name || '',
      email: central.email || '',
      localArea: central.localArea || central.market || '',
      voiceTraits: central.voiceTraits || [],
      personality: central.personality || '',
      tone: central.tone || 'Friendly & Relatable',
      targetPartners: central.targetPartners || central.partnerTypes || [],
      goals: central.goals || '',
      challenges: central.challenges || ''
    };
  }

  function buildSalesPersonalization() {
    const eff = getEffectiveSetup();
    let parts = [];

    if (eff.personality) parts.push(`Personality: ${eff.personality}`);
    if (eff.voiceTraits && eff.voiceTraits.length) parts.push(`Voice traits: ${eff.voiceTraits.join(', ')}`);
    if (eff.tone) parts.push(`Preferred tone: ${eff.tone}`);
    if (eff.localArea) parts.push(`Primary market: ${eff.localArea}`);
    if (eff.targetPartners && eff.targetPartners.length) parts.push(`Ideal LO candidates: ${eff.targetPartners.join(', ')}`);

    const base = 'Warm, curious Ruoff recruiter who leads with respect — never pushy, always relationship-first.';
    const vision = window.RECRUITING_PLAN_2026?.vision?.shortLine
      || window.RECRUITING_PLAN_2026?.vision?.statement
      || '';
    if (vision) parts.push(`Company vision to reinforce naturally when relevant: ${vision}`);
    parts.push('2026 team goal: 60 net hires; outreach discipline Tue–Thu phones; value before pitch.');
    return parts.length ? `${base} ${parts.join('. ')}.` : base;
  }

  function getRuoffFactSnippet() {
    if (typeof window.getRuoffFactContext === 'function') {
      try {
        const ctx = window.getRuoffFactContext('', 8);
        if (ctx) return `\nRUOFF FACT VAULT (use only when naturally relevant — never pitchy):\n${ctx}`;
      } catch (e) { /* ignore */ }
    }
    return '';
  }

  // Full improved scenario data for premium UI
  const CUSTOM_SCENARIOS_STORAGE_KEY = 'salesScriptCustomScenarios';

  function getSavedCustomScenarios() {
    try {
      return JSON.parse(localStorage.getItem(CUSTOM_SCENARIOS_STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveCustomScenario(text) {
    if (!text || !text.trim()) return;

    const saved = getSavedCustomScenarios();

    // Create a short label from the text
    const label = text.length > 70 ? text.substring(0, 67) + '...' : text;

    const newEntry = {
      id: 'custom_' + Date.now(),
      value: text.trim(),
      label: label,
      savedAt: new Date().toISOString()
    };

    // Avoid exact duplicates
    const exists = saved.find(s => s.value === newEntry.value);
    if (!exists) {
      saved.unshift(newEntry); // newest first
      // Keep only the last 15
      if (saved.length > 15) saved.length = 15;
      localStorage.setItem(CUSTOM_SCENARIOS_STORAGE_KEY, JSON.stringify(saved));
    }

    return newEntry;
  }

  function deleteCustomScenario(id) {
    let saved = getSavedCustomScenarios();
    saved = saved.filter(s => s.id !== id);
    localStorage.setItem(CUSTOM_SCENARIOS_STORAGE_KEY, JSON.stringify(saved));
  }

  function isCustomScenarioSaved(text) {
    if (!text) return false;
    const saved = getSavedCustomScenarios();
    return saved.some(s => s.value === text.trim());
  }

  const scenarioData = window.RECRUITING_SCENARIO_DATA || {
    custom: { label: 'Write Your Own Situation', icon: 'fa-edit', color: '#002B5C', scenarios: [] }
  };


  // =====================================================
  // ORIGINAL SALES SCRIPT CODE (moved from leaked block in index.html)
  // =====================================================

async function generateSalesScript() {
    const output = document.getElementById('script-output');

    // Get scenario from the new premium card UI (validate early, before showing loading)
    const context = document.getElementById('script-context')?.value.trim() || '';
    let scenario = currentSelectedScenario || '';

    if (!scenario) {
        alert('Please select or type a scenario');
        return;
    }

    // Use centralized force show for consistent premium progress modal (fixes lost modal)
    if (typeof window.forceShowGlobalLoading === 'function') {
      window.forceShowGlobalLoading('Crafting Your Personalized Scripts...');
    }

    // Rich custom loading (premium long-wait experience) - replaces card content after force ensures visibility
    const loadingEl = document.getElementById('global-loading');
    let originalLoadingHTML = '';
    if (loadingEl) {
      originalLoadingHTML = loadingEl.innerHTML;
      loadingEl.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
            <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-3xl border border-gray-200 dark:border-gray-700">
                <div class="text-center mb-8">
                    <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#F15A29] mb-5"></div>
                    <h3 class="text-3xl font-bold text-[#002B5C] dark:text-white mb-2 tracking-tight">
                        Crafting Your Personalized Scripts...
                    </h3>
                    <p class="text-lg text-gray-700 dark:text-gray-300 mb-1">
                        This usually takes 20–45 seconds
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Generating 4 natural scripts written in your exact voice and style.
                    </p>
                </div>

                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                    <h4 class="text-xl font-bold text-[#F15A29] mb-5 text-center">
                        What Makes These Scripts Powerful
                    </h4>
                    <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                        <div class="flex gap-3">
                            <i class="fas fa-comments text-[#F15A29] mt-0.5"></i>
                            <div><strong>Sound like you</strong> — Every script matches your personality, tone, and local market.</div>
                        </div>
                        <div class="flex gap-3">
                            <i class="fas fa-heart text-[#00A89D] mt-0.5"></i>
                            <div><strong>Relationship-first</strong> — Built to create trust and connection, not pressure.</div>
                        </div>
                        <div class="flex gap-3">
                            <i class="fas fa-bullseye text-[#002B5C] mt-0.5"></i>
                            <div><strong>Context-aware</strong> — The more details you gave, the more targeted and effective they are.</div>
                        </div>
                    </div>
                </div>

                <p class="text-center text-xs text-gray-500 dark:text-gray-400 mt-5">
                    Great scripts feel like a helpful conversation, not a sales pitch.
                </p>
            </div>
        </div>
      `;
      loadingEl.classList.remove('hidden');
      loadingEl.style.display = 'flex';
    }

    if (output) {
        output.innerHTML = '';
        output.classList.add('hidden');
    }

    const personalization = buildSalesPersonalization();

    const factSnippet = getRuoffFactSnippet();

    const prompt = `You are an expert recruiting sales coach helping Ruoff Mortgage recruiters have high-quality LO recruiting conversations.

RECRUITER PROFILE:
${personalization}
${factSnippet}

Generate exactly 4 varied, natural recruiting scripts for this situation:

Situation: "${scenario}"

${context ? `Additional context: ${context}` : ''}

Requirements for each script:
- 3–6 sentences — conversational, sayable on a live phone call
- Lead with curiosity and respect — never pushy or desperate
- Use open-ended discovery questions where appropriate
- For objections: acknowledge first, reframe around platform/long-term support (not just sign-on bonus)
- For leadership asks: position as low-risk, high-value, no-pressure clarity call
- Include a soft next step (leadership meeting, social connect, future touch)
- Match the recruiter's natural voice from the profile above
- Say "Ruoff" cleanly and confidently when referencing the company
- Do NOT invent specific compensation numbers or guarantees

CRITICAL FORMATTING:
- Start each with ## **Script 1** (bold header), ## **Script 2**, etc.
- Use **bold** for light emphasis where it feels natural
- Use - bullet points when listing questions or ideas
- Separate paragraphs with a blank line
- Do NOT use code blocks

Focus on quality conversation and moving qualified candidates toward leadership — not closing on the first call.`;

    let renderedHTML = '';

    try {
        console.log('[Sales Script] Starting generation...');
        console.log('[Sales Script] Prompt length:', prompt.length);

        // Centralized API call (Phase 0) - no more hardcoded key
        const raw = await window.callGrokAPI(prompt, {
            temperature: 0.8,
            max_tokens: 1400
        });

        if (!raw) {
            throw new Error('Empty response from API');
        }

        // Split on bold Script headers (includes the header in each chunk)
        let scriptSections = raw.split(/(?=\*\*Script \d+\*\*\s*\n)/i);

        // Clean up leading/trailing empty sections
        scriptSections = scriptSections
            .map(s => s.trim())
            .filter(s => s.length > 20);

        if (scriptSections.length === 0) {
            throw new Error('No valid scripts found in response');
        }

        let scriptsHTML = '<div class="space-y-20">';

        scriptSections.forEach((section, index) => {
            let contentMarkdown = section;

            // Extract title
            const titleMatch = contentMarkdown.match(/\*\*Script (\d+)\*\*/i);
            const title = titleMatch ? `Script ${titleMatch[1]}` : `Script ${index + 1}`;

            // Remove the title line from content
            contentMarkdown = contentMarkdown.replace(/\*\*Script \d+\*\*\s*\n?/i, '').trim();

            const scriptId = `script-${index}`;

            scriptsHTML += `
                <div class="bg-white dark:bg-gray-800 p-12 rounded-3xl shadow-2xl border-2 border-[#00A89D]/30">
                    <div class="flex items-center justify-between mb-8">
                        <h3 class="text-4xl font-black text-[#F15A29]">${title}</h3>
                        <div class="flex gap-3">
                            <button onclick="copySingleScript('${scriptId}', this)" 
                                    class="bg-gradient-to-r from-[#00A89D] to-[#F15A29] text-white px-6 py-3 rounded-full font-bold shadow-xl transition-all flex items-center gap-2 hover:opacity-90">
                                <i class="fas fa-copy"></i> <span>Copy</span>
                            </button>
                            <button onclick="saveSalesScript('${title}', '${scriptId}', this)" 
                                    class="border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white px-5 py-3 rounded-full font-semibold transition-all flex items-center gap-2">
                                <i class="far fa-bookmark"></i> <span>Save</span>
                            </button>
                        </div>
                    </div>
                    <div id="${scriptId}" class="prose prose-lg dark:prose-invert max-w-none leading-relaxed">
                        ${marked.parse(contentMarkdown || 'No content generated')}
                    </div>
                </div>
            `;
        });

        scriptsHTML += '</div>';

        renderedHTML = scriptsHTML;

        // Fixed: use scriptSections.length
        gtag('event', 'generate_scripts', {
            event_category: 'Tool Usage',
            event_label: 'Sales Scripts Generated',
            value: scriptSections.length || 1
        });

    } catch (err) {
        console.error('[Sales Script] Generation failed:', err.message, err.stack);
        renderedHTML = `<p class="text-red-600 text-center py-20 text-xl">
            Error: ${err.message || 'Failed to generate scripts'}<br>
            <small>(Check console for details)</small>
        </p>`;
    } finally {
        if (loadingEl) {
            loadingEl.innerHTML = originalLoadingHTML;
            loadingEl.classList.add('hidden');
            loadingEl.style.display = 'none';
        }

        if (output) {
            output.innerHTML = renderedHTML;

            // Auto-offer to save custom scenario after successful generation
            const wasCustom = currentSelectedScenario && 
                              !Object.values(scenarioData).some(cat => 
                                cat.scenarios && cat.scenarios.some(s => s.value === currentSelectedScenario)
                              );

            if (wasCustom && !isCustomScenarioSaved(currentSelectedScenario)) {
                const savePrompt = document.createElement('div');
                savePrompt.className = 'mt-6 p-4 rounded-2xl bg-[#00A89D]/5 border border-[#00A89D]/30 text-sm flex items-center justify-between';
                savePrompt.innerHTML = `
                    <div>
                        <span class="font-medium">Save this custom situation?</span> 
                        <span class="text-gray-600 dark:text-gray-400">So you can reuse it quickly next time.</span>
                    </div>
                    <button class="ml-4 px-4 py-1.5 rounded-full bg-[#00A89D] text-white text-xs font-semibold hover:bg-[#008F85] transition">
                        Save for Later
                    </button>
                `;

                const btn = savePrompt.querySelector('button');
                btn.onclick = () => {
                    saveCustomScenario(currentSelectedScenario);
                    savePrompt.innerHTML = `<div class="text-[#00A89D] font-medium">✓ Saved! You can find it under "Write Your Own Situation" next time.</div>`;
                    setTimeout(() => {
                        if (savePrompt.parentNode) savePrompt.parentNode.removeChild(savePrompt);
                    }, 2200);
                };

                output.insertBefore(savePrompt, output.firstChild);
            }

            output.classList.remove('hidden');
            output.scrollIntoView({ behavior: 'smooth' });
        }

        if (typeof confetti === 'function') {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
    }
}

// Fixed copy function – now receives the button element directly
function copySingleScript(scriptId, buttonEl) {
    const scriptEl = document.getElementById(scriptId);
    if (!scriptEl || !buttonEl) {
        alert('Script or button not found!');
        return;
    }

    const html = scriptEl.innerHTML;
    const plainText = scriptEl.innerText;

    const clipboardItem = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' })
    });

    navigator.clipboard.write([clipboardItem]).then(() => {
        const original = buttonEl.innerHTML;
        buttonEl.innerHTML = '<i class="fas fa-check"></i> Copied!';
        buttonEl.classList.replace('from-[#00A89D]', 'from-green-600');
        buttonEl.classList.replace('to-[#F15A29]', 'to-green-700');

        setTimeout(() => {
            buttonEl.innerHTML = original;
            buttonEl.classList.replace('from-green-600', 'from-[#00A89D]');
            buttonEl.classList.replace('to-green-700', 'to-[#F15A29]');
        }, 2000);
    }).catch(() => {
        // Fallback
        navigator.clipboard.writeText(plainText).then(() => {
            alert('Copied as plain text (rich formatting not supported)');
        }).catch(() => {
            alert('Copy failed — please select and copy manually');
        });
    });
}

// Save individual script to the global "My Saved Items" system
function saveSalesScript(title, scriptId, btnEl) {
    const scriptEl = document.getElementById(scriptId);
    if (!scriptEl) return;

    const text = scriptEl.innerText.trim();
    const fullTitle = `Recruiting Script: ${title}`;

    const STORAGE_KEY = 'socialSavedIdeas';
    let saved = [];
    try {
        saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {}

    const already = saved.some(item => item.title === fullTitle);
    if (already) {
        saved = saved.filter(item => item.title !== fullTitle);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        if (btnEl) {
            btnEl.innerHTML = '<i class="far fa-bookmark"></i> <span>Save</span>';
            btnEl.classList.remove('!bg-[#00A89D]', 'text-white', 'border-[#00A89D]', 'text-[#00A89D]');
            btnEl.title = '';
        }
        const countEl = document.getElementById('social-saved-count');
        if (countEl) countEl.textContent = saved.length;

        if (typeof window.showToast === 'function') {
            window.showToast('Removed from My Saved Items');
        }
        return;
    }

    const richContent = `
<div class="script-saved">
  <div class="mb-2">
    <span class="text-xs uppercase tracking-widest font-bold text-[#F15A29]">Recruiting Script</span>
  </div>
  <div class="text-sm mb-2"><strong>Scenario:</strong> ${title.replace('Recruiting Script: ', '')}</div>
  <div class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
    ${text}
  </div>
  <div class="mt-2 text-[10px] text-gray-500">Saved from Recruiting Script Generator • Personalized to your voice &amp; profile</div>
</div>`;
    saved.push({
        title: fullTitle,
        content: richContent,
        savedAt: new Date().toISOString(),
        type: 'script'   // Important for the unified Saved Items library
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
                btnEl.classList.add('text-[#00A89D]', 'border-[#00A89D]');
                btnEl.disabled = false;
            }
        }, 2800);
    }

    const countEl = document.getElementById('social-saved-count');
    if (countEl) countEl.textContent = saved.length;

    // Update global top bar count directly for reliability across all saves
    const globalCount = document.getElementById('global-saved-count');
    if (globalCount) globalCount.textContent = saved.length;

    // Try to notify the global saved ideas system
    if (typeof window.updateSavedCount === 'function') {
        try { window.updateSavedCount(); } catch(e) {}
    }

    if (typeof window.showSavedFeedback === 'function') {
        window.showSavedFeedback('Saved to My Saved Items');
    } else if (typeof window.showToast === 'function') {
        window.showToast('Saved to My Saved Items');
    }

    // Extra visible feedback inside the current tool
    const outputArea = document.getElementById('script-output');
    if (outputArea) {
        let note = outputArea.querySelector('.save-success-note');
        if (!note) {
            note = document.createElement('div');
            note.className = 'save-success-note mt-4 p-3 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm flex items-center gap-2';
            outputArea.appendChild(note);
        }
        note.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>
                Saved to <strong>My Saved Items</strong>. 
                <a href="#" onclick="showSavedItemsLibrary(); return false;" class="underline font-semibold">Open now</a>
            </span>
        `;
        setTimeout(() => {
            if (note && note.parentNode) note.parentNode.removeChild(note);
        }, 6500);
    }
}

// Helpful modal with suggested context for different scenario types
window.showContextTipsModal = function() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
            <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                    <h3 class="text-2xl font-bold">Tips for Better Scripts</h3>
                    <p class="text-sm text-gray-500">The more specific you are, the more personalized and effective the scripts become.</p>
                </div>
                <button class="text-3xl text-gray-400 hover:text-red-500" onclick="this.closest('.fixed').remove()">×</button>
            </div>
            <div class="p-6 overflow-y-auto max-h-[65vh] space-y-6 text-sm">
                <div>
                    <strong class="text-[#F15A29]">For Cold / Warm Outreach</strong>
                    <ul class="mt-2 list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                        <li>Production volume and purchase mix (30–70 units, 50%+ purchase ideal)</li>
                        <li>Current company and tenure</li>
                        <li>How you sourced them (Shape, LinkedIn, referral, event)</li>
                        <li>Any mutual connection or prior interaction</li>
                    </ul>
                </div>
                <div>
                    <strong class="text-[#F15A29]">For "Happy / Not Looking" Objections</strong>
                    <ul class="mt-2 list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                        <li>What do they love about their current situation?</li>
                        <li>Did you ask at least one discovery question before pivoting?</li>
                        <li>What platform/support gaps might matter at their production level?</li>
                        <li>Are they open to a low-pressure leadership clarity call?</li>
                    </ul>
                </div>
                <div>
                    <strong class="text-[#F15A29]">For Leadership Meeting Asks</strong>
                    <ul class="mt-2 list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                        <li>What specifically made them hesitate (time, pitch fear, loyalty)?</li>
                        <li>Who from leadership would be on the call?</li>
                        <li>What resonated when you mentioned platform vs. sign-on bonus?</li>
                        <li>What outcome would feel like a win even if they stay?</li>
                    </ul>
                </div>
                <div>
                    <strong class="text-[#F15A29]">For Nurture &amp; Follow-Up</strong>
                    <ul class="mt-2 list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                        <li>What did they say on the last call worth referencing?</li>
                        <li>Preferred follow-up window (3 months, fall, 6 months)?</li>
                        <li>LinkedIn vs. Facebook — where are they most active?</li>
                        <li>Any personal detail (family, hobby, market win) for a value-only touch?</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};
// Accordion toggle

  // =====================================================
  // PREMIUM UI: Category + Scenario Card Selectors
  // =====================================================
  let currentSelectedScenario = '';

  function renderCategoryCards() {
    const container = document.getElementById('sales-category-cards');
    if (!container) return;

    container.innerHTML = '';

    Object.keys(scenarioData).forEach(key => {
      const cat = scenarioData[key];
      const card = document.createElement('div');
      card.className = 'cursor-pointer border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:border-[#00A89D] hover:shadow-md transition-all flex items-start gap-3';

      // Special handling for "Write Your Own Situation" so we don't show "0 situations"
      const countHTML = (key === 'custom')
        ? `<div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Free-form</div>`
        : `<div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">${cat.scenarios.length} situations</div>`;

      card.innerHTML = `
        <div class="text-2xl mt-0.5" style="color: ${cat.color}">
          <i class="fas ${cat.icon}"></i>
        </div>
        <div>
          <div class="font-semibold text-[#002B5C] dark:text-white">${cat.label}</div>
          ${countHTML}
        </div>
      `;
      card.onclick = () => selectCategory(key, card);
      container.appendChild(card);
    });
  }

  function selectCategory(categoryKey, clickedCard) {
    // Deselect all cards
    document.querySelectorAll('#sales-category-cards > div').forEach(c => {
      c.classList.remove('!border-[#00A89D]', '!bg-[#00A89D]/5');
    });
    clickedCard.classList.add('!border-[#00A89D]', '!bg-[#00A89D]/5');

    // Hide any previous specific tip when changing categories
    const tipContainer = document.getElementById('scenario-context-tip');
    if (tipContainer) tipContainer.classList.add('hidden');

    // Render scenarios for this category
    renderScenarioCards(categoryKey);
  }

  function renderScenarioCards(categoryKey) {
    const container = document.getElementById('sales-scenario-cards');
    if (!container) return;

    const cat = scenarioData[categoryKey];
    if (!cat) return;

    container.innerHTML = '';

    // Special handling for "Write Your Own Situation"
    if (categoryKey === 'custom') {
      const savedCustoms = getSavedCustomScenarios();

      let html = '';

      if (savedCustoms.length > 0) {
        html += `<div class="col-span-full mb-2 flex items-center justify-between">
          <div class="text-sm font-semibold text-[#002B5C] dark:text-white">Your Saved Custom Situations</div>
          <button onclick="showManageCustomScenariosModal()" class="text-xs text-[#00A89D] hover:underline">Manage</button>
        </div>`;

        savedCustoms.forEach(item => {
          html += `
            <div class="group relative cursor-pointer border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:border-[#00A89D] transition-all text-sm"
                 data-custom-id="${item.id}">
              <div class="font-medium text-[#002B5C] dark:text-white leading-tight pr-6">${item.label}</div>
              <button class="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                      onclick="event.stopImmediatePropagation(); deleteAndRefreshCustom('${item.id}')">
                <i class="fas fa-times text-xs"></i>
              </button>
            </div>
          `;
        });

        html += `<div class="col-span-full mt-3">
          <div class="text-sm font-semibold text-[#002B5C] dark:text-white mb-2">Write a Brand New One</div>
        </div>`;
      } else {
        html += `<div class="col-span-full mb-2">
          <div class="text-sm font-semibold text-[#002B5C] dark:text-white">Describe Your Situation</div>
        </div>`;
      }

      html += `
        <div class="col-span-full">
          <textarea id="sales-custom-textarea" rows="4" 
                    class="w-full p-4 rounded-2xl border-2 border-[#00A89D] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-y"
                    placeholder="Describe the exact situation in your own words..."></textarea>
          <div class="flex justify-between items-center mt-2">
            <p class="text-xs text-gray-500 dark:text-gray-400">Be specific — the more details, the better the scripts.</p>
            <button id="save-custom-btn"
                    class="text-xs px-3 py-1.5 rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition hidden">
              Save for Later
            </button>
          </div>
        </div>
      `;

      container.innerHTML = html;

      const textarea = document.getElementById('sales-custom-textarea');
      const saveBtn = document.getElementById('save-custom-btn');

      if (textarea) {
        textarea.oninput = () => {
          currentSelectedScenario = textarea.value.trim();

          if (saveBtn && textarea.value.trim().length > 10) {
            saveBtn.classList.remove('hidden');
          } else if (saveBtn) {
            saveBtn.classList.add('hidden');
          }
        };

        // If user clicks into the textarea, treat it as "new custom"
        textarea.onfocus = () => {
          currentSelectedScenario = textarea.value.trim();
        };
      }

      if (saveBtn) {
        saveBtn.onclick = () => {
          const text = textarea.value.trim();
          if (text.length < 10) return;

          saveCustomScenario(text);

          // Refresh the custom view
          renderScenarioCards('custom');

          // Show toast
          if (typeof window.showToast === 'function') {
            window.showToast('Custom situation saved for next time');
          }
        };
      }

      // Attach click handlers to saved custom cards
      container.querySelectorAll('[data-custom-id]').forEach(card => {
        const id = card.dataset.customId;
        card.onclick = () => {
          const saved = getSavedCustomScenarios();
          const found = saved.find(s => s.id === id);
          if (!found) return;

          // Hide any context tip (custom doesn't have one)
          const tipContainer = document.getElementById('scenario-context-tip');
          if (tipContainer) tipContainer.classList.add('hidden');

          // Load into textarea
          const ta = document.getElementById('sales-custom-textarea');
          if (ta) {
            ta.value = found.value;
            currentSelectedScenario = found.value;

            // Show save button in case they edit it
            const sb = document.getElementById('save-custom-btn');
            if (sb) sb.classList.remove('hidden');
          }
        };
      });

      return;
    }

    // Normal categories
    cat.scenarios.forEach(sc => {
      const card = document.createElement('div');
      card.className = 'cursor-pointer border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:border-[#00A89D] transition-all text-sm flex items-start gap-2';
      card.innerHTML = `
        <div class="flex-1">
          <div class="font-medium text-[#002B5C] dark:text-white leading-tight">${sc.label}</div>
        </div>
      `;
      card.onclick = () => selectScenario(sc.value, sc.label, card);
      container.appendChild(card);
    });
  }

  function selectScenario(value, label, clickedCard) {
    // Deselect all scenario cards
    document.querySelectorAll('#sales-scenario-cards > div').forEach(c => {
      c.classList.remove('!border-[#00A89D]', '!bg-[#00A89D]/5');
    });
    clickedCard.classList.add('!border-[#00A89D]', '!bg-[#00A89D]/5');

    currentSelectedScenario = value;

    // Show contextual tip if this scenario has one
    showScenarioContextTip(value);
  }

  function showScenarioContextTip(scenarioValue) {
    const tipContainer = document.getElementById('scenario-context-tip');
    const tipText = document.getElementById('scenario-context-tip-text');
    if (!tipContainer || !tipText) return;

    // Search for the scenario across all categories
    let foundTip = null;
    Object.keys(scenarioData).forEach(catKey => {
      const cat = scenarioData[catKey];
      const found = cat.scenarios.find(s => s.value === scenarioValue);
      if (found && found.contextTip) {
        foundTip = found.contextTip;
      }
    });

    if (foundTip) {
      tipText.textContent = foundTip;
      tipContainer.classList.remove('hidden');
      tipContainer.classList.add('block');
    } else {
      tipContainer.classList.add('hidden');
      tipContainer.classList.remove('block');
    }
  }

  // Helper for deleting saved custom scenarios from the UI
  window.deleteAndRefreshCustom = function(id) {
    if (!confirm('Delete this saved custom situation?')) return;

    deleteCustomScenario(id);
    renderScenarioCards('custom');
  };

  window.showManageCustomScenariosModal = function() {
    const saved = getSavedCustomScenarios();
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4';
    
    let content = '';
    if (saved.length === 0) {
      content = `<p class="text-gray-500 italic">You haven't saved any custom situations yet.</p>`;
    } else {
      content = saved.map(item => `
        <div class="flex items-start justify-between border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-3">
          <div class="flex-1 pr-4 text-sm text-gray-700 dark:text-gray-300">${item.label}</div>
          <div class="flex gap-2">
            <button class="text-xs px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" 
                    onclick="loadCustomFromModal('${item.id}', this)">Load</button>
            <button class="text-xs px-3 py-1 rounded-full border border-red-200 text-red-600 hover:bg-red-50" 
                    onclick="deleteFromModal('${item.id}', this)">Delete</button>
          </div>
        </div>
      `).join('');
    }

    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-900 rounded-3xl max-w-xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
        <div class="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 class="text-xl font-bold">Manage Saved Custom Situations</h3>
          <button class="text-2xl leading-none text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" onclick="this.closest('.fixed').remove()">×</button>
        </div>
        <div class="p-5 overflow-y-auto max-h-[60vh]">
          ${content}
        </div>
        <div class="p-4 border-t border-gray-200 dark:border-gray-700 text-right">
          <button class="px-4 py-2 text-sm rounded-full border" onclick="this.closest('.fixed').remove()">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Attach global helpers for the modal buttons
    window.loadCustomFromModal = function(id, btn) {
      const savedList = getSavedCustomScenarios();
      const found = savedList.find(s => s.id === id);
      if (!found) return;

      // Switch to custom view and load it
      const modalEl = btn.closest('.fixed');
      if (modalEl) modalEl.remove();

      // Force open the custom category
      const customCatCard = Array.from(document.querySelectorAll('#sales-category-cards > div'))
        .find(el => el.textContent.includes('Write Your Own'));
      
      if (customCatCard) {
        customCatCard.click();
        // After render, load the value
        setTimeout(() => {
          const ta = document.getElementById('sales-custom-textarea');
          if (ta) {
            ta.value = found.value;
            currentSelectedScenario = found.value;
          }
        }, 50);
      }
    };

    window.deleteFromModal = function(id, btn) {
      if (!confirm('Delete this saved custom situation?')) return;
      deleteCustomScenario(id);
      // Refresh the modal
      const modalEl = btn.closest('.fixed');
      if (modalEl) modalEl.remove();
      showManageCustomScenariosModal();
      // Also refresh the main custom view if it's open
      const customCards = document.getElementById('sales-scenario-cards');
      if (customCards && customCards.innerHTML.includes('Your Saved Custom')) {
        renderScenarioCards('custom');
      }
    };
  };

  // Initialize the premium UI when DOM is ready
  function initPremiumSalesUI() {
    const categoryContainer = document.getElementById('sales-category-cards');
    if (categoryContainer) {
      renderCategoryCards();
    }

  }

  function bridgeToScriptGenerator(opts) {
    const { categoryKey, scenarioValue, context } = opts || {};
    if (typeof window.showSection === 'function') window.showSection('recruiting-script');

    setTimeout(() => {
      if (!document.getElementById('sales-category-cards')?.children?.length) {
        renderCategoryCards();
      }

      const keys = Object.keys(scenarioData);
      const catCards = document.querySelectorAll('#sales-category-cards > div');
      const idx = keys.indexOf(categoryKey);
      if (idx >= 0 && catCards[idx]) {
        selectCategory(categoryKey, catCards[idx]);
      }

      setTimeout(() => {
        if (scenarioValue && categoryKey && categoryKey !== 'custom') {
          const cat = scenarioData[categoryKey];
          const sc = cat?.scenarios?.find(s => s.value === scenarioValue);
          const scCards = document.querySelectorAll('#sales-scenario-cards > div');
          const scIdx = cat?.scenarios?.findIndex(s => s.value === scenarioValue) ?? -1;
          if (sc && scIdx >= 0 && scCards[scIdx]) {
            selectScenario(sc.value, sc.label, scCards[scIdx]);
          }
        }

        const ta = document.getElementById('script-context');
        if (ta && context) {
          ta.value = context;
          ta.focus();
        }

        if (typeof window.showToast === 'function') {
          window.showToast('Script Generator ready — review scenario & context, then generate', 'success');
        }
      }, 150);
    }, 350);
  }

  // =====================================================
  // PUBLIC API EXPOSURE
  // =====================================================
  window.bridgeToScriptGenerator = bridgeToScriptGenerator;
  window.generateSalesScript = generateSalesScript;
  window.copySingleScript = copySingleScript;
  window.saveSalesScript = saveSalesScript;
  window.toggleAccordion = toggleAccordion;

  // Initialize premium UI
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPremiumSalesUI);
  } else {
    initPremiumSalesUI();
  }

  console.log('%c[sales-scripts.js] Recruiting Script Generator initialized (Premium UI)', 'color:#00A89D');

})();
