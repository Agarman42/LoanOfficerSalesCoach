/**
 * js/features/event-rich-modals.js
 * Premium modals for Event Planning playbooks + Client Appreciation guides.
 */
(function () {
  'use strict';

  const EVENT_TITLES = {
    'client-appreciation': 'Client Appreciation Events',
    'partner-mastermind': 'Partner Masterminds & Roundtables',
    'social-networking': 'Social & Community Networking',
    'community-charity': 'Community & Charity Events',
    'value-first': 'Value First — The Non-Negotiable Foundation',
    'invite-plus-one': 'Invite +1 — Your Built-in Lead Machine',
    'co-host-leverage': 'Co-Host for Leverage — Double Reach, Half the Cost',
    'frequency-goal': 'Frequency Goal — 4–6 Events Per Year Without Burnout',
    'post-event-followup': 'Post-Event Follow-Up Mastery',
    'drive-attendance': 'Getting People to Show Up — The Attendance Playbook'
  };

  const APPRECIATION_TITLES = {
    events: 'Client Appreciation Events – Execution Guide',
    touches: 'High-ROI Personal Touches',
    partners: 'Realtor & Partner Events'
  };

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function whyBox(label, text, accent) {
    const color = accent === 'orange' ? '#F15A29' : '#00A89D';
    return `
      <div class="bg-[${color}]/10 border border-[${color}]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[${color}]"></i><span class="font-bold text-[${color}] uppercase tracking-wider text-sm">${esc(label)}</span></div>
        <p class="text-[15px] leading-relaxed">${text}</p>
      </div>`;
  }

  function sectionTitle(text) {
    return `<h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">${text}</h4>`;
  }

  function stepCard(title, body) {
    return `<div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-[15px]"><strong>${esc(title)}</strong><br>${body}</div>`;
  }

  function scriptCard(title, script, tip, saveKey) {
    return `
      <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div class="font-semibold text-sm text-[#002B5C] dark:text-white mb-2">${esc(title)}</div>
        <div class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">"${esc(script)}"</div>
        ${tip ? `<div class="mt-2 text-[10px] text-gray-500">${esc(tip)}</div>` : ''}
        <button type="button" data-event-copy="${esc(script)}"
          class="mt-3 text-[10px] px-3 py-1.5 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold transition">
          <i class="fas fa-copy mr-1"></i>Copy script
        </button>
        ${saveKey ? `<button type="button" data-event-save="${esc(saveKey)}" data-event-save-text="${esc(script)}"
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
      <div class="mt-6 p-4 bg-[#002B5C]/5 border border-[#002B5C]/20 rounded-2xl">
        <strong class="block mb-2 text-sm text-[#002B5C] dark:text-white">Related Guides</strong>
        <div class="flex flex-wrap gap-2">
          ${buttons.map((b) => `
            <button type="button" data-event-bridge="${esc(b.action)}"
              class="text-xs px-3 py-2 rounded-xl border font-semibold transition whitespace-nowrap ${b.primary ? 'border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white' : b.accent ? 'border-[#F15A29] text-[#F15A29] hover:bg-[#F15A29] hover:text-white' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}">
              ${esc(b.label)} →
            </button>`).join('')}
        </div>
      </div>`;
  }

  function nextStepsHtml(links, label) {
    if (typeof window.renderModalNextSteps === 'function') {
      return window.renderModalNextSteps(links, label || 'Put This to Work');
    }
    return '';
  }

  function attachHandlers(contentEl) {
    contentEl.querySelectorAll('[data-event-copy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-event-copy') || '';
        navigator.clipboard.writeText(text).then(() => {
          const orig = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
          setTimeout(() => { btn.innerHTML = orig; }, 1600);
        }).catch(() => {});
      });
    });

    contentEl.querySelectorAll('[data-event-save]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-event-save');
        const text = btn.getAttribute('data-event-save-text') || '';
        if (typeof window.toggleSaveIdea === 'function') {
          window.toggleSaveIdea(key, text, btn, 'event');
        }
      });
    });

    contentEl.querySelectorAll('[data-event-bridge]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-event-bridge');
        runBridge(action);
      });
    });
  }

  function runBridge(action) {
    if (typeof window.closeAllModals === 'function') window.closeAllModals();
    else {
      if (typeof closeNamedModal === 'function') closeNamedModal('client-appreciation-modal');
      if (typeof closeDetailModal === 'function') closeDetailModal();
    }
    setTimeout(() => {
      if (!action) return;
      if (action.startsWith('event:') && typeof window.openEventModal === 'function') {
        window.openEventModal(action.slice(6));
      } else if (action.startsWith('appreciation:') && typeof window.showClientAppreciationModal === 'function') {
        window.showClientAppreciationModal(action.slice(13));
      } else if (action.startsWith('section:') && typeof window.showSection === 'function') {
        window.showSection(action.slice(8));
      } else if (action === 'referrals' && typeof window.openReferralPartnersTool === 'function') {
        window.openReferralPartnersTool();
      } else if (action === 'referrals' && typeof window.showSection === 'function') {
        window.showSection('referrals');
      } else if (action === 'nurture-anniversary' && typeof window.showNurtureTemplateModal === 'function') {
        window.showNurtureTemplateModal('anniversary');
      } else if (action === 'nurture-birthday' && typeof window.showNurtureTemplateModal === 'function') {
        window.showNurtureTemplateModal('birthday-video');
      }
    }, 280);
  }

  // ─── EVENT PLANNING RENDERERS ────────────────────────────────────────
  function renderClientAppreciation(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">CLIENT APPRECIATION</span></div>
      ${whyBox('Why These Events Compound Referrals',
        'Client appreciation parties feel like a genuine thank-you, not a sales pitch. The +1 policy turns every guest into a potential new lead. One great event can generate 5–20+ referrals over 12 months through emotional connection, photos, and social proof.',
        'teal')}
      ${sectionTitle('Recommended 4-Event Annual Cadence')}
      <div class="grid md:grid-cols-2 gap-4 mb-6 text-sm">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Q1: Pie Day / Ice Cream Social</strong><p class="mt-1">$150–250. Invite 40–60 past clients +1. Lawn games, high warmth.</p></div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Q2: Shred Day + Spring Cleanup</strong><p class="mt-1">Partner with shredding company. Practical value + conversation starter.</p></div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Q3: Summer Picnic / Back-to-School</strong><p class="mt-1">Family-friendly. Great for photos with kids.</p></div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Q4: Holiday Cookie Exchange</strong><p class="mt-1">Highest attendance. Short year-in-review thank-you moment.</p></div>
      </div>
      ${sectionTitle('Full Execution Playbook')}
      <div class="space-y-3 mb-6">
        ${stepCard('6–8 Weeks Out', 'Lock date + venue. Theme and budget ($150–400). Create Canva invite.')}
        ${stepCard('3–4 Weeks Out', 'Personal video/text invites to top 60–80. Track RSVPs. Order food, decor, gifts.')}
        ${stepCard('Event Day', 'Arrive 60–90 min early. Welcome table. 100+ photos. Mingle 80%. 2-min thank-you toast.')}
        ${stepCard('Within 48 Hours', 'Group thank-you + photos. Personal text to +1 guests. Ask who to invite next time.')}
        ${stepCard('Next 30 Days', 'Post 3–5 photos on social. Handwritten notes to VIPs. Track referral conversations.')}
      </div>
      <div class="space-y-4 mb-6">
        ${scriptCard('Client +1 Invitation', 'You\'re invited! As a thank you for trusting me with your home, I\'d love to celebrate with you and a guest at our annual Pie Day Social on [Date] from 2-4pm at [Location]. Food, drinks, and good company on me — bring someone you love! RSVP by [date].', 'Lead with gratitude — never business talk.', 'Event: Client Appreciation Invite')}
        ${scriptCard('VIP Personal Text', 'Hey [Name] — I\'m hosting a small client appreciation event next month and would love to have you there. Low-key, great food, bring a friend or spouse. No pitches, just a thank you from me.', 'Send to A+ clients personally — not mass blast.', 'Event: VIP Personal Text')}
        ${scriptCard('48-Hour Thank-You', '[Name], thank you SO much for coming — it genuinely made my week seeing you (and meeting [guest name]). Here are photos from the day. If anyone in your world is thinking about real estate, I\'m always happy to help. No pressure ever.', 'Name the +1 from your check-in sheet.', 'Event: 48h Thank You')}
      </div>
      ${proTip('Always allow +1. Take 100+ photos. Send personal thank-you within 48h. Ask "Who should I invite next time?" Track referrals from event guests for 90 days.')}
      ${bridgeRow([
        { label: 'Getting People to Show Up', action: 'event:drive-attendance', primary: true },
        { label: 'Post-Event Follow-Up', action: 'event:post-event-followup', accent: true },
        { label: 'Value Vault (Gift Ideas)', action: 'section:value-vault' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderPartnerMastermind(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">PARTNER MASTERMIND</span></div>
      ${whyBox('Why Sphere & Partner Events Convert So Well',
        'Your sphere, past clients, and referral partners crave connection, local insight, and reasons to stay in touch. When you host a high-value, non-salesy gathering — open house happy hour, client appreciation mixer, or neighborhood market chat — they view you as the go-to agent in town.',
        'orange')}
      ${sectionTitle('Three High-Impact Event Formats (Agent POV)')}
      <div class="space-y-3 mb-6 text-sm">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Open House Happy Hour (60–90 min)</strong><p class="mt-1">Co-host with a lender or stager. Drinks + casual tour. Face time with neighbors and buyers. 3–4x/year.</p></div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Client Appreciation Mixer</strong><p class="mt-1">40–60 past clients +1. Pie Day, picnic, or cookie exchange. Pure gratitude. Highest referral ROI.</p></div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Sphere Coffee & Market Chat</strong><p class="mt-1">8–15 warm contacts. One timely neighborhood topic. Light food. Cost: $150–250.</p></div>
      </div>
      ${sectionTitle('60–90 Minute Sphere Event Agenda')}
      <div class="space-y-2 mb-6 text-[15px]">
        ${stepCard('0–10 min', 'Welcome, food, light intros')}
        ${stepCard('10–35 min', '20-min neighborhood market insight or guest speaker — 2–3 actionable takeaways')}
        ${stepCard('35–55 min', 'Open roundtable: "What\'s happening in your world right now?"')}
        ${stepCard('55–70 min', 'Q&A on buying, selling, and local market timing — zero sales pitch')}
        ${stepCard('70–90 min', 'Networking + "Who in your world should I make sure gets an invite next time?"')}
      </div>
      <div class="space-y-4 mb-6">
        ${scriptCard('Open House Happy Hour Invite', 'You\'re invited to a casual open house happy hour at [Address] on [Date] — drinks, light bites, and a relaxed tour. Bring a friend or neighbor if you\'d like. No sales pitch, just good company and a peek at a great home. RSVP to [contact].', 'Personal text beats mass email for sphere and past clients.', 'Event: Open House Invite')}
        ${scriptCard('Post-Event Recap + Soft Ask', 'Thanks again for coming to [Event]. Here\'s the neighborhood market snapshot I promised. Biggest takeaway: buyers and sellers who feel informed make calmer decisions. If anyone in your world is curious about what\'s happening locally, I\'m always happy to be a no-pressure resource.', 'Send within 24 hours with your handout attached.', 'Event: Sphere Event Recap')}
      </div>
      ${proTip('Keep it 60–90 min max. Send recap with stats within 24h. Over-deliver on the first event with a new group — it earns you trusted partner status faster than any ad spend.')}
      ${bridgeRow([
        { label: 'Referral Partner Playbooks', action: 'referrals', primary: true },
        { label: 'Partner Events (Database Nurturing)', action: 'appreciation:partners', accent: true },
        { label: 'Post-Event Follow-Up', action: 'event:post-event-followup' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderSocialNetworking(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">NETWORKING</span></div>
      ${whyBox('Why Showing Up Matters',
        'People remember who consistently supports the community — not who only appears when they want a referral. Chamber mixers, charity 5Ks, and happy hours put you in rooms full of sphere and partner prospects while generating weeks of authentic content.',
        'teal')}
      ${sectionTitle('Two Modes: Attend vs. Host')}
      <div class="grid md:grid-cols-2 gap-4 mb-6 text-sm">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Attend (2–4/month)</strong><p class="mt-1">Chamber, BNI, Rotary, charity runs. Goal: 3 real conversations per event.</p></div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Host (quarterly)</strong><p class="mt-1">Happy hour or breakfast mixer. You control guest list. Budget: $150–400.</p></div>
      </div>
      ${sectionTitle('At-Event Playbook')}
      <ul class="text-sm space-y-1.5 mb-6 pl-5 list-disc">
        <li>Micro-goal: 3 real conversations — listen 80%</li>
        <li>Lead with curiosity: "What brought you here tonight?"</li>
        <li>Take 5–10 photos for social content same week</li>
        <li>Collect name + one personal detail + how you met</li>
        <li>Before leaving: connect on LinkedIn or text 2–3 people you clicked with</li>
      </ul>
      <div class="space-y-4 mb-6">
        ${scriptCard('Happy Hour Invite (Host Your Own)', 'Hey [Name] — I\'m putting together a small group for happy hour at [Local Spot] next Thursday. No agenda, just good people and good conversation. First round on me.', 'Personal invites to 25–40 warm contacts.', 'Event: Happy Hour Invite')}
        ${scriptCard('48-Hour Follow-Up (New Connection)', 'Great meeting you at [Event]! I\'m [Your Name] — I help families buy and sell homes in [Area] without the usual chaos. Would love to stay connected — what\'s the best way to reach you?', 'No pitch. Just genuine connection.', 'Event: Networking Follow-Up')}
      </div>
      ${proTip('Pick 1–2 recurring groups and go deep for 6 months — that\'s when referrals start showing up. Personal follow-up within 48 hours with anyone new.')}
      ${bridgeRow([
        { label: 'Social Strategy', action: 'section:social', primary: true },
        { label: 'Community & Charity Events', action: 'event:community-charity', accent: true },
        { label: 'Post-Event Follow-Up', action: 'event:post-event-followup' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderCommunityCharity(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">COMMUNITY & CHARITY</span></div>
      ${whyBox('Why This Builds Long-Term Trust',
        'People remember who shows up for the community when it counts. Charity events signal who you are beyond listing flyers — and give you authentic content for 2–4 weeks. Co-hosting with a lender or local business splits cost and multiplies reach.',
        'teal')}
      ${sectionTitle('Four Proven Formats (Pick 2–3 Per Year)')}
      <div class="space-y-2 mb-6 text-sm">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Back-to-School Supply Drive</strong> — Co-host with agents. Late July/early August.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Charity 5K Sponsorship</strong> — Branded tent or water station. Meet dozens of locals.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Shred Day + Food Drive</strong> — Practical value + community service.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Youth Sports Sponsorship</strong> — Co-sponsor with top realtor. Months of visibility.</div>
      </div>
      ${sectionTitle('Co-Host Playbook with Realtor Partners')}
      <div class="space-y-2 mb-6">
        ${stepCard('Pick the Right Partner', 'Shares your values, will actually promote — not just show up.')}
        ${stepCard('Split 50/50', 'Cost, promotion, day-of labor, photo posting. One-page "who does what."')}
        ${stepCard('Cross-Promote', 'Both post to social, email databases, personally invite top clients.')}
        ${stepCard('Debrief Within 48 Hours', 'What worked, attendance count, who to invite next time.')}
      </div>
      <div class="space-y-4 mb-6">
        ${scriptCard('Realtor Co-Host Pitch', 'Hey [Agent] — I\'d love to co-host a [back-to-school drive / shred day / 5K sponsorship] with you this [season]. I\'ll split cost and promotion 50/50. Want to grab 15 minutes to pick a date?', 'Lead with mutual benefit — content + goodwill.', 'Event: Realtor Co-Host Pitch')}
        ${scriptCard('Charity Invitation', 'We\'re teaming up with [Charity] for [Event] on [Date]. Would love your help — donate, volunteer an hour, or spread the word. Hope to see you there!', 'Works for clients, sphere, and social.', 'Event: Charity Invite')}
      </div>
      ${proTip('Go deep on 2–3 causes per year instead of spreading thin. Tag the nonprofit and every volunteer in photos. Follow the Post-Event playbook within 48 hours.')}
      ${bridgeRow([
        { label: 'Post-Event Follow-Up', action: 'event:post-event-followup', primary: true },
        { label: 'Client Appreciation Events', action: 'event:client-appreciation', accent: true },
        { label: 'Social Strategy', action: 'section:social' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderValueFirst(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">EVENT PHILOSOPHY</span></div>
      ${whyBox('Value First — The Non-Negotiable Foundation',
        'When guests feel they received a genuine gift (fun, food, connection) with zero sales pressure, they lower their guard and become natural advocates. This is why some top agents get 15–30 referrals from one event while others get zero.',
        'teal')}
      ${sectionTitle('How to Execute Value-First Events')}
      <ul class="text-sm space-y-2 mb-6 pl-5 list-disc">
        <li><strong>No pitches at the event</strong> — Business talk waits for private follow-ups 48+ hours later</li>
        <li><strong>Make it memorable</strong> — Unique venue, great food, photo moments, fun activity</li>
        <li><strong>Honor people publicly</strong> — Recognize anniversaries warm and non-salesy</li>
        <li><strong>Give before you ask</strong> — Photos, thank-yous, and gifts come first</li>
      </ul>
      ${sectionTitle('Pre-Event Value Checklist')}
      <ul class="text-sm space-y-1.5 mb-6 pl-5 list-disc">
        <li>Invite copy emphasizes gratitude and fun — not networking or business</li>
        <li>Venue and experience feel intentional</li>
        <li>2-minute welcome toast scripted — no slides, no market pitch decks</li>
        <li>Photo moments planned</li>
        <li>Post-event follow-up blocks on calendar before invites go out</li>
      </ul>
      <div class="space-y-4 mb-6">
        ${scriptCard('Event Welcome Toast (2 min max)', 'Thank you all for being here tonight. This is my thank-you to the people who have trusted me with their homes — no agenda, no pitch, just gratitude and good company. Enjoy yourselves.', 'Then mingle — zero sales pitch unless they ask.', 'Event Philosophy: Welcome Toast')}
        ${scriptCard('Housing Question Deflection', 'I would love to chat about that — let me grab your info and we can talk this week when I can give you real attention. Tonight is about celebrating, not business talk.', 'Collect contact info warmly — never dismissive.', 'Event Philosophy: Housing Deflection')}
      </div>
      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-6"><strong>Success Metric:</strong> 30%+ of guests bring a +1, and 3+ guests mention the event positively within 10 days.</div>
      ${bridgeRow([
        { label: 'Invite +1 Policy', action: 'event:invite-plus-one', primary: true },
        { label: 'Client Appreciation Events', action: 'event:client-appreciation', accent: true },
        { label: 'Post-Event Follow-Up', action: 'event:post-event-followup' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderInvitePlusOne(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">EVENT PHILOSOPHY</span></div>
      ${whyBox('Invite +1 — Your Built-in Lead Machine',
        'The +1 policy is the highest-ROI feature of any event. Every guest who attends is a warm prospect who already trusts the host. Smart agents turn one 50-person event into 15–25 new CRM contacts.',
        'teal')}
      ${sectionTitle('Where to Put the +1 Policy')}
      <ul class="text-sm space-y-1.5 mb-6 pl-5 list-disc">
        <li><strong>Every invite</strong> — text, email, and social RSVP posts</li>
        <li><strong>Reminder message</strong> — 48 hours before: "Can\'t wait to see you and your +1!"</li>
        <li><strong>Check-in table</strong> — "Who did you bring tonight?" on sign-in sheet</li>
        <li><strong>Welcome toast</strong> — "Love seeing new faces — thanks for bringing people you care about"</li>
      </ul>
      <div class="space-y-4 mb-6">
        ${scriptCard('+1 Line for Invites', 'You are invited — and please bring someone you love! A friend, neighbor, or family member. No business talk, just good people and good times.', 'Put this in every invite channel.', 'Event Philosophy: Plus One Invite')}
        ${scriptCard('+1 Follow-Up (Within 72 Hours)', 'It was great meeting you at [Event] as [Host Name]\'s guest. If you or anyone in your world ever has questions about buying or selling a home, I\'m happy to be a resource — no pressure whatsoever.', 'Tag in CRM: Met at [Event] via [Host].', 'Event Philosophy: Plus One Follow Up')}
        ${scriptCard('Day 1 Thank-You (Name the +1)', 'Thank you for coming to [Event Name] — and for bringing [Guest Name]! So good to meet them. Here are photos from the night. Who else should I make sure gets an invite next time?', 'Use the +1 name from check-in — this detail impresses.', 'Event Philosophy: Plus One Thank You')}
      </div>
      <p class="text-sm mb-6">Tag every +1 as: <strong>Met at [Event Name] via [Host Name]</strong>. These convert 3–5x higher than cold leads.</p>
      ${proTip('At check-in, ask "Who did you bring tonight?" and write it down. Use their name in the Day 1 thank-you text.')}
      ${bridgeRow([
        { label: 'Getting People to Show Up', action: 'event:drive-attendance', primary: true },
        { label: 'Value First Foundation', action: 'event:value-first' },
        { label: 'Post-Event Follow-Up', action: 'event:post-event-followup', accent: true }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderCoHostLeverage(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">EVENT PHILOSOPHY</span></div>
      ${whyBox('Co-Host for Leverage',
        'Co-hosting with a top realtor or local business doubles your marketing reach and cuts costs dramatically. It creates a natural reason for future joint events and deepens the partnership.',
        'teal')}
      ${sectionTitle('How to Structure a Co-Hosted Event')}
      <div class="space-y-2 mb-6">
        ${stepCard('Choose the right partner', 'Realtors who send business or have complementary audiences.')}
        ${stepCard('Split responsibilities in writing', 'Venue, invites, food, photos, follow-up. Both names on all marketing.')}
        ${stepCard('Split costs 50/50', 'Or alternate who pays. Clarity upfront prevents resentment.')}
        ${stepCard('Both promote to both lists', 'Success metric: 40%+ of attendees from co-host list.')}
      </div>
      <div class="space-y-4 mb-6">
        ${scriptCard('Co-Host Outreach (Lender Partner)', 'I have been thinking about a small client appreciation event this [season] — would you want to co-host? I will handle half the food and logistics if you invite your top referral partners and sphere. We both get the credit, half the cost.', 'Warm personal text to lenders or local businesses you already have rapport with.', 'Event Philosophy: Co-Host Outreach')}
        ${scriptCard('Co-Host Agreement Recap', 'Quick recap: I handle [food/venue], you handle [invites/promotion]. Both names on every piece. Split costs 50/50. I handle attendee thank-yous, you handle partner recap. Sound good?', 'Confirm in writing before money is spent.', 'Event Philosophy: Co-Host Agreement')}
        ${scriptCard('Post-Event Co-Host Debrief', 'Great event last night — thank you for co-hosting. I counted [X] from your list and [Y] from mine. Let\'s do another one in [season] and track referrals from tonight separately.', 'Sets up the next joint event.', 'Event Philosophy: Co-Host Debrief')}
      </div>
      ${proTip('Both parties should commit to 2 joint events per year. Track referrals from co-host attendees separately in CRM.')}
      ${bridgeRow([
        { label: 'Community / Charity Events', action: 'event:community-charity', primary: true },
        { label: 'Referral Partner Playbooks', action: 'referrals', accent: true },
        { label: 'Annual Event Rhythm', action: 'event:frequency-goal' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderFrequencyGoal(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">EVENT PHILOSOPHY</span></div>
      ${whyBox('Frequency Goal — 4–6 Events Per Year',
        'Too many events and you burn out. Too few and you disappear. The sweet spot for most successful agents is 4–6 high-quality events per year, thoughtfully spaced and themed.',
        'teal')}
      ${sectionTitle('Recommended Annual Rhythm')}
      <div class="grid sm:grid-cols-2 gap-3 mb-6 text-sm">
        <div class="border rounded-2xl p-3"><strong>Q1:</strong> Client Appreciation (post-tax season)</div>
        <div class="border rounded-2xl p-3"><strong>Q2:</strong> Open House Happy Hour or Sphere Market Chat</div>
        <div class="border rounded-2xl p-3"><strong>Q3:</strong> Community / Charity Event</div>
        <div class="border rounded-2xl p-3"><strong>Q4:</strong> Big Holiday Client + Partner Appreciation</div>
      </div>
      ${sectionTitle('Annual Planning Ritual (December — 60 Minutes)')}
      <ol class="space-y-2 mb-6 pl-5 list-decimal text-sm">
        <li>Block 4–6 dates before anything else fills them</li>
        <li>Assign event type to each date</li>
        <li>Identify co-host partners for 2 events</li>
        <li>Budget total annual spend ($1,500–$4,000 for most agents)</li>
        <li>Schedule post-event follow-up blocks for each date</li>
        <li>Reuse winning formats — do not reinvent every quarter</li>
      </ol>
      ${sectionTitle('Burnout Prevention Rules')}
      <ul class="text-sm space-y-1.5 mb-6 pl-5 list-disc">
        <li>Never schedule two major events within 3 weeks</li>
        <li>Batch invite writing and follow-up</li>
        <li>Delegate photos, food ordering, RSVP tracking when possible</li>
        <li>If an event type drained you, swap it next year</li>
      </ul>
      <div class="space-y-4 mb-6">
        ${scriptCard('Save-the-Date (Early Calendar Hold)', 'Save the date — [Event Name] is coming [Month/Day]. My annual thank-you to clients and partners. Great food, good people, no business talk. Mark your calendar — formal invite coming soon.', 'Send 6–8 weeks before invites.', 'Event Philosophy: Save the Date')}
      </div>
      ${proTip('Reuse formats that worked — a great Pie Day party can run the same way for 5 years and get easier each time.')}
      ${bridgeRow([
        { label: 'Client Appreciation', action: 'event:client-appreciation', primary: true },
        { label: 'Co-Host Strategy', action: 'event:co-host-leverage', accent: true },
        { label: 'Weekly Win Plan', action: 'section:weekly-win-plan' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderDriveAttendance(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">#1 TEAM REQUEST</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">FILL THE ROOM</span>
      </div>
      ${whyBox('Why Attendance Feels Hard (And How to Fix It)',
        'Low turnout is almost never "people don\'t like events." It\'s usually weak invites, wrong timing, salesy positioning, or no reminder system. The agents who consistently get 30–50+ guests run a <strong>personal invite machine</strong> — not a one-time mass email and hope.',
        'orange')}
      ${sectionTitle('The Realistic Math (Set Expectations for Your Team)')}
      <div class="grid sm:grid-cols-3 gap-3 mb-6 text-sm">
        <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600"><strong class="text-[#00A89D]">Client appreciation</strong><br>Invite 80–100 personally → expect 25–45 attendees (30–50% show rate when done right)</div>
        <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600"><strong class="text-[#00A89D]">Partner mastermind</strong><br>Invite 18–22 agents → cap at 12–15 seats (scarcity + intimacy drives yeses)</div>
        <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600"><strong class="text-[#00A89D]">Community / charity</strong><br>Open format — focus on 40+ touchpoints + photos; RSVPs matter less</div>
      </div>
      ${sectionTitle('The 7 Reasons People Don\'t Show Up')}
      <ul class="text-sm space-y-1.5 mb-6 pl-5 list-disc text-gray-700 dark:text-gray-300">
        <li><strong>Mass email only</strong> — feels generic; gets ignored</li>
        <li><strong>Event sounds like a sales pitch</strong> — "listing seminar" or hard sell kills warmth</li>
        <li><strong>No personal follow-up</strong> — one invite is not enough</li>
        <li><strong>Bad timing</strong> — conflicts with kids\' sports, holidays, or tax crunch without positioning</li>
        <li><strong>No +1 policy</strong> — halves your potential headcount</li>
        <li><strong>Wrong invite list</strong> — only C-tier contacts who barely know you</li>
        <li><strong>No social proof</strong> — they don\'t see others saying yes</li>
      </ul>
      ${sectionTitle('The 5-Touch Invite System (Non-Negotiable)')}
      <div class="space-y-3 mb-6">
        ${stepCard('Touch 1 — Save the Date (6–8 weeks out)', 'Soft calendar hold to A+ and B only. No hard RSVP yet — just "mark your calendar."')}
        ${stepCard('Touch 2 — Personal Invite (3–4 weeks out)', '30-second video or personal text to A+ VIPs first, then B tier. Include +1 line and what they get (food, fun, zero pitch).')}
        ${stepCard('Touch 3 — Social Proof Wave (2 weeks out)', 'Email/text to wider list AFTER you have 15+ RSVPs: "Already 22 families confirmed — would love to have you." Post last year\'s photos.')}
        ${stepCard('Touch 4 — 1-Week Reminder', 'Personal text to everyone who said yes OR maybe: "Saving you a plate — still good for Saturday?"')}
        ${stepCard('Touch 5 — Morning-Of Text', 'Short warm note to all RSVPs: "Doors open at 2 — can\'t wait to see you and your +1!"')}
      </div>
      ${sectionTitle('Who to Invite First (Tier Strategy)')}
      <div class="grid md:grid-cols-3 gap-3 mb-6 text-sm">
        <div class="border border-[#002B5C]/30 rounded-2xl p-4"><strong class="text-[#002B5C]">Wave 1: A+ VIPs</strong><p class="mt-1">Personal video or call. These 30–50 people should get invited 7–10 days before everyone else.</p></div>
        <div class="border border-[#00A89D]/30 rounded-2xl p-4"><strong class="text-[#00A89D]">Wave 2: B Tier + Top Partners</strong><p class="mt-1">Personal text referencing something real. Realtors co-promote to their top clients.</p></div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong>C Tier / Newsletter</strong><p class="mt-1">Only after Wave 1–2 are underway. Never lead with mass blast to cold contacts.</p></div>
      </div>
      ${sectionTitle('Format & Timing That Boosts Turnout')}
      <ul class="text-sm space-y-1.5 mb-6 pl-5 list-disc">
        <li><strong>Best client event windows:</strong> Saturday 10am–2pm or Sunday 2–4pm (family-friendly)</li>
        <li><strong>Best mastermind windows:</strong> Tue/Wed 5:30–7:30pm with food ready at 5:30</li>
        <li><strong>Lead with the experience:</strong> "Pie, drinks, and good company" — not "networking" or "learn about the market"</li>
        <li><strong>Make RSVP stupid-easy:</strong> "Reply YES" to text — not a multi-field form</li>
        <li><strong>Use scarcity honestly:</strong> "Capping at 50 so it stays personal" — then actually cap it</li>
        <li><strong>Show photos from last year</strong> in every invite wave — proof it was fun</li>
      </ul>
      ${sectionTitle('Ready-to-Use Scripts (Copy + Save)')}
      <div class="space-y-4 mb-6">
        ${scriptCard('Save-the-Date (6–8 weeks out)', 'Save the date — I\'m hosting my annual client thank-you [Pie Day / picnic / cookie exchange] on [Date] from [Time] at [Location]. Mark your calendar — formal invite coming soon. You and a guest will be on the list.', 'Send to A+ and B before the wider list.', 'Attendance: Save the Date')}
        ${scriptCard('Personal Video Script (30 sec)', 'Hey [Name] — it\'s [Your Name]. I\'m hosting a small thank-you event next month and you\'re on my short list. Great food, you can bring someone you love, and zero sales pitch — just gratitude and catching up. Would love to see you there. Shoot me a quick YES if you\'re in.', 'Record 15–20 in one batch for A+ VIPs.', 'Attendance: Personal Video Invite')}
        ${scriptCard('Social Proof Invite (2 weeks out)', 'Quick note — our client appreciation [event name] is [date] and we already have [X] families confirmed. Would genuinely love to have you and a guest there. Food and drinks on me — reply YES and I\'ll save your spot.', 'Only send after you have 15+ RSVPs — the number creates momentum.', 'Attendance: Social Proof Invite')}
        ${scriptCard('1-Week Reminder', 'Hey [Name] — quick reminder our [event] is this [day] from [time] at [location]. You and a guest are on the list — would love to see you there! Reply YES so I can save you a plate.', 'Personalize day/time only — body stays the same for batching.', 'Attendance: 1-Week Reminder')}
        ${scriptCard('Morning-Of Text', 'Doors open at [time] — can\'t wait to see you (and your +1 if they\'re coming)! Address: [location]. Parking is [detail]. See you soon!', 'Send to all RSVPs by 9am event day.', 'Attendance: Morning Of Text')}
        ${scriptCard('Personal Call Script (Low RSVP Recovery)', 'Hey [Name] — I know calendars are crazy. I\'m putting the final headcount together for [event] and wanted to personally make sure you knew you\'re invited. It\'s low-key, great food, bring a friend — no business talk. Would it help if I held a spot for you and a guest?', 'Use when 2 weeks out and under 15 RSVPs — call top 20 A+/B personally.', 'Attendance: Recovery Call')}
        ${scriptCard('Ask an A+ to Help Fill the Room', 'Hey [Name] — you\'ve been to these before and know the vibe. I\'m trying to make sure the right people are in the room this year. Is there anyone in your world who would enjoy a fun, no-pitch client thank-you event? Happy to personally invite them if you give me a name.', 'Your best attendees are your best promoters — ask 5 VIPs directly.', 'Attendance: VIP Referral Ask')}
      </div>
      ${sectionTitle('Low RSVP Recovery Playbook (2 Weeks Out, Under 15 Confirmed)')}
      <ol class="text-sm space-y-1.5 mb-6 pl-5 list-decimal">
        <li>Stop mass emailing — switch to personal calls/texts to top 30 A+/B contacts</li>
        <li>Post throwback photos from last year\'s event on social with "Save the date — [new date]"</li>
        <li>Ask 5 confirmed guests: "Who else should I make sure gets an invite?"</li>
        <li>Co-host or realtor partner sends personal invite to their top 20 clients</li>
        <li>Offer a simple hook: free shred, kids\' activity, or local food truck — one memorable detail</li>
        <li>Extend personal invite deadline 5 days — then close RSVPs to create urgency</li>
      </ol>
      ${sectionTitle('Co-Host & Partner Tactics (Double Your Headcount)')}
      <ul class="text-sm space-y-1.5 mb-6 pl-5 list-disc">
        <li>Realtor partner sends personal text to their top 20 — both names on the invite</li>
        <li>Split promotion: you own past clients, they own sphere + active buyers</li>
        <li>Partner posts to social 2 weeks and 3 days before — tag you, tag the venue</li>
        <li>Offer agent a reason to come: "Bring your top buyer who\'s on the fence — no pressure environment"</li>
      </ul>
      <div class="p-4 bg-white dark:bg-gray-900 border border-[#00A89D]/40 rounded-2xl text-sm mb-6">
        <strong class="text-[#00A89D]">Team Accountability Metric:</strong> Track invites sent, RSVPs, and actual attendance every event. Goal: 30%+ show rate on personal invites to A+/B. If under 20%, audit the invite scripts and reminder sequence before blaming the event format.
      </div>
      ${proTip('The first 15 RSVPs are the hardest. Pour personal energy into A+ VIPs first — when they say yes and you mention their names (with permission), everyone else feels safer saying yes too.')}
      ${bridgeRow([
        { label: 'Invite +1 Policy', action: 'event:invite-plus-one', primary: true },
        { label: 'Value First Foundation', action: 'event:value-first' },
        { label: 'Co-Host for Leverage', action: 'event:co-host-leverage', accent: true },
        { label: 'Client Appreciation Events', action: 'event:client-appreciation' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderPostEventFollowup(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">POST-EVENT MASTERY</span></div>
      ${whyBox('Why the Follow-Up Is Everything',
        'The event gets their attention. The follow-up turns it into referrals for the next 12 months. A disciplined 5-phase system creates attribution, deepens loyalty, and generates measurable referrals. This is where 80% of the ROI lives.',
        'orange')}
      ${sectionTitle('The 5-Phase Mastery Timeline')}
      <div class="space-y-3 mb-6">
        ${stepCard('Phase 1 — Day 1', 'Mass thank-you email/text with best photos. Ask "Who should I invite next time?" Log every +1 in CRM.')}
        ${stepCard('Phase 2 — Day 3', 'Post 3–5 social highlights tagging everyone. Schedule 2 more posts.')}
        ${stepCard('Phase 3 — Week 1', 'Personal call/text to top 8–10 VIPs. Reference a specific moment from the night.')}
        ${stepCard('Phase 4 — Week 2', 'Photo gifts, local treats, or handwritten notes to key partners.')}
        ${stepCard('Phase 5 — Month 1', '"Saw this and thought of you" text referencing a real moment. Track referrals.')}
      </div>
      ${sectionTitle('Segmented Follow-Up by Audience')}
      <div class="grid md:grid-cols-2 gap-3 mb-6 text-sm">
        <div class="border border-[#00A89D]/30 bg-[#00A89D]/5 rounded-2xl p-4"><strong class="text-[#00A89D]">Past Clients</strong><br>Gratitude-first. Soft ask: who to invite next time.</div>
        <div class="border border-[#F15A29]/30 bg-[#F15A29]/5 rounded-2xl p-4"><strong class="text-[#F15A29]">+1 Guests</strong><br>Personal intro within 72h. CRM tag: Met at [Event] via [Host].</div>
        <div class="border border-[#002B5C]/30 bg-[#002B5C]/5 rounded-2xl p-4"><strong>Realtors / Partners</strong><br>Partnership tone. Offer coffee. Ask who else in office should come.</div>
        <div class="border border-gray-200 rounded-2xl p-4"><strong>Sphere</strong><br>Light social tone. Invite to next event. Zero business talk unless they bring it up.</div>
      </div>
      <div class="space-y-4 mb-6">
        ${scriptCard('Day 1 Thank-You (All Attendees)', 'Thank you for joining us at [Event Name]! It was so good to see you and [Guest if known]. Here are my favorite photos: [Link]. Who should I invite next time?', 'Send morning after — batch-friendly.', 'Event: Day 1 Thank You')}
        ${scriptCard('Week 1 VIP Personal', 'Hey [Name] — loved catching up at [Event]. The story about [specific detail] had me laughing all week. Who else should I have at the next one?', 'Reference something real from your night-of notes.', 'Event: Week 1 VIP Personal')}
        ${scriptCard('+1 Guest Follow-Up (72 Hours)', 'It was great meeting you at [Event Name] — [Host Name] speaks highly of you. If you or anyone in your world ever has questions about buying or selling a home, I\'m happy to be a resource. No pressure whatsoever.', 'Warm intro — not a pitch.', 'Event: Plus One Follow Up')}
      </div>
      ${proTip('Batch your touches — Day 1 morning (30 min), Day 3 social (20 min), Week 1 personal (45 min). One well-run event + disciplined follow-up can be worth 5–10 closed sides per year in referrals.')}
      ${bridgeRow([
        { label: 'Getting People to Show Up', action: 'event:drive-attendance', primary: true },
        { label: 'Client Appreciation Events', action: 'event:client-appreciation', accent: true },
        { label: 'Database Nurturing', action: 'section:database-nurturing' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  // ─── CLIENT APPRECIATION RENDERERS ───────────────────────────────────
  function renderAppreciationEvents(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">ANNUAL CADENCE</span></div>
      ${whyBox('Why These Events Compound Referrals',
        'Events turn satisfied clients into raving fans who bring photos, stories, and referrals. The photos become months of content and the personal interactions become the stories they tell their friends and realtors.',
        'teal')}
      ${sectionTitle('Recommended 4-Event Annual Cadence')}
      <div class="grid md:grid-cols-2 gap-4 mb-6 text-sm">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Q1: Pie Day / Ice Cream</strong><p class="mt-1">$150–250. 40–60 clients +1.</p></div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Q2: Shred Day</strong><p class="mt-1">Partner with shredding company + plant giveaway.</p></div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Q3: Summer Picnic</strong><p class="mt-1">Family-friendly. School supply drive optional.</p></div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Q4: Cookie Exchange</strong><p class="mt-1">Highest attendance of the year.</p></div>
      </div>
      ${sectionTitle('Execution Playbook')}
      <div class="space-y-2 mb-6">
        ${stepCard('6–8 Weeks Out', 'Lock date + venue. Budget $150–400. Create invite.')}
        ${stepCard('3–4 Weeks Out', 'Personal invites to top 60–80. Track RSVPs. Order food and decor.')}
        ${stepCard('Event Day', 'Welcome table. 100+ photos. Mingle 80%. No pitch.')}
        ${stepCard('Within 48 Hours', 'Thank-you + photos. Personal text to +1 guests.')}
      </div>
      <div class="space-y-4 mb-6">
        ${scriptCard('Pie Day / Casual Invite', 'Hey [Name] — I\'m hosting a small Pie Day celebration next month as a thank-you to some of my favorite clients and their families. You and a guest are invited — pie, drinks, and good company on me. Would love to catch up in person!', 'Allow +1 in every invite.', 'Client Event Invite')}
      </div>
      ${proTip('Always allow +1. Take photos of every guest. Post 3–5 best ones over the following weeks. The social proof lasts for months.')}
      ${nextStepsHtml([
        { label: 'Getting People to Show Up', onclick: "closeNamedModal('client-appreciation-modal'); if(typeof window.showSection==='function')window.showSection('eventplanning'); setTimeout(()=>{if(typeof window.openEventModal==='function')window.openEventModal('drive-attendance');},350);", style: 'primary' },
        { label: 'Full Party Playbook (Event Planning)', onclick: "closeNamedModal('client-appreciation-modal'); if(typeof window.showSection==='function')window.showSection('eventplanning'); setTimeout(()=>{if(typeof window.openEventModal==='function')window.openEventModal('client-appreciation');},350);", style: 'accent' },
        { label: 'Post-Event Follow-Up Scripts', onclick: "closeNamedModal('client-appreciation-modal'); if(typeof window.openEventModal==='function')window.openEventModal('post-event-followup');" }
      ], 'Want the Full Execution Guide?')}
    `;
    attachHandlers(contentEl);
  }

  function renderAppreciationTouches(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">HIGH-ROI TOUCHES</span></div>
      ${whyBox('Why These Touches Deliver Massive Emotional ROI',
        'Small, thoughtful, personal gestures beat generic marketing every time. They feel rare in 2026 and create outsized gratitude and referrals. The key is consistency + specificity.',
        'teal')}
      ${sectionTitle('Four High-Impact Touches')}
      <div class="space-y-4 mb-6">
        ${scriptCard('Home Anniversary Card + Gift', '[Name], I can\'t believe it\'s already [X] years since you got the keys! Hope the house is still treating you well. I pulled a quick update on values in your neighborhood — happy to hop on a 10-minute call if you\'re curious what your equity looks like. No strings attached.', 'Send 7–10 days before anniversary. Include meaningful small gift.', 'High-ROI Touch: Anniversary')}
        ${scriptCard('Birthday Video (30–45 sec)', 'Hey [First Name], it\'s [Your Name] — I just wanted to wish you a happy birthday! Hope you\'re doing something fun today. I\'ve been thinking about you and how much I enjoyed helping you get into your home. If there\'s ever anything I can do, just let me know. Have an amazing day!', 'Reference one personal detail if you know it.', 'High-ROI Touch: Birthday Video')}
        ${scriptCard('Just Sold in Your Neighborhood', 'Just closed on a great 3-bed in [Neighborhood] — happy to share what the market is actually doing if you or anyone in your world is curious. No pitch, just data.', 'Works as text, email, or social caption.', 'High-ROI Touch: Just Sold')}
      </div>
      ${sectionTitle('Additional High-ROI Touches')}
      <ul class="text-sm space-y-2 mb-6 pl-5 list-disc">
        <li><strong>Annual Equity Snapshot</strong> — Simple one-pager or 60-second video once a year</li>
        <li><strong>Life-Event Response</strong> — Small relevant gift + note within a week</li>
        <li><strong>Handwritten "Just Because" Notes</strong> — 3x per year for A+ and rising B</li>
      </ul>
      ${proTip('Keep a private CRM note with kids\' names, hobbies, last vacation. Reference it before every touch.')}
      ${nextStepsHtml([
        { label: 'Life Event Playbooks', onclick: "closeNamedModal('client-appreciation-modal'); if(typeof window.showSection==='function')window.showSection('database-nurturing');", style: 'primary' },
        { label: 'Value Vault (Gift Ideas)', onclick: "closeNamedModal('client-appreciation-modal'); if(typeof window.showSection==='function')window.showSection('value-vault');", style: 'accent' },
        { label: 'Equity Scanner', onclick: "closeNamedModal('client-appreciation-modal'); if(typeof window.showSection==='function')window.showSection('equity-scanner');" }
      ])}
      ${bridgeRow([
        { label: 'Anniversary nurture template', action: 'nurture-anniversary', primary: true },
        { label: 'Birthday video template', action: 'nurture-birthday' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderAppreciationPartners(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">PARTNER EVENTS</span></div>
      ${whyBox('Why Partner Events Are Your Highest-Leverage Marketing',
        'Lender partners and local businesses who feel genuinely appreciated and supported will send you their best referrals. Events let you give them value, visibility, and a chance to deepen the relationship in a non-transactional setting.',
        'teal')}
      ${sectionTitle('Three High-Impact Partner Event Formats')}
      <div class="space-y-3 mb-6 text-sm">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Quarterly Mastermind (60–90 min)</strong><p class="mt-1">8–15 agents. Timely topic. Light food. $200–350.</p></div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Open House Happy Hour</strong><p class="mt-1">Co-host with a lender or stager. Drinks + casual tour + neighbor meet-and-greet.</p></div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">VIP Dinner</strong><p class="mt-1">Top 8–12 senders. 1–2x per year. Inner circle building.</p></div>
      </div>
      <div class="space-y-4 mb-6">
        ${scriptCard('Sphere Coffee & Market Chat Invite', 'I\'m hosting a small, no-fluff neighborhood market chat for some of my favorite clients and sphere next month. Topic: What\'s Actually Happening in [Area] Right Now. Coffee and pastries on me. Limited to 12 spots — would love to have you there.', 'Lead with value and connection — never a hard sell.', 'Sphere Event Invite')}
      </div>
      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-6"><strong>Key Rule:</strong> Keep events educational and relationship-first. Publicly celebrate their wins on social (with permission).</div>
      ${nextStepsHtml([
        { label: 'Partner Mastermind (Event Planning)', onclick: "closeNamedModal('client-appreciation-modal'); if(typeof window.showSection==='function')window.showSection('eventplanning'); setTimeout(()=>{if(typeof window.openEventModal==='function')window.openEventModal('partner-mastermind');},350);", style: 'primary' },
        { label: 'Referral Partner Playbooks', onclick: "closeNamedModal('client-appreciation-modal'); if(typeof window.showSection==='function')window.showSection('referrals');", style: 'accent' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  const EVENT_RENDERERS = {
    'client-appreciation': renderClientAppreciation,
    'partner-mastermind': renderPartnerMastermind,
    'social-networking': renderSocialNetworking,
    'community-charity': renderCommunityCharity,
    'value-first': renderValueFirst,
    'invite-plus-one': renderInvitePlusOne,
    'co-host-leverage': renderCoHostLeverage,
    'frequency-goal': renderFrequencyGoal,
    'post-event-followup': renderPostEventFollowup,
    'drive-attendance': renderDriveAttendance
  };

  const APPRECIATION_RENDERERS = {
    events: renderAppreciationEvents,
    touches: renderAppreciationTouches,
    partners: renderAppreciationPartners
  };

  window.renderRichEventModal = function renderRichEventModal(type, contentEl) {
    if (!type || !contentEl) return false;
    const fn = EVENT_RENDERERS[type];
    if (!fn) return false;
    fn(contentEl);
    return true;
  };

  window.renderRichAppreciationModal = function renderRichAppreciationModal(mode, contentEl) {
    const key = mode === 'touches' || mode === 'partners' ? mode : 'events';
    if (!contentEl) return false;
    const fn = APPRECIATION_RENDERERS[key];
    if (!fn) return false;
    fn(contentEl);
    return true;
  };

  window.getEventModalTitle = function getEventModalTitle(type) {
    return EVENT_TITLES[type] || null;
  };

  window.getAppreciationModalTitle = function getAppreciationModalTitle(mode) {
    const key = mode === 'touches' || mode === 'partners' ? mode : 'events';
    return APPRECIATION_TITLES[key] || null;
  };

  window.__EVENT_MODALS_EXPORTS = {
    renderRichEventModal: window.renderRichEventModal,
    renderRichAppreciationModal: window.renderRichAppreciationModal,
    getEventModalTitle: window.getEventModalTitle,
    getAppreciationModalTitle: window.getAppreciationModalTitle
  };

  window.restoreEventModals = function restoreEventModals() {
    const exp = window.__EVENT_MODALS_EXPORTS;
    if (!exp) return;
    Object.keys(exp).forEach(function (k) {
      window[k] = exp[k];
    });
  };

  console.log('%c[event-rich-modals] Premium event + appreciation modals ready (' +
    Object.keys(EVENT_RENDERERS).length + ' events, ' +
    Object.keys(APPRECIATION_RENDERERS).length + ' appreciation)', 'color:#00A89D');
})();