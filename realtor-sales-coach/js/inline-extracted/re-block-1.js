
// Reusable toggle for Supporting Systems sections (makes them behave like the main 6 pillars)
window.toggleSupportingSection = function(sectionId) {
  const content = document.getElementById('supporting-' + sectionId);
  const chevron = document.getElementById('chevron-' + sectionId);
  if (!content) return;

  const isHidden = content.classList.contains('hidden');

  // Close all other supporting sections (single open at a time for clean UX, like pillars)
  document.querySelectorAll('[id^="supporting-"]').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('[id^="chevron-"]').forEach(el => el.classList.remove('rotate-180'));

  if (isHidden) {
    content.classList.remove('hidden');
    if (chevron) chevron.classList.add('rotate-180');
    content.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// Social Strategy helpers (pillar delegation + bookmark sync)
(function() {
  const contentWrapper = document.getElementById('social-content');
  if (!contentWrapper) return;

  // Defensive data-pillar delegation for the main strategy cards (modern toggle)
  const pillarGrid = document.getElementById('social-pillar-grid');
  if (pillarGrid) {
    pillarGrid.addEventListener('click', function(e) {
      const card = e.target.closest('.social-pillar-card');
      if (!card) return;
      const pillar = card.getAttribute('data-pillar');
      if (pillar && typeof window.toggleSocialPillar === 'function') {
        window.toggleSocialPillar(pillar);
      }
    });
  }

  // ==================== SAVED IDEAS — toggle/count/library in saved-items-library.js ====================

  function isSaved(title) {
    const saved = typeof window.getSavedIdeas === 'function' ? window.getSavedIdeas() : [];
    return saved.some(item => item.title === title);
  }

  function syncBookmarkIcons() {
    // Sync .save-btn and .mini-save icons based on saved state
    document.querySelectorAll('#social-content .save-btn, #social-content .mini-save').forEach(btn => {
      const parent = btn.closest('.p-4, .border, li');
      if (!parent) return;
      const titleEl = parent.querySelector('strong');
      let title = titleEl ? titleEl.textContent.trim() : '';
      if (!title) {
        // for li mini
        title = parent.textContent.trim().replace(/\s+/g, ' ').substring(0, 80);
      }
      const saved = isSaved(title);
      btn.innerHTML = saved ? '<i class="fas fa-bookmark"></i>' : '<i class="far fa-bookmark"></i>';
    });

    // Legacy saveSocialIdea sync removed — all items now use unified toggleSaveIdea( text, 'social' )
  }


  window.showSocialSavedIdeas = function() {
    const saved = typeof window.getSavedIdeas === 'function' ? window.getSavedIdeas() : [];
    const panel = document.createElement('div');
    panel.className = 'fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4';
    panel.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-3xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h3 class="text-2xl font-bold">My Saved Social Ideas</h3>
            <p class="text-sm text-gray-500">${saved.length} saved</p>
          </div>
          <button class="text-3xl text-gray-400 hover:text-red-500 transition" onclick="this.closest('.fixed').remove()">×</button>
        </div>
        <div class="p-6 overflow-y-auto max-h-[60vh]">
          ${saved.length === 0 ? 
            '<p class="text-center text-gray-500 py-8">You haven\'t saved any ideas yet. Click the bookmark icon on any tip or theme to save it here.</p>' :
            saved.map((item) => `
              <div class="mb-4 p-4 border border-gray-200 dark:border-gray-600 rounded-2xl">
                <div class="flex justify-between items-start">
                  <strong class="text-lg">${item.title}</strong>
                  <button onclick="removeSocialSavedIdea('${item.title.replace(/'/g, "\\'")}', this)" class="text-red-500 text-sm hover:underline">Remove</button>
                </div>
                <p class="text-sm mt-2 text-gray-600 dark:text-gray-300">${item.content || ''}</p>
              </div>
            `).join('')
          }
        </div>
      </div>
    `;
    document.body.appendChild(panel);
  };

  window.removeSocialSavedIdea = function(title, element) {
    let saved = typeof window.getSavedIdeas === 'function' ? window.getSavedIdeas() : [];
    saved = saved.filter(item => item.title !== title);
    localStorage.setItem('socialSavedIdeas', JSON.stringify(saved));
    if (typeof window.updateSavedCount === 'function') window.updateSavedCount();
    if (element && element.closest('.border')) element.closest('.border').remove();
    syncBookmarkIcons();

    // Keep the generator page's saved ideas list in sync
    if (typeof window.refreshGeneratorSavedIdeas === 'function') {
      window.refreshGeneratorSavedIdeas();
    }
  };

  // Legacy fallback for any old "copyUwOutput" references after transaction coordination polish
  window.copyUwOutput = function() {
    if (typeof window.copyFullUwResponse === 'function') {
      window.copyFullUwResponse();
    } else {
      const out = document.getElementById('uw-output');
      if (out) navigator.clipboard.writeText(out.innerText || '').catch(() => {});
    }
  };

  window.saveSocialIdea = function(title, element) {
    // Legacy thin wrapper — forwards to unified save with correct type
    const content = element && element.parentElement ? element.parentElement.textContent.trim().substring(0, 300) : title;
    if (typeof window.toggleSaveIdea === 'function') {
      window.toggleSaveIdea(title, content, element, 'social');
    }
  };

  // =====================================================
  // TRANSACTION PROCESS SECTION — World Class Enhancements
  // =====================================================

  const PROCESS_STAGES = {
    1: {
      title: "Stage 1: Lead Intake & Goal Setting",
      content: `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why This Stage Sets the Tone</span></div>
          <p class="text-[15px]">The first conversation is where trust is built or lost. Fast, warm, clear communication turns leads into loyal clients and makes partners excited to send you more business. Many agents lose deals in the first 48 hours because the experience feels slow or generic.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Elite First-Contact &amp; Consult Playbook</h4>
        <div class="space-y-4 mb-6 text-[15px]">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Personal Video Welcome (Non-Negotiable)</strong><br>
            Record a short Loom/phone video within minutes of the lead. Use their name, reference how they found you or the property, and clearly state the next step (consult, showing, CMA). This dramatically lifts show-up and response rates.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Simple One-Page Roadmap</strong><br>
            Send a clean branded visual of the full process for buyers or sellers. Who does what, realistic timing, and what you need from them. Make it feel concierge-level from minute one.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Discovery That Actually Matters</strong><br>
            Ask: “What’s most important to you in this move/sale?” Repeat their exact words back in every future touch. It makes them feel deeply heard and gives you the emotional hooks for later conversations.
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Scripts</h4>
        <div class="space-y-3 mb-6">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name], it’s [Your Name] with [Team/Company]. I just saw your inquiry on [property or lead source] and wanted to personally introduce myself. I put together a quick 45-second video walking through exactly what to expect and our next step together. Check your text — I sent it over. Looking forward to helping you win in this market.">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Instant Personal Video Intro</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name], it’s [Your Name] with [Team/Company]. I just saw your inquiry on [property or lead source] and wanted to personally introduce myself. I put together a quick 45-second video walking through exactly what to expect and our next step together. Check your text — I sent it over. Looking forward to helping you win in this market.”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process Stage 1: Welcome Video Script', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Partner Name] — [Client Name] just reached out about [listing address / buyer goals]. I’ve already sent a personal welcome video and a simple roadmap. I’ll keep you in the loop on every step and make this one look great for you. What’s the best way for us to stay synced?">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Partner Handoff Text (Same Hour)</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Partner Name] — [Client Name] just reached out about [listing address / buyer goals]. I’ve already sent a personal welcome video and a simple roadmap. I’ll keep you in the loop on every step and make this one look great for you. What’s the best way for us to stay synced?”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process Stage 1: Partner Handoff', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
          <strong>Pro Tip:</strong> Pre-record welcome videos for common scenarios (seller listing consult, first-time buyer, investor, FSBO, referral from partner). Send a perfectly on-brand one in under 60 seconds.
        </div>
      `
    },
    2: {
      title: "Stage 2: Pre-Listing Prep / Buyer Readiness",
      content: `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Preparation Wins Listings &amp; Buyers</span></div>
          <p class="text-[15px]">This is where you prove you’re different. Sellers who feel prepared and educated list with you. Buyers who feel financially and emotionally ready move forward faster and with less stress. This stage creates the “I’ve never worked with anyone this organized” reaction.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Seller Pre-Listing System (Use the Dedicated Tool Too)</h4>
        <div class="space-y-4 mb-6 text-[15px]">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Pre-Listing Walk-Through &amp; Repair List</strong><br>
            Offer a no-pressure walkthrough with a prioritized repair/recommendation list. Position yourself as the expert who helps them maximize net proceeds.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Pricing &amp; Strategy Consult</strong><br>
            Deliver a clean, data-backed CMA + your recommended pricing and marketing strategy. Include expected days on market and net proceeds estimate.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Staging &amp; Photography Plan</strong><br>
            Provide a simple timeline and vendor recommendations (or in-house options). Make the prep feel easy and professional.
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Buyer Readiness Playbook</h4>
        <div class="space-y-3 mb-6">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Financing Clarity First</strong><br>
            Get them pre-approved (or confirm strength) before heavy showings. Coordinate directly with their preferred lender or introduce yours as an option.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Needs &amp; Wants Document</strong><br>
            Send a simple form or use the consultation kit output. Prioritize must-haves vs nice-to-haves so you only show homes that fit.
          </div>
        </div>

        <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
          <strong>Pro Tip:</strong> Use the dedicated Listing Description Generator and Consultation Kit tools in this coach for world-class prep materials in seconds.
        </div>
      `
    },
    3: {
      title: "Stage 3: Marketing Launch &amp; Showings",
      content: `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Marketing &amp; Feedback Loops Win</span></div>
          <p class="text-[15px]">Great photos + copy + consistent showing feedback is what turns a listing into a sold sign faster. Buyers who feel guided through the process remember you as the agent who made house hunting feel easy instead of overwhelming.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Launch &amp; Showing Excellence</h4>
        <div class="space-y-4 mb-6 text-[15px]">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Pro Photos + Video + Copy (Same Week)</strong><br>
            Never list with phone photos. Use a pro (or excellent phone + editing) and the Listing Description tool here for compelling copy that actually converts.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Showing Feedback System</strong><br>
            Text or form after every showing. “What did they like? What concerns came up?” Share a clean summary with the seller the same day. This builds massive trust.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Open House Execution</strong><br>
            Use the Open House Script &amp; Strategy Generator. Have a sign-in, branded materials, and a follow-up sequence ready before the first guest arrives.
          </div>
        </div>

        <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
          <strong>Pro Tip:</strong> Turn the best showing feedback into social content (with permission). “Just got this feedback on 123 Main — here’s why buyers are loving the backyard…” Social proof in real time.
        </div>
      `
    },
    4: {
      title: "Stage 4: Offer, Negotiation &amp; Contract",
      content: `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Negotiation Skill = Reputation</span></div>
          <p class="text-[15px]">This is where you earn your fee. Calm, prepared, creative negotiation protects your client’s interests and makes the other side feel they got a fair deal. Other agents want to co-broke with you when you close cleanly and keep egos out of the room.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Negotiation &amp; Contract Best Practices</h4>
        <div class="space-y-4 mb-6 text-[15px]">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Pre-Negotiation Huddle</strong><br>
            Before submitting or responding to an offer, walk the client through the likely counter scenarios and your recommended strategy. Remove emotion in the moment.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Inspection Response Playbook</strong><br>
            Have clear tiers (seller credit, repair cap, price reduction, or walk). Use the same calm, data-driven language every time.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Multiple Offer Strategy</strong><br>
            When representing the seller, present all offers cleanly with a simple comparison and your recommendation. Let the seller feel in control.
          </div>
        </div>

        <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
          <strong>Pro Tip:</strong> Use the Sales Script Generator in this coach for “price reduction conversation,” “inspection negotiation,” and “multiple offer presentation” language.
        </div>
      `
    },
    5: {
      title: "Stage 5: Contract to Close Coordination",
      content: `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Coordination = Referrals</span></div>
          <p class="text-[15px]">This is the longest stretch and the highest anxiety period. The agent who keeps both sides informed, solves problems before they become crises, and makes the lender/inspector/title team look good wins lifelong partners and raving clients.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Coordination Rituals</h4>
        <div class="space-y-4 mb-6 text-[15px]">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Weekly Status + Same-Hour Milestone Texts</strong><br>
            Monday update to both sides. Immediate notification on inspection results, appraisal, title issues, or repair resolutions.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Problem Solver First</strong><br>
            When an issue arises, bring a solution (or two) instead of just the problem. “Here are the three ways we can handle the roof — here’s my recommendation.”
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Pre-Closing 48-Hour Confirmation</strong><br>
            Walk through wire instructions, what to bring, exact time/place, and who will be there. Celebrate the finish line.
          </div>
        </div>

        <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
          <strong>Pro Tip:</strong> Use the dedicated Open House and Listing tools to create co-branded “just listed / just sold” assets that the other agent can use for their own marketing. Make them look like a hero.
        </div>
      `
    },
    6: {
      title: "Stage 6: Closing, Celebration &amp; Lifetime Referrals",
      content: `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why the Real Business Starts After Closing</span></div>
          <p class="text-[15px]">One ecstatic client who feels celebrated and supported is worth 10–20x the commission through repeat and referral business over the years. Most agents disappear after the keys are handed over. The ones who stay visible win for decades.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Post-Close &amp; Referral System</h4>
        <div class="space-y-4 mb-6 text-[15px]">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Day-After Thank You + Celebration Video</strong><br>
            Short genuine video + keys photo (with permission) + final docs the day after. This is the moment they become a fan.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>7-Day Settling-In + Review Ask</strong><br>
            “How’s the new place treating you?” + simple review request (Google or preferred platform). Prime time for reviews.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>30/90 Day &amp; Annual Anniversary Touches</strong><br>
            Light, valuable touches. Systematize anniversary cards/gifts + quick equity or market update for past sellers. This is pure gold for referrals.
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Sample Post-Close Messages</h4>
        <div class="space-y-3 mb-6">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name] — just wanted to say congrats again on the new keys! How are you settling in? Any fun plans for the space? I sent a short celebration video. If everything feels good, would you mind leaving a quick Google review when you have a second? It really helps other families in your situation. Here’s the link…">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">7-Day Check-In + Review Request</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name] — just wanted to say congrats again on the new keys! How are you settling in? Any fun plans for the space? I sent a short celebration video. If everything feels good, would you mind leaving a quick Google review when you have a second? It really helps other families in your situation. Here’s the link…”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process Stage 6: 7-Day Check-In', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
          <strong>Key Insight:</strong> The lifetime value of one happy client (plus their referrals and future transactions) is worth far more than the commission on that single deal. Treat every closing as the beginning of a long relationship.
        </div>

        <div class="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700 text-sm">
          <div class="font-semibold mb-1 text-[#00A89D]">Take this further:</div>
          <div class="flex flex-wrap gap-2">
            <span onclick="window.showSection && window.showSection('value-vault');" class="cursor-pointer inline-block px-3 py-1 text-xs rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Value Vault (post-closing scripts &amp; touches)</span>
            <span onclick="window.showSection && window.showSection('eventplanning');" class="cursor-pointer inline-block px-3 py-1 text-xs rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Event Planning (client appreciation events)</span>
            <span onclick="window.showSection && window.showSection('referrals');" class="cursor-pointer inline-block px-3 py-1 text-xs rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Referral Partners (lifetime partner system)</span>
          </div>
        </div>
      `
    }
  };

  window.showProcessStage = function(stageNumber) {
    const modal = document.getElementById('process-stage-modal');
    const titleEl = document.getElementById('process-stage-title');
    const contentEl = document.getElementById('process-stage-content');
    
    const stage = PROCESS_STAGES[stageNumber];
    if (!stage) return;

    titleEl.textContent = stage.title;
    contentEl.innerHTML = stage.content;

    if (typeof window.openNamedModal === 'function') {
      window.openNamedModal(modal);
    } else {
      modal.style.display = '';
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.classList.add('modal-open');
    }
    if (typeof window.ensureModalBackdropClose === 'function') {
      window.ensureModalBackdropClose(modal);
    }
  };

  window.saveProcessItem = function(title, btnElement) {
    const content = `${title} — Key checklist / process item from the Transaction Process section.`;
    
    // Use the existing unified save system
    if (typeof window.toggleSaveIdea === 'function') {
      window.toggleSaveIdea(`Process: ${title}`, content, btnElement, 'process');
    } else if (typeof window.saveSocialIdea === 'function') {
      // Fallback
      window.saveSocialIdea(`Process: ${title}`, btnElement);
    } else {
      window.notifyUser('Saved! (Saved Items system will be fully connected shortly)', 'success', 3200);
    }
  };

  window.copyChecklist = function(button) {
    const container = button.closest('.rounded-3xl');
    const items = Array.from(container.querySelectorAll('.process-checklist label')).map(l => l.textContent.trim());
    const title = container.querySelector('h4').textContent;
    const text = `${title}\n\n` + items.map(item => `• ${item}`).join('\n');

    navigator.clipboard.writeText(text).then(() => {
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      setTimeout(() => { button.textContent = originalText; }, 1500);
    }).catch(() => {
      window.notifyUser(text, 'info', 6000); // fallback
    });
  };

  // Helper for individual template copy buttons inside rich modals (used in nurture sections)
  window.copyModalSection = function(btn) {
    const container = btn.closest('[data-copy-text]');
    if (!container) return;
    const text = container.getAttribute('data-copy-text');
    navigator.clipboard.writeText(text).then(() => {
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = originalText; }, 1500);
    }).catch(() => {
      window.notifyUser(text, 'info', 6000);
    });
  };

  const SCALING_LEVELS = {
    1: {
      title: "8–12 Transactions/Month — Solo Agent + First Transaction Coordinator",
      content: `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why This Model Works</span></div>
          <p class="text-[15px]">At 8–12 transactions per month you are at the ideal point to bring on your first transaction coordinator or assistant. This is when most agents benefit from support — the TC owns the contract-to-close logistics, and the assistant handles follow-up, marketing, and partner updates. You stay hands-on with consultations, showings, negotiations, A+ relationships, and every key client touch. Adding support here protects your time for lead generation and white-glove service before volume starts to overwhelm you.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Team Structure &amp; Exact Responsibilities</h4>
        <div class="grid md:grid-cols-2 gap-4 mb-6 text-[15px]">
          <div class="border border-gray-200 rounded-2xl p-4">
            <strong class="block mb-2 text-[#00A89D]">You (Agent)</strong>
            <ul class="space-y-1 text-sm">
              <li>• All initial consultations, structuring &amp; pricing decisions</li>
              <li>• Every A+ VIP and top professional partner or agent network relationship</li>
              <li>• 7-day post-closing calls &amp; key life-event responses</li>
              <li>• Weekly pipeline review (you run it)</li>
              <li>• Final negotiation decisions &amp; major contract exceptions</li>
            </ul>
          </div>
          <div class="border border-gray-200 rounded-2xl p-4">
            <strong class="block mb-2 text-[#00A89D]">Transaction Coordinator + First Assistant</strong>
            <ul class="space-y-1 text-sm">
              <li>• Transaction Coordinator: Inspection/appraisal scheduling, title &amp; HOA follow-up, contingency tracking, lender-partner coordination, closing logistics</li>
              <li>• Assistant / Admin: CRM updates, marketing, partner communications, document collection, routine client check-ins</li>
              <li>• Assistant maintains checklists and handles showings coordination + follow-up</li>
            </ul>
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Non-Negotiable Systems (Build These First)</h4>
        <div class="space-y-4 mb-6 text-[15px]">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Monday 30-Min Pipeline Review (You Run It)</strong><br>
            <span class="text-sm">Agenda: Wins (2 min) → Aging files (10 min) → Upcoming milestones (5 min) → Stuck files (10 min) → Capacity &amp; communication check (3 min). Document owners + due dates live. TC and assistant attend and own their action items.</span>
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Weekly Status Update Process (Assistant Executes, You Own the Message)</strong><br>
            <span class="text-sm">Assistant sends consistent updates using your templates. You record short personal videos on key milestones. Assistant handles the logistics and follow-up so you only jump in for high-touch moments.</span>
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Keeping White-Glove at This Volume</h4>
        <ul class="text-[15px] space-y-1 mb-6">
          <li>• Batch your personal videos and handwritten notes on Sunday (10–15 touches).</li>
          <li>• You personally handle the first call and set the tone — assistant supports after that.</li>
          <li>• Review every file that is 7+ days in any stage yourself.</li>
          <li>• Send the 7-day post-closing call personally (or a personal video if they don’t pick up).</li>
          <li>• Your TC keeps contract-to-close moving; your lender partner handles financing milestones — you stay the face of the experience.</li>
        </ul>

        <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">Pro Move: Create a simple “How We Work” one-pager that explains the roles (you as the relationship owner, assistant for day-to-day comms, TC for contract-to-close coordination). Give it to every new client and partner so expectations are crystal clear from day one.</div>
      `
    },
    2: {
      title: "15–25 Transactions/Month — Agent + Transaction Coordinator + Assistant Team",
      content: `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why This Model Works</span></div>
          <p class="text-[15px]">At 15–25 transactions you have real volume. Your transaction coordinator continues to own the contract-to-close flow. This is where you typically add one or more assistants so the team can handle follow-up, marketing, showings coordination, and partner updates at scale. Assistants can also start supporting buyer consultations under your guidance. You stay focused on listings, negotiations, client relationships, and lead generation. The white-glove feel is protected because the client still hears from you on the moments that matter while the support team keeps everything else moving smoothly.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Team Structure &amp; Exact Responsibilities</h4>
        <div class="grid md:grid-cols-3 gap-4 mb-6 text-[15px]">
          <div class="border border-gray-200 rounded-2xl p-4">
            <strong class="block mb-2 text-[#00A89D]">You (Agent)</strong>
            <ul class="space-y-1 text-sm">
              <li>• All high-stakes consultations, structuring &amp; pricing</li>
              <li>• A+ VIPs + top referral partners</li>
              <li>• Final negotiation decisions &amp; major contract exceptions</li>
              <li>• Monday pipeline review (you lead)</li>
              <li>• 7-day post-closing calls on every file</li>
            </ul>
          </div>
          <div class="border border-gray-200 rounded-2xl p-4">
            <strong class="block mb-2 text-[#00A89D]">Transaction Coordinator (TC)</strong>
            <ul class="space-y-1 text-sm">
              <li>• Inspection/appraisal scheduling &amp; follow-up</li>
              <li>• Title, HOA, and contingency tracking</li>
              <li>• Lender-partner milestone coordination</li>
              <li>• Keeps every file moving toward closing on time</li>
            </ul>
          </div>
          <div class="border border-gray-200 rounded-2xl p-4">
            <strong class="block mb-2 text-[#00A89D]">1–2 Client Concierge Assistants</strong>
            <ul class="space-y-1 text-sm">
              <li>• Collect documents &amp; chase outstanding items</li>
              <li>• Daily/weekly updates to buyers, sellers &amp; all partners (agents, lenders, title)</li>
              <li>• Schedule showings, consultations, and open houses under your guidance</li>
              <li>• Calendar management and routine partner coordination</li>
            </ul>
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Key Systems That Protect the White-Glove Feel</h4>
        <div class="space-y-3 mb-6 text-[15px]">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="File Update for [Client Name]: Inspection is complete and appraisal came back at value. Lender partner is working final approval — targeting clear by Thursday and close next Friday. Anything on your side I should know about?">
            <strong>Consistent Update Process (Assistant Executes Using Your Templates)</strong><br>
            <span class="text-sm">Assistant sends regular status updates using your pre-written templates. You record short personal videos on important milestones. Assistant owns the follow-up so clients get fast answers while you only get pulled in for high-value conversations.</span>
            <div class="mt-2"><button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Copy</button></div>
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Escalation Protocol</strong><br>
            <span class="text-sm">Any file stuck &gt;5 days in a stage = auto notification to you + TC + assistant. You decide the next move quickly. Clients never feel ignored.</span>
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">White-Glove Retention at 15–25 Files</h4>
        <ul class="text-[15px] space-y-1.5 mb-2">
          <li>• You personally do (or record) every 7-day post-closing call. This is non-negotiable for referrals.</li>
          <li>• Batch all A+ and top partner videos/notes on Sunday morning.</li>
          <li>• Assistants handle routine updates, but you jump on any complaint or big life event within 60 minutes.</li>
          <li>• Quarterly personal touches with your top 10 referral partners — you lead them.</li>
        </ul>

        <div class="mt-4 p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">You should rarely be the one saying “I’m still waiting on…” to a client. Your job is the relationship, the outcome, and setting the standard. The transaction coordinator owns the contract-to-close flow; the team owns the day-to-day communication and coordination. Everything repeatable belongs to the team.</div>
      `
    },
    3: {
      title: "25+ Transactions/Month — Team Lead Agent + Full Support Team",
      content: `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why This Model Works</span></div>
          <p class="text-[15px]">At 25+ transactions per month the only way to keep the white-glove reputation (and your sanity) is ruthless systems + strong culture. Very few agents sustain 50+ consistently while delivering true personal service, so this model focuses on the realistic high-volume range where you can still make every client feel like your only one. You are no longer the person who touches every showing, email, and inspection detail. You are the Team Lead who sets the standard, owns the most important relationships, leads culture, and drives new business strategy. Your transaction coordinator continues to own contract-to-close coordination. One or more buyer/listing coordinators handle volume on documents, showings, and client communications. Junior agents or showing assistants take on lead follow-up, open houses, and buyer tours. An occasional admin assistant can be added for extra support. This is where recruiting, developing talent, and protecting culture become your highest-leverage activities.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Team Structure &amp; What You Actually Own</h4>
        <div class="grid md:grid-cols-2 gap-4 mb-6 text-[15px]">
          <div class="border border-gray-200 rounded-2xl p-4">
            <strong class="block mb-2 text-[#00A89D]">You (Team Lead / Rainmaker)</strong>
            <ul class="space-y-1 text-sm">
              <li>• All A+ VIPs, top partners, and complex/high-stakes files</li>
              <li>• Recruiting, hiring, and team culture</li>
              <li>• Pricing strategy, major exceptions &amp; final negotiation calls</li>
              <li>• Monday full pipeline review + quarterly training</li>
              <li>• Personal 7-day calls on every file (or video when volume is extreme)</li>
              <li>• Top-level relationship strategy and new business development</li>
            </ul>
          </div>
          <div class="border border-gray-200 rounded-2xl p-4">
            <strong class="block mb-2 text-[#00A89D]">The Team</strong>
            <ul class="space-y-1 text-sm">
              <li>• 1+ Junior agents or buyer/listing coordinators: Lead follow-up, open houses, showings, and nurture under your standards</li>
              <li>• 1+ Client concierge / admin: Collect docs, handle buyer/seller &amp; partner communications, support marketing and CRM</li>
              <li>• 1+ Transaction coordinator: Inspection/appraisal/title coordination, contingency tracking, lender-partner milestones, closing logistics</li>
              <li>• Occasional contract admin: Extra TC support during peak volume</li>
            </ul>
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Systems That Let You Stay Personal at Scale</h4>
        <ul class="text-[15px] space-y-2 mb-6">
          <li><strong>Structured Monday Pipeline + Daily Huddle</strong> — You lead the Monday review; the team runs daily standups using a shared board. Everyone knows exactly what they own.</li>
          <li><strong>Full Template &amp; Video Library</strong> — Every major touch (welcome, inspection/appraisal updates, status updates, clear-to-close, 7-day call) exists as a short video script or email you recorded once. Team uses them consistently so every client hears “your” voice.</li>
          <li><strong>Batched White-Glove Touches</strong> — Sunday is protected time for you to record personal videos and write notes for A+ clients and top partners. Your coordinators handle packaging, mailing, and follow-up.</li>
          <li><strong>Referral Partner Dashboard &amp; Recognition System</strong> — Real-time visibility on who has sent what. You personally thank the right people on a regular cadence.</li>
        </ul>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">White-Glove at 25+ (The Non-Negotiables)</h4>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-6 text-[15px]">
          <ul class="space-y-2">
            <li>• You still personally call or video every single client on day 7 (or ensure a personal video goes out if volume is extreme). This remains the highest-ROI touch.</li>
            <li>• Top partners receive regular personal touches from you (gifts, notes, lunches) on a cadence that fits your volume.</li>
            <li>• Any complaint or “I haven’t heard anything” reaches you within 1 hour. You decide the recovery move.</li>
            <li>• Quarterly team training on “how we sound and act like the best team in town” — you personally teach the standards and voice.</li>
            <li>• You own the most important relationships and the culture. The team executes the process at a high level.</li>
          </ul>
        </div>

        <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">Your highest-leverage activity at this level is recruiting and developing great people + protecting the culture that makes every client feel known and cared for. The transaction coordinator owns the contract-to-close flow. The team owns follow-up, marketing, and coordination. Junior team members support showings and client communication. You own the relationships, the standards, the negotiations, and the growth strategy. The systems and team do the heavy lifting so you can stay personal where it matters most.</div>
      `
    }
  };

  window.showScalingModal = function(level) {
    const modal = document.getElementById('scaling-modal');
    const titleEl = document.getElementById('scaling-modal-title');
    const contentEl = document.getElementById('scaling-modal-content');

    const data = SCALING_LEVELS[level];
    if (!data) return;

    titleEl.textContent = data.title;
    contentEl.innerHTML = data.content;

    if (typeof window.openNamedModal === 'function') {
      window.openNamedModal(modal);
    } else {
      modal.style.display = '';
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.classList.add('modal-open');
    }
    if (typeof window.ensureModalBackdropClose === 'function') {
      window.ensureModalBackdropClose(modal);
    }
  };

  const COMMUNICATION_MODALS = {
    client: {
      title: "Client Communication — Deep Dive",
      content: `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Consistent Communication Wins the Relationship</span></div>
          <p class="text-[15px]">Clients who feel informed and cared for become raving fans who refer and return. Silence creates anxiety and gives competitors an opening. The formula is simple: proactive, personal, and predictable. In 2026, the agents who win (and the lender partners they team with) are the ones who remove uncertainty faster than anyone else. Every update is a deposit in the relationship bank that pays dividends in referrals and repeat business for a decade.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">The Full Cadence (Print This &amp; Follow It)</h4>
        <div class="space-y-3 mb-6 text-[15px]">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong>Day 1 (within 60 min of signing):</strong> Personal welcome video (30–60s) + one-page timeline + what to expect next (inspection, appraisal, lender milestones).</div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong>Every Monday:</strong> 45–60 second status video or email using the exact 6-part formula.</div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong>Milestones (same hour):</strong> Under contract, inspection complete, appraisal ordered/received, lender clear-to-close, closing day — personal call or video from you.</div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong>48h Pre-Close:</strong> Full confirmation call (wire safety, what to bring, exact timing, who will be there).</div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong>Day After Close:</strong> Short thank-you video + final docs + “welcome home”.</div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong>Day 7 Post-Close:</strong> Settling-in check-in + review ask (highest-ROI 30 minutes of your week).</div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Monday Status Update Formula (Use Every Week)</h4>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-4 text-[15px]">
          <strong>45–60 second video (preferred) or email</strong><br>
          Structure: “Here’s where we are” + “What we’re waiting on” + “What I need from you this week” + real question to drive reply.
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Client Scripts (Copy + Save)</h4>
        <div class="space-y-3 mb-6">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name] — quick Monday update. Inspection went well and the appraisal came back at value yesterday. Your lender partner is working through final approval — I’ve already checked in with them. We’re still targeting our [date] close. I’ll send another note the moment anything moves. How’s everything feeling on your end?">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Core Monday Status Video / Email</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name] — quick Monday update. Inspection went well and the appraisal came back at value yesterday. Your lender partner is working through final approval — I’ve already checked in with them. We’re still targeting our [date] close. I’ll send another note the moment anything moves. How’s everything feeling on your end?”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Client Comm: Monday Update', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name] — big update: your lender partner just confirmed clear to close! Everything is on track for [closing date/time]. Title is preparing final numbers and I’d love to walk through what to expect on closing day on a quick 10-minute call this afternoon so there are zero surprises. This is the exciting part — we’re almost home.">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Milestone — Clear to Close Notification</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name] — big update: your lender partner just confirmed clear to close! Everything is on track for [closing date/time]. Title is preparing final numbers and I’d love to walk through what to expect on closing day on a quick 10-minute call this afternoon so there are zero surprises. This is the exciting part — we’re almost home.”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Client Comm: CTC Notification', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name] — just a quick 48-hour confirmation before closing. We’re still on track for [time] at [location]. Bring your driver’s license or passport. I’ve already verified the wire instructions with title — I’ll text you the callback number you can call to confirm before sending anything. Any last questions? I want you to walk in feeling completely calm.">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">48h Pre-Close Confirmation</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name] — just a quick 48-hour confirmation before closing. We’re still on track for [time] at [location]. Bring your driver’s license or passport. I’ve already verified the wire instructions with title — I’ll text you the callback number you can call to confirm before sending anything. Any last questions? I want you to walk in feeling completely calm.”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Client Comm: 48h Pre-Close', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Your Weekly Cadence Ritual (Batch in ~45 Minutes)</h4>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-6 text-[15px]">
          Sunday night or Monday 7am: Record all Monday videos for the week (usually 4–8 clients). Use your phone notes template with the 6-part formula. Send immediately after recording. Takes less time than the random “just checking in” texts you used to send.
        </div>

        <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm mb-2">
          <strong>Pro Tips for Maximum Impact Without Burnout:</strong> End every update with a real question. Use Loom or your phone’s built-in video — lighting and warmth matter more than production quality. Log every touch in your CRM with a 1-sentence note so you remember personal details later. Protect Sunday night or Monday morning as sacred batch time — treat it like a closing appointment.
        </div>
      `
    },
    realtor: {
      title: "Agent Network & Co-Broke Communication — Deep Dive",
      content: `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why This Matters More Than You Think</span></div>
          <p class="text-[15px]">Co-broke partners (and their clients) are often more anxious than anyone in the deal. When you keep fellow agents informed and make them look good to their clients, they become your biggest advocates and send you more opportunities. Consistent, helpful communication is your competitive advantage. Most agents win co-broke relationships by being the reliable one — your reliability becomes legendary faster than any co-marketing spend.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">The Co-Broke Partner Cadence (Non-Negotiable)</h4>
        <div class="space-y-3 mb-6 text-[15px]">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong>Every Thursday:</strong> Short, consistent status text or email — same format every week.</div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong>Same-Hour Milestones:</strong> Under contract, inspection, appraisal, lender clear-to-close, closing day — immediate text + short note to co-broke partner.</div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong>First File Over-Communication:</strong> This is your audition. Do not miss a single touch on the first one.</div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong>Post-Closing:</strong> Thank-you + marketing highlight they can actually use + testimonial ask.</div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Co-Broke Scripts (Copy + Save)</h4>
        <div class="space-y-3 mb-6">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="[Client Name] update: Inspection is complete and appraisal came back at value. Lender partner is working final approval — targeting clear by Thursday. I’ll keep you posted the moment anything moves.">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Weekly Thursday Co-Broke Update</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">Keep it short and consistent: “[Client Name] update: Inspection is complete and appraisal came back at value. Lender partner is working final approval — targeting clear by Thursday. I’ll keep you posted the moment anything moves.”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Co-Broke Comm: Thursday Update', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Quick update on [Client Name]: Lender partner just confirmed clear to close. Everything is on track for [date]. I’ll walk the client through closing-day details this afternoon and copy you. Let me know if you need anything from my side before we hand over keys.">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Milestone — Same-Hour Clear-to-Close Text</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Quick update on [Client Name]: Lender partner just confirmed clear to close. Everything is on track for [date]. I’ll walk the client through closing-day details this afternoon and copy you. Let me know if you need anything from my side before we hand over keys.”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Co-Broke Comm: CTC Update', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Smooth closing on [Client Name] today. They are thrilled and specifically mentioned how calm the whole process felt because of the updates. Here’s a short highlight you can use in your marketing if you want: “[Your Name] + [Co-Broke Agent] got us to the finish line with zero stress — highly recommend.” Happy to shoot a quick 15-second video for your social if that’s helpful. Let’s grab the next one together.">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Post-Closing Value Add + Testimonial Ask</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Smooth closing on [Client Name] today. They are thrilled and specifically mentioned how calm the whole process felt because of the updates. Here’s a short highlight you can use in your marketing if you want: “[Your Name] + [Co-Broke Agent] got us to the finish line with zero stress — highly recommend.” Happy to shoot a quick 15-second video for your social if that’s helpful. Let’s grab the next one together.”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Co-Broke Comm: Post-Close Value', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Weekly Co-Broke Batching Ritual (15 Minutes)</h4>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-6 text-[15px]">
          Thursday 8am or right after your client Monday batch: Send all Thursday updates in one sitting. Keep a simple template in your notes app. Add one personal line when possible (“Hope the new listing on Maple is getting traction”). The consistency is what they remember.
        </div>

        <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
          <strong>Pro Tip:</strong> Over-communicate on the first co-broke transaction with a new partner. It earns you repeat business and referrals faster than any lunch or gift. Then protect that relationship by never going dark on future files. Most agents fail here — you won’t.
        </div>
      `
    }
  };

  window.showCommunicationModal = function(type) {
    const modal = document.getElementById('communication-modal');
    const titleEl = document.getElementById('communication-modal-title');
    const contentEl = document.getElementById('communication-modal-content');

    const data = COMMUNICATION_MODALS[type];
    if (!data) return;

    titleEl.textContent = data.title;
    contentEl.innerHTML = data.content;

    if (typeof window.openNamedModal === 'function') {
      window.openNamedModal(modal);
    } else {
      modal.style.display = '';
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.classList.add('modal-open');
    }
    if (typeof window.ensureModalBackdropClose === 'function') {
      window.ensureModalBackdropClose(modal);
    }
  };

  // Rich Template Modals for Transaction Process section — fully upgraded with Why boxes, multiple Copy+Save ready-to-use scripts, detailed playbooks, and pro tips (matches journey stage polish)
  const PROCESS_TEMPLATES = {
    'weekly-pipeline': {
      title: "Weekly Pipeline Review Agenda",
      content: `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why This Meeting Is Non-Negotiable</span></div>
          <p class="text-[15px]">This 30-minute ritual is the highest-leverage process habit for any agent who wants to scale volume without losing control or sleep. It surfaces problems while they’re still small, celebrates momentum (which keeps your team energized), and forces a realistic capacity conversation before you overpromise on new clients. Teams that run this every Monday close more deals with less drama.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Exact 30-Minute Agenda (Run It Like This)</h4>
        <div class="space-y-3 mb-6 text-[15px]">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>0–2 min — Celebrate Wins</strong><br>
            Start positive. Name every closing, great client feedback, or smooth file from the week. This is culture, not fluff.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>2–12 min — Aging File Review</strong><br>
            Call out anything sitting 7+ days waiting on inspection, appraisal, title, or lender approval. Assign owner + next action + due date out loud.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>12–17 min — Upcoming Milestones</strong><br>
            Clear-to-closes, closings, and appraisals for the next 7 days. Confirm everyone knows their role.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>17–27 min — Stalled Files Deep Dive</strong><br>
            The 1–3 files that are truly stuck. What’s blocking? What does the client/partner know? Who owns the fix?
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>27–30 min — Communication &amp; Capacity</strong><br>
            Who needs an extra touch this week? How many new files can we responsibly take on?
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Talking Points &amp; Scripts</h4>
        <div class="space-y-3 mb-6">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Quick win to celebrate: [Client Name] closed smoothly on Thursday and sent a thank-you text this morning — they specifically called out how calm and organized the whole process felt. Great job [Team Member] on keeping the lender partner and title looped in all week.">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Win Celebration Script (Start Strong)</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Quick win to celebrate: [Client Name] closed smoothly on Thursday and sent a thank-you text this morning — they specifically called out how calm and organized the whole process felt. Great job [Team Member] on keeping the lender partner and title looped in all week.”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process: Weekly Pipeline Win Script', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Aging file check — [Address] has been waiting on the appraisal for 9 days with no update to the buyer or co-broke agent. [Name], can you call the appraiser and lender partner today before 3pm and get a status? I want us to have a clear answer for everyone by tomorrow morning.">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Aging File Ownership Script</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Aging file check — [Address] has been waiting on the appraisal for 9 days with no update to the buyer or co-broke agent. [Name], can you call the appraiser and lender partner today before 3pm and get a status? I want us to have a clear answer for everyone by tomorrow morning.”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process: Aging File Callout', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Capacity check for next week: We have three closings on the calendar. I’m comfortable taking on two new buyer or listing consultations this week, but only if we can protect communication on active files. Let’s not overpromise showings or offers we can’t follow through on.">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Capacity Forecast Close (Critical)</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Capacity check for next week: We have three closings on the calendar. I’m comfortable taking on two new buyer or listing consultations this week, but only if we can protect communication on active files. Let’s not overpromise showings or offers we can’t follow through on.”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process: Capacity Check Script', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
          <strong>Pro Tip:</strong> Protect this meeting like a closing. Same day, same time, every week. If you’re solo, still block 30 minutes on your calendar and run the agenda with yourself or your assistant. The discipline compounds.
        </div>
      `
    },
    'post-closing-7day': {
      title: "7-Day Post-Closing Check-In — Full Scripts + Client Lifetime Value Strategy",
      content: `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why This Touch Is Pure Gold</span></div>
          <p class="text-[15px]">Most agents vanish the second the wire clears. The 7-day check-in is when clients are finally settled enough to reflect on the experience and decide whether you were “just another agent” or someone who actually cared. Done right, this single call or video generates Google reviews, referral conversations, and future repeat business at a rate no marketing spend can match. This is where lifetime value is earned or lost.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Phone / Video Script (Primary — Best Conversion)</h4>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-6" data-copy-text="Hey [First Name], it’s [Your Name] — just checking in now that you’ve had a full week in the new place. How’s everything feeling? Any surprises with the house or the paperwork? I want to make sure you’re completely settled before I get out of your hair.">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1">
              <strong class="text-sm font-semibold">Opening (Warm + Curious)</strong>
              <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [First Name], it’s [Your Name] — just checking in now that you’ve had a full week in the new place. How’s everything feeling? Any surprises with the house or the paperwork? I want to make sure you’re completely settled before I get out of your hair.”</div>
            </div>
            <div class="flex flex-col gap-1">
              <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process: 7-Day Opening Script', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
            </div>
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Review + Referral Ask (After They Sound Happy)</h4>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-6" data-copy-text="That’s great to hear. Quick favor — would you mind leaving a short Google review when you have two minutes? It really helps other families in your exact situation find someone who will actually take care of them. I sent the link in a text just now. And if anyone in your world is even thinking about buying or selling in the next year, I’d be honored to help them the same way I helped you.">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1">
              <strong class="text-sm font-semibold">Natural Review + Soft Referral</strong>
              <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“That’s great to hear. Quick favor — would you mind leaving a short Google review when you have two minutes? It really helps other families in your exact situation find someone who will actually take care of them. I sent the link in a text just now. And if anyone in your world is even thinking about buying or selling in the next year, I’d be honored to help them the same way I helped you.”</div>
            </div>
            <div class="flex flex-col gap-1">
              <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process: 7-Day Review Ask', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
            </div>
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Video Fallback (When They Don’t Pick Up)</h4>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-6" data-copy-text="Hey [Name] — it’s [Your Name]. Just left you a quick voicemail. I wanted to check in now that you’ve been in the house a full week. Everything going okay? Any surprises? Shoot me a text when you have a second. Also — if you loved working with me, I’d be incredibly grateful for a short Google review. I texted the link over. Hope you’re loving the new place!">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1">
              <strong class="text-sm font-semibold">45-Second Video / Voicemail Script</strong>
              <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name] — it’s [Your Name]. Just left you a quick voicemail. I wanted to check in now that you’ve been in the house a full week. Everything going okay? Any surprises? Shoot me a text when you have a second. Also — if you loved working with me, I’d be incredibly grateful for a short Google review. I texted the link over. Hope you’re loving the new place!”</div>
            </div>
            <div class="flex flex-col gap-1">
              <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process: 7-Day Video Fallback', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
            </div>
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Follow-Up Text (Always Send Same Day)</h4>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-6" data-copy-text="Hey [Name] — just sent you a quick 7-day check-in video (or left a voicemail). Hope the new place is already feeling like home. Let me know if anything comes up in the first few weeks. And if you have 30 seconds, that Google review link I texted would mean the world.">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1">
              <strong class="text-sm font-semibold">Same-Day Text Follow-Up</strong>
              <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name] — just sent you a quick 7-day check-in video (or left a voicemail). Hope the new place is already feeling like home. Let me know if anything comes up in the first few weeks. And if you have 30 seconds, that Google review link I texted would mean the world.”</div>
            </div>
            <div class="flex flex-col gap-1">
              <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process: 7-Day Text Follow-Up', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
            </div>
          </div>
        </div>

        <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
          <strong>Pro Tip:</strong> Do this on day 6, 7, or 8 — never day 1 or 2. They need time to actually live in the house before they can give you real feedback. Record the video in good light, say their name, smile, and keep it under 60 seconds.
        </div>
      `
    },
    'realtor-onboarding': {
      title: "Building Lender Partner Relationships — 6-Step Playbook + Scripts",
      content: `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why the First 30 Days Determine Everything</span></div>
          <p class="text-[15px]">A new lender partnership is either the start of a steady referral pipeline or a one-and-done. Top agents treat the first shared file like an audition. Over-communicate, deliver on every promise, and make your lender partner look like a hero to the client. Do that on the first one and you become their go-to agent faster than any lunch or gift ever could.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">The 6-Step Onboarding System</h4>
        <div class="space-y-4 mb-6 text-[15px]">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Day 0 — Same-Day Intro to Your Lender Partner</strong><br>
            The moment you have a buyer under contract (or a strong pre-approved lead), send a 30–45 second personal video to your lender partner + a clean “How I Run My Files” one-pager. Speed and clarity here set the tone.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Day 1-2 — 15-Min Intro Call</strong><br>
            Purpose: Learn how they communicate, what they need from you on files, and how they like updates structured. Ask real questions. Take notes.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Within 48 Hours of Call — Written Cadence + Tools</strong><br>
            Email the exact update cadence you committed to + 2–3 co-branded assets you can share (buyer guide, neighborhood snapshot, open house flyer, etc.).
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Week 1 — First Client Update (Over-Deliver)</strong><br>
            Do not miss this. Send a clear status update even if nothing changed. This is the moment they decide whether you’re different.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Post First Closing — Testimonial + Preferred List Ask</strong><br>
            Ask for a quick quote or video you can use in your marketing. Then ask to be added to their preferred agent list for future buyer referrals.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Ongoing — Never Go Dark on Their Files</strong><br>
            The bar is low. Most agents are inconsistent. Your consistency becomes your moat.
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Scripts for Key Moments</h4>
        <div class="space-y-3 mb-6">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Lender Name] — I just put [Buyer Name] under contract on [address]. I’ve already welcomed them and sent a simple roadmap. I’ll keep you in the loop on every step from my side — inspection, appraisal, repairs, and closing prep. What’s the best way for us to stay in sync on this one?">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Day 0 Lender Partner Handoff Text</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Lender Name] — I just put [Buyer Name] under contract on [address]. I’ve already welcomed them and sent a simple roadmap. I’ll keep you in the loop on every step from my side — inspection, appraisal, repairs, and closing prep. What’s the best way for us to stay in sync on this one?”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process: Lender Day 0 Handoff', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Lender Name] — great connecting yesterday. Quick follow-up: I’ve attached the exact communication cadence I use on every shared file (milestone updates + same-day inspection/appraisal notifications). I also included three co-branded tools we can use with buyers. Looking forward to making this one (and many more) look great for your team and our mutual clients.">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">48-Hour Cadence Follow-Up Email</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Lender Name] — great connecting yesterday. Quick follow-up: I’ve attached the exact communication cadence I use on every shared file (milestone updates + same-day inspection/appraisal notifications). I also included three co-branded tools we can use with buyers. Looking forward to making this one (and many more) look great for your team and our mutual clients.”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process: Lender Cadence Email', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="First closing with [Lender Name] went perfectly. [Client] is thrilled. Quick favor — would you be open to a short 20-second quote or video I can use in my marketing about why you liked working with me on this file? And if it felt good on your end, I’d love to be on your preferred agent list for future buyer referrals.">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Post-First-Close Testimonial Ask</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“First closing with [Lender Name] went perfectly. [Client] is thrilled. Quick favor — would you be open to a short 20-second quote or video I can use in my marketing about why you liked working with me on this file? And if it felt good on your end, I’d love to be on your preferred agent list for future buyer referrals.”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process: Lender Testimonial Ask', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
          <strong>Pro Tip:</strong> The goal of onboarding is not one referral — it’s to become their go-to agent. Over-communicate on the first transaction and you earn the spot faster than any gift basket ever will.
        </div>
      `
    },
    'monday-status': {
      title: "Monday Status Update Scripts — 4 Ready-to-Record Videos",
      content: `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Predictable Monday Updates Win</span></div>
          <p class="text-[15px]">Clients in process are anxious. Silence = anxiety + competitor opportunity. A consistent Monday video (45–60 seconds) that says exactly where we are, what’s next, and what you need from them removes 80% of the “just checking in” calls and makes you look like the most organized professional they’ve ever worked with. Do this for 6 months and co-broke partners will start saying “I only work with [Your Name] because my clients actually know what’s going on.”</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">The 45-Second Video Formula (Memorize This Structure)</h4>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-6 text-[15px]">
          <strong>1. Warm greeting + name</strong> → “Hey [Name], it’s [Your Name] with your Monday update.”<br>
          <strong>2. Current status in plain English</strong> → “Appraisal came back clean yesterday.”<br>
          <strong>3. What we’re waiting on + who owns it</strong> → “Still waiting on the inspection report — I already followed up with the inspector.”<br>
          <strong>4. Next expected milestone + date</strong> → “Targeting full clear by Thursday.”<br>
          <strong>5. What you need from them (if anything)</strong> → “No action needed from you this week.”<br>
          <strong>6. Real question to drive reply</strong> → “How are you feeling about everything so far?”
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Four Ready-to-Record Scripts (Copy, Personalize, Film)</h4>
        <div class="space-y-3 mb-6">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name], it’s [Your Name] with your Monday update. Inspection went well and the appraisal came back at value yesterday. Your lender partner is working through final approval — I’ve already checked in with them. We’re still targeting our [date] close. No action needed from you this week. How are you feeling about everything so far?">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Script 1 — Smooth / On Track</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name], it’s [Your Name] with your Monday update. Inspection went well and the appraisal came back at value yesterday. Your lender partner is working through final approval — I’ve already checked in with them. We’re still targeting our [date] close. No action needed from you this week. How are you feeling about everything so far?”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process: Monday Smooth Script', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name], it’s [Your Name] with your Monday update. We hit a small delay on the appraisal — the appraiser needs one additional photo of the back patio. I’ve already coordinated with the listing agent and they’re handling it today. This shouldn’t push our timeline, but I wanted you to hear it from me first. I’ll send another note the second we have the report. How’s everything else going on your end?">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Script 2 — Appraisal Delay (Proactive Transparency)</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name], it’s [Your Name] with your Monday update. We hit a small delay on the appraisal — the appraiser needs one additional photo of the back patio. I’ve already coordinated with the listing agent and they’re handling it today. This shouldn’t push our timeline, but I wanted you to hear it from me first. I’ll send another note the second we have the report. How’s everything else going on your end?”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process: Monday Appraisal Delay', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name], it’s [Your Name] with your Monday update. The seller accepted our repair request and we’re waiting on the amended inspection report. I’ve already followed up with the listing side and your lender partner so nothing slips. Can you confirm you received the HOA docs I emailed yesterday? If we get those back by Wednesday we stay on track for our close date.">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Script 3 — Action Needed (Clear Ask + Deadline)</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name], it’s [Your Name] with your Monday update. The seller accepted our repair request and we’re waiting on the amended inspection report. I’ve already followed up with the listing side and your lender partner so nothing slips. Can you confirm you received the HOA docs I emailed yesterday? If we get those back by Wednesday we stay on track for our close date.”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process: Monday Conditions Script', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name], it’s [Your Name] with your Monday update. We’re still waiting on the appraisal report — nothing new to report yet, but I wanted you to know I’m checking in with the appraiser and your lender partner every day and will text you the second we have movement. No action needed from you — just wanted to give you peace of mind. How’s everything else going on your end?">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Script 4 — Nothing New (Still Valuable)</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name], it’s [Your Name] with your Monday update. We’re still waiting on the appraisal report — nothing new to report yet, but I wanted you to know I’m checking in with the appraiser and your lender partner every day and will text you the second we have movement. No action needed from you — just wanted to give you peace of mind. How’s everything else going on your end?”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process: Monday No Movement', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
          <strong>Pro Tip:</strong> Batch all your Monday videos Sunday night or first thing Monday. Keep a notes app template with the 6-part formula. End every single one with a real question — it drives replies and keeps the relationship two-way instead of broadcast-only.
        </div>
      `
    },
    'pre-close-confirmation': {
      title: "Pre-Closing Confirmation Scripts — 48h Playbook + Wire Safety",
      content: `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why the Final 48 Hours Need White-Glove Treatment</span></div>
          <p class="text-[15px]">This is the highest-anxiety window for most clients. One surprise at the closing table (wrong wire instructions, missing ID, HOA issue) can turn a celebration into a nightmare. Your job is to make the last two days feel calm, organized, and celebratory. The agents who do this get remembered for years — and get the referral + the next move when life happens.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">48-Hour Pre-Closing Confirmation Call Script</h4>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-6" data-copy-text="Hey [Name], it’s [Your Name] — just doing our 48-hour pre-closing confirmation call. I want to walk through exactly what to expect so there are zero surprises on closing day. We’re still on track for [time] at [location]. You’ll need to bring your ID (driver’s license or passport) and a certified check or wire confirmation for [amount if applicable]. I’ve already verified the wire instructions with the title company — I’ll text you the verified number you can call to confirm before you send anything. Any last questions on your end before we get you the keys?">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1">
              <strong class="text-sm font-semibold">Full 48h Confirmation Script (Phone/Video)</strong>
              <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name], it’s [Your Name] — just doing our 48-hour pre-closing confirmation call. I want to walk through exactly what to expect so there are zero surprises on closing day. We’re still on track for [time] at [location]. You’ll need to bring your ID (driver’s license or passport) and a certified check or wire confirmation for [amount if applicable]. I’ve already verified the wire instructions with the title company — I’ll text you the verified number you can call to confirm before you send anything. Any last questions on your end before we get you the keys?”</div>
            </div>
            <div class="flex flex-col gap-1">
              <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process: 48h Pre-Close Call', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
            </div>
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Wire Verification + Fraud Prevention Language</h4>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-6" data-copy-text="Important: Before you send any wire, call this number to verbally verify the instructions — [insert verified title company callback number]. I will never email you new wire instructions at the last minute. If anything looks different or you get an email asking you to change the wire, call me immediately before sending anything. This is how we keep you safe.">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1">
              <strong class="text-sm font-semibold">Wire Safety Script (Text or Email)</strong>
              <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Important: Before you send any wire, call this number to verbally verify the instructions — [insert verified title company callback number]. I will never email you new wire instructions at the last minute. If anything looks different or you get an email asking you to change the wire, call me immediately before sending anything. This is how we keep you safe.”</div>
            </div>
            <div class="flex flex-col gap-1">
              <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process: Wire Safety Language', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
            </div>
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">CD Walk-Through Invite (Do Not Skip)</h4>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-6" data-copy-text="Your lender just confirmed Clear to Close — huge milestone! The Closing Disclosure will hit your email soon. I recommend a quick walk-through call with your lender (I’m happy to join if you want). On my side, let’s lock in your final walkthrough and I’ll send a simple closing-day checklist so there are zero surprises. What time works for the walkthrough?">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1">
              <strong class="text-sm font-semibold">CD Walk-Through Invite</strong>
              <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Your lender just confirmed Clear to Close — huge milestone! The Closing Disclosure will hit your email soon. I recommend a quick walk-through call with your lender (I’m happy to join if you want). On my side, let’s lock in your final walkthrough and I’ll send a simple closing-day checklist so there are zero surprises. What time works for the walkthrough?”</div>
            </div>
            <div class="flex flex-col gap-1">
              <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process: CD Walk-Through Invite', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
            </div>
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Closing Celebration + Next Steps Handoff</h4>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-6" data-copy-text="Congratulations [Name]! You officially own your new home — we did it! I’m so happy for you and your family. I sent a short celebration video to your text. If you’d like a quick photo with the keys at the front door or closing table, let me know — I’d love to capture the moment. Here’s exactly what happens next: title will record [today/tomorrow], you’ll get the keys [at closing/when it records], and I’m your agent for life — reach out anytime in the first 30 days or years from now. Welcome home!">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1">
              <strong class="text-sm font-semibold">Closing Celebration + Handoff</strong>
              <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Congratulations [Name]! You officially own your new home — we did it! I’m so happy for you and your family. I sent a short celebration video to your text. If you’d like a quick photo with the keys at the front door or closing table, let me know — I’d love to capture the moment. Here’s exactly what happens next: title will record [today/tomorrow], you’ll get the keys [at closing/when it records], and I’m your agent for life — reach out anytime in the first 30 days or years from now. Welcome home!”</div>
            </div>
            <div class="flex flex-col gap-1">
              <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Process: Closing Celebration Handoff', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'process');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
            </div>
          </div>
        </div>

        <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
          <strong>Pro Tip:</strong> For purchases, coordinate the final walkthrough timing with the listing agent and send the buyer a short 5-item checklist the night before (“check all lights and outlets, test every faucet, look for new damage”). It makes them feel prepared and in control — and you look like the pro who thinks of everything.
        </div>
      `
    }
  };

  window.showProcessTemplateModal = function(templateKey) {
    const modal = document.getElementById('process-template-modal');
    const titleEl = document.getElementById('process-template-title');
    const contentEl = document.getElementById('process-template-content');

    const data = PROCESS_TEMPLATES[templateKey];
    if (!data) return;

    const richTitle = typeof window.getProcessModalTitle === 'function' ? window.getProcessModalTitle(templateKey) : null;
    titleEl.textContent = richTitle || data.title;

    if (typeof window.renderRichProcessModal === 'function' && window.renderRichProcessModal(templateKey, contentEl)) {
      // bespoke renderer handled content
    } else {
      contentEl.innerHTML = data.content;
    }

    if (typeof window.openNamedModal === 'function') {
      window.openNamedModal(modal);
    } else {
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      modal.style.pointerEvents = 'auto';
      document.body.classList.add('modal-open');
    }
    if (typeof window.ensureModalBackdropClose === 'function') {
      window.ensureModalBackdropClose(modal);
    }
  };

  // Nurturing Scripts & Templates Data (beefed up with even more content, examples, value, and structure)
  const NURTURE_TEMPLATES = {
    'anniversary': {
      title: "Home Anniversary Touch Script",
      content: `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why This Touch Works So Well</span></div>
          <p class="text-[15px]">The anniversary of their home purchase is one of the most powerful touches in your entire database strategy. It feels personal, relevant, and positions you as someone who cares about their life — not just the transaction. It’s the one day of the year that is 100% about them and their home.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Recommended Approach</h4>
        <ul class="space-y-2 text-sm mb-6">
          <li><strong>Format options:</strong> Handwritten card + small gift (cutting board, doormat, plant, local treat, bottle of wine with custom label) OR a short personal video (30–60 seconds).</li>
          <li><strong>Include:</strong> A quick equity snapshot or market update specific to their neighborhood (pull 3 comps or a simple value trend). This adds massive perceived value.</li>
          <li><strong>Soft referral ask:</strong> “If anyone you know is thinking about buying or selling, I’d be honored to help them the same way I helped you.”</li>
          <li><strong>Timing:</strong> Send 7–10 days before the actual anniversary so it lands on or near the day.</li>
        </ul>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Sample Message (Card or Video)</h4>
        <p class="italic text-sm mb-2">“[Name], it’s hard to believe it’s already been [X] years since you closed on your home! I hope it’s still treating you well and that the neighborhood feels like home. I pulled a quick update on values in your area — happy to hop on a quick call if you’re ever curious what your equity position looks like these days. No pressure at all.”</p>
        <p class="text-xs text-gray-500 mb-6">Add a P.S. with one specific memory: “Still remember how excited the kids were on closing day!”</p>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Pro Tips for Maximum Impact</h4>
        <ul class="text-sm space-y-1">
          <li>Always reference something personal from their file or a previous conversation.</li>
          <li>Take a photo of the gift + note before you send it — post it on social (with permission) as “Client love in action.”</li>
          <li>Follow up 10–14 days later with a short text: “Hope the [gift] is getting some use! Let me know if I can ever be a resource.”</li>
          <li>Do this for every past client who closed with you. The ones who respond are your best referral sources.</li>
        </ul>
      `
    },
    'birthday-video': {
      title: "Birthday Video Message Template",
      content: `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Birthday Videos Crush It</span></div>
          <p class="text-[15px]">A 30–60 second personal video on someone’s birthday feels incredibly thoughtful in 2026. Almost no one does it. It takes 2 minutes to record and creates a huge emotional deposit.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Script for 45-Second Video (Memorize the Structure)</h4>
        <p class="italic text-sm mb-2">“Hey [First Name], it’s [Your Name] — I just wanted to wish you a happy birthday! Hope you’re doing something fun today with the people you love. I’ve been thinking about you and your family and how much I enjoyed helping you get into your home. If there’s ever anything I can do for you or anyone you know, just let me know. Have an amazing day!”</p>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Delivery &amp; Follow-Up Tips</h4>
        <ul class="text-sm space-y-1 mb-6">
          <li>Send via text or DM on their actual birthday (or the evening before).</li>
          <li>Keep it under 60 seconds — genuine, warm, slightly smiling, good lighting.</li>
          <li>Follow up 2–3 hours later with a short text: “Just sent you a quick birthday video — hope you liked it!”</li>
          <li>Do this for A+ VIPs and Past Clients at minimum. Bonus: do it for Sphere who are close.</li>
          <li>Save the video template in your phone notes so you can record quickly.</li>
        </ul>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Pro Tips</h4>
        <ul class="text-sm space-y-1">
          <li>Mention one specific detail: “Hope the new deck is getting a lot of use this summer!”</li>
          <li>If you know their spouse/kids, include them: “Tell the kids happy birthday from me too!”</li>
          <li>These often lead to “Can we talk about our equity?” conversations 4–8 weeks later.</li>
        </ul>
      `
    },
    'referral-ask': {
      title: "Natural Referral Ask Script",
      content: `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Best Timing &amp; Mindset</span></div>
          <p class="text-[15px]">Only after you’ve delivered consistent value for several months (especially after a strong home anniversary, life event touch, or they’ve raved about you). The ask should feel like a natural extension of the relationship, never transactional.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Low-Pressure Script (After a Positive Touch)</h4>
        <p class="italic text-sm mb-2">“[Name], I’m really glad I was able to help you with your home. If you ever come across anyone who’s thinking about buying or selling, I’d be honored if you’d think of me. I promise I’ll take great care of them the same way I took care of you.”</p>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Even Better Version (After They’ve Raved or Sent a Referral)</h4>
        <p class="italic text-sm mb-2">“That means a lot — thank you. If you know anyone else who might be in a similar situation, I’d love the opportunity to help them too. No pressure at all — only if it feels natural for you.”</p>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Pro Tips for Getting More Referrals</h4>
        <ul class="text-sm space-y-1">
          <li>Make the ask about helping <em>their</em> people, not about you needing business.</li>
          <li>Give them an easy way to refer: “Just text me their name and number and I’ll reach out gently.”</li>
          <li>After they refer someone, send a high-quality thank-you (gift + note) within 48 hours and keep them updated on the file (with client permission).</li>
          <li>The best referral sources are the ones you’ve helped solve a problem for (tough inspection, appraisal gap, multiple-offer win, etc.). Remind them how you made their life easier.</li>
        </ul>
      `
    },
    'scalable-touches': {
      title: "21 Scalable Touches – Full List + How to Use Them",
      content: `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why 4–6 Scalable Touches Per Month Keep You Top of Mind</span></div>
          <p class="text-[15px]">The 80% of your database that doesn’t want (or need) a quarterly personal call still needs to hear from you regularly. These low-effort touches create consistent visibility and goodwill without burning you out. Done right, they convert into referrals and repeat business at scale.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Categorized List (Pick 6–8 That Feel Natural)</h4>

        <div class="mb-4">
          <strong class="text-[#00A89D]">Social &amp; Visibility (mix 2–3/week)</strong>
          <ul class="text-[15px] space-y-1 mt-1">
            <li>Like/comment thoughtfully on 10+ client/partner posts per week</li>
            <li>Post photos from client events or local happenings</li>
            <li>Share local business spotlights (tag the business — they almost always repost)</li>
            <li>Post fun polls or “this or that” questions</li>
            <li>Share your own home projects or local recommendations</li>
          </ul>
        </div>

        <div class="mb-4">
          <strong class="text-[#00A89D]">Value &amp; Content (1–2 per week)</strong>
          <ul class="text-[15px] space-y-1 mt-1">
            <li>Monthly email newsletter (value-first, never salesy)</li>
            <li>Quarterly market update video (shared on social + email)</li>
            <li>Share one genuinely useful article/tool per week with a one-sentence note</li>
            <li>Forward relevant local market news with a short personal note</li>
            <li>Post client success stories (with permission, anonymized)</li>
            <li>Send “Just Sold in your neighborhood” postcards or emails</li>
          </ul>
        </div>

        <div class="mb-4">
          <strong class="text-[#00A89D]">Light Personal / Relationship (1–2 per week)</strong>
          <ul class="text-[15px] space-y-1 mt-1">
            <li>Quarterly “just checking in” text to B-tier contacts</li>
            <li>Send a quick voice note instead of text occasionally</li>
            <li>Tag people in relevant local posts</li>
            <li>Invite people to open houses you’re supporting</li>
            <li>Quarterly “equity snapshot” email to past clients (simple 1-pager)</li>
          </ul>
        </div>

        <div class="mb-6">
          <strong class="text-[#00A89D]">Higher-Impact Scalable (1–2 per month)</strong>
          <ul class="text-[15px] space-y-1 mt-1">
            <li>Host or co-host a small quarterly lunch &amp; learn or first-time buyer workshop</li>
            <li>Send holiday / seasonal value emails (recipes, local events, maintenance tips)</li>
            <li>Comment thoughtfully on fellow agent posts (they notice and remember)</li>
            <li>End-of-year “thank you + looking ahead” video to your top 100</li>
            <li>Post “day in the life” or behind-the-scenes content</li>
          </ul>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Sample Copy You Can Actually Use (Copy + Save)</h4>
        <div class="space-y-3 mb-6">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Just closed on a great 3-bed in the [Neighborhood] area — happy to share what the market is actually doing right now if you or anyone in your world is curious. No pitch, just data.">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">“Just Sold in Your Neighborhood” (Text/Email/Social)</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Just closed on a great 3-bed in the [Neighborhood] area — happy to share what the market is actually doing right now if you or anyone in your world is curious. No pitch, just data.”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Scalable Touch: Just Sold', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'nurture');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Quick market note for [Neighborhood] — inventory is up about 12% from last month. If you’ve been watching the market, this is actually creating some opportunity for buyers who’ve been waiting. Happy to run real numbers if anyone in your world is curious.">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Quarterly Market Update (Email or Social Caption)</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Quick market note for [Neighborhood] — inventory is up about 12% from last month. If you’ve been watching the market, this is actually creating some opportunity for buyers who’ve been waiting. Happy to run real numbers if anyone in your world is curious.”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Scalable Touch: Market Update', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'nurture');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">How to Actually Execute This Without Burning Out</h4>
        <div class="grid md:grid-cols-2 gap-4 mb-6 text-[15px]">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Simple Monthly Mix</strong><br>
            <span class="text-sm">2–3 social visibility posts<br>1 value email or video<br>1–2 light personal texts<br>1 higher-impact item (workshop invite or seasonal email)</span>
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>90-Minute Monthly Batch</strong><br>
            <span class="text-sm">Record 8–10 short videos in one sitting.<br>Write 10–15 “just checking in” texts.<br>Schedule your newsletter and social posts.<br>Print and address any postcards.</span>
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Track What Actually Works</h4>
        <ul class="text-[15px] space-y-1 mb-4">
          <li>Keep a simple note or spreadsheet: which touches got replies, event RSVPs, or referrals in the last 90 days.</li>
          <li>Double down on the 3–4 that move the needle. Drop or reduce the ones that don’t.</li>
          <li>These touches are the system that keeps the 80% warm so your high-touch A+ work can focus on the relationships that pay the real estate.</li>
        </ul>

        <p class="text-xs text-gray-500">Consistency beats perfection. Five touches a month done reliably will outperform 20 touches done sporadically.</p>
      `
    }
  };

  window.showNurtureTemplateModal = function(templateKey) {
    console.log('[NurtureModal] called with key:', templateKey);
    try {
      // Close any other open modals first
      if (typeof closeAllModals === 'function') {
        closeAllModals();
      }
      console.log('[NurtureModal] after closeAllModals, checking for existing modal element');

      let modal = document.getElementById('nurture-template-modal');
      let titleEl = document.getElementById('nurture-template-title');
      let contentEl = document.getElementById('nurture-template-content');

      // Defensive recreation if missing or broken
      if (!modal || !titleEl || !contentEl) {
        console.log('[NurtureModal] recreating modal because element or children missing');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'nurture-template-modal';
        modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]';
        modal.innerHTML = `
          <div class="bg-white dark:bg-gray-900 rounded-3xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700" onclick="event.stopImmediatePropagation()">
            <div class="px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#00A89D]/5 via-white to-white dark:via-gray-800 dark:to-gray-800 flex justify-between items-center">
              <div>
                <div class="text-[10px] font-bold tracking-[1.5px] text-[#00A89D] uppercase mb-0.5">Nurture Templates &amp; Systems</div>
                <h3 id="nurture-template-title" class="text-2xl md:text-3xl font-bold text-[#002B5C] dark:text-white"></h3>
              </div>
              <button onclick="document.getElementById('nurture-template-modal').classList.add('hidden'); document.getElementById('nurture-template-modal').classList.remove('flex'); document.getElementById('nurture-template-modal').style.display='none';" class="text-4xl leading-none text-gray-400 hover:text-red-500 transition">×</button>
            </div>
            <div id="nurture-template-content" class="p-6 md:p-8 overflow-y-auto max-h-[68vh] text-[15px] leading-relaxed text-gray-700 dark:text-gray-300"></div>
            <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end">
              <button onclick="document.getElementById('nurture-template-modal').classList.add('hidden'); document.getElementById('nurture-template-modal').classList.remove('flex'); document.getElementById('nurture-template-modal').style.display='none';" class="px-5 py-2 rounded-2xl border text-sm font-medium hover:bg-white dark:hover:bg-gray-800">Close Guide</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        console.log('[NurtureModal] appended recreated modal');

        titleEl = document.getElementById('nurture-template-title');
        contentEl = document.getElementById('nurture-template-content');
      } else {
        console.log('[NurtureModal] using existing modal element');
      }

      console.log('[NurtureModal] about to lookup NURTURE_TEMPLATES for', templateKey, '— NURTURE_TEMPLATES type:', typeof NURTURE_TEMPLATES);
      const data = NURTURE_TEMPLATES[templateKey];
      if (!data) {
        console.warn('No nurture template for', templateKey);
        window.notifyUser('Content not found for this script/template.', 'error', 5000);
        return;
      }
      console.log('[NurtureModal] data found, title:', data.title);

      const richNurtureTitle = typeof window.getNurtureModalTitle === 'function' ? window.getNurtureModalTitle(templateKey) : null;
      titleEl.textContent = richNurtureTitle || data.title;

      if (typeof window.renderRichNurtureModal === 'function' && window.renderRichNurtureModal(templateKey, contentEl)) {
        // bespoke renderer handled content
      } else {
        contentEl.innerHTML = data.content;
      }

      // Force visibility
      console.log('[NurtureModal] about to force visibility');
      if (typeof window.openNamedModal === 'function') {
        window.openNamedModal(modal);
      } else {
        modal.style.display = '';
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
      console.log('[NurtureModal] SUCCESS - should be visible now');

      if (typeof window.ensureModalBackdropClose === 'function') {
        window.ensureModalBackdropClose(modal);
      }
    } catch (err) {
      console.error('Error in showNurtureTemplateModal:', err);
      window.notifyUser('Could not open the modal. Please use the "Close Modals" button or press Escape, then try again.', 'error', 5000);
    }
  };

  // Database Nurturing Pillar Modals (beefed up with rich, high-value content matching the rest of the tool)
  window.openDatabaseModal = function(pillar) {
    try {
      if (typeof closeAllModals === 'function') {
        closeAllModals();
      }

      let modal = document.getElementById('detail-modal');
      let titleEl = document.getElementById('detail-modal-title');
      let contentEl = document.getElementById('detail-modal-content');

      // Defensive recreation — premium styled for Database Nurturing modals (world-class, not placeholder)
      if (!modal || !titleEl || !contentEl) {
        if (modal) modal.remove();
        modal = document.createElement('div');
        modal.id = 'detail-modal';
        modal.className = 'fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
          <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-full sm:max-w-4xl max-h-[90vh] mx-2 sm:mx-4 overflow-y-auto" onclick="event.stopPropagation()">
            <!-- Premium Close (sticky) -->
            <div class="sticky top-0 z-10 flex justify-end p-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-t-3xl">
              <button onclick="if(typeof closeDetailModal==='function') closeDetailModal(); else this.closest('#detail-modal').classList.add('hidden');" class="text-3xl leading-none text-gray-400 hover:text-red-500 transition w-10 h-10 flex items-center justify-center">&times;</button>
            </div>

            <!-- Content -->
            <div class="px-4 sm:px-8 pb-8 sm:pb-10 -mt-2 sm:-mt-4 custom-modal-scroll">
              <div class="text-[10px] font-bold tracking-[1.5px] text-[#00A89D] uppercase mb-2">Database Nurturing System</div>
              <h3 id="detail-modal-title" class="text-3xl font-bold text-[#002B5C] dark:text-white mb-4"></h3>
              <div id="detail-modal-content" class="text-[15px] leading-relaxed text-gray-700 dark:text-gray-300"></div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        titleEl = document.getElementById('detail-modal-title');
        contentEl = document.getElementById('detail-modal-content');
      }

      // Self-contained rich content for the 6 Database Nurturing pillars.
      // This lives INSIDE openDatabaseModal so the cards ALWAYS get the polished rich version
      // even if global DETAIL_CONTENT is from a stale cached script parse, or any other override.
      // Triple-checked: only this function is called by the 6 top cards. Legacy thin version in legacy-helpers.js has been disabled.
      const RICH_DB_PILLARS = {
        'a-plus-vips': {
          title: "A+ VIPs — Your Platinum Tier (The 50 Who Fund Your Business)",
          content: `
  
            <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
              <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why This Segment Is Everything</span></div>
              <p class="text-[15px]">Your top 50 people (top referral partners and past clients who actually send you business, influential past clients, family/friends who refer consistently, community leaders) will generate more closed business than the other 950 combined when nurtured at platinum level. These are the relationships that send you 2–5 referrals per year without you ever asking. In a 1,000+ database world, equal treatment of everyone is malpractice. Your A+ list deserves (and repays) disproportionate time, presence, and generosity.</p>
            </div>
            <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Identification Criteria (Be Ruthless — This List Should Hurt a Little to Curate)</h4>
            <ul class="text-[15px] space-y-1.5 mb-6 pl-4 list-disc">
              <li>Have referred you at least once in the last 24 months OR sent multiple clients historically</li>
              <li>Are in a position of real influence (busy business owners, natural connectors, active sphere members in your community)</li>
              <li>You have a genuine personal relationship beyond the transaction (you know kids’ names, hobbies, recent vacations, challenges)</li>
              <li>Losing regular contact with them would actually cost you meaningful business or relationships you care about</li>
            </ul>
            <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Platinum Touch Cadence (Minimum — Protect This Ruthlessly)</h4>
            <div class="bg-white dark:bg-gray-900 border border-gray-200 rounded-2xl p-5 text-[15px] mb-6">
              <ul class="space-y-2.5">
                <li><strong>Quarterly personal call or coffee</strong> (15–25 min, zero agenda other than “how are you and the family? How can I actually help you right now?” — listen 80%)</li>
                <li><strong>Handwritten note + meaningful small gift on home anniversary</strong> (monogram cutting board, local honey + nice card, plant, their favorite coffee, something that shows you know them)</li>
                <li><strong>Birthday video or handwritten card</strong> (30–60 seconds, personal, reference one specific thing you know about them this year)</li>
                <li><strong>Annual equity review offer</strong> (in person or 12-min video call — this single touch often generates listing or move-up business + referrals)</li>
                <li><strong>Invite to 1–2 client appreciation events per year</strong> (always allow +1, treat them like honored guests)</li>
                <li><strong>Same-day or next-day response to any life event</strong> (baby, promotion, loss, move, divorce — be the first to show up)</li>
              </ul>
            </div>
            <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Platinum Scripts &amp; Messages (Copy + Save any)</h4>
            <div class="space-y-3 mb-6">
              <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name], it’s [Your Name]. I was thinking about you this morning and realized it’s been way too long since we caught up. No real estate stuff — I just wanted to hear how you and the family are doing. Got 10–12 minutes this week?">
                <div class="flex justify-between items-start gap-3">
                  <div class="flex-1">
                    <strong class="text-sm font-semibold">Platinum Call Opener (Phone or Coffee)</strong>
                    <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name], it’s [Your Name]. I was thinking about you this morning and realized it’s been way too long since we caught up. No real estate stuff — I just wanted to hear how you and the family are doing. Got 10–12 minutes this week?”</div>
                    <div class="text-xs text-gray-500 mt-1">Then shut up and listen. End with: “If anything real estate related ever comes up for you or anyone you know, I’m always here. No pressure ever.”</div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                    <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('A+ VIP: Call Opener', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'database-nurture');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                  </div>
                </div>
              </div>
              <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name] — saw the post about [specific thing: new grandbaby, big promotion, kid’s graduation, tough week at work]. That’s awesome / I’m so sorry / that’s huge. No agenda, just wanted you to know I’m thinking about you and rooting for you. If there’s ever anything I can do to make life easier (even something as small as a referral to a great contractor or whatever), just say the word.">
                <div class="flex justify-between items-start gap-3">
                  <div class="flex-1">
                    <strong class="text-sm font-semibold">Life Event Text / DM (Same Day)</strong>
                    <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name] — saw the post about [specific thing: new grandbaby, big promotion, kid’s graduation, tough week at work]. That’s awesome / I’m so sorry / that’s huge. No agenda, just wanted you to know I’m thinking about you and rooting for you. If there’s ever anything I can do to make life easier (even something as small as a referral to a great contractor or whatever), just say the word.”</div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                    <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('A+ VIP: Life Event Text', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'database-nurture');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                  </div>
                </div>
              </div>
              <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Happy Birthday [Name]! Hope this year treats you and the family even better than the last one. I’m grateful to have you in my world — not just as a [client/partner/friend], but as someone I genuinely enjoy. Here’s to more [inside reference: golf rounds / coffee catch-ups / kid sports wins / great closings].">
                <div class="flex justify-between items-start gap-3">
                  <div class="flex-1">
                    <strong class="text-sm font-semibold">Birthday Video Script (30–45 sec)</strong>
                    <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Happy Birthday [Name]! Hope this year treats you and the family even better than the last one. I’m grateful to have you in my world — not just as a [client/partner/friend], but as someone I genuinely enjoy. Here’s to more [inside reference: golf rounds / coffee catch-ups / kid sports wins / great closings].”</div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                    <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('A+ VIP: Birthday Video', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'database-nurture');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                  </div>
                </div>
              </div>
            </div>
            <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Pro Tips for A+ VIPs (The Details That Compound)</h4>
            <ul class="text-[15px] space-y-1.5 mb-2">
              <li>• Keep a private “human notes” field in your CRM: kids’ names + ages, favorite teams, last vacation, biggest current challenge, how they take their coffee. Reference before every single touch.</li>
              <li>• Send them client appreciation event invites even if they’re not past clients. Being included in the “inner circle” matters more than you think.</li>
              <li>• Give A+ first access to any new tool, report, or opportunity 48–72 hours before the rest of the database.</li>
              <li>• After any referral, send a high-end thank-you (not the cheap stuff) + handwritten note within 48 hours. Make it memorable.</li>
              <li>• Once a year, ask them directly: “Who are the three people in your world I should know?” Then actually follow up on the introductions.</li>
            </ul>
            <div class="mt-4 p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">In a 1,000+ contact database, your A+ list is your real business. Everything else is maintenance. Protect the time you spend here like you protect a closing appointment.</div>
          `
        },
        'past-clients': {
          title: "Past Clients — Your Highest-ROI Goldmine",
          content: `
  
            <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
              <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Past Clients Convert So Well</span></div>
              <p class="text-[15px]">They already trust you. They’ve seen you deliver under pressure. They know your name the moment real estate comes up with friends or family. Systematic, relevant, human touches here beat almost any other lead source on ROI — often by 5–10x. In scaling mode, past clients are the easiest to systematize while still keeping personal because the relationship foundation already exists.</p>
            </div>
            <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Non-Negotiable Annual Touches (The 33-Touch Made Real)</h4>
            <ul class="text-[15px] space-y-2 mb-6">
              <li><strong>Home Anniversary (single most powerful touch)</strong> — Handwritten card + small meaningful gift + quick neighborhood equity/market snapshot (1–2 sentences). Offer to run numbers “just for fun, no pressure at all.” This one frequently triggers listing or move-up conversations + referrals.</li>
              <li><strong>Birthday</strong> — Short personal video (30–45 sec) or really nice card. Reference something specific from their life or last conversation.</li>
              <li><strong>2–3 additional personal touches</strong> (handwritten “just because” note, life-event response, holiday gift or pop-by, quick equity check-in text when rates move meaningfully).</li>
              <li><strong>Annual Equity Review</strong> — Even in high-rate environments, people love knowing their position. Many will listing, cash-out, or move-up when they see the actual number.</li>
            </ul>
            <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Scripts (Copy &amp; Personalize)</h4>
            <div class="space-y-3 mb-6">
              <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="[Name], I can’t believe it’s already [X] years since you got the keys! Hope the house is still treating you well. I pulled a quick update on values in your neighborhood — happy to hop on a 10-minute call if you’re ever curious what your equity looks like these days. No strings attached, just thought you’d want to know.">
                <div class="flex justify-between items-start gap-3">
                  <div class="flex-1">
                    <strong class="text-sm font-semibold">Anniversary Card / Video Message</strong>
                    <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“[Name], I can’t believe it’s already [X] years since you got the keys! Hope the house is still treating you well. I pulled a quick update on values in your neighborhood — happy to hop on a 10-minute call if you’re ever curious what your equity looks like these days. No strings attached, just thought you’d want to know.”</div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                    <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Past Client: Anniversary', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'database-nurture');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                  </div>
                </div>
              </div>
              <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name], rates have moved a bit since we closed. If you’ve ever thought about what a listing or cash-out could look like for your situation (or even just want to know what your equity is doing), I’m happy to run the real numbers for you — no pitch, just information. Takes 8 minutes.">
                <div class="flex justify-between items-start gap-3">
                  <div class="flex-1">
                    <strong class="text-sm font-semibold">Equity Check-In Text (When Rates Move)</strong>
                    <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name], rates have moved a bit since we closed. If you’ve ever thought about what a listing or cash-out could look like for your situation (or even just want to know what your equity is doing), I’m happy to run the real numbers for you — no pitch, just information. Takes 8 minutes.”</div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                    <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Past Client: Equity Text', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'database-nurture');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                  </div>
                </div>
              </div>
            </div>
            <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Pro Tips</h4>
            <ul class="text-[15px] space-y-1.5">
              <li>• Segment past clients by years since close + move-up potential + investor vs primary. Different messages land for each.</li>
              <li>• Never send the same generic “happy anniversary” card to everyone. Reference something specific from their file or last conversation.</li>
              <li>• After any touch, log it and set the next logical reminder immediately. The system only works if nothing falls through the cracks.</li>
              <li>• These people are perfect for client appreciation events and should receive your best value content first.</li>
              <li>• Ask every past client once a year: “Who in your world is thinking about buying or selling in the next 12–18 months?” Then follow up.</li>
            </ul>
          `
        },
        'sphere-of-influence': {
          title: "Sphere of Influence — Warm &amp; Authentic",
          content: `
  
            <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
              <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Your Sphere Still Matters (Even When They’re Not “A+”)</span></div>
              <p class="text-[15px]">Friends, family, old coworkers, neighbors, parents from kids’ sports, church, gym — they already like and trust you as a person. They just don’t always think of you when real estate comes up. Your job is to keep the relationship warm and the association top-of-mind without ever being salesy. In a large database, this group is perfect for personal + social nurturing that feels natural and costs very little time per person.</p>
            </div>
            <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Touch Strategy (Lower Pressure, High Authenticity)</h4>
            <ul class="text-[15px] space-y-2 mb-6">
              <li>2–3 personal touches per year (handwritten notes for big life moments, short videos, meaningful social comments + occasional DMs)</li>
              <li>Share personal + local content on social that they actually see (family with permission, hobbies, local wins, real life)</li>
              <li>Occasional genuinely useful value shares (market snapshot for their neighborhood, a helpful first-time buyer checklist, a contractor they might need)</li>
              <li>Invite to one client appreciation event per year (they love being included)</li>
              <li>Immediate, warm response to any life event you hear about</li>
            </ul>
            <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Low-Pressure Messages</h4>
            <div class="space-y-3 mb-6">
              <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name]! Saw your post about the new job / grandbaby / move / big win — huge congrats! If housing or real estate questions ever come up as things settle, I’m always happy to be a resource (no pitch, just here if you need me or anyone in your world does).">
                <div class="flex justify-between items-start gap-3">
                  <div class="flex-1">
                    <strong class="text-sm font-semibold">Life Event / Big News Congrats</strong>
                    <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name]! Saw your post about the new job / grandbaby / move / big win — huge congrats! If housing or real estate questions ever come up as things settle, I’m always happy to be a resource (no pitch, just here if you need me or anyone in your world does).”</div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                    <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Sphere: Life Event Congrats', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'database-nurture');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                  </div>
                </div>
              </div>
            </div>
            <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Pro Tips</h4>
            <ul class="text-sm space-y-1">
              <li>• Post consistently on social with personal + local content — this is free, high-leverage nurturing for your entire sphere at once.</li>
              <li>• Remember birthdays and send a quick personal text or 20-second voice note. It stands out massively in a world of group texts.</li>
              <li>• Never hard-sell your sphere. The only goal is: when they or someone they know needs a lender, you are the first and only name that comes to mind.</li>
              <li>• Use social comments as your main touch for most of sphere — it keeps you visible with almost zero extra time.</li>
            </ul>
          `
        },
        'referral-partners': {
          title: "Referral Partners — Make Them Indispensable",
          content: `
  
            <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
              <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why This Is Your Real Growth Engine</span></div>
              <p class="text-[15px]">Lenders, builders, financial planners, attorneys, and other professionals who regularly send you business are the A+ VIPs of your actual business. Treat them like royalty because they are. Value-first, ridiculously consistent, and always making their life easier. In scaling, focus 80% of partner energy on the 10–15 who actually send you referrals consistently. The rest are nice-to-haves.</p>
            </div>
            <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Core System (Quarterly + Trigger-Based)</h4>
            <ul class="text-[15px] space-y-2 mb-6">
              <li>Quarterly high-value touch (nice gift, co-marketing piece they can actually use, lunch, mastermind invite, joint open house support)</li>
              <li>Immediate thank-you + status update every single time they send a client (within 24 hours, then again at key milestones)</li>
              <li>Regular value they can forward (neighborhood market reports, buyer/seller tip one-pagers, co-branded first-time buyer guides)</li>
              <li>Real personal relationship (remember their kids, their goals, their current challenges, their wins)</li>
            </ul>
            <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Partner Messages</h4>
            <div class="space-y-3 mb-6">
              <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="[Name] — saw you closed that tricky one on Maple. You handled it like a pro. Dropping off a little something to celebrate. Let me know how I can make the next one even smoother for you and your clients.">
                <div class="flex justify-between items-start gap-3">
                  <div class="flex-1">
                    <strong class="text-sm font-semibold">Just-Because Note to Top Co-Broke Partner or Sphere Contact (Handwritten or Text + Gift)</strong>
                    <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“[Name] — saw you closed that tricky one on Maple. You handled it like a pro. Dropping off a little something to celebrate. Let me know how I can make the next one even smoother for you and your clients.”</div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                    <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Partner: Just Because Note', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'database-nurture');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                  </div>
                </div>
              </div>
            </div>
            <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Pro Tips</h4>
            <ul class="text-sm space-y-1">
              <li>• Focus 80% of your partner energy on the top 10–15 who actually send you business consistently. The long tail is a distraction until they prove themselves.</li>
              <li>• Offer to do joint open houses, co-host first-time buyer workshops, or create simple one-pagers they can give their clients. Make them look good.</li>
              <li>• Never ask for referrals in the first 3–6 months of a new partner relationship. Earn it first with value and reliability.</li>
              <li>• When they send you a file, treat the client like gold and over-communicate back to the partner. That loop is what creates loyalty.</li>
            </ul>

            <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div onclick="if(typeof window.openReferralPartnersTool==='function'){window.openReferralPartnersTool();}else{window.location.hash='referrals';}" 
                   class="cursor-pointer inline-flex items-center gap-2 text-sm font-semibold text-[#00A89D] hover:underline">
                → Open the full Referral Partners Tool (playbooks • tiers • sequences • objections)
              </div>
            </div>
          `
        },
        'community-connections': {
          title: "Community Connections — Become the Local Expert",
          content: `
  
            <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
              <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Local Network Pays Off at Scale</span></div>
              <p class="text-[15px]">Small business owners, school parents, HOA leaders, charity organizers, local real estate-adjacent pros (title, insurance, inspectors, etc.). When you become known as the helpful, generous, never-pushy real estate person in your town, business flows to you without you chasing it. This tier is ideal for social + event + light personal nurturing that builds reputation and visibility with very little one-on-one time.</p>
            </div>
            <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">How to Nurture (High Visibility, Low Time Per Person)</h4>
            <ul class="text-[15px] space-y-2 mb-6">
              <li>Local business spotlights on social (tag them — they almost always repost and expand your reach)</li>
              <li>Attend and genuinely support 2–3 community events per quarter (take photos, make introductions, answer questions, be useful)</li>
              <li>Offer simple value (first-time buyer workshop for a local moms group, “what your home is worth” lunch &amp; learn for an HOA or neighborhood, contractor referral list)</li>
              <li>Occasional handwritten notes or small gifts to the 5–10 key connectors who repeatedly cross your path</li>
            </ul>
            <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Pro Tips</h4>
            <ul class="text-sm space-y-1">
              <li>• Pick 3–5 organizations, neighborhoods, or causes and go deep instead of spreading thin. Depth creates reputation faster than breadth.</li>
              <li>• Always give more than you take at events. Answer questions for free. Make introductions. Be the helpful one in the room.</li>
              <li>• Turn your best local content into evergreen pieces you can re-use across multiple channels and quarters.</li>
              <li>• Tag every local business and organization you spotlight. The reciprocity is real and compounds.</li>
            </ul>
          `
        },
        'prospects': {
          title: "Prospects — Stay Helpful Until They’re Ready",
          content: `
  
            <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
              <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why You Must Nurture Prospects (The Silent Revenue)</span></div>
              <p class="text-[15px]">People who inquired, got pre-approved, or started the process but didn’t move forward yet. Timing wasn’t right, credit needed work, life got in the way, rates scared them, or they simply weren’t emotionally ready. If you disappear, they will use whoever is in front of them when they finally are ready. Stay the helpful expert and you win the business (and their referrals) when the time comes — often 6–24 months later.</p>
            </div>
            <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Light, Valuable Cadence (Never Salesy)</h4>
            <ul class="text-[15px] space-y-2 mb-6">
              <li>Monthly or quarterly value email / newsletter (market update specific to their price range, buyer tips, “what’s happening in neighborhoods they were looking at”)</li>
              <li>Occasional personal check-in only if you had a real conversation (short text or 20-sec video: “Hey, just thinking about you — rates moved a bit, happy to run fresh numbers if the timing feels better now. No pressure.”)</li>
              <li>Invite to any first-time buyer or educational events you host</li>
              <li>Respond warmly to any life event you hear about through social or mutual connections</li>
            </ul>
            <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Pro Tips</h4>
            <ul class="text-sm space-y-1">
              <li>• Never sound salesy. The consistent message should be: “I’m still here and still happy to help when the time is right for you.”</li>
              <li>• Segment by where they were in the process (pre-approval stage, just browsing, credit issue, rate-sensitive, etc.) and tailor the value you send.</li>
              <li>• Track last touch date so no one falls through the cracks for 9+ months. Set a simple CRM tag or spreadsheet reminder.</li>
              <li>• These people often convert when you least expect it. The ones who felt “cold” 14 months ago become your easiest deals because the relationship was already warm.</li>
            </ul>
          `
        }
      };

      const localData = RICH_DB_PILLARS[pillar];
      if (!localData) {
        console.warn('No rich pillar content for', pillar);
        window.notifyUser('Detailed content for this pillar is being expanded — check back after refresh or contact support.', 'warning', 3200);
        return;
      }

      const richPillarTitle = typeof window.getDatabasePillarModalTitle === 'function'
        ? window.getDatabasePillarModalTitle(pillar) : null;
      if (titleEl) titleEl.textContent = richPillarTitle || localData.title;

      if (typeof window.renderRichDatabasePillarModal === 'function' && window.renderRichDatabasePillarModal(pillar, contentEl)) {
        // bespoke database pillar renderer
      } else if (contentEl) contentEl.innerHTML = localData.content || '';

      if (contentEl && !contentEl.querySelector('#nurture-bridge-script')) {
        const bridgeBtn = document.createElement('button');
        bridgeBtn.type = 'button';
        bridgeBtn.id = 'nurture-bridge-script';
        bridgeBtn.className = 'w-full mt-6 py-3 rounded-2xl bg-[#002B5C] text-white font-semibold hover:bg-black transition';
        bridgeBtn.textContent = 'Open Script Generator for this pillar →';
        bridgeBtn.addEventListener('click', () => {
          const sample = contentEl.querySelector('[data-copy-text]')?.getAttribute('data-copy-text') || '';
          if (typeof closeDetailModal === 'function') closeDetailModal();
          else { modal.classList.add('hidden'); modal.style.display = 'none'; }
          if (window.ToolBridges?.bridgeNurtureToScript) {
            window.ToolBridges.bridgeNurtureToScript(pillar, sample);
          } else if (typeof window.showSection === 'function') {
            window.showSection('sales-script');
          }
        });
        contentEl.appendChild(bridgeBtn);
      }

      if (typeof window.openNamedModal === 'function') {
        window.openNamedModal(modal);
      } else {
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.style.zIndex = '9999';
        modal.style.pointerEvents = 'auto';
        document.body.classList.add('modal-open');
      }
      if (typeof window.ensureModalBackdropClose === 'function') {
        window.ensureModalBackdropClose(modal);
      }
    } catch (err) {
      console.error('Error in openDatabaseModal:', err);
      window.notifyUser('Could not open the modal. Please use the "Close Modals" button or press Escape, then try again.', 'error', 5000);
    }
  };

  // Rich content for Life Events and Scaling modals
  const DETAIL_CONTENT = {
    'life-event': {
      'marriage': {
        title: "Marriage / New Relationship",
        content: `
          <h4 class="font-bold text-[#00A89D]">When to Reach Out</h4>
          <p>Within 1-2 weeks of learning about the engagement or marriage.</p>

          <h4 class="font-bold mt-4">Suggested Script / Talking Points</h4>
          <p class="italic">“Congratulations on your engagement! That’s such exciting news. I know a lot of couples start thinking about their housing situation around this time — whether that means upgrading, combining households, or even investing in a property together. I’d love to be a resource if any of those conversations come up.”</p>

          <h4 class="font-bold mt-4">Best Practices</h4>
          <ul>
            <li>Offer to run a no-pressure “housing options for couples” conversation</li>
            <li>Share relevant market data for their area</li>
            <li>Follow up in 60-90 days with a light check-in</li>
          </ul>
        `
      },
      'baby': {
        title: "New Baby",
        content: `
          <h4 class="font-bold text-[#00A89D]">When to Reach Out</h4>
          <p>Within 2-4 weeks after the baby is born (or when you hear the news).</p>

          <h4 class="font-bold mt-4">Suggested Script</h4>
          <p class="italic">“Huge congratulations on the new baby! I hope everyone is doing well. I know space needs can change quickly with a new little one. If you ever want to look at what your current equity could do for a move-up or even a small renovation, I’m always happy to run some quick numbers — no pressure at all.”</p>

          <h4 class="font-bold mt-4">Follow-Up Ideas</h4>
          <ul>
            <li>Send a small baby-related gift (books, onesie with local theme)</li>
            <li>Offer a “growing family” equity review in 6-9 months</li>
          </ul>
        `
      },
      'job': {
        title: "Job Change / Promotion",
        content: `
          <h4 class="font-bold text-[#00A89D]">Best Approach</h4>
          <p>Congratulate first, then lightly open the door to a conversation about their new financial picture.</p>

          <h4 class="font-bold mt-4">Suggested Message</h4>
          <p class="italic">“Congratulations on the new role/promotion! That’s awesome. Big life changes like this often make people curious about their housing options or what their increased income + current equity could unlock. Happy to chat through some scenarios whenever it feels right for you.”</p>

          <h4 class="font-bold mt-4">Value Add</h4>
          <p>Offer to run a quick “what if” scenario based on their new salary range (without asking for exact numbers right away).</p>
        `
      },
      'empty-nest': {
        title: "Empty Nest",
        content: `
          <h4 class="font-bold text-[#00A89D]">Key Opportunities</h4>
          <ul>
            <li>Downsizing to a smaller, lower-maintenance home</li>
            <li>Cashing out equity for travel, investments, or helping kids</li>
            <li>Turning the current home into a rental/investment property</li>
          </ul>

          <h4 class="font-bold mt-4">Suggested Approach</h4>
          <p class="italic">“Now that the kids are out on their own, a lot of my clients start thinking about what they really want their next chapter to look like. Some downsize, some travel more, and some turn their current home into an income-producing asset. Would you ever want to explore what options look like for your situation?”</p>
        `
      },
      'retirement': {
        title: "Retirement",
        content: `
          <h4 class="font-bold text-[#00A89D]">Common Conversations</h4>
          <ul>
            <li>Reverse real estate (stay in home with cash flow)</li>
            <li>Downsizing + cash-out</li>
            <li>Helping adult children with down payments using home equity</li>
          </ul>

          <h4 class="font-bold mt-4">Suggested Script</h4>
          <p class="italic">“Congratulations on this next chapter! Retirement often brings up questions around housing costs, accessing equity, or even relocating. I’m happy to walk through some of the newer options available if any of that is on your mind.”</p>
        `
      },
      'divorce': {
        title: "Divorce or Inheritance",
        content: `
          <h4 class="font-bold text-[#00A89D]">Approach</h4>
          <p>Be extremely sensitive. Lead with support, not opportunity.</p>

          <h4 class="font-bold mt-4">Suggested Message</h4>
          <p class="italic">“I was sorry to hear about everything going on. I know this can be an overwhelming time financially and emotionally. If you ever want a completely no-pressure conversation about your housing options or what the numbers look like, I’m here as a resource — even if it’s just to answer questions.”</p>

          <h4 class="font-bold mt-4">Key Tip</h4>
          <p>Do not push any agenda. Your job in the short term is to be a calm, helpful professional they can trust.</p>
        `
      }
    },
    'scaling': {
      'segment': {
        title: "Segment Ruthlessly – The 80/20 Database System for 1,000+ Contacts",
        content: `
          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
            <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Ruthless Segmentation Protects Your Time &amp; Your Results</span></div>
            <p class="text-[15px]">When your database crosses 500–1,000 contacts, giving everyone “the same amount of love” is the single fastest way to burn out, dilute your impact, and leave the highest-leverage relationships starving. Top producers who scale to 100+ units per year while keeping sane hours all say the same thing: <strong>you must prioritize your finite time on the relationships that generate the most referrals, repeat business, and goodwill.</strong></p>
            <p class="text-sm mt-3">This is not cold or transactional. It is strategic generosity. You pour your best energy, your best gifts, your best calls, and your best presence into the people who will compound that generosity into more families helped and more stability for your own business and family. The rest get consistent value at scale — still cared for, just not at the expense of the 50 who move the needle.</p>
          </div>

          <h4 class="font-bold text-lg mb-2">The Brutal (and Liberating) Math</h4>
          <p class="text-sm mb-4">Assume an average closed transaction nets you ~$8,000–$12,000 after splits and expenses. A strong A+ VIP sends you 2–5 referrals per year. That is $16k–$60k+ in annual GCI from one human relationship. A C-tier contact who gets the same newsletter as 900 others might send you one referral every 2–3 years — if you’re lucky. Spending equal time across 1,000 people means your top 50 are getting roughly 5% of your nurturing attention while they should be getting 50%+. That is how good businesses stay small and great ones scale with joy.</p>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">The Three-Tier System (With Recommended Time Allocation)</h4>
          <div class="space-y-4 mb-6">
            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div class="flex items-center gap-2 mb-1"><span class="font-bold text-[#00A89D]">A+ VIPs — Top 40–60 people (≈50% of your personal nurturing time)</span></div>
              <p class="text-[15px]">Quarterly personal calls or coffees (15–25 min, agenda-free “how are you?”). Handwritten notes + meaningful small gifts on anniversaries + birthdays. Immediate life-event response. First access to events and high-value content. These are the people you know by name, kids’ names, and recent wins. They send you business because they feel known and appreciated.</p>
            </div>
            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div class="flex items-center gap-2 mb-1"><span class="font-bold text-[#00A89D]">B Tier — Next 150–250 (≈30% of time + high-touch scalable)</span></div>
              <p class="text-[15px]">Personalized video messages 2–4x/year. Event invites + follow-up. Quarterly value touches (market snapshot specific to their neighborhood or situation). Occasional handwritten note when they engage or refer. These are your “rising” relationships — past clients with potential, referral partners who have sent once or twice, sphere who are active in your world.</p>
            </div>
            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div class="flex items-center gap-2 mb-1"><span class="font-bold">C Tier — The Rest (20% of time, fully automated + social)</span></div>
              <p class="text-[15px]">Newsletter / value email monthly or quarterly. Social engagement (comments, likes, shares on their posts). Automated birthday/anniversary reminders that trigger a low-effort but personal video or text. They still feel remembered, but you are not spending one-on-one hours here. This tier is where most of your database lives — and that is healthy.</p>
            </div>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">How to Actually Implement Segmentation (30-Minute Quarterly Ritual)</h4>
          <ol class="text-sm space-y-1.5 mb-6 pl-5 list-decimal">
            <li>Export or filter your full database in your CRM (or spreadsheet) by last close date + referral history + last touch date.</li>
            <li>Tag or label everyone: A+ / B / C. Be ruthless the first time — you can always move people up later.</li>
            <li>Review criteria: Has this person sent me a referral or high-intent intro in last 18 months? Do I have a real personal relationship? Would losing touch with them hurt my business or my heart?</li>
            <li>Block 30 minutes on your calendar the first week of each quarter. Go through the list. Move 5–10 people up or down based on real behavior, not hope.</li>
            <li>Document the “why” in a private CRM note so future you remembers the decision.</li>
          </ol>

          <div class="p-4 bg-white dark:bg-gray-900 border border-[#00A89D]/40 rounded-2xl text-sm mb-6">
            <strong class="block mb-1 text-[#00A89D]">Sample Weekly Time Allocation (1,000+ Database Owner)</strong><br>
            4–6 A+ personal calls or coffees • 8–12 handwritten notes (mostly A+, some rising B) • 15–20 short personalized videos (B tier + A+ birthdays) • 1 client appreciation or partner event focused on A+/top B • Everything else automated or social.
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Pro Tips &amp; Mindset Shifts That Create Buy-In</h4>
          <ul class="text-sm space-y-1 mb-2">
            <li>• Feeling guilty about “neglecting” the C tier is normal at first. Remind yourself: consistent automated value + social presence is more than 95% of agents ever give anyone.</li>
            <li>• The people in C tier today can (and do) move to B or A+ when life happens or when they finally experience your value. The system is designed for movement.</li>
            <li>• Your A+ list should feel like a privilege to be on. When someone moves up, tell them in a personal way — it deepens the relationship instantly.</li>
            <li>• Track referrals by tier for 90 days. The numbers will silence any remaining doubt about where your time belongs.</li>
          </ul>

          <div class="mt-4 p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
            <strong class="text-[#00A89D]">Credibility Note:</strong> Every single agent I’ve coached who broke through 80–100+ units per year while protecting family time credits “ruthless but generous segmentation” as the unlock. You are not a bad person for focusing. You are a responsible business owner who can actually deliver world-class care to the relationships that matter most.
          </div>
        `
      },
      'batch': {
        title: "Batch & Automate – Systems That Scale Without Losing Heart",
        content: `
          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
            <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Batching Feels Hard at First But Frees You</span></div>
            <p class="text-[15px]">The highest-ROI nurturing touches (personal videos, handwritten notes, thoughtful gifts) are also the most time-consuming if done one at a time. Batching lets you protect deep work for A+ relationships while still delivering volume touches that keep the rest of the database warm. The goal is never “zero effort” — it is “maximum impact per hour invested.”</p>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">The Weekly &amp; Monthly Batch Rituals</h4>
          <div class="grid md:grid-cols-2 gap-4 text-sm mb-6">
            <div class="border border-gray-200 rounded-2xl p-4">
              <strong class="block mb-1">Sunday 45–90 min “Content + Video Batch”</strong>
              <ul class="mt-1 space-y-1">
                <li>Record 12–20 birthday/anniversary videos in one sitting (use Loom or phone, keep them 25–45 seconds, reference something real)</li>
                <li>Write 8–15 handwritten notes while the videos render</li>
                <li>Queue your value newsletter or market update</li>
              </ul>
            </div>
            <div class="border border-gray-200 rounded-2xl p-4">
              <strong class="block mb-1">Monthly Gift &amp; Logistics Batch</strong>
              <ul class="mt-1 space-y-1">
                <li>Order 20–30 low-cost meaningful items at once (Temu/Amazon/local for speed + cost)</li>
                <li>Pre-address and label envelopes or boxes</li>
                <li>Outsource mailing if volume justifies a VA 4 hours/month</li>
              </ul>
            </div>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Tools That Make This Sustainable</h4>
          <ul class="text-sm space-y-1 mb-6">
            <li>• <strong>CRM automation</strong> for birthdays/anniversaries (set it to remind you 7 days early so you can batch)</li>
            <li>• <strong>Loom + phone notes app</strong> for fast personal videos</li>
            <li>• <strong>Canva + scheduler</strong> for value content that goes to B/C tiers</li>
            <li>• <strong>Simple VA or spouse help</strong> for physical mailing once a month</li>
            <li>• <strong>Recurring calendar blocks</strong> labeled “Nurture Batch — This Pays the Bills”</li>
          </ul>

          <div class="p-4 border border-[#00A89D]/30 rounded-2xl bg-white dark:bg-gray-900 text-sm">
            <strong>Pro Move:</strong> Create a “Nurture Batch” playlist on your phone with 10–15 of your favorite 30-second voice memo scripts. Hit record, read the name + one personal detail from your CRM, speak from the heart for 25 seconds, done. You will finish 20 in under an hour.
          </div>
        `
      },
      'track': {
        title: "Track What Works – Measurement That Actually Drives Decisions",
        content: `
          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
            <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Tracking Turns Good Intentions Into a Real System</span></div>
            <p class="text-[15px]">Most agents nurture randomly and then wonder why results are inconsistent. The ones who scale have a simple feedback loop: touch → log → review response/referral → double down or cut. You don’t need fancy dashboards. You need 3–4 numbers you actually look at every 90 days.</p>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">The Only Metrics That Matter</h4>
          <div class="grid md:grid-cols-2 gap-4 text-sm mb-6">
            <div class="border border-gray-200 rounded-2xl p-4">
              <strong>Referral Source Quality by Tier</strong><br>
              <span class="text-xs">Track: A+ sent X referrals (avg commission $Y). B sent Z. C sent almost none. This data makes segmentation decisions obvious and guilt-free.</span>
            </div>
            <div class="border border-gray-200 rounded-2xl p-4">
              <strong>Response &amp; Engagement Rate</strong><br>
              <span class="text-xs">Personal call/video vs mass email. Event attendance by tier. Who replies to your handwritten notes? These reveal what actually feels human to your people.</span>
            </div>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Dead-Simple Tracking System (No Fancy CRM Required)</h4>
          <p class="text-sm mb-4">One Google Sheet or CRM custom fields with columns: Name | Tier | Last Personal Touch Date | Last Response | Referrals Sent (12 mo) | Notes. Spend 10 minutes every Sunday updating the 5–10 people you touched that week. At the start of each quarter, sort by referrals and response rate. The winners get more of you. Losers get automated.</p>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Rule of Thumb That Has Saved Hundreds of Hours</h4>
          <p class="text-[15px]">Double down (more time, better gifts, more invites) on anything that generated a referral or warm conversation in the last 90 days. Ruthlessly reduce or automate anything that produced zero engagement after 3–4 touches. Your future self (and your family) will thank you.</p>

          <div class="mt-4 text-xs text-gray-500">Producers who review this data quarterly consistently report 2–3x better referral rates from the same size database while working fewer total hours on “random acts of nurturing.”</div>
        `
      }
    },
    'time-blocking': {
      'best-practices': {
        title: "Time Blocking Best Practices",
        content: `
          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
            <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why This Works</span></div>
            <p class="text-[15px]">Prospecting is the only activity that directly creates new business. Without protected, non-negotiable time on your calendar, it gets squeezed out by “urgent” but less important tasks (emails, admin, putting out fires). Top producers treat their prospecting blocks like they would a client appointment with a $50k commission on the line — because it is.</p>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">The Core Rules (Print This)</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
            <div class="border border-gray-200 rounded-2xl p-4">
              <strong class="block mb-1">1. Early in the Day</strong>
              <p>Do prospecting first thing — before emails, before showings, before the world wakes up. Your energy and focus are highest. Interruptions are lowest.</p>
            </div>
            <div class="border border-gray-200 rounded-2xl p-4">
              <strong class="block mb-1">2. Protect Like Appointments</strong>
              <p>Block it in your calendar in a distinct color (bright teal or orange). Do not move it for anything short of a true emergency or closing. Reschedule the block, don’t cancel it.</p>
            </div>
            <div class="border border-gray-200 rounded-2xl p-4">
              <strong class="block mb-1">3. Use 30–45 Minute Chunks</strong>
              <p>Smaller blocks are psychologically easier to protect and schedule. 4 x 30-minute blocks = 2 focused hours. Far better than one 2-hour block that gets broken.</p>
            </div>
            <div class="border border-gray-200 rounded-2xl p-4">
              <strong class="block mb-1">4. Color-Code &amp; Label Clearly</strong>
              <p>“PROSPECTING — Sphere”, “PROSPECTING — Past Clients”, “PROSPECTING — Partners”. The visual cue makes it sacred.</p>
            </div>
            <div class="border border-gray-200 rounded-2xl p-4">
              <strong class="block mb-1">5. Review &amp; Adjust Every Sunday</strong>
              <p>Look at what actually happened last week. Did you hit your blocks? What interrupted you? Adjust the next week’s blocks accordingly (move to earlier, add buffer, batch similar tasks).</p>
            </div>
            <div class="border border-gray-200 rounded-2xl p-4">
              <strong class="block mb-1">6. Batch Admin &amp; Follow-Up</strong>
              <p>Never do admin or follow-up inside your prospecting block. Prospecting = new conversations or touches only. Admin goes in a separate block later.</p>
            </div>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Sample Weekly Blocks (Adapt to Your Schedule)</h4>
          <div class="text-sm mb-6 space-y-2">
            <p><strong>High-Availability Agent (3+ hrs/day):</strong> 7:30–8:00 Sphere &amp; past client touches • 8:00–8:30 Partner value drops (lenders, fellow agents) • 10:00–10:30 Open house / listing prep • 4:00–4:30 Follow-ups on warm buyers &amp; sellers</p>
            <p><strong>Busy Agent (90–120 min/day):</strong> 6:45–7:15 Sphere texts &amp; short calls • 7:15–7:45 Past client check-ins • One 30-min block mid-week for partner outreach or prospect follow-up</p>
            <p><strong>Part-Time or New Agent:</strong> 3 focused 30-min blocks: Mon/Wed/Fri 7am sharp. Consistency > volume when you’re building the habit.</p>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Common Pitfalls (and Fixes)</h4>
          <ul class="text-sm space-y-1 mb-6">
            <li>• <strong>Scheduling too late in the day</strong> — Fix: Move the first block to before 8am. Protect the second as “make-up” if morning gets destroyed.</li>
            <li>• <strong>Letting “quick emails” eat the block</strong> — Fix: Close email and CRM notifications during the block. Use a physical timer or phone Do Not Disturb with a 30-min focus mode.</li>
            <li>• <strong>No buffer between blocks</strong> — Fix: Add 5–10 min buffer so one overrun doesn’t kill the next.</li>
            <li>• <strong>Never reviewing</strong> — Fix: Sunday 15-min review is non-negotiable. Treat it like a meeting with your future self.</li>
          </ul>

          <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm mb-4">
            <strong class="text-[#00A89D]">Pro Move:</strong> Put your prospecting blocks on a recurring calendar invite that you send to yourself with the subject “This is how I pay my real estate.” Make it impossible to ignore.
          </div>

          <p class="text-[15px]"><a href="https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Adam%20Images%20to%20Host/Time%20Blocking%20Calendar%20with%20Clear%20All%20and%20ICS%20Export.xlsm" target="_blank" class="text-[#00A89D] hover:underline font-semibold">Download the original Time Blocking Spreadsheet →</a></p>
        `
      }
    },
    'database': {
      'a-plus-vips': {
        title: "A+ VIPs — Your Platinum Tier (The 50 Who Fund Your Business)",
        content: `

          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
            <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why This Segment Is Everything</span></div>
            <p class="text-[15px]">Your top 50 people (top referral partners and past clients who actually send you business, influential past clients, family/friends who refer consistently, community leaders) will generate more closed business than the other 950 combined when nurtured at platinum level. These are the relationships that send you 2–5 referrals per year without you ever asking. In a 1,000+ database world, equal treatment of everyone is malpractice. Your A+ list deserves (and repays) disproportionate time, presence, and generosity.</p>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Identification Criteria (Be Ruthless — This List Should Hurt a Little to Curate)</h4>
          <ul class="text-[15px] space-y-1.5 mb-6 pl-4 list-disc">
            <li>Have referred you at least once in the last 24 months OR sent multiple clients historically</li>
            <li>Are in a position of real influence (busy business owners, natural connectors, active sphere members in your community)</li>
            <li>You have a genuine personal relationship beyond the transaction (you know kids’ names, hobbies, recent vacations, challenges)</li>
            <li>Losing regular contact with them would actually cost you meaningful business or relationships you care about</li>
          </ul>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Platinum Touch Cadence (Minimum — Protect This Ruthlessly)</h4>
          <div class="bg-white dark:bg-gray-900 border border-gray-200 rounded-2xl p-5 text-[15px] mb-6">
            <ul class="space-y-2.5">
              <li><strong>Quarterly personal call or coffee</strong> (15–25 min, zero agenda other than “how are you and the family? How can I actually help you right now?” — listen 80%)</li>
              <li><strong>Handwritten note + meaningful small gift on home anniversary</strong> (monogram cutting board, local honey + nice card, plant, their favorite coffee, something that shows you know them)</li>
              <li><strong>Birthday video or handwritten card</strong> (30–60 seconds, personal, reference one specific thing you know about them this year)</li>
              <li><strong>Annual equity review offer</strong> (in person or 12-min video call — this single touch often generates listing or move-up business + referrals)</li>
              <li><strong>Invite to 1–2 client appreciation events per year</strong> (always allow +1, treat them like honored guests)</li>
              <li><strong>Same-day or next-day response to any life event</strong> (baby, promotion, loss, move, divorce — be the first to show up)</li>
            </ul>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Platinum Scripts &amp; Messages (Copy + Save any)</h4>
          <div class="space-y-3 mb-6">
            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name], it’s [Your Name]. I was thinking about you this morning and realized it’s been way too long since we caught up. No real estate stuff — I just wanted to hear how you and the family are doing. Got 10–12 minutes this week?">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                  <strong class="text-sm font-semibold">Platinum Call Opener (Phone or Coffee)</strong>
                  <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name], it’s [Your Name]. I was thinking about you this morning and realized it’s been way too long since we caught up. No real estate stuff — I just wanted to hear how you and the family are doing. Got 10–12 minutes this week?”</div>
                  <div class="text-xs text-gray-500 mt-1">Then shut up and listen. End with: “If anything real estate related ever comes up for you or anyone you know, I’m always here. No pressure ever.”</div>
                </div>
                <div class="flex flex-col gap-1">
                  <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('A+ VIP: Call Opener', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'database-nurture');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>

            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name] — saw the post about [specific thing: new grandbaby, big promotion, kid’s graduation, tough week at work]. That’s awesome / I’m so sorry / that’s huge. No agenda, just wanted you to know I’m thinking about you and rooting for you. If there’s ever anything I can do to make life easier (even something as small as a referral to a great contractor or whatever), just say the word.">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                  <strong class="text-sm font-semibold">Life Event Text / DM (Same Day)</strong>
                  <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name] — saw the post about [specific thing: new grandbaby, big promotion, kid’s graduation, tough week at work]. That’s awesome / I’m so sorry / that’s huge. No agenda, just wanted you to know I’m thinking about you and rooting for you. If there’s ever anything I can do to make life easier (even something as small as a referral to a great contractor or whatever), just say the word.”</div>
                </div>
                <div class="flex flex-col gap-1">
                  <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('A+ VIP: Life Event Text', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'database-nurture');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>

            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Happy Birthday [Name]! Hope this year treats you and the family even better than the last one. I’m grateful to have you in my world — not just as a [client/partner/friend], but as someone I genuinely enjoy. Here’s to more [inside reference: golf rounds / coffee catch-ups / kid sports wins / great closings].">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                  <strong class="text-sm font-semibold">Birthday Video Script (30–45 sec)</strong>
                  <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Happy Birthday [Name]! Hope this year treats you and the family even better than the last one. I’m grateful to have you in my world — not just as a [client/partner/friend], but as someone I genuinely enjoy. Here’s to more [inside reference: golf rounds / coffee catch-ups / kid sports wins / great closings].”</div>
                </div>
                <div class="flex flex-col gap-1">
                  <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('A+ VIP: Birthday Video', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'database-nurture');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Pro Tips for A+ VIPs (The Details That Compound)</h4>
          <ul class="text-[15px] space-y-1.5 mb-2">
            <li>• Keep a private “human notes” field in your CRM: kids’ names + ages, favorite teams, last vacation, biggest current challenge, how they take their coffee. Reference before every single touch.</li>
            <li>• Send them client appreciation event invites even if they’re not past clients. Being included in the “inner circle” matters more than you think.</li>
            <li>• Give A+ first access to any new tool, report, or opportunity 48–72 hours before the rest of the database.</li>
            <li>• After any referral, send a high-end thank-you (not the cheap stuff) + handwritten note within 48 hours. Make it memorable.</li>
            <li>• Once a year, ask them directly: “Who are the three people in your world I should know?” Then actually follow up on the introductions.</li>
          </ul>

          <div class="mt-4 p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">In a 1,000+ contact database, your A+ list is your real business. Everything else is maintenance. Protect the time you spend here like you protect a closing appointment.</div>
        `
      },
      'past-clients': {
        title: "Past Clients — Your Highest-ROI Goldmine",
        content: `

          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
            <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Past Clients Convert So Well</span></div>
            <p class="text-[15px]">They already trust you. They’ve seen you deliver under pressure. They know your name the moment real estate comes up with friends or family. Systematic, relevant, human touches here beat almost any other lead source on ROI — often by 5–10x. In scaling mode, past clients are the easiest to systematize while still keeping personal because the relationship foundation already exists.</p>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Non-Negotiable Annual Touches (The 33-Touch Made Real)</h4>
          <ul class="text-[15px] space-y-2 mb-6">
            <li><strong>Home Anniversary (single most powerful touch)</strong> — Handwritten card + small meaningful gift + quick neighborhood equity/market snapshot (1–2 sentences). Offer to run numbers “just for fun, no pressure at all.” This one frequently triggers listing or move-up conversations + referrals.</li>
            <li><strong>Birthday</strong> — Short personal video (30–45 sec) or really nice card. Reference something specific from their life or last conversation.</li>
            <li><strong>2–3 additional personal touches</strong> (handwritten “just because” note, life-event response, holiday gift or pop-by, quick equity check-in text when rates move meaningfully).</li>
            <li><strong>Annual Equity Review</strong> — Even in high-rate environments, people love knowing their position. Many will listing, cash-out, or move-up when they see the actual number.</li>
          </ul>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Scripts (Copy &amp; Personalize)</h4>
          <div class="space-y-3 mb-6">
            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="[Name], I can’t believe it’s already [X] years since you got the keys! Hope the house is still treating you well. I pulled a quick update on values in your neighborhood — happy to hop on a 10-minute call if you’re ever curious what your equity looks like these days. No strings attached, just thought you’d want to know.">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                  <strong class="text-sm font-semibold">Anniversary Card / Video Message</strong>
                  <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“[Name], I can’t believe it’s already [X] years since you got the keys! Hope the house is still treating you well. I pulled a quick update on values in your neighborhood — happy to hop on a 10-minute call if you’re ever curious what your equity looks like these days. No strings attached, just thought you’d want to know.”</div>
                </div>
                <div class="flex flex-col gap-1">
                  <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Past Client: Anniversary', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'database-nurture');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>

            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name], rates have moved a bit since we closed. If you’ve ever thought about what a listing or cash-out could look like for your situation (or even just want to know what your equity is doing), I’m happy to run the real numbers for you — no pitch, just information. Takes 8 minutes.">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                  <strong class="text-sm font-semibold">Equity Check-In Text (When Rates Move)</strong>
                  <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name], rates have moved a bit since we closed. If you’ve ever thought about what a listing or cash-out could look like for your situation (or even just want to know what your equity is doing), I’m happy to run the real numbers for you — no pitch, just information. Takes 8 minutes.”</div>
                </div>
                <div class="flex flex-col gap-1">
                  <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Past Client: Equity Text', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'database-nurture');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Pro Tips</h4>
          <ul class="text-[15px] space-y-1.5">
            <li>• Segment past clients by years since close + move-up potential + investor vs primary. Different messages land for each.</li>
            <li>• Never send the same generic “happy anniversary” card to everyone. Reference something specific from their file or last conversation.</li>
            <li>• After any touch, log it and set the next logical reminder immediately. The system only works if nothing falls through the cracks.</li>
            <li>• These people are perfect for client appreciation events and should receive your best value content first.</li>
            <li>• Ask every past client once a year: “Who in your world is thinking about buying or selling in the next 12–18 months?” Then follow up.</li>
          </ul>
        `
      },
      'sphere-of-influence': {
        title: "Sphere of Influence — Warm &amp; Authentic",
        content: `

          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
            <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Your Sphere Still Matters (Even When They’re Not “A+”)</span></div>
            <p class="text-[15px]">Friends, family, old coworkers, neighbors, parents from kids’ sports, church, gym — they already like and trust you as a person. They just don’t always think of you when real estate comes up. Your job is to keep the relationship warm and the association top-of-mind without ever being salesy. In a large database, this group is perfect for personal + social nurturing that feels natural and costs very little time per person.</p>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Touch Strategy (Lower Pressure, High Authenticity)</h4>
          <ul class="text-[15px] space-y-2 mb-6">
            <li>2–3 personal touches per year (handwritten notes for big life moments, short videos, meaningful social comments + occasional DMs)</li>
            <li>Share personal + local content on social that they actually see (family with permission, hobbies, local wins, real life)</li>
            <li>Occasional genuinely useful value shares (market snapshot for their neighborhood, a helpful first-time buyer checklist, a contractor they might need)</li>
            <li>Invite to one client appreciation event per year (they love being included)</li>
            <li>Immediate, warm response to any life event you hear about</li>
          </ul>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Low-Pressure Messages</h4>
          <div class="space-y-3 mb-6">
            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name]! Saw your post about the new job / grandbaby / move / big win — huge congrats! If housing or real estate questions ever come up as things settle, I’m always happy to be a resource (no pitch, just here if you need me or anyone in your world does).">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                  <strong class="text-sm">Life Event / Big News Congrats</strong>
                  <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name]! Saw your post about the new job / grandbaby / move / big win — huge congrats! If housing or real estate questions ever come up as things settle, I’m always happy to be a resource (no pitch, just here if you need me or anyone in your world does).”</div>
                </div>
                <div class="flex flex-col gap-1">
                  <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Sphere: Life Event Congrats', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'database-nurture');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Pro Tips</h4>
          <ul class="text-sm space-y-1">
            <li>• Post consistently on social with personal + local content — this is free, high-leverage nurturing for your entire sphere at once.</li>
            <li>• Remember birthdays and send a quick personal text or 20-second voice note. It stands out massively in a world of group texts.</li>
            <li>• Never hard-sell your sphere. The only goal is: when they or someone they know needs a lender, you are the first and only name that comes to mind.</li>
            <li>• Use social comments as your main touch for most of sphere — it keeps you visible with almost zero extra time.</li>
          </ul>
        `
      },
      'referral-partners': {
        title: "Referral Partners — Make Them Indispensable",
        content: `

          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
            <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why This Is Your Real Growth Engine</span></div>
            <p class="text-[15px]">Lenders, builders, financial planners, attorneys, and other professionals who regularly send you business are the A+ VIPs of your actual business. Treat them like royalty because they are. Value-first, ridiculously consistent, and always making their life easier. In scaling, focus 80% of partner energy on the 10–15 who actually send you referrals consistently. The rest are nice-to-haves.</p>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Core System (Quarterly + Trigger-Based)</h4>
          <ul class="text-[15px] space-y-2 mb-6">
            <li>Quarterly high-value touch (nice gift, co-marketing piece they can actually use, lunch, mastermind invite, joint open house support)</li>
            <li>Immediate thank-you + status update every single time they send a client (within 24 hours, then again at key milestones)</li>
            <li>Regular value they can forward (neighborhood market reports, buyer/seller tip one-pagers, co-branded first-time buyer guides)</li>
            <li>Real personal relationship (remember their kids, their goals, their current challenges, their wins)</li>
          </ul>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Partner Messages</h4>
          <div class="space-y-3 mb-6">
            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="[Name] — saw you closed that tricky one on Maple. You handled it like a pro. Dropping off a little something to celebrate. Let me know how I can make the next one even smoother for you and your clients.">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                  <strong class="text-sm">Just-Because Note to Top Referral Partner (Handwritten or Text + Gift)</strong>
                  <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“[Name] — saw you closed that tricky one on Maple. You handled it like a pro. Dropping off a little something to celebrate. Let me know how I can make the next one even smoother for you and your clients.”</div>
                </div>
                <div class="flex flex-col gap-1">
                  <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Partner: Just Because Note', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'database-nurture');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Pro Tips</h4>
          <ul class="text-sm space-y-1">
            <li>• Focus 80% of your partner energy on the top 10–15 who actually send you business consistently. The long tail is a distraction until they prove themselves.</li>
            <li>• Offer to do joint open houses, co-host first-time buyer workshops, or create simple one-pagers they can give their clients. Make them look good.</li>
            <li>• Never ask for referrals in the first 3–6 months of a new partner relationship. Earn it first with value and reliability.</li>
            <li>• When they send you a file, treat the client like gold and over-communicate back to the partner. That loop is what creates loyalty.</li>
          </ul>

          <!-- Direct deep link to the full Referral Partners powerhouse (playbooks, tiers, sequences, objections) -->
          <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div onclick="if(typeof window.openReferralPartnersTool==='function'){window.openReferralPartnersTool();}else{window.location.hash='referrals';}" 
                 class="group cursor-pointer flex items-center justify-between gap-4 bg-gradient-to-r from-[#002B5C] to-[#00A89D] hover:from-[#001a3a] hover:to-[#008a7f] text-white rounded-3xl px-6 py-5 shadow-lg transition-all active:scale-[0.985]">
              <div class="flex-1">
                <div class="uppercase tracking-[1.5px] text-xs font-bold opacity-80 mb-0.5">GO DEEPER</div>
                <div class="font-bold text-lg">Open the Complete Referral Partners Tool &amp; Playbooks →</div>
                <div class="text-sm opacity-90 mt-0.5">6 partner-type deep-dive playbooks • A+/B/C tier philosophy &amp; scoring • 60-day onboarding sequences • Weekly value cadence scripts • Referral objections handlers • High-impact plays for lenders, co-broke agents, builders &amp; more</div>
              </div>
              <div class="hidden md:flex items-center justify-center w-12 h-12 rounded-2xl bg-white/15 group-hover:bg-white/25 transition-all">
                <i class="fas fa-arrow-right text-2xl"></i>
              </div>
            </div>
          </div>
        `
      },
      'community-connections': {
        title: "Community Connections — Become the Local Expert",
        content: `

          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
            <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Local Network Pays Off at Scale</span></div>
            <p class="text-[15px]">Small business owners, school parents, HOA leaders, charity organizers, local real estate-adjacent pros (title, insurance, inspectors, etc.). When you become known as the helpful, generous, never-pushy real estate person in your town, business flows to you without you chasing it. This tier is ideal for social + event + light personal nurturing that builds reputation and visibility with very little one-on-one time.</p>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">How to Nurture (High Visibility, Low Time Per Person)</h4>
          <ul class="text-[15px] space-y-2 mb-6">
            <li>Local business spotlights on social (tag them — they almost always repost and expand your reach)</li>
            <li>Attend and genuinely support 2–3 community events per quarter (take photos, make introductions, answer questions, be useful)</li>
            <li>Offer simple value (first-time buyer workshop for a local moms group, “what your home is worth” lunch &amp; learn for an HOA or neighborhood, contractor referral list)</li>
            <li>Occasional handwritten notes or small gifts to the 5–10 key connectors who repeatedly cross your path</li>
          </ul>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Pro Tips</h4>
          <ul class="text-sm space-y-1">
            <li>• Pick 3–5 organizations, neighborhoods, or causes and go deep instead of spreading thin. Depth creates reputation faster than breadth.</li>
            <li>• Always give more than you take at events. Answer questions for free. Make introductions. Be the helpful one in the room.</li>
            <li>• Turn your best local content into evergreen pieces you can re-use across multiple channels and quarters.</li>
            <li>• Tag every local business and organization you spotlight. The reciprocity is real and compounds.</li>
          </ul>
        `
      },
      'prospects': {
        title: "Prospects — Stay Helpful Until They’re Ready",
        content: `

          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
            <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why You Must Nurture Prospects (The Silent Revenue)</span></div>
            <p class="text-[15px]">People who inquired, got pre-approved, or started the process but didn’t move forward yet. Timing wasn’t right, credit needed work, life got in the way, rates scared them, or they simply weren’t emotionally ready. If you disappear, they will use whoever is in front of them when they finally are ready. Stay the helpful expert and you win the business (and their referrals) when the time comes — often 6–24 months later.</p>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Light, Valuable Cadence (Never Salesy)</h4>
          <ul class="text-[15px] space-y-2 mb-6">
            <li>Monthly or quarterly value email / newsletter (market update specific to their price range, buyer tips, “what’s happening in neighborhoods they were looking at”)</li>
            <li>Occasional personal check-in only if you had a real conversation (short text or 20-sec video: “Hey, just thinking about you — rates moved a bit, happy to run fresh numbers if the timing feels better now. No pressure.”)</li>
            <li>Invite to any first-time buyer or educational events you host</li>
            <li>Respond warmly to any life event you hear about through social or mutual connections</li>
          </ul>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Pro Tips</h4>
          <ul class="text-sm space-y-1">
            <li>• Never sound salesy. The consistent message should be: “I’m still here and still happy to help when the time is right for you.”</li>
            <li>• Segment by where they were in the process (pre-approval stage, just browsing, credit issue, rate-sensitive, etc.) and tailor the value you send.</li>
            <li>• Track last touch date so no one falls through the cracks for 9+ months. Set a simple CRM tag or spreadsheet reminder.</li>
            <li>• These people often convert when you least expect it. The ones who felt “cold” 14 months ago become your easiest deals because the relationship was already warm.</li>
          </ul>
        `
      }
    }
  };

  // Defensive stubs in case the full Value Vault script hasn't executed yet
  window.toggleValueVaultPillar = window.toggleValueVaultPillar || function(n) {
    console.warn('toggleValueVaultPillar called before full script loaded (pillar ' + n + ')');
  };

  window.showVaultItemModal = window.showVaultItemModal || function(id) {
    console.warn('showVaultItemModal called before full script loaded for id: ' + id);
    // Fallback: try to find a basic alert or wait for load
    try {
      window.notifyUser('Value Vault is still initializing. Please wait a second and click again, or refresh the page.', 'warning', 3200);
    } catch(e) {}
  };

  // =====================================================
  // VALUE VAULT — MODERN DATA-DRIVEN ARCHITECTURE (2026 Refresh)
  // All discrete, high-value micro-content extracted here for card + modal UX.
  // Original accordion markup will be progressively replaced.
  // =====================================================
  const VALUE_VAULT_ITEMS = [
    // ============================================================
    // PILLAR 1 — FULL POP-BY IDEAS LIBRARY (restored from original vault)
    // ============================================================

    // High-Value Framework Items (Best Practices + Sourcing)
    {
      id: 'popby-best-practices',
      pillar: 'partnerships',
      type: 'framework',
      title: 'Pop-By Best Practices & Strategy',
      teaser: 'When, how, and why to give — the complete system',
      content: `<strong>Pop-By Best Practices &amp; Strategy</strong>
        <div class="mt-4 space-y-5 text-sm">
          <div>
            <div class="font-semibold text-[#00A89D]">Core Philosophy</div>
            <p class="mt-1">Pop-bys are not about the gift — they are about the <strong>relationship and the story</strong>. The goal is to make the recipient feel known, appreciated, and top-of-mind. The best pop-bys get used repeatedly and trigger a positive thought about you every single time.</p>
          </div>
          <div>
            <div class="font-semibold text-[#00A89D]">Timing That Wins</div>
            <ul class="mt-1 space-y-1 pl-4 list-disc">
              <li>Within 48 hours of a referral or closing (highest impact)</li>
              <li>After a tough week or difficult transaction for the agent</li>
              <li>Seasonally (holidays, back-to-school, spring market kickoff)</li>
              <li>“Just because” — these often land the hardest because no one else does them</li>
            </ul>
          </div>
          <div>
            <div class="font-semibold text-[#00A89D]">Delivery Best Practices</div>
            <ul class="mt-1 space-y-1 pl-4 list-disc">
              <li>Keep the in-person drop under 60 seconds. Leave the gift + handwritten note and go.</li>
              <li>Always include a short personal note referencing something specific (recent referral, tough closing, their kid’s sports, etc.)</li>
              <li>Follow up by text the same day: “Hope the [gift] brings a smile. Let me know if I can support any of your buyers this week.”</li>
              <li>Track every pop-by in your CRM with the item given and the follow-up date.</li>
            </ul>
          </div>
          <div>
            <div class="font-semibold text-[#00A89D]">Rule of 80/20</div>
            <p class="mt-1">Spend $6–12 on 80% of your pop-bys. Save the $18–30 “wow” items for your top 10–15 referral partners and A+ clients. Consistency beats extravagance.</p>
          </div>
        </div>`,
      copyText: 'Pop-By Best Practices & Strategy framework'
    },
    {
      id: 'popby-sourcing-budget',
      pillar: 'partnerships',
      type: 'framework',
      title: 'Sourcing, Budgeting & Tracking System',
      teaser: 'Where to buy, how much to spend, and how to measure ROI',
      content: `<strong>Sourcing, Budgeting &amp; Tracking System</strong>
        <div class="mt-4 space-y-5 text-sm">
          <div>
            <div class="font-semibold text-[#00A89D]">Recommended Budget Split</div>
            <p class="mt-1">Most successful agents spend $150–300 per month on partner appreciation. Aim for 8–12 thoughtful touches per month.</p>
            <ul class="mt-2 space-y-1 pl-4 list-disc">
              <li>70% everyday / low-cost ($5–12)</li>
              <li>20% seasonal or mid-tier ($12–20)</li>
              <li>10% premium “wow” items for top partners ($25–40)</li>
            </ul>
          </div>
          <div>
            <div class="font-semibold text-[#00A89D]">Best Places to Source (Low-Cost + High-Impact)</div>
            <ul class="mt-1 space-y-1 pl-4 list-disc text-sm">
              <li><strong>Ultra low cost ($3–8):</strong> Dollar Tree, Five Below, Walmart clearance, <a href="https://www.amazon.com/s?k=bulk+small+gifts+under+10" target="_blank" class="text-[#00A89D] underline">Amazon bulk searches</a> (buy 24–50 at a time), <a href="https://www.temu.com/search.html?_bg_fs=1&search_key=small+gifts+under+8" target="_blank" class="text-[#00A89D] underline">Temu</a> for ultra-cheap fun items.</li>
              <li><strong>Good quality / high perceived value ($8–20):</strong> HomeGoods, TJ Maxx, Costco, Target clearance, local trophy/engraving shops, <a href="https://www.amazon.com/s?k=premium+small+gifts+agent" target="_blank" class="text-[#00A89D] underline">Amazon "small premium gifts"</a>.</li>
              <li><strong>Premium / personalized ($20+):</strong> Etsy (search “custom agent gifts” or “engraved tumbler”), 4imprint.com for bulk branded, local print shops for custom map art or notebooks.</li>
              <li><strong>Smart bulk strategy:</strong> Once you find a winner (tote, tumbler, candle), buy 24–50 on Amazon/Temu and store in your trunk. Rotate so it always feels fresh.</li>
              <li><strong>Local pro move:</strong> Build relationships with 2–3 local coffee shops, bakeries, or restaurants for bulk gift card or treat deals at a discount.</li>
            </ul>
            <p class="mt-2 text-xs italic text-gray-500">Always check current pricing and reviews before bulk buying. Temu and Amazon are great for testing new low-cost winners quickly.</p>
          </div>
          <div>
            <div class="font-semibold text-[#00A89D]">Simple Tracking System</div>
            <p class="mt-1">Use a lightweight spreadsheet or CRM tags with these columns:</p>
            <ul class="mt-1 space-y-1 pl-4 list-disc text-xs">
              <li>Date + Partner Name</li>
              <li>Item Given + Cost</li>
              <li>Reason (referral, just because, holiday, etc.)</li>
              <li>Follow-up Date &amp; Method</li>
              <li>Result (referral received, positive reply, no response)</li>
            </ul>
            <p class="mt-2 italic text-xs">Review your log every 90 days. Double down on what works. Cut what doesn’t.</p>
          </div>
        </div>`,
      copyText: 'Pop-By Sourcing, Budgeting & Tracking System'
    },

    // Year-Round Favorites
    { id: 'popby-tote', pillar: 'partnerships', type: 'pop-by', title: 'Reusable Tote Bag', teaser: '“Let’s BAG your dream home!”', cost: '$8–15', tags: ['low-cost', 'year-round', 'partner'], copyText: 'Reusable tote bag with note: “Let’s BAG your dream home!”', content: `<strong>Reusable Tote Bag</strong><p class="mt-3">Practical, highly visible, and useful every single day. Fellow agents carry client files, open house signs, and marketing materials — they’ll remember you every time they reach for it.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> High frequency of use + subtle branding opportunity. Agents remember you every time they reach for it.</div><p class="mt-3 text-sm"><strong>Best use:</strong> Pair with a short handwritten note referencing a recent referral. Follow up by text within 48 hours.</p>` },
    { id: 'popby-coffee', pillar: 'partnerships', type: 'pop-by', title: 'Quality Coffee Gift Card', teaser: '“Thanks a LATTE for the referrals!”', cost: '$10–20', tags: ['low-cost', 'year-round'], copyText: 'Coffee gift card with note: “Thanks a LATTE for the referrals!”', content: `<strong>Quality Coffee Gift Card</strong><p class="mt-3">Universal, low-risk, high appreciation. Works with almost any referral partner. The pun is strong and the gift gets used constantly.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> High frequency of use + easy to personalize with a specific referral mention.</div><p class="mt-3 text-sm"><strong>Best use:</strong> Write the exact amount on the note (“$15 — your usual spot?”) so it feels personal.</p>` },
    { id: 'popby-lottery', pillar: 'partnerships', type: 'pop-by', title: 'Lottery Tickets', teaser: '“You’re a WINNER in my book!”', cost: '$5–10', tags: ['low-cost', 'fun'], copyText: 'Lottery tickets with note: “You’re a WINNER in my book!”', content: `<strong>Lottery Tickets</strong><p class="mt-3">Fun, cheap, and memorable. Perfect for a quick morale boost after a rough week or tough negotiation. The pun lands every time.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Low cost, high smile factor. Great “just because” or after a tough deal.</div>` },
    { id: 'popby-sunscreen', pillar: 'partnerships', type: 'pop-by', title: 'Sunscreen', teaser: '“Protecting your biggest investment!”', cost: '$5–12', tags: ['low-cost', 'year-round'], copyText: 'Sunscreen with note: “Protecting your biggest investment!”', content: `<strong>Sunscreen</strong><p class="mt-3">Clever pun + genuinely practical. Agents spend hours at open houses in the sun. This shows you actually understand their job.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Useful + funny. Gets used immediately and remembered.</div>` },
    { id: 'popby-candle', pillar: 'partnerships', type: 'pop-by', title: 'Nice Candle', teaser: '“You LIGHT up the market!”', cost: '$8–15', tags: ['low-cost', 'year-round'], copyText: 'Nice candle with note: “You LIGHT up the market!”', content: `<strong>Nice Candle</strong><p class="mt-3">Great for busy partners who spend long hours in the car or at the office. Feels thoughtful and gets used in their home or workspace.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Pleasant daily reminder in their personal space.</div>` },
    { id: 'popby-popcorn', pillar: 'partnerships', type: 'pop-by', title: 'Popcorn', teaser: '“Just POPPING by to say thanks!”', cost: '$6–12', tags: ['low-cost', 'fun'], copyText: 'Popcorn with note: “Just POPPING by to say thanks!”', content: `<strong>Popcorn</strong><p class="mt-3">Light, fun, instant positive moment. Works especially well after busy open house weekends when agents are exhausted.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Playful + shareable. Easy to store in bulk.</div>` },
    { id: 'popby-plant', pillar: 'partnerships', type: 'pop-by', title: 'Plant Seeds / Small Plant', teaser: '“Watching your business GROW!”', cost: '$6–15', tags: ['low-cost', 'year-round'], copyText: 'Plant or seeds with note: “Watching your business GROW!”', content: `<strong>Plant Seeds / Small Plant</strong><p class="mt-3">Living, visible reminder of the relationship. Gets watered and noticed daily — perfect metaphor for growing a partnership.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Living gift that lasts and grows. Strong visual association.</div>` },
    { id: 'popby-shout', pillar: 'partnerships', type: 'pop-by', title: 'Shout Wipes', teaser: '“I’ll SHOUT it from the rooftops!”', cost: '$5–10', tags: ['low-cost', 'fun'], copyText: 'Shout wipes with note: “I’ll SHOUT it from the rooftops!”', content: `<strong>Shout Wipes</strong><p class="mt-3">Clever pun + genuinely useful. Agents constantly clean up after clients or kids at showings.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Solves a real daily annoyance. High utility, low cost.</div>` },
    { id: 'popby-tape', pillar: 'partnerships', type: 'pop-by', title: 'Tape Measure', teaser: '“You always MEASURE up!”', cost: '$8–15', tags: ['low-cost', 'partner'], copyText: 'Tape measure with note: “You always MEASURE up!”', content: `<strong>Tape Measure</strong><p class="mt-3">Listing agents use these constantly for listing presentations. A real upgrade over the flimsy free ones they usually carry.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Professional tool they actually use. Shows you understand their craft.</div>` },
    { id: 'popby-flashlight', pillar: 'partnerships', type: 'pop-by', title: 'Flashlight', teaser: '“You LIGHT the way for clients!”', cost: '$6–12', tags: ['low-cost'], copyText: 'Flashlight with note: “You LIGHT the way for clients!”', content: `<strong>Flashlight</strong><p class="mt-3">Practical for evening showings, basements, or power outages during tours. Another real tool agents actually need on the job.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Solves a genuine daily problem. Low cost, high utility.</div>` },
    { id: 'popby-mints', pillar: 'partnerships', type: 'pop-by', title: 'Mints', teaser: '“We’re MINT to work together!”', cost: '$4–8', tags: ['low-cost', 'fun'], copyText: 'Mints with note: “We’re MINT to work together!”', content: `<strong>Mints</strong><p class="mt-3">Ultra low cost, high smile factor. Perfect for quick “just thinking of you” drops between bigger gifts.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Tiny but thoughtful. Great filler touch.</div>` },
    { id: 'popby-honey', pillar: 'partnerships', type: 'pop-by', title: 'Local Honey', teaser: '“You’re the SWEETEST partner!”', cost: '$8–15', tags: ['low-cost', 'local'], copyText: 'Local honey with note: “You’re the SWEETEST partner!”', content: `<strong>Local Honey</strong><p class="mt-3">Feels premium and supports local businesses. Excellent conversation starter with a nice story behind it.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Local + premium feel at a reasonable price.</div>` },

    // Seasonal & Holiday
    { id: 'popby-spring-seeds', pillar: 'partnerships', type: 'pop-by', title: 'Spring Seeds', teaser: '“Putting down ROOTS this spring!”', cost: '$6–12', tags: ['seasonal', 'spring'], copyText: 'Spring seeds with note: “Putting down ROOTS this spring!”', content: `<strong>Spring Seeds</strong><p class="mt-3">Perfect seasonal tie-in. Symbolizes planting new relationships and watching them grow. Agents love the metaphor.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Living gift that changes with the season. Strong visual and emotional connection to growth.</div>` },
    { id: 'popby-spatula', pillar: 'partnerships', type: 'pop-by', title: 'Summer Spatula / BBQ Tool', teaser: '“Ready to FLIP some houses?”', cost: '$8–15', tags: ['seasonal', 'summer'], copyText: 'BBQ tool with note: “Ready to FLIP some houses?”', content: `<strong>Summer Spatula / BBQ Tool</strong><p class="mt-3">Fun summer energy. Works great June–August when activity (and grilling) is high. Playful without being childish.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Timely + useful for summer entertaining. Gets used at home with family.</div>` },
    { id: 'popby-pumpkin', pillar: 'partnerships', type: 'pop-by', title: 'Fall Pumpkin Spice Items', teaser: '“You’re the PUMPKIN SPICE of real estate!”', cost: '$7–14', tags: ['seasonal', 'fall'], copyText: 'Pumpkin spice item with note: “You’re the PUMPKIN SPICE of real estate!”', content: `<strong>Fall Pumpkin Spice Items</strong><p class="mt-3">Instant smile in Sept–Nov. Everyone loves pumpkin spice season. Easy to find cute, on-trend items.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Highly seasonal and shareable. Strong cultural moment to ride.</div>` },
    { id: 'popby-cocoa', pillar: 'partnerships', type: 'pop-by', title: 'Holiday Hot Cocoa Kit', teaser: '“WARM wishes — happy holidays!”', cost: '$10–18', tags: ['seasonal', 'holiday'], copyText: 'Hot cocoa kit with note: “WARM wishes — happy holidays!”', content: `<strong>Holiday Hot Cocoa Kit</strong><p class="mt-3">Classic, cozy, family-friendly. Perfect for December when offices are festive and people are thinking about family. Great for fellow agents, past clients, or COIs.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Warm and emotional. Builds goodwill without any “from your lender” vibe.</div>` },
    { id: 'popby-whisk', pillar: 'partnerships', type: 'pop-by', title: 'Whisk + Kisses', teaser: '“We WHISK you a Merry KISSmas!”', cost: '$6–12', tags: ['seasonal', 'holiday'], copyText: 'Whisk + kisses with note: “We WHISK you a Merry KISSmas!”', content: `<strong>Whisk + Kisses</strong><p class="mt-3">Cute, cheap, memorable. The pun lands every single year and the item is actually useful in the kitchen.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Playful + practical. One of the best low-cost holiday options.</div>` },
    { id: 'popby-champagne', pillar: 'partnerships', type: 'pop-by', title: 'New Year Champagne Poppers', teaser: '“POP into the New Year with big goals!”', cost: '$8–15', tags: ['seasonal', 'new-year'], copyText: 'Champagne poppers with note: “POP into the New Year with big goals!”', content: `<strong>New Year Champagne Poppers</strong><p class="mt-3">Festive and forward-looking. Great for the first week of January when agents are setting goals.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Timely + celebratory. Positions you as a partner in their success.</div>` },
    { id: 'popby-valentine', pillar: 'partnerships', type: 'pop-by', title: 'Valentine’s Candy or Small Plant', teaser: '“You’re the KEY to my success!”', cost: '$6–14', tags: ['seasonal', 'valentine'], copyText: 'Valentine item with note: “You’re the KEY to my success!”', content: `<strong>Valentine’s Candy or Small Plant</strong><p class="mt-3">Sweet and relationship-focused. Works even with newer partners. Easy to keep it light and professional while still building warmth.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Seasonal emotional moment without being awkward.</div>` },
    { id: 'popby-ice-scraper', pillar: 'partnerships', type: 'pop-by', title: 'Ice Scraper + Hand Warmers', teaser: '“SCRAPING by to say thanks this winter!”', cost: '$7–13', tags: ['seasonal', 'winter'], copyText: 'Ice scraper set with note: “SCRAPING by to say thanks this winter!”', content: `<strong>Ice Scraper + Hand Warmers</strong><p class="mt-3">Extremely practical in cold climates. Shows you understand the real daily grind of showing homes in winter.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Solves a painful seasonal problem. Very memorable.</div>` },
    { id: 'popby-smores', pillar: 'partnerships', type: 'pop-by', title: 'S’mores Kit', teaser: '“Let’s make S’MORE memories in your new home!”', cost: '$8–16', tags: ['seasonal', 'fun'], copyText: 'S’mores kit with note: “Let’s make S’MORE memories in your new home!”', content: `<strong>S’mores Kit</strong><p class="mt-3">Fun, shareable, ties beautifully to new home memories. Great for families or first-time buyers.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Playful and emotional. Excellent for client-facing agents.</div>` },

    // Everyday Creative + Agent Tools + Premium
    { id: 'popby-hand-cream', pillar: 'partnerships', type: 'pop-by', title: 'Premium Hand Cream', teaser: '“You’ve got the magic touch with clients!”', cost: '$6–12', tags: ['creative', 'everyday'], copyText: 'Premium hand cream with note', content: `<strong>Premium Hand Cream</strong><p class="mt-3">Agents and client-facing partners shake hundreds of hands and wash constantly. Genuinely useful and feels luxurious. One of the best “small but thoughtful” gifts.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Solves a real daily problem. Feels personal and caring.</div>` },
    { id: 'popby-bluetooth-speaker', pillar: 'partnerships', type: 'pop-by', title: 'Small Bluetooth Speaker', teaser: '“You’re always on the right frequency!”', cost: '$10–18', tags: ['creative', 'everyday'], copyText: 'Small Bluetooth speaker', content: `<strong>Small Bluetooth Speaker</strong><p class="mt-3">Great for open houses (music) or long car rides. High perceived value and actually gets used constantly.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Modern + useful. Agents love tech that makes their job easier.</div>` },
    { id: 'popby-laser-measure', pillar: 'partnerships', type: 'pop-by', title: 'Laser Distance Measurer', teaser: 'Professional tool listing agents use daily', cost: '$20–30', tags: ['partner', 'professional'], copyText: 'Laser distance measurer', content: `<strong>Laser Distance Measurer</strong><p class="mt-3">Real working tool listing agents use constantly. A serious upgrade over cheap free ones. Shows you truly understand their craft.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Professional-grade tool. Positions you as a serious partner.</div>` },
    { id: 'popby-yeti', pillar: 'partnerships', type: 'pop-by', title: 'Small Yeti or High-End Tumbler', teaser: 'Gets used every single day', cost: '$20–30', tags: ['premium', 'wow'], copyText: 'Yeti-style tumbler', content: `<strong>Small Yeti or High-End Tumbler</strong><p class="mt-3">The single best “premium but not ridiculous” pop-by. Agents use these every single day for coffee, water, or client meetings.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Daily usage + high perceived value. Every sip is a reminder.</div>` },
    { id: 'popby-open-house-kit', pillar: 'partnerships', type: 'pop-by', title: 'Open House Survival Kit', teaser: 'Water, granola, mints + branded sign-in pad', cost: '$15–25', tags: ['themed', 'higher-impact'], copyText: 'Open House Survival Kit', content: `<strong>Open House Survival Kit</strong><p class="mt-3">The most practical gift for listing agents. Solves real daily pain points during long open houses.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why Agents Love It:</strong> Shows you actually understand their job at a deep level.</div>` },
    { id: 'popby-new-agent-kit', pillar: 'partnerships', type: 'pop-by', title: '“First 100 Days” New Agent Kit', teaser: 'Notebook, pen, coffee card for new agents', cost: '$15–25', tags: ['themed', 'higher-impact'], copyText: 'First 100 Days New Agent Kit', content: `<strong>“First 100 Days” New Agent Kit</strong><p class="mt-3">Nice notebook, pen, coffee card + encouraging note. New agents remember you forever when you support them early.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Emotional + practical. Builds loyalty from day one.</div>` },
    { id: 'popby-market-update', pillar: 'partnerships', type: 'pop-by', title: 'Market Update Drop-Off', teaser: 'Printed local snapshot + small treat', cost: '$8–15', tags: ['themed', 'higher-impact'], copyText: 'Market Update Drop-Off', content: `<strong>Market Update Drop-Off</strong><p class="mt-3">One-page local market snapshot + your card + small treat. Positions you as the knowledgeable, value-adding partner who actually pays attention to their market.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Low effort for you, high value for them. Shows you’re paying attention to what matters in their business.</div><p class="mt-3 text-sm"><strong>Best use:</strong> Do this every 4–6 weeks for your top 15–20 partners.</p>` },
    { id: 'popby-client-win', pillar: 'partnerships', type: 'pop-by', title: 'Client Win Celebration Drop', teaser: 'Champagne or chocolate after their client closes', cost: '$12–20', tags: ['themed', 'higher-impact'], copyText: 'Client Win Celebration drop', content: `<strong>Client Win Celebration Drop</strong><p class="mt-3">When one of their clients closes with you: small champagne or nice chocolate + thank-you note naming the client. This is pure relationship gold and often leads to the best referrals.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> You’re celebrating their win, not just yours. It feels generous and builds deep loyalty.</div>` },

    // Sourcing Framework (very valuable)
    { id: 'framework-popby-sourcing', pillar: 'partnerships', type: 'framework', title: 'Pop-By Sourcing & Budget Tips', teaser: 'Where to find cheap, high-impact items', content: `<strong>Sourcing & Budget Tips</strong><p class="mt-3">Rule of thumb: Spend $6–10 on 80% and $18–25 on 20%. Rotate simple vs wow items.</p><ul class="mt-2 space-y-1 text-sm"><li><strong>Ultra low cost ($3–8):</strong> Dollar Tree, Five Below, Walmart clearance, Amazon bulk</li><li><strong>Better quality ($8–20):</strong> HomeGoods, TJ Maxx, Costco, Target clearance</li><li><strong>Personalized wow:</strong> Etsy, local trophy shops, 4imprint for bulk</li><li><strong>Smart strategies:</strong> Post-holiday clearance, local restaurant partnerships, buy 24–50 of winners and store</li></ul>`, copyText: 'Pop-by sourcing framework' },

    // Follow-up Scripts (expanded)
    { id: 'followup-quick-text', pillar: 'partnerships', type: 'script', title: 'Quick Text/Video Follow-Up', teaser: 'Fast, low-pressure touch after referral or closing', content: `<strong>Quick Text/Video Follow-Up</strong><p class="mt-3">“Hey [Name], just closed [Mutual Client] smoothly — they loved working with you! Any buyers or sellers I can help you with this week?”</p><p class="mt-2 text-sm"><strong>Best used:</strong> Within 24-48 hrs of a successful closing or referral. Short, grateful, ends with easy ask.</p>`, copyText: 'Quick text/video follow-up script' },
    { id: 'followup-value-email', pillar: 'partnerships', type: 'script', title: 'Value Email Opener for Partners', teaser: 'Market update + soft ask', content: `<strong>Value Email Opener for Partners</strong><p class="mt-3">Subject: This week’s local market snapshot + buyer prep checklist (co-brand ready)<br>Body: “Sharing this week’s local market snapshot + buyer prep checklist. Happy to co-brand for your clients!”</p>`, copyText: 'Value email opener script' },
    { id: 'followup-popby', pillar: 'partnerships', type: 'script', title: 'Pop-By Delivery Script (In-Person)', teaser: 'In-person drop-off language + variations', content: `
      <strong>Pop-By In-Person Delivery Script (Fully Built Out)</strong>
      <div class="mt-4 p-4 bg-[#00A89D]/5 rounded-xl">
        <strong class="text-[#00A89D]">Core Philosophy:</strong> Keep it under 45–60 seconds. Smile, make eye contact, deliver the gift + note, and exit gracefully. The gift and note do the real work — you are just the friendly messenger.
      </div>

      <div class="mt-5 space-y-5 text-sm">
        <div>
          <strong>Standard Drop (No Prior Relationship)</strong><br>
          “Hey [Name], I’m [Your Name] with [Brokerage]. I know you’re busy — I just wanted to drop this off and say thanks for everything you do for our market. No strings attached. Hope it makes your week a little better. My card’s inside if you ever need anything.”
        </div>

        <div>
          <strong>After They Referred You</strong><br>
          “I just wanted to personally thank you for sending [Client Name] my way. That meant a lot. I dropped off a little something to show my appreciation — no big deal, just wanted you to know I noticed and I’m grateful.”
        </div>

        <div>
          <strong>Busy Season / High Stress</strong><br>
          “I know it’s crazy right now with listings and showings. I won’t keep you — just wanted to leave this for you and your team. You guys are killing it. Let me know if there’s any co-broke file I can make smoother for you this month.”
        </div>

        <div>
          <strong>Long-Term Partner (Keep It Light &amp; Fun)</strong><br>
          “Just swinging by to say hi and drop this off. How’s your week going? Any fun trips or big deals on the horizon? I’m around if you need anything at all — no agenda.”
        </div>
      </div>

      <div class="mt-5 p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
        <strong>Pro Tips for Delivery:</strong>
        <ul class="mt-2 text-sm space-y-1">
          <li>Always have the note already written and the gift wrapped or in a nice bag.</li>
          <li>Say the line, hand it over, and leave within 60 seconds.</li>
          <li>Send a same-day text follow-up (see the other scripts in this pillar).</li>
          <li>Never ask for business on the drop — let the relationship do the work.</li>
        </ul>
      </div>
    `, copyText: 'Pop-by in-person delivery script + variations' },
    { id: 'followup-phone-checkin', pillar: 'partnerships', type: 'script', title: 'Phone Check-In Script', teaser: 'Relationship maintenance call', content: `<strong>Phone Check-In Script</strong><p class="mt-3">“How’s business treating you? Anything I can do to support your listings this month?”</p><p class="mt-2 text-sm"><strong>Best cadence:</strong> Once per quarter for top 10–15 partners. Ask about their challenges, not just your business.</p>`, copyText: 'Phone check-in script' },

    // Co-Marketing & Partner Tools
    { id: 'realtor-cobranded-flyers', pillar: 'partnerships', type: 'tool', title: 'Co-Branded Flyers & Marketing', teaser: 'Open house, buyer presentations, etc.', content: `<strong>Co-Branded Flyers & Marketing</strong><p class="mt-3">Ready-made or custom flyers for open houses, buyer presentations, and market updates. Use Canva + your logo (or your lender partner’s compliant materials) on the back — keep your branding dominant on the front for clients.</p>`, copyText: 'Co-branded flyers ideas' },
    { id: 'realtor-open-house-kit', pillar: 'partnerships', type: 'tool', title: 'Open House Excellence Kit', teaser: 'What to bring to every open house', content: `<strong>Open House Excellence Kit</strong><ul class="mt-2 space-y-1 text-sm"><li>Professional signage + directional arrows</li><li>Branded listing flyers + QR to property page</li><li>Sign-in sheets with follow-up automation</li><li>Snacks + water + mints for visitors</li><li>Optional: invite lender partner for pre-qual station</li></ul><p class="mt-2 text-sm">Show up early, run a polished experience, and capture every lead. Optional lender co-host doubles reach.</p>`, copyText: 'Open house support kit checklist' },
    { id: 'realtor-joint-value-adds', pillar: 'partnerships', type: 'tool', title: 'Joint Value Adds with Referral Partners', teaser: 'Seminars, webinars, co-hosted events', content: `<strong>Joint Value Adds</strong><p class="mt-3">Co-host buyer seminars, lunch & learns, or virtual webinars. You do the heavy lifting on content; they invite their sphere. Everyone wins.</p>`, copyText: 'Joint value add ideas' },
    { id: 'realtor-weekly-snapshots', pillar: 'partnerships', type: 'tool', title: 'Weekly Market Snapshots for Partners', teaser: 'Low-effort, high-value touch', content: `<strong>Weekly Market Snapshots</strong><p class="mt-3">Every Monday: 3 bullet points + one chart of local pricing/inventory trends. Subject: “This week in our market (quick read)”. Ends with soft offer to hop on a 5-min call.</p>`, copyText: 'Weekly market snapshot idea' },

    // --- Additional Everyday Creative Pop-Bys (restored for completeness) ---
    { id: 'popby-mini-umbrella', pillar: 'partnerships', type: 'pop-by', title: 'Mini Umbrella', teaser: '“You’re covered — rain or shine!”', cost: '$6–12', tags: ['creative', 'everyday'], copyText: 'Mini umbrella with note', content: `<strong>Mini Umbrella</strong><p class="mt-3">Practical in spring/fall. The pun is strong and it actually gets used by agents who are out in all weather.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Solves a real problem + memorable pun.</div>` },
    { id: 'popby-phone-charger', pillar: 'partnerships', type: 'pop-by', title: 'Portable Phone Charger', teaser: '“Powering up your business — and your phone!”', cost: '$8–15', tags: ['creative', 'everyday'], copyText: 'Portable phone charger', content: `<strong>Portable Phone Charger</strong><p class="mt-3">Agents live on their phones. A reliable backup battery is used constantly and remembered fondly.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> High daily utility. Solves a constant pain point.</div>` },
    { id: 'popby-high-quality-pen', pillar: 'partnerships', type: 'pop-by', title: 'High-Quality Pen Set', teaser: '“Signing more deals with style!”', cost: '$8–15', tags: ['creative', 'partner'], copyText: 'High-quality pen set', content: `<strong>High-Quality Pen Set</strong><p class="mt-3">Partners who close deals regularly sign documents every single day. A nice pen feels like a real daily upgrade from the cheap plastic ones they usually carry.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Professional tool they use constantly. Small but noticeable upgrade.</div>` },
    { id: 'popby-leather-card-holder', pillar: 'partnerships', type: 'pop-by', title: 'Leather Business Card Holder', teaser: '“Carrying your success with you!”', cost: '$15–25', tags: ['partner', 'professional'], copyText: 'Leather business card holder', content: `<strong>Leather Business Card Holder</strong><p class="mt-3">Looks sharp at every meeting. The cheap plastic ones look cheap — this small upgrade makes them feel more polished and professional.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Visible professionalism every time they hand out a card.</div>` },
    { id: 'popby-car-trunk-organizer', pillar: 'partnerships', type: 'pop-by', title: 'Car Trunk Organizer', teaser: 'Helps them stay organized between showings', cost: '$15–25', tags: ['partner', 'professional'], copyText: 'Car trunk organizer', content: `<strong>Car Trunk Organizer</strong><p class="mt-3">Agents spend their lives in their cars. This keeps signs, lockboxes, flyers, water, and snacks organized.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Extremely practical daily driver gift.</div>` },
    { id: 'popby-multi-tool', pillar: 'partnerships', type: 'pop-by', title: 'High-Quality Multi-Tool', teaser: 'For hanging signs and quick fixes', cost: '$12–22', tags: ['partner', 'professional'], copyText: 'Multi-tool', content: `<strong>High-Quality Multi-Tool</strong><p class="mt-3">For hanging directional signs, fixing loose hardware at listings, or quick showing prep. They will actually use this constantly.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Real working tool. Shows you understand the physical side of their job.</div>` },
    { id: 'popby-ring-light-tripod', pillar: 'partnerships', type: 'pop-by', title: 'Ring Light + Tripod Combo', teaser: 'Helps them create better social content', cost: '$20–35', tags: ['partner', 'professional', 'content'], copyText: 'Ring light + tripod combo', content: `<strong>Portable Ring Light + Tripod Combo</strong><p class="mt-3">The single best “modern” gift for agents who are (or should be) creating video content and Reels.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Positions you as the forward-thinking partner.</div>` },
    { id: 'popby-sunglasses', pillar: 'partnerships', type: 'pop-by', title: 'Sunglasses', teaser: '“You always see the best opportunities first!”', cost: '$8–16', tags: ['creative', 'everyday'], copyText: 'Sunglasses', content: `<strong>Sunglasses</strong><p class="mt-3">Practical for driving between showings and looking sharp for photos and videos. Agents are outside a lot.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Useful + stylish. Gets used daily during peak seasons.</div>` },
    { id: 'popby-lip-balm', pillar: 'partnerships', type: 'pop-by', title: 'Lip Balm Pack', teaser: '“Keeping it smooth — just like your closings!”', cost: '$5–9', tags: ['creative', 'everyday'], copyText: 'Lip balm pack', content: `<strong>Lip Balm Pack</strong><p class="mt-3">Tiny, cheap, and surprisingly appreciated (especially in winter). The pun is perfect and it actually gets used.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Ultra low cost, high delight factor. Great filler touch.</div>` },
    { id: 'popby-air-freshener', pillar: 'partnerships', type: 'pop-by', title: 'Nice Car Air Freshener', teaser: '“Making every drive a little better!”', cost: '$5–10', tags: ['creative', 'everyday'], copyText: 'Car air freshener', content: `<strong>Car Air Freshener</strong><p class="mt-3">Agents spend a stupid amount of time in their cars. A good scent is noticed every single commute.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Constant subtle presence in their car (their second office).</div>` },
    { id: 'popby-first-aid-kit', pillar: 'partnerships', type: 'pop-by', title: 'Small First Aid Kit', teaser: '“We’ve got you covered in every situation!”', cost: '$7–14', tags: ['creative', 'everyday'], copyText: 'Small first aid kit', content: `<strong>Small First Aid Kit</strong><p class="mt-3">Surprisingly useful for open houses (paper cuts, kids, etc.). Shows real thoughtfulness.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Solves unexpected problems. High “I care” factor.</div>` },
    { id: 'popby-chocolate-bars', pillar: 'partnerships', type: 'pop-by', title: 'Gourmet Chocolate Bars', teaser: '“You deserve something sweet after all those wins!”', cost: '$6–12', tags: ['creative', 'everyday'], copyText: 'Gourmet chocolate bars', content: `<strong>Gourmet Chocolate Bars</strong><p class="mt-3">Never fails. High perceived value, easy to store in bulk. Great “just because” or thank you gift.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Universal appeal. Everyone loves good chocolate.</div>` },
    { id: 'popby-desk-fan', pillar: 'partnerships', type: 'pop-by', title: 'Mini Desk Fan', teaser: '“You’re our biggest fan — here’s one for you!”', cost: '$8–15', tags: ['creative', 'everyday'], copyText: 'Mini desk fan', content: `<strong>Mini Desk Fan</strong><p class="mt-3">Funny + practical for hot offices or cars in summer. Gets used immediately and makes people smile.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Playful + solves a real seasonal annoyance.</div>` },

    // --- Final missing originals from the legacy vault (completing the set) ---
    { id: 'popby-insulated-water', pillar: 'partnerships', type: 'pop-by', title: 'Insulated Water Bottle', teaser: '“Stay hydrated while closing deals!”', cost: '$10–18', tags: ['creative', 'everyday'], copyText: 'Insulated water bottle with note', content: `<strong>Insulated Water Bottle</strong><p class="mt-3">Fellow agents are out showing homes all day. This is genuinely practical and appreciated daily. Keeps water cold for hours.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> High daily usage + professional look.</div>` },
    { id: 'popby-measuring-tape-25', pillar: 'partnerships', type: 'pop-by', title: 'Heavy-Duty 25ft Measuring Tape', teaser: 'Better quality than the cheap ones they have', cost: '$12–18', tags: ['partner', 'professional'], copyText: 'Heavy-duty 25ft measuring tape', content: `<strong>Heavy-Duty 25ft Measuring Tape</strong><p class="mt-3">The free ones from the hardware store break or are too short. This one actually lasts and gets used at every listing appointment.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Professional tool upgrade. Agents notice quality immediately.</div>` },
    { id: 'popby-tablet-stylus', pillar: 'partnerships', type: 'pop-by', title: 'Tablet Stylus + Screen Cleaning Kit', teaser: 'For agents who use iPads heavily', cost: '$10–18', tags: ['partner', 'professional'], copyText: 'Tablet stylus + screen cleaning kit', content: `<strong>Tablet Stylus + Screen Cleaning Kit</strong><p class="mt-3">Many agents live on their iPad for contracts and presentations. A good stylus + cleaning kit is used constantly.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Supports their modern workflow. Very practical.</div>` },
    { id: 'popby-directional-signs', pillar: 'partnerships', type: 'pop-by', title: 'Branded Open House Directional Signs', teaser: 'Low cost and incredibly useful', cost: '$10–20', tags: ['partner', 'professional'], copyText: 'Branded open house directional signs', content: `<strong>Branded Open House Directional Signs</strong><p class="mt-3">Cheap to print in bulk and incredibly useful. Put your subtle branding on the back. They will think of you every single weekend.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Constant visibility during peak activity times.</div>` },
    { id: 'popby-clipboard-storage', pillar: 'partnerships', type: 'pop-by', title: 'Nice Clipboard with Storage Compartment', teaser: 'For open houses and listing presentations', cost: '$12–20', tags: ['partner', 'professional'], copyText: 'Clipboard with storage compartment', content: `<strong>Nice Clipboard with Storage Compartment</strong><p class="mt-3">Looks sharp at every open house. Holds flyers, sign-in sheets, and business cards in one professional package.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Professional appearance + high utility at open houses.</div>` },
    { id: 'popby-sticky-notes', pillar: 'partnerships', type: 'pop-by', title: 'Nice Sticky Note Set', teaser: '“Taking notes on how awesome you are!”', cost: '$5–10', tags: ['creative', 'everyday'], copyText: 'Nice sticky note set', content: `<strong>Nice Sticky Note Set</strong><p class="mt-3">Agents live on sticky notes. A high-quality pad feels like a daily upgrade from the cheap ones.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Constant visibility on their desk or in their planner.</div>` },
    { id: 'popby-phone-tripod', pillar: 'partnerships', type: 'pop-by', title: 'Portable Phone Tripod', teaser: '“Helping you create better content on the go!”', cost: '$8–15', tags: ['creative', 'content'], copyText: 'Portable phone tripod', content: `<strong>Portable Phone Tripod</strong><p class="mt-3">Perfect for agents starting to do Reels or property videos. Positions you as the modern, tech-savvy partner.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Supports their content creation habit.</div>` },

    // --- More Premium & Wow ---
    { id: 'popby-wireless-earbuds', pillar: 'partnerships', type: 'pop-by', title: 'Wireless Earbuds (Budget Quality)', teaser: 'Huge perceived value', cost: '$20–25', tags: ['premium', 'wow'], copyText: 'Wireless earbuds', content: `<strong>Wireless Earbuds (Good Budget Quality)</strong><p class="mt-3">Huge perceived value. Agents take calls in the car constantly. A reliable pair feels like a major upgrade without breaking the bank.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> High daily usage + modern tech feel. Agents remember you every time they take a call hands-free.</div>` },
    { id: 'popby-leather-notebook', pillar: 'partnerships', type: 'pop-by', title: 'Leather Notebook + Nice Pen Set', teaser: 'Professional and personal', cost: '$20–30', tags: ['premium', 'wow'], copyText: 'Leather notebook + pen set', content: `<strong>Leather Notebook + Nice Pen Set</strong><p class="mt-3">Professional and personal. Perfect for listing presentations and client notes. Feels like a serious, high-quality tool they’ll actually use for years.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Looks expensive and feels substantial. Positions you as a premium partner.</div>` },
    { id: 'popby-local-coffee-bundle', pillar: 'partnerships', type: 'pop-by', title: 'Local Coffee + Pastry Gift Card Bundle', teaser: 'Take them to their favorite spot', cost: '$15–25', tags: ['premium', 'wow'], copyText: 'Local coffee + pastry bundle', content: `<strong>Local Coffee + Pastry Gift Card Bundle</strong><p class="mt-3">Take them to their actual favorite spot. This feels much more personal and thoughtful than a generic gift card.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Shows you pay attention to what they actually like. Very high emotional ROI.</div>` },
    { id: 'popby-map-art-print', pillar: 'partnerships', type: 'pop-by', title: 'Small Custom Map Art Print', teaser: 'Of their city or favorite neighborhood', cost: '$18–30', tags: ['premium', 'wow'], copyText: 'Custom map art print', content: `<strong>Small Custom Map Art Print</strong><p class="mt-3">Hyper-local and personal. Feels like you actually know their market and care about the area they work in every day.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Extremely thoughtful and unique. Stands out from generic gifts.</div>` },
    { id: 'popby-honey-olive-oil', pillar: 'partnerships', type: 'pop-by', title: 'High-End Local Honey or Olive Oil Set', teaser: 'Feels premium and thoughtful', cost: '$15–25', tags: ['premium', 'wow'], copyText: 'High-end local honey or olive oil', content: `<strong>High-End Local Honey or Olive Oil Set</strong><p class="mt-3">Feels genuinely premium and thoughtful. Excellent for top-tier referral partners you want to keep for life.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Supports local + feels luxurious. Great for your very best partners.</div>` },

    // === NEW ADDITIONS (with rich modal formatting) ===
    { id: 'popby-branded-notepad', pillar: 'partnerships', type: 'pop-by', title: 'Branded Premium Notepad', teaser: '“Taking notes on your wins”', cost: '$6–12', tags: ['low-cost', 'everyday', 'realtor'], copyText: 'Premium notepad with note', content: `<strong>Branded Premium Notepad</strong><p class="mt-3">High-quality notepad that actually feels good to write on. Agents take notes constantly during showings and meetings.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Daily utility + your branding stays visible on their desk or in their bag.</div><p class="mt-3 text-sm"><strong>Best use:</strong> Great for newer agents or as a low-cost “thinking of you” touch between bigger gifts.</p>` },
    { id: 'popby-portable-charger', pillar: 'partnerships', type: 'pop-by', title: 'Portable Phone Charger', teaser: '“Powering your business”', cost: '$12–20', tags: ['creative', 'everyday'], copyText: 'Portable charger with note', content: `<strong>Portable Phone Charger</strong><p class="mt-3">Agents live on their phones. A reliable 10,000mAh charger with your subtle branding is genuinely useful and appreciated.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Solves a real daily problem. High perceived value for the price.</div>` },
    { id: 'popby-car-caddy', pillar: 'partnerships', type: 'pop-by', title: 'Car Organizer Caddy', teaser: '“Keep your deals organized”', cost: '$15–25', tags: ['partner', 'professional'], copyText: 'Car caddy organizer', content: `<strong>Car Organizer Caddy</strong><p class="mt-3">Holds flyers, lockboxes, water bottles, and signs in the back seat or trunk. Agents spend half their life in the car.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Extremely practical daily driver gift that shows you understand their real workflow.</div>` },
    { id: 'popby-golf-balls', pillar: 'partnerships', type: 'pop-by', title: 'Branded Golf Balls (Sleeve)', teaser: '“You’re always on the green”', cost: '$8–15', tags: ['premium', 'fun'], copyText: 'Golf balls with note', content: `<strong>Branded Golf Balls (Sleeve)</strong><p class="mt-3">Perfect for agents who golf (a huge percentage do). Subtle branding on the balls keeps you top of mind on the course.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Pro Move:</strong> Great for male agents or as a seasonal spring/summer gift.</div>` },
    { id: 'popby-hand-sanitizer-set', pillar: 'partnerships', type: 'pop-by', title: 'Nice Hand Sanitizer + Lotion Set', teaser: '“Keeping it clean in a tough market”', cost: '$6–12', tags: ['low-cost', 'everyday'], copyText: 'Sanitizer + lotion set', content: `<strong>Nice Hand Sanitizer + Lotion Set</strong><p class="mt-3">Agents shake hundreds of hands and touch dozens of surfaces every week. A nice branded set feels thoughtful and practical.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Extremely practical in the post-pandemic era. High relevance.</div>` },
    { id: 'popby-stainless-water', pillar: 'partnerships', type: 'pop-by', title: 'Stainless Steel Water Bottle', teaser: '“Stay hydrated on the move”', cost: '$10–18', tags: ['creative', 'everyday'], copyText: 'Stainless water bottle', content: `<strong>Stainless Steel Water Bottle</strong><p class="mt-3">Good quality bottle that actually keeps water cold. Agents are constantly in and out of cars and houses.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> High daily usage + looks professional.</div>` },
    { id: 'popby-business-card-case', pillar: 'partnerships', type: 'pop-by', title: 'Leather Business Card Case', teaser: '“Carrying your success”', cost: '$12–22', tags: ['partner', 'professional'], copyText: 'Leather card case', content: `<strong>Leather Business Card Case</strong><p class="mt-3">A sharp upgrade from the cheap plastic ones most agents carry. Looks professional at every meeting.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Visible professionalism every time they network.</div>` },
    { id: 'popby-magnet-clip', pillar: 'partnerships', type: 'pop-by', title: 'Strong Refrigerator Magnet Clip', teaser: '“Keeping your listings top of mind”', cost: '$5–10', tags: ['low-cost', 'fun'], copyText: 'Magnet clip with note', content: `<strong>Strong Refrigerator Magnet Clip</strong><p class="mt-3">Clients and agents put these on their fridge with your card inside. Constant low-key visibility in the home.</p><div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl"><strong class="text-[#00A89D]">Why It Works:</strong> Passive, long-term top-of-mind placement in the household.</div>` },

    // ============================================
    // PILLAR 2 — CREATING RAVING FAN CLIENTS (expanded)
    // ============================================

    // Core Gifts (from Giftology principles)
    { id: 'gift-coffee-card', pillar: 'clients', type: 'gift', title: 'Quality Local Coffee Gift Card', teaser: 'Universal, low-risk, high daily appreciation', cost: '$10–20', content: `
      <strong>Quality Local or National Coffee Gift Card</strong>
      <p class="mt-3">One of the safest, most universally appreciated low-cost gifts. Almost every adult drinks coffee or has a favorite spot. Feels personal when you reference their specific habit.</p>

      <div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl text-sm">
        <strong>Why It Works:</strong> Daily ritual touch. Write the exact amount and a personal line on the card: “$15 — enough for your usual Monday morning order. Thanks for being awesome clients.”
      </div>
    `, copyText: 'Coffee gift card with personal note' },

    { id: 'gift-tote-bag', pillar: 'clients', type: 'gift', title: 'High-Quality Reusable Tote Bag', teaser: 'Practical, visible, zero waste — great for moving and daily life', cost: '$8–15', content: `
      <strong>High-Quality Reusable Tote / Grocery Bag</strong>
      <p class="mt-3">A thick, well-made canvas or nylon tote (not the thin cheap ones). Clients are in full moving/organizing mode for months after closing. This gets used constantly for groceries, Target runs, library books, etc.</p>

      <div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl text-sm">
        <strong>Why It Works:</strong> Extremely high utility during the exact season they need it most. Add a fun note: “Let’s BAG the rest of your moving checklist together!”
      </div>
    `, copyText: 'Quality tote bag gift + pun note' },

    { id: 'gift-chocolate', pillar: 'clients', type: 'gift', title: 'Gourmet or Local Chocolate', teaser: 'High perceived value, universally appreciated closing gift', cost: '$12–25', content: `
      <strong>Gourmet or Local Artisan Chocolate</strong>
      <p class="mt-3">A beautiful box of high-quality or locally made chocolate. Feels indulgent and celebratory without being over the top. Works for every client type and is genuinely enjoyed (unlike most closing gifts that get regifted or tossed).</p>

      <div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl text-sm">
        <strong>Why It Works:</strong> Immediate joy + sharing with family. High “wow” factor for the price. Excellent for first-time buyers who are exhausted and deserve a treat.
      </div>
      <div class="mt-2 text-xs text-gray-500">Add a note: “Celebrating the sweet moment of you officially being homeowners!”</div>
    `, copyText: 'Gourmet chocolate closing gift + note' },

    { id: 'gift-plant', pillar: 'clients', type: 'gift', title: 'Small Potted Plant or Succulent', teaser: 'Living reminder that grows with them — perfect 6–12 month touch', cost: '$10–20', content: `
      <strong>Small Potted Plant or Succulent Arrangement</strong>
      <p class="mt-3">A living, growing reminder of the relationship. One of the best “we’re still here for you” touches you can give 6–12 months after closing when 95% of agents have completely vanished.</p>

      <div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl text-sm">
        <strong>Why It Works:</strong> It literally grows in their home. Every time they water it or notice it getting bigger, they think of you. Low cost, high emotional staying power.
      </div>
      <div class="mt-2 text-xs text-gray-500">Note idea: “Just like your new home, this will grow and get stronger over time. We’re here if you ever need anything.”</div>
    `, copyText: 'Potted plant 6-12 month touch + note' },

    { id: 'gift-water-bottle', pillar: 'clients', type: 'gift', title: 'Insulated Water Bottle (Yeti-style)', teaser: 'Practical daily driver for active families and commuters', cost: '$12–22', content: `
      <strong>Quality Insulated Water Bottle</strong>
      <p class="mt-3">A genuinely good insulated bottle (not the ultra-cheap ones). Perfect for active clients, families with kids in sports, commuters, or anyone who lives in their car between work and the new house projects. Gets used constantly.</p>

      <div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl text-sm">
        <strong>Why It Works:</strong> High daily usage + visible in the car, at soccer fields, at the office. Feels thoughtful and useful rather than “just another branded thing.”
      </div>
    `, copyText: 'Insulated water bottle gift idea' },

    { id: 'gift-hand-cream', pillar: 'clients', type: 'gift', title: 'Premium Hand Cream or Lotion Set', teaser: 'Slightly luxurious “just because” touch 6+ months later', cost: '$8–15', content: `
      <strong>Premium Hand Cream or Small Lotion Set</strong>
      <p class="mt-3">A nice tube or small jar of high-quality hand cream (think L’Occitane, local brand, or nice drugstore upgrade). Feels thoughtful and a little indulgent — especially appreciated by anyone with dry hands from winter, gardening, or constant hand-washing.</p>

      <div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl text-sm">
        <strong>Why It Works:</strong> Low cost, high “I was thinking about you” feeling. Excellent for 6–9 month surprise touches when no one else is sending anything.
      </div>
    `, copyText: 'Premium hand cream surprise touch' },

    { id: 'gift-desk-fan', pillar: 'clients', type: 'gift', title: 'Mini Desk Fan', teaser: 'Fun + practical for home offices and busy agents', cost: '$8–15', content: `
      <strong>Quality Mini Desk or Clip-On Fan</strong>
      <p class="mt-3">A surprisingly nice small fan for desks, nightstands, or car use. Perfect for clients who work from home, agents who are always in and out of properties, or anyone who runs warm. The pun opportunity (“You’re our biggest fan”) is fun and memorable.</p>
    `, copyText: 'Mini desk fan gift idea' },

    { id: 'gift-pen-set', pillar: 'clients', type: 'gift', title: 'High-Quality Pen Set', teaser: 'Professional daily tool for people who still sign things', cost: '$10–18', content: `
      <strong>High-Quality Pen or Pen Set</strong>
      <p class="mt-3">A really nice pen (or two) that actually writes well. For clients who still sign physical documents, small business owners, or anyone who likes nice things on their desk. Feels professional and a step above the cheap free pens everyone has.</p>
    `, copyText: 'Quality pen set gift' },

    { id: 'gift-desk-organizer', pillar: 'clients', type: 'gift', title: 'Car Trunk or Desk Organizer', teaser: 'Highest-ROI practical gift for agents and busy families', cost: '$15–25', content: `
      <strong>Car Trunk Organizer or Desk Caddy</strong>
      <p class="mt-3">One of the most practical gifts you can give a busy client or fellow agent. Agents live in their cars between showings. Families are constantly hauling kids, sports gear, and new home supplies. This actually solves a daily problem.</p>

      <div class="mt-4 p-3 bg-[#00A89D]/5 rounded-xl text-sm">
        <strong>Why It Works:</strong> Extremely high daily usage + visible proof that you understand their real life, not just their real estate.
      </div>
    `, copyText: 'Car/desk organizer practical gift' },

    // Giftology Core — Upgraded with rich depth
    { id: 'giftology-mindset', pillar: 'clients', type: 'framework', title: 'The Giftology Mindset (John Ruhlin)', teaser: 'Stop giving logo junk. Give gifts that make people feel known, appreciated, and top of mind for life.', cost: '', content: `
      <strong>The Giftology Mindset — The Foundation of Every Great Client Relationship</strong>
      <p class="mt-3 text-[15px]">The single biggest mistake agents make with gifts is giving what’s easy and cheap for <em>them</em> instead of what actually makes the client feel <strong>seen</strong>. Logo pens, branded notepads, and cheap tumblers get thrown in a drawer. Great gifts get used daily and trigger a positive thought about you every single time.</p>
      
      <div class="mt-5 p-4 bg-[#00A89D]/5 rounded-2xl border border-[#00A89D]/20">
        <strong class="text-[#00A89D]">John Ruhlin’s Core Truth:</strong>
        <p class="mt-1 text-sm">“The best gifts are the ones they would have bought for themselves… but didn’t.” They are personal, high-quality, and get used often in the new home.</p>
      </div>

      <div class="mt-5">
        <div class="font-semibold text-[#00A89D] mb-2">The 5 Giftology Rules for Agents</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div class="border-l-4 border-[#00A89D] pl-3 py-1">1. <strong>Know them first.</strong> Listen during the process — hobbies, kids, new home projects, how they like their coffee. That intel is gold for gifting.</div>
          <div class="border-l-4 border-[#00A89D] pl-3 py-1">2. <strong>Quality > Quantity.</strong> One $60–80 knife they use daily beats ten $8 branded items that get hidden.</div>
          <div class="border-l-4 border-[#00A89D] pl-3 py-1">3. <strong>Subtle branding only.</strong> Your name on the back, bottom, or inside the box. Never dominating the front.</div>
          <div class="border-l-4 border-[#00A89D] pl-3 py-1">4. <strong>Unexpected timing wins.</strong> 6–12 months post-close is when it feels magical. Everyone else has already forgotten them.</div>
          <div class="border-l-4 border-[#00A89D] pl-3 py-1 md:col-span-2">5. <strong>Make it usable in the new home.</strong> The best gifts live in the kitchen, on the door, on their desk, or in their car — constant visual reminders.</div>
        </div>
      </div>

      <div class="mt-5 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
        <strong>Pro move:</strong> After any client or partner gift, log it in your CRM with the date + what you gave + one personal detail you used. This builds your “known them” muscle over time.
      </div>
    `, copyText: 'Giftology mindset and principles from John Ruhlin' },

    // High-Impact Closing Gifts
    { id: 'gift-chef-knife', pillar: 'clients', type: 'gift', title: 'High-Quality Chef’s Knife (Giftology Classic)', teaser: 'Used daily for years — one of the highest-impact gifts you can give', cost: '$40–80', content: `
      <strong>High-Quality Chef’s Knife or Set</strong>
      <p class="mt-3">John Ruhlin’s single most famous recommendation for a reason. A really good knife gets pulled out of the block almost every single day. Every time the client reaches for it to cook in their new home, they think of you.</p>

      <div class="mt-4 p-4 bg-[#00A89D]/5 rounded-2xl">
        <strong class="text-[#00A89D]">Why It Works So Well</strong>
        <ul class="mt-2 text-sm space-y-1">
          <li>Highest daily usage frequency of almost any kitchen tool</li>
          <li>Emotional tie to “home” and feeding the family</li>
          <li>Feels premium without being ostentatious</li>
          <li>Works for every demographic and home style</li>
        </ul>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <div class="font-semibold text-[#00A89D]">Best Timing</div>
          <div class="text-sm mt-1">Closing gift (highest impact) or 6-month anniversary touch for your top clients.</div>
        </div>
        <div>
          <div class="font-semibold text-[#00A89D]">Pro Upgrade</div>
          <div class="text-sm mt-1">Have it engraved with their new address or “The [Last Name] Home” on the blade spine or handle. Subtle branding on the box or a card inside.</div>
        </div>
      </div>

      <div class="mt-3 text-xs text-gray-500">Pair with a short note: “May your new kitchen create as many great memories as it does meals. Welcome home!”</div>
    `, copyText: 'High-quality chef knife gift idea + note + timing' },

    { id: 'gift-custom-map', pillar: 'clients', type: 'gift', title: 'Custom Neighborhood Map Art', teaser: 'Hyper-personal — shows you actually know and care about their new home', cost: '$40–70', content: `
      <strong>Custom Neighborhood or City Map Art</strong>
      <p class="mt-3">A beautifully framed print of their specific neighborhood, subdivision, or city skyline. One of the most personal and meaningful closing gifts possible. It literally hangs in their new home and tells the story of “this is where we started our next chapter.”</p>

      <div class="mt-4 p-4 bg-[#00A89D]/5 rounded-2xl">
        <strong class="text-[#00A89D]">Why It Works</strong>
        <p class="mt-1 text-sm">Extremely high emotional resonance. Most people have never received something this personal from a lender. It feels like you were paying attention to their story, not just their loan file.</p>
      </div>

      <div class="mt-4 text-sm">
        <div class="font-semibold text-[#00A89D]">Best Timing &amp; Delivery</div>
        <ul class="mt-1 space-y-1 text-sm">
          <li>Ideal as a closing gift or 30–60 day “settled in” surprise</li>
          <li>Have it shipped directly to their new address with a handwritten card</li>
          <li>Optional: Add a small gift card for framing if you know they’re on a tight budget post-move</li>
        </ul>
      </div>
    `, copyText: 'Custom neighborhood map art gift + delivery tip' },

    { id: 'gift-welcome-mat', pillar: 'clients', type: 'gift', title: 'Personalized Welcome Mat', teaser: 'Used by the whole family every single day — constant visible reminder', cost: '$35–55', content: `
      <strong>Personalized Welcome Mat (“The [Last Name] Home”)</strong>
      <p class="mt-3">A high-quality, tasteful welcome mat with their family name or new address. This is genuinely used multiple times per day by every person who walks into the house — kids, spouse, guests, dog walker. It is impossible to ignore.</p>

      <div class="mt-4 p-4 bg-[#00A89D]/5 rounded-2xl">
        <strong class="text-[#00A89D]">Why It Works</strong>
        <p class="mt-1 text-sm">Highest possible daily visibility of any closing gift under $60. Every time they (or anyone) wipes their feet, they are literally standing on your thoughtfulness.</p>
      </div>

      <div class="mt-3 text-sm">
        <strong>Pro Tips:</strong> Choose a neutral, high-quality mat (not the thin cheap ones). Have the name in an elegant font. Add a small card inside the box that says “May every person who crosses this threshold feel as welcome as you made us feel during your home search.”
      </div>
    `, copyText: 'Personalized welcome mat gift idea + pro tips' },

    // Ongoing Relationship Gifts
    { id: 'gift-relationship-book', pillar: 'clients', type: 'gift', title: 'Book Related to Their Hobby', teaser: 'Powerful low-cost ongoing gift that proves you were listening', cost: '$15–30', content: `
      <strong>Book Related to Their Hobby + Handwritten Note Inside</strong>
      <p class="mt-3">One of the highest-ROI low-cost gifts in the entire vault. During the transaction or post-close call, they almost always mention something they love (golf, cooking, gardening, finance, kids’ activities, travel). Buying the exact right book 6–12 months later feels like magic.</p>

      <div class="mt-4 p-4 bg-[#00A89D]/5 rounded-2xl">
        <strong class="text-[#00A89D]">Why It Works</strong>
        <p class="mt-1 text-sm">It is the ultimate proof that you were paying attention as a human, not just processing a transaction. Almost no one else does this consistently.</p>
      </div>

      <div class="mt-3 text-sm">
        <strong>Best Timing:</strong> 6–12 month anniversary or birthday. Hand-write a note on the inside cover: “Saw this and immediately thought of you. Hope it gives you as much joy as you gave us during your home purchase.”
      </div>
    `, copyText: 'Hobby-related book gift + sample note' },

    // NEW HIGH-VALUE FRAMEWORK
    { id: 'client-gift-budget-timing', pillar: 'clients', type: 'framework', title: 'Client Gift Budgeting, Sourcing & Timing Cadence', teaser: 'The complete system for spending wisely and staying top-of-mind for years', cost: '', content: `
      <strong>Client Gift Budgeting, Sourcing &amp; 4-Touch Post-Closing Cadence</strong>
      <p class="mt-3">Most agents either spend too much on closing gifts and then disappear, or spend almost nothing and wonder why they get no referrals. This is the simple, sustainable system that keeps clients raving about you for life.</p>

      <div class="mt-5">
        <div class="font-semibold text-[#00A89D]">Recommended Annual Client Gift Budget (Per Client)</div>
        <div class="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">Standard client: $35–60 total across 2 years</div>
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">Top 20% clients: $80–120 total (extra love at 6 &amp; 12 months)</div>
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">VIP / referral machines: $150–200 (include experience gifts)</div>
        </div>
      </div>

      <div class="mt-5">
        <div class="font-semibold text-[#00A89D]">The 4-Touch Post-Closing Gift Cadence (This Is The Magic)</div>
        <div class="mt-3 space-y-4 text-sm">
          <div class="border-l-4 border-[#00A89D] pl-4">
            <strong>Touch 1 — Closing (Day 0–3):</strong> $25–50 premium item (knife, map, mat, quality tumbler). This is your “wow” moment.
          </div>
          <div class="border-l-4 border-[#00A89D] pl-4">
            <strong>Touch 2 — 6 Months:</strong> $10–20 living or daily item (plant, book, hand cream, coffee card). “We’re still thinking about you.”
          </div>
          <div class="border-l-4 border-[#00A89D] pl-4">
            <strong>Touch 3 — 12 Month Anniversary:</strong> $20–40 (nice bottle, experience gift card, or upgraded version of something they use). Huge emotional impact.
          </div>
          <div class="border-l-4 border-[#00A89D] pl-4">
            <strong>Touch 4 — 18–24 Months (optional but powerful):</strong> Small surprise or experience. Only for your best clients and strongest referral sources.
          </div>
        </div>
      </div>

      <div class="mt-5 p-4 bg-[#00A89D]/5 rounded-2xl">
        <strong class="text-[#00A89D]">Sourcing Tips</strong>
        <ul class="mt-2 text-sm space-y-1">
          <li>Amazon for speed + consistency on staples (totes, bottles, plants)</li>
          <li>Etsy for personalized/engraved items (mats, maps, journals, cutting boards)</li>
          <li>Local specialty shops for chocolate, honey, experiences — feels more thoughtful</li>
          <li>Keep a small “gift closet” of 5–6 go-to items so you can move fast</li>
        </ul>
      </div>
    `, copyText: 'Client gift budgeting + 4-touch cadence framework' },

    // New premium item
    { id: 'gift-leather-journal', pillar: 'clients', type: 'gift', title: 'Leather Journal or Notebook', teaser: 'Timeless, engraved, used for years — classic high-impact gift', cost: '$25–45', content: `
      <strong>Premium Leather Journal or Notebook (Engraved)</strong>
      <p class="mt-3">A high-quality leather-bound journal or nice hardcover notebook engraved with their new address or family name. One of the most timeless and appreciated gifts you can give. They will actually use it for years — notes, to-do lists, kids’ schedules, gratitude journaling.</p>

      <div class="mt-4 p-4 bg-[#00A89D]/5 rounded-2xl">
        <strong class="text-[#00A89D]">Why It Works</strong>
        <p class="mt-1 text-sm">Feels substantial and personal. Engraving makes it irreplaceable. Works for every age and profession. Pairs beautifully with a nice pen as a $35–55 combo.</p>
      </div>

      <div class="mt-3 text-sm">Best as a closing gift or 6-month touch for clients who mentioned they like to write, journal, or are starting a new chapter.</div>
    `, copyText: 'Leather journal engraved gift idea' },

    { id: 'gift-yeti-tumbler', pillar: 'clients', type: 'gift', title: 'Yeti or High-End Tumbler (Engraved)', teaser: 'Premium daily driver — used constantly by the whole family for years', cost: '$30–50', content: `
      <strong>Yeti or Equivalent High-End Insulated Tumbler (Address or Monogram Engraved)</strong>
      <p class="mt-3">A genuinely premium tumbler (not the cheap Amazon knockoffs). Engrave it with their new address or family name. This becomes one of the most-used items in the entire household — morning coffee, kids’ water, gym, car, desk, sports practices. Constant, daily visibility for years.</p>

      <div class="mt-4 p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl">
        <strong class="text-[#00A89D]">Why It Works So Well</strong>
        <ul class="mt-2 text-sm space-y-1">
          <li>Extremely high daily usage across the whole family</li>
          <li>Noticeably better quality than what most people already own</li>
          <li>Engraving makes it feel personal and “theirs” forever</li>
          <li>Works for every demographic and lifestyle</li>
        </ul>
      </div>

      <div class="mt-4 text-sm">
        <strong>Best Timing:</strong> Excellent as a closing gift for active families or as a 6–12 month “we’re still thinking of you” surprise.
      </div>
    `, copyText: 'Yeti / high-end tumbler engraved gift idea + timing' },

    // New high-value experiential gift
    { id: 'gift-experience', pillar: 'clients', type: 'gift', title: 'Local Experience Gift', teaser: 'Creates a memory instead of another object', cost: '$50–150', content: `
      <strong>Local Experience Gift (Dinner, Golf, Spa, Show, or Adventure)</strong>
      <p class="mt-3">Instead of another physical item, give the gift of an experience — a nice dinner for two at a local restaurant, a round of golf, a couples spa day, concert tickets, or a local adventure (hot air balloon, escape room, cooking class, etc.).</p>

      <div class="mt-4 p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl">
        <strong class="text-[#00A89D]">Why This Is Extremely Powerful</strong>
        <p class="mt-1 text-sm">Experiences create emotional memories that last much longer than objects. Every time they talk about that dinner or golf round, they think of you. This is one of the highest “wow” gifts you can give without spending a fortune.</p>
      </div>

      <div class="mt-4 text-sm">
        <strong>Best Timing:</strong> Outstanding 6–12 month touch for your best clients or as a closing gift for couples who just bought their first home together.
      </div>
    `, copyText: 'Local experience gift idea (dinner, golf, spa, etc.)' },

    // New framework tying gifts to retention
    { id: 'client-gift-retention-link', pillar: 'clients', type: 'framework', title: 'Linking Gifts to Your Retention Engine', teaser: 'How to use gifts as part of your 7-Day + Anniversary + Birthday system', cost: '', content: `
      <strong>Linking Gifts to Your Retention Engine</strong>
      <p class="mt-3">The most sophisticated agents don’t treat gifts as random nice gestures. They deliberately tie gifts into their 7-Day, Anniversary, and Birthday systems for maximum relationship impact.</p>

      <div class="mt-5">
        <div class="font-semibold text-[#00A89D]">Recommended Gift Touch Points</div>
        <div class="mt-3 space-y-4 text-sm">
          <div class="border-l-4 border-[#00A89D] pl-4">
            <strong>Day 7 Post-Closing Call:</strong> Mention that a small thank-you gift is coming in the mail (builds anticipation).
          </div>
          <div class="border-l-4 border-[#00A89D] pl-4">
            <strong>30–60 Days:</strong> Small, useful gift (coffee card, plant, tote) with a handwritten note.
          </div>
          <div class="border-l-4 border-[#00A89D] pl-4">
            <strong>6-Month Anniversary:</strong> Living or daily item (book, water bottle, hand cream) + reference to their new home.
          </div>
          <div class="border-l-4 border-[#00A89D] pl-4">
            <strong>12-Month Anniversary:</strong> Premium item (Yeti, leather journal, experience gift) — this is the big emotional one.
          </div>
          <div class="border-l-4 border-[#00A89D] pl-4">
            <strong>Birthday + Future Anniversaries:</strong> Rotate low-cost thoughtful items or experiences so you’re never silent.
          </div>
        </div>
      </div>
    `, copyText: 'How to tie client gifts into your 7-Day and retention systems' },

    // Premium home item - very Giftology aligned
    { id: 'gift-cutting-board', pillar: 'clients', type: 'gift', title: 'Custom Engraved Cutting Board', teaser: 'High-end, used daily, deeply personal', cost: '$45–80', content: `
      <strong>Custom Engraved Cutting Board (with New Address or Family Name)</strong>
      <p class="mt-3">A thick, high-quality wooden cutting board engraved with their new address or “The [Last Name] Home”. This is a true luxury item that gets used constantly in the kitchen and becomes a permanent part of the home.</p>

      <div class="mt-4 p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl">
        <strong class="text-[#00A89D]">Why This Is a Standout Gift</strong>
        <p class="mt-1 text-sm">It’s substantial, beautiful, and extremely personal. Most people would never buy this for themselves. It lives on the counter or hangs on the wall and gets used every single day.</p>
      </div>
    `, copyText: 'Custom engraved cutting board gift idea' },

    // Ongoing touch - subscription style
    { id: 'gift-subscription', pillar: 'clients', type: 'gift', title: '3–6 Month Subscription Starter', teaser: 'The gift that keeps giving every month', cost: '$60–120', content: `
      <strong>3–6 Month Subscription Starter (Coffee, Wine, Book, or Snack Box)</strong>
      <p class="mt-3">Start a short subscription for them — a coffee club, a wine of the month, a book subscription, or a high-quality snack box. You pay for the first 3 or 6 months and they receive something thoughtful every month.</p>

      <div class="mt-4 p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl">
        <strong class="text-[#00A89D]">Why This Creates Strong Top-of-Mind Status</strong>
        <p class="mt-1 text-sm">Every single month they receive something from you. It’s one of the best ways to stay present in their life long after closing without constant effort on your part.</p>
      </div>
    `, copyText: 'Subscription starter gift (coffee, wine, books, snacks)' },

    // Small practical system
    { id: 'gift-sourcing-system', pillar: 'clients', type: 'framework', title: 'Client Gift Sourcing & Storage System', teaser: 'How to always have the right gift ready without last-minute stress', cost: '', content: `
      <strong>Client Gift Sourcing & Storage System</strong>
      <p class="mt-3">One of the biggest reasons agents don’t send gifts consistently is that they have to think about it and order it every single time. This small system removes that friction.</p>

      <div class="mt-5">
        <div class="font-semibold text-[#00A89D]">Simple System</div>
        <ul class="mt-3 text-sm space-y-2">
          <li><strong>Keep a small “gift closet”</strong> of 6–8 go-to items (totes, coffee cards, plants, journals, tumblers) so you can send something same-day or next-day.</li>
          <li><strong>Have 2–3 trusted vendors bookmarked</strong> for engraved/premium items (Etsy for cutting boards & journals, local for experiences).</li>
          <li><strong>Batch order every quarter</strong> — once every 3 months, order a small batch of your 3–4 most used items so you’re never caught without anything.</li>
          <li><strong>Log every gift sent</strong> in your CRM (date + what was given + why) so you never repeat the same gift too closely.</li>
        </ul>
      </div>
    `, copyText: 'Simple system for sourcing and storing client gifts efficiently' },

    // New high-quality daily use item
    { id: 'gift-coaster-set', pillar: 'clients', type: 'gift', title: 'Custom Engraved Coaster Set', teaser: 'Used every single day, looks expensive, very personal', cost: '$25–45', content: `
      <strong>High-Quality Engraved Coaster Set (Marble, Wood, or Leather)</strong>
      <p class="mt-3">A beautiful set of 4–6 coasters engraved with their new address or family name. This is something that literally gets used multiple times every single day and looks like a luxury item on their coffee table or kitchen counter.</p>

      <div class="mt-4 p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl">
        <strong class="text-[#00A89D]">Why It Works</strong>
        <p class="mt-1 text-sm">Extremely high daily usage + visible in the main living areas. Feels thoughtful and expensive without being flashy. One of the best “daily reminder” gifts under $50.</p>
      </div>
    `, copyText: 'Custom engraved coaster set gift idea' },

    // Very personal and emotional
    { id: 'gift-house-portrait', pillar: 'clients', type: 'gift', title: 'Custom House Portrait / Illustration', teaser: 'Deeply emotional and meaningful', cost: '$60–150', content: `
      <strong>Custom Illustrated Portrait of Their New Home</strong>
      <p class="mt-3">A beautiful custom drawing or watercolor-style illustration of their actual new house (from a photo you request). This is one of the most emotional and personal gifts possible. It usually ends up framed and hung in a prominent place.</p>

      <div class="mt-4 p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl">
        <strong class="text-[#00A89D]">Why This One Stands Out</strong>
        <p class="mt-1 text-sm">It’s not something they would buy for themselves. It captures the emotion of “we bought our home” better than almost anything else. Extremely high perceived value and emotional impact.</p>
      </div>
    `, copyText: 'Custom house portrait / illustration gift' },

    // Practical + premium daily item
    { id: 'gift-throw-blanket', pillar: 'clients', type: 'gift', title: 'High-Quality Personalized Throw Blanket', teaser: 'Used constantly, especially in the first years', cost: '$40–80', content: `
      <strong>Premium Personalized Throw Blanket</strong>
      <p class="mt-3">A thick, high-quality throw blanket with subtle personalization (embroidered initials, new address, or “The [Last Name] Home”). New homeowners use blankets a lot in the first few years — on the couch, for movie nights, for kids, for guests.</p>

      <div class="mt-4 p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl">
        <strong class="text-[#00A89D]">Why This Is Excellent</strong>
        <p class="mt-1 text-sm">Very high usage frequency, looks nice in the living room, and feels like a real upgrade. Works incredibly well for families with kids or people who like to entertain.</p>
      </div>
    `, copyText: 'Premium personalized throw blanket gift' },

    // Post-Closing Framework - Rich Version
    { id: 'post-closing-7day', pillar: 'clients', type: 'checklist', title: '7-Day Post-Closing Call Framework', teaser: 'Full script + education + feedback + future business', cost: '', content: `
      <div class="space-y-6">
        <div>
          <div class="text-sm uppercase tracking-wider text-[#00A89D] font-semibold mb-1">Highest-ROI Touch in the Client Journey</div>
          <p class="text-lg">Most agents disappear after closing. The ones who follow up around day 7 stand out dramatically and generate significantly higher review + referral rates.</p>
          <div class="mt-3 p-3 bg-[#00A89D]/5 rounded-xl text-sm">
            <strong>The Math:</strong> The Lifetime Value of a first-time homebuyer is often 5x. If each transaction is worth ~$4k to you, that’s $20k+ — not counting referrals.
          </div>
        </div>

        <div>
          <h4 class="font-bold text-[#00A89D] mb-2">The 7-Day Rule + Power Hour</h4>
          <p>Call on or around day 7 (ideally Thursday mornings). Block a weekly “Power Hour” to make these calls along with upcoming anniversaries and birthdays.</p>
        </div>

        <div>
          <h4 class="font-bold mb-3">Exact Call Framework (From the Training)</h4>
          
          <div class="space-y-5">
            <!-- Opening -->
            <div class="border-l-4 border-[#00A89D] pl-4">
              <div class="font-semibold">1. Opening — Enthusiastic & Permission-Based</div>
              <div class="text-sm mt-2 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                "Hi [Name]! It’s [Your Name]. Am I catching you at a good time for 2–3 minutes?"<br><br>
                "I’m calling to congratulate you on your new home and thank you for trusting me with your purchase."
              </div>
              <div class="text-xs text-gray-500 mt-1">Pause and listen. Let them feel the energy.</div>
            </div>

            <!-- Education -->
            <div class="border-l-4 border-[#00A89D] pl-4">
              <div class="font-semibold">2. Permission-Based Education</div>
              <div class="text-sm mt-2">"Well, now that you've officially closed, I want to share a few important things. Would you mind if I shared them with you?"</div>
              
              <div class="mt-3 space-y-3 text-sm">
                <div><strong>Utilities &amp; HOA Setup:</strong> "Have you gotten utilities and trash/recycling transferred into your name? If you have an HOA, I'll make sure you have the portal login and any move-in checklist."</div>
                <div><strong>Property Tax Exemptions:</strong> "Most counties offer homestead or owner-occupied tax exemptions — filing deadlines matter, so search your county's options when you get a chance. It can save real money every year."</div>
                <div><strong>Bills &amp; Junk Mail:</strong> "You may still get separate tax or insurance bills even though your lender escrows — coordinate with them so you don't double-pay. Also expect investor mail, home warranty pitches, and 'we'll buy your house' postcards. Forward anything questionable to me before you respond."</div>
                <div><strong>Home Value Updates:</strong> "I also send a complimentary monthly home value update (HomeBot or similar) so you can track your equity over time. Most clients love seeing that number grow — your first report should arrive within about 30 days."</div>
              </div>
            </div>

            <!-- Feedback -->
            <div class="border-l-4 border-[#00A89D] pl-4">
              <div class="font-semibold">3. Feedback (Active Listening)</div>
              <div class="text-sm mt-2">"Thinking back, how do you feel we did for you overall?"<br><br>
              "I know there’s no such thing as perfection, but we’re always pursuing it. What was one thing we could have done better?"</div>
              <div class="text-xs text-gray-500 mt-1">Pause. Listen. Dig deeper if needed. This is gold.</div>
            </div>

            <!-- Asks -->
            <div class="border-l-4 border-[#00A89D] pl-4">
              <div class="font-semibold">4. The Asks</div>
              <div class="text-sm mt-2">
                "Before we wrap, can I ask two quick favors?"<br><br>
                <strong>Google Review:</strong> "If I send you a link, would you be open to leaving a quick testimonial? It would mean the world."<br><br>
                <strong>Referral:</strong> "When friends or coworkers talk about buying or selling, would you be comfortable mentioning my name?"
              </div>
            </div>

            <!-- Sales Anchor -->
            <div class="border-l-4 border-[#00A89D] pl-4">
              <div class="font-semibold">5. The Sales Anchor (Annual Home & Equity Review)</div>
              <div class="text-sm mt-2">"I’d like to reach back out once a year around your home anniversary for a quick 15–30 minute home equity and market check-in. It's basically a check-up on your home's value and what's happening in your neighborhood. Most clients find it surprisingly useful."</div>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
          <strong class="text-[#00A89D]">Pro Tips from the Training:</strong>
          <ul class="mt-2 text-sm space-y-1">
            <li>Start every call enthusiastically. Ask questions, then <strong>PAUSE — LISTEN!</strong></li>
            <li>Use a checklist during the call so you never miss a point.</li>
            <li>Always follow up the call with a short text recapping anything discussed.</li>
            <li>After the 7-day calls, pivot into calling clients with upcoming birthdays or anniversaries within the next 7 days.</li>
          </ul>
        </div>

        <div class="border-t pt-4 mt-4">
          <h4 class="font-bold text-[#00A89D] mb-2">Complete 7-Day Post-Closing Call Checklist</h4>
          <div class="text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 leading-relaxed">
            <strong>Pre-Call</strong><br>
            ☐ Block time for your weekly “Power Hour” (Thursday recommended)<br>
            ☐ Pull list of clients who closed 7 days ago<br>
            ☐ Have their transaction notes and closing details ready<br><br>

            <strong>Opening the Call</strong><br>
            ☐ Greet enthusiastically and ask if they have 2–3 minutes<br>
            ☐ Congratulate them on the new home<br>
            ☐ Thank them for trusting you with their purchase<br>
            ☐ Ask permission to share a few important things<br><br>

            <strong>Education Topics</strong><br>
            ☐ Explain first payment and how escrows work (taxes & insurance)<br>
            ☐ Warn about receiving separate tax and insurance bills (don’t double pay)<br>
            ☐ Mention property tax exemptions for owner-occupied homes<br>
            ☐ Prepare them for refinance/junk mail solicitations<br>
            ☐ Tell them to forward questionable offers to you before responding<br>
            ☐ Mention HomeBot / home value monthly report<br><br>

            <strong>Feedback & Relationship</strong><br>
            ☐ Ask: “How do you feel we did overall?”<br>
            ☐ Ask: “What’s one thing we could have done better?”<br>
            ☐ Request Google/online testimonial<br>
            ☐ Ask for referral: “When buying or selling comes up, would you mention my name?”<br><br>

            <strong>Sales Anchor (Future Business)</strong><br>
            ☐ Set expectation for Annual Home & Equity Review call (around home anniversary)<br>
            ☐ Position it as a “home equity and market check-in”<br>
            ☐ Leave the door open: “Please reach out anytime you need anything”<br><br>

            <strong>After the Call</strong><br>
            ☐ Log the call and notes in your CRM<br>
            ☐ Send the Google review link if they agreed<br>
            ☐ Add them to your annual review calendar
          </div>
          <div class="mt-2 text-xs text-gray-500">Use this checklist during your calls. Copy it for easy reference.</div>
        </div>
      </div>
    `, copyText: '7-day post-closing call full framework + scripts + checklist' },

    // Emails (legacy short versions removed - rich versions are defined later in the array)
    // Annual Home & Equity Review (companion to 7-Day) — polished rich framework + sample script + saveable pieces
    { id: 'annual-home-equity-review', pillar: 'clients', type: 'checklist', title: 'Annual Home & Equity Review Framework', teaser: 'The powerful retention anchor from the 7-day call', cost: '', content: `
      <strong>Annual Home &amp; Equity Review (15–30 min check-in)</strong>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">The natural follow-on you plant in the 7-day call. Feels like a free annual service — surfaces equity, market shifts, and life-change opportunities for future buy/sell needs.</p>
      <p class="mt-2 text-sm text-gray-500">Open this card for the full rich modal with agenda, scripts, and save buttons.</p>
    `, copyText: 'Annual Home & Equity Review framework + sample script + key questions' },

    // Post-Closing Follow-up Texts — polished with more templates + per-item actions
    { id: 'post-closing-texts', pillar: 'clients', type: 'script', title: 'Post-Closing Text & Email Templates', teaser: 'Immediate follow-ups after the 7-day call', cost: '', content: `
      <strong>Same-Day + Ongoing Text &amp; Email Templates</strong>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Send the same-day text within 2 hours of the call. These turn a good conversation into a relationship touch and make the review/referral ask feel natural.</p>

      <div class="mt-5 space-y-3">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="font-semibold text-sm">Same-Day Thank You + Review Ask</div>
            <div class="flex gap-1.5 flex-shrink-0">
              <button onclick="const t='Hi [Name], thanks again for the time on the call today. Really appreciate you trusting us with your real estate. If you have a quick second, would you mind leaving us a Google review? Here\\'s the link: [link]'; navigator.clipboard.writeText(t).then(()=>{const b=this; const o=b.innerHTML; b.innerHTML='<i class=\\'fas fa-check\\'></i> Copied'; setTimeout(()=>b.innerHTML=o,1400);}).catch(()=>{});" class="text-[10px] px-2.5 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-medium">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Post-Close Text: Thank You + Review', 'Hi [Name], thanks again for the time on the call today. Really appreciate you trusting us with your real estate. If you have a quick second, would you mind leaving us a Google review? Here\\'s the link: [link]', this, 'script');}" class="text-[10px] px-2.5 py-1 rounded-xl border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium">Save</button>
            </div>
          </div>
          <div class="mt-2 text-sm text-gray-700 dark:text-gray-300">“Hi [Name], thanks again for the time on the call today. Really appreciate you trusting us with your real estate. If you have a quick second, would you mind leaving us a Google review? Here’s the link: [link]”</div>
        </div>

        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="font-semibold text-sm">After Positive Feedback on Call</div>
            <div class="flex gap-1.5 flex-shrink-0">
              <button onclick="const t='Thank you for the kind words [Name]! It means a lot. When you talk to friends or coworkers about buying or selling, I\\'d love it if you mentioned us.'; navigator.clipboard.writeText(t).then(()=>{const b=this; const o=b.innerHTML; b.innerHTML='<i class=\\'fas fa-check\\'></i> Copied'; setTimeout(()=>b.innerHTML=o,1400);}).catch(()=>{});" class="text-[10px] px-2.5 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-medium">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Post-Close Text: Positive Feedback Follow-Up', 'Thank you for the kind words [Name]! It means a lot. When you talk to friends or coworkers about buying or selling, I\\'d love it if you mentioned us.', this, 'script');}" class="text-[10px] px-2.5 py-1 rounded-xl border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium">Save</button>
            </div>
          </div>
          <div class="mt-2 text-sm text-gray-700 dark:text-gray-300">“Thank you for the kind words [Name]! It means a lot. When you talk to friends or coworkers about buying or selling, I’d love it if you mentioned us.”</div>
        </div>

        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="font-semibold text-sm">30-Day Value Check-In</div>
            <div class="flex gap-1.5 flex-shrink-0">
              <button onclick="const t='Hi [Name] — just checking in at the 30-day mark. How is everything feeling in the new house? Any questions on the payment, taxes, or insurance side? Happy to hop on a quick call or just text back and forth.'; navigator.clipboard.writeText(t).then(()=>{const b=this; const o=b.innerHTML; b.innerHTML='<i class=\\'fas fa-check\\'></i> Copied'; setTimeout(()=>b.innerHTML=o,1400);}).catch(()=>{});" class="text-[10px] px-2.5 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-medium">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Post-Close Text: 30-Day Check-In', 'Hi [Name] — just checking in at the 30-day mark. How is everything feeling in the new house? Any questions on the payment, taxes, or insurance side? Happy to hop on a quick call or just text back and forth.', this, 'script');}" class="text-[10px] px-2.5 py-1 rounded-xl border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium">Save</button>
            </div>
          </div>
          <div class="mt-2 text-sm text-gray-700 dark:text-gray-300">“Hi [Name] — just checking in at the 30-day mark. How is everything feeling in the new house? Any questions on the payment, taxes, or insurance side? Happy to hop on a quick call or just text back and forth.”</div>
        </div>

        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="font-semibold text-sm">90-Day + Annual Review Seed</div>
            <div class="flex gap-1.5 flex-shrink-0">
              <button onclick="const t='[Name], you’re coming up on 90 days in the new home — time flies! Everything still going smoothly? Around your one-year home anniversary I like to do a quick 15–20 min “home check-up” — equity snapshot, market pulse, and anything you should know as a homeowner. I’ll put a note to reach out then.'; navigator.clipboard.writeText(t).then(()=>{const b=this; const o=b.innerHTML; b.innerHTML='<i class=\\'fas fa-check\\'></i> Copied'; setTimeout(()=>b.innerHTML=o,1400);}).catch(()=>{});" class="text-[10px] px-2.5 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-medium">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Post-Close Text: 90-Day + Annual Seed', '[Name], you’re coming up on 90 days in the new home — time flies! Everything still going smoothly? Around your one-year home anniversary I like to do a quick 15–20 min “home check-up” — equity snapshot, market pulse, and anything you should know as a homeowner. I’ll put a note to reach out then.', this, 'script');}" class="text-[10px] px-2.5 py-1 rounded-xl border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium">Save</button>
            </div>
          </div>
          <div class="mt-2 text-sm text-gray-700 dark:text-gray-300">“[Name], you’re coming up on 90 days in the new home — time flies! Everything still going smoothly? Around your one-year home anniversary I like to do a quick 15–20 min “home check-up” — equity snapshot, market pulse, and anything you should know as a homeowner. I’ll put a note to reach out then.”</div>
          <div class="mt-1 text-[10px] text-gray-500">This plants the Annual Review without pressure.</div>
        </div>
      </div>

      <div class="mt-4 text-xs text-gray-500">Pro tip: Personalize with one specific detail from the call (“Hope the new grill is getting a workout!”) — it makes these 10x more powerful.</div>
    `, copyText: 'Post-closing follow-up text & email templates (same-day + 30/90 day)' },

    // 7-Day Anniversary & Birthday System (High-Value Retention Engine)
    { id: 'client-anniversary-system', pillar: 'clients', type: 'framework', title: 'Weekly Client Anniversary & Birthday System', teaser: 'The retention engine that runs after your 7-day calls', cost: '', content: `
      <strong>Weekly Client Anniversary & Birthday System</strong>
      <p class="mt-3">After you finish your 7-day post-closing calls, immediately pivot into a sustainable weekly habit: calling every client who has an upcoming home purchase anniversary or birthday within the next 7 days.</p>

      <div class="mt-4 p-4 bg-[#00A89D]/5 rounded-xl">
        <strong class="text-[#00A89D]">Why This Is Extremely Valuable</strong>
        <ul class="mt-2 text-sm space-y-1">
          <li>It keeps you top of mind on the most emotional dates in their homeownership journey.</li>
          <li>Anniversaries are natural times people think about their real estate (rates, equity, life changes).</li>
          <li>Birthdays are pure relationship touches — almost no one else does this consistently.</li>
          <li>This single habit can generate more referrals than almost anything else you do after the initial 7-day call.</li>
        </ul>
      </div>

      <div class="mt-4">
        <h4 class="font-semibold">How to Run the System</h4>
        <ul class="mt-2 text-sm space-y-2">
          <li><strong>Every Monday (or your chosen day):</strong> Pull a list of clients with anniversaries or birthdays in the next 7 days.</li>
          <li><strong>Anniversary Calls:</strong> Keep it light but valuable. Congratulate them, ask how the home is treating them, mention current rates if relevant, and re-offer the Annual Review.</li>
          <li><strong>Birthday Calls/Texts:</strong> Much lighter touch. A genuine 60-second call or thoughtful text is often enough. Reference something specific if possible.</li>
          <li><strong>Block the time:</strong> Treat this like a non-negotiable weekly meeting with your future self.</li>
        </ul>
      </div>

      <div class="mt-4 text-sm italic text-gray-600 dark:text-gray-400">
        This is the system that turns the one-time 7-day call into a true long-term retention engine.
      </div>
    `, copyText: 'Weekly Client Anniversary & Birthday System' },

    // 7-Day Call Objection Responses (High-Value Add-on) — polished rich cards
    { id: '7day-objections', pillar: 'clients', type: 'script', title: 'Objection Responses for the 7-Day Call', teaser: 'What to say when clients push back', cost: '', content: `
      <strong>Common Pushbacks + Graceful Responses</strong>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Acknowledge first. Keep it to 1–2 sentences. Pivot to value or permission. These are designed to feel helpful, never pushy.</p>

      <div class="mt-5 space-y-3">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="font-semibold text-sm">“I’m really busy right now.”</div>
            <div class="flex gap-1.5 flex-shrink-0">
              <button onclick="const t='I completely understand — this will only take 2–3 minutes. I just want to make sure you’re not running into any surprises with the new payment or paperwork.'; navigator.clipboard.writeText(t).then(()=>{const b=this; const o=b.innerHTML; b.innerHTML='<i class=\\'fas fa-check\\'></i> Copied'; setTimeout(()=>b.innerHTML=o,1400);}).catch(()=>{});" class="text-[10px] px-2.5 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-medium">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('7-Day Objection: Busy', 'I completely understand — this will only take 2–3 minutes. I just want to make sure you’re not running into any surprises with the new payment or paperwork.', this, 'script');}" class="text-[10px] px-2.5 py-1 rounded-xl border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium">Save</button>
            </div>
          </div>
          <div class="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">“I completely understand — this will only take 2–3 minutes. I just want to make sure you’re not running into any surprises with the new payment or paperwork.”</div>
          <div class="mt-1 text-[10px] text-gray-500">Acknowledge the objection + name the tiny time commitment.</div>
        </div>

        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="font-semibold text-sm">“Everything is fine, I don’t really have any questions.”</div>
            <div class="flex gap-1.5 flex-shrink-0">
              <button onclick="const t='That’s great to hear! Before I let you go, can I quickly cover two things that catch most people off guard in the first month?'; navigator.clipboard.writeText(t).then(()=>{const b=this; const o=b.innerHTML; b.innerHTML='<i class=\\'fas fa-check\\'></i> Copied'; setTimeout(()=>b.innerHTML=o,1400);}).catch(()=>{});" class="text-[10px] px-2.5 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-medium">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('7-Day Objection: No questions', 'That’s great to hear! Before I let you go, can I quickly cover two things that catch most people off guard in the first month?', this, 'script');}" class="text-[10px] px-2.5 py-1 rounded-xl border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium">Save</button>
            </div>
          </div>
          <div class="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">“That’s great to hear! Before I let you go, can I quickly cover two things that catch most people off guard in the first month?”</div>
          <div class="mt-1 text-[10px] text-gray-500">Validate + create curiosity with “two things most people…”</div>
        </div>

        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="font-semibold text-sm">“I already have someone for that.”</div>
            <div class="flex gap-1.5 flex-shrink-0">
              <button onclick="const t='Totally fair — I’m your agent, not trying to sell you anything new. This is just a quick check-in to make sure your first month goes smoothly. Most people appreciate the heads-up on homestead exemptions, utility transfers, and junk mail.'; navigator.clipboard.writeText(t).then(()=>{const b=this; const o=b.innerHTML; b.innerHTML='<i class=\\'fas fa-check\\'></i> Copied'; setTimeout(()=>b.innerHTML=o,1400);}).catch(()=>{});" class="text-[10px] px-2.5 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-medium">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('7-Day Objection: Already have someone', 'Totally fair — I’m your agent, not trying to sell you anything new. This is just a quick check-in to make sure your first month goes smoothly. Most people appreciate the heads-up on homestead exemptions, utility transfers, and junk mail.', this, 'script');}" class="text-[10px] px-2.5 py-1 rounded-xl border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium">Save</button>
            </div>
          </div>
          <div class="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">“Totally fair — I’m your agent, not trying to sell you anything new. This is just a quick check-in to make sure your first month goes smoothly. Most people appreciate the heads-up on homestead exemptions, utility transfers, and junk mail.”</div>
          <div class="mt-1 text-[10px] text-gray-500">Remove sales pressure. Position as free insurance against surprises.</div>
        </div>

        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="font-semibold text-sm">“Can you just email it to me?”</div>
            <div class="flex gap-1.5 flex-shrink-0">
              <button onclick="const t='Happy to — the reason I called is these first-month gotchas are easy to miss in an email. It’s literally two minutes and most people say they’re glad we talked live.'; navigator.clipboard.writeText(t).then(()=>{const b=this; const o=b.innerHTML; b.innerHTML='<i class=\\'fas fa-check\\'></i> Copied'; setTimeout(()=>b.innerHTML=o,1400);}).catch(()=>{});" class="text-[10px] px-2.5 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-medium">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('7-Day Objection: Just email it', 'Happy to — the reason I called is these first-month gotchas are easy to miss in an email. It’s literally two minutes and most people say they’re glad we talked live.', this, 'script');}" class="text-[10px] px-2.5 py-1 rounded-xl border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium">Save</button>
            </div>
          </div>
          <div class="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">“Happy to — the reason I called is these first-month gotchas are easy to miss in an email. It’s literally two minutes and most people say they’re glad we talked live.”</div>
          <div class="mt-1 text-[10px] text-gray-500">Honor the request while explaining why the live touch is different.</div>
        </div>

        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="font-semibold text-sm">“I don’t want to think about my real estate right now.”</div>
            <div class="flex gap-1.5 flex-shrink-0">
              <button onclick="const t='Totally get that — you just moved in! The only reason I’m calling is to make sure the boring stuff (tax bills, insurance, junk mail) doesn’t surprise you in the next 30 days. After this you’re good for the year.'; navigator.clipboard.writeText(t).then(()=>{const b=this; const o=b.innerHTML; b.innerHTML='<i class=\\'fas fa-check\\'></i> Copied'; setTimeout(()=>b.innerHTML=o,1400);}).catch(()=>{});" class="text-[10px] px-2.5 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-medium">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('7-Day Objection: Don’t want to think about real estate', 'Totally get that — you just moved in! The only reason I’m calling is to make sure the boring stuff (tax bills, insurance, junk mail) doesn’t surprise you in the next 30 days. After this you’re good for the year.', this, 'script');}" class="text-[10px] px-2.5 py-1 rounded-xl border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium">Save</button>
            </div>
          </div>
          <div class="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">“Totally get that — you just moved in! The only reason I’m calling is to make sure the boring stuff (tax bills, insurance, junk mail) doesn’t surprise you in the next 30 days. After this you’re good for the year.”</div>
          <div class="mt-1 text-[10px] text-gray-500">Empathize with the honeymoon phase + limit the scope (“after this you’re good”).</div>
        </div>
      </div>

      <div class="mt-5 p-4 bg-amber-50 dark:bg-gray-800 border border-amber-100 dark:border-gray-700 rounded-2xl text-sm">
        <strong class="text-amber-700 dark:text-amber-400">How to handle any pushback:</strong> Pause. Acknowledge (“Totally fair / I get it”). Reframe to client benefit. Offer the micro-commitment. End with the value or the ask.
      </div>
    `, copyText: '7-day call objection responses + handling framework' },

    // ============================================================
    // PILLAR 5 — CONTENT & PERSONAL BRANDING (RICH FRAMEWORKS)
    // ============================================================

    { 
      id: 'content-pillars', 
      pillar: 'content', 
      type: 'framework', 
      title: 'The 6 Content Pillars That Work for Agents', 
      teaser: 'Exactly what to post about so you never run out of ideas', 
      content: `
        <div class="mb-6">
          <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-600">CONTENT STRATEGY</span>
        </div>
        
        <h3 class="text-2xl font-bold mb-2">The 6 Content Pillars That Actually Work in 2026</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">Stop guessing what to post. These six pillars are proven to build trust, generate engagement, and convert viewers into clients. Use them as your permanent content menu.</p>

        <div class="space-y-6">
          <!-- Pillar 1 -->
          <div class="border-l-4 border-[#00A89D] pl-5">
            <div class="font-bold text-lg flex items-center gap-2">1. Local Market Expertise & Data</div>
            <div class="text-sm mt-1 text-gray-600">Why it works: People buy homes in specific neighborhoods. You become the undeniable local authority.</div>
            <div class="mt-3 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
              <strong>Content ideas:</strong><br>
              • Monthly “What $X buys in [neighborhood] right now” carousels<br>
              • “This week’s hottest listings under $400k” (with your commentary)<br>
              • “3 things changing in [zip code] that buyers need to know”<br>
              • Side-by-side: 2024 vs 2026 median prices in your key cities
            </div>
            <div class="mt-2 text-xs text-[#00A89D]">Pro move: Always end with “DM me if you want the full report for your neighborhood.”</div>
          </div>

          <!-- Pillar 2 -->
          <div class="border-l-4 border-[#00A89D] pl-5">
            <div class="font-bold text-lg flex items-center gap-2">2. First-Time Buyer Education (The Empathy Pillar)</div>
            <div class="text-sm mt-1 text-gray-600">Why it works: First-time buyers are the most scared and the most likely to refer you for life if you make them feel safe.</div>
            <div class="mt-3 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
              <strong>High-performers:</strong><br>
              • “The 7 fees nobody tells you about until closing”<br>
              • “What your credit score actually needs to be in 2026 (it’s not 740)”<br>
              • “How much house can you really afford?” (with real math)<br>
              • “The exact documents you’ll need (organized by stage)”
            </div>
          </div>

          <!-- Pillar 3 -->
          <div class="border-l-4 border-amber-500 pl-5">
            <div class="font-bold text-lg flex items-center gap-2">3. Rate & Market Reality Checks</div>
            <div class="text-sm mt-1 text-gray-600">Why it works: Rates dominate conversation. You become the calm, trusted voice instead of the fear-mongering media.</div>
            <div class="mt-3 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
              <strong>Formats that crush:</strong><br>
              • “Rates are 6.8% — here’s what that actually means for a $380k home”<br>
              • “The 3 scenarios where waiting for lower rates will cost you money”<br>
              • “Why 7% today can still be a better deal than 4% in 2021” (with math)<br>
              • Weekly 45-second “Rate Reality Check” Reels
            </div>
          </div>

          <!-- Pillar 4 -->
          <div class="border-l-4 border-blue-500 pl-5">
            <div class="font-bold text-lg flex items-center gap-2">4. Client Wins & Transformation Stories</div>
            <div class="text-sm mt-1 text-gray-600">Why it works: Social proof is the strongest sales tool you have. Real stories beat any script.</div>
            <div class="mt-3 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
              <strong>Story templates:</strong><br>
              • “Bought their first home with a 618 credit score and $8k down — here’s exactly how”<br>
              • “Refi saved them $417/month… and they used the savings for a kitchen remodel”<br>
              • “Helped a family of 5 move into the school district they thought was impossible”<br>
              <span class="text-xs">Always get permission + change names if needed.</span>
            </div>
          </div>

          <!-- Pillar 5 -->
          <div class="border-l-4 border-emerald-500 pl-5">
            <div class="font-bold text-lg flex items-center gap-2">5. Behind the Scenes & Personality</div>
            <div class="text-sm mt-1 text-gray-600">Why it works: People do business with people they know, like, and trust. This pillar humanizes you.</div>
            <div class="mt-3 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
              <strong>Easy wins:</strong><br>
              • “Day in the life of an agent” (filmed on your phone)<br>
              • “The 3 questions I ask every client before we even pull credit”<br>
              • “What I’m telling my buyers this week that I wasn’t telling them 6 months ago”<br>
              • Funny/relatable closing day moments
            </div>
          </div>

          <!-- Pillar 6 -->
          <div class="border-l-4 border-rose-500 pl-5">
            <div class="font-bold text-lg flex items-center gap-2">6. Quick Tips, Myths & “Did You Know?”</div>
            <div class="text-sm mt-1 text-gray-600">Why it works: Short, snackable, high shareability. Perfect for Reels and Stories.</div>
            <div class="mt-3 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
              <strong>Evergreen gold:</strong><br>
              • “You can use gift funds from your boss for a down payment”<br>
              • “VA loans have no real estate insurance — even with 0% down”<br>
              • “Your home value just went up $47k and you can access it tax-free”<br>
              • Myth-busting series (20% down, credit score myths, etc.)
            </div>
          </div>
        </div>

        <div class="mt-8 p-5 bg-purple-50 dark:bg-gray-800 rounded-2xl border border-purple-200">
          <strong class="text-purple-700">Your Content Menu Rule:</strong><br>
          <span class="text-sm">Every week, post at least one piece from Pillar 1 (Local), one from Pillar 2 or 3 (Education/Rate Reality), and one from Pillar 4, 5 or 6 (Story/Personality/Tip). This mix keeps you both authoritative and human.</span>
        </div>
      `, 
      copyText: 'The 6 Content Pillars framework for agents' 
    },

    { 
      id: 'content-repurposing', 
      pillar: 'content', 
      type: 'framework', 
      title: 'The 1-to-7 Content Repurposing System', 
      teaser: 'Turn one 60-second video into 7+ pieces of content', 
      content: `
        <div class="mb-6">
          <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-600">CONTENT SYSTEM</span>
        </div>
        
        <h3 class="text-2xl font-bold mb-2">The 1-to-7 Repurposing System</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">Record once. Publish everywhere. This is how top-producing agents create 15–20 pieces of content per week without burning out.</p>

        <div class="bg-gradient-to-r from-purple-50 to-white dark:from-gray-800 p-5 rounded-2xl mb-6">
          <strong>The Core Principle:</strong> One strong 60–90 second video (filmed on your phone) becomes the source for everything else.
        </div>

        <div class="space-y-5">
          <div>
            <div class="font-bold text-[#00A89D] mb-1">Step 1 — Record the Original (The “Mother” Video)</div>
            <div class="text-sm">Film a 60–90 second Reel or TikTok answering one specific question your audience actually asks. Use trending audio when possible. Keep it energetic and direct to camera.</div>
          </div>

          <div>
            <div class="font-bold text-[#00A89D] mb-1">Step 2 — Immediate Repurposes (Same Day)</div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-sm">
              <div class="bg-white dark:bg-gray-900 border p-3 rounded-xl">• Post the original Reel to Instagram + TikTok + YouTube Shorts</div>
              <div class="bg-white dark:bg-gray-900 border p-3 rounded-xl">• Save the raw video and post a slightly different cut as a Story series (3–4 frames)</div>
              <div class="bg-white dark:bg-gray-900 border p-3 rounded-xl">• Turn key lines into 3–5 static carousel graphics (use Canva or CapCut)</div>
              <div class="bg-white dark:bg-gray-900 border p-3 rounded-xl">• Pull 3–4 quotes for LinkedIn + Facebook text posts</div>
            </div>
          </div>

          <div>
            <div class="font-bold text-[#00A89D] mb-1">Step 3 — Deeper Repurposes (Next 1–2 Days)</div>
            <div class="text-sm space-y-2 mt-2">
              <div>• Write a 400–600 word LinkedIn article or Facebook post expanding the same idea with 2–3 real client examples.</div>
              <div>• Turn the transcript into an email to your database (“This week’s 90-second market insight”).</div>
              <div>• Create a 5–7 slide carousel that tells the same story visually (different framing than the Reel).</div>
              <div>• Record a 45-second “talking head” version for your Instagram feed (square, more polished).</div>
            </div>
          </div>

          <div>
            <div class="font-bold text-[#00A89D] mb-1">Step 4 — Long-Form Leverage (Weekly)</div>
            <div class="text-sm">Take your 3–4 best Reels from the week and combine them into one 8–12 minute YouTube video titled “Real Estate Questions I’m Answering This Week.” This becomes SEO gold and a lead magnet.</div>
          </div>
        </div>

        <div class="mt-8 p-5 border border-[#00A89D]/30 bg-[#00A89D]/5 rounded-2xl">
          <strong class="text-[#00A89D]">Realistic Weekly Output from 4–5 Mother Videos:</strong><br>
          <span class="text-sm">18–25 total pieces of content (Reels, carousels, emails, LinkedIn posts, Stories, one longer YouTube). This is how you stay omnipresent without spending your life on content.</span>
        </div>
      `, 
      copyText: '1-to-7 Content Repurposing System full breakdown' 
    },

    { 
      id: 'reel-hook-formula', 
      pillar: 'content', 
      type: 'framework', 
      title: 'The Reel Hook Formula That Actually Stops the Scroll', 
      teaser: 'Proven hook structures for real estate content in 2026', 
      content: `
        <div class="mb-6">
          <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-600">REEL MASTERY</span>
        </div>
        
        <h3 class="text-2xl font-bold mb-2">The Reel Hook Formula That Stops the Scroll</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">You have 1.5 seconds. Here are the exact hook patterns that are working right now for producing agents — tested and listingned in 2025–2026.</p>

        <div class="space-y-6 text-sm">
          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <div class="font-bold text-lg mb-2 text-[#00A89D]">1. The “I Was Wrong” Hook</div>
            <div class="italic mb-2">"I used to tell every buyer to wait for lower rates… I was dead wrong."</div>
            <div class="text-xs text-gray-500">Why it works: Vulnerability + authority. People stop because they want to know what changed your mind.</div>
          </div>

          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <div class="font-bold text-lg mb-2 text-[#00A89D]">2. The Contrarian / Counter-Intuitive Hook</div>
            <div class="italic mb-2">"6.75% is actually one of the best times in 15 years to buy a home. Here’s the math nobody shows you."</div>
            <div class="text-xs text-gray-500">Why it works: Challenges common belief. The brain hates cognitive dissonance and keeps watching to resolve it.</div>
          </div>

          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <div class="font-bold text-lg mb-2">3. The “Most People Don’t Know” Hook</div>
            <div class="italic mb-2">"Most people don’t realize you can put 0% down as a veteran and still have no PMI. Watch this before you listen to your uncle."</div>
            <div class="text-xs text-gray-500">Curiosity gap + social proof (“your uncle is wrong”). Extremely effective.</div>
          </div>

          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <div class="font-bold text-lg mb-2">4. The Specific Number Hook</div>
            <div class="italic mb-2">"This couple just saved $2,847 per year using a strategy most agents never mention."</div>
            <div class="text-xs text-gray-500">Specific numbers feel researched and credible. Vague claims get scrolled past.</div>
          </div>

          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <div class="font-bold text-lg mb-2">5. The “Story Hook” (Best for Reels)</div>
            <div class="italic mb-2">"A 29-year-old nurse reached out last week feeling overwhelmed. Three months later she closed on her first home. Here’s exactly what we did differently."</div>
            <div class="text-xs text-gray-500">Human + emotional + promise of a repeatable method.</div>
          </div>

          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <div class="font-bold text-lg mb-2">6. The Direct Question Hook</div>
            <div class="italic mb-2">"If rates dropped to 5.5% tomorrow, would you actually be ready to buy? Most of my clients wouldn’t. Here’s why that’s dangerous."</div>
            <div class="text-xs text-gray-500">Forces self-reflection. People watch to see if they’re the “most clients.”</div>
          </div>

          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <div class="font-bold text-lg mb-2">7. The “2026 Reality” Hook</div>
            <div class="italic mb-2">"The game changed in 2025. If you’re still using 2021 buying advice, you’re leaving money on the table (and probably overpaying)."</div>
            <div class="text-xs text-gray-500">Recency + authority. Works incredibly well right now.</div>
          </div>
        </div>

        <div class="mt-6 p-4 bg-purple-50 dark:bg-gray-800 rounded-2xl">
          <strong>Delivery Rules for Every Hook:</strong><br>
          <span class="text-sm">• First 3 words must be crystal clear (no filler)<br>
          • Slight pause after the hook line<br>
          • Eye contact with camera the entire time<br>
          • First 3 seconds = hook. Next 3 seconds = promise of value.</span>
        </div>
      `, 
      copyText: 'Reel Hook Formula - 7 proven patterns for agents' 
    },

    { 
      id: 'content-cadence', 
      pillar: 'content', 
      type: 'framework', 
      title: 'Agent Content Cadence & 2026 Algorithm Tips', 
      teaser: 'How often to post and what actually wins right now', 
      content: `
        <div class="mb-6">
          <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-600">CADENCE & ALGORITHM</span>
        </div>
        
        <h3 class="text-2xl font-bold mb-2">2026 Content Cadence That Actually Works</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">The old “post every day” advice is outdated and leads to burnout. Here’s what is producing real results for producing agents right now.</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div class="border rounded-2xl p-5">
            <div class="font-bold mb-3 text-[#00A89D]">Recommended Weekly Cadence (Sustainable)</div>
            <ul class="text-sm space-y-2">
              <li><strong>4–5 Reels / Shorts per week</strong> (Mon, Tue, Thu, Fri or Sat)</li>
              <li><strong>2–3 Carousels per week</strong> (LinkedIn + Instagram)</li>
              <li><strong>1 Longer YouTube video every 10–14 days</strong></li>
              <li><strong>3–4 Stories per day</strong> (behind the scenes, quick tips, market updates)</li>
              <li><strong>1–2 emails to database per week</strong></li>
            </ul>
          </div>
          <div class="border rounded-2xl p-5">
            <div class="font-bold mb-3 text-[#00A89D]">What the Algorithm Loves in 2026</div>
            <ul class="text-sm space-y-2">
              <li>Watch time in the first 3 seconds > everything else</li>
              <li>Comments and saves are weighted more heavily than likes</li>
              <li>Original trending audio still beats royalty-free music</li>
              <li>Posting at 6:45–7:30am or 7:00–8:00pm local time performs best</li>
              <li>Consistency for 6+ weeks beats “perfect” posting sporadically</li>
            </ul>
          </div>
        </div>

        <div>
          <h4 class="font-bold mb-3">The 70/20/10 Content Mix (Prevents Burnout)</h4>
          <div class="space-y-3 text-sm">
            <div class="flex gap-3"><div class="w-16 font-semibold">70%</div> <div>Educational / Valuable (your 6 pillars content)</div></div>
            <div class="flex gap-3"><div class="w-16 font-semibold">20%</div> <div>Personal / Behind the scenes (builds likeability)</div></div>
            <div class="flex gap-3"><div class="w-16 font-semibold">10%</div> <div>Direct but soft business asks (reviews, referrals, “I’m taking new clients”)</div></div>
          </div>
        </div>

        <div class="mt-8 p-5 bg-amber-50 dark:bg-gray-800 rounded-2xl border border-amber-200">
          <strong class="text-amber-700">Burnout Prevention Rules</strong><br>
          <span class="text-sm">• Batch film 4–6 Reels on Sunday or Monday in one 90-minute session.<br>
          • Use CapCut templates aggressively — they save hours.<br>
          • One “off” day per week with zero content creation. Protect it.<br>
          • If you miss a day, never double-post the next day to “catch up.” The algorithm punishes inconsistency more than gaps.</span>
        </div>
      `, 
      copyText: '2026 Content Cadence & Algorithm guide for agents' 
    },

    // ============================================================
    // PILLAR 4 — OBJECTION HANDLING MASTERY (RICH LIBRARY)
    // ============================================================

    { 
      id: 'objection-rates', 
      pillar: 'objections', 
      type: 'script', 
      title: '“Prices Feel Too High” — 5 Powerful Responses', 
      teaser: 'The best market-price objection handlers in the current market', 
      content: `
        <strong>“The Market Is Too Expensive” — 5 High-Impact Responses (2026)</strong>
        <div class="mt-5 space-y-5 text-sm">
          <div class="p-4 bg-white dark:bg-gray-900 border-l-4 border-amber-500 rounded-r-2xl">
            <strong>1. The Reality Search Play</strong><br>
            “I hear that a lot. Before we decide waiting is the answer, let’s look at what’s actually available in your must-have areas at your target payment — sometimes the gap is smaller than the headlines suggest.”
          </div>
          <div class="p-4 bg-white dark:bg-gray-900 border-l-4 border-amber-500 rounded-r-2xl">
            <strong>2. The Lender Clarity Move</strong><br>
            “Totally fair concern. Payment is only one piece. I’ll connect you with a trusted lender for a real pre-approval so we know what’s possible before we rule anything out.”
          </div>
          <div class="p-4 bg-white dark:bg-gray-900 border-l-4 border-amber-500 rounded-r-2xl">
            <strong>3. The Trade-Off Frame</strong><br>
            “Most buyers aren’t finding the perfect house at the perfect price. They’re choosing the best fit and negotiating the rest. Let’s define your non-negotiables and stay flexible on the rest.”
          </div>
          <div class="p-4 bg-white dark:bg-gray-900 border-l-4 border-amber-500 rounded-r-2xl">
            <strong>4. The Rent vs. Own Conversation</strong><br>
            “Let’s compare what you’re paying now with what ownership could look like — including equity, stability, and timeline. Sometimes the monthly gap is smaller than people expect.”
          </div>
          <div class="p-4 bg-white dark:bg-gray-900 border-l-4 border-amber-500 rounded-r-2xl">
            <strong>5. The Honest Pause</strong><br>
            “If now isn’t the right time, I’d rather tell you that honestly and help you build a plan than push you into the wrong home. My job is to guide the decision — not force it.”
          </div>
        </div>
        <div class="mt-6 text-xs text-gray-500">Deliver these calmly. Never argue. Always offer clarity, options, and next steps.</div>
      `, 
      copyText: 'Prices feel too high - 5 powerful objection responses' 
    },

    { 
      id: 'objection-waiting', 
      pillar: 'objections', 
      type: 'script', 
      title: '“I’m Waiting for Rates to Drop” — Full Framework', 
      teaser: 'The cost of waiting + emotional + mathematical responses', 
      content: `
        <strong>“I’m Waiting for Rates to Drop” — The Complete Response Framework</strong>
        
        <div class="mt-4 p-4 bg-amber-50 dark:bg-gray-800 rounded-2xl">
          <strong>Core Truth to Communicate:</strong> Waiting for lower rates is one of the most expensive decisions most buyers make — and they don’t realize it until it’s too late.
        </div>

        <div class="mt-6 space-y-5 text-sm">
          <div>
            <strong>Response 1 — The Price Increase Math (Most Effective)</strong><br>
            “Let’s say rates drop to 5.5% in 12–18 months. In that same period, the average home price in our area has historically risen 9–14% when rates fall. On a $420,000 home that’s an extra $42–58k you’ll pay just to save maybe $180–220 per month on the payment. The break-even is often 7–9 years. Most people don’t stay in homes that long anymore.”
          </div>
          <div>
            <strong>Response 2 — The “Two Moves” Trap</strong><br>
            “A lot of people wait, then realize they still need to buy in 18 months. So they end up making two moves — renting longer + then buying at higher prices. That second move costs $12–18k in closing costs, moving, and stress. One move now at a higher rate is almost always cheaper than two moves later.”
          </div>
          <div>
            <strong>Response 3 — The Life Cost Question</strong><br>
            “I totally respect wanting to wait. The real question is: what is the cost of waiting in your actual life? Are you paying $2,100 in rent that could be $1,850 all-in owning? Are your kids in a school district you love? Are you giving up another year of building equity and stability? Sometimes the emotional and lifestyle cost is higher than the rate difference.”
          </div>
        </div>
      `, 
      copyText: 'Waiting for rates to drop - full objection framework' 
    },

    { 
      id: 'objection-credit', 
      pillar: 'objections', 
      type: 'script', 
      title: 'Credit Score Is Too Low — Scripts & Solutions', 
      teaser: 'How to handle credit objections without losing the deal', 
      content: `
        <strong>“My Credit Score Is Too Low” — Scripts + Realistic Solutions</strong>
        
        <div class="mt-5 space-y-5 text-sm">
          <div class="p-4 border-l-4 border-amber-500 bg-white dark:bg-gray-900 rounded-r-2xl">
            <strong>Opening Empathy + Reframe</strong><br>
            “I see credit scores in the 500s close loans every month. The score you see on Credit Karma is often not the one real estate lenders use. We have programs for scores as low as 580 on FHA and even lower on some portfolio products. The question isn’t ‘Is my score good enough?’ — it’s ‘What can we do in the next 60–90 days to get you the best possible rate and program?’”
          </div>

          <div>
            <strong>Key Things to Say:</strong>
            <ul class="mt-2 space-y-1.5 text-sm">
              <li>• “Rapid rescore programs can raise your score 30–70 points in 3–5 days if we fix the right things.”</li>
              <li>• “We pull your credit through all three bureaus. Sometimes one is 60–80 points higher.”</li>
              <li>• “Many of my buyers thought they needed 740. We paired them with the right lender partner and closed at 612 with a strong program match.”</li>
              <li>• “The fastest way to improve your score right now is usually paying down revolving debt to under 30% utilization.”</li>
            </ul>
          </div>
        </div>
      `, 
      copyText: 'Credit score too low - objection scripts' 
    },

    { 
      id: 'objection-downpayment', 
      pillar: 'objections', 
      type: 'script', 
      title: 'Down Payment Objections — DPA, Gifts & 0% Options', 
      teaser: 'Every realistic path to low or no down payment', 
      content: `
        <strong>“I Don’t Have Enough for a Down Payment” — Complete Playbook</strong>

        <div class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <strong>Down Payment Assistance (DPA)</strong><br>
            “In our area we have [name specific programs — e.g. Indiana Housing, Ohio Housing, local city programs]. Some are up to $10–15k and are forgivable after 5–10 years if you stay in the home. Others are silent second mortgages at 0%.”
          </div>
          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <strong>Gift Funds</strong><br>
            “You can receive gift funds from parents, grandparents, siblings, or even your employer on most loan types. We just need a simple gift letter. I’ve had clients get $15–30k this way with zero repayment expected.”
          </div>
          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <strong>0% Down Options</strong><br>
            “VA loans for veterans and active military require $0 down with no PMI. USDA loans in eligible rural areas also allow 0% down. I can quickly tell you if either applies to you.”
          </div>
          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <strong>3–5% Down + Seller Credits</strong><br>
            “FHA is 3.5% down. Conventional can go as low as 3%. In this market, many sellers are offering 2–3% toward closing costs — effectively making your out-of-pocket even lower.”
          </div>
        </div>
      `, 
      copyText: 'Down payment objections - full solutions' 
    },

    { 
      id: 'objection-investor', 
      pillar: 'objections', 
      type: 'script', 
      title: 'Investor & Cash Buyer Objections', 
      teaser: 'When rates “don’t matter” or they want to pay cash', 
      content: `
        <strong>Investor & Cash Buyer Pushback — How to Stay in the Conversation</strong>
        
        <div class="mt-5 space-y-4 text-sm">
          <div>
            <strong>When they say “I’ll just pay cash”:</strong><br>
            “I love working with cash buyers — they’re usually the strongest. But even cash buyers are using leverage right now because money is still relatively cheap compared to the returns you can get in real estate. Would you be open to running the numbers on keeping some of your cash liquid and financing part of it? A lot of my investors are doing 50–70% LTV right now and loving the flexibility.”
          </div>
          <div>
            <strong>When they say “Rates don’t matter to me as an investor”:</strong><br>
            “Completely understand. The two things that usually matter more to investors are cash flow and appreciation. What most people miss is that higher rates right now are creating better buying opportunities because there’s less competition. The cap rates are more attractive than they were in 2021. Want to look at a couple of specific deals and see the actual cash-on-cash returns?”
          </div>
        </div>
      `, 
      copyText: 'Investor and cash buyer objection handlers' 
    },

    { 
      id: 'objection-competitor', 
      pillar: 'objections', 
      type: 'script', 
      title: '“I Already Have an Agent” / Competitor Objections', 
      teaser: 'Non-sleazy ways to earn the right to compete', 
      content: `
        <strong>“I Already Have an Agent” — Professional Ways to Compete</strong>

        <div class="mt-5 text-sm space-y-4">
          <div class="p-4 bg-white dark:bg-gray-900 border-l-4 border-amber-500 rounded-r-2xl">
            <strong>The Respectful Approach</strong><br>
            “Totally understand — loyalty matters. I’m not here to badmouth anyone. The only reason I’m asking for 10 minutes is because the real estate world has changed dramatically in the last 18 months. A lot of great agents who were excellent two years ago are now missing current pricing, marketing, and negotiation tactics. If after 10 minutes you feel your guy is still the best fit, I’ll respect that completely. Fair?”
          </div>

          <div>
            <strong>Powerful Follow-ups:</strong>
            <ul class="mt-2 space-y-1">
              <li>• “When was the last time you compared your home’s value or marketing plan with a fresh, local CMA?”</li>
              <li>• “I’m happy to be your second opinion at no obligation. I do this for a lot of people who already have a relationship.”</li>
              <li>• “The person who referred you to me specifically asked me to reach out because they felt you might be missing some current options.”</li>
            </ul>
          </div>
        </div>
      `, 
      copyText: 'I already have an agent - competitor objection scripts' 
    },

    { 
      id: 'objection-modern', 
      pillar: 'objections', 
      type: 'script', 
      title: 'AI-Era & Modern 2026 Objections', 
      teaser: 'Handling “ChatGPT said”, “Zillow says”, rate crash claims', 
      content: `
        <strong>2026 Modern Objections — ChatGPT, Zillow, “The Market Is Wrong”</strong>

        <div class="mt-5 space-y-5 text-sm">
          <div>
            <strong>“I ran my numbers on ChatGPT / an online calculator…”</strong><br>
            “Those tools are great for ballpark math. The problem is they don’t know this specific home’s condition, the competition this week, or how sellers are responding to offers right now. I’ll walk you through what the data actually means for your decision.”
          </div>
          <div>
            <strong>“Zillow / Realtor.com says my home is worth $X”</strong><br>
            “Online estimates are a starting point, not an appraisal. They don’t see your upgrades, your lot, or what buyers are actually paying on your street this month. Let’s look at real comps together before you price or offer.”
          </div>
          <div>
            <strong>“I read the market is about to crash / I should wait”</strong><br>
            “Headlines love extremes. In our local market, the better question is what you need for your life timeline — school, job, space, payment — and what inventory looks like for the homes you’d actually buy. I’d rather help you make a smart decision than guess the macro.”
          </div>
        </div>
      `, 
      copyText: 'AI-era and modern 2026 objection responses' 
    },

    // ============================================================
    // PILLAR 6 — EMAIL, TEXT & NURTURE TEMPLATES (RICH LIBRARY)
    // ============================================================

    { 
      id: 'email-weekly-partner', 
      pillar: 'nurture', 
      type: 'email', 
      title: 'Weekly Partner Value Email', 
      teaser: 'The low-effort, high-value touch referral partners actually appreciate', 
      content: `
        <strong>Weekly Partner Value Email</strong>
        <div class="mt-3 p-4 bg-blue-50 dark:bg-gray-800 rounded-2xl">
          <strong class="text-blue-600">Why This Works:</strong> Short, useful, zero pressure. Partners actually forward these. Positions you as the helpful local expert who adds real value without ever asking for business directly. This is pure relationship fuel that compounds.
        </div>

        <div class="mt-4">
          <strong>Pro Tips for Maximum Impact</strong>
          <ul class="mt-2 text-sm space-y-1">
            <li>Send every Monday or Tuesday morning — consistency builds trust.</li>
            <li>Keep the entire email under 80 words — busy agents skim.</li>
            <li>Make the 2-3 bullets hyper-local to their specific neighborhoods or recent listings.</li>
            <li>Always offer to co-brand or customize — this removes any sales feel and makes it about them.</li>
            <li>End with “No strings” or “Happy to help anytime.” Never a direct CTA.</li>
            <li>Pair with a small thoughtful pop-by every 4-6 weeks for even stronger results.</li>
          </ul>
        </div>

        <div class="mt-4">
          <strong>Example 1 — Market Snapshot + Tool Offer (Copy-Ready)</strong>
          <div class="mt-2 p-3 border rounded-xl bg-white dark:bg-gray-900" data-copy-text="Hi [Lender First Name],\n\nQuick one for you this week:\n• Median days on market in [neighborhood] just dropped to 11.\n• 3 new listings under $425k hit the market yesterday that actually show well.\n• I'm seeing strong buyer activity — happy to loop you in on any pre-quals before we write offers.\n\nLet me know if you want the full neighborhood snapshot. No strings.\n\nBest,\n[Your Name]">
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs font-semibold">Copy this full email</span>
              <button onclick="window.copyModalSection(this)" class="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Copy</button>
            </div>
            <div class="text-sm">
              Hi [Lender First Name],<br><br>
              Quick one for you this week:<br>
              • Median days on market in [neighborhood] just dropped to 11.<br>
              • 3 new listings under $425k hit the market yesterday that actually show well.<br>
              • I'm seeing strong buyer activity — happy to loop you in on any pre-quals before we write offers.<br><br>
              Let me know if you want the full neighborhood snapshot. No strings.<br><br>
              Best,<br>
              [Your Name]
            </div>
          </div>
        </div>

        <div class="mt-4">
          <strong>Example 2 — Inventory Update + Buyer Resource</strong>
          <div class="mt-2 p-3 border rounded-xl bg-white dark:bg-gray-900" data-copy-text="Hi [Lender First Name],\n\nQuick update:\n• Inventory in our primary zip codes is still under 2 months.\n• I'm putting together a simple co-branded “First-Time Buyer Timeline” one-pager for my sphere — happy to include your logo and contact if useful.\n\nLet me know if it would help your pipeline. No strings.\n\nBest,\n[Your Name]">
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs font-semibold">Copy this full email</span>
              <button onclick="window.copyModalSection(this)" class="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Copy</button>
            </div>
            <div class="text-sm">
              Hi [Lender First Name],\n\nQuick update:\n• Inventory in our primary zip codes is still under 2 months.\n• I'm putting together a simple co-branded “First-Time Buyer Timeline” one-pager for my sphere — happy to include your logo and contact if useful.\n\nLet me know if it would help your pipeline. No strings.\n\nBest,\n[Your Name]
            </div>
          </div>
        </div>

        <div class="mt-4">
          <strong>Example 3 — Market Snapshot + Soft Offer</strong>
          <div class="mt-2 p-3 border rounded-xl bg-white dark:bg-gray-900" data-copy-text="Hi [Lender First Name],\n\nInventory shifted in [area] this week — I’m seeing more multiple-offer activity. I put together a simple market snapshot + buyer FAQ one-pager your team can share with pre-approved clients.\n\nHappy to email or drop it off — no strings at all.\n\nBest,\n[Your Name]">
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs font-semibold">Copy this full email</span>
              <button onclick="window.copyModalSection(this)" class="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Copy</button>
            </div>
            <div class="text-sm">
              Hi [Lender First Name],\n\nInventory shifted in [area] this week — I’m seeing more multiple-offer activity. I put together a simple market snapshot + buyer FAQ one-pager your team can share with pre-approved clients.\n\nHappy to email or drop it off — no strings at all.\n\nBest,\n[Your Name]
            </div>
          </div>
        </div>

        <div class="mt-4 p-3 bg-blue-50 dark:bg-gray-800 rounded-xl text-xs">
          <strong>Pro Tips:</strong> The goal is to be top-of-mind as the helpful person, not the salesperson. These get forwarded because they’re genuinely useful to the agent’s clients. Track which ones get the best engagement and repeat the style.
        </div>
      `, 
      copyText: 'Weekly partner value email template' 
    },

    { 
      id: 'email-monthly-partner', 
      pillar: 'nurture', 
      type: 'email', 
      title: 'Monthly Market Snapshot for Referral Partners', 
      teaser: 'The email they actually forward to their sphere', 
      content: `
        <strong>Monthly Market Snapshot Email (Partner-Forwardable)</strong>
        <div class="mt-3 p-4 bg-blue-50 dark:bg-gray-800 rounded-2xl">
          <strong class="text-blue-600">Why This Works:</strong> Clean, no-hype, forwardable. Lenders, title reps, and co-broke agents love sharing these with buyers and sphere contacts. You become the go-to local market expert.
        </div>

        <div class="mt-4">
          <strong>Subject:</strong> [Your City] Market Update – March 2026 (Great for Your Clients)
        </div>

        <div class="mt-3 p-3 border rounded-xl bg-white dark:bg-gray-900" data-copy-text="Hi [Name],\n\nHere’s the clean, no-hype version of what’s actually happening in our market this month. Feel free to forward this to buyers you’re working with, your sphere, or use any piece in your own outreach.\n\nKey Numbers This Month:\n• Median price: $412,500 (up 3.2% YoY)\n• Days on market: 14 (down from 19 last month)\n• Inventory: 2.1 months (still very low)\n\nWhat I’m Telling Buyers and Sellers Right Now:\n[2-3 short bullet points of current advice]\n\nIf any of your buyers or clients want a full neighborhood breakdown or listing/buyer consult, have them text me — happy to help and I’ll make you look great.\n\nThanks for everything you do.\n[Your Name]">
          <div class="flex justify-between items-center mb-1">
            <strong class="text-xs">Main Template</strong>
            <button onclick="window.copyModalSection(this)" class="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Copy</button>
          </div>
          <div class="text-sm">
            Hi [Name],<br><br>
            Here’s the clean, no-hype version of what’s actually happening in our market this month. Feel free to forward this to buyers you’re working with, your sphere, or use any piece in your own outreach.<br><br>
            <strong>Key Numbers This Month:</strong><br>
            • Median price: $412,500 (up 3.2% YoY)<br>
            • Days on market: 14 (down from 19 last month)<br>
            • Inventory: 2.1 months (still very low)<br><br>
            <strong>What I’m Telling Buyers and Sellers Right Now:</strong><br>
            [2-3 short bullet points of current advice]<br><br>
            If any of your buyers or clients want a full neighborhood breakdown or listing/buyer consult, have them text me — happy to help and I’ll make you look great.<br><br>
            Thanks for everything you do.<br>
            [Your Name]
          </div>
        </div>
      `, 
      copyText: 'Monthly market snapshot email for partners' 
    },

    { 
      id: 'email-post-closing', 
      pillar: 'nurture', 
      type: 'email', 
      title: 'Post-Closing Thank You + Review Email', 
      teaser: 'The one that actually gets Google reviews', 
      content: `
        <strong>Post-Closing Thank You Email (Highest Response Rate)</strong>
        <div class="mt-3 p-4 bg-blue-50 dark:bg-gray-800 rounded-2xl">
          <strong class="text-blue-600">Why This Works:</strong> Genuine, short, offers ongoing help without pressure. The review ask feels natural because you led with value and relationship. This single email often generates more Google reviews and referrals than anything else in the first 90 days.
        </div>

        <div class="mt-4">
          <strong>Pro Tips for Maximum Response</strong>
          <ul class="mt-2 text-sm space-y-1">
            <li>Send within 48 hours of closing while the emotion is high.</li>
            <li>Personalize with one specific detail they mentioned during the process (kitchen, school district, etc.).</li>
            <li>Send the Google review link in a follow-up text the same day — much higher click rate.</li>
            <li>Keep it warm and human — no corporate language.</li>
            <li>Reference that you’re “still their person” — this plants the seed for future business and referrals.</li>
          </ul>
        </div>

        <div class="mt-4">
          <strong>Example 1 — Warm + Review Ask (Copy-Ready)</strong>
          <div class="mt-2 p-3 border rounded-xl bg-white dark:bg-gray-900" data-copy-text="Hi [First Name],\n\nI just wanted to say congratulations again on getting into your new home. It was genuinely a pleasure working with you.\n\nIf anything comes up — questions about taxes, insurance, maintenance, whatever — I’m still your person. You don’t need a “reason” to reach out.\n\nAlso, if you have 20 seconds, I would be incredibly grateful if you left a quick Google review. It helps me help more families like yours. Here’s the link: [your link]\n\nNo pressure at all. Just know I’m rooting for you in the new house.\n\nWarmly,\n[Your Name]">
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs font-semibold">Copy this full email</span>
              <button onclick="window.copyModalSection(this)" class="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Copy</button>
            </div>
            <div class="text-sm">
              Hi [First Name],\n\nI just wanted to say congratulations again on getting into your new home. It was genuinely a pleasure working with you.\n\nIf anything comes up — questions about taxes, insurance, maintenance, whatever — I’m still your person. You don’t need a “reason” to reach out.\n\nAlso, if you have 20 seconds, I would be incredibly grateful if you left a quick Google review. It helps me help more families like yours. Here’s the link: [your link]\n\nNo pressure at all. Just know I’m rooting for you in the new house.\n\nWarmly,\n[Your Name]
            </div>
          </div>
        </div>

        <div class="mt-4">
          <strong>Example 2 — Personalized with Specific Detail</strong>
          <div class="mt-2 p-3 border rounded-xl bg-white dark:bg-gray-900" data-copy-text="Hi [First Name],\n\nI just wanted to say congratulations again on getting into your new home. I still remember how excited you were about the big windows in the living room — hope you’re already making great memories there.\n\nIf anything comes up — questions about taxes, insurance, maintenance, whatever — I’m still your person. You don’t need a “reason” to reach out.\n\nAlso, if you have 20 seconds, I would be incredibly grateful if you left a quick Google review. It helps me help more families like yours. Here’s the link: [your link]\n\nNo pressure at all. Just know I’m rooting for you in the new house.\n\nWarmly,\n[Your Name]">
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs font-semibold">Copy this full email</span>
              <button onclick="window.copyModalSection(this)" class="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Copy</button>
            </div>
            <div class="text-sm">
              Hi [First Name],\n\nI just wanted to say congratulations again on getting into your new home. I still remember how excited you were about the big windows in the living room — hope you’re already making great memories there.\n\nIf anything comes up — questions about taxes, insurance, maintenance, whatever — I’m still your person. You don’t need a “reason” to reach out.\n\nAlso, if you have 20 seconds, I would be incredibly grateful if you left a quick Google review. It helps me help more families like yours. Here’s the link: [your link]\n\nNo pressure at all. Just know I’m rooting for you in the new house.\n\nWarmly,\n[Your Name]
            </div>
          </div>
        </div>

        <div class="mt-4">
          <strong>Example 3 — Short &amp; Emotional + Soft Review</strong>
          <div class="mt-2 p-3 border rounded-xl bg-white dark:bg-gray-900" data-copy-text="Hi [First Name],\n\nCongratulations again on the new home! It was truly a pleasure helping you get here.\n\nYou know where I am if anything ever comes up — taxes, insurance, questions, whatever. I’m still your person.\n\nIf you have a second, a quick Google review would mean the world. Link: [your link]\n\nRooting for you,\n[Your Name]">
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs font-semibold">Copy this full email</span>
              <button onclick="window.copyModalSection(this)" class="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Copy</button>
            </div>
            <div class="text-sm">
              Hi [First Name],\n\nCongratulations again on the new home! It was truly a pleasure helping you get here.\n\nYou know where I am if anything ever comes up — taxes, insurance, questions, whatever. I’m still your person.\n\nIf you have a second, a quick Google review would mean the world. Link: [your link]\n\nRooting for you,\n[Your Name]
            </div>
          </div>
        </div>

        <div class="mt-4 p-3 bg-blue-50 dark:bg-gray-800 rounded-xl text-xs">
          <strong>Pro Tips:</strong> Send within 48 hours of closing. Personalize with one specific detail from their process. Send the review link in a follow-up text the same day for higher response. This email + text combo is one of the highest-ROI touches in the entire vault.
        </div>

        <div class="mt-4">
          <strong>Subject Line Options:</strong><br>
          • Congratulations Again on Your New Home, [First Name]!<br>
          • Welcome Home — A Quick Note + One Small Favor<br>
          • Your New Chapter Starts Now (and I’m still here)
        </div>

        <div class="mt-4 p-3 border rounded-xl bg-white dark:bg-gray-900" data-copy-text="Hi [First Name],\n\nI just wanted to say congratulations again on getting into your new home. It was genuinely a pleasure working with you.\n\nIf anything comes up — questions about taxes, insurance, maintenance, whatever — I’m still your person. You don’t need a “reason” to reach out.\n\nAlso, if you have 20 seconds, I would be incredibly grateful if you left a quick Google review. It helps me help more families like yours. Here’s the link: [your link]\n\nNo pressure at all. Just know I’m rooting for you in the new house.\n\nWarmly,\n[Your Name]">
          <div class="flex justify-between items-center mb-1">
            <strong class="text-xs">Main Template</strong>
            <button onclick="const t=this.parentElement.getAttribute('data-copy-text'); navigator.clipboard.writeText(t).then(()=>{this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',1500)})" class="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Copy</button>
          </div>
          <div class="text-sm">
            Hi [First Name],<br><br>
            I just wanted to say congratulations again on getting into your new home. It was genuinely a pleasure working with you.<br><br>
            If anything comes up — questions about taxes, insurance, maintenance, whatever — I’m still your person. You don’t need a “reason” to reach out.<br><br>
            Also, if you have 20 seconds, I would be incredibly grateful if you left a quick Google review. It helps me help more families like yours. Here’s the link: [your link]<br><br>
            No pressure at all. Just know I’m rooting for you in the new house.<br><br>
            Warmly,<br>
            [Your Name]
          </div>
        </div>

        <div class="mt-4 p-3 bg-blue-50 dark:bg-gray-800 rounded-xl text-xs">
          <strong>Pro Tips:</strong> Send within 48 hours of closing. Personalize with one specific detail from their process. Send the review link in a follow-up text the same day for higher response. This email + text combo is one of the highest-ROI touches in the entire vault.
        </div>
      `, 
      copyText: 'Post-closing thank you email with review ask' 
    },

    { 
      id: 'email-30-60-90', 
      pillar: 'nurture', 
      type: 'email', 
      title: '30 / 60 / 90 Day Client Nurture Sequence', 
      teaser: 'The first three months that turn clients into lifelong advocates', 
      content: `
        <strong>30 / 60 / 90 Day Post-Closing Nurture Sequence</strong>
        
        <div class="mt-5 space-y-6 text-sm">
          <div>
            <strong>Day 30 Email</strong><br>
            Subject: How’s the new place treating you?<br>
            Short, warm check-in. Ask one specific question about something they mentioned during the process. Offer help with any “new homeowner” surprises.
          </div>
          <div>
            <strong>Day 60 Text (Much Lighter)</strong><br>
            “Hey [Name] — quick one. Any chance you’ve told anyone you know about the experience of working with me? I’m trying to help a few more families this month and your referral would mean a lot.”
          </div>
          <div>
            <strong>Day 90 Email</strong><br>
            Subject: One quick favor + a small gift for you<br>
            Thank them for being a client. Send a small branded item or useful local recommendation. Re-ask for a Google review if they haven’t left one. Plant the seed for the Annual Home & Equity Review.
          </div>
        </div>
      `, 
      copyText: '30-60-90 day client nurture sequence' 
    },

    { 
      id: 'email-annual-review-invite', 
      pillar: 'nurture', 
      type: 'email', 
      title: 'Annual Home Review & Market Update Invite', 
      teaser: 'The single highest-ROI email you can send past clients', 
      content: `
        <strong>Annual Home Review & Market Update Invite (The Money Email)</strong>
        <div class="mt-3 p-4 bg-blue-50 dark:bg-gray-800 rounded-2xl">
          <strong class="text-blue-600">Why This Works:</strong> Positions you as the ongoing expert and trusted advisor, not a one-time transaction. Highest ROI touch in the vault.
        </div>

        <div class="mt-4">
          <strong>Subject:</strong> Your Free “Home Search Strategy Session” (15 minutes)
        </div>

        <div class="mt-4 p-3 border rounded-xl bg-white dark:bg-gray-900" data-copy-text="Hi [First Name],\n\nIt’s been about a year since we closed on your home. I’m reaching out to offer something I do for all my past clients — a free 15–20 minute “Annual Home & Equity Review.”\n\nIt’s basically a home equity and market check-in. I’ll look at your estimated home value, equity built since closing, neighborhood trends, and any life changes that might make a move-up, downsize, or investment property worth exploring.\n\nNo pressure, no sales pitch. Just data. Most people find it surprisingly useful.\n\nWant to book a quick time? Just reply with a couple days that work.">
          <div class="flex justify-between items-center mb-1">
            <strong class="text-xs">Main Template</strong>
            <button onclick="window.copyModalSection(this)" class="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Copy</button>
          </div>
          <div class="text-sm">
            Hi [First Name],<br><br>
            It’s been about a year since we closed on your home. I’m reaching out to offer something I do for all my past clients — a free 15–20 minute “Annual Home & Equity Review.”<br><br>
            It’s basically a home equity and market check-in. I’ll look at your estimated home value, equity built since closing, neighborhood trends, and any life changes that might make a move-up, downsize, or investment property worth exploring.<br><br>
            No pressure, no sales pitch. Just data. Most people find it surprisingly useful.<br><br>
            Want to book a quick time? Just reply with a couple days that work.
          </div>
        </div>

        <div class="mt-4 p-3 bg-blue-50 dark:bg-gray-800 rounded-xl text-xs">
          <strong>Pro Tips:</strong> Send around the exact anniversary date. Mention “no pressure, no sales pitch” explicitly. Follow up with a text 3 days later if no reply.
        </div>
        <div class="mt-4 p-4 bg-blue-50 dark:bg-gray-800 rounded-2xl">
          <strong>Subject:</strong> Your Free “Home Search Strategy Session” (15 minutes)
        </div>
        <div class="mt-5 text-sm">
          Hi [First Name],<br><br>
          It’s been about a year since we closed on your home. I’m reaching out to offer something I do for all my past clients — a free 15–20 minute “Annual Home & Equity Review.”<br><br>
          It’s basically a home equity and market check-in. I’ll look at your estimated home value, equity built since closing, neighborhood trends, and any life changes that might make a move-up, downsize, or investment property worth exploring.<br><br>
          No pressure, no sales pitch. Just data. Most people find it surprisingly useful.<br><br>
          Want to book a quick time? Just reply with a couple days that work.
        </div>
      `, 
      copyText: 'Annual real estate review invite email' 
    },

    { 
      id: 'email-listing-checkin', 
      pillar: 'nurture', 
      type: 'email', 
      title: 'Rate Improvement / Refi Check-In', 
      teaser: 'Non-pushy reactivation when rates move', 
      content: `
        <strong>Rate Drop / Refi Check-In Email</strong>
        <div class="mt-4 p-4 bg-blue-50 dark:bg-gray-800 rounded-2xl">
          <strong>Subject:</strong> Rates have moved — worth a 3-minute look for you?
        </div>
        <div class="mt-5 text-sm">
          Hi [First Name],<br><br>
          Rates have improved a bit over the last few weeks. I’m not promising anything dramatic, but for some of my clients it’s now making sense to run the numbers.<br><br>
          If you’re even slightly curious, I can run a quick no-obligation scenario for you in about 3 minutes. No pressure — just data.<br><br>
          Want me to take a look?
        </div>
      `, 
      copyText: 'Refi / rate improvement check-in email' 
    },

    { 
      id: 'email-purchase-anniversary', 
      pillar: 'nurture', 
      type: 'email', 
      title: 'Home Purchase Anniversary Email', 
      teaser: 'The most emotionally powerful nurture email', 
      content: `
        <strong>Home Anniversary Email (Extremely High Open Rates)</strong>
        <div class="mt-4 p-4 bg-blue-50 dark:bg-gray-800 rounded-2xl">
          <strong>Subject:</strong> One year ago today…
        </div>
        <div class="mt-5 text-sm">
          Hi [First Name],<br><br>
          One year ago today we closed on your home. I still remember how excited you were about [specific detail they mentioned — the kitchen, the yard, the school district, etc.].<br><br>
          I hope the house is treating you well and that you’re making incredible memories there.<br><br>
          As always, I’m here if anything real estate-related comes up. No expiration date on that.<br><br>
          Happy home anniversary.<br><br>
          [Your Name]
        </div>
      `, 
      copyText: 'Home anniversary email template' 
    },

    { 
      id: 'text-partner-popby-followup', 
      pillar: 'nurture', 
      type: 'script', 
      title: 'Pop-By Follow-Up Text Scripts', 
      teaser: 'What to send after dropping off a gift', 
      content: `
        <strong>Pop-By Follow-Up Texts (Send same day or next morning)</strong>
        <div class="mt-5 space-y-4 text-sm">
          <div>
            <strong>Simple & Professional:</strong><br>
            “Hey [Name], just dropped off a little something at your office. Hope it makes your week a tiny bit better. No need to reply — just wanted you to know I’m thinking about you.”
          </div>
          <div>
            <strong>With a Soft CTA:</strong><br>
            “Dropped off a small gift at the front desk for you. If you end up with any clients who need a second opinion on financing in the next few weeks, I’d love to help. Enjoy the [item]!”
          </div>
          <div>
            <strong>Relationship-First Version:</strong><br>
            “Hey [Name] — left a little surprise for you. You’ve been crushing it lately and I wanted to say thank you for the referrals and the partnership. Let’s grab coffee soon if you have time.”
          </div>
        </div>
      `, 
      copyText: 'Pop-by follow-up text scripts for partners' 
    },

    // ============================================================
    // SPECTACULAR-LEVEL ADDITIONS — NEXT TIER PREMIUM CONTENT
    // ============================================================

    { 
      id: 'content-brand-positioning', 
      pillar: 'content', 
      type: 'framework', 
      title: 'The Agent Personal Brand Positioning Framework', 
      teaser: 'How to become the obvious choice in your market', 
      content: `
        <div class="mb-6">
          <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-600">BRAND STRATEGY</span>
        </div>
        
        <h3 class="text-2xl font-bold mb-2">The Personal Brand Positioning Framework</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">Most agents are forgettable. This framework forces you to become unmistakably you — the one people remember and recommend.</p>

        <div class="space-y-6">
          <div>
            <div class="font-bold mb-2 text-[#00A89D]">Step 1: Choose Your Signature Positioning (Pick One)</div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div class="p-4 border rounded-2xl">The Local Market Expert</div>
              <div class="p-4 border rounded-2xl">The First-Time Buyer Champion</div>
              <div class="p-4 border rounded-2xl">The Rate & Strategy Educator</div>
              <div class="p-4 border rounded-2xl">The No-BS Truth Teller</div>
              <div class="p-4 border rounded-2xl">The Client-For-Life Relationship Builder</div>
              <div class="p-4 border rounded-2xl">The Tech-Savvy Modern Agent</div>
            </div>
          </div>

          <div>
            <div class="font-bold mb-2 text-[#00A89D]">Step 2: Define Your “Only I” Statement</div>
            <p class="text-[15px]">"I am the only agent in [your area] who _______________ while also _______________."</p>
            <p class="text-xs mt-1 text-gray-500">Example: “I am the only agent in the greater metro who explains every fee like I’m talking to my mom, while also being brutally honest about when waiting makes sense.”</p>
          </div>

          <div>
            <div class="font-bold mb-2">Step 3: Your Visual + Verbal Signature</div>
            <ul class="text-sm space-y-1 mt-2">
              <li>• Consistent color palette and photo style across all platforms</li>
              <li>• 2–3 signature phrases you use in almost every piece of content</li>
              <li>• One recurring format (e.g., “Myth vs Reality” every Tuesday)</li>
            </ul>
          </div>
        </div>

        <div class="mt-6 p-5 bg-purple-50 dark:bg-gray-800 rounded-2xl">
          <strong>Brutal Truth:</strong> If someone can’t describe what makes you different in one sentence after seeing 5 pieces of your content, your brand is not working yet.
        </div>
      `, 
      copyText: 'Personal Brand Positioning Framework for agents' 
    },

    { 
      id: 'content-30day-sprint', 
      pillar: 'content', 
      type: 'framework', 
      title: '30-Day Content Launch Sprint Plan', 
      teaser: 'Exactly what to post for the next 30 days (plug and play)', 
      content: `
        <div class="mb-6">
          <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-600">ACTION PLAN</span>
        </div>
        
        <h3 class="text-2xl font-bold mb-2">30-Day Content Launch Sprint</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">Stop overthinking. Here is a complete 30-day plan using the 6 Pillars + repurposing system. Film 8–10 mother videos and you’re covered.</p>

        <div class="space-y-5 text-sm">
          <div><strong>Week 1 — Foundation (Focus: Pillar 2 + 3)</strong><br>
          Day 1–2: Film 3 “First-Time Buyer” education Reels<br>
          Day 3: One Rate Reality Check Reel<br>
          Day 4–5: Turn them into 2 carousels + 4 text posts</div>

          <div><strong>Week 2 — Authority (Focus: Pillar 1 + 6)</strong><br>
          Film 2 Local Market Data videos + 2 “Did You Know” myth busters<br>
          Create one longer YouTube video combining the best of week 1</div>

          <div><strong>Week 3 — Human (Focus: Pillar 5 + 4)</strong><br>
          Behind the scenes + 2 client win stories (with permission)<br>
          Heavy use of Stories this week</div>

          <div><strong>Week 4 — Systems (Focus: Pillar 3 + Repurposing)</strong><br>
          Cadence Reel + one deep “How I actually plan content” post<br>
          Repurpose your best performer from the month into 5 new formats</div>
        </div>

        <div class="mt-6 text-xs text-gray-500">Do this sprint once. Then repeat with fresh topics. You will never run out of content again.</div>
      `, 
      copyText: '30-Day Content Launch Sprint plan' 
    },

    { 
      id: 'objection-psychology-system', 
      pillar: 'objections', 
      type: 'framework', 
      title: 'The 90-Second Objection Psychology System', 
      teaser: 'The repeatable process behind every great response', 
      content: `
        <div class="mb-6">
          <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600">PSYCHOLOGY + PROCESS</span>
        </div>
        
        <h3 class="text-2xl font-bold mb-2">The 90-Second Objection Handling System</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">Stop memorizing scripts. Use this 5-step psychological flow instead. It works on almost every objection.</p>

        <div class="space-y-4">
          <div class="p-4 border-l-4 border-amber-500 bg-white dark:bg-gray-900 rounded-r-2xl">
            <strong>1. Acknowledge (3–5 seconds)</strong><br>
            “I completely understand why that feels like the right move right now.”
          </div>
          <div class="p-4 border-l-4 border-amber-500 bg-white dark:bg-gray-900 rounded-r-2xl">
            <strong>2. Validate + Reframe (15–20 seconds)</strong><br>
            Give legitimacy to their fear, then gently introduce a missing piece of reality.
          </div>
          <div class="p-4 border-l-4 border-amber-500 bg-white dark:bg-gray-900 rounded-r-2xl">
            <strong>3. Story or Data (25–35 seconds)</strong><br>
            One short real-world example or specific number that makes the abstract concrete.
          </div>
          <div class="p-4 border-l-4 border-amber-500 bg-white dark:bg-gray-900 rounded-r-2xl">
            <strong>4. Question Back (15 seconds)</strong><br>
            “How are you thinking about that?” or “What would need to be true for you to feel good moving forward?”
          </div>
          <div class="p-4 border-l-4 border-amber-500 bg-white dark:bg-gray-900 rounded-r-2xl">
            <strong>5. Permission + Next Step (10 seconds)</strong><br>
            Take the pressure off while keeping the door open.
          </div>
        </div>

        <div class="mt-6 p-5 bg-amber-50 dark:bg-gray-800 rounded-2xl text-sm">
          <strong>Master this flow and you will sound calm and prepared on every call.</strong>
        </div>
      `, 
      copyText: '90-Second Objection Psychology System' 
    },

    { 
      id: 'nurture-12month-calendar', 
      pillar: 'nurture', 
      type: 'framework', 
      title: 'The Complete 12-Month Client Nurture Calendar', 
      teaser: 'Never wonder what to send again — full year plan', 
      content: `
        <div class="mb-6">
          <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-600">RETENTION SYSTEM</span>
        </div>
        
        <h3 class="text-2xl font-bold mb-2">12-Month Client Nurture Calendar</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">Use this as your default rhythm. Mix in personal notes when you have real news.</p>

        <div class="text-sm space-y-3">
          <div><strong>Month 1:</strong> Post-closing thank you + review ask</div>
          <div><strong>Month 2:</strong> 30-day check-in text</div>
          <div><strong>Month 3:</strong> “How’s the house treating you?” email</div>
          <div><strong>Month 4:</strong> Market update or helpful article</div>
          <div><strong>Month 5:</strong> Birthday or random value touch</div>
          <div><strong>Month 6:</strong> 6-month anniversary note</div>
          <div><strong>Month 7–8:</strong> Seasonal value (tax tips, spring maintenance, etc.)</div>
          <div><strong>Month 9:</strong> Light referral ask + “I’m taking new clients”</div>
          <div><strong>Month 10:</strong> Home anniversary email (most powerful of the year)</div>
          <div><strong>Month 11:</strong> “Thinking of you” + small branded gift or useful resource</div>
          <div><strong>Month 12:</strong> Annual Home & Equity Review invitation</div>
        </div>

        <div class="mt-6 text-xs text-gray-500">This cadence alone will put you in the top 5% of agents for client retention.</div>
      `, 
      copyText: '12-Month Client Nurture Calendar' 
    },

    { 
      id: 'nurture-text-swipe-file', 
      pillar: 'nurture', 
      type: 'framework', 
      title: 'Text Message Swipe File – 40 Ready-to-Send Messages', 
      teaser: 'Relationship touches you can send in 10 seconds', 
      content: `
        <div class="mb-6">
          <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-600">TEXT SWIPE FILE</span>
        </div>
        
        <h3 class="text-2xl font-bold mb-2">Text Message Swipe File (40+ Messages)</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">Copy, paste, personalize. These are written for high response rates. Categorized for easy browsing.</p>

        <div class="space-y-6 text-sm">
          <div>
            <strong>Relationship Maintenance (Anytime) — 10 messages</strong><br>
            1. “Hey [Name], saw your post about the new job — huge congrats! Hope everything is going great at the new house.”<br>
            2. “Just thinking about you guys. Any fun plans for the house this summer?”<br>
            3. “Hope you had a great weekend! The new kitchen looks amazing from the photos you posted.”<br>
            4. “Random check-in — how’s the puppy adjusting to the new backyard?”<br>
            5. “Saw your post about the garden project — looks amazing! Hope you’re enjoying the new space.”<br>
            6. “Hey [Name], just wanted to say I’m grateful you’re in my world. Hope life’s treating you well.”<br>
            7. “How’s the family? Haven’t seen the kids in a while — they must be getting so big.”<br>
            8. “Quick hello — hope you had a great weekend. Anything fun on the calendar this week?”<br>
            9. “Thinking of you today. If anything real estate-related ever comes up, I’m always here.”<br>
            10. “Hey, loved the before/after on that flip you posted. Looks incredible!”
          </div>
          <div>
            <strong>Value Touches / Market & Tax Updates — 10 messages</strong><br>
            11. “Quick note — property taxes for [County] are due next month. Let me know if you want the exact amount for your home.”<br>
            12. “Rates moved a little this week. Not saying it’s time to do anything, but happy to run a quick scenario if you’re curious.”<br>
            13. “Just a heads up: inventory in [neighborhood] is up 12% this month. Might be good for some of your buyers.”<br>
            14. “Property tax bills just hit the mail in our area. Want me to pull the numbers for any of your recent clients?”<br>
            15. “New first-time buyer program just launched in [state] — up to $10k assistance. Happy to send details.”<br>
            16. “Quick market pulse: Days on market dropped to 9 in [zip]. Thought you’d want to know for your listings.”<br>
            17. “Insurance rates are creeping up again. I have a one-pager on how to shop it if any clients ask.”<br>
            18. “Just sent a market update to my list — happy to customize one for your sphere if helpful.”<br>
            19. “Rates are at a 3-month low this week. Want a simple flyer you can forward to past clients?”<br>
            20. “Tax exemption deadline is coming up for owner-occupied. Remind your buyers?”
          </div>
          <div>
            <strong>Light Referral Asks — 10 messages</strong><br>
            21. “If any of your friends or coworkers ever mention they’re thinking about buying or selling, I’d love to help them the same way I helped you.”<br>
            22. “When buying or selling comes up with your clients, feel free to mention my name. I’ll take great care of them.”<br>
            23. “Appreciate all the referrals you’ve sent. If you have any other agents who might benefit from a second opinion on financing, I’m happy to chat.”<br>
            24. “Just helped another one of your referrals close smoothly. Grateful for the trust.”<br>
            25. “No pressure at all, but if you know anyone thinking about buying or selling in the next 6 months, I’d be honored to help.”<br>
            26. “Your referrals mean the world. I treat every one like family.”<br>
            27. “If you ever have a client who’s nervous about rates or credit, send them my way for a no-obligation chat.”<br>
            28. “Just a reminder I’m always here for your clients — even if it’s just answering a quick question.”<br>
            29. “Love working with your clients. They’re always so prepared thanks to you!”
          </div>
          <div>
            <strong>Post-Closing & Anniversary Check-ins — 10+ messages</strong><br>
            30. “First payment went out smoothly on my end. Let me know if you have any questions at all about what you’re seeing.”<br>
            31. “Hope the first month in the new house has been smooth. Any surprises pop up?”<br>
            32. “Just a quick 6-month check-in — how’s everything feeling in the new place?”<br>
            33. “One year ago today we closed! Hope you’re loving the home as much as day one.”<br>
            34. “Tax season reminder: If you need your 1098 or final numbers, just let me know.”<br>
            35. “Birthday coming up — hope it’s a great one! The house looks fantastic in your photos.”<br>
            36. “Just checking in on your home anniversary. Any plans to celebrate the new place?”<br>
            37. “Saw rates dipped again. Happy to run a quick listing scenario if you’re even a little curious.”<br>
            38. “Your home value update just came in — equity is up nicely. Want the details?”<br>
            39. “Random thought: If you ever want to chat about future goals (move-up, investment, etc.), I’m here.”<br>
            40. “Extra one: Hope the new roof is holding up after that storm last week!”
          </div>
        </div>

        <div class="mt-4 text-xs text-gray-500">Total: 40+ messages. Personalize with names, neighborhoods, or specific details for best results. Send sparingly and genuinely.</div>
      `, 
      copyText: 'Text Message Swipe File for client nurture' 
    },

    // ============================================================
    // INCREDIBLE-LEVEL DEPTH ADDITIONS — MAKING EVERY PILLAR WORLD-CLASS
    // ============================================================

    // Pop-By Advanced
    { 
      id: 'popby-psychology-timing', 
      pillar: 'pop-bys', 
      type: 'framework', 
      title: 'Pop-By Psychology & Perfect Timing Framework', 
      teaser: 'When, why, and how pop-bys actually create loyalty (the science)', 
      content: `
        <strong>Pop-By Psychology & Timing Framework</strong>
        <p class="mt-3 text-sm">The most effective pop-bys are not random. They trigger specific psychological principles that make you stand out dramatically.</p>

        <div class="mt-5 space-y-5 text-sm">
          <div class="p-4 bg-white dark:bg-gray-900 border-l-4 border-[#00A89D] rounded-r-2xl">
            <strong>Reciprocity Trigger</strong><br>
            Humans are wired to return favors. A thoughtful, unexpected gift creates a powerful (and pleasant) sense of obligation. Use this ethically — give first, ask never (or very softly later).
          </div>
          <div class="p-4 bg-white dark:bg-gray-900 border-l-4 border-[#00A89D] rounded-r-2xl">
            <strong>Peak-End Rule</strong><br>
            People remember the peak and the end of an experience. A great pop-by during a stressful time for the agent (listing launch, busy season) creates a disproportionately positive memory.
          </div>
          <div class="p-4 bg-white dark:bg-gray-900 border-l-4 border-[#00A89D] rounded-r-2xl">
            <strong>Status & Thoughtfulness</strong><br>
            High-quality, useful gifts signal that you respect their time and profession. Cheap logo junk does the opposite.
          </div>
        </div>

        <div class="mt-6 p-5 bg-[#00A89D]/5 rounded-2xl">
          <strong>Perfect Timing Windows:</strong><br>
          • Monday mornings (fresh week energy)<br>
          • Thursday afternoons (end-of-week appreciation)<br>
          • Right after they get a new listing<br>
          • The day after a big closing they referred you<br>
          • Random “just because” 2–3 times per year (these hit hardest)
        </div>
      `, 
      copyText: 'Pop-By Psychology & Timing Framework' 
    },

    { 
      id: 'popby-seasonal-calendar', 
      pillar: 'pop-bys', 
      type: 'framework', 
      title: 'Seasonal & Holiday Pop-By Calendar', 
      teaser: 'What to drop off every month of the year', 
      content: `
        <strong>Seasonal & Holiday Pop-By Calendar — 3 Strong Options Per Month</strong>
        <p class="mt-2 text-sm">Rotate low-cost, mid, and wow within each season. All items are easy to source in bulk on Amazon, Temu, or locally.</p>

        <div class="mt-5 space-y-6 text-sm">
          <div>
            <strong class="text-[#00A89D]">January (New Year / Fresh Start)</strong><br>
            1. “New Year, New Goals” notepad + nice pen ($5–10)<br>
            2. Small 2026 planner or goal-setting notebook ($8–14)<br>
            3. Mini champagne poppers or “POP into the new year” treat ($8–15)
          </div>
          <div>
            <strong class="text-[#00A89D]">February (Valentine / Warmth)</strong><br>
            1. Heart-shaped chocolate or small plant ($6–12)<br>
            2. “You’re the KEY to my success” keychain or mug ($7–13)<br>
            3. Nice candle with “You LIGHT up the market” note ($8–15)
          </div>
          <div>
            <strong class="text-[#00A89D]">March (Spring / Growth)</strong><br>
            1. Spring seeds or small herb garden kit ($6–12)<br>
            2. Nice microfiber cloths + spray “Spring cleaning kit” ($7–13)<br>
            3. “Putting down ROOTS” small plant ($8–14)
          </div>
          <div>
            <strong class="text-[#00A89D]">April (Rain / Practical)</strong><br>
            1. Compact umbrella or rain poncho ($6–12)<br>
            2. “You’re covered rain or shine” small gift set ($8–14)<br>
            3. Car air freshener + “Fresh start this spring” note ($5–10)
          </div>
          <div>
            <strong class="text-[#00A89D]">May (Mother’s Day / Outdoor)</strong><br>
            1. Small flower bouquet or seeds ($6–12)<br>
            2. “Watching your business GROW” plant ($7–13)<br>
            3. Nice sunscreen or outdoor kit ($8–15)
          </div>
          <div>
            <strong class="text-[#00A89D]">June (Summer / BBQ)</strong><br>
            1. Cold brew coffee kit or tumbler listingll ($8–14)<br>
            2. “Ready to FLIP some houses” spatula/BBQ tool ($8–15)<br>
            3. Small portable fan or “Stay cool” kit ($7–13)
          </div>
          <div>
            <strong class="text-[#00A89D]">July (Patriotic / Fun)</strong><br>
            1. Patriotic candy or small cooler item ($6–12)<br>
            2. “You LIGHT the way” small flashlight ($6–12)<br>
            3. Red/white/blue fun treat pack ($7–13)
          </div>
          <div>
            <strong class="text-[#00A89D]">August (Back to School / Busy)</strong><br>
            1. Back-to-school style notebook/pen set ($6–12)<br>
            2. “First 100 days” style small kit for their team ($8–15)<br>
            3. Nice water bottle or “Stay hydrated” kit ($8–14)
          </div>
          <div>
            <strong class="text-[#00A89D]">September (Fall / Planning)</strong><br>
            1. Nice notebook + “Fall planning” sticker ($6–12)<br>
            2. Pumpkin spice item or candle ($7–14)<br>
            3. “You’re the PUMPKIN SPICE of real estate” treat ($7–13)
          </div>
          <div>
            <strong class="text-[#00A89D]">October (Halloween / Festive)</strong><br>
            1. Small pumpkin or fall decor item ($6–12)<br>
            2. “SCRAPING by to say thanks” ice scraper + hand warmers (early winter prep) ($7–13)<br>
            3. Fun Halloween candy pack with clever note ($5–10)
          </div>
          <div>
            <strong class="text-[#00A89D]">November (Gratitude / Thanksgiving)</strong><br>
            1. Gratitude journal or nice candle ($8–15)<br>
            2. Local honey or “You’re the SWEETEST” treat ($8–15)<br>
            3. Small thank-you plant or “Thanks for growing with me” item ($7–14)
          </div>
          <div>
            <strong class="text-[#00A89D]">December (Holiday / Warm)</strong><br>
            1. Premium hot cocoa kit or “WARM wishes” item ($10–18)<br>
            2. “We WHISK you a Merry KISSmas” whisk + kisses ($6–12)<br>
            3. Small Yeti-style tumbler or high-end treat (wow option) ($20–30)
          </div>
        </div>
        <div class="mt-5 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs">Rotate 2–3 core low-cost items + 1–2 premium “wow” moments per year per top partner. Source in bulk once you find winners on Amazon/Temu.</div>
      `, 
      copyText: 'Seasonal & Holiday Pop-By Calendar' 
    },

    // Client Gifts Advanced
    { 
      id: 'gift-cadence-system', 
      pillar: 'gifts', 
      type: 'framework', 
      title: 'Client Gift Cadence & Retention Linking System', 
      teaser: 'When to give what — the full post-closing gift strategy', 
      content: `
        <strong>Client Gift Cadence & Retention Linking System</strong>
        <p class="mt-3">Gifts have the biggest impact when they are part of a deliberate sequence, not one-off thank-yous.</p>

        <div class="mt-5 space-y-4 text-sm">
          <div><strong>Closing Day / Immediate:</strong> High-emotion gift (custom map art, photo frame with first photo, or premium blanket). This is the “peak” moment.</div>
          <div><strong>30-Day Mark:</strong> Practical “new home” item (doormat, welcome mat, small toolkit, or nice candle).</div>
          <div><strong>6-Month Mark:</strong> Useful ongoing item (nice water bottle, plant, or market update + small gift).</div>
          <div><strong>1-Year Anniversary:</strong> The big one — something they will keep forever (throw blanket, custom art, or high-quality item with a handwritten note).</div>
          <div><strong>Future Moves / Refis:</strong> When they come back, a “Welcome Home Again” gift that acknowledges the relationship history.</div>
        </div>

        <div class="mt-6 p-5 bg-[#00A89D]/5 rounded-2xl">
          <strong>Retention Linking Rule:</strong> Every gift should include one soft future anchor (Annual Review invitation, “call me anytime,” or “I’m here for life” language).
        </div>
      `, 
      copyText: 'Client Gift Cadence & Retention Linking System' 
    },

    // Post-Closing Advanced
    { 
      id: 'post-closing-ltv-framework', 
      pillar: 'clients', 
      type: 'framework', 
      title: 'The Lifetime Value & Referral Flywheel Mindset', 
      teaser: 'Why the 7-day system is worth 10x more than you think', 
      content: `
        <strong>The Lifetime Value & Referral Flywheel</strong>
        <p class="mt-3 text-sm">One happy, nurtured client is worth $8,000–$25,000+ in lifetime referrals (depending on your market and average commission per transaction). The 7-day call + ongoing system is the installation of that asset.</p>

        <div class="mt-5 space-y-4 text-sm">
          <div><strong>Direct Value:</strong> Future move-ups, listings, second homes, kids buying, parents downsizing.</div>
          <div><strong>Indirect Value:</strong> Google reviews, social proof, and word-of-mouth that compounds for years.</div>
          <div><strong>The Flywheel Effect:</strong> One great experience → review → 2–3 referrals → those clients get great experiences → more reviews and referrals. One strong 7-day system can create a self-sustaining referral engine.</div>
        </div>

        <div class="mt-6 p-5 bg-teal-50 dark:bg-gray-800 rounded-2xl">
          <strong>Simple Math Most Agents Ignore:</strong><br>
          40 closings/year × 3 referrals per nurtured client over 5 years = 600+ lifetime opportunities. The 7-day system is the cheapest, highest-ROI marketing you will ever run.
        </div>
      `, 
      copyText: 'Lifetime Value & Referral Flywheel Framework' 
    },

    // Cross-Pillar Power Move
    { 
      id: 'referral-flywheel-system', 
      pillar: 'cross', 
      type: 'framework', 
      title: 'The Complete Referral Flywheel System (All 6 Pillars Combined)', 
      teaser: 'How the best agents create predictable referral machines', 
      content: `
        <strong>The Complete Referral Flywheel System</strong>
        <p class="mt-3">This is the meta-system that ties everything together.</p>

        <div class="mt-5 space-y-4 text-sm">
          <div><strong>Stage 1 – Attraction:</strong> Content & Personal Branding (Pillar 5) + strong Email/Text Nurture (Pillar 6) bring new partners and clients in the door.</div>
          <div><strong>Stage 2 – Wow During Process:</strong> Exceptional service + strategic Client Gifts (Pillar 2).</div>
          <div><strong>Stage 3 – Installation:</strong> The 7-Day Post-Closing System + ongoing retention (Pillar 3).</div>
          <div><strong>Stage 4 – Relationship Fuel:</strong> Regular Pop-Bys for partners (Pillar 1) + thoughtful ongoing touches (Pillar 6).</div>
          <div><strong>Stage 5 – Defense:</strong> World-class Objection Handling (Pillar 4) when rates or life create hesitation.</div>
        </div>

        <div class="mt-6 p-5 bg-gradient-to-r from-gray-900 to-black text-white rounded-2xl">
          When all six pillars are running, you stop “chasing” referrals. They start chasing you.
        </div>
      `, 
      copyText: 'The Complete Referral Flywheel System' 
    },

    // ============================================================
    // INCREDIBLE DEPTH — MORE HIGH-VALUE, READY-TO-USE CONTENT
    // ============================================================

    { 
      id: 'objection-full-script-library', 
      pillar: 'objections', 
      type: 'script', 
      title: 'The Complete Objection Script Library (25+ Responses)', 
      teaser: 'The ultimate swipe file for every common pushback', 
      content: `
        <strong>The Complete Objection Script Library — 25+ Ready Responses</strong>
        <p class="mt-3 text-sm">Bookmark this. These are battle-tested, calm, and effective in the current market. Categorized with multiple variations per topic.</p>

        <div class="mt-6 space-y-6 text-sm">
          <div>
            <strong class="text-amber-600">“The Market Is Too Expensive” (6 responses)</strong><br>
            • “I hear you. Let’s look at what you actually need in a home — not what the headlines say — and see if there’s a neighborhood or timing strategy that still works.”<br>
            • “A lot of buyers feel that way until we compare what they’re paying in rent vs. what ownership could look like with the right lender guidance.”<br>
            • “Totally fair. The buyers who are winning right now aren’t chasing perfection — they’re getting clear on must-haves, getting pre-approved, and moving fast when the right home shows up.”<br>
            • “Let’s run a real search with your budget and see what’s actually available today. Sometimes the gap is smaller than it feels from the news.”<br>
            • “If buying isn’t the right move yet, I’d rather tell you that honestly and help you build a plan than push you into the wrong decision.”<br>
            • “Price is one variable. The right home, the right location, and the right timing matter just as much — let’s figure out your version of ‘worth it.’”
          </div>

          <div>
            <strong class="text-amber-600">“We’re Going to Wait” (5 responses)</strong><br>
            • “Totally fair. What would need to change in 6–12 months for waiting to feel like the better call?”<br>
            • “A lot of people wait and then realize they’re still paying rent, still missing the school window, or still outgrowing their space. Let’s make sure waiting is a choice, not a default.”<br>
            • “If you wait, what’s the plan in the meantime — keep renting, renew a lease, or adjust your search criteria?”<br>
            • “I respect the pause. My job is to keep you informed so when you are ready, you’re not starting from zero.”<br>
            • “Sometimes waiting is smart. Sometimes it costs more in rent, competition, and stress. Let’s look at your actual numbers and timeline.”
          </div>

          <div>
            <strong class="text-amber-600">“We Need to Sell First” (4 responses)</strong><br>
            • “That’s very common. Let’s talk through timing — list first, buy first, or bridge options — so you’re not stuck in between.”<br>
            • “We can run a pricing conversation on your current home and a buyer search in parallel so you know what’s realistic before you commit.”<br>
            • “A lot of sellers feel stuck because they haven’t seen the full picture. I’ll walk you through contingencies, showings, and what buyers are doing in this market.”<br>
            • “The goal is one smooth transition, not two stressful moves. Let’s map that out before you decide.”
          </div>

          <div>
            <strong class="text-amber-600">“Your Commission Is Too High” (4 responses)</strong><br>
            • “I appreciate you asking directly. Let’s talk about what’s included in my service — marketing, negotiation, transaction management, and the hours that protect your net.”<br>
            • “The number that matters most is what you walk away with, not the line item on the settlement sheet. I’m happy to show you how I protect that.”<br>
            • “I don’t compete on being the cheapest. I compete on getting you the best outcome with fewer surprises.”<br>
            • “If budget is the concern, let’s look at the full plan and see where the real value is — sometimes a lower fee costs more in the end.”
          </div>

          <div>
            <strong class="text-amber-600">“I Already Have an Agent” (4 responses)</strong><br>
            • “I respect that completely. If anything changes or you want a second opinion on strategy, I’m here.”<br>
            • “Loyalty matters. I’m not here to badmouth anyone — just to be a resource if you ever need one.”<br>
            • “Totally understand. Most of my business comes from people who felt taken care of long before they needed to buy or sell again.”<br>
            • “If your current agent is doing a great job, stick with them. I’d rather earn a future relationship than pressure a present one.”
          </div>

          <div>
            <strong class="text-amber-600">AI-Era / Zillow Objections (3+ responses)</strong><br>
            • “Zestimates and online tools are useful starting points, but they don’t know the condition, upgrades, or micro-market factors that change price by tens of thousands.”<br>
            • “ChatGPT can give you a rough framework, but it can’t walk through a home, read the competition, or negotiate the inspection. That’s where local expertise matters.”<br>
            • “I’m not against doing your own research — I encourage it. My job is to help you interpret what the data actually means for your decision.”
          </div>

          <div>
            <strong class="text-amber-600">Sphere / Past Client “Not Right Now” (3 responses)</strong><br>
            • “No pressure at all — I just wanted you to know I’m here if the conversation ever becomes real for you or someone you know.”<br>
            • “Totally fair. Can I check back in a few months, or would you rather I wait until you reach out?”<br>
            • “Either way, I appreciate you. Referrals are the highest compliment in this business — even a ‘not yet’ helps me stay top of mind the right way.”
          </div>
        </div>

        <div class="mt-6 text-xs text-gray-500">Pro tip: The best responses are delivered slowly, with genuine curiosity, not as a rebuttal. Total: well over 25 variations above.</div>
      `, 
      copyText: 'Complete Objection Script Library (25+ responses)' 
    },

    { 
      id: 'content-script-examples', 
      pillar: 'content', 
      type: 'script', 
      title: '60-Second Script Examples by Content Pillar', 
      teaser: 'Actual ready-to-film scripts for the 6 pillars', 
      content: `
        <strong>60-Second Reel / Short Script Examples by Pillar</strong>

        <div class="mt-5 space-y-6 text-sm">
          <div>
            <strong class="text-purple-600">Pillar 1 — Local Market</strong><br>
            “In [neighborhood] right now, the average home is spending only 11 days on market — that’s down from 19 last month. If you’ve been thinking about selling, this is the kind of environment where well-priced homes are moving fast. Want the full breakdown for your street? DM me.”
          </div>

          <div>
            <strong class="text-purple-600">Pillar 2 — First-Time Buyer Education</strong><br>
            “You do NOT need 20% down. In fact, right now I’m helping buyers get into homes with as little as 3% — and in some cases even 0% with the right programs. The biggest myth keeping people renting is this idea that they need a huge down payment. Let’s break the math on a $350k home.”
          </div>

          <div>
            <strong class="text-purple-600">Pillar 3 — Rate Reality</strong><br>
            “6.8% feels scary until you realize that waiting for 5% could easily cost you $50,000+ in higher home prices. I’m not saying buy today no matter what — I’m saying let’s run your actual numbers both ways before you make a decision based on headlines.”
          </div>

          <div>
            <strong class="text-purple-600">Pillar 4 — Client Wins</strong><br>
            “This couple came to me with a 612 credit score and thought they had no shot. 47 days later they closed on their first home with the right lender partner and offer structure. Stories like this are why I do what I do. If you’re on the fence, reach out.”
          </div>
        </div>
      `, 
      copyText: '60-Second Script Examples by the 6 Content Pillars' 
    },

    { 
      id: 'popby-what-to-say', 
      pillar: 'pop-bys', 
      type: 'script', 
      title: 'What to Actually Say When Dropping Off a Pop-By', 
      teaser: 'Exact 20-45 second scripts for every situation', 
      content: `
        <strong>Exact Scripts for Pop-By Drop-Offs (20–45 seconds)</strong>

        <div class="mt-5 space-y-5 text-sm">
          <div>
            <strong>Standard Drop (No Prior Relationship):</strong><br>
            “Hey [Name], I’m [Your Name] with [Company]. I know you’re busy — I just wanted to drop this off and say thanks for everything you do for the community. No strings attached. Hope it makes your week a little better. My card’s inside if you ever need anything.”
          </div>

          <div>
            <strong>After They Referred You:</strong><br>
            “I just wanted to personally thank you for sending [Client Name] my way. That meant a lot. I dropped off a little something to show my appreciation — no big deal, just wanted you to know I noticed.”
          </div>

          <div>
            <strong>Busy Season / High Stress Time:</strong><br>
            “I know it’s crazy right now with listings. I won’t keep you — just wanted to leave this for you and your team. You guys are killing it. Let me know if there’s any co-broke file I can make smoother for you.”
          </div>

          <div>
            <strong>Long-Term Partner (Keep It Light):</strong><br>
            “Just swinging by to say hi and drop this off. How’s your summer going? Any fun trips planned? I’m around if you need anything at all.”
          </div>
        </div>

        <div class="mt-5 p-4 bg-[#00A89D]/5 rounded-2xl text-xs">
          <strong>Golden Rule:</strong> Keep it under 45 seconds. Smile. Make eye contact. Leave before it gets awkward. The gift does the heavy lifting.
        </div>
      `, 
      copyText: 'Exact scripts for pop-by drop-offs' 
    },

    { 
      id: 'nurture-90day-drip', 
      pillar: 'nurture', 
      type: 'framework', 
      title: 'Full 90-Day New Client Nurture Drip Sequence', 
      teaser: 'Complete email + text sequence for the first 3 months', 
      content: `
        <strong>Complete 90-Day New Client Nurture Drip</strong>
        <div class="mt-3 p-4 bg-blue-50 dark:bg-gray-800 rounded-2xl">
          <strong class="text-blue-600">Why This Works:</strong> Structured touches in the first 90 days turn one-time clients into raving fans who refer for life. Personalize every one.
        </div>

        <p class="mt-3 text-sm">Copy this sequence and plug it into your CRM. Mix in personal notes when possible.</p>

        <div class="mt-5 space-y-6 text-sm">
          <div class="p-3 border rounded-xl" data-copy-text="Hey [Name], just checking in — how’s the new place feeling? Any questions about the first payment or anything else? I’m here.">
            <div class="flex justify-between"><strong>Day 3 (Text) — Send 2-3 days after closing</strong>
              <button onclick="window.copyModalSection(this)" class="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Copy</button>
            </div>
            “Hey [Name], just checking in — how’s the new place feeling? Any questions about the first payment or anything else? I’m here.”
          </div>

          <div class="p-3 border rounded-xl" data-copy-text="Hi [First Name],\n\nHope the first couple weeks in the new home have been smooth. If any questions about taxes, insurance, or maintenance pop up, I’m still your person — no expiration date on that.\n\nWarmly,\n[Your Name]">
            <div class="flex justify-between"><strong>Day 10 (Email)</strong>
              <button onclick="window.copyModalSection(this)" class="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Copy</button>
            </div>
            Short “How’s everything going?” + offer of help + soft review ask if the experience was great.
          </div>

          <div class="p-3 border rounded-xl" data-copy-text="Hey [Name] — quick one. Any chance you’ve told anyone you know about the experience of working with me? I’m trying to help a few more families this month and your referral would mean a lot.">
            <div class="flex justify-between"><strong>Day 60 (Light Text)</strong>
              <button onclick="window.copyModalSection(this)" class="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Copy</button>
            </div>
            “Quick one — if you ever talk to friends or family about buying or selling, I’d love to help them the same way I helped you.”
          </div>

          <div class="p-3 border rounded-xl" data-copy-text="Hi [First Name],\n\nThree months in — hope the house is starting to feel like home. Here’s a small resource that might be useful as you settle in [link or item].\n\nI’d love to do a quick 15-minute “home equity and market check-in” around your one-year anniversary. I’ll reach out then.\n\nWarmly,\n[Your Name]">
            <div class="flex justify-between"><strong>Day 90 (Email + Small Gift if possible)</strong>
              <button onclick="window.copyModalSection(this)" class="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Copy</button>
            </div>
            “Three months in — hope the house is starting to feel like home.” Include a small useful item or strong resource + Annual Review seed.
          </div>
        </div>
      `, 
      copyText: 'Full 90-Day New Client Nurture Drip Sequence' 
    },

    { 
      id: 'top-producer-habits', 
      pillar: 'cross', 
      type: 'framework', 
      title: 'Top 1% Agent Weekly Habits (All 6 Pillars)', 
      teaser: 'What the highest producers actually do every week', 
      content: `
        <strong>Top 1% Agent Weekly Habits — The Real Operating System</strong>

        <div class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
          <div>
            <strong>Every Monday:</strong><br>
            • Pull list of clients with birthdays/anniversaries in next 7 days<br>
            • Film 2-3 Reels for the week (batch)<br>
            • Send 3-5 value touches to top partners
          </div>
          <div>
            <strong>Every Thursday:</strong><br>
            • Run your 7-day post-closing calls (Power Hour)<br>
            • Drop 2-3 strategic pop-bys<br>
            • Review referral sources from the last 30 days
          </div>
          <div>
            <strong>Monthly:</strong><br>
            • Send one high-quality client gift<br>
            • Run 4-6 Annual Home & Equity Review calls<br>
            • Review content performance and double down on winners
          </div>
          <div>
            <strong>Quarterly:</strong><br>
            • Deep review of your top 20 referral partners<br>
            • Plan next quarter’s content themes<br>
            • Personal handwritten notes to biggest referrers
          </div>
        </div>

        <div class="mt-6 p-5 bg-black text-white rounded-2xl text-sm">
          The difference between good and great is rarely talent. It’s consistent execution of simple systems across all six pillars.
        </div>
      `, 
      copyText: 'Top 1% Agent Weekly Habits across all pillars' 
    },

    // ============================================================
    // NEXT LOGICAL STEP: BALANCE & DEEPEN PILLARS 1-3 WITH SPECTACULAR CONTENT
    // ============================================================

    // Pillar 1 - Pop-By Scripts & Notes
    { 
      id: 'popby-note-templates', 
      pillar: 'pop-bys', 
      type: 'script', 
      title: 'Pop-By Note Templates – 12 Ready-to-Use Messages', 
      teaser: 'Beautiful, non-salesy handwritten note examples for every occasion', 
      content: `
        <strong>Pop-By Note Templates (Handwritten Gold)</strong>
        <p class="mt-3 text-sm">These are short, warm, and memorable. Write them by hand on nice cards. The personal touch is everything.</p>

        <div class="mt-5 space-y-5 text-sm">
          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <strong>Standard Thank You:</strong><br>
            “[Name],<br><br>
            Just wanted to drop this off and say thank you for all the great work you do. You make buying and selling homes look easy. Hope this brightens your day.<br><br>
            Grateful to know you,<br>
            [Your Name]”
          </div>

          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <strong>After a Referral:</strong><br>
            “[Name],<br><br>
            Thank you for trusting me with [Client]. It means the world. I wanted you to know I took great care of them. Here’s a little something for you — enjoy!<br><br>
            Talk soon,<br>
            [Your Name]”
          </div>

          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <strong>Busy Season Support:</strong><br>
            “[Name],<br><br>
            I know it’s insane right now. Just dropping this off as a small “you’re crushing it” gift. You’re doing amazing work. Let me know if I can ever help lighten the load on a tough file or co-broke deal.<br><br>
            [Your Name]”
          </div>

          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <strong>Long-Term Partner:</strong><br>
            “[Name],<br><br>
            Just swinging by to say hi. Hope this small gift makes your week better. Appreciate the partnership more than you know.<br><br>
            [Your Name]”
          </div>

          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <strong>Client Win Celebration:</strong><br>
            “[Name],<br><br>
            Congrats on helping [Client] close! I wanted to celebrate your win with this. You’re the best.<br><br>
            [Your Name]”
          </div>

          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <strong>Just Because / Random:</strong><br>
            “[Name],<br><br>
            No reason — just thinking about how lucky I am to work with agents like you. Enjoy this!<br><br>
            [Your Name]”
          </div>

          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <strong>Market Update Drop:</strong><br>
            “[Name],<br><br>
            Dropped off a quick local market snapshot + this small treat. Thought it might be useful for your sphere.<br><br>
            [Your Name]”
          </div>

          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <strong>After Tough Week:</strong><br>
            “[Name],<br><br>
            I know this week was crazy. Just a small pick-me-up to say you’re appreciated.<br><br>
            [Your Name]”
          </div>

          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <strong>Seasonal / Holiday:</strong><br>
            “[Name],<br><br>
            Happy [holiday]! Hope this small gift adds a little joy to your season.<br><br>
            [Your Name]”
          </div>

          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <strong>New Agent Support:</strong><br>
            “[Name],<br><br>
            Congrats on the new chapter. Dropped off a few things to help you crush your first 100 days.<br><br>
            [Your Name]”
          </div>

          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <strong>Referral Thank You:</strong><br>
            “[Name],<br><br>
            Just closed on [Client] thanks to you. Here’s a small token of my appreciation — you’re the best.<br><br>
            [Your Name]”
          </div>

          <div class="p-4 bg-white dark:bg-gray-900 border rounded-2xl">
            <strong>Quarterly Touch:</strong><br>
            “[Name],<br><br>
            Just a quarterly thank you for the partnership. Hope this helps make your week a little brighter.<br><br>
            [Your Name]”
          </div>
        </div>
      `, 
      copyText: 'Pop-By handwritten note templates (12 examples)' 
    },

    { 
      id: 'popby-full-script-pack', 
      pillar: 'pop-bys', 
      type: 'script', 
      title: 'Pop-By Delivery Script Pack (What to Say + Follow Up)', 
      teaser: 'Complete scripts for the drop + same-day text + 1-week follow up', 
      content: `
        <strong>Complete Pop-By Delivery Script Pack</strong>

        <div class="mt-5 space-y-6 text-sm">
          <div>
            <strong>1. The Drop-Off (15-30 seconds)</strong><br>
            Use the ones from the “What to Actually Say” framework. Keep it light, smile, and exit gracefully.
          </div>
          <div>
            <strong>2. Same-Day Text (Send 2-4 hours later)</strong><br>
            “Hey [Name], just wanted to say thanks again for the quick chat earlier. Hope you enjoyed the [gift]. No need to reply — just wanted you to know I appreciate you.”
          </div>
          <div>
            <strong>3. 1-Week Value Follow-Up Text</strong><br>
            “Hey [Name] — hope your week is going well. I put together a quick one-pager on what’s happening with rates and inventory in [specific neighborhood they work in]. Happy to email it over if it’s useful. No strings.”
          </div>
          <div>
            <strong>4. 30-Day Light Touch</strong><br>
            “Random thought — if you ever have a client who’s nervous about financing or wants a second opinion, I’m always happy to be a resource. Appreciate the partnership!”
          </div>
        </div>
      `, 
      copyText: 'Full Pop-By delivery + follow-up script pack' 
    },

    // Pillar 2 - Gift Polish
    { 
      id: 'gift-note-examples', 
      pillar: 'gifts', 
      type: 'script', 
      title: 'Client Gift Handwritten Note Examples (Emotional & Personal)', 
      teaser: 'The exact words that make gifts 10x more powerful', 
      content: `
        <strong>Client Gift Note Examples That Hit Different</strong>
        <p class="mt-3 text-sm">The gift is 50%. The note is the other 50%. Make it personal. Reference something they said during the process.</p>

        <div class="mt-5 space-y-5 text-sm">
          <div class="p-4 bg-white dark:bg-gray-900 border-l-4 border-[#00A89D] rounded-r-2xl">
            <strong>Closing Day Gift:</strong><br>
            “[First Name],<br><br>
            I still remember you saying how much you loved the big windows in the living room. I hope this [gift] helps you enjoy that view for years. Thank you for letting me be part of this chapter. You’ve got a beautiful home — and an even better story.<br><br>
            Welcome home,<br>
            [Your Name]”
          </div>

          <div class="p-4 bg-white dark:bg-gray-900 border-l-4 border-[#00A89D] rounded-r-2xl">
            <strong>1-Year Anniversary Gift:</strong><br>
            “[First Name],<br><br>
            One year ago today we made this house yours. I hope it’s been everything you dreamed and more. Here’s a little something to celebrate the memories you’ve already made — and the ones still to come. You know where I am if you ever need anything at all.<br><br>
            With gratitude,<br>
            [Your Name]”
          </div>
        </div>
      `, 
      copyText: 'Powerful client gift note examples' 
    },

    // Pillar 3 - More Post-Closing Depth
    { 
      id: 'post-closing-full-scripts', 
      pillar: 'clients', 
      type: 'script', 
      title: 'Full 7-Day Call Scripts – Education + Feedback + Ask Sections', 
      teaser: 'Word-for-word scripts for the entire conversation', 
      content: `
        <strong>Complete 7-Day Post-Closing Call Scripts</strong>

        <div class="mt-5 space-y-6 text-sm">
          <div>
            <strong>Opening (Build Rapport + Permission)</strong><br>
            “Hi [Name], it’s [Your Name] from [Company]. I’m just calling to check in on how the first week in the new house is going. Do you have 3-4 minutes? I promise I won’t keep you long.”
          </div>

          <div>
            <strong>Education Section (The Value)</strong><br>
            “A couple quick things most people run into in the first month…<br>
            1. File your homestead exemption if you haven’t — it can save real money on property taxes.<br>
            2. Update your address with USPS, banks, and insurance.<br>
            3. You might start getting investor and solicitor mail — forward anything that looks sketchy and I’ll tell you if it’s worth a look.<br>
            4. I’ll be sending you a monthly home value update through HomeBot so you can see your equity growing.”
          </div>

          <div>
            <strong>Feedback Section</strong><br>
            “Before I let you go — how did we do overall? Is there anything we could have done better? Your honest feedback helps me improve for the next family.”
          </div>

          <div>
            <strong>The Ask (Reviews + Referrals + Anchor)</strong><br>
            “If you’re happy with how everything went, I’d be incredibly grateful for a quick Google review. Here’s the link [send in text after].<br>
            And when friends or coworkers mention they’re thinking about buying or selling, would you be comfortable mentioning my name?<br>
            Last thing — I’d love to do a quick 15-minute ‘home equity and market check-in’ around your one-year anniversary. I’ll reach out then. Sound good?”
          </div>
        </div>
      `, 
      copyText: 'Full word-for-word 7-Day Call scripts' 
    },

    { 
      id: 'post-closing-checklist', 
      pillar: 'clients', 
      type: 'checklist', 
      title: 'Ultimate Post-Closing Retention Checklist (7-Day + 90-Day + Annual)', 
      teaser: 'The complete system checklist you can follow every week', 
      content: `
        <strong>Ultimate Post-Closing Retention Checklist</strong>

        <div class="mt-5 text-sm">
          <strong>Weekly Power Hour (Thursdays recommended)</strong><br>
          ☐ Pull list of clients who closed 7 days ago<br>
          ☐ Block 60-90 minutes<br>
          ☐ Complete full 7-day calls using the script + checklist<br>
          ☐ Log everything in CRM<br>
          ☐ Send follow-up text same day<br><br>

          <strong>30 / 60 / 90 Day Follow-Ups</strong><br>
          ☐ Day 30: Call or detailed text<br>
          ☐ Day 60: Light value touch + referral ask<br>
          ☐ Day 90: Email + small gift or strong resource + Annual Review seed<br><br>

          <strong>Ongoing Engine</strong><br>
          ☐ Every Monday: Pull birthday + anniversary list for the week<br>
          ☐ Call or text every client on that list<br>
          ☐ Quarterly: Review top 10 referrers and send personal note + small gift<br>
          ☐ Annually: Send Annual Home & Equity Review invitation around closing anniversary
        </div>
      `, 
      copyText: 'Complete Post-Closing Retention Checklist' 
    },

    // Spectacular Unifying Addition
    { 
      id: 'value-vault-30day-activation', 
      pillar: 'cross', 
      type: 'framework', 
      title: 'The Value Vault 30-Day Activation Plan (All 6 Pillars)', 
      teaser: 'A complete 30-day plan to install the entire system', 
      content: `
        <strong>The Value Vault 30-Day Activation Plan</strong>
        <p class="mt-3">Follow this and you will have the foundation of a referral-dominant business installed in one month.</p>

        <div class="mt-5 space-y-6 text-sm">
          <div>
            <strong>Days 1-7: Foundation (Pillar 5 + 6)</strong><br>
            • Film and post 4 Reels using the 6 Pillars + hook formulas<br>
            • Set up your basic nurture sequences (post-closing + partner weekly value)<br>
            • Send your first 5 partner value emails
          </div>

          <div>
            <strong>Days 8-14: Relationship Fuel (Pillar 1 + 2)</strong><br>
            • Identify your top 10 partners<br>
            • Do 5 strategic pop-bys with great notes<br>
            • Send 3 high-quality client gifts (use the cadence system)
          </div>

          <div>
            <strong>Days 15-21: Installation (Pillar 3)</strong><br>
            • Run your first full 7-Day Power Hour on all recent closings<br>
            • Start the birthday/anniversary system<br>
            • Book 3 Annual Home & Equity Review calls with past clients
          </div>

          <div>
            <strong>Days 22-30: Defense + Scale (Pillar 4 + Review)</strong><br>
            • Practice the top 5 objections out loud twice<br>
            • Review what worked in content and double down<br>
            • Create your personal 90-day plan using the habits framework
          </div>
        </div>

        <div class="mt-6 p-5 bg-gradient-to-r from-[#00A89D] to-teal-600 text-white rounded-2xl">
          Do this once. Then repeat the cycle every 90 days. This is how you build an unstoppable referral machine.
        </div>
      `, 
      copyText: 'Value Vault 30-Day Activation Plan (all 6 pillars)' 
    },

    // New: Partner Business Objections (aligns with value-first, pop-by, giftology philosophies)
    { 
      id: 'objection-gain-partner-business', 
      pillar: 'objections', 
      type: 'script', 
      title: 'Earning Referrals from Lenders & Professional Partners', 
      teaser: 'Value-first responses to “too busy”, “I already have agents I work with”, and other partner pushbacks', 
      content: `
        <strong>Earning Referrals from Lenders &amp; Professional Partners</strong>
        <p class="mt-3 text-sm">Value-first scripts for lenders, title reps, builders, and fellow agents. Give first, prove it on one file, earn a spot on their bench — never pushy.</p>
        <p class="mt-2 text-sm text-gray-500">Open this card for the full rich modal with copy/save buttons.</p>
      `, 
      copyText: 'Partner referral objection scripts — value-first approach' 
    }
  ];

  // Make the data globally available for other modules (Idea of the Day, etc.)
  window.VALUE_VAULT_ITEMS = VALUE_VAULT_ITEMS;

  // Pop-By filter state (simple module-level for now)
  let currentPopByFilter = 'All';
  let currentCostFilter = 'All';

  const POPBY_CATEGORIES = [
    'All',
    'Year-Round Favorites',
    'Seasonal & Holiday',
    'Themed / Higher-Impact',
    'Everyday Creative',
    'Agent & Professional Tools',
    'Premium & Wow'
  ];

  const COST_TIERS = ['All', 'Under $10', '$10–20', '$20+'];

  function getPopByCategory(item) {
    const tags = item.tags || [];
    if (tags.includes('premium') || tags.includes('wow')) return 'Premium & Wow';
    if (tags.includes('themed') || tags.includes('higher-impact')) return 'Themed / Higher-Impact';
    if (tags.includes('realtor') || tags.includes('professional') || tags.includes('content')) return 'Agent & Professional Tools';
    if (tags.includes('creative') || tags.includes('everyday')) return 'Everyday Creative';
    if (tags.includes('seasonal')) return 'Seasonal & Holiday';
    if (tags.includes('year-round') || tags.includes('fun') || tags.includes('local') || tags.includes('practical')) return 'Year-Round Favorites';
    return 'Year-Round Favorites';
  }

  function getCostTier(item) {
    if (!item.cost) return 'All';
    const costStr = item.cost.toLowerCase();
    // Extract first number
    const match = costStr.match(/\$?(\d+)/);
    if (!match) return 'All';
    const price = parseInt(match[1], 10);

    if (price < 10) return 'Under $10';
    if (price <= 20) return '$10–20';
    return '$20+';
  }

  window.renderValueVault = function() {
    const container = document.getElementById('value-vault-grid');
    if (!container) return;

    const popbyItems = VALUE_VAULT_ITEMS.filter(i => i.type === 'pop-by');
    let filtered = currentPopByFilter === 'All' 
      ? popbyItems 
      : popbyItems.filter(item => getPopByCategory(item) === currentPopByFilter);

    if (currentCostFilter !== 'All') {
      filtered = filtered.filter(item => getCostTier(item) === currentCostFilter);
    }

    const categoryChipsHtml = POPBY_CATEGORIES.map(cat => {
      const isActive = currentPopByFilter === cat;
      return `<button 
        class="px-3 py-1.5 text-xs font-medium rounded-full border transition whitespace-nowrap ${isActive ? 'bg-[#00A89D] text-white border-[#00A89D] shadow-sm' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}"
        data-filter-type="category" data-filter="${cat}">
        ${cat}
      </button>`;
    }).join('');

    const costChipsHtml = COST_TIERS.map(tier => {
      const isActive = currentCostFilter === tier;
      return `<button 
        class="px-3 py-1.5 text-xs font-medium rounded-full border transition whitespace-nowrap ${isActive ? 'bg-[#00A89D] text-white border-[#00A89D] shadow-sm' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}"
        data-filter-type="cost" data-filter="${tier}">
        ${tier}
      </button>`;
    }).join('');

    container.innerHTML = `
      <div class="mb-4">
        <div class="mb-2">
          <div class="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 px-1">Category</div>
          <div class="flex flex-wrap gap-2" id="popby-category-chips">
            ${categoryChipsHtml}
          </div>
        </div>
        <div class="mb-3">
          <div class="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 px-1">Cost Tier</div>
          <div class="flex flex-wrap gap-2" id="popby-cost-chips">
            ${costChipsHtml}
          </div>
        </div>
        <button onclick="window.surprisePopBy()" 
                class="text-xs px-4 py-1.5 bg-gradient-to-r from-[#00A89D] to-[#00A89D] text-white rounded-full font-semibold flex items-center gap-2 shadow-sm">
          <i class="fas fa-dice"></i>
          <span>Surprise Me – Random Pop-By Idea</span>
        </button>
      </div>

      <div id="popby-cards" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        ${filtered.map(item => {
          const tagPills = (item.tags || []).slice(0, 3).map(t => 
            `<span class="px-1.5 py-0.5 text-[9px] rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">${t}</span>`
          ).join('');
          return `
          <div class="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-[#00A89D] rounded-2xl p-3 transition-all hover:shadow-lg flex flex-col text-sm popby-card" data-id="${item.id}">
            <div class="flex-1">
              <div class="flex items-start justify-between gap-2 mb-1.5">
                <div class="font-semibold leading-tight pr-1 text-[13px] group-hover:text-[#00A89D]">${item.title}</div>
                ${item.cost ? `<div class="text-[10px] font-semibold text-[#00A89D] flex-shrink-0 whitespace-nowrap mt-0.5">${item.cost}</div>` : ''}
              </div>
              <div class="text-gray-600 dark:text-gray-400 text-xs line-clamp-2 mb-2">${item.teaser}</div>
              ${tagPills ? `<div class="flex flex-wrap gap-1">${tagPills}</div>` : ''}
            </div>

            <div class="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button class="popby-copy-btn flex-1 text-[10px] py-1 px-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-[#00A89D] hover:text-white flex items-center justify-center gap-1 transition" title="Copy note">
                <i class="fas fa-copy"></i> <span class="hidden sm:inline">Copy</span>
              </button>
              <button class="popby-save-btn flex-1 text-[10px] py-1 px-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-[#00A89D] hover:text-white flex items-center justify-center gap-1 transition" title="Save to My Resources">
                <i class="far fa-heart"></i> <span class="hidden sm:inline">Save</span>
              </button>
              <button class="popby-details-btn flex-1 text-[10px] py-1 px-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center gap-1 transition font-medium">
                Details
              </button>
            </div>
          </div>`;
        }).join('')}
      </div>

      <div class="mt-3 text-[10px] text-gray-500">Showing ${filtered.length} ideas. Filters + Surprise Me make it easy to explore without scrolling forever. All original ideas are in the modals.</div>
    `;

    // Attach clean event listeners (fixes the JS code leak in the cards)
    attachPopByListeners(container);
  };

  function attachPopByListeners(container) {
    // Category filter chips
    container.querySelectorAll('#popby-category-chips button').forEach(btn => {
      btn.onclick = null;
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        currentPopByFilter = btn.dataset.filter || 'All';
        window.renderValueVault();
      });
    });

    // Cost tier filter chips
    container.querySelectorAll('#popby-cost-chips button').forEach(btn => {
      btn.onclick = null;
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        currentCostFilter = btn.dataset.filter || 'All';
        window.renderValueVault();
      });
    });

    // Card buttons via delegation (Copy / Save / Details)
    const cardsArea = container.querySelector('#popby-cards');
    if (cardsArea) {
      cardsArea.onclick = (e) => {
        const card = e.target.closest('.popby-card');
        if (!card) return;
        const id = card.dataset.id;
        if (!id) return;

        if (e.target.closest('.popby-copy-btn')) {
          e.stopImmediatePropagation();
          const item = VALUE_VAULT_ITEMS.find(i => i.id === id);
          if (!item) return;
          const text = item.copyText || item.title || '';
          navigator.clipboard.writeText(text).then(() => {
            const btn = e.target.closest('.popby-copy-btn');
            if (!btn) return;
            const orig = btn.innerHTML;
            btn.innerHTML = '✓ Copied';
            setTimeout(() => { if (btn) btn.innerHTML = orig; }, 1400);
          }).catch(() => {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          });
        }

        if (e.target.closest('.popby-save-btn')) {
          e.stopImmediatePropagation();
          saveVaultItem(id, e.target.closest('.popby-save-btn'));
        }

        if (e.target.closest('.popby-details-btn')) {
          e.stopImmediatePropagation();
          showVaultItemModal(id);
        }
      };
    }

    // Note: Surprise Me uses the inline onclick="window.surprisePopBy()" in the template (reliable across re-renders)
  }

  window.setPopByFilter = function(category, clickedBtn) {
    currentPopByFilter = category;
    window.renderValueVault();
  };

  window.surprisePopBy = function() {
    const popbys = VALUE_VAULT_ITEMS.filter(i => i.type === 'pop-by');
    if (!popbys.length) return;
    const random = popbys[Math.floor(Math.random() * popbys.length)];
    showVaultItemModal(random.id);
  };

  // Backup click wiring for the 8 static "Follow-Up Scripts" + partner tool cards in Pillar 1
  // (defensive — the inline onclick= attributes should work, but this guarantees the buttons always fire)
  function attachPillar1CardListeners() {
    // No longer needed for removed follow-up/co-branded cards.
    // Pillar 1 is now strictly Pop-By focused. The renderValueVault() call handles the dynamic library grid.
    const pillar = document.getElementById('value-vault-pillar-1');
    if (!pillar) return;
    // Future: attach any pop-by-specific static card listeners here if added.
  }

  // Value Vault pillar toggle: canonical implementation in js/features/value-vault.js

  window.togglePopByLibrary = function(headerElement) {
    const content = document.getElementById('popby-library-content');
    if (!content) return;

    const arrow = headerElement.querySelector('.text-xl, .text-2xl');
    
    if (content.classList.contains('hidden')) {
      content.classList.remove('hidden');
      if (arrow) arrow.style.transform = 'rotate(180deg)';
      
      // Render the Pop-By grid when expanded
      if (typeof window.renderValueVault === 'function') {
        setTimeout(() => {
          window.renderValueVault();
        }, 30);
      }
    } else {
      content.classList.add('hidden');
      if (arrow) arrow.style.transform = '';
    }
  };

  window.showVaultItemModal = function(id) {
    try {
      // Always start from a clean slate (prevents other modals or stale state from blocking)
      if (typeof closeAllModals === 'function') {
        closeAllModals();
      }

      const item = VALUE_VAULT_ITEMS.find(i => i.id === id);

      let modal = document.getElementById('detail-modal');

      // Defensive recreation if the modal shell was removed or corrupted by other flows
      if (!modal || !document.getElementById('detail-modal-title') || !document.getElementById('detail-modal-content')) {
        if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
        modal = document.createElement('div');
        modal.id = 'detail-modal';
        modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]';
        modal.innerHTML = `
          <div class="bg-white dark:bg-gray-900 rounded-3xl max-w-4xl w-full mx-4 max-h-[92vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700" onclick="event.stopImmediatePropagation()">
            <div class="px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#00A89D]/5 via-white to-white dark:via-gray-800 dark:to-gray-800 flex justify-between items-center">
              <div>
                <div class="text-[10px] font-bold tracking-[1.5px] text-[#00A89D] uppercase mb-0.5">Database Nurturing • Life Events • Scaling</div>
                <h3 id="detail-modal-title" class="text-2xl md:text-3xl font-bold text-[#002B5C] dark:text-white"></h3>
              </div>
              <button onclick="closeDetailModal()" class="text-4xl leading-none text-gray-400 hover:text-red-500 transition">×</button>
            </div>
            <div id="detail-modal-content" class="p-6 md:p-8 overflow-y-auto max-h-[68vh] text-[15px] leading-relaxed text-gray-700 dark:text-gray-300"></div>
            <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between text-xs">
              <div class="text-gray-500">Use Copy &amp; Save buttons liberally</div>
              <button onclick="closeDetailModal()" class="px-5 py-2 rounded-2xl border text-sm font-medium hover:bg-white dark:hover:bg-gray-800">Close Guide</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        modal.style.zIndex = '9999';
      }

      const titleEl = document.getElementById('detail-modal-title');
      const contentEl = document.getElementById('detail-modal-content');
      if (!titleEl || !contentEl) {
        console.error('[showVaultItemModal] Modal children still missing after defensive creation');
        return;
      }

      if (!item) {
        titleEl.textContent = "Content Coming Soon";
        contentEl.innerHTML = `
          <p>This specific item is still being migrated into the new modern format.</p>
          <p class="mt-4 text-sm text-gray-600">All original content from the Value Vault is being preserved. We're moving quickly to get every script, idea, and framework into rich modals like this one.</p>
          <div class="mt-6 text-xs text-gray-500">If you need this content urgently, let us know and we'll prioritize it.</div>
        `;
      } else {
        titleEl.textContent = item.title;

        let richHandled = false;
        if (typeof window.renderRichVaultModal === 'function' && window.renderRichVaultModal(item, contentEl, modal)) {
          richHandled = true;
        }

        if (!richHandled) {
        // Special rich rendering for Pop-By items (more visually appealing + valuable)
        if (item.type === 'pop-by') {
          const tagsHtml = (item.tags || []).map(t => 
            `<span class="px-2.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">${t}</span>`
          ).join(' ');

          contentEl.innerHTML = `
            <div class="mb-5">
              <div class="flex items-center gap-2 mb-3">
                <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">POP-BY</span>
                ${item.cost ? `<span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">${item.cost}</span>` : ''}
              </div>
              ${item.teaser ? `<div class="text-lg font-medium italic text-gray-700 dark:text-gray-300 mb-4">“${item.teaser}”</div>` : ''}
              ${tagsHtml ? `<div class="flex flex-wrap gap-1.5 mb-4">${tagsHtml}</div>` : ''}
            </div>

            <div class="prose prose-sm dark:prose-invert max-w-none">
              ${item.content || '<p>Full details coming soon.</p>'}
            </div>

            <div class="mt-6 border-t pt-4">
              <div class="text-xs uppercase tracking-wider text-gray-500 mb-2">Recommended Next Step</div>
              <div class="text-sm text-gray-600 dark:text-gray-300">Follow up within 48 hours with a short text referencing the specific gift. Example: “Hope the [item] is useful! Let me know if you have any buyers who need a strong agent in [area] this week.”</div>
            </div>

            <div class="mt-6 flex flex-wrap gap-3">
              <button data-vault-copy-btn
                      class="px-5 py-2 bg-[#00A89D] text-white rounded-2xl text-sm font-semibold flex items-center gap-2 hover:opacity-90">
                <i class="fas fa-copy"></i> Copy Note + Script
              </button>
              <button data-vault-save-btn
                      class="px-5 py-2 border border-[#00A89D] text-[#00A89D] rounded-2xl text-sm font-semibold flex items-center gap-2 hover:bg-[#00A89D]/5">
                <i class="fas fa-bookmark"></i> Save to My Resources
              </button>
            </div>
          `;
        } else if (item.type === 'gift' || item.id?.startsWith('gift') || item.id === 'giftology-mindset') {
          // Rich formatting for Client Gifts & Giftology — match the quality of Pop-Bys
          const costBadge = item.cost ? `<span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">${item.cost}</span>` : '';
          const badgeLabel = item.id === 'giftology-mindset' ? 'GIFTOLOGY' : 'CLIENT GIFT';

          contentEl.innerHTML = `
            <div class="mb-5">
              <div class="flex items-center gap-2 mb-3">
                <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">${badgeLabel}</span>
                ${costBadge}
              </div>
              ${item.teaser ? `<div class="text-lg font-medium italic text-gray-700 dark:text-gray-300 mb-4">“${item.teaser}”</div>` : ''}
            </div>

            <div class="prose prose-sm dark:prose-invert max-w-none">
              ${item.content || '<p>Full details coming soon.</p>'}
            </div>

            <div class="mt-6 border-t pt-4">
              <div class="text-xs uppercase tracking-wider text-gray-500 mb-2">Delivery & Follow-Up Tip</div>
              <div class="text-sm text-gray-600 dark:text-gray-300">Always pair with a short handwritten note that references something specific about their home, family, or closing. Send a text 3–5 days later: “Hope the [gift] is making life easier! Let me know if you ever need anything real estate-related.”</div>
            </div>

            <div class="mt-6 flex flex-wrap gap-3">
              <button data-vault-copy-btn
                      class="px-5 py-2 bg-[#00A89D] text-white rounded-2xl text-sm font-semibold flex items-center gap-2 hover:opacity-90">
                <i class="fas fa-copy"></i> Copy Gift Note
              </button>
              <button data-vault-save-btn
                      class="px-5 py-2 border border-[#00A89D] text-[#00A89D] rounded-2xl text-sm font-semibold flex items-center gap-2 hover:bg-[#00A89D]/5">
                <i class="fas fa-bookmark"></i> Save to My Resources
              </button>
            </div>
          `;
        } else {
          contentEl.innerHTML = `
            <div class="mb-4">
              ${ (item.id === '7day-objections' || item.id === 'post-closing-texts' || item.id === 'annual-home-equity-review') ? 
                `<span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">POST-CLOSING RETENTION</span>` : 
                `<span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">${item.type ? item.type.toUpperCase() : 'VAULT'} • ${item.pillar || 'partnerships'}</span>`
              }
              ${item.cost ? `<span class="ml-2 text-sm text-gray-500">${item.cost}</span>` : ''}
            </div>
            ${item.content || '<p>Full details available in the original vault materials.</p>'}
            <div class="mt-6 flex flex-wrap gap-3">
              <button data-vault-copy-btn
                      class="px-5 py-2 bg-[#00A89D] text-white rounded-2xl text-sm font-semibold flex items-center gap-2">
                <i class="fas fa-copy"></i> Copy to Clipboard
              </button>
              <button data-vault-save-btn
                      class="px-5 py-2 border border-[#00A89D] text-[#00A89D] rounded-2xl text-sm font-semibold flex items-center gap-2">
                <i class="fas fa-bookmark"></i> Save to My Resources
              </button>
            </div>
          `;
        }
        } /* end !richHandled */

        if (richHandled && typeof window.attachRichVaultModalHandlers === 'function') {
          window.attachRichVaultModalHandlers(contentEl, item);
        }

        // Attach safe event listeners (prevents the raw JS code leaking into the modal)
        const copyBtn = contentEl.querySelector('[data-vault-copy-btn]');
        if (copyBtn) {
          copyBtn.addEventListener('click', () => {
            const textToCopy = item.copyText || item.title || '';
            navigator.clipboard.writeText(textToCopy).then(() => {
              const original = copyBtn.innerHTML;
              copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
              setTimeout(() => {
                if (copyBtn && copyBtn.isConnected) copyBtn.innerHTML = original;
              }, 1600);
            }).catch(() => {
              // Fallback
              const ta = document.createElement('textarea');
              ta.value = textToCopy;
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
              const original = copyBtn.innerHTML;
              copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
              setTimeout(() => { if (copyBtn && copyBtn.isConnected) copyBtn.innerHTML = original; }, 1600);
            });
          });
        }

        const saveBtn = contentEl.querySelector('[data-vault-save-btn]');
        if (saveBtn) {
          saveBtn.addEventListener('click', () => {
            saveVaultItem(item.id, saveBtn);
          });
        }
      }

      if (typeof window.openNamedModal === 'function') {
        window.openNamedModal(modal);
      } else {
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.style.zIndex = '9999';
        modal.style.pointerEvents = 'auto';
        document.body.classList.add('modal-open');
      }
      if (typeof window.ensureModalBackdropClose === 'function') {
        window.ensureModalBackdropClose(modal);
      }
    } catch (err) {
      console.error('[showVaultItemModal] error opening modal for id:', id, err);
      // Last-ditch fallback so the button never feels completely broken
      window.notifyUser('Modal could not open. Please use the "Close Modals" button (top toolbar) then try the Details button again. (ID: ' + id + ')', 'error', 5000);
    }
  };

  window.saveVaultItem = function(id, btnEl) {
    const item = VALUE_VAULT_ITEMS.find(i => i.id === id);
    if (!item) return;

    // Determine a good type based on the item
    let saveType = 'vault';
    if (item.type === 'pop-by' || item.id?.startsWith('popby-')) {
      saveType = 'popby';
    } else if (item.type === 'gift' || item.id?.startsWith('gift-') || item.id?.startsWith('giftology')) {
      saveType = 'gift';
    } else if (item.type === 'checklist' && item.id?.includes('post-closing')) {
      saveType = 'postclosing';
    } else if (item.id === '7day-objections' || item.id === 'post-closing-texts' || item.id === 'annual-home-equity-review') {
      saveType = 'postclosing';
    }

    // Use the full rich content from the modal when available
    const fullContent = item.content || item.teaser || '';

    toggleSaveIdea(item.title, fullContent, btnEl, saveType);

    if (btnEl) {
      const original = btnEl.innerHTML;
      btnEl.innerHTML = '<i class="fas fa-check"></i> Saved!';
      setTimeout(() => { if (btnEl && btnEl.isConnected) btnEl.innerHTML = original; }, 1400);
    }
  };

  window.showDetailModal = function(category, key) {
    console.log('[DetailModal] called with', category, key);
    try {
      // Close any other open modals first for safety
      if (typeof closeAllModals === 'function') {
        closeAllModals();
      }
      console.log('[DetailModal] after internal closeAllModals, about to nuke existing detail-modal');

      // Always start fresh for detail modals (Life Events + Scaling): remove any existing instance
      // (static or previous dynamic). This eliminates stale DOM state, leftover inline styles,
      // or corrupted children that could cause silent failures.
      const existing = document.getElementById('detail-modal');
      if (existing) existing.remove();
      console.log('[DetailModal] nuked any prior detail-modal, about to enter creation block');

      let modal = document.getElementById('detail-modal');

      // Safety: recreate modal if it doesn't exist for some reason
      if (!modal) {
        console.log('[DetailModal] creating fresh modal element');
        modal = document.createElement('div');
        modal.id = 'detail-modal';
        modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]';
        modal.innerHTML = `
          <div class="bg-white dark:bg-gray-900 rounded-3xl max-w-4xl w-full mx-4 max-h-[92vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700" onclick="event.stopImmediatePropagation()">
            <div class="px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#00A89D]/5 via-white to-white dark:via-gray-800 dark:to-gray-800 flex justify-between items-center">
              <div>
                <div class="text-[10px] font-bold tracking-[1.5px] text-[#00A89D] uppercase mb-0.5">Database Nurturing • Life Events • Scaling</div>
                <h3 id="detail-modal-title" class="text-2xl md:text-3xl font-bold text-[#002B5C] dark:text-white"></h3>
              </div>
              <button onclick="closeDetailModal()" class="text-4xl leading-none text-gray-400 hover:text-red-500 transition">×</button>
            </div>
            <div id="detail-modal-content" class="p-6 md:p-8 overflow-y-auto max-h-[68vh] text-[15px] leading-relaxed text-gray-700 dark:text-gray-300"></div>
            <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between text-xs">
              <div class="text-gray-500">Use Copy &amp; Save buttons liberally</div>
              <button onclick="closeDetailModal()" class="px-5 py-2 rounded-2xl border text-sm font-medium hover:bg-white dark:hover:bg-gray-800">Close Guide</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        // Force topmost stacking immediately upon creation
        modal.style.zIndex = '9999';
        modal.style.display = 'flex';
        console.log('[DetailModal] appended fresh modal to body');
      }

      let titleEl = document.getElementById('detail-modal-title');
      let contentEl = document.getElementById('detail-modal-content');
      console.log('[DetailModal] queried title/content elements, titleEl?', !!titleEl, 'contentEl?', !!contentEl);

      // If children are missing even after having the modal, force recreate
      if (!titleEl || !contentEl) {
        console.log('[DetailModal] children missing, forcing second creation');
        if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
        modal = null; // will trigger recreation below
      }

      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'detail-modal';
        modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]';
        modal.innerHTML = `
          <div class="bg-white dark:bg-gray-900 rounded-3xl max-w-4xl w-full mx-4 max-h-[92vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700" onclick="event.stopImmediatePropagation()">
            <div class="px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#00A89D]/5 via-white to-white dark:via-gray-800 dark:to-gray-800 flex justify-between items-center">
              <div>
                <div class="text-[10px] font-bold tracking-[1.5px] text-[#00A89D] uppercase mb-0.5">Database Nurturing • Life Events • Scaling</div>
                <h3 id="detail-modal-title" class="text-2xl md:text-3xl font-bold text-[#002B5C] dark:text-white"></h3>
              </div>
              <button onclick="closeDetailModal()" class="text-4xl leading-none text-gray-400 hover:text-red-500 transition">×</button>
            </div>
            <div id="detail-modal-content" class="p-6 md:p-8 overflow-y-auto max-h-[68vh] text-[15px] leading-relaxed text-gray-700 dark:text-gray-300"></div>
            <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between text-xs">
              <div class="text-gray-500">Use Copy &amp; Save buttons liberally</div>
              <button onclick="closeDetailModal()" class="px-5 py-2 rounded-2xl border text-sm font-medium hover:bg-white dark:hover:bg-gray-800">Close Guide</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        // Force topmost stacking immediately upon creation
        modal.style.zIndex = '9999';
        modal.style.display = 'flex';
        console.log('[DetailModal] appended SECOND fresh modal');
      }

      // Always re-query after possible recreation
      titleEl = document.getElementById('detail-modal-title');
      contentEl = document.getElementById('detail-modal-content');

      console.log('[DetailModal] about to lookup DETAIL_CONTENT for', category, key, '— DETAIL_CONTENT type:', typeof DETAIL_CONTENT);
      const data = DETAIL_CONTENT[category] && DETAIL_CONTENT[category][key];
      if (!data) {
        console.warn('No detail content for', category, key);
        window.notifyUser('Modal content not found for this item. Check console for details.', 'error', 5000);
        return;
      }
      console.log('[DetailModal] data found for', category, key, 'title:', data.title);

      const richLifeTitle = category === 'life-event' && typeof window.getLifeEventModalTitle === 'function'
        ? window.getLifeEventModalTitle(key) : null;
      const richScalingTitle = category === 'scaling' && typeof window.getScalingModalTitle === 'function'
        ? window.getScalingModalTitle(key) : null;
      const richClientTierTitle = category === 'client-tier' && typeof window.getClientTierModalTitle === 'function'
        ? window.getClientTierModalTitle(key) : null;
      if (titleEl) titleEl.textContent = richLifeTitle || richScalingTitle || richClientTierTitle || data.title;

      if (category === 'life-event' && typeof window.renderRichLifeEventModal === 'function' && window.renderRichLifeEventModal(key, contentEl)) {
        // bespoke life-event renderer
      } else if (category === 'scaling' && typeof window.renderRichScalingModal === 'function' && window.renderRichScalingModal(key, contentEl)) {
        // bespoke scaling renderer
      } else if (category === 'client-tier' && typeof window.renderRichClientTierModal === 'function' && window.renderRichClientTierModal(key, contentEl)) {
        // bespoke client tier renderer
      } else if (contentEl) {
        contentEl.innerHTML = data.content;
      }

      // Force visibility (clears any leftover inline display:none from closeAllModals)
      console.log('[DetailModal] about to force visibility on modal');

      if (typeof window.openNamedModal === 'function') {
        window.openNamedModal(modal);
      } else {
        modal.style.zIndex = '9999';
        modal.style.display = 'flex';
        modal.style.position = 'fixed';
        modal.style.pointerEvents = 'auto';
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.classList.add('modal-open');
      }
      if (typeof window.ensureModalBackdropClose === 'function') {
        window.ensureModalBackdropClose(modal);
      }
      console.log('[DetailModal] SUCCESS - modal should now be visible');

    } catch (err) {
      console.error('Error opening detail modal:', err);
      window.notifyUser('Could not open the modal. Please press Escape or use the "Close Modals" button, then try again.', 'error', 5000);
    }
  };

  // Client Appreciation Modal Content
  window.showClientAppreciationModal = function(mode = 'events') {
    try {
      let modal = document.getElementById('client-appreciation-modal');
      let titleEl = document.getElementById('client-appreciation-modal-title');
      let contentEl = document.getElementById('client-appreciation-modal-content');

      // Defensive recreation if the modal or its children are missing
      if (!modal || !titleEl || !contentEl) {
        // Remove any broken version
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'client-appreciation-modal';
        modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-[110]';
        modal.innerHTML = `
          <div class="bg-white dark:bg-gray-900 rounded-3xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700" onclick="event.stopImmediatePropagation()">
            <div class="px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#00A89D]/5 via-white to-white dark:via-gray-800 dark:to-gray-800 flex justify-between items-center">
              <div>
                <div class="text-[10px] font-bold tracking-[1.5px] text-[#00A89D] uppercase mb-0.5">Client Appreciation &amp; Events</div>
                <h3 id="client-appreciation-modal-title" class="text-2xl md:text-3xl font-bold text-[#002B5C] dark:text-white"></h3>
              </div>
              <button onclick="document.getElementById('client-appreciation-modal').classList.add('hidden'); document.getElementById('client-appreciation-modal').classList.remove('flex')" class="text-4xl leading-none text-gray-400 hover:text-red-500 transition">×</button>
            </div>
            <div id="client-appreciation-modal-content" class="p-6 md:p-8 overflow-y-auto max-h-[68vh] text-[15px] leading-relaxed text-gray-700 dark:text-gray-300"></div>
            <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end">
              <button onclick="document.getElementById('client-appreciation-modal').classList.add('hidden'); document.getElementById('client-appreciation-modal').classList.remove('flex')" class="px-5 py-2 rounded-2xl border text-sm font-medium hover:bg-white dark:hover:bg-gray-800">Close Guide</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);

        titleEl = document.getElementById('client-appreciation-modal-title');
        contentEl = document.getElementById('client-appreciation-modal-content');
      }

      let html = '';

    if (mode === 'events') {
      titleEl.textContent = "Client Appreciation Events – Execution Guide";
      html = `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why These Events Compound Referrals</span></div>
          <p class="text-[15px]">Events turn satisfied clients into raving fans who bring photos, stories, and referrals. They create emotional deposits and social proof that no email or call can match. The photos you take become months of content and the personal interactions become the stories they tell their friends and neighbors.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Recommended 4-Event Annual Cadence</h4>
        <div class="grid md:grid-cols-2 gap-4 mb-6 text-[15px]">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong class="block mb-1 text-[#00A89D]">Q1: Pie Day or Ice Cream Social</strong>
            <p class="text-sm">Low-cost, high-warmth. $150–250 total. Invite 40–60 past clients +1. Serve pie/ice cream, have lawn games or a simple activity. Perfect spring kickoff.</p>
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong class="block mb-1 text-[#00A89D]">Q2: Shred Day + Spring Cleanup</strong>
            <p class="text-sm">Partner with a shredding company. Clients bring documents. Add a small plant giveaway or local vendor. Huge practical value + conversation starter.</p>
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong class="block mb-1 text-[#00A89D]">Q3: Summer Picnic or Back-to-School Drive</strong>
            <p class="text-sm">Park or backyard. Collect school supplies as entry or donation. Casual, family-friendly, great for photos with kids.</p>
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong class="block mb-1 text-[#00A89D]">Q4: Holiday Cookie Exchange or Appreciation Party</strong>
            <p class="text-sm">Clients bring a dozen cookies to swap. You provide drinks, music, and a short “year in review + thank you” moment. Highest attendance of the year.</p>
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Full Execution Playbook</h4>
        <div class="space-y-4 mb-6 text-[15px]">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>6–8 Weeks Out</strong><br>
            Lock date + venue. Decide theme and budget ($150–400 typical). Create simple Canva invite.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>3–4 Weeks Out</strong><br>
            Send personal video or text invites to top 60–80 clients. Track RSVPs in a simple spreadsheet. Order food, decor, and any gifts.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Event Day</strong><br>
            Arrive early. Have a welcome table with name tags or a fun sign-in. Take 100+ photos (with permission). Mingle 80% of the time.
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong>Within 48 Hours</strong><br>
            Send group thank-you email + best photos. Personal text to anyone who brought a guest or helped. Ask: “Who else should I invite next time?”
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Invitation Language</h4>
        <div class="space-y-3 mb-6">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name] — I’m hosting a small Pie Day celebration next month as a thank-you to some of my favorite clients and their families. You and a guest are invited — pie, drinks, and good company on me. Would love to catch up in person!">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Pie Day / Casual Invite (Text or Video Script)</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name] — I’m hosting a small Pie Day celebration next month as a thank-you to some of my favorite clients and their families. You and a guest are invited — pie, drinks, and good company on me. Would love to catch up in person!”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Client Event Invite', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'nurture');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
          <strong>Pro Tip:</strong> Always allow +1. Take photos of every guest (with permission). Post 3–5 of the best ones over the following weeks with “Loved seeing these faces at our client appreciation event!” The social proof lasts for months.
        </div>
      `;
    } else if (mode === 'touches') {
      titleEl.textContent = "High-ROI Personal Touches";
      html = `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why These Touches Deliver Massive Emotional ROI</span></div>
          <p class="text-[15px]">Small, thoughtful, personal gestures beat generic marketing every time. They feel rare in 2026 and create outsized gratitude and referrals. The key is consistency + specificity (reference something real about them).</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Four High-Impact Touches with Ready-to-Use Language</h4>
        <div class="space-y-4 mb-6">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="[Name], I can’t believe it’s already [X] years since you got the keys! Hope the house is still treating you well. I pulled a quick update on values in your neighborhood — happy to hop on a 10-minute call if you’re ever curious what your equity looks like these days. No strings attached.">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Home Anniversary Card + Gift</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">Send 7–10 days before the anniversary. Include a small meaningful gift (monogram cutting board, local honey, nice plant, their favorite coffee). Add the equity note below.</div>
                <div class="text-[15px] mt-2">“[Name], I can’t believe it’s already [X] years since you got the keys! Hope the house is still treating you well. I pulled a quick update on values in your neighborhood — happy to hop on a 10-minute call if you’re ever curious what your equity looks like these days. No strings attached.”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('High-ROI Touch: Anniversary', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'nurture');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [First Name], it’s [Your Name] — I just wanted to wish you a happy birthday! Hope you’re doing something fun today with the people you love. I’ve been thinking about you and how much I enjoyed helping you get into your home. If there’s ever anything I can do for you or anyone you know, just let me know. Have an amazing day!">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Birthday Video Message (30–45 sec)</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">Record on your phone the day before or morning of. Keep it warm and under 45 seconds. Reference one personal detail if you know it.</div>
                <div class="text-[15px] mt-2">“Hey [First Name], it’s [Your Name] — I just wanted to wish you a happy birthday! Hope you’re doing something fun today with the people you love. I’ve been thinking about you and how much I enjoyed helping you get into your home. If there’s ever anything I can do for you or anyone you know, just let me know. Have an amazing day!”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('High-ROI Touch: Birthday Video', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'nurture');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Additional High-ROI Touches</h4>
        <ul class="text-[15px] space-y-2 mb-6">
          <li><strong>“Just Sold in Your Neighborhood” Postcard or Text</strong> — Low cost, hyper-local relevance. Shows you’re paying attention to their world.</li>
          <li><strong>Annual Equity Snapshot</strong> — Simple one-pager or 60-second video once a year (even when rates are high). Homeowners love knowing their position.</li>
          <li><strong>Life-Event Response</strong> — Baby, new job, empty nest — send a small relevant gift + note within a week. These stand out forever.</li>
        </ul>

        <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
          <strong>Pro Move:</strong> Keep a private note in your CRM with kids’ names, hobbies, last vacation, etc. Reference it before every touch. The recipient will feel truly known.
        </div>
      `;
    } else {
      titleEl.textContent = "Professional Network & Co-Host Events";
      html = `
        <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Partner Events Are Your Highest-Leverage Marketing</span></div>
          <p class="text-[15px]">Referral partners who feel genuinely appreciated — fellow agents, lenders, and title reps — send you their best clients. Events give them value, visibility, and a non-transactional way to deepen the relationship. The referrals that follow are warmer and more consistent.</p>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Three High-Impact Partner Event Formats</h4>
        <div class="space-y-4 mb-6 text-[15px]">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong class="block mb-1 text-[#00A89D]">Quarterly Partner Mastermind (60–90 min)</strong>
            <p class="text-sm">Invite 8–15 agents. Serve light food/drinks. Pick one timely topic (“Winning Listings in a Shifting Market”, “Negotiation Tactics That Protect Your Clients”, “First-Time Buyer Strategies”). You facilitate or bring a short speaker. End with 10 minutes of open networking. Cost: $200–350.</p>
            <div class="mt-3 bg-white dark:bg-gray-800 p-3 rounded text-xs">Sample invite: “I’m hosting a small, no-fluff roundtable for my top referral partners next month. Topic: [Topic]. Food on me. Limited to 12 spots — would love to have you at the table.”</div>
          </div>

          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong class="block mb-1 text-[#00A89D]">Co-Hosted Open House Happy Hour</strong>
            <p class="text-sm">Partner with 2–3 agents on a Saturday afternoon open house. You bring drinks/snacks and a short “market update” moment. Agents get help filling the house; you get face time with their clients and sphere. Do this 3–4 times a year.</p>
          </div>

          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <strong class="block mb-1 text-[#00A89D]">Small VIP Dinner or Appreciation Night</strong>
            <p class="text-sm">Top 8–12 partners who have referred you multiple clients. Nice but not extravagant restaurant or private room. Short toast thanking them, then open conversation. Do this 1–2 times per year. These partners become your inner circle.</p>
          </div>
        </div>

        <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Invitation &amp; Follow-Up Language</h4>
        <div class="space-y-3 mb-6">
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="I’m hosting a small, no-fluff roundtable for my top agent partners next month. Topic: Winning Listings in Today’s Market. Food and drinks on me. Limited to 12 spots — would love to have you at the table.">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <strong class="text-sm font-semibold">Mastermind / Roundtable Invite</strong>
                <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“I’m hosting a small, no-fluff roundtable for my top agent partners next month. Topic: Winning Listings in Today’s Market. Food and drinks on me. Limited to 12 spots — would love to have you at the table.”</div>
              </div>
              <div class="flex flex-col gap-1">
                <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Partner Event Invite', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'nurture');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
          <strong>Key Rule:</strong> Keep events educational and relationship-first. The referral conversation should feel like a natural extension of the evening, never a sales pitch. Publicly celebrate their wins on social (with permission) — agents love the exposure.
        </div>
      `;
    }

    contentEl.innerHTML = html;

    if (typeof window.openNamedModal === 'function') {
      window.openNamedModal(modal);
    } else {
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      modal.style.pointerEvents = 'auto';
      document.body.classList.add('modal-open');
    }
    if (typeof window.ensureModalBackdropClose === 'function') {
      window.ensureModalBackdropClose(modal);
    }
    } catch (err) {
      console.error('Error in showClientAppreciationModal:', err);
      window.notifyUser('Could not open the modal. Please use the "Close Modals" button or press Escape, then try again.', 'error', 5000);
    }
  };

  // closeDetailModal — canonical implementation in js/ui.js

  // Safety function to close all common modals (non-destructive to our controlled modal roots)
  window.closeAllModals = function() {
    console.log('[closeAllModals] called');
    const modalIds = [
      'global-loading',
      'detail-modal',
      'nurture-template-modal',
      'process-template-modal',
      'process-stage-modal',
      'scaling-modal',
      'communication-modal',
      'client-appreciation-modal',
      'task-help-modal',
      'blog-tips-modal',
      'newsletter-tips-modal',
      'referral-modal',
      'api-key-modal',
      'content-modal',
      'newsletter-choice-modal',
      'idea-modal',
      'user-profile-modal',
      'modal-client-appreciation',
      'modal-partner-mastermind',
      'modal-social-networking',
      'modal-community-charity',
      'modal-value-first',
      'modal-invite-plus-one',
      'modal-co-host-leverage',
      'modal-frequency-goal',
      'modal-post-event-followup',
      'modal-drive-attendance'
    ];

    modalIds.forEach(id => {
      const m = document.getElementById(id);
      if (!m) return;
      if (typeof window.closeAppModal === 'function') {
        window.closeAppModal(m);
      } else if (typeof window.closeSocialContentModal === 'function' && id === 'content-modal') {
        window.closeSocialContentModal();
      } else if (typeof window.closeNewsletterChoiceModal === 'function' && id === 'newsletter-choice-modal') {
        window.closeNewsletterChoiceModal();
      } else if (typeof window.closeReferralModal === 'function' && id === 'referral-modal') {
        window.closeReferralModal();
      } else {
        m.classList.remove('flex');
        m.classList.add('hidden');
        m.style.display = 'none';
      }
    });
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    if (typeof window.hideLoading === 'function') window.hideLoading();
    if (typeof window.closeDynamicModals === 'function') window.closeDynamicModals();

    // Only remove stray/anonymous overlays. Never delete our known modal elements.
    document.querySelectorAll('.fixed.inset-0.bg-black\\/60').forEach(el => {
      if (el.id !== 'sidebar' && !modalIds.includes(el.id || '')) {
        el.remove();
      }
    });
  };

  // Ensure all modals start in a clean hidden state on load
  document.addEventListener('DOMContentLoaded', () => {
    window.closeAllModals();
  });

  // Global Escape key handler to close modals (very useful during testing)
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });


  // My Saved Items library → js/features/saved-items-library.js

  // makeSaveable() legacy injection removed — all modern panels and pillars now ship with explicit Copy + Save buttons using the unified toggleSaveIdea(text, 'social')

  // Initialize
  setTimeout(() => {
    if (typeof window.updateSavedCount === 'function') window.updateSavedCount();
    setTimeout(syncBookmarkIcons, 50);
  }, 800);

  // Keep the count badge accurate even if items were saved from other tools (Sales Scripts, etc.)
  const socialSection = document.getElementById('social');
  if (socialSection) {
    const observer = new MutationObserver(() => {
      if (!socialSection.classList.contains('hidden')) {
        if (typeof window.updateSavedCount === 'function') window.updateSavedCount();
      }
    });
    observer.observe(socialSection, { attributes: true, attributeFilter: ['class'] });
  }
})();
