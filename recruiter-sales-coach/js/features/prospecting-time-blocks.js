/**
 * Compatibility shim — Prospecting Time Blocks merged into Weekly Recruiting Plan (v2).
 */
(function () {
  'use strict';

  function redirectToWeekly() {
    if (typeof window.showSection === 'function') {
      window.showSection('weekly-win-plan');
    }
  }

  function initProspectingTimeBlocks() {
    console.log('%c[prospecting-time-blocks.js] Shim active — merged into Weekly Recruiting Plan', 'color:#00A89D');
    if (typeof window.updateWeeklyCustomizeDisplays === 'function') {
      window.updateWeeklyCustomizeDisplays();
    }
  }

  window.generateProspectingBlocks = function () {
    if (typeof window.generateWeeklyPlan === 'function') {
      return window.generateWeeklyPlan();
    }
    redirectToWeekly();
  };
  window.regenerateProspectingBlocks = window.generateProspectingBlocks;
  window.clearProspectingBlocks = function () {
    if (typeof window.clearWeeklyPlan === 'function') window.clearWeeklyPlan();
  };
  window.exportProspectingToICS = function () {
    if (typeof window.exportWeeklyPlanToICS === 'function') window.exportWeeklyPlanToICS();
  };
  window.copyProspectingBlocks = function () {
    if (typeof window.copyWeeklyPlan === 'function') window.copyWeeklyPlan();
  };
  window.expandWeeklyPreferences = redirectToWeekly;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProspectingTimeBlocks);
  } else {
    initProspectingTimeBlocks();
  }
})();