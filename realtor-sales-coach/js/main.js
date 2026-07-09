/**
 * js/main.js
 * Core UI initialization for the Ultimate Agent Sales Coach.
 *
 * Responsibilities (Phase 0.5):
 * - Sidebar / mobile menu toggle
 * - Quote rotator (data + auto-cycle + manual arrows)
 * - Theme (dark/light) toggle + persistence
 * - API Key management button + modal (new)
 *
 * This file centralizes the "shell" behavior so index.html stays cleaner.
 */

(function () {
  'use strict';

  // =====================================================
  // 1. SIDEBAR / MOBILE MENU TOGGLE (enhanced for desktop collapse)
  // - Desktop: uses body.sidebar-collapsed (removes margin + slides sidebar off)
  // - Mobile: keeps classic overlay (left-0 / left-[-300px])
  // - Persists user preference in localStorage
  // - Icon + ARIA updates, smooth experience
  // =====================================================
  function initSidebarToggle() {
    const menuBtn = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    if (!menuBtn || !sidebar) return;

    const DESKTOP_BREAKPOINT = 768; // matches Tailwind md:
    const STORAGE_KEY = 'sidebarCollapsed';

    function isDesktop() {
      return window.innerWidth >= DESKTOP_BREAKPOINT;
    }

    // Always use hamburger icon (no X ever). Just update aria label based on action.
    function setIcon(collapsed) {
      const icon = menuBtn.querySelector('i');
      if (!icon) return;
      // Always bars - the position tells the story (in sidebar = close it; far left = open it)
      icon.classList.remove('fa-times');
      icon.classList.add('fa-bars');

      if (collapsed) {
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.setAttribute('aria-label', 'Open sidebar');
      } else {
        menuBtn.setAttribute('aria-expanded', 'true');
        menuBtn.setAttribute('aria-label', 'Close sidebar');
      }
    }

    function positionToggleButton(collapsed) {
      if (!menuBtn) return;

      if (collapsed) {
        // Very far top-left corner of the page
        menuBtn.style.left = '1rem';
        menuBtn.style.top = '1rem';

        // Make it visible on light page content: switch to brand teal/blue
        menuBtn.classList.remove('text-white', '!bg-[#001f3f]/90', '!border-white/20');
        menuBtn.classList.add('!text-[#00A89D]');

        // Light glass bg + teal border for visibility on white/gray content
        // (CSS below will also reinforce)
      } else {
        // Top-right corner *inside* the sidebar
        const sbWidth = sidebar.offsetWidth || 256; // 16rem default, 18rem on lg
        const btnSize = 44;
        const rightPadding = 14;
        const leftPos = sbWidth - btnSize - rightPadding;
        menuBtn.style.left = leftPos + 'px';
        menuBtn.style.top = '1rem';

        // Blend with the dark sidebar - white/light icon
        menuBtn.classList.remove('!text-[#00A89D]');
        menuBtn.classList.add('text-white', '!bg-[#001f3f]/90', '!border-white/20');
      }
    }

    function applyCollapsedState(collapsed, save = true) {
      if (collapsed) {
        document.body.classList.add('sidebar-collapsed');
      } else {
        document.body.classList.remove('sidebar-collapsed');
      }

      // For mobile overlay mode we still manage the left classes
      if (!isDesktop()) {
        if (collapsed) {
          sidebar.classList.remove('left-0', 'open');
          sidebar.classList.add('left-[-300px]');
        } else {
          sidebar.classList.add('left-0', 'open');
          sidebar.classList.remove('left-[-300px]');
        }
      }

      setIcon(collapsed);
      positionToggleButton(collapsed);

      if (save) {
        try { localStorage.setItem(STORAGE_KEY, collapsed ? 'true' : 'false'); } catch (e) {}
      }
    }

    // Click handler
    menuBtn.addEventListener('click', () => {
      if (isDesktop()) {
        const currentlyCollapsed = document.body.classList.contains('sidebar-collapsed');
        applyCollapsedState(!currentlyCollapsed);
      } else {
        // Mobile overlay
        const isOpen = sidebar.classList.contains('left-0');
        applyCollapsedState(isOpen, false);
      }
    });

    // Restore saved desktop preference
    let startCollapsed = false;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'true' && isDesktop()) startCollapsed = true;
    } catch (e) {}

    // Initial state (default = sidebar visible)
    if (startCollapsed && isDesktop()) {
      document.body.classList.add('sidebar-collapsed');
      sidebar.classList.remove('left-0', 'open');
      sidebar.classList.add('left-[-300px]');
      setIcon(true);
      positionToggleButton(true); // far left
    } else {
      if (isDesktop()) {
        sidebar.classList.add('left-0');
        setIcon(false);
        // Small delay so sidebar width is accurate for positioning
        setTimeout(() => positionToggleButton(false), 30);
      } else {
        sidebar.classList.remove('left-0', 'open');
        sidebar.classList.add('left-[-300px]');
        setIcon(true);
        positionToggleButton(true);
      }
    }

    // Clicking outside closes on mobile only
    document.addEventListener('click', (e) => {
      if (!isDesktop() && sidebar.classList.contains('left-0')) {
        if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
          applyCollapsedState(true, false);
        }
      }
    });

    // Resize handling
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (isDesktop()) {
          const savedPref = localStorage.getItem(STORAGE_KEY) === 'true';
          if (savedPref && !document.body.classList.contains('sidebar-collapsed')) {
            applyCollapsedState(true, false);
          } else if (!savedPref && document.body.classList.contains('sidebar-collapsed')) {
            applyCollapsedState(false, false);
          } else {
            // Re-position in case width changed
            positionToggleButton(document.body.classList.contains('sidebar-collapsed'));
          }
        } else {
          document.body.classList.remove('sidebar-collapsed');
          positionToggleButton(true);
        }
      }, 120);
    });

    console.log('[main.js] Sidebar toggle initialized (hamburger always in sidebar top-right when open, far top-left when closed)');
  }

  // =====================================================
  // 2. QUOTE ROTATOR (full data + behavior)
  // =====================================================
  const quotes = [
    "The harder you work, the luckier you get.",
    "Your next loan is one call away.",
    "Success is rented, and the rent is due every day.",
    "Every “no” brings you closer to a “yes.”",
    "You don’t have to be great to start, but you have to start to be great.",
    "Turn obstacles into opportunities.",
    "Be so good they can’t ignore you.",
    "Hustle beats talent when talent doesn’t hustle.",
    "Make someone’s dream come true today!",
    "Doubt kills more dreams than failure ever will.",
    "The best way to predict the future is to create it.",
    "Winners never quit, and quitters never win.",
    "Your only limit is you.",
    "Small steps today, big wins tomorrow.",
    "Stay positive, work hard, make it happen.",
    "Dream big. Work hard. Stay focused.",
    "You’re one decision away from a totally different life.",
    "Good things come to those who hustle.",
    "Don’t wait for opportunity—create it.",
    "Believe you can and you’re halfway there.",
    "Push yourself because no one else is going to do it for you.",
    "Great things never come from comfort zones.",
    "Rise up and attack the day with enthusiasm.",
    "Turn “I wish” into “I will.”",
    "Make today count.",
    "Your future is created by what you do today.",
    "Excuses don’t build empires.",
    "Stay hungry, stay humble, keep working.",
    "The harder the battle, the sweeter the victory.",
    "You miss 100% of the shots you don’t take.",
    "Do something today your future self will thank you for.",
    "Success is the sum of small efforts repeated daily.",
    "Be the energy you want to attract.",
    "Fall seven times, stand up eight.",
    "Prove them wrong.",
    "Today’s grind = tomorrow’s shine.",
    "Limits exist only in the mind.",
    "Keep going—you’re closer than you think.",
    "One closed deal can change everything.",
    "Discipline is choosing between what you want now and what you want most.",
    "Wake up with purpose, go to bed with satisfaction.",
    "Don’t stop when you’re tired—stop when you’re done.",
    "The comeback is always stronger than the setback.",
    "You were born to win.",
    "Make it happen. Shock everyone.",
    "Every call counts. Make each one great.",
    "Listings don’t find themselves—go get yours.",
    "Your pipeline is your paycheck. Fill it.",
    "Close the day strong.",
    "Clients are waiting—be their guide today.",
    "Momentum is built one “yes” at a time.",
    "Outwork yesterday’s you.",
    "Average effort = average results. Be extraordinary.",
    "Grind now, glow later.",
    "The best agents don’t wait for the phone to ring.",
    "Confidence closes.",
    "Every “I’ll think about it” is a future “Where do I sign?”",
    "Pressure makes diamonds—thrive in it.",
    "Your next record-breaking month starts today.",
    "Stop wishing, start closing.",
    "Be the agent they brag about to their friends.",
    "One more call could change your year.",
    "Today’s effort = tomorrow’s closings.",
    "Clients don’t care how much you know until they know how much you care.",
    "Speed + service = unstoppable.",
    "You’ve survived 100% of your worst days so far. Keep going.",
    "The magic you’re looking for is in the work you’re avoiding.",
    "Build relationships, not just transactions.",
    "Done is better than perfect.",
    "Lead with value, close with ease.",
    "Turn “I can’t afford it” into “How do I make this happen?”",
    "Make today so awesome yesterday gets jealous.",
    "The only bad call is the one you didn’t make.",
    "If you don’t own the day, the day owns you.",
    "Clients remember how you made them feel—make it amazing.",
    "Keep swinging—the home runs are coming.",
    "Success is a decision away. Decide now.",
    "Go out there and make someone’s dream happen.",
    "Visibility beats ability 8 days a week.",
    "Be intentional with your hours or someone else will be.",
    "Small, consistent actions compound into massive results.",
    "Intentional effort today, dividends paid tomorrow.",
    "Winners are just people who stayed consistent when no one was watching.",
    "Show up on purpose—every single day.",
    "Consistency turns average agents into top producers.",
    "Intentional mornings create unstoppable months.",
    "Do the boring work consistently and the results will come.",
    "Consistency is louder than motivation ever will be.",
    "The deal you close tomorrow was built by what you did today—and yesterday.",
    "Consistent follow-up turns “maybe” into “money.”",
    "Intentional agents don’t wait for leads—they create them.",
    "Success loves preparation. Be consistent in yours.",
    "Consistency compounds faster than market cycles.",
    "The difference between good and great is one more intentional call.",
    "Consistency is the bridge between leads and legacy.",
    "Intentional effort feels like work; consistent effort feels like winning.",
    "Show up, suit up, follow up—every single day.",
    "Intentionality today keeps regret away tomorrow.",
    "Consistency isn’t sexy until you see the scoreboard.",
    "Be relentlessly intentional about the activities that pay.",
    "Consistency is the silent closer that never takes a day off.",
    "Real self-confidence comes from giving the world irrefutable proof you are who you say you are.",
    "Everyone is jealous of what you’ve got, nobody is jealous of how you got there.",
    "The hard thing to do and the right thing to do, are almost always the same thing.",
    "You grow in proportion to the weight you take on voluntarily.",
    "It’s nice to be important, but it’s more important to be nice."
  ];

  let currentQuoteIndex = Math.floor(Math.random() * quotes.length);

  function initQuoteRotator() {
    const quoteDisplay = document.getElementById('quote-display');
    const quotePrev = document.getElementById('quote-prev');
    const quoteNext = document.getElementById('quote-next');

    function showQuote(index) {
      if (!quoteDisplay) return;
      quoteDisplay.classList.add('fade');
      setTimeout(() => {
        quoteDisplay.textContent = quotes[index];
        quoteDisplay.classList.remove('fade');
      }, 400);
    }

    if (quoteDisplay) {
      showQuote(currentQuoteIndex);

      // Auto rotation
      setInterval(() => {
        currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
        showQuote(currentQuoteIndex);
      }, 12500);

      if (quotePrev) {
        quotePrev.addEventListener('click', () => {
          currentQuoteIndex = (currentQuoteIndex - 1 + quotes.length) % quotes.length;
          showQuote(currentQuoteIndex);
        });
      }

      if (quoteNext) {
        quoteNext.addEventListener('click', () => {
          currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
          showQuote(currentQuoteIndex);
        });
      }
    }

    console.log('[main.js] Quote rotator initialized');
  }

  // =====================================================
  // 3. THEME TOGGLE + PERSISTENCE
  // =====================================================
  function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    const icon = document.getElementById('theme-icon');
    const label = toggleBtn?.querySelector('span');

    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      if (icon) {
        icon.classList.replace('fa-moon', 'fa-sun');
        icon.classList.replace('text-yellow-400', 'text-yellow-500');
      }
      if (label) label.textContent = 'Light Mode';
    } else {
      document.documentElement.classList.add('dark');
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (document.documentElement.classList.contains('dark')) {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
          if (icon) {
            icon.classList.replace('fa-moon', 'fa-sun');
            icon.classList.replace('text-yellow-400', 'text-yellow-500');
          }
          if (label) label.textContent = 'Light Mode';
        } else {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
          if (icon) {
            icon.classList.replace('fa-sun', 'fa-moon');
            icon.classList.replace('text-yellow-500', 'text-yellow-400');
          }
          if (label) label.textContent = 'Dark Mode';
        }
      });
    }

    console.log('[main.js] Theme toggle initialized');
  }

  // =====================================================
  // 4. API KEY BUTTON + MODAL (new in Phase 0.5)
  // =====================================================
  function initApiKeyModal() {
    const apiBtn = document.getElementById('api-key-btn');
    const modal = document.getElementById('api-key-modal');
    if (!apiBtn || !modal) return;

    // In production hosted mode the server may manage the key — adjust the UI
    const hosted = typeof window.isProductionHosted === 'function' && window.isProductionHosted();

    if (hosted) {
      apiBtn.title = 'View API key status — server-managed; you can add a personal override if needed.';
    }

    const statusEl = document.getElementById('api-key-status');
    const inputEl = document.getElementById('api-key-input');
    const saveBtn = document.getElementById('api-key-save');
    const clearBtn = document.getElementById('api-key-clear');
    const closeBtn = document.getElementById('api-key-modal-close');
    const closeBottom = document.getElementById('api-key-close-bottom');

    function maskKey(key) {
      if (!key) return 'Not configured';
      const trimmed = key.trim();
      if (trimmed.length <= 8) return 'xai-••••••••';
      return 'xai-' + '•'.repeat(Math.max(8, trimmed.length - 7)) + trimmed.slice(-4);
    }

    function updateStatus() {
      const current = (window.getGrokApiKey && window.getGrokApiKey()) || null;
      if (statusEl) {
        statusEl.textContent = current ? maskKey(current) : 'Not configured';
        statusEl.className = current
          ? 'font-mono text-sm px-3 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
          : 'font-mono text-sm px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700';
      }
    }

    function showModal() {
      if (typeof window.openAppModal === 'function') {
        window.openAppModal(modal);
      } else {
        if (typeof window.ensureModalInViewport === 'function') {
          window.ensureModalInViewport(modal);
        }
        modal.classList.remove('hidden');
        modal.classList.add('flex', 'items-center', 'justify-center');
        modal.style.display = 'flex';
      }
      updateStatus();

      const hosted = typeof window.isProductionHosted === 'function' && window.isProductionHosted();

      const hint = modal.querySelector('#api-hosted-hint');
      const hasLocalKey = !!(window.getGrokApiKey && window.getGrokApiKey());

      if (hosted && !hasLocalKey) {
        if (statusEl) {
          statusEl.textContent = 'Server-managed (add a key below to override)';
          statusEl.className = 'font-mono text-sm px-3 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200';
        }
        if (hint) hint.classList.remove('hidden');
      } else {
        if (hint) hint.classList.add('hidden');
      }

      if (inputEl) inputEl.style.display = '';
      if (saveBtn) saveBtn.style.display = '';
      if (clearBtn) clearBtn.style.display = '';

      if (inputEl && inputEl.style.display !== 'none') {
        inputEl.value = '';
        inputEl.focus();
      }
    }

    function hideModal() {
      if (typeof window.closeAppModal === 'function') {
        window.closeAppModal(modal);
      } else {
        modal.classList.remove('flex', 'items-center', 'justify-center');
        modal.classList.add('hidden');
        modal.style.display = 'none';
      }
    }

    // Open modal — expose globally so header button can use onclick fallback too
    window.openApiKeyModal = showModal;
    apiBtn.type = 'button';
    if (!apiBtn.dataset.apiKeyBound) {
      apiBtn.addEventListener('click', showModal);
      apiBtn.dataset.apiKeyBound = '1';
    }

    // Close handlers
    if (closeBtn) closeBtn.addEventListener('click', hideModal);
    if (closeBottom) closeBottom.addEventListener('click', hideModal);

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideModal();
    });

    // Save / Update
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const val = inputEl ? inputEl.value.trim() : '';
        if (!val) {
          if (window.showToast) window.showToast('Please paste a valid key', 'warning');
          return;
        }
        if (!val.startsWith('xai-')) {
          if (window.showToast) window.showToast('Key should start with "xai-"', 'error');
          return;
        }

        if (window.setGrokApiKey) {
          window.setGrokApiKey(val);
        } else {
          localStorage.setItem('grokApiKey', val);
        }

        updateStatus();
        if (inputEl) inputEl.value = '';

        if (window.showToast) {
          window.showToast('✅ API key saved successfully', 'success');
        }
      });
    }

    // Clear
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (window.clearGrokApiKey) {
          window.clearGrokApiKey();
        } else {
          localStorage.removeItem('grokApiKey');
        }
        updateStatus();
        if (inputEl) inputEl.value = '';
        if (window.showToast) {
          window.showToast('API key cleared from this browser', 'info');
        }
      });
    }

    // Keyboard escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        hideModal();
      }
    });

    console.log('[main.js] API Key modal initialized');
  }

  // =====================================================
  // OLD / SUPERSEDED INITIALIZER (kept for safety during growth — final version is below)
  // =====================================================
  function initCoreUI() {
    // Superseded by the more complete initCoreUI at the bottom of this file.
    // This stub prevents double-initialization issues from previous merges.
    if (window.__sidebarToggleInitialized) return;
  }

  // Social post generate uses onclick on the button — no duplicate listener needed.
  function initSocialPostButtonFix() {}

  // =====================================================
  // 5. NAVIGATION / SECTION SWITCHING (consolidated)
  // =====================================================
  function showSection(id) {
    if (!id) return;

    // Alias map for old/stale links in saved plans or elsewhere
    const aliases = {
      'social-media-strategy': 'social',
      'referral-partners': 'referrals',
      'prospecting': 'weekly-win-plan',
      'database-nurturing': 'database'
    };
    if (aliases[id]) {
      id = aliases[id];
    }

    // Hide all main content sections
    document.querySelectorAll('main section').forEach(sec => {
      sec.classList.add('hidden');
    });

    // Show the target
    const target = document.getElementById(id);
    if (target) {
      target.classList.remove('hidden');
      // Smooth scroll into view
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      if (typeof window.onCoachSectionShown === 'function') {
        try { window.onCoachSectionShown(id); } catch (e) { console.warn('[onboarding-coach]', e); }
      }

      // Weekly Win Plan (separate from 2026 Business Plan) button wiring (robust fallback)
      // IMPORTANT: Weekly Win Plan (time blocks) and 2026 Business Plan are TWO SEPARATE features.
      // - Weekly: generateWeeklyPlan(), #weekly-win-plan section, #generate-win-plan-btn
      // - 2026 Business: generatePlan(), #planning section, #generate-plan-btn, uses wireGeneratePlanButton + enrich panel
      // Shared file (weekly-win-plan.js) but completely separate functions, prompts, buttons, outputs, and loading UI.
      if (id === 'weekly-win-plan') {
        if (typeof window.updateWeeklyCustomizeDisplays === 'function') {
          try { window.updateWeeklyCustomizeDisplays(); } catch (e) {}
        }
        if (typeof window.ToolBridges?.rebuildAnnualContextFromDom === 'function') {
          window.ToolBridges.rebuildAnnualContextFromDom();
        }
        if (typeof window.ToolBridges?.refreshAnnualBridgeUI === 'function') {
          window.ToolBridges.refreshAnnualBridgeUI();
        }
        setTimeout(() => {
          const editBtn = document.getElementById('edit-setup-btn');
          if (editBtn && typeof window.openSetupWizard === 'function') {
            editBtn.onclick = window.openSetupWizard;   // direct assignment as fallback
          }

          // Wire the Weekly Win Plan button as fallback (the business plan button is wired in weekly-win-plan.js init)
          const wizardGenBtn = document.getElementById('generate-win-plan-btn');
          if (wizardGenBtn && !wizardGenBtn._wwpWired) {
            wizardGenBtn._wwpWired = true;
            // Use addEventListener to not override other
            wizardGenBtn.addEventListener('click', () => {
              console.log('[main.js fallback] Weekly Win Plan button clicked');
              // Force the (custom weekly) progress UI immediately via the shared helper
              if (typeof window.forceShowGlobalLoading === 'function') {
                window.forceShowGlobalLoading('Building Your Weekly Win Plan...');
              }
              const le = document.getElementById('global-loading');
              if (le) {
                le.classList.remove('hidden');
                le.style.setProperty('display', 'flex', 'important');
                le.style.setProperty('z-index', '99999', 'important');
                le.style.setProperty('visibility', 'visible', 'important');
                le.style.setProperty('opacity', '1', 'important');
              }
              if (typeof window.generateWeeklyPlan === 'function') {
                window.generateWeeklyPlan();
              } else {
                console.warn('Weekly Win Plan generator not ready yet');
              }
            });
          }
        }, 150);
      }

      // 2026 Business Plan (separate from Weekly Win Plan) — refresh profile header + live insight + wiring when visiting (leverages profile heavily + keeps things feeling alive and low-pressure)
      // See note in weekly-win-plan.js for separation of the two tools.
      if (id === 'planning') {
        // Immediate wiring so clicks right after nav are caught (delegation makes it reliable)
        if (typeof window.wireGeneratePlanButton === 'function') {
          try { window.wireGeneratePlanButton(); } catch(e){}
        }
        setTimeout(() => {
          // Wire FIRST in the timeout so even if later sync calls throw, the button is guaranteed to work
          if (typeof window.wireGeneratePlanButton === 'function') {
            try { window.wireGeneratePlanButton(); } catch(e){}
          } else if (typeof window.generatePlan === 'function') {
            const btn = document.getElementById('generate-plan-btn');
            if (btn && !btn._gpwWired) {
              btn._gpwWired = true;
              btn.addEventListener('click', () => {
                if (typeof window.forceShowGlobalLoading === 'function') window.forceShowGlobalLoading('Crafting Your 2026 Business Plan...');
                window.generatePlan('plan-output');
              });
            }
          }

          if (typeof window.refreshPlanProfileHeader === 'function') window.refreshPlanProfileHeader();
          if (typeof window.updatePlanLiveInsight === 'function') window.updatePlanLiveInsight();
          if (typeof window.wirePlanLiveCalculations === 'function') window.wirePlanLiveCalculations();
          if (typeof window.wirePlanStyleCards === 'function') window.wirePlanStyleCards();
          if (typeof window.updatePlanCompleteness === 'function') window.updatePlanCompleteness();
          if (typeof window.renderExtendedProfileInfo === 'function') window.renderExtendedProfileInfo();
          if (typeof window.updateHobbyTactics === 'function') window.updateHobbyTactics();
          if (typeof window.restoreBusinessPlanningForm === 'function') {
            try { window.restoreBusinessPlanningForm(); } catch(e){}
          }
          // Ensure any previously generated 2026 Business Plan is visible when arriving at the section.
          // (init calls this too, but we re-call on nav in case weekly/other tools cleared the DOM output while the saved copy remained in localStorage.)
          if (typeof window.restoreSavedBusinessPlan === 'function') {
            try { window.restoreSavedBusinessPlan(); } catch(e){}
          }
          // Auto-sync from profile by default (as requested). Button is available for manual re-sync if user made custom changes or updated profile elsewhere.
          if (typeof window.syncPlanningFormFromProfile === 'function') {
            window.syncPlanningFormFromProfile();
          } else {
            console.warn('[planning] syncPlanningFormFromProfile not available yet');
          }
          // Extra safety re-wire shortly after sync (in case sync had side effects)
          setTimeout(() => {
            if (typeof window.wireGeneratePlanButton === 'function') window.wireGeneratePlanButton();
          }, 30);
        }, 180);
      }

      // Mindset Lab — refresh saved button states when returning to the section
      if (id === 'mindset-motivation') {
        setTimeout(() => {
          if (typeof window.renderMindsetLab === 'function') {
            window.renderMindsetLab();
          }
        }, 80);
      }

      // Book Vault — ensure books, featured row, filters and count are rendered when navigating
      if (id === 'books') {
        setTimeout(() => {
          if (typeof window.renderBookVault === 'function') {
            try {
              window.renderBookVault();
            } catch (e) {
              console.warn('[Book Vault] Re-render failed:', e);
            }
          }
        }, 80);
      }

      // Newsletter Generator — sync profile fields + ensure listeners + initial previews for custom curated
      if (id === 'newsletter-generator') {
        setTimeout(() => {
          if (typeof window.syncNewsletterFromProfile === 'function') {
            try { window.syncNewsletterFromProfile(); } catch(e){}
          }
          if (typeof window.updatePreviews === 'function') {
            try { window.updatePreviews(); } catch(e){}
          }
          // Re-expose choice modal helpers in case any later code clobbered (belt + suspenders)
          if (typeof window.openNewsletterChoiceModal === 'function') {
            window.openModal = window.openNewsletterChoiceModal;
          }
        }, 80);
      }
    } else {
      console.warn(`[showSection] Section with id="${id}" not found`);
      return;
    }

    // Auto-close any newsletter-specific modals when leaving the newsletter tool
    // (the tips modal now lives at top level so it is not auto-hidden by the section)
    if (id !== 'newsletter-generator' && typeof window.closeNewsletterTips === 'function') {
      try { window.closeNewsletterTips(); } catch (e) {}
    }

    // Close mobile sidebar overlay (do NOT force-close a user-collapsed desktop sidebar)
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-toggle');
    if (sidebar && window.innerWidth < 768) {
      sidebar.classList.remove('left-0', 'open');
      sidebar.classList.add('left-[-300px]');
      // Move hamburger back to far top-left corner + ensure teal color for visibility on light content
      if (menuBtn) {
        menuBtn.style.left = '1rem';
        menuBtn.style.top = '1rem';
        menuBtn.classList.remove('text-white', '!bg-[#001f3f]/90', '!border-white/20');
        menuBtn.classList.add('!text-[#00A89D]');
      }
    }

    // Update active state on sidebar links (uses permanent .active rule in main.css)
    document.querySelectorAll('#sidebar a[href^="#"]').forEach(link => {
      const linkId = link.getAttribute('href').replace('#', '');
      if (linkId === id) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Expose globally so inline onclick handlers and feature files can call it
  window.showSection = showSection;

  // Robust deep-link navigator for the full Referral Partners tool (used from Database Nurturing modal + anywhere else)
  window.openReferralPartnersTool = function() {
    try {
      if (typeof closeAllModals === 'function') {
        closeAllModals();
      }
    } catch (e) {}

    const targetId = 'referrals';

    if (typeof window.showSection === 'function') {
      window.showSection(targetId);
    } else {
      // Fallback if showSection not yet available
      document.querySelectorAll('main section').forEach(sec => sec.classList.add('hidden'));
      const target = document.getElementById(targetId);
      if (target) {
        target.classList.remove('hidden');
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    // Premium highlight ring after arrival (non-obnoxious, self-clearing)
    setTimeout(() => {
      const r = document.getElementById(targetId);
      if (r) {
        r.classList.add('ring-4', 'ring-[#00A89D]', 'ring-offset-4', 'rounded-3xl', 'transition-all');
        setTimeout(() => {
          if (r) r.classList.remove('ring-4', 'ring-[#00A89D]', 'ring-offset-4', 'rounded-3xl');
        }, 2400);
      }
    }, 720);
  };

  function initNavigation() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) {
      console.warn('[main.js] Sidebar not found — navigation not initialized');
      return;
    }

    // Delegate clicks on sidebar links that point to sections
    sidebar.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      // Allow external links (new tab, etc.) to work normally
      const href = link.getAttribute('href');
      if (link.target === '_blank' || !href.startsWith('#')) {
        return;
      }

      e.preventDefault();

      const id = href.replace('#', '');
      showSection(id);
    });

    // Support browser back/forward and direct links (#id in URL)
    window.addEventListener('hashchange', () => {
      const id = location.hash.replace('#', '');
      if (id) showSection(id);
    });

    // On initial page load, respect a hash if present, otherwise show AI Chat as default
    if (location.hash) {
      const id = location.hash.replace('#', '');
      setTimeout(() => {
        const target = document.getElementById(id);
        if (target) showSection(id);
      }, 150);
    } else {
      // Default view: Show AI Chat Assistant (original intended behavior)
      setTimeout(() => {
        const aiChat = document.getElementById('ai-chat');
        if (aiChat) {
          document.querySelectorAll('main section').forEach(sec => sec.classList.add('hidden'));
          aiChat.classList.remove('hidden');
        }
      }, 200);
    }

    console.log('[main.js] Navigation initialized (sidebar links + hash support)');
  }

  // Helper for Weekly Win Plan buttons (retry until the script loads)
  window.tryCallWeeklyFunction = function(name) {
    const fn = window[name];
    if (typeof fn === 'function') {
      fn();
    } else {
      // Retry a few times in case the script is still loading
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        const f = window[name];
        if (typeof f === 'function') {
          clearInterval(interval);
          f();
        } else if (attempts > 20) {
          clearInterval(interval);
          window.notifyUser('Weekly Win Plan script failed to load. Please hard refresh the page (Ctrl+Shift+R).', 'error', 5000);
        }
      }, 100);
    }
  };


  // =====================================================
  // ACCORDION TOGGLE (used across many sections)
  // =====================================================
  window.toggleAccordion = function toggleAccordion(button) {
    if (!button) return;
    const content = button.nextElementSibling;
    if (!content) return;

    content.classList.toggle('open');

    // Optional: rotate the chevron icon if present
    const icon = button.querySelector('i.fa-chevron-down, i.fa-chevron-up');
    if (icon) {
      icon.classList.toggle('fa-chevron-down');
      icon.classList.toggle('fa-chevron-up');
    }
  };

  console.log('[main.js] toggleAccordion exposed globally');

  function initCoreUI() {
    initSidebarToggle();
    initQuoteRotator();
    initThemeToggle();
    initApiKeyModal();
    initSocialPostButtonFix();
    initNavigation();   // ← NEW consolidated nav

    // Pre-create the global loading overlay (self-healing) so that *every* AI tool
    // (2026 Business Plan, Weekly Win Plan, Social, Blog, Prospecting blocks, etc.)
    // that calls showLoadingWithTips / force never sees "element not found".
    // If the static <div id="global-loading"> from index.html is absent (cache, old HTML copy, etc.)
    // we inject it now (hidden) so it's ready the instant a generate button is clicked.
    if (typeof ensureGlobalLoadingExists === 'function') {
      ensureGlobalLoadingExists();
    }

    console.log('%c[main.js] Core UI initialized successfully (Phase 0.5 + cleanup + nav)', 'color:#00A89D; font-weight:600');
  }

  // Boot on DOM ready (safe even if other scripts also listen)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCoreUI);
  } else {
    // DOM already ready (late script load)
    initCoreUI();
  }

  // =====================================================
  // IMPROVED GLOBAL LOADING EXPERIENCE
  // =====================================================
  let loadingInterval = null;

  // The inner card HTML for the global loading overlay.
  // Duplicated here so forceShowGlobalLoading can *create* the element on the fly if the static one
  // from index.html is missing (common with browser cache, partial reloads, or older saved HTML copies).
  // This makes the progress modals resilient for both 2026 Business Plan and Weekly Win Plan.
  const GLOBAL_LOADING_CARD_INNER = `
        <!-- Spinner + Icon Area -->
        <div class="flex justify-center mb-6">
            <div class="relative">
                <i class="fas fa-spinner fa-spin text-6xl text-[#00A89D]"></i>
            </div>
        </div>
        
        <h3 id="global-loading-title" class="text-3xl font-bold text-[#F15A29] mb-3 tracking-tight">
            Working on it...
        </h3>
        
        <div id="global-loading-message" class="text-lg text-gray-600 dark:text-gray-300 min-h-[60px] transition-opacity duration-300 leading-relaxed">
            Personalized content incoming — this can take up to a minute.
        </div>
        
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            Good things take time. We’re building something great for you.
        </div>
        <div id="plan-enrich-panel"></div>
  `;

  // Ensure the overlay element exists in the DOM (create dynamically if the one in index.html is missing).
  // Called from initCoreUI on boot so it is ready before any user clicks a generate button.
  // Does NOT show the overlay (leaves it hidden).
  function ensureGlobalLoadingExists() {
    if (document.getElementById('global-loading')) return;

    try {
      const loadingEl = document.createElement('div');
      loadingEl.id = 'global-loading';
      loadingEl.className = 'hidden fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md';

      const card = document.createElement('div');
      card.className = 'bg-white dark:bg-gray-800 p-10 md:p-12 rounded-3xl shadow-2xl text-center w-full max-w-lg mx-4 border border-gray-200 dark:border-gray-700';
      card.innerHTML = GLOBAL_LOADING_CARD_INNER;

      loadingEl.appendChild(card);

      const attachTo = document.body || document.documentElement;
      attachTo.appendChild(loadingEl);

      console.log('%c[main.js] ensureGlobalLoadingExists: dynamically created #global-loading (static version missing from current HTML — hard refresh recommended)', 'color:#00A89D');
    } catch (e) {
      console.warn('[main.js] ensureGlobalLoadingExists failed to create fallback overlay:', e);
    }
  }

  // ULTRA-DEFENSIVE force helper. ALWAYS call this (or showLoadingWithTips) as the absolute first action
  // when a generate button is clicked. This ensures the progress overlay is visible immediately and wins
  // over any page notes or partial content. Used by 2026 Business Plan + Weekly Win Plan + other AI tools.
  //
  // Self-healing: if #global-loading does not exist in DOM (e.g. cached/outdated index.html, script order edge case),
  // we create it dynamically and append it so the user still gets the rich progress modal.
  window.forceShowGlobalLoading = function forceShowGlobalLoading(title = 'Working on it...') {
    let loadingEl = document.getElementById('global-loading');

    if (!loadingEl) {
      console.warn('[forceShowGlobalLoading] #global-loading element not found in DOM — will create dynamically');
      console.info('%c[forceShowGlobalLoading] Dynamically injected the loading overlay. Hard-refresh (Ctrl/Cmd+Shift+R) the page for the static version in index.html to take effect. This fallback keeps the 2026 + Weekly progress modals working.', 'color:#F15A29; font-weight:500');

      // Create the outer overlay
      loadingEl = document.createElement('div');
      loadingEl.id = 'global-loading';
      // Base classes (we will force the important styles below anyway)
      loadingEl.className = 'fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md';

      // The card (exact structure expected by enrichPlanLoading which does .querySelector('div') for the white card,
      // and by title/message getters)
      const card = document.createElement('div');
      card.className = 'bg-white dark:bg-gray-900 p-8 md:p-10 rounded-3xl shadow-2xl text-center w-full max-w-3xl mx-4 border border-gray-200 dark:border-gray-700';
      card.innerHTML = GLOBAL_LOADING_CARD_INNER;

      loadingEl.appendChild(card);

      // Append as high as possible so it is always discoverable and on top
      const attachTo = document.body || document.documentElement;
      attachTo.appendChild(loadingEl);
    }

    if (typeof window.ensureModalInViewport === 'function') {
      window.ensureModalInViewport(loadingEl);
    } else if (loadingEl.parentElement !== document.body) {
      document.body.appendChild(loadingEl);
    }

    console.log('%c[forceShowGlobalLoading] FORCING overlay visible for: ' + title, 'color:#00A89D; font-weight:bold');

    loadingEl.classList.remove('hidden');
    loadingEl.removeAttribute('hidden');
    loadingEl.classList.add('flex', 'items-center', 'justify-center');

    // Set every critical property with !important so no Tailwind class, ancestor, or late stylesheet can hide it
    const forceStyles = {
      'display': 'flex',
      'position': 'fixed',
      'top': '0',
      'left': '0',
      'right': '0',
      'bottom': '0',
      'inset': '0',
      'z-index': '99999',
      'visibility': 'visible',
      'opacity': '1'
    };
    Object.keys(forceStyles).forEach(function (prop) {
      loadingEl.style.setProperty(prop, forceStyles[prop], 'important');
    });

    // Set title if the standard title element still exists (business plan path keeps original structure)
    const titleEl = document.getElementById('global-loading-title');
    if (titleEl && title) {
      titleEl.textContent = title;
    }
    return loadingEl;   // always return the element now (never false)
  };

  window.showLoadingWithTips = function showLoadingWithTips(tips = [], title = 'Working on it...') {
    // forceShowGlobalLoading now self-heals (creates the element if the static one from index.html is absent due to cache etc.)
    // It always returns the element (or we fall back to a final query).
    let loadingEl = null;
    if (typeof window.forceShowGlobalLoading === 'function') {
      loadingEl = window.forceShowGlobalLoading(title);
    }
    if (!loadingEl) {
      loadingEl = document.getElementById('global-loading');
    }

    const titleEl = document.getElementById('global-loading-title');
    const messageEl = document.getElementById('global-loading-message');

    if (!loadingEl) {
      console.warn('[showLoadingWithTips] #global-loading element not found in DOM even after force fallback');
      return;
    }

    console.log('[showLoadingWithTips] Showing loading modal for:', title);

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = tips[0] || 'This can take a moment...';

    // Clear any previous rotator
    if (loadingInterval) clearInterval(loadingInterval);

    if (tips.length > 1 && messageEl) {
      let index = 0;
      loadingInterval = setInterval(() => {
        index = (index + 1) % tips.length;
        messageEl.style.opacity = '0';
        setTimeout(() => {
          messageEl.textContent = tips[index];
          messageEl.style.opacity = '1';
        }, 250);
      }, 4200);
    }
  };

  /** @deprecated Use showAgentLoading — kept for backward compatibility */
  window.showRealtorLoading = function showRealtorLoading(title, tip) {
    if (typeof window.showAgentLoading === 'function') {
      window.showAgentLoading(title, tip);
      return;
    }
    if (typeof window.showLoadingWithTips === 'function') {
      window.showLoadingWithTips(tip ? [tip] : [], title || 'Working on it...');
    } else if (typeof window.forceShowGlobalLoading === 'function') {
      window.forceShowGlobalLoading(title || 'Working on it...');
    }
  };

  window.showAgentLoading = function showAgentLoading(title, tip) {
    if (typeof window.showLoadingWithTips === 'function') {
      window.showLoadingWithTips(tip ? [tip] : [], title || 'Working on it...');
    } else if (typeof window.forceShowGlobalLoading === 'function') {
      window.forceShowGlobalLoading(title || 'Working on it...');
    }
  };

  window.hideLoading = function hideLoading() {
    const loadingEl = document.getElementById('global-loading');
    if (loadingEl) {
      loadingEl.classList.add('hidden');
      loadingEl.style.setProperty('display', 'none', 'important');
      loadingEl.style.setProperty('visibility', 'hidden', 'important');
      // Clean up any plan-specific enrich panel (clear placeholder if present, don't remove the div from static)
      const enrich = loadingEl.querySelector('#plan-enrich-panel');
      if (enrich) {
        enrich.innerHTML = '';
      }
    }
    if (loadingInterval) {
      clearInterval(loadingInterval);
      loadingInterval = null;
    }
  };

})();
