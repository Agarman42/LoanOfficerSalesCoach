/**
 * js/features/open-house.js
 *
 * Open House Script & Strategy Generator (Realtor)
 * Ported from old monolithic Realtor Sales Coach (prompts/logic first).
 */

(function () {
  'use strict';

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

    if (typeof window.showRealtorLoading === 'function') {
      window.showRealtorLoading('Building your complete open house script & strategy kit...');
    } else if (document.getElementById('global-loading')) {
      document.getElementById('global-loading').classList.remove('hidden');
    }

    const output = document.getElementById('oh-output');
    if (output) { output.classList.add('hidden'); output.innerHTML = ''; }

    let prompt = `You are an elite real estate agent coach specializing in high-converting open houses. Create a complete, ready-to-use open house kit for this listing. Use as many of the highlighted features as possible to create specific, memorable talking points that differentiate this property.

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

Provide the following clearly labeled sections:
1. Pre-Open House Setup Checklist (signage, refreshments, sign-in tech, lighting, partner co-branding, safety)
2. 60-Second Opening Script (warm, confident, on-brand for the chosen style and audience)
3. 5 High-Impact Talking Points (tie features to lifestyle/emotion + financing advantages or investment angles)
4. Top Objections & Response Scripts (price, condition, market timing, competition, "we need to think about it")
5. Lead Capture & Follow-Up Strategy (sign-in sheet, text/email templates, 48hr and 1-week touches, nurturing sequence)
6. 3 Ready-to-Post Social / Reel Angles + Captions from this open house (including one that tags the listing agent/partner)

Keep it actionable, warm, professional, and lead-focused. Use bullet points and short, natural scripts that a realtor would actually say.`;

    try {
      const raw = await window.callGrokAPI(prompt, { temperature: 0.7, max_tokens: 2600 });
      const text = (raw || '').trim();

      if (!output) return;

      output.innerHTML = `
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-8">
          <div class="flex justify-between items-center mb-4">
            <div class="font-bold text-[#002B5C] text-xl">Your Open House Kit</div>
            <div class="flex gap-2">
              <button onclick="navigator.clipboard.writeText(this.closest('.rounded-3xl').innerText); this.textContent='Copied!'; setTimeout(()=>this.textContent='Copy All', 1400)" class="text-xs px-3 py-1 border border-[#002B5C] text-[#002B5C] hover:bg-[#002B5C] hover:text-white rounded-full">Copy All</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Open House Kit - ${propertyType}', this.closest('.rounded-3xl').innerText, this, 'social');}" class="text-xs px-3 py-1 border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white rounded-full"><i class="far fa-bookmark"></i> Save</button>
            </div>
          </div>
          <div class="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-[15px]">${text.replace(/</g,'&lt;')}</div>
          <div class="mt-4 p-3 bg-[#002B5C]/5 border border-[#002B5C]/15 rounded-2xl text-xs">Realtor Pro Tip: Print the checklist and scripts. Bring branded sign-in sheets and a small branded notepad for notes on each lead. Follow up within 4 hours for highest conversion.</div>
        </div>`;
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
  console.log('[Realtor] Open House feature loaded');
})();