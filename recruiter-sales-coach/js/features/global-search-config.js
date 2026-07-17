/**
 * Global command-palette search config — Recruiting Sales Coach.
 */
(function () {
  'use strict';

  const synonyms = {
    social: ['instagram', 'facebook', 'linkedin', 'post', 'content', 'reel', 'story'],
    nurture: ['database', 'nurture', 'cadence', 'touch', 'sphere', 'pipeline', 'prospect'],
    script: ['call', 'phone', 'voicemail', 'conversation', 'recruiting script', 'opener'],
    plan: ['weekly', 'win plan', 'business plan', '2026', 'goals', 'hires'],
    coach: ['ai', 'chat', 'assistant', 'grok'],
    saved: ['bookmark', 'library', 'favorites', 'saved'],
    voice: ['roleplay', 'role play', 'practice', 'mic', 'agent'],
    call: ['recording', 'review', 'stt', 'transcript', 'coaching'],
    vault: ['fact', 'ruoff', 'facts', 'truth'],
    recruit: ['lo', 'loan officer', 'hire', 'net hire', 'sourcing'],
    playbook: ['opener', 'objection', 'discovery'],
    blog: ['article', 'content creator', 'seo'],
  };

  const quickActions = [
    {
      id: 'action-saved',
      title: 'My Saved Items',
      subtitle: 'Scripts, posts, plans, coaching notes',
      icon: 'fas fa-bookmark',
      keywords: ['saved', 'library', 'bookmark'],
      action: 'saved',
      group: 'Quick Actions',
    },
    {
      id: 'action-home',
      title: 'Home',
      subtitle: 'Setup, daily loop, tool shortcuts',
      icon: 'fas fa-home',
      keywords: ['home', 'start', 'launchpad', 'dashboard', 'setup', 'daily'],
      sectionId: 'home',
      group: 'Quick Actions',
    },
    {
      id: 'action-voice',
      title: 'Voice Roleplay',
      subtitle: 'Live LO prospect practice with Grok Voice',
      icon: 'fas fa-headset',
      keywords: ['voice', 'roleplay', 'practice', 'mic', 'agent'],
      sectionId: 'voice-roleplay',
      group: 'Quick Actions',
    },
    {
      id: 'action-call-review',
      title: 'Call Review',
      subtitle: 'Upload recordings · STT · coaching scorecard',
      icon: 'fas fa-file-audio',
      keywords: ['call', 'review', 'recording', 'transcript', 'stt'],
      sectionId: 'call-review',
      group: 'Quick Actions',
    },
    {
      id: 'action-coach',
      title: 'AI Coach',
      subtitle: 'Profile-aware text coach',
      icon: 'fas fa-robot',
      keywords: ['ai', 'coach', 'chat', 'grok'],
      sectionId: 'ai-chat',
      group: 'Quick Actions',
    },
    {
      id: 'action-profile',
      title: 'My Profile & Preferences',
      subtitle: 'Market, goals, tone, partner types',
      icon: 'fas fa-user-cog',
      keywords: ['profile', 'settings', 'preferences'],
      action: 'profile',
      group: 'Quick Actions',
    },
    {
      id: 'action-script',
      title: 'Recruiting Script Generator',
      subtitle: 'Openers, objections, discovery',
      icon: 'fas fa-comment-dots',
      keywords: ['script', 'opener', 'objection'],
      sectionId: 'recruiting-script',
      group: 'Quick Actions',
    },
    {
      id: 'action-weekly',
      title: 'Weekly Recruiting Plan',
      subtitle: 'Protected blocks and daily tasks',
      icon: 'fas fa-fire',
      keywords: ['weekly', 'plan', 'outreach'],
      sectionId: 'weekly-win-plan',
      group: 'Quick Actions',
    },
    {
      id: 'action-vault',
      title: 'Ruoff Fact Vault',
      subtitle: 'Company facts for accurate recruiting talk tracks',
      icon: 'fas fa-gem',
      keywords: ['fact', 'vault', 'ruoff'],
      sectionId: 'ruoff-fact-vault',
      group: 'Quick Actions',
    },
  ];

  window.GLOBAL_SEARCH_CONFIG = {
    appId: 'recruiter',
    synonyms,
    quickActions,
    suggestedQueries: [
      'voice roleplay',
      'call review',
      'recruiting opener',
      'weekly plan',
      'ruoff facts',
      'objection handlers',
    ],
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
