/**
 * js/features/generation-rules.js
 *
 * Background quality rules — always on, no UI.
 * Injects compliance, source citation, local-first, AI-search-friendly,
 * and hobby/passion restraint into newsletter, blog, social, and plan prompts.
 */
(function () {
  'use strict';

  /** Shared restraint — hobbies are seasoning, not the main course. */
  const HOBBY_RESTRAINT_LINES = [
    'HOBBIES / PASSIONS RESTRAINT (always on): Profile hobbies and lifestyle details are optional seasoning for authenticity — NOT the theme of the whole output.',
    'Never force hobby puns, sports metaphors, or hobby-themed tactics into every section. Loving golf does not mean every post, plan, or script is about golf.',
    'At most 1–2 light hobby-tied ideas or examples unless the user explicitly asked for heavy hobby integration or selected a hobbies-only content theme.',
    'Market, rates (general language only), process, compliance, partner business, and pipeline work stay professional — do not shoehorn hobbies into those.',
    'When hobbies are used: keep them natural, specific, and sparse. Prefer one genuine touch over a laundry list of passion-branded plays.',
  ];

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
    {
      id: 'hobbyRestraint',
      promptLines: HOBBY_RESTRAINT_LINES,
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

  /** Compact block for business plans / weekly plans that build their own prompts. */
  function buildHobbyRestraintBlock() {
    return [
      '',
      'HOBBIES / PASSIONS RESTRAINT (critical — do not overdo personalization):',
      ...HOBBY_RESTRAINT_LINES.map((line) => '- ' + line),
      '- Power themes and tactics may be *inspired* by life/values; they must not turn the entire plan into a hobby brand.',
      '- Rough guide for plans: at most ~2–3 of 10 tactics may lean on hobbies; the rest = partners, pipeline, process, numbers, and discipline.',
      '',
    ].join('\n');
  }

  function getQualityNoteHtml() {
    return `<p class="nl-quality-note text-xs text-gray-500 dark:text-gray-400 m-0 mt-2 flex items-start gap-2 leading-relaxed">
      <i class="fas fa-shield-alt text-[#00A89D] mt-0.5 flex-shrink-0"></i>
      <span>${QUALITY_NOTE_TEXT}</span>
    </p>`;
  }

  window.GenerationRules = {
    buildPromptBlock,
    buildHobbyRestraintBlock,
    getQualityNoteHtml,
    getQualityNoteText: () => QUALITY_NOTE_TEXT,
  };

  window.buildGenerationRulesPromptBlock = buildPromptBlock;
  window.buildHobbyRestraintPromptBlock = buildHobbyRestraintBlock;
})();