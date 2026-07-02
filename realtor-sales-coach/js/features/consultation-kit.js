/**
 * js/features/consultation-kit.js
 *
 * Buyer/Seller Consultation Prep Kit (Agent Sales Coach)
 * Ported prompts + logic from monolithic coach.
 */

(function () {
  'use strict';

  async function generateConsultationKit() {
    const preset = document.getElementById('consult-preset')?.value || 'custom';
    const type = document.getElementById('consult-type')?.value || 'both';
    const address = (document.getElementById('consult-address')?.value || '').trim();
    const price = (document.getElementById('consult-price')?.value || '').trim();
    const personal = (document.getElementById('consult-personal')?.value || '').trim();
    const goals = (document.getElementById('consult-goals')?.value || '').trim();
    const clientStage = document.getElementById('consult-stage')?.value || 'First meeting';
    const urgency = document.getElementById('consult-urgency')?.value || 'Standard timeline';

    // Collect new premium prep focus checkboxes for richer, world-class kits
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

    let prompt = `You are an elite real estate agent coach. Create a complete, professional consultation prep kit for this client appointment. Incorporate the selected key client highlights/situation flags into rapport, objections, and strategy sections for hyper-personalized output.

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

Generate these 8 clearly labeled sections:
1. Personalized Opening & Rapport Builders (use personal details + selected highlights for emotional connection)
2. Market Snapshot (current local trends, inventory, days on market, buyer demand — keep it helpful and current-feeling)
3. Comparable Sales Summary (3–5 realistic comps with insights — placeholder for agent to fill actual numbers)
4. Pricing Strategy (listing) OR Affordability Snapshot (buyer) with emotional framing
5. Estimated Seller Net Sheet OR Buyer Monthly Payment Breakdown (use realistic placeholders and explain the numbers simply)
6. Key Conversation Starters & Deep Questions (build trust and uncover true motivation)
7. Top 5 Likely Objections & Response Scripts tailored for this client type (reference selected highlights)
8. Next Steps & Follow-Up Plan (immediate actions, 48-hour, 1-week, and 30-day touches)

Make everything warm, client-centered, and confidence-building. Use emotional language that shows empathy and positions the agent as the trusted expert. Help the agent win the business and look like a pro.`;

    try {
      const raw = await window.callGrokAPI(prompt, { temperature: 0.7, max_tokens: 3000 });
      const text = (raw || '').trim();

      if (!output) return;

      output.innerHTML = `
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-8">
          <div class="flex justify-between mb-4">
            <div class="font-bold text-[#002B5C] text-xl">Consultation Prep Kit</div>
            <div class="flex gap-2">
              <button onclick="navigator.clipboard.writeText(this.closest('.rounded-3xl').innerText); this.textContent='Copied!'; setTimeout(()=>this.textContent='Copy',1200)" class="text-xs px-3 py-1 border border-[#002B5C] text-[#002B5C] hover:bg-[#002B5C] hover:text-white rounded-full">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Consultation Kit - ${preset}', this.closest('.rounded-3xl').innerText, this, 'consultation');}" class="text-xs px-3 py-1 border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white rounded-full"><i class="far fa-bookmark"></i> Save</button>
            </div>
          </div>
          <div class="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">${text.replace(/</g,'&lt;')}</div>
          <div class="mt-4 p-3 bg-[#002B5C]/5 border border-[#002B5C]/15 rounded-2xl text-xs">Agent Pro Tip: Bring printed net sheets or affordability breakdowns. End the consult by booking the next step on the spot ("Shall we lock in the listing appointment for Thursday at 2pm?").</div>
        </div>`;
      output.classList.remove('hidden');
    } catch (e) {
      console.error(e);
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