/**
 * js/features/my-pitch.js
 *
 * Sales Coach Pitch ("My Pitch") — LO elevator pitch system.
 * Types · guided questions · AI script + coaching · video + teleprompter · share/QR.
 *
 * Storage: localStorage loMyPitches_v1 (metadata + scripts)
 *          IndexedDB loMyPitchMedia (video blobs)
 */
(function () {
  'use strict';

  const META_KEY = 'loMyPitches_v1';
  const DRAFT_KEY = 'loMyPitchDraft_v1';
  const FIRST_RUN_KEY = 'loMyPitchFirstRunSeen_v1';
  const IDB_NAME = 'loMyPitchMedia';
  const IDB_STORE = 'videos';
  const TARGET_WORDS_MIN = 90;
  const TARGET_WORDS_MAX = 150;
  const HARD_WORDS_MIN = 40;
  const HARD_WORDS_MAX = 220;
  const SPEAK_WPM = 145; // spoken elevator pace

  const PITCH_TYPES = {
    consumer: {
      id: 'consumer',
      label: 'Consumer pitch',
      shortLabel: 'Consumer',
      icon: 'fa-home',
      blurb: 'For buyers, homeowners, and refi shoppers — know, like, and trust in under a minute.',
      uses: ['Open house intro', 'Past-client text', 'Bio / link-in-bio', 'First consult warm-up']
    },
    realtor: {
      id: 'realtor',
      label: 'Realtor partner pitch',
      shortLabel: 'Realtor partner',
      icon: 'fa-handshake',
      blurb: 'Why agents refer you — speed, clarity, and problems you take off their plate.',
      uses: ['Realtor lunch', 'New agent intro', 'Broker open house', 'After a tough file win']
    },
    short: {
      id: 'short',
      label: '30-second short',
      shortLabel: '30-sec short',
      icon: 'fa-bolt',
      blurb: 'Tight textable version derived from your consumer pitch — for SMS and stories.',
      uses: ['Text reply', 'IG / LinkedIn story', 'Voicemail script', 'Quick intro']
    }
  };

  const QUESTIONS = {
    consumer: [
      {
        key: 'who',
        q: 'Who do you help most?',
        helper: 'First-time buyers, move-up families, refi/equity, investors — be specific.',
        why: 'Listeners self-select in the first five seconds.',
        example: 'First-time buyers and young families in the Fort Wayne area'
      },
      {
        key: 'promise',
        q: 'What’s your #1 promise to clients?',
        helper: 'One clear outcome — not a list of products.',
        why: 'Your “so what” must land before features.',
        example: 'Clear next steps and no surprises from application to closing'
      },
      {
        key: 'proof',
        q: 'What do happy clients say about working with you?',
        helper: 'Tone, speed, calm under pressure — what they actually repeat.',
        why: 'Social proof without inventing stats or rates.',
        example: 'They say I explain the process in plain English and answer same day'
      },
      {
        key: 'fix',
        q: 'What usually goes wrong with other lenders that you fix?',
        helper: 'Communication gaps, last-minute surprises, slow underwriting handoffs.',
        why: 'Positions you as the fix without trash-talking people.',
        example: 'Clients feeling left in the dark — I send weekly status updates without being asked'
      },
      {
        key: 'why',
        q: 'Personal “why” or local edge?',
        helper: 'Hometown, family, years in market, community — keep it real.',
        why: 'Humans refer humans, not rate sheets.',
        example: 'I raised my kids here and I only recommend loans I’d put my own family in'
      }
    ],
    realtor: [
      {
        key: 'value',
        q: 'What do realtor partners value most about you?',
        helper: 'Speed to pre-approval, clarity, file reliability, protection of their client.',
        why: 'Agents care about their brand and timeline first.',
        example: 'Same-day pre-approvals and honest “yes/no/maybe” so they never walk into a dead deal'
      },
      {
        key: 'comm',
        q: 'How fast/clear is your communication in a deal?',
        helper: 'Response time, who you update, how you handle bad news.',
        why: 'Agents fire lenders who go dark.',
        example: 'I update agents the same day on every major milestone — no chasing'
      },
      {
        key: 'plate',
        q: 'What problems do you take off an agent’s plate?',
        helper: 'Education, condition chasing, rate-shop pressure, cold feet.',
        why: 'Partnership = fewer fires for them.',
        example: 'I handle lender-side education and keep buyers calm so agents can sell homes'
      },
      {
        key: 'tough',
        q: 'How do you handle tough files or rate-shop pressure?',
        helper: 'Process, honesty, alternatives — never “best rate guaranteed.”',
        why: 'Shows maturity under competitive heat.',
        example: 'I price options clearly, document the tradeoffs, and never over-promise to win the file'
      },
      {
        key: 'intro',
        q: 'What should an agent say when introducing you?',
        helper: 'One sentence they can repeat at the kitchen table.',
        why: 'Makes referral language easy and consistent.',
        example: '“This is my lender — they’ll tell you the truth and keep the deal on track.”'
      }
    ],
    short: [
      {
        key: 'who',
        q: 'Who do you help (one phrase)?',
        helper: 'Keep it short — this becomes a text.',
        why: '30 seconds has no room for a laundry list.',
        example: 'Local buyers and homeowners'
      },
      {
        key: 'promise',
        q: 'One-line promise?',
        helper: 'Outcome only.',
        why: 'Single hook for the whole short.',
        example: 'Plain-English guidance from offer to keys'
      },
      {
        key: 'proof',
        q: 'One proof or trait?',
        helper: 'What people remember.',
        why: 'Credibility in one breath.',
        example: 'Same-day answers and no surprise fees at the table'
      },
      {
        key: 'cta',
        q: 'Soft next step?',
        helper: 'Call, text, or “grab 10 minutes.”',
        why: 'Short pitches still need a door.',
        example: 'Text me and we’ll map your numbers in 10 minutes'
      },
      {
        key: 'why',
        q: 'Local/personal edge (optional short)?',
        helper: 'Skip if tight on time.',
        why: 'Warmth without a life story.',
        example: 'I’ve closed families in this market for years'
      }
    ]
  };

  const COMPLIANCE_PATTERNS = [
    { re: /\bbest\s+rate(s)?\b/i, tip: 'Avoid “best rate” — unverifiable. Prefer “competitive options” or “clear pricing.”' },
    { re: /\bguaranteed?\s+(rate|approval|close|closing)\b/i, tip: 'No guarantees on rates, approval, or closing — those are compliance risks.' },
    { re: /\blowest\s+rate\b/i, tip: '“Lowest rate” is a red flag. Soften to options based on their situation.' },
    { re: /\bpre-?approved?\s+for\s+sure\b/i, tip: 'Avoid absolute approval language.' },
    { re: /\b100%\s+(approved|guaranteed|certain)\b/i, tip: 'Drop absolute certainty claims.' },
    { re: /\bno\s+credit\s+check\b/i, tip: 'Don’t promise underwriting shortcuts you can’t control.' },
    { re: /\b mon(ey|thly)\s+payment\s+of\s*\$/i, tip: 'Don’t invent payment numbers unless quoting a real, labeled estimate.' }
  ];

  let pitches = [];
  let view = 'home'; // home | builder | detail
  let builderStep = 1;
  let draft = null;
  let activePitchId = null;
  let mediaStream = null;
  let mediaRecorder = null;
  let recordedChunks = [];
  let recordTimerId = null;
  let recordSeconds = 0;
  let teleprompterRaf = null;
  let helpOpen = false;
  let firstRunOpen = false;
  /** True after user has entered #my-pitch at least once this session (lazy UI boot). */
  let pitchUiBooted = false;
  /** Prevent first-run open/close thrash. */
  let firstRunHandledThisVisit = false;

  // ─── Storage ───────────────────────────────────────────────

  function loadPitches() {
    try {
      const raw = JSON.parse(localStorage.getItem(META_KEY) || '[]');
      pitches = Array.isArray(raw) ? raw : [];
    } catch (e) {
      pitches = [];
    }
  }

  function savePitches() {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(pitches));
    } catch (e) {
      toast('Could not save pitches (storage full?)', 'error');
    }
  }

  function loadDraft() {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      return d && typeof d === 'object' ? d : null;
    } catch (e) {
      return null;
    }
  }

  function saveDraft() {
    if (!draft) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      /* ignore */
    }
  }

  function clearDraftStorage() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  function openIdb() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not available'));
        return;
      }
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = function () {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      };
      req.onsuccess = function () {
        resolve(req.result);
      };
      req.onerror = function () {
        reject(req.error || new Error('IDB open failed'));
      };
    });
  }

  async function idbPut(id, blob) {
    const db = await openIdb();
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(blob, id);
      tx.oncomplete = function () {
        db.close();
        resolve();
      };
      tx.onerror = function () {
        db.close();
        reject(tx.error);
      };
    });
  }

  async function idbGet(id) {
    const db = await openIdb();
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(id);
      req.onsuccess = function () {
        db.close();
        resolve(req.result || null);
      };
      req.onerror = function () {
        db.close();
        reject(req.error);
      };
    });
  }

  async function idbDel(id) {
    try {
      const db = await openIdb();
      return new Promise(function (resolve) {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).delete(id);
        tx.oncomplete = function () {
          db.close();
          resolve();
        };
        tx.onerror = function () {
          db.close();
          resolve();
        };
      });
    } catch (e) {
      /* ignore */
    }
  }

  // ─── Helpers ───────────────────────────────────────────────

  function toast(msg, type) {
    if (typeof window.showToast === 'function') window.showToast(msg, type || 'info');
    else console.log('[My Pitch]', msg);
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function uid() {
    return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function wordCount(text) {
    const t = String(text || '').trim();
    if (!t) return 0;
    return t.split(/\s+/).filter(Boolean).length;
  }

  function speakSeconds(text) {
    const w = wordCount(text);
    return Math.max(1, Math.round((w / SPEAK_WPM) * 60));
  }

  function getProfile() {
    if (typeof window.getUserProfile === 'function') {
      try {
        return window.getUserProfile() || {};
      } catch (e) {
        return {};
      }
    }
    try {
      return JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch (e) {
      return {};
    }
  }

  function profileBits() {
    const p = getProfile();
    return {
      name: String(p.name || '').trim() || 'Your name',
      title: String(p.title || p.role || 'Loan Officer').trim(),
      nmls: String(p.nmls || p.nmlsNumber || '').trim(),
      phone: String(p.phone || '').trim(),
      email: String(p.email || '').trim(),
      location: String(p.location || p.market || p.localArea || '').trim(),
      company: 'Ruoff Mortgage',
      intro: String(p.intro || '').trim(),
      headshotUrl: String(p.headshotUrl || '').trim()
    };
  }

  function statusOf(pitch) {
    if (!pitch) return 'empty';
    if (pitch.videoId || pitch.hasVideo) return 'complete';
    if (pitch.script && pitch.script.trim()) return 'script';
    if (pitch.answers && Object.keys(pitch.answers).some((k) => pitch.answers[k])) return 'draft';
    return 'draft';
  }

  function statusLabel(s) {
    return (
      {
        empty: 'Not started',
        draft: 'Draft',
        script: 'Script ready — add video',
        complete: 'Ready'
      }[s] || s
    );
  }

  function statusClass(s) {
    return (
      {
        empty: 'mp-status--empty',
        draft: 'mp-status--draft',
        script: 'mp-status--script',
        complete: 'mp-status--complete'
      }[s] || ''
    );
  }

  function emptyDraft(type) {
    return {
      id: uid(),
      type: type || 'consumer',
      name: '',
      answers: {},
      script: '',
      videoId: null,
      hasVideo: false,
      videoMime: '',
      videoDurationSec: 0,
      primaryConsumer: false,
      primaryRealtor: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      coachNotes: []
    };
  }

  // ─── Coaching (always-on, no AI required) ──────────────────

  function coachScript(script, type) {
    const words = wordCount(script);
    const secs = speakSeconds(script);
    const tips = [];
    let length = 'ideal';
    if (words < HARD_WORDS_MIN) {
      length = 'too_short';
      tips.push('Add who you help and one concrete promise — aim for ~90–150 words (~45–59 seconds).');
    } else if (words < TARGET_WORDS_MIN) {
      length = 'short';
      tips.push('A bit short for a full pitch — one proof point or personal “why” would help.');
    } else if (words > HARD_WORDS_MAX) {
      length = 'too_long';
      tips.push('Cut hard. Elevator pitches die after ~75 seconds. Target under 150 words.');
    } else if (words > TARGET_WORDS_MAX) {
      length = 'long';
      tips.push('Slightly long for a 59-second delivery — trim one clause from the middle.');
    } else {
      tips.push('Length is in the sweet spot for a ~45–59 second spoken pitch.');
    }

    const sentences = String(script || '')
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean);
    const firstTwo = sentences.slice(0, 2).join(' ');
    const clarityOk =
      /help|buy|home|mortgage|lender|loan|realtor|agent|client|family|buyer/i.test(firstTwo) &&
      firstTwo.length > 40;
    if (!clarityOk) {
      tips.push('Open with who you help + the outcome — don’t bury the lead in credentials.');
    }

    const ctaOk =
      /\b(call|text|reach|email|connect|talk|chat|schedule|grab|message|dm|let'?s)\b/i.test(
        script
      );
    if (!ctaOk) {
      tips.push('Add a soft next step: “Text me,” “Grab 10 minutes,” or “Ask your agent for my number.”');
    }

    const compliance = [];
    COMPLIANCE_PATTERNS.forEach(function (p) {
      if (p.re.test(script)) compliance.push(p.tip);
    });
    if (compliance.length) {
      compliance.forEach(function (c) {
        tips.push(c);
      });
    }

    const prof = profileBits();
    if (prof.nmls && script && !new RegExp(prof.nmls.replace(/\W/g, '\\$&')).test(script)) {
      // NMLS optional in spoken pitch — only suggest for longer consumer
      if (type === 'consumer' && words > 100) {
        tips.push('Optional: mention NMLS ' + prof.nmls + ' once if this lands on a written page.');
      }
    }

    // Cap tips
    const uniqueTips = [];
    tips.forEach(function (t) {
      if (uniqueTips.indexOf(t) === -1) uniqueTips.push(t);
    });

    return {
      words: words,
      seconds: secs,
      length: length,
      clarity: clarityOk ? 'good' : 'weak',
      cta: ctaOk ? 'good' : 'missing',
      complianceFlags: compliance,
      tips: uniqueTips.slice(0, 4)
    };
  }

  function lengthLabel(len) {
    return (
      {
        too_short: 'Too short',
        short: 'A little short',
        ideal: 'Ideal length',
        long: 'A little long',
        too_long: 'Too long'
      }[len] || len
    );
  }

  // ─── AI / fallback script ──────────────────────────────────

  function fallbackScript(type, answers, prof) {
    const a = answers || {};
    if (type === 'realtor') {
      return (
        'Hi, I’m ' +
        prof.name +
        ' with ' +
        prof.company +
        (prof.location ? ' in ' + prof.location : '') +
        '. ' +
        (a.value || 'Agents partner with me for clear communication and reliable files') +
        '. ' +
        (a.comm || 'I keep you updated the same day on every major milestone') +
        '. ' +
        (a.plate || 'I take lender-side education and condition chasing off your plate') +
        ' so you can focus on your clients. ' +
        (a.tough || 'On tough files or rate-shop pressure, I stay honest about options — never over-promise') +
        '. ' +
        (a.intro
          ? 'When you introduce me, you can simply say: “' + a.intro.replace(/^["']|["']$/g, '') + '.” '
          : '') +
        'If you want a partner who protects your reputation and your timeline, text or call me' +
        (prof.phone ? ' at ' + prof.phone : '') +
        ' and let’s talk about how we work deals together.'
      );
    }
    if (type === 'short') {
      return (
        'I’m ' +
        prof.name +
        ' — I help ' +
        (a.who || 'local buyers and homeowners') +
        ' with ' +
        (a.promise || 'clear, no-surprise mortgage guidance') +
        '. ' +
        (a.proof || 'You’ll get straight answers and a plan that fits your life') +
        '. ' +
        (a.cta || 'Text me and we’ll map your next step in 10 minutes') +
        '.'
      );
    }
    // consumer
    return (
      'Hi, I’m ' +
      prof.name +
      (prof.title ? ', ' + prof.title : '') +
      ' with ' +
      prof.company +
      (prof.location ? ' serving ' + prof.location : '') +
      '. I help ' +
      (a.who || 'homebuyers and homeowners') +
      ' by delivering ' +
      (a.promise || 'clear next steps and no surprises') +
      '. ' +
      (a.proof || 'Clients tell me I explain everything in plain English') +
      '. ' +
      (a.fix
        ? 'Where others leave people guessing, ' + a.fix + '. '
        : '') +
      (a.why ? a.why + '. ' : '') +
      'If you want a calm plan for your next move, text or call me' +
      (prof.phone ? ' at ' + prof.phone : '') +
      ' — I’d love to help.'
    );
  }

  async function generateScriptAi(type, answers, prof) {
    const typeMeta = PITCH_TYPES[type] || PITCH_TYPES.consumer;
    const qList = QUESTIONS[type] || QUESTIONS.consumer;
    const answerBlock = qList
      .map(function (q) {
        return q.q + '\nAnswer: ' + (answers[q.key] || '(blank)');
      })
      .join('\n\n');

    const system =
      'You write spoken elevator pitches for mortgage loan officers at Ruoff Mortgage. ' +
      'Midwest professional, value-first, C5 (clear, concise, compelling, committed, consistent). ' +
      'Output ONLY the spoken pitch paragraph(s) — no title, no bullets, no quotes around the whole piece. ' +
      'Target 90–150 words (speakable in about 45–59 seconds). Never invent rates, APRs, payments, guarantees, ' +
      'approvals, or licenses. Only use NMLS if provided. No “best rate” or “guaranteed close.” Soft CTA at the end.';

    const user =
      'Pitch type: ' +
      typeMeta.label +
      '\nLO name: ' +
      prof.name +
      '\nTitle: ' +
      prof.title +
      '\nCompany: ' +
      prof.company +
      (prof.nmls ? '\nNMLS: ' + prof.nmls : '\nNMLS: (not provided — do not invent)') +
      (prof.location ? '\nMarket: ' + prof.location : '') +
      (prof.phone ? '\nPhone: ' + prof.phone : '') +
      '\n\nAnswers:\n' +
      answerBlock +
      '\n\nWrite the spoken pitch now.';

    if (typeof window.callGrokAPI !== 'function') {
      return fallbackScript(type, answers, prof);
    }
    try {
      const text = await window.callGrokAPI(null, {
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.65,
        max_tokens: 700
      });
      const cleaned = String(text || '')
        .replace(/^["“]|["”]$/g, '')
        .trim();
      if (wordCount(cleaned) < 25) return fallbackScript(type, answers, prof);
      return cleaned;
    } catch (e) {
      console.warn('[My Pitch] AI generate failed, using template', e);
      toast('AI unavailable — used a solid template from your answers. Edit freely.', 'info');
      return fallbackScript(type, answers, prof);
    }
  }

  // ─── Render ────────────────────────────────────────────────

  function root() {
    return document.getElementById('mp-root');
  }

  function isMyPitchVisible() {
    const sec = document.getElementById('my-pitch');
    return !!(sec && !sec.classList.contains('hidden'));
  }

  function render() {
    const el = root();
    if (!el) return;
    // Never inject fixed overlays (first-run modal / help) while section is hidden —
    // that was causing full-page flash when the user was still on Home.
    if (!isMyPitchVisible() && !pitchUiBooted) {
      el.innerHTML =
        '<div class="text-center py-16 text-gray-500">' +
        '<i class="fas fa-microphone-alt text-3xl text-[#00A89D] mb-3"></i>' +
        '<p class="font-semibold m-0">My Pitch</p>' +
        '<p class="text-sm m-0 mt-1">Open this tool from the sidebar or Home to get started.</p>' +
        '</div>';
      return;
    }
    if (view === 'builder') el.innerHTML = renderBuilder();
    else if (view === 'detail') el.innerHTML = renderDetail();
    else el.innerHTML = renderHome();
    bindUi();
  }

  function renderHome() {
    const byType = { consumer: null, realtor: null, short: null };
    pitches.forEach(function (p) {
      if (!byType[p.type] || (p.updatedAt || '') > (byType[p.type].updatedAt || '')) {
        byType[p.type] = p;
      }
    });
    const list = pitches
      .slice()
      .sort(function (a, b) {
        return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      });

    const typeCards = ['consumer', 'realtor', 'short']
      .map(function (tid) {
        const meta = PITCH_TYPES[tid];
        const p = byType[tid];
        const st = p ? statusOf(p) : 'empty';
        return (
          '<article class="mp-type-card" data-type="' +
          tid +
          '">' +
          '<div class="mp-type-card-top">' +
          '<span class="mp-type-icon"><i class="fas ' +
          meta.icon +
          '"></i></span>' +
          '<span class="mp-status ' +
          statusClass(st) +
          '">' +
          escapeHtml(statusLabel(st)) +
          '</span>' +
          '</div>' +
          '<h3>' +
          escapeHtml(meta.label) +
          '</h3>' +
          '<p>' +
          escapeHtml(meta.blurb) +
          '</p>' +
          '<ul class="mp-use-list">' +
          meta.uses
            .map(function (u) {
              return '<li>' + escapeHtml(u) + '</li>';
            })
            .join('') +
          '</ul>' +
          '<div class="mp-type-actions">' +
          (p
            ? '<button type="button" class="mp-btn mp-btn-primary" data-open-pitch="' +
              escapeHtml(p.id) +
              '">Open</button>' +
              '<button type="button" class="mp-btn mp-btn-ghost" data-edit-pitch="' +
              escapeHtml(p.id) +
              '">Edit</button>'
            : '<button type="button" class="mp-btn mp-btn-primary" data-start-type="' +
              tid +
              '">Create</button>') +
          '</div></article>'
        );
      })
      .join('');

    const library =
      list.length === 0
        ? '<div class="mp-empty-lib">' +
          '<p>No saved pitches yet. Create a consumer pitch first — most LOs use it for clients <em>and</em> as the base for a 30-second short.</p>' +
          '<button type="button" class="mp-btn mp-btn-primary" data-start-type="consumer">Create consumer pitch</button>' +
          '</div>'
        : '<div class="mp-lib-table">' +
          list
            .map(function (p) {
              const st = statusOf(p);
              const meta = PITCH_TYPES[p.type] || PITCH_TYPES.consumer;
              const badges = [];
              if (p.primaryConsumer) badges.push('Primary consumer');
              if (p.primaryRealtor) badges.push('Primary realtor');
              return (
                '<div class="mp-lib-row" data-open-pitch="' +
                escapeHtml(p.id) +
                '">' +
                '<div><strong>' +
                escapeHtml(p.name || meta.label) +
                '</strong>' +
                '<div class="mp-lib-meta">' +
                escapeHtml(meta.shortLabel) +
                ' · ' +
                escapeHtml(statusLabel(st)) +
                (badges.length ? ' · ' + badges.join(' · ') : '') +
                '</div></div>' +
                '<div class="mp-lib-actions" onclick="event.stopPropagation()">' +
                '<button type="button" class="mp-btn mp-btn-sm" data-open-pitch="' +
                escapeHtml(p.id) +
                '">Open</button>' +
                '<button type="button" class="mp-btn mp-btn-sm mp-btn-ghost" data-dup-pitch="' +
                escapeHtml(p.id) +
                '">Duplicate</button>' +
                '<button type="button" class="mp-btn mp-btn-sm mp-btn-danger" data-del-pitch="' +
                escapeHtml(p.id) +
                '">Delete</button>' +
                '</div></div>'
              );
            })
            .join('') +
          '</div>';

    return (
      '<div class="mp-shell">' +
      renderHeaderBar(false) +
      '<header class="mp-hero">' +
      '<span class="mp-kicker">SALES COACH PITCH</span>' +
      '<h2 class="mp-title">My Pitch</h2>' +
      '<p class="mp-lead">A mortgage-native elevator pitch — script, coaching, video, and share tools — built for loan officers. Create a pro pitch in about five minutes.</p>' +
      '<div class="mp-hero-actions">' +
      '<button type="button" class="mp-btn mp-btn-primary mp-btn-lg" data-start-type="consumer"><i class="fas fa-microphone-alt"></i> Create your pitch</button>' +
      '<button type="button" class="mp-btn mp-btn-ghost" data-open-help><i class="fas fa-lightbulb"></i> How it works</button>' +
      '</div></header>' +
      '<section class="mp-why">' +
      '<h3>Why this works</h3>' +
      '<div class="mp-why-grid">' +
      '<div><strong>Know · like · trust</strong><p>In under a minute — before a rate conversation.</p></div>' +
      '<div><strong>Realtor intros</strong><p>A partner pitch agents can repeat at the kitchen table.</p></div>' +
      '<div><strong>Referrals</strong><p>Past clients finally have words for “why you.”</p></div>' +
      '</div></section>' +
      '<section class="mp-section">' +
      '<div class="mp-section-head"><h3>Pitch types</h3>' +
      '<button type="button" class="mp-btn mp-btn-ghost mp-btn-sm" data-open-help>Tips</button></div>' +
      '<div class="mp-type-grid">' +
      typeCards +
      '</div></section>' +
      '<section class="mp-section">' +
      '<div class="mp-section-head"><h3>Your library</h3></div>' +
      library +
      '</section>' +
      renderHelpDrawer() +
      renderFirstRunModal() +
      '</div>'
    );
  }

  function renderHeaderBar(showBack) {
    return (
      '<div class="mp-topbar">' +
      (showBack
        ? '<button type="button" class="mp-btn mp-btn-ghost mp-btn-sm" data-go-home><i class="fas fa-arrow-left"></i> All pitches</button>'
        : '<span class="mp-topbar-brand"><i class="fas fa-microphone-alt text-[#00A89D]"></i> My Pitch</span>') +
      '<button type="button" class="mp-btn mp-btn-ghost mp-btn-sm" data-open-help><i class="fas fa-question-circle"></i> Help</button>' +
      '</div>'
    );
  }

  function stepLabels() {
    return ['Type', 'Questions', 'Script', 'Video', 'Share'];
  }

  function renderBuilder() {
    if (!draft) draft = emptyDraft('consumer');
    const steps = stepLabels()
      .map(function (label, i) {
        const n = i + 1;
        let cls = 'mp-step';
        if (n === builderStep) cls += ' is-active';
        if (n < builderStep) cls += ' is-done';
        return (
          '<button type="button" class="' +
          cls +
          '" data-goto-step="' +
          n +
          '"><span class="mp-step-num">' +
          n +
          '</span><span class="mp-step-label">' +
          label +
          '</span></button>'
        );
      })
      .join('<span class="mp-step-line"></span>');

    let body = '';
    if (builderStep === 1) body = renderStepType();
    else if (builderStep === 2) body = renderStepQuestions();
    else if (builderStep === 3) body = renderStepScript();
    else if (builderStep === 4) body = renderStepVideo();
    else body = renderStepShare();

    return (
      '<div class="mp-shell mp-shell--builder">' +
      renderHeaderBar(true) +
      '<div class="mp-progress" role="navigation" aria-label="Pitch steps">' +
      steps +
      '</div>' +
      '<div class="mp-builder-body">' +
      body +
      '</div>' +
      renderHelpDrawer() +
      renderFirstRunModal() +
      '</div>'
    );
  }

  function renderStepType() {
    const cards = ['consumer', 'realtor', 'short']
      .map(function (tid) {
        const meta = PITCH_TYPES[tid];
        const sel = draft.type === tid ? ' is-selected' : '';
        return (
          '<button type="button" class="mp-pick-type' +
          sel +
          '" data-pick-type="' +
          tid +
          '">' +
          '<span class="mp-type-icon"><i class="fas ' +
          meta.icon +
          '"></i></span>' +
          '<strong>' +
          escapeHtml(meta.label) +
          '</strong>' +
          '<p>' +
          escapeHtml(meta.blurb) +
          '</p>' +
          '<span class="mp-pick-uses">Use for: ' +
          escapeHtml(meta.uses.slice(0, 2).join(' · ')) +
          '</span>' +
          '</button>'
        );
      })
      .join('');
    return (
      '<div class="mp-step-panel">' +
      '<h3 class="mp-step-title">1. Choose your pitch type</h3>' +
      '<p class="mp-step-sub">Pick the conversation you’re walking into. You can create more than one.</p>' +
      '<div class="mp-pick-grid">' +
      cards +
      '</div>' +
      '<div class="mp-nav-row">' +
      '<span></span>' +
      '<button type="button" class="mp-btn mp-btn-primary" data-next-step>Continue to questions <i class="fas fa-arrow-right"></i></button>' +
      '</div></div>'
    );
  }

  function renderStepQuestions() {
    const qs = QUESTIONS[draft.type] || QUESTIONS.consumer;
    const fields = qs
      .map(function (q, i) {
        const val = (draft.answers && draft.answers[q.key]) || '';
        return (
          '<div class="mp-q-block">' +
          '<label class="mp-q-label" for="mp-q-' +
          q.key +
          '"><span class="mp-q-num">' +
          (i + 1) +
          '</span> ' +
          escapeHtml(q.q) +
          '</label>' +
          '<p class="mp-q-helper">' +
          escapeHtml(q.helper) +
          '</p>' +
          '<textarea id="mp-q-' +
          q.key +
          '" class="mp-textarea" rows="2" data-answer-key="' +
          q.key +
          '" placeholder="Your answer…">' +
          escapeHtml(val) +
          '</textarea>' +
          '<div class="mp-q-meta">' +
          '<button type="button" class="mp-chip" data-use-example="' +
          q.key +
          '">Use example</button>' +
          '<span class="mp-why">Why we ask: ' +
          escapeHtml(q.why) +
          '</span>' +
          '</div></div>'
        );
      })
      .join('');
    return (
      '<div class="mp-step-panel">' +
      '<h3 class="mp-step-title">2. Answer five quick questions</h3>' +
      '<p class="mp-step-sub">Speak like yourself. Incomplete is fine — we’ll shape it into a pitch.</p>' +
      '<div class="mp-q-list">' +
      fields +
      '</div>' +
      '<div class="mp-nav-row">' +
      '<button type="button" class="mp-btn mp-btn-ghost" data-prev-step>Back</button>' +
      '<button type="button" class="mp-btn mp-btn-primary" data-next-step>Generate my script <i class="fas fa-magic"></i></button>' +
      '</div></div>'
    );
  }

  function renderStepScript() {
    const coach = coachScript(draft.script || '', draft.type);
    const sample =
      draft.type === 'realtor'
        ? '“Agents call me when they need a lender who tells the truth fast — pre-approvals that hold, updates without chasing, and no drama at the closing table. If you want that kind of partner, text me.”'
        : '“I help local families buy and refinance with a clear plan and no surprises. Clients say I explain the process in plain English and answer the same day. If you want a calm next step, text me — we’ll map it in ten minutes.”';

    const tipHtml = coach.tips
      .map(function (t) {
        return '<li>' + escapeHtml(t) + '</li>';
      })
      .join('');

    return (
      '<div class="mp-step-panel mp-step-panel--split">' +
      '<div class="mp-script-main">' +
      '<h3 class="mp-step-title">3. Your script</h3>' +
      '<p class="mp-step-sub">Spoken style · aim ~90–150 words (~45–59 seconds). Edit until it sounds like you.</p>' +
      '<div class="mp-script-toolbar">' +
      '<button type="button" class="mp-btn mp-btn-primary" data-gen-script id="mp-gen-btn"><i class="fas fa-magic"></i> ' +
      (draft.script ? 'Regenerate' : 'Generate') +
      '</button>' +
      '<button type="button" class="mp-btn mp-btn-ghost" data-copy-script>Copy script</button>' +
      '</div>' +
      '<textarea id="mp-script" class="mp-textarea mp-textarea--script" rows="10" placeholder="Your pitch will appear here…">' +
      escapeHtml(draft.script || '') +
      '</textarea>' +
      '<div class="mp-script-meta">' +
      '<span id="mp-word-count">' +
      coach.words +
      ' words</span>' +
      '<span id="mp-speak-time">~' +
      coach.seconds +
      's spoken</span>' +
      '<span class="mp-len-pill mp-len-' +
      coach.length +
      '">' +
      escapeHtml(lengthLabel(coach.length)) +
      '</span>' +
      '</div>' +
      '<div class="mp-nav-row">' +
      '<button type="button" class="mp-btn mp-btn-ghost" data-prev-step>Back</button>' +
      '<button type="button" class="mp-btn mp-btn-primary" data-next-step ' +
      (coach.words < HARD_WORDS_MIN ? 'disabled' : '') +
      '>Continue to video <i class="fas fa-video"></i></button>' +
      '</div></div>' +
      '<aside class="mp-coach-panel" aria-label="Pitch coaching">' +
      '<h4><i class="fas fa-clipboard-check text-[#00A89D]"></i> Coaching</h4>' +
      '<div class="mp-coach-scores">' +
      scoreRow('Length', lengthLabel(coach.length), coach.length === 'ideal' || coach.length === 'short' || coach.length === 'long') +
      scoreRow('Clarity', coach.clarity === 'good' ? 'Value early' : 'Lead buried', coach.clarity === 'good') +
      scoreRow('CTA', coach.cta === 'good' ? 'Next step present' : 'Add a soft ask', coach.cta === 'good') +
      scoreRow(
        'Compliance',
        coach.complianceFlags.length ? coach.complianceFlags.length + ' flag(s)' : 'Looks clean',
        coach.complianceFlags.length === 0
      ) +
      '</div>' +
      '<h5>Suggestions</h5>' +
      '<ul class="mp-coach-tips">' +
      tipHtml +
      '</ul>' +
      (coach.complianceFlags.length
        ? '<button type="button" class="mp-btn mp-btn-sm mp-btn-ghost" data-fix-compliance>Strip risky phrases</button>'
        : '') +
      '<div class="mp-sample">' +
      '<h5>What great sounds like</h5>' +
      '<p>' +
      escapeHtml(sample) +
      '</p></div>' +
      '</aside></div>'
    );
  }

  function scoreRow(label, value, ok) {
    return (
      '<div class="mp-score ' +
      (ok ? 'is-ok' : 'is-warn') +
      '"><span>' +
      escapeHtml(label) +
      '</span><strong>' +
      escapeHtml(value) +
      '</strong></div>'
    );
  }

  function renderStepVideo() {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent || '');
    return (
      '<div class="mp-step-panel">' +
      '<h3 class="mp-step-title">4. Record or upload your video</h3>' +
      '<p class="mp-step-sub">Teleprompter uses <em>your</em> script. Soft target: 59 seconds. Slightly over is fine — we warn at 59s and 75s.</p>' +
      (isMobile
        ? '<div class="mp-note mp-note--info"><i class="fas fa-mobile-alt"></i> Mobile can record, but desktop usually looks sharper for a professional pitch. Upload from your phone is always fine.</div>'
        : '') +
      '<div class="mp-video-layout">' +
      '<div class="mp-video-stage">' +
      '<div class="mp-video-frame">' +
      '<video id="mp-preview" playsinline muted class="mp-video-el"></video>' +
      '<video id="mp-playback" playsinline controls class="mp-video-el hidden"></video>' +
      '<div id="mp-teleprompter" class="mp-teleprompter" aria-hidden="true"></div>' +
      '<div id="mp-countdown" class="mp-countdown hidden">3</div>' +
      '<div class="mp-timer-bar"><span id="mp-timer">0:00</span> <span id="mp-timer-hint" class="mp-timer-hint">Target ~0:59</span></div>' +
      '</div>' +
      '<div class="mp-record-controls">' +
      '<button type="button" class="mp-btn mp-btn-primary mp-btn-lg" id="mp-rec-btn" data-start-rec><i class="fas fa-circle"></i> Record</button>' +
      '<button type="button" class="mp-btn mp-btn-danger hidden" id="mp-stop-btn" data-stop-rec><i class="fas fa-stop"></i> Stop</button>' +
      '<button type="button" class="mp-btn mp-btn-ghost" data-re-record>Re-record</button>' +
      '<label class="mp-btn mp-btn-ghost mp-upload-label"><i class="fas fa-upload"></i> Upload<input type="file" id="mp-upload" accept="video/*" class="hidden"></label>' +
      '</div>' +
      '<p class="mp-hint">Allow camera + mic when prompted. Chrome/Edge desktop recommended.</p>' +
      '</div>' +
      '<aside class="mp-video-guide">' +
      '<h4>Recording checklist</h4>' +
      '<ul>' +
      '<li>Face a window or soft light — avoid harsh overhead</li>' +
      '<li>Camera at eye level; look at the lens, not the screen</li>' +
      '<li>Smile in the first second; stand or sit tall</li>' +
      '<li>Talk to a person — don’t “read the news”</li>' +
      '<li>Quiet room; silence notifications</li>' +
      '<li>Practice the script out loud once before you hit Record</li>' +
      '</ul>' +
      '<div class="mp-note">Why ~59 seconds? Attention holds. Agents and clients finish it. Longer feels like a lecture.</div>' +
      '</aside></div>' +
      '<div class="mp-nav-row">' +
      '<button type="button" class="mp-btn mp-btn-ghost" data-prev-step>Back</button>' +
      '<div class="mp-nav-right">' +
      '<button type="button" class="mp-btn mp-btn-ghost" data-skip-video>Save script only</button>' +
      '<button type="button" class="mp-btn mp-btn-primary" data-next-step>Continue to share <i class="fas fa-arrow-right"></i></button>' +
      '</div></div></div>'
    );
  }

  function renderStepShare() {
    const prof = profileBits();
    const meta = PITCH_TYPES[draft.type] || PITCH_TYPES.consumer;
    const st = statusOf(draft);
    const defaultName =
      draft.name ||
      meta.shortLabel +
        ' · ' +
        new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return (
      '<div class="mp-step-panel">' +
      '<h3 class="mp-step-title">5. Save & share</h3>' +
      '<p class="mp-step-sub">Name it, save it, then send it where realtors and clients actually look.</p>' +
      '<div class="mp-share-grid">' +
      '<div class="mp-share-main">' +
      '<label class="mp-field-label" for="mp-pitch-name">Pitch name</label>' +
      '<input type="text" id="mp-pitch-name" class="mp-input" value="' +
      escapeHtml(defaultName) +
      '">' +
      '<div class="mp-status-banner ' +
      statusClass(st) +
      '">' +
      escapeHtml(statusLabel(st)) +
      (st === 'script'
        ? ' — you can still share the written pitch; add video anytime.'
        : '') +
      '</div>' +
      '<div class="mp-share-actions">' +
      '<button type="button" class="mp-btn mp-btn-primary" data-save-pitch><i class="fas fa-save"></i> Save pitch</button>' +
      '<button type="button" class="mp-btn mp-btn-ghost" data-copy-script>Copy script</button>' +
      '<button type="button" class="mp-btn mp-btn-ghost" data-copy-sms>Copy text message</button>' +
      '<button type="button" class="mp-btn mp-btn-ghost" data-email-pitch>Email</button>' +
      '<button type="button" class="mp-btn mp-btn-ghost" data-open-share-page>Open pitch page</button>' +
      '<button type="button" class="mp-btn mp-btn-ghost" data-qr-pitch>QR code</button>' +
      (draft.hasVideo
        ? '<button type="button" class="mp-btn mp-btn-ghost" data-dl-video>Download video</button>'
        : '') +
      '</div>' +
      '<div id="mp-qr-box" class="mp-qr-box hidden"></div>' +
      '<div class="mp-checklist">' +
      '<h4>Use it this week</h4>' +
      '<label><input type="checkbox"> Practice once out loud standing up</label>' +
      '<label><input type="checkbox"> Text consumer pitch to 3 past clients</label>' +
      '<label><input type="checkbox"> Send realtor pitch to top 5 agents</label>' +
      '<label><input type="checkbox"> Add link/script excerpt to email signature</label>' +
      '</div></div>' +
      '<aside class="mp-share-side">' +
      '<h4>When to send which</h4>' +
      '<p><strong>Consumer</strong> — buyers, past clients, bio link, open house follow-up.</p>' +
      '<p><strong>Realtor partner</strong> — new agent intros, broker events, after you save a deal.</p>' +
      '<p><strong>30-sec short</strong> — SMS and social; keep the long form for meetings.</p>' +
      '<div class="mp-card-mini">' +
      '<strong>' +
      escapeHtml(prof.name) +
      '</strong><br>' +
      escapeHtml(prof.title) +
      ' · ' +
      escapeHtml(prof.company) +
      (prof.nmls ? '<br>NMLS ' + escapeHtml(prof.nmls) : '') +
      (prof.phone ? '<br>' + escapeHtml(prof.phone) : '') +
      '</div></aside></div>' +
      '<div class="mp-nav-row">' +
      '<button type="button" class="mp-btn mp-btn-ghost" data-prev-step>Back</button>' +
      '<button type="button" class="mp-btn mp-btn-primary" data-save-and-home>Save &amp; finish</button>' +
      '</div></div>'
    );
  }

  function renderDetail() {
    const p = pitches.find(function (x) {
      return x.id === activePitchId;
    });
    if (!p) {
      view = 'home';
      return renderHome();
    }
    const meta = PITCH_TYPES[p.type] || PITCH_TYPES.consumer;
    const st = statusOf(p);
    const coach = coachScript(p.script || '', p.type);
    return (
      '<div class="mp-shell">' +
      renderHeaderBar(true) +
      '<header class="mp-detail-head">' +
      '<div><span class="mp-status ' +
      statusClass(st) +
      '">' +
      escapeHtml(statusLabel(st)) +
      '</span>' +
      '<h2 class="mp-title mp-title--sm">' +
      escapeHtml(p.name || meta.label) +
      '</h2>' +
      '<p class="mp-lead">' +
      escapeHtml(meta.label) +
      ' · updated ' +
      escapeHtml(new Date(p.updatedAt || Date.now()).toLocaleString()) +
      '</p></div>' +
      '<div class="mp-detail-actions">' +
      '<button type="button" class="mp-btn mp-btn-primary" data-edit-pitch="' +
      escapeHtml(p.id) +
      '">Edit</button>' +
      '<button type="button" class="mp-btn mp-btn-ghost" data-set-primary="' +
      escapeHtml(p.id) +
      '">Set primary</button>' +
      '<button type="button" class="mp-btn mp-btn-ghost" data-dup-pitch="' +
      escapeHtml(p.id) +
      '">Duplicate</button>' +
      '<button type="button" class="mp-btn mp-btn-danger" data-del-pitch="' +
      escapeHtml(p.id) +
      '">Delete</button>' +
      '</div></header>' +
      '<div class="mp-detail-grid">' +
      '<div class="mp-detail-video" id="mp-detail-video-wrap">' +
      (p.hasVideo
        ? '<video id="mp-detail-video" controls playsinline class="mp-video-el"></video>'
        : '<div class="mp-video-placeholder"><i class="fas fa-video-slash"></i><p>No video yet</p>' +
          '<button type="button" class="mp-btn mp-btn-primary" data-edit-pitch="' +
          escapeHtml(p.id) +
          '">Add video</button></div>') +
      '</div>' +
      '<div class="mp-detail-script">' +
      '<h3>Script</h3>' +
      '<p class="mp-script-body">' +
      escapeHtml(p.script || '') +
      '</p>' +
      '<div class="mp-script-meta"><span>' +
      coach.words +
      ' words · ~' +
      coach.seconds +
      's</span></div>' +
      '<div class="mp-share-actions">' +
      '<button type="button" class="mp-btn mp-btn-ghost" data-copy-script-id="' +
      escapeHtml(p.id) +
      '">Copy script</button>' +
      '<button type="button" class="mp-btn mp-btn-ghost" data-copy-sms-id="' +
      escapeHtml(p.id) +
      '">Copy text message</button>' +
      '<button type="button" class="mp-btn mp-btn-ghost" data-email-id="' +
      escapeHtml(p.id) +
      '">Email</button>' +
      '<button type="button" class="mp-btn mp-btn-ghost" data-share-page-id="' +
      escapeHtml(p.id) +
      '">Pitch page</button>' +
      '<button type="button" class="mp-btn mp-btn-ghost" data-qr-id="' +
      escapeHtml(p.id) +
      '">QR</button>' +
      '</div>' +
      '<div id="mp-qr-box" class="mp-qr-box hidden"></div>' +
      '</div></div>' +
      renderHelpDrawer() +
      '</div>'
    );
  }

  function renderHelpDrawer() {
    return (
      '<div id="mp-help" class="mp-help ' +
      (helpOpen ? 'is-open' : '') +
      '" role="dialog" aria-label="Pitch help">' +
      '<div class="mp-help-panel">' +
      '<div class="mp-help-head"><h3>Pitch coach</h3>' +
      '<button type="button" class="mp-btn mp-btn-ghost mp-btn-sm" data-close-help aria-label="Close">✕</button></div>' +
      '<div class="mp-help-body">' +
      '<h4>5 steps</h4>' +
      '<ol><li><strong>Type</strong> — consumer, realtor, or short</li>' +
      '<li><strong>Questions</strong> — five answers, type-aware</li>' +
      '<li><strong>Script</strong> — AI draft + coaching</li>' +
      '<li><strong>Video</strong> — teleprompter, ~59s, re-record</li>' +
      '<li><strong>Share</strong> — save, text, email, QR</li></ol>' +
      '<h4>Why ~59 seconds?</h4>' +
      '<p>Long enough for trust. Short enough that agents and clients finish. One extra breath of proof, not a bio dump.</p>' +
      '<h4>Compliance do / don’t</h4>' +
      '<ul class="mp-do"><li>Do: clear process, local edge, soft CTA</li>' +
      '<li>Do: NMLS only if it’s really yours (from My Profile)</li>' +
      '<li>Don’t: “best rate,” guarantees, invented payments</li>' +
      '<li>Don’t: trash other lenders by name</li></ul>' +
      '<h4>FAQ</h4>' +
      '<p><strong>Script only OK?</strong> Yes — status shows “add video to finish.” Share writing anytime.</p>' +
      '<p><strong>Multiple pitches?</strong> Yes. Set a primary consumer and primary realtor.</p>' +
      '<p><strong>How do realtors use this?</strong> You text the partner pitch; they introduce you with your one-liner.</p>' +
      '<p><strong>Practice?</strong> Read the script aloud once standing up before you record.</p>' +
      '</div></div>' +
      '<div class="mp-help-backdrop" data-close-help></div></div>'
    );
  }

  function renderFirstRunModal() {
    // Only while My Pitch is the active section — never paint a fixed overlay over Home
    if (!firstRunOpen || !isMyPitchVisible()) return '';
    return (
      '<div class="mp-modal" role="dialog" aria-modal="true" aria-labelledby="mp-first-run-title">' +
      '<div class="mp-modal-backdrop" data-dismiss-first tabindex="-1" aria-hidden="true"></div>' +
      '<div class="mp-modal-card" role="document">' +
      '<h3 id="mp-first-run-title">Create your pitch in ~5 minutes</h3>' +
      '<ol class="mp-first-steps">' +
      '<li>Pick consumer or realtor</li>' +
      '<li>Answer five questions</li>' +
      '<li>Generate &amp; tweak the script</li>' +
      '<li>Record or upload video</li>' +
      '<li>Share with agents &amp; clients</li></ol>' +
      '<p class="mp-hint">This is Sales Coach Pitch — mortgage-native, coached, and built for Ruoff LOs. Not a generic video card.</p>' +
      '<button type="button" class="mp-btn mp-btn-primary mp-btn-lg" data-dismiss-first>Let’s go</button>' +
      '</div></div>'
    );
  }

  // ─── Bind / actions ────────────────────────────────────────

  function bindUi() {
    const el = root();
    if (!el) return;

    el.querySelectorAll('[data-start-type]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        startBuilder(btn.getAttribute('data-start-type'));
      });
    });
    el.querySelectorAll('[data-go-home]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        stopMedia();
        view = 'home';
        render();
      });
    });
    el.querySelectorAll('[data-open-help]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        helpOpen = true;
        render();
      });
    });
    el.querySelectorAll('[data-close-help]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        helpOpen = false;
        render();
      });
    });
    el.querySelectorAll('[data-dismiss-first]').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        if (ev) {
          ev.preventDefault();
          ev.stopPropagation();
        }
        dismissFirstRun();
      });
    });
    // Modal card should not close when clicking inside the card
    el.querySelectorAll('.mp-modal-card').forEach(function (card) {
      card.addEventListener('click', function (ev) {
        ev.stopPropagation();
      });
    });
    el.querySelectorAll('[data-open-pitch]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openDetail(btn.getAttribute('data-open-pitch'));
      });
    });
    el.querySelectorAll('[data-edit-pitch]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        editPitch(btn.getAttribute('data-edit-pitch'));
      });
    });
    el.querySelectorAll('[data-del-pitch]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        deletePitch(btn.getAttribute('data-del-pitch'));
      });
    });
    el.querySelectorAll('[data-dup-pitch]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        duplicatePitch(btn.getAttribute('data-dup-pitch'));
      });
    });
    el.querySelectorAll('[data-set-primary]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setPrimary(btn.getAttribute('data-set-primary'));
      });
    });
    el.querySelectorAll('[data-pick-type]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        draft.type = btn.getAttribute('data-pick-type');
        draft.updatedAt = new Date().toISOString();
        saveDraft();
        render();
      });
    });
    el.querySelectorAll('[data-goto-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const n = parseInt(btn.getAttribute('data-goto-step'), 10);
        if (n >= 1 && n <= 5 && n <= builderStep) {
          builderStep = n;
          render();
        }
      });
    });
    el.querySelectorAll('[data-next-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        goNext();
      });
    });
    el.querySelectorAll('[data-prev-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        builderStep = Math.max(1, builderStep - 1);
        saveDraft();
        render();
      });
    });
    el.querySelectorAll('[data-answer-key]').forEach(function (ta) {
      ta.addEventListener('input', function () {
        if (!draft.answers) draft.answers = {};
        draft.answers[ta.getAttribute('data-answer-key')] = ta.value;
        draft.updatedAt = new Date().toISOString();
        saveDraft();
      });
    });
    el.querySelectorAll('[data-use-example]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const key = btn.getAttribute('data-use-example');
        const qs = QUESTIONS[draft.type] || QUESTIONS.consumer;
        const q = qs.find(function (x) {
          return x.key === key;
        });
        if (!q) return;
        draft.answers = draft.answers || {};
        draft.answers[key] = q.example;
        saveDraft();
        render();
      });
    });
    el.querySelectorAll('[data-gen-script]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        runGenerate();
      });
    });
    const scriptTa = el.querySelector('#mp-script');
    if (scriptTa) {
      scriptTa.addEventListener('input', function () {
        draft.script = scriptTa.value;
        draft.updatedAt = new Date().toISOString();
        saveDraft();
        refreshCoachLive();
      });
    }
    el.querySelectorAll('[data-copy-script]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        copyText(draft && draft.script, 'Script copied');
      });
    });
    el.querySelectorAll('[data-copy-script-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const p = pitches.find(function (x) {
          return x.id === btn.getAttribute('data-copy-script-id');
        });
        copyText(p && p.script, 'Script copied');
      });
    });
    el.querySelectorAll('[data-fix-compliance]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        fixCompliance();
      });
    });
    el.querySelectorAll('[data-start-rec]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        startRecording();
      });
    });
    el.querySelectorAll('[data-stop-rec]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        stopRecording();
      });
    });
    el.querySelectorAll('[data-re-record]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        reRecord();
      });
    });
    const up = el.querySelector('#mp-upload');
    if (up) {
      up.addEventListener('change', function () {
        handleUpload(up.files && up.files[0]);
      });
    }
    el.querySelectorAll('[data-skip-video]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        toast('Script saved without video — add video anytime to finish.');
        builderStep = 5;
        saveDraft();
        render();
      });
    });
    el.querySelectorAll('[data-save-pitch], [data-save-and-home]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const goHome = btn.hasAttribute('data-save-and-home');
        persistDraftToLibrary().then(function (id) {
          if (goHome) {
            view = 'detail';
            activePitchId = id;
            draft = null;
            clearDraftStorage();
            render();
            loadDetailVideo();
          } else {
            toast('Pitch saved');
          }
        });
      });
    });
    el.querySelectorAll('[data-copy-sms]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        copyText(buildSms(draft), 'Text message copied');
      });
    });
    el.querySelectorAll('[data-copy-sms-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const p = pitches.find(function (x) {
          return x.id === btn.getAttribute('data-copy-sms-id');
        });
        copyText(buildSms(p), 'Text message copied');
      });
    });
    el.querySelectorAll('[data-email-pitch]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        emailPitch(draft);
      });
    });
    el.querySelectorAll('[data-email-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const p = pitches.find(function (x) {
          return x.id === btn.getAttribute('data-email-id');
        });
        emailPitch(p);
      });
    });
    el.querySelectorAll('[data-open-share-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openSharePage(draft);
      });
    });
    el.querySelectorAll('[data-share-page-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const p = pitches.find(function (x) {
          return x.id === btn.getAttribute('data-share-page-id');
        });
        openSharePage(p);
      });
    });
    el.querySelectorAll('[data-qr-pitch]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showQr(buildSms(draft));
      });
    });
    el.querySelectorAll('[data-qr-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const p = pitches.find(function (x) {
          return x.id === btn.getAttribute('data-qr-id');
        });
        showQr(buildSms(p));
      });
    });
    el.querySelectorAll('[data-dl-video]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        downloadDraftVideo();
      });
    });

    // restore video preview if on step 4 with pending blob URL
    if (view === 'builder' && builderStep === 4 && draft && draft._previewUrl) {
      const pb = document.getElementById('mp-playback');
      const live = document.getElementById('mp-preview');
      if (pb) {
        pb.src = draft._previewUrl;
        pb.classList.remove('hidden');
      }
      if (live) live.classList.add('hidden');
    }
    if (view === 'detail') loadDetailVideo();
  }

  function refreshCoachLive() {
    const coach = coachScript(draft.script || '', draft.type);
    const wc = document.getElementById('mp-word-count');
    const st = document.getElementById('mp-speak-time');
    const pill = document.querySelector('.mp-len-pill');
    if (wc) wc.textContent = coach.words + ' words';
    if (st) st.textContent = '~' + coach.seconds + 's spoken';
    if (pill) {
      pill.className = 'mp-len-pill mp-len-' + coach.length;
      pill.textContent = lengthLabel(coach.length);
    }
  }

  function hasSeenFirstRun() {
    try {
      return !!localStorage.getItem(FIRST_RUN_KEY);
    } catch (e) {
      return false;
    }
  }

  function dismissFirstRun() {
    firstRunOpen = false;
    firstRunHandledThisVisit = true;
    try {
      localStorage.setItem(FIRST_RUN_KEY, '1');
    } catch (e) {
      /* ignore */
    }
    render();
  }

  /**
   * First-run modal: ONLY when user explicitly opens My Pitch (click / showSection).
   * Never on hover, never while another section is active, never recursively from render().
   */
  function maybeOpenFirstRunOnEnter() {
    if (firstRunHandledThisVisit) return;
    if (view !== 'home') return;
    if (!isMyPitchVisible()) return;
    if (hasSeenFirstRun()) {
      firstRunHandledThisVisit = true;
      return;
    }
    if (pitches.length > 0) {
      firstRunHandledThisVisit = true;
      return;
    }
    firstRunOpen = true;
    firstRunHandledThisVisit = true;
  }

  // ─── Flow actions ──────────────────────────────────────────

  function startBuilder(type) {
    stopMedia();
    draft = emptyDraft(type || 'consumer');
    builderStep = 1;
    view = 'builder';
    saveDraft();
    render();
  }

  function goNext() {
    if (builderStep === 1) {
      if (!draft.type) draft.type = 'consumer';
      builderStep = 2;
      saveDraft();
      render();
      return;
    }
    if (builderStep === 2) {
      const qs = QUESTIONS[draft.type] || QUESTIONS.consumer;
      const filled = qs.filter(function (q) {
        return draft.answers && String(draft.answers[q.key] || '').trim();
      }).length;
      if (filled < 3) {
        toast('Answer at least 3 questions so the pitch has something real to say.', 'error');
        return;
      }
      builderStep = 3;
      saveDraft();
      render();
      if (!draft.script) runGenerate();
      return;
    }
    if (builderStep === 3) {
      const w = wordCount(draft.script);
      if (w < HARD_WORDS_MIN) {
        toast('Script is too short — aim for at least ~40 words.', 'error');
        return;
      }
      builderStep = 4;
      saveDraft();
      render();
      return;
    }
    if (builderStep === 4) {
      builderStep = 5;
      saveDraft();
      render();
    }
  }

  async function runGenerate() {
    const btn = document.getElementById('mp-gen-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Writing…';
    }
    if (typeof window.showLoadingWithTips === 'function') {
      window.showLoadingWithTips(
        [
          'Keeping it speakable in under a minute',
          'Value first — no rate guarantees',
          'Midwest professional, not salesy'
        ],
        'Writing your elevator pitch…'
      );
    }
    const prof = profileBits();
    try {
      const script = await generateScriptAi(draft.type, draft.answers || {}, prof);
      draft.script = script;
      draft.updatedAt = new Date().toISOString();
      saveDraft();
      render();
      toast('Script ready — edit anything that doesn’t sound like you');
    } finally {
      if (typeof window.hideLoading === 'function') window.hideLoading();
      else if (typeof window.hideGlobalLoading === 'function') window.hideGlobalLoading();
    }
  }

  function fixCompliance() {
    if (!draft || !draft.script) return;
    let s = draft.script;
    s = s.replace(/\bbest\s+rates?\b/gi, 'competitive options');
    s = s.replace(/\blowest\s+rate\b/gi, 'a rate that fits your situation');
    s = s.replace(/\bguaranteed?\s+(rate|approval|close|closing)\b/gi, 'a clear path toward $1');
    s = s.replace(/\$1/g, 'closing'); // cleanup awkward
    s = s.replace(/\bguaranteed?\b/gi, 'committed');
    s = s.replace(/\b100%\s+(approved|guaranteed|certain)\b/gi, 'thoroughly prepared');
    draft.script = s;
    saveDraft();
    render();
    toast('Risky phrases softened — re-read for voice');
  }

  // ─── Video ─────────────────────────────────────────────────

  async function startRecording() {
    try {
      stopMedia(false);
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
    } catch (e) {
      toast('Camera/mic blocked — allow permissions or use Upload.', 'error');
      return;
    }
    const live = document.getElementById('mp-preview');
    const playback = document.getElementById('mp-playback');
    if (playback) {
      playback.classList.add('hidden');
      playback.removeAttribute('src');
    }
    if (live) {
      live.classList.remove('hidden');
      live.srcObject = mediaStream;
      live.muted = true;
      live.play().catch(function () {});
    }
    setupTeleprompter(true);
    await runCountdown();
    recordedChunks = [];
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : '';
    try {
      mediaRecorder = mime
        ? new MediaRecorder(mediaStream, { mimeType: mime })
        : new MediaRecorder(mediaStream);
    } catch (e) {
      mediaRecorder = new MediaRecorder(mediaStream);
    }
    mediaRecorder.ondataavailable = function (ev) {
      if (ev.data && ev.data.size) recordedChunks.push(ev.data);
    };
    mediaRecorder.onstop = function () {
      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'video/webm' });
      acceptVideoBlob(blob, recordSeconds);
    };
    mediaRecorder.start(200);
    recordSeconds = 0;
    updateTimer();
    recordTimerId = setInterval(function () {
      recordSeconds += 1;
      updateTimer();
      if (recordSeconds === 59) toast('59 seconds — strong place to land a CTA');
      if (recordSeconds === 75) toast('75 seconds — wrap up soon', 'error');
    }, 1000);
    const recBtn = document.getElementById('mp-rec-btn');
    const stopBtn = document.getElementById('mp-stop-btn');
    if (recBtn) recBtn.classList.add('hidden');
    if (stopBtn) stopBtn.classList.remove('hidden');
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (recordTimerId) {
      clearInterval(recordTimerId);
      recordTimerId = null;
    }
    setupTeleprompter(false);
    const recBtn = document.getElementById('mp-rec-btn');
    const stopBtn = document.getElementById('mp-stop-btn');
    if (recBtn) recBtn.classList.remove('hidden');
    if (stopBtn) stopBtn.classList.add('hidden');
    if (mediaStream) {
      mediaStream.getTracks().forEach(function (t) {
        t.stop();
      });
      mediaStream = null;
    }
    const live = document.getElementById('mp-preview');
    if (live) {
      live.srcObject = null;
      live.classList.add('hidden');
    }
  }

  function reRecord() {
    if (draft) {
      draft.hasVideo = false;
      draft.videoId = null;
      draft._previewUrl = null;
      draft._pendingBlob = null;
    }
    stopMedia(false);
    const pb = document.getElementById('mp-playback');
    if (pb) {
      pb.classList.add('hidden');
      pb.removeAttribute('src');
    }
    const live = document.getElementById('mp-preview');
    if (live) live.classList.remove('hidden');
    toast('Ready to re-record');
  }

  function stopMedia(clearPreview) {
    if (recordTimerId) {
      clearInterval(recordTimerId);
      recordTimerId = null;
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop();
      } catch (e) {
        /* ignore */
      }
    }
    mediaRecorder = null;
    if (mediaStream) {
      mediaStream.getTracks().forEach(function (t) {
        t.stop();
      });
      mediaStream = null;
    }
    setupTeleprompter(false);
    if (clearPreview !== false && draft) {
      /* keep blob */
    }
  }

  function runCountdown() {
    return new Promise(function (resolve) {
      const el = document.getElementById('mp-countdown');
      if (!el) {
        resolve();
        return;
      }
      let n = 3;
      el.textContent = String(n);
      el.classList.remove('hidden');
      const id = setInterval(function () {
        n -= 1;
        if (n <= 0) {
          clearInterval(id);
          el.classList.add('hidden');
          resolve();
        } else {
          el.textContent = String(n);
        }
      }, 700);
    });
  }

  function updateTimer() {
    const el = document.getElementById('mp-timer');
    const hint = document.getElementById('mp-timer-hint');
    if (el) {
      const m = Math.floor(recordSeconds / 60);
      const s = recordSeconds % 60;
      el.textContent = m + ':' + String(s).padStart(2, '0');
      el.classList.toggle('is-warn', recordSeconds >= 59);
      el.classList.toggle('is-over', recordSeconds >= 75);
    }
    if (hint) {
      if (recordSeconds >= 75) hint.textContent = 'Wrap up';
      else if (recordSeconds >= 59) hint.textContent = 'Great length — land your CTA';
      else hint.textContent = 'Target ~0:59';
    }
  }

  function setupTeleprompter(on) {
    const tp = document.getElementById('mp-teleprompter');
    if (!tp) return;
    if (teleprompterRaf) {
      cancelAnimationFrame(teleprompterRaf);
      teleprompterRaf = null;
    }
    if (!on) {
      tp.classList.remove('is-on');
      tp.innerHTML = '';
      return;
    }
    const text = (draft && draft.script) || '';
    tp.innerHTML = '<div class="mp-tp-inner">' + escapeHtml(text) + '</div>';
    tp.classList.add('is-on');
    const inner = tp.querySelector('.mp-tp-inner');
    let y = 40;
    const speed = 0.35; // px per frame ~ slow read
    function tick() {
      y -= speed;
      if (inner) inner.style.transform = 'translateY(' + y + 'px)';
      teleprompterRaf = requestAnimationFrame(tick);
    }
    teleprompterRaf = requestAnimationFrame(tick);
  }

  async function acceptVideoBlob(blob, durationSec) {
    if (!draft) return;
    const id = draft.videoId || draft.id + '_vid';
    draft.videoId = id;
    draft.hasVideo = true;
    draft.videoMime = blob.type || 'video/webm';
    draft.videoDurationSec = durationSec || 0;
    draft._pendingBlob = blob;
    if (draft._previewUrl) {
      try {
        URL.revokeObjectURL(draft._previewUrl);
      } catch (e) {
        /* ignore */
      }
    }
    draft._previewUrl = URL.createObjectURL(blob);
    try {
      await idbPut(id, blob);
    } catch (e) {
      console.warn('[My Pitch] IDB put failed — keeping in-memory blob', e);
      toast('Video kept for this session; storage may be limited.', 'info');
    }
    draft.updatedAt = new Date().toISOString();
    saveDraft();
    const pb = document.getElementById('mp-playback');
    if (pb) {
      pb.src = draft._previewUrl;
      pb.classList.remove('hidden');
    }
    toast('Video captured — preview, then continue');
  }

  async function handleUpload(file) {
    if (!file) return;
    if (!/^video\//.test(file.type) && !/\.(mp4|webm|mov|m4v)$/i.test(file.name || '')) {
      toast('Please upload a video file (mp4, webm, mov).', 'error');
      return;
    }
    // duration check via video element
    const url = URL.createObjectURL(file);
    const dur = await new Promise(function (resolve) {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = function () {
        resolve(v.duration || 0);
        URL.revokeObjectURL(url);
      };
      v.onerror = function () {
        resolve(0);
        URL.revokeObjectURL(url);
      };
      v.src = url;
    });
    if (dur > 180) {
      toast('Video is over 3 minutes — trim closer to ~59 seconds for best results.', 'error');
    } else if (dur > 90) {
      toast('Longer than 90s — consider a tighter cut.');
    }
    await acceptVideoBlob(file, Math.round(dur));
    render();
  }

  async function loadDetailVideo() {
    const p = pitches.find(function (x) {
      return x.id === activePitchId;
    });
    if (!p || !p.hasVideo || !p.videoId) return;
    const el = document.getElementById('mp-detail-video');
    if (!el) return;
    try {
      const blob = await idbGet(p.videoId);
      if (blob) el.src = URL.createObjectURL(blob);
    } catch (e) {
      /* ignore */
    }
  }

  async function downloadDraftVideo() {
    const blob = draft && (draft._pendingBlob || (draft.videoId && (await idbGet(draft.videoId))));
    if (!blob) {
      toast('No video to download', 'error');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (draft.name || 'my-pitch').replace(/\s+/g, '-').toLowerCase() + '.webm';
    a.click();
  }

  // ─── Library / share ───────────────────────────────────────

  function openDetail(id) {
    stopMedia();
    activePitchId = id;
    view = 'detail';
    render();
  }

  function editPitch(id) {
    const p = pitches.find(function (x) {
      return x.id === id;
    });
    if (!p) return;
    draft = JSON.parse(JSON.stringify(p));
    builderStep = p.script ? (p.hasVideo ? 5 : 4) : 2;
    if (!p.script && Object.keys(p.answers || {}).length) builderStep = 3;
    if (!Object.keys(p.answers || {}).length) builderStep = 2;
    view = 'builder';
    saveDraft();
    render();
  }

  async function deletePitch(id) {
    if (!window.confirm('Delete this pitch? This cannot be undone.')) return;
    const p = pitches.find(function (x) {
      return x.id === id;
    });
    if (p && p.videoId) await idbDel(p.videoId);
    pitches = pitches.filter(function (x) {
      return x.id !== id;
    });
    savePitches();
    if (activePitchId === id) {
      activePitchId = null;
      view = 'home';
    }
    render();
    toast('Pitch deleted');
  }

  function duplicatePitch(id) {
    const p = pitches.find(function (x) {
      return x.id === id;
    });
    if (!p) return;
    const copy = JSON.parse(JSON.stringify(p));
    copy.id = uid();
    copy.name = (p.name || 'Pitch') + ' (copy)';
    copy.videoId = null;
    copy.hasVideo = false;
    copy.primaryConsumer = false;
    copy.primaryRealtor = false;
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = copy.createdAt;
    pitches.unshift(copy);
    savePitches();
    toast('Duplicated (video not copied — re-record or upload)');
    render();
  }

  function setPrimary(id) {
    const p = pitches.find(function (x) {
      return x.id === id;
    });
    if (!p) return;
    if (p.type === 'realtor') {
      pitches.forEach(function (x) {
        x.primaryRealtor = x.id === id;
      });
      toast('Primary realtor pitch set');
    } else {
      pitches.forEach(function (x) {
        x.primaryConsumer = x.id === id;
      });
      toast('Primary consumer pitch set');
    }
    savePitches();
    render();
  }

  async function persistDraftToLibrary() {
    if (!draft) return null;
    const nameEl = document.getElementById('mp-pitch-name');
    if (nameEl && nameEl.value.trim()) draft.name = nameEl.value.trim();
    if (!draft.name) {
      const meta = PITCH_TYPES[draft.type] || PITCH_TYPES.consumer;
      draft.name =
        meta.shortLabel +
        ' · ' +
        new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    draft.updatedAt = new Date().toISOString();
    if (draft._pendingBlob && draft.videoId) {
      try {
        await idbPut(draft.videoId, draft._pendingBlob);
        draft.hasVideo = true;
      } catch (e) {
        /* keep flag if already set */
      }
    }
    const clean = JSON.parse(JSON.stringify(draft));
    delete clean._pendingBlob;
    delete clean._previewUrl;
    const idx = pitches.findIndex(function (x) {
      return x.id === clean.id;
    });
    if (idx >= 0) pitches[idx] = clean;
    else pitches.unshift(clean);
    savePitches();

    // Vault a text copy for My Saved Items (unique title so re-save does not un-toggle)
    if (typeof window.toggleSaveIdea === 'function' && clean.script) {
      try {
        const vaultTitle =
          'My Pitch: ' + clean.name + ' · ' + new Date().toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          });
        window.toggleSaveIdea(
          vaultTitle,
          clean.script +
            '\n\n— ' +
            (PITCH_TYPES[clean.type] || {}).label +
            ' · Sales Coach Pitch',
          null,
          'pitch'
        );
      } catch (e) {
        /* ignore */
      }
    }
    if (typeof window.trackCoachEvent === 'function') {
      try {
        window.trackCoachEvent({
          tool: 'my-pitch',
          action: 'save',
          eventName: 'pitch_saved',
          label: clean.type
        });
      } catch (e) {
        /* ignore */
      }
    }
    return clean.id;
  }

  function buildSms(pitch) {
    if (!pitch) return '';
    const prof = profileBits();
    const meta = PITCH_TYPES[pitch.type] || PITCH_TYPES.consumer;
    const excerpt = String(pitch.script || '')
      .trim()
      .split(/\s+/)
      .slice(0, 55)
      .join(' ');
    return (
      'Hey — quick intro from ' +
      prof.name +
      ' (' +
      prof.company +
      (prof.nmls ? ', NMLS ' + prof.nmls : '') +
      ').\n\n' +
      excerpt +
      (excerpt.length < String(pitch.script || '').trim().length ? '…' : '') +
      '\n\n' +
      (prof.phone ? 'Call/text: ' + prof.phone + '\n' : '') +
      (prof.email ? 'Email: ' + prof.email + '\n' : '') +
      '(' +
      meta.shortLabel +
      ' · Sales Coach Pitch)'
    );
  }

  function emailPitch(pitch) {
    if (!pitch) return;
    const prof = profileBits();
    const subject = encodeURIComponent(
      (pitch.name || 'My elevator pitch') + ' — ' + prof.name
    );
    const body = encodeURIComponent(
      buildSms(pitch) + '\n\nFull script:\n\n' + (pitch.script || '')
    );
    window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
  }

  function copyText(text, okMsg) {
    if (!text) {
      toast('Nothing to copy', 'error');
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          toast(okMsg || 'Copied');
        },
        function () {
          fallbackCopy(text, okMsg);
        }
      );
    } else fallbackCopy(text, okMsg);
  }

  function fallbackCopy(text, okMsg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      toast(okMsg || 'Copied');
    } catch (e) {
      toast('Copy failed', 'error');
    }
    ta.remove();
  }

  function showQr(text) {
    const box = document.getElementById('mp-qr-box');
    if (!box) return;
    const data = encodeURIComponent(String(text || '').slice(0, 800));
    const src =
      'https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=' + data;
    box.innerHTML =
      '<p class="mp-hint">QR encodes your text intro (scan to read / share). Online image.</p>' +
      '<img src="' +
      src +
      '" alt="Pitch QR code" width="220" height="220" class="mp-qr-img">' +
      '<a class="mp-btn mp-btn-sm mp-btn-ghost" href="' +
      src +
      '" download="my-pitch-qr.png" target="_blank" rel="noopener">Open / save PNG</a>';
    box.classList.remove('hidden');
  }

  async function openSharePage(pitch) {
    if (!pitch) return;
    const prof = profileBits();
    let videoHtml = '';
    if (pitch.hasVideo && pitch.videoId) {
      try {
        const blob =
          pitch._pendingBlob ||
          (await idbGet(pitch.videoId));
        if (blob) {
          const url = URL.createObjectURL(blob);
          videoHtml =
            '<video controls playsinline style="width:100%;border-radius:16px;background:#000;max-height:420px" src="' +
            url +
            '"></video>';
        }
      } catch (e) {
        /* ignore */
      }
    }
    if (!videoHtml) {
      videoHtml =
        '<div style="padding:48px;text-align:center;background:#f1f5f9;border-radius:16px;color:#64748b">Video not attached on this device</div>';
    }
    const html =
      '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' +
      escapeHtml(prof.name) +
      ' — Pitch</title>' +
      '<style>body{font-family:system-ui,sans-serif;margin:0;background:#0f172a;color:#e2e8f0}' +
      '.wrap{max-width:560px;margin:0 auto;padding:24px}' +
      'h1{font-size:1.5rem;margin:0 0 4px;color:#fff}' +
      '.meta{color:#94a3b8;font-size:.9rem;margin-bottom:20px}' +
      '.script{background:#1e293b;padding:20px;border-radius:16px;line-height:1.55;margin:20px 0}' +
      '.cta a{display:inline-block;margin:6px 8px 6px 0;padding:12px 18px;border-radius:999px;background:#00A89D;color:#fff;text-decoration:none;font-weight:700}' +
      '.foot{margin-top:28px;font-size:12px;color:#64748b}</style></head><body><div class="wrap">' +
      '<h1>' +
      escapeHtml(prof.name) +
      '</h1>' +
      '<div class="meta">' +
      escapeHtml(prof.title) +
      ' · ' +
      escapeHtml(prof.company) +
      (prof.nmls ? ' · NMLS ' + escapeHtml(prof.nmls) : '') +
      (prof.location ? '<br>' + escapeHtml(prof.location) : '') +
      '</div>' +
      videoHtml +
      '<div class="script">' +
      escapeHtml(pitch.script || '') +
      '</div>' +
      '<div class="cta">' +
      (prof.phone
        ? '<a href="tel:' + escapeHtml(prof.phone) + '">Call</a>'
        : '') +
      (prof.phone
        ? '<a href="sms:' + escapeHtml(prof.phone) + '">Text</a>'
        : '') +
      (prof.email
        ? '<a href="mailto:' + escapeHtml(prof.email) + '">Email</a>'
        : '') +
      '</div>' +
      '<div class="foot">Shared from Ruoff Loan Officer Sales Coach · My Pitch</div>' +
      '</div></body></html>';
    const blob = new Blob([html], { type: 'text/html' });
    const pageUrl = URL.createObjectURL(blob);
    window.open(pageUrl, '_blank', 'noopener');
  }

  // ─── Init ──────────────────────────────────────────────────

  function onEnterMyPitch(opts) {
    opts = opts || {};
    pitchUiBooted = true;
    loadPitches();
    const d = loadDraft();
    if (d && (d.script || d.type)) draft = d;

    if (opts.start) {
      firstRunOpen = false;
      firstRunHandledThisVisit = true;
      startBuilder(opts.start);
      return;
    }

    // Fresh enter → pitch home; offer first-run once (click-to-open only, not hover)
    if (view !== 'builder' && view !== 'detail') view = 'home';
    maybeOpenFirstRunOnEnter();
    render();
  }

  function init() {
    const section = document.getElementById('my-pitch');
    if (!section) return;
    loadPitches();
    const d = loadDraft();
    if (d && (d.script || d.type)) draft = d;

    // Lazy: do not mount full UI / fixed modals while user is on Home
    if (isMyPitchVisible() || (location.hash || '').replace(/^#/, '') === 'my-pitch') {
      onEnterMyPitch();
    } else {
      // Lightweight placeholder only — no overlays
      const el = root();
      if (el && !el.querySelector('.mp-shell')) {
        el.innerHTML =
          '<div class="text-center py-16 text-gray-500" aria-hidden="true">' +
          '<i class="fas fa-microphone-alt text-3xl text-[#00A89D] mb-3"></i>' +
          '<p class="font-semibold m-0">My Pitch</p>' +
          '</div>';
      }
    }

    // Chain showSection hook — enter only when section is actually shown
    const prevHook = window.onCoachSectionShown;
    window.onCoachSectionShown = function (id) {
      if (typeof prevHook === 'function') {
        try {
          prevHook(id);
        } catch (e) {
          /* ignore */
        }
      }
      if (id === 'my-pitch') {
        if (window.__mpPendingStart) {
          const t = window.__mpPendingStart;
          window.__mpPendingStart = null;
          onEnterMyPitch({ start: t });
        } else {
          onEnterMyPitch();
        }
      } else if (firstRunOpen) {
        // Leaving My Pitch: close first-run overlay so it cannot cover other tools
        firstRunOpen = false;
        const el = root();
        if (el) {
          const modal = el.querySelector('.mp-modal');
          if (modal) modal.remove();
        }
      }
    };

    console.log('%c[my-pitch] Sales Coach Pitch ready (lazy enter)', 'color:#00A89D');
  }

  window.openMyPitch = function openMyPitch(opts) {
    opts = opts || {};
    // Skip first-run if jumping straight into a type wizard
    if (opts.start) {
      firstRunOpen = false;
      firstRunHandledThisVisit = true;
      window.__mpPendingStart = opts.start;
    }
    if (typeof window.showSection === 'function') window.showSection('my-pitch');
    // onCoachSectionShown may have run already; apply pending start if any
    if (window.__mpPendingStart) {
      const t = window.__mpPendingStart;
      window.__mpPendingStart = null;
      onEnterMyPitch({ start: t });
    }
  };

  window.myPitchStart = function (type) {
    window.openMyPitch({ start: type || 'consumer' });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('coach-features-loaded', function () {
    if (!document.getElementById('my-pitch')) return;
    if (!pitchUiBooted) init();
  });
})();
