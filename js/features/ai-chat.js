/**
 * js/features/ai-chat.js
 *
 * AI Chat Assistant
 * Extracted from monolithic index.html (Phase 1)
 *
 * Includes:
 * - chatHistory (with system prompt)
 * - smartRouteChat() - routes underwriting questions to the dedicated tool
 * - sendChatMessage() - main chat flow with Grok API
 * - Keypress listener for Enter key
 *
 * Self-initializes. Exposes public functions on window.
 */

(function () {
  'use strict';

  // =====================================================
  // BASE SYSTEM + PROFILE (defined early so initial chatHistory can use it)
  // =====================================================
  const BASE_SYSTEM_PROMPT = `You are the ultimate AI Sales Coach for loan officers. This app is packed with powerful AI tools designed to help LOs close more loans, build stronger relationships, and grow their business.
When asked what the tool does or about its features, ALWAYS highlight the AI TOOLS first — they are the coolest and most valuable part:
• Sales Script Generator – Instant objection handlers and conversation scripts
• Social Media Post & Calendar Creator – Ready-to-post content + full monthly plans (6 pillars, 14 Reels, 120+ Evergreen)
• Blog Creator – Full SEO + GEO optimized blog posts with matching social + Google + Reel assets in seconds
• Bio Builder – Platform-ready professional bios (Google, Experience.com, Zillow, company pages) saved to your profile
• Value Vault – Save and organize your best ideas
• 2026 Business Plan + Weekly Win Plan Creators – Anxiety-reducing, profile-powered planning
• Mindset Lab – 100+ principles for resilience
• Prospecting Time Blocks, Event Planning (4 high-impact + post-event), Referral Partners (6 playbooks + tiers), Database Nurturing (A+/B/C cadences), Loan Process stages + templates, Pop-Bys & Giftology, 7-Day Post-Closing
• Underwriting Guideline Search – Fast accurate answers
• AI Chat Assistant – Your always-on coach
Be enthusiastic, encouraging, low-anxiety, and focus on how these tools save time and help win more business. Use bullet points. Never lead with underwriting — it's one tool among many.`;

  function getWeekendCoachSlice() {
    if (typeof window.getWeekendPlanRules === 'function') {
      let slice = `\n\nSCHEDULING & PLANNING RULES (weekly plans, social calendars, outreach timing — always follow):\n${window.getWeekendPlanRules()}`;
      if (typeof window.getWeekendSocialRules === 'function') slice += `\n\n${window.getWeekendSocialRules()}`;
      return slice;
    }
    return '\n\nSCHEDULING RULE: Saturdays and Sundays are for rest, family, and recharge — never assign networking events, prospecting blitzes, or heavy outreach on weekends. Optional light prep only (15–30 min max).';
  }

  function getBaseSystemWithCoachRules() {
    return BASE_SYSTEM_PROMPT + getWeekendCoachSlice();
  }

  // =====================================================
  // ORIGINAL AI CHAT CODE (moved and combined)
  // =====================================================

let chatHistory = [
    {
        role: "system",
        content: getBaseSystemWithCoachRules()
    }
];
async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const userMessage = (input.value || '').trim();
    if (!userMessage) return;

    // Smart routing (underwriting etc) — uses dedicated tool for guideline accuracy
    if (smartRouteChat(userMessage)) {
        addMessage('user', userMessage, false);
        addMessage(
          'assistant',
          "I've moved you to the <strong>Underwriting Guideline Search</strong> tool for the most accurate answer. Your question is pre-filled — just hit Search or review the result!",
          false,
          true
        );
        input.value = '';
        return;
    }

    addMessage('user', userMessage, false);
    input.value = '';

    // Lightweight chat-only loading indicator (no heavy global modal)
    const messagesDiv = document.getElementById('chat-messages');
    const thinkingId = 'chat-thinking-indicator';
    let thinkingEl = document.getElementById(thinkingId);
    if (!thinkingEl && messagesDiv) {
      thinkingEl = document.createElement('div');
      thinkingEl.id = thinkingId;
      thinkingEl.className =
        'flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 px-3 py-2 mt-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit';
      thinkingEl.innerHTML = `
        <i class="fas fa-spinner fa-spin text-[#00A89D]" aria-hidden="true"></i>
        <span>Coach is thinking...</span>
      `;
      messagesDiv.appendChild(thinkingEl);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    input.disabled = true;
    const sendButton = input.parentElement
      ? input.parentElement.querySelector('button')
      : null;
    if (sendButton) sendButton.disabled = true;

    injectProfileContext();
    chatHistory.push({ role: 'user', content: userMessage });
    saveChatHistory();

    try {
        if (typeof window.callGrokAPI !== 'function') {
          throw new Error('AI client is still loading. Please try again in a moment.');
        }
        const aiReply = await window.callGrokAPI(null, {
            messages: chatHistory,
            temperature: 0.7,
            max_tokens: 1100
        });

        if (!aiReply) throw new Error('Empty response from API');

        addMessage('assistant', aiReply, true);
        chatHistory.push({ role: 'assistant', content: aiReply });
        saveChatHistory();

        if (typeof window.trackCoachEvent === 'function') {
          window.trackCoachEvent({
            tool: 'ai-chat',
            action: 'send',
            eventName: 'send_chat_message',
            label: 'AI Chat Message Sent'
          });
        }
    } catch (error) {
        console.error('[ai-chat]', error);
        const msg =
          typeof window.formatFriendlyApiError === 'function'
            ? window.formatFriendlyApiError(error, 'Could not get a response. Please try again.')
            : (error && error.message) || 'Could not get a response.';
        addMessage('assistant', msg, false);
    } finally {
        if (thinkingEl && thinkingEl.parentNode) {
            thinkingEl.parentNode.removeChild(thinkingEl);
        }
        input.disabled = false;
        if (sendButton) sendButton.disabled = false;
        if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight;
        try {
          input.focus({ preventScroll: true });
        } catch (e) {
          try { input.focus(); } catch (e2) { /* ignore */ }
        }
    }
}
// Chat input Enter key (attached defensively in init)
function attachChatInputListener() {
  const input = document.getElementById('chat-input');
  if (!input || input._chatListenerAttached) return;
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });
  input._chatListenerAttached = true;
}

// Smart routing for AI Chat Assistant — more flexible
function smartRouteChat(message) {
    const lower = message.toLowerCase();

    // === BLOCK: Explicitly about the tool/app/features/help ===
    const blockPhrases = [
        'what is this tool', 'what does this tool do', 'what can this tool do', 'features',
        'tell me about this app', 'how does this help', 'what are the tools', 'ai tools',
        'help me with', 'sales script', 'marketing idea', 'motivation', 'weekly plan',
        'win plan', 'equity scanner', 'social media planner', 'chat assistant',
        'how do i use', 'what sections', 'navigate', 'dashboard'
    ];
    if (blockPhrases.some(phrase => lower.includes(phrase))) {
        return false; // Stay in chat
    }

    // === PRIMARY: Must have at least one strict underwriting keyword ===
    const primaryKeywords = [
        'guideline', 'guidelines', 'underwriting', 'scenario', 'du finding', 'lp finding',
        'aus finding', 'overlay', 'manual underwrite', 'compensating factor'
    ];
    const hasPrimary = primaryKeywords.some(kw => lower.includes(kw));

    if (!hasPrimary) return false;

    // === SECONDARY: Loan/underwriting context terms (optional but boosts accuracy) ===
    const secondaryKeywords = [
        'dti', 'debt to income', 'credit score', 'fico', 'ltv', 'cltv', 'self-employed',
        'bankruptcy', 'foreclosure', 'fha', 'va', 'usda', 'conventional', 'jumbo',
        'non-qm', '203k', 'buydown', 'cash out', 'lpmi', 'manufactured home'
    ];
    const hasSecondary = secondaryKeywords.some(kw => lower.includes(kw));

    // === QUESTION STRUCTURE: Boost if it's phrased as a question ===
    const isQuestion = lower.includes('?') || 
                       lower.includes('what is') || 
                       lower.includes('can i') || 
                       lower.includes('qualify') || 
                       lower.includes('eligible');

    // === ROUTE ONLY IF STRONG SIGNAL ===
    if (hasPrimary && (hasSecondary || isQuestion)) {
        // Use real navigation (aliases, SS nest safety, analytics hooks)
        if (typeof window.showSection === 'function') {
          window.showSection('underwriting-search');
        } else {
          document.querySelectorAll('main section').forEach(sec => {
            if (sec.closest && (sec.closest('#smart-savings-root') || sec.closest('#ss-guided-layer'))) return;
            sec.classList.add('hidden');
          });
          document.getElementById('underwriting-search')?.classList.remove('hidden');
        }

        // Pre-fill and focus (NO auto-search)
        setTimeout(() => {
          const uwInput = document.getElementById('uw-question');
          if (uwInput) {
            uwInput.value = message;
            uwInput.focus();
            uwInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 80);

        return true; // Routed
    }

    // Default: Stay in general chat
    return false;
}

// =====================================================
// RICH CHAT ENHANCEMENTS: Profile personalization, persistence, suggestions, actions
// =====================================================

function getProfileContext() {
  try {
    if (typeof window.buildProfileAiContext === 'function') {
      return window.buildProfileAiContext();
    }
    const p = (window.getUserProfile && window.getUserProfile()) || JSON.parse(localStorage.getItem('userProfile') || '{}');
    return p.name ? `Name: ${p.name}.` : 'Limited profile details set yet — personalize generally but ask for more if helpful.';
  } catch (e) {
    return 'No profile context available.';
  }
}

function injectProfileContext() {
  if (!chatHistory || chatHistory.length === 0) return;
  const ctx = getProfileContext();
  const systemMsg = chatHistory[0];
  if (systemMsg && systemMsg.role === 'system') {
    systemMsg.content = getBaseSystemWithCoachRules() + `\n\nCURRENT USER PROFILE CONTEXT — use this to make every answer specific and personal: ${ctx}`;
  }
}

function saveChatHistory() {
  try {
    // Save only user + assistant turns (system is rebuilt)
    const toSave = chatHistory.filter(m => m.role !== 'system');
    localStorage.setItem('aiChatHistory', JSON.stringify(toSave));
  } catch (e) {}
}

function loadChatHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem('aiChatHistory') || '[]');
    if (saved.length) {
      // Rebuild: system first, then saved
      const system = chatHistory[0] || { role: 'system', content: getBaseSystemWithCoachRules() };
      chatHistory = [system, ...saved];
    }
  } catch (e) {}
}

function renderChatHistory() {
  const messagesDiv = document.getElementById('chat-messages');
  if (!messagesDiv) return;
  messagesDiv.innerHTML = '';
  chatHistory.forEach(msg => {
    if (msg.role === 'system') return;
    addMessage(msg.role, msg.content, false); // no actions on load
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function escapeChatHtml(str) {
  if (typeof window.escapeHtml === 'function') return window.escapeHtml(str);
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render a chat bubble. User text is escaped; assistant may use marked (markdown).
 * Fixed HTML action strings (routing notices) may pass isHtmlTrusted for assistant only.
 */
function addMessage(role, content, addActions = true, isHtmlTrusted = false) {
  const messagesDiv = document.getElementById('chat-messages');
  if (!messagesDiv) return;
  const isUser = role === 'user';
  const wrapper = document.createElement('div');
  wrapper.className = isUser ? 'text-right mb-4' : 'text-left mb-4 group';

  // chat-bubble-* classes pin white text (global .prose p/li colors were overriding text-white)
  const bubbleClass = isUser
    ? 'chat-bubble chat-bubble-user inline-block bg-[#F15A29] text-white rounded-2xl px-5 py-3 max-w-[min(85%,42rem)] shadow-sm text-[15px] leading-relaxed text-left'
    : 'chat-bubble chat-bubble-assistant inline-block bg-[#002B5C] text-white rounded-2xl px-5 py-3 max-w-[min(90%,48rem)] shadow-sm text-[15px] leading-relaxed text-left';

  const bubble = document.createElement('div');
  bubble.className = bubbleClass;

  if (isUser) {
    bubble.textContent = content == null ? '' : String(content);
  } else if (isHtmlTrusted) {
    bubble.innerHTML = content || '';
  } else if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
    // Markdown from the model — not arbitrary page HTML
    bubble.innerHTML = marked.parse(content || '');
  } else {
    bubble.textContent = content == null ? '' : String(content);
  }

  wrapper.appendChild(bubble);

  if (!isUser && addActions) {
    const actions = document.createElement('div');
    actions.className =
      'mt-1 flex gap-1.5 text-[10px] opacity-60 group-hover:opacity-100 transition';
    actions.innerHTML = `
        <button type="button" class="px-2 py-0.5 rounded border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Copy</button>
        <button type="button" class="px-2 py-0.5 rounded border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Save to Vault</button>
        <button type="button" class="px-2 py-0.5 rounded border border-[#F15A29] text-[#F15A29] hover:bg-[#F15A29] hover:text-white">To Social</button>
      `;
    const buttons = actions.querySelectorAll('button');
    if (buttons[0]) buttons[0].addEventListener('click', () => copyChatMessage(buttons[0]));
    if (buttons[1]) buttons[1].addEventListener('click', () => saveChatMessage(buttons[1]));
    if (buttons[2]) buttons[2].addEventListener('click', () => useInTool(buttons[2], 'social'));
    wrapper.appendChild(actions);
  }

  messagesDiv.appendChild(wrapper);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  return wrapper;
}

function copyChatMessage(btn) {
  const wrapper = btn.closest('.group') || btn.parentElement;
  const textEl =
    (wrapper && wrapper.querySelector('.chat-bubble')) ||
    (wrapper && wrapper.querySelector('div')) ||
    btn.parentElement;
  const text = textEl ? textEl.innerText || textEl.textContent : '';
  if (!text) return;
  const done = () => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => {
      btn.textContent = orig;
    }, 1200);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text.trim()).then(done).catch(() => {
      if (window.showToast) window.showToast('Could not copy to clipboard', 'error');
    });
  } else if (window.showToast) {
    window.showToast('Clipboard not available in this browser', 'warning');
  }
}

function saveChatMessage(btn) {
  const wrapper = btn.closest('.group') || btn.parentElement;
  const contentEl = wrapper.querySelector('.chat-bubble') || wrapper.querySelector('div') || wrapper;
  let text = contentEl.innerText || contentEl.textContent || '';
  text = text.replace(/Copy|Save to Vault|To Social/g, '').trim();
  if (!text) return;
  if (window.toggleSaveIdea) {
    const content = `
<div class="coach-saved">
  <div class="text-xs uppercase tracking-widest text-[#00A89D] font-bold mb-1">AI Coach Response</div>
  <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm whitespace-pre-wrap border border-gray-100 dark:border-gray-700">${escapeChatHtml(text)}</div>
</div>`;
    window.toggleSaveIdea('AI Coach Response', content, null, 'coach');
    if (window.showToast) window.showToast('Saved to My Saved Items!', 'success');
    else if (typeof window.notifyUser === 'function') window.notifyUser('Saved!', 'success');
  }
}

function useInTool(btn, tool) {
  const wrapper = btn.closest('.group') || btn.parentElement;
  const contentEl = wrapper.querySelector('div') || wrapper;
  let text = contentEl.innerText || contentEl.textContent || '';
  text = text.replace(/Copy|Save to Vault|To Social/g, '').trim().substring(0, 600);
  if (tool === 'social' && window.showSection) {
    window.showSection('social-post');
    setTimeout(() => {
      const ta = document.getElementById('custom-plan-prompt') || document.querySelector('#social-post textarea');
      if (ta) {
        ta.value = (ta.value ? ta.value + '\n\n' : '') + 'Idea from AI Coach: ' + text;
        ta.focus();
      }
      if (window.showToast) window.showToast('Switched to Social Creator. Idea pre-filled in prompt field if available.', 'info');
    }, 400);
  } else if (window.showSection) {
    window.showSection(tool);
  }
}

function useSuggestedPrompt(promptText) {
  const input = document.getElementById('chat-input');
  if (!input) return;
  input.value = promptText;
  sendChatMessage();
}

function clearChat() {
  if (!confirm('Clear this conversation?')) return;
  const messagesDiv = document.getElementById('chat-messages');
  if (messagesDiv) messagesDiv.innerHTML = '';
  chatHistory = [{ role: 'system', content: getBaseSystemWithCoachRules() }];
  localStorage.removeItem('aiChatHistory');
  // Show fresh welcome
  setTimeout(() => {
    if (messagesDiv) {
      addMessage('assistant', "Hi! I'm your AI Loan Officer Coach — profile-aware and connected to every tool in this coach. What are we winning at today?", false);
    }
  }, 50);
}

function setupChatSuggestions() {
  const container = document.getElementById('ai-chat-prompts');
  if (!container) return;
  if (container.children.length > 0) return; // already populated
  const prompts = [
    "Give me 3 social post ideas this week that match my personality and hobbies",
    "Help me handle a 'rates are too high' objection with a warm script",
    "Brainstorm a high-impact pop-by or client appreciation idea for realtors",
    "What's a good 7-day post-closing touch sequence for a first-time buyer?",
    "Motivate me — I'm feeling in a slump this week",
    "Turn one of my hobbies into 2 evergreen content angles for social or blog",
    "Review my goals and suggest my top 3 focus actions this week",
    "Give me a strong referral ask script for a past client"
  ];
  // data-prompt + listeners (avoids inline onclick / quote escaping bugs)
  container.innerHTML = prompts
    .map((p) => {
      const safe = escapeChatHtml(p);
      const display = escapeChatHtml(p.length > 55 ? p.substring(0, 52) + '…' : p);
      return `<button type="button" data-prompt="${safe}" class="text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 hover:border-[#00A89D] hover:text-[#00A89D] transition bg-white dark:bg-gray-800">${display}</button>`;
    })
    .join('');

  // Attach listeners (event delegation would also work, but direct is fine here)
  container.querySelectorAll('button[data-prompt]').forEach(button => {
    button.addEventListener('click', () => {
      const prompt = button.getAttribute('data-prompt');
      if (prompt && typeof useSuggestedPrompt === 'function') {
        useSuggestedPrompt(prompt);
      } else if (prompt && window.useSuggestedPrompt) {
        window.useSuggestedPrompt(prompt);
      }
    });
  });
}

  // =====================================================
  // INITIALIZATION
  // =====================================================
  function initAIChat() {
    // Load persisted chat (non-system turns)
    loadChatHistory();

    // Ensure system prompt is the rich base
    if (!chatHistory.length || chatHistory[0].role !== 'system') {
      chatHistory.unshift({ role: 'system', content: getBaseSystemWithCoachRules() });
    }

    // Render any previous messages
    renderChatHistory();

    // Attach enter key (defensive)
    attachChatInputListener();

    // Populate suggestion chips (if container exists in section)
    setupChatSuggestions();

    // If no messages yet (fresh), show a warm personalized welcome
    const messagesDiv = document.getElementById('chat-messages');
    if (messagesDiv && messagesDiv.children.length === 0) {
      const welcome = "Hi! I'm your AI Loan Officer Coach. I know your profile, your tools, and your goals. What are we winning at today?";
      addMessage('assistant', welcome, false);
    }

    // Inject profile context for next send
    injectProfileContext();

    // Also attach listener to the modal inputs if they exist (for future floating modal)
    const modalInput = document.getElementById('chat-input-modal');
    if (modalInput && !modalInput._chatListenerAttached) {
      modalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          // For now fall back to main send (or implement modal variant later)
          const mainInput = document.getElementById('chat-input');
          if (mainInput) mainInput.value = modalInput.value;
          sendChatMessage();
          modalInput.value = '';
        }
      });
      modalInput._chatListenerAttached = true;
    }

  }

  // =====================================================
  // PUBLIC API EXPOSURE
  // =====================================================
  window.sendChatMessage = sendChatMessage;
  window.smartRouteChat = smartRouteChat;
  window.clearChat = clearChat;
  window.useSuggestedPrompt = useSuggestedPrompt;
  window.copyChatMessage = copyChatMessage;
  window.saveChatMessage = saveChatMessage;
  window.setupChatSuggestions = setupChatSuggestions;
  window.renderChatHistory = renderChatHistory;
  window.injectProfileContext = injectProfileContext;

  // Bonus value: any tool can call window.askCoach("your question") to jump to chat + auto-send
  window.askCoach = function(question) {
    if (typeof window.showSection === 'function') {
      window.showSection('ai-chat');
    }
    setTimeout(() => {
      const inp = document.getElementById('chat-input');
      if (inp && question) {
        inp.value = question;
        if (typeof sendChatMessage === 'function') sendChatMessage();
      }
    }, 350);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAIChat);
  } else {
    initAIChat();
  }

})();
