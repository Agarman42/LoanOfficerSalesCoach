/**
 * js/features/prospecting-time-blocks.js
 *
 * Prospecting Time Blocks — Full redesign
 * Generates personalized weekly time blocks using AI + user preferences.
 */

(function () {
  'use strict';

  let currentPTBData = null;

  // =====================================================
  // CENTRAL PROFILE INTEGRATION (consistent with other tools)
  // =====================================================
  function getCentralProfile() {
    try {
      if (window.getUserProfile) return window.getUserProfile();
      return JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch (e) {
      return {};
    }
  }

  // =====================================================
  // UPDATE PROFILE DISPLAY FROM CENTRAL PROFILE
  // =====================================================
  function updatePTBProfileDisplay() {
    const goalEl = document.getElementById('ptb-goal-display');
    const hoursEl = document.getElementById('ptb-hours-display');
    const focusEl = document.getElementById('ptb-focus-display');

    const p = getCentralProfile();

    if (goalEl) goalEl.textContent = p.monthlyUnits || p.monthlyGoal || 8;
    if (hoursEl) hoursEl.textContent = p.hours || '15–20';
    if (focusEl) focusEl.textContent = p.focus || 'Balanced';
    // keep the live summary in sync if profile changes externally
    if (typeof updatePTBLiveSummary === 'function') updatePTBLiveSummary();
  }

  // =====================================================
  // GENERATE PROSPECTING BLOCKS (AI POWERED)
  // =====================================================
  async function generateProspectingBlocks() {
    const btn = document.getElementById('generate-ptb-btn');
    const output = document.getElementById('ptb-output');

    if (!output) return;

    const hours = parseInt(document.getElementById('ptb-hours')?.value) || 15;
    const emphasizeRealtors = document.getElementById('ptb-emphasis-realtors')?.checked;
    const emphasizePast = document.getElementById('ptb-emphasis-past')?.checked;
    const emphasizeEquity = document.getElementById('ptb-emphasis-equity')?.checked;
    const weaveHobbies = document.getElementById('ptb-weave-hobbies')?.checked;

    const focusAreas = [];
    if (emphasizeRealtors) focusAreas.push('Realtor outreach');
    if (emphasizePast) focusAreas.push('Past client follow-up');
    if (emphasizeEquity) focusAreas.push('Equity / refinance opportunities');

    // Premium rich progress modal to match sales scripts, weekly win plan, social 30-day, etc.
    // Uses full custom card (own spinner + "What Makes These Time Blocks Powerful" section) instead of the lighter showLoadingWithTips.
    if (typeof window.forceShowGlobalLoading === 'function') {
      window.forceShowGlobalLoading('Building Your Personalized Prospecting Blocks...');
    }

    let loadingEl = document.getElementById('global-loading');
    let originalLoadingHTML = '';
    if (loadingEl) {
      originalLoadingHTML = loadingEl.innerHTML;
      loadingEl.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
            <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-3xl border border-gray-200 dark:border-gray-700">

                <div class="text-center mb-8">
                    <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#F15A29] mb-5"></div>
                    <h3 class="text-3xl font-bold text-[#002B5C] dark:text-white mb-2 tracking-tight">
                        Building Your Personalized Prospecting Blocks...
                    </h3>
                    <p class="text-lg text-gray-700 dark:text-gray-300 mb-1">
                        This usually takes 15–30 seconds
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Turning your hours, focus areas, and hobbies into 7 days of protected, realistic time.
                    </p>
                </div>

                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                    <h4 class="text-xl font-bold text-[#F15A29] mb-5 text-center">
                        What Makes These Time Blocks Powerful
                    </h4>
                    <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                        <div class="flex gap-3">
                            <i class="fas fa-calendar-check text-[#F15A29] mt-0.5"></i>
                            <div><strong>Treat them like client appointments.</strong> Top producers protect prospecting blocks as non-negotiable — no rescheduling for "later".</div>
                        </div>
                        <div class="flex gap-3">
                            <i class="fas fa-clock text-[#00A89D] mt-0.5"></i>
                            <div><strong>Smaller chunks win.</strong> 30–45 minute blocks are far easier to defend and actually complete than big 2-hour marathons.</div>
                        </div>
                        <div class="flex gap-3">
                            <i class="fas fa-heart text-[#F15A29] mt-0.5"></i>
                            <div><strong>Weave your real life in.</strong> Hobbies and personal interests make the blocks feel human and sustainable instead of another chore.</div>
                        </div>
                        <div class="flex gap-3">
                            <i class="fas fa-link text-[#002B5C] mt-0.5"></i>
                            <div><strong>Bridge to execution.</strong> These blocks are the container — use the link below the results to drop straight into Weekly Win Plan and fill them with the exact daily moves.</div>
                        </div>
                    </div>
                </div>

                <p class="text-center text-xs text-gray-500 dark:text-gray-400 mt-5">
                    Momentum compounds. Protect the time and the results follow.
                </p>
            </div>
        </div>
      `;
      loadingEl.classList.remove('hidden');
      loadingEl.style.display = 'flex';
      // Belt-and-suspenders forces (consistent with weekly + sales patterns)
      loadingEl.style.setProperty('z-index', '99999', 'important');
      loadingEl.style.setProperty('visibility', 'visible', 'important');
      loadingEl.style.setProperty('opacity', '1', 'important');
      loadingEl.style.setProperty('position', 'fixed', 'important');
      loadingEl.style.setProperty('inset', '0', 'important');
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Generating...';
    }

    const p = getCentralProfile();
    const prompt = `You are an expert mortgage sales coach who specializes in realistic time blocking.

User Profile:
- Name: ${p.name || 'Loan Officer'}
- Email: ${p.email || ''}
- Monthly loan goal: ${p.monthlyUnits || p.monthlyGoal || 8}
- Weekly prospecting hours available: ${p.hours || '15-20'}
- Primary focus: ${p.focus || 'Balanced'}
- Preferred prospecting activities: ${(p.activities || p.preferredActivities || []).join(', ') || 'balanced mix'}
- Hobbies/Passions: ${(p.hobbies || []).join(', ') || p.hobbiesOther || 'none specified'}
- This week they want to block approximately ${hours} hours total.

Emphasis this week: ${focusAreas.length ? focusAreas.join(', ') : 'balanced across all areas'}
${weaveHobbies ? 'Please naturally weave in their hobbies where it makes sense for relationship building.' : ''}

Create a practical, realistic 7-day (Monday through Sunday) prospecting time block schedule.

Rules:
- Respect their total weekly hours (${hours}).
- Use realistic time slots (e.g. 9:00-9:45 AM).
- 2-5 blocks per day depending on the day.
- Make blocks specific and actionable.
- Include a short "why" for each block when helpful.
- Prioritize their preferred activities and focus areas.
- Keep it motivating but grounded — no fluff.

Return ONLY valid JSON in this exact format:
{
  "summary": "One sentence overview of the week's strategy",
  "totalHours": ${hours},
  "days": [
    {
      "day": "Monday",
      "blocks": [
        {
          "time": "9:00 - 9:45 AM",
          "activity": "Make 4 relationship calls to past clients",
          "focus": "Past Clients",
          "why": "Re-engage people who already know and trust you"
        }
      ]
    }
  ]
}`;

    try {
      const response = await window.callGrokAPI(prompt, {
        temperature: 0.7,
        max_tokens: 3000
      });

      let data;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        data = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response);
      } catch (e) {
        throw new Error('Could not parse AI response as JSON');
      }

      if (!data.days || !Array.isArray(data.days)) {
        throw new Error('Invalid plan structure from AI');
      }

      // Save for persistence
      currentPTBData = data;
      localStorage.setItem('savedProspectingTimeBlocks', JSON.stringify(data));

      // Clear any old progress when generating fresh
      localStorage.removeItem('ptbCheckedBlocks');

      renderProspectingBlocks(data);

    } catch (error) {
      console.error('[prospecting-time-blocks] Generation failed:', error);
      output.innerHTML = `
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-300 p-6 rounded-3xl">
          <p class="text-red-600 font-bold">Could not generate your time blocks right now.</p>
          <p class="text-sm mt-2">Please check the proxy connection and try again.</p>
        </div>
      `;
      // Still hide the top guidance on error to keep focus on the message (user can clear if needed)
      hidePTBPregenGuidance();
    } finally {
      // Restore the original global loading markup (so other tools aren't affected) then hide
      if (loadingEl) {
        loadingEl.innerHTML = originalLoadingHTML;
        loadingEl.classList.add('hidden');
        loadingEl.style.display = 'none';
      }
      window.hideLoading();
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-bolt-lightning mr-2"></i> <span>Generate My Weekly Prospecting Blocks</span>';
      }
    }
  }

  // =====================================================
  // RENDER 7-DAY CARDS
  // =====================================================
  function renderProspectingBlocks(data) {
    const container = document.getElementById('ptb-output');
    if (!container || !data) return;

    // Hide the rich explanatory top section (pre-gen guidance) once we have blocks,
    // matching the Weekly Win Plan pattern. Controls (profile + customize form) remain visible for tweaks.
    hidePTBPregenGuidance();

    currentPTBData = data;

    let checkedBlocks = [];
    try {
      checkedBlocks = JSON.parse(localStorage.getItem('ptbCheckedBlocks') || '[]');
    } catch (e) {}

    let html = '';

    // Weekly Summary - premium header bar
    const totalBlocks = (data.days || []).reduce((sum, d) => sum + ((d.blocks || []).length), 0);
    html += `
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-[#00A89D]/10 flex items-center justify-center flex-shrink-0">
            <i class="fas fa-calendar-check text-2xl text-[#00A89D]"></i>
          </div>
          <div>
            <div class="text-xs uppercase tracking-[1.5px] font-bold text-[#00A89D]">THIS WEEK'S PERSONALIZED PLAN</div>
            <div class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tighter">${data.totalHours || '?'} hours • ${totalBlocks} protected blocks</div>
          </div>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-300 max-w-sm md:text-right leading-snug italic">${data.summary || 'Your realistic, non-negotiable prospecting schedule.'}</div>
      </div>
    `;

    html += '<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">';

    data.days.forEach(day => {
      const blocksHtml = (day.blocks || []).map((block, index) => {
        const blockKey = `${day.day}::${block.time}::${block.activity}`;
        const isChecked = checkedBlocks.includes(blockKey);

        return `
          <label class="flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer group
            ${isChecked ? 'bg-[#00A89D]/5 border-[#00A89D]/40' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-[#00A89D]/40 dark:hover:border-gray-500'}">
            <input type="checkbox" class="ptb-checkbox mt-1 w-4 h-4 accent-[#00A89D] flex-shrink-0" 
                   data-key="${blockKey}" ${isChecked ? 'checked' : ''}>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <div class="font-semibold text-sm tabular-nums ${isChecked ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}">${block.time}</div>
              </div>
              <div class="text-[14px] leading-snug mt-0.5 ${isChecked ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'}">${block.activity}</div>
              ${block.why ? `<div class="text-xs text-[#00A89D] mt-1 opacity-90">${block.why}</div>` : ''}
            </div>
          </label>
        `;
      }).join('');

      html += `
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-5 shadow-sm flex flex-col hover:shadow-lg hover:border-[#00A89D]/30 transition-all group">
          <div class="flex items-center justify-between mb-4">
            <div class="font-extrabold text-2xl text-[#F15A29] group-hover:text-[#F15A29] transition">${day.day}</div>
            <div class="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 font-medium">${(day.blocks || []).length} blocks</div>
          </div>

          <div class="space-y-2.5 flex-1">
            ${blocksHtml || '<div class="text-sm text-gray-400 italic py-4 text-center">No blocks scheduled yet</div>'}
          </div>

          <button onclick="addCustomPTBBlock('${day.day}', this)" 
                  class="mt-4 text-xs flex items-center justify-center gap-2 text-[#00A89D] hover:text-[#008f85] py-2.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:bg-[#00A89D]/5 dark:hover:bg-gray-700/50 transition font-medium">
            <i class="fas fa-plus"></i>
            <span>Add custom block</span>
          </button>
        </div>
      `;
    });

    html += '</div>';

    // Action bar
    html += `
      <div class="mt-8 flex flex-wrap gap-3 justify-center">
        <button onclick="regenerateProspectingBlocks()" 
                class="px-5 py-2.5 rounded-2xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium flex items-center gap-2">
          <i class="fas fa-redo"></i> <span>Regenerate</span>
        </button>
        <button onclick="copyProspectingBlocks()" 
                class="px-5 py-2.5 rounded-2xl bg-[#002B5C] hover:bg-[#001a3a] text-white text-sm font-medium flex items-center gap-2 transition">
          <i class="fas fa-copy"></i> <span>Copy Week</span>
        </button>
        <button onclick="saveFullPTBSchedule()" 
                class="px-5 py-2.5 rounded-2xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white text-sm font-medium flex items-center gap-2 transition">
          <i class="fas fa-bookmark"></i> <span>Save to My Saved Items</span>
        </button>
        <button onclick="exportProspectingToICS()" 
                class="px-5 py-2.5 rounded-2xl bg-[#00A89D] hover:bg-[#008f85] text-white text-sm font-medium flex items-center gap-2 transition">
          <i class="fas fa-calendar-plus"></i> <span>Export to ICS</span>
        </button>
        <button onclick="resetPTBProgress()" 
                class="px-5 py-2.5 rounded-2xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
          Reset Progress
        </button>
        <button onclick="clearProspectingBlocks()" 
                class="px-5 py-2.5 rounded-2xl border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
          <i class="fas fa-trash"></i> <span>Clear Schedule</span>
        </button>
      </div>
    `;

    container.innerHTML = html;

    // Attach checkbox listeners
    container.querySelectorAll('.ptb-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        let checked = [];
        try { checked = JSON.parse(localStorage.getItem('ptbCheckedBlocks') || '[]'); } catch (e) {}

        const key = cb.dataset.key;
        if (cb.checked) {
          if (!checked.includes(key)) checked.push(key);
        } else {
          checked = checked.filter(k => k !== key);
        }
        localStorage.setItem('ptbCheckedBlocks', JSON.stringify(checked));
      });
    });
  }

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================

  function updateHoursDisplay(value) {
    const display = document.getElementById('ptb-hours-value');
    if (display) display.textContent = value;
  }

  function updatePTBLiveSummary() {
    const summaryEl = document.getElementById('ptb-live-summary');
    if (!summaryEl) return;

    const hours = parseInt(document.getElementById('ptb-hours')?.value) || 15;
    const r = document.getElementById('ptb-emphasis-realtors')?.checked;
    const p = document.getElementById('ptb-emphasis-past')?.checked;
    const e = document.getElementById('ptb-emphasis-equity')?.checked;
    const hobbies = document.getElementById('ptb-weave-hobbies')?.checked;

    const focusCount = [r, p, e].filter(Boolean).length || 1;
    const estBlocks = Math.max(8, Math.round(hours * 1.1));

    let text = `~${estBlocks} focused blocks across ${focusCount} area${focusCount > 1 ? 's' : ''}`;
    if (hobbies) text += ` • weaving your personal life`;

    summaryEl.textContent = text;
    summaryEl.classList.add('text-[#00A89D]');
  }

  function regenerateProspectingBlocks() {
    generateProspectingBlocks();
  }

  function resetPTBProgress() {
    if (!confirm('Clear all progress for this week\'s blocks?')) return;
    localStorage.removeItem('ptbCheckedBlocks');
    if (currentPTBData) {
      renderProspectingBlocks(currentPTBData);
    }
  }

  // =====================================================
  // GUIDANCE + EMPTY STATE VISIBILITY (to mirror Weekly Win Plan behavior)
  // The rich pre-gen header (#ptb-pregen-guidance) is the "top section" explanation.
  // It is hidden once you have generated blocks (cleaner focus on schedule + controls).
  // Profile banner + customize form stay visible for easy tweaks + regenerate.
  // A full "Clear Schedule" brings back the pre-gen + ready prompt, like weekly's clear.
  // =====================================================

  function hidePTBPregenGuidance() {
    const pregen = document.getElementById('ptb-pregen-guidance');
    if (pregen) pregen.classList.add('hidden');
  }

  function showPTBPregenGuidance() {
    const pregen = document.getElementById('ptb-pregen-guidance');
    if (pregen) pregen.classList.remove('hidden');
  }

  function showPTBEmptyState() {
    const output = document.getElementById('ptb-output');
    if (!output) return;

    output.innerHTML = `
        <div class="max-w-2xl mx-auto">
          <div class="text-center py-12 px-8 border-2 border-dashed border-[#00A89D]/40 rounded-3xl bg-gradient-to-br from-white via-white to-[#00A89D]/5 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 shadow-inner">
            <div class="mx-auto mb-5 inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-[#00A89D] to-[#008f85] text-white shadow-lg">
              <i class="fas fa-clock text-3xl"></i>
            </div>

            <p class="text-3xl font-bold tracking-tight text-[#002B5C] dark:text-white mb-3">Ready to build your week?</p>
            <p class="text-[15px] text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-8">
              Tweak your target hours, focus areas, and hobby blend above.<br>
              One click gives you a realistic, non-negotiable schedule that actually protects your time.
            </p>

            <!-- The generate button is now centered directly below the "Ready to build your week" text -->
            <button id="generate-ptb-btn"
                    class="mx-auto group px-6 sm:px-10 py-4 bg-gradient-to-r from-[#00A89D] to-[#008f85] hover:from-[#008f85] hover:to-[#006b63] active:scale-[0.985] text-white rounded-3xl font-semibold text-base sm:text-lg shadow-xl transition-all flex items-center justify-center gap-3 w-full sm:w-auto sm:min-w-[320px]">
                <i class="fas fa-bolt-lightning group-active:scale-90 transition"></i>
                <span>Generate My Weekly Prospecting Blocks</span>
            </button>

            <div class="mt-4 text-xs text-[#00A89D] font-medium tracking-wider">Built from your profile • Respects your available hours • Weaves personal life when enabled</div>
          </div>
        </div>
      `;
  }

  function clearProspectingBlocks() {
    if (!confirm('Clear the entire generated prospecting schedule? This cannot be undone.')) return;

    localStorage.removeItem('savedProspectingTimeBlocks');
    localStorage.removeItem('ptbCheckedBlocks');
    currentPTBData = null;

    showPTBPregenGuidance();
    showPTBEmptyState();

    // Wire the freshly injected generate button (init wiring only runs at load)
    const generateBtn = document.getElementById('generate-ptb-btn');
    if (generateBtn) {
      generateBtn.addEventListener('click', generateProspectingBlocks);
    }

    if (typeof updatePTBLiveSummary === 'function') {
      setTimeout(updatePTBLiveSummary, 50);
    }
  }

  function saveFullPTBSchedule() {
    if (!currentPTBData) {
      alert('No schedule to save yet.');
      return;
    }
    const title = `Prospecting Time Blocks — ${currentPTBData.totalHours || '?'} hrs/week`;
    let content = (currentPTBData.summary || 'Personalized weekly prospecting schedule') + '\n\n';
    (currentPTBData.days || []).forEach(day => {
      content += `${day.day}:\n`;
      (day.blocks || []).forEach(b => {
        content += `  • ${b.time}: ${b.activity}`;
        if (b.focus) content += ` [${b.focus}]`;
        if (b.why) content += ` — ${b.why}`;
        content += '\n';
      });
      content += '\n';
    });
    if (typeof window.toggleSaveIdea === 'function') {
      window.toggleSaveIdea(title, content.trim(), null, 'plan');
    } else {
      alert('Save system not ready. (Will work after refresh.)');
    }
  }

  window.savePTBBlock = function(day, time, activity, btn) {
    const title = `PTB: ${day} ${time}`;
    const content = `${time} — ${activity}`;
    if (typeof window.toggleSaveIdea === 'function') {
      window.toggleSaveIdea(title, content, btn, 'plan');
    }
  };

  function copyProspectingBlocks() {
    if (!currentPTBData) {
      alert('No schedule to copy yet.');
      return;
    }

    let text = `Prospecting Time Blocks — This Week\n\n`;
    currentPTBData.days.forEach(day => {
      text += `${day.day}\n`;
      (day.blocks || []).forEach(b => {
        text += `• ${b.time} — ${b.activity}\n`;
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text.trim()).then(() => {
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#002B5C] text-white px-6 py-3 rounded-2xl shadow-xl text-sm z-[999]';
      toast.textContent = 'Copied to clipboard!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }).catch(() => {
      prompt('Copy this schedule:', text.trim());
    });
  }

  // =====================================================
  // ICS EXPORT
  // =====================================================
  function exportProspectingToICS() {
    if (!currentPTBData || !currentPTBData.days) {
      alert('No schedule available to export.');
      return;
    }

    const ics = generateICS(currentPTBData);
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Prospecting-Time-Blocks.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function generateICS(data) {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Loan Officer Coach//Prospecting Time Blocks//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    const baseDate = getMondayOfCurrentWeek();

    data.days.forEach((day, dayIndex) => {
      const eventDate = new Date(baseDate);
      eventDate.setDate(baseDate.getDate() + dayIndex);

      (day.blocks || []).forEach(block => {
        const timeRange = parseTimeRange(block.time);
        if (!timeRange) return;

        const start = new Date(eventDate);
        start.setHours(timeRange.startHour, timeRange.startMinute, 0);

        const end = new Date(eventDate);
        end.setHours(timeRange.endHour, timeRange.endMinute, 0);

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:ptb-${Date.now()}-${Math.random().toString(36).slice(2)}@loancoach`);
        lines.push(`DTSTART:${formatToICSDate(start)}`);
        lines.push(`DTEND:${formatToICSDate(end)}`);
        lines.push(`SUMMARY:${escapeICSText(block.activity)}`);
        if (block.why) {
          lines.push(`DESCRIPTION:${escapeICSText(block.why)}`);
        }
        lines.push('END:VEVENT');
      });
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  function getMondayOfCurrentWeek() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  function parseTimeRange(timeStr) {
    // Handles "9:00 - 9:45 AM", "2:00 PM - 2:45 PM", etc.
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[-–]\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return null;

    let [, h1, m1, ap1, h2, m2, ap2] = match;

    let startHour = parseInt(h1);
    let endHour = parseInt(h2);

    if (ap1) {
      const ap = ap1.toUpperCase();
      if (ap === 'PM' && startHour !== 12) startHour += 12;
      if (ap === 'AM' && startHour === 12) startHour = 0;
    }
    if (ap2) {
      const ap = ap2.toUpperCase();
      if (ap === 'PM' && endHour !== 12) endHour += 12;
      if (ap === 'AM' && endHour === 12) endHour = 0;
    }

    return {
      startHour,
      startMinute: parseInt(m1),
      endHour,
      endMinute: parseInt(m2)
    };
  }

  function formatToICSDate(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  function escapeICSText(text) {
    return text.replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
  }

  window.addCustomPTBBlock = function(dayName, buttonElement) {
    if (!currentPTBData) return;

    const dayObj = currentPTBData.days.find(d => d.day === dayName);
    if (!dayObj) return;

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'mt-3 flex gap-2';
    inputWrapper.innerHTML = `
      <input type="text" placeholder="Time + activity (e.g. 2:00 PM - Quick check-in call)" 
             class="flex-1 px-3 py-2 text-sm rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900">
      <button class="px-4 py-2 text-sm rounded-2xl bg-[#00A89D] text-white font-medium">Add</button>
      <button class="px-3 py-2 text-sm rounded-2xl border border-gray-300">Cancel</button>
    `;

    const input = inputWrapper.querySelector('input');
    const addBtn = inputWrapper.querySelector('button');
    const cancelBtn = inputWrapper.querySelectorAll('button')[1];

    buttonElement.style.display = 'none';
    buttonElement.parentNode.appendChild(inputWrapper);

    const cleanup = () => {
      inputWrapper.remove();
      buttonElement.style.display = '';
    };

    cancelBtn.onclick = cleanup;

    const doAdd = () => {
      const value = input.value.trim();
      if (!value) { cleanup(); return; }

      if (!dayObj.blocks) dayObj.blocks = [];

      const parts = value.split('—');
      dayObj.blocks.push({
        time: parts[0]?.trim() || 'TBD',
        activity: parts[1]?.trim() || value,
        focus: 'Custom',
        why: 'You added this block'
      });

      localStorage.setItem('savedProspectingTimeBlocks', JSON.stringify(currentPTBData));
      renderProspectingBlocks(currentPTBData);
    };

    addBtn.onclick = doAdd;
    input.onkeydown = (e) => {
      if (e.key === 'Enter') doAdd();
      if (e.key === 'Escape') cleanup();
    };
    input.focus();
  };

  // =====================================================
  // PERSISTENCE
  // =====================================================
  function restoreSavedProspectingBlocks() {
    const saved = localStorage.getItem('savedProspectingTimeBlocks');
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      currentPTBData = data;
      const output = document.getElementById('ptb-output');
      if (output) {
        renderProspectingBlocks(data);
      }
    } catch (e) {
      console.warn('Could not restore saved prospecting blocks');
    }
  }

  // Expose a helper to open preferences (used by the Edit button)
  window.expandWeeklyPreferences = function () {
    const weeklySection = document.getElementById('weekly-win-plan');
    const ptbSection = document.getElementById('prospecting');

    if (weeklySection) {
      // Hide all sections and show Weekly Win Plan
      document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
      weeklySection.classList.remove('hidden');

      // Try to expand the preferences accordion
      setTimeout(() => {
        const accordion = weeklySection.querySelector('.accordion');
        if (accordion) {
          const content = accordion.querySelector('.accordion-content');
          if (content && !content.classList.contains('open')) {
            content.classList.add('open');
          }
        }
      }, 200);

      // Add a temporary "Back to Prospecting Time Blocks" banner
      const backBanner = document.createElement('div');
      backBanner.id = 'ptb-back-banner';
      backBanner.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[999] bg-white dark:bg-gray-800 border border-[#00A89D] shadow-xl rounded-2xl px-5 py-2.5 flex items-center gap-3 text-sm';
      backBanner.innerHTML = `
        <span class="text-[#00A89D] font-medium">Editing preferences for Prospecting Time Blocks</span>
        <button class="px-4 py-1 bg-[#00A89D] text-white rounded-xl text-xs font-semibold">Back to Prospecting Time Blocks</button>
      `;

      document.body.appendChild(backBanner);

      const backBtn = backBanner.querySelector('button');
      backBtn.onclick = () => {
        backBanner.remove();
        document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
        if (ptbSection) ptbSection.classList.remove('hidden');
      };
    }
  };

  // =====================================================
  // INITIALIZATION
  // =====================================================
  function initProspectingTimeBlocks() {
    console.log('%c[prospecting-time-blocks.js] Initializing...', 'color:#00A89D');

    // Update profile display
    updatePTBProfileDisplay();

    // Restore any previously generated schedule
    restoreSavedProspectingBlocks();

    // Show nice empty state + the rich pre-gen guidance only when nothing has been generated yet.
    // This makes the "top section" (explanatory header) visible precisely when a plan needs to be generated,
    // matching the Weekly Win Plan UX. Once blocks exist, pre-gen is hidden (controls stay for iteration).
    const output = document.getElementById('ptb-output');
    const hasSaved = localStorage.getItem('savedProspectingTimeBlocks');
    if (output && !hasSaved) {
      showPTBEmptyState();
      showPTBPregenGuidance();
    } else if (hasSaved) {
      hidePTBPregenGuidance();
    }

    // Wire generate button (for the case where empty state was just shown; the button inside results is wired via onclick in render)
    const generateBtn = document.getElementById('generate-ptb-btn');
    if (generateBtn) {
      generateBtn.addEventListener('click', generateProspectingBlocks);
    }

    // Slider for hours - attach listener properly + live summary
    const hoursSlider = document.getElementById('ptb-hours');
    const hoursDisplay = document.getElementById('ptb-hours-value');

    if (hoursSlider && hoursDisplay) {
      // Set initial value
      hoursDisplay.textContent = hoursSlider.value;

      hoursSlider.addEventListener('input', () => {
        hoursDisplay.textContent = hoursSlider.value;
        updatePTBLiveSummary();
      });
    }

    // Live updates for all controls (hobby + focus checkboxes)
    ['ptb-emphasis-realtors', 'ptb-emphasis-past', 'ptb-emphasis-equity', 'ptb-weave-hobbies'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', updatePTBLiveSummary);
    });

    // Initial live summary
    setTimeout(updatePTBLiveSummary, 50);

    // Re-run profile display when user changes preferences elsewhere
    setInterval(updatePTBProfileDisplay, 8000); // light refresh

    console.log('%c[prospecting-time-blocks.js] Ready', 'color:#00A89D');
  }

  // Auto init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProspectingTimeBlocks);
  } else {
    initProspectingTimeBlocks();
  }

  // Public API
  window.generateProspectingBlocks = generateProspectingBlocks;
  window.renderProspectingBlocks = renderProspectingBlocks;
  window.copyProspectingBlocks = copyProspectingBlocks;
  window.resetPTBProgress = resetPTBProgress;
  window.regenerateProspectingBlocks = regenerateProspectingBlocks;
  window.exportProspectingToICS = exportProspectingToICS;
  window.clearProspectingBlocks = clearProspectingBlocks;
  window.showPTBPregenGuidance = showPTBPregenGuidance;
  window.saveFullPTBSchedule = saveFullPTBSchedule;

})();