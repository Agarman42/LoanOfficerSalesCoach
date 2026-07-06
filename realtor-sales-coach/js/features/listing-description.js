/**
 * js/features/listing-description.js
 *
 * Smart Listing Description Generator (Agent Sales Coach)
 */

(function () {
  'use strict';

  const PHASES = [
    {
      id: 'descriptions',
      label: 'Listing Descriptions',
      subtitle: 'Three ready-to-publish lengths — MLS, social, and short teaser.',
      icon: 'fa-pen-fancy',
      sections: ['MLS_DESCRIPTION', 'ZILLOW_DESCRIPTION', 'TEASER']
    },
    {
      id: 'marketing',
      label: 'Turn It Into Content',
      subtitle: 'Reel scripts for the day the listing goes live — separate from listing copy.',
      icon: 'fa-video',
      sections: ['REEL_SCRIPTS']
    }
  ];

  const SECTION_META = {
    MLS_DESCRIPTION: { title: 'MLS-Length Description', icon: 'fa-file-alt', subtitle: '~250 words · SEO-optimized' },
    ZILLOW_DESCRIPTION: { title: 'Zillow / Social Length', icon: 'fa-share-alt', subtitle: '~400 words · lifestyle storytelling' },
    TEASER: { title: 'Short Teaser', icon: 'fa-bolt', subtitle: '75–100 words · caption or ad hook' },
    REEL_SCRIPTS: { title: 'Ready-to-Film Reel Scripts', icon: 'fa-film', subtitle: '15–30 seconds each' }
  };

  window._lastListingKit = null;

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

  function parseListingResponse(text) {
    const raw = (text || '').trim();
    const sections = {};
    const markerPattern = /\[(MLS_DESCRIPTION|ZILLOW_DESCRIPTION|TEASER|REEL_1|REEL_2)\]/gi;
    const matches = [...raw.matchAll(markerPattern)];

    if (matches.length >= 3) {
      matches.forEach((match, idx) => {
        const key = match[1].toUpperCase();
        const start = match.index + match[0].length;
        const end = idx + 1 < matches.length ? matches[idx + 1].index : raw.length;
        sections[key] = raw.slice(start, end).trim();
      });
    } else {
      const parts = raw.split(/\n(?=\d+\.\s)/).map((p) => p.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
      const reelStart = parts.findIndex((p) => /reel|video script|15[–-]?30\s*second/i.test(p));
      const descParts = reelStart >= 0 ? parts.slice(0, reelStart) : parts.slice(0, 3);

      if (descParts[0]) sections.MLS_DESCRIPTION = descParts[0];
      if (descParts[1]) sections.ZILLOW_DESCRIPTION = descParts[1];
      if (descParts[2]) sections.TEASER = descParts[2];

      const reelParts = reelStart >= 0 ? parts.slice(reelStart) : [];
      if (reelParts[0]) sections.REEL_1 = reelParts[0];
      if (reelParts[1]) sections.REEL_2 = reelParts[1];
    }

    const reelCombined = [sections.REEL_1, sections.REEL_2].filter(Boolean).join('\n\n---\n\n');
    if (reelCombined.length > 40) sections.REEL_SCRIPTS = reelCombined;

    return sections;
  }

  function renderSectionCard(sectionKey, content, context, options) {
    options = options || {};
    const meta = SECTION_META[sectionKey] || { title: sectionKey, icon: 'fa-file-alt', subtitle: '' };
    const safeTitle = escapeHtml(meta.title);
    const address = context.address || 'this property';
    const safeAddress = address.replace(/'/g, "\\'");
    const saveLabel = `${meta.title} for ${address}`.replace(/'/g, "\\'");
    const body = formatKitBody(content, { forceList: sectionKey === 'REEL_SCRIPTS' });

    const actions = options.includeActions === false ? '' : `
          <div class="flex gap-1.5 flex-shrink-0">
            <button type="button" onclick="navigator.clipboard.writeText(this.closest('.rounded-3xl').querySelector('[data-copy-body]')?.innerText?.trim()||''); this.textContent='Copied!'; setTimeout(()=>this.textContent='Copy',1200)" class="text-xs px-3 py-1 border border-[#002B5C] text-[#002B5C] hover:bg-[#002B5C] hover:text-white rounded-full">Copy</button>
            <button type="button" onclick="if(typeof window.toggleSaveIdea==='function'){const b=this.closest('.rounded-3xl');window.toggleSaveIdea('${saveLabel.replace(/'/g, "\\'")}', typeof window.buildSaveableSectionHtml==='function'?window.buildSaveableSectionHtml(b):(b.querySelector('[data-copy-body]')?.innerText?.trim()||''), this, 'listings', {format:'html'});}" class="text-xs px-3 py-1 border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white rounded-full"><i class="far fa-bookmark"></i></button>
          </div>`;

    const subtitle = meta.subtitle ? `<p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">${escapeHtml(meta.subtitle)}</p>` : '';
    const reelTip = sectionKey === 'REEL_SCRIPTS' && !options.forVault
      ? `<div class="mt-3 text-[11px] text-gray-500">Film vertically on your phone. Use trending audio + big text overlays. Post the same day the listing goes live.</div>`
      : '';

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
        ${reelTip}
      </div>`;
  }

  function renderPackage(sections, context, options) {
    options = options || {};
    const includeActions = options.includeActions !== false;
    const forVault = !!options.forVault;
    const address = context.address || 'this property';
    const propertyType = context.propertyType || 'Listing';
    const label = address !== 'this property' ? address : propertyType;
    const cardOpts = { includeActions: includeActions && !forVault, forVault };

    let html = '';

    if (!forVault) {
      html += `
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 mb-6">
        <div class="flex flex-wrap justify-between items-start gap-4">
          <div>
            <div class="text-[10px] font-bold tracking-[1.5px] text-[#00A89D] uppercase">Your Package</div>
            <div class="font-bold text-[#002B5C] dark:text-white text-2xl">Listing Description Package</div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">${escapeHtml(label)} — MLS, social, teaser, and Reel scripts in one place.</p>
          </div>
          ${includeActions ? `<div class="flex gap-2">
            <button type="button" onclick="navigator.clipboard.writeText(document.getElementById('listing-output')?.innerText?.replace(/Copy All|Save Full Package/g,'')?.trim()||''); this.textContent='Copied!'; setTimeout(()=>this.textContent='Copy All',1400)" class="text-xs px-4 py-2 border border-[#002B5C] text-[#002B5C] hover:bg-[#002B5C] hover:text-white rounded-full font-medium">Copy All</button>
            <button type="button" onclick="if(typeof window.saveListingPackage==='function')window.saveListingPackage(this);" class="text-xs px-4 py-2 border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white rounded-full font-medium"><i class="far fa-bookmark"></i> Save Full Package</button>
          </div>` : ''}
        </div>
      </div>`;
    } else {
      html += `
      <div class="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div class="text-[10px] font-bold tracking-[1.5px] text-[#00A89D] uppercase">Saved Package</div>
        <div class="font-bold text-[#002B5C] dark:text-white text-xl mt-1">Listing Descriptions — ${escapeHtml(label)}</div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">MLS · Social · Teaser · Reel scripts — same layout as the generator.</p>
      </div>`;
    }

    PHASES.forEach((phase) => {
      const phaseSections = phase.sections.filter((key) => sections[key] && sections[key].length > 20);
      if (!phaseSections.length) return;

      const cardsHtml = phase.id === 'descriptions'
        ? `<div class="grid grid-cols-1 gap-4">${phaseSections.map((key) => renderSectionCard(key, sections[key], context, cardOpts)).join('')}</div>`
        : phaseSections.map((key) => renderSectionCard(key, sections[key], context, cardOpts)).join('');

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
          <strong>Agent Pro Tip:</strong> Use the short teaser as the caption and the Reel scripts for quick vertical video the day the listing hits the market. Save the full package to My Saved Items for similar listings later.
        </div>`;
    }

    return html;
  }

  window.renderSavedListingKit = function renderSavedListingKit(kitData, options) {
    if (!kitData || !kitData.sections) return '<p class="text-gray-500">No listing package saved.</p>';
    return renderPackage(kitData.sections, {
      address: kitData.address,
      propertyType: kitData.propertyType
    }, { forVault: true, includeActions: false, ...(options || {}) });
  };

  window.listingKitToPlainText = function listingKitToPlainText(kitData) {
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

  window.saveListingPackage = function saveListingPackage(btn) {
    const kit = window._lastListingKit;
    if (!kit || !Object.values(kit.sections || {}).some((v) => v && v.length > 20)) {
      if (typeof window.notifyUser === 'function') {
        window.notifyUser('Generate descriptions first, then save.', 'warning', 2800);
      } else if (typeof window.showToast === 'function') {
        window.showToast('Generate descriptions first, then save.', 'warning');
      }
      return;
    }

    const label = kit.address && kit.address !== 'this property' ? kit.address : kit.propertyType;
    const title = `Listing Package - ${label}`;
    const summary = window.listingKitToPlainText(kit).slice(0, 500);

    if (typeof window.toggleSaveIdea === 'function') {
      window.toggleSaveIdea(title, summary, btn, 'listings', {
        format: 'kit',
        kit: 'listing-package',
        kitData: kit,
        summary
      });
      if (typeof window.showToast === 'function') {
        window.showToast('Full listing package saved to My Saved Items.', 'success');
      }
    }
  };

  async function generateListingDescription() {
    const address = (document.getElementById('listing-address')?.value || '').trim();
    const tone = document.getElementById('listing-tone')?.value || 'Warm & Family-Friendly';
    const propertyType = document.getElementById('listing-property-type')?.value || 'Single Family';
    const bedsBaths = (document.getElementById('listing-beds-baths')?.value || '').trim();
    const sqft = (document.getElementById('listing-sqft')?.value || '').trim();
    const buyerPersona = document.getElementById('listing-buyer-persona')?.value || 'Families and move-up buyers';
    const emphasis = document.getElementById('listing-emphasis')?.value || 'Lifestyle and emotional appeal';
    const custom = (document.getElementById('listing-custom')?.value || '').trim();

    const container = document.getElementById('listing-features') || document;
    const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
    const features = Array.from(checkboxes).map(cb => (cb.value || '').trim()).filter(Boolean);

    if (features.length === 0 && !custom && !address) {
      window.notifyUser('Please select at least one feature, add custom highlights, or provide an address.', 'warning', 3200);
      return;
    }

    if (typeof window.showAgentLoading === 'function') {
      window.showAgentLoading('Crafting 3 powerful listing descriptions...');
    } else if (typeof window.showRealtorLoading === 'function') {
      window.showRealtorLoading('Crafting 3 powerful listing descriptions...');
    } else if (document.getElementById('global-loading')) {
      document.getElementById('global-loading').classList.remove('hidden');
    }

    const output = document.getElementById('listing-output');
    if (output) {
      output.classList.add('hidden');
      output.innerHTML = '';
    }

    const prompt = `You are an elite real estate copywriter crafting emotionally compelling listing descriptions for top-producing agents.

Tone: ${tone}
Property Type: ${propertyType}
${bedsBaths ? `Beds/Baths: ${bedsBaths}` : ''}
${sqft ? `Approx. Size: ${sqft} sq ft` : ''}
Target Buyer Persona: ${buyerPersona}
Emphasis: ${emphasis}

${address ? `Property location/address: ${address} (weave in local lifestyle, neighborhood appeal, schools, commute, or lifestyle naturally without forcing it)` : 'Property in a highly desirable neighborhood'}

Must-highlight features (use ALL that apply for maximum impact and SEO):
${features.length > 0 ? features.map(f => `- ${f}`).join('\n') : 'Use your judgment for the property type'}

${custom ? `Additional unique highlights to emphasize:\n${custom}` : ''}

CRITICAL OUTPUT RULES:
- Listing descriptions and Reel scripts are SEPARATE deliverables. Never put Reel scripts, video hooks, voiceover lines, or filming directions inside any listing description.
- Use the exact section markers below. Each marker must appear on its own line. Put content only between markers — no extra headings or numbered lists outside the markers.
- Do not repeat the same Reel script twice.

OUTPUT FORMAT (follow exactly):

[MLS_DESCRIPTION]
Write the MLS-length description here (~250 words). Professional, detailed, feature-rich, SEO-optimized. Listing copy only.

[ZILLOW_DESCRIPTION]
Write the Zillow / social-length description here (~400 words). Emotional, lifestyle-focused storytelling. Listing copy only.

[TEASER]
Write the short teaser here (75–100 words). Captivating headline + hook for Instagram, Facebook, email, or print ads. Listing copy only.

[REEL_1]
Reel Script 1 (15–30 seconds) — filming instructions only, not listing copy:
- Hook (2–3 sec visual + on-screen text):
- Voiceover (2–3 natural lines):
- CTA (comment/DM for private tour):

[REEL_2]
Reel Script 2 (15–30 seconds) — different angle from Reel 1:
- Hook (2–3 sec visual + on-screen text):
- Voiceover (2–3 natural lines):
- CTA (comment/DM for private tour):

Copy rules for listing descriptions:
- Use vivid, sensory, aspirational language that sells the feeling of the home
- Trigger emotions: family, legacy, relaxation, pride of ownership, status, or smart investment depending on persona
- Avoid tired clichés like "move-in ready," "won't last long," "perfect for entertaining"
- Include natural GEO / lifestyle keywords if address or market is provided
- End each description with a soft, confident call-to-action that feels helpful
- Do NOT mention price or force beds/baths/sqft unless explicitly provided above
- Sound like a confident, successful local agent who knows their market

Make buyers fall in love and want to reach out immediately.`;

    try {
      const raw = await window.callGrokAPI(prompt, { temperature: 0.75, max_tokens: 2400 });
      const text = (raw || '').trim();

      if (!output) return;

      const sections = parseListingResponse(text);
      const hasAnySection = Object.values(sections).some((v) => v && v.length > 20);

      if (hasAnySection) {
        const context = {
          address: address || 'this property',
          propertyType
        };
        window._lastListingKit = { ...context, sections };
        output.innerHTML = renderPackage(sections, context);
      } else {
        window._lastListingKit = null;
        output.innerHTML = `<div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-8"><div class="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">${escapeHtml(text)}</div></div>`;
      }

      output.classList.remove('hidden');
    } catch (e) {
      console.error(e);
      window._lastListingKit = null;
      if (output) {
        output.innerHTML = `<div class="p-6 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-2xl text-red-700">Generation failed. Check API key / connection and try again.</div>`;
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

  window.generateListingDescription = generateListingDescription;
  console.log('[Agent] Listing Description feature loaded');
})();