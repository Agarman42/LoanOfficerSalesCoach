/**
 * js/features/lox-generator.js
 * Letter of Explanation (LOX / LOE) Generator — LO Sales Coach
 * AI-assisted drafts, minimal fields, custom free-form, improve controls.
 */
(function () {
  'use strict';

  const STATE_KEY = 'loLoxDraft_v2';

  /**
   * Minimal fields only — AI writes professional language.
   * `build` remains offline fallback if AI unavailable.
   */
  const SITUATIONS = {
    large_deposit: {
      id: 'large_deposit',
      label: 'Large Deposit',
      blurb: 'Deposit above typical payroll underwriting flagged.',
      icon: 'fa-money-bill-wave',
      aiHint: 'large deposit on bank statements — source of funds, not borrowed',
      fields: [
        { key: 'borrowerName', label: 'Borrower name(s)', type: 'text', required: true, placeholder: 'As on the application' },
        { key: 'depositDate', label: 'Deposit date', type: 'text', required: true, placeholder: 'e.g. March 12, 2026' },
        { key: 'amount', label: 'Amount', type: 'text', required: true, placeholder: 'e.g. $8,500' },
        { key: 'source', label: 'Source of funds', type: 'text', required: true, placeholder: 'e.g. sold truck, tax refund, bonus' }
      ],
      build: function (d) {
        return [
          'I am writing to explain a large deposit of ' +
            val(d.amount) +
            ' posted on ' +
            val(d.depositDate) +
            ' for ' +
            val(d.borrowerName) +
            '.',
          'This deposit represents funds from ' +
            val(d.source) +
            '. These funds are not borrowed and will remain available for the transaction as required.',
          'Supporting documentation for the source of funds can be provided upon request.',
          'Please contact me if you need any additional information regarding this deposit.'
        ].join('\n\n');
      }
    },
    credit_inquiry: {
      id: 'credit_inquiry',
      label: 'Credit Inquiry',
      blurb: 'Hard inquiries that did not create new debt.',
      icon: 'fa-search-dollar',
      aiHint: 'credit inquiry explanation — typically no new debt unless user says otherwise',
      fields: [
        { key: 'borrowerName', label: 'Borrower name(s)', type: 'text', required: true },
        { key: 'inquiryDate', label: 'Inquiry date(s)', type: 'text', required: true, placeholder: 'e.g. February 2026' },
        { key: 'creditor', label: 'Who pulled credit', type: 'text', required: true, placeholder: 'Creditor / company' },
        { key: 'reason', label: 'Why credit was pulled', type: 'text', required: true, placeholder: 'e.g. mortgage rate shopping' }
      ],
      build: function (d) {
        return [
          'I am writing regarding credit inquiry activity for ' +
            val(d.borrowerName) +
            ' related to ' +
            val(d.creditor) +
            ' on or about ' +
            val(d.inquiryDate) +
            '.',
          'This inquiry was made because ' + val(d.reason) + '.',
          'This inquiry did not result in any new credit accounts or additional debt obligations.',
          'Please let me know if you need anything further on this inquiry.'
        ].join('\n\n');
      }
    },
    employment_gap: {
      id: 'employment_gap',
      label: 'Employment Gap',
      blurb: 'Period without employment or between jobs.',
      icon: 'fa-briefcase',
      aiHint: 'employment gap with return to stable work',
      fields: [
        { key: 'borrowerName', label: 'Borrower name(s)', type: 'text', required: true },
        { key: 'gapStart', label: 'Gap start', type: 'text', required: true, placeholder: 'e.g. June 2024' },
        { key: 'gapEnd', label: 'Gap end', type: 'text', required: true, placeholder: 'e.g. September 2024' },
        { key: 'reason', label: 'Reason (brief)', type: 'text', required: true, placeholder: 'e.g. caregiving, medical leave, job search' }
      ],
      build: function (d) {
        return [
          'I am writing to explain an employment gap for ' +
            val(d.borrowerName) +
            ' from approximately ' +
            val(d.gapStart) +
            ' through ' +
            val(d.gapEnd) +
            '.',
          'During this period, ' + val(d.reason) + '.',
          'The borrower has returned to stable employment and is able to support the proposed housing obligation.',
          'Please contact me with any questions regarding this employment history.'
        ].join('\n\n');
      }
    },
    address_history: {
      id: 'address_history',
      label: 'Address History',
      blurb: 'Residency, gaps, or multiple addresses.',
      icon: 'fa-map-marker-alt',
      aiHint: 'address / residency history clarification',
      fields: [
        { key: 'borrowerName', label: 'Borrower name(s)', type: 'text', required: true },
        { key: 'currentAddress', label: 'Current address', type: 'text', required: true },
        {
          key: 'history',
          label: 'History / what to explain',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'e.g. Lived with parents 2023–2024; credit still shows old apartment…'
        }
      ],
      build: function (d) {
        return [
          'I am writing to clarify the address / residency history for ' + val(d.borrowerName) + '.',
          'The borrower currently resides at ' + val(d.currentAddress) + '.',
          val(d.history),
          'Please advise if you need leases, utility bills, or other residency documentation.'
        ].join('\n\n');
      }
    },
    derogatory_credit: {
      id: 'derogatory_credit',
      label: 'Derogatory / Lates',
      blurb: 'Lates, collections, or other credit issues.',
      icon: 'fa-exclamation-circle',
      aiHint: 'derogatory credit or late payment with recovery',
      fields: [
        { key: 'borrowerName', label: 'Borrower name(s)', type: 'text', required: true },
        { key: 'what', label: 'What & when', type: 'text', required: true, placeholder: 'e.g. 30-day late auto loan, March 2023' },
        {
          key: 'story',
          label: 'Cause + how resolved',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'Brief: what happened and current status'
        }
      ],
      build: function (d) {
        return [
          'I am writing on behalf of ' +
            val(d.borrowerName) +
            ' to explain the following credit item: ' +
            val(d.what) +
            '.',
          val(d.story),
          'The borrower has taken steps to re-establish a stable payment history and is committed to maintaining timely payments going forward.',
          'Please let me know if you need supporting documentation for this explanation.'
        ].join('\n\n');
      }
    },
    gift_funds: {
      id: 'gift_funds',
      label: 'Gift Funds',
      blurb: 'Gift for down payment or closing costs.',
      icon: 'fa-gift',
      aiHint: 'gift funds — not a loan, donor relationship, purpose',
      fields: [
        { key: 'borrowerName', label: 'Borrower name(s)', type: 'text', required: true },
        { key: 'donorName', label: 'Donor name', type: 'text', required: true },
        { key: 'relationship', label: 'Relationship', type: 'text', required: true, placeholder: 'e.g. parent' },
        { key: 'amount', label: 'Gift amount', type: 'text', required: true, placeholder: 'e.g. $15,000' }
      ],
      build: function (d) {
        return [
          'I am writing to explain gift funds for ' +
            val(d.borrowerName) +
            ' in the amount of ' +
            val(d.amount) +
            '.',
          'These funds are a gift from ' +
            val(d.donorName) +
            ', who is the borrower\'s ' +
            val(d.relationship) +
            '. The gift is intended for down payment and/or closing costs.',
          'The donor is not expecting repayment, and these funds are not a loan. A gift letter and supporting bank documentation can be provided as required.',
          'Please contact me if you need anything further regarding these gift funds.'
        ].join('\n\n');
      }
    },
    high_utilization: {
      id: 'high_utilization',
      label: 'High Utilization',
      blurb: 'Elevated revolving balances.',
      icon: 'fa-credit-card',
      aiHint: 'high revolving credit utilization with payoff/plan',
      fields: [
        { key: 'borrowerName', label: 'Borrower name(s)', type: 'text', required: true },
        {
          key: 'story',
          label: 'Why high + what\'s been done',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'e.g. Temporary balances for home repairs; paid down $4k last month…'
        }
      ],
      build: function (d) {
        return [
          'I am writing to address elevated revolving credit utilization for ' + val(d.borrowerName) + '.',
          val(d.story),
          'The borrower understands the importance of managing revolving balances and is committed to keeping utilization at a sustainable level.',
          'Please advise if you need statements or other documentation to support this explanation.'
        ].join('\n\n');
      }
    },
    name_variation: {
      id: 'name_variation',
      label: 'Name / AKA',
      blurb: 'Maiden names, spellings, or AKA on credit.',
      icon: 'fa-id-card',
      aiHint: 'name variation / AKA — same person identity',
      fields: [
        { key: 'borrowerName', label: 'Legal name (application)', type: 'text', required: true },
        { key: 'otherNames', label: 'Other names on file', type: 'text', required: true, placeholder: 'List AKA / prior names' },
        { key: 'reason', label: 'Why they differ', type: 'text', required: true, placeholder: 'e.g. marriage, hyphenation' }
      ],
      build: function (d) {
        return [
          'I am writing to clarify name variations for the borrower whose legal name on the loan application is ' +
            val(d.borrowerName) +
            '.',
          'Credit or file documents may also show: ' + val(d.otherNames) + '.',
          'These variations exist because ' + val(d.reason) + '.',
          'All of these names refer to one and the same individual. Government ID can be provided as needed.'
        ].join('\n\n');
      }
    },
    custom: {
      id: 'custom',
      label: 'Custom / Other',
      blurb: 'Describe any situation in plain English — AI drafts the letter.',
      icon: 'fa-pen-fancy',
      featured: true,
      aiHint: 'custom letter of explanation for mortgage underwriting',
      fields: [
        { key: 'borrowerName', label: 'Borrower name(s)', type: 'text', required: false, placeholder: 'Optional but recommended' },
        {
          key: 'description',
          label: 'Describe the situation',
          type: 'textarea',
          required: true,
          rows: 5,
          helper: 'Plain English is fine — facts only. AI will write the professional letter.',
          placeholder:
            'e.g. Borrower received a $12k inheritance in January that hit checking after the bank statements were ordered. Not a loan. We have the estate check copy…'
        }
      ],
      build: function (d) {
        return [
          d.borrowerName
            ? 'I am writing on behalf of ' + val(d.borrowerName) + ' to provide the following explanation.'
            : 'I am writing to provide the following explanation for underwriting.',
          val(d.description),
          'Supporting documentation can be provided upon request. Please contact me with any questions.'
        ].join('\n\n');
      }
    }
  };

  const SITUATION_ORDER = [
    'custom',
    'large_deposit',
    'credit_inquiry',
    'employment_gap',
    'address_history',
    'derogatory_credit',
    'gift_funds',
    'high_utilization',
    'name_variation'
  ];

  let state = {
    situationId: null,
    values: {},
    recipient: 'To Whom It May Concern',
    reLine: '',
    dateStr: '',
    draftLetter: '',
    generating: false
  };

  function val(s) {
    const t = String(s == null ? '' : s).trim();
    return t || '[to be completed]';
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (typeof window.showToast === 'function') window.showToast(msg, type || 'info');
    else console.log('[lox]', msg);
  }

  function getLoProfile() {
    let p = {};
    try {
      if (typeof window.getUserProfile === 'function') p = window.getUserProfile() || {};
      else p = JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch (e) {
      p = {};
    }
    return {
      name: String(p.name || '').trim() || 'Loan Officer',
      title: String(p.title || p.role || 'Loan Officer').trim(),
      nmls: String(p.nmls || p.nmlsNumber || '').trim(),
      phone: String(p.phone || '').trim(),
      email: String(p.email || '').trim(),
      company: String(p.company || p.companyName || '').trim() || 'Ruoff Mortgage',
      location: String(p.location || p.market || '').trim()
    };
  }

  function todayLong() {
    try {
      return new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      if (raw && typeof raw === 'object') {
        state = Object.assign(state, raw, { generating: false });
      }
    } catch (e) {
      /* ignore */
    }
  }

  function saveState() {
    try {
      localStorage.setItem(
        STATE_KEY,
        JSON.stringify({
          situationId: state.situationId,
          values: state.values,
          recipient: state.recipient,
          reLine: state.reLine,
          dateStr: state.dateStr,
          draftLetter: state.draftLetter || ''
        })
      );
    } catch (e) {
      /* ignore */
    }
  }

  function currentSituation() {
    return state.situationId ? SITUATIONS[state.situationId] : null;
  }

  function requiredMissing(sit) {
    if (!sit) return ['situation'];
    const miss = [];
    (sit.fields || []).forEach(function (f) {
      if (!f.required) return;
      if (!String((state.values && state.values[f.key]) || '').trim()) miss.push(f.label);
    });
    return miss;
  }

  function signatureBlock(lo) {
    return [lo.name, lo.title, lo.company, lo.nmls ? 'NMLS ' + lo.nmls : '', lo.phone || '', lo.email || '']
      .filter(Boolean)
      .join('\n');
  }

  function wrapLetter(body, sit) {
    const lo = getLoProfile();
    const d = state.values || {};
    const dateStr = state.dateStr || todayLong();
    const recipient = state.recipient || 'To Whom It May Concern';
    const reDefault =
      'Letter of Explanation — ' +
      (sit ? sit.label : 'Explanation') +
      (d.borrowerName ? ' — ' + d.borrowerName : '');
    const re = state.reLine || reDefault;
    const cleaned = String(body || '')
      .replace(/\r\n/g, '\n')
      .trim();
    return (
      dateStr +
      '\n\n' +
      recipient +
      ':\n\n' +
      'Re: ' +
      re +
      '\n\n' +
      cleaned +
      '\n\n' +
      'Sincerely,\n\n' +
      signatureBlock(lo)
    );
  }

  function templateBody(sit) {
    if (!sit || typeof sit.build !== 'function') return '';
    return sit.build(state.values || {}, getLoProfile());
  }

  /** Prefer AI draft; else template fallback. */
  function buildFullLetter() {
    if (state.draftLetter && String(state.draftLetter).trim()) {
      return String(state.draftLetter).trim();
    }
    const sit = currentSituation();
    if (!sit) return '';
    return wrapLetter(templateBody(sit), sit);
  }

  function factsBlock(sit) {
    const lines = [];
    lines.push('Situation type: ' + (sit ? sit.label : 'Custom'));
    if (sit && sit.aiHint) lines.push('Focus: ' + sit.aiHint);
    (sit.fields || []).forEach(function (f) {
      const v = String((state.values && state.values[f.key]) || '').trim();
      if (v) lines.push(f.label + ': ' + v);
    });
    return lines.join('\n');
  }

  function stripCodeFences(text) {
    let t = String(text || '').trim();
    if (t.indexOf('```') === 0) {
      t = t.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
    }
    return t.trim();
  }

  function extractLetterOnly(raw) {
    let t = stripCodeFences(raw);
    // Drop leading assistant chatter if model adds it
    const markers = [/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i, /^\d{1,2}\//];
    for (let i = 0; i < markers.length; i++) {
      const m = t.search(markers[i]);
      if (m > 0 && m < 200) {
        t = t.slice(m);
        break;
      }
    }
    return t.trim();
  }

  async function callAi(messages, opts) {
    opts = opts || {};
    if (typeof window.callGrokAPI !== 'function') {
      throw new Error('AI not available — start the proxy or try again.');
    }
    const text = await window.callGrokAPI(null, {
      messages: messages,
      temperature: opts.temperature != null ? opts.temperature : 0.45,
      max_tokens: opts.max_tokens || 1400,
      skipKeyPrompt: false
    });
    return extractLetterOnly(text);
  }

  function systemPromptBase() {
    return (
      'You are an experienced mortgage loan officer writing Letters of Explanation (LOX/LOE) for residential underwriting.\n' +
      'Write clear, confident, human professional letters — not robotic templates.\n' +
      'Rules:\n' +
      '- Business letter format with date, recipient greeting, Re: line, body paragraphs, Sincerely, and LO signature block.\n' +
      '- Use ONLY the facts provided. Do not invent account numbers, dates, employers, or dollar amounts.\n' +
      '- If a detail is missing, use natural language that does not fabricate (or omit that detail).\n' +
      '- Do not claim funds are "seasoned" unless stated. Do not overpromise.\n' +
      '- 3–5 short body paragraphs max. No bullet lists unless the user provided a list.\n' +
      '- Output ONLY the letter text. No markdown, no preamble, no quotes around the letter.'
    );
  }

  async function generateDraft() {
    const sit = currentSituation();
    if (!sit) {
      toast('Select a situation first', 'error');
      return;
    }
    const miss = requiredMissing(sit);
    if (miss.length) {
      toast('Need: ' + miss.join(', '), 'error');
      return;
    }

    state.generating = true;
    updateGeneratingUi(true);
    const lo = getLoProfile();
    const dateStr = state.dateStr || todayLong();
    const recipient = state.recipient || 'To Whom It May Concern';
    const d = state.values || {};
    const reDefault =
      'Letter of Explanation — ' + sit.label + (d.borrowerName ? ' — ' + d.borrowerName : '');
    const re = state.reLine || reDefault;

    const userPrompt =
      'Write a complete Letter of Explanation for mortgage underwriting.\n\n' +
      'Letter metadata:\n' +
      '- Date line: ' +
      dateStr +
      '\n- Recipient: ' +
      recipient +
      '\n- Re: ' +
      re +
      '\n\n' +
      'Loan officer signature (use exactly):\n' +
      signatureBlock(lo) +
      '\n\n' +
      'Facts from the LO:\n' +
      factsBlock(sit) +
      '\n\n' +
      (sit.id === 'custom'
        ? 'This is a free-form situation. Turn the description into a polished LOE body while keeping every stated fact.'
        : 'Expand the minimal facts into a natural, underwriter-ready letter. Do not invent extra drama.');

    try {
      const letter = await callAi(
        [
          { role: 'system', content: systemPromptBase() },
          { role: 'user', content: userPrompt }
        ],
        { temperature: 0.5, max_tokens: 1200 }
      );
      if (!letter || letter.length < 40) throw new Error('Empty AI response');
      state.draftLetter = letter;
      saveState();
      refreshPreviewOnly();
      setImproveEnabled(true);
      toast('Draft ready — review, then download');
    } catch (e) {
      console.warn('[lox] AI generate failed, using template', e);
      state.draftLetter = wrapLetter(templateBody(sit), sit);
      saveState();
      refreshPreviewOnly();
      setImproveEnabled(true);
      toast(
        e && e.message && /API|proxy|key|AI/i.test(e.message)
          ? 'AI unavailable — template draft used. Check proxy/API key.'
          : 'AI failed — template draft used.',
        'error'
      );
    } finally {
      state.generating = false;
      updateGeneratingUi(false);
    }
  }

  async function improveDraft(mode) {
    if (!state.draftLetter || !String(state.draftLetter).trim()) {
      toast('Generate a draft first', 'error');
      return;
    }
    const sit = currentSituation();
    state.generating = true;
    updateGeneratingUi(true);

    let instruction = '';
    if (mode === 'stronger') {
      instruction =
        'Rewrite to be clearer and more confident for underwriting. Keep all facts. Slightly stronger language without sounding aggressive.';
    } else if (mode === 'formal') {
      instruction =
        'Rewrite in a more formal, traditional underwriting tone. Keep all facts. No slang.';
    } else if (mode === 'concise') {
      instruction =
        'Rewrite more concise — tighten wording, fewer sentences, same facts and complete letter structure.';
    } else if (mode === 'regenerate') {
      instruction =
        'Regenerate a fresh version of this letter with different wording but the same facts and structure.';
    } else {
      instruction = 'Improve clarity and professionalism while keeping all facts.';
    }

    try {
      const letter = await callAi(
        [
          { role: 'system', content: systemPromptBase() },
          {
            role: 'user',
            content:
              instruction +
              '\n\nSituation: ' +
              (sit ? sit.label : 'Custom') +
              '\nFacts for reference:\n' +
              factsBlock(sit || SITUATIONS.custom) +
              '\n\nCurrent letter:\n---\n' +
              state.draftLetter +
              '\n---\n\nOutput ONLY the full revised letter.'
          }
        ],
        { temperature: mode === 'regenerate' ? 0.65 : 0.4, max_tokens: 1200 }
      );
      if (!letter || letter.length < 40) throw new Error('Empty AI response');
      state.draftLetter = letter;
      saveState();
      refreshPreviewOnly();
      toast('Letter updated');
    } catch (e) {
      console.warn('[lox] improve failed', e);
      toast((e && e.message) || 'Could not improve letter', 'error');
    } finally {
      state.generating = false;
      updateGeneratingUi(false);
    }
  }

  function slugFilePart(s) {
    return String(s || '')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, 40);
  }

  function fileBaseName() {
    const sit = currentSituation();
    const lo = getLoProfile();
    const borrower = (state.values && state.values.borrowerName) || '';
    return (
      'LOX_' +
      slugFilePart((sit && sit.label) || 'Letter') +
      (borrower ? '_' + slugFilePart(borrower.split(/\s+/)[0]) : '') +
      (lo.name ? '_' + slugFilePart(lo.name.replace(/\s+/g, '_')) : '')
    );
  }

  // ─── Minimal DOCX ──────────────────────────────────────────

  function loxEscapeXml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loxUtf8(str) {
    return new TextEncoder().encode(str);
  }

  function loxCrc32(bytes) {
    let c = ~0;
    for (let i = 0; i < bytes.length; i++) {
      c ^= bytes[i];
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return ~c >>> 0;
  }

  function loxU16(n) {
    return [n & 0xff, (n >>> 8) & 0xff];
  }
  function loxU32(n) {
    return [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
  }

  function loxZipStore(files) {
    const parts = [];
    const central = [];
    let offset = 0;
    Object.keys(files).forEach(function (name) {
      const data = typeof files[name] === 'string' ? loxUtf8(files[name]) : files[name];
      const nameBytes = loxUtf8(name);
      const crc = loxCrc32(data);
      const local = []
        .concat([0x50, 0x4b, 0x03, 0x04], loxU16(20), loxU16(0), loxU16(0), loxU16(0), loxU16(0))
        .concat(loxU32(crc), loxU32(data.length), loxU32(data.length), loxU16(nameBytes.length), loxU16(0));
      parts.push(new Uint8Array(local), nameBytes, data);
      const cen = []
        .concat([0x50, 0x4b, 0x01, 0x02], loxU16(20), loxU16(20), loxU16(0), loxU16(0), loxU16(0), loxU16(0))
        .concat(loxU32(crc), loxU32(data.length), loxU32(data.length))
        .concat(loxU16(nameBytes.length), loxU16(0), loxU16(0), loxU16(0), loxU16(0), loxU32(0), loxU32(offset));
      central.push(new Uint8Array(cen), nameBytes);
      offset += local.length + nameBytes.length + data.length;
    });
    let csize = 0;
    central.forEach(function (p) {
      csize += p.length;
    });
    const end = []
      .concat([0x50, 0x4b, 0x05, 0x06], loxU16(0), loxU16(0))
      .concat(loxU16(Object.keys(files).length), loxU16(Object.keys(files).length))
      .concat(loxU32(csize), loxU32(offset), loxU16(0));
    const all = parts.concat(central, [new Uint8Array(end)]);
    let total = 0;
    all.forEach(function (p) {
      total += p.length;
    });
    const out = new Uint8Array(total);
    let o = 0;
    all.forEach(function (p) {
      out.set(p, o);
      o += p.length;
    });
    return out;
  }

  function letterToDocxBlob(letterText) {
    const paras = String(letterText || '')
      .split(/\n/)
      .map(function (line) {
        if (!line) {
          return '<w:p><w:pPr><w:spacing w:after="0" w:line="276" w:lineRule="auto"/></w:pPr></w:p>';
        }
        return (
          '<w:p><w:pPr><w:spacing w:after="0" w:line="276" w:lineRule="auto"/></w:pPr>' +
          '<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr>' +
          '<w:t xml:space="preserve">' +
          loxEscapeXml(line) +
          '</w:t></w:r></w:p>'
        );
      })
      .join('');

    const documentXml =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:body>' +
      paras +
      '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>' +
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

    const docRels =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';

    const bytes = loxZipStore({
      '[Content_Types].xml': contentTypes,
      '_rels/.rels': rels,
      'word/document.xml': documentXml,
      'word/_rels/document.xml.rels': docRels
    });
    return new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function ensureDraftForExport() {
    const letter = buildFullLetter();
    if (!letter || !state.situationId) {
      toast('Generate a letter first', 'error');
      return null;
    }
    return letter;
  }

  function downloadDocx() {
    const letter = ensureDraftForExport();
    if (!letter) return;
    try {
      downloadBlob(letterToDocxBlob(letter), fileBaseName() + '.docx');
      toast('Word document downloaded');
    } catch (e) {
      console.error(e);
      toast('Could not build Word file', 'error');
    }
  }

  function downloadPdf() {
    const letter = ensureDraftForExport();
    if (!letter) return;
    const html =
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' +
      escapeHtml(fileBaseName()) +
      '</title><style>' +
      'body{font-family:"Times New Roman",Times,serif;font-size:12pt;line-height:1.35;color:#111;max-width:6.5in;margin:0.75in auto;white-space:pre-wrap}' +
      '@media print{body{margin:0.75in}}' +
      '</style></head><body>' +
      escapeHtml(letter) +
      '</body></html>';
    const w = window.open('', '_blank', 'noopener,width=800,height=900');
    if (!w) {
      toast('Allow pop-ups to download PDF (Print → Save as PDF)', 'error');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(function () {
      try {
        w.focus();
        w.print();
      } catch (e) {
        /* ignore */
      }
    }, 300);
    toast('Use Print → Save as PDF in the print dialog');
  }

  function copyLetter() {
    const letter = buildFullLetter();
    if (!letter) {
      toast('Nothing to copy yet', 'error');
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(letter).then(
        function () {
          toast('Letter copied');
        },
        function () {
          fallbackCopy(letter);
        }
      );
    } else fallbackCopy(letter);
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      toast('Letter copied');
    } catch (e) {
      toast('Copy failed', 'error');
    }
    ta.remove();
  }

  function saveToVault() {
    const letter = ensureDraftForExport();
    if (!letter) return;
    if (typeof window.toggleSaveIdea !== 'function') {
      toast('Saved Items not ready', 'error');
      return;
    }
    const sit = currentSituation();
    const title =
      'LOX: ' +
      (sit ? sit.label : 'Letter') +
      (state.values.borrowerName ? ' — ' + state.values.borrowerName : '') +
      ' · ' +
      new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    window.toggleSaveIdea(title, letter, null, 'lox');
    toast('Saved to My Saved Items');
  }

  // ─── UI ────────────────────────────────────────────────────

  function root() {
    return document.getElementById('lox-root');
  }

  function render() {
    const el = root();
    if (!el) return;
    const sit = currentSituation();
    el.innerHTML =
      '<div class="lox-shell">' +
      renderHero() +
      (sit ? renderWorkspace(sit) : renderPicker()) +
      '</div>';
    bindUi();
  }

  function renderHero() {
    return (
      '<header class="lox-hero">' +
      '<span class="lox-kicker">UNDERWRITING SUPPORT · AI DRAFT</span>' +
      '<h2 class="lox-title">Letter of Explanation</h2>' +
      '<p class="lox-lead">Pick a situation (or Custom), enter a few facts, generate a professional LOX — usually under a minute.</p>' +
      '</header>'
    );
  }

  function renderPicker() {
    const cards = SITUATION_ORDER.map(function (id) {
      const s = SITUATIONS[id];
      const feat = s.featured ? ' lox-sit-card--featured' : '';
      return (
        '<button type="button" class="lox-sit-card' +
        feat +
        '" data-pick-sit="' +
        s.id +
        '">' +
        '<span class="lox-sit-icon"><i class="fas ' +
        s.icon +
        '"></i></span>' +
        '<strong>' +
        escapeHtml(s.label) +
        '</strong>' +
        '<span class="lox-sit-blurb">' +
        escapeHtml(s.blurb) +
        '</span></button>'
      );
    }).join('');
    return (
      '<div class="lox-picker">' +
      '<h3 class="lox-section-title">1. Select the situation</h3>' +
      '<div class="lox-sit-grid">' +
      cards +
      '</div></div>'
    );
  }

  function renderWorkspace(sit) {
    const lo = getLoProfile();
    const isCustom = sit.id === 'custom';
    const fields = sit.fields
      .map(function (f) {
        const v = state.values[f.key] != null ? state.values[f.key] : '';
        let control = '';
        if (f.type === 'textarea') {
          control =
            '<textarea class="lox-input" rows="' +
            (f.rows || 3) +
            '" data-field="' +
            f.key +
            '" placeholder="' +
            escapeHtml(f.placeholder || '') +
            '">' +
            escapeHtml(v) +
            '</textarea>';
        } else {
          control =
            '<input type="text" class="lox-input" data-field="' +
            f.key +
            '" value="' +
            escapeHtml(v) +
            '" placeholder="' +
            escapeHtml(f.placeholder || '') +
            '">';
        }
        return (
          '<div class="lox-field">' +
          '<label class="lox-label">' +
          escapeHtml(f.label) +
          (f.required ? ' <span class="lox-req">*</span>' : '') +
          '</label>' +
          (f.helper ? '<p class="lox-helper">' + escapeHtml(f.helper) + '</p>' : '') +
          control +
          '</div>'
        );
      })
      .join('');

    const letter = buildFullLetter();
    const hasDraft = !!(state.draftLetter && String(state.draftLetter).trim());
    const previewHtml = hasDraft
      ? escapeHtml(letter).replace(/\n/g, '<br>')
      : '<span class="lox-preview-empty">' +
        (isCustom
          ? 'Describe the situation, then hit Generate with AI.'
          : 'Enter the few required details, then Generate with AI.') +
        '</span>';

    return (
      '<div class="lox-workspace">' +
      '<div class="lox-toolbar">' +
      '<button type="button" class="lox-btn lox-btn-ghost" data-lox-back><i class="fas fa-arrow-left"></i> All situations</button>' +
      '<span class="lox-current-sit"><i class="fas ' +
      sit.icon +
      '"></i> ' +
      escapeHtml(sit.label) +
      '</span></div>' +
      '<div class="lox-grid">' +
      '<div class="lox-form-col">' +
      '<h3 class="lox-section-title">2. Quick details</h3>' +
      '<div class="lox-lo-chip">Signature from profile: <strong>' +
      escapeHtml(lo.name) +
      '</strong>' +
      (lo.nmls ? ' · NMLS ' + escapeHtml(lo.nmls) : '') +
      ' · ' +
      escapeHtml(lo.company) +
      '</div>' +
      '<div class="lox-field lox-field-inline">' +
      '<label class="lox-label">Letter date</label>' +
      '<input type="text" class="lox-input" data-meta="dateStr" value="' +
      escapeHtml(state.dateStr || todayLong()) +
      '">' +
      '</div>' +
      fields +
      '<details class="lox-advanced">' +
      '<summary>Optional: recipient &amp; Re: line</summary>' +
      '<div class="lox-field">' +
      '<label class="lox-label">Recipient</label>' +
      '<input type="text" class="lox-input" data-meta="recipient" value="' +
      escapeHtml(state.recipient || 'To Whom It May Concern') +
      '">' +
      '</div>' +
      '<div class="lox-field">' +
      '<label class="lox-label">Re: line</label>' +
      '<input type="text" class="lox-input" data-meta="reLine" value="' +
      escapeHtml(state.reLine || '') +
      '" placeholder="Auto from situation + borrower">' +
      '</div></details>' +
      '<button type="button" class="lox-btn lox-btn-primary lox-btn-generate" data-lox-generate id="lox-generate-btn">' +
      '<i class="fas fa-wand-magic-sparkles"></i> ' +
      (hasDraft ? 'Regenerate with AI' : 'Generate with AI') +
      '</button>' +
      '<p class="lox-hint">AI writes the full letter from your facts. Offline fallback uses a solid template if AI is down.</p>' +
      '</div>' +
      '<div class="lox-preview-col">' +
      '<h3 class="lox-section-title">3. Preview</h3>' +
      '<div class="lox-improve" id="lox-improve"' +
      (hasDraft ? '' : ' hidden') +
      '>' +
      '<span class="lox-improve-label">Polish</span>' +
      '<button type="button" class="lox-btn lox-btn-ghost lox-btn-sm" data-lox-improve="stronger">Make stronger</button>' +
      '<button type="button" class="lox-btn lox-btn-ghost lox-btn-sm" data-lox-improve="formal">More formal</button>' +
      '<button type="button" class="lox-btn lox-btn-ghost lox-btn-sm" data-lox-improve="concise">More concise</button>' +
      '<button type="button" class="lox-btn lox-btn-ghost lox-btn-sm" data-lox-improve="regenerate">Regenerate</button>' +
      '</div>' +
      '<div class="lox-preview" id="lox-preview">' +
      previewHtml +
      '</div>' +
      '<div class="lox-actions">' +
      '<button type="button" class="lox-btn lox-btn-primary" data-lox-docx><i class="fas fa-file-word"></i> Word</button>' +
      '<button type="button" class="lox-btn lox-btn-primary lox-btn-navy" data-lox-pdf><i class="fas fa-file-pdf"></i> PDF</button>' +
      '<button type="button" class="lox-btn lox-btn-ghost" data-lox-copy><i class="fas fa-copy"></i> Copy</button>' +
      '<button type="button" class="lox-btn lox-btn-ghost" data-lox-vault><i class="far fa-bookmark"></i> Save</button>' +
      '</div>' +
      '<p class="lox-hint">PDF: Print → Save as PDF. Word file is fully editable.</p>' +
      '</div></div></div>'
    );
  }

  function refreshPreviewOnly() {
    const box = document.getElementById('lox-preview');
    if (!box) return;
    const letter = buildFullLetter();
    const hasDraft = !!(state.draftLetter && String(state.draftLetter).trim());
    if (hasDraft && letter) {
      box.innerHTML = escapeHtml(letter).replace(/\n/g, '<br>');
    } else {
      box.innerHTML =
        '<span class="lox-preview-empty">Enter details, then Generate with AI.</span>';
    }
    setImproveEnabled(hasDraft);
    const genBtn = document.getElementById('lox-generate-btn');
    if (genBtn && !state.generating) {
      genBtn.innerHTML =
        '<i class="fas fa-wand-magic-sparkles"></i> ' +
        (hasDraft ? 'Regenerate with AI' : 'Generate with AI');
    }
  }

  function setImproveEnabled(on) {
    const bar = document.getElementById('lox-improve');
    if (!bar) return;
    if (on) bar.removeAttribute('hidden');
    else bar.setAttribute('hidden', '');
  }

  function updateGeneratingUi(on) {
    const btn = document.getElementById('lox-generate-btn');
    if (btn) {
      btn.disabled = !!on;
      if (on) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Drafting…';
      } else {
        const hasDraft = !!(state.draftLetter && String(state.draftLetter).trim());
        btn.innerHTML =
          '<i class="fas fa-wand-magic-sparkles"></i> ' +
          (hasDraft ? 'Regenerate with AI' : 'Generate with AI');
      }
    }
    document.querySelectorAll('[data-lox-improve]').forEach(function (b) {
      b.disabled = !!on;
    });
    const box = document.getElementById('lox-preview');
    if (box && on) {
      box.classList.add('lox-preview--busy');
    } else if (box) {
      box.classList.remove('lox-preview--busy');
    }
  }

  function bindUi() {
    const el = root();
    if (!el) return;

    el.querySelectorAll('[data-pick-sit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.situationId = btn.getAttribute('data-pick-sit');
        state.values = {};
        state.draftLetter = '';
        if (!state.dateStr) state.dateStr = todayLong();
        if (!state.recipient) state.recipient = 'To Whom It May Concern';
        saveState();
        render();
      });
    });

    el.querySelectorAll('[data-lox-back]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.situationId = null;
        saveState();
        render();
      });
    });

    el.querySelectorAll('[data-field]').forEach(function (input) {
      const key = input.getAttribute('data-field');
      const handler = function () {
        state.values[key] = input.value;
        // Changing facts invalidates AI draft so user re-generates intentionally
        // Keep draft until they click regenerate — less jarring
        saveState();
      };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });

    el.querySelectorAll('[data-meta]').forEach(function (input) {
      const key = input.getAttribute('data-meta');
      const handler = function () {
        state[key] = input.value;
        saveState();
      };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });

    el.querySelectorAll('[data-lox-generate]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        generateDraft();
      });
    });

    el.querySelectorAll('[data-lox-improve]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        improveDraft(btn.getAttribute('data-lox-improve'));
      });
    });

    el.querySelectorAll('[data-lox-docx]').forEach(function (btn) {
      btn.addEventListener('click', downloadDocx);
    });
    el.querySelectorAll('[data-lox-pdf]').forEach(function (btn) {
      btn.addEventListener('click', downloadPdf);
    });
    el.querySelectorAll('[data-lox-copy]').forEach(function (btn) {
      btn.addEventListener('click', copyLetter);
    });
    el.querySelectorAll('[data-lox-vault]').forEach(function (btn) {
      btn.addEventListener('click', saveToVault);
    });
  }

  function ensureMounted() {
    const el = root();
    if (!el) return;
    if (!el.querySelector('.lox-shell') || el.querySelector('.lox-picker.hidden, .lox-workspace.hidden')) {
      render();
      return;
    }
    el.querySelectorAll('.hidden').forEach(function (node) {
      if (node.id === 'letter-of-explanation') return;
      if (
        node.classList.contains('lox-picker') ||
        node.classList.contains('lox-workspace') ||
        node.classList.contains('lox-shell')
      ) {
        node.classList.remove('hidden');
      }
    });
  }

  function init() {
    if (!document.getElementById('letter-of-explanation')) return;
    loadState();
    if (!state.dateStr) state.dateStr = todayLong();
    // Drop unknown situation ids from older drafts
    if (state.situationId && !SITUATIONS[state.situationId]) {
      state.situationId = null;
      state.draftLetter = '';
    }
    render();

    if (!window.__loxSectionHooked) {
      window.__loxSectionHooked = true;
      const prevHook = window.onCoachSectionShown;
      window.onCoachSectionShown = function (id) {
        if (typeof prevHook === 'function') {
          try {
            prevHook(id);
          } catch (e) {
            /* ignore */
          }
        }
        if (id === 'letter-of-explanation') ensureMounted();
      };
    }

    if ((location.hash || '').replace(/^#/, '') === 'letter-of-explanation') {
      ensureMounted();
    }

    console.log('%c[lox-generator] LOX AI draft ready', 'color:#00A89D');
  }

  window.openLoxGenerator = function (situationId) {
    if (situationId && SITUATIONS[situationId]) {
      state.situationId = situationId;
      saveState();
    }
    if (typeof window.showSection === 'function') window.showSection('letter-of-explanation');
    render();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('coach-features-loaded', function () {
    if (!document.getElementById('letter-of-explanation')) return;
    if (!document.querySelector('#lox-root .lox-shell')) init();
    else if ((location.hash || '').replace(/^#/, '') === 'letter-of-explanation') ensureMounted();
  });
})();
