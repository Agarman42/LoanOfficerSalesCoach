/**
 * js/features/listing-description.js
 *
 * Smart Listing Description Generator (Realtor)
 * Ported from old monolithic Realtor Sales Coach as-is (prompts/logic first, polish later).
 * Self-initializes. Exposes window.generateListingDescription
 */

(function () {
  'use strict';

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
      alert('Please select at least one feature, add custom highlights, or provide an address.');
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

    let prompt = `You are an elite real estate copywriter crafting emotionally compelling listing descriptions for top-producing agents. Use as many of the selected features as possible to create rich, differentiated copy that highlights what makes this home special.

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

Write exactly 3 distinct, ready-to-use descriptions in this order:

1. MLS-Length Description (~250 words) — professional, detailed, feature-rich, SEO-optimized for search
2. Zillow / Social Media Length (~400 words) — emotional, lifestyle-focused storytelling that makes buyers imagine living there
3. Short Teaser / Social Hook (75–100 words) — captivating headline + hook for Instagram, Facebook, email, or print ads

After the three descriptions, also provide 2 short ready-to-film Reel / video scripts (15–30 seconds each) that an agent can record on their phone the same day. For each Reel script include:
- A strong 2-3 second visual hook + on-screen text suggestion
- 2-3 lines of natural voiceover that pulls from the emotional hook or key features
- A soft CTA to comment or DM for a private tour

Rules for all copy:
- Use vivid, sensory, aspirational language that sells the feeling of the home
- Trigger emotions: family, legacy, relaxation, pride of ownership, status, or smart investment depending on persona
- Avoid tired clichés like "move-in ready," "won't last long," "perfect for entertaining"
- Include natural GEO / lifestyle keywords if address or market is provided
- End each version with a soft, confident call-to-action that feels helpful
- Do NOT mention price or force beds/baths/sqft unless explicitly provided
- Make the language sound like it came from a confident, successful local agent who knows their market

Make buyers fall in love and want to reach out immediately.`;

    try {
      const raw = await window.callGrokAPI(prompt, { temperature: 0.75, max_tokens: 2200 });
      const text = (raw || '').trim();

      if (!output) return;

      // Basic render: split heuristically on numbered versions or just show blocks
      let html = `<div class="space-y-8">`;
      // Simple split by "1." "2." "3." or paragraphs
      const parts = text.split(/\n(?=\d\.)/).filter(Boolean);
      const titles = ['MLS-Length Description', 'Zillow / Social Length', 'Short Teaser'];

      if (parts.length >= 3) {
        parts.slice(0, 3).forEach((p, i) => {
          const clean = p.replace(/^\d\.\s*/, '').trim();
          html += `
            <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-8">
              <div class="flex items-center justify-between mb-3">
                <div class="font-bold text-[#002B5C]">${titles[i]}</div>
                <div class="flex gap-2">
                  <button onclick="navigator.clipboard.writeText(this.closest('.rounded-3xl').innerText.replace('Copy','').trim()); this.textContent='Copied!'; setTimeout(()=>this.textContent='Copy',1200)" class="text-xs px-3 py-1 border border-[#002B5C] text-[#002B5C] hover:bg-[#002B5C] hover:text-white rounded-full">Copy</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('${titles[i]} for ${address||'this property'}', this.closest('.rounded-3xl').innerText, this, 'social');}" class="text-xs px-3 py-1 border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white rounded-full"><i class="far fa-bookmark"></i> Save</button>
                </div>
              </div>
              <div class="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">${clean}</div>
            </div>`;
        });
      } else {
        html += `<div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-8"><div class="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">${text}</div></div>`;
      }
      html += `</div>`;

      // Extract and render Reel scripts if present (after the 3 descriptions)
      const reelMatch = text.match(/Reel|video script|15[–-]?30|reel script/i);
      if (reelMatch || text.toLowerCase().includes('reel')) {
        // Simple extraction: take text after the last description or look for "Reel" section
        const afterDescriptions = text.split(/3\./).pop() || '';
        const reelSection = afterDescriptions.replace(/^.*?(Reel|video|script)/i, '$1').trim().slice(0, 1200);
        if (reelSection.length > 50) {
          html += `
            <div class="mt-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-8">
              <div class="flex items-center justify-between mb-4">
                <div class="font-bold text-[#002B5C]">Ready-to-Film Reel Scripts (15–30s)</div>
                <div class="flex gap-2">
                  <button onclick="navigator.clipboard.writeText(this.closest('.rounded-3xl').querySelector('.whitespace-pre-wrap')?.innerText?.trim()||''); this.textContent='Copied!'; setTimeout(()=>this.textContent='Copy All',1200)" class="text-xs px-3 py-1 border border-[#002B5C] text-[#002B5C] hover:bg-[#002B5C] hover:text-white rounded-full">Copy All</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){const b=this.closest('.rounded-3xl');window.toggleSaveIdea('Reel Scripts for ${(address||'this property').replace(/'/g,'')}', b.querySelector('.whitespace-pre-wrap')?.innerText?.trim()||'', this, 'social');}else{alert('Save ready after refresh');}" class="text-xs px-3 py-1 border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white rounded-full"><i class="far fa-bookmark"></i> Save</button>
                </div>
              </div>
              <div class="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm">${reelSection.replace(/</g,'&lt;')}</div>
              <div class="mt-3 text-[11px] text-gray-500">Film vertically on your phone. Use trending audio + big text overlays. Post the same day the listing goes live.</div>
            </div>`;
        }
      }

      // Premium output with pro tip callout (updated to reflect new Reel inclusion)
      html += `
        <div class="mt-4 p-4 bg-[#002B5C]/5 border border-[#002B5C]/15 rounded-2xl text-xs text-[#002B5C] dark:text-white">
          <strong>Agent Pro Tip:</strong> Use the short teaser as the caption and the Reel scripts for quick vertical video the day the listing hits the market. Save winners to your Value Vault — they become templates for similar homes.
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

  // Expose
  window.generateListingDescription = generateListingDescription;

  // Optional: small init hook if needed later
  console.log('[Realtor] Listing Description feature loaded');
})();