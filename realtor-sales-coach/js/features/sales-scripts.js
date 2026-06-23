/**
 * js/features/sales-scripts.js
 *
 * Sales Script Generator
 * Extracted and cleaned during leak repair (Phase 1 follow-up)
 *
 * Includes:
 * - generateSalesScript()
 * - copySingleScript()
 * - toggleAccordion() (if tightly coupled)
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
      targetPartners: central.targetPartners || [],
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
    if (eff.targetPartners && eff.targetPartners.length) parts.push(`Key referral partners: ${eff.targetPartners.join(', ')}`);

    const base = 'Warm, authentic, relationship-first realtor who speaks like a trusted advisor.';
    return parts.length ? `${base} ${parts.join('. ')}.` : base;
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

  const scenarioData = {
    "custom": {
      label: "Write Your Own Situation",
      icon: "fa-edit",
      color: "#002B5C",
      scenarios: [] // special case
    },
    "most-common": {
      label: "Most Common Right Now",
      icon: "fa-bolt",
      color: "#00A89D",
      scenarios: [
        { value: "Prices feel too high right now", label: "Prices feel too high right now", contextTip: "Helpful details: How long have they been looking? Do they have a target monthly payment? Any upcoming life events (baby, job change, lease ending)?" },
        { value: "We're going to wait for rates to drop", label: "We're going to wait for rates to drop", contextTip: "Helpful details: How long have they been looking? Do they have a specific target monthly payment they're trying to stay under? Any upcoming deadlines (lease ending, job relocation, baby due)?" },
        { value: "I want to wait until after the election / things settle", label: "Wait until after the election / things settle", contextTip: "Useful context: What specific uncertainty are they worried about (rates, economy, job market)? How long do they expect to wait?" },
        { value: "A friend or family member is a realtor and we feel obligated to use them", label: "Friend/family member is a realtor", contextTip: "Helpful context: How close are they to this person? Are they feeling pressure or genuine loyalty? What would they want most — relationship harmony or the best representation?" },
        { value: "Your commission feels too high / can you discount your fee?", label: "Commission feels too high", contextTip: "Useful details: What are they comparing against (another agent quote, online discount broker)? What value do they care about most — marketing, negotiation, communication, speed?" },
        { value: "We want to sell FSBO and skip the agent", label: "Want to sell FSBO", contextTip: "Helpful details: Why FSBO (save money, control, bad past experience)? Do they understand net proceeds vs. list price? Any timeline pressure?" },
        { value: "I'm not sure I'm ready to commit to an agent yet", label: "Not ready to commit to an agent", contextTip: "Helpful details: What would need to happen for them to feel ready? Are they early-stage browsing or actively touring? Any past bad agent experience?" },
        { value: "We found a home online and want to work directly with the listing agent", label: "Want to work directly with listing agent", contextTip: "Useful context: Do they understand dual agency or who represents whom? How strong is their offer strategy? Any financing or inspection concerns?" }
      ]
    },
    "buyer-conversations": {
      label: "Buyer & Client Conversations",
      icon: "fa-user",
      color: "#00A89D",
      scenarios: [
        { value: "I can get a better deal online or with another realtor", label: "I can get a better deal online / with another realtor", contextTip: "Useful details: Have they worked with anyone yet or just browsing? What are they comparing (commission, marketing, communication, negotiation strength)?" },
        { value: "A friend or family member is a realtor", label: "Friend/family member is a realtor", contextTip: "Helpful context: How close are they to this person? Are they feeling pressure, or is it more of a loyalty thing? Have they compared services or recent results yet?" },
        { value: "Buying a home is too stressful / overwhelming", label: "Buying a home is too stressful", contextTip: "Good details: What part feels most stressful to them (paperwork, finding the right home, negotiation, the whole process, financing coordination)? Have they bought before?" },
        { value: "I don't want to pay high closing costs or PMI worries", label: "Don't want high closing costs / worried about PMI or fees", contextTip: "Helpful context: Do they understand seller concessions, DPA options, or when PMI can be removed? What's their target down payment? Ideas for structuring offers?" },
        { value: "I heard closing costs are really high", label: "Closing costs are really high", contextTip: "Useful details: What have they heard closing costs typically run? Are they first-time buyers? Any specific fees they're worried about? How can we use concessions or programs?" },
        { value: "I'm happy renting and not sure I'm ready to buy", label: "Happy renting / not ready to buy", contextTip: "Helpful details: What would need to change for them to feel ready? Are they worried about maintenance, being tied down, market timing, or monthly payment? Offer to run scenarios or monitor for the right fit." },
        { value: "I'm worried the process will take too long", label: "Worried the process will take too long", contextTip: "Good context: Do they have a hard deadline (new job start, lease ending, school year)? Have they talked to a lender partner for qualification timeline yet?" },
        { value: "My parents/siblings are helping and they're hesitant", label: "Parents helping and hesitant", contextTip: "Useful details: Are the parents worried about the market, monthly costs, maintenance, or their child taking on a big commitment? How involved do the parents want to be? Offer a family consult." }
      ]
    },
    "co-broke-conversations": {
      label: "Co-Broke & Other Agent Conversations",
      icon: "fa-handshake",
      color: "#002B5C",
      scenarios: [
        { value: "The other agent on this co-broke isn't responding or cooperating", label: "Difficult / unresponsive co-broke agent", contextTip: "Helpful details: Are you the listing or buyer's agent? How far along is the deal? Any specific issues (communication, showing access, offer presentation)?" },
        { value: "Another agent brought a lowball or unrealistic offer on my listing", label: "Handling a lowball offer from buyer's agent", contextTip: "Helpful details: How low is the offer? Any contingencies or red flags? What's the seller's motivation and bottom line?" },
        { value: "I want to propose a co-listing or team-up with a strong agent in another farm area", label: "Propose co-listing or teaming up with another agent", contextTip: "Useful context: Do you know this agent personally or by reputation? What strengths do they bring that complement yours? Any past overlap?" },
        { value: "I'd like to ask a top producer in another area for cross-referrals", label: "Ask another agent for cross-area referrals", contextTip: "Helpful details: Have you done any business together before? What kind of clients do you each serve well (first-time, move-up, luxury, investors)?" },
        { value: "I need to repair a relationship after a rough co-broke experience", label: "Repair relationship after bad co-broke", contextTip: "Good context: What specifically went wrong last time? Was it communication, follow-through, or something the other agent did? How long ago was it?" },
        { value: "How do I get more agents to actually show my new listing?", label: "Encourage other agents to show / bring buyers to my listing", contextTip: "Useful details: Is the property priced right and in good condition? Any unique features or incentives? Have you already sent a broker open or marketing packet?" },
        { value: "The buyer's agent is being difficult about inspections or repairs", label: "Negotiate repairs / inspection issues with the other side", contextTip: "Helpful details: What are the inspection findings? How motivated is your seller vs. the buyer? Any leverage or creative solutions?" },
        { value: "A new or struggling agent in my office/market could use some help or mentoring", label: "Offer support or mentoring to a newer agent", contextTip: "Useful context: How new are they? Are they in your brokerage or just local? What specific area are they struggling with (listings, negotiations, marketing)?" },
        { value: "I want to ask another successful agent to introduce me to their sphere or database", label: "Ask another agent for sphere introduction or referral", contextTip: "Helpful context: Do you have a good existing relationship? What value can you offer in return (leads in their weak area, co-marketing, market updates)?" },
        { value: "I have a strong buyer for another agent's listing — how do I approach to make it a win-win", label: "Approach listing agent with a qualified buyer for their property", contextTip: "Useful details: Is the property still active? Do you know the listing agent? Any prior relationship or tension on past deals?" }
      ]
    },
    "asking-for-business": {
      label: "Asking for Business & Referrals",
      icon: "fa-comments",
      color: "#00A89D",
      scenarios: [
        { value: "Ask a fellow agent for a 1:1 meeting / coffee", label: "Ask fellow agent for 1:1 meeting", contextTip: "Helpful details: How long have you known this agent? Have you done any co-broke or referred business together before? What's your goal (get to know them, explore co-marketing, discuss referral swap)?" },
        { value: "Ask a buyer to hop on a home strategy / qualification call", label: "Ask buyer for home buying strategy call", contextTip: "Useful context: How serious are they about buying? Have they spoken with a lender or been pre-qualified elsewhere? Any specific objections or concerns they've already raised around payment, process, or timing?" },
        { value: "Encourage a buyer to get pre-qualified and move forward with an offer", label: "Encourage buyer to get qualified / move forward", contextTip: "Helpful details: How long have they been looking? Are they under contract or writing offers with a deadline? What's their biggest fear about committing or financing?" },
        { value: "Ask a past client for referrals", label: "Ask past client for referrals", contextTip: "Good context: How long ago did you close their purchase? Did the process go smoothly? Any specific wins you want to remind them of (great negotiation, speed to keys, stress reduction, neighborhood fit)?" },
        { value: "Ask client to complete post-closing survey or review", label: "Ask client for post-closing survey/review", contextTip: "Great to include: How did the transaction go overall? Any specific things the client seemed especially happy about (communication, finding the right home, negotiation wins, smooth process)?" },
        { value: "Offer to monitor the market for a future move-up or investment", label: "Offer to monitor market for future move", contextTip: "Useful details: When did they close their current home? Any life events coming up that might trigger a move (new baby, job change, growing family)?" },
        { value: "Re-engage a buyer who went with another realtor or team", label: "Re-engage lost buyer / past lead", contextTip: "Helpful context: How long ago did they buy or work with the other realtor? Do you know why they chose someone else? Any indication they're unhappy or open to working with you for a future move-up or referral?" },
        { value: "Invite another agent to lunch or coffee", label: "Invite agent to lunch/coffee", contextTip: "Useful details: How well do you already know this agent? Have you closed any deals or co-broke with them? What’s your goal for the lunch (build relationship, explore referral partnership, propose joint marketing)?" },
        { value: "Welcome a new real estate agent to the market or office", label: "Welcome new agent to market/office", contextTip: "Helpful context: How new are they to the business? Do they have any background (previous career, family in real estate)? What kind of support would be most valuable (market intel, co-broke tips, lender intros)?" },
        { value: "Support a fellow agent who's having a slow month", label: "Support fellow agent having slow month", contextTip: "Useful details: How well do you know them? Have you worked or co-broke'd together before? Would they appreciate a lead, co-marketing idea, market intel, or just a supportive conversation?" },
        { value: "Ask another agent to introduce you to their sphere or for a referral", label: "Ask agent for sphere intro or referral", contextTip: "Helpful context: How strong is your current relationship with this agent? Have you done any co-broke deals or joint events together? What value (leads, expertise, co-marketing) can you offer in return?" },
        { value: "Offer to co-host a first-time buyer seminar", label: "Co-host first-time buyer event", contextTip: "Useful details: Has this realtor done any educational events before? Do they have a specific target audience (first-time buyers, move-up, investors)?" }
      ]
    },
    "post-closing-surveys": {
      label: "Post-Closing Survey Responses",
      icon: "fa-star",
      color: "#00A89D",
      scenarios: [
        { value: "Perfect score survey response (10/10 or 5/5 stars)", label: "Perfect score (10/10 or 5 stars)", contextTip: "Excellent context: What exact things did they rave about (speed, communication, hand-holding through stress, your team)? Any personal details or wins you can warmly reference to make the thank-you feel genuine?" },
        { value: "Just shy of perfect (8-9/10 or 4/5 stars, minor notes)", label: "Just shy of perfect (minor feedback)", contextTip: "Helpful details: What small thing did they mention? Was it something you can easily acknowledge or improve on next time? Balance the thank-you with addressing the note positively." },
        { value: "Low score or negative feedback (service recovery)", label: "Low score / didn't go well", contextTip: "Critical context: What specifically went wrong from their perspective? Have you already spoken with them? Focus on genuine ownership, empathy, and a clear path forward without being defensive." },
        { value: "Neutral or average score with little feedback", label: "Neutral / average score", contextTip: "Useful: Did they mention anything positive or negative at all, or was it completely generic? A warm, specific thank-you that invites more feedback can turn it into a relationship win." },
        { value: "Positive feedback or survey from another agent", label: "Positive feedback from another agent", contextTip: "Great context: What did the other agent specifically appreciate (your communication on the co-broke, how you handled the client, marketing on the listing)? Keep it professional yet warm." },
        { value: "Thank you after great survey + soft ask for public review/testimonial", label: "Thank you + ask for testimonial", contextTip: "Nice touch: Reference the specific praise they gave in the survey. Ask if they'd be willing to share a short public Google/Experience review or testimonial you can use." }
      ]
    },
    "relationship-nurturing": {
      label: "Relationship Nurturing & Follow-Up",
      icon: "fa-heart",
      color: "#00A89D",
      scenarios: [
        { value: "Follow up after sending a buyer qualification packet or realtor resources", label: "Follow up after buyer resources / qualification share", contextTip: "Helpful details: How long ago did you send the qualification overview or resources to the realtor/buyer? Did the realtor or buyer respond? Any specific questions about process, lenders, or next steps?" },
        { value: "Respond to an Experience.com or Google review", label: "Respond to review/survey", contextTip: "Very helpful: Was the review positive or critical? Did it come from a buyer/client or a realtor/partner? What specific part of the experience did they mention?" },
        { value: "Thank a client for completing a post-closing survey or review", label: "Thank client for completing survey/review", contextTip: "Nice touch: What did they specifically say in the review that stood out? Was there anything particularly stressful about their transaction that you helped with?" },
        { value: "Thank a past client for sending a referral", label: "Thank past client for a referral", contextTip: "Great context: How did the referral turn out? Did the new client end up closing? Any specific things the referring client might appreciate being acknowledged for (their intro, their sphere trust)?" },
        { value: "Offer value to another agent (no ask)", label: "Offer value to another agent (no ask)", contextTip: "Useful details: What kind of value are you thinking of offering (hot buyer lead in their area, market update, co-marketing idea, introduction to a lender)? Have you done anything like this with them before?" },
        { value: "Thank another agent after a smooth co-broke closing", label: "Thank agent after smooth co-broke", contextTip: "Nice touch: What made the collaboration particularly smooth or memorable? Was there anything the other agent did that you especially appreciated (communication, flexibility, bringing a strong buyer)?" },
        { value: "Birthday, closing anniversary, or home anniversary check-in", label: "Birthday or anniversary check-in", contextTip: "Helpful details: How long ago did you close their purchase? Do you have any personal details about them (kids' names, hobbies, pets, life events) that would make the note feel more genuine?" },
        { value: "Reinforce 'I'm your realtor for life'", label: "Reinforce 'realtor for life'", contextTip: "Good context: How long ago did you help them purchase their home? Have they referred anyone to you yet? Any life events coming up (new baby, job change, growing family) that might mean a future move?" },
        { value: "Reach out for an annual home & equity check-in or move-up review", label: "Annual home & equity / move-up review", contextTip: "Helpful details: When did they close their current home? Any life events or equity growth that might signal a future move-up, investment, or downsizing conversation?" },
        { value: "Help a past client who is relocating", label: "Help past client relocating", contextTip: "Useful context: Where are they moving to? Do they need a referral to a lender in the new area, or are they keeping the current home as a rental?" },
        { value: "Congratulate another agent on a new listing or sale", label: "Congratulate agent on win", contextTip: "Nice touch: Do you know any details about the transaction (price, days on market, any challenges)? Have you worked or co-broke'd with this agent before? Great way to stay top-of-mind." },
        { value: "Check in after major market or rate news", label: "Check in after market/rate news", contextTip: "Helpful context: What changed in your local market (inventory, pricing, or financing conditions)? Do you have any clients or partners who were on the fence and might need a quick update?" }
      ]
    },
    "special-situations": {
      label: "Complex / Special Situations",
      icon: "fa-exclamation-triangle",
      color: "#002B5C",
      scenarios: [
        { value: "Client is moving out of state", label: "Client moving out of state", contextTip: "Helpful details: Are they selling their current home or keeping it as a rental? Do they need a lender referral in the new state, or are they financing the new purchase while keeping the old one?" },
        { value: "Client is buying a second home or vacation property", label: "Buying second home / vacation property", contextTip: "Useful context: Is this purely for personal use or do they plan to rent it out part-time? Do they have strong income/credit, or is this stretching them a bit?" },
        { value: "Client is going through a divorce", label: "Going through divorce", contextTip: "Sensitive context: How far along is the divorce process? Are both parties still on the loan, or is one person trying to buy the other out? Is an attorney involved?" },
        { value: "Client is inheriting property", label: "Inheriting property", contextTip: "Helpful details: Are they keeping the property or selling it? Are they taking title and planning to live there, rent it, or finance improvements?" },
        { value: "Client has non-traditional income (self-employed, gig, etc.)", label: "Non-traditional / self-employed income", contextTip: "Very useful: How long have they been self-employed? Do they have 2 years of tax returns? Are they using bank statement or asset-based programs?" },
        { value: "Client has a recent credit event (bankruptcy, foreclosure)", label: "Recent credit event", contextTip: "Important context: How long ago was the credit event? Have they been rebuilding credit? Are they working with a credit repair company or housing counselor?" },
        { value: "Client is a veteran using VA benefits", label: "Veteran using VA benefits", contextTip: "Helpful details: Is this their first VA loan? Do they have their Certificate of Eligibility yet? Are they aware of the funding fee and how it can be waived?" },
        { value: "Power of attorney, trust, or estate situations", label: "POA / trust / estate situations", contextTip: "Critical details: Who is the power of attorney for? Is this for a parent, spouse, or someone else? Are there any title/estate attorney complications we need to be aware of?" }
      ]
    }
  };

  // =====================================================
  // ORIGINAL SALES SCRIPT CODE (moved from leaked block in index.html)
  // =====================================================

async function generateSalesScript() {
    const output = document.getElementById('script-output');

    // Get scenario from the new premium card UI (validate early, before showing loading)
    const context = document.getElementById('script-context')?.value.trim() || '';
    let scenario = currentSelectedScenario || '';

    // Collect sales-elements checkboxes (premium more-options-to-check UX)
    const elemContainer = document.getElementById('sales-elements') || document;
    const elemChecks = elemContainer.querySelectorAll('input[type="checkbox"]:checked');
    const scriptElements = Array.from(elemChecks).map(cb => (cb.value || '').trim()).filter(Boolean);

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
                    <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00A89D] mb-5"></div>
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
                    <h4 class="text-xl font-bold text-[#00A89D] mb-5 text-center">
                        What Makes These Scripts Powerful
                    </h4>
                    <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                        <div class="flex gap-3">
                            <i class="fas fa-comments text-[#00A89D] mt-0.5"></i>
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

    const prompt = `You are an expert real estate communication coach helping realtors build better relationships.

REALTOR PROFILE:
${personalization}

Generate exactly 4 varied, natural scripts for this situation:

Situation: "${scenario}"

${context ? `Additional context: ${context}` : ''}
${scriptElements.length ? `Must naturally incorporate these elements where they fit: ${scriptElements.map(e => '• ' + e).join(' ')}` : ''}

Requirements for each script:
- 3–6 sentences long
- Warm, curious, helpful — never salesy or pushy
- Use open-ended questions
- Include a soft next step
- End with a gentle call-to-action
- Tone: Match the realtor's natural voice and personality from the profile above
- Make it sound like this specific person wrote it

CRITICAL FORMATTING:
- Start each with ## **Script 1** (bold header), ## **Script 2**, etc.
- Use **bold** for light emphasis where it feels natural
- Use - bullet points when listing questions, benefits, or ideas
- Separate paragraphs with a blank line
- Do NOT use code blocks

Focus on building connection and trust — not closing the deal.`;

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
                        <h3 class="text-4xl font-black text-[#00A89D]">${title}</h3>
                        <div class="flex gap-3">
                            <button onclick="copySingleScript('${scriptId}', this)" 
                                    class="bg-gradient-to-r from-[#00A89D] to-[#00A89D] text-white px-6 py-3 rounded-full font-bold shadow-xl transition-all flex items-center gap-2 hover:opacity-90">
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
        buttonEl.classList.replace('to-[#00A89D]', 'to-green-700');

        setTimeout(() => {
            buttonEl.innerHTML = original;
            buttonEl.classList.replace('from-green-600', 'from-[#00A89D]');
            buttonEl.classList.replace('to-green-700', 'to-[#00A89D]');
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
    const fullTitle = `Sales Script: ${title}`;

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
    <span class="text-xs uppercase tracking-widest font-bold text-[#00A89D]">Sales Script</span>
  </div>
  <div class="text-sm mb-2"><strong>Scenario:</strong> ${title.replace('Sales Script: ', '')}</div>
  <div class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
    ${text}
  </div>
  <div class="mt-2 text-[10px] text-gray-500">Saved from Sales Script Generator • Personalized to your voice &amp; profile</div>
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
                    <strong class="text-[#00A89D]">For Market Timing / Wait-and-See Objections</strong>
                    <ul class="mt-2 list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                        <li>How long have they been looking?</li>
                        <li>Are they pre-approved or still exploring options?</li>
                        <li>What monthly payment or price range are they trying to stay within?</li>
                        <li>Any upcoming life events (baby, job change, lease ending)?</li>
                    </ul>
                </div>
                <div>
                    <strong class="text-[#00A89D]">For Partner / Referral Pushback</strong>
                    <ul class="mt-2 list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                        <li>Who is the partner (lender, title rep, builder, fellow agent)?</li>
                        <li>How long have you known them and have you closed a file together?</li>
                        <li>What value could you offer first (CMA, open house support, co-branded asset)?</li>
                        <li>Any co-marketing or events you've done together?</li>
                    </ul>
                </div>
                <div>
                    <strong class="text-[#00A89D]">For Review / Survey Responses</strong>
                    <ul class="mt-2 list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                        <li>What did the review actually say? (positive or negative?)</li>
                        <li>Was this a buyer/client or a realtor/partner review?</li>
                        <li>Any specific part of the experience you want to highlight or address?</li>
                    </ul>
                </div>
                <div>
                    <strong class="text-[#00A89D]">For Special Situations (divorce, inheritance, credit events, etc.)</strong>
                    <ul class="mt-2 list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                        <li>How emotional or sensitive is the situation?</li>
                        <li>Are there other professionals involved (attorney, financial advisor)?</li>
                        <li>Is timing a factor (closing date, inheritance deadline)?</li>
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
    if (typeof window.showSection === 'function') window.showSection('sales-script');

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
          const scCards = document.querySelectorAll('#sales-scenario-cards > div');
          const scIdx = cat?.scenarios?.findIndex(s => s.value === scenarioValue) ?? -1;
          if (scIdx >= 0 && scCards[scIdx]) {
            selectScenario(scenarioValue, cat.scenarios[scIdx].label, scCards[scIdx]);
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

  console.log('%c[sales-scripts.js] Sales Script Generator initialized (Premium UI)', 'color:#00A89D');

})();
