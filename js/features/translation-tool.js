/**
 * js/features/translation-tool.js
 * Shared Client Translation engine — LO + Realtor (set window.TRANSLATION_COACH_VARIANT).
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'socialSavedIdeas';
  const SESSION_HISTORY_KEY = 'translationSessionHistory';
  const MAX_CHARS = 50000;
  const CHUNK_SIZE = 3200;
  const MAX_SESSION_HISTORY = 5;

  const LANGUAGES = [
    { code: 'auto', label: 'Auto-detect' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Spanish' },
    { code: 'vi', label: 'Vietnamese' },
    { code: 'zh', label: 'Chinese (Simplified)' },
    { code: 'ar', label: 'Arabic' },
    { code: 'pt', label: 'Portuguese' },
    { code: 'fr', label: 'French' },
    { code: 'ko', label: 'Korean' },
    { code: 'ru', label: 'Russian' },
    { code: 'ht', label: 'Haitian Creole' },
    { code: 'tl', label: 'Tagalog' }
  ];

  const VARIANTS = {
    lo: {
      title: 'Client Translation',
      subtitle: 'Translate client emails, texts, disclosures, and outreach — with mortgage-aware tone and glossary lock.',
      contentTypes: [
        { id: 'client-email', label: 'Client email' },
        { id: 'text-message', label: 'Text message (short)' },
        { id: 'pre-approval', label: 'Pre-approval explanation' },
        { id: 'rate-update', label: 'Rate / market update' },
        { id: 'disclosure', label: 'Disclosure / process note' },
        { id: 'social-post', label: 'Social post' },
        { id: 'partner-note', label: 'Realtor partner note' },
        { id: 'general', label: 'General' }
      ],
      sample: 'Hi Maria — great news! Your pre-approval is ready up to $425,000. Next step: send me your most recent pay stub and we\'ll lock your rate. Call me anytime with questions.'
    },
    realtor: {
      title: 'Client Translation',
      subtitle: 'Translate buyer/seller emails, open house invites, and listing updates — clear, professional, and market-ready.',
      contentTypes: [
        { id: 'open-house', label: 'Open house invite' },
        { id: 'buyer-consult', label: 'Buyer consultation' },
        { id: 'listing-update', label: 'Listing update' },
        { id: 'client-email', label: 'Client email' },
        { id: 'text-message', label: 'Text message (short)' },
        { id: 'social-post', label: 'Social post' },
        { id: 'general', label: 'General' }
      ],
      sample: 'Hi Carlos — open house this Sunday 1–3 PM at 124 Oak Street. Great starter home with a fenced yard. Bring your pre-approval letter or I can connect you with a trusted lender. See you there!'
    }
  };

  const GLOSSARY = [
    'pre-approval', 'pre-qualification', 'escrow', 'PMI', 'APR', 'LTV', 'DTI',
    'closing costs', 'down payment', 'contingency', 'earnest money', 'title insurance',
    'underwriting', 'rate lock', 'refinance', 'HELOC', 'FHA', 'VA', 'USDA', 'conventional'
  ];

  let uploadedFileName = '';
  let isTranslating = false;
  let isCheckingQA = false;

  function getVariant() {
    const v = (window.TRANSLATION_COACH_VARIANT || 'lo').toLowerCase();
    return VARIANTS[v] || VARIANTS.lo;
  }

  function langLabel(code) {
    return LANGUAGES.find((l) => l.code === code)?.label || code;
  }

  function getProfile() {
    if (typeof window.getUserProfile === 'function') return window.getUserProfile();
    try {
      return JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch (e) {
      return {};
    }
  }

  function getDefaultTarget() {
    const p = getProfile();
    return p.translationDefaultTarget || 'es';
  }

  function getFavoriteLanguages() {
    const p = getProfile();
    const fav = Array.isArray(p.translationFavoriteLanguages)
      ? p.translationFavoriteLanguages.filter(Boolean)
      : [];
    if (fav.length) return fav;
    return ['es', 'vi', 'zh'];
  }

  function persistTranslationPrefs(targetCode, favorites) {
    try {
      const partial = {};
      if (targetCode) partial.translationDefaultTarget = targetCode;
      if (favorites) partial.translationFavoriteLanguages = favorites;
      if (!Object.keys(partial).length) return;
      if (typeof window.patchUserProfile === 'function') {
        window.patchUserProfile(partial, { silent: true });
        return;
      }
      const raw = JSON.parse(localStorage.getItem('userProfile') || '{}');
      Object.assign(raw, partial);
      localStorage.setItem('userProfile', JSON.stringify(raw));
    } catch (e) {}
  }

  function el(id) {
    return document.getElementById(id);
  }

  function setStatus(msg, type) {
    const status = el('tr-status');
    if (!status) return;
    status.textContent = msg || '';
    status.className = 'text-xs mt-2 ' + (
      type === 'error' ? 'text-red-500' :
      type === 'success' ? 'text-[#00A89D]' :
      'text-gray-500 dark:text-gray-400'
    );
  }

  function setProgress(msg) {
    const bar = el('tr-progress');
    const text = el('tr-progress-text');
    if (text) text.textContent = msg || '';
    if (bar) bar.classList.toggle('hidden', !msg);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hideQAPanel() {
    const panel = el('tr-qa-panel');
    if (panel) {
      panel.classList.add('hidden');
      panel.innerHTML = '';
    }
  }

  function renderQAPanel(parsed) {
    const panel = el('tr-qa-panel');
    if (!panel || !parsed) return;

    const fidelity = parsed.fidelity || 'Medium';
    const badgeClass = fidelity === 'High'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
      : fidelity === 'Low'
      ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';

    const watchHtml = parsed.watchItems.length
      ? `<ul class="list-disc pl-4 m-0 space-y-1">${parsed.watchItems.map((w) =>
          `<li>${escapeHtml(w)}</li>`
        ).join('')}</ul>`
      : '<p class="text-xs text-gray-500 m-0">No significant watch items flagged.</p>';

    panel.innerHTML = `
      <div class="flex items-start justify-between gap-3 mb-3">
        <div>
          <div class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Meaning check (back-translation QA)</div>
          <span class="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${badgeClass}">
            <i class="fas fa-shield-alt"></i> Fidelity: ${escapeHtml(fidelity)}
          </span>
        </div>
        <button type="button" id="tr-qa-dismiss" class="text-[11px] px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 hover:text-gray-700 transition">Dismiss</button>
      </div>
      <div class="mb-3">
        <div class="text-[10px] font-semibold text-gray-500 mb-1">BACK-TRANSLATION (English)</div>
        <div class="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs leading-relaxed whitespace-pre-wrap">${escapeHtml(parsed.backTranslation || '—')}</div>
      </div>
      <div>
        <div class="text-[10px] font-semibold text-gray-500 mb-1">WATCH ITEMS</div>
        ${watchHtml}
      </div>
      <p class="text-[10px] text-gray-400 mt-2 m-0">Automated QA — not a substitute for human review before client use.</p>
    `;
    panel.classList.remove('hidden');
    panel.querySelector('#tr-qa-dismiss')?.addEventListener('click', hideQAPanel);
  }

  function parseQAResponse(raw) {
    const text = String(raw || '').trim();
    const fidelityMatch = text.match(/FIDELITY:\s*(High|Medium|Low)/i);
    const fidelity = fidelityMatch ? fidelityMatch[1] : 'Medium';

    let backTranslation = '';
    const backMatch = text.match(/BACK-TRANSLATION:\s*([\s\S]*?)(?=WATCH ITEMS:|$)/i);
    if (backMatch) backTranslation = backMatch[1].trim();

    const watchItems = [];
    const watchMatch = text.match(/WATCH ITEMS:\s*([\s\S]*?)$/i);
    if (watchMatch) {
      const block = watchMatch[1].trim();
      if (!/none significant/i.test(block)) {
        block.split('\n').forEach((line) => {
          const item = line.replace(/^[-•*]\s*/, '').trim();
          if (item) watchItems.push(item);
        });
      }
    }

    return { fidelity, backTranslation, watchItems };
  }

  function buildQAPrompt(source, translation, targetLang) {
    return `You are a translation QA reviewer for ${(window.TRANSLATION_COACH_VARIANT || 'lo') === 'realtor' ? 'real estate' : 'mortgage'} client communications.

ORIGINAL TEXT:
"""
${source}
"""

TRANSLATION (${targetLang}):
"""
${translation}
"""

TASK:
1. Back-translate the TRANSLATION into English (faithful, not polished marketing copy).
2. Compare the back-translation to the ORIGINAL for meaning fidelity.
3. List watch items: wrong terms, ambiguous phrases, numbers/names that changed, tone drift, or legal/rate implications added or lost.
4. Rate overall fidelity: High, Medium, or Low.

OUTPUT FORMAT (use exactly this structure):
FIDELITY: High|Medium|Low
BACK-TRANSLATION:
[back-translated text]
WATCH ITEMS:
- item 1
(or "None significant" if clean)`;
  }

  function updateCharCount() {
    const src = el('tr-source-text');
    const counter = el('tr-char-count');
    if (!src || !counter) return;
    const len = (src.value || '').length;
    counter.textContent = `${len.toLocaleString()} / ${MAX_CHARS.toLocaleString()} characters`;
    counter.classList.toggle('text-red-500', len > MAX_CHARS);
  }

  function populateLanguageSelects() {
    const source = el('tr-source-lang');
    const target = el('tr-target-lang');
    if (!source || !target) return;

    const opts = LANGUAGES.map((l) =>
      `<option value="${l.code}">${l.label}</option>`
    ).join('');

    source.innerHTML = opts;
    target.innerHTML = LANGUAGES.filter((l) => l.code !== 'auto').map((l) =>
      `<option value="${l.code}">${l.label}</option>`
    ).join('');

    source.value = 'auto';
    target.value = getDefaultTarget();
    renderFavoriteChips();
  }

  function populateContentTypes() {
    const select = el('tr-content-type');
    if (!select) return;
    const variant = getVariant();
    select.innerHTML = variant.contentTypes.map((t) =>
      `<option value="${t.id}">${t.label}</option>`
    ).join('');
  }

  function renderFavoriteChips() {
    const wrap = el('tr-favorite-chips');
    const target = el('tr-target-lang');
    if (!wrap || !target) return;

    const favorites = getFavoriteLanguages().filter((c) => c !== 'auto' && c !== 'en');
    wrap.innerHTML = favorites.map((code) => {
      const active = target.value === code;
      return `<button type="button" data-tr-fav="${code}" class="tr-fav-chip text-[11px] px-2.5 py-1 rounded-full border transition ${active ? 'bg-[#00A89D] text-white border-[#00A89D]' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[#00A89D]'}">${langLabel(code)}</button>`;
    }).join('');

    wrap.querySelectorAll('[data-tr-fav]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-tr-fav');
        if (code) {
          target.value = code;
          persistTranslationPrefs(code, null);
          renderFavoriteChips();
        }
      });
    });
  }

  function splitChunks(text) {
    const trimmed = text.trim();
    if (!trimmed) return [];
    if (trimmed.length <= CHUNK_SIZE) return [trimmed];

    const chunks = [];
    const paragraphs = trimmed.split(/\n{2,}/);
    let current = '';

    paragraphs.forEach((para) => {
      if ((current + '\n\n' + para).trim().length <= CHUNK_SIZE) {
        current = current ? current + '\n\n' + para : para;
      } else {
        if (current) chunks.push(current.trim());
        if (para.length <= CHUNK_SIZE) {
          current = para;
        } else {
          let start = 0;
          while (start < para.length) {
            chunks.push(para.slice(start, start + CHUNK_SIZE));
            start += CHUNK_SIZE;
          }
          current = '';
        }
      }
    });
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }

  function buildPrompt(chunk, opts) {
    const { sourceLang, targetLang, contentType, tone, variantKey } = opts;
    const variant = VARIANTS[variantKey] || VARIANTS.lo;
    const typeLabel = variant.contentTypes.find((t) => t.id === contentType)?.label || 'General';
    const profile = getProfile();
    const sourceLabel = sourceLang === 'auto' ? 'auto-detect the source language' : langLabel(sourceLang);
    const targetLabel = langLabel(targetLang);

    const toneGuide = tone === 'formal'
      ? 'Use a formal, professional register appropriate for legal-adjacent client communication.'
      : tone === 'simple'
      ? 'Use plain language at roughly 6th–8th grade reading level. Short sentences.'
      : 'Use warm, conversational professional tone — trusted advisor, not corporate boilerplate.';

    return `You are an expert translator for ${variantKey === 'realtor' ? 'real estate' : 'mortgage'} professionals in the United States.

TASK: Translate the SOURCE TEXT below into ${targetLabel}.
Source language: ${sourceLabel}.
Content type: ${typeLabel}.
${toneGuide}

GLOSSARY RULES (critical):
- Use industry-standard translations for mortgage/real estate terms when they exist in the target language.
- Keep these terms recognizable where appropriate: ${GLOSSARY.join(', ')}.
- Never invent legal promises, rates, or approvals not in the source.
- Preserve names, numbers, dollar amounts, dates, URLs, and phone numbers exactly.
- If a phrase is ambiguous, choose the clearest client-friendly wording and do not add disclaimers in the output.

${profile.contentNotes ? `USER GUARDRAILS: ${profile.contentNotes}` : ''}
${profile.location ? `MARKET CONTEXT: ${profile.location}` : ''}

OUTPUT RULES:
- Return ONLY the translated text — no preamble, no quotes, no markdown fences.
- Preserve paragraph breaks from the source.
- Do not add content that was not in the source.

SOURCE TEXT:
"""
${chunk}
"""`;
  }

  async function extractFileText(file) {
    if (!file) return '';

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      if (!window.pdfjsLib) throw new Error('PDF library not loaded — refresh the page and try again.');
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress(`Extracting PDF… page ${i} of ${pdf.numPages}`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item) => item.str).join(' ') + '\n\n';
      }
      return fullText.trim();
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(String(ev.target.result || '').trim());
      reader.onerror = () => reject(new Error('Could not read file.'));
      reader.readAsText(file);
    });
  }

  async function translateChunk(chunk, opts) {
    if (typeof window.callGrokAPI !== 'function') {
      throw new Error('AI API not available — check that api.js is loaded.');
    }
    const prompt = buildPrompt(chunk, opts);
    const result = await window.callGrokAPI(prompt, { temperature: 0.2, max_tokens: 4000 });
    return String(result || '').trim();
  }

  async function translateFullText(text, opts) {
    const chunks = splitChunks(text);
    if (!chunks.length) throw new Error('Nothing to translate.');

    const parts = [];
    for (let i = 0; i < chunks.length; i++) {
      setProgress(chunks.length > 1
        ? `Translating section ${i + 1} of ${chunks.length}…`
        : 'Translating…');
      const translated = await translateChunk(chunks[i], opts);
      parts.push(translated);
    }
    return parts.join('\n\n');
  }

  function pushSessionHistory(entry) {
    try {
      const list = JSON.parse(sessionStorage.getItem(SESSION_HISTORY_KEY) || '[]');
      list.unshift(entry);
      sessionStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(list.slice(0, MAX_SESSION_HISTORY)));
      renderSessionHistory();
    } catch (e) {}
  }

  function renderSessionHistory() {
    const wrap = el('tr-session-history');
    if (!wrap) return;
    let list = [];
    try {
      list = JSON.parse(sessionStorage.getItem(SESSION_HISTORY_KEY) || '[]');
    } catch (e) {}

    if (!list.length) {
      wrap.innerHTML = '<p class="text-[11px] text-gray-400 m-0">No translations this session yet.</p>';
      return;
    }

    wrap.innerHTML = list.map((item, idx) => `
      <button type="button" data-tr-history="${idx}" class="w-full text-left text-[11px] px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#00A89D] hover:bg-[#00A89D]/5 transition truncate">
        <span class="font-semibold text-[#002B5C] dark:text-white">${item.label}</span>
        <span class="text-gray-400"> · ${item.target}</span>
      </button>
    `).join('');

    wrap.querySelectorAll('[data-tr-history]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-tr-history'), 10);
        const item = list[idx];
        if (!item) return;
        if (el('tr-source-text')) el('tr-source-text').value = item.source || '';
        if (el('tr-result-text')) el('tr-result-text').value = item.result || '';
        updateCharCount();
      });
    });
  }

  async function processUploadedFile(file) {
    if (!file) return;
    const nameEl = el('tr-file-name');
    const removeBtn = el('tr-remove-file');
    uploadedFileName = file.name;

    try {
      setStatus('Reading file…', '');
      const text = await extractFileText(file);
      if (!text) throw new Error('No text found in file.');
      if (text.length > MAX_CHARS) {
        throw new Error(`File is too long (${text.length.toLocaleString()} chars). Max is ${MAX_CHARS.toLocaleString()}.`);
      }
      if (el('tr-source-text')) el('tr-source-text').value = text;
      updateCharCount();
      if (nameEl) {
        nameEl.textContent = file.name;
        nameEl.classList.remove('hidden');
      }
      if (removeBtn) removeBtn.classList.remove('hidden');
      setStatus(`Loaded ${file.name} — review text, then translate.`, 'success');
    } catch (err) {
      setStatus(err.message || 'File upload failed.', 'error');
    } finally {
      setProgress('');
    }
  }

  function setupUpload() {
    const area = el('tr-upload-area');
    const input = el('tr-file-input');
    if (!area || !input) return;

    area.addEventListener('click', (e) => {
      if (!e.target.closest('label')) input.click();
    });
    area.addEventListener('dragover', (e) => {
      e.preventDefault();
      area.classList.add('border-[#F15A29]', 'bg-[#F15A29]/5');
    });
    area.addEventListener('dragleave', () => {
      area.classList.remove('border-[#F15A29]', 'bg-[#F15A29]/5');
    });
    area.addEventListener('drop', (e) => {
      e.preventDefault();
      area.classList.remove('border-[#F15A29]', 'bg-[#F15A29]/5');
      const file = e.dataTransfer.files[0];
      if (file) processUploadedFile(file);
    });
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) processUploadedFile(file);
      input.value = '';
    });

    el('tr-remove-file')?.addEventListener('click', () => {
      clearUploadedFile();
    });
  }

  function swapLanguages() {
    const source = el('tr-source-lang');
    const target = el('tr-target-lang');
    if (!source || !target) return;
    if (source.value === 'auto') {
      source.value = target.value;
      target.value = 'en';
    } else {
      const tmp = source.value;
      source.value = target.value === 'auto' ? 'en' : target.value;
      target.value = tmp;
    }
    renderFavoriteChips();
  }

  window.runClientTranslation = async function runClientTranslation() {
    if (isTranslating) return;

    const sourceText = (el('tr-source-text')?.value || '').trim();
    const sourceLang = el('tr-source-lang')?.value || 'auto';
    const targetLang = el('tr-target-lang')?.value || getDefaultTarget();
    const contentType = el('tr-content-type')?.value || 'general';
    const tone = el('tr-tone')?.value || 'conversational';
    const resultEl = el('tr-result-text');
    const btn = el('tr-translate-btn');

    if (!sourceText) {
      setStatus('Paste or upload text to translate.', 'error');
      return;
    }
    if (sourceText.length > MAX_CHARS) {
      setStatus(`Text is too long. Maximum is ${MAX_CHARS.toLocaleString()} characters.`, 'error');
      return;
    }
    if (sourceLang !== 'auto' && sourceLang === targetLang) {
      setStatus('Source and target languages must differ.', 'error');
      return;
    }

    isTranslating = true;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Translating…</span>';
    }
    setStatus('', '');
    if (resultEl) resultEl.value = '';
    hideQAPanel();

    const variantKey = (window.TRANSLATION_COACH_VARIANT || 'lo').toLowerCase();

    try {
      const result = await translateFullText(sourceText, {
        sourceLang,
        targetLang,
        contentType,
        tone,
        variantKey
      });

      if (resultEl) resultEl.value = result;
      persistTranslationPrefs(targetLang, null);

      const label = `${langLabel(targetLang)} · ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
      pushSessionHistory({
        label,
        source: sourceText,
        result,
        target: langLabel(targetLang),
        savedAt: new Date().toISOString()
      });

      setStatus('Translation complete — review before sending to clients.', 'success');
    } catch (err) {
      setStatus(err.message || 'Translation failed. Check your API key and try again.', 'error');
    } finally {
      isTranslating = false;
      setProgress('');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-language"></i> <span>Translate</span>';
      }
    }
  };

  window.copyTranslationResult = function copyTranslationResult() {
    const text = el('tr-result-text')?.value || '';
    if (!text) {
      setStatus('Nothing to copy yet.', 'error');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      setStatus('Translation copied to clipboard.', 'success');
      if (typeof window.showToast === 'function') window.showToast('Copied!', 'success');
    }).catch(() => setStatus('Copy failed — select and copy manually.', 'error'));
  };

  function clearUploadedFile() {
    uploadedFileName = '';
    if (el('tr-file-name')) el('tr-file-name').classList.add('hidden');
    el('tr-remove-file')?.classList.add('hidden');
    const input = el('tr-file-input');
    if (input) input.value = '';
  }

  window.clearTranslationSource = function clearTranslationSource() {
    const src = el('tr-source-text');
    if (!src?.value.trim() && !uploadedFileName) return;
    src.value = '';
    clearUploadedFile();
    updateCharCount();
    setStatus('Original cleared — ready for new text.', '');
  };

  window.clearTranslationResult = function clearTranslationResult() {
    const result = el('tr-result-text');
    if (!result?.value.trim()) return;
    result.value = '';
    setProgress('');
    hideQAPanel();
    setStatus('Translation cleared.', '');
  };

  window.copyTranslationSource = function copyTranslationSource() {
    const text = el('tr-source-text')?.value || '';
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (typeof window.showToast === 'function') window.showToast('Source copied', 'success');
  };

  window.downloadTranslationResult = function downloadTranslationResult() {
    const text = el('tr-result-text')?.value || '';
    if (!text) {
      setStatus('Nothing to download yet.', 'error');
      return;
    }
    const target = langLabel(el('tr-target-lang')?.value || 'translation');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation-${target.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  function waitForLayout() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }

  function buildTranslationPdfContent(text, meta) {
    const { target, source, typeLabel, coachLabel, profileName } = meta;
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-tr-pdf-root', '1');
    Object.assign(wrapper.style, {
      width: '720px',
      padding: '24px',
      background: '#ffffff',
      color: '#002B5C',
      fontFamily: 'Calibri, Arial, "Segoe UI", "Noto Sans", sans-serif',
      lineHeight: '1.55',
      boxSizing: 'border-box'
    });

    const header = document.createElement('div');
    header.style.cssText = 'border-bottom:3px solid #00A89D;padding-bottom:12px;margin-bottom:20px;';
    header.innerHTML = `
      <div style="font-size:11px;letter-spacing:2px;color:#00A89D;font-weight:bold;">CLIENT TRANSLATION</div>
      <div style="margin:8px 0 4px;font-size:22px;font-weight:bold;color:#F15A29;">${escapeHtml(target)} · ${escapeHtml(typeLabel)}</div>
      <div style="font-size:12px;color:#666666;">${escapeHtml(coachLabel)} · ${new Date().toLocaleDateString()}</div>
    `;
    wrapper.appendChild(header);

    const metaLine = document.createElement('div');
    metaLine.style.cssText = 'font-size:11px;color:#888888;margin-bottom:16px;';
    metaLine.textContent = `From: ${source} · AI translation — review before client use.`;
    wrapper.appendChild(metaLine);

    const body = document.createElement('div');
    body.style.cssText = 'white-space:pre-wrap;font-size:14px;color:#002B5C;word-wrap:break-word;';
    body.textContent = text;
    wrapper.appendChild(body);

    if (profileName) {
      const footer = document.createElement('div');
      footer.style.cssText = 'margin-top:28px;padding-top:12px;border-top:1px solid #dddddd;font-size:12px;color:#666666;';
      footer.textContent = `Prepared by ${profileName}`;
      wrapper.appendChild(footer);
    }

    return wrapper;
  }

  function getJsPDFConstructor() {
    if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
    if (typeof window.jsPDF === 'function') return window.jsPDF;
    return null;
  }

  function sanitizeForPdf(str) {
    return String(str)
      .replace(/[\u2018\u2019\u2032]/g, "'")
      .replace(/[\u201C\u201D\u2033]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/\u00B7/g, '-')
      .replace(/\u00A0/g, ' ');
  }

  function saveTranslationPdfViaJsPdf(text, meta, filename) {
    const JsPDF = getJsPDFConstructor();
    if (!JsPDF) throw new Error('PDF text engine not available');

    const safeText = sanitizeForPdf(text);
    const safeMeta = {
      target: sanitizeForPdf(meta.target),
      source: sanitizeForPdf(meta.source),
      typeLabel: sanitizeForPdf(meta.typeLabel),
      coachLabel: sanitizeForPdf(meta.coachLabel),
      profileName: sanitizeForPdf(meta.profileName)
    };

    const doc = new JsPDF({ unit: 'in', format: 'letter', orientation: 'portrait' });
    const margin = 0.75;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const maxW = pageW - margin * 2;
    let y = margin;
    const lineHeight = 0.2;

    function ensureSpace(needed) {
      if (y + needed > pageH - margin) {
        doc.addPage();
        y = margin;
      }
    }

    function writeLines(lines, size, rgb, bold) {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      lines.forEach((line) => {
        ensureSpace(lineHeight);
        doc.text(line, margin, y);
        y += lineHeight;
      });
    }

    function writeBlock(content, size, rgb, bold) {
      const lines = doc.splitTextToSize(content || '', maxW);
      writeLines(lines, size, rgb, bold);
    }

    writeLines(['CLIENT TRANSLATION'], 10, [0, 168, 157], true);
    y += 0.05;
    writeBlock(`${safeMeta.target} - ${safeMeta.typeLabel}`, 16, [241, 90, 41], true);
    writeBlock(`${safeMeta.coachLabel} - ${new Date().toLocaleDateString()}`, 10, [102, 102, 102], false);
    y += 0.1;
    writeBlock(`From: ${safeMeta.source} - AI translation - review before client use.`, 9, [136, 136, 136], false);
    y += 0.1;
    writeBlock(safeText, 11, [0, 43, 92], false);
    if (safeMeta.profileName) {
      y += 0.15;
      writeBlock(`Prepared by ${safeMeta.profileName}`, 10, [102, 102, 102], false);
    }

    doc.save(filename);
  }

  function translationNeedsCanvasPdf(text) {
    return /[\u0600-\u06FF\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\u0E00-\u0E7F]/.test(text);
  }

  async function saveTranslationPdfViaCanvas(wrapper, filename) {
    if (!window.html2pdf) throw new Error('Canvas PDF engine not available');
    await window.html2pdf().set({
      margin: [0.6, 0.6, 0.6, 0.6],
      filename,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      },
      pagebreak: { mode: ['css', 'legacy'] },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(wrapper).save();
  }

  window.downloadTranslationPdf = async function downloadTranslationPdf() {
    const text = (el('tr-result-text')?.value || '').trim();
    if (!text) {
      setStatus('Nothing to download yet.', 'error');
      return;
    }
    if (!window.html2pdf && !getJsPDFConstructor()) {
      setStatus('PDF library not loaded — refresh the page and try again.', 'error');
      return;
    }

    const target = langLabel(el('tr-target-lang')?.value || 'translation');
    const source = langLabel(el('tr-source-lang')?.value || 'auto');
    const profile = getProfile();
    const contentType = el('tr-content-type')?.value || 'general';
    const typeLabel = getVariant().contentTypes.find((t) => t.id === contentType)?.label || 'Translation';
    const coachLabel = (window.TRANSLATION_COACH_VARIANT || 'lo') === 'realtor' ? 'Realtor Sales Coach' : 'Loan Officer Sales Coach';
    const pdfMeta = {
      target,
      source,
      typeLabel,
      coachLabel,
      profileName: profile.name || ''
    };

    const filename = `translation-${target.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
    setStatus('Generating PDF…', '');

    const useCanvas = translationNeedsCanvasPdf(text) && window.html2pdf;
    let overlay = null;

    try {
      if (!useCanvas) {
        saveTranslationPdfViaJsPdf(text, pdfMeta, filename);
        setStatus('PDF downloaded.', 'success');
        return;
      }

      const wrapper = buildTranslationPdfContent(text, pdfMeta);
      overlay = document.createElement('div');
      overlay.setAttribute('aria-hidden', 'true');
      Object.assign(overlay.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        width: '100%',
        minHeight: '100%',
        zIndex: '2147483646',
        background: '#ffffff',
        overflow: 'auto',
        padding: '24px',
        boxSizing: 'border-box'
      });
      overlay.appendChild(wrapper);
      document.body.appendChild(overlay);
      await waitForLayout();
      await new Promise((resolve) => setTimeout(resolve, 150));

      await saveTranslationPdfViaCanvas(wrapper, filename);
      setStatus('PDF downloaded.', 'success');
    } catch (err) {
      console.error('[translation-tool] PDF canvas export failed:', err);
      try {
        saveTranslationPdfViaJsPdf(text, pdfMeta, filename);
        setStatus('PDF downloaded.', 'success');
      } catch (fallbackErr) {
        console.error('[translation-tool] PDF text export failed:', fallbackErr);
        setStatus('PDF download failed — try Download .txt instead.', 'error');
      }
    } finally {
      overlay?.remove();
    }
  };

  window.checkTranslationMeaning = async function checkTranslationMeaning() {
    if (isCheckingQA || isTranslating) return;

    const source = (el('tr-source-text')?.value || '').trim();
    const translation = (el('tr-result-text')?.value || '').trim();
    const btn = el('tr-qa-btn');

    if (!translation) {
      setStatus('Translate something first, then check meaning.', 'error');
      return;
    }
    if (!source) {
      setStatus('Add original text so QA can compare meaning.', 'error');
      return;
    }

    isCheckingQA = true;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking…';
    }
    setStatus('Running back-translation QA…', '');

    try {
      const targetLang = langLabel(el('tr-target-lang')?.value || 'es');
      const prompt = buildQAPrompt(source, translation, targetLang);
      const raw = await window.callGrokAPI(prompt, { temperature: 0.1, max_tokens: 2500 });
      const parsed = parseQAResponse(raw);
      renderQAPanel(parsed);

      const fidelity = parsed.fidelity || 'Medium';
      const msg = fidelity === 'High'
        ? 'Meaning check: High fidelity — still review before sending.'
        : fidelity === 'Low'
        ? 'Meaning check: Low fidelity — review watch items carefully.'
        : 'Meaning check: Medium fidelity — review watch items before sending.';
      setStatus(msg, fidelity === 'High' ? 'success' : 'error');
    } catch (err) {
      setStatus(err.message || 'QA check failed. Try again.', 'error');
    } finally {
      isCheckingQA = false;
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-shield-alt"></i> Check meaning';
      }
    }
  };

  window.saveTranslationToLibrary = function saveTranslationToLibrary() {
    const source = el('tr-source-text')?.value || '';
    const result = el('tr-result-text')?.value || '';
    const targetLang = el('tr-target-lang')?.value || 'es';
    const contentType = el('tr-content-type')?.value || 'general';

    if (!result.trim()) {
      setStatus('Translate something first, then save.', 'error');
      return;
    }

    const variant = getVariant();
    const typeLabel = variant.contentTypes.find((t) => t.id === contentType)?.label || 'Translation';
    const title = `Translation: ${langLabel(targetLang)} — ${typeLabel}`;
    const escaped = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const richContent = `
<div class="translation-saved">
  <div class="text-xs uppercase tracking-widest font-bold text-[#00A89D] mb-2">Client Translation</div>
  <div class="text-sm mb-3"><strong>${escaped(langLabel(targetLang))}</strong> · ${escaped(typeLabel)}</div>
  <div class="mb-3">
    <div class="text-[10px] font-semibold text-gray-500 mb-1">ORIGINAL</div>
    <div class="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm whitespace-pre-wrap">${escaped(source)}</div>
  </div>
  <div>
    <div class="text-[10px] font-semibold text-gray-500 mb-1">TRANSLATION</div>
    <div class="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm whitespace-pre-wrap">${escaped(result)}</div>
  </div>
  <div class="mt-2 text-[10px] text-gray-500">AI translation — review before client use.</div>
</div>`;

    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      saved = [];
    }

    saved.push({
      title,
      content: richContent,
      savedAt: new Date().toISOString(),
      type: 'translation'
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

    const globalCount = document.getElementById('global-saved-count');
    if (globalCount) globalCount.textContent = String(saved.length);

    setStatus('Saved to My Saved Items.', 'success');
    if (typeof window.showToast === 'function') {
      window.showToast('Translation saved to My Saved Items', 'success');
    }
  };

  window.loadTranslationSample = function loadTranslationSample() {
    const sample = getVariant().sample;
    if (el('tr-source-text')) el('tr-source-text').value = sample;
    updateCharCount();
    setStatus('Sample loaded — pick languages and translate.', '');
  };

  function initTranslationTool() {
    const section = el('client-translation');
    if (!section) return;

    const variant = getVariant();
    const titleEl = el('tr-hero-title');
    const subEl = el('tr-hero-subtitle');
    if (titleEl) titleEl.textContent = variant.title;
    if (subEl) subEl.textContent = variant.subtitle;

    populateLanguageSelects();
    populateContentTypes();
    setupUpload();
    renderSessionHistory();
    updateCharCount();

    el('tr-source-text')?.addEventListener('input', updateCharCount);
    el('tr-target-lang')?.addEventListener('change', () => {
      persistTranslationPrefs(el('tr-target-lang').value, null);
      renderFavoriteChips();
    });
    el('tr-swap-langs')?.addEventListener('click', swapLanguages);
    el('tr-translate-btn')?.addEventListener('click', () => window.runClientTranslation());
    el('tr-load-sample')?.addEventListener('click', () => window.loadTranslationSample());
    el('tr-qa-btn')?.addEventListener('click', () => window.checkTranslationMeaning());

    hideQAPanel();

    console.log('%c[translation-tool] Client Translation ready (' + (window.TRANSLATION_COACH_VARIANT || 'lo') + ')', 'color:#00A89D');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTranslationTool);
  } else {
    initTranslationTool();
  }
})();