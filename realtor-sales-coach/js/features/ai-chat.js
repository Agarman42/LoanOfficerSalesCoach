/**
 * js/features/ai-chat.js
 *
 * AI Chat Assistant
 * Extracted from monolithic index.html (Phase 1)
 *
 * Includes:
 * - chatHistory (with system prompt)
 * - smartRouteChat() - routes specific questions to dedicated tools (e.g. process or listing related)
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
  const BASE_SYSTEM_PROMPT = `You are the ultimate AI Sales Coach for realtors. This app is packed with powerful AI tools designed to help realtors win more listings and buyers, build stronger relationships, and grow their business.
When asked what the tool does or about its features, ALWAYS highlight the AI TOOLS first — they are the coolest and most valuable part:
• Listing Description Generator – Instant professional, emotional, and social-ready descriptions in multiple lengths
• Open House Script & Strategy – Full kit: setup checklist, opening scripts, talking points, objections, lead capture, and social angles
• Buyer/Seller Consultation Prep Kit – Personalized market snapshots, comps, pricing/affordability, objections, and follow-up plans
• Sales Script Generator – Instant objection handlers and conversation scripts
• Social Media Post & Calendar Creator – Ready-to-post content + full monthly plans (6 pillars, 14 Reels, 120+ Evergreen)
• Blog Creator – Full SEO + GEO optimized blog posts with matching social + Google + Reel assets in seconds
• Value Vault – Save and organize your best ideas
• 2026 Business Plan + Weekly Win Plan Creators – Anxiety-reducing, profile-powered planning
• Mindset Lab – 100+ principles for resilience
• Prospecting Time Blocks, Event Planning (4 high-impact + post-event), Referral Partners (6 playbooks + tiers), Database Nurturing (A+/B/C cadences), Transaction Process stages + templates, Pop-Bys & Giftology, 7-Day Post-Closing
• AI Chat Assistant – Your always-on coach
Be enthusiastic, encouraging, low-anxiety, and focus on how these tools save time and help win more business. Use bullet points.`;

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
    const userMessage = input.value.trim();
    if (!userMessage) return;

    // Smart routing to specialized tools (e.g. process or listing related) - uses old logic but with new renderer
    if (smartRouteChat(userMessage)) {
        addMessage('user', userMessage, false);
        addMessage('assistant', "I've moved you to the relevant specialized tool for the most accurate answer. Your question is pre-filled — just hit the generate or review the result!", false);
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
      thinkingEl.className = 'flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 px-3 py-2 mt-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit';
      thinkingEl.innerHTML = `
        <i class="fas fa-spinner fa-spin text-[#00A89D]"></i>
        <span>Coach is thinking...</span>
      `;
      messagesDiv.appendChild(thinkingEl);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // Disable input while processing for better UX
    input.disabled = true;
    const sendButton = input.parentElement ? input.parentElement.querySelector('button') : null;
    if (sendButton) sendButton.disabled = true;

    // Personalize every time
    injectProfileContext();
    chatHistory.push({ role: "user", content: userMessage });
    saveChatHistory();

    try {
        const aiReply = await window.callGrokAPI(null, {
            messages: chatHistory,
            temperature: 0.7,
            max_tokens: 1100
        });

        if (!aiReply) throw new Error('Empty response from API');

        addMessage('assistant', aiReply, true);  // adds actions
        chatHistory.push({ role: "assistant", content: aiReply });
        saveChatHistory();

        if (typeof gtag === 'function') {
            gtag('event', 'send_chat_message', { event_category: 'Tool Usage', event_label: 'AI Chat Message Sent', value: 1 });
        }
    } catch (error) {
        console.error(error);
        addMessage('assistant', 'Error: Could not get response. Check console or try again.', false);
    } finally {
        // Remove thinking indicator
        if (thinkingEl && thinkingEl.parentNode) {
            thinkingEl.parentNode.removeChild(thinkingEl);
        }
        // Re-enable input
        input.disabled = false;
        if (sendButton) sendButton.disabled = false;
        // Ensure we scroll to bottom
        if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight;
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
        'guideline', 'guidelines', 'financing', 'pre-approval', 'qualification', 'scenario', 
        'dti', 'credit', 'self-employed', 'conventional', 'fha', 'va', 'jumbo', 'buydown', 'cash out'
    ];
    const hasPrimary = primaryKeywords.some(kw => lower.includes(kw));

    if (!hasPrimary) return false;

    // === SECONDARY: Loan/underwriting context terms (optional but boosts accuracy) ===
    const secondaryKeywords = [
        'dti', 'debt to income', 'credit score', 'fico', 'ltv', 'cltv', 'self-employed',
        'bankruptcy', 'foreclosure', 'fha', 'va', 'conventional', 'jumbo',
        'non-qm', 'buydown', 'cash out'
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
        // For realtor version: specialized financing questions detected — keep in chat and let user use dedicated tools (listing, open house, consultation, prospecting)
        console.log('[ai-chat] Specialized buyer/financing question detected — staying in chat for seamless experience. User can switch to dedicated tools.');
        return false; // Routed
    }

    // Default: Stay in general chat
    return false;
}

// =====================================================
// RICH CHAT ENHANCEMENTS: Profile personalization, persistence, suggestions, actions
// =====================================================

function getProfileContext() {
  try {
    const p = (window.getUserProfile && window.getUserProfile()) || JSON.parse(localStorage.getItem('userProfile') || '{}');
    const parts = [];
    if (p.name) parts.push(`Name: ${p.name}`);
    if (p.email) parts.push(`Email: ${p.email}`);
    if (p.localArea || p.market) parts.push(`Primary market: ${p.localArea || p.market}`);
    if (p.personality) parts.push(`Personality/voice: ${p.personality}`);
    if (p.hobbies && p.hobbies.length) parts.push(`Hobbies & activities: ${p.hobbies.join(', ')}`);
    if (p.goals) parts.push(`Current goals: ${p.goals}`);
    if (p.challenges) parts.push(`Key challenges: ${p.challenges}`);
    if (p.targetPartners && p.targetPartners.length) parts.push(`Ideal partners: ${p.targetPartners.join(', ')}`);
    if (p.tone) parts.push(`Preferred tone: ${p.tone}`);
    return parts.length ? parts.join('. ') + '.' : 'Limited profile details set yet — personalize generally but ask for more if helpful.';
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

function addMessage(role, content, addActions = true) {
  const messagesDiv = document.getElementById('chat-messages');
  if (!messagesDiv) return;
  const isUser = role === 'user';
  const wrapper = document.createElement('div');
  wrapper.className = isUser ? 'text-right mb-4' : 'text-left mb-4 group';

  let innerHTML = `<div class="${isUser ? 'inline-block bg-[#00A89D] text-white' : 'inline-block bg-[#002B5C] text-white'} rounded-2xl px-5 py-3 max-w-[85%] shadow-sm text-[15px] leading-relaxed">`;
  innerHTML += isUser ? content : marked.parse(content || '');
  innerHTML += `</div>`;

  if (!isUser && addActions) {
    innerHTML += `
      <div class="mt-1 flex gap-1.5 text-[10px] opacity-60 group-hover:opacity-100 transition">
        <button onclick="copyChatMessage(this)" class="px-2 py-0.5 rounded border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Copy</button>
        <button onclick="saveChatMessage(this)" class="px-2 py-0.5 rounded border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Save to Vault</button>
        <button onclick="useInTool(this, 'social')" class="px-2 py-0.5 rounded border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">To Social</button>
      </div>`;
  }

  wrapper.innerHTML = innerHTML;
  messagesDiv.appendChild(wrapper);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  return wrapper;
}

function copyChatMessage(btn) {
  const bubble = btn.closest('.group') || btn.parentElement.previousElementSibling || btn.closest('div').previousElementSibling;
  const textEl = bubble ? bubble.querySelector('div') || bubble : btn.parentElement;
  const text = textEl ? (textEl.innerText || textEl.textContent) : '';
  if (!text) return;
  navigator.clipboard.writeText(text.trim()).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = orig, 1200);
  });
}

function saveChatMessage(btn) {
  const wrapper = btn.closest('.group') || btn.parentElement;
  const contentEl = wrapper.querySelector('div') || wrapper;
  let text = contentEl.innerText || contentEl.textContent || '';
  text = text.replace(/Copy|Save to Vault|To Social/g, '').trim();
  if (window.toggleSaveIdea) {
    const content = `
<div class="coach-saved">
  <div class="text-xs uppercase tracking-widest text-[#00A89D] font-bold mb-1">AI Coach Response</div>
  <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm whitespace-pre-wrap border border-gray-100 dark:border-gray-700">${text}</div>
</div>`;
    window.toggleSaveIdea('AI Coach Response', content, null, 'coach');
    if (window.showToast) window.showToast('Saved to My Saved Items!', 'success');
    else alert('Saved!');
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
      addMessage('assistant', "Hi! I'm your AI Realtor Coach — profile-aware and connected to every tool in this coach. What are we winning at today?", false);
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
  // Use data attributes + event listener instead of inline onclick to avoid quote escaping / syntax errors in generated HTML
  container.innerHTML = prompts.map(p => {
    const safe = p.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const display = p.length > 55 ? p.substring(0,52) + '…' : p;
    return `<button data-prompt="${safe}" class="text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 hover:border-[#00A89D] hover:text-[#00A89D] transition bg-white dark:bg-gray-800">${display}</button>`;
  }).join('');

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
      const welcome = "Hi! I'm your AI Realtor Coach. I know your profile, your tools, and your goals. What are we winning at today?";
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

    console.log('%c[ai-chat.js] AI Chat Assistant initialized (with profile, persistence, suggestions & actions)', 'color:#00A89D');
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
