/**
 * Sidebar AI indicators — marks tools that call the Grok API.
 */
(function () {
  'use strict';

  const AI_SECTIONS = {
    'equity-scanner': { level: 'assist', tip: 'AI assist — enhance outreach copy' },
    'social-post': { level: 'full', tip: 'AI-powered — generates posts & calendars' },
    'blog': { level: 'full', tip: 'AI-powered — writes blog drafts' },
    'newsletter-generator': { level: 'full', tip: 'AI-powered — builds newsletter editions' },
    'weekly-win-plan': { level: 'full', tip: 'AI-powered — generates your weekly plan' },
    'sales-script': { level: 'full', tip: 'AI-powered — writes custom scripts' },
    'ai-chat': { level: 'full', tip: 'AI-powered — profile-aware coach' },
    'underwriting-search': { level: 'full', tip: 'AI-powered — searches guidelines' },
    'client-translation': { level: 'full', tip: 'AI-powered — translates client communication' }
  };

  function initSidebarAiIndicators() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    sidebar.querySelectorAll('a[href^="#"]').forEach((link) => {
      const id = (link.getAttribute('href') || '').replace('#', '');
      const meta = AI_SECTIONS[id];
      if (!meta || link.querySelector('.sidebar-ai-pip')) return;

      const pip = document.createElement('span');
      pip.className = 'sidebar-ai-pip' + (meta.level === 'assist' ? ' sidebar-ai-pip--assist' : '');
      pip.setAttribute('aria-hidden', 'true');
      pip.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i>';
      link.appendChild(pip);
      link.classList.add('sidebar-link--has-ai');
      if (!link.title) link.title = meta.tip;
    });

    const container = sidebar.querySelector('.p-5');
    if (container && !container.querySelector('.sidebar-ai-legend')) {
      const legend = document.createElement('div');
      legend.className = 'sidebar-ai-legend';
      legend.innerHTML = `
        <span class="sidebar-ai-pip" aria-hidden="true"><i class="fas fa-wand-magic-sparkles"></i></span>
        <span>AI-powered</span>
        <span class="sidebar-ai-legend-sep" aria-hidden="true">·</span>
        <span class="sidebar-ai-pip sidebar-ai-pip--assist" aria-hidden="true"><i class="fas fa-wand-magic-sparkles"></i></span>
        <span>AI assist</span>
      `;
      container.appendChild(legend);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebarAiIndicators);
  } else {
    initSidebarAiIndicators();
  }
})();