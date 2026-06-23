/**
 * js/features/underwriting.js
 *
 * Buyer Financing & Qualification Reference — agent tool for advising clients with lender partner context
 * Polished to match the style and depth of Newsletter, Blog, Social, and Weekly Win tools.
 *
 * Key improvements:
 * - Simple core input (no overwhelming extra fields)
 * - Optional document upload (PDF/text) for lender overlays / agency manuals — text is extracted and injected into the prompt
 * - Dramatically improved prompt for layered, real-world scenarios (stronger reasoning, compensating factors, honest confidence)
 * - True multi-turn conversation on a single scenario (follow-ups, "what if", alternatives, conditions lists, client scripts)
 * - Rich, premium output UI with visual confidence, section cards, per-section copy, and action buttons
 * - Realistic buyer-qualification scenario examples (click to populate)
 * - One-click save of full scenario + answer to My Saved Items
 * - History of the current scenario conversation
 */

(function () {
  'use strict';

  // =====================================================
  // STATE FOR CURRENT SCENARIO (supports conversation)
  // =====================================================
  let currentScenario = {
    question: '',
    loanType: '',
    uploadedDocs: [], // [{ name: string, text: string }]
    history: []       // [{ role: 'user'|'assistant', content: string }]
  };

  function resetCurrentScenario() {
    currentScenario = {
      question: '',
      loanType: '',
      uploadedDocs: [],
      history: []
    };
    // Clear UI elements if present
    const output = document.getElementById('uw-output');
    const followUpArea = document.getElementById('uw-follow-up-area');
    const uploadedList = document.getElementById('uw-uploaded-list');
    if (output) {
      output.innerHTML = '';
      output.classList.add('hidden');
    }
    if (followUpArea) followUpArea.classList.add('hidden');
    if (uploadedList) uploadedList.innerHTML = '';
  }

  // =====================================================
  // FILE UPLOAD (PDF + plain text) — modeled after Blog Creator
  // =====================================================
  async function handleUwFileUpload(file) {
    if (!file) return;

    const uploadedList = document.getElementById('uw-uploaded-list');
    const questionInput = document.getElementById('uw-question');

    let extractedText = '';

    try {
      if (file.type === 'application/pdf' && window.pdfjsLib) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 15); i++) { // cap pages
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map(item => item.str).join(' ') + '\n\n';
        }
        extractedText = fullText.trim();
      } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        extractedText = await file.text();
      } else {
        alert('Please upload a PDF or plain text file (.txt, .md).');
        return;
      }

      // Cap context size (similar to blog creator)
      if (extractedText.length > 12000) {
        extractedText = extractedText.substring(0, 12000) + '\n\n[Document truncated for length]';
      }

      // Add to current scenario
      currentScenario.uploadedDocs.push({
        name: file.name,
        text: extractedText
      });

      // Update UI list
      renderUploadedDocsList();

      // Gentle hint in the question box if empty
      if (questionInput && !questionInput.value.trim()) {
        questionInput.placeholder = `Ask about the uploaded document (${file.name}) or any guideline question...`;
      }

    } catch (e) {
      console.error('UW file processing error', e);
      alert('Could not read the file. Please try a different PDF or text file.');
    }
  }

  function renderUploadedDocsList() {
    const container = document.getElementById('uw-uploaded-list');
    if (!container) return;

    container.innerHTML = '';
    if (currentScenario.uploadedDocs.length === 0) {
      container.classList.add('hidden');
      return;
    }
    container.classList.remove('hidden');

    currentScenario.uploadedDocs.forEach((doc, idx) => {
      const chip = document.createElement('div');
      chip.className = 'inline-flex items-center gap-2 bg-[#00A89D]/10 border border-[#00A89D]/30 text-[#00A89D] text-xs px-3 py-1 rounded-full mr-2 mb-2';
      chip.innerHTML = `
        <span class="font-medium">${doc.name}</span>
        <button class="ml-1 text-[#00A89D] hover:text-red-500" title="Remove">×</button>
      `;
      chip.querySelector('button').onclick = () => {
        currentScenario.uploadedDocs.splice(idx, 1);
        renderUploadedDocsList();
      };
      container.appendChild(chip);
    });
  }

  // Examples grid removed per feedback — replaced with educational "How to structure a question" modal (more universally valuable for unique scenarios).

  // =====================================================
  // CORE SEARCH + CONVERSATION LOGIC
  // =====================================================
  function buildUnderwritingPrompt(newQuestion = null) {
    const isFollowUp = !!newQuestion && currentScenario.history.length > 0;

    let prompt = `You are a senior mortgage financing advisor helping a real estate agent understand a buyer's qualification scenario. You are extremely accurate, practical, and honest about gray areas. You know Fannie Mae, Freddie Mac, FHA, VA, and USDA guidelines deeply, and you understand common investor/lender overlays agents encounter when coordinating with loan partners.

**CRITICAL INSTRUCTION — WHERE TO FIND THE MOST RECENT AGENCY GUIDES (READ THIS FIRST):**
You do NOT have the current exact wording of any agency guidelines memorized from training data (training cutoffs mean it is outdated or imprecise). 

You MUST treat the following as the ONLY sources for any factual claim about guidelines:
- FIRST and HIGHEST PRIORITY: Any text the user has explicitly uploaded in this conversation (treat uploaded overlays, manuals, or guideline excerpts as authoritative for this file).
- SECOND: The live, official, current versions of the guides at these exact public locations (do not use any other URLs or your internal knowledge for wording):
  • Fannie Mae Selling Guide (most current): https://selling-guide.fanniemae.com/
  • Freddie Mac Seller/Servicer Guide (most current): https://guide.freddiemac.com/
  • FHA Handbook 4000.1 (most current, with all updates): https://www.hud.gov/program_offices/housing/rmra/mhs/handbook_4000-1
  • VA Lender's Handbook (most current): https://www.benefits.va.gov/WARMS/pam26_7.asp
  • USDA Rural Development guidelines (most current): https://www.rd.usda.gov/resources/directives

**CRITICAL REASONING PROCESS (you must follow these steps internally before writing any part of the response):**
1. Read the CURRENT QUESTION and CONVERSATION HISTORY.
2. If any relevant guideline text has been UPLOADED, use ONLY that text for your quotes and citations (this overrides everything else).
3. If no relevant upload, you may only direct the user to the precise section at one of the official URLs above. You MUST NOT quote or paraphrase specific current wording from your training data.
4. For the ## Key Guideline Considerations section, first identify the exact source document and section you are using.
5. Only then write the answer, using direct quotes exclusively from uploads or clearly noting that the user must consult the linked official source for the current text.

The user is describing a real, layered, often messy loan scenario. Underwriting is rarely black-and-white — focus on compensating factors, exceptions, overlays, and what an actual underwriter would likely do.

**SOURCE ACCURACY RULE (CRITICAL FOR ALL QUESTIONS):**
- If the user uploaded any guideline text or overlays for this scenario, those are the highest authority. Quote directly from them and cite the filename.
- For anything not in an upload, you may only reference the current official guides by linking to the exact locations listed in the "CRITICAL INSTRUCTION — WHERE TO FIND THE MOST RECENT AGENCY GUIDES" section. 
- NEVER quote or paraphrase specific current wording unless it comes from an upload in this conversation. If you are pointing the user to an official guide, simply give the best section link and a high-level summary of what that section generally covers. Do not invent or recall the exact current text.

When in doubt on a factual detail, be conservative and transparent: say the user must verify the current text at the linked official source.

`;

    // Uploaded documents context — HIGHEST PRIORITY
    if (currentScenario.uploadedDocs.length > 0) {
      prompt += `UPLOADED GUIDELINE DOCUMENTS — THESE TAKE HIGHEST PRIORITY. Answer primarily from these when they address the question:\n`;
      currentScenario.uploadedDocs.forEach((doc, i) => {
        prompt += `\n--- ${doc.name} ---\n${doc.text}\n`;
      });
      prompt += `\nIf the question is not fully answered by the uploads, fall back to the official agency guides listed in the CRITICAL INSTRUCTION section above, citing them with the most specific links and excerpts.\n\n`;
    }

    // Conversation history
    if (currentScenario.history.length > 0) {
      prompt += `CONVERSATION HISTORY FOR THIS SPECIFIC SCENARIO (maintain consistency):\n`;
      currentScenario.history.forEach((turn, i) => {
        prompt += `\n${turn.role === 'user' ? 'Agent:' : 'Advisor:'} ${turn.content}\n`;
      });
      prompt += `\n`;
    }

    // Current question
    const questionToUse = newQuestion || currentScenario.question;
    prompt += `CURRENT QUESTION / SCENARIO:\n${questionToUse}\n\n`;

    prompt += `Loan Type Context: ${currentScenario.loanType || 'General / Any'}\n\n`;

    prompt += `RESPONSE RULES:
- Follow the CRITICAL REASONING PROCESS above before writing anything.
- Think step-by-step like a real senior underwriter.
- Be direct and practical. Call out when something is gray-area or "it depends".
- Always discuss compensating factors that could help or hurt.
- Explicitly call out relevant overlays if the uploaded docs or standard knowledge apply.
- Give a clear Confidence Level: High / Medium / Low with a short reason.
- If the answer would change dramatically under a different agency/program, briefly note it.
- Structure your answer with these exact markdown headers so the UI can render it beautifully:

## Direct Answer
(1-3 clear sentences)

## Key Guideline Considerations
(Use the exact sub-format below for every reference — this section is MANDATORY. Do not summarize or skip. Always start by naming the exact document from the "CRITICAL INSTRUCTION — WHERE TO FIND THE MOST RECENT AGENCY GUIDES" list above, or the exact uploaded file you used.)

- **Source & Section**: [Exact name + section]
  **Relevant excerpt**: "[quote or close paraphrase]"
  **Link**: [markdown link to the precise current location if it's one of the official guides]
  **Application to this file**: [brief explanation]

## Overlays & Investor Impact
(Especially important if user uploaded docs)

## Confidence Level
(High / Medium / Low — explain why in one sentence)

## Compensating Factors & Mitigants
(What could help this file? What would kill it?)

## Recommended Next Steps
(What the agent should do next — including what to ask their lender partner for / document)

## Client-Facing Talking Points (optional but useful)
(1-2 short sentences the agent can use with the buyer — never quote specific rates)

End with this exact disclaimer (no changes):
"**Important:** This is an AI-assisted analysis based on standard guidelines and any documents you provided. Always verify with your lender partner and the most current official guideline manuals. Final underwriting decisions are made by the lender on the file."

Do not add extra fluff or marketing language. Be the calm, experienced financing advisor the agent wishes they had when a buyer scenario gets complicated.`;

    return prompt;
  }

  async function searchUnderwriting(isFollowUp = false, followUpQuestion = null) {
    const mainQuestionInput = document.getElementById('uw-question');
    const followUpInput = document.getElementById('uw-follow-up-input');
    const loanTypeSelect = document.getElementById('uw-loan-type');
    const output = document.getElementById('uw-output');
    const followUpArea = document.getElementById('uw-follow-up-area');

    let question = '';
    let activeInput = null;

    if (isFollowUp) {
      activeInput = followUpInput;
      question = followUpQuestion || (activeInput ? activeInput.value.trim() : '');
    } else {
      activeInput = mainQuestionInput;
      question = activeInput ? activeInput.value.trim() : '';
    }

    if (!question) {
      if (!isFollowUp) alert('Please enter a question');
      return;
    }

    if (!isFollowUp) {
      // Starting fresh scenario
      resetCurrentScenario();
      currentScenario.question = question;
      currentScenario.loanType = loanTypeSelect ? loanTypeSelect.value : 'any';
    }
    // For follow-up we already cleared the input in askUwFollowUp (if it came from there)
    // or we will clear below if needed.

    const loadingTitle = isFollowUp ? 'Analyzing Follow-up Question...' : 'Analyzing Buyer Qualification Scenario...';
    const loadingSub = isFollowUp 
        ? 'Incorporating your new details into the full scenario context.' 
        : 'Cross-referencing agency guidelines, any uploaded overlays/manuals, and compensating factors.';

    // === CUSTOM RICH PROGRESS MODAL (matches premium style of Newsletter, Weekly Win, Blog, etc.) ===
    const loadingEl = document.getElementById('global-loading');
    if (loadingEl) {
        loadingEl.dataset.originalContent = loadingEl.innerHTML;

        const customLoadingHTML = `
            <div class="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
                <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-3xl border border-gray-200 dark:border-gray-700">
                    
                    <div class="text-center mb-8">
                        <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00A89D] mb-5"></div>
                        <h3 class="text-3xl font-bold text-[#002B5C] dark:text-white mb-2 tracking-tight">
                            ${loadingTitle}
                        </h3>
                        <p class="text-lg text-gray-700 dark:text-gray-300 mb-1">
                            This usually takes just a few seconds.
                        </p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            ${loadingSub}
                        </p>
                    </div>

                    <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                        <h4 class="text-xl font-bold text-[#00A89D] mb-5 text-center">
                            While we analyze your scenario
                        </h4>
                        <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                            <div class="flex gap-3">
                                <i class="fas fa-shield-alt text-[#00A89D] mt-0.5"></i>
                                <div><strong>Layered &amp; gray areas:</strong> Real underwriting is rarely black-and-white. We're weighing guidelines, overlays, and compensating factors.</div>
                            </div>
                            <div class="flex gap-3">
                                <i class="fas fa-file-alt text-[#00A89D] mt-0.5"></i>
                                <div><strong>Uploaded context:</strong> Any lender overlays or agency documents you provided are being factored in.</div>
                            </div>
                            <div class="flex gap-3">
                                <i class="fas fa-balance-scale text-[#002B5C] mt-0.5"></i>
                                <div><strong>Practical guidance:</strong> Honest confidence levels and actionable next steps you can take with your lender partner.</div>
                            </div>
                        </div>

                        <div class="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p class="text-xs font-semibold text-[#00A89D] mb-2">Pro Tips:</p>
                            <ul class="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-5">
                                <li>The more specific details you provide (credit, DTI, LTV, recent events), the sharper the analysis.</li>
                                <li>Upload your latest overlays for customized results beyond standard agency rules.</li>
                                <li>Use follow-ups to explore "what if" changes or alternative programs.</li>
                            </ul>
                        </div>
                    </div>

                    <p class="text-center text-xs text-gray-500 dark:text-gray-400 mt-5">
                        AI-assisted analysis — always verify with official guidelines and your lender partner.
                    </p>
                </div>
            </div>
        `;

        loadingEl.innerHTML = customLoadingHTML;
        loadingEl.classList.remove('hidden');
        loadingEl.style.setProperty('display', 'flex', 'important');
        loadingEl.style.setProperty('z-index', '99999', 'important');
        loadingEl.style.setProperty('visibility', 'visible', 'important');
        loadingEl.style.setProperty('opacity', '1', 'important');
        loadingEl.style.setProperty('position', 'fixed', 'important');
        loadingEl.style.setProperty('inset', '0', 'important');
    } else if (typeof window.forceShowGlobalLoading === 'function') {
        window.forceShowGlobalLoading(loadingTitle);
    }

    if (output) {
      if (!isFollowUp) output.innerHTML = '';
      output.classList.add('hidden');
    }

    const prompt = buildUnderwritingPrompt(isFollowUp ? question : null);

    try {
      const answer = await window.callGrokAPI(prompt, {
        temperature: 0.15,          // Very low for maximum consistency and factual accuracy on guideline questions. (Lower than most other tools.)
        max_tokens: 2500
        // Note: We intentionally do NOT override model here (all tools except UW must use the single supported model 'grok-4-1-fast-reasoning').
        // Accuracy for UW comes from: very low temp + explicit "CRITICAL REASONING PROCESS" that forces grounding in provided text first + uploaded docs as highest priority + strict citation + hyperlink requirements in the structured output.
        // For even higher accuracy on complex questions, users should upload the specific guideline sections/overlays relevant to the scenario.
      });

      // Update history
      if (isFollowUp) {
        currentScenario.history.push({ role: 'user', content: question });
        currentScenario.history.push({ role: 'assistant', content: answer });
      } else {
        currentScenario.history = [
          { role: 'user', content: currentScenario.question },
          { role: 'assistant', content: answer }
        ];
      }

      // Render beautiful output
      if (output) {
        renderRichUwOutput(answer, isFollowUp);
        output.classList.remove('hidden');
      }

      // Show follow-up UI
      if (followUpArea) {
        followUpArea.classList.remove('hidden');
      }

      // Clear the input we read from (for follow-up this makes the question "disappear" after submit + loading is already shown)
      if (activeInput) activeInput.value = '';

    } catch (err) {
      console.error(err);
      if (output) {
        output.innerHTML = `<p class="text-red-600">Error searching guidelines. Please try again.</p>`;
        output.classList.remove('hidden');
      }
    } finally {
      // Restore the original #global-loading (standard spinner) then hide
      const loadingElFinal = document.getElementById('global-loading');
      if (loadingElFinal && loadingElFinal.dataset.originalContent) {
          loadingElFinal.innerHTML = loadingElFinal.dataset.originalContent;
          delete loadingElFinal.dataset.originalContent;
      }
      if (typeof window.hideLoading === 'function') {
          window.hideLoading();
      } else if (loadingElFinal) {
          loadingElFinal.classList.add('hidden');
          loadingElFinal.style.setProperty('display', 'none', 'important');
      }
    }
  }

  // =====================================================
  // RICH, PREMIUM OUTPUT RENDERING
  // =====================================================
  function renderRichUwOutput(rawAnswer, isFollowUp = false) {
    const output = document.getElementById('uw-output');
    if (!output) return;

    const safeAnswer = rawAnswer || '';

    // Parse into sections (prompt is instructed to use exact ## headers)
    const sections = {};
    const sectionOrder = [
      'Direct Answer',
      'Key Guideline Considerations',
      'Overlays & Investor Impact',
      'Confidence Level',
      'Compensating Factors & Mitigants',
      'Recommended Next Steps',
      'Client-Facing Talking Points'
    ];

    let currentSection = null;
    const lines = safeAnswer.split('\n');

    lines.forEach(line => {
      const headerMatch = line.match(/^##\s*(.+?)\s*$/);
      if (headerMatch) {
        currentSection = headerMatch[1].trim();
        sections[currentSection] = '';
      } else if (currentSection) {
        sections[currentSection] += line + '\n';
      }
    });

    // Build premium HTML
    let html = `
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs uppercase tracking-widest text-[#00A89D] font-semibold">Buyer Qualification Analysis</div>
            <div class="text-xl font-bold text-[#002B5C] dark:text-white">${currentScenario.question.substring(0, 90)}${currentScenario.question.length > 90 ? '...' : ''}</div>
          </div>
          <div class="flex gap-2">
            <button onclick="window.copyFullUwResponse()" class="text-xs px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
              <i class="fas fa-copy"></i> Copy Full
            </button>
            <button onclick="window.saveUwScenarioToVault()" class="text-xs px-4 py-2 rounded-xl bg-[#00A89D] text-white flex items-center gap-2 hover:bg-[#008F85]">
              <i class="far fa-bookmark"></i> Save to My Saved Items
            </button>
          </div>
        </div>
    `;

    sectionOrder.forEach(sectionName => {
      if (!sections[sectionName]) return;

      const content = sections[sectionName].trim();
      const isConfidence = sectionName === 'Confidence Level';

      let icon = 'fa-file-alt';
      if (sectionName.includes('Answer')) icon = 'fa-check-circle';
      if (sectionName.includes('Confidence')) icon = 'fa-shield-alt';
      if (sectionName.includes('Compensating')) icon = 'fa-balance-scale';
      if (sectionName.includes('Next')) icon = 'fa-list-check';
      if (sectionName.includes('Client')) icon = 'fa-comments';

      html += `
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
          <div class="flex items-center gap-3 mb-3">
            <i class="fas ${icon} text-[#00A89D]"></i>
            <h4 class="font-bold text-[#002B5C] dark:text-white">${sectionName}</h4>
            <button onclick="window.copyUwSection('${sectionName.replace(/'/g, "\\'")}', this)" class="ml-auto text-xs px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1">
              <i class="fas fa-copy text-[10px]"></i> <span class="hidden sm:inline">Copy</span>
            </button>
          </div>
          <div class="prose prose-sm dark:prose-invert max-w-none text-[15px]">
            ${marked.parse(content)}
          </div>
      `;

      if (isConfidence) {
        // Simple visual confidence bar
        const confText = content.toLowerCase();
        let pct = 65;
        let color = '#00A89D';
        if (confText.includes('high')) { pct = 88; color = '#00A89D'; }
        else if (confText.includes('medium')) { pct = 65; color = '#00A89D'; }
        else if (confText.includes('low')) { pct = 38; color = '#ef4444'; }

        html += `
          <div class="mt-4">
            <div class="flex justify-between text-xs mb-1">
              <span class="font-medium">Confidence</span>
              <span class="font-bold" style="color:${color}">${pct}%</span>
            </div>
            <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div class="h-2.5 rounded-full transition-all" style="width:${pct}%; background:${color}"></div>
            </div>
          </div>
        `;
      }

      html += `</div>`;
    });

    // Add conversation context note if follow-up
    if (currentScenario.history.length > 2) {
      html += `
        <div class="text-[11px] text-gray-500 dark:text-gray-400 italic px-1">
          This answer is part of an ongoing conversation on this specific scenario. Previous context was included.
        </div>
      `;
    }

    html += `</div>`;

    output.innerHTML = html;

    // Store latest answer for copy/save
    output.dataset.latestAnswer = safeAnswer;
  }

  // =====================================================
  // ACTION HELPERS (exposed on window)
  // =====================================================
  window.copyFullUwResponse = function() {
    const output = document.getElementById('uw-output');
    const text = output ? output.dataset.latestAnswer || output.innerText : '';
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      const btns = document.querySelectorAll('#uw-output button');
      if (btns.length) {
        const orig = btns[0].innerHTML;
        btns[0].innerHTML = '<i class="fas fa-check"></i> Copied';
        setTimeout(() => { if (btns[0]) btns[0].innerHTML = orig; }, 1400);
      }
    }).catch(() => alert('Copy failed — please select and copy manually.'));
  };

  window.copyUwSection = function(sectionName, btn) {
    const output = document.getElementById('uw-output');
    const full = output ? output.dataset.latestAnswer : '';
    if (!full) return;

    // crude section extraction
    const regex = new RegExp(`##\\s*${sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=##|$)`, 'i');
    const match = full.match(regex);
    const sectionText = match ? match[0] : full;

    navigator.clipboard.writeText(sectionText.trim()).then(() => {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => { btn.innerHTML = orig; }, 1200);
    });
  };

  window.saveUwScenarioToVault = function() {
    if (typeof window.toggleSaveIdea !== 'function') {
      alert('Saved Items system not ready yet.');
      return;
    }

    const output = document.getElementById('uw-output');
    const answer = output ? output.dataset.latestAnswer : '';
    if (!answer) {
      alert('Generate an answer first.');
      return;
    }

    const title = `UW Scenario: ${currentScenario.question.substring(0, 70)}${currentScenario.question.length > 70 ? '...' : ''}`;
    let docsHtml = '';
    if (currentScenario.uploadedDocs.length) {
      docsHtml = `<div class="mt-2"><span class="text-xs font-semibold text-gray-500">Documents Considered:</span> <span class="text-sm">${currentScenario.uploadedDocs.map(d => d.name).join(', ')}</span></div>`;
    }

    let content = `
<div class="uw-saved bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-5 shadow-sm">
  <div class="mb-4">
    <div class="flex items-center gap-2 mb-2">
      <i class="fas fa-search-dollar text-[#00A89D]"></i>
      <span class="text-xs uppercase tracking-widest font-bold text-[#00A89D]">Buyer Qualification Scenario</span>
    </div>
    <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
      <div class="text-sm font-semibold mb-1">Question:</div>
      <div class="text-sm">${currentScenario.question}</div>
      <div class="text-xs text-gray-500 mt-2">Loan Type: <span class="font-medium">${currentScenario.loanType || 'General'}</span></div>
      ${docsHtml ? `<div class="mt-2 text-xs">${docsHtml}</div>` : ''}
    </div>
  </div>
  <div>
    <div class="flex items-center gap-2 mb-2">
      <i class="fas fa-clipboard-check text-[#00A89D]"></i>
      <span class="text-xs uppercase tracking-widest font-bold text-[#00A89D]">Analysis &amp; Guidance</span>
    </div>
    <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm whitespace-pre-wrap leading-snug">
      ${answer}
    </div>
  </div>
  <div class="mt-3 text-[10px] text-gray-500">Saved from Buyer Qualification Analysis • Verify with your lender partner</div>
</div>`;

    window.toggleSaveIdea(title, content, null, 'underwriting');

    if (window.showToast) {
      window.showToast('Full buyer qualification scenario saved to My Saved Items', 'success');
    } else {
      alert('Saved to My Saved Items');
    }
  };

  // Follow-up
  window.askUwFollowUp = function() {
    const input = document.getElementById('uw-follow-up-input');
    if (!input || !input.value.trim()) return;

    const q = input.value.trim();
    input.value = '';  // clear immediately so it feels like the question was submitted

    searchUnderwriting(true, q);
  };

  // Quick follow-up chips
  window.useUwQuickFollowUp = function(text) {
    const input = document.getElementById('uw-follow-up-input');
    if (input) {
      input.value = text;
      window.askUwFollowUp();
    }
  };

  // Main entry point (called from button)
  window.searchUnderwriting = function() {
    searchUnderwriting(false);
  };

  // =====================================================
  // QUESTION TIPS MODAL (educational guide for structuring good questions)
  // =====================================================
  window.openUwQuestionTips = function() {
    const modal = document.getElementById('uw-question-tips-modal');
    if (!modal) return;
    if (typeof window.openNamedModal === 'function') {
      window.openNamedModal(modal);
    } else {
      modal.style.display = 'flex';
      modal.style.pointerEvents = 'auto';
      document.body.classList.add('modal-open');
    }
  };

  window.closeUwQuestionTips = function() {
    const modal = document.getElementById('uw-question-tips-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  };

  // =====================================================
  // INITIALIZATION & WIRING
  // =====================================================
  function initUnderwriting() {
    // Wire drop zone (if elements exist)
    const uploadArea = document.getElementById('uw-upload-area');
    const fileInput = document.getElementById('uw-file-upload');

    if (uploadArea && fileInput) {
      uploadArea.addEventListener('click', () => fileInput.click());

      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('border-[#00A89D]', 'bg-[#00A89D]/5');
      });

      uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('border-[#00A89D]', 'bg-[#00A89D]/5');
      });

      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('border-[#00A89D]', 'bg-[#00A89D]/5');
        if (e.dataTransfer.files.length) {
          handleUwFileUpload(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
          handleUwFileUpload(fileInput.files[0]);
          fileInput.value = '';
        }
      });
    }

    // Wire follow-up send button if present
    const sendBtn = document.getElementById('uw-send-follow-up');
    if (sendBtn) {
      sendBtn.onclick = window.askUwFollowUp;
    }

    const followInput = document.getElementById('uw-follow-up-input');
    if (followInput) {
      followInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          window.askUwFollowUp();
        }
      });
    }

    // Expose a couple helpers
    window.resetUwScenario = resetCurrentScenario;

    console.log('%c[underwriting.js] Buyer Qualification Analysis initialized', 'color:#00A89D');
  }

  // Auto-init when script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUnderwriting);
  } else {
    initUnderwriting();
  }

  // Make sure the main search is exposed for any inline onclicks
  window.searchUnderwriting = window.searchUnderwriting || function() { searchUnderwriting(false); };

})();
