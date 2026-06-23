/**
 * js/features/user-profile.js
 * Central user profile modal — powers personalization across all Agent Sales Coach tools.
 */
(function () {
  'use strict';

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
    }

    // Core save logic (can be called silently for auto-save or with feedback for explicit Save)
    function performSave(showFeedback = true, closeAfter = true) {
        const profile = {
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
            hobbies: Array.from(document.querySelectorAll('.profile-hobby:checked')).map(c => c.value),
            activities: Array.from(document.querySelectorAll('.profile-activity:checked')).map(c => c.value),
            niches: Array.from(document.querySelectorAll('.profile-niche:checked')).map(c => c.value),
            nichesOther: document.getElementById('profile-niche-other')?.value.trim() || '',
            challenges: Array.from(document.querySelectorAll('.profile-challenge:checked')).map(c => c.value),
            challengesOther: document.getElementById('profile-challenge-other')?.value.trim() || '',
            formats: Array.from(document.querySelectorAll('.profile-format:checked')).map(c => c.value),
            voiceTraits: Array.from(document.querySelectorAll('.profile-voice:checked')).map(c => c.value),
            partnerTypes: Array.from(document.querySelectorAll('.profile-partner:checked')).map(c => c.value),
            partnerTypesOther: document.getElementById('profile-partner-other')?.value.trim() || '',

            // Professional Branding & Social (central for newsletter + future content)
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

        // Event delegation on the whole modal: any typing, selecting, or checkbox toggle auto-saves
        modal.addEventListener('input', autoSaveProfile);
        modal.addEventListener('change', autoSaveProfile);
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

    // Initialize after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProfileModal);
    } else {
        initProfileModal();
    }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfileModal);
  } else {
    initProfileModal();
  }
})();
