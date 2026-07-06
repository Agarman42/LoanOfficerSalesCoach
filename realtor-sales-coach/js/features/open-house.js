/**
 * js/features/open-house.js
 *
 * Open House Script & Strategy Generator (Agent Sales Coach)
 */

(function () {
  'use strict';

  const PHASES = [
    {
      id: 'before',
      label: 'Before the Open House',
      subtitle: 'Setup checklist — print or pull up on your phone the night before.',
      icon: 'fa-clipboard-check',
      sections: ['SETUP_CHECKLIST']
    },
    {
      id: 'during',
      label: 'During the Open House',
      subtitle: 'Scripts and talking points to use live with visitors.',
      icon: 'fa-comments',
      sections: ['OPENING_SCRIPT', 'TALKING_POINTS', 'OBJECTIONS']
    },
    {
      id: 'after',
      label: 'After the Open House',
      subtitle: 'Capture every lead and follow up while you are still top of mind.',
      icon: 'fa-user-clock',
      sections: ['LEAD_CAPTURE']
    },
    {
      id: 'marketing',
      label: 'Turn It Into Content',
      subtitle: 'Social posts and Reel angles — separate from your live scripts.',
      icon: 'fa-video',
      sections: ['SOCIAL_ANGLES']
    }
  ];

  const SECTION_META = {
    SETUP_CHECKLIST: { title: 'Pre-Open House Setup Checklist', icon: 'fa-clipboard-list' },
    OPENING_SCRIPT: { title: '60-Second Opening Script', icon: 'fa-microphone' },
    TALKING_POINTS: { title: '5 High-Impact Talking Points', icon: 'fa-lightbulb' },
    OBJECTIONS: { title: 'Objections & Response Scripts', icon: 'fa-shield-alt' },
    LEAD_CAPTURE: { title: 'Lead Capture & Follow-Up Strategy', icon: 'fa-envelope-open-text' },
    SOCIAL_ANGLES: { title: 'Social & Reel Angles + Captions', icon: 'fa-share-alt' }
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parseOpenHouseResponse(text) {
    const raw = (text || '').trim();
    const sections = {};
    const markerPattern = /\[(SETUP_CHECKLIST|OPENING_SCRIPT|TALKING_POINTS|OBJECTIONS|LEAD_CAPTURE|SOCIAL_ANGLES)\]/gi;
    const matches = [...raw.matchAll(markerPattern)];

    if (matches.length >= 2) {
      matches.forEach((match, idx) => {
        const key = match[1].toUpperCase();
        const start = match.index + match[0].length;
        const end = idx + 1 < matches.length ? matches[idx + 1].index : raw.length;
        sections[key] = raw.slice(start, end).trim();
      });
      return sections;
    }

    // Fallback: split on numbered sections
    const parts = raw.split(/\n(?=\d+\.\s)/).map((p) => p.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
    const keys = ['SETUP_CHECKLIST', 'OPENING_SCRIPT', 'TALKING_POINTS', 'OBJECTIONS', 'LEAD_CAPTURE', 'SOCIAL_ANGLES'];
    parts.forEach((part, idx) => {
      if (keys[idx]) sections[keys[idx]] = part;
    });
    return sections;
  }

  function renderSectionCard(sectionKey, content, saveLabel) {
    const meta = SECTION_META[sectionKey] || { title: sectionKey, icon: 'fa-file-alt' };
    const safeTitle = escapeHtml(meta.title);
    const safeSaveLabel = (saveLabel || meta.title).replace(/'/g, "\\'");
    const body = escapeHtml(content);

    return `
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 h-full flex flex-col">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-start gap-3 min-w-0">
            <span class="w-9 h-9 rounded-2xl bg-[#002B5C]/10 flex items-center justify-center flex-shrink-0">
              <i class="fas ${meta.icon} text-[#002B5C] text-sm"></i>
            </span>
            <div class="font-bold text-[#002B5C] dark:text-white leading-snug">${safeTitle}</div>
          </div>
          <div class="flex gap-1.5 flex-shrink-0">
            <button type="button" onclick="navigator.clipboard.writeText(this.closest('.rounded-3xl').querySelector('[data-copy-body]')?.innerText?.trim()||''); this.textContent='Copied!'; setTimeout(()=>this.textContent='Copy',1200)" class="text-xs px-3 py-1 border border-[#002B5C] text-[#002B5C] hover:bg-[#002B5C] hover:text-white rounded-full">Copy</button>
            <button type="button" onclick="if(typeof window.toggleSaveIdea==='function'){const b=this.closest('.rounded-3xl');window.toggleSaveIdea('${safeSaveLabel}', b.querySelector('[data-copy-body]')?.innerText?.trim()||'', this, 'open-house');}" class="text-xs px-3 py-1 border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white rounded-full"><i class="far fa-bookmark"></i></button>
          </div>
        </div>
        <div data-copy-body class="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-[15px] flex-1">${body}</div>
      </div>`;
  }

  function renderKit(sections, propertyType) {
    const saveRoot = `Open House Kit - ${propertyType}`.replace(/'/g, "\\'");
    let html = `
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 mb-6">
        <div class="flex flex-wrap justify-between items-start gap-4">
          <div>
            <div class="text-[10px] font-bold tracking-[1.5px] text-[#00A89D] uppercase">Your Kit</div>
            <div class="font-bold text-[#002B5C] dark:text-white text-2xl">Open House Playbook</div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">Organized by when you use each piece — setup, live scripts, follow-up, and content.</p>
          </div>
          <div class="flex gap-2">
            <button type="button" onclick="navigator.clipboard.writeText(document.getElementById('oh-output')?.innerText?.replace(/Copy All|Save All Kit/g,'')?.trim()||''); this.textContent='Copied!'; setTimeout(()=>this.textContent='Copy All',1400)" class="text-xs px-4 py-2 border border-[#002B5C] text-[#002B5C] hover:bg-[#002B5C] hover:text-white rounded-full font-medium">Copy All</button>
            <button type="button" onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('${saveRoot}', document.getElementById('oh-output')?.innerText?.replace(/Copy All|Save All Kit/g,'')?.trim()||'', this, 'open-house');}" class="text-xs px-4 py-2 border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white rounded-full font-medium"><i class="far fa-bookmark"></i> Save All Kit</button>
          </div>
        </div>
      </div>`;

    PHASES.forEach((phase) => {
      const phaseSections = phase.sections.filter((key) => sections[key] && sections[key].length > 20);
      if (!phaseSections.length) return;

      let cardsHtml = '';
      if (phase.id === 'during') {
        if (sections.OPENING_SCRIPT) {
          cardsHtml += renderSectionCard('OPENING_SCRIPT', sections.OPENING_SCRIPT, `${SECTION_META.OPENING_SCRIPT.title} - ${propertyType}`);
        }
        if (sections.TALKING_POINTS || sections.OBJECTIONS) {
          cardsHtml += `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">`;
          if (sections.TALKING_POINTS) {
            cardsHtml += renderSectionCard('TALKING_POINTS', sections.TALKING_POINTS, `${SECTION_META.TALKING_POINTS.title} - ${propertyType}`);
          }
          if (sections.OBJECTIONS) {
            cardsHtml += renderSectionCard('OBJECTIONS', sections.OBJECTIONS, `${SECTION_META.OBJECTIONS.title} - ${propertyType}`);
          }
          cardsHtml += `</div>`;
        }
      } else {
        cardsHtml = phaseSections
          .map((key) => renderSectionCard(key, sections[key], `${SECTION_META[key]?.title || key} - ${propertyType}`))
          .join('');
      }

      html += `
        <div class="mb-8">
          <div class="flex items-center gap-3 mb-4">
            <span class="w-10 h-10 rounded-2xl bg-[#00A89D]/10 flex items-center justify-center">
              <i class="fas ${phase.icon} text-[#00A89D]"></i>
            </span>
            <div>
              <h3 class="font-bold text-[#002B5C] dark:text-white text-lg">${phase.label}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">${phase.subtitle}</p>
            </div>
          </div>
          <div class="space-y-4">${cardsHtml}</div>
        </div>`;
    });

    html += `
      <div class="p-4 bg-[#002B5C]/5 border border-[#002B5C]/15 rounded-2xl text-xs text-[#002B5C] dark:text-white">
        <strong>Agent Pro Tip:</strong> Print the setup checklist and opening script. Bring branded sign-in sheets. Follow up within 4 hours using the templates in the After section. Post one social angle the same day and tag the listing agent.
      </div>`;

    return html;
  }

  async function generateOpenHouse() {
    const goal = document.getElementById('oh-goal')?.value || 'leads';
    const propertyType = document.getElementById('oh-property-type')?.value || 'Single Family Home';
    const price = document.getElementById('oh-price')?.value || 'Under $400k';
    const season = document.getElementById('oh-season')?.value || 'Spring Market';
    const personality = document.getElementById('oh-personality')?.value || 'Friendly & Approachable';
    const ohType = document.getElementById('oh-type')?.value || 'In-Person';
    const duration = document.getElementById('oh-duration')?.value || '2 hours';
    const audience = document.getElementById('oh-audience')?.value || 'Mix of buyers';
    const custom = (document.getElementById('oh-custom')?.value || '').trim();

    const featContainer = document.getElementById('oh-features') || document;
    const checked = featContainer.querySelectorAll('input[type="checkbox"]:checked');
    const features = Array.from(checked).map(cb => cb.value).filter(Boolean);

    if (typeof window.showAgentLoading === 'function') {
      window.showAgentLoading('Building your complete open house script & strategy kit...');
    } else if (typeof window.showRealtorLoading === 'function') {
      window.showRealtorLoading('Building your complete open house script & strategy kit...');
    } else if (document.getElementById('global-loading')) {
      document.getElementById('global-loading').classList.remove('hidden');
    }

    const output = document.getElementById('oh-output');
    if (output) { output.classList.add('hidden'); output.innerHTML = ''; }

    const prompt = `You are an elite real estate agent coach specializing in high-converting open houses. Create a complete, ready-to-use open house kit for this listing. Use as many of the highlighted features as possible to create specific, memorable talking points that differentiate this property.

Primary goal: ${goal}
Open House Type: ${ohType}
Property type: ${propertyType}
Price range: ${price}
Season / Market Timing: ${season}
Agent style: ${personality}
Expected duration: ${duration}
Target audience: ${audience}

Key features to highlight (use ALL selected for tailored scripts and social content):
${features.length ? features.map(f => '- ' + f).join('\n') : 'Use best practices for the property type'}

${custom ? `Custom notes or must-mention items: ${custom}` : ''}

CRITICAL OUTPUT RULES:
- Live open house scripts (opening, talking points, objections) must stay separate from social/Reel captions.
- Use the exact section markers below. Each marker on its own line. Content only between markers.
- Use bullet points and short, natural language an agent would actually say.
- Do not repeat the same content across sections.

OUTPUT FORMAT (follow exactly):

[SETUP_CHECKLIST]
Pre-open setup checklist only: signage, refreshments, sign-in tech, lighting, partner co-branding, safety. Bullet checklist format.

[OPENING_SCRIPT]
60-second opening script only. Warm, confident, on-brand. What the agent says when guests arrive. No social captions here.

[TALKING_POINTS]
Exactly 5 high-impact talking points only. Tie selected features to lifestyle/emotion. Numbered 1–5.

[OBJECTIONS]
Top objections and response scripts only (price, condition, timing, competition, "need to think about it"). Objection → response pairs.

[LEAD_CAPTURE]
Lead capture and follow-up strategy only: sign-in approach, text/email templates, 48-hour and 1-week touches. No live scripts or social posts here.

[SOCIAL_ANGLES]
Exactly 3 ready-to-post social/Reel angles with captions only. Include one that tags the listing agent or partner. No live open house dialogue here.

Keep everything actionable, warm, professional, and lead-focused.`;

    try {
      const raw = await window.callGrokAPI(prompt, { temperature: 0.7, max_tokens: 2800 });
      const text = (raw || '').trim();

      if (!output) return;

      const sections = parseOpenHouseResponse(text);
      const hasAnySection = Object.values(sections).some((v) => v && v.length > 20);

      if (hasAnySection) {
        output.innerHTML = renderKit(sections, propertyType);
      } else {
        output.innerHTML = `
          <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-8">
            <div class="flex justify-between items-center mb-4">
              <div class="font-bold text-[#002B5C] text-xl">Your Open House Kit</div>
              <button onclick="navigator.clipboard.writeText(this.closest('.rounded-3xl').querySelector('[data-copy-body]')?.innerText?.trim()||''); this.textContent='Copied!'; setTimeout(()=>this.textContent='Copy All',1400)" class="text-xs px-3 py-1 border border-[#002B5C] text-[#002B5C] hover:bg-[#002B5C] hover:text-white rounded-full">Copy All</button>
            </div>
            <div data-copy-body class="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-[15px]">${escapeHtml(text)}</div>
          </div>`;
      }

      output.classList.remove('hidden');
    } catch (e) {
      console.error(e);
      if (output) {
        output.innerHTML = `<div class="p-6 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-2xl text-red-700">Generation failed. Please try again.</div>`;
        output.classList.remove('hidden');
      }
    } finally {
      if (typeof window.hideLoading === 'function') {
        window.hideLoading();
      } else if (document.getElementById('global-loading')) {
        document.getElementById('global-loading').classList.add('hidden');
      }
    }
  }

  window.generateOpenHouse = generateOpenHouse;
  console.log('[Agent] Open House feature loaded');
})();