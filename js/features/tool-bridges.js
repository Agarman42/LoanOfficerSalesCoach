/**
 * Tool Bridges — opt-in handoffs between coach tools (loan officer).
 * Pattern is reusable for LO / Realtor apps with different appId + storage keys.
 *
 * Principles: off by default, small context slices, user picks the link.
 */
(function () {
  'use strict';

  const APP_ID = 'lo';

  const KEYS = {
    annualContext: `${APP_ID}_savedBusinessPlanContext`,
    annualMarkdown: `${APP_ID}_savedBusinessPlanMarkdown`,
    alignAnnual: `${APP_ID}_align-annual-plan`,
    annualMilestone: `${APP_ID}_annual-milestone-focus`
  };

  const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

  const MAX_SECTION_CHARS = 320;
  const MAX_QUARTERLY_SECTION_CHARS = 8000;
  const MAX_PROMPT_SLICE_CHARS = 500;

  const NURTURE_SCRIPT_BRIDGES = {
    'a-plus-vips': {
      categoryKey: 'relationship-nurturing',
      scenarioValue: 'Birthday, closing anniversary, or home anniversary check-in',
      contextPrefix: 'A+ VIP platinum tier — disproportionate presence and generosity.'
    },
    'past-clients': {
      categoryKey: 'relationship-nurturing',
      scenarioValue: "Reinforce 'I'm your loan officer for life'",
      contextPrefix: 'Past clients — loan officer for life nurturing.'
    },
    'sphere-of-influence': {
      categoryKey: 'asking-for-business',
      scenarioValue: 'Ask a past client for referrals',
      contextPrefix: 'Sphere of influence — warm network, no cold pitch.'
    },
    'referral-partners': {
      categoryKey: 'realtor-conversations',
      scenarioValue: 'Ask a realtor for a 1:1 meeting / coffee',
      contextPrefix: 'Referral partner / realtor nurture touch.'
    },
    'community-connections': {
      categoryKey: 'relationship-nurturing',
      scenarioValue: 'Offer value to a realtor partner (no ask)',
      contextPrefix: 'Community connections — local presence, genuine value.'
    },
    'prospects': {
      categoryKey: 'most-common',
      scenarioValue: "I'm just shopping around / getting information",
      contextPrefix: 'Database prospects — had interest but not closed yet.'
    }
  };

  function truncate(text, max) {
    const t = (text || '').replace(/\s+/g, ' ').trim();
    if (!t) return '';
    return t.length <= max ? t : t.slice(0, max - 1) + '…';
  }

  function getCurrentQuarter() {
    const m = new Date().getMonth();
    if (m < 3) return 'Q1';
    if (m < 6) return 'Q2';
    if (m < 9) return 'Q3';
    return 'Q4';
  }

  function cleanSectionBody(body) {
    return (body || '')
      .replace(/^#+\s+/gm, '')
      .replace(/^\*\s+/gm, '')
      .replace(/\*\*/g, '')
      .trim();
  }

  function extractSection(source, headingNeedle, maxChars) {
    if (!source) return '';
    const limit = maxChars || MAX_SECTION_CHARS;

    const mdRe = new RegExp(
      `^#{1,3}\\s*[^\\n]*${headingNeedle}[^\\n]*\\n([\\s\\S]*?)(?=^#{1,3}\\s|$)`,
      'im'
    );
    const mdMatch = source.match(mdRe);
    if (mdMatch) return truncate(cleanSectionBody(mdMatch[1]), limit);

    const plainRe = new RegExp(
      `(?:^|\\n)\\s*${headingNeedle}\\s*\\n+([\\s\\S]*?)(?=\\n\\s*(?:#{1,3}\\s+)?(?:Your 2026|Executive|Revenue Model|Strategic Focus|Quarterly Milestones|Weekly Rhythm|Tactics|Tool Ties|Personal Fuel|Obstacles|Key Success|12-Month)|$)`,
      'i'
    );
    const plainMatch = source.match(plainRe);
    if (plainMatch) return truncate(cleanSectionBody(plainMatch[1]), limit);

    return '';
  }

  function getQuarterlyBlock(source) {
    return extractSection(source, 'Quarterly Milestones', MAX_QUARTERLY_SECTION_CHARS);
  }

  function parseQuarterChunk(chunk) {
    return truncate(
      chunk
        .replace(/^[:–—\-\s).]+/, '')
        .replace(/^#{1,3}\s+/, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
      MAX_SECTION_CHARS
    );
  }

  function quarterLabelToKey(label) {
    const t = (label || '').toUpperCase();
    if (/\bQ1\b/.test(t) || /QUARTER\s*1/.test(t) || /FIRST\s*QUARTER/.test(t)) return 'Q1';
    if (/\bQ2\b/.test(t) || /QUARTER\s*2/.test(t) || /SECOND\s*QUARTER/.test(t)) return 'Q2';
    if (/\bQ3\b/.test(t) || /QUARTER\s*3/.test(t) || /THIRD\s*QUARTER/.test(t)) return 'Q3';
    if (/\bQ4\b/.test(t) || /QUARTER\s*4/.test(t) || /FOURTH\s*QUARTER/.test(t)) return 'Q4';
    return null;
  }

  function extractQuarterlyMilestonesFromBlock(block) {
    const milestones = {};
    if (!block) return milestones;

    const markerRe = /(?:^|[\n\r])\s*(?:#{1,3}\s*)?(?:[-*]\s*)?(?:\*\*)?(?:Q([1-4])|Quarter\s*([1-4]))\b[^\n\r]*/gi;
    const matches = [...block.matchAll(markerRe)];

    if (matches.length) {
      matches.forEach((match, idx) => {
        const qNum = match[1] || match[2];
        const start = match.index + match[0].length;
        const end = idx + 1 < matches.length ? matches[idx + 1].index : block.length;
        const parsed = parseQuarterChunk(block.slice(start, end));
        if (parsed) milestones[`Q${qNum}`] = parsed;
      });
      return milestones;
    }

    QUARTERS.forEach((q, i) => {
      const qNum = i + 1;
      const patterns = [
        new RegExp(
          `(?:^|[\\n\\r])\\s*(?:#{1,3}\\s*)?(?:\\*\\*)?${q}\\b[^\\n\\r]*[:–—\\-]?\\s*([\\s\\S]*?)(?=(?:^|[\\n\\r])\\s*(?:#{1,3}\\s*)?(?:\\*\\*)?Q[1-4]\\b|$)`,
          'i'
        ),
        new RegExp(
          `(?:^|[\\n\\r])\\s*(?:\\*\\*)?Quarter\\s*${qNum}\\b[^\\n\\r]*[:–—\\-]?\\s*([\\s\\S]*?)(?=(?:^|[\\n\\r])\\s*(?:\\*\\*)?(?:Quarter\\s*[1-4]|Q[1-4])\\b|$)`,
          'i'
        ),
        new RegExp(`\\(${q}\\)\\s*[:–—\\-]?\\s*([^\\n\\r]+)`, 'i'),
        new RegExp(`\\b${q}\\s*[:–—\\-]\\s*([^\\n\\r]+)`, 'i')
      ];
      for (const re of patterns) {
        const m = block.match(re);
        if (m && m[1]) {
          const parsed = parseQuarterChunk(m[1]);
          if (parsed) {
            milestones[q] = parsed;
            break;
          }
        }
      }
    });

    return milestones;
  }

  function extractQuarterlyFromPlanPreviewDom() {
    const preview = document.getElementById('plan-preview');
    if (!preview) return {};

    const h2s = [...preview.querySelectorAll('h2')];
    const sectionH2 = h2s.find(h => /quarterly\s*milestones/i.test(h.textContent || ''));
    if (!sectionH2) return {};

    const milestones = {};
    let currentQ = null;
    let node = sectionH2.nextElementSibling;

    const flush = () => {
      if (!currentQ || !milestones[`_buf_${currentQ}`]) return;
      milestones[currentQ] = parseQuarterChunk(milestones[`_buf_${currentQ}`].join(' '));
      delete milestones[`_buf_${currentQ}`];
    };

    while (node && node.tagName !== 'H2') {
      const tag = node.tagName;
      const text = (node.textContent || '').trim();
      if (!text) {
        node = node.nextElementSibling;
        continue;
      }

      if (tag === 'H3' || tag === 'H4' || (tag === 'P' && text.length < 100)) {
        const key = quarterLabelToKey(text);
        if (key) {
          flush();
          currentQ = key;
          const afterLabel = text.replace(/^[^:–—-]+[:–—-]\s*/, '').trim();
          if (afterLabel && afterLabel !== text) {
            milestones[`_buf_${currentQ}`] = milestones[`_buf_${currentQ}`] || [];
            milestones[`_buf_${currentQ}`].push(afterLabel);
          }
          node = node.nextElementSibling;
          continue;
        }
      }

      if (currentQ) {
        milestones[`_buf_${currentQ}`] = milestones[`_buf_${currentQ}`] || [];
        milestones[`_buf_${currentQ}`].push(text);
      } else {
        const inline = quarterLabelToKey(text);
        if (inline) {
          currentQ = inline;
          const rest = text.replace(/.*?\bQ[1-4]\b\s*[:–—-]?\s*/i, '').trim();
          if (rest) {
            milestones[`_buf_${currentQ}`] = [rest];
          }
        }
      }

      node = node.nextElementSibling;
    }

    flush();
    return milestones;
  }

  function extractQuarterlyMilestones(source) {
    const block = getQuarterlyBlock(source);
    let milestones = extractQuarterlyMilestonesFromBlock(block);

    if (Object.keys(milestones).length < 2) {
      const domMilestones = extractQuarterlyFromPlanPreviewDom();
      QUARTERS.forEach(q => {
        if (!milestones[q] && domMilestones[q]) milestones[q] = domMilestones[q];
      });
    }

    if (!Object.keys(milestones).length && block) {
      milestones[getCurrentQuarter()] = truncate(block.replace(/\n/g, ' '), MAX_SECTION_CHARS);
    }

    return milestones;
  }

  function buildMilestonesList(quarterly, sectionFallback) {
    const fallback = sectionFallback || '';
    return QUARTERS.map(q => {
      const text = quarterly[q] || '';
      const label = text
        ? `${q}: ${truncate(text, 80)}`
        : `${q}: (see your 2026 plan — no separate line parsed)`;
      return {
        id: q.toLowerCase(),
        label,
        text: text || (q === getCurrentQuarter() ? fallback : '')
      };
    });
  }

  function getPlanSourceText() {
    try {
      const md = localStorage.getItem(KEYS.annualMarkdown);
      if (md && md.trim().length > 80) return md;
    } catch (e) { /* ignore */ }

    const preview = document.getElementById('plan-preview');
    if (preview) {
      const text = (preview.innerText || preview.textContent || '').trim();
      if (text.length > 80) return text;
    }

    return '';
  }

  function parseAnnualPlanMarkdown(markdown) {
    const quarterlyBlock = getQuarterlyBlock(markdown);
    const quarterly = extractQuarterlyMilestones(markdown);
    return {
      app: APP_ID,
      updatedAt: new Date().toISOString(),
      powerTheme: extractSection(markdown, 'Power Theme') || extractSection(markdown, 'Your 2026 Power Theme'),
      executiveSnapshot: extractSection(markdown, 'Executive Snapshot'),
      strategicFocus: extractSection(markdown, 'Strategic Focus') || extractSection(markdown, '2026 Strategic Focus') || extractSection(markdown, 'Scaling Path'),
      weeklyRhythm: extractSection(markdown, 'Weekly Rhythm') || extractSection(markdown, 'Scorecard'),
      quarterlyMilestones: quarterly,
      milestonesList: buildMilestonesList(quarterly, quarterlyBlock)
    };
  }

  function saveAnnualPlanMarkdown(markdown) {
    if (!markdown || markdown.trim().length < 50) return;
    localStorage.setItem(KEYS.annualMarkdown, markdown);
  }

  function saveAnnualPlanContext(markdown, opts) {
    const fromApi = opts && opts.fromApi;
    const source = markdown || getPlanSourceText();
    if (!source || source.trim().length < 50) return null;
    if (fromApi || (markdown && /^#{1,3}\s/m.test(markdown))) {
      saveAnnualPlanMarkdown(markdown);
    }
    const ctx = parseAnnualPlanMarkdown(source);
    localStorage.setItem(KEYS.annualContext, JSON.stringify(ctx));
    refreshAnnualBridgeUI();
    return ctx;
  }

  function rebuildAnnualContextFromDom() {
    const md = localStorage.getItem(KEYS.annualMarkdown);
    if (md && md.trim().length > 80) {
      return saveAnnualPlanContext(md);
    }
    const preview = document.getElementById('plan-preview');
    const plain = (preview?.innerText || preview?.textContent || '').trim();
    if (plain.length < 80) return null;
    return saveAnnualPlanContext(plain);
  }

  function loadAnnualPlanContext() {
    try {
      const raw = localStorage.getItem(KEYS.annualContext);
      if (!raw) return null;
      const ctx = JSON.parse(raw);
      return ctx && ctx.app === APP_ID ? ctx : null;
    } catch {
      return null;
    }
  }

  function isAlignAnnualEnabled() {
    return localStorage.getItem(KEYS.alignAnnual) === 'true';
  }

  function getSelectedMilestoneId() {
    return localStorage.getItem(KEYS.annualMilestone) || getCurrentQuarter().toLowerCase();
  }

  function getAnnualPlanPromptSlice() {
    if (!isAlignAnnualEnabled()) return '';

    let ctx = loadAnnualPlanContext();
    if (!ctx) {
      ctx = rebuildAnnualContextFromDom();
    }
    if (!ctx) return '';

    const milestoneId = getSelectedMilestoneId();
    const qKey = milestoneId.toUpperCase();
    const milestoneText =
      ctx.quarterlyMilestones?.[qKey] ||
      ctx.milestonesList?.find(m => m.id === milestoneId)?.text ||
      '';

    const parts = [];
    if (ctx.powerTheme) parts.push(`Power theme (direction only): ${ctx.powerTheme}`);
    if (milestoneText) parts.push(`Milestone focus this week (${qKey}): ${milestoneText}`);
    if (ctx.strategicFocus) parts.push(`Strategic focus: ${truncate(ctx.strategicFocus, 200)}`);
    if (ctx.weeklyRhythm) parts.push(`Weekly rhythm note: ${truncate(ctx.weeklyRhythm, 160)}`);

    if (!parts.length) return '';

    const slice = parts.join('\n');
    return `

OPTIONAL 2026 PLAN ALIGNMENT (loan officer opted in — use only as directional emphasis):
${truncate(slice, MAX_PROMPT_SLICE_CHARS)}

Important: Do NOT recycle plan wording verbatim. Generate fresh, specific daily tasks. Alignment should shape emphasis and priorities, not duplicate sentences from the annual plan.`;
  }

  function sendIdeaToSocial(idea, sourceLabel) {
    const seed = (idea || '').trim();
    if (!seed) return;

    const postType = document.getElementById('post-type');
    const details = document.getElementById('post-details');
    const customIdea = `Behind the scenes of my week as a loan officer — ${seed}`;

    if (typeof window.showSection === 'function') window.showSection('social');

    setTimeout(() => {
      if (postType) {
        const opt = Array.from(postType.options).find(o =>
          o.value && o.value.toLowerCase().includes('behind the scenes')
        );
        if (opt) postType.value = opt.value;
        else postType.selectedIndex = 0;
      }
      if (details) {
        details.value = customIdea;
        details.focus();
      }
      if (typeof window.showToast === 'function') {
        window.showToast(
          sourceLabel
            ? `Social Creator opened — seeded from ${sourceLabel}`
            : 'Social Creator opened with your idea',
          'info'
        );
      }
    }, 400);
  }

  function sendTaskToSocial(dayIndex, blockIndex, taskIndex) {
    const days = window.currentWeeklyDays;
    if (!days || !days[dayIndex]) return;
    const task = days[dayIndex].blocks?.[blockIndex]?.tasks?.[taskIndex];
    if (!task) return;
    const day = days[dayIndex].day || 'this week';
    const idea = `${day}: ${task.task}${task.tip ? ` (${task.tip})` : ''}`;
    sendIdeaToSocial(idea, 'weekly task');
  }

  function sendWeekThemeToSocial() {
    const summary = window.currentWeeklyPlanMeta?.summary ||
      window.savedWeeklyPlan?.summary || '';
    if (!summary) {
      if (typeof window.showToast === 'function') window.showToast('Generate a weekly plan first.');
      return;
    }
    sendIdeaToSocial(summary, 'week theme');
  }

  function bridgeNurtureToScript(pillarId, sampleScript) {
    const bridge = NURTURE_SCRIPT_BRIDGES[pillarId];
    const context = [
      bridge?.contextPrefix || 'Prospect nurturing context:',
      sampleScript ? `Sample language reference (do not copy verbatim): ${sampleScript}` : ''
    ].filter(Boolean).join('\n');

    if (typeof window.bridgeToScriptGenerator === 'function') {
      window.bridgeToScriptGenerator({
        categoryKey: bridge?.categoryKey || 'most-common',
        scenarioValue: bridge?.scenarioValue || '',
        context
      });
    } else if (typeof window.showSection === 'function') {
      window.showSection('sales-script');
      setTimeout(() => {
        const ta = document.getElementById('script-context');
        if (ta) ta.value = context;
      }, 400);
    }
  }

  function refreshAnnualBridgeUI() {
    const panel = document.getElementById('annual-plan-bridge-panel');
    if (!panel) return;

    let ctx = loadAnnualPlanContext();
    const parsedCount = ctx?.milestonesList?.filter(m => m.text && !m.label.includes('no separate line parsed')).length || 0;
    if (!ctx || parsedCount < 2) {
      ctx = rebuildAnnualContextFromDom() || ctx;
    }

    const status = panel.querySelector('#annual-bridge-status');
    const controls = panel.querySelector('#annual-bridge-controls');
    const milestoneWrap = panel.querySelector('#annual-milestone-wrap');
    const checkbox = panel.querySelector('#wwp-align-annual');
    const select = panel.querySelector('#wwp-annual-milestone');

    if (!ctx || !ctx.milestonesList?.length) {
      if (status) {
        status.classList.remove('hidden');
        status.innerHTML = 'No 2026 plan found yet. <button type="button" class="text-[#00A89D] font-semibold underline" id="annual-bridge-goto-plan">Generate your 2026 Business Plan</button> first — then optionally link it here.';
      }
      if (controls) controls.classList.add('opacity-50', 'pointer-events-none');
      panel.querySelector('#annual-bridge-goto-plan')?.addEventListener('click', () => {
        if (typeof window.showSection === 'function') window.showSection('planning');
      });
      return;
    }

    if (status) status.classList.add('hidden');
    if (controls) controls.classList.remove('opacity-50', 'pointer-events-none');

    if (select) {
      const current = getSelectedMilestoneId();
      select.innerHTML = ctx.milestonesList.map(m =>
        `<option value="${m.id}" ${m.id === current ? 'selected' : ''}>${m.label.replace(/</g, '&lt;')}</option>`
      ).join('');
      if (!select.value && ctx.milestonesList.length) {
        const defaultQ = getCurrentQuarter().toLowerCase();
        const match = ctx.milestonesList.find(m => m.id === defaultQ);
        select.value = match ? match.id : ctx.milestonesList[0].id;
      }
    }

    if (checkbox) checkbox.checked = isAlignAnnualEnabled();
    if (milestoneWrap) {
      milestoneWrap.classList.toggle('hidden', !checkbox?.checked);
    }
  }

  function injectAnnualBridgeUI() {
    const mount = document.getElementById('generate-plan-wrapper');
    if (!mount || document.getElementById('annual-plan-bridge-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'annual-plan-bridge-panel';
    panel.className = 'bg-white dark:bg-gray-800 border border-dashed border-[#002B5C]/30 rounded-3xl p-6 mb-8';
    panel.innerHTML = `
      <div class="flex items-start gap-3 mb-3">
        <span class="w-9 h-9 rounded-2xl bg-[#002B5C]/10 flex items-center justify-center shrink-0"><i class="fas fa-link text-[#002B5C] dark:text-white"></i></span>
        <div class="flex-1">
          <div class="text-sm font-bold tracking-wider text-[#002B5C] dark:text-white">OPTIONAL: LINK TO 2026 PLAN</div>
          <p class="text-xs text-gray-500 mt-1">Off by default. When enabled, your weekly plan gets a <em>small</em> slice of annual direction — tasks stay fresh and creative.</p>
        </div>
      </div>
      <div id="annual-bridge-status" class="text-sm text-gray-600 dark:text-gray-400 mb-3 hidden"></div>
      <div id="annual-bridge-controls">
        <label class="flex items-start gap-3 cursor-pointer mb-3">
          <input type="checkbox" id="wwp-align-annual" class="w-5 h-5 mt-0.5 accent-[#002B5C]">
          <span class="text-sm"><strong>Align this week with my 2026 Business Plan</strong><br><span class="text-xs text-gray-500">Passes milestone + theme as emphasis only — not a copy-paste.</span></span>
        </label>
        <div id="annual-milestone-wrap" class="hidden pl-8">
          <label class="text-xs font-semibold text-gray-500 block mb-1">Which milestone drives this week?</label>
          <select id="wwp-annual-milestone" class="w-full max-w-lg p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"></select>
        </div>
      </div>`;

    mount.parentNode.insertBefore(panel, mount);

    const checkbox = panel.querySelector('#wwp-align-annual');
    const select = panel.querySelector('#wwp-annual-milestone');
    const milestoneWrap = panel.querySelector('#annual-milestone-wrap');

    checkbox?.addEventListener('change', () => {
      localStorage.setItem(KEYS.alignAnnual, checkbox.checked ? 'true' : 'false');
      milestoneWrap?.classList.toggle('hidden', !checkbox.checked);
    });

    select?.addEventListener('change', () => {
      localStorage.setItem(KEYS.annualMilestone, select.value);
    });

    refreshAnnualBridgeUI();
  }

  function init() {
    injectAnnualBridgeUI();
    refreshAnnualBridgeUI();

    if (!loadAnnualPlanContext() && localStorage.getItem('savedBusinessPlan')) {
      setTimeout(rebuildAnnualContextFromDom, 300);
    }
  }

  window.ToolBridges = {
    APP_ID,
    KEYS,
    saveAnnualPlanMarkdown,
    saveAnnualPlanContext,
    rebuildAnnualContextFromDom,
    loadAnnualPlanContext,
    getAnnualPlanPromptSlice,
    isAlignAnnualEnabled,
    sendIdeaToSocial,
    sendTaskToSocial,
    sendWeekThemeToSocial,
    bridgeNurtureToScript,
    refreshAnnualBridgeUI,
    init
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 200));
  } else {
    setTimeout(init, 200);
  }
})();