/**
 * js/data/lo-fact-vault.js
 * Ruoff differentiators — sourced from Fact Vault.docx / Fact Vault.txt
 * Searchable via VALUE_VAULT_ITEMS + header/vault search.
 */
(function () {
  'use strict';

  function fact(id, category, title, teaser, body, tags) {
    return {
      id,
      pillar: 'platform',
      type: 'fact',
      libraryCategory: category,
      title,
      teaser,
      tags: tags || [category.toLowerCase().replace(/\s+/g, '-')],
      copyText: `${title}: ${teaser}`,
      content: `<strong>${title}</strong><p class="mt-3">${body}</p><div class="mt-4 p-3 bg-[#002B5C]/5 rounded-xl text-sm"><strong class="text-[#002B5C] dark:text-[#00A89D]">Use with partners:</strong> Cite this when an agent asks why Ruoff — keep it specific, not a feature dump.</div>`
    };
  }

  window.LO_FACT_VAULT_ITEMS = [
    fact('fact-ruoff-plus', 'Technology', 'Ruoff+', 'All-in-one LO mission control — pipeline, PAs, rates, training, marketing', 'Your competitive edge platform: manage pipeline, issue pre-approval letters, run rate checks, access training and marketing tools from desk or mobile. Position as “I can move faster because everything lives in one place.”', ['technology', 'ruoff-plus']),
    fact('fact-lo-app', 'Technology', 'Ruoff LO App', '40+ mobile tools — referrals, photo filters, full Ruoff+ power', 'Designed for loan officers on the go: share referral links by text, celebrate closings with branded photo filters, and access Ruoff+ without a laptop.', ['technology', 'mobile']),
    fact('fact-loai', 'Technology', 'LOAi', 'Soft credit, program select, tax/insurance estimates, DU/LP in ~1 minute', 'Runs when an application is received — can save 15–30 minutes per file. Great proof point for agents worried about speed on pre-approvals.', ['technology', 'efficiency']),
    fact('fact-step-ahead', 'Technology', 'Step Ahead', 'Full UW pre-approval before property is found', 'Have files fully underwritten before the buyer finds a home. Challenging scenarios reviewed by an actual underwriter before the PA letter — strengthens offers in competitive markets.', ['technology', 'underwriting', 'agents']),
    fact('fact-agent-advantage', 'Technology', 'Ruoff Agent Advantage', 'Monday auto pipeline snapshot to referral partners', 'Automated weekly update: pre-approved buyers, active deals, recent closings — plus your personalized notes. Removes guesswork and keeps you top-of-mind every Monday.', ['technology', 'agents', 'crm']),
    fact('fact-loan-butler', 'Technology', 'Loan Butler', 'Borrower POS — to-do list, docs, real-time status', 'Secure companion for borrowers from application to closing. Real-time updates so clients (and their agents) always know where the file stands.', ['technology', 'borrower-experience']),
    fact('fact-milestone-updates', 'Technology', 'Milestone Updates', 'Automated text/email to borrowers and referral partners', 'World-class communication throughout the loan process without you manually chasing updates. Agents love predictable milestone alerts.', ['technology', 'communication']),
    fact('fact-scenario-builder', 'Technology', 'Scenario Builder', 'Side-by-side rate, product, and down payment comparisons', 'Present options in under two minutes so buyers choose confidently. Perfect for open house or buyer consult conversations.', ['technology', 'scenarios']),
    fact('fact-preapproval-advantage', 'Technology', 'Pre-Approval Advantage', 'Borrowers run custom PA scenarios within your limits', 'Set max price and tax estimates; borrowers generate their own letters. Empowers serious shoppers while you control guardrails.', ['technology', 'pre-approval']),
    fact('fact-digital-closing', 'Technology', 'Digital Closing', 'Majority of docs e-signed before the closing table', 'Less wet-signing stress for borrowers and agents. Faster, cleaner closing day experience.', ['technology', 'closing']),
    fact('fact-mi-comparison', 'Technology', 'MI Comparison Tool', 'Quotes every MI provider in minutes', 'Ensure borrowers get the lowest MI cost available — easy win when comparing against competitors.', ['technology', 'pricing']),
    fact('fact-quick-qualify', 'Support', 'Quick Qualify', 'Income verification answers within ~2 hours', 'Move files forward with confidence when income is the question. Huge differentiator for self-employed and complex files.', ['support', 'income']),
    fact('fact-income-desk', 'Support', 'Income Desk', 'Fast calcs for self-employed, variable, rental income', 'Specialized support for the scenarios that stall files elsewhere. Pair with Step Ahead for agent confidence.', ['support', 'income']),
    fact('fact-scenario-desk', 'Support', 'Scenario Desk', 'UW questions on income, credit, collateral', 'Full desk for complicated or unique scenarios — you are not guessing in front of the agent.', ['support', 'underwriting']),
    fact('fact-marketing-team', 'Support', 'Full Marketing Team', 'Co-branded materials, social, events, video/design, 100s of downloads', 'Co-branded marketing, social support, event sponsorship help, and a library of instantly branded content. Offer co-marketing as a partnership benefit.', ['support', 'marketing']),
    fact('fact-dedicated-processor', 'Support', 'Dedicated Processor', 'Dedicated processor on every file', 'Consistency and accountability agents can feel. Not a rotating cast — one processor knows your file.', ['support', 'operations']),
    fact('fact-ctc-speed', 'Support', 'Clear-to-Close Speed', '~15.71 day average CTC; ~1 day UW turn', 'In-house underwriting and processing with speed that protects contract dates. Cite when agents worry about timelines.', ['support', 'speed']),
    fact('fact-closing-excellence', 'Support', 'Best-in-Class Closing', '75% closed on/before CD date; no funding auth wait at table', 'Clients and partners are not waiting at the table unnecessarily. Operational proof beats promises.', ['support', 'closing']),
    fact('fact-pinchi-hitter', 'Support', 'Pinch Hitter', 'Vacation coverage with full file access', 'Peer coverage while you are away — agents still get answers. Shows institutional support behind your personal brand.', ['support', 'coverage']),
    fact('fact-homenow-ratedrop', 'Programs', 'HomeNow & RateDrop', 'DPA and rate-focused programs for today\'s buyers', 'Conventional, FHA, VA, USDA plus HomeNow, RateDrop, Calque, equity leverage (buy before sell), bank statement, HELOC, DSCR, and one-time close construction.', ['programs', 'products']),
    fact('fact-builder-pricing', 'Programs', 'Builder Generated Pricing', '80bps comp + 1% or $2k borrower credit on builder deals', 'Win builder relationships with aggressive pricing and credits that help buyers afford new construction.', ['programs', 'builders']),
    fact('fact-branch-pricing', 'Programs', 'Branch Generated Pricing', '50bps comp for aggressive branch-sourced deals', 'Earn competitive deals without sacrificing comp — useful when an agent brings a rate-sensitive buyer.', ['programs', 'pricing']),
    fact('fact-leadership-culture', 'Culture', 'Leadership & Culture', 'Direct access to leadership; borrower/partner/employee experience first', 'Approachable leadership, annual sales rally, President\'s Club for top producers, 98.5% customer satisfaction, Top 100 / Inc 500 recognition.', ['culture', 'recruiting']),
    fact('fact-lo-testimonials', 'Culture', 'LO Testimonials — Why Ruoff', 'Real quotes from producers on culture, ops, and technology', '<p>Producers consistently cite: family culture, operations that “go the extra mile,” accessible leadership, unmatched technology (Ruoff+), and marketing support.</p><ul class="mt-3 space-y-2 text-sm list-disc pl-4"><li><strong>Ryan Vannatter (10 yr):</strong> “Ruoff exceeded 100% of what they promised when I joined.”</li><li><strong>Tracy Adams (26 yr):</strong> “You’re never just a number — leadership owns mistakes and makes them right.”</li><li><strong>Nick Staker:</strong> “Strong ops + direct access to decision-makers let me scale without losing service.”</li><li><strong>Brandon Behny (returnee):</strong> “After coming back, I will never work for another lender.”</li></ul>', ['culture', 'testimonials'])
  ];
})();