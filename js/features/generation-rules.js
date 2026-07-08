/**
 * js/features/generation-rules.js
 *
 * Background quality rules — always on, no UI.
 * Injects compliance, source citation, local-first, and AI-search-friendly
 * instructions into newsletter, blog, and social prompts.
 */
(function () {
  'use strict';

  const RULE_DEFS = [
    {
      id: 'strictCompliance',
      promptLines: [
        'COMPLIANCE (always on): NEVER quote, mention, suggest, or imply ANY specific mortgage interest rates, APRs, or numeric rate figures anywhere.',
        'Use only general language like "rates have shifted recently" without numbers. Include appropriate disclaimers where relevant.',
        'Avoid trigger terms and lender comparisons beyond Ruoff Mortgage when applicable.',
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
        'Reference neighborhoods, regional programs, and community touchpoints where natural — not generic national filler.',
        'When local specifics are unknown, use safe evergreen local framing without inventing statistics.',
      ],
    },
    {
      id: 'aiSearchFriendly',
      promptLines: [
        'AI-SEARCH / GEO (always on): Structure content so search engines and AI assistants can extract clear answers.',
        'Use descriptive headings, short scannable paragraphs, and explicit Q&A where appropriate.',
        'Naturally mention the loan officer name, company (Ruoff Mortgage), and local market — never keyword-stuff.',
      ],
    },
  ];

  const QUALITY_NOTE_TEXT =
    'Built for compliance (no specific rate quotes), credible sources, local relevance, and clear structure for search & AI visibility.';

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