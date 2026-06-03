/**
 * js/features/blog-creator.js
 *
 * Blog Creator – Authority-Building Content
 * Extracted from monolithic index.html (Phase 1)
 *
 * Features moved:
 * - PDF.js document upload + text extraction (processBlogFile)
 * - generateBlog with reference document injection
 * - Blog tips modal (open/close)
 * - Copy with formatting, jump to publisher, download as .doc
 * - All related state (blogUploadedFileText) and listeners
 *
 * Self-initializes. Exposes public API on window.
 */

(function () {
  'use strict';

  // =====================================================
  // CENTRAL PROFILE INTEGRATION (consistent with other tools)
  // =====================================================
  function getCentralProfile() {
    try {
      if (window.getUserProfile) return window.getUserProfile();
      return JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch (e) {
      return {};
    }
  }

  function getEffectiveSetup() {
    const central = getCentralProfile();
    // Blog Creator doesn't have its own local setup, so just return central + any legacy
    return {
      ...central,
      // Provide safe defaults
      name: central.name || '',
      localArea: central.localArea || central.market || '',
      voiceTraits: central.voiceTraits || [],
      personality: central.personality || '',
      tone: central.tone || 'Friendly & Relatable',
      targetPartners: central.targetPartners || [],
      goals: central.goals || '',
      challenges: central.challenges || ''
    };
  }

  // Build a rich personalization string for the prompt
  function buildBlogPersonalization(profile) {
    const eff = getEffectiveSetup();
    let parts = [];

    if (eff.personality) parts.push(`Your personality: ${eff.personality}`);
    if (eff.voiceTraits && eff.voiceTraits.length) parts.push(`Voice traits: ${eff.voiceTraits.join(', ')}`);
    if (eff.tone) parts.push(`Preferred tone: ${eff.tone}`);
    if (eff.localArea) parts.push(`Primary market: ${eff.localArea}`);
    if (eff.targetPartners && eff.targetPartners.length) parts.push(`Ideal audience/referral partners: ${eff.targetPartners.join(', ')}`);
    if (eff.goals) parts.push(`Current focus/goals: ${eff.goals}`);
    if (eff.challenges) parts.push(`Key challenges you help clients with: ${eff.challenges}`);

    return parts.length ? parts.join('. ') + '.' : 'Write in a helpful, trustworthy, conversational voice for a local mortgage professional.';
  }

  // =====================================================
  // ORIGINAL BLOG CREATOR CODE (moved verbatim)
  // =====================================================

// ==================== LOAN OFFICER BLOG DOCUMENT UPLOAD ====================
let blogUploadedFileText = '';

const blogUploadArea = document.getElementById('blog-upload-area');
const blogFileInput = document.getElementById('blog-file-upload');

if (blogUploadArea && blogFileInput) {
    // Click to browse
    blogUploadArea.addEventListener('click', () => blogFileInput.click());

    // Drag & Drop
    blogUploadArea.addEventListener('dragover', e => { e.preventDefault(); blogUploadArea.classList.add('dragover'); });
    blogUploadArea.addEventListener('dragleave', () => blogUploadArea.classList.remove('dragover'));
    blogUploadArea.addEventListener('drop', e => {
        e.preventDefault();
        blogUploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) processBlogFile(file);
    });

    blogFileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) processBlogFile(file);
    });
}

async function processBlogFile(file) {
    document.getElementById('blog-file-name').classList.remove('hidden');
    document.getElementById('blog-file-name').textContent = file.name;
    document.getElementById('blog-remove-file-btn').classList.remove('hidden');

    if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(' ') + '\n\n';
        }
        blogUploadedFileText = fullText.trim();
    } else {
        const reader = new FileReader();
        reader.onload = ev => blogUploadedFileText = ev.target.result.trim();
        reader.readAsText(file);
    }
}

window.removeBlogUploadedFile = function() {
    blogUploadedFileText = '';
    document.getElementById('blog-file-upload').value = '';
    document.getElementById('blog-file-name').classList.add('hidden');
    document.getElementById('blog-remove-file-btn').classList.add('hidden');
};

async function generateBlog() {
    console.log('%c[blog-creator] generateBlog() called', 'color:#00A89D');

    // Ensure latest local area is persisted before generation
    const localInput = document.getElementById('blog-local-area');
    if (localInput) {
        const val = localInput.value.trim();
        if (val) {
            try {
                const current = getCentralProfile();
                if (current.localArea !== val || current.market !== val) {
                    current.localArea = val;
                    current.market = val;
                    localStorage.setItem('userProfile', JSON.stringify(current));
                }
            } catch (e) {}
        }
    }

    let topicInput = document.getElementById('blog-topic').value;

    // === DEBUG: Show exactly what came from the input field ===
    console.log('=== DEBUG START ===');
    console.log('Raw topicInput (length):', topicInput.length);
    console.log('Raw topicInput (JSON):', JSON.stringify(topicInput));

    // Aggressive sanitization (this fixes the invisible character issue)
    topicInput = topicInput
        .replace(/[\u2018\u2019\u201C\u201D]/g, "'")   // smart quotes
        .replace(/[\u2013\u2014]/g, '-')               // en/em dashes
        .replace(/\u00A0/g, ' ')                       // non-breaking spaces
        .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')   // zero-width characters
        .replace(/\s+/g, ' ')                          // collapse all whitespace
        .trim();

    console.log('Sanitized topicInput:', topicInput);
    console.log('Sanitized length:', topicInput.length);
    console.log('=== DEBUG END ===');

    const tone = document.getElementById('blog-tone').value;
    const lengthSelect = document.getElementById('blog-length')?.value || 'short';
    const keywordInput = document.getElementById('blog-keyword')?.value.trim() || '';
    const localArea = document.getElementById('blog-local-area')?.value.trim() || '';

    const additionalContext = document.getElementById('blog-additional-context')?.value.trim() || '';
    const fileContext = blogUploadedFileText || '';

    if (!topicInput) {
        alert('Please select or type a blog topic');
        return;
    }

    const output = document.getElementById('blog-output');
    const loadingEl = document.getElementById('global-loading');

    if (loadingEl) loadingEl.dataset.originalContent = loadingEl.innerHTML;

    // === INJECT BLOG-SPECIFIC LOADING CONTENT ===
const blogLoadingContent = `
        <div class="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
            <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-3xl border-2 border-[#F15A29]/30">
                <div class="text-center mb-8">
                    <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#F15A29] mb-5"></div>
                    <h3 class="text-3xl font-bold text-[#002B5C] dark:text-white mb-2 tracking-tight">Building Your Authority Blog Post...</h3>
                    <p class="text-lg text-gray-700 dark:text-gray-300 mb-1">45–90 seconds. We’re creating the full package for you.</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Full SEO/GEO-optimized blog + social caption + Google Business post + 30-45s Reel script</p>
                </div>

                <div class="bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl p-6 mb-6">
                    <div class="text-[#F15A29] font-semibold text-sm tracking-wider mb-3 text-center">WHAT WE'RE BUILDING RIGHT NOW</div>
                    <div class="space-y-2.5 text-sm text-gray-700 dark:text-gray-300">
                        <div class="flex gap-3"><i class="fas fa-check text-[#00A89D] mt-1"></i> <div><strong>Analyzing your profile</strong> — voice, tone, local market, goals &amp; challenges</div></div>
                        <div class="flex gap-3"><i class="fas fa-check text-[#00A89D] mt-1"></i> <div><strong>Researching fresh angles</strong> — local stats, programs, and timely hooks for 2026</div></div>
                        <div class="flex gap-3"><i class="fas fa-check text-[#00A89D] mt-1"></i> <div><strong>Drafting the full post</strong> — 600-2,000 words, H2 structure, SEO keywords, FAQ, soft CTA</div></div>
                        <div class="flex gap-3"><i class="fas fa-check text-[#00A89D] mt-1"></i> <div><strong>Creating the 4-asset bundle</strong> — blog + ready-to-post social caption + Google post + film-ready Reel script</div></div>
                        <div class="flex gap-3"><i class="fas fa-check text-[#00A89D] mt-1"></i> <div><strong>Final polish</strong> — natural flow, compliance-safe language, your authentic voice</div></div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
                    <div class="text-sm font-semibold text-[#002B5C] dark:text-white mb-2 flex items-center gap-2">
                        <i class="fas fa-lightbulb text-[#F15A29]"></i> 
                        Why this single blog post is high-leverage
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
                        <div>• Ranks on Google for months and drives inbound leads on autopilot</div>
                        <div>• Becomes the foundation for 5–10 social posts, Reels, and newsletter features</div>
                        <div>• Positions you as the local expert — clients and realtors remember and refer you</div>
                        <div>• One strong piece of content can feed your whole content system for weeks</div>
                    </div>
                    <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-[10px] text-[#00A89D] font-medium">
                        Pro move: While you wait, think about one recent client win or local stat you can add after generation.
                    </div>
                </div>
            </div>
        </div>
    `;

if (loadingEl) loadingEl.innerHTML = blogLoadingContent;

    output.classList.add('hidden');
    if (loadingEl) {
        loadingEl.classList.remove('hidden');
    }
    output.innerHTML = '';

    const lengthGuide = lengthSelect === 'long' ? '1,500–2,000 words' : lengthSelect === 'medium' ? '1,000-1,500 words' : '600-1,000 words';

    // Pull rich personalization from the central Profile
    const profile = getCentralProfile();
    const richProfile = getEffectiveSetup();
    const personalization = buildBlogPersonalization(richProfile);

    const systemPrompt = `You are an expert mortgage content writer creating high-quality, GEO-optimized, authority-building content for loan officers. Write in the exact voice and style of this specific loan officer: ${personalization}

Key Requirements:
- Length: Exactly aim for the middle of ${lengthGuide} range (e.g., ~1,750 words for 1,500–2,000). Do not generate shorter—expand with more detailed explanations, additional examples, sub-sections, or relevant anecdotes to reach the word count while keeping it engaging and reader-focused. 
- Tone: ${tone}
${tone.toLowerCase().includes('hilarious') ? '- HILARIOUS MODE: Make it laugh-out-loud funny! Use clever wordplay, relatable mortgage humor, self-deprecating jokes, exaggerated analogies, and witty observations. Keep it light-hearted and entertaining while still being helpful — never mean-spirited. Sprinkle humor throughout (intro, body, headings, FAQs). Readers should smile or chuckle multiple times.' : ''}
- Write a complete blog post on: ${topicInput}
- Primary SEO keyword/phrase (use naturally throughout, especially in title if it fits, intro, H2s, and body — aim for 1–2% density with semantic variations): ${keywordInput || 'Optimize naturally for the main topic'}
- Local Area (incorporate relevant local insights, programs, statistics, or examples if applicable to the topic and it fits naturally; otherwise, keep general/US-wide): ${localArea || 'None provided'}
- Structure:
  - Engaging, clickable title (incorporate primary keyword if it fits naturally)
  - Strong intro hook that grabs attention and includes the primary keyword early
  - H2 subheadings for scannability (add more subheadings if needed to reach length)
  - Short paragraphs (3–5 sentences max)
  - Bullet or numbered lists where helpful (expand lists with more items or details for length)
  - Bold key phrases for emphasis
  - Research the most common consumer questions about this topic and naturally answer them throughout the post (add extra related questions to extend content)
  - Dedicated FAQ section near the end (H2: "Frequently Asked Questions") answering the top 4–6 real consumer questions in clear, helpful bullet format (elaborate on answers to add words)
  - Soft CTA at end: "Ready to explore your options? Reach out — I’m here to help."
- SEO/GEO: Reader-first writing, natural keywords, local relevance where it fits the topic
- Avoid: Any "trigger terms" that could lead to compliance issues
- Never mention lenders other than Ruoff Mortgage. 
- Do not start the blog with Imagine this or Picture this. 
- Voice: Match the loan officer's personality and voice traits above — helpful, trustworthy, conversational, and authentic — never salesy.

After the blog post, add a clear separator (---) followed by a short, clearly labeled social media caption (e.g., **Suggested Social Media Caption:**). Keep the caption 100–200 characters, engaging, and include 4–6 relevant hashtags. **Do NOT include any character count at the end — output clean caption text only.**

Add another separator (---) followed by a clearly labeled Google Business Profile post (e.g., **Suggested Google Post:**) optimized for SEO/GEO. This must be under 1400 characters total. Make it a standalone teaser/summary of the blog that can be copied/pasted directly into Google Business Profile. Maximize SEO/GEO by naturally incorporating the primary keyword, local area references (if provided), related terms, and calls-to-action. Use engaging language, emojis if fitting the tone. **Do NOT include any character count at the end — output clean post text only.** Ensure it's formatted in plain text with bold (**text**) where emphasis helps.

Add a final separator (---) followed by a clearly labeled 30–45 second Reel / Short Video Script & Idea (e.g., **30-45 Second Reel Script & Video Idea:**). 
Provide: strong 3s hook, full spoken script (~30-45s), key visuals/B-roll ideas, suggested audio style, and a natural CTA that drives back to the blog topic. Keep it film-ready and concise.

ABSOLUTE RULE: NEVER include any word count, character count, or length estimate at the end of the blog, caption, Google post, or Reel script — output clean content only.

Output ONLY clean Markdown (standard syntax: # for H1, ## for H2, **bold**, *italic*, - bullets, etc.) followed by the separators and the four sections — no HTML tags, no extra commentary, no code fences, no explanations.`;
    // === STRONG DOCUMENT INJECTION (this is the fix) ===
let finalPrompt = systemPrompt;

    if (fileContext) {
        // Prevent 413 "Payload Too Large" errors — cap uploaded documents at ~6k characters
        const MAX_DOC_CHARS = 6000;
        let safeFileContext = fileContext;
        if (fileContext.length > MAX_DOC_CHARS) {
            safeFileContext = fileContext.substring(0, MAX_DOC_CHARS) +
                `\n\n[Note: Document was truncated because it was very long. Only the first ${MAX_DOC_CHARS} characters were used.]`;
            console.warn('[blog-creator] Uploaded document was truncated to avoid payload size error.');
        }
        finalPrompt += `\n\n=== CRITICAL REFERENCE DOCUMENT — USE ONLY THESE FACTS ===\n${safeFileContext}\n=== END DOCUMENT ===`;
    }

    if (additionalContext) {
        const MAX_ADDITIONAL = 3000;
        let safeAdditional = additionalContext;
        if (additionalContext.length > MAX_ADDITIONAL) {
            safeAdditional = additionalContext.substring(0, MAX_ADDITIONAL) + ' [...] (truncated for size)';
        }
        finalPrompt += `\n\nAdditional instructions: ${safeAdditional}`;
    }

    finalPrompt += `\n\nTopic: ${topicInput}`;

    try {
        // Centralized API call (Phase 0) - no more hardcoded key
        let fullContent = await window.callGrokAPI(finalPrompt, {
            temperature: 0.25,
            max_tokens: 18000
        });

        if (!fullContent) throw new Error('Empty response from API');

        // === SPLIT + AGGRESSIVE CLEANING (now supports 4 sections: blog + social + google + reel) ===
        let blogMarkdown = fullContent;
        let captionText = '';
        let googlePostText = '';
        let reelScriptText = '';

        const parts = fullContent.split(/---\s*/);

        if (parts.length >= 4) {
            blogMarkdown = parts[0].trim();
            captionText = parts[1].trim()
                .replace(/^\**Suggested Social Media Caption:?\**?\s*/i, '')
                .replace(/^\*\*\s*/, '')
                .replace(/^\s+/, '')
                .trim();
            googlePostText = parts[2].trim()
                .replace(/^\**Suggested Google Post:?\**?\s*/i, '')
                .replace(/^\*\*\s*/, '')
                .replace(/^\s+/, '')
                .trim();
            reelScriptText = parts[3].trim()
                .replace(/^\**30-45 Second Reel Script & Video Idea:?\**?\s*/i, '')
                .replace(/^\*\*\s*/, '')
                .replace(/^\s+/, '')
                .trim();
        } else if (parts.length >= 3) {
            blogMarkdown = parts[0].trim();
            captionText = parts[1].trim()
                .replace(/^\**Suggested Social Media Caption:?\**?\s*/i, '')
                .replace(/^\*\*\s*/, '')
                .replace(/^\s+/, '')
                .trim();
            googlePostText = parts[2].trim()
                .replace(/^\**Suggested Google Post:?\**?\s*/i, '')
                .replace(/^\*\*\s*/, '')
                .replace(/^\s+/, '')
                .trim();
        } else if (parts.length === 2) {
            blogMarkdown = parts[0].trim();
            captionText = parts[1].trim()
                .replace(/^\**Suggested Social Media Caption:?\**?\s*/i, '')
                .replace(/^\*\*\s*/, '')
                .replace(/^\s+/, '')
                .trim();
        }

        // === Render output - Premium Card Style matching Social section ===
        output.innerHTML = `
    <!-- Main Blog Content Card - premium match to 2026 Plan / Social Post tools -->
    <div class="bg-white dark:bg-gray-900 border-2 border-[#F15A29]/30 rounded-3xl shadow-2xl p-8 md:p-10 mb-8">
        <!-- Hero header badge like 2026 plan -->
        <div class="flex items-center justify-between mb-6">
            <div>
                <div class="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#F15A29] text-white text-xs font-bold tracking-[2px] mb-3">
                    <i class="fas fa-check-circle"></i> YOUR AUTHORITY BLOG POST IS READY
                </div>
                <h3 class="text-3xl md:text-4xl font-bold text-[#F15A29]">Your Custom Blog Post</h3>
                <p class="text-gray-600 dark:text-gray-400 mt-1 text-sm">SEO + GEO optimized, in your exact voice, with matching social assets.</p>
            </div>
            <span class="text-xs px-3 py-1 bg-[#00A89D]/10 text-[#00A89D] rounded-full font-medium hidden md:block">Ready to publish</span>
        </div>
        <div class="prose prose-lg dark:prose-invert max-w-none">
            ${marked.parse(blogMarkdown)}
        </div>
    </div>

    <!-- Blog Actions -->
    <div class="flex flex-col sm:flex-row gap-4 justify-center mb-10">
        <button id="copy-blog-btn" class="bg-[#F15A29] text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-md hover:bg-[#F15A29]/90 transition-all flex items-center justify-center gap-2 flex-1">
            <i class="fas fa-copy"></i> Copy Blog
        </button>
        <button id="download-blog-btn" class="bg-[#002B5C] text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-md hover:bg-[#001429] transition-all flex items-center justify-center gap-2 flex-1">
            <i class="fas fa-download"></i> Download .doc
        </button>
        <button id="jump-publish-btn" class="bg-[#00A89D] text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-md hover:bg-[#008F85] transition-all flex items-center justify-center gap-2 flex-1">
            <i class="fas fa-external-link-alt"></i> Publish on Site
        </button>
    </div>

    <!-- Social Caption Card - consistent premium card style (matching 2026 Plan supporting cards) -->
    <div class="bg-white dark:bg-gray-900 border-2 border-[#F15A29]/20 rounded-3xl p-8 mb-8 shadow-xl">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-[#F15A29]">Social Media Caption</h3>
            <button id="copy-caption-btn" class="text-sm px-4 py-2 bg-[#00A89D] text-white rounded-xl hover:bg-[#008F85] flex items-center gap-2">
                <i class="fas fa-share-alt"></i> Copy
            </button>
        </div>
        <div id="social-caption" class="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl text-base whitespace-pre-wrap font-medium border border-gray-200 dark:border-gray-700">
            ${captionText || 'No caption generated — try regenerating!'}
        </div>
    </div>

    <!-- Google Post Card -->
    <div class="bg-white dark:bg-gray-900 border-2 border-[#F15A29]/20 rounded-3xl p-8 mb-8 shadow-xl">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-[#F15A29]">Google Business Profile Post</h3>
            <button id="copy-google-btn" class="text-sm px-4 py-2 bg-[#F15A29] text-white rounded-xl hover:bg-[#F15A29]/90 flex items-center gap-2">
                <i class="fas fa-copy"></i> Copy
            </button>
        </div>
        <div id="google-post" class="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl text-base prose border border-gray-200 dark:border-gray-700">
            ${googlePostText ? marked.parse(googlePostText) : 'No Google post generated — try a different topic or regenerate.'}
        </div>
    </div>

    <!-- Reel Script Card + cross link to related tools for better UX -->
    <div class="bg-white dark:bg-gray-900 border-2 border-[#F15A29]/20 rounded-3xl p-8 shadow-xl">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-[#F15A29]">30–45 Second Reel / Video Script</h3>
            <button id="copy-reel-btn" class="text-sm px-4 py-2 bg-[#00A89D] text-white rounded-xl hover:bg-[#008F85] flex items-center gap-2">
                <i class="fas fa-video"></i> Copy Script
            </button>
        </div>
        <div id="reel-script" class="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl text-base prose border border-gray-200 dark:border-gray-700">
            ${reelScriptText ? marked.parse(reelScriptText) : 'No Reel script generated — try regenerating!'}
        </div>
        <p class="text-xs text-gray-500 mt-3">Ready to film — hook, script, visuals, and CTA included.</p>

        <!-- Mini cross-link bar to keep user in the ecosystem (consistent with plan execution hubs) -->
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
            <span>Next steps:</span>
            <a href="#social-post" onclick="if(typeof window.showSection==='function'){window.showSection('social-post');}return false;" class="text-[#00A89D] hover:underline">Turn more ideas into posts in Social Post &amp; Calendar</a>
            <a href="#social" onclick="if(typeof window.showSection==='function'){window.showSection('social');}return false;" class="text-[#00A89D] hover:underline">Browse full strategy + evergreen ideas</a>
        </div>
    </div>
`;

        output.classList.remove('hidden');

        document.getElementById('copy-blog-btn').onclick = copyBlogWithFormatting;
        document.getElementById('download-blog-btn').onclick = downloadBlogWord;
        document.getElementById('copy-caption-btn').onclick = copySocialCaption;
        document.getElementById('copy-google-btn').onclick = copyGooglePostWithFormatting;
        document.getElementById('jump-publish-btn').onclick = copyBlogAndJumpToPublisher;

        const copyReelBtn = document.getElementById('copy-reel-btn');
        if (copyReelBtn) {
            copyReelBtn.onclick = () => {
                const reelEl = document.getElementById('reel-script');
                if (!reelEl) return;
                const text = reelEl.innerText || reelEl.textContent || '';
                navigator.clipboard.writeText(text.trim()).then(() => {
                    alert('Reel script & video idea copied!');
                }).catch(() => {
                    // fallback
                    const range = document.createRange();
                    range.selectNodeContents(reelEl);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                    document.execCommand('copy');
                    sel.removeAllRanges();
                    alert('Reel script & video idea copied!');
                });
            };
        }

        gtag('event', 'generate_blog', {
            event_category: 'Tool Usage',
            event_label: 'Blog Generated',
            value: 1
        });

} catch (error) {
        console.error('[blog-creator] Generation failed:', error);

        let friendlyMessage = 'Error generating content. Please try again.';

        const errorMsg = error?.message || '';
        if (errorMsg.includes('413') || errorMsg.includes('PayloadTooLarge') || errorMsg.includes('too large')) {
            friendlyMessage = `
                <strong>Document too large</strong><br><br>
                The uploaded file + prompt exceeded the server limit.<br>
                <strong>Solutions:</strong><br>
                • Remove the uploaded document, or<br>
                • Use a much shorter PDF/TXT file, or<br>
                • Clear the "Additional Context" box and try again.
            `;
        } else if (errorMsg.includes('API request failed')) {
            friendlyMessage = `API error: ${errorMsg}`;
        }

        output.innerHTML = `
            <div class="text-center py-16">
                <p class="text-red-600 text-xl font-bold mb-4">Generation failed</p>
                <p class="text-gray-700 dark:text-gray-300 max-w-md mx-auto">${friendlyMessage}</p>
            </div>
        `;
        output.classList.remove('hidden');
    } finally {
        if (loadingEl) {
            if (loadingEl.dataset.originalContent) {
                loadingEl.innerHTML = loadingEl.dataset.originalContent;
            }
            loadingEl.classList.add('hidden');
        }
        window.hideLoading?.();   // extra safety in case global helper is used elsewhere
    }
}
function openBlogTips() {
    const modal = document.getElementById('blog-tips-modal');
    if (modal) {
        modal.style.display = 'flex';

        // Close when clicking outside the modal content (on the dark backdrop)
        modal.onclick = function(e) {
            if (e.target === modal) {
                closeBlogTips();
            }
        };
    }
}

function closeBlogTips() {
    const modal = document.getElementById('blog-tips-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.onclick = null;   // clean up the outside-click handler
    }
}

// Rich copy for blog
function copyBlogWithFormatting() {
    const blogContent = document.querySelector('#blog-output .prose');
    if (!blogContent) {
        alert('No blog content to copy!');
        return;
    }
    const html = blogContent.innerHTML;
    const plainText = blogContent.innerText;

    const clipboardItem = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' })
    });

    navigator.clipboard.write([clipboardItem]).then(() => {
        alert('Blog copied with formatting!');
    }).catch(err => {
        console.error('Rich copy failed:', err);
        navigator.clipboard.writeText(plainText).then(() => {
            alert('Copied as plain text (rich formatting not supported in this browser)');
        });
    });
}
function copyBlogAndJumpToPublisher() {
    copyBlogWithFormatting();   // Runs the exact same rich copy + shows your alert

    // Tiny delay so the clipboard finishes before we open the tab (feels instant)
    setTimeout(() => {
        window.open('https://sales.ruoff.com/blog', '_blank');
    }, 250);
}

// Download blog as .doc
function downloadBlogWord() {
    const blogEl = document.querySelector('#blog-output .prose');
    if (!blogEl) {
        alert('No blog content to download!');
        return;
    }

    const header = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Mortgage Blog Post</title><style>
        body {font-family: Calibri, Arial, sans-serif; margin: 60px; line-height: 1.6; color: #000; background: white;}
        h1 {color: #002B5C; text-align: center; font-size: 32px; margin-bottom: 40px;}
        h2 {color: #00A89D; border-bottom: 2px solid #00A89D; padding-bottom: 8px; font-size: 24px; margin-top: 40px;}
        p {margin: 16px 0; font-size: 16px;}
        ul, ol {padding-left: 40px; margin: 16px 0;}
        li {margin: 8px 0;}
        strong {color: #002B5C;}
        a {color: #00A89D;}
    </style></head><body>`;

    const content = blogEl.innerHTML;

    // Properly close the HTML document
    const fullDocument = `${header}${content}</body></html>`;

    const blob = new Blob([fullDocument], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const titleEl = blogEl.querySelector('h1');
    const filename = titleEl ? titleEl.innerText.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_blog.doc' : 'mortgage_blog.doc';
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    alert('Blog downloaded as Word doc! Open in Word for best formatting.');
}

// === Missing helper: Copy the suggested social caption ===
window.copySocialCaption = function copySocialCaption() {
    const captionEl = document.getElementById('social-caption');
    if (!captionEl) return alert('No social caption to copy!');

    const text = captionEl.innerText || captionEl.textContent || '';
    navigator.clipboard.writeText(text.trim()).then(() => {
        alert('Social caption copied!');
    }).catch(() => {
        // Fallback
        const range = document.createRange();
        range.selectNodeContents(captionEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('copy');
        sel.removeAllRanges();
        alert('Social caption copied!');
    });
};

// === Missing helper: Copy the suggested Google post with formatting ===
window.copyGooglePostWithFormatting = function copyGooglePostWithFormatting() {
    const googleEl = document.getElementById('google-post');
    if (!googleEl) return alert('No Google post to copy!');

    const html = googleEl.innerHTML;
    const plainText = googleEl.innerText || '';

    // Try rich copy first
    try {
        const clipboardItem = new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plainText], { type: 'text/plain' })
        });
        navigator.clipboard.write([clipboardItem]).then(() => {
            alert('Google post copied with formatting!');
        }).catch(() => {
            // Fallback to plain text
            navigator.clipboard.writeText(plainText).then(() => {
                alert('Google post copied (plain text).');
            });
        });
    } catch (e) {
        // Very old browser fallback
        navigator.clipboard.writeText(plainText).then(() => {
            alert('Google post copied.');
        });
    }
};


  // =====================================================
  // PUBLIC API EXPOSURE (for HTML onclick handlers)
  // =====================================================
  window.generateBlog = generateBlog;
  window.processBlogFile = processBlogFile;
  window.openBlogTips = openBlogTips;
  window.closeBlogTips = closeBlogTips;
  window.copyBlogWithFormatting = copyBlogWithFormatting;
  window.copyBlogAndJumpToPublisher = copyBlogAndJumpToPublisher;
  window.downloadBlogWord = downloadBlogWord;
  window.copySocialCaption = copySocialCaption;
  window.copyGooglePostWithFormatting = copyGooglePostWithFormatting;

  // =====================================================
  // INITIALIZATION
  // =====================================================
  function initBlogCreator() {
    // The original top-level listeners for the upload area
    // are included in the moved code above.

    // === TOPIC DROPDOWN → CUSTOM TOPIC INPUT SYNC ===
    const topicSelect = document.getElementById('blog-topic-select');
    const topicInput = document.getElementById('blog-topic');

    if (topicSelect && topicInput) {
        topicSelect.addEventListener('change', () => {
            const val = topicSelect.value.trim();
            if (val !== '' && val !== 'Use Custom Topic (type below)') {
                topicInput.value = val;
            }
        });

        // If a topic is pre-selected on load, populate the input
        if (topicSelect.value && topicSelect.value.trim() !== '') {
            topicInput.value = topicSelect.value;
        }
    }

    // =====================================================
    // PERSISTENT LOCAL AREA (saved to central userProfile)
    // =====================================================
    const localInput = document.getElementById('blog-local-area');

    const persistLocalArea = (value) => {
        const trimmed = (value || '').trim();
        if (!trimmed) return;

        try {
            const current = getCentralProfile();
            if (current.localArea !== trimmed || current.market !== trimmed) {
                current.localArea = trimmed;
                current.market = trimmed; // for compatibility with other tools
                localStorage.setItem('userProfile', JSON.stringify(current));
            }
        } catch (e) {
            console.warn('[blog-creator] Failed to persist local area', e);
        }
    };

    if (localInput) {
        // Prefill from central profile
        const prof = getCentralProfile();
        const savedArea = prof.localArea || prof.market || '';
        if (savedArea && !localInput.value) {
            localInput.value = savedArea;
        }

        // Save whenever user leaves the field
        localInput.addEventListener('blur', () => persistLocalArea(localInput.value));

        // Also persist right before generation so the latest value is captured
        const genBtnForPersist = document.getElementById('generate-blog-btn');
        if (genBtnForPersist) {
            genBtnForPersist.addEventListener('click', () => {
                persistLocalArea(localInput.value);
            }, { capture: true });
        }
    }

    // Robust fallback wiring for the generate button (in case inline onclick fails)
    const generateBtn = document.getElementById('generate-blog-btn');
    if (generateBtn) {
        generateBtn.onclick = null; // clear any stale handlers
        generateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('%c[blog-creator] Generate blog button clicked (via listener)', 'color:#00A89D');
            if (typeof window.generateBlog === 'function') {
                window.generateBlog();
            } else {
                console.error('[blog-creator] generateBlog function not found on window');
            }
        });
        console.log('[blog-creator] Generate button listener attached as fallback');
    } else {
        console.warn('[blog-creator] generate-blog-btn not found in DOM');
    }

    console.log('%c[blog-creator.js] Blog Creator initialized', 'color:#00A89D');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlogCreator);
  } else {
    initBlogCreator();
  }

})();
