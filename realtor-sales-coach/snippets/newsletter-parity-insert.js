
// === NEWSLETTER UI PARITY (LO) — photo/video sizing, char meter, preflight ===
const NL_MEDIA_SIZE_DEFAULT = 100;
const NL_MEDIA_SIZE_MIN = 30;
const NL_MEDIA_SIZE_MAX = 100;
const NL_PHOTO_SIZE_DEFAULT = NL_MEDIA_SIZE_DEFAULT;
const NL_PHOTO_SIZE_MIN = NL_MEDIA_SIZE_MIN;
const NL_PHOTO_SIZE_MAX = NL_MEDIA_SIZE_MAX;

const NL_LENGTH_CONFIG = {
    short: {
        preflightLabel: 'Short edition',
        displayLabel: 'Short (~500–600 words)',
        wordRange: '500–600 words total',
        sectionDepth: 'Keep each included section to 2–4 tight paragraphs or bullet clusters.',
        personalNote: 'Personal update: 3–5 sentences max unless the user wrote more.',
        overall: 'Quick, mobile-friendly read. Do not pad with filler.'
    },
    medium: {
        preflightLabel: 'Standard edition',
        displayLabel: 'Standard (~650–750 words)',
        wordRange: '650–750 words total',
        sectionDepth: 'Each included section: 3–5 paragraphs with one clear takeaway.',
        personalNote: 'Personal update: 4–7 sentences — warm but concise.',
        overall: 'Default monthly newsletter depth.'
    },
    long: {
        preflightLabel: 'Long edition',
        displayLabel: 'Long (~800–1,000+ words)',
        wordRange: '800–1,000+ words total',
        sectionDepth: 'Each included section: fuller context, 4–6 paragraphs.',
        personalNote: 'Personal update: can run longer if the user provided rich detail.',
        overall: 'Deep-dive edition — still scannable with headers.'
    }
};

function getNewsletterLengthKey() {
    const raw = (document.getElementById('nl-length')?.value || 'medium').trim().toLowerCase();
    if (raw === 'short' || raw === 'long') return raw;
    return 'medium';
}

function getNewsletterLengthConfig() {
    const key = getNewsletterLengthKey();
    return { key, ...NL_LENGTH_CONFIG[key] };
}

function buildNewsletterLengthPromptBlock() {
    const cfg = getNewsletterLengthConfig();
    return [
        '**LENGTH RULE (user selected ' + cfg.displayLabel + '):**',
        '- Target total newsletter body: ' + cfg.wordRange,
        '- Section depth: ' + cfg.sectionDepth,
        '- ' + cfg.personalNote,
        '- ' + cfg.overall
    ];
}

function getPersonalPhotoWidthPercent() {
    const el = document.getElementById('nl-personal-photo-size');
    const raw = el ? parseInt(el.value, 10) : NL_PHOTO_SIZE_DEFAULT;
    if (Number.isNaN(raw)) return NL_PHOTO_SIZE_DEFAULT;
    return Math.min(NL_PHOTO_SIZE_MAX, Math.max(NL_PHOTO_SIZE_MIN, raw));
}

function getPersonalPhotoWidthPx() {
    return Math.round(EMAIL_WIDTH * getPersonalPhotoWidthPercent() / 100);
}

function formatPersonalPhotoSizeLabel() {
    const pct = getPersonalPhotoWidthPercent();
    const px = getPersonalPhotoWidthPx();
    if (pct >= 100) return `Full width (${px}px)`;
    return `${pct}% (${px}px)`;
}

function buildPersonalPhotoInsert(photoUrl) {
    const px = getPersonalPhotoWidthPx();
    const safeUrl = String(photoUrl || '').trim();
    return `<p style="margin:16px 0 0; text-align:center;"><img src="${safeUrl}" alt="Personal photo" width="${px}" style="display:block; margin:0 auto; max-width:100%; width:${px}px; height:auto; border:0; border-radius:8px;" /></p>`;
}

function updatePersonalPhotoSizeUI() {
    const sizeWrap = document.getElementById('nl-personal-photo-size-wrap');
    const labelEl = document.getElementById('nl-personal-photo-size-label');
    const photoEnabled = !!document.getElementById('nl-include-photo')?.checked && !!document.getElementById('nl-personal')?.checked;
    if (sizeWrap) sizeWrap.classList.toggle('hidden', !photoEnabled);
    if (labelEl) labelEl.textContent = formatPersonalPhotoSizeLabel();
}

function applyPersonalPhotoPreviewSizing() {
    const photoImg = document.getElementById('nl-personal-photo-preview-img');
    if (!photoImg) return;
    const pct = getPersonalPhotoWidthPercent();
    photoImg.style.width = `${pct}%`;
    photoImg.style.maxWidth = 'none';
    photoImg.style.height = 'auto';
}

function getPersonalVideoWidthPercent() {
    const el = document.getElementById('nl-personal-video-size');
    const raw = el ? parseInt(el.value, 10) : NL_MEDIA_SIZE_DEFAULT;
    if (Number.isNaN(raw)) return NL_MEDIA_SIZE_DEFAULT;
    return Math.min(NL_MEDIA_SIZE_MAX, Math.max(NL_MEDIA_SIZE_MIN, raw));
}

function getPersonalVideoWidthPx() {
    return Math.round(EMAIL_WIDTH * getPersonalVideoWidthPercent() / 100);
}

function formatPersonalVideoSizeLabel() {
    const pct = getPersonalVideoWidthPercent();
    const px = getPersonalVideoWidthPx();
    if (pct >= 100) return `Full width (${px}px)`;
    return `${pct}% (${px}px)`;
}

function updatePersonalVideoSizeUI() {
    const sizeWrap = document.getElementById('nl-personal-video-size-wrap');
    const labelEl = document.getElementById('nl-personal-video-size-label');
    const videoEnabled = !!document.getElementById('nl-include-video')?.checked && !!document.getElementById('nl-personal')?.checked;
    if (sizeWrap) sizeWrap.classList.toggle('hidden', !videoEnabled);
    if (labelEl) labelEl.textContent = formatPersonalVideoSizeLabel();
}

function applyPersonalVideoPreviewSizing() {
    const videoThumb = document.getElementById('nl-personal-video-preview-thumb');
    if (!videoThumb) return;
    const pct = getPersonalVideoWidthPercent();
    videoThumb.style.width = `${pct}%`;
    videoThumb.style.maxWidth = 'none';
    videoThumb.style.height = 'auto';
}

const NL_CONTENT_SECTIONS = {
    market: { id: 'nl-market', label: 'Market Updates', headings: ['Market Update', 'Market Updates'] },
    industry: { id: 'nl-industry', label: 'Industry News', headings: ['Industry News', 'Industry Update'] },
    local: { id: 'nl-local', label: 'Local Update', headings: ['Local Update', 'Local Spotlight', 'Around Town'] },
    recipes: { id: 'nl-recipes', label: 'Recipes', headings: ['Recipe', 'Recipes'] },
    fun: { id: 'nl-fun', label: 'Fun Facts', headings: ['Fun Fact', 'Fun Facts'], placeholderId: 'fun-fact-placeholder' },
    tip: { id: 'nl-tip', label: 'Real Estate Tip', headings: ['Pro Tip', 'Real Estate Tip', 'Tip of the Month'], placeholderId: 'pro-tip-placeholder' },
    quote: { id: 'nl-quote', label: 'Motivational Quote', headings: ['Motivational Quote', 'Quote of the Month'], placeholderId: 'quote-placeholder' },
    dadjoke: { id: 'nl-dadjoke', label: 'Dad Joke', headings: ['Dad Joke', 'Dad Joke of the Week'], placeholderId: 'dad-joke-placeholder' },
    puzzle: { id: 'nl-puzzle', label: 'Weekly Brain Teaser', headings: ['Trivia Time', 'Weekly Brain Teaser', 'Brain Teaser'], placeholderId: 'brain-teaser-placeholder' }
};

const NL_CUSTOM_CONTENT_BLOCKS = {
    fun: { checkboxId: 'nl-fun', blockId: 'nl-custom-section-fun', shortLabel: 'Fun Facts' },
    tip: { checkboxId: 'nl-tip', blockId: null, shortLabel: 'Pro Tip' },
    quote: { checkboxId: 'nl-quote', blockId: null, shortLabel: 'Quote' },
    dadjoke: { checkboxId: 'nl-dadjoke', blockId: 'nl-custom-section-dadjoke', shortLabel: 'Dad Joke' },
    puzzle: { checkboxId: 'nl-puzzle', blockId: 'brain-teaser-panel', shortLabel: 'Brain Teaser' }
};

function updateCustomContentChoicesVisibility() {
    const activeLabels = [];
    Object.entries(NL_CUSTOM_CONTENT_BLOCKS).forEach(([key, cfg]) => {
        const cb = document.getElementById(cfg.checkboxId);
        const block = cfg.blockId ? document.getElementById(cfg.blockId) : null;
        const show = !!cb?.checked;
        if (block) block.classList.toggle('hidden', !show);
        if (show) activeLabels.push(cfg.shortLabel);
    });
    const countEl = document.getElementById('nl-custom-content-count');
    if (countEl) {
        countEl.textContent = activeLabels.length ? `${activeLabels.length} active` : '';
        countEl.classList.toggle('hidden', !activeLabels.length);
    }
}

function extractYouTubeVideoId(url) {
    if (!url) return '';
    const raw = String(url).trim();
    let id = '';
    try {
        const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
        const host = parsed.hostname.replace(/^www\./, '');
        if (host === 'youtu.be') id = parsed.pathname.split('/').filter(Boolean)[0] || '';
        else if (host.includes('youtube.com')) {
            if (parsed.pathname.includes('/shorts/')) id = parsed.pathname.split('/shorts/')[1]?.split('/')[0] || '';
            else if (parsed.pathname.includes('/embed/')) id = parsed.pathname.split('/embed/')[1]?.split('/')[0] || '';
            else id = parsed.searchParams.get('v') || '';
        }
    } catch (e) {
        if (raw.includes('youtu.be/')) id = raw.split('youtu.be/')[1]?.split(/[?&#]/)[0] || '';
        else if (raw.includes('shorts/')) id = raw.split('shorts/')[1]?.split(/[?&#]/)[0] || '';
        else if (raw.includes('v=')) id = raw.split('v=')[1]?.split(/[?&#]/)[0] || '';
    }
    id = (id || '').trim();
    return id.length === 11 ? id : '';
}

function buildPersonalVideoTable(personalVideoUrl) {
    const url = String(personalVideoUrl || '').trim();
    if (!url) return '';
    const href = url.startsWith('http') ? url : `https://${url}`;
    const videoId = extractYouTubeVideoId(href);
    const videoWidthPx = getPersonalVideoWidthPx();
    const thumbnailUrl = videoId
        ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        : 'https://via.placeholder.com/560x315/002B5C/FFFFFF?text=Watch+Video';
    return `
<table width="600" cellpadding="0" cellspacing="0" style="background:#f9f9f9; border-left:8px solid #00A89D; border-collapse:separate; max-width:600px;">
  <tr><td style="padding:24px;">
    <p style="margin:0 0 12px; font-size:17px; color:#002B5C; font-weight:700; text-align:center;">Personal Video Update</p>
    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:${videoWidthPx}px; margin:0 auto;">
      <tr><td align="center">
        <a href="${href}" target="_blank" rel="noopener" style="text-decoration:none;">
          <img src="${thumbnailUrl}" alt="Watch video" width="${videoWidthPx}" style="width:100%; max-width:${videoWidthPx}px; height:auto; display:block; border:3px solid #00A89D; border-radius:8px;">
        </a>
      </td></tr>
      <tr><td align="center" style="padding-top:14px;">
        <a href="${href}" target="_blank" rel="noopener" style="display:inline-block; padding:12px 28px; background:#00A89D; color:#fff; font-weight:bold; font-size:16px; text-decoration:none; border-radius:24px;">▶ Watch Video</a>
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

function wrapNewsletterSectionRows(innerHtml) {
    if (!innerHtml) return '';
    return `<tr><td height="20"></td></tr><tr><td align="center" style="padding:0;">${innerHtml}</td></tr><tr><td height="20"></td></tr>`;
}

function injectPersonalVideoSection(html, personalVideoUrl) {
    const videoSection = wrapNewsletterSectionRows(buildPersonalVideoTable(personalVideoUrl));
    let out = String(html || '').replace(/<tr>\s*<td[^>]*>[\s\S]*?Personal Video Update[\s\S]*?<\/table>\s*<\/td>\s*<\/tr>/gi, '');
    if (out.includes('<!-- PERSONAL VIDEO PLACEHOLDER -->')) {
        return out.replace('<!-- PERSONAL VIDEO PLACEHOLDER -->', videoSection);
    }
    const afterPersonal = /(<tr>\s*<td[^>]*>[\s\S]*?A Note From[\s\S]*?<\/table>\s*<\/td>\s*<\/tr>\s*<tr>\s*<td[^>]*height=["']?20["']?[^>]*>\s*<\/td>\s*<\/tr>)/i;
    if (afterPersonal.test(out)) return out.replace(afterPersonal, '$1' + videoSection);
    return out.replace(/(<tr>\s*<td[^>]*background:\s*#002B5C[^>]*>)/i, videoSection + '$1');
}

function stripReferralFromBody(html) {
    let out = String(html || '');
    const headlines = [REFERRAL_CTA_HEADLINE, LEGACY_REFERRAL_CTA_HEADLINE, 'Know Someone Ready to Buy or Refinance?'];
    headlines.forEach((h) => {
        const re = new RegExp('<tr>\\s*<td[^>]*>[\\s\\S]*?' + h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?<\\/table>\\s*<\\/td>\\s*<\\/tr>\\s*(?:<tr>\\s*<td[^>]*height=["\']?20["\']?[^>]*>\\s*<\\/td>\\s*<\\/tr>\\s*)?', 'gi');
        out = out.replace(re, '');
    });
    out = out.replace(/\[REFERRAL CTA PLACEHOLDER\]/gi, '');
    out = out.replace(/<!--\s*REFERRAL CTA PLACEHOLDER\s*-->/gi, '');
    return out;
}

function buildCompactReferralHtml(firstName, email) {
    const mailSubject = encodeURIComponent('Referral from a Friend — Real Estate Help!');
    const mailBody = encodeURIComponent(`Hi ${firstName},\n\nI'd like to refer someone who may need real estate help.\n\nName: \nPhone: \nEmail: \nThey're looking for: (buying / selling / both / not sure)\n\nThanks!\n`);
    const inner = `<table width="600" cellpadding="0" cellspacing="0" style="background:#fafafa;border-top:1px solid #e5e5e5;max-width:600px;width:100%;">
  <tr>
    <td style="padding:14px 24px 18px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
      <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#002B5C;letter-spacing:0.2px;">${REFERRAL_CTA_HEADLINE}</p>
      <p style="margin:0 0 12px;font-size:12px;line-height:1.45;color:#666;">Know someone buying or selling? Forward this email — or tap below.</p>
      <a href="mailto:${escBrandingAttr(email)}?subject=${mailSubject}&body=${mailBody}" style="display:inline-block;padding:9px 20px;background:#00A89D;color:#ffffff;font-size:13px;font-weight:bold;text-decoration:none;border-radius:20px;">Send a Referral</a>
    </td>
  </tr>
</table>`;
    return wrapBrandingForEmail(inner);
}

const NL_PERSONAL_UPDATE_MIN_CHARS = 40;

const NL_PREFLIGHT_CHIP_BASE = 'nl-preflight-chip inline-flex items-center gap-1 text-xs font-semibold pl-3 pr-1 py-1.5 rounded-full';
const NL_PREFLIGHT_CHIP_CLASS = {
    included: `${NL_PREFLIGHT_CHIP_BASE} border-2 border-[#00A89D] bg-[#00A89D]/10 text-[#002B5C] dark:text-white`,
    personal: `${NL_PREFLIGHT_CHIP_BASE} border-2 border-[#F15A29] bg-[#F15A29]/10 text-[#002B5C] dark:text-white`,
    meta: `${NL_PREFLIGHT_CHIP_BASE} border border-gray-200 dark:border-gray-600 bg-[#002B5C]/5 dark:bg-[#002B5C]/30 text-[#002B5C] dark:text-gray-300 font-medium`,
    warn: `${NL_PREFLIGHT_CHIP_BASE} border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200`,
    off: `${NL_PREFLIGHT_CHIP_BASE} border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 font-medium`
};
const NL_PREFLIGHT_CHIP_REMOVE_BTN = 'nl-preflight-chip-remove ml-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-[15px] leading-none text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors';

function buildPreflightChipHtml(chip) {
    const cls = NL_PREFLIGHT_CHIP_CLASS[chip.style] || NL_PREFLIGHT_CHIP_CLASS.included;
    if (!chip.removeId) return `<span class="${cls} pr-3">${chip.text}</span>`;
    const safeId = String(chip.removeId).replace(/"/g, '');
    return `<span class="${cls}"><span>${chip.text}</span><button type="button" class="${NL_PREFLIGHT_CHIP_REMOVE_BTN}" data-nl-preflight-remove="${safeId}" aria-label="Remove" title="Remove">×</button></span>`;
}

function applyPreflightChipRemove(controlId) {
    const el = document.getElementById(controlId);
    if (!el) return;
    el.checked = false;
    el.dispatchEvent(new Event('change', { bubbles: true }));
}

function looksLikeImageUrl(url) {
    const u = String(url || '').trim();
    if (!u) return false;
    if (/^data:image\//i.test(u)) return true;
    if (/\.(jpe?g|png|gif|webp|avif|bmp|svg)(\?|#|$)/i.test(u)) return true;
    return /\/(image|img|photo|media|upload|assets)\//i.test(u);
}

function updatePersonalCharMeter() {
    const personalCb = document.getElementById('nl-personal');
    const meter = document.getElementById('nl-personal-char-meter');
    const countEl = document.getElementById('nl-personal-char-count');
    const barEl = document.getElementById('nl-personal-char-bar');
    const hintEl = document.getElementById('nl-personal-char-hint');
    const textEl = document.getElementById('nl-personal-text');
    if (!meter || !textEl) return;
    const active = !!personalCb?.checked;
    meter.classList.toggle('hidden', !active);
    if (!active) return;
    const len = textEl.value.trim().length;
    const pct = Math.min(100, Math.round((len / NL_PERSONAL_UPDATE_MIN_CHARS) * 100));
    const remaining = Math.max(0, NL_PERSONAL_UPDATE_MIN_CHARS - len);
    const ready = len >= NL_PERSONAL_UPDATE_MIN_CHARS;
    if (countEl) {
        countEl.textContent = `${len} / ${NL_PERSONAL_UPDATE_MIN_CHARS} min`;
        countEl.classList.toggle('text-[#00A89D]', ready);
        countEl.classList.toggle('text-amber-600', !ready);
    }
    if (barEl) {
        barEl.style.width = `${pct}%`;
        barEl.classList.toggle('bg-[#00A89D]', ready);
        barEl.classList.toggle('bg-amber-400', !ready && len > 0);
        barEl.classList.toggle('bg-gray-300', len === 0);
    }
    if (hintEl) {
        if (ready) hintEl.innerHTML = '<span class="text-[#00A89D] font-semibold">✓ Good to go</span> — we polish your words, not invent them.';
        else if (len === 0) hintEl.textContent = `Write at least ${NL_PERSONAL_UPDATE_MIN_CHARS} characters with real details.`;
        else hintEl.textContent = `${remaining} more character${remaining === 1 ? '' : 's'} needed before Generate.`;
    }
}

function updatePersonalMediaPreviews() {
    updatePersonalPhotoSizeUI();
    updatePersonalVideoSizeUI();
    const photoEnabled = !!document.getElementById('nl-include-photo')?.checked && !!document.getElementById('nl-personal')?.checked;
    const videoEnabled = !!document.getElementById('nl-include-video')?.checked && !!document.getElementById('nl-personal')?.checked;
    const photoUrl = (document.getElementById('nl-personal-photo')?.value || '').trim();
    const videoUrl = (document.getElementById('nl-personal-video')?.value || '').trim();
    const photoWrap = document.getElementById('nl-personal-photo-preview-wrap');
    const photoImg = document.getElementById('nl-personal-photo-preview-img');
    const photoStatus = document.getElementById('nl-personal-photo-preview-status');
    const videoWrap = document.getElementById('nl-personal-video-preview-wrap');
    const videoThumb = document.getElementById('nl-personal-video-preview-thumb');
    const videoLink = document.getElementById('nl-personal-video-preview-link');
    const videoStatus = document.getElementById('nl-personal-video-preview-status');

    if (photoWrap && photoImg && photoStatus) {
        if (!photoEnabled || !photoUrl) {
            photoWrap.classList.add('hidden');
            photoImg.removeAttribute('src');
        } else {
            photoWrap.classList.remove('hidden');
            photoImg.onload = () => { applyPersonalPhotoPreviewSizing(); photoStatus.innerHTML = '<span class="text-[#00A89D] font-medium">✓ Image loaded</span>'; };
            photoImg.onerror = () => { photoStatus.innerHTML = '<span class="text-amber-700">⚠ Could not load — check URL</span>'; };
            applyPersonalPhotoPreviewSizing();
            photoImg.src = photoUrl;
        }
    }
    if (videoWrap && videoThumb && videoLink && videoStatus) {
        if (!videoEnabled || !videoUrl) {
            videoWrap.classList.add('hidden');
        } else {
            const href = videoUrl.startsWith('http') ? videoUrl : `https://${videoUrl}`;
            const videoId = extractYouTubeVideoId(href);
            videoWrap.classList.remove('hidden');
            videoLink.href = href;
            if (videoId) {
                videoThumb.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                videoStatus.innerHTML = '<span class="text-[#00A89D] font-medium">✓ YouTube thumbnail preview</span>';
            } else {
                videoThumb.src = 'https://via.placeholder.com/560x200/002B5C/FFFFFF?text=Video';
                videoStatus.innerHTML = '<span class="text-amber-700">⚠ Use a YouTube URL</span>';
            }
            applyPersonalVideoPreviewSizing();
        }
    }
}

function updateNewsletterPreflightSummary() {
    const chipsEl = document.getElementById('nl-preflight-chips');
    const warningsEl = document.getElementById('nl-preflight-warnings');
    const badgeEl = document.getElementById('nl-preflight-ready-badge');
    if (!chipsEl) return;
    const sel = getNewsletterSelections();
    const chips = [];
    const warnings = [];
    const location = document.getElementById('nl-location')?.value.trim() || '';
    const toneLabel = document.getElementById('nl-tone')?.selectedOptions?.[0]?.textContent?.trim().replace(/\s*\(Recommended\)\s*/i, '') || '';
    const lengthLabel = getNewsletterLengthConfig().preflightLabel;
    if (location) chips.push({ text: `📍 ${location}`, style: 'meta' });
    if (toneLabel) chips.push({ text: toneLabel, style: 'meta' });
    chips.push({ text: lengthLabel, style: 'meta' });
    Object.entries(NL_CONTENT_SECTIONS).forEach(([key, cfg]) => {
        if (!sel.contentSections[key] || key === 'puzzle') return;
        chips.push({ text: cfg.label, style: 'included', removeId: cfg.id });
    });
    if (sel.personal) {
        const len = document.getElementById('nl-personal-text')?.value.trim().length || 0;
        chips.push({ text: 'Personal Update ❤️', style: 'personal', removeId: 'nl-personal' });
        if (sel.includePhoto) chips.push({ text: `Photo · ${getPersonalPhotoWidthPercent()}%`, style: 'included', removeId: 'nl-include-photo' });
        if (sel.includeVideo) chips.push({ text: `Video · ${getPersonalVideoWidthPercent()}%`, style: 'included', removeId: 'nl-include-video' });
        if (len < NL_PERSONAL_UPDATE_MIN_CHARS) warnings.push(`Personal Update needs ${NL_PERSONAL_UPDATE_MIN_CHARS - len} more characters.`);
    }
    if (sel.includeReferral) chips.push({ text: 'Referral CTA (below signature)', style: 'included', removeId: 'nl-include-referral' });
    else chips.push({ text: 'Referral CTA off', style: 'off' });
    chipsEl.innerHTML = chips.map((c) => buildPreflightChipHtml(c)).join('');
    if (warningsEl) {
        warningsEl.classList.toggle('hidden', !warnings.length);
        warningsEl.innerHTML = warnings.map((w) => `<li>${w}</li>`).join('');
    }
    const personalOk = !sel.personal || (document.getElementById('nl-personal-text')?.value.trim().length || 0) >= NL_PERSONAL_UPDATE_MIN_CHARS;
    if (badgeEl) {
        badgeEl.textContent = personalOk ? 'READY TO GENERATE' : 'REVIEW SETUP';
        badgeEl.className = personalOk
            ? 'inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[2px] text-[#00A89D] bg-[#00A89D]/15 px-2.5 py-1 rounded-full mb-2'
            : 'inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[2px] text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 rounded-full mb-2';
    }
}

function wireNewsletterLiveFeedback() {
    const root = document.getElementById('newsletter-generator');
    if (!root || root.dataset.nlLiveFeedbackWired === '1') return;
    root.dataset.nlLiveFeedbackWired = '1';
    const refresh = () => {
        updatePersonalCharMeter();
        updatePersonalMediaPreviews();
        updateCustomContentChoicesVisibility();
        updateNewsletterPreflightSummary();
    };
    root.querySelectorAll('input, select, textarea').forEach((el) => {
        el.addEventListener('input', refresh);
        el.addEventListener('change', refresh);
    });
    const preflight = document.getElementById('nl-preflight-summary');
    if (preflight && !preflight.dataset.nlRemoveWired) {
        preflight.dataset.nlRemoveWired = '1';
        preflight.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-nl-preflight-remove]');
            if (!btn) return;
            applyPreflightChipRemove(btn.getAttribute('data-nl-preflight-remove'));
            refresh();
        });
    }
    ['nl-personal-photo-size', 'nl-personal-video-size'].forEach((id) => {
        document.getElementById(id)?.addEventListener('input', refresh);
    });
    refresh();
}

function validatePersonalUpdateForGeneration() {
    const personalCb = document.getElementById('nl-personal');
    if (!personalCb?.checked) return true;
    const text = document.getElementById('nl-personal-text')?.value.trim() || '';
    if (text.length >= NL_PERSONAL_UPDATE_MIN_CHARS) return true;
    document.getElementById('nl-personal-text')?.focus();
    alert(`Please write your Personal Update (${NL_PERSONAL_UPDATE_MIN_CHARS}+ characters) before generating.`);
    return false;
}