
// =====================================================
// EVENT PLANNING HELPERS (reliable globals for modals + saving)
// =====================================================
window.openEventModal = function(type) {
  try {
    let modal = document.getElementById('modal-' + type);
    
    // Fallback search in case of any DOM weirdness / whitespace issues
    if (!modal) {
      modal = document.querySelector('#modal-' + type);
    }
    if (!modal) {
      // Last resort: search by partial id match
      modal = document.querySelector('[id*="modal-' + type + '"]');
    }

    if (modal) {
      const contentEl = modal.querySelector('[data-event-content]') ||
        modal.querySelector('.overflow-y-auto.max-h-\\[68vh\\]') ||
        modal.querySelector('.overflow-y-auto');
      if (contentEl && typeof window.renderRichEventModal === 'function') {
        window.renderRichEventModal(type, contentEl);
      }
      if (typeof window.openNamedModal === 'function') {
        window.openNamedModal(modal);
      } else if (typeof window.openAppModal === 'function') {
        window.openAppModal(modal);
      } else {
        if (modal.parentElement !== document.body) document.body.appendChild(modal);
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.style.display = 'flex';
        modal.style.position = 'fixed';
        modal.style.inset = '0';
        modal.style.zIndex = '9999';
        modal.scrollTop = 0;
      }
      return;
    }

    // If still not found, create a temporary working modal with the actual content (rich premium fallback)
    console.warn('[Event] Static modal not found for type:', type, '— using rich fallback modal');
    const contentMap = {
      'client-appreciation': `
        <div class="px-1">
          <div class="flex items-center gap-2 mb-1"><span class="inline-block px-3 py-1 text-xs font-bold rounded-full bg-[#00A89D]/10 text-[#00A89D]">CLIENT APPRECIATION</span></div>
          <h3 class="text-2xl md:text-3xl font-bold mb-1 text-[#002B5C] dark:text-white">Client Appreciation Events</h3>
          <p class="text-[15px] text-gray-600 dark:text-gray-400 mb-4">Turn past clients into lifelong raving fans who actively send you referrals and bring their friends.</p>

          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
            <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why These Events Crush ROI</span></div>
            <p class="text-[15px]">These feel like a genuine thank-you, not a sales pitch. The +1 policy turns every guest into a potential new lead while you stay top-of-mind in the most positive, emotional way. One great event can generate 5–20+ referrals over 12 months through the emotional connection and social proof.</p>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Proven Formats That Work</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-6 text-sm">
            <div class="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600">Pie Day / Ice Cream Social</div>
            <div class="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600">Holiday Cookie Exchange</div>
            <div class="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600">Family Movie Night or Wine Tasting</div>
            <div class="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600">Pumpkin Giveaway or Free Shred Day</div>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Scripts &amp; Invites (Copy + Save)</h4>
          <div class="space-y-3 mb-6">
            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="You’re invited! As a thank you for trusting me with your home, I’d love to celebrate with you and a guest at our annual Pie Day Social on [Date] from 2-4pm at [Location]. Food, drinks, and good company on me — bring someone you love! RSVP by [date] so I can plan for everyone.">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                  <strong class="text-sm font-semibold">Client +1 Invitation (Text/Email)</strong>
                  <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“You’re invited! As a thank you for trusting me with your home, I’d love to celebrate with you and a guest at our annual Pie Day Social on [Date] from 2-4pm at [Location]. Food, drinks, and good company on me — bring someone you love! RSVP by [date] so I can plan for everyone.”</div>
                </div>
                <div class="flex flex-col gap-1">
                  <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Event: Client Appreciation Invite', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'event');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>

            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name] — just a quick personal text. I’m hosting a small client appreciation event next month and would love to have you there. It’s low-key, great food, and you can bring a friend or spouse. No pitches, just a thank you from me. Let me know if you’re in!">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                  <strong class="text-sm font-semibold">Personal Warm Text to VIPs</strong>
                  <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name] — just a quick personal text. I’m hosting a small client appreciation event next month and would love to have you there. It’s low-key, great food, and you can bring a friend or spouse. No pitches, just a thank you from me. Let me know if you’re in!”</div>
                </div>
                <div class="flex flex-col gap-1">
                  <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Event: VIP Personal Text', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'event');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
            <strong>Pro Tips for Max Impact:</strong> Always allow +1 — this is your lead gen engine. Take 100+ photos and post for weeks after (tag everyone). Send a personal thank-you text or note within 48h. Ask “Who should I invite next time?” in every follow-up. Track how many referrals come from event guests in the next 90 days.
          </div>
        </div>
      `,
      'partner-mastermind': `
        <div class="px-1">
          <div class="flex items-center gap-2 mb-1"><span class="inline-block px-3 py-1 text-xs font-bold rounded-full bg-[#00A89D]/10 text-[#00A89D]">PARTNER MASTERMIND</span></div>
          <h3 class="text-2xl md:text-3xl font-bold mb-1 text-[#002B5C] dark:text-white">Agent &amp; Partner Masterminds</h3>
          <p class="text-[15px] text-gray-600 dark:text-gray-400 mb-4">Become the go-to local expert in your market — the agent your sphere, clients, and referral partners trust to host the room.</p>

          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
            <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Masterminds Convert So Well</span></div>
            <p class="text-[15px]">Your sphere, past clients, and fellow agents crave education, networking, and ways to feel confident in a shifting market. When you host a high-value, non-salesy roundtable with real insights, they view you as the expert — and refer business because you made them look smart. Over-communicate on the first one and you lock in the relationship.</p>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Run Topics + Scripts</h4>
          <div class="space-y-3 mb-6">
            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Join me for an exclusive evening with top producers. “Winning Offers in Today’s Market” on [Date] — great food, fresh data on what’s actually working right now, and open discussion. Limited to 15 agents. RSVP to [your email/phone].">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                  <strong class="text-sm font-semibold">Mastermind Invitation to Top Fellow Agents &amp; Partners</strong>
                  <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Join me for an exclusive evening with top producers. “Winning Offers in Today’s Market” on [Date] — great food, fresh data on what’s actually working right now, and open discussion. Limited to 15 agents. RSVP to [your email/phone].”</div>
                </div>
                <div class="flex flex-col gap-1">
                  <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Event: Mastermind Invite', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'event');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>

            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Thanks again for coming last night. Here’s the one-page market snapshot I promised with the current absorption rates and days-on-market by neighborhood. The biggest takeaway from the group: the agents who are winning right now are the ones over-communicating with their buyer clients about realistic timelines. Who do you have coming up that I can help look like a hero for?">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                  <strong class="text-sm font-semibold">Post-Mastermind Recap + Soft Ask</strong>
                  <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Thanks again for coming last night. Here’s the one-page market snapshot I promised with the current absorption rates and days-on-market by neighborhood. The biggest takeaway from the group: the agents who are winning right now are the ones over-communicating with their buyer clients about realistic timelines. Who do you have coming up that I can help look like a hero for?”</div>
                </div>
                <div class="flex flex-col gap-1">
                  <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Event: Mastermind Recap Ask', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'event');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
            <strong>Pro Tips:</strong> Keep it 60–90 min max. End every session with the natural ask. Always send a recap with stats within 24h. Over-deliver on the first event with a new group — it earns you the spot on their “go-to” list faster than anything else.
          </div>
        </div>
      `,
      'social-networking': `
        <div class="px-1">
          <div class="flex items-center gap-2 mb-1"><span class="inline-block px-3 py-1 text-xs font-bold rounded-full bg-[#002B5C]/10 text-[#002B5C]">NETWORKING &amp; COMMUNITY</span></div>
          <h3 class="text-2xl md:text-3xl font-bold mb-1 text-[#002B5C] dark:text-white">Social &amp; Community Networking Events</h3>
          <p class="text-[15px] text-gray-600 dark:text-gray-400 mb-4">Meet new people, stay visible, support local causes, and create weeks of authentic content — without ever feeling salesy.</p>

          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
            <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Showing Up Matters</span></div>
            <p class="text-[15px]">People remember the person who consistently supports the community and shows up to socialize, not the one who only appears when they want a referral. These events give you real relationships + endless content that positions you as a genuine member of the town.</p>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">High-ROI Formats + Follow-Up Scripts</h4>
          <div class="space-y-3 mb-6">
            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name] — I’m putting together a small group for happy hour at [Local Spot] next Thursday to celebrate the end of summer. No agenda, just good people and good conversation. Would love to have you there if you’re free. First round on me.">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                  <strong class="text-sm font-semibold">Casual Happy Hour Invite</strong>
                  <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name] — I’m putting together a small group for happy hour at [Local Spot] next Thursday to celebrate the end of summer. No agenda, just good people and good conversation. Would love to have you there if you’re free. First round on me.”</div>
                </div>
                <div class="flex flex-col gap-1">
                  <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Event: Happy Hour Invite', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'event');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
            <strong>Pro Tips:</strong> Be genuinely helpful — don’t lead with business. Take photos (with permission) and post for weeks. Personally follow up within 48 hours with anyone new you connected with. Use the event as content gold for the next month.
          </div>
        </div>
      `,
      'community-charity': `
        <div class="px-1">
          <div class="flex items-center gap-2 mb-1"><span class="inline-block px-3 py-1 text-xs font-bold rounded-full bg-[#00A89D]/10 text-[#00A89D]">COMMUNITY IMPACT</span></div>
          <h3 class="text-2xl md:text-3xl font-bold mb-1 text-[#002B5C] dark:text-white">Community &amp; Charity Events</h3>
          <p class="text-[15px] text-gray-600 dark:text-gray-400 mb-4">Build authentic local reputation, create shareable content, and deepen partnerships with fellow agents and local businesses while doing real good.</p>

          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
            <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why This Builds Long-Term Trust</span></div>
            <p class="text-[15px]">People remember who shows up for the community when it counts. These events give you real, authentic content and position you as someone who cares about the area — not just another agent chasing listings. Co-hosting with partners multiplies reach and deepens trust.</p>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Strong Repeatable Plays + Scripts</h4>
          <div class="space-y-3 mb-6">
            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="We’re teaming up with fellow agent [Agent Name] to sponsor the local youth soccer league this season. If you have a kid in the program or just want to support the community, come out to the first game [date]. We’ll have snacks and info on how families can get involved.">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                  <strong class="text-sm font-semibold">Co-Hosted Youth Sports Invite</strong>
                  <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“We’re teaming up with fellow agent [Agent Name] to sponsor the local youth soccer league this season. If you have a kid in the program or just want to support the community, come out to the first game [date]. We’ll have snacks and info on how families can get involved.”</div>
                </div>
                <div class="flex flex-col gap-1">
                  <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Event: Charity Co-Host Invite', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'event');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
            <strong>Pro Tips:</strong> Partner with 1–2 fellow agents, lenders, or title companies — share cost and spotlight. Take lots of photos and post (tag everyone). Use the event as content for the next 2–4 weeks. These create the best “real person” social proof you can get.
          </div>
        </div>
      `,
      'post-event-followup': `
        <div class="px-1">
          <div class="flex items-center gap-2 mb-1"><span class="inline-block px-3 py-1 text-xs font-bold rounded-full bg-[#00A89D]/10 text-[#00A89D]">POST-EVENT MASTERY</span></div>
          <h3 class="text-2xl md:text-3xl font-bold mb-1 text-[#002B5C] dark:text-white">Post-Event Follow-Up System</h3>
          <p class="text-[15px] text-gray-600 dark:text-gray-400 mb-4">The event gets their attention. The follow-up turns it into referrals for the next 12 months. This is where 80% of the ROI lives — and where most agents drop the ball.</p>

          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
            <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why the Follow-Up Is Everything</span></div>
            <p class="text-[15px]">Clients and partners are emotionally high right after a great event. Strike while the memory is warm. A disciplined 5-phase system (photos + personal + social + gift + long-tail) creates attribution, deepens loyalty, and generates measurable referrals. Batch your touches — it takes less time than you think and compounds massively.</p>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">The 5-Phase Mastery Playbook + Scripts</h4>
          <div class="space-y-3 mb-6">
            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Thank you for joining us at [Event Name]! It was so good to see you and [Guest or +1 if known]. Here are some of my favorite photos from the night: [Link or attached collage]. Who should I invite next time? I’d love to keep growing this group with people like you.">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                  <strong class="text-sm font-semibold">Day 1 Thank-You Email / Text (All Attendees)</strong>
                  <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Thank you for joining us at [Event Name]! It was so good to see you and [Guest or +1 if known]. Here are some of my favorite photos from the night: [Link or attached collage]. Who should I invite next time? I’d love to keep growing this group with people like you.”</div>
                </div>
                <div class="flex flex-col gap-1">
                  <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Event: Day 1 Thank You', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'event');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>

            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="What a night! Huge thanks to everyone who came out for [Event Name]. Tagging some of my favorite moments and the amazing people who made it special. If you missed it, I’ll be doing another one soon — who should I make sure gets an invite? [3-5 photos]">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                  <strong class="text-sm font-semibold">Day 3 Social Highlights Post (Tag Everyone)</strong>
                  <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“What a night! Huge thanks to everyone who came out for [Event Name]. Tagging some of my favorite moments and the amazing people who made it special. If you missed it, I’ll be doing another one soon — who should I make sure gets an invite? [3-5 photos]”</div>
                </div>
                <div class="flex flex-col gap-1">
                  <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Event: Social Highlights', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'event');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>

            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name] — quick personal note after [Event Name]. Loved catching up with you and [spouse/guest]. The story you told about [specific detail from conversation] had me laughing all week. If you ever need anything on the real estate side (or just want to grab coffee), I’m here. And seriously — who else should I have at the next one?">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                  <strong class="text-sm font-semibold">Week 1 Personal Call/Text to VIPs &amp; Partners</strong>
                  <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name] — quick personal note after [Event Name]. Loved catching up with you and [spouse/guest]. The story you told about [specific detail from conversation] had me laughing all week. If you ever need anything on the real estate side (or just want to grab coffee), I’m here. And seriously — who else should I have at the next one?”</div>
                </div>
                <div class="flex flex-col gap-1">
                  <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Event: Week 1 VIP Personal', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'event');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Your Post-Event Batching Ritual (Do This Every Time)</h4>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-6 text-[15px]">
            Day 1 morning: Send mass thank-you + upload photos. Day 3: Schedule 3–5 social posts tagging everyone. Week 1: Block 45 minutes for personal calls/texts to the top 8–10 people (use your notes from the night). Week 2: Order 5–10 small printed photo gifts or local treats for key partners. Month 1: One personal “saw this and thought of you” text referencing a real moment. Log every new contact + referral attribution in CRM.
          </div>

          <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
            <strong>Key Insight &amp; Measurement:</strong> The follow-up is where events become systems. Track: # of +1 guests who became leads, referrals attributed to event attendees in 90 days, repeat event attendees. One well-run event + follow-up system can be worth 5–10 loans per year in referrals alone.
          </div>
        </div>
      `,
      'value-first': `
        <div class="px-1">
          <h3 class="text-2xl md:text-3xl font-bold mb-2 text-[#002B5C] dark:text-white">Value First — The Non-Negotiable Foundation</h3>
          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
            <p class="text-[15px]">When guests feel they received a genuine gift (fun, food, connection, recognition) with zero sales pressure, they lower their guard and become natural advocates. This is the single biggest reason some agents get 15–30 referrals from one event while others get zero.</p>
          </div>

          <h4 class="font-bold text-lg mb-3">How to Execute Value-First Events</h4>
          <ul class="space-y-2 text-[15px] mb-6">
            <li><strong>No pitches at the event</strong> — Save any business talk for private follow-ups 48+ hours later.</li>
            <li><strong>Make it memorable</strong> — Unique venue, great food, live music, photo opportunities, or a fun activity.</li>
            <li><strong>Honor people publicly</strong> — Recognize anniversaries, referrals sent, or personal milestones in a warm, non-salesy way.</li>
          </ul>

          <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
            <strong>Success Metric:</strong> At least 30% of guests bring a +1, and 3+ guests mention the event positively in follow-up conversations within 10 days.
          </div>

          <div class="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700 text-sm">
            <div class="font-semibold mb-1 text-[#00A89D]">Connect this philosophy to the rest of your system:</div>
            <div class="flex flex-wrap gap-2">
              <span onclick="window.showSection && window.showSection('database');" class="cursor-pointer inline-block px-3 py-1 text-xs rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Database Nurturing (A+/B/C + scalable touches)</span>
              <span onclick="if(typeof window.openReferralPartnersTool==='function'){window.openReferralPartnersTool();}" class="cursor-pointer inline-block px-3 py-1 text-xs rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Referral Partners (co-host &amp; partner events)</span>
              <span onclick="window.showSection && window.showSection('process');" class="cursor-pointer inline-block px-3 py-1 text-xs rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Transaction Process (7-Day post-close tie-in)</span>
            </div>
          </div>
        </div>
      `,
      'invite-plus-one': `
        <div class="px-1">
          <h3 class="text-2xl md:text-3xl font-bold mb-2 text-[#002B5C] dark:text-white">Invite +1 — Your Built-in Lead Machine</h3>
          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
            <p class="text-[15px]">The +1 policy is the highest-ROI feature of any event. Every friend who attends is a warm prospect who already trusts the host (your client or partner). This is how smart agents turn one event into 8–15 new relationships.</p>
          </div>

          <h4 class="font-bold text-lg mb-3">Exact Messaging &amp; Follow-Up</h4>
          <div class="space-y-3 mb-6 text-[15px]">
            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">“Bring someone you love — a friend, neighbor, or family member. The more the merrier. No business talk, just good people and good times.”</div>
            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">After the event, personally follow up with every +1 within 72 hours: “It was great meeting you at [Event]. If you ever have questions about the homebuying or financing process, I’m happy to be a resource — no pressure whatsoever.”</div>
          </div>

          <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
            <strong>Pro Tip:</strong> Track every +1 in your CRM with a note “Met at [Event] as guest of [Host]”. These convert 3–5x higher than cold leads.
          </div>
        </div>
      `,
      'co-host-leverage': `
        <div class="px-1">
          <h3 class="text-2xl md:text-3xl font-bold mb-2 text-[#002B5C] dark:text-white">Co-Host for Leverage — Double Reach, Half the Cost</h3>
          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
            <p class="text-[15px]">Co-hosting with a top fellow agent, local business, or your preferred lender partner instantly doubles your marketing reach and adds instant credibility. It also cuts your costs dramatically while creating a natural reason for future joint events.</p>
          </div>

          <h4 class="font-bold text-lg mb-3">How to Approach &amp; Structure</h4>
          <ul class="space-y-2 text-[15px] mb-6">
            <li><strong>Approach the right partners</strong> — Choose fellow agents, lender partners, or local businesses who share your values and complementary audiences.</li>
            <li><strong>Offer clear value</strong> — “I’ll handle market education and the guest experience if you invite your top 20 clients and split food costs.”</li>
            <li><strong>Split responsibilities in writing</strong> — Venue, invites, food, photos, follow-up.</li>
          </ul>

          <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
            <strong>Success Metric:</strong> At least 40% of attendees come from the co-host’s list. Both parties commit to 2 joint events per year.
          </div>
        </div>
      `,
      'frequency-goal': `
        <div class="px-1">
          <h3 class="text-2xl md:text-3xl font-bold mb-2 text-[#002B5C] dark:text-white">Frequency Goal — 4–6 Events Per Year Without Burnout</h3>
          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
            <p class="text-[15px]">Too many events and you burn out. Too few and you disappear. The sweet spot for most successful agents is 4–6 high-quality events per year, thoughtfully spaced and themed.</p>
          </div>

          <h4 class="font-bold text-lg mb-3">Recommended Annual Rhythm</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-sm">
            <div class="border rounded-2xl p-3">Q1: Client Appreciation (post-tax season relief)</div>
            <div class="border rounded-2xl p-3">Q2: Agent Mastermind or Education Event</div>
            <div class="border rounded-2xl p-3">Q3: Community / Charity Event (high visibility)</div>
            <div class="border rounded-2xl p-3">Q4: Big Holiday Client + Partner Appreciation</div>
          </div>

          <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
            <strong>Pro Tip:</strong> Plan the entire year in December. Block the dates on your calendar first, then fill in the details. This prevents the “I’m too busy” trap.
          </div>
        </div>
      `,
    };
    const guideContent = contentMap[type] || `<p>The detailed guide for this event type is available in the Event Planning section.</p>`;
    const richTitle = typeof window.getEventModalTitle === 'function' ? window.getEventModalTitle(type) : null;
    const fallback = document.createElement('div');
    fallback.className = 'fixed inset-0 bg-black/60 flex items-center justify-center p-4';
    fallback.style.zIndex = '9999';
    fallback.onclick = () => fallback.remove();

    fallback.innerHTML = `
      <div class="bg-white dark:bg-gray-900 rounded-3xl max-w-4xl w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onclick="event.stopImmediatePropagation()">
        <div class="px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#00A89D]/5 via-white to-white dark:via-gray-800 dark:to-gray-800 flex justify-between items-center">
          <div>
            <div class="text-[10px] font-bold tracking-[1.5px] text-[#00A89D] uppercase mb-0.5">Event Planning Playbooks</div>
            <h3 class="text-2xl md:text-3xl font-bold text-[#002B5C] dark:text-white">${richTitle || 'Event Guide'}</h3>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-4xl leading-none text-gray-400 hover:text-red-500 transition">&times;</button>
        </div>
        <div class="p-6 md:p-8 overflow-y-auto max-h-[68vh] text-[15px] leading-relaxed text-gray-700 dark:text-gray-300" data-event-fallback-content></div>
        <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end">
          <button onclick="this.closest('.fixed').remove()" class="px-5 py-2 rounded-2xl border text-sm font-medium hover:bg-white dark:hover:bg-gray-800">Close Guide</button>
        </div>
      </div>
    `;
    document.body.appendChild(fallback);
    const contentEl = fallback.querySelector('[data-event-fallback-content]');
    if (contentEl && typeof window.renderRichEventModal === 'function' && window.renderRichEventModal(type, contentEl)) {
      // rich renderer populated fallback
    } else if (contentEl) {
      contentEl.innerHTML = guideContent;
    }
  } catch (e) {
    console.error('[Event] openEventModal error', e);
    window.notifyUser('Could not open event guide. Please refresh the page and try again.', 'error', 5000);
  }
};

window.closeEventModal = function(type) {
  try {
    let modal = document.getElementById('modal-' + type);
    if (!modal) modal = document.querySelector('#modal-' + type);
    if (modal) {
      modal.classList.remove('flex');
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  } catch (e) {}
};

// =====================================================
// REFERRAL PARTNERS RICH MODALS (polished playbooks, tiers, high-impact sequences)
// Self-contained rich content with Why, multiple Copy+Save scripts, Pro Tips. Uses 'partner' save type.
// =====================================================
const REFERRAL_PLAYBOOKS = {
  'FellowAgents': {
    title: "Fellow Agents &amp; Co-Broke Partners — Playbook",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Co-Broke Relationships Compound</span></div>
        <p class="text-[15px]">Your fellow agents are both competitors and collaborators. The agents who show up reliably on co-broke files, communicate proactively, and make the other side look good earn referrals that no marketing spend can buy. One great co-broke experience often turns into years of mutual business.</p>
      </div>
      <h4 class="font-bold text-lg mb-3">Ready-to-Use Scripts &amp; Sequences (Copy + Save)</h4>
      <div class="space-y-3 mb-6">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Agent Name] — excited to co-broke this one with you on [address]. I’ll keep you copied on every milestone from my side and loop in our lender partner as needed. What’s the best way for us to stay in sync — text, email, or a quick call at offer acceptance?">
          <div class="flex justify-between"><div class="flex-1"><strong class="text-sm">Co-Broke Kickoff Text</strong><div class="text-[15px] mt-1">“Hey [Agent Name] — excited to co-broke this one with you on [address]. I’ll keep you copied on every milestone from my side and loop in our lender partner as needed. What’s the best way for us to stay in sync — text, email, or a quick call at offer acceptance?”</div></div><div class="flex flex-col gap-1"><button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Copy</button><button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Partner: Co-Broke Kickoff', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'partner');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D]">Save</button></div></div>
        </div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Great working with you on [address] — [Client] is thrilled and I hope the closing felt smooth on your end too. If you ever have buyers or sellers in [area] who need the same white-glove experience, I’d love to return the favor.">
          <div class="flex justify-between"><div class="flex-1"><strong class="text-sm">Post-Close Co-Broke Thank You</strong><div class="text-[15px] mt-1">“Great working with you on [address] — [Client] is thrilled and I hope the closing felt smooth on your end too. If you ever have buyers or sellers in [area] who need the same white-glove experience, I’d love to return the favor.”</div></div><div class="flex flex-col gap-1"><button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Copy</button><button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Partner: Co-Broke Thank You', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'partner');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D]">Save</button></div></div>
        </div>
      </div>
      <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm"><strong>Pro Tip:</strong> After every smooth co-broke, send a handwritten note within 48 hours. Agents remember who made them look good — and they refer accordingly.</div>
    `
  },
  'Lenders': {
    title: "Lenders &amp; Mortgage Partners — Playbook",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Your Lender Bench Wins Deals</span></div>
        <p class="text-[15px]">Top agents don’t have one lender — they have a bench of 2–3 loan officers who communicate fast, pre-qualify thoroughly, and protect your contracts. Build these relationships with value-first touches and flawless co-marketing on shared files.</p>
      </div>
      <h4 class="font-bold text-lg mb-3">Core Scripts (Copy + Save)</h4>
      <div class="space-y-3 mb-6">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Lender Name] — I just put [Buyer Name] under contract on [address]. I’ve already welcomed them and sent a simple roadmap. I’ll keep you in the loop on every step from my side — inspection, appraisal, repairs, and closing prep. What’s the best way for us to stay in sync on this one?">
          <div class="flex justify-between"><div class="flex-1"><strong class="text-sm">Day 0 Lender Handoff</strong><div class="text-[15px] mt-1">“Hey [Lender Name] — I just put [Buyer Name] under contract on [address]. I’ve already welcomed them and sent a simple roadmap. I’ll keep you in the loop on every step from my side — inspection, appraisal, repairs, and closing prep. What’s the best way for us to stay in sync on this one?”</div></div><div class="flex flex-col gap-1"><button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Copy</button><button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Partner: Lender Handoff', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'partner');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D]">Save</button></div></div>
        </div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Quick market note for your buyers — inventory in [Area] shifted this month and we’re seeing more negotiation room. Happy to co-host a buyer Q&amp;A or open house if that would help your pipeline. No pitch, just partnership.">
          <div class="flex justify-between"><div class="flex-1"><strong class="text-sm">Monthly Value Touch</strong><div class="text-[15px] mt-1">“Quick market note for your buyers — inventory in [Area] shifted this month and we’re seeing more negotiation room. Happy to co-host a buyer Q&amp;A or open house if that would help your pipeline. No pitch, just partnership.”</div></div><div class="flex flex-col gap-1"><button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Copy</button><button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Partner: Lender Value Touch', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'partner');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D]">Save</button></div></div>
        </div>
      </div>
      <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm"><strong>Pro Tip:</strong> Run the 60-Day Partnership Onboarding sequence on your first shared file with any new lender. Over-communication on file one earns you the go-to spot.</div>
    `
  },
  'Title': {
    title: "Title &amp; Escrow Partners — Playbook",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Clean Closings Start with Title Relationships</span></div>
        <p class="text-[15px]">Responsive escrow officers and title reps who pick up the phone keep your deals on track — and send you referrals when agents in their network need someone reliable. Treat them like VIP partners, not vendors.</p>
      </div>
      <h4 class="font-bold text-lg mb-3">High-Value Plays</h4>
      <div class="space-y-3 mb-6">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name] — putting [address] into escrow with you on [date]. Buyer and seller agents are both copied. Please flag anything you need from my side early — I’d rather over-communicate than surprise anyone at the table.">
          <div class="flex justify-between"><div class="flex-1"><strong class="text-sm">Opening Escrow Handoff</strong><div class="text-[15px] mt-1">“Hey [Name] — putting [address] into escrow with you on [date]. Buyer and seller agents are both copied. Please flag anything you need from my side early — I’d rather over-communicate than surprise anyone at the table.”</div></div><div class="flex flex-col gap-1"><button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Copy</button><button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Partner: Title Handoff', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'partner');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D]">Save</button></div></div>
        </div>
      </div>
      <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm"><strong>Pro Tip:</strong> Invite your top title rep to one client appreciation event per year. They meet your sphere and remember you when agents ask for referrals.</div>
    `
  },
  'Builders': {
    title: "Builders — New Construction Playbook",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Builders Deliver Predictable Volume</span></div>
        <p class="text-[15px]">Getting on the preferred agent list with even one active builder can give you 10–30+ transactions per year with relatively low relationship maintenance. The key is making their entire sales team look like heroes and moving buyers from model-home visit to keys faster than any competitor.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Core Plays &amp; Scripts</h4>
      <div class="space-y-3 mb-6">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="I’d love to become a go-to agent for your community. I can offer your sales team a 30-minute lunch-and-learn on how buyers win in today’s market (with my lender partner covering financing basics), plus a simple one-pager they can keep at their desk. Would next Tuesday or Thursday work for a quick session?">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1">
              <strong class="text-sm font-semibold">Sales Team Training Offer</strong>
              <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“I’d love to become a go-to agent for your community. I can offer your sales team a 30-minute lunch-and-learn on how buyers win in today’s market (with my lender partner covering financing basics), plus a simple one-pager they can keep at their desk. Would next Tuesday or Thursday work for a quick session?”</div>
            </div>
            <div class="flex flex-col gap-1">
              <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Builder: Sales Training Offer', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'partner');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
            </div>
          </div>
        </div>

        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Quick update on [Buyer Name] — they’re fully pre-approved and we’re targeting clear to close by [date]. I’ll keep you posted the moment anything moves so your team can keep the buyer excited and on track.">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1">
              <strong class="text-sm font-semibold">Builder Sales Rep Update</strong>
              <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Quick update on [Buyer Name] — they’re fully pre-approved and we’re targeting clear to close by [date]. I’ll keep you posted the moment anything moves so your team can keep the buyer excited and on track.”</div>
            </div>
            <div class="flex flex-col gap-1">
              <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Builder: Sales Rep Update', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'partner');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
        <strong>Pro Tip:</strong> Be the fastest agent to return calls on builder deals. Offer joint buyer consultations at the model home with your lender partner. This combination usually beats every other agent on their short list.
      </div>
    `
  },
  'Financial Planners': {
    title: "Financial Planners &amp; CPAs — HNW Playbook",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why These Partners Send High-Quality Business</span></div>
        <p class="text-[15px]">Financial planners and CPAs work with clients who have real equity and complex needs (investment properties, retirement moves, divorce-related listings, etc.). They refer when they trust you to protect their client’s wealth and make them look smart.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">High-Value Plays &amp; Language</h4>
      <div class="space-y-3 mb-6">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="I’d love to be a resource for your clients who are thinking about buying, selling, or using their home equity strategically. Would you be open to a 20-minute coffee or Zoom where I can share the current market strategies that actually make sense for move-up and luxury buyers right now?">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1">
              <strong class="text-sm font-semibold">Educational Coffee/Zoom Invite</strong>
              <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“I’d love to be a resource for your clients who are thinking about buying, selling, or using their home equity strategically. Would you be open to a 20-minute coffee or Zoom where I can share the current market strategies that actually make sense for move-up and luxury buyers right now?”</div>
            </div>
            <div class="flex flex-col gap-1">
              <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('HNW: Educational Invite', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'partner');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
        <strong>Pro Tip:</strong> Offer to do a joint client workshop titled “Downsizing &amp; Equity Strategies for Pre-Retirees” or “Using Home Equity Without Disrupting Your Retirement Plan.” Co-branded value builds massive trust.
      </div>
    `
  },
  'Attorneys': {
    title: "Attorneys — Trust &amp; Referral Protocol Playbook",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Attorneys Are Extremely Loyal When Treated Right</span></div>
        <p class="text-[15px]">Divorce, probate, estate planning, and real estate attorneys send very high-quality referrals. They value two things above all: protecting their client’s timeline and looking like the competent professional who chose the right agent.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Reliable Handoff Language</h4>
      <div class="space-y-3 mb-6">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="I’ll treat your client like family and keep you copied on every major update so you can focus on the legal side. Here’s my direct cell if anything comes up on their file — I’m usually the fastest one to answer on the approved list.">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1">
              <strong class="text-sm font-semibold">Attorney Handoff + Trust Builder</strong>
              <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“I’ll treat your client like family and keep you copied on every major update so you can focus on the legal side. Here’s my direct cell if anything comes up on their file — I’m usually the fastest one to answer on the approved list.”</div>
            </div>
            <div class="flex flex-col gap-1">
              <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Attorney: Handoff Script', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'partner');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
        <strong>Pro Tip:</strong> Create a simple one-page “Agent Handoff Packet” for their office (what you need to list or consult, typical timelines, your direct contact). Make it easy for their paralegal to refer clients your way.
      </div>
    `
  },
  'Insurance Agents': {
    title: "Insurance Agents — Bundling &amp; Joint Touches Playbook",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Insurance Agents Are Natural Partners</span></div>
        <p class="text-[15px]">They already have the home + auto relationship. When you help their clients with a smooth real estate or equity strategy, you become the obvious person they recommend for the next life event.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Joint Value Ideas &amp; Scripts</h4>
      <div class="space-y-3 mb-6">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Would you be open to co-hosting a small “Home Protection Night” for some of our mutual clients? I’ll handle the real estate/equity side, you cover insurance gaps. Low pressure, good food, and we both look like the helpful team.">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1">
              <strong class="text-sm font-semibold">Joint Client Event Invite</strong>
              <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Would you be open to co-hosting a small “Home Protection Night” for some of our mutual clients? I’ll handle the real estate/equity side, you cover insurance gaps. Low pressure, good food, and we both look like the helpful team.”</div>
            </div>
            <div class="flex flex-col gap-1">
              <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Insurance: Joint Event', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'partner');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
        <strong>Pro Tip:</strong> After every smooth closing with their client, send the insurance agent a short text: “Just closed [Client] — they were great to work with. Happy to loop you in on any future home or equity conversations.”
      </div>
    `
  },
  'Other': {
    title: "Other Professionals — Adaptable Outreach Playbook",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">The Universal Framework That Works for Any Professional</span></div>
        <p class="text-[15px]">HR directors, relocation companies, title agents, wealth managers, etc. The relationship math is the same: deliver exceptional experiences, make them look good, and give them an easy, low-pressure way to refer you when the moment is right.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Simple, Effective Ask</h4>
      <div class="space-y-3 mb-6">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="If you ever have someone who needs a smooth, low-stress real estate experience, I’d be honored to help them the way I helped the people you’ve already sent my way. No pressure at all — just wanted you to know I’m here.">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1">
              <strong class="text-sm font-semibold">Professional Soft Referral Ask</strong>
              <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“If you ever have someone who needs a smooth, low-stress real estate experience, I’d be honored to help them the way I helped the people you’ve already sent my way. No pressure at all — just wanted you to know I’m here.”</div>
            </div>
            <div class="flex flex-col gap-1">
              <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Other Pro: Soft Ask', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'partner');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
        <strong>Pro Tip:</strong> The best referrals from these partners come after you’ve already delivered outstanding service to one of their clients. Send a short thank-you + “happy to help anyone else in the same situation” note.
      </div>
    `
  }
};

const TIER_PLAYBOOKS = {
  'A+': {
    title: "A+ Partners — White-Glove Playbook",
    content: `
      <div class="bg-[#002B5C]/10 border border-[#002B5C]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#002B5C]"></i><span class="font-bold text-[#002B5C] uppercase tracking-wider text-sm">These 10–20 People Fund Your Business</span></div>
        <p class="text-[15px]">Your true A+ partners send 5+ referrals per year. They deserve concierge-level treatment. Make them feel like they are your only clients.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Recommended Cadence &amp; Touches</h4>
      <div class="space-y-2 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Personal call or coffee every 3–4 weeks</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Handwritten note or meaningful local gift 3–4 times per year</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Birthday + home anniversary personal video</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Same-hour updates on every active file + proactive “just checking in” texts when quiet</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Year-end personalized video + small gift thanking them for the business they sent</div>
      </div>

      <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
        <strong>Pro Tip:</strong> These partners should feel like you only have five clients total. Everything else on your list is secondary to protecting and nurturing these relationships.
      </div>
    `
  },
  'B': {
    title: "B Partners — Growth Playbook",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">The Partners You’re Actively Trying to Promote</span></div>
        <p class="text-[15px]">These are your rising stars sending 1–4 referrals per year. Your goal is to move as many as possible into A+ through consistent, scalable value.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Scalable Growth Cadence</h4>
      <div class="space-y-2 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Monthly value touch (short market video, useful article, or quick win they can use)</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Quarterly personal note or small gift</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Invite to 1–2 client appreciation or partner events per year</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Fast, white-glove execution on every file they send</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Light, natural referral ask after a particularly smooth closing</div>
      </div>

      <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
        <strong>Goal:</strong> Move 3–5 B partners into A+ every year by over-delivering and building genuine rapport.
      </div>
    `
  },
  'C': {
    title: "C Partners — Efficient Conversion Playbook",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Low Time, High-Impact Prospecting</span></div>
        <p class="text-[15px]">New or low-volume sources. You cannot afford to spend heavy one-on-one time here. Use systems + over-delivery on the first file to convert the best ones upward.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Efficient Conversion System</h4>
      <div class="space-y-2 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Add to CRM + value newsletter immediately</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Run the full 60-day onboarding sequence on their first file (see High-Impact Plays)</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Over-communicate and over-deliver on that first closing</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Move them to automated + social + occasional personal touch only if they respond positively</div>
      </div>

      <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
        <strong>Pro Tip:</strong> The first file is the audition. Deliver white-glove service on it and a surprising number of C partners will naturally move into B or better.
      </div>
    `
  }
};

const HIGH_IMPACT_PLAYS = {
  'first-30-days-checklist': {
    title: "First 30 Days with a New Partner",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">The Critical Window That Determines Everything</span></div>
        <p class="text-[15px]">The first 30 days with a new partner — fellow agent, lender, title rep, or builder contact — is your audition. Over-deliver here and you earn a spot on their go-to list for years.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Exact 30-Day Playbook</h4>
      <div class="space-y-3 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Week 1:</strong> Personalized welcome + CRM tags (Partner Type + Tier) + first value touch (market update or buyer/seller resource).</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Week 2:</strong> Personal call — learn their business, referral style, and goals. Offer listing insights or buyer support.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Week 3:</strong> Second value touch (co-branded asset or strategic introduction).</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Week 4:</strong> Public social shoutout, co-host offer, third value touch, light ask: “What can I do to support you right now?”</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Pair with:</strong> Upgrade high-potential partners to the 60-Day Onboarding Sequence.</div>
      </div>

      <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
        <strong>Pro Tip:</strong> Run this exact sequence on every new partner. The discipline in the first 30 days is what separates consistent referrers from one-and-done relationships.
      </div>
    `
  },
  'referral-objections': {
    title: "Referral Partner Objection Playbook",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Handle Objections with Confidence and Empathy</span></div>
        <p class="text-[15px]">The best responses are calm, non-defensive, and reframe the conversation around protecting their clients and making the partner look smart for introducing you.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready Responses (Copy + Personalize)</h4>
      <div class="space-y-3 mb-6">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Totally fair — loyalty matters. I’m not asking you to switch anyone. I’d love to be the agent you call when timelines are tight, the deal gets complicated, or you need someone who will actually communicate. Happy to earn the spot one file at a time.">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1">
              <strong class="text-sm font-semibold">“I already have an agent I use”</strong>
              <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Totally fair — loyalty matters. I’m not asking you to switch anyone. I’d love to be the agent you call when timelines are tight, the deal gets complicated, or you need someone who will actually communicate. Happy to earn the spot one file at a time.”</div>
            </div>
            <div class="flex flex-col gap-1">
              <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Partner Objection: Already Have an Agent', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'partner');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
            </div>
          </div>
        </div>

        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="I completely respect that. My only goal is to make you look brilliant to your clients. If I ever drop the ball or don’t communicate the way you need, you should absolutely stop sending me people. Until then, I’d love the chance to prove it on the next one.">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1">
              <strong class="text-sm font-semibold">“I don’t want to send you my clients”</strong>
              <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“I completely respect that. My only goal is to make you look brilliant to your clients. If I ever drop the ball or don’t communicate the way you need, you should absolutely stop sending me people. Until then, I’d love the chance to prove it on the next one.”</div>
            </div>
            <div class="flex flex-col gap-1">
              <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Partner Objection: Don’t Want to Send Clients', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'partner');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
            </div>
          </div>
        </div>
      </div>
    `
  },
  '60-day-realtor-onboarding': {
    title: "60-Day Agent Partnership Onboarding",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Value-First Before You Ever Ask</span></div>
        <p class="text-[15px]">Turn a brand-new partner relationship — fellow agent, lender, title rep, or builder contact — into a consistent referral source in 60 days. No asks until Day 30.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">The 7-Touch 60-Day Sequence</h4>
      <div class="space-y-3 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Days 1–2:</strong> Personal intro + offer a quick market pulse or useful buyer/seller resource — no pitch.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Day 7:</strong> Co-brandable neighborhood market snapshot for their farm area.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Day 14:</strong> Coffee or lunch — learn their business, pain points, and ideal client profile.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Day 21:</strong> One co-branded buyer/seller guide + offer to co-host an open house or intro to your lender network.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Day 30:</strong> Relationship review: “How can I make working with me easier for you?”</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Day 45:</strong> Public shoutout celebrating a smooth closing or partnership win.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Day 60:</strong> Feedback request + ask for one warm introduction to a professional they respect.</div>
      </div>

      <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
        <strong>Core Principle:</strong> Log every touch in your CRM. Block 30 minutes every Monday to advance all active 60-day sequences.
      </div>
    `
  },
  'weekly-value-cadence': {
    title: "Weekly Value Cadence for Any Partner",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">The System That Keeps You Top of Mind Without Burnout</span></div>
        <p class="text-[15px]">Consistency compounds. This simple 8-week rotation works for almost any partner type and takes very little time once you batch it.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">8-Week Rotation Template</h4>
      <div class="space-y-2 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Week 1:</strong> Short Monday market insight or win they can use (text or 30-sec video)</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Week 2:</strong> Thursday file update (if they have an active deal)</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Week 3:</strong> Personal note or quick “saw this and thought of you” text</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Week 4:</strong> Light value (article, tool, or co-branded asset)</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Week 5:</strong> Birthday or life event touch if relevant</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Week 6:</strong> Thursday file update or general check-in</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Week 7:</strong> Event invitation or “next time you’re in town let’s grab coffee”</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Week 8:</strong> Reset + personal thank you or “appreciate the partnership” note</div>
      </div>

      <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
        <strong>Pro Tip:</strong> Batch all your Monday value touches on Sunday night. It takes 20–30 minutes and keeps dozens of partners warm.
      </div>
    `
  },
  'relationship-management': {
    title: "Relationship Management &amp; Asking for More",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">The Non-Awkward Way to Grow Referrals</span></div>
        <p class="text-[15px]">The best asks happen naturally after you’ve already delivered exceptional results. Never lead with the ask — lead with gratitude and value.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Natural Language That Works</h4>
      <div class="space-y-3 mb-6">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="The clients you send me always have a great experience. If you have anyone else on the horizon I can help the same way, I’d be honored. No pressure at all — just wanted you to know I’m here whenever it makes sense.">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1">
              <strong class="text-sm font-semibold">Post-Close / Post-Event Soft Ask</strong>
              <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“The clients you send me always have a great experience. If you have anyone else on the horizon I can help the same way, I’d be honored. No pressure at all — just wanted you to know I’m here whenever it makes sense.”</div>
            </div>
            <div class="flex flex-col gap-1">
              <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Partner: Soft Referral Ask', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'partner');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
        <strong>Key Mindset:</strong> The ask should feel like a natural thank-you for the relationship, never a transaction.
      </div>
    `
  },
  'co-marketing-assets': {
    title: "Co-Marketing Asset Ideas",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Low-Cost, High-Perceived-Value Offers</span></div>
        <p class="text-[15px]">The best co-marketing makes your partners look like heroes to their clients while keeping you top-of-mind for referrals.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Offer Assets</h4>
      <div class="space-y-3 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Co-branded “First-Time Buyer Guide” (your photo + lender partner on cover)</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Neighborhood market snapshot one-pager for lender or fellow agent to share</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Joint “Buyer Night” or open house happy hour with a lender partner</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Social shoutout package after every closing (“Proud to have helped [Client] with [Partner]”)</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Shared sponsorship of a local youth sports team or charity event</div>
      </div>

      <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
        <strong>Pro Tip:</strong> Ask partners first: “Would a co-branded buyer guide or joint event be helpful for your business right now?” Then deliver exactly what they say they need.
      </div>
    `
  },
  'open-house-domination': {
    title: "Open House Domination Play",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Your Open House Is a Relationship Factory</span></div>
        <p class="text-[15px]">Every visitor is a future client, referral source, or co-broke connection. Plan the experience, capture leads thoughtfully, and follow up within 24 hours — open houses done right fuel your pipeline for months.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Exact Execution Play</h4>
      <div class="space-y-3 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Before:</strong> Stage the home, prepare sign-in (digital + paper), brief your lender partner on buyer questions, and promote on social 48 hours out.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>During:</strong> Greet every visitor warmly, qualify gently (buying timeline, pre-approved?), offer neighborhood market sheet, and invite serious buyers to a consultation.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Within 24 hours:</strong> Personal text to every sign-in: “Great meeting you at [Street] yesterday. Here’s the neighborhood snapshot I mentioned — happy to help if you’re still exploring options.”</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>To partners:</strong> Thank your lender/title contacts who helped + log every lead in CRM with source tag “Open House — [date]”.</div>
      </div>

      <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
        <strong>Pro Tip:</strong> Never hard-sell at the door. Be the helpful local expert. The visitors who feel zero pressure are the ones who call you first when they’re ready.
      </div>
    `
  },
  'realtor-to-5-more': {
    title: "Turning One Strong Partner Into 5 More",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">The Network Effect Strategy</span></div>
        <p class="text-[15px]">When a lender, co-broke agent, or title partner has a great experience working with you, they are usually happy to introduce you to colleagues — if you ask the right way at the right time.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">The Referral-from-Referral System</h4>
      <div class="space-y-3 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>After 3+ wins together:</strong> “Who’s one agent, lender, or title pro you respect that I should meet?”</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Reach out within 48 hours</strong> referencing the mutual connection.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Repeat the loop</strong> with each new partner who sends you business.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Publicly thank</strong> the original partner for the introduction (social proof loop).</div>
      </div>

      <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
        <strong>Pro Tip:</strong> One strong partner becomes five when you make them look brilliant for introducing you.
      </div>
    `
  },
  'builder-training': {
    title: "Builder Sales Team Training Sequence",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Become the Go-To Agent for an Entire Sales Floor</span></div>
        <p class="text-[15px]">Builders and their sales teams send volume when you make their jobs easier and help them move buyers from model home to keys.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Winning the Builder Relationship</h4>
      <div class="space-y-3 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Offer a 30-minute lunch-and-learn</strong> titled “Winning Offers & Buyer Strategy in Today’s Market” (co-present with your lender partner on financing basics).</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Provide simple one-pagers</strong> for their desks with buyer FAQs, neighborhood snapshots, and your direct contact (plus your lender partner’s info).</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Be the fastest</strong> to return calls and follow up on builder deals — speed wins referrals.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Offer joint buyer consultations</strong> at the model home when needed.</div>
      </div>

      <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
        <strong>Pro Tip:</strong> Once you become the “go-to” for one sales team, ask for introductions to other builders in the area. They often know each other.
      </div>
    `
  },
  'professional-referral-request': {
    title: "Professional Partner Referral Request",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Low-Pressure Asks for Attorneys, Planners, HR, etc.</span></div>
        <p class="text-[15px]">These partners value professionalism and protecting their clients’ experience. The ask must feel natural and low-risk for them.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Effective Language</h4>
      <div class="space-y-3 mb-6">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="If you ever have a client or colleague who needs a truly low-stress real estate experience, I’d be honored to help them the same way I helped the people you’ve already sent my way. No pressure at all — just wanted you to know the door is open.">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1">
              <strong class="text-sm font-semibold">Professional Soft Ask</strong>
              <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“If you ever have a client or colleague who needs a truly low-stress real estate experience, I’d be honored to help them the same way I helped the people you’ve already sent my way. No pressure at all — just wanted you to know the door is open.”</div>
            </div>
            <div class="flex flex-col gap-1">
              <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
              <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Professional Partner: Soft Ask', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'partner');}else{window.saveNotReady();}" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Save</button>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm">
        <strong>Pro Tip:</strong> These referrals are highest quality when they come after you’ve already done great work for one of their clients. Always send a short thank-you note after the closing.
      </div>
    `
  }
};

window.openReferralModal = function(partnerType) {
  try {
    ensureReferralModalExists();
    const modal = document.getElementById('referral-modal');
    const titleEl = document.getElementById('referral-modal-title');
    const contentEl = document.getElementById('referral-content');
    if (!modal || !titleEl || !contentEl) {
      console.error('[Referral Modal] Still could not find elements after ensureReferralModalExists() for', partnerType);
      window.notifyUser('Referral modal creation failed. Do a hard refresh (Ctrl/Cmd + Shift + R) + completely close the browser tab, then reopen the file.', 'error', 5000);
      return;
    }
    const data = REFERRAL_PLAYBOOKS[partnerType] || { title: partnerType + ' Playbook', content: `<p>Full playbook for ${partnerType} coming soon. Focus on value-first touches and over-delivery on the first referral.</p>` };
    const richTitle = typeof window.getReferralPartnerModalTitle === 'function' ? window.getReferralPartnerModalTitle(partnerType) : null;
    titleEl.textContent = richTitle || data.title;
    if (typeof window.renderRichReferralPartner === 'function' && window.renderRichReferralPartner(partnerType, contentEl)) {
      // rich partner renderer handled content + handlers
    } else {
      contentEl.innerHTML = data.content;
    }
    modal.style.zIndex = '99999';
    if (typeof window.openNamedModal === 'function') window.openNamedModal(modal);
    else { modal.style.display = ''; modal.classList.remove('hidden'); modal.classList.add('flex'); }
  } catch (e) {
    console.error('[Referral] openReferralModal error', e);
    window.notifyUser('Could not open referral playbook. Hard refresh the page and try again.', 'error', 5000);
  }
};

window.openTierModal = function(tier) {
  try {
    ensureReferralModalExists();
    const modal = document.getElementById('referral-modal');
    const titleEl = document.getElementById('referral-modal-title');
    const contentEl = document.getElementById('referral-content');
    if (!modal || !titleEl || !contentEl) {
      console.error('[Referral Modal] Still could not find elements after ensureReferralModalExists() for tier', tier);
      window.notifyUser('Referral modal creation failed. Do a hard refresh (Ctrl/Cmd + Shift + R) + completely close the browser tab, then reopen the file.', 'error', 5000);
      return;
    }
    const data = TIER_PLAYBOOKS[tier] || { title: tier + ' Partners Playbook', content: `<p>Detailed ${tier} playbook with cadence and scripts.</p>` };
    const richTitle = typeof window.getPartnerTierModalTitle === 'function' ? window.getPartnerTierModalTitle(tier) : null;
    titleEl.textContent = richTitle || data.title;
    if (typeof window.renderRichPartnerTierModal === 'function' && window.renderRichPartnerTierModal(tier, contentEl)) {
      // rich tier renderer handled content + handlers
    } else {
      contentEl.innerHTML = data.content;
    }
    modal.style.zIndex = '99999';
    if (typeof window.openNamedModal === 'function') window.openNamedModal(modal);
    else { modal.style.display = ''; modal.classList.remove('hidden'); modal.classList.add('flex'); }
  } catch (e) {
    console.error('[Referral] openTierModal error', e);
    window.notifyUser('Could not open tier playbook. Hard refresh the page and try again.', 'error', 5000);
  }
};

window.openHighImpactPlay = function(playKey) {
  try {
    ensureReferralModalExists();
    const modal = document.getElementById('referral-modal');
    const titleEl = document.getElementById('referral-modal-title');
    const contentEl = document.getElementById('referral-content');
    if (!modal || !titleEl || !contentEl) {
      console.error('[Referral Modal] Still could not find elements after ensureReferralModalExists() for play', playKey);
      window.notifyUser('Referral modal creation failed. Do a hard refresh (Ctrl/Cmd + Shift + R) + completely close the browser tab, then reopen the file.', 'error', 5000);
      return;
    }
    const data = HIGH_IMPACT_PLAYS[playKey] || { title: playKey.replace(/-/g, ' '), content: `<p>Ready-to-run guidance and scripts for ${playKey}.</p>` };
    titleEl.textContent = data.title;
    if (typeof window.renderRichReferralPlay === 'function' && window.renderRichReferralPlay(playKey, contentEl)) {
      // rich play renderer handled content + handlers
    } else {
      contentEl.innerHTML = data.content;
    }
    modal.style.zIndex = '99999';
    if (typeof window.openNamedModal === 'function') window.openNamedModal(modal);
    else { modal.style.display = ''; modal.classList.remove('hidden'); modal.classList.add('flex'); }
  } catch (e) {
    console.error('[Referral] openHighImpactPlay error', e);
    window.notifyUser('Could not open play. Hard refresh the page and try again.', 'error', 5000);
  }
};

window.closeReferralModal = function() {
  try {
    const modal = document.getElementById('referral-modal');
    if (modal) {
      modal.classList.remove('flex');
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  } catch (e) {}
};

function ensureReferralModalExists() {
  let modal = document.getElementById('referral-modal');
  const titleEl = document.getElementById('referral-modal-title');
  const contentEl = document.getElementById('referral-content');

  // If the outer modal exists but is missing critical children (common with stale cache),
  // remove it and force a fresh creation.
  if (modal && (!titleEl || !contentEl)) {
    console.warn('[Referral] Found broken/outdated #referral-modal (missing title or content children) — removing and recreating.');
    modal.remove();
    modal = null;
  }

  if (modal) return; // Good static version exists

  console.warn('[Referral] No valid referral modal found — dynamically creating rich fallback');

  const fallback = document.createElement('div');
  fallback.id = 'referral-modal';
  fallback.className = 'modal hidden fixed inset-0 bg-black/60 z-[99999] items-center justify-center p-4';
  fallback.innerHTML = `
    <div onclick="event.stopImmediatePropagation()" class="bg-white dark:bg-gray-900 rounded-3xl max-w-4xl w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#00A89D]/5 via-white to-white dark:via-gray-800 dark:to-gray-800 flex justify-between items-center">
        <div>
          <div class="text-[10px] font-bold tracking-[1.5px] text-[#00A89D] uppercase mb-0.5">Referral Partners Playbooks</div>
          <h3 id="referral-modal-title" class="text-2xl md:text-3xl font-bold text-[#002B5C] dark:text-white"></h3>
        </div>
        <button onclick="closeReferralModal()" class="text-4xl leading-none text-gray-400 hover:text-red-500 transition">×</button>
      </div>
      <div id="referral-content" class="p-6 md:p-8 overflow-y-auto max-h-[68vh] text-[15px] leading-relaxed text-gray-700 dark:text-gray-300"></div>
      <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end">
        <button onclick="closeReferralModal()" class="px-5 py-2 rounded-2xl border text-sm font-medium hover:bg-white dark:hover:bg-gray-800">Close Guide</button>
      </div>
    </div>
  `;
  document.body.appendChild(fallback);
}

// One-time diagnostic (helps catch future DOM issues with event modals)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const hasPartner = !!document.getElementById('modal-partner-mastermind');
    console.log('[Event Modals] partner-mastermind present in DOM?', hasPartner);
  });
} else {
  const hasPartner = !!document.getElementById('modal-partner-mastermind');
  console.log('[Event Modals] partner-mastermind present in DOM?', hasPartner);
}
