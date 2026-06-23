// Fully extracted from index.html — referral / event / profile modal helpers
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
      if (typeof window.openAppModal === 'function') {
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
          <div class="flex items-center gap-2 mb-1"><span class="inline-block px-3 py-1 text-xs font-bold rounded-full bg-[#F15A29]/10 text-[#F15A29]">CLIENT APPRECIATION</span></div>
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
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Event: Client Appreciation Invite', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'event');}else{alert('Save ready after refresh');}" class="text-xs px-3 py-1 rounded-xl border border-[#F15A29] text-[#F15A29] hover:bg-[#F15A29] hover:text-white font-semibold whitespace-nowrap">Save</button>
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
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Event: VIP Personal Text', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'event');}else{alert('Save ready after refresh');}" class="text-xs px-3 py-1 rounded-xl border border-[#F15A29] text-[#F15A29] hover:bg-[#F15A29] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm">
            <strong>Pro Tips for Max Impact:</strong> Always allow +1 — this is your lead gen engine. Take 100+ photos and post for weeks after (tag everyone). Send a personal thank-you text or note within 48h. Ask “Who should I invite next time?” in every follow-up. Track how many referrals come from event guests in the next 90 days.
          </div>
        </div>
      `,
      'partner-mastermind': `
        <div class="px-1">
          <div class="flex items-center gap-2 mb-1"><span class="inline-block px-3 py-1 text-xs font-bold rounded-full bg-[#00A89D]/10 text-[#00A89D]">PARTNER MASTERMIND</span></div>
          <h3 class="text-2xl md:text-3xl font-bold mb-1 text-[#002B5C] dark:text-white">Realtor &amp; Partner Masterminds</h3>
          <p class="text-[15px] text-gray-600 dark:text-gray-400 mb-4">Become the indispensable local mortgage expert that top-producing agents actively refer to — and protect with their reputation.</p>

          <div class="bg-[#F15A29]/10 border border-[#F15A29]/30 rounded-3xl p-5 mb-6">
            <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#F15A29]"></i><span class="font-bold text-[#F15A29] uppercase tracking-wider text-sm">Why Masterminds Convert So Well</span></div>
            <p class="text-[15px]">Realtors crave education, networking, and ways to look smart in front of their clients. When you host a high-value, non-salesy roundtable with real insights, they view you as the expert and send you business to avoid looking uninformed to their own clients. Over-communicate on the first one and you lock in the relationship.</p>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Run Topics + Scripts</h4>
          <div class="space-y-3 mb-6">
            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Join me for an exclusive evening with top producers. “Winning Offers in Today’s Market” on [Date] — great food, fresh data on what’s actually working right now, and open discussion. Limited to 15 agents. RSVP to [your email/phone].">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                  <strong class="text-sm font-semibold">Mastermind Invitation to Top Realtors</strong>
                  <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Join me for an exclusive evening with top producers. “Winning Offers in Today’s Market” on [Date] — great food, fresh data on what’s actually working right now, and open discussion. Limited to 15 agents. RSVP to [your email/phone].”</div>
                </div>
                <div class="flex flex-col gap-1">
                  <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Event: Mastermind Invite', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'event');}else{alert('Save ready after refresh');}" class="text-xs px-3 py-1 rounded-xl border border-[#F15A29] text-[#F15A29] hover:bg-[#F15A29] hover:text-white font-semibold whitespace-nowrap">Save</button>
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
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Event: Mastermind Recap Ask', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'event');}else{alert('Save ready after refresh');}" class="text-xs px-3 py-1 rounded-xl border border-[#F15A29] text-[#F15A29] hover:bg-[#F15A29] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm">
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
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Event: Happy Hour Invite', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'event');}else{alert('Save ready after refresh');}" class="text-xs px-3 py-1 rounded-xl border border-[#F15A29] text-[#F15A29] hover:bg-[#F15A29] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm">
            <strong>Pro Tips:</strong> Be genuinely helpful — don’t lead with business. Take photos (with permission) and post for weeks. Personally follow up within 48 hours with anyone new you connected with. Use the event as content gold for the next month.
          </div>
        </div>
      `,
      'community-charity': `
        <div class="px-1">
          <div class="flex items-center gap-2 mb-1"><span class="inline-block px-3 py-1 text-xs font-bold rounded-full bg-[#00A89D]/10 text-[#00A89D]">COMMUNITY IMPACT</span></div>
          <h3 class="text-2xl md:text-3xl font-bold mb-1 text-[#002B5C] dark:text-white">Community &amp; Charity Events</h3>
          <p class="text-[15px] text-gray-600 dark:text-gray-400 mb-4">Build authentic local reputation, create shareable content, and deepen partnerships with realtors while doing real good.</p>

          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
            <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why This Builds Long-Term Trust</span></div>
            <p class="text-[15px]">People remember who shows up for the community when it counts. These events give you real, authentic content and position you as someone who cares about the area — not just as a lender looking for business. Co-hosting with realtors multiplies reach and cements partnerships.</p>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Strong Repeatable Plays + Scripts</h4>
          <div class="space-y-3 mb-6">
            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="We’re teaming up with [Realtor Partner Name] to sponsor the local youth soccer league this season. If you have a kid in the program or just want to support the community, come out to the first game [date]. We’ll have snacks and info on how families can get involved.">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                  <strong class="text-sm font-semibold">Co-Hosted Youth Sports Invite</strong>
                  <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“We’re teaming up with [Realtor Partner Name] to sponsor the local youth soccer league this season. If you have a kid in the program or just want to support the community, come out to the first game [date]. We’ll have snacks and info on how families can get involved.”</div>
                </div>
                <div class="flex flex-col gap-1">
                  <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Event: Charity Co-Host Invite', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'event');}else{alert('Save ready after refresh');}" class="text-xs px-3 py-1 rounded-xl border border-[#F15A29] text-[#F15A29] hover:bg-[#F15A29] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm">
            <strong>Pro Tips:</strong> Partner with 1–2 realtors or title companies — share cost and spotlight. Take lots of photos and post (tag everyone). Use the event as content for the next 2–4 weeks. These create the best “real person” social proof you can get.
          </div>
        </div>
      `,
      'post-event-followup': `
        <div class="px-1">
          <div class="flex items-center gap-2 mb-1"><span class="inline-block px-3 py-1 text-xs font-bold rounded-full bg-[#F15A29]/10 text-[#F15A29]">POST-EVENT MASTERY</span></div>
          <h3 class="text-2xl md:text-3xl font-bold mb-1 text-[#002B5C] dark:text-white">Post-Event Follow-Up System</h3>
          <p class="text-[15px] text-gray-600 dark:text-gray-400 mb-4">The event gets their attention. The follow-up turns it into referrals for the next 12 months. This is where 80% of the ROI lives — and where most LOs drop the ball.</p>

          <div class="bg-[#F15A29]/10 border border-[#F15A29]/30 rounded-3xl p-5 mb-6">
            <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#F15A29]"></i><span class="font-bold text-[#F15A29] uppercase tracking-wider text-sm">Why the Follow-Up Is Everything</span></div>
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
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Event: Day 1 Thank You', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'event');}else{alert('Save ready after refresh');}" class="text-xs px-3 py-1 rounded-xl border border-[#F15A29] text-[#F15A29] hover:bg-[#F15A29] hover:text-white font-semibold whitespace-nowrap">Save</button>
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
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Event: Social Highlights', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'event');}else{alert('Save ready after refresh');}" class="text-xs px-3 py-1 rounded-xl border border-[#F15A29] text-[#F15A29] hover:bg-[#F15A29] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>

            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4" data-copy-text="Hey [Name] — quick personal note after [Event Name]. Loved catching up with you and [spouse/guest]. The story you told about [specific detail from conversation] had me laughing all week. If you ever need anything on the mortgage side (or just want to grab coffee), I’m here. And seriously — who else should I have at the next one?">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                  <strong class="text-sm font-semibold">Week 1 Personal Call/Text to VIPs &amp; Partners</strong>
                  <div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Name] — quick personal note after [Event Name]. Loved catching up with you and [spouse/guest]. The story you told about [specific detail from conversation] had me laughing all week. If you ever need anything on the mortgage side (or just want to grab coffee), I’m here. And seriously — who else should I have at the next one?”</div>
                </div>
                <div class="flex flex-col gap-1">
                  <button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button>
                  <button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('Event: Week 1 VIP Personal', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'event');}else{alert('Save ready after refresh');}" class="text-xs px-3 py-1 rounded-xl border border-[#F15A29] text-[#F15A29] hover:bg-[#F15A29] hover:text-white font-semibold whitespace-nowrap">Save</button>
                </div>
              </div>
            </div>
          </div>

          <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Your Post-Event Batching Ritual (Do This Every Time)</h4>
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-6 text-[15px]">
            Day 1 morning: Send mass thank-you + upload photos. Day 3: Schedule 3–5 social posts tagging everyone. Week 1: Block 45 minutes for personal calls/texts to the top 8–10 people (use your notes from the night). Week 2: Order 5–10 small printed photo gifts or local treats for key partners. Month 1: One personal “saw this and thought of you” text referencing a real moment. Log every new contact + referral attribution in CRM.
          </div>

          <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm">
            <strong>Key Insight &amp; Measurement:</strong> The follow-up is where events become systems. Track: # of +1 guests who became leads, referrals attributed to event attendees in 90 days, repeat event attendees. One well-run event + follow-up system can be worth 5–10 loans per year in referrals alone.
          </div>
        </div>
      `,
      'value-first': `
        <div class="px-1">
          <h3 class="text-2xl md:text-3xl font-bold mb-2 text-[#002B5C] dark:text-white">Value First — The Non-Negotiable Foundation</h3>
          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
            <p class="text-[15px]">When guests feel they received a genuine gift (fun, food, connection, recognition) with zero sales pressure, they lower their guard and become natural advocates. This is the single biggest reason some LOs get 15–30 referrals from one event while others get zero.</p>
          </div>

          <h4 class="font-bold text-lg mb-3">How to Execute Value-First Events</h4>
          <ul class="space-y-2 text-[15px] mb-6">
            <li><strong>No pitches at the event</strong> — Save any business talk for private follow-ups 48+ hours later.</li>
            <li><strong>Make it memorable</strong> — Unique venue, great food, live music, photo opportunities, or a fun activity.</li>
            <li><strong>Honor people publicly</strong> — Recognize anniversaries, referrals sent, or personal milestones in a warm, non-salesy way.</li>
          </ul>

          <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm">
            <strong>Success Metric:</strong> At least 30% of guests bring a +1, and 3+ guests mention the event positively in follow-up conversations within 10 days.
          </div>

          <div class="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700 text-sm">
            <div class="font-semibold mb-1 text-[#00A89D]">Connect this philosophy to the rest of your system:</div>
            <div class="flex flex-wrap gap-2">
              <span onclick="window.showSection && window.showSection('database');" class="cursor-pointer inline-block px-3 py-1 text-xs rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Database Nurturing (A+/B/C + scalable touches)</span>
              <span onclick="if(typeof window.openReferralPartnersTool==='function'){window.openReferralPartnersTool();}" class="cursor-pointer inline-block px-3 py-1 text-xs rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Referral Partners (co-host &amp; partner events)</span>
              <span onclick="window.showSection && window.showSection('process');" class="cursor-pointer inline-block px-3 py-1 text-xs rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Loan Process (7-Day post-close tie-in)</span>
            </div>
          </div>
        </div>
      `,
      'invite-plus-one': `
        <div class="px-1">
          <h3 class="text-2xl md:text-3xl font-bold mb-2 text-[#002B5C] dark:text-white">Invite +1 — Your Built-in Lead Machine</h3>
          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
            <p class="text-[15px]">The +1 policy is the highest-ROI feature of any event. Every friend who attends is a warm prospect who already trusts the host (your client or partner). This is how smart LOs turn one event into 8–15 new relationships.</p>
          </div>

          <h4 class="font-bold text-lg mb-3">Exact Messaging &amp; Follow-Up</h4>
          <div class="space-y-3 mb-6 text-[15px]">
            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">“Bring someone you love — a friend, neighbor, or family member. The more the merrier. No business talk, just good people and good times.”</div>
            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">After the event, personally follow up with every +1 within 72 hours: “It was great meeting you at [Event]. If you ever have questions about the homebuying or financing process, I’m happy to be a resource — no pressure whatsoever.”</div>
          </div>

          <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm">
            <strong>Pro Tip:</strong> Track every +1 in your CRM with a note “Met at [Event] as guest of [Host]”. These convert 3–5x higher than cold leads.
          </div>
        </div>
      `,
      'co-host-leverage': `
        <div class="px-1">
          <h3 class="text-2xl md:text-3xl font-bold mb-2 text-[#002B5C] dark:text-white">Co-Host for Leverage — Double Reach, Half the Cost</h3>
          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
            <p class="text-[15px]">Co-hosting with a top realtor or local business instantly doubles your marketing reach and adds instant credibility. It also cuts your costs dramatically while creating a natural reason for future joint events.</p>
          </div>

          <h4 class="font-bold text-lg mb-3">How to Approach &amp; Structure</h4>
          <ul class="space-y-2 text-[15px] mb-6">
            <li><strong>Approach the right partners</strong> — Choose realtors who already send you business or have complementary audiences.</li>
            <li><strong>Offer clear value</strong> — “I’ll handle all the financing education and a portion of the food if you invite your top 20 clients.”</li>
            <li><strong>Split responsibilities in writing</strong> — Venue, invites, food, photos, follow-up.</li>
          </ul>

          <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm">
            <strong>Success Metric:</strong> At least 40% of attendees come from the co-host’s list. Both parties commit to 2 joint events per year.
          </div>
        </div>
      `,
      'frequency-goal': `
        <div class="px-1">
          <h3 class="text-2xl md:text-3xl font-bold mb-2 text-[#002B5C] dark:text-white">Frequency Goal — 4–6 Events Per Year Without Burnout</h3>
          <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
            <p class="text-[15px]">Too many events and you burn out. Too few and you disappear. The sweet spot for most successful LOs is 4–6 high-quality events per year, thoughtfully spaced and themed.</p>
          </div>

          <h4 class="font-bold text-lg mb-3">Recommended Annual Rhythm</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-sm">
            <div class="border rounded-2xl p-3">Q1: Client Appreciation (post-tax season relief)</div>
            <div class="border rounded-2xl p-3">Q2: Realtor Mastermind or Education Event</div>
            <div class="border rounded-2xl p-3">Q3: Community / Charity Event (high visibility)</div>
            <div class="border rounded-2xl p-3">Q4: Big Holiday Client + Partner Appreciation</div>
          </div>

          <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm">
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
    // Close on backdrop click
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
    alert('Could not open event guide. Please refresh the page and try again.');
  }
};

window.closeEventModal = function(type) {
  try {
    let modal = document.getElementById('modal-' + type);
    if (!modal) modal = document.querySelector('#modal-' + type);
    if (!modal) return;
    if (typeof window.closeNamedModal === 'function') {
      window.closeNamedModal(modal);
    } else if (typeof window.closeAppModal === 'function') {
      window.closeAppModal(modal);
    } else {
      modal.classList.remove('flex');
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
    if (typeof window.releaseModalScrollLock === 'function') {
      window.releaseModalScrollLock();
    }
  } catch (e) {}
};

// =====================================================
// REFERRAL PARTNERS RICH MODALS (polished playbooks, tiers, high-impact sequences)
// Self-contained rich content with Why, multiple Copy+Save scripts, Pro Tips. Uses 'partner' save type.
// =====================================================
let _referralPlaybooksCache = null;
function getReferralPlaybooks() {
  if (_referralPlaybooksCache) return _referralPlaybooksCache;
  _referralPlaybooksCache = {
  'Realtors': {
    title: "Realtors — Primary Partner Playbook",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Realtors Are Your #1 Engine</span></div>
        <p class="text-[15px]">70–90% of top producer volume comes from realtors. They do not switch lenders for a slightly better rate — they switch for communication, speed, and how you make them look to their clients. Win the first file with white-glove execution, then stay top-of-mind with a simple weekly cadence.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Relationship Strategy (What Actually Moves the Needle)</h4>
      <div class="grid md:grid-cols-2 gap-3 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Make them look brilliant</strong><br>Every update should help them answer their buyer’s “what’s happening?” texts without chasing you.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Speed + predictability</strong><br>Same-hour milestone texts beat gift baskets. Thursday updates even when nothing changed build massive trust.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Value between files</strong><br>Short market notes, pre-approval turnaround wins, and co-branded buyer tools keep you preferred when they are not in contract.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"><strong class="text-[#00A89D]">Earn the second file</strong><br>Post-close recap + soft ask. Most realtors test you once — the second referral is when you are truly on the list.</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">First-File Protocol (Non-Negotiable)</h4>
      <div class="space-y-2 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Same hour:</strong> Personal welcome video + “How I Work With Agents” one-pager to realtor and buyer.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Day 1–2:</strong> 15-minute intro call — learn their pain points with past lenders and preferred communication style.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Week 1:</strong> First Thursday update — never miss it, even if the file is quiet.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Every milestone:</strong> Appraisal, conditions, CTC, funding — same-hour personal text to realtor + client.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Post-close:</strong> Thank-you + marketing highlight they can share + “Who else should get this experience?”</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ongoing Cadence (A+ vs B vs C)</h4>
      <div class="space-y-2 mb-6 text-sm">
        <div class="border border-[#002B5C]/30 bg-[#002B5C]/5 rounded-2xl p-3"><strong>A+ (5+ refs/year):</strong> Personal touch every 3–4 weeks + same-hour file updates + 3–4 meaningful gifts/notes per year.</div>
        <div class="border border-[#00A89D]/30 bg-[#00A89D]/5 rounded-2xl p-3"><strong>B (1–4 refs/year):</strong> Monthly value touch + quarterly personal note + invite to 1–2 events per year.</div>
        <div class="border border-[#F15A29]/30 bg-[#F15A29]/5 rounded-2xl p-3"><strong>C (new/low volume):</strong> Run full 60-day onboarding on first file only — then promote based on response.</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Scripts (Copy + Save)</h4>
      <div class="space-y-3 mb-6">
        ${window.renderPartnerScriptCard('Same-Hour Realtor Handoff', 'Hey [Realtor], [Client Name] just reached out for pre-approval on [address]. I have already sent them a personal welcome video and timeline. I will keep you in the loop on every step — what is the best way for us to stay in sync on this one?', 'Partner: Realtor Handoff')}
        ${window.renderPartnerScriptCard('Thursday File Update (Even When Quiet)', '[Client] file update: Appraisal received and clean. One condition still outstanding (paystub). Targeting full clear by Thursday. I will keep you posted the moment anything moves.', 'Partner: Thursday Update')}
        ${window.renderPartnerScriptCard('Milestone Alert — Clear to Close', 'Great news on [Client] — we are clear to close and targeting [date]. I have already looped in title and sent the client their final numbers. You made this one smooth — thank you for trusting me with them.', 'Partner: CTC Milestone')}
        ${window.renderPartnerScriptCard('Pre-Approval Turnaround Win', 'Quick win for you — [Client Name] is fully pre-approved as of this morning. Letter attached. If you have any buyers on the fence, I can turn around pre-approvals same-day when docs are in.', 'Partner: Pre-Approval Win')}
        ${window.renderPartnerScriptCard('Monthly Market Value Touch', 'Quick note for your buyers — inventory in [Area] is up and we are seeing more negotiation room than 90 days ago. Happy to run real numbers on any active deal. No pitch, just data you can use with clients.', 'Partner: Monthly Market Touch')}
        ${window.renderPartnerScriptCard('Post-Close Soft Referral Ask', 'So glad we got [Client] closed — they were great to work with and you made my job easy. If you have anyone else on the horizon who needs the same white-glove experience, I would be honored. No pressure at all.', 'Partner: Post-Close Soft Ask')}
      </div>

      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-4"><strong>Pro Tip:</strong> Over-communicate on the first file. It earns the preferred spot faster than any lunch. Never go dark on future files — silence is how you get replaced.</div>
      ${window.renderModalNextSteps([
        { label: '60-Day Onboarding Sequence', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('60-day-realtor-onboarding');", style: 'primary' },
        { label: 'A+ Partner Playbook', onclick: "if(typeof window.openTierModal==='function')window.openTierModal('A+');", style: 'accent' },
        { label: 'Partner Mastermind Events', onclick: "if(typeof window.showSection==='function')window.showSection('eventplanning'); setTimeout(()=>{if(typeof window.openEventModal==='function')window.openEventModal('partner-mastermind');},350);", style: 'accent' },
        { label: 'Objection Responses', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('referral-objections');", style: 'accent' }
      ])}
    `
  },
  'Builders': {
    title: "Builders — New Construction Playbook",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Builders Deliver Predictable Volume</span></div>
        <p class="text-[15px]">One active builder relationship can produce 10–30+ loans per year. Builder sales teams care about speed, clarity, and making buyers feel confident — not rate shopping. Become the lender who answers first, explains construction timelines clearly, and trains their team to sell more homes.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Winning the Builder Relationship (Step-by-Step)</h4>
      <div class="space-y-2 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Step 1:</strong> Offer a 30-minute lunch-and-learn for the sales floor — current programs, buydowns, and how to handle “I cannot afford new construction” objections.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Step 2:</strong> Leave desk one-pagers (programs, timelines, your direct cell) — sales reps grab these when buyers hesitate.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Step 3:</strong> Be fastest on pre-approvals and return calls — builders track who makes their team look good.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Step 4:</strong> Offer joint buyer consultations at the model home for complex scenarios (self-employed, relocation, rate buydowns).</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Step 5:</strong> Monthly check-in with sales manager — share wins, update program sheet, ask what buyers are struggling with.</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Construction-Specific Communication Cadence</h4>
      <div class="grid md:grid-cols-2 gap-3 mb-6 text-sm">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>At contract:</strong> Confirm build timeline + draw schedule expectations with sales rep copied.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>At slab/foundation:</strong> Quick “file is on track” note — reduces buyer anxiety during long waits.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>30 days before CO:</strong> Final numbers preview + closing date confirmation to rep and buyer.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Post-close:</strong> Thank sales rep + ask for intro to other builders they know.</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Scripts (Copy + Save)</h4>
      <div class="space-y-3 mb-6">
        ${window.renderPartnerScriptCard('Sales Team Training Offer', 'I would love to become your go-to lender for the community. I can offer your sales team a 30-minute lunch-and-learn on current financing options that actually help buyers win in this market, plus a simple one-pager they can keep at their desk. Would next Tuesday or Thursday work for a quick session?', 'Builder: Sales Training Offer')}
        ${window.renderPartnerScriptCard('Builder Sales Rep File Update', 'Quick update on [Buyer Name] — they are fully pre-approved and we are targeting clear to close by [date]. I will keep you posted the moment anything moves so your team can keep the buyer excited and on track.', 'Builder: Sales Rep Update')}
        ${window.renderPartnerScriptCard('Model Home Joint Consult Offer', 'If you have a buyer who is on the fence at [Community], I am happy to do a quick 15-minute financing consult at the model home — no pressure, just real numbers so they can move forward with confidence.', 'Builder: Model Home Consult')}
        ${window.renderPartnerScriptCard('Construction Timeline Reassurance', 'Wanted to reassure you on [Buyer] — we are aligned with the build schedule and everything is on track for a [month] close. I will flag you immediately if anything on the financing side needs attention.', 'Builder: Timeline Reassurance')}
        ${window.renderPartnerScriptCard('Monthly Sales Manager Check-In', 'Hey [Name] — quick monthly check-in. Anything your team is hearing from buyers that I should address in an updated program sheet? Happy to refresh the desk one-pager or do another short training if helpful.', 'Builder: Monthly Check-In')}
        ${window.renderPartnerScriptCard('Post-Close Builder Thank-You', 'Just closed [Buyer] at [Community] — smooth file and great buyers. Thanks for trusting me with them. If you know other builders or sales managers who would value the same speed and communication, I would appreciate the intro.', 'Builder: Post-Close Thank You')}
      </div>

      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-4"><strong>Pro Tip:</strong> Speed wins builder relationships. Return calls within the hour, turn pre-approvals same-day, and never let a sales rep wonder where a file stands.</div>
      ${window.renderModalNextSteps([
        { label: 'Builder Training Sequence', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('builder-training');", style: 'primary' },
        { label: 'Co-Marketing Asset Ideas', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('co-marketing-assets');", style: 'accent' }
      ])}
    `
  },
  'Financial Planners': {
    title: "Financial Planners &amp; CPAs — HNW Playbook",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why These Partners Send High-Quality Business</span></div>
        <p class="text-[15px]">Planners and CPAs serve clients with real equity, investment properties, retirement timing decisions, and complex tax situations. They refer when you protect wealth — not just close loans — and make them look like the smart advisor who chose the right lender.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">What They Care About (Speak Their Language)</h4>
      <div class="grid md:grid-cols-2 gap-3 mb-6 text-sm">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Cash flow impact</strong> — How does this payment or equity pull affect their retirement plan?</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Tax awareness</strong> — Acknowledge you are not their CPA, but flag items they should discuss together.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Discretion</strong> — High-net-worth clients expect privacy and white-glove communication.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Coordination</strong> — Copy the planner on major milestones so they stay informed without chasing you.</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Relationship Cadence</h4>
      <div class="space-y-2 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Quarterly:</strong> Short market or strategy note relevant to their client base (rates, equity, jumbo trends).</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Per referral:</strong> Same-day intro to planner + written process overview for their client.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Annually:</strong> Invite to co-hosted client workshop or intimate dinner seminar.</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Scripts (Copy + Save)</h4>
      <div class="space-y-3 mb-6">
        ${window.renderPartnerScriptCard('Educational Coffee / Zoom Invite', 'I would love to be a resource for your clients who are thinking about buying, refinancing, or using home equity strategically. Would you be open to a 20-minute coffee or Zoom where I can share the current mortgage strategies that actually make sense for high-net-worth families right now?', 'HNW: Educational Invite')}
        ${window.renderPartnerScriptCard('Joint Workshop Proposal', 'Would a co-branded workshop titled Mortgage and Wealth Strategies for Pre-Retirees be valuable for your clients? I handle the financing education, you handle the wealth planning angle — low pressure, high value for both of us.', 'HNW: Joint Workshop')}
        ${window.renderPartnerScriptCard('Planner Handoff on Active File', 'Thanks for connecting me with [Client]. I have sent them a welcome overview and will keep you copied on major milestones so you can stay aligned with their broader financial plan. Here is my direct line if anything comes up.', 'HNW: Planner Handoff')}
        ${window.renderPartnerScriptCard('Equity Strategy Check-In', 'One of your clients asked about pulling equity for [purpose]. Before we move forward, I wanted to loop you in — happy to coordinate on how this fits their overall plan. No rush, just want everyone aligned.', 'HNW: Equity Strategy Loop-In')}
        ${window.renderPartnerScriptCard('Post-Close Professional Thank-You', 'We just closed [Client] — thank you for the introduction. They were a pleasure to work with. If you have other clients navigating a move, refi, or investment property purchase, I am here whenever it makes sense.', 'HNW: Post-Close Thank You')}
        ${window.renderPartnerScriptCard('Quarterly Value Touch', 'Quick quarterly note — jumbo and equity products have shifted slightly this quarter. Happy to send a one-page summary you can share with clients who are considering a move or portfolio adjustment. No pitch, just a resource.', 'HNW: Quarterly Value Touch')}
      </div>

      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-4"><strong>Pro Tip:</strong> Never position yourself as giving tax advice. Say “your CPA/planner should weigh in on this” — that respect for their role builds enormous trust.</div>
      ${window.renderModalNextSteps([
        { label: 'Professional Referral Request', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('professional-referral-request');", style: 'primary' },
        { label: 'Client Appreciation Events', onclick: "if(typeof window.showSection==='function')window.showSection('eventplanning'); setTimeout(()=>{if(typeof window.openEventModal==='function')window.openEventModal('client-appreciation');},350);", style: 'accent' }
      ])}
    `
  },
  'Attorneys': {
    title: "Attorneys — Trust &amp; Referral Protocol Playbook",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Attorneys Are Extremely Loyal When Treated Right</span></div>
        <p class="text-[15px]">Divorce, probate, estate, and real estate attorneys send high-quality, time-sensitive referrals. Their reputation is on the line. Protect timelines, communicate with precision, and never put them in an awkward position with their client.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">First-File Protocol for Legal Referrals</h4>
      <div class="space-y-2 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Day 0:</strong> Send attorney a brief process overview + your direct cell. Confirm court-ordered or settlement deadlines in writing.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Weekly:</strong> Short status email to attorney (even if just “on track for [date]”) — paralegals love predictable updates.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Before any issue:</strong> Call the attorney before the client hears bad news — they need to counsel their client first.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Post-close:</strong> Thank-you note to attorney + offer to be listed as a resource in their client welcome packet.</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Lender Handoff Packet (Leave at Their Office)</h4>
      <ul class="text-[15px] space-y-1.5 mb-6 pl-4 list-disc">
        <li>Document checklist by scenario (purchase, refi, equity, divorce buyout)</li>
        <li>Typical timeline ranges with clear disclaimers</li>
        <li>Your direct cell + assistant contact + hours</li>
        <li>How you coordinate with title and legal counsel</li>
      </ul>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Scripts (Copy + Save)</h4>
      <div class="space-y-3 mb-6">
        ${window.renderPartnerScriptCard('Attorney Handoff + Trust Builder', 'I will treat your client like family and keep you copied on every major update so you can focus on the legal side. Here is my direct cell if anything comes up on their file — I am usually the fastest one to answer.', 'Attorney: Handoff Script')}
        ${window.renderPartnerScriptCard('Timeline Confirmation (Divorce / Probate)', 'To confirm — we are aligned on the [court-ordered / settlement] target date of [date]. I have built our processing schedule backward from that date and will flag you immediately if anything threatens the timeline.', 'Attorney: Timeline Confirmation')}
        ${window.renderPartnerScriptCard('Proactive Issue Heads-Up', 'Quick heads-up on [Client] — we hit a minor condition that may push closing by 2–3 days. I wanted you to know before I updated the client so you can advise them. Here is the path to resolution.', 'Attorney: Proactive Heads-Up')}
        ${window.renderPartnerScriptCard('Weekly Status to Paralegal', 'Weekly update on [Client / File]: Currently in [stage]. On track for [date]. No action needed from your office this week — just keeping you in the loop.', 'Attorney: Weekly Status')}
        ${window.renderPartnerScriptCard('Post-Close Attorney Thank-You', 'Thank you for trusting me with [Client]. The file closed on time and they were well taken care of. If you have other clients who need a lender who respects legal timelines, I would be honored to help.', 'Attorney: Post-Close Thank You')}
        ${window.renderPartnerScriptCard('Office Resource Offer', 'I put together a simple one-page lender handoff sheet for your office — document lists, typical timelines, and my direct contact. Happy to drop off copies for your paralegal if useful.', 'Attorney: Handoff Packet Offer')}
      </div>

      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-4"><strong>Pro Tip:</strong> Attorneys refer the lender who never surprises them. When in doubt, over-communicate with the attorney before the client.</div>
      ${window.renderModalNextSteps([
        { label: 'Professional Referral Request', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('professional-referral-request');", style: 'primary' },
        { label: 'Loan Process Communications', onclick: "if(typeof window.showSection==='function')window.showSection('process');", style: 'accent' }
      ])}
    `
  },
  'Insurance Agents': {
    title: "Insurance Agents — Bundling &amp; Joint Touches Playbook",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Why Insurance Agents Are Natural Partners</span></div>
        <p class="text-[15px]">Insurance agents already hold the home and auto relationship. Every purchase, refi, or equity event is a natural moment to reinforce the full “home protection” team. Co-marketing here feels helpful — not salesy — when done right.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">High-ROI Joint Plays</h4>
      <div class="grid md:grid-cols-2 gap-3 mb-6 text-sm">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Home Protection Night</strong> — Small client event: you cover mortgage/equity, they cover coverage gaps.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>New Homeowner Checklist</strong> — Co-branded PDF: insurance review + mortgage payment planning.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Post-Close Loop-In</strong> — After every closing, text the agent so they can review coverage on the new home.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Cross-Newsletter Feature</strong> — Swap guest spots in each other’s client emails once per quarter.</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Relationship Cadence</h4>
      <div class="space-y-2 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Per mutual client:</strong> Loop them in at closing with a warm intro (with client permission).</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Quarterly:</strong> Coffee or lunch — share what you are hearing from homeowners (equity pulls, moves, rate questions).</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Annually:</strong> One co-hosted client touch (event, webinar, or mailer).</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Scripts (Copy + Save)</h4>
      <div class="space-y-3 mb-6">
        ${window.renderPartnerScriptCard('Joint Client Event Invite', 'Would you be open to co-hosting a small Home Protection Night for some of our mutual clients? I will handle the mortgage and equity side, you cover insurance gaps. Low pressure, good food, and we both look like the helpful team.', 'Insurance: Joint Event')}
        ${window.renderPartnerScriptCard('Post-Close Agent Loop-In', 'Just closed [Client] on their new home at [address] — they were great to work with. Wanted to loop you in so you can make sure their coverage is aligned with the new property. Happy to connect you directly if helpful.', 'Insurance: Post-Close Loop-In')}
        ${window.renderPartnerScriptCard('Co-Branded Checklist Offer', 'I am putting together a simple New Homeowner Checklist for my clients — mortgage payment planning on one side, insurance review prompts on the other. Would you want to co-brand it? Easy win for both our client lists.', 'Insurance: Co-Branded Checklist')}
        ${window.renderPartnerScriptCard('Quarterly Coffee Check-In', 'Hey [Name] — want to grab coffee next week? I am hearing a lot of equity and refi questions from clients and would love to compare notes on what you are seeing on the insurance side.', 'Insurance: Quarterly Coffee')}
        ${window.renderPartnerScriptCard('Client Introduction (Warm Handoff)', 'Hi [Client] — as you get settled in the new home, I wanted to introduce you to [Agent Name], who I trust for home and auto coverage. They are great at making sure there are no gaps after a move. I will let you two take it from here.', 'Insurance: Client Intro')}
        ${window.renderPartnerScriptCard('Soft Referral Ask', 'The clients you have sent my way always have a great experience. If you run into anyone who needs a smooth mortgage process, I am here. And I will always loop you in when I close a home for your clients.', 'Insurance: Soft Referral Ask')}
      </div>

      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-4"><strong>Pro Tip:</strong> Insurance agents remember who loops them in after closings. That single habit often generates more referrals than any formal partnership agreement.</div>
      ${window.renderModalNextSteps([
        { label: 'Co-Host Event Playbook', onclick: "if(typeof window.openEventModal==='function')window.openEventModal('co-host-leverage');", style: 'primary' },
        { label: 'Client Appreciation Events', onclick: "if(typeof window.showSection==='function')window.showSection('eventplanning'); setTimeout(()=>{if(typeof window.openEventModal==='function')window.openEventModal('client-appreciation');},350);", style: 'accent' }
      ])}
    `
  },
  'Other': {
    title: "Other Professionals — Adaptable Outreach Playbook",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">The Universal Framework That Works for Any Professional</span></div>
        <p class="text-[15px]">HR directors, relocation specialists, title reps, wealth managers, contractors, and more. The math is identical: deliver exceptional client experiences, make the partner look good, and stay in light touch until the right referral moment appears.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Partner Types &amp; What They Need From You</h4>
      <div class="grid md:grid-cols-2 gap-3 mb-6 text-sm">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>HR / Relocation</strong> — Fast, stress-free process for transferring employees. Clear timelines and single point of contact.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Title / Escrow</strong> — Files that close on time with clean communication. You make their job easier.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Contractors / Designers</strong> — Clients pulling equity for renovations. Respect their project timeline.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Wealth / Business Coaches</strong> — Clients making big life moves. Coordinate without overstepping their advisory role.</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">4-Step Universal Playbook</h4>
      <div class="space-y-2 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>1. Lead with value:</strong> Offer a resource their clients actually need (checklist, timeline guide, webinar).</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>2. Deliver on the first referral:</strong> White-glove execution — this is your audition for every future introduction.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>3. Thank and report back:</strong> Tell the partner how it went (with client permission) so they look smart for the intro.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>4. Stay in light touch:</strong> Quarterly note or shared article — never go fully dark between referrals.</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Scripts (Copy + Save)</h4>
      <div class="space-y-3 mb-6">
        ${window.renderPartnerScriptCard('Professional Soft Referral Ask', 'If you ever have someone who needs a smooth, low-stress mortgage experience, I would be honored to help them the way I helped the people you have already sent my way. No pressure at all — just wanted you to know I am here.', 'Other Pro: Soft Ask')}
        ${window.renderPartnerScriptCard('Initial Outreach — Value First', 'I work with a lot of [their client type] and put together a simple [checklist / timeline guide] that might be useful for your clients. Happy to co-brand it or just send it over — no strings attached.', 'Other Pro: Value First Outreach')}
        ${window.renderPartnerScriptCard('HR / Relocation Introduction', 'Thanks for connecting me with [Employee Name]. I have sent them a welcome overview and will keep you updated on major milestones so you can reassure their team everything is on track.', 'Other Pro: HR Handoff')}
        ${window.renderPartnerScriptCard('Post-Referral Report-Back', 'Quick update — [Client] closed successfully last week. Thank you for the introduction. They mentioned how helpful you were in connecting them with the right people. If anyone else in a similar situation needs the same experience, I am here.', 'Other Pro: Report Back')}
        ${window.renderPartnerScriptCard('Quarterly Stay-in-Touch', 'Hey [Name] — just a quick quarterly note. Still here if any of your clients or colleagues need help on the mortgage side. Hope business is treating you well.', 'Other Pro: Quarterly Touch')}
        ${window.renderPartnerScriptCard('Joint Resource Proposal', 'Would it be helpful if we put together a short co-branded guide for your clients on [topic]? I can handle the financing piece, you add the [industry] perspective — easy value for both of us.', 'Other Pro: Joint Resource')}
      </div>

      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-4"><strong>Pro Tip:</strong> These partners rarely refer on the first conversation. Earn trust on one file, report back, and the second referral usually comes naturally.</div>
      ${window.renderModalNextSteps([
        { label: 'Professional Referral Request', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('professional-referral-request');", style: 'primary' },
        { label: 'C Partner Conversion Playbook', onclick: "if(typeof window.openTierModal==='function')window.openTierModal('C');", style: 'accent' },
        { label: 'Weekly Value Cadence', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('weekly-value-cadence');", style: 'accent' }
      ])}
    `
  }
  };
  return _referralPlaybooksCache;
}

let _tierPlaybooksCache = null;
function getTierPlaybooks() {
  if (_tierPlaybooksCache) return _tierPlaybooksCache;
  _tierPlaybooksCache = {
  'A+': {
    title: "A+ Partners — White-Glove Playbook",
    content: `
      <div class="bg-[#002B5C]/10 border border-[#002B5C]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#002B5C]"></i><span class="font-bold text-[#002B5C] uppercase tracking-wider text-sm">These 10–20 People Pay Your Mortgage</span></div>
        <p class="text-[15px]">Your true A+ partners send 5+ referrals per year or represent outsized strategic value. They deserve concierge treatment — not because you are desperate, but because protecting this tier is how top producers stay at the top.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">How to Identify A+ Partners</h4>
      <ul class="text-[15px] space-y-1.5 mb-6 pl-4 list-disc">
        <li>5+ referrals in the last 12 months (or 3+ with very high average loan size)</li>
        <li>They call you first — not second or third — on new deals</li>
        <li>They introduce you to other top producers in their network</li>
        <li>They invite you to client-facing moments (listings, open houses, closings)</li>
        <li>Losing them would materially hurt your annual production goal</li>
      </ul>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">White-Glove Cadence (Protect at All Costs)</h4>
      <div class="space-y-2 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Personal call or coffee every 3–4 weeks — not just when you need something</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Handwritten note or meaningful local gift 3–4 times per year (not generic swag)</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Birthday + work anniversary personal video</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Same-hour updates on every active file + proactive check-in when quiet 2+ weeks</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">First invite to every client appreciation or mastermind event</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Year-end personalized video + small gift thanking them for the year</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Scripts (Copy + Save)</h4>
      <div class="space-y-3 mb-6">
        ${window.renderPartnerScriptCard('Quarterly Personal Check-In', 'Hey [Agent Name] — just wanted to check in. How is business treating you? Anything coming up I can help with — even if it is just a second opinion on a tricky scenario.', 'A+ Partner Check-In')}
        ${window.renderPartnerScriptCard('Proactive Quiet-File Check-In', 'Hey [Name] — no file update today, just checking in. Want to make sure you always know I am here even when things are quiet. Anything on the horizon I can get ahead of for you?', 'A+ Partner Proactive Check-In')}
        ${window.renderPartnerScriptCard('Birthday / Anniversary Video Script', 'Hey [Name] — happy [birthday / work anniversary]! Grateful for our partnership this year. You have sent some amazing clients my way and I do not take that for granted. Hope you get to celebrate properly today.', 'A+ Partner Birthday Video')}
        ${window.renderPartnerScriptCard('Year-End Thank You', 'As the year wraps up — thank you for trusting me with [X] clients in [year]. You made my job easy and your clients were a pleasure. Excited for what we build together next year.', 'A+ Partner Year-End Thank You')}
        ${window.renderPartnerScriptCard('VIP Event Invite', 'I am hosting a small [event name] next month and you are at the top of my invite list. Would love to have you there — bring a colleague if you want. Low-key, great people, no pitches.', 'A+ Partner VIP Event Invite')}
      </div>
      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-4">
        <strong>Pro Tip:</strong> These partners should feel like you only have five clients total. If you are too busy to nurture A+ relationships, something else on your calendar needs to go — not these touches.
      </div>
      ${window.renderModalNextSteps([
        { label: 'Partner Mastermind Events', onclick: "if(typeof window.showSection==='function')window.showSection('eventplanning'); setTimeout(()=>{if(typeof window.openEventModal==='function')window.openEventModal('partner-mastermind');},350);", style: 'primary' },
        { label: 'Realtor Primary Playbook', onclick: "if(typeof window.openReferralModal==='function')window.openReferralModal('Realtors');", style: 'accent' },
        { label: 'Turn 1 Realtor Into 5 More', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('realtor-to-5-more');", style: 'accent' }
      ])}
    `
  },
  'B': {
    title: "B Partners — Growth Playbook",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">The Partners You Are Actively Trying to Promote</span></div>
        <p class="text-[15px]">B partners send 1–4 referrals per year and show growth potential. Your job is to deliver A+ level service on their files while using scalable touches to earn the next referral — and eventually promote them to A+.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Promotion Signals (When to Move B → A+)</h4>
      <ul class="text-[15px] space-y-1.5 mb-6 pl-4 list-disc">
        <li>They referred you twice in 6 months without being asked</li>
        <li>They respond to your value touches and engage in conversation</li>
        <li>They start calling you before other lenders on time-sensitive deals</li>
        <li>They attended your event and brought a colleague</li>
      </ul>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Scalable Growth Cadence</h4>
      <div class="space-y-2 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Monthly value touch (30-sec market video, useful article, or quick win they can use)</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Quarterly personal note or small gift</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Invite to 1–2 client appreciation or partner events per year</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">White-glove execution on every file — treat B partners like A+ on active deals</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3">Light, natural referral ask after a particularly smooth closing</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Scripts (Copy + Save)</h4>
      <div class="space-y-3 mb-6">
        ${window.renderPartnerScriptCard('Monthly Value Touch', 'Quick market note for your buyers — inventory in [Area] is up and we are seeing more negotiation room than 90 days ago. Happy to run real numbers on any active deal. No pitch, just data you can use with clients.', 'B Partner Value Touch')}
        ${window.renderPartnerScriptCard('Post-Smooth-Close Ask', 'Really enjoyed working with you on [Client]. If you have anyone else on the horizon who needs the same experience, I would love to help. Either way — thanks for trusting me.', 'B Partner Post-Close Ask')}
        ${window.renderPartnerScriptCard('Event Invitation', 'Hosting a small client appreciation event next month — would love to have you there. Good food, good people, no business talk. Let me know if you are in and feel free to bring a colleague.', 'B Partner Event Invite')}
        ${window.renderPartnerScriptCard('Quarterly Personal Note', 'Hey [Name] — just a quick note to say I appreciate our partnership. You sent some great clients my way and I do not take it lightly. Hope Q[X] is treating you well.', 'B Partner Quarterly Note')}
      </div>
      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-4">
        <strong>Goal:</strong> Move 3–5 B partners into A+ every year. The lever is over-delivery on files + consistent value between files.
      </div>
      ${window.renderModalNextSteps([
        { label: 'Client Appreciation Events', onclick: "if(typeof window.showSection==='function')window.showSection('eventplanning'); setTimeout(()=>{if(typeof window.openEventModal==='function')window.openEventModal('client-appreciation');},350);", style: 'primary' },
        { label: 'Weekly Value Cadence', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('weekly-value-cadence');", style: 'accent' },
        { label: 'A+ Playbook (Promotion Target)', onclick: "if(typeof window.openTierModal==='function')window.openTierModal('A+');", style: 'accent' }
      ])}
    `
  },
  'C': {
    title: "C Partners — Efficient Conversion Playbook",
    content: `
      <div class="bg-[#F15A29]/10 border border-[#F15A29]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#F15A29]"></i><span class="font-bold text-[#F15A29] uppercase tracking-wider text-sm">Low Time, High-Impact Prospecting</span></div>
        <p class="text-[15px]">New or low-volume sources. You cannot afford heavy one-on-one time on everyone here — but you CAN afford a full audition on the first file. That single investment separates partners who promote themselves from one-and-done referrals.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Who Belongs in C (For Now)</h4>
      <ul class="text-[15px] space-y-1.5 mb-6 pl-4 list-disc">
        <li>Met once at an event — no file yet</li>
        <li>Sent exactly one referral ever</li>
        <li>Responsive to email but not yet engaged personally</li>
        <li>High potential on paper but unproven in practice</li>
      </ul>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Efficient Conversion System</h4>
      <div class="space-y-2 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Day 0:</strong> Add to CRM + tag as C-tier + add to value newsletter</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>First file:</strong> Run the full 60-day onboarding sequence — treat this like an A+ audition</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Post-close:</strong> If they respond positively → promote to B. If silent → stay on automated touches only</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Quarterly:</strong> One light personal touch to entire C list (batched, 30 min)</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Scripts (Copy + Save)</h4>
      <div class="space-y-3 mb-6">
        ${window.renderPartnerScriptCard('Day 0 Welcome (Text or Video)', 'Hey [Agent Name] — [Your Name] here. Thanks for trusting me with [Client Name]. Quick overview of how I work: same-hour updates on milestones, Thursday check-ins even when quiet, and I will make you look brilliant to your client. Here is my one-pager on my process — reach out anytime.', 'C Partner Welcome')}
        ${window.renderPartnerScriptCard('Post-Close Promotion Check', 'Hope [Client] closing went smoothly on your end too. How did the process feel from your side? If you have anyone else coming up, I would love to deliver the same experience.', 'C Partner Post-Close Check')}
        ${window.renderPartnerScriptCard('Quarterly Light Touch (Batchable)', 'Hey [Name] — quick quarterly note. Still here if any of your clients need help on the mortgage side. Hope business is good.', 'C Partner Quarterly Batch')}
      </div>
      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-4">
        <strong>Pro Tip:</strong> Do not promote to B based on potential alone — promote based on response. A C partner who engages after a great first file is your next B partner.
      </div>
      ${window.renderModalNextSteps([
        { label: '60-Day Onboarding Sequence', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('60-day-realtor-onboarding');", style: 'primary' },
        { label: 'First 30 Days Checklist', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('first-30-days-checklist');", style: 'accent' },
        { label: 'B Partner Playbook (Promotion Target)', onclick: "if(typeof window.openTierModal==='function')window.openTierModal('B');", style: 'accent' }
      ])}
    `
  }
  };
  return _tierPlaybooksCache;
}

let _highImpactPlaysCache = null;
function getHighImpactPlays() {
  if (_highImpactPlaysCache) return _highImpactPlaysCache;
  _highImpactPlaysCache = {
  'first-30-days-checklist': {
    title: "First 30 Days with a New Partner",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">The Critical Window That Determines Everything</span></div>
        <p class="text-[15px]">The first 30 days with a new realtor or partner is your audition. Most LOs are inconsistent here. The ones who over-deliver in the first month earn a spot on the preferred list for life.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Exact 30-Day Playbook</h4>
      <div class="space-y-3 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Day 0 (Same day file arrives):</strong> Personal welcome video to the realtor + “How I Work With Agents” one-pager.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Day 1-2:</strong> Schedule 15-minute intro call. Purpose: Learn their business, pain points with lenders, and preferred communication style.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Within 48 hours of call:</strong> Send written recap of your exact cadence + 2-3 co-branded tools they can use immediately.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Week 1:</strong> Deliver your first Thursday update without fail. Over-communicate on this file.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Post first smooth closing:</strong> Ask for a quick testimonial + to be added to their preferred lender list.</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Day 0 Welcome Video Script (Copy + Save)</h4>
      <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-6" data-copy-text="Hey [Agent Name] — [Your Name] here. So glad we get to work together on [Client Name]. I take communication seriously: you’ll hear from me same-day on every milestone, and I’ll never leave you wondering where a file stands. Attached is how I work with agents — save it. Call or text me anytime. Let’s make this a great experience for your client.">
        <div class="flex justify-between items-start gap-3"><div class="flex-1"><div class="text-[15px] text-gray-700 dark:text-gray-300 mt-1">“Hey [Agent Name] — [Your Name] here. So glad we get to work together on [Client Name]. I take communication seriously: you’ll hear from me same-day on every milestone, and I’ll never leave you wondering where a file stands. Attached is how I work with agents — save it. Call or text me anytime. Let’s make this a great experience for your client.”</div></div><div class="flex flex-col gap-1"><button onclick="window.copyModalSection(this)" class="text-xs px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold whitespace-nowrap">Copy</button><button onclick="if(typeof window.toggleSaveIdea==='function'){window.toggleSaveIdea('First 30 Days: Welcome Video', this.closest('[data-copy-text]').getAttribute('data-copy-text'), this, 'partner');}" class="text-xs px-3 py-1 rounded-xl border border-[#F15A29] text-[#F15A29] hover:bg-[#F15A29] hover:text-white font-semibold whitespace-nowrap">Save</button></div></div>
      </div>
      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-4">
        <strong>Pro Tip:</strong> Run this exact sequence on every new partner. The discipline in the first 30 days is what separates consistent referrers from one-and-done relationships.
      </div>
      ${window.renderModalNextSteps([
        { label: '60-Day Onboarding Sequence', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('60-day-realtor-onboarding');", style: 'primary' },
        { label: 'A+ Partner Playbook', onclick: "if(typeof window.openTierModal==='function')window.openTierModal('A+');", style: 'accent' }
      ])}
    `
  },
  'referral-objections': {
    title: "Referral Partner Objection Playbook",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Handle Objections with Confidence and Empathy</span></div>
        <p class="text-[15px]">The best responses are calm, non-defensive, and reframe around helping the partner look good and protecting their client relationships. Never argue — earn the next file.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Mindset Before You Respond</h4>
      <ul class="text-[15px] space-y-1.5 mb-6 pl-4 list-disc">
        <li>Most objections are not rejections — they are tests of whether you will be pushy</li>
        <li>Ask for the backup spot, not the primary spot (yet)</li>
        <li>Offer proof on the next file instead of promises in conversation</li>
        <li>Follow up with value, not another ask, for 30 days after any objection</li>
      </ul>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready Responses (Copy + Personalize)</h4>
      <div class="space-y-3 mb-6">
        ${window.renderPartnerScriptCard('I already have a lender I like', 'Totally understand — most of my best partners keep 2-3 lenders they trust. I would love to be the one you call when timelines are tight, files get complicated, or you need someone who will actually communicate. Happy to be your backup until I earn the primary spot.', 'Partner Objection: Already Have a Lender')}
        ${window.renderPartnerScriptCard('I do not want to send you my clients', 'I completely respect that. My only goal is to make you look brilliant to your clients. If I ever drop the ball or do not communicate the way you need, you should absolutely stop sending me people. Until then, I would love the chance to prove it on the next one.', 'Partner Objection: Do Not Want to Send Clients')}
        ${window.renderPartnerScriptCard('Your rates are not competitive', 'Fair point — rates move daily and the best deal depends on the full picture, not just a headline number. What I can promise is transparent numbers fast, proactive communication, and making sure your client actually closes on time. Happy to run a real side-by-side on the next deal so you can compare apples to apples.', 'Partner Objection: Rates Not Competitive')}
        ${window.renderPartnerScriptCard('I had a bad experience with your company before', 'I am sorry that happened — that is not the experience I want anyone to have. If you are open to it, I would like to understand what went wrong so I can make sure it never happens on a file you send me. Either way, I respect your caution.', 'Partner Objection: Bad Past Experience')}
        ${window.renderPartnerScriptCard('I do not know you well enough yet', 'That makes total sense — trust is earned, not requested. Would it help if I sent you my agent process one-pager and a couple references from agents you might know? No rush on sending a file — I would rather you feel confident when the moment is right.', 'Partner Objection: Do Not Know You Yet')}
        ${window.renderPartnerScriptCard('I am too busy to switch lenders', 'You should not have to switch anything. Keep your primary lender — I would just love to be your backup for rush pre-approvals, tricky scenarios, or weeks when your go-to is underwater. Zero pressure, just an option in your back pocket.', 'Partner Objection: Too Busy to Switch')}
      </div>
      ${window.renderModalNextSteps([
        { label: '60-Day Onboarding (Earn Trust)', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('60-day-realtor-onboarding');", style: 'primary' },
        { label: 'Realtor Primary Playbook', onclick: "if(typeof window.openReferralModal==='function')window.openReferralModal('Realtors');", style: 'accent' }
      ])}
    `
  },
  '60-day-realtor-onboarding': {
    title: "60-Day Realtor Onboarding Sequence",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">The Audition That Turns One File Into a Pipeline</span></div>
        <p class="text-[15px]">Most LOs treat the first realtor file like any other. Top producers treat it like a 60-day job interview. Over-communicate, remove every friction point, and make the realtor look brilliant to their client.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">The 8-Touch 60-Day Sequence</h4>
      <div class="space-y-3 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Day 0:</strong> Same-hour personal welcome video + “How I Work With Agents” one-pager sent to both realtor and buyer.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Day 1-2:</strong> 15-min intro call with the realtor (ask their biggest frustrations with lenders).</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Within 48 hrs of call:</strong> Written recap of your exact communication cadence + 2–3 co-branded tools they can actually use.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Week 1:</strong> First Thursday update — do not miss this, even if nothing has changed.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Every Thursday:</strong> Consistent short update on the active file.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Milestones:</strong> Same-hour personal notification (appraisal, conditions, CTC, funding) to both realtor and client.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Post-Closing:</strong> Thank-you + marketing highlight they can use + soft testimonial ask.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Day 45–60:</strong> “How did that feel for you? Any clients coming up I can help the same way?”</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Copy + Save Scripts for Each Phase</h4>
      <div class="space-y-3 mb-6">
        ${window.renderPartnerScriptCard('Day 0 Welcome Video', 'Hey [Agent Name] — [Your Name] here. So glad we get to work together on [Client Name]. You will hear from me same-day on every milestone, and I will never leave you wondering where a file stands. Attached is how I work with agents — save it. Call or text me anytime.', '60-Day: Day 0 Welcome')}
        ${window.renderPartnerScriptCard('Post-Intro Call Recap Email', 'Great talking with you today. As promised — here is my communication cadence: same-hour milestone texts, Thursday updates even when quiet, and direct cell access for anything urgent. Attached are two co-branded tools your buyers can use this week.', '60-Day: Call Recap')}
        ${window.renderPartnerScriptCard('First Thursday Update', 'Thursday check-in on [Client]: [Status in one sentence]. Next step is [X] and we are on track for [date]. I will update you the moment anything changes.', '60-Day: First Thursday')}
        ${window.renderPartnerScriptCard('Post-Close Thank You + Testimonial Ask', 'So glad we got [Client] closed — they were amazing and you made it easy. Would you be open to a quick 2-sentence testimonial I can use? And if you have anyone else who needs this same experience, I am here.', '60-Day: Post-Close Ask')}
        ${window.renderPartnerScriptCard('Day 45–60 Relationship Check', 'Hey [Name] — it has been about 60 days since we closed [Client]. How did that process feel from your side? Anything I could do better on the next one? And anyone on your radar I can help the same way?', '60-Day: Day 45-60 Check')}
      </div>

      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-4">
        <strong>Core Principle:</strong> Over-communicate on the first file. Consistency and speed beat any gift basket.
      </div>
      ${window.renderModalNextSteps([
        { label: 'First 30 Days Checklist', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('first-30-days-checklist');", style: 'primary' },
        { label: 'Loan Process Communications', onclick: "if(typeof window.showSection==='function')window.showSection('process');", style: 'accent' }
      ])}
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

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Sunday Night Batching Ritual (30 Minutes)</h4>
      <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-6 text-[15px]">
        <strong>Block 30 minutes every Sunday:</strong> Pull your A/B partner list, check who is due for a touch this week, and pre-write 5–10 short texts or record 2–3 market videos. Personalize one line per person (their neighborhood, a recent closing, or something from your last conversation). Send Monday morning — never more than 20% of touches should include an ask.
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Scripts (Copy + Save)</h4>
      <div class="space-y-3 mb-6">
        ${window.renderPartnerScriptCard('Week 1 — Monday Market Insight', 'Quick note for your buyers — inventory in [Area] is up and we are seeing more negotiation room than 90 days ago. Happy to run real numbers on any active deal. No pitch, just data you can use with clients.', 'Cadence: Monday Market Insight')}
        ${window.renderPartnerScriptCard('Week 2 — Thursday File Update', '[Client] file update: Appraisal received and clean. One condition still outstanding (paystub). Targeting full clear by Thursday. I will keep you posted the moment anything moves.', 'Cadence: Thursday Update')}
        ${window.renderPartnerScriptCard('Week 3 — Personal Note', 'Hey [Name] — saw [local thing/article] and immediately thought of our conversation about [topic]. Hope your week is going well. No agenda, just wanted to say hi.', 'Cadence: Personal Note')}
        ${window.renderPartnerScriptCard('Week 4 — Light Value Share', 'Just refreshed my co-branded first-time buyer guide for 2026. Happy to send you the PDF with your logo on it if that would be useful for your sphere this month.', 'Cadence: Value Share')}
        ${window.renderPartnerScriptCard('Week 5 — Birthday / Life Event', 'Happy birthday [Name]! Hope you get a chance to actually unplug today. Grateful for the partnership — you make my job easier.', 'Cadence: Birthday Touch')}
        ${window.renderPartnerScriptCard('Week 7 — Event or Coffee Invite', 'I am doing a small client appreciation event in [month] — would love to have you and a couple of your top clients if you are interested. No business talk, just good people and good food.', 'Cadence: Event Invite')}
        ${window.renderPartnerScriptCard('Week 8 — Gratitude Reset', 'Quick reset note — I really appreciate how you communicate on files. It makes everything smoother for your clients and for me. Looking forward to the next one we get to do together.', 'Cadence: Gratitude Reset')}
      </div>

      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-4">
        <strong>Pro Tip:</strong> Batch all your Monday value touches on Sunday night. It takes 20–30 minutes and keeps dozens of partners warm.
      </div>
      ${window.renderModalNextSteps([
        { label: '60-Day Onboarding Sequence', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('60-day-realtor-onboarding');", style: 'primary' },
        { label: 'B Partner Playbook', onclick: "if(typeof window.openTierModal==='function')window.openTierModal('B');", style: 'accent' },
        { label: 'Weekly Win Plan', onclick: "if(typeof window.showSection==='function')window.showSection('weekly-win-plan');", style: 'accent' }
      ])}
    `
  },
  'relationship-management': {
    title: "Relationship Management &amp; Asking for More",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">The Non-Awkward Way to Grow Referrals</span></div>
        <p class="text-[15px]">The best asks happen naturally after you’ve already delivered exceptional results. Never lead with the ask — lead with gratitude and value.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">When to Ask (Timing Rules)</h4>
      <ul class="text-[15px] space-y-1.5 mb-6 pl-4 list-disc">
        <li><strong>Best moments:</strong> Right after a smooth closing, after you saved a deal, or after they compliment your communication</li>
        <li><strong>Never ask:</strong> During a stressful file, right after an objection, or when you have not delivered value in 30+ days</li>
        <li><strong>Ratio rule:</strong> For every 1 ask, deliver 4+ value-only touches in the prior 60 days</li>
        <li><strong>Frame:</strong> Lead with gratitude, then offer availability — never pressure</li>
      </ul>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Scripts (Copy + Save)</h4>
      <div class="space-y-3 mb-6">
        ${window.renderPartnerScriptCard('The Best Question to Ask', 'What can I do to earn more of your business? I genuinely want to know what would make working with me easier or more valuable for you and your clients.', 'Partner: Earn More Business Ask')}
        ${window.renderPartnerScriptCard('Post-Close Soft Ask', 'The clients you send me always have a great experience. If you have anyone else on the horizon I can help the same way, I would be honored. No pressure at all — just wanted you to know I am here whenever it makes sense.', 'Partner: Post-Close Soft Ask')}
        ${window.renderPartnerScriptCard('After You Saved a Deal', 'Glad we got [Client] across the finish line — I know that one was stressful. If you have any other buyers or listings where speed and communication matter, I would love to help the same way.', 'Partner: After Saved Deal')}
        ${window.renderPartnerScriptCard('Quarterly Relationship Check-In', 'Hey [Name] — quarterly check-in. How is the partnership feeling from your side? Anything I could do better on communication, turnaround, or tools I send your way?', 'Partner: Quarterly Check-In')}
        ${window.renderPartnerScriptCard('Celebrate Their Win Publicly', 'Huge congrats on [achievement/listing/award] — you absolutely earned it. Proud to partner with someone who takes care of clients the way you do.', 'Partner: Celebrate Their Win')}
        ${window.renderPartnerScriptCard('Post-Objection Value Follow-Up', 'No pressure at all on the referral conversation from last month — just wanted to send you this updated market one-pager for your buyers. Use it however is helpful.', 'Partner: Post-Objection Value')}
      </div>

      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-4">
        <strong>Key Mindset:</strong> The ask should feel like a natural thank-you for the relationship, never a transaction.
      </div>
      ${window.renderModalNextSteps([
        { label: 'Turn 1 Realtor Into 5 More', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('realtor-to-5-more');", style: 'primary' },
        { label: 'Referral Objection Playbook', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('referral-objections');", style: 'accent' },
        { label: 'A+ Partner Playbook', onclick: "if(typeof window.openTierModal==='function')window.openTierModal('A+');", style: 'accent' }
      ])}
    `
  },
  'co-marketing-assets': {
    title: "Co-Marketing Asset Ideas",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Low-Cost, High-Perceived-Value Offers</span></div>
        <p class="text-[15px]">The best co-marketing makes the realtor look like the hero while subtly positioning you as the expert they trust.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">High-Impact Asset Menu</h4>
      <div class="grid md:grid-cols-2 gap-3 mb-6 text-sm">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Co-Branded Buyer Guide</strong><br>First-time buyer timeline + program overview with both logos</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Monthly Market Snapshot</strong><br>One-page PDF: rates, inventory, negotiation trends for their zip codes</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Open House Toolkit</strong><br>Financing one-pager, pre-approval station sign, branded water/snacks offer</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Social Content Pack</strong><br>4–5 carousel posts or Reels they can repost with minimal editing</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Joint Buyer Event</strong><br>Lunch-and-learn, happy hour, or first-time buyer seminar</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Closing Shoutout Package</strong><br>Co-branded social post + testimonial template after every close</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Outreach Scripts to Offer Assets (Copy + Save)</h4>
      <div class="space-y-3 mb-6">
        ${window.renderPartnerScriptCard('Buyer Guide Offer', 'Would a co-branded first-time buyer guide be helpful for your sphere right now? I can put together a clean PDF with both our logos — takes me about a day and your buyers can use it immediately.', 'Co-Marketing: Buyer Guide Offer')}
        ${window.renderPartnerScriptCard('Monthly Market Snapshot', 'I put together a one-page market snapshot for [Area] this month — rates, inventory, and what buyers should know. Happy to co-brand it with your logo if you want to send it to active clients.', 'Co-Marketing: Market Snapshot')}
        ${window.renderPartnerScriptCard('Open House Support Offer', 'For your next open house — I can bring branded materials, run quick pre-approval scenarios for serious buyers, and follow up same-day on anyone we meet. What would be most helpful for you?', 'Co-Marketing: Open House Offer')}
        ${window.renderPartnerScriptCard('Joint Buyer Seminar', 'Would a small first-time buyer seminar or happy hour be valuable for your business this quarter? I handle the financing education, you invite your sphere — low pressure, high value for both of us.', 'Co-Marketing: Joint Seminar')}
        ${window.renderPartnerScriptCard('Social Shoutout After Close', 'So glad we got [Client] closed — would you be open to a co-branded social post tagging both of us? I will draft it so you can approve before it goes live.', 'Co-Marketing: Closing Shoutout')}
      </div>

      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-4">
        <strong>Pro Tip:</strong> Always ask the realtor first what would actually help their business right now. Then deliver exactly that — not what you think they need.
      </div>
      ${window.renderModalNextSteps([
        { label: 'Open House Domination Play', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('open-house-domination');", style: 'primary' },
        { label: 'Realtor Primary Playbook', onclick: "if(typeof window.openReferralModal==='function')window.openReferralModal('Realtors');", style: 'accent' },
        { label: 'Social Strategy', onclick: "if(typeof window.showSection==='function')window.showSection('social');", style: 'accent' }
      ])}
    `
  },
  'open-house-domination': {
    title: "Open House Domination Play",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Turn Someone Else’s Open House Into Your Lead & Relationship Engine</span></div>
        <p class="text-[15px]">The realtor is already doing the hard work of getting people in the door. Your job is to add massive value without stepping on their toes.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Exact Execution Play</h4>
      <div class="space-y-3 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Before:</strong> Ask the realtor what they want from you (pre-qual offers, answer financing questions, hand out branded water, etc.).</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>During:</strong> Bring nice branded water/snacks. Have a simple one-page “Financing Reality Check” sheet with your contact. Offer to chat with any interested buyers about pre-approval (with the realtor’s permission).</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Immediately after:</strong> Collect business cards from anyone you spoke with. Same-day follow-up text: “Loved meeting you at the open house on [Street]. Here’s the quick financing overview I mentioned. Happy to run numbers for you anytime.”</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>To the realtor:</strong> Send a short recap + thank you + offer to do it again.</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">What to Bring (Low Cost, High Perceived Value)</h4>
      <ul class="text-[15px] space-y-1.5 mb-6 pl-4 list-disc">
        <li>Branded water bottles or snacks (ask the realtor what fits the property)</li>
        <li>One-page “Financing Reality Check” sheet (down payment myths, pre-approval timeline)</li>
        <li>Business cards + QR code to your pre-approval landing page</li>
        <li>Tablet or phone for quick scenario runs (only with realtor permission)</li>
      </ul>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Scripts (Copy + Save)</h4>
      <div class="space-y-3 mb-6">
        ${window.renderPartnerScriptCard('Pre-Event Ask (48 Hours Before)', 'For Saturday open house — what would be most helpful from me? I can bring materials, answer financing questions for serious buyers, or just support however you want. I will stay in my lane and make you look great.', 'Open House: Pre-Event Ask')}
        ${window.renderPartnerScriptCard('During — Buyer Intro (Soft)', 'Hi — I am [Name], the financing partner [Agent] invited today. If you have any questions about pre-approval or what payment might look like on this home, happy to chat. No pressure at all.', 'Open House: Buyer Intro')}
        ${window.renderPartnerScriptCard('Same-Day Buyer Follow-Up', 'Loved meeting you at the open house on [Street]. Here is the quick financing overview I mentioned. Happy to run real numbers for you anytime — just reply with your timeline.', 'Open House: Buyer Follow-Up')}
        ${window.renderPartnerScriptCard('Same-Day Realtor Recap', 'Great open house today — met [X] serious buyers and sent follow-ups already. Thanks for having me. Happy to do it again anytime and can bring updated materials next round.', 'Open House: Realtor Recap')}
        ${window.renderPartnerScriptCard('Invite-Back Offer', 'If you have another open house coming up, I would love to support again — I can refresh the financing one-pager and handle same-day buyer follow-up so you stay focused on the property.', 'Open House: Invite Back')}
      </div>

      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-4">
        <strong>Pro Tip:</strong> Never hard-sell at the open house. Position yourself as the helpful financing expert the realtor brought in. The realtors who see you add value will invite you back.
      </div>
      ${window.renderModalNextSteps([
        { label: 'Co-Marketing Assets', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('co-marketing-assets');", style: 'primary' },
        { label: 'First 30 Days Checklist', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('first-30-days-checklist');", style: 'accent' },
        { label: 'Realtor Primary Playbook', onclick: "if(typeof window.openReferralModal==='function')window.openReferralModal('Realtors');", style: 'accent' }
      ])}
    `
  },
  'realtor-to-5-more': {
    title: "Turning One Strong Realtor Into 5 More",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Your Best Realtors Become Your Best Recruiters</span></div>
        <p class="text-[15px]">When a realtor has a great experience, they are usually happy to introduce you to their colleagues — if you ask the right way at the right time.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">The Referral-from-Referral System</h4>
      <div class="space-y-3 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>After a great closing:</strong> “Who else on your team or in your network would benefit from the same white-glove experience I gave [Client]?”</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Host a small “Bring a Colleague” mastermind</strong> — invite your top 3-4 realtors and let each bring one friend.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>After every strong referral from an existing partner:</strong> Send a thank-you + “If you have any colleagues who would appreciate the same level of communication, I’d be grateful for the introduction.”</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">The 5-Step Network Effect System</h4>
      <div class="space-y-2 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Step 1:</strong> Deliver 3+ exceptional files with the anchor realtor before asking for introductions</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Step 2:</strong> Ask for one specific name: “Who is one agent you respect that I should meet?”</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Step 3:</strong> Get a warm intro (text or email) within 48 hours — never cold outreach if avoidable</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Step 4:</strong> Over-deliver on the first file from the new agent — repeat the 60-day onboarding sequence</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Step 5:</strong> Publicly thank the original realtor for the introduction (social proof loop)</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Scripts (Copy + Save)</h4>
      <div class="space-y-3 mb-6">
        ${window.renderPartnerScriptCard('Post-Close Introduction Ask', 'Who is one agent on your team or in your network you respect that I should meet? I would love to give them the same experience we just delivered for [Client].', 'Network: Post-Close Intro Ask')}
        ${window.renderPartnerScriptCard('Bring a Colleague Mastermind Invite', 'I am hosting a small mastermind for my top realtor partners — would you come and bring one colleague you think would benefit? No pitch, just real talk about what is working in this market.', 'Network: Mastermind Invite')}
        ${window.renderPartnerScriptCard('Thank-You After Referral', 'Thank you for sending [Client] — they were great to work with and you made it easy. If any colleagues would appreciate the same communication, I would be grateful for the intro.', 'Network: Thank You After Referral')}
        ${window.renderPartnerScriptCard('Warm Intro Request Text', 'Hey [Name] — [Mutual Agent] suggested I reach out. I have loved working with them on files and would value connecting with you. No pressure — happy to grab coffee or just be a resource when timing is right.', 'Network: Warm Intro Outreach')}
        ${window.renderPartnerScriptCard('Public Thank-You Post', 'Huge shoutout to [Agent] for the introduction to [New Agent] — already helping their buyer and grateful for partners who look out for each other. This is how great teams grow.', 'Network: Public Thank You')}
      </div>

      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-4">
        <strong>Pro Tip:</strong> The best realtors become your best recruiters when you make them look like the smart one for introducing you.
      </div>
      ${window.renderModalNextSteps([
        { label: 'Relationship Management', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('relationship-management');", style: 'primary' },
        { label: '60-Day Onboarding', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('60-day-realtor-onboarding');", style: 'accent' },
        { label: 'Event Planning (Mastermind)', onclick: "if(typeof window.showSection==='function')window.showSection('events');", style: 'accent' }
      ])}
    `
  },
  'builder-training': {
    title: "Builder Sales Team Training Sequence",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Become the Default Lender for an Entire Sales Floor</span></div>
        <p class="text-[15px]">Builders and their sales teams send volume when you make their jobs easier and help them close more deals.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Winning the Builder Relationship</h4>
      <div class="space-y-3 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Offer a 30-minute lunch-and-learn</strong> titled “Current Financing Options That Actually Help Your Buyers Win Right Now.”</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Provide simple one-pagers</strong> for their desks with current programs, rate buydown strategies, and your direct contact.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Be the fastest</strong> to return calls and pre-approvals on builder deals.</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Offer joint buyer consultations</strong> at the model home when needed.</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">4-Week Builder Training Sequence</h4>
      <div class="space-y-2 mb-6 text-[15px]">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Week 1:</strong> Lunch-and-learn — current programs that help buyers win (30 min, bring food)</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Week 2:</strong> Deliver desk one-pager + direct cell line card for every sales rep</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Week 3:</strong> Shadow a model home Saturday — answer financing questions in real time</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Week 4:</strong> Monthly check-in with sales manager — refresh sheet, ask what buyers are asking</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Scripts (Copy + Save)</h4>
      <div class="space-y-3 mb-6">
        ${window.renderPartnerScriptCard('Sales Team Training Offer', 'I would love to become your go-to lender for the community. I can offer your sales team a 30-minute lunch-and-learn on current financing options that actually help buyers win in this market, plus a simple one-pager they can keep at their desk. Would next Tuesday or Thursday work?', 'Builder: Sales Training Offer')}
        ${window.renderPartnerScriptCard('Builder Sales Rep File Update', 'Quick update on [Buyer Name] — they are fully pre-approved and we are targeting clear to close by [date]. I will keep you posted the moment anything moves so your team can keep the buyer excited and on track.', 'Builder: Sales Rep Update')}
        ${window.renderPartnerScriptCard('Model Home Joint Consult Offer', 'If you have a buyer who is on the fence at [Community], I am happy to do a quick 15-minute financing consult at the model home — no pressure, just real numbers so they can move forward with confidence.', 'Builder: Model Home Consult')}
        ${window.renderPartnerScriptCard('Construction Timeline Reassurance', 'Wanted to reassure you on [Buyer] — we are aligned with the build schedule and everything is on track for a [month] close. I will flag you immediately if anything on the financing side needs attention.', 'Builder: Timeline Reassurance')}
        ${window.renderPartnerScriptCard('Post-Close Builder Thank-You', 'Just closed [Buyer] at [Community] — smooth file and great buyers. Thanks for trusting me with them. If you know other builders or sales managers who would value the same speed and communication, I would appreciate the intro.', 'Builder: Post-Close Thank You')}
      </div>

      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-4">
        <strong>Pro Tip:</strong> Once you become the go-to for one sales team, ask for introductions to other builders in the area. They often know each other.
      </div>
      ${window.renderModalNextSteps([
        { label: 'Builder Primary Playbook', onclick: "if(typeof window.openReferralModal==='function')window.openReferralModal('Builders');", style: 'primary' },
        { label: 'Weekly Value Cadence', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('weekly-value-cadence');", style: 'accent' },
        { label: 'Loan Process Communications', onclick: "if(typeof window.showSection==='function')window.showSection('process');", style: 'accent' }
      ])}
    `
  },
  'professional-referral-request': {
    title: "Professional Partner Referral Request",
    content: `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">Low-Pressure Asks for Attorneys, Planners, HR, etc.</span></div>
        <p class="text-[15px]">These partners value professionalism and protecting their clients’ experience. The ask must feel natural and low-risk for them.</p>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Partner Types &amp; What They Care About</h4>
      <div class="grid md:grid-cols-2 gap-3 mb-6 text-sm">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Attorneys / Title</strong><br>Smooth closings, no surprises, professional communication with their clients</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Financial Planners / CPAs</strong><br>Holistic advice, equity strategy, no pushy sales tactics</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>HR / Benefits Teams</strong><br>Low-stress employee experience, clear timelines, minimal admin burden</div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3"><strong>Insurance / Wealth Advisors</strong><br>Protecting client relationships, coordinated advice, white-glove service</div>
      </div>

      <h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">Ready-to-Use Scripts (Copy + Save)</h4>
      <div class="space-y-3 mb-6">
        ${window.renderPartnerScriptCard('Universal Professional Soft Ask', 'If you ever have a client or colleague who needs a truly low-stress mortgage experience, I would be honored to help them the same way I helped the people you have already sent my way. No pressure at all — just wanted you to know the door is open.', 'Professional: Universal Soft Ask')}
        ${window.renderPartnerScriptCard('Attorney / Title Partner', 'I know your clients expect precision and zero drama at closing. That is exactly how I run files — proactive updates, no surprises, and I loop you in when it helps the client feel supported. Happy to be a resource anytime.', 'Professional: Attorney Title')}
        ${window.renderPartnerScriptCard('Financial Planner / CPA', 'I would love to be a resource for clients navigating a move, refi, or equity strategy. I always loop planners in on major decisions so everyone stays aligned — no pitch, just coordinated advice.', 'Professional: Financial Planner')}
        ${window.renderPartnerScriptCard('HR / Benefits Outreach', 'If your team ever wants a low-pressure lunch-and-learn on homebuying basics or refinance options for employees, I am happy to host it. No sales pitch — just clear education your people can actually use.', 'Professional: HR Benefits')}
        ${window.renderPartnerScriptCard('Post-Close Professional Thank-You', 'We just closed [Client] — thank you for the introduction. They were a pleasure to work with. I will send you a brief recap so you know everything went smoothly. If anyone else comes to mind, I am here.', 'Professional: Post-Close Thank You')}
        ${window.renderPartnerScriptCard('Quarterly Value Touch', 'Quick quarterly note — programs and equity options have shifted slightly this quarter. Happy to send a one-page summary you can share with clients considering a move or portfolio adjustment. No pitch, just a resource.', 'Professional: Quarterly Value')}
      </div>

      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-4">
        <strong>Pro Tip:</strong> These referrals are highest quality when they come after you have already done great work for one of their clients. Always send a short thank-you note after the closing.
      </div>
      ${window.renderModalNextSteps([
        { label: 'Relationship Management', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('relationship-management');", style: 'primary' },
        { label: 'C Partner Conversion', onclick: "if(typeof window.openTierModal==='function')window.openTierModal('C');", style: 'accent' },
        { label: 'Weekly Value Cadence', onclick: "if(typeof window.openHighImpactPlay==='function')window.openHighImpactPlay('weekly-value-cadence');", style: 'accent' }
      ])}
    `
  }
  };
  return _highImpactPlaysCache;
}

window.openReferralModal = function(partnerType) {
  try {
    ensureReferralModalExists();
    const modal = document.getElementById('referral-modal');
    const titleEl = document.getElementById('referral-modal-title');
    const contentEl = document.getElementById('referral-content');
    if (!modal || !titleEl || !contentEl) {
      console.error('[Referral Modal] Still could not find elements after ensureReferralModalExists() for', partnerType);
      alert('Referral modal creation failed. Do a hard refresh (Ctrl/Cmd + Shift + R) + completely close the browser tab, then reopen the file.');
      return;
    }
    const data = getReferralPlaybooks()[partnerType] || { title: partnerType + ' Playbook', content: `<p>Full playbook for ${partnerType} coming soon. Focus on value-first touches and over-delivery on the first file.</p>` };
    titleEl.textContent = data.title;
    contentEl.innerHTML = data.content;
    modal.style.zIndex = '99999';
    if (typeof window.openNamedModal === 'function') window.openNamedModal(modal);
    else if (typeof window.openAppModal === 'function') window.openAppModal(modal);
    else { modal.style.display = 'flex'; modal.classList.remove('hidden'); modal.classList.add('flex'); }
  } catch (e) {
    console.error('[Referral] openReferralModal error', e);
    alert('Could not open referral playbook. Hard refresh the page and try again.');
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
      alert('Referral modal creation failed. Do a hard refresh (Ctrl/Cmd + Shift + R) + completely close the browser tab, then reopen the file.');
      return;
    }
    const data = getTierPlaybooks()[tier] || { title: tier + ' Partners Playbook', content: `<p>Detailed ${tier} playbook with cadence and scripts.</p>` };
    const richTitle = typeof window.getPartnerTierModalTitle === 'function' ? window.getPartnerTierModalTitle(tier) : null;
    titleEl.textContent = richTitle || data.title;
    if (typeof window.renderRichPartnerTierModal === 'function' && window.renderRichPartnerTierModal(tier, contentEl)) {
      // rich tier renderer handled content + handlers
    } else {
      contentEl.innerHTML = data.content;
    }
    modal.style.zIndex = '99999';
    if (typeof window.openNamedModal === 'function') window.openNamedModal(modal);
    else if (typeof window.openAppModal === 'function') window.openAppModal(modal);
    else { modal.style.display = 'flex'; modal.classList.remove('hidden'); modal.classList.add('flex'); }
  } catch (e) {
    console.error('[Referral] openTierModal error', e);
    alert('Could not open tier playbook. Hard refresh the page and try again.');
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
      alert('Referral modal creation failed. Do a hard refresh (Ctrl/Cmd + Shift + R) + completely close the browser tab, then reopen the file.');
      return;
    }
    const data = getHighImpactPlays()[playKey] || { title: playKey.replace(/-/g, ' '), content: `<p>Ready-to-run guidance and scripts for ${playKey}.</p>` };
    titleEl.textContent = data.title;
    if (typeof window.renderRichReferralPlay === 'function' && window.renderRichReferralPlay(playKey, contentEl)) {
      // rich play renderer handled content + handlers
    } else {
      contentEl.innerHTML = data.content;
    }
    modal.style.zIndex = '99999';
    if (typeof window.openNamedModal === 'function') window.openNamedModal(modal);
    else if (typeof window.openAppModal === 'function') window.openAppModal(modal);
    else { modal.style.display = 'flex'; modal.classList.remove('hidden'); modal.classList.add('flex'); }
  } catch (e) {
    console.error('[Referral] openHighImpactPlay error', e);
    alert('Could not open play. Hard refresh the page and try again.');
  }
};

window.closeReferralModal = function() {
  try {
    if (typeof window.closeNamedModal === 'function') {
      window.closeNamedModal('referral-modal');
    } else if (typeof window.closeAppModal === 'function') {
      window.closeAppModal(document.getElementById('referral-modal'));
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

// Profile modal logic → js/features/user-profile.js

// ─── Restore event + referral rich modals after bulk helpers load ───
(function () {
  if (typeof window.restoreEventModals === 'function') {
    window.restoreEventModals();
    console.log('[referral-event-modals] event-rich-modals.js restored');
  }
  if (typeof window.restoreReferralModals === 'function') {
    window.restoreReferralModals();
    console.log('[referral-event-modals] referral-rich-modals.js restored');
  }
})();
