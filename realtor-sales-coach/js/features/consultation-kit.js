/**
 * js/features/consultation-kit.js
 *
 * Buyer/Seller Consultation Prep Kit (Agent Sales Coach)
 */

(function () {
  'use strict';

  const PRESET_LABELS = {
    custom: 'Custom Client',
    'first-time-buyer': 'First-Time Buyer',
    'move-up': 'Move-Up Buyer',
    downsizing: 'Downsizing / Empty Nester',
    relocation: 'Relocating Client',
    divorce: 'Life Transition',
    inheritance: 'Inherited Property',
    investor: 'Investor',
    fsbo: 'FSBO Seller'
  };

  const TYPE_LABELS = {
    both: 'Buyer & Seller',
    listing: 'Listing Presentation',
    buyer: 'Buyer Consultation'
  };

  const PHASES = [
    {
      id: 'prep',
      label: 'Before the Appointment',
      subtitle: 'Arrive with rapport hooks, market context, and comp language ready.',
      icon: 'fa-clipboard-check',
      sections: ['OPENING_RAPPORT', 'MARKET_SNAPSHOT', 'COMPS_SUMMARY']
    },
    {
      id: 'during',
      label: 'During the Consult',
      subtitle: 'Pricing, numbers, and questions that uncover true motivation.',
      icon: 'fa-comments',
      sections: ['PRICING_STRATEGY', 'FINANCIAL_BREAKDOWN', 'CONVERSATION_STARTERS']
    },
    {
      id: 'close',
      label: 'Handle Pushback & Close',
      subtitle: 'Natural responses to the objections this client type raises most.',
      icon: 'fa-shield-alt',
      sections: ['OBJECTIONS']
    },
    {
      id: 'after',
      label: 'After the Consult',
      subtitle: 'Lock the next step and follow up while you are still top of mind.',
      icon: 'fa-calendar-check',
      sections: ['FOLLOW_UP_PLAN']
    }
  ];

  const SECTION_META = {
    OPENING_RAPPORT: { title: 'Opening & Rapport Builders', icon: 'fa-handshake', subtitle: 'Personalized connection openers' },
    MARKET_SNAPSHOT: { title: 'Market Snapshot', icon: 'fa-chart-line', subtitle: 'Local trends · inventory · buyer demand' },
    COMPS_SUMMARY: { title: 'Comparable Sales Summary', icon: 'fa-home', subtitle: '3–5 realistic comps with insights' },
    PRICING_STRATEGY: { title: 'Pricing Strategy', icon: 'fa-tags', subtitle: 'Listing price or affordability framing' },
    FINANCIAL_BREAKDOWN: { title: 'Net Sheet / Payment Breakdown', icon: 'fa-calculator', subtitle: 'Numbers explained simply' },
    CONVERSATION_STARTERS: { title: 'Conversation Starters & Deep Questions', icon: 'fa-lightbulb', subtitle: 'Build trust · uncover motivation' },
    OBJECTIONS: { title: 'Top Objections & Response Scripts', icon: 'fa-shield-alt', subtitle: 'Tailored to this client type' },
    FOLLOW_UP_PLAN: { title: 'Next Steps & Follow-Up Plan', icon: 'fa-envelope-open-text', subtitle: '48-hour · 1-week · 30-day touches' }
  };

  window._lastConsultationKit = null;

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatKitBody(text, options) {
    options = options || {};
    const raw = (text || '').trim();
    if (!raw) return '';

    const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean);
    const listLike = options.forceList || (
      lines.length > 1 && lines.every((line) => /^[-•*]\s/.test(line) || /^\d+[.)]\s/.test(line) || /^[A-Z][a-z]+.*:\s/.test(line))
    );

    if (listLike) {
      const items = lines.map((line) => {
        const cleaned = line.replace(/^[-•*]\s*/, '').replace(/^\d+[.)]\s*/, '');
        return `<li class="leading-relaxed">${escapeHtml(cleaned)}</li>`;
      }).join('');
      return `<ul class="list-disc pl-5 space-y-2 text-[15px] text-gray-700 dark:text-gray-300">${items}</ul>`;
    }

    return `<div class="text-[15px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">${escapeHtml(raw)}</div>`;
  }

  function parseConsultationResponse(text) {
    const raw = (text || '').trim();
    const sections = {};
    const markerPattern = /\[(OPENING_RAPPORT|MARKET_SNAPSHOT|COMPS_SUMMARY|PRICING_STRATEGY|FINANCIAL_BREAKDOWN|CONVERSATION_STARTERS|OBJECTIONS|FOLLOW_UP_PLAN)\]/gi;
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

    const parts = raw.split(/\n(?=\d+\.\s)/).map((p) => p.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
    const keys = [
      'OPENING_RAPPORT',
      'MARKET_SNAPSHOT',
      'COMPS_SUMMARY',
      'PRICING_STRATEGY',
      'FINANCIAL_BREAKDOWN',
      'CONVERSATION_STARTERS',
      'OBJECTIONS',
      'FOLLOW_UP_PLAN'
    ];
    parts.forEach((part, idx) => {
      if (keys[idx]) sections[keys[idx]] = part;
    });
    return sections;
  }

  function renderSectionCard(sectionKey, content, context, options) {
    options = options || {};
    const meta = SECTION_META[sectionKey] || { title: sectionKey, icon: 'fa-file-alt', subtitle: '' };
    const safeTitle = escapeHtml(meta.title);
    const label = context.label || 'this client';
    const saveLabel = `${meta.title} - ${label}`.replace(/'/g, "\\'");
    const body = formatKitBody(content, {
      forceList: sectionKey === 'OBJECTIONS' || sectionKey === 'FOLLOW_UP_PLAN' || sectionKey === 'CONVERSATION_STARTERS'
    });

    const actions = options.includeActions === false ? '' : `
          <div class="flex gap-1.5 flex-shrink-0">
            <button type="button" onclick="navigator.clipboard.writeText(this.closest('.rounded-3xl').querySelector('[data-copy-body]')?.innerText?.trim()||''); this.textContent='Copied!'; setTimeout(()=>this.textContent='Copy',1200)" class="text-xs px-3 py-1 border border-[#002B5C] text-[#002B5C] hover:bg-[#002B5C] hover:text-white rounded-full">Copy</button>
            <button type="button" onclick="if(typeof window.toggleSaveIdea==='function'){const b=this.closest('.rounded-3xl');window.toggleSaveIdea('${saveLabel.replace(/'/g, "\\'")}', typeof window.buildSaveableSectionHtml==='function'?window.buildSaveableSectionHtml(b):(b.querySelector('[data-copy-body]')?.innerText?.trim()||''), this, 'consultation', {format:'html'});}" class="text-xs px-3 py-1 border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white rounded-full"><i class="far fa-bookmark"></i></button>
          </div>`;

    const subtitle = meta.subtitle ? `<p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">${escapeHtml(meta.subtitle)}</p>` : '';

    return `
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 h-full flex flex-col shadow-sm">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-start gap-3 min-w-0">
            <span class="w-9 h-9 rounded-2xl bg-[#002B5C]/10 flex items-center justify-center flex-shrink-0">
              <i class="fas ${meta.icon} text-[#002B5C] text-sm"></i>
            </span>
            <div>
              <div class="font-bold text-[#002B5C] dark:text-white leading-snug">${safeTitle}</div>
              ${subtitle}
            </div>
          </div>
          ${actions}
        </div>
        <div data-copy-body class="max-w-none flex-1">${body}</div>
      </div>`;
  }

  function renderPhaseCards(phase, sections, context, cardOpts) {
    if (phase.id === 'during') {
      let html = '';
      const pricingKeys = ['PRICING_STRATEGY', 'FINANCIAL_BREAKDOWN'].filter((key) => sections[key] && sections[key].length > 20);
      if (pricingKeys.length) {
        html += `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">`;
        pricingKeys.forEach((key) => {
          html += renderSectionCard(key, sections[key], context, cardOpts);
        });
        html += `</div>`;
      }
      if (sections.CONVERSATION_STARTERS && sections.CONVERSATION_STARTERS.length > 20) {
        html += `<div class="${pricingKeys.length ? 'mt-4' : ''}">${renderSectionCard('CONVERSATION_STARTERS', sections.CONVERSATION_STARTERS, context, cardOpts)}</div>`;
      }
      return html;
    }

    return phase.sections
      .filter((key) => sections[key] && sections[key].length > 20)
      .map((key) => renderSectionCard(key, sections[key], context, cardOpts))
      .join('');
  }

  function renderKit(sections, context, options) {
    options = options || {};
    const includeActions = options.includeActions !== false;
    const forVault = !!options.forVault;
    const label = context.label || 'Consultation';
    const consultType = context.consultType || 'both';
    const cardOpts = { includeActions: includeActions && !forVault, forVault };

    let html = '';

    if (!forVault) {
      html += `
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 mb-6">
        <div class="flex flex-wrap justify-between items-start gap-4">
          <div>
            <div class="text-[10px] font-bold tracking-[1.5px] text-[#00A89D] uppercase">Your Kit</div>
            <div class="font-bold text-[#002B5C] dark:text-white text-2xl">Consultation Prep Kit</div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">${escapeHtml(label)} · ${escapeHtml(TYPE_LABELS[consultType] || consultType)} — organized by when you use each piece.</p>
          </div>
          ${includeActions ? `<div class="flex gap-2">
            <button type="button" onclick="navigator.clipboard.writeText(document.getElementById('consult-output')?.innerText?.replace(/Copy All|Save Full Kit/g,'')?.trim()||''); this.textContent='Copied!'; setTimeout(()=>this.textContent='Copy All',1400)" class="text-xs px-4 py-2 border border-[#002B5C] text-[#002B5C] hover:bg-[#002B5C] hover:text-white rounded-full font-medium">Copy All</button>
            <button type="button" onclick="if(typeof window.saveConsultationKit==='function')window.saveConsultationKit(this);" class="text-xs px-4 py-2 border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white rounded-full font-medium"><i class="far fa-bookmark"></i> Save Full Kit</button>
          </div>` : ''}
        </div>
      </div>`;
    } else {
      html += `
      <div class="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div class="text-[10px] font-bold tracking-[1.5px] text-[#00A89D] uppercase">Saved Kit</div>
        <div class="font-bold text-[#002B5C] dark:text-white text-xl mt-1">Consultation Prep — ${escapeHtml(label)}</div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Before · During · Close · After — same layout as the generator.</p>
      </div>`;
    }

    PHASES.forEach((phase) => {
      const hasContent = phase.sections.some((key) => sections[key] && sections[key].length > 20);
      if (!hasContent) return;

      const cardsHtml = renderPhaseCards(phase, sections, context, cardOpts);

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

    if (!forVault) {
      html += `
        <div class="p-4 bg-[#002B5C]/5 border border-[#002B5C]/15 rounded-2xl text-xs text-[#002B5C] dark:text-white">
          <strong>Agent Pro Tip:</strong> Bring printed net sheets or affordability breakdowns. End the consult by booking the next step on the spot ("Shall we lock in the listing appointment for Thursday at 2pm?"). Save the full kit to My Saved Items for similar clients later.
        </div>`;
    }

    return html;
  }

  window.renderSavedConsultationKit = function renderSavedConsultationKit(kitData, options) {
    if (!kitData || !kitData.sections) return '<p class="text-gray-500">No consultation kit saved.</p>';
    return renderKit(kitData.sections, {
      label: kitData.label,
      consultType: kitData.consultType,
      preset: kitData.preset,
      address: kitData.address
    }, { forVault: true, includeActions: false, ...(options || {}) });
  };

  window.consultationKitToPlainText = function consultationKitToPlainText(kitData) {
    if (!kitData || !kitData.sections) return '';
    return PHASES.map((phase) => {
      const blocks = phase.sections
        .filter((key) => kitData.sections[key])
        .map((key) => {
          const title = SECTION_META[key]?.title || key;
          return `${title}\n${kitData.sections[key]}`;
        });
      if (!blocks.length) return '';
      return `${phase.label}\n${blocks.join('\n\n')}`;
    }).filter(Boolean).join('\n\n---\n\n');
  };

  window.saveConsultationKit = function saveConsultationKit(btn) {
    const kit = window._lastConsultationKit;
    if (!kit || !Object.values(kit.sections || {}).some((v) => v && v.length > 20)) {
      if (typeof window.notifyUser === 'function') {
        window.notifyUser('Generate a kit first, then save.', 'warning', 2800);
      } else if (typeof window.showToast === 'function') {
        window.showToast('Generate a kit first, then save.', 'warning');
      }
      return;
    }

    const title = `Consultation Kit - ${kit.label}`;
    const summary = window.consultationKitToPlainText(kit).slice(0, 500);

    if (typeof window.toggleSaveIdea === 'function') {
      window.toggleSaveIdea(title, summary, btn, 'consultation', {
        format: 'kit',
        kit: 'consultation-package',
        kitData: kit,
        summary
      });
      if (typeof window.showToast === 'function') {
        window.showToast('Full consultation kit saved to My Saved Items.', 'success');
      }
    }
  };

  async function generateConsultationKit() {
    const preset = document.getElementById('consult-preset')?.value || 'custom';
    const type = document.getElementById('consult-type')?.value || 'both';
    const address = (document.getElementById('consult-address')?.value || '').trim();
    const price = (document.getElementById('consult-price')?.value || '').trim();
    const personal = (document.getElementById('consult-personal')?.value || '').trim();
    const goals = (document.getElementById('consult-goals')?.value || '').trim();
    const clientStage = document.getElementById('consult-stage')?.value || 'First meeting';
    const urgency = document.getElementById('consult-urgency')?.value || 'Standard timeline';

    const focusContainer = document.getElementById('consult-prep-focuses') || document;
    const focusChecks = focusContainer.querySelectorAll('input[type="checkbox"]:checked');
    const prepFocuses = Array.from(focusChecks).map(cb => (cb.value || '').trim()).filter(Boolean);

    if (typeof window.showAgentLoading === 'function') {
      window.showAgentLoading('Building your complete buyer/seller consultation prep kit...');
    } else if (typeof window.showRealtorLoading === 'function') {
      window.showRealtorLoading('Building your complete buyer/seller consultation prep kit...');
    } else if (document.getElementById('global-loading')) {
      document.getElementById('global-loading').classList.remove('hidden');
    }

    const output = document.getElementById('consult-output');
    if (output) { output.classList.add('hidden'); output.innerHTML = ''; }

    const prompt = `You are an elite real estate agent coach. Create a complete, professional consultation prep kit for this client appointment. Incorporate the selected key client highlights/situation flags into rapport, objections, and strategy sections for hyper-personalized output.

Quick scenario: ${preset === 'custom' ? 'Fully custom' : preset}
Appointment type: ${type}
Property address: ${address || 'in a competitive local market'}
Price range/expected sale: ${price || 'market-appropriate'}
Client personal details: ${personal || 'Not provided'}
Client goals/concerns/timeline: ${goals || 'Standard consultation'}
Client stage: ${clientStage}
Urgency / Timeline: ${urgency}

Key client highlights / situation (weave these directly into the kit):
${(() => { const c = document.getElementById('consult-features'); if (!c) return ''; const checked = c.querySelectorAll('input[type="checkbox"]:checked'); return Array.from(checked).map(cb => '- ' + cb.value).join('\n') || 'None selected'; })() }
${prepFocuses.length ? `Key prep focuses / strategy emphases to highlight in the kit:\n${prepFocuses.map(f => '- ' + f).join('\n')}` : ''}

CRITICAL OUTPUT RULES:
- Use the exact section markers below. Each marker must appear on its own line. Put content only between markers — no extra headings or numbered lists outside the markers.
- For listing appointments, emphasize pricing strategy and seller net sheet in the relevant sections. For buyer appointments, emphasize affordability and monthly payment breakdown.
- Make everything warm, client-centered, and confidence-building.

OUTPUT FORMAT (follow exactly):

[OPENING_RAPPORT]
Personalized opening lines and rapport builders using personal details and selected highlights for emotional connection.

[MARKET_SNAPSHOT]
Current local trends, inventory, days on market, and buyer demand — helpful and current-feeling.

[COMPS_SUMMARY]
3–5 realistic comparable sales with insights (placeholder comps the agent can fill with actual numbers).

[PRICING_STRATEGY]
Listing pricing strategy OR buyer affordability snapshot with emotional framing — tailored to appointment type (${type}).

[FINANCIAL_BREAKDOWN]
Estimated seller net sheet OR buyer monthly payment breakdown with realistic placeholders and simple explanations.

[CONVERSATION_STARTERS]
Key conversation starters and deep questions that build trust and uncover true motivation.

[OBJECTIONS]
Top 5 likely objections and natural response scripts tailored for this client type (reference selected highlights).

[FOLLOW_UP_PLAN]
Next steps and follow-up plan: immediate actions, 48-hour, 1-week, and 30-day touches.

Use emotional language that shows empathy and positions the agent as the trusted expert. Help the agent win the business and look like a pro.`;

    try {
      const raw = await window.callGrokAPI(prompt, { temperature: 0.7, max_tokens: 3000 });
      const text = (raw || '').trim();

      if (!output) return;

      const sections = parseConsultationResponse(text);
      const hasAnySection = Object.values(sections).some((v) => v && v.length > 20);
      const label = address || PRESET_LABELS[preset] || 'Custom Client';

      if (hasAnySection) {
        const context = {
          preset,
          consultType: type,
          address: address || '',
          label
        };
        window._lastConsultationKit = { ...context, sections };
        output.innerHTML = renderKit(sections, context);
      } else {
        window._lastConsultationKit = null;
        output.innerHTML = `<div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-8"><div class="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">${escapeHtml(text)}</div></div>`;
      }

      output.classList.remove('hidden');
    } catch (e) {
      console.error(e);
      window._lastConsultationKit = null;
      if (output) {
        output.innerHTML = `<div class="p-6 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-2xl text-red-700">Generation failed. Try again.</div>`;
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

  window.generateConsultationKit = generateConsultationKit;
  console.log('[Agent] Consultation Kit feature loaded');
})();