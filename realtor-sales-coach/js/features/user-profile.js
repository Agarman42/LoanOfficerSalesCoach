/**
 * js/features/user-profile.js
 * Central user profile modal — powers personalization across all Agent Sales Coach tools.
 */
(function () {
  'use strict';

  const COMPLETENESS_CHECKS = [
    { key: 'name', weight: 12, hint: 'Add your name', tools: 'Scripts, AI Coach' },
    { key: 'location', weight: 12, hint: 'Add your market', tools: 'Social, Newsletter' },
    { key: 'focus', weight: 10, hint: 'Pick your business focus', tools: 'Weekly Plan' },
    { key: 'monthlyUnits', weight: 10, hint: 'Set a monthly closing goal', tools: 'Weekly Plan' },
    { key: 'hobbies', weight: 10, hint: 'Add 1–2 hobbies', tools: 'Social, Content' },
    { key: 'tone', weight: 10, hint: 'Choose your tone', tools: 'AI, Scripts' },
    { key: 'partnerTypes', weight: 10, hint: 'Select referral partner types', tools: 'Referrals' },
    { key: 'challenges', weight: 8, hint: 'Pick your top challenge', tools: 'Weekly Plan' },
    { key: 'activities', weight: 8, hint: 'Preferred prospecting activities', tools: 'Weekly Plan' },
    { key: 'contentNotes', weight: 10, hint: 'Content guardrails', tools: 'All AI tools' }
  ];

  function asArray(val) {
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string' && val.trim()) return val.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  }

  function checkComplete(p, key) {
    switch (key) {
      case 'name':
        return !!(p.name && String(p.name).trim());
      case 'location':
        return !!(p.location && String(p.location).trim());
      case 'focus':
        return !!(p.focus && String(p.focus).trim());
      case 'monthlyUnits':
        return !!(p.monthlyUnits || p.monthlyGoal);
      case 'hobbies':
        return asArray(p.hobbies).length > 0 || !!(p.hobbiesOther && p.hobbiesOther.trim());
      case 'tone':
        return !!(p.tone || p.personality);
      case 'partnerTypes':
        return asArray(p.partnerTypes).length > 0 || !!(p.partnerTypesOther && p.partnerTypesOther.trim());
      case 'challenges':
        return asArray(p.challenges).length > 0 || !!(p.challengesOther && p.challengesOther.trim());
      case 'activities':
        return asArray(p.activities).length > 0;
      case 'contentNotes':
        return !!(p.contentNotes && String(p.contentNotes).trim());
      default:
        return false;
    }
  }

  function getProfileCompleteness(profile) {
    const p = profile || (typeof window.getUserProfile === 'function' ? window.getUserProfile() : {});
    let score = 0;
    const missing = [];

    COMPLETENESS_CHECKS.forEach((c) => {
      if (checkComplete(p, c.key)) {
        score += c.weight;
      } else {
        missing.push(c);
      }
    });

    return {
      score: Math.min(100, score),
      missing: missing.slice(0, 4),
      isComplete: score >= 70
    };
  }

  function isProfileModalOpen() {
    const el = document.getElementById('user-profile-modal');
    return !!(el && !el.classList.contains('hidden') && (el.classList.contains('flex') || el.style.display === 'flex'));
  }

  function collectProfileFromForm() {
    return {
      name: document.getElementById('profile-name')?.value.trim() || '',
      email: document.getElementById('profile-email')?.value.trim() || '',
      location: document.getElementById('profile-location')?.value.trim() || '',
      years: document.getElementById('profile-years')?.value || '',
      team: document.getElementById('profile-team')?.value || '',
      monthlyUnits: document.getElementById('profile-monthly-units')?.value || '',
      monthlyGoal: document.getElementById('profile-monthly-goal')?.value || '',
      income: document.getElementById('profile-income')?.value || '',
      focus: document.getElementById('profile-focus')?.value || '',
      hours: document.getElementById('profile-hours')?.value || '',
      family: document.getElementById('profile-family')?.value.trim() || '',
      personality: document.getElementById('profile-personality')?.value.trim() || '',
      tone: document.getElementById('profile-tone')?.value || '',
      contentNotes: document.getElementById('profile-content-notes')?.value.trim() || '',
      hobbiesOther: document.getElementById('profile-hobbies-other')?.value.trim() || '',
      hobbies: Array.from(document.querySelectorAll('.profile-hobby:checked')).map((c) => c.value),
      activities: Array.from(document.querySelectorAll('.profile-activity:checked')).map((c) => c.value),
      niches: Array.from(document.querySelectorAll('.profile-niche:checked')).map((c) => c.value),
      nichesOther: document.getElementById('profile-niche-other')?.value.trim() || '',
      challenges: Array.from(document.querySelectorAll('.profile-challenge:checked')).map((c) => c.value),
      challengesOther: document.getElementById('profile-challenge-other')?.value.trim() || '',
      formats: Array.from(document.querySelectorAll('.profile-format:checked')).map((c) => c.value),
      voiceTraits: Array.from(document.querySelectorAll('.profile-voice:checked')).map((c) => c.value),
      partnerTypes: Array.from(document.querySelectorAll('.profile-partner:checked')).map((c) => c.value),
      partnerTypesOther: document.getElementById('profile-partner-other')?.value.trim() || ''
    };
  }

  function refreshProfileUI() {
    const profile = isProfileModalOpen()
      ? collectProfileFromForm()
      : (typeof window.getUserProfile === 'function' ? window.getUserProfile() : {});
    const { score, missing } = getProfileCompleteness(profile);

    const scoreEl = document.getElementById('profile-strength-score');
    const barEl = document.getElementById('profile-strength-bar');
    const hintsEl = document.getElementById('profile-strength-hints');

    if (scoreEl) scoreEl.textContent = `${score}%`;
    if (barEl) barEl.style.width = `${score}%`;

    if (hintsEl) {
      if (missing.length) {
        hintsEl.innerHTML = missing.map((m) =>
          `<span class="inline-flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-400"><i class="fas fa-arrow-right text-[#00A89D] text-[9px]"></i> ${m.hint} <span class="text-gray-400">(${m.tools})</span></span>`
        ).join('');
      } else {
        hintsEl.innerHTML = '<span class="text-[11px] text-[#00A89D]"><i class="fas fa-check-circle"></i> Profile is strong — tools will personalize well.</span>';
      }
    }

    updateHeaderProfileBadge(score);

    if (typeof window.refreshCoachOnboarding === 'function') {
      window.refreshCoachOnboarding();
    }
  }

  function updateHeaderProfileBadge(score) {
    const openBtn = document.getElementById('open-profile-btn');
    if (!openBtn) return;

    let badge = document.getElementById('header-profile-strength');
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'header-profile-strength';
      badge.className = 'text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5';
      openBtn.appendChild(badge);
    }

    badge.textContent = `${score}%`;
    badge.classList.remove('bg-green-500/30', 'text-green-100', 'bg-amber-400/30', 'text-amber-100', 'bg-red-400/30', 'text-red-100');
    if (score >= 70) {
      badge.classList.add('bg-green-500/30', 'text-green-100');
    } else if (score >= 40) {
      badge.classList.add('bg-amber-400/30', 'text-amber-100');
    } else {
      badge.classList.add('bg-red-400/30', 'text-red-100');
    }
    openBtn.title = `My Profile — ${score}% complete`;
  }

  window.getProfileCompleteness = getProfileCompleteness;

    let modal, openBtn, closeBtn, cancelBtn, saveBtn;

    function initProfileModal() {
        modal = document.getElementById('user-profile-modal');
        openBtn = document.getElementById('open-profile-btn');
        closeBtn = document.getElementById('close-profile-modal');
        cancelBtn = document.getElementById('cancel-profile');
        saveBtn = document.getElementById('save-profile');

        if (!modal || !openBtn) {
            console.warn('[Profile Modal] Required elements not found');
            return;
        }

        openBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        if (saveBtn) saveBtn.addEventListener('click', saveProfile);

        // Prevent accidental close on backdrop click or Escape — only X / Close / Save can close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                // Do nothing — user must use X or footer buttons
            }
        });

        // Block Escape key from closing the modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden') && modal.classList.contains('flex')) {
                e.preventDefault();
                // Optionally flash the modal or do nothing — data is auto-saved
            }
        });

        // Set up auto-save on any change inside the form (debounced)
        setupAutoSave();

        // Wire the "Select all" masters for the checkbox categories in the personalization accordions
        setupSelectAllToggles();

        console.log('%c[Profile Modal] Initialized (auto-save + protected close)', 'color:#00A89D');

        refreshProfileUI();

        // Expose globally so tools can open the profile easily
        window.openUserProfile = openModal;

        // Expose a clean getter for other feature modules (Weekly Win Plan, Prospecting, etc.)
        window.getUserProfile = function() {
            try {
                return JSON.parse(localStorage.getItem('userProfile') || '{}');
            } catch (e) {
                return {};
            }
        };
    }

    function openModal() {
        if (!modal) {
            modal = document.getElementById('user-profile-modal');
        }
        if (!modal) return;

        loadProfileIntoForm();
        if (typeof window.openAppModal === 'function') {
            window.openAppModal(modal);
        } else if (typeof window.openNamedModal === 'function') {
            window.openNamedModal(modal);
        } else {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            modal.style.display = 'flex';
        }
    }

    function closeModal() {
        if (!modal) return;
        if (typeof window.closeAppModal === 'function') {
            window.closeAppModal(modal);
        } else if (typeof window.closeNamedModal === 'function') {
            window.closeNamedModal(modal);
        } else {
            modal.classList.remove('flex');
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }

        // Refresh any open Weekly Win Plan profile summary when user returns
        if (window.renderWeeklyProfileSummary) {
            window.renderWeeklyProfileSummary();
        }
        // Also refresh the business plan extended profile info
        if (window.renderExtendedProfileInfo) {
            window.renderExtendedProfileInfo();
        }
        // Refresh PTB profile display
        if (typeof window.updatePTBProfileDisplay === 'function') {
          window.updatePTBProfileDisplay();
        }
    }

    function loadProfileIntoForm() {
        const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');

        // Helper to convert kebab-case (e.g. 'monthly-units') to camelCase ('monthlyUnits')
        function kebabToCamel(str) {
            return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        }

        const fields = ['name', 'email', 'location', 'years', 'team', 'monthly-units', 'monthly-goal', 'income', 'focus', 'hours', 'family', 'personality', 'tone', 'content-notes', 'hobbies-other', 'niche-other', 'challenge-other', 'partner-other', 'company-name', 'tagline', 'phone', 'logo-url'];
        
        fields.forEach(field => {
            const el = document.getElementById('profile-' + field);
            if (el) {
                const key = kebabToCamel(field);
                el.value = profile[key] || profile[field] || '';
            }
        });

        // Legacy compat for years: old profiles may have range strings like "3-5 years"; number input needs clean int or empty
        const yearsEl = document.getElementById('profile-years');
        if (yearsEl && yearsEl.type === 'number') {
            const raw = yearsEl.value || '';
            const num = parseInt(raw, 10);
            yearsEl.value = isNaN(num) ? '' : String(num);
        }

        // Handle hobbies checkboxes
        document.querySelectorAll('.profile-hobby').forEach(cb => {
            cb.checked = profile.hobbies && profile.hobbies.includes(cb.value);
        });

        // Handle activities checkboxes
        document.querySelectorAll('.profile-activity').forEach(cb => {
            cb.checked = profile.activities && profile.activities.includes(cb.value);
        });

        // Handle new profile sections
        document.querySelectorAll('.profile-niche').forEach(cb => {
            cb.checked = profile.niches && profile.niches.includes(cb.value);
        });
        document.querySelectorAll('.profile-challenge').forEach(cb => {
            cb.checked = profile.challenges && profile.challenges.includes(cb.value);
        });
        document.querySelectorAll('.profile-format').forEach(cb => {
            cb.checked = profile.formats && profile.formats.includes(cb.value);
        });

        // Voice traits
        document.querySelectorAll('.profile-voice').forEach(cb => {
            cb.checked = profile.voiceTraits && profile.voiceTraits.includes(cb.value);
        });

        // Target Partner Types

        // Branding fields (new)
        const companyEl = document.getElementById('profile-company-name');
        if (companyEl) companyEl.value = profile.companyName || profile['company-name'] || '';

        const taglineEl = document.getElementById('profile-tagline');
        if (taglineEl) taglineEl.value = profile.tagline || '';

        const phoneEl = document.getElementById('profile-phone');
        if (phoneEl) phoneEl.value = profile.phone || '';

        const logoEl = document.getElementById('profile-logo-url');
        if (logoEl) logoEl.value = profile.logoUrl || profile['logo-url'] || '';

        // Social links object
        const social = profile.socialLinks || {};
        const socialFields = ['linkedin','facebook','instagram','tiktok','youtube','x'];
        socialFields.forEach(s => {
            const el = document.getElementById('profile-social-' + s);
            if (el) el.value = social[s] || '';
        });
        document.querySelectorAll('.profile-partner').forEach(cb => {
            cb.checked = profile.partnerTypes && profile.partnerTypes.includes(cb.value);
        });

        // Sync any "Select all" masters based on whether every item in their group is checked
        syncSelectAllStates();

        // Other text fields for new sections
        const nicheOther = document.getElementById('profile-niche-other');
        if (nicheOther) nicheOther.value = profile.nichesOther || '';

        const challengeOther = document.getElementById('profile-challenge-other');
        if (challengeOther) challengeOther.value = profile.challengesOther || '';

        const partnerOther = document.getElementById('profile-partner-other');
        if (partnerOther) partnerOther.value = profile.partnerTypesOther || '';

        // Show the subtle auto-save status indicator when the form loads
        const statusEl = document.getElementById('profile-save-status');
        if (statusEl) {
            statusEl.innerHTML = `<i class="fas fa-check text-[#00A89D]"></i> <span>All changes saved automatically</span>`;
        }

        refreshProfileUI();
    }

    // Core save logic (can be called silently for auto-save or with feedback for explicit Save)
    function performSave(showFeedback = true, closeAfter = true) {
        const profile = {
            ...collectProfileFromForm(),
            companyName: document.getElementById('profile-company-name')?.value.trim() || '',
            tagline: document.getElementById('profile-tagline')?.value.trim() || '',
            phone: document.getElementById('profile-phone')?.value.trim() || '',
            logoUrl: document.getElementById('profile-logo-url')?.value.trim() || '',
            socialLinks: {
                linkedin: document.getElementById('profile-social-linkedin')?.value.trim() || '',
                facebook: document.getElementById('profile-social-facebook')?.value.trim() || '',
                instagram: document.getElementById('profile-social-instagram')?.value.trim() || '',
                tiktok: document.getElementById('profile-social-tiktok')?.value.trim() || '',
                youtube: document.getElementById('profile-social-youtube')?.value.trim() || '',
                x: document.getElementById('profile-social-x')?.value.trim() || ''
            },
            lastUpdated: new Date().toISOString()
        };

        localStorage.setItem('userProfile', JSON.stringify(profile));
        refreshProfileUI();

        // Backward compatibility with older tools
        const oldSetup = JSON.parse(localStorage.getItem('winPlanSetup') || '{}');
        const merged = { ...oldSetup, ...profile };
        localStorage.setItem('winPlanSetup', JSON.stringify(merged));

        if (closeAfter) {
            closeModal();
        }

        if (showFeedback) {
            const toast = document.createElement('div');
            toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#00A89D] text-white px-6 py-3 rounded-2xl shadow-xl z-[999]';
            toast.textContent = 'Profile saved! All tools will now use your updated preferences.';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3500);
        }
    }

    function saveProfile() {
        // Explicit Save button: save + show confirmation + close
        performSave(true, true);
    }

    // Debounced auto-save (no toast, no close)
    let autoSaveTimer = null;
    function autoSaveProfile() {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            performSave(false, false);
            showAutoSaveIndicator();
        }, 450); // save ~0.45s after user stops typing/clicking
    }

    function showAutoSaveIndicator() {
        const statusEl = document.getElementById('profile-save-status');
        if (!statusEl) return;

        // Brief "just saved" confirmation
        const originalHTML = statusEl.innerHTML;
        statusEl.innerHTML = `<i class="fas fa-check text-[#00A89D]"></i> <span>Saved just now</span>`;

        setTimeout(() => {
            if (statusEl) {
                statusEl.innerHTML = `<i class="fas fa-check text-[#00A89D]"></i> <span>All changes saved automatically</span>`;
            }
        }, 2400);
    }

    function setupAutoSave() {
        if (!modal) return;

        let liveUiTimer = null;
        function scheduleLiveProfileUI() {
            clearTimeout(liveUiTimer);
            liveUiTimer = setTimeout(refreshProfileUI, 120);
        }

        // Event delegation on the whole modal: any typing, selecting, or checkbox toggle auto-saves
        modal.addEventListener('input', () => {
            scheduleLiveProfileUI();
            autoSaveProfile();
        });
        modal.addEventListener('change', () => {
            scheduleLiveProfileUI();
            autoSaveProfile();
        });
    }

    // --- Select All toggles for the multi-select checkbox categories (in the 4 bottom accordions) ---
    function syncSelectAllStates() {
        if (!modal) return;
        modal.querySelectorAll('.profile-select-all').forEach(master => {
            const sel = master.getAttribute('data-target');
            if (!sel) return;
            const boxes = modal.querySelectorAll(sel);
            if (!boxes.length) return;
            const allOn = Array.prototype.every.call(boxes, b => b.checked);
            master.checked = allOn;
        });
    }

    function setupSelectAllToggles() {
        if (!modal) return;

        // Master checkbox -> check/uncheck all in its group + trigger auto-save
        modal.addEventListener('change', function(e) {
            const master = e.target.closest('.profile-select-all');
            if (!master) return;
            const targetSelector = master.getAttribute('data-target');
            if (!targetSelector) return;
            const isChecked = master.checked;
            modal.querySelectorAll(targetSelector).forEach(cb => {
                cb.checked = isChecked;
            });
            autoSaveProfile();
        });

        // When individual items change, keep the master in sync (all checked = master checked)
        modal.addEventListener('change', function(e) {
            const t = e.target;
            if (t.matches('input[type="checkbox"].profile-hobby') ||
                t.matches('input[type="checkbox"].profile-activity') ||
                t.matches('input[type="checkbox"].profile-partner') ||
                t.matches('input[type="checkbox"].profile-niche') ||
                t.matches('input[type="checkbox"].profile-challenge') ||
                t.matches('input[type="checkbox"].profile-voice') ||
                t.matches('input[type="checkbox"].profile-format')) {
                syncSelectAllStates();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProfileModal);
    } else {
        initProfileModal();
    }
})();
