/**
 * Weekly Execution Scorecard — track funnel activity vs Ruoff 2026 recruiting targets.
 * Shape remains system of record; this is a lightweight coaching mirror in-browser.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'recruitingWeeklyScorecard';

  function getWeekKey(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  function getWeekLabel(weekKey) {
    const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
    if (!match) return weekKey;
    return `Week ${parseInt(match[2], 10)}, ${match[1]}`;
  }

  function loadAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveAll(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getTargets() {
    const m = window.RECRUITING_METRICS?.weekly || {};
    const qc = m.qualityConversations || {};
    const sched = m.executiveCallsScheduled || {};
    const done = m.executiveCallsCompleted || {};
    return {
      outreach: m.outreachAttempts || 270,
      qualityConvos: qc.max || qc.min || 25,
      execScheduled: Math.round(((sched.min || 4.8) + (sched.max || 5.1)) / 2 * 10) / 10,
      execCompleted: Math.round(((done.min || 3.6) + (done.max || 3.8)) / 2 * 10) / 10,
      socialConnections: 17
    };
  }

  function pct(actual, target) {
    if (!target) return 0;
    return Math.min(100, Math.round((actual / target) * 100));
  }

  function barColor(p) {
    if (p >= 90) return 'bg-[#00A89D]';
    if (p >= 60) return 'bg-[#F15A29]';
    return 'bg-gray-400';
  }

  function renderScorecard(container) {
    if (!container || container.dataset.scorecardReady) return;

    const weekKey = getWeekKey(new Date());
    const targets = getTargets();
    const all = loadAll();
    const week = all[weekKey] || {
      outreach: 0,
      qualityConvos: 0,
      execScheduled: 0,
      execCompleted: 0,
      socialConnections: 0,
      notes: ''
    };

    container.innerHTML = `
      <div id="recruiting-scorecard" class="mb-8 rounded-3xl border-2 border-[#002B5C]/20 bg-gradient-to-br from-[#002B5C]/5 via-white to-[#00A89D]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 shadow-lg">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F15A29]/10 text-[#F15A29] text-[10px] font-bold tracking-[1.5px]">WEEKLY EXECUTION SCORECARD</span>
            <h3 class="text-xl font-bold text-[#002B5C] dark:text-white mt-2">${getWeekLabel(weekKey)}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Log activity from Shape at end of day — quick pulse vs team targets. Tue–Thu weighted for outreach.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" id="scorecard-copy" class="text-xs px-4 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D] hover:text-white transition">
              <i class="fas fa-copy"></i> Copy standup summary
            </button>
            <button type="button" id="scorecard-reset" class="text-xs px-4 py-2 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-100 transition">Reset week</button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          ${[
            { id: 'outreach', label: 'Outreach attempts', target: targets.outreach, val: week.outreach },
            { id: 'qualityConvos', label: 'Quality convos', target: targets.qualityConvos, val: week.qualityConvos },
            { id: 'execScheduled', label: 'Exec calls sched.', target: targets.execScheduled, val: week.execScheduled, step: 0.1 },
            { id: 'execCompleted', label: 'Exec calls done', target: targets.execCompleted, val: week.execCompleted, step: 0.1 },
            { id: 'socialConnections', label: 'New connections', target: targets.socialConnections, val: week.socialConnections }
          ].map(field => {
            const p = pct(field.val, field.target);
            return `
              <div class="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <div class="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">${field.label}</div>
                <div class="flex items-end gap-2 mt-2">
                  <input type="number" min="0" step="${field.step || 1}" data-metric="${field.id}"
                         value="${field.val}"
                         class="w-20 text-2xl font-black text-[#002B5C] dark:text-white bg-transparent border-b-2 border-[#00A89D] focus:outline-none tabular-nums">
                  <span class="text-xs text-gray-400 mb-1">/ ${field.target}</span>
                </div>
                <div class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-3 overflow-hidden">
                  <div class="h-full ${barColor(p)} transition-all duration-300" style="width:${p}%"></div>
                </div>
                <div class="text-[10px] text-gray-500 mt-1" data-pct-label="${field.id}">${p}% of target</div>
              </div>`;
          }).join('')}
        </div>

        <div class="flex flex-wrap items-center gap-3 text-sm">
          <span id="scorecard-overall" class="font-semibold text-[#002B5C] dark:text-white"></span>
          <span class="text-gray-300">|</span>
          <span class="text-gray-500">Best outreach days: <strong class="text-[#00A89D]">${(window.RECRUITING_METRICS?.weekly?.bestOutreachDays || ['Tue','Wed','Thu']).join(' · ')}</strong></span>
          <button type="button" onclick="if(typeof window.openExecCallPrep==='function')window.openExecCallPrep()" class="ml-auto text-xs text-[#F15A29] font-semibold hover:underline">
            <i class="fas fa-clipboard-check"></i> Exec call prep
          </button>
        </div>

        <div class="mt-4">
          <label class="text-xs font-semibold text-gray-500">Week notes (wins, blockers)</label>
          <textarea id="scorecard-notes" rows="2" class="w-full mt-1 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                    placeholder="e.g. Strong Tue phone block — 3 quality convos. Need more LinkedIn connections...">${week.notes || ''}</textarea>
        </div>
      </div>`;

    container.dataset.scorecardReady = '1';

    function persist() {
      const entry = {
        outreach: parseInt(container.querySelector('[data-metric="outreach"]')?.value, 10) || 0,
        qualityConvos: parseInt(container.querySelector('[data-metric="qualityConvos"]')?.value, 10) || 0,
        execScheduled: parseFloat(container.querySelector('[data-metric="execScheduled"]')?.value) || 0,
        execCompleted: parseFloat(container.querySelector('[data-metric="execCompleted"]')?.value) || 0,
        socialConnections: parseInt(container.querySelector('[data-metric="socialConnections"]')?.value, 10) || 0,
        notes: container.querySelector('#scorecard-notes')?.value || ''
      };
      const store = loadAll();
      store[weekKey] = entry;
      saveAll(store);
      updateOverall(entry, targets);
      refreshBars(entry, targets);
    }

    function updateOverall(entry, t) {
      const scores = [
        pct(entry.outreach, t.outreach),
        pct(entry.qualityConvos, t.qualityConvos),
        pct(entry.execScheduled, t.execScheduled),
        pct(entry.execCompleted, t.execCompleted),
        pct(entry.socialConnections, t.socialConnections)
      ];
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const el = container.querySelector('#scorecard-overall');
      if (el) {
        el.textContent = `Overall execution: ${avg}% of weekly targets`;
        el.className = `font-semibold ${avg >= 80 ? 'text-[#00A89D]' : avg >= 50 ? 'text-[#F15A29]' : 'text-gray-600'}`;
      }
    }

    function refreshBars(entry, t) {
      const fields = [
        ['outreach', entry.outreach, t.outreach],
        ['qualityConvos', entry.qualityConvos, t.qualityConvos],
        ['execScheduled', entry.execScheduled, t.execScheduled],
        ['execCompleted', entry.execCompleted, t.execCompleted],
        ['socialConnections', entry.socialConnections, t.socialConnections]
      ];
      fields.forEach(([id, val, target]) => {
        const input = container.querySelector(`[data-metric="${id}"]`);
        const card = input?.closest('.rounded-2xl');
        const bar = card?.querySelector('.h-full');
        const pctEl = container.querySelector(`[data-pct-label="${id}"]`);
        const p = pct(val, target);
        if (bar) {
          bar.style.width = p + '%';
          bar.className = `h-full ${barColor(p)} transition-all duration-300`;
        }
        if (pctEl) pctEl.textContent = `${p}% of target`;
      });
    }

    container.querySelectorAll('[data-metric]').forEach(input => {
      input.addEventListener('change', persist);
      input.addEventListener('input', persist);
    });
    container.querySelector('#scorecard-notes')?.addEventListener('input', persist);

    container.querySelector('#scorecard-copy')?.addEventListener('click', () => {
      const entry = loadAll()[weekKey] || week;
      const lines = [
        `Recruiting scorecard — ${getWeekLabel(weekKey)}`,
        `Outreach: ${entry.outreach}/${targets.outreach}`,
        `Quality convos: ${entry.qualityConvos}/${targets.qualityConvos}`,
        `Exec calls scheduled: ${entry.execScheduled}/${targets.execScheduled}`,
        `Exec calls completed: ${entry.execCompleted}/${targets.execCompleted}`,
        `New connections: ${entry.socialConnections}/${targets.socialConnections}`,
        entry.notes ? `Notes: ${entry.notes}` : ''
      ].filter(Boolean).join('\n');
      navigator.clipboard.writeText(lines).then(() => {
        if (typeof window.showToast === 'function') window.showToast('Scorecard copied for standup', 'success');
      }).catch(() => alert(lines));
    });

    container.querySelector('#scorecard-reset')?.addEventListener('click', () => {
      if (!confirm('Reset this week\'s scorecard numbers?')) return;
      const store = loadAll();
      delete store[weekKey];
      saveAll(store);
      delete container.dataset.scorecardReady;
      renderScorecard(container);
    });

    updateOverall(week, targets);
  }

  function init() {
    const section = document.getElementById('weekly-win-plan');
    if (!section) return;

    let mount = document.getElementById('recruiting-scorecard-mount');
    if (!mount) {
      mount = document.createElement('div');
      mount.id = 'recruiting-scorecard-mount';
      const header = section.querySelector('.text-center.mb-6');
      if (header?.nextSibling) {
        section.insertBefore(mount, header.nextSibling);
      } else {
        section.prepend(mount);
      }
    }
    renderScorecard(mount);
  }

  window.initRecruitingScorecard = init;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));
  } else {
    setTimeout(init, 100);
  }
})();