/**
 * Call Review — upload recruit call recordings, transcribe (STT), coach with Grok.
 * Stores reviews in localStorage (browser only).
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'recruitingCallReviews';
  const MAX_BYTES = 25 * 1024 * 1024;

  const el = (id) => document.getElementById(id);

  function toast(msg, type) {
    if (typeof window.showToast === 'function') window.showToast(msg, type || 'info');
    else console.log('[call-review]', msg);
  }

  function loadReviews() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveReviews(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 30)));
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function getProfileBits() {
    try {
      if (typeof window.getUserProfile === 'function') return window.getUserProfile();
      return JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch (e) {
      return {};
    }
  }

  function getRuoffSnippet() {
    if (typeof window.getRuoffFactContext === 'function') {
      try {
        return window.getRuoffFactContext('recruiting differentiation process culture', 6) || '';
      } catch (e) {}
    }
    return '';
  }

  function setBusy(busy, label) {
    const btnT = el('call-review-transcribe');
    const btnA = el('call-review-analyze');
    const status = el('call-review-status');
    if (btnT) btnT.disabled = busy;
    if (btnA) btnA.disabled = busy;
    if (status) status.textContent = label || (busy ? 'Working…' : '');
  }

  function selectedFile() {
    const input = el('call-review-file');
    return input && input.files && input.files[0] ? input.files[0] : null;
  }

  function onFilePicked() {
    const file = selectedFile();
    const meta = el('call-review-file-meta');
    if (!meta) return;
    if (!file) {
      meta.textContent = 'No file selected';
      return;
    }
    if (file.size > MAX_BYTES) {
      meta.textContent = `Too large (${formatBytes(file.size)}). Max ${formatBytes(MAX_BYTES)}.`;
      meta.classList.add('text-red-500');
      toast('File exceeds 25 MB limit', 'error');
      return;
    }
    meta.classList.remove('text-red-500');
    meta.textContent = `${file.name} · ${formatBytes(file.size)} · ${file.type || 'audio'}`;
  }

  async function transcribe() {
    const file = selectedFile();
    if (!file) {
      toast('Choose an audio file first', 'warning');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast('File too large (max 25 MB)', 'error');
      return;
    }
    if (typeof window.transcribeAudioFile !== 'function') {
      toast('Transcription helper not loaded', 'error');
      return;
    }

    setBusy(true, 'Transcribing with Grok STT…');
    try {
      const { text } = await window.transcribeAudioFile(file);
      const ta = el('call-review-transcript');
      if (ta) ta.value = text || '';
      if (!text) {
        toast('Transcription returned empty text — try another format (mp3/m4a/wav)', 'warning');
      } else {
        toast('Transcript ready — edit if needed, then Analyze', 'success');
      }
      setBusy(false, 'Transcript ready');
    } catch (err) {
      console.error('[call-review] STT', err);
      toast(err.message || 'Transcription failed', 'error');
      setBusy(false, 'Transcription failed');
    }
  }

  function buildAnalysisPrompt(transcript, meta) {
    const profile = getProfileBits();
    const facts = getRuoffSnippet();
    const stage = meta.stage || 'unknown';
    const notes = meta.notes || '';
    const name = profile.name || 'Recruiter';
    const vision = window.RECRUITING_PLAN_2026?.vision;
    const keys = (window.RECRUITING_PLAN_2026?.keysToSuccess || []).slice(0, 5).join(' ');

    return `You are an elite Ruoff Mortgage recruiting coach reviewing a real conversation between a Ruoff recruiter and an LO prospect (or related recruiting call).

RECRUITER CONTEXT:
- Name: ${name}
- Market/focus: ${profile.location || profile.localArea || profile.market || 'not set'}
- Call stage (user-provided): ${stage}
- Recruiter notes: ${notes || 'none'}

RUOFF 2026 VISION (score whether the call supports this story — autonomy, tech/support, family culture, high production + great life; never invent claims):
${vision?.statement || ''} ${vision?.how || ''}

KEYS TO SUCCESS (plan): ${keys || 'Human first, relationships first, value before pitch, Shape logging, long game.'}

RUOFF FACTS (use only when scoring differentiators — do not invent company claims):
${facts || '(no vault facts loaded)'}

TRANSCRIPT:
"""
${transcript.slice(0, 28000)}
"""

Produce a coaching debrief in clean markdown with these sections:

## Overall score
Give a score out of 10 and one sentence summary.

## What worked
3–5 specific strengths with short quotes from the transcript when possible.

## Gaps & missed opportunities
3–5 concrete gaps (discovery, listening, research, Ruoff differentiators, next step, objection handling).

## Scorecard (1–5 each)
Rate and one-line note for:
1. Opening & credibility
2. Research / personalization
3. Discovery questions
4. Listening & talk balance
5. Objection handling
6. Ruoff differentiators (accurate, natural)
7. Clear next step / close

## Better lines (rewrites)
Rewrite 3 weak moments as stronger recruiter language (relationship-first, never pushy).

## Practice focus for next call
Exactly 3 focused drills.

Rules: Be direct and specific. No generic fluff. If transcript is incomplete or unclear, say so. Do not invent facts not in the transcript or Ruoff facts.`;
  }

  async function analyze() {
    const ta = el('call-review-transcript');
    const transcript = (ta?.value || '').trim();
    if (!transcript || transcript.length < 40) {
      toast('Need a transcript first (transcribe or paste)', 'warning');
      return;
    }
    if (typeof window.callGrokAPI !== 'function') {
      toast('Grok API client not loaded', 'error');
      return;
    }

    const stage = el('call-review-stage')?.value || '';
    const notes = el('call-review-notes')?.value || '';
    setBusy(true, 'Analyzing call with Grok…');
    const out = el('call-review-output');
    if (out) {
      out.classList.remove('hidden');
      out.innerHTML = '<p class="text-sm text-gray-500">Coaching analysis in progress…</p>';
    }

    try {
      const prompt = buildAnalysisPrompt(transcript, { stage, notes });
      const raw = await window.callGrokAPI(prompt, {
        temperature: 0.45,
        max_tokens: 2200
      });
      const md = String(raw || '').trim();
      renderAnalysis(md);

      const file = selectedFile();
      const review = {
        id: 'cr-' + Date.now(),
        at: new Date().toISOString(),
        fileName: file?.name || 'pasted-transcript',
        stage,
        notes,
        transcript: transcript.slice(0, 50000),
        analysis: md
      };
      const list = loadReviews();
      list.unshift(review);
      saveReviews(list);
      renderHistory();
      toast('Call review saved in this browser', 'success');
      setBusy(false, 'Analysis complete');
    } catch (err) {
      console.error('[call-review] analyze', err);
      if (out) out.innerHTML = `<p class="text-sm text-red-500">${escapeHtml(err.message || 'Analysis failed')}</p>`;
      toast(err.message || 'Analysis failed', 'error');
      setBusy(false, 'Analysis failed');
    }
  }

  function renderAnalysis(md) {
    const out = el('call-review-output');
    if (!out) return;
    out.classList.remove('hidden');
    if (typeof window.marked?.parse === 'function') {
      out.innerHTML = window.marked.parse(md);
    } else {
      out.innerHTML = `<pre class="whitespace-pre-wrap text-sm">${escapeHtml(md)}</pre>`;
    }
  }

  function renderHistory() {
    const host = el('call-review-history');
    if (!host) return;
    const list = loadReviews();
    if (!list.length) {
      host.innerHTML = '<p class="text-sm text-gray-500 m-0">No saved reviews yet.</p>';
      return;
    }
    host.innerHTML = list
      .slice(0, 12)
      .map(
        (r) => `
      <button type="button" data-review-id="${escapeHtml(r.id)}" class="call-review-hist-item w-full text-left rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:border-[#00A89D] transition">
        <div class="flex justify-between gap-2 text-xs text-gray-500 mb-1">
          <span>${escapeHtml(new Date(r.at).toLocaleString())}</span>
          <span>${escapeHtml(r.stage || '—')}</span>
        </div>
        <div class="text-sm font-semibold text-[#002B5C] dark:text-white truncate">${escapeHtml(r.fileName || 'Review')}</div>
      </button>`
      )
      .join('');

    host.querySelectorAll('.call-review-hist-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-review-id');
        const r = loadReviews().find((x) => x.id === id);
        if (!r) return;
        if (el('call-review-transcript')) el('call-review-transcript').value = r.transcript || '';
        if (el('call-review-stage') && r.stage) el('call-review-stage').value = r.stage;
        if (el('call-review-notes')) el('call-review-notes').value = r.notes || '';
        renderAnalysis(r.analysis || '');
        toast('Loaded saved review', 'info');
      });
    });
  }

  function wireDropZone() {
    const zone = el('call-review-dropzone');
    const input = el('call-review-file');
    if (!zone || !input) return;

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('border-[#00A89D]', 'bg-[#00A89D]/5');
    });
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('border-[#00A89D]', 'bg-[#00A89D]/5');
    });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('border-[#00A89D]', 'bg-[#00A89D]/5');
      const f = e.dataTransfer?.files?.[0];
      if (!f) return;
      const dt = new DataTransfer();
      dt.items.add(f);
      input.files = dt.files;
      onFilePicked();
    });
    input.addEventListener('change', onFilePicked);
  }

  function wire() {
    wireDropZone();
    el('call-review-transcribe')?.addEventListener('click', () => transcribe());
    el('call-review-analyze')?.addEventListener('click', () => analyze());
    el('call-review-clear')?.addEventListener('click', () => {
      if (el('call-review-transcript')) el('call-review-transcript').value = '';
      if (el('call-review-output')) {
        el('call-review-output').classList.add('hidden');
        el('call-review-output').innerHTML = '';
      }
      if (el('call-review-file')) el('call-review-file').value = '';
      onFilePicked();
    });
    renderHistory();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }

  console.log('%c[call-review] Upload + STT + coaching analysis ready', 'color:#00A89D');
})();
