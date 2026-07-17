/**
 * Centralized GA4 event helpers for tool usage tracking.
 * All coach apps share property G-MDYP4C0BJ1 — app_id separates LO vs Realtor vs Recruiter.
 */
(function () {
  'use strict';

  const GA_ID = 'G-MDYP4C0BJ1';

  const TOOL_LABELS = {
    home: 'Home',
    'bio-creator': 'Bio Builder',
    'ai-chat': 'AI Coach',
    'sales-script': 'Sales Script Generator',
    'client-translation': 'Client Translation',
    'weekly-win-plan': 'Weekly Win Plan',
    planning: '2026 Business Plan',
    'social-post': 'Social Post Creator',
    social: 'Social Media Strategy',
    blog: 'Blog Creator',
    'newsletter-generator': 'Newsletter Generator',
    eventplanning: 'Event Planning',
    referrals: 'Referral Partners',
    database: 'Database Nurturing',
    'value-vault': 'Value Vault',
    process: 'Home Buying & Selling Process',
    'mindset-motivation': 'Mindset Lab',
    books: 'Book Vault',
    'listing-description': 'Listing Description',
    'open-house': 'Open House',
    consultation: 'Buyer/Seller Consultation',
    'global-search': 'Global Search'
  };

  function getAppId() {
    if (window.COACH_APP_ID) return window.COACH_APP_ID;
    const name = (
      document.querySelector('[data-app-name]')?.getAttribute('data-app-name') ||
      document.title ||
      ''
    ).toLowerCase();
    if (name.includes('agent sales') || name.includes('realtor')) return 'realtor';
    if (name.includes('recruiter')) return 'recruiter';
    return 'loan_officer';
  }

  function getAppLabel() {
    return (
      document.querySelector('[data-app-name]')?.getAttribute('data-app-name') ||
      document.title ||
      'Sales Coach'
    );
  }

  function toolLabel(tool) {
    return TOOL_LABELS[tool] || tool;
  }

  window.getCoachAppId = getAppId;

  window.trackCoachEvent = function trackCoachEvent(opts) {
    if (typeof gtag !== 'function') return;
    const o = opts || {};
    const tool = o.tool || o.tool_name || 'unknown';
    const action = o.action || o.tool_action || 'use';

    gtag('event', o.eventName || 'tool_use', {
      tool_name: tool,
      tool_action: action,
      app_id: getAppId(),
      app_name: getAppLabel(),
      event_category: 'Tool Usage',
      event_label: o.label || `${toolLabel(tool)} — ${action}`,
      value: o.value != null ? o.value : 1
    });
  };

  window.trackCoachSectionOpen = function trackCoachSectionOpen(sectionId) {
    if (!sectionId) return;
    window.trackCoachEvent({
      tool: sectionId,
      action: 'open',
      eventName: 'tool_open',
      label: `${toolLabel(sectionId)} — opened`
    });
  };

  function initGaConfig() {
    if (typeof gtag !== 'function') return;
    gtag('config', GA_ID, {
      app_id: getAppId(),
      app_name: getAppLabel(),
      send_page_view: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGaConfig);
  } else {
    initGaConfig();
  }
})();