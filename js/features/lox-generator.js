/**
 * js/features/lox-generator.js
 * Letter of Explanation (LOX / LOE) Generator — LO Sales Coach
 */
(function () {
  'use strict';

  const STATE_KEY = 'loLoxDraft_v1';

  /** @type {Record<string, { id: string, label: string, blurb: string, icon: string, fields: Array, build: Function }>} */
  const SITUATIONS = {
    large_deposit: {
      id: 'large_deposit',
      label: 'Large Deposit',
      blurb: 'Explain a deposit above typical payroll that underwriting flagged.',
      icon: 'fa-money-bill-wave',
      fields: [
        { key: 'borrowerName', label: 'Borrower name(s)', type: 'text', required: true, helper: 'As shown on the application' },
        { key: 'depositDate', label: 'Deposit date', type: 'text', required: true, placeholder: 'e.g. March 12, 2026' },
        { key: 'amount', label: 'Deposit amount', type: 'text', required: true, placeholder: 'e.g. $8,500' },
        { key: 'account', label: 'Account (bank / last 4)', type: 'text', required: false, placeholder: 'e.g. Chase checking …1234' },
        { key: 'source', label: 'Source of funds', type: 'text', required: true, helper: 'Where the money came from', placeholder: 'e.g. sale of vehicle, tax refund, bonus' },
        { key: 'details', label: 'Additional details', type: 'textarea', required: false, helper: 'Any proof you will attach (bill of sale, award letter, etc.)' }
      ],
      build: function (d, lo) {
        return [
          para(
            'I am writing to explain a large deposit of ' +
              val(d.amount) +
              ' posted on ' +
              val(d.depositDate) +
              (d.account ? ' to the ' + val(d.account) + ' account' : '') +
              ' for ' +
              val(d.borrowerName) +
              '.'
          ),
          para(
            'This deposit represents funds from ' +
              val(d.source) +
              '. These funds are not borrowed and will remain available for the transaction as required.'
          ),
          d.details
            ? para(val(d.details))
            : para(
                'Supporting documentation for the source of funds is available upon request and can be provided with this letter.'
              ),
          para(
            'Please contact me if you need any additional information regarding this deposit.'
          )
        ].join('\n\n');
      }
    },
    credit_inquiry: {
      id: 'credit_inquiry',
      label: 'Credit Inquiry',
      blurb: 'Clarify recent hard inquiries that did not result in new debt.',
      icon: 'fa-search-dollar',
      fields: [
        { key: 'borrowerName', label: 'Borrower name(s)', type: 'text', required: true },
        { key: 'inquiryDate', label: 'Inquiry date(s)', type: 'text', required: true, placeholder: 'e.g. February 2026' },
        { key: 'creditor', label: 'Creditor / company that pulled credit', type: 'text', required: true },
        { key: 'reason', label: 'Why credit was pulled', type: 'text', required: true, placeholder: 'e.g. rate shopping for this mortgage, auto quote only' },
        { key: 'newDebt', label: 'Did it result in new debt?', type: 'select', required: true, options: ['No new accounts or debt', 'Yes — explain in details'] },
        { key: 'details', label: 'Additional details', type: 'textarea', required: false }
      ],
      build: function (d) {
        const noDebt = String(d.newDebt || '').toLowerCase().indexOf('no new') === 0;
        return [
          para(
            'I am writing regarding credit inquiry activity for ' +
              val(d.borrowerName) +
              ' related to ' +
              val(d.creditor) +
              ' on or about ' +
              val(d.inquiryDate) +
              '.'
          ),
          para(
            'This inquiry was made because ' +
              val(d.reason) +
              '.'
          ),
          para(
            noDebt
              ? 'This inquiry did not result in any new credit accounts or additional debt obligations. The borrower has not opened new revolving or installment accounts as a result of this inquiry.'
              : 'Regarding new debt related to this inquiry: ' +
                val(d.details || 'please see the notes provided with this file.')
          ),
          d.details && noDebt ? para(val(d.details)) : '',
          para('Please let me know if you need anything further on this inquiry.')
        ]
          .filter(Boolean)
          .join('\n\n');
      }
    },
    employment_gap: {
      id: 'employment_gap',
      label: 'Employment Gap',
      blurb: 'Explain a period without employment or between jobs.',
      icon: 'fa-briefcase',
      fields: [
        { key: 'borrowerName', label: 'Borrower name(s)', type: 'text', required: true },
        { key: 'gapStart', label: 'Gap start', type: 'text', required: true, placeholder: 'e.g. June 2024' },
        { key: 'gapEnd', label: 'Gap end / return to work', type: 'text', required: true, placeholder: 'e.g. September 2024' },
        { key: 'reason', label: 'Reason for the gap', type: 'textarea', required: true, placeholder: 'e.g. caregiving, medical leave, education, job search' },
        { key: 'currentEmployer', label: 'Current employer', type: 'text', required: false },
        { key: 'stability', label: 'Current employment stability', type: 'textarea', required: false, helper: 'How long in current role / hours / status' }
      ],
      build: function (d) {
        return [
          para(
            'I am writing to explain an employment gap for ' +
              val(d.borrowerName) +
              ' from approximately ' +
              val(d.gapStart) +
              ' through ' +
              val(d.gapEnd) +
              '.'
          ),
          para('During this period, ' + val(d.reason) + '.'),
          d.currentEmployer
            ? para(
                'The borrower is currently employed with ' +
                  val(d.currentEmployer) +
                  (d.stability ? '. ' + val(d.stability) : '.')
              )
            : d.stability
              ? para(val(d.stability))
              : para(
                  'The borrower has returned to stable employment and is able to support the proposed housing obligation.'
                ),
          para('Please contact me with any questions regarding this employment history.')
        ].join('\n\n');
      }
    },
    address_history: {
      id: 'address_history',
      label: 'Address History / Residency',
      blurb: 'Clarify residency, gaps, or multiple addresses on credit or application.',
      icon: 'fa-map-marker-alt',
      fields: [
        { key: 'borrowerName', label: 'Borrower name(s)', type: 'text', required: true },
        { key: 'addressList', label: 'Address history (most recent first)', type: 'textarea', required: true, helper: 'Street, city, state, dates at each address', placeholder: '123 Main St, Fort Wayne, IN — Jan 2022–Present\n…' },
        { key: 'reason', label: 'Why addresses differ / need explanation', type: 'textarea', required: true, placeholder: 'e.g. temporary stay with family, military, credit report lag' },
        { key: 'currentAddress', label: 'Current primary residence', type: 'text', required: true }
      ],
      build: function (d) {
        return [
          para(
            'I am writing to clarify the address / residency history for ' +
              val(d.borrowerName) +
              '.'
          ),
          para(
            'The borrower currently resides at ' +
              val(d.currentAddress) +
              '. Relevant address history is as follows:'
          ),
          para(val(d.addressList)),
          para(
            'The reason additional explanation is needed: ' +
              val(d.reason) +
              '.'
          ),
          para(
            'The addresses listed are accurate to the best of the borrower\'s knowledge. Please advise if you need leases, utility bills, or other residency documentation.'
          )
        ].join('\n\n');
      }
    },
    derogatory_credit: {
      id: 'derogatory_credit',
      label: 'Derogatory Credit / Late Payments',
      blurb: 'Explain lates, collections, or other derogatory items with a recovery story.',
      icon: 'fa-exclamation-circle',
      fields: [
        { key: 'borrowerName', label: 'Borrower name(s)', type: 'text', required: true },
        { key: 'itemType', label: 'What needs explanation', type: 'text', required: true, placeholder: 'e.g. 30-day late on auto loan, medical collection' },
        { key: 'when', label: 'When it occurred', type: 'text', required: true },
        { key: 'cause', label: 'What caused it', type: 'textarea', required: true },
        { key: 'resolution', label: 'How it was resolved / current status', type: 'textarea', required: true },
        { key: 'reestablished', label: 'How credit was re-established', type: 'textarea', required: false }
      ],
      build: function (d) {
        return [
          para(
            'I am writing on behalf of ' +
              val(d.borrowerName) +
              ' to explain the following credit item: ' +
              val(d.itemType) +
              ', which occurred around ' +
              val(d.when) +
              '.'
          ),
          para('At that time, ' + val(d.cause) + '.'),
          para('Since then, ' + val(d.resolution) + '.'),
          d.reestablished
            ? para(val(d.reestablished))
            : para(
                'The borrower has taken steps to re-establish a stable payment history and is committed to maintaining timely payments going forward.'
              ),
          para('Please let me know if you need supporting documentation for this explanation.')
        ].join('\n\n');
      }
    },
    gift_funds: {
      id: 'gift_funds',
      label: 'Gift Funds',
      blurb: 'Document gift money for down payment or closing costs.',
      icon: 'fa-gift',
      fields: [
        { key: 'borrowerName', label: 'Borrower name(s)', type: 'text', required: true },
        { key: 'donorName', label: 'Donor name', type: 'text', required: true },
        { key: 'relationship', label: 'Relationship to borrower', type: 'text', required: true, placeholder: 'e.g. parent, grandparent' },
        { key: 'amount', label: 'Gift amount', type: 'text', required: true },
        { key: 'transferDate', label: 'Transfer / receipt date', type: 'text', required: false },
        { key: 'purpose', label: 'Purpose of gift', type: 'select', required: true, options: ['Down payment', 'Closing costs', 'Down payment and closing costs', 'Other'] },
        { key: 'details', label: 'Additional notes', type: 'textarea', required: false, helper: 'Gift letter and bank trail will be provided separately if required' }
      ],
      build: function (d) {
        return [
          para(
            'I am writing to explain gift funds for ' +
              val(d.borrowerName) +
              ' in the amount of ' +
              val(d.amount) +
              '.'
          ),
          para(
            'These funds are a gift from ' +
              val(d.donorName) +
              ', who is the borrower\'s ' +
              val(d.relationship) +
              '. The gift is intended for ' +
              val(d.purpose).toLowerCase() +
              (d.transferDate ? ' and was transferred on or about ' + val(d.transferDate) : '') +
              '.'
          ),
          para(
            'The donor is not expecting repayment, and these funds are not a loan. A gift letter and supporting bank documentation can be provided as required by the loan program.'
          ),
          d.details ? para(val(d.details)) : '',
          para('Please contact me if you need anything further regarding these gift funds.')
        ]
          .filter(Boolean)
          .join('\n\n');
      }
    },
    high_utilization: {
      id: 'high_utilization',
      label: 'High Credit Utilization',
      blurb: 'Explain elevated revolving balances and the plan to manage them.',
      icon: 'fa-credit-card',
      fields: [
        { key: 'borrowerName', label: 'Borrower name(s)', type: 'text', required: true },
        { key: 'situation', label: 'Why utilization was high', type: 'textarea', required: true },
        { key: 'actions', label: 'What has been done / will be done', type: 'textarea', required: true, placeholder: 'e.g. paid down cards, closed account after payoff, budget plan' },
        { key: 'currentStatus', label: 'Current status', type: 'text', required: false }
      ],
      build: function (d) {
        return [
          para(
            'I am writing to address elevated revolving credit utilization for ' +
              val(d.borrowerName) +
              '.'
          ),
          para(val(d.situation)),
          para(
            'To improve this profile, ' +
              val(d.actions) +
              '.'
          ),
          d.currentStatus
            ? para('Current status: ' + val(d.currentStatus) + '.')
            : para(
                'The borrower understands the importance of managing revolving balances and is committed to keeping utilization at a sustainable level.'
              ),
          para('Please advise if you need statements or other documentation to support this explanation.')
        ].join('\n\n');
      }
    },
    name_variation: {
      id: 'name_variation',
      label: 'Name Variation / AKA',
      blurb: 'Explain different name spellings, maiden names, or AKA on credit.',
      icon: 'fa-id-card',
      fields: [
        { key: 'borrowerName', label: 'Legal name (application)', type: 'text', required: true },
        { key: 'otherNames', label: 'Other names / AKA on file', type: 'textarea', required: true, placeholder: 'List each variation' },
        { key: 'reason', label: 'Why names differ', type: 'textarea', required: true, placeholder: 'e.g. marriage, hyphenation, prior legal name, typo on account' },
        { key: 'samePerson', label: 'Confirmation', type: 'select', required: true, options: ['All names refer to the same person', 'See details'] }
      ],
      build: function (d) {
        return [
          para(
            'I am writing to clarify name variations for the borrower whose legal name on the loan application is ' +
              val(d.borrowerName) +
              '.'
          ),
          para(
            'Credit or file documents may also show the following name(s): ' +
              val(d.otherNames) +
              '.'
          ),
          para('These variations exist because ' + val(d.reason) + '.'),
          para(
            String(d.samePerson || '').indexOf('same person') >= 0
              ? 'All of these names refer to one and the same individual. There is no identity concern; this is solely a name variation matter.'
              : val(d.samePerson || '')
          ),
          para(
            'Government ID and other supporting identity documentation can be provided as needed.'
          )
        ].join('\n\n');
      }
    }
  };

  const SITUATION_ORDER = [
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
    letterBody: '',
    recipient: 'To Whom It May Concern',
    reLine: '',
    dateStr: ''
  };

  function val(s) {
    const t = String(s == null ? '' : s).trim();
    return t || '[to be completed]';
  }

  function para(s) {
    return String(s || '').trim();
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
        state = Object.assign(state, raw);
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
          dateStr: state.dateStr
        })
      );
    } catch (e) {
      /* ignore */
    }
  }

  function currentSituation() {
    return state.situationId ? SITUATIONS[state.situationId] : null;
  }

  function buildFullLetter() {
    const sit = currentSituation();
    const lo = getLoProfile();
    if (!sit) return '';
    const d = state.values || {};
    const dateStr = state.dateStr || todayLong();
    const recipient = state.recipient || 'To Whom It May Concern';
    const reDefault =
      'Letter of Explanation — ' + sit.label + (d.borrowerName ? ' — ' + d.borrowerName : '');
    const re = state.reLine || reDefault;
    const body = sit.build(d, lo);

    const sig = [
      lo.name,
      lo.title,
      lo.company,
      lo.nmls ? 'NMLS ' + lo.nmls : '',
      lo.phone || '',
      lo.email || ''
    ]
      .filter(Boolean)
      .join('\n');

    return (
      dateStr +
      '\n\n' +
      recipient +
      ':\n\n' +
      'Re: ' +
      re +
      '\n\n' +
      body +
      '\n\n' +
      'Sincerely,\n\n' +
      sig
    );
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

  // ─── Minimal DOCX (plain paragraphs) ───────────────────────

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

  function downloadDocx() {
    const letter = buildFullLetter();
    if (!letter || !state.situationId) {
      toast('Select a situation and complete the form first.', 'error');
      return;
    }
    try {
      downloadBlob(letterToDocxBlob(letter), fileBaseName() + '.docx');
      toast('Word document downloaded');
    } catch (e) {
      console.error(e);
      toast('Could not build Word file', 'error');
    }
  }

  function downloadPdf() {
    const letter = buildFullLetter();
    if (!letter || !state.situationId) {
      toast('Select a situation and complete the form first.', 'error');
      return;
    }
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
    const letter = buildFullLetter();
    if (!letter || !state.situationId) {
      toast('Generate a letter first', 'error');
      return;
    }
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
      '<span class="lox-kicker">UNDERWRITING SUPPORT</span>' +
      '<h2 class="lox-title">Letter of Explanation</h2>' +
      '<p class="lox-lead">Pick a common situation, answer a few questions, and download a clean LOX for the file — usually in under two minutes.</p>' +
      '</header>'
    );
  }

  function renderPicker() {
    const cards = SITUATION_ORDER.map(function (id) {
      const s = SITUATIONS[id];
      return (
        '<button type="button" class="lox-sit-card" data-pick-sit="' +
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
    // Use <div>, not <section> — showSection hides every main section (incl. nested).
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
    const fields = sit.fields
      .map(function (f) {
        const v = state.values[f.key] != null ? state.values[f.key] : '';
        let control = '';
        if (f.type === 'textarea') {
          control =
            '<textarea class="lox-input" rows="3" data-field="' +
            f.key +
            '" placeholder="' +
            escapeHtml(f.placeholder || '') +
            '">' +
            escapeHtml(v) +
            '</textarea>';
        } else if (f.type === 'select') {
          control =
            '<select class="lox-input" data-field="' +
            f.key +
            '">' +
            (f.options || [])
              .map(function (opt) {
                return (
                  '<option value="' +
                  escapeHtml(opt) +
                  '"' +
                  (v === opt ? ' selected' : '') +
                  '>' +
                  escapeHtml(opt) +
                  '</option>'
                );
              })
              .join('') +
            '</select>';
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
    const previewHtml = letter
      ? escapeHtml(letter).replace(/\n/g, '<br>')
      : '<span class="lox-preview-empty">Complete the fields to preview your letter.</span>';

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
      '<h3 class="lox-section-title">2. Details</h3>' +
      '<div class="lox-lo-chip">From profile: <strong>' +
      escapeHtml(lo.name) +
      '</strong>' +
      (lo.nmls ? ' · NMLS ' + escapeHtml(lo.nmls) : '') +
      ' · ' +
      escapeHtml(lo.company) +
      '</div>' +
      '<div class="lox-field">' +
      '<label class="lox-label">Letter date</label>' +
      '<input type="text" class="lox-input" data-meta="dateStr" value="' +
      escapeHtml(state.dateStr || todayLong()) +
      '">' +
      '</div>' +
      '<div class="lox-field">' +
      '<label class="lox-label">Recipient line</label>' +
      '<input type="text" class="lox-input" data-meta="recipient" value="' +
      escapeHtml(state.recipient || 'To Whom It May Concern') +
      '" placeholder="To Whom It May Concern">' +
      '</div>' +
      '<div class="lox-field">' +
      '<label class="lox-label">Re: line (optional)</label>' +
      '<input type="text" class="lox-input" data-meta="reLine" value="' +
      escapeHtml(state.reLine || '') +
      '" placeholder="Leave blank for auto">' +
      '</div>' +
      fields +
      '</div>' +
      '<div class="lox-preview-col">' +
      '<h3 class="lox-section-title">3. Preview</h3>' +
      '<div class="lox-preview" id="lox-preview">' +
      previewHtml +
      '</div>' +
      '<div class="lox-actions">' +
      '<button type="button" class="lox-btn lox-btn-primary" data-lox-docx><i class="fas fa-file-word"></i> Download Word</button>' +
      '<button type="button" class="lox-btn lox-btn-primary lox-btn-navy" data-lox-pdf><i class="fas fa-file-pdf"></i> Download PDF</button>' +
      '<button type="button" class="lox-btn lox-btn-ghost" data-lox-copy><i class="fas fa-copy"></i> Copy text</button>' +
      '<button type="button" class="lox-btn lox-btn-ghost" data-lox-vault><i class="far fa-bookmark"></i> Save to My Saved Items</button>' +
      '</div>' +
      '<p class="lox-hint">PDF opens the print dialog — choose “Save as PDF”. Word file is fully editable.</p>' +
      '</div></div></div>'
    );
  }

  function refreshPreviewOnly() {
    const box = document.getElementById('lox-preview');
    if (!box) return;
    const letter = buildFullLetter();
    box.innerHTML = letter
      ? escapeHtml(letter).replace(/\n/g, '<br>')
      : '<span class="lox-preview-empty">Complete the fields to preview your letter.</span>';
  }

  function bindUi() {
    const el = root();
    if (!el) return;

    el.querySelectorAll('[data-pick-sit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.situationId = btn.getAttribute('data-pick-sit');
        state.values = state.values || {};
        // seed borrower blank; keep other values if same keys
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
        saveState();
        refreshPreviewOnly();
      };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });

    el.querySelectorAll('[data-meta]').forEach(function (input) {
      const key = input.getAttribute('data-meta');
      const handler = function () {
        state[key] = input.value;
        saveState();
        refreshPreviewOnly();
      };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
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
    // Recover if nav accidentally hid nested LOX nodes, or first paint was a placeholder
    if (!el.querySelector('.lox-shell') || el.querySelector('.lox-picker.hidden, .lox-workspace.hidden')) {
      render();
      return;
    }
    // Strip residual .hidden on LOX chrome (legacy nested <section> bug)
    el.querySelectorAll('.hidden').forEach(function (node) {
      if (node.id === 'letter-of-explanation') return;
      if (node.classList.contains('lox-picker') || node.classList.contains('lox-workspace') || node.classList.contains('lox-shell')) {
        node.classList.remove('hidden');
      }
    });
  }

  function init() {
    if (!document.getElementById('letter-of-explanation')) return;
    loadState();
    if (!state.dateStr) state.dateStr = todayLong();
    render();

    // Re-mount when user opens this tool (sidebar / search / hash) — same pattern as My Pitch
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

    // If already on this hash when script loads late, ensure UI is live
    if ((location.hash || '').replace(/^#/, '') === 'letter-of-explanation') {
      ensureMounted();
    }

    console.log('%c[lox-generator] Letter of Explanation ready', 'color:#00A89D');
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
