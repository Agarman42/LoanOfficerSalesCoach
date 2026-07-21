/**
 * Load heavy third-party libs AFTER window load so the address bar can finish
 * and the tab stays interactive. Features that need them check for globals
 * (XLSX, html2pdf, jspdf, confetti, Chart, pdfjsLib, marked).
 */
(function () {
  'use strict';

  var LIBS = [
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    'https://cdn.jsdelivr.net/npm/marked/marked.min.js'
  ];

  var LOCAL_AFTER = [
    // pdf worker boot depends on pdf.min.js
  ];

  var started = false;

  function inject(src, onload) {
    if (document.querySelector('script[data-lazy-lib="' + src + '"]')) return;
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.setAttribute('data-lazy-lib', src);
    if (onload) s.onload = onload;
    s.onerror = function () {
      console.warn('[lazy-libs] failed:', src);
    };
    document.head.appendChild(s);
  }

  function bootPdfWorker() {
    try {
      if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
    } catch (e) { /* ignore */ }
  }

  function loadAll() {
    if (started) return;
    started = true;
    LIBS.forEach(function (src) {
      if (src.indexOf('pdf.min.js') !== -1) {
        inject(src, bootPdfWorker);
      } else {
        inject(src);
      }
    });
    LOCAL_AFTER.forEach(function (src) {
      inject(src);
    });
  }

  // After full document load so the spinner in the address bar can stop first.
  if (document.readyState === 'complete') {
    setTimeout(loadAll, 100);
  } else {
    window.addEventListener('load', function () {
      setTimeout(loadAll, 100);
    });
  }

  // Escape hatch if a feature needs libs sooner
  window.__loadLazyLibs = loadAll;
})();
