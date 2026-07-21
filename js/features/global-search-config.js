/**
 * Per-app config for global command-palette search (LO vs Realtor).
 * Loaded before global-search.js.
 */
(function () {
  'use strict';

  const appName = document.title || document.querySelector('[data-app-name]')?.getAttribute('data-app-name') || '';
  const isRealtor = /Agent Sales Coach/i.test(appName);

  const sharedSynonyms = {
    social: ['instagram', 'facebook', 'linkedin', 'post', 'content', 'reel', 'story'],
    nurture: ['database', 'nurture', 'cadence', 'touch', 'sphere', 'crm'],
    newsletter: ['email', 'newsletter', 'market update', 'monthly'],
    script: ['call', 'phone', 'voicemail', 'conversation', 'sales script'],
    vault: ['gift', 'pop-by', 'popby', 'touch', 'value'],
    plan: ['weekly', 'win plan', 'business plan', '2026', 'goals'],
    coach: ['ai', 'chat', 'assistant', 'grok'],
    saved: ['bookmark', 'library', 'favorites', 'saved'],
    event: ['client appreciation', 'open house party', 'pop-in'],
    referral: ['partner', 'realtor', 'agent', 'sphere'],
    objection: ['partner objection', 'referral objection', 'pushback', 'rebuttal'],
    rates: ['rate', 'interest rate', 'too high', 'high rates'],
    blog: ['article', 'seo', 'content creator'],
    content: ['content studio', 'content hub', 'studio', 'what to post', 'create content'],
    onboarding: ['onboard', 'new partner', 'new realtor', '60 day', '30 day'],
  };

  const loSynonyms = {
    ...sharedSynonyms,
    refi: ['refinance', 'refi', 'cash out', 'rate and term'],
    equity: ['opportunity', 'scanner', 'heloc', 'equity', 'pmi'],
    uw: ['underwriting', 'fha', 'va', 'conventional', 'guidelines', 'du', 'lp'],
    loan: ['mortgage', 'process', 'closing', 'pipeline'],
  };

  const realtorSynonyms = {
    ...sharedSynonyms,
    listing: ['description', 'mls', 'property', 'copy'],
    openhouse: ['open house', 'oh', 'showing'],
    consult: ['buyer', 'seller', 'consultation', 'listing appointment'],
    transaction: ['process', 'closing', 'contract', 'inspection'],
  };

  const loQuickActions = [
    {
      id: 'action-saved',
      title: 'My Saved Items',
      subtitle: 'Scripts, posts, equity scans, newsletters',
      icon: 'fas fa-bookmark',
      keywords: ['saved', 'library', 'bookmark'],
      action: 'saved',
      group: 'Quick Actions',
    },
    {
      id: 'action-home',
      title: 'Home',
      subtitle: 'Setup, daily loop, and tool shortcuts',
      icon: 'fas fa-home',
      keywords: ['home', 'start', 'launchpad', 'dashboard', 'setup', 'daily'],
      sectionId: 'home',
      group: 'Quick Actions',
    },
    {
      id: 'action-content-studio',
      title: 'Content Studio',
      subtitle: 'Strategy, posts, blog, newsletter & bio',
      icon: 'fas fa-pen-nib',
      keywords: ['content', 'studio', 'hub', 'social', 'blog', 'newsletter', 'post'],
      sectionId: 'content-hub',
      group: 'Quick Actions',
    },
    {
      id: 'action-coach',
      title: 'AI Coach',
      subtitle: 'Profile-aware conversation coach',
      icon: 'fas fa-robot',
      keywords: ['ai', 'coach', 'chat', 'grok'],
      sectionId: 'ai-chat',
      group: 'Quick Actions',
    },
    {
      id: 'action-profile',
      title: 'My Profile & Preferences',
      subtitle: 'Database size, colors, contact info',
      icon: 'fas fa-user-cog',
      keywords: ['profile', 'settings', 'preferences'],
      action: 'profile',
      group: 'Quick Actions',
    },
    {
      id: 'action-feedback',
      title: 'Send App Feedback',
      subtitle: 'Opens a pre-filled email to the team',
      icon: 'fas fa-comment-dots',
      keywords: ['feedback', 'bug', 'suggest', 'idea'],
      action: 'feedback',
      group: 'Quick Actions',
    },
    {
      id: 'action-underwriting',
      title: 'Underwriting Guideline Search',
      subtitle: 'FHA, VA, Conventional, and investor overlays',
      icon: 'fas fa-search-dollar',
      keywords: ['underwriting', 'uw', 'fha', 'va', 'guidelines'],
      sectionId: 'underwriting-search',
      group: 'Quick Actions',
    },
    {
      id: 'action-smart-savings',
      title: 'Smart Savings Calculator',
      subtitle: 'Refi & debt scenarios for client meetings',
      icon: 'fas fa-piggy-bank',
      keywords: ['smart savings', 'refi', 'refinance', 'debt consolidation', 'calculator'],
      sectionId: 'smart-savings',
      group: 'Quick Actions',
    },
    {
      id: 'action-mortgage-calculator',
      title: 'Mortgage Calculator',
      subtitle: 'Payment, taxes, insurance, PMI, extra payments',
      icon: 'fas fa-calculator',
      keywords: ['mortgage calculator', 'payment calculator', 'amortization', 'pmi', 'biweekly', 'taxes insurance'],
      sectionId: 'calculator',
      group: 'Quick Actions',
    },

  ];

  const realtorQuickActions = [
    {
      id: 'action-saved',
      title: 'My Saved Items',
      subtitle: 'Scripts, posts, listings, newsletters',
      icon: 'fas fa-bookmark',
      keywords: ['saved', 'library', 'bookmark'],
      action: 'saved',
      group: 'Quick Actions',
    },
    {
      id: 'action-content-studio',
      title: 'Content Studio',
      subtitle: 'Strategy, posts, blog, newsletter, listings & bio',
      icon: 'fas fa-pen-nib',
      keywords: ['content', 'studio', 'hub', 'social', 'blog', 'newsletter', 'listing'],
      sectionId: 'content-hub',
      group: 'Quick Actions',
    },
    {
      id: 'action-coach',
      title: 'AI Coach',
      subtitle: 'Profile-aware assistant with tool bridges',
      icon: 'fas fa-robot',
      keywords: ['ai', 'coach', 'chat', 'grok'],
      sectionId: 'ai-chat',
      group: 'Quick Actions',
    },
    {
      id: 'action-profile',
      title: 'My Profile & Preferences',
      subtitle: 'Database size, branding, contact info',
      icon: 'fas fa-user-cog',
      keywords: ['profile', 'settings', 'preferences'],
      action: 'profile',
      group: 'Quick Actions',
    },
    {
      id: 'action-feedback',
      title: 'Send App Feedback',
      subtitle: 'Opens a pre-filled email to the team',
      icon: 'fas fa-comment-dots',
      keywords: ['feedback', 'bug', 'suggest', 'idea'],
      action: 'feedback',
      group: 'Quick Actions',
    },
  ];

  window.GLOBAL_SEARCH_CONFIG = {
    appId: isRealtor ? 'realtor' : 'lo',
    synonyms: isRealtor ? realtorSynonyms : loSynonyms,
    quickActions: isRealtor ? realtorQuickActions : loQuickActions,
    suggestedQueries: isRealtor
      ? ['post event checklist', 'listing description', 'open house domination', 'ninja selling', 'local community']
      : ['post event checklist', 'rates too high', 'fha collections', 'ruoff plus', 'ninja selling'],
    groupOrder: [
      'Guides & Playbooks',
      'Script Scenarios',
      'Ruoff Facts',
      'Book Vault',
      'Social Pillars',
      'Mindset Lab',
      'Tools',
      'Quick Actions',
      'Value Vault',
      'Saved Items',
    ],
  };
})();