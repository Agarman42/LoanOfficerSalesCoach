/**
 * Call Recap — drop a recruiting call recording (or paste a transcript)
 * and get a manager-ready recap. Does not replace Call Review scorecards.
 */
(function () {
  'use strict';

  const MAX_BYTES = 25 * 1024 * 1024;
  const MAX_TRANSCRIPT_CHARS = 24000;
  const STT_UNCONFIGURED =
    'Drop audio once transcription is configured, or paste a transcript now.';
  const CALL_TYPES = ['Intro', 'Discovery', 'Follow-up', 'Offer', 'Other'];
  const TEMPS = ['Hot', 'Warm', 'Cool', 'Cold'];

  const el = (id) => document.getElementById(id);

  let selectedFile = null;
  let selectedType = '';
  let sttReady = false;
  let running = false;
  let activeAbort = null;
  let lastPlain = '';
  let lastTranscript = '';
  let audioDurationSec = null;

  function toast(msg, type) {
    if (typeof window.showToast === 'function') window.showToast(msg, type || 'info');
    else console.log('[call-recap]', msg);
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

  function getProfile() {
    try {
      if (typeof window.getUserProfile === 'function') return window.getUserProfile() || {};
      return JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch (e) {
      return {};
    }
  }

  function prefillRecruiter() {
    const input = el('call-recap-recruiter');
    if (!input || input.dataset.userEdited === '1' || input.value.trim()) return;
    const name = String(getProfile().name || getProfile().fullName || '').trim();
    if (name) input.value = name;
  }

  function isAllowedAudio(file) {
    const name = String(file && file.name ? file.name : '').toLowerCase();
    const type = String(file && file.type ? file.type : '').toLowerCase();
    const okExt = ['.m4a', '.mp3', '.wav', '.webm', '.mp4', '.mpeg', '.mpga', '.ogg'].some((ext) =>
      name.endsWith(ext)
    );
    const okType = type.startsWith('audio/') || type === 'video/mp4' || type === 'video/webm';
    return okExt || okType;
  }

  function formatDuration(sec) {
    if (!sec || !Number.isFinite(sec) || sec <= 0) return '';
    const total = Math.round(sec);
    const m = Math.floor(total / 60);
    const s = total % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      return h + 'h ' + (m % 60) + 'm';
    }
    return m + 'm ' + String(s).padStart(2, '0') + 's';
  }

  function readDuration(file) {
    return new Promise((resolve) => {
      if (!file) return resolve(null);
      let url = '';
      try {
        url = URL.createObjectURL(file);
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        const done = (value) => {
          try { URL.revokeObjectURL(url); } catch (e) {}
          resolve(value);
        };
        audio.onloadedmetadata = () => {
          const d = audio.duration;
          done(Number.isFinite(d) && d > 0 && d !== Infinity ? d : null);
        };
        audio.onerror = () => done(null);
        audio.src = url;
      } catch (e) {
        if (url) {
          try { URL.revokeObjectURL(url); } catch (err) {}
        }
        resolve(null);
      }
    });
  }

  function setStatus(text, tone) {
    const status = el('call-recap-status');
    if (!status) return;
    if (!text) {
      status.classList.add('hidden');
      status.textContent = '';
      return;
    }
    status.classList.remove('hidden');
    const tones = {
      error: 'border-red-300 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-100',
      ok: 'border-[#00A89D]/40 bg-[#00A89D]/10 text-[#002B5C] dark:text-teal-50',
      info: 'border-gray-200 bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-200'
    };
    status.className =
      'rounded-2xl border px-4 py-3 text-sm font-medium ' + (tones[tone] || tones.info);
    status.textContent = text;
  }

  function showOverlay(text) {
    const overlay = el('call-recap-overlay');
    const label = el('call-recap-overlay-text');
    if (label) label.textContent = text || 'Working…';
    if (!overlay) return;
    if (overlay.parentElement !== document.body) document.body.appendChild(overlay);
    overlay.classList.remove('hidden');
  }

  function hideOverlay() {
    const overlay = el('call-recap-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  function cancelJob() {
    if (activeAbort) {
      try { activeAbort.abort(); } catch (e) {}
    }
    activeAbort = null;
    running = false;
    hideOverlay();
    setStatus('Canceled. Paste a transcript or try the recording again.', 'info');
  }

  async function sttIsConfigured() {
    try {
      if (localStorage.getItem('grokApiKey')) return true;
    } catch (e) {}
    try {
      const base = typeof window.getProxyBaseUrl === 'function' ? window.getProxyBaseUrl() : '';
      const res = await fetch(base + '/api/health', { method: 'GET' });
      if (!res.ok) return false;
      const data = await res.json();
      return !!(data && data.hasServerKey);
    } catch (e) {
      return false;
    }
  }

  function paintSttHint() {
    const hint = el('call-recap-stt-hint');
    if (!hint) return;
    if (sttReady) {
      hint.classList.add('hidden');
      hint.textContent = '';
    } else {
      hint.classList.remove('hidden');
      hint.textContent = STT_UNCONFIGURED;
    }
  }

  function sourceLabel() {
    if (selectedFile && selectedFile.name) return selectedFile.name;
    const ta = el('call-recap-transcript');
    if (ta && ta.value.trim()) return 'Pasted transcript';
    return '';
  }

  function paintSource() {
    const node = el('call-recap-source-name');
    if (!node) return;
    const name = sourceLabel();
    if (!name) {
      node.textContent = '';
      node.classList.add('hidden');
      return;
    }
    node.classList.remove('hidden');
    node.textContent = 'Source: ' + name;
  }

  async function acceptFile(file) {
    const meta = el('call-recap-file-meta');
    const input = el('call-recap-file');
    if (!file) return;
    if (!isAllowedAudio(file)) {
      if (input) input.value = '';
      selectedFile = null;
      if (meta) {
        meta.classList.add('text-red-600');
        meta.textContent = 'Use an audio file (m4a, mp3, wav, webm, or mp4), or paste a transcript.';
      }
      toast('That file is not a supported recording.', 'error');
      paintSource();
      return;
    }
    if (file.size > MAX_BYTES) {
      if (input) input.value = '';
      selectedFile = null;
      const msg =
        file.name +
        ' is ' +
        formatBytes(file.size) +
        '. The limit is 25 MB. Trim the recording or paste a transcript.';
      if (meta) {
        meta.classList.add('text-red-600');
        meta.textContent = msg;
      }
      setStatus(msg, 'error');
      toast('File is over the 25 MB limit', 'error');
      paintSource();
      return;
    }
    selectedFile = file;
    audioDurationSec = null;
    if (meta) {
      meta.classList.remove('text-red-600');
      meta.textContent = file.name + ' · ' + formatBytes(file.size);
    }
    paintSource();
    setStatus('', '');
    readDuration(file).then((sec) => {
      if (selectedFile === file) audioDurationSec = sec;
    });
    if (!sttReady) {
      sttReady = await sttIsConfigured();
      paintSttHint();
    }
    if (!sttReady) {
      setStatus(STT_UNCONFIGURED, 'info');
      return;
    }
    await transcribeFile(file);
  }

  async function transcribeFile(file) {
    if (typeof window.transcribeAudioFile !== 'function') {
      setStatus(STT_UNCONFIGURED, 'info');
      return;
    }
    if (running) return;
    running = true;
    activeAbort = new AbortController();
    showOverlay('Transcribing the recording… You can cancel and paste a transcript instead.');
    setStatus('Transcribing ' + file.name + '…', 'info');
    try {
      const { text } = await window.transcribeAudioFile(file, { signal: activeAbort.signal });
      const ta = el('call-recap-transcript');
      const cleaned = String(text || '').trim();
      if (!cleaned) {
        setStatus('Transcription came back empty. Paste a transcript to build the recap.', 'error');
        toast('Transcription came back empty', 'warning');
        return;
      }
      if (ta) ta.value = cleaned;
      setStatus('Transcript is ready. Check the names, then build the recap.', 'ok');
      toast('Transcript ready', 'success');
      paintSource();
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      const message = (err && err.message) || 'Transcription failed';
      const noKey = /no server api key|not configured|401/i.test(message);
      setStatus(noKey ? STT_UNCONFIGURED : message, noKey ? 'info' : 'error');
      if (noKey) sttReady = false;
      paintSttHint();
      toast(noKey ? STT_UNCONFIGURED : message, noKey ? 'info' : 'error');
    } finally {
      running = false;
      activeAbort = null;
      hideOverlay();
    }
  }

  function fieldValue(id) {
    return (el(id)?.value || '').trim();
  }

  function transcriptMentionsMoney(text) {
    return /\$|\b(salary|compensation|base pay|pay package|bonus|ote)\b/i.test(text || '');
  }

  function scrubMoney(text, transcript) {
    if (transcriptMentionsMoney(transcript)) return String(text || '').trim();
    return String(text || '')
      .replace(/\$\s?\d[\d,]*(?:\.\d+)?(?:\s?[kKmM])?/g, '')
      .replace(/\b(salary|compensation|base pay|pay package|OTE|bonus)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([,.])/g, '$1')
      .trim();
  }

  function scrubInventedOrgs(text, transcript) {
    const src = String(transcript || '');
    let out = String(text || '');
    ['Ruoff', 'LLC', 'Inc', 'Corp'].forEach((label) => {
      if (new RegExp('\\b' + label + '\\b', 'i').test(src)) return;
      out = out.replace(new RegExp('[^.\\n]*\\b' + label + '\\b[^.\\n]*[.]?', 'gi'), ' ');
    });
    return out.replace(/\s{2,}/g, ' ').replace(/\s+([,.])/g, '$1').trim();
  }

  function tidyScrub(text) {
    return String(text || '')
      .replace(/,?\s+with\s+an?\s*\./gi, '.')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([,.])/g, '$1')
      .trim();
  }

  function scrubFacts(text, transcript) {
    return tidyScrub(scrubInventedOrgs(scrubMoney(text, transcript), transcript));
  }

  function meaningful(text) {
    return String(text || '').replace(/[^a-z0-9]/gi, '').length >= 3;
  }

  function asText(value, transcript) {
    const cleaned = scrubFacts(value, transcript);
    return meaningful(cleaned) ? cleaned : 'None noted';
  }

  function asList(value, transcript) {
    const raw = Array.isArray(value) ? value : value ? [value] : [];
    const items = raw
      .map((item) => scrubFacts(typeof item === 'string' ? item : item && (item.text || item.item), transcript))
      .map((item) => String(item || '').trim())
      .filter(meaningful);
    return items.length ? items : ['None noted'];
  }

  function asObjections(value, transcript) {
    const raw = Array.isArray(value) ? value : [];
    const items = raw
      .map((item) => ({
        concern: asText(item && (item.concern || item.objection), transcript),
        reply: asText(item && (item.reply || item.response), transcript)
      }))
      .filter((item) => item.concern !== 'None noted' || item.reply !== 'None noted');
    return items.length ? items : [{ concern: 'None noted', reply: 'None noted' }];
  }

  function asActions(value, transcript) {
    const raw = Array.isArray(value) ? value : [];
    const items = raw
      .map((item) => {
        if (typeof item === 'string') {
          return { action: asText(item, transcript), due: 'this week' };
        }
        return {
          action: asText(item && (item.action || item.text), transcript),
          due: String((item && (item.due || item.when)) || '').trim() || 'this week'
        };
      })
      .filter((item) => item.action && item.action !== 'None noted');
    return items.length ? items : [{ action: 'None noted', due: 'this week' }];
  }

  function parseRecapJson(raw) {
    let text = String(raw || '').trim();
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('The recap did not come back in a usable shape. Try again.');
    let body = text.slice(start, end + 1);
    try {
      return JSON.parse(body);
    } catch (e) {
      body = body.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(body);
    }
  }

  function normalizeRecap(data, transcript) {
    const src = data || {};
    let summary = asText(src.summary || src.executiveSummary, transcript);
    const words = transcript.trim().split(/\s+/).filter(Boolean).length;
    if (words < 80 && !/thin|short|limited|not much|little to go on/i.test(summary)) {
      summary =
        'The transcript is thin, so this stays with what was actually said. ' +
        (summary === 'None noted' ? '' : summary);
      summary = summary.trim();
    }
    let temperature = String(src.temperature || '').trim();
    const matched = TEMPS.find((t) => t.toLowerCase() === temperature.toLowerCase());
    temperature = matched || 'Not noted';
    const why = asText(src.temperatureWhy || src.why, transcript);
    const next = src.nextTouch || src.next || {};
    return {
      summary,
      temperature,
      temperatureWhy: why,
      cares: asList(src.cares || src.whatTheyCareAbout, transcript),
      green: asList(src.greenFlags || src.green, transcript),
      caution: asList(src.cautionFlags || src.caution, transcript),
      objections: asObjections(src.objections, transcript),
      recruiterActions: asActions(src.recruiterActions || src.recruiterOwns, transcript),
      candidateActions: asActions(src.candidateActions || src.candidateOwns, transcript),
      nextStep: asText(next.step || src.nextStep, transcript),
      talkTrack: asText(next.talkTrack || next.text || src.talkTrack, transcript)
    };
  }

  function snapshotFacts() {
    const duration = formatDuration(audioDurationSec);
    return {
      generated: new Date().toLocaleString(),
      candidate: fieldValue('call-recap-candidate') || 'Not noted',
      role: fieldValue('call-recap-role') || 'Not noted',
      callType: selectedType || 'Not noted',
      recruiter: fieldValue('call-recap-recruiter') || 'Not noted',
      duration: duration || 'Not noted',
      source: sourceLabel() || 'Not noted'
    };
  }

  function buildPrompt(transcript, facts) {
    let body = transcript;
    let clipNote = '';
    if (body.length > MAX_TRANSCRIPT_CHARS) {
      body = body.slice(0, MAX_TRANSCRIPT_CHARS);
      clipNote = 'The transcript was shortened for this recap. Do not guess what was cut.';
    }
    return `You write call recaps for a Midwest mortgage recruiter. Specific, plain, no fluff. Never say you are an AI, a model, or a language model.

HARD RULES
- Use only facts that appear in the transcript or the meta fields below.
- Do not invent an employer, company, lender, salary, bonus, OTE, compensation, start date, location, or family detail.
- If the transcript does not name it, do not name it. Write nothing extra to fill a gap.
- If the transcript is thin or messy, say that in the summary in plain language.
- Temperature is exactly one of: Hot, Warm, Cool, Cold. Add one short why tied to the call.
- Objection replies are value-first recruiter voice. Not pushy. Not a script from a different call.
- Action due dates: use a date or timeframe they actually said. If they did not say, use "this week".
- ${clipNote || 'The transcript below is the full source.'}

META (these are user-entered; they are not evidence of anything else)
- Candidate: ${facts.candidate}
- Role: ${facts.role}
- Call type: ${facts.callType}
- Recruiter: ${facts.recruiter}
- Duration: ${facts.duration}

Return ONLY JSON with this shape and no markdown fence:
{
  "summary": "4 to 7 sentences a manager can read in 20 seconds. What happened and where they stand.",
  "temperature": "Hot|Warm|Cool|Cold",
  "temperatureWhy": "one short why",
  "cares": ["motivation, money, schedule, culture, leadership, tools, or location — only if said"],
  "greenFlags": ["specific fit signals from the call"],
  "cautionFlags": ["specific cautions from the call"],
  "objections": [{ "concern": "their actual concern", "reply": "a short value-first reply" }],
  "recruiterActions": [{ "action": "what the recruiter will do", "due": "this week" }],
  "candidateActions": [{ "action": "what the candidate will do", "due": "this week" }],
  "nextTouch": { "step": "one recommended next step", "talkTrack": "a short text or talk track they can send" }
}
Use empty arrays when a list has nothing from the call. Do not include the transcript in the JSON.

TRANSCRIPT:
${body}`;
  }

  function bullets(items) {
    return (
      '<ul class="m-0 pl-4 space-y-1.5 text-sm text-gray-700 dark:text-gray-200">' +
      items.map((item) => '<li>' + escapeHtml(item) + '</li>').join('') +
      '</ul>'
    );
  }

  function actionLines(items, owner) {
    return items
      .map(
        (item) =>
          '<label class="flex items-start gap-2.5 text-sm text-gray-800 dark:text-gray-100">' +
          '<input type="checkbox" class="mt-1 accent-[#00A89D]">' +
          '<span><span class="font-medium">' +
          escapeHtml(item.action) +
          '</span> <span class="text-gray-500">· ' +
          escapeHtml(owner) +
          ' · ' +
          escapeHtml(item.due) +
          '</span></span></label>'
      )
      .join('');
  }

  function tempClass(temp) {
    if (temp === 'Hot') return 'bg-[#F15A29] text-white';
    if (temp === 'Warm') return 'bg-amber-500 text-white';
    if (temp === 'Cool') return 'bg-[#00A89D] text-white';
    if (temp === 'Cold') return 'bg-slate-600 text-white';
    return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100';
  }

  function renderRecap(recap, facts, transcript) {
    const empty = el('call-recap-empty');
    const result = el('call-recap-result');
    if (empty) empty.classList.add('hidden');
    if (!result) return;
    result.classList.remove('hidden');
    const objections = recap.objections
      .map(
        (item) =>
          '<div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">' +
          '<div class="text-[11px] font-bold tracking-wide uppercase text-[#F15A29] mb-1">Concern</div>' +
          '<p class="m-0 text-sm font-medium text-[#002B5C] dark:text-white">' +
          escapeHtml(item.concern) +
          '</p>' +
          '<div class="text-[11px] font-bold tracking-wide uppercase text-[#00A89D] mt-3 mb-1">Suggested reply</div>' +
          '<p class="m-0 text-sm text-gray-700 dark:text-gray-200">' +
          escapeHtml(item.reply) +
          '</p></div>'
      )
      .join('');

    result.innerHTML =
      '<div class="flex flex-wrap items-start justify-between gap-3 mb-4">' +
      '<div>' +
      '<div class="text-[11px] font-bold tracking-[0.14em] uppercase text-[#00A89D]">Call recap</div>' +
      '<h3 class="text-xl font-bold text-[#002B5C] dark:text-white m-0 mt-1">Manager read</h3>' +
      '<p class="call-recap-source-line text-xs text-gray-500 m-0 mt-1">Source: ' +
      escapeHtml(facts.source) +
      '</p></div>' +
      '<div class="flex flex-wrap gap-2">' +
      '<button type="button" data-recap-action="copy" class="px-3 py-2 rounded-full text-xs font-bold border border-gray-300 hover:border-[#00A89D]">Copy recap</button>' +
      '<button type="button" data-recap-action="docx" class="px-3 py-2 rounded-full text-xs font-bold border border-gray-300 hover:border-[#00A89D]">Download .docx</button>' +
      '<button type="button" data-recap-action="save" class="px-3 py-2 rounded-full text-xs font-bold bg-[#002B5C] text-white">Save</button>' +
      '<button type="button" data-recap-action="regenerate" class="px-3 py-2 rounded-full text-xs font-bold text-[#F15A29] border border-[#F15A29]/40">Regenerate</button>' +
      '</div></div>' +
      section(
        'call-recap-sec-snapshot',
        '1. Call snapshot',
        '<dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm m-0">' +
          row('Generated', facts.generated) +
          row('Candidate', facts.candidate) +
          row('Role', facts.role) +
          row('Call type', facts.callType) +
          row('Recruiter', facts.recruiter) +
          row('Duration', facts.duration) +
          '</dl>'
      ) +
      section(
        'call-recap-sec-summary',
        '2. Executive summary',
        '<div class="flex flex-wrap items-center gap-2 mb-3">' +
          '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ' +
          tempClass(recap.temperature) +
          '">' +
          escapeHtml(recap.temperature) +
          '</span>' +
          '<span class="text-sm text-gray-600 dark:text-gray-300">' +
          escapeHtml(recap.temperatureWhy) +
          '</span></div>' +
          '<p class="m-0 text-sm leading-relaxed text-gray-800 dark:text-gray-100">' +
          escapeHtml(recap.summary) +
          '</p>'
      ) +
      section('call-recap-sec-cares', '3. What they care about', bullets(recap.cares)) +
      section(
        'call-recap-sec-fit',
        '4. Fit signals',
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' +
          '<div class="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-4"><div class="text-xs font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-200 mb-2">Green flags</div>' +
          bullets(recap.green) +
          '</div>' +
          '<div class="rounded-2xl bg-amber-50 dark:bg-amber-900/20 p-4"><div class="text-xs font-bold uppercase tracking-wide text-amber-900 dark:text-amber-100 mb-2">Caution flags</div>' +
          bullets(recap.caution) +
          '</div></div>'
      ) +
      section('call-recap-sec-objections', '5. Objections / open loops', '<div class="space-y-3">' + objections + '</div>') +
      section(
        'call-recap-sec-actions',
        '6. Action items',
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' +
          '<div><div class="text-xs font-bold uppercase tracking-wide text-[#002B5C] dark:text-white mb-2">Recruiter owns</div><div class="space-y-2">' +
          actionLines(recap.recruiterActions, 'Recruiter') +
          '</div></div>' +
          '<div><div class="text-xs font-bold uppercase tracking-wide text-[#002B5C] dark:text-white mb-2">Candidate owns</div><div class="space-y-2">' +
          actionLines(recap.candidateActions, 'Candidate') +
          '</div></div></div>'
      ) +
      section(
        'call-recap-sec-next',
        '7. Suggested next touch',
        '<p class="m-0 text-sm font-semibold text-[#002B5C] dark:text-white">' +
          escapeHtml(recap.nextStep) +
          '</p>' +
          '<p class="m-0 mt-3 text-sm leading-relaxed text-gray-700 dark:text-gray-200 whitespace-pre-wrap">' +
          escapeHtml(recap.talkTrack) +
          '</p>'
      ) +
      '<details id="call-recap-sec-transcript" class="rounded-2xl border border-gray-200 dark:border-gray-700 px-4 py-3">' +
      '<summary class="cursor-pointer font-semibold text-sm text-[#002B5C] dark:text-white">8. Full transcript</summary>' +
      '<pre class="mt-3 mb-0 whitespace-pre-wrap text-xs leading-relaxed text-gray-700 dark:text-gray-200 font-sans">' +
      escapeHtml(transcript) +
      '</pre></details>';

    lastPlain = toPlain(recap, facts, transcript);
    lastTranscript = transcript;
  }

  function section(id, title, body) {
    return (
      '<section id="' +
      id +
      '" class="mb-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">' +
      '<h3 class="text-sm font-bold text-[#002B5C] dark:text-white m-0 mb-3">' +
      escapeHtml(title) +
      '</h3>' +
      body +
      '</section>'
    );
  }

  function row(label, value) {
    return (
      '<div><dt class="text-[11px] uppercase tracking-wide text-gray-500">' +
      escapeHtml(label) +
      '</dt><dd class="m-0 font-medium text-[#002B5C] dark:text-white">' +
      escapeHtml(value) +
      '</dd></div>'
    );
  }

  function linesOf(title, items) {
    return title + '\n' + items.map((item) => '• ' + item).join('\n');
  }

  function toPlain(recap, facts, transcript) {
    const objections = recap.objections
      .map((item, i) => i + 1 + '. ' + item.concern + '\n   Reply: ' + item.reply)
      .join('\n');
    const actions = (owner, items) =>
      items.map((item) => '• ' + item.action + ' — ' + owner + ' — ' + item.due).join('\n');
    return [
      'CALL RECAP',
      'Source: ' + facts.source,
      '',
      '1. Call snapshot',
      'Generated: ' + facts.generated,
      'Candidate: ' + facts.candidate,
      'Role: ' + facts.role,
      'Call type: ' + facts.callType,
      'Recruiter: ' + facts.recruiter,
      'Duration: ' + facts.duration,
      '',
      '2. Executive summary',
      recap.temperature + ' — ' + recap.temperatureWhy,
      recap.summary,
      '',
      linesOf('3. What they care about', recap.cares),
      '',
      linesOf('4. Fit signals — green flags', recap.green),
      linesOf('Caution flags', recap.caution),
      '',
      '5. Objections / open loops',
      objections,
      '',
      '6. Action items',
      'Recruiter owns',
      actions('Recruiter', recap.recruiterActions),
      'Candidate owns',
      actions('Candidate', recap.candidateActions),
      '',
      '7. Suggested next touch',
      recap.nextStep,
      recap.talkTrack,
      '',
      '8. Full transcript',
      transcript
    ].join('\n');
  }

  function xmlEscape(s) {
    return String(s || '')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function docxParagraph(text, bold) {
    const size = bold ? '28' : '22';
    const weight = bold ? '<w:b/>' : '';
    return (
      '<w:p><w:r><w:rPr>' +
      weight +
      '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="' +
      size +
      '"/></w:rPr><w:t xml:space="preserve">' +
      xmlEscape(text) +
      '</w:t></w:r></w:p>'
    );
  }

  async function downloadDocx() {
    if (!lastPlain) {
      toast('Build a recap first', 'warning');
      return;
    }
    if (typeof JSZip === 'undefined') {
      toast('Word download needs JSZip, which did not load. Copy the recap instead.', 'error');
      return;
    }
    const paras = lastPlain.split('\n').map((line) => {
      const heading = /^\d+\.\s/.test(line) || line === 'CALL RECAP' || line === 'Recruiter owns' || line === 'Candidate owns' || line === 'Caution flags';
      return docxParagraph(line || ' ', heading);
    }).join('');
    const documentXml =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
      paras +
      '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/>' +
      '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>' +
      '</w:body></w:document>';
    const contentTypes =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '</Types>';
    const rels =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships>';
    const wordRels =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
    const zip = new JSZip();
    zip.file('[Content_Types].xml', contentTypes);
    zip.folder('_rels').file('.rels', rels);
    const word = zip.folder('word');
    word.file('document.xml', documentXml);
    word.folder('_rels').file('document.xml.rels', wordRels);
    const blob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    const candidate = fieldValue('call-recap-candidate').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'call-recap' + (candidate ? '-' + candidate : '') + '.docx';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
    toast('Word recap downloaded', 'success');
  }

  async function copyRecap() {
    if (!lastPlain) {
      toast('Build a recap first', 'warning');
      return;
    }
    try {
      await navigator.clipboard.writeText(lastPlain);
      toast('Recap copied', 'success');
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = lastPlain;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      toast('Recap copied', 'success');
    }
  }

  function saveRecap() {
    if (!lastPlain) {
      toast('Build a recap first', 'warning');
      return;
    }
    const candidate = fieldValue('call-recap-candidate') || 'Candidate';
    const title = 'Call recap — ' + candidate + ' — ' + new Date().toLocaleString();
    const html = lastPlain
      .split('\n')
      .map((line) => (line.trim() ? '<p>' + escapeHtml(line) + '</p>' : '<br>'))
      .join('');
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem('socialSavedIdeas') || '[]');
      if (!Array.isArray(saved)) saved = [];
    } catch (e) {
      saved = [];
    }
    saved.push({
      title,
      content: html,
      savedAt: new Date().toISOString(),
      type: 'call-recap'
    });
    localStorage.setItem('socialSavedIdeas', JSON.stringify(saved));
    if (typeof window.updateSavedCount === 'function') window.updateSavedCount();
    if (typeof window.showSavedFeedback === 'function') window.showSavedFeedback('Saved to My Saved Items');
    else toast('Saved to My Saved Items', 'success');
  }

  async function buildRecap() {
    const transcript = fieldValue('call-recap-transcript');
    if (!transcript || transcript.length < 40) {
      toast('Paste a transcript or drop a recording first', 'warning');
      setStatus('Paste a transcript or drop a recording first.', 'info');
      return;
    }
    if (typeof window.callGrokAPI !== 'function') {
      toast('Grok is not available in this session', 'error');
      return;
    }
    if (running) return;
    running = true;
    activeAbort = new AbortController();
    const facts = snapshotFacts();
    showOverlay('Writing the recap from this transcript…');
    setStatus('Building the recap. You can cancel if this sits too long.', 'info');
    try {
      const raw = await window.callGrokAPI(buildPrompt(transcript, facts), {
        temperature: 0.2,
        max_tokens: 3500,
        signal: activeAbort.signal
      });
      const data = parseRecapJson(raw);
      const recap = normalizeRecap(data, transcript);
      renderRecap(recap, facts, transcript);
      setStatus('Recap is ready. Copy it, download Word, or save it. Nothing was emailed.', 'ok');
      el('call-recap-result')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      console.error('[call-recap]', err);
      const message = (err && err.message) || 'Recap failed';
      setStatus(message, 'error');
      toast(message, 'error');
    } finally {
      running = false;
      activeAbort = null;
      hideOverlay();
    }
  }

  function wireTypes() {
    const host = el('call-recap-types');
    if (!host) return;
    host.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-call-type]');
      if (!btn) return;
      selectedType = btn.getAttribute('data-call-type') || '';
      host.querySelectorAll('[data-call-type]').forEach((node) => {
        const on = node === btn;
        node.classList.toggle('bg-[#002B5C]', on);
        node.classList.toggle('text-white', on);
        node.classList.toggle('border-[#002B5C]', on);
        node.classList.toggle('border-gray-300', !on);
        node.classList.toggle('text-[#002B5C]', !on);
        node.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    });
  }

  function wireDrop() {
    const zone = el('call-recap-dropzone');
    const input = el('call-recap-file');
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
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!file) return;
      try {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
      } catch (err) {}
      acceptFile(file);
    });
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (file) acceptFile(file);
    });
  }

  function wire() {
    wireDrop();
    wireTypes();
    prefillRecruiter();
    el('call-recap-recruiter')?.addEventListener('input', (e) => {
      e.target.dataset.userEdited = '1';
    });
    el('call-recap-generate')?.addEventListener('click', () => buildRecap());
    el('call-recap-cancel')?.addEventListener('click', () => cancelJob());
    el('call-recap-result')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-recap-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-recap-action');
      if (action === 'copy') copyRecap();
      else if (action === 'docx') downloadDocx();
      else if (action === 'save') saveRecap();
      else if (action === 'regenerate') buildRecap();
    });
    sttIsConfigured().then((ready) => {
      sttReady = ready;
      paintSttHint();
    });
    console.log('%c[call-recap] Recording + paste recap ready', 'color:#00A89D');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
