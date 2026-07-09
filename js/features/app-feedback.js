/**
 * Opens a pre-filled feedback email to the app owner.
 * mailto: works offline, needs no backend, and lands in a normal inbox.
 */
(function () {
  'use strict';

  window.APP_FEEDBACK_EMAIL = 'adam@ruoff.com';

  function getActiveSectionLabel() {
    const hash = (window.location.hash || '').replace(/^#/, '').trim();
    if (!hash) return 'Home / Dashboard';
    const link = document.querySelector(`.sidebar-link[href="#${hash}"]`);
    if (link) {
      const text = link.textContent.replace(/\s+/g, ' ').trim();
      if (text) return text;
    }
    return hash;
  }

  function getProfileSnippet() {
    try {
      const p = typeof window.getUserProfile === 'function'
        ? window.getUserProfile()
        : JSON.parse(localStorage.getItem('userProfile') || '{}');
      const name = (p.name || '').trim();
      const company = (p.companyName || p.company || '').trim();
      if (name && company) return `${name} @ ${company}`;
      if (name) return name;
      if (company) return company;
    } catch (e) {}
    return '';
  }

  window.openAppFeedbackEmail = function openAppFeedbackEmail() {
    const version = window.APP_VERSION || 'unknown';
    const build = window.APP_BUILD_DATE || '';
    const section = getActiveSectionLabel();
    const profile = getProfileSnippet();

    const subject = `Loan Officer Sales Coach Feedback (v${version})`;
    const body = [
      'Hi Adam,',
      '',
      `Page / tool: ${section}`,
      `App version: v${version}${build ? ` (${build})` : ''}`,
      profile ? `From: ${profile}` : '',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '✅ WHAT I LIKE',
      '(What is working well for you?)',
      '',
      '',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '🔧 WHAT IS BROKEN OR CONFUSING',
      '(What did not work? Include steps to reproduce if you can.)',
      '',
      '',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '💡 IDEAS TO IMPROVE',
      '(Features, workflows, or content you would love to see.)',
      '',
      '',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '📎 ANYTHING ELSE',
      '',
      '',
      ''
    ].join('\n');

    const mailto = `mailto:${encodeURIComponent(window.APP_FEEDBACK_EMAIL)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };
})();