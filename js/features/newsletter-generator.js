/**
 * js/features/newsletter-generator.js
 *
 * Newsletter Generator (with blog injection, personal updates, Outlook optimization, etc.)
 * Fully extracted from the monolith during Phase 1.
 *
 * Contains:
 * - All data arrays (heroImages, funFacts, proTips, motivationalQuotes)
 * - Persistence helpers and used-item tracking
 * - generateNewsletter (massive HTML templating engine)
 * - Preview rendering, download, copyForOutlook
 * - All related event wiring and auto-save logic
 *
 * Self-initializes. Exposes public API on window.
 */

(function () {
  'use strict';

  // =====================================================
  // ORIGINAL NEWSLETTER GENERATOR CODE (moved as-is)
  // =====================================================

let lastGeneratedHTML = '';
let _nlGenerating = false;

function safeParseJSONArray(storageKey, fallback = []) {
    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch (e) {
        return fallback;
    }
}

  window.openNewsletterTips = function openNewsletterTips() {
    const modal = document.getElementById('newsletter-tips-modal');
    if (!modal) return;
    if (typeof window.openAppModal === 'function') {
      window.openAppModal(modal);
    } else {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      modal.style.display = 'flex';
    }
  };

  window.closeNewsletterTips = function closeNewsletterTips() {
    const modal = document.getElementById('newsletter-tips-modal');
    if (!modal) return;
    if (typeof window.closeAppModal === 'function') {
      window.closeAppModal(modal);
    } else {
      modal.classList.remove('flex');
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  };

// Hero Images (20 pre-approved Midwest homes)
const heroImages = [
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Hero%20Images%20for%20Newsletter/b19e864a-dd57-45c4-b14e-4a340bfeb685.jpg',
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Hero%20Images%20for%20Newsletter/dd28ca22-d3c4-4daa-9815-daa158b78323.jpg',
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Hero%20Images%20for%20Newsletter/ae153c4c-7da5-4986-b17a-ab2acad38494.jpg',
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Hero%20Images%20for%20Newsletter/d7053e26-37c7-43eb-b84f-b2ead689cc63.jpg',
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Hero%20Images%20for%20Newsletter/7f7d08af-dcc0-4c94-af8d-5ea865ac3313.jpg',
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Hero%20Images%20for%20Newsletter/843dcb45-a38c-4a94-8052-23c3a6e91f75.jpg',
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Hero%20Images%20for%20Newsletter/b2d7dec1-2c83-4b6f-ba76-f2370a8a12bf.jpg',
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Hero%20Images%20for%20Newsletter/b46df8c7-92e5-49ff-af8e-f229a5f3e32e.jpg',
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Hero%20Images%20for%20Newsletter/eb140d96-c38a-4b24-a2c7-4f81ae05069c.jpg',
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Hero%20Images%20for%20Newsletter/783e9665-be29-4088-8a70-e8ea97f8e486.jpg',
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Hero%20Images%20for%20Newsletter/53c05549-9973-4435-b902-5097c8b77ed7.jpg',
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Hero%20Images%20for%20Newsletter/562fe8e0-95f9-4046-90f3-0bf32dd878b5.jpg',
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Hero%20Images%20for%20Newsletter/33c11766-8905-4a5d-aa4e-a66b42823cc2.jpg',
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Hero%20Images%20for%20Newsletter/62808031-ee6d-45e4-b276-2dc4fddfae36.jpg',
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Hero%20Images%20for%20Newsletter/568ba73e-1db8-4d5f-808a-bb2c831754c0.jpg',
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Hero%20Images%20for%20Newsletter/321ab441-3df2-4218-a41b-0f4277fb11cc.jpg',
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Hero%20Images%20for%20Newsletter/8b7a6aa8-56cc-489a-9134-f68f95132e97.jpg',
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Hero%20Images%20for%20Newsletter/9af36912-57ff-45f8-aea4-247b44d3b410.jpg',
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Hero%20Images%20for%20Newsletter/2e78d336-4725-4151-9f14-773557caa2fd.jpg',
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Hero%20Images%20for%20Newsletter/6efcde85-497f-4831-b210-1d0f4657c18b.jpg'
];

// === CURATED CONTENT LISTS ===
// Fun Facts (374 from your list)
const funFacts = [
    "The scientific term for brain freeze is “sphenopalatine ganglioneuralgia.”",
    "Canadians say “sorry” so much that a law was passed in 2009 declaring an apology can’t be used as evidence of admission of guilt.",
    "Back when dinosaurs existed, volcanoes were erupting on the moon.",
    "The only letters that don’t appear on the periodic table are “J” and “Q.”",
    "If a Polar Bear and a Grizzly Bear mate, their offspring is called a “Pizzy Bear.”",
    "In 2006, a Coca-Cola employee offered to sell secrets to Pepsi—but Pepsi notified Coca-Cola.",
    "The ten highest mountain summits in the United States are all in Alaska.",
    "Nintendo trademarked the phrase “It’s on like Donkey Kong” in 2010.",
    "A single strand of spaghetti is called a “Spaghetto.”",
    "Hershey’s Kisses are named after the kissing sound the chocolate makes as it falls onto the conveyor belt.",
    "Princess Peach didn’t move in early games because designers found it too complicated.",
    "The famous “I’m king of the world!” line in Titanic was improvised by Leonardo DiCaprio.",
    "If you point your car keys to your head, it increases the remote’s signal range (your head acts as a conductor).",
    "Fruit stickers are edible (though wash them first like the fruit).",
    "The giant anteater’s scientific name means “ant eating with three fingers.”",
    "“Astronaut” literally means “star sailor” in Ancient Greek.",
    "The flashes of colored light when you rub your eyes are called “phosphenes.”",
    "At birth, a baby panda is smaller than a mouse.",
    "Iceland has no railway system.",
    "The world’s largest grand piano was built by a 15-year-old in New Zealand—it’s over 18 feet long.",
    "The tongue is the only muscle attached at just one end.",
    "There’s a company in Japan that teaches people how to be funny.",
    "The Bagheera kiplingi spider is the only known vegetarian spider.",
    "Elvis Presley was naturally blonde and dyed his hair black.",
    "Ed Sheeran once flew to LA with no contacts and was taken in by Jamie Foxx.",
    "German chocolate cake is named after an American baker, Samuel German—not the country.",
    "The first known service animals date back to mid-16th century references.",
    "An 11-year-old girl suggested the name “Pluto” for the dwarf planet.",
    "The voice actors for SpongeBob and Plankton’s computer wife have been married since 1995.",
    "Octopuses have beaks made of keratin, like bird beaks.",
    "75% of the world’s diet comes from just 12 plants and five animal species.",
    "The original Star Wars (1977) premiered on only 32 screens.",
    "The British slogan “Keep Calm and Carry On” was never officially used until rediscovered in 2000.",
    "Tirana, Albania, is a European capital without a McDonald’s.",
    "Sour Patch Kids and Swedish Fish are made by the same company—the red ones are essentially the same candy with sour sugar.",
    "The largest Japanese population outside Japan is in Brazil (1.6 million).",
    "IKEA stands for the founder’s initials plus his farm and hometown.",
    "Stephen Hawking once held a party for time travelers but only publicized it afterward—no one showed up.",
    "Violin bows are commonly made from horse hair.",
    "There’s an underwater version of rugby played while freediving.",
    "Standing burns about 114 calories per hour for a 150-pound person.",
    "GPS costs $2 million a day to operate, funded by U.S. taxes.",
    "If Earth were flat, you could see a candle flame from 30 miles away on a dark night.",
    "A cluster of bananas is called a “hand,” and a single banana is a “finger.”",
    "Swedish meatballs originated from a recipe King Charles XII brought back from Turkey.",
    "Saint Lucia is the only country named after a woman.",
    "Cats have furry “ear furnishings” that keep dirt out and help hearing.",
    "There’s a town in Nebraska with a population of one—she’s the mayor, bartender, and librarian.",
    "The Ethiopian calendar is 13 months and about 7.5 years behind the Gregorian one.",
    "China built panda-shaped solar farms to interest young people in renewable energy.",
    "Mercury and Venus have no moons.",
    "To write adjectives correctly, order them: amount, value, size, temperature, age, shape, color, origin, material.",
    "The world’s first motel opened in 1925 in San Luis Obispo, California.",
    "Sudan has more pyramids than Egypt (around 255).",
    "The bumblebee bat is the world’s smallest flying mammal.",
    "The human circulatory system stretches over 60,000 miles.",
    "Africa spans all four hemispheres.",
    "Humans can distinguish about 10 million colors.",
    "The world’s first animated feature film was a 1917 Argentine satire.",
    "The Philippines has 7,641 islands.",
    "The Trans-Siberian Railway crosses eight time zones.",
    "Earth’s core has enough gold to coat the planet’s surface 1.5 feet deep.",
    "Only 0.007% of Earth’s water is accessible to humans.",
    "Spam’s name came from a contest, not an acronym.",
    "A drop of water takes 90 days to travel the Mississippi River.",
    "Beefalo (cow-bison hybrid) has less fat and more protein than regular beef.",
    "Johnny Appleseed’s trees produced cider apples, not eating apples.",
    "Scots have 421 words for snow.",
    "Samsung tests phone durability with a butt-shaped robot.",
    "Chicago’s “Windy City” nickname refers to boastful politicians, not weather.",
    "Peanuts are legumes, not nuts.",
    "Armadillo shells are bulletproof.",
    "Firefighters use “wet water” to make it spread better.",
    "The longest English word (titin) has 189,819 letters.",
    "Giant Pacific octopuses can lay up to 56,000 eggs.",
    "Cats have five toes on front paws, four on back.",
    "Kleenex was originally from WWI gas mask filters.",
    "Blue whales consume 457,000 calories in one mouthful.",
    "Jeans’ tiny pocket was for pocket watches.",
    "Turkeys change head color when excited.",
    "Disney characters wear gloves to make hands stand out in animation.",
    "Tim Storms has a 10-octave vocal range.",
    "The U.S. flag design was a 1958 high school project.",
    "Cows have no upper front teeth.",
    "NASA 3D-prints tools on the Space Station.",
    "Only a quarter of the Sahara is sandy.",
    "Bananas grow upside down, curving toward the sun.",
    "Moon volcanoes were active during the dinosaur era.",
    "Dogs sniff pleasant smells with their left nostril, threats with the right.",
    "Avocados are named after an Aztec word meaning testicles.",
    "No number before 1,000 contains the letter “A.”",
    "The # symbol is technically an octothorpe.",
    "Movie trailers originally played after films.",
    "Giraffe tongues are dark to prevent sunburn.",
    "Montpelier, Vermont, has no McDonald’s.",
    "Rats dream about their day.",
    "The Eiffel Tower grows a few millimeters in summer heat.",
    "Glitter was invented accidentally in 1934.",
    "Frankenstein’s monster is vegetarian in the novel.",
    "Three-fingered sloths have more neck bones than giraffes.",
    "Bees can fly higher than Mount Everest.",
    "Ancient Egyptians placed onions in pharaohs’ eyes for eternal life symbolism.",
    "Beethoven introduced the trombone to nonreligious music.",
    "A Pixar employee’s home backup saved Toy Story 2 from deletion.",
    "Nike’s waffle sole was inspired by a breakfast waffle iron.",
    "Wild boars wash sandy food before eating.",
    "The first commercial flight lasted 23 minutes and cost $400.",
    "Nigel Richards won the French Scrabble world championship without speaking French.",
    "Bananas fluoresce blue under black light.",
    "Tennis balls became neon yellow in 1972 for TV visibility.",
    "Mister Rogers announced he was feeding his fish for a blind viewer.",
    "Boring, Oregon, and Dull, Scotland, are sister cities.",
    "Dolly Parton has donated over 100 million books to children.",
    "The 100 folds in a chef’s hat represent 100 ways to cook an egg.",
    "Blood donors in Sweden get a text when their blood is used.",
    "Kea parrots “laugh” infectiously when happy.",
    "Melbourne trees with email addresses received love letters.",
    "An estimated 1 million U.S. dogs are primary beneficiaries in wills.",
    "Central Park lampposts have codes to help navigation.",
    "Sleep flushes toxins from the brain.",
    "The Waffle House Index helps FEMA gauge storm severity.",
    "Route 66 in New Mexico plays “America the Beautiful” via rumble strips.",
    "Space smells like diesel, gunpowder, and barbecue.",
    "The Seven Dwarfs were almost named Chesty, Tubby, Burpy, etc.",
    "Ben & Jerry split a $5 ice cream course.",
    "Tootsie Rolls were durable WWII rations.",
    "Marie Curie is the only person with Nobels in two sciences.",
    "The ampersand comes from “et” (Latin for “and”).",
    "Dogs understand up to 250 words.",
    "Bubbles keep bathwater warmer longer.",
    "Pompeii had take-out restaurants.",
    "Fried chicken came to America via Scottish immigrants.",
    "There are 71 Atlanta streets with “Peachtree” in the name.",
    "Goats have rectangular pupils.",
    "The flamingo’s “knee” is actually an ankle.",
    "A group of pugs is called a grumble.",
    "Crayola means “oily chalk.”",
    "A banana is a berry; a strawberry isn’t.",
    "Continental plates drift as fast as fingernails grow.",
    "LEGO keeps every set ever made in an underground vault.",
    "Reindeer eyes turn blue in winter.",
    "Avocados ripen only after picking—trees act as natural storage.",
    "Kid volunteers read to shelter dogs to calm them.",
    "China rents out all giant pandas for $1 million/year.",
    "Bald eagles mate for life.",
    "Lobsters have blue blood.",
    "The liver fully regenerates.",
    "Babies have more bones than adults (some fuse).",
    "France has 12 time zones.",
    "It takes 540 peanuts for a 12-ounce jar of peanut butter.",
    "Alan Shepard golfed on the moon.",
    "Isaac Newton invented the color wheel.",
    "The oldest land animal is a 192-year-old tortoise named Jonathan.",
    "A group of owls is a parliament.",
    "Honey never spoils.",
    "Central Park is larger than Monaco.",
    "Australia is wider than the moon.",
    "Venus spins clockwise.",
    "Lemons float; limes sink.",
    "The hashtag is officially an octothorpe.",
    "The jeans pocket was for pocket watches.",
    "All mammals get goosebumps.",
    "Japan has one vending machine per 40 people.",
    "Bottlenose dolphins have individual names.",
    "Clownfish are born male and can become female.",
    "The brain burns 400–500 calories daily.",
    "Tea is the second-most popular beverage after water.",
    "Fruit flies were the first animals in space.",
    "A baby kangaroo is a joey.",
    "A group of hyenas is a cackle.",
    "Tongue prints are unique.",
    "An ostrich’s eye is bigger than its brain.",
    "Octopuses have three hearts.",
    "The shoelace tip is an aglet.",
    "Cats sleep 15 hours a day on average.",
    "Bats are the only flying mammals.",
    "Watermelon is 92% water.",
    "Tomatoes are fruits.",
    "Pineapples take 2–3 years to grow.",
    "A sheep was the first cloned animal.",
    "Jupiter is the largest planet.",
    "Mercury is closest to the sun.",
    "Platypuses sweat milk.",
    "Bananas glow blue under black light.",
    "Vatican City is the smallest country.",
    "Cap’n Crunch’s full name is Horatio Magellan Crunch.",
    "The Hollywood sign originally said Hollywoodland.",
    "Peanuts are legumes.",
    "The Amazon is the biggest river.",
    "The Burj Khalifa is the tallest building.",
    "Asia is the largest continent.",
    "The Great Barrier Reef is the largest coral reef.",
    "The blue whale is the largest animal.",
    "Dogs sweat through paws.",
    "Butterflies taste with feet.",
    "The sun’s surface is about 10,000°F.",
    "One quarter of your bones are in your feet.",
    "There are over 1 million insect species.",
    "M&M’s were first eaten in space.",
    "Lions sleep up to 21 hours.",
    "The world’s longest bowling alley has 116 lanes.",
    "Tug-of-war was an Olympic sport 1900–1920.",
    "The longest concert lasted 453 hours.",
    "All mammals get goosebumps.",
    "Japan has one vending machine per 40 people.",
    "Bottlenose dolphins have individual names.",
    "Frida Kahlo painted 55 self-portraits.",
    "NFL referees get Super Bowl rings.",
    "Four countries have wordless anthems.",
    "Walt Disney has 26 Oscars.",
    "Clouds weigh over a million pounds on average.",
    "Animals can be allergic to humans.",
    "The average golf ball has 336 dimples.",
    "The specks on strawberries are seeds.",
    "The hardest bone is the femur.",
    "Honey doesn’t spoil.",
    "Central Park is bigger than Monaco.",
    "Australia is wider than the moon.",
    "Venus spins clockwise.",
    "Human teeth can’t heal themselves.",
    "Lemons float; limes sink.",
    "The tiny jeans pocket was for pocket watches.",
    "Penicillin was once called “mold juice.”",
    "No number before 1,000 has the letter A.",
    "Sudan has the most pyramids.",
    "The circulatory system is 60,000 miles long.",
    "Africa is in all four hemispheres.",
    "The first animals in space were fruit flies.",
    "The longest-named dinosaur is Micropachycephalosaurus.",
    "A baby kangaroo is a joey.",
    "A group of hyenas is a cackle.",
    "An ostrich’s eye is bigger than its brain.",
    "The shoelace tip is an aglet.",
    "Cats sleep 15 hours daily.",
    "Baby hedgehogs are hoglets.",
    "Watermelon is 92% water.",
    "Pineapples take 2–3 years to grow.",
    "Ketchup was once medicine.",
    "A sheep was the first cloned animal.",
    "Jupiter is the largest planet.",
    "Mercury is closest to the sun.",
    "A mile is 5,280 feet.",
    "Only male toads croak loudly.",
    "Bananas glow blue under black light.",
    "The oldest cat lived to 38 years and 3 days.",
    "Vatican City is the smallest country.",
    "Cap’n Crunch’s full name is Horatio Magellan Crunch.",
    "The Hollywood sign originally said Hollywoodland.",
    "Peanuts are legumes.",
    "The Amazon is the biggest river.",
    "The Burj Khalifa is the tallest building.",
    "Asia is the largest continent.",
    "The Great Barrier Reef is the largest coral reef.",
    "The blue whale is the largest animal.",
    "Dogs sweat through paws.",
    "Butterflies taste with feet.",
    "The sun’s surface is about 10,000°F.",
    "One quarter of your bones are in your feet.",
    "There are over 1 million insect species.",
    "M&M’s were first eaten in space."
];

// Pro Tips (from your document)
const proTips = [
    // ==================== HOME MAINTENANCE & CARE (Prevent Costly Surprises) ====================
    "Home Maintenance & Care: Winter Gutter Check — Frozen gutters cause ice dams that damage roofs and siding—thousands in repairs. After the next thaw, clear debris from gutters/downspouts. Use a leaf blower extension from the ground if ladders aren’t your thing. Works great in IN, OH, MI, and KY.",
    "Home Maintenance & Care: Change HVAC Filters Every 60-90 Days — Dirty filters raise energy bills 5-15% and shorten system life. Buy a 6-pack and swap them out regularly for better air quality and lower bills from Duke, NIPSCO, AEP, DTE, or Consumers Energy.",
    "Home Maintenance & Care: Test Your Sump Pump Before Spring Rains — Pour a bucket of water into the pit. If it doesn’t activate and drain, basement flooding is a real risk. Test now to avoid emergency calls during Midwest storms.",
    "Home Maintenance & Care: Seal Windows and Doors for Winter — Drafts waste 10-20% of heating energy. Feel for leaks and apply weatherstripping or caulk for noticeable savings.",
    "Home Maintenance & Care: Flush Your Water Heater Annually — Remove sediment to improve efficiency and extend the life of the unit. Simple 15-20 minute task that can delay a $1,000+ replacement.",
    "Home Maintenance & Care: Clean Dryer Vents Twice a Year — Lint buildup is a leading cause of home fires and makes dryers less efficient. Clean it yourself with a kit or hire a pro.",
    "Home Maintenance & Care: Replace Smoke & CO Detector Batteries Yearly — Do it when you change clocks for daylight saving time. Working detectors are required by law in Indiana, Ohio, Michigan, and Kentucky.",
    "Home Maintenance & Care: Inspect Roof Spring and Fall — Look for missing shingles or moss from the ground using binoculars. Early repairs prevent major leaks during storms.",
    "Home Maintenance & Care: Clean Refrigerator Coils Twice a Year — Dusty coils add $50–100 to your yearly electric bill. Unplug and vacuum them for better efficiency.",
    "Home Maintenance & Care: Check Exterior Caulking — Cracked caulk lets water in, causing rot and mold. Reapply on a dry day to protect your home.",
    "Home Maintenance & Care: Service Lawn Mower Before Spring — Sharpen blade, change oil, and replace air filter. Better cuts, less gas, and longer mower life.",
    "Home Maintenance & Care: Inspect Attic Insulation — Midwest winters demand good insulation. Measure depth and add more if needed — many utilities offer rebates.",
    "Home Maintenance & Care: Clean Range Hood Filters Monthly — Greasy filters reduce airflow and increase fire risk. Soak in hot soapy water.",
    "Home Maintenance & Care: Test GFCI Outlets Monthly — Especially in kitchens and bathrooms. Press the test button to keep your family safe.",
    "Home Maintenance & Care: Deep Clean Garbage Disposal Monthly — Use ice cubes, rock salt, and citrus peels to prevent odors and buildup.",
    "Home Maintenance & Care: Inspect Foundation for Cracks — Walk around after heavy rain. Seal small cracks yourself; call a pro for larger ones.",
    "Home Maintenance & Care: Clean or Replace Showerheads — Mineral buildup reduces water pressure. Soak in vinegar overnight or replace for better showers.",
    "Home Maintenance & Care: Check Deck/Patio for Rot — Probe wood with a screwdriver. Seal or replace boards early to prevent collapse.",
    "Home Maintenance & Care: Clean Chimney Annually (If You Have One) — Creosote buildup is a fire hazard. Hire a certified sweep before winter.",
    "Home Maintenance & Care: Inspect Trees Near House — Trim dead or overhanging branches before storm season to protect your roof and power lines.",
    "Home Maintenance & Care: Clean Washing Machine Monthly — Run an empty hot cycle with vinegar or Affresh tablets to prevent mold and odors.",
    "Home Maintenance & Care: Check Door Weatherstripping — Replace worn strips to stop drafts and keep critters out.",
    "Home Maintenance & Care: Inspect Crawl Space/Basement for Moisture — Look for dampness after heavy rain. Add a dehumidifier if needed.",
    "Home Maintenance & Care: Clean Outdoor AC Unit Spring/Fall — Hose off fins gently (power off first) to improve efficiency during hot summers.",
    "Home Maintenance & Care: Test Garage Door Auto-Reverse — Place a broom under the door. If it doesn’t reverse, adjust or call a pro — safety first.",
    "Home Maintenance & Care: Clean Gutters in Fall AND Spring — Leaves in fall, pollen and seeds in spring. Prevents blockages and ice dams.",
    "Home Maintenance & Care: Inspect Fireplace Damper — Ensure it opens and closes fully to prevent heat loss when not in use.",
    "Home Maintenance & Care: Check Exterior Paint for Peeling — Touch up peeling areas early to prevent wood rot and siding damage.",
    "Home Maintenance & Care: Clean Microwave Vent — Grease buildup reduces effectiveness. Wipe interior monthly and clean filter quarterly.",
    "Home Maintenance & Care: Inspect Septic System (If Applicable) — Pump every 3-5 years to prevent expensive backups.",
    "Home Maintenance & Care: Test Backup Sump Pump Battery — Make sure it works when power goes out during heavy Midwest storms.",
    "Home Maintenance & Care: Test Radon Levels — Especially important in basements. Inexpensive test kits are available at hardware stores across IN, OH, MI, KY.",
    "Home Maintenance & Care: Lubricate Door Hinges and Locks — A quick spray of WD-40 stops squeaks and extends hardware life.",
    "Home Maintenance & Care: Clean Dishwasher Filter Monthly — Prevents odors and keeps dishes sparkling without extra cycles.",
    "Home Maintenance & Care: Inspect Siding and Trim for Damage — Look for cracks or gaps after winter. Seal early to prevent water intrusion.",
    "Home Maintenance & Care: Check for Pest Entry Points — Seal gaps around pipes, vents, and doors with steel wool and caulk.",
    "Home Maintenance & Care: Clean or Replace Furnace Filter — Dirty filters strain your system and raise bills. Replace every 1-3 months.",
    "Home Maintenance & Care: Inspect Garage Door Springs and Cables — Worn parts can cause sudden failure. Have a pro check annually.",
    "Home Maintenance & Care: Clean Bathroom Exhaust Fans — Dust and lint buildup reduces airflow. Clean quarterly for better moisture control.",
    "Home Maintenance & Care: Check for Leaking Faucets — A slow drip can waste hundreds of gallons of water per year. Fix or replace washers.",
    "Home Maintenance & Care: Inspect Caulking Around Bathtubs and Showers — Re-caulk to prevent water damage behind walls.",
    "Home Maintenance & Care: Test All Ground Fault Circuit Interrupters (GFCIs) — Reset if needed in wet areas.",
    "Home Maintenance & Care: Clean Range Hood Filter — Greasy buildup reduces effectiveness and increases fire risk.",
    "Home Maintenance & Care: Inspect Water Softener Salt Levels — Keep it filled to prevent hard water damage to pipes and appliances.",
    "Home Maintenance & Care: Check for Ice Dams on Roof After Heavy Snow — Remove safely or hire a pro to prevent water backup into attic.",
    "Home Maintenance & Care: Clean Leaf Debris from Window Wells — Prevents water from entering basements during heavy rain.",
    "Home Maintenance & Care: Lubricate Garage Door Tracks and Rollers — Smooth operation prevents premature wear.",
    "Home Maintenance & Care: Inspect Downspout Extensions — Make sure they direct water away from the foundation.",
    "Home Maintenance & Care: Clean Refrigerator Door Gaskets — Dirty gaskets cause your fridge to work harder and raise energy bills.",
    "Home Maintenance & Care: Check for Termite Activity — Look for mud tubes or discarded wings, especially in humid Midwest summers.",
    "Home Maintenance & Care: Inspect Soffits and Fascia for Rot — Early detection prevents costly repairs to roofline.",
    "Home Maintenance & Care: Clean Window Tracks — Dirt and debris can cause windows to stick and let in drafts.",
    "Home Maintenance & Care: Test Carbon Monoxide Detectors — Replace batteries and units older than 7-10 years.",
    "Home Maintenance & Care: Clean Pet Hair from Dryer Vent — Extra buildup from pets increases fire risk and drying time.",
    "Home Maintenance & Care: Inspect Fence Posts for Rot — Replace or reinforce before they fail in storms.",
    "Home Maintenance & Care: Clean Gutters After Leaf Drop and Again in Spring — Twice yearly is ideal in the Midwest.",
    "Home Maintenance & Care: Check for Bird Nests in Vents — Remove safely to maintain proper airflow and prevent fire hazards.",
    "Home Maintenance & Care: Clean Ceiling Fans — Dust buildup makes them less efficient and can spread allergens.",
    "Home Maintenance & Care: Inspect Chimney Crown for Cracks — Prevents water from entering the chimney structure.",
    "Home Maintenance & Care: Clean Outdoor Light Fixtures — Dirt reduces brightness and wastes energy.",
    "Home Maintenance & Care: Check for Proper Grading Around Foundation — Ensure water flows away from the house.",
    "Home Maintenance & Care: Clean Kitchen Cabinet Tops — Dust and grease buildup attracts pests.",
    "Home Maintenance & Care: Check for Proper Ventilation in Attic — Prevents moisture buildup and ice dams.",
    "Home Maintenance & Care: Clean Pet Hair from HVAC Registers — Improves airflow and reduces allergens.",
    "Home Maintenance & Care: Inspect for Proper Sump Pump Discharge — Make sure water is directed far from the foundation.",

    // ==================== SMART MONEY MOVES FOR HOMEOWNERS ====================
    "Smart Money Moves: File for Homestead Deduction — Available in Indiana, Ohio, Michigan, and Kentucky. Caps taxable value increases and can save you hundreds per year.",
    "Smart Money Moves: Track Capital Improvements — Keep receipts for roof, HVAC, kitchen, or bath upgrades. This raises your cost basis and reduces capital gains tax when you sell.",
    "Smart Money Moves: Build a Dedicated House Fund — Set aside 1–2% of your home’s value each year in a high-yield savings account for repairs and emergencies.",
    "Smart Money Moves: Annual Homeowners Insurance Review — Shop every 2–3 years and bundle with auto. Many families save 15–30%.",
    "Smart Money Moves: Take Advantage of Utility Rebates — Duke Energy, AEP, NIPSCO, DTE, Consumers Energy, and Kentucky utilities offer rebates for energy upgrades.",
    "Smart Money Moves: Make Extra Principal Payments — Even $50–100 extra per month can shave years off your mortgage and save thousands in interest.",
    "Smart Money Moves: Energy Efficiency Tax Credits — Federal credits up to $3,200+ for windows, insulation, and heat pumps. Stack with state incentives.",
    "Smart Money Moves: Review Your Property Tax Assessment — If it seems high, appeal with recent comparable sales.",
    "Smart Money Moves: High-Yield Emergency Fund — Keep 3–6 months of expenses (including mortgage) in an online savings account earning 4–5%.",
    "Smart Money Moves: Bundle Cable/Internet Annually — Call your provider for retention deals — many save $20–50 per month.",
    "Smart Money Moves: Install a Smart Thermostat — Cuts heating/cooling costs by 10–15%. Many utilities offer rebates.",
    "Smart Money Moves: LED Bulb Swap — Saves $50–100 yearly and lasts 10+ years.",
    "Smart Money Moves: Lower Water Heater to 120°F — Simple adjustment that saves 3–5% on water heating.",
    "Smart Money Moves: Create a Home Inventory — Photograph valuables and store in the cloud for faster insurance claims.",
    "Smart Money Moves: Review Escrow Account Annually — Overpayments can be refunded by your mortgage servicer.",
    "Smart Money Moves: Over 65 Circuit Breaker Credit — Protects qualifying seniors from large property tax increases in all four states.",
    "Smart Money Moves: Veteran Property Tax Exemptions — Additional relief available in IN, OH, MI, and KY for qualifying veterans.",
    "Smart Money Moves: Shop Homeowners Insurance Every 2-3 Years — Switching can save 10-25% with the same or better coverage.",
    "Smart Money Moves: Take Advantage of Federal Energy Credits — Up to $3,200 for qualifying home improvements in 2026.",
    "Smart Money Moves: Annual Mortgage Escrow Review — Make sure you're not overpaying into escrow.",
    "Smart Money Moves: Consider a Home Equity Line of Credit (HELOC) — Flexible access to equity for home projects or emergencies.",
    "Smart Money Moves: Track Utility Usage Monthly — Spot unusual spikes early and address them before bills get out of hand.",
    "Smart Money Moves: Use Cash-Back Credit Cards for Home Purchases — Earn rewards on tools, materials, and repairs.",
    "Smart Money Moves: Set Up Automatic Bill Pay for Utilities — Avoid late fees and keep your credit score strong.",
    "Smart Money Moves: Review Credit Report Annually — Free once per year at AnnualCreditReport.com. Fix errors that could affect mortgage rates.",
    "Smart Money Moves: Consider Mortgage Recasting — After a large principal payment, ask your lender to re-amortize to lower monthly payments.",
    "Smart Money Moves: Compare Mortgage Rates Every Year — Even if you don't refinance, knowing current rates helps you plan.",
    "Smart Money Moves: Use Tax Software to Maximize Deductions — Tools like TurboTax pull mortgage interest and property taxes automatically.",
    "Smart Money Moves: Build Equity Through Home Improvements — Kitchen and bath updates often give the best return on investment.",
    "Smart Money Moves: Pay Bi-Weekly Instead of Monthly — Makes one extra payment per year and reduces interest significantly.",

    // ==================== EQUITY & REFINANCE CHECKUP ====================
    "Equity & Refinance: Refinance Benchmark — A 0.75–1% rate drop plus staying in the home 3+ years often makes refinancing worthwhile.",
    "Equity & Refinance: Cash-Out vs HELOC — Cash-out gives a fixed rate and new term. HELOC offers flexibility. Choose based on your specific goal.",
    "Equity & Refinance: Build Equity Faster — Make extra payments, recast after a large lump sum, or complete value-adding projects.",
    "Equity & Refinance: Automatic PMI Removal — Once you reach 20% equity, request cancellation to save $50–200 per month.",
    "Equity & Refinance: Annual Equity Review — Pull a free home value estimate and compare it to your remaining mortgage balance.",
    "Equity & Refinance: Shop Multiple Lenders — Getting quotes from at least 3 lenders can save you thousands over the life of the loan.",
    "Equity & Refinance: Rate-and-Term Refinance — Lowers your interest rate or shortens the term without taking cash out.",
    "Equity & Refinance: Cash-Out Refinance — Pull equity for debt consolidation, home improvements, or other needs.",
    "Equity & Refinance: HELOC for Ongoing Projects — Great for renovations because you only pay interest on what you draw.",
    "Equity & Refinance: Check Your Credit Score Before Refinancing — Higher scores often qualify for better rates.",
    "Equity & Refinance: Compare Closing Costs Carefully — Shop lenders not just on rate but on total fees.",
    "Equity & Refinance: Consider a 15-Year Mortgage — Pay off faster and save tens of thousands in interest if your budget allows.",

    // ==================== LOCAL LIVING PERKS (4-State Focused) ====================
    "Local Living Perks: Homestead Exemptions — Available in Indiana, Ohio, Michigan, and Kentucky. Reduces your taxable assessed value and can save hundreds annually.",
    "Local Living Perks: Utility Energy Rebates — Check Duke Energy, AEP, NIPSCO, DTE, Consumers Energy, and Kentucky utilities for rebates on energy-efficient upgrades.",
    "Local Living Perks: State Weatherization Assistance — Programs in IN, OH, MI, and KY can help with insulation and efficiency improvements.",
    "Local Living Perks: Senior / Veteran / Disability Property Tax Relief — Additional deductions or credits available in all four states.",
    "Local Living Perks: Public Library Tool Lending — Many libraries across IN, OH, MI, and KY lend tools like pressure washers and tile cutters for free.",
    "Local Living Perks: County Fair Vendor Deals — Many summer fairs in the four states have contractor discount days for home projects.",
    "Local Living Perks: Indiana Energy Saver Program — Up to $8,000 in rebates for heat pumps and whole-home efficiency upgrades.",
    "Local Living Perks: Michigan Home Energy Assistance — Help with weatherization and utility bill assistance for eligible residents.",
    "Local Living Perks: Ohio Home Energy Assistance Program — Grants and rebates for energy efficiency improvements.",
    "Local Living Perks: Kentucky Weatherization Assistance — Free or low-cost home upgrades for qualifying low-income households.",

    // ==================== ADDITIONAL HIGH-VALUE TIPS ====================
    "Smart Money Moves: Create a Home Inventory — Photograph valuables and store in the cloud. Makes insurance claims much faster after storms or theft.",
    "Smart Money Moves: Review Escrow Account Annually — Overpayments in escrow can be refunded by your mortgage servicer.",
    "Home Maintenance & Care: Test Backup Sump Pump Battery — Make sure it works when power goes out during heavy Midwest storms.",
    "Smart Money Moves: Over 65 Circuit Breaker Credit — Protects qualifying seniors from large property tax increases in all four states.",
    "Home Maintenance & Care: Clean Pet Hair from Dryer Vent — Extra buildup from pets increases fire risk and drying time.",
    "Smart Money Moves: Use Cash-Back Credit Cards for Home Purchases — Earn rewards on tools, materials, and repairs.",
    "Home Maintenance & Care: Inspect Soffits and Fascia for Rot — Early detection prevents costly repairs to roofline.",
    "Smart Money Moves: Set Up Automatic Bill Pay for Utilities — Avoid late fees and keep your credit score strong.",
    "Home Maintenance & Care: Check for Bird Nests in Vents — Remove safely to maintain proper airflow and prevent fire hazards.",
    "Smart Money Moves: Review Credit Report Annually — Free once per year. Fix errors that could affect future mortgage rates.",
    "Home Maintenance & Care: Lubricate Garage Door Tracks and Rollers — Smooth operation prevents premature wear.",
    "Smart Money Moves: Compare Mortgage Rates Every Year — Even if you don't refinance, knowing current rates helps you plan.",
    "Home Maintenance & Care: Clean Window Tracks — Dirt and debris can cause windows to stick and let in drafts.",
    "Smart Money Moves: Use Tax Software to Maximize Deductions — Tools like TurboTax pull mortgage interest and property taxes automatically.",
    "Home Maintenance & Care: Inspect for Termite Activity — Look for mud tubes or discarded wings, especially in humid Midwest summers.",
    "Smart Money Moves: Build Equity Through Home Improvements — Kitchen and bath updates often give the best return on investment.",
    "Home Maintenance & Care: Check for Ice Dams on Roof After Heavy Snow — Remove safely or hire a pro to prevent water backup into attic.",
    "Smart Money Moves: Pay Bi-Weekly Instead of Monthly — Makes one extra payment per year and reduces interest significantly.",
    "Home Maintenance & Care: Clean Leaf Debris from Window Wells — Prevents water from entering basements during heavy rain.",
    "Smart Money Moves: Consider Mortgage Recasting — After a large principal payment, ask your lender to re-amortize to lower monthly payments.",
    "Home Maintenance & Care: Inspect Downspout Extensions — Make sure they direct water away from the foundation.",
    "Smart Money Moves: Track Utility Usage Monthly — Spot unusual spikes early and address them before bills get out of hand.",
    "Home Maintenance & Care: Clean Refrigerator Door Gaskets — Dirty gaskets cause your fridge to work harder and raise energy bills.",
    "Smart Money Moves: Shop Homeowners Insurance Every 2-3 Years — Loyalty discounts fade. Switching can save 10-25%.",
    "Home Maintenance & Care: Check for Pest Entry Points — Seal gaps around pipes, vents, and doors.",
    "Smart Money Moves: Annual Mortgage Statement Review — Make sure your escrow is accurate and you're not overpaying.",
    "Home Maintenance & Care: Clean Bathroom Exhaust Fans — Dust and lint buildup reduces airflow. Clean quarterly.",
    "Smart Money Moves: Consider a 15-Year Mortgage — Pay off faster and save tens of thousands in interest if your budget allows.",
    "Home Maintenance & Care: Inspect Fence Posts for Rot — Replace or reinforce before they fail in storms.",
    "Smart Money Moves: HELOC for Home Projects — Flexible line of credit for renovations or emergencies.",
    "Home Maintenance & Care: Clean Microwave Vent Filter — Grease buildup reduces effectiveness and increases fire risk.",
    "Smart Money Moves: Compare Closing Costs Carefully When Refinancing — Shop lenders not just on rate but on total fees.",
    "Home Maintenance & Care: Check for Leaking Faucets — A slow drip can waste hundreds of gallons of water per year.",
    "Smart Money Moves: Use Tax-Advantaged Accounts for Home Repairs — HSA or FSA if eligible for certain medical-related home modifications.",
    "Home Maintenance & Care: Review Flood Insurance Needs — Especially important in flood-prone areas of the four states.",
    "Home Maintenance & Care: Clean Ceiling Fans — Dust buildup makes them less efficient and can spread allergens.",
    "Smart Money Moves: Compare Internet Providers Annually — Switching can save money and improve speeds.",
    "Home Maintenance & Care: Inspect Garage Door Springs and Cables — Have a pro check annually for safety.",
    "Smart Money Moves: Use Apps to Track Home Maintenance — Reminders for filter changes, gutter cleaning, etc.",
    "Home Maintenance & Care: Check for Proper Sump Pump Discharge — Make sure water is directed far from the foundation.",
    "Smart Money Moves: Consider Title Insurance Review — Especially if you’ve owned the home for many years.",
    "Home Maintenance & Care: Clean Kitchen Cabinet Tops — Dust and grease buildup attracts pests.",
    "Smart Money Moves: Set a Home Maintenance Budget — 1% of home value per year is a good rule of thumb.",
    "Smart Money Moves: Review Life Insurance Needs After Buying a Home — Ensure coverage protects your family and mortgage.",
    "Home Maintenance & Care: Inspect Chimney Crown for Cracks — Prevents water from entering the chimney structure.",
    "Smart Money Moves: Take Photos of Major Repairs — Document work for insurance and future buyers.",
    "Home Maintenance & Care: Check for Proper Grading Around Foundation — Ensure water flows away from the house.",
    "Smart Money Moves: Consider Energy Audits — Many utilities offer free or low-cost audits to identify savings opportunities."
];
// Motivational Quotes (placeholder — send your list and I'll add)
const motivationalQuotes = [
    "\"The only way to do great work is to love what you do.\" – Steve Jobs",
    "\"Believe you can and you're halfway there.\" – Theodore Roosevelt",
    "\"Success is not final, failure is not fatal: It is the courage to continue that counts.\" – Winston Churchill",
    "\"Your time is limited, so don't waste it living someone else's life.\" – Steve Jobs",
    "\"The future belongs to those who believe in the beauty of their dreams.\" – Eleanor Roosevelt",
    "\"It does not matter how slowly you go as long as you do not stop.\" – Confucius",
    "\"Everything you've ever wanted is on the other side of fear.\" – George Addair",
    "\"The only limit to our realization of tomorrow will be our doubts of today.\" – Franklin D. Roosevelt",
    "\"You miss 100% of the shots you don't take.\" – Wayne Gretzky",
    "\"Whether you think you can or you think you can't, you're right.\" – Henry Ford",
    "\"I attribute my success to this: I never gave or took any excuse.\" – Florence Nightingale",
    "\"The best way to predict the future is to create it.\" – Peter Drucker",
    "\"Fall seven times, stand up eight.\" – Japanese Proverb",
    "\"Don't watch the clock; do what it does. Keep going.\" – Sam Levenson",
    "\"The harder the conflict, the greater the triumph.\" – George Washington",
    "\"What you get by achieving your goals is not as important as what you become by achieving your goals.\" – Zig Ziglar",
    "\"Success usually comes to those who are too busy to be looking for it.\" – Henry David Thoreau",
    "\"Opportunities don't happen. You create them.\" – Chris Grosser",
    "\"Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.\" – Roy T. Bennett",
    "\"The only person you are destined to become is the person you decide to be.\" – Ralph Waldo Emerson",
    "\"Start where you are. Use what you have. Do what you can.\" – Arthur Ashe",
    "\"Dream big and dare to fail.\" – Norman Vaughan",
    "\"I never dreamed about success. I worked for it.\" – Estée Lauder",
    "\"Perseverance is not a long race; it is many short races one after the other.\" – Walter Elliot",
    "\"The secret of getting ahead is getting started.\" – Mark Twain",
    "\"You are never too old to set another goal or to dream a new dream.\" – C.S. Lewis",
    "\"It always seems impossible until it's done.\" – Nelson Mandela",
    "\"Keep your eyes on the stars, and your feet on the ground.\" – Theodore Roosevelt",
    "\"Act as if what you do makes a difference. It does.\" – William James",
    "\"Success is getting what you want. Happiness is wanting what you get.\" – Dale Carnegie",
    "\"Don't wait for opportunity. Create it.\" – George Bernard Shaw",
    "\"The pessimist sees difficulty in every opportunity. The optimist sees opportunity in every difficulty.\" – Winston Churchill",
    "\"You don't have to be great to start, but you have to start to be great.\" – Zig Ziglar",
    "\"Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.\" – Christian D. Larson",
    "\"Challenges are what make life interesting and overcoming them is what makes life meaningful.\" – Joshua J. Marine",
    "\"The journey of a thousand miles begins with a single step.\" – Lao Tzu",
    "\"Things work out best for those who make the best of how things work out.\" – John Wooden",
    "\"To live a creative life, we must lose our fear of being wrong.\" – Joseph Chilton Pearce",
    "\"If you are not willing to risk the usual, you will have to settle for the ordinary.\" – Jim Rohn",
    "\"The best revenge is massive success.\" – Frank Sinatra",
    "\"People who succeed have momentum. The more they succeed, the more they want to succeed.\" – Tony Robbins",
    "\"I find that the harder I work, the more luck I seem to have.\" – Thomas Jefferson",
    "\"Success is walking from failure to failure with no loss of enthusiasm.\" – Winston Churchill",
    "\"Don't let yesterday take up too much of today.\" – Will Rogers",
    "\"It's not whether you get knocked down, it's whether you get up.\" – Vince Lombardi",
    "\"If you can dream it, you can achieve it.\" – Zig Ziglar",
    "\"The ones who are crazy enough to think they can change the world, are the ones who do.\" – Steve Jobs",
    "\"Do what you can, with what you have, where you are.\" – Theodore Roosevelt",
    "\"Never give up on a dream just because of the time it will take to accomplish it. The time will pass anyway.\" – Earl Nightingale",
    "\"Energy and persistence conquer all things.\" – Benjamin Franklin",
    "\"The path to success is to take massive, determined action.\" – Tony Robbins",
    "\"Strength and growth come only through continuous effort and struggle.\" – Napoleon Hill",
    "\"Once you replace negative thoughts with positive ones, you'll start having positive results.\" – Willie Nelson",
    "\"Man cannot discover new oceans unless he has the courage to lose sight of the shore.\" – André Gide",
    "\"Winning isn't everything, but wanting to win is.\" – Vince Lombardi",
    "\"I failed my way to success.\" – Thomas Edison",
    "\"Every morning we are born again. What we do today is what matters most.\" – Buddha",
    "\"Everybody is a genius. But if you judge a fish by its ability to climb a tree, it will live its whole life believing that it is stupid.\" – Albert Einstein",
    "\"Try not to become a man of success, but rather try to become a man of value.\" – Albert Einstein",
    "\"If you are going through hell, keep going.\" – Winston Churchill",
    "\"Life is a succession of lessons which must be lived to be understood.\" – Helen Keller",
    "\"Success is most often achieved by those who don't know that failure is inevitable.\" – Coco Chanel",
    "\"Courage doesn't always roar. Sometimes courage is the quiet voice at the end of the day saying, 'I will try again tomorrow.'\" – Mary Anne Radmacher",
    "\"Every action you take is a vote for the type of person you wish to become.\" – James Clear",
    "\"The time is always right to do what is right.\" – Martin Luther King, Jr.",
    "\"Don't be too timid and squeamish about your actions. All life is an experiment.\" – Ralph Waldo Emerson",
    "\"Give yourself something to work toward—constantly.\" – Mary Kay Ash",
    "\"Growth is never by mere chance; it is the result of forces working together.\" – James Cash Penney",
    "\"The nature of life is constant change. The challenge of life is to overcome.\" – William Danforth",
    "\"The greatest glory in living lies not in never falling, but in rising every time we fall.\" – Nelson Mandela",
    "\"In the middle of every difficulty lies opportunity.\" – Albert Einstein",
    "\"Believe in yourself. You are braver than you think, more talented than you know, and capable of more than you imagine.\" – Roy T. Bennett",
    "\"The only impossible journey is the one you never begin.\" – Tony Robbins",
    "\"You don't have to see the whole staircase, just take the first step.\" – Martin Luther King, Jr.",
    "\"Hardships often prepare ordinary people for an extraordinary destiny.\" – C.S. Lewis",
    "\"Success is not how high you have climbed, but how you make a positive difference to the world.\" – Roy T. Bennett",
    "\"Doubt kills more dreams than failure ever will.\" – Suzy Kassem",
    "\"Your limitation—it's only your imagination.\" – Anonymous",
    "\"Push yourself, because no one else is going to do it for you.\" – Anonymous",
    "\"Great things never come from comfort zones.\" – Anonymous",
    "\"Dream it. Believe it. Build it.\" – Anonymous",
    "\"Wake up with determination. Go to bed with satisfaction.\" – George Lorimer",
    "\"The harder you work for something, the greater you'll feel when you achieve it.\" – Anonymous",
    "\"Don't stop when you're tired. Stop when you're done.\" – Anonymous",
    "\"Little things make big days.\" – Anonymous",
    "\"It's going to be hard, but hard does not mean impossible.\" – Anonymous",
    "\"Don't wait for opportunity. Create it.\" – Anonymous",
    "\"Sometimes we're tested not to show our weaknesses, but to discover our strengths.\" – Anonymous",
    "\"The key to success is to focus on goals, not obstacles.\" – Anonymous",
    "\"Dream bigger. Do bigger.\" – Anonymous",
    "\"Don't limit your challenges. Challenge your limits.\" – Anonymous",
    "\"The only way to achieve the impossible is to believe it is possible.\" – Charles Kingsleigh",
    "\"You are the artist of your own life. Don't hand the paintbrush to anyone else.\" – Anonymous",
    "\"Don't be pushed by your problems. Be led by your dreams.\" – Ralph Waldo Emerson",
    "\"Turn your wounds into wisdom.\" – Oprah Winfrey",
    "\"The question isn't who is going to let me; it's who is going to stop me.\" – Ayn Rand",
    "\"You get what you focus on, so focus on what you want.\" – Anonymous",
    "\"Your life is as good as your mindset.\" – Anonymous",
    "\"Success doesn't come from what you do occasionally, it comes from what you do consistently.\" – Marie Forleo",
    "\"Don't wish it were easier. Wish you were better.\" – Jim Rohn",
    "\"The comeback is always stronger than the setback.\" – Anonymous",
    "\"If it doesn't challenge you, it doesn't change you.\" – Fred DeVito",
    "\"You are stronger than you think.\" – Anonymous",
    "\"Keep going. Everything you need will come to you at the perfect time.\" – Anonymous",
    "\"You didn't come this far to only come this far.\" – Anonymous",
    "\"Be fearless in the pursuit of what sets your soul on fire.\" – Jennifer Lee",
    "\"Don't downgrade your dream just to fit your reality. Upgrade your conviction to match your destiny.\" – Stuart Scott",
    "\"The only place where success comes before work is in the dictionary.\" – Vidal Sassoon",
    "\"You are capable of amazing things.\" – Anonymous",
    "\"Prove yourself to yourself, not others.\" – Anonymous",
    "\"Stay patient and trust your journey.\" – Anonymous",
    "\"Difficult roads often lead to beautiful destinations.\" – Zig Ziglar",
    "\"Your only limit is your mind.\" – Anonymous",
    "\"Success is liking yourself, liking what you do, and liking how you do it.\" – Maya Angelou",
    "\"Do something today that your future self will thank you for.\" – Anonymous",
    "\"Don't tell people your dreams. Show them.\" – Anonymous",
    "\"You were born to make an impact.\" – Anonymous",
    "\"The pain you feel today will be the strength you feel tomorrow.\" – Anonymous",
    "\"Every champion was once a contender that refused to give up.\" – Rocky Balboa",
    "\"Make it happen. Shock everyone.\" – Anonymous",
    "\"You are your only limit.\" – Anonymous",
    "\"If you want to fly, give up everything that weighs you down.\" – Buddha",
    "\"The secret to getting ahead is getting started.\" – Sally Berger",
    "\"Don't decrease the goal. Increase the effort.\" – Tom Coleman",
    "\"Hustle in silence and let your success make the noise.\" – Anonymous",
    "\"You don't find willpower. You create it.\" – Anonymous",
    "\"Your direction is more important than your speed.\" – Richard L. Evans",
    "\"Don't let small minds convince you that your dreams are too big.\" – Anonymous",
    "\"Fall in love with the process and the results will come.\" – Eric Thomas",
    "\"A little progress each day adds up to big results.\" – Satya Nani",
    "\"If you get tired, learn to rest, not to quit.\" – Banksy",
    "\"The obstacle is the way.\" – Ryan Holiday",
    "\"You are the greatest project you'll ever work on.\" – Anonymous",
    "\"Stop being afraid of what could go wrong and start being excited about what could go right.\" – Tony Robbins",
    "\"Your future is created by what you do today, not tomorrow.\" – Robert Kiyosaki",
    "\"Discipline is choosing between what you want now and what you want most.\" – Abraham Lincoln",
    "\"The moment you give up is the moment you let someone else win.\" – Kobe Bryant",
    "\"Don't let yesterday use up too much of today.\" – Cherokee Proverb",
    "\"Success is the sum of small efforts repeated day in and day out.\" – Robert Collier",
    "\"You are never too old to set a new goal or dream a new dream.\" – Les Brown",
    "\"Be so good they can't ignore you.\" – Steve Martin",
    "\"The only bad workout is the one that didn't happen.\" – Anonymous",
    "\"Never let success get to your head. Never let failure get to your heart.\" – Anonymous",
    "\"If you can change your mind, you can change your life.\" – William James",
    "\"You don't have to be extreme, just consistent.\" – Anonymous",
    "\"What you do today can improve all your tomorrows.\" – Ralph Marston",
    "\"Your vibe attracts your tribe.\" – Anonymous",
    "\"Never sacrifice your peace for anyone's approval.\" – Anonymous",
    "\"The only impossible journey is the one you never begin.\" – Anthony Robbins",
    "\"Become the hardest worker in every room.\" – Anonymous",
    "\"You are the author of your own story. If you're stuck on the same page, write a new chapter.\" – Anonymous",
    "\"Doubt is a dream killer. Don't let it win.\" – Anonymous",
    "\"Every next level of your life will demand a different you.\" – Leonardo DiCaprio",
    "\"The best investment you can make is in yourself.\" – Warren Buffett",
    "\"Your potential is endless. Go do what you were created to do.\" – Anonymous",
    "\"Don't let yesterday take up too much of today.\" – Will Rogers",
    "\"Success is found in the courage to continue.\" – Anonymous",
    "\"You don't have to have it all figured out to move forward.\" – Anonymous",
    "\"Be the change you wish to see in the world.\" – Mahatma Gandhi",
    "\"The only person holding you back is you.\" – Anonymous",
    "\"Work hard in silence. Let success make the noise.\" – Frank Ocean",
    "\"Your breakthrough is on the other side of consistency.\" – Anonymous",
    "\"You are never too broken to be fixed.\" – Anonymous",
    "\"The dream is free. The hustle is sold separately.\" – Anonymous",
    "\"Stop doubting yourself. Work hard and make it happen.\" – Anonymous",
    "\"Great things are done by a series of small things brought together.\" – Vincent van Gogh",
    "\"You are one decision away from a totally different life.\" – Anonymous",
    "\"Don't look for excuses. Look for results.\" – Anonymous",
    "\"The moment you choose hope, anything is possible.\" – Christopher Reeve",
    "\"Success is not about being the best. It's about being better than you were yesterday.\" – Anonymous",
    "\"Your mindset can take you anywhere you want to go.\" – Anonymous",
    "\"If it matters to you, you'll find a way.\" – Anonymous",
    "\"The best way out is always through.\" – Robert Frost",
    "\"You were made to do hard things. Don't stress about it.\" – Anonymous",
    "\"Keep your goals away from the trolls.\" – Anonymous",
    "\"Don't just dream it. Work for it.\" – Anonymous",
    "\"Your only competition is who you were yesterday.\" – Anonymous",
    "\"The secret of your future is hidden in your daily routine.\" – Mike Murdock",
    "\"Do what is right, not what is easy.\" – Anonymous",
    "\"You don't have to see the whole path. Just take the next step.\" – Anonymous",
    "\"Success is built on discipline, not motivation.\" – Anonymous",
    "\"The world makes way for the person who knows where they are going.\" – Ralph Waldo Emerson",
    "\"You are stronger than your excuses.\" – Anonymous",
    "\"Don't wait for inspiration. Be the inspiration.\" – Anonymous",
    "\"Your life changes the moment you make a new, congruent, and committed decision.\" – Tony Robbins",
    "\"Success is the progressive realization of a worthy goal.\" – Earl Nightingale",
    "\"Never let a stumble be the end of your journey.\" – Anonymous",
    "\"You don't rise to the occasion. You rise to your level of preparation.\" – Anonymous",
    "\"The best revenge is to have enough self-worth not to seek it.\" – Anonymous",
    "\"Be somebody who makes everybody feel like a somebody.\" – Anonymous",
    "\"Your passion is waiting for your courage to catch up.\" – Isabelle Lafleche",
    "\"Don't let perfect be the enemy of good.\" – Voltaire",
    "\"You are the designer of your destiny.\" – Anonymous",
    "\"Stay committed to your decisions, but stay flexible in your approach.\" – Tony Robbins",
    "\"The only failure is not trying.\" – Anonymous",
    "\"Your worth is not measured by your productivity.\" – Anonymous",
    "\"Become addicted to constant and never-ending self-improvement.\" – Anthony J. D'Angelo",
    "\"You don't need a new year to start fresh. Every day is a chance to begin again.\" – Anonymous",
    "\"The bigger the challenge, the bigger the opportunity for growth.\" – Anonymous",
    "\"Don't shrink your dreams to fit your fears.\" – Anonymous",
    "\"Success is created by doing the basics consistently.\" – Anonymous",
    "\"You are capable of more than you know.\" – Anonymous",
    "\"Let your faith be bigger than your fear.\" – Anonymous",
    "\"The only limits in your life are the ones you create in your mind.\" – Anonymous",
    "\"You were born to stand out. Stop trying to fit in.\" – Anonymous",
    "\"Every day may not be good, but there is something good in every day.\" – Anonymous",
    "\"Your journey is yours alone. Own it.\" – Anonymous",
    "\"Keep moving forward. Your future self is waiting.\" – Anonymous",
    "\"Success is not the absence of obstacles, but the courage to push through them.\" – Anonymous",
    "\"The future belongs to those who prepare for it today.\" – Malcolm X",
    "\"Don't be afraid to fail. Be afraid not to try.\" – Anonymous",
    "\"Your attitude determines your direction.\" – Anonymous",
    "\"Rise above the storm and you will find the sunshine.\" – Mario Fernández",
    "\"The only thing that overcomes hard luck is hard work.\" – Harry Golden",
    "\"Turn the pain into power.\" – Anonymous",
    "\"You don't have to be perfect to be amazing.\" – Anonymous",
    "\"Stay focused, go after your dreams, and keep moving toward your goals.\" – LL Cool J",
    "\"The expert in anything was once a beginner.\" – Helen Hayes",
    "\"Don't let fear decide your future.\" – Anonymous",
    "\"Every morning starts a new page in your story. Make it a great one today.\" – Doe Zantamata",
    "\"You are braver than you believe, stronger than you seem, and smarter than you think.\" – A.A. Milne",
    "\"The only time you should ever look back is to see how far you've come.\" – Anonymous",
    "\"Make your vision so clear that your fears become irrelevant.\" – Anonymous",
    "\"Success is built on consistency, not luck.\" – Anonymous",
    "\"Your greatest test is when you are able to bless someone else while going through your own storm.\" – Anonymous",
    "\"Don't carry your mistakes around with you. Place them on the floor and use them as stepping stones.\" – Anonymous",
    "\"The harder the battle, the sweeter the victory.\" – Les Brown",
    "\"You were born with wings. Why prefer to crawl through life?\" – Rumi",
    "\"One day or day one. You decide.\" – Anonymous",
    "\"Don't let the noise of others' opinions drown out your own inner voice.\" – Steve Jobs",
    "\"The distance between dreams and reality is called action.\" – Anonymous",
    "\"You don't inspire others by being perfect. You inspire them by how you deal with your imperfections.\" – Anonymous",
    "\"Start where you are. Use what you have. Do what you can.\" – Arthur Ashe",
    "\"Believe in the person you want to become.\" – Anonymous",
    "\"The only way out is through.\" – Robert Frost",
    "\"Your life is your message to the world. Make sure it's inspiring.\" – Anonymous",
    "\"Success demands singleness of purpose.\" – Vince Lombardi",
    "\"Don't trade your authenticity for approval.\" – Anonymous",
    "\"The strongest factor for success is self-esteem: believing you can do it, believing you deserve it, believing you will get it.\" – Anonymous",
    "\"When you want to succeed as bad as you want to breathe, then you'll be successful.\" – Eric Thomas",
    "\"You get in life what you have the courage to ask for.\" – Oprah Winfrey",
    "\"Don't wait for the perfect moment. Take the moment and make it perfect.\" – Anonymous",
    "\"The oak slept in the acorn. The bird waits in the egg. Dream big.\" – Anonymous",
    "\"You are the CEO of your own life. Start making executive decisions.\" – Anonymous",
    "\"Success is a journey, not a destination.\" – Arthur Ashe",
    "\"What you do today can improve all your tomorrows.\" – Ralph Marston",
    "\"Your vibe attracts your tribe.\" – Anonymous",
    "\"Never sacrifice your peace for anyone's approval.\" – Anonymous",
    "\"The only impossible journey is the one you never begin.\" – Anthony Robbins",
    "\"Become the hardest worker in every room.\" – Anonymous",
    "\"You are the author of your own story. If you're stuck on the same page, write a new chapter.\" – Anonymous",
    "\"Doubt is a dream killer. Don't let it win.\" – Anonymous",
    "\"Every next level of your life will demand a different you.\" – Leonardo DiCaprio",
    "\"The best investment you can make is in yourself.\" – Warren Buffett",
    "\"Your potential is endless. Go do what you were created to do.\" – Anonymous",
    "\"Don't let yesterday take up too much of today.\" – Will Rogers",
    "\"Success is found in the courage to continue.\" – Anonymous",
    "\"You don't have to have it all figured out to move forward.\" – Anonymous",
    "\"Be the change you wish to see in the world.\" – Mahatma Gandhi",
    "\"The only person holding you back is you.\" – Anonymous",
    "\"Work hard in silence. Let success make the noise.\" – Frank Ocean",
    "\"Your breakthrough is on the other side of consistency.\" – Anonymous",
    "\"You are never too broken to be fixed.\" – Anonymous",
    "\"The dream is free. The hustle is sold separately.\" – Anonymous",
    "\"Stop doubting yourself. Work hard and make it happen.\" – Anonymous",
    "\"Great things are done by a series of small things brought together.\" – Vincent van Gogh",
    "\"You are one decision away from a totally different life.\" – Anonymous",
    "\"Don't look for excuses. Look for results.\" – Anonymous",
    "\"The moment you choose hope, anything is possible.\" – Christopher Reeve",
    "\"Success is not about being the best. It's about being better than you were yesterday.\" – Anonymous",
    "\"Your mindset can take you anywhere you want to go.\" – Anonymous",
    "\"If it matters to you, you'll find a way.\" – Anonymous",
    "\"The best way out is always through.\" – Robert Frost",
    "\"You were made to do hard things. Don't stress about it.\" – Anonymous",
    "\"Keep your goals away from the trolls.\" – Anonymous",
    "\"Don't just dream it. Work for it.\" – Anonymous",
    "\"Your only competition is who you were yesterday.\" – Anonymous",
    "\"The secret of your future is hidden in your daily routine.\" – Mike Murdock",
    "\"Do what is right, not what is easy.\" – Anonymous",
    "\"You don't have to see the whole path. Just take the next step.\" – Anonymous",
    "\"Success is built on discipline, not motivation.\" – Anonymous",
    "\"The world makes way for the person who knows where they are going.\" – Ralph Waldo Emerson",
    "\"You are stronger than your excuses.\" – Anonymous",
    "\"Don't wait for inspiration. Be the inspiration.\" – Anonymous",
    "\"Your life changes the moment you make a new, congruent, and committed decision.\" – Tony Robbins",
    "\"Success is the progressive realization of a worthy goal.\" – Earl Nightingale",
    "\"Never let a stumble be the end of your journey.\" – Anonymous",
    "\"You don't rise to the occasion. You rise to your level of preparation.\" – Anonymous",
    "\"The best revenge is to have enough self-worth not to seek it.\" – Anonymous",
    "\"Be somebody who makes everybody feel like a somebody.\" – Anonymous",
    "\"Your passion is waiting for your courage to catch up.\" – Isabelle Lafleche",
    "\"Don't let perfect be the enemy of good.\" – Voltaire",
    "\"You are the designer of your destiny.\" – Anonymous",
    "\"Stay committed to your decisions, but stay flexible in your approach.\" – Tony Robbins",
    "\"The only failure is not trying.\" – Anonymous",
    "\"Your worth is not measured by your productivity.\" – Anonymous",
    "\"Become addicted to constant and never-ending self-improvement.\" – Anthony J. D'Angelo",
    "\"You don't need a new year to start fresh. Every day is a chance to begin again.\" – Anonymous",
    "\"The bigger the challenge, the bigger the opportunity for growth.\" – Anonymous",
    "\"Don't shrink your dreams to fit your fears.\" – Anonymous",
    "\"Success is created by doing the basics consistently.\" – Anonymous",
    "\"You are capable of more than you know.\" – Anonymous",
    "\"Let your faith be bigger than your fear.\" – Anonymous",
    "\"The only limits in your life are the ones you create in your mind.\" – Anonymous",
    "\"You were born to stand out. Stop trying to fit in.\" – Anonymous",
    "\"Every day may not be good, but there is something good in every day.\" – Anonymous",
    "\"Your journey is yours alone. Own it.\" – Anonymous",
    "\"Keep moving forward. Your future self is waiting.\" – Anonymous"
];

// Track used items (no repeats) — separate for each category
let usedFunFacts = safeParseJSONArray('usedFunFacts');
let usedProTips = safeParseJSONArray('usedProTips');
let usedQuotes = safeParseJSONArray('usedQuotes');

// Reset functions
function resetUsed(category) {
    if (category === 'funFacts') {
        usedFunFacts = [];
        selectedFunFact = getRandomItem(funFacts, usedFunFacts);
        funFactIsCustom = false;
    } else if (category === 'proTips') {
        usedProTips = [];
        selectedProTip = getRandomItem(proTips, usedProTips);
        proTipIsCustom = false;
    } else if (category === 'quotes') {
        usedQuotes = [];
        selectedQuote = getRandomItem(motivationalQuotes, usedQuotes);
        quoteIsCustom = false;
    } else if (window.NlEntertainment && typeof window.NlEntertainment.resetUsed === 'function') {
        window.NlEntertainment.resetUsed(category);
        return;
    }

    localStorage.setItem('used' + category.charAt(0).toUpperCase() + category.slice(1), JSON.stringify([]));

    updatePreviews();
    alert(`"${category === 'funFacts' ? 'Fun Facts' : category === 'proTips' ? 'Pro Tips' : 'Motivational Quotes'}" tracking reset! Random selections refreshed.`);
}


// Random selection (no repeats)
function getRandomItem(list, used) {
    if (used.length >= list.length) {
        used = [];
    }
    let item;
    do {
        item = list[Math.floor(Math.random() * list.length)];
    } while (used.includes(item));
    used.push(item);
    return item;
}

// Current selections (start with random)
let selectedFunFact = getRandomItem(funFacts, usedFunFacts);
let selectedProTip = getRandomItem(proTips, usedProTips);
let selectedQuote = getRandomItem(motivationalQuotes, usedQuotes);
let funFactIsCustom = localStorage.getItem('nl-funfact-custom') === '1';
let proTipIsCustom = localStorage.getItem('nl-protip-custom') === '1';
let quoteIsCustom = localStorage.getItem('nl-quote-custom') === '1';

const NL_MODAL_RANDOM_ROW_CLASS = 'px-3 py-2 mb-2 text-sm bg-[#F15A29]/10 border border-[#F15A29]/30 rounded-xl cursor-pointer hover:bg-[#F15A29]/20 transition-all text-[#F15A29] font-medium flex items-center gap-2';
const NL_MODAL_CUSTOM_INPUT_CLASS = 'w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:border-[#00A89D] focus:ring-2 focus:ring-[#00A89D]/30';

function nlCustomPreviewBadge() {
    return '<span class="inline-block text-[10px] px-2 py-0.5 mb-1 rounded-full bg-[#F15A29]/10 text-[#F15A29] font-semibold">Your custom</span>';
}

function nlCuratedEmptyPreviewHTML(label) {
    return `<span class="nl-curated-empty-preview text-gray-400 not-italic"><i class="fas fa-hand-pointer text-[#00A89D]/70"></i> Click to pick a ${label} — or hit Shuffle</span>`;
}

function injectEngagementPolishStyles() {
    if (document.getElementById('nl-engagement-polish-styles')) return;
    const style = document.createElement('style');
    style.id = 'nl-engagement-polish-styles';
    style.textContent = `
      @keyframes nlPreviewFlash { 0%,100%{opacity:1;transform:scale(1)} 45%{opacity:.4;transform:scale(.985)} }
      .nl-preview-flash { animation: nlPreviewFlash .45s ease; }
    `;
    document.head.appendChild(style);
}

function isCustomCuratedSelection(category, value) {
    if (category === 'funFact') return funFactIsCustom || (value && !funFacts.includes(value));
    if (category === 'proTip') return proTipIsCustom || (value && !proTips.includes(value));
    if (category === 'quote') return quoteIsCustom || (value && !motivationalQuotes.includes(value));
    return false;
}

function persistCuratedSelections() {
    if (selectedFunFact) localStorage.setItem('selectedFunFact', selectedFunFact);
    if (selectedProTip) localStorage.setItem('selectedProTip', selectedProTip);
    if (selectedQuote) localStorage.setItem('selectedQuote', selectedQuote);
    localStorage.setItem('nl-funfact-custom', funFactIsCustom ? '1' : '0');
    localStorage.setItem('nl-protip-custom', proTipIsCustom ? '1' : '0');
    localStorage.setItem('nl-quote-custom', quoteIsCustom ? '1' : '0');
}

function restoreCuratedSelections() {
    try {
        const savedFun = localStorage.getItem('selectedFunFact');
        if (savedFun && (funFactIsCustom || funFacts.includes(savedFun))) selectedFunFact = savedFun;
    } catch (e) { /* ignore */ }
    try {
        const savedTip = localStorage.getItem('selectedProTip');
        if (savedTip && (proTipIsCustom || proTips.includes(savedTip))) selectedProTip = savedTip;
    } catch (e) { /* ignore */ }
    try {
        const savedQuote = localStorage.getItem('selectedQuote');
        if (savedQuote && (quoteIsCustom || motivationalQuotes.includes(savedQuote))) selectedQuote = savedQuote;
    } catch (e) { /* ignore */ }
}

function getCuratedCustomDraftKey(category) {
    if (category === 'funFact') return 'nl-custom-funfact-draft';
    if (category === 'proTip') return 'nl-custom-protip-draft';
    if (category === 'quote') return 'nl-custom-quote-draft';
    return '';
}

function getCuratedCustomLabel(category) {
    if (category === 'funFact') return 'fun fact';
    if (category === 'proTip') return 'pro tip';
    return 'quote';
}

function buildCuratedModalCustomHTML(category) {
    const label = getCuratedCustomLabel(category);
    const inputId = `modal-custom-${category}-input`;
    const applyId = `modal-custom-${category}-apply`;
    const placeholder = category === 'quote'
        ? 'Type your motivational quote here…'
        : `Type your ${label} here…`;
    return `
      <details id="modal-custom-details" class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 overflow-hidden">
        <summary class="px-4 py-3 text-sm font-semibold text-[#002B5C] dark:text-white cursor-pointer select-none list-none flex items-center gap-2">
          <span>✏️ Write your own instead</span>
        </summary>
        <div class="px-4 pb-4 pt-1 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <textarea id="${inputId}" rows="3" placeholder="${placeholder}" class="${NL_MODAL_CUSTOM_INPUT_CLASS}"></textarea>
          <button type="button" id="${applyId}" class="text-xs px-4 py-2 bg-[#F15A29] text-white rounded-full font-semibold hover:opacity-90">Use my ${label}</button>
        </div>
      </details>`;
}

function applyCuratedCustomSelection(category, text, modalApi) {
    const value = String(text || '').trim();
    if (!value) {
        alert(`Please type a ${getCuratedCustomLabel(category)} first.`);
        return false;
    }
    if (category === 'funFact') {
        selectedFunFact = value;
        funFactIsCustom = true;
    } else if (category === 'proTip') {
        selectedProTip = value;
        proTipIsCustom = true;
    } else if (category === 'quote') {
        selectedQuote = value;
        quoteIsCustom = true;
    }
    const draftKey = getCuratedCustomDraftKey(category);
    if (draftKey) localStorage.setItem(draftKey, value);
    persistCuratedSelections();
    updatePreviews();
    if (modalApi?.hideModal) modalApi.hideModal();
    return true;
}

restoreCuratedSelections();

// Update localStorage used arrays
localStorage.setItem('usedFunFacts', JSON.stringify(usedFunFacts));
localStorage.setItem('usedProTips', JSON.stringify(usedProTips));
localStorage.setItem('usedQuotes', JSON.stringify(usedQuotes));

// Update previews (safe version)
function updatePreviews() {
    const funFactEl = document.getElementById('fun-fact-preview');
    const proTipEl = document.getElementById('pro-tip-preview');
    const quoteEl = document.getElementById('quote-preview');

    if (funFactEl) {
        const badge = isCustomCuratedSelection('funFact', selectedFunFact) ? nlCustomPreviewBadge() : '';
        funFactEl.innerHTML = selectedFunFact
            ? `${badge}${selectedFunFact}`
            : nlCuratedEmptyPreviewHTML('fun fact');
    }
    if (proTipEl) {
        const badge = isCustomCuratedSelection('proTip', selectedProTip) ? nlCustomPreviewBadge() : '';
        proTipEl.innerHTML = selectedProTip
            ? `${badge}${selectedProTip}`
            : nlCuratedEmptyPreviewHTML('pro tip');
    }
    if (quoteEl) {
        const badge = isCustomCuratedSelection('quote', selectedQuote) ? nlCustomPreviewBadge() : '';
        quoteEl.innerHTML = selectedQuote
            ? `${badge}${selectedQuote}`
            : nlCuratedEmptyPreviewHTML('quote');
    }
    persistCuratedSelections();
    if (window.NlEntertainment && typeof window.NlEntertainment.updatePreviews === 'function') {
        window.NlEntertainment.updatePreviews();
    }
    updateCuratedRowStatuses();
    updatePersonalCharMeter();
    updatePersonalMediaPreviews();
    updateCustomContentChoicesVisibility();
    updateEngagementSectionSummary();
    updateNewsletterPreflightSummary();
    if (typeof window.__nlSyncSetupPuzzleTypeCards === 'function') {
        window.__nlSyncSetupPuzzleTypeCards();
    }
}

function flashCuratedPreview(previewId) {
    if (!previewId) return;
    const el = document.getElementById(previewId);
    if (!el) return;
    el.classList.remove('nl-preview-flash');
    void el.offsetWidth;
    el.classList.add('nl-preview-flash');
    window.setTimeout(() => el.classList.remove('nl-preview-flash'), 500);
}

// Regenerate random for a category
function regenerateRandom(category) {
    if (category === 'funFact') {
        selectedFunFact = getRandomItem(funFacts, usedFunFacts);
        funFactIsCustom = false;
    } else if (category === 'proTip') {
        selectedProTip = getRandomItem(proTips, usedProTips);
        proTipIsCustom = false;
    } else if (category === 'quote') {
        selectedQuote = getRandomItem(motivationalQuotes, usedQuotes);
        quoteIsCustom = false;
    }
    else if (window.NlEntertainment && typeof window.NlEntertainment.regenerateRandom === 'function') {
        window.NlEntertainment.regenerateRandom(category);
        return;
    }

    localStorage.setItem('usedFunFacts', JSON.stringify(usedFunFacts));
    localStorage.setItem('usedProTips', JSON.stringify(usedProTips));
    localStorage.setItem('usedQuotes', JSON.stringify(usedQuotes));

    const previewMap = { funFact: 'fun-fact-preview', proTip: 'pro-tip-preview', quote: 'quote-preview' };
    updatePreviews();
    flashCuratedPreview(previewMap[category]);
}

const NL_CHOICE_MODAL_ID = 'newsletter-choice-modal';

const NL_ENGAGEMENT_HUB_TABS = [
    { key: 'fun', category: 'funFact', label: 'Fun Fact', icon: '🤓' },
    { key: 'tip', category: 'proTip', label: 'Pro Tip', icon: '🏡' },
    { key: 'quote', category: 'quote', label: 'Quote', icon: '💪' },
    { key: 'dadjoke', category: 'dadJoke', label: 'Dad Joke', icon: '😄' },
    { key: 'puzzle', category: 'puzzle', label: 'Brain Teaser', icon: '🧩' }
];

const NL_ENGAGEMENT_HUB_CATEGORIES = new Set(NL_ENGAGEMENT_HUB_TABS.map((t) => t.category));

function isEngagementHubCategory(category) {
    return NL_ENGAGEMENT_HUB_CATEGORIES.has(category);
}

function getEngagementHubTabByCategory(category) {
    return NL_ENGAGEMENT_HUB_TABS.find((t) => t.category === category) || null;
}

function getCheckedEngagementHubTabs() {
    return NL_ENGAGEMENT_HUB_TABS.filter((tab) => {
        const cfg = NL_CUSTOM_CONTENT_BLOCKS[tab.key];
        if (!cfg) return false;
        return !!document.getElementById(cfg.checkboxId)?.checked;
    });
}

function shouldKeepEngagementHubOpen(hubMode) {
    return !!hubMode && getCheckedEngagementHubTabs().length >= 2;
}

function getCuratedSelectionText(category) {
    if (category === 'funFact') return selectedFunFact;
    if (category === 'proTip') return selectedProTip;
    if (category === 'quote') return selectedQuote;
    if (window.NlEntertainment && typeof window.NlEntertainment.getSelectionText === 'function') {
        return window.NlEntertainment.getSelectionText(category);
    }
    return '';
}

function getCuratedPoolStats(category) {
    if (category === 'funFact') {
        return { total: funFacts.length, used: usedFunFacts.length, label: 'fun facts' };
    }
    if (category === 'proTip') {
        return { total: proTips.length, used: usedProTips.length, label: 'pro tips' };
    }
    if (category === 'quote') {
        return { total: motivationalQuotes.length, used: usedQuotes.length, label: 'quotes' };
    }
    if (window.NlEntertainment && typeof window.NlEntertainment.getPoolStats === 'function') {
        return window.NlEntertainment.getPoolStats(category);
    }
    return { total: 0, used: 0, label: 'items' };
}

function getCuratedPickStatus(sectionKey) {
    const cfg = NL_CUSTOM_CONTENT_BLOCKS[sectionKey];
    if (!cfg) return 'empty';
    if (window.NlEntertainment && typeof window.NlEntertainment.getPickStatus === 'function') {
        const entStatus = window.NlEntertainment.getPickStatus(sectionKey);
        if (entStatus) return entStatus;
    }
    const category = cfg.category;
    const value = getCuratedSelectionText(category);
    if (!value || /not selected/i.test(String(value))) return 'empty';
    if (isCustomCuratedSelection(category, value)) return 'custom';
    return 'library';
}

function getCuratedStatusLabel(status) {
    if (status === 'custom') return '✏️ Your custom';
    if (status === 'library') return '📚 Library pick';
    if (status === 'random') return '🎲 Shuffled';
    return 'Pick one';
}

function updateCuratedRowStatuses() {
    Object.keys(NL_CUSTOM_CONTENT_BLOCKS).forEach((key) => {
        const statusEl = document.querySelector(`[data-nl-status-for="${key}"]`);
        if (!statusEl) return;
        const cb = document.getElementById(NL_CUSTOM_CONTENT_BLOCKS[key].checkboxId);
        if (!cb?.checked) {
            statusEl.textContent = '';
            return;
        }
        statusEl.textContent = getCuratedStatusLabel(getCuratedPickStatus(key));
    });
}

function updateEngagementSectionSummary() {
    const textEl = document.getElementById('nl-engagement-summary-text');
    const shuffleAllBtn = document.getElementById('nl-shuffle-all-engagement');
    const hubBtn = document.getElementById('nl-open-engagement-hub');
    if (!textEl) return;

    const checked = Object.entries(NL_CUSTOM_CONTENT_BLOCKS).filter(([key, cfg]) => {
        return !!document.getElementById(cfg.checkboxId)?.checked;
    });
    const ready = checked.filter(([key]) => getCuratedPickStatus(key) !== 'empty');

    if (!checked.length) {
        textEl.textContent = 'No curated sections checked — fun facts, tips, and jokes live here.';
        if (shuffleAllBtn) shuffleAllBtn.classList.add('hidden');
        if (hubBtn) hubBtn.classList.add('hidden');
        return;
    }

    const allReady = ready.length === checked.length;
    textEl.innerHTML = allReady
        ? `<strong class="text-[#00A89D]">${ready.length} of ${checked.length} picks ready</strong> — you're set for engagement content.`
        : `<strong>${ready.length} of ${checked.length}</strong> curated sections have picks · finish the rest or hit Shuffle all.`;
    if (shuffleAllBtn) shuffleAllBtn.classList.toggle('hidden', !checked.length);
    if (hubBtn) hubBtn.classList.toggle('hidden', checked.length < 2);
}

function shuffleAllCheckedEngagement() {
    let count = 0;
    Object.entries(NL_CUSTOM_CONTENT_BLOCKS).forEach(([key, cfg]) => {
        if (!document.getElementById(cfg.checkboxId)?.checked) return;
        regenerateRandom(cfg.category);
        count += 1;
    });
    if (count && window.showToast) window.showToast(`Shuffled ${count} curated section${count === 1 ? '' : 's'}.`, 'success');
}

function openFirstCheckedEngagementHub() {
    const first = getCheckedEngagementHubTabs()[0];
    if (first) openNewsletterEngagementHub(first.key);
}

function getCuratedResetKey(category) {
    const map = {
        funFact: 'funFacts',
        proTip: 'proTips',
        quote: 'quotes',
        dadJoke: 'dadJokes',
        puzzle: 'puzzleAll'
    };
    return map[category] || '';
}

function renderEngagementModalToolbar(category, modal, hubMode) {
    const m = modal || getNewsletterChoiceModal();
    if (!m) return;
    const toolbar = m.querySelector('#nl-choice-modal-toolbar');
    if (!toolbar) return;

    if (!isEngagementHubCategory(category)) {
        toolbar.classList.add('hidden');
        toolbar.innerHTML = '';
        return;
    }

    const current = getCuratedSelectionText(category);
    const stats = getCuratedPoolStats(category);
    const remaining = Math.max(0, stats.total - stats.used);
    const currentPreview = current
        ? truncateDirectionPreview(current.replace(/<[^>]+>/g, ''), 110)
        : 'Nothing picked yet — shuffle or choose from the list.';

    toolbar.classList.remove('hidden');
    toolbar.innerHTML = `
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex-1 min-w-[200px]">
          <p class="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 m-0 mb-1">Current pick</p>
          <p class="text-sm text-gray-700 dark:text-gray-200 italic m-0 leading-snug">${currentPreview}</p>
          ${stats.total ? `<p class="text-[11px] text-gray-500 m-0 mt-1.5">${stats.total} ${stats.label || 'items'} · ${remaining} fresh before repeats</p>` : ''}
        </div>
        <div class="flex flex-wrap gap-1.5 flex-shrink-0">
          <button type="button" data-nl-modal-shuffle="${category}" class="text-xs px-3 py-1.5 rounded-full bg-[#00A89D] text-white font-semibold hover:bg-[#008F85] transition"><i class="fas fa-dice mr-1"></i>Shuffle</button>
          <button type="button" data-nl-modal-reset="${getCuratedResetKey(category)}" class="text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold hover:border-[#00A89D] hover:text-[#00A89D] transition">Start fresh</button>
        </div>
      </div>
      ${shouldKeepEngagementHubOpen(hubMode) ? '<p class="text-[11px] text-[#00A89D] m-0 mt-2 font-medium"><i class="fas fa-info-circle mr-1"></i>Picks apply instantly — use tabs above to jump between sections without closing.</p>' : ''}`;

    toolbar.querySelector('[data-nl-modal-shuffle]')?.addEventListener('click', (e) => {
        e.preventDefault();
        regenerateRandom(category);
        renderEngagementModalToolbar(category, m, hubMode);
        if (shouldKeepEngagementHubOpen(hubMode)) {
            openModal(category, { hub: true, keepOpen: true });
        }
    });
    toolbar.querySelector('[data-nl-modal-reset]')?.addEventListener('click', (e) => {
        e.preventDefault();
        const resetKey = e.currentTarget.getAttribute('data-nl-modal-reset');
        if (resetKey && typeof resetUsed === 'function') resetUsed(resetKey);
        renderEngagementModalToolbar(category, m, hubMode);
        if (shouldKeepEngagementHubOpen(hubMode)) {
            openModal(category, { hub: true, keepOpen: true });
        }
    });
}

function renderNewsletterEngagementHubTabs(activeCategory, modal) {
    const m = modal || getNewsletterChoiceModal();
    if (!m) return;
    const tabsHost = m.querySelector('#nl-choice-modal-tabs');
    if (!tabsHost) return;

    const checkedTabs = getCheckedEngagementHubTabs();
    if (!isEngagementHubCategory(activeCategory) || checkedTabs.length < 2) {
        tabsHost.classList.add('hidden');
        tabsHost.innerHTML = '';
        return;
    }

    tabsHost.classList.remove('hidden');
    tabsHost.innerHTML = `
        <p class="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 m-0 mb-2">Engagement picker</p>
        <div class="flex flex-wrap gap-1.5" role="tablist" aria-label="Engagement content types">
            ${checkedTabs.map((tab) => {
                const active = tab.category === activeCategory;
                const hasPick = getCuratedPickStatus(tab.key) !== 'empty';
                const dot = hasPick ? '<span class="inline-block w-1.5 h-1.5 rounded-full bg-[#00A89D] ml-0.5 align-middle"></span>' : '';
                return `<button type="button" role="tab" aria-selected="${active ? 'true' : 'false'}" data-nl-hub-tab="${tab.category}" class="text-xs sm:text-sm px-3 py-1.5 rounded-full border-2 font-semibold transition whitespace-nowrap inline-flex items-center gap-1 ${active ? 'border-[#00A89D] bg-[#00A89D]/15 text-[#002B5C] dark:text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#00A89D]/50'}">${tab.icon} ${tab.label}${dot}</button>`;
            }).join('')}
        </div>`;

    tabsHost.querySelectorAll('[data-nl-hub-tab]').forEach((btn) => {
        if (btn.dataset.nlHubTabWired === '1') return;
        btn.dataset.nlHubTabWired = '1';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = btn.getAttribute('data-nl-hub-tab');
            if (!cat || cat === activeCategory) return;
            openModal(cat, { hub: true, keepOpen: true });
        });
    });
}

function openNewsletterEngagementHub(sectionKey) {
    const cfg = NL_CUSTOM_CONTENT_BLOCKS[sectionKey];
    if (!cfg) return;
    const cb = document.getElementById(cfg.checkboxId);
    if (!cb?.checked) {
        if (window.showToast) window.showToast(`Check ${cfg.shortLabel} in Sections first.`, 'info');
        else alert(`Check ${cfg.shortLabel} in Sections to Include first.`);
        return;
    }
    openModal(cfg.category, { hub: true });
}

function ensureNewsletterChoiceModal() {
    let modal = document.getElementById(NL_CHOICE_MODAL_ID);
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = NL_CHOICE_MODAL_ID;
    modal.setAttribute('aria-hidden', 'true');
    modal.className = 'modal app-modal-overlay hidden fixed inset-0 bg-black/60 z-[9999] items-center justify-center p-4';
    modal.innerHTML = `
        <div class="modal-content bg-white dark:bg-gray-900 rounded-3xl max-w-3xl w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="bg-gradient-to-r from-[#002B5C] via-[#003366] to-[#00A89D] px-6 md:px-8 py-5 flex items-center justify-between">
                <div class="flex items-center gap-3 min-w-0">
                    <i class="fas fa-lightbulb text-white text-xl flex-shrink-0"></i>
                    <h3 id="nl-choice-modal-title" class="text-2xl md:text-3xl font-bold text-white tracking-tight" style="color: #fff !important;"></h3>
                </div>
                <button type="button" data-nl-choice-close class="text-white/80 hover:text-white text-4xl leading-none transition flex-shrink-0" aria-label="Close">&times;</button>
            </div>
            <div id="nl-choice-modal-tabs" class="hidden px-6 md:px-8 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50"></div>
            <div id="nl-choice-modal-toolbar" class="hidden px-6 md:px-8 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"></div>
            <div class="p-6 md:p-8">
                <ul id="nl-choice-modal-list" class="space-y-4 max-h-[62vh] overflow-y-auto pr-1 list-none m-0 p-0"></ul>
            </div>
        </div>`;

    modal.querySelector('[data-nl-choice-close]')?.addEventListener('click', () => {
        if (typeof window.closeNewsletterChoiceModal === 'function') window.closeNewsletterChoiceModal();
    });

    const root = document.body || document.documentElement;
    root.appendChild(modal);
    if (typeof window.ensureModalBackdropClose === 'function') {
        window.ensureModalBackdropClose(modal);
    }
    return modal;
}

function getNewsletterChoiceModal() {
    return ensureNewsletterChoiceModal();
}

function getNewsletterChoiceTitleEl(modal) {
    return document.getElementById('nl-choice-modal-title')
        || (modal && modal.querySelector('#modal-title'));
}

function getNewsletterChoiceListEl(modal) {
    return document.getElementById('nl-choice-modal-list')
        || (modal && modal.querySelector('#modal-list'));
}

function openModal(category, options) {
    const opts = options || {};
    const modal = ensureNewsletterChoiceModal();
    if (!modal) return;

    const title = getNewsletterChoiceTitleEl(modal);
    const list = getNewsletterChoiceListEl(modal);
    const hubMode = opts.hub !== false && isEngagementHubCategory(category);
    const modalAlreadyOpen = !modal.classList.contains('hidden') && modal.getAttribute('aria-hidden') !== 'true';

    let data = [];
    let modalTitleText = '';

    if (category === 'dadJoke' || category === 'puzzle') {
        if (window.NlEntertainment && typeof window.NlEntertainment.openChoiceModal === 'function') {
            window.NlEntertainment.openChoiceModal(category, {
                ensureModal: ensureNewsletterChoiceModal,
                getTitleEl: getNewsletterChoiceTitleEl,
                getListEl: getNewsletterChoiceListEl,
                renderHubTabs: renderNewsletterEngagementHubTabs,
                renderToolbar: renderEngagementModalToolbar,
                hubMode,
                shouldKeepOpen: () => shouldKeepEngagementHubOpen(hubMode),
                showModal: (m) => {
                    if (!opts.keepOpen || !modalAlreadyOpen) {
                        if (typeof window.openNamedModal === 'function') window.openNamedModal(m);
                        else if (typeof window.openAppModal === 'function') window.openAppModal(m);
                        else {
                            m.classList.remove('hidden');
                            m.classList.add('flex');
                            m.style.display = 'flex';
                            document.body.classList.add('modal-open');
                        }
                    }
                    m.setAttribute('aria-hidden', 'false');
                    if (hubMode) {
                        renderNewsletterEngagementHubTabs(category, m);
                        renderEngagementModalToolbar(category, m, hubMode);
                    }
                },
                hideModal: () => closeModal(),
                refreshModal: (cat) => openModal(cat, { hub: true, keepOpen: true })
            });
        }
        return;
    }

    modal.querySelector('#modal-puzzle-type-bar')?.classList.add('hidden');
    modal.querySelector('#modal-puzzle-filter-bar')?.classList.add('hidden');

    if (category === 'funFact') {
        modalTitleText = 'Choose a Fun Fact';
        data = funFacts || [];
    } else if (category === 'proTip') {
        modalTitleText = 'Choose a Pro Tip';
        data = proTips || [];
    } else if (category === 'quote') {
        modalTitleText = 'Choose a Motivational Quote';
        data = motivationalQuotes || [];
    } else {
        modalTitleText = 'Choose Content';
        data = [];
    }

    if (!opts.keepOpen || !modalAlreadyOpen) {
        if (typeof window.openNamedModal === 'function') {
            window.openNamedModal(modal);
        } else if (typeof window.openAppModal === 'function') {
            window.openAppModal(modal);
        } else {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            modal.style.display = 'flex';
            modal.style.pointerEvents = 'auto';
            document.body.classList.add('modal-open');
        }
    }
    modal.setAttribute('aria-hidden', 'false');
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    if (hubMode) {
        renderNewsletterEngagementHubTabs(category, modal);
        renderEngagementModalToolbar(category, modal, hubMode);
    } else {
        const tabsHost = modal.querySelector('#nl-choice-modal-tabs');
        if (tabsHost) {
            tabsHost.classList.add('hidden');
            tabsHost.innerHTML = '';
        }
        const toolbar = modal.querySelector('#nl-choice-modal-toolbar');
        if (toolbar) {
            toolbar.classList.add('hidden');
            toolbar.innerHTML = '';
        }
    }

    const stayOpen = shouldKeepEngagementHubOpen(hubMode);

    const hubTab = getEngagementHubTabByCategory(category);
    if (title) {
        title.textContent = hubMode && hubTab
            ? `Engagement Picker · ${hubTab.label}`
            : modalTitleText;
        title.style.color = '#fff';
        title.style.setProperty('color', '#fff', 'important');
    }

    // Dynamically inject a search input for this choice modal only (so it does not pollute social pillar modals)
    let search = modal.querySelector('#modal-search');
    const contentBody = list ? list.parentElement : null;
    if (!search && contentBody) {
        search = document.createElement('input');
        search.id = 'modal-search';
        search.type = 'text';
        search.className = 'w-full px-4 py-2.5 mb-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm placeholder-gray-400 focus:border-[#00A89D] focus:ring-2 focus:ring-[#00A89D]/30';
        contentBody.insertBefore(search, list);
    }

    if (list) {
        list.innerHTML = '';

        const randomLi = document.createElement('li');
        randomLi.className = NL_MODAL_RANDOM_ROW_CLASS;
        randomLi.innerHTML = `<i class="fas fa-dice text-xs"></i> <span>Pick a Random ${modalTitleText.replace('Choose a ', '')} for me</span>`;
        randomLi.addEventListener('click', () => {
            if (!data.length) return;
            const randomItem = data[Math.floor(Math.random() * data.length)];
            if (category === 'funFact') {
                selectedFunFact = randomItem;
                funFactIsCustom = false;
            } else if (category === 'proTip') {
                selectedProTip = randomItem;
                proTipIsCustom = false;
            } else if (category === 'quote') {
                selectedQuote = randomItem;
                quoteIsCustom = false;
            }
            updatePreviews();
            if (stayOpen) {
                openModal(category, { hub: true, keepOpen: true });
            } else {
                closeModal();
                if (search) search.value = '';
            }
        });
        list.appendChild(randomLi);

        const customLi = document.createElement('li');
        customLi.className = 'nl-modal-custom-row mb-2 list-none';
        customLi.innerHTML = buildCuratedModalCustomHTML(category);
        list.appendChild(customLi);

        const customInput = modal.querySelector(`#modal-custom-${category}-input`);
        const customApply = modal.querySelector(`#modal-custom-${category}-apply`);
        const draftKey = getCuratedCustomDraftKey(category);
        let currentSelected = '';
        if (category === 'funFact') currentSelected = selectedFunFact;
        else if (category === 'proTip') currentSelected = selectedProTip;
        else if (category === 'quote') currentSelected = selectedQuote;
        if (customInput) {
            const draft = draftKey ? (localStorage.getItem(draftKey) || '') : '';
            customInput.value = isCustomCuratedSelection(category, currentSelected) ? currentSelected : draft;
        }
        if (customApply) {
            customApply.onclick = () => {
                applyCuratedCustomSelection(category, customInput?.value, {
                    hideModal: () => {
                        if (stayOpen) {
                            openModal(category, { hub: true, keepOpen: true });
                        } else {
                            closeModal();
                            if (search) search.value = '';
                        }
                    }
                });
            };
        }
        const customDetails = modal.querySelector('#modal-custom-details');
        if (customDetails && isCustomCuratedSelection(category, currentSelected)) {
            customDetails.open = true;
        }

        data.forEach(item => {
            const li = document.createElement('li');
            const isCurrent = item === currentSelected && !isCustomCuratedSelection(category, currentSelected);
            li.className = `p-4 bg-white dark:bg-gray-800 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-gray-900 dark:text-gray-100 text-base border ${isCurrent ? 'border-[#00A89D] ring-1 ring-[#00A89D]/30' : 'border-gray-200 dark:border-gray-700 hover:border-[#00A89D]'} flex items-start gap-3`;
            li.innerHTML = `<i class="fas fa-quote-left text-[#00A89D] mt-0.5 flex-shrink-0"></i> <span class="flex-1">${item}</span> ${isCurrent ? '<span class="text-[10px] px-2 py-0.5 bg-[#00A89D]/10 text-[#00A89D] rounded-full self-start">current</span>' : ''}`;

            li.addEventListener('click', () => {
                if (category === 'funFact') {
                    selectedFunFact = item;
                    funFactIsCustom = false;
                } else if (category === 'proTip') {
                    selectedProTip = item;
                    proTipIsCustom = false;
                } else if (category === 'quote') {
                    selectedQuote = item;
                    quoteIsCustom = false;
                }
                updatePreviews();
                if (stayOpen) {
                    openModal(category, { hub: true, keepOpen: true });
                } else {
                    closeModal();
                    if (search) search.value = '';
                }
            });

            list.appendChild(li);
        });
    }

    if (search) {
        if (!opts.keepOpen) search.value = '';
        search.placeholder = `Search ${modalTitleText.toLowerCase().replace('choose a ', '')}...`;
        search.oninput = () => {
            const filter = search.value.toLowerCase();
            Array.from(list.children).forEach((li, idx) => {
                if (idx === 0 || li.classList.contains('nl-modal-custom-row')) return;
                li.style.display = li.innerText.toLowerCase().includes(filter) ? '' : 'none';
            });
        };
        search.focus();
    }

}

// Close newsletter choice modal (separate from social pillar #content-modal)
function closeModal() {
    const modal = getNewsletterChoiceModal();
    if (modal) {
        if (typeof window.closeAppModal === 'function') {
            window.closeAppModal(modal);
        } else if (typeof window.closeNamedModal === 'function') {
            window.closeNamedModal(modal);
        } else {
            modal.style.display = 'none';
            modal.classList.remove('flex');
            modal.classList.add('hidden');
            if (typeof window.releaseModalScrollLock === 'function') window.releaseModalScrollLock();
            else document.body.classList.remove('modal-open');
        }
        modal.onclick = null;
        modal.setAttribute('aria-hidden', 'true');
    }
    const search = document.getElementById('modal-search');
    if (search && search.parentElement) {
        search.parentElement.removeChild(search);
    }
}

function isNewsletterChoiceModalOpen() {
    const modal = getNewsletterChoiceModal();
    if (!modal) return false;
    return modal.classList.contains('flex') && !modal.classList.contains('hidden');
}

// Close on Esc key — only when the newsletter choice modal is the active overlay
if (!window._nlEscListener) {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isNewsletterChoiceModalOpen()) closeModal();
  });
  window._nlEscListener = true;
}

function wireNewsletterChoiceButtons() {
    document.querySelectorAll('[data-nl-choice], .nl-choice-btn').forEach((btn) => {
        if (btn._nlChoiceWired) return;
        btn._nlChoiceWired = true;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const cat = btn.getAttribute('data-nl-choice');
            if (!cat) return;
            if (typeof window.openNewsletterChoiceModal === 'function') {
                window.openNewsletterChoiceModal(cat);
            } else if (typeof openModal === 'function') {
                openModal(cat);
            }
        });
    });
}

if (!window._nlChoiceDelegate) {
    document.addEventListener('click', (e) => {
        const btn = e.target && e.target.closest ? e.target.closest('[data-nl-choice]') : null;
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const cat = btn.getAttribute('data-nl-choice');
        if (!cat) return;
        if (typeof window.openNewsletterChoiceModal === 'function') {
            window.openNewsletterChoiceModal(cat);
        } else if (typeof openModal === 'function') {
            openModal(cat);
        }
    }, true);
    window._nlChoiceDelegate = true;
}

// === SOCIAL MEDIA PILLAR MODAL (Improved - Rich Content, No Search Bar) ===
function openSocialModal(category) {
    const modal = document.getElementById('content-modal');
    if (!modal) {
        console.error('Social modal #content-modal not found!');
        return;
    }

    const titleEl = document.getElementById('modal-title');
    const list = document.getElementById('modal-list');
    if (!titleEl || !list) {
        console.error('Missing modal-title or modal-list in social modal');
        return;
    }

    list.innerHTML = '';

    let emoji = '';
    let title = '';
    let content = [];

    switch(category) {
        case 'Personal':
            emoji = '💡';
            title = 'Personal Content Ideas';
            content = [
                "Behind-the-scenes of my morning coffee run before approvals ☕",
                "Weekend family hike in Indiana — who else loves getting outdoors?",
                "My favorite hobby right now: [golf/poker/cooking] — what’s yours?",
                "Quick kitchen hack I used this week (recipe in comments)",
                "Throwback to my very first closing — 5 years ago today!",
                "Pet photo Friday! Meet my dog [name] 🐶",
                "What I’m grateful for this week as a loan officer",
                "My non-work passion project I’ve been working on",
                "A funny story from a recent client meeting",
                "How I stay productive on busy days",
                "Favorite local restaurant I took a client to this week",
                "Quick update on my family/kids/pets"
            ];
            break;

        case 'Local':
            emoji = '🏠';
            title = 'Local Spotlight Ideas';
            content = [
                "Why homes in [your city] are selling faster than ever",
                "Hidden gem coffee shop perfect for client meetings",
                "This weekend’s best community events in our area",
                "Neighborhood highlight: [your city] parks & trails",
                "Local school spotlight — huge congratulations to [school]!",
                "Indiana fall colors are here — best viewing spots",
                "New development coming to [neighborhood] — what it means for buyers",
                "Shoutout to a local small business we love working with",
                "Farmers market season is back — my favorite finds",
                "Local charity I’m supporting this month",
                "Why [your city] is one of the best places to raise a family",
                "Upcoming festival or event you don’t want to miss"
            ];
            break;

        case 'Educational':
            emoji = '📚';
            title = 'Educational Mortgage Tips';
            content = [
                "3% down programs available right now in Indiana",
                "Why buying now vs waiting could save you $28k+",
                "How to boost your credit score 40+ points in 30 days",
                "Buydown explained in 60 seconds (super simple)",
                "First-time buyer checklist (free download link)",
                "Rate myths busted: You do NOT need 20% down",
                "FHA vs Conventional — which is better for you?",
                "What escrow really is and why it matters",
                "Closing costs explained with real numbers",
                "VA loan benefits every veteran should know",
                "How to get pre-approved in under 24 hours",
                "Refinance breakeven calculator — when it actually makes sense"
            ];
            break;

        case 'Client Wins':
            emoji = '🎉';
            title = 'Client Success Stories';
            content = [
                "Just helped the Smith family buy their first home in [city]!",
                "Refinanced Sarah & Mike — saving them $312/month",
                "Teacher closed with only 3.5% down using DPA program",
                "Veteran client got 0% down VA loan in 21 days",
                "Client testimonial: “Best decision we ever made!”",
                "Another happy family got their keys this week 🗝️",
                "Helped a young couple beat 7 other offers",
                "First-time buyer closed with rate buydown — huge savings",
                "Client went from renter to homeowner in 38 days",
                "Refinance success story — lowered payment by $450/month",
                "Helped a family move closer to grandparents",
                "Just closed another veteran with 100% financing"
            ];
            break;

        case 'Value':
            emoji = '📋';
            title = 'Free Value Resources';
            content = [
                "Free Homebuyer Checklist (download link)",
                "2026 Mortgage Rate Forecast Guide",
                "Credit Repair Checklist — boost your score fast",
                "Closing Cost Calculator (free tool)",
                "First-Time Buyer Webinar Replay",
                "Home Maintenance Calendar (printable)",
                "Refinance Breakeven Calculator",
                "Questions to Ask Your Lender checklist",
                "Moving Checklist for new homeowners",
                "Local Vendor List (painters, inspectors, movers)",
                "Budget Worksheet for homebuyers",
                "Down Payment Assistance Guide for Indiana"
            ];
            break;

        case 'Engagement':
            emoji = '🔥';
            title = 'Engagement & Poll Ideas';
            content = [
                "Poll: Renting or Buying in 2026?",
                "Would you rather: Lower rate or lower monthly payment?",
                "Tag a friend who needs to see this rate tip!",
                "Quick question: What’s your biggest homebuying fear?",
                "This or That: Beach house or mountain cabin?",
                "Poll: Fixer-upper or move-in ready?",
                "Ask: How long have you lived in your current home?",
                "Comment your city below — I’ll share local stats!",
                "Poll: What’s your dream home feature?",
                "Tag someone who’s thinking about buying soon",
                "Question: What’s stopping you from buying right now?",
                "This or That: Backyard or basement?"
            ];
            break;
    }

    if (titleEl) titleEl.innerHTML = `${emoji} ${title}`;

    content.forEach(item => {
        const li = document.createElement('li');
        li.className = 'p-6 bg-white dark:bg-gray-800 rounded-3xl cursor-pointer hover:bg-[#00A89D]/10 transition-all border border-transparent hover:border-[#00A89D] text-lg';
        li.innerHTML = `→ ${item}`;
        li.onclick = () => {
            alert(`✅ Great choice!\n\n"${item}"\n\nCopy and paste this into your next post!`);
            closeModal();
        };
        list.appendChild(li);
    });

    modal.style.display = 'flex';
}

// === PERSISTENCE SETUP ===
const persistentFields = [
    'nl-audience', 'nl-tone', 'nl-location', 'nl-title', 'nl-length',
    'nl-name',                    // keep
    'nl-email',                   // keep
    'nl-blog-url', 'nl-blog-title',
    'nl-include-blog',
    'nl-personal-photo',
    'nl-personal-photo-size',
    'nl-personal-video',
    'nl-personal-video-size',
    'nl-color-bundle',
    'nl-specific',
    'nl-direction-market', 'nl-direction-industry', 'nl-direction-local', 'nl-direction-recipes'
];

const NL_MEDIA_SIZE_DEFAULT = 100;
const NL_MEDIA_SIZE_MIN = 30;
const NL_MEDIA_SIZE_MAX = 100;
const NL_PHOTO_SIZE_DEFAULT = NL_MEDIA_SIZE_DEFAULT;
const NL_PHOTO_SIZE_MIN = NL_MEDIA_SIZE_MIN;
const NL_PHOTO_SIZE_MAX = NL_MEDIA_SIZE_MAX;

const NL_LENGTH_CONFIG = {
    short: {
        preflightLabel: 'Short edition',
        displayLabel: 'Short (~500–600 words)',
        wordRange: '500–600 words total',
        sectionDepth: 'Keep each included section to 2–4 tight paragraphs or bullet clusters. Prioritize scannability — shorter sentences, fewer sub-points per section.',
        personalNote: 'Personal update: 3–5 sentences max unless the user wrote more.',
        overall: 'Quick, mobile-friendly read. Do not pad with filler.'
    },
    medium: {
        preflightLabel: 'Standard edition',
        displayLabel: 'Standard (~650–750 words)',
        wordRange: '650–750 words total',
        sectionDepth: 'Each included section: 3–5 paragraphs with one clear takeaway. Balance depth and scannability.',
        personalNote: 'Personal update: 4–7 sentences — warm but concise.',
        overall: 'Default monthly newsletter depth — the most common send.'
    },
    long: {
        preflightLabel: 'Long edition',
        displayLabel: 'Long (~800–1,000+ words)',
        wordRange: '800–1,000+ words total',
        sectionDepth: 'Each included section: fuller context, 4–6 paragraphs, optional bullet lists for key points. Add one extra concrete detail per section where accurate.',
        personalNote: 'Personal update: can run longer (up to ~10 sentences) if the user provided rich detail.',
        overall: 'Deep-dive edition — still scannable with headers, more substance per section. Never invent facts to hit word count.'
    }
};

function getNewsletterLengthKey() {
    const raw = (document.getElementById('nl-length')?.value || 'medium').trim().toLowerCase();
    if (raw === 'short' || raw === 'long') return raw;
    return 'medium';
}

function getNewsletterLengthConfig() {
    const key = getNewsletterLengthKey();
    return { key, ...NL_LENGTH_CONFIG[key] };
}

function buildNewsletterLengthPromptBlock() {
    const cfg = getNewsletterLengthConfig();
    return [
        '**LENGTH RULE (important — user selected ' + cfg.displayLabel + '):**',
        '- Target total newsletter body: ' + cfg.wordRange + ' (all included sections combined, excluding footer/disclaimer).',
        '- Section depth: ' + cfg.sectionDepth,
        '- ' + cfg.personalNote,
        '- ' + cfg.overall,
        '- If many sections are included, keep each section slightly shorter to stay within the word band; if few sections are included, allow a bit more depth per section.'
    ];
}

function getPersonalPhotoWidthPercent() {
    const el = document.getElementById('nl-personal-photo-size');
    const raw = el ? parseInt(el.value, 10) : NL_PHOTO_SIZE_DEFAULT;
    if (Number.isNaN(raw)) return NL_PHOTO_SIZE_DEFAULT;
    return Math.min(NL_PHOTO_SIZE_MAX, Math.max(NL_PHOTO_SIZE_MIN, raw));
}

function getPersonalPhotoWidthPx() {
    return Math.round(NL_CARD_CONTENT_WIDTH * getPersonalPhotoWidthPercent() / 100);
}

function formatPersonalPhotoSizeLabel() {
    const pct = getPersonalPhotoWidthPercent();
    const px = getPersonalPhotoWidthPx();
    if (pct >= 100) return `Full width (${px}px)`;
    return `${pct}% (${px}px)`;
}

function buildPersonalPhotoInsert(photoUrl) {
    const px = getPersonalPhotoWidthPx();
    const safeUrl = String(photoUrl || '').trim();
    return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" data-nl-personal-photo="1" style="margin:16px 0 0;width:100%;max-width:${NL_CARD_CONTENT_WIDTH}px;">
  <tr><td align="center" style="padding:0;">
    <img src="${safeUrl}" alt="Personal photo" width="${px}" style="display:block;margin:0 auto;max-width:100%;width:${px}px;height:auto;border:0;border-radius:8px;">
  </td></tr>
</table>`;
}

function updatePersonalPhotoSizeUI() {
    const sizeWrap = document.getElementById('nl-personal-photo-size-wrap');
    const labelEl = document.getElementById('nl-personal-photo-size-label');
    const photoEnabled = !!document.getElementById('nl-include-photo')?.checked && !!document.getElementById('nl-personal')?.checked;
    if (sizeWrap) sizeWrap.classList.toggle('hidden', !photoEnabled);
    if (labelEl) labelEl.textContent = formatPersonalPhotoSizeLabel();
}

/** Preview uses the same pixel width as the generated newsletter (slider % of card content area). */
function applyPersonalPhotoPreviewSizing() {
    const photoImg = document.getElementById('nl-personal-photo-preview-img');
    const stage = document.getElementById('nl-personal-photo-preview-stage');
    if (!photoImg) return;
    const px = getPersonalPhotoWidthPx();
    if (stage) {
        stage.style.maxWidth = `${NL_CARD_CONTENT_WIDTH}px`;
        stage.style.width = '100%';
        stage.style.boxSizing = 'border-box';
        stage.style.padding = `${NL_CARD_SIDE_PADDING}px`;
    }
    photoImg.style.width = `${px}px`;
    photoImg.style.maxWidth = '100%';
    photoImg.style.height = 'auto';
}

function getPersonalVideoWidthPercent() {
    const el = document.getElementById('nl-personal-video-size');
    const raw = el ? parseInt(el.value, 10) : NL_MEDIA_SIZE_DEFAULT;
    if (Number.isNaN(raw)) return NL_MEDIA_SIZE_DEFAULT;
    return Math.min(NL_MEDIA_SIZE_MAX, Math.max(NL_MEDIA_SIZE_MIN, raw));
}

function getPersonalVideoWidthPx() {
    return Math.round(NL_CARD_CONTENT_WIDTH * getPersonalVideoWidthPercent() / 100);
}

function formatPersonalVideoSizeLabel() {
    const pct = getPersonalVideoWidthPercent();
    const px = getPersonalVideoWidthPx();
    if (pct >= 100) return `Full width (${px}px)`;
    return `${pct}% (${px}px)`;
}

function updatePersonalVideoSizeUI() {
    const sizeWrap = document.getElementById('nl-personal-video-size-wrap');
    const labelEl = document.getElementById('nl-personal-video-size-label');
    const videoEnabled = !!document.getElementById('nl-include-video')?.checked && !!document.getElementById('nl-personal')?.checked;
    if (sizeWrap) sizeWrap.classList.toggle('hidden', !videoEnabled);
    if (labelEl) labelEl.textContent = formatPersonalVideoSizeLabel();
}

function applyPersonalVideoPreviewSizing() {
    const videoThumb = document.getElementById('nl-personal-video-preview-thumb');
    const stage = document.getElementById('nl-personal-video-preview-stage');
    if (!videoThumb) return;
    const px = getPersonalVideoWidthPx();
    if (stage) {
        stage.style.maxWidth = `${NL_CARD_CONTENT_WIDTH}px`;
        stage.style.width = '100%';
        stage.style.boxSizing = 'border-box';
        stage.style.padding = `${NL_CARD_SIDE_PADDING}px`;
    }
    videoThumb.style.width = `${px}px`;
    videoThumb.style.maxWidth = '100%';
    videoThumb.style.height = 'auto';
}

/** Refresh preview iframe srcdoc without rebuilding the whole output panel. */
function setNewsletterPreviewHTML(html) {
    const previewEl = document.getElementById('nl-preview');
    if (!previewEl || !html) return;
    const iframe = previewEl.querySelector('iframe');
    if (iframe) {
        applyNewsletterPreviewIframeIsolation(iframe);
        iframe.srcdoc = hardenNewsletterPreviewHtml(html);
        return;
    }
    mountNewsletterPreviewIframe(previewEl, html);
}

/** When sliders move after generation, patch photo/video widths in saved HTML + preview. */
function patchPersonalMediaSizesInNewsletter() {
    const rawEl = document.getElementById('nl-html-raw');
    let html = (lastGeneratedHTML || '').trim() || (rawEl?.value || '').trim();
    if (!html) return;

    const photoEnabled = !!document.getElementById('nl-include-photo')?.checked && !!document.getElementById('nl-personal')?.checked;
    const videoEnabled = !!document.getElementById('nl-include-video')?.checked;
    const photoUrl = (document.getElementById('nl-personal-photo')?.value || '').trim();
    const videoUrl = (document.getElementById('nl-personal-video')?.value || '').trim();
    const before = html;

    if (photoEnabled && photoUrl) {
        const photoBlock = buildPersonalPhotoInsert(photoUrl);
        if (/data-nl-personal-photo=["']1["']/i.test(html)) {
            html = html.replace(/<table[^>]*data-nl-personal-photo=["']1["'][^>]*>[\s\S]*?<\/table>/gi, photoBlock);
        } else if (/alt=["']Personal photo["']/i.test(html)) {
            html = html
                .replace(/<table[^>]*>[\s\S]*?<img[^>]*alt=["']Personal photo["'][^>]*>[\s\S]*?<\/table>/gi, photoBlock)
                .replace(/<img[^>]*alt=["']Personal photo["'][^>]*>/gi, (match) => {
                    const srcMatch = match.match(/\bsrc=["']([^"']+)["']/i);
                    if (!srcMatch) return match;
                    const px = getPersonalPhotoWidthPx();
                    return `<img src="${srcMatch[1]}" alt="Personal photo" width="${px}" style="display:block;margin:0 auto;max-width:100%;width:${px}px;height:auto;border:0;border-radius:8px;">`;
                });
        }
    }

    if (videoEnabled && videoUrl) {
        const videoTable = buildPersonalVideoTable(videoUrl);
        if (/data-nl-personal-video=["']1["']/i.test(html)) {
            html = html.replace(/<table[^>]*data-nl-personal-video=["']1["'][^>]*>[\s\S]*?<\/table>/gi, videoTable);
        } else if (/Personal Video Update/i.test(html)) {
            html = injectPersonalVideoSection(html, videoUrl);
        }
    }

    html = applyPersonalMediaWidthsInHtml(html);
    html = applyNewsletterColorBundle(html);
    if (html === before) return;

    lastGeneratedHTML = html;
    if (rawEl) rawEl.value = html;
    setNewsletterPreviewHTML(html);
    try { localStorage.setItem('lastNewsletterHTML', html); } catch (e) {}
}

const NL_CORE_DIRECTION_SECTIONS = [
    { key: 'market', checkboxId: 'nl-market', inputId: 'nl-direction-market', label: 'Market Updates' },
    { key: 'industry', checkboxId: 'nl-industry', inputId: 'nl-direction-industry', label: 'Industry News' },
    { key: 'local', checkboxId: 'nl-local', inputId: 'nl-direction-local', label: 'Local Update' },
    { key: 'recipes', checkboxId: 'nl-recipes', inputId: 'nl-direction-recipes', label: 'Recipes' }
];

function looksLikeUrl(text) {
    const t = String(text || '').trim();
    return /^https?:\/\//i.test(t) || /^www\./i.test(t);
}

function getCoreSectionDirections() {
    const out = {};
    NL_CORE_DIRECTION_SECTIONS.forEach((cfg) => {
        out[cfg.key] = (document.getElementById(cfg.inputId)?.value || '').trim();
    });
    return out;
}

function truncateDirectionPreview(text, max = 42) {
    const t = String(text || '').trim();
    if (!t) return '';
    if (t.length <= max) return t;
    return `${t.slice(0, max - 1)}…`;
}

function buildCoreSectionDirectionsPromptLines(selections) {
    const lines = [];
    const directions = getCoreSectionDirections();
    const directed = NL_CORE_DIRECTION_SECTIONS.filter((cfg) => {
        return selections?.contentSections?.[cfg.key] && directions[cfg.key];
    });

    if (!directed.length) {
        lines.push('- Per-section direction: none provided for core sections — use credible research and the user\'s market location for Market, Industry, Local, and Recipes.');
        return lines;
    }

    lines.push('**PER-SECTION DIRECTION (user-provided — prioritize over generic research):**');
    directed.forEach((cfg) => {
        const val = directions[cfg.key];
        const urlNote = looksLikeUrl(val)
            ? ' Treat as a source URL: summarize the key takeaway, cite the source by name, and include a clickable hyperlink in that section\'s Sources line.'
            : ' Use as the topic/angle for this section — be specific, timely, and local where applicable.';
        lines.push(`- ${cfg.label}: "${val}"${urlNote}`);
    });

    const undirectedIncluded = NL_CORE_DIRECTION_SECTIONS.filter((cfg) => {
        return selections?.contentSections?.[cfg.key] && !directions[cfg.key];
    });
    if (undirectedIncluded.length) {
        lines.push(`- No direction provided for: ${undirectedIncluded.map((c) => c.label).join(', ')} — research and write these sections using location + credible sources.`);
    }

    return lines;
}

function getCombinedSpecificTopicsForPrompt(selections) {
    const globalExtra = (document.getElementById('nl-specific')?.value || '').trim();
    const coreLines = buildCoreSectionDirectionsPromptLines(selections);
    const parts = [];
    if (coreLines.length) parts.push(coreLines.join('\n'));
    if (globalExtra) parts.push(`Global extra instructions: "${globalExtra}"`);
    return parts.length ? parts.join('\n\n') : 'None';
}

function setCoreDirectionPanelOpen(card, open) {
    if (!card) return;
    const panel = card.querySelector('.nl-core-direction-panel');
    const toggle = card.querySelector('.nl-core-direction-toggle');
    const chevron = card.querySelector('.nl-core-direction-chevron');
    if (!panel || !toggle) return;
    panel.classList.toggle('hidden', !open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (chevron) chevron.classList.toggle('rotate-180', open);
    card.dataset.nlDirectionOpen = open ? '1' : '0';
}

function updateCoreSectionDirectionUI() {
    const directions = getCoreSectionDirections();
    let checkedCount = 0;
    let directedCount = 0;

    NL_CORE_DIRECTION_SECTIONS.forEach((cfg) => {
        const cb = document.getElementById(cfg.checkboxId);
        const card = document.querySelector(`.nl-core-section-card[data-nl-core-key="${cfg.key}"]`);
        if (!card) return;

        const checked = !!cb?.checked;
        const directed = checked && !!directions[cfg.key];
        const wrap = card.querySelector('.nl-core-direction-wrap');
        const badge = card.querySelector('.nl-core-directed-badge');
        const toggleLabel = card.querySelector('.nl-core-direction-toggle-label');
        const input = document.getElementById(cfg.inputId);

        if (checked) checkedCount += 1;
        if (directed) directedCount += 1;

        card.classList.toggle('opacity-50', !checked);
        card.classList.toggle('border-[#00A89D]/50', checked && directed);
        card.classList.toggle('ring-1', checked && directed);
        card.classList.toggle('ring-[#00A89D]/25', checked && directed);
        card.classList.toggle('shadow-sm', checked && directed);

        if (wrap) wrap.classList.toggle('hidden', !checked);
        if (badge) badge.classList.toggle('hidden', !directed);

        if (toggleLabel) {
            if (!checked) toggleLabel.textContent = 'Add direction or URL (optional)';
            else if (directed) toggleLabel.textContent = card.dataset.nlDirectionOpen === '1' ? 'Hide direction' : 'Edit direction ✓';
            else toggleLabel.textContent = card.dataset.nlDirectionOpen === '1' ? 'Hide direction' : 'Add direction or URL (optional)';
        }

        if (input) {
            input.classList.toggle('border-[#00A89D]/60', directed);
            input.classList.toggle('bg-[#00A89D]/5', directed);
        }

        if (!checked) setCoreDirectionPanelOpen(card, false);
    });

    const progressEl = document.getElementById('nl-core-direction-progress');
    if (progressEl) {
        if (!checkedCount) {
            progressEl.classList.add('hidden');
            progressEl.textContent = '';
        } else if (!directedCount) {
            progressEl.classList.remove('hidden');
            progressEl.innerHTML = '<span class="text-gray-500">Tip: add a link or topic under any section for a sharper edition</span>';
        } else if (directedCount === checkedCount) {
            progressEl.classList.remove('hidden');
            progressEl.innerHTML = `<span class="text-[#00A89D] font-semibold">✨ All ${checkedCount} core section${checkedCount === 1 ? '' : 's'} directed — excellent!</span>`;
        } else {
            progressEl.classList.remove('hidden');
            progressEl.innerHTML = `<span class="text-[#00A89D] font-semibold">${directedCount} of ${checkedCount}</span> <span class="text-gray-500">sections directed — more direction = more you</span>`;
        }
    }
}

async function pasteUrlIntoDirectionField(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    try {
        const text = (await navigator.clipboard.readText() || '').trim();
        if (!text) {
            if (typeof window.notifyUser === 'function') window.notifyUser('Clipboard is empty — copy an article link first.', 'warning', 2800);
            else alert('Clipboard is empty — copy an article link first.');
            return;
        }
        const isUrl = looksLikeUrl(text) || /^[^\s]+\.[^\s]{2,}/.test(text);
        if (!isUrl) {
            if (typeof window.notifyUser === 'function') window.notifyUser('That doesn\'t look like a link — paste a URL or type a topic in the field instead.', 'warning', 3200);
            else alert('That doesn\'t look like a link — paste a URL or type a topic instead.');
            return;
        }
        const normalized = /^https?:\/\//i.test(text) ? text : `https://${text}`;
        input.value = normalized;
        const card = input.closest('.nl-core-section-card');
        if (card) setCoreDirectionPanelOpen(card, true);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        if (typeof window.notifyUser === 'function') window.notifyUser('Link pasted — we\'ll summarize and cite it in that section.', 'success', 2600);
    } catch (e) {
        input.focus();
        if (typeof window.notifyUser === 'function') window.notifyUser('Tap the field and paste your link (Ctrl+V / ⌘V).', 'info', 3000);
    }
}

function wireCoreSectionDirectionControls() {
    const grid = document.getElementById('nl-core-sections-grid');
    if (!grid || grid.dataset.nlCoreDirectionWired === '1') return;
    grid.dataset.nlCoreDirectionWired = '1';

    grid.addEventListener('click', (e) => {
        const pasteBtn = e.target.closest('.nl-core-paste-url-btn');
        if (pasteBtn) {
            e.preventDefault();
            pasteUrlIntoDirectionField(pasteBtn.getAttribute('data-nl-paste-for'));
            return;
        }

        const toggle = e.target.closest('.nl-core-direction-toggle');
        if (toggle) {
            e.preventDefault();
            const card = toggle.closest('.nl-core-section-card');
            const open = card?.dataset.nlDirectionOpen !== '1';
            setCoreDirectionPanelOpen(card, open);
            updateCoreSectionDirectionUI();
            if (open) {
                const input = card.querySelector('.nl-core-direction-input');
                window.setTimeout(() => input?.focus(), 80);
            }
        }
    });

    NL_CORE_DIRECTION_SECTIONS.forEach((cfg) => {
        const cb = document.getElementById(cfg.checkboxId);
        cb?.addEventListener('change', () => {
            updateCoreSectionDirectionUI();
        });
    });
}

function updateSpecificTopicsPlaceholder() {
    const hintEl = document.getElementById('nl-specific-hint');
    if (hintEl) {
        hintEl.textContent = 'Whole-newsletter tweaks only — language, tone emphasis, or cross-section notes. Per-section topics live in the cards above.';
    }
    updateCoreSectionDirectionUI();
}

// === GLOBAL EMAIL / CRM SETTINGS ===
const EMAIL_WIDTH = 600;
/** Usable width inside a teal card (600px table − 30px side padding). Slider 100% = this width. */
const NL_CARD_SIDE_PADDING = 30;
const NL_CARD_CONTENT_WIDTH = EMAIL_WIDTH - (NL_CARD_SIDE_PADDING * 2);
const BODY_PADDING = 90;        // left + right padding for centering
const MODULE_PADDING = 20;      // consistent spacing between modules
const HEADER_HEIGHT = 60;       // recommended for headers (used if needed)

// Load saved values on page load
document.addEventListener('DOMContentLoaded', () => {
    persistentFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const saved = localStorage.getItem(id);
            if (saved !== null) {
                if (id === 'nl-logo') {
                    if (saved && saved.trim() !== '') {
                        el.value = saved;
                    }
                } else {
                    el.value = saved;
                }
            }
        }
    });

    const savedSections = safeParseJSONArray('nl-sections');
    document.querySelectorAll('#newsletter-generator input[type="checkbox"]').forEach(cb => {
        if (savedSections.includes(cb.id)) {
            cb.checked = true;
        } else if (cb.id === 'nl-include-referral') {
            cb.checked = true;
        } else if (savedSections.length > 0) {
            cb.checked = false;
        }
    });

    // Load used items and selections
    usedFunFacts = safeParseJSONArray('usedFunFacts');
    usedProTips = safeParseJSONArray('usedProTips');
    usedQuotes = safeParseJSONArray('usedQuotes');

    if (!funFactIsCustom) {
        selectedFunFact = funFacts.includes(selectedFunFact) ? selectedFunFact : getRandomItem(funFacts, usedFunFacts);
    }
    if (!proTipIsCustom) {
        selectedProTip = proTips.includes(selectedProTip) ? selectedProTip : getRandomItem(proTips, usedProTips);
    }
    if (!quoteIsCustom) {
        selectedQuote = motivationalQuotes.includes(selectedQuote) ? selectedQuote : getRandomItem(motivationalQuotes, usedQuotes);
    }

    updatePreviews();

    // Ensure profile sync on this legacy load path too (for name/email/market etc)
    if (typeof syncNewsletterFromProfile === 'function') {
      setTimeout(() => { try { syncNewsletterFromProfile(); } catch(e){} }, 60);
    }
});

// Auto-save on change
persistentFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', () => localStorage.setItem(id, el.value));
        el.addEventListener('change', () => localStorage.setItem(id, el.value));
    }
});

// Save checkboxes on change + handle show/hide for Personal and Blog sections
document.querySelectorAll('#newsletter-generator input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
        const checked = Array.from(document.querySelectorAll('#newsletter-generator input[type="checkbox"]:checked'))
                             .map(c => c.id)
                             .filter((id) => id.startsWith('nl-'));
        localStorage.setItem('nl-sections', JSON.stringify(checked));

        // Visual toggles for expandable sections
        if (cb.id === 'nl-personal') {
            const fields = document.getElementById('personal-fields');
            if (fields) fields.classList.toggle('hidden', !cb.checked);
        }
        if (cb.id === 'nl-include-video' && cb.checked) {
            const personalCb = document.getElementById('nl-personal');
            const fields = document.getElementById('personal-fields');
            if (personalCb && !personalCb.checked) {
                personalCb.checked = true;
                if (fields) fields.classList.remove('hidden');
            }
        }
        if (cb.id === 'nl-include-blog') {
            const fields = document.getElementById('blog-fields');
            if (fields) fields.classList.toggle('hidden', !cb.checked);
        }
        if (Object.values(NL_CUSTOM_CONTENT_BLOCKS).some((cfg) => cfg.checkboxId === cb.id)) {
            updateCustomContentChoicesVisibility();
        }
    });
});

// Initial state on load (restore visibility if checkboxes were checked before)
document.addEventListener('DOMContentLoaded', () => {
    const personalCb = document.getElementById('nl-personal');
    const personalFields = document.getElementById('personal-fields');
    if (personalCb && personalFields) {
        personalFields.classList.toggle('hidden', !personalCb.checked);
    }

    const blogCb = document.getElementById('nl-include-blog');
    const blogFields = document.getElementById('blog-fields');
    if (blogCb && blogFields) {
        blogFields.classList.toggle('hidden', !blogCb.checked);
    }

    updateCustomContentChoicesVisibility();
    updateSpecificTopicsPlaceholder();
    if (window.NlEntertainment && typeof window.NlEntertainment.wireUI === 'function') {
        window.NlEntertainment.wireUI();
    }

    // Profile sync on this load path too
    if (typeof syncNewsletterFromProfile === 'function') {
      setTimeout(() => { try { syncNewsletterFromProfile(); } catch(e){} }, 70);
    }
});

document.getElementById('generate-newsletter-btn')?.addEventListener('click', async () => {
    generateNewsletter('');
});

document.getElementById('regenerate-with-edits-btn')?.addEventListener('click', async () => {
    const feedback = document.getElementById('nl-feedback')?.value.trim() || '';
    if (!feedback) {
        alert('Please enter feedback or specific edits first!');
        return;
    }
    if (!lastGeneratedHTML) {
        const raw = document.getElementById('nl-html-raw')?.value?.trim();
        if (raw) lastGeneratedHTML = raw;
    }
    if (!lastGeneratedHTML) {
        alert('No previous newsletter to edit — generate one first!');
        return;
    }
    generateNewsletter(feedback);
});

/** Content section checkboxes only (not personal/blog/media toggles). */
const NL_CONTENT_SECTIONS = {
    market: {
        id: 'nl-market',
        label: 'Market Updates',
        headings: ['Market Update', 'Market Updates', 'Market Insights', 'Market Snapshot', 'Housing Market Update']
    },
    industry: {
        id: 'nl-industry',
        label: 'Industry News',
        headings: ['Industry News', 'Industry Insights', 'Industry Update', 'Mortgage Industry News']
    },
    local: {
        id: 'nl-local',
        label: 'Local Update',
        headings: ['Local Update', 'Local Spotlight', 'Local Flavor', 'Around Town', 'Community Spotlight']
    },
    recipes: {
        id: 'nl-recipes',
        label: 'Recipes',
        headings: ['Recipe', 'Recipes', 'Quick Recipe', 'Kitchen Corner', 'Recipe of the Month']
    },
    fun: {
        id: 'nl-fun',
        label: 'Fun Facts',
        headings: ['Fun Fact', 'Fun Facts'],
        placeholderId: 'fun-fact-placeholder'
    },
    tip: {
        id: 'nl-tip',
        label: 'Homeownership Tip',
        headings: ['Pro Tip', 'Homeownership Tip', 'Tip of the Month', 'Home Tip', 'Homeowner Tip'],
        placeholderId: 'pro-tip-placeholder'
    },
    quote: {
        id: 'nl-quote',
        label: 'Motivational Quote',
        headings: ['Motivational Quote', 'Quote of the Month', 'Inspiration', 'Weekly Inspiration'],
        placeholderId: 'quote-placeholder'
    },
    dadjoke: {
        id: 'nl-dadjoke',
        label: 'Dad Joke',
        headings: ['Dad Joke', 'Dad Joke of the Week', 'Groaner of the Week'],
        placeholderId: 'dad-joke-placeholder'
    },
    puzzle: {
        id: 'nl-puzzle',
        label: 'Weekly Brain Teaser',
        headings: ['Trivia Time', 'Word Scramble', 'Riddle of the Week', 'Weekly Brain Teaser', 'Brain Teaser'],
        placeholderId: 'brain-teaser-placeholder'
    }
};

/** Inline curated section rows in Sections to Include (mirrors engagement checkboxes). */
const NL_CUSTOM_CONTENT_BLOCKS = {
    fun: { checkboxId: 'nl-fun', rowId: 'nl-engagement-row-fun', category: 'funFact', previewId: 'fun-fact-preview', shortLabel: 'Fun Facts' },
    tip: { checkboxId: 'nl-tip', rowId: 'nl-engagement-row-tip', category: 'proTip', previewId: 'pro-tip-preview', shortLabel: 'Pro Tip' },
    quote: { checkboxId: 'nl-quote', rowId: 'nl-engagement-row-quote', category: 'quote', previewId: 'quote-preview', shortLabel: 'Quote' },
    dadjoke: { checkboxId: 'nl-dadjoke', rowId: 'nl-engagement-row-dadjoke', category: 'dadJoke', previewId: 'dad-joke-preview', shortLabel: 'Dad Joke' },
    puzzle: { checkboxId: 'nl-puzzle', rowId: 'nl-engagement-row-puzzle', category: 'puzzle', previewId: 'brain-teaser-preview', shortLabel: 'Brain Teaser' }
};

function scrollToNewsletterCustomContent(sectionKey) {
    openNewsletterEngagementHub(sectionKey);
}

function getCuratedPreviewSnippet(previewId, maxLen = 72) {
    const el = document.getElementById(previewId);
    if (!el) return '';
    let text = (el.textContent || '').trim();
    text = text.replace(/^your pick\s*/i, '').replace(/\s+/g, ' ');
    if (!text || /not selected/i.test(text) || /no\s+\w+\s+selected/i.test(text)) return '';
    return truncateDirectionPreview(text, maxLen);
}

function updateCustomContentChoicesVisibility() {
    Object.entries(NL_CUSTOM_CONTENT_BLOCKS).forEach(([key, cfg]) => {
        const cb = document.getElementById(cfg.checkboxId);
        const row = document.getElementById(cfg.rowId);
        const show = !!cb?.checked;
        if (!row) return;
        row.classList.toggle('border-[#00A89D]/50', show);
        row.classList.toggle('ring-1', show);
        row.classList.toggle('ring-[#00A89D]/25', show);
        row.querySelectorAll('.nl-curated-row-actions, .nl-curated-preview-wrap').forEach((el) => {
            el.classList.toggle('hidden', !show);
        });
    });
    updateCuratedRowStatuses();
    updateEngagementSectionSummary();
}

function wireCustomContentJumpControls() {
    const sectionsCard = document.getElementById('nl-sections-card');
    if (sectionsCard && !sectionsCard._nlInlineCustomizeWired) {
        sectionsCard._nlInlineCustomizeWired = true;
        sectionsCard.addEventListener('click', (e) => {
            const resetBtn = e.target.closest('[data-nl-reset-used]');
            if (resetBtn) {
                e.preventDefault();
                e.stopPropagation();
                const key = resetBtn.getAttribute('data-nl-reset-used');
                if (key && typeof resetUsed === 'function') resetUsed(key);
                return;
            }
            const shuffleBtn = e.target.closest('[data-nl-shuffle]');
            if (shuffleBtn) {
                e.preventDefault();
                e.stopPropagation();
                const cat = shuffleBtn.getAttribute('data-nl-shuffle');
                if (cat && typeof regenerateRandom === 'function') regenerateRandom(cat);
                return;
            }
            const btn = e.target.closest('.nl-inline-customize-btn');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            openNewsletterEngagementHub(btn.getAttribute('data-nl-jump-custom'));
        });
    }

    document.getElementById('nl-shuffle-all-engagement')?.addEventListener('click', (e) => {
        e.preventDefault();
        shuffleAllCheckedEngagement();
    });
    document.getElementById('nl-open-engagement-hub')?.addEventListener('click', (e) => {
        e.preventDefault();
        openFirstCheckedEngagementHub();
    });
}

function extractYouTubeVideoId(url) {
    if (!url) return '';
    const raw = String(url).trim();
    let id = '';
    try {
        const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
        const host = parsed.hostname.replace(/^www\./, '');
        if (host === 'youtu.be') {
            id = parsed.pathname.split('/').filter(Boolean)[0] || '';
        } else if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
            if (parsed.pathname.includes('/shorts/')) {
                id = parsed.pathname.split('/shorts/')[1]?.split('/')[0] || '';
            } else if (parsed.pathname.includes('/embed/')) {
                id = parsed.pathname.split('/embed/')[1]?.split('/')[0] || '';
            } else if (parsed.pathname.includes('/live/')) {
                id = parsed.pathname.split('/live/')[1]?.split('/')[0] || '';
            } else {
                id = parsed.searchParams.get('v') || '';
            }
        }
    } catch (e) {
        if (raw.includes('youtu.be/')) id = raw.split('youtu.be/')[1]?.split(/[?&#]/)[0] || '';
        else if (raw.includes('shorts/')) id = raw.split('shorts/')[1]?.split(/[?&#]/)[0] || '';
        else if (raw.includes('v=')) id = raw.split('v=')[1]?.split(/[?&#]/)[0] || '';
        else if (raw.includes('embed/')) id = raw.split('embed/')[1]?.split(/[?&#]/)[0] || '';
    }
    id = (id || '').trim();
    return id.length === 11 ? id : '';
}

function getNewsletterAccentColor() {
    return window.NlColorBundles?.getActiveBundle()?.primary || '#00A89D';
}

const NL_SECTION_LEFT_BORDER_IN_TABLE_RE = /border-left:\s*(?:4|8)px\s+solid\s+#?[0-9a-fA-F]{3,6}/i;

function buildPersonalVideoTable(personalVideoUrl) {
    const url = String(personalVideoUrl || '').trim();
    if (!url) return '';
    const href = url.startsWith('http') ? url : `https://${url}`;
    const videoId = extractYouTubeVideoId(href);
    const videoWidthPx = getPersonalVideoWidthPx();
    const thumbnailUrl = videoId
        ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        : 'https://via.placeholder.com/560x315/002B5C/FFFFFF?text=Watch+Video';

    return `
<table width="100%" cellpadding="0" cellspacing="0" align="center" data-nl-personal-video="1" style="${NL_MODULE_WIDTH_STYLE}background:#f9f9f9;border-left:8px solid #00A89D;border-collapse:separate;">
  <tr>
    <td style="padding:30px;box-sizing:border-box;">
      <p style="margin:0 0 16px;font-size:19px;color:#002B5C;font-weight:700;text-align:center;">Personal Video Update</p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tr>
          <td align="center" style="padding:0;">
            <a href="${href}" target="_blank" rel="noopener" style="text-decoration:none;display:inline-block;max-width:100%;">
              <img src="${thumbnailUrl}" alt="Watch Personal Video" width="${videoWidthPx}" style="display:block;margin:0 auto;width:${videoWidthPx}px;max-width:100%;height:auto;border:3px solid #00A89D;border-radius:8px;">
            </a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:18px;">
            <a href="${href}" target="_blank" rel="noopener" style="display:inline-block;padding:16px 40px;background:#F15A29;color:#fff;font-weight:bold;font-size:19px;text-decoration:none;border-radius:30px;">▶ Watch Video</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

const NL_MODULE_WIDTH_STYLE = 'width:100%;max-width:600px;margin:0 auto;box-sizing:border-box;';
const NL_MODULE_TABLE_TEST_RE = /data-nl-main-body|data-nl-personal-video|border-left:\s*8px solid|border-top:\s*\d+px solid|My Recent Blog/i;

function applyModuleTableWidth(tableTag) {
    let tag = String(tableTag || '');
    tag = tag.replace(/\bwidth\s*=\s*["']600["']/i, 'width="100%"');
    if (!/width\s*=\s*["']/i.test(tag)) {
        tag = tag.replace(/<table\b/i, '<table width="100%"');
    }
    if (!/align\s*=\s*["']center["']/i.test(tag)) {
        tag = tag.replace(/<table\b([^>]*)>/i, '<table$1 align="center">');
    }
    if (/style\s*=\s*"/i.test(tag)) {
        tag = tag.replace(/style\s*=\s*"([^"]*)"/i, (m, styleVal) => {
            let style = styleVal
                .replace(/\bmin-width\s*:\s*[^;"]*/gi, '')
                .replace(/\btable-layout\s*:\s*fixed/gi, '')
                .replace(/\bwidth\s*:\s*600px/gi, '')
                .replace(/\bmax-width\s*:\s*[^;"]*/gi, '')
                .replace(/\bmargin\s*:\s*[^;"]*/gi, '')
                .replace(/\bbox-sizing\s*:\s*[^;"]*/gi, '')
                .replace(/;;+/g, ';')
                .replace(/^;|;$/g, '')
                .trim();
            if (style && !style.endsWith(';')) style += ';';
            return `style="${NL_MODULE_WIDTH_STYLE}${style}"`;
        });
    } else {
        tag = tag.replace(/>$/, ` style="${NL_MODULE_WIDTH_STYLE}">`);
    }
    return tag;
}

function normalizeNewsletterModuleWidths(html) {
    let out = String(html || '');

    out = out.replace(/<table\b[^>]*>/gi, (tableTag) => {
        if (!NL_MODULE_TABLE_TEST_RE.test(tableTag)) return tableTag;
        if (/data-nl-personal-photo/i.test(tableTag)) return tableTag;
        if (/role\s*=\s*["']presentation["']/i.test(tableTag) && !/data-nl-|border-left/i.test(tableTag)) return tableTag;
        return applyModuleTableWidth(tableTag);
    });

    out = out.replace(
        /(<tr>\s*<td)([^>]*)(>[\s\S]*?<h1\b)/gi,
        (m, open, tdAttrs, rest) => {
            let attrs = String(tdAttrs || '').replace(/\bwidth\s*=\s*["']600["']/gi, '');
            attrs = attrs.replace(/\bmin-width\s*:\s*600px/gi, '');
            if (!/max-width\s*:\s*600px/i.test(attrs)) {
                attrs = /style\s*=/i.test(attrs)
                    ? attrs.replace(/style\s*=\s*"/i, 'style="max-width:600px;margin:0 auto;box-sizing:border-box;')
                    : `${attrs} style="max-width:600px;margin:0 auto;box-sizing:border-box;"`;
            }
            return `${open}${attrs}${rest}`;
        }
    );

    return out;
}

function wrapNewsletterSectionRows(innerHtml, options) {
    if (!innerHtml) return '';
    const leading = options?.skipLeadingSpacer
        ? ''
        : '<tr><td height="20"></td></tr>\n';
    return `${leading}<tr><td style="padding:0;">
${innerHtml}
</td></tr>
<tr><td height="20"></td></tr>`;
}

function wrapPersonalVideoRows(videoTable, options) {
    return wrapNewsletterSectionRows(videoTable, options);
}

const NL_SECTION_SPACER_ROW_END_RE = /<tr>\s*<td[^>]*height=["']?20["']?[^>]*>\s*<\/td>\s*<\/tr>\s*$/i;
const NL_SECTION_SPACER_ROW_START_RE = /^<tr>\s*<td[^>]*height=["']?20["']?[^>]*>\s*<\/td>\s*<\/tr>\s*/i;

function endsWithSectionSpacerRow(html) {
    return NL_SECTION_SPACER_ROW_END_RE.test(String(html || '').trimEnd());
}

function matchSectionSpacerRowLengthAt(html, index) {
    const slice = String(html || '').slice(index).trimStart();
    const match = NL_SECTION_SPACER_ROW_START_RE.exec(slice);
    return match ? match[0].length : 0;
}

function findMatchingTableCloseIndex(htmlFromOpen) {
    const re = /<table\b[^>]*>|<\/table>/gi;
    let depth = 0;
    let match;
    while ((match = re.exec(htmlFromOpen)) !== null) {
        if (/^<table\b/i.test(match[0])) depth++;
        else {
            depth--;
            if (depth === 0) return match.index + match[0].length;
        }
    }
    return -1;
}

/** Prefer the outer 600px shell so footer rows stay inside the centered column. */
function findLoMainTableCloseIndex(html) {
    const src = String(html || '');
    const bodyIdx = src.search(/<\/body>/i);
    if (bodyIdx < 0) return src.lastIndexOf('</table>');
    const beforeBody = src.slice(0, bodyIdx);
    const mainTableOpenRe = /<table\b[^>]*(?:\bwidth=["']?600\b|style=["'][^"']*width:\s*600px)[^>]*>/gi;
    let bestClose = -1;
    let openMatch;
    while ((openMatch = mainTableOpenRe.exec(beforeBody)) !== null) {
        const closeRel = findMatchingTableCloseIndex(beforeBody.slice(openMatch.index));
        if (closeRel >= 0) {
            const absClose = openMatch.index + closeRel;
            if (absClose > bestClose) bestClose = absClose;
        }
    }
    if (bestClose >= 0) return bestClose;
    return beforeBody.lastIndexOf('</table>');
}

function insertRowsInsideMainTable(html, rows) {
    if (!rows) return html;
    const src = String(html || '');
    const bodyIdx = src.search(/<\/body>/i);
    if (bodyIdx < 0) {
        return src + rows;
    }
    const insertAt = findLoMainTableCloseIndex(src);
    if (insertAt >= 0) {
        return src.slice(0, insertAt) + rows + '\n' + src.slice(insertAt);
    }
    return src.replace(/<\/body>/i, '<table width="600" align="center" cellpadding="0" cellspacing="0">' + rows + '</table></body>');
}

const NL_BLOG_HEADING_RE = '(?:My Recent Blog|From the Blog|Blog Highlight|Recent Blog|Latest Blog Post)';
const REFERRAL_CTA_HEADLINE = 'Know Someone Ready to Buy or Refinance?';

function escNewsletterAttr(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escNewsletterHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function stripReferralSections(html) {
    let out = String(html || '');
    out = out.replace(/<table\b[^>]*data-nl-referral-block=["']1["'][^>]*>[\s\S]*?<\/table>\s*/gi, '');
    const headlines = [REFERRAL_CTA_HEADLINE, 'Know Someone Thinking About Buying or Selling?'];
    headlines.forEach((h) => {
        const re = new RegExp('<tr>\\s*<td[^>]*>[\\s\\S]*?' + h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?<\\/table>\\s*<\\/td>\\s*<\\/tr>\\s*(?:<tr>\\s*<td[^>]*height=["\']?20["\']?[^>]*>\\s*<\\/td>\\s*<\\/tr>\\s*)?', 'gi');
        out = out.replace(re, '');
    });
    out = out.replace(/\[REFERRAL CTA PLACEHOLDER\]/gi, '');
    out = out.replace(/<!--\s*REFERRAL CTA PLACEHOLDER\s*-->/gi, '');
    return out;
}

function buildCompactReferralRowHtml(firstName, email) {
    const safeEmail = escNewsletterAttr(email);
    const mailSubject = encodeURIComponent('Referral from a Friend — Ready for Mortgage Help!');
    const mailBody = encodeURIComponent(`Hi ${firstName},\n\nI'd like to refer someone who's interested in mortgage options.\n\nName: \nPhone: \nEmail: \nThey're looking for: (buying / refinancing / other)\n\nThanks!\n`);
    return `<table width="600" cellpadding="0" cellspacing="0" align="center" border="0" data-nl-referral-block="1" style="width:600px;background:#fafafa;border-top:2px solid #e0e0e0;border-collapse:collapse;">
  <tr>
    <td width="600" align="center" style="width:600px;padding:14px 24px 18px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
      <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#002B5C;letter-spacing:0.2px;">${REFERRAL_CTA_HEADLINE}</p>
      <p style="margin:0 0 12px;font-size:12px;line-height:1.45;color:#666;">Know someone buying or refinancing? Forward this email — or tap below.</p>
      <a href="mailto:${safeEmail}?subject=${mailSubject}&body=${mailBody}" style="display:inline-block;padding:9px 20px;background:#00A89D;color:#ffffff;font-size:13px;font-weight:bold;text-decoration:none;border-radius:20px;">Send a Referral</a>
    </td>
  </tr>
</table>`;
}

const NL_DISCLAIMER_MARKERS_RE = /(?:Equal Housing(?:\s+Lender)?|informational purposes only|does not constitute an offer|commitment to lend|subject to credit approval|NMLS\s*#)/i;

const NL_STYLED_DISCLAIMER_TABLE_RE = /<table\b[^>]*data-nl-disclaimer-block=["']1["'][^>]*>[\s\S]*?<\/table>\s*/gi;

const NL_STYLED_DISCLAIMER_ROW_RE = /<tr>\s*<td[^>]*(?:data-nl-disclaimer-block|(?:background|bgcolor)[^>]*#?002[bB]5[cC])[^>]*>[\s\S]*?<\/td>\s*<\/tr>\s*(?:<tr>\s*<td[^>]*height=["']?\d+["']?[^>]*>\s*<\/td>\s*<\/tr>\s*)?/gi;

const NL_UNSTYLED_DISCLAIMER_ROW_RE = /<tr>\s*<td(?![^>]*(?:data-nl-disclaimer-block|(?:background|bgcolor)[^>]*#?002[bB]5[cC]))[^>]*>[\s\S]*?(?:Equal Housing|informational purposes|commitment to lend|NMLS\s*#)[\s\S]*?<\/td>\s*<\/tr>\s*(?:<tr>\s*<td[^>]*height=["']?\d+["']?[^>]*>\s*<\/td>\s*<\/tr>\s*)?/gi;

const LO_DISCLAIMER_BODY_TEXT =
    'This newsletter is for informational purposes only and does not constitute an offer or commitment to lend. ' +
    'All loans are subject to credit approval and property appraisal. Terms and conditions apply. ' +
    'Consult your tax or legal advisor for specific advice. Equal Housing Lender.';

function getNewsletterOfficerName() {
    const profile = getCentralProfile();
    return (profile.name || document.getElementById('nl-name')?.value || 'Your Loan Officer').trim();
}

function getNewsletterOfficerEmail() {
    const profile = getCentralProfile();
    return (profile.email || profile.workEmail || document.getElementById('nl-email')?.value || '').trim();
}

function syncNewsletterContactFromProfile() {
    const p = getCentralProfile();
    const nameEl = document.getElementById('nl-name');
    const emailEl = document.getElementById('nl-email');
    if (nameEl && p.name) nameEl.value = String(p.name).trim();
    if (emailEl && (p.email || p.workEmail)) {
        emailEl.value = String(p.email || p.workEmail || '').trim();
    }
}

function getLoFooterBrandingContext() {
    const profile = getCentralProfile();
    return {
        name: getNewsletterOfficerName() || 'Your Loan Officer',
        email: getNewsletterOfficerEmail(),
        nmls: String(profile.nmls || '').trim(),
        phone: String(profile.phone || '').trim(),
        company: 'Ruoff Mortgage',
    };
}

function buildLoContactLine(ctx) {
    const parts = [ctx.name];
    if (ctx.nmls) parts.push(`NMLS #${ctx.nmls}`);
    parts.push(ctx.company);
    if (ctx.email) parts.push(ctx.email);
    if (ctx.phone) parts.push(ctx.phone);
    return parts.join(' | ');
}

function buildLoDisclaimerFooterModule(ctx) {
    const c = ctx || getLoFooterBrandingContext();
    const contactLine = buildLoContactLine(c);
    return `<table width="600" cellpadding="0" cellspacing="0" align="center" border="0" data-nl-disclaimer-block="1" style="width:600px;background:#002B5C;border-collapse:collapse;">
  <tr>
    <td width="600" align="center" bgcolor="#002B5C" style="width:600px;padding:16px 24px 20px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:8px;line-height:1.55;color:#ffffff;background-color:#002B5C;">
      <p style="margin:0 0 8px;font-size:9px;color:#ffffff;line-height:1.5;">${escNewsletterHtml(contactLine)}</p>
      <p style="margin:0;font-size:8px;color:#ffffff;">${escNewsletterHtml(LO_DISCLAIMER_BODY_TEXT)}</p>
    </td>
  </tr>
</table>`;
}

function findDisclaimerFooterInsertPoint(html) {
    const src = String(html || '');
    const brainPlaceholder = src.search(/<!--\s*BRAIN_TEASER_ANSWER_PLACEHOLDER\s*-->/i);
    if (brainPlaceholder >= 0) return brainPlaceholder;
    const mainClose = findLoMainTableCloseIndex(src);
    if (mainClose >= 0) return mainClose;
    const bodyIdx = src.search(/<\/body>/i);
    return bodyIdx >= 0 ? bodyIdx : src.length;
}

function hasLoReferralBlock(html) {
    const src = String(html || '');
    return /data-nl-referral-block=["']1["']/i.test(src)
        || /Know Someone Ready to Buy or Refinance\?/i.test(src);
}

function dedupeLoReferralBlocks(html) {
    let out = String(html || '');
    let foundTable = false;
    out = out.replace(
        /<table\b[^>]*data-nl-referral-block=["']1["'][^>]*>[\s\S]*?<\/table>\s*/gi,
        (block) => {
            if (foundTable) return '';
            foundTable = true;
            return block;
        }
    );
    let foundRow = false;
    out = out.replace(
        /<tr[^>]*>[\s\S]*?Know Someone Ready to Buy or Refinance\?[\s\S]*?<\/tr>\s*/gi,
        (block) => {
            if (foundRow) return '';
            foundRow = true;
            return block;
        }
    );
    return out;
}

/** Move footer <tr> rows that drifted outside the 600px shell back inside it. */
function reparentLoOrphanFooterRows(html) {
    const src = String(html || '');
    const bodyMatch = src.match(/^([\s\S]*<body[^>]*>)([\s\S]*)(<\/body>[\s\S]*)$/i);
    if (!bodyMatch) return src;

    const mainClose = findLoMainTableCloseIndex(src);
    if (mainClose < 0) return src;

    const bodyEnd = src.search(/<\/body>/i);
    if (bodyEnd < 0 || mainClose >= bodyEnd) return src;

    const between = src.slice(mainClose, bodyEnd);
    if (!/<tr\b/i.test(between)) return src;
    if (!/(?:data-nl-disclaimer-block|Know Someone Ready to Buy or Refinance\?|Send a Referral|background:\s*#002B5C)/i.test(between)) {
        return src;
    }

    const rowsToMove = [];
    const cleanedBetween = between.replace(/<tr>[\s\S]*?<\/tr>\s*/gi, (row) => {
        if (/(?:data-nl-disclaimer-block|Know Someone Ready to Buy or Refinance\?|Send a Referral|background:\s*#002B5C)/i.test(row)) {
            rowsToMove.push(row);
            return '';
        }
        return row;
    });

    if (!rowsToMove.length) return src;
    return src.slice(0, mainClose) + '\n' + rowsToMove.join('\n') + cleanedBetween + src.slice(bodyEnd);
}

/** Refresh disclaimer from profile on restore — never touch referral blocks. */
function prepareLoNewsletterForRestore(html) {
    let out = dedupeLoReferralBlocks(String(html || ''));
    if (!out.trim()) return out;
    try {
        out = ensureLoNewsletterFooter(out);
    } catch (e) {
        console.warn('[newsletter] prepareLoNewsletterForRestore failed', e);
    }
    return out;
}

/** Rebuild referral + disclaimer as body-level modules (fixes refresh/preview tail drift). */
function repairLoNewsletterForPreview(html) {
    let out = String(html || '');
    if (!out.trim()) return out;
    try {
        const selections = getNewsletterSelections();
        const fullName = document.getElementById('nl-name')?.value || 'Your Loan Officer';
        const firstName = fullName.split(' ')[0].trim();
        out = stripReferralSections(out);
        out = ensureLoNewsletterFooter(out);
        if (selections.includeReferral) {
            const email = document.getElementById('nl-email')?.value || '';
            out = injectCompactReferralBeforeDisclaimer(out, buildCompactReferralRowHtml(firstName, email));
        }
        out = dedupeLoReferralBlocks(out);
    } catch (e) {
        console.warn('[newsletter] repairLoNewsletterForPreview failed', e);
    }
    return out;
}

/** Strip post-processed tail blocks before sending HTML back to the model for edits. */
function getNewsletterHtmlForFeedbackEdit() {
    let base = (lastGeneratedHTML || document.getElementById('nl-html-raw')?.value || '').trim();
    if (!base) return base;
    base = stripLoSignatureBlocks(base);
    base = stripReferralSections(base);
    base = stripAllDisclaimerBlocks(base);
    if (window.NlEntertainment && typeof window.NlEntertainment.stripBrainTeaserAnswerBlocks === 'function') {
        base = window.NlEntertainment.stripBrainTeaserAnswerBlocks(base);
    }
    return base;
}

function hardenNewsletterPreviewHtml(html) {
    let out = String(html || '');
    if (!out.trim()) return out;
    if (/<html\b/i.test(out)) {
        out = out.replace(/<html\b([^>]*)>/i, (tag, attrs) => {
            let a = String(attrs);
            if (/style=["']/i.test(a)) {
                a = a.replace(/style=(["'])([^"']*)\1/i, (m, q, styleVal) => {
                    if (/overflow/i.test(styleVal)) return m;
                    return `style=${q}${styleVal};height:100%;overflow-y:auto;${q}`;
                });
            } else {
                a += ' style="height:100%;overflow-y:auto;"';
            }
            return `<html${a}>`;
        });
    }
    if (!/<body\b/i.test(out)) return out;
    return out.replace(/<body\b([^>]*)>/i, (tag, attrs) => {
        let a = String(attrs).replace(/\s*contenteditable=["'][^"']*["']/gi, '');
        if (/style=["']/i.test(a)) {
            a = a.replace(/style=(["'])([^"']*)\1/i, (m, q, styleVal) => {
                if (/overflow/i.test(styleVal)) return m;
                return `style=${q}${styleVal};margin:0;overflow-y:auto;${q}`;
            });
        } else {
            a += ' style="margin:0;overflow-y:auto;"';
        }
        return `<body${a} contenteditable="false">`;
    });
}

function configureNewsletterPreviewIframeOnLoad(iframe) {
    if (!iframe) return;
    try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;
        if (doc.documentElement) {
            doc.documentElement.style.height = '100%';
            doc.documentElement.style.overflowY = 'auto';
        }
        if (doc.body) {
            doc.body.setAttribute('contenteditable', 'false');
            doc.body.style.margin = '0';
            doc.body.style.overflowY = 'auto';
            normalizeSectionBorders(doc);
            if (!doc.body.dataset.nlPreviewKeysWired) {
                doc.body.dataset.nlPreviewKeysWired = '1';
                doc.body.addEventListener('keydown', (e) => {
                    if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete') {
                        e.preventDefault();
                    }
                });
            }
        }
    } catch (e) {}
}

function wireNewsletterPreviewIframeScroll(iframe) {
    if (!iframe || iframe.dataset.nlScrollWired === '1') return;
    iframe.dataset.nlScrollWired = '1';
    iframe.addEventListener('load', () => configureNewsletterPreviewIframeOnLoad(iframe));
}

function applyNewsletterPreviewIframeIsolation(iframe) {
    if (!iframe) return;
    iframe.setAttribute('tabindex', '0');
    iframe.setAttribute('sandbox', 'allow-same-origin');
    iframe.setAttribute('scrolling', 'yes');
    iframe.title = 'Newsletter preview — scroll inside to review';
    iframe.style.pointerEvents = 'auto';
    iframe.style.display = 'block';
    wireNewsletterPreviewIframeScroll(iframe);
}

function mountNewsletterPreviewIframe(previewEl, html) {
    if (!previewEl) return null;
    previewEl.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.className = 'w-full border-0 rounded-2xl shadow-2xl bg-white';
    iframe.style.height = 'min(85vh, 900px)';
    iframe.style.minHeight = '500px';
    applyNewsletterPreviewIframeIsolation(iframe);
    iframe.srcdoc = hardenNewsletterPreviewHtml(html);
    previewEl.appendChild(iframe);
    if (iframe.contentDocument?.readyState === 'complete') {
        configureNewsletterPreviewIframeOnLoad(iframe);
    }
    return iframe;
}

function applyNewsletterColorBundle(html) {
    if (!html || !window.NlColorBundles) return html;
    const bundle = window.NlColorBundles.getActiveBundle();
    const applyFn = window.NlColorBundles.applyColorSchemeTokensOnly || window.NlColorBundles.applyColorScheme;
    return applyFn(html, bundle);
}

function refreshNewsletterColorScheme() {
    const rawEl = document.getElementById('nl-html-raw');
    let html = (rawEl?.value || '').trim() || (lastGeneratedHTML || '').trim();
    if (!html || !window.NlColorBundles) return;
    html = applyNewsletterColorBundle(html);
    lastGeneratedHTML = html;
    if (rawEl) rawEl.value = html;
    const previewEl = document.getElementById('nl-preview');
    if (previewEl) mountNewsletterPreviewIframe(previewEl, html);
    try { localStorage.setItem('lastNewsletterHTML', html); } catch (e) {}
    if (window.NlColorBundles.renderBundlePreview) {
        window.NlColorBundles.renderBundlePreview(
            document.getElementById('nl-color-bundle-preview'),
            window.NlColorBundles.getActiveBundleId()
        );
    }
}

function wireNewsletterFeedbackFocusGuard() {
    const feedbackEl = document.getElementById('nl-feedback');
    if (!feedbackEl || feedbackEl.dataset.nlFocusGuardWired === '1') return;
    feedbackEl.dataset.nlFocusGuardWired = '1';
    const blurPreview = () => {
        const iframe = document.querySelector('#nl-preview iframe');
        try { iframe?.contentWindow?.blur(); } catch (e) {}
        try { window.focus(); } catch (e) {}
    };
    feedbackEl.addEventListener('focus', blurPreview);
    feedbackEl.addEventListener('mousedown', blurPreview);
}

function injectBeforeBodyClose(html, fragment) {
    if (!fragment) return html;
    const src = String(html || '');
    const bodyIdx = src.search(/<\/body>/i);
    if (bodyIdx >= 0) {
        return src.slice(0, bodyIdx) + fragment + '\n' + src.slice(bodyIdx);
    }
    return src + fragment;
}

function stripOrphanDisclaimerTail(html) {
    const bodyMatch = String(html || '').match(/^([\s\S]*<body[^>]*>)([\s\S]*)(<\/body>[\s\S]*)$/i);
    if (!bodyMatch) return html;

    let inner = bodyMatch[2];
    const lastTableClose = inner.lastIndexOf('</table>');
    if (lastTableClose < 0) return html;

    const before = inner.slice(0, lastTableClose + 8);
    let tail = inner.slice(lastTableClose + 8);
    if (!NL_DISCLAIMER_MARKERS_RE.test(tail)) {
        return html;
    }

    const preserved = [];
    const brainPlaceholder = tail.match(/<!--\s*BRAIN_TEASER_ANSWER_PLACEHOLDER\s*-->/i);
    if (brainPlaceholder) preserved.push(brainPlaceholder[0]);

    tail = tail.replace(/<tr>[\s\S]*?<\/tr>/gi, (row) => {
        if (/BRAIN_TEASER|font-size:\s*10px;\s*color:\s*#999/i.test(row) && !NL_DISCLAIMER_MARKERS_RE.test(row)) {
            return row;
        }
        return NL_DISCLAIMER_MARKERS_RE.test(row) ? '' : row;
    });
    tail = tail.replace(/<p[^>]*>[\s\S]*?<\/p>/gi, (p) => (NL_DISCLAIMER_MARKERS_RE.test(p) ? '' : p));
    tail = tail.replace(/<div[^>]*>[\s\S]*?<\/div>/gi, (d) => (NL_DISCLAIMER_MARKERS_RE.test(d) ? '' : d));
    tail = tail.replace(/[^<\n]+/g, (text) => (NL_DISCLAIMER_MARKERS_RE.test(text) ? '' : text));

    return bodyMatch[1] + before + preserved.join('\n') + tail + bodyMatch[3];
}

function stripLoSignatureBlocks(html) {
    let out = String(html || '');
    out = out.replace(/<tr[^>]*data-nl-signature-block=["']1["'][^>]*>[\s\S]*?<\/tr>\s*/gi, '');
    out = out.replace(/<table[^>]*data-nl-signature-block=["']1["'][^>]*>[\s\S]*?<\/table>\s*/gi, '');
    return out;
}

function stripStrayAiDisclaimerText(html) {
    let out = String(html || '');
    const isFooterDisclaimer = (chunk) => {
        if (/data-nl-disclaimer-block/i.test(chunk)) return false;
        const text = chunk.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (!text || text.length > 420) return false;
        const markerHits = [
            /Equal Housing/i.test(text),
            /informational purposes/i.test(text),
            /commitment to lend|does not constitute an offer/i.test(text),
            /subject to credit approval/i.test(text),
        ].filter(Boolean).length;
        return markerHits >= 2;
    };
    out = out.replace(/<p[^>]*>[\s\S]*?<\/p>/gi, (p) => (isFooterDisclaimer(p) ? '' : p));
    out = out.replace(/<div[^>]*>[\s\S]*?<\/div>/gi, (d) => (isFooterDisclaimer(d) ? '' : d));
    return out;
}

function stripAllDisclaimerBlocks(html) {
    let out = String(html || '');
    out = out.replace(NL_STYLED_DISCLAIMER_TABLE_RE, '');
    out = out.replace(NL_STYLED_DISCLAIMER_ROW_RE, '');
    out = out.replace(NL_UNSTYLED_DISCLAIMER_ROW_RE, '');
    out = stripStrayAiDisclaimerText(out);
    out = stripOrphanDisclaimerTail(out);
    return out;
}

/** Always rebuild styled disclaimer as a body-level 600px table (referral → disclaimer; no signature). */
function ensureLoNewsletterFooter(html) {
    let out = String(html || '');
    if (!out.trim()) return out;
    out = stripLoSignatureBlocks(out);
    out = stripAllDisclaimerBlocks(out);
    out = stripStrayAiDisclaimerText(out);
    const disclaimer = buildLoDisclaimerFooterModule(getLoFooterBrandingContext());
    return injectBeforeBodyClose(out, disclaimer);
}

/** @deprecated Use ensureLoNewsletterFooter */
function ensureLoDisclaimerFooter(html) {
    return ensureLoNewsletterFooter(html);
}

function injectCompactReferralBeforeDisclaimer(html, referralModule) {
    if (!referralModule) return html;
    let out = String(html || '');
    if (out.includes('[REFERRAL CTA PLACEHOLDER]')) {
        return out.replace(/\[REFERRAL CTA PLACEHOLDER\]/gi, referralModule);
    }
    const disclaimerTable = /(<table\b[^>]*data-nl-disclaimer-block=["']1["'][^>]*>)/i;
    if (disclaimerTable.test(out)) {
        return out.replace(disclaimerTable, referralModule + '\n$1');
    }
    const legacyFooterRow = /(<tr>\s*<td[^>]*(?:data-nl-disclaimer-block|background:\s*#002B5C)[^>]*>)/i;
    if (legacyFooterRow.test(out)) {
        return out.replace(legacyFooterRow, referralModule + '\n$1');
    }
    return injectBeforeBodyClose(out, referralModule);
}

function stripBlogSections(html) {
    let out = String(html || '');
    out = out.replace(
        new RegExp(
            `<tr>\\s*<td[^>]*>\\s*<table[^>]*>[\\s\\S]*?${NL_BLOG_HEADING_RE}[\\s\\S]*?<\\/table>\\s*<\\/td>\\s*<\\/tr>\\s*(?:<tr>\\s*<td[^>]*height=["']?20["']?[^>]*>\\s*<\\/td>\\s*<\\/tr>\\s*)?`,
            'gi'
        ),
        ''
    );
    out = out.replace(/<!--\s*BLOG SECTION PLACEHOLDER\s*-->/gi, '');
    return out;
}

/** Index where the blog card should be inserted — immediately before the personal-note outer <tr>. */
function findBlogInsertBeforePersonalIndex(html) {
    const src = String(html || '');
    const h2Re = /<h2[^>]*>\s*A\s*Note\s*From\b[^<]*<\/h2>/i;
    const h2Match = h2Re.exec(src);
    if (!h2Match) return -1;

    const h2End = h2Match.index + h2Match[0].length;
    let searchFrom = h2Match.index;

    // Walk back from the h2 to find the OUTER <tr><td><table> card — skip the inner content <tr>.
    while (searchFrom > 0) {
        const trPos = src.lastIndexOf('<tr', searchFrom);
        if (trPos < 0) break;

        const segment = src.substring(trPos, h2End);
        const isOuterCard = /<tr>\s*<td[^>]*>[\s\S]*?<table\b/i.test(segment)
            && /<h2[^>]*>\s*A\s*Note\s*From\b/i.test(segment);
        if (isOuterCard) {
            let insertAt = trPos;
            const beforeCard = src.substring(0, insertAt);
            const spacerRe = /<tr>\s*<td[^>]*height=["']?20["']?[^>]*>\s*<\/td>\s*<\/tr>\s*$/i;
            const spacerMatch = spacerRe.exec(beforeCard);
            if (spacerMatch) insertAt = spacerMatch.index;
            return insertAt;
        }
        searchFrom = trPos - 1;
    }

    return -1;
}

function injectBlogBeforePersonal(html, blogInnerTableHtml, options) {
    if (!blogInnerTableHtml) return html;
    const personalIncluded = !!(options && options.personalIncluded);

    // Never trust placeholder position — AI often leaves it right after the hero.
    let out = stripBlogSections(html);

    const personalIdx = findBlogInsertBeforePersonalIndex(out);
    if (personalIdx >= 0) {
        const before = out.slice(0, personalIdx);
        const spacerLen = matchSectionSpacerRowLengthAt(out, personalIdx);
        const blogSection = wrapNewsletterSectionRows(blogInnerTableHtml, {
            skipLeadingSpacer: endsWithSectionSpacerRow(before),
        });
        if (spacerLen > 0) {
            return out.slice(0, personalIdx) + blogSection + out.slice(personalIdx + spacerLen);
        }
        return out.slice(0, personalIdx) + blogSection + out.slice(personalIdx);
    }

    const wrapBlogForTail = (tailHtml) => wrapNewsletterSectionRows(blogInnerTableHtml, {
        skipLeadingSpacer: endsWithSectionSpacerRow(out),
    });

    if (personalIncluded) {
        const personalComment = /<!--\s*Personal Note Section\s*-->/i;
        const commentMatch = personalComment.exec(out);
        if (commentMatch) {
            const heroIdx = out.search(/<img[^>]*alt=["'][^"']*hero[^"']*["']/i);
            if (heroIdx === -1 || commentMatch.index > heroIdx + 400) {
                const blogSection = wrapNewsletterSectionRows(blogInnerTableHtml, {
                    skipLeadingSpacer: endsWithSectionSpacerRow(out.slice(0, commentMatch.index)),
                });
                return out.slice(0, commentMatch.index) + blogSection + out.slice(commentMatch.index);
            }
        }
        return insertRowsInsideMainTable(out, wrapBlogForTail(out));
    }

    // Personal block not included — tuck blog before video / referral / footer.
    if (out.includes('<!-- PERSONAL VIDEO PLACEHOLDER -->')) {
        const spacerBeforePlaceholder = /<tr>\s*<td[^>]*height=["']?20["']?[^>]*>\s*<\/td>\s*<\/tr>\s*<!--\s*PERSONAL VIDEO PLACEHOLDER\s*-->/i;
        const blogSection = wrapNewsletterSectionRows(blogInnerTableHtml, {
            skipLeadingSpacer: spacerBeforePlaceholder.test(out) || endsWithSectionSpacerRow(out),
        });
        return out.replace('<!-- PERSONAL VIDEO PLACEHOLDER -->', blogSection + '\n<!-- PERSONAL VIDEO PLACEHOLDER -->');
    }

    if (out.includes('[REFERRAL CTA PLACEHOLDER]')) {
        return out.replace('[REFERRAL CTA PLACEHOLDER]', wrapBlogForTail(out) + '\n[REFERRAL CTA PLACEHOLDER]');
    }

    const referralBlock = /<tr>\s*<td[^>]*>[\s\S]*?Know Someone Ready to Buy or Refinance\?[\s\S]*?<\/tr>/i;
    if (referralBlock.test(out)) {
        return out.replace(referralBlock, wrapBlogForTail(out) + '$&');
    }

    const footerRow = /(<tr>\s*<td[^>]*background:\s*#002B5C[^>]*>)/i;
    if (footerRow.test(out)) {
        return out.replace(footerRow, wrapBlogForTail(out) + '$1');
    }

    return insertRowsInsideMainTable(out, wrapBlogForTail(out));
}

function stripPersonalVideoBlocks(html) {
    return String(html || '').replace(
        /<tr>\s*<td[^>]*>\s*<table[^>]*>[\s\S]*?Personal Video Update[\s\S]*?<\/table>\s*<\/td>\s*<\/tr>\s*(?:<tr>\s*<td[^>]*height=["']?20["']?[^>]*>\s*<\/td>\s*<\/tr>\s*)?/gi,
        ''
    );
}

function injectPersonalVideoSection(html, personalVideoUrl) {
    const url = String(personalVideoUrl || '').trim();
    if (!url) return html;

    const videoTable = buildPersonalVideoTable(url);
    let out = stripPersonalVideoBlocks(html);

    if (out.includes('<!-- PERSONAL VIDEO PLACEHOLDER -->')) {
        const spacerBeforePlaceholder = /<tr>\s*<td[^>]*height=["']?20["']?[^>]*>\s*<\/td>\s*<\/tr>\s*<!--\s*PERSONAL VIDEO PLACEHOLDER\s*-->/i;
        const videoSection = wrapPersonalVideoRows(
            videoTable,
            { skipLeadingSpacer: spacerBeforePlaceholder.test(out) }
        );
        return out.replace('<!-- PERSONAL VIDEO PLACEHOLDER -->', videoSection);
    }

    const afterPersonalNote = /(<tr>\s*<td[^>]*>\s*<table[^>]*border-left:\s*8px[^>]*>[\s\S]*?A Note From[\s\S]*?<\/table>\s*<\/td>\s*<\/tr>\s*<tr>\s*<td[^>]*height=["']?20["']?[^>]*>\s*<\/td>\s*<\/tr>)/i;
    if (afterPersonalNote.test(out)) {
        const videoSection = wrapPersonalVideoRows(videoTable, { skipLeadingSpacer: true });
        return out.replace(afterPersonalNote, '$1' + videoSection);
    }

    const videoSection = wrapPersonalVideoRows(videoTable);

    if (out.includes('[REFERRAL CTA PLACEHOLDER]')) {
        return out.replace('[REFERRAL CTA PLACEHOLDER]', videoSection + '\n[REFERRAL CTA PLACEHOLDER]');
    }

    return insertRowsInsideMainTable(out, videoSection);
}

function getNewsletterSelections() {
    const personal = !!document.getElementById('nl-personal')?.checked;
    const includePhoto = personal && !!document.getElementById('nl-include-photo')?.checked;
    const includeVideo = !!document.getElementById('nl-include-video')?.checked;
    const includeBlog = !!document.getElementById('nl-include-blog')?.checked;
    const referralEl = document.getElementById('nl-include-referral');
    const includeReferral = referralEl ? referralEl.checked : true;
    const contentSections = {};
    Object.keys(NL_CONTENT_SECTIONS).forEach((key) => {
        contentSections[key] = !!document.getElementById(NL_CONTENT_SECTIONS[key].id)?.checked;
    });
    const extra = (window.NlEntertainment && typeof window.NlEntertainment.getSelectionsExtra === 'function')
        ? window.NlEntertainment.getSelectionsExtra()
        : { puzzleType: 'trivia' };
    return { personal, includePhoto, includeVideo, includeBlog, includeReferral, contentSections, puzzleType: extra.puzzleType || 'trivia' };
}

function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripNewsletterSectionByHeadings(html, headings) {
    if (!html || !headings?.length) return html;
    let out = html;
    const headingPattern = headings.map(escapeRegex).join('|');
    const tealCardRe = new RegExp(
        `<tr>\\s*<td[^>]*>\\s*<table[^>]*border-left:\\s*8px[^>]*>[\\s\\S]*?<h2[^>]*>\\s*(?:${headingPattern})\\s*</h2>[\\s\\S]*?</table>\\s*</td>\\s*</tr>\\s*(?:<tr>\\s*<td[^>]*height=["']?20["']?[^>]*>\\s*</td>\\s*</tr>\\s*)?`,
        'gi'
    );
    out = out.replace(tealCardRe, '');
    const looseRe = new RegExp(
        `<table[^>]*border-left:\\s*8px[^>]*>[\\s\\S]*?<h2[^>]*>\\s*(?:${headingPattern})\\s*</h2>[\\s\\S]*?</table>\\s*(?:<tr>\\s*<td[^>]*height=["']?20["']?[^>]*>\\s*</td>\\s*</tr>\\s*)?`,
        'gi'
    );
    return out.replace(looseRe, '');
}

function stripNewsletterPlaceholderBlock(html, placeholderId, headings) {
    if (!html) return html;
    let out = html;
    if (placeholderId) {
        out = out.replace(
            new RegExp(`<h2[^>]*>\\s*(?:${(headings || []).map(escapeRegex).join('|')})\\s*</h2>\\s*<p[^>]*id=["']?${escapeRegex(placeholderId)}["']?[^>]*>\\s*</p>`, 'gi'),
            ''
        );
        out = out.replace(
            new RegExp(`<p[^>]*id=["']?${escapeRegex(placeholderId)}["']?[^>]*>[\\s\\S]*?</p>`, 'gi'),
            ''
        );
        out = out.replace(
            new RegExp(`<div[^>]*id=["']?${escapeRegex(placeholderId)}["']?[^>]*>[\\s\\S]*?</div>`, 'gi'),
            ''
        );
    }
    return stripNewsletterSectionByHeadings(out, headings || []);
}

function applyUncheckedNewsletterSectionFilters(html, selections) {
    if (!html || !selections) return html;
    let out = html;

    Object.entries(NL_CONTENT_SECTIONS).forEach(([key, cfg]) => {
        if (selections.contentSections[key]) return;
        if (cfg.placeholderId) {
            out = stripNewsletterPlaceholderBlock(out, cfg.placeholderId, cfg.headings);
        } else {
            out = stripNewsletterSectionByHeadings(out, cfg.headings);
        }
    });

    if (!selections.personal) {
        out = stripNewsletterSectionByHeadings(out, ['A Note From', 'Personal Update', 'Personal Note']);
        out = out.replace(/\[PERSONAL PHOTO PLACEHOLDER\]/gi, '');
        out = out.replace(/<!--\s*Personal Note Section\s*-->/gi, '');
    }

    if (!selections.includeVideo) {
        out = out.replace(/<tr>\s*<td>\s*<table[^>]*>[\s\S]*?Personal Video Update[\s\S]*?<\/table>\s*<\/td>\s*<\/tr>/gi, '');
    }

    if (!selections.includeReferral) {
        out = stripReferralSections(out);
    }

    return out;
}

function buildNewsletterSectionsPrompt(selections) {
    const included = [];
    const excluded = [];
    Object.entries(NL_CONTENT_SECTIONS).forEach(([key, cfg]) => {
        if (selections.contentSections[key]) included.push(cfg.label);
        else excluded.push(cfg.label);
    });

    const lines = [
        '**SECTION SELECTION (NON-NEGOTIABLE — respect every checkbox):**',
        '- User checked INCLUDE only: ' + (included.length ? included.join(', ') : '(none — no optional content sections selected)'),
        '- User checked EXCLUDE (do NOT generate these sections or headings): ' + (excluded.length ? excluded.join(', ') : '(none)'),
        '- Generate exactly ' + included.length + ' optional content section card(s) from the INCLUDE list. Do not add bonus sections.',
        '- If Market Updates is EXCLUDED, do not write anything about market conditions, housing trends, or rate movement — not even a sentence.',
        '- If Industry News is EXCLUDED, do not mention industry headlines, MBA/NAR news, or lender/regulatory updates.',
        '- If Local Update is EXCLUDED, do not include local spotlight/community content.',
        '- If Recipes is EXCLUDED, do not include any recipe or food content.',
    ];

    if (selections.contentSections.fun) {
        lines.push('- Fun Facts (INCLUDE): output ONLY <h2>Fun Fact</h2> and empty <p id="fun-fact-placeholder"></p> — we inject the fact later.');
    } else {
        lines.push('- Fun Facts (EXCLUDE): do not include Fun Fact heading, text, or fun-fact-placeholder.');
    }
    if (selections.contentSections.tip) {
        lines.push('- Homeownership Tip (INCLUDE): output ONLY <h2>Pro Tip</h2> or <h2>Homeownership Tip</h2> and empty <p id="pro-tip-placeholder"></p> — we inject the tip later.');
    } else {
        lines.push('- Homeownership Tip (EXCLUDE): do not include tip heading, text, or pro-tip-placeholder.');
    }
    if (selections.contentSections.quote) {
        lines.push('- Motivational Quote (INCLUDE): output ONLY <h2>Motivational Quote</h2> and empty <p id="quote-placeholder"></p> — we inject the quote later.');
    } else {
        lines.push('- Motivational Quote (EXCLUDE): do not include quote heading, text, or quote-placeholder.');
    }

    if (window.NlEntertainment && typeof window.NlEntertainment.buildPromptLines === 'function') {
        lines.push(...window.NlEntertainment.buildPromptLines(selections));
    }

    if (selections.personal) {
        lines.push('- Personal Update (INCLUDE): include the Personal Note section titled "A Note From [First Name]" using ONLY the personal update text the user typed in the Personal Update field — polish grammar and warmth, but do NOT add hobbies, goals, challenges, or life details from profile or elsewhere.');
        if (selections.includePhoto) {
            lines.push('- Personal photo: leave [PERSONAL PHOTO PLACEHOLDER] untouched — we embed the photo in post-processing.');
        } else {
            lines.push('- Personal photo: EXCLUDE — remove [PERSONAL PHOTO PLACEHOLDER] and do not show a photo.');
        }
    } else {
        lines.push('- Personal Update (EXCLUDE): do NOT include Personal Note, "A Note From", or personal photo sections.');
        lines.push('- Remove <!-- Personal Note Section --> and [PERSONAL PHOTO PLACEHOLDER] from output.');
    }
    if (selections.includeVideo) {
        lines.push('- Personal video (INCLUDE): leave <!-- PERSONAL VIDEO PLACEHOLDER --> untouched — we inject the video card in post-processing. Do NOT create your own Personal Video Update block.');
    } else {
        lines.push('- Personal video (EXCLUDE): do not include any video section, Personal Video Update block, or PERSONAL VIDEO PLACEHOLDER.');
    }

    if (selections.includeBlog) {
        lines.push('- Blog link (INCLUDE): leave <!-- BLOG SECTION PLACEHOLDER --> untouched — we inject the blog card in post-processing if URL provided. The blog MUST appear AFTER all main content sections (market, local, trivia, etc.) and IMMEDIATELY BEFORE the Personal Note — never at the top of the newsletter.');
    } else {
        lines.push('- Blog (EXCLUDE): do NOT create any blog section. Remove <!-- BLOG SECTION PLACEHOLDER -->.');
    }

    if (selections.includeReferral) {
        lines.push('- Referral CTA (INCLUDE): Do NOT place referral content in the newsletter body. We inject a compact referral block immediately before the footer disclaimer in post-processing. Do NOT add referral headings, buttons, or "Know Someone" asks in the main letter.');
    } else {
        lines.push('- Referral CTA (EXCLUDE): do NOT include any referral ask, "Know Someone" heading, referral button, or [REFERRAL CTA PLACEHOLDER]. End with personal note / video / blog then go straight to the footer disclaimer.');
    }

    lines.push('');
    lines.push(...buildCoreSectionDirectionsPromptLines(selections));

    return lines.join('\n');
}

const NL_PERSONAL_UPDATE_MIN_CHARS = 40;

const NL_PREFLIGHT_CHIP_BASE = 'nl-preflight-chip inline-flex items-center gap-1 text-xs font-semibold pl-3 pr-1 py-1.5 rounded-full';
const NL_PREFLIGHT_CHIP_CLASS = {
    included: `${NL_PREFLIGHT_CHIP_BASE} border-2 border-[#00A89D] bg-[#00A89D]/10 text-[#002B5C] dark:text-white`,
    personal: `${NL_PREFLIGHT_CHIP_BASE} border-2 border-[#F15A29] bg-[#F15A29]/10 text-[#002B5C] dark:text-white`,
    meta: `${NL_PREFLIGHT_CHIP_BASE} border border-gray-200 dark:border-gray-600 bg-[#002B5C]/5 dark:bg-[#002B5C]/30 text-[#002B5C] dark:text-gray-300 font-medium`,
    warn: `${NL_PREFLIGHT_CHIP_BASE} border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200`,
    off: `${NL_PREFLIGHT_CHIP_BASE} border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 font-medium`
};

const NL_PREFLIGHT_CHIP_REMOVE_BTN = 'nl-preflight-chip-remove ml-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-[15px] leading-none text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors';

function buildPreflightChipHtml(chip) {
    const cls = NL_PREFLIGHT_CHIP_CLASS[chip.style] || NL_PREFLIGHT_CHIP_CLASS.included;
    const label = chip.text;
    if (!chip.removeId) {
        return `<span class="${cls} pr-3">${label}</span>`;
    }
    const safeId = String(chip.removeId).replace(/"/g, '');
    return `<span class="${cls}"><span>${label}</span><button type="button" class="${NL_PREFLIGHT_CHIP_REMOVE_BTN}" data-nl-preflight-remove="${safeId}" aria-label="Remove ${label.replace(/"/g, '')}" title="Remove">×</button></span>`;
}

function applyPreflightChipRemove(controlId) {
    const el = document.getElementById(controlId);
    if (!el) return;
    el.checked = false;
    el.dispatchEvent(new Event('change', { bubbles: true }));
}

function looksLikeImageUrl(url) {
    const u = String(url || '').trim();
    if (!u) return false;
    if (/^data:image\//i.test(u)) return true;
    if (/\.(jpe?g|png|gif|webp|avif|bmp|svg)(\?|#|$)/i.test(u)) return true;
    return /\/(image|img|photo|media|upload|assets)\//i.test(u) || /[?&](format|fm)=(jpe?g|png|webp|gif)/i.test(u);
}

function updatePersonalCharMeter() {
    const personalCb = document.getElementById('nl-personal');
    const meter = document.getElementById('nl-personal-char-meter');
    const countEl = document.getElementById('nl-personal-char-count');
    const barEl = document.getElementById('nl-personal-char-bar');
    const hintEl = document.getElementById('nl-personal-char-hint');
    const textEl = document.getElementById('nl-personal-text');
    if (!meter || !textEl) return;

    const active = !!personalCb?.checked;
    meter.classList.toggle('hidden', !active);
    if (!active) return;

    const len = textEl.value.trim().length;
    const pct = Math.min(100, Math.round((len / NL_PERSONAL_UPDATE_MIN_CHARS) * 100));
    const remaining = Math.max(0, NL_PERSONAL_UPDATE_MIN_CHARS - len);
    const ready = len >= NL_PERSONAL_UPDATE_MIN_CHARS;

    if (countEl) {
        countEl.textContent = `${len} / ${NL_PERSONAL_UPDATE_MIN_CHARS} min`;
        countEl.classList.toggle('text-[#00A89D]', ready);
        countEl.classList.toggle('text-amber-600', !ready);
    }
    if (barEl) {
        barEl.style.width = `${pct}%`;
        barEl.classList.toggle('bg-[#00A89D]', ready);
        barEl.classList.toggle('bg-amber-400', !ready && len > 0);
        barEl.classList.toggle('bg-gray-300', len === 0);
    }
    if (hintEl) {
        if (ready) {
            hintEl.innerHTML = '<span class="text-[#00A89D] font-semibold">✓ Good to go</span> — we&apos;ll polish your words, not invent them.';
        } else if (len === 0) {
            hintEl.textContent = `Required — write at least ${NL_PERSONAL_UPDATE_MIN_CHARS} characters with real details.`;
        } else {
            hintEl.textContent = `${remaining} more character${remaining === 1 ? '' : 's'} needed before you can generate.`;
        }
    }
}

function updatePersonalMediaPreviews() {
    updatePersonalPhotoSizeUI();
    updatePersonalVideoSizeUI();
    const photoEnabled = !!document.getElementById('nl-include-photo')?.checked && !!document.getElementById('nl-personal')?.checked;
    const videoEnabled = !!document.getElementById('nl-include-video')?.checked;
    const photoUrl = (document.getElementById('nl-personal-photo')?.value || '').trim();
    const videoUrl = (document.getElementById('nl-personal-video')?.value || '').trim();

    const photoWrap = document.getElementById('nl-personal-photo-preview-wrap');
    const photoImg = document.getElementById('nl-personal-photo-preview-img');
    const photoStatus = document.getElementById('nl-personal-photo-preview-status');
    const videoWrap = document.getElementById('nl-personal-video-preview-wrap');
    const videoThumb = document.getElementById('nl-personal-video-preview-thumb');
    const videoLink = document.getElementById('nl-personal-video-preview-link');
    const videoStatus = document.getElementById('nl-personal-video-preview-status');

    if (photoWrap && photoImg && photoStatus) {
        if (!photoEnabled || !photoUrl) {
            photoWrap.classList.add('hidden');
            photoImg.removeAttribute('src');
            delete photoImg.dataset.nlPreviewUrl;
        } else if (!looksLikeImageUrl(photoUrl) && !/^https?:\/\//i.test(photoUrl)) {
            photoWrap.classList.remove('hidden');
            photoImg.removeAttribute('src');
            photoStatus.innerHTML = '<span class="text-amber-700 dark:text-amber-300">⚠ Paste a full image URL (https://…)</span>';
        } else {
            photoWrap.classList.remove('hidden');
            const markPhotoPreviewLoaded = () => {
                photoStatus.innerHTML = '<span class="text-[#00A89D] font-medium">✓ Image loaded — will appear below your personal note</span>';
            };
            const markPhotoPreviewFailed = () => {
                photoStatus.innerHTML = '<span class="text-amber-700 dark:text-amber-300">⚠ Could not load image — double-check the URL is public and direct</span>';
            };
            photoImg.onload = () => {
                applyPersonalPhotoPreviewSizing();
                markPhotoPreviewLoaded();
            };
            photoImg.onerror = markPhotoPreviewFailed;
            applyPersonalPhotoPreviewSizing();

            const cachedUrl = photoImg.dataset.nlPreviewUrl || '';
            if (cachedUrl === photoUrl && photoImg.complete) {
                if (photoImg.naturalWidth > 0) markPhotoPreviewLoaded();
                else markPhotoPreviewFailed();
            } else {
                photoImg.dataset.nlPreviewUrl = photoUrl;
                photoStatus.textContent = 'Loading preview…';
                photoImg.src = photoUrl;
            }
        }
    }

    if (videoWrap && videoThumb && videoLink && videoStatus) {
        if (!videoEnabled || !videoUrl) {
            videoWrap.classList.add('hidden');
            videoThumb.removeAttribute('src');
            videoLink.removeAttribute('href');
        } else {
            const href = videoUrl.startsWith('http') ? videoUrl : `https://${videoUrl}`;
            const videoId = extractYouTubeVideoId(href);
            videoWrap.classList.remove('hidden');
            videoLink.href = href;
            if (videoId) {
                videoThumb.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                videoThumb.alt = 'YouTube video thumbnail';
                videoThumb.onload = () => applyPersonalVideoPreviewSizing();
                videoStatus.innerHTML = '<span class="text-[#00A89D] font-medium">✓ YouTube link recognized — thumbnail preview</span>';
            } else {
                videoThumb.src = 'https://via.placeholder.com/560x200/002B5C/FFFFFF?text=Video+link';
                videoStatus.innerHTML = '<span class="text-amber-700 dark:text-amber-300">⚠ Use a YouTube or YouTube Shorts URL for best results</span>';
            }
            applyPersonalVideoPreviewSizing();
        }
    }

    patchPersonalMediaSizesInNewsletter();
}

function updateNewsletterPreflightSummary() {
    const chipsEl = document.getElementById('nl-preflight-chips');
    const warningsEl = document.getElementById('nl-preflight-warnings');
    const badgeEl = document.getElementById('nl-preflight-ready-badge');
    if (!chipsEl) return;

    const sel = getNewsletterSelections();
    const chips = [];
    const warnings = [];

    const location = document.getElementById('nl-location')?.value.trim() || '';
    const toneLabel = document.getElementById('nl-tone')?.selectedOptions?.[0]?.textContent?.trim().replace(/\s*\(Recommended\)\s*/i, '') || '';
    const title = document.getElementById('nl-title')?.value.trim() || '';
    const audienceLabel = document.getElementById('nl-audience')?.selectedOptions?.[0]?.textContent?.trim() || '';
    const lengthLabel = getNewsletterLengthConfig().preflightLabel;

    if (location) chips.push({ text: `📍 ${location}`, style: 'meta' });
    if (audienceLabel) chips.push({ text: audienceLabel, style: 'meta' });
    if (toneLabel) chips.push({ text: toneLabel, style: 'meta' });
    chips.push({ text: lengthLabel, style: 'meta' });
    chips.push({ text: title ? `Title: ${title}` : 'Title: Auto-generated', style: 'meta' });

    const coreDirections = getCoreSectionDirections();
    Object.entries(NL_CONTENT_SECTIONS).forEach(([key, cfg]) => {
        if (!sel.contentSections[key] || key === 'puzzle') return;
        const isCore = NL_CORE_DIRECTION_SECTIONS.some((c) => c.key === key);
        const directed = isCore && !!coreDirections[key];
        let chipText = cfg.label;
        if (directed) {
            const preview = truncateDirectionPreview(coreDirections[key], 36);
            chipText = `✨ ${cfg.label}${preview ? ` · ${preview}` : ''}`;
        }
        chips.push({ text: chipText, style: directed ? 'personal' : 'included', removeId: cfg.id });
    });

    if (sel.contentSections.puzzle) {
        const extra = (window.NlEntertainment && typeof window.NlEntertainment.getSelectionsExtra === 'function')
            ? window.NlEntertainment.getSelectionsExtra()
            : { puzzleType: 'trivia', puzzleTopicFilter: 'all', puzzleCategoryFilter: 'all' };
        const typeLabels = { trivia: 'Trivia', scramble: 'Word Scramble', riddle: 'Riddle' };
        let teaserLabel = `Brain Teaser: ${typeLabels[extra.puzzleType] || extra.puzzleType}`;
        if (extra.puzzleType !== 'riddle' && extra.puzzleTopicFilter === 'mortgage') teaserLabel += ' · Mortgage';
        if (extra.puzzleType === 'trivia' && extra.puzzleCategoryFilter && extra.puzzleCategoryFilter !== 'all') {
            teaserLabel += ` · ${extra.puzzleCategoryFilter}`;
        }
        chips.push({ text: teaserLabel, style: 'included', removeId: 'nl-puzzle' });
        if (window.NlEntertainment && typeof window.NlEntertainment.getFilteredPuzzleList === 'function') {
            const pool = window.NlEntertainment.getFilteredPuzzleList(extra.puzzleType);
            if (!pool.length) warnings.push('Brain Teaser filters match no items — widen filters or write your own.');
        }
    }

    if (sel.personal) {
        const len = document.getElementById('nl-personal-text')?.value.trim().length || 0;
        chips.push({ text: 'Personal Update ❤️', style: 'personal', removeId: 'nl-personal' });
        if (sel.includePhoto) {
            const photoSize = getPersonalPhotoWidthPercent();
            chips.push({
                text: photoSize >= 100 ? 'Personal photo' : `Personal photo · ${photoSize}%`,
                style: 'included',
                removeId: 'nl-include-photo'
            });
        }
        if (sel.includeVideo) {
            const videoSize = getPersonalVideoWidthPercent();
            chips.push({
                text: videoSize >= 100 ? 'Personal video' : `Personal video · ${videoSize}%`,
                style: 'included',
                removeId: 'nl-include-video'
            });
        }
        if (len < NL_PERSONAL_UPDATE_MIN_CHARS) {
            warnings.push(`Personal Update needs ${NL_PERSONAL_UPDATE_MIN_CHARS - len} more character${NL_PERSONAL_UPDATE_MIN_CHARS - len === 1 ? '' : 's'} before Generate.`);
        }
    }

    if (sel.includeBlog) {
        const blogUrl = document.getElementById('nl-blog-url')?.value.trim() || '';
        chips.push({
            text: blogUrl ? 'Blog link' : 'Blog (no URL yet)',
            style: blogUrl ? 'included' : 'warn',
            removeId: 'nl-include-blog'
        });
        if (!blogUrl) warnings.push('Blog is checked but no URL — the blog card will be skipped.');
    }

    if (sel.includeReferral) {
        chips.push({ text: 'Referral CTA (before disclaimer)', style: 'included', removeId: 'nl-include-referral' });
    } else {
        chips.push({ text: 'Referral CTA off', style: 'off' });
    }

    const anyContent = Object.values(sel.contentSections).some(Boolean) || sel.personal;
    if (!anyContent) warnings.push('No content sections or Personal Update selected — your newsletter may be very thin.');

    chipsEl.innerHTML = chips.length
        ? chips.map((chip) => buildPreflightChipHtml(chip)).join('')
        : '<span class="text-xs text-gray-500">Check sections above to build your edition.</span>';

    const curatedWrap = document.getElementById('nl-preflight-curated');
    const curatedListEl = document.getElementById('nl-preflight-curated-list');
    if (curatedWrap && curatedListEl) {
        const curatedLines = [];
        Object.entries(NL_CUSTOM_CONTENT_BLOCKS).forEach(([key, cfg]) => {
            if (!sel.contentSections[key]) return;
            const snippet = getCuratedPreviewSnippet(cfg.previewId);
            if (snippet) curatedLines.push({ label: cfg.shortLabel, snippet, sectionKey: key });
        });
        if (curatedLines.length) {
            curatedWrap.classList.remove('hidden');
            curatedListEl.innerHTML = curatedLines.map((line) => `
                <div class="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 text-sm p-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-[#00A89D]/15">
                  <button type="button" class="text-xs font-bold text-[#00A89D] whitespace-nowrap hover:underline text-left" data-nl-preflight-curated-open="${line.sectionKey}">${line.label} →</button>
                  <span class="text-gray-600 dark:text-gray-300 italic flex-1 min-w-0">"${line.snippet}"</span>
                </div>`).join('');
        } else {
            curatedWrap.classList.add('hidden');
            curatedListEl.innerHTML = '';
        }
    }

    if (warningsEl) {
        if (warnings.length) {
            warningsEl.classList.remove('hidden');
            warningsEl.innerHTML = warnings.map((w) => `<li>${w}</li>`).join('');
        } else {
            warningsEl.classList.add('hidden');
            warningsEl.innerHTML = '';
        }
    }

    const personalOk = !sel.personal || (document.getElementById('nl-personal-text')?.value.trim().length || 0) >= NL_PERSONAL_UPDATE_MIN_CHARS;
    const ready = personalOk && !warnings.some((w) => w.includes('Brain Teaser filters'));
    if (badgeEl) {
        if (ready && anyContent) {
            badgeEl.textContent = 'READY TO GENERATE';
            badgeEl.className = 'inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[2px] text-[#00A89D] bg-[#00A89D]/15 px-2.5 py-1 rounded-full mb-2';
        } else {
            badgeEl.textContent = 'REVIEW SETUP';
            badgeEl.className = 'inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[2px] text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 rounded-full mb-2';
        }
    }
}

function wireNewsletterLiveFeedback() {
    const root = document.getElementById('newsletter-generator');
    if (!root || root.dataset.nlLiveFeedbackWired === '1') return;
    root.dataset.nlLiveFeedbackWired = '1';

    const refresh = () => {
        updatePersonalCharMeter();
        updatePersonalMediaPreviews();
        updateSpecificTopicsPlaceholder();
        updateCustomContentChoicesVisibility();
        updateCuratedRowStatuses();
        updateEngagementSectionSummary();
        updateNewsletterPreflightSummary();
    };

    root.querySelectorAll('input, select, textarea').forEach((el) => {
        if (el.id === 'nl-feedback' || el.id === 'nl-html-raw') return;
        el.addEventListener('input', refresh);
        el.addEventListener('change', refresh);
    });

    const preflight = document.getElementById('nl-preflight-summary');
    if (preflight && !preflight.dataset.nlRemoveWired) {
        preflight.dataset.nlRemoveWired = '1';
        preflight.addEventListener('click', (e) => {
            const curatedBtn = e.target.closest('[data-nl-preflight-curated-open]');
            if (curatedBtn) {
                e.preventDefault();
                openNewsletterEngagementHub(curatedBtn.getAttribute('data-nl-preflight-curated-open'));
                return;
            }
            const btn = e.target.closest('[data-nl-preflight-remove]');
            if (!btn) return;
            e.preventDefault();
            const controlId = btn.getAttribute('data-nl-preflight-remove');
            if (controlId) applyPreflightChipRemove(controlId);
            refresh();
        });
    }

    refresh();
}

function validatePersonalUpdateForGeneration() {
    const personalCb = document.getElementById('nl-personal');
    if (!personalCb?.checked) return true;

    const textEl = document.getElementById('nl-personal-text');
    const text = textEl?.value.trim() || '';
    if (text.length >= NL_PERSONAL_UPDATE_MIN_CHARS) return true;

    if (textEl) {
        textEl.focus();
        textEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    alert(
        'Please write your Personal Update before generating.\n\n' +
        'This section is not auto-filled from your profile — share something specific from this week or month: ' +
        'a recent closing, family moment, community story, or hobby update. ' +
        'If you are including a photo or video, describe what is in it.\n\n' +
        `(At least ${NL_PERSONAL_UPDATE_MIN_CHARS} characters — a few real sentences.)`
    );
    return false;
}

function escapeNewsletterSkeletonText(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function showNewsletterReviewHandoff() {
    const panel = document.getElementById('nl-review-handoff');
    if (!panel) return;
    panel.classList.remove('hidden');
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function generateNewsletter(feedback = '') {
    if (_nlGenerating) return;
    if (!feedback && !validatePersonalUpdateForGeneration()) {
        return;
    }
    _nlGenerating = true;

    if (!feedback) {
        syncNewsletterContactFromProfile();
        if (typeof window.saveNewsletterPersonalHistory === 'function') {
            window.saveNewsletterPersonalHistory();
        }
    }

    const titleText = feedback ? 'Updating Your Newsletter...' : 'Building Your Newsletter...';
    const displayTitle = feedback ? 'Updating Your Newsletter...' : 'Building Your Newsletter...';

    // Use the shared robust force helper (matches Weekly Win Plan, Social Calendar, Blog Creator, etc.)
    // so the progress modal appears immediately and survives cache / timing issues.
    if (typeof window.forceShowGlobalLoading === 'function') {
        window.forceShowGlobalLoading(titleText);
    }

    // Belt-and-suspenders force visibility (exact pattern from weekly-win-plan.js)
    const le0 = document.getElementById('global-loading');
    if (le0) {
        le0.classList.remove('hidden');
        le0.style.setProperty('display', 'flex', 'important');
        le0.style.setProperty('z-index', '99999', 'important');
        le0.style.setProperty('visibility', 'visible', 'important');
        le0.style.setProperty('opacity', '1', 'important');
        le0.style.setProperty('position', 'fixed', 'important');
        le0.style.setProperty('inset', '0', 'important');
    }

    const selectedHero = heroImages[Math.floor(Math.random() * heroImages.length)];

    // Pull central profile so the *entire* newsletter generation prompt (not just the pre-filled personal note) can use rich voice, hobbies, challenges, tone, focus etc.
    // (consistent with weekly, blog, social, sales-scripts, PTB, ai-chat)
    const p = getCentralProfile();

    let html = '';

    // === FIRST NAME EXTRACTION (moved to top for safety) ===
    const fullName = getNewsletterOfficerName();
    const firstName = fullName.split(' ')[0].trim();

    const selections = getNewsletterSelections();
    const includedLabels = Object.entries(NL_CONTENT_SECTIONS)
        .filter(([key]) => selections.contentSections[key])
        .map(([, cfg]) => cfg.label);
    const sectionsSummary = includedLabels.length ? includedLabels.join(', ') : '(no optional content sections selected)';

    // === SAVE ORIGINAL LOADING CONTENT (after force so we capture the clean base card) ===
    const loadingEl = document.getElementById('global-loading');
    if (loadingEl) {
        loadingEl.dataset.originalContent = loadingEl.innerHTML;
    }

    // === INJECT RICH PROGRESS CONTENT — styled to exactly match the Weekly/Social/Blog loading cards ===
    const loadingTipsContent = `
        <div class="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
            <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-3xl border border-gray-200 dark:border-gray-700">
                
                <div class="text-center mb-6">
                    <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#F15A29] mb-5"></div>
                    <h3 class="text-3xl font-bold text-[#002B5C] dark:text-white mb-2 tracking-tight">
                        ${displayTitle}
                    </h3>
                    <p class="text-lg text-gray-700 dark:text-gray-300 mb-1">
                        This usually takes 30–60 seconds — grab coffee! ☕
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Crafting your personalized, compliant edition with your voice + curated gems.
                    </p>
                </div>
                ${!feedback ? `
                <div class="mb-6 p-4 rounded-2xl border border-[#00A89D]/30 bg-[#00A89D]/5 text-left">
                    <p class="text-[10px] font-bold uppercase tracking-wider text-[#00A89D] m-0 mb-2">Filling in your issue structure</p>
                    <p class="text-xs text-gray-600 dark:text-gray-400 m-0 mb-2">Sections you selected:</p>
                    <p class="text-sm font-medium text-[#002B5C] dark:text-white m-0 leading-snug">${escapeNewsletterSkeletonText(sectionsSummary)}</p>
                </div>` : ''}

                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                    <h4 class="text-xl font-bold text-[#F15A29] mb-5 text-center">
                        Why Newsletters Are Pure Gold
                    </h4>
                    <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                        <div class="flex gap-3">
                            <i class="fas fa-broadcast-tower text-[#F15A29] mt-0.5"></i>
                            <div><strong>Stay Top-of-Mind:</strong> Consistent touchpoints = more referrals without cold outreach.</div>
                        </div>
                        <div class="flex gap-3">
                            <i class="fas fa-handshake text-[#00A89D] mt-0.5"></i>
                            <div><strong>Build Real Trust:</strong> Mix value (market updates, tips) with personal updates = genuine relationships that convert.</div>
                        </div>
                        <div class="flex gap-3">
                            <i class="fas fa-heart text-[#002B5C] mt-0.5"></i>
                            <div><strong>People Actually Love Them:</strong> Recipes, local events, fun facts, wins — your audience opens, reads, and engages.</div>
                        </div>
                    </div>

                    <div class="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p class="text-xs font-semibold text-[#F15A29] mb-2">Pro Tips for Maximum Impact:</p>
                        <ul class="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-5">
                            <li>Send consistently (weekly or monthly) — momentum compounds.</li>
                            <li>Keep it short &amp; scannable — bold headers, emojis, short paragraphs.</li>
                            <li>End with a soft CTA: "Know anyone thinking about buying/refinancing? I'm here to help!"</li>
                            <li>Use tools like Mailchimp/Constant Contact for pretty delivery &amp; tracking.</li>
                            <li>Personal updates are magic — share wins, family, hobbies to humanize yourself.</li>
                        </ul>
                    </div>
                </div>

                <p class="text-center text-xs text-gray-500 dark:text-gray-400 mt-5">
                    You got this — one newsletter at a time, you're building an unstoppable network! 🔥
                </p>
            </div>
        </div>
    `;

    if (loadingEl) {
        loadingEl.innerHTML = loadingTipsContent;
        // Re-force after replacing innerHTML (custom card has no original title/message children)
        loadingEl.classList.remove('hidden');
        loadingEl.style.setProperty('display', 'flex', 'important');
        loadingEl.style.setProperty('z-index', '99999', 'important');
        loadingEl.style.setProperty('visibility', 'visible', 'important');
        loadingEl.style.setProperty('opacity', '1', 'important');
        loadingEl.style.setProperty('position', 'fixed', 'important');
        loadingEl.style.setProperty('inset', '0', 'important');
    }

    try {
        const personalPhotoUrl = selections.includePhoto
            ? (document.getElementById('nl-personal-photo')?.value.trim() || '')
            : '';
        const personalVideoUrl = selections.includeVideo
            ? (document.getElementById('nl-personal-video')?.value.trim() || '')
            : '';
        const personalUpdateText = selections.personal
            ? (document.getElementById('nl-personal-text')?.value.trim() || '')
            : '';



        let promptLines;

        if (feedback) {
            promptLines = [
                'You are a precise newsletter editor. Your ONLY job is to return the COMPLETE, VALID, STANDALONE HTML document with the exact changes requested.',
                'CRITICAL RULES (never break these):',
                '1. Output ONLY the full HTML — start with <!DOCTYPE html> and end with </html>. NOTHING else. No explanations, no code blocks, no "Here is the updated version".',
                '2. Copy the PREVIOUS FULL NEWSLETTER exactly and modify ONLY the section(s) the user asked for.',
                '3. Keep EVERY section, every table, every image, every placeholder, and every closing tag intact.',
                '4. If the edit request is short, still return the ENTIRE document — do not shorten anything.',
                '5. Never truncate. If you feel the response is getting long, prioritize completing the full structure first.',
                '6. COMPLIANCE (NON-NEGOTIABLE): NEVER add, change, or include ANY mention of specific mortgage rates, interest rates, APRs, or "current rates" anywhere in the document.',
                '',
                'PREVIOUS FULL NEWSLETTER HTML (use this as your base):',
                getNewsletterHtmlForFeedbackEdit(),
                '',
                'USER EDIT REQUEST (apply this intelligently):',
                feedback,
                '',
                'Output the complete updated HTML now.'
            ];
        } else {
            promptLines = [
                'You are a world-class email designer and compliance-focused mortgage professional. ACCURACY and HONESTY are your HIGHEST priority — above creativity, engagement, or length.',
                '',
                '**CRITICAL TITLE RULE (very important):**',
                '- If the user provided a title in the Title field, use it exactly as written.',
                '- If the Title field is blank or only contains something generic like "Mortgage Insights", you MUST create a short, catchy, professional title in the style of "The Lending Edge".',
                '- Titles should be mortgage or lending related, 4–7 words maximum, confident, and benefit-focused.',
                '- Create a unique title for every newsletter — never repeat the same title.',
                '- Good style examples: "The Lending Edge", "Closing Strong", "Your Mortgage Advantage", "Lending Smarter", "The Home Loan Edge", "Mortgage Mastery", "Borrow Better", "Rate & Relationship".',
                '',
                '**LANGUAGE RULE (important):**',
                '- Check per-section direction fields and "Extra Instructions". If the user requests a different language (e.g. "Prepare the full newsletter in Spanish", "Generate in French", "in German", "en español", "tout en français"), output the **entire newsletter HTML** (all sections, personal note, headlines, body text, etc.) fully in that requested language.',
                '- Translate naturally while keeping the exact required structure, teal accents, tables, placeholders, and compliance disclaimers.',
                '- If no language is requested, default to English.',
                '',
                '**ACCURACY RULES (NON-NEGOTIABLE):**',
                '- EVERY fact, statistic, trend, event, or claim MUST be 100% accurate and verifiable.',
                '- NEVER guess, hallucinate, or invent information. If uncertain, OMIT it or use safe evergreen phrasing.',
                '- Local Spotlight (only if Local Update is INCLUDED): Use ONLY fun, interesting, or little known facts about the area. NEVER dated events. Verify and confirm accuracy above all else.',
                '- Prefer safe, educational, evergreen content.',
                '',
                buildNewsletterSectionsPrompt(selections),
                '',
                'User Inputs:',
                '- Audience: ' + (document.getElementById('nl-audience').value || 'Full Database'),
                '- Tone: ' + (document.getElementById('nl-tone').value || 'warm-professional') + ' — Write in this exact tone throughout the entire newsletter.',
                '- Match the full "LO PROFILE & VOICE CONTEXT" section below for overall newsletter tone and voice — but the Personal Update must use ONLY what the user typed in the Personal Update field. Never substitute profile hobbies, goals, or challenges into the personal note.',
                '- Location: ' + (document.getElementById('nl-location').value || 'Fort Wayne, Indiana'),
                '- Title: ' + (document.getElementById('nl-title').value || 'Mortgage Insights'),
                '- Length selection: ' + getNewsletterLengthConfig().displayLabel,
                '- Sections to generate: ' + sectionsSummary,
                '- Personal update: "' + personalUpdateText + '"',
                '- Personal photo URL: "' + personalPhotoUrl + '"',
                '- Personal video URL: "' + personalVideoUrl + '"',
                '- Section direction & extra instructions:\n' + getCombinedSpecificTopicsForPrompt(selections),
                ...(typeof window.buildGenerationRulesPromptBlock === 'function'
                    ? window.buildGenerationRulesPromptBlock('newsletter')
                    : []),
                '',
                '**SECTION DIRECTION & ARTICLE URL RULE:**',
                '- Per-section direction fields map directly to Market Updates, Industry News, Local Update, and Recipes — use each only in its named section.',
                '- Summarize the relevant takeaway in your own words, cite the source by name, and include a clickable hyperlink (<a href="..." target="_blank" rel="noopener">) when a URL was provided.',
                '- Do not invent or substitute different URLs when the user supplied one.',
                '',
                ...buildNewsletterLengthPromptBlock(),
                '',
                'Branding:',
                '- Name: ' + (document.getElementById('nl-name').value || 'Your Loan Officer'),
                '- Email: ' + (document.getElementById('nl-email').value || ''),
                '',
                '- REQUIRED HERO IMAGE: ' + selectedHero,
                '',
                'LO PROFILE & VOICE CONTEXT (use for overall tone, local flavor, and relatable language — NOT for personal update facts. The personal note uses only user-typed Personal Update text. Blend voice naturally elsewhere; do not force profile hobbies/challenges into the personal section):',
                (typeof window.buildProfileAiContext === 'function'
                  ? window.buildProfileAiContext(p)
                  : [
                    '- Name: ' + (p.name || document.getElementById('nl-name').value || ''),
                    '- Email: ' + (p.email || document.getElementById('nl-email').value || ''),
                    '- Personality / lifestyle: ' + (p.personality || ''),
                    '- Voice traits: ' + ((p.voiceTraits && p.voiceTraits.length) ? p.voiceTraits.join(', ') : ''),
                    '- Preferred tone: ' + (p.tone || document.getElementById('nl-tone').value || 'warm and professional'),
                    '- Hobbies & passions: ' + ((p.hobbies && p.hobbies.length) ? p.hobbies.join(', ') : (p.hobbiesOther || '')),
                    '- Key challenges: ' + ((p.challenges && p.challenges.length) ? p.challenges.join(', ') : ''),
                    '- Primary focus: ' + (p.focusLabel || p.focus || ''),
                    '- Years in business / team: ' + (p.years || '') + (p.team ? ' / ' + p.team : '')
                  ].join('\n')),
                '',
                '',
                'CRITICAL RULES:',
                (selections.contentSections.market
                    ? '- Market Updates section (ONLY if included): ALWAYS end with a "Sources" paragraph containing 1-2 HYPERLINKED credible sources. REQUIRED FORMAT: <p style="font-size:14px; color:#666; margin-top:20px;">Sources: <a href="https://www.freddiemac.com/pmms" style="color:#00A89D; text-decoration:underline;" target="_blank" rel="noopener">Freddie Mac PMMS</a>, <a href="https://www.mortgagenewsdaily.com" style="color:#00A89D; text-decoration:underline;" target="_blank" rel="noopener">Mortgage News Daily</a></p>. Use ONLY real URLs from trusted sites.'
                    : '- Market Updates is EXCLUDED — do not create a Market section or mention market trends.'),
                (selections.contentSections.industry
                    ? '- Industry News section (ONLY if included): ALWAYS include 1-2 HYPERLINKED sources (MBA, HousingWire, National Mortgage News, etc.) in the same Sources paragraph format as Market Updates.'
                    : '- Industry News is EXCLUDED — do not create an Industry section.'),
                (selections.personal
                    ? '- PERSONAL UPDATE: Rewrite/polish ONLY the raw personal update input the user provided — warm, relatable, newsletter-perfect. Do NOT invent personal details, hobbies, family facts, or wins that are not in that input. If they mentioned a photo or video, weave that context in naturally.'
                    : '- PERSONAL UPDATE: User did not check Personal Update — skip the entire personal note block.'),
                '- PERSONAL NOTE TITLE RULE (only when Personal Update is included): Title exactly "A Note From [Name]" using ONLY THE FIRST NAME from the Name field.',
                (selections.personal && (selections.includePhoto || selections.includeVideo)
                    ? '- PERSONAL MEDIA: Leave [PERSONAL PHOTO PLACEHOLDER] untouched when photo is enabled; we handle photo/video in post-processing.'
                    : '- PERSONAL MEDIA: Do not include photo or video blocks.'),
                (selections.includeReferral
                    ? '- REFERRAL CTA: Do NOT include referral content in the newsletter body — we inject a compact referral block immediately before the footer disclaimer in post-processing.'
                    : '- REFERRAL CTA: User excluded the referral section — do NOT include [REFERRAL CTA PLACEHOLDER], referral headings, referral buttons, or any "know someone" ask.'),
                '- ALL EXTERNAL LINKS: target="_blank" rel="noopener".',
                '- If a personal photo URL is provided, place the image BELOW the personal note text. Use a simple table wrapper with max-width around 590px and max-height around 480px so the photo scales down automatically while staying fully visible. Keep it clean and Outlook-friendly.',
                '- Compliance: Do NOT write the footer disclaimer yourself — we inject the exact compliance footer in post-processing. NEVER quote specific rates anywhere.',
                '- COMPLIANCE (CRITICAL - NEVER BREAK): NEVER quote, mention, suggest, or imply ANY specific mortgage interest rates, APRs, current rates, or loan rates in ANY section (Market Update, Industry News, Current News, or elsewhere). Use only general language like "rates have fluctuated recently" WITHOUT any numbers or quotes. Violation = compliance risk.',
                '- EMAIL COMPATIBILITY (MANDATORY): Use ONLY inline styles. DO NOT include any <style> tags or class attributes. Use TABLE-BASED LAYOUTS for all structural elements. Avoid flexbox, gap, and box-shadow.',
                '- Main container: <table width="600" align="center"...> with background white.',
                '- Use consistent module spacing of 20px between sections. Main content tables should be width="600".',
                '- Sections: EACH section MUST be in its OWN nested table with background:#f9f9f9 and border-left:8px solid #00A89D to create distinct shaded card boxes with individual teal stripes. Add a spacer row <tr><td height="20"></td></tr> between sections for separation. NEVER merge sections into one cell.',
                '- BLOG RULE (VERY IMPORTANT): DO NOT create any blog section yourself unless instructed in SECTION SELECTION. Leave <!-- BLOG SECTION PLACEHOLDER --> only when blog is included.',
                '',
                'OUTPUT ONLY complete standalone HTML. Follow the header exactly. Then generate ONLY the optional content sections listed in SECTION SELECTION — each as its own teal card. Do not invent extra sections (no Client Story, no bonus Market block, etc.). After included sections, append the skeleton placeholders/footer below. Leave untouched placeholders only for sections marked INCLUDE.',
                '',
'<!DOCTYPE html>',
    '<html lang="en">',
    '<head><meta charset="UTF-8"></head>',
    '<body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial, sans-serif;">',
    '    <tr><td style="padding:40px 20px; text-align:center; background:#f9f9f9;">',
    '      <table align="center" cellpadding="0" cellspacing="0" style="margin:0 auto;">',
    '        <tr>',
    '          <td align="center">',
    '            <img src="https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Ruoff_Mortgage_FC-Jan-18-2026-05-19-19-8281-AM.png" alt="Ruoff Mortgage" width="200" style="width:200px; max-width:200px; height:auto; display:block;">',
    '          </td>',
    '        </tr>',
    '      </table>',
    '      <h1 style="color:#002B5C; font-size:36px; margin:20px 0 8px; text-align:center;">[Title]</h1>',
    '      <p style="color:#666; margin:0 0 25px; text-align:center;">Insights from [Location]</p>',
    '      <!-- Teal accent bar under header to tie it together -->',
    '      <table width="100%" cellpadding="0" cellspacing="0">',
    '        <tr>',
    '          <td height="6" bgcolor="#00A89D" style="background:#00A89D;"></td>',
    '        </tr>',
    '      </table>',
    '    </td></tr>',
    '    <tr><td style="background:#f9f9f9; padding:0; margin:0;" align="center"><img src="[REQUIRED HERO IMAGE URL]" alt="Hero" width="600" style="width:600px; max-width:600px; height:auto; display:block; border:0;"></td></tr>',
    '    <tr><td height="20"></td></tr>',
    '    <!-- MAIN CONTENT SECTIONS: generate ONLY the checked sections from SECTION SELECTION as full teal cards here -->',
    '    <tr><td><table width="100%" ... teal card ...> ... </table></td></tr>',
    '    <tr><td height="20"></td></tr>'
];
            if (selections.includeBlog) {
                promptLines.push('    <!-- BLOG SECTION PLACEHOLDER -->');
            }
            if (selections.personal) {
                promptLines.push(
                    '    <!-- Personal Note Section -->',
                    '    <tr><td><table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9; border-left:8px solid #00A89D; border-collapse:separate;">',
                    '      <tr><td style="padding:30px;">',
                    '        <h2 style="color:#002B5C; font-size:26px; margin:0 0 20px;">A Note From [Name]</h2>',
                    '        <p style="margin:15px 0 25px; font-size:18px; line-height:1.6;">[Polished personal update]</p>',
                    selections.includePhoto ? '        [PERSONAL PHOTO PLACEHOLDER]' : '',
                    '      </td></tr>',
                    '    </table></td></tr>',
                    '    <tr><td height="20"></td></tr>'
                );
            }
            if (selections.includeVideo) {
                promptLines.push('    <!-- PERSONAL VIDEO PLACEHOLDER -->');
            }
            promptLines.push(
                '    <!-- REFERRAL CTA: compact block added in post-processing immediately before disclaimer when enabled -->',
                '    <!-- DISCLAIMER: added in post-processing — do NOT include disclaimer text or footer rows in the body -->',
                (selections.contentSections.puzzle ? '    <!-- BRAIN_TEASER_ANSWER_PLACEHOLDER -->' : ''),
                '  </table>',
                '</bo' + 'dy>',
                '</ht' + 'ml>'
            );
        }

        const prompt = promptLines.join('\n');

        // Centralized API call (Phase 0)
        let fullContent = await window.callGrokAPI(prompt, {
            temperature: feedback ? 0.7 : 0.8,
            max_tokens: 12000,
            timeoutMs: feedback ? 180000 : 120000
        });

        if (!fullContent) throw new Error('Empty response from API');

        let cleaned = fullContent;
        const start = cleaned.search(/<!DOCTYPE html|<html/i);
        if (start !== -1) cleaned = cleaned.substring(start);
        const end = cleaned.toLowerCase().lastIndexOf('</html>');
        if (end !== -1) cleaned = cleaned.substring(0, end + 7);
        cleaned = cleaned.replace(/^```html?\s*/i, '').replace(/^```\s*/g, '').replace(/```$/g, '').trim();

        html = cleaned || lastGeneratedHTML || '<p>Generation failed.</p>';
        
        html = html.replace(/<head>[\s\S]*?<\/head>/gi, '<head><meta charset="UTF-8"></head>');
               // === OUTLOOK-PROOF FULL-WIDTH HERO ===

    } catch (err) {
        console.error('Generation failed', err);
        
        html = '';
        lastGeneratedHTML = '';
        
        const errorMessage = `
            <div style="padding: 40px 20px; background: #fff3f3; border: 2px solid #ff4d4d; border-radius: 12px; color: #c00; text-align: center; font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto;">
                <h2 style="margin: 0 0 20px; font-size: 28px; color: #c00;">Generation Failed</h2>
                <p style="font-size: 18px; margin: 0 0 15px; line-height: 1.5;">
                    The AI could not generate the newsletter due to an error.<br>
                    No content was created to avoid using inaccurate or outdated information.
                </p>
                <p style="font-size: 14px; color: #555; margin: 0 0 25px;">
                    Please try again in a moment. If this keeps happening, check your connection,<br>
                    API status, or contact support.
                </p>
                <button onclick="location.reload()" style="padding: 12px 32px; background: #c00; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer;">
                    Retry Generation
                </button>
            </div>
        `;
        
        const previewEl = document.getElementById('nl-preview');
        if (previewEl) {
            previewEl.innerHTML = errorMessage;
        }
        
        const rawEl = document.getElementById('nl-html-raw');
        if (rawEl) rawEl.value = '';
        
        alert('Newsletter generation failed. No content created — please try again.');
        
        gtag('event', feedback ? 'edit_newsletter_failed' : 'generate_newsletter_failed', {
            event_category: 'Tool Usage',
            event_label: feedback ? 'Newsletter Edit Failed' : 'Newsletter Generation Failed',
            value: 1
        });

    } finally {
        _nlGenerating = false;

        // Restore the original #global-loading markup (standard spinner + title + message) then hide via the shared helper.
        // Matches the finally pattern used by weekly-win-plan.js and other feature modules.
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

        if (html && html.trim() !== '') {
            const postSelections = feedback ? null : getNewsletterSelections();

            if (postSelections && !feedback) {
                html = applyUncheckedNewsletterSectionFilters(html, postSelections);
            }

            // Inject curated placeholders only for checked content sections
            if (!feedback && postSelections?.contentSections?.fun) {
                html = html.replace(/<p[^>]*id=["']?fun-fact-placeholder["']?[^>]*>[\s\S]*?<\/p>/gi, `<p>${selectedFunFact}</p>`);
            }
            if (!feedback && postSelections?.contentSections?.tip) {
                html = html.replace(/<p[^>]*id=["']?pro-tip-placeholder["']?[^>]*>[\s\S]*?<\/p>/gi, `<p>${selectedProTip}</p>`);
            }
            if (!feedback && postSelections?.contentSections?.quote) {
                html = html.replace(/<p[^>]*id=["']?quote-placeholder["']?[^>]*>[\s\S]*?<\/p>/gi, `<p><em>${selectedQuote}</em></p>`);
            }
            if (window.NlEntertainment && typeof window.NlEntertainment.injectIntoHtml === 'function') {
                html = window.NlEntertainment.injectIntoHtml(html, postSelections || getNewsletterSelections());
            }
            if (feedback) {
                html = html.replace(/<p[^>]*id=["']?fun-fact-placeholder["']?[^>]*>[\s\S]*?<\/p>/gi, `<p>${selectedFunFact}</p>`);
                html = html.replace(/<p[^>]*id=["']?pro-tip-placeholder["']?[^>]*>[\s\S]*?<\/p>/gi, `<p>${selectedProTip}</p>`);
                html = html.replace(/<p[^>]*id=["']?quote-placeholder["']?[^>]*>[\s\S]*?<\/p>/gi, `<p><em>${selectedQuote}</em></p>`);
                if (window.NlEntertainment && typeof window.NlEntertainment.injectIntoHtml === 'function') {
                    html = window.NlEntertainment.injectIntoHtml(html, getNewsletterSelections());
                }
            }

            // === ONLY RUN HEAVY INJECTION LOGIC ON FRESH GENERATION, NOT ON FEEDBACK EDITS ===
            // When editing with feedback, the model was explicitly told to return the COMPLETE modified full HTML.
            // Running the placeholder injections + section removals on an already-edited document was causing
            // large parts of the user's previous work to be stripped or overwritten.
            if (!feedback) {
                const includePhoto = postSelections?.includePhoto || false;
                const includeVideo = postSelections?.includeVideo || false;
                const personalPhotoUrl = includePhoto
                    ? (document.getElementById('nl-personal-photo')?.value.trim() || '')
                    : '';
                const personalVideoUrl = includeVideo
                    ? (document.getElementById('nl-personal-video')?.value.trim() || '')
                    : '';

                let photoInsert = '';
                if (includePhoto && personalPhotoUrl) {
                    photoInsert = buildPersonalPhotoInsert(personalPhotoUrl);
                }

            // Clean placeholder inside personal note (photo goes here if provided; keeps note + photo together)
            html = html.replace(/\[PERSONAL PHOTO PLACEHOLDER\]/gi, photoInsert);

// === PERSONAL NOTE HEADLINE - Force ONLY first name when personal section is included ===
if (postSelections?.personal) {
    html = html.replace(/A Note From \[Name\]/gi, `A Note From ${firstName}`);
    html = html.replace(/A Note From Adam/gi, `A Note From ${firstName}`);
    html = html.replace(/A Note from Adam/gi, `A Note From ${firstName}`);
    html = html.replace(/A Note From [^<]+/gi, `A Note From ${firstName}`);
}

// Blog injection — always immediately before personal note (after all main content)
const includeBlog = postSelections?.includeBlog || false;
if (includeBlog) {
    html = stripBlogSections(html);

    const blogUrl = (document.getElementById('nl-blog-url')?.value || '').trim();
    const blogTitle = (document.getElementById('nl-blog-title')?.value || '').trim() || 'Latest Blog Post';
    if (blogUrl && blogUrl.length > 3) {
        const fullBlogUrl = blogUrl.startsWith('http') ? blogUrl : 'https://' + blogUrl;
        const blogInnerTable = `<table width="100%" cellpadding="0" cellspacing="0" align="center" style="${NL_MODULE_WIDTH_STYLE}background:#f9f9f9;border-left:8px solid #00A89D;border-collapse:separate;">
        <tr>
            <td style="padding:30px;">
                <h2 style="color:#002B5C; font-size:26px; margin:0 0 15px;">My Recent Blog</h2>
                <p style="font-size:18px; font-weight:bold; margin-bottom:10px;">${blogTitle}</p>
                <p style="margin-bottom:15px;">Discover the latest insights on homeownership and mortgage strategies in this recent article.</p>
                <a href="${fullBlogUrl}" target="_blank" rel="noopener" style="color:#00A89D; font-weight:bold; text-decoration:underline; display:inline-block;">Read full article →</a>
            </td>
        </tr>
    </table>`;
        html = injectBlogBeforePersonal(html, blogInnerTable, { personalIncluded: !!postSelections?.personal });
    } else {
        html = html.replace(/<!--\s*BLOG SECTION PLACEHOLDER\s*-->/gi, '');
    }
} else {
    html = stripBlogSections(html);
    html = html.replace(/<!--\s*BLOG SECTION PLACEHOLDER\s*-->/gi, '');
}

// === PERSONAL VIDEO (after personal note, before referral) ===
if (includeVideo && personalVideoUrl) {
    html = injectPersonalVideoSection(html, personalVideoUrl);
} else {
    html = html.replace(/<!--\s*PERSONAL VIDEO PLACEHOLDER\s*-->/gi, '');
    html = stripPersonalVideoBlocks(html);
}

html = html.replace(/\[Email\]/g, document.getElementById('nl-email').value || '');
html = html.replace(/\[Name\]/g, firstName);

html = stripReferralSections(html);
if (postSelections?.includeReferral) {
    const referralEmail = document.getElementById('nl-email')?.value || '';
    const compactReferral = buildCompactReferralRowHtml(firstName, referralEmail);
    html = injectCompactReferralBeforeDisclaimer(html, compactReferral);
}

                // Final pass — strip any sections the user unchecked that the model may have added anyway
                if (postSelections) {
                    html = applyUncheckedNewsletterSectionFilters(html, postSelections);
                }
            } // end if (!feedback) — skip all the injection logic when the model already returned a full edited document

            // Always inject styled compliance footer — prevents orphan plain-text disclaimers.
            html = ensureLoNewsletterFooter(html);
            html = repairLoNewsletterForPreview(html);

            if (!feedback && window.NlEntertainment && typeof window.NlEntertainment.injectTeaserAnswerAtEnd === 'function') {
                html = window.NlEntertainment.injectTeaserAnswerAtEnd(html, getNewsletterSelections());
            }

    // Normalize before saving the raw HTML (for downloads/copying)
    lastGeneratedHTML = normalizeRawNewsletterHTML(html);
    lastGeneratedHTML = applyNewsletterColorBundle(lastGeneratedHTML);

            // === NORMALIZE ALL SECTION TABLES FOR PERFECT LEFT BORDER ALIGNMENT ===
            // Fixes the occasional "broken teal line" visual bug on the left side
            lastGeneratedHTML = lastGeneratedHTML.replace(
                /(<table[^>]*?border-left:\s*8px solid #00A89D[^>]*?>)([\s\S]*?<td[^>]*?)(style="[^"]*?")/gi,
                (match, tableStart, tdBeforeStyle, styleAttr) => {
                    let newStyle = styleAttr.replace(/padding\s*:\s*[^;"]+/i, 'padding: 30px 30px 30px 30px');
                    if (!/padding/i.test(newStyle)) {
                        newStyle = newStyle.replace(/"$/, ' padding:30px 30px 30px 30px"');
                    }
                    return tableStart + tdBeforeStyle + newStyle;
                }
            );

            html = lastGeneratedHTML;

            // Preview & raw output
            const previewEl = document.getElementById('nl-preview');
            const iframe = previewEl ? mountNewsletterPreviewIframe(previewEl, html) : null;
            if (iframe) {
                iframe.onload = () => {
                    configureNewsletterPreviewIframeOnLoad(iframe);
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

                    const previewSel = getNewsletterSelections();
                    const funFactP = iframeDoc.querySelector('#fun-fact-placeholder');
                    if (funFactP && previewSel.contentSections.fun) funFactP.innerHTML = selectedFunFact;

                    const proTipP = iframeDoc.querySelector('#pro-tip-placeholder');
                    if (proTipP && previewSel.contentSections.tip) proTipP.innerHTML = selectedProTip;

                    const quoteP = iframeDoc.querySelector('#quote-placeholder');
                    if (quoteP && previewSel.contentSections.quote) quoteP.innerHTML = `<em>${selectedQuote}</em>`;

                    // === RELIABLE LEFT BORDER ALIGNMENT NORMALIZATION (inside iframe) ===
                    // This runs after all placeholders are filled so we catch everything
                    normalizeSectionBorders(iframeDoc);
                };
            }

            const rawEl = document.getElementById('nl-html-raw');
            if (rawEl) rawEl.value = html;

            // Persist the final generated newsletter HTML so the last version (preview + content) survives page refresh
            // until the user either Clears it or generates a new version.
            try {
              localStorage.setItem('lastNewsletterHTML', html);
            } catch (e) {}

            gtag('event', feedback ? 'edit_newsletter' : 'generate_newsletter', {
                event_category: 'Tool Usage',
                event_label: feedback ? 'Newsletter Edited' : 'Newsletter Generated',
                value: 1
            });

            if (typeof confetti === 'function') {
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            }

            if (!feedback) {
                window._nlNextStepsId = `nl_${Date.now().toString(36)}`;
                showNewsletterReviewHandoff();
            }
        }

        const output = document.getElementById('newsletter-output');
        if (output) {
            output.classList.remove('hidden');
            if (feedback) {
                output.scrollIntoView({ behavior: 'smooth' });
            }
            // Add a visible Clear button (premium pill style) so user can discard the persisted last version
            if (!output.querySelector('.nl-clear-btn')) {
              const clr = document.createElement('button');
              clr.className = 'nl-clear-btn mt-3 text-xs px-4 py-2 rounded-2xl border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition flex items-center gap-2';
              clr.innerHTML = '<i class="fas fa-trash"></i> Clear this newsletter';
              clr.onclick = () => { if (window.clearSavedNewsletter) window.clearSavedNewsletter(); };
              output.appendChild(clr);
            }
        }

        if (feedback && document.getElementById('nl-feedback')) {
            document.getElementById('nl-feedback').value = '';
        }
    }
    }  // additional close for if (html && ...) to fix brace count after personal media insertion refactor (old block had extra closes)

function downloadNewsletterHTML() {
    const html = document.getElementById('nl-html-raw').value;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'newsletter_' + new Date().toISOString().slice(0,10) + '.html';
    a.click();
    URL.revokeObjectURL(url);
    alert('Newsletter downloaded! Double-click the file to preview.');
}

function ensureTdOutlookCentered(tdAttrs) {
    let attrs = String(tdAttrs || '');
    if (!/align\s*=\s*["']?center["']?/i.test(attrs)) attrs += ' align="center"';
    if (!/text-align\s*:\s*center/i.test(attrs)) {
        attrs = /style\s*=/i.test(attrs)
            ? attrs.replace(/style\s*=\s*"/i, 'style="text-align:center;')
            : `${attrs} style="text-align:center;"`;
    }
    return attrs;
}

function ensureTableOutlookCentered(tableAttrs) {
    let attrs = String(tableAttrs || '');
    if (!/align\s*=\s*["']?center["']?/i.test(attrs)) attrs += ' align="center"';
    return attrs;
}

function ensureContentRowsCentered(html) {
    let out = String(html || '');

    out = out.replace(
        /(<tr>\s*<td)([^>]*)(>[\s\S]*?<img[^>]*\balt=["']Hero[^>]*>)/gi,
        (m, open, tdAttrs, rest) => `${open}${ensureTdOutlookCentered(tdAttrs)}${rest}`
    );

    out = out.replace(
        /(<tr>\s*<td)([^>]*)(>\s*<table[^>]*\bborder-left:\s*8px solid #?[0-9a-fA-F]{6})/gi,
        (m, open, tdAttrs, rest) => `${open}${ensureTdOutlookCentered(tdAttrs)}${rest}`
    );

    out = out.replace(
        /(<tr>\s*<td)([^>]*)(>\s*<table[^>]*\bdata-nl-personal-(?:photo|video)=["']1["'])/gi,
        (m, open, tdAttrs, rest) => `${open}${ensureTdOutlookCentered(tdAttrs)}${rest}`
    );

    out = out.replace(
        /(<table\b)([^>]*\bborder-left:\s*8px solid #?[0-9a-fA-F]{6}[^>]*)(>)/gi,
        (m, open, tableAttrs, close) => `${open}${ensureTableOutlookCentered(tableAttrs)}${close}`
    );

    out = out.replace(
        /(<table\b)([^>]*\bdata-nl-personal-(?:photo|video)=["']1["'][^>]*)(>)/gi,
        (m, open, tableAttrs, close) => `${open}${ensureTableOutlookCentered(tableAttrs)}${close}`
    );

    return out;
}

function wrapBodyForOutlookPaste(html) {
    const bodyMatch = String(html || '').match(/^([\s\S]*?<body[^>]*>)([\s\S]*)(<\/body>[\s\S]*)$/i);
    if (!bodyMatch) return html;
    let inner = bodyMatch[2].trim();
    if (/data-nl-outlook-body\s*=\s*["']1["']/i.test(inner)) return html;
    inner = `<table role="presentation" data-nl-outlook-body="1" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;background:#f4f4f4;"><tr><td align="center" style="padding:0;margin:0;">${inner}</td></tr></table>`;
    return bodyMatch[1] + inner + bodyMatch[3];
}

function getCleanOutlookHTML() {
    const rawEl = document.getElementById('nl-html-raw');
    if (!rawEl || !rawEl.value) {
        return '';
    }

    let cleanHTML = rawEl.value;

    // === BRAND COLOR NORMALIZATION for clean Outlook / vault copies ===
    // Replaces obnoxious orange (#F15A29) headers/buttons with professional navy (#002B5C)
    // so the saved-to-vault version (and what Copy for Outlook copies) has subdued, email-appropriate styling.
    // The full branded orange version is still available via raw download if desired.
    cleanHTML = cleanHTML.replace(/#F15A29/gi, '#002B5C');
    cleanHTML = cleanHTML.replace(/F15A29/gi, '002B5C');
    // Also catch in style/bgcolor attrs etc.
    cleanHTML = cleanHTML.replace(/color\s*:\s*#?F15A29/gi, 'color:#002B5C');
    cleanHTML = cleanHTML.replace(/background\s*:\s*#?F15A29/gi, 'background:#002B5C');
    cleanHTML = cleanHTML.replace(/background-color\s*:\s*#?F15A29/gi, 'background-color:#002B5C');
    cleanHTML = cleanHTML.replace(/bgcolor\s*=\s*["']?#?F15A29["']?/gi, 'bgcolor="#002B5C"');

    // === HERO IMAGE - Light gray background on sides + centered (cleaned only) ===
    cleanHTML = cleanHTML.replace(
        /<tr>\s*<td[^>]*>\s*<img src="([^"]+)"[^>]*alt=["']Hero[^>]*>[\s\S]*?<\/td>\s*<\/tr>/gi,
        `<tr>
            <td align="center" style="background:#f9f9f9; padding:0; text-align:center;">
                <img src="$1" alt="Hero Image" width="600" 
                     style="width:600px; max-width:600px; height:auto; display:block; margin:0 auto; border:0;">
            </td>
        </tr>
        <tr><td height="20" align="center"></td></tr>`
    );

    // === UNIFORM PADDING ON EVERY TEAL CARD'S CONTENT TD (cleaned only) ===
    cleanHTML = cleanHTML.replace(
        /(<table[^>]*?border-left:\s*8px solid #00A89D[^>]*>)([\s\S]*?<td[^>]*?)(style="[^"]*?")/gi,
        (match, tableStart, tdBeforeStyle, styleAttr) => {
            let newStyle = styleAttr.replace(/padding\s*:\s*[^;"]+/i, 'padding:30px 30px 30px 30px');
            if (!/padding/i.test(newStyle)) {
                newStyle = newStyle.replace(/"$/, '; padding:30px 30px 30px 30px"');
            }
            if (!/box-sizing/i.test(newStyle)) {
                newStyle = newStyle.replace(/"$/, '; box-sizing:border-box"');
            }
            return tableStart + tdBeforeStyle + newStyle;
        }
    );

    cleanHTML = normalizePersonalPhotoBlocks(cleanHTML);
    cleanHTML = normalizePersonalVideoBlocks(cleanHTML);
    cleanHTML = normalizeNewsletterModuleWidths(cleanHTML);
    cleanHTML = ensureContentRowsCentered(cleanHTML);
    cleanHTML = wrapBodyForOutlookPaste(cleanHTML);

    return cleanHTML;
}

function copyHtmlToOutlookClipboard(html, onSuccess, onError) {
    const clean = String(html || '');
    if (!clean) return Promise.reject(new Error('empty'));

    const done = () => {
        if (typeof onSuccess === 'function') onSuccess();
    };

    if (navigator.clipboard && window.ClipboardItem) {
        const blob = new Blob([clean], { type: 'text/html' });
        return navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(done);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(clean).then(done);
    }
    return Promise.reject(new Error('clipboard unavailable'));
}

function copyForOutlook() {
    const cleanHTML = getCleanOutlookHTML();
    if (!cleanHTML) {
        alert('Generate the newsletter first!');
        return;
    }

    const onSuccess = () => {
        alert('✅ Outlook-optimized HTML copied!\n\nPaste into a NEW email in Outlook.');
    };

    copyHtmlToOutlookClipboard(cleanHTML, onSuccess).catch(() => {
        try {
            const ta = document.createElement('textarea');
            ta.value = cleanHTML;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            onSuccess();
        } catch (err) {
            console.error(err);
            alert('Clipboard issue — try the regular Copy HTML button instead.');
        }
    });
}

  // =====================================================
  // PUBLIC API EXPOSURE (for onclick handlers and cross-feature calls)
  // =====================================================
  function reloadNewsletterPersistedValues() {
    persistentFields.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const saved = localStorage.getItem(id);
      if (saved === null) return;
      if (el.type === 'checkbox') {
        el.checked = saved === 'true' || saved === '1';
      } else {
        el.value = saved;
      }
    });

    const savedSections = safeParseJSONArray('nl-sections');
    if (savedSections.length) {
      document.querySelectorAll('#newsletter-generator input[type="checkbox"]').forEach((cb) => {
        if (!cb.id || !cb.id.startsWith('nl-')) return;
        if (cb.id === 'nl-include-referral' && !savedSections.includes(cb.id)) {
          cb.checked = true;
          return;
        }
        cb.checked = savedSections.includes(cb.id);
      });
    }

    const personalCb = document.getElementById('nl-personal');
    const personalFields = document.getElementById('personal-fields');
    if (personalCb && personalFields) personalFields.classList.toggle('hidden', !personalCb.checked);
    const blogCb = document.getElementById('nl-include-blog');
    const blogFields = document.getElementById('blog-fields');
    if (blogCb && blogFields) blogFields.classList.toggle('hidden', !blogCb.checked);

    if (typeof updateCustomContentChoicesVisibility === 'function') updateCustomContentChoicesVisibility();
    if (typeof updateCoreSectionDirectionUI === 'function') updateCoreSectionDirectionUI();
    if (typeof updateNewsletterPreflightSummary === 'function') updateNewsletterPreflightSummary();
  }

  window.generateNewsletter = generateNewsletter;
  window.updateNewsletterPreflightSummary = updateNewsletterPreflightSummary;
  window.updatePersonalMediaPreviews = updatePersonalMediaPreviews;
  window.reloadNewsletterPersistedValues = reloadNewsletterPersistedValues;
  window.NL_PERSISTENT_FIELD_IDS = persistentFields.slice();
  window.refreshNewsletterColorScheme = refreshNewsletterColorScheme;
  window.downloadNewsletterHTML = downloadNewsletterHTML;
  window.copyForOutlook = copyForOutlook;
  window.getCleanOutlookHTML = getCleanOutlookHTML;

  // Centralized save for newsletter that ALWAYS uses the exact same cleaned Outlook version
  // as what copyForOutlook() would copy to clipboard. This ensures "Save to Vault" never
  // has the orange headers that the raw/preview might.
  window.saveNewsletterToVault = function() {
    if (typeof window.toggleSaveIdea !== 'function') {
      alert('Saved Items system not ready yet. Please try again in a moment.');
      return;
    }
    const clean = getCleanOutlookHTML();
    if (!clean) {
      alert('Generate the newsletter first!');
      return;
    }
    const baseTitle = (document.getElementById('nl-title') && document.getElementById('nl-title').value) || 'My Newsletter';
    // Append timestamp so user can save multiple versions / batches without overwriting previous ones
    const title = baseTitle + ' — ' + new Date().toISOString().slice(0, 16).replace('T', ' ');
    window.toggleSaveIdea(title, clean, null, 'newsletter', { format: 'html' });
    if (window.showToast) {
      window.showToast('Newsletter (Outlook version) saved to My Saved Items!', 'success');
    } else {
      alert('Newsletter (Outlook version) saved to My Saved Items!');
    }
  };

  // Clear the last persisted newsletter (tool preview + raw). Vault copies in My Saved Items are unaffected.
  window.clearSavedNewsletter = function() {
    try { localStorage.removeItem('lastNewsletterHTML'); } catch (e) {}
    const preview = document.getElementById('nl-preview');
    if (preview) preview.innerHTML = '';
    const raw = document.getElementById('nl-html-raw');
    if (raw) raw.value = '';
    const output = document.getElementById('newsletter-output');
    if (output) output.classList.add('hidden');
  };

  // Restore last newsletter HTML into raw + preview iframe (called from init).
  function restoreLastNewsletter() {
    try {
      const last = localStorage.getItem('lastNewsletterHTML');
      if (!last) return;
      // Rebuild disclaimer from profile; dedupe referral only (never duplicate referral).
      let html = prepareLoNewsletterForRestore(last);
      if (window.NlEntertainment && typeof window.NlEntertainment.injectTeaserAnswerAtEnd === 'function') {
        html = window.NlEntertainment.injectTeaserAnswerAtEnd(html, getNewsletterSelections());
      }
      html = applyNewsletterColorBundle(html);
      lastGeneratedHTML = html;
      const rawEl = document.getElementById('nl-html-raw');
      const previewEl = document.getElementById('nl-preview');
      const outEl = document.getElementById('newsletter-output');
      if (rawEl) rawEl.value = html;
      if (previewEl) {
        mountNewsletterPreviewIframe(previewEl, html);
      }
      if (outEl) outEl.classList.remove('hidden');
      // Ensure a Clear button is present after restore (same as generate path)
      if (outEl && !outEl.querySelector('.nl-clear-btn')) {
        const clr = document.createElement('button');
        clr.className = 'nl-clear-btn mt-3 text-xs px-4 py-2 rounded-2xl border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition flex items-center gap-2';
        clr.innerHTML = '<i class="fas fa-trash"></i> Clear this newsletter';
        clr.onclick = () => { if (window.clearSavedNewsletter) window.clearSavedNewsletter(); };
        outEl.appendChild(clr);
      }
    } catch (e) {}
  }

  window.syncNewsletterFromProfile = syncNewsletterFromProfile;

  // These helpers are called from HTML onclick in the newsletter section
  if (typeof resetUsed === 'function') window.resetUsed = resetUsed;
  if (typeof updatePreviews === 'function') window.updatePreviews = updatePreviews;
  // Expose both the generic name (for back-compat) and a dedicated stable name for the custom content choice modals
  // so later inline scripts that redefine window.openModal / closeModal do not break "Choose Specific"
  if (typeof openModal === 'function') {
    window.openNewsletterChoiceModal = openModal;
  }
  if (typeof closeModal === 'function') {
    window.closeNewsletterChoiceModal = closeModal;
  }
  if (typeof regenerateRandom === 'function') window.regenerateRandom = regenerateRandom;

  window._nlOpenChoice = function (cat) {
    if (typeof window.openNewsletterChoiceModal === 'function') return window.openNewsletterChoiceModal(cat);
    if (typeof openModal === 'function') return openModal(cat);
  };

  window.ensureNewsletterChoiceModal = ensureNewsletterChoiceModal;

  window.__NEWSLETTER_MODALS_EXPORTS = {
    openNewsletterChoiceModal: window.openNewsletterChoiceModal,
    closeNewsletterChoiceModal: window.closeNewsletterChoiceModal,
    _nlOpenChoice: window._nlOpenChoice,
    wireNewsletterChoiceButtons: wireNewsletterChoiceButtons,
    ensureNewsletterChoiceModal: ensureNewsletterChoiceModal
  };

  window.restoreNewsletterModals = function restoreNewsletterModals() {
    const exp = window.__NEWSLETTER_MODALS_EXPORTS;
    if (!exp) return;
    if (exp.openNewsletterChoiceModal) window.openNewsletterChoiceModal = exp.openNewsletterChoiceModal;
    if (exp.closeNewsletterChoiceModal) window.closeNewsletterChoiceModal = exp.closeNewsletterChoiceModal;
    if (exp._nlOpenChoice) window._nlOpenChoice = exp._nlOpenChoice;
    if (typeof exp.wireNewsletterChoiceButtons === 'function') exp.wireNewsletterChoiceButtons();
    if (typeof exp.ensureNewsletterChoiceModal === 'function') {
      window.ensureNewsletterChoiceModal = exp.ensureNewsletterChoiceModal;
      try { exp.ensureNewsletterChoiceModal(); } catch (e) {}
    }
  };

  // =====================================================
  // RELIABLE NEWSLETTER SECTION BORDER NORMALIZATION
  // Fixes the occasional left teal line misalignment
  // =====================================================

  function parsePersonalMediaWidthPx(imgAttrs, fallbackPx) {
      const s = String(imgAttrs || '');
      const styleW = s.match(/width:\s*(\d+)px/i);
      if (styleW) return Math.min(parseInt(styleW[1], 10), NL_CARD_CONTENT_WIDTH);
      const attrW = s.match(/\bwidth=["'](\d+)["']/i);
      if (attrW) return Math.min(parseInt(attrW[1], 10), NL_CARD_CONTENT_WIDTH);
      return fallbackPx;
  }

  function resolvePersonalPhotoWidthPx(imgAttrs) {
      const photoEnabled = !!document.getElementById('nl-include-photo')?.checked && !!document.getElementById('nl-personal')?.checked;
      if (photoEnabled && document.getElementById('nl-personal-photo-size')) {
          return getPersonalPhotoWidthPx();
      }
      return parsePersonalMediaWidthPx(imgAttrs, getPersonalPhotoWidthPx());
  }

  function resolvePersonalVideoWidthPx(imgAttrs) {
      const videoEnabled = !!document.getElementById('nl-include-video')?.checked;
      if (videoEnabled && document.getElementById('nl-personal-video-size')) {
          return getPersonalVideoWidthPx();
      }
      return parsePersonalMediaWidthPx(imgAttrs, getPersonalVideoWidthPx());
  }

  function buildPersonalPhotoImgTag(src, imgAttrs) {
      const px = resolvePersonalPhotoWidthPx(imgAttrs);
      return `<img src="${src}" alt="Personal photo" width="${px}" style="display:block;margin:0 auto;max-width:100%;width:${px}px;height:auto;border:0;border-radius:8px;">`;
  }

  function applyPersonalMediaWidthsInHtml(htmlString) {
      if (!htmlString) return htmlString;
      let out = htmlString.replace(
          /<img([^>]*alt=["']Personal photo["'][^>]*)>/gi,
          (match, attrs) => {
              const srcMatch = String(attrs).match(/\bsrc=["']([^"']+)["']/i);
              if (!srcMatch) return match;
              return buildPersonalPhotoImgTag(srcMatch[1], attrs);
          }
      );
      out = out.replace(
          /<img([^>]*alt=["']Watch Personal Video["'][^>]*)>/gi,
          (match, attrs) => {
              const srcMatch = String(attrs).match(/\bsrc=["']([^"']+)["']/i);
              if (!srcMatch) return match;
              const px = resolvePersonalVideoWidthPx(attrs);
              const accent = getNewsletterAccentColor();
              return `<img src="${srcMatch[1]}" alt="Watch Personal Video" width="${px}" style="display:block;margin:0 auto;width:${px}px;max-width:100%;height:auto;border:3px solid ${accent};border-radius:8px;">`;
          }
      );
      return out;
  }

  function normalizePersonalPhotoBlocks(htmlString) {
      if (!htmlString) return htmlString;
      const photoFrameRe = /<table(?![^>]*data-nl-personal-photo)[^>]*style="[^"]*margin:\s*15px\s*0[^"]*max-width:\s*100%[^"]*"[^>]*>[\s\S]*?<img([^>]*alt=["']Personal photo["'][^>]*)[\s\S]*?<\/table>/gi;
      let out = htmlString.replace(photoFrameRe, (match, imgAttrs) => {
          const srcMatch = String(imgAttrs).match(/\bsrc=["']([^"']+)["']/i);
          if (!srcMatch) return match;
          return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" data-nl-personal-photo="1" style="margin:16px 0 0;width:100%;max-width:${NL_CARD_CONTENT_WIDTH}px;">
  <tr><td align="center" style="padding:0;">
    ${buildPersonalPhotoImgTag(srcMatch[1], imgAttrs)}
  </td></tr>
</table>`;
      });
      return applyPersonalMediaWidthsInHtml(out);
  }

  function normalizePersonalVideoBlocks(htmlString) {
      if (!htmlString) return htmlString;
      return applyPersonalMediaWidthsInHtml(htmlString);
  }

  function normalizeRawNewsletterHTML(htmlString) {
      if (!htmlString) return htmlString;

      let out = normalizePersonalPhotoBlocks(htmlString);
      out = normalizePersonalVideoBlocks(out);
      out = normalizeNewsletterModuleWidths(out);

      // Force every section table with the teal left border to have identical inner padding
      return out.replace(
          /(<table[^>]*?border-left:\s*8px solid #00A89D[^>]*>)([\s\S]*?<td[^>]*?style=")([^"]*)(")/gi,
          (match, tableOpen, tdStyleStart, existingStyle, quote) => {
              let newStyle = existingStyle.replace(/padding\s*:\s*[^;"]*/i, 'padding:30px 30px 30px 30px');
              if (!/padding/i.test(newStyle)) {
                  newStyle += '; padding:30px 30px 30px 30px';
              }
              // Also force box-sizing for consistency
              if (!/box-sizing/i.test(newStyle)) {
                  newStyle += '; box-sizing:border-box';
              }
              return tableOpen + tdStyleStart + newStyle + quote;
          }
      );
  }

  function normalizeSectionBorders(doc) {
      if (!doc) return;

      const primary = getNewsletterAccentColor();
      const tables = doc.querySelectorAll('table[style*="border-left"]');

      tables.forEach((table) => {
          const style = table.getAttribute('style') || '';
          if (!NL_SECTION_LEFT_BORDER_IN_TABLE_RE.test(style)) return;

          table.style.borderLeft = `8px solid ${primary}`;
          table.style.borderCollapse = 'separate';

          const firstTd = table.querySelector('td');
          if (firstTd) {
              firstTd.style.padding = '30px 30px 30px 30px';
              firstTd.style.boxSizing = 'border-box';
          }
      });

      doc.querySelectorAll('img[alt="Watch Personal Video"]').forEach((img) => {
          img.style.border = `3px solid ${primary}`;
      });
  }

  // =====================================================
  // INITIALIZATION
  // =====================================================
  // =====================================================
  // CENTRAL PROFILE HELPERS (for prompt injection + sync, matching pattern in weekly/blog/social/sales/PTB/ai-chat)
  // =====================================================
  function getCentralProfile() {
    try {
      if (window.getUserProfile) return window.getUserProfile();
      return JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch (e) {
      return {};
    }
  }

  function getEffectiveSetup() {
    const central = getCentralProfile();
    return {
      ...central,
      name: central.name || '',
      email: central.email || central.workEmail || '',
      localArea: central.localArea || central.market || central.location || '',
      voiceTraits: central.voiceTraits || [],
      personality: central.personality || '',
      tone: central.tone || '',
      hobbies: central.hobbies || [],
      hobbiesOther: central.hobbiesOther || '',
      challenges: central.challenges || [],
      focus: central.focus || '',
      years: central.years || '',
      team: central.team || ''
    };
  }

  function setNewsletterFieldIfEmpty(id, value, options) {
    const opts = options || {};
    const v = String(value || '').trim();
    if (!v) return false;
    const el = document.getElementById(id);
    if (!el) return false;
    const current = String(el.value || '').trim();
    const emptyValues = Array.isArray(opts.treatAsEmpty) ? opts.treatAsEmpty.map((x) => String(x).trim()) : [];
    const isEmpty = !current || emptyValues.includes(current);
    if (!isEmpty && !opts.force) return false;
    el.value = v;
    if (opts.dispatch !== false) {
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return true;
  }

  function mapProfileToneToNewsletterTone(profileTone) {
    const t = String(profileTone || '').toLowerCase();
    if (!t) return '';
    if (t.includes('witty') || t.includes('fun')) return 'fun-playful';
    if (t.includes('casual') || t.includes('friend')) return 'casual-friendly';
    if (t.includes('straightforward') || t.includes('helpful')) return 'conversational';
    if (t.includes('local') || t.includes('community') || t.includes('neighbor')) return 'local-neighbor';
    if (t.includes('professional') || t.includes('approachable') || t.includes('warm')) return 'warm-professional';
    return '';
  }

  function mapProfileAudience(profile) {
    const focus = String(profile.partnerFocus || '').toLowerCase();
    const partners = Array.isArray(profile.partnerTypes) ? profile.partnerTypes.join(' ').toLowerCase() : '';
    const haystack = `${focus} ${partners}`;
    if (/realtor|agent|partner|referral/.test(haystack)) return 'partners';
    if (/past client|former client|repeat/.test(haystack)) return 'past';
    if (/sphere|soi|friends|family/.test(haystack)) return 'sphere';
    return '';
  }

  function syncNewsletterFromProfile() {
    try {
      const p = getCentralProfile();
      syncNewsletterContactFromProfile();

      const market = (p.localArea || p.market || p.location || '').trim();
      setNewsletterFieldIfEmpty('nl-location', market, { treatAsEmpty: ['Fort Wayne, Indiana'] });

      const mappedTone = mapProfileToneToNewsletterTone(p.tone);
      if (mappedTone) setNewsletterFieldIfEmpty('nl-tone', mappedTone);

      const mappedAudience = mapProfileAudience(p);
      if (mappedAudience) setNewsletterFieldIfEmpty('nl-audience', mappedAudience);

      setNewsletterFieldIfEmpty('nl-blog-url', p.blogPageUrl || p.blogUrl);

      const notes = (p.contentNotes || '').trim();
      if (notes) setNewsletterFieldIfEmpty('nl-specific', notes);

      const colorEl = document.getElementById('nl-color-bundle');
      const savedColor = localStorage.getItem('nl-color-bundle');
      if (colorEl && p.newsletterColorBundle && !savedColor) {
        colorEl.value = p.newsletterColorBundle;
        colorEl.dispatchEvent(new Event('change', { bubbles: true }));
      }

      if (typeof window.__nlRefreshWizardCuratedPreviews === 'function') {
        try { window.__nlRefreshWizardCuratedPreviews(); } catch (e) {}
      }
    } catch (e) {
      console.warn('[newsletter] profile sync failed', e);
    }
  }

  function initNewsletterGenerator() {
    try { injectEngagementPolishStyles(); } catch (e) {}
    try { ensureNewsletterChoiceModal(); } catch (e) {}
    if (typeof window.restoreNewsletterModals === 'function') {
      try { window.restoreNewsletterModals(); } catch (e) {}
    }
    if (typeof wireNewsletterChoiceButtons === 'function') {
      try { wireNewsletterChoiceButtons(); } catch (e) {}
    }
    try { wireNewsletterLiveFeedback(); } catch (e) {}
    try { wireNewsletterFeedbackFocusGuard(); } catch (e) {}
    try { wireCoreSectionDirectionControls(); } catch (e) {}
    try { wireCustomContentJumpControls(); } catch (e) {}
    setTimeout(() => {
      if (typeof window.initNewsletterSetupForm === 'function') {
        try { window.initNewsletterSetupForm(); } catch (e) {}
      }
    }, 120);

    // Initial profile sync (non-destructive)
    setTimeout(() => {
      if (typeof syncNewsletterContactFromProfile === 'function') syncNewsletterContactFromProfile();
      if (typeof syncNewsletterFromProfile === 'function') syncNewsletterFromProfile();
      if (typeof window.initNewsletterSetupForm === 'function') {
        try { window.initNewsletterSetupForm(); } catch (e) {}
      }
    }, 50);

    // Ensure conditional fields (personal / blog) show/hide work
    setTimeout(() => {
      const personalCb = document.getElementById('nl-personal');
      const personalFields = document.getElementById('personal-fields');
      if (personalCb && personalFields) {
        const togglePersonal = () => personalFields.classList.toggle('hidden', !personalCb.checked);
        personalCb.addEventListener('change', togglePersonal);
        togglePersonal();
      }
      const blogCb = document.getElementById('nl-include-blog');
      const blogFields = document.getElementById('blog-fields');
      if (blogCb && blogFields) {
        const toggleBlog = () => blogFields.classList.toggle('hidden', !blogCb.checked);
        blogCb.addEventListener('change', toggleBlog);
        toggleBlog();
      }
    }, 80);

    // Defer restore until profile + checkbox state are settled (avoids footer/referral drift on refresh).
    setTimeout(() => {
      if (typeof restoreLastNewsletter === 'function') {
        try { restoreLastNewsletter(); } catch (e) {}
      }
    }, 300);

    console.log('%c[newsletter-generator.js] Newsletter Generator initialized', 'color:#00A89D');
  }

  window.syncNewsletterFromProfile = syncNewsletterFromProfile;
  window.syncNewsletterContactFromProfile = syncNewsletterContactFromProfile;
  window.showNewsletterReviewHandoff = showNewsletterReviewHandoff;
  window.updateCustomContentChoicesVisibility = updateCustomContentChoicesVisibility;
  window.scrollToNewsletterCustomContent = scrollToNewsletterCustomContent;
  window.openNewsletterEngagementHub = openNewsletterEngagementHub;
  window.renderNewsletterEngagementHubTabs = renderNewsletterEngagementHubTabs;
  window.renderEngagementModalToolbar = renderEngagementModalToolbar;
  window.getEngagementHubTabByCategory = getEngagementHubTabByCategory;
  window.shuffleAllCheckedEngagement = shuffleAllCheckedEngagement;
  window.flashCuratedPreview = flashCuratedPreview;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNewsletterGenerator);
  } else {
    initNewsletterGenerator();
  }

})();
