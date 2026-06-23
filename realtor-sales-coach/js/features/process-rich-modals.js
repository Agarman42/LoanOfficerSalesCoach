/**
 * js/features/process-rich-modals.js
 * Bespoke premium modals for Transaction Process journey templates (Agent Sales Coach).
 */
(function () {
  'use strict';

  const TITLES = {
    'weekly-pipeline': 'Weekly Pipeline Review Agenda',
    'post-closing-7day': '7-Day Post-Closing Check-In — Full Scripts + Client Lifetime Value Strategy',
    'realtor-onboarding': 'Building Lender Partner Relationships — 6-Step Playbook + Scripts',
    'monday-status': 'Monday Status Update Scripts — 4 Ready-to-Record Videos',
    'pre-close-confirmation': 'Pre-Closing Confirmation Scripts — 48h Playbook + Wire Safety'
  };

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function whyBox(label, text) {
    return `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">${esc(label)}</span></div>
        <p class="text-[15px] leading-relaxed">${text}</p>
      </div>`;
  }

  function agendaCard(title, body) {
    return `
      <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-[15px]">
        <strong>${esc(title)}</strong><br>${body}
      </div>`;
  }

  function scriptCard(title, script, tip, saveKey) {
    return `
      <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div class="font-semibold text-sm text-[#002B5C] dark:text-white mb-2">${esc(title)}</div>
        <div class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">"${esc(script)}"</div>
        ${tip ? `<div class="mt-2 text-[10px] text-gray-500">${esc(tip)}</div>` : ''}
        <button type="button" data-process-copy="${esc(script)}"
          class="mt-3 text-[10px] px-3 py-1.5 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold transition">
          <i class="fas fa-copy mr-1"></i>Copy script
        </button>
        ${saveKey ? `<button type="button" data-process-save="${esc(saveKey)}" data-process-save-text="${esc(script)}"
          class="mt-2 ml-2 text-[10px] px-3 py-1.5 rounded-xl border border-[#F15A29] text-[#F15A29] hover:bg-[#F15A29] hover:text-white font-semibold transition">
          <i class="fas fa-bookmark mr-1"></i>Save
        </button>` : ''}
      </div>`;
  }

  function proTip(text) {
    return `<div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-6"><strong>Pro Tip:</strong> ${text}</div>`;
  }

  function bridgeRow(buttons) {
    return `
      <div class="flex flex-wrap gap-2 mb-6">
        ${buttons.map((b) => `
          <button type="button" data-process-bridge="${esc(b.action)}"
            class="text-xs px-3 py-2 rounded-xl ${b.primary ? 'bg-[#002B5C] text-white font-semibold hover:bg-black' : 'border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D]/5'} transition">
            ${esc(b.label)} →
          </button>`).join('')}
      </div>`;
  }

  function attachHandlers(contentEl) {
    contentEl.querySelectorAll('[data-process-copy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-process-copy') || '';
        navigator.clipboard.writeText(text).then(() => {
          const orig = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
          setTimeout(() => { btn.innerHTML = orig; }, 1600);
        }).catch(() => {});
      });
    });

    contentEl.querySelectorAll('[data-process-save]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-process-save');
        const text = btn.getAttribute('data-process-save-text') || '';
        if (typeof window.toggleSaveIdea === 'function') {
          window.toggleSaveIdea(key, text, btn, 'process');
        }
      });
    });

    contentEl.querySelectorAll('[data-process-bridge]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-process-bridge');
        if (typeof closeNamedModal === 'function') closeNamedModal('process-template-modal');
        setTimeout(() => {
          if (action === 'weekly' && typeof window.showSection === 'function') {
            window.showSection('weekly-win-plan');
          } else if (action?.startsWith('vault:') && typeof window.openVaultItemWhenReady === 'function') {
            if (typeof window.showSection === 'function') window.showSection('value-vault');
            setTimeout(() => window.openVaultItemWhenReady(action.split(':')[1]), 200);
          } else if (action?.startsWith('process:') && typeof window.showProcessTemplateModal === 'function') {
            window.showProcessTemplateModal(action.split(':')[1]);
          } else if (action?.startsWith('play:') && typeof window.openHighImpactPlay === 'function') {
            window.openHighImpactPlay(action.split(':')[1]);
          } else if (action?.startsWith('section:') && typeof window.showSection === 'function') {
            window.showSection(action.split(':')[1]);
          }
        }, 220);
      });
    });
  }

  function renderWeeklyPipeline(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#002B5C]/10 text-[#002B5C] dark:text-white">30-MIN RITUAL</span></div>
      ${whyBox('Why This Meeting Is Non-Negotiable', 'This 30-minute ritual is the highest-leverage process habit for any agent who wants to scale volume without losing control or sleep. It surfaces problems while they\'re still small, celebrates momentum, and forces a realistic capacity conversation before you overpromise on new clients. Teams that run this every Monday close more deals with less drama.')}
      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Exact 30-Minute Agenda</h4>
      <div class="space-y-3 mb-6">
        ${agendaCard('0–2 min — Celebrate Wins', 'Start positive. Name every closing, great client feedback, or smooth file from the week.')}
        ${agendaCard('2–12 min — Aging File Review', 'Call out anything sitting 7+ days waiting on inspection, appraisal, title, or lender approval. Assign owner + next action + due date out loud.')}
        ${agendaCard('12–17 min — Upcoming Milestones', 'Clear-to-closes, closings, and appraisals for the next 7 days. Confirm everyone knows their role.')}
        ${agendaCard('17–27 min — Stalled Files Deep Dive', 'The 1–3 files that are truly stuck. What\'s blocking? What does the client/partner know? Who owns the fix?')}
        ${agendaCard('27–30 min — Communication & Capacity', 'Who needs an extra touch this week? How many new buyer or listing consultations can we responsibly take on?')}
      </div>
      <div class="rounded-2xl border border-[#00A89D]/30 bg-[#00A89D]/5 p-5 mb-6 text-sm">
        <div class="font-bold text-[#002B5C] dark:text-white mb-2"><i class="fas fa-list-check text-[#00A89D] mr-1"></i> Monday checklist</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
          <div>☐ Pull pipeline + listing report before the meeting</div>
          <div>☐ Flag files 7+ days in same status</div>
          <div>☐ List CTCs/closings next 7 days</div>
          <div>☐ Assign owner on every stalled file</div>
          <div>☐ End with capacity number (new clients OK)</div>
          <div>☐ Log actions in CRM same day</div>
        </div>
      </div>
      ${bridgeRow([
        { label: 'Monday status video scripts', action: 'process:monday-status', primary: true },
        { label: 'Weekly Win Plan', action: 'weekly' },
        { label: 'Open House Toolkit', action: 'section:open-house' }
      ])}
      ${proTip('Protect this meeting like a closing. Same day, same time, every week. Solo agents still block 30 minutes — the discipline compounds.')}
    `;
    attachHandlers(contentEl);
  }

  function renderPostClosing7Day(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">HIGHEST-ROI TOUCH</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">DAY 6–8</span>
      </div>
      ${whyBox('Why This Touch Is Pure Gold', 'Most agents vanish the second the wire clears. The 7-day check-in is when clients are finally settled enough to reflect — and decide whether you were "just another agent" or someone who actually cared. Done right, this call generates Google reviews, referral conversations, and lifetime value no marketing spend can match.')}
      <div class="text-xs font-bold tracking-wider text-gray-500 uppercase mb-3">Ready-to-run scripts</div>
      <div class="space-y-4 mb-6">
        ${scriptCard('Opening — warm + curious',
          'Hey [First Name], it\'s [Your Name] — just checking in now that you\'ve had a full week in the new place. How\'s everything feeling? Any surprises with the house or the paperwork? I want to make sure you\'re completely settled before I get out of your hair.',
          'Pause. Let them talk before you educate or ask.', 'Process: 7-Day Opening Script')}
        ${scriptCard('Review + referral ask (after they sound happy)',
          'That\'s great to hear. Quick favor — would you mind leaving a short Google review when you have two minutes? It really helps other families in your exact situation find someone who will actually take care of them. I sent the link in a text just now. And if anyone in your world is even thinking about buying or selling in the next year, I\'d be honored to help them the same way I helped you.',
          'Send review link within 2 hours of the call.', 'Process: 7-Day Review Ask')}
        ${scriptCard('Video / voicemail fallback',
          'Hey [Name] — it\'s [Your Name]. Just left you a quick voicemail. I wanted to check in now that you\'ve been in the house a full week. Everything going okay? Any surprises? Shoot me a text when you have a second. Also — if you loved working with me, I\'d be incredibly grateful for a short Google review. I texted the link over. Hope you\'re loving the new place!',
          'Record in good light. Under 60 seconds. Say their name.', 'Process: 7-Day Video Fallback')}
        ${scriptCard('Same-day text follow-up',
          'Hey [Name] — just sent you a quick 7-day check-in video (or left a voicemail). Hope the new place is already feeling like home. Let me know if anything comes up in the first few weeks. And if you have 30 seconds, that Google review link I texted would mean the world.',
          'Always send within 2 hours of call or video.', 'Process: 7-Day Text Follow-Up')}
      </div>
      ${bridgeRow([
        { label: 'Full 5-part call framework (Vault)', action: 'vault:post-closing-7day', primary: true },
        { label: '7-day objection responses', action: 'vault:7day-objections' },
        { label: 'Post-closing text templates', action: 'vault:post-closing-texts' },
        { label: 'Home anniversary system', action: 'vault:client-anniversary-system' }
      ])}
      ${proTip('Call on day 6, 7, or 8 — never day 1 or 2. They need time to live in the house before real feedback. The full education framework lives in Value Vault — use this modal for scripts + follow-up execution.')}
    `;
    attachHandlers(contentEl);
  }

  function renderRealtorOnboarding(contentEl) {
    const steps = [
      { day: 'Day 0', title: 'Same-Day Intro to Your Lender Partner', body: 'The moment you have a buyer under contract (or a strong pre-approved lead), send a 30–45 second personal video to your lender partner + a clean "How I Run My Files" one-pager. Speed and clarity here set the tone.' },
      { day: 'Day 1–2', title: '15-Min Intro Call', body: 'Learn how they communicate, what they need from you on files, and how they like updates structured. Ask real questions. Take notes.' },
      { day: 'Within 48h', title: 'Written Cadence + Tools', body: 'Email the exact update cadence you committed to + 2–3 co-branded assets you can share (buyer guide, neighborhood snapshot, open house flyer, etc.).' },
      { day: 'Week 1', title: 'First Client Update (Over-Deliver)', body: 'Do not miss this. Send a clear status update even if nothing changed. This is the moment they decide whether you\'re different.' },
      { day: 'Post First Close', title: 'Testimonial + Preferred List Ask', body: 'Ask for a quick quote or video you can use in your marketing. Then ask to be added to their preferred agent list for future buyer referrals.' },
      { day: 'Ongoing', title: 'Never Go Dark on Their Files', body: 'The bar is low. Most agents are inconsistent. Your consistency becomes your moat.' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">FIRST 30 DAYS</span></div>
      ${whyBox('Why the First 30 Days Determine Everything', 'A new lender partnership is either the start of a steady referral pipeline or a one-and-done. Top agents treat the first shared file like an audition — over-communicate, deliver on every promise, and make your lender partner look like a hero to the client. Do that on the first one and you become their go-to agent faster than any lunch or gift ever could.')}
      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">The 6-Step Onboarding System</h4>
      <div class="space-y-3 mb-6">
        ${steps.map((s) => `
          <div class="rounded-2xl border-l-4 border-[#00A89D] border border-gray-200 dark:border-gray-700 p-4">
            <div class="text-xs font-bold text-[#00A89D] mb-1">${esc(s.day)}</div>
            <div class="font-semibold text-sm text-[#002B5C] dark:text-white mb-1">${esc(s.title)}</div>
            <div class="text-sm text-gray-700 dark:text-gray-300">${esc(s.body)}</div>
          </div>`).join('')}
      </div>
      <div class="text-xs font-bold tracking-wider text-gray-500 uppercase mb-3">Key scripts</div>
      <div class="space-y-4 mb-6">
        ${scriptCard('Day 0 lender partner handoff text',
          'Hey [Lender Name] — I just put [Buyer Name] under contract on [address]. I\'ve already welcomed them and sent a simple roadmap. I\'ll keep you in the loop on every step from my side — inspection, appraisal, repairs, and closing prep. What\'s the best way for us to stay in sync on this one?',
          'Send within 2 hours of contract.', 'Process: Lender Day 0 Handoff')}
        ${scriptCard('48-hour cadence follow-up email',
          'Hey [Lender Name] — great connecting yesterday. Quick follow-up: I\'ve attached the exact communication cadence I use on every shared file (milestone updates + same-day inspection/appraisal notifications). I also included three co-branded tools we can use with buyers. Looking forward to making this one (and many more) look great for your team and our mutual clients.',
          'Attach cadence PDF + 2–3 co-branded assets.', 'Process: Lender Cadence Email')}
        ${scriptCard('Post-first-close testimonial ask',
          'First closing with [Lender Name] went perfectly. [Client] is thrilled. Quick favor — would you be open to a short 20-second quote or video I can use in my marketing about why you liked working with me on this file? And if it felt good on your end, I\'d love to be on your preferred agent list for future buyer referrals.',
          'Ask within 48 hours of closing while emotion is high.', 'Process: Lender Testimonial Ask')}
      </div>
      ${bridgeRow([
        { label: '60-day partnership sequence', action: 'play:60-day-realtor-onboarding', primary: true },
        { label: 'Weekly value cadence', action: 'play:weekly-value-cadence' },
        { label: 'Co-marketing assets', action: 'play:co-marketing-assets' },
        { label: 'Pop-by library', action: 'vault:popby-best-practices' }
      ])}
      ${proTip('The goal of onboarding is not one referral — it\'s to become their go-to agent. Over-communicate on the first transaction and you earn the spot faster than any gift basket ever will.')}
    `;
    attachHandlers(contentEl);
  }

  function renderMondayStatus(contentEl) {
    const scripts = [
      { title: 'Script 1 — Smooth / on track', script: 'Hey [Name], it\'s [Your Name] with your Monday update. Inspection went well and the appraisal came back at value yesterday. Your lender partner is working through final approval — I\'ve already checked in with them. We\'re still targeting our [date] close. No action needed from you this week. How are you feeling about everything so far?', save: 'Process: Monday Smooth Script' },
      { title: 'Script 2 — Appraisal delay (proactive)', script: 'Hey [Name], it\'s [Your Name] with your Monday update. We hit a small delay on the appraisal — the appraiser needs one additional photo of the back patio. I\'ve already coordinated with the listing agent and they\'re handling it today. This shouldn\'t push our timeline, but I wanted you to hear it from me first. I\'ll send another note the second we have the report. How\'s everything else going on your end?', save: 'Process: Monday Appraisal Delay' },
      { title: 'Script 3 — Action needed (clear ask)', script: 'Hey [Name], it\'s [Your Name] with your Monday update. The seller accepted our repair request and we\'re waiting on the amended inspection report. I\'ve already followed up with the listing side and your lender partner so nothing slips. Can you confirm you received the HOA docs I emailed yesterday? If we get those back by Wednesday we stay on track for our close date.', save: 'Process: Monday Conditions Script' },
      { title: 'Script 4 — Nothing new (still valuable)', script: 'Hey [Name], it\'s [Your Name] with your Monday update. We\'re still waiting on the appraisal report — nothing new to report yet, but I wanted you to know I\'m checking in with the appraiser and your lender partner every day and will text you the second we have movement. No action needed from you — just wanted to give you peace of mind. How\'s everything else going on your end?', save: 'Process: Monday No Movement' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">EVERY MONDAY</span></div>
      ${whyBox('Why Predictable Monday Updates Win', 'Clients in process are anxious. Silence = anxiety + competitor opportunity. A consistent Monday video (45–60 seconds) that says exactly where we are, what\'s next, and what you need from them removes 80% of the "just checking in" calls and makes you look like the most organized professional they\'ve ever worked with. Do this for 6 months and partners will start saying "I only work with [Your Name] because my clients actually know what\'s going on."')}
      <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-6 text-[15px]">
        <strong class="text-[#002B5C] dark:text-white">45-second video formula</strong>
        <ol class="mt-2 space-y-1 list-decimal pl-5 text-sm">
          <li>Warm greeting + name</li>
          <li>Current status in plain English</li>
          <li>What we're waiting on + who owns it</li>
          <li>Next expected milestone + date</li>
          <li>What you need from them (if anything)</li>
          <li>Real question to drive reply</li>
        </ol>
      </div>
      <div class="text-xs font-bold tracking-wider text-gray-500 uppercase mb-3">Four ready-to-record scripts</div>
      <div class="space-y-4 mb-6">
        ${scripts.map((s) => scriptCard(s.title, s.script, 'Film Sunday night or Monday AM. Batch all active files.', s.save)).join('')}
      </div>
      ${bridgeRow([
        { label: 'Transaction milestone playbook', action: 'vault:fact-milestone-updates', primary: true },
        { label: 'Weekly pipeline review', action: 'process:weekly-pipeline' },
        { label: 'Referral Partners', action: 'section:referrals' }
      ])}
      ${proTip('Batch all Monday videos Sunday night or first thing Monday. End every single one with a real question — it drives replies and keeps the relationship two-way.')}
    `;
    attachHandlers(contentEl);
  }

  function renderPreCloseConfirmation(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">FINAL 48 HOURS</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">WIRE SAFETY</span>
      </div>
      ${whyBox('Why the Final 48 Hours Need White-Glove Treatment', 'This is the highest-anxiety window for most clients. One surprise at the closing table (wrong wire instructions, missing ID, HOA issue) can turn a celebration into a nightmare. Your job is to make the last two days feel calm, organized, and celebratory.')}
      <div class="space-y-4 mb-6">
        ${scriptCard('48-hour confirmation call',
          'Hey [Name], it\'s [Your Name] — just doing our 48-hour pre-closing confirmation call. I want to walk through exactly what to expect so there are zero surprises on closing day. We\'re still on track for [time] at [location]. You\'ll need to bring your ID (driver\'s license or passport) and a certified check or wire confirmation for [amount if applicable]. I\'ve already verified the wire instructions with the title company — I\'ll text you the verified number you can call to confirm before you send anything. Any last questions on your end before we get you the keys?',
          'Schedule 48 hours before closing — not the morning of.', 'Process: 48h Pre-Close Call')}
        ${scriptCard('Wire safety script (text or email)',
          'Important: Before you send any wire, call this number to verbally verify the instructions — [insert verified title company callback number]. I will never email you new wire instructions at the last minute. If anything looks different or you get an email asking you to change the wire, call me immediately before sending anything. This is how we keep you safe.',
          'Send wire safety language every purchase — no exceptions.', 'Process: Wire Safety Language')}
        ${scriptCard('Final walkthrough + lender CD coordination',
          'Your lender just confirmed Clear to Close — huge milestone! The Closing Disclosure will hit your email soon. I recommend a quick walk-through call with your lender (I\'m happy to join if you want). On my side, let\'s lock in your final walkthrough and I\'ll send a simple closing-day checklist so there are zero surprises. What time works for the walkthrough?',
          'Coordinate walkthrough + lender CD review — never let buyers feel alone at the finish line.', 'Process: Final Walkthrough + CD Coordination')}
        ${scriptCard('Closing celebration + handoff',
          'Congratulations [Name]! We did it — you officially own the home! I\'m so happy for you and your family. I sent a short celebration video to your text. If you\'d like a quick photo with the keys at the table, let me know — I\'d love to capture the moment. Here\'s exactly what happens next: title will record [today/tomorrow], you\'ll get the keys once it records, and I\'m your point of contact for anything that comes up in the first 30 days. Welcome home!',
          'Sets up the 7-day call naturally.', 'Process: Closing Celebration Handoff')}
      </div>
      <div class="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm mb-6">
        <strong>Pre-closing checklist:</strong> ID confirmed · Wire verified verbally · Lender CD review scheduled · Final walkthrough coordinated with listing agent · 5-item buyer checklist sent night before
      </div>
      ${bridgeRow([
        { label: '7-day post-closing framework', action: 'vault:post-closing-7day', primary: true },
        { label: 'Digital closing advantage', action: 'vault:fact-digital-closing' },
        { label: 'Closing excellence stats', action: 'vault:fact-closing-excellence' }
      ])}
      ${proTip('For purchases, coordinate the final walkthrough timing with all parties and send the buyer a short 5-item checklist the night before ("check all lights and outlets, test every faucet, look for new damage"). It makes buyers feel prepared and in control — and you look like the pro who thinks of everything.')}
    `;
    attachHandlers(contentEl);
  }

  const RENDERERS = {
    'weekly-pipeline': renderWeeklyPipeline,
    'post-closing-7day': renderPostClosing7Day,
    'realtor-onboarding': renderRealtorOnboarding,
    'monday-status': renderMondayStatus,
    'pre-close-confirmation': renderPreCloseConfirmation
  };

  window.renderRichProcessModal = function renderRichProcessModal(key, contentEl) {
    if (!key || !contentEl) return false;
    const fn = RENDERERS[key];
    if (!fn) return false;
    fn(contentEl);
    return true;
  };

  window.getProcessModalTitle = function getProcessModalTitle(key) {
    return TITLES[key] || null;
  };

  window.__PROCESS_MODALS_EXPORTS = {
    renderRichProcessModal: window.renderRichProcessModal,
    getProcessModalTitle: window.getProcessModalTitle
  };

  window.restoreProcessModals = function restoreProcessModals() {
    const exp = window.__PROCESS_MODALS_EXPORTS;
    if (!exp) return;
    Object.keys(exp).forEach(function (key) {
      window[key] = exp[key];
    });
  };

  console.log('%c[process-rich-modals] Premium process playbooks ready (' + Object.keys(RENDERERS).length + ' templates)', 'color:#00A89D');
})();