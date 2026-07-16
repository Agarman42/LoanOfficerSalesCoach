/**
 * Colorful bottom promo banners — motivational copy first, subtle cross-links second.
 */
(function () {
  'use strict';

  function goSection(id) {
    if (typeof window.showSection === 'function') window.showSection(id);
  }

  function openSocialPostCreator() {
    if (typeof window.showSocialPostCreator === 'function') {
      window.showSocialPostCreator();
    } else {
      goSection('social-post');
    }
  }

  var ACTIONS = {
    'weekly-win-plan': function () { goSection('weekly-win-plan'); },
    'planning': function () { goSection('planning'); },
    'social': function () { goSection('social'); },
    'social-post': function () { goSection('social-post'); },
    'social-post-creator': openSocialPostCreator,
    'database': function () { goSection('database'); },
    'referrals': function () { goSection('referrals'); },
    'value-vault': function () { goSection('value-vault'); },
    'eventplanning': function () { goSection('eventplanning'); },
    'equity-scanner': function () { goSection('equity-scanner'); },
    'sales-script': function () { goSection('sales-script'); },
    'bio-creator': function () { goSection('bio-creator'); },
    'ai-chat': function () { goSection('ai-chat'); },
    'newsletter-generator': function () { goSection('newsletter-generator'); },
    'mindset-motivation': function () { goSection('mindset-motivation'); },
    'blog': function () { goSection('blog'); },
    'process': function () { goSection('process'); }
  };

  var FOOTERS = {
    'mindset-motivation': {
      headline: 'Mindset is 80% of success',
      detail: 'Master your thoughts today and everything else in your business will follow. The best producers don\'t wait to feel ready — they show up anyway.',
      gradient: 'orange',
      links: [{ label: 'Weekly Win Plan', action: 'weekly-win-plan' }]
    },
    'planning': {
      headline: 'Your plan is the map — execution is the journey',
      detail: 'A strong 2026 plan powers your Weekly Win Plan, prospecting blocks, social content, and partner outreach. Fill this once — then execute everywhere else with clarity.',
      gradient: 'orange',
      links: [
        { label: 'Weekly Win Plan', action: 'weekly-win-plan' },
        { label: 'Database Nurturing', action: 'database' }
      ]
    },
    'social': {
      headline: 'Consistency beats talent — every single time',
      detail: 'You have the pillars, theme days, and evergreen vault. The loan officers who win post weekly, not when they feel inspired. Turn any idea into finished posts in seconds.',
      gradient: 'orange',
      links: [
        { label: 'Social Post & Calendar Creator', action: 'social-post-creator' },
        { label: 'Weekly Win Plan', action: 'weekly-win-plan' }
      ]
    },
    'referrals': {
      headline: 'Referral partners aren\'t sources — they\'re true business partners',
      detail: 'The loan officers who treat them that way win the long game. Tier your partners, show up with value, and follow through on every promise.',
      gradient: 'orange',
      links: [
        { label: 'Value Vault', action: 'value-vault' },
        { label: 'Event Planning', action: 'eventplanning' }
      ]
    },
    'database': {
      headline: 'Your database is your most valuable asset — treat it that way',
      detail: '80%+ of top producers\' business comes from people who already know and trust them. Rank clients A+/B/C, run life-event touches, and never let a relationship go cold from neglect.',
      gradient: 'orange',
      links: [
        { label: 'Equity Scanner', action: 'equity-scanner' },
        { label: 'Weekly Win Plan', action: 'weekly-win-plan' }
      ]
    },
    'equity-scanner': {
      headline: 'Find hidden equity and untapped opportunities in seconds',
      detail: 'Your past client list is a goldmine most loan officers never mine. Upload, prioritize, and turn equity into conversations — not spreadsheets sitting in a folder.',
      gradient: 'orange',
      links: [
        { label: 'Sales Script Generator', action: 'sales-script' },
        { label: 'Database Nurturing', action: 'database' }
      ]
    },
    'ai-chat': {
      headline: 'Your Coach is connected to everything in this suite',
      detail: 'More than a chat box — real guidance personalized from your profile, saved to your vault, and bridged to every tool. Ask anything, then execute.',
      gradient: 'orange',
      links: [
        { label: 'Sales Script Generator', action: 'sales-script' },
        { label: 'Social Post Creator', action: 'social-post' }
      ]
    },
    'process': {
      headline: 'Every client should feel like your ONLY client',
      detail: 'When your process delivers that consistently, referrals become automatic. White-glove isn\'t extra work — it\'s the reason partners send their best buyers to you.',
      gradient: 'teal',
      links: [
        { label: 'Referral Partners', action: 'referrals' },
        { label: 'Newsletter Generator', action: 'newsletter-generator' }
      ]
    },
    'social-post': {
      headline: 'Stop staring at a blank screen',
      detail: 'Generate authentic, relationship-building posts and full 30-day calendars in seconds. Batch once, post all week, and recycle winners into blogs and newsletters.',
      gradient: 'orange',
      links: [
        { label: 'Full Social Strategy', action: 'social' },
        { label: 'Weekly Win Plan', action: 'weekly-win-plan' }
      ]
    },
    'sales-script': {
      headline: 'Natural, objection-proof scripts that feel human',
      detail: 'The best scripts don\'t sound scripted. Practice out loud, save your favorites, and walk into every conversation knowing exactly what to say.',
      gradient: 'orange',
      links: [
        { label: 'Database Nurturing', action: 'database' },
        { label: 'AI Coach', action: 'ai-chat' }
      ]
    },
    'eventplanning': {
      headline: 'Events aren\'t expenses — they\'re investments in relationships',
      detail: 'Plan 4–6 memorable events per year, execute well, and follow up consistently. The room you fill today becomes the referral pipeline you live on tomorrow.',
      gradient: 'orange',
      links: [
        { label: 'Database Nurturing', action: 'database' },
        { label: 'Weekly Win Plan', action: 'weekly-win-plan' }
      ]
    },
    'underwriting-search': {
      headline: 'Complex scenarios. Clear answers. Real guidance.',
      detail: 'Upload your overlays, describe the messy details, then keep asking follow-ups on the same file. Turn guideline clarity into client wins and partner confidence.',
      gradient: 'orange',
      links: [
        { label: 'Sales Script Generator', action: 'sales-script' },
        { label: 'AI Coach', action: 'ai-chat' }
      ]
    },
    'blog': {
      headline: 'Become the trusted expert in your market',
      detail: 'Publish professional blogs that position you as the go-to authority and drive consistent inbound leads. One great article fuels a week of social, Reels, and newsletter content.',
      gradient: 'orange',
      links: [
        { label: 'Social Post Creator', action: 'social-post' },
        { label: 'Newsletter Generator', action: 'newsletter-generator' }
      ]
    },
    'bio-creator': {
      headline: 'Your bio is how strangers decide to trust you',
      detail: 'A strong Google, Experience.com, or Zillow bio improves SEO and AI visibility — and gives every other tool a consistent story to build on. Save your primary bio once, use it everywhere.',
      gradient: 'teal',
      links: [
        { label: 'Blog Creator', action: 'blog' },
        { label: 'Newsletter Generator', action: 'newsletter-generator' }
      ]
    },
    'books': {
      headline: 'Read with intention',
      detail: 'One great book applied is worth ten books read and forgotten. Pick one idea from your reading list and put it into your business this week.',
      gradient: 'orange',
      links: [
        { label: 'Mindset Lab', action: 'mindset-motivation' },
        { label: 'Weekly Win Plan', action: 'weekly-win-plan' }
      ]
    },
    'calculator': {
      headline: 'Numbers open doors — conversations close them',
      detail: 'Run real scenarios for clients and partners, then turn the output into a follow-up script or educational post. Math builds trust when you explain it like a human.',
      gradient: 'orange',
      links: [
        { label: 'Sales Script Generator', action: 'sales-script' },
        { label: 'Social Post Creator', action: 'social-post' }
      ]
    },
    'value-vault': {
      headline: 'The Value Vault: give more, get more',
      detail: 'Strategic generosity is the fastest path to becoming the most referred loan officer in your market. Pop-bys aren\'t gifts — they\'re relationship deposits that compound.',
      gradient: 'orange',
      links: [
        { label: 'Referral Partners', action: 'referrals' },
        { label: 'Weekly Win Plan', action: 'weekly-win-plan' }
      ]
    },
    'newsletter-generator': {
      headline: 'One click = a newsletter your database will actually open',
      detail: 'Consistent, valuable sends keep you top-of-mind with the people who already trust you. Lead with personal updates, add real value, and end with a soft referral ask.',
      gradient: 'orange',
      links: [
        { label: 'Social Post Creator', action: 'social-post' },
        { label: 'Weekly Win Plan', action: 'weekly-win-plan' },
        { label: 'Primary Bio', action: 'bio-creator' }
      ]
    },
    'weekly-win-plan': {
      headline: 'A plan you actually run beats a perfect plan you don\'t',
      detail: 'Build a powerful, personalized 7-day prospecting roadmap tailored to your goals, schedule, and preferred activities. Protect the blocks. Execute the tasks. Win the week.',
      gradient: 'orange',
      links: [
        { label: '2026 Business Plan', action: 'planning' },
        { label: 'Newsletter', action: 'newsletter-generator' },
        { label: 'Social posts', action: 'social-post' }
      ]
    }
  };

  var GRADIENTS = {
    orange: 'bg-gradient-to-r from-[#002B5C] to-[#F15A29]',
    teal: 'bg-gradient-to-r from-[#002B5C] to-[#00A89D]'
  };

  function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function renderLinks(links) {
    if (!links || !links.length) return '';
    var pills = links.map(function (link) {
      return '<button type="button" class="section-footer-link px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-medium transition" data-action="' + esc(link.action) + '">' + esc(link.label) + '</button>';
    }).join('');
    return '<div class="mt-6 pt-5 border-t border-white/20">' +
      '<div class="text-[10px] uppercase tracking-wider opacity-70 mb-2">Keep building momentum</div>' +
      '<div class="flex flex-wrap items-center justify-center gap-2">' + pills + '</div></div>';
  }

  function bindLinks(wrap) {
    wrap.querySelectorAll('.section-footer-link').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-action');
        var fn = ACTIONS[key];
        if (typeof fn === 'function') fn();
      });
    });
  }

  function renderBanner(config) {
    var grad = GRADIENTS[config.gradient] || GRADIENTS.orange;
    var wrap = document.createElement('div');
    wrap.className = 'section-next-level-banner mt-12 ' + grad + ' text-white p-8 sm:p-10 rounded-3xl text-center shadow-lg';
    wrap.innerHTML =
      '<p class="text-2xl sm:text-3xl font-bold mb-3 leading-tight">' + esc(config.headline) + '</p>' +
      '<p class="text-base sm:text-lg opacity-90 max-w-2xl mx-auto leading-relaxed">' + esc(config.detail) + '</p>' +
      renderLinks(config.links);
    bindLinks(wrap);
    return wrap;
  }

  function applySectionFooters() {
    Object.keys(FOOTERS).forEach(function (sectionId) {
      var section = document.getElementById(sectionId);
      var config = FOOTERS[sectionId];
      if (!section || !config) return;

      section.querySelectorAll('.legacy-section-footer').forEach(function (el) {
        el.remove();
      });

      var existing = section.querySelector('.section-next-level-banner');
      if (existing) {
        existing.replaceWith(renderBanner(config));
        return;
      }

      section.appendChild(renderBanner(config));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySectionFooters);
  } else {
    applySectionFooters();
  }
})();