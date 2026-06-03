/**
 * js/features/underwriting.js
 *
 * Underwriting Guideline Search
 * Moved during Stabilization Phase
 */

(function () {
  'use strict';

  async function searchUnderwriting() {
    const questionInput = document.getElementById('uw-question');
    const loanTypeSelect = document.getElementById('uw-loan-type');
    const output = document.getElementById('uw-output');
    const question = questionInput.value.trim();
    const loanType = loanTypeSelect ? loanTypeSelect.value : '';

    if (!question) {
      alert('Please enter a question');
      return;
    }

    const underwritingTips = [
      "While we search: Always double-check against the latest investor overlays — guidelines change.",
      "Pro move: Pay close attention to the Confidence Level we return. Low confidence = manual review recommended.",
      "Fun fact: Underwriting is part science (guidelines) and part art (judgment on compensating factors).",
      "Reminder: This tool is a helper, not a substitute for reading the full guideline manual."
    ];
    window.showLoadingWithTips(underwritingTips, 'Searching Underwriting Guidelines...');

    if (output) {
      output.innerHTML = '';
      output.classList.add('hidden');
    }

    const prompt = `You are an expert in mortgage underwriting guidelines. Provide accurate, concise answers based on standard agency rules and the provided Ruoff overlays. Always include confidence level and remind to verify.

Question: ${question}
Loan Type Context: ${loanType || 'General'}

Structure every response:
1. Direct concise main answer
2. Supporting guideline reference (if applicable)
3. Ruoff Overlays Check: List any relevant overlays
4. Confidence level (emphasize) + brief explanation
4. Final disclaimer: Double check all answers and be cautious before relying strictly on this response.`;

    try {
      const answer = await window.callGrokAPI(prompt, {
        temperature: 0.5,
        max_tokens: 1000
      });

      if (output) {
        output.innerHTML = `
          <div class="prose prose-lg dark:prose-invert max-w-none">
            ${marked.parse(answer)}
          </div>
        `;
        output.classList.remove('hidden');
      }

    } catch (err) {
      console.error(err);
      if (output) {
        output.innerHTML = `<p class="text-red-600">Error searching guidelines. Please try again.</p>`;
        output.classList.remove('hidden');
      }
    } finally {
      window.hideLoading();
    }
  }

  window.searchUnderwriting = searchUnderwriting;

  console.log('%c[underwriting.js] Underwriting search initialized', 'color:#00A89D');
})();
