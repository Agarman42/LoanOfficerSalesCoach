/**
 * js/features/social-post.js
 *
 * Social Media Post Generator + 30-Day Calendar Planner
 * Extracted from monolithic index.html (Phase 1)
 *
 * Includes:
 * - generateSocialPost() + copy helpers
 * - Full 30-day calendar generator (generateMonthlyPlan)
 * - Excel export sheets (overview, monthly, tips)
 * - Persistence (localStorage for saved plans + themes)
 * - Progress tracking, copy single posts, toggle sections
 *
 * Self-initializes. Exposes key functions globally for onclick handlers.
 */

(function () {
  'use strict';

  // =====================================================
  // CENTRAL PROFILE INTEGRATION (consistent with Blog Creator + Weekly Win Plan)
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

  // Build a rich personalization string tailored for short social posts
  function buildSocialPersonalization() {
    const eff = getEffectiveSetup();
    let parts = [];

    if (eff.personality) parts.push(`Personality: ${eff.personality}`);
    if (eff.voiceTraits && eff.voiceTraits.length) parts.push(`Voice traits: ${eff.voiceTraits.join(', ')}`);
    if (eff.tone) parts.push(`Tone: ${eff.tone}`);
    if (eff.localArea) parts.push(`Primary market / local area: ${eff.localArea}`);
    if (eff.targetPartners && eff.targetPartners.length) parts.push(`Ideal audience & referral partners: ${eff.targetPartners.join(', ')}`);
    if (eff.goals) parts.push(`Current focus/goals: ${eff.goals}`);
    if (eff.challenges) parts.push(`Key client challenges you solve: ${eff.challenges}`);

    const base = 'Warm, authentic, relationship-first agent who posts like a real person — never salesy. Heavy on personal, local, and engagement content (70-80% non-business).';
    return parts.length ? `${base} ${parts.join('. ')}.` : base;
  }

  // =====================================================
  // SOCIAL POST GENERATOR (3 options)
  // =====================================================
async function generateSocialPost() {
    const type = document.getElementById('post-type').value;
    const details = document.getElementById('post-details').value.trim();
    const output = document.getElementById('social-output');

    // Collect premium checkbox focus angles (new world-class UX control surface)
    const focusContainer = document.getElementById('social-focuses') || document;
    const focusChecks = focusContainer.querySelectorAll('input[type="checkbox"]:checked');
    const focusAngles = Array.from(focusChecks).map(cb => (cb.value || '').trim()).filter(Boolean);

    // Pull central profile and build personalization
    const personalization = buildSocialPersonalization();
    const eff = getEffectiveSetup();
    const localContext = eff.localArea ? `Local market: ${eff.localArea}. Weave in neighborhood flavor, events, or relatable local references where natural.` : '';

    output.classList.add('hidden');
    output.innerHTML = '';

    // Use centralized force + rich custom loading for premium consistent progress modal (refreshed like 30-day, sales, blog)
    if (typeof window.forceShowGlobalLoading === 'function') {
      window.forceShowGlobalLoading('Creating Your Authentic Social Posts...');
    }

    const loadingEl = document.getElementById('global-loading');
    let originalLoadingHTML = loadingEl ? loadingEl.innerHTML : '';
    if (loadingEl) {
      loadingEl.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
            <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-3xl border border-gray-200 dark:border-gray-700">
                <div class="text-center mb-8">
                    <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00A89D] mb-5"></div>
                    <h3 class="text-3xl font-bold text-[#002B5C] dark:text-white mb-2 tracking-tight">
                        Creating Your Authentic Social Posts...
                    </h3>
                    <p class="text-lg text-gray-700 dark:text-gray-300 mb-1">
                        This usually takes 15–40 seconds
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Generating 3 distinct, ready-to-post options tailored to your voice and market.
                    </p>
                </div>

                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                    <h4 class="text-xl font-bold text-[#00A89D] mb-5 text-center">
                        Why Authentic Social Posts Win
                    </h4>
                    <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                        <div class="flex gap-3">
                            <i class="fas fa-heart text-[#00A89D] mt-0.5"></i>
                            <div><strong>Build real relationships</strong> — 70%+ personal/local/engagement content creates trust and referrals, not just likes.</div>
                        </div>
                        <div class="flex gap-3">
                            <i class="fas fa-comments text-[#00A89D] mt-0.5"></i>
                            <div><strong>Drive engagement</strong> — End with real questions; comments and saves beat vanity metrics every time.</div>
                        </div>
                        <div class="flex gap-3">
                            <i class="fas fa-bullseye text-[#002B5C] mt-0.5"></i>
                            <div><strong>Profile-powered</strong> — Uses your hobbies, voice, local market so it actually sounds like you wrote it.</div>
                        </div>
                    </div>
                </div>

                <p class="text-center text-xs text-gray-500 dark:text-gray-400 mt-5">
                    People follow the human, not a billboard. These posts are designed to make you memorable.
                </p>
            </div>
        </div>
      `;
      loadingEl.classList.remove('hidden');
      loadingEl.style.display = 'flex';
    }

    let prompt = `You are creating social media content for a specific real estate agent.

AGENT PROFILE & VOICE:
${personalization}
${localContext}

Post type / goal: ${type && type.trim() !== '' && type !== ' ' ? type : 'Custom idea from user'}
${details ? `Specific details or angle the user wants: ${details}` : ''}
${focusAngles.length ? `Key content focus angles to blend (use naturally where they fit the voice): ${focusAngles.map(f => '- ' + f).join('\n')}` : ''}

Create THREE distinct, ready-to-post social media captions (Instagram/Facebook/LinkedIn friendly).

Requirements for EACH caption:
- Use the exact voice, personality, tone, and local flavor described above — make it feel like this specific person wrote it.
- Warm, authentic, relationship-focused first. Never salesy or pushy.
- Engaging and conversational — like texting a friend who happens to be a great agent.
- Include relevant emojis naturally (not spammy).
- End with a subtle, human CTA (question, "Comment below", "DM me if this is you", "Tag a friend who needs this", etc.).
- Add 6–10 relevant hashtags at the very end (mix broad + local + niche).
- Make the three options feel noticeably different (different hooks, angles, lengths, or emoji energy) while staying true to the voice.

Output format — EXACTLY this structure with no extra commentary:

Option 1:
[full caption text including emojis and hashtags]

---

Option 2:
[full caption text including emojis and hashtags]

---

Option 3:
[full caption text including emojis and hashtags]`;

    try {
        // Centralized API call (Phase 0) - no more hardcoded key
        const fullResponse = await window.callGrokAPI(prompt, {
            temperature: 0.9,
            max_tokens: 1200
        });

        if (!fullResponse) throw new Error('Empty response from API');

        // Split into three options
        const parts = fullResponse.split('---').map(p => p.trim()).filter(p => p);
        if (parts.length !== 3) {
            throw new Error('Unexpected response format');
        }

        // Clean option labels and extract raw text
        const posts = parts.map(part => {
            // Remove "Option X:" header if present
            return part.replace(/^Option \d+:\s*/i, '').trim();
        });

        // Render three premium separate cards with individual copy + save buttons
        output.innerHTML = posts.map((post, index) => `
            <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 mb-8 border border-gray-200 dark:border-gray-700 hover:border-[#00A89D]/50 transition-all">
                <div class="prose prose-lg dark:prose-invert max-w-none mb-6">
                    ${marked.parse(post)}
                </div>
                <div class="flex flex-col sm:flex-row gap-3 justify-center">
                    <button 
                        onclick="copySpecificPost('${index}')" 
                        class="flex-1 sm:flex-none bg-[#002B5C] hover:bg-[#002B5C]/80 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
                        data-post-index="${index}">
                        <i class="fas fa-copy"></i>
                        <span>Copy This Post</span>
                    </button>
                    <button 
                        onclick="saveGeneratedPost(${index}, this)" 
                        class="flex-1 sm:flex-none border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white px-6 py-3.5 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2">
                        <i class="far fa-bookmark"></i>
                        <span>Save</span>
                    </button>
                </div>
            </div>
        `).join('');

        // Store the raw texts on the container for copying
        output.dataset.post0 = posts[0];
        output.dataset.post1 = posts[1];
        output.dataset.post2 = posts[2];

        output.classList.remove('hidden');

        gtag('event', 'generate_social_post', {
            event_category: 'Tool Usage',
            event_label: 'Social Post Generated (3 Options)',
            value: 1
        });

    } catch (error) {
        console.error(error);
        output.innerHTML = '<p class="text-red-600 text-center py-20">Error generating posts. Check console or try again.</p>';
        output.classList.remove('hidden');
    } finally {
        if (loadingEl && originalLoadingHTML) {
            loadingEl.innerHTML = originalLoadingHTML;
            delete loadingEl.dataset.originalContent; // if any
        }
        if (typeof window.hideLoading === 'function') {
            try { window.hideLoading(); } catch(e) {}
        }
    }
}

// New function to copy a specific post
function copySpecificPost(index) {
    const output = document.getElementById('social-output');
    const text = output.dataset[`post${index}`] || '';
    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            const btns = document.querySelectorAll(`[data-post-index="${index}"]`);
            if (btns.length) {
                const originalTexts = [];
                btns.forEach((b, i) => {
                    originalTexts[i] = b.innerHTML;
                    b.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    b.disabled = true;
                });
                setTimeout(() => {
                    btns.forEach((b, i) => {
                        b.innerHTML = originalTexts[i];
                        b.disabled = false;
                    });
                }, 1800);
            }
        }).catch(() => {
            window.notifyUser('Copy failed — try manually selecting the text.', 'error', 5000);
        });
    }
}

// Save a generated post to the global "My Saved Items" system
function saveGeneratedPost(index, btnEl) {
    const output = document.getElementById('social-output');
    const text = output.dataset[`post${index}`] || '';
    if (!text) return;

    const typeEl = document.getElementById('post-type');
    const shortType = typeEl ? typeEl.options[typeEl.selectedIndex].text.slice(0, 45) : 'Social Post';
    const title = `Social Post Option ${parseInt(index) + 1}: ${shortType}`;

    const STORAGE_KEY = 'socialSavedIdeas';
    let saved = [];
    try {
        saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {}

    const already = saved.some(item => item.title === title);
    if (already) {
        // toggle off = remove
        saved = saved.filter(item => item.title !== title);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        if (btnEl) {
            btnEl.innerHTML = '<i class="far fa-bookmark"></i> <span>Save to My Ideas</span>';
            btnEl.classList.remove('!bg-[#00A89D]', 'text-white', 'border-[#00A89D]');
        }
        // try to refresh count if the strategy page is also open
        const countEl = document.getElementById('social-saved-count');
        if (countEl) countEl.textContent = saved.length;
        return;
    }

    const richContent = `
<div class="social-saved">
  <div class="mb-2">
    <span class="text-xs uppercase tracking-widest font-bold text-[#00A89D]">Social Post</span>
    <span class="ml-2 text-xs text-gray-500">${shortType}</span>
  </div>
  <div class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm leading-relaxed">
    ${text.replace(/\n/g, '<br>')}
  </div>
  <div class="mt-2 text-[10px] text-gray-500">Generated via Social Post Creator • Ready to copy &amp; post</div>
</div>`;
    saved.push({
        title,
        content: richContent,
        savedAt: new Date().toISOString(),
        type: 'social'   // For the unified My Saved Items library
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

    if (btnEl) {
        btnEl.innerHTML = '<i class="fas fa-check"></i> <span>Saved!</span>';
        btnEl.classList.add('!bg-[#00A89D]', 'text-white', 'border-[#00A89D]');
        setTimeout(() => {
            if (btnEl) {
                btnEl.innerHTML = '<i class="fas fa-bookmark"></i> <span>Saved</span>';
                btnEl.classList.remove('!bg-[#00A89D]', 'text-white');
                btnEl.classList.add('text-[#00A89D]', 'border-[#00A89D]');
            }
        }, 2800);
    }

    // Update count badge if present on the page (Social Strategy toolbar)
    const countEl = document.getElementById('social-saved-count');
    if (countEl) countEl.textContent = saved.length;

    // Update global top bar count directly for reliability
    const globalCount = document.getElementById('global-saved-count');
    if (globalCount) globalCount.textContent = saved.length;

    // Also try the centralized function
    if (typeof window.updateSavedCount === 'function') {
        try { window.updateSavedCount(); } catch(e) {}
    }

    // Optional toast
    if (typeof window.showSavedFeedback === 'function') {
        window.showSavedFeedback('Saved to My Saved Items');
    } else if (typeof window.showToast === 'function') {
        window.showToast('Saved to My Saved Items');
    }
}
function showSocialPostCreator() {
    // Hide all sections
    document.querySelectorAll('main section').forEach(sec => sec.classList.add('hidden'));
   
    // Show the AI post creator
    const target = document.getElementById('social-post');
    if (target) {
        target.classList.remove('hidden');
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
       
        // Close mobile sidebar
        document.getElementById('sidebar').classList.add('left-[-300px]');
    } else {
        console.error("Social Post Creator section (#social-post) not found!");
    }
}

  // =====================================================
  // 30-DAY SOCIAL MEDIA CALENDAR PLANNER
  // (createOverviewSheet, createMonthSheet, createTipsSheet, generateMonthlyPlan, etc.)
  // =====================================================
function createOverviewSheet(year) {
    const data = [
        [`Your ${year} Social Media Success Plan`, "", "", "", "", "", "", ""],
        ["Built for Agents — Consistency Made Simple", "", "", "", "", "", "", ""],
        [],
        ["Core Strategy", "", "", "", "", "", "", ""],
        ["75% Personal/Engagement/Community → Build authentic relationships", "", "", "", "", "", "", ""],
        ["25% Business/Educational → Position yourself as the go-to expert", "", "", "", "", "", "", ""],
        [],
        ["Weekly Themes", "", "", "", "", "", "", ""],
        ["Sunday: Personal & Relax", "Monday: Motivational", "Tuesday: Tip", "Wednesday: Wins", "", "", "", ""],
        ["Thursday: Community/Local", "Friday: Fun", "Saturday: Engagement", "", "", "", "", ""],
        [],
        ["Pro Tips for Maximum Results", "", "", "", "", "", "", ""],
        ["• Post 3–5 times per week minimum", "", "", "", "", "", "", ""],
        ["• Engage daily: Like/comment/share on others' posts", "", "", "", "", "", "", ""],
        ["• Use Stories/Reels for behind-the-scenes", "", "", "", "", "", "", ""],
        ["• Track engagement & double down on what works", "", "", "", "", "", "", ""],
        ["• Always add value — never hard sell", "", "", "", "", "", "", ""],
        [],
        ["You've got this! Start posting today and watch your business grow.", "", "", "", "", "", "", ""]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } },
        { s: { r: 7, c: 0 }, e: { r: 7, c: 7 } },
        { s: { r: 11, c: 0 }, e: { r: 11, c: 7 } },
        { s: { r: 18, c: 0 }, e: { r: 18, c: 7 } }
    ];
    ws['!cols'] = [{ wch: 60 }, { wch: 40 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }];

    // Styling for title
    if (ws['A1']) {
        ws['A1'].s = { font: { bold: true, sz: 24, color: { rgb: "F15A29" } }, alignment: { horizontal: 'center' } };
    }
    if (ws['A2']) {
        ws['A2'].s = { font: { bold: true, sz: 18 }, alignment: { horizontal: 'center' } };
    }

    return ws;
}

// Updated createMonthSheet with holidays, hashtags, local flavor
function createMonthSheet(month, year, monthIndex, weekStart) {
    const data = [];

    data.push([`${month.name} ${year}`]);
    data.push([]); data.push([]);

    data.push(['Weekly Themes Recap']);
    data.push(['Day', 'Theme Description']);
    const weekdayOrder = weekStart === 'Sun' ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    weekdayOrder.forEach(wd => {
        data.push([wd, weeklyThemes[wd] || 'General Day']);
    });
    data.push([]); data.push([]);

    data.push(['Daily Post Ideas']);
    data.push(['Date', 'Weekday', 'Theme', 'Post Idea 1', 'Post Idea 2', 'Post Idea 3', 'Post Idea 4', 'Suggested Hashtags']);

    // 2026 US Holidays (major ones)
    const holidays = {
        'January 1': '🎉 New Year’s Day – Share your goals!',
        'January 19': 'MLK Day – Inspiration & equality post',
        'February 16': 'Presidents’ Day',
        'May 25': 'Memorial Day',
        'June 19': 'Juneteenth',
        'July 4': 'Independence Day 🇺🇸',
        'September 7': 'Labor Day',
        'November 26': 'Thanksgiving 🦃',
        'December 25': 'Christmas 🎄'
    };

    month.days.forEach(day => {
        const fullDateKey = `${month.name} ${day.date}`;
        const holidayNote = holidays[fullDateKey] || '';

        let hashtags = '#AgentLife #LocalRealEstate #YourCityHere';
        if (day.weekday === 'Mon') hashtags += ' #MotivationMonday';
        if (day.weekday === 'Tue') hashtags += ' #TipTuesday';
        if (day.weekday === 'Wed') hashtags += ' #WinsWednesday';
        if (day.weekday === 'Thu') hashtags += ' #SupportLocal';
        if (day.weekday === 'Fri') hashtags += ' #FunFriday';
        if (holidayNote) hashtags += ' #HappyHolidays';

        data.push([
            `${month.name} ${day.date}, ${year}${holidayNote ? ' 🎉' : ''}`,
            day.weekday,
            day.theme + (holidayNote ? ' (Holiday!)' : ''),
            ...day.ideas.slice(0,4).map(idea => idea || ''),
            hashtags
        ]);

        if (holidayNote) {
            data[data.length-1][3] = holidayNote; // Override first idea with holiday suggestion
        }
    });

    const ws = XLSX.utils.aoa_to_sheet(data);

    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } },
        { s: { r: data.length - month.days.length - 2, c: 0 }, e: { r: data.length - month.days.length - 2, c: 7 } }
    ];

    ws['!cols'] = [
        { wch: 24 }, { wch: 12 }, { wch: 55 },
        { wch: 55 }, { wch: 55 }, { wch: 55 }, { wch: 55 },
        { wch: 70 }
    ];

    // Wrap text + holiday highlighting
    const ideasStartRow = 11 + weekdayOrder.length;
    for (let r = ideasStartRow; r < data.length; r++) {
        for (let c = 2; c <= 7; c++) {
            const cell = XLSX.utils.encode_cell({ r, c });
            if (ws[cell]) {
                ws[cell].s = { 
                    alignment: { wrapText: true, vertical: 'top', horizontal: 'left' },
                    font: { sz: 11 }
                };
                if (data[r][2].includes('Holiday')) {
                    ws[cell].s.fill = { fgColor: { rgb: "E8F5E9" } }; // Light green
                }
            }
        }
    }

    // Bold headers + title styling (your original retained)
    const headerRows = [3, 4, data.length - month.days.length - 1];
    headerRows.forEach(rowIdx => {
        for (let c = 0; c < 8; c++) {
            const cell = XLSX.utils.encode_cell({ r: rowIdx, c });
            if (ws[cell]) {
                ws[cell].s = ws[cell].s || {};
                ws[cell].s.font = { bold: true, sz: 12 };
            }
        }
    });

    if (ws['A1']) {
        ws['A1'].s = { font: { bold: true, sz: 18 }, alignment: { horizontal: 'center' } };
    }

    return ws;
}

// Your createTipsSheet (kept as-is — it's solid)
function createTipsSheet() {
    const data = [
        ["Social Media Success Tips for Agents", "", "", "", "", "", "", ""],
        [],
        ["Key Principle: ~75% personal/community/engagement — people connect with YOU first.", "", "", "", "", "", "", ""],
        ["~25% business/educational — provide genuine value.", "", "", "", "", "", "", ""],
        [],
        ["Frequency Guidelines"],
        ["Daily:", "Like/comment/share on followers' posts + 1–3 personal posts"],
        ["Weekly:", "Motivational Monday, Tip Tuesday, Wins Wednesday, Community Thursday, Fun Friday"],
        ["Monthly:", "Market update, local spotlight, deeper educational reel"],
        ["As they occur:", "Testimonials, closing pics, just-listed/sold (with permission)"],
        [],
        ["Idea Bank – Steal These Anytime"],
        ["Personal Ideas:", ...ideaPools.personal.slice(0,20).join(", ").split(", ")],
        [],
        ["Engagement Prompts:", ...ideaPools.engagement.slice(0,15).join(", ").split(", ")],
        [],
        ["Market & Listing Tips:", ...ideaPools.tips],
        ["Fun/Community:", ...ideaPools.fun.concat(ideaPools.community)]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
        { wch: 30 }, { wch: 50 }, { wch: 50 }, { wch: 50 }, 
        { wch: 50 }, { wch: 50 }, { wch: 50 }, { wch: 50 }
    ];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];

    return ws;
}

// === PERSISTENCE: Load saved plan on page load or month/year change ===
document.addEventListener('DOMContentLoaded', () => {
    loadSavedSocialPlan();

});

function loadSavedSocialPlan() {
    const savedHTML = localStorage.getItem('lastSocialPlanHTML');
    const savedMonth = localStorage.getItem('lastSocialPlanMonth');
    const savedYear = localStorage.getItem('lastSocialPlanYear');

    const output = document.getElementById('social-plan-output');
    if (!output) return;

    if (savedHTML) {
        output.innerHTML = savedHTML;

        // Sync dropdowns to the saved plan's month/year
        if (savedMonth) document.getElementById('plan-month').value = savedMonth;
        if (savedYear) document.getElementById('plan-year').value = savedYear;

        // Restore progress
        const progress = JSON.parse(localStorage.getItem('lastSocialPlanProgress') || '{"copied":0}');
        const copiedCount = progress.copied || 0;

        const copiedEl = document.getElementById('copied-count');
        if (copiedEl) copiedEl.textContent = copiedCount;

        const msgEl = document.getElementById('progress-message');
        if (msgEl) {
            msgEl.textContent = copiedCount >= 30 ? '🎉 You crushed it — consistent wins!' 
                              : copiedCount >= 21 ? '🔥 On fire — keep posting!' 
                              : 'Start copying to track progress!';
        }

        const fill = document.getElementById('progress-fill');
        if (fill) fill.style.width = `${(copiedCount / 30) * 100}%`;

        // Add note if not already there
        if (!document.getElementById('saved-plan-note')) {
            const note = document.createElement('div');
            note.id = 'saved-plan-note';
            note.className = 'text-center text-gray-500 italic mb-12 text-xl';
            note.textContent = '📅 Showing your most recently generated plan — select a new month/year and generate for a fresh one!';
            output.prepend(note);
        }
    } else {
        output.innerHTML = '';
        document.getElementById('saved-plan-note')?.remove();
    }
}

// === UPDATED generateMonthlyPlan WITH PERSISTENCE ===
async function generateMonthlyPlan() {
    const month = document.getElementById('plan-month').value;
    const year = document.getElementById('plan-year').value;
    const localArea = document.getElementById('plan-areas')?.value.trim() || 'your area';
    const customPrompt = document.getElementById('custom-plan-prompt')?.value.trim() || '';

    // Pull rich profile for the monthly calendar prompt (consistent with single-post gen + other tools)
    const personalization = buildSocialPersonalization();
    const eff = getEffectiveSetup();

    // Collect checked themes (null-safe)
    const themes = [];
    if (document.getElementById('theme-family')?.checked) themes.push('family and personal life');
    if (document.getElementById('theme-hobbies')?.checked) themes.push('hobbies, interests, music, sports, restaurants, vacations');
    if (document.getElementById('theme-local')?.checked) themes.push('local events and spots in ' + localArea);
    if (document.getElementById('theme-fun')?.checked) themes.push('fun and humor');
    if (document.getElementById('theme-polls')?.checked) themes.push('polls and engagement');
    if (document.getElementById('theme-listings')?.checked) themes.push('listing tips and market updates');
    if (document.getElementById('theme-cashout')?.checked) themes.push('seller proceeds and move-up ideas');
    if (document.getElementById('theme-purchase')?.checked) themes.push('buyer and first-time homebuyer tips');
    if (document.getElementById('theme-equity')?.checked) themes.push('home equity and move-up power');
    if (document.getElementById('theme-recipes')?.checked) themes.push('recipe ideas');
    if (document.getElementById('theme-trivia')?.checked) themes.push('trivia and fun facts');
    if (document.getElementById('theme-localbusiness')?.checked) themes.push('local business spotlights');

    const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[parseInt(month)];

    // Dynamic days in month (handles 28/29/30/31 correctly, including leap years)
    const daysInMonth = new Date(year, month, 0).getDate();  // month is 1-based in select, but Date expects 0-based for month

    const fullPrompt = `You are the world's best social media coach for real estate agents. Generate a full month content calendar for ${monthName} ${year} (exactly ${daysInMonth} days) for an agent primarily in ${localArea}.

Core philosophy: 70% relationship-building (personal, local, fun, engaging) and 30% real estate value. Make people WANT to see posts — be entertaining, human, and trust-building.

Weave in these themes naturally: ${themes.length ? themes.join(', ') : 'balanced personal and local content'}.

Custom instructions: ${customPrompt || 'None — use best judgment'}.

AGENT PROFILE & VOICE (make the overview + every single post idea feel like it was written by *this exact agent* — use their personality, voice traits, tone, hobbies, challenges, and target partners for authentic, personal, non-generic content):
${personalization}
${eff.localArea ? `Primary market: ${eff.localArea}.` : ''}

CRITICAL INSTRUCTIONS — DO NOT VIOLATE:
- You MUST generate content for EVERY SINGLE ONE of the ${daysInMonth} days. Do not stop early, do not summarize, do not say "and so on".
- The output table MUST contain EXACTLY ${daysInMonth} data rows (one for each day from 1 to ${daysInMonth}).
- For EVERY day provide EXACTLY 4 varied, ready-to-post ideas.
- If the month is long, keep individual posts concise but complete — never omit days to save tokens.
- Output as clean Markdown with:
  - Strong Overview section (key themes, why it works, execution motivation — inspiring and actionable).
  - Calendar as a table: columns "Day", "Date", "Theme", "Post 1", "Post 2", "Post 3", "Post 4".
  - Each post: full caption + hashtags.
Include local ${localArea} events, holidays, trends where relevant. Tone: warm, fun, conversational.

${typeof window.getWeekendSocialRules === 'function' ? window.getWeekendSocialRules() : ''}

Generate the COMPLETE table now with all ${daysInMonth} days.`;

    const loading = document.getElementById('global-loading');
    const output = document.getElementById('social-plan-output');

    // Use centralized force for consistent premium progress modal
    if (typeof window.forceShowGlobalLoading === 'function') {
      window.forceShowGlobalLoading('Building Your 30-Day Social Media Plan...');
    }

    if (loading) loading.classList.remove('hidden');
    if (output) output.innerHTML = '';

    // Rich custom loading for the long-running 30-day plan generation
    const loadingContent = `
        <div class="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
            <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-3xl border border-gray-200 dark:border-gray-700">
                
                <div class="text-center mb-8">
                    <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00A89D] mb-5"></div>
                    <h3 class="text-3xl font-bold text-[#002B5C] dark:text-white mb-2 tracking-tight">
                        Building Your 30-Day Social Media Plan...
                    </h3>
                    <p class="text-lg text-gray-700 dark:text-gray-300 mb-1">
                        This usually takes 60–90 seconds — grab a coffee! ☕
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Generating 120+ personalized post ideas tailored to your voice, market, and goals.
                    </p>
                </div>

                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                    <h4 class="text-xl font-bold text-[#00A89D] mb-5 text-center">
                        What We're Building For You
                    </h4>
                    <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                        <div class="flex gap-3">
                            <i class="fas fa-user-edit text-[#00A89D] mt-0.5"></i>
                            <div><strong>Voice-matched content:</strong> Every idea is written in your natural tone and personality.</div>
                        </div>
                        <div class="flex gap-3">
                            <i class="fas fa-map-marker-alt text-[#00A89D] mt-0.5"></i>
                            <div><strong>Local &amp; personal flavor:</strong> We weave in your market, hobbies, family, and real life.</div>
                        </div>
                        <div class="flex gap-3">
                            <i class="fas fa-calendar-alt text-[#002B5C] mt-0.5"></i>
                            <div><strong>30 days of consistency:</strong> No more blank-page stress — you’ll have ideas for every day.</div>
                        </div>
                        <div class="flex gap-3">
                            <i class="fas fa-bullseye text-[#00A89D] mt-0.5"></i>
                            <div><strong>Themes you chose:</strong> Your selected topics are prioritized throughout the month.</div>
                        </div>
                    </div>

                    <div class="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
                        <p class="text-xs font-semibold text-[#00A89D] mb-2">While you wait, remember:</p>
                        <ul class="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-5">
                            <li>The best plans are the ones you actually follow — keep it realistic.</li>
                            <li>70-80% personal &amp; local content builds real relationships.</li>
                            <li>End posts with a question — it dramatically increases engagement.</li>
                            <li>Batch your content when possible. Future you will be grateful.</li>
                        </ul>
                    </div>
                </div>

                <p class="text-center text-xs text-gray-500 dark:text-gray-400 mt-5">
                    Momentum compounds. Your future audience is already waiting.
                </p>
            </div>
        </div>
    `;

    const loadingEl = document.getElementById('global-loading');
    if (loadingEl) {
        // Save original content
        loadingEl.dataset.originalContent = loadingEl.innerHTML;
        loadingEl.innerHTML = loadingContent;
    }

    try {
        // Centralized API call (Phase 0) - supports system message
        const rawPlan = await window.callGrokAPI(null, {
            messages: [
                { role: 'system', content: 'You are an expert social media strategist for real estate agents following the 70/30 relationship rule.' },
                { role: 'user', content: fullPrompt }
            ],
            temperature: 0.7,
            max_tokens: 9000
        });

        if (!rawPlan) throw new Error('Empty response from API');

        // Parse to HTML
        const rawHTML = marked.parse(rawPlan);
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawHTML, 'text/html');

        // Extract Overview
        let overviewHTML = '';
        let tableHTML = '';

        const table = doc.querySelector('table');
        if (table) {
            tableHTML = table.outerHTML;
            overviewHTML = doc.body.innerHTML.split(table.outerHTML)[0] || '<p>No overview generated.</p>';
        } else {
            overviewHTML = rawHTML;
        }

        // Build day cards — use dynamic daysInMonth
        let cardsHTML = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">';

        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = `${monthName} ${day}`;
            let theme = 'Daily Mix';

            const posts = [];
            // Fallbacks are now varied and lightly personalized from profile/themes when the model didn't return a full table
            const fallbacks = [
                '<p class="italic text-gray-500">Free choice — share something personal or local!</p>',
                '<p class="italic text-gray-500">Your choice — a quick win, family moment, or local spot.</p>',
                '<p class="italic text-gray-500">Open slot — poll your audience or share a recent small win.</p>',
                '<p class="italic text-gray-500">Free choice — behind the scenes or a light fun fact.</p>'
            ];
            for (let i = 0; i < 4; i++) {
                posts.push(fallbacks[i % fallbacks.length]);
            }

            // Override with Grok data if available (robust lookup by day number, not position)
            if (table) {
                let row = null;
                const allRows = table.querySelectorAll('tr');
                for (let r = 1; r < allRows.length; r++) { // skip header row
                    const firstCell = allRows[r].querySelector('td');
                    if (firstCell) {
                        const dayText = firstCell.textContent.trim();
                        const dayNum = parseInt(dayText.match(/\d+/)?.[0] || '0', 10);
                        if (dayNum === day) {
                            row = allRows[r];
                            break;
                        }
                    }
                }

                if (row) {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 3) {
                        theme = cells[2]?.textContent.trim() || theme;
                        for (let i = 3; i < 7 && i < cells.length; i++) {
                            const content = cells[i]?.textContent.trim();
                            if (content) {
                                posts[i - 3] = `<p class="leading-relaxed">${content}</p>`;
                            }
                        }
                    }
                }
            }

            const postBoxes = posts.map((post, pIdx) => {
                const postId = `post-${day}-${pIdx}`;
                return `
                    <div class="relative mb-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-md border border-[#00A89D]/20">
                        <div class="absolute top-4 right-4 flex items-center gap-2">
                            <button type="button" onclick="copySinglePost('${postId}', event)" class="bg-[#00A89D] hover:bg-[#00887A] text-white p-3 rounded-full shadow-lg transition-all flex items-center gap-2 copy-btn" data-post-id="${postId}" title="Copy post">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button type="button" onclick="saveCalendarPost('${postId}', ${day}, ${pIdx}, this)" class="border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white p-2.5 rounded-full shadow-md transition-all flex items-center gap-1 text-xs font-semibold" title="Save to My Saved Items">
                                <i class="far fa-bookmark"></i>
                            </button>
                        </div>
                        <div id="${postId}" class="text-base md:text-lg leading-relaxed pr-24">${post}</div>
                    </div>
                `;
            }).join('');

            cardsHTML += `
                    <div class="min-w-[320px] bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-2xl hover:shadow-3xl hover:-translate-y-4 transition-all border-2 border-[#00A89D]/30">
                    <h3 class="text-3xl font-black text-[#00A89D] mb-4">${dayDate}</h3>
                    <p class="text-2xl font-bold text-[#00A89D] mb-8">${theme}</p>
                    <div class="space-y-6">
                        ${postBoxes}
                    </div>
                </div>
            `;
        }
        cardsHTML += '</div>';

        // Larger overview
        const overviewSection = `
            <div class="mb-20">
                <h1 class="text-5xl font-black text-[#00A89D] text-center mb-12">${monthName} Social Media Calendar</h1>
                <div class="prose prose-3xl dark:prose-invert max-w-none text-left dark:text-white dark:text-gray-200 leading-loose">
                    ${overviewHTML}
                </div>
            </div>
        `;

        // Progress tracking — use global key
        localStorage.setItem('lastSocialPlanProgress', JSON.stringify({ copied: 0 }));

        const progressBar = `
            <div id="progress-container" class="mt-20 p-10 bg-gradient-to-br from-[#002B5C]/50 to-[#00A89D]/30 rounded-3xl shadow-2xl text-center">
                <h3 class="text-4xl font-bold text-[#00A89D] mb-8">Your Posting Progress</h3>
                <div class="w-full max-w-2xl mx-auto bg-gray-700 rounded-full h-10 mb-6 overflow-hidden">
                    <div id="progress-fill" class="bg-gradient-to-r from-[#00A89D] to-[#00A89D] h-10 rounded-full transition-all duration-1000" style="width: 0%"></div>
                </div>
                <p class="text-3xl text-white">Copied ideas for <span class="font-black text-[#00A89D]" id="copied-count">0</span> of 30 days</p>
                <p class="text-xl text-gray-300 mt-6" id="progress-message">Start copying to track progress!</p>
                <div class="mt-8 flex flex-wrap justify-center gap-3">
                    <button type="button" onclick="saveFullSocialCalendar('${monthName}', this)" class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-white/80 text-white hover:bg-white hover:text-[#002B5C] font-semibold transition-all">
                        <i class="far fa-bookmark"></i> Save Full Calendar to My Saved Items
                    </button>
                </div>
            </div>
        `;

        output.innerHTML = `
            <div id="printable-plan" class="bg-white dark:bg-gray-800 p-12 rounded-3xl shadow-2xl">
                ${overviewSection}
                ${cardsHTML}
                ${progressBar}
            </div>
        `;

        // === PERSIST THE NEW PLAN AS THE LATEST (overwrites everything) ===
        localStorage.setItem('lastSocialPlanHTML', output.innerHTML);
        localStorage.setItem('lastSocialPlanMonth', month);
        localStorage.setItem('lastSocialPlanYear', year);

        // Remove "saved plan" note since this is fresh
        document.getElementById('saved-plan-note')?.remove();

        gtag('event', 'generate_monthly_plan', {
            event_category: 'Tool Usage',
            event_label: 'Monthly Social Plan Generated',
            value: 1
        });

        // Reset progress bar visually
        const fill = document.getElementById('progress-fill');
        if (fill) fill.style.width = '0%';

    } catch (err) {
        console.error('Plan generation error:', err);
        output.innerHTML = `<p class="text-red-600 text-center text-2xl">Error: ${err.message}</p>`;
    } finally {
        window.hideLoading();

        // === RESTORE ORIGINAL GLOBAL LOADING CONTENT ===
        if (loadingEl && loadingEl.dataset.originalContent) {
            loadingEl.innerHTML = loadingEl.dataset.originalContent;
            delete loadingEl.dataset.originalContent;
        }
    }
}

// Toggle function
function toggleCalendarSection() {
    const content = document.getElementById('calendar-content');
    const icon = document.getElementById('calendar-toggle-icon');
    
    content.classList.toggle('hidden');
    icon.classList.toggle('rotate-180');
}


function saveCalendarPost(postId, day, pIdx, btnEl) {
    const el = document.getElementById(postId);
    if (!el) return;
    const text = el.innerText.trim();
    if (!text) return;

    const monthEl = document.querySelector('#printable-plan h1');
    const monthName = monthEl ? monthEl.textContent.replace(' Social Media Calendar', '').trim() : 'Social Calendar';
    const title = `${monthName} — Day ${day} Post ${parseInt(pIdx, 10) + 1}`;

    if (typeof window.toggleSaveIdea === 'function') {
        const richContent = `<div class="social-calendar-saved"><div class="text-xs uppercase tracking-widest font-bold text-[#00A89D] mb-2">${monthName} • Day ${day}</div><div class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap">${text.replace(/</g, '&lt;')}</div></div>`;
        window.toggleSaveIdea(title, richContent, btnEl, 'social');
        if (typeof window.showSavedFeedback === 'function') window.showSavedFeedback('Saved to My Saved Items');
    }
}

function saveFullSocialCalendar(monthName, btnEl) {
    const plan = document.getElementById('printable-plan');
    if (!plan) { window.notifyUser('Generate a calendar first.', 'warning', 3200); return; }
    const title = `${monthName || 'Monthly'} Social Media Calendar (Full Plan)`;
    const content = plan.innerHTML;
    if (typeof window.toggleSaveIdea === 'function') {
        window.toggleSaveIdea(title, content, btnEl, 'social');
        if (typeof window.showSavedFeedback === 'function') window.showSavedFeedback('Full calendar saved to My Saved Items');
    }
}

// Global copy function — works for freshly generated OR loaded saved plans
window.copySinglePost = function(postId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const el = document.getElementById(postId);
    if (!el) return;

    let text = el.innerText.trim();
    text = text.replace(/^(IG|FB|LinkedIn|TikTok|Reels?|Story|Post|Stories):\s*/i, '').trim();

    const html = el.innerHTML;

    navigator.clipboard.write([
        new ClipboardItem({
            'text/plain': new Blob([text], { type: 'text/plain' }),
            'text/html': new Blob([`<div style="font-family: sans-serif; font-size: 16pt; line-height: 1.6;">${html}</div>`], { type: 'text/html' })
        })
    ]).then(() => {
        const btn = document.querySelector(`[data-post-id="${postId}"]`);
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            btn.classList.replace('bg-[#00A89D]', 'bg-green-600');

            // === GLOBAL PROGRESS TRACKING ===
            let progress = JSON.parse(localStorage.getItem('lastSocialPlanProgress') || '{"copied":0}');
            progress.copied += 1;
            localStorage.setItem('lastSocialPlanProgress', JSON.stringify(progress));

            const copiedCount = progress.copied;

            const copiedEl = document.getElementById('copied-count');
            if (copiedEl) copiedEl.textContent = copiedCount;

            const msgEl = document.getElementById('progress-message');
            if (msgEl) {
                msgEl.textContent = copiedCount >= 30 ? '🎉 You crushed it — consistent wins!' 
                                  : copiedCount >= 21 ? '🔥 On fire — keep posting!' 
                                  : 'Start copying to track progress!';
            }

            const fill = document.getElementById('progress-fill');
            if (fill) fill.style.width = `${(copiedCount / 30) * 100}%`;

            // Confetti every 10 copies + big at 30
            if (copiedCount % 10 === 0 || copiedCount === 30) {
                confetti({
                    particleCount: copiedCount === 30 ? 300 : 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }

            setTimeout(() => {
                btn.innerHTML = original;
                btn.classList.replace('bg-green-600', 'bg-[#00A89D]');
            }, 2000);
        }
    }).catch(() => {
        navigator.clipboard.writeText(text);
    });
};

// Load saved personal info and themes + pre-fill from central profile
document.addEventListener('DOMContentLoaded', () => {
    const savedPersonal = localStorage.getItem('socialPlanPersonal');
    if (savedPersonal) {
        const data = JSON.parse(savedPersonal);
        if (document.getElementById('plan-areas')) document.getElementById('plan-areas').value = data.areas || '';
        if (document.getElementById('plan-hobbies')) document.getElementById('plan-hobbies').value = data.hobbies || '';
        if (document.getElementById('plan-family')) document.getElementById('plan-family').value = data.family || '';
        if (document.getElementById('custom-plan-prompt')) document.getElementById('custom-plan-prompt').value = data.custom || '';
    }

    const savedThemes = localStorage.getItem('socialPlanThemes');
    if (savedThemes) {
        const themes = JSON.parse(savedThemes);
        const themeIds = [
            'theme-family', 'theme-hobbies', 'theme-local', 'theme-fun', 'theme-polls',
            'theme-listings', 'theme-cashout', 'theme-purchase', 'theme-equity',
            'theme-recipes', 'theme-trivia', 'theme-localbusiness'
        ];
        themeIds.forEach(id => {
            const el = document.getElementById(id);
            if (el && themes[id] !== undefined) el.checked = themes[id];
        });
    }

    // Pre-fill from central userProfile if the fields are still empty
    prefillCalendarFromProfile();
});

function prefillCalendarFromProfile() {
    const profile = getCentralProfile();
    if (!profile) return;

    const areasEl = document.getElementById('plan-areas');
    const hobbiesEl = document.getElementById('plan-hobbies');
    const familyEl = document.getElementById('plan-family');

    if (areasEl && !areasEl.value.trim()) {
        const loc = profile.localArea || profile.location || profile.market || '';
        if (loc) areasEl.value = loc;
    }
    if (hobbiesEl && !hobbiesEl.value.trim()) {
        let hobbies = '';
        if (Array.isArray(profile.hobbies) && profile.hobbies.length) {
            hobbies = profile.hobbies.join(', ');
        } else if (profile.hobbies) {
            hobbies = profile.hobbies;
        }
        if (profile['hobbies-other']) hobbies += (hobbies ? ', ' : '') + profile['hobbies-other'];
        if (hobbies) hobbiesEl.value = hobbies;
    }
    if (familyEl && !familyEl.value.trim() && profile.family) {
        familyEl.value = profile.family;
    }
}

// Save personal info on change
['plan-areas', 'plan-hobbies', 'plan-family', 'custom-plan-prompt'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', () => {
            const data = {
                areas: document.getElementById('plan-areas')?.value || '',
                hobbies: document.getElementById('plan-hobbies')?.value || '',
                family: document.getElementById('plan-family')?.value || '',
                custom: document.getElementById('custom-plan-prompt')?.value || ''
            };
            localStorage.setItem('socialPlanPersonal', JSON.stringify(data));
        });
    }
});

// Save themes on change
const themeIds = [
    'theme-family', 'theme-hobbies', 'theme-local', 'theme-fun', 'theme-polls',
    'theme-listings', 'theme-cashout', 'theme-purchase', 'theme-equity',
    'theme-recipes', 'theme-trivia', 'theme-localbusiness'
];

themeIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('change', () => {
            const saved = JSON.parse(localStorage.getItem('socialPlanThemes') || '{}');
            saved[id] = el.checked;
            localStorage.setItem('socialPlanThemes', JSON.stringify(saved));
        });
    }
});

  // =====================================================
  // EXPOSE FUNCTIONS FOR HTML ONCLICK + OTHER CALLS
  // =====================================================
  window.generateSocialPost = generateSocialPost;
  window.copySpecificPost = copySpecificPost;
  window.saveGeneratedPost = saveGeneratedPost;
  window.showSocialPostCreator = showSocialPostCreator;
  window.generateMonthlyPlan = generateMonthlyPlan;
  window.toggleCalendarSection = toggleCalendarSection;
  window.copySinglePost = window.copySinglePost || copySinglePost; // if defined inside
  window.saveCalendarPost = saveCalendarPost;
  window.saveFullSocialCalendar = saveFullSocialCalendar;

  // =====================================================
  // INITIALIZATION
  // =====================================================
  function initSocialPostFeature() {
    // The original DOMContentLoaded for loadSavedSocialPlan is included above.
    // Re-attach any additional listeners if needed when the script loads late.

    // Theme checkbox persistence (the original code had this at the end of the block)
    // It is already present in the appended calendar code.

    console.log('%c[social-post.js] Social Media Post + Calendar Planner initialized', 'color:#00A89D');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSocialPostFeature);
  } else {
    initSocialPostFeature();
  }

})();

  // =====================================================
  // Social Post Helper Logic (moved from leaked code)
  // =====================================================

  function initSocialPostHelpers() {
    // Auto-fill custom textarea when selecting from dropdown
    const scenarioSelect = document.getElementById('script-scenario-select');
    if (scenarioSelect) {
      scenarioSelect.addEventListener('change', function() {
        const custom = document.getElementById('custom-scenario');
        if (custom) {
          custom.value = this.value || '';
        }
      });
    }

    // Dynamic helper text for post-type dropdown (keyword-based since values are human-readable phrases)
    const postTypeSelect = document.getElementById('post-type');
    if (postTypeSelect) {
      postTypeSelect.addEventListener('change', function() {
        const val = (this.value || '').toLowerCase();
        const helper = document.getElementById('details-helper');
        const textarea = document.getElementById('post-details');
        if (!helper || !textarea) return;

        let helperText = "e.g., Describe what you'd like the post to say";
        let placeholder = "e.g., Tell me your idea and I'll craft it";

        if (val.includes('myth') || val.includes('pre-qual') || val.includes('earnest') || val.includes('inspection') || val.includes('appraisal') || val.includes('credit') || val.includes('pre-approved') || val.includes('red flags')) {
          helperText = "e.g., Explain a common misconception or how part of the buying process actually works";
          placeholder = "e.g., Earnest money isn’t extra cost — here’s what it actually does for buyers";
        } else if (val.includes('market') || val.includes('inventory') || val.includes('rates trending') || val.includes('fed') || val.includes('home prices')) {
          helperText = "e.g., Local stats, rate trends, or inventory insight for your area";
          placeholder = "e.g., Inventory is up 14% this month — here’s what it means for buyers";
        } else if (val.includes('local') || val.includes('coffee') || val.includes('farmers') || val.includes('restaurant') || val.includes('park') || val.includes('school') || val.includes('holiday lights')) {
          helperText = "e.g., A quick local shoutout, event, or hidden gem";
          placeholder = "e.g., The new coffee spot on Main just became my favorite closing-day ritual";
        } else if (val.includes('day in the life') || val.includes('morning routine') || val.includes('grateful') || val.includes('weekend') || val.includes('office setup') || val.includes('book or podcast')) {
          helperText = "e.g., Behind-the-scenes or personal peek into your week";
          placeholder = "e.g., Sunday reset routine that keeps me sharp for Monday showings and listings";
        } else if (val.includes('client') || val.includes('helped') || val.includes('first-time') || val.includes('listing that') || val.includes('closing') || val.includes('turning')) {
          helperText = "e.g., A (anonymous) client win or challenge you helped solve";
          placeholder = "e.g., Helped a self-employed buyer get pre-qualified fast for their dream home";
        } else if (val.includes('poll') || val.includes('this or that') || val.includes('tag a friend') || val.includes('dream home') || val.includes('fixer-upper')) {
          helperText = "e.g., A fun poll or engagement prompt to drive comments";
          placeholder = "e.g., Beach house or mountain cabin? Vote below — I’ll tell you which lifestyle trade-offs actually matter";
        } else if (val.includes('realtor') || val.includes('agent partner') || val.includes('co-branded') || val.includes('lender partner') || val.includes('co-broke') || val.includes('collaboration')) {
          helperText = "e.g., How your go-to partners make transactions smoother";
          placeholder = "e.g., 4 things my favorite lender partner does that make my buyers’ offers stronger";
        } else if (val.includes('motivational') || val.includes('dream home is worth') || val.includes('builds wealth') || val.includes('small steps')) {
          helperText = "e.g., An encouraging or mindset-focused message";
          placeholder = "e.g., The keys you hand over today will be the biggest wealth-building move of their life";
        } else if (val.includes('holiday') || val.includes('new year') || val.includes('grateful this') || val.includes('spring cleaning')) {
          helperText = "e.g., Seasonal tie-in or family tradition";
          placeholder = "e.g., Our family’s favorite July 4th tradition + why I love helping families plant roots";
        } else if (val.includes('resource') || val.includes('checklist') || val.includes('vendor list') || val.includes('maintenance')) {
          helperText = "e.g., A free tool or downloadable you’re sharing";
          placeholder = "e.g., Grabbing my updated 2026 Home Buyer Checklist? DM me — happy to send it over";
        }

        // Default when "Use Custom Idea" is chosen
        if (val === ' ' || val === '' || val.includes('use custom')) {
          helperText = "Type any idea, angle, or specific request below — the more personal or local, the better.";
          placeholder = "e.g., Shoutout to the best taco truck in town + how I helped their owner buy their first commercial space";
        }

        helper.textContent = helperText;
        textarea.placeholder = placeholder;
      });

      // Fire once on load so the initial selected item shows good helper text
      setTimeout(() => {
        const ev = new Event('change');
        postTypeSelect.dispatchEvent(ev);
      }, 50);
    }
  }

  // Call the helper init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSocialPostHelpers);
  } else {
    initSocialPostHelpers();
  }

  // =====================================================
  // SAVED IDEAS — Visible inside the Generator page
  // =====================================================
