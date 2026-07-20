/**
 * Sidebar AI indicators — quiet asterisk marks tools that call the Grok API
 * so favorite stars stay the visual anchor (not busy wand badges).
 */
(function () {
  'use strict';

  const AI_SECTIONS = {
    'equity-scanner': { level: 'assist', tip: 'AI assist — enhance outreach copy' },
    'social-post': { level: 'full', tip: 'AI-powered — generates posts & calendars' },
    'blog': { level: 'full', tip: 'AI-powered — writes blog drafts' },
    'newsletter-generator': { level: 'full', tip: 'AI-powered — builds newsletter editions' },
    'weekly-win-plan': { level: 'full', tip: 'AI-powered — generates your weekly plan' },
    'planning': { level: 'full', tip: 'AI-powered — builds your 2026 business plan' },
    'sales-script': { level: 'full', tip: 'AI-powered — writes custom scripts' },
    'bio-creator': { level: 'full', tip: 'AI-powered — builds platform-ready professional bios' },
    'ai-chat': { level: 'full', tip: 'AI-powered — profile-aware coach' },
    'underwriting-search': { level: 'full', tip: 'AI-powered — searches guidelines' },
    'client-translation': { level: 'full', tip: 'AI-powered — translates client communication' },
    'smart-savings': { level: 'full', tip: 'AI-powered — Smart Plans & client emails from your refi numbers' }
  };

  function initSidebarAiIndicators() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    sidebar.querySelectorAll('a[href^="#"]').forEach((link) => {
      const id = (link.getAttribute('href') || '').replace('#', '');
      const meta = AI_SECTIONS[id];
      if (!meta) return;

      // Upgrade any older wand pips to quiet asterisks
      let pip = link.querySelector('.sidebar-ai-pip');
      if (!pip) {
        pip = document.createElement('span');
        pip.className = 'sidebar-ai-pip' + (meta.level === 'assist' ? ' sidebar-ai-pip--assist' : '');
        pip.setAttribute('aria-hidden', 'true');
        // Place before favorite star if present so star keeps the right edge
        const star = link.querySelector('.home-fav-star');
        if (star) link.insertBefore(pip, star);
        else link.appendChild(pip);
      } else {
        pip.className = 'sidebar-ai-pip' + (meta.level === 'assist' ? ' sidebar-ai-pip--assist' : '');
      }
      pip.textContent = '*';
      link.classList.add('sidebar-link--has-ai');
      if (!link.title) link.title = meta.tip;
    });

    const container = sidebar.querySelector('.p-5');
    if (container && !container.querySelector('.sidebar-ai-legend')) {
      const legend = document.createElement('div');
      legend.className = 'sidebar-ai-legend';
      legend.innerHTML = `
        <span class="sidebar-ai-pip" aria-hidden="true">*</span>
        <span>AI-powered</span>
        <span class="sidebar-ai-legend-sep" aria-hidden="true">·</span>
        <span class="sidebar-ai-pip sidebar-ai-pip--assist" aria-hidden="true">*</span>
        <span>AI assist</span>
        <span class="sidebar-ai-legend-sep" aria-hidden="true">·</span>
        <i class="fas fa-star text-[9px] text-[#F15A29] opacity-80" aria-hidden="true"></i>
        <span>Favorite</span>
      `;
      container.appendChild(legend);
    } else if (container) {
      // Refresh legend markup if an older wand version is still in DOM
      const legend = container.querySelector('.sidebar-ai-legend');
      if (legend && legend.querySelector('.fa-wand-magic-sparkles')) {
        legend.innerHTML = `
          <span class="sidebar-ai-pip" aria-hidden="true">*</span>
          <span>AI-powered</span>
          <span class="sidebar-ai-legend-sep" aria-hidden="true">·</span>
          <span class="sidebar-ai-pip sidebar-ai-pip--assist" aria-hidden="true">*</span>
          <span>AI assist</span>
          <span class="sidebar-ai-legend-sep" aria-hidden="true">·</span>
          <i class="fas fa-star text-[9px] text-[#F15A29] opacity-80" aria-hidden="true"></i>
          <span>Favorite</span>
        `;
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebarAiIndicators);
  } else {
    initSidebarAiIndicators();
  }
})();