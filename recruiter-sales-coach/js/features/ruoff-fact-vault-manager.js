/**
 * Ruoff Fact Vault — upload, parse, persist, and sync across all tools.
 * Primary UI lives in the Ruoff Fact Vault section (not Profile).
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'ruoffFactVaultUpload';

  const CATEGORY_HEADERS = new Set([
    'highlights and value',
    'technology',
    'support',
    'pricing',
    'compensation',
    'products and programs',
    'leadership/ culture',
    'leadership & culture',
    'leadership and culture',
    'testimonials',
    'testimonials -'
  ]);

  function normalizeCategory(line) {
    const l = line.trim();
    if (/leadership/i.test(l)) return 'Leadership & Culture';
    if (/testimonial/i.test(l)) return 'Testimonials';
    if (/product/i.test(l)) return 'Products and Programs';
    return l.replace(/\s*-\s*$/, '').replace(/\s+/g, ' ').trim();
  }

  function isCategoryLine(line) {
    const lower = line.toLowerCase().trim();
    if (CATEGORY_HEADERS.has(lower)) return true;
    if (line.length > 50) return false;
    if (line.endsWith('.') && line.length > 30) return false;
    if (/^[A-Z][a-zA-Z\s\/&\-]+$/.test(line) && line.split(' ').length <= 5) return true;
    return false;
  }

  function parseFactVaultText(text) {
    const lines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let category = 'General';
    const facts = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (isCategoryLine(line) && !line.startsWith('"')) {
        category = normalizeCategory(line);
        continue;
      }

      if (line.startsWith('"') || line.startsWith('"')) {
        const title = line.length > 72 ? line.slice(0, 69) + '…' : line;
        facts.push({ category: 'Testimonials', title, content: line });
        continue;
      }

      const next = lines[i + 1];
      const lineIsShort = line.length < 95;
      const nextIsLonger = next && next.length >= line.length && next.length > 50;
      const nextNotCategory = next && !isCategoryLine(next);

      if (next && lineIsShort && nextIsLonger && nextNotCategory && !line.startsWith('"')) {
        facts.push({
          category,
          title: line.replace(/\s*-\s*$/, '').trim(),
          content: next
        });
        i++;
        continue;
      }

      if (line.length > 30) {
        facts.push({
          category,
          title: line.length > 70 ? line.slice(0, 67) + '…' : line,
          content: line
        });
      }
    }

    if (facts.length < 5) {
      return String(text || '')
        .split(/\n\s*\n/)
        .map(chunk => chunk.trim())
        .filter(c => c.length > 40)
        .map((content, idx) => ({
          category: 'General',
          title: `Fact ${idx + 1}`,
          content
        }));
    }

    return facts;
  }

  function loadUploadMeta() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (e) {
      return null;
    }
  }

  function saveUpload(meta) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
    if (typeof window.applyRuoffFactVaultUpload === 'function') {
      window.applyRuoffFactVaultUpload(meta);
    }
    window.dispatchEvent(new CustomEvent('ruoffFactVaultUpdated', { detail: meta }));
  }

  function clearUpload() {
    localStorage.removeItem(STORAGE_KEY);
    if (typeof window.applyRuoffFactVaultUpload === 'function') {
      window.applyRuoffFactVaultUpload(null);
    }
    window.dispatchEvent(new CustomEvent('ruoffFactVaultUpdated', { detail: null }));
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return iso;
    }
  }

  function updateStatusUI() {
    const statusEl = document.getElementById('ruoff-fact-vault-status');
    if (!statusEl) return;

    const meta = loadUploadMeta();
    const active = window.getActiveRuoffFactVault ? window.getActiveRuoffFactVault() : [];
    const source = meta?.facts?.length ? 'custom upload' : 'bundled default';
    const count = active.length;

    statusEl.innerHTML = meta?.facts?.length
      ? `<span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00A89D]/10 text-[#00A89D] text-xs font-semibold">
           <i class="fas fa-check-circle"></i> ${count} facts · custom upload · ${escapeHtml(meta.fileName || 'upload')} · ${formatDate(meta.uploadedAt)}
         </span>`
      : `<span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold">
           <i class="fas fa-database"></i> ${count} facts · bundled default · upload a newer vault below
         </span>`;

    const profileStatus = document.getElementById('profile-fact-vault-status');
    if (profileStatus) {
      profileStatus.innerHTML = meta?.facts?.length
        ? `${count} facts from your upload (${formatDate(meta.uploadedAt)}) — <button type="button" class="text-[#00A89D] underline font-semibold" data-open-fact-vault>manage</button>`
        : `${count} bundled facts — <button type="button" class="text-[#00A89D] underline font-semibold" data-open-fact-vault>upload latest vault</button>`;
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  async function processUploadedFile(file) {
    const name = file.name || 'upload';
    const ext = name.split('.').pop().toLowerCase();
    let text = '';

    if (ext === 'txt' || ext === 'md' || file.type === 'text/plain') {
      text = await file.text();
    } else if (ext === 'docx') {
      text = await extractDocxText(file);
    } else {
      throw new Error('Please upload a .txt, .md, or .docx Fact Vault file.');
    }

    const facts = parseFactVaultText(text);
    if (!facts.length) throw new Error('No facts could be parsed. Try exporting from Word as .txt or paste into the text area.');

    saveUpload({
      fileName: name,
      uploadedAt: new Date().toISOString(),
      factCount: facts.length,
      facts
    });

    const nameEl = document.getElementById('ruoff-fact-upload-name');
    if (nameEl) {
      nameEl.textContent = `Loaded ${facts.length} facts from ${name}`;
      nameEl.classList.remove('hidden');
    }
    updateStatusUI();
    return facts.length;
  }

  async function extractDocxText(file) {
    if (typeof JSZip === 'undefined') {
      throw new Error('.docx requires JSZip. Save as .txt from Word, or use the paste box below.');
    }
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const docXml = await zip.file('word/document.xml')?.async('string');
    if (!docXml) throw new Error('Could not read .docx contents.');
    return docXml
      .replace(/<w:tab[^/]*\/>/g, '\t')
      .replace(/<w:br[^/]*\/>/g, '\n')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function initUploadUI() {
    const area = document.getElementById('ruoff-fact-upload-area');
    const input = document.getElementById('ruoff-fact-upload-input');
    const pasteBtn = document.getElementById('ruoff-fact-paste-apply');
    const pasteEl = document.getElementById('ruoff-fact-paste-text');
    const resetBtn = document.getElementById('ruoff-fact-reset-default');
    const msgEl = document.getElementById('ruoff-fact-upload-message');

    function showMsg(text, ok) {
      if (!msgEl) return;
      msgEl.textContent = text;
      msgEl.className = `text-sm mt-2 ${ok ? 'text-[#00A89D]' : 'text-red-600'}`;
      msgEl.classList.remove('hidden');
    }

    if (area && input) {
      area.addEventListener('click', e => {
        if (!e.target.closest('button') && !e.target.closest('textarea')) input.click();
      });
      area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('ring-2', 'ring-[#00A89D]'); });
      area.addEventListener('dragleave', () => area.classList.remove('ring-2', 'ring-[#00A89D]'));
      area.addEventListener('drop', async e => {
        e.preventDefault();
        area.classList.remove('ring-2', 'ring-[#00A89D]');
        const file = e.dataTransfer?.files?.[0];
        if (!file) return;
        try {
          const n = await processUploadedFile(file);
          showMsg(`Success — ${n} facts now power all tools.`, true);
        } catch (err) {
          showMsg(err.message || 'Upload failed', false);
        }
      });
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const n = await processUploadedFile(file);
          showMsg(`Success — ${n} facts now power all tools.`, true);
        } catch (err) {
          showMsg(err.message || 'Upload failed', false);
        }
        input.value = '';
      });
    }

    pasteBtn?.addEventListener('click', () => {
      const text = (pasteEl?.value || '').trim();
      if (!text) {
        showMsg('Paste your Fact Vault text first.', false);
        return;
      }
      const facts = parseFactVaultText(text);
      if (!facts.length) {
        showMsg('Could not parse pasted text into facts.', false);
        return;
      }
      saveUpload({
        fileName: 'Pasted text',
        uploadedAt: new Date().toISOString(),
        factCount: facts.length,
        facts
      });
      showMsg(`Success — ${facts.length} facts from paste now active.`, true);
      updateStatusUI();
    });

    resetBtn?.addEventListener('click', () => {
      if (!confirm('Restore the bundled default Fact Vault? Your upload will be removed from this browser.')) return;
      clearUpload();
      showMsg('Restored bundled default Fact Vault.', true);
      updateStatusUI();
      const nameEl = document.getElementById('ruoff-fact-upload-name');
      if (nameEl) nameEl.classList.add('hidden');
      if (pasteEl) pasteEl.value = '';
    });

    window.addEventListener('ruoffFactVaultUpdated', updateStatusUI);
    updateStatusUI();
  }

  function injectProfileStatus() {
    const contentAccordion = document.querySelector('#profile-tone')?.closest('.accordion-content')?.querySelector('.p-5');
    if (!contentAccordion || document.getElementById('profile-fact-vault-status')) return;

    const block = document.createElement('div');
    block.className = 'p-4 rounded-2xl border border-[#00A89D]/30 bg-[#00A89D]/5 text-sm';
    block.innerHTML = `
      <div class="font-semibold text-[#002B5C] dark:text-white mb-1 flex items-center gap-2">
        <i class="fas fa-gem text-[#00A89D]"></i> Ruoff Fact Vault
      </div>
      <p class="text-gray-600 dark:text-gray-400 text-xs mb-2">Company facts for AI grounding — managed in the Fact Vault tool, used by scripts, content, social, and coach.</p>
      <div id="profile-fact-vault-status" class="text-xs text-gray-700 dark:text-gray-300"></div>`;
    contentAccordion.insertBefore(block, contentAccordion.firstChild);
    updateStatusUI();
  }

  function init() {
    if (typeof window.applyRuoffFactVaultUpload === 'function') {
      window.applyRuoffFactVaultUpload(loadUploadMeta());
    }
    initUploadUI();
    injectProfileStatus();

    document.getElementById('user-profile-modal')?.addEventListener('click', e => {
      if (e.target.closest('[data-open-fact-vault]')) {
        e.preventDefault();
        const modal = document.getElementById('user-profile-modal');
        if (modal) modal.classList.add('hidden');
        if (typeof window.showSection === 'function') window.showSection('ruoff-fact-vault');
      }
    });
  }

  window.parseRuoffFactVaultText = parseFactVaultText;
  window.getRuoffFactVaultUploadMeta = loadUploadMeta;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();