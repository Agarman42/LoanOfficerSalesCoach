/**
 * js/features/listing-description.js
 *
 * Smart Listing Description Generator (Agent Sales Coach)
 * Self-initializes. Exposes window.generateListingDescription
 */

(function () {
  'use strict';

  const SECTION_MARKERS = {
    MLS: 'MLS_DESCRIPTION',
    ZILLOW: 'ZILLOW_DESCRIPTION',
    TEASER: 'TEASER',
    REEL_1: 'REEL_1',
    REEL_2: 'REEL_2'
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
      return sections;
    }

    // Fallback: numbered list split, strip reel content from description #3
    const parts = raw.split(/\n(?=\d+\.\s)/).map((p) => p.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
    const reelStart = parts.findIndex((p) => /reel|video script|15[–-]?30\s*second/i.test(p));
    const descParts = reelStart >= 0 ? parts.slice(0, reelStart) : parts.slice(0, 3);

    if (descParts[0]) sections.MLS_DESCRIPTION = descParts[0];
    if (descParts[1]) sections.ZILLOW_DESCRIPTION = descParts[1];
    if (descParts[2]) sections.TEASER = descParts[2];

    const reelParts = reelStart >= 0 ? parts.slice(reelStart) : [];
    if (reelParts[0]) sections.REEL_1 = reelParts[0];
    if (reelParts[1]) sections.REEL_2 = reelParts[1];

    return sections;
  }

  function renderDescriptionCard(title, content, address, typeKey) {
    const safeTitle = escapeHtml(title);
    const safeAddress = (address || 'this property').replace(/'/g, "\\'");
    const body = escapeHtml(content);
    return `
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-8">
        <div class="flex items-center justify-between mb-3">
          <div class="font-bold text-[#002B5C]">${safeTitle}</div>
          <div class="flex gap-2">
            <button onclick="navigator.clipboard.writeText(this.closest('.rounded-3xl').querySelector('[data-copy-body]')?.innerText?.trim()||''); this.textContent='Copied!'; setTimeout(()=>this.textContent='Copy',1200)" class="text-xs px-3 py-1 border border-[#002B5C] text-[#002B5C] hover:bg-[#002B5C] hover:text-white rounded-full">Copy</button>
            <button onclick="if(typeof window.toggleSaveIdea==='function'){const b=this.closest('.rounded-3xl');window.toggleSaveIdea('${safeTitle} for ${safeAddress}', b.querySelector('[data-copy-body]')?.innerText?.trim()||'', this, 'listings');}" class="text-xs px-3 py-1 border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white rounded-full"><i class="far fa-bookmark"></i> Save</button>
          </div>
        </div>
        <div data-copy-body class="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">${body}</div>
      </div>`;
  }

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
      const descriptions = [
        { key: 'MLS_DESCRIPTION', title: 'MLS-Length Description' },
        { key: 'ZILLOW_DESCRIPTION', title: 'Zillow / Social Length' },
        { key: 'TEASER', title: 'Short Teaser' }
      ];

      let html = `<div class="space-y-8">`;

      descriptions.forEach(({ key, title }) => {
        const content = sections[key];
        if (content) {
          html += renderDescriptionCard(title, content, address, key);
        }
      });

      if (!sections.MLS_DESCRIPTION && !sections.ZILLOW_DESCRIPTION && !sections.TEASER) {
        html += `<div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-8"><div class="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">${escapeHtml(text)}</div></div>`;
      }

      html += `</div>`;

      const reel1 = sections.REEL_1 || '';
      const reel2 = sections.REEL_2 || '';
      const reelCombined = [reel1, reel2].filter(Boolean).join('\n\n---\n\n');

      if (reelCombined.length > 40) {
        const safeAddress = (address || 'this property').replace(/'/g, "\\'");
        html += `
          <div class="mt-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-8">
            <div class="flex items-center justify-between mb-4">
              <div class="font-bold text-[#002B5C]">Ready-to-Film Reel Scripts (15–30s)</div>
              <div class="flex gap-2">
                <button onclick="navigator.clipboard.writeText(this.closest('.rounded-3xl').querySelector('[data-copy-body]')?.innerText?.trim()||''); this.textContent='Copied!'; setTimeout(()=>this.textContent='Copy All',1200)" class="text-xs px-3 py-1 border border-[#002B5C] text-[#002B5C] hover:bg-[#002B5C] hover:text-white rounded-full">Copy All</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){const b=this.closest('.rounded-3xl');window.toggleSaveIdea('Reel Scripts for ${safeAddress}', b.querySelector('[data-copy-body]')?.innerText?.trim()||'', this, 'listings');}" class="text-xs px-3 py-1 border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white rounded-full"><i class="far fa-bookmark"></i> Save</button>
              </div>
            </div>
            <div data-copy-body class="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm">${escapeHtml(reelCombined)}</div>
            <div class="mt-3 text-[11px] text-gray-500">Film vertically on your phone. Use trending audio + big text overlays. Post the same day the listing goes live.</div>
          </div>`;
      }

      html += `
        <div class="mt-4 p-4 bg-[#002B5C]/5 border border-[#002B5C]/15 rounded-2xl text-xs text-[#002B5C] dark:text-white">
          <strong>Agent Pro Tip:</strong> Use the short teaser as the caption and the Reel scripts for quick vertical video the day the listing hits the market. Save winners to My Saved Items — they become templates for similar homes.
        </div>`;

      output.innerHTML = html;
      output.classList.remove('hidden');
    } catch (e) {
      console.error(e);
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