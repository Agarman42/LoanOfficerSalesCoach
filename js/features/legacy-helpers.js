/**
 * js/features/legacy-helpers.js
 *
 * Restored legacy onclick handlers that were lost during modular extraction.
 * These power many of the older cards/modals in Social, Referral, Database,
 * and the Prospecting Time Blocking tools.
 *
 * All functions are exposed on window for inline onclick compatibility.
 */

(function () {
  'use strict';

  // =====================================================
  // ACTIVITIES DATA (for Prospecting Time Blocking)
  // =====================================================
  const activities = {
    daily: [
      "Write two personal handwritten notes or thank-you cards.",
      "Make at least five outbound relationship calls to past clients or partners.",
      "Send personalized birthday/anniversary video messages.",
      "Engage on social (comment/like 10 posts from realtors & clients).",
      "Record and post one short-form video about mortgage tips or market updates.",
      "Follow up with new online leads within 24 hours.",
      "Reach out to one past client for a pure relationship check-in.",
      "Send a quick value text or video to a referral partner.",
      "Knock on one local business door with a small pop-by.",
      "Review and update CRM notes for follow-ups.",
      "Post one 75% personal life story on social and tag partners.",
      "Review a past client file for refinance opportunity.",
      "Time-block a passion activity with a partner (golf, etc.).",
      "Like/comment on team closing photos.",
      "Send milestone update texts to active clients."
    ],
    weekly: [
      "Pipeline review with key referral partners.",
      "Send weekly updates to active clients.",
      "Host a 15-min coaching Zoom for realtors.",
      "Attend at least one networking event.",
      "Send value-first 'Who do you know?' texts to partners.",
      "Create and send a value-packed email/newsletter.",
      "Host casual coffee or lunch with a partner.",
      "Review past loans for refinance opportunities.",
      "Host a passion-blended activity with 2-3 realtors.",
      "Send 10–15 birthday/anniversary videos.",
      "Post client success stories on social.",
      "Review CRM and re-engage dormant contacts."
    ],
    monthly: [
      "Deliver pop-by gifts to top 10 partners/clients.",
      "Host an Ask Your Lender Zoom call.",
      "Host a first-time homebuyer seminar.",
      "Send handwritten birthday/anniversary cards.",
      "Record a long-form video on a trending topic.",
      "Partner with a realtor for co-branded campaign.",
      "Attend a local community event.",
      "Host a passion-blended event (wine & canvas, golf, etc.).",
      "Mail a 'Just Because' value pack to database.",
      "Run a referral partner survey.",
      "Create monthly 'LO Insider' newsletter."
    ],
    quarterly: [
      "Host a full Lunch & Learn for agents/partners.",
      "Run a local market update webinar.",
      "Organize a Realtor Mastermind event.",
      "Sponsor a local charity or community event.",
      "Host a networking happy hour.",
      "Run a contest/giveaway for clients and partners.",
      "Plan a group golf outing or Top Golf with top partners.",
      "Launch a quarterly Referral Partner Spotlight campaign.",
      "Host a co-branded first-time buyer fair."
    ],
    yearly: [
      "Plan and execute a major client + partner appreciation event.",
      "Run a full annual database audit and re-engagement campaign.",
      "Host a signature annual golf scramble or charity event.",
      "Create a year-in-review video/newsletter for your whole database.",
      "Launch a big referral contest with meaningful prizes.",
      "Review and optimize your entire marketing + relationship system for the next year."
    ]
  };

  window.activities = activities; // expose if needed elsewhere

  // =====================================================
  // PROSPECTING TIME BLOCKING
  // =====================================================
  window.cycleActivities = function cycleActivities() {
    const freqEl = document.getElementById('frequency');
    if (!freqEl) return alert('Frequency selector not found.');

    const freq = freqEl.value.toLowerCase();
    const list = activities[freq] || activities.daily;

    const shuffled = [...list].sort(() => 0.5 - Math.random());
    const selection = shuffled.slice(0, Math.floor(Math.random() * 6) + 5);

    const html = selection.map(act => `<li class="mb-2 flex items-start"><span class="mr-2 text-[#F15A29]">•</span> ${act}</li>`).join('');

    const output = document.getElementById('time-block-output');
    if (output) {
      output.innerHTML = `
        <h4 class="text-2xl font-bold mb-4 capitalize text-[#00A89D]">Cycled ${freq} Ideas</h4>
        <ul class="space-y-2 text-lg">${html}</ul>
      `;
    }
  };

  window.generateTimeBlock = function generateTimeBlock() {
    const freqEl = document.getElementById('frequency');
    if (!freqEl) return;

    const freq = freqEl.value.toLowerCase();
    const list = activities[freq] || activities.daily;

    const html = list.map(act => `<li class="mb-2 flex items-start"><span class="mr-2 text-[#00A89D]">•</span> ${act}</li>`).join('');

    const output = document.getElementById('time-block-output');
    if (output) {
      output.innerHTML = `
        <h4 class="text-2xl font-bold mb-4 capitalize text-[#00A89D]">${freq} Prospecting Schedule</h4>
        <ul class="space-y-2 text-lg">${html}</ul>
      `;
    }
  };

  // =====================================================
  // SOCIAL MEDIA PILLAR MODALS
  // =====================================================
  window.openSocialModal = function openSocialModal(category) {
    const modal = document.getElementById('content-modal');
    if (!modal) {
      console.error('Social modal #content-modal not found');
      return;
    }

    const titleEl = document.getElementById('modal-title');
    const listEl = document.getElementById('modal-list');

    if (!titleEl || !listEl) {
      console.error('Missing modal-title or modal-list elements');
      return;
    }

    listEl.innerHTML = '';

    let title = category + ' Content Ideas';
    let items = [];

    switch (category) {
      case 'Personal':
        title = 'Personal Content Ideas';
        items = [
          "Behind-the-scenes of my morning coffee run ☕",
          "Weekend family hike — who else loves the outdoors?",
          "My favorite hobby right now (golf/poker/cooking) — what’s yours?",
          "Quick kitchen hack or recipe I used this week",
          "Throwback to my very first closing — 5 years ago!",
          "Pet photo Friday! Meet my dog 🐶",
          "What I’m grateful for this week as a loan officer",
          "A funny story from a recent client meeting",
          "Favorite local restaurant I took a client to"
        ];
        break;
      case 'Local':
        title = 'Local Spotlight Ideas';
        items = [
          "Why homes in our area are selling faster than ever",
          "Hidden gem coffee shop perfect for client meetings",
          "This weekend’s best community events",
          "Local market stats snapshot (easy to read graphic)",
          "Shout-out to a great local business I love"
        ];
        break;
      case 'Educational':
        title = 'Educational / Value Content';
        items = [
          "What first-time buyers need to know in 2026",
          "Current rate trends explained simply",
          "How to use equity to buy your next home",
          "5 questions every buyer should ask their lender",
          "Refinance vs. purchase — when does it make sense?"
        ];
        break;
      case 'Client Wins':
        title = 'Client Wins & Testimonials';
        items = [
          "Another happy family in their dream home!",
          "First-time buyer closed in 21 days — here’s how",
          "Referral partner success story (tag them!)",
          "Before & after: From pre-approval to keys"
        ];
        break;
      case 'Value':
        title = 'Value-First Posts for Partners';
        items = [
          "Market update tailored for realtors",
          "Co-branded infographic you can share",
          "Quick tip: How to explain today’s rates to buyers",
          "Free tool or checklist you can send to your clients"
        ];
        break;
      case 'Engagement':
        title = 'Engagement & Interaction Posts';
        items = [
          "Poll: “What’s the #1 thing buyers are asking you right now?”",
          "Ask your followers: “What’s your favorite local restaurant?”",
          "Tag 3 realtors who made your week easier",
          "Open question: “What would make your job easier this month?”"
        ];
        break;
      default:
        items = ["Great content idea coming soon for " + category];
    }

    titleEl.textContent = title;
    listEl.innerHTML = '';

    items.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'group flex items-start justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-700/70 rounded-2xl border border-gray-200 dark:border-gray-600 hover:border-[#00A89D]/60 hover:shadow-md transition-all';

      card.innerHTML = `
        <div class="flex-1 text-base leading-snug text-gray-800 dark:text-gray-200 pr-2">
          ${item}
        </div>
        <button class="copy-btn flex-shrink-0 opacity-40 group-hover:opacity-100 transition-all text-[#00A89D] hover:text-[#008F85] p-1.5 -mr-1 -mt-1 rounded-lg hover:bg-[#00A89D]/10"
                title="Copy idea">
          <i class="fas fa-copy text-sm"></i>
        </button>
      `;

      // Add copy functionality
      const copyBtn = card.querySelector('.copy-btn');
      copyBtn.addEventListener('click', (e) => {
        e.stopImmediatePropagation();
        navigator.clipboard.writeText(item).then(() => {
          const originalHTML = copyBtn.innerHTML;
          copyBtn.innerHTML = `<i class="fas fa-check text-sm"></i>`;
          copyBtn.classList.add('text-green-500');

          // Show toast
          showToast('Idea copied to clipboard!');

          setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.classList.remove('text-green-500');
          }, 1500);
        }).catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = item;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          showToast('Idea copied!');
        });
      });

      listEl.appendChild(card);
    });

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  };

  window.closeModal = function closeModal() {
    const modal = document.getElementById('content-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  };

  // =====================================================
  // RICH REFERRAL PARTNER PLAYBOOKS (Strategy + Content Focused)
  // =====================================================
  const PARTNER_PLAYBOOKS = {
    Realtors: {
      title: "Realtors – Primary Referral Engine",
      intro: "Realtors remain the single highest-leverage referral source for the vast majority of loan officers. The agents who consistently send you their best clients do it because you make them look like heroes and dramatically reduce their stress. This is a deep, battle-tested playbook.",
      sections: [
        {
          heading: "Core Positioning That Wins Realtors",
          content: `<ul class="space-y-2">
            <li><strong>Speed + Certainty > Rate</strong> — The agent who can get a buyer approved in hours and close on time wins more deals than the one with the lowest rate.</li>
            <li><strong>Make Them the Hero</strong> — Public credit, co-branded assets, and “your buyer got the house because of your agent” stories.</li>
            <li><strong>Reduce Their Liability & Stress</strong> — Call them first when issues arise. Never let them be surprised by a client.</li>
          </ul>`
        },
        {
          heading: "High-Impact Outreach Scripts",
          content: `<div class="space-y-6">
            <div class="border-l-4 border-[#00A89D] pl-4">
              <div class="font-semibold mb-1">Cold / Warm Intro (New Agent in Your Farm Area)</div>
              <p class="italic text-sm">"Hi [Name], I’ve noticed you’ve been closing quite a few deals in the [neighborhood] area. I specialize in helping agents win more listings by delivering fast, clean pre-approvals and creative financing solutions that actually get offers accepted. I’d love 15 minutes of your time to learn how I can support your business — completely no pressure."</p>
            </div>
            <div class="border-l-4 border-[#00A89D] pl-4">
              <div class="font-semibold mb-1">Value-First Follow-Up After Meeting</div>
              <p class="italic text-sm">"Hey [Name], really enjoyed our conversation. I put together a one-page ‘Rate Buydown vs. Seller Concessions’ cheat sheet that’s been helping your peers win more negotiations right now. Happy to co-brand it and send it over if it would be useful for your listings."</p>
            </div>
            <div class="border-l-4 border-[#00A89D] pl-4">
              <div class="font-semibold mb-1">Open House Support Offer</div>
              <p class="italic text-sm">"I’m going to be in the area this weekend. If you’re holding an open house, I’d be happy to swing by for 30-45 minutes and run quick pre-approval scenarios on-site for any buyers who look serious. I’ll bring branded materials and stay out of your way unless you want me involved."</p>
            </div>
            <div class="border-l-4 border-[#00A89D] pl-4">
              <div class="font-semibold mb-1">After They Sent a Referral (Thank You + Momentum)</div>
              <p class="italic text-sm">"[Name], thank you for sending [Client] my way. They’re a great fit and we’re moving fast. I sent you a quick video update on their file this morning. Also — who else on your team or in your sphere might benefit from the same level of communication and speed?"</p>
            </div>
          </div>`
        },
        {
          heading: "Ongoing Nurturing & Value Cadence (The Real Money)",
          content: `<ul class="space-y-2">
            <li><strong>Weekly:</strong> 60-90 second video or text: “Rate & Inventory Snapshot for your top 3 zip codes”</li>
            <li><strong>Bi-weekly:</strong> Co-branded buyer guide, checklist, or market report they can send to their sphere</li>
            <li><strong>Monthly:</strong> Personal text or call + one public win shoutout tagging them</li>
            <li><strong>Quarterly:</strong> Lunch/coffee or pop-by with something useful (branded signage, folders, treats for their team)</li>
            <li><strong>Always:</strong> Immediate notification on any file issues + solution before they hear it from the client</li>
          </ul>`
        },
        {
          heading: "Common Realtor Objections + Winning Responses",
          content: `<div class="space-y-5">
            <div><strong>“I already have a lender I like.”</strong><br><span class="text-sm">"Totally understand. Most of the agents I work best with have 2-3 lenders they trust for different situations. I’d love to be the one you call when speed, communication, or creative financing is the difference between winning and losing the deal."</span></div>
            <div><strong>“Your rates aren’t the lowest right now.”</strong><br><span class="text-sm">"Rates definitely matter, but in this market the difference between an accepted offer and a lost deal is often 24-48 hours of certainty. I focus on making your buyer’s offer the strongest on the table — fast pre-approvals, strong communication with the listing side, and problem-solving when issues come up."</span></div>
            <div><strong>“I don’t want to change lenders mid-transaction.”</strong><br><span class="text-sm">"Smart. I’m not asking you to switch anyone mid-deal. I’m asking for the next buyer who is still shopping. Let me prove the difference on one file and we can go from there."</span></div>
          </div>`
        },
        {
          heading: "60-Day New Realtor Onboarding Sequence",
          content: `<ol class="list-decimal pl-5 space-y-2 text-sm">
            <li><strong>Day 1-2:</strong> Personal intro text + offer to run scenarios on any active listings they have right now.</li>
            <li><strong>Day 7:</strong> Send a high-value, co-brandable neighborhood market snapshot for one of their key areas.</li>
            <li><strong>Day 14:</strong> Coffee or lunch. Goal: Learn their business model and biggest frustrations.</li>
            <li><strong>Day 21:</strong> Co-branded piece of content + concrete offer to co-host an open house or buyer seminar.</li>
            <li><strong>Day 30:</strong> Check-in call: “How can I make working with me easier and more valuable for you?”</li>
            <li><strong>Day 45:</strong> First public win shoutout (even a small one) tagging them.</li>
            <li><strong>Day 60:</strong> Review the relationship and ask for their honest feedback + one introduction to another agent they respect.</li>
          </ol>`
        },
        {
          heading: "Advanced Co-Marketing & Collaboration Plays",
          content: `<ul class="space-y-2">
            <li>Joint “Rate Buydown Strategy” lunch & learn (you bring the financing expertise, they bring the buyers)</li>
            <li>Co-branded quarterly market report they can send to their entire database</li>
            <li>Instagram / Facebook Live “Q&A for First-Time Buyers” together</li>
            <li>Shared open house branding package (signage, flyers, branded water bottles)</li>
            <li>Offer to run comps and financing scenarios for their listing presentations</li>
          </ul>`
        },
        {
          heading: "Social Media & Personal Brand Collaboration",
          content: `<ul class="space-y-2">
            <li>Monthly “Client Win” Reel featuring the agent (with their permission)</li>
            <li>Tag them in every relevant market update you post</li>
            <li>Collaborate on “Day in the Life” or “Behind the Scenes” content</li>
            <li>Let them use your content in their marketing (make it stupidly easy)</li>
            <li>Co-create short educational videos they can repurpose</li>
          </ul>`
        },
        {
          heading: "How to Ask for Referrals Professionally",
          content: `<div class="space-y-4">
            <div><strong>After a Smooth Closing:</strong><br><span class="italic">"[Name], this one went really well. I’m grateful you trusted me with your client. If you have any other buyers or sellers who would appreciate this same level of communication and speed, I’d be honored to help them too."</span></div>
            <div><strong>Quarterly Relationship Check-In:</strong><br><span class="italic">"Hey [Name], I was thinking about you this week. How’s your pipeline looking? Is there anything I can do to help you hit your numbers this quarter — even if it’s just running scenarios or helping with financing questions on listings?"</span></div>
          </div>`
        },
        {
          heading: "Handling Lost Deals & Rebuilding Trust",
          content: `<div><strong>When a Deal Falls Apart:</strong><br><span class="text-sm">Call the agent the same day. Take ownership where appropriate, explain what happened transparently, and offer specific ideas for how you’ll handle similar situations better in the future. Then follow up in 7-10 days with value (not an ask).</span></div>`
        },
        {
          heading: "90-Day Nurturing Calendar (Copy-Paste Ready)",
          content: `<div class="text-sm space-y-3">
            <p><strong>Month 1:</strong> 4 value touches + 1 in-person (focus on learning their business).</p>
            <p><strong>Month 2:</strong> 3 value touches + 1 co-branded asset + public shoutout.</p>
            <p><strong>Month 3:</strong> 2 value touches + 1 personal ask for feedback + 1 introduction request.</p>
            <p class="italic">Repeat and adjust based on their response level.</p>
          </div>`
        },
        {
          heading: "How to Become Their 'Go-To' Lender",
          content: `<ul class="space-y-2 text-sm">
            <li>Always answer their calls/texts within 1 business hour during business days.</li>
            <li>Send them a monthly "Top 3 Things I'm Seeing in the Market" email they can forward.</li>
            <li>Offer to review their current listings for financing angles they can use in negotiations.</li>
            <li>Never make them chase you for status updates.</li>
          </ul>`
        },
        {
          heading: "Scripts for When They Need You Most",
          content: `<div class="space-y-4 text-sm">
            <div><strong>When they're stressed about a tough buyer:</strong><br><span class="italic">"Send me the file. I'll personally walk it through underwriting and give you a realistic timeline by end of day."</span></div>
            <div><strong>When a listing is sitting:</strong><br><span class="italic">"Want me to put together financing options that could help a buyer get creative on your listing? I can have it to you by tomorrow."</span></div>
          </div>`
        }
      ]
    },

    Builders: {
      title: "Builders – New Construction & Preferred Lender Status",
      intro: "Builders care about velocity and predictability. They want buyers who can actually close on time and a lender who makes their sales team look good. Preferred lender status is extremely high-ROI when earned.",
      sections: [
        {
          heading: "What Builders Actually Care About",
          content: `<ul class="space-y-2">
            <li>Fast, reliable pre-approvals so their sales team can write contracts confidently</li>
            <li>Clear communication on construction-to-permanent and one-time close loans</li>
            <li>Help educating their sales team on current financing options (buydowns, rate locks during construction, etc.)</li>
            <li>Low fall-through rate on the buyers they send you</li>
          </ul>`
        },
        {
          heading: "Winning Outreach Angles",
          content: `<ul class="space-y-2">
            <li>“I help your sales team convert more traffic by getting buyers pre-approved the same day they visit the model home.”</li>
            <li>Offer to run regular training sessions for their sales team on current programs.</li>
            <li>Propose joint marketing at the model home (branded materials, on-site pre-approval station).</li>
          </ul>`
        },
        {
          heading: "High-Value Scripts & Emails",
          content: `<div class="space-y-4">
            <div><strong>Builder Sales Manager Intro:</strong><br><span class="italic">"I work with several builders in the area as a preferred lender. My team specializes in getting your buyers approved quickly and keeping everyone updated through the construction process so there are no surprises at closing. I’d love to show you how we can reduce your fall-through rate."</span></div>
          </div>`
        },
        {
          heading: "Nurturing & Relationship Builders",
          content: `<ul class="space-y-2">
            <li>Regular model home pop-bys with treats for the sales team</li>
            <li>Co-branded “New Construction Financing Guide” they can give every visitor</li>
            <li>Quarterly training lunch for their entire sales staff</li>
            <li>Immediate updates whenever one of their buyers hits a milestone</li>
          </ul>`
        },
        {
          heading: "Objections Specific to Builders",
          content: `<div><strong>“We already have a preferred lender.”</strong><br><span class="text-sm">"Completely fair. Many builders work with 2-3 lenders so their buyers have options. I’d love to earn a spot on that list by proving we can help more of your buyers actually close."</span></div>`
        },
        {
          heading: "Construction-to-Permanent Loan Play",
          content: `<ul class="space-y-2">
            <li>Become the expert on one-time close loans — many builders' sales teams are not comfortable explaining them.</li>
            <li>Offer to create a simple one-pager comparing construction-to-permanent vs traditional two-loan process.</li>
            <li>Be available for same-day calls when a buyer is in the model home and has questions about financing during construction.</li>
          </ul>`
        }
      ]
    },

    "Financial Planners": {
      title: "Financial Planners & CPAs – High-Net-Worth Referrals",
      intro: "These partners send fewer but higher-quality clients. They value professionalism, education, and alignment with wealth planning goals.",
      sections: [
        {
          heading: "Positioning That Works",
          content: `<ul class="space-y-2">
            <li>Position yourself as the mortgage strategist who understands net worth impact, not just monthly payment.</li>
            <li>Emphasize tax implications, equity strategies, and timing around life events.</li>
            <li>Never be salesy — they hate it.</li>
          </ul>`
        },
        {
          heading: "Best Outreach & Collaboration",
          content: `<ul class="space-y-2">
            <li>Joint workshops: “Homeownership as a Wealth-Building Tool” or “Refinancing vs. Investing the Equity”</li>
            <li>Offer to review mortgage strategies for their high-net-worth clients (no strings)</li>
            <li>Cross-referral agreements that feel professional and reciprocal</li>
          </ul>`
        },
        {
          heading: "Scripts & Value Language",
          content: `<div><strong>Approach Script:</strong><br><span class="italic">"I work with several planners and CPAs helping their clients make smart mortgage decisions that align with their overall financial plan. I’d love to understand how you advise clients around real estate and see if there are ways I can support your clients without ever getting in the way of your relationship."</span></div>`
        },
        {
          heading: "Nurturing Ideas",
          content: `<ul class="space-y-2">
            <li>Quarterly market/equity update they can forward to clients</li>
            <li>Invite them to speak at your client events (makes them look good)</li>
            <li>Send them articles or strategies relevant to their client base</li>
          </ul>`
        },
        {
          heading: "Key Objection Handling",
          content: `<div><strong>“I don’t want to refer my clients to someone who will just sell them a loan.”</strong><br><span class="text-sm">"I completely respect that. My goal is to be the person you trust to have the same fiduciary mindset you do. I’m happy to start by reviewing a couple of your clients’ situations with zero expectation of business."</span></div>`
        },
        {
          heading: "Equity & Wealth Strategy Collaboration",
          content: `<ul class="space-y-2">
            <li>Offer to run “mortgage as a wealth tool” reviews for their clients (cash-out refi vs HELOC vs selling, etc.)</li>
            <li>Send them quarterly equity market updates they can use in client meetings</li>
            <li>Co-host virtual workshops on “Using Home Equity Strategically in Retirement”</li>
          </ul>`
        }
      ]
    },

    Attorneys: {
      title: "Attorneys – Divorce, Probate, Estate & Real Estate",
      intro: "These relationships are built on trust, speed, discretion, and zero surprises. Attorneys remember the lender who made a difficult transaction smoother for their client.",
      sections: [
        {
          heading: "What Attorneys Value Most",
          content: `<ul class="space-y-2">
            <li>Extremely clean communication and documentation</li>
            <li>Speed without sacrificing accuracy</li>
            <li>Never blindsiding them or their client with bad news</li>
            <li>Professionalism during emotionally charged transactions</li>
          </ul>`
        },
        {
          heading: "Winning Outreach",
          content: `<ul class="space-y-2">
            <li>Offer to speak at firm CLE or lunch meetings on current real estate financing trends</li>
            <li>Position as the lender who understands complex title and timing issues in divorce/probate</li>
            <li>Emphasize your ability to move quickly when a closing date is court-ordered or time-sensitive</li>
          </ul>`
        },
        {
          heading: "Communication Protocol They Love",
          content: `<ul class="space-y-2">
            <li>Day 1: Intro email to the attorney (not just the client) with clear timeline and your direct contact</li>
            <li>Weekly status updates every Thursday (even if nothing changed)</li>
            <li>Immediate phone call on any issue — never let them find out from their client first</li>
            <li>Post-closing thank you + summary they can use for their own records</li>
          </ul>`
        },
        {
          heading: "Key Scripts",
          content: `<div><strong>Divorce Attorney Approach:</strong><br><span class="italic">"I work with several family law attorneys on divorce-related refinances and purchases. I understand the sensitivity and tight timelines involved. I’d be happy to be a resource when your clients need fast, clean mortgage solutions."</span></div>`
        },
        {
          heading: "Nurturing & Referrals",
          content: `Send them quarterly “Real Estate & Financing Update for Attorneys” emails. Offer to review financing implications on complex estate or divorce cases pro bono (builds massive goodwill).`
        },
        {
          heading: "Time-Sensitive Transaction Support",
          content: `<ul class="space-y-2">
            <li>Have a dedicated fast-track process for court-ordered or time-sensitive closings (divorce, probate, relocation)</li>
            <li>Offer weekend/holiday availability when a closing date is court-mandated</li>
            <li>Provide clear, written timelines the attorney can share with their client and opposing counsel</li>
          </ul>`
        }
      ]
    },

    "Insurance Agents": {
      title: "Insurance Agents – Bundling & Relationship Loops",
      intro: "Insurance agents have frequent, trusted contact with homeowners. Creating easy, natural handoff processes turns them into a steady referral source.",
      sections: [
        {
          heading: "Natural Connection Points",
          content: `<ul class="space-y-2">
            <li>New home purchase → homeowners insurance</li>
            <li>Refinance with cash-out → review coverage</li>
            <li>Life events (marriage, new baby, etc.)</li>
          </ul>`
        },
        {
          heading: "Best Collaboration Tactics",
          content: `<ul class="space-y-2">
            <li>Joint client appreciation events (especially around homeownership milestones)</li>
            <li>Easy, professional referral handoff process (shared form or quick intro call)</li>
            <li>Co-branded homeowner resources (“What to Know in Your First Year of Homeownership”)</li>
            <li>Refer homeowners insurance needs back to them after every closing</li>
          </ul>`
        },
        {
          heading: "Scripts",
          content: `<div><strong>Insurance Agent Approach:</strong><br><span class="italic">"I close a lot of loans for clients who also need homeowners or auto insurance. I’d love to create an easy process where we can refer clients to each other cleanly. I always send my closings back to the agent who referred the insurance side."</span></div>`
        },
        {
          heading: "Nurturing Cadence",
          content: `Quarterly lunch, joint client events twice a year, and immediate referral back on every closing. Make it stupidly easy for them to send you business.`
        },
        {
          heading: "Objections",
          content: `<div><strong>“I already refer to another lender.”</strong><br><span class="text-sm">"Totally fair. I’m not asking you to stop working with anyone. I’m asking to be one of the lenders you feel good about referring when your client needs fast communication and a smooth experience."</span></div>`
        },
        {
          heading: "Creating Natural Handoff Loops",
          content: `<ul class="space-y-2">
            <li>After every closing, immediately refer the client back for homeowners + auto review</li>
            <li>Create a simple shared referral form both of you can use</li>
            <li>Host joint “New Homeowner” events twice a year (great for both of your databases)</li>
          </ul>`
        }
      ]
    },

    Other: {
      title: "Other Professionals (HR, Relocation, Title, etc.)",
      intro: "These sources can be extremely valuable but require more customized approaches. The principles remain the same: understand their world, give massive value first, and make referrals frictionless.",
      sections: [
        {
          heading: "HR Directors & Relocation Companies",
          content: `<ul class="space-y-2">
            <li>Position as the lender who can move fast for corporate relocations and executive packages</li>
            <li>Offer to create customized pre-approval packets for their relocating employees</li>
            <li>Provide regular market updates for the cities they move people into/out of</li>
          </ul>`
        },
        {
          heading: "Title Companies & Escrow Officers",
          content: `<ul class="space-y-2">
            <li>Build relationships through consistent, professional communication on files</li>
            <li>Offer joint educational events for realtors</li>
            <li>Be the lender who responds quickly to title questions and conditions</li>
          </ul>`
        },
        {
          heading: "General Framework for Any New Source",
          content: `Identify what keeps them up at night or creates friction for them, then become the person who removes that friction for their clients or business. Give before you ask — always.`
        },
        {
          heading: "Quick Outreach Template",
          content: `<p class="italic">"I’ve been working with several [their profession] professionals helping their clients with smooth mortgage experiences. I’d love 15 minutes to understand the challenges you see most often and see if there are ways I can support the people you work with."</p>`
        }
      ]
    }
  };

  window.openReferralModal = function openReferralModal(type) {
    const modal = document.getElementById('referral-modal');
    const titleEl = document.getElementById('referral-modal-title');
    const contentEl = document.getElementById('referral-content');

    if (!modal || !titleEl || !contentEl) {
      console.error('Referral modal elements missing');
      return;
    }

    const playbook = PARTNER_PLAYBOOKS[type] || PARTNER_PLAYBOOKS['Other'];

    titleEl.textContent = playbook.title;

    let html = `
      <div class="mb-6">
        <p class="text-lg text-gray-600 dark:text-gray-400">${playbook.intro}</p>
      </div>
    `;

    playbook.sections.forEach((section, idx) => {
      html += `
        <div class="mb-8 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 bg-white dark:bg-gray-800">
          <div class="flex items-start justify-between gap-4 mb-3">
            <h4 class="text-xl font-bold text-[#002B5C] dark:text-white">${section.heading}</h4>
            <button onclick="savePartnerStrategy('${type}', ${idx}, this)"
                    class="flex-shrink-0 text-sm px-3.5 py-1.5 rounded-2xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition flex items-center gap-1.5">
              <i class="far fa-bookmark"></i> <span>Save</span>
            </button>
          </div>
          <div class="prose dark:prose-invert text-[15px] leading-relaxed max-w-none">
            ${section.content}
          </div>
        </div>
      `;
    });

    contentEl.innerHTML = html;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  };

  window.closeReferralModal = function closeReferralModal() {
    const modal = document.getElementById('referral-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  };

  // Allow closing the referral modal by clicking on the backdrop (outside the content)
  document.addEventListener('DOMContentLoaded', function() {
    const referralModal = document.getElementById('referral-modal');
    if (referralModal) {
      referralModal.addEventListener('click', function(e) {
        if (e.target === referralModal) {
          closeReferralModal();
        }
      });
    }
  });

  // =====================================================
  // TIER-SPECIFIC RICH PLAYBOOKS (New Modals)
  // =====================================================
  const TIER_PLAYBOOKS = {
    'A+': {
      title: "A+ Partner Mastery Playbook",
      content: `
        <p class="mb-6 text-gray-600 dark:text-gray-400">These are your top 10–20 partners. They deserve (and expect) white-glove treatment. Treat them like important clients.</p>
        
        <div class="mb-8">
          <h4 class="font-bold mb-2">Weekly Cadence</h4>
          <ul class="list-disc pl-5 space-y-1">
            <li>One personal text or short call (not just "how’s business" — ask about something specific in their life or business).</li>
            <li>One high-value digital touch (market video, co-branded asset, or relevant introduction).</li>
          </ul>
        </div>

        <div class="mb-8">
          <h4 class="font-bold mb-2">Monthly Rituals</h4>
          <ul class="list-disc pl-5 space-y-1">
            <li>In-person lunch or coffee (relationship first, business second).</li>
            <li>Public win shoutout on social (tag them generously).</li>
            <li>Send something useful for their business or team.</li>
          </ul>
        </div>

        <div class="mb-8">
          <h4 class="font-bold mb-2">Quarterly Deep Work</h4>
          <ul class="list-disc pl-5 space-y-1">
            <li>Formal business review: "What’s working? What can I improve?"</li>
            <li>Co-branded marketing asset or joint event planning.</li>
            <li>Thoughtful, compliant gift (something they’ll actually use or display).</li>
          </ul>
        </div>

        <div>
          <h4 class="font-bold mb-2">Key Scripts for A+ Partners</h4>
          <p class="italic text-sm mb-2">"I was thinking about you this week — how are things going with [specific thing they mentioned last time]?"</p>
          <p class="italic text-sm">"I have a buyer who would be perfect for one of your listings. Can I run a quick scenario for you before I present it?"</p>
        </div>
      `
    },
    'B': {
      title: "B Partner Growth Playbook",
      content: `
        <p class="mb-6 text-gray-600 dark:text-gray-400">These partners are sending 1–4 referrals per year. Your goal is to move as many as possible into A+ territory over the next 12–18 months.</p>
        
        <div class="mb-8">
          <h4 class="font-bold mb-2">Bi-Weekly Value + Quarterly Personal</h4>
          <ul class="list-disc pl-5 space-y-1">
            <li>Consistent automated + semi-personal value (market updates, co-branded tools).</li>
            <li>One dedicated personal check-in per quarter (call or coffee).</li>
          </ul>
        </div>

        <div class="mb-8">
          <h4 class="font-bold mb-2">Conversion Tactics</h4>
          <ul class="list-disc pl-5 space-y-1">
            <li>After their 2nd or 3rd referral, do a "thank you + relationship review" lunch.</li>
            <li>Ask: "What would it take for us to work together on more files?"</li>
            <li>Invite them to one exclusive or small-group event per year.</li>
          </ul>
        </div>

        <div>
          <h4 class="font-bold mb-2">Sample Touch Sequence</h4>
          <p class="text-sm">Week 1: Value asset<br>Week 3: Personal text about something relevant to them<br>Week 6: Co-branded tool or introduction<br>Week 12: Personal outreach + light ask for feedback or more business.</p>
        </div>
      `
    },
    'C': {
      title: "C Partner Conversion Playbook",
      content: `
        <p class="mb-6 text-gray-600 dark:text-gray-400">These are new or low-volume partners. Focus on efficient, high-volume value touches while identifying who has real potential to move up.</p>
        
        <div class="mb-8">
          <h4 class="font-bold mb-2">Weekly Automated Value</h4>
          <ul class="list-disc pl-5 space-y-1">
            <li>Market update or useful content (low personal effort, high perceived value).</li>
            <li>Keep it relevant to their geography or niche.</li>
          </ul>
        </div>

        <div class="mb-8">
          <h4 class="font-bold mb-2">Monthly Personal Outreach</h4>
          <ul class="list-disc pl-5 space-y-1">
            <li>One short, personal message (text or LinkedIn) every 4–5 weeks.</li>
            <li>Goal is top-of-mind + relationship building, not immediate asks.</li>
          </ul>
        </div>

        <div>
          <h4 class="font-bold mb-2">Qualification Questions (Use in Conversations)</h4>
          <ul class="list-disc pl-5 space-y-1 text-sm">
            <li>"How many referrals are you looking to send this year?"</li>
            <li>"What frustrates you most about the lenders you currently work with?"</li>
            <li>"Would you be open to me helping with one file so you can see how I communicate?"</li>
          </ul>
        </div>
      `
    }
  };

  window.openTierModal = function openTierModal(tier) {
    try {
      const modal = document.getElementById('referral-modal');
      const titleEl = document.getElementById('referral-modal-title');
      const contentEl = document.getElementById('referral-content');

      if (!modal || !titleEl || !contentEl) {
        console.error('Referral modal elements missing for tier:', tier);
        alert('Modal elements not found. Please refresh the page.');
        return;
      }

      const data = TIER_PLAYBOOKS[tier];
      if (!data) {
        console.error('No tier data for:', tier);
        return;
      }

      titleEl.textContent = data.title;
      contentEl.innerHTML = `
        <div class="prose dark:prose-invert max-w-none text-[15px]">
          ${data.content}
        </div>
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onclick="savePartnerStrategy('Tier-${tier}', 0, this)" 
                  class="text-sm px-4 py-2 rounded-2xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition">
            <i class="far fa-bookmark"></i> Save This Tier Playbook
          </button>
        </div>
      `;

      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    } catch (e) {
      console.error('Error opening tier modal:', e);
      alert('Error opening modal. Check console for details.');
    }
  };

  // =====================================================
  // HIGH IMPACT PLAYS & SEQUENCES (Unique, Focused Modals)
  // =====================================================
  const HIGH_IMPACT_PLAYS = {
    'first-30-days-checklist': {
      title: "First 30 Days with a New Partner Checklist",
      content: `
        <p class="mb-4">A practical, actionable checklist for the critical first month with any new referral partner.</p>
        
        <div class="space-y-4">
          <div>
            <strong class="block mb-1">Week 1: Foundation</strong>
            <ul class="list-disc pl-5 text-sm space-y-1">
              <li>Send personalized welcome email + your contact info</li>
              <li>Add them to your CRM with proper tags (Partner Type + Tier)</li>
              <li>Add them to your main email/newsletter list (if appropriate)</li>
              <li>Send first value touch (market update or useful resource)</li>
            </ul>
          </div>
          <div>
            <strong class="block mb-1">Week 2: Relationship Building</strong>
            <ul class="list-disc pl-5 text-sm space-y-1">
              <li>Personal text or call (learn about their business/goals)</li>
              <li>Offer to run scenarios on any current listings/opportunities</li>
              <li>Send second value touch (co-branded asset or introduction)</li>
            </ul>
          </div>
          <div>
            <strong class="block mb-1">Week 3-4: Momentum</strong>
            <ul class="list-disc pl-5 text-sm space-y-1">
              <li>Public social shoutout (tag them)</li>
              <li>Offer to co-host something (open house, lunch & learn, etc.)</li>
              <li>Send third value touch</li>
              <li>Light ask: “What can I do to support you right now?”</li>
            </ul>
          </div>
        </div>
        <div class="mt-4">
          <button onclick="savePartnerStrategy('First30Days', 0, this)" class="text-sm px-3 py-1 rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Save This Checklist</button>
        </div>
      `
    },

    'referral-objections': {
      title: "Referral Partner Objection Playbook",
      content: `
        <p class="mb-4">Strong, natural responses to the most common objections you’ll hear from partners.</p>
        
        <div class="space-y-5">
          <div><strong>“I already have a lender I like.”</strong><br>
          <span class="text-sm italic">"Totally fair. Most of the agents I work best with have 2–3 lenders they trust for different situations. I’d love to be the one you call when speed, communication, or creative financing is the difference between winning and losing the deal."</span></div>
          
          <div><strong>“Your rates aren’t the lowest.”</strong><br>
          <span class="text-sm italic">"Rates matter, but in this market the difference between an accepted offer and a lost deal is often 24–48 hours of certainty. I focus on making your buyer’s offer the strongest on the table."</span></div>
          
          <div><strong>“I don’t want to change mid-transaction.”</strong><br>
          <span class="text-sm italic">"Smart. I’m not asking you to switch anyone mid-deal. I’m asking for the next buyer who is still shopping. Let me prove the difference on one file."</span></div>
          
          <div><strong>“I only refer when I get something back.”</strong><br>
          <span class="text-sm italic">"Fair. I believe the best relationships are reciprocal. I’m happy to send you buyers who need a great realtor whenever it makes sense."</span></div>
        </div>
        <div class="mt-4">
          <button onclick="savePartnerStrategy('Objections', 0, this)" class="text-sm px-3 py-1 rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Save Objection Playbook</button>
        </div>
      `
    },

    'relationship-management': {
      title: "Relationship Management & Asking for More Business",
      content: `
        <p class="mb-4">How to maintain strong partnerships and professionally ask for more referrals without being pushy.</p>
        
        <div class="space-y-5">
          <div>
            <strong>Best Question to Ask for More Business:</strong><br>
            <span class="text-base italic">"What can I do to earn more of your business?"</span>
            <p class="text-sm mt-1">This question is powerful because it puts the focus on them and what they need, rather than on you asking for favors.</p>
          </div>
          
          <div>
            <strong>Healthy Relationship Habits:</strong>
            <ul class="list-disc pl-5 text-sm space-y-1 mt-2">
              <li>Regularly ask “How can I make working with me easier for you?”</li>
              <li>Celebrate their wins publicly (social, events, etc.)</li>
              <li>Be the first to call when something goes wrong on a file</li>
              <li>Send value even when you don’t need anything</li>
            </ul>
          </div>
        </div>
        <div class="mt-4">
          <button onclick="savePartnerStrategy('RelationshipManagement', 0, this)" class="text-sm px-3 py-1 rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Save This Guidance</button>
        </div>
      `
    },

    'co-marketing-assets': {
      title: "Co-Marketing Asset Ideas (Light Library)",
      content: `
        <p class="mb-4">Ready-to-create co-marketing ideas you can offer partners.</p>
        
        <div class="space-y-4">
          <div><strong>Buyer Guides & Checklists</strong> — Co-branded “First-Time Buyer Guide” or “Rate Buydown Explainer” they can send to their sphere.</div>
          <div><strong>Monthly Market Snapshot</strong> — One-page PDF with rates + inventory for their main zip codes (easy to brand with their logo).</div>
          <div><strong>Open House Toolkit</strong> — Branded signage, flyers, and a “Pre-Approval Station” one-pager.</div>
          <div><strong>Social Content Packs</strong> — 4–5 carousel posts or Reels they can repost with minimal editing.</div>
          <div><strong>Joint Event Ideas</strong> — Lunch & Learn topics, happy hours, or first-time buyer seminars with suggested titles and formats.</div>
        </div>
        <div class="mt-4">
          <button onclick="savePartnerStrategy('CoMarketingAssets', 0, this)" class="text-sm px-3 py-1 rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Save Asset Ideas</button>
        </div>
      `
    },

    '60-day-realtor-onboarding': {
      title: "60-Day Realtor Onboarding Sequence",
      content: `
        <p class="mb-4">A proven step-by-step system to turn a brand new realtor relationship into a consistent referral source within 60 days.</p>
        <div class="space-y-4">
          <div class="border-l-4 border-[#00A89D] pl-4"><strong>Days 1-2:</strong> Personal intro + offer to run scenarios on their current listings.</div>
          <div class="border-l-4 border-[#00A89D] pl-4"><strong>Day 7:</strong> Send a high-value co-brandable neighborhood market snapshot.</div>
          <div class="border-l-4 border-[#00A89D] pl-4"><strong>Day 14:</strong> Coffee/lunch – learn their business and pain points.</div>
          <div class="border-l-4 border-[#00A89D] pl-4"><strong>Day 21:</strong> Deliver one co-branded asset + offer to co-host an open house.</div>
          <div class="border-l-4 border-[#00A89D] pl-4"><strong>Day 30:</strong> Relationship review call: “How can I make this easier for you?”</div>
          <div class="border-l-4 border-[#00A89D] pl-4"><strong>Day 45:</strong> First public win shoutout tagging them.</div>
          <div class="border-l-4 border-[#00A89D] pl-4"><strong>Day 60:</strong> Formal feedback request + ask for one introduction.</div>
        </div>
        <div class="mt-6">
          <button onclick="savePartnerStrategy('HighImpact-60Day', 0, this)" class="text-sm px-3 py-1 rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Save This Sequence</button>
        </div>
      `
    },
    'weekly-value-cadence': {
      title: "Weekly Value Cadence for Partners",
      content: `
        <p class="mb-4">The repeatable system top producers use to stay top-of-mind with any partner type without feeling salesy.</p>
        <div class="space-y-3 text-sm">
          <div><strong>Week 1:</strong> Short market video or text update tailored to their area.</div>
          <div><strong>Week 2:</strong> Co-branded buyer guide or checklist.</div>
          <div><strong>Week 3:</strong> Personal text about something relevant in their life/business.</div>
          <div><strong>Week 4:</strong> Valuable introduction or resource (no ask).</div>
          <div><strong>Week 5-6:</strong> Repeat high-value digital touch.</div>
          <div><strong>Week 7:</strong> Light personal outreach.</div>
          <div><strong>Week 8:</strong> Public shoutout or co-branded content.</div>
        </div>
        <p class="mt-3 text-xs italic">Rotate and personalize. Never more than 20% ask-oriented.</p>
        <div class="mt-4">
          <button onclick="savePartnerStrategy('HighImpact-Cadence', 0, this)" class="text-sm px-3 py-1 rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Save This Cadence</button>
        </div>
      `
    },
    'open-house-domination': {
      title: "Open House Domination Play",
      content: `
        <p class="mb-4">Turn every open house into a dual win: buyer leads + new realtor relationships.</p>
        <div class="space-y-3">
          <div><strong>Before:</strong> Offer the agent on-site pre-approval support + bring branded materials.</div>
          <div><strong>During:</strong> Run quick scenarios for serious buyers. Collect contact info compliantly.</div>
          <div><strong>After:</strong> Send the agent a thank-you + summary of buyers you met + next steps.</div>
          <div><strong>Follow-up:</strong> Within 48 hours offer to co-host their next open house or create a joint buyer event.</div>
        </div>
        <div class="mt-4">
          <button onclick="savePartnerStrategy('HighImpact-OpenHouse', 0, this)" class="text-sm px-3 py-1 rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Save This Play</button>
        </div>
      `
    },
    'realtor-to-5-more': {
      title: "Turning One Strong Realtor Into 5 More",
      content: `
        <p class="mb-4">The network effect strategy: leverage your best relationships to grow your referral partner base exponentially.</p>
        <ol class="list-decimal pl-5 space-y-2 text-sm">
          <li>After 3+ successful files, ask: “Who’s one agent you respect that I should meet?”</li>
          <li>Get a warm introduction or at minimum their name + why they’d be a good fit.</li>
          <li>Reach out within 48 hours referencing the mutual connection.</li>
          <li>Once the new agent sends one file, repeat the process with them.</li>
          <li>Publicly thank the original agent for the introduction (social proof loop).</li>
        </ol>
        <div class="mt-4">
          <button onclick="savePartnerStrategy('HighImpact-NetworkEffect', 0, this)" class="text-sm px-3 py-1 rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Save This Strategy</button>
        </div>
      `
    },
    'builder-training': {
      title: "Builder Sales Team Training Sequence",
      content: `
        <p class="mb-4">Become the preferred lender by making the entire sales team smarter and more confident.</p>
        <div class="space-y-3 text-sm">
          <div><strong>Step 1:</strong> Offer a 20-30 min “Current Financing Options” lunch & learn at the model home.</div>
          <div><strong>Step 2:</strong> Create a simple one-pager they can hand every visitor.</div>
          <div><strong>Step 3:</strong> Be available for same-day scenario help on active traffic.</div>
          <div><strong>Step 4:</strong> Quarterly refresher sessions + new program updates.</div>
        </div>
        <div class="mt-4">
          <button onclick="savePartnerStrategy('HighImpact-BuilderTraining', 0, this)" class="text-sm px-3 py-1 rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Save This Sequence</button>
        </div>
      `
    },
    'professional-referral-request': {
      title: "Professional Partner Referral Request",
      content: `
        <p class="mb-4">Professional, low-pressure language for attorneys, planners, and insurance agents.</p>
        <div class="space-y-4 text-sm">
          <div><strong>After a successful closing:</strong><br><span class="italic">"Thank you for the introduction. The closing went smoothly. If you have other clients who would benefit from the same level of communication and speed, I’d be grateful for the opportunity."</span></div>
          <div><strong>Quarterly check-in:</strong><br><span class="italic">"I was thinking about the work we did together earlier this year. Is there anything I can do to support your clients or your practice right now?"</span></div>
        </div>
        <div class="mt-4">
          <button onclick="savePartnerStrategy('HighImpact-ProfessionalAsk', 0, this)" class="text-sm px-3 py-1 rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white">Save These Scripts</button>
        </div>
      `
    }
  };

  window.openHighImpactPlay = function openHighImpactPlay(key) {
    const modal = document.getElementById('referral-modal');
    const titleEl = document.getElementById('referral-modal-title');
    const contentEl = document.getElementById('referral-content');

    if (!modal || !titleEl || !contentEl) return;

    const play = HIGH_IMPACT_PLAYS[key];
    if (!play) {
      console.error('High impact play not found:', key);
      return;
    }

    titleEl.textContent = play.title;
    contentEl.innerHTML = `
      <div class="prose dark:prose-invert max-w-none">
        ${play.content}
      </div>
    `;

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  };

  // =====================================================
  // BOOK VAULT - Modern Interactive Book Recommendations
  // =====================================================
  const BOOKS_DATA = [
    // Sales & Negotiation
    { id: "book-001", title: "Never Split the Difference", author: "Chris Voss", category: "Sales & Negotiation", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "FBI hostage negotiator tactics that work incredibly well on rate objections, tough clients, and contract negotiations.", keyTakeaway: "Tactical empathy and calibrated questions beat traditional hard bargaining.", amazonLink: "https://www.amazon.com/Never-Split-Difference-Negotiating-Depended/dp/0062407805" },
    { id: "book-002", title: "The Challenger Sale", author: "Matthew Dixon & Brent Adamson", category: "Sales & Negotiation", level: "Intermediate", readTime: "7-9 hrs", whyUseful: "Research-backed approach to selling that teaches you how to challenge and educate clients instead of just building relationships.", keyTakeaway: "The best salespeople teach their customers something new.", amazonLink: "https://www.amazon.com/Challenger-Sale-Control-Conversation-Selling/dp/1591844355" },
    { id: "book-003", title: "To Sell Is Human", author: "Daniel H. Pink", category: "Sales & Negotiation", level: "Beginner", readTime: "5-7 hrs", whyUseful: "Modern take on sales in a world where everyone is selling (including loan officers constantly selling themselves and their process).", keyTakeaway: "Attunement, buoyancy, and clarity are the new core skills of selling.", amazonLink: "https://www.amazon.com/Sell-Human-Surprising-Truth-Persuading/dp/1594634114" },
    { id: "book-004", title: "Ninja Selling", author: "Larry Kendall", category: "Sales & Negotiation", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "Highly practical system specifically for real estate professionals. Many top LOs credit this book with transforming how they work with agents and clients.", keyTakeaway: "Focus on the relationship and the transaction takes care of itself.", amazonLink: "https://www.amazon.com/Ninja-Selling-Subtle-Skills-Results/dp/1626342849" },

    // Prospecting & Lead Generation
    { id: "book-005", title: "Fanatical Prospecting", author: "Jeb Blount", category: "Prospecting & Lead Generation", level: "Intermediate", readTime: "7-9 hrs", whyUseful: "The gold standard for consistent prospecting. Essential reading for any loan officer who wants to control their pipeline instead of hoping for referrals.", keyTakeaway: "Prospecting is a numbers game fueled by discipline and the right activity mix.", amazonLink: "https://www.amazon.com/Fanatical-Prospecting-Conversations-Leveraging-Telephone/dp/1119144752" },
    { id: "book-006", title: "New Sales. Simplified.", author: "Mike Weinberg", category: "Prospecting & Lead Generation", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "Extremely practical playbook for building a sales pipeline from scratch. Great for LOs who need a system for consistent outreach.", keyTakeaway: "Simple disciplines beat complex strategies every time.", amazonLink: "https://www.amazon.com/New-Sales-Simplified-Prospecting-Development/dp/0814431771" },
    { id: "book-007", title: "Crushing Call Reluctance for Loan Officers", author: "Carl White", category: "Prospecting & Lead Generation", level: "Beginner", readTime: "4-6 hrs", whyUseful: "LO-specific help for overcoming the fear of picking up the phone. Very tactical and encouraging.", keyTakeaway: "Call reluctance is a skill issue, not a character flaw.", amazonLink: "https://www.amazon.com/Crushing-Call-Reluctance-Loan-Officers-White/dp/B07Z8G5Y3G" },

    // Mindset & Performance
    { id: "book-008", title: "Atomic Habits", author: "James Clear", category: "Mindset & Performance", level: "Beginner", readTime: "6-8 hrs", whyUseful: "The best modern book on building systems that actually stick. Directly applicable to daily prospecting, follow-up, and content habits.", keyTakeaway: "You do not rise to the level of your goals. You fall to the level of your systems.", amazonLink: "https://www.amazon.com/Atomic-Habits-Proven-Build-Break/dp/0735211299" },
    { id: "book-009", title: "The Psychology of Money", author: "Morgan Housel", category: "Mindset & Performance", level: "Beginner", readTime: "5-7 hrs", whyUseful: "Brilliant insights into how people actually think about money. Helps LOs understand client behavior and their own relationship with income and success.", keyTakeaway: "Your personal experiences with money make up maybe 0.00000001% of what’s happened in the world, but 100% of how you think the world works.", amazonLink: "https://www.amazon.com/Psychology-Money-Timeless-lessons-happiness/dp/0857197681" },
    { id: "book-010", title: "Mindset: The New Psychology of Success", author: "Carol S. Dweck", category: "Mindset & Performance", level: "Beginner", readTime: "7-9 hrs", whyUseful: "Classic on growth vs fixed mindset. Essential for any professional who wants to keep improving instead of protecting their ego.", keyTakeaway: "The view you adopt for yourself profoundly affects the way you lead your life.", amazonLink: "https://www.amazon.com/Mindset-Psychology-Carol-S-Dweck/dp/0345472322" },
    { id: "book-011", title: "The Almanack of Naval Ravikant", author: "Eric Jorgenson", category: "Mindset & Performance", level: "Intermediate", readTime: "5-7 hrs", whyUseful: "Distilled wisdom on happiness, wealth, and decision making from one of the clearest thinkers of our time.", keyTakeaway: "Play long-term games with long-term people.", amazonLink: "https://www.amazon.com/Almanack-Naval-Ravikant-Naval-Ravikant/dp/1544514212" },

    // Networking & Relationships
    { id: "book-012", title: "Never Eat Alone", author: "Keith Ferrazzi", category: "Networking & Relationships", level: "Intermediate", readTime: "8-10 hrs", whyUseful: "The modern bible of relationship-driven success. Extremely relevant for building a powerful referral partner network.", keyTakeaway: "Your network is your net worth — but only if you actually invest in the relationships.", amazonLink: "https://www.amazon.com/Never-Eat-Alone-Expanded-Updated/dp/0385346654" },
    { id: "book-013", title: "The Go-Giver", author: "Bob Burg & John David Mann", category: "Networking & Relationships", level: "Beginner", readTime: "3-4 hrs", whyUseful: "Short, powerful parable about the power of giving value first. Perfect mindset for referral partner development.", keyTakeaway: "Your income is determined by how many people you serve and how well you serve them.", amazonLink: "https://www.amazon.com/Go-Giver-Expanded-Edition-Little-Story/dp/1591848288" },
    { id: "book-014", title: "How to Win Friends and Influence People", author: "Dale Carnegie", category: "Networking & Relationships", level: "Beginner", readTime: "6-8 hrs", whyUseful: "Timeless principles of human relations. Still one of the best books ever written on getting along with people and earning their trust.", keyTakeaway: "You can make more friends in two months by becoming interested in other people than you can in two years by trying to get other people interested in you.", amazonLink: "https://www.amazon.com/How-Win-Friends-Influence-People/dp/0671027034" },

    // Personal Branding & Content
    { id: "book-015", title: "Building a StoryBrand", author: "Donald Miller", category: "Personal Branding & Content", level: "Beginner", readTime: "5-7 hrs", whyUseful: "The best framework for how loan officers should communicate who they are and what they do. Transforms websites, social content, and conversations.", keyTakeaway: "If you confuse, you lose. Make the customer the hero of the story.", amazonLink: "https://www.amazon.com/Building-StoryBrand-Clarify-Message-Customers/dp/0718033329" },
    { id: "book-016", title: "This Is Marketing", author: "Seth Godin", category: "Personal Branding & Content", level: "Intermediate", readTime: "4-6 hrs", whyUseful: "Helps you understand how to create meaningful work that spreads. Excellent for LOs building a personal brand instead of just chasing transactions.", keyTakeaway: "Marketing is the generous act of helping someone solve a problem.", amazonLink: "https://www.amazon.com/This-Marketing-You-Cant-Advertise/dp/0525542795" },

    // Leadership & Team Building
    { id: "book-017", title: "The 21 Irrefutable Laws of Leadership", author: "John C. Maxwell", category: "Leadership & Team Building", level: "Intermediate", readTime: "7-9 hrs", whyUseful: "Foundational leadership principles. Invaluable once you start building a team or want to lead by influence with realtors and partners.", keyTakeaway: "Leadership is influence. Nothing more, nothing less.", amazonLink: "https://www.amazon.com/21-Irrefutable-Laws-Leadership-Anniversary/dp/0785288376" },
    { id: "book-018", title: "Extreme Ownership", author: "Jocko Willink & Leif Babin", category: "Leadership & Team Building", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "Navy SEAL principles applied to business. Brutally honest look at personal accountability — highly relevant for loan officers who want to own their results.", keyTakeaway: "Leaders must own everything in their world.", amazonLink: "https://www.amazon.com/Extreme-Ownership-U-S-Navy-SEALs/dp/1250067057" },

    // Business & Financial Intelligence
    { id: "book-019", title: "Profit First", author: "Mike Michalowicz", category: "Business & Financial Intelligence", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "Transforms how you think about the money in your business. Many LOs run profitable businesses but still feel broke because they don’t manage cash flow properly.", keyTakeaway: "Revenue is vanity. Profit is sanity.", amazonLink: "https://www.amazon.com/Profit-First-Transform-Cash-Eating-ebook/dp/B01H7X8M4A" },
    { id: "book-020", title: "The Richest Man in Babylon", author: "George S. Clason", category: "Business & Financial Intelligence", level: "Beginner", readTime: "4-5 hrs", whyUseful: "Timeless parables on saving, investing, and building wealth. Perfect foundational money mindset for anyone in a high-income profession.", keyTakeaway: "A part of all you earn is yours to keep.", amazonLink: "https://www.amazon.com/Richest-Man-Babylon-George-Clason/dp/0451205367" },

    // AI & Modern Tools
    { id: "book-021", title: "Co-Intelligence: Living and Working with AI", author: "Ethan Mollick", category: "AI & Modern Tools", level: "Beginner", readTime: "5-7 hrs", whyUseful: "The single best book on how to actually use AI in your daily work. Extremely practical for loan officers who want to stay ahead of the curve.", keyTakeaway: "Treat AI as a co-worker, not just a tool.", amazonLink: "https://www.amazon.com/Co-Intelligence-Living-Working-Ethan-Mollick/dp/059371671X" },

    // Additional High-Value Additions
    { id: "book-023", title: "Influence: The Psychology of Persuasion", author: "Robert B. Cialdini", category: "Sales & Negotiation", level: "Intermediate", readTime: "8-10 hrs", whyUseful: "The foundational book on the psychology of influence. Every loan officer should understand the 6 principles of persuasion.", keyTakeaway: "People say yes for reasons they often don't consciously understand.", amazonLink: "https://www.amazon.com/Influence-Psychology-Persuasion-Robert-Cialdini/dp/006124189X" },
    { id: "book-024", title: "The Obstacle Is the Way", author: "Ryan Holiday", category: "Mindset & Performance", level: "Beginner", readTime: "5-7 hrs", whyUseful: "Stoic philosophy applied to modern challenges. Excellent for staying resilient during slow markets or tough objections.", keyTakeaway: "The impediment to action advances action. What stands in the way becomes the way.", amazonLink: "https://www.amazon.com/Obstacle-Way-Timeless-Turning-Triumph/dp/1591846358" },
    { id: "book-025", title: "Grit: The Power of Passion and Perseverance", author: "Angela Duckworth", category: "Mindset & Performance", level: "Beginner", readTime: "7-9 hrs", whyUseful: "Research-backed proof that effort and persistence often beat raw talent. Critical mindset for consistent prospecting and long-term success.", keyTakeaway: "Grit is passion and perseverance for very long-term goals.", amazonLink: "https://www.amazon.com/Grit-Passion-Perseverance-Angela-Duckworth/dp/1501111108" },
    { id: "book-026", title: "Contagious: Why Things Catch On", author: "Jonah Berger", category: "Personal Branding & Content", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "Explains exactly why certain ideas and content spread. Extremely useful for creating social media and referral-worthy content that actually gets shared.", keyTakeaway: "Things catch on when they are remarkable, emotional, or have social currency.", amazonLink: "https://www.amazon.com/Contagious-Things-Catch-Jonah-Berger/dp/1451686579" },
    { id: "book-027", title: "The 5 Dysfunctions of a Team", author: "Patrick Lencioni", category: "Leadership & Team Building", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "The best book on why teams fail and how to build a healthy, high-performing team. Invaluable once you start hiring or leading loan officers.", keyTakeaway: "Not finance, but trust, conflict, commitment, accountability, and results.", amazonLink: "https://www.amazon.com/Five-Dysfunctions-Team-Leadership-Fable/dp/0787960756" },
    { id: "book-028", title: "The Psychology of Selling", author: "Brian Tracy", category: "Sales & Negotiation", level: "Beginner", readTime: "5-7 hrs", whyUseful: "Practical, no-fluff strategies specifically for high-ticket sales. Very applicable to mortgage conversations.", keyTakeaway: "Selling is a mental game. Your attitude determines your altitude.", amazonLink: "https://www.amazon.com/Psychology-Selling-Increase-Sales-Faster/dp/0785288066" },
    { id: "book-030", title: "Ultra Learning", author: "Scott H. Young", category: "Mindset & Performance", level: "Intermediate", readTime: "7-9 hrs", whyUseful: "How to learn hard skills quickly and effectively. Perfect for mastering new tools, AI, or complex financing strategies.", keyTakeaway: "Aggressive, focused learning beats passive consumption every time.", amazonLink: "https://www.amazon.com/Ultra-Learning-Master-Outsmart-Competition/dp/006285268X" },
    { id: "book-031", title: "The Challenger Customer", author: "Brent Adamson et al.", category: "Sales & Negotiation", level: "Advanced", readTime: "8-10 hrs", whyUseful: "Follow-up to The Challenger Sale focused on complex B2B buying committees — very relevant when working with real estate teams or multiple decision makers.", keyTakeaway: "You must mobilize internal champions inside the client's organization.", amazonLink: "https://www.amazon.com/Challenger-Customer-Selling-Complex-Stakeholder/dp/1591848156" },
    { id: "book-032", title: "Deep Work", author: "Cal Newport", category: "Mindset & Performance", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "Essential for anyone who wants to produce high-quality work in a distracted world. Directly applicable to focused prospecting blocks and content creation.", keyTakeaway: "The ability to perform deep work is becoming increasingly rare and valuable.", amazonLink: "https://www.amazon.com/Deep-Work-Focused-Success-Distracted/dp/1455586692" },

    // Additional strong additions
    { id: "book-033", title: "The Little Red Book of Selling", author: "Jeffrey Gitomer", category: "Sales & Negotiation", level: "Beginner", readTime: "4-6 hrs", whyUseful: "Short, punchy, and extremely practical sales truths. Many top loan officers still swear by Gitomer’s no-BS approach.", keyTakeaway: "People buy with their heart and justify with their mind.", amazonLink: "https://www.amazon.com/Little-Red-Book-Selling-12-5/dp/1885167601" },
    { id: "book-034", title: "SPIN Selling", author: "Neil Rackham", category: "Sales & Negotiation", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "Research-based methodology for complex, high-value sales. Excellent for understanding how to handle larger, more sophisticated referral partner relationships.", keyTakeaway: "In major sales, questions are more powerful than statements.", amazonLink: "https://www.amazon.com/SPIN-Selling-Neil-Rackham/dp/0070511136" },
    { id: "book-035", title: "Gap Selling", author: "Keenan", category: "Sales & Negotiation", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "Modern take on sales that focuses on the gap between where the customer is and where they want to be. Very relevant for helping clients see the cost of inaction.", keyTakeaway: "Sell the gap, not the product.", amazonLink: "https://www.amazon.com/Gap-Selling-Getting-Customers-Buying/dp/1732035202" },
    { id: "book-036", title: "The 10X Rule", author: "Grant Cardone", category: "Mindset & Performance", level: "Beginner", readTime: "5-7 hrs", whyUseful: "Aggressive goal-setting and massive action mindset. Useful (with some filtering) for loan officers who need to dramatically increase their activity level.", keyTakeaway: "Set targets 10x higher and take 10x the action.", amazonLink: "https://www.amazon.com/10X-Rule-Difference-Between-Success/dp/0470627603" },
    { id: "book-037", title: "Can't Hurt Me", author: "David Goggins", category: "Mindset & Performance", level: "Intermediate", readTime: "8-10 hrs", whyUseful: "Extreme ownership and mental toughness. Powerful for loan officers who struggle with consistency, rejection, or self-doubt.", keyTakeaway: "The only way to grow is to get comfortable being uncomfortable.", amazonLink: "https://www.amazon.com/Cant-Hurt-Me-Master-Your-Mind/dp/1544512287" },
    { id: "book-038", title: "The War of Art", author: "Steven Pressfield", category: "Mindset & Performance", level: "Beginner", readTime: "3-4 hrs", whyUseful: "Short and profound book about Resistance (procrastination, fear, self-sabotage). Essential reading for anyone who wants to actually do the hard work of prospecting and content creation.", keyTakeaway: "The more important the task, the more Resistance you will feel.", amazonLink: "https://www.amazon.com/War-Art-Through-Creative-Lives/dp/1936891026" },
    { id: "book-039", title: "Slow Productivity", author: "Cal Newport", category: "Mindset & Performance", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "Counter-cultural approach to doing great work without burning out. Very relevant in an industry that often glorifies constant hustle.", keyTakeaway: "Do fewer things, work at a natural pace, and obsess over quality.", amazonLink: "https://www.amazon.com/Slow-Productivity-Accomplishment-Without-Burnout/dp/0593544854" },
    { id: "book-040", title: "Thinking in Bets", author: "Annie Duke", category: "Mindset & Performance", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "Excellent framework for making better decisions under uncertainty. Highly applicable to pricing, risk, and client conversations.", keyTakeaway: "Focus on making good decisions, not on being right.", amazonLink: "https://www.amazon.com/Thinking-Bets-Making-Smarter-Decisions/dp/0735216355" },
    { id: "book-041", title: "Building a Second Brain", author: "Tiago Forte", category: "Mindset & Performance", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "System for capturing, organizing, and retrieving information. Extremely useful for managing client notes, market knowledge, and referral partner information.", keyTakeaway: "Your brain is for having ideas, not holding them.", amazonLink: "https://www.amazon.com/Building-Second-Brain-Proven-Organize/dp/1982167386" },
    { id: "book-042", title: "The Effective Executive", author: "Peter F. Drucker", category: "Leadership & Team Building", level: "Advanced", readTime: "6-8 hrs", whyUseful: "Timeless classic on effectiveness and leadership. Essential once you start managing people or want to dramatically increase your personal output.", keyTakeaway: "Effectiveness can be learned and must be earned.", amazonLink: "https://www.amazon.com/Effective-Executive-Definitive-Drucker-Classics/dp/0060838965" },
    { id: "book-043", title: "High Output Management", author: "Andy Grove", category: "Leadership & Team Building", level: "Advanced", readTime: "6-8 hrs", whyUseful: "Intel CEO’s practical guide to running high-performing teams. Gold for loan officers who want to build a team or run a more professional operation.", keyTakeaway: "A manager’s output = the output of their organization + the output of the neighboring organizations under their influence.", amazonLink: "https://www.amazon.com/High-Output-Management-Andrew-Grove/dp/0679762884" },

    // Restored from original + new high-value additions
    { id: "book-045", title: "The Laws of Human Nature", author: "Robert Greene", category: "Sales & Negotiation", level: "Advanced", readTime: "12-15 hrs", whyUseful: "Deep understanding of human behavior and psychology. One of the best books for mastering influence, reading people, and handling difficult personalities in sales.", keyTakeaway: "Mastering others starts with mastering yourself.", amazonLink: "https://www.amazon.com/Laws-Human-Nature-Robert-Greene/dp/0143110012" },
    { id: "book-046", title: "The ONE Thing", author: "Gary Keller", category: "Mindset & Performance", level: "Beginner", readTime: "5-7 hrs", whyUseful: "Focus on the one thing that matters most. Extremely practical for loan officers who get pulled in too many directions.", keyTakeaway: "Extraordinary results come from doing the one most important thing.", amazonLink: "https://www.amazon.com/ONE-Thing-Surprisingly-Extraordinary-Results/dp/1885167776" },
    { id: "book-047", title: "Loan Officer Champions", author: "Carl White", category: "Sales & Negotiation", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "Real case studies and strategies from top-producing loan officers. Very actionable and industry-specific.", keyTakeaway: "Learn directly from the habits and systems of the best in the business.", amazonLink: "https://www.amazon.com/Loan-Officer-Champions-Studies-Producers/dp/173246555X" },
    { id: "book-048", title: "Be the Better Broker, Volume 1", author: "Dustan Woodhouse", category: "Sales & Negotiation", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "Practical, no-fluff advice specifically for mortgage professionals. Highly regarded in the industry.", keyTakeaway: "Focus on relationships and systems to become a top producer.", amazonLink: "https://www.amazon.com/Be-Better-Broker-Become-Producer/dp/1988344034" },
    { id: "book-049", title: "The Millionaire Loan Officer", author: "Scott Hudspeth", category: "Sales & Negotiation", level: "Intermediate", readTime: "5-7 hrs", whyUseful: "Real-world strategies and mindset shifts from a top producer. Great for scaling your business.", keyTakeaway: "Treat your career like a business, not a job.", amazonLink: "https://www.amazon.com/Millionaire-Loan-Officer-Scott-Hudspeth/dp/0971619409" },
    { id: "book-050", title: "The Mortgage 101 Bootcamp", author: "David Dutton", category: "Sales & Negotiation", level: "Beginner", readTime: "4-6 hrs", whyUseful: "Solid foundational knowledge for new loan officers. Clear explanations of the basics.", keyTakeaway: "Build a strong foundation before trying to master advanced techniques.", amazonLink: "https://www.amazon.com/Mortgage-101-Bootcamp-David-Dutton/dp/B07Z8G5Y3G" },
    { id: "book-051", title: "Pass the Mortgage Loan Originator Test", author: "Real Estate Institute", category: "Sales & Negotiation", level: "Beginner", readTime: "4-6 hrs", whyUseful: "Targeted exam prep for those getting licensed or helping others study. Very practical.", keyTakeaway: "A focused resource for passing the licensing exam efficiently.", amazonLink: "https://www.amazon.com/Pass-Mortgage-Loan-Originator-Test/dp/0997581808" },
    { id: "book-052", title: "The Connector's Advantage", author: "Michelle Tillis Lederman", category: "Networking & Relationships", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "Modern networking strategies with a focus on building genuine, high-value relationships.", keyTakeaway: "Networking is about creating mutual value over time.", amazonLink: "https://www.amazon.com/Connectors-Advantage-7-Traits-Highly/dp/1989025358" },
    { id: "book-053", title: "Networking in the 21st Century", author: "David J.P. Fisher", category: "Networking & Relationships", level: "Intermediate", readTime: "5-7 hrs", whyUseful: "Updated take on networking for the digital age. Very relevant for social media + in-person combination.", keyTakeaway: "Build relationships before you need them.", amazonLink: "https://www.amazon.com/Networking-21st-Century-Professionals-Connections/dp/1944730036" },
    { id: "book-054", title: "Raving Fans", author: "Ken Blanchard", category: "Networking & Relationships", level: "Beginner", readTime: "3-4 hrs", whyUseful: "Classic on creating exceptional customer experiences. Perfect mindset for loan officers who want referrals and repeat business.", keyTakeaway: "Create raving fans, not just satisfied customers.", amazonLink: "https://www.amazon.com/Raving-Fans-Revolutionary-Approach-Customer/dp/0688123163" },
    { id: "book-055", title: "Getting to Yes", author: "Roger Fisher & William Ury", category: "Sales & Negotiation", level: "Intermediate", readTime: "5-7 hrs", whyUseful: "The classic book on principled negotiation. Still one of the best frameworks for win-win outcomes.", keyTakeaway: "Separate the people from the problem and focus on interests, not positions.", amazonLink: "https://www.amazon.com/Getting-Yes-Negotiating-Agreement-Without/dp/0143118757" },
    { id: "book-056", title: "Rich Dad Poor Dad", author: "Robert T. Kiyosaki", category: "Business & Financial Intelligence", level: "Beginner", readTime: "5-7 hrs", whyUseful: "Foundational money and asset mindset. Helpful for explaining concepts to clients and building your own financial intelligence.", keyTakeaway: "The rich buy assets. The poor buy liabilities.", amazonLink: "https://www.amazon.com/Rich-Dad-Poor-Dad-Robert-Kiyosaki/dp/1612680178" },
    { id: "book-057", title: "The Total Money Makeover", author: "Dave Ramsey", category: "Business & Financial Intelligence", level: "Beginner", readTime: "6-8 hrs", whyUseful: "Practical debt elimination and wealth-building steps. Useful when helping clients get their financial house in order before or after buying.", keyTakeaway: "Live like no one else so later you can live like no one else.", amazonLink: "https://www.amazon.com/Total-Money-Makeover-Classic-Financial/dp/1400205298" },

    // Phil M. Jones — Essential for loan officers (added per request)
    { id: "book-093", title: "Exactly What to Say: The Magic Words for Influence and Impact", author: "Phil M. Jones", category: "Sales & Negotiation", level: "Beginner", readTime: "3-4 hrs", whyUseful: "The definitive short guide to using precise, psychologically smart language to influence conversations, handle objections, and guide clients toward decisions without sounding pushy. Invaluable for every client conversation and realtor interaction.", keyTakeaway: "The right words at the right time change everything.", amazonLink: "https://www.amazon.com/Exactly-What-Say-Influence-Impact/dp/1989025005" },
    { id: "book-094", title: "Exactly What to Say: For Real Estate Agents", author: "Phil M. Jones, Chris Smith & Jimmy Mackin", category: "Sales & Negotiation", level: "Beginner", readTime: "3-4 hrs", whyUseful: "30 targeted 'magic words' and phrases specifically for real estate conversations — listing presentations, buyer consultations, price objections, follow-up, and asking for referrals. Extremely practical for LOs who work closely with agents and want better conversations with buyers and partners.", keyTakeaway: "Small changes in language create massive shifts in outcomes.", amazonLink: "https://www.amazon.com/Exactly-What-Say-Estate-Agents/dp/1989603297" },

    // Additional high-value books (new additions)
    { id: "book-095", title: "The Book of Yes", author: "Kevin Ward", category: "Sales & Negotiation", level: "Intermediate", readTime: "4-6 hrs", whyUseful: "One of the most recommended books among top-producing loan officers. Practical scripts and mindset for building powerful realtor partnerships and converting more referrals into closed loans.", keyTakeaway: "Your success is directly tied to the quality of your conversations with real estate agents.", amazonLink: "https://www.amazon.com/Book-Yes-Mortgage-Officers-Real/dp/0996701400" },
    { id: "book-096", title: "High Trust Selling", author: "Todd Duncan", category: "Sales & Negotiation", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "Builds the deep trust required for high-ticket, relationship-driven sales like mortgages. Excellent framework for becoming the go-to trusted advisor instead of just another lender.", keyTakeaway: "Trust is the ultimate shortcut to sales success.", amazonLink: "https://www.amazon.com/High-Trust-Selling-Money-Time/dp/0785263934" },
    { id: "book-097", title: "Power Questions", author: "Andrew Sobel", category: "Sales & Negotiation", level: "Intermediate", readTime: "5-7 hrs", whyUseful: "Master the art of asking the right questions to uncover needs, build deep relationships, and guide clients and partners. Directly applicable to discovery calls, rate conversations, and partner development.", keyTakeaway: "Great questions are more powerful than great answers.", amazonLink: "https://www.amazon.com/Power-Questions-Relationships-Business-Influence/dp/1118119630" },
    { id: "book-098", title: "The Trusted Advisor", author: "David H. Maister, Charles H. Green, Robert M. Galford", category: "Networking & Relationships", level: "Advanced", readTime: "7-9 hrs", whyUseful: "The classic on becoming a true trusted advisor rather than a vendor. Essential reading for any loan officer who wants realtors and clients to see them as indispensable partners.", keyTakeaway: "Trust is the foundation of all valuable professional relationships.", amazonLink: "https://www.amazon.com/Trusted-Advisor-David-H-Maister/dp/0743212347" },
    { id: "book-099", title: "The Science of Selling", author: "David Hoffeld", category: "Sales & Negotiation", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "Research-backed sales methodology that explains exactly why certain approaches work. Perfect for LOs who want to move beyond gut feel to proven, repeatable techniques.", keyTakeaway: "Sales success comes from applying what science tells us about how people decide.", amazonLink: "https://www.amazon.com/Science-Selling-Strategies-Relationships-Close/dp/0143129333" },
    { id: "book-100", title: "Insight Selling", author: "Mike Schultz & John E. Doerr", category: "Sales & Negotiation", level: "Intermediate", readTime: "5-7 hrs", whyUseful: "Shows how to lead with insights that change the client's perspective. Highly relevant for educating realtors and clients on financing options they haven't considered.", keyTakeaway: "The best salespeople don't just respond to needs — they create new insights.", amazonLink: "https://www.amazon.com/Insight-Selling-Surprising-Research-Effort/dp/1118875354" },
    { id: "book-101", title: "Endless Referrals", author: "Bob Burg", category: "Networking & Relationships", level: "Beginner", readTime: "5-7 hrs", whyUseful: "Practical system for generating a steady stream of referrals through genuine relationship building. A must for any LO focused on referral partnerships and long-term growth.", keyTakeaway: "All things being equal, people do business with and refer business to those they know, like, and trust.", amazonLink: "https://www.amazon.com/Endless-Referrals-Strategies-Networking-Relationships/dp/0071453091" },
    { id: "book-102", title: "You Can't Teach a Kid to Ride a Bike at a Seminar", author: "David Sandler", category: "Sales & Negotiation", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "The foundation of the Sandler Selling System — one of the most effective methodologies for consultative, high-trust sales. Loan officers who adopt these principles consistently outperform the average.", keyTakeaway: "Stop selling and start making people want to buy.", amazonLink: "https://www.amazon.com/You-Cant-Teach-Seminar-Updated/dp/1259834581" },

    // === NEW ADDITIONS (Crucial titles + balanced thin categories) ===

    // High-impact titles
    { id: "book-103", title: "Crucial Conversations", author: "Kerry Patterson, Joseph Grenny, Ron McMillan, Al Switzler", category: "Sales & Negotiation", level: "Intermediate", readTime: "5-7 hrs", whyUseful: "The gold standard for handling emotionally charged conversations — rate objections, 'I need to think about it,' and high-stakes negotiations with clients and realtors.", keyTakeaway: "The person who can stay in dialogue the longest usually wins.", amazonLink: "https://www.amazon.com/Crucial-Conversations-Talking-Stakes-Results/dp/1260474135" },
    { id: "book-104", title: "Essentialism", author: "Greg McKeown", category: "Mindset & Performance", level: "Beginner", readTime: "5-7 hrs", whyUseful: "Teaches how to cut through the noise and focus on what truly matters. Invaluable for loan officers drowning in leads, follow-up, content, and partner requests.", keyTakeaway: "If you don't prioritize your life, someone else will.", amazonLink: "https://www.amazon.com/Essentialism-Disciplined-Pursuit-Greg-McKeown/dp/0804137382" },
    { id: "book-105", title: "Dare to Lead", author: "Brené Brown", category: "Leadership & Team Building", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "Practical courage and vulnerability framework. Transforms how you build trust with top-producing realtors and lead any team you grow.", keyTakeaway: "Vulnerability is the birthplace of trust and connection.", amazonLink: "https://www.amazon.com/Dare-Lead-Brave-Work-Tough/dp/0593171128" },
    { id: "book-106", title: "The Infinite Game", author: "Simon Sinek", category: "Mindset & Performance", level: "Intermediate", readTime: "5-7 hrs", whyUseful: "Shifts your thinking from short-term transactions to building something that lasts. Perfect mindset for creating a referral network that compounds for decades.", keyTakeaway: "The goal is not to win the game — the goal is to keep playing.", amazonLink: "https://www.amazon.com/Infinite-Game-Simon-Sinek/dp/073521350X" },
    { id: "book-107", title: "The Slight Edge", author: "Jeff Olson", category: "Mindset & Performance", level: "Beginner", readTime: "5-7 hrs", whyUseful: "Shows how small daily disciplines compound into massive results. The perfect philosophy for consistent prospecting, follow-up, and content habits.", keyTakeaway: "The slight edge is the difference between success and mediocrity.", amazonLink: "https://www.amazon.com/Slight-Edge-Successful-Happy-Fulfilling/dp/1626340463" },
    { id: "book-108", title: "The Referral Engine", author: "John Jantsch", category: "Networking & Relationships", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "One of the best systems for turning your business into a referral-generating machine. Extremely practical for loan officers who want predictable, high-quality inbound business.", keyTakeaway: "Build a system that makes referrals the natural outcome of how you do business.", amazonLink: "https://www.amazon.com/Referral-Engine-Networking-Your-Business/dp/1591843111" },
    { id: "book-109", title: "Book Yourself Solid", author: "Michael Port", category: "Personal Branding & Content", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "A complete system for packaging and marketing yourself so the right clients and referral partners naturally seek you out.", keyTakeaway: "Your expertise is worthless if no one knows about it.", amazonLink: "https://www.amazon.com/Book-Yourself-Solid-Marketing-Professional/dp/0470643471" },

    // Prospecting & Lead Generation (expanded)
    { id: "book-110", title: "Smart Calling", author: "Art Sobczak", category: "Prospecting & Lead Generation", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "The modern bible of effective, non-sleazy phone prospecting. Outstanding scripts and frameworks for reaching busy real estate agents and past clients.", keyTakeaway: "Research + relevance + relationship = results on the phone.", amazonLink: "https://www.amazon.com/Smart-Calling-Eliminate-Rejection-Sales/dp/1119673666" },
    { id: "book-111", title: "High-Profit Prospecting", author: "Mark Hunter", category: "Prospecting & Lead Generation", level: "Intermediate", readTime: "5-7 hrs", whyUseful: "Focuses on quality over quantity in prospecting. Teaches LOs how to spend less time on low-value leads and more time on high-potential realtors and referral sources.", keyTakeaway: "Prospect the right people, not just more people.", amazonLink: "https://www.amazon.com/High-Profit-Prospecting-Strategies-Generating/dp/0814437788" },
    { id: "book-112", title: "The Ultimate Sales Machine", author: "Chet Holmes", category: "Prospecting & Lead Generation", level: "Intermediate", readTime: "7-9 hrs", whyUseful: "A complete operating system for sales and marketing. The chapter on prospecting and follow-up systems alone is worth the price for any serious loan officer.", keyTakeaway: "Success comes from doing the mundane things exceptionally well every single day.", amazonLink: "https://www.amazon.com/Ultimate-Sales-Machine-Turbocharge-Business/dp/1591847745" },
    { id: "book-113", title: "Never Cold Call Again", author: "Frank Rumbauskas", category: "Prospecting & Lead Generation", level: "Intermediate", readTime: "4-6 hrs", whyUseful: "A proven system for generating warm leads without traditional cold calling. Excellent for LOs who hate the phone but still need consistent pipeline activity.", keyTakeaway: "The best prospecting feels like service, not selling.", amazonLink: "https://www.amazon.com/Never-Cold-Call-Again-Generating/dp/0471786799" },
    { id: "book-114", title: "The 7 Levels of Communication", author: "Michael J. Maher", category: "Prospecting & Lead Generation", level: "Beginner", readTime: "4-6 hrs", whyUseful: "Extremely popular in real estate circles. A simple, relationship-first communication system that turns agents and clients into raving fans and consistent referrers.", keyTakeaway: "People do business with those they know, like, and trust — at the highest level.", amazonLink: "https://www.amazon.com/7-Levels-Communication-Strategies-Relationships/dp/1948489007" },

    // Personal Branding & Content (expanded)
    { id: "book-115", title: "Marketing Made Simple", author: "Donald Miller", category: "Personal Branding & Content", level: "Beginner", readTime: "4-6 hrs", whyUseful: "The practical follow-up to StoryBrand. Gives loan officers a clear, one-page marketing plan that actually works for websites, social, and referral outreach.", keyTakeaway: "A confused mind always says no. Clarity wins.", amazonLink: "https://www.amazon.com/Marketing-Made-Simple-Step-Step/dp/1400209390" },
    { id: "book-116", title: "Platform", author: "Michael Hyatt", category: "Personal Branding & Content", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "Shows how to build a personal platform that attracts opportunities instead of chasing them. Excellent for LOs who want to become the obvious choice in their market.", keyTakeaway: "Your platform is the sum total of your online and offline presence.", amazonLink: "https://www.amazon.com/Platform-Get-Noticed-Noisy-World/dp/159555503X" },
    { id: "book-117", title: "The 1-Page Marketing Plan", author: "Allan Dib", category: "Personal Branding & Content", level: "Beginner", readTime: "4-6 hrs", whyUseful: "A simple, powerful framework for creating a complete marketing plan in one page. Perfect for busy loan officers who need clarity fast.", keyTakeaway: "If you can't explain your marketing on one page, it's too complicated.", amazonLink: "https://www.amazon.com/1-Page-Marketing-Plan-Customers-Money/dp/1989025013" },
    { id: "book-118", title: "Positioning", author: "Al Ries & Jack Trout", category: "Personal Branding & Content", level: "Advanced", readTime: "6-8 hrs", whyUseful: "The classic on how to own a specific space in the minds of your market. Essential reading for LOs who want to differentiate themselves powerfully from the competition.", keyTakeaway: "It's better to be first in the mind than first in the market.", amazonLink: "https://www.amazon.com/Positioning-Battle-Your-Mind-Anniversary/dp/0071373586" },

    // AI & Modern Tools (expanded)
    { id: "book-119", title: "Human + Machine", author: "Paul R. Daugherty & H. James Wilson", category: "AI & Modern Tools", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "The best book on how humans and AI work together in business. Practical frameworks for loan officers who want to use AI without losing the human touch that wins referrals.", keyTakeaway: "The winners will be those who master the human + machine partnership.", amazonLink: "https://www.amazon.com/Human-Machine-Reimagining-Work-Age/dp/1633693864" },
    { id: "book-120", title: "The Coming Wave", author: "Mustafa Suleyman", category: "AI & Modern Tools", level: "Intermediate", readTime: "7-9 hrs", whyUseful: "A clear-eyed look at where AI is heading and how it will reshape every industry. Essential reading for any loan officer who wants to stay ahead of massive change.", keyTakeaway: "The wave is coming — the only choice is whether you learn to surf it.", amazonLink: "https://www.amazon.com/Coming-Wave-Technology-Transform/dp/0593593952" },
    { id: "book-121", title: "Power and Prediction", author: "Ajay Agrawal, Joshua Gans, Avi Goldfarb", category: "AI & Modern Tools", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "Explains how AI changes decision-making in business. Highly relevant for pricing strategy, risk assessment, and client conversations in mortgage lending.", keyTakeaway: "AI's real power is in prediction — and better predictions change everything.", amazonLink: "https://www.amazon.com/Power-Prediction-Artificial-Intelligence-Transform/dp/1647822696" },
    { id: "book-122", title: "AI Superpowers", author: "Kai-Fu Lee", category: "AI & Modern Tools", level: "Intermediate", readTime: "7-9 hrs", whyUseful: "A global perspective on the AI revolution from one of the world's leading experts. Helps loan officers understand both the opportunities and the human elements that will remain irreplaceable.", keyTakeaway: "The future belongs to those who blend AI with uniquely human strengths like empathy and creativity.", amazonLink: "https://www.amazon.com/AI-Superpowers-China-Silicon-Valley/dp/1328547205" },

    // User-requested additions
    { id: "book-123", title: "Creating Superfans", author: "Brittany Hodak", category: "Networking & Relationships", level: "Intermediate", readTime: "5-7 hrs", whyUseful: "A practical five-step system for turning ordinary clients and referral partners into passionate advocates who refer business consistently. Extremely relevant for loan officers who want realtors and past clients to become their biggest growth engine.", keyTakeaway: "Superfans don't just buy — they bring their friends.", amazonLink: "https://www.amazon.com/Creating-Superfans-Five-Step-Multiplying-Reputation/dp/1774580780" },
    { id: "book-124", title: "Rethink Everything You Know About Social Media", author: "Kyle Draper", category: "Personal Branding & Content", level: "Beginner", readTime: "4-6 hrs", whyUseful: "A no-BS reset for real estate professionals (including loan officers) on how to actually use social media to build real relationships instead of chasing vanity metrics. Heavy emphasis on video, authenticity, and storytelling that converts.", keyTakeaway: "Stop posting like everyone else. Start connecting like a human.", amazonLink: "https://www.amazon.com/Rethink-Everything-About-Social-Media/dp/B0C126KFMX" },
    { id: "book-125", title: "Good to Great", author: "Jim Collins", category: "Leadership & Team Building", level: "Advanced", readTime: "8-10 hrs", whyUseful: "The definitive research-backed book on what separates good companies (and professionals) from truly great ones. Timeless lessons on disciplined people, thought, and action — highly valuable once you start scaling your business or building a team.", keyTakeaway: "Good is the enemy of great.", amazonLink: "https://www.amazon.com/Good-Great-Some-Companies-Others/dp/0066620996" },
    { id: "book-126", title: "Trump: The Art of the Deal", author: "Donald J. Trump & Tony Schwartz", category: "Sales & Negotiation", level: "Intermediate", readTime: "6-8 hrs", whyUseful: "A classic (and controversial) look at aggressive deal-making, leverage, promotion, and negotiation psychology. Useful for understanding high-stakes real estate transactions and bold positioning, even if you adapt the style heavily.", keyTakeaway: "Think big, use leverage, and always promote.", amazonLink: "https://www.amazon.com/Trump-Art-Deal-Donald-J/dp/0399594493" },
    { id: "book-127", title: "Do the Hard Things First", author: "Scott Allan", category: "Mindset & Performance", level: "Beginner", readTime: "5-7 hrs", whyUseful: "A direct, practical guide to beating procrastination and building the habit of tackling your most important (and difficult) work first. Perfect for loan officers who struggle with consistent prospecting, follow-up, or content creation.", keyTakeaway: "The hard things you avoid today become the reasons you stay average tomorrow.", amazonLink: "https://www.amazon.com/Hard-Things-First-Procrastination-Bulletproof/dp/1989599834" }
  ];

  const bookCategories = [...new Set(BOOKS_DATA.map(b => b.category))];
  let activeBookCategories = [];

  // Foundational 3 for the sexy "Start Here" row (hand-picked high-ROI for LOs)
  const FEATURED_BOOK_IDS = ['book-004', 'book-005', 'book-008']; // Ninja Selling, Fanatical Prospecting, Atomic Habits

  function renderFeaturedBooks() {
    const container = document.getElementById('book-featured-row');
    if (!container) return;
    container.innerHTML = '';

    FEATURED_BOOK_IDS.forEach(id => {
      const book = BOOKS_DATA.find(b => b.id === id);
      if (!book) return;

      const card = document.createElement('div');
      card.className = 'group bg-white dark:bg-gray-900 border-2 border-[#00A89D]/30 hover:border-[#00A89D] rounded-3xl p-5 flex flex-col transition-all hover:shadow-lg';

      card.innerHTML = `
        <div class="flex items-center gap-2 mb-2">
          <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#00A89D] text-white">START HERE</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">${book.category}</span>
        </div>
        <div class="font-bold text-lg leading-tight mb-1 group-hover:text-[#00A89D] transition">${book.title}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">by ${book.author}</div>
        <div class="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 flex-1">${book.whyUseful}</div>
        <div class="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button onclick="filterToBook('${book.id}', this)" class="flex-1 text-xs px-3 py-1.5 rounded-2xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition font-semibold">View in Vault</button>
          <a href="${book.amazonLink}" target="_blank" class="text-xs px-3 py-1.5 rounded-2xl bg-[#002B5C] text-white hover:bg-[#001f3f] transition">Amazon</a>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // Filter the vault directly to one featured book + scroll
  window.filterToBook = function(bookId, el) {
    const book = BOOKS_DATA.find(b => b.id === bookId);
    if (!book) return;
    activeBookCategories = [];
    const searchEl = document.getElementById('book-search');
    if (searchEl) {
      searchEl.value = book.title.split(':')[0]; // first part for good match
    }
    filterBooks();
    renderBookFilters();
    const grid = document.getElementById('book-grid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // === Book Vault Helpers (for consistent saved state + UX) ===
  function getSavedIdeas() {
    try {
      return JSON.parse(localStorage.getItem('socialSavedIdeas') || '[]');
    } catch (e) { return []; }
  }

  function isBookSaved(book) {
    const saved = getSavedIdeas();
    const title = `Book: ${book.title}`;
    return saved.some(s => s.title === title);
  }

  function renderBooks(filteredBooks) {
    const container = document.getElementById('book-grid');
    if (!container) return;

    container.innerHTML = '';

    // Live count (premium v2 touch)
    const countEl = document.getElementById('book-count-num');
    if (countEl) {
      countEl.textContent = filteredBooks.length;
    }
    const countWrap = document.getElementById('book-results-count');
    if (countWrap) countWrap.classList.remove('hidden');

    if (filteredBooks.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-search text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
          <p class="text-lg text-gray-500">No books match your search or filters.</p>
          <button onclick="activeBookCategories = []; document.getElementById('book-search').value=''; filterBooks(); renderBookFilters();"
                  class="mt-4 px-4 py-2 text-sm rounded-2xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition">
            Clear all filters
          </button>
        </div>`;
      return;
    }

    filteredBooks.forEach(book => {
      const alreadySaved = isBookSaved(book);

      const saveBtnHTML = alreadySaved
        ? `<button onclick="saveBook('${book.id}', this)" 
                   class="text-xs px-3 py-1 rounded-full border border-[#00A89D] text-[#00A89D] bg-[#00A89D]/5 flex items-center gap-1 transition"
                   title="Saved to My Saved Items — click to remove">
             <i class="fas fa-bookmark"></i> <span>Saved</span>
           </button>`
        : `<button onclick="saveBook('${book.id}', this)" 
                   class="text-xs px-3 py-1 rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition flex items-center gap-1"
                   title="Save to My Saved Items">
             <i class="far fa-bookmark"></i> <span>Save</span>
           </button>`;

      const card = document.createElement('div');
      // Premium v2 card treatment: stronger borders, teal hover ring, better depth
      card.className = 'bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-[#00A89D]/70 rounded-3xl p-6 flex flex-col h-full shadow-sm hover:shadow-xl transition-all';

      const takeawayEsc = book.keyTakeaway.replace(/'/g, "\\'").replace(/"/g, '&quot;');

      card.innerHTML = `
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-[#00A89D]/10 text-[#00A89D] font-medium">${book.category}</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">${book.level}</span>
          </div>
          <h4 class="font-bold text-lg leading-tight mb-1">${book.title}</h4>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">by ${book.author}</p>

          <div class="mb-3">
            <div class="text-[10px] uppercase tracking-wider text-[#F15A29] font-bold mb-0.5">Why this matters for LOs</div>
            <p class="text-sm leading-snug">${book.whyUseful}</p>
          </div>

          <div class="bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700 rounded-2xl p-3">
            <div class="flex gap-2">
              <i class="fas fa-quote-left text-[#00A89D] mt-0.5 text-xs"></i>
              <p class="text-xs italic text-gray-600 dark:text-gray-300 flex-1">"${book.keyTakeaway}"</p>
            </div>
          </div>
        </div>
        
        <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <span class="text-xs text-gray-500">${book.readTime}</span>
          <div class="flex gap-1.5">
            ${saveBtnHTML}
            <button onclick="copyBookTakeaway('${book.id}', this)" class="text-xs px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-1" title="Copy key takeaway">
              <i class="fas fa-copy"></i> <span class="hidden sm:inline">Copy</span>
            </button>
            <a href="${book.amazonLink}" target="_blank" class="text-xs px-3 py-1 rounded-full bg-[#002B5C] text-white hover:bg-[#001f3f] transition flex items-center gap-1">
              <span>Amazon</span>
            </a>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // Copy key takeaway with premium feedback (consistent with rest of tool)
  window.copyBookTakeaway = function(bookId, btnEl) {
    const book = BOOKS_DATA.find(b => b.id === bookId);
    if (!book) return;
    const text = `"${book.keyTakeaway}" — ${book.title} by ${book.author}`;

    const doCopy = () => {
      if (btnEl) {
        const orig = btnEl.innerHTML;
        btnEl.innerHTML = '<i class="fas fa-check"></i> <span class="hidden sm:inline">Copied</span>';
        btnEl.disabled = true;
        setTimeout(() => {
          if (btnEl) { btnEl.innerHTML = orig; btnEl.disabled = false; }
        }, 1600);
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(doCopy).catch(() => {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch(e){}
        document.body.removeChild(ta);
        doCopy();
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch(e){}
      document.body.removeChild(ta);
      doCopy();
    }
  };

  function filterBooks() {
    const searchEl = document.getElementById('book-search');
    const searchTerm = searchEl ? searchEl.value.toLowerCase().trim() : '';

    let filtered = BOOKS_DATA;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        book.whyUseful.toLowerCase().includes(searchTerm) ||
        book.keyTakeaway.toLowerCase().includes(searchTerm)
      );
    }

    // Apply category filters (multi-select)
    if (activeBookCategories.length > 0) {
      filtered = filtered.filter(book =>
        activeBookCategories.includes(book.category)
      );
    }

    renderBooks(filtered);
  }

  function renderBookFilters() {
    const container = document.getElementById('book-filters');
    if (!container) return;

    container.innerHTML = '';

    // "All" button
    const allBtn = document.createElement('button');
    allBtn.className = `px-4 py-1.5 text-sm rounded-full border transition ${activeBookCategories.length === 0 ? 'bg-[#00A89D] text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`;
    allBtn.textContent = 'All';
    allBtn.onclick = () => {
      activeBookCategories = [];
      filterBooks();
      renderBookFilters();
    };
    container.appendChild(allBtn);

    // Category pills
    bookCategories.forEach(category => {
      const isActive = activeBookCategories.includes(category);

      const btn = document.createElement('button');
      btn.className = `px-4 py-1.5 text-sm rounded-full border transition ${isActive ? 'bg-[#00A89D] text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`;
      btn.textContent = category;

      btn.onclick = () => {
        if (activeBookCategories.includes(category)) {
          activeBookCategories = activeBookCategories.filter(c => c !== category);
        } else {
          activeBookCategories.push(category);
        }
        filterBooks();
        renderBookFilters();
      };

      container.appendChild(btn);
    });

    // Clear all filters (visible when any are active)
    if (activeBookCategories.length > 0) {
      const clearBtn = document.createElement('button');
      clearBtn.className = `px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-1`;
      clearBtn.innerHTML = `<i class="fas fa-times text-xs"></i> <span>Clear all</span>`;
      clearBtn.onclick = () => {
        activeBookCategories = [];
        filterBooks();
        renderBookFilters();
      };
      container.appendChild(clearBtn);
    }
  }

  function saveBook(bookId, btnEl) {
    const book = BOOKS_DATA.find(b => b.id === bookId);
    if (!book) return;

    const title = `Book: ${book.title}`;
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem('socialSavedIdeas') || '[]');
    } catch (e) {}

    const already = saved.some(item => item.title === title);
    if (already) {
      saved = saved.filter(item => item.title !== title);
      localStorage.setItem('socialSavedIdeas', JSON.stringify(saved));

      if (btnEl) {
        btnEl.innerHTML = '<i class="far fa-bookmark"></i> <span>Save</span>';
        btnEl.classList.remove('!bg-[#00A89D]', 'text-white', 'bg-[#00A89D]/5');
        btnEl.title = 'Save to My Saved Items';
      }

      if (typeof window.updateSavedCount === 'function') window.updateSavedCount();
      return;
    }

    saved.push({
      title: title,
      content: `${book.title} by ${book.author}\n\nWhy it's useful: ${book.whyUseful}\n\nKey takeaway: ${book.keyTakeaway}`,
      savedAt: new Date().toISOString(),
      type: 'book'
    });
    localStorage.setItem('socialSavedIdeas', JSON.stringify(saved));

    if (btnEl) {
      btnEl.innerHTML = '<i class="fas fa-bookmark"></i> <span>Saved</span>';
      btnEl.classList.add('bg-[#00A89D]/5');
      btnEl.title = 'Saved to My Saved Items — click to remove';
    }

    if (typeof window.updateSavedCount === 'function') window.updateSavedCount();
    if (typeof window.showSavedFeedback === 'function') {
      window.showSavedFeedback('Saved to My Saved Items');
    }
  }

  function initBookVault() {
    const grid = document.getElementById('book-grid');
    const search = document.getElementById('book-search');

    if (!grid) return;

    // Reset filters on init
    activeBookCategories = [];

    renderFeaturedBooks();
    renderBooks(BOOKS_DATA);
    renderBookFilters();

    if (search) {
      search.addEventListener('input', () => {
        filterBooks();
      });
    }

    console.log('%c[Book Vault] Initialized with ' + BOOKS_DATA.length + ' books', 'color:#00A89D');
  }

  window.renderBookVault = function() {
    renderFeaturedBooks();
    // Re-apply current filters + search state + refresh UI (preserves user context on nav)
    const grid = document.getElementById('book-grid');
    if (grid) {
      activeBookCategories = activeBookCategories || [];
      filterBooks();
      renderBookFilters();
    }
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBookVault);
  } else {
    initBookVault();
  }

  // Helper for the quick micro-strategy save buttons on the main page
  window.saveMicroStrategy = function saveMicroStrategy(text, btnEl) {
    const title = `Partner Micro-Strategy: ${text}`;
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem('socialSavedIdeas') || '[]'); } catch (e) {}

    if (saved.some(item => item.title === title)) {
      if (btnEl) btnEl.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => { if (btnEl) btnEl.innerHTML = '<i class="far fa-bookmark"></i> <span>Saved</span>'; }, 1200);
      return;
    }

    saved.push({
      title: title,
      content: text,
      savedAt: new Date().toISOString(),
      type: 'partner'
    });
    localStorage.setItem('socialSavedIdeas', JSON.stringify(saved));

    if (btnEl) {
      btnEl.innerHTML = '<i class="fas fa-check"></i> <span>Saved</span>';
      btnEl.disabled = true;
    }
    if (typeof window.updateSavedCount === 'function') window.updateSavedCount();
    if (typeof window.showSavedFeedback === 'function') window.showSavedFeedback('Saved to My Saved Items');
  };

  // Save individual strategy pieces from the playbook
  window.savePartnerStrategy = function savePartnerStrategy(partnerType, sectionIndex, btnEl) {
    const playbook = PARTNER_PLAYBOOKS[partnerType];
    if (!playbook) return;

    const section = playbook.sections[sectionIndex];
    const title = `${partnerType}: ${section.heading}`;
    const content = section.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 800);

    // Use the unified saved items system
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem('socialSavedIdeas') || '[]');
    } catch (e) {}

    const already = saved.some(item => item.title === title);
    if (already) {
      saved = saved.filter(item => item.title !== title);
      localStorage.setItem('socialSavedIdeas', JSON.stringify(saved));
      if (btnEl) btnEl.innerHTML = '<i class="far fa-bookmark"></i> <span>Save</span>';
      if (typeof window.updateSavedCount === 'function') window.updateSavedCount();
      return;
    }

    saved.push({
      title: title,
      content: content,
      savedAt: new Date().toISOString(),
      type: 'partner'
    });
    localStorage.setItem('socialSavedIdeas', JSON.stringify(saved));

    if (btnEl) {
      btnEl.innerHTML = '<i class="fas fa-check"></i> <span>Saved</span>';
      btnEl.classList.add('!bg-[#00A89D]', 'text-white', 'border-[#00A89D]');
      setTimeout(() => {
        if (btnEl) {
          btnEl.innerHTML = '<i class="fas fa-bookmark"></i> <span>Saved</span>';
          btnEl.classList.remove('!bg-[#00A89D]', 'text-white');
        }
      }, 2200);
    }

    if (typeof window.updateSavedCount === 'function') window.updateSavedCount();
    if (typeof window.showSavedFeedback === 'function') {
      window.showSavedFeedback('Saved to My Saved Items');
    } else if (typeof window.showToast === 'function') {
      window.showToast('Saved to My Saved Items');
    }
  };

  // =====================================================
  // DATABASE NURTURING MODALS — MIGRATED
  // =====================================================
  // The rich implementation lives in the main index.html (openDatabaseModal + local rich data).
  // This legacy thin version has been disabled to prevent override.
  // (Kept only for reference / other helpers in this file.)


  // =====================================================
  // GENERIC MODAL CLOSERS (for safety)
  // =====================================================
  window.closeSocialModal = window.closeModal;
  window.closeDbModal = function () {
    const m = document.getElementById('db-modal');
    if (m) m.style.display = 'none';
  };

  console.log('%c[legacy-helpers.js] Legacy modal & prospecting functions restored and exposed on window', 'color:#00A89D');
})();