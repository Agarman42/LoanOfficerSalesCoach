/**
 * js/features/generation-rules.js (Realtor)
 *
 * Background quality rules — always on, no UI.
 */
(function () {
  'use strict';

  const RULE_DEFS = [
    {
      id: 'strictCompliance',
      promptLines: [
        'COMPLIANCE (always on): Follow fair housing principles — no discriminatory language, steering, or exclusionary framing.',
        'Never guarantee sale prices, days on market, or specific outcomes. Use educational, accurate real estate language.',
        'When mortgage topics arise, never quote specific interest rates or APRs — refer clients to a licensed lender.',
      ],
    },
    {
      id: 'citeSources',
      promptLines: [
        'SOURCE CITATION (always on): When stating facts, trends, statistics, or news, cite credible sources by name.',
        'Include clickable hyperlinks (target="_blank" rel="noopener") to real, reputable URLs when referencing data or articles.',
        'Never invent source URLs — use only verifiable links or name sources without a link if uncertain.',
      ],
    },
    {
      id: 'localFirst',
      promptLines: [
        'LOCAL-FIRST (always on): Prioritize the user\'s stated local market and area in examples, headlines, and context.',
        'Reference neighborhoods, events, and community touchpoints where natural — not generic national filler.',
        'When local specifics are unknown, use safe evergreen local framing without inventing statistics.',
      ],
    },
    {
      id: 'aiSearchFriendly',
      promptLines: [
        'AI-SEARCH / GEO (always on): Structure content so search engines and AI assistants can extract clear answers.',
        'Use descriptive headings, short scannable paragraphs, and explicit Q&A where appropriate.',
        'Naturally mention the agent name, brokerage/team, and local market — never keyword-stuff.',
      ],
    },
  ];

  const QUALITY_NOTE_TEXT =
    'Built for fair-housing compliance, credible sources, local relevance, and clear structure for search & AI visibility.';

  function buildPromptBlock(toolKey) {
    const lines = [
      '',
      `QUALITY RULES (always applied to this ${toolKey || 'content'}):`,
    ];
    RULE_DEFS.forEach((rule) => {
      rule.promptLines.forEach((line) => lines.push(`- ${line}`));
    });
    return lines;
  }

  function getQualityNoteHtml() {
    return `<p class="nl-quality-note text-xs text-gray-500 dark:text-gray-400 m-0 mt-2 flex items-start gap-2 leading-relaxed">
      <i class="fas fa-shield-alt text-[#00A89D] mt-0.5 flex-shrink-0"></i>
      <span>${QUALITY_NOTE_TEXT}</span>
    </p>`;
  }

  window.GenerationRules = {
    buildPromptBlock,
    getQualityNoteHtml,
    getQualityNoteText: () => QUALITY_NOTE_TEXT,
  };

  window.buildGenerationRulesPromptBlock = buildPromptBlock;
})();