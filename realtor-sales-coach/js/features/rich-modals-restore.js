/** Run after inline app scripts so canonical rich modals override stale inline defs. */
(function () {
  'use strict';
  var modules = [
    'restoreSocialModals',
    'restoreProcessModals',
    'restoreNurtureModals',
    'restoreDatabaseModals',
    'restoreEventModals',
    'restoreReferralModals'
  ];
  modules.forEach(function (fn) {
    if (typeof window[fn] === 'function') {
      window[fn]();
    }
  });
})();