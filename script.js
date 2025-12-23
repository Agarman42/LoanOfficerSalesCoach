// Menu toggle
document.getElementById('menu-toggle').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('left-0');
    sidebar.classList.toggle('left-[-300px]');
    sidebar.classList.toggle('open');
});

// Full quotes
const quotes = [
    "The harder you work, the luckier you get.",
    "Your next loan is one call away.",
    "Success is rented, and the rent is due every day.",
    "Every “no” brings you closer to a “yes.”",
    "You don’t have to be great to start, but you have to start to be great.",
    "Turn obstacles into opportunities.",
    "Be so good they can’t ignore you.",
    "Hustle beats talent when talent doesn’t hustle.",
    "Make someone’s dream come true today!",
    "Doubt kills more dreams than failure ever will.",
    "The best way to predict the future is to create it.",
    "Winners never quit, and quitters never win.",
    "Your only limit is you.",
    "Small steps today, big wins tomorrow.",
    "Stay positive, work hard, make it happen.",
    "Dream big. Work hard. Stay focused.",
    "You’re one decision away from a totally different life.",
    "Good things come to those who hustle.",
    "Don’t wait for opportunity—create it.",
    "Believe you can and you’re halfway there.",
    "Push yourself because no one else is going to do it for you.",
    "Great things never come from comfort zones.",
    "Rise up and attack the day with enthusiasm.",
    "Turn “I wish” into “I will.”",
    "Make today count.",
    "Your future is created by what you do today.",
    "Excuses don’t build empires.",
    "Stay hungry, stay humble, keep working.",
    "The harder the battle, the sweeter the victory.",
    "You miss 100% of the shots you don’t take.",
    "Do something today your future self will thank you for.",
    "Success is the sum of small efforts repeated daily.",
    "Be the energy you want to attract.",
    "Fall seven times, stand up eight.",
    "Prove them wrong.",
    "Today’s grind = tomorrow’s shine.",
    "Limits exist only in the mind.",
    "Keep going—you’re closer than you think.",
    "One closed loan can change everything.",
    "Discipline is choosing between what you want now and what you want most.",
    "Wake up with purpose, go to bed with satisfaction.",
    "Don’t stop when you’re tired—stop when you’re done.",
    "The comeback is always stronger than the setback.",
    "You were born to win.",
    "Make it happen. Shock everyone.",
    "Every call counts. Make each one great.",
    "Loans don’t find themselves—go get yours.",
    "Your pipeline is your paycheck. Fill it.",
    "Close the day strong.",
    "Borrowers are waiting—be their hero today.",
    "Momentum is built one “yes” at a time.",
    "Outwork yesterday’s you.",
    "Average effort = average results. Be extraordinary.",
    "Grind now, glow later.",
    "The best loan officers don’t wait for the phone to ring.",
    "Confidence closes.",
    "Every “I’ll think about it” is a future “Where do I sign?”",
    "Pressure makes diamonds—thrive in it.",
    "Your next record-breaking month starts today.",
    "Stop wishing, start closing.",
    "Be the lender they brag about to their friends.",
    "One more call could change your year.",
    "Today’s effort = tomorrow’s commission check.",
    "Borrowers don’t care how much you know until they know how much you care.",
    "Speed + service = unstoppable.",
    "You’ve survived 100% of your worst days so far. Keep going.",
    "The magic you’re looking for is in the work you’re avoiding.",
    "Build relationships, not just files.",
    "Done is better than perfect.",
    "Lead with value, close with ease.",
    "Turn “I can’t afford it” into “How do I make this happen?”",
    "Make today so awesome yesterday gets jealous.",
    "The only bad call is the one you didn’t make.",
    "If you don’t own the day, the day owns you.",
    "Borrowers remember how you made them feel—make it amazing.",
    "Keep swinging—the home runs are coming.",
    "Success is a decision away. Decide now.",
    "Go out there and make someone’s dream happen.",
    "Be intentional with your hours or someone else will be.",
    "Small, consistent actions compound into massive results.",
    "Intentional effort today, dividends paid tomorrow.",
    "Winners are just people who stayed consistent when no one was watching.",
    "Show up on purpose—every single day.",
    "Consistency turns average loan officers into top producers.",
    "Intentional mornings create unstoppable months.",
    "Do the boring work consistently and the results will come.",
    "Consistency is louder than motivation ever will be.",
    "The loan you close tomorrow was built by what you did today—and yesterday.",
    "Consistent follow-up turns “maybe” into “money.”",
    "Intentional loan officers don’t wait for leads—they create them.",
    "Success loves preparation. Be consistent in yours.",
    "Consistency compounds faster than interest rates.",
    "The difference between good and great is one more intentional call.",
    "Consistency is the bridge between leads and legacy.",
    "Intentional effort feels like work; consistent effort feels like winning.",
    "Show up, suit up, follow up—every single day.",
    "Intentionality today keeps regret away tomorrow.",
    "Consistency isn’t sexy until you see the scoreboard.",
    "Be relentlessly intentional about the activities that pay.",
    "Consistency is the silent closer that never takes a day off"
];

// Generate quote (for Dashboard)
function generateQuote() {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    // Update both the old dashboard one (if it exists) AND the new persistent one
    const dashboardQuote = document.getElementById('daily-quote');
    const persistentQuote = document.getElementById('persistent-quote');
    
    if (persistentQuote) {
        persistentQuote.innerHTML = `<span class="not-italic font-bold text-[#00A89D]">"</span>${randomQuote}<span class="not-italic font-bold text-[#00A89D]">"</span>`;
    }
    if (dashboardQuote) {
        dashboardQuote.innerHTML = `<span class="not-italic font-bold text-[#00A89D]">"</span>${randomQuote}<span class="not-italic font-bold text-[#00A89D]">"</span>`;
    }
}

// Load quote immediately on page load
generateQuote();

// Update carousel quote (for Motivation Hub)
function updateCarouselQuote() {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    document.getElementById('carousel-quote').innerHTML = `<span class="not-italic font-bold text-[#00A89D]">"</span>${randomQuote}<span class="not-italic font-bold text-[#00A89D]">"</span>`;
}
updateCarouselQuote();

// Activities (full)
const activities = {
    daily: ["Write two personal notes or thank-you cards to clients, referral partners, or prospects.", "Make at least five outbound calls to past clients or referral partners.", "Send personalized birthday messages using video to your past clients.", "Engage on social media by commenting on or liking 10 posts from realtors, clients, and referral partners.", "Record and post one short-form video or story about mortgage tips, market updates, or client success stories.", "Follow up with any new online or social media leads received in the past 24 hours.", "Reach out to a past client just to check in—no sales pitch, just relationship-building.", "Send a text or video message to a referral partner to stay top of mind.", "Knock on one local business door to introduce yourself (title companies, insurance agents, CPAs, etc.).", "Spend time reviewing and updating CRM with notes, follow-ups, and next actions."],
    weekly: ["Pipeline review with referral partners—discuss upcoming deals and potential new clients.", "Pipeline review with active clients—touch base with a weekly update, even if nothing new.", "Host a 15-minute coaching call (Zoom or Teams) for realtors on mortgage trends or strategies.", "Attend at least one networking event (chamber of commerce, BNI, or real estate meetup).", "Send a “Who do you know?” text to 5+ referral partners asking for warm introductions.", "Create and send a value-packed email to your database (market updates, home tips, etc.).", "Record and send a personalized video email to new leads or referral partners.", "Reach out to 3 new real estate agents via social media or in person.", "Host a casual coffee meeting with a referral partner or past client.", "Review past closed loans and follow up with clients who may benefit from refinancing."],
    monthly: ["Deliver pop-by gifts to your top 10 referral partners or your A+ past clients.", "Host an Ask YOUR Lender Zoom call for realtors and referral partners.", "Host a first-time homebuyer seminar (online or in person).", "Send out handwritten birthday and anniversary cards to past clients.", "Record and post a long-form video covering a trending mortgage topic.", "Partner with a real estate agent for a co-branded marketing campaign.", "Run a targeted Facebook or Instagram ad to generate leads.", "Check in on past pre-approved clients who haven’t bought yet.", "Attend a local community event and network with homeowners and business owners.", "Review and update your Google Business Profile with new content and reviews."],
    quarterly: ["Host a Lunch & Learn for real estate agents and referral partners.", "Run a local market update webinar for homebuyers and realtors.", "Send a personalized video message to past clients about market trends.", "Organize a Realtor Mastermind event to discuss business growth strategies.", "Sponsor a local event or charity drive to gain visibility in the community.", "Mail out a homeowner equity review letter to past clients.", "Host a networking happy hour for realtors, attorneys, and financial planners.", "Run a contest or giveaway for clients and referral partners.", "Send a direct mail campaign targeting renters or move-up buyers.", "Set up a strategy session with a key referral partner to refine your co-marketing plan."],
    yearly: ["Host a Client Appreciation Party for past clients and referral partners.", "Review and optimize your annual marketing plan and business goals.", "Plan and execute a major branding campaign (e.g., billboards, radio ads, podcast sponsorship).", "Attend at least one national or regional mortgage conference for networking and education.", "Run a VIP dinner for your top referral partners. (Great around the holidays)", "Organize a major community service project under your brand.", "Launch an exclusive mastermind group for elite real estate agents.", "Record a professional brand video to use in marketing.", "Schedule a business planning retreat to evaluate and set goals for the next year.", "Build and refresh your contact database, ensuring all referral partners and clients are engaged."]
};

// Generate time block
function generateTimeBlock() {
    const freq = document.getElementById('frequency').value.toLowerCase();
    const list = activities[freq].map(act => `<li class="mb-2">${act}</li>`).join('');
    document.getElementById('time-block-output').innerHTML = `<h4 class="text-2xl font-medium mb-4 capitalize text-[#00A89D]">${freq} Schedule</h4><ul class="space-y-2">${list}</ul>`;
}

// Cycle activities
function cycleActivities() {
    const freq = document.getElementById('frequency').value.toLowerCase();
    const shuffled = [...activities[freq]].sort(() => 0.5 - Math.random());
    const selection = shuffled.slice(0, Math.floor(Math.random() * 6) + 5);
    const list = selection.map(act => `<li class="mb-2">${act}</li>`).join('');
    document.getElementById('time-block-output').innerHTML = `<h4 class="text-2xl font-medium mb-4 capitalize text-[#00A89D]">Cycled ${freq} Ideas</h4><ul class="space-y-2">${list}</ul>`;
}

// Search with highlights
document.getElementById('search').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('section').forEach(sec => {
        const matches = sec.textContent.toLowerCase().includes(term);
        sec.classList.toggle('hidden', !matches);
        if (matches) {
            sec.querySelectorAll('p, li, h2, h3, h4').forEach(el => {
                el.innerHTML = el.textContent.replace(new RegExp(term, 'gi'), match => `<mark class="bg-[#F15A29]/30 dark:bg-[#F15A29]/50 rounded px-1">${match}</mark>`);
            });
        }
    });
});

// Accordion toggle
function toggleAccordion(button) {
    const content = button.nextElementSibling;
    content.classList.toggle('open');
}

// Show section on nav click
document.querySelectorAll('#sidebar a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('section').forEach(sec => sec.classList.add('hidden'));
        const target = document.querySelector(link.getAttribute('href'));
        target.classList.remove('hidden');
        document.getElementById('sidebar').classList.remove('left-0');
        document.getElementById('sidebar').classList.add('left-[-300px]');
        document.getElementById('sidebar').classList.remove('open');
        // Reset accordions
        target.querySelectorAll('.accordion-content').forEach(content => content.classList.remove('open'));
    });
});

// Calculator JS
function calculateAdvanced() {
    const P = parseFloat(document.getElementById('loanAmount').value);
    const annualRate = parseFloat(document.getElementById('rate').value) / 100;
    const r = annualRate / 12;
    const n = parseFloat(document.getElementById('term').value) * 12;
    const taxesMonthly = parseFloat(document.getElementById('taxes').value) / 12;
    const insuranceMonthly = parseFloat(document.getElementById('insurance').value) / 12;
    const downPercent = 20; // Simplified; assume PMI if <20%
    const pmiMonthly = (P * parseFloat(document.getElementById('pmi').value) / 100 / 12) || 0;
    const extra = parseFloat(document.getElementById('extraMonthly').value) || 0;
    const biweekly = document.getElementById('biweekly').checked;

    // Standard monthly P&I
    let monthlyPI = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    let payment = monthlyPI + taxesMonthly + insuranceMonthly + pmiMonthly + extra;

    let totalInterest = 0;
    let balance = P;
    let months = 0;
    let payments = [];

    if (biweekly) {
        const biPayment = payment / 2 + extra / 2; // Approximate
        while (balance > 0) {
            let interest = balance * r;
            let principal = biPayment - interest;
            if (principal > balance) principal = balance;
            balance -= principal;
            totalInterest += interest;
            months += 0.5; // Roughly
            payments.push({month: months, balance: balance});
        }
        payment = biPayment * 26 / 12; // Effective monthly
    } else {
        while (balance > 0 && months < n * 2) { // Safety
            let interest = balance * r;
            let principal = monthlyPI + extra - interest;
            if (principal > balance) principal = balance;
            balance -= principal;
            totalInterest += interest;
            months++;
            payments.push({month: months, balance: Math.max(balance, 0)});
        }
    }

    const yearsSaved = (n - months) / 12;
    const totalPaid = payment * (biweekly ? months * 2 : months);
    const savings = (monthlyPI * n - totalPaid + P) ; // Rough interest savings

    let output = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="p-6 bg-gradient-to-br from-[#002B5C]/10 to-[#00A89D]/10 rounded-2xl">
                <h4 class="text-xl font-bold mb-4">Standard Monthly</h4>
                <p><strong>P&I:</strong> $${monthlyPI.toFixed(2)}</p>
                <p><strong>Total Monthly (PITI + Extra):</strong> $${payment.toFixed(2)}</p>
                <p><strong>Lifetime Interest:</strong> $${(monthlyPI * n - P).toFixed(2)}</p>
                <p><strong>Total Paid:</strong> $${(payment * n).toFixed(2)}</p>
            </div>
            <div class="p-6 bg-gradient-to-br from-[#F15A29]/10 to-[#00A89D]/10 rounded-2xl">
                <h4 class="text-xl font-bold mb-4">With Current Options</h4>
                <p><strong>Effective Payment:</strong> $${payment.toFixed(2)}</p>
                <p><strong>Payoff Time:</strong> ${Math.floor(months/12)} years ${months%12} months</p>
                <p><strong>Lifetime Interest:</strong> $${totalInterest.toFixed(2)}</p>
                <p><strong>Interest Savings:</strong> $${((monthlyPI * n - P) - totalInterest).toFixed(2)}</p>
                <p><strong>Years Saved:</strong> ${yearsSaved.toFixed(1)}</p>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <canvas id="pieChart"></canvas>
            <canvas id="balanceChart"></canvas>
        </div>
    `;

    document.getElementById('calc-output').innerHTML = output;

    // Pie Chart: Principal vs Interest
    new Chart(document.getElementById('pieChart'), {
        type: 'pie',
        data: {
            labels: ['Principal', 'Total Interest'],
            datasets: [{ data: [P, totalInterest], backgroundColor: ['#00A89D', '#F15A29'] }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    // Balance over time
    new Chart(document.getElementById('balanceChart'), {
        type: 'line',
        data: {
            labels: payments.map(p => `Month ${p.month}`),
            datasets: [{ label: 'Balance', data: payments.map(p => p.balance.toFixed(2)), borderColor: '#002B5C' }]
        },
        options: { responsive: true }
    });
}