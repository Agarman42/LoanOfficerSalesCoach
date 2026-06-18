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

  // Realtor tool — no Ruoff LO blog publishing portal
  const BLOG_ENABLE_RUOFF_PUBLISH = false;

  function getRuoffPublishButtonHtml() {
    if (!BLOG_ENABLE_RUOFF_PUBLISH) return '';
    return `
        <button id="jump-publish-btn" class="bg-[#00A89D] text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-md hover:bg-[#008F85] transition-all flex items-center justify-center gap-2 flex-1">
            <i class="fas fa-external-link-alt"></i> Publish on Site
        </button>`;
  }

  function getBlogFeedbackHtml() {
    return `
    <!-- Feedback / Refine (like Newsletter) -->
    <div class="mt-8 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-3xl p-8">
        <label class="block text-lg font-semibold text-[#00A89D] mb-3">Feedback / Specific Edits (Optional)</label>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Tweak tone, length, examples, or emphasis without starting over. The blog, caption, Google post, and Reel script will all be updated together.</p>
        <textarea id="blog-feedback" rows="3" class="w-full p-4 rounded-2xl border-2 border-[#00A89D] bg-white dark:bg-gray-800" placeholder="e.g., Make the intro warmer, shorten by ~200 words, add more local market stats, tone down the humor in the FAQ."></textarea>
        <button id="blog-refine-btn" class="mt-4 w-full md:w-auto bg-gradient-to-r from-[#00A89D] to-[#F15A29] text-white py-4 px-10 rounded-full font-bold text-lg shadow-xl flex items-center justify-center gap-2 mx-auto">
            <i class="fas fa-redo"></i> Refine with Edits
        </button>
        <p class="text-xs text-center text-gray-500 mt-2">AI edits only what you ask while keeping the full bundle structure.</p>
    </div>`;
  }

  function patchRestoredBlogOutput(html) {
    let patched = html || '';
    if (BLOG_ENABLE_RUOFF_PUBLISH && !patched.includes('id="jump-publish-btn"')) {
      patched = patched.replace(
        /(<button id="download-blog-btn"[\s\S]*?<\/button>)/,
        `$1${getRuoffPublishButtonHtml()}`
      );
    }
    if (!patched.includes('id="blog-feedback"')) {
      patched += getBlogFeedbackHtml();
    }
    return patched;
  }

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
      email: central.email || '',
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

    return parts.length ? parts.join('. ') + '.' : 'Write in a helpful, trustworthy, conversational voice for a local real estate professional.';
  }

  function trimBundleSectionEdges(text) {
    return (text || '')
      .replace(/^(?:\s*---\s*\n?)+/, '')
      .replace(/(?:\n?\s*---\s*)+$/, '')
      .trim();
  }

  /** Split API response into blog + caption + Google + Reel using section labels (not every ---). */
  function parseBlogBundleFromResponse(fullContent) {
    const content = (fullContent || '').trim();
    const fallback = { blogMarkdown: content, captionText: '', googlePostText: '', reelScriptText: '' };
    if (!content) return fallback;

    const markerDefs = [
      { key: 'captionText', regex: /(?:^|\n)\s*(?:---\s*)?\*{0,2}Suggested Social Media Caption:?\*{0,2}\s*/i },
      { key: 'googlePostText', regex: /(?:^|\n)\s*(?:---\s*)?\*{0,2}Suggested Google Post:?\*{0,2}\s*/i },
      { key: 'reelScriptText', regex: /(?:^|\n)\s*(?:---\s*)?\*{0,2}30-45 Second Reel Script(?:\s*&\s*Video Idea)?:?\*{0,2}\s*/i },
    ];

    const markers = [];
    for (const def of markerDefs) {
      const match = def.regex.exec(content);
      if (match) {
        markers.push({ key: def.key, index: match.index, end: match.index + match[0].length });
      }
    }

    if (markers.length === 0) {
      const parts = content.split(/(?:^|\n)---\s*\n?\s*(?=\*{0,2}(?:Suggested Social Media Caption|Suggested Google Post|30-45 Second Reel Script))/i);
      if (parts.length >= 2) {
        const result = {
          blogMarkdown: trimBundleSectionEdges(parts[0]),
          captionText: '',
          googlePostText: '',
          reelScriptText: '',
        };
        if (parts.length >= 4) {
          result.captionText = trimBundleSectionEdges(parts[1]);
          result.googlePostText = trimBundleSectionEdges(parts[2]);
          result.reelScriptText = trimBundleSectionEdges(parts[3]);
        } else if (parts.length >= 3) {
          result.captionText = trimBundleSectionEdges(parts[1]);
          result.googlePostText = trimBundleSectionEdges(parts[2]);
        } else {
          result.captionText = trimBundleSectionEdges(parts[1]);
        }
        return result;
      }
      return fallback;
    }

    markers.sort((a, b) => a.index - b.index);

    const result = {
      blogMarkdown: trimBundleSectionEdges(content.slice(0, markers[0].index)),
      captionText: '',
      googlePostText: '',
      reelScriptText: '',
    };

    for (let i = 0; i < markers.length; i++) {
      const start = markers[i].end;
      const end = i + 1 < markers.length ? markers[i + 1].index : content.length;
      result[markers[i].key] = trimBundleSectionEdges(content.slice(start, end));
    }

    return result;
  }

  // =====================================================
  // ORIGINAL BLOG CREATOR CODE (moved verbatim)
  // =====================================================

// ==================== REALTOR BLOG DOCUMENT UPLOAD ====================
let blogUploadedFileText = '';
let lastBlogBundle = null; // { blogMarkdown, captionText, googlePostText, reelScriptText, topicInput }

const blogUploadArea = document.getElementById('blog-upload-area');
const blogFileInput = document.getElementById('blog-file-upload');

if (blogUploadArea && blogFileInput) {
    // Click to browse (anywhere on area except the explicit Browse label, which handles natively via <label for>)
    blogUploadArea.addEventListener('click', (e) => {
        if (!e.target.closest('label')) {
            blogFileInput.click();
        }
    });

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

    // Reset the file input value so the user can select the same file again later if needed
    const fi = document.getElementById('blog-file-upload');
    if (fi) fi.value = '';
}

window.removeBlogUploadedFile = function() {
    blogUploadedFileText = '';
    document.getElementById('blog-file-upload').value = '';
    document.getElementById('blog-file-name').classList.add('hidden');
    document.getElementById('blog-remove-file-btn').classList.add('hidden');
};

async function generateBlog(feedback = '') {
    console.log('%c[blog-creator] generateBlog() called', feedback ? 'with feedback' : 'fresh', 'color:#00A89D');

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

    // Use centralized force for consistent premium progress modal
    const loadingTitle = feedback ? 'Refining Your Blog Post...' : 'Building Your Authority Blog Post...';
    if (typeof window.forceShowGlobalLoading === 'function') {
      window.forceShowGlobalLoading(loadingTitle);
    }

    if (loadingEl) loadingEl.dataset.originalContent = loadingEl.innerHTML;

    // === INJECT BLOG-SPECIFIC LOADING CONTENT ===
const blogLoadingContent = `
        <div class="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
            <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-3xl border border-gray-200 dark:border-gray-700">
                <div class="text-center mb-8">
                    <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#F15A29] mb-5"></div>
                    <h3 class="text-3xl font-bold text-[#002B5C] dark:text-white mb-2 tracking-tight">Building Your Authority Blog Post...</h3>
                    <p class="text-lg text-gray-700 dark:text-gray-300 mb-1">45–90 seconds. We’re creating the full package for you.</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Full SEO/GEO-optimized blog + social caption + Google Business post + 30-45s Reel script</p>
                </div>

                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                    <h4 class="text-xl font-bold text-[#F15A29] mb-5 text-center">
                        What Makes This Blog Post Powerful
                    </h4>
                    <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                        <div class="flex gap-3">
                            <i class="fas fa-search text-[#F15A29] mt-0.5"></i>
                            <div><strong>Ranks for months:</strong> SEO-optimized long-form content drives inbound leads on autopilot long after you post.</div>
                        </div>
                        <div class="flex gap-3">
                            <i class="fas fa-share-alt text-[#00A89D] mt-0.5"></i>
                            <div><strong>Multiplies across channels:</strong> Becomes the foundation for 5–10 social posts, Reels, and newsletter features.</div>
                        </div>
                        <div class="flex gap-3">
                            <i class="fas fa-user-tie text-[#002B5C] mt-0.5"></i>
                            <div><strong>Positions you as expert:</strong> Clients and referral partners remember and refer the agent who publishes thoughtful local content.</div>
                        </div>
                        <div class="flex gap-3">
                            <i class="fas fa-cogs text-[#F15A29] mt-0.5"></i>
                            <div><strong>Feeds your whole system:</strong> One strong piece fuels weeks of content with minimal extra effort.</div>
                        </div>
                    </div>
                </div>

                <p class="text-center text-xs text-gray-500 dark:text-gray-400 mt-5">
                    Pro move: While you wait, think about one recent client win or local stat you can weave in after generation.
                </p>
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

    const systemPrompt = `You are an expert real estate content writer creating high-quality, GEO-optimized, authority-building content for real estate agents. Write in the exact voice and style of this specific realtor: ${personalization}

Key Requirements:
- Length: Exactly aim for the middle of ${lengthGuide} range (e.g., ~1,750 words for 1,500–2,000). Do not generate shorter—expand with more detailed explanations, additional examples, sub-sections, or relevant anecdotes to reach the word count while keeping it engaging and reader-focused. 
- Tone: ${tone}
${tone.toLowerCase().includes('hilarious') ? '- HILARIOUS MODE: Make it laugh-out-loud funny! Use clever wordplay, relatable real estate humor, self-deprecating jokes, exaggerated analogies, and witty observations. Keep it light-hearted and entertaining while still being helpful — never mean-spirited. Sprinkle humor throughout (intro, body, headings, FAQs). Readers should smile or chuckle multiple times.' : ''}
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
- Avoid: Any "trigger terms" that could lead to fair housing or compliance issues
- Do not start the blog with Imagine this or Picture this. 
- Voice: Match the realtor's personality and voice traits above — helpful, trustworthy, conversational, and authentic — never salesy.
- Language: Check the "Additional instructions" / additional context field. If the user requests a different language there (e.g. "Prepare the full blog in Spanish", "Generate in French", "in German", "en español"), produce the **entire output** — the blog post, the social media caption, the Google Business post, **and** the Reel script — fully in that requested language. Translate everything naturally and accurately while preserving the exact required structure, headings, SEO intent, and professional tone.

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
        finalPrompt += `\n\nAdditional instructions / special requests (including any language requests such as "in Spanish" or "prepare in French"): ${safeAdditional}`;
    }

    finalPrompt += `\n\nTopic: ${topicInput}`;

    if (feedback) {
        if (!lastBlogBundle) {
            alert('Generate a blog first, then use feedback to refine it.');
            window.hideLoading?.();
            return;
        }
        finalPrompt = `You are an expert real estate content editor. The user already has a complete blog bundle (blog + social caption + Google post + Reel script). Apply ONLY the requested edits while keeping the same overall structure and section labels.

USER FEEDBACK / REQUESTED EDITS:
${feedback}

CURRENT FULL OUTPUT (edit this — return the COMPLETE revised bundle using the exact section labels below):

[BLOG POST — full markdown]
${lastBlogBundle.blogMarkdown}

**Suggested Social Media Caption:**
${lastBlogBundle.captionText}

**Suggested Google Post:**
${lastBlogBundle.googlePostText}

**30-45 Second Reel Script & Video Idea:**
${lastBlogBundle.reelScriptText}

Return the FULL updated output in this order: blog markdown first, then **Suggested Social Media Caption:**, then **Suggested Google Post:**, then **30-45 Second Reel Script & Video Idea:**. Do NOT use --- as section separators (the blog may contain --- horizontal rules). Same rules as original (no word counts, clean markdown). Topic context: ${topicInput}`;
    }

    try {
        // Centralized API call (Phase 0) - no more hardcoded key
        let fullContent = await window.callGrokAPI(finalPrompt, {
            temperature: feedback ? 0.35 : 0.25,
            max_tokens: 18000
        });

        if (!fullContent) throw new Error('Empty response from API');

        const { blogMarkdown, captionText, googlePostText, reelScriptText } = parseBlogBundleFromResponse(fullContent);

        lastBlogBundle = { blogMarkdown, captionText, googlePostText, reelScriptText, topicInput };

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
        ${getRuoffPublishButtonHtml()}
        <button onclick="if(typeof window.saveBlogToVault==='function') window.saveBlogToVault(); else alert('Save ready after refresh');" class="bg-[#002B5C] text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-md hover:bg-[#001429] transition-all flex items-center justify-center gap-2 flex-1">
            <i class="fas fa-bookmark"></i> Save Bundle to Vault
        </button>
        <button onclick="if(window.clearSavedBlog){window.clearSavedBlog();}" class="bg-red-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-md hover:bg-red-600 transition-all flex items-center justify-center gap-2 flex-1">
            <i class="fas fa-trash"></i> Clear
        </button>
    </div>

    <!-- Social Caption Card - consistent premium card style (matching 2026 Plan supporting cards) -->
    <div class="bg-white dark:bg-gray-900 border-2 border-[#F15A29]/20 rounded-3xl p-8 mb-8 shadow-xl">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-[#F15A29]">Social Media Caption</h3>
            <div class="flex items-center gap-2">
            <button id="copy-caption-btn" class="text-sm px-4 py-2 bg-[#00A89D] text-white rounded-xl hover:bg-[#008F85] flex items-center gap-2">
                <i class="fas fa-share-alt"></i> Copy
            </button>
            <button id="save-caption-btn" onclick="if(typeof window.saveBlogAsset==='function') window.saveBlogAsset('caption', this)" class="text-sm px-4 py-2 border border-[#00A89D] text-[#00A89D] rounded-xl hover:bg-[#00A89D] hover:text-white flex items-center gap-2">
                <i class="far fa-bookmark"></i> Save
            </button>
            </div>
        </div>
        <div id="social-caption" class="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl text-base whitespace-pre-wrap font-medium border border-gray-200 dark:border-gray-700">
            ${captionText || 'No caption generated — try regenerating!'}
        </div>
    </div>

    <!-- Google Post Card -->
    <div class="bg-white dark:bg-gray-900 border-2 border-[#F15A29]/20 rounded-3xl p-8 mb-8 shadow-xl">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-[#F15A29]">Google Business Profile Post</h3>
            <div class="flex items-center gap-2">
            <button id="copy-google-btn" class="text-sm px-4 py-2 bg-[#F15A29] text-white rounded-xl hover:bg-[#F15A29]/90 flex items-center gap-2">
                <i class="fas fa-copy"></i> Copy
            </button>
            <button id="save-google-btn" onclick="if(typeof window.saveBlogAsset==='function') window.saveBlogAsset('google', this)" class="text-sm px-4 py-2 border border-[#F15A29] text-[#F15A29] rounded-xl hover:bg-[#F15A29] hover:text-white flex items-center gap-2">
                <i class="far fa-bookmark"></i> Save
            </button>
            </div>
        </div>
        <div id="google-post" class="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl text-base prose border border-gray-200 dark:border-gray-700">
            ${googlePostText ? marked.parse(googlePostText) : 'No Google post generated — try a different topic or regenerate.'}
        </div>
    </div>

    <!-- Reel Script Card + cross link to related tools for better UX -->
    <div class="bg-white dark:bg-gray-900 border-2 border-[#F15A29]/20 rounded-3xl p-8 shadow-xl">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-[#F15A29]">30–45 Second Reel / Video Script</h3>
            <div class="flex items-center gap-2">
            <button id="copy-reel-btn" class="text-sm px-4 py-2 bg-[#00A89D] text-white rounded-xl hover:bg-[#008F85] flex items-center gap-2">
                <i class="fas fa-video"></i> Copy Script
            </button>
            <button id="save-reel-btn" onclick="if(typeof window.saveBlogAsset==='function') window.saveBlogAsset('reel', this)" class="text-sm px-4 py-2 border border-[#00A89D] text-[#00A89D] rounded-xl hover:bg-[#00A89D] hover:text-white flex items-center gap-2">
                <i class="far fa-bookmark"></i> Save
            </button>
            </div>
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

    ${getBlogFeedbackHtml()}
`;

        output.classList.remove('hidden');

        document.getElementById('copy-blog-btn').onclick = copyBlogWithFormatting;
        document.getElementById('download-blog-btn').onclick = downloadBlogWord;
        document.getElementById('copy-caption-btn').onclick = copySocialCaption;
        document.getElementById('copy-google-btn').onclick = copyGooglePostWithFormatting;
        const jumpPublishBtn = document.getElementById('jump-publish-btn');
        if (jumpPublishBtn) jumpPublishBtn.onclick = copyBlogAndJumpToPublisher;

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

        // Persist the full generated output (blog + action buttons + supporting assets)
        // so the last version survives page refresh until the user Clears or generates a new one.
        try {
          localStorage.setItem('lastBlogOutput', output.innerHTML);
        } catch (e) {}

        // Re-attach listeners for id-based buttons (safe to call on fresh gen)
        attachBlogOutputListeners();

        const refineBtn = document.getElementById('blog-refine-btn');
        if (refineBtn) {
            refineBtn.onclick = () => {
                const fb = document.getElementById('blog-feedback')?.value.trim() || '';
                if (!fb) { alert('Please enter feedback or specific edits first!'); return; }
                generateBlog(fb);
            };
        }
        if (feedback) {
            const fbEl = document.getElementById('blog-feedback');
            if (fbEl) fbEl.value = '';
        }

        gtag('event', feedback ? 'edit_blog' : 'generate_blog', {
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

window.saveBlogAsset = function(assetType, btnEl) {
    if (typeof window.toggleSaveIdea !== 'function') {
        alert('Saved Items system not ready yet.');
        return;
    }
    const output = document.getElementById('blog-output');
    const blogTitle = output?.querySelector('h3')?.innerText || 'Blog Post';
    const map = {
        caption: { el: 'social-caption', label: 'Social Caption' },
        google: { el: 'google-post', label: 'Google Business Post' },
        reel: { el: 'reel-script', label: 'Reel / Video Script' }
    };
    const cfg = map[assetType];
    if (!cfg) return;
    const node = document.getElementById(cfg.el);
    const text = node ? (node.innerText || node.textContent || '').trim() : '';
    if (!text) {
        alert(`No ${cfg.label.toLowerCase()} to save yet.`);
        return;
    }
    const title = `Blog Asset — ${cfg.label}: ${blogTitle.substring(0, 50)}`;
    const rich = `<div class="blog-asset-saved"><div class="text-xs uppercase tracking-widest font-bold text-[#F15A29] mb-2">${cfg.label}</div><div class="p-4 bg-gray-50 dark:bg-gray-800 border rounded-2xl text-sm whitespace-pre-wrap">${text.replace(/</g, '&lt;')}</div><div class="text-[10px] text-gray-500 mt-2">From Blog Creator • ${blogTitle}</div></div>`;
    window.toggleSaveIdea(title, rich, btnEl, 'blog');
    if (window.showToast) window.showToast(`${cfg.label} saved to My Saved Items`, 'success');
    else if (typeof window.showSavedFeedback === 'function') window.showSavedFeedback('Saved to My Saved Items');
};

window.saveBlogToVault = function() {
    if (typeof window.toggleSaveIdea !== 'function') {
        alert('Saved Items system not ready yet.');
        return;
    }
    const output = document.getElementById('blog-output');
    if (!output || !output.innerHTML.trim()) {
        alert('Generate a blog first.');
        return;
    }

    // Collect the pieces
    let blogTitle = output.querySelector('h3') ? output.querySelector('h3').innerText : 'Custom Blog Post';
    let blogHtml = output.querySelector('.prose') ? output.querySelector('.prose').innerHTML : '';
    const captionEl = document.getElementById('social-caption');
    const caption = captionEl ? captionEl.innerText : '';
    const googleEl = document.getElementById('google-post');
    const google = googleEl ? googleEl.innerText : '';
    const reelEl = document.getElementById('reel-script');
    const reel = reelEl ? reelEl.innerText : '';

    // Extract the real blog post title from the first heading in the content (better than the generic "Your Custom Blog Post")
    const proseEl = output.querySelector('.prose');
    if (proseEl) {
      const firstHead = proseEl.querySelector('h1, h2');
      if (firstHead) {
        blogTitle = firstHead.innerText.trim();
        // Remove the first heading from the HTML so we don't duplicate the big title inside the saved view
        blogHtml = blogHtml.replace(/<h[12][^>]*>.*?<\/h[12]>/i, '').trim();
      }
    }

    const baseTitle = `Blog: ${blogTitle.substring(0, 60)}${blogTitle.length > 60 ? '...' : ''}`;
    // Append timestamp so multiple blogs can be saved in batches without overwriting previous saves
    const title = baseTitle + ' — ' + new Date().toISOString().slice(0, 16).replace('T', ' ');

    // Polished, self-contained saved bundle with controlled typography so huge headings don't dominate or overlap
    const richContent = `
<div class="blog-saved border border-gray-200 dark:border-gray-700 rounded-3xl overflow-hidden bg-white dark:bg-gray-900">
  <div class="px-5 py-4 bg-gradient-to-r from-[#F15A29]/5 via-white to-white dark:via-gray-900 dark:to-gray-900 border-b border-gray-100 dark:border-gray-800">
    <div class="flex items-center gap-2">
      <span class="inline-block px-3 py-0.5 text-[10px] font-bold tracking-[1.5px] rounded-full bg-[#F15A29] text-white">BLOG + MULTI-CHANNEL BUNDLE</span>
      <span class="text-[10px] text-gray-400">Social • Google • Reel</span>
    </div>
    <div class="mt-2 text-xl font-bold text-[#002B5C] dark:text-white leading-tight">${blogTitle}</div>
  </div>

  <div class="p-5">
    <div class="mb-4">
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-xs uppercase font-semibold tracking-wider text-gray-500">Full Blog Post</span>
        <button onclick="const c=this.closest('.blog-saved').querySelector('.blog-post-content'); navigator.clipboard.writeText(c.innerText.trim()); const o=this.innerHTML; this.innerHTML='✓ Copied'; setTimeout(()=>this.innerHTML=o,1400);" class="text-[10px] px-2 py-px rounded border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-medium">Copy Post</button>
      </div>
      <div class="blog-post-content p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm prose prose-sm dark:prose-invert max-w-none overflow-auto max-h-[340px] leading-relaxed
        [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-[#002B5C] dark:[&_h1]:text-white [&_h1]:mt-0 [&_h1]:mb-2
        [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-1.5
        [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-3
        [&_p]:mb-3 [&_p]:text-gray-700 dark:[&_p]:text-gray-300
        [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1
      ">
        ${blogHtml}
      </div>
    </div>

    <div class="text-xs uppercase font-semibold tracking-wider text-gray-500 mb-2">Supporting Assets</div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3 bg-white dark:bg-gray-800">
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs font-semibold text-[#F15A29]">Social Caption</span>
          <button onclick="navigator.clipboard.writeText(this.closest('div').querySelector('.asset-content').innerText.trim()); const o=this.innerHTML; this.innerHTML='✓'; setTimeout(()=>this.innerHTML=o,1200);" class="text-[9px] text-[#00A89D] hover:underline">copy</button>
        </div>
        <div class="asset-content text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-2 rounded border leading-snug">${caption || '—'}</div>
      </div>
      <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3 bg-white dark:bg-gray-800">
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs font-semibold text-[#F15A29]">Google Business Post</span>
          <button onclick="navigator.clipboard.writeText(this.closest('div').querySelector('.asset-content').innerText.trim()); const o=this.innerHTML; this.innerHTML='✓'; setTimeout(()=>this.innerHTML=o,1200);" class="text-[9px] text-[#00A89D] hover:underline">copy</button>
        </div>
        <div class="asset-content text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-2 rounded border leading-snug">${google || '—'}</div>
      </div>
      <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3 bg-white dark:bg-gray-800">
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs font-semibold text-[#F15A29]">Reel / Video Script</span>
          <button onclick="navigator.clipboard.writeText(this.closest('div').querySelector('.asset-content').innerText.trim()); const o=this.innerHTML; this.innerHTML='✓'; setTimeout(()=>this.innerHTML=o,1200);" class="text-[9px] text-[#00A89D] hover:underline">copy</button>
        </div>
        <div class="asset-content text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-2 rounded border leading-snug">${reel || '—'}</div>
      </div>
    </div>
  </div>

  <div class="px-5 py-2.5 bg-gray-50 dark:bg-gray-800 border-t text-[10px] text-gray-400">One asset, 4+ channels. Repurpose the post and supporting pieces freely.</div>
</div>`;

    window.toggleSaveIdea(title, richContent, null, 'blog');
    if (window.showToast) {
        window.showToast('Full blog bundle saved to My Saved Items', 'success');
    } else {
        alert('Saved to My Saved Items');
    }
};

// Clear the last persisted blog output (tool UI only — the rich blog + assets reappear on reload until this or a new generate).
// My Saved Items (Vault) copies are independent and stay until the user deletes them from the library.
window.clearSavedBlog = function() {
  try { localStorage.removeItem('lastBlogOutput'); } catch (e) {}
  lastBlogBundle = null;
  const out = document.getElementById('blog-output');
  if (out) {
    out.innerHTML = '';
    out.classList.add('hidden');
  }
};

// Re-attach onclick handlers for the buttons that use element ids (the ones inside the persisted HTML).
// Called after fresh generate and after restoring lastBlogOutput on init.
function attachBlogOutputListeners() {
  const copyBtn = document.getElementById('copy-blog-btn');
  if (copyBtn) copyBtn.onclick = copyBlogWithFormatting;
  const dlBtn = document.getElementById('download-blog-btn');
  if (dlBtn) dlBtn.onclick = downloadBlogWord;
  const capBtn = document.getElementById('copy-caption-btn');
  if (capBtn) capBtn.onclick = copySocialCaption;
  const googBtn = document.getElementById('copy-google-btn');
  if (googBtn) googBtn.onclick = copyGooglePostWithFormatting;
  const jumpBtn = document.getElementById('jump-publish-btn');
  if (jumpBtn) jumpBtn.onclick = copyBlogAndJumpToPublisher;

  const refineBtn = document.getElementById('blog-refine-btn');
  if (refineBtn) {
    refineBtn.onclick = () => {
      const fb = document.getElementById('blog-feedback')?.value.trim() || '';
      if (!fb) { alert('Please enter feedback or specific edits first!'); return; }
      generateBlog(fb);
    };
  }

  const copyReelBtn = document.getElementById('copy-reel-btn');
  if (copyReelBtn) {
    copyReelBtn.onclick = () => {
      const reelEl = document.getElementById('reel-script');
      if (!reelEl) return;
      const text = reelEl.innerText || reelEl.textContent || '';
      navigator.clipboard.writeText(text.trim()).then(() => {
        alert('Reel script & video idea copied!');
      }).catch(() => {
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
    const filename = titleEl ? titleEl.innerText.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_blog.doc' : 'realtor_blog.doc';
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

    // Restore last generated blog bundle (the full output with post + assets + action buttons) so it survives refresh.
    // Stays until the user clicks Clear (in the output area) or generates a fresh version.
    try {
      const last = localStorage.getItem('lastBlogOutput');
      const out = document.getElementById('blog-output');
      if (last && out && !out.innerHTML.trim()) {
        out.innerHTML = patchRestoredBlogOutput(last);
        out.classList.remove('hidden');
        attachBlogOutputListeners();
        try { localStorage.setItem('lastBlogOutput', out.innerHTML); } catch (e) {}
      }
    } catch (e) {}

    console.log('%c[blog-creator.js] Blog Creator initialized', 'color:#00A89D');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlogCreator);
  } else {
    initBlogCreator();
  }

})();
