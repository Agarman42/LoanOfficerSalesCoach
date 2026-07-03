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

    // ==================== SMART HOMEOWNERSHIP MONEY MOVES (Client advice agents share) ====================
    "Smart Money Moves: File for Homestead Deduction — Available in Indiana, Ohio, Michigan, and Kentucky. Caps taxable value increases and can save you hundreds per year.",
    "Smart Money Moves: Track Capital Improvements — Keep receipts for roof, HVAC, kitchen, or bath upgrades. This raises your cost basis and reduces capital gains tax when you sell.",
    "Smart Money Moves: Build a Dedicated House Fund — Set aside 1–2% of your home’s value each year in a high-yield savings account for repairs and emergencies.",
    "Smart Money Moves: Annual Homeowners Insurance Review — Shop every 2–3 years and bundle with auto. Many families save 15–30%.",
    "Smart Money Moves: Take Advantage of Utility Rebates — Duke Energy, AEP, NIPSCO, DTE, Consumers Energy, and Kentucky utilities offer rebates for energy upgrades.",
    "Smart Ownership: Track Your Home's Value Annually — Pull comps or ask your agent for a quick equity snapshot. Great for planning upgrades or a future move.",
    "Smart Money Moves: Energy Efficiency Tax Credits — Federal credits up to $3,200+ for windows, insulation, and heat pumps. Stack with state incentives.",
    "Smart Money Moves: Review Your Property Tax Assessment — If it seems high, appeal with recent comparable sales your agent can help gather.",
    "Smart Money Moves: High-Yield Emergency Fund — Keep 3–6 months of expenses (including housing costs) in an online savings account earning 4–5%.",
    "Smart Money Moves: Bundle Cable/Internet Annually — Call your provider for retention deals — many save $20–50 per month.",
    "Smart Money Moves: Install a Smart Thermostat — Cuts heating/cooling costs by 10–15%. Many utilities offer rebates.",
    "Smart Money Moves: LED Bulb Swap — Saves $50–100 yearly and lasts 10+ years.",
    "Smart Money Moves: Lower Water Heater to 120°F — Simple adjustment that saves 3–5% on water heating.",
    "Smart Money Moves: Create a Home Inventory — Photograph valuables and store in the cloud for faster insurance claims.",
    "Smart Ownership: Review Property Tax Bill Annually — Make sure your assessment matches reality; appeal if neighborhood comps suggest you're overpaying.",
    "Smart Money Moves: Over 65 Circuit Breaker Credit — Protects qualifying seniors from large property tax increases in all four states.",
    "Smart Money Moves: Veteran Property Tax Exemptions — Additional relief available in IN, OH, MI, and KY for qualifying veterans.",
    "Smart Money Moves: Shop Homeowners Insurance Every 2-3 Years — Switching can save 10-25% with the same or better coverage.",
    "Smart Money Moves: Take Advantage of Federal Energy Credits — Up to $3,200 for qualifying home improvements in 2026.",
    "Smart Ownership: Document Every Upgrade — Photos and receipts help at resale and make your agent's pricing conversation sharper.",
    "Smart Money Moves: Consider a Home Equity Line of Credit (HELOC) — Flexible access to equity for home projects or emergencies; talk with your lender before major renovations.",
    "Smart Money Moves: Track Utility Usage Monthly — Spot unusual spikes early and address them before bills get out of hand.",
    "Smart Money Moves: Use Cash-Back Credit Cards for Home Purchases — Earn rewards on tools, materials, and repairs.",
    "Smart Money Moves: Set Up Automatic Bill Pay for Utilities — Avoid late fees and keep your credit score strong.",
    "Smart Money Moves: Review Credit Report Annually — Free once per year at AnnualCreditReport.com. Fix errors before your next purchase or sale.",
    "Seller Prep: Small Repairs Before Listing — Fix leaky faucets, touch up paint, and replace burned-out bulbs. First impressions drive offers.",
    "Market Awareness: Know Your Neighborhood Stats — Median days on market and list-to-sale ratio help you time a move-up or sale.",
    "Smart Money Moves: Save Improvement Receipts for Tax Time — Mortgage interest and property taxes are common deductions; your tax pro can flag what else applies.",
    "Smart Money Moves: Build Equity Through Home Improvements — Kitchen and bath updates often give the best return on investment in Midwest markets.",
    "Smart Ownership: Pay Down High-Interest Debt Before a Move — Stronger finances mean more options when you're ready to buy or sell.",

    // ==================== EQUITY & MOVE-UP CHECKUP (Agent client advice) ====================
    "Equity & Move-Up: When to Consider Selling & Moving Up — Equity gains + life changes (growing family, new job) often signal it's time to explore options.",
    "Equity & Move-Up: Renovation Budget Planning — Phase big projects or bundle for one contractor bid. Your agent can suggest which upgrades add the most value locally.",
    "Equity & Move-Up: Build Equity Faster — Complete value-adding projects, maintain the home well, and avoid deferred repairs that buyers notice at inspection.",
    "Equity & Move-Up: Annual Equity Snapshot — Pull comps or use tools to estimate current value vs. what you owe — a powerful conversation starter for move-up clients.",
    "Equity & Move-Up: At 20% Equity — Great time to explore move-up options, investment property conversations, or a strategic sale with your agent.",
    "Equity & Move-Up: Pre-Sale Prep Timeline — Start decluttering and minor repairs 4–6 weeks before photos. Strong listings sell faster and often for more.",
    "Equity & Move-Up: Spring vs Fall Timing — In the Midwest, spring often brings more buyers; fall can mean less competition for buyers — match timing to your goals.",
    "Equity & Move-Up: Using Equity Wisely — Home projects, education, or a down payment on the next place — always tie decisions back to long-term goals.",
    "Equity & Move-Up: Line Up Your Team Early — Inspector, lender, and title contacts before you list or make an offer saves weeks of stress.",
    "Equity & Move-Up: Credit Check Before Major Moves — Review scores and reports before listing or buying — small fixes can make a big difference.",
    "Equity & Move-Up: Total Cost of Moving Up — Factor in monthly payment, taxes, insurance, maintenance, and commute — not just the purchase price.",
    "Equity & Move-Up: Lifestyle vs Payment Math — A bigger home means higher utilities and upkeep — make sure the whole budget fits, not just the mortgage.",

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
    "Smart Ownership: Review Insurance Deductibles Annually — A higher deductible can lower premiums if your emergency fund can cover it.",
    "Home Maintenance & Care: Test Backup Sump Pump Battery — Make sure it works when power goes out during heavy Midwest storms.",
    "Smart Money Moves: Over 65 Circuit Breaker Credit — Protects qualifying seniors from large property tax increases in all four states.",
    "Home Maintenance & Care: Clean Pet Hair from Dryer Vent — Extra buildup from pets increases fire risk and drying time.",
    "Smart Money Moves: Use Cash-Back Credit Cards for Home Purchases — Earn rewards on tools, materials, and repairs.",
    "Home Maintenance & Care: Inspect Soffits and Fascia for Rot — Early detection prevents costly repairs to roofline.",
    "Smart Money Moves: Set Up Automatic Bill Pay for Utilities — Avoid late fees and keep your credit score strong.",
    "Home Maintenance & Care: Check for Bird Nests in Vents — Remove safely to maintain proper airflow and prevent fire hazards.",
    "Smart Money Moves: Review Credit Report Annually — Free once per year. Fix errors before your next purchase or sale.",
    "Home Maintenance & Care: Lubricate Garage Door Tracks and Rollers — Smooth operation prevents premature wear.",
    "Buyer Strategy: Get Pre-Approved Before Touring — Know your budget and show sellers you're serious in competitive markets.",
    "Home Maintenance & Care: Clean Window Tracks — Dirt and debris can cause windows to stick and let in drafts.",
    "Seller Prep: Declutter Before Photos — Less stuff on counters and floors makes rooms look larger in listing photos.",
    "Home Maintenance & Care: Inspect for Termite Activity — Look for mud tubes or discarded wings, especially in humid Midwest summers.",
    "Smart Money Moves: Build Equity Through Home Improvements — Kitchen and bath updates often give the best return on investment.",
    "Home Maintenance & Care: Check for Ice Dams on Roof After Heavy Snow — Remove safely or hire a pro to prevent water backup into attic.",
    "Open House Tip: Drive the Neighborhood First — Note curb appeal, noise, and commute feel — buyers decide emotionally before they walk in.",
    "Home Maintenance & Care: Clean Leaf Debris from Window Wells — Prevents water from entering basements during heavy rain.",
    "Move-Up Planning: Run a Net Sheet Early — Your agent can estimate proceeds and next-home costs before you commit to listing.",
    "Home Maintenance & Care: Inspect Downspout Extensions — Make sure they direct water away from the foundation.",
    "Smart Money Moves: Track Utility Usage Monthly — Spot unusual spikes early and address them before bills get out of hand.",
    "Home Maintenance & Care: Clean Refrigerator Door Gaskets — Dirty gaskets cause your fridge to work harder and raise energy bills.",
    "Smart Money Moves: Shop Homeowners Insurance Every 2-3 Years — Loyalty discounts fade. Switching can save 10-25%.",
    "Home Maintenance & Care: Check for Pest Entry Points — Seal gaps around pipes, vents, and doors.",
    "Smart Ownership: Compare HOA Fees Before You Buy — Monthly dues affect affordability as much as the mortgage payment.",
    "Home Maintenance & Care: Clean Bathroom Exhaust Fans — Dust and lint buildup reduces airflow. Clean quarterly.",
    "Staging ROI: Fresh Paint & Declutter — Often the highest-return prep before listing in Midwest markets.",
    "Home Maintenance & Care: Inspect Fence Posts for Rot — Replace or reinforce before they fail in storms.",
    "Renovation Tip: Get 3 Contractor Bids — Compare scope and timeline, not just price, before major projects.",
    "Home Maintenance & Care: Clean Microwave Vent Filter — Grease buildup reduces effectiveness and increases fire risk.",
    "Buyer Tip: Compare Total Closing Costs — Ask your agent and lender for a line-by-line estimate, not just the offer price.",
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
    "Smart Ownership: Update Beneficiaries After Closing — Make sure your home and family are protected on paper, not just in spirit.",
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
let usedFunFacts = JSON.parse(localStorage.getItem('usedFunFacts') || '[]');
let usedProTips = JSON.parse(localStorage.getItem('usedProTips') || '[]');
let usedQuotes = JSON.parse(localStorage.getItem('usedQuotes') || '[]');

// Reset functions
function resetUsed(category) {
    if (category === 'funFacts') {
        usedFunFacts = [];
        selectedFunFact = getRandomItem(funFacts, usedFunFacts);
    } else if (category === 'proTips') {
        usedProTips = [];
        selectedProTip = getRandomItem(proTips, usedProTips);
    } else if (category === 'quotes') {
        usedQuotes = [];
        selectedQuote = getRandomItem(motivationalQuotes, usedQuotes);
    } else if (window.NlEntertainment && typeof window.NlEntertainment.resetUsed === 'function') {
        window.NlEntertainment.resetUsed(category);
        return;
    }

    localStorage.setItem('used' + category.charAt(0).toUpperCase() + category.slice(1), JSON.stringify([]));

    updatePreviews();
    window.notifyUser(`"${category === 'funFacts' ? 'Fun Facts' : category === 'proTips' ? 'Pro Tips' : 'Motivational Quotes'}" tracking reset! Random selections refreshed.`, 'success', 3200);
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

// Update localStorage used arrays
localStorage.setItem('usedFunFacts', JSON.stringify(usedFunFacts));
localStorage.setItem('usedProTips', JSON.stringify(usedProTips));
localStorage.setItem('usedQuotes', JSON.stringify(usedQuotes));

// Update previews (safe version)
function updatePreviews() {
    const funFactEl = document.getElementById('fun-fact-preview');
    const proTipEl = document.getElementById('pro-tip-preview');
    const quoteEl = document.getElementById('quote-preview');

    if (funFactEl) funFactEl.innerText = selectedFunFact || 'No fun fact selected';
    if (proTipEl) proTipEl.innerText = selectedProTip || 'No pro tip selected';
    if (quoteEl) quoteEl.innerText = selectedQuote || 'No quote selected';
    if (window.NlEntertainment && typeof window.NlEntertainment.updatePreviews === 'function') {
        window.NlEntertainment.updatePreviews();
    }
    try {
        updatePersonalCharMeter();
        updatePersonalMediaPreviews();
        updateNewsletterPreflightSummary();
        updateSpecificTopicsPlaceholder();
        updateCustomContentChoicesVisibility();
    } catch (e) {}
}

// Regenerate random for a category
function regenerateRandom(category) {
    if (category === 'funFact') selectedFunFact = getRandomItem(funFacts, usedFunFacts);
    else if (category === 'proTip') selectedProTip = getRandomItem(proTips, usedProTips);
    else if (category === 'quote') selectedQuote = getRandomItem(motivationalQuotes, usedQuotes);
    else if (window.NlEntertainment && typeof window.NlEntertainment.regenerateRandom === 'function') {
        window.NlEntertainment.regenerateRandom(category);
        return;
    }

    localStorage.setItem('usedFunFacts', JSON.stringify(usedFunFacts));
    localStorage.setItem('usedProTips', JSON.stringify(usedProTips));
    localStorage.setItem('usedQuotes', JSON.stringify(usedQuotes));

    updatePreviews();
}

const NL_CHOICE_MODAL_ID = 'newsletter-choice-modal';

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

function getNewsletterChoiceModal() {
    return document.getElementById(NL_CHOICE_MODAL_ID);
}

function openModal(category) {
    if (category === 'dadJoke' || category === 'puzzle') {
        if (window.NlEntertainment && typeof window.NlEntertainment.openChoiceModal === 'function') {
            window.NlEntertainment.openChoiceModal(category, {
                ensureModal: getNewsletterChoiceModal,
                getTitleEl: (m) => m && m.querySelector('#modal-title'),
                getListEl: (m) => m && m.querySelector('#modal-list'),
                showModal: (m) => {
                    if (typeof window.openNamedModal === 'function') window.openNamedModal(m);
                    else if (typeof window.openAppModal === 'function') window.openAppModal(m);
                    else {
                        m.classList.remove('hidden');
                        m.classList.add('flex');
                        m.style.display = 'flex';
                        document.body.classList.add('modal-open');
                    }
                    m.style.alignItems = 'center';
                    m.style.justifyContent = 'center';
                },
                hideModal: () => closeModal()
            });
        }
        return;
    }

    const modal = getNewsletterChoiceModal();
    if (!modal) return;

    const title = modal.querySelector('#modal-title');
    const list = modal.querySelector('#modal-list');

    let data = [];
    let modalTitleText = '';

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

    if (typeof window.openNamedModal === 'function') {
        window.openNamedModal(modal);
    } else {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.style.display = 'flex';
        modal.style.pointerEvents = 'auto';
        document.body.classList.add('modal-open');
    }
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    // Force title into the header (gradient bar) — use textContent + color guard for reliability
    if (title) {
        title.textContent = modalTitleText;
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

        // Quick "Pick Random" at top for convenience
        const randomLi = document.createElement('li');
        randomLi.className = 'p-4 mb-2 bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-2xl cursor-pointer hover:bg-[#00A89D]/20 transition-all text-[#00A89D] font-semibold flex items-center gap-3';
        randomLi.innerHTML = `<i class="fas fa-dice"></i> <span>Pick a Random ${modalTitleText.replace('Choose a ', '')} for me</span>`;
        randomLi.addEventListener('click', () => {
            if (!data.length) return;
            const randomItem = data[Math.floor(Math.random() * data.length)];
            if (category === 'funFact') selectedFunFact = randomItem;
            else if (category === 'proTip') selectedProTip = randomItem;
            else if (category === 'quote') selectedQuote = randomItem;
            updatePreviews();
            closeModal();
            if (search) search.value = '';
        });
        list.appendChild(randomLi);

        // Current selected for context
        let currentSelected = '';
        if (category === 'funFact') currentSelected = selectedFunFact;
        else if (category === 'proTip') currentSelected = selectedProTip;
        else if (category === 'quote') currentSelected = selectedQuote;

        data.forEach(item => {
            const li = document.createElement('li');
            const isCurrent = item === currentSelected;
            li.className = `p-4 bg-white dark:bg-gray-800 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-gray-900 dark:text-gray-100 text-base border ${isCurrent ? 'border-[#00A89D] ring-1 ring-[#00A89D]/30' : 'border-gray-200 dark:border-gray-700 hover:border-[#00A89D]'} flex items-start gap-3`;
            li.innerHTML = `<i class="fas fa-quote-left text-[#00A89D] mt-0.5 flex-shrink-0"></i> <span class="flex-1">${item}</span> ${isCurrent ? '<span class="text-[10px] px-2 py-0.5 bg-[#00A89D]/10 text-[#00A89D] rounded-full self-start">current</span>' : ''}`;

            li.addEventListener('click', () => {
                if (category === 'funFact') selectedFunFact = item;
                else if (category === 'proTip') selectedProTip = item;
                else if (category === 'quote') selectedQuote = item;
                updatePreviews();
                closeModal();
                if (search) search.value = '';
            });

            list.appendChild(li);
        });
    }

    if (search) {
        search.placeholder = `Search ${modalTitleText.toLowerCase().replace('choose a ', '')}...`;
        search.oninput = () => {
            const filter = search.value.toLowerCase();
            Array.from(list.children).forEach((li, idx) => {
                // keep the random pick always visible at top
                if (idx === 0) return;
                li.style.display = li.innerText.toLowerCase().includes(filter) ? '' : 'none';
            });
        };
        search.focus();
    }

    // === PREMIUM OPEN + CLICK ANYWHERE OUTSIDE TO CLOSE ===
    modal.onclick = function(e) {
        if (e.target === modal) closeModal();   // clicks on dark backdrop close it
    };
}

// Close newsletter choice modal (separate from social pillar #content-modal)
function closeModal() {
    const modal = getNewsletterChoiceModal();
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('flex');
        modal.classList.add('hidden');
        modal.onclick = null;
    }
    const search = document.getElementById('modal-search');
    if (search && search.parentElement) {
        search.parentElement.removeChild(search);
    }
}

// Close on Esc key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

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
                "Behind-the-scenes of my morning coffee run before showings ☕",
                "Weekend family hike in Indiana — who else loves getting outdoors?",
                "My favorite hobby right now: [golf/poker/cooking] — what’s yours?",
                "Quick kitchen hack I used this week (recipe in comments)",
                "Throwback to my very first closing — 5 years ago today!",
                "Pet photo Friday! Meet my dog [name] 🐶",
                "What I’m grateful for this week as an agent",
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
            title = 'Educational Home Tips';
            content = [
                "What to know before your first showing appointment",
                "How to win in a multiple-offer situation without overpaying",
                "First-time buyer checklist (free download link)",
                "Staging basics that help homes sell faster",
                "What escrow really is and why it matters",
                "Closing costs explained with real numbers",
                "How to get pre-approved before you start touring",
                "Inspection red flags every buyer should know",
                "Seller net sheet basics — what sellers actually walk away with",
                "Open house etiquette for serious buyers",
                "How long the average home search takes in [city]",
                "Rent vs buy — when ownership actually makes sense"
            ];
            break;

        case 'Client Wins':
            emoji = '🎉';
            title = 'Client Success Stories';
            content = [
                "Just helped the Smith family buy their first home in [city]!",
                "Helped sellers in [neighborhood] close $15k over asking",
                "First-time buyers beat 4 other offers with a strong strategy",
                "Past clients referred their neighbors — now under contract!",
                "Client testimonial: “Best decision we ever made!”",
                "Another happy family got their keys this week 🗝️",
                "Helped a young couple find the perfect starter home",
                "Relocated family found their dream home in 3 weeks",
                "Seller closed in 9 days with multiple offers",
                "Helped buyers navigate a tough inspection and still close",
                "Helped a family move closer to grandparents",
                "Sphere referral turned into a listing + buyer win"
            ];
            break;

        case 'Value':
            emoji = '📋';
            title = 'Free Value Resources';
            content = [
                "Free Homebuyer Checklist (download link)",
                "2026 Local Market Snapshot Guide",
                "Seller Prep Checklist — get top dollar",
                "Closing Cost Overview (buyer & seller)",
                "First-Time Buyer Webinar Replay",
                "Home Maintenance Calendar (printable)",
                "Moving Checklist for new homeowners",
                "Questions to Ask Before You List",
                "Open House Follow-Up Script",
                "Local Vendor List (painters, inspectors, movers)",
                "Neighborhood Comparison Worksheet",
                "Down Payment & Closing Cost Planning Guide"
            ];
            break;

        case 'Engagement':
            emoji = '🔥';
            title = 'Engagement & Poll Ideas';
            content = [
                "Poll: Renting or Buying in 2026?",
                "Would you rather: Bigger yard or shorter commute?",
                "Tag a friend who needs a great local agent!",
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
            window.notifyUser(`✅ Great choice!\n\n"${item}"\n\nCopy and paste this into your next post!`, 'success', 3200);
            closeModal();
        };
        list.appendChild(li);
    });

    if (typeof window.openNamedModal === 'function') {
        window.openNamedModal(modal);
    } else {
        modal.style.display = 'flex';
        modal.style.pointerEvents = 'auto';
        document.body.classList.add('modal-open');
    }
}

// Legacy alias — newsletter choice modal only (social pillars use social-modals.js)
function closeNewsletterModalLegacy() {
    closeModal();
}

// Close on Esc key (idempotent)
if (!window._nlEscListener) {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
  window._nlEscListener = true;
}

// === PERSISTENCE SETUP (edition-specific only — branding/contact from profile) ===
const persistentFields = [
    'nl-audience', 'nl-tone', 'nl-title', 'nl-length',
    'nl-blog-url', 'nl-blog-title',
    'nl-include-blog',
    'nl-include-referral',
    'nl-personal-photo',
    'nl-personal-video',
    'nl-personal-photo-size',
    'nl-personal-video-size'
];

const SOCIAL_LINK_CONFIG = [
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'tiktok', label: 'TikTok' },
    { key: 'youtube', label: 'YouTube' },
    { key: 'x', label: 'X' }
];

function escBrandingAttr(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escBrandingText(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getNewsletterProfileContext() {
    const profile = (typeof window.getUserProfile === 'function') ? window.getUserProfile() : {};
    const social = profile.socialLinks || {};
    return {
        name: (profile.name || '').trim(),
        email: (profile.email || profile.workEmail || '').trim(),
        location: (profile.location || profile.localArea || profile.market || '').trim(),
        company: (profile.companyName || '').trim(),
        tagline: (profile.tagline || '').trim(),
        phone: (profile.phone || '').trim(),
        logoUrl: (profile.logoUrl || '').trim(),
        headshotUrl: (profile.headshotUrl || '').trim(),
        social,
        socialCount: SOCIAL_LINK_CONFIG.filter((s) => social[s.key] && String(social[s.key]).trim()).length
    };
}

function getNewsletterLocation() {
    const ctx = getNewsletterProfileContext();
    return ctx.location || 'your local market';
}

function getAgentBrandingContext() {
    const ctx = getNewsletterProfileContext();
    const includeSignature = document.getElementById('nl-include-signature')?.checked !== false;
    const includeSocial = document.getElementById('nl-include-social')?.checked !== false;

    return {
        includeSignature,
        includeSocial,
        name: ctx.name,
        email: ctx.email,
        company: ctx.company,
        tagline: ctx.tagline,
        phone: ctx.phone,
        logoUrl: ctx.logoUrl,
        headshotUrl: ctx.headshotUrl,
        social: ctx.social
    };
}

function buildSocialLinksHtml(social) {
    const links = SOCIAL_LINK_CONFIG
        .filter((s) => social[s.key] && String(social[s.key]).trim())
        .map((s) => {
            const url = String(social[s.key]).trim();
            return `<a href="${escBrandingAttr(url)}" style="color:#00A89D;text-decoration:underline;margin:0 10px;font-size:12px;font-weight:600;" target="_blank" rel="noopener">${escBrandingText(s.label)}</a>`;
        });
    if (!links.length) return '';
    return `<div style="text-align:center;padding:10px 0 4px;border-top:1px solid #e5e5e5;margin-top:12px;">${links.join('')}</div>`;
}

function wrapBrandingForEmail(innerTableHtml) {
    return `<table width="600" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto;max-width:600px;width:100%;">
  <tr><td align="center" style="padding:0;">
${innerTableHtml}
  </td></tr>
</table>`;
}

function buildAgentBrandHeader(ctx) {
    if (!ctx.includeSignature) return '';
    if (!ctx.logoUrl && !ctx.company && !ctx.tagline) return '';

    const logoHtml = ctx.logoUrl
        ? `<table align="center" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 12px;">
  <tr>
    <td align="center" style="padding:12px 20px;background:#ffffff;border:1px solid #e5e5e5;border-radius:8px;">
      <img src="${escBrandingAttr(ctx.logoUrl)}" alt="Logo" width="200" style="max-height:56px;max-width:200px;width:auto;height:auto;display:block;border:0;">
    </td>
  </tr>
</table>`
        : '';

    const inner = `<table width="600" cellpadding="0" cellspacing="0" style="background:#f9f9f9;max-width:600px;width:100%;">
  <tr>
    <td style="padding:20px 24px 16px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
      ${logoHtml}
      ${ctx.company ? `<div style="font-size:20px;font-weight:700;letter-spacing:0.3px;color:#002B5C;line-height:1.3;">${escBrandingText(ctx.company)}</div>` : ''}
      ${ctx.tagline ? `<div style="font-size:13px;margin-top:6px;color:#555;line-height:1.4;">${escBrandingText(ctx.tagline)}</div>` : ''}
    </td>
  </tr>
  <tr>
    <td height="4" bgcolor="#00A89D" style="background:#00A89D;font-size:0;line-height:0;">&nbsp;</td>
  </tr>
</table>`;
    return wrapBrandingForEmail(inner);
}

function buildAgentSignatureFooter(ctx) {
    if (!ctx.includeSignature && !ctx.includeSocial) return '';

    const hasSignatureContent = ctx.includeSignature && (
        ctx.headshotUrl || ctx.name || ctx.company || ctx.phone || ctx.email || ctx.logoUrl
    );
    const socialHtml = ctx.includeSocial ? buildSocialLinksHtml(ctx.social) : '';

    if (!hasSignatureContent && !socialHtml) return '';

    let inner = '';

    if (hasSignatureContent) {
        inner += '<table width="100%" cellpadding="0" cellspacing="0"><tr>';
        if (ctx.headshotUrl) {
            inner += `<td width="96" valign="top" style="padding-right:18px;">
              <img src="${escBrandingAttr(ctx.headshotUrl)}" alt="${escBrandingAttr(ctx.name || 'Agent')}" width="80" height="80" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid #00A89D;display:block;">
            </td>`;
        }
        inner += '<td valign="top" style="font-family:Arial,sans-serif;">';
        if (ctx.name) inner += `<div style="font-size:17px;font-weight:bold;color:#002B5C;margin-bottom:4px;">${escBrandingText(ctx.name)}</div>`;
        if (ctx.company) inner += `<div style="font-size:13px;color:#444;margin-bottom:2px;">${escBrandingText(ctx.company)}</div>`;
        if (ctx.tagline) inner += `<div style="font-size:12px;color:#666;font-style:italic;margin-bottom:8px;">${escBrandingText(ctx.tagline)}</div>`;
        const contact = [];
        if (ctx.phone) contact.push(escBrandingText(ctx.phone));
        if (ctx.email) {
            contact.push(`<a href="mailto:${escBrandingAttr(ctx.email)}" style="color:#00A89D;text-decoration:underline;">${escBrandingText(ctx.email)}</a>`);
        }
        if (contact.length) {
            inner += `<div style="font-size:12px;color:#555;margin-top:6px;">${contact.join(' &nbsp;|&nbsp; ')}</div>`;
        }
        if (ctx.logoUrl && ctx.headshotUrl) {
            inner += `<img src="${escBrandingAttr(ctx.logoUrl)}" alt="Logo" style="max-height:36px;margin-top:12px;border:0;display:block;">`;
        }
        inner += '</td></tr></table>';
    }

    inner += socialHtml;

    const innerTable = `<table width="600" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-top:3px solid #00A89D;margin-top:8px;max-width:600px;width:100%;">
  <tr>
    <td style="padding:24px 28px;font-family:Arial,sans-serif;">
      ${inner}
    </td>
  </tr>
</table>`;
    return wrapBrandingForEmail(innerTable);
}

const NL_DISCLAIMER_ROW_RE = /<tr>\s*<td[^>]*(?:background|bgcolor)[^>]*#002B5C[^>]*>[\s\S]*?<\/td>\s*<\/tr>\s*(?:<tr>\s*<td[^>]*height=["']?20["']?[^>]*>\s*<\/td>\s*<\/tr>\s*)?/gi;

function buildDefaultNewsletterDisclaimerHtml() {
    const ctx = getNewsletterProfileContext();
    const byline = ctx.company || ctx.name || 'Your real estate professional';
    const inner = `<table width="600" cellpadding="0" cellspacing="0" style="background:#002B5C;max-width:600px;width:100%;">
  <tr>
    <td style="padding:16px 24px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:1.55;color:#ffffff;">
      <p style="margin:0;">This newsletter is for general informational purposes only and is not legal, financial, or tax advice. Market conditions vary by area and change over time. ${escBrandingText(byline)}. Equal Housing Opportunity.</p>
    </td>
  </tr>
</table>`;
    return wrapBrandingForEmail(inner);
}

function detachNewsletterDisclaimer(html) {
    let out = String(html || '');
    let disclaimer = '';
    const matches = [...out.matchAll(NL_DISCLAIMER_ROW_RE)];
    if (matches.length) {
        const last = matches[matches.length - 1][0];
        const inner = `<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">${last}</table>`;
        disclaimer = wrapBrandingForEmail(inner);
        out = out.replace(last, '');
    } else {
        disclaimer = buildDefaultNewsletterDisclaimerHtml();
    }
    out = out.replace(/<!--\s*BRAIN_TEASER_ANSWER_PLACEHOLDER\s*-->/gi, '');
    return { html: out, disclaimer };
}

function injectAgentBranding(html) {
    const ctx = getAgentBrandingContext();
    const selections = getNewsletterSelections();
    const firstName = (ctx.name || '').split(' ')[0].trim() || 'Your Agent';
    const detached = detachNewsletterDisclaimer(html);
    html = detached.html;
    const disclaimer = detached.disclaimer || buildDefaultNewsletterDisclaimerHtml();
    const header = buildAgentBrandHeader(ctx);
    const footer = buildAgentSignatureFooter(ctx);
    const referral = selections.includeReferral && ctx.email
        ? buildCompactReferralHtml(firstName, ctx.email)
        : '';

    if (header) {
        if (/<body[^>]*>/i.test(html)) {
            html = html.replace(/<body[^>]*>/i, '$&' + header);
        } else {
            html = header + html;
        }
    }

    const tail = footer + referral + disclaimer;
    if (tail) {
        if (/<\/body>\s*<\/html>/i.test(html)) {
            html = html.replace(/<\/body>\s*<\/html>/i, tail + '</body></html>');
        } else {
            html += tail;
        }
    }

    return html;
}

function buildProfileSummaryLine(ctx) {
    const parts = [ctx.name, ctx.location, ctx.company].filter(Boolean);
    if (parts.length) return parts.join(' · ');
    if (ctx.email) return ctx.email;
    return 'Set up My Profile for name, market & branding';
}

function updateNewsletterProfileStatus() {
    const ctx = getNewsletterProfileContext();
    const summaryEl = document.getElementById('nl-profile-status-summary');
    const warnEl = document.getElementById('nl-profile-status-warning');
    const warnTextEl = document.getElementById('nl-profile-status-warning-text');
    const badgeEl = document.getElementById('nl-profile-status-badge');

    const missing = [];
    if (!ctx.name) missing.push('name');
    if (!ctx.email) missing.push('email');

    if (summaryEl) {
        summaryEl.textContent = buildProfileSummaryLine(ctx);
        summaryEl.title = [
            ctx.name && `Name: ${ctx.name}`,
            ctx.email && `Email: ${ctx.email}`,
            ctx.location && `Market: ${ctx.location}`,
            ctx.company && `Team: ${ctx.company}`
        ].filter(Boolean).join(' · ');
    }

    const ready = !missing.length;
    if (warnEl) warnEl.classList.toggle('hidden', ready);
    if (warnTextEl && !ready) {
        const labels = { name: 'name', email: 'email' };
        warnTextEl.textContent = `Add ${missing.map((k) => labels[k] || k).join(' & ')} in Profile before generating.`;
    }
    if (badgeEl) {
        badgeEl.textContent = ready ? 'Ready' : 'Setup';
        badgeEl.className = ready
            ? 'text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-[#00A89D]/15 text-[#00A89D] flex-shrink-0'
            : 'text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 flex-shrink-0';
    }
}

function updateBrandPreview() {
    /* Branding preview removed — profile strip shows one-line summary */
}

// === GLOBAL EMAIL / CRM SETTINGS ===
const EMAIL_WIDTH = 600;
const BODY_PADDING = 90;        // left + right padding for centering
const MODULE_PADDING = 20;      // consistent spacing between modules
const HEADER_HEIGHT = 60;       // recommended for headers (used if needed)

// === NEWSLETTER UI PARITY (LO) — photo/video sizing, char meter, preflight ===
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
        sectionDepth: 'Keep each included section to 2–4 tight paragraphs or bullet clusters.',
        personalNote: 'Personal update: 3–5 sentences max unless the user wrote more.',
        overall: 'Quick, mobile-friendly read. Do not pad with filler.'
    },
    medium: {
        preflightLabel: 'Standard edition',
        displayLabel: 'Standard (~650–750 words)',
        wordRange: '650–750 words total',
        sectionDepth: 'Each included section: 3–5 paragraphs with one clear takeaway.',
        personalNote: 'Personal update: 4–7 sentences — warm but concise.',
        overall: 'Default monthly newsletter depth.'
    },
    long: {
        preflightLabel: 'Long edition',
        displayLabel: 'Long (~800–1,000+ words)',
        wordRange: '800–1,000+ words total',
        sectionDepth: 'Each included section: fuller context, 4–6 paragraphs.',
        personalNote: 'Personal update: can run longer if the user provided rich detail.',
        overall: 'Deep-dive edition — still scannable with headers.'
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
        '**LENGTH RULE (user selected ' + cfg.displayLabel + '):**',
        '- Target total newsletter body: ' + cfg.wordRange,
        '- Section depth: ' + cfg.sectionDepth,
        '- ' + cfg.personalNote,
        '- ' + cfg.overall
    ];
}

function getPersonalPhotoWidthPercent() {
    const el = document.getElementById('nl-personal-photo-size');
    const raw = el ? parseInt(el.value, 10) : NL_PHOTO_SIZE_DEFAULT;
    if (Number.isNaN(raw)) return NL_PHOTO_SIZE_DEFAULT;
    return Math.min(NL_PHOTO_SIZE_MAX, Math.max(NL_PHOTO_SIZE_MIN, raw));
}

function getPersonalPhotoWidthPx() {
    return Math.round(EMAIL_WIDTH * getPersonalPhotoWidthPercent() / 100);
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
    return `<p style="margin:16px 0 0; text-align:center;"><img src="${safeUrl}" alt="Personal photo" width="${px}" style="display:block; margin:0 auto; max-width:100%; width:${px}px; height:auto; border:0; border-radius:8px;" /></p>`;
}

function updatePersonalPhotoSizeUI() {
    const sizeWrap = document.getElementById('nl-personal-photo-size-wrap');
    const labelEl = document.getElementById('nl-personal-photo-size-label');
    const photoEnabled = !!document.getElementById('nl-include-photo')?.checked && !!document.getElementById('nl-personal')?.checked;
    if (sizeWrap) sizeWrap.classList.toggle('hidden', !photoEnabled);
    if (labelEl) labelEl.textContent = formatPersonalPhotoSizeLabel();
}

function applyPersonalPhotoPreviewSizing() {
    const photoImg = document.getElementById('nl-personal-photo-preview-img');
    if (!photoImg) return;
    const pct = getPersonalPhotoWidthPercent();
    photoImg.style.width = `${pct}%`;
    photoImg.style.maxWidth = 'none';
    photoImg.style.height = 'auto';
}

function getPersonalVideoWidthPercent() {
    const el = document.getElementById('nl-personal-video-size');
    const raw = el ? parseInt(el.value, 10) : NL_MEDIA_SIZE_DEFAULT;
    if (Number.isNaN(raw)) return NL_MEDIA_SIZE_DEFAULT;
    return Math.min(NL_MEDIA_SIZE_MAX, Math.max(NL_MEDIA_SIZE_MIN, raw));
}

function getPersonalVideoWidthPx() {
    return Math.round(EMAIL_WIDTH * getPersonalVideoWidthPercent() / 100);
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
    if (!videoThumb) return;
    const pct = getPersonalVideoWidthPercent();
    videoThumb.style.width = `${pct}%`;
    videoThumb.style.maxWidth = 'none';
    videoThumb.style.height = 'auto';
}

const NL_CONTENT_SECTIONS = {
    market: { id: 'nl-market', label: 'Market Updates', headings: ['Market Update', 'Market Updates'] },
    industry: { id: 'nl-industry', label: 'Industry News', headings: ['Industry News', 'Industry Update'] },
    local: { id: 'nl-local', label: 'Local Update', headings: ['Local Update', 'Local Spotlight', 'Around Town'] },
    recipes: { id: 'nl-recipes', label: 'Recipes', headings: ['Recipe', 'Recipes'] },
    fun: { id: 'nl-fun', label: 'Fun Facts', headings: ['Fun Fact', 'Fun Facts'], placeholderId: 'fun-fact-placeholder' },
    tip: { id: 'nl-tip', label: 'Real Estate Tip', headings: ['Pro Tip', 'Real Estate Tip', 'Tip of the Month'], placeholderId: 'pro-tip-placeholder' },
    quote: { id: 'nl-quote', label: 'Motivational Quote', headings: ['Motivational Quote', 'Quote of the Month'], placeholderId: 'quote-placeholder' },
    dadjoke: { id: 'nl-dadjoke', label: 'Dad Joke', headings: ['Dad Joke', 'Dad Joke of the Week'], placeholderId: 'dad-joke-placeholder' },
    puzzle: { id: 'nl-puzzle', label: 'Weekly Brain Teaser', headings: ['Trivia Time', 'Weekly Brain Teaser', 'Brain Teaser'], placeholderId: 'brain-teaser-placeholder' }
};

const NL_CUSTOM_CONTENT_BLOCKS = {
    fun: { checkboxId: 'nl-fun', blockId: 'nl-custom-section-fun', shortLabel: 'Fun Facts' },
    tip: { checkboxId: 'nl-tip', blockId: 'nl-custom-section-tip', shortLabel: 'Pro Tip' },
    quote: { checkboxId: 'nl-quote', blockId: 'nl-custom-section-quote', shortLabel: 'Quote' },
    dadjoke: { checkboxId: 'nl-dadjoke', blockId: 'nl-custom-section-dadjoke', shortLabel: 'Dad Joke' },
    puzzle: { checkboxId: 'nl-puzzle', blockId: 'brain-teaser-panel', shortLabel: 'Brain Teaser' }
};

const NL_SPECIFIC_SECTION_HINTS = [
    { id: 'nl-market', label: 'Market Updates', example: 'Q1 inventory up 12% in Fort Wayne — or Market Updates: https://…' },
    { id: 'nl-industry', label: 'Industry News', example: 'NAR membership trends — or Industry: https://…' },
    { id: 'nl-local', label: 'Local Update', example: 'Komets playoff Sat 3/15 — or Local: https://…' },
    { id: 'nl-recipes', label: 'Recipes', example: 'mulled wine recipe — or Recipes: https://…' }
];

function updateSpecificTopicsPlaceholder() {
    const ta = document.getElementById('nl-specific');
    const hintEl = document.getElementById('nl-specific-hint');
    if (!ta) return;

    const active = NL_SPECIFIC_SECTION_HINTS.filter((h) => document.getElementById(h.id)?.checked);
    const langNote = 'Language requests work too (e.g. "Prepare the full newsletter in Spanish").';

    let placeholder;
    if (!active.length) {
        placeholder = `Give specific direction for any sections you check — stats, headlines, or article URLs (e.g. Market Updates: https://…). ${langNote}`;
    } else if (active.length === 1) {
        placeholder = `e.g., ${active[0].label}: ${active[0].example}. ${langNote}`;
    } else {
        const parts = active.slice(0, 3).map((h) => `${h.label}: ${h.example}`);
        const suffix = active.length > 3 ? '; …' : '';
        placeholder = `e.g., ${parts.join('; ')}${suffix}. ${langNote}`;
    }

    ta.placeholder = placeholder;

    if (hintEl) {
        const urlNote = 'Article URLs you paste here will be cited and linked in the matching section.';
        hintEl.textContent = !active.length
            ? `Give very specific direction for the sections you checked — exact names, dates, stats, headlines, or article URLs. ${urlNote}`
            : `Tailored to your ${active.length} checked section${active.length === 1 ? '' : 's'}: ${active.map((h) => h.label).join(', ')}. ${urlNote}`;
    }
}

function scrollToNewsletterCustomContent(sectionKey) {
    const details = document.getElementById('nl-custom-content-details');
    if (details) details.open = true;
    updateCustomContentChoicesVisibility();

    let targetId = null;
    if (sectionKey && NL_CUSTOM_CONTENT_BLOCKS[sectionKey]) {
        const cfg = NL_CUSTOM_CONTENT_BLOCKS[sectionKey];
        const cb = document.getElementById(cfg.checkboxId);
        if (cb?.checked) targetId = cfg.blockId;
    }
    if (!targetId) {
        for (const cfg of Object.values(NL_CUSTOM_CONTENT_BLOCKS)) {
            const cb = document.getElementById(cfg.checkboxId);
            if (cb?.checked) {
                targetId = cfg.blockId;
                break;
            }
        }
    }

    if (!targetId) {
        if (window.showToast) window.showToast('Check Fun Facts, Pro Tip, Quote, Dad Joke, or Brain Teaser first.', 'info');
        else window.notifyUser('Check Fun Facts, Pro Tip, Quote, Dad Joke, or Brain Teaser in Sections to Include first.', 'warning', 3200);
        return;
    }

    const el = document.getElementById(targetId);
    if (!el) return;

    window.setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.add('ring-2', 'ring-[#00A89D]', 'ring-offset-2', 'rounded-2xl');
        window.setTimeout(() => {
            el.classList.remove('ring-2', 'ring-[#00A89D]', 'ring-offset-2', 'rounded-2xl');
        }, 2200);
    }, 120);
}

function wireCustomContentJumpControls() {
    const sectionsCard = document.getElementById('nl-sections-card');
    if (sectionsCard && !sectionsCard._nlInlineCustomizeWired) {
        sectionsCard._nlInlineCustomizeWired = true;
        sectionsCard.addEventListener('click', (e) => {
            const btn = e.target.closest('.nl-inline-customize-btn');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            scrollToNewsletterCustomContent(btn.getAttribute('data-nl-jump-custom'));
        });
    }
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
        out = out.replace(/<!--\s*PERSONAL VIDEO PLACEHOLDER\s*-->/gi, '');
    }

    if (!selections.includeReferral) {
        out = stripReferralFromBody(out);
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
        '- If Industry News is EXCLUDED, do not mention industry headlines, NAR/regulatory updates, or brokerage news.',
        '- If Local Update is EXCLUDED, do not include local spotlight/community content.',
        '- If Recipes is EXCLUDED, do not include any recipe or food content.',
    ];

    if (selections.contentSections.fun) {
        lines.push('- Fun Facts (INCLUDE): output ONLY <h2>Fun Fact</h2> and empty <p id="fun-fact-placeholder"></p> — we inject the fact later.');
    } else {
        lines.push('- Fun Facts (EXCLUDE): do not include Fun Fact heading, text, or fun-fact-placeholder.');
    }
    if (selections.contentSections.tip) {
        lines.push('- Real Estate Tip (INCLUDE): output ONLY <h2>Pro Tip</h2> or <h2>Real Estate Tip</h2> and empty <p id="pro-tip-placeholder"></p> — we inject the tip later.');
    } else {
        lines.push('- Real Estate Tip (EXCLUDE): do not include tip heading, text, or pro-tip-placeholder.');
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
        lines.push('- Personal Update (INCLUDE): include the Personal Note section titled "A Note From [First Name]" using ONLY the personal update text the user typed — polish grammar and warmth, but do NOT add hobbies, goals, or life details from profile.');
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
        lines.push('- Blog link (INCLUDE): leave <!-- BLOG SECTION PLACEHOLDER --> untouched — we inject the blog card in post-processing if URL provided. The blog MUST appear AFTER all main content sections and IMMEDIATELY BEFORE the Personal Note.');
    } else {
        lines.push('- Blog (EXCLUDE): do NOT create any blog section. Remove <!-- BLOG SECTION PLACEHOLDER -->.');
    }

    if (selections.includeReferral) {
        lines.push('- Referral CTA (INCLUDE): Do NOT place referral content in the newsletter body. We add a compact referral block below the agent email signature in post-processing. Do NOT add referral headings, buttons, or "Know Someone" asks in the main letter.');
    } else {
        lines.push('- Referral CTA (EXCLUDE): do NOT include any referral ask, "Know Someone" heading, referral button, or [REFERRAL CTA PLACEHOLDER]. End with personal note / video / blog then go straight to the footer disclaimer.');
    }

    return lines.join('\n');
}

function updateCustomContentChoicesVisibility() {
    const activeLabels = [];
    Object.entries(NL_CUSTOM_CONTENT_BLOCKS).forEach(([key, cfg]) => {
        const cb = document.getElementById(cfg.checkboxId);
        const block = cfg.blockId ? document.getElementById(cfg.blockId) : null;
        const show = !!cb?.checked;
        if (block) block.classList.toggle('hidden', !show);
        const inlineBtn = document.querySelector(`.nl-inline-customize-btn[data-nl-jump-custom="${key}"]`);
        if (inlineBtn) inlineBtn.classList.toggle('hidden', !show);
        if (show) activeLabels.push(cfg.shortLabel);
    });

    const anyVisible = activeLabels.length > 0;
    const emptyEl = document.getElementById('nl-custom-content-empty');
    const bodyEl = document.getElementById('nl-custom-content-body');
    const footerEl = document.getElementById('nl-custom-content-footer');
    const introEl = document.getElementById('nl-custom-content-intro');
    const summaryEl = document.getElementById('nl-custom-content-summary');
    const countEl = document.getElementById('nl-custom-content-count');
    const detailsEl = document.getElementById('nl-custom-content-details');

    if (emptyEl) emptyEl.classList.toggle('hidden', anyVisible);
    if (bodyEl) bodyEl.classList.toggle('hidden', !anyVisible);
    if (footerEl) footerEl.classList.toggle('hidden', !anyVisible);

    if (introEl) {
        introEl.innerHTML = anyVisible
            ? `Customize <strong>${activeLabels.join(', ')}</strong> — pick from the library, regenerate random, or write your own.`
            : '';
    }

    if (summaryEl) {
        summaryEl.textContent = anyVisible
            ? `Custom Content Choices (${activeLabels.join(', ')})`
            : 'Custom Content Choices';
    }

    if (countEl) {
        countEl.textContent = anyVisible ? `${activeLabels.length} active` : '';
        countEl.classList.toggle('hidden', !anyVisible);
    }

    if (detailsEl) {
        detailsEl.classList.toggle('hidden', !anyVisible);
        if (!anyVisible) detailsEl.open = false;
    }
}

function extractYouTubeVideoId(url) {
    if (!url) return '';
    const raw = String(url).trim();
    let id = '';
    try {
        const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
        const host = parsed.hostname.replace(/^www\./, '');
        if (host === 'youtu.be') id = parsed.pathname.split('/').filter(Boolean)[0] || '';
        else if (host.includes('youtube.com')) {
            if (parsed.pathname.includes('/shorts/')) id = parsed.pathname.split('/shorts/')[1]?.split('/')[0] || '';
            else if (parsed.pathname.includes('/embed/')) id = parsed.pathname.split('/embed/')[1]?.split('/')[0] || '';
            else id = parsed.searchParams.get('v') || '';
        }
    } catch (e) {
        if (raw.includes('youtu.be/')) id = raw.split('youtu.be/')[1]?.split(/[?&#]/)[0] || '';
        else if (raw.includes('shorts/')) id = raw.split('shorts/')[1]?.split(/[?&#]/)[0] || '';
        else if (raw.includes('v=')) id = raw.split('v=')[1]?.split(/[?&#]/)[0] || '';
    }
    id = (id || '').trim();
    return id.length === 11 ? id : '';
}

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
<table width="600" cellpadding="0" cellspacing="0" style="background:#f9f9f9; border-left:8px solid #00A89D; border-collapse:separate; max-width:600px;">
  <tr><td style="padding:24px;">
    <p style="margin:0 0 12px; font-size:17px; color:#002B5C; font-weight:700; text-align:center;">Personal Video Update</p>
    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:${videoWidthPx}px; margin:0 auto;">
      <tr><td align="center">
        <a href="${href}" target="_blank" rel="noopener" style="text-decoration:none;">
          <img src="${thumbnailUrl}" alt="Watch video" width="${videoWidthPx}" style="width:100%; max-width:${videoWidthPx}px; height:auto; display:block; border:3px solid #00A89D; border-radius:8px;">
        </a>
      </td></tr>
      <tr><td align="center" style="padding-top:14px;">
        <a href="${href}" target="_blank" rel="noopener" style="display:inline-block; padding:12px 28px; background:#00A89D; color:#fff; font-weight:bold; font-size:16px; text-decoration:none; border-radius:24px;">▶ Watch Video</a>
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

function wrapNewsletterSectionRows(innerHtml) {
    if (!innerHtml) return '';
    return `<tr><td height="20"></td></tr><tr><td align="center" style="padding:0;">${innerHtml}</td></tr><tr><td height="20"></td></tr>`;
}

function injectPersonalVideoSection(html, personalVideoUrl) {
    const videoSection = wrapNewsletterSectionRows(buildPersonalVideoTable(personalVideoUrl));
    let out = String(html || '').replace(/<tr>\s*<td[^>]*>[\s\S]*?Personal Video Update[\s\S]*?<\/table>\s*<\/td>\s*<\/tr>/gi, '');
    if (out.includes('<!-- PERSONAL VIDEO PLACEHOLDER -->')) {
        return out.replace('<!-- PERSONAL VIDEO PLACEHOLDER -->', videoSection);
    }
    const afterPersonal = /(<tr>\s*<td[^>]*>[\s\S]*?A Note From[\s\S]*?<\/table>\s*<\/td>\s*<\/tr>\s*<tr>\s*<td[^>]*height=["']?20["']?[^>]*>\s*<\/td>\s*<\/tr>)/i;
    if (afterPersonal.test(out)) return out.replace(afterPersonal, '$1' + videoSection);
    return out.replace(/(<tr>\s*<td[^>]*background:\s*#002B5C[^>]*>)/i, videoSection + '$1');
}

function stripReferralFromBody(html) {
    let out = String(html || '');
    const headlines = [REFERRAL_CTA_HEADLINE, LEGACY_REFERRAL_CTA_HEADLINE, 'Know Someone Ready to Buy or Refinance?'];
    headlines.forEach((h) => {
        const re = new RegExp('<tr>\\s*<td[^>]*>[\\s\\S]*?' + h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?<\\/table>\\s*<\\/td>\\s*<\\/tr>\\s*(?:<tr>\\s*<td[^>]*height=["\']?20["\']?[^>]*>\\s*<\\/td>\\s*<\\/tr>\\s*)?', 'gi');
        out = out.replace(re, '');
    });
    out = out.replace(/\[REFERRAL CTA PLACEHOLDER\]/gi, '');
    out = out.replace(/<!--\s*REFERRAL CTA PLACEHOLDER\s*-->/gi, '');
    return out;
}

function buildCompactReferralHtml(firstName, email) {
    const mailSubject = encodeURIComponent('Referral from a Friend — Real Estate Help!');
    const mailBody = encodeURIComponent(`Hi ${firstName},\n\nI'd like to refer someone who may need real estate help.\n\nName: \nPhone: \nEmail: \nThey're looking for: (buying / selling / both / not sure)\n\nThanks!\n`);
    const inner = `<table width="600" cellpadding="0" cellspacing="0" style="background:#fafafa;border-top:1px solid #e5e5e5;max-width:600px;width:100%;">
  <tr>
    <td style="padding:14px 24px 18px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
      <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#002B5C;letter-spacing:0.2px;">${REFERRAL_CTA_HEADLINE}</p>
      <p style="margin:0 0 12px;font-size:12px;line-height:1.45;color:#666;">Know someone buying or selling? Forward this email — or tap below.</p>
      <a href="mailto:${escBrandingAttr(email)}?subject=${mailSubject}&body=${mailBody}" style="display:inline-block;padding:9px 20px;background:#00A89D;color:#ffffff;font-size:13px;font-weight:bold;text-decoration:none;border-radius:20px;">Send a Referral</a>
    </td>
  </tr>
</table>`;
    return wrapBrandingForEmail(inner);
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
    if (!chip.removeId) return `<span class="${cls} pr-3">${chip.text}</span>`;
    const safeId = String(chip.removeId).replace(/"/g, '');
    return `<span class="${cls}"><span>${chip.text}</span><button type="button" class="${NL_PREFLIGHT_CHIP_REMOVE_BTN}" data-nl-preflight-remove="${safeId}" aria-label="Remove" title="Remove">×</button></span>`;
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
    return /\/(image|img|photo|media|upload|assets)\//i.test(u);
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
        if (ready) hintEl.innerHTML = '<span class="text-[#00A89D] font-semibold">✓ Good to go</span> — we polish your words, not invent them.';
        else if (len === 0) hintEl.textContent = `Write at least ${NL_PERSONAL_UPDATE_MIN_CHARS} characters with real details.`;
        else hintEl.textContent = `${remaining} more character${remaining === 1 ? '' : 's'} needed before Generate.`;
    }
}

function updatePersonalMediaPreviews() {
    updatePersonalPhotoSizeUI();
    updatePersonalVideoSizeUI();
    const photoEnabled = !!document.getElementById('nl-include-photo')?.checked && !!document.getElementById('nl-personal')?.checked;
    const videoEnabled = !!document.getElementById('nl-include-video')?.checked && !!document.getElementById('nl-personal')?.checked;
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
        } else {
            photoWrap.classList.remove('hidden');
            photoImg.onload = () => { applyPersonalPhotoPreviewSizing(); photoStatus.innerHTML = '<span class="text-[#00A89D] font-medium">✓ Image loaded</span>'; };
            photoImg.onerror = () => { photoStatus.innerHTML = '<span class="text-amber-700">⚠ Could not load — check URL</span>'; };
            applyPersonalPhotoPreviewSizing();
            photoImg.src = photoUrl;
        }
    }
    if (videoWrap && videoThumb && videoLink && videoStatus) {
        if (!videoEnabled || !videoUrl) {
            videoWrap.classList.add('hidden');
        } else {
            const href = videoUrl.startsWith('http') ? videoUrl : `https://${videoUrl}`;
            const videoId = extractYouTubeVideoId(href);
            videoWrap.classList.remove('hidden');
            videoLink.href = href;
            if (videoId) {
                videoThumb.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                videoStatus.innerHTML = '<span class="text-[#00A89D] font-medium">✓ YouTube thumbnail preview</span>';
            } else {
                videoThumb.src = 'https://via.placeholder.com/560x200/002B5C/FFFFFF?text=Video';
                videoStatus.innerHTML = '<span class="text-amber-700">⚠ Use a YouTube URL</span>';
            }
            applyPersonalVideoPreviewSizing();
        }
    }
}

function getNewsletterGeneratorRoot() {
    return document.getElementById('newsletter-generator');
}

function updateNewsletterPreflightSummary() {
    const root = getNewsletterGeneratorRoot();
    const chipsEl = root?.querySelector('#nl-preflight-chips');
    const warningsEl = root?.querySelector('#nl-preflight-warnings');
    const badgeEl = root?.querySelector('#nl-preflight-ready-badge');
    if (!chipsEl) return;
    const sel = getNewsletterSelections();
    const chips = [];
    const warnings = [];
    const profileCtx = getNewsletterProfileContext();
    const location = getNewsletterLocation();
    if (!profileCtx.name || !profileCtx.email) {
        warnings.push('Add name & email in Profile (see strip above).');
    }
    const toneLabel = document.getElementById('nl-tone')?.selectedOptions?.[0]?.textContent?.trim().replace(/\s*\(Recommended\)\s*/i, '') || '';
    const lengthLabel = getNewsletterLengthConfig().preflightLabel;
    if (location) chips.push({ text: `📍 ${location}`, style: 'meta' });
    if (toneLabel) chips.push({ text: toneLabel, style: 'meta' });
    chips.push({ text: lengthLabel, style: 'meta' });
    Object.entries(NL_CONTENT_SECTIONS).forEach(([key, cfg]) => {
        if (!sel.contentSections[key]) return;
        chips.push({ text: cfg.label, style: 'included', removeId: cfg.id });
    });
    if (sel.personal) {
        const len = document.getElementById('nl-personal-text')?.value.trim().length || 0;
        chips.push({ text: 'Personal Update ❤️', style: 'personal', removeId: 'nl-personal' });
        if (sel.includePhoto) chips.push({ text: `Photo · ${getPersonalPhotoWidthPercent()}%`, style: 'included', removeId: 'nl-include-photo' });
        if (sel.includeVideo) chips.push({ text: `Video · ${getPersonalVideoWidthPercent()}%`, style: 'included', removeId: 'nl-include-video' });
        if (len < NL_PERSONAL_UPDATE_MIN_CHARS) warnings.push(`Personal Update needs ${NL_PERSONAL_UPDATE_MIN_CHARS - len} more characters.`);
    }
    if (sel.includeBlog) chips.push({ text: 'Blog link', style: 'included', removeId: 'nl-include-blog' });
    const includeSig = document.getElementById('nl-include-signature')?.checked !== false;
    const includeSocial = document.getElementById('nl-include-social')?.checked !== false;
    if (includeSig) chips.push({ text: 'Signature block', style: 'included', removeId: 'nl-include-signature' });
    else chips.push({ text: 'Signature off', style: 'off' });
    if (includeSocial) chips.push({ text: 'Social links', style: 'included', removeId: 'nl-include-social' });
    else chips.push({ text: 'Social links off', style: 'off' });
    if (sel.includeReferral) chips.push({ text: 'Referral CTA (below signature)', style: 'included', removeId: 'nl-include-referral' });
    else chips.push({ text: 'Referral CTA off', style: 'off' });
    chips.push({ text: 'Disclaimer (very bottom)', style: 'meta' });
    chipsEl.innerHTML = chips.map((c) => buildPreflightChipHtml(c)).join('');
    if (warningsEl) {
        warningsEl.classList.toggle('hidden', !warnings.length);
        warningsEl.innerHTML = warnings.map((w) => `<li>${w}</li>`).join('');
    }
    const personalOk = !sel.personal || (document.getElementById('nl-personal-text')?.value.trim().length || 0) >= NL_PERSONAL_UPDATE_MIN_CHARS;
    if (badgeEl) {
        badgeEl.textContent = personalOk ? 'READY TO GENERATE' : 'REVIEW SETUP';
        badgeEl.className = personalOk
            ? 'inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[2px] text-[#00A89D] bg-[#00A89D]/15 px-2.5 py-1 rounded-full mb-2'
            : 'inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[2px] text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 rounded-full mb-2';
    }
}

function wireNewsletterLiveFeedback() {
    const root = document.getElementById('newsletter-generator');
    if (!root || root.dataset.nlLiveFeedbackWired === '1') return;
    root.dataset.nlLiveFeedbackWired = '1';
    const refresh = () => {
        updatePersonalCharMeter();
        updatePersonalMediaPreviews();
        updateCustomContentChoicesVisibility();
        updateNewsletterProfileStatus();
        updateNewsletterPreflightSummary();
        updateSpecificTopicsPlaceholder();
    };
    root.querySelectorAll('input, select, textarea').forEach((el) => {
        el.addEventListener('input', refresh);
        el.addEventListener('change', refresh);
    });
    const preflight = root.querySelector('#nl-preflight-summary');
    if (preflight && !preflight.dataset.nlRemoveWired) {
        preflight.dataset.nlRemoveWired = '1';
        preflight.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-nl-preflight-remove]');
            if (!btn) return;
            applyPreflightChipRemove(btn.getAttribute('data-nl-preflight-remove'));
            refresh();
        });
    }
    ['nl-personal-photo-size', 'nl-personal-video-size'].forEach((id) => {
        document.getElementById(id)?.addEventListener('input', refresh);
    });
    refresh();
}

function validateProfileForGeneration() {
    const ctx = getNewsletterProfileContext();
    if (ctx.name && ctx.email) return true;
    const missing = [];
    if (!ctx.name) missing.push('name');
    if (!ctx.email) missing.push('email');
    updateNewsletterProfileStatus();
    const msg = `Please add your ${missing.join(' and ')} in My Profile before generating — newsletters need them for your signature.`;
    if (typeof window.openUserProfile === 'function') {
        if (confirm(msg + '\n\nOpen My Profile now?')) window.openUserProfile();
    } else {
        window.notifyUser(msg, 'info', 3200);
    }
    return false;
}

function validatePersonalUpdateForGeneration() {
    if (!validateProfileForGeneration()) return false;
    const personalCb = document.getElementById('nl-personal');
    if (!personalCb?.checked) return true;
    const text = document.getElementById('nl-personal-text')?.value.trim() || '';
    if (text.length >= NL_PERSONAL_UPDATE_MIN_CHARS) return true;
    document.getElementById('nl-personal-text')?.focus();
    window.notifyUser(`Please write your Personal Update (${NL_PERSONAL_UPDATE_MIN_CHARS}+ characters) before generating.`, 'warning', 3200);
    return false;
}

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

    const savedSections = JSON.parse(localStorage.getItem('nl-sections') || '[]');
    document.querySelectorAll('#newsletter-generator input[type="checkbox"]').forEach(cb => {
        cb.checked = savedSections.includes(cb.id);
    });

    // Load used items and selections
    usedFunFacts = JSON.parse(localStorage.getItem('usedFunFacts') || '[]');
    usedProTips = JSON.parse(localStorage.getItem('usedProTips') || '[]');
    usedQuotes = JSON.parse(localStorage.getItem('usedQuotes') || '[]');

    selectedFunFact = funFacts.includes(selectedFunFact) ? selectedFunFact : getRandomItem(funFacts, usedFunFacts);
    selectedProTip = proTips.includes(selectedProTip) ? selectedProTip : getRandomItem(proTips, usedProTips);
    selectedQuote = motivationalQuotes.includes(selectedQuote) ? selectedQuote : getRandomItem(motivationalQuotes, usedQuotes);

    updatePreviews();

    // Ensure profile sync on this legacy load path too (for name/email/market etc)
    if (typeof syncNewsletterFromProfile === 'function') {
      setTimeout(() => { try { syncNewsletterFromProfile(true); } catch(e){} }, 60);
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
                             .map(c => c.id);
        localStorage.setItem('nl-sections', JSON.stringify(checked));

        // Visual toggles for expandable sections
        if (cb.id === 'nl-personal') {
            const fields = document.getElementById('personal-fields');
            if (fields) fields.classList.toggle('hidden', !cb.checked);
        }
        if (cb.id === 'nl-include-blog') {
            const fields = document.getElementById('blog-fields');
            if (fields) fields.classList.toggle('hidden', !cb.checked);
        }
        if (cb.id === 'nl-include-signature' || cb.id === 'nl-include-social') {
            updateBrandPreview();
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

    // Profile sync on this load path too
    if (typeof syncNewsletterFromProfile === 'function') {
      setTimeout(() => { try { syncNewsletterFromProfile(true); } catch(e){} }, 70);
    }
});

document.getElementById('generate-newsletter-btn')?.addEventListener('click', async () => {
    generateNewsletter('');
});

const REFERRAL_CTA_HEADLINE = 'Know Someone Thinking About Buying or Selling?';
const LEGACY_REFERRAL_CTA_HEADLINE = 'Know Someone Ready to Buy or Refinance?';

function htmlIncludesReferralCta(html) {
    return html.includes(REFERRAL_CTA_HEADLINE) || html.includes(LEGACY_REFERRAL_CTA_HEADLINE);
}

function insertBeforeReferralBlock(html, insertHtml) {
    const headlines = [REFERRAL_CTA_HEADLINE, LEGACY_REFERRAL_CTA_HEADLINE];
    for (const headline of headlines) {
        if (!html.includes(headline)) continue;
        const pattern = new RegExp('<tr>\\s*<td>\\s*<table[^>]*>[\\s\\S]*?' + headline.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?<\\/table>\\s*<\\/td>\\s*<\\/tr>', 'i');
        return html.replace(pattern, insertHtml + '$&');
    }
    return html;
}

function getAudienceGuidance(audience) {
    switch (audience) {
        case 'partners':
            return 'Write for referral partners (lenders, title, inspectors). Lead with local market intel, co-marketing ideas, and partnership gratitude. Keep the personal note professional-warm. Soft CTA: loop me in on clients who need a great agent.';
        case 'past':
            return 'Write for past clients. Lead with home care, neighborhood updates, and life-after-closing tips. Celebrate their milestone. Soft CTA: referrals and "thinking of moving again" conversations.';
        case 'sphere':
            return 'Write for sphere of influence (friends, family, community). More personal/local flavor, lighter real estate touch. Weave value naturally — not a sales pitch.';
        default:
            return 'Write for your full database — mix of buyers, sellers, past clients, and sphere. Balance market insight with approachable, non-salesy value.';
    }
}

document.getElementById('regenerate-with-edits-btn')?.addEventListener('click', async () => {
    const feedback = document.getElementById('nl-feedback')?.value.trim() || '';
    if (!feedback) {
        window.notifyUser('Please enter feedback or specific edits first!', 'warning', 3200);
        return;
    }
    if (!lastGeneratedHTML) {
        window.notifyUser('No previous newsletter to edit — generate one first!', 'warning', 3200);
        return;
    }
    generateNewsletter(feedback);
});

async function generateNewsletter(feedback = '') {
    if (!feedback && !validatePersonalUpdateForGeneration()) {
        return;
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
    const fullName = p.name || 'Your Agent';
    const firstName = fullName.split(' ')[0].trim();

    // === SAVE ORIGINAL LOADING CONTENT (after force so we capture the clean base card) ===
    const loadingEl = document.getElementById('global-loading');
    if (loadingEl) {
        loadingEl.dataset.originalContent = loadingEl.innerHTML;
    }

    // === INJECT RICH PROGRESS CONTENT — styled to exactly match the Weekly/Social/Blog loading cards ===
    const loadingTipsContent = `
        <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-3xl mx-4 border border-gray-200 dark:border-gray-700">
                
                <div class="text-center mb-8">
                    <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00A89D] mb-5"></div>
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

                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                    <h4 class="text-xl font-bold text-[#00A89D] mb-5 text-center">
                        Why Newsletters Are Pure Gold
                    </h4>
                    <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                        <div class="flex gap-3">
                            <i class="fas fa-broadcast-tower text-[#00A89D] mt-0.5"></i>
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
                        <p class="text-xs font-semibold text-[#00A89D] mb-2">Pro Tips for Maximum Impact:</p>
                        <ul class="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-5">
                            <li>Send consistently (weekly or monthly) — momentum compounds.</li>
                            <li>Keep it short &amp; scannable — bold headers, emojis, short paragraphs.</li>
                            <li>End with a soft CTA: "Know anyone thinking about buying or selling? I'm here to help!"</li>
                            <li>Use tools like Mailchimp/Constant Contact for pretty delivery &amp; tracking.</li>
                            <li>Personal updates are magic — share wins, family, hobbies to humanize yourself.</li>
                        </ul>
                    </div>
                </div>

                <p class="text-center text-xs text-gray-500 dark:text-gray-400 mt-5">
                    You got this — one newsletter at a time, you're building an unstoppable network! 🔥
                </p>
    `;

    if (loadingEl) {
        if (typeof window.ensureModalInViewport === 'function') {
            window.ensureModalInViewport(loadingEl);
        } else if (loadingEl.parentElement !== document.body) {
            document.body.appendChild(loadingEl);
        }
        loadingEl.innerHTML = loadingTipsContent;
        loadingEl.classList.remove('hidden');
        loadingEl.classList.add('flex', 'items-center', 'justify-center');
        loadingEl.style.setProperty('display', 'flex', 'important');
        loadingEl.style.setProperty('align-items', 'center', 'important');
        loadingEl.style.setProperty('justify-content', 'center', 'important');
        loadingEl.style.setProperty('z-index', '99999', 'important');
        loadingEl.style.setProperty('visibility', 'visible', 'important');
        loadingEl.style.setProperty('opacity', '1', 'important');
        loadingEl.style.setProperty('position', 'fixed', 'important');
        loadingEl.style.setProperty('top', '0', 'important');
        loadingEl.style.setProperty('left', '0', 'important');
        loadingEl.style.setProperty('right', '0', 'important');
        loadingEl.style.setProperty('bottom', '0', 'important');
        loadingEl.style.setProperty('margin', '0', 'important');
    }

    try {
        const selections = getNewsletterSelections();
        const includedLabels = Object.entries(NL_CONTENT_SECTIONS)
            .filter(([key]) => selections.contentSections[key])
            .map(([, cfg]) => cfg.label);
        const sectionsSummary = includedLabels.length ? includedLabels.join(', ') : '(no optional content sections selected)';

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
                '6. COMPLIANCE (NON-NEGOTIABLE): NEVER add, change, or include ANY mention of specific home loan rates, interest rates, APRs, or "current rates" anywhere in the document.',
                '',
                'PREVIOUS FULL NEWSLETTER HTML (use this as your base):',
                lastGeneratedHTML,
                '',
                'USER EDIT REQUEST (apply this intelligently):',
                feedback,
                '',
                'Output the complete updated HTML now.'
            ];
        } else {
            promptLines = [
                'You are a world-class email designer and compliance-focused real estate professional. ACCURACY and HONESTY are your HIGHEST priority — above creativity, engagement, or length.',
                '',
                '**CRITICAL TITLE RULE (very important):**',
                '- If the user provided a title in the Title field, use it exactly as written.',
                '- If the Title field is blank or only contains something generic like "Market Insights" or "Homeownership Insights", you MUST create a short, catchy, professional title in the style of "The Local Edge" or "Your 2026 Homeowner Playbook".',
                '- Titles should be real estate or local-market related, 4–7 words maximum, confident, and benefit-focused.',
                '- Create a unique title for every newsletter — never repeat the same title.',
                '- Good style examples: "The Local Edge", "Keys & Community", "Your Market Advantage", "Neighborhood Notes", "Home & Happenings", "The Listing Life", "Move With Confidence", "Local Market Pulse".',
                '',
                '**LANGUAGE RULE (important):**',
                '- Check the "Specific Topics" field (and any other instructions). If the user requests a different language there (e.g. "Prepare the full newsletter in Spanish", "Generate in French", "in German", "en español", "tout en français"), output the **entire newsletter HTML** (all sections, personal note, headlines, body text, etc.) fully in that requested language.',
                '- Translate naturally while keeping the exact required structure, teal accents, tables, placeholders, and compliance disclaimers.',
                '- If no language is requested, default to English.',
                '',
                '**ACCURACY RULES (NON-NEGOTIABLE):**',
                '- EVERY fact, statistic, trend, event, or claim MUST be 100% accurate and verifiable.',
                '- NEVER guess, hallucinate, or invent information. If uncertain, OMIT it or use safe evergreen phrasing.',
                '- Local Spotlight: Use ONLY fun, interesting, or little known facts about the area. NEVER dated events. Verify and confirm accuracy above all else.',
                '- Fun Facts: If the Fun Fact section is included, output ONLY the heading <h2>Fun Fact</h2> and an empty paragraph <p id="fun-fact-placeholder"></p>.',
                '- Pro Tip: If the Pro Tip section is included, output ONLY the heading <h2>Pro Tip</h2> and an empty paragraph <p id="pro-tip-placeholder"></p>.',
                '- Motivational Quote: If the Motivational Quote section is included, output ONLY the heading <h2>Motivational Quote</h2> and an empty paragraph <p id="quote-placeholder"></p>.',
                '- Prefer safe, educational, evergreen content.',
                '',
                buildNewsletterSectionsPrompt(selections),
                '',
                'User Inputs:',
                '- Audience: ' + (document.getElementById('nl-audience').value || 'Full Database'),
                '- Audience guidance: ' + getAudienceGuidance(document.getElementById('nl-audience')?.value || 'full'),
                '- Tone: ' + (document.getElementById('nl-tone').value || 'warm-professional') + ' — Write in this exact tone throughout the entire newsletter.',
                '- Match the full "AGENT PROFILE & VOICE CONTEXT" section below for overall tone — but the Personal Update must use ONLY what the user typed in the Personal Update field.',
                '- Location: ' + getNewsletterLocation(),
                '- Title: ' + (document.getElementById('nl-title').value || 'Local Market & Home Insights'),
                '- Length selection: ' + getNewsletterLengthConfig().displayLabel,
                '- Sections to generate: ' + sectionsSummary,
                '- Personal update: "' + personalUpdateText + '"',
                '- Personal photo URL: "' + personalPhotoUrl + '"',
                '- Personal video URL: "' + personalVideoUrl + '"',
                '- Specific topics / special requests (including any language requests such as "in Spanish" or "prepare the newsletter in French"): "' + (document.getElementById('nl-specific').value || 'None') + '"',
                '',
                ...buildNewsletterLengthPromptBlock(),
                '',
                'Branding (from profile):',
                '- Name: ' + (p.name || 'Your Agent'),
                '- Email: ' + (p.email || p.workEmail || ''),
                '- Company/Team Name: ' + (p.companyName || ''),
                '- Tagline: ' + (p.tagline || ''),
                '- Agent signature block in final HTML: ' + (document.getElementById('nl-include-signature')?.checked !== false ? 'YES (post-processing adds headshot/logo/contact — do NOT add your own signature)' : 'NO (content only — no signature block)'),
                '- Social media links in final HTML: ' + (document.getElementById('nl-include-social')?.checked !== false ? 'YES (post-processing adds links from profile)' : 'NO'),
                '',
                '- REQUIRED HERO IMAGE: ' + selectedHero,
                '',
                'AGENT PROFILE & VOICE CONTEXT (use this to make the whole newsletter — especially tone, personal note, local flavor, and any storytelling — feel like it was written by *this specific* agent. Blend personality/voice/hobbies/challenges naturally where it fits; do not force it):',
                '- Name: ' + (p.name || ''),
                '- Email: ' + (p.email || p.workEmail || ''),
                '- Personality / lifestyle: ' + (p.personality || ''),
                '- Voice traits: ' + ((p.voiceTraits && p.voiceTraits.length) ? p.voiceTraits.join(', ') : ''),
                '- Preferred tone: ' + (p.tone || document.getElementById('nl-tone').value || 'warm and professional'),
                '- Hobbies & passions (weave naturally for authenticity in personal note or relatable examples): ' + ((p.hobbies && p.hobbies.length) ? p.hobbies.join(', ') : (p.hobbiesOther || p['hobbies-other'] || '')),
                '- Key challenges they help clients with: ' + ((p.challenges && p.challenges.length) ? p.challenges.join(', ') : ''),
                '- Primary focus style: ' + (p.focus || ''),
                '- Years in business / team: ' + (p.years || '') + (p.team ? ' / ' + p.team : ''),
                '',
                '',
                'CRITICAL RULES:',
                (selections.contentSections.market
                    ? '- Market Updates section (ONLY if included): ALWAYS end with a "Sources" paragraph containing 1-2 HYPERLINKED credible sources. REQUIRED FORMAT: <p style="font-size:14px; color:#666; margin-top:20px;">Sources: <a href="https://www.nar.realtor/research-and-statistics" style="color:#00A89D; text-decoration:underline;" target="_blank" rel="noopener">NAR Research</a>, <a href="https://www.housingwire.com" style="color:#00A89D; text-decoration:underline;" target="_blank" rel="noopener">HousingWire</a></p>.'
                    : '- Market Updates is EXCLUDED — do not create a Market section or mention market trends.'),
                (selections.contentSections.industry
                    ? '- Industry News section (ONLY if included): ALWAYS include 1-2 HYPERLINKED sources in the same Sources paragraph format as Market Updates.'
                    : '- Industry News is EXCLUDED — do not create an Industry section.'),
                (selections.personal
                    ? '- PERSONAL UPDATE: Rewrite/polish ONLY the raw personal update input — warm, relatable, newsletter-perfect. Do NOT invent personal details not in the user input.'
                    : '- PERSONAL UPDATE: User did not check Personal Update — skip the entire personal note block.'),
                '- PERSONAL NOTE TITLE RULE (only when Personal Update is included): Title exactly "A Note From [Name]" using ONLY THE FIRST NAME from the Name field.',
                (selections.personal && (selections.includePhoto || selections.includeVideo)
                    ? '- PERSONAL MEDIA: Leave [PERSONAL PHOTO PLACEHOLDER] untouched when photo is enabled; leave <!-- PERSONAL VIDEO PLACEHOLDER --> untouched when video is enabled — we handle media in post-processing.'
                    : '- PERSONAL MEDIA: Do not include photo or video blocks.'),
                (selections.includeReferral
                    ? '- REFERRAL CTA: Do NOT include referral content in the newsletter body — we add a compact referral below the email signature in post-processing.'
                    : '- REFERRAL CTA: User excluded the referral section — do NOT include referral headings, buttons, or any "know someone" ask.'),
                '- ALL EXTERNAL LINKS: target="_blank" rel="noopener".',
                '- If a personal photo URL is provided, place the image BELOW the personal note text. Use a simple table wrapper with max-width around 590px and max-height around 480px so the photo scales down automatically while staying fully visible. Keep it clean and Outlook-friendly.',
                '- Compliance: Use the exact footer disclaimer provided below. NEVER quote specific rates anywhere.',
                '- COMPLIANCE (CRITICAL - NEVER BREAK): NEVER quote, mention, suggest, or imply ANY specific mortgage interest rates, APRs, or financing numbers in ANY section. Use only general language like "financing conditions have shifted recently" WITHOUT specific numbers. Never make guarantees about home values or sale prices. Violation = compliance risk.',
                '- EMAIL COMPATIBILITY (MANDATORY): Use ONLY inline styles. DO NOT include any <style> tags or class attributes. Use TABLE-BASED LAYOUTS for all structural elements. Avoid flexbox, gap, and box-shadow.',
                '- Main container: <table width="600" align="center"...> with background white.',
                '- Use consistent module spacing of 20px between sections. Main content tables should be width="600".',
                '- Sections: EACH section MUST be in its OWN nested table with background:#f9f9f9 and border-left:8px solid #00A89D to create distinct shaded card boxes with individual teal stripes. Add a spacer row <tr><td height="20"></td></tr> between sections for separation. NEVER merge sections into one cell.',
                '- For the Market Update / Market section ONLY: ALWAYS end with a "Sources" paragraph containing 1-2 HYPERLINKED credible sources. REQUIRED FORMAT (use exactly): <p style="font-size:14px; color:#666; margin-top:20px;">Sources: <a href="https://www.nar.realtor/research-and-statistics" style="color:#00A89D; text-decoration:underline;" target="_blank" rel="noopener">NAR Research</a>, <a href="https://www.housingwire.com" style="color:#00A89D; text-decoration:underline;" target="_blank" rel="noopener">HousingWire</a></p>. Use ONLY real, permanent URLs from trusted sites like NAR, HousingWire, Redfin Data Center, or local MLS/market reports. NEVER plain text names — links are mandatory.',
                '- For the Industry News / Industry Insights section ONLY: Same as above — ALWAYS include 1-2 HYPERLINKED sources in the exact format. Examples: <a href="https://www.nar.realtor/research-and-statistics" style="color:#00A89D; text-decoration:underline;" target="_blank" rel="noopener">NAR Research</a>, <a href="https://www.housingwire.com" style="color:#00A89D; text-decoration:underline;" target="_blank" rel="noopener">HousingWire</a>.',
                '- BLOG RULE (VERY IMPORTANT): DO NOT create any blog section yourself unless instructed in SECTION SELECTION. Leave <!-- BLOG SECTION PLACEHOLDER --> only when blog is included.',
                '',
                'OUTPUT ONLY complete standalone HTML. Follow the header exactly. Then generate ONLY the optional content sections listed in SECTION SELECTION — each as its own teal card. Do not invent extra sections. After included sections, append the skeleton placeholders/footer below. Leave untouched placeholders only for sections marked INCLUDE.',
                '',
'<!DOCTYPE html>',
    '<html lang="en">',
    '<head><meta charset="UTF-8"></head>',
    '<body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial, sans-serif;">',
    '    <tr><td style="padding:40px 20px; text-align:center; background:#f9f9f9;">',
    '      <table align="center" cellpadding="0" cellspacing="0" style="margin:0 auto;">',
    '        <tr>',
    '          <td align="center">',
    '            <!-- [YOUR LOGO / BRAND HEADER HERE] - Custom branding from your profile (company, logo, tagline) is injected automatically in post-processing. Do not hardcode any specific brokerage logo. -->',
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
                '    <!-- DISCLAIMER: added in post-processing after signature + referral — do NOT include a disclaimer row in the body -->',
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
            max_tokens: 12000
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
        
        window.notifyUser('Newsletter generation failed. No content created — please try again.', 'error', 5000);
        
        gtag('event', feedback ? 'edit_newsletter_failed' : 'generate_newsletter_failed', {
            event_category: 'Tool Usage',
            event_label: feedback ? 'Newsletter Edit Failed' : 'Newsletter Generation Failed',
            value: 1
        });

    } finally {
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
            // Core replacements (always safe)
            html = html.replace(/<p[^>]*id=["']?fun-fact-placeholder["']?[^>]*>[\s\S]*?<\/p>/gi, `<p>${selectedFunFact}</p>`);
            html = html.replace(/<p[^>]*id=["']?pro-tip-placeholder["']?[^>]*>[\s\S]*?<\/p>/gi, `<p>${selectedProTip}</p>`);
            html = html.replace(/<p[^>]*id=["']?quote-placeholder["']?[^>]*>[\s\S]*?<\/p>/gi, `<p><em>${selectedQuote}</em></p>`);
            const nlSelections = getNewsletterSelections();
            if (window.NlEntertainment && typeof window.NlEntertainment.injectIntoHtml === 'function') {
                html = window.NlEntertainment.injectIntoHtml(html, nlSelections);
            }
         
            // === ONLY RUN HEAVY INJECTION LOGIC ON FRESH GENERATION, NOT ON FEEDBACK EDITS ===
            // When editing with feedback, the model was explicitly told to return the COMPLETE modified full HTML.
            // Running the placeholder injections + section removals on an already-edited document was causing
            // large parts of the user's previous work to be stripped or overwritten.
            if (!feedback) {
                const postSelections = nlSelections;
                const includePhoto = postSelections.includePhoto;
                const includeVideo = postSelections.includeVideo;
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

                html = html.replace(/\[PERSONAL PHOTO PLACEHOLDER\]/gi, photoInsert);

// Blog injection - robust version using dedicated placeholder + fallbacks
const includeBlog = postSelections.includeBlog || false;
if (includeBlog) {
    // Remove any blog-like section the AI might have (defensively) created
    html = html.replace(/<tr>\s*<td>\s*<table[^>]*>\s*<tr>\s*<td[^>]*>\s*<h2[^>]*>(?:From the Blog|Blog Highlight|My Recent Blog|Recent Blog)[^<]*<\/h2>[\s\S]*?<\/table>\s*<\/td>\s*<\/tr>/gi, '');
    html = html.replace(/<tr><td height="20"><\/td><\/tr>\s*<tr>\s*<td>\s*<table[^>]*>\s*<tr>\s*<td[^>]*>\s*<h2[^>]*>(?:From the Blog|Blog Highlight|My Recent Blog)[^<]*<\/h2>[\s\S]*?<\/table>[\s\S]*?<\/tr>/gi, '');

    const blogUrl = (document.getElementById('nl-blog-url')?.value || '').trim();
    const blogTitle = (document.getElementById('nl-blog-title')?.value || '').trim() || 'Latest Blog Post';
    if (blogUrl && blogUrl.length > 3) {
        const fullBlogUrl = blogUrl.startsWith('http') ? blogUrl : 'https://' + blogUrl;
        const blogSection = `
            <tr>
                <td>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9; border-left:8px solid #00A89D; border-collapse:separate;">
                        <tr>
                            <td style="padding:30px;">
                                <h2 style="color:#002B5C; font-size:26px; margin:0 0 15px;">My Recent Blog</h2>
                                <p style="font-size:18px; font-weight:bold; margin-bottom:10px;">${blogTitle}</p>
                                <p style="margin-bottom:15px;">Discover the latest insights on buying, selling, and local market trends in this recent article.</p>
                                <a href="${fullBlogUrl}" target="_blank" rel="noopener" style="color:#00A89D; font-weight:bold; text-decoration:underline; display:inline-block;">Read full article →</a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr><td height="20"></td></tr>
        `;

        let injected = false;

        // 1. Preferred: explicit placeholder we put in the prompt structure
        if (html.includes('<!-- BLOG SECTION PLACEHOLDER -->')) {
            html = html.replace('<!-- BLOG SECTION PLACEHOLDER -->', blogSection);
            injected = true;
        }

        // 2. Fallback: the old spacer + comment pattern (handles older generations)
        if (!injected) {
            const spacerComment = /<tr><td height="20"><\/td><\/tr>\s*<!-- Personal Note Section -->/i;
            if (spacerComment.test(html)) {
                html = html.replace(spacerComment, '$&' + blogSection);
                injected = true;
            }
        }

        // 3. Last-resort fallback: insert right before the Personal Note table or its heading
        if (!injected) {
            const noteHeading = /(<tr><td[^>]*>\s*<table[^>]*>[\s\S]{0,80}?A Note From)/i;
            if (noteHeading.test(html)) {
                html = html.replace(noteHeading, blogSection + '$1');
                injected = true;
            }
        }

        // 4. Absolute last resort: shove it in before the footer/disclaimer area so it doesn't get lost
        if (!injected && !html.includes('My Recent Blog')) {
            html = html.replace(
                /(<tr><td style="padding:20px; background:#002B5C; color:white;)/i,
                blogSection + '\n<tr><td height="20"></td></tr>\n$1'
            );
        }
    }
}

// Clean up the placeholder if it wasn't used (e.g. user had the box unchecked or no URL)
html = html.replace(/<!--\s*BLOG SECTION PLACEHOLDER\s*-->/gi, '');

// === PERSONAL NOTE HEADLINE - Force ONLY first name when personal section is included ===
if (postSelections.personal) {
    html = html.replace(/A Note From \[Name\]/gi, `A Note From ${firstName}`);
    html = html.replace(/A Note From Adam/gi, `A Note From ${firstName}`);
    html = html.replace(/A Note from Adam/gi, `A Note From ${firstName}`);
    html = html.replace(/A Note From [^<]+/gi, `A Note From ${firstName}`);
}

// === PERSONAL VIDEO (after personal note, before footer) ===
if (includeVideo && personalVideoUrl) {
    html = injectPersonalVideoSection(html, personalVideoUrl);
} else {
    html = html.replace(/<!--\s*PERSONAL VIDEO PLACEHOLDER\s*-->/gi, '');
    html = html.replace(/<tr>\s*<td>\s*<table[^>]*>[\s\S]*?Personal Video Update[\s\S]*?<\/table>\s*<\/td>\s*<\/tr>/gi, '');
}

// Strip any referral blocks from the letter body — compact referral goes below signature
html = stripReferralFromBody(html);
html = html.replace(/\[Email\]/g, getNewsletterProfileContext().email || '');
html = html.replace(/\[Name\]/g, firstName);

html = applyUncheckedNewsletterSectionFilters(html, postSelections);
            } // end if (!feedback) — skip all the injection logic when the model already returned a full edited document

            if (!feedback) {
                html = stripReferralFromBody(html);
                try {
                    html = injectAgentBranding(html);
                } catch (e) { /* non-fatal */ }
                if (window.NlEntertainment && typeof window.NlEntertainment.injectTeaserAnswerAtEnd === 'function') {
                    html = window.NlEntertainment.injectTeaserAnswerAtEnd(html, getNewsletterSelections());
                }
            }

    // Normalize before saving the raw HTML (for downloads/copying)
    lastGeneratedHTML = normalizeRawNewsletterHTML(html);

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
            if (previewEl) {
                previewEl.innerHTML = '';
                const iframe = document.createElement('iframe');
                iframe.className = 'w-full h-screen min-h-[800px] border-0 rounded-2xl shadow-2xl bg-white';
                iframe.srcdoc = html;
                previewEl.appendChild(iframe);

                iframe.onload = () => {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

                    const funFactP = iframeDoc.querySelector('#fun-fact-placeholder');
                    if (funFactP) funFactP.innerHTML = selectedFunFact;

                    const proTipP = iframeDoc.querySelector('#pro-tip-placeholder');
                    if (proTipP) proTipP.innerHTML = selectedProTip;

                    const quoteP = iframeDoc.querySelector('#quote-placeholder');
                    if (quoteP) quoteP.innerHTML = `<em>${selectedQuote}</em>`;

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
        }

        const output = document.getElementById('newsletter-output');
        if (output) {
            output.classList.remove('hidden');
            output.scrollIntoView({ behavior: 'smooth' });
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
    window.notifyUser('Newsletter downloaded! Double-click the file to preview.', 'success', 3200);
}

function getCleanOutlookHTML() {
    const rawEl = document.getElementById('nl-html-raw');
    if (!rawEl || !rawEl.value) {
        return '';
    }

    let cleanHTML = rawEl.value;

    if (!/border-top:3px solid #00A89D/i.test(cleanHTML)) {
        try {
            cleanHTML = stripReferralFromBody(cleanHTML);
            cleanHTML = injectAgentBranding(cleanHTML);
        } catch (e) {}
    }

    // === BRAND COLOR NORMALIZATION for clean Outlook / vault copies ===
    // Replaces obnoxious orange (#00A89D) headers/buttons with professional navy (#002B5C)
    // so the saved-to-vault version (and what Copy for Outlook copies) has subdued, email-appropriate styling.
    // The full branded orange version is still available via raw download if desired.
    cleanHTML = cleanHTML.replace(/#00A89D/gi, '#002B5C');
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
            <td style="background:#f9f9f9; padding:0; text-align:center;">
                <img src="$1" alt="Hero Image" width="600" 
                     style="width:600px; max-width:600px; height:auto; display:block; border:0;">
            </td>
        </tr>
        <tr><td height="20"></td></tr>`
    );

    // === FORCE ALL TEAL CARDS (AI sections + injected blog + personal note + video + referral) TO IDENTICAL 600px WIDTH ===
    // This is the key for Outlook copy + vault viewer: without an outer constraining table in some renderers,
    // width="100%" cards can size differently. Forcing width="600" on the teal tables themselves
    // makes every section render at exactly the same width regardless of container (iframe, paste target, etc).
    // Raw/preview/download untouched (they keep the full skeleton + 100% inners which look correct inside the 600 wrapper).
    cleanHTML = cleanHTML.replace(
        /(<table\b[^>]*?border-left:\s*8px solid #00A89D[^>]*?)(width="100%"|width='100%')/gi,
        '$1width="600"'
    );
    // Add width=600 to any teal card table that lacks an explicit width attribute
    cleanHTML = cleanHTML.replace(
        /(<table\b(?![^>]*\bwidth=)[^>]*?border-left:\s*8px solid #00A89D[^>]*?)>/gi,
        '$1 width="600">'
    );
    // If the table has a style attribute, inject max-width + margin inside the style value (email clients vary on attr vs style)
    cleanHTML = cleanHTML.replace(
        /(<table[^>]*?border-left:\s*8px solid #00A89D[^>]*?style=")([^"]*)(")/gi,
        (m, pre, styleVal, post) => {
            let s = styleVal;
            if (!/max-width\s*:/i.test(s)) {
                s += (s.trim().endsWith(';') ? '' : ';') + ' max-width:600px; margin:0 auto';
            }
            return pre + s + post;
        }
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

    // === VIDEO: swap legacy sizes, then DE-CONSTRAIN the inner layout table IN PLACE (critical: do not unwrap) ===
    // The video teal card is forced to 600px + uniform 30px padding (earlier).
    // The inner layout table (the one wrapping title + green-bordered thumbnail + "Watch Video" button) originally had
    // max-width + margin:0 auto (plus align=center). That made the video area narrower than other cards.
    // PREVIOUS UNWRAP APPROACH (replacing the table with its raw <tr><td> contents) broke table nesting.
    // Bare rows injected into the padded <td> caused parsers (Outlook, vault iframe) to mis-nest, making the green
    // 3px border (on the thumbnail's own table) visually wrap around the button too, with lines coming down around it.
    // Raw HTML is fine because full proper nesting is preserved.
    //
    // FIX (cleaned only): 
    // - Keep the 560->100% swaps (lets the framed video breathe wider, consistent with card).
    // - Leave the layout *table and its rows* completely intact for valid HTML structure.
    // - Only strip the *constraining* max-width + margin:0 auto from *its style* so it fills the card's padded area.
    // - Strip align="center" from the layout table itself (so it doesn't narrow itself).
    // Result: the self-contained green-bordered thumbnail table only frames the picture. The button row follows it
    // cleanly *under* the video (in the next <tr> of the layout table), and centers via its own child <td align="center">.
    // This matches the raw HTML visual (button under the framed video, no border enclosing the button).
    cleanHTML = cleanHTML.replace(/max-width:\s*560px/gi, 'max-width:100%');
    cleanHTML = cleanHTML.replace(/width="560"/gi, 'width="100%"');
    cleanHTML = cleanHTML.replace(/max-width:\s*600px/gi, 'max-width:100%');

    // De-constrain only the video layout table's style (the one that contains "Personal Video Update" right after opening).
    // Matches tables having both max-width:100% and margin:0 auto after the swaps above. Teal cards use 600px so they are skipped.
    // Thumbnail's green border table has max-width:100% but no margin:0 auto, so it is left alone (good - we want its frame).
    cleanHTML = cleanHTML.replace(
      /(<table\b[^>]*?style=")([^"]*?max-width:\s*100%;?[^"]*?margin:\s*0\s*auto;?[^"]*)("[^>]*>)/gi,
      (m, pre, styleVal, post) => {
        let cleaned = styleVal
          .replace(/max-width:\s*100%;?/gi, '')
          .replace(/margin:\s*0\s*auto;?/gi, '')
          .replace(/;\s*;/g, ';')
          .trim();
        if (!cleaned) cleaned = 'width:100%';
        if (!/;$/.test(cleaned)) cleaned += ';';
        return pre + cleaned + post;
      }
    );

    // Remove align="center" from the video *layout wrapper table* only (targeted by proximity to the title text).
    // This lets the layout stretch full width of the padded card. Its child <td align="center"> elements (title, video frame container, button)
    // keep their align so the button centers nicely *under* the video.
    // The thumbnail bordered table and button wrapper keep their own align attributes (deeper in source, safe from this limited match).
    cleanHTML = cleanHTML.replace(
      /(<table\b[^>]*?)(align="center")([^>]*>[\s\S]{0,80}?<p[^>]*>Personal Video Update)/gi,
      '$1$3'
    );

    // === PERSONAL PHOTO FRAME (cleaned only) - tighten the teal border a bit ===
    // The frame around the personal photo (the "picture" that can appear above the video section) uses a teal bg + padding
    // to create a thin border. Raw keeps generation's 4px. Cleaned was using 3px; tighten to 2px to address the
    // "slightly thicker border" in Outlook/vault copies.
    cleanHTML = cleanHTML.replace(
        /<table[^>]*?style="[^"]*margin:\s*15px\s*0[^"]*max-width:\s*100%[^"]*"[^>]*>[\s\S]*?<img[^>]*?src="([^"]+)"[^>]*?alt="Personal photo"[\s\S]*?<\/table>/gi,
        `<table width="100%" cellpadding="0" cellspacing="0" style="margin:15px 0; max-width:100%;">
            <tr>
                <td style="padding:2px; background:#00A89D; border-radius:12px;">
                    <img src="$1" alt="Personal photo" width="100%" style="width:100%; max-width:540px; height:auto; display:block; border-radius:8px;">
                </td>
            </tr>
        </table>`
    );

    return cleanHTML;
}

function copyForOutlook() {
    const cleanHTML = getCleanOutlookHTML();
    if (!cleanHTML) {
        window.notifyUser('Generate the newsletter first!', 'warning', 3200);
        return;
    }

    const blob = new Blob([cleanHTML], { type: 'text/html' });
    const data = [new ClipboardItem({ 'text/html': blob })];

    navigator.clipboard.write(data).then(() => {
        window.notifyUser('✅ Outlook-optimized HTML copied!\n\nPaste into a NEW email in Outlook.', 'success', 3200);
    }).catch(err => {
        console.error(err);
        window.notifyUser('Clipboard issue — try the regular Copy HTML button instead.', 'error', 5000);
    });
}

  // =====================================================
  // PUBLIC API EXPOSURE (for onclick handlers and cross-feature calls)
  // =====================================================
  window.generateNewsletter = generateNewsletter;
  window.downloadNewsletterHTML = downloadNewsletterHTML;
  window.copyForOutlook = copyForOutlook;
  window.getCleanOutlookHTML = getCleanOutlookHTML;

  // Centralized save for newsletter that ALWAYS uses the exact same cleaned Outlook version
  // as what copyForOutlook() would copy to clipboard. This ensures "Save to Vault" never
  // has the orange headers that the raw/preview might.
  window.saveNewsletterToVault = function() {
    if (typeof window.toggleSaveIdea !== 'function') {
      window.notifyUser('Saved Items system not ready yet. Please try again in a moment.', 'success', 3200);
      return;
    }
    const clean = getCleanOutlookHTML();
    if (!clean) {
      window.notifyUser('Generate the newsletter first!', 'warning', 3200);
      return;
    }
    const baseTitle = (document.getElementById('nl-title') && document.getElementById('nl-title').value) || 'My Newsletter';
    // Append timestamp so user can save multiple versions / batches without overwriting previous ones
    const title = baseTitle + ' — ' + new Date().toISOString().slice(0, 16).replace('T', ' ');
    window.toggleSaveIdea(title, clean, null, 'newsletter');
    if (window.showToast) {
      window.showToast('Newsletter (Outlook version) saved to My Saved Items!', 'success');
    } else {
      window.notifyUser('Newsletter (Outlook version) saved to My Saved Items!', 'success', 3200);
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
      const rawEl = document.getElementById('nl-html-raw');
      const previewEl = document.getElementById('nl-preview');
      const outEl = document.getElementById('newsletter-output');
      if (rawEl) rawEl.value = last;
      if (previewEl) {
        previewEl.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.className = 'w-full h-screen min-h-[800px] border-0 rounded-2xl shadow-2xl bg-white';
        iframe.srcdoc = last;
        previewEl.appendChild(iframe);
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
  window.fillPersonalFromProfile = fillPersonalFromProfile;

  // These helpers are called from HTML onclick in the newsletter section
  if (typeof resetUsed === 'function') window.resetUsed = resetUsed;
  if (typeof updatePreviews === 'function') window.updatePreviews = updatePreviews;
  // Expose both the generic name (for back-compat) and a dedicated stable name for the custom content choice modals
  // so later inline scripts that redefine window.openModal / closeModal do not break "Choose Specific"
  if (typeof openModal === 'function') {
    window.openNewsletterChoiceModal = openModal;
  }
  if (typeof closeModal === 'function') window.closeNewsletterChoiceModal = closeModal;
  if (typeof regenerateRandom === 'function') window.regenerateRandom = regenerateRandom;

  // Tiny helper for the inline onclicks in the custom content <details> (survives clobbering of openModal)
  window._nlOpenChoice = function (cat) {
    if (window.openNewsletterChoiceModal) return window.openNewsletterChoiceModal(cat);
    if (window.openModal) return window.openModal(cat);
    if (typeof openModal === 'function') return openModal(cat);
  };

  // =====================================================
  // RELIABLE NEWSLETTER SECTION BORDER NORMALIZATION
  // Fixes the occasional left teal line misalignment
  // =====================================================

  function normalizeRawNewsletterHTML(htmlString) {
      if (!htmlString) return htmlString;

      // Force every section table with the teal left border to have identical inner padding
      return htmlString.replace(
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

      const tables = doc.querySelectorAll('table[style*="border-left:8px solid #00A89D"], table[style*="border-left: 8px solid #00A89D"]');

      tables.forEach(table => {
          // Force consistent border and collapse
          table.style.borderLeft = '8px solid #00A89D';
          table.style.borderCollapse = 'separate';

          // Find the first content cell and force identical padding
          const firstTd = table.querySelector('td');
          if (firstTd) {
              firstTd.style.padding = '30px 30px 30px 30px';
              firstTd.style.boxSizing = 'border-box';
          }
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

  function syncNewsletterFromProfile(silent) {
    try {
      const p = getCentralProfile();
      const overwrite = silent !== true;

      const blogUrlEl = document.getElementById('nl-blog-url');
      const profileBlog = (p.blogPageUrl || p.blogUrl || '').trim();
      if (blogUrlEl && profileBlog && (overwrite || !blogUrlEl.value.trim())) {
        blogUrlEl.value = profileBlog;
      }

      updateNewsletterProfileStatus();
      try { updateNewsletterPreflightSummary(); } catch (e) {}

      if (!silent && typeof window.showToast === 'function') {
        window.showToast('Profile details refreshed for this newsletter', 'success');
      }
    } catch (e) {
      console.warn('[newsletter] profile sync failed', e);
    }
  }

  function fillPersonalFromProfile(silent = false) {
    const personalCb = document.getElementById('nl-personal');
    const personalFields = document.getElementById('personal-fields');
    if (personalCb) {
      personalCb.checked = true;
    }
    if (personalFields) {
      personalFields.classList.remove('hidden');
    }
    const p = getCentralProfile();
    const textEl = document.getElementById('nl-personal-text');
    if (!textEl) return;

    // Robust normalizer: profile stores arrays for hobbies/challenges/activities but older data or merges may be strings
    const safeList = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val.filter(Boolean);
      if (typeof val === 'string') return val.split(/[,/&]+/).map(s => s.trim()).filter(Boolean);
      return [String(val)];
    };
    const safeText = (val) => {
      if (!val) return '';
      if (Array.isArray(val)) return val.filter(Boolean).join(', ');
      return String(val);
    };

    let parts = [];
    if (p.name) parts.push(`Hi, it's ${p.name.split(' ')[0]}!`);

    const hobbies = safeList(p.hobbies);
    if (hobbies.length) {
      parts.push(`Lately I've been enjoying ${hobbies.slice(0, 2).join(' and ')}.`);
    }

    if (p.personality) {
      const pers = String(p.personality).trim();
      if (pers) parts.push(`As someone who's ${pers.toLowerCase()}, I'm always looking for ways to help families like yours.`);
    }

    const goals = safeText(p.goals).trim();
    if (goals) parts.push(goals);

    const challenges = safeList(p.challenges);
    if (challenges.length) {
      parts.push(`Helping with things like ${challenges.join(', ').toLowerCase()}.`);
    } else if (p.challenges && typeof p.challenges === 'string') {
      const ch = p.challenges.trim();
      if (ch) parts.push(`Helping with things like ${ch.toLowerCase()}.`);
    }

    const fill = parts.join(' ') || 'Excited to help more families find the right home — or sell for top dollar — this year!';
    textEl.value = fill;
    if (!silent) {
      textEl.focus();
      textEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // No toast for auto-fill — keeps UI clean
    }
  }

  window.fillPersonalFromProfile = fillPersonalFromProfile;

  function initNewsletterGenerator() {
    // The original DOMContentLoaded blocks and auto-save listeners are included
    // in the code above. They will run when this module executes.

    try { wireNewsletterLiveFeedback(); } catch (e) {}
    try { wireCustomContentJumpControls(); } catch (e) {}

    setTimeout(() => {
      try { syncNewsletterFromProfile(true); } catch (e) {
        try { updateNewsletterProfileStatus(); } catch (e2) {}
      }
    }, 50);

    const sigCb = document.getElementById('nl-include-signature');
    const socialCb = document.getElementById('nl-include-social');
    if (sigCb && socialCb) {
      sigCb.addEventListener('change', updateBrandPreview);
      socialCb.addEventListener('change', updateBrandPreview);
    }

    // Ensure conditional fields (personal / blog) show/hide work
    setTimeout(() => {
      const personalCb = document.getElementById('nl-personal');
      const personalFields = document.getElementById('personal-fields');
      if (personalCb && personalFields) {
        const togglePersonal = () => {
          personalFields.classList.toggle('hidden', !personalCb.checked);
          try {
            updatePersonalCharMeter();
            updatePersonalMediaPreviews();
            updateNewsletterPreflightSummary();
          } catch (e) {}
        };
        personalCb.addEventListener('change', togglePersonal);
        togglePersonal();
      }
      ['nl-include-photo', 'nl-include-video'].forEach((id) => {
        const el = document.getElementById(id);
        if (!el || el.dataset.nlMediaToggleWired) return;
        el.dataset.nlMediaToggleWired = '1';
        el.addEventListener('change', () => {
          try { updatePersonalMediaPreviews(); } catch (e) {}
        });
      });
      const blogCb = document.getElementById('nl-include-blog');
      const blogFields = document.getElementById('blog-fields');
      if (blogCb && blogFields) {
        const toggleBlog = () => blogFields.classList.toggle('hidden', !blogCb.checked);
        blogCb.addEventListener('change', toggleBlog);
        toggleBlog();
      }
    }, 80);

    // Restore last generated newsletter (raw + visual preview) so the previous version is present after refresh
    // until the user Clears or generates a replacement.
    if (typeof restoreLastNewsletter === 'function') {
      try { restoreLastNewsletter(); } catch (e) {}
    }

    if (window.NlEntertainment && typeof window.NlEntertainment.wireUI === 'function') {
      try { window.NlEntertainment.wireUI(); } catch (e) { console.warn('[newsletter] NlEntertainment wireUI', e); }
    }

    document.querySelectorAll('.nl-choice-btn[data-nl-choice]').forEach((btn) => {
      if (btn._nlChoiceWired) return;
      btn._nlChoiceWired = true;
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-nl-choice');
        if (cat && typeof openModal === 'function') openModal(cat);
      });
    });

    try {
      updateSpecificTopicsPlaceholder();
      updateCustomContentChoicesVisibility();
    } catch (e) {}

    console.log('%c[newsletter-generator.js] Newsletter Generator initialized', 'color:#00A89D');
  }

  window.syncNewsletterFromProfile = syncNewsletterFromProfile;
  window.updateNewsletterProfileStatus = updateNewsletterProfileStatus;
  window.updateCustomContentChoicesVisibility = updateCustomContentChoicesVisibility;
  window.scrollToNewsletterCustomContent = scrollToNewsletterCustomContent;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNewsletterGenerator);
  } else {
    initNewsletterGenerator();
  }

})();
